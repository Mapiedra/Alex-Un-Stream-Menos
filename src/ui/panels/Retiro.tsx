import { condicionesRetiro, cobertura, puedeRetirarse } from '../../sim/final.ts'
import { ULTIMO_CICLO } from '../../sim/cycles.ts'
import { TUNABLES } from '../../sim/tunables.ts'
import { useGame } from '../../store.ts'
import { useMemo } from 'react'

/**
 * El panel del retiro.
 *
 * Aparece en el ultimo ciclo, cuando la pregunta del juego deja de ser "como
 * crezco" y pasa a ser "cuando puedo parar". Ensena las ocho condiciones de la
 * seccion 11 abiertas, sin esconder ninguna: el jugador tiene que poder ver
 * que le falta y, sobre todo, entender que la ultima —sostenerlo trabajando
 * poco— es la que da sentido a las otras siete.
 */
export function Retiro() {
  const g = useGame((s) => s.game)
  const retirarse = useGame((s) => s.retirarse)

  const condiciones = useMemo(() => condicionesRetiro(g), [g])
  const cob = cobertura(g)
  const listo = puedeRetirarse(g)
  const cumplidas = condiciones.filter((c) => c.cumplido).length

  // Antes del ultimo ciclo esto solo seria ruido: aun no toca preguntarselo.
  if (g.cycle < ULTIMO_CICLO && !listo) return null

  return (
    <section className="retiro">
      <div className="retiro__cabecera">
        <span className="carrera__kicker">Poder parar</span>
        <h2 className="carrera__titulo">
          {listo ? 'Ya puedes dejarlo' : `${cumplidas} de ${condiciones.length}`}
        </h2>
        <p className="carrera__objetivo">
          {listo
            ? 'Las cuentas salen sin que tengas que producir nada nuevo, y llevas semanas sosteniéndolo. Puedes parar cuando quieras.'
            : 'Ganar no es facturar más: es que lo ya publicado y lo ahorrado te cubran sin trabajar. Y sostenerlo con pocas horas.'}
        </p>
      </div>

      <ul className="requisitos">
        {condiciones.map((c) => (
          <li key={c.clave} className="requisito" data-cumplido={c.cumplido}>
            <span className="requisito__marca">{c.cumplido ? '✓' : '·'}</span>
            <span className="requisito__texto">{c.texto}</span>
            <span className="requisito__progreso data">{Math.round(c.progreso * 100)}%</span>
          </li>
        ))}
      </ul>

      <p className="retiro__cobertura data" title="Rentas pasivas divididas entre tu coste de vida">
        Cobertura ×{cob.toFixed(2)} · sostenido{' '}
        {Math.min(g.semanasEnUmbral, TUNABLES.final.semanasSostenidas)} de{' '}
        {TUNABLES.final.semanasSostenidas} semanas
      </p>

      <button
        className="momentos__boton retiro__boton"
        onClick={retirarse}
        data-listo={listo}
        title={
          listo
            ? 'Cerrar la partida con el final que te has ganado'
            : 'Puedes dejarlo igualmente. No es perder: es el final por defecto.'
        }
      >
        {listo ? 'Retirarte' : 'Dejarlo aquí de todos modos'}
      </button>
    </section>
  )
}
