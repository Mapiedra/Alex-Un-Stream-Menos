import { useMemo } from 'react'
import avatar from '../../assets/avatar.png'
import { objetosVisibles } from '../../content/houseStages.ts'
import type { BloqueId } from '../../sim/semana.ts'

interface Props {
  /** 0..1 — cuanta actividad hay fuera. Enciende los neones de la calle. */
  intensidad: number
  fatiga: number
  /** Etapa de casa: cuantos objetos se ven en la habitacion. */
  etapaCasa: number
  /**
   * Que se esta haciendo en esta franja. `null` mientras se reparte la semana.
   *
   * No cambia el mobiliario ni añade capas: cambia la LUZ. La habitacion es la
   * misma a las once de la mañana editando que a las tres de la madrugada
   * durmiendo, y el juego se pasa la mitad del tiempo fuera de directo — una
   * escena que se ve igual haciendo las seis cosas convierte el reproductor en
   * un fondo de pantalla.
   */
  bloque?: BloqueId | null
  lloviendo: boolean
}

/**
 * La escena del directo: la habitacion, y la calle al otro lado de la ventana.
 *
 * Es la composicion que resume el juego entero. Dentro esta el interior, que
 * es calido y va creciendo con lo que compras; fuera esta la calle de la
 * intro, que es fria y ruidosa y no controlas. El alcance vive fuera; la
 * comunidad, en la luz de dentro.
 *
 * PLACEHOLDER: todo esto es CSS por capas hasta que lleguen los lotes L1 y L7
 * del artista. Se construye por capas a proposito — cada objeto es su propio
 * elemento posicionado — para que sustituir una capa por su sprite no obligue
 * a tocar el resto de la aplicacion.
 */
export function Stage({ intensidad, fatiga, etapaCasa, bloque, lloviendo }: Props) {
  const objetos = useMemo(() => new Set(objetosVisibles(etapaCasa)), [etapaCasa])
  const tiene = (id: string) => objetos.has(id)

  return (
    // La caja exterior rellena el hueco que le deje el reproductor; el marco
    // de dentro mantiene el 16:9 y se centra. Es lo que hace un reproductor de
    // verdad: si sobra ancho pone bandas a los lados, y si sobra alto, arriba
    // y abajo. Antes el 16:9 estaba en la caja exterior y por eso el video
    // crecia hasta desbordar la pantalla.
    <div className="stage">
      <div
        className="stage__marco"
        style={{ '--intensidad': intensidad } as React.CSSProperties}
        data-etapa={etapaCasa}
        data-bloque={bloque ?? undefined}
      >
        {/* Fondo de la habitacion */}
        <div className="stage__pared" />
        <div className="stage__suelo" />

        {/* La luz de la franja. Va ANTES que el mobiliario y no despues: tiñe
            la habitacion como la tiñe una lampara, no como la tapa un filtro
            de color puesto encima de todo. */}
        <div className="stage__ambiente" aria-hidden />

        {/* La ventana: la calle de la intro, vista desde dentro */}
        <div className="calle" title="Ahi fuera esta el alcance: ruidoso, frio y no lo controlas">
          <span className="calle__cielo" />
          <span className="calle__edificios" />
          <span className="calle__neon calle__neon--cian" />
          <span className="calle__neon calle__neon--rosa" />
          <span className="calle__farola">
            <span className="calle__bombilla" />
            <span className="calle__cono" />
          </span>
          {lloviendo && <span className="calle__lluvia" aria-hidden />}
        </div>

        {/* Mobiliario: aparece segun la etapa de casa. Cada objeto, una capa. */}
        <div className="cuarto">
          {tiene('mesa') && <span className="obj obj--mesa" title="La mesa" />}
          {tiene('pc') && <span className="obj obj--pc" title="El PC" />}
          {tiene('silla') && <span className="obj obj--silla" title="La silla buena" />}
          {tiene('lampara') && <span className="obj obj--lampara" title="Luz calida" />}
          {tiene('estanteria') && <span className="obj obj--estanteria" title="La estanteria" />}
          {tiene('segundaPantalla') && <span className="obj obj--pantalla2" title="Segunda pantalla" />}
          {tiene('micro') && <span className="obj obj--micro" title="El micro" />}
          {tiene('panelesAcusticos') && <span className="obj obj--paneles" title="Paneles acusticos" />}
          {tiene('biblioteca') && <span className="obj obj--biblioteca" title="La pared de libros" />}
          {tiene('sillon') && <span className="obj obj--sillon" title="El sillon de leer" />}
          {tiene('planta') && <span className="obj obj--planta" title="Una planta" />}
          {tiene('cocina') && <span className="obj obj--cocina" title="La cocina" />}
          {tiene('sofa') && <span className="obj obj--sofa" title="El sofa" />}
          {tiene('consola') && <span className="obj obj--consola" title="La consola" />}
          {tiene('cuadros') && <span className="obj obj--cuadros" title="Cuadros" />}
          {tiene('gato') && <span className="obj obj--gato" title="El gato" />}
        </div>

        <figure className="webcam" data-cansado={fatiga > 0.6}>
          <img src={avatar} alt="El creador, en camara" width={96} height={96} />
        </figure>
      </div>
    </div>
  )
}
