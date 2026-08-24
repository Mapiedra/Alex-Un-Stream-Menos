/**
 * Poblacion del chat.
 *
 * Los nicks son INVENTADOS. Las capturas de referencia contienen nombres de
 * espectadores reales y reproducirlos en un juego publicado expondria a gente
 * concreta; se imita el estilo, no las personas. Misma regla que el GDD aplica
 * al propio creador (secciones 15 y 16): reconocible, nunca literal.
 */

export const NICKS = [
  'kirisu_', 'nerinde', 'weeb_nyan', 'solo_mou', 'gazpachito', 'argod_01',
  'lau_bowen', 'kairitos', 'salchipapa_dtm', 'dimalorde', 'juanan_2',
  'marioju', 'angelbollow', 'uzuliana', 'garciaperis', 'kyuubi_6',
  'brisaverde', 'elpepe_dev', 'mantecato', 'nocturninho', 'raulillo_99',
  'la_bicha', 'trufa_gatuna', 'catorce_', 'pixelmancer', 'boquerones',
] as const

export const BOT_NICK = 'Moobot'

/** Mensajes de relleno: presencia, no informacion. */
export const CHAT_GENERICAS = [
  'buenas tardes', 'holaa', 'buenas', 'que se cuece', 'primeraaa',
  'jajajaja', 'menudo crack', 'esto es arte', 'que buen rato',
  'vengo del clip', 'me acabo de conectar, que me he perdido',
  'literalmente yo', 'no me lo creo', 'otra vez lo mismo eh',
  'aguanta el tipo', 'estoy de acuerdo', 'que fuerte',
] as const

/** Emotes: la respuesta mas comun a cualquier cosa. */
export const CHAT_EMOTES = [
  'catJAM', 'blobDance', 'BREAKDANCECAT', 'KEKW', 'PogChamp', 'Sadge',
  'peepoHappy', 'monkaS', 'EZ Clap', 'catKISS', 'pandaDance',
] as const

/** Reacciones a que se acaba de publicar algo. */
export const CHAT_PUBLICACION = [
  'ya esta subido!!', 'a verlo', 'video nuevo lets gooo',
  'yo ya lo he visto dos veces', 'que rapido lo has sacado',
  'el algoritmo va a flipar', 'vaya portada', 'esto peta seguro',
] as const

/** Cuando la fatiga esta alta: el chat lo nota antes que el jugador. */
export const CHAT_CANSANCIO = [
  'se te ve cansado eh', 'descansa un poco porfa', 'llevas muchas horas ya',
  'no te quemes', 'cuidate', 'vete a dormir hombre',
  'que lleves 8 horas no es normal',
] as const

/** Cuando la calidad es alta y las cosas van bien. */
export const CHAT_BUENA_RACHA = [
  'este directo esta siendo top', 'que nivel', 'esto merece clip',
  'la mejor racha en meses', 'se nota que estas a gusto',
] as const

/** Cuando el alcance cae. */
export const CHAT_BAJON = [
  'hoy hay poca gente no?', 'se ha caido el directo a alguien mas?',
  'estamos los de siempre', 'los fieles aqui',
] as const

/** Mensajes de charla y libros: el contenido de fidelizacion del GDD. */
export const CHAT_COMUNIDAD = [
  'mi booktoker de confianza', 'este libro me lo lei antes que tu',
  'el club de lectura del mes cuando', 'llevo 3 años viendote',
  'de los pocos canales que veo enteros', 'aqui desde los 200 viewers',
] as const

/**
 * Mientras corre un contrato con una marca.
 *
 * El chat no se enfada: bromea. Es lo que hace de verdad un chat cuando su
 * creador lee un guion — se lo toma a risa, se lo recuerda, y sigue ahi. Que
 * sea humor y no reproche es lo que hace que el desgaste se note despacio, que
 * es como se nota de verdad.
 */
export const CHAT_PATROCINIO = [
  'ah, el segmento', 'link en la descripcion chicos', 'no te saltes el ad',
  'skip', 'que lo lea con sentimiento', 'se nota que le paga',
  'AD AD AD', 'pausa publicitaria', 'y ahora unas palabras de nuestro patrocinador',
  'lo dice con la boca pequeña', 'jajaja se le nota que no lo usa',
  'que le paguen bien al menos', 'yo me lo he leido y no lo uso eh',
  'guion guion guion', 'la marca escuchando esto',
] as const

/**
 * Cuando la credibilidad va cayendo.
 *
 * Aqui ya no hay broma. No son insultos —el juego no hace eso— pero si el tono
 * de alguien que lleva un tiempo notando algo y por fin lo dice en voz alta.
 * Es el aviso que el jugador necesita ANTES de que la cifra le duela, igual
 * que el aviso de fatiga llega antes que la penalizacion.
 */
export const CHAT_CREDIBILIDAD = [
  'ultimamente esto es un anuncio detras de otro',
  'antes esto no era asi', 'cuantos patrocinios llevas ya este mes',
  'yo vengo por ti, no por las marcas', 'un poquito de por favor',
  'esto ya no se parece a lo de antes', 'te estas pasando un poco eh',
  'que pena', 'cada vez menos directo y mas escaparate',
  'me acuerdo de cuando esto era otra cosa',
  'no digo que este mal, digo que son muchos',
  'lo entiendo, hay que comer, pero joder',
] as const

/**
 * Cuando estalla una moda y se acuerdan de lo que firmaste.
 *
 * El unico corpus del juego que mira hacia atras. La gracia de que la resaca
 * pase veinte semanas despues es exactamente esta: el chat se acuerda mejor
 * que el jugador.
 */
export const CHAT_RESACA = [
  'lo dijimos en su momento', 'yo avise', 'el clip esta circulando otra vez',
  'todos los que lo promocionasteis, callados', 'que pasa con lo de antes',
  'hay gente que perdio dinero con eso', 'ya no te acuerdas eh',
  'esperando el comunicado', 'a ver quien pide perdon',
  'lo tienes en el canal todavia', 'mi primo metio ahi los ahorros',
  'no hace falta que digas nada, en serio',
  'yo te sigo viendo igual, pero vaya', 'esto no se borra',
] as const

/**
 * Cuando dijiste que no y se sabe.
 *
 * Existe porque rechazar tiene que SENTIRSE, no solo contabilizarse. Sin este
 * corpus, decir que no seria un boton que no hace nada — y el juego estaria
 * pidiendo integridad sin devolver nada a cambio.
 */
export const CHAT_INTEGRIDAD = [
  'gracias por no vendernos casinos', 'por esto te sigo',
  'otros ya habrian firmado', 'se agradece de verdad',
  'el unico que no ha caido', 'esto vale mas que cualquier patrocinio',
  'te lo digo en serio, gracias', 'sigue asi por favor',
  'aqui no hay codigos de descuento y se nota', 'que raro es esto ya',
  'ojala todos', 'lo respeto muchisimo',
] as const
