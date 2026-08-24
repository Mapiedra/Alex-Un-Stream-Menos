import { UPGRADES, type Categoria } from '../../src/content/upgrades.ts'
import { bolsilloDe, disponibilidad } from '../../src/sim/allocation.ts'
import { cobertura } from '../../src/sim/final.ts'
import type { Allocation, GameState } from '../../src/sim/state.ts'
import type { OfertaPatrocinio } from '../../src/content/patrocinios.ts'

/**
 * Fase de libertad: el momento en que las cuentas ya salen.
 *
 * Un jugador que llega aqui y sigue currando doce horas no se esta retirando
 * de nada, y el juego se lo dice: la ultima condicion de la seccion 11 es
 * sostenerlo TRABAJANDO POCO. Los bots serios bajan las horas cuando pueden,
 * que es justo lo que el GDD quiere que el jugador aprenda.
 *
 * El disparador incluye el ciclo 5 ademas de la cobertura porque con solo la
 * cobertura habia filo de navaja: un bot con cobertura 1.09 y umbral 1.10 no
 * bajaba horas nunca, y por tanto no cumplia la condicion de las horas, y por
 * tanto no se retiraba jamas. Un jugador de carne y hueso no se queda
 * atrapado en eso: ve el panel y decide.
 */
const enLibertad = (s: GameState): boolean => cobertura(s) >= 1 || s.cycle >= 5

const LIBRE: Allocation = { produccion: 0.15, comunidad: 0.35, vida: 0.25, descanso: 0.25 }

/**
 * Un bot es una politica de juego: decide como reparte el tiempo, que compra y
 * cuando publica. Existen para medir el balance, no para jugar bonito.
 *
 * Compran de verdad, porque si no el banco mediria un juego que no existe: en
 * los ciclos 1-2 el reparto del tiempo lo derivan las compras, asi que un bot
 * que no compra tampoco cambia sus horas.
 */
export interface Bot {
  id: string
  descripcion: string
  /** Reparto manual. Si se omite, lo derivan las mejoras compradas. */
  allocation?: (s: GameState) => Allocation
  /** Prioridad de categorias. Compra la primera que se pueda permitir. */
  prioridad: Categoria[]
  /** Compra siquiera? El bot avaro casi no. */
  compra?: (s: GameState) => boolean
  /** Se va de vacaciones? Si se omite, no para nunca por voluntad propia. */
  vacaciones?: (s: GameState) => boolean
  /** Invierte en preparar la conferencia cuando la anuncian? */
  prepara?: boolean
  /**
   * Firma esta oferta de marca? Si se omite, no firma NUNCA.
   *
   * El defecto no es neutral por casualidad: los ocho bots que ya existian
   * miden otras cosas y tienen que seguir midiendo lo mismo que antes de que
   * existieran los patrocinios. Si el defecto fuera "firma", el banco entero
   * cambiaria de significado de golpe.
   */
  patrocinio?: (s: GameState, oferta: OfertaPatrocinio) => boolean
  publish: (s: GameState) => boolean
}

const cada = (s: GameState, segundos: number): boolean =>
  Math.floor(s.elapsedMs / 1000) % segundos === 0 && s.elapsedMs % 1000 < 100

/**
 * Siguiente compra segun la prioridad del bot.
 *
 * Dentro de una categoria compra lo mas barato primero: es lo que hace una
 * persona que no se ha leido una hoja de calculo antes de jugar.
 */
export function siguienteCompra(s: GameState, prioridad: Categoria[]): string | null {
  for (const cat of prioridad) {
    const candidatas = UPGRADES.filter((u) => u.categoria === cat)
      .map((u) => ({ u, d: disponibilidad(u, s.owned, s.cycle, bolsilloDe(s)) }))
      .filter((x) => x.d.comprable)
      .sort((a, b) => a.d.coste - b.d.coste)
    const elegida = candidatas[0]
    if (elegida) return elegida.u.id
  }
  return null
}

const TODO: Categoria[] = ['setup', 'flujo', 'rutina', 'formato', 'casa']

/**
 * El reparto de la politica equilibrada, que es la referencia del banco.
 *
 * Extraido para que los bots del sistema de marcas puedan clonarlo literal: si
 * cada uno llevase su propia copia, un retoque en la referencia dejaria de
 * aplicarse a los que la usan de control y las comparaciones dejarian de medir
 * lo que dicen medir.
 */
const repartoEquilibrado = (s: GameState): Allocation =>
  enLibertad(s)
    ? LIBRE
    : s.fatiga > 0.55
      ? { produccion: 0.25, comunidad: 0.2, vida: 0.25, descanso: 0.3 }
      : { produccion: 0.5, comunidad: 0.25, vida: 0.15, descanso: 0.1 }

