import { useMemo } from 'react'
import { CONTENT_POR_ID } from '../../content/contentTypes.ts'
import { LIBRO_POR_ID } from '../../content/books.ts'
import { BIG_POR_ID } from '../../content/bigEvents.ts'
import { ritmos } from '../../hud/ritmos.ts'
import type { Flotante, RecursoHud } from '../../hud/flotantes.ts'
import { NOMBRE_BLOQUE, SEGUNDOS_POR_BLOQUE, bloqueActual, type BloqueId } from '../../sim/semana.ts'
import { TUNABLES } from '../../sim/tunables.ts'
import { faseActual } from '../../sim/bigEvents.ts'
import { enDirecto } from '../../sim/tick.ts'
import type { GameState } from '../../sim/state.ts'
import { useGame } from '../../store.ts'
import { fmt, pct } from '../../format.ts'
import type { TokenKey } from '../theme/palette.ts'

/**
 * EL MARCADOR — las tres preguntas, siempre delante.
 *
 * Al entrar, el jugador tiene que poder responder en dos segundos: cuanto
 * estoy generando, que puedo hacer ahora, y por que deberia hacerlo. La
 * primera pregunta no tenia respuesta en ninguna parte: el alcance vivia en
 * el contador de espectadores, la comunidad en el pie del chat, y todo lo
 * demas en una pantalla a la que hay que hacer scroll y ademas elegir pestana.
 *
 * VA DENTRO DEL REPRODUCTOR y no debajo. El reproductor ocupa la altura del
 * viewport entera —es la identidad del juego y no se toca—, asi que cualquier
 * cosa colocada despues nace fuera de pantalla. Un marcador que hay que ir a
 * buscar no es un marcador.
 *
 * CUATRO RECURSOS, NI UNO MAS. El juego tiene catorce cifras y todas importan
 * en algun momento, pero catorce cifras a la vez son una hoja de calculo. Las
 * otras diez siguen existiendo, enteras y con sus formulas, en la pantalla de
 * Canal. Aqui estan las cuatro que contestan "como voy" — y la fatiga, que no
 * es un quinto recurso sino la explicacion de por que la calidad baja.
 */
export function Marcador() {
  const g = useGame((s) => s.game)
  const paused = useGame((s) => s.paused)
  const flotantes = useGame((s) => s.flotantes)
  const ultima = useGame((s) => s.registro[0])

  const r = useMemo(() => ritmos(g.historial), [g.historial])

  return (
    <div className="marcador">
      <EstadoActual />

      <div className="marcador__recursos">
        <Recurso
          recurso="alcance"
          etiqueta="Alcance"
          valor={fmt(g.alcance)}
          token="alcance"
          ritmo={r.alcance}
          ayuda="Gente que te descubre ahora. Sube rápido y cae con facilidad."
          flotantes={flotantes}
        />
        <Recurso
          recurso="comunidad"
          etiqueta="Comunidad"
          valor={fmt(g.comunidad)}
          token="comunidad"
          ritmo={r.comunidad}
          ayuda="Gente que sigue por ti. Crece lento y se queda cuando paras."
          flotantes={flotantes}
        />
        <Recurso
          recurso="calidad"
          etiqueta="Calidad"
          valor={g.calidad.toFixed(2)}
          token="calidad"
          ayuda="Multiplica lo que rinde cada hora. Sale de la vida y la destroza la fatiga."
          flotantes={flotantes}
          // La fatiga no es un quinto recurso: es la razon por la que este
          // baja. Puesta debajo, la relacion se lee sin abrir ningun tooltip.
          medidor={{ valor: g.fatiga, token: 'fatiga', etiqueta: `Fatiga ${pct(g.fatiga)}` }}
        />
        <Recurso
          recurso="vida"
          etiqueta="Vida"
          valor={pct(g.vida)}
          token="vida"
          ayuda="Equilibrio personal. Alimenta la calidad y las ideas."
          flotantes={flotantes}
          medidor={{ valor: g.vida, token: 'vida' }}
        />
      </div>

      {/* Lo ultimo que ha pasado, en una linea. El registro entero vive en la
          pantalla de Semana; esto es solo la senal de que el mundo se mueve
          mientras el jugador mira otra cosa. */}
      <p className="marcador__ticker" aria-live="polite">
        {paused ? (
          <span className="marcador__quieto">En pausa</span>
        ) : ultima ? (
          <>
            <span className="marcador__glifo" style={{ color: `var(--c-${ultima.token})` }}>
              {ultima.glifo}
            </span>
            {ultima.texto}
          </>
        ) : (
          <span className="marcador__quieto">Todavía no ha pasado nada. Dale tiempo.</span>
        )}
      </p>
    </div>
  )
}

