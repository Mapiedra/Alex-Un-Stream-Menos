import { CYCLES, CYCLE_POR_NUMERO, ULTIMO_CICLO, type Requisito } from '../content/cycles.ts'
import { UPGRADES_POR_ID } from '../content/upgrades.ts'
import { desbloquearReparto } from './shop.ts'
import type { GameState } from './state.ts'

/**
 * Avance por ciclos.
 *
 * Un ciclo se cierra cuando se cumplen TODOS sus requisitos. No hay forma de
 * fallarlos: no son una prueba, son un termometro de por donde va la carrera.
 * El jugador no puede quedarse atascado, solo tardar mas.
 */

export interface EstadoRequisito extends Requisito {
  actual: number
  cumplido: boolean
}

/** Cuantos formatos propios ha desbloqueado el jugador. */
export function formatosPropios(state: GameState): number {
  return Object.entries(state.owned).filter(([id, n]) => {
    if (!n) return false
    return UPGRADES_POR_ID.get(id)?.categoria === 'formato'
  }).length
}

function valorActual(state: GameState, clave: Requisito['clave']): number {
  switch (clave) {
    case 'comunidad':
      return state.comunidad
    case 'alcance':
      return state.alcance
    case 'publicaciones':
      return state.publicacionesTotales
    case 'casa':
      return state.houseStage
    case 'calidad':
      return state.calidad
    case 'formatos':
      return formatosPropios(state)
  }
}

/** Estado de los requisitos del ciclo actual, para pintarlos en la UI. */
export function requisitosDelCiclo(state: GameState): EstadoRequisito[] {
  const ciclo = CYCLE_POR_NUMERO.get(state.cycle)
  if (!ciclo) return []
  return ciclo.requisitos.map((r) => {
    const actual = valorActual(state, r.clave)
    return { ...r, actual, cumplido: actual >= r.minimo }
  })
}

export function puedeAvanzar(state: GameState): boolean {
  if (state.cycle >= ULTIMO_CICLO) return false
  const reqs = requisitosDelCiclo(state)
  return reqs.length > 0 && reqs.every((r) => r.cumplido)
}

/**
 * Cierra el ciclo actual y entra en el siguiente.
 *
 * El avance es AUTOMATICO, no una decision. El GDD plantea los ciclos como
 * etapas de una carrera, no como niveles que se eligen: cuando has llegado,
 * has llegado. Lo unico que hace el jugador es leer lo que ha pasado.
 */
export function avanzarCiclo(state: GameState): GameState {
  if (!puedeAvanzar(state)) return state

  const siguiente = state.cycle + 1
  const nuevo = CYCLE_POR_NUMERO.get(siguiente)
  // El aviso detiene la partida hasta que el jugador lee el cierre del ciclo
  // que acaba y la entrada del que empieza. Ese texto llevaba escrito desde
  // el principio en content/cycles.ts sin que nadie lo viera nunca.
  let s: GameState = { ...state, cycle: siguiente, avisoCiclo: siguiente }

  // El ciclo 3 devuelve al creador el control de sus horas.
  if (nuevo?.abreReparto) s = desbloquearReparto(s)

  return s
}

/** Progreso 0..1 hacia el cierre del ciclo, para la barra de la UI. */
export function progresoDelCiclo(state: GameState): number {
  const reqs = requisitosDelCiclo(state)
  if (reqs.length === 0) return 1
  const suma = reqs.reduce((acc, r) => acc + Math.min(1, r.actual / r.minimo), 0)
  return suma / reqs.length
}

export { CYCLES, CYCLE_POR_NUMERO, ULTIMO_CICLO }
