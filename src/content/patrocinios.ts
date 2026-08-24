/**
 * Las marcas que te escriben.
 *
 * La tercera via economica del juego, y la unica que cobra HOY. El catalogo
 * paga dentro de tres anos y la publicidad paga por gente que ya tienes; un
 * patrocinio paga esta semana, por adelantado, y a cambio gasta lo unico que
 * no se compra con dinero.
 *
 * REGLA DE DISENO: las ofertas son CONSTANTES. Un patrocinio que saliera una
 * vez cada veinte semanas seria un evento extraordinario, y de esos ya hay.
 * Lo que se quiere modelar es convivir con el goteo — abrir la bandeja, mirar
 * lo que pagan, y decir que no otra vez.
 *
 * REGLA LEGAL: todas las marcas son inventadas. Este es un proyecto de fan y
 * no nombra a ninguna empresa real, igual que no lo hace ningun otro fichero
 * de contenido del juego.
 */

export type CategoriaMarca =
  // Sin moda: disponibles toda la partida, pagan poco, cuestan poco. Son las
  // que garantizan que la bandeja nunca se seque.
  | 'siempre'
  | 'energetica'
  | 'vpn'
  | 'editora'
  // Con moda: solo aparecen dentro de su ventana, pagan una barbaridad en el
  // pico y dejan resaca cuando estalla.
  | 'cripto'
  | 'cajas'
  | 'apuestas'

export const NOMBRE_CATEGORIA_MARCA: Record<CategoriaMarca, string> = {
  siempre: 'Marcas de siempre',
  energetica: 'Bebidas energéticas',
  vpn: 'Servicios y suscripciones',
  editora: 'Editoras y estudios',
  cripto: 'Cripto y coleccionables',
  cajas: 'Cajas de botín',
  apuestas: 'Casas de apuestas',
}

export interface OfertaPatrocinio {
  id: string
  marca: string
  categoria: CategoriaMarca
  titulo: string
  texto: string
  /** Lo que paga por semana, ANTES del multiplicador de moda. */
  pagoSemanal: number
  semanas: number
  /**
   * Credibilidad que consume por semana de contrato.
   *
   * Negativo en las que SUMAN: promocionar el indie de tres personas que nadie
   * conoce no te cuesta credibilidad, te la devuelve.
   */
  costeCredibilidad: number
  /** Fatiga extra por semana. Cumplir con una marca es trabajo. */
  costeFatiga?: number
  desdeSemana?: number
  /** Comunidad minima: a quien no ve nadie no le escribe ninguna marca. */
  desdeComunidad?: number
  peso?: number
  /** Solo en las claves de prensa: formato que concede mientras dura. */
  formato?: string
}

/**
 * El catalogo de ofertas.
 *
 * Los pagos estan escalados contra el coste de vida y contra lo que rinde el
 * canal en cada momento: una oferta de arranque cubre varias semanas de vida
 * de golpe —por eso tienta— y una del tramo final no llega a doblar lo que ya
 * entra sola. Vender pronto compra tiempo; vender tarde apenas compra nada, y
 * cuesta lo mismo.
 */
