import { BIG_POR_ID } from '../content/bigEvents.ts'
import { LIBRO_POR_ID } from '../content/books.ts'
import { houseStage } from '../content/houseStages.ts'
import { CYCLE_POR_NUMERO } from '../content/cycles.ts'
import {
  MODA_POR_CATEGORIA,
  PATROCINIO_POR_ID,
  type CategoriaMarca,
} from '../content/patrocinios.ts'
import type { GameState } from '../sim/state.ts'
import type { TokenKey } from '../ui/theme/palette.ts'

/**
 * EL REGISTRO — lo que ha ido pasando, contado en una linea.
 *
 * Un incremental que solo ensena numeros subiendo se siente como una hoja de
 * calculo: pasan cosas, pero no PARECE que pase nada. El registro es lo que
 * convierte "publicacionesTotales: 41 -> 42" en "has publicado un video", y
 * lo hace sin que el jugador tenga que estar mirando la cifra correcta en el
 * momento correcto.
 *
 * SE DERIVA, NO SE GUARDA. Todo esto sale de comparar dos estados
 * consecutivos, asi que el motor no se entera de que existe: ni un campo
 * nuevo en `GameState`, ni una version de guardado, ni una linea del banco de
 * balance que se mueva. Un registro que se borre al recargar la pagina es un
 * precio ridiculo comparado con meter una lista de texto dentro de la
 * simulacion determinista.
 *
 * Los glifos son tipograficos y no emoji a proposito: el juego entero esta
 * dibujado con fuente de pixeles sobre fondo oscuro, y un emoji a todo color
 * en medio se lee como un error de renderizado. El color lo pone el token.
 */

export interface EntradaRegistro {
  id: number
  /** Semana de la partida en la que paso. Es el reloj que usa el jugador. */
  semana: number
  glifo: string
  texto: string
  token: TokenKey
}

/** Cuantas entradas se conservan. Mas arriba nadie sube a mirar. */
export const MAX_REGISTRO = 40

type Nueva = Omit<EntradaRegistro, 'id'>

/**
 * Que ha cambiado entre dos estados, dicho en castellano.
 *
 * Pura: mismos dos estados, mismas lineas. Es lo que la hace testeable sin
 * montar un store ni un React.
 */
export function derivarRegistro(antes: GameState, ahora: GameState): Nueva[] {
  const salida: Nueva[] = []
  const anotar = (glifo: string, token: TokenKey, texto: string) => {
    salida.push({ semana: ahora.week, glifo, token, texto })
  }

  // --- Lo que hace el jugador ---------------------------------------------
  const publicados = ahora.publicacionesTotales - antes.publicacionesTotales
  if (publicados === 1) anotar('▶', 'alcance', 'Nuevo vídeo publicado')
  else if (publicados > 1) anotar('▶', 'alcance', `${publicados} vídeos publicados`)

  if (ahora.clip.acertados > antes.clip.acertados) {
    anotar('✂', 'hype', 'Has cazado el momento')
  }

  if (ahora.houseStage > antes.houseStage) {
    anotar('⌂', 'vida', `Te has mudado: ${houseStage(ahora.houseStage).nombre}`)
  }

  // --- Lo que pasa solo -----------------------------------------------------
  const libro = nuevoLibro(antes, ahora)
  if (libro) anotar('≡', 'ideas', `Has terminado ${libro}`)

  if (ahora.cycle > antes.cycle) {
    const c = CYCLE_POR_NUMERO.get(ahora.cycle)
    anotar('◆', 'calidad', `Empieza una etapa nueva: ${c?.nombre ?? `ciclo ${ahora.cycle}`}`)
  }

  if (ahora.evento && ahora.evento.id !== antes.evento?.id) {
    const def = BIG_POR_ID.get(ahora.evento.id)
    if (def) anotar('★', 'hype', `Se acerca algo: ${def.nombre}`)
  }

  // --- Parar, por gusto o por obligacion -----------------------------------
  if (ahora.descanso && !antes.descanso) {
    if (ahora.descanso.tipo === 'vacaciones') anotar('☾', 'vida', 'Te vas unas semanas')
    else anotar('☾', 'fatiga', 'Has parado en seco. No quedaba otra')
  }
  if (!ahora.descanso && antes.descanso) {
    if (antes.descanso.tipo === 'vacaciones') anotar('☾', 'vida', 'De vuelta, y con ganas')
    else anotar('☾', 'fatiga', 'De vuelta. Ha costado')
  }

  // --- Marcas ---------------------------------------------------------------
  for (const c of ahora.contratos) {
    if (antes.contratos.some((p) => p.id === c.id)) continue
    const def = PATROCINIO_POR_ID.get(c.id)
    anotar('€', 'ingresos', `Has firmado con ${def?.marca ?? 'una marca'}`)
  }
  // Solo la resaca que te toca a TI. Las modas estallan las firmes o no, pero
  // una que no te salpica no es una noticia del canal, es meteorologia.
  if (ahora.resacaPendiente && ahora.resacaPendiente !== antes.resacaPendiente) {
    const moda = MODA_POR_CATEGORIA.get(ahora.resacaPendiente as CategoriaMarca)
    anotar('€', 'credibilidad', `Ha estallado: ${moda?.nombre ?? ahora.resacaPendiente}`)
  }

  return salida
}

/** El titulo del libro que se acaba de terminar, si es que se ha terminado uno. */
function nuevoLibro(antes: GameState, ahora: GameState): string | null {
  if (ahora.lectura.leidos.length <= antes.lectura.leidos.length) return null
  const id = ahora.lectura.leidos[ahora.lectura.leidos.length - 1]
  return id ? (LIBRO_POR_ID.get(id)?.titulo ?? null) : null
}

/** Anade entradas al registro sin dejarlo crecer sin limite. Las nuevas, arriba. */
export function empujarRegistro(
  registro: readonly EntradaRegistro[],
  nuevas: readonly Nueva[],
  siguienteId: number,
): { registro: EntradaRegistro[]; siguienteId: number } {
  if (nuevas.length === 0) return { registro: registro as EntradaRegistro[], siguienteId }

  let id = siguienteId
  const conId = nuevas.map((n) => ({ ...n, id: id++ }))
  return {
    registro: [...conId.reverse(), ...registro].slice(0, MAX_REGISTRO),
    siguienteId: id,
  }
}
