import { create } from 'zustand'
import { createInitialState, normalizeAllocation, type Allocation, type GameState } from './sim/state.ts'
import { publicar, step } from './sim/tick.ts'

interface GameStore {
  game: GameState
  /** Velocidad del DevPanel. No es balance: es herramienta de desarrollo. */
  speedMultiplier: number
  /**
   * La simulacion se detiene mientras hay un modal narrativo abierto: el
   * tiempo que el jugador dedica a leer no debe consumir su partida.
   */
  paused: boolean

  advance: (dtMs: number) => void
  publish: () => void
  setAllocation: (a: Allocation) => void
  setSpeed: (m: number) => void
  setPaused: (p: boolean) => void
  reset: (seed?: number) => void
}

export const useGame = create<GameStore>((set) => ({
  game: createInitialState(),
  speedMultiplier: 1,
  paused: false,

  advance: (dtMs) =>
    set((s) => (s.paused ? s : { game: step(s.game, dtMs * s.speedMultiplier) })),
  publish: () => set((s) => ({ game: publicar(s.game) })),
  setAllocation: (a) =>
    set((s) => ({ game: { ...s.game, allocation: normalizeAllocation(a) } })),
  setSpeed: (m) => set({ speedMultiplier: m }),
  setPaused: (p) => set({ paused: p }),
  reset: (seed) => set({ game: createInitialState(seed), paused: false }),
}))
