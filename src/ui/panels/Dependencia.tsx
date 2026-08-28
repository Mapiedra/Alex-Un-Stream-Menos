import { useMemo } from 'react'
import { BLOQUES_POR_SEMANA } from '../../sim/semana.ts'
import { dependenciaDelDirecto, type Dependencia as Datos } from '../../sim/dependencia.ts'
import { useGame } from '../../store.ts'
import { pct } from '../../format.ts'

/**
 * UN STREAM MENOS — el objetivo del juego, delante desde la semana uno.
 *
 * El titulo del juego es una mecanica y hasta ahora no se veia por ninguna
 * parte. Las condiciones del final estaban todas dentro del panel del Retiro,
 * que solo aparece en el ultimo ciclo: durante las primeras cuarenta semanas
 * el jugador sabia que crecia, pero no hacia donde.
 *
 * Las dos barras cuentan las dos mitades de la tesis y hay que verlas juntas:
 *
 *   ARRIBA   cuantas franjas te esta costando el canal ahora mismo, contra
 *            las que el final te permite.
 *   ABAJO    cuanto de tu vida paga ya lo que publicaste hace meses.
 *
 * La de arriba solo baja quitando horas y la de abajo solo sube poniendolas.
 * Que se contradigan es exactamente el juego: no se gana maximizando ninguna
 * de las dos, se gana encontrando el punto donde las dos llegan a la vez.
 */
export function Dependencia() {
  const semana = useGame((s) => s.game.semana)
  const g = useGame((s) => s.game)
  const d = useMemo(() => dependenciaDelDirecto(g), [g])

  return (
    <section className="dependencia" data-logrado={d.trabajaPoco && d.cubierto}>
      <div className="dependencia__cabecera">
        <span className="carrera__kicker">Un stream menos</span>
        <h2 className="carrera__titulo">{titular(d)}</h2>
        <p className="carrera__objetivo">
          Dejarlo no es facturar más: es que lo ya publicado te pague la vida y que puedas
          sostenerlo con pocas horas. Las dos cosas, o no cuenta.
        </p>
      </div>

      <div className="dependencia__barras">
        <Barra
          etiqueta="Te cuesta ahora"
          detalle={`${d.emitir} emitir · ${d.editar} editar`}
          valor={d.produccion}
          total={BLOQUES_POR_SEMANA}
          cifra={`${d.produccion} de ${BLOQUES_POR_SEMANA}`}
          token="alcance"
          cumplido={d.trabajaPoco}
          // La marca del objetivo va SOBRE la barra y no en una barra aparte:
          // la pregunta no es "cuanto es el objetivo", es "cuanto me paso".
          marca={d.objetivo / BLOQUES_POR_SEMANA}
          marcaAyuda={`El final pide ${d.objetivo} franjas de producción o menos`}
        />

        <Barra
          etiqueta="Ya se paga solo"
          detalle="Catálogo y ahorros contra tu coste de vida"
          valor={Math.min(d.cobertura, 1)}
          total={1}
          cifra={pct(Math.min(d.cobertura, 1))}
          token="ingresos"
          cumplido={d.cubierto}
        />
      </div>

      <p className="dependencia__nota data">{nota(d, semana.fase === 'planificando')}</p>
    </section>
  )
}

interface BarraProps {
  etiqueta: string
  detalle: string
  valor: number
  total: number
  cifra: string
  token: 'alcance' | 'ingresos'
  cumplido: boolean
  /** 0..1 — donde esta el listón, si lo hay. */
  marca?: number
  marcaAyuda?: string
}

function Barra({
  etiqueta,
  detalle,
  valor,
  total,
  cifra,
  token,
  cumplido,
  marca,
  marcaAyuda,
}: BarraProps) {
  const parte = total > 0 ? Math.min(1, Math.max(0, valor / total)) : 0

  return (
    <div className="dependencia__barra" data-cumplido={cumplido}>
      <span className="dependencia__etiqueta">
        {etiqueta}
        <span className="dependencia__cifra data">{cifra}</span>
      </span>

      <span className="dependencia__pista">
        <span
          className="dependencia__relleno"
          style={{ width: `${parte * 100}%`, background: `var(--c-${token})` }}
        />
        {marca !== undefined && (
          <span
            className="dependencia__marca"
            style={{ left: `${Math.min(100, marca * 100)}%` }}
            title={marcaAyuda}
          />
        )}
      </span>

      <span className="dependencia__detalle data">{detalle}</span>
    </div>
  )
}

/** Donde esta, en una frase. */
function titular(d: Datos): string {
  if (d.trabajaPoco && d.cubierto) return 'Ya no dependes del directo'
  if (d.trabajaPoco) return 'Ya trabajas poco. Falta que las cuentas salgan'
  if (d.cubierto) return 'Las cuentas ya salen. Falta bajar las horas'
  if (d.sobran === 1) return 'Te sobra una franja de producción'
  return `Te sobran ${d.sobran} franjas de producción`
}

/** Que hacer con eso, sin decirle a nadie lo que tiene que hacer. */
function nota(d: Datos, planificando: boolean): string {
  if (d.trabajaPoco && d.cubierto) {
    return 'Mira Poder parar: quedan las condiciones que no son de dinero.'
  }
  if (d.trabajaPoco) {
    return 'Con estas horas ya cumples. Lo que falta lo trae el catálogo, y el catálogo tarda.'
  }
  if (planificando) {
    return `Quitar ${d.sobran} ${d.sobran === 1 ? 'franja' : 'franjas'} de emitir o editar hoy te deja en el objetivo — y hunde los ingresos de esta semana. Ese es el precio.`
  }
  return `Al repartir la próxima semana, ${d.sobran} ${d.sobran === 1 ? 'franja' : 'franjas'} de producción menos te dejan en el objetivo.`
}
