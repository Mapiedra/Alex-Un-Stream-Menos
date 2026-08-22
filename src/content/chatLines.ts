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
