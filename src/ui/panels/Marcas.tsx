import { NOMBRE_CATEGORIA_MARCA } from '../../content/patrocinios.ts'
import { definicion, modaActiva, multiplicadorDeModa } from '../../sim/patrocinios.ts'
import { TUNABLES } from '../../sim/tunables.ts'
import { useGame } from '../../store.ts'
import { eur, pct } from '../../format.ts'

/**
 * La bandeja de las marcas.
 *
 * Es la unica pantalla del juego que existe para decir que NO. Las ofertas
 * llegan constantemente y casi ninguna merece la pena; el trabajo del jugador
 * aqui es mirar lo que pagan, mirar lo que cuesta, y cerrar la pestana.
 *
 * Por eso no hay modal: una decision constante que congelase la partida cada
 * vez seria insoportable a los diez minutos. Lo que hay es un punto rojo y una
 * caducidad, para que ignorar tambien sea una respuesta valida.
 */
export function Marcas() {
  const ofertas = useGame((s) => s.game.ofertas)
  const contratos = useGame((s) => s.game.contratos)
  const credibilidad = useGame((s) => s.game.credibilidad)
  const techo = useGame((s) => s.game.techoCredibilidad)
  const semana = useGame((s) => s.game.week)
  const ingresosPatrocinio = useGame((s) => s.game.ingresosPatrocinio)
  const aceptar = useGame((s) => s.aceptarOferta)
  const rechazar = useGame((s) => s.rechazarOferta)

  const lleno = contratos.length >= TUNABLES.patrocinios.maxContratos

  return (
    <section className="marcas">
      <header className="marcas__cabecera">
        <div>
          <span className="carrera__kicker">Marcas</span>
          <h2 className="carrera__titulo">Quién quiere pagarte</h2>
        </div>
        <p className="marcas__credibilidad data" title="La credibilidad multiplica la afinidad y los apoyos, nunca el alcance ni la publicidad. El techo baja con cada moda que estalla habiéndola firmado.">
          Credibilidad {pct(credibilidad)}
          {techo < 1 && <span className="marcas__techo"> · techo {pct(techo)}</span>}
          {ingresosPatrocinio > 0 && (
            <span className="marcas__pago">
              {' '}
              · {eur(ingresosPatrocinio * TUNABLES.secondsPerWeek)}/sem de marcas
            </span>
          )}
        </p>
      </header>

      <ModaEnCurso semana={semana} />

      {contratos.length > 0 && (
        <>
          <h3 className="marcas__seccion">Contratos en curso</h3>
          <ul className="marcas__lista">
            {contratos.map((c) => {
              const def = definicion(c.id)
              if (!def) return null
              return (
                <li className="marcas__contrato" key={c.id}>
                  <div className="marcas__fila">
                    <span className="marcas__marca">{def.marca}</span>
                    <span className="marcas__meta data">
                      {c.semanasRestantes} sem · {eur(c.pagoSemanal)}/sem
                    </span>
                  </div>
                  <p className="marcas__nota">{NOMBRE_CATEGORIA_MARCA[c.categoria]}</p>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <h3 className="marcas__seccion">
        Ofertas {ofertas.length > 0 && <span className="data">({ofertas.length})</span>}
      </h3>

      {ofertas.length === 0 ? (
        <p className="carrera__objetivo">
          Nadie te ha escrito esta semana. Volverán: siempre vuelven.
        </p>
      ) : (
        <ul className="marcas__lista">
          {ofertas.map((o) => {
            const def = definicion(o.id)
            if (!def) return null
            const paga = def.pagoSemanal * o.multiplicador
            const caduca = Math.max(0, o.caducaSemana - semana)
            return (
              <li className="marcas__oferta" key={o.id} data-caduca={caduca <= 1}>
                <div className="marcas__fila">
                  <span className="marcas__marca">{def.marca}</span>
                  <span className="marcas__meta data">
                    {eur(paga)}/sem · {def.semanas} sem
                    {o.multiplicador > 1 && (
                      <span className="marcas__moda"> · ×{o.multiplicador.toFixed(1)}</span>
                    )}
                  </span>
                </div>

                <h4 className="marcas__titulo">{def.titulo}</h4>
                <p className="marcas__texto">{def.texto}</p>

                <p className="marcas__coste data">
                  Total {eur(paga * def.semanas)} ·{' '}
                  {def.costeCredibilidad > 0
                    ? `cuesta ${puntos(def.costeCredibilidad * def.semanas)} de credibilidad`
                    : def.costeCredibilidad < 0
                      ? `devuelve ${puntos(-def.costeCredibilidad * def.semanas)} de credibilidad`
                      : 'no toca la credibilidad'}
                  {caduca <= 1 ? ' · caduca esta semana' : ` · caduca en ${caduca} sem`}
                </p>

                <div className="marcas__acciones">
                  <button
                    className="momentos__boton"
                    onClick={() => aceptar(o.id)}
                    disabled={lleno}
                    title={
                      lleno
                        ? 'Ya llevas todos los contratos que puedes atender a la vez'
                        : 'Firmar es cobrar hoy y pagarlo en quien se queda'
                    }
                  >
                    Firmar
                  </button>
                  <button className="marcas__no" onClick={() => rechazar(o.id)}>
                    No, gracias
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="marcas__pie">
        Ninguna de estas ofertas hace falta para llegar lejos. Pagan hoy; lo que cuestan se cobra
        despacio, en cuánta de la gente que llega se queda.
      </p>
    </section>
  )
}

/**
 * La moda de la epoca.
 *
 * El jugador tiene que poder ver que algo esta caliente y cuanto le queda,
 * porque la decision real no es "firmo o no" sino "firmo AHORA o espero". Sin
 * esto, el multiplicador seria una sorpresa en la cifra de una oferta y no una
 * ola que se ve venir.
 */
function ModaEnCurso({ semana }: { semana: number }) {
  const moda = modaActiva(semana)
  if (!moda) return null

  const mult = multiplicadorDeModa(moda.categoria, semana)
  const subiendo = semana <= moda.picoSemana
  const restantes = moda.estallidoSemana - semana

  return (
    <div className="marcas__moda-banner" data-pico={!subiendo}>
      <div className="marcas__fila">
        <span className="marcas__marca">{moda.nombre}</span>
        <span className="marcas__meta data">×{mult.toFixed(1)}</span>
      </div>
      <p className="marcas__nota">
        {subiendo
          ? 'Están pagando cada vez más, y todo el mundo está firmando. Faltan '
          : 'Ya ha pasado el pico. Pagan menos cada semana y quedan '}
        {restantes} semanas para que esto se acabe de una forma u otra.
      </p>
    </div>
  )
}

/**
 * Credibilidad en PUNTOS, no en porcentaje.
 *
 * La cifra de arriba ya se ensena como porcentaje, asi que decir que algo
 * "cuesta un 18%" se lee como "el 18% de la que tienes" y no como "baja del
 * 90 al 72", que es lo que pasa de verdad.
 */
function puntos(v: number): string {
  return `${(v * 100).toFixed(v * 100 < 10 ? 1 : 0)} puntos`
}
