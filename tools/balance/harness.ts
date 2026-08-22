import { createInitialState, houseLivingCost, type GameState } from '../../src/sim/state.ts'
import { publicar, step } from '../../src/sim/tick.ts'
import { TUNABLES } from '../../src/sim/tunables.ts'
import { calcResidualTotal } from '../../src/sim/formulas.ts'
import type { Bot } from './bots.ts'

export interface RunResult {
  botId: string
  /** Minuto de simulacion en que alcanza el umbral de retiro. null si no. */
  retiroEnMinuto: number | null
  minutosSimulados: number
  alcanceFinal: number
  comunidadFinal: number
  calidadFinal: number
  fatigaMaxima: number
  ahorrosFinal: number
  /** Coste de vida cubierto por rentas, al final. 1 = justo cubierto. */
  coberturaFinal: number
  /** Serie temporal para comparar bots minuto a minuto. */
  muestras: Array<{ minuto: number; alcance: number; comunidad: number; cobertura: number }>
}

/**
 * Cobertura del retiro: cuanto del coste de vida cubren las rentas pasivas.
 *
 *   (residuales del catalogo + rendimiento de los ahorros) / coste de vida
 *
 * Llegar a 1 es poder dejar de producir sin que las cuentas se hundan.
 */
export function calcCobertura(s: GameState): number {
  const residual = calcResidualTotal(s)
  const rendimiento = (s.ahorros * TUNABLES.economia.savingsYield) / (52 * TUNABLES.secondsPerWeek)
  const costeVida = houseLivingCost(s.houseStage) / TUNABLES.secondsPerWeek
  return costeVida > 0 ? (residual + rendimiento) / costeVida : 0
}

export function runBot(bot: Bot, opts: { maxMinutes?: number; seed?: number } = {}): RunResult {
  const maxMinutes = opts.maxMinutes ?? 240
  let s = createInitialState(opts.seed ?? 1)

  const dt = TUNABLES.tickMs
  const maxTicks = (maxMinutes * 60 * 1000) / dt

  let fatigaMaxima = 0
  let retiroEnMinuto: number | null = null
  const muestras: RunResult['muestras'] = []
  let proximaMuestra = 0

  for (let i = 0; i < maxTicks; i++) {
    s = { ...s, allocation: bot.allocation(s) }
    if (bot.publish(s)) s = publicar(s)
    s = step(s, dt)

    if (s.fatiga > fatigaMaxima) fatigaMaxima = s.fatiga

    const minuto = s.elapsedMs / 60000
    if (minuto >= proximaMuestra) {
      muestras.push({
        minuto: Math.round(minuto),
        alcance: s.alcance,
        comunidad: s.comunidad,
        cobertura: calcCobertura(s),
      })
      proximaMuestra += 5
    }

    // No se corta al retirarse: se sigue simulando para que las curvas de
    // todos los bots sean comparables minuto a minuto.
    if (retiroEnMinuto === null && calcCobertura(s) >= 1) {
      retiroEnMinuto = minuto
    }
  }

  return {
    botId: bot.id,
    retiroEnMinuto,
    minutosSimulados: s.elapsedMs / 60000,
    alcanceFinal: s.alcance,
    comunidadFinal: s.comunidad,
    calidadFinal: s.calidad,
    fatigaMaxima,
    ahorrosFinal: s.ahorros,
    coberturaFinal: calcCobertura(s),
    muestras,
  }
}
