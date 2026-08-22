import { TUNABLES, decayRateFromHalfLife } from './tunables.ts'
import {
  calcAlcanceDecayRate,
  calcCalidad,
  calcConversion,
  calcIngresosDirectos,
  calcProduccion,
  calcRecuperacionFatiga,
  calcResidualTotal,
  clamp01,
} from './formulas.ts'
import { houseLivingCost, type GameState } from './state.ts'
import { CHAT_BUFFER, chatStep } from './chat.ts'
import { CONTENT_POR_ID, FORMATO_INICIAL } from '../content/contentTypes.ts'
import { muestrear } from './historial.ts'
import { avanzarCiclo, puedeAvanzar } from './cycles.ts'
import { avanzarSemana, multEvento, sortearEvento } from './bigEvents.ts'
import { aplicarRecuperacion, avanzarDescanso, entrarEnBurnout } from './descanso.ts'
import {
  SEMANAS_ENTRE_EVENTOS,
  caducarModificadores,
  multModificadores,
  sortear,
} from './lifeEvents.ts'
import { clipMultiplier, clipStep } from './clip.ts'

/**
 * Un paso de simulacion.
 *
 * PURO y DETERMINISTA: mismo estado + mismo dt => mismo resultado, siempre.
 * No lee el reloj, no usa Math.random, no toca el DOM. De eso depende que el
 * banco de balance pueda jugar 2 horas en un segundo y que un bug se pueda
 * reproducir desde una semilla.
 */
