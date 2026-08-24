import { describe, expect, it } from 'vitest'
import { createInitialState, type GameState } from '../src/sim/state.ts'
import { crearHistorial, type Historial } from '../src/sim/historial.ts'
import { planAutomatico } from '../src/sim/semana.ts'
import { LIBROS } from '../src/content/books.ts'
import { MODAS } from '../src/content/patrocinios.ts'
import { PATROCINIOS } from '../src/content/patrocinios.ts'
import { MAX_REGISTRO, derivarRegistro, empujarRegistro } from '../src/hud/registro.ts'
import { cerrarSemana, instantanea } from '../src/hud/balance.ts'
import { ritmos } from '../src/hud/ritmos.ts'
import { saltos, saltosDeMejora } from '../src/hud/flotantes.ts'

/**
 * EL HUD SE DERIVA, NO SE GUARDA.
 *
 * Registro, balance y numeros flotantes salen enteros de comparar dos estados
 * consecutivos. Esa es la regla que hace que anadir media interfaz nueva no
 * haya movido ni una cifra del banco de balance, y como toda regla de diseno
 * de este proyecto, se comprueba aqui y no se confia a la memoria de nadie.
 */

const g = (over: Partial<GameState> = {}): GameState => ({ ...createInitialState(7), ...over })

const serie = (h: Historial, alcance: number[], comunidad: number[]): Historial => ({
  ...h,
  alcance,
  comunidad,
})

describe('el HUD no forma parte de la partida', () => {
  it('el estado guardado no tiene ni registro ni balance ni flotantes', () => {
    const claves = Object.keys(createInitialState())
    for (const prohibida of ['registro', 'balance', 'balanceSemana', 'flotantes', 'ticker']) {
      expect(claves, `${prohibida} no puede vivir dentro de GameState`).not.toContain(prohibida)
    }
  })

  it('derivar no toca los estados que recibe', () => {
    const antes = g()
    const ahora = g({ publicacionesTotales: 1 })
    const copiaAntes = JSON.stringify(antes)
    const copiaAhora = JSON.stringify(ahora)

    derivarRegistro(antes, ahora)
    saltos(antes, ahora)
    cerrarSemana(instantanea(antes), ahora, ahora.semana.bloques)

    expect(JSON.stringify(antes)).toBe(copiaAntes)
    expect(JSON.stringify(ahora)).toBe(copiaAhora)
  })
})

describe('el registro cuenta lo que ha pasado', () => {
  it('dos estados iguales no generan ni una linea', () => {
    const s = g()
    expect(derivarRegistro(s, s)).toEqual([])
  })

  it('publicar se anota, y varios de golpe se cuentan', () => {
    const antes = g()
    expect(derivarRegistro(antes, g({ publicacionesTotales: 1 }))[0]?.texto).toContain('Nuevo vídeo')
    expect(derivarRegistro(antes, g({ publicacionesTotales: 3 }))[0]?.texto).toContain('3 vídeos')
  })

  it('terminar un libro lo nombra por su titulo', () => {
    const libro = LIBROS[0]!
    const antes = g()
    const ahora = g({ lectura: { ...antes.lectura, leidos: [libro.id] } })
    expect(derivarRegistro(antes, ahora)[0]?.texto).toContain(libro.titulo)
  })

  it('parar y volver se distinguen segun quien lo decidiera', () => {
    const antes = g()
    const vacaciones = derivarRegistro(
      antes,
      g({ descanso: { tipo: 'vacaciones', semanasRestantes: 3, semanasTotales: 3 } }),
    )
    const burnout = derivarRegistro(
      antes,
      g({ descanso: { tipo: 'burnout', semanasRestantes: 5, semanasTotales: 5 } }),
    )

    expect(vacaciones[0]?.token).toBe('vida')
    expect(burnout[0]?.token).toBe('fatiga')
  })

  it('firmar con una marca la nombra', () => {
    const oferta = PATROCINIOS[0]!
    const antes = g()
    const ahora = g({
      contratos: [
        {
          id: oferta.id,
          categoria: oferta.categoria,
          semanasRestantes: oferta.semanas,
          pagoSemanal: oferta.pagoSemanal,
          costeCredibilidad: oferta.costeCredibilidad,
          costeFatiga: oferta.costeFatiga ?? 0,
        },
      ],
    })
    expect(derivarRegistro(antes, ahora)[0]?.texto).toContain(oferta.marca)
  })

  /**
   * Una moda estalla la hayas firmado o no, pero la que no te salpica no es
   * una noticia de tu canal: es meteorologia. El motor lo separa apuntando
   * `resacaPendiente` solo cuando hay contratos firmados detras.
   */
  it('la resaca solo se cuenta cuando te toca a ti', () => {
    const moda = MODAS[0]!
    const antes = g()

    const ajena = derivarRegistro(antes, g({ resacas: [moda.categoria] }))
    expect(ajena).toEqual([])

    const propia = derivarRegistro(
      antes,
      g({ resacas: [moda.categoria], resacaPendiente: moda.categoria }),
    )
    expect(propia[0]?.texto).toContain(moda.nombre)
  })

  it('las entradas nuevas van arriba y la lista no crece sin limite', () => {
    let registro = empujarRegistro([], [], 1).registro
    let id = 1

    for (let i = 0; i < MAX_REGISTRO + 10; i++) {
      const r = empujarRegistro(
        registro,
        [{ semana: i, glifo: '▶', texto: `linea ${i}`, token: 'alcance' }],
        id,
      )
      registro = r.registro
      id = r.siguienteId
    }

    expect(registro).toHaveLength(MAX_REGISTRO)
    expect(registro[0]?.texto).toBe(`linea ${MAX_REGISTRO + 9}`)
    expect(new Set(registro.map((e) => e.id)).size).toBe(MAX_REGISTRO)
  })

  it('varias lineas del mismo paso conservan su orden entre ellas', () => {
    const { registro } = empujarRegistro(
      [],
      [
        { semana: 1, glifo: '▶', texto: 'primera', token: 'alcance' },
        { semana: 1, glifo: '✂', texto: 'segunda', token: 'hype' },
      ],
      1,
    )
    // La ultima que paso es la que se lee primero.
    expect(registro.map((e) => e.texto)).toEqual(['segunda', 'primera'])
  })
})

