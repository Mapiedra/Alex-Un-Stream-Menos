import type { Epilogo } from '../sim/final.ts'

/**
 * La escena final y los tres epilogos.
 *
 * REGLA DE TONO (secciones 15 y 16 del GDD): humor observacional y meta, sin
 * convertir a la persona real en una caricatura. Los eventos personales se
 * tratan con ligereza y respeto. Aqui, ademas, el final tiene que sostener el
 * mensaje entero del juego, asi que no hay guinos ni chistes: se dice lo que
 * hay y se deja al jugador tranquilo.
 *
 * NO HAY DERROTA. "La rueda" no es un final malo: es el final por defecto de
 * quien decide parar sin haber llegado al umbral, y se cuenta con respeto.
 *
 * "Salio a cuenta" tampoco es una derrota, y es el que mas cuidado pide: quien
 * llega ahi ha ganado en todo lo que el juego mide, y el epilogo no puede
 * regoderse ni darle una leccion. Lo unico que hace es contar lo que no se
 * medía. Sin moraleja y sin senalar: se dice lo que hay.
 */

export const PREGUNTA_FINAL =
  '¿A qué quieres dedicar el tiempo ahora?'

export const SUBTITULO_FINAL =
  'No es una pregunta con truco. Ya no tienes que elegir lo que más rinda.'

export interface OpcionFinal {
  id: string
  texto: string
  /** Como se cierra el epilogo si elige esto. */
  cierre: string
}

export const OPCIONES_FINALES: OpcionFinal[] = [
  {
    id: 'jugar',
    texto: 'Jugar, sin más',
    cierre:
      'Enciendes algo que no tiene nada que ver con el canal. Nadie está esperando el clip. Está bien.',
  },
  {
    id: 'leer',
    texto: 'Leer',
    cierre:
      'Hay una pila de libros que llevaba dos años esperando. Ninguno de ellos va a acabar siendo un directo, y precisamente por eso apetecen.',
  },
  {
    id: 'cocinar',
    texto: 'Cocinar algo con calma',
    cierre:
      'Sin cámara, sin plano cenital, sin que quede bien. Simplemente comer bien un martes cualquiera.',
  },
  {
    id: 'series',
    texto: 'Ver una serie entera de golpe',
    cierre:
      'Cuatro capítulos seguidos y sin tomar notas. Si sale algo de aquí, saldrá solo.',
  },
  {
    id: 'emitir',
    texto: 'Emitir, pero porque me apetece',
    cierre:
      'Enciendes igualmente. La diferencia no está en lo que haces: está en que hoy podrías no hacerlo.',
  },
]

export interface TextoEpilogo {
  titulo: string
  /** Parrafos del epilogo, antes del cierre de la eleccion. */
  cuerpo: string[]
  /** Linea extra si la partida paso por algun burnout. */
  conBurnout: string
  /** Linea extra si nunca se quemo. */
  sinBurnout: string
}

export const EPILOGOS: Record<Epilogo, TextoEpilogo> = {
  comodo: {
    titulo: 'Se sostiene solo',
    cuerpo: [
      'Los vídeos que subiste hace años siguen dando de comer. No mucho cada uno, pero todos a la vez sí, y no hay que hacer nada para que sigan ahí.',
      'La gente que se quedó no se quedó por el juego de turno. Se quedó por lo otro, por lo que no se puede medir bien, y eso resulta que también aguanta las semanas que no apareces.',
      'Nadie te ha dado permiso. Simplemente un día echas la cuenta y ves que no hace falta.',
    ],
    conBurnout:
      'Costó aprenderlo por las malas, pero se aprendió.',
    sinBurnout:
      'Y lo mejor: llegaste entero.',
  },
  justo: {
    titulo: 'Da justo',
    cuerpo: [
      'Las cuentas salen. No sobran, pero salen. Puedes parar sin que se hunda nada.',
      'Vas a tener que mirar el banco de vez en cuando, y probablemente vuelvas a emitir más de lo que dirías ahora mismo. Tampoco pasa nada.',
      'Lo importante es que ya no es obligatorio. Y hace tres años lo era todos los días.',
    ],
    conBurnout: 'Con algún susto por el camino, pero aquí estás.',
    sinBurnout: 'Sin haberte roto por el camino, que no es poco.',
  },
  vendido: {
    titulo: 'Salió a cuenta',
    cuerpo: [
      'Las cuentas salen, y salen con holgura. Nadie puede decir que no funcionara: cada vez que te pusieron una cifra delante dijiste que sí, y las cifras eran de verdad.',
      'Lo raro es el chat. Sigue habiendo gente, sigue habiendo mensajes, y aun así hay algo que se movió de sitio en algún momento y no volvió. La gente que se quedó no se quedó del todo. Miran el directo como se mira un programa: está bien, lo ponen, no discuten con él.',
      'De vez en cuando alguien saca por ahí un clip de hace tres años, de una de aquellas semanas, y se lo pasan entre ellos. No con rencor. Con esa cosa peor que es la costumbre.',
      'Puedes parar cuando quieras. Eso lo conseguiste. Lo otro —lo de que hubiera alguien esperando a que volvieras— resulta que se pagaba en la misma moneda que fuiste gastando.',
    ],
    conBurnout: 'Y encima te costó la salud por el camino, que ya es tener mala suerte.',
    sinBurnout: 'Llegaste entero. Eso también cuenta, aunque hoy no lo parezca.',
  },
  rueda: {
    titulo: 'Sigues ahí',
    cuerpo: [
      'No llegaste a ese punto en el que se podía soltar. Igual el mes que viene, igual el año que viene.',
      'Tampoco es un fracaso. Has construido algo que existe, que le importa a un montón de gente y que hace tres años no estaba. Eso pasa poco.',
      'Mañana hay directo. Y probablemente esté bien.',
    ],
    conBurnout:
      'Habría que aprender a parar antes de que te paren. Sigue pendiente.',
    sinBurnout: 'Al menos has sabido llevarlo sin romperte.',
  },
}

/** Como se llama cada epilogo en la pantalla de resumen. */
export const NOMBRE_EPILOGO: Record<Epilogo, string> = {
  comodo: 'Retiro cómodo',
  justo: 'Retiro justo',
  vendido: 'Salió a cuenta',
  rueda: 'La rueda',
}
