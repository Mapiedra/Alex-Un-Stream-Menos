import { FORMATOS_ELEGIBLES, type ContentType } from '../../content/contentTypes.ts'
import { useGame } from '../../store.ts'

/**
 * Eleccion de formato.
 *
 * Es la decision estrategica central de la partida y por eso cada tarjeta
 * ensena su perfil completo, sin esconder nada: cuanta gente trae, cuanta se
 * queda y cuanto cansa. El jugador tiene que poder ver de un vistazo que el
 * juego popular llena la calle de gente que se va, y que la charla trae a
 * cuatro que no se van nunca.
 */
export function Formatos() {
  const activo = useGame((s) => s.game.formato)
  const owned = useGame((s) => s.game.owned)
  const cambiar = useGame((s) => s.setFormato)

  return (
    <section className="formatos">
      <h2 className="formatos__titulo">Que emites</h2>

      <ul className="formatos__lista">
        {FORMATOS_ELEGIBLES.map((f) => {
          const bloqueado = f.requiere !== undefined && !owned[f.requiere]
          return (
            <li key={f.id}>
              <button
                className="formato"
                data-activo={f.id === activo}
                disabled={bloqueado}
                onClick={() => cambiar(f.id)}
                title={bloqueado ? 'Se desbloquea comprando el formato en la tienda' : f.descripcion}
              >
                <span className="formato__nombre">{f.nombre}</span>
                <span className="formato__desc">
                  {bloqueado ? 'Aun no lo has desbloqueado' : f.descripcion}
                </span>
                <Perfil f={f} />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Las tres barras que definen un formato, en la misma escala para todos. */
function Perfil({ f }: { f: ContentType }) {
  return (
    <span className="perfil">
      <Barra etiqueta="Alcance" valor={f.alcance / 2} token="alcance" texto={escala(f.alcance, 2)} />
      <Barra etiqueta="Fidelidad" valor={f.afinidad / 5} token="comunidad" texto={escala(f.afinidad, 5)} />
      <Barra etiqueta="Desgaste" valor={f.coste / 2} token="fatiga" texto={escala(f.coste, 2)} />
    </span>
  )
}

interface BarraProps {
  etiqueta: string
  /** 0..1, ya normalizado. */
  valor: number
  token: 'alcance' | 'comunidad' | 'fatiga'
  texto: string
}

function Barra({ etiqueta, valor, token, texto }: BarraProps) {
  const pct = Math.round(Math.min(1, Math.max(0, valor)) * 100)
  return (
    <span className="perfil__fila" title={`${etiqueta}: ${texto}`}>
      <span className="perfil__etiqueta">{etiqueta}</span>
      <span className="perfil__pista">
        <span
          className="perfil__relleno"
          style={{ width: `${pct}%`, background: `var(--c-${token})` }}
        />
      </span>
    </span>
  )
}

/** Traduce el numero a palabras, que es como lo lee la tabla del GDD. */
function escala(v: number, max: number): string {
  const r = v / max
  if (r <= 0.02) return 'nulo'
  if (r < 0.15) return 'muy bajo'
  if (r < 0.35) return 'bajo'
  if (r < 0.6) return 'medio'
  if (r < 0.85) return 'alto'
  return 'muy alto'
}
