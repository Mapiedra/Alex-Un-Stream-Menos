import {
  DESCRIPCION_NIVEL,
  NIVELES,
  NOMBRE_NIVEL,
  costeMaterial,
  hayMaterial,
  type NivelEdicion,
} from '../../sim/publicacion.ts'

interface Props {
  enPausa: boolean
  onTogglePausa: () => void
  /** 0..1 — avance dentro de la semana. */
  progresoSemana: number
  semana: number
  ciclo: number
  /** Que se esta haciendo ahora, y cuando. Vacio mientras se planifica. */
  franja: string | null
  /** Se esta emitiendo ahora mismo? */
  enDirecto: boolean
  /** Se puede tocar el interruptor del directo? No estando parado. */
  puedeEmitir: boolean
  onToggleDirecto: () => void
  /** Videos montados y listos para subir. */
  material: number
  clipActivo: boolean
  clipBonus: boolean
  onClip: () => void
  onPublicar: (nivel: NivelEdicion) => void
}

/**
 * Barra de controles del reproductor.
 *
 * Tres cosas que hasta F7 no existian o eran decorativas:
 *
 *   - EL INTERRUPTOR DEL DIRECTO. El canal ya no emite siempre. La semana dice
 *     que tardes toca; este boton decide el momento exacto de empezar y de
 *     cortar, y cortar convierte lo que queda de franja en descanso.
 *   - PUBLICAR CUESTA MATERIAL. Ya no es un boton infinito.
 *   - EL NIVEL DE EDICION. Sacarlo ya rinde hoy; cuidarlo construye el final.
 *
 * El boton Clip sigue siendo el momento clippeable del GDD (6.1): se enciende
 * solo cuando hay algo que capturar y da unos segundos holgados. Fallarlo
 * pierde el bonus, nunca progreso.
 */
export function ControlBar({
  enPausa,
  onTogglePausa,
  progresoSemana,
  semana,
  ciclo,
  franja,
  enDirecto,
  puedeEmitir,
  onToggleDirecto,
  material,
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
          {enPausa ? '▶' : '❙❙'}
        </button>

        <span className="controles__tiempo data">
          Ciclo {ciclo} · Semana {semana}
          {franja ? ` · ${franja}` : ' · repartiendo'}
        </span>

        {/* TODO LO QUE DECIDE EL JUGADOR, JUNTO Y A LA DERECHA.

            Antes estaba repartido: el interruptor del directo a la izquierda
            del reloj, publicar y clip al otro extremo, y en medio cifras que
            no se pulsan. Con las acciones mezcladas con la informacion, la
            barra parecia un panel de administracion y habia que leerla entera
            para saber que se podia tocar. Ahora la izquierda es estado y la
            derecha son decisiones. */}
        <div className="controles__derecha" role="group" aria-label="Acciones">
          <span className="controles__rotulo pixel">Acciones</span>

          <button
            className="controles__directo"
            data-endirecto={enDirecto}
            onClick={onToggleDirecto}
            disabled={!puedeEmitir}
            title={
              enDirecto
                ? 'Cortar el directo. Lo que quede de franja pasa a ser descanso.'
                : 'Empezar a emitir en esta franja, aunque no tocase.'
            }
          >
            {enDirecto ? 'Cortar el directo' : 'Empezar el directo'}
          </button>

          <span
            className="controles__material data"
            title="Vídeos montados y listos para subir. Salen de las franjas de editar."
          >
            Material {material.toFixed(1)}
          </span>

          <div className="publicar">
            {NIVELES.map((n) => (
              <button
                key={n}
                className="publicar__nivel"
                data-nivel={n}
                onClick={() => onPublicar(n)}
                disabled={!hayMaterial(material, n)}
                title={`${DESCRIPCION_NIVEL[n]} Cuesta ${costeMaterial(n)} de material.`}
              >
                {NOMBRE_NIVEL[n]}
                <span className="publicar__coste data">{costeMaterial(n)}</span>
              </button>
            ))}
          </div>

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
