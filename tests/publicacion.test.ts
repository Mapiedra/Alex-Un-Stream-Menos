import { describe, expect, it } from 'vitest'
import {
  NIVELES,
  acumularMaterial,
  costeMaterial,
  hayMaterial,
  materialPorSegundo,
  nivel,
  nivelValido,
  type NivelEdicion,
} from '../src/sim/publicacion.ts'
import { calcResidual } from '../src/sim/formulas.ts'
import { createInitialState, type GameState } from '../src/sim/state.ts'
import { alternarDirecto, enDirecto, publicar, step } from '../src/sim/tick.ts'
import { lanzarSemana, llenarSemana } from '../src/sim/semana.ts'
import { comprar } from '../src/sim/shop.ts'
import { UPGRADES_POR_ID } from '../src/content/upgrades.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

const costeMaterialMejora = (id: string) => UPGRADES_POR_ID.get(id)?.costeMaterial ?? 0

const conMaterial = (m: number, over: Partial<GameState> = {}): GameState => ({
  ...createInitialState(),
  material: m,
  ...over,
})

/** Pone la semana entera de un mismo bloque y la lanza. */
function semanaDe(bloque: Parameters<typeof llenarSemana>[1], over: Partial<GameState> = {}) {
  const base = { ...createInitialState(), ...over }
  return lanzarSemana({ ...base, semana: llenarSemana(base.semana, bloque) })
}

describe('publicar cuesta material', () => {
  it('sin material no se publica', () => {
    // Es LA diferencia entre un clicker y una decision.
    const s = conMaterial(0)
    expect(publicar(s)).toBe(s)
    expect(publicar(s).publicacionesTotales).toBe(0)
  })

  it('publicar descuenta lo que cuesta el nivel', () => {
    for (const id of NIVELES) {
      const s = publicar(conMaterial(5), id)
      expect(s.material).toBeCloseTo(5 - costeMaterial(id), 10)
    }
  })

  it('cada nivel cuesta mas que el anterior', () => {
    expect(costeMaterial('rapido')).toBeLessThan(costeMaterial('normal'))
    expect(costeMaterial('normal')).toBeLessThan(costeMaterial('cuidado'))
  })

  it('con material justo se puede, con un pelo menos no', () => {
    expect(hayMaterial(costeMaterial('cuidado'), 'cuidado')).toBe(true)
    expect(hayMaterial(costeMaterial('cuidado') - 0.01, 'cuidado')).toBe(false)
  })

  it('un nivel inventado cae en el normal en vez de romper', () => {
    expect(nivelValido('kaboom')).toBe('normal')
    expect(nivelValido(undefined)).toBe('normal')
    expect(nivelValido('cuidado')).toBe('cuidado')
  })
})

describe('los tres niveles de edicion dicen cosas distintas', () => {
  it('cuidarlo deja mas peso en el catalogo; sacarlo ya, menos', () => {
    const peso = (id: NivelEdicion) =>
      publicar(conMaterial(10), id).catalogo[0]?.weight ?? 0
    expect(peso('cuidado')).toBeGreaterThan(peso('normal'))
    expect(peso('normal')).toBeGreaterThan(peso('rapido'))
  })

  it('sacarlo ya da mas pico y mas hype', () => {
    const rapido = publicar(conMaterial(10), 'rapido')
    const cuidado = publicar(conMaterial(10), 'cuidado')
    expect(rapido.alcance).toBeGreaterThan(cuidado.alcance)
    expect(rapido.hype).toBeGreaterThan(cuidado.hype)
  })

  it('por material invertido, cuidarlo renta mas a largo plazo', () => {
    /**
     * ESTE es el test de la tesis metida en el boton: sacarlo rapido rinde
     * HOY y cuidarlo construye el final. Si dejara de ser verdad, el nivel de
     * edicion seria decoracion.
     */
    const porMaterial = (id: NivelEdicion) => {
      const peso = publicar(conMaterial(10), id).catalogo[0]?.weight ?? 0
      return calcResidual(peso, 52) / costeMaterial(id)
    }
    expect(porMaterial('cuidado')).toBeGreaterThan(porMaterial('normal'))
    expect(porMaterial('normal')).toBeGreaterThan(porMaterial('rapido'))
  })
})

