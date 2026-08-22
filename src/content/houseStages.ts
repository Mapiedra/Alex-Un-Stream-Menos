/**
 * Las seis etapas de casa de la seccion 8 del GDD.
 *
 * La casa es el marcador de progreso mas legible del juego: no hace falta
 * mirar ninguna cifra para saber por donde vas, basta con ver la habitacion.
 *
 * Cada etapa mejora la vida y el trabajo Y ENCARECE EL COSTE DE VIDA. Esa es
 * la tension del tramo final: profesionalizarse aleja el retiro. La cifra de
 * coste vive aqui, junto a la etapa que la justifica, en vez de en una tabla
 * suelta.
 */

export interface HouseStage {
  nivel: number
  nombre: string
  descripcion: string
  /** Coste de vida semanal, en euros. */
  costeVida: number
  /** Que aparece en la escena al llegar a esta etapa. */
  desbloquea: string[]
  /** Funcion narrativa segun el GDD. */
  funcion: string
}

export const HOUSE_STAGES: HouseStage[] = [
  {
    nivel: 0,
    nombre: 'Habitacion inicial',
    descripcion: 'Una mesa, un PC y la cama a dos metros. Empieza todo el mundo asi.',
    costeVida: 8,
    desbloquea: ['mesa', 'pc', 'ventana'],
    funcion: 'Inicio',
  },
  {
    nivel: 1,
    nombre: 'Casa mejorada',
    descripcion: 'Mas espacio y menos ruido. Ya no grabas con la persiana bajada por el eco.',
    costeVida: 16,
    desbloquea: ['estanteria', 'silla', 'lampara'],
    funcion: 'Profesionalizacion',
  },
  {
    nivel: 2,
    nombre: 'Estudio dedicado',
    descripcion: 'Una habitacion solo para grabar. Separar donde trabajas de donde vives cambia mas de lo que parece.',
    costeVida: 28,
    desbloquea: ['panelesAcusticos', 'segundaPantalla', 'micro'],
    funcion: 'Crecimiento',
  },
  {
    nivel: 3,
    nombre: 'Biblioteca',
    descripcion: 'La pared de libros del fondo. Y los libros, que ademas se leen.',
    costeVida: 40,
    desbloquea: ['biblioteca', 'sillon', 'planta'],
    funcion: 'Consolidacion',
  },
  {
    nivel: 4,
    nombre: 'Cocina y ocio',
    descripcion: 'Un sitio para cocinar de verdad y otro para no hacer nada. Ambos hacen falta.',
    costeVida: 52,
    desbloquea: ['cocina', 'sofa', 'consola'],
    funcion: 'Equilibrio',
  },
  {
    nivel: 5,
    nombre: 'Casa consolidada',
    descripcion: 'Ya no es el sitio desde el que trabajas. Es tu casa, y ademas trabajas en ella.',
    costeVida: 66,
    desbloquea: ['gato', 'terraza', 'cuadros'],
    funcion: 'Libertad',
  },
]

export const MAX_HOUSE_STAGE = HOUSE_STAGES.length - 1

export function houseStage(nivel: number): HouseStage {
  const i = Math.min(Math.max(nivel, 0), MAX_HOUSE_STAGE)
  // El indice esta acotado, pero TypeScript no lo sabe.
  return HOUSE_STAGES[i] ?? (HOUSE_STAGES[0] as HouseStage)
}

/** Todo lo visible en la escena a una etapa dada, acumulado desde la primera. */
export function objetosVisibles(nivel: number): string[] {
  return HOUSE_STAGES.filter((h) => h.nivel <= nivel).flatMap((h) => h.desbloquea)
}
