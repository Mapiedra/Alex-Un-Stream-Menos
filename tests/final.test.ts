import { describe, expect, it } from 'vitest'
import {
  cobertura,
  condicionesRetiro,
  cumpleRetiro,
  evaluarEpilogo,
  puedeRetirarse,
  retirarse,
} from '../src/sim/final.ts'
import { EPILOGOS, NOMBRE_EPILOGO, OPCIONES_FINALES } from '../src/content/narrative.ts'
import { createInitialState, type GameState } from '../src/sim/state.ts'
import { TUNABLES } from '../src/sim/tunables.ts'
import { step } from '../src/sim/tick.ts'
import { lanzarSemana } from '../src/sim/semana.ts'
import { replanificar } from '../src/sim/shop.ts'

/**
 * Una partida que cumple todas las condiciones del retiro con holgura.
 *
 * `calidad` es un valor DERIVADO: el tick la recalcula cada paso desde vida,
 * fatiga y multiplicadores. Fijarla a mano sirve para los tests que no
 * simulan, pero en cuanto se llama a step() se pisa. Por eso tambien se sube
 * multCalidad, que es lo que de verdad la sostiene.
 */
const jubilable = (over: Partial<GameState> = {}): GameState =>
  // El reparto se pasa por `replanificar` porque desde F7 `allocation` es la
  // lectura de la semana repartida, no un campo suelto: ponerlo a mano lo
  // pisaria el primer tick.
  conReparto({
  ...createInitialState(),
  comunidad: 500_000,
  calidad: 4,
  multCalidad: 5,
  vida: 0.9,
  fatiga: 0.05,
  houseStage: 4,
  ahorros: 400_000,
  eventosExtraordinarios: 2,
  vacacionesCompletadas: 1,
  catalogo: [{ week: 0, weight: 4000 }],
  allocation: { produccion: 0.1, comunidad: 0.3, vida: 0.3, descanso: 0.3 },
  week: 100,
  ...over,
  })

function conReparto(s: GameState): GameState {
  return replanificar(s, s.allocation)
}

describe('las ocho condiciones de la seccion 11', () => {
  it('una partida recien empezada no cumple casi ninguna', () => {
    const c = condicionesRetiro(createInitialState())
    expect(c.filter((x) => x.cumplido).length).toBeLessThan(3)
    expect(cumpleRetiro(createInitialState())).toBe(false)
  })

  it('una partida completa las cumple todas', () => {
    const c = condicionesRetiro(jubilable())
    const incumplidas = c.filter((x) => !x.cumplido).map((x) => x.clave)
    expect(incumplidas, `faltan: ${incumplidas.join(', ')}`).toEqual([])
  })

  it('el dinero solo no basta', () => {
    // Es la diferencia entre este juego y un incremental de acumular.
    const soloDinero = jubilable({ comunidad: 0, vacacionesCompletadas: 0 })
    expect(cumpleRetiro(soloDinero)).toBe(false)
  })

  it('trabajar muchas horas invalida el retiro por muy bien que vayan las cuentas', () => {
    /**
     * Esta es LA condicion del juego. Llegar al numero a base de horas no es
     * retirarse de nada: el GDD pide poder sostener la actividad con pocas
     * horas de streaming.
     */
    const currando = jubilable({
      allocation: { produccion: 0.9, comunidad: 0.05, vida: 0.03, descanso: 0.02 },
    })
    expect(cumpleRetiro(currando)).toBe(false)
    expect(condicionesRetiro(currando).find((c) => c.clave === 'horas')?.cumplido).toBe(false)
  })

  it('llegar reventado tampoco vale', () => {
    expect(cumpleRetiro(jubilable({ fatiga: 0.9 }))).toBe(false)
  })

  it('hay que haber vivido un momento grande y haber parado alguna vez', () => {
    expect(cumpleRetiro(jubilable({ eventosExtraordinarios: 0 }))).toBe(false)
    expect(cumpleRetiro(jubilable({ vacacionesCompletadas: 0 }))).toBe(false)
  })
})

