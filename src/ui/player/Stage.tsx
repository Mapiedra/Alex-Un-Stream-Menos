import avatar from '../../assets/avatar.png'

interface Props {
  /** 0..1 — cuanta actividad hay. Enciende los neones de la calle. */
  intensidad: number
  fatiga: number
  lloviendo: boolean
}

/**
 * La escena del directo.
 *
 * PLACEHOLDER: recrea con CSS la gramatica visual de la intro —purpura
 * profundo, rotulos de neon, cono de farola, lluvia— hasta que lleguen los
 * lotes L1 y L7 del artista. Se construye por capas a proposito: cuando entre
 * el pixel art de verdad, cada capa se sustituye por su sprite sin tocar el
 * resto de la aplicacion.
 */
export function Stage({ intensidad, fatiga, lloviendo }: Props) {
  return (
    <div className="stage" style={{ '--intensidad': intensidad } as React.CSSProperties}>
      <div className="stage__cielo" />
      <div className="stage__lejos" />
      <div className="stage__rotulos">
        <span className="stage__neon stage__neon--cian" />
        <span className="stage__neon stage__neon--rosa" />
        <span className="stage__neon stage__neon--verde" />
      </div>
      <div className="stage__farola">
        <span className="stage__bombilla" />
        <span className="stage__cono" />
      </div>
      <div className="stage__ventana" title="La luz calida: donde hay gente dentro" />
      <div className="stage__acera" />
      <div className="stage__figura" />
      {lloviendo && <div className="stage__lluvia" aria-hidden />}

      <figure className="webcam" data-cansado={fatiga > 0.6}>
        <img src={avatar} alt="El creador, en camara" width={96} height={96} />
      </figure>
    </div>
  )
}
