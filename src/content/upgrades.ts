import type { ActivityId } from '../sim/state.ts'

/**
 * Catalogo de mejoras.
 *
 * REGLA DURA DEL PROYECTO: el creador trabaja solo. Ninguna mejora puede
 * explicarse con "ahora otra persona lo hace por ti". Toda ganancia de
 * eficiencia viene de mejores herramientas, mejor rutina, mejor espacio o
 * estar descansado. Si una mejora futura necesita un editor, un community
 * manager o un equipo, no entra.
 *
 * Los `slots` son la pieza que unifica el hibrido: en los ciclos 1-2 el
 * reparto del tiempo lo DERIVAN las mejoras compradas y el jugador no lo ve;
 * desde el ciclo 3 pasa a controlarlo el. No hay dos sistemas de progresion,
 * hay uno con dos interfaces.
 */

/**
 * UNA MONEDA POR CATEGORIA.
 *
 * Nada en el juego sale gratis, y lo que cuesta cada cosa dice que clase de
 * cosa es. Ninguna mejora puede quedarse sin coste: si no vale dinero, vale
 * otra cosa, y lo que da a cambio tiene que compensarlo.
 *
 *   setup    DINERO    — son cacharros, se compran
 *   casa     DINERO    — y ademas suben el coste de vida para siempre
 *   flujo    MATERIAL  — montar tu sistema te cuesta horas de edicion, o sea
 *                        videos que ese mes no salen
 *   rutina   VIDA      — cambiar de habitos se hace cuesta arriba las primeras
 *                        semanas, y no se puede reorganizar la vida estando
 *                        hecho polvo
 *   formato  IDEAS     — un formato nuevo no se compra, se le da vueltas
 */
export type Categoria = 'setup' | 'flujo' | 'rutina' | 'casa' | 'formato'

/** Vida por debajo de la cual no se puede reorganizar nada. */
export const VIDA_MINIMA_PARA_RUTINA = 0.2

export interface UpgradeEffect {
  /** Multiplicador por nivel, acumulativo. */
  multEficiencia?: number
  multCalidad?: number
  multAlcance?: number
  /** Peso que aporta al reparto del tiempo mientras no este desbloqueado. */
  slots?: Partial<Record<ActivityId, number>>
  /** Sube una etapa de casa. Ojo: tambien sube el coste de vida. */
  subeCasa?: boolean
}

/** Como se llama y que es cada peldaño de una mejora de varios niveles. */
export interface Escalon {
  nombre: string
  descripcion: string
}

export interface Upgrade {
  id: string
  nombre: string
  /** Que hace, en la voz del juego. */
  descripcion: string
  categoria: Categoria
  /** Coste del primer nivel, en euros. */
  coste: number
  /** Cuanto encarece cada nivel adicional. */
  escala: number
  /** Cuantas veces se puede comprar. 1 = mejora unica. */
  maximo: number
  /** Coste en ideas, para los formatos nuevos. */
  costeIdeas?: number
  /**
   * Coste en material, para el flujo de trabajo. Montar tu sistema te cuesta
   * horas de edicion: videos que ese mes no salen.
   */
  costeMaterial?: number
  /**
   * Coste en vida, para las rutinas. Cambiar de habitos se hace cuesta arriba
   * las primeras semanas — y no se puede reorganizar la vida estando roto.
   */
  costeVida?: number
  /** Ciclo a partir del cual aparece en la tienda. */
  desdeCiclo?: number
  /**
   * Los peldaños, uno por nivel. Existen para que subir de nivel se sienta
   * como avanzar y no como pulsar el mismo boton otra vez: cada uno tiene su
   * nombre y su frase, y la tienda enseña el SIGUIENTE.
   */
  escalones?: Escalon[]
  efecto: UpgradeEffect
}

/** El peldaño que toca comprar, si la mejora los declara. */
export function escalon(up: Upgrade, niveles: number): Escalon | null {
  return up.escalones?.[niveles] ?? null
}

