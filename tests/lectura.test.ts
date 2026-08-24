import { describe, expect, it } from 'vitest'
import { LIBROS, LIBRO_POR_ID, SINERGIAS } from '../src/content/books.ts'
import { UPGRADES_POR_ID } from '../src/content/upgrades.ts'
import { LIFE_EVENTS } from '../src/content/lifeEvents.ts'
import {
  avanzarLectura,
  bonosDeColeccion,
  candidatos,
  crearLectura,
  porTema,
  ritmoDeLectura,
  siguienteLibro,
  sinergiasActivas,
} from '../src/sim/lectura.ts'
import { createInitialState, type GameState } from '../src/sim/state.ts'
import { lanzarSemana, llenarSemana } from '../src/sim/semana.ts'
import { step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

function semanaDe(bloque: Parameters<typeof llenarSemana>[1], over: Partial<GameState> = {}) {
  const base = { ...createInitialState(), ...over }
  return lanzarSemana({ ...base, semana: llenarSemana(base.semana, bloque) })
}

describe('integridad del catalogo de libros', () => {
  it('los ids son unicos', () => {
    expect(new Set(LIBROS.map((l) => l.id)).size).toBe(LIBROS.length)
  })

  it('todos tienen titulo, autor, tema y algo que decir al cerrarlos', () => {
    for (const l of LIBROS) {
      expect(l.titulo.length, l.id).toBeGreaterThan(3)
      expect(l.autor.length, l.id).toBeGreaterThan(1)
      expect(l.paginas, l.id).toBeGreaterThan(0)
      expect(l.cierre.length, l.id).toBeGreaterThan(20)
    }
  })

  it('hay libros de los cuatro temas', () => {
    const temas = new Set(LIBROS.map((l) => l.tema))
    expect(temas.size).toBe(4)
  })

  it('cada sinergia se puede completar con los libros que hay', () => {
    const cuenta = porTema(LIBROS.map((l) => l.id))
    for (const s of SINERGIAS) {
      expect(cuenta[s.tema], `no hay libros suficientes de ${s.tema}`).toBeGreaterThanOrEqual(
        s.minimo,
      )
    }
  })
})

describe('leer cuesta horas del dia a dia', () => {
  it('la franja de leer avanza mas que la de vivir', () => {
    // Que la de vivir avance algo es el matiz: entre cocinar y salir tambien
    // caen paginas, pero no las mismas.
    expect(ritmoDeLectura('leer', 0)).toBeGreaterThan(ritmoDeLectura('vida', 0))
    expect(ritmoDeLectura('vida', 0)).toBeGreaterThan(0)
  })

  it('emitir, editar, comunidad y dormir no avanzan ningun libro', () => {
    for (const b of ['emitir', 'editar', 'comunidad', 'dormir'] as const) {
      expect(ritmoDeLectura(b, 0), b).toBe(0)
    }
  })

  it('el habito no crea tiempo: hace que cunda el que ya dedicas', () => {
    // Si el habito regalase horas, leer volveria a ser gratis.
    expect(ritmoDeLectura('leer', 2)).toBeGreaterThan(ritmoDeLectura('leer', 0))
    expect(ritmoDeLectura('dormir', 3)).toBe(0)
  })

  it('la mejora del habito ya no promete que se duerme mejor', () => {
    // La queja que origino todo esto: leer no pasa antes de dormir.
    const up = UPGRADES_POR_ID.get('leer')
    expect(up).toBeDefined()
    expect(up?.nombre.toLowerCase()).not.toContain('dormir')
    expect(up?.descripcion.toLowerCase()).not.toContain('duerme')
  })

  it('la tarjeta del libro tampoco ocurre de madrugada', () => {
    const tarjeta = LIFE_EVENTS.find((e) => e.id === 'libro-tarde')
    expect(tarjeta).toBeDefined()
    expect(tarjeta?.texto.toLowerCase()).not.toContain('antes de dormir')
  })
})

describe('un libro se empieza, avanza y se termina', () => {
  it('sin franja de leer no se abre ninguno', () => {
    const s = createInitialState()
    expect(avanzarLectura(s, 'emitir', 10).lectura.libro).toBeNull()
  })

  it('la primera franja de leer abre el primer libro disponible', () => {
    const s = createInitialState()
    const r = avanzarLectura(s, 'leer', 1)
    expect(r.lectura.libro).toBe(siguienteLibro(s))
    expect(r.lectura.progreso).toBeGreaterThan(0)
    expect(r.terminado).toBeNull()
  })

  it('al llegar al final se cierra y entra en la coleccion', () => {
    const s = createInitialState()
    const id = siguienteLibro(s)!
    const paginas = LIBRO_POR_ID.get(id)!.paginas
    const r = avanzarLectura(s, 'leer', paginas + 1)
    expect(r.terminado?.id).toBe(id)
    expect(r.lectura.leidos).toContain(id)
    expect(r.lectura.libro).toBeNull()
  })

  it('no se repite un libro ya leido', () => {
    const s: GameState = {
      ...createInitialState(),
      lectura: { ...crearLectura(), leidos: [LIBROS[0]!.id] },
    }
    expect(candidatos(s).map((l) => l.id)).not.toContain(LIBROS[0]!.id)
    expect(siguienteLibro(s)).not.toBe(LIBROS[0]!.id)
  })

  it('los libros tardios no aparecen en el ciclo 1', () => {
    const tardio = LIBROS.find((l) => (l.desdeCiclo ?? 1) > 1)
    expect(tardio).toBeDefined()
    expect(candidatos(createInitialState()).map((l) => l.id)).not.toContain(tardio!.id)
  })

  it('sin libros que leer no rompe nada', () => {
    const s: GameState = {
      ...createInitialState(),
      cycle: 5,
      lectura: { ...crearLectura(), leidos: LIBROS.map((l) => l.id) },
    }
    expect(siguienteLibro(s)).toBeNull()
    expect(avanzarLectura(s, 'leer', 100).terminado).toBeNull()
  })
})

describe('en la partida de verdad', () => {
  it('una semana de leer avanza el libro de la mesilla', () => {
    let s = semanaDe('leer')
    for (let i = 0; i < 300; i++) s = step(s, TUNABLES.tickMs)
    expect(s.lectura.libro).not.toBeNull()
    expect(s.lectura.progreso).toBeGreaterThan(0)
  })

  it('terminar un libro da ideas de golpe y deja poso unas semanas', () => {
    let s = semanaDe('leer')
    const ticks = 900 * 3
    for (let i = 0; i < ticks && s.lectura.leidos.length === 0; i++) {
      s = { ...step(s, TUNABLES.tickMs), semana: { ...s.semana, fase: 'viviendo' } }
    }
    expect(s.lectura.leidos.length).toBeGreaterThan(0)
    expect(s.ideas).toBeGreaterThan(TUNABLES.lectura.ideasPorLibro - 1)
    expect(s.modificadores.some((m) => m.id === 'libro-terminado')).toBe(true)
  })

  it('una semana emitiendo no avanza ningun libro', () => {
    let s = semanaDe('emitir')
    for (let i = 0; i < 300; i++) s = step(s, TUNABLES.tickMs)
    expect(s.lectura.libro).toBeNull()
    expect(s.lectura.progreso).toBe(0)
  })
})

describe('la coleccion deja poso, no una via de progresion', () => {
  it('sin libros leidos no aporta nada', () => {
    const b = bonosDeColeccion([])
    expect(b.calidad).toBe(1)
    expect(b.eficiencia).toBe(1)
    expect(b.afinidad).toBe(1)
  })

  it('dos del mismo tema activan su sinergia', () => {
    const novelas = LIBROS.filter((l) => l.tema === 'novela')
      .slice(0, 2)
      .map((l) => l.id)
    expect(sinergiasActivas(novelas).length).toBeGreaterThan(0)
  })

  it('leerlo TODO sigue siendo un poso pequeño', () => {
    /**
     * El limite que protege el diseño: si la coleccion diese multiplicadores
     * gordos, leer dejaria de ser leer y seria otro generador. Con todo el
     * catalogo leido ninguna via pasa del 15%.
     */
    const b = bonosDeColeccion(LIBROS.map((l) => l.id))
    expect(b.calidad).toBeLessThan(1.15)
    expect(b.eficiencia).toBeLessThan(1.15)
    expect(b.afinidad).toBeLessThan(1.15)
    expect(b.calidad * b.eficiencia * b.afinidad).toBeGreaterThan(1)
  })
})
