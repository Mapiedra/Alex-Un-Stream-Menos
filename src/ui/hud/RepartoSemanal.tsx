import {
  BLOQUES_POR_SEMANA,
  BLOQUE_IDS,
  NOMBRE_BLOQUE,
  contarBloques,
  type BloqueId,
} from '../../sim/semana.ts'

/**
 * EN QUE SE TE VA EL TIEMPO.
 *
 * Esta es, probablemente, la interfaz que mejor cuenta de que va el juego. La
 * rejilla del planificador dice DONDE cae cada franja —el martes por la
 * tarde, el domingo por la noche— y eso hace falta para colocarlas; pero la
 * pregunta que decide la partida no es donde, es CUANTO: ocho franjas de
 * emitir contra cuatro de emitir, dos de leer y dos de dormir.
 *
 * Puesta al lado de la rejilla, el jugador ve las dos cosas a la vez y puede
 * descubrir solo lo que el juego lleva queriendo decir desde el minuto uno:
 * que mas horas de directo no son mejores horas de directo.
 *
 * Se mide en franjas y no en horas a proposito. Una franja son ocho horas de
 * un dia real y decir "56 h de stream" seria mentir sobre lo que representa
 * el modelo; el jugador reparte franjas, y en franjas se le cuenta.
 */

interface Props {
  bloques: readonly BloqueId[]
  /** Encabezado. Cambia segun se este planificando o mirando hacia atras. */
  titulo: string
  /** En el balance, la semana ya no se toca: sobra la ayuda de cada barra. */
  compacto?: boolean
}

export function RepartoSemanal({ bloques, titulo, compacto = false }: Props) {
  const cuenta = contarBloques(bloques)
  // La barra mas larga marca la escala. Con el total fijo, una semana normal
  // pinta seis barras cortas y no se distingue nada de nada.
  const tope = Math.max(1, ...BLOQUE_IDS.map((b) => cuenta[b]))

  return (
    <section className="reparto-semanal" data-compacto={compacto}>
      <span className="carrera__kicker">{titulo}</span>

      <ul className="reparto-semanal__lista">
        {BLOQUE_IDS.map((b) => (
          <li key={b} className="reparto-semanal__fila" data-vacia={cuenta[b] === 0}>
            <span className="reparto-semanal__nombre pixel">{NOMBRE_BLOQUE[b]}</span>
            <span className="reparto-semanal__pista">
              <span
                className="reparto-semanal__relleno"
                data-bloque={b}
                style={{ width: `${(cuenta[b] / tope) * 100}%` }}
              />
            </span>
            <span className="reparto-semanal__cuenta data">{cuenta[b]}</span>
          </li>
        ))}
      </ul>

      {!compacto && (
        <p className="reparto-semanal__pie data">
          {BLOQUES_POR_SEMANA} franjas. Lo que no colocas, se duerme.
        </p>
      )}
    </section>
  )
}
