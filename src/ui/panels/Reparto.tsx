import { ACTIVITY_IDS, type ActivityId, type Allocation } from '../../sim/state.ts'
import { useGame } from '../../store.ts'

const ETIQUETA: Record<ActivityId, string> = {
  produccion: 'Producir',
  comunidad: 'Comunidad',
  vida: 'Vida',
  descanso: 'Descanso',
}

const AYUDA: Record<ActivityId, string> = {
  produccion: 'Grabar, editar, emitir. Trae alcance y cansa.',
  comunidad: 'Estar con la gente que ya te sigue. Convierte alcance en comunidad.',
  vida: 'Leer, cocinar, salir. Sube la calidad y genera ideas.',
  descanso: 'No hacer nada. Es lo unico que baja la fatiga de verdad.',
}

const TOKEN: Record<ActivityId, string> = {
  produccion: 'alcance',
  comunidad: 'comunidad',
  vida: 'vida',
  descanso: 'ideas',
}

/**
 * Reparto manual del tiempo. Solo existe a partir del ciclo 3.
 *
 * Es el mismo objeto `Allocation` que las mejoras venian rellenando por
 * detras durante los dos primeros ciclos: el jugador no estrena un sistema
 * nuevo, toma el control de unos numeros que ya movia sin verlos. Por eso al
 * abrirse arranca exactamente con el reparto que tenia.
 */
export function Reparto() {
  const desbloqueado = useGame((s) => s.game.allocationUnlocked)
  const allocation = useGame((s) => s.game.allocation)
  const setAllocation = useGame((s) => s.setAllocation)

  if (!desbloqueado) {
    return (
      <section className="reparto reparto--bloqueado">
        <h2 className="reparto__titulo">Tus horas</h2>
        <p className="reparto__aviso">
          De momento tus horas las deciden las prisas y lo que vas comprando. En el ciclo 3, cuando
          tengas tu trabajo sistematizado, podras repartirlas tu.
        </p>
        <Barras allocation={allocation} />
      </section>
    )
  }

  const cambiar = (id: ActivityId, valor: number) => {
    // No se normaliza aqui: se guarda el peso crudo y `normalizeAllocation`
    // reparte. Asi subir una barra no obliga a bajar otra a mano.
    setAllocation({ ...allocation, [id]: Math.max(0, valor) })
  }

  return (
    <section className="reparto">
      <h2 className="reparto__titulo">Tus horas</h2>
      <p className="reparto__aviso">
        Reparte la semana. Los valores se ajustan entre si: subir uno baja el resto en proporcion.
      </p>

      <div className="reparto__controles">
        {ACTIVITY_IDS.map((id) => (
          <label key={id} className="franja" title={AYUDA[id]}>
            <span className="franja__cabecera">
              <span className="franja__nombre" style={{ color: `var(--c-${TOKEN[id]})` }}>
                {ETIQUETA[id]}
              </span>
              <span className="franja__pct data">{Math.round(allocation[id] * 100)}%</span>
            </span>
            <input
              className="franja__control"
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(allocation[id] * 100)}
              onChange={(e) => cambiar(id, Number(e.target.value) / 100)}
              aria-label={`${ETIQUETA[id]}: ${AYUDA[id]}`}
            />
          </label>
        ))}
      </div>
    </section>
  )
}

/** Vista de solo lectura para los ciclos 1 y 2. */
function Barras({ allocation }: { allocation: Allocation }) {
  return (
    <div className="reparto__barras">
      {ACTIVITY_IDS.map((id) => (
        <span key={id} className="franja__pista" title={`${ETIQUETA[id]} — ${AYUDA[id]}`}>
          <span
            className="franja__relleno"
            style={{ width: `${allocation[id] * 100}%`, background: `var(--c-${TOKEN[id]})` }}
          />
          <span className="franja__leyenda">
            {ETIQUETA[id]} {Math.round(allocation[id] * 100)}%
          </span>
        </span>
      ))}
    </div>
  )
}
