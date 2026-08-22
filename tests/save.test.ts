import { describe, expect, it } from 'vitest'
import { deserializar, serializar } from '../src/sim/save/index.ts'
import { MIGRACIONES, migrar, pareceGameState } from '../src/sim/save/migrate.ts'
import { SCHEMA_VERSION, createInitialState } from '../src/sim/state.ts'
import { comprar } from '../src/sim/shop.ts'
import { step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

/** Una partida con recorrido: mejoras compradas, catalogo y tiempo jugado. */
function partidaAvanzada() {
  let s = { ...createInitialState(7), ahorros: 5000, ideas: 60 }
  s = comprar(s, 'micro')
  s = comprar(s, 'dormir')
  s = comprar(s, 'nicho')
  for (let i = 0; i < 500; i++) s = step(s, TUNABLES.tickMs)
  return s
}

describe('ida y vuelta', () => {
  it('una partida sobrevive intacta a guardar y cargar', () => {
    const s = partidaAvanzada()
    const r = deserializar(serializar(s))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.state).toEqual(s)
      expect(r.migrada).toBe(false)
    }
  })

  it('la partida cargada sigue simulando igual que la original', () => {
    // Si no, cerrar y reabrir el juego cambiaria el resultado de la partida.
    const s = partidaAvanzada()
    const r = deserializar(serializar(s))
    expect(r.ok).toBe(true)
    if (!r.ok) return

    let a = s
    let b = r.state
    for (let i = 0; i < 300; i++) {
      a = step(a, TUNABLES.tickMs)
      b = step(b, TUNABLES.tickMs)
    }
    expect(b).toEqual(a)
  })
})

describe('migraciones', () => {
  it('hay una migracion para cada version anterior a la actual', () => {
    for (let v = 1; v < SCHEMA_VERSION; v++) {
      expect(MIGRACIONES[v], `falta la migracion desde la v${v}`).toBeDefined()
    }
  })

  it('un guardado de la v1 sube a la version actual y es jugable', () => {
    // Forma real de la v1: sin owned, sin clip, sin chat.
    const v1: Record<string, unknown> = {
      ...createInitialState(3),
      schemaVersion: 1,
    }
    delete v1['owned']
    delete v1['clip']
    delete v1['chat']
    delete v1['chatNextId']
    delete v1['chatAcc']

    const r = deserializar(JSON.stringify(v1))
    expect(r.ok).toBe(true)
    if (!r.ok) return

    expect(r.migrada).toBe(true)
    expect(r.state.schemaVersion).toBe(SCHEMA_VERSION)
    expect(r.state.owned).toEqual({})
    expect(r.state.chat).toEqual([])
    expect(() => step(r.state, TUNABLES.tickMs)).not.toThrow()
  })

  it('migrar es idempotente sobre una partida ya actual', () => {
    const s = JSON.parse(serializar(createInitialState()))
    expect(migrar(s)).toEqual(s)
  })

  it('rechaza una partida de una version mas nueva que el juego', () => {
    // Bajar de version perderia datos en silencio. Mejor avisar.
    const futuro = { ...createInitialState(), schemaVersion: SCHEMA_VERSION + 5 }
    const r = deserializar(JSON.stringify(futuro))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toContain('version')
  })
})

describe('guardados rotos', () => {
  it('un JSON invalido no tumba el juego', () => {
    const r = deserializar('{esto no es json')
    expect(r.ok).toBe(false)
  })

  it('un objeto que no es una partida se rechaza', () => {
    const r = deserializar(JSON.stringify({ schemaVersion: SCHEMA_VERSION, hola: 'mundo' }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toMatch(/incompleto|corrupto/)
  })

  it('un valor NaN se detecta como corrupcion', () => {
    // JSON.stringify convierte NaN en null: hay que cazarlo al cargar.
    const roto = { ...createInitialState(), alcance: null }
    const r = deserializar(JSON.stringify(roto))
    expect(r.ok).toBe(false)
  })

  it('null y arrays no pasan por partida', () => {
    expect(deserializar('null').ok).toBe(false)
    expect(deserializar('[]').ok).toBe(false)
  })
})

describe('los derivados se recalculan al cargar', () => {
  it('una mejora que cambio de efecto se refleja con su efecto NUEVO', () => {
    // Se guarda un multiplicador imposible; al cargar debe reconstruirse
    // desde `owned` en vez de confiar en lo que ponia el fichero.
    const s = comprar({ ...createInitialState(), ahorros: 1000 }, 'micro')
    const manipulado = { ...s, multCalidad: 9999 }
    const r = deserializar(JSON.stringify(manipulado))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.state.multCalidad).toBe(s.multCalidad)
  })
})

describe('pareceGameState', () => {
  it('acepta una partida real', () => {
    expect(pareceGameState(JSON.parse(serializar(createInitialState())))).toBe(true)
  })

  it('rechaza lo que le falten campos', () => {
    expect(pareceGameState({ alcance: 1 })).toBe(false)
  })
})
