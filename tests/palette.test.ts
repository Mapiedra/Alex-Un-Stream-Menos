import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { PALETTE, TOKENS, tokensToCssVars } from '../src/ui/theme/palette.ts'

const ROOT = join(import.meta.dirname, '..')
const SRC = join(ROOT, 'src')
const PALETTE_FILE = join(SRC, 'ui', 'theme', 'palette.ts')

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const HEX = /#[0-9a-fA-F]{3,8}\b/g

describe('regla de paleta', () => {
  /**
   * La coherencia visual no puede depender de que nadie se despiste. Si este
   * test falla, alguien ha escrito un color a mano en vez de usar un token.
   */
  it('ningun hex fuera de palette.ts', () => {
    const infractores: string[] = []

    for (const file of [...walk(SRC), join(ROOT, 'index.html')]) {
      if (file === PALETTE_FILE) continue
      if (!/\.(ts|tsx|css|html)$/.test(file)) continue

      const matches = readFileSync(file, 'utf8').match(HEX)
      if (matches) infractores.push(`${relative(ROOT, file)}: ${matches.join(', ')}`)
    }

    expect(infractores, `Usa un token de TOKENS en vez del hex:\n${infractores.join('\n')}`).toEqual([])
  })

  it('todo token semantico apunta a un color real de la paleta', () => {
    const valores = new Set<string>(Object.values(PALETTE))
    for (const [name, value] of Object.entries(TOKENS)) {
      expect(valores.has(value), `El token ${name} no esta en PALETTE`).toBe(true)
    }
  })

  it('los colores de la paleta son hex de 6 digitos', () => {
    for (const [name, value] of Object.entries(PALETTE)) {
      expect(value, `${name} no es un hex valido`).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('emite una variable CSS por token', () => {
    const css = tokensToCssVars()
    for (const name of Object.keys(TOKENS)) {
      expect(css).toContain(`--c-${name}:`)
    }
  })

  it('cada recurso del juego tiene su color', () => {
    for (const r of ['alcance', 'comunidad', 'calidad', 'vida', 'hype', 'ingresos', 'ideas', 'fatiga']) {
      expect(TOKENS).toHaveProperty(r)
    }
  })
})