describe('el material sale de las horas', () => {
  it('editar produce mucho mas que emitir', () => {
    expect(materialPorSegundo('editar', false, 1)).toBeGreaterThan(
      materialPorSegundo('emitir', true, 1),
    )
  })

  it('las franjas que no producen no dejan material', () => {
    for (const b of ['comunidad', 'leer', 'vida', 'dormir'] as const) {
      expect(materialPorSegundo(b, false, 1), b).toBe(0)
    }
  })

  it('escala con la eficiencia: montar plantillas SI saca mas videos', () => {
    expect(materialPorSegundo('editar', false, 2)).toBeCloseTo(
      materialPorSegundo('editar', false, 1) * 2,
      10,
    )
  })

  it('tiene tope: colchon si, almacen no', () => {
    expect(acumularMaterial(0, 1e6)).toBe(TUNABLES.publicacion.maximo)
    expect(acumularMaterial(1, -50)).toBe(0)
  })

  it('una semana entera editando deja material de sobra', () => {
    let s = semanaDe('editar')
    for (let i = 0; i < 900; i++) s = step(s, TUNABLES.tickMs)
    expect(s.material).toBeGreaterThan(costeMaterial('normal'))
  })

  it('una semana entera durmiendo no deja ninguno', () => {
    let s = semanaDe('dormir')
    for (let i = 0; i < 900; i++) s = step(s, TUNABLES.tickMs)
    expect(s.material).toBe(0)
  })

  it('parado no se graba: de vacaciones no se hacen videos', () => {
    let s = semanaDe('editar', {
      descanso: { tipo: 'vacaciones', semanasRestantes: 3, semanasTotales: 3 },
    })
    for (let i = 0; i < 300; i++) s = step(s, TUNABLES.tickMs)
    expect(s.material).toBe(0)
  })
})

describe('el directo se enciende y se apaga', () => {
  it('una franja de emitir esta en directo y una de editar no', () => {
    expect(enDirecto(semanaDe('emitir'))).toBe(true)
    expect(enDirecto(semanaDe('editar'))).toBe(false)
  })

  it('mientras se reparte la semana no se emite', () => {
    expect(enDirecto(createInitialState())).toBe(false)
  })

  it('parado no se emite aunque la semana dijese que si', () => {
    const s = semanaDe('emitir', {
      descanso: { tipo: 'burnout', semanasRestantes: 5, semanasTotales: 5 },
    })
    expect(enDirecto(s)).toBe(false)
  })

  it('cortar el directo lo apaga; volver a pulsar lo enciende', () => {
    const s = semanaDe('emitir')
    const cortado = alternarDirecto(s)
    expect(enDirecto(cortado)).toBe(false)
    expect(enDirecto(alternarDirecto(cortado))).toBe(true)
  })

  it('se puede encender aunque la franja no fuese de emitir', () => {
    // La semana pone el marco; el boton decide el momento.
    const s = semanaDe('vida')
    expect(enDirecto(alternarDirecto(s))).toBe(true)
  })

  it('el interruptor solo vale para la franja en curso', () => {
    // No se puede dejar puesto y olvidarse: cada franja se decide de nuevo.
    let s = alternarDirecto(semanaDe('emitir'))
    expect(s.directoManual).not.toBeNull()
    const ticksBloque = Math.ceil(((TUNABLES.secondsPerWeek / 21) * 1000) / TUNABLES.tickMs) + 2
    for (let i = 0; i < ticksBloque; i++) s = step(s, TUNABLES.tickMs)
    expect(s.directoManual).toBeNull()
    expect(enDirecto(s)).toBe(true)
  })

  it('sin directo no entra nadie ni se mueve el chat', () => {
    let enAntena = semanaDe('emitir', { alcance: 5000, comunidad: 2000 })
    let apagado = semanaDe('editar', { alcance: 5000, comunidad: 2000 })
    for (let i = 0; i < 200; i++) {
      enAntena = step(enAntena, TUNABLES.tickMs)
      apagado = step(apagado, TUNABLES.tickMs)
    }
    expect(enAntena.alcance).toBeGreaterThan(apagado.alcance)
    expect(enAntena.chat.length).toBeGreaterThan(0)
    expect(apagado.chat).toHaveLength(0)
  })

  it('el catalogo sigue rentando con el directo apagado', () => {
    // De eso va el final del juego: vives de lo que ya publicaste.
    let s = semanaDe('dormir', { catalogo: [{ week: 0, weight: 500 }] })
    for (let i = 0; i < 50; i++) s = step(s, TUNABLES.tickMs)
    expect(s.ingresosPorSegundo).toBeGreaterThan(0)
  })
})