export function step(state: GameState, dtMs: number): GameState {
  const dt = (dtMs / 1000) * TUNABLES.gameSpeed
  if (dt <= 0) return state

  // Con una tarjeta de vida en pantalla la partida se detiene: el tiempo que
  // el jugador dedica a leer no debe consumir su partida.
  if (state.eventoPendiente) return state

  const alloc = state.allocation
  // El formato decide en que se convierte el trabajo. Si el guardado trae uno
  // que ya no existe, se cae al de arranque en vez de romper la partida.
  const formato = CONTENT_POR_ID.get(state.formato) ?? CONTENT_POR_ID.get(FORMATO_INICIAL)
  if (!formato) throw new Error('Falta el formato de arranque en el catalogo')

  /**
   * Horas que el formato aprovecha de verdad.
   *
   * Una charla convierte tiempo de comunidad, un directo convierte tiempo de
   * produccion, cocinar convierte tiempo de vida. Por eso cambiar de formato
   * sin cambiar de reparto ya cambia el resultado: estas usando otras horas.
   */
  const horasDelFormato = alloc[formato.actividad]

  // --- Modificadores temporales de las tarjetas de vida -------------------
  const modificadores = caducarModificadores(state.modificadores, state.week)
  const mods = multModificadores(modificadores)
  // Un evento extraordinario en curso reescribe las reglas mientras dura.
  const ev = multEvento(state.evento)
  // Parado no se produce: ni vacaciones ni burnout generan alcance.
  const parado = state.descanso !== null

  // --- Calidad (derivada) -------------------------------------------------
  const calidad = calcCalidad(state.vida, state.fatiga, state.multCalidad * mods.calidad)

  // --- Momento clippeable -------------------------------------------------
  const clipRes = clipStep(state.clip, state.rng, dtMs * TUNABLES.gameSpeed)

  // --- Alcance ------------------------------------------------------------
  const produccion = calcProduccion(
    horasDelFormato,
    calidad * formato.calidad,
    state.multEficiencia * state.legadoEficiencia * mods.eficiencia,
    state.hype,
    clipMultiplier(state.clip),
  )
  const ganancia = parado
    ? 0
    : produccion *
      state.multAlcance *
      mods.alcance *
      formato.alcance *
      ev.alcance *
      ALCANCE_POR_PRODUCCION
  const decay = calcAlcanceDecayRate(state.comunidad, state.legadoRetencion)
  const alcance = Math.max(0, state.alcance + (ganancia - state.alcance * decay) * dt)

  // --- Comunidad ----------------------------------------------------------
  // Afinidad base baja: producir por producir apenas fideliza. Lo que fideliza
  // es el tiempo dedicado explicitamente a la comunidad.
  // La afinidad del formato es lo que separa crecer de fidelizar: un juego
  // popular trae gente que se va, una charla trae poca que se queda.
  const conversion = calcConversion(
    state.alcance,
    calidad,
    AFINIDAD_BASE * formato.afinidad * ev.afinidad,
    alloc.comunidad,
    state.comunidad,
  )
  const comunidadDecay = decayRateFromHalfLife(TUNABLES.comunidad.halfLifeSeconds) / state.legadoRetencion
  const comunidad = Math.max(0, state.comunidad + (conversion - state.comunidad * comunidadDecay) * dt)

  // --- Vida y fatiga ------------------------------------------------------
  const vidaDelta =
    alloc.vida * TUNABLES.vida.recoveryPerSecondAtFullRest +
    alloc.descanso * TUNABLES.vida.recoveryPerSecondAtFullRest -
    alloc.produccion * TUNABLES.vida.drainPerSecondAtFullProduction
  let vida = clamp01(state.vida + vidaDelta * dt)

  // Los formatos ligeros cansan menos: cocinar en directo no es lo mismo que
  // ocho horas de un shooter competitivo.
  const fatigaDelta =
    alloc.produccion * TUNABLES.fatiga.gainPerSecondAtFullProduction * formato.coste * ev.fatiga -
    calcRecuperacionFatiga(state.vida, alloc.descanso + alloc.vida * 0.5)
  let fatiga = clamp01(state.fatiga + fatigaDelta * dt)

  if (state.descanso) {
    const r = aplicarRecuperacion({ vida, fatiga }, state.descanso.tipo, dt)
    vida = r.vida
    fatiga = r.fatiga
  }

  // --- Hype ---------------------------------------------------------------
  const hypeDecay = decayRateFromHalfLife(TUNABLES.hype.halfLifeSeconds)
  const hype = Math.max(0, state.hype - state.hype * hypeDecay * dt)

  // --- Ideas --------------------------------------------------------------
  const ideas =
    state.ideas +
    (alloc.vida + alloc.descanso * 0.5) * TUNABLES.ideas.perSecondAtFullLife * clamp01(state.vida) * dt

  // --- Economia -----------------------------------------------------------
  // El directo solidario no se emite en el canal propio: no genera ingresos.
  const factorIngresos = (formato.ingresos ?? 1) * ev.ingresos
  const ingresosPorSegundo =
    calcIngresosDirectos(alcance, comunidad) * factorIngresos + calcResidualTotal(state)
  const costeVidaPorSegundo = houseLivingCost(state.houseStage) / TUNABLES.secondsPerWeek
  const rendimientoAhorros =
    (state.ahorros * TUNABLES.economia.savingsYield) / (52 * TUNABLES.secondsPerWeek)
  const ahorros = state.ahorros + (ingresosPorSegundo + rendimientoAhorros - costeVidaPorSegundo) * dt

  // --- Chat ---------------------------------------------------------------
  // El ritmo lo marca el alcance; las suscripciones, la comunidad.
  const chat = chatStep(
    clipRes.rng,
    { alcance, comunidad, calidad, fatiga, hype },
    dt,
    state.chatAcc,
    state.chatNextId,
  )
  const mensajes =
    chat.mensajes.length > 0
      ? [...state.chat, ...chat.mensajes].slice(-CHAT_BUFFER)
      : state.chat

  // --- Paso de semana -----------------------------------------------------
  // Los eventos extraordinarios y el descanso se cuentan por semanas, no por
  // ticks: solo hay que tocarlos cuando el calendario pasa de pagina.
  const semanaPrevia = state.week
  const semanaNueva = Math.floor(
    (state.elapsedMs + dtMs * TUNABLES.gameSpeed) / 1000 / TUNABLES.secondsPerWeek,
  )
  const cambiaSemana = semanaNueva > semanaPrevia

  let evento = state.evento
  let ultimoBigEvent = state.ultimoBigEvent
  let descanso = state.descanso
  let eventosExtraordinarios = state.eventosExtraordinarios
  let comunidadFinal = comunidad
  let hypeFinal = hype
  let modsFinal = modificadores
  let vacacionesCompletadas = state.vacacionesCompletadas
  let allocFinal = state.allocation
  let repartoAntesDeParar = state.repartoAntesDeParar
  let burnouts = state.burnouts
  let legadoEficiencia = state.legadoEficiencia
  let legadoRetencion = state.legadoRetencion
  let rngSemana = chat.rng

  if (cambiaSemana) {
    // Fin del descanso: aqui es donde la vuelta de vacaciones da su bonus.
    if (descanso) {
      const fin = avanzarDescanso({
        ...state,
        week: semanaNueva,
        comunidad: comunidadFinal,
        hype: hypeFinal,
        modificadores: modsFinal,
      })
      descanso = fin.state.descanso
      hypeFinal = fin.state.hype
      modsFinal = fin.state.modificadores
      vacacionesCompletadas = fin.state.vacacionesCompletadas
      // Volver de vacaciones consolida Legado, y eso toca comunidad y
      // multiplicadores permanentes: hay que leerlos de vuelta o el calculo
      // se hace y se tira.
      comunidadFinal = fin.state.comunidad
      legadoEficiencia = fin.state.legadoEficiencia
      legadoRetencion = fin.state.legadoRetencion
      if (fin.terminado) {
        // Al volver se recupera el reparto que habia antes de parar.
        allocFinal = repartoAntesDeParar ?? allocFinal
        repartoAntesDeParar = null
      }
    } else {
      const avance = avanzarSemana(evento, semanaNueva, ultimoBigEvent)
      evento = avance.evento
      ultimoBigEvent = avance.ultimoBigEvent
      if (avance.completado) eventosExtraordinarios += 1

      if (!evento) {
        // Ojo con el `evento: null`: sin el, este objeto arrastra el evento
        // viejo de `state` y sortearEvento —que devuelve el que ya hay— lo
        // resucitaba cada semana. La conferencia se completaba una y otra vez
        // sin terminar nunca.
        const sorteo = sortearEvento(
          { ...state, week: semanaNueva, ultimoBigEvent, evento: null },
          rngSemana,
        )
        rngSemana = sorteo.rng
        evento = sorteo.evento
      }
    }
  }

  /**
   * Burnout.
   *
   * Es la consecuencia que faltaba desde el primer dia: sin ella la fatiga
   * podia clavarse en 1.0 para siempre y la partida entraba en un pozo del
   * que no salia. Cuesta semanas y comunidad, pero NUNCA termina la partida.
   */
  if (!descanso && fatiga >= TUNABLES.fatiga.burnoutThreshold) {
    const forzado = entrarEnBurnout({
      ...state,
      comunidad: comunidadFinal,
      burnouts,
    })
    descanso = forzado.descanso
    comunidadFinal = forzado.comunidad
    burnouts = forzado.burnouts
    repartoAntesDeParar = repartoAntesDeParar ?? state.allocation
    allocFinal = forzado.allocation
  }

  // --- Tarjeta de vida ----------------------------------------------------
  // Se sortea al cumplirse el intervalo. La partida se detendra en el
  // siguiente tick, cuando eventoPendiente deje de ser null.
  let rngFinal = rngSemana
  let eventoPendiente = state.eventoPendiente
  let ultimoEventoSemana = state.ultimoEventoSemana
  const semanaActual = Math.floor((state.elapsedMs + dtMs * TUNABLES.gameSpeed) / 1000 / TUNABLES.secondsPerWeek)

  if (!eventoPendiente && semanaActual - ultimoEventoSemana >= SEMANAS_ENTRE_EVENTOS) {
    const sorteo = sortear({ ...state, week: semanaActual }, rngFinal)
    rngFinal = sorteo.rng
    if (sorteo.evento) {
      eventoPendiente = sorteo.evento.id
      ultimoEventoSemana = semanaActual
    }
  }

  // --- Historial ----------------------------------------------------------
  const historial = muestrear(state.historial, alcance, comunidad, dt)

  // --- Reloj --------------------------------------------------------------
  const elapsedMs = state.elapsedMs + dtMs * TUNABLES.gameSpeed
  const week = Math.floor(elapsedMs / 1000 / TUNABLES.secondsPerWeek)

  const siguiente: GameState = {
    ...state,
    rng: rngFinal,
    clip: clipRes.clip,
    evento,
    ultimoBigEvent,
    descanso,
    repartoAntesDeParar,
    allocation: allocFinal,
    eventosExtraordinarios,
    vacacionesCompletadas,
    burnouts,
    legadoEficiencia,
    legadoRetencion,
    modificadores: modsFinal,
    eventoPendiente,
    ultimoEventoSemana,
    historial,
    chat: mensajes,
    chatNextId: chat.nextId,
    chatAcc: chat.acc,
    elapsedMs,
    week,
    alcance,
    comunidad: comunidadFinal,
    calidad,
    vida,
    fatiga,
    hype: hypeFinal,
    ideas,
    ahorros,
    ingresosPorSegundo,
  }

  // El avance de ciclo es automatico: cuando has llegado, has llegado. No es
  // una prueba que se pueda fallar, es un termometro de la carrera.
  return puedeAvanzar(siguiente) ? avanzarCiclo(siguiente) : siguiente
}

