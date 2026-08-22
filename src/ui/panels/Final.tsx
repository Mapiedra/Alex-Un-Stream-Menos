import { useState } from 'react'
import {
  EPILOGOS,
  NOMBRE_EPILOGO,
  OPCIONES_FINALES,
  PREGUNTA_FINAL,
  SUBTITULO_FINAL,
} from '../../content/narrative.ts'
import { useGame } from '../../store.ts'
import { fmt } from '../../format.ts'

/**
 * La escena final.
 *
 * Dos pasos: primero se pregunta a que quiere dedicar el tiempo ahora, y solo
 * despues se cuenta como acaba. El orden importa — si el epilogo llegase
 * primero, la pregunta seria decorativa; asi es lo ultimo que decide el
 * jugador y tine el cierre.
 *
 * Ninguna opcion es mejor que otra. Ese es el punto.
 */
export function Final() {
  const final = useGame((s) => s.game.final)
  const g = useGame((s) => s.game)
  const elegir = useGame((s) => s.elegirFinal)
  const reset = useGame((s) => s.reset)
  const [pendiente, setPendiente] = useState<string | null>(null)

  if (!final) return null

  const texto = EPILOGOS[final.epilogo]
  const eleccion = final.eleccion ?? pendiente
  const opcion = OPCIONES_FINALES.find((o) => o.id === eleccion)

  if (!final.eleccion) {
    return (
      <div className="modal modal--final" role="dialog" aria-modal="true">
        <article className="tarjeta tarjeta--final">
          <h2 className="tarjeta__titulo">{PREGUNTA_FINAL}</h2>
          <p className="tarjeta__texto">{SUBTITULO_FINAL}</p>

          <div className="tarjeta__opciones">
            {OPCIONES_FINALES.map((o) => (
              <button
                key={o.id}
                className="tarjeta__opcion"
                onClick={() => {
                  setPendiente(o.id)
                  elegir(o.id)
                }}
              >
                {o.texto}
              </button>
            ))}
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="modal modal--final" role="dialog" aria-modal="true">
      <article className="tarjeta tarjeta--final">
        <span className="carrera__kicker">{NOMBRE_EPILOGO[final.epilogo]}</span>
        <h2 className="tarjeta__titulo">{texto.titulo}</h2>

        {texto.cuerpo.map((p) => (
          <p key={p} className="tarjeta__texto">
            {p}
          </p>
        ))}

        <p className="tarjeta__texto">
          {g.burnouts > 0 ? texto.conBurnout : texto.sinBurnout}
        </p>

        {opcion && <p className="tarjeta__texto tarjeta__cierre">{opcion.cierre}</p>}

        <dl className="resumen">
          <Dato etiqueta="Semanas" valor={fmt(final.semana)} />
          <Dato etiqueta="Comunidad" valor={fmt(g.comunidad)} />
          <Dato etiqueta="Publicaciones" valor={fmt(g.publicacionesTotales)} />
          <Dato etiqueta="Vacaciones" valor={fmt(g.vacacionesCompletadas)} />
          <Dato etiqueta="Momentos grandes" valor={fmt(g.eventosExtraordinarios)} />
          <Dato etiqueta="Veces que paraste a la fuerza" valor={fmt(g.burnouts)} />
        </dl>

        <button className="tarjeta__opcion" onClick={() => reset()}>
          Empezar otra vez
        </button>
      </article>
    </div>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="resumen__dato">
      <dt>{etiqueta}</dt>
      <dd className="data">{valor}</dd>
    </div>
  )
}
