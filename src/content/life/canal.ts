import type { LifeEvent } from './tipos.ts'

/** El canal, la comunidad y el oficio de hacer videos. */
export const CANAL: LifeEvent[] = [
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
    id: 'primer-recuerdo',
    titulo: 'Alguien de los primeros',
    texto:
      'Escribe alguien que estaba cuando erais doscientos. Sigue ahi. No queria nada, solo decirlo.',
    desdeSemana: 25,
    peso: 2,
    opciones: [
      {
        texto: 'Leerlo en directo',
        resultado: 'Se te nota la voz un poco rara al terminar.',
        efecto: {
          vida: 0.05,
          modificador: { id: 'raices', etiqueta: 'Con raices', semanas: 4, calidad: 1.08 },
        },
      },
      {
        texto: 'Contestarle en privado',
        resultado: 'Algunas cosas no hacen falta en pantalla.',
        efecto: { vida: 0.06 },
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
    id: 'idea-ducha',
    titulo: 'Se te ha ocurrido algo',
    texto: 'En la ducha, como siempre. Y es de las buenas.',
    peso: 3,
    opciones: [
      {
        texto: 'Apuntarla ahora mismo',
        resultado: 'Empapado y con el movil en la mano, pero apuntada.',
        efecto: { ideas: 4 },
      },
      {
        texto: 'Ya me acordare',
        resultado: 'No te acuerdas. Nunca te acuerdas.',
        efecto: {},
      },
    ],
  },
  {
    id: 'edicion-eterna',
    titulo: 'Ese video no sale',
    texto: 'Llevas tres dias con el mismo montaje. Cada version esta peor que la anterior.',
    desdeSemana: 8,
    peso: 3,
    opciones: [
      {
        texto: 'Publicar la primera version',
        resultado: 'Era la buena. Siempre lo es.',
        efecto: { ideas: 2, vida: 0.03 },
      },
      {
        texto: 'Aparcarlo un mes',
        resultado: 'Al volver lo ves claro en veinte minutos.',
        efecto: { fatiga: -0.03, ideas: 1 },
      },
    ],
  },
  {
    id: 'disco-lleno',
    titulo: 'Disco lleno',
    texto:
      'Cero bytes libres, a mitad de exportacion, con el material de dos meses sin respaldar.',
    desdeSemana: 10,
    peso: 2,
    opciones: [
      {
        texto: 'Parar todo y ordenar el archivo',
        resultado: 'Un dia entero perdido. Y ganado.',
        efecto: {
          fatiga: 0.04,
          modificador: { id: 'orden', etiqueta: 'Todo ordenado', semanas: 5, eficiencia: 1.1 },
        },
      },
      {
        texto: 'Borrar lo primero que veas',
        resultado: 'Sales del paso. Vas a echar de menos algo de eso.',
        efecto: { fatiga: 0.02 },
      },
    ],
  },
  {
    id: 'actualizacion',
    titulo: 'Actualizacion sorpresa',
    texto: 'El programa de edicion se ha actualizado solo y ha movido todo de sitio.',
    peso: 3,
    opciones: [
      {
        texto: 'Aprenderte la nueva interfaz',
        resultado: 'Dos dias raros y luego mejor que antes.',
        efecto: { fatiga: 0.03, ideas: 1 },
      },
      {
        texto: 'Volver a la version antigua',
        resultado: 'Media tarde peleandote con el instalador.',
        efecto: { fatiga: 0.03 },
      },
    ],
  },
  {
    id: 'polemica-tonta',
    titulo: 'Una polemica de nada',
    texto: 'Has dicho algo sin importancia y hay un hilo de doscientos mensajes discutiendolo.',
    desdeSemana: 15,
    peso: 3,
    opciones: [
      {
        texto: 'No entrar',
        resultado: 'A los dos dias no se acuerda nadie.',
        efecto: { vida: 0.02 },
      },
      {
        texto: 'Aclararlo en el proximo directo',
        resultado: 'Se aclara. Y se alarga otro dia mas.',
        efecto: { fatiga: 0.03 },
      },
    ],
  },
  {
    id: 'moderacion',
    titulo: 'Alguien se ha pasado en el chat',
    texto: 'Nada dramatico, pero cruza una linea y todo el mundo esta mirando que haces.',
    desdeSemana: 10,
    peso: 2,
    opciones: [
      {
        texto: 'Cortarlo en el momento',
        resultado: 'Incomodo durante treinta segundos, sano durante meses.',
        efecto: {
          modificador: { id: 'chat-sano', etiqueta: 'Chat sano', semanas: 5, alcance: 1.05 },
        },
      },
      {
        texto: 'Dejarlo pasar por no parar el directo',
        resultado: 'Se repite la semana siguiente.',
        efecto: { vida: -0.03 },
      },
    ],
  },
  {
    id: 'meme-canal',
    titulo: 'Se ha hecho un meme contigo',
    texto: 'De algo que dijiste hace ocho meses y no recuerdas haber dicho.',
    desdeSemana: 18,
    peso: 3,
    opciones: [
      {
        texto: 'Asumirlo con dignidad',
        resultado: 'Lo pones de fondo del canal. Te lo van a recordar toda la vida.',
        efecto: {
          ideas: 2,
          modificador: { id: 'meme', etiqueta: 'Meme circulando', semanas: 3, alcance: 1.12 },
        },
      },
      {
        texto: 'Fingir que no existe',
        resultado: 'Eso nunca ha funcionado con nada.',
        efecto: { ideas: 1 },
      },
    ],
  },
  {
    id: 'peticion-imposible',
    titulo: 'Piden algo que no vas a hacer',
    texto:
      'Llevan meses pidiendo un formato concreto. No te apetece nada y no crees que salga bien.',
    desdeSemana: 16,
    peso: 2,
    opciones: [
      {
        texto: 'Decir que no y explicar por que',
        resultado: 'Lo entienden mejor de lo que esperabas.',
        efecto: { vida: 0.04 },
      },
      {
        texto: 'Probarlo una vez',
        resultado: 'Sale regular, como pensabas. Al menos ya esta zanjado.',
        efecto: { fatiga: 0.04, ideas: 2 },
      },
    ],
  },
  {
    id: 'cifra-redonda',
    titulo: 'Una cifra redonda',
    texto:
      'El contador acaba de pasar por un numero de esos que hacen ilusion y no significan nada.',
    desdeSemana: 12,
    peso: 3,
    opciones: [
      {
        texto: 'Celebrarlo con un directo especial',
        resultado: 'Buena noche.',
        efecto: {
          vida: 0.04,
          modificador: { id: 'celebracion', etiqueta: 'Buena racha', semanas: 3, alcance: 1.08 },
        },
      },
      {
        texto: 'Mencionarlo de pasada',
        resultado: 'Ya tendra gracia dentro de unos anos.',
        efecto: { vida: 0.02 },
      },
    ],
  },
  {
    id: 'sponsor',
    titulo: 'Una marca quiere patrocinarte',
    texto: 'El producto no es malo. Tampoco tiene nada que ver contigo.',
    desdeSemana: 20,
    peso: 2,
    opciones: [
      {
        texto: 'Rechazarlo',
        resultado: 'Duele un poco al ver la cifra. Se pasa.',
        efecto: {
          vida: 0.03,
          modificador: { id: 'coherencia', etiqueta: 'Coherente', semanas: 4, calidad: 1.06 },
        },
      },
      {
        texto: 'Aceptarlo y hacerlo bien',
        resultado: 'Lo integras con humor. Nadie se molesta.',
        efecto: { fatiga: 0.02 },
      },
    ],
  },
  {
    id: 'copia',
    titulo: 'Alguien te ha copiado el formato',
    texto: 'Mismo montaje, misma estructura, mismo chiste de apertura.',
    desdeSemana: 22,
    peso: 2,
    opciones: [
      {
        texto: 'Tomartelo como un cumplido',
        resultado: 'Lo es, en el fondo.',
        efecto: { vida: 0.03 },
      },
      {
        texto: 'Hacer una version mejor',
        resultado: 'Competitividad mal entendida, pero sale un video estupendo.',
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
          modificador: {
            id: 'colaboracion',
            etiqueta: 'Te han oido por ahi',
            semanas: 3,
            alcance: 1.15,
          },
        },
      },
      {
        texto: 'Declinar, esta semana no',
        resultado: 'Lo entienden. Habra mas.',
        efecto: { vida: 0.03 },
      },
    ],
  },
  {
    id: 'racha-mala',
    titulo: 'Una semana floja',
    texto:
      'Los numeros han bajado sin motivo aparente. Puede ser el algoritmo, puede ser agosto, puede no ser nada.',
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
    id: 'aniversario',
    titulo: 'Hace hoy tres anos',
    texto: 'Te salta el recordatorio del primer video. Lo ves entero. Es terrible.',
    desdeSemana: 30,
    peso: 2,
    opciones: [
      {
        texto: 'Ensenarlo sin cortes',
        resultado:
          'Verguenza ajena compartida. Y una perspectiva rarisima de cuanto has cambiado.',
        efecto: {
          vida: 0.05,
          ideas: 2,
          modificador: { id: 'perspectiva', etiqueta: 'Con perspectiva', semanas: 4, calidad: 1.07 },
        },
      },
      {
        texto: 'Cerrarlo rapido',
        resultado: 'Algunas cosas mejor no revisitarlas.',
        efecto: { vida: 0.02 },
      },
    ],
  },
  {
    id: 'paquete',
    titulo: 'Un paquete sin remitente',
    texto: 'Alguien de la comunidad ha mandado algo. Sin nota, sin nombre.',
    desdeSemana: 22,
    peso: 2,
    opciones: [
      {
        texto: 'Abrirlo en directo',
        resultado: 'Es una tonteria perfecta. Se queda en la estanteria para siempre.',
        efecto: { vida: 0.05, ideas: 1 },
      },
    ],
  },
  {
    id: 'sueno-raro',
    titulo: 'Has sonado con el canal',
    texto:
      'Un directo interminable en el que no funcionaba nada y todo el mundo estaba mirando.',
    desdeSemana: 15,
    peso: 2,
    opciones: [
      {
        texto: 'Reirte y contarlo en directo',
        resultado: 'Resulta que le pasa a mucha mas gente de la que crees.',
        efecto: { ideas: 2, vida: 0.02 },
      },
      {
        texto: 'Tomar nota de lo que significa',
        resultado: 'Significa lo que ya sabias.',
        efecto: { vida: 0.03 },
      },
    ],
  },
]
