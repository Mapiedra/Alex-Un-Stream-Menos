import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { tokensToCssVars } from './ui/theme/palette.ts'
import './ui/theme/theme.css'

// Los tokens de color se inyectan desde palette.ts para que ningun hex tenga
// que escribirse en el CSS (ver la regla de paleta).
const style = document.createElement('style')
style.textContent = `:root {\n${tokensToCssVars()}\n}`
document.head.appendChild(style)

const root = document.getElementById('root')
if (!root) throw new Error('Falta #root en index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
