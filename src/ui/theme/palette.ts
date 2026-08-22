/**
 * PALETA — FUENTE UNICA DE COLOR DEL PROYECTO
 *
 * ESTADO: PROVISIONAL. Estos valores son un marcador de posicion con buen
 * contraste, elegidos para poder desarrollar sin bloquear. Se sustituiran por
 * la paleta real extraida de los frames de la intro del canal (paso 1 del
 * plan). Sustituirla es editar SOLO este fichero.
 *
 * REGLA DURA: ningun color hexadecimal puede aparecer fuera de aqui, ni en
 * CSS ni en TSX. La comprobacion vive en tests/palette.test.ts.
 */

export const PALETTE = {
  // Neutros — de mas oscuro a mas claro
  ink900: '#0d0b14',
  ink800: '#16131f',
  ink700: '#221d30',
  ink600: '#322a45',
  slate500: '#4d4266',
  slate400: '#6f6188',
  mist300: '#a094b8',
  mist200: '#cfc6de',
  white100: '#f2eef7',

  // Cromaticos
  red500: '#e2445c',
  pink400: '#ef6ea8',
  amber400: '#f5a623',
  lime400: '#7ed957',
  green600: '#2f7a4f',
  cyan400: '#3fc9d6',
  violet400: '#8b6ff0',
  brown600: '#6b4a34',
  bone300: '#d9c8a9',
} as const

export type PaletteKey = keyof typeof PALETTE
export type PaletteColor = (typeof PALETTE)[PaletteKey]

/**
 * Tokens semanticos. La UI referencia SIEMPRE estos, nunca PALETTE
 * directamente: cuando entre la paleta real solo cambian los valores de
 * arriba y el significado se mantiene.
 */
export const TOKENS = {
  bg: PALETTE.ink900,
  bgPanel: PALETTE.ink800,
  bgRaised: PALETTE.ink700,
  border: PALETTE.ink600,
  borderStrong: PALETTE.slate500,
  textDim: PALETTE.slate400,
  textMuted: PALETTE.mist300,
  text: PALETTE.mist200,
  textBright: PALETTE.white100,

  // Un color por recurso — se usa igual en barras, iconos y sparklines
  alcance: PALETTE.cyan400,
  comunidad: PALETTE.amber400,
  calidad: PALETTE.violet400,
  vida: PALETTE.lime400,
  hype: PALETTE.pink400,
  ingresos: PALETTE.green600,
  ideas: PALETTE.bone300,
  fatiga: PALETTE.red500,

  positive: PALETTE.lime400,
  negative: PALETTE.red500,
  warning: PALETTE.amber400,
} as const

export type TokenKey = keyof typeof TOKENS

/** Emite las variables CSS que consume theme.css. */
export function tokensToCssVars(): string {
  return Object.entries(TOKENS)
    .map(([name, value]) => `  --c-${name}: ${value};`)
    .join('\n')
}
