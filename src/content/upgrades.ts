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

export type Categoria = 'setup' | 'flujo' | 'rutina' | 'casa' | 'formato'

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
  /** Ciclo a partir del cual aparece en la tienda. */
  desdeCiclo?: number
  efecto: UpgradeEffect
}

export const UPGRADES: Upgrade[] = [
  // ===== SETUP — herramientas. Mejoran lo que sale por hora. ===============
  {
    id: 'micro',
    nombre: 'Un micro que no suene a lata',
    descripcion: 'Lo primero que nota quien te escucha. Sube la calidad de todo.',
    categoria: 'setup',
    coste: 25,
    escala: 1,
    maximo: 1,
    efecto: { multCalidad: 1.25, slots: { produccion: 1 } },
  },
  {
    id: 'monitor',
    nombre: 'Segunda pantalla',
    descripcion: 'Dejar de hacer alt-tab treinta veces por directo es tiempo real ganado.',
    categoria: 'setup',
    coste: 60,
    escala: 1,
    maximo: 1,
    efecto: { multEficiencia: 1.2, slots: { produccion: 1 } },
  },
  {
    id: 'luz',
    nombre: 'Iluminacion decente',
    descripcion: 'La camara deja de parecer una webcam de 2009.',
    categoria: 'setup',
    coste: 90,
    escala: 1,
    maximo: 1,
    efecto: { multCalidad: 1.2 },
  },
  {
    id: 'silla',
    nombre: 'Silla que no te destroce la espalda',
    descripcion: 'No hace mejores videos. Hace que aguantes haciendolos.',
    categoria: 'setup',
    coste: 140,
    escala: 1,
    maximo: 1,
    efecto: { slots: { descanso: 1 }, multCalidad: 1.1 },
  },
  {
    id: 'pc',
    nombre: 'Subir el PC de gama',
    descripcion: 'Renderizar deja de ser una excusa para irse a hacer la comida.',
    categoria: 'setup',
    coste: 300,
    escala: 2.1,
    maximo: 4,
    efecto: { multEficiencia: 1.3 },
  },

  // ===== FLUJO — sistematizar tu propio trabajo. Nunca delegarlo. =========
  {
    id: 'plantillas',
    nombre: 'Plantillas de edicion',
    descripcion: 'Dejas de montar cada video desde cero. Lo montas tu igual, pero antes.',
    categoria: 'flujo',
    coste: 45,
    escala: 1.9,
    maximo: 5,
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
    efecto: { multCalidad: 1.15, multEficiencia: 1.05 },
  },
  {
    id: 'archivo',
    nombre: 'Archivo ordenado de material',
    descripcion: 'Encontrar aquel clip de hace dos anos en diez segundos, no en dos horas.',
    categoria: 'flujo',
    coste: 180,
    escala: 1.8,
    maximo: 4,
    efecto: { multEficiencia: 1.14 },
  },

  // ===== RUTINA — la vida como sistema, no como premio ====================
  {
    id: 'horario',
    nombre: 'Un horario de verdad',
    descripcion: 'Emitir siempre a la misma hora. La gente sabe cuando volver.',
    categoria: 'rutina',
    coste: 0,
    escala: 1,
    maximo: 1,
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
    efecto: { slots: { vida: 2, descanso: 1 } },
  },
  {
    id: 'leer',
    nombre: 'Leer antes de dormir',
    descripcion: 'Materia prima para charlas, y ademas se duerme mejor.',
    categoria: 'rutina',
    coste: 40,
    escala: 1.6,
    maximo: 3,
    efecto: { slots: { vida: 2, comunidad: 1 } },
  },
  {
    id: 'dormir',
    nombre: 'Dejar de acostarte a las cuatro',
    descripcion: 'La mejora mas barata del juego y la que mas cuesta comprar.',
    categoria: 'rutina',
    coste: 0,
    escala: 1,
    maximo: 1,
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

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  setup: 'Equipo',
  flujo: 'Flujo de trabajo',
  rutina: 'Rutina',
  casa: 'Casa',
  formato: 'Formatos',
}