export const UPGRADES: Upgrade[] = [
  // ===== SETUP — herramientas. Cuestan DINERO y nada mas. ================
  {
    id: 'micro',
    nombre: 'El microfono',
    descripcion: 'Lo primero que nota quien te escucha, y lo ultimo en lo que piensa nadie.',
    categoria: 'setup',
    coste: 10,
    escala: 1.5,
    maximo: 3,
    escalones: [
      {
        nombre: 'Uno que no suene a lata',
        descripcion: 'Cincuenta euros y de golpe pareces una persona y no un walkie.',
      },
      {
        nombre: 'Con brazo y filtro antipop',
        descripcion: 'Se acabaron las pes explotando y el ruido de la mesa cada vez que te mueves.',
      },
      {
        nombre: 'Tratar la habitacion',
        descripcion: 'Paneles en la pared. No es el micro: era el eco, siempre fue el eco.',
      },
    ],
    // Los tres peldaños juntos valen lo que valia el micro de un solo nivel
    // antes de F8 (x1.20). Mas escalones, mismo destino: lo que cambia es que
    // ahora hay camino, no que el equipo sea mas potente.
    efecto: { multCalidad: 1.063, slots: { produccion: 1 } },
  },
  {
    id: 'camara',
    nombre: 'La camara',
    descripcion: 'La cara es la mitad del directo. La otra mitad es que se te vea.',
    categoria: 'setup',
    coste: 18,
    escala: 1.6,
    maximo: 3,
    escalones: [
      {
        nombre: 'Dejar la webcam de 2009',
        descripcion: 'Una webcam decente. Ya no pareces una prueba de vida.',
      },
      {
        nombre: 'Una reflex por capturadora',
        descripcion: 'Fondo desenfocado y piel que no parece de cera. Se nota mas de lo que crees.',
      },
      {
        nombre: 'Segunda camara y plano cenital',
        descripcion: 'Puedes cambiar de plano. El directo deja de ser un plano fijo de dos horas.',
      },
    ],
    // La camara no añade poder al conjunto: se reparte con la luz lo que
    // antes hacia la luz sola. Es profundidad, no inflacion.
    efecto: { multCalidad: 1.048 },
  },
  {
    id: 'monitor',
    nombre: 'Las pantallas',
    descripcion: 'Cada alt-tab que te ahorras es tiempo real que vuelve.',
    categoria: 'setup',
    coste: 22,
    escala: 1.6,
    maximo: 3,
    escalones: [
      {
        nombre: 'Segunda pantalla',
        descripcion: 'Dejar de hacer alt-tab treinta veces por directo.',
      },
      {
        nombre: 'Tercera, para el chat',
        descripcion: 'El chat deja de taparte el juego. Los ves a los dos a la vez.',
      },
      {
        nombre: 'Brazos y todo colocado',
        descripcion: 'La mesa despejada por debajo. Suena a tonteria hasta que lo tienes.',
      },
    ],
    // Sin slots: las pantallas no te hacen trabajar mas horas, te hacen cundir
    // las que ya echas. Eso ya lo dice el multiplicador de eficiencia.
    efecto: { multEficiencia: 1.063 },
  },
  {
    id: 'luz',
    nombre: 'La iluminacion',
    descripcion: 'Lo mas barato que mas cambia una imagen.',
    categoria: 'setup',
    coste: 26,
    escala: 1.6,
    maximo: 3,
    escalones: [
      { nombre: 'Un foco decente', descripcion: 'La camara deja de pelear con la lampara del techo.' },
      { nombre: 'Luz de relleno', descripcion: 'Se te va la sombra dura de media cara.' },
      { nombre: 'Fondo con color', descripcion: 'La habitacion pasa a ser un decorado. Barato y descarado.' },
    ],
    efecto: { multCalidad: 1.038 },
  },
  {
    id: 'silla',
    nombre: 'El sitio donde te sientas',
    descripcion: 'No hace mejores videos. Hace que aguantes haciendolos.',
    categoria: 'setup',
    coste: 60,
    escala: 1.8,
    maximo: 2,
    escalones: [
      {
        nombre: 'Una silla que no te destroce',
        descripcion: 'Seis horas sentado son seis horas sentado. Se nota en la espalda y en el humor.',
      },
      {
        nombre: 'Mesa regulable',
        descripcion: 'Poder emitir de pie un rato. La segunda mitad del directo cambia.',
      },
    ],
    efecto: { slots: { descanso: 1 }, multCalidad: 1.039 },
  },
  {
    id: 'pc',
    nombre: 'El ordenador',
    descripcion: 'Renderizar deja de ser una excusa para irse a hacer la comida.',
    categoria: 'setup',
    coste: 300,
    escala: 2.1,
    maximo: 4,
    escalones: [
      { nombre: 'Mas RAM y un SSD', descripcion: 'Lo barato primero. Arranca en diez segundos.' },
      { nombre: 'Grafica nueva', descripcion: 'Emitir y jugar a la vez sin que el juego lo pague.' },
      { nombre: 'Torre entera', descripcion: 'De cero. Ya no vas remendando.' },
      { nombre: 'Un segundo equipo para emitir', descripcion: 'Uno juega, otro emite. Nada se cae nunca.' },
    ],
    efecto: { multEficiencia: 1.3 },
  },

  // ===== FLUJO — sistematizar tu propio trabajo. Nunca delegarlo. =========
  // Cuesta MATERIAL: montar tu sistema son horas de edicion, o sea videos que
  // ese mes no salen. Se recupera despues, y de eso va la categoria.
  {
    id: 'plantillas',
    nombre: 'Plantillas de edicion',
    descripcion: 'Dejas de montar cada video desde cero. Lo montas tu igual, pero antes.',
    categoria: 'flujo',
    coste: 45,
    escala: 1.9,
    maximo: 5,
    costeMaterial: 0.4,
    efecto: { multEficiencia: 1.18 },
  },
  {
    id: 'atajos',
    nombre: 'Atajos de teclado propios',
    descripcion: 'Media hora configurandolos, cientos de horas ahorradas.',
    categoria: 'flujo',
    coste: 20,
    escala: 2.2,
    maximo: 3,
    costeMaterial: 0.2,
    efecto: { multEficiencia: 1.15 },
  },
  {
    id: 'guion',
    nombre: 'Guionizar antes de grabar',
    descripcion: 'Menos relleno, menos tijera despues, mejor resultado.',
    categoria: 'flujo',
    coste: 110,
    escala: 2,
    maximo: 3,
    costeMaterial: 0.3,
    efecto: { multCalidad: 1.15, multEficiencia: 1.05 },
  },
  {
    id: 'avisos',
    nombre: 'Un recordatorio en el movil',
    descripcion:
      'Te avisa cuando ya tienes material de sobra parado. No sube nada: solo deja de pasarsete.',
    categoria: 'flujo',
    coste: 0,
    escala: 1,
    maximo: 1,
    costeMaterial: 0.2,
    efecto: {},
  },
  {
    id: 'calendario',
    nombre: 'Calendario de publicacion',
    descripcion:
      'Te sientas un domingo, dejas la semana programada y los videos salen solos cuando toca. Los montas tu igual.',
    categoria: 'flujo',
    coste: 260,
    escala: 1,
    maximo: 1,
    costeMaterial: 0.5,
    desdeCiclo: 2,
    efecto: {},
  },
  {
    id: 'programacion',
    nombre: 'Dejar la cola preparada',
    descripcion:
      'Ademas de programarlo, decides con que mimo sale cada cosa sin tener que estar delante.',
    categoria: 'flujo',
    coste: 900,
    escala: 1,
    maximo: 1,
    costeMaterial: 0.6,
    desdeCiclo: 3,
    efecto: {},
  },
  {
    id: 'archivo',
    nombre: 'Archivo ordenado de material',
    descripcion: 'Encontrar aquel clip de hace dos anos en diez segundos, no en dos horas.',
    categoria: 'flujo',
    coste: 180,
    escala: 1.8,
    maximo: 4,
    costeMaterial: 0.6,
    efecto: { multEficiencia: 1.14 },
  },

  // ===== RUTINA — la vida como sistema, no como premio ====================
  // Cuesta VIDA: cambiar de habitos se hace cuesta arriba las primeras
  // semanas, y no se puede reorganizar la vida estando hecho polvo. Todas
  // devuelven mas de lo que cuestan, pero hay que poder pagarlo primero.
  {
    id: 'horario',
    nombre: 'Un horario de verdad',
    descripcion: 'Emitir siempre a la misma hora. La gente sabe cuando volver; tu tambien.',
    categoria: 'rutina',
    coste: 0,
    escala: 1,
    maximo: 1,
    costeVida: 0.06,
    efecto: { slots: { comunidad: 2 } },
  },
  {
    id: 'cocinar',
    nombre: 'Cocinar en casa',
    descripcion: 'Comer bien no es tiempo perdido. Se nota en las horas siguientes.',
    categoria: 'rutina',
    coste: 30,
    escala: 1,
    maximo: 1,
    costeVida: 0.05,
    efecto: { slots: { vida: 2 } },
  },
  {
    id: 'paseo',
    nombre: 'Salir a andar todos los dias',
    descripcion: 'Las ideas no aparecen delante del monitor.',
    categoria: 'rutina',
    coste: 0,
    escala: 1,
    maximo: 1,
    costeVida: 0.05,
    efecto: { slots: { vida: 2, descanso: 1 } },
  },
  {
    id: 'leer',
    nombre: 'Media hora de lectura al dia',
    /**
     * Ojo con la redaccion: leer NO pasa gratis antes de dormir. Es tiempo del
     * dia a dia que se gasta en ello, y por eso lo que hace esta mejora es que
     * cundan las franjas que ya dedicas, no regalarte unas cuantas.
     */
    descripcion: 'Sentarte a leer de verdad, con la luz puesta. Cunde mas cada rato que le dedicas.',
    categoria: 'rutina',
    coste: 40,
    escala: 1.6,
    maximo: 3,
    costeVida: 0.04,
    escalones: [
      { nombre: 'Media hora al dia', descripcion: 'Un rato fijo, aunque sea corto. Lo dificil es el primero.' },
      { nombre: 'Una hora, y sin movil', descripcion: 'El telefono en otra habitacion. Ahi empieza a cundir.' },
      { nombre: 'Leer en cualquier hueco', descripcion: 'Con el libro siempre encima. Caen cien paginas sin darte cuenta.' },
    ],
    efecto: { slots: { vida: 2, comunidad: 1 } },
  },
  {
    id: 'dormir',
    nombre: 'Dejar de acostarte a las cuatro',
    descripcion:
      'No cuesta un euro y es la mas cara del juego: las dos primeras semanas se hacen eternas.',
    categoria: 'rutina',
    coste: 0,
    escala: 1,
    maximo: 1,
    costeVida: 0.1,
    efecto: { slots: { descanso: 3 }, multCalidad: 1.15 },
  },

  // ===== CASA — sube la calidad de vida Y el coste de vida ================
  {
    id: 'piso',
    nombre: 'Mudarte a un piso mejor',
    descripcion: 'Mas espacio y menos ruido. Tambien mas alquiler: el retiro se aleja.',
    categoria: 'casa',
    coste: 800,
    escala: 1,
    maximo: 1,
    desdeCiclo: 2,
    efecto: { subeCasa: true, multCalidad: 1.15, slots: { vida: 1 } },
  },
  {
    id: 'estudio',
    nombre: 'Una habitacion solo para grabar',
    descripcion: 'Separar donde trabajas de donde vives. Cambia mas de lo que parece.',
    categoria: 'casa',
    coste: 2200,
    escala: 1,
    maximo: 1,
    desdeCiclo: 2,
    efecto: { subeCasa: true, multEficiencia: 1.25, multCalidad: 1.2 },
  },
  {
    id: 'biblioteca',
    nombre: 'Montar la biblioteca',
    descripcion: 'La pared de libros del fondo. Y los libros, que ademas se leen.',
    categoria: 'casa',
    coste: 5000,
    escala: 1,
    maximo: 1,
    desdeCiclo: 3,
    efecto: { subeCasa: true, slots: { vida: 2, comunidad: 3 } },
  },

  // ===== FORMATOS — cuestan ideas, no solo dinero ========================
  {
    id: 'nicho',
    nombre: 'Jugar a lo que te apetece',
    descripcion: 'Menos gente entra, pero la que entra se queda.',
    categoria: 'formato',
    coste: 0,
    escala: 1,
    maximo: 1,
    costeIdeas: 8,
    efecto: { slots: { comunidad: 2 }, multCalidad: 1.1 },
  },
  {
    id: 'charlas',
    nombre: 'Directos de charla',
    descripcion: 'Sin juego de por medio. Casi nadie te descubre asi; casi nadie se va.',
    categoria: 'formato',
    coste: 0,
    escala: 1,
    maximo: 1,
    costeIdeas: 20,
    desdeCiclo: 2,
    efecto: { slots: { comunidad: 4 }, multAlcance: 0.95 },
  },
  {
    id: 'club',
    nombre: 'Club de lectura',
    descripcion: 'El formato que menos alcance da y mas comunidad construye.',
    categoria: 'formato',
    coste: 0,
    escala: 1,
    maximo: 1,
    costeIdeas: 45,
    desdeCiclo: 3,
    efecto: { slots: { comunidad: 6, vida: 1 }, multAlcance: 0.9 },
  },
]

export const UPGRADES_POR_ID: ReadonlyMap<string, Upgrade> = new Map(
  UPGRADES.map((u) => [u.id, u]),
)

/** Con que se paga cada categoria, dicho en la tienda. */
export const MONEDA_CATEGORIA: Record<Categoria, string> = {
  setup: 'Se compran con dinero. Son cacharros: cuestan lo que cuestan.',
  flujo: 'Se pagan con material. Montarte el sistema son horas de edicion — vídeos que este mes no salen y que te devuelve con creces el mes que viene.',
  rutina: 'Se pagan con vida. Cambiar de hábitos se hace cuesta arriba las primeras semanas, y no se puede reorganizar nada estando hecho polvo.',
  casa: 'Se compran con dinero, y suben el coste de vida para siempre. Profesionalizarse aleja el retiro.',
  formato: 'Se pagan con ideas. Un formato no se compra: se le da vueltas hasta que sale.',
}

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  setup: 'Equipo',
  flujo: 'Flujo de trabajo',
  rutina: 'Rutina',
  casa: 'Casa',
  formato: 'Formatos',
}
