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
  factorAfinidad,
} from './formulas.ts'
import { houseLivingCost, type GameState } from './state.ts'
import { CHAT_BUFFER, chatStep } from './chat.ts'
import { CONTENT_POR_ID, FORMATO_INICIAL } from '../content/contentTypes.ts'
import { muestrear } from './historial.ts'
import { avanzarCiclo, puedeAvanzar } from './cycles.ts'
import { actualizarUmbral } from './final.ts'
import { avanzarSemana, multEvento, sortearEvento } from './bigEvents.ts'
import { aplicarRecuperacion, avanzarDescanso, entrarEnBurnout } from './descanso.ts'
import {
  SEMANAS_ENTRE_EVENTOS,
  caducarModificadores,
  multModificadores,
  sortear,
} from './lifeEvents.ts'
import { clipMultiplier, clipStep } from './clip.ts'
import {
  avanzarContratos,
  caducarOfertas,
  credibilidadPorSegundo,
  fatigaPorSegundo,
  estallarModas,
  formatoTrasContratos,
  pagoPorSegundo,
  sortearOferta,
} from './patrocinios.ts'
import {
  allocationDelBloque,
  allocationDelPlan,
  cursorDeSemana,
  planAutomatico,
  type BloqueId,
  type Semana,
} from './semana.ts'
import { avanzarLectura, bonosDeColeccion } from './lectura.ts'
import {
  acumularMaterial,
  costeMaterial,
  hayMaterial,
  materialPorSegundo,
  nivel as nivelEdicion,
  type NivelEdicion,
} from './publicacion.ts'

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

  // La entrada de un ciclo nuevo detiene la partida por la misma razon: es
  // texto que se lee, no tiempo que se vive.
  if (state.avisoCiclo !== null) return state

  // El titular de una moda que estalla se lee igual que la entrada de un
  // ciclo, y por la misma razon se detiene el reloj mientras se lee.
  if (state.resacaPendiente !== null) return state

  // La partida terminada no sigue simulando por detras.
  if (state.final) return state

  // Planificar es una pausa. Mientras la semana no este lanzada, el reloj no
  // corre: el tiempo es un presupuesto que se gasta, no un rio que pasa.
  if (state.semana.fase !== 'viviendo') return state

  /**
   * El reparto del bloque en curso: TODO su tiempo en una sola actividad.
   *
   * `state.allocation` sigue siendo la lectura de semana completa —la que
   * miran el retiro y los paneles—; aqui hace falta la de ahora mismo. Como
   * casi todo el tick es lineal en el reparto, integrar one-hots a lo largo de
   * la semana da los mismos totales que usar la fraccion promedio.
   */
  const cursor = cursorDeSemana(state.elapsedMs)
  const bloque = bloqueEfectivo(state, cursor)
  const alloc = allocationDelBloque(bloque)
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
  // Lo leido deja poso: bonos pequeños y permanentes que se suman a los demas
  // multiplicadores en vez de ser un sistema aparte.
  const libros = bonosDeColeccion(state.lectura.leidos)
  // Parado no se produce: ni vacaciones ni burnout generan alcance.
  const parado = state.descanso !== null

  /**
   * Se esta emitiendo AHORA MISMO.
   *
   * Hasta F7 el canal estaba siempre en directo y el badge era decorativo.
   * Ahora emitir es una franja concreta de la semana, que ademas se puede
   * cortar o encender a mano. Solo en directo entran visitas, se mueve el
   * chat, pagan los anuncios y aparecen momentos que clipear.
   */
  const emitiendo = bloque === 'emitir' && !parado

  // --- Calidad (derivada) -------------------------------------------------
  const calidad = calcCalidad(
    state.vida,
    state.fatiga,
    state.multCalidad * mods.calidad * libros.calidad,
  )

  // --- Momento clippeable -------------------------------------------------
  // Fuera de directo no hay nada que clipear: el momento clippeable es un
  // momento DEL directo. El bonus tampoco se guarda de una emision a otra.
  const clipRes = emitiendo
    ? clipStep(state.clip, state.rng, dtMs * TUNABLES.gameSpeed)
    : { clip: apagarClip(state.clip), rng: state.rng }

  // --- Alcance ------------------------------------------------------------
  const produccion = calcProduccion(
    horasDelFormato,
    calidad * formato.calidad,
    state.multEficiencia * state.legadoEficiencia * mods.eficiencia * libros.eficiencia,
    state.hype,
    clipMultiplier(state.clip),
  )
  // Editar no trae a nadie. Es la contrapartida de que deje material.
  const ganancia = !emitiendo
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
  // La credibilidad entra por la AFINIDAD y no por el alcance: a quien te
  // descubre hoy le da igual el patrocinio que lleves encima. Lo que cambia es
  // cuanta de esa gente vuelve manana.
  const conversion = calcConversion(
    state.alcance,
    calidad,
    AFINIDAD_BASE *
      formato.afinidad *
      ev.afinidad *
      libros.afinidad *
      factorAfinidad(state.credibilidad),
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
    alloc.produccion * TUNABLES.fatiga.gainPerSecondAtFullProduction * formato.coste * ev.fatiga +
    // Cumplir con una marca es trabajo: hay guion que leer y plano que cuidar.
    fatigaPorSegundo(state.contratos) -
    calcRecuperacionFatiga(state.vida, alloc.descanso + alloc.vida * 0.5)
  let fatiga = clamp01(state.fatiga + fatigaDelta * dt)

  if (state.descanso) {
    const r = aplicarRecuperacion({ vida, fatiga }, state.descanso.tipo, dt)
    vida = r.vida
    fatiga = r.fatiga
  }

  // --- Credibilidad -------------------------------------------------------
  /**
   * Se cura sola despacio, y mucho mas rapido con franjas de comunidad.
   *
   * Recuperar la confianza de alguien se hace hablando con esa persona, no
   * esperando a que se le olvide. El techo baja con cada resaca de moda, asi
   * que "recuperada del todo" no significa lo mismo en la semana 10 que en la
   * 60 — y esa es justo la cicatriz que el sistema quiere dejar.
   */
  const cred = TUNABLES.patrocinios.credibilidad
  const credibilidadDelta =
    cred.recuperaBasePorSegundo +
    cred.recuperaPorSegundo * alloc.comunidad -
    credibilidadPorSegundo(state.contratos)
  const credibilidad = Math.min(
    state.techoCredibilidad,
    clamp01(state.credibilidad + credibilidadDelta * dt),
  )

  // --- Hype ---------------------------------------------------------------
  const hypeDecay = decayRateFromHalfLife(TUNABLES.hype.halfLifeSeconds)
  const hype = Math.max(0, state.hype - state.hype * hypeDecay * dt)

  // --- Material -----------------------------------------------------------
  // Emitiendo se graba de paso; editando es donde salen los videos de verdad.
  const material = parado
    ? state.material
    : acumularMaterial(
        state.material,
        // La MISMA eficiencia que usa calcProduccion, Legado incluido: volver
        // de vacaciones tiene que notarse tambien en cuantos videos salen, o
        // parar acabaria costando catalogo y el GDD pide justo lo contrario.
        materialPorSegundo(
          bloque,
          emitiendo,
          state.multEficiencia * state.legadoEficiencia * mods.eficiencia,
        ) * dt,
      )

  // --- Lectura ------------------------------------------------------------
  // Leer cuesta franjas del dia a dia. Terminar un libro da ideas de golpe y
  // unas semanas de tirar de lo leido.
  const avance = avanzarLectura(state, bloque, dt)
  const ideasDeLibro = avance.terminado ? TUNABLES.lectura.ideasPorLibro : 0

  // --- Ideas --------------------------------------------------------------
  const ideas =
    state.ideas +
    ideasDeLibro +
    (alloc.vida + alloc.descanso * 0.5) * TUNABLES.ideas.perSecondAtFullLife * clamp01(state.vida) * dt

  // --- Economia -----------------------------------------------------------
  // El directo solidario no se emite en el canal propio: no genera ingresos.
  /**
   * Los ingresos directos NO se cortan al cerrar el directo, y es deliberado.
   *
   * Se probo cortarlos y salia un castigo doble: sin emitir el alcance ya se
   * desploma, y ademas se quedaba sin cobrar por el alcance que si tenia. El
   * banco lo enseño en una tirada — la politica equilibrada perdia el 97% de
   * su comunidad y no se retiraba nadie. Y ademas es como funciona: los
   * anuncios siguen corriendo sobre lo que ya esta subido.
   */
  const factorIngresos = (formato.ingresos ?? 1) * ev.ingresos
  /**
   * Lo que pagan las marcas, aparte.
   *
   * Aparte porque es la unica fuente de ingresos que no depende de tener
   * publico ni catalogo: entra igual el dia que no emites. Separarla permite
   * ensenar en pantalla que parte de lo que ganas viene de eso, que es
   * informacion que el jugador necesita para decidir.
   */
  const ingresosPatrocinio = pagoPorSegundo(state.contratos)
  const ingresosPorSegundo =
    calcIngresosDirectos(alcance, comunidad, credibilidad) * factorIngresos +
    calcResidualTotal(state) +
    ingresosPatrocinio
  const costeVidaPorSegundo = houseLivingCost(state.houseStage) / TUNABLES.secondsPerWeek
  const rendimientoAhorros =
    (state.ahorros * TUNABLES.economia.savingsYield) / (52 * TUNABLES.secondsPerWeek)
  const ahorros = state.ahorros + (ingresosPorSegundo + rendimientoAhorros - costeVidaPorSegundo) * dt

  // --- Chat ---------------------------------------------------------------
  // El ritmo lo marca el alcance; las suscripciones, la comunidad.
  const chat = emitiendo
    ? chatStep(
        clipRes.rng,
        {
          alcance,
          comunidad,
          calidad,
          fatiga,
          hype,
          credibilidad,
          patrocinado: state.contratos.length > 0,
        },
        dt,
        state.chatAcc,
        state.chatNextId,
      )
    : // Con el directo apagado el chat se queda como estaba: los mensajes
      // siguen en pantalla, pero no entra nadie a escribir.
      { rng: clipRes.rng, mensajes: [], nextId: state.chatNextId, acc: state.chatAcc }
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
  let ofertas = state.ofertas
  let contratos = state.contratos
  let rngMarcas = state.rngMarcas
  let formatoFinal = state.formato
  let semanaFinal: Semana = state.semana
  let volvioDeParar = false

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
        volvioDeParar = true
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

    /**
     * Las marcas, semana a semana.
     *
     * Los contratos descuentan una semana y se caen solos al terminar; las
     * ofertas sin responder caducan; y se sortea si llega alguna nueva. Todo
     * en el paso de semana y no por tick: una marca no te escribe cada
     * decima de segundo.
     */
    contratos = avanzarContratos(contratos)
    // La clave se devuelve al acabar el acuerdo: si estabas emitiendo con
    // ella, vuelves a lo tuyo.
    formatoFinal = formatoTrasContratos(formatoFinal, contratos)
    ofertas = caducarOfertas(ofertas, semanaNueva)
    const oferta = sortearOferta(
      { ...state, week: semanaNueva, ofertas, contratos, comunidad: comunidadFinal },
      rngMarcas,
    )
    rngMarcas = oferta.rng
    if (oferta.oferta) ofertas = [...ofertas, oferta.oferta]

    /**
     * Se acabo el tiempo: fin del periodo.
     *
     * La semana vivida deja paso a una pausa para repartir la siguiente. La
     * excepcion es estar parado: pedirle a alguien de vacaciones que organice
     * su semana seria una broma, asi que esas semanas las planifica el juego y
     * pasan solas.
     */
    semanaFinal = descanso
      ? { bloques: planAutomatico(allocFinal), cursor: 0, fase: 'viviendo' }
      : {
          // Al volver de parar se rehace la semana desde el reparto que habia
          // antes; si no, se conserva el plan y basta con volver a lanzarlo.
          bloques: volvioDeParar ? planAutomatico(allocFinal) : semanaFinal.bloques,
          cursor: 0,
          fase: 'planificando',
        }
  } else {
    semanaFinal = { ...semanaFinal, cursor }
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
    // Pararse en seco reescribe lo que quedaba de semana: no se negocia.
    semanaFinal = { bloques: planAutomatico(allocFinal), cursor, fase: 'viviendo' }
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

  // --- Umbral de retiro ---------------------------------------------------
  // Se cuenta por semanas para que rozar las condiciones un instante no valga.
  const semanasEnUmbral = cambiaSemana
    ? actualizarUmbral(
        { ...state, comunidad: comunidadFinal, calidad, fatiga, allocation: allocFinal },
        semanaNueva,
      )
    : state.semanasEnUmbral

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
    semana: semanaFinal,
    // INVARIANTE: el reparto es SIEMPRE la lectura de la semana planificada.
    // Un solo origen de verdad; nadie tiene que sincronizar dos numeros.
    allocation: allocationDelPlan(semanaFinal.bloques),
    eventosExtraordinarios,
    vacacionesCompletadas,
    burnouts,
    legadoEficiencia,
    legadoRetencion,
    modificadores: avance.terminado
      ? [
          ...modsFinal.filter((m) => m.id !== 'libro-terminado'),
          {
            id: 'libro-terminado',
            etiqueta: `Tirando de ${avance.terminado.titulo}`,
            hastaSemana: state.week + TUNABLES.lectura.semanasDeposo,
            calidad: TUNABLES.lectura.calidadDeposo,
            eficiencia: 1,
            alcance: 1,
          },
        ]
      : modsFinal,
    lectura: avance.lectura,
    eventoPendiente,
    ultimoEventoSemana,
    semanasEnUmbral,
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
    credibilidad,
    rngMarcas,
    ofertas,
    contratos,
    formato: formatoFinal,
    ahorros,
    ingresosPorSegundo,
    ingresosPatrocinio,
    material,
    directoManual: state.directoManual?.bloque === cursor ? state.directoManual : null,
  }

  const conAuto = publicarAutomatico(siguiente)

  /**
   * Las modas estallan al pasar de semana.
   *
   * Se aplica sobre el estado YA construido y no dentro del bloque de semana
   * porque el golpe toca comunidad y credibilidad, que se calculan arriba:
   * hacerlo antes seria restarle a una cifra que despues se sobrescribe.
   */
  const conResaca = cambiaSemana ? estallarModas(conAuto, semanaNueva) : conAuto

  // El avance de ciclo es automatico: cuando has llegado, has llegado. No es
  // una prueba que se pueda fallar, es un termometro de la carrera.
  return puedeAvanzar(conResaca) ? avanzarCiclo(conResaca) : conResaca
}

