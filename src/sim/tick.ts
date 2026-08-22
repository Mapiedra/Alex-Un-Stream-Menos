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

  const alloc = state.allocation

  // --- Calidad (derivada) -------------------------------------------------
  const calidad = calcCalidad(state.vida, state.fatiga, state.multCalidad)

  // --- Momento clippeable -------------------------------------------------
  const clipRes = clipStep(state.clip, state.rng, dtMs * TUNABLES.gameSpeed)

  // --- Alcance ------------------------------------------------------------
  const produccion = calcProduccion(
    alloc.produccion,
    calidad,
    state.multEficiencia * state.legadoEficiencia,
    state.hype,
    clipMultiplier(state.clip),
  )
  const ganancia = produccion * state.multAlcance * ALCANCE_POR_PRODUCCION
  const decay = calcAlcanceDecayRate(state.comunidad, state.legadoRetencion)
  const alcance = Math.max(0, state.alcance + (ganancia - state.alcance * decay) * dt)

  // --- Comunidad ----------------------------------------------------------
  // Afinidad base baja: producir por producir apenas fideliza. Lo que fideliza
  // es el tiempo dedicado explicitamente a la comunidad.
  const conversion = calcConversion(state.alcance, calidad, AFINIDAD_BASE, alloc.comunidad)
  const comunidadDecay = decayRateFromHalfLife(TUNABLES.comunidad.halfLifeSeconds) / state.legadoRetencion
  const comunidad = Math.max(0, state.comunidad + (conversion - state.comunidad * comunidadDecay) * dt)

  // --- Vida y fatiga ------------------------------------------------------
  const vidaDelta =
    alloc.vida * TUNABLES.vida.recoveryPerSecondAtFullRest +
    alloc.descanso * TUNABLES.vida.recoveryPerSecondAtFullRest -
    alloc.produccion * TUNABLES.vida.drainPerSecondAtFullProduction
  const vida = clamp01(state.vida + vidaDelta * dt)

  const fatigaDelta =
    alloc.produccion * TUNABLES.fatiga.gainPerSecondAtFullProduction -
    calcRecuperacionFatiga(state.vida, alloc.descanso + alloc.vida * 0.5)
  const fatiga = clamp01(state.fatiga + fatigaDelta * dt)

  // --- Hype ---------------------------------------------------------------
  const hypeDecay = decayRateFromHalfLife(TUNABLES.hype.halfLifeSeconds)
  const hype = Math.max(0, state.hype - state.hype * hypeDecay * dt)

  // --- Ideas --------------------------------------------------------------
  const ideas =
    state.ideas +
    (alloc.vida + alloc.descanso * 0.5) * TUNABLES.ideas.perSecondAtFullLife * clamp01(state.vida) * dt

  // --- Economia -----------------------------------------------------------
  const ingresosPorSegundo = calcIngresosDirectos(alcance, comunidad) + calcResidualTotal(state)
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

  // --- Reloj --------------------------------------------------------------
  const elapsedMs = state.elapsedMs + dtMs * TUNABLES.gameSpeed
  const week = Math.floor(elapsedMs / 1000 / TUNABLES.secondsPerWeek)

  return {
    ...state,
    rng: chat.rng,
    clip: clipRes.clip,
    chat: mensajes,
    chatNextId: chat.nextId,
    chatAcc: chat.acc,
    elapsedMs,
    week,
    alcance,
    comunidad,
    calidad,
    vida,
    fatiga,
    hype,
    ideas,
    ahorros,
    ingresosPorSegundo,
  }
}

/**
 * Cuanto alcance genera una unidad de produccion efectiva. Vive aqui y no en
 * tunables porque es un factor de conversion de unidades, no una palanca de
 * dificultad: la dificultad se ajusta con multAlcance y gameSpeed.
 */
const ALCANCE_POR_PRODUCCION = 120

/** Afinidad de fidelizacion del contenido generico, antes de los formatos. */
const AFINIDAD_BASE = 0.15

/**
 * Publicar: pico instantaneo de alcance, hype, y una entrada permanente en el
 * catalogo. El peso de esa entrada es la calidad con la que se publico, que
 * es lo que determina la altura de su cola larga anos despues.
 */
export function publicar(state: GameState): GameState {
  const pico = 40 * state.calidad * state.multAlcance * (1 + state.hype)
  const hype = Math.min(TUNABLES.hype.max, state.hype + TUNABLES.hype.perPublish)

  const catalogo = [...state.catalogo]
  const last = catalogo[catalogo.length - 1]
  if (last && last.week === state.week) {
    catalogo[catalogo.length - 1] = { week: last.week, weight: last.weight + state.calidad }
  } else {
    catalogo.push({ week: state.week, weight: state.calidad })
  }

  return {
    ...state,
    alcance: state.alcance + pico,
    hype,
    catalogo,
    publicacionesTotales: state.publicacionesTotales + 1,
  }
}
