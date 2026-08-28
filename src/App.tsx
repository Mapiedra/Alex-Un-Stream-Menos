import { GameLoop } from './ui/GameLoop.tsx'
import { PANTALLAS, Pestanas, type PantallaId } from './ui/Pestanas.tsx'
import { DevPanel } from './ui/debug/DevPanel.tsx'
import { PlayerHeader } from './ui/player/PlayerHeader.tsx'
import { Stage } from './ui/player/Stage.tsx'
import { ControlBar } from './ui/player/ControlBar.tsx'
import { ChatPanel } from './ui/player/ChatPanel.tsx'
import { Tienda } from './ui/panels/Tienda.tsx'
import { Formatos } from './ui/panels/Formatos.tsx'
import { Carrera } from './ui/panels/Carrera.tsx'
import { Dependencia } from './ui/panels/Dependencia.tsx'
import { Momentos } from './ui/panels/Momentos.tsx'
import { Marcas } from './ui/panels/Marcas.tsx'
import { Planificador } from './ui/panels/Planificador.tsx'
import { Lectura } from './ui/panels/Lectura.tsx'
import { TarjetaVida } from './ui/panels/TarjetaVida.tsx'
import { Retiro } from './ui/panels/Retiro.tsx'
import { Final } from './ui/panels/Final.tsx'
import { Ciclo } from './ui/panels/Ciclo.tsx'
import { Resaca } from './ui/panels/Resaca.tsx'
import { Ayuda } from './ui/panels/Ayuda.tsx'
import { Marcador } from './ui/hud/Marcador.tsx'
import { Irrupcion } from './ui/hud/Irrupcion.tsx'
import { LlamadaParar } from './ui/hud/LlamadaParar.tsx'
import { Balance } from './ui/hud/Balance.tsx'
import { Registro } from './ui/hud/Registro.tsx'
import { Opciones } from './ui/panels/Opciones.tsx'
import { Menu } from './ui/menu/Menu.tsx'
import { Analytics } from '@vercel/analytics/react'
import { useTelemetria } from './telemetria/usar.ts'
import { Sparkline } from './ui/components/Sparkline.tsx'
import { useEffect, useMemo, useState } from 'react'
import { useGame } from './store.ts'
import { eur, fmt, pct } from './format.ts'
import { houseLivingCost } from './sim/state.ts'
import { TUNABLES } from './sim/tunables.ts'
import { nivelFatiga } from './sim/formulas.ts'
import { CONTENT_POR_ID } from './content/contentTypes.ts'
import { BIG_POR_ID } from './content/bigEvents.ts'
import { faseActual } from './sim/bigEvents.ts'
import { enDirecto } from './sim/tick.ts'
import { puedeRetirarse } from './sim/final.ts'
import {
  NOMBRE_BLOQUE,
  NOMBRE_DIA,
  NOMBRE_FRANJA,
  bloqueActual,
  posicionDeBloque,
} from './sim/semana.ts'
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
  const fase = useGame((s) => s.fase)

  // El menu es una pantalla aparte, no un panel del juego: mientras esta
  // delante no hay bucle corriendo y la partida no avanza sola.
  if (fase === 'menu') return <Menu />

  return <Partida />
}