interface RecursoProps {
  recurso: RecursoHud
  etiqueta: string
  valor: string
  token: TokenKey
  /** Por segundo. Solo lo tienen los recursos que fluyen solos. */
  ritmo?: number
  ayuda: string
  flotantes: readonly Flotante[]
  /** Barra pequena debajo, para lo que se lee mejor como proporcion. */
  medidor?: { valor: number; token: TokenKey; etiqueta?: string }
}

/**
 * Una celda del marcador.
 *
 * El ritmo va SIEMPRE, tambien cuando es cero o negativo: media tesis del
 * juego es que el alcance cae solo, y un contador que unicamente ensena
 * numeros subiendo cuenta la mitad de la historia que se le pide contar.
 */
function Recurso({
  recurso,
  etiqueta,
  valor,
  token,
  ritmo,
  ayuda,
  flotantes,
  medidor,
}: RecursoProps) {
  const mios = flotantes.filter((f) => f.recurso === recurso)

  return (
    <div className="recurso" title={ayuda}>
      <span className="recurso__etiqueta" style={{ color: `var(--c-${token})` }}>
        {etiqueta}
      </span>
      <span className="recurso__valor data">{valor}</span>

      {ritmo !== undefined && (
        <span className="recurso__ritmo data" data-signo={signo(ritmo)}>
          {ritmo >= 0 ? '+' : '−'}
          {fmt(Math.abs(ritmo), Math.abs(ritmo) < 10 ? 1 : 0)}/s
        </span>
      )}

      {medidor && (
        <span className="recurso__medidor" title={medidor.etiqueta}>
          <span
            style={{
              width: `${Math.min(100, Math.max(0, medidor.valor * 100))}%`,
              background: `var(--c-${medidor.token})`,
            }}
          />
        </span>
      )}
      {medidor?.etiqueta && <span className="recurso__nota data">{medidor.etiqueta}</span>}

      {/* Los flotantes salen de aqui, del sitio donde vive lo que han movido. */}
      <span className="recurso__flotantes" aria-hidden>
        {mios.map((f) => (
          <span key={f.id} className="flotante" style={{ color: `var(--c-${f.token})` }}>
            {f.texto}
          </span>
        ))}
      </span>
    </div>
  )
}

function signo(v: number): 'sube' | 'baja' | 'plano' {
  if (v > 0.05) return 'sube'
  if (v < -0.05) return 'baja'
  return 'plano'
}

/**
 * QUE ESTA HACIENDO AHORA MISMO.
 *
 * El juego simula a alguien que el martes por la tarde esta editando y el
 * miercoles por la noche esta durmiendo, y eso no se veia por ninguna parte:
 * la barra de controles lo decia en letra pequena, entre el reloj y los
 * botones. Dicho en grande, la partida deja de parecer una hoja de calculo y
 * pasa a parecer el dia de alguien.
 */
