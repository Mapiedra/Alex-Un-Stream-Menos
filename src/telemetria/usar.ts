import { useEffect, useRef } from 'react'
import { useGame } from '../store.ts'
import { instalarCierre, registrar } from './eventos.ts'

/**
 * Engancha la telemetria al estado del juego.
 *
 * Solo dispara en TRANSICIONES, nunca cada tick: lo que interesa saber es
 * cuando pasa algo por primera vez, no repetirlo diez veces por segundo.
 *
 * El unico evento periodico es `progreso`, cada cinco minutos de simulacion,
 * y existe para lo mas importante que se quiere medir: DONDE ABANDONA LA
 * GENTE. Sin el, de una partida abandonada no queda ni rastro.
 */
export function useTelemetria(): void {
  const g = useGame((s) => s.game)
  const previo = useRef({
    ciclo: 0,
    compras: 0,
    formato: '',
    vacaciones: 0,
    burnouts: 0,
    eventos: 0,
    bloqueProgreso: -1,
    terminada: false,
    iniciada: false,
  })

  useEffect(() => {
    instalarCierre()
  }, [])

  useEffect(() => {
    const p = previo.current
    const minuto = Math.round(g.elapsedMs / 60000)
    const base = { minuto, semana: g.week, ciclo: g.cycle }

    if (!p.iniciada) {
      p.iniciada = true
      p.ciclo = g.cycle
      p.formato = g.formato
      registrar({ tipo: 'partida_iniciada', ...base })
    }

    if (g.cycle > p.ciclo) {
      p.ciclo = g.cycle
      registrar({ tipo: 'ciclo_alcanzado', ...base })
    }

    const compras = Object.keys(g.owned).length
    if (compras > 0 && p.compras === 0) {
      registrar({ tipo: 'primera_compra', ...base })
    }
    p.compras = compras

    if (g.formato !== p.formato) {
      registrar({ tipo: 'primer_formato', ...base, detalle: { formato: g.formato } })
      p.formato = g.formato
    }

    if (g.vacacionesCompletadas > p.vacaciones) {
      p.vacaciones = g.vacacionesCompletadas
      registrar({ tipo: 'primeras_vacaciones', ...base, detalle: { total: g.vacacionesCompletadas } })
    }

    if (g.burnouts > p.burnouts) {
      p.burnouts = g.burnouts
      registrar({ tipo: 'burnout', ...base, detalle: { total: g.burnouts } })
    }

    if (g.eventosExtraordinarios > p.eventos) {
      p.eventos = g.eventosExtraordinarios
      registrar({ tipo: 'evento_extraordinario', ...base })
    }

    // Latido cada cinco minutos: es lo unico que revela los abandonos.
    const bloque = Math.floor(minuto / 5)
    if (bloque > p.bloqueProgreso) {
      p.bloqueProgreso = bloque
      registrar({
        tipo: 'progreso',
        ...base,
        detalle: {
          comunidad: Math.round(g.comunidad),
          alcance: Math.round(g.alcance),
          calidad: Number(g.calidad.toFixed(2)),
          fatiga: Number(g.fatiga.toFixed(2)),
          casa: g.houseStage,
          horasProduccion: Number(g.allocation.produccion.toFixed(2)),
        },
      })
    }

    if (g.final && !p.terminada) {
      p.terminada = true
      registrar({
        tipo: 'partida_terminada',
        ...base,
        detalle: {
          epilogo: g.final.epilogo,
          eleccion: g.final.eleccion ?? 'ninguna',
          comunidad: Math.round(g.comunidad),
          publicaciones: g.publicacionesTotales,
          vacaciones: g.vacacionesCompletadas,
          burnouts: g.burnouts,
        },
      })
    }
  }, [g])
}