export const PATROCINIOS: OfertaPatrocinio[] = [
  // ===== SIEMPRE — las que no le importan a nadie =========================
  {
    id: 'cafe-torrefacto',
    marca: 'Café Molinero',
    categoria: 'siempre',
    titulo: 'Un café que ya te tomas',
    texto:
      'Una tostadora de aquí quiere que la bolsa se vea en plano. Ni guion ni frase obligatoria: que se vea, y ya está.',
    pagoSemanal: 12,
    semanas: 4,
    costeCredibilidad: 0.012,
    desdeComunidad: 400,
    peso: 1.4,
  },
  {
    id: 'sillas-ergo',
    marca: 'Postura',
    categoria: 'siempre',
    titulo: 'Una silla para las doce horas',
    texto:
      'Te mandan la silla y piden que digas que es cómoda. Con suerte hasta lo es, y llevas dos años sentado en una de oficina de segunda mano.',
    pagoSemanal: 20,
    semanas: 5,
    costeCredibilidad: 0.015,
    desdeComunidad: 1200,
    peso: 1.2,
  },
  {
    id: 'colchon-nube',
    marca: 'Colchones Nimbo',
    categoria: 'siempre',
    titulo: 'Descanso, dicen',
    texto:
      'Un colchón por hablar treinta segundos de lo importante que es dormir bien. La ironía no se les ha ocurrido a ellos.',
    pagoSemanal: 28,
    semanas: 3,
    costeCredibilidad: 0.018,
    desdeComunidad: 3000,
    peso: 1.1,
  },
  {
    id: 'panaderia-barrio',
    marca: 'Horno de la Plaza',
    categoria: 'siempre',
    titulo: 'La panadería de abajo',
    texto:
      'No pagan casi nada y lo saben. Te escriben porque su hijo ve el canal y les dijo que lo intentaran.',
    pagoSemanal: 6,
    semanas: 6,
    costeCredibilidad: -0.004,
    desdeComunidad: 400,
    peso: 0.9,
  },

  // ===== ENERGETICAS — el patrocinio clasico =============================
  {
    id: 'energetica-turbo',
    marca: 'VOLTA',
    categoria: 'energetica',
    titulo: 'La lata en el escritorio',
    texto:
      'Lata visible, código de descuento y la frase que te pasan escrita. Es el patrocinio más antiguo que existe y todo el mundo sabe cómo funciona.',
    pagoSemanal: 38,
    semanas: 5,
    costeCredibilidad: 0.032,
    costeFatiga: 0.01,
    desdeComunidad: 2500,
    peso: 1.3,
  },
  {
    id: 'energetica-sabor',
    marca: 'VOLTA Sandía',
    categoria: 'energetica',
    titulo: 'Sacan sabor nuevo',
    texto:
      'Hay que probarlo en directo y poner cara. La cara la eliges tú; lo que no puedes es decir que sabe raro.',
    pagoSemanal: 52,
    semanas: 3,
    costeCredibilidad: 0.042,
    costeFatiga: 0.01,
    desdeComunidad: 8000,
    peso: 1.1,
  },
  {
    id: 'preworkout',
    marca: 'Kinetika',
    categoria: 'energetica',
    titulo: 'Suplementos y esas cosas',
    texto:
      'Polvos para rendir más. No te preguntan si los tomas, te preguntan si los nombras.',
    pagoSemanal: 65,
    semanas: 4,
    costeCredibilidad: 0.055,
    desdeComunidad: 15000,
    peso: 0.9,
  },

  // ===== VPN Y SUSCRIPCIONES — el que todo el mundo se salta ==============
  {
    id: 'vpn-tunel',
    marca: 'Túnel Privado',
    categoria: 'vpn',
    titulo: 'Segundo cuarenta y cinco',
    texto:
      'Noventa segundos leyendo un guion sobre seguridad que no has escrito tú. Todo el mundo se lo salta y ellos lo saben; pagan por el número, no por que lo escuchen.',
    pagoSemanal: 48,
    semanas: 6,
    costeCredibilidad: 0.048,
    desdeComunidad: 6000,
    peso: 1.3,
  },
  {
    id: 'curso-idiomas',
    marca: 'Fluent7',
    categoria: 'vpn',
    titulo: 'Aprende idiomas mientras juegas',
    texto:
      'Una app de idiomas quiere que digas que la usas. No la usas.',
    pagoSemanal: 42,
    semanas: 4,
    costeCredibilidad: 0.052,
    desdeComunidad: 6000,
    peso: 1.1,
  },
  {
    id: 'gestor-claves',
    marca: 'Llavero',
    categoria: 'vpn',
    titulo: 'Un gestor de contraseñas',
    texto:
      'De los pocos productos de esta lista que de verdad le vendría bien a tu chat. Sigue siendo un anuncio leído.',
    pagoSemanal: 34,
    semanas: 5,
    costeCredibilidad: 0.028,
    desdeComunidad: 4000,
    peso: 1,
  },

  // ===== EDITORAS — las claves de prensa =================================
  // Un juego regalado a cambio de jugarlo delante de la camara. La decision
  // no es el dinero: es QUE juego. El famoso paga y trae gente que se va; el
  // indie de tres personas no paga nada y trae a la que se queda.
  {
    id: 'clave-superventas',
    marca: 'Nordwall Studios',
    categoria: 'editora',
    titulo: 'El lanzamiento del año',
    texto:
      'Clave anticipada del juego del que va a hablar todo el mundo, con embargo hasta el jueves. Piden dos semanas de directos y que no se comente lo de los micropagos.',
    pagoSemanal: 90,
    semanas: 3,
    costeCredibilidad: 0.06,
    costeFatiga: 0.012,
    desdeComunidad: 8000,
    formato: 'clave-aaa',
    peso: 1.2,
  },
  {
    id: 'clave-secuela',
    marca: 'Nordwall Studios',
    categoria: 'editora',
    titulo: 'La séptima parte de la saga',
    texto:
      'Es el mismo juego del año pasado con un número distinto y lo saben. Pagan bien precisamente por eso.',
    pagoSemanal: 72,
    semanas: 4,
    costeCredibilidad: 0.05,
    desdeComunidad: 6000,
    formato: 'clave-aaa',
    peso: 1.1,
  },
  {
    id: 'clave-media',
    marca: 'Cabo Norte',
    categoria: 'editora',
    titulo: 'Un juego mediano y honesto',
    texto:
      'Ni superproducción ni experimento: un juego bien hecho de un estudio de cuarenta personas que necesita que alguien lo enseñe.',
    pagoSemanal: 30,
    semanas: 4,
    costeCredibilidad: 0.008,
    desdeComunidad: 2000,
    formato: 'clave-media',
    peso: 1.3,
  },
  {
    id: 'clave-simulador',
    marca: 'Meridiano Software',
    categoria: 'editora',
    titulo: 'Un simulador de algo rarísimo',
    texto:
      'Gestionar una lonja de pescado en tiempo real. No sabes si es una broma, pero el correo va en serio y el juego tiene noventa horas de contenido.',
    pagoSemanal: 24,
    semanas: 5,
    costeCredibilidad: 0,
    desdeComunidad: 2000,
    formato: 'clave-media',
    peso: 1.2,
  },
  {
    id: 'clave-indie',
    marca: 'Tres personas en un piso',
    categoria: 'editora',
    titulo: 'Llevamos cuatro años con esto',
    texto:
      'No pueden pagarte. Lo dicen en el primer párrafo, y en el segundo te cuentan de qué va el juego con un entusiasmo que no se finge. Sale el mes que viene y no lo va a jugar nadie.',
    pagoSemanal: 0,
    semanas: 3,
    costeCredibilidad: -0.05,
    desdeComunidad: 400,
    formato: 'clave-indie',
    peso: 1.4,
  },
  {
    id: 'clave-indie-raro',
    marca: 'Estudio Vela',
    categoria: 'editora',
    titulo: 'Un juego que no se parece a nada',
    texto:
      'Dos horas de duración, sin combate, y algo que hace al final que no te quieren contar por correo. Te ofrecen quince euros y piden perdón por ofrecerlos.',
    pagoSemanal: 8,
    semanas: 2,
    costeCredibilidad: -0.06,
    desdeComunidad: 400,
    formato: 'clave-indie',
    peso: 1.3,
  },
  {
    id: 'clave-preservacion',
    marca: 'Archivo Lumen',
    categoria: 'editora',
    titulo: 'Rescatar un juego de 1997',
    texto:
      'Una asociación que reedita juegos que ya no se pueden comprar en ningún sitio. No hay presupuesto de marketing porque no hay presupuesto.',
    pagoSemanal: 0,
    semanas: 4,
    costeCredibilidad: -0.045,
    desdeComunidad: 400,
    formato: 'clave-indie',
    peso: 1.1,
  },

  // ===== CRIPTO — semanas 12 a 30 ========================================
  {
    id: 'cripto-monedero',
    marca: 'Bolsillo',
    categoria: 'cripto',
    titulo: 'Un monedero, dicen',
    texto:
      'Pagan por adelantado y no preguntan nada. Media plataforma lleva ya el banner puesto y nadie parece encontrarle el problema.',
    pagoSemanal: 40,
    semanas: 4,
    costeCredibilidad: 0.06,
    peso: 1.3,
  },
  {
    id: 'cripto-monos',
    marca: 'Colección Cuervo',
    categoria: 'cripto',
    titulo: 'Los dibujos esos',
    texto:
      'Quieren que enseñes el tuyo en el avatar durante un mes. Te lo regalan y encima te pagan por tenerlo.',
    pagoSemanal: 60,
    semanas: 5,
    costeCredibilidad: 0.075,
    peso: 1.2,
  },
  {
    id: 'cripto-mercado',
    marca: 'Zenith Exchange',
    categoria: 'cripto',
    titulo: 'La casa de cambio grande',
    texto:
      'Cifras que no habías visto en un correo. Piden un directo entero hablando de lo fácil que es empezar.',
    pagoSemanal: 110,
    semanas: 3,
    costeCredibilidad: 0.11,
    costeFatiga: 0.015,
    desdeComunidad: 8000,
    peso: 1,
  },

  // ===== CAJAS DE BOTIN — semanas 28 a 48 ================================
  {
    id: 'cajas-sobres',
    marca: 'Estadio Ultimate',
    categoria: 'cajas',
    titulo: 'Abrir sobres en directo',
    texto:
      'Te dan la cuenta cargada y piden que abras sobres delante de la cámara. Sale caro para quien mira y gratis para ti, que es justo el problema.',
    pagoSemanal: 56,
    semanas: 5,
    costeCredibilidad: 0.07,
    peso: 1.3,
  },
  {
    id: 'cajas-gacha',
    marca: 'Astra Legends',
    categoria: 'cajas',
    titulo: 'Tiradas para el personaje nuevo',
    texto:
      'Un móvil de tiradas quiere que enseñes lo bonito que es el personaje nuevo. La parte de cuánto cuesta sacarlo la dejan a tu criterio.',
    pagoSemanal: 75,
    semanas: 4,
    costeCredibilidad: 0.085,
    desdeComunidad: 8000,
    peso: 1.2,
  },
  {
    id: 'cajas-skins',
    marca: 'Baúl',
    categoria: 'cajas',
    titulo: 'Una web de cajas',
    texto:
      'Código de descuento, saldo gratis para el chat y un enlace en la descripción. Sabes perfectamente qué es esto.',
    pagoSemanal: 105,
    semanas: 4,
    costeCredibilidad: 0.13,
    desdeComunidad: 15000,
    peso: 1,
  },

  // ===== APUESTAS — semanas 45 a 68 ======================================
  {
    id: 'apuestas-bono',
    marca: 'Ronda',
    categoria: 'apuestas',
    titulo: 'El bono de bienvenida',
    texto:
      'Quieren tu código en la descripción y treinta segundos al empezar. Pagan más que ningún patrocinio que hayas visto nunca.',
    pagoSemanal: 140,
    semanas: 4,
    costeCredibilidad: 0.14,
    desdeComunidad: 15000,
    peso: 1.3,
  },
  {
    id: 'apuestas-directo',
    marca: 'Ronda Live',
    categoria: 'apuestas',
    titulo: 'Una noche de ruleta',
    texto:
      'Un directo entero jugando con dinero que ponen ellos. Insisten en que se vea que ganas.',
    pagoSemanal: 225,
    semanas: 3,
    costeCredibilidad: 0.19,
    costeFatiga: 0.02,
    desdeComunidad: 25000,
    peso: 1.1,
  },
  {
    id: 'apuestas-embajador',
    marca: 'Ronda Club',
    categoria: 'apuestas',
    titulo: 'Ser la cara de la casa',
    texto:
      'No es un patrocinio, es un contrato de imagen. Tu cara en su publicidad durante dos meses. La cifra es la que arregla un año entero.',
    pagoSemanal: 300,
    semanas: 6,
    costeCredibilidad: 0.26,
    costeFatiga: 0.02,
    desdeComunidad: 40000,
    peso: 0.9,
  },
]

