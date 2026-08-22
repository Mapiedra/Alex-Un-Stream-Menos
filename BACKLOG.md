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

### "El grind gana a corto plazo" no se cumple — F6
La regla del GDD dice que el streaming intenso debe ganar a corto y perder a
medio plazo. Hoy pierde tambien a corto: la estrategia equilibrada adelanta al
grind ya en el minuto 10, porque el grind se queda sin calidad muy rapido y
ademas no tiene comunidad que le proteja el alcance. Requiere que la fatiga
muerda mas tarde y mas de golpe.

### La fatiga es inerte para quien juega equilibrado — F6
El banco mide que un jugador equilibrado nunca pasa de 0.06 de fatiga: el
sistema solo muerde a quien fuerza a proposito. Puede estar bien —castigar el
grind es justo su trabajo— pero significa que la mitad "descansar" de la tesis
del GDD se sostiene entera sobre el Legado, no sobre el agotamiento. Conviene
decidir en F6 si se sube el coste de las horas o se deja asi a proposito.

### La banda de duracion, otra vez a revisar — F6
Con F4 el equilibrado se retira sobre el minuto 100. La banda del test sigue
siendo 80-180, mas ancha que el objetivo de 90-160, porque el contenido de F5
(mas tarjetas, escena final) volvera a moverla.

### Audio — pendiente
F5 contemplaba audio y no se ha hecho: no hay assets ni fuente para ellos, y
generar sonido de relleno habria sido peor que no tener ninguno. Queda como
encargo aparte, junto con los lotes de arte.

### Sin captura de pantalla en todo el desarrollo
El panel del navegador no se ha mostrado en ninguna sesion, asi que el aspecto
REAL del juego —colores en pantalla, escena, chat en movimiento, escalado del
pixel art— sigue sin verse. Todo se ha verificado por DOM y por tests. Es lo
primero que habria que mirar con ojos humanos.

## Decisiones que conviene revisar antes de publicar — F7

- **Identidad de la plataforma.** La interfaz imita el layout y la cromatica de
  un reproductor real. No se usa ningun logotipo ni marca denominativa, pero
  merece una revision antes de publicar.
- **Validacion con el creador.** El proyecto usa su nombre y sus referencias.
