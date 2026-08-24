import { useGame } from '../../store.ts'

/**
 * EL REGISTRO — que ha ido pasando.
 *
 * Un incremental que solo ensena numeros subiendo se siente vacio aunque este
 * lleno de sistemas: pasan cosas —se termina un libro, estalla una moda, el
 * gato se sube a la mesa— y el jugador solo se entera si estaba mirando la
 * cifra correcta en el segundo correcto.
 *
 * Ocupa poco a proposito. No es una pantalla, es la prueba de que el mundo se
 * mueve tambien cuando no lo miras.
 */
export function Registro() {
  const registro = useGame((s) => s.registro)

  return (
    <section className="registro">
      <span className="carrera__kicker">Actividad</span>

      {registro.length === 0 ? (
        <p className="registro__vacio">
          Todavía no ha pasado nada digno de contarse. Lanza la semana.
        </p>
      ) : (
        <ul className="registro__lista">
          {registro.slice(0, 10).map((e) => (
            <li key={e.id} className="registro__entrada">
              <span className="registro__semana data">S{e.semana}</span>
              <span className="registro__glifo" style={{ color: `var(--c-${e.token})` }}>
                {e.glifo}
              </span>
              <span className="registro__texto">{e.texto}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
