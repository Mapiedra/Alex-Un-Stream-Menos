import { TUNABLES } from '../../sim/tunables.ts'
import { CYCLES } from '../../content/cycles.ts'
import { fmt } from '../../format.ts'

/**
 * Como se juega.
 *
 * El protocolo de playtest pide presentar el juego con una frase y dejar que
 * el jugador averigue el objetivo. Eso no significa esconder las reglas: una
 * cosa es no spoilear la tesis y otra que nadie sepa que significan doce
 * cifras en pantalla. Aqui estan las reglas, y solo las reglas.
 *
 * Las cifras se leen de TUNABLES y de content/cycles.ts en lugar de escribirse
 * a mano: si el balance cambia, esta pantalla no se queda mintiendo.
 */
export function Ayuda() {
  const f = TUNABLES.final

  return (
    <section className="ayuda">
      <h2 className="ayuda__titulo">Cómo se juega</h2>

      <div className="ayuda__bloque">
        <h3 className="ayuda__seccion">La idea</h3>
        <p>
          Llevas un canal. Todo lo que haces sale de un único recurso que no se puede comprar:
          tus horas. Cada hora que va a producir no va a descansar, y cada hora que va a la
          comunidad no va a crecer.
        </p>
      </div>

      <div className="ayuda__bloque">
        <h3 className="ayuda__seccion">El bucle</h3>
        <ol className="ayuda__lista">
          <li>
            <strong>Repartes la semana.</strong> Son 21 franjas —siete días por mañana, tarde y
            noche— y cada una se gasta en una cosa: emitir, editar, comunidad, leer, vida o dormir.
            Cuando se acaban, se acabó el periodo. En los dos primeros ciclos la reparten las
            mejoras que compras; a partir del tercero la colocas tú.
          </li>
          <li>
            <strong>Vives la semana.</strong> El reloj solo corre entonces. Al terminar, la partida
            se para y vuelves a repartir: decidir es una pausa, no algo que se hace con el reloj
            encima.
          </li>
          <li>
            <strong>Emitir trae gente; editar deja vídeos.</strong> Solo entran visitas con el
            directo puesto, y solo salen vídeos de las franjas de editar. Una semana entera en
            directo se queda sin nada que subir. Puedes cortar o empezar el directo a mano en
            cualquier franja.
          </li>
          <li>
            <strong>Publicas, y eliges cómo.</strong> Publicar gasta material. Sacarlo ya da más
            pico y más hype; cuidarlo deja mucho más peso en el catálogo, que es de lo que se vive
            dentro de tres años.
          </li>
          <li>
            <strong>Eliges formato.</strong> No cambia cuánto trabajas: cambia en qué se convierte
            tu trabajo. Un juego popular trae mucha gente que se va; una charla trae poca que se
            queda.
          </li>
          <li>
            <strong>Inviertes, y nada sale gratis.</strong> Cada categoría de la tienda cobra en su
            moneda: el equipo y la casa cuestan dinero, el flujo de trabajo cuesta material,
            las rutinas cuestan vida y los formatos cuestan ideas. Todo devuelve más de lo que
            cuesta, pero primero hay que poder pagarlo. Ojo: mejorar de casa sube tu coste de vida
            para siempre y aleja el retiro.
          </li>
        </ol>
      </div>

      <div className="ayuda__bloque">
        <h3 className="ayuda__seccion">Las pantallas</h3>
        <ul className="ayuda__lista">
          <li>
            <strong>Semana</strong> — repartes las franjas y lanzas la semana.
          </li>
          <li>
            <strong>Canal</strong> — las curvas, las cifras y qué formato estás haciendo.
          </li>
          <li>
            <strong>Tienda</strong> — equipo, flujo, rutina, casa y formatos.
          </li>
          <li>
            <strong>Vida</strong> — parar, los momentos grandes y lo que estás leyendo.
          </li>
          <li>
            <strong>Carrera</strong> — en qué ciclo vas y qué te falta para poder dejarlo.
          </li>
        </ul>
        <p>
          Un punto en una pestaña significa que allí hay algo esperándote. Al acabarse la semana el
          juego te lleva solo a repartir la siguiente.
        </p>
      </div>

      <div className="ayuda__bloque">
        <h3 className="ayuda__seccion">Qué significa cada cifra</h3>
        <dl className="ayuda__glosario">
          <Termino nombre="Alcance" token="alcance">
            Gente que te descubre ahora mismo. Sube rápido y cae con facilidad.
          </Termino>
          <Termino nombre="Comunidad" token="comunidad">
            Gente que sigue por ti. Crece lento, frena la caída del alcance y te protege cuando
            paras. Es lo que de verdad se construye.
          </Termino>
          <Termino nombre="Calidad" token="calidad">
            Multiplica el rendimiento de cada hora. Sube con la vida y con las mejoras, y se hunde
            con la fatiga.
          </Termino>
          <Termino nombre="Vida" token="vida">
            Tu equilibrio personal. Alimenta la calidad, genera ideas y es lo que cuesta cambiar de
            rutina — por eso no puedes reorganizarte estando hecho polvo.
          </Termino>
          <Termino nombre="Fatiga" token="fatiga">
            El coste de forzar. Hasta el {pct(TUNABLES.fatiga.saturationThreshold)} no se nota;
            a partir de ahí la calidad cae en picado, y en el{' '}
            {pct(TUNABLES.fatiga.burnoutThreshold)} paras en seco.
          </Termino>
          <Termino nombre="Hype" token="hype">
            Multiplicador temporal que dan las publicaciones. Decae en segundos: acelera, no
            sustituye.
          </Termino>
          <Termino nombre="Ideas" token="ideas">
            Materia prima de los formatos nuevos. Las genera la vida personal, y de golpe cada vez
            que terminas un libro.
          </Termino>
          <Termino nombre="Material" token="ingresos">
            Vídeos montados y listos para subir. Salen sobre todo de las franjas de editar.
            Publicar los gasta: sin material no hay vídeo.
          </Termino>
          <Termino nombre="Catálogo" token="ingresos">
            Todo lo que has publicado sigue dando dinero, tanto más cuanta más calidad tenía. Es el
            motor del final.
          </Termino>
        </dl>
      </div>

      <div className="ayuda__bloque">
        <h3 className="ayuda__seccion">Cómo acaba</h3>
        <p>
          El objetivo no es facturar más: es que lo ya publicado y lo ahorrado te cubran{' '}
          <em>sin trabajar</em>, y poder sostenerlo con pocas horas. Hacen falta, entre otras
          cosas, {fmt(f.comunidadMinima)} de comunidad, calidad {f.calidadMinima}, la fatiga por
          debajo del {pct(f.fatigaMaxima)}, unas vacaciones completas, y dedicar como mucho el{' '}
          {pct(f.horasMaximas)} de tu tiempo a producir — sostenido {f.semanasSostenidas} semanas
          seguidas.
        </p>
        <p>
          Puedes retirarte antes de cumplirlo. No es perder: es otro final, y se cuenta con el
          mismo respeto.
        </p>
      </div>

      <div className="ayuda__bloque">
        <h3 className="ayuda__seccion">Lo que no puede pasar</h3>
        <ul className="ayuda__lista">
          <li>
            <strong>No se puede perder.</strong> El burnout cuesta semanas y comunidad, pero nunca
            termina la partida.
          </li>
          <li>
            <strong>No hay reflejos obligatorios.</strong> El juego se puede terminar sin acertar
            un solo momento clippeable.
          </li>
          <li>
            <strong>No te puedes atascar.</strong> Los ciclos no son pruebas que se fallen: se
            cierran solos al llegar. Solo puedes tardar más.
          </li>
          <li>
            <strong>No hay progreso mientras no juegas.</strong> Es una partida acotada, no un
            idle de meses. Y mientras repartes la semana el reloj está parado.
          </li>
        </ul>
      </div>

      <div className="ayuda__bloque">
        <h3 className="ayuda__seccion">Los cinco ciclos</h3>
        <ol className="ayuda__ciclos">
          {CYCLES.map((c) => (
            <li key={c.numero}>
              <span className="ayuda__ciclo-nombre">{c.nombre}</span>
              <span className="ayuda__ciclo-objetivo">{c.objetivo}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`
}

interface TerminoProps {
  nombre: string
  token: string
  children: React.ReactNode
}

function Termino({ nombre, token, children }: TerminoProps) {
  return (
    <div className="ayuda__termino">
      <dt style={{ color: `var(--c-${token})` }}>{nombre}</dt>
      <dd>{children}</dd>
    </div>
  )
}
