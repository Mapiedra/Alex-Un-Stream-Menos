export type PantallaId =
  | 'semana'
  | 'canal'
  | 'marcas'
  | 'tienda'
  | 'vida'
  | 'carrera'
  | 'ayuda'

export const PANTALLAS: Array<{ id: PantallaId; nombre: string; ayuda: string }> = [
  { id: 'semana', nombre: 'Semana', ayuda: 'Repartir las franjas y lanzar la semana' },
  { id: 'canal', nombre: 'Canal', ayuda: 'Cómo va: curvas, cifras y formato' },
  { id: 'marcas', nombre: 'Marcas', ayuda: 'Quién quiere pagarte y qué te va a costar' },
  { id: 'tienda', nombre: 'Tienda', ayuda: 'Equipo, flujo, rutina, casa y formatos' },
  { id: 'vida', nombre: 'Vida', ayuda: 'Parar, momentos grandes y la mesilla' },
  { id: 'carrera', nombre: 'Carrera', ayuda: 'Dónde vas y qué falta para poder dejarlo' },
  { id: 'ayuda', nombre: 'Ayuda', ayuda: 'Cómo se juega, opciones y salir' },
]

interface Props {
  activa: PantallaId
  onCambiar: (id: PantallaId) => void
  /** Pantallas que reclaman atencion ahora mismo. */
  avisos: Partial<Record<PantallaId, boolean>>
  /**
   * Pantallas que ya existen para este jugador.
   *
   * La interfaz crece con el personaje. Ensenar siete pestanas en el minuto
   * uno —cuando cuatro de ellas estan vacias porque sus sistemas no han
   * empezado— no informa de nada: entrena a ignorar la barra entera. Una
   * pantalla aparece cuando tiene algo dentro, y aparecer es en si mismo la
   * noticia de que el juego se ha hecho mas grande.
   */
  disponibles: readonly PantallaId[]
}

/**
 * Las pantallas del juego.
 *
 * Hasta F8 todo colgaba de un unico scroll vertical: siete paneles seguidos,
 * y para cambiar de formato despues de comprar habia que subir y bajar la
 * pagina entera. El reproductor se queda fijo arriba —es la identidad del
 * juego— y lo de debajo pasa a ser una pantalla cada vez.
 *
 * El punto rojo no es decoracion: marca lo que esta esperando una decision.
 * Sin el, acabarse la semana en la pestaña de la tienda seria invisible.
 */
export function Pestanas({ activa, onCambiar, avisos, disponibles }: Props) {
  return (
    <nav className="pestanas" aria-label="Pantallas">
      {PANTALLAS.filter((p) => disponibles.includes(p.id)).map((p) => (
        <button
          key={p.id}
          className="pestanas__boton"
          data-activa={p.id === activa}
          data-aviso={Boolean(avisos[p.id])}
          onClick={() => onCambiar(p.id)}
          title={p.ayuda}
          aria-current={p.id === activa ? 'page' : undefined}
        >
          {p.nombre}
          {avisos[p.id] && <span className="pestanas__punto" aria-label="pendiente" />}
        </button>
      ))}
    </nav>
  )
}
