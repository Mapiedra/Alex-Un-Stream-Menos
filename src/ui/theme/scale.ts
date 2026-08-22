/**
 * Escalado por enteros de la escena diegetica.
 *
 * La escena se dibuja siempre a VIRTUAL_W x VIRTUAL_H y se amplia solo por
 * multiplos enteros. Nunca escalado fraccionario: un 1.5x convierte pixeles
 * cuadrados en rectangulos borrosos y rompe toda la estetica.
 */

export const VIRTUAL_W = 480
export const VIRTUAL_H = 270

/** Mayor entero que cabe en el espacio disponible. Nunca baja de 1. */
export function integerScale(availableW: number, availableH: number): number {
  const raw = Math.min(availableW / VIRTUAL_W, availableH / VIRTUAL_H)
  return Math.max(1, Math.floor(raw))
}

/** Tamano final en pixeles de pantalla para un factor de escala dado. */
export function scaledSize(scale: number): { width: number; height: number } {
  return { width: VIRTUAL_W * scale, height: VIRTUAL_H * scale }
}
