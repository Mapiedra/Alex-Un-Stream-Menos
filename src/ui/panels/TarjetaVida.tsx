import { LIFE_POR_ID } from '../../content/lifeEvents.ts'
import { useGame } from '../../store.ts'

/**
 * Tarjeta de vida personal.
 *
 * Mientras esta abierta la simulacion esta detenida. Es lo que permite
 * escribir textos con calma sin que leerlos salga caro en minutos de partida,
 * y es tambien lo que hace que el jugador levante la vista de los numeros un
 * momento — que es medio objetivo de estas tarjetas.
 *
 * Ninguna opcion es una trampa. No hay una respuesta correcta que memorizar,
 * hay decisiones con sabor distinto y consecuencias pequenas.
 */
export function TarjetaVida() {
  const id = useGame((s) => s.game.eventoPendiente)
  const resolver = useGame((s) => s.resolverEvento)

  if (!id) return null
  const evento = LIFE_POR_ID.get(id)
  if (!evento) return null

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="tarjeta-titulo">
      <article className="tarjeta">
        <h2 className="tarjeta__titulo" id="tarjeta-titulo">
          {evento.titulo}
        </h2>
        <p className="tarjeta__texto">{evento.texto}</p>

        <div className="tarjeta__opciones">
          {evento.opciones.map((o, i) => (
            <button key={o.texto} className="tarjeta__opcion" onClick={() => resolver(i)}>
              {o.texto}
            </button>
          ))}
        </div>

        <p className="tarjeta__nota">La partida esta en pausa mientras lees.</p>
      </article>
    </div>
  )
}
