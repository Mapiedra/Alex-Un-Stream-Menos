import { calcResidualTotal } from './formulas.ts'
import { houseLivingCost, type GameState } from './state.ts'
import { TUNABLES } from './tunables.ts'

/**
 * La condicion de retiro y los tres epilogos.
 *
 * Ganar no es facturar mas: es que las rentas del catalogo ya publicado y el
 * rendimiento de tus ahorros cubran tu coste de vida sin producir nada nuevo.
 * Pero el dinero solo no basta. La seccion 11 del GDD pide ademas haber
 * construido algo: comunidad, calidad, una casa, haber vivido al menos un
 * momento extraordinario y haber parado al menos una vez.
 *
 * Y hay una condicion final que es la que da sentido a todo el juego: hay que
 * sostenerlo TRABAJANDO POCO. De nada sirve llegar al numero a base de horas.
 */

export type Epilogo = 'comodo' | 'justo' | 'rueda'

export interface FinalPartida {
  epilogo: Epilogo
  /** Que eligio hacer con su tiempo en la escena final. */
  eleccion: string | null
  /** Semana en la que lo dejo. */
  semana: number
}

/**
 * Cobertura del retiro: cuanto del coste de vida cubren las rentas pasivas.
 *
 *   (residuales del catalogo + rendimiento de los ahorros) / coste de vida
 *
 * Llegar a 1 es poder dejar de producir sin que las cuentas se hundan.
 */
export function cobertura(state: GameState): number {
  const residual = calcResidualTotal(state)
  const rendimiento =
    (Math.max(0, state.ahorros) * TUNABLES.economia.savingsYield) / (52 * TUNABLES.secondsPerWeek)
  const costeVida = houseLivingCost(state.houseStage) / TUNABLES.secondsPerWeek
  return costeVida > 0 ? (residual + rendimiento) / costeVida : 0
}

export interface CondicionFinal {
  clave: string
  texto: string
  cumplido: boolean
  /** Para pintar barras de progreso donde tenga sentido. */
  progreso: number
}

/** Las condiciones de la seccion 11, evaluadas. */
export function condicionesRetiro(state: GameState): CondicionFinal[] {
  const f = TUNABLES.final
  const cob = cobertura(state)
  const horas = state.allocation.produccion

  const cond = (
    clave: string,
    texto: string,
    actual: number,
    minimo: number,
    invertido = false,
  ): CondicionFinal => ({
    clave,
    texto,
    cumplido: invertido ? actual <= minimo : actual >= minimo,
    progreso: invertido
      ? Math.min(1, minimo / Math.max(actual, 0.0001))
      : Math.min(1, actual / minimo),
  })

  return [
    cond('cobertura', 'Vivir de lo ya publicado y de lo ahorrado', cob, 1),
    cond('comunidad', 'Una comunidad que se sostiene sola', state.comunidad, f.comunidadMinima),
    cond('calidad', 'Contenido del que estar orgulloso', state.calidad, f.calidadMinima),
    cond('fatiga', 'Llegar entero', state.fatiga, f.fatigaMaxima, true),
    cond('casa', 'Una casa, no un sitio donde trabajar', state.houseStage, f.casaMinima),
    cond(
      'evento',
      'Haber vivido al menos un momento grande',
      state.eventosExtraordinarios,
      1,
    ),
    cond('vacaciones', 'Haber sabido parar al menos una vez', state.vacacionesCompletadas, 1),
    cond('horas', 'Sostenerlo trabajando poco', horas, f.horasMaximas, true),
  ]
}

export function cumpleRetiro(state: GameState): boolean {
  return condicionesRetiro(state).every((c) => c.cumplido)
}

/**
 * Cuenta cuantas semanas seguidas se sostienen las condiciones.
 *
 * Rozarlas un instante no vale: el GDD pide poder mantener la actividad, no
 * tocar un numero de pasada. Devuelve el contador actualizado.
 */
export function actualizarUmbral(state: GameState, semanaNueva: number): number {
  if (!cumpleRetiro(state)) return 0
  if (semanaNueva === state.week) return state.semanasEnUmbral
  return state.semanasEnUmbral + 1
}

export function puedeRetirarse(state: GameState): boolean {
  return state.semanasEnUmbral >= TUNABLES.final.semanasSostenidas
}

/**
 * Que epilogo toca.
 *
 * No hay derrota. Lo que cambia es con cuanto margen llegas: si te sobra, si
 * te da justo, o si decides parar sin haber llegado — que tampoco es perder,
 * es el final por defecto y se cuenta con respeto.
 */
export function evaluarEpilogo(state: GameState): Epilogo {
  if (!puedeRetirarse(state)) return 'rueda'
  return cobertura(state) >= TUNABLES.final.coberturaComoda ? 'comodo' : 'justo'
}

/** Cierra la partida con el epilogo que corresponda. */
export function retirarse(state: GameState, eleccion: string | null): GameState {
  if (state.final) return state
  return {
    ...state,
    final: { epilogo: evaluarEpilogo(state), eleccion, semana: state.week },
  }
}