/**
 * El calendario de publicacion.
 *
 * Automatizacion escalonada, y toda ella dentro de la regla dura del proyecto:
 * NADIE trabaja por ti. Lo que compras es organizarte —un aviso, una cola
 * programada, el mimo elegido de antemano—, no un editor.
 *
 *   avisos        la interfaz te dice cuando hay material. No publica.
 *   calendario    publica solo, a nivel normal, y nunca en mitad de un directo.
 *   programacion  ademas eliges con que nivel sale.
 *
 * Publicar a mano sigue siendo mejor, porque a mano puedes esperar al pico de
 * hype o al bonus de un clip. Lo que compra la automatizacion es ATENCION, no
 * potencia — que es la lectura correcta para este juego.
 */
function publicarAutomatico(state: GameState): GameState {
  if (!state.owned['calendario']) return state
  // Ni en mitad de una emision ni estando parado: en el primer caso estas
  // delante, en el segundo no estas.
  if (state.descanso || enDirecto(state)) return state

  const id = state.owned['programacion'] ? state.nivelAuto : 'normal'
  return hayMaterial(state.material, id) ? publicar(state, id) : state
}

/**
 * Cuanto alcance genera una unidad de produccion efectiva. Vive aqui y no en
 * tunables porque es un factor de conversion de unidades, no una palanca de
 * dificultad: la dificultad se ajusta con multAlcance y gameSpeed.
 *
 * Subio de 120 a 200 en F7 y no es un cambio de dificultad, es la misma cifra
 * en otras unidades. Antes TODA la produccion traia visitas; ahora solo las
 * traen las franjas de directo, que son el 60% de las de producir. 120/0.6 =
 * 200 deja los totales semanales donde estaban — lo comprueba el banco.
 */
