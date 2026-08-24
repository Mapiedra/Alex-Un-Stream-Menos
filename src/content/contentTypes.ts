import type { ActivityId } from '../sim/state.ts'

/**
 * Los diez formatos de contenido de la seccion 5 del GDD.
 *
 * Elegir formato es la decision estrategica central de la partida: no cambia
 * cuanto trabajas, cambia EN QUE se convierte tu trabajo. Un juego popular
 * llena la calle de gente que se va; una charla no trae a casi nadie y casi
 * nadie se va. La tabla del GDD, traducida a numeros:
 *
 *   alcance    cuanta gente te descubre por hora dedicada
 *   afinidad   que fraccion de esa gente se queda (la conversion a comunidad)
 *   calidad    multiplicador de calidad propio del formato
 *   coste      cuanta fatiga genera por hora, relativo al normal
 */
export interface ContentType {
  id: string
  nombre: string
  /** Titulo del directo, tal y como aparece en la cabecera del reproductor. */
  titulo: string
  descripcion: string
  alcance: number
  afinidad: number
  calidad: number
  /** Multiplicador de fatiga. Por debajo de 1, descansa mientras lo haces. */
  coste: number
  /** Actividad a la que este formato dedica su tiempo de verdad. */
  actividad: ActivityId
  /** Se desbloquea comprando esta mejora. Sin ella, esta disponible siempre. */
  requiere?: string
  /** Ingresos directos relativos. Los solidarios no generan nada. */
  ingresos?: number
}

