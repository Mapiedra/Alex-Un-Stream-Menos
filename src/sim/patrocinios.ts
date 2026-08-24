import {
  MODAS,
  MODA_POR_CATEGORIA,
  PATROCINIOS,
  PATROCINIO_POR_ID,
  type CategoriaMarca,
  type Moda,
  type OfertaPatrocinio,
} from '../content/patrocinios.ts'
import { FORMATO_INICIAL } from '../content/contentTypes.ts'
import { chance, nextFloat, type RngState } from './rng.ts'
import { TUNABLES } from './tunables.ts'
import type { GameState } from './state.ts'

/**
 * Ofertas de patrocinio y contratos en curso.
 *
 * Modelado sobre la forma de los eventos extraordinarios —un contrato es una
 * cosa de varias semanas con efectos mientras dura— pero con una diferencia
 * deliberada: un evento CAE encima y un patrocinio se ACEPTA. Por eso las
 * ofertas no congelan la partida como las tarjetas de vida: llegan
 * constantemente, y una decision constante que para el juego cada vez seria
 * insoportable a los diez minutos.
 *
 * REGLA DEL GDD, heredada de los eventos: potentes pero NUNCA requisito. Una
 * partida que no acepte un solo patrocinio tiene que seguir siendo ganable, y
 * el banco de balance lo comprueba con el bot `integro`.
 */

/** Una oferta esperando respuesta en la bandeja. */
export interface OfertaPendiente {
  id: string
  /** Semana en la que se retira sola si no se responde. */
  caducaSemana: number
  /**
   * Multiplicador de moda congelado al recibirla.
   *
   * Se guarda en vez de recalcularse para que la cifra que ve el jugador sea
   * la que va a cobrar. Si se recalculase cada tick, una oferta podria valer
   * menos al aceptarla que cuando la leyo, y eso es mentir.
   */
  multiplicador: number
}

/** Un contrato firmado, corriendo. */
export interface ContratoActivo {
  id: string
  categoria: CategoriaMarca
  semanasRestantes: number
  /** Pago semanal YA con el multiplicador de moda aplicado. */
  pagoSemanal: number
  costeCredibilidad: number
  costeFatiga: number
  /** Clave de prensa: formato que concede mientras dura. */
  formato?: string
}

/** La definicion de contenido de una oferta pendiente. */
export function definicion(id: string): OfertaPatrocinio | undefined {
  return PATROCINIO_POR_ID.get(id)
}

/**
 * Multiplicador de pago de una categoria esta semana.
 *
 * Las categorias sin moda valen 1 siempre: son el fondo de armario de la
 * bandeja y no dependen de la epoca. Las que tienen moda suben en rampa hasta
 * el pico y bajan despues, y valen 0 fuera de su ventana — que es como se
 * apaga una categoria: dejando de escribir.
 *
 * La rampa importa. Con un escalon, todo el mundo firmaria exactamente en la
 * semana del pico y la moda seria un recordatorio de calendario. Con rampa hay
 * que decidir si entras pronto por poco dinero o esperas al pico arriesgandote
 * a que se te pase.
 */
export function multiplicadorDeModa(categoria: CategoriaMarca, semana: number): number {
  const m = MODA_POR_CATEGORIA.get(categoria)
  if (!m) return 1
  if (semana < m.desdeSemana || semana >= m.estallidoSemana) return 0

  if (semana <= m.picoSemana) {
    const t = (semana - m.desdeSemana) / Math.max(1, m.picoSemana - m.desdeSemana)
    return 1 + (m.multiplicadorPico - 1) * t
  }
  const t = (semana - m.picoSemana) / Math.max(1, m.estallidoSemana - m.picoSemana)
  return 1 + (m.multiplicadorPico - 1) * (1 - t)
}

/** La moda caliente ahora mismo, si hay alguna. Para ensenarla en pantalla. */
export function modaActiva(semana: number): Moda | null {
  return (
    MODAS.find((m) => semana >= m.desdeSemana && semana < m.estallidoSemana) ?? null
  )
}

/**
 * Lo que pasa cuando una moda estalla.
 *
 * Solo te alcanza si firmaste: el golpe escala con CUANTOS contratos de esa
 * categoria aceptaste en toda la partida, y por eso `aceptadosPorCategoria` no
 * se descuenta nunca. Quien no firmo ni uno ve estallar la moda desde fuera y
 * no le pasa nada — ese es literalmente el premio de haber dicho que no, y es
 * la unica forma de que decir que no se sienta como una decision y no como
 * dinero tirado.
 *
 * El techo de credibilidad baja PARA SIEMPRE. Puedes recuperarte, nunca hasta
 * donde estabas. Con suelo, porque en este juego no hay pozos de los que no se
 * salga.
 */