const ALCANCE_POR_PRODUCCION = 200

/** Afinidad de fidelizacion antes de aplicar el multiplicador del formato. */
const AFINIDAD_BASE = 0.15

/**
 * Que se esta haciendo en esta franja, contando el interruptor del directo.
 *
 * La semana pone el marco y el boton decide el momento: cortar el directo
 * convierte lo que queda de franja en descanso, y encenderlo cuando no tocaba
 * la convierte en emision. Solo aplica a la franja en curso — no se puede
 * dejar el interruptor puesto y olvidarse.
 */
function bloqueEfectivo(state: GameState, cursor: number): BloqueId {
  const planificado = state.semana.bloques[cursor] ?? 'dormir'
  const manual = state.directoManual
  if (!manual || manual.bloque !== cursor) return planificado
  return manual.encendido ? 'emitir' : 'dormir'
}

/** Apaga el momento clippeable y su bonus al cerrar el directo. */
function apagarClip(c: GameState['clip']): GameState['clip'] {
  if (!c.activo && c.bonusRestanteMs === 0) return c
  return { ...c, activo: false, bonusRestanteMs: 0 }
}

/**
 * Enciende o apaga el directo en la franja en curso.
 *
 * Es el control que faltaba: hasta F7 el canal emitia siempre y no habia forma
 * de empezar ni de terminar una emision.
 */
