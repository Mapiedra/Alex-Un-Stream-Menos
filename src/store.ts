import { create } from 'zustand'
import { createInitialState, normalizeAllocation, type Allocation, type GameState } from './sim/state.ts'
import { cambiarFormato, publicar, step } from './sim/tick.ts'
import { clipCatch } from './sim/clip.ts'
import { comprar, desbloquearReparto } from './sim/shop.ts'
import { resolver } from './sim/lifeEvents.ts'
import { borrarGuardado, cargar, guardar } from './sim/save/index.ts'

/** Cada cuantos ms de tiempo real se autoguarda. */
const AUTOSAVE_MS = 10_000

interface GameStore {
  game: GameState
  /** Velocidad del DevPanel. No es balance: es herramienta de desarrollo. */
  speedMultiplier: number
  /**
   * La simulacion se detiene mientras hay un modal narrativo abierto: el
   * tiempo que el jugador dedica a leer no debe consumir su partida.
   */
  paused: boolean
  /** Mensaje para la UI cuando la carga de la partida no sale bien. */
  avisoCarga: string | null

  advance: (dtMs: number) => void
  publish: () => void
  catchClip: () => void
  buy: (id: string) => void
  setFormato: (id: string) => void
  resolverEvento: (opcion: number) => void
  unlockAllocation: () => void
  setAllocation: (a: Allocation) => void
  setSpeed: (m: number) => void
  setPaused: (p: boolean) => void
  reset: (seed?: number) => void
  saveNow: () => void
}

/** Intenta reanudar la partida guardada; si no se puede, empieza una nueva. */
function estadoInicial(): { game: GameState; avisoCarga: string | null } {
  const r = cargar()
  if (!r) return { game: createInitialState(), avisoCarga: null }
  if (r.ok) return { game: r.state, avisoCarga: null }
  return {
    game: createInitialState(),
    avisoCarga: `No se pudo recuperar la partida anterior: ${r.motivo}`,
  }
}

const inicial = estadoInicial()

/** Acumulador del autoguardado. Fuera del estado: no es parte de la partida. */
let desdeUltimoGuardado = 0

export const useGame = create<GameStore>((set, get) => ({
  game: inicial.game,
  speedMultiplier: 1,
  paused: false,
  avisoCarga: inicial.avisoCarga,

  advance: (dtMs) =>
    set((s) => {
      if (s.paused) return s
      const game = step(s.game, dtMs * s.speedMultiplier)

      desdeUltimoGuardado += dtMs
      if (desdeUltimoGuardado >= AUTOSAVE_MS) {
        desdeUltimoGuardado = 0
        guardar(game)
      }

      return { game }
    }),

  publish: () =>
    set((s) => {
      const game = publicar(s.game)
      guardar(game)
      return { game }
    }),

  catchClip: () =>
    set((s) => {
      const r = clipCatch(s.game.clip, s.game.rng)
      return { game: { ...s.game, clip: r.clip, rng: r.rng } }
    }),

  // Comprar es una decision que duele perder: se guarda al momento.
  buy: (id) =>
    set((s) => {
      const game = comprar(s.game, id)
      if (game !== s.game) guardar(game)
      return { game }
    }),

  // Cambiar de formato es la decision estrategica central: se guarda al vuelo.
  setFormato: (id) =>
    set((s) => {
      const game = cambiarFormato(s.game, id)
      if (game !== s.game) guardar(game)
      return { game }
    }),

  // Resolver la tarjeta reanuda la partida: el tick vuelve a correr en cuanto
  // eventoPendiente deja de ser null.
  resolverEvento: (opcion) =>
    set((s) => {
      const id = s.game.eventoPendiente
      if (!id) return s
      const game = resolver(s.game, id, opcion)
      guardar(game)
      return { game }
    }),

  unlockAllocation: () =>
    set((s) => {
      const game = desbloquearReparto(s.game)
      guardar(game)
      return { game }
    }),

  setAllocation: (a) =>
    set((s) => ({ game: { ...s.game, allocation: normalizeAllocation(a) } })),

  setSpeed: (m) => set({ speedMultiplier: m }),
  setPaused: (p) => set({ paused: p }),

  reset: (seed) => {
    borrarGuardado()
    desdeUltimoGuardado = 0
    set({ game: createInitialState(seed), paused: false, avisoCarga: null })
  },

  saveNow: () => guardar(get().game),
}))
