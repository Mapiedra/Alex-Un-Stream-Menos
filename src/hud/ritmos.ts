import { INTERVALO_S, type Historial } from '../sim/historial.ts'

/**
 * A QUE RITMO ESTA PASANDO ESTO.
 *
 * Un incremental sin cifras por segundo obliga a mirar fijamente un numero
 * para adivinar si sube. Media pantalla del juego existe para responder "que
 * estoy generando", y hasta ahora la respuesta habia que deducirla.
 *
 * Se mide sobre el historial que ya se guarda para las curvas y NO
 * reimplementando las formulas del tick. Es deliberado: una segunda copia de
 * la ecuacion de alcance seria una cifra que puede mentir, y una cifra que
 * miente en el sitio mas visible del juego es peor que no ponerla. Esto no
 * calcula lo que deberia estar pasando, mide lo que ha pasado.
 */

export interface Ritmos {
  /** Alcance por segundo de simulacion. Negativo cuando cae, y cae. */
  alcance: number
  comunidad: number
}

/** Cuantas muestras entran en la media. Con tres, ~6 s de ventana. */
const VENTANA = 3

export function ritmos(h: Historial): Ritmos {
  return { alcance: pendiente(h.alcance), comunidad: pendiente(h.comunidad) }
}

/**
 * Pendiente media de las ultimas muestras, por segundo.
 *
 * Con ventana en vez de con las dos ultimas porque el alcance es ruidoso por
 * diseno: un pico de publicacion entre dos muestras daria un ritmo absurdo
 * durante dos segundos y luego otro absurdo al revés.
 */
function pendiente(serie: readonly number[]): number {
  if (serie.length < 2) return 0
  const trozo = serie.slice(-(VENTANA + 1))
  const primero = trozo[0] ?? 0
  const ultimo = trozo[trozo.length - 1] ?? 0
  const segundos = (trozo.length - 1) * INTERVALO_S
  return segundos > 0 ? (ultimo - primero) / segundos : 0
}
