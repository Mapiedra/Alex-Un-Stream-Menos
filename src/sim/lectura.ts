import { LIBROS, LIBRO_POR_ID, SINERGIAS, type Libro, type TemaLibro } from '../content/books.ts'
import { TUNABLES } from './tunables.ts'
import type { BloqueId } from './semana.ts'
import type { GameState } from './state.ts'

/**
 * Leer.
 *
 * La queja que lo origino fue exacta: leer no es algo que pase gratis antes de
 * dormir, es tiempo del dia a dia que gastas en ello. Asi que aqui leer cuesta
 * franjas — enteras si eliges la franja de leer, a medias si simplemente
 * vives— y lo que deja tarda en llegar: hay que terminarse el libro.
 *
 * Terminar uno da ideas de golpe y unas semanas de tirar de lo leido. Y deja
 * poso: los libros del mismo tema acumulan una sinergia permanente y pequeña.
 * Pequeña a proposito — si leer saliese a cuenta como estrategia dejaria de
 * ser leer y seria otro generador.
 */

export interface Lectura {
  /** Libro en la mesilla. null si no hay ninguno empezado. */
  libro: string | null
  /** Segundos de lectura acumulados en el libro actual. */
  progreso: number
  /** Libros terminados, en orden. Es la coleccion. */
  leidos: string[]
}

export function crearLectura(): Lectura {
  return { libro: null, progreso: 0, leidos: [] }
}

/**
 * Cuanto avanza la lectura en esta franja.
 *
 * La franja de leer avanza a ritmo pleno. La de vivir avanza a medias: entre
 * cocinar, salir y ver algo tambien caen paginas, pero no las mismas.
 */
export function ritmoDeLectura(bloque: BloqueId, nivelHabito: number): number {
  const { porSegundoLeyendo, fraccionViviendo, porNivelDeHabito } = TUNABLES.lectura
  const base =
    bloque === 'leer'
      ? porSegundoLeyendo
      : bloque === 'vida'
        ? porSegundoLeyendo * fraccionViviendo
        : 0
  if (base === 0) return 0
  // El habito no crea tiempo: hace que cunda el que ya dedicas.
  return base * (1 + porNivelDeHabito * nivelHabito)
}

/** Libros que pueden acabar en la mesilla ahora mismo. */
export function candidatos(state: Pick<GameState, 'cycle' | 'lectura'>): Libro[] {
  const leidos = new Set(state.lectura.leidos)
  return LIBROS.filter((l) => !leidos.has(l.id) && state.cycle >= (l.desdeCiclo ?? 1))
}

/**
 * Elige el siguiente libro.
 *
 * Determinista y sin azar: coge el primero disponible del catalogo, que esta
 * ordenado de mas ligero a mas tocho. Cuando no queda ninguno, se relee — y el
 * juego lo dice sin dramatismo.
 */
export function siguienteLibro(state: Pick<GameState, 'cycle' | 'lectura'>): string | null {
  const libres = candidatos(state)
  return libres[0]?.id ?? null
}

export interface AvanceLectura {
  lectura: Lectura
  /** Libro terminado en este paso, si lo hubo. */
  terminado: Libro | null
}

/**
 * Avanza la lectura un paso de simulacion.
 *
 * Puro, como todo el motor. Devuelve tambien el libro terminado para que quien
 * llame pueda repartir las ideas y el modificador sin que este modulo tenga
 * que saber nada del resto del estado.
 */
export function avanzarLectura(
  state: Pick<GameState, 'cycle' | 'lectura' | 'owned'>,
  bloque: BloqueId,
  dt: number,
): AvanceLectura {
  const ritmo = ritmoDeLectura(bloque, state.owned['leer'] ?? 0)
  if (ritmo <= 0) return { lectura: state.lectura, terminado: null }

  // Sin libro empezado, se coge uno: el hueco de la mesilla se llena solo.
  const id = state.lectura.libro ?? siguienteLibro(state)
  if (!id) return { lectura: state.lectura, terminado: null }

  const libro = LIBRO_POR_ID.get(id)
  if (!libro) return { lectura: { ...state.lectura, libro: null }, terminado: null }

  const progreso = (state.lectura.libro === id ? state.lectura.progreso : 0) + ritmo * dt
  if (progreso < libro.paginas) {
    return { lectura: { ...state.lectura, libro: id, progreso }, terminado: null }
  }

  return {
    lectura: { libro: null, progreso: 0, leidos: [...state.lectura.leidos, id] },
    terminado: libro,
  }
}

/** Cuantos libros leidos hay de cada tema. */
export function porTema(leidos: readonly string[]): Record<TemaLibro, number> {
  const cuenta: Record<TemaLibro, number> = { novela: 0, ensayo: 0, oficio: 0, raro: 0 }
  for (const id of leidos) {
    const libro = LIBRO_POR_ID.get(id)
    if (libro) cuenta[libro.tema] += 1
  }
  return cuenta
}

/** Sinergias que ya estan activas con la coleccion actual. */
export function sinergiasActivas(leidos: readonly string[]) {
  const cuenta = porTema(leidos)
  return SINERGIAS.filter((s) => cuenta[s.tema] >= s.minimo)
}

export interface BonosLectura {
  calidad: number
  eficiencia: number
  afinidad: number
}

/** Lo que aporta la coleccion, acumulado. Siempre pequeño. */
export function bonosDeColeccion(leidos: readonly string[]): BonosLectura {
  let calidad = 1
  let eficiencia = 1
  let afinidad = 1
  for (const s of sinergiasActivas(leidos)) {
    calidad *= s.multCalidad ?? 1
    eficiencia *= s.multEficiencia ?? 1
    afinidad *= s.multAfinidad ?? 1
  }
  return { calidad, eficiencia, afinidad }
}
