import { CANAL } from './life/canal.ts'
import { COTIDIANO } from './life/cotidiano.ts'
import { LIMITES } from './life/limites.ts'
import type { LifeEvent } from './life/tipos.ts'

export type { EfectoVida, LifeEvent, OpcionVida } from './life/tipos.ts'

/**
 * Todas las tarjetas de vida personal, agrupadas por tema.
 *
 * Estan en tres ficheros y no en uno porque son muchas y porque los tres
 * bloques tienen tonos distintos: `cotidiano` es domestico y ligero, `canal`
 * habla del oficio, y `limites` es donde el juego dice lo que de verdad
 * quiere decir. Separarlos ayuda a escribir cada uno en su registro.
 *
 * Los limites que tiene que respetar cualquier tarjeta nueva estan en
 * life/tipos.ts, y los hace cumplir tests/lifeEvents.test.ts.
 */
export const LIFE_EVENTS: LifeEvent[] = [...COTIDIANO, ...CANAL, ...LIMITES]

export const LIFE_POR_ID: ReadonlyMap<string, LifeEvent> = new Map(
  LIFE_EVENTS.map((e) => [e.id, e]),
)
