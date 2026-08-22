import { useEffect } from 'react'
import { useGame } from '../store.ts'
import { TUNABLES } from '../sim/tunables.ts'

/**
 * Bucle de paso fijo.
 *
 * Acumula el tiempo real y lo consume en pasos exactos de TUNABLES.tickMs, con
 * tope de recuperacion: si la pestana estuvo en segundo plano un minuto, al
 * volver NO se simula ese minuto de golpe. Este juego no tiene progreso
 * offline: es una experiencia acotada, no un idle de meses.
 */
const MAX_STEPS_PER_FRAME = 5

export function GameLoop(): null {
  const advance = useGame((s) => s.advance)

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let accumulator = 0

    const frame = (now: number): void => {
      const delta = now - last
      last = now
      accumulator += delta

      let steps = 0
      while (accumulator >= TUNABLES.tickMs && steps < MAX_STEPS_PER_FRAME) {
        advance(TUNABLES.tickMs)
        accumulator -= TUNABLES.tickMs
        steps += 1
      }
      // Descarta el exceso en vez de arrastrarlo: evita el salto al volver.
      if (steps === MAX_STEPS_PER_FRAME) accumulator = 0

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [advance])

  return null
}
