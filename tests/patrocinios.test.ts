import { describe, expect, it } from 'vitest'
import { MODAS, PATROCINIOS } from '../src/content/patrocinios.ts'
import { CONTENT_POR_ID, FORMATO_INICIAL } from '../src/content/contentTypes.ts'
import {
  aceptar,
  avanzarContratos,
  caducarOfertas,
  candidatas,
  credibilidadPorSegundo,
  estallarModas,
  formatoTrasContratos,
  modaActiva,
  multiplicadorDeModa,
  pagoPorSegundo,
  rechazar,
  sortearOferta,
} from '../src/sim/patrocinios.ts'
import { factorAfinidad, factorApoyos, calcIngresosDirectos } from '../src/sim/formulas.ts'
import { evaluarEpilogo, teVendiste } from '../src/sim/final.ts'
import { createRng } from '../src/sim/rng.ts'
import { createInitialState, type GameState } from '../src/sim/state.ts'
import { step } from '../src/sim/tick.ts'
import { TUNABLES } from '../src/sim/tunables.ts'

/** Una partida con comunidad de sobra, para que las marcas escriban. */
const conComunidad = (over: Partial<GameState> = {}): GameState => ({
  ...createInitialState(1),
  comunidad: 50_000,
  ...over,
})

describe('el contenido esta bien formado', () => {
  it('los ids no se repiten', () => {
    const ids = PATROCINIOS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada categoria con moda tiene su ventana, y solo una', () => {
    const cats = MODAS.map((m) => m.categoria)
    expect(new Set(cats).size).toBe(cats.length)
  })

  it('las ventanas de moda estan bien ordenadas', () => {
    for (const m of MODAS) {
      expect(m.desdeSemana, m.categoria).toBeLessThan(m.picoSemana)
      expect(m.picoSemana, m.categoria).toBeLessThan(m.estallidoSemana)
      expect(m.multiplicadorPico, m.categoria).toBeGreaterThan(1)
    }
  })

  /**
   * Los picos no se solapan a proposito.
   *
   * Si dos modas estuviesen calientes a la vez, la decision dejaria de ser
   * "firmo o no" y pasaria a ser "cual de las dos", que es otra pregunta y
   * peor: la primera se responde con lo que crees, la segunda con una resta.
   */
  it('nunca hay dos modas calientes a la vez', () => {
    for (const a of MODAS) {
      for (const b of MODAS) {
        if (a === b) continue
        const solapan = a.picoSemana >= b.desdeSemana && a.picoSemana < b.estallidoSemana
        if (!solapan) continue
        // Si el pico de una cae dentro de la ventana de otra, la otra no puede
        // estar tambien en su pico: una sube mientras la otra baja.
        expect(Math.abs(a.picoSemana - b.picoSemana)).toBeGreaterThan(8)
      }
    }
  })

  it('cada formato que presta una editora existe en el catalogo', () => {
    for (const p of PATROCINIOS) {
      if (!p.formato) continue
      expect(CONTENT_POR_ID.has(p.formato), p.id).toBe(true)
      // Las claves las concede el sistema: nunca se pueden elegir a mano.
      expect(CONTENT_POR_ID.get(p.formato)?.requiere, p.id).toBe('@evento')
    }
  })

  /**
   * El equilibrio que pide el diseno: lo que paga no fideliza y lo que
   * fideliza no paga. Si una clave pagase bien Y convirtiese bien, seria la
   * respuesta correcta siempre y no habria nada que decidir.
   */
  it('ninguna clave paga bien y ademas fideliza', () => {
    for (const p of PATROCINIOS) {
      if (!p.formato) continue
      const f = CONTENT_POR_ID.get(p.formato)
      if (!f) continue
      if (p.pagoSemanal > 50) expect(f.afinidad, p.id).toBeLessThan(1)
      if (f.afinidad > 2) expect(p.pagoSemanal, p.id).toBeLessThanOrEqual(20)
    }
  })
})

