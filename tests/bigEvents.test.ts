import { describe, expect, it } from 'vitest'
import { BIG_EVENTS, BIG_POR_ID } from '../src/content/bigEvents.ts'
import {
  avanzarSemana,
  faseActual,
  multEvento,
  prepararEvento,
  sortearEvento,
  type EventoActivo,
} from '../src/sim/bigEvents.ts'
import { createRng } from '../src/sim/rng.ts'
import { createInitialState } from '../src/sim/state.ts'

const activo = (id: string, fase = 0, over: Partial<EventoActivo> = {}): EventoActivo => ({
  id,
  fase,
  semanasRestantes: 1,
  preparado: false,
  anunciado: false,
  ...over,
})

describe('integridad del catalogo', () => {
  it('los ids son unicos', () => {
    const ids = BIG_EVENTS.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todos tienen fases y todas duran al menos una semana', () => {
    for (const e of BIG_EVENTS) {
      expect(e.fases.length, e.id).toBeGreaterThan(1)
      for (const f of e.fases) expect(f.semanas, `${e.id}/${f.fase}`).toBeGreaterThanOrEqual(1)
    }
  })

  it('la conferencia tiene las tres fases del GDD: antes, durante y despues', () => {
    const c = BIG_POR_ID.get('conferencia')
    expect(c).toBeDefined()
    const fases = c?.fases.map((f) => f.fase) ?? []
    expect(fases).toContain('preparacion')
    expect(fases).toContain('directo')
    expect(fases).toContain('retencion')
    // La retencion va DESPUES del pico: es donde se decide si sirvio de algo.
    expect(fases.indexOf('retencion')).toBeGreaterThan(fases.indexOf('directo'))
  })

  it('el directo solidario no da ni alcance ni ingresos', () => {
    // Seccion 6.3: su valor es reputacional y comunitario, no de audiencia.
    const s = BIG_POR_ID.get('solidario')
    const directo = s?.fases.find((f) => f.fase === 'directo')
    expect(directo?.alcance).toBe(0)
    expect(directo?.ingresos).toBe(0)
    expect(directo?.afinidad ?? 0).toBeGreaterThan(1)
  })

  it('son escasos: el reposo entre apariciones es largo', () => {
    for (const e of BIG_EVENTS) expect(e.reposoSemanas, e.id).toBeGreaterThanOrEqual(20)
  })
})

describe('multiplicadores', () => {
  it('sin evento, todo neutro', () => {
    expect(multEvento(null)).toEqual({ alcance: 1, afinidad: 1, fatiga: 1, ingresos: 1 })
  })

  it('la fase de directo dispara el alcance y el desgaste', () => {
    const c = BIG_POR_ID.get('conferencia')
    const i = c?.fases.findIndex((f) => f.fase === 'directo') ?? 0
    const m = multEvento(activo('conferencia', i))
    expect(m.alcance).toBeGreaterThan(3)
    expect(m.fatiga).toBeGreaterThan(1)
  })

  it('la ventana de retencion cambia alcance por fidelidad', () => {
    const c = BIG_POR_ID.get('conferencia')
    const i = c?.fases.findIndex((f) => f.fase === 'retencion') ?? 0
    const m = multEvento(activo('conferencia', i))
    expect(m.alcance).toBeLessThan(1)
    expect(m.afinidad).toBeGreaterThan(1)
  })

  it('prepararse rinde mas y cansa menos, pero solo durante el directo', () => {
    const c = BIG_POR_ID.get('conferencia')
    const iDirecto = c?.fases.findIndex((f) => f.fase === 'directo') ?? 0
    const sin = multEvento(activo('conferencia', iDirecto))
    const con = multEvento(activo('conferencia', iDirecto, { preparado: true }))
    expect(con.alcance).toBeGreaterThan(sin.alcance)
    expect(con.fatiga).toBeLessThan(sin.fatiga)

    // En la ventana de retencion ya da igual haberse preparado.
    const iRet = c?.fases.findIndex((f) => f.fase === 'retencion') ?? 0
    expect(multEvento(activo('conferencia', iRet, { preparado: true }))).toEqual(
      multEvento(activo('conferencia', iRet)),
    )
  })
})