export function estallarModas(state: GameState, semana: number): GameState {
  let siguiente = state
  for (const m of MODAS) {
    if (semana < m.estallidoSemana) continue
    if (siguiente.resacas.includes(m.categoria)) continue

    const firmados = siguiente.aceptadosPorCategoria[m.categoria] ?? 0
    // La moda estalla igual; se anota como vivida para no volver a mirarla.
    if (firmados === 0) {
      siguiente = { ...siguiente, resacas: [...siguiente.resacas, m.categoria] }
      continue
    }

    const techo = Math.max(
      TUNABLES.patrocinios.credibilidad.techoMinimo,
      siguiente.techoCredibilidad - m.resacaTecho * firmados,
    )
    siguiente = {
      ...siguiente,
      resacas: [...siguiente.resacas, m.categoria],
      resacaPendiente: m.categoria,
      techoCredibilidad: techo,
      credibilidad: Math.min(
        techo,
        Math.max(0, siguiente.credibilidad - m.resacaCredibilidad * firmados),
      ),
      comunidad: Math.max(
        0,
        siguiente.comunidad * (1 - Math.min(0.5, m.resacaComunidad * firmados)),
      ),
    }
  }
  return siguiente
}

/**
 * Ofertas que podrian llegar ahora mismo.
 *
 * No se filtra por "ya vista" como las tarjetas de vida: una marca vuelve a
 * escribirte, y de hecho eso es lo que hace que decir que no sea una decision
 * repetida y no un boton de un solo uso. Lo que si se filtra es lo que ya
 * tienes delante o firmado, para no ver dos veces la misma lata.
 */
export function candidatas(state: GameState): OfertaPatrocinio[] {
  const enCurso = new Set([
    ...state.ofertas.map((o) => o.id),
    ...state.contratos.map((c) => c.id),
  ])
  return PATROCINIOS.filter(
    (p) =>
      !enCurso.has(p.id) &&
      state.week >= (p.desdeSemana ?? 0) &&
      state.comunidad >= (p.desdeComunidad ?? TUNABLES.patrocinios.comunidadMinima) &&
      multiplicadorDeModa(p.categoria, state.week) > 0,
  )
}

/**
 * Sortea si llega una oferta nueva. Se llama una vez por semana.
 *
 * Ponderado por `peso`, igual que las tarjetas de vida, y con tope de bandeja:
 * mas de tres ofertas a la vez dejan de ser decisiones y pasan a ser una lista
 * de tareas.
 */
export function sortearOferta(
  state: GameState,
  rng: RngState,
): { oferta: OfertaPendiente | null; rng: RngState } {
  if (state.ofertas.length >= TUNABLES.patrocinios.maxOfertas) return { oferta: null, rng }

  const pool = candidatas(state)
  if (pool.length === 0) return { oferta: null, rng }

  const tirada = chance(rng, TUNABLES.patrocinios.ofertasPorSemana)
  if (!tirada.value) return { oferta: null, rng: tirada.rng }

  const total = pool.reduce((acc, p) => acc + (p.peso ?? 1), 0)
  const r = nextFloat(tirada.rng)
  let objetivo = r.value * total
  let elegida = pool[pool.length - 1]
  for (const p of pool) {
    objetivo -= p.peso ?? 1
    if (objetivo <= 0) {
      elegida = p
      break
    }
  }
  if (!elegida) return { oferta: null, rng: r.rng }

  return {
    oferta: {
      id: elegida.id,
      caducaSemana: state.week + TUNABLES.patrocinios.semanasDeOferta,
      multiplicador: multiplicadorDeModa(elegida.categoria, state.week),
    },
    rng: r.rng,
  }
}

/** Retira las ofertas caducadas. Devuelve el mismo array si no cambia nada. */
export function caducarOfertas(ofertas: OfertaPendiente[], semana: number): OfertaPendiente[] {
  const vivas = ofertas.filter((o) => o.caducaSemana > semana)
  return vivas.length === ofertas.length ? ofertas : vivas
}

