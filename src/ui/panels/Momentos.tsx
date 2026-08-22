import { BIG_POR_ID } from '../../content/bigEvents.ts'
import { faseActual } from '../../sim/bigEvents.ts'
import { useGame } from '../../store.ts'
import { eur } from '../../format.ts'

/**
 * Momentos extraordinarios y descanso.
 *
 * Reune las dos cosas que rompen la rutina de la partida: el evento raro que
 * te cae encima y la decision de parar. Estan juntas a proposito, porque son
 * las dos caras del mismo asunto — cuando aprietas y cuando sueltas.
 */
export function Momentos() {
  const evento = useGame((s) => s.game.evento)
  const descanso = useGame((s) => s.game.descanso)
  const ahorros = useGame((s) => s.game.ahorros)
  const fatiga = useGame((s) => s.game.fatiga)
  const vacacionesCompletadas = useGame((s) => s.game.vacacionesCompletadas)
  const legadoEficiencia = useGame((s) => s.game.legadoEficiencia)
  const legadoRetencion = useGame((s) => s.game.legadoRetencion)
  const puedeParar = useGame((s) => s.game.descanso === null && s.game.evento?.id !== 'conferencia')
  const irDeVacaciones = useGame((s) => s.irDeVacaciones)
  const preparar = useGame((s) => s.prepararEvento)

  const def = evento ? BIG_POR_ID.get(evento.id) : null
  const fase = faseActual(evento)
  const prep = def?.preparable
  const puedePrepararse =
    prep !== undefined &&
    evento !== null &&
    !evento.preparado &&
    (fase?.fase === 'anuncio' || fase?.fase === 'preparacion')

  return (
    <section className="momentos">
      <div className="momentos__col">
        <span className="carrera__kicker">Momentos</span>
        {evento && def && fase ? (
          <>
            <h2 className="carrera__titulo">{fase.titulo}</h2>
            <p className="carrera__objetivo">{fase.texto}</p>
            <p className="momentos__meta data">
              {def.nombre} · fase {evento.fase + 1} de {def.fases.length} ·{' '}
              {evento.semanasRestantes} sem
              {evento.preparado && ' · preparado'}
            </p>

            {puedePrepararse && (
              <>
                <p className="carrera__objetivo">{prep.texto}</p>
                <button
                  className="momentos__boton"
                  onClick={preparar}
                  disabled={ahorros < prep.coste}
                  title="Prepararse no es obligatorio: llegar sin preparar funciona igual, solo rinde menos y cansa mas"
                >
                  Prepararlo · {eur(prep.coste)}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="carrera__titulo">Nada a la vista</h2>
            <p className="carrera__objetivo">
              Los eventos grandes son raros y no dependen de ti. Tampoco hacen falta para llegar
              lejos: ayudan si caen, pero la carrera se construye con lo de todos los días.
            </p>
          </>
        )}
      </div>

      <div className="momentos__col">
        <span className="carrera__kicker">Parar</span>
        {descanso ? (
          <>
            <h2 className="carrera__titulo">
              {descanso.tipo === 'vacaciones' ? 'De vacaciones' : 'Parada obligada'}
            </h2>
            <p className="carrera__objetivo">
              {descanso.tipo === 'vacaciones'
                ? 'No se emite. El alcance baja, pero la comunidad aguanta y vuelves con ganas.'
                : 'No has parado a tiempo y ahora paras a la fuerza. Se recupera, pero cuesta más.'}
            </p>
            <div className="momentos__barra" data-tipo={descanso.tipo}>
              <span
                style={{
                  width: `${(1 - descanso.semanasRestantes / descanso.semanasTotales) * 100}%`,
                }}
              />
            </div>
            <p className="momentos__meta data">
              {descanso.semanasRestantes} de {descanso.semanasTotales} semanas
            </p>
          </>
        ) : (
          <>
            <h2 className="carrera__titulo">Tomarte unas semanas</h2>
            <p className="carrera__objetivo">
              Tres semanas sin emitir. Bajará el alcance —menos cuanta más comunidad tengas— y
              recuperarás fatiga, vida e ideas. Al volver, unas semanas de calidad y hype extra.
            </p>
            <button
              className="momentos__boton"
              onClick={irDeVacaciones}
              disabled={!puedeParar}
              data-urgente={fatiga > 0.6}
            >
              Irse de vacaciones
            </button>
          </>
        )}

        {vacacionesCompletadas > 0 && (
          <p className="momentos__legado data" title="Cerrar un ciclo habiendo descansado consolida Legado permanente">
            Legado · eficiencia ×{legadoEficiencia.toFixed(2)} · retención ×
            {legadoRetencion.toFixed(2)}
          </p>
        )}
      </div>
    </section>
  )
}
