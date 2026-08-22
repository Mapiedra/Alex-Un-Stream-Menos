import { CYCLE_POR_NUMERO, ULTIMO_CICLO, requisitosDelCiclo } from '../../sim/cycles.ts'
import { houseStage } from '../../content/houseStages.ts'
import { useGame } from '../../store.ts'
import { fmt } from '../../format.ts'

/**
 * Donde esta el jugador en su carrera.
 *
 * Reune las tres cosas que le dicen por donde va sin tener que interpretar
 * cifras sueltas: el ciclo actual y lo que le falta para cerrarlo, la etapa de
 * casa con lo que cuesta mantenerla, y los modificadores temporales que tenga
 * activos por las tarjetas de vida.
 */
export function Carrera() {
  const g = useGame((s) => s.game)
  const ciclo = CYCLE_POR_NUMERO.get(g.cycle)
  const casa = houseStage(g.houseStage)
  const reqs = requisitosDelCiclo(g)

  return (
    <section className="carrera">
      <div className="carrera__ciclo">
        <span className="carrera__kicker">
          Ciclo {g.cycle} de {ULTIMO_CICLO}
        </span>
        <h2 className="carrera__titulo">{ciclo?.nombre}</h2>
        <p className="carrera__objetivo">{ciclo?.objetivo}</p>

        {reqs.length > 0 ? (
          <ul className="requisitos">
            {reqs.map((r) => (
              <li key={r.clave} className="requisito" data-cumplido={r.cumplido}>
                <span className="requisito__marca">{r.cumplido ? '✓' : '·'}</span>
                <span className="requisito__texto">{r.texto}</span>
                <span className="requisito__progreso data">
                  {fmt(Math.min(r.actual, r.minimo), r.clave === 'calidad' ? 1 : 0)} /{' '}
                  {fmt(r.minimo, r.clave === 'calidad' ? 1 : 0)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="carrera__objetivo">Ultima etapa. Ya no hay nada que desbloquear.</p>
        )}
      </div>

      <div className="carrera__casa">
        <span className="carrera__kicker">Tu casa</span>
        <h2 className="carrera__titulo">{casa.nombre}</h2>
        <p className="carrera__objetivo">{casa.descripcion}</p>
        <p className="carrera__coste data" title="Cada etapa mejora la vida y encarece retirarse">
          Coste de vida: {casa.costeVida} €/semana
        </p>

        {g.modificadores.length > 0 && (
          <ul className="modificadores">
            {g.modificadores.map((m) => (
              <li key={m.id} className="modificador">
                {m.etiqueta}
                <span className="modificador__semanas data">
                  {' '}
                  · {Math.max(0, m.hastaSemana - g.week)} sem
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
