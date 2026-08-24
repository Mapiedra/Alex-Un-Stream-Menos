import { createRng, type RngState } from './rng.ts'
import type { ChatMessage } from './chat.ts'
import { createClipState, type ClipState } from './clip.ts'
import { FORMATO_INICIAL } from '../content/contentTypes.ts'
import { crearHistorial, type Historial } from './historial.ts'
import { houseStage } from '../content/houseStages.ts'
import type { ModificadorActivo } from './lifeEvents.ts'
import type { EventoActivo } from './bigEvents.ts'
import type { Descanso } from './descanso.ts'
import type { ContratoActivo, OfertaPendiente } from './patrocinios.ts'
import type { FinalPartida } from './final.ts'
import { allocationDelPlan, crearSemana, type Semana } from './semana.ts'
import { NIVEL_POR_DEFECTO, type NivelEdicion } from './publicacion.ts'
import { crearLectura, type Lectura } from './lectura.ts'
import { TUNABLES } from './tunables.ts'

/**
 * Version del formato de guardado. Se sube cada vez que GameState cambia de
 * forma, y se anade la migracion correspondiente en save/migrate.ts.
 */
export const SCHEMA_VERSION = 12

/**
 * Reparto del tiempo del creador. Siempre suma 1.
 *
 * Es la UNICA representacion interna de "en que gasta las horas", y tiene tres
 * interfaces sobre el mismo objeto: en los ciclos 1-2 lo derivan las mejoras
 * compradas, desde el ciclo 3 lo coloca el jugador bloque a bloque en el
 * planificador, y dentro del tick es el one-hot de la franja en curso. No hay
 * tres sistemas: hay uno con tres caras.
 *
 * Este campo guarda siempre la lectura de SEMANA COMPLETA — que fraccion de
 * las 21 franjas va a cada cosa. Es lo que miran la condicion de retiro, los
 * paneles y la telemetria.
 */
export interface Allocation {
  produccion: number
  comunidad: number
  vida: number
  descanso: number
}

export const ACTIVITY_IDS = ['produccion', 'comunidad', 'vida', 'descanso'] as const
export type ActivityId = (typeof ACTIVITY_IDS)[number]

/**
 * Entrada del catalogo, agregada por semana para que el array no crezca sin
 * limite: una partida completa son ~80 semanas, luego ~80 entradas.
 */
export interface CatalogEntry {
  /** Semana en que se publico. */
  week: number
  /** Suma de calidad de todo lo publicado esa semana. */
  weight: number
}

export interface GameState {
  schemaVersion: number
  rng: RngState

  /** Milisegundos de simulacion ACTIVA. Excluye el tiempo en pausa leyendo. */
  elapsedMs: number
  week: number
  cycle: number

  // Recursos
  alcance: number
  comunidad: number
  /** Derivado: recalculado cada tick desde vida, fatiga y mejoras. */
  calidad: number
  /** 0..1 */
  vida: number
  /** 0..1 */
  fatiga: number
  hype: number
  ideas: number

  /**
   * Formato de contenido activo. La decision estrategica central: no cambia
   * cuanto trabajas, cambia en que se convierte tu trabajo.
   */
  formato: string

  /** El unico clicker del juego. Nunca obligatorio. */
  clip: ClipState

  /**
   * Encendido o apagado del directo a mano, solo para la franja en curso.
   *
   * La semana pone el marco —que tardes toca emitir— y este campo deja
   * decidir el momento exacto: cortar antes de tiempo, o encender aunque hoy
   * no tocase. En cuanto el cursor pasa de franja deja de aplicar solo.
   */
  directoManual: { bloque: number; encendido: boolean } | null

  /**
   * Material listo para publicar, medido en videos.
   *
   * Lo genera editar —y, poco a poco, emitir— y lo gasta publicar. Es lo que
   * convierte el boton de publicar en una decision.
   */
  material: number

  /** Nivel con el que publica el calendario automatico. */
  nivelAuto: NivelEdicion

  /**
   * Lo que estas leyendo y lo que llevas leido.
   *
   * Leer cuesta franjas del dia a dia. Terminar un libro deja ideas y poso, y
   * la coleccion acumula sinergias pequeñas y permanentes.
   */
  lectura: Lectura

  /**
   * Ciclo cuya entrada esta esperando a que el jugador la lea.
   *
   * Mientras no sea null la simulacion esta detenida, igual que con una
   * tarjeta de vida: leer no debe consumir partida. Lo rellena `avanzarCiclo`
   * y lo vacia la UI al cerrar el modal.
   */
  avisoCiclo: number | null