export const CONTENT_TYPES: ContentType[] = [
  {
    id: 'popular',
    nombre: 'Juego popular',
    titulo: 'EL JUEGO DEL MOMENTO — a ver de que va tanto ruido',
    descripcion:
      'Mucha gente entrando, poca quedandose. Es como se crece, no como se construye.',
    alcance: 1.6,
    afinidad: 0.5,
    calidad: 0.95,
    coste: 1.15,
    actividad: 'produccion',
  },
  {
    id: 'directo',
    nombre: 'Directo normal',
    titulo: 'Directo de tarde, lo que salga',
    descripcion: 'La base de la carrera. Ni pico ni consolidacion: constancia.',
    alcance: 1,
    afinidad: 1,
    calidad: 1,
    coste: 1,
    actividad: 'produccion',
  },
  {
    id: 'nicho',
    nombre: 'Juego de nicho',
    titulo: 'Un indie raro que nadie ha jugado (y deberiais)',
    descripcion: 'Entra menos gente, pero la que entra es la que se queda.',
    alcance: 0.5,
    afinidad: 2.2,
    calidad: 1.25,
    coste: 0.9,
    actividad: 'produccion',
    requiere: 'nicho',
  },
  {
    id: 'charla',
    nombre: 'Charla',
    titulo: 'Solo hablar un rato',
    descripcion:
      'Sin juego de por medio. Casi nadie te descubre asi; casi nadie se va.',
    alcance: 0.25,
    afinidad: 3.5,
    calidad: 1.2,
    coste: 0.8,
    actividad: 'comunidad',
    requiere: 'charlas',
  },
  {
    id: 'club',
    nombre: 'Club de lectura',
    titulo: 'FRANKENSTEIN de Mary Shelley (1818)',
    descripcion:
      'El formato que menos alcance da y mas comunidad construye. Y ademas se lee.',
    alcance: 0.15,
    afinidad: 5,
    calidad: 1.3,
    coste: 0.7,
    actividad: 'comunidad',
    requiere: 'club',
  },
  {
    id: 'series',
    nombre: 'Ver series y peliculas',
    titulo: 'Reaccion / cine de sobremesa',
    descripcion: 'Alcance casi cero. Genera ideas y bienestar, y da tema de conversacion.',
    alcance: 0.1,
    afinidad: 1.2,
    calidad: 1,
    coste: 0.4,
    actividad: 'vida',
  },
  {
    id: 'cocina',
    nombre: 'Cocinar y ocio',
    titulo: 'Cocinando algo mientras charlamos',
    descripcion: 'No es trabajo. Cuenta como vida y se recupera mientras se hace.',
    alcance: 0.05,
    afinidad: 0.8,
    calidad: 1,
    coste: 0.25,
    actividad: 'vida',
  },
  {
    id: 'conferencia',
    nombre: 'Conferencia del ano',
    titulo: 'DIRECTO ESPECIAL — la conferencia, comentada',
    descripcion:
      'Pico extraordinario. Alcance masivo y agotador; la comunidad decide cuanta gente se queda despues.',
    alcance: 6,
    afinidad: 0.4,
    calidad: 1.15,
    coste: 2.2,
    actividad: 'produccion',
    // Es un evento, no una eleccion libre: lo habilita el sistema en F4.
    requiere: '@evento',
  },
  {
    id: 'solidario',
    nombre: 'Directo solidario',
    titulo: 'Hoy emito en otro canal, por una causa',
    descripcion:
      'No se emite aqui: no trae visitas ni ingresos. Lo que deja es reputacion y comunidad.',
    alcance: 0,
    afinidad: 6,
    calidad: 1.1,
    coste: 1.1,
    actividad: 'comunidad',
    ingresos: 0,
    requiere: '@evento',
  },
  /**
   * LAS CLAVES DE PRENSA.
   *
   * No se eligen ni se compran: las concede un contrato con una editora
   * mientras dura, igual que los eventos conceden la conferencia. Por eso
   * llevan `requiere: '@evento'` como los demas formatos que da el sistema.
   *
   * Los tres perfiles son la decision entera del sistema puesta en numeros: el
   * superventas llena la calle de gente que se va, el mediano no destaca en
   * nada, y el indie que no paga trae a cuatro personas que no se van nunca.
   * Que la clave gratis del estudio de tres valga MAS que el cheque de la
   * editora grande es la tesis del juego dicha con otro sistema.
   */
  {
    id: 'clave-aaa',
    nombre: 'El juego del que habla todo el mundo',
    titulo: 'ESTRENO — el juego del año, primeras horas',
    descripcion:
      'Clave anticipada de un superventas. Entra muchisima gente y se va casi toda: vienen al juego, no a ti.',
    alcance: 1.8,
    afinidad: 0.4,
    calidad: 1,
    coste: 1.2,
    actividad: 'produccion',
    requiere: '@evento',
  },
  {
    id: 'clave-media',
    nombre: 'Un juego mediano',
    titulo: 'Probando algo que me han mandado',
    descripcion:
      'Ni pico ni consolidacion. Un juego correcto que hace lo que hace el directo normal, y encima pagan.',
    alcance: 1.1,
    afinidad: 0.9,
    calidad: 1.05,
    coste: 0.95,
    actividad: 'produccion',
    requiere: '@evento',
  },
  {
    id: 'clave-indie',
    nombre: 'El indie que no conoce nadie',
    titulo: 'Un juego que no ha jugado nadie, y deberiais',
    descripcion:
      'No lo va a ver casi nadie. La que lo vea se queda: ensenar algo pequeno porque te ha gustado es lo que construye una comunidad.',
    alcance: 0.45,
    afinidad: 2.6,
    calidad: 1.3,
    coste: 0.85,
    actividad: 'produccion',
    requiere: '@evento',
  },
  {
    id: 'clip',
    nombre: 'Clip viral',
    titulo: 'Un corte de treinta segundos',
    descripcion: 'Pico de alcance instantaneo y nada mas. No se elige: se captura.',
    alcance: 4,
    afinidad: 0.2,
    calidad: 1,
    coste: 0.1,
    actividad: 'produccion',
    requiere: '@evento',
  },
]

export const CONTENT_POR_ID: ReadonlyMap<string, ContentType> = new Map(
  CONTENT_TYPES.map((c) => [c.id, c]),
)

/** El formato con el que arranca la partida. */
export const FORMATO_INICIAL = 'directo'

/** Formatos que el jugador puede elegir, no los que dispara un evento. */
export const FORMATOS_ELEGIBLES = CONTENT_TYPES.filter((c) => c.requiere !== '@evento')
