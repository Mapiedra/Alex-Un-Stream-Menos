/**
 * Los cinco ciclos de la seccion 9 del GDD.
 *
 * La partida no se divide en anos sino en etapas de carrera. Cada ciclo tiene
 * un objetivo, una condicion para cerrarse y algo que desbloquea al hacerlo.
 *
 * El ciclo 3 es el importante: es donde el jugador toma el control de su
 * propio tiempo. Narrativamente no contrata a nadie —el creador trabaja
 * solo— sino que sistematiza su flujo de trabajo y con eso recupera las horas
 * que antes se le iban.
 */

export interface Cycle {
  numero: number
  nombre: string
  objetivo: string
  /** Lo que el jugador ve al entrar en el ciclo. */
  entrada: string
  /** Lo que ve al cerrarlo. */
  cierre: string
  /** Condiciones para cerrar el ciclo. Se cumplen TODAS. */
  requisitos: Requisito[]
  /** Abre el control manual del reparto del tiempo. */
  abreReparto?: boolean
}

export interface Requisito {
  clave: 'comunidad' | 'publicaciones' | 'casa' | 'calidad' | 'formatos' | 'alcance'
  minimo: number
  /** Como se le cuenta al jugador. */
  texto: string
}

export const CYCLES: Cycle[] = [
  {
    numero: 1,
    nombre: 'Descubrimiento',
    objetivo: 'Aprender el bucle',
    entrada:
      'Un ordenador, un microfono prestado y ninguna certeza. De momento se trata de publicar y ver que pasa.',
    cierre:
      'Ya hay gente que vuelve. Poca, pero vuelve. Eso es mas de lo que tenias hace un mes.',
    requisitos: [
      { clave: 'publicaciones', minimo: 5, texto: 'Publicar 5 veces' },
      { clave: 'comunidad', minimo: 400, texto: 'Reunir 400 de comunidad' },
    ],
  },
  {
    numero: 2,
    nombre: 'Crecimiento',
    objetivo: 'Encontrar tus formatos',
    entrada:
      'Funciona. Ahora hay que averiguar en que eres bueno de verdad, y eso solo se sabe probando.',
    cierre:
      'Tienes formatos propios y un publico que sabe a que viene. Ya no dependes de que juego este de moda.',
    requisitos: [
      { clave: 'comunidad', minimo: 4000, texto: 'Reunir 4.000 de comunidad' },
      { clave: 'formatos', minimo: 1, texto: 'Desbloquear un formato propio' },
    ],
  },
  {
    numero: 3,
    nombre: 'Consolidacion',
    objetivo: 'Construir comunidad y ordenar tu trabajo',
    entrada:
      'Llevas meses improvisando cada video desde cero. Es hora de montarte un sistema: plantillas, rutina, un sitio para cada cosa. Nadie va a hacerlo por ti, pero hecho una vez sirve para siempre.',
    cierre:
      'Por primera vez decides tus horas en lugar de que las decidan las prisas.',
    requisitos: [
      { clave: 'comunidad', minimo: 20_000, texto: 'Reunir 20.000 de comunidad' },
      { clave: 'casa', minimo: 1, texto: 'Mejorar la casa al menos una vez' },
    ],
    abreReparto: true,
  },
  {
    numero: 4,
    nombre: 'Calidad',
    objetivo: 'Trabajar mejor, no mas',
    entrada:
      'Con el tiempo bajo control, la pregunta cambia: ya no es cuanto puedes producir, sino como de bueno puede ser.',
    cierre:
      'El canal aguanta sin ti unos dias. Nunca habias podido decir eso.',
    requisitos: [
      { clave: 'calidad', minimo: 2.5, texto: 'Alcanzar calidad 2,5' },
      { clave: 'casa', minimo: 2, texto: 'Llegar a la tercera etapa de casa' },
    ],
  },
  {
    numero: 5,
    nombre: 'Libertad',
    objetivo: 'Vivir sin perder relevancia',
    entrada:
      'Ya no hace falta correr. Queda averiguar cuanto quieres seguir trabajando, que es una pregunta bastante mas dificil.',
    cierre: 'Puedes parar cuando quieras. Ese era el objetivo desde el principio.',
    requisitos: [
      { clave: 'comunidad', minimo: 120_000, texto: 'Reunir 120.000 de comunidad' },
    ],
  },
]

export const CYCLE_POR_NUMERO: ReadonlyMap<number, Cycle> = new Map(
  CYCLES.map((c) => [c.numero, c]),
)

export const ULTIMO_CICLO = CYCLES.length
