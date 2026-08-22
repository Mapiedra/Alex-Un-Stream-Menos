import { describe, expect, it } from 'vitest'
import { clipCatch, clipMultiplier, clipStep, createClipState } from '../src/sim/clip.ts'
import { createRng } from '../src/sim/rng.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

const avanzar = (ms: number, seed = 1) => {
  let c = createClipState()
  let rng = createRng(seed)
  const paso = 100
  const historia: boolean[] = []
  for (let t = 0; t < ms; t += paso) {
    const r = clipStep(c, rng, paso)
    c = r.clip
    rng = r.rng
    historia.push(c.activo)
  }
  return { clip: c, rng, historia }
}

describe('contrato de accesibilidad del momento clippeable', () => {
  /**
   * Estas cuatro reglas no son balance: son el contrato del GDD (6.1). Si
   * alguna se rompe, el juego pide clic sostenido y deja fuera a quien no
   * puede hacerlo.
   */

  it('la ventana de reaccion nunca baja de 3 segundos', () => {
    expect(TUNABLES.clip.reactionWindowSeconds).toBeGreaterThanOrEqual(3)
  })

  it('nunca aparecen dos momentos con menos de 25 segundos entre medias', () => {
    expect(TUNABLES.clip.minIntervalSeconds).toBeGreaterThanOrEqual(25)

    const { historia } = avanzar(10 * 60 * 1000)
    let ultimoFin = -Infinity
    let previo = false
    for (let i = 0; i < historia.length; i++) {
      const activo = historia[i] === true
      if (previo && !activo) ultimoFin = i
      if (!previo && activo && ultimoFin > -Infinity) {
        const huecoMs = (i - ultimoFin) * 100
        expect(huecoMs).toBeGreaterThanOrEqual(TUNABLES.clip.minIntervalSeconds * 1000 - 100)
      }
      previo = activo
    }
  })

  it('fallarlo no cuesta progreso: solo se pierde el bonus', () => {
    const { clip } = avanzar(5 * 60 * 1000)
    expect(clip.perdidos).toBeGreaterThan(0)
    // No existe ninguna penalizacion que registrar. Si algun dia aparece un
    // campo de castigo por fallo, este test es el que debe impedirlo.
    expect(clipMultiplier(clip)).toBe(1)
  })

  it('sin momento activo, pulsar no hace nada', () => {
    const c = createClipState()
    const r = clipCatch(c, createRng(1))
    expect(r.clip).toBe(c)
    expect(r.clip.acertados).toBe(0)
  })
})

describe('acertar el clip', () => {
  it('da el multiplicador durante un rato y luego se apaga', () => {
    let { clip, rng } = avanzar(60 * 1000)
    // Avanza hasta encontrar uno activo.
    let guard = 0
    while (!clip.activo && guard++ < 2000) {
      const r = clipStep(clip, rng, 100)
      clip = r.clip
      rng = r.rng
    }
    expect(clip.activo).toBe(true)

    const cogido = clipCatch(clip, rng)
    expect(cogido.clip.acertados).toBe(1)
    expect(cogido.clip.activo).toBe(false)
    expect(clipMultiplier(cogido.clip)).toBe(TUNABLES.clip.bonusMultiplier)

    // El bonus caduca.
    let c = cogido.clip
    let r2 = cogido.rng
    for (let i = 0; i < TUNABLES.clip.bonusDurationSeconds * 10 + 5; i++) {
      const r = clipStep(c, r2, 100)
      c = r.clip
      r2 = r.rng
    }
    expect(clipMultiplier(c)).toBe(1)
  })

  it('el multiplicador es un empujon, no una via alternativa de progresion', () => {
    expect(TUNABLES.clip.bonusMultiplier).toBeLessThan(2)
    expect(TUNABLES.clip.bonusDurationSeconds).toBeLessThan(TUNABLES.clip.minIntervalSeconds)
  })
})
