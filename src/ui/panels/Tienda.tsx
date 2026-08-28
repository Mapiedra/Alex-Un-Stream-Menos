import { useMemo, useState } from 'react'
import {
  MONEDA_CATEGORIA,
  NOMBRE_CATEGORIA,
  UPGRADES,
  escalon,
  type Categoria,
  type Upgrade,
} from '../../content/upgrades.ts'
import { bolsilloDe, disponibilidad, type Disponibilidad } from '../../sim/allocation.ts'
import {
  DESCRIPCION_NIVEL,
  NIVELES,
  NOMBRE_NIVEL,
  costeMaterial,
  type NivelEdicion,
} from '../../sim/publicacion.ts'
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
  const material = useGame((s) => s.game.material)
  const vida = useGame((s) => s.game.vida)
  const comprar = useGame((s) => s.buy)

  const [categoria, setCategoria] = useState<Categoria>('setup')

  const items = useMemo(() => {
    const bolsillo = bolsilloDe({ ahorros, ideas, material, vida })
    return UPGRADES.filter((u) => u.categoria === categoria).map((u) => ({
      up: u,
      d: disponibilidad(u, owned, ciclo, bolsillo),
      niveles: owned[u.id] ?? 0,
    }))
  }, [categoria, owned, ciclo, ahorros, ideas, material, vida])

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
          {eur(ahorros)} · {fmt(ideas, 1)} ideas · {material.toFixed(1)} material
        </span>
      </nav>

      {/* Cada categoria cobra en su moneda, y decirlo evita la pregunta de
          por que una mejora sin precio no se puede comprar. */}
      <p className="tienda__moneda">{MONEDA_CATEGORIA[categoria]}</p>

      {/* Lo que se compra en Flujo hay que poder configurarlo en Flujo. */}
      {categoria === 'flujo' && Boolean(owned['programacion']) && <ColaPreparada />}

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
  // El peldaño que TOCA, no el que ya tienes: la tienda enseña hacia donde
  // vas. Es lo que convierte comprar cuatro veces lo mismo en una progresion.
  const siguiente = agotada ? null : escalon(up, niveles)

  return (
    <li className="mejora" data-agotada={agotada} data-bloqueada={!d.visible}>
      <div className="mejora__texto">
        <span className="mejora__nombre">
          {up.nombre}
          {siguiente && <em className="mejora__paso"> — {siguiente.nombre}</em>}
          {up.maximo > 1 && (
            <em className="mejora__nivel">
              {' '}
              · {niveles}/{up.maximo}
            </em>
          )}
        </span>
        <span className="mejora__desc">{siguiente?.descripcion ?? up.descripcion}</span>
        <span className="mejora__efecto data">{describirEfecto(up)}</span>
        {up.escalones && up.maximo > 1 && (
          <span className="mejora__escalera" aria-hidden>
            {up.escalones.map((e, i) => (
              <span key={e.nombre} className="mejora__peldano" data-hecho={i < niveles} />
            ))}
          </span>
        )}
      </div>

      <button className="mejora__boton" onClick={onComprar} disabled={!d.comprable} title={pista(d)}>
        {etiqueta(d)}
      </button>
    </li>
  )
}

/** Por que no se puede comprar, en una linea. */
function pista(d: Disponibilidad): string {
  switch (d.motivo) {
    case 'dinero':
      return 'Te falta dinero.'
    case 'ideas':
      return 'Te faltan ideas. Salen de la vida personal y de terminar libros.'
    case 'material':
      return 'Te falta material. Sale de las franjas de editar.'
    case 'vida':
      return 'Estas demasiado hecho polvo para reorganizarte. Duerme unas semanas primero.'
    case 'ciclo':
      return 'Todavia no toca.'
    default:
      return ''
  }
}

/**
 * Lo que cuesta, en todas sus monedas.
 *
 * Ya no existe "Gratis": si una mejora no vale dinero es porque vale material,
 * vida o ideas. Decirlo entero es lo que permite comparar lo que inviertes con
 * lo que te devuelve.
 */
function etiqueta(d: Disponibilidad): string {
  if (d.motivo === 'agotada') return 'Hecho'
  if (d.motivo === 'ciclo') return 'Aun no'

  const partes: string[] = []
  if (d.coste > 0) partes.push(eur(d.coste))
  if (d.costeIdeas > 0) partes.push(`${d.costeIdeas} ideas`)
  if (d.costeMaterial > 0) partes.push(`${d.costeMaterial} material`)
  if (d.costeVida > 0) partes.push(`${Math.round(d.costeVida * 100)}% de vida`)
  return partes.join(' + ') || 'Sin coste'
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

/**
 * CON QUE MIMO PUBLICA EL CALENDARIO CUANDO NO ESTAS DELANTE.
 *
 * `Dejar la cola preparada` promete literalmente "decides con que mimo sale
 * cada cosa sin tener que estar delante", y hasta ahora no habia donde
 * decidirlo: el estado (`nivelAuto`), la accion del store y el tick que lo lee
 * existian y estaban testeados, pero sin ningun control en pantalla se quedaba
 * clavado en 'normal'. Se podia comprar una automatizacion y no configurarla.
 *
 * Vive en la tienda y no en la barra del reproductor a proposito. La barra es
 * para lo que se decide AHORA —este video, este directo—; esto es una regla que
 * se deja puesta y se olvida, y esas viven donde se compraron.
 */
function ColaPreparada() {
  const nivelAuto = useGame((s) => s.game.nivelAuto)
  const setNivelAuto = useGame((s) => s.setNivelAuto)

  return (
    <section className="cola" aria-labelledby="cola-titulo">
      <h3 className="cola__titulo" id="cola-titulo">
        Cómo sale lo que publicas sin ti
      </h3>
      <p className="cola__nota">
        El calendario saca material aunque no estés delante. Esto decide con cuánto mimo — y por
        tanto cuánto material se le va en cada vídeo.
      </p>

      <div className="cola__niveles" role="radiogroup" aria-label="Nivel de edición automática">
        {NIVELES.map((n: NivelEdicion) => (
          <button
            key={n}
            className="cola__nivel"
            data-nivel={n}
            data-activo={nivelAuto === n}
            role="radio"
            aria-checked={nivelAuto === n}
            onClick={() => setNivelAuto(n)}
          >
            <span className="cola__nombre">
              {NOMBRE_NIVEL[n]}
              <span className="cola__coste data">{costeMaterial(n)} material</span>
            </span>
            <span className="cola__desc">{DESCRIPCION_NIVEL[n]}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
