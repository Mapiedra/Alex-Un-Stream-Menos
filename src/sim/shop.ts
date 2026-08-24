import { UPGRADES_POR_ID } from '../content/upgrades.ts'
import { bolsilloDe, derivarAllocation, derivarMultiplicadores, disponibilidad } from './allocation.ts'
import { allocationDelPlan, planAutomatico } from './semana.ts'
import type { Allocation, GameState } from './state.ts'

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

  const d = disponibilidad(up, state.owned, state.cycle, bolsilloDe(state))
  if (!d.comprable) return state

  const owned = { ...state.owned, [id]: (state.owned[id] ?? 0) + 1 }
  return aplicarMejoras(
    {
      ...state,
      owned,
      // Nada sale gratis. Cada categoria cobra en su moneda: dinero el equipo
      // y la casa, material el flujo, vida la rutina, ideas los formatos.
      ahorros: state.ahorros - d.coste,
      ideas: state.ideas - d.costeIdeas,
      material: state.material - d.costeMaterial,
      vida: state.vida - d.costeVida,
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
  const base: GameState = {
    ...state,
    multEficiencia: m.eficiencia,
    multCalidad: m.calidad,
    multAlcance: m.alcance,
    houseStage: m.casa,
  }

  // Mientras el reparto lo derivan las compras, comprar reescribe la semana:
  // eso ES el sistema en los ciclos 1-2. El jugador cree comprar generadores y
  // lo que compra son horas colocadas de otra manera.
  return rederivarAllocation ? replanificar(base, derivarAllocation(state.owned)) : base
}

/**
 * Rehace la semana a partir de un reparto y deja el estado coherente.
 *
 * INVARIANTE del proyecto: `allocation` es SIEMPRE la lectura de
 * `semana.bloques`. Un solo origen de verdad, para que nadie tenga que
 * acordarse de sincronizar dos numeros que dicen lo mismo.
 */
export function replanificar(state: GameState, alloc: Allocation): GameState {
  const bloques = planAutomatico(alloc)
  return {
    ...state,
    semana: { ...state.semana, bloques },
    allocation: allocationDelPlan(bloques),
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
  return replanificar({ ...state, allocationUnlocked: true }, derivarAllocation(state.owned))
}