describe('la credibilidad', () => {
  /**
   * Con la credibilidad intacta los factores valen EXACTAMENTE 1.
   *
   * No es un detalle: si valiesen mas, todo el balance calibrado en F6 se
   * habria movido de sitio el dia que se anadio este sistema. La credibilidad
   * es algo con lo que se empieza y que solo se puede gastar.
   */
  it('intacta no cambia nada', () => {
    expect(factorAfinidad(1)).toBe(1)
    expect(factorApoyos(1)).toBe(1)
  })

  it('nunca llega a cero: vender no te deja sin nadie', () => {
    expect(factorAfinidad(0)).toBeGreaterThan(0)
    expect(factorApoyos(0)).toBeGreaterThan(0)
    expect(factorAfinidad(0)).toBe(TUNABLES.patrocinios.credibilidad.sueloAfinidad)
  })

  it('es monotona: mas credibilidad nunca rinde menos', () => {
    for (let c = 0; c < 1; c += 0.1) {
      expect(factorAfinidad(c + 0.1)).toBeGreaterThan(factorAfinidad(c))
    }
  })

  /**
   * Toca los APOYOS y no la publicidad, y la asimetria es el sistema entero:
   * al anunciante no le importa lo que hayas firmado; a quien te da su dinero
   * todos los meses, si.
   */
  it('no toca la publicidad, solo los apoyos', () => {
    const soloAlcance = calcIngresosDirectos(10_000, 0, 1)
    expect(calcIngresosDirectos(10_000, 0, 0)).toBeCloseTo(soloAlcance, 10)
    expect(calcIngresosDirectos(0, 50_000, 0)).toBeLessThan(calcIngresosDirectos(0, 50_000, 1))
  })

  it('se recupera con franjas de comunidad y nunca pasa del techo', () => {
    let s = conComunidad({ credibilidad: 0.4, techoCredibilidad: 0.7 })
    s = { ...s, semana: { ...s.semana, fase: 'viviendo' } }
    for (let i = 0; i < 2000; i++) s = step(s, TUNABLES.tickMs)
    expect(s.credibilidad).toBeGreaterThan(0.4)
    expect(s.credibilidad).toBeLessThanOrEqual(0.7)
  })
})

describe('las ofertas', () => {
  it('a quien no ve nadie no le escribe ninguna marca', () => {
    const s = { ...createInitialState(1), comunidad: 0 }
    expect(candidatas(s)).toHaveLength(0)
  })

  it('es determinista: misma semilla, misma oferta', () => {
    const s = conComunidad()
    const a = sortearOferta(s, createRng(7))
    const b = sortearOferta(s, createRng(7))
    expect(a.oferta).toEqual(b.oferta)
  })

  it('no llegan mas de las que caben en la bandeja', () => {
    const llena = conComunidad({
      ofertas: Array.from({ length: TUNABLES.patrocinios.maxOfertas }, (_, i) => ({
        id: `x${i}`,
        caducaSemana: 99,
        multiplicador: 1,
      })),
    })
    expect(sortearOferta(llena, createRng(1)).oferta).toBeNull()
  })

  it('caducan solas', () => {
    const ofertas = [{ id: 'a', caducaSemana: 3, multiplicador: 1 }]
    expect(caducarOfertas(ofertas, 2)).toHaveLength(1)
    expect(caducarOfertas(ofertas, 3)).toHaveLength(0)
  })

  /**
   * Rechazar no cierra ninguna puerta. Si las ofertas son constantes, decir
   * que no tiene que ser barato o el sistema deja de ser una decision y pasa a
   * ser un peaje.
   */
  it('rechazar no cuesta nada y la marca puede volver', () => {
    const s = conComunidad({ ofertas: [{ id: 'cafe-torrefacto', caducaSemana: 5, multiplicador: 1 }] })
    const tras = rechazar(s, 'cafe-torrefacto')
    expect(tras.ofertas).toHaveLength(0)
    expect(tras.credibilidad).toBe(s.credibilidad)
    expect(tras.comunidad).toBe(s.comunidad)
    expect(candidatas(tras).some((p) => p.id === 'cafe-torrefacto')).toBe(true)
  })

  it('no se pueden llevar mas contratos de los que caben', () => {
    let s = conComunidad({
      contratos: Array.from({ length: TUNABLES.patrocinios.maxContratos }, (_, i) => ({
        id: `y${i}`,
        categoria: 'siempre' as const,
        semanasRestantes: 4,
        pagoSemanal: 10,
        costeCredibilidad: 0,
        costeFatiga: 0,
      })),
      ofertas: [{ id: 'cafe-torrefacto', caducaSemana: 5, multiplicador: 1 }],
    })
    s = aceptar(s, 'cafe-torrefacto')
    expect(s.contratos).toHaveLength(TUNABLES.patrocinios.maxContratos)
    expect(s.ofertas).toHaveLength(1)
  })
})

