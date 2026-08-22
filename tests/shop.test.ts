import { describe, expect, it } from 'vitest'
import { UPGRADES, UPGRADES_POR_ID } from '../src/content/upgrades.ts'
import {
  costeSiguiente,
  derivarAllocation,
  derivarMultiplicadores,
  disponibilidad,
} from '../src/sim/allocation.ts'
import { aplicarMejoras, comprar, desbloquearReparto } from '../src/sim/shop.ts'
import { createInitialState, houseLivingCost } from '../src/sim/state.ts'

const conDinero = (ahorros: number, ideas = 100) => ({
  ...createInitialState(),
  ahorros,
  ideas,
})

describe('integridad del catalogo', () => {
  it('los ids son unicos', () => {
    const ids = UPGRADES.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ninguna mejora delega el trabajo en otra persona', () => {
    // La regla dura del proyecto: el creador trabaja solo. Este test es lo que
    // impide que se cuele un "contrata un editor" en una tanda futura.
    const prohibidas = /\b(editor|editora|equipo|contrat|community manager|becari|ayudante|manager)/i
    for (const u of UPGRADES) {
      const texto = `${u.nombre} ${u.descripcion}`
      expect(prohibidas.test(texto), `"${u.nombre}" delega trabajo`).toBe(false)
    }
  })

  it('todas tienen maximo y escala coherentes', () => {
    for (const u of UPGRADES) {
      expect(u.maximo, u.id).toBeGreaterThanOrEqual(1)
      expect(u.escala, u.id).toBeGreaterThanOrEqual(1)
      expect(u.coste, u.id).toBeGreaterThanOrEqual(0)
      // Una mejora repetible con escala 1 seria dinero infinito por nada.
      if (u.maximo > 1) expect(u.escala, `${u.id} es repetible y no encarece`).toBeGreaterThan(1)
    }
  })

  it('las mejoras de casa suben el coste de vida', () => {
    // Es la tension del tramo final: profesionalizarse aleja el retiro.
    const casas = UPGRADES.filter((u) => u.efecto.subeCasa)
    expect(casas.length).toBeGreaterThan(0)
    expect(houseLivingCost(casas.length)).toBeGreaterThan(houseLivingCost(0))
  })
})

describe('el reparto derivado de las mejoras', () => {
  it('siempre suma 1', () => {
    const casos: Record<string, number>[] = [{}, { dormir: 1 }, { micro: 1, cocinar: 1, leer: 3 }]
    for (const owned of casos) {
      const a = derivarAllocation(owned)
      expect(a.produccion + a.comunidad + a.vida + a.descanso).toBeCloseTo(1, 10)
    }
  })

  it('comprar rutina de descanso quita horas de produccion', () => {
    const antes = derivarAllocation({})
    const despues = derivarAllocation({ dormir: 1 })
    expect(despues.descanso).toBeGreaterThan(antes.descanso)
    expect(despues.produccion).toBeLessThan(antes.produccion)
  })

  it('los formatos de fidelizacion desplazan tiempo hacia la comunidad', () => {
    const antes = derivarAllocation({})
    const despues = derivarAllocation({ club: 1 })
    expect(despues.comunidad).toBeGreaterThan(antes.comunidad)
  })
})

describe('multiplicadores', () => {
  it('sin nada comprado son neutros', () => {
    expect(derivarMultiplicadores({})).toEqual({
      eficiencia: 1,
      calidad: 1,
      alcance: 1,
      casa: 0,
    })
  })

  it('se acumulan por nivel', () => {
    const uno = derivarMultiplicadores({ plantillas: 1 }).eficiencia
    const tres = derivarMultiplicadores({ plantillas: 3 }).eficiencia
    expect(tres).toBeCloseTo(Math.pow(uno, 3), 8)
  })

  it('un id desconocido se ignora en vez de romper', () => {
    // Puede pasar al cargar una partida de una version con mejoras retiradas.
    expect(() => derivarMultiplicadores({ mejora_que_ya_no_existe: 4 })).not.toThrow()
    expect(derivarMultiplicadores({ mejora_que_ya_no_existe: 4 }).eficiencia).toBe(1)
  })
})