  /** Partida cerrada, con su epilogo. Mientras sea null, se sigue jugando. */
  final: FinalPartida | null
  /** Semanas seguidas cumpliendo las condiciones de retiro. */
  semanasEnUmbral: number

  /** Evento extraordinario en curso, con su fase. */
  evento: EventoActivo | null
  /** Semana de la ultima aparicion de cada evento, para el reposo. */
  ultimoBigEvent: Record<string, number>
  /** Parada en curso: vacaciones o burnout. */
  descanso: Descanso | null
  /** Reparto guardado antes de parar, para restaurarlo al volver. */
  repartoAntesDeParar: Allocation | null

  /**
   * Tarjeta de vida esperando respuesta. Mientras no sea null, la simulacion
   * esta detenida: leer no debe consumir partida.
   */
  eventoPendiente: string | null
  /** Tarjetas ya vistas, para no repetirlas. */
  eventosVistos: string[]
  /** Semana en la que salio la ultima tarjeta. */
  ultimoEventoSemana: number
  /** Modificadores temporales de las tarjetas resueltas. */
  modificadores: ModificadorActivo[]

  /** Curvas de alcance y comunidad, para que la diferencia se VEA. */
  historial: Historial

  /** Los ultimos mensajes del chat. La comunidad, hecha visible. */
  chat: ChatMessage[]
  chatNextId: number
  /** Resto acumulado del generador de chat entre ticks. */
  chatAcc: number

  /**
   * CREDIBILIDAD — 0..1, lo que la gente cree que haces por dinero.
   *
   * Arranca intacta y solo la gasta vender. Multiplica la afinidad y los
   * apoyos, nunca el alcance ni la publicidad: al que te descubre hoy le da
   * igual el patrocinio, y al anunciante mas todavia. Lo que cambia es cuanta
   * de esa gente se queda.
   */
  credibilidad: number
  /**
   * Hasta donde puede recuperarse la credibilidad.
   *
   * Arranca en 1 y cada resaca de moda lo baja un poco, PARA SIEMPRE. Es lo
   * que hace que venderse pese: siempre puedes recuperarte, nunca del todo
   * hasta donde estabas. Tiene un minimo, porque aqui no hay pozos.
   */
  techoCredibilidad: number

  /**
   * Ofertas de marcas esperando respuesta, con su caducidad.
   *
   * NO congelan la partida como las tarjetas de vida: llegan constantemente y
   * parar el juego en cada una seria insoportable. Viven en su pantalla y
   * avisan con el punto rojo.
   */
  /**
   * PRNG propio del sistema de marcas.
   *
   * Aparte del general, y por una razon que vale la pena escribir: el sorteo
   * de ofertas tira del generador todas las semanas, asi que compartir la
   * corriente desplazaba la de TODOS los demas sistemas —tarjetas de vida,
   * eventos grandes, momentos clippeables— y cambiaba el resultado del banco
   * de balance incluso para una politica que no firma ni un contrato.
   *
   * Eso es inaceptable en este proyecto: las reglas de diseno del GDD son
   * tests que fallan en CI, y anadir un sistema no puede mover en silencio lo
   * que miden todos los demas. Con corriente propia, una partida que ignore
   * las marcas es identica bit a bit a la de antes de que existieran.
   */
  rngMarcas: RngState
  ofertas: OfertaPendiente[]
  /** Contratos firmados y corriendo. */
  contratos: ContratoActivo[]
  /**
   * Cuantos contratos firmaste de cada categoria, en toda la partida.
   *
   * No se descuenta al terminar un contrato: lo que firmaste no deja de haber
   * pasado. Es lo que mira la resaca cuando estalla la moda.
   */
  aceptadosPorCategoria: Record<string, number>
  /** Modas que ya estallaron, para no cobrarlas dos veces. */
  resacas: string[]
  /**
   * Moda que acaba de estallar y cuyo titular espera a que lo lean.
   *
   * Mientras no sea null la simulacion esta detenida, igual que con
   * `avisoCiclo`: leer no debe consumir partida.
   */
  resacaPendiente: string | null
  /** Derivado: lo que aportan los contratos, para separarlo en la UI. */
  ingresosPatrocinio: number

  // Economia
  ahorros: number
  /** Derivado: ingresos por segundo del ultimo tick, para mostrar en la UI. */
  ingresosPorSegundo: number
  catalogo: CatalogEntry[]

