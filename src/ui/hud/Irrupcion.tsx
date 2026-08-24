import { useEffect } from 'react'
import { BIG_POR_ID, type FaseDef } from '../../content/bigEvents.ts'
import { faseActual } from '../../sim/bigEvents.ts'
import { useGame } from '../../store.ts'
import { eur } from '../../format.ts'

/**
 * LA IRRUPCION — cuando pasa algo, que se note que ha pasado algo.
 *
 * Un evento extraordinario avisaba con un punto rojo en una pestana. Eso es
 * lo mismo que avisa de que hay una oferta de una marca de café, y no es lo
 * mismo: la conferencia del año es el unico momento de la partida en que todo
 * el mundo mira lo mismo a la vez, y el directo solidario es el unico en que
 * el juego te propone hacer algo que no te da ni una visita.
 *
 * Asi que rompe la pantalla. Se para el reloj, se tapa el reproductor y se
 * dice en grande que esta pasando y que va a hacer. Una vez por fase, ni una
 * mas: lo marca `evento.anunciado`, que vive en la partida guardada, de modo
 * que recargar no vuelve a contarte lo mismo.
 *
 * LOS EFECTOS VAN CON SU NUMERO. La tentacion era pintar "COMUNIDAD +++",
 * pero este juego ensena sus formulas en los tooltips desde F1 y cambiar de
 * criterio justo en la pantalla mas espectacular seria decirle al jugador que
 * aqui las cifras no se pueden mirar. El unico caso que se escribe con
 * palabras es el cero, porque "×0" se lee como un error y "nada" no.
 */
export function Irrupcion() {
  const evento = useGame((s) => s.game.evento)
  const ahorros = useGame((s) => s.game.ahorros)
  const marcar = useGame((s) => s.marcarEventoAnunciado)
  const preparar = useGame((s) => s.prepararEvento)
  const setPausaNarrativa = useGame((s) => s.setPausaNarrativa)

  const abierta = Boolean(evento && !evento.anunciado)

  /**
   * Mientras esto esta delante, el reloj no corre.
   *
   * Es la misma regla que las tarjetas de vida y las entradas de ciclo: el
   * tiempo que el jugador dedica a leer no puede consumirle partida. Y usa
   * `pausaNarrativa` y no `paused` para que cerrar esto no reanude una
   * partida que el jugador habia pausado a mano.
   */
  useEffect(() => {
    setPausaNarrativa(abierta)
    return () => setPausaNarrativa(false)
  }, [abierta, setPausaNarrativa])

  if (!evento || !abierta) return null

  const def = BIG_POR_ID.get(evento.id)
  const fase = faseActual(evento)
  if (!def || !fase) return null

  const prep = def.preparable
  const puedePrepararse =
    prep !== undefined &&
    !evento.preparado &&
    (fase.fase === 'anuncio' || fase.fase === 'preparacion')

  const efectos = efectosDeFase(fase)

  return (
    <div className="modal modal--irrupcion" role="dialog" aria-modal="true">
      <div className="irrupcion">
        <span className="irrupcion__cinta pixel">Momento extraordinario</span>

        <h2 className="irrupcion__nombre pixel">{def.nombre}</h2>
        <p className="irrupcion__fase">{fase.titulo}</p>
        <p className="irrupcion__texto">{fase.texto}</p>

        {efectos.length > 0 && (
          <ul className="irrupcion__efectos">
            {efectos.map((e) => (
              <li key={e.etiqueta} className="irrupcion__efecto" data-signo={e.signo}>
                <span className="irrupcion__efecto-nombre">{e.etiqueta}</span>
                <span className="irrupcion__efecto-valor data">{e.valor}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Semanas que dura la fase: sin esto, "prepararse" no tiene precio en
            tiempo y la decision se toma a ciegas. */}
        <p className="irrupcion__meta data">
          Fase {evento.fase + 1} de {def.fases.length} · {fase.semanas} sem
          {evento.preparado && ' · lo tienes preparado'}
        </p>

        <div className="irrupcion__acciones">
          {puedePrepararse && prep && (
            <button
              className="irrupcion__boton irrupcion__boton--preparar"
              onClick={preparar}
              disabled={ahorros < prep.coste}
              title={prep.texto}
            >
              Prepararlo · {eur(prep.coste)}
            </button>
          )}
          <button className="irrupcion__boton" onClick={marcar}>
            {puedePrepararse ? 'Ya veré' : 'Entendido'}
          </button>
        </div>

        {puedePrepararse && prep && <p className="irrupcion__nota">{prep.texto}</p>}
      </div>
    </div>
  )
}

interface Efecto {
  etiqueta: string
  valor: string
  signo: 'bueno' | 'malo' | 'nulo'
}

/**
 * Los multiplicadores de la fase, dichos en castellano.
 *
 * `afinidad` se traduce a "cuánta gente se queda" porque es lo que hace, y
 * porque el nombre interno no significa nada para quien juega. El cero del
 * solidario —ni una visita, ni un euro— es la mitad de lo que ese evento
 * quiere ensenar, asi que se escribe entero en vez de esconderse en un "×0".
 */
function efectosDeFase(fase: FaseDef): Efecto[] {
  const salida: Efecto[] = []

  const anadir = (etiqueta: string, mult: number | undefined, masEsMejor: boolean) => {
    if (mult === undefined || mult === 1) return
    if (mult === 0) {
      salida.push({ etiqueta, valor: 'nada', signo: 'nulo' })
      return
    }
    salida.push({
      etiqueta,
      valor: `×${mult % 1 === 0 ? mult : mult.toFixed(1)}`,
      signo: mult > 1 === masEsMejor ? 'bueno' : 'malo',
    })
  }

  anadir('Alcance', fase.alcance, true)
  anadir('Gente que se queda', fase.afinidad, true)
  anadir('Ingresos', fase.ingresos, true)
  anadir('Desgaste', fase.fatiga, false)

  return salida
}
