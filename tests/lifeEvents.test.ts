import { describe, expect, it } from 'vitest'
import { LIFE_EVENTS } from '../src/content/lifeEvents.ts'
import {
  SEMANAS_ENTRE_EVENTOS,
  caducarModificadores,
  candidatas,
  multModificadores,
  resolver,
  sortear,
  type ModificadorActivo,
} from '../src/sim/lifeEvents.ts'
import { createRng } from '../src/sim/rng.ts'
import { createInitialState } from '../src/sim/state.ts'
import { step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

describe('el contrato de tono del GDD', () => {
  /**
   * La seccion 7 es explicita: "poco impacto numerico, mucho sabor y
   * ambientacion". Estas tarjetas dan textura, no progresion. Estos tests
   * impiden que una tanda futura las convierta en una via de optimizacion.
   */

  it('ningun efecto directo se pasa de pequeno', () => {
    for (const e of LIFE_EVENTS) {
      for (const o of e.opciones) {
        expect(Math.abs(o.efecto.vida ?? 0), `${e.id}: vida`).toBeLessThanOrEqual(0.1)
        expect(Math.abs(o.efecto.fatiga ?? 0), `${e.id}: fatiga`).toBeLessThanOrEqual(0.1)
        expect(Math.abs(o.efecto.ideas ?? 0), `${e.id}: ideas`).toBeLessThanOrEqual(5)
      }
    }
  })

  it('ningun modificador temporal supera el 20% ni dura demasiado', () => {
    for (const e of LIFE_EVENTS) {
      for (const o of e.opciones) {
        const m = o.efecto.modificador
        if (!m) continue
        for (const v of [m.calidad, m.eficiencia, m.alcance]) {
          if (v === undefined) continue
          expect(Math.abs(v - 1), `${e.id}: ${m.id}`).toBeLessThanOrEqual(0.2)
        }
        expect(m.semanas, `${e.id}: ${m.id}`).toBeLessThanOrEqual(6)
      }
    }
  })

  it('toda tarjeta tiene al menos una opcion y todas tienen resultado', () => {
    for (const e of LIFE_EVENTS) {
      expect(e.opciones.length, e.id).toBeGreaterThanOrEqual(1)
      for (const o of e.opciones) {
        expect(o.texto.length, e.id).toBeGreaterThan(0)
        expect(o.resultado.length, e.id).toBeGreaterThan(0)
      }
    }
  })

  it('los ids son unicos', () => {
    const ids = LIFE_EVENTS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('sorteo', () => {
  it('respeta la semana minima', () => {
    const pronto = candidatas({ ...createInitialState(), week: 0 })
    expect(pronto.every((e) => (e.desdeSemana ?? 0) <= 0)).toBe(true)
    expect(pronto.length).toBeLessThan(LIFE_EVENTS.length)
  })

  it('respeta la etapa de casa minima', () => {
    const s = { ...createInitialState(), week: 100, houseStage: 0 }
    expect(candidatas(s).every((e) => (e.desdeCasa ?? 0) <= 0)).toBe(true)
  })

  it('no repite una tarjeta ya vista mientras queden otras', () => {
    // Una partida de dos horas no aguanta ver dos veces el mismo gato.
    const visto = LIFE_EVENTS[0]
    expect(visto).toBeDefined()
    if (!visto) return
    const s = { ...createInitialState(), week: 100, houseStage: 5, eventosVistos: [visto.id] }
    expect(candidatas(s).some((e) => e.id === visto.id)).toBe(false)
  })

  it('vistas todas, reabre la baraja en vez de quedarse sin eventos', () => {
    const s = {
      ...createInitialState(),
      week: 100,
      houseStage: 5,
      eventosVistos: LIFE_EVENTS.map((e) => e.id),
    }
    expect(candidatas(s).length).toBeGreaterThan(0)
  })

  it('es determinista', () => {
    const s = { ...createInitialState(), week: 50, houseStage: 3 }
    const a = sortear(s, createRng(9))
    const b = sortear(s, createRng(9))
    expect(a.evento?.id).toBe(b.evento?.id)
  })
})

describe('resolver', () => {
  it('aplica el efecto y marca la tarjeta como vista', () => {
    const base = { ...createInitialState(), ideas: 10 }
    const s = resolver(base, 'libro-tarde', 0)
    expect(s.eventoPendiente).toBeNull()
    expect(s.eventosVistos).toContain('libro-tarde')
    expect(s.ideas).toBeGreaterThan(10)
  })

  it('un modificador repetido se renueva, no se acumula', () => {
    // Dos tarjetas del mismo tipo multiplicandose entre si seria una via de
    // progresion encubierta.
    let s = resolver({ ...createInitialState(), week: 0 }, 'cena-amigos', 0)
    s = resolver({ ...s, week: 1 }, 'cena-amigos', 0)
    expect(s.modificadores.filter((m) => m.id === 'buen-humor')).toHaveLength(1)
  })

  it('una tarjeta o una opcion inexistente no rompe la partida', () => {
    const base = { ...createInitialState(), eventoPendiente: 'no_existe' }
    expect(resolver(base, 'no_existe', 0).eventoPendiente).toBeNull()
    expect(resolver(base, 'libro-tarde', 99).eventoPendiente).toBeNull()
  })

  it('vida y fatiga siguen acotadas a 0..1', () => {
    const s = resolver({ ...createInitialState(), vida: 1, fatiga: 1 }, 'libro-tarde', 1)
    expect(s.vida).toBeLessThanOrEqual(1)
    expect(s.fatiga).toBeLessThanOrEqual(1)
  })
})

describe('modificadores', () => {
  const mod = (id: string, hasta: number): ModificadorActivo => ({
    id,
    etiqueta: id,
    hastaSemana: hasta,
    calidad: 1.1,
    eficiencia: 1,
    alcance: 1,
  })

  it('caducan al pasar su semana', () => {
    expect(caducarModificadores([mod('a', 5)], 6)).toHaveLength(0)
    expect(caducarModificadores([mod('a', 5)], 3)).toHaveLength(1)
  })

  it('devuelve el mismo array si no caduca ninguno', () => {
    const lista = [mod('a', 10)]
    expect(caducarModificadores(lista, 1)).toBe(lista)
  })

  it('sin modificadores, los multiplicadores son neutros', () => {
    expect(multModificadores([])).toEqual({ calidad: 1, eficiencia: 1, alcance: 1 })
  })

  it('se multiplican entre si', () => {
    const m = multModificadores([mod('a', 9), mod('b', 9)])
    expect(m.calidad).toBeCloseTo(1.21, 6)
  })
})

describe('la partida se detiene mientras hay una tarjeta abierta', () => {
  it('el tick no avanza el reloj con un evento pendiente', () => {
    // El tiempo que el jugador dedica a leer no debe consumir su partida.
    const s = { ...createInitialState(), eventoPendiente: 'libro-tarde' }
    expect(step(s, TUNABLES.tickMs)).toBe(s)
  })

  it('sale una tarjeta al cumplirse el intervalo de semanas', () => {
    let s = createInitialState(3)
    const ticksPorSemana = (TUNABLES.secondsPerWeek * 1000) / TUNABLES.tickMs
    for (let i = 0; i < ticksPorSemana * (SEMANAS_ENTRE_EVENTOS + 1); i++) {
      s = step(s, TUNABLES.tickMs)
      if (s.eventoPendiente) break
    }
    expect(s.eventoPendiente).not.toBeNull()
  })

  it('resolverla reanuda la partida', () => {
    let s = createInitialState(3)
    const ticksPorSemana = (TUNABLES.secondsPerWeek * 1000) / TUNABLES.tickMs
    for (let i = 0; i < ticksPorSemana * (SEMANAS_ENTRE_EVENTOS + 1); i++) {
      s = step(s, TUNABLES.tickMs)
      if (s.eventoPendiente) break
    }
    const id = s.eventoPendiente
    expect(id).not.toBeNull()
    if (!id) return

    const reanudada = resolver(s, id, 0)
    const antes = reanudada.elapsedMs
    expect(step(reanudada, TUNABLES.tickMs).elapsedMs).toBeGreaterThan(antes)
  })
})
