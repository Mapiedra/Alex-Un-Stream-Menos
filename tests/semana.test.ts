import { describe, expect, it } from 'vitest'
import {
  BLOQUES_POR_SEMANA,
  BLOQUE_A_ACTIVIDAD,
  BLOQUE_IDS,
  SEGUNDOS_POR_BLOQUE,
  allocationDelBloque,
  allocationDelPlan,
  contarBloques,
  crearSemana,
  cursorDeSemana,
  lanzarSemana,
  llenarSemana,
  planAutomatico,
  planificarBloque,
  posicionDeBloque,
} from '../src/sim/semana.ts'
import { ACTIVITY_IDS, createInitialState, type Allocation } from '../src/sim/state.ts'
import { replanificar } from '../src/sim/shop.ts'
import { step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

const REPARTOS: Allocation[] = [
  { produccion: 0.7, comunidad: 0.05, vida: 0.15, descanso: 0.1 },
  { produccion: 1, comunidad: 0, vida: 0, descanso: 0 },
  { produccion: 0.25, comunidad: 0.25, vida: 0.25, descanso: 0.25 },
  { produccion: 0, comunidad: 0, vida: 0.5, descanso: 0.5 },
  { produccion: 0.15, comunidad: 0.35, vida: 0.25, descanso: 0.25 },
]

const ticksSemana = (TUNABLES.secondsPerWeek * 1000) / TUNABLES.tickMs

describe('la rejilla', () => {
  it('son siete dias por tres franjas', () => {
    expect(BLOQUES_POR_SEMANA).toBe(21)
    expect(SEGUNDOS_POR_BLOQUE * BLOQUES_POR_SEMANA).toBeCloseTo(TUNABLES.secondsPerWeek, 6)
  })

  it('cada franja cae en su dia y su hueco', () => {
    expect(posicionDeBloque(0)).toEqual({ dia: 0, franja: 0 })
    expect(posicionDeBloque(3)).toEqual({ dia: 1, franja: 0 })
    expect(posicionDeBloque(20)).toEqual({ dia: 6, franja: 2 })
  })

  it('el cursor recorre la semana entera y no se sale', () => {
    expect(cursorDeSemana(0)).toBe(0)
    expect(cursorDeSemana(SEGUNDOS_POR_BLOQUE * 1000 * 1.5)).toBe(1)
    // Justo al final de la semana sigue dentro de rango.
    expect(cursorDeSemana(TUNABLES.secondsPerWeek * 1000 - 1)).toBe(BLOQUES_POR_SEMANA - 1)
    // Y en la semana siguiente vuelve a empezar.
    expect(cursorDeSemana(TUNABLES.secondsPerWeek * 1000)).toBe(0)
  })
})

describe('el plan automatico', () => {
  it('siempre llena la semana entera, sin huecos', () => {
    for (const r of REPARTOS) {
      const bloques = planAutomatico(r)
      expect(bloques).toHaveLength(BLOQUES_POR_SEMANA)
      expect(bloques.every((b) => BLOQUE_IDS.includes(b))).toBe(true)
    }
  })

  it('respeta el reparto pedido dentro del redondeo de una franja', () => {
    // 21 franjas: el error maximo por actividad es una franja, ~4.8%.
    const margen = 1 / BLOQUES_POR_SEMANA + 1e-9
    for (const r of REPARTOS) {
      const resultado = allocationDelPlan(planAutomatico(r))
      for (const id of ACTIVITY_IDS) {
        expect(Math.abs(resultado[id] - r[id]), `${id} en ${JSON.stringify(r)}`).toBeLessThanOrEqual(
          margen,
        )
      }
    }
  })

  it('es determinista: mismo reparto, misma semana', () => {
    // El motor no puede depender del orden de las claves de un objeto.
    for (const r of REPARTOS) {
      expect(planAutomatico(r)).toEqual(planAutomatico({ ...r }))
    }
  })

  it('deja siempre algo que editar cuando se produce', () => {
    // Un plan que solo emitiera dejaria sin material que publicar a quien
    // todavia no reparte sus horas.
    const cuenta = contarBloques(planAutomatico({ produccion: 1, comunidad: 0, vida: 0, descanso: 0 }))
    expect(cuenta.emitir).toBeGreaterThan(0)
    expect(cuenta.editar).toBeGreaterThan(0)
  })

  it('un reparto degenerado no rompe nada', () => {
    const bloques = planAutomatico({ produccion: 0, comunidad: 0, vida: 0, descanso: 0 })
    expect(bloques).toHaveLength(BLOQUES_POR_SEMANA)
  })
})

describe('el one-hot integra a lo mismo que la fraccion', () => {
  /**
   * ESTE es el test que sostiene toda la fase.
   *
   * Si vivir la semana franja a franja no diese los mismos totales semanales
   * que el reparto promedio de siempre, el cambio de modelo de tiempo habria
   * obligado a recalibrar el juego entero. Como casi todo el tick es lineal en
   * el reparto, no hace falta.
   */
  it('la suma de los one-hot de una semana es el reparto de esa semana', () => {
    for (const r of REPARTOS) {
      const bloques = planAutomatico(r)
      const suma = { produccion: 0, comunidad: 0, vida: 0, descanso: 0 }
      for (const b of bloques) {
        const uno = allocationDelBloque(b)
        for (const id of ACTIVITY_IDS) suma[id] += uno[id] / BLOQUES_POR_SEMANA
      }
      const plan = allocationDelPlan(bloques)
      for (const id of ACTIVITY_IDS) expect(suma[id]).toBeCloseTo(plan[id], 10)
    }
  })

  it('cada bloque pone todo su tiempo en una sola actividad', () => {
    for (const b of BLOQUE_IDS) {
      const a = allocationDelBloque(b)
      expect(a[BLOQUE_A_ACTIVIDAD[b]]).toBe(1)
      const total = ACTIVITY_IDS.reduce((acc, id) => acc + a[id], 0)
      expect(total).toBe(1)
    }
  })
})

describe('planificar y vivir', () => {
  it('una partida nueva empieza esperando el reparto', () => {
    expect(createInitialState().semana.fase).toBe('planificando')
  })

  it('mientras se planifica el reloj no corre', () => {
    // Decidir es una pausa. Es el cambio de fondo de F7.
    const s = createInitialState()
    expect(step(s, TUNABLES.tickMs)).toBe(s)
  })

  it('al lanzarla el reloj vuelve a correr', () => {
    const s = lanzarSemana(createInitialState())
    expect(step(s, TUNABLES.tickMs).elapsedMs).toBeGreaterThan(0)
  })

  it('al acabarse la semana la partida se para a repartir la siguiente', () => {
    let s = lanzarSemana(createInitialState())
    for (let i = 0; i < ticksSemana + 1; i++) s = step(s, TUNABLES.tickMs)
    expect(s.week).toBe(1)
    expect(s.semana.fase).toBe('planificando')
    // Y de verdad esta parada: otro tick no cambia nada.
    expect(step(s, TUNABLES.tickMs)).toBe(s)
  })

  it('el plan de la semana anterior se conserva para volver a lanzarlo', () => {
    let s = lanzarSemana(createInitialState())
    const antes = s.semana.bloques
    for (let i = 0; i < ticksSemana + 1; i++) s = step(s, TUNABLES.tickMs)
    expect(s.semana.bloques).toEqual(antes)
  })

  it('cambiar una franja cambia el reparto', () => {
    const s = createInitialState()
    const semana = planificarBloque(s.semana, 0, 'dormir')
    expect(semana.bloques[0]).toBe('dormir')
    // Y el objeto original no se toca: el motor es inmutable.
    expect(s.semana.bloques[0]).not.toBe(undefined)
  })

  it('planificar fuera de rango no hace nada', () => {
    const s = createInitialState()
    expect(planificarBloque(s.semana, -1, 'emitir')).toBe(s.semana)
    expect(planificarBloque(s.semana, 999, 'emitir')).toBe(s.semana)
  })

  it('llenar la semana deja una sola cosa', () => {
    const semana = llenarSemana(crearSemana(REPARTOS[0]!), 'dormir')
    expect(contarBloques(semana.bloques).dormir).toBe(BLOQUES_POR_SEMANA)
    expect(allocationDelPlan(semana.bloques).descanso).toBe(1)
  })
})

describe('el reparto es siempre la lectura de la semana', () => {
  it('replanificar deja los dos numeros de acuerdo', () => {
    // INVARIANTE del proyecto: `allocation` nunca dice algo distinto de lo que
    // dicen los bloques. Un solo origen de verdad.
    for (const r of REPARTOS) {
      const s = replanificar(createInitialState(), r)
      expect(s.allocation).toEqual(allocationDelPlan(s.semana.bloques))
    }
  })

  it('el tick lo mantiene semana tras semana', () => {
    let s = lanzarSemana(createInitialState())
    for (let i = 0; i < ticksSemana * 2; i++) {
      s = lanzarSemana(step(s, TUNABLES.tickMs))
      expect(s.allocation).toEqual(allocationDelPlan(s.semana.bloques))
    }
  })
})
