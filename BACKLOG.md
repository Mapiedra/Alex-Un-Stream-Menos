# Backlog

Ideas fuera del alcance de la fase actual. Aqui van para no contaminar el sprint.

## Seccion 14 del GDD (expansion posterior)

- Mas formatos de juegos y eventos aleatorios.
- ~~Patrocinadores.~~ Hecho en F9: ofertas constantes, credibilidad como recurso,
  tres modas colocadas en el tiempo con su resaca, claves de prensa y el cuarto
  epilogo. Lo que queda pendiente esta abajo.
- Sistema de noticias y tendencias.
- ~~Coleccion de libros, peliculas y series con sinergias.~~ Hecho en F7: los
  libros existen, se leen con horas del dia a dia y la coleccion da sinergias
  pequeñas por tema. Peliculas y series siguen pendientes.
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

En F7 se descubrio ademas POR QUE cuesta tanto: sin ventana visible el
navegador congela `requestAnimationFrame`, asi que el bucle no corre y la
partida se queda clavada en el segundo cero. Cualquier verificacion por DOM que
dependa del paso del tiempo da un falso negativo. Para eso existe el puente de
`src/main.tsx` (solo en desarrollo):

    __juego.getState().advance(5000)

### La rejilla de la semana esta sin ver en pantalla — F7
Las 21 franjas, la paleta de colores por bloque y el arrastre para pintar
varias seguidas se han verificado por DOM y por tests, pero nadie ha visto la
rejilla renderizada. Es lo que mas depende de que se lea bien de un vistazo.

### Playtests reales — F6, pendiente
El protocolo esta escrito en `docs/protocolo-playtest.md` pero no se ha
ejecutado: hacen falta 5-8 personas y dos horas cada una. Es lo unico de F6
que no se puede automatizar, y las cinco hipotesis que plantea son
exactamente las que el banco de balance NO puede comprobar.

### El adelantamiento en alcance llega tarde — pendiente
El GDD quiere que el grind lidere el alcance hasta el minuto ~35 y lo pierda a
partir del ~60. El banco lo situaba en el minuto 125 ANTES de F7 y en el 150
despues, asi que la desviacion venia de antes y F7 la ha ensanchado. No es una
regresion nueva y ningun test la cubre hoy; el retiro —que es lo que el banco
mide de verdad— sigue en banda. Conviene decidir si la banda del GDD sigue
siendo la buena antes de tocar constantes por esto.

### El plan automatico no conoce las monedas nuevas — F8
`planAutomatico` reparte franjas a partir de un reparto y no sabe nada de que
comprar. En los ciclos 1-2 eso significa que el juego puede dejarte sin
material justo cuando la tienda te pide material para el flujo. No se ha visto
romper nada en el banco, pero conviene mirarlo si algun playtest se queda
atascado sin poder comprar nada.

### El nivel de edicion automatico no tiene interfaz — F7
`programacion` deja elegir con que nivel publica el calendario, y el estado
(`nivelAuto`) y la accion del store (`setNivelAuto`) existen y estan testeados,
pero no hay ningun control en pantalla para cambiarlo: se queda en 'normal'.
Falta un selector en la tienda o en la barra de controles.

## Decisiones que conviene revisar antes de publicar — F7

- **Identidad de la plataforma.** La interfaz imita el layout y la cromatica de
  un reproductor real. No se usa ningun logotipo ni marca denominativa, pero
  merece una revision antes de publicar.
- **Validacion con el creador.** El proyecto usa su nombre y sus referencias.

### La pantalla de Marcas no se ha visto renderizada — F9
Igual que la rejilla de la semana: las tarjetas de oferta, el banner de la moda
y el modal de la resaca se han verificado por DOM —textos, clases, atributos,
que el reloj se congela y se reanuda— pero nadie ha visto la pantalla dibujada.
El navegador no compone frames sin ventana visible, asi que la captura sigue sin
poder hacerse desde aqui.

Lo que mas depende de verse: si el punto rojo de la pestana molesta a la larga,
si dos ofertas seguidas se leen bien de un vistazo, y si el modal de la resaca
tiene el peso que deberia tener.

### El multiplicador de moda no avisa antes de empezar — F9
La ola se ve en cuanto empieza a calentarse, pero no hay ningun aviso de que
viene. Un jugador que abre la pestana en la semana 25 ve un x4 y no sabe si es
el principio o el final. El banner lo dice con palabras; convendria una barra.

### El texto del banner dice "cada vez mas" tambien en el pico exacto — F9
`subiendo` es `semana <= picoSemana`, asi que la semana del pico se anuncia como
si todavia subiera. Es una semana de setenta y cinco y no rompe nada, pero esta
mal dicho.

### La resaca puede pillarte con el contrato a medias — F9
Si firmas una moda dos semanas antes de que estalle, el contrato se queda
corriendo despues del estallido: sigues cobrando de una marca que acaba de
saltar por los aires. Puede que sea lo correcto —los contratos no se rompen
solos— pero no se ha decidido a proposito, ha salido asi.
