import { UPGRADES_POR_ID } from '../content/upgrades.ts'
import { derivarAllocation, derivarMultiplicadores, disponibilidad } from './allocation.ts'
import type { GameState } from './state.ts'

/**
 * Comprar una mejora.
 *
 * Puro y determinista, como todo el motor: devuelve un estado nuevo o el
 * mismo si la compra no procede. Nunca lanza, porque el jugador pulsando un
 * boton deshabilitado no es un error del programa.
 */
export function comprar(state: GameState, id: string): GameState {
  const up = UPGRADES_POR_ID.get(id)
  if (!up) return state

  const d = disponibilidad(up, state.owned, state.cycle, state.ahorros, state.ideas)
  if (!d.comprable) return state

  const owned = { ...state.owned, [id]: (state.owned[id] ?? 0) + 1 }
  return aplicarMejoras(
    {
      ...state,
      owned,
      ahorros: state.ahorros - d.coste,
      ideas: state.ideas - d.costeIdeas,
    },
    // Mientras el jugador no controle el reparto, lo derivan las mejoras.
    !state.allocationUnlocked,
  )
}

/**
 * Recalcula todo lo que depende de `owned`.
 *
 * Se llama tras cada compra y al cargar una partida guardada, de modo que los
 * derivados nunca se guarden desincronizados del origen.
 */
export function aplicarMejoras(state: GameState, rederivarAllocation = true): GameState {
  const m = derivarMultiplicadores(state.owned)
  return {
    ...state,
    multEficiencia: m.eficiencia,
    multCalidad: m.calidad,
    multAlcance: m.alcance,
    houseStage: m.casa,
    allocation: rederivarAllocation ? derivarAllocation(state.owned) : state.allocation,
  }
}

/**
 * Abre el control manual del reparto del tiempo.
 *
 * Es el momento del ciclo 3: el creador ha sistematizado su propio flujo y
 * ahora decide sus horas. Arranca con el reparto que ya tenia, para que el
 * cambio se sienta como ganar control y no como empezar de cero.
 */
export function desbloquearReparto(state: GameState): GameState {
  if (state.allocationUnlocked) return state
  return { ...state, allocationUnlocked: true, allocation: derivarAllocation(state.owned) }
}