export function alternarDirecto(state: GameState): GameState {
  if (state.semana.fase !== 'viviendo' || state.descanso) return state
  const cursor = cursorDeSemana(state.elapsedMs)
  const encendido = bloqueEfectivo(state, cursor) !== 'emitir'
  return { ...state, directoManual: { bloque: cursor, encendido } }
}

/** Se esta emitiendo ahora mismo? Lo necesitan la cabecera y los controles. */
export function enDirecto(state: GameState): boolean {
  if (state.semana.fase !== 'viviendo' || state.descanso) return false
  return bloqueEfectivo(state, cursorDeSemana(state.elapsedMs)) === 'emitir'
}

/** Cambia el formato de contenido que se esta produciendo. */
export function cambiarFormato(state: GameState, id: string): GameState {
  if (!CONTENT_POR_ID.has(id) || state.formato === id) return state
  return { ...state, formato: id }
}

/**
 * Publicar.
 *
 * Ya no es un boton infinito: cuesta MATERIAL, y el material sale de las horas
 * que dedicaste a editar. Sin material no hay video, y esa es toda la
 * diferencia entre un clicker y una decision.
 *
 * El nivel de edicion es la segunda decision. Lo que entra al catalogo es el
 * `peso`, y el catalogo es lo que sigue pagando dentro de tres años: sacarlo
 * rapido rinde HOY —mas pico, mas hype— y cuidarlo construye el final. Es la
 * tesis del juego dentro de un boton.
 */
export function publicar(state: GameState, id: NivelEdicion = 'normal'): GameState {
  if (!hayMaterial(state.material, id)) return state

  const n = nivelEdicion(id)
  const formato = CONTENT_POR_ID.get(state.formato) ?? CONTENT_POR_ID.get(FORMATO_INICIAL)
  // El peso que entra al catalogo es la calidad CON la que se publico, por lo
  // que aporta el nivel de edicion: es lo que determina la altura de su cola
  // larga dentro de tres años.
  const calidadPublicacion = state.calidad * (formato?.calidad ?? 1) * n.peso
  const pico =
    40 *
    state.calidad *
    (formato?.calidad ?? 1) *
    n.pico *
    state.multAlcance *
    (formato?.alcance ?? 1) *
    (1 + state.hype)
  const hype = Math.min(TUNABLES.hype.max, state.hype + TUNABLES.hype.perPublish * n.hype)

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
    material: state.material - costeMaterial(id),
    alcance: state.alcance + pico,
    hype,
    catalogo,
    publicacionesTotales: state.publicacionesTotales + 1,
  }
}
