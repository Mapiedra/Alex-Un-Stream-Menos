# Backlog

Ideas fuera del alcance de la fase actual. Aqui van para no contaminar el sprint.

## Seccion 14 del GDD (expansion posterior)

- Mas formatos de juegos y eventos aleatorios.
- Sistema de noticias y tendencias.
- Coleccion de libros, peliculas y series con sinergias.
- Mas eventos de vida y decoracion de casa.
- Modo de repeticion / prestigio con modificadores acumulados.
- Desafios de partida: crecer rapido, maxear comunidad, vivir con pocas horas.

## Pendientes conocidos, con fase asignada

### Burnout sin suelo — F4
La fatiga puede llegar a 1.0 y quedarse ahi para siempre: la calidad cae a 0 y
el estado no se recupera nunca, porque el evento de burnout que fuerza la
parada todavia no existe. El banco lo ve con claridad: `grind` y
`sin-descanso` entran en ese pozo y no salen. Los avisos de fatiga ya estan
(F1); falta la consecuencia.

### "El grind gana a corto plazo" no se cumple — F6
La regla del GDD dice que el streaming intenso debe ganar a corto y perder a
medio plazo. Hoy pierde tambien a corto: la estrategia equilibrada adelanta al
grind ya en el minuto 10, porque el grind se queda sin calidad muy rapido y
ademas no tiene comunidad que le proteja el alcance. Requiere que la fatiga
muerda mas tarde y mas de golpe.

### La banda de duracion es provisional — F6
El bot equilibrado se retira sobre el minuto 76; el objetivo son 90-160. No se
ajusta todavia a proposito: la condicion de victoria completa (§11) exige
ademas comunidad minima, casa evolucionada, unas vacaciones y un evento
extraordinario, y esas gates son de F3 y F4. Cuando existan, el retiro se
retrasa solo y la banda se estrecha con conocimiento de causa. El test de
balance asume mientras tanto una banda ancha (45-200) y lo dice.

### Reparto manual sin interfaz — F3
`desbloquearReparto()` y `setAllocation()` existen y estan testeados, pero no
hay todavia ningun panel donde el jugador mueva sus horas: eso llega con el
ciclo 3.

## Decisiones que conviene revisar antes de publicar — F7

- **Identidad de la plataforma.** La interfaz imita el layout y la cromatica de
  un reproductor real. No se usa ningun logotipo ni marca denominativa, pero
  merece una revision antes de publicar.
- **Validacion con el creador.** El proyecto usa su nombre y sus referencias.
