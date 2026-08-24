import avatar from '../../assets/avatar.png'
import { fmt } from '../../format.ts'

interface Props {
  titulo: string
  espectadores: number
  enDirecto: boolean
  /** Guardar y volver al menu. */
  onSalir: () => void
}

/** Cabecera del reproductor: quien emite, que emite y cuanta gente hay. */
export function PlayerHeader({ titulo, espectadores, enDirecto, onSalir }: Props) {
  return (
    <header className="player-header">
      <img className="player-header__avatar" src={avatar} alt="" width={40} height={40} />
      <div className="player-header__meta">
        <div className="player-header__canal">
          <span className="player-header__nick">alexelcapo</span>
          <span className="player-header__verificado" title="Canal verificado">
            ✓
          </span>
        </div>
        <div className="player-header__titulo">{titulo}</div>
      </div>
      <div className="player-header__estado">
        {enDirecto && <span className="badge-live">EN DIRECTO</span>}
        <span
          className="player-header__viewers data"
          title="Alcance: gente que te esta descubriendo ahora mismo"
        >
          ● {fmt(espectadores)}
        </span>

        {/* SALIR, DONDE SE BUSCA.
            Estaba al fondo de la pestana de Ayuda, debajo del panel de
            opciones: para dejar la partida habia que saber que vivia ahi. La
            cabecera del reproductor no se mueve nunca de la pantalla, y
            arriba a la derecha es donde todo el mundo va a buscar la salida.
            Guarda antes de salir, asi que no hay nada que confirmar. */}
        <button
          className="player-header__salir"
          onClick={onSalir}
          title="Guarda la partida y vuelve al menu"
        >
          Guardar y salir
        </button>
      </div>
    </header>
  )
}
