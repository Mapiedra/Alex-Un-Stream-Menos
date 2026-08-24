import { nextFloat, nextInt, type RngState } from './rng.ts'
import { TUNABLES } from './tunables.ts'
import {
  BOT_NICK,
  CHAT_BAJON,
  CHAT_BUENA_RACHA,
  CHAT_CANSANCIO,
  CHAT_COMUNIDAD,
  CHAT_CREDIBILIDAD,
  CHAT_EMOTES,
  CHAT_GENERICAS,
  CHAT_INTEGRIDAD,
  CHAT_PATROCINIO,
  CHAT_PUBLICACION,
  NICKS,
} from '../content/chatLines.ts'

/**
 * El chat como representacion de la comunidad.
 *
 * No es decoracion: el ritmo del chat lo marca el ALCANCE (cuanta gente hay
 * mirando ahora) y las suscripciones las marca la COMUNIDAD (cuanta gente se
 * queda). Un canal con mucho alcance y poca comunidad tiene un chat rapido y
 * vacio; uno con mucha comunidad y poco alcance tiene un chat lento en el que
 * la gente se conoce. Esa diferencia deberia verse sin leer una sola cifra.
 *
 * Determinista: depende solo del estado y del PRNG con semilla.
 */

export type ChatKind = 'msg' | 'emote' | 'sub' | 'resub'

export interface ChatMessage {
  id: number
  nick: string
  /** Indice en NICK_COLORS. Estable para un mismo nick. */
  color: number
  text: string
  kind: ChatKind
}

/** Cuantos mensajes se guardan. Mas arriba es memoria tirada: no se ven. */
export const CHAT_BUFFER = 50

/**
 * Cuantos colores de nick existen. Vive aqui y no en la paleta porque el motor
 * no puede importar nada de ui/: el sim asigna un INDICE y la UI decide que
 * color le corresponde. tests/palette.test.ts comprueba que ambos coinciden.
 */
export const NICK_COLOR_COUNT = 10

export interface ChatInput {
  alcance: number
  comunidad: number
  calidad: number
  fatiga: number
  /** Sube al publicar; hace que el chat reaccione a lo que acaba de pasar. */
  hype: number
  /** Lo que la gente cree que haces por dinero. */
  credibilidad: number
  /** Hay un contrato con una marca corriendo ahora mismo. */
  patrocinado: boolean
}

/** Mensajes por segundo. Satura: un chat de 10.000 no se lee mas rapido. */
export function chatRate(alcance: number): number {
  return (2.5 * alcance) / (alcance + 1500)
}

/** Suscripciones por segundo. Las trae la comunidad, no el alcance. */
export function subRate(comunidad: number): number {
  return comunidad * 0.00012
}

/** Color estable por nick: la misma persona siempre se ve igual. */
export function nickColor(nick: string, palette: number): number {
  let h = 0
  for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) >>> 0
  return h % palette
}

function pick<T>(rng: RngState, arr: readonly T[]): { value: T; rng: RngState } {
  const r = nextInt(rng, 0, arr.length - 1)
  return { value: arr[r.value] as T, rng: r.rng }
}

/**
 * Elige QUE dice el chat segun como va la partida. El chat comenta el estado
 * del canal, y suele darse cuenta del cansancio antes que el jugador.
 */