describe('avance por fases', () => {
  it('descuenta semanas dentro de la fase', () => {
    const r = avanzarSemana(activo('conferencia', 0, { semanasRestantes: 3 }), 10, {})
    expect(r.evento?.semanasRestantes).toBe(2)
    expect(r.evento?.fase).toBe(0)
  })

  it('pasa a la siguiente fase al agotarse', () => {
    const r = avanzarSemana(activo('conferencia', 0, { semanasRestantes: 1 }), 10, {})
    expect(r.evento?.fase).toBe(1)
    expect(r.completado).toBe(false)
  })

  it('al terminar la ultima fase se completa y anota la semana', () => {
    const c = BIG_POR_ID.get('conferencia')
    const ultima = (c?.fases.length ?? 1) - 1
    const r = avanzarSemana(activo('conferencia', ultima, { semanasRestantes: 1 }), 42, {})
    expect(r.evento).toBeNull()
    expect(r.completado).toBe(true)
    expect(r.ultimoBigEvent['conferencia']).toBe(42)
  })

  it('sin evento no hace nada', () => {
    expect(avanzarSemana(null, 5, {}).evento).toBeNull()
  })
})

describe('sorteo', () => {
  it('no aparece antes de su ciclo', () => {
    const s = { ...createInitialState(), cycle: 1, week: 500 }
    // Ningun evento arranca en el ciclo 1.
    let rng = createRng(1)
    for (let i = 0; i < 200; i++) {
      const r = sortearEvento(s, rng)
      rng = r.rng
      expect(r.evento).toBeNull()
    }
  })

  it('respeta el reposo entre apariciones', () => {
    const s = {
      ...createInitialState(),
      cycle: 5,
      week: 10,
      ultimoBigEvent: { conferencia: 5, solidario: 5 },
    }
    let rng = createRng(2)
    for (let i = 0; i < 200; i++) {
      const r = sortearEvento(s, rng)
      rng = r.rng
      expect(r.evento).toBeNull()
    }
  })

  it('acaba apareciendo cuando toca', () => {
    const s = { ...createInitialState(), cycle: 5, week: 200 }
    let rng = createRng(3)
    let salio: EventoActivo | null = null
    for (let i = 0; i < 500 && !salio; i++) {
      const r = sortearEvento(s, rng)
      rng = r.rng
      salio = r.evento
    }
    expect(salio).not.toBeNull()
    expect(faseActual(salio)?.fase).toBe('anuncio')
  })

  it('no sortea otro si ya hay uno en curso', () => {
    const s = { ...createInitialState(), cycle: 5, week: 200, evento: activo('conferencia') }
    const r = sortearEvento(s, createRng(4))
    expect(r.evento).toBe(s.evento)
  })
})

describe('prepararse', () => {
  it('cobra y marca el evento como preparado', () => {
    const s = {
      ...createInitialState(),
      ahorros: 5000,
      evento: activo('conferencia', 0),
    }
    const r = prepararEvento(s)
    expect(r.evento?.preparado).toBe(true)
    expect(r.ahorros).toBeLessThan(5000)
  })

  it('sin dinero no se prepara ni se cobra', () => {
    const s = { ...createInitialState(), ahorros: 1, evento: activo('conferencia', 0) }
    expect(prepararEvento(s)).toBe(s)
  })

  it('no se puede preparar dos veces', () => {
    const s = {
      ...createInitialState(),
      ahorros: 5000,
      evento: activo('conferencia', 0, { preparado: true }),
    }
    expect(prepararEvento(s)).toBe(s)
  })

  it('no se puede preparar cuando ya ha empezado', () => {
    const c = BIG_POR_ID.get('conferencia')
    const i = c?.fases.findIndex((f) => f.fase === 'directo') ?? 0
    const s = { ...createInitialState(), ahorros: 5000, evento: activo('conferencia', i) }
    expect(prepararEvento(s)).toBe(s)
  })

  it('el solidario no se prepara: no hay nada que preparar', () => {
    const s = { ...createInitialState(), ahorros: 5000, evento: activo('solidario', 0) }
    expect(prepararEvento(s)).toBe(s)
  })
})