/**
 * Firmar.
 *
 * Cuenta la firma en `aceptadosPorCategoria` aunque el contrato termine: es lo
 * que la resaca de la moda va a mirar dentro de veinte semanas. Lo que firmaste
 * no deja de haber pasado porque el contrato se acabara.
 */
export function aceptar(state: GameState, ofertaId: string): GameState {
  const pendiente = state.ofertas.find((o) => o.id === ofertaId)
  const def = pendiente ? definicion(pendiente.id) : undefined
  if (!pendiente || !def) return state
  if (state.contratos.length >= TUNABLES.patrocinios.maxContratos) return state

  const contrato: ContratoActivo = {
    id: def.id,
    categoria: def.categoria,
    semanasRestantes: def.semanas,
    pagoSemanal: def.pagoSemanal * pendiente.multiplicador,
    costeCredibilidad: def.costeCredibilidad,
    costeFatiga: def.costeFatiga ?? 0,
    ...(def.formato ? { formato: def.formato } : {}),
  }

  const cat = def.categoria
  return {
    ...state,
    ofertas: state.ofertas.filter((o) => o.id !== ofertaId),
    contratos: [...state.contratos, contrato],
    aceptadosPorCategoria: {
      ...state.aceptadosPorCategoria,
      [cat]: (state.aceptadosPorCategoria[cat] ?? 0) + 1,
    },
  }
}

/**
 * Decir que no.
 *
 * No cuesta nada y no cierra ninguna puerta: la misma marca puede volver a
 * escribir. Si las ofertas son constantes, rechazarlas tiene que ser barato o
 * el sistema se convierte en un peaje en vez de en una decision.
 */
export function rechazar(state: GameState, ofertaId: string): GameState {
  const ofertas = state.ofertas.filter((o) => o.id !== ofertaId)
  return ofertas.length === state.ofertas.length ? state : { ...state, ofertas }
}

/** Descuenta una semana a cada contrato y retira los que se acaban. */
export function avanzarContratos(contratos: ContratoActivo[]): ContratoActivo[] {
  if (contratos.length === 0) return contratos
  return contratos
    .map((c) => ({ ...c, semanasRestantes: c.semanasRestantes - 1 }))
    .filter((c) => c.semanasRestantes > 0)
}

/**
 * Lo que pagan los contratos, por segundo.
 *
 * Prorrateado como todo lo demas en este motor. Un pellizco los lunes seria
 * mas facil de programar, pero el jugador no veria subir el contador mientras
 * emite y el patrocinio dejaria de sentirse como una fuente de ingresos.
 */
export function pagoPorSegundo(contratos: ContratoActivo[]): number {
  let total = 0
  for (const c of contratos) total += c.pagoSemanal
  return total / TUNABLES.secondsPerWeek
}

/** Lo que cuestan en credibilidad, por segundo. Negativo si la devuelven. */
export function credibilidadPorSegundo(contratos: ContratoActivo[]): number {
  let total = 0
  for (const c of contratos) total += c.costeCredibilidad
  return total / TUNABLES.secondsPerWeek
}

/** Lo que cansan, por segundo. Cumplir con una marca es trabajo. */
export function fatigaPorSegundo(contratos: ContratoActivo[]): number {
  let total = 0
  for (const c of contratos) total += c.costeFatiga
  return total / TUNABLES.secondsPerWeek
}

/** Formatos que conceden los contratos en curso: las claves de prensa. */
export function formatosDeContrato(contratos: ContratoActivo[]): string[] {
  return contratos.flatMap((c) => (c.formato ? [c.formato] : []))
}

/** Todos los formatos que alguna editora puede llegar a prestar. */
const FORMATOS_PRESTABLES: ReadonlySet<string> = new Set(
  PATROCINIOS.flatMap((p) => (p.formato ? [p.formato] : [])),
)

/**
 * El formato que toca emitir cuando se acaba un contrato.
 *
 * Una clave de prensa se devuelve. Sin esto, firmar un acuerdo por el
 * superventas y dejarlo puesto daria ese formato GRATIS para el resto de la
 * partida — que es exactamente el agujero por el que se colaria la estrategia
 * dominante que este sistema no quiere tener.
 */
export function formatoTrasContratos(formato: string, contratos: ContratoActivo[]): string {
  if (!FORMATOS_PRESTABLES.has(formato)) return formato
  return formatosDeContrato(contratos).includes(formato) ? formato : FORMATO_INICIAL
}