describe('los contratos', () => {
  const firmado = (): GameState =>
    aceptar(
      conComunidad({ ofertas: [{ id: 'vpn-tunel', caducaSemana: 5, multiplicador: 1 }] }),
      'vpn-tunel',
    )

  it('firmar cuenta para siempre, aunque el contrato termine', () => {
    const s = firmado()
    expect(s.aceptadosPorCategoria['vpn']).toBe(1)
    const acabado = { ...s, contratos: avanzarContratos(s.contratos.map((c) => ({ ...c, semanasRestantes: 1 }))) }
    expect(acabado.contratos).toHaveLength(0)
    expect(acabado.aceptadosPorCategoria['vpn']).toBe(1)
  })

  it('pagan y cuestan prorrateado por segundo', () => {
    const s = firmado()
    const c = s.contratos[0]
    expect(c).toBeDefined()
    expect(pagoPorSegundo(s.contratos)).toBeCloseTo(
      (c?.pagoSemanal ?? 0) / TUNABLES.secondsPerWeek,
      10,
    )
    expect(credibilidadPorSegundo(s.contratos)).toBeGreaterThan(0)
  })

  /**
   * Una clave de prensa se DEVUELVE. Sin esto, firmar por el superventas y
   * dejar el formato puesto lo regalaria para el resto de la partida, que es
   * justo el agujero por el que se colaria la estrategia dominante que este
   * sistema no quiere tener.
   */
  it('la clave de prensa se devuelve al acabar el acuerdo', () => {
    expect(formatoTrasContratos('clave-aaa', [])).toBe(FORMATO_INICIAL)
    expect(
      formatoTrasContratos('clave-aaa', [
        {
          id: 'clave-superventas',
          categoria: 'editora',
          semanasRestantes: 2,
          pagoSemanal: 90,
          costeCredibilidad: 0.06,
          costeFatiga: 0,
          formato: 'clave-aaa',
        },
      ]),
    ).toBe('clave-aaa')
    // Un formato propio no se toca nunca: no es de nadie mas.
    expect(formatoTrasContratos('charla', [])).toBe('charla')
  })
})

describe('las modas', () => {
  it('fuera de su ventana no escribe nadie', () => {
    const m = MODAS[0]
    expect(m).toBeDefined()
    if (!m) return
    expect(multiplicadorDeModa(m.categoria, m.desdeSemana - 1)).toBe(0)
    expect(multiplicadorDeModa(m.categoria, m.estallidoSemana)).toBe(0)
    expect(multiplicadorDeModa(m.categoria, m.picoSemana)).toBeCloseTo(m.multiplicadorPico, 6)
  })

  it('las categorias sin moda valen 1 toda la partida', () => {
    for (const semana of [0, 20, 60, 150]) {
      expect(multiplicadorDeModa('siempre', semana)).toBe(1)
      expect(multiplicadorDeModa('editora', semana)).toBe(1)
    }
  })

  it('sube en rampa hasta el pico y baja despues', () => {
    const m = MODAS[0]
    if (!m) return
    const medio = Math.floor((m.desdeSemana + m.picoSemana) / 2)
    expect(multiplicadorDeModa(m.categoria, medio)).toBeGreaterThan(1)
    expect(multiplicadorDeModa(m.categoria, medio)).toBeLessThan(m.multiplicadorPico)
    expect(multiplicadorDeModa(m.categoria, m.estallidoSemana - 1)).toBeLessThan(
      m.multiplicadorPico,
    )
  })

  it('siempre hay algo caliente entre la primera y la ultima ola', () => {
    const primera = Math.min(...MODAS.map((m) => m.desdeSemana))
    const ultima = Math.max(...MODAS.map((m) => m.estallidoSemana))
    for (let w = primera; w < ultima; w++) {
      expect(modaActiva(w), `semana ${w}`).not.toBeNull()
    }
  })

  /**
   * El premio de haber dicho que no.
   *
   * Si la moda estallase igual para todos, rechazar no seria una decision:
   * seria dinero tirado. Que al que no firmo no le pase nada es lo unico que
   * convierte el "no, gracias" en una jugada.
   */
  it('a quien no firmo no le pasa nada', () => {
    const m = MODAS[0]
    if (!m) return
    const s = conComunidad()
    const tras = estallarModas(s, m.estallidoSemana)
    expect(tras.credibilidad).toBe(s.credibilidad)
    expect(tras.comunidad).toBe(s.comunidad)
    expect(tras.techoCredibilidad).toBe(s.techoCredibilidad)
    expect(tras.resacaPendiente).toBeNull()
    // Se anota como vivida igualmente, para no volver a mirarla.
    expect(tras.resacas).toContain(m.categoria)
  })

  it('a quien firmo le cuesta, y mas cuanto mas firmo', () => {
    const m = MODAS[0]
    if (!m) return
    const uno = estallarModas(
      conComunidad({ aceptadosPorCategoria: { [m.categoria]: 1 } }),
      m.estallidoSemana,
    )
    const tres = estallarModas(
      conComunidad({ aceptadosPorCategoria: { [m.categoria]: 3 } }),
      m.estallidoSemana,
    )
    expect(uno.credibilidad).toBeLessThan(1)
    expect(tres.credibilidad).toBeLessThan(uno.credibilidad)
    expect(tres.comunidad).toBeLessThan(uno.comunidad)
    expect(uno.resacaPendiente).toBe(m.categoria)
  })

  it('el techo baja para siempre, pero nunca por debajo del suelo', () => {
    const m = MODAS[0]
    if (!m) return
    const s = estallarModas(
      conComunidad({ aceptadosPorCategoria: { [m.categoria]: 99 } }),
      m.estallidoSemana,
    )
    expect(s.techoCredibilidad).toBeGreaterThanOrEqual(
      TUNABLES.patrocinios.credibilidad.techoMinimo,
    )
    expect(s.techoCredibilidad).toBeLessThan(1)
  })

  it('una moda no se cobra dos veces', () => {
    const m = MODAS[0]
    if (!m) return
    const s = conComunidad({ aceptadosPorCategoria: { [m.categoria]: 2 } })
    const una = estallarModas(s, m.estallidoSemana)
    const otra = estallarModas(una, m.estallidoSemana + 5)
    expect(otra.credibilidad).toBe(una.credibilidad)
    expect(otra.techoCredibilidad).toBe(una.techoCredibilidad)
  })

  it('el titular detiene la simulacion, como la entrada de un ciclo', () => {
    const s = conComunidad({ resacaPendiente: 'cripto' })
    expect(step({ ...s, semana: { ...s.semana, fase: 'viviendo' } }, 100).elapsedMs).toBe(
      s.elapsedMs,
    )
  })
})

