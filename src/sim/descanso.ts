import { TUNABLES } from './tunables.ts'
import { clamp01 } from './formulas.ts'
import { allocationDelPlan, planAutomatico } from './semana.ts'
import type { Allocation, GameState } from './state.ts'

/**
 * Vacaciones y burnout: las dos formas de parar.
 *
 * Son el mismo mecanismo con signos opuestos, y esa simetria es
 * deliberada. Parar por decision propia sale barato y deja algo: descanso,
 * ideas, un bonus a la vuelta y Legado permanente. Parar porque tu cuerpo te
 * obliga cuesta mas semanas, dana la comunidad y no deja nada.
 *
 * El GDD (6.4) pide que las vacaciones sean siempre una decision razonable y
 * a menudo optima. El GDD (6.5) pide que el burnout sea caro pero NUNCA
 * terminal: la partida no se puede perder.
 */

export type TipoDescanso = 'vacaciones' | 'burnout'

export interface Descanso {
  tipo: TipoDescanso
  semanasRestantes: number
  /** Semanas que duraba al empezar, para pintar el progreso. */
  semanasTotales: number
}

/** Se puede coger vacaciones? No mientras ya se este parado. */
export function puedeIrseDeVacaciones(state: GameState): boolean {
  return state.descanso === null && state.evento?.id !== 'conferencia'
}

/**
 * Empezar unas vacaciones.
 *
 * Durante ellas no se produce nada y el alcance cae —amortiguado por la
 * comunidad, que es justo lo que hace que parar sea barato si has construido
 * bien—. A cambio se recupera fatiga, sube la vida y se generan ideas.
 */
export function irseDeVacaciones(state: GameState): GameState {
  if (!puedeIrseDeVacaciones(state)) return state
  const semanas = TUNABLES.vacaciones.semanas
  return semanaDeParada(
    {
      ...state,
      descanso: { tipo: 'vacaciones', semanasRestantes: semanas, semanasTotales: semanas },
    },
    // El reparto durante el descanso es todo vida y descanso: no se produce.
    { produccion: 0, comunidad: 0, vida: 0.5, descanso: 0.5 },
  )
}

/**
 * Reescribe la semana en curso con el reparto de una parada.
 *
 * Se queda en fase de vivir a proposito: las semanas de parada pasan solas.
 * Pedirle a alguien que acaba de irse de vacaciones que planifique sus dias
 * seria exactamente lo contrario de lo que son unas vacaciones.
 */
function semanaDeParada(state: GameState, alloc: Allocation): GameState {
  const bloques = planAutomatico(alloc)
  return {
    ...state,
    semana: { ...state.semana, bloques, fase: 'viviendo' },
    allocation: allocationDelPlan(bloques),
  }
}

/**
 * Burnout: la parada que no elegiste.
 *
 * Dura mas, dana la comunidad y no da bonus de vuelta. Lo unico que comparte
 * con las vacaciones es que se recupera fatiga. Nunca termina la partida.
 */
export function entrarEnBurnout(state: GameState): GameState {
  const { semanas, danoComunidad } = TUNABLES.burnout
  return semanaDeParada(
    {
      ...state,
      descanso: { tipo: 'burnout', semanasRestantes: semanas, semanasTotales: semanas },
      comunidad: state.comunidad * (1 - danoComunidad),
      burnouts: state.burnouts + 1,
    },
    { produccion: 0, comunidad: 0, vida: 0.4, descanso: 0.6 },
  )
}

export interface FinDescanso {
  state: GameState
  /** Que acaba de terminar, para poder contarlo en una tarjeta. */
  terminado: TipoDescanso | null
}

/**
 * Descuenta una semana de descanso. Al terminar, aplica lo que corresponda.
 *
 * La vuelta de vacaciones da hype y calidad durante unas semanas: es lo que
 * convierte "he estado fuera" en "vuelvo con ganas", y lo que hace que parar
 * no se sienta como perder el sitio.
 */
export function avanzarDescanso(state: GameState): FinDescanso {
  const d = state.descanso
  if (!d) return { state, terminado: null }

  const restantes = d.semanasRestantes - 1
  if (restantes > 0) {
    return { state: { ...state, descanso: { ...d, semanasRestantes: restantes } }, terminado: null }
  }

  if (d.tipo === 'burnout') {
    // Sin bonus. Volver de un burnout no tiene premio.
    return { state: { ...state, descanso: null }, terminado: 'burnout' }
  }

  const { hypeVuelta, semanasBonus, calidadVuelta } = TUNABLES.vacaciones
  const conLegado = consolidarLegado({
    ...state,
    vacacionesCompletadas: state.vacacionesCompletadas + 1,
  })

  return {
    state: {
      ...conLegado,
      descanso: null,
      hype: Math.min(TUNABLES.hype.max, state.hype + hypeVuelta),
      modificadores: [
        ...state.modificadores.filter((m) => m.id !== 'vuelta-vacaciones'),
        {
          id: 'vuelta-vacaciones',
          etiqueta: 'De vuelta con ganas',
          hastaSemana: state.week + semanasBonus,
          calidad: calidadVuelta,
          eficiencia: 1,
          alcance: 1,
        },
      ],
    },
    terminado: 'vacaciones',
  }
}

/** Recuperacion por segundo mientras se esta parado. */
export function recuperacionDescanso(tipo: TipoDescanso): { fatiga: number; vida: number } {
  const t = tipo === 'vacaciones' ? TUNABLES.vacaciones : TUNABLES.burnout
  return { fatiga: t.recuperaFatigaPorSegundo, vida: t.recuperaVidaPorSegundo }
}

/**
 * Legado: las vacaciones como prestigio suave.
 *
 * Volver de vacaciones convierte parte de la comunidad en multiplicadores
 * PERMANENTES de eficiencia y retencion. Es lo que hace que el jugador desee
 * las vacaciones en vez de limitarse a tolerarlas, y lo que el GDD apunta en
 * 6.4 cuando dice que pueden actuar como prestigio.
 *
 * Estuvo atado al cierre de ciclo y no funcionaba: el banco enseno que los
 * ciclos se cierran mucho antes de que nadie se plantee parar, asi que no se
 * consolidaba nunca. Atado a la vuelta de vacaciones el vinculo causal es
 * directo: descansas, ganas algo que no se pierde.
 *
 * Se consume comunidad a proposito: el prestigio cuesta algo, o no es una
 * decision.
 */
export function consolidarLegado(state: GameState): GameState {
  const { fraccionComunidad, eficienciaPorCiclo, retencionPorCiclo, maxEficiencia, maxRetencion } =
    TUNABLES.legado

  if (state.vacacionesCompletadas === 0) return state

  return {
    ...state,
    comunidad: state.comunidad * (1 - fraccionComunidad),
    legadoEficiencia: Math.min(maxEficiencia, state.legadoEficiencia * eficienciaPorCiclo),
    legadoRetencion: Math.min(maxRetencion, state.legadoRetencion * retencionPorCiclo),
  }
}

/** Aplica la recuperacion del descanso a vida y fatiga. */
export function aplicarRecuperacion(
  state: Pick<GameState, 'vida' | 'fatiga'>,
  tipo: TipoDescanso,
  dt: number,
): { vida: number; fatiga: number } {
  const r = recuperacionDescanso(tipo)
  return {
    vida: clamp01(state.vida + r.vida * dt),
    fatiga: clamp01(state.fatiga - r.fatiga * dt),
  }
}
