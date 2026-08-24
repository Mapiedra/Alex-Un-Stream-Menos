import { TUNABLES } from './tunables.ts'
import { ACTIVITY_IDS, type ActivityId, type Allocation, type GameState } from './state.ts'

/**
 * La semana como presupuesto de tiempo.
 *
 * El tiempo dejo de ser un rio que corre solo. Una semana son BLOQUES_POR_SEMANA
 * unidades —siete dias por tres franjas— y cada una se gasta en una cosa. Al
 * colocar la ultima, la semana esta llena y se puede vivir; cuando se acaba,
 * la partida se detiene y hay que volver a repartir. La toma de decisiones es
 * una pausa, no algo que se hace mientras el reloj corre.
 *
 * PIEZA CLAVE, y la que hace que esto no obligue a recalibrar el juego entero:
 * durante un bloque, el reparto interno es un ONE-HOT de su actividad. Casi
 * todos los terminos del tick son lineales en el reparto —vida, fatiga, ideas,
 * produccion, el esfuerzo de comunidad—, asi que integrar one-hots a lo largo
 * de la semana da los MISMOS totales semanales que usar la fraccion promedio.
 * `Allocation` sigue siendo la unica representacion interna del tiempo; esta
 * es su tercera interfaz, no un sistema nuevo.
 */

export type BloqueId = 'emitir' | 'editar' | 'comunidad' | 'leer' | 'vida' | 'dormir'

export const BLOQUE_IDS = ['emitir', 'editar', 'comunidad', 'leer', 'vida', 'dormir'] as const

export type FaseSemana = 'planificando' | 'viviendo'

export interface Semana {
  /** Un bloque por franja, en orden de lectura: dia 0 mañana, tarde, noche... */
  bloques: BloqueId[]
  /** Franja en curso, 0..BLOQUES_POR_SEMANA-1. Se deriva del reloj. */
  cursor: number
  fase: FaseSemana
}

/**
 * Cuantas franjas tiene una semana. Es geometria de la rejilla, no una palanca
 * de dificultad: las dos cifras que la componen viven en tunables.
 */
export const BLOQUES_POR_SEMANA = TUNABLES.semana.dias * TUNABLES.semana.franjasPorDia

/** Cuanto dura una franja en segundos de simulacion. */
export const SEGUNDOS_POR_BLOQUE = TUNABLES.secondsPerWeek / BLOQUES_POR_SEMANA

/**
 * En que actividad gasta cada bloque su tiempo.
 *
 * Dos bloques comparten actividad a proposito: emitir y editar son las dos
 * mitades de producir, y leer y vivir las dos de la vida personal. Lo que las
 * separa no es cuanto tiempo cuestan, sino que dejan detras.
 */
export const BLOQUE_A_ACTIVIDAD: Record<BloqueId, ActivityId> = {
  emitir: 'produccion',
  editar: 'produccion',
  comunidad: 'comunidad',
  leer: 'vida',
  vida: 'vida',
  dormir: 'descanso',
}

export const NOMBRE_BLOQUE: Record<BloqueId, string> = {
  emitir: 'Emitir',
  editar: 'Editar',
  comunidad: 'Comunidad',
  leer: 'Leer',
  vida: 'Vida',
  dormir: 'Dormir',
}

/** El bloque con el que arranca una franja vacia. */
export const BLOQUE_POR_DEFECTO: BloqueId = 'dormir'

const CERO: Allocation = { produccion: 0, comunidad: 0, vida: 0, descanso: 0 }

/**
 * El reparto de UN bloque: todo su tiempo en una sola actividad.
 *
 * Se precalcula porque el tick lo pide en cada paso y siempre es uno de seis.
 */
const ONE_HOT: Record<BloqueId, Allocation> = Object.fromEntries(
  BLOQUE_IDS.map((b) => [b, { ...CERO, [BLOQUE_A_ACTIVIDAD[b]]: 1 }]),
) as Record<BloqueId, Allocation>

export function allocationDelBloque(bloque: BloqueId): Allocation {
  return ONE_HOT[bloque]
}

