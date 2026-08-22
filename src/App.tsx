import { GameLoop } from './ui/GameLoop.tsx'
import { DevPanel } from './ui/debug/DevPanel.tsx'
import { ResourceRow } from './ui/components/ResourceRow.tsx'
import { useGame } from './store.ts'
import { eur, fmt, pct } from './format.ts'
import { houseLivingCost } from './sim/state.ts'
import { TUNABLES } from './sim/tunables.ts'

export function App() {
  const g = useGame((s) => s.game)
  const publish = useGame((s) => s.publish)

  const costeVidaSemanal = houseLivingCost(g.houseStage)
  const ingresosSemanales = g.ingresosPorSegundo * TUNABLES.secondsPerWeek

  return (
    <div
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 'var(--space-6)',
        display: 'grid',
        gap: 'var(--space-4)',
      }}
    >
      <GameLoop />

      <h1 className="pixel" style={{ fontSize: 'var(--px-24)', color: 'var(--c-textBright)', margin: 0 }}>
        La maquina de hacer videos
      </h1>

      <DevPanel />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="panel">
          <ResourceRow
            label="Alcance"
            value={fmt(g.alcance)}
            token="alcance"
            hint="Gente que te descubre ahora. Sube rapido y cae con facilidad; la comunidad frena esa caida."
          />
          <ResourceRow
            label="Comunidad"
            value={fmt(g.comunidad)}
            token="comunidad"
            hint="Gente que sigue por ti. Crece lento y protege cuando paras."
          />
          <ResourceRow
            label="Calidad"
            value={g.calidad.toFixed(2)}
            token="calidad"
            hint="base x f(vida) x (1 - fatiga)^1.5 x mejoras. Multiplica el rendimiento por hora."
          />
          <ResourceRow label="Vida" value={pct(g.vida)} token="vida" hint="Equilibrio personal. Alimenta calidad e ideas." />
          <ResourceRow
            label="Fatiga"
            value={pct(g.fatiga)}
            token="fatiga"
            hint="Por encima del 60% la calidad sufre; del 85%, burnout. Cuesta caro, pero nunca termina la partida."
          />
          <ResourceRow label="Hype" value={`x${(1 + g.hype).toFixed(2)}`} token="hype" hint="Multiplicador temporal. Decae rapido." />
          <ResourceRow label="Ideas" value={fmt(g.ideas, 1)} token="ideas" hint="Materia prima de los formatos nuevos. La genera la vida personal." />
        </div>

        <div className="panel">
          <ResourceRow label="Ahorros" value={eur(g.ahorros)} token="ingresos" hint="Lo que NO gastaste en mejoras. Es tu via de retiro." />
          <ResourceRow label="Ingresos" value={`${eur(ingresosSemanales, 1)}/sem`} token="ingresos" hint="Alcance + comunidad + cola larga del catalogo." />
          <ResourceRow label="Coste de vida" value={`${eur(costeVidaSemanal)}/sem`} token="fatiga" hint="Sube con cada etapa de casa: profesionalizarse encarece retirarse." />
          <ResourceRow label="Catalogo" value={`${fmt(g.publicacionesTotales)} pub.`} token="calidad" hint="Cada publicacion renta para siempre, tanto mas cuanta mas calidad tenia." />

          <div style={{ marginTop: 'var(--space-4)' }}>
            <button onClick={publish} style={{ width: '100%', fontSize: 'var(--px-16)', padding: 'var(--space-3)' }}>
              Publicar video
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
