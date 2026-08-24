import { nivelFatiga } from '../../sim/formulas.ts'
import { puedeIrseDeVacaciones } from '../../sim/descanso.ts'
import { TUNABLES } from '../../sim/tunables.ts'
import { useGame } from '../../store.ts'
import { pct } from '../../format.ts'

/**
 * PARAR ES UNA JUGADA, Y TIENE QUE PARECERLO.
 *
 * El aviso de fatiga decia "estás al límite" y ahi se acababa: para hacer
 * algo al respecto habia que saber que las vacaciones viven en la pestana de
 * Vida, entrar, y encontrar el boton. Un juego cuya tesis es que descansar
 * gana no puede esconder el boton de descansar detras de dos clics mientras
 * el de publicar esta permanentemente en pantalla.
 *
 * Asi que el aviso trae la decision puesta, y con sus numeros delante:
 * cuantas semanas cuesta, que se pierde y con que se vuelve. El GDD (6.4)
 * pide que las vacaciones sean siempre razonables y a menudo optimas; eso
 * solo es cierto si el jugador puede VER el intercambio en el momento en que
 * tiene que decidirlo.
 */
export function LlamadaParar() {
  const g = useGame((s) => s.game)
  const irDeVacaciones = useGame((s) => s.irDeVacaciones)

  const nivel = nivelFatiga(g.fatiga)
  if (nivel === 'ok' || g.descanso) return null

  const puede = puedeIrseDeVacaciones(g)
  const { semanas, semanasBonus } = TUNABLES.vacaciones

  return (
    <section className="parar" data-nivel={nivel}>
      <div className="parar__texto">
        <span className="parar__titulo pixel">{TITULO[nivel]}</span>
        <p className="parar__mensaje">{MENSAJE[nivel]}</p>
        <p className="parar__trato data">
          {semanas} semanas sin emitir · el alcance baja, la comunidad aguanta · vuelves con{' '}
          {semanasBonus} semanas de calidad y hype extra
        </p>
      </div>

      <div className="parar__accion">
        <span className="parar__fatiga data">Fatiga {pct(g.fatiga)}</span>
        <button
          className="parar__boton"
          onClick={irDeVacaciones}
          disabled={!puede}
          title={
            puede
              ? 'Tres semanas fuera. No es perder el sitio: es lo que hace que el sitio dure.'
              : 'Ahora mismo no puedes irte: hay algo en marcha que no admite ausencias.'
          }
        >
          Irse de vacaciones
        </button>
      </div>
    </section>
  )
}

const TITULO: Record<'aviso' | 'saturado' | 'critico', string> = {
  aviso: 'Llevas demasiadas horas',
  saturado: 'Estás al límite',
  critico: 'Esto ya no se sostiene',
}

/**
 * El aviso llega ANTES de la penalizacion.
 *
 * El GDD (6.5) pide que forzar tenga consecuencias, no que te pillen por
 * sorpresa: el jugador tiene que poder decidir parar, no enterarse de que era
 * tarde.
 */
const MENSAJE: Record<'aviso' | 'saturado' | 'critico', string> = {
  aviso: 'La calidad empieza a resentirse, y la calidad es lo que multiplica todo lo demás.',
  saturado: 'Si sigues así vas a parar igual, pero cinco semanas y perdiendo comunidad.',
  critico: 'Estás a nada del burnout. Parar ahora todavía lo eliges tú.',
}