/**
 * LAS MODAS — la cronica de la epoca.
 *
 * Cada cierto tiempo aparece una categoria que paga cifras absurdas. Dura un
 * par de anos, todo el mundo la firma porque todo el mundo la esta firmando, y
 * despues estalla y queda la lista de quienes estaban dentro.
 *
 * La linea temporal es FIJA y no sorteada, y es una decision de diseno, no una
 * comodidad: asi todas las partidas viven las mismas tres olas en el mismo
 * orden, el banco de balance puede medirlas sin ruido, y el juego cuenta una
 * epoca reconocible en vez de una baraja distinta cada vez.
 *
 * Estan escalonadas para que siempre haya algo caliente y nunca dos picos a la
 * vez: si se solapasen los picos, la decision dejaria de ser "firmo o no" y
 * pasaria a ser "cual de las dos", que es otra pregunta y peor.
 */
export interface Moda {
  categoria: CategoriaMarca
  nombre: string
  /** Semana en la que empiezan a escribir. */
  desdeSemana: number
  /** Semana del pico: donde el multiplicador es maximo. */
  picoSemana: number
  /** Semana en la que estalla y dejan de escribir. */
  estallidoSemana: number
  /** Multiplicador de pago en el pico. */
  multiplicadorPico: number
  /** Credibilidad que cuesta el estallido, POR contrato que firmaste. */
  resacaCredibilidad: number
  /** Fraccion de comunidad que se va al estallar, por contrato firmado. */
  resacaComunidad: number
  /** Cuanto baja el techo de credibilidad. Permanente. */
  resacaTecho: number
  titular: string
  resacaTexto: string
}

