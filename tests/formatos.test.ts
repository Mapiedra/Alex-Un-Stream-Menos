import { describe, expect, it } from 'vitest'
import { lanzarSemana } from '../src/sim/semana.ts'
import {
  CONTENT_POR_ID,
  CONTENT_TYPES,
  FORMATOS_ELEGIBLES,
  FORMATO_INICIAL,
} from '../src/content/contentTypes.ts'
import { createInitialState } from '../src/sim/state.ts'
import { cambiarFormato, publicar, step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

const jugar = (formato: string, ticks: number, semilla = 1) => {
  let s = cambiarFormato(createInitialState(semilla), formato)
  for (let i = 0; i < ticks; i++) s = step(lanzarSemana(s), TUNABLES.tickMs)
  return s
}

describe('integridad del catalogo de formatos', () => {
  it('los ids son unicos', () => {
    const ids = CONTENT_TYPES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('el formato de arranque existe y es elegible', () => {
    expect(CONTENT_POR_ID.has(FORMATO_INICIAL)).toBe(true)
    expect(FORMATOS_ELEGIBLES.some((f) => f.id === FORMATO_INICIAL)).toBe(true)
  })

  it('los formatos de evento no aparecen entre los elegibles', () => {
    // Conferencia, solidario y clip los dispara el juego, no el jugador.
    for (const f of FORMATOS_ELEGIBLES) expect(f.requiere).not.toBe('@evento')
    expect(CONTENT_TYPES.length).toBeGreaterThan(FORMATOS_ELEGIBLES.length)
  })

  it('todos los perfiles estan dentro de rango', () => {
    for (const f of CONTENT_TYPES) {
      expect(f.alcance, f.id).toBeGreaterThanOrEqual(0)
      expect(f.afinidad, f.id).toBeGreaterThan(0)
      expect(f.calidad, f.id).toBeGreaterThan(0)
      expect(f.coste, f.id).toBeGreaterThan(0)
    }
  })
})

describe('la tabla del GDD, en numeros', () => {
  /**
   * La seccion 5 del GDD describe cada formato con palabras. Estos tests son
   * esa tabla convertida en aserciones: si alguien reajusta los perfiles y
   * rompe la relacion entre ellos, el juego deja de decir lo que queria decir.
   */

  it('el juego popular trae mucha gente y fideliza poco', () => {
    const popular = CONTENT_POR_ID.get('popular')
    const charla = CONTENT_POR_ID.get('charla')
    expect(popular && charla).toBeTruthy()
    if (!popular || !charla) return
    expect(popular.alcance).toBeGreaterThan(charla.alcance)
    expect(popular.afinidad).toBeLessThan(charla.afinidad)
  })

  it('el club de lectura es el que menos alcance da y mas comunidad construye', () => {
    const club = CONTENT_POR_ID.get('club')
    expect(club).toBeDefined()
    if (!club) return
    const elegibles = FORMATOS_ELEGIBLES.filter((f) => f.id !== 'club')
    expect(Math.max(...elegibles.map((f) => f.afinidad))).toBeLessThan(club.afinidad)
  })

  it('el directo solidario no genera ingresos', () => {
    expect(CONTENT_POR_ID.get('solidario')?.ingresos).toBe(0)
  })

  it('cocinar y ver series cansan menos que producir', () => {
    const normal = CONTENT_POR_ID.get('directo')
    expect(normal).toBeDefined()
    if (!normal) return
    for (const id of ['cocina', 'series']) {
      expect(CONTENT_POR_ID.get(id)?.coste, id).toBeLessThan(normal.coste)
    }
  })
})

describe('el formato cambia el resultado del mismo trabajo', () => {
  it('el juego popular da mas alcance que la charla', () => {
    expect(jugar('popular', 600).alcance).toBeGreaterThan(jugar('charla', 600).alcance)
  })

  it('a igualdad de alcance, la charla convierte mas comunidad', () => {
    // Se parte del mismo alcance para aislar la afinidad del formato.
    const base = { ...createInitialState(4), alcance: 5000 }
    const conCharla = { ...cambiarFormato(base, 'charla') }
    const conPopular = { ...cambiarFormato(base, 'popular') }
    let a = conCharla
    let b = conPopular
    for (let i = 0; i < 300; i++) {
      a = step(lanzarSemana(a), TUNABLES.tickMs)
      b = step(lanzarSemana(b), TUNABLES.tickMs)
    }
    expect(a.comunidad).toBeGreaterThan(b.comunidad)
  })

  it('los formatos ligeros cansan menos', () => {
    // Con el reparto de arranque la fatiga ni sube: es una rutina sostenible.
    // Para comparar el desgaste de dos formatos hay que forzar horas.
    const forzando = (formato: string) => {
      let s = cambiarFormato(createInitialState(9), formato)
      s = { ...s, allocation: { produccion: 1, comunidad: 0, vida: 0, descanso: 0 } }
      for (let i = 0; i < 3000; i++) s = step(lanzarSemana(s), TUNABLES.tickMs)
      return s.fatiga
    }
    expect(forzando('cocina')).toBeLessThan(forzando('popular'))
  })

  it('el reparto de arranque es sostenible: la fatiga no sube sola', () => {
    // Empezar la partida acumulando fatiga sin hacer nada seria un castigo
    // gratuito. La fatiga tiene que ser consecuencia de forzar, no el estado
    // por defecto.
    // Desde F7 no es exactamente cero, y la razon es sana: dentro de la
    // semana las horas ya no estan mezcladas, van seguidas. Emitir cansa un
    // poco y dormir lo quita, asi que la fatiga hace diente de sierra en lugar
    // de quedarse clavada en el suelo. Lo que importa sigue siendo verdad: con
    // el reparto de arranque no se acumula, se recupera cada noche.
    const diezMinutos = jugar('directo', 6000).fatiga
    const veinteMinutos = jugar('directo', 12_000).fatiga
    expect(diezMinutos).toBeLessThan(0.05)
    expect(veinteMinutos).toBeLessThan(0.05)
  })

  it('publicar con un formato de mas calidad deja mas peso en el catalogo', () => {
    // Con material puesto a mano: lo que se mide es el peso que deja cada
    // formato, no cuanto tarda cada uno en dejar un video montado.
    const conClub = publicar({ ...jugar('club', 100), material: 10 })
    const conPopular = publicar({ ...jugar('popular', 100), material: 10 })
    const peso = (s: typeof conClub) => s.catalogo[0]?.weight ?? 0
    expect(peso(conClub)).toBeGreaterThan(peso(conPopular))
  })
})

describe('cambiarFormato', () => {
  it('cambia el formato activo', () => {
    expect(cambiarFormato(createInitialState(), 'popular').formato).toBe('popular')
  })

  it('un formato inexistente no hace nada', () => {
    const s = createInitialState()
    expect(cambiarFormato(s, 'no_existe')).toBe(s)
  })

  it('cambiar al que ya esta activo no crea estado nuevo', () => {
    const s = createInitialState()
    expect(cambiarFormato(s, s.formato)).toBe(s)
  })

  it('un formato borrado en una version futura no rompe la partida', () => {
    // Puede pasar al cargar un guardado antiguo: se cae al de arranque.
    const s = { ...createInitialState(), formato: 'formato_retirado' }
    expect(() => step(s, TUNABLES.tickMs)).not.toThrow()
  })
})
