import { UPGRADES, type Categoria } from '../../src/content/upgrades.ts'
import { disponibilidad } from '../../src/sim/allocation.ts'
import type { Allocation, GameState } from '../../src/sim/state.ts'

/**
 * Un bot es una politica de juego: decide como reparte el tiempo, que compra y
 * cuando publica. Existen para medir el balance, no para jugar bonito.
 *
 * Compran de verdad, porque si no el banco mediria un juego que no existe: en
 * los ciclos 1-2 el reparto del tiempo lo derivan las compras, asi que un bot
 * que no compra tampoco cambia sus horas.
 */
export interface Bot {
  id: string
  descripcion: string
  /** Reparto manual. Si se omite, lo derivan las mejoras compradas. */
  allocation?: (s: GameState) => Allocation
  /** Prioridad de categorias. Compra la primera que se pueda permitir. */
  prioridad: Categoria[]
  /** Compra siquiera? El bot avaro casi no. */
  compra?: (s: GameState) => boolean
  /** Se va de vacaciones? Si se omite, no para nunca por voluntad propia. */
  vacaciones?: (s: GameState) => boolean
  /** Invierte en preparar la conferencia cuando la anuncian? */
  prepara?: boolean
  publish: (s: GameState) => boolean
}

const cada = (s: GameState, segundos: number): boolean =>
  Math.floor(s.elapsedMs / 1000) % segundos === 0 && s.elapsedMs % 1000 < 100

/**
 * Siguiente compra segun la prioridad del bot.
 *
 * Dentro de una categoria compra lo mas barato primero: es lo que hace una
 * persona que no se ha leido una hoja de calculo antes de jugar.
 */
export function siguienteCompra(s: GameState, prioridad: Categoria[]): string | null {
  for (const cat of prioridad) {
    const candidatas = UPGRADES.filter((u) => u.categoria === cat)
      .map((u) => ({ u, d: disponibilidad(u, s.owned, s.cycle, s.ahorros, s.ideas) }))
      .filter((x) => x.d.comprable)
      .sort((a, b) => a.d.coste - b.d.coste)
    const elegida = candidatas[0]
    if (elegida) return elegida.u.id
  }
  return null
}

const TODO: Categoria[] = ['setup', 'flujo', 'rutina', 'formato', 'casa']

export const BOTS: Bot[] = [
  {
    id: 'grind',
    descripcion: 'Solo compra lo que produce mas. Nunca descansa.',
    allocation: () => ({ produccion: 1, comunidad: 0, vida: 0, descanso: 0 }),
    prioridad: ['setup', 'flujo'],
    publish: (s) => cada(s, 8),
  },
  {
    id: 'calidad',
    descripcion: 'Prioriza descanso y vida para maximizar calidad.',
    allocation: () => ({ produccion: 0.4, comunidad: 0.1, vida: 0.3, descanso: 0.2 }),
    prioridad: ['rutina', 'setup', 'flujo'],
    publish: (s) => cada(s, 12),
  },
  {
    id: 'comunidad',
    descripcion: 'Vuelca el tiempo en fidelizar.',
    allocation: () => ({ produccion: 0.35, comunidad: 0.5, vida: 0.1, descanso: 0.05 }),
    prioridad: ['formato', 'rutina', 'setup'],
    publish: (s) => cada(s, 12),
  },
  {
    id: 'equilibrado',
    descripcion: 'Reparte, ajusta segun la fatiga y compra de todo. Deberia ganar.',
    allocation: (s) =>
      s.fatiga > 0.55
        ? { produccion: 0.25, comunidad: 0.2, vida: 0.25, descanso: 0.3 }
        : { produccion: 0.5, comunidad: 0.25, vida: 0.15, descanso: 0.1 },
    prioridad: TODO,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'avaro',
    descripcion: 'Apenas compra y acumula. Detector de residuales demasiado generosos.',
    allocation: () => ({ produccion: 0.55, comunidad: 0.2, vida: 0.15, descanso: 0.1 }),
    prioridad: ['setup'],
    // Solo compra si le sobra mucho: su plan es jubilarse antes, no crecer.
    compra: (s) => s.ahorros > 3000,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'sin-descanso',
    descripcion: 'Clon del equilibrado que nunca descansa. Control del valor de parar.',
    allocation: () => ({ produccion: 0.7, comunidad: 0.25, vida: 0.05, descanso: 0 }),
    prioridad: TODO,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'vacacionero',
    descripcion: 'Como el equilibrado, pero para cada cierto tiempo por el Legado.',
    allocation: (s) =>
      s.fatiga > 0.55
        ? { produccion: 0.25, comunidad: 0.2, vida: 0.25, descanso: 0.3 }
        : { produccion: 0.5, comunidad: 0.25, vida: 0.15, descanso: 0.1 },
    prioridad: TODO,
    /**
     * Para cada 25 semanas, no cuando se cansa.
     *
     * El banco enseno que un jugador equilibrado NUNCA llega a cansarse de
     * verdad —su fatiga maxima es 0.06—, asi que un bot que solo parase por
     * agotamiento no pararia jamas. El motivo real para irse de vacaciones no
     * es el cansancio: es el Legado que consolida al cerrar un ciclo.
     */
    vacaciones: (s) => s.week > 0 && s.week % 25 === 0,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'aprovechado',
    descripcion: 'Como el equilibrado, pero prepara siempre la conferencia.',
    allocation: (s) =>
      s.fatiga > 0.55
        ? { produccion: 0.25, comunidad: 0.2, vida: 0.25, descanso: 0.3 }
        : { produccion: 0.5, comunidad: 0.25, vida: 0.15, descanso: 0.1 },
    prioridad: TODO,
    prepara: true,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'derivado',
    descripcion: 'No toca el reparto: lo deja en manos de lo que compra. El jugador del ciclo 1.',
    prioridad: TODO,
    publish: (s) => cada(s, 10),
  },
]
