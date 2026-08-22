import { GameLoop } from './ui/GameLoop.tsx'
import { DevPanel } from './ui/debug/DevPanel.tsx'
import { PlayerHeader } from './ui/player/PlayerHeader.tsx'
import { Stage } from './ui/player/Stage.tsx'
import { ControlBar } from './ui/player/ControlBar.tsx'
import { ChatPanel } from './ui/player/ChatPanel.tsx'
import { Tienda } from './ui/panels/Tienda.tsx'
import { Formatos } from './ui/panels/Formatos.tsx'
import { Carrera } from './ui/panels/Carrera.tsx'
import { Momentos } from './ui/panels/Momentos.tsx'
import { Reparto } from './ui/panels/Reparto.tsx'
import { TarjetaVida } from './ui/panels/TarjetaVida.tsx'
import { Retiro } from './ui/panels/Retiro.tsx'
import { Final } from './ui/panels/Final.tsx'
import { Opciones } from './ui/panels/Opciones.tsx'
import { Sparkline } from './ui/components/Sparkline.tsx'
import { useGame } from './store.ts'
import { eur, fmt, pct } from './format.ts'
import { houseLivingCost } from './sim/state.ts'
import { TUNABLES } from './sim/tunables.ts'
import { nivelFatiga } from './sim/formulas.ts'
import { CONTENT_POR_ID } from './content/contentTypes.ts'
import { BIG_POR_ID } from './content/bigEvents.ts'
import { faseActual } from './sim/bigEvents.ts'
import type { TokenKey } from './ui/theme/palette.ts'

/**
 * El juego es el reproductor.
 *
 * En lugar de una pantalla de incremental con barras y botones, la partida
 * ocurre dentro de la interfaz que el jugador ya reconoce: cabecera de canal,
 * escena, webcam, chat lateral y barra de controles. Cada elemento tiene una
 * funcion mecanica, no decorativa — el contador de espectadores ES el alcance,
 * el chat ES la comunidad, y el boton Clip ES el momento clippeable del GDD.
 */