function elegirTexto(rng: RngState, input: ChatInput): { text: string; rng: RngState } {
  const r = nextFloat(rng)
  const roll = r.value
  let cursor = r.rng

  /**
   * El patrocinio va PRIMERO, por delante incluso del cansancio.
   *
   * Cuando hay una marca en pantalla es de lo unico de lo que habla un chat, y
   * ese es justo el punto: el jugador tiene que ver en el chat lo que le esta
   * costando el dinero, no enterarse por una cifra que baja despacio en otra
   * pestana.
   */
  if (input.patrocinado && roll < 0.22) {
    return remap(pick(cursor, CHAT_PATROCINIO))
  }
  /**
   * El aviso llega ANTES de que la cifra duela, igual que con la fatiga.
   *
   * Ojo a la banda: todas estas ramas comparten la MISMA tirada, asi que una
   * ventana mas ancha arriba tapa entera a la de abajo. Con el patrocinio en
   * 0.30 y esto en 0.28, el chat no podia quejarse jamas mientras hubiera un
   * contrato encima — que es justo cuando tiene que poder hacerlo.
   */
  if (input.credibilidad < UMBRAL_QUEJA && roll < 0.3) {
    return remap(pick(cursor, CHAT_CREDIBILIDAD))
  }
  // Rechazar tiene que SENTIRSE. Un canal grande, sin marcas encima y con la
  // credibilidad intacta es un canal del que la gente presume.
  if (
    !input.patrocinado &&
    input.credibilidad >= UMBRAL_ORGULLO &&
    input.comunidad > 5000 &&
    roll < 0.12
  ) {
    return remap(pick(cursor, CHAT_INTEGRIDAD))
  }
  if (input.fatiga > TUNABLES.fatiga.warningThreshold && roll < 0.25) {
    return remap(pick(cursor, CHAT_CANSANCIO))
  }
  if (input.hype > 0.5 && roll < 0.35) {
    return remap(pick(cursor, CHAT_PUBLICACION))
  }
  if (input.calidad > 2 && roll < 0.2) {
    return remap(pick(cursor, CHAT_BUENA_RACHA))
  }
  if (input.alcance < 200 && input.comunidad > 500 && roll < 0.3) {
    return remap(pick(cursor, CHAT_BAJON))
  }
  if (input.comunidad > 2000 && roll < 0.2) {
    return remap(pick(cursor, CHAT_COMUNIDAD))
  }
  if (roll < 0.45) {
    const p = pick(cursor, CHAT_EMOTES)
    cursor = p.rng
    return { text: p.value, rng: cursor }
  }
  return remap(pick(cursor, CHAT_GENERICAS))
}

/** Por debajo de aqui el chat empieza a decirlo en voz alta. */
const UMBRAL_QUEJA = 0.75

/** Por encima de aqui, y sin marcas encima, el chat lo agradece. */
const UMBRAL_ORGULLO = 0.95

function remap(p: { value: string; rng: RngState }): { text: string; rng: RngState } {
  return { text: p.value, rng: p.rng }
}

export interface ChatStep {
  mensajes: ChatMessage[]
  rng: RngState
  nextId: number
  /** Resto de mensaje acumulado entre ticks, para ritmos por debajo de 1/s. */
  acc: number
}

/**
 * Genera los mensajes de un tick. Devuelve solo los NUEVOS: quien llama se
 * encarga de recortar el buffer.
 */
export function chatStep(
  rng: RngState,
  input: ChatInput,
  dt: number,
  acc: number,
  nextId: number,
): ChatStep {
  const mensajes: ChatMessage[] = []
  let cursor = rng
  let id = nextId
  let pendiente = acc + chatRate(input.alcance) * dt

  // Tope por tick: a velocidad x50 no tiene sentido volcar cientos de lineas.
  let guard = 0
  while (pendiente >= 1 && guard < 8) {
    pendiente -= 1
    guard += 1

    const n = pick(cursor, NICKS)
    cursor = n.rng
    const t = elegirTexto(cursor, input)
    cursor = t.rng

    const esEmote = (CHAT_EMOTES as readonly string[]).includes(t.text)
    mensajes.push({
      id: id++,
      nick: n.value,
      color: nickColor(n.value, NICK_COLOR_COUNT),
      text: t.text,
      kind: esEmote ? 'emote' : 'msg',
    })
  }

  // Suscripciones: las anuncia el bot, como en el canal real.
  const probSub = subRate(input.comunidad) * dt
  const s = nextFloat(cursor)
  cursor = s.rng
  if (s.value < probSub) {
    const n = pick(cursor, NICKS)
    cursor = n.rng
    const meses = nextInt(cursor, 1, 42)
    cursor = meses.rng
    const esResub = meses.value > 1
    mensajes.push({
      id: id++,
      nick: BOT_NICK,
      color: nickColor(BOT_NICK, NICK_COLOR_COUNT),
      text: esResub
        ? `${n.value} lleva ${meses.value} meses suscrito. Gracias!`
        : `Nueva suscripcion de ${n.value}`,
      kind: esResub ? 'resub' : 'sub',
    })
  }

  return { mensajes, rng: cursor, nextId: id, acc: pendiente }
}
