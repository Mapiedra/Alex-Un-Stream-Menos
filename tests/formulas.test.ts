import { describe, expect, it } from 'vitest'
import {
  applySoftCap,
  calcAlcanceDecayRate,
  calcCalidad,
  calcConversion,
  calcResidual,
  clamp01,
} from '../src/sim/formulas.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

describe('calidad', () => {
  it('con fatiga total se anula', () => {
    expect(calcCalidad(1, 1, 1)).toBe(0)
  })

  it('mejor vida da mas calidad', () => {
    expect(calcCalidad(1, 0, 1)).toBeGreaterThan(calcCalidad(0, 0, 1))
  })

  it('la fatiga castiga mas cuanto mas alta (exponente > 1)', () => {
    const sinFatiga = calcCalidad(1, 0, 1)
    const primerCuarto = sinFatiga - calcCalidad(1, 0.25, 1)
    const ultimoCuarto = calcCalidad(1, 0.75, 1) - calcCalidad(1, 1, 1)
    expect(ultimoCuarto).toBeLessThan(primerCuarto)
  })

  it('el techo blando frena, pero no bloquea', () => {
    const cap = TUNABLES.calidad.softCap
    expect(applySoftCap(cap, cap)).toBe(cap)
    expect(applySoftCap(cap + 2, cap)).toBe(cap + 1)
    expect(applySoftCap(cap + 100, cap)).toBeGreaterThan(cap)
  })
})

describe('la comunidad como escudo', () => {
  it('sin comunidad, el alcance decae al ritmo base', () => {
    const base = Math.LN2 / TUNABLES.alcance.halfLifeSeconds
    expect(calcAlcanceDecayRate(0, 1)).toBeCloseTo(base, 8)
  })

  it('mas comunidad significa menos caida', () => {
    expect(calcAlcanceDecayRate(5000, 1)).toBeLessThan(calcAlcanceDecayRate(0, 1))
  })

  it('el escudo nunca llega a detener la caida del todo', () => {
    expect(calcAlcanceDecayRate(1e9, 1)).toBeGreaterThan(0)
  })
})

describe('conversion a comunidad', () => {
  it('sin alcance no hay conversion, por mucho esfuerzo que se ponga', () => {
    expect(calcConversion(0, 4, 1, 1)).toBe(0)
  })

  it('mas calidad retiene mas', () => {
    expect(calcConversion(1000, 3, 0.2, 0.2)).toBeGreaterThan(calcConversion(1000, 1, 0.2, 0.2))
  })
})

describe('catalogo con cola larga', () => {
  it('decae con el tiempo', () => {
    expect(calcResidual(10, 20)).toBeLessThan(calcResidual(10, 0))
  })

  it('tiende a un suelo, no a cero: por eso el catalogo es una renta', () => {
    const inicial = calcResidual(10, 0)
    const aLargoPlazo = calcResidual(10, 5000)
    expect(aLargoPlazo).toBeGreaterThan(0)
    expect(aLargoPlazo / inicial).toBeCloseTo(TUNABLES.catalogo.floorFraction, 4)
  })

  it('publicar con mas calidad deja mas renta para siempre', () => {
    expect(calcResidual(20, 100)).toBeGreaterThan(calcResidual(5, 100))
  })

  it('un catalogo vacio no renta nada', () => {
    expect(calcResidual(0, 0)).toBe(0)
  })
})

describe('clamp01', () => {
  it('acota y neutraliza NaN', () => {
    expect(clamp01(-5)).toBe(0)
    expect(clamp01(5)).toBe(1)
    expect(clamp01(Number.NaN)).toBe(0)
  })
})
