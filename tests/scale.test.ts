import { describe, expect, it } from 'vitest'
import { VIRTUAL_H, VIRTUAL_W, integerScale, scaledSize } from '../src/ui/theme/scale.ts'

describe('escalado por enteros', () => {
  it('a resolucion exacta da el factor exacto', () => {
    expect(integerScale(VIRTUAL_W * 3, VIRTUAL_H * 3)).toBe(3)
  })

  it('nunca escala en fracciones: 2.9x se queda en 2x', () => {
    expect(integerScale(VIRTUAL_W * 2.9, VIRTUAL_H * 2.9)).toBe(2)
  })

  it('nunca baja de 1, aunque la ventana sea diminuta', () => {
    expect(integerScale(100, 50)).toBe(1)
  })

  it('se ajusta al eje mas estrecho', () => {
    expect(integerScale(VIRTUAL_W * 4, VIRTUAL_H * 2)).toBe(2)
  })

  it('el tamano resultante es siempre multiplo entero del virtual', () => {
    for (const s of [1, 2, 3, 4]) {
      const { width, height } = scaledSize(s)
      expect(width % VIRTUAL_W).toBe(0)
      expect(height % VIRTUAL_H).toBe(0)
    }
  })
})
