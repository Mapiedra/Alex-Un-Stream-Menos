import { describe, expect, it } from 'vitest'
import { FRANJAS_OBJETIVO, dependenciaDelDirecto } from '../src/sim/dependencia.ts'
import { condicionesRetiro } from '../src/sim/final.ts'
import { BLOQUES_POR_SEMANA, allocationDelPlan, type BloqueId } from '../src/sim/semana.ts'
import { createInitialState, type GameState } from '../src/sim/state.ts'

/**
 * Una semana con `emitir` franjas de directo y `editar` de montaje; el resto,
 * dormido. `allocation` se deriva del plan igual que hace el tick, que es lo
 * que permite comparar esto contra la condicion de retiro sin trampa.
 */
function conSemana(emitir: number, editar = 0): GameState {
  const bloques: BloqueId[] = Array.from({ length: BLOQUES_POR_SEMANA }, (_, i) =>
    i < emitir ? 'emitir' : i < emitir + editar ? 'editar' : 'dormir',
  )
  const base = createInitialState()
  return {
    ...base,
    semana: { ...base.semana, bloques },
    allocation: allocationDelPlan(bloques),
  }
}

describe('dependencia del directo', () => {
  it('cuenta emitir y editar por separado y sumadas', () => {
    const d = dependenciaDelDirecto(conSemana(4, 3))
    expect(d.emitir).toBe(4)
    expect(d.editar).toBe(3)
    expect(d.produccion).toBe(7)
  })

  /**
   * EL TEST QUE JUSTIFICA EL MODULO.
   *
   * El panel ensena un objetivo en franjas y el final se juega en una fraccion
   * del tiempo. Si las dos cifras se separaran, el juego estaria prometiendo
   * en la pantalla de Carrera un numero que el Retiro no acepta.
   */
  it('el objetivo en franjas es exactamente lo que acepta la condicion de horas', () => {
    const horas = (s: GameState) => condicionesRetiro(s).find((c) => c.clave === 'horas')

    expect(horas(conSemana(FRANJAS_OBJETIVO))?.cumplido).toBe(true)
    expect(horas(conSemana(FRANJAS_OBJETIVO + 1))?.cumplido).toBe(false)
  })

  it('trabajaPoco sigue al objetivo por los dos lados', () => {
    expect(dependenciaDelDirecto(conSemana(FRANJAS_OBJETIVO)).trabajaPoco).toBe(true)
    expect(dependenciaDelDirecto(conSemana(FRANJAS_OBJETIVO + 1)).trabajaPoco).toBe(false)
  })

  it('emitir y editar cuentan igual para el objetivo: los dos son producir', () => {
    const soloEmitir = dependenciaDelDirecto(conSemana(FRANJAS_OBJETIVO + 2))
    const repartido = dependenciaDelDirecto(conSemana(FRANJAS_OBJETIVO, 2))
    expect(repartido.sobran).toBe(soloEmitir.sobran)
  })

  it('las franjas que sobran nunca son negativas', () => {
    expect(dependenciaDelDirecto(conSemana(0)).sobran).toBe(0)
    expect(dependenciaDelDirecto(conSemana(FRANJAS_OBJETIVO + 5)).sobran).toBe(5)
  })

  it('una partida recien empezada no cubre su coste de vida', () => {
    const d = dependenciaDelDirecto(createInitialState())
    expect(d.cobertura).toBeLessThan(1)
    expect(d.cubierto).toBe(false)
  })

  it('el objetivo cabe en la semana y deja sitio para vivir', () => {
    expect(FRANJAS_OBJETIVO).toBeGreaterThan(0)
    expect(FRANJAS_OBJETIVO).toBeLessThan(BLOQUES_POR_SEMANA)
  })
})
