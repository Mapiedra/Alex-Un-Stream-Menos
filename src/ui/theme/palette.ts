/**
 * PALETA — FUENTE UNICA DE COLOR DEL PROYECTO
 *
 * ORIGEN: la intro pixel art del canal. Dos referencias:
 *   1. El avatar: base casi negra azulada, rim light cian y magenta, gafas
 *      cian brillante, piel y pelo calidos oscuros.
 *   2. La calle nocturna: fondo purpura profundo con lluvia, neones en cian,
 *      magenta, verde, ambar y rojo, conos volumetricos de farola, y —lo mas
 *      importante— ventanas de luz CALIDA recortadas contra el frio de la
 *      calle.
 *
 * Ese contraste frio/calor es el eje de la paleta y del juego: el neon de
 * fuera llama la atencion y se apaga; la luz de las ventanas es donde hay
 * gente que se queda. Alcance y comunidad se pintan exactamente asi.
 *
 * PRECISION: valores leidos de las imagenes, no extraidos por codigo. Para
 * clavarlos al pixel, guardar los PNG en docs/ref/ y reextraer.
 *
 * REGLA DURA: ningun color hexadecimal puede aparecer fuera de aqui, ni en
 * CSS ni en TSX. La comprobacion vive en tests/palette.test.ts.
 */

export const PALETTE = {
  // --- Base: purpura profundo de la calle, no negro puro. La sombra tiene color.
  night950: '#0c0817',
  night900: '#150f24',
  night800: '#1e1633',
  night700: '#2d2145',
  night600: '#3d2d5c',
  slate500: '#4a4470',
  slate400: '#6b6490',
  mist300: '#9d95b8',
  mist200: '#c9c3dc',
  white100: '#f0ecfa',

  // --- Neon frio: el cian de las gafas, los carteles y los expendedores
  cyan300: '#7ff5ff',
  cyan400: '#4ee0f0',
  cyan600: '#2593a8',

  // --- Neon caliente: el magenta que grita desde los rotulos
  pink300: '#ff6bb5',
  pink400: '#f04a9c',
  pink600: '#b02a6b',

  // --- Luz calida de ventana: donde hay gente dentro
  amber300: '#ffd966',
  amber400: '#f5c542',
  olive400: '#d4c67a',
  olive600: '#8f8450',

  // --- Neon verde del rotulo y de las pantallas
  green400: '#7ef05a',
  green600: '#3d8f38',

  // --- Rojo de aviso: el rotulo vertical de la calle
  red400: '#ff6b4a',
  red500: '#f0483c',

  // --- Violeta de los neones altos
  violet400: '#a06bf0',

  // --- La luna de cara palida sobre los tejados
  moon200: '#f5c6d0',

  // --- Materia: piel, pelo, madera de la valla, asfalto mojado
  skin300: '#c98f6a',
  skin500: '#8f5a3f',
  hair700: '#2b2733',
  wood500: '#7d5540',
  wood700: '#4a3225',
  asphalt600: '#2a3a52',
  asphalt400: '#3d4f6b',
} as const

export type PaletteKey = keyof typeof PALETTE
export type PaletteColor = (typeof PALETTE)[PaletteKey]

/**
 * Tokens semanticos. La UI referencia SIEMPRE estos, nunca PALETTE
 * directamente: cuando lleguen los frames exactos solo cambian los valores de
 * arriba y el significado se mantiene.
 */
export const TOKENS = {
  bg: PALETTE.night950,
  bgPanel: PALETTE.night900,
  bgRaised: PALETTE.night800,
  border: PALETTE.night700,
  borderStrong: PALETTE.night600,
  textDim: PALETTE.slate400,
  textMuted: PALETTE.mist300,
  text: PALETTE.mist200,
  textBright: PALETTE.white100,

  /**
   * Un color por recurso, cada uno trazable a algo de la referencia.
   *
   * El reparto no es decorativo: ALCANCE es el neon frio que grita desde la
   * calle y se apaga, COMUNIDAD es la luz calida de las ventanas con gente
   * dentro. El jugador debe poder leer la tesis del juego en los colores
   * antes de entender las formulas.
   */
  alcance: PALETTE.cyan400,
  comunidad: PALETTE.amber400,
  calidad: PALETTE.violet400,
  vida: PALETTE.green400,
  hype: PALETTE.pink400,
  ingresos: PALETTE.olive400,
  ideas: PALETTE.moon200,
  fatiga: PALETTE.red500,

  // Materia de la escena
  skin: PALETTE.skin300,
  skinShade: PALETTE.skin500,
  hair: PALETTE.hair700,
  wood: PALETTE.wood500,
  woodShade: PALETTE.wood700,
  street: PALETTE.asphalt600,
  streetLit: PALETTE.asphalt400,

  // Estados
  positive: PALETTE.green400,
  negative: PALETTE.red500,
  warning: PALETTE.amber400,

  /** Halos de neon. Frio para el alcance, caliente para el hype. */
  glow: PALETTE.cyan300,
  glowAlt: PALETTE.pink300,
  /** Luz de farola: el cono volumetrico de la referencia. */
  lamp: PALETTE.amber300,
} as const

export type TokenKey = keyof typeof TOKENS

/** Emite las variables CSS que consume theme.css. */
export function tokensToCssVars(): string {
  return Object.entries(TOKENS)
    .map(([name, value]) => `  --c-${name}: ${value};`)
    .join('\n')
}
