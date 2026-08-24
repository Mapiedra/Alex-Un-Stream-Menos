import { create } from 'zustand'
import { createInitialState, type GameState } from './sim/state.ts'
import {
  allocationDelPlan,
  llenarSemana,
  planificarBloque,
  type BloqueId,
} from './sim/semana.ts'
import { alternarDirecto, cambiarFormato, publicar, step } from './sim/tick.ts'
import { nivelValido, type NivelEdicion } from './sim/publicacion.ts'
import { clipCatch } from './sim/clip.ts'
import { comprar, desbloquearReparto } from './sim/shop.ts'
import { resolver } from './sim/lifeEvents.ts'
import { irseDeVacaciones, puedeIrseDeVacaciones } from './sim/descanso.ts'
import { prepararEvento } from './sim/bigEvents.ts'
import { aceptar, rechazar } from './sim/patrocinios.ts'
import { retirarse } from './sim/final.ts'
import { borrarGuardado, cargar, guardar } from './sim/save/index.ts'

/** Cada cuantos ms de tiempo real se autoguarda. */
const AUTOSAVE_MS = 10_000

/**
 * En que pantalla esta el jugador.
 *
 * Vive en el store y NO en `GameState` a proposito: es estado de la
 * aplicacion, no de la partida. Guardar y cargar no debe recordar en que
 * pantalla estabas, igual que las preferencias de accesibilidad viven aparte.
 */
export type Fase = 'menu' | 'jugando'

interface GameStore {
  game: GameState
  fase: Fase
  /** Habia una partida recuperable al abrir. Lo necesita el menu. */
  hayGuardado: boolean
  /** Velocidad del DevPanel. No es balance: es herramienta de desarrollo. */
  speedMultiplier: number
  /**
   * La simulacion se detiene mientras hay un modal narrativo abierto: el
   * tiempo que el jugador dedica a leer no debe consumir su partida.
   */
  paused: boolean
  /** Mensaje para la UI cuando la carga de la partida no sale bien. */
  avisoCarga: string | null

  nuevaPartida: (seed?: number) => void
  continuar: () => void
  volverAlMenu: () => void
  cerrarAvisoCiclo: () => void

  advance: (dtMs: number) => void
  publish: (nivel: NivelEdicion) => void
  toggleDirecto: () => void
  setNivelAuto: (nivel: NivelEdicion) => void
  catchClip: () => void
  buy: (id: string) => void
  setFormato: (id: string) => void
  resolverEvento: (opcion: number) => void
  irDeVacaciones: () => void
  retirarse: () => void
  elegirFinal: (id: string) => void
  prepararEvento: () => void
  aceptarOferta: (id: string) => void
  rechazarOferta: (id: string) => void
  cerrarResaca: () => void
  unlockAllocation: () => void
  planificar: (indice: number, bloque: BloqueId) => void
  llenarSemanaCon: (bloque: BloqueId) => void
  vivirSemana: () => void
  setSpeed: (m: number) => void
  setPaused: (p: boolean) => void
  reset: (seed?: number) => void
  saveNow: () => void
}

/**
 * Prepara el arranque de la aplicacion.
 *
 * Carga el guardado si lo hay, pero YA NO implica empezar a jugar: el juego
 * abre en el menu y es el jugador quien decide continuar o empezar de cero.
 * Antes de F7 la partida arrancaba sola en el primer frame y no habia forma de
 * saber cuando empezaba ni cuando acababa.
 */
function estadoInicial(): { game: GameState; avisoCarga: string | null; hayGuardado: boolean } {
  const r = cargar()
  if (!r) return { game: createInitialState(), avisoCarga: null, hayGuardado: false }
  if (r.ok) return { game: r.state, avisoCarga: null, hayGuardado: true }
  return {
    game: createInitialState(),
    avisoCarga: `No se pudo recuperar la partida anterior: ${r.motivo}`,
    hayGuardado: false,
  }
}

const inicial = estadoInicial()

/** Acumulador del autoguardado. Fuera del estado: no es parte de la partida. */
let desdeUltimoGuardado = 0

