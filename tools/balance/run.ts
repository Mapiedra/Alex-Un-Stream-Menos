import { BOTS } from './bots.ts'
import { runBot } from './harness.ts'

/**
 * Banco de balance. `npm run balance`
 *
 * Juega la partida completa con cada politica, sin UI y a velocidad libre, y
 * reporta cuando se retira cada una. Sin esto, cuadrar el ritmo de una partida
 * de dos horas cuesta semanas de partidas manuales.
 */
const results = BOTS.map((bot) => runBot(bot, { maxMinutes: 240 }))

const pad = (s: string, n: number) => s.padEnd(n)
const num = (n: number, d = 0) => n.toFixed(d).padStart(9)

console.log('\n  BANCO DE BALANCE — minuto de retiro por politica\n')
console.log(
  `  ${pad('bot', 14)}${pad('retiro', 10)}${pad('cobertura', 11)}${pad('comunidad', 11)}${pad('calidad', 9)}fatiga max`,
)
console.log('  ' + '-'.repeat(70))

for (const r of results) {
  const retiro = r.retiroEnMinuto === null ? '  —' : `${r.retiroEnMinuto.toFixed(0)} min`
  console.log(
    `  ${pad(r.botId, 14)}${pad(retiro, 10)}${num(r.coberturaFinal, 2)}  ${num(r.comunidadFinal, 0)}  ${num(r.calidadFinal, 2)}  ${num(r.fatigaMaxima, 2)}`,
  )
}

console.log('\n  Comparativa de alcance por minuto (grind vs equilibrado)\n')
const grind = results.find((r) => r.botId === 'grind')
const eq = results.find((r) => r.botId === 'equilibrado')
if (grind && eq) {
  console.log(`  ${pad('min', 7)}${pad('grind', 12)}equilibrado`)
  for (let i = 0; i < Math.max(grind.muestras.length, eq.muestras.length); i += 2) {
    const g = grind.muestras[i]
    const e = eq.muestras[i]
    if (!g && !e) continue
    const minuto = g?.minuto ?? e?.minuto ?? 0
    console.log(
      `  ${pad(String(minuto), 7)}${pad((g?.alcance ?? 0).toFixed(0), 12)}${(e?.alcance ?? 0).toFixed(0)}`,
    )
  }
}
console.log('')
