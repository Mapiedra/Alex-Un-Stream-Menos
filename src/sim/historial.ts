/**
 * Historial de alcance y comunidad para las sparklines.
 *
 * La tesis del juego es que el alcance sube rapido y cae con facilidad
 * mientras la comunidad crece lento y se queda. Si esa diferencia solo existe
 * en las formulas, el jugador nunca la percibe: dos numeros subiendo se
 * parecen mucho. Dibujadas una al lado de otra, la diferencia salta a la vista
 * en el primer bajon.
 *
 * Se guarda en el estado (y por tanto en la partida) porque una grafica que
 * se borra al recargar no sirve para leer una tendencia.
 */

/** Cuantas muestras guarda cada serie. Con una cada 2 s son ~2 min de curva. */
export const MUESTRAS = 60

/** Segundos de simulacion entre muestra y muestra. */
export const INTERVALO_S = 2

export interface Historial {
  alcance: number[]
  comunidad: number[]
  /** Segundos acumulados desde la ultima muestra. */
  acc: number
}

export function crearHistorial(): Historial {
  return { alcance: [], comunidad: [], acc: 0 }
}

/**
 * Toma una muestra si toca. Devuelve el mismo objeto si no, para que React no
 * vuelva a pintar las graficas diez veces por segundo sin motivo.
 */
export function muestrear(h: Historial, alcance: number, comunidad: number, dt: number): Historial {
  const acc = h.acc + dt
  if (acc < INTERVALO_S) return { ...h, acc }

  return {
    alcance: empujar(h.alcance, alcance),
    comunidad: empujar(h.comunidad, comunidad),
    acc: acc % INTERVALO_S,
  }
}

function empujar(serie: number[], valor: number): number[] {
  const siguiente = serie.length >= MUESTRAS ? serie.slice(1) : serie.slice()
  siguiente.push(valor)
  return siguiente
}

/**
 * Normaliza una serie a 0..1 sobre su propio maximo.
 *
 * Cada serie usa su propia escala a proposito: no interesa comparar magnitudes
 * (la comunidad siempre sera mas pequena que el alcance), interesa comparar
 * FORMAS. Una que sube y baja frente a otra que solo sube.
 */
export function normalizar(serie: number[]): number[] {
  if (serie.length === 0) return []
  const max = Math.max(...serie)
  if (max <= 0) return serie.map(() => 0)
  return serie.map((v) => v / max)
}

/** Tendencia reciente en tanto por uno. Positiva sube, negativa cae. */
export function tendencia(serie: number[], ventana = 10): number {
  if (serie.length < 2) return 0
  const trozo = serie.slice(-ventana)
  const primero = trozo[0] ?? 0
  const ultimo = trozo[trozo.length - 1] ?? 0
  if (primero === 0) return ultimo > 0 ? 1 : 0
  return (ultimo - primero) / primero
}
