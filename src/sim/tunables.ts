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

  /**
   * LA SEMANA — el tiempo es un presupuesto que se gasta, no un rio.
   *
   * Siete dias por tres franjas dan 21 unidades: bastantes para que repartir
   * sea una decision con matices, y pocas para que colocarlas no sea un
   * trabajo. Cada franja dura secondsPerWeek/21 segundos de simulacion.
   */
  semana: {
    dias: 7,
    franjasPorDia: 3,
    /**
     * Que parte de las horas de produccion dedica a emitir el plan automatico.
     * El resto va a editar, que es lo que deja material para publicar: un plan
     * que solo emitiera dejaria al jugador de los ciclos 1-2 sin nada que
     * subir.
     */
    emisionDelPlan: 0.6,
    /** Que parte de las horas de vida dedica a leer el plan automatico. */
    lecturaDelPlan: 0.35,
  },

  /** ALCANCE — sube rapido, cae con facilidad. */
  alcance: {
    /** Vida media en segundos sin comunidad que lo proteja. */
    halfLifeSeconds: 45,
    /**
     * Cuanta comunidad hace falta para reducir el decaimiento a la mitad.
     *
     * Calibrado en F6: con 2000, una comunidad de diez minutos ya protegia el
     * alcance casi del todo, y la estrategia equilibrada adelantaba al grind
     * en el minuto 5 — el GDD lo quiere entre el 35 y el 60. El escudo tiene
     * que importar a escala de comunidad MADURA, no de comunidad recien
     * nacida.
     */
    shieldK: 25_000,
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
    gainPerSecondAtFullProduction: 0.0002,
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
    /**
     * Ingresos por unidad de alcance y segundo: la publicidad.
     *
     * Calibrado en F6. Con 0.000009 las visitas apenas pagaban nada, asi que
     * quien forzaba horas se quedaba sin dinero para comprar NADA —un bot de
     * grind puro compraba una sola mejora en toda la partida— y perdia desde
     * el minuto cinco. El GDD quiere lo contrario: que forzar funcione a corto
     * plazo. Las visitas tienen que pagar de verdad; lo que no tienen que
     * hacer es durar.
     */
    cpmPerAlcance: 0.00005,
    /**
     * Techo asintotico de la publicidad, igual que el de la comunidad.
     *
     * Sin el, subir el CPM para que el grind pudiera financiarse inflaba
     * tambien el dinero del tramo final y la partida se acababa en el minuto
     * 57. Con saturacion, las primeras visitas pagan bien y el millon de
     * visitas no paga cien veces mas — que ademas es como funciona.
     */
    alcanceSaturationK: 30_000,
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
    /**
     * Ingreso base por segundo de una publicacion recien salida.
     *
     * Calibrado en F6, y de largo el numero que mas se ha movido. El diseno
     * dice que el catalogo es el motor del retiro —vives de lo que ya
     * publicaste— pero durante cuatro fases aporto alrededor del 1% de la
     * cobertura: el retiro se decidia en realidad por acumular ahorros, que es
     * justo la lectura que el juego NO quiere. Subirlo pone el peso donde
     * tiene que estar.
     *
     * Recalibrado en F7 de 0.0028 a 0.004. Publicar dejo de ser gratis y pasó
     * a costar material, asi que de nueve publicaciones por semana se pasa a
     * dos o tres: menos videos, cada uno pesando mas. La compensacion no es
     * arbitraria, es la misma renta repartida entre menos entradas.
     */
    residualPerPublication: 0.004,
    /** Vida media del decaimiento de una publicacion, en semanas. */
    decayHalfLifeWeeks: 8,
    /**
     * Suelo al que tiende el residual, como fraccion del valor inicial.
     * Que no llegue a cero es lo que convierte el catalogo en una renta.
     */
    floorFraction: 0.12,
  },

  /**
   * PUBLICAR — deja de ser un boton infinito.
   *
   * Publicar cuesta MATERIAL, y el material sale de las horas: grabando poco
   * mientras emites, y de verdad cuando te sientas a editar. Eso es lo que
   * convierte "no emitir" en una decision con sentido en vez de tiempo tirado,
   * y lo que convierte el boton en una decision en vez de un tic.
   *
   * Los ritmos estan puestos para que el reparto de arranque —nueve franjas
   * emitiendo y seis editando— de unas tres publicaciones normales por semana.
   */
  publicacion: {
    /** Material por segundo mientras se emite: lo que se graba de paso. */
    porSegundoEmitiendo: 0.02,
    /** Material por segundo editando. Es aqui donde salen los videos. */
    porSegundoEditando: 0.09,
    /** Tope de material acumulable: se puede tener colchon, no un almacen. */
    maximo: 12,
    /**
     * Los tres niveles de edicion.
     *
     * `peso` es lo que entra al catalogo, y por tanto la renta a años vista:
     * es LA via de retiro. Sacarlo rapido crece hoy —mas pico y mas hype— y
     * cuidarlo construye el final. Por material invertido, cuidado renta mas;
     * lo que compra rapido es tiempo.
     */
    niveles: {
      rapido: { material: 0.6, peso: 0.5, pico: 1.1, hype: 1.3 },
      normal: { material: 1, peso: 1, pico: 1, hype: 1 },
      cuidado: { material: 1.8, peso: 2.2, pico: 0.7, hype: 0.6 },
    },
  },

  /** IDEAS — materia prima de los formatos nuevos. */
  ideas: {
    perSecondAtFullLife: 0.02,
  },

  /**
   * LEER — horas del dia a dia, no un extra antes de dormir.
   *
   * Los ritmos estan puestos para que una franja de leer a la semana termine
   * un libro corto en unas cuatro o cinco semanas: lo bastante lento para que
   * elegir leer cueste algo, lo bastante rapido para que se llegue a ver el
   * final del libro dentro de una partida.
   */
  lectura: {
    /** Segundos de libro por segundo de franja de leer. */
    porSegundoLeyendo: 1,
    /** Lo que cunde leer en una franja de vivir, como fraccion. */
    fraccionViviendo: 0.35,
    /** Lo que aporta cada nivel del habito. No crea tiempo: lo aprovecha. */
    porNivelDeHabito: 0.25,
    /** Ideas de golpe al cerrar un libro. */
    ideasPorLibro: 6,
    /** Semanas que dura el empujon de calidad tras terminarlo. */
    semanasDeposo: 5,
    calidadDeposo: 1.1,
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

  /**
   * PATROCINIOS — la tercera via economica, y la unica que cobra hoy.
   *
   * El juego ya sabe contar esta tension en otro sitio: publicar `rapido`
   * rinde HOY y publicar `cuidado` construye el final. Un patrocinio es esa
   * misma decision llevada al plano de la gente — cobras ahora y lo pagas en
   * quien se queda.
   *
   * Las ofertas son CONSTANTES a proposito. Un patrocinio que saliera una vez
   * cada veinte semanas seria un evento; lo que se quiere modelar es convivir
   * con el goteo, y que decir que no sea barato y repetido.
   */
  patrocinios: {
    /** Ofertas pendientes a la vez. Mas es una bandeja, no una decision. */
    maxOfertas: 3,
    /**
     * Contratos simultaneos.
     *
     * Sin tope, apilar contratos convierte la decision en una tabla de sumas:
     * la respuesta optima seria siempre "todos" y no habria nada que elegir.
     */
    maxContratos: 2,
    /** Semanas que una oferta espera antes de caducar sola. */
    semanasDeOferta: 2,
    /**
     * Probabilidad por semana de que llegue una oferta, si cabe alguna mas.
     *
     * Calibrado contra el banco. Con 0.8 la bandeja no se vaciaba nunca y los
     * dos huecos de contrato estaban ocupados el 100% de la partida: firmar
     * dejaba de ser un adelanto puntual y pasaba a ser una nomina paralela.
     */
    ofertasPorSemana: 0.45,
    /** Comunidad minima: a quien no ve nadie no le escribe ninguna marca. */
    comunidadMinima: 400,
    /**
     * Por debajo de esta credibilidad, el retiro es el epilogo `vendido`.
     *
     * Tienes el dinero pero no a la gente. Se comprueba ANTES que la cobertura
     * a proposito: haberte vendido tapa incluso un retiro holgado, que es
     * exactamente lo que el juego quiere decir.
     */
    umbralVendido: 0.6,
    /**
     * Techo por debajo del cual el retiro tambien es el epilogo `vendido`.
     *
     * El techo solo lo baja la resaca de una moda, asi que esto mide algo muy
     * concreto: cuantas veces estuviste dentro cuando estallo. Con 0.8 hacen
     * falta un par de contratos de moda — una vez es un error, dos veces ya
     * es una forma de trabajar.
     *
     * Calibrado con margen a proposito. Con 0.8 el bot que firma todo acababa
     * en 0.79 y el epilogo se decidia por una centesima: una clasificacion a
     * filo de navaja habria dependido de la semilla, no de como jugaste.
     */
    umbralTechoVendido: 0.9,

    /**
     * CREDIBILIDAD — 0..1, lo que la gente cree que haces por dinero.
     *
     * Multiplica la AFINIDAD y los APOYOS, nunca el alcance ni la publicidad.
     * La asimetria es la idea entera: a quien te descubre hoy le da igual lo
     * que firmaste, y al anunciante mas todavia. Lo que cambia es cuanta de
     * esa gente se queda y cuanta te apoya con su dinero.
     */
    credibilidad: {
      inicial: 1,
      /**
       * Recuperacion por segundo pase lo que pase. El tiempo lo cura casi
       * todo, y "casi" es la palabra importante: es diez veces mas lento que
       * dedicarle franjas.
       */
      recuperaBasePorSegundo: 0.00004,
      /**
       * Recuperacion por segundo con la semana entera en comunidad. Recuperar
       * la confianza de alguien se hace hablando con esa persona, no
       * esperando.
       */
      recuperaPorSegundo: 0.0004,
      /**
       * Suelo del multiplicador de afinidad. Venderse del todo no te deja sin
       * nadie: hay gente que se queda pase lo que pase, y sin suelo esto seria
       * una espiral de muerte en un juego que no tiene derrota.
       */
      sueloAfinidad: 0.3,
      /** Suelo del multiplicador de apoyos. */
      sueloApoyos: 0.4,
      /**
       * Suelo del techo. Cada resaca de moda baja el techo para siempre, pero
       * nunca por debajo de aqui: el juego no tiene estados de los que no se
       * pueda salir.
       */
      techoMinimo: 0.55,
    },
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
