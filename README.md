# Alex: Un Stream Menos

Un juego incremental sobre crecer, crear comunidad y aprender a trabajar menos.

> **Proyecto de fan, no oficial.** No está afiliado a AlexElCapo / EVILAFM ni cuenta con su respaldo. Se inspira en rasgos públicos de su contenido y su trayectoria; no pretende reconstruir su vida privada ni fechas concretas.

---

## De qué va

Empiezas con un PC en una habitación y la pregunta obvia: cómo conseguir más visitas. Dos horas después la pregunta es otra, y ahí está el juego.

**El tiempo es un presupuesto, no un río.** Una semana son 21 franjas —siete días por mañana, tarde y noche— y cada una se gasta en una cosa: emitir, editar, comunidad, leer, vida o dormir. Repartes, vives la semana con el reproductor en marcha, y al acabarse la partida se para y vuelves a repartir. Decidir es una pausa.

**Las marcas escriben, y no paran de escribir.** Cripto en la semana 12, cajas de botín en la 28, casas de apuestas en la 45: cada moda paga cifras absurdas mientras dura y deja una lista cuando estalla. Firmar da dinero hoy y gasta **credibilidad**, que no compra nada y decide cuánta de la gente que llega se queda. Se puede jugar la partida entera sin firmar nada, y hay un test que lo comprueba.

**Ganar no es facturar más. Ganar es poder parar.** Que lo que ya publicaste y lo que tienes ahorrado te cubran sin producir nada nuevo — y sostenerlo trabajando pocas horas, porque llegar a la cifra a base de horas no es retirarse de nada. Y llegar con la cara limpia: quien llega al número firmándolo todo llega al número y a otra cosa distinta, y tiene su propio epílogo.

No se puede perder. Lo que cambia es cómo llegas.

## Comandos

```bash
npm run dev       # servidor de desarrollo
npm test          # 389 tests: fórmulas, invariantes, determinismo, balance
npm run balance   # banco de balance: nueve políticas juegan la partida entera
npm run build     # type-check + bundle de producción
npm run lint
```

## Cómo está montado

**El motor no sabe que existe React.** Todo lo que decide el juego vive en `src/sim/` como TypeScript puro, determinista y sin efectos: `step(state, dt)` devuelve un estado nuevo y nada más. De ahí salen dos cosas que importan mucho: un bug se reproduce desde una semilla, y el banco de balance puede jugar dos horas de partida en un segundo sin abrir un navegador.

**La interfaz es el reproductor.** No hay una pantalla de incremental con barras: la partida ocurre dentro de la interfaz que el jugador ya reconoce. El contador de espectadores **es** el alcance, el chat **es** la comunidad, y el botón Clip **es** el momento clippeable.

**Una moneda por categoría.** Nada sale gratis, y lo que cuesta cada cosa dice qué clase de cosa es: el equipo y la casa se compran con **dinero**, montarse el flujo de trabajo cuesta **material** —horas de edición, o sea vídeos que este mes no salen—, cambiar de rutina cuesta **vida** —y no se puede reorganizar nada estando hecho polvo—, y un formato nuevo cuesta **ideas**. Lo hace cumplir `tests/shop.test.ts`.

**Un solo reparto del tiempo, tres interfaces.** `Allocation` es la única representación interna de en qué se van las horas. En los ciclos 1-2 lo derivan las mejoras compradas, desde el ciclo 3 lo coloca el jugador franja a franja en el planificador, y dentro del tick es el *one-hot* de la franja en curso. Eso último es lo que hizo barato el cambio de modelo de tiempo: casi todo el tick es lineal en el reparto, así que integrar one-hots a lo largo de la semana da los mismos totales semanales que la fracción promedio de siempre. Lo comprueba `tests/semana.test.ts`.

| Dónde | Qué hay |
|---|---|
| `src/sim/tunables.ts` | **Todas** las constantes de balance. Ninguna se escribe fuera de aquí |
| `src/sim/formulas.ts` | Las ecuaciones, aisladas para testearlas una a una y exponerlas en los tooltips |
| `src/sim/semana.ts` | La semana por franjas: el planificador, el one-hot y el plan automático |
| `src/sim/patrocinios.ts` | Ofertas, contratos, modas y resacas. Con PRNG propio, a propósito |
| `src/ui/Pestanas.tsx` | Las siete pantallas. El reproductor se queda fijo arriba y debajo va una cada vez |
| `src/content/` | Mejoras, formatos, ciclos, casas, libros, 52 tarjetas de vida, 26 marcas, textos del final |
| `src/ui/theme/palette.ts` | El único sitio del proyecto donde puede aparecer un color hexadecimal |
| `tools/balance/` | Bots y arnés de balance |
| `docs/` | GDD, brief de arte, protocolo de playtest, esquema de telemetría |

## El banco de balance

Las reglas de diseño del GDD son **tests que fallan en CI**. Si alguien toca una constante y el juego deja de decir lo que quería decir, se entera antes de que llegue a nadie.

```
bot           retiro    comunidad   vac/burn
grind           —          195.056    0/2      forzar horas no lleva a ninguna parte
equilibrado   156 min      714.453    1/0      la referencia
vacacionero   150 min    1.062.629    5/0      descansar llega antes y con más colchón
derivado      156 min      704.609    1/0      jugar solo comprando también llega
```

Y las cuatro reglas del sistema de marcas, cada una con su test:

```
bot           1000 €    retiro    credib.  epílogo
integro       110 min   156 min   1.00     cómodo    no firmar no cuesta NADA: partida idéntica
selectivo      97 min   143 min   0.88     cómodo    firmar con criterio es una jugada, no una trampa
vendido        80 min   113 min   0.53     vendido   el dinero rápido funciona, y se cobra en el final
```

`integro` juega una partida **idéntica bit a bit** a la de antes de que existieran los
patrocinios. No es casualidad: el sistema tiene su propio PRNG precisamente para que añadirlo no
desplazara en silencio todo lo que el banco ya medía.

## Telemetría

Opcional y anónima. Sin credenciales configuradas no manda absolutamente nada y el juego funciona igual.

No hay cookie, ni huella, ni identificador persistente: el id de sesión se genera al cargar la página y muere al cerrarla. Se mide dónde abandona la gente y cómo acaba, que es lo único que sirve para mejorar el juego.

El esquema está en [`docs/supabase.sql`](docs/supabase.sql). Copia `.env.example` a `.env` y rellena las dos variables.

**No hay ranking, y es a propósito.** El juego dice que trabajar menos es mejor; una clasificación por quién tiene más comunidad convertiría eso en una competición de optimización. En su lugar hay un muro de finales: qué porcentaje de gente acabó en cada epílogo.

## Estado

Fases F0 a F8 completadas: motor, bucle, formatos, ciclos, eventos, la semana por franjas, patrocinadores, final y balance calibrado. Queda publicar.

El pixel art es **provisional**: la escena está construida con capas de CSS a la espera de los lotes descritos en [`docs/brief-arte.md`](docs/brief-arte.md). Cada objeto es su propia capa para poder sustituirlo por su sprite sin tocar nada más.

La paleta está **extraída por código** de las referencias del canal. Ningún valor está estimado a ojo.

## Licencia

Código bajo MIT (ver [`LICENSE`](LICENSE)).

La licencia cubre **el código**, no la identidad ni la imagen de AlexElCapo / EVILAFM, que son suyas. Si eres él y quieres que esto cambie de nombre, se despersonalice o desaparezca, abre un issue y se hace.