describe('sostenerlo, no rozarlo', () => {
  it('cumplir las condiciones un instante no basta', () => {
    expect(puedeRetirarse(jubilable({ semanasEnUmbral: 0 }))).toBe(false)
    expect(puedeRetirarse(jubilable({ semanasEnUmbral: 1 }))).toBe(false)
  })

  it('sostenerlas las semanas pedidas si', () => {
    expect(
      puedeRetirarse(jubilable({ semanasEnUmbral: TUNABLES.final.semanasSostenidas })),
    ).toBe(true)
  })

  it('el contador sube solo mientras se cumplen', () => {
    let s = jubilable({ semanasEnUmbral: 0, week: 0, elapsedMs: 0 })
    const ticksSemana = (TUNABLES.secondsPerWeek * 1000) / TUNABLES.tickMs
    for (let i = 0; i < ticksSemana * 3 + 10; i++) s = step(lanzarSemana(s), TUNABLES.tickMs)
    expect(s.semanasEnUmbral).toBeGreaterThan(0)
  })

  it('dejar de cumplirlas lo reinicia a cero', () => {
    let s = jubilable({
      semanasEnUmbral: 3,
      week: 0,
      elapsedMs: 0,
      allocation: { produccion: 1, comunidad: 0, vida: 0, descanso: 0 },
    })
    const ticksSemana = (TUNABLES.secondsPerWeek * 1000) / TUNABLES.tickMs
    for (let i = 0; i < ticksSemana + 10; i++) s = step(lanzarSemana(s), TUNABLES.tickMs)
    expect(s.semanasEnUmbral).toBe(0)
  })
})

describe('los tres epilogos', () => {
  it('con margen, retiro comodo', () => {
    const s = jubilable({ semanasEnUmbral: 10, ahorros: 5_000_000 })
    expect(cobertura(s)).toBeGreaterThan(TUNABLES.final.coberturaComoda)
    expect(evaluarEpilogo(s)).toBe('comodo')
  })

  it('sin cumplir el umbral, la rueda', () => {
    expect(evaluarEpilogo(createInitialState())).toBe('rueda')
  })

  it('la rueda NO es perder: la partida siempre se puede cerrar', () => {
    // No hay derrota en este juego. Dejarlo sin haber llegado es el final por
    // defecto, y se cuenta con respeto.
    const s = retirarse(createInitialState(), 'leer')
    expect(s.final?.epilogo).toBe('rueda')
    expect(s.final?.eleccion).toBe('leer')
  })

  it('retirarse dos veces no hace nada', () => {
    const s = retirarse(jubilable({ semanasEnUmbral: 10 }), null)
    expect(retirarse(s, 'otra')).toBe(s)
  })

  it('la partida terminada deja de simular', () => {
    const s = retirarse(jubilable({ semanasEnUmbral: 10 }), 'leer')
    expect(step(s, TUNABLES.tickMs)).toBe(s)
  })
})

describe('textos del final', () => {
  it('hay texto para los tres epilogos', () => {
    for (const e of ['comodo', 'justo', 'rueda'] as const) {
      expect(EPILOGOS[e].cuerpo.length, e).toBeGreaterThan(1)
      expect(NOMBRE_EPILOGO[e].length, e).toBeGreaterThan(0)
    }
  })

  it('cada epilogo distingue si hubo burnout', () => {
    for (const e of ['comodo', 'justo', 'rueda'] as const) {
      expect(EPILOGOS[e].conBurnout).not.toBe(EPILOGOS[e].sinBurnout)
    }
  })

  it('las opciones finales son las del GDD y ninguna es la correcta', () => {
    // "Las opciones siguen siendo jugar, leer, cocinar, ver series o emitir."
    const ids = OPCIONES_FINALES.map((o) => o.id)
    for (const esperado of ['jugar', 'leer', 'cocinar', 'series', 'emitir']) {
      expect(ids, `falta ${esperado}`).toContain(esperado)
    }
    // Todas cierran igual de bien: ninguna es un premio ni un castigo.
    for (const o of OPCIONES_FINALES) expect(o.cierre.length).toBeGreaterThan(30)
  })
})

describe('cobertura', () => {
  it('sin catalogo ni ahorros es cero', () => {
    expect(cobertura({ ...createInitialState(), ahorros: 0, catalogo: [] })).toBe(0)
  })

  it('un catalogo grande renta aunque no publiques mas', () => {
    const conCatalogo = { ...createInitialState(), catalogo: [{ week: 0, weight: 5000 }] }
    expect(cobertura(conCatalogo)).toBeGreaterThan(cobertura(createInitialState()))
  })

  it('unos ahorros negativos no inventan renta', () => {
    expect(cobertura({ ...createInitialState(), ahorros: -50_000, catalogo: [] })).toBe(0)
  })
})