export function App() {
  const g = useGame((s) => s.game)
  const paused = useGame((s) => s.paused)
  const setPaused = useGame((s) => s.setPaused)
  const publish = useGame((s) => s.publish)
  const catchClip = useGame((s) => s.catchClip)
  const avisoCarga = useGame((s) => s.avisoCarga)

  const costeVidaSemanal = houseLivingCost(g.houseStage)
  const ingresosSemanales = g.ingresosPorSegundo * TUNABLES.secondsPerWeek
  const segundosEnSemana = (g.elapsedMs / 1000) % TUNABLES.secondsPerWeek
  const progresoSemana = segundosEnSemana / TUNABLES.secondsPerWeek

  // La intensidad de los neones sigue al alcance: la calle se enciende cuando
  // hay gente mirando y se apaga cuando no.
  const intensidad = Math.min(1, g.alcance / 8000)
  const fatiga = nivelFatiga(g.fatiga)
  // El titulo del directo lo pone el formato: la cabecera dice en todo momento
  // que esta haciendo el creador.
  const formato = CONTENT_POR_ID.get(g.formato)
  // Durante la emision de un evento extraordinario, el titulo lo pone el
  // evento: es lo que esta ocurriendo de verdad en el canal.
  const eventoDef = g.evento ? BIG_POR_ID.get(g.evento.id) : null
  const emitiendoEvento = faseActual(g.evento)?.fase === 'directo'
  const tituloDirecto = g.descanso
    ? 'Fuera unos dias'
    : emitiendoEvento && eventoDef
      ? eventoDef.tituloDirecto
      : (formato?.titulo ?? 'En directo')

  return (
    <div className="app">
      <GameLoop />

      {/* El reproductor conserva las proporciones de la referencia: video en
          16:9 y chat a su derecha, a la misma altura. Todo lo demas va debajo
          y se alcanza haciendo scroll, que arrastra al reproductor hacia
          arriba igual que en la pagina original. */}
      <div className="reproductor">
        <div className="reproductor__principal">
          <PlayerHeader
            titulo={tituloDirecto}
            espectadores={g.alcance}
            enDirecto={!paused && !g.descanso}
          />

          <Stage
            intensidad={intensidad}
            fatiga={g.fatiga}
            etapaCasa={g.houseStage}
            lloviendo
          />

          <ControlBar
            enPausa={paused}
            onTogglePausa={() => setPaused(!paused)}
            progresoSemana={progresoSemana}
            semana={g.week}
            ciclo={g.cycle}
            clipActivo={g.clip.activo}
            clipBonus={g.clip.bonusRestanteMs > 0}
            onClip={catchClip}
            onPublicar={publish}
          />
        </div>

        <ChatPanel mensajes={g.chat} suscriptores={g.comunidad} />
      </div>

      {avisoCarga && <p className="aviso aviso--error">{avisoCarga}</p>}
      {fatiga !== 'ok' && <p className="aviso" data-nivel={fatiga}>{AVISO_FATIGA[fatiga]}</p>}

      {/* Las dos curvas, juntas y a la misma altura: es donde se ve que el
          alcance sube y baja mientras la comunidad sube y se queda. */}
      <div className="curvas">
        <Sparkline serie={g.historial.alcance} token="alcance" etiqueta="Alcance" />
        <Sparkline serie={g.historial.comunidad} token="comunidad" etiqueta="Comunidad" />
      </div>

      <div className="stats">
        <Stat label="Alcance" valor={fmt(g.alcance)} token="alcance" hint="Gente que te descubre ahora. Sube rapido y cae con facilidad; la comunidad frena esa caida." />
        <Stat label="Comunidad" valor={fmt(g.comunidad)} token="comunidad" hint="Gente que sigue por ti. Crece lento y protege cuando paras." />
        <Stat label="Calidad" valor={g.calidad.toFixed(2)} token="calidad" hint="base x f(vida) x (1 - fatiga)^1.5 x mejoras. Multiplica el rendimiento por hora." />
        <Stat label="Vida" valor={pct(g.vida)} token="vida" hint="Equilibrio personal. Alimenta la calidad y las ideas." />
        <Stat label="Fatiga" valor={pct(g.fatiga)} token="fatiga" hint="Por encima del 60% la calidad sufre; del 85%, burnout. Cuesta caro, pero nunca termina la partida." />
        <Stat label="Hype" valor={`x${(1 + g.hype).toFixed(2)}`} token="hype" hint="Multiplicador temporal. Decae rapido." />
        <Stat label="Ideas" valor={fmt(g.ideas, 1)} token="ideas" hint="Materia prima de los formatos nuevos. La genera la vida personal." />
        <Stat label="Ahorros" valor={eur(g.ahorros)} token="ingresos" hint="Lo que NO gastaste en mejoras. Es tu via de retiro." />
        <Stat label="Ingresos" valor={`${eur(ingresosSemanales, 1)}/sem`} token="ingresos" hint="Alcance + comunidad + cola larga del catalogo." />
        <Stat label="Coste de vida" valor={`${eur(costeVidaSemanal)}/sem`} token="fatiga" hint="Sube con cada etapa de casa: profesionalizarse encarece retirarse." />
        <Stat label="Catalogo" valor={`${fmt(g.publicacionesTotales)}`} token="calidad" hint="Cada publicacion renta para siempre, tanto mas cuanta mas calidad tenia." />
        <Stat label="Clips" valor={`${g.clip.acertados}`} token="alcance" hint="Momentos capturados. Fallarlos no cuesta progreso: la partida es ganable sin acertar ninguno." />
      </div>

      <Carrera />

      <Retiro />

      <Momentos />

      <Reparto />

      <Formatos />

      <Tienda />

      <Opciones />

      <DevPanel />

      <TarjetaVida />

      <Final />
    </div>
  )
}

/**
 * El aviso llega ANTES de la penalizacion. El GDD (6.5) pide que forzar tenga
 * consecuencias, no que te pillen por sorpresa: el jugador debe poder decidir
 * parar, no enterarse de que era tarde.
 */
const AVISO_FATIGA: Record<'aviso' | 'saturado' | 'critico', string> = {
  aviso: 'Llevas demasiadas horas seguidas. La calidad empieza a resentirse.',
  saturado: 'Estas al limite. Si sigues asi, vas a tener que parar en seco.',
  critico: 'No puedes seguir. Necesitas descansar de verdad.',
}

interface StatProps {
  label: string
  valor: string
  token: TokenKey
  /** La formula, expuesta al jugador. El publico de incrementales la exige. */
  hint: string
}

function Stat({ label, valor, token, hint }: StatProps) {
  return (
    <div className="stat" title={hint}>
      <span className="stat__label" style={{ color: `var(--c-${token})` }}>
        {label}
      </span>
      <span className="stat__valor data">{valor}</span>
    </div>
  )
}
