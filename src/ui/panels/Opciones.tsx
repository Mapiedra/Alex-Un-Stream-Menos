import { useEffect, useState } from 'react'

/**
 * Opciones y accesibilidad.
 *
 * Las tres primeras existen porque el juego dura dos horas y hay gente que no
 * puede jugarlo tal cual sale de fabrica: texto pequeno, animaciones que
 * marean, contraste insuficiente. El filtro CRT es lo contrario —puro capricho
 * estetico— y por eso viene apagado.
 *
 * Se guardan aparte de la partida: son preferencias de la persona, no del
 * personaje, y deben sobrevivir a empezar de cero.
 */

const CLAVE = 'lmhv.opciones'

export interface Preferencias {
  /** Escala del texto de la capa de datos. */
  textoGrande: boolean
  /** Corta animaciones aunque el sistema no lo pida. */
  sinAnimaciones: boolean
  /** Sube el contraste de los textos secundarios. */
  altoContraste: boolean
  /** Lineas de barrido sobre la escena. Capricho, apagado por defecto. */
  crt: boolean
}

const POR_DEFECTO: Preferencias = {
  textoGrande: false,
  sinAnimaciones: false,
  altoContraste: false,
  crt: false,
}

function cargar(): Preferencias {
  try {
    const raw = globalThis.localStorage?.getItem(CLAVE)
    if (!raw) return POR_DEFECTO
    return { ...POR_DEFECTO, ...(JSON.parse(raw) as Partial<Preferencias>) }
  } catch {
    return POR_DEFECTO
  }
}

export function Opciones() {
  const [prefs, setPrefs] = useState<Preferencias>(cargar)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    root.dataset['textoGrande'] = String(prefs.textoGrande)
    root.dataset['sinAnimaciones'] = String(prefs.sinAnimaciones)
    root.dataset['altoContraste'] = String(prefs.altoContraste)
    root.dataset['crt'] = String(prefs.crt)
    try {
      globalThis.localStorage?.setItem(CLAVE, JSON.stringify(prefs))
    } catch {
      // Modo privado: se juega igual, solo no se recuerdan las preferencias.
    }
  }, [prefs])

  const alternar = (clave: keyof Preferencias) =>
    setPrefs((p) => ({ ...p, [clave]: !p[clave] }))

  return (
    <section className="opciones">
      <button
        className="opciones__toggle"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
      >
        {abierto ? 'Cerrar opciones' : 'Opciones y accesibilidad'}
      </button>

      {abierto && (
        <div className="opciones__lista">
          <Casilla
            activa={prefs.textoGrande}
            onChange={() => alternar('textoGrande')}
            etiqueta="Texto más grande"
            ayuda="Sube el tamaño de cifras y textos largos. La capa de píxeles no cambia: solo escala en múltiplos exactos."
          />
          <Casilla
            activa={prefs.sinAnimaciones}
            onChange={() => alternar('sinAnimaciones')}
            etiqueta="Sin animaciones"
            ayuda="Corta la lluvia, el parpadeo del botón de clip y las transiciones. Si tu sistema ya pide movimiento reducido, esto ya está aplicado."
          />
          <Casilla
            activa={prefs.altoContraste}
            onChange={() => alternar('altoContraste')}
            etiqueta="Más contraste"
            ayuda="Aclara los textos secundarios, que sobre el fondo oscuro pueden quedarse cortos."
          />
          <Casilla
            activa={prefs.crt}
            onChange={() => alternar('crt')}
            etiqueta="Filtro CRT"
            ayuda="Líneas de barrido sobre la escena. Puro capricho estético."
          />

          <p className="opciones__nota">
            El juego se puede terminar sin acertar un solo momento clippeable. No hay nada que
            dependa de la velocidad de reacción.
          </p>
        </div>
      )}
    </section>
  )
}

interface CasillaProps {
  activa: boolean
  onChange: () => void
  etiqueta: string
  ayuda: string
}

function Casilla({ activa, onChange, etiqueta, ayuda }: CasillaProps) {
  return (
    <label className="casilla">
      <input type="checkbox" checked={activa} onChange={onChange} />
      <span>
        <span className="casilla__etiqueta">{etiqueta}</span>
        <span className="casilla__ayuda">{ayuda}</span>
      </span>
    </label>
  )
}
