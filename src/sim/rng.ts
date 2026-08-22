/**
 * PRNG con semilla (mulberry32).
 *
 * El motor NUNCA usa Math.random: el estado guarda su propia semilla, de modo
 * que dos ejecuciones con la misma semilla y las mismas acciones producen
 * exactamente la misma partida. Sin esto, el banco de balance no sirve para
 * nada y los bugs no se pueden reproducir.
 */

export interface RngState {
  seed: number
}

export function createRng(seed: number): RngState {
  return { seed: seed >>> 0 }
}

/** Devuelve [0,1) y el nuevo estado. Puro: no muta la entrada. */
export function nextFloat(rng: RngState): { value: number; rng: RngState } {
  let t = (rng.seed + 0x6d2b79f5) >>> 0
  const next = t
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, rng: { seed: next } }
}

/** Entero en [min, max] inclusive. */
export function nextInt(rng: RngState, min: number, max: number): { value: number; rng: RngState } {
  const { value, rng: next } = nextFloat(rng)
  return { value: min + Math.floor(value * (max - min + 1)), rng: next }
}

/** true con probabilidad p. */
export function chance(rng: RngState, p: number): { value: boolean; rng: RngState } {
  const { value, rng: next } = nextFloat(rng)
  return { value: value < p, rng: next }
}