describe('el balance cierra la semana', () => {
  it('las cifras son diferencias, no totales', () => {
    const inicio = instantanea(g({ alcance: 1000, comunidad: 500, publicacionesTotales: 4 }))
    const fin = g({ alcance: 1600, comunidad: 540, publicacionesTotales: 7 })
    const b = cerrarSemana(inicio, fin, fin.semana.bloques)

    expect(b.alcance).toBe(600)
    expect(b.comunidad).toBe(40)
    expect(b.publicaciones).toBe(3)
  })

  it('cuenta las franjas de la semana que se ha vivido', () => {
    const bloques = planAutomatico({ produccion: 1, comunidad: 0, vida: 0, descanso: 0 })
    const b = cerrarSemana(instantanea(g()), g(), bloques)

    const total = Object.values(b.reparto).reduce((acc, n) => acc + n, 0)
    expect(total).toBe(bloques.length)
    expect(b.reparto.emitir + b.reparto.editar).toBe(bloques.length)
  })

  /**
   * El titular dice UNA cosa. Se ordenan de mas urgente a mas anecdotica y
   * gana la primera que aplique: lo que puede costarle caro al jugador va
   * siempre por delante de la lectura bonita de la semana.
   */
  it('lo urgente gana al titular bonito', () => {
    const inicio = instantanea(g({ alcance: 100, comunidad: 100 }))
    const reventado = cerrarSemana(
      inicio,
      g({ alcance: 100, comunidad: 400, fatiga: 0.8 }),
      g().semana.bloques,
    )
    expect(reventado.titular).toMatch(/reventar/i)

    const tranquilo = cerrarSemana(
      inicio,
      g({ alcance: 101, comunidad: 400, fatiga: 0.1 }),
      g().semana.bloques,
    )
    expect(tranquilo.titular).toMatch(/comunidad/i)
  })

  it('una semana sin emitir se avisa, y estando de vacaciones no', () => {
    const soloVida = planAutomatico({ produccion: 0, comunidad: 0, vida: 0.5, descanso: 0.5 })
    const inicio = instantanea(g())

    const trabajando = cerrarSemana(inicio, g({ fatiga: 0.1 }), soloVida)
    expect(trabajando.titular).toMatch(/no has emitido/i)

    const parado = cerrarSemana(
      inicio,
      g({ fatiga: 0.1, descanso: { tipo: 'vacaciones', semanasRestantes: 2, semanasTotales: 3 } }),
      soloVida,
    )
    expect(parado.titular).not.toMatch(/no has emitido/i)
  })
})

describe('los ritmos se miden, no se recalculan', () => {
  it('una serie que sube da ritmo positivo y una que cae, negativo', () => {
    const h = crearHistorial()
    const r = ritmos(serie(h, [100, 200, 300, 400], [400, 300, 200, 100]))

    expect(r.alcance).toBeGreaterThan(0)
    expect(r.comunidad).toBeLessThan(0)
    // Tres intervalos de 2 s: 300 de subida en 6 s.
    expect(r.alcance).toBeCloseTo(50, 5)
  })

  it('sin muestras suficientes no se inventa una pendiente', () => {
    expect(ritmos(crearHistorial())).toEqual({ alcance: 0, comunidad: 0 })
    expect(ritmos(serie(crearHistorial(), [10], [10])).alcance).toBe(0)
  })

  it('una serie plana da cero', () => {
    expect(ritmos(serie(crearHistorial(), [5, 5, 5, 5], [5, 5, 5, 5])).alcance).toBe(0)
  })
})

describe('los numeros flotantes', () => {
  it('el ruido por debajo del umbral no se pinta', () => {
    expect(saltos(g(), g({ alcance: 0.4 }))).toEqual([])
    expect(saltos(g(), g({ vida: g().vida + 0.001 }))).toEqual([])
  })

  it('subir y bajar se distinguen por el signo y por el color', () => {
    const sube = saltos(g(), g({ alcance: 1200 }))[0]
    expect(sube?.texto.startsWith('+')).toBe(true)
    expect(sube?.token).toBe('alcance')

    const baja = saltos(g({ alcance: 1200 }), g({ alcance: 100 }))[0]
    expect(baja?.texto.startsWith('+')).toBe(false)
    // Perder algo se pinta siempre igual, sea el recurso que sea.
    expect(baja?.token).toBe('fatiga')
  })

  it('cada flotante se ancla al recurso que ha movido', () => {
    const rs = saltos(g(), g({ alcance: 5000, comunidad: 5000 })).map((f) => f.recurso)
    expect(rs).toContain('alcance')
    expect(rs).toContain('comunidad')
  })

  /**
   * Comprar no mueve ningun recurso: mueve multiplicadores. Sin esto seria la
   * unica accion cara del juego que no responde al pulsarla.
   */
  it('comprar responde con lo que ha subido el multiplicador', () => {
    const f = saltosDeMejora(g(), g({ multAlcance: 1.2 }))
    expect(f).toHaveLength(1)
    expect(f[0]?.recurso).toBe('alcance')
    expect(f[0]?.texto).toBe('+20% alcance')
  })

  it('una compra que no cambia multiplicadores no pinta nada', () => {
    expect(saltosDeMejora(g(), g())).toEqual([])
  })
})