describe('coste', () => {
  it('el primer nivel cuesta el precio base', () => {
    const pc = UPGRADES_POR_ID.get('pc')
    expect(pc && costeSiguiente(pc, 0)).toBe(pc?.coste)
  })

  it('cada nivel encarece', () => {
    const pc = UPGRADES_POR_ID.get('pc')
    expect(pc).toBeDefined()
    if (pc) expect(costeSiguiente(pc, 3)).toBeGreaterThan(costeSiguiente(pc, 0))
  })
})

describe('comprar', () => {
  it('cobra y sube el nivel', () => {
    const s = comprar(conDinero(1000), 'micro')
    expect(s.owned['micro']).toBe(1)
    expect(s.ahorros).toBeLessThan(1000)
    expect(s.multCalidad).toBeGreaterThan(1)
  })

  it('sin dinero no compra ni cobra', () => {
    const antes = conDinero(1)
    expect(comprar(antes, 'pc')).toBe(antes)
  })

  it('no se pasa del maximo', () => {
    let s = conDinero(100_000)
    for (let i = 0; i < 5; i++) s = comprar(s, 'micro')
    expect(s.owned['micro']).toBe(1)
  })

  it('los formatos cuestan ideas', () => {
    const sinIdeas = comprar(conDinero(10_000, 0), 'nicho')
    expect(sinIdeas.owned['nicho']).toBeUndefined()

    const conIdeas = comprar(conDinero(10_000, 50), 'nicho')
    expect(conIdeas.owned['nicho']).toBe(1)
    expect(conIdeas.ideas).toBeLessThan(50)
  })

  it('respeta el ciclo minimo', () => {
    const s = conDinero(100_000)
    expect(comprar(s, 'biblioteca').owned['biblioteca']).toBeUndefined()
    expect(comprar({ ...s, cycle: 3 }, 'biblioteca').owned['biblioteca']).toBe(1)
  })

  it('un id inexistente no rompe nada', () => {
    const antes = conDinero(1000)
    expect(comprar(antes, 'no_existe')).toBe(antes)
  })

  it('comprar casa sube el coste de vida', () => {
    const s = comprar({ ...conDinero(100_000), cycle: 2 }, 'piso')
    expect(s.houseStage).toBe(1)
    expect(houseLivingCost(s.houseStage)).toBeGreaterThan(houseLivingCost(0))
  })
})

describe('el hibrido: una representacion, dos interfaces', () => {
  it('mientras esta bloqueado, comprar mueve el reparto', () => {
    const antes = conDinero(1000)
    const despues = comprar(antes, 'dormir')
    expect(despues.allocation).not.toEqual(antes.allocation)
  })

  it('una vez desbloqueado, comprar ya NO pisa el reparto del jugador', () => {
    // Es la garantia de que el ciclo 3 no le arrebata el control al jugador.
    let s = desbloquearReparto(conDinero(10_000))
    s = { ...s, allocation: { produccion: 0.1, comunidad: 0.1, vida: 0.4, descanso: 0.4 } }
    const elegido = s.allocation
    s = comprar(s, 'micro')
    expect(s.allocation).toEqual(elegido)
  })

  it('desbloquear arranca con el reparto que ya tenia, no de cero', () => {
    const s = comprar(conDinero(1000), 'cocinar')
    expect(desbloquearReparto(s).allocation).toEqual(s.allocation)
  })

  it('desbloquear dos veces no cambia nada', () => {
    const s = desbloquearReparto(conDinero(100))
    expect(desbloquearReparto(s)).toBe(s)
  })
})

describe('aplicarMejoras', () => {
  it('reconstruye los derivados desde owned', () => {
    // Simula una partida guardada con derivados corruptos.
    const roto = { ...createInitialState(), owned: { micro: 1, pc: 2 }, multCalidad: 999 }
    const s = aplicarMejoras(roto, false)
    expect(s.multCalidad).toBeCloseTo(derivarMultiplicadores(roto.owned).calidad, 8)
  })
})

describe('disponibilidad', () => {
  it('explica por que no se puede comprar', () => {
    const up = UPGRADES_POR_ID.get('pc')
    expect(up).toBeDefined()
    if (!up) return
    expect(disponibilidad(up, {}, 1, 0, 0).motivo).toBe('dinero')
    expect(disponibilidad(up, { pc: 4 }, 1, 1e9, 1e9).motivo).toBe('agotada')
    expect(disponibilidad(up, {}, 1, 1e9, 1e9).motivo).toBe(null)
  })
})
