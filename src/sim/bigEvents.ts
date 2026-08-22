import { BIG_EVENTS, BIG_POR_ID, type FaseDef } from '../content/bigEvents.ts'
import { chance, nextInt, type RngState } from './rng.ts'
import type { GameState } from './state.ts'

/**
 * Maquina de estados de los eventos extraordinarios.
 *
 * Un evento avanza por fases a razon de semanas: se anuncia, se prepara, se
 * emite y despues viene la ventana de retencion, que es donde de verdad se
 * decide si ha servido de algo. La comunidad determina cuanta de la gente que
 * llego se queda; el pico por si solo no construye nada.
 *
 * REGLA DEL GDD: potentes pero escasos, y NUNCA requisito para ganar. El banco
 * de balance tiene un test que juega ignorandolos por completo.
 */

export interface EventoActivo {
  id: string
  /** Indice de la fase actual dentro de BigEvent.fases. */
  fase: number
  /** Semanas que le quedan a la fase actual. */
  semanasRestantes: number
  /** El jugador invirtio en preparar la conferencia. */
  preparado: boolean
  /** Ya se ha mostrado la tarjeta de esta fase? */
  anunciado: boolean
}

/** Probabilidad por semana de que aparezca un evento, si no hay ninguno. */
const PROB_POR_SEMANA = 0.06

export function faseActual(evento: EventoActivo | null): FaseDef | null {
  if (!evento) return null
  const def = BIG_POR_ID.get(evento.id)
  return def?.fases[evento.fase] ?? null
}

/** Multiplicadores que aporta el evento en curso. Neutros si no hay ninguno. */
export function multEvento(evento: EventoActivo | null): {
  alcance: number
  afinidad: number
  fatiga: number
  ingresos: number
} {
  const fase = faseActual(evento)
  if (!fase || !evento) return { alcance: 1, afinidad: 1, fatiga: 1, ingresos: 1 }

  const def = BIG_POR_ID.get(evento.id)
  const prep = evento.preparado ? def?.preparable : undefined
  const enDirecto = fase.fase === 'directo'

  return {
    alcance: (fase.alcance ?? 1) * (enDirecto && prep ? prep.bonusAlcance : 1),
    afinidad: fase.afinidad ?? 1,
    fatiga: (fase.fatiga ?? 1) * (enDirecto && prep ? prep.bonusFatiga : 1),
    ingresos: fase.ingresos ?? 1,
  }
}

/** Sortea si aparece un evento nuevo. Solo si no hay ninguno en curso. */
export function sortearEvento(
  state: GameState,
  rng: RngState,
): { evento: EventoActivo | null; rng: RngState } {
  if (state.evento) return { evento: state.evento, rng }

  const candidatos = BIG_EVENTS.filter(
    (e) =>
      state.cycle >= e.desdeCiclo &&
      state.week - (state.ultimoBigEvent[e.id] ?? -e.reposoSemanas) >= e.reposoSemanas,
  )
  if (candidatos.length === 0) return { evento: null, rng }

  const tirada = chance(rng, PROB_POR_SEMANA)
  if (!tirada.value) return { evento: null, rng: tirada.rng }

  // Sorteo entre los candidatos. Antes ganaba el de ciclo mas alto, y eso
  // hacia que en cuanto se desbloqueaba el solidario la conferencia no
  // volviese a salir nunca: el evento mas caracteristico del GDD quedaba
  // muerto a partir del ciclo 3.
  const pick = nextInt(tirada.rng, 0, candidatos.length - 1)
  const elegido = candidatos[pick.value]
  const primera = elegido?.fases[0]
  if (!elegido || !primera) return { evento: null, rng: pick.rng }

  return {
    evento: {
      id: elegido.id,
      fase: 0,
      semanasRestantes: primera.semanas,
      preparado: false,
      anunciado: false,
    },
    rng: pick.rng,
  }
}

export interface AvanceEvento {
  evento: EventoActivo | null
  /** Se ha completado el evento entero en este paso? */
  completado: boolean
  ultimoBigEvent: Record<string, number>
}

/** Descuenta una semana al evento en curso y pasa de fase si toca. */
export function avanzarSemana(
  evento: EventoActivo | null,
  semana: number,
  ultimoBigEvent: Record<string, number>,
): AvanceEvento {
  if (!evento) return { evento: null, completado: false, ultimoBigEvent }

  const restantes = evento.semanasRestantes - 1
  if (restantes > 0) {
    return {
      evento: { ...evento, semanasRestantes: restantes },
      completado: false,
      ultimoBigEvent,
    }
  }

  const def = BIG_POR_ID.get(evento.id)
  const siguienteIndice = evento.fase + 1
  const siguiente = def?.fases[siguienteIndice]

  if (!siguiente) {
    return {
      evento: null,
      completado: true,
      ultimoBigEvent: { ...ultimoBigEvent, [evento.id]: semana },
    }
  }

  return {
    evento: {
      ...evento,
      fase: siguienteIndice,
      semanasRestantes: siguiente.semanas,
      anunciado: false,
    },
    completado: false,
    ultimoBigEvent,
  }
}

/**
 * Invierte en prepararse.
 *
 * Solo tiene sentido antes de emitir, y solo una vez. Prepararse no es
 * obligatorio: llegar sin preparar da un pico menor y cansa mas, pero
 * funciona igual.
 */
export function prepararEvento(state: GameState): GameState {
  const evento = state.evento
  if (!evento || evento.preparado) return state

  const def = BIG_POR_ID.get(evento.id)
  const prep = def?.preparable
  const fase = def?.fases[evento.fase]
  if (!prep || !fase) return state
  if (fase.fase !== 'anuncio' && fase.fase !== 'preparacion') return state
  if (state.ahorros < prep.coste) return state

  return {
    ...state,
    ahorros: state.ahorros - prep.coste,
    evento: { ...evento, preparado: true },
  }
}

/** Marca la tarjeta de la fase como ya vista, para no repetirla. */
export function marcarAnunciado(evento: EventoActivo): EventoActivo {
  return { ...evento, anunciado: true }
}
