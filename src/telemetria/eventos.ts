/**
 * Telemetria de la partida.
 *
 * QUE SE MANDA Y QUE NO
 *
 * Se manda solo lo que sirve para entender si el juego funciona: en que minuto
 * abandona la gente, que ciclo alcanza, que epilogo saca, que formatos usa.
 * NO se manda nada que identifique a nadie — ni cookie, ni huella, ni IP
 * guardada, ni identificador persistente. El id de sesion se genera al cargar
 * la pagina, vive en memoria y muere al cerrarla, asi que dos partidas de la
 * misma persona en dias distintos no se pueden enlazar.
 *
 * Con esos limites no hace falta banner de consentimiento, y ademas es lo
 * suficiente para todo lo que se quiere medir.
 *
 * DEGRADA SIN ROMPER: si no hay credenciales configuradas, cada envio es una
 * funcion vacia. El juego no depende de esto para nada.
 */

export type TipoEvento =
  | 'partida_iniciada'
  | 'ciclo_alcanzado'
  | 'primera_compra'
  | 'primer_formato'
  | 'primeras_vacaciones'
  | 'burnout'
  | 'evento_extraordinario'
  | 'partida_terminada'
  | 'progreso'

export interface Evento {
  tipo: TipoEvento
  /** Minutos de simulacion transcurridos. */
  minuto: number
  semana: number
  ciclo: number
  /** Datos sueltos del evento concreto. Nunca datos personales. */
  detalle?: Record<string, string | number | boolean>
}

const URL = import.meta.env['VITE_SUPABASE_URL'] as string | undefined
const KEY = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined

export const telemetriaActiva = Boolean(URL && KEY)

/**
 * Id de sesion efimero.
 *
 * Sirve para agrupar los eventos de UNA partida entre si. No se guarda en
 * ningun sitio: al recargar la pagina es otro distinto, a proposito.
 */
const sesion = crearId()

function crearId(): string {
  const c = globalThis.crypto
  if (c && 'randomUUID' in c) return c.randomUUID()
  return `s-${Math.floor(Math.random() * 1e12).toString(36)}`
}

/** Cola de envio. Se agrupa para no hacer una peticion por evento. */
let cola: Array<Evento & { sesion: string }> = []
let temporizador: ReturnType<typeof setTimeout> | null = null

const RETARDO_MS = 5000

export function registrar(evento: Evento): void {
  if (!telemetriaActiva) return

  cola.push({ ...evento, sesion })
  if (temporizador) return

  temporizador = setTimeout(() => {
    temporizador = null
    void vaciar()
  }, RETARDO_MS)
}

/**
 * Envia lo acumulado. Nunca lanza: si falla la red, se pierden los eventos y
 * no pasa absolutamente nada — la partida no depende de esto.
 */
export async function vaciar(): Promise<void> {
  if (!telemetriaActiva || cola.length === 0) return

  const lote = cola
  cola = []

  try {
    await fetch(`${URL}/rest/v1/eventos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: KEY ?? '',
        Authorization: `Bearer ${KEY ?? ''}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(lote),
      keepalive: true,
    })
  } catch {
    // Sin reintentos: unos eventos perdidos no cambian ninguna conclusion, y
    // reintentar en bucle si el usuario esta sin cobertura seria peor.
  }
}

/** Manda lo pendiente al cerrar la pestana, que es cuando mas se pierde. */
export function instalarCierre(): void {
  if (!telemetriaActiva) return
  globalThis.addEventListener?.('pagehide', () => {
    void vaciar()
  })
}
