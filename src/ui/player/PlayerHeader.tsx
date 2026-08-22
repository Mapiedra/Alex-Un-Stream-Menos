import avatar from '../../assets/avatar.png'
import { fmt } from '../../format.ts'

interface Props {
  titulo: string
  espectadores: number
  enDirecto: boolean
}

/** Cabecera del reproductor: quien emite, que emite y cuanta gente hay. */
export function PlayerHeader({ titulo, espectadores, enDirecto }: Props) {
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
      </div>
    </header>
  )
}
