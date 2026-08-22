import { LIFE_EVENTS, LIFE_POR_ID, type EfectoVida, type LifeEvent } from '../content/lifeEvents.ts'
import { clamp01 } from './formulas.ts'
import { nextFloat, type RngState } from './rng.ts'
import type { GameState } from './state.ts'

/**
 * Sorteo y resolucion de las tarjetas de vida.
 *
 * Cuando sale una tarjeta la simulacion se detiene: el tiempo que el jugador
 * dedica a leer no debe consumir su partida. Eso permite escribir textos con
 * calma sin que salga caro en minutos de juego.
 *
 * Una tarjeta no se repite hasta que se han visto todas las disponibles. Un
 * juego de dos horas no aguanta ver dos veces el mismo gato encima del mismo
 * teclado.
 */

/** Semanas entre tarjeta y tarjeta. */
export const SEMANAS_ENTRE_EVENTOS = 3

export interface ModificadorActivo {
  id: string
  etiqueta: string
  /** Semana de la partida en la que caduca. */
  hastaSemana: number
  calidad: number
  eficiencia: number
  alcance: number
}

/** Tarjetas que pueden salir ahora mismo y no se han visto todavia. */
export function candidatas(state: GameState): LifeEvent[] {
  const disponibles = LIFE_EVENTS.filter(
    (e) =>
      state.week >= (e.desdeSemana ?? 0) &&
      state.houseStage >= (e.desdeCasa ?? 0) &&
      !state.eventosVistos.includes(e.id),
  )
  // Vistas todas, se reabre la baraja para no dejar la partida sin eventos.
  if (disponibles.length > 0) return disponibles
  return LIFE_EVENTS.filter(
    (e) => state.week >= (e.desdeSemana ?? 0) && state.houseStage >= (e.desdeCasa ?? 0),
  )
}

/** Sorteo ponderado. Devuelve null si no hay ninguna disponible. */
export function sortear(
  state: GameState,
  rng: RngState,
): { evento: LifeEvent | null; rng: RngState } {
  const pool = candidatas(state)
  if (pool.length === 0) return { evento: null, rng }

  const total = pool.reduce((acc, e) => acc + (e.peso ?? 1), 0)
  const r = nextFloat(rng)
  let objetivo = r.value * total

  for (const e of pool) {
    objetivo -= e.peso ?? 1
    if (objetivo <= 0) return { evento: e, rng: r.rng }
  }
  return { evento: pool[pool.length - 1] ?? null, rng: r.rng }
}

/**
 * Aplica la opcion elegida.
 *
 * Los efectos son deliberadamente pequenos: estas tarjetas dan sabor, no
 * progresion. Un test comprueba que ninguna se pase.
 */
export function resolver(state: GameState, eventoId: string, opcionIndex: number): GameState {
  const evento = LIFE_POR_ID.get(eventoId)
  const opcion = evento?.opciones[opcionIndex]
  if (!evento || !opcion) return { ...state, eventoPendiente: null }

  const s = aplicarEfecto(state, opcion.efecto)

  return {
    ...s,
    eventoPendiente: null,
    eventosVistos: s.eventosVistos.includes(eventoId)
      ? s.eventosVistos
      : [...s.eventosVistos, eventoId],
  }
}

function aplicarEfecto(state: GameState, efecto: EfectoVida): GameState {
  let modificadores = state.modificadores

  if (efecto.modificador) {
    const m = efecto.modificador
    const nuevo: ModificadorActivo = {
      id: m.id,
      etiqueta: m.etiqueta,
      hastaSemana: state.week + m.semanas,
      calidad: m.calidad ?? 1,
      eficiencia: m.eficiencia ?? 1,
      alcance: m.alcance ?? 1,
    }
    // Repetir un modificador lo renueva en vez de acumularlo: si no, dos
    // tarjetas del mismo tipo se multiplicarian entre si.
    modificadores = [...state.modificadores.filter((x) => x.id !== m.id), nuevo]
  }

  return {
    ...state,
    vida: clamp01(state.vida + (efecto.vida ?? 0)),
    fatiga: clamp01(state.fatiga + (efecto.fatiga ?? 0)),
    ideas: Math.max(0, state.ideas + (efecto.ideas ?? 0)),
    modificadores,
  }
}

/** Retira los modificadores caducados. Devuelve el mismo array si no cambia. */
export function caducarModificadores(
  modificadores: ModificadorActivo[],
  semana: number,
): ModificadorActivo[] {
  const vivos = modificadores.filter((m) => m.hastaSemana > semana)
  return vivos.length === modificadores.length ? modificadores : vivos
}

export interface MultModificadores {
  calidad: number
  eficiencia: number
  alcance: number
}

export function multModificadores(modificadores: ModificadorActivo[]): MultModificadores {
  let calidad = 1
  let eficiencia = 1
  let alcance = 1
  for (const m of modificadores) {
    calidad *= m.calidad
    eficiencia *= m.eficiencia
    alcance *= m.alcance
  }
  return { calidad, eficiencia, alcance }
}