export const MODAS: Moda[] = [
  {
    categoria: 'cripto',
    nombre: 'Cripto y coleccionables',
    desdeSemana: 12,
    picoSemana: 20,
    estallidoSemana: 30,
    multiplicadorPico: 6,
    resacaCredibilidad: 0.18,
    resacaComunidad: 0.1,
    resacaTecho: 0.06,
    titular: 'Se acabó lo de los dibujos',
    resacaTexto:
      'La casa de cambio ha cerrado de un día para otro y las carteras se han quedado dentro. Hay gente de tu chat que puso dinero porque lo vio aquí.\n\nNo hace falta que nadie te lo diga: los clips llevan toda la mañana circulando y en todos sales tú.',
  },
  {
    categoria: 'cajas',
    nombre: 'Cajas de botín',
    desdeSemana: 28,
    picoSemana: 38,
    estallidoSemana: 48,
    multiplicadorPico: 4,
    resacaCredibilidad: 0.15,
    resacaComunidad: 0.08,
    resacaTecho: 0.05,
    titular: 'Ahora resulta que eran apuestas',
    resacaTexto:
      'Un reportaje ha puesto números a lo que costaba de verdad sacar aquello, y a quién se lo estaban vendiendo. La media de edad del público es más baja de lo que nadie quería mirar.\n\nLas webs de cajas han cerrado en una semana. Los vídeos siguen ahí.',
  },
  {
    categoria: 'apuestas',
    nombre: 'Casas de apuestas',
    desdeSemana: 45,
    picoSemana: 56,
    estallidoSemana: 68,
    multiplicadorPico: 8,
    resacaCredibilidad: 0.25,
    resacaComunidad: 0.14,
    resacaTecho: 0.08,
    titular: 'La ley y la lista',
    resacaTexto:
      'La publicidad de casas de apuestas se prohíbe a partir del mes que viene. Con el anuncio ha salido la hemeroteca: quién puso la cara, cuándo, y por cuánto.\n\nTu nombre está en la lista. No es el peor de la lista, pero está.',
  },
]

export const MODA_POR_CATEGORIA: ReadonlyMap<CategoriaMarca, Moda> = new Map(
  MODAS.map((m) => [m.categoria, m]),
)

export const PATROCINIO_POR_ID: ReadonlyMap<string, OfertaPatrocinio> = new Map(
  PATROCINIOS.map((p) => [p.id, p]),
)
