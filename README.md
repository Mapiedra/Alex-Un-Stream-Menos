# La Maquina de Hacer Videos

Incremental narrativo sobre la carrera de un creador de contenido. El GDD de
partida es `alexelcapo_gdd_definitivo.pdf`; el plan de desarrollo vive fuera del
repositorio, en el fichero de plan de la sesion.

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

Fase F0 (cimientos) completada. Ver el plan para el resto.

La paleta actual es **provisional**: se sustituira por la extraida de los frames
de la intro del canal. Sustituirla es editar un solo fichero.
