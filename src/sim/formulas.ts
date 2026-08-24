import { TUNABLES, decayRateFromHalfLife } from './tunables.ts'
import type { GameState } from './state.ts'

/**
 * Las ecuaciones del juego, aisladas y puras para poder testearlas una a una
 * y exponerlas en los tooltips. Aqui no hay estado ni efectos.
 */

/**
 * CALIDAD = base x f(vida) x castigoDeFatiga x mejoras, con techo blando.
 *
 * El castigo por fatiga NO empieza en cero: empieza en la saturacion. Es la
 * secuencia literal del GDD (6.5) — "genera fatiga, despues saturacion y
 * finalmente burnout"— y hasta F6 estaba mal implementada: la calidad se
 * degradaba desde el primer segundo de cansancio.
 *
 * Esa diferencia decidia la partida entera. Con el castigo empezando en cero,
 * quien forzaba horas veia su calidad hundirse a los diez minutos y la
 * estrategia equilibrada le adelantaba en el minuto cinco, cuando el GDD pide
 * que el grind lidere hasta el 35 y pierda a partir del 60. Con el castigo
 * empezando en la saturacion, acumular fatiga es gratis un rato —estas
 * cansado, no roto— y luego cae en picado.
 */
export function calcCalidad(vida: number, fatiga: number, multCalidad: number): number {
  const { base, lifeWeight, softCap } = TUNABLES.calidad
  const lifeFactor = 1 - lifeWeight + lifeWeight * clamp01(vida)
  const raw = base * lifeFactor * castigoFatiga(fatiga) * multCalidad
  return applySoftCap(raw, softCap)
}

/**
 * Cuanto multiplica la fatiga a la calidad. 1 mientras no haya saturacion.
 *
 * Por debajo del umbral de saturacion no cuesta nada: puedes acumular
 * cansancio sin que se note en lo que haces. A partir de ahi cae con
 * exponente mayor que 1, asi que los ultimos puntos hunden el rendimiento
 * mucho mas que los primeros.
 */
export function castigoFatiga(fatiga: number): number {
  const { saturationThreshold } = TUNABLES.fatiga
  const f = clamp01(fatiga)
  if (f <= saturationThreshold) return 1

  const margen = 1 - saturationThreshold
  const restante = (1 - f) / margen
  return Math.pow(Math.max(0, restante), TUNABLES.calidad.fatiguePenaltyExponent)
}

/** Por encima del techo, cada punto adicional cuesta el doble. */
export function applySoftCap(value: number, cap: number): number {
  if (value <= cap) return value
  return cap + (value - cap) / 2
}

/**
 * PRODUCCION EFECTIVA = base x calidad x eficiencia x (1 + hype) x multEvento
 *
 * La ecuacion de la seccion 4 del GDD, literal. La "base" es la fraccion de
 * tiempo dedicada a producir, no un contador de horas: por eso reducir horas
 * y subir calidad puede salir a cuenta.
 */
export function calcProduccion(
  tiempoProduccion: number,
  calidad: number,
  eficiencia: number,
  hype: number,
  multEvento = 1,
): number {
  return tiempoProduccion * calidad * eficiencia * (1 + hype) * multEvento
}

/**
 * Decaimiento del alcance, amortiguado por la comunidad.
 *
 *   lambda_efectiva = lambda_base x (suelo + (1 - suelo) / (1 + C / k))
 *
 * Es la regla de balance n5 del GDD convertida en ecuacion: parar sale barato
 * solo si has construido comunidad.
 *
 * El SUELO no es decoracion. Sin el, la formula era lambda/(1 + C/k), que
 * tiende a cero: con comunidad suficiente el alcance dejaba de caer, y como el
 * alcance alimenta la comunidad, ambos se disparaban sin techo. El banco de
 * balance lo detecto con comunidades de nueve cifras. Con suelo, el escudo
 * tiene un tope: proteger mucho, si; volverse inmune, no.
 */
export function calcAlcanceDecayRate(comunidad: number, legadoRetencion: number): number {
  const base = decayRateFromHalfLife(TUNABLES.alcance.halfLifeSeconds)
  const { shieldK, shieldFloor } = TUNABLES.alcance
  const proteccion = 1 / (1 + (comunidad * legadoRetencion) / shieldK)
  return base * (shieldFloor + (1 - shieldFloor) * proteccion)
}

/**
 * Conversion de alcance en comunidad.
 *
 * La afinidad depende del formato (charlas y libros convierten mucho, juegos
 * populares poco) y la calidad pesa fuerte: gente que llega a algo bueno se
 * queda.
 */
export function calcConversion(
  alcance: number,
  calidad: number,
  afinidadFormato: number,
  tiempoComunidad: number,
  comunidad = 0,
): number {
  const { conversionBase, qualityWeight, saturationK } = TUNABLES.comunidad
  const qualityFactor = 1 - qualityWeight + qualityWeight * calidad
  const esfuerzo = afinidadFormato + tiempoComunidad
  // Saturacion: la gente a la que le puedes gustar es finita. Cuanta mas
  // comunidad tienes, menos queda por convertir. Sin esto, la conversion
  // realimentaba al escudo y el crecimiento no tenia techo.
  const margen = 1 / (1 + comunidad / saturationK)
  return alcance * conversionBase * qualityFactor * esfuerzo * margen
}

