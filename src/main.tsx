import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
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

const root = document.getElementById('root')
if (!root) throw new Error('Falta #root en index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
