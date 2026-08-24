import { describe, expect, it } from 'vitest'
import { lanzarSemana } from '../src/sim/semana.ts'
import { replanificar } from '../src/sim/shop.ts'
import {
  aplicarRecuperacion,
  avanzarDescanso,
  consolidarLegado,
  entrarEnBurnout,
  irseDeVacaciones,
  puedeIrseDeVacaciones,
} from '../src/sim/descanso.ts'
import { createInitialState, type GameState } from '../src/sim/state.ts'
import { step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'
import { resolver } from '../src/sim/lifeEvents.ts'

/** Avanza contestando las tarjetas, como haria un jugador. */
function avanzar(s: GameState, ticks: number): GameState {
  let actual = s
  for (let i = 0; i < ticks; i++) {
    if (actual.eventoPendiente) actual = resolver(actual, actual.eventoPendiente, 0)
    actual = step(lanzarSemana(actual), TUNABLES.tickMs)
  }
  return actual
}

const ticksSemana = (TUNABLES.secondsPerWeek * 1000) / TUNABLES.tickMs

describe('vacaciones', () => {
  it('se pueden coger en una partida normal', () => {
    expect(puedeIrseDeVacaciones(createInitialState())).toBe(true)
  })

  it('no se pueden coger estando ya parado', () => {
    const s = irseDeVacaciones(createInitialState())
    expect(puedeIrseDeVacaciones(s)).toBe(false)
    expect(irseDeVacaciones(s)).toBe(s)
  })

  it('durante las vacaciones no se produce nada', () => {
    const s = irseDeVacaciones(createInitialState())
    expect(s.allocation.produccion).toBe(0)
  })

  it('el alcance cae y la comunidad aguanta', () => {
    // Es la razon de que parar sea barato SI has construido comunidad.
    let s: GameState = { ...createInitialState(5), alcance: 20_000, comunidad: 30_000 }
    s = irseDeVacaciones(s)
    const alcance0 = s.alcance
    const comunidad0 = s.comunidad
    s = avanzar(s, ticksSemana * 2)

    expect(1 - s.alcance / alcance0).toBeGreaterThan(0.3)
    expect(1 - s.comunidad / comunidad0).toBeLessThan(0.15)
  })

  it('se recupera fatiga y sube la vida', () => {
    let s: GameState = { ...createInitialState(6), fatiga: 0.7, vida: 0.3 }
    s = irseDeVacaciones(s)
    s = avanzar(s, ticksSemana)
    expect(s.fatiga).toBeLessThan(0.7)
    expect(s.vida).toBeGreaterThan(0.3)
  })

  it('al volver dan hype y unas semanas de calidad extra', () => {
    // "He estado fuera" tiene que convertirse en "vuelvo con ganas", o parar
    // se siente como perder el sitio.
    const s = avanzarDescanso({
      ...createInitialState(),
      week: 10,
      descanso: { tipo: 'vacaciones', semanasRestantes: 1, semanasTotales: 3 },
    })
    expect(s.terminado).toBe('vacaciones')
    expect(s.state.descanso).toBeNull()
    expect(s.state.hype).toBeGreaterThan(0)
    expect(s.state.vacacionesCompletadas).toBe(1)
    expect(s.state.modificadores.some((m) => m.id === 'vuelta-vacaciones')).toBe(true)
  })

  it('la partida completa restaura el reparto que habia antes de parar', () => {
    // El reparto va por `replanificar` porque desde F7 son 21 franjas y no un
    // porcentaje libre: 0.6 de produccion son 13 bloques de 21, no 12.6.
    const antes = replanificar(createInitialState(7), {
      produccion: 0.6,
      comunidad: 0.2,
      vida: 0.1,
      descanso: 0.1,
    })
    let s: GameState = irseDeVacaciones({ ...antes, repartoAntesDeParar: antes.allocation })
    s = avanzar(s, ticksSemana * (TUNABLES.vacaciones.semanas + 1))
    expect(s.descanso).toBeNull()
    expect(s.allocation).toEqual(antes.allocation)
  })
})

describe('burnout', () => {
  it('dura mas que unas vacaciones', () => {
    // Parar tarde tiene que salir peor que parar a tiempo.
    expect(TUNABLES.burnout.semanas).toBeGreaterThan(TUNABLES.vacaciones.semanas)
  })

  it('dana la comunidad al desaparecer de golpe', () => {
    const s = entrarEnBurnout({ ...createInitialState(), comunidad: 10_000 })
    expect(s.comunidad).toBeLessThan(10_000)
    expect(s.burnouts).toBe(1)
  })

  it('volver de un burnout no tiene premio', () => {
    const s = avanzarDescanso({
      ...createInitialState(),
      week: 10,
      descanso: { tipo: 'burnout', semanasRestantes: 1, semanasTotales: 5 },
    })
    expect(s.terminado).toBe('burnout')
    expect(s.state.hype).toBe(0)
    expect(s.state.vacacionesCompletadas).toBe(0)
    expect(s.state.modificadores).toHaveLength(0)
  })

  it('salta solo al pasar el umbral, sin que el jugador lo pida', () => {
    let s: GameState = replanificar(
      { ...createInitialState(8), fatiga: TUNABLES.fatiga.burnoutThreshold - 0.01 },
      { produccion: 1, comunidad: 0, vida: 0, descanso: 0 },
    )
    // Con el ritmo de fatiga calibrado en F6 hacen falta unos minutos de
    // simulacion para cruzar el ultimo punto, no unos segundos.
    s = avanzar(s, 3000)
    expect(s.descanso?.tipo).toBe('burnout')
  })

  it('NUNCA termina la partida: se sale del pozo', () => {
    /**
     * Este es el test que cierra el agujero estructural que arrastraba el
     * proyecto desde el primer dia. Antes la fatiga podia clavarse en 1.0 y
     * quedarse ahi: la calidad caia a cero y la partida entraba en un pozo
     * sin salida. El GDD es explicito en que no se puede perder.
     */
    let s: GameState = {
      ...createInitialState(9),
      fatiga: 0.99,
      vida: 0.05,
      allocation: { produccion: 1, comunidad: 0, vida: 0, descanso: 0 },
    }
    s = avanzar(s, ticksSemana * (TUNABLES.burnout.semanas + 2))

    expect(s.descanso).toBeNull()
    expect(s.fatiga).toBeLessThan(TUNABLES.fatiga.burnoutThreshold)
    expect(s.calidad).toBeGreaterThan(0)
  })
})

describe('legado', () => {
  it('sin vacaciones no hay legado que consolidar', () => {
    const s = createInitialState()
    expect(consolidarLegado(s)).toBe(s)
  })

  it('consume comunidad y deja multiplicadores permanentes', () => {
    // El prestigio cuesta algo, o no es una decision.
    const antes: GameState = {
      ...createInitialState(),
      comunidad: 100_000,
      vacacionesCompletadas: 1,
    }
    const s = consolidarLegado(antes)
    expect(s.comunidad).toBeLessThan(antes.comunidad)
    expect(s.legadoEficiencia).toBeGreaterThan(antes.legadoEficiencia)
    expect(s.legadoRetencion).toBeGreaterThan(antes.legadoRetencion)
  })

  it('tiene tope: no se puede acumular sin limite', () => {
    let s: GameState = { ...createInitialState(), comunidad: 1e9, vacacionesCompletadas: 1 }
    for (let i = 0; i < 50; i++) s = consolidarLegado(s)
    expect(s.legadoEficiencia).toBeLessThanOrEqual(TUNABLES.legado.maxEficiencia)
    expect(s.legadoRetencion).toBeLessThanOrEqual(TUNABLES.legado.maxRetencion)
  })
})

describe('recuperacion', () => {
  it('baja fatiga y sube vida, acotadas', () => {
    const r = aplicarRecuperacion({ vida: 0.99, fatiga: 0.01 }, 'vacaciones', 100)
    expect(r.vida).toBeLessThanOrEqual(1)
    expect(r.fatiga).toBeGreaterThanOrEqual(0)
  })

  it('las vacaciones recuperan mas rapido que un burnout', () => {
    const v = aplicarRecuperacion({ vida: 0.5, fatiga: 0.5 }, 'vacaciones', 10)
    const b = aplicarRecuperacion({ vida: 0.5, fatiga: 0.5 }, 'burnout', 10)
    expect(v.fatiga).toBeLessThan(b.fatiga)
    expect(v.vida).toBeGreaterThan(b.vida)
  })
})
