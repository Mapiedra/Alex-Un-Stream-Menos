import { aplicarMejoras } from '../shop.ts'
import type { GameState } from '../state.ts'
import { SaveIncompatible, migrar, pareceGameState } from './migrate.ts'

/**
 * Guardado y carga.
 *
 * La serializacion es PURA y vive separada del almacenamiento, para poder
 * testear migraciones sin navegador. `localStorage` solo aparece en las dos
 * funciones del final.
 */

export const CLAVE_GUARDADO = 'lmhv.partida'

export function serializar(state: GameState): string {
  return JSON.stringify(state)
}

export type ResultadoCarga =
  | { ok: true; state: GameState; migrada: boolean }
  | { ok: false; motivo: string }

/**
 * Reconstruye una partida desde JSON, migrando si hace falta.
 *
 * Devuelve un resultado en vez de lanzar: una partida corrupta no debe tumbar
 * la aplicacion, debe ofrecer empezar de nuevo.
 */
export function deserializar(json: string): ResultadoCarga {
  let crudo: unknown
  try {
    crudo = JSON.parse(json)
  } catch {
    return { ok: false, motivo: 'El guardado no es JSON valido.' }
  }

  if (typeof crudo !== 'object' || crudo === null) {
    return { ok: false, motivo: 'El guardado no es un objeto.' }
  }

  const original = crudo as Record<string, unknown>
  const versionOriginal = original['schemaVersion']

  let migrado: Record<string, unknown>
  try {
    migrado = migrar(original)
  } catch (e) {
    if (e instanceof SaveIncompatible) return { ok: false, motivo: e.message }
    throw e
  }

  if (!pareceGameState(migrado)) {
    return { ok: false, motivo: 'El guardado esta incompleto o corrupto.' }
  }

  // Los derivados se recalculan desde `owned` en vez de confiar en lo
  // guardado: si una mejora cambio de efecto entre versiones, la partida
  // cargada refleja el efecto NUEVO y no el que se guardo.
  const state = aplicarMejoras(migrado as unknown as GameState, false)

  return { ok: true, state, migrada: migrado['schemaVersion'] !== versionOriginal }
}

// ---------------------------------------------------------------------------
// Unica frontera con el navegador.

function almacen(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // Modo privado o cookies bloqueadas: se juega igual, sin guardar.
    return null
  }
}

export function guardar(state: GameState): boolean {
  const s = almacen()
  if (!s) return false
  try {
    s.setItem(CLAVE_GUARDADO, serializar(state))
    return true
  } catch {
    return false
  }
}

export function cargar(): ResultadoCarga | null {
  const s = almacen()
  if (!s) return null
  const json = s.getItem(CLAVE_GUARDADO)
  if (!json) return null
  return deserializar(json)
}

export function borrarGuardado(): void {
  almacen()?.removeItem(CLAVE_GUARDADO)
}