/**
 * Cuanto alcance genera una unidad de produccion efectiva. Vive aqui y no en
 * tunables porque es un factor de conversion de unidades, no una palanca de
 * dificultad: la dificultad se ajusta con multAlcance y gameSpeed.
 */
const ALCANCE_POR_PRODUCCION = 120

/** Afinidad de fidelizacion antes de aplicar el multiplicador del formato. */
const AFINIDAD_BASE = 0.15

/** Cambia el formato de contenido que se esta produciendo. */
export function cambiarFormato(state: GameState, id: string): GameState {
  if (!CONTENT_POR_ID.has(id) || state.formato === id) return state
  return { ...state, formato: id }
}

/**
 * Publicar: pico instantaneo de alcance, hype, y una entrada permanente en el
 * catalogo. El peso de esa entrada es la calidad con la que se publico, que
 * es lo que determina la altura de su cola larga anos despues.
 */
export function publicar(state: GameState): GameState {
  const formato = CONTENT_POR_ID.get(state.formato) ?? CONTENT_POR_ID.get(FORMATO_INICIAL)
  // El peso que entra al catalogo es la calidad CON la que se publico: es lo
  // que determina la altura de su cola larga dentro de tres anos.
  const calidadPublicacion = state.calidad * (formato?.calidad ?? 1)
  const pico = 40 * calidadPublicacion * state.multAlcance * (formato?.alcance ?? 1) * (1 + state.hype)
  const hype = Math.min(TUNABLES.hype.max, state.hype + TUNABLES.hype.perPublish)

  const catalogo = [...state.catalogo]
  const last = catalogo[catalogo.length - 1]
  if (last && last.week === state.week) {
    catalogo[catalogo.length - 1] = {
      week: last.week,
      weight: last.weight + calidadPublicacion,
    }
  } else {
    catalogo.push({ week: state.week, weight: calidadPublicacion })
  }

  return {
    ...state,
    alcance: state.alcance + pico,
    hype,
    catalogo,
    publicacionesTotales: state.publicacionesTotales + 1,
  }
}
