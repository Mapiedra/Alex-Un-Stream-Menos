import { useState } from 'react'
import {
  BLOQUE_A_ACTIVIDAD,
  BLOQUE_IDS,
  BLOQUES_POR_SEMANA,
  NOMBRE_BLOQUE,
  NOMBRE_DIA,
  NOMBRE_FRANJA,
  contarBloques,
  type BloqueId,
} from '../../sim/semana.ts'
import { TUNABLES } from '../../sim/tunables.ts'
import { useGame } from '../../store.ts'

/**
 * El planificador de la semana.
 *
 * Aqui es donde el tiempo dejo de ser un rio. La semana son 21 franjas y cada
 * una se gasta en una cosa; cuando se acaban, se acabo el periodo y hay que
 * volver a repartir. La toma de decisiones es una pausa.
 *
 * Sustituye a los sliders de reparto, que pedian un porcentaje abstracto. Es
 * el mismo objeto `Allocation` por debajo —21 franjas son 21 fracciones— pero
 * colocar el martes por la tarde se entiende sin explicacion, y un porcentaje
 * no.
 *
 * En los ciclos 1-2 la rejilla se ve pero no se toca: la semana la planifican
 * las mejoras compradas. No es una version recortada del panel, es la primera
 * mitad de la misma idea.
 */
export function Planificador() {
  const semana = useGame((s) => s.game.semana)
  const desbloqueado = useGame((s) => s.game.allocationUnlocked)
  const descanso = useGame((s) => s.game.descanso)
  const planificar = useGame((s) => s.planificar)
  const llenarSemanaCon = useGame((s) => s.llenarSemanaCon)
  const vivirSemana = useGame((s) => s.vivirSemana)

  const [pincel, setPincel] = useState<BloqueId>('emitir')
  const [pintando, setPintando] = useState(false)

  const planificando = semana.fase === 'planificando'
  const editable = planificando && desbloqueado
  const cuenta = contarBloques(semana.bloques)

  const pintar = (indice: number) => {
    if (!editable) return
    planificar(indice, pincel)
  }

  return (
    <section className="planificador" data-fase={semana.fase}>
      <div className="planificador__cabecera">
        <span className="carrera__kicker">Tu semana</span>
        <h2 className="carrera__titulo">
          {planificando ? 'Reparte las 21 franjas' : 'Viviendo la semana'}
        </h2>
        <p className="carrera__objetivo">
          {mensaje(planificando, desbloqueado, descanso !== null)}
        </p>
      </div>

      {editable && (
        <div className="paleta" role="radiogroup" aria-label="Qué colocar">
          {BLOQUE_IDS.map((b) => (
            <button
              key={b}
              className="paleta__pincel"
              data-bloque={b}
              data-activo={pincel === b}
              role="radio"
              aria-checked={pincel === b}
              onClick={() => setPincel(b)}
              onDoubleClick={() => llenarSemanaCon(b)}
              title={`${AYUDA[b]} (doble clic: toda la semana)`}
            >
              <span className="paleta__nombre">{NOMBRE_BLOQUE[b]}</span>
              <span className="paleta__cuenta data">{cuenta[b]}</span>
            </button>
          ))}
        </div>
      )}

      <div
        className="rejilla"
        onPointerUp={() => setPintando(false)}
        onPointerLeave={() => setPintando(false)}
      >
        <div className="rejilla__esquina" />
        {NOMBRE_DIA.map((d) => (
          <span key={d} className="rejilla__dia pixel">
            {d}
          </span>
        ))}

        {NOMBRE_FRANJA.map((nombreFranja, franja) => (
          <FilaFranja
            key={nombreFranja}
            nombre={nombreFranja}
            franja={franja}
            semana={semana}
            editable={editable}
            pintando={pintando}
            onEmpezar={(i) => {
              setPintando(true)
              pintar(i)
            }}
            onEntrar={pintar}
          />
        ))}
      </div>

      {planificando && (
        <button className="planificador__vivir" onClick={vivirSemana}>
          Vivir la semana
        </button>
      )}
    </section>
  )
}

interface FilaProps {
  nombre: string
  franja: number
  semana: { bloques: BloqueId[]; cursor: number; fase: string }
  editable: boolean
  pintando: boolean
  onEmpezar: (indice: number) => void
  onEntrar: (indice: number) => void
}

/**
 * Una fila de la rejilla: la misma franja de los siete dias.
 *
 * Se recorre por franja y no por dia porque asi la rejilla se lee como un
 * horario de verdad: la fila de la noche entera de un vistazo.
 */
function FilaFranja({ nombre, franja, semana, editable, pintando, onEmpezar, onEntrar }: FilaProps) {
  const franjas = TUNABLES.semana.franjasPorDia

  return (
    <>
      <span className="rejilla__franja pixel">{nombre}</span>
      {NOMBRE_DIA.map((dia, d) => {
        const indice = d * franjas + franja
        if (indice >= BLOQUES_POR_SEMANA) return null
        const bloque = semana.bloques[indice] ?? 'dormir'
        const enCurso = semana.fase === 'viviendo' && semana.cursor === indice

        return (
          <button
            key={dia}
            className="rejilla__celda"
            data-bloque={bloque}
            data-actividad={BLOQUE_A_ACTIVIDAD[bloque]}
            data-encurso={enCurso}
            disabled={!editable}
            onPointerDown={() => onEmpezar(indice)}
            onPointerEnter={() => pintando && onEntrar(indice)}
            title={`${dia} · ${nombre} — ${NOMBRE_BLOQUE[bloque]}`}
            aria-label={`${dia} ${nombre}: ${NOMBRE_BLOQUE[bloque]}`}
          >
            <span className="rejilla__etiqueta">{NOMBRE_BLOQUE[bloque]}</span>
          </button>
        )
      })}
    </>
  )
}

function mensaje(planificando: boolean, desbloqueado: boolean, parado: boolean): string {
  if (parado) return 'Estás parado. Estas semanas pasan solas: de eso se trata.'
  if (!planificando) return 'La semana está en marcha. Al acabarse volverás a repartir.'
  if (!desbloqueado) {
    return 'De momento tu semana la deciden las prisas y lo que vas comprando. En el ciclo 3, con tu trabajo sistematizado, la repartirás tú.'
  }
  return 'Elige qué poner y píntalo sobre la rejilla. Arrastra para varias franjas seguidas; doble clic en la paleta llena la semana entera.'
}

const AYUDA: Record<BloqueId, string> = {
  emitir: 'En directo: trae alcance, mueve el chat y da ingresos. Cansa.',
  editar: 'Producir sin emitir: no trae gente, pero deja material que publicar.',
  comunidad: 'Estar con los que ya están. Convierte alcance en comunidad.',
  leer: 'Leer de verdad, con horas del día. Genera ideas y da de qué hablar.',
  vida: 'Cocinar, salir, ver algo. Sube la calidad y genera ideas.',
  dormir: 'Lo único que baja la fatiga de verdad.',
}