function Partida() {
  const g = useGame((s) => s.game)
  const paused = useGame((s) => s.paused)
  const setPaused = useGame((s) => s.setPaused)
  const publish = useGame((s) => s.publish)
  const toggleDirecto = useGame((s) => s.toggleDirecto)
  const catchClip = useGame((s) => s.catchClip)
  const avisoCarga = useGame((s) => s.avisoCarga)
  const volverAlMenu = useGame((s) => s.volverAlMenu)

  const [pantalla, setPantalla] = useState<PantallaId>('semana')

  /**
   * Al acabarse la semana, el juego te lleva a repartir la siguiente.
   *
   * Sin esto, terminar la semana mirando la tienda dejaba la partida parada
   * sin que se viera por que: la pausa esta en otra pantalla.
   */
  const planificando = g.semana.fase === 'planificando'
  useEffect(() => {
    if (planificando) setPantalla('semana')
  }, [planificando])

  // Telemetria anonima: en que minuto abandona la gente y como acaba. Sin
  // credenciales configuradas no hace nada en absoluto.
  useTelemetria()

  /**
   * Donde esta el creador dentro de su semana.
   *
   * Mientras se reparte no hay franja en curso: el reloj no corre y la barra
   * dice que se esta decidiendo, que es informacion, no un hueco.
   */
  const franja = (() => {
    if (g.semana.fase !== 'viviendo') return null
    const { dia, franja: f } = posicionDeBloque(g.semana.cursor)
    return `${NOMBRE_DIA[dia] ?? ''} ${(NOMBRE_FRANJA[f] ?? '').toLowerCase()} · ${NOMBRE_BLOQUE[bloqueActual(g.semana)]}`
  })()

  // El badge de EN DIRECTO deja de ser decorativo: dice si de verdad se esta
  // emitiendo esta franja, contando el interruptor manual.
  const emitiendo = enDirecto(g) && !paused

  const costeVidaSemanal = houseLivingCost(g.houseStage)
  const ingresosSemanales = g.ingresosPorSegundo * TUNABLES.secondsPerWeek
  const segundosEnSemana = (g.elapsedMs / 1000) % TUNABLES.secondsPerWeek
  const progresoSemana = segundosEnSemana / TUNABLES.secondsPerWeek

  // La intensidad de los neones sigue al alcance: la calle se enciende cuando
  // hay gente mirando y se apaga cuando no.
  const intensidad = Math.min(1, g.alcance / 8000)
  const fatiga = nivelFatiga(g.fatiga)

  /**
   * Las pantallas que existen para este jugador.
   *
   * Marcas es la unica que se gana: hasta que alguien te escribe, la pantalla
   * es un panel vacio explicando un sistema que todavia no te ha pasado. El
   * resto estan desde el principio porque desde el principio tienen dentro
   * algo que hacer — incluida Vida, que es donde vive el boton de parar y ese
   * no se esconde nunca.
   *
   * Se mira `aceptadosPorCategoria` ademas de las ofertas vivas para que la
   * pestana no desaparezca cuando caduque la ultima: lo que se ha desbloqueado
   * no se vuelve a bloquear.
   */
  const hayMarcas =
    g.ofertas.length > 0 ||
    g.contratos.length > 0 ||
    Object.keys(g.aceptadosPorCategoria).length > 0
  const disponibles = useMemo(
    () => PANTALLAS.map((p) => p.id).filter((id) => id !== 'marcas' || hayMarcas),
    [hayMarcas],
  )
  // El titulo del directo lo pone el formato: la cabecera dice en todo momento
  // que esta haciendo el creador.
  const formato = CONTENT_POR_ID.get(g.formato)
  // Durante la emision de un evento extraordinario, el titulo lo pone el
  // evento: es lo que esta ocurriendo de verdad en el canal.
  const eventoDef = g.evento ? BIG_POR_ID.get(g.evento.id) : null
  const emitiendoEvento = faseActual(g.evento)?.fase === 'directo'
  const tituloDirecto = g.descanso
    ? 'Fuera unos dias'
    : !emitiendo
      ? 'Fuera de directo'
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
            enDirecto={emitiendo}
            onSalir={volverAlMenu}
          />

          <Stage
            intensidad={intensidad}
            fatiga={g.fatiga}
            etapaCasa={g.houseStage}
            /* La habitacion sabe que hora es. Emitir enciende la escena;
               dormir la apaga. El estado ya se decia con palabras en el
               marcador — ahora tambien se ve. */
            bloque={g.semana.fase === 'viviendo' ? bloqueActual(g.semana) : null}
            lloviendo
          />

          <ControlBar
            enPausa={paused}
            onTogglePausa={() => setPaused(!paused)}
            progresoSemana={progresoSemana}
            semana={g.week}
            ciclo={g.cycle}
            franja={franja}
            enDirecto={emitiendo}
            puedeEmitir={g.semana.fase === 'viviendo' && !g.descanso}
            onToggleDirecto={toggleDirecto}
            material={g.material}
            clipActivo={g.clip.activo}
            clipBonus={g.clip.bonusRestanteMs > 0}
            onClip={catchClip}
            onPublicar={publish}
          />

          {/* Las cuatro cifras que contestan "como voy", dentro del
              reproductor y no debajo: el bloque de arriba ocupa la pantalla
              entera, asi que cualquier cosa colocada despues nace fuera de
              vista y hay que ir a buscarla. */}
          <Marcador />
        </div>

        <ChatPanel mensajes={g.chat} suscriptores={g.comunidad} />
      </div>

      {avisoCarga && <p className="aviso aviso--error">{avisoCarga}</p>}

      {/* El aviso de fatiga ya no solo avisa: trae la decision puesta. */}
      <LlamadaParar />

      <Pestanas
        activa={pantalla}
        onCambiar={setPantalla}
        disponibles={disponibles}
        avisos={{
          semana: planificando,
          carrera: puedeRetirarse(g),
          // El punto rojo solo salta con lo que se pierde si no lo miras: una
          // oferta que caduca esta semana. Con ofertas constantes, un aviso
          // siempre encendido no significaria nada.
          marcas: g.ofertas.some((o) => o.caducaSemana - g.week <= 1),
          // Vida reclama atencion cuando hay algo que decidir ahi: parar, o
          // prepararse para lo que viene.
          vida: fatiga !== 'ok' || Boolean(g.evento && !g.evento.preparado),
        }}
      />

      <div className="pantalla" data-pantalla={pantalla}>
        {pantalla === 'semana' && (
          <>
            {/* El cierre de la anterior, justo encima del reparto de la
                siguiente: es el unico momento en que sirve de algo. */}
            <Balance />
            <Planificador />
            <Registro />
          </>
        )}

        {pantalla === 'canal' && (
          <>
            {/* Las dos curvas, juntas y a la misma altura: es donde se ve que
                el alcance sube y baja mientras la comunidad sube y se queda. */}
            <div className="curvas">
              <Sparkline serie={g.historial.alcance} token="alcance" etiqueta="Alcance" />
              <Sparkline serie={g.historial.comunidad} token="comunidad" etiqueta="Comunidad" />
            </div>

            <div className="stats">
              <Stat label="Alcance" valor={fmt(g.alcance)} token="alcance" hint="Gente que te descubre ahora. Sube rapido y cae con facilidad; la comunidad frena esa caida." />
              <Stat label="Comunidad" valor={fmt(g.comunidad)} token="comunidad" hint="Gente que sigue por ti. Crece lento y protege cuando paras." />
              <Stat label="Calidad" valor={g.calidad.toFixed(2)} token="calidad" hint="base x f(vida) x (1 - fatiga)^1.5 x mejoras. Multiplica el rendimiento por hora." />
              <Stat label="Vida" valor={pct(g.vida)} token="vida" hint="Equilibrio personal. Alimenta la calidad y las ideas, y es lo que cuesta cambiar de rutina." />
              <Stat label="Fatiga" valor={pct(g.fatiga)} token="fatiga" hint="Por encima del 60% la calidad sufre; del 85%, burnout. Cuesta caro, pero nunca termina la partida." />
              <Stat label="Hype" valor={`x${(1 + g.hype).toFixed(2)}`} token="hype" hint="Multiplicador temporal. Decae rapido." />
              <Stat label="Ideas" valor={fmt(g.ideas, 1)} token="ideas" hint="Materia prima de los formatos nuevos. La genera la vida personal y terminar libros." />
              <Stat label="Credibilidad" valor={pct(g.credibilidad)} token="credibilidad" hint="Lo que la gente cree que haces por dinero. No toca el alcance ni la publicidad: cambia cuanta gente se queda y cuanta te apoya. La gastan los patrocinios; se recupera con franjas de comunidad." />
              <Stat label="Material" valor={g.material.toFixed(1)} token="ingresos" hint="Videos montados y listos para subir. Salen de las franjas de editar; publicar y montarte el flujo los gastan." />
              <Stat label="Ahorros" valor={eur(g.ahorros)} token="ingresos" hint="Lo que NO gastaste en mejoras. Es tu via de retiro." />
              <Stat label="Ingresos" valor={`${eur(ingresosSemanales, 1)}/sem`} token="ingresos" hint="Alcance + comunidad + cola larga del catalogo." />
              <Stat label="Coste de vida" valor={`${eur(costeVidaSemanal)}/sem`} token="fatiga" hint="Sube con cada etapa de casa: profesionalizarse encarece retirarse." />
              <Stat label="Catalogo" valor={`${fmt(g.publicacionesTotales)}`} token="calidad" hint="Cada publicacion renta para siempre, tanto mas cuanta mas calidad tenia." />
              <Stat label="Clips" valor={`${g.clip.acertados}`} token="alcance" hint="Momentos capturados. Fallarlos no cuesta progreso: la partida es ganable sin acertar ninguno." />
            </div>

            <Formatos />
          </>
        )}

        {pantalla === 'marcas' && <Marcas />}

        {pantalla === 'tienda' && <Tienda />}

        {pantalla === 'vida' && (
          <>
            <Momentos />
            <Lectura />
          </>
        )}

        {pantalla === 'carrera' && (
          <>
            {/* Primero a donde vas, despues por donde vas. El panel del
                Retiro no aparece hasta el ultimo ciclo; este esta desde la
                semana uno porque el objetivo del juego no puede ser una
                sorpresa del final. */}
            <Dependencia />
            <Carrera />
            <Retiro />
          </>
        )}

        {pantalla === 'ayuda' && (
          <>
            <Ayuda />
            <Opciones />
            <div className="barra-partida">
              <button className="menu__boton" onClick={volverAlMenu}>
                Guardar y salir al menú
              </button>
            </div>
          </>
        )}
      </div>

      {/* El panel de desarrollo borra el guardado sin preguntar: fuera de
          la build de desarrollo no tiene por que estar al alcance de nadie. */}
      {import.meta.env.DEV && <DevPanel />}

      {/* Cuando pasa algo grande, se para el reloj y se rompe la pantalla. */}
      <Irrupcion />

      <TarjetaVida />

      <Ciclo />

      <Resaca />

      <Final />

      <Analytics />
    </div>
  )
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
