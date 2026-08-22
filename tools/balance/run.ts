import { BOTS } from './bots.ts'
import { cruceSostenido, runBot } from './harness.ts'

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
  `  ${pad('bot', 14)}${pad('retiro', 10)}${pad('cobertura', 11)}${pad('comunidad', 11)}${pad('calidad', 9)}${pad('fatiga', 9)}${pad('compras', 9)}vac/burn/ev`,
)
console.log('  ' + '-'.repeat(84))

for (const r of results) {
  const retiro = r.retiroEnMinuto === null ? '  —' : `${r.retiroEnMinuto.toFixed(0)} min`
  console.log(
    `  ${pad(r.botId, 14)}${pad(retiro, 10)}${num(r.coberturaFinal, 2)}  ${num(r.comunidadFinal, 0)}  ${num(r.calidadFinal, 2)}  ${num(r.fatigaMaxima, 2)}  ${String(r.compras).padStart(5)}    ${r.vacaciones}/${r.burnouts}/${r.eventos}`,
  )
}

/**
 * Ritmo de la partida, no solo su final.
 *
 * La regla 2 de la seccion 12 del GDD no habla de quien gana: habla de QUIEN
 * VA POR DELANTE Y CUANDO. "El streaming intenso debe ganar a corto plazo y
 * perder frente a una estrategia equilibrada a medio plazo." Eso solo se ve
 * mirando la curva minuto a minuto, y por eso el resumen de arriba nunca
 * pudo detectar que esa regla llevaba sin cumplirse desde el primer dia.
 */
console.log('\n  RITMO — quien va por delante en alcance\n')

const grind = results.find((r) => r.botId === 'grind')
const eq = results.find((r) => r.botId === 'equilibrado')

if (grind && eq) {
  console.log(`  ${pad('min', 7)}${pad('grind', 12)}${pad('equilibrado', 14)}lider`)
  console.log('  ' + '-'.repeat(48))

  const cruceAlcance = cruceSostenido(grind, eq, 'alcance')
  const cruceComunidad = cruceSostenido(grind, eq, 'comunidad')

  for (let i = 0; i < Math.min(grind.muestras.length, 16); i++) {
    const g = grind.muestras[i]
    const e = eq.muestras[i]
    if (!g || !e) continue

    const lider = g.alcance > e.alcance ? 'grind' : 'equilibrado'

    console.log(
      `  ${pad(String(g.minuto), 7)}${pad(g.alcance.toFixed(0), 12)}${pad(e.alcance.toFixed(0), 14)}${lider}`,
    )
  }

  /**
   * Dos curvas, dos lecturas.
   *
   * En ALCANCE el grind puede ir por delante media partida: es lo que
   * optimiza y se le da bien. En COMUNIDAD lo pierde pronto y ya no lo
   * recupera. Y al final no se retira nunca.
   *
   * Esa es la regla 2 del GDD bien entendida: forzar horas funciona para la
   * metrica que se ve, y aun asi pierde la partida. No hacia falta que el
   * grind cayera tambien en visitas; hacia falta que las visitas no bastaran.
   */
  console.log('')
  console.log(
    `  Alcance   — el equilibrado adelanta en el minuto ${cruceAlcance ?? '—'} (o nunca)`,
  )
  console.log(`  Comunidad — el equilibrado adelanta en el minuto ${cruceComunidad ?? '—'}`)
  console.log(
    `  Retiro    — grind: ${grind.retiroEnMinuto ?? 'nunca'} · equilibrado: ${eq.retiroEnMinuto ?? 'nunca'}`,
  )
}

console.log('')