describe('el final', () => {
  /** Cumple las ocho condiciones del retiro, para poder mirar el epilogo. */
  const retirable = (over: Partial<GameState> = {}): GameState =>
    conComunidad({
      comunidad: 200_000,
      calidad: 4,
      fatiga: 0,
      houseStage: 4,
      eventosExtraordinarios: 1,
      vacacionesCompletadas: 1,
      semanasEnUmbral: TUNABLES.final.semanasSostenidas,
      allocation: { produccion: 0.1, comunidad: 0.3, vida: 0.3, descanso: 0.3 },
      catalogo: [{ week: 0, weight: 400_000 }],
      ahorros: 100_000,
      ...over,
    })

  it('llegar con la cara limpia da buen final', () => {
    expect(teVendiste(retirable())).toBe(false)
    expect(evaluarEpilogo(retirable())).not.toBe('vendido')
  })

  it('seguir firmando al final te lleva al epilogo vendido', () => {
    expect(evaluarEpilogo(retirable({ credibilidad: 0.3 }))).toBe('vendido')
  })

  /**
   * Recuperarse a tiempo no borra la hemeroteca: los videos siguen ahi. Sin
   * esta via, quien se vendio a lo bestia y despues paso un ano limpiandose
   * saldria impecable, y no es verdad.
   */
  it('haber estado en las listas cuenta aunque te hayas recuperado', () => {
    const limpio = retirable({ credibilidad: 1, techoCredibilidad: 0.7 })
    expect(evaluarEpilogo(limpio)).toBe('vendido')
  })

  /**
   * El orden importa: venderse tapa incluso un retiro holgado. El final bueno
   * de este juego no es el dinero, es la gente.
   */
  it('venderse tapa incluso una cobertura de sobra', () => {
    const holgado = retirable({ credibilidad: 0.2, catalogo: [{ week: 0, weight: 5_000_000 }] })
    expect(evaluarEpilogo(holgado)).toBe('vendido')
  })

  it('sin cumplir las condiciones sigue siendo la rueda, no el vendido', () => {
    expect(evaluarEpilogo(conComunidad({ credibilidad: 0 }))).toBe('rueda')
  })
})
