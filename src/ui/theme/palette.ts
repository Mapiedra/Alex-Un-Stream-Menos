/**
 * PALETA — FUENTE UNICA DE COLOR DEL PROYECTO
 *
 * ORIGEN: extraida por codigo de las referencias en docs/ref/. No hay ningun
 * valor estimado a ojo.
 *
 *   avatar-canal.webp        el avatar del canal: fondo #0c0b22, rim light
 *                            cian #41caee, piel #d9c4b9
 *   intro-calle.png          la calle nocturna de la intro: neones y farolas
 *
 * El cromo de interfaz (#18181b del chat, #a970ff de la barra, los diez
 * colores de nick) salio de dos capturas del directo real que NO estan en el
 * repositorio: contienen nombres y mensajes de espectadores concretos. Los
 * valores extraidos si estan aqui, que es lo unico que hace falta.
 *
 * Tres bloques con tres funciones distintas:
 *   ESCENA   — la calle y el personaje (capa diegetica, pixel art)
 *   CROMO    — el reproductor y el chat (capa de datos, legible)
 *   CHAT     — los colores de nick, que son datos de gente, no decoracion
 *
 * REGLA DURA: ningun color hexadecimal puede aparecer fuera de aqui, ni en
 * CSS ni en TSX. La comprobacion vive en tests/palette.test.ts.
 */

export const PALETTE = {
  // ===== ESCENA — sombras de la calle. Purpura profundo, nunca negro puro ===
  night950: '#08060c',
  night900: '#0c0b22',
  night850: '#0a0a16',
  night800: '#141123',
  night700: '#1e1e3f',
  night600: '#39334e',
  slate500: '#525097',
  slate400: '#5b525e',
  mist300: '#868688',
  mist200: '#cccccd',
  white100: '#fbfaf7',

  // ===== ESCENA — neones, extraidos por familia de tono ====================
  /** Farolas y ventanas calidas: el color mas presente de toda la intro. */
  lamp400: '#f08e09',
  lamp300: '#ffb357',
  /** El cian de las gafas del avatar y de los rotulos. */
  cyan400: '#41caee',
  cyan300: '#0ae6f6',
  cyan600: '#2b61ac',
  /** El rosa del rotulo vertical. */
  pink400: '#ea4879',
  pink300: '#df5aa2',
  /** El rojo del rotulo ENERGY. */
  red500: '#ff621b',
  /** Verdes de las pantallas de pixeles. */
  green400: '#25b11e',
  green300: '#0fb621',
  /** El amarillo verdoso de los carteles. */
  acid400: '#ccd42d',
  /** Violetas de los neones altos. */
  violet500: '#752ca6',
  violet600: '#4a24a4',
  /** Azul de la lluvia y del cristal. */
  rain400: '#4e91e7',
  /** Piel del personaje. */
  skin300: '#d9c4b9',
  skin500: '#b58c8e',

  // ===== CROMO — el reproductor y el chat ==================================
  /** Fondo del panel de chat. */
  ui900: '#18181b',
  /** Cabecera del chat y superficies elevadas. */
  ui800: '#26262c',
  /** Fondo del reproductor, practicamente negro. */
  ui950: '#020204',
  uiText: '#d8d8da',
  uiTextMuted: '#868688',
  uiTextDim: '#666669',
  /** Acento morado de la barra de progreso. */
  accent400: '#a970ff',

  // ===== CHAT — los colores de nick por defecto de la plataforma ===========
  nick01: '#ff4500',
  nick02: '#ffa62b',
  nick03: '#caf22f',
  nick04: '#a9f85b',
  nick05: '#00ff7f',
  nick06: '#00e1ff',
  nick07: '#317eff',
  nick08: '#bf31fe',
  nick09: '#d628ae',
  nick10: '#ff0007',
} as const

export type PaletteKey = keyof typeof PALETTE
export type PaletteColor = (typeof PALETTE)[PaletteKey]

/** Los colores que puede tomar el nick de alguien en el chat. */
export const NICK_COLORS = [
  PALETTE.nick01,
  PALETTE.nick02,
  PALETTE.nick03,
  PALETTE.nick04,
  PALETTE.nick05,
  PALETTE.nick06,
  PALETTE.nick07,
  PALETTE.nick08,
  PALETTE.nick09,
  PALETTE.nick10,
] as const

/**
 * Tokens semanticos. La UI referencia SIEMPRE estos, nunca PALETTE
 * directamente.
 */
export const TOKENS = {
  // Cromo del reproductor
  bg: PALETTE.ui950,
  bgPanel: PALETTE.ui900,
  bgRaised: PALETTE.ui800,
  border: PALETTE.ui800,
  borderStrong: PALETTE.slate400,
  textDim: PALETTE.uiTextDim,
  textMuted: PALETTE.uiTextMuted,
  text: PALETTE.uiText,
  textBright: PALETTE.white100,
  accent: PALETTE.accent400,

  /**
   * Un color por recurso, cada uno trazable a la referencia.
   *
   * El reparto no es decorativo: ALCANCE es el cian frio de los rotulos, que
   * grita y se apaga; COMUNIDAD es el ambar calido de las farolas y las
   * ventanas, que es donde hay gente. El jugador deberia poder leer la tesis
   * del juego en los colores antes de entender las formulas.
   */
  alcance: PALETTE.cyan300,
  comunidad: PALETTE.lamp300,
  calidad: PALETTE.violet500,
  vida: PALETTE.green300,
  hype: PALETTE.pink300,
  ingresos: PALETTE.acid400,
  ideas: PALETTE.rain400,
  fatiga: PALETTE.red500,
  /**
   * CREDIBILIDAD: la piel del avatar. Es, literalmente, la cara que das.
   *
   * No es un color de neon como los demas recursos y es a proposito: la
   * credibilidad no es una cifra del canal, es algo tuyo.
   */
  credibilidad: PALETTE.skin300,

  // Escena
  sceneSky: PALETTE.night900,
  sceneFar: PALETTE.night850,
  sceneMid: PALETTE.night800,
  sceneNear: PALETTE.night700,
  sceneEdge: PALETTE.night600,
  lamp: PALETTE.lamp400,
  lampGlow: PALETTE.lamp300,
  rain: PALETTE.rain400,
  skin: PALETTE.skin300,
  skinShade: PALETTE.skin500,

  // Estados
  positive: PALETTE.green400,
  negative: PALETTE.red500,
  warning: PALETTE.lamp300,
  live: PALETTE.nick10,
  glow: PALETTE.cyan400,
  glowAlt: PALETTE.pink400,
} as const

export type TokenKey = keyof typeof TOKENS

/** Emite las variables CSS que consume theme.css. */
export function tokensToCssVars(): string {
  return Object.entries(TOKENS)
    .map(([name, value]) => `  --c-${name}: ${value};`)
    .join('\n')
}