export const BOTS: Bot[] = [
  {
    id: 'grind',
    descripcion: 'Solo compra lo que produce mas. Nunca descansa.',
    allocation: () => ({ produccion: 1, comunidad: 0, vida: 0, descanso: 0 }),
    prioridad: ['setup', 'flujo'],
    publish: (s) => cada(s, 8),
  },
  {
    id: 'calidad',
    descripcion: 'Prioriza descanso y vida para maximizar calidad.',
    allocation: (s) => (enLibertad(s) ? LIBRE : { produccion: 0.4, comunidad: 0.1, vida: 0.3, descanso: 0.2 }),
    prioridad: ['rutina', 'setup', 'flujo'],
    vacaciones: (s) => s.vacacionesCompletadas === 0 && s.week > 30,
    publish: (s) => cada(s, 12),
  },
  {
    id: 'comunidad',
    descripcion: 'Vuelca el tiempo en fidelizar.',
    allocation: (s) => (enLibertad(s) ? LIBRE : { produccion: 0.35, comunidad: 0.5, vida: 0.1, descanso: 0.05 }),
    prioridad: ['formato', 'rutina', 'setup'],
    vacaciones: (s) => s.vacacionesCompletadas === 0 && s.week > 30,
    publish: (s) => cada(s, 12),
  },
  {
    id: 'equilibrado',
    descripcion: 'Reparte, compra de todo, descansa una vez y baja horas al llegar.',
    allocation: (s) =>
      enLibertad(s)
        ? LIBRE
        : s.fatiga > 0.55
          ? { produccion: 0.25, comunidad: 0.2, vida: 0.25, descanso: 0.3 }
          : { produccion: 0.5, comunidad: 0.25, vida: 0.15, descanso: 0.1 },
    prioridad: TODO,
    // Una sola vez: lo minimo que pide la condicion del GDD.
    vacaciones: (s) => s.vacacionesCompletadas === 0 && s.week > 30,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'avaro',
    descripcion: 'Apenas compra y acumula. Detector de residuales demasiado generosos.',
    allocation: () => ({ produccion: 0.55, comunidad: 0.2, vida: 0.15, descanso: 0.1 }),
    prioridad: ['setup'],
    // Solo compra si le sobra mucho: su plan es jubilarse antes, no crecer.
    compra: (s) => s.ahorros > 3000,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'sin-descanso',
    descripcion: 'Clon del equilibrado que nunca descansa. Control del valor de parar.',
    allocation: () => ({ produccion: 0.7, comunidad: 0.25, vida: 0.05, descanso: 0 }),
    prioridad: TODO,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'vacacionero',
    descripcion: 'Como el equilibrado, pero para cada cierto tiempo por el Legado.',
    allocation: (s) =>
      enLibertad(s)
        ? LIBRE
        : s.fatiga > 0.55
          ? { produccion: 0.25, comunidad: 0.2, vida: 0.25, descanso: 0.3 }
          : { produccion: 0.5, comunidad: 0.25, vida: 0.15, descanso: 0.1 },
    prioridad: TODO,
    /**
     * Para cada 25 semanas, no cuando se cansa.
     *
     * El banco enseno que un jugador equilibrado NUNCA llega a cansarse de
     * verdad —su fatiga maxima es 0.06—, asi que un bot que solo parase por
     * agotamiento no pararia jamas. El motivo real para irse de vacaciones no
     * es el cansancio: es el Legado que consolida al cerrar un ciclo.
     */
    vacaciones: (s) => s.week > 0 && s.week % 25 === 0,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'aprovechado',
    descripcion: 'Como el equilibrado, pero prepara siempre la conferencia.',
    allocation: (s) =>
      enLibertad(s)
        ? LIBRE
        : s.fatiga > 0.55
          ? { produccion: 0.25, comunidad: 0.2, vida: 0.25, descanso: 0.3 }
          : { produccion: 0.5, comunidad: 0.25, vida: 0.15, descanso: 0.1 },
    prioridad: TODO,
    prepara: true,
    vacaciones: (s) => s.vacacionesCompletadas === 0 && s.week > 30,
    publish: (s) => cada(s, 10),
  },
  /**
   * Los tres bots del sistema de marcas. Clonan al equilibrado a proposito:
   * lo unico que cambia entre ellos es a que le dicen que si, asi que la
   * diferencia que mida el banco es la del sistema y no la de otra cosa.
   */
  {
    id: 'vendido',
    descripcion: 'Como el equilibrado, pero firma absolutamente todo.',
    allocation: repartoEquilibrado,
    prioridad: TODO,
    vacaciones: (s) => s.vacacionesCompletadas === 0 && s.week > 30,
    patrocinio: () => true,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'integro',
    descripcion: 'Como el equilibrado y no firma nada. El control del sistema.',
    allocation: repartoEquilibrado,
    prioridad: TODO,
    vacaciones: (s) => s.vacacionesCompletadas === 0 && s.week > 30,
    publish: (s) => cada(s, 10),
  },
  {
    id: 'selectivo',
    descripcion: 'Firma marcas sin moda y claves de indies. Nunca una moda.',
    allocation: repartoEquilibrado,
    prioridad: TODO,
    vacaciones: (s) => s.vacacionesCompletadas === 0 && s.week > 30,
    /**
     * Ni cripto, ni cajas, ni apuestas: nada que vaya a estallar.
     *
     * Y ademas SOLO con la cara limpia. Es la diferencia entre "acepto lo que
     * no es toxico" y "acepto con criterio": firmar sin parar marcas tibias
     * deja la credibilidad tan baja como firmar basura de vez en cuando, y una
     * politica que no mira eso no esta siendo selectiva, solo esta siendo
     * cobarde. Firma, se recupera, vuelve a firmar.
     */
    patrocinio: (s, o) => {
      if (s.credibilidad < 0.85) return false
      if (o.categoria === 'cripto' || o.categoria === 'cajas' || o.categoria === 'apuestas') {
        return false
      }
      return o.categoria === 'editora' ? o.costeCredibilidad <= 0 : true
    },
    publish: (s) => cada(s, 10),
  },
  {
    id: 'derivado',
    descripcion: 'No toca el reparto salvo al final. El jugador que solo compra.',
    // Sin reparto propio hasta que llega la libertad: hasta ahi manda lo que
    // ha comprado, como en los ciclos 1-2.
    allocation: (s) => (enLibertad(s) ? LIBRE : s.allocation),
    prioridad: TODO,
    vacaciones: (s) => s.vacacionesCompletadas === 0 && s.week > 30,
    publish: (s) => cada(s, 10),
  },
]
