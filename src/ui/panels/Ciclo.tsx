import { CYCLE_POR_NUMERO } from '../../content/cycles.ts'
import { useGame } from '../../store.ts'
import { fmt } from '../../format.ts'

/**
 * La entrada de un ciclo.
 *
 * Los textos de `entrada` y `cierre` estaban escritos en content/cycles.ts
 * desde el primer dia y no se renderizaban en ninguna parte. Son exactamente
 * el contexto que le faltaba a la partida: que ha pasado, donde estas y que
 * toca ahora.
 *
 * Mientras esta abierto la simulacion esta detenida, igual que con una tarjeta
 * de vida: leer no consume partida.
 */
export function Ciclo() {
  const numero = useGame((s) => s.game.avisoCiclo)
  const semana = useGame((s) => s.game.week)
  const cerrar = useGame((s) => s.cerrarAvisoCiclo)

  if (numero === null) return null

  const ciclo = CYCLE_POR_NUMERO.get(numero)
  if (!ciclo) return null

  const anterior = CYCLE_POR_NUMERO.get(numero - 1)
  const arranque = numero === 1

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="ciclo-titulo">
      <article className="tarjeta tarjeta--ciclo">
        <span className="carrera__kicker">
          {arranque ? 'Empieza' : `Ciclo ${numero} de 5`}
        </span>
        <h2 className="tarjeta__titulo" id="ciclo-titulo">
          {ciclo.nombre}
        </h2>

        {anterior && <p className="tarjeta__texto tarjeta__cierre">{anterior.cierre}</p>}

        <p className="tarjeta__texto">{ciclo.entrada}</p>

        <div className="ciclo__objetivo">
          <span className="carrera__kicker">Ahora toca</span>
          <p className="tarjeta__texto">{ciclo.objetivo}</p>
          <ul className="requisitos">
            {ciclo.requisitos.map((r) => (
              <li key={r.clave} className="requisito">
                <span className="requisito__marca">·</span>
                <span className="requisito__texto">{r.texto}</span>
              </li>
            ))}
          </ul>
        </div>

        {ciclo.abreReparto && (
          <p className="tarjeta__nota">
            A partir de aquí decides tus horas. Hasta ahora las decidían las prisas y lo que ibas
            comprando.
          </p>
        )}

        <div className="tarjeta__opciones">
          <button className="tarjeta__opcion" onClick={cerrar}>
            {arranque ? 'Empezar' : 'Seguir'}
          </button>
        </div>

        <p className="tarjeta__nota">
          {arranque
            ? 'La partida está en pausa hasta que empieces.'
            : `Semana ${fmt(semana)}. La partida está en pausa mientras lees.`}
        </p>
      </article>
    </div>
  )
}
