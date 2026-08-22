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
const vacacionero = correr('vacacionero')
const derivadoRun = correr('derivado')
const aprovechado = correr('aprovechado')

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
    // Desde F5 esto es en parte tautologico: la seccion 11 exige haber parado
    // al menos una vez. Se conserva porque tambien mide lo otro, que no lo es:
    // el que no descansa se quema y ni siquiera se acerca a las condiciones.
    expect(equilibrado.retiroEnMinuto).not.toBeNull()
    expect(sinDescanso.retiroEnMinuto).toBeNull()
    expect(sinDescanso.condicionesFinales).toBe(false)
  })

  it('el que no descansa acaba con una calidad hundida', () => {
    expect(sinDescanso.calidadFinal).toBeLessThan(equilibrado.calidadFinal)
  })
})

describe('las vacaciones compensan', () => {
  /**
   * Regla 4 de la seccion 12 del GDD: parar debe ser siempre una decision
   * razonable y, en una partida bien jugada, a menudo optima.
   *
   * No se mide por minuto de retiro —ambos llegan a la vez— sino por donde
   * llegan: el que descansa termina con mucha mas comunidad y mucho mas
   * colchon, porque el Legado que consolida al volver es permanente.
   */
  it('descansar deja mucha mas comunidad que no descansar', () => {
    expect(vacacionero.comunidadFinal).toBeGreaterThan(equilibrado.comunidadFinal * 1.3)
  })

  it('descansar deja mas colchon para el retiro', () => {
    expect(vacacionero.coberturaFinal).toBeGreaterThan(equilibrado.coberturaFinal)
  })

  it('el que descansa no llega mas tarde por ello', () => {
    // Si parar retrasase el final, nadie pararia por mucho que compensara.
    expect(vacacionero.retiroEnMinuto ?? Infinity).toBeLessThanOrEqual(
      (equilibrado.retiroEnMinuto ?? 0) + 5,
    )
  })

  it('descansar mas de lo minimo compensa', () => {
    // Todos los bots serios paran al menos una vez, porque el retiro lo exige.
    // Lo que se mide aqui es si parar MAS sigue mereciendo la pena, y si.
    expect(vacacionero.vacaciones).toBeGreaterThan(equilibrado.vacaciones)
    expect(equilibrado.vacaciones).toBeGreaterThan(0)
  })
})

describe('los eventos extraordinarios no son requisito', () => {
  /**
   * Aqui hay una tension real entre dos secciones del GDD, y conviene dejar
   * escrito como se ha resuelto.
   *
   * La seccion 11 lista "al menos un evento extraordinario aprovechado o
   * VIVIDO" entre las condiciones de victoria. La seccion 12 dice que los
   * eventos "nunca deben ser requisito para ganar".
   *
   * Lectura adoptada: los eventos ocurren solos, sin que el jugador haga
   * nada, asi que haber vivido uno no es un requisito que se pueda fallar.
   * Lo que es opcional —y lo que la seccion 12 protege— es EXPLOTARLOS:
   * prepararlos, exprimirlos, organizar la partida alrededor de ellos.
   */
  it('nadie necesita preparar la conferencia para retirarse', () => {
    // Ni equilibrado ni derivado invierten jamas en prepararse.
    expect(equilibrado.retiroEnMinuto).not.toBeNull()
    expect(derivadoRun.retiroEnMinuto).not.toBeNull()
  })

  it('prepararlos no cambia el desenlace, solo lo hace mas comodo', () => {
    // Si preparar adelantase el retiro de forma clara, los eventos habrian
    // pasado de ayudar a ser obligatorios.
    const dif = Math.abs((aprovechado.retiroEnMinuto ?? 0) - (equilibrado.retiroEnMinuto ?? 0))
    expect(dif).toBeLessThan(15)
  })

  it('son escasos: unos pocos por partida, no uno cada dos semanas', () => {
    // Sin reposo efectivo llegaron a salir 131 en una sola partida.
    for (const r of [equilibrado, calidad, comunidad, derivadoRun]) {
      expect(r.eventos, `${r.botId} tiene demasiados eventos`).toBeLessThan(15)
    }
  })

  it('pero llegan a salir: no son decorativos', () => {
    expect(equilibrado.eventos).toBeGreaterThan(0)
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
    expect(derivadoRun.retiroEnMinuto).not.toBeNull()
    expect(derivadoRun.retiroEnMinuto ?? 0).toBeGreaterThan(equilibrado.retiroEnMinuto ?? 0)
  })

  it('ninguna politica se retira en los primeros veinte minutos', () => {
    for (const r of [grind, calidad, comunidad, equilibrado, avaro, sinDescanso]) {
      const min = r.retiroEnMinuto ?? Infinity
      expect(min, `${r.botId} se retira demasiado pronto`).toBeGreaterThan(20)
    }
  })
})

describe('la condicion del retiro es la del GDD, no un proxy economico', () => {
  it('facturar mucho no basta si se trabaja mucho', () => {
    /**
     * Hasta F4 el banco media solo la cobertura economica, y con eso los bots
     * "se retiraban" trabajando doce horas al dia — que es exactamente lo que
     * el juego dice que NO es retirarse. El bot sin-descanso lo demuestra:
     * llega a tener comunidad y compras de sobra, y aun asi no cumple.
     */
    expect(sinDescanso.comunidadFinal).toBeGreaterThan(50_000)
    expect(sinDescanso.condicionesFinales).toBe(false)
  })

  it('quien se retira cumple de verdad las ocho condiciones', () => {
    expect(equilibrado.condicionesFinales).toBe(true)
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
