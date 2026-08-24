import { UPGRADES_POR_ID, VIDA_MINIMA_PARA_RUTINA, type Upgrade } from '../content/upgrades.ts'
import { normalizeAllocation, type Allocation } from './state.ts'

/**
 * El nucleo del hibrido, en un solo sitio.
 *
 * Hay UNA representacion interna de en que gasta el tiempo el creador: el
 * reparto normalizado de `Allocation`. Lo que cambia entre las dos mitades de
 * la partida es quien lo escribe:
 *
 *   Ciclos 1-2  el reparto lo DERIVAN las mejoras compradas. El jugador cree
 *               estar comprando generadores de un incremental clasico.
 *   Ciclo 3+    el jugador toma el control directo de esos mismos numeros,
 *               tras sistematizar su propio flujo de trabajo.
 *
 * Por eso no hay dos motores de progresion que mantener, ni un sistema que se
 * jubile a mitad de partida: hay uno con dos interfaces.
 */

/** Reparto de arranque: mucha produccion, algo de vida, poco descanso. */
const SLOTS_BASE: Record<keyof Allocation, number> = {
  produccion: 7,
  comunidad: 1,
  vida: 2,
  descanso: 1,
}

export type Owned = Readonly<Record<string, number>>

/** Suma los slots de todo lo comprado y devuelve el reparto normalizado. */
export function derivarAllocation(owned: Owned): Allocation {
  const slots = { ...SLOTS_BASE }

  for (const [id, niveles] of Object.entries(owned)) {
    if (!niveles) continue
    const up = UPGRADES_POR_ID.get(id)
    if (!up?.efecto.slots) continue
    for (const [actividad, peso] of Object.entries(up.efecto.slots)) {
      const clave = actividad as keyof Allocation
      slots[clave] += (peso ?? 0) * niveles
    }
  }

  return normalizeAllocation(slots)
}

export interface Multiplicadores {
  eficiencia: number
  calidad: number
  alcance: number
  /** Etapa de casa alcanzada por las mejoras compradas. */
  casa: number
}

/** Multiplicadores acumulados de todo lo comprado. */
export function derivarMultiplicadores(owned: Owned): Multiplicadores {
  let eficiencia = 1
  let calidad = 1
  let alcance = 1
  let casa = 0

  for (const [id, niveles] of Object.entries(owned)) {
    if (!niveles) continue
    const up = UPGRADES_POR_ID.get(id)
    if (!up) continue
    const e = up.efecto
    if (e.multEficiencia) eficiencia *= Math.pow(e.multEficiencia, niveles)
    if (e.multCalidad) calidad *= Math.pow(e.multCalidad, niveles)
    if (e.multAlcance) alcance *= Math.pow(e.multAlcance, niveles)
    if (e.subeCasa) casa += niveles
  }

  return { eficiencia, calidad, alcance, casa }
}

/** Cuanto cuesta el siguiente nivel de una mejora. */
export function costeSiguiente(up: Upgrade, niveles: number): number {
  return Math.ceil(up.coste * Math.pow(up.escala, niveles))
}

export type MotivoBloqueo =
  | 'agotada'
  | 'ciclo'
  | 'dinero'
  | 'ideas'
  | 'material'
  | 'vida'
  | null

export interface Disponibilidad {
  visible: boolean
  comprable: boolean
  motivo: MotivoBloqueo
  coste: number
  costeIdeas: number
  costeMaterial: number
  costeVida: number
}

/** Lo que hay que tener para comprar algo. */
export interface Bolsillo {
  ahorros: number
  ideas: number
  material: number
  vida: number
}

/**
 * Se puede comprar? Y si no, por que. La UI necesita saber ambas cosas.
 *
 * Los cuatro costes se comprueban en el mismo orden en que la tienda los
 * cuenta, para que el motivo que se enseña sea siempre el primero que falla.
 */
export function disponibilidad(
  up: Upgrade,
  owned: Owned,
  ciclo: number,
  bolsillo: Bolsillo,
): Disponibilidad {
  const niveles = owned[up.id] ?? 0
  const coste = costeSiguiente(up, niveles)
  const costeIdeas = up.costeIdeas ?? 0
  const costeMaterial = up.costeMaterial ?? 0
  const costeVida = up.costeVida ?? 0
  const visible = ciclo >= (up.desdeCiclo ?? 1)

  let motivo: MotivoBloqueo = null
  if (niveles >= up.maximo) motivo = 'agotada'
  else if (!visible) motivo = 'ciclo'
  else if (bolsillo.ahorros < coste) motivo = 'dinero'
  else if (bolsillo.ideas < costeIdeas) motivo = 'ideas'
  else if (bolsillo.material < costeMaterial) motivo = 'material'
  // No se puede reorganizar la vida estando hecho polvo: el suelo no es un
  // capricho, es la mitad de lo que quiere decir la categoria.
  else if (costeVida > 0 && bolsillo.vida - costeVida < VIDA_MINIMA_PARA_RUTINA) motivo = 'vida'

  return {
    visible,
    comprable: motivo === null,
    motivo,
    coste,
    costeIdeas,
    costeMaterial,
    costeVida,
  }
}

/** El bolsillo de una partida, para no repetir el mismo objeto en cada sitio. */
export function bolsilloDe(state: {
  ahorros: number
  ideas: number
  material: number
  vida: number
}): Bolsillo {
  return {
    ahorros: state.ahorros,
    ideas: state.ideas,
    material: state.material,
    vida: state.vida,
  }
}
