import { describe, expect, it } from 'vitest'
import { NICK_COLOR_COUNT, chatRate, chatStep, nickColor, subRate } from '../src/sim/chat.ts'
import {
  CHAT_CREDIBILIDAD,
  CHAT_INTEGRIDAD,
  CHAT_PATROCINIO,
} from '../src/content/chatLines.ts'
import { NICK_COLORS } from '../src/ui/theme/palette.ts'
import { createRng } from '../src/sim/rng.ts'
import { createInitialState } from '../src/sim/state.ts'
import { step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

// Credibilidad intacta y sin marcas encima: el canal de siempre. Asi estos
// tests siguen midiendo lo que median antes de que existieran los patrocinios.
const input = (alcance: number, comunidad = 0) => ({
  alcance,
  comunidad,
  calidad: 1,
  fatiga: 0,
  hype: 0,
  credibilidad: 1,
  patrocinado: false,
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

/**
 * EL CHAT COMO VOZ DEL PUBLICO ANTE LAS MARCAS.
 *
 * Todas las ramas de `elegirTexto` comparten la MISMA tirada, asi que una
 * ventana mas ancha arriba tapa entera a la de abajo. Ya paso una vez: con el
 * patrocinio en 0.30 y la queja en 0.28, el chat no podia quejarse jamas
 * mientras hubiera un contrato encima — que es justo cuando tiene que poder.
 *
 * Estos tests existen para que no vuelva a pasar en silencio.
 */
describe('el chat reacciona a las marcas', () => {
  /** Junta el texto de muchos mensajes con un estado fijo. */
  const corpus = (over: Partial<Parameters<typeof chatStep>[1]>) => {
    const vistos = new Set<string>()
    let rng = createRng(11)
    for (let i = 0; i < 400; i++) {
      const r = chatStep(rng, { ...input(20_000, 30_000), ...over }, 1, 0, 1)
      rng = r.rng
      for (const m of r.mensajes) vistos.add(m.text)
    }
    return vistos
  }

  const alguno = (vistos: Set<string>, lineas: readonly string[]) =>
    lineas.some((l) => vistos.has(l))

  it('bromea con el segmento mientras corre un contrato', () => {
    expect(alguno(corpus({ patrocinado: true }), CHAT_PATROCINIO)).toBe(true)
  })

  /** LA regresion: la queja tiene que caber aunque haya un contrato encima. */
  it('y ademas puede quejarse, aunque haya un contrato encima', () => {
    const vistos = corpus({ patrocinado: true, credibilidad: 0.4 })
    expect(alguno(vistos, CHAT_CREDIBILIDAD)).toBe(true)
    expect(alguno(vistos, CHAT_PATROCINIO)).toBe(true)
  })

  it('con la cara limpia y sin marcas, lo agradece', () => {
    expect(alguno(corpus({ credibilidad: 1, patrocinado: false }), CHAT_INTEGRIDAD)).toBe(true)
  })

  /**
   * El canal de siempre no habla de marcas. Si esto falla, alguna rama nueva
   * se esta colando en una partida que no ha firmado nada.
   */
  it('un canal sin patrocinios nunca ve una linea de anuncio', () => {
    const vistos = corpus({ credibilidad: 1, patrocinado: false })
    expect(alguno(vistos, CHAT_PATROCINIO)).toBe(false)
    expect(alguno(vistos, CHAT_CREDIBILIDAD)).toBe(false)
  })
})
