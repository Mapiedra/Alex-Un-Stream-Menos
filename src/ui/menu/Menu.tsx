import { useState } from 'react'
import { useGame } from '../../store.ts'
import { Ayuda } from '../panels/Ayuda.tsx'
import { Opciones } from '../panels/Opciones.tsx'
import { fmt } from '../../format.ts'

/**
 * La pantalla de inicio.
 *
 * Existe porque hasta F7 no habia ninguna: el juego cargaba el guardado y
 * empezaba a correr en el primer frame, sin que el jugador supiera cuando
 * empezaba la partida ni como acabarla. Aqui se decide.
 *
 * Visualmente es el reproductor apagado: mismo marco, mismo 16:9, pero sin
 * directo. El juego no cambia de piel para enseñar un menu.
 */
export function Menu() {
  const hayGuardado = useGame((s) => s.hayGuardado)
  const g = useGame((s) => s.game)
  const avisoCarga = useGame((s) => s.avisoCarga)
  const nuevaPartida = useGame((s) => s.nuevaPartida)
  const continuar = useGame((s) => s.continuar)

  const [confirmando, setConfirmando] = useState(false)
  const [ayuda, setAyuda] = useState(false)

  const empezar = () => {
    // Empezar de cero borra el guardado: se pregunta antes, una sola vez.
    if (hayGuardado && !confirmando) {
      setConfirmando(true)
      return
    }
    nuevaPartida()
  }

  return (
    <div className="menu">
      <div className="menu__marco">
        <header className="menu__cabecera">
          <span className="menu__kicker pixel">Proyecto de fan, no oficial</span>
          <h1 className="menu__titulo pixel">Alex: Un Stream Menos</h1>
          <p className="menu__pitch">
            Empiezas con un micro prestado y ninguna certeza. Repartes las 21 franjas de tu
            semana entre emitir, editar, estar con tu gente, leer, vivir y dormir. Creces, te
            cansas, aprendes a parar.
          </p>
          <p className="menu__pitch">
            No se puede perder. La partida acaba cuando decides que ya puedes dejarlo — y cuánto
            te cueste llegar ahí depende de cómo hayas repartido las horas.
          </p>
        </header>

        {/* El descargo va en la pantalla de inicio, no escondido en el
            README: el juego usa el nombre de una persona real y lo primero que
            tiene que quedar claro es que esto no es suyo. */}
        <p className="menu__descargo">
          <strong>Proyecto de fan, no oficial.</strong> No está afiliado a AlexElCapo / EVILAFM ni
          cuenta con su respaldo, ni ha participado en su desarrollo. Se inspira en rasgos públicos
          de su contenido y su trayectoria; no reconstruye su vida privada, ni fechas, ni cifras
          reales. Todo lo que pasa aquí dentro es ficción.
        </p>

        {avisoCarga && <p className="aviso aviso--error">{avisoCarga}</p>}

        <div className="menu__opciones">
          {hayGuardado && !confirmando && (
            <button className="menu__boton menu__boton--principal" onClick={continuar}>
              Continuar
              <span className="menu__boton-nota data">
                Ciclo {g.cycle} · semana {g.week} · {fmt(g.comunidad)} de comunidad
              </span>
            </button>
          )}

          {confirmando ? (
            <>
              <p className="menu__aviso">
                Tienes una partida en la semana {g.week}. Empezar otra la borra y no se puede
                recuperar.
              </p>
              <button className="menu__boton menu__boton--peligro" onClick={() => nuevaPartida()}>
                Borrarla y empezar de cero
              </button>
              <button className="menu__boton" onClick={() => setConfirmando(false)}>
                Mejor no
              </button>
            </>
          ) : (
            <button
              className={`menu__boton${hayGuardado ? '' : ' menu__boton--principal'}`}
              onClick={empezar}
            >
              Nueva partida
            </button>
          )}

          {!confirmando && (
            <button className="menu__boton" onClick={() => setAyuda((a) => !a)}>
              {ayuda ? 'Cerrar' : 'Cómo se juega'}
            </button>
          )}
        </div>

        {ayuda && !confirmando && <Ayuda />}

        <Opciones />
      </div>
    </div>
  )
}
