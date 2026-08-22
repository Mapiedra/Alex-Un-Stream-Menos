interface Props {
  enPausa: boolean
  onTogglePausa: () => void
  /** 0..1 — avance dentro de la semana. */
  progresoSemana: number
  semana: number
  ciclo: number
  clipActivo: boolean
  clipBonus: boolean
  onClip: () => void
  onPublicar: () => void
}

/**
 * Barra de controles del reproductor.
 *
 * El boton Clip NO es adorno: es el momento clippeable del GDD (6.1). Se
 * enciende solo cuando hay algo que capturar y da unos segundos holgados para
 * reaccionar. Fallarlo pierde el bonus, nunca progreso.
 */
export function ControlBar({
  enPausa,
  onTogglePausa,
  progresoSemana,
  semana,
  ciclo,
  clipActivo,
  clipBonus,
  onClip,
  onPublicar,
}: Props) {
  return (
    <div className="controles">
      <div className="controles__barra">
        <div className="controles__progreso" style={{ width: `${progresoSemana * 100}%` }} />
      </div>

      <div className="controles__fila">
        <button
          className="controles__icono"
          onClick={onTogglePausa}
          aria-label={enPausa ? 'Reanudar' : 'Pausar'}
        >
          {enPausa ? '▶' : '❚❚'}
        </button>

        <span className="controles__tiempo data">
          Ciclo {ciclo} · Semana {semana}
        </span>

        <div className="controles__derecha">
          <button className="controles__publicar" onClick={onPublicar}>
            Publicar vídeo
          </button>

          <button
            className="controles__clip"
            data-activo={clipActivo}
            data-bonus={clipBonus}
            onClick={onClip}
            disabled={!clipActivo}
            title={
              clipActivo
                ? 'Momento clippeable. Tienes unos segundos.'
                : 'Se enciende cuando pasa algo que merece un clip'
            }
          >
            ✂ Clip
          </button>
        </div>
      </div>
    </div>
  )
}
