/**
 * Tarjetas de vida personal (seccion 7 del GDD).
 *
 * REGLA DEL GDD, literal: "poco impacto numerico, mucho sabor y ambientacion".
 * Estas tarjetas NO son una via de progresion paralela. Existen para que la
 * partida tenga textura y para que el jugador sienta que hay una vida ahi
 * detras, no para que optimice cual le sale mas rentable.
 *
 * Por eso todos los efectos son pequenos y ninguna opcion es una trampa: no
 * hay una respuesta correcta que memorizar, hay decisiones con sabor distinto.
 *
 * REGLA DE TONO (seccion 15): humor observacional, nunca caricatura. Los
 * eventos personales se tratan con ligereza y respeto. Nada de convertir
 * relaciones reales en estadisticas.
 */

export interface EfectoVida {
  /** Sumas directas, siempre pequenas. */
  vida?: number
  fatiga?: number
  ideas?: number
  /** Multiplicador temporal y cuantas semanas dura. */
  modificador?: {
    id: string
    etiqueta: string
    semanas: number
    calidad?: number
    eficiencia?: number
    alcance?: number
  }
}

export interface OpcionVida {
  texto: string
  /** Lo que pasa despues, en una linea. */
  resultado: string
  efecto: EfectoVida
}

export interface LifeEvent {
  id: string
  titulo: string
  texto: string
  /** Semana minima en la que puede salir. */
  desdeSemana?: number
  /** Etapa de casa minima. */
  desdeCasa?: number
  /** Peso relativo al sortear. */
  peso?: number
  opciones: OpcionVida[]
}