export const useGame = create<GameStore>((set, get) => ({
  game: inicial.game,
  fase: 'menu',
  hayGuardado: inicial.hayGuardado,
  speedMultiplier: 1,
  paused: false,
  avisoCarga: inicial.avisoCarga,

  /**
   * Empezar de cero.
   *
   * Arranca con `avisoCiclo: 1` para que lo primero que vea el jugador sea la
   * entrada del ciclo 1 y no un reproductor con doce cifras y ningun contexto.
   */
  nuevaPartida: (seed) => {
    borrarGuardado()
    desdeUltimoGuardado = 0
    set({
      game: { ...createInitialState(seed), avisoCiclo: 1 },
      fase: 'jugando',
      hayGuardado: false,
      paused: false,
      avisoCarga: null,
    })
  },

  continuar: () => set({ fase: 'jugando', paused: false }),

  // Volver al menu guarda: salir no puede costarte los ultimos diez segundos.
  volverAlMenu: () => {
    guardar(get().game)
    set({ fase: 'menu', hayGuardado: true })
  },

  cerrarAvisoCiclo: () =>
    set((s) => {
      if (s.game.avisoCiclo === null) return s
      const game = { ...s.game, avisoCiclo: null }
      guardar(game)
      return { game }
    }),

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

  // Publicar cuesta material y elige nivel: es una decision, no un tic.
  publish: (nivel) =>
    set((s) => {
      const game = publicar(s.game, nivel)
      if (game === s.game) return s
      guardar(game)
      return { game }
    }),

  // Empezar o cortar el directo. La semana pone el marco, esto el momento.
  toggleDirecto: () =>
    set((s) => {
      const game = alternarDirecto(s.game)
      if (game === s.game) return s
      return { game }
    }),

  setNivelAuto: (nivel) =>
    set((s) => {
      const game = { ...s.game, nivelAuto: nivelValido(nivel) }
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

  // Parar es una decision del jugador, y de las importantes: se guarda.
  irDeVacaciones: () =>
    set((s) => {
      if (!puedeIrseDeVacaciones(s.game)) return s
      const game = irseDeVacaciones({ ...s.game, repartoAntesDeParar: s.game.allocation })
      guardar(game)
      return { game }
    }),

  // Cerrar la partida. Se puede hacer con las condiciones cumplidas o sin
  // ellas: dejarlo sin haber llegado no es perder, es el final por defecto.
  retirarse: () =>
    set((s) => {
      const game = retirarse(s.game, null)
      if (game !== s.game) guardar(game)
      return { game }
    }),

  elegirFinal: (id) =>
    set((s) => {
      if (!s.game.final) return s
      const game = { ...s.game, final: { ...s.game.final, eleccion: id } }
      guardar(game)
      return { game }
    }),

  prepararEvento: () =>
    set((s) => {
      const game = prepararEvento(s.game)
      if (game !== s.game) guardar(game)
      return { game }
    }),

  // Firmar con una marca es de las decisiones que mas duele perder: se guarda
  // al momento, como comprar.
  aceptarOferta: (id) =>
    set((s) => {
      const game = aceptar(s.game, id)
      if (game === s.game) return s
      guardar(game)
      return { game }
    }),

  rechazarOferta: (id) =>
    set((s) => {
      const game = rechazar(s.game, id)
      if (game === s.game) return s
      guardar(game)
      return { game }
    }),

  /**
   * Cerrar el titular de la resaca reanuda la partida.
   *
   * Mismo patron que el aviso de ciclo: el tick vuelve a correr en cuanto
   * `resacaPendiente` deja de ser null.
   */
  cerrarResaca: () =>
    set((s) => {
      if (s.game.resacaPendiente === null) return s
      const game = { ...s.game, resacaPendiente: null }
      guardar(game)
      return { game }
    }),

  unlockAllocation: () =>
    set((s) => {
      const game = desbloquearReparto(s.game)
      guardar(game)
      return { game }
    }),

  /**
   * Colocar una franja.
   *
   * No guarda en cada clic —planificar son veintiun clics seguidos y no hace
   * falta escribir en disco veintiuna veces—; lo guarda `vivirSemana`, que es
   * cuando la decision queda tomada.
   */
  planificar: (indice, bloque) =>
    set((s) => {
      if (s.game.semana.fase !== 'planificando' || !s.game.allocationUnlocked) return s
      const semana = planificarBloque(s.game.semana, indice, bloque)
      if (semana === s.game.semana) return s
      return { game: { ...s.game, semana, allocation: allocationDelPlan(semana.bloques) } }
    }),

  llenarSemanaCon: (bloque) =>
    set((s) => {
      if (s.game.semana.fase !== 'planificando' || !s.game.allocationUnlocked) return s
      const semana = llenarSemana(s.game.semana, bloque)
      return { game: { ...s.game, semana, allocation: allocationDelPlan(semana.bloques) } }
    }),

  // Lanzar la semana es LA decision del juego: se guarda al momento.
  vivirSemana: () =>
    set((s) => {
      if (s.game.semana.fase !== 'planificando') return s
      const game = { ...s.game, semana: { ...s.game.semana, fase: 'viviendo' as const } }
      guardar(game)
      return { game }
    }),

  setSpeed: (m) => set({ speedMultiplier: m }),
  setPaused: (p) => set({ paused: p }),

  reset: (seed) => {
    borrarGuardado()
    desdeUltimoGuardado = 0
    set({ game: createInitialState(seed), paused: false, avisoCarga: null })
  },

  saveNow: () => guardar(get().game),
}))
