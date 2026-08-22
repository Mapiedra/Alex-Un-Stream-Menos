import type { LifeEvent } from './tipos.ts'

/**
 * Salud, limites y vida fuera de casa.
 *
 * Es el bloque donde el juego habla de lo que le importa de verdad, asi que
 * el tono es especialmente cuidadoso: nada de dramatizar y nada de dar
 * lecciones. Se cuenta lo que pasa y el jugador saca sus conclusiones.
 */
export const LIMITES: LifeEvent[] = [
  {
    id: 'garganta',
    titulo: 'Te has quedado sin voz',
    texto: 'Cuatro horas de directo diarias durante dos semanas. La factura llega.',
    desdeSemana: 10,
    peso: 3,
    opciones: [
      {
        texto: 'Callar tres dias',
        resultado: 'Publicas cosas editadas. Se recupera.',
        efecto: { fatiga: -0.05, vida: 0.04 },
      },
      {
        texto: 'Emitir susurrando',
        resultado: 'El chat lo encuentra hilarante. Tu garganta no.',
        efecto: { fatiga: 0.05, ideas: 1 },
      },
    ],
  },
  {
    id: 'insomnio',
    titulo: 'No te duermes',
    texto: 'Las cuatro de la manana y sigues repasando mentalmente el directo de hoy.',
    desdeSemana: 8,
    peso: 3,
    opciones: [
      {
        texto: 'Levantarte y leer un rato',
        resultado: 'A la media hora caes redondo.',
        efecto: { vida: 0.03, ideas: 1 },
      },
      {
        texto: 'Coger el movil',
        resultado: 'Peor idea imposible. Se hacen las seis.',
        efecto: { fatiga: 0.05 },
      },
    ],
  },
  {
    id: 'revision',
    titulo: 'Revision medica',
    texto: 'De esas que se aplazan tres anos. Todo bien, salvo lo obvio: te mueves poco.',
    desdeSemana: 25,
    peso: 2,
    opciones: [
      {
        texto: 'Hacer caso',
        resultado: 'Media hora al dia. Cuesta arrancar y luego no lo dejas.',
        efecto: {
          vida: 0.07,
          modificador: { id: 'en-forma', etiqueta: 'Moviendote', semanas: 6, calidad: 1.06 },
        },
      },
      {
        texto: 'Asentir y no hacer nada',
        resultado: 'Como todo el mundo.',
        efecto: {},
      },
    ],
  },
  {
    id: 'domingo',
    titulo: 'Un domingo sin nada',
    texto: 'No hay directo, no hay edicion, no hay nada apuntado. Se te hace raro.',
    desdeSemana: 14,
    peso: 3,
    opciones: [
      {
        texto: 'No hacer absolutamente nada',
        resultado: 'Aburrirte resulta ser muy productivo.',
        efecto: { vida: 0.07, ideas: 2 },
      },
      {
        texto: 'Adelantar trabajo',
        resultado: 'El lunes te alegras. El martes ya no te acuerdas.',
        efecto: { fatiga: 0.03 },
      },
    ],
  },
  {
    id: 'comparacion',
    titulo: 'Mirando canales ajenos',
    texto: 'Media hora viendo a gente que va mas rapido que tu. No ayuda y lo sabes.',
    desdeSemana: 12,
    peso: 3,
    opciones: [
      {
        texto: 'Cerrar la pestana',
        resultado: 'Lo mejor que puedes hacer un martes por la tarde.',
        efecto: { vida: 0.04 },
      },
      {
        texto: 'Analizar que hacen mejor',
        resultado: 'Sacas dos cosas utiles y una hora de mal cuerpo.',
        efecto: { ideas: 2, vida: -0.02 },
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
    id: 'boda',
    titulo: 'Boda de un amigo',
    texto: 'Cae en sabado, que es tu mejor dia de audiencia. Como todo.',
    desdeSemana: 12,
    peso: 2,
    opciones: [
      {
        texto: 'Ir sin mirar el movil',
        resultado: 'Uno de los mejores dias del ano.',
        efecto: { vida: 0.08, ideas: 2 },
      },
      {
        texto: 'Ir y emitir un rato desde alli',
        resultado: 'Ni una cosa ni otra.',
        efecto: { vida: 0.02, fatiga: 0.02 },
      },
    ],
  },
  {
    id: 'reconocen',
    titulo: 'Te reconocen por la calle',
    texto: 'En la cola del supermercado. Muy amable, muy cortado, y tu igual.',
    desdeSemana: 20,
    peso: 3,
    opciones: [
      {
        texto: 'Charlar un minuto',
        resultado: 'Se va contentisimo. Tu tambien, la verdad.',
        efecto: { vida: 0.05 },
      },
      {
        texto: 'Saludar y seguir',
        resultado: 'Tampoco pasa nada. Hay dias.',
        efecto: {},
      },
    ],
  },
  {
    id: 'viaje-corto',
    titulo: 'Escapada de dos dias',
    texto: 'Sin portatil. Eso es lo dificil.',
    desdeSemana: 16,
    peso: 2,
    opciones: [
      {
        texto: 'Dejar el portatil en casa',
        resultado: 'Vuelves con la cabeza despejada y cuatro ideas.',
        efecto: { vida: 0.06, ideas: 3, fatiga: -0.04 },
      },
      {
        texto: 'Llevarlo por si acaso',
        resultado: 'No lo abres. Pero pesa igual.',
        efecto: { vida: 0.03 },
      },
    ],
  },
  {
    id: 'familia',
    titulo: 'Comida familiar',
    texto: 'Nadie termina de entender a que te dedicas y todos preguntan igualmente.',
    peso: 3,
    opciones: [
      {
        texto: 'Explicarlo por enesima vez',
        resultado: 'Casi lo pillan. El ano que viene, otra vez.',
        efecto: { vida: 0.04, ideas: 1 },
      },
      {
        texto: 'Decir que trabajas con videos y cambiar de tema',
        resultado: 'Eficiente.',
        efecto: { vida: 0.03 },
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
    id: 'libro-malo',
    titulo: 'El libro no hay por donde cogerlo',
    texto: 'Vas por la pagina ochenta y no mejora. Y lo habias anunciado en el canal.',
    desdeSemana: 8,
    peso: 3,
    opciones: [
      {
        texto: 'Terminarlo por respeto al chat',
        resultado: 'No mejora. Pero sale un directo divertidisimo despellejandolo.',
        efecto: { fatiga: 0.03, ideas: 3 },
      },
      {
        texto: 'Abandonarlo y decirlo',
        resultado:
          'Media hora hablando de por que abandonar libros esta bien. Gusta mas que el libro.',
        efecto: { vida: 0.04, ideas: 2 },
      },
    ],
  },
  {
    id: 'recomendacion',
    titulo: 'Alguien te recomienda algo',
    texto:
      'Un mensaje largo, escrito con cuidado, recomendandote una novela de la que no habias oido hablar.',
    desdeSemana: 12,
    peso: 3,
    opciones: [
      {
        texto: 'Leerla',
        resultado: 'Es buenisima. Se lo dices y le haces el dia.',
        efecto: {
          ideas: 3,
          modificador: { id: 'descubrimiento', etiqueta: 'Descubrimiento', semanas: 3, calidad: 1.08 },
        },
      },
      {
        texto: 'Apuntarla para algun dia',
        resultado: 'La lista ya tiene noventa titulos.',
        efecto: { ideas: 1 },
      },
    ],
  },
  {
    id: 'peli-clasica',
    titulo: 'Una que no habias visto',
    texto:
      'Sale en una conversacion y resulta ser un clasico que todo el mundo da por visto. Tu no.',
    peso: 3,
    opciones: [
      {
        texto: 'Verla esta noche',
        resultado: 'Entiendes de golpe veinte referencias que llevabas anos asintiendo.',
        efecto: { ideas: 3, vida: 0.03 },
      },
    ],
  },
  {
    id: 'ensayo-largo',
    titulo: 'Un ensayo de cuatro horas',
    texto: 'Sobre algo que no te interesaba nada hasta el minuto veinte.',
    desdeSemana: 14,
    peso: 2,
    opciones: [
      {
        texto: 'Verlo entero',
        resultado: 'Se te va la tarde y sales con tres ideas que no tenian nada que ver.',
        efecto: { ideas: 4, fatiga: 0.02 },
      },
    ],
  },
  {
    id: 'club-debate',
    titulo: 'El club se ha puesto intenso',
    texto: 'Media hora de discusion sobre el final. Nadie tiene razon y todos disfrutan.',
    desdeSemana: 20,
    peso: 2,
    opciones: [
      {
        texto: 'Dejar que siga',
        resultado: 'El directo se alarga una hora. No se va nadie.',
        efecto: {
          fatiga: 0.03,
          modificador: { id: 'club-vivo', etiqueta: 'El club, encendido', semanas: 4, calidad: 1.09 },
        },
      },
      {
        texto: 'Cerrarlo y dejarlo para la proxima',
        resultado: 'Queda tema para dos semanas.',
        efecto: { ideas: 2 },
      },
    ],
  },
]
