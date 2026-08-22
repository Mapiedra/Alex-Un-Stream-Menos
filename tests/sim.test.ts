import { describe, expect, it } from 'vitest'
import { createInitialState, normalizeAllocation } from '../src/sim/state.ts'
import { publicar, step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'
import { chance, createRng, nextFloat } from '../src/sim/rng.ts'

const run = (ticks: number, seed = 1) => {
  let s = createInitialState(seed)
  for (let i = 0; i < ticks; i++) s = step(s, TUNABLES.tickMs)
  return s
}

describe('determinismo', () => {
  it('misma semilla y mismas acciones dan la misma partida', () => {
    expect(run(2000, 42)).toEqual(run(2000, 42))
  })

  it('el rng no muta su entrada', () => {
    const rng = createRng(7)
    nextFloat(rng)
    expect(rng.seed).toBe(7)
  })

  it('el rng produce valores en [0,1)', () => {
    let rng = createRng(99)
    for (let i = 0; i < 1000; i++) {
      const r = nextFloat(rng)
      expect(r.value).toBeGreaterThanOrEqual(0)
      expect(r.value).toBeLessThan(1)
      rng = r.rng
    }
  })

  it('chance respeta la probabilidad de forma aproximada', () => {
    let rng = createRng(3)
    let hits = 0
    for (let i = 0; i < 5000; i++) {
      const r = chance(rng, 0.3)
      if (r.value) hits++
      rng = r.rng
    }
    expect(hits / 5000).toBeGreaterThan(0.25)
    expect(hits / 5000).toBeLessThan(0.35)
  })
})

describe('invariantes del tick', () => {
  it('ningun recurso se vuelve NaN ni negativo tras una partida larga', () => {
    const s = run(20_000)
    for (const [k, v] of Object.entries(s)) {
      if (typeof v !== 'number') continue
      expect(Number.isNaN(v), `${k} es NaN`).toBe(false)
      if (k !== 'ahorros') expect(v, `${k} es negativo`).toBeGreaterThanOrEqual(0)
    }
  })

  it('vida y fatiga se mantienen en 0..1', () => {
    const s = run(20_000)
    expect(s.vida).toBeGreaterThanOrEqual(0)
    expect(s.vida).toBeLessThanOrEqual(1)
    expect(s.fatiga).toBeGreaterThanOrEqual(0)
    expect(s.fatiga).toBeLessThanOrEqual(1)
  })

  it('un dt de cero no cambia nada', () => {
    const s = createInitialState()
    expect(step(s, 0)).toBe(s)
  })

  it('el estado sigue siendo serializable', () => {
    const s = run(500)
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })
})

describe('el reloj de semanas', () => {
  it('avanza una semana cada secondsPerWeek de simulacion', () => {
    const ticksPorSemana = (TUNABLES.secondsPerWeek * 1000) / TUNABLES.tickMs
    expect(run(ticksPorSemana - 1).week).toBe(0)
    expect(run(ticksPorSemana + 1).week).toBe(1)
  })

  it('el tiempo en pausa no consume partida', () => {
    // La pausa se implementa no llamando a step: el estado queda intacto.
    const s = run(100)
    expect(step(s, 0).elapsedMs).toBe(s.elapsedMs)
  })
})

describe('publicar', () => {
  it('da un pico de alcance y de hype', () => {
    const s = run(100)
    const p = publicar(s)
    expect(p.alcance).toBeGreaterThan(s.alcance)
    expect(p.hype).toBeGreaterThan(s.hype)
  })

  it('agrega publicaciones de la misma semana en una sola entrada', () => {
    let s = run(10)
    s = publicar(s)
    s = publicar(s)
    expect(s.catalogo).toHaveLength(1)
    expect(s.publicacionesTotales).toBe(2)
  })

  it('el hype tiene tope: acelera, no sustituye a la estructura', () => {
    let s = run(10)
    for (let i = 0; i < 100; i++) s = publicar(s)
    expect(s.hype).toBeLessThanOrEqual(TUNABLES.hype.max)
  })
})

describe('normalizeAllocation', () => {
  it('siempre suma 1', () => {
    const a = normalizeAllocation({ produccion: 3, comunidad: 1, vida: 1, descanso: 1 })
    expect(a.produccion + a.comunidad + a.vida + a.descanso).toBeCloseTo(1, 10)
  })

  it('un reparto vacio se interpreta como descanso total', () => {
    const a = normalizeAllocation({ produccion: 0, comunidad: 0, vida: 0, descanso: 0 })
    expect(a.descanso).toBe(1)
  })
})
