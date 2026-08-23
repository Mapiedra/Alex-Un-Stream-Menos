# Alex: Un Stream Menos

Un juego incremental sobre crecer, crear comunidad y aprender a trabajar menos.

> **Proyecto de fan, no oficial.** No está afiliado a AlexElCapo / EVILAFM ni cuenta con su respaldo. Se inspira en rasgos públicos de su contenido y su trayectoria; no pretende reconstruir su vida privada ni fechas concretas.

---

## De qué va

Empiezas con un PC en una habitación y la pregunta obvia: cómo conseguir más visitas. Dos horas después la pregunta es otra, y ahí está el juego.

**Ganar no es facturar más. Ganar es poder parar.** Que lo que ya publicaste y lo que tienes ahorrado te cubran sin producir nada nuevo — y sostenerlo trabajando pocas horas, porque llegar a la cifra a base de horas no es retirarse de nada.

No se puede perder. Lo que cambia es cómo llegas.

## Comandos

```bash
npm run dev       # servidor de desarrollo
npm test          # 254 tests: fórmulas, invariantes, determinismo, balance
npm run balance   # banco de balance: nueve políticas juegan la partida entera
npm run build     # type-check + bundle de producción
npm run lint
```

## Cómo está montado

**El motor no sabe que existe React.** Todo lo que decide el juego vive en `src/sim/` como TypeScript puro, determinista y sin efectos: `step(state, dt)` devuelve un estado nuevo y nada más. De ahí salen dos cosas que importan mucho: un bug se reproduce desde una semilla, y el banco de balance puede jugar dos horas de partida en un segundo sin abrir un navegador.

**La interfaz es el reproductor.** No hay una pantalla de incremental con barras: la partida ocurre dentro de la interfaz que el jugador ya reconoce. El contador de espectadores **es** el alcance, el chat **es** la comunidad, y el botón Clip **es** el momento clippeable.

| Dónde | Qué hay |
|---|---|
| `src/sim/tunables.ts` | **Todas** las constantes de balance. Ninguna se escribe fuera de aquí |
| `src/sim/formulas.ts` | Las ecuaciones, aisladas para testearlas una a una y exponerlas en los tooltips |
| `src/content/` | Mejoras, formatos, ciclos, casas, 52 tarjetas de vida, textos del final |
| `src/ui/theme/palette.ts` | El único sitio del proyecto donde puede aparecer un color hexadecimal |
| `tools/balance/` | Bots y arnés de balance |
| `docs/` | GDD, brief de arte, protocolo de playtest, esquema de telemetría |

## El banco de balance

Las reglas de diseño del GDD son **tests que fallan en CI**. Si alguien toca una constante y el juego deja de decir lo que quería decir, se entera antes de que llegue a nadie.

```
bot           retiro    comunidad   vac/burn
grind           —          124.398    0/3      forzar horas no lleva a ninguna parte
equilibrado   129 min      454.674    1/0      la referencia
vacacionero   129 min      709.608    6/0      descansar más deja más comunidad
derivado      131 min      483.701    1/0      jugar solo comprando también llega
```

## Telemetría

Opcional y anónima. Sin credenciales configuradas no manda absolutamente nada y el juego funciona igual.

No hay cookie, ni huella, ni identificador persistente: el id de sesión se genera al cargar la página y muere al cerrarla. Se mide dónde abandona la gente y cómo acaba, que es lo único que sirve para mejorar el juego.

El esquema está en [`docs/supabase.sql`](docs/supabase.sql). Copia `.env.example` a `.env` y rellena las dos variables.

**No hay ranking, y es a propósito.** El juego dice que trabajar menos es mejor; una clasificación por quién tiene más comunidad convertiría eso en una competición de optimización. En su lugar hay un muro de finales: qué porcentaje de gente acabó en cada epílogo.

## Estado

Fases F0 a F6 completadas: motor, bucle, formatos, ciclos, eventos, final y balance calibrado. Queda publicar.

El pixel art es **provisional**: la escena está construida con capas de CSS a la espera de los lotes descritos en [`docs/brief-arte.md`](docs/brief-arte.md). Cada objeto es su propia capa para poder sustituirlo por su sprite sin tocar nada más.

La paleta está **extraída por código** de las referencias del canal. Ningún valor está estimado a ojo.

## Licencia

Código bajo MIT (ver [`LICENSE`](LICENSE)).

La licencia cubre **el código**, no la identidad ni la imagen de AlexElCapo / EVILAFM, que son suyas. Si eres él y quieres que esto cambie de nombre, se despersonalice o desaparezca, abre un issue y se hace.
