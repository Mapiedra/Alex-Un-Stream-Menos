import { describe, expect, it } from 'vitest'
import { NICK_COLOR_COUNT, chatRate, chatStep, nickColor, subRate } from '../src/sim/chat.ts'
import { NICK_COLORS } from '../src/ui/theme/palette.ts'
import { createRng } from '../src/sim/rng.ts'
import { createInitialState } from '../src/sim/state.ts'
import { step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

const input = (alcance: number, comunidad = 0) => ({
  alcance,
  comunidad,
  calidad: 1,
  fatiga: 0,
  hype: 0,
})

describe('el chat sigue al alcance', () => {
  it('sin alcance no habla nadie', () => {
    expect(chatRate(0)).toBe(0)
  })

  it('mas alcance, mas mensajes', () => {
    expect(chatRate(5000)).toBeGreaterThan(chatRate(500))
  })

  it('satura: un chat de 100.000 no se lee mas rapido que uno de 20.000', () => {
    // Si no saturase, la UI seria ilegible y el coste de render se dispararia.
    expect(chatRate(1e6)).toBeLessThan(3)
  })
})

describe('las suscripciones siguen a la comunidad', () => {
  it('sin comunidad no hay suscripciones', () => {
    expect(subRate(0)).toBe(0)
  })

  it('crecen con la comunidad, no con el alcance', () => {
    expect(subRate(10_000)).toBeGreaterThan(subRate(1000))
  })
})

describe('colores de nick', () => {
  it('el mismo nick siempre se ve igual', () => {
    expect(nickColor('kirisu_', NICK_COLOR_COUNT)).toBe(nickColor('kirisu_', NICK_COLOR_COUNT))
  })

  it('el indice siempre cae dentro de la paleta', () => {
    for (const n of ['a', 'zzzz', 'Moobot', 'nick_muy_largo_de_verdad']) {
      const c = nickColor(n, NICK_COLOR_COUNT)
      expect(c).toBeGreaterThanOrEqual(0)
      expect(c).toBeLessThan(NICK_COLORS.length)
    }
  })

  it('el motor y la UI cuentan los mismos colores', () => {
    // El sim no puede importar de ui/, asi que la cifra esta duplicada.
    // Este test es lo que impide que se separen.
    expect(NICK_COLOR_COUNT).toBe(NICK_COLORS.length)
  })
})

describe('chatStep', () => {
  it('es determinista', () => {
    const a = chatStep(createRng(5), input(4000), 1, 0, 1)
    const b = chatStep(createRng(5), input(4000), 1, 0, 1)
    expect(a).toEqual(b)
  })

  it('acumula el resto para ritmos por debajo de un mensaje por segundo', () => {
    let acc = 0
    let rng = createRng(1)
    let total = 0
    for (let i = 0; i < 100; i++) {
      const r = chatStep(rng, input(120), 0.1, acc, 1)
      acc = r.acc
      rng = r.rng
      total += r.mensajes.length
    }
    // A ese alcance el ritmo es bajo, pero no nulo: el resto no se pierde.
    expect(total).toBeGreaterThan(0)
  })

  it('nunca vuelca cientos de lineas en un solo tick', () => {
    // A velocidad x50 un dt grande no puede inundar el buffer.
    const r = chatStep(createRng(1), input(1e6), 60, 0, 1)
    expect(r.mensajes.length).toBeLessThanOrEqual(9)
  })

  it('los ids no se repiten', () => {
    const r = chatStep(createRng(2), input(20_000), 5, 0, 1)
    const ids = r.mensajes.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('el chat dentro de la partida', () => {
  it('el buffer no crece sin limite', () => {
    let s = createInitialState()
    s = { ...s, alcance: 50_000 }
    for (let i = 0; i < 3000; i++) s = step(s, TUNABLES.tickMs)
    expect(s.chat.length).toBeLessThanOrEqual(50)
  })

  it('un canal sin nadie tiene el chat vacio', () => {
    let s = createInitialState()
    s = { ...s, allocation: { produccion: 0, comunidad: 0, vida: 0, descanso: 1 } }
    for (let i = 0; i < 200; i++) s = step(s, TUNABLES.tickMs)
    expect(s.chat).toHaveLength(0)
  })
})
