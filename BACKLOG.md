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

### La fatiga sigue siendo inerte para quien juega equilibrado — decidido
Un jugador equilibrado no pasa de 0.06 de fatiga. Se ha decidido DEJARLO ASI:
desde F6 la calidad solo se resiente pasada la saturacion, asi que acumular
algo de cansancio no deberia doler. La fatiga es el castigo de forzar, no un
impuesto sobre jugar. La mitad "descansar" de la tesis se sostiene sobre el
Legado y sobre la condicion de retiro, que exige haber parado al menos una vez.

### Audio — pendiente
F5 contemplaba audio y no se ha hecho: no hay assets ni fuente para ellos, y
generar sonido de relleno habria sido peor que no tener ninguno. Queda como
encargo aparte, junto con los lotes de arte.

### Sin captura de pantalla en todo el desarrollo
El panel del navegador no se ha mostrado en ninguna sesion, asi que el aspecto
REAL del juego —colores en pantalla, escena, chat en movimiento, escalado del
pixel art— sigue sin verse. Todo se ha verificado por DOM y por tests. Es lo
primero que habria que mirar con ojos humanos.

### Playtests reales — F6, pendiente
El protocolo esta escrito en `docs/protocolo-playtest.md` pero no se ha
ejecutado: hacen falta 5-8 personas y dos horas cada una. Es lo unico de F6
que no se puede automatizar, y las cinco hipotesis que plantea son
exactamente las que el banco de balance NO puede comprobar.

## Decisiones que conviene revisar antes de publicar — F7

- **Identidad de la plataforma.** La interfaz imita el layout y la cromatica de
  un reproductor real. No se usa ningun logotipo ni marca denominativa, pero
  merece una revision antes de publicar.
- **Validacion con el creador.** El proyecto usa su nombre y sus referencias.
