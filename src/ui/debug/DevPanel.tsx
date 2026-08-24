import { useGame } from '../../store.ts'
import { TUNABLES } from '../../sim/tunables.ts'

const SPEEDS = [1, 4, 50]

/** Herramienta de desarrollo: recorrer 2 horas de partida en dos minutos. */
export function DevPanel() {
  const speed = useGame((s) => s.speedMultiplier)
  const paused = useGame((s) => s.paused)
  const setSpeed = useGame((s) => s.setSpeed)
  const setPaused = useGame((s) => s.setPaused)
  const reset = useGame((s) => s.reset)
  const week = useGame((s) => s.game.week)
  const elapsedMs = useGame((s) => s.game.elapsedMs)

  const minutes = (elapsedMs / 60000).toFixed(1)

  return (
    <div className="panel" style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
      <span className="pixel" style={{ fontSize: 'var(--pixel-s)', color: 'var(--c-textDim)' }}>
        dev
      </span>
      {SPEEDS.map((s) => (
        <button key={s} onClick={() => setSpeed(s)} disabled={speed === s}>
          x{s}
        </button>
      ))}
      <button onClick={() => setPaused(!paused)}>{paused ? 'seguir' : 'pausa'}</button>
      <button onClick={() => reset()}>reiniciar</button>
      <span className="data" style={{ color: 'var(--c-textDim)', marginLeft: 'auto' }}>
        semana {week} · {minutes} min sim · tick {TUNABLES.tickMs}ms
      </span>
    </div>
  )
}
