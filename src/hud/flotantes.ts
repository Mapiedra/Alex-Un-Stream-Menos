import { fmt, pct } from '../format.ts'
import type { GameState } from '../sim/state.ts'
import type { TokenKey } from '../ui/theme/palette.ts'

/**
 * LOS NUMEROS QUE SUBEN.
 *
 * Pulsar publicar y ver cambiar un digito en una tabla no se siente como
 * haber hecho algo. Ver salir "+125.000" del sitio exacto donde vive el
 * alcance, si. Es la diferencia entre operar una hoja de calculo y jugar, y
 * cuesta un array de cuatro campos.
 *
 * Van anclados a la celda del recurso que mueven —no a un rincon de la
 * pantalla— porque la mitad del trabajo que hacen es ENSENAR: la primera vez
 * que publicas descubres, sin leer nada, que publicar es una cosa que le pasa
 * al alcance.
 */

/** Los cuatro recursos del marcador. Son los unicos que tienen ancla. */
export type RecursoHud = 'alcance' | 'comunidad' | 'calidad' | 'vida'

export interface Flotante {
  id: number
  recurso: RecursoHud
  texto: string
  token: TokenKey
}

/** Cuanto vive un flotante en pantalla. Lo mismo que dura su animacion. */
export const FLOTANTE_MS = 1600

type Nuevo = Omit<Flotante, 'id'>

/**
 * Umbral por recurso para no llenar la pantalla de ruido.
 *
 * Los recursos 0..1 se mueven en centesimas y los otros en miles: un unico
 * umbral serviria para uno de los dos y sobraria o faltaria en el otro.
 */
const MINIMO: Record<RecursoHud, number> = {
  alcance: 1,
  comunidad: 1,
  calidad: 0.01,
  vida: 0.01,
}

/**
 * Los saltos instantaneos entre dos estados.
 *
 * SOLO vale para acciones que no hacen correr la simulacion —publicar,
 * comprar, responder una tarjeta, firmar—: ahi cualquier diferencia es, por
 * construccion, consecuencia de lo que acaba de pulsar el jugador. Llamarla
 * desde el tick pintaria un flotante por frame, que es exactamente el ruido
 * que esto trata de evitar.
 */
export function saltos(antes: GameState, ahora: GameState): Nuevo[] {
  const salida: Nuevo[] = []

  empujar(salida, 'alcance', ahora.alcance - antes.alcance, (v) => fmt(v))
  empujar(salida, 'comunidad', ahora.comunidad - antes.comunidad, (v) => fmt(v))
  empujar(salida, 'calidad', ahora.calidad - antes.calidad, (v) => v.toFixed(2))
  empujar(salida, 'vida', ahora.vida - antes.vida, (v) => pct(Math.abs(v)))

  return salida
}

function empujar(
  salida: Nuevo[],
  recurso: RecursoHud,
  delta: number,
  formato: (v: number) => string,
): void {
  if (Math.abs(delta) < MINIMO[recurso]) return
  const signo = delta > 0 ? '+' : '−'
  salida.push({
    recurso,
    texto: `${signo}${formato(Math.abs(delta))}`,
    token: delta > 0 ? recurso : 'fatiga',
  })
}

/**
 * Lo que acaba de comprarse, contado donde se va a notar.
 *
 * Una mejora no mueve ningun recurso al pulsarla: mueve un multiplicador que
 * se vera dentro de un rato. Sin esto, comprar es la unica accion del juego
 * sin respuesta, y la mas cara.
 */
export function saltosDeMejora(antes: GameState, ahora: GameState): Nuevo[] {
  const salida: Nuevo[] = []
  const porcentaje = (antes: number, ahora: number) => (ahora / antes - 1) * 100

  if (ahora.multAlcance > antes.multAlcance) {
    salida.push({
      recurso: 'alcance',
      texto: `+${porcentaje(antes.multAlcance, ahora.multAlcance).toFixed(0)}% alcance`,
      token: 'alcance',
    })
  }
  if (ahora.multCalidad > antes.multCalidad) {
    salida.push({
      recurso: 'calidad',
      texto: `+${porcentaje(antes.multCalidad, ahora.multCalidad).toFixed(0)}% calidad`,
      token: 'calidad',
    })
  }
  if (ahora.multEficiencia > antes.multEficiencia) {
    salida.push({
      recurso: 'alcance',
      texto: `+${porcentaje(antes.multEficiencia, ahora.multEficiencia).toFixed(0)}% producción`,
      token: 'ingresos',
    })
  }

  return salida
}
