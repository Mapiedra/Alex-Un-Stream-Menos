import { cobertura } from './final.ts'
import { BLOQUES_POR_SEMANA, contarBloques } from './semana.ts'
import type { GameState } from './state.ts'
import { TUNABLES } from './tunables.ts'

/**
 * UN STREAM MENOS, dicho en franjas.
 *
 * El juego se llama asi y hasta ahora no habia ni una cifra que lo dijera. La
 * condicion de retiro `horas` —"sostenerlo trabajando poco"— vivia dentro del
 * panel del Retiro, que no aparece hasta el ultimo ciclo: durante las primeras
 * cuarenta semanas el objetivo del juego era invisible.
 *
 * Esto no es una mecanica nueva ni una cifra nueva. Es la MISMA condicion,
 * traducida de una fraccion abstracta (0.3 del tiempo) a lo que el jugador
 * acaba de pintar con la mano en la rejilla (seis franjas de veintiuna). El
 * numero sale de `TUNABLES.final.horasMaximas`, asi que mover la palanca de
 * dificultad mueve el objetivo que se ensena, sin tocar esto.
 *
 * Se cuenta desde `semana.bloques` y no desde `state.allocation` a proposito:
 * son la misma cifra —`allocation` se deriva del plan, franjas entre 21— pero
 * contar bloques permite decir "cuatro de emitir y dos de editar" en vez de
 * "0.286 de produccion", y esa es toda la diferencia.
 */

/**
 * Franjas de produccion que el retiro tolera.
 *
 * Se redondea hacia abajo porque la condicion es `<=`: con siete franjas el
 * reparto sale 0.333 y ya no cumple, asi que ensenar siete como objetivo
 * seria mentir.
 */
export const FRANJAS_OBJETIVO = Math.floor(TUNABLES.final.horasMaximas * BLOQUES_POR_SEMANA)

export interface Dependencia {
  /** Franjas en directo esta semana. */
  emitir: number
  /** Franjas de montaje esta semana. */
  editar: number
  /** Las dos juntas: lo que la condicion de retiro llama producir. */
  produccion: number
  /** Cuantas franjas de produccion permite el retiro. */
  objetivo: number
  /** Franjas de produccion de mas. Cero cuando ya se trabaja poco. */
  sobran: number
  /** Que parte del coste de vida cubren las rentas de lo ya publicado. */
  cobertura: number
  /** Las cuentas salen sin producir nada nuevo. */
  cubierto: boolean
  /** Se sostiene con las horas que pide el final. */
  trabajaPoco: boolean
}

export function dependenciaDelDirecto(state: GameState): Dependencia {
  const cuenta = contarBloques(state.semana.bloques)
  const produccion = cuenta.emitir + cuenta.editar
  const cob = cobertura(state)

  return {
    emitir: cuenta.emitir,
    editar: cuenta.editar,
    produccion,
    objetivo: FRANJAS_OBJETIVO,
    sobran: Math.max(0, produccion - FRANJAS_OBJETIVO),
    cobertura: cob,
    cubierto: cob >= 1,
    trabajaPoco: produccion <= FRANJAS_OBJETIVO,
  }
}
