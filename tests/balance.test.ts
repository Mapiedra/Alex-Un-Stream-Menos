import { describe, expect, it } from 'vitest'
import { BOTS } from '../tools/balance/bots.ts'
import { runBot } from '../tools/balance/harness.ts'

/**
 * Las reglas de balance de la seccion 12 del GDD, como tests.
 *
 * Son intenciones de diseno convertidas en aserciones: si alguien toca
 * tunables.ts y el juego deja de decir lo que queria decir, esto falla antes
 * de llegar a nadie. Es la unica forma de que "el streaming intenso debe ganar
 * a corto plazo y perder a medio" sea algo mas que una frase en un documento.
 *
 * ESTADO: las gates narrativas de la victoria (comunidad minima, casa, unas
 * vacaciones, un evento extraordinario) son de F3 y F4 y todavia no existen.
 * Hasta entonces el retiro se decide solo por economia, asi que la banda de
 * duracion es provisional y mas ancha de lo que sera al final.
 */

const bot = (id: string) => {
  const b = BOTS.find((x) => x.id === id)
  if (!b) throw new Error(`No existe el bot ${id}`)
  return b
}

const correr = (id: string) => runBot(bot(id), { maxMinutes: 240 })

// Una sola pasada por bot, compartida entre tests: son caras.
const grind = correr('grind')
const calidad = correr('calidad')
const comunidad = correr('comunidad')
const equilibrado = correr('equilibrado')
const avaro = correr('avaro')
const sinDescanso = correr('sin-descanso')

describe('ninguna estrategia domina la partida', () => {
  it('el equilibrado se retira antes que cualquier estrategia de un solo eje', () => {
    expect(equilibrado.retiroEnMinuto).not.toBeNull()
    for (const monoeje of [calidad, comunidad, grind]) {
      const suyo = monoeje.retiroEnMinuto ?? Infinity
      expect(suyo, `${monoeje.botId} adelanta al equilibrado`).toBeGreaterThan(
        equilibrado.retiroEnMinuto ?? 0,
      )
    }
  })
})

describe('forzar horas no funciona a medio plazo', () => {
  it('el grind puro nunca llega a retirarse', () => {
    expect(grind.retiroEnMinuto).toBeNull()
  })

  it('el grind se quema: toca fatiga maxima', () => {
    expect(grind.fatigaMaxima).toBeGreaterThan(0.85)
  })
})

describe('descansar es rentable, no un capricho', () => {
  it('el que descansa se retira; su clon identico que no descansa, no', () => {
    // Mismo perfil de compras, misma cadencia de publicacion. La unica
    // diferencia entre ambos es cuanto tiempo dedican a parar.
    expect(equilibrado.retiroEnMinuto).not.toBeNull()
    expect(sinDescanso.retiroEnMinuto).toBeNull()
  })

  it('el que no descansa acaba con una calidad hundida', () => {
    expect(sinDescanso.calidadFinal).toBeLessThan(equilibrado.calidadFinal)
  })
})

describe('la economia del retiro no es trivial', () => {
  it('acumular sin invertir no basta para jubilarse', () => {
    // Si el avaro ganase siempre, los residuales del catalogo estarian
    // demasiado generosos y el final del juego seria un tramite.
    expect(avaro.retiroEnMinuto).toBeNull()
  })

  it('la comunidad sola tampoco basta antes que el equilibrio', () => {
    const suyo = comunidad.retiroEnMinuto ?? Infinity
    expect(suyo).toBeGreaterThan(equilibrado.retiroEnMinuto ?? 0)
  })
})

describe('duracion de la partida', () => {
  it('la partida equilibrada dura una banda razonable de simulacion', () => {
    // Banda PROVISIONAL. El objetivo final es 90-160 min, y se estrechara en
    // F6 cuando existan las gates narrativas que retrasan la victoria.
    const min = equilibrado.retiroEnMinuto ?? 0
    expect(min).toBeGreaterThan(45)
    expect(min).toBeLessThan(200)
  })

  it('ninguna politica se retira en los primeros veinte minutos', () => {
    for (const r of [grind, calidad, comunidad, equilibrado, avaro, sinDescanso]) {
      const min = r.retiroEnMinuto ?? Infinity
      expect(min, `${r.botId} se retira demasiado pronto`).toBeGreaterThan(20)
    }
  })
})

describe('el crecimiento tiene techo', () => {
  it('la comunidad no se dispara sin limite', () => {
    // El escudo de la comunidad frena el decaimiento del alcance, y el alcance
    // alimenta la comunidad: sin suelo en el escudo y sin saturacion en la
    // conversion, ese bucle no converge. Llego a comunidades de nueve cifras.
    for (const r of [equilibrado, calidad, comunidad]) {
      expect(r.comunidadFinal, `${r.botId} se dispara`).toBeLessThan(5_000_000)
    }
  })

  it('la calidad respeta su techo blando', () => {
    for (const r of [equilibrado, calidad]) {
      expect(r.calidadFinal).toBeLessThan(10)
    }
  })
})
