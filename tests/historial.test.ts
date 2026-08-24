import { describe, expect, it } from 'vitest'
import { lanzarSemana } from '../src/sim/semana.ts'
import { replanificar } from '../src/sim/shop.ts'
import {
  INTERVALO_S,
  MUESTRAS,
  crearHistorial,
  muestrear,
  normalizar,
  tendencia,
} from '../src/sim/historial.ts'
import { createInitialState } from '../src/sim/state.ts'
import { cambiarFormato, step } from '../src/sim/tick.ts'
import { resolver } from '../src/sim/lifeEvents.ts'
import { TUNABLES } from '../src/sim/tunables.ts'
import type { GameState } from '../src/sim/state.ts'

/**
 * Avanza la simulacion contestando las tarjetas de vida.
 *
 * Sin esto la partida se congela en la primera tarjeta: es el comportamiento
 * correcto del juego —leer no consume partida— pero en un test hay que hacer
 * el papel del jugador que contesta.
 */
function avanzar(s: GameState, ticks: number): GameState {
  let actual = s
  for (let i = 0; i < ticks; i++) {
    if (actual.eventoPendiente) actual = resolver(actual, actual.eventoPendiente, 0)
    // Al acabarse la semana la partida se para a esperar el reparto de la
    // siguiente. Aqui se relanza con el mismo plan: el test mide las curvas,
    // no la pausa.
    actual = step(lanzarSemana(actual), TUNABLES.tickMs)
  }
  return actual
}

describe('muestreo', () => {
  it('no toma muestra antes de tiempo', () => {
    const h = muestrear(crearHistorial(), 100, 50, INTERVALO_S / 2)
    expect(h.alcance).toHaveLength(0)
  })

  it('toma una muestra al cumplirse el intervalo', () => {
    const h = muestrear(crearHistorial(), 100, 50, INTERVALO_S)
    expect(h.alcance).toEqual([100])
    expect(h.comunidad).toEqual([50])
  })

  it('el buffer no crece sin limite', () => {
    let h = crearHistorial()
    for (let i = 0; i < MUESTRAS * 3; i++) h = muestrear(h, i, i, INTERVALO_S)
    expect(h.alcance).toHaveLength(MUESTRAS)
    expect(h.comunidad).toHaveLength(MUESTRAS)
  })

  it('conserva las muestras mas recientes, no las primeras', () => {
    let h = crearHistorial()
    for (let i = 0; i < MUESTRAS + 5; i++) h = muestrear(h, i, 0, INTERVALO_S)
    expect(h.alcance[h.alcance.length - 1]).toBe(MUESTRAS + 4)
    expect(h.alcance[0]).toBe(5)
  })

  it('devuelve el mismo array si no toca muestrear', () => {
    // Evita que React repinte las graficas diez veces por segundo sin motivo.
    const h = crearHistorial()
    const siguiente = muestrear(h, 1, 1, 0.01)
    expect(siguiente.alcance).toBe(h.alcance)
    expect(siguiente.comunidad).toBe(h.comunidad)
  })
})

describe('normalizar', () => {
  it('una serie vacia no rompe', () => {
    expect(normalizar([])).toEqual([])
  })

  it('todo ceros no divide por cero', () => {
    expect(normalizar([0, 0, 0])).toEqual([0, 0, 0])
  })

  it('el maximo se mapea a 1', () => {
    expect(normalizar([5, 10, 2])).toEqual([0.5, 1, 0.2])
  })

  it('cada serie usa su propia escala', () => {
    // Es deliberado: interesa comparar FORMAS, no magnitudes. La comunidad
    // siempre sera mucho menor que el alcance y aun asi hay que verla.
    expect(normalizar([1, 2])).toEqual(normalizar([1000, 2000]))
  })
})

describe('tendencia', () => {
  it('detecta subida y bajada', () => {
    expect(tendencia([1, 2, 3, 4])).toBeGreaterThan(0)
    expect(tendencia([4, 3, 2, 1])).toBeLessThan(0)
  })

  it('una serie plana no tiene tendencia', () => {
    expect(tendencia([7, 7, 7, 7])).toBe(0)
  })

  it('una serie de un solo punto no tiene tendencia', () => {
    expect(tendencia([3])).toBe(0)
  })

  it('partir de cero cuenta como subida', () => {
    expect(tendencia([0, 0, 5])).toBe(1)
  })
})

describe('la tesis del juego, medida en las curvas', () => {
  it('al dejar de producir, el alcance cae y la comunidad no', () => {
    /**
     * Este es EL test del diseno. Si algun dia deja de pasar, el juego ya no
     * dice lo que el GDD queria que dijese: que las visitas se van y la gente
     * que te sigue por ti se queda.
     */
    let s = cambiarFormato(createInitialState(11), 'popular')
    // Fase 1: producir a tope hasta tener alcance y algo de comunidad.
    s = replanificar(s, { produccion: 0.8, comunidad: 0.2, vida: 0, descanso: 0 })
    s = avanzar(s, 4000)

    const alcancePico = s.alcance
    const comunidadPico = s.comunidad
    expect(alcancePico).toBeGreaterThan(0)
    expect(comunidadPico).toBeGreaterThan(0)

    // Fase 2: parar del todo.
    s = replanificar(s, { produccion: 0, comunidad: 0, vida: 0.5, descanso: 0.5 })
    s = avanzar(s, 3000)

    const caidaAlcance = 1 - s.alcance / alcancePico
    const caidaComunidad = 1 - s.comunidad / comunidadPico

    expect(caidaAlcance, 'el alcance deberia desplomarse al parar').toBeGreaterThan(0.5)
    expect(caidaComunidad, 'la comunidad deberia aguantar').toBeLessThan(0.25)
    expect(caidaAlcance).toBeGreaterThan(caidaComunidad)
  })

  it('la partida acumula curva sin desbordar el estado', () => {
    const s = avanzar(createInitialState(), 6000)
    expect(s.historial.alcance.length).toBeGreaterThan(1)
    expect(s.historial.alcance.length).toBeLessThanOrEqual(MUESTRAS)
  })
})
