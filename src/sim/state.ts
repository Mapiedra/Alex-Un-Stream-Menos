import { createRng, type RngState } from './rng.ts'
import { TUNABLES } from './tunables.ts'

export const SCHEMA_VERSION = 1

/**
 * Reparto del tiempo del creador. Siempre suma 1.
 *
 * Es la UNICA representacion interna de "en que gasta las horas". En los
 * ciclos 1-2 lo derivan las mejoras compradas y el jugador no lo ve; desde el
 * ciclo 3 el jugador lo controla directamente. No hay dos sistemas: hay uno
 * con dos interfaces.
 */
export interface Allocation {
  produccion: number
  comunidad: number
  vida: number
  descanso: number
}

export const ACTIVITY_IDS = ['produccion', 'comunidad', 'vida', 'descanso'] as const
export type ActivityId = (typeof ACTIVITY_IDS)[number]

/**
 * Entrada del catalogo, agregada por semana para que el array no crezca sin
 * limite: una partida completa son ~80 semanas, luego ~80 entradas.
 */
export interface CatalogEntry {
  /** Semana en que se publico. */
  week: number
  /** Suma de calidad de todo lo publicado esa semana. */
  weight: number
}

export interface GameState {
  schemaVersion: number
  rng: RngState

  /** Milisegundos de simulacion ACTIVA. Excluye el tiempo en pausa leyendo. */
  elapsedMs: number
  week: number
  cycle: number

  // Recursos
  alcance: number
  comunidad: number
  /** Derivado: recalculado cada tick desde vida, fatiga y mejoras. */
  calidad: number
  /** 0..1 */
  vida: number
  /** 0..1 */
  fatiga: number
  hype: number
  ideas: number

  // Economia
  ahorros: number
  /** Derivado: ingresos por segundo del ultimo tick, para mostrar en la UI. */
  ingresosPorSegundo: number
  catalogo: CatalogEntry[]

  // Reparto del tiempo
  allocation: Allocation
  /** Se abre al llegar al ciclo 3: sistematizar el flujo propio. */
  allocationUnlocked: boolean

  // Multiplicadores de mejoras compradas
  multEficiencia: number
  multCalidad: number
  multAlcance: number

  houseStage: number

  /** Prestigio suave acumulado al cerrar ciclos con vacaciones. */
  legadoEficiencia: number
  legadoRetencion: number

  // Historial, para condiciones de victoria y epilogos
  vacacionesCompletadas: number
  eventosExtraordinarios: number
  burnouts: number
  publicacionesTotales: number
}

export function createInitialState(seed = 1): GameState {
  const costeVidaInicial = houseLivingCost(0)
  return {
    schemaVersion: SCHEMA_VERSION,
    rng: createRng(seed),

    elapsedMs: 0,
    week: 0,
    cycle: 1,

    alcance: 0,
    comunidad: 0,
    calidad: TUNABLES.calidad.base,
    vida: TUNABLES.vida.initial,
    fatiga: 0,
    hype: 0,
    ideas: 0,

    ahorros: costeVidaInicial * TUNABLES.economia.initialSavingsWeeks,
    ingresosPorSegundo: 0,
    catalogo: [],

    // Ciclo 1: casi todo produccion. Lo fija el juego, no el jugador.
    allocation: { produccion: 0.7, comunidad: 0.05, vida: 0.15, descanso: 0.1 },
    allocationUnlocked: false,

    multEficiencia: 1,
    multCalidad: 1,
    multAlcance: 1,

    houseStage: 0,

    legadoEficiencia: 1,
    legadoRetencion: 1,

    vacacionesCompletadas: 0,
    eventosExtraordinarios: 0,
    burnouts: 0,
    publicacionesTotales: 0,
  }
}

/**
 * Coste de vida semanal por etapa de casa.
 *
 * Sube con cada etapa: profesionalizarse mejora la calidad de vida y del
 * contenido, pero encarece retirarse. Esa tension es deliberada.
 */
export function houseLivingCost(stage: number): number {
  const costs = [8, 14, 22, 32, 44, 58]
  return costs[Math.min(Math.max(stage, 0), costs.length - 1)] ?? 8
}

/** Normaliza un reparto para que sume exactamente 1. */
export function normalizeAllocation(a: Allocation): Allocation {
  const total = a.produccion + a.comunidad + a.vida + a.descanso
  if (total <= 0) return { produccion: 0, comunidad: 0, vida: 0, descanso: 1 }
  return {
    produccion: a.produccion / total,
    comunidad: a.comunidad / total,
    vida: a.vida / total,
    descanso: a.descanso / total,
  }
}