/** Que fraccion de la semana planificada va a una actividad. */
export function fraccionDelPlan(bloques: readonly BloqueId[], actividad: ActivityId): number {
  if (bloques.length === 0) return 0
  const n = bloques.filter((b) => BLOQUE_A_ACTIVIDAD[b] === actividad).length
  return n / bloques.length
}

/**
 * El reparto que representa una semana entera.
 *
 * Es lo que ve el resto del juego cuando pregunta "en que gastas tus horas":
 * la condicion de retiro, la telemetria y los paneles. El one-hot del bloque
 * en curso es un detalle interno del tick.
 */
export function allocationDelPlan(bloques: readonly BloqueId[]): Allocation {
  return {
    produccion: fraccionDelPlan(bloques, 'produccion'),
    comunidad: fraccionDelPlan(bloques, 'comunidad'),
    vida: fraccionDelPlan(bloques, 'vida'),
    descanso: fraccionDelPlan(bloques, 'descanso'),
  }
}

export function contarBloques(bloques: readonly BloqueId[]): Record<BloqueId, number> {
  const cuenta = Object.fromEntries(BLOQUE_IDS.map((b) => [b, 0])) as Record<BloqueId, number>
  for (const b of bloques) cuenta[b] += 1
  return cuenta
}

/**
 * Reparte N unidades entre las actividades segun su fraccion.
 *
 * Metodo del resto mayor, con desempate por el orden fijo de ACTIVITY_IDS para
 * que sea determinista: el motor no puede depender del orden de las claves de
 * un objeto ni de nada aleatorio.
 */
function repartirEnteros(alloc: Allocation, total: number): Record<ActivityId, number> {
  const exactos = ACTIVITY_IDS.map((id) => ({ id, valor: Math.max(0, alloc[id]) * total }))
  const suma = exactos.reduce((acc, e) => acc + e.valor, 0)
  const escala = suma > 0 ? total / suma : 0

  const base = exactos.map((e) => {
    const escalado = e.valor * escala
    return { id: e.id, entero: Math.floor(escalado), resto: escalado - Math.floor(escalado) }
  })

  let asignados = base.reduce((acc, b) => acc + b.entero, 0)
  const porResto = [...base].sort((a, b) => b.resto - a.resto)

  let i = 0
  while (asignados < total) {
    const fila = porResto[i % porResto.length]
    if (fila) {
      fila.entero += 1
      asignados += 1
    }
    i += 1
  }

  return Object.fromEntries(base.map((b) => [b.id, b.entero])) as Record<ActivityId, number>
}

/**
 * Divide una cantidad de bloques entre dos usos de la misma actividad.
 * El primero se lleva la fraccion indicada, redondeando a su favor.
 */
function partir(total: number, fraccion: number): [number, number] {
  if (total <= 0) return [0, 0]
  const primero = Math.max(total > 0 ? 1 : 0, Math.round(total * fraccion))
  const acotado = Math.min(total, primero)
  return [acotado, total - acotado]
}

/**
 * Prioridad de franja dentro de un dia.
 *
 * Solo afecta a como se LEE la semana: editar por la mañana, emitir por la
 * tarde, dormir de noche. Mecanicamente da igual el orden —lo que cuenta es
 * cuantos bloques hay de cada cosa—, pero una semana que parece una semana se
 * entiende mucho antes que veintiuna casillas barajadas.
 */
const ORDEN_FRANJA: Record<BloqueId, number> = {
  editar: 0,
  vida: 1,
  emitir: 2,
  comunidad: 3,
  leer: 4,
  dormir: 5,
}

/**
 * Traduce un reparto a una semana concreta de bloques.
 *
 * Es lo que planifica por el jugador durante los ciclos 1 y 2, cuando las
 * horas todavia las deciden las mejoras compradas, y lo que planifica durante
 * un descanso, cuando pedirle a alguien de vacaciones que organice su semana
 * seria una broma.
 */
