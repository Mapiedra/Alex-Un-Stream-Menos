/**
 * TODAS las constantes de balance del juego, en un unico objeto.
 *
 * Ninguna constante numerica de balance puede escribirse fuera de aqui. Esto
 * es lo que permite que el banco de balance (tools/balance) itere rapido: un
 * cambio de dificultad es un cambio en este fichero, no una caceria por el
 * codigo.
 */

export const TUNABLES = {
  /** Paso fijo de simulacion. */
  tickMs: 100,

  /**
   * Palanca global de ritmo. Es la primera constante que se toca cuando el
   * banco de balance dice que la partida dura demasiado o demasiado poco.
   */
  gameSpeed: 1,

  /** Segundos de simulacion que dura una semana de juego. */
  secondsPerWeek: 90,

  /** ALCANCE — sube rapido, cae con facilidad. */
  alcance: {
    /** Vida media en segundos sin comunidad que lo proteja. */
    halfLifeSeconds: 45,
    /** Cuanta comunidad hace falta para reducir el decaimiento a la mitad. */
    shieldK: 2000,
    /**
     * Fraccion del decaimiento base que NUNCA se puede evitar, por mucha
     * comunidad que tengas. Sin este suelo el crecimiento no tiene techo.
     */
    shieldFloor: 0.25,
  },

  /** COMUNIDAD — crece lento, protege. */
  comunidad: {
    /** Vida media en segundos: ~30 min, dos ordenes de magnitud sobre alcance. */
    halfLifeSeconds: 1800,
    /** Fraccion base de alcance que se convierte en comunidad por segundo. */
    conversionBase: 0.0007,
    /** Cuanto pesa la calidad en la conversion. */
    qualityWeight: 0.6,
    /**
     * Escala de saturacion: a partir de aqui cuesta el doble sumar a alguien
     * nuevo. Representa que la gente a la que le puedes gustar es finita.
     */
    saturationK: 60_000,
  },

  /** CALIDAD — multiplica el rendimiento por hora. */
  calidad: {
    base: 1,
    /** Exponente del castigo por fatiga: (1 - fatiga)^p. */
    fatiguePenaltyExponent: 1.5,
    /** Cuanto aporta la vida a la calidad, como fraccion. */
    lifeWeight: 0.5,
    /** Techo blando: por encima, cada punto cuesta el doble. */
    softCap: 4,
  },

  /** VIDA — 0..1, equilibrio personal. */
  vida: {
    initial: 0.7,
    /** Caida por segundo con la produccion al maximo. */
    drainPerSecondAtFullProduction: 0.004,
    /** Recuperacion por segundo con el tiempo dedicado al descanso. */
    recoveryPerSecondAtFullRest: 0.012,
  },

  /** FATIGA — 0..1, coste acumulado de trabajar. */
  fatiga: {
    gainPerSecondAtFullProduction: 0.0006,
    /** La recuperacion escala con la vida: gente descansada se recupera antes. */
    recoveryPerSecondBase: 0.0015,
    recoveryLifeBonus: 0.004,
    /** A partir de aqui, la calidad empieza a sufrir de verdad. */
    saturationThreshold: 0.6,
    /** A partir de aqui salta el burnout: caro, pero nunca terminal. */
    burnoutThreshold: 0.85,
    /** Aviso al jugador una semana antes de tocar el umbral. */
    warningThreshold: 0.75,
  },

  /** HYPE — multiplicador temporal. */
  hype: {
    halfLifeSeconds: 20,
    /** Aporte de una publicacion manual. */
    perPublish: 0.35,
    /** Tope duro: el hype acelera, nunca sustituye a la estructura. */
    max: 3,
  },

  /** ECONOMIA. */
  economia: {
    /** Ingresos por unidad de alcance y segundo. */
    cpmPerAlcance: 0.000009,
    /** Ingresos por unidad de comunidad y segundo (suscripciones, apoyos). */
    incomePerComunidad: 0.00002,
    /**
     * Techo asintotico de la aportacion de la comunidad. Por mucho que crezca,
     * los ingresos por comunidad no pasan de incomePerComunidad x este valor.
     */
    incomeSaturationK: 60_000,
    /** Ahorros iniciales, en semanas de coste de vida cubiertas. */
    initialSavingsWeeks: 4,
    /** Rendimiento anual de los ahorros, aplicado prorrateado. */
    savingsYield: 0.03,
  },

  /** CATALOGO — la cola larga que hace posible el retiro. */
  catalogo: {
    /** Ingreso base por segundo de una publicacion recien salida. */
    residualPerPublication: 0.0000085,
    /** Vida media del decaimiento de una publicacion, en semanas. */
    decayHalfLifeWeeks: 8,
    /**
     * Suelo al que tiende el residual, como fraccion del valor inicial.
     * Que no llegue a cero es lo que convierte el catalogo en una renta.
     */
    floorFraction: 0.12,
  },

  /** IDEAS — materia prima de los formatos nuevos. */
  ideas: {
    perSecondAtFullLife: 0.02,
  },

  /** VACACIONES — el GDD las quiere razonables y a menudo optimas (6.4). */
  vacaciones: {
    semanas: 3,
    recuperaFatigaPorSegundo: 0.006,
    recuperaVidaPorSegundo: 0.008,
    /** Empujon de hype al volver: "he estado fuera" pasa a "vuelvo con ganas". */
    hypeVuelta: 0.8,
    calidadVuelta: 1.18,
    semanasBonus: 4,
  },

  /** BURNOUT — caro, pero NUNCA terminal (6.5). */
  burnout: {
    /** Dura mas que unas vacaciones: parar tarde sale peor que parar a tiempo. */
    semanas: 5,
    /** Fraccion de comunidad que se pierde al desaparecer de golpe. */
    danoComunidad: 0.18,
    recuperaFatigaPorSegundo: 0.005,
    recuperaVidaPorSegundo: 0.005,
  },

  /** LEGADO — prestigio suave al cerrar ciclos habiendo descansado. */
  legado: {
    /**
     * Comunidad que se consume. El prestigio cuesta algo o no es decision.
     *
     * Ojo al calibrarlo: con 0.15 y multiplicadores del 12-15%, el banco
     * media que irse de vacaciones salia LIGERAMENTE PEOR que no irse. El GDD
     * (regla 4 de la seccion 12) pide justo lo contrario: que parar sea
     * siempre razonable y a menudo optimo.
     */
    fraccionComunidad: 0.07,
    eficienciaPorCiclo: 1.2,
    retencionPorCiclo: 1.25,
    maxEficiencia: 2,
    maxRetencion: 2.5,
  },

  /**
   * FINAL — la condicion de retiro de la seccion 11 del GDD.
   *
   * El dinero solo no basta: hay que haber construido algo y, sobre todo, hay
   * que poder sostenerlo TRABAJANDO POCO. De nada sirve llegar al numero a
   * base de horas, porque entonces no te has retirado de nada.
   */
  final: {
    comunidadMinima: 60_000,
    calidadMinima: 2.5,
    fatigaMaxima: 0.35,
    casaMinima: 3,
    /** Fraccion maxima del tiempo dedicada a producir. */
    horasMaximas: 0.3,
    /** Semanas seguidas cumpliendo todo. Rozarlo un instante no vale. */
    semanasSostenidas: 4,
    /** A partir de aqui el retiro es holgado y no ajustado. */
    coberturaComoda: 1.8,
  },

  /** MOMENTO CLIPPEABLE — contrato de accesibilidad. */
  clip: {
    /** Segundos de ventana para reaccionar. Nunca por debajo de 3. */
    reactionWindowSeconds: 3.5,
    /** Segundos minimos entre apariciones. Nunca por debajo de 25. */
    minIntervalSeconds: 25,
    maxIntervalSeconds: 70,
    /** Multiplicador temporal al acertarlo. Fallarlo no cuesta progreso. */
    bonusMultiplier: 1.6,
    bonusDurationSeconds: 15,
  },
} as const

export type Tunables = typeof TUNABLES

/** Convierte una vida media en segundos a fraccion perdida por segundo. */
export function decayRateFromHalfLife(halfLifeSeconds: number): number {
  return Math.LN2 / halfLifeSeconds
}
