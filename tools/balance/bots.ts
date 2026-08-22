import type { Allocation, GameState } from '../../src/sim/state.ts'

/**
 * Un bot es una politica de juego: mira el estado y decide como reparte el
 * tiempo y si publica. Existen para medir el balance, no para jugar bonito.
 */
export interface Bot {
  id: string
  descripcion: string
  allocation: (s: GameState) => Allocation
  /** Publica en este tick? */
  publish: (s: GameState) => boolean
}

const cada = (s: GameState, segundos: number): boolean =>
  Math.floor(s.elapsedMs / 1000) % segundos === 0 && s.elapsedMs % 1000 < 100

export const BOTS: Bot[] = [
  {
    id: 'grind',
    descripcion: 'Todas las horas a producir. Nunca descansa.',
    allocation: () => ({ produccion: 1, comunidad: 0, vida: 0, descanso: 0 }),
    publish: (s) => cada(s, 8),
  },
  {
    id: 'calidad',
    descripcion: 'Prioriza descanso y vida para maximizar calidad.',
    allocation: () => ({ produccion: 0.4, comunidad: 0.1, vida: 0.3, descanso: 0.2 }),
    publish: (s) => cada(s, 12),
  },
  {
    id: 'comunidad',
    descripcion: 'Vuelca el tiempo en fidelizar.',
    allocation: () => ({ produccion: 0.35, comunidad: 0.5, vida: 0.1, descanso: 0.05 }),
    publish: (s) => cada(s, 12),
  },
  {
    id: 'equilibrado',
    descripcion: 'Reparte y ajusta segun la fatiga. La estrategia que deberia ganar.',
    allocation: (s) =>
      s.fatiga > 0.55
        ? { produccion: 0.25, comunidad: 0.2, vida: 0.25, descanso: 0.3 }
        : { produccion: 0.5, comunidad: 0.25, vida: 0.15, descanso: 0.1 },
    publish: (s) => cada(s, 10),
  },
  {
    id: 'avaro',
    descripcion: 'No compra casi nada y acumula. Detector de residuales rotos.',
    allocation: () => ({ produccion: 0.55, comunidad: 0.2, vida: 0.15, descanso: 0.1 }),
    publish: (s) => cada(s, 10),
  },
  {
    id: 'sin-descanso',
    descripcion: 'Clon del equilibrado que nunca descansa. Control para medir el valor de parar.',
    allocation: () => ({ produccion: 0.7, comunidad: 0.25, vida: 0.05, descanso: 0 }),
    publish: (s) => cada(s, 10),
  },
]