export function planAutomatico(alloc: Allocation): BloqueId[] {
  const porActividad = repartirEnteros(alloc, BLOQUES_POR_SEMANA)

  const [emitir, editar] = partir(porActividad.produccion, TUNABLES.semana.emisionDelPlan)
  const [leer, vida] = partir(porActividad.vida, TUNABLES.semana.lecturaDelPlan)

  const cuenta: Record<BloqueId, number> = {
    emitir,
    editar,
    comunidad: porActividad.comunidad,
    leer,
    vida,
    dormir: porActividad.descanso,
  }

  // Round-robin: reparte los tipos a lo largo de la semana en vez de dejar
  // tres dias seguidos de una sola cosa.
  const secuencia: BloqueId[] = []
  const restante = { ...cuenta }
  while (secuencia.length < BLOQUES_POR_SEMANA) {
    let puesto = false
    for (const b of BLOQUE_IDS) {
      if (restante[b] > 0) {
        restante[b] -= 1
        secuencia.push(b)
        puesto = true
        if (secuencia.length === BLOQUES_POR_SEMANA) break
      }
    }
    // Si no queda nada que repartir (repartos degenerados), se rellena.
    if (!puesto) secuencia.push(BLOQUE_POR_DEFECTO)
  }

  return ordenarPorFranja(secuencia)
}

/** Ordena los bloques de cada dia para que la semana se lea como una semana. */
function ordenarPorFranja(bloques: BloqueId[]): BloqueId[] {
  const franjas = TUNABLES.semana.franjasPorDia
  const salida: BloqueId[] = []
  for (let dia = 0; dia < TUNABLES.semana.dias; dia++) {
    const delDia = bloques.slice(dia * franjas, dia * franjas + franjas)
    delDia.sort((a, b) => ORDEN_FRANJA[a] - ORDEN_FRANJA[b])
    salida.push(...delDia)
  }
  return salida
}

/** Una semana recien planificada por el juego, esperando a que la vivan. */
export function crearSemana(alloc: Allocation): Semana {
  return { bloques: planAutomatico(alloc), cursor: 0, fase: 'planificando' }
}

/** Cambia una franja del plan. Solo tiene sentido mientras se planifica. */
export function planificarBloque(semana: Semana, indice: number, bloque: BloqueId): Semana {
  if (indice < 0 || indice >= semana.bloques.length) return semana
  if (semana.bloques[indice] === bloque) return semana
  const bloques = [...semana.bloques]
  bloques[indice] = bloque
  return { ...semana, bloques }
}

/** Pone la semana entera de un mismo bloque. Atajo del planificador. */
export function llenarSemana(semana: Semana, bloque: BloqueId): Semana {
  return { ...semana, bloques: semana.bloques.map(() => bloque) }
}

/**
 * Lanza la semana ya repartida.
 *
 * El punto exacto en que el jugador deja de decidir y empieza a vivir con lo
 * decidido. Lo usan la interfaz, el banco de balance y los tests: los tres
 * necesitan la misma frontera.
 */
export function lanzarSemana(state: GameState): GameState {
  if (state.semana.fase === 'viviendo') return state
  return { ...state, semana: { ...state.semana, fase: 'viviendo' } }
}

/** Qué se esta haciendo ahora mismo. */
export function bloqueActual(semana: Semana): BloqueId {
  return semana.bloques[semana.cursor] ?? BLOQUE_POR_DEFECTO
}

/**
 * En que franja cae un instante del reloj.
 *
 * Se deriva del tiempo transcurrido en vez de llevar un contador aparte: el
 * reloj solo avanza mientras se vive la semana, asi que las dos cuentas no
 * pueden desincronizarse.
 */
export function cursorDeSemana(elapsedMs: number): number {
  const segundosEnSemana = (elapsedMs / 1000) % TUNABLES.secondsPerWeek
  const indice = Math.floor(segundosEnSemana / SEGUNDOS_POR_BLOQUE)
  return Math.min(BLOQUES_POR_SEMANA - 1, Math.max(0, indice))
}

/** Coordenadas de una franja, para pintarla y para nombrarla. */
export function posicionDeBloque(indice: number): { dia: number; franja: number } {
  const franjas = TUNABLES.semana.franjasPorDia
  return { dia: Math.floor(indice / franjas), franja: indice % franjas }
}

export const NOMBRE_DIA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
export const NOMBRE_FRANJA = ['Mañana', 'Tarde', 'Noche']