  // Reparto del tiempo
  /**
   * La semana planificada: en que se gasta cada franja, por donde va el
   * cursor y si toca repartir o vivir. Mientras la fase sea 'planificando' la
   * simulacion esta detenida: decidir es una pausa.
   */
  semana: Semana

  allocation: Allocation
  /** Se abre al llegar al ciclo 3: sistematizar el flujo propio. */
  allocationUnlocked: boolean

  /** Mejoras compradas: id -> niveles. La fuente de casi todo lo demas. */
  owned: Record<string, number>

  // Derivados de `owned`, recalculados en cada compra.
  multEficiencia: number
  multCalidad: number
  multAlcance: number

  houseStage: number

  /** Prestigio suave acumulado al cerrar ciclos con vacaciones. */
  legadoEficiencia: number
  legadoRetencion: number

  // Historial, para condiciones de victoria y epilogos
  vacacionesCompletadas: number
  eventosExtraordinarios: number
  burnouts: number
  publicacionesTotales: number
}

/**
 * El reparto de arranque, ya traducido a franjas. Lo fija el juego.
 *
 * Es una funcion y no una constante de modulo a proposito: cada partida se
 * lleva su propio array de bloques en vez de compartir uno global.
 */
function semanaInicial() {
  return crearSemana({ produccion: 0.7, comunidad: 0.05, vida: 0.15, descanso: 0.1 })
}

export function createInitialState(seed = 1): GameState {
  const costeVidaInicial = houseLivingCost(0)
  const semana = semanaInicial()
  return {
    schemaVersion: SCHEMA_VERSION,
    rng: createRng(seed),

    elapsedMs: 0,
    week: 0,
    cycle: 1,

    alcance: 0,
    comunidad: 0,
    calidad: TUNABLES.calidad.base,
    vida: TUNABLES.vida.initial,
    fatiga: 0,
    hype: 0,
    ideas: 0,

    formato: FORMATO_INICIAL,
    clip: createClipState(),
    directoManual: null,
    material: 0,
    nivelAuto: NIVEL_POR_DEFECTO,
    lectura: crearLectura(),

    // La entrada del ciclo 1 la abre quien empieza partida nueva, no el
    // motor: cargar un guardado no debe volver a contarte el principio.
    avisoCiclo: null,

    final: null,
    semanasEnUmbral: 0,

    evento: null,
    ultimoBigEvent: {},
    descanso: null,
    repartoAntesDeParar: null,

    eventoPendiente: null,
    eventosVistos: [],
    ultimoEventoSemana: 0,
    modificadores: [],

    historial: crearHistorial(),

    chat: [],
    chatNextId: 1,
    chatAcc: 0,

    // Derivada de la semilla para que siga siendo determinista, y distinta
    // para que las dos corrientes no vayan sincronizadas.
    rngMarcas: createRng(seed * 2654435761 + 1),
    ofertas: [],
    contratos: [],
    aceptadosPorCategoria: {},
    resacas: [],
    resacaPendiente: null,
    ingresosPatrocinio: 0,

    credibilidad: TUNABLES.patrocinios.credibilidad.inicial,
    techoCredibilidad: 1,

    ahorros: costeVidaInicial * TUNABLES.economia.initialSavingsWeeks,
    ingresosPorSegundo: 0,
    catalogo: [],

    // Ciclo 1: casi todo produccion. Lo fija el juego, no el jugador.
    semana,
    allocation: allocationDelPlan(semana.bloques),
    allocationUnlocked: false,

    owned: {},

    multEficiencia: 1,
    multCalidad: 1,
    multAlcance: 1,

    houseStage: 0,

    legadoEficiencia: 1,
    legadoRetencion: 1,

    vacacionesCompletadas: 0,
    eventosExtraordinarios: 0,
    burnouts: 0,
    publicacionesTotales: 0,
  }
}

/**
 * Coste de vida semanal por etapa de casa.
 *
 * La cifra vive en content/houseStages.ts, junto a la etapa que la justifica.
 * Esta funcion queda como el punto de entrada que ya usa medio motor.
 */
export function houseLivingCost(stage: number): number {
  return houseStage(stage).costeVida
}

/** Normaliza un reparto para que sume exactamente 1. */
export function normalizeAllocation(a: Allocation): Allocation {
  const total = a.produccion + a.comunidad + a.vida + a.descanso
  if (total <= 0) return { produccion: 0, comunidad: 0, vida: 0, descanso: 1 }
  return {
    produccion: a.produccion / total,
    comunidad: a.comunidad / total,
    vida: a.vida / total,
    descanso: a.descanso / total,
  }
}