function EstadoActual() {
  const g = useGame((s) => s.game)
  const paused = useGame((s) => s.paused)

  const estado = describirEstado(g, paused)
  const progreso = progresoDeFranja(g.elapsedMs)

  return (
    <div className="estado" data-clase={estado.clase}>
      <span className="estado__linea">
        <span className="estado__punto" data-clase={estado.clase} />
        <span className="estado__titulo pixel">{estado.titulo}</span>
      </span>
      <span className="estado__detalle">{estado.detalle}</span>
      <span className="estado__franja" aria-hidden>
        <span style={{ width: `${progreso * 100}%` }} />
      </span>
    </div>
  )
}

type ClaseEstado = 'directo' | 'trabajo' | 'gente' | 'vida' | 'parado'

interface Descripcion {
  titulo: string
  detalle: string
  clase: ClaseEstado
}

/** Como se llama lo que esta pasando, y con que se acompana. */
function describirEstado(g: GameState, paused: boolean): Descripcion {
  if (g.descanso) {
    return g.descanso.tipo === 'vacaciones'
      ? {
          titulo: 'De vacaciones',
          detalle: `${g.descanso.semanasRestantes} semanas fuera. El canal no se cae por esto.`,
          clase: 'parado',
        }
      : {
          titulo: 'Parado a la fuerza',
          detalle: `${g.descanso.semanasRestantes} semanas. No paraste tú, paró el cuerpo.`,
          clase: 'parado',
        }
  }

  if (g.semana.fase === 'planificando') {
    return { titulo: 'Decidiendo', detalle: 'La semana está sin repartir.', clase: 'parado' }
  }

  if (paused) return { titulo: 'En pausa', detalle: 'El reloj está parado.', clase: 'parado' }

  const bloque = bloqueActual(g.semana)

  // Emitir tiene dos estados y la diferencia importa: el interruptor del
  // directo puede estar cortado en una franja en la que tocaba emitir.
  if (bloque === 'emitir') {
    if (!enDirecto(g)) {
      return {
        titulo: 'Fuera de directo',
        detalle: 'Tocaba emitir y está cortado.',
        clase: 'parado',
      }
    }
    const evento =
      faseActual(g.evento)?.fase === 'directo' ? BIG_POR_ID.get(g.evento?.id ?? '') : null
    return {
      titulo: 'En directo',
      detalle: evento?.tituloDirecto ?? CONTENT_POR_ID.get(g.formato)?.titulo ?? 'Emitiendo',
      clase: 'directo',
    }
  }

  const libro = g.lectura.libro ? LIBRO_POR_ID.get(g.lectura.libro) : null

  const POR_BLOQUE: Record<Exclude<BloqueId, 'emitir'>, Descripcion> = {
    editar: { titulo: 'Editando', detalle: 'Sale material, no sale gente.', clase: 'trabajo' },
    comunidad: {
      titulo: 'Con la gente',
      detalle: 'Responder, moderar, estar. Es lo que convierte visitas en comunidad.',
      clase: 'gente',
    },
    leer: {
      titulo: 'Leyendo',
      detalle: libro ? `${libro.titulo}, de ${libro.autor}` : 'Sin nada en la mesilla.',
      clase: 'vida',
    },
    vida: {
      titulo: 'Viviendo',
      detalle: 'Cocinar, salir, ver algo. Es de donde sale la calidad.',
      clase: 'vida',
    },
    dormir: {
      titulo: 'Durmiendo',
      detalle: 'Lo único que baja la fatiga de verdad.',
      clase: 'parado',
    },
  }

  return POR_BLOQUE[bloque] ?? { titulo: NOMBRE_BLOQUE[bloque], detalle: '', clase: 'trabajo' }
}

/** Cuanto se lleva consumido de la franja en curso, 0..1. */
function progresoDeFranja(elapsedMs: number): number {
  const segundos = (elapsedMs / 1000) % TUNABLES.secondsPerWeek
  return (segundos % SEGUNDOS_POR_BLOQUE) / SEGUNDOS_POR_BLOQUE
}
