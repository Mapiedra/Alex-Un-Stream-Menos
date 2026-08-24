/**
 * Los libros.
 *
 * Leer dejo de ser un extra gratis "antes de dormir" y paso a ser lo que es:
 * horas del dia a dia que gastas en algo que no da visitas. Un libro avanza
 * con las franjas que le dedicas, y cuando lo terminas te deja ideas de golpe
 * y unas semanas de tirar de lo leido — que es exactamente para lo que sirve
 * leer si te dedicas a hablar en publico.
 *
 * REGLA: nada de titulos reales. Los libros de aqui son de mentira a
 * proposito, con la voz observacional del resto del juego. El proyecto ya usa
 * el nombre de una persona real; no hace falta ademas atribuirle lecturas.
 *
 * `tema` agrupa la coleccion. Terminar varios del mismo tema deja un poso
 * permanente pequeño: es la sinergia que el BACKLOG apuntaba como expansion.
 */

export type TemaLibro = 'novela' | 'ensayo' | 'oficio' | 'raro'

export interface Libro {
  id: string
  titulo: string
  autor: string
  tema: TemaLibro
  /**
   * Cuanto cuesta terminarlo, en segundos de lectura efectiva. Un tocho de
   * verdad se nota en la semana: no es lo mismo que una novela corta.
   */
  paginas: number
  /** Lo que deja al cerrarlo, en la voz del juego. */
  cierre: string
  /** Ciclo a partir del cual puede aparecer en la mesilla. */
  desdeCiclo?: number
}

export const LIBROS: Libro[] = [
  {
    id: 'faro',
    titulo: 'El faro de la costa muerta',
    autor: 'A. Vilar',
    tema: 'novela',
    paginas: 40,
    cierre: 'Cuatrocientas paginas para que al final no pasara casi nada. Y aun asi.',
  },
  {
    id: 'ruido',
    titulo: 'Contra el ruido',
    autor: 'M. Oteiza',
    tema: 'ensayo',
    paginas: 55,
    cierre: 'Un ensayo sobre la atencion, leido a trozos entre notificaciones. La ironia no se te escapa.',
  },
  {
    id: 'montaje',
    titulo: 'El corte invisible',
    autor: 'R. Sancho',
    tema: 'oficio',
    paginas: 45,
    cierre: 'Sobre montaje. Media hora despues estabas rehaciendo la entradilla de un video de hace dos años.',
  },
  {
    id: 'cocinera',
    titulo: 'Diario de una cocinera de guardia',
    autor: 'L. Prat',
    tema: 'novela',
    paginas: 50,
    cierre: 'Nadie te habia contado nunca a que huele una cocina a las cuatro de la mañana.',
    desdeCiclo: 2,
  },
  {
    id: 'atencion',
    titulo: 'Quien paga tu tiempo',
    autor: 'S. Ferreiro',
    tema: 'ensayo',
    paginas: 70,
    cierre: 'Habla de gente que vende su atencion sin saberlo. Tu la vendes sabiendolo, que es otra cosa. Creo.',
    desdeCiclo: 2,
  },
  {
    id: 'manual',
    titulo: 'Manual del oficio menor',
    autor: 'J. Beltran',
    tema: 'oficio',
    paginas: 60,
    cierre: 'Va de artesanos. No menciona internet ni una vez y aun asi habla de ti todo el rato.',
    desdeCiclo: 3,
  },
  {
    id: 'catalogo',
    titulo: 'Catalogo de cosas que no existen',
    autor: 'Anonimo',
    tema: 'raro',
    paginas: 35,
    cierre: 'Ochenta objetos imposibles descritos en serio. Tienes tema para un mes.',
    desdeCiclo: 3,
  },
  {
    id: 'tocho',
    titulo: 'La casa y el tiempo (I y II)',
    autor: 'E. Madariaga',
    tema: 'novela',
    paginas: 110,
    cierre: 'Mil doscientas paginas. Tardaste meses. Fue el mejor rato del año.',
    desdeCiclo: 4,
  },
  {
    id: 'silencio',
    titulo: 'Elogio de irse pronto',
    autor: 'C. Neira',
    tema: 'ensayo',
    paginas: 45,
    cierre: 'Trata de gente que lo dejo a tiempo. Lo has subrayado entero.',
    desdeCiclo: 4,
  },
]

export const LIBRO_POR_ID: ReadonlyMap<string, Libro> = new Map(LIBROS.map((l) => [l.id, l]))

export const NOMBRE_TEMA: Record<TemaLibro, string> = {
  novela: 'Novela',
  ensayo: 'Ensayo',
  oficio: 'Oficio',
  raro: 'Rarezas',
}

/**
 * Que deja haber leido varios del mismo tema.
 *
 * Bonos MUY pequeños y permanentes. La coleccion no es una via de progresion
 * paralela: es un poso. Si leer saliese a cuenta como estrategia, dejaria de
 * ser leer y pasaria a ser otro generador.
 */
export interface Sinergia {
  tema: TemaLibro
  /** Libros del tema que hacen falta. */
  minimo: number
  etiqueta: string
  descripcion: string
  multCalidad?: number
  multEficiencia?: number
  /** Afinidad extra: la gente se queda mas si tienes de que hablar. */
  multAfinidad?: number
}

export const SINERGIAS: Sinergia[] = [
  {
    tema: 'novela',
    minimo: 2,
    etiqueta: 'Tienes historias',
    descripcion: 'Dos novelas leidas. Ya no rellenas los silencios, los llenas.',
    multAfinidad: 1.08,
  },
  {
    tema: 'ensayo',
    minimo: 2,
    etiqueta: 'Tienes argumentos',
    descripcion: 'Dos ensayos leidos. Las charlas dejan de ser opiniones sueltas.',
    multCalidad: 1.06,
  },
  {
    tema: 'oficio',
    minimo: 2,
    etiqueta: 'Tienes oficio',
    descripcion: 'Dos libros sobre el oficio. Se nota en como montas.',
    multEficiencia: 1.06,
  },
  {
    tema: 'raro',
    minimo: 1,
    etiqueta: 'Tienes rarezas',
    descripcion: 'Un libro que no ha leido nadie mas. Eso vale mucho en un directo.',
    multAfinidad: 1.05,
  },
]
