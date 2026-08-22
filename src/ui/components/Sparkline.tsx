import { useMemo } from 'react'
import { normalizar, tendencia } from '../../sim/historial.ts'
import type { TokenKey } from '../theme/palette.ts'

interface Props {
  serie: number[]
  token: TokenKey
  etiqueta: string
  ancho?: number
  alto?: number
}

/**
 * Curva de una serie, normalizada sobre su propio maximo.
 *
 * Cada sparkline usa su propia escala a proposito: no interesa comparar
 * magnitudes —la comunidad siempre sera mucho menor que el alcance— sino
 * FORMAS. Puestas una encima de otra, la del alcance sube y baja como un
 * electrocardiograma y la de la comunidad sube y se queda. Esa diferencia es
 * la tesis del juego, y asi se ve sin leer un solo numero.
 */
export function Sparkline({ serie, token, etiqueta, ancho = 132, alto = 30 }: Props) {
  const d = useMemo(() => trazar(serie, ancho, alto), [serie, ancho, alto])
  const t = useMemo(() => tendencia(serie), [serie])

  const flecha = t > 0.02 ? '▲' : t < -0.02 ? '▼' : '—'

  return (
    <div className="spark" title={`${etiqueta}: ${descripcionTendencia(t)}`}>
      <svg
        className="spark__svg"
        width={ancho}
        height={alto}
        viewBox={`0 0 ${ancho} ${alto}`}
        role="img"
        aria-label={`${etiqueta}, ${descripcionTendencia(t)}`}
        preserveAspectRatio="none"
      >
        {d && (
          <path
            d={d}
            fill="none"
            stroke={`var(--c-${token})`}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            // Sin suavizado: la estetica del juego es de pixel duro.
            shapeRendering="crispEdges"
          />
        )}
      </svg>
      <span className="spark__pie" style={{ color: `var(--c-${token})` }}>
        {etiqueta} <span className="spark__tendencia">{flecha}</span>
      </span>
    </div>
  )
}

function trazar(serie: number[], ancho: number, alto: number): string | null {
  if (serie.length < 2) return null
  const n = normalizar(serie)
  const paso = ancho / (n.length - 1)
  // Un pixel de margen arriba y abajo para que el trazo no se coma el borde.
  const util = alto - 2

  return n
    .map((v, i) => {
      const x = Math.round(i * paso)
      const y = Math.round(1 + util - v * util)
      return `${i === 0 ? 'M' : 'L'}${x} ${y}`
    })
    .join(' ')
}

function descripcionTendencia(t: number): string {
  if (t > 0.25) return 'subiendo con fuerza'
  if (t > 0.02) return 'subiendo'
  if (t < -0.25) return 'cayendo en picado'
  if (t < -0.02) return 'cayendo'
  return 'estable'
}
