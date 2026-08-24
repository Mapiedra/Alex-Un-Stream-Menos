import { contarBloques, type BloqueId } from '../sim/semana.ts'
import type { GameState } from '../sim/state.ts'

/**
 * EL BALANCE DE LA SEMANA.
 *
 * El juego ya te deja repartir veintiuna franjas, pero hasta ahora no te
 * contaba en que se convirtieron. Sin ese cierre, el planificador es un
 * formulario: colocas cosas, pasa un rato, y vuelves a colocar cosas sin
 * haber aprendido nada de la vuelta anterior.
 *
 * Esto es el cierre. Cuanto se movio cada cifra, en que se fue el tiempo, y
 * una frase que dice lo que las cifras significan — que es lo unico que
 * convierte una estadistica en informacion.
 *
 * Igual que el registro, se DERIVA de dos instantaneas del estado y no vive
 * dentro de la partida: el motor sigue sin saber que existe.
 */

/** Foto del estado al empezar una semana. */
export interface Instantanea {
  semana: number
  alcance: number
  comunidad: number
  calidad: number
  vida: number
  fatiga: number
  ahorros: number
  publicaciones: number
  credibilidad: number
}

export interface BalanceSemana {
  /** La semana que acaba de terminar. */
  semana: number
  alcance: number
  comunidad: number
  calidad: number
  vida: number
  fatiga: number
  ahorros: number
  publicaciones: number
  credibilidad: number
  /** En que se gastaron de verdad las franjas. */
  reparto: Record<BloqueId, number>
  /** Lo que dicen las cifras, dicho con palabras. */
  titular: string
}

export function instantanea(g: GameState): Instantanea {
  return {
    semana: g.week,
    alcance: g.alcance,
    comunidad: g.comunidad,
    calidad: g.calidad,
    vida: g.vida,
    fatiga: g.fatiga,
    ahorros: g.ahorros,
    publicaciones: g.publicacionesTotales,
    credibilidad: g.credibilidad,
  }
}

/**
 * El cierre de una semana: donde estabas al empezarla y donde has acabado.
 *
 * `bloques` es la semana que se ha vivido, no la que viene: lo que interesa
 * es que el jugador pueda atar el reparto que eligio con lo que le ha pasado.
 */
export function cerrarSemana(
  inicio: Instantanea,
  fin: GameState,
  bloques: readonly BloqueId[],
): BalanceSemana {
  const reparto = contarBloques(bloques)
  const alcance = fin.alcance - inicio.alcance
  const comunidad = fin.comunidad - inicio.comunidad

  return {
    semana: inicio.semana,
    alcance,
    comunidad,
    calidad: fin.calidad - inicio.calidad,
    vida: fin.vida - inicio.vida,
    fatiga: fin.fatiga - inicio.fatiga,
    ahorros: fin.ahorros - inicio.ahorros,
    publicaciones: fin.publicacionesTotales - inicio.publicaciones,
    credibilidad: fin.credibilidad - inicio.credibilidad,
    reparto,
    titular: titular(inicio, fin, reparto),
  }
}

/**
 * La frase.
 *
 * Se ordenan de mas urgente a mas anecdotica y gana la primera que aplique:
 * un titular que intente decir cinco cosas a la vez no dice ninguna. Lo que
 * hay arriba del todo es siempre lo que le va a costar caro al jugador si no
 * lo mira.
 */
function titular(
  inicio: Instantanea,
  fin: GameState,
  reparto: Record<BloqueId, number>,
): string {
  const dAlcance = relativo(inicio.alcance, fin.alcance)
  const dComunidad = relativo(inicio.comunidad, fin.comunidad)

  if (fin.fatiga > 0.75) {
    return 'Vas a reventar. Ninguna cifra de esta pantalla arregla eso.'
  }
  if (fin.fatiga - inicio.fatiga > 0.12) {
    return 'Te has cansado más de lo que has descansado. Dos semanas así y paras a la fuerza.'
  }
  if (fin.vida < 0.35) {
    return 'Llevas semanas sin vida propia, y la calidad sale justo de ahí.'
  }
  if (inicio.credibilidad - fin.credibilidad > 0.04) {
    return 'Has cobrado y has gastado cara. Se nota más adelante que ahora.'
  }
  if (reparto.emitir === 0 && fin.descanso === null) {
    return 'No has emitido ni una franja. El catálogo aguanta un tiempo, no siempre.'
  }
  if (dComunidad > dAlcance && dComunidad > 0.01) {
    return 'Tu comunidad crece más rápido que tu alcance. Eso es justo lo que aguanta cuando pares.'
  }
  if (dAlcance > 0.05 && dComunidad <= 0.005) {
    return 'Mucha gente te ha visto y casi nadie se ha quedado. Falta comunidad en la semana.'
  }
  if (dAlcance < -0.05) {
    return 'El alcance ha bajado. Mira si la comunidad ha bajado con él: casi nunca lo hace.'
  }
  if (reparto.leer + reparto.vida >= 6) {
    return 'Una semana con vida propia. Es la que sube la calidad de la siguiente.'
  }
  return 'Semana sin sobresaltos. La mayoría lo son, y de esas sale casi todo.'
}

/** Variacion en tanto por uno, a prueba de arranques desde cero. */
function relativo(antes: number, ahora: number): number {
  if (antes <= 0) return ahora > 0 ? 1 : 0
  return (ahora - antes) / antes
}
