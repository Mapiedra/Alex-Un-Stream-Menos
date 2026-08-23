import { useEffect, useState } from 'react'
import { NOMBRE_EPILOGO } from '../../content/narrative.ts'
import { telemetriaActiva } from '../../telemetria/eventos.ts'
import type { Epilogo } from '../../sim/final.ts'

interface FilaMuro {
  epilogo: string
  partidas: number
  semana_mediana: number
}

/**
 * El muro de finales.
 *
 * En vez de un ranking, un espejo. El juego dice que trabajar menos es mejor y
 * que no se puede perder; un ranking de "quien tiene mas comunidad" o "quien
 * se retira antes" convertiria eso en una competicion de optimizacion, que es
 * justo lo que el diseno combate.
 *
 * Esto hace algo distinto: te dice donde has acabado TU respecto a los demas.
 * Si el 60% se queda en La Rueda, saber que tu tambien no es un fracaso —es
 * informacion sobre lo dificil que es soltar, que es de lo que va el juego.
 *
 * Solo aparece al terminar la partida, y solo si hay telemetria configurada.
 */
export function MuroFinales({ propio }: { propio: Epilogo }) {
  const [filas, setFilas] = useState<FilaMuro[] | null>(null)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    if (!telemetriaActiva) return

    const url = import.meta.env['VITE_SUPABASE_URL'] as string
    const key = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string
    let cancelado = false

    fetch(`${url}/rest/v1/muro_finales?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: FilaMuro[]) => {
        if (!cancelado) setFilas(data)
      })
      .catch(() => {
        // Que no se puedan cargar las estadisticas no puede estropear el final
        // de nadie: simplemente no se ensena el bloque.
        if (!cancelado) setFallo(true)
      })

    return () => {
      cancelado = true
    }
  }, [])

  if (!telemetriaActiva || fallo || !filas || filas.length === 0) return null

  const total = filas.reduce((acc, f) => acc + Number(f.partidas), 0)
  if (total < 10) return null // Con cuatro partidas los porcentajes mienten.

  return (
    <section className="muro">
      <span className="carrera__kicker">Cómo acabaron los demás</span>

      <ul className="muro__lista">
        {filas
          .slice()
          .sort((a, b) => Number(b.partidas) - Number(a.partidas))
          .map((f) => {
            const pct = Math.round((Number(f.partidas) / total) * 100)
            const esElTuyo = f.epilogo === propio
            return (
              <li key={f.epilogo} className="muro__fila" data-tuyo={esElTuyo}>
                <span className="muro__nombre">
                  {NOMBRE_EPILOGO[f.epilogo as Epilogo] ?? f.epilogo}
                  {esElTuyo && <em className="muro__marca"> · el tuyo</em>}
                </span>
                <span className="muro__barra">
                  <span style={{ width: `${pct}%` }} />
                </span>
                <span className="muro__pct data">{pct}%</span>
              </li>
            )
          })}
      </ul>

      <p className="muro__nota">
        De {total.toLocaleString('es-ES')} partidas terminadas. No hay ranking: no es una carrera.
      </p>
    </section>
  )
}
