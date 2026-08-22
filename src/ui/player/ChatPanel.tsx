import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../sim/chat.ts'
import { NICK_COLORS } from '../theme/palette.ts'

interface Props {
  mensajes: ChatMessage[]
  suscriptores: number
}

/**
 * El chat.
 *
 * Es la comunidad hecha visible: el ritmo lo marca el alcance y las
 * suscripciones las marca la comunidad. Un canal con mucho alcance y poca
 * comunidad tiene un chat rapido y vacio; al reves, uno lento en el que la
 * gente se conoce. Deberia notarse sin leer una sola cifra.
 */
export function ChatPanel({ mensajes, suscriptores }: Props) {
  const fondo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = fondo.current
    if (el) el.scrollTop = el.scrollHeight
  }, [mensajes])

  return (
    <aside className="chat">
      <div className="chat__cabecera">
        <span>Chat del directo</span>
      </div>

      <div className="chat__mensajes" ref={fondo}>
        {mensajes.length === 0 && (
          <p className="chat__vacio">Todavia no hay nadie. Empieza a publicar.</p>
        )}
        {mensajes.map((m) => (
          <p key={m.id} className={`chat__linea chat__linea--${m.kind}`}>
            <span className="chat__nick" style={{ color: NICK_COLORS[m.color] }}>
              {m.nick}
            </span>
            <span className="chat__sep">: </span>
            <span className="chat__texto">{m.text}</span>
          </p>
        ))}
      </div>

      <div className="chat__pie">
        <span title="Comunidad: gente que sigue por ti, no por el juego">
          {Math.floor(suscriptores).toLocaleString('es-ES')} en la comunidad
        </span>
      </div>
    </aside>
  )
}
