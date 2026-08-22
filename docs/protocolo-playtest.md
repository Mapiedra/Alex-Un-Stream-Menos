# Protocolo de playtest

Para 5-8 personas. Cada sesión son unas dos horas y media: dos de juego y media de conversación.

El banco de balance ya garantiza que los números hacen lo que el diseño quiere. Lo que no puede medir es lo único que importa aquí: **si el jugador entiende por qué**.

---

## Antes de la sesión

Manda un enlace de *preview* propio por persona (una rama por tester, para poder correlacionar cambios). Pídeles:

- Dos horas seguidas, sin interrupciones, en un ordenador — no en móvil.
- Que graben la pantalla si les parece bien. Si no, tomas notas tú.
- **Que no lean nada del juego antes.** Ni el GDD, ni este documento, ni la descripción.

No les cuentes de qué va. La frase de presentación es exactamente esta y ninguna otra:

> Es un juego sobre un creador de contenido. Juega como te apetezca.

Si preguntan cuál es el objetivo, la respuesta es *"averígualo"*. Ese es medio experimento.

## Durante

No intervengas. Ni una pista, ni una corrección, ni un "prueba a...". Si se atascan diez minutos, anota dónde y déjales seguir atascados.

Anota la hora exacta de cada uno de estos momentos:

| Momento | Qué revela |
|---|---|
| Primera compra | Si la tienda se entiende sola |
| Primer cambio de formato | Si se ve que el formato importa |
| **Primera vez que dicen algo sobre el chat** | Si el chat comunica lo que debe |
| Primer clip acertado, y si lo buscan o les pilla | Si el botón se lee |
| Primera vez que miran la fatiga | Si el aviso llega a tiempo |
| **Primeras vacaciones, y si dudan antes** | El corazón del juego |
| Primer burnout, si lo hay | Cómo se recibe la parada forzada |
| Primera vez que abren el panel de retiro | Cuándo cambia la pregunta |
| Retiro o abandono | Duración real de la partida |

Y aparte, dos cosas más:

- **Cada vez que digan algo en voz alta**, transcríbelo literal. Las quejas espontáneas valen más que cualquier respuesta a una pregunta.
- **Cada vez que se rían.** Marca de qué. El tono es la mitad del juego y no hay forma de testearlo con números.

## Después

Preguntas abiertas, en este orden. No adelantes ninguna.

1. ¿De qué iba el juego?
2. ¿Cuándo entendiste cómo se ganaba?
3. ¿En qué momento te aburriste? *(Asume que hubo uno. Si dicen que en ninguno, insiste una vez.)*
4. ¿Hubo algo que hiciste porque el juego te lo pedía y no porque te apeteciera?
5. ¿Cuándo te diste cuenta de que descansar era buena idea? ¿O no te diste cuenta?
6. ¿Qué diferencia hay entre alcance y comunidad?
7. ¿Te sonó a alguien real? ¿Te molestó algo de cómo estaba tratado?
8. ¿Volverías a jugar? ¿Qué harías distinto?

## Qué se está midiendo

Cinco hipótesis. Cada una se confirma o se cae con lo que digan, no con lo que hagan.

**H1 — La tesis se transmite.** En la pregunta 6 tienen que distinguir alcance de comunidad sin haber leído un tooltip. Si describen ambos como "gente que te ve", el reparto de color y las sparklines no están funcionando.

**H2 — Descansar se descubre, no se explica.** En la 5, el momento tiene que estar antes del minuto 60. Si dicen "porque el juego me lo dijo", ha fallado: era para deducirlo, no para obedecerlo.

**H3 — El objetivo aparece a tiempo.** En la 2, si nadie lo entiende antes de la mitad, la condición de retiro está demasiado escondida.

**H4 — El ritmo aguanta.** En la 3, los bajones no deben concentrarse todos en el mismo tramo. Si tres personas se aburren entre el 40 y el 60, ahí hay un agujero de contenido.

**H5 — El tono funciona.** En la 7, nadie debería sentir que el juego se ríe de alguien. Una sola respuesta incómoda basta para revisar los textos.

## Qué NO se está midiendo

- **Si les gusta.** Es agradable saberlo y no sirve para decidir nada.
- **Si los números están bien.** Para eso está `npm run balance`, que juega nueve partidas completas en segundos y comprueba diez reglas.
- **Bugs.** Anótalos, pero no son el objetivo de la sesión.

## Después de las 5-8 sesiones

Antes de tocar una sola constante de `tunables.ts`, escribe qué hipótesis han caído. Si una constante cambia, tiene que haber un test del banco que respalde el cambio o una hipótesis caída que lo justifique. Un cambio de balance sin ninguna de las dos cosas es una corazonada, y las corazonadas ya se han equivocado varias veces en este proyecto — están documentadas en el historial de commits.
