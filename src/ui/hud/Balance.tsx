import { RepartoSemanal } from './RepartoSemanal.tsx'
import { BLOQUE_IDS, type BloqueId } from '../../sim/semana.ts'
import { useGame } from '../../store.ts'
import { eur, fmt, pct } from '../../format.ts'
import type { TokenKey } from '../theme/palette.ts'

/**
 * EL BALANCE DE LA SEMANA.
 *
 * El planificador pedia decisiones y no devolvia nada: colocabas veintiuna
 * franjas, pasaba minuto y medio, y volvias a colocar veintiuna franjas sin
 * que nadie te dijera que habia dado de si la vez anterior. Un bucle asi no
 * ensena a jugar, solo se repite.
 *
 * Esto lo cierra. Cuanto se movio cada cifra, en que se fueron las franjas, y
 * una frase que dice lo que eso significa — que es lo unico que convierte una
 * estadistica en informacion. Sale justo encima del reparto siguiente, que es
 * el momento exacto en que sirve para algo.
 */
export function Balance() {
  const balance = useGame((s) => s.balanceSemana)
  const bloques = useGame((s) => s.game.semana.bloques)

  if (!balance) return null

  return (
    <section className="balance">
      <div className="balance__cabecera">
        <span className="carrera__kicker">Semana {balance.semana}, cerrada</span>
        <h2 className="carrera__titulo">{balance.titular}</h2>
      </div>

      <div className="balance__cuerpo">
        <ul className="balance__cifras">
          <Cifra etiqueta="Alcance" token="alcance" valor={delta(balance.alcance, fmt)} signo={balance.alcance} />
          <Cifra
            etiqueta="Comunidad"
            token="comunidad"
            valor={delta(balance.comunidad, fmt)}
            signo={balance.comunidad}
          />
          <Cifra
            etiqueta="Calidad"
            token="calidad"
            valor={delta(balance.calidad, (v) => v.toFixed(2))}
            signo={balance.calidad}
          />
          <Cifra
            etiqueta="Vida"
            token="vida"
            valor={delta(balance.vida, (v) => pct(v))}
            signo={balance.vida}
          />
          <Cifra
            etiqueta="Fatiga"
            token="fatiga"
            valor={delta(balance.fatiga, (v) => pct(v))}
            // La fatiga es la unica cifra en la que subir es malo: el color
            // sigue al significado, no al signo.
            signo={-balance.fatiga}
          />
          <Cifra
            etiqueta="Ahorros"
            token="ingresos"
            valor={delta(balance.ahorros, (v) => eur(v))}
            signo={balance.ahorros}
          />
          <Cifra
            etiqueta="Publicado"
            token="calidad"
            valor={`${balance.publicaciones}`}
            signo={balance.publicaciones}
          />
          {Math.abs(balance.credibilidad) >= 0.005 && (
            <Cifra
              etiqueta="Credibilidad"
              token="credibilidad"
              valor={delta(balance.credibilidad, (v) => pct(v))}
              signo={balance.credibilidad}
            />
          )}
        </ul>

        {/* El reparto que se VIVIO, no el que viene: el balance existe para
            poder atar lo que decidiste con lo que ha pasado. */}
        <RepartoSemanal bloques={repartoVivido(balance.reparto, bloques)} titulo="Se te fue en" compacto />
      </div>
    </section>
  )
}

interface CifraProps {
  etiqueta: string
  valor: string
  token: TokenKey
  /** Solo su signo importa: decide el color. */
  signo: number
}

function Cifra({ etiqueta, valor, token, signo }: CifraProps) {
  // Lo que no llega a imprimirse tampoco se colorea: pintar de rojo una raya
  // seria decir que ha pasado algo malo justo donde no ha pasado nada.
  const clase = valor === '—' ? 'plano' : signo > 0 ? 'sube' : signo < 0 ? 'baja' : 'plano'

  return (
    <li className="balance__cifra" data-signo={clase}>
      <span className="balance__etiqueta" style={{ color: `var(--c-${token})` }}>
        {etiqueta}
      </span>
      <span className="balance__valor data">{valor}</span>
    </li>
  )
}

/**
 * La variacion, o una raya cuando no la hay.
 *
 * El corte lo pone el FORMATO y no un epsilon: cada cifra se redondea a lo
 * suyo —la calidad a dos decimales, la vida a enteros de porcentaje— y un
 * umbral unico dejaba pasar cambios que luego se imprimian como "−0.00" y
 * "+0 %", que es la peor de las respuestas posibles: parece que ha pasado
 * algo y ademas parece que ha pasado al reves. Si al redondear no queda ni
 * una cifra significativa, es que la semana no movio eso.
 */
function delta(v: number, formato: (n: number) => string): string {
  const texto = formato(Math.abs(v))
  if (!/[1-9]/.test(texto)) return '—'
  return `${v > 0 ? '+' : '−'}${texto}`
}

/**
 * Reconstruye la lista de bloques a partir de la cuenta guardada.
 *
 * `RepartoSemanal` pinta desde una semana de verdad porque es lo que recibe
 * en el planificador; aqui solo hay el recuento de la semana cerrada, asi que
 * se le da una equivalente. El orden da igual: la barra mide cuantos hay.
 */
function repartoVivido(
  cuenta: Record<BloqueId, number>,
  respaldo: readonly BloqueId[],
): BloqueId[] {
  const total = BLOQUE_IDS.reduce((acc, b) => acc + (cuenta[b] ?? 0), 0)
  if (total === 0) return [...respaldo]
  return BLOQUE_IDS.flatMap((b) => Array.from({ length: cuenta[b] ?? 0 }, () => b))
}
