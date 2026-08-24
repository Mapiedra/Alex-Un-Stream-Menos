import type { LifeEvent } from './tipos.ts'

/** Vida domestica: la casa, el gato, la comida, el sueno. */
export const COTIDIANO: LifeEvent[] = [
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
    id: 'gato-directo',
    titulo: 'Aparicion estelar',
    texto:
      'El gato se sube a la mesa en mitad de una frase importante y se queda mirando a camara.',
    peso: 3,
    opciones: [
      {
        texto: 'Dejarle su momento',
        resultado: 'Dos minutos de gato. Es el clip mas visto de la semana.',
        efecto: { ideas: 2, vida: 0.03 },
      },
      {
        texto: 'Seguir como si nada',
        resultado: 'Imposible. Ya no te escucha nadie.',
        efecto: { vida: 0.02 },
      },
    ],
  },
  {
    id: 'gato-veterinario',
    titulo: 'Al veterinario',
    texto:
      'No es nada grave, pero hay que ir. Y meterlo en el transportin es un deporte de riesgo.',
    peso: 2,
    opciones: [
      {
        texto: 'Cancelar el directo e ir',
        resultado: 'Todo bien. Vuelves con el pulso alterado y el brazo aranado.',
        efecto: { vida: 0.03, fatiga: 0.02 },
      },
    ],
  },
  {
    id: 'gato-proyecto',
    titulo: 'Ha borrado el proyecto',
    texto: 'Un salto, dos teclas y una hora de edicion que ya no existe.',
    desdeSemana: 6,
    peso: 2,
    opciones: [
      {
        texto: 'Rehacerlo, resoplando',
        resultado: 'Curiosamente, la segunda version sale mejor.',
        efecto: { fatiga: 0.04, ideas: 1 },
      },
      {
        texto: 'Aprender a guardar cada dos minutos',
        resultado: 'Lo llevabas oyendo quince anos.',
        efecto: { ideas: 1 },
      },
    ],
  },
  {
    id: 'libro-tarde',
    titulo: 'Se te ha ido la tarde con el libro',
    texto:
      'Ibas a leer un rato despues de comer. Son las siete, no has tocado el ordenador y quedan cuarenta paginas.',
    peso: 3,
    opciones: [
      {
        texto: 'Terminarlo y que sea lo que sea',
        resultado: 'La tarde entera fuera, pero ya tienes de que hablar el jueves.',
        efecto: { ideas: 3, fatiga: 0.04 },
      },
      {
        texto: 'Cerrarlo y ponerte',
        resultado: 'Vuelves a la mesa. El libro se queda ahi, mirandote.',
        efecto: { vida: 0.05, ideas: 1 },
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
    id: 'cafe',
    titulo: 'Cuarto cafe',
    texto: 'Son las seis de la tarde y llevas cuatro. Lo sabes tu y lo sabe tu pulso.',
    peso: 3,
    opciones: [
      {
        texto: 'Cambiar a infusion',
        resultado: 'Te sientes ridiculo y duermes mejor.',
        efecto: { vida: 0.04, fatiga: -0.02 },
      },
      {
        texto: 'Quinto cafe',
        resultado: 'El directo sale acelerado. Al chat le encanta.',
        efecto: { fatiga: 0.04 },
      },
    ],
  },
  {
    id: 'router',
    titulo: 'Se ha caido internet',
    texto: 'A mitad de directo. El router parpadea en un color que no habias visto nunca.',
    peso: 3,
    opciones: [
      {
        texto: 'Reiniciarlo y rezar',
        resultado: 'Vuelve a los cuatro minutos. La mitad de la gente ya se ha ido.',
        efecto: { fatiga: 0.02 },
      },
      {
        texto: 'Darlo por hoy',
        resultado: 'Te haces la cena a una hora normal por primera vez en semanas.',
        efecto: { vida: 0.05 },
      },
    ],
  },
  {
    id: 'obras-arriba',
    titulo: 'Obras arriba',
    texto: 'Llevan tres dias taladrando. Empiezan a las nueve y no negocian.',
    peso: 2,
    opciones: [
      {
        texto: 'Cambiar el horario de grabacion',
        resultado: 'Grabas de noche. Funciona, pero se te va el dia entero.',
        efecto: { fatiga: 0.03, ideas: 1 },
      },
      {
        texto: 'Grabar igual y bromear con ello',
        resultado: 'El taladro acaba siendo un personaje recurrente del canal.',
        efecto: { ideas: 2 },
      },
    ],
  },
  {
    id: 'plantas',
    titulo: 'Las plantas',
    texto: 'Llevabas un mes sin regarlas. Dos han aguantado. Una no.',
    desdeCasa: 3,
    peso: 2,
    opciones: [
      {
        texto: 'Ponerte una alarma',
        resultado: 'Ridiculo, pero funciona.',
        efecto: { vida: 0.03 },
      },
      {
        texto: 'Aceptar que no eres de plantas',
        resultado: 'Compras una de plastico. Nadie lo nota en camara.',
        efecto: { ideas: 1 },
      },
    ],
  },
  {
    id: 'apagon',
    titulo: 'Apagon en el barrio',
    texto: 'Todo negro a las ocho de la tarde. El movil dice que va para largo.',
    peso: 2,
    opciones: [
      {
        texto: 'Velas y leer',
        resultado: 'La mejor noche del mes, y no habia ni un enchufe funcionando.',
        efecto: { vida: 0.06, ideas: 2 },
      },
    ],
  },
  {
    id: 'lluvia',
    titulo: 'Lleva tres dias lloviendo',
    texto: 'No has salido de casa. Ni una vez.',
    peso: 3,
    opciones: [
      {
        texto: 'Salir igual, con paraguas',
        resultado: 'Te empapas los pies y vuelves de mejor humor.',
        efecto: { vida: 0.04, ideas: 1 },
      },
      {
        texto: 'Aprovechar para adelantar',
        resultado: 'Productivo. Un poco gris.',
        efecto: { vida: -0.02 },
      },
    ],
  },
  {
    id: 'mudanza',
    titulo: 'Mudanza',
    texto: 'Cajas por todas partes, el setup desmontado y un router que nadie sabe donde esta.',
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
    id: 'primera-factura',
    titulo: 'La primera factura del estudio',
    texto: 'Luz, internet, alquiler del espacio. Suma mas de lo que esperabas.',
    desdeCasa: 2,
    peso: 2,
    opciones: [
      {
        texto: 'Asumirlo: es una inversion',
        resultado: 'Lo es. Pero hay que llenarla todos los meses.',
        efecto: { fatiga: 0.02 },
      },
      {
        texto: 'Repasar gastos a fondo',
        resultado: 'Encuentras tres suscripciones que no usabas.',
        efecto: { vida: 0.03 },
      },
    ],
  },
  {
    id: 'estanteria-llena',
    titulo: 'La estanteria esta llena',
    texto: 'Ya no cabe otro libro. Hay que ampliar o hay que soltar.',
    desdeCasa: 3,
    peso: 2,
    opciones: [
      {
        texto: 'Ampliar',
        resultado: 'Un sabado de montaje y un fondo de camara todavia mejor.',
        efecto: {
          vida: 0.04,
          modificador: { id: 'fondo', etiqueta: 'Buen fondo', semanas: 5, alcance: 1.06 },
        },
      },
      {
        texto: 'Regalar los que no vas a releer',
        resultado: 'Cuesta mas de lo que parecia.',
        efecto: { vida: 0.03, ideas: 1 },
      },
    ],
  },
  {
    id: 'sofa-nuevo',
    titulo: 'El sofa',
    texto: 'Llevas cuatro anos con uno prestado que nunca fue comodo.',
    desdeCasa: 4,
    peso: 2,
    opciones: [
      {
        texto: 'Comprar uno bueno',
        resultado: 'Resulta que descansar en condiciones existe.',
        efecto: { vida: 0.06, fatiga: -0.03 },
      },
    ],
  },
  {
    id: 'silla-rota',
    titulo: 'La silla ha dicho basta',
    texto: 'Un crujido, y ahora se hunde un poco por la derecha.',
    desdeSemana: 10,
    peso: 2,
    opciones: [
      {
        texto: 'Cambiarla ya',
        resultado:
          'Ocho horas al dia sentado. Era la compra mas obvia y llevabas dos anos aplazandola.',
        efecto: {
          vida: 0.05,
          modificador: { id: 'espalda', etiqueta: 'Sin dolor de espalda', semanas: 5, calidad: 1.07 },
        },
      },
      {
        texto: 'Ponerle un cojin',
        resultado: 'Aguanta. Todo aguanta, hasta que no.',
        efecto: { fatiga: 0.03 },
      },
    ],
  },
]
