import { createClipState } from '../clip.ts'
import { FORMATO_INICIAL } from '../../content/contentTypes.ts'
import { crearHistorial } from '../historial.ts'
import { SCHEMA_VERSION, type GameState } from '../state.ts'

/**
 * Migraciones de partidas guardadas.
 *
 * Una partida guardada sobrevive a los cambios del juego o no sirve de nada.
 * Cada version tiene una funcion que sube el estado a la siguiente, y se
 * aplican en cadena: un guardado de la v1 pasa por v1->v2, v2->v3, etc.
 *
 * Regla: una migracion NUNCA se edita despues de publicarse. Si algo esta mal,
 * se arregla en la siguiente. Editarla rompe las partidas de quien ya migro.
 */

/** Estado sin tipar tal y como sale del JSON. */
type Guardado = Record<string, unknown>

export type Migracion = (s: Guardado) => Guardado

export const MIGRACIONES: Record<number, Migracion> = {
  /**
   * v1 -> v2: la v1 no tenia mejoras compradas, ni momento clippeable, ni
   * chat. Se rellenan con sus valores por defecto; una partida vieja se
   * reanuda como si acabase de descubrir esos sistemas.
   */
  1: (s) => ({
    ...s,
    owned: {},
    clip: createClipState(),
    chat: [],
    chatNextId: 1,
    chatAcc: 0,
    schemaVersion: 2,
  }),

  /**
   * v2 -> v3: aparecen los formatos de contenido. Una partida vieja se
   * reanuda con el formato de arranque, que es el que estaba emitiendo de
   * hecho aunque el juego no lo nombrase.
   */
  2: (s) => ({
    ...s,
    formato: FORMATO_INICIAL,
    schemaVersion: 3,
  }),

  /**
   * v3 -> v4: aparecen las curvas de alcance y comunidad. Arrancan vacias; se
   * llenan solas en los primeros segundos de juego.
   */
  3: (s) => ({
    ...s,
    historial: crearHistorial(),
    schemaVersion: 4,
  }),

  /**
   * v4 -> v5: aparecen las tarjetas de vida. Una partida vieja empieza con la
   * baraja entera por ver y sin modificadores activos.
   */
  4: (s) => ({
    ...s,
    eventoPendiente: null,
    eventosVistos: [],
    ultimoEventoSemana: typeof s['week'] === 'number' ? s['week'] : 0,
    modificadores: [],
    schemaVersion: 5,
  }),

  /**
   * v5 -> v6: aparecen los eventos extraordinarios, las vacaciones y el
   * burnout. Una partida vieja se reanuda sin nada en curso.
   */
  5: (s) => ({
    ...s,
    evento: null,
    ultimoBigEvent: {},
    descanso: null,
    repartoAntesDeParar: null,
    schemaVersion: 6,
  }),
}

export class SaveIncompatible extends Error {}

/**
 * Sube un guardado hasta la version actual.
 *
 * Lanza si la partida viene de una version MAS NUEVA que la del juego: eso
 * significa que el jugador abrio una version antigua y bajar de version no se
 * puede hacer sin perder datos en silencio.
 */
export function migrar(s: Guardado): Guardado {
  let actual = s
  let version = typeof actual['schemaVersion'] === 'number' ? (actual['schemaVersion'] as number) : 0

  if (version > SCHEMA_VERSION) {
    throw new SaveIncompatible(
      `La partida es de la version ${version} y este build entiende hasta la ${SCHEMA_VERSION}.`,
    )
  }

  while (version < SCHEMA_VERSION) {
    const paso = MIGRACIONES[version]
    if (!paso) {
      throw new SaveIncompatible(`No hay migracion desde la version ${version}.`)
    }
    actual = paso(actual)
    const siguiente = actual['schemaVersion']
    if (typeof siguiente !== 'number' || siguiente <= version) {
      throw new SaveIncompatible(`La migracion desde ${version} no subio de version.`)
    }
    version = siguiente
  }

  return actual
}

/** Comprobacion minima de que lo migrado se parece a una partida. */
export function pareceGameState(s: Guardado): s is GameState & Guardado {
  const numericos = ['alcance', 'comunidad', 'vida', 'fatiga', 'ahorros', 'elapsedMs', 'cycle']
  return (
    numericos.every((k) => typeof s[k] === 'number' && Number.isFinite(s[k] as number)) &&
    typeof s['owned'] === 'object' &&
    s['owned'] !== null &&
    Array.isArray(s['catalogo']) &&
    Array.isArray(s['chat'])
  )
}