describe('el calendario de publicacion', () => {
  // El calendario cuesta dinero Y material: montar la cola son horas de
  // edicion. Los tests lo pagan por adelantado y publican con lo que sobra.
  const conCalendario = (over: Partial<GameState> = {}) => {
    const material = (over.material ?? 0) + costeMaterialMejora('calendario')
    return comprar(
      { ...createInitialState(), ahorros: 5000, cycle: 3, ...over, material },
      'calendario',
    )
  }

  it('sin comprarlo no publica solo', () => {
    let s = semanaDe('editar', { material: 5 })
    for (let i = 0; i < 100; i++) s = step(s, TUNABLES.tickMs)
    expect(s.publicacionesTotales).toBe(0)
  })

  it('comprado, publica solo cuando hay material', () => {
    const base = conCalendario({ material: 5 })
    let s = lanzarSemana({ ...base, semana: llenarSemana(base.semana, 'editar') })
    for (let i = 0; i < 100; i++) s = step(s, TUNABLES.tickMs)
    expect(s.publicacionesTotales).toBeGreaterThan(0)
  })

  it('no publica en mitad de un directo: ahi estas tu delante', () => {
    const base = conCalendario({ material: 5 })
    let s = lanzarSemana({ ...base, semana: llenarSemana(base.semana, 'emitir') })
    for (let i = 0; i < 100; i++) s = step(s, TUNABLES.tickMs)
    expect(s.publicacionesTotales).toBe(0)
  })

  it('sin la cola preparada publica a nivel normal, diga lo que diga el ajuste', () => {
    // Material justo para un normal pero no para un cuidado: si publica, es
    // que esta usando el normal.
    const base = conCalendario({ material: 1.5, nivelAuto: 'cuidado' })
    let s = lanzarSemana({ ...base, semana: llenarSemana(base.semana, 'editar') })
    for (let i = 0; i < 5; i++) s = step(s, TUNABLES.tickMs)
    expect(s.publicacionesTotales).toBe(1)
  })

  it('con la cola preparada respeta el nivel elegido y espera si hace falta', () => {
    const conMargen = conCalendario({ material: 1.5, nivelAuto: 'cuidado' })
    const base = comprar(
      { ...conMargen, material: conMargen.material + costeMaterialMejora('programacion') },
      'programacion',
    )
    expect(base.owned['programacion']).toBe(1)
    let s = lanzarSemana({ ...base, semana: llenarSemana(base.semana, 'editar') })
    for (let i = 0; i < 5; i++) s = step(s, TUNABLES.tickMs)
    // 1.5 no llega para un cuidado: no publica, acumula.
    expect(s.publicacionesTotales).toBe(0)
    for (let i = 0; i < 500; i++) s = step(s, TUNABLES.tickMs)
    expect(s.publicacionesTotales).toBeGreaterThan(0)
  })

  it('ninguna mejora de automatizacion contrata a nadie', () => {
    // Regla dura del proyecto: el creador trabaja solo. Lo que se compra es
    // organizarse, nunca un editor.
    for (const id of ['avisos', 'calendario', 'programacion']) {
      const s = comprar(
        { ...createInitialState(), ahorros: 5000, cycle: 3, material: 10 },
        id,
      )
      expect(s.owned[id], id).toBe(1)
      // No tocan multiplicadores: no producen por ti, solo te ahorran estar.
      expect(s.multEficiencia).toBe(1)
      expect(s.multCalidad).toBe(1)
      expect(s.multAlcance).toBe(1)
    }
  })
})

describe('integridad de los niveles', () => {
  it('estan los tres y ninguno es gratis', () => {
    expect(NIVELES).toHaveLength(3)
    for (const id of NIVELES) expect(nivel(id).material).toBeGreaterThan(0)
  })
})
