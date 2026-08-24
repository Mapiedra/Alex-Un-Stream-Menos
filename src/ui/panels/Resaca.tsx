import { MODA_POR_CATEGORIA } from '../../content/patrocinios.ts'
import type { CategoriaMarca } from '../../content/patrocinios.ts'
import { useGame } from '../../store.ts'
import { pct } from '../../format.ts'

/**
 * Cuando estalla una moda.
 *
 * El unico momento del sistema de patrocinios que SI para la partida, y es
 * deliberado: las ofertas llegan constantemente y no pueden interrumpir, pero
 * esto pasa tres veces en toda una partida y solo le pasa a quien firmo. Es el
 * cobro de una decision que se tomo hace veinte semanas, y merece que se pare
 * el reloj mientras se lee.
 *
 * No hay opciones que elegir. Ya elegiste.
 */
export function Resaca() {
  const pendiente = useGame((s) => s.game.resacaPendiente)
  const techo = useGame((s) => s.game.techoCredibilidad)
  const credibilidad = useGame((s) => s.game.credibilidad)
  const firmados = useGame((s) =>
    pendiente ? (s.game.aceptadosPorCategoria[pendiente] ?? 0) : 0,
  )
  const cerrar = useGame((s) => s.cerrarResaca)

  if (pendiente === null) return null

  const moda = MODA_POR_CATEGORIA.get(pendiente as CategoriaMarca)
  if (!moda) return null

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="resaca-titulo">
      <article className="tarjeta tarjeta--resaca">
        <span className="carrera__kicker">{moda.nombre}</span>
        <h2 className="tarjeta__titulo" id="resaca-titulo">
          {moda.titular}
        </h2>

        {moda.resacaTexto.split('\n\n').map((parrafo, i) => (
          <p className="tarjeta__texto" key={i}>
            {parrafo}
          </p>
        ))}

        <p className="tarjeta__nota">
          Firmaste {firmados === 1 ? 'un contrato' : `${firmados} contratos`}. Credibilidad al{' '}
          {pct(credibilidad)}, y ya no puede volver a pasar del {pct(techo)}.
        </p>

        <div className="tarjeta__opciones">
          <button className="tarjeta__opcion" onClick={cerrar}>
            Seguir
          </button>
        </div>
      </article>
    </div>
  )
}
