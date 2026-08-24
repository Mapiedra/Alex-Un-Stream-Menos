import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { useGame } from './store.ts'
import { TOKENS, tokensToCssVars } from './ui/theme/palette.ts'
import './ui/theme/theme.css'
import './ui/theme/player.css'

// Los tokens de color se inyectan desde palette.ts para que ningun hex tenga
// que escribirse en el CSS (ver la regla de paleta).
const style = document.createElement('style')
style.textContent = `:root {\n${tokensToCssVars()}\n}`
document.head.appendChild(style)

// El color de la barra del navegador tambien sale de la paleta, no del HTML.
const themeColor = document.createElement('meta')
themeColor.name = 'theme-color'
themeColor.content = TOKENS.bgPanel
document.head.appendChild(themeColor)

/**
 * Puente de depuracion, SOLO en desarrollo.
 *
 * El bucle del juego va con requestAnimationFrame, que el navegador congela
 * cuando la pestana no esta compositando. Eso deja la partida clavada en el
 * segundo cero en cualquier entorno sin ventana visible —justo donde se
 * verifica esto por DOM— y hace imposible comprobar nada que dependa del paso
 * del tiempo. Con este enganche se puede empujar la simulacion a mano:
 *
 *   __juego.getState().advance(5000)
 *
 * Vite lo elimina del bundle de produccion junto con el resto del bloque.
 */
if (import.meta.env.DEV) {
  ;(globalThis as unknown as Record<string, unknown>)['__juego'] = useGame
}

const root = document.getElementById('root')
if (!root) throw new Error('Falta #root en index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
