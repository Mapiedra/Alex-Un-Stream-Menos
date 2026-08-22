# La Maquina de Hacer Videos

Incremental narrativo sobre la carrera de un creador de contenido. El GDD de partida es
`docs/gdd.pdf` y las referencias visuales estan en `docs/ref/`; el plan de
desarrollo vive fuera del repositorio, en el fichero de plan de la sesion.

**La interfaz es el reproductor.** No hay una pantalla de incremental con
barras: la partida ocurre dentro de la interfaz que el jugador ya reconoce.
El contador de espectadores ES el alcance, el chat ES la comunidad, y el boton
Clip ES el momento clippeable del GDD.

## Comandos

```bash
npm run dev       # servidor de desarrollo
npm test          # tests: formulas, invariantes, determinismo, paleta
npm run balance   # banco de balance: juega la partida con 6 politicas
npm run build     # type-check + bundle de produccion
npm run lint
```

## Como esta montado

**El motor no sabe que existe React.** Todo lo que decide el juego vive en
`src/sim/` como TypeScript puro, determinista y sin efectos: `step(state, dt)`
devuelve un estado nuevo y nada mas. De ahi salen dos cosas que importan mucho:
un bug se reproduce desde una semilla, y el banco de balance puede jugar dos
horas de partida en un segundo sin abrir un navegador.

- `src/sim/tunables.ts` — TODAS las constantes de balance. Ninguna se escribe
  fuera de aqui.
- `src/sim/formulas.ts` — las ecuaciones, aisladas para testearlas una a una y
  poder exponerlas en los tooltips.
- `src/ui/theme/palette.ts` — el unico sitio del proyecto donde puede aparecer
  un color hexadecimal. `tests/palette.test.ts` lo hace cumplir.
- `tools/balance/` — bots y arnes de balance.

## Estado

Fase F0 (cimientos) completada, mas la capa visual del reproductor.

La paleta esta **extraida por codigo** de `docs/ref/` — el avatar, la calle de
la intro y las capturas del directo. Ningun valor esta estimado a ojo. La
escena de la calle es un placeholder de CSS por capas hasta que lleguen los
lotes de pixel art; cada capa se sustituye por su sprite sin tocar el resto.
