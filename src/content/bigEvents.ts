/**
 * Eventos extraordinarios (secciones 6.2 y 6.3 del GDD).
 *
 * Son potentes y escasos. La regla de balance del GDD es explicita: nunca
 * deben ser requisito para ganar. Una partida que los ignore por completo
 * tiene que seguir siendo ganable, y hay un test del banco que lo comprueba.
 *
 * La conferencia tiene tres fases porque asi es como funciona de verdad: te
 * preparas, revientas una semana, y despues viene lo unico que importa de
 * verdad, que es cuanta de esa gente se queda.
 */

export type FaseEvento = 'anuncio' | 'preparacion' | 'directo' | 'retencion'

export interface FaseDef {
  fase: FaseEvento
  semanas: number
  titulo: string
  texto: string
  /** Multiplicador de alcance durante la fase. */
  alcance?: number
  /** Multiplicador de afinidad: cuanta gente se queda. */
  afinidad?: number
  /** Multiplicador de fatiga. */
  fatiga?: number
  /** Multiplicador de ingresos. */
  ingresos?: number
}

export interface BigEvent {
  id: string
  nombre: string
  /** Titulo del directo mientras dura la fase de emision. */
  tituloDirecto: string
  /** Ciclo minimo en el que puede aparecer. */
  desdeCiclo: number
  /** Semanas minimas entre dos apariciones del mismo evento. */
  reposoSemanas: number
  fases: FaseDef[]
  /** Que gana el jugador por prepararlo. Solo la conferencia se prepara. */
  preparable?: {
    coste: number
    texto: string
    /** Multiplicador extra de alcance en la fase de directo. */
    bonusAlcance: number
    /** Cuanto reduce el desgaste haber llegado descansado. */
    bonusFatiga: number
  }
}

export const BIG_EVENTS: BigEvent[] = [
  {
    id: 'conferencia',
    nombre: 'La conferencia del año',
    tituloDirecto: 'DIRECTO ESPECIAL — la conferencia, comentada',
    desdeCiclo: 2,
    reposoSemanas: 40,
    preparable: {
      coste: 400,
      texto:
        'Reservar el fin de semana, dormir antes, investigar los rumores y dejar el setup listo.',
      bonusAlcance: 1.6,
      bonusFatiga: 0.6,
    },
    fases: [
      {
        fase: 'anuncio',
        semanas: 2,
        titulo: 'Han anunciado fechas',
        texto:
          'La conferencia del año cae dentro de tres semanas. Todo el mundo va a estar viendo lo mismo a la vez, y eso no pasa casi nunca.',
      },
      {
        fase: 'preparacion',
        semanas: 1,
        titulo: 'La semana de antes',
        texto:
          'Queda una semana. Puedes llegar preparado o puedes llegar como siempre.',
        alcance: 1.2,
      },
      {
        fase: 'directo',
        semanas: 1,
        titulo: 'Es hoy',
        texto:
          'Ocho horas seguidas comentando anuncios. Nunca vas a tener a tanta gente delante de golpe.',
        alcance: 6,
        afinidad: 0.5,
        fatiga: 2.4,
      },
      {
        fase: 'retencion',
        semanas: 3,
        titulo: 'Y ahora, lo importante',
        texto:
          'Se ha ido casi todo el mundo, como siempre. Lo que decide si esto ha servido de algo es cuanta gente de la que llego se queda ahora.',
        alcance: 0.7,
        afinidad: 2.5,
      },
    ],
  },
  {
    id: 'solidario',
    nombre: 'Directo solidario',
    tituloDirecto: 'Hoy emito en otro canal, por una causa',
    desdeCiclo: 3,
    reposoSemanas: 30,
    fases: [
      {
        fase: 'anuncio',
        semanas: 2,
        titulo: 'Te han invitado',
        texto:
          'Un directo solidario grande busca gente. No se emite en tu canal: no vas a tener visitas ni ingresos de esto.',
      },
      {
        fase: 'directo',
        semanas: 1,
        titulo: 'El directo',
        texto:
          'Un dia entero en un canal que no es el tuyo, delante de un publico que no es el tuyo. Sale bien.',
        alcance: 0,
        ingresos: 0,
        afinidad: 3,
        fatiga: 1.3,
      },
      {
        fase: 'retencion',
        semanas: 4,
        titulo: 'Lo que queda',
        texto:
          'No ha subido ni una visita. Pero algo ha cambiado en como te ve la gente, y eso dura mas que un pico.',
        afinidad: 2,
      },
    ],
  },
]

export const BIG_POR_ID: ReadonlyMap<string, BigEvent> = new Map(BIG_EVENTS.map((e) => [e.id, e]))