/**
 * Ingresos por segundo del flujo directo: publicidad y apoyos.
 *
 * Las DOS fuentes saturan. Ni una comunidad diez veces mayor paga diez veces
 * mas —cambia la proporcion de gente que apoya y se topan los patrocinios—,
 * ni un millon de visitas paga cien veces lo que diez mil.
 *
 * Sin saturar, el dinero tardio crecia tanto que el retiro se resolvia por
 * pura acumulacion y el catalogo —que es el motor economico que quiere el
 * diseno— dejaba de importar. El banco lo vio dos veces: coberturas de 23x
 * cuando 1x ya es retirarse, y partidas que se acababan en el minuto 57.
 */
export function calcIngresosDirectos(
  alcance: number,
  comunidad: number,
  credibilidad = 1,
): number {
  const { cpmPerAlcance, incomePerComunidad, incomeSaturationK, alcanceSaturationK } =
    TUNABLES.economia
  const comunidadEfectiva = comunidad / (1 + comunidad / incomeSaturationK)
  const alcanceEfectivo = alcance / (1 + alcance / alcanceSaturationK)
  // La credibilidad toca los APOYOS y no la publicidad. Al anunciante no le
  // importa lo que hayas firmado; a quien te da su dinero todos los meses, si.
  return (
    alcanceEfectivo * cpmPerAlcance +
    comunidadEfectiva * incomePerComunidad * factorApoyos(credibilidad)
  )
}

/**
 * Cuanto multiplica la credibilidad a la AFINIDAD.
 *
 * A la afinidad y no al alcance, y es toda la idea del sistema: a quien te
 * descubre hoy le da igual el patrocinio que llevas encima. Lo que cambia es
 * cuanta de esa gente vuelve manana.
 *
 * Con suelo, por la misma razon que lo tiene el escudo del alcance: sin el,
 * venderse llevaria la conversion a cero, la comunidad se hundiria, y de ahi
 * no se sale. Este juego no tiene derrota, asi que ningun sistema puede tener
 * un pozo.
 *
 * Con la credibilidad intacta vale EXACTAMENTE 1, nunca mas. La credibilidad
 * no es un bonus que se gana: es algo con lo que se empieza y que solo se
 * puede gastar. Si valiese mas de 1 en su maximo, todo el balance calibrado en
 * F6 se movia de sitio el dia que se anadio este sistema.
 */
export function factorAfinidad(credibilidad: number): number {
  const { sueloAfinidad } = TUNABLES.patrocinios.credibilidad
  return sueloAfinidad + (1 - sueloAfinidad) * clamp01(credibilidad)
}

/** Cuanto multiplica a los apoyos de la comunidad. Los anuncios no se enteran. */
export function factorApoyos(credibilidad: number): number {
  const { sueloApoyos } = TUNABLES.patrocinios.credibilidad
  return sueloApoyos + (1 - sueloApoyos) * clamp01(credibilidad)
}

/**
 * Residual de una publicacion: decae hacia un suelo, nunca hacia cero.
 *
 * Que tienda a una meseta y no a cero es lo que convierte un catalogo grande
 * y de calidad en una renta, y por tanto lo que hace posible el retiro.
 */
export function calcResidual(weight: number, weeksSincePublish: number): number {
  const { residualPerPublication, decayHalfLifeWeeks, floorFraction } = TUNABLES.catalogo
  const decay = Math.pow(0.5, Math.max(0, weeksSincePublish) / decayHalfLifeWeeks)
  const shaped = floorFraction + (1 - floorFraction) * decay
  return weight * residualPerPublication * shaped
}

/** Suma el residual de todo el catalogo, en ingresos por segundo. */
export function calcResidualTotal(state: Pick<GameState, 'catalogo' | 'week'>): number {
  let total = 0
  for (const entry of state.catalogo) {
    total += calcResidual(entry.weight, state.week - entry.week)
  }
  return total
}

/** Recuperacion de fatiga: quien tiene mejor vida se recupera mas rapido. */
export function calcRecuperacionFatiga(vida: number, tiempoDescanso: number): number {
  const { recoveryPerSecondBase, recoveryLifeBonus } = TUNABLES.fatiga
  return (recoveryPerSecondBase + recoveryLifeBonus * clamp01(vida)) * tiempoDescanso
}

export type NivelFatiga = 'ok' | 'aviso' | 'saturado' | 'critico'

/**
 * Traduce la fatiga a los cuatro estados del GDD (6.5).
 *
 * Existe para que la interfaz, el chat y la logica no discrepen nunca sobre
 * si el creador esta cansado. El aviso llega ANTES de la penalizacion: el
 * jugador debe poder reaccionar, no descubrirlo cuando ya es tarde.
 */
export function nivelFatiga(fatiga: number): NivelFatiga {
  const { saturationThreshold, burnoutThreshold, warningThreshold } = TUNABLES.fatiga
  if (fatiga >= burnoutThreshold) return 'critico'
  if (fatiga >= warningThreshold) return 'saturado'
  if (fatiga >= saturationThreshold) return 'aviso'
  return 'ok'
}

export function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0
  return Math.min(1, Math.max(0, v))
}

export function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min
  return Math.min(max, Math.max(min, v))
}
