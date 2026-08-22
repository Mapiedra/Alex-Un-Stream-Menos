import { TUNABLES, decayRateFromHalfLife } from './tunables.ts'
import type { GameState } from './state.ts'

/**
 * Las ecuaciones del juego, aisladas y puras para poder testearlas una a una
 * y exponerlas en los tooltips. Aqui no hay estado ni efectos.
 */

/**
 * CALIDAD = base x f(vida) x (1 - fatiga)^p x mejoras, con techo blando.
 *
 * La fatiga castiga con exponente > 1: los primeros puntos apenas se notan y
 * los ultimos hunden el rendimiento. Es lo que hace que forzar sea rentable
 * un rato y ruinoso despues.
 */
export function calcCalidad(vida: number, fatiga: number, multCalidad: number): number {
  const { base, fatiguePenaltyExponent, lifeWeight, softCap } = TUNABLES.calidad
  const lifeFactor = 1 - lifeWeight + lifeWeight * clamp01(vida)
  const fatigueFactor = Math.pow(1 - clamp01(fatiga), fatiguePenaltyExponent)
  const raw = base * lifeFactor * fatigueFactor * multCalidad
  return applySoftCap(raw, softCap)
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
 *   lambda_efectiva = lambda_base / (1 + C / k)
 *
 * Esta es la regla de balance n5 del GDD convertida en ecuacion: parar sale
 * barato solo si has construido comunidad.
 */
export function calcAlcanceDecayRate(comunidad: number, legadoRetencion: number): number {
  const base = decayRateFromHalfLife(TUNABLES.alcance.halfLifeSeconds)
  const shield = 1 + (comunidad * legadoRetencion) / TUNABLES.alcance.shieldK
  return base / shield
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
): number {
  const { conversionBase, qualityWeight } = TUNABLES.comunidad
  const qualityFactor = 1 - qualityWeight + qualityWeight * calidad
  const esfuerzo = afinidadFormato + tiempoComunidad
  return alcance * conversionBase * qualityFactor * esfuerzo
}

/** Ingresos por segundo: flujo directo mas la cola larga del catalogo. */
export function calcIngresosDirectos(alcance: number, comunidad: number): number {
  const { cpmPerAlcance, incomePerComunidad } = TUNABLES.economia
  return alcance * cpmPerAlcance + comunidad * incomePerComunidad
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

export function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0
  return Math.min(1, Math.max(0, v))
}

export function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min
  return Math.min(max, Math.max(min, v))
}
