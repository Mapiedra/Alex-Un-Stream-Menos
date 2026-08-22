import { useMemo, useState } from 'react'
import {
  NOMBRE_CATEGORIA,
  UPGRADES,
  type Categoria,
  type Upgrade,
} from '../../content/upgrades.ts'
import { disponibilidad, type Disponibilidad } from '../../sim/allocation.ts'
import { useGame } from '../../store.ts'
import { eur, fmt } from '../../format.ts'

const ORDEN: Categoria[] = ['setup', 'flujo', 'rutina', 'casa', 'formato']

/**
 * La tienda.
 *
 * En los ciclos 1-2 es donde ocurre todo el juego: comprar aqui es lo que
 * mueve el reparto del tiempo, aunque el jugador todavia no vea ese reparto.
 * Por eso cada mejora dice explicitamente en que cambia sus horas.
 */
export function Tienda() {
  const owned = useGame((s) => s.game.owned)
  const ciclo = useGame((s) => s.game.cycle)
  const ahorros = useGame((s) => s.game.ahorros)
  const ideas = useGame((s) => s.game.ideas)
  const comprar = useGame((s) => s.buy)

  const [categoria, setCategoria] = useState<Categoria>('setup')

  const items = useMemo(
    () =>
      UPGRADES.filter((u) => u.categoria === categoria).map((u) => ({
        up: u,
        d: disponibilidad(u, owned, ciclo, ahorros, ideas),
        niveles: owned[u.id] ?? 0,
      })),
    [categoria, owned, ciclo, ahorros, ideas],
  )

  return (
    <section className="tienda">
      <nav className="tienda__tabs">
        {ORDEN.map((c) => (
          <button
            key={c}
            className="tienda__tab"
            data-activa={c === categoria}
            onClick={() => setCategoria(c)}
          >
            {NOMBRE_CATEGORIA[c]}
          </button>
        ))}
        <span className="tienda__saldo data">
          {eur(ahorros)} · {fmt(ideas, 1)} ideas
        </span>
      </nav>

      <ul className="tienda__lista">
        {items.map(({ up, d, niveles }) => (
          <Fila key={up.id} up={up} d={d} niveles={niveles} onComprar={() => comprar(up.id)} />
        ))}
      </ul>
    </section>
  )
}

interface FilaProps {
  up: Upgrade
  d: Disponibilidad
  niveles: number
  onComprar: () => void
}

function Fila({ up, d, niveles, onComprar }: FilaProps) {
  const agotada = d.motivo === 'agotada'

  return (
    <li className="mejora" data-agotada={agotada} data-bloqueada={!d.visible}>
      <div className="mejora__texto">
        <span className="mejora__nombre">
          {up.nombre}
          {up.maximo > 1 && niveles > 0 && <em className="mejora__nivel"> · {niveles}</em>}
        </span>
        <span className="mejora__desc">{up.descripcion}</span>
        <span className="mejora__efecto data">{describirEfecto(up)}</span>
      </div>

      <button className="mejora__boton" onClick={onComprar} disabled={!d.comprable}>
        {etiqueta(d)}
      </button>
    </li>
  )
}

function etiqueta(d: Disponibilidad): string {
  if (d.motivo === 'agotada') return 'Hecho'
  if (d.motivo === 'ciclo') return 'Aun no'
  if (d.costeIdeas > 0 && d.coste === 0) return `${d.costeIdeas} ideas`
  if (d.costeIdeas > 0) return `${eur(d.coste)} + ${d.costeIdeas} ideas`
  if (d.coste === 0) return 'Gratis'
  return eur(d.coste)
}

/**
 * Traduce el efecto a lenguaje llano.
 *
 * El publico de incrementales quiere ver los numeros, y ademas aqui hacen
 * falta: el jugador tiene que poder entender por que una mejora que le quita
 * horas de produccion puede salirle a cuenta.
 */
function describirEfecto(up: Upgrade): string {
  const partes: string[] = []
  const e = up.efecto

  if (e.multEficiencia) partes.push(`eficiencia x${e.multEficiencia}`)
  if (e.multCalidad) partes.push(`calidad x${e.multCalidad}`)
  if (e.multAlcance) partes.push(`alcance x${e.multAlcance}`)
  if (e.subeCasa) partes.push('sube la casa — y el coste de vida')

  if (e.slots) {
    const horas = Object.entries(e.slots)
      .filter(([, v]) => v)
      .map(([k, v]) => `+${v} ${ETIQUETA_ACTIVIDAD[k] ?? k}`)
    if (horas.length) partes.push(`horas: ${horas.join(', ')}`)
  }

  return partes.join(' · ')
}

const ETIQUETA_ACTIVIDAD: Record<string, string> = {
  produccion: 'a producir',
  comunidad: 'a comunidad',
  vida: 'a vida',
  descanso: 'a descanso',
}
