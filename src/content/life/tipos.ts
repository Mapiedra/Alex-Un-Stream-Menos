/**
 * Tipos de las tarjetas de vida personal (seccion 7 del GDD).
 *
 * REGLA DEL GDD, literal: "poco impacto numerico, mucho sabor y ambientacion".
 * Estas tarjetas NO son una via de progresion paralela. Existen para que la
 * partida tenga textura y para que el jugador sienta que hay una vida ahi
 * detras, no para que optimice cual le sale mas rentable.
 *
 * Por eso todos los efectos son pequenos y ninguna opcion es una trampa: no
 * hay una respuesta correcta que memorizar, hay decisiones con sabor distinto.
 * Los tests de tests/lifeEvents.test.ts hacen cumplir esos limites.
 *
 * REGLA DE TONO (seccion 15): humor observacional, nunca caricatura. Los
 * eventos personales se tratan con ligereza y respeto. Nada de convertir
 * relaciones reales en estadisticas.
 */

export interface EfectoVida {
  /** Sumas directas, siempre pequenas. */
  vida?: number
  fatiga?: number
  ideas?: number
  /** Multiplicador temporal y cuantas semanas dura. */
  modificador?: {
    id: string
    etiqueta: string
    semanas: number
    calidad?: number
    eficiencia?: number
    alcance?: number
  }
}

export interface OpcionVida {
  texto: string
  /** Lo que pasa despues, en una linea. */
  resultado: string
  efecto: EfectoVida
}

export interface LifeEvent {
  id: string
  titulo: string
  texto: string
  /** Semana minima en la que puede salir. */
  desdeSemana?: number
  /** Etapa de casa minima. */
  desdeCasa?: number
  /** Peso relativo al sortear. */
  peso?: number
  opciones: OpcionVida[]
}
