import { describe, expect, it } from 'vitest'
import {
  MONEDA_CATEGORIA,
  UPGRADES,
  UPGRADES_POR_ID,
  VIDA_MINIMA_PARA_RUTINA,
  escalon,
  type Categoria,
} from '../src/content/upgrades.ts'
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

/** Bolsillos de referencia para los tests de disponibilidad. */
const SIN_NADA = { ahorros: 0, ideas: 0, material: 0, vida: 1 }
const DE_SOBRA = { ahorros: 1e9, ideas: 1e9, material: 1e9, vida: 1 }

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

/**
 * UNA MONEDA POR CATEGORIA.
 *
 * El contrato que fija F8: nada sale gratis, y lo que cuesta cada cosa dice
 * que clase de cosa es. Antes habia cuatro mejoras a coste cero que se
 * compraban sin pensar; ahora todas piden algo y hay que decidir.
 */
describe('nada sale gratis', () => {
  it('toda mejora cuesta algo en alguna moneda', () => {
    for (const u of UPGRADES) {
      const total = u.coste + (u.costeIdeas ?? 0) + (u.costeMaterial ?? 0) + (u.costeVida ?? 0)
      expect(total, `"${u.nombre}" no cuesta nada`).toBeGreaterThan(0)
    }
  })

  it('cada categoria cobra en su moneda', () => {
    const moneda: Record<Categoria, (u: (typeof UPGRADES)[number]) => number> = {
      setup: (u) => u.coste,
      casa: (u) => u.coste,
      flujo: (u) => u.costeMaterial ?? 0,
      rutina: (u) => u.costeVida ?? 0,
      formato: (u) => u.costeIdeas ?? 0,
    }
    for (const u of UPGRADES) {
      expect(moneda[u.categoria](u), `"${u.nombre}" no cobra en la moneda de su categoria`)
        .toBeGreaterThan(0)
    }
  })

  it('la tienda explica en que se paga cada categoria', () => {
    for (const c of Object.keys(MONEDA_CATEGORIA) as Categoria[]) {
      expect(MONEDA_CATEGORIA[c].length, c).toBeGreaterThan(30)
    }
  })

  it('lo que cuesta la vida se puede recuperar', () => {
    // Si una rutina costase media vida seria una trampa, no una inversion:
    // el GDD pide que parar y cuidarse sea siempre razonable.
    for (const u of UPGRADES) {
      expect(u.costeVida ?? 0, u.id).toBeLessThanOrEqual(0.15)
    }
  })

  it('lo que cuesta el material cabe en unas pocas semanas de editar', () => {
    const total = UPGRADES.reduce((acc, u) => acc + (u.costeMaterial ?? 0) * u.maximo, 0)
    // Montarse el flujo entero no puede costar mas videos de los que se sacan
    // en un trimestre, o dejaria el catalogo sin arrancar.
    expect(total).toBeLessThan(15)
    expect(total).toBeGreaterThan(2)
  })

  it('toda mejora devuelve algo por lo que cuesta', () => {
    // Las de automatizacion no tienen `efecto` porque actuan por `owned`: el
    // motor las consulta en publicarAutomatico. Van listadas para que anadir
    // una mejora vacia por descuido siga fallando aqui.
    const porOwned = new Set(['avisos', 'calendario', 'programacion'])
    for (const u of UPGRADES) {
      if (porOwned.has(u.id)) continue
      expect(Object.keys(u.efecto).length, `"${u.nombre}" no da nada a cambio`).toBeGreaterThan(0)
    }
  })
})

describe('los peldaños', () => {
  it('hay tantos como niveles cuando se declaran', () => {
    for (const u of UPGRADES) {
      if (!u.escalones) continue
      expect(u.escalones.length, u.id).toBe(u.maximo)
    }
  })

  it('cada peldaño tiene nombre propio y frase', () => {
    // Es lo que separa una progresion de pulsar el mismo boton cuatro veces.
    for (const u of UPGRADES) {
      for (const e of u.escalones ?? []) {
        expect(e.nombre.length, u.id).toBeGreaterThan(3)
        expect(e.descripcion.length, u.id).toBeGreaterThan(20)
      }
    }
  })

  it('la tienda pide el peldaño que toca, no el que ya tienes', () => {
    const micro = UPGRADES_POR_ID.get('micro')!
    expect(escalon(micro, 0)).toBe(micro.escalones?.[0])
    expect(escalon(micro, 1)).toBe(micro.escalones?.[1])
    expect(escalon(micro, micro.maximo)).toBeNull()
  })

  it('la mayoria del equipo tiene varios peldaños', () => {
    const setup = UPGRADES.filter((u) => u.categoria === 'setup')
    expect(setup.filter((u) => u.maximo > 1).length).toBe(setup.length)
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
    // El micro tiene tres peldaños desde F8: se compra hasta arriba y ni uno mas.
    const up = UPGRADES_POR_ID.get('micro')!
    let s = conDinero(1_000_000)
    for (let i = 0; i < up.maximo + 4; i++) s = comprar(s, 'micro')
    expect(s.owned['micro']).toBe(up.maximo)
  })

  it('el flujo cuesta material y lo cobra', () => {
    const sinMaterial = { ...conDinero(10_000), material: 0 }
    expect(comprar(sinMaterial, 'plantillas').owned['plantillas']).toBeUndefined()

    const conMaterial = { ...conDinero(10_000), material: 5 }
    const s = comprar(conMaterial, 'plantillas')
    expect(s.owned['plantillas']).toBe(1)
    expect(s.material).toBeLessThan(5)
  })

  it('la rutina cuesta vida y la cobra', () => {
    const s = comprar({ ...conDinero(10_000), vida: 0.9 }, 'dormir')
    expect(s.owned['dormir']).toBe(1)
    expect(s.vida).toBeLessThan(0.9)
  })

  it('no se puede reorganizar la vida estando hecho polvo', () => {
    /**
     * La otra mitad de lo que quiere decir la categoria: cambiar de habitos no
     * cuesta dinero, cuesta poder. Quien esta al limite no puede permitirselo,
     * y eso convierte descansar en el paso previo a mejorar.
     */
    const roto = { ...conDinero(10_000), vida: VIDA_MINIMA_PARA_RUTINA + 0.01 }
    expect(comprar(roto, 'dormir')).toBe(roto)

    const descansado = { ...roto, vida: 0.8 }
    expect(comprar(descansado, 'dormir').owned['dormir']).toBe(1)
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
    expect(disponibilidad(up, {}, 1, SIN_NADA).motivo).toBe('dinero')
    expect(disponibilidad(up, { pc: 4 }, 1, DE_SOBRA).motivo).toBe('agotada')
    expect(disponibilidad(up, {}, 1, DE_SOBRA).motivo).toBe(null)
  })
})
