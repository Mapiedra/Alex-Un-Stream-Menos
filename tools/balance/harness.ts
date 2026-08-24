import { createInitialState } from '../../src/sim/state.ts'
import {
  cobertura,
  cumpleRetiro,
  evaluarEpilogo,
  puedeRetirarse,
  type Epilogo,
} from '../../src/sim/final.ts'
import { publicar, step } from '../../src/sim/tick.ts'
import { TUNABLES } from '../../src/sim/tunables.ts'

import { siguienteCompra, type Bot } from './bots.ts'
import { comprar, replanificar } from '../../src/sim/shop.ts'
import { resolver } from '../../src/sim/lifeEvents.ts'
import { irseDeVacaciones, puedeIrseDeVacaciones } from '../../src/sim/descanso.ts'
import { prepararEvento } from '../../src/sim/bigEvents.ts'
import { aceptar, definicion, rechazar } from '../../src/sim/patrocinios.ts'

export interface RunResult {
  botId: string
  /** Minuto de simulacion en que alcanza el umbral de retiro. null si no. */
  retiroEnMinuto: number | null
  minutosSimulados: number
  alcanceFinal: number
  comunidadFinal: number
  calidadFinal: number
  fatigaMaxima: number
  vacaciones: number
  burnouts: number
  eventos: number
  ahorrosFinal: number
  compras: number
  /** Contratos de marca firmados en toda la partida. */
  contratos: number
  credibilidadFinal: number
  techoFinal: number
  /** Epilogo que le tocaria si se retirase ahora. */
  epilogoFinal: Epilogo
  /** Minuto en que sus ahorros pasan de mil euros. Mide el dinero RAPIDO. */
  milEurosEnMinuto: number | null
  /** Cumple las ocho condiciones del retiro al terminar? */
  condicionesFinales: boolean
  /** Coste de vida cubierto por rentas, al final. 1 = justo cubierto. */
  coberturaFinal: number
  /** Serie temporal para comparar bots minuto a minuto. */
  muestras: Array<{ minuto: number; alcance: number; comunidad: number; cobertura: number }>
}

/**
 * El banco mide el retiro REAL, no un proxy economico.
 *
 * Durante F0-F4 media solo la cobertura, que es una de las ocho condiciones de
 * la seccion 11. Con las otras siete implementadas eso ya no vale: un bot
 * podia "retirarse" facturando mucho y trabajando doce horas al dia, que es
 * exactamente lo que el juego dice que NO es retirarse.
 */
export const calcCobertura = cobertura

/**
 * Minuto en que una politica adelanta a otra DE FORMA SOSTENIDA.
 *
 * El alcance es picudo por naturaleza —publicaciones, hype, fases de evento—
 * asi que un cruce de una sola muestra no significa nada. Un detector ingenuo
 * daba "adelantamiento en el minuto 15" cuando en realidad el grind seguia por
 * delante otros cuarenta minutos: era un pico suelto.
 *
 * Se considera adelantamiento cuando el retador lidera en al menos 4 de las 5
 * muestras siguientes y no vuelve a perder el liderato de forma clara.
 */
export function cruceSostenido(
  lider: RunResult,
  retador: RunResult,
  metrica: 'alcance' | 'comunidad' = 'alcance',
): number | null {
  const n = Math.min(lider.muestras.length, retador.muestras.length)

  for (let i = 0; i < n; i++) {
    const ventana = Math.min(5, n - i)
    if (ventana < 3) break

    let aFavor = 0
    for (let j = i; j < i + ventana; j++) {
      const a = lider.muestras[j]
      const b = retador.muestras[j]
      if (a && b && b[metrica] > a[metrica]) aFavor++
    }

    if (aFavor >= ventana - 1) return lider.muestras[i]?.minuto ?? null
  }
  return null
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

  let compras = 0
  let contratos = 0
  let milEurosEnMinuto: number | null = null

  for (let i = 0; i < maxTicks; i++) {
    // Las tarjetas de vida detienen la simulacion hasta que alguien conteste.
    // Los bots eligen siempre la primera opcion: no se trata de optimizarlas
    // —el GDD dice explicitamente que dan sabor, no progresion— sino de que
    // la partida no se quede congelada.
    if (s.eventoPendiente) s = resolver(s, s.eventoPendiente, 0)

    // La entrada de ciclo detiene igual: el bot la da por leida y sigue.
    if (s.avisoCiclo !== null) s = { ...s, avisoCiclo: null }

    // El titular de una moda que estalla detiene por la misma razon.
    if (s.resacaPendiente !== null) s = { ...s, resacaPendiente: null }

    /**
     * Las marcas.
     *
     * Un bot sin politica de patrocinio no firma nada, que es la politica por
     * defecto correcta: el GDD dice que ningun sistema puede ser requisito, y
     * la mayoria de los bots existen para medir otras cosas. Lo que si hace
     * todo bot es VACIAR la bandeja, porque una oferta ignorada bloquea sitio
     * y falsearia el ritmo del goteo.
     */
    for (const oferta of s.ofertas) {
      const def = definicion(oferta.id)
      if (!def) continue
      if (bot.patrocinio?.(s, def)) {
        const antes = s
        s = aceptar(s, oferta.id)
        if (s !== antes) contratos += 1
      } else {
        s = rechazar(s, oferta.id)
      }
    }

    // Comprar primero: en los ciclos 1-2 la compra es lo que mueve el reparto.
    if (!bot.compra || bot.compra(s)) {
      const id = siguienteCompra(s, bot.prioridad)
      if (id) {
        const antes = s
        s = comprar(s, id)
        if (s !== antes) compras += 1
      }
    }

    // Parar y prepararse son decisiones del jugador, no del motor.
    if (bot.prepara && s.evento && !s.evento.preparado) s = prepararEvento(s)
    if (bot.vacaciones?.(s) && puedeIrseDeVacaciones(s)) {
      s = irseDeVacaciones({ ...s, repartoAntesDeParar: s.allocation })
    }

    /**
     * Repartir la semana y lanzarla.
     *
     * Es lo que hace una persona en la pausa: coloca las franjas y le da a
     * vivir. Un reparto manual pisa al derivado; sin el, mandan las compras.
     * Durante un descanso NO se pisa —parar significa no producir— y ademas
     * esas semanas ni siquiera pasan por la fase de planificar.
     */
    if (s.semana.fase === 'planificando') {
      const alloc = bot.allocation && !s.descanso ? bot.allocation(s) : s.allocation
      s = replanificar(s, alloc)
      s = { ...s, semana: { ...s.semana, fase: 'viviendo' } }
    }

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
    if (retiroEnMinuto === null && puedeRetirarse(s)) {
      retiroEnMinuto = minuto
    }

    // El dinero RAPIDO: vender tiene que llegar antes al colchon o la
    // decision es falsa. Es la aserción 2 del banco.
    if (milEurosEnMinuto === null && s.ahorros >= 1000) {
      milEurosEnMinuto = minuto
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
    vacaciones: s.vacacionesCompletadas,
    burnouts: s.burnouts,
    eventos: s.eventosExtraordinarios,
    ahorrosFinal: s.ahorros,
    compras,
    contratos,
    credibilidadFinal: s.credibilidad,
    techoFinal: s.techoCredibilidad,
    epilogoFinal: evaluarEpilogo(s),
    milEurosEnMinuto,
    coberturaFinal: calcCobertura(s),
    condicionesFinales: cumpleRetiro(s),
    muestras,
  }
}
