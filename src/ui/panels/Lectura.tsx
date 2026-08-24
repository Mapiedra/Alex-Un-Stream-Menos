import { LIBRO_POR_ID, NOMBRE_TEMA, SINERGIAS, type TemaLibro } from '../../content/books.ts'
import { porTema, sinergiasActivas } from '../../sim/lectura.ts'
import { useGame } from '../../store.ts'

/**
 * La mesilla.
 *
 * Leer no pasa gratis antes de dormir: cuesta franjas del dia a dia, y por eso
 * hay algo que enseñar — cuanto llevas de un libro, que has terminado y que ha
 * dejado. La coleccion no es una via de progresion paralela, es un poso: si
 * leer saliese a cuenta como estrategia dejaria de ser leer.
 */
export function Lectura() {
  const lectura = useGame((s) => s.game.lectura)

  const libro = lectura.libro ? LIBRO_POR_ID.get(lectura.libro) : null
  const progreso = libro ? Math.min(1, lectura.progreso / libro.paginas) : 0
  const cuenta = porTema(lectura.leidos)
  const activas = new Set(sinergiasActivas(lectura.leidos).map((s) => s.tema + s.minimo))

  return (
    <section className="lectura">
      <div className="lectura__cabecera">
        <span className="carrera__kicker">La mesilla</span>
        <h2 className="carrera__titulo">
          {libro ? libro.titulo : lectura.leidos.length > 0 ? 'Nada empezado' : 'Aún sin abrir nada'}
        </h2>
        <p className="carrera__objetivo">
          {libro
            ? `${libro.autor} · ${NOMBRE_TEMA[libro.tema]}. Avanza con las franjas de leer, y a medias con las de vivir.`
            : 'Pon una franja de leer en tu semana y empezarás uno. Terminarlo da ideas de golpe y unas semanas de tirar de lo leído.'}
        </p>
      </div>

      {libro && (
        <div className="lectura__barra" title={`${Math.round(progreso * 100)}% leído`}>
          <span style={{ width: `${progreso * 100}%` }} />
        </div>
      )}

      {lectura.leidos.length > 0 && (
        <div className="lectura__coleccion">
          <span className="carrera__kicker">Leídos ({lectura.leidos.length})</span>
          <ul className="lectura__lista">
            {lectura.leidos.map((id) => {
              const l = LIBRO_POR_ID.get(id)
              if (!l) return null
              return (
                <li key={id} className="lectura__leido" data-tema={l.tema} title={l.cierre}>
                  <span className="lectura__titulo">{l.titulo}</span>
                  <span className="lectura__tema data">{NOMBRE_TEMA[l.tema]}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <ul className="lectura__sinergias">
        {SINERGIAS.map((s) => (
          <li
            key={s.tema + s.minimo}
            className="requisito"
            data-cumplido={activas.has(s.tema + s.minimo)}
            title={s.descripcion}
          >
            <span className="requisito__marca">{activas.has(s.tema + s.minimo) ? '✓' : '·'}</span>
            <span className="requisito__texto">{s.etiqueta}</span>
            <span className="requisito__progreso data">
              {Math.min(cuenta[s.tema as TemaLibro], s.minimo)}/{s.minimo}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
