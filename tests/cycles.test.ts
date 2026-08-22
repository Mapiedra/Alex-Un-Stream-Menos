import { describe, expect, it } from 'vitest'
import { CYCLES, ULTIMO_CICLO } from '../src/content/cycles.ts'
import { HOUSE_STAGES, MAX_HOUSE_STAGE, houseStage, objetosVisibles } from '../src/content/houseStages.ts'
import {
  avanzarCiclo,
  formatosPropios,
  progresoDelCiclo,
  puedeAvanzar,
  requisitosDelCiclo,
} from '../src/sim/cycles.ts'
import { createInitialState, houseLivingCost, type GameState } from '../src/sim/state.ts'
import { aplicarMejoras } from '../src/sim/shop.ts'
import { step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

/** Estado que cumple holgadamente cualquier requisito. */
const todoCumplido = (over: Partial<GameState> = {}): GameState =>
  // Pasa por aplicarMejoras para que el reparto quede DERIVADO de lo comprado,
  // que es como esta siempre en una partida real antes del ciclo 3.
  aplicarMejoras({
    ...createInitialState(),
    comunidad: 1e9,
    alcance: 1e9,
    calidad: 99,
    houseStage: MAX_HOUSE_STAGE,
    publicacionesTotales: 999,
    owned: { nicho: 1, charlas: 1 },
    ...over,
  })

describe('integridad de los ciclos', () => {
  it('estan numerados de 1 a N sin huecos', () => {
    CYCLES.forEach((c, i) => expect(c.numero).toBe(i + 1))
    expect(ULTIMO_CICLO).toBe(CYCLES.length)
  })

  it('todos tienen texto de entrada y de cierre', () => {
    for (const c of CYCLES) {
      expect(c.entrada.length, `ciclo ${c.numero}`).toBeGreaterThan(20)
      expect(c.cierre.length, `ciclo ${c.numero}`).toBeGreaterThan(20)
    }
  })

  it('solo el ciclo 3 abre el reparto de horas', () => {
    const abren = CYCLES.filter((c) => c.abreReparto)
    expect(abren).toHaveLength(1)
    expect(abren[0]?.numero).toBe(3)
  })

  it('los requisitos de comunidad suben cada vez que aparecen', () => {
    // No todos los ciclos piden comunidad —el 4 mide calidad y casa— asi que
    // solo se comparan los que la declaran.
    const porComunidad = CYCLES.map((c) => c.requisitos.find((r) => r.clave === 'comunidad')?.minimo)
      .filter((v): v is number => v !== undefined)
    expect(porComunidad.length).toBeGreaterThan(1)
    for (let i = 1; i < porComunidad.length; i++) {
      expect(porComunidad[i] ?? 0).toBeGreaterThan(porComunidad[i - 1] ?? 0)
    }
  })
})

describe('avance', () => {
  it('una partida recien empezada no avanza', () => {
    expect(puedeAvanzar(createInitialState())).toBe(false)
  })

  it('cumplir todos los requisitos abre el siguiente ciclo', () => {
    const s = todoCumplido()
    expect(puedeAvanzar(s)).toBe(true)
    expect(avanzarCiclo(s).cycle).toBe(2)
  })

  it('cumplir solo una parte no basta', () => {
    // Los requisitos se cumplen TODOS, no la mayoria.
    const s = { ...createInitialState(), publicacionesTotales: 999, comunidad: 0 }
    expect(puedeAvanzar(s)).toBe(false)
  })

  it('el ultimo ciclo no avanza a ninguna parte', () => {
    const s = todoCumplido({ cycle: ULTIMO_CICLO })
    expect(puedeAvanzar(s)).toBe(false)
    expect(avanzarCiclo(s)).toBe(s)
  })

  it('el tick avanza de ciclo solo, sin que el jugador decida', () => {
    // El GDD plantea los ciclos como etapas de una carrera, no como niveles
    // que se eligen: cuando has llegado, has llegado.
    const s = step(todoCumplido(), TUNABLES.tickMs)
    expect(s.cycle).toBe(2)
  })

  it('llegar al ciclo 3 devuelve al creador el control de sus horas', () => {
    let s = todoCumplido({ cycle: 2 })
    expect(s.allocationUnlocked).toBe(false)
    s = avanzarCiclo(s)
    expect(s.cycle).toBe(3)
    expect(s.allocationUnlocked).toBe(true)
  })

  it('el reparto al desbloquearse es el que ya tenia, no uno nuevo', () => {
    // Es la garantia del hibrido: se toma el control de unos numeros que ya
    // existian, no se estrena un sistema.
    const antes = todoCumplido({ cycle: 2 })
    expect(avanzarCiclo(antes).allocation).toEqual(antes.allocation)
  })
})

describe('requisitos y progreso', () => {
  it('informan del valor actual para poder pintarlos', () => {
    const s = { ...createInitialState(), comunidad: 200, publicacionesTotales: 2 }
    const reqs = requisitosDelCiclo(s)
    expect(reqs.length).toBeGreaterThan(0)
    expect(reqs.find((r) => r.clave === 'comunidad')?.actual).toBe(200)
    expect(reqs.every((r) => r.cumplido)).toBe(false)
  })

  it('el progreso va de 0 a 1 y no se pasa', () => {
    expect(progresoDelCiclo(createInitialState())).toBeGreaterThanOrEqual(0)
    expect(progresoDelCiclo(todoCumplido())).toBe(1)
  })

  it('cuenta los formatos propios comprados', () => {
    expect(formatosPropios(createInitialState())).toBe(0)
    expect(formatosPropios({ ...createInitialState(), owned: { nicho: 1, micro: 1 } })).toBe(1)
  })
})

describe('etapas de casa', () => {
  it('estan numeradas sin huecos', () => {
    HOUSE_STAGES.forEach((h, i) => expect(h.nivel).toBe(i))
  })

  it('cada etapa cuesta mas de mantener que la anterior', () => {
    // Es la tension del tramo final: profesionalizarse aleja el retiro.
    for (let i = 1; i < HOUSE_STAGES.length; i++) {
      expect(
        HOUSE_STAGES[i]?.costeVida ?? 0,
        `la etapa ${i} no encarece`,
      ).toBeGreaterThan(HOUSE_STAGES[i - 1]?.costeVida ?? 0)
    }
  })

  it('un nivel fuera de rango se acota en vez de romper', () => {
    expect(houseStage(-5).nivel).toBe(0)
    expect(houseStage(99).nivel).toBe(MAX_HOUSE_STAGE)
    expect(houseLivingCost(99)).toBe(houseStage(MAX_HOUSE_STAGE).costeVida)
  })

  it('los objetos se acumulan: la escena crece, no se sustituye', () => {
    const inicial = objetosVisibles(0)
    const final = objetosVisibles(MAX_HOUSE_STAGE)
    expect(final.length).toBeGreaterThan(inicial.length)
    for (const o of inicial) expect(final, `desaparece ${o}`).toContain(o)
  })

  it('ningun objeto se declara dos veces', () => {
    const todos = objetosVisibles(MAX_HOUSE_STAGE)
    expect(new Set(todos).size).toBe(todos.length)
  })
})
