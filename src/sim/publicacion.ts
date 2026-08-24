import { TUNABLES } from './tunables.ts'
import type { BloqueId } from './semana.ts'

/**
 * Material y niveles de edicion.
 *
 * Antes de F7 publicar era un boton sin coste, sin limite y sin espera: se
 * podia pulsar infinitamente rapido y lo unico que lo frenaba era que el hype
 * decae. Ahora publicar gasta MATERIAL, y el material sale de las horas.
 *
 * De ahi salen dos decisiones que antes no existian:
 *
 *   1. Emitir o editar. Emitir trae gente y graba de paso; editar no trae a
 *      nadie pero es donde salen los videos. Una semana entera en directo se
 *      queda sin nada que subir.
 *   2. Como sacarlo. Rapido rinde hoy —pico y hype— y cuidado rinde siempre,
 *      porque lo que entra al catalogo es lo que sigue pagando dentro de tres
 *      años. Es la tesis del juego metida en un boton.
 */

export type NivelEdicion = 'rapido' | 'normal' | 'cuidado'

export const NIVELES: readonly NivelEdicion[] = ['rapido', 'normal', 'cuidado'] as const

export const NIVEL_POR_DEFECTO: NivelEdicion = 'normal'

export interface Nivel {
  material: number
  peso: number
  pico: number
  hype: number
}

export function nivel(id: NivelEdicion): Nivel {
  return TUNABLES.publicacion.niveles[id]
}

export const NOMBRE_NIVEL: Record<NivelEdicion, string> = {
  rapido: 'Sacarlo ya',
  normal: 'Montarlo bien',
  cuidado: 'Cuidarlo',
}

export const DESCRIPCION_NIVEL: Record<NivelEdicion, string> = {
  rapido: 'Un corte rapido y fuera. Poco material, mucho ruido hoy y poco mañana.',
  normal: 'Lo de siempre: se monta, se sube, cumple.',
  cuidado: 'Le metes horas. Hace menos ruido al salir y renta el doble para siempre.',
}

/** Cuanto material cuesta publicar a ese nivel. */
export function costeMaterial(id: NivelEdicion): number {
  return nivel(id).material
}

/** Hay material para sacarlo a ese nivel? */
export function hayMaterial(material: number, id: NivelEdicion): boolean {
  return material >= costeMaterial(id)
}

/**
 * Material por segundo que genera la franja en curso.
 *
 * Solo producen las dos franjas de producir, y solo si el canal no esta
 * parado: de vacaciones no se graba. Escala con la eficiencia, que es lo que
 * suben las mejoras de flujo de trabajo — asi la tienda cobra sentido
 * retroactivo: montar plantillas SI hace que salgan mas videos.
 */
export function materialPorSegundo(
  bloque: BloqueId,
  emitiendo: boolean,
  eficiencia: number,
): number {
  const { porSegundoEmitiendo, porSegundoEditando } = TUNABLES.publicacion
  if (emitiendo) return porSegundoEmitiendo * eficiencia
  if (bloque === 'editar') return porSegundoEditando * eficiencia
  return 0
}

/** Acumula material sin pasarse del tope. */
export function acumularMaterial(actual: number, delta: number): number {
  return Math.min(TUNABLES.publicacion.maximo, Math.max(0, actual + delta))
}

/** Lee un nivel de edicion de un valor cualquiera, con plan B. */
export function nivelValido(valor: unknown): NivelEdicion {
  return NIVELES.includes(valor as NivelEdicion) ? (valor as NivelEdicion) : NIVEL_POR_DEFECTO
}
