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
 * ESTADO: con las etapas de casa de F3 —cada una encarece el coste de vida—
 * la partida equilibrada ya cae dentro de la banda objetivo de 90-160 min. La
 * banda del test es algo mas ancha porque F4 (vacaciones y eventos
 * extraordinarios) volvera a moverla, y se estrechara del todo en F6.
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
  it('la partida equilibrada dura lo que deberia durar', () => {
    // Objetivo del GDD: ~2 horas. La banda del test es algo mas ancha porque
    // F4 volvera a mover la cifra al anadir vacaciones y eventos.
    const min = equilibrado.retiroEnMinuto ?? 0
    expect(min).toBeGreaterThan(80)
    expect(min).toBeLessThan(180)
  })

  it('dejar que las compras decidan tus horas tambien llega a buen puerto', () => {
    // El bot "derivado" nunca toca el reparto: juega como el jugador de los
    // ciclos 1-2, que solo compra. Tarda mas que el equilibrado, pero llega.
    // Si dejara de llegar, la primera mitad de la partida seria un callejon.
    const derivado = correr('derivado')
    expect(derivado.retiroEnMinuto).not.toBeNull()
    expect(derivado.retiroEnMinuto ?? 0).toBeGreaterThan(equilibrado.retiroEnMinuto ?? 0)
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