export const LIFE_EVENTS: LifeEvent[] = [
  {
    id: 'gato-teclado',
    titulo: 'El gato ha decidido',
    texto:
      'Se ha tumbado encima del teclado justo cuando ibas a empezar. No parece dispuesto a negociar.',
    peso: 3,
    opciones: [
      {
        texto: 'Esperar a que se aburra',
        resultado: 'Veinte minutos perdidos y una foto que el chat te va a pedir mil veces.',
        efecto: { vida: 0.03, ideas: 1 },
      },
      {
        texto: 'Apartarlo con cuidado',
        resultado: 'Se va ofendido. Volvera.',
        efecto: { fatiga: 0.01 },
      },
    ],
  },
  {
    id: 'libro-tarde',
    titulo: 'Te has quedado leyendo',
    texto:
      'Ibas a leer un capitulo antes de dormir. Son las tres y quedan cuarenta paginas.',
    peso: 3,
    opciones: [
      {
        texto: 'Terminarlo',
        resultado: 'Manana lo vas a notar, pero ya tienes de que hablar el jueves.',
        efecto: { ideas: 3, fatiga: 0.04 },
      },
      {
        texto: 'Dejarlo por hoy',
        resultado: 'Ocho horas de sueno. Un lujo.',
        efecto: { vida: 0.05, ideas: 1 },
      },
    ],
  },
  {
    id: 'cena-amigos',
    titulo: 'Cena con gente',
    texto: 'Te han invitado a cenar. Tenias directo, pero tampoco es sagrado.',
    peso: 2,
    opciones: [
      {
        texto: 'Ir',
        resultado: 'Vuelves tarde y de buen humor.',
        efecto: {
          vida: 0.08,
          modificador: { id: 'buen-humor', etiqueta: 'De buen humor', semanas: 2, calidad: 1.06 },
        },
      },
      {
        texto: 'Quedarte y emitir',
        resultado: 'Directo tranquilo. Un poco de pena, tambien.',
        efecto: { vida: -0.02 },
      },
    ],
  },
  {
    id: 'mudanza',
    titulo: 'Mudanza',
    texto:
      'Cajas por todas partes, el setup desmontado y un router que nadie sabe donde esta.',
    desdeCasa: 1,
    peso: 1,
    opciones: [
      {
        texto: 'Montarlo bien desde el principio',
        resultado: 'Un par de semanas raras, y luego todo funciona mejor que antes.',
        efecto: {
          fatiga: 0.06,
          modificador: {
            id: 'setup-nuevo',
            etiqueta: 'Setup recien montado',
            semanas: 4,
            eficiencia: 1.12,
          },
        },
      },
      {
        texto: 'Salir del paso y ya lo ordenare',
        resultado: 'Emites al dia siguiente. Los cables seguiran ahi seis meses.',
        efecto: { vida: -0.04 },
      },
    ],
  },
  {
    id: 'serie-nueva',
    titulo: 'Todo el mundo habla de esa serie',
    texto: 'Lleva dos semanas en el chat cada cinco minutos. Y no la has visto.',
    peso: 3,
    opciones: [
      {
        texto: 'Verla entera este fin de semana',
        resultado: 'Ahora entiendes los memes. Y tienes tema para tres directos.',
        efecto: { ideas: 4, vida: 0.04 },
      },
      {
        texto: 'Fingir que la has visto',
        resultado: 'Aguanta unos dias. No mas.',
        efecto: { ideas: 1 },
      },
    ],
  },
  {
    id: 'comentario-bueno',
    titulo: 'Un mensaje que no esperabas',
    texto:
      'Alguien te escribe para contarte que un directo tuyo le hizo compania en una mala racha. No pide nada.',
    desdeSemana: 8,
    peso: 2,
    opciones: [
      {
        texto: 'Contestarle',
        resultado: 'Te quedas pensando en ello el resto del dia.',
        efecto: {
          vida: 0.06,
          modificador: { id: 'con-sentido', etiqueta: 'Con sentido', semanas: 3, calidad: 1.08 },
        },
      },
    ],
  },
  {
    id: 'bloqueo',
    titulo: 'No se te ocurre nada',
    texto: 'Llevas dos dias mirando la lista de ideas. Todas te parecen malas.',
    desdeSemana: 6,
    peso: 2,
    opciones: [
      {
        texto: 'Salir a andar sin el movil',
        resultado: 'Vuelves con dos ideas. Ninguna de las que buscabas.',
        efecto: { ideas: 3, vida: 0.04 },
      },
      {
        texto: 'Forzarlo hasta que salga',
        resultado: 'Sale algo. No es lo mejor que has hecho.',
        efecto: { fatiga: 0.05, ideas: 1 },
      },
    ],
  },
  {
    id: 'cocina-desastre',
    titulo: 'La receta no ha salido',
    texto: 'Era sencilla. En teoria.',
    desdeCasa: 4,
    peso: 2,
    opciones: [
      {
        texto: 'Pedir algo y reirte',
        resultado: 'Buen clip. Mal plato.',
        efecto: { vida: 0.03, ideas: 2 },
      },
      {
        texto: 'Volver a intentarlo',
        resultado: 'A la tercera sale. Cenas a las once.',
        efecto: { vida: 0.05, fatiga: 0.02 },
      },
    ],
  },
  {
    id: 'racha-mala',
    titulo: 'Una semana floja',
    texto:
      'Los numeros han bajado sin motivo aparente. Puede ser el algoritmo, puede ser agosto, puede ser nada.',
    desdeSemana: 12,
    peso: 2,
    opciones: [
      {
        texto: 'No mirar las metricas unos dias',
        resultado: 'Sorprendentemente, ayuda.',
        efecto: { vida: 0.05 },
      },
      {
        texto: 'Analizar que ha pasado',
        resultado: 'No encuentras nada concluyente, pero aprendes un par de cosas.',
        efecto: { ideas: 2, fatiga: 0.03 },
      },
    ],
  },
  {
    id: 'invitacion',
    titulo: 'Te invitan a un podcast',
    texto: 'Un canal parecido al tuyo quiere que vayas a hablar un rato.',
    desdeSemana: 10,
    peso: 2,
    opciones: [
      {
        texto: 'Aceptar',
        resultado: 'Sales bien. Alguna gente nueva se pasa por el canal.',
        efecto: {
          modificador: { id: 'colaboracion', etiqueta: 'Te han oido por ahi', semanas: 3, alcance: 1.15 },
        },
      },
      {
        texto: 'Declinar, esta semana no',
        resultado: 'Lo entienden. Habra mas.',
        efecto: { vida: 0.03 },
      },
    ],
  },
]

export const LIFE_POR_ID: ReadonlyMap<string, LifeEvent> = new Map(
  LIFE_EVENTS.map((e) => [e.id, e]),
)
