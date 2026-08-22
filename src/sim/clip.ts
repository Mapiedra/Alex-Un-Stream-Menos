import { nextFloat, type RngState } from './rng.ts'
import { TUNABLES } from './tunables.ts'

/**
 * Momento clippeable.
 *
 * El unico clicker del juego, y esta deliberadamente limitado. El GDD (6.1)
 * exige que la interaccion manual sea breve y satisfactoria y que NUNCA se
 * pida hacer clic de forma continua. De ahi el contrato:
 *
 *   - cadencia minima entre apariciones (nunca spam)
 *   - ventana de reaccion holgada (nunca reflejos de competicion)
 *   - fallarlo cuesta un bonus, jamas progreso
 *
 * Una partida entera sin acertar un solo clip tiene que seguir siendo ganable.
 */

export interface ClipState {
  /** Hay un momento clippeable ahora mismo? */
  activo: boolean
  /** Milisegundos de simulacion que le quedan al momento actual. */
  restanteMs: number
  /** Milisegundos hasta el proximo momento. */
  proximoEnMs: number
  /** Milisegundos que queda del bonus por haber acertado. */
  bonusRestanteMs: number
  /** Cuantos se han acertado, para el epilogo y la telemetria. */
  acertados: number
  perdidos: number
}

export function createClipState(): ClipState {
  return {
    activo: false,
    restanteMs: 0,
    proximoEnMs: TUNABLES.clip.minIntervalSeconds * 1000,
    bonusRestanteMs: 0,
    acertados: 0,
    perdidos: 0,
  }
}

/** Multiplicador que aporta el clip acertado, mientras dura. */
export function clipMultiplier(c: ClipState): number {
  return c.bonusRestanteMs > 0 ? TUNABLES.clip.bonusMultiplier : 1
}

export function clipStep(
  c: ClipState,
  rng: RngState,
  dtMs: number,
): { clip: ClipState; rng: RngState } {
  const { reactionWindowSeconds, minIntervalSeconds, maxIntervalSeconds } = TUNABLES.clip
  const bonusRestanteMs = Math.max(0, c.bonusRestanteMs - dtMs)

  if (c.activo) {
    const restanteMs = c.restanteMs - dtMs
    if (restanteMs > 0) {
      return { clip: { ...c, restanteMs, bonusRestanteMs }, rng }
    }
    // Se ha escapado. Cuesta el bonus, no progreso.
    const r = nextFloat(rng)
    const espera = minIntervalSeconds + r.value * (maxIntervalSeconds - minIntervalSeconds)
    return {
      clip: {
        ...c,
        activo: false,
        restanteMs: 0,
        proximoEnMs: espera * 1000,
        bonusRestanteMs,
        perdidos: c.perdidos + 1,
      },
      rng: r.rng,
    }
  }

  const proximoEnMs = c.proximoEnMs - dtMs
  if (proximoEnMs > 0) {
    return { clip: { ...c, proximoEnMs, bonusRestanteMs }, rng }
  }

  return {
    clip: {
      ...c,
      activo: true,
      restanteMs: reactionWindowSeconds * 1000,
      proximoEnMs: 0,
      bonusRestanteMs,
    },
    rng,
  }
}

/** El jugador acierta el momento. Si no habia ninguno, no pasa nada. */
export function clipCatch(c: ClipState, rng: RngState): { clip: ClipState; rng: RngState } {
  if (!c.activo) return { clip: c, rng }
  const { minIntervalSeconds, maxIntervalSeconds, bonusDurationSeconds } = TUNABLES.clip
  const r = nextFloat(rng)
  const espera = minIntervalSeconds + r.value * (maxIntervalSeconds - minIntervalSeconds)
  return {
    clip: {
      ...c,
      activo: false,
      restanteMs: 0,
      proximoEnMs: espera * 1000,
      bonusRestanteMs: bonusDurationSeconds * 1000,
      acertados: c.acertados + 1,
    },
    rng: r.rng,
  }
}
