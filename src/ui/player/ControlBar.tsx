import { useEffect, useRef, useState } from 'react'
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
 *
 * TRES BOTONES, NO SEIS. La barra habia acumulado pausa, reloj, interruptor,
 * una cifra de material suelta y tres niveles de publicacion: ocho elementos en
 * una fila que a 900 px envolvia en dos lineas. Una barra de reproductor que
 * hay que leer entera para saber que se puede pulsar ha dejado de parecer una
 * barra de reproductor.
 *
 * Lo que se ha hecho NO es esconder nada, es ordenarlo por profundidad. Los
 * tres niveles viven ahora dentro de Publicar, que es donde se decide entre
 * ellos, y ahi caben ENTEROS —nombre, descripcion y coste— en vez de
 * comprimidos a una palabra y un numero. La decision que separa rendir hoy de
 * construir el final se leia peor apretada en la barra que abierta en su menu.
 *
 * El material no se va a ninguna parte: sigue en la barra, pegado al boton que
 * lo gasta. Ahi la cifra contesta una pregunta —¿me llega?— en vez de ser un
 * dato mas entre los del reloj.
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
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)

  /**
   * El menu se cierra solo al pulsar fuera o con Escape.
   *
   * Sin esto, un panel abierto tapa la esquina del chat hasta que el jugador
   * adivina que tiene que volver a pulsar el mismo boton. Un desplegable que no
   * se cierra como se cierran todos los desplegables es un fallo, no un estilo.
   */
  useEffect(() => {
    if (!abierto) return

    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  // Sin material no hay nada que publicar a ningun nivel: el boton se apaga
  // entero en vez de abrir un menu con las tres opciones en gris.
  const puedePublicar = NIVELES.some((n) => hayMaterial(material, n))

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

          <div className="publicar" ref={caja}>
            <button
              className="controles__publicar"
              onClick={() => setAbierto((v) => !v)}
              disabled={!puedePublicar}
              aria-expanded={abierto}
              aria-haspopup="menu"
              title={
                puedePublicar
                  ? 'Sacar un vídeo. Tú eliges con cuánto mimo.'
                  : 'No tienes material montado. Sale de las franjas de editar.'
              }
            >
              Publicar
              <span
                className="controles__material data"
                title="Vídeos montados y listos para subir"
              >
                {material.toFixed(1)}
              </span>
            </button>

            {abierto && (
              <div className="publicar__menu" role="menu" aria-label="Cómo sacarlo">
                {NIVELES.map((n) => (
                  <button
                    key={n}
                    className="publicar__nivel"
                    data-nivel={n}
                    role="menuitem"
                    onClick={() => {
                      onPublicar(n)
                      setAbierto(false)
                    }}
                    disabled={!hayMaterial(material, n)}
                  >
                    <span className="publicar__nombre">
                      {NOMBRE_NIVEL[n]}
                      <span className="publicar__coste data">{costeMaterial(n)} material</span>
                    </span>
                    <span className="publicar__desc">{DESCRIPCION_NIVEL[n]}</span>
                  </button>
                ))}
              </div>
            )}
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
