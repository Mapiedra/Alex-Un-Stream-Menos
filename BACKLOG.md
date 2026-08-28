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

Sigue sin verse despues de la pasada de interfaz: el marcador, la irrupcion de
eventos, el balance semanal y los flotantes se han verificado midiendo el DOM
—posiciones, alturas, desbordes a 1280x720, 1280x600 y 375x812— y empujando la
simulacion con el puente de depuracion, pero nadie ha visto un fotograma. Las
animaciones CSS son ademas lo unico que ese metodo NO puede comprobar: con la
ventana oculta el navegador tampoco compone, asi que se quedan congeladas en su
primer fotograma.

En F7 se descubrio ademas POR QUE cuesta tanto: sin ventana visible el
navegador congela `requestAnimationFrame`, asi que el bucle no corre y la
partida se queda clavada en el segundo cero. Cualquier verificacion por DOM que
dependa del paso del tiempo da un falso negativo. Para eso existe el puente de
`src/main.tsx` (solo en desarrollo):

    __juego.getState().advance(5000)

Dos cosas mas que hacen falta para que el puente sirva, descubiertas midiendo:

  - `advance` NO hace nada con `pausaNarrativa` puesta, y una partida nueva
    arranca con el aviso de ciclo delante. Hay que cerrarlo primero
    (`cerrarAvisoCiclo()` y `setPausaNarrativa(false)`) o el reloj no se mueve
    y parece que el puente esta roto.
  - Sin composicion no avanzan las TRANSICIONES, asi que `getComputedStyle`
    devuelve el valor de partida —`opacity: 0`, `filter: brightness(1)`— y
    parece que la regla no se aplica. Inyectar
    `* { transition: none !important }` antes de medir da el valor real. Es lo
    unico que permite comprobar por DOM una regla que llega por transicion.

Sigue sin poder hacerse una captura, que es lo que falta de verdad.

### La fuente de pixeles NO esta cargada — pendiente
`--font-pixel` declara `'Silkscreen', 'Courier New', monospace` y en el
proyecto no hay ni un `@font-face` ni un enlace a Google Fonts: toda la capa
diegetica —pestanas, botones, etiquetas de la rejilla, titulos del menu— se
dibuja en realidad con la Courier del sistema. Es la mitad de la explicacion
de por que la interfaz se veia pequena y sucia; la otra mitad era la escala,
que ya se ha subido de base 8 a base 12.

No se ha arreglado aqui porque cargarla es una decision con coste: o entra un
enlace a Google Fonts —una peticion a un tercero en un juego que presume de no
mandar nada— o entra el `.ttf` al repositorio con su licencia. Cualquiera de
las dos vale; ninguna es una linea de CSS que se pueda colar en una pasada de
legibilidad.

### Lo que quedo fuera de la pasada de interfaz — decidido

De la auditoria de UX se implementaron el marcador permanente, la separacion
entre lo automatico y las acciones, la irrupcion de los eventos, el reparto
semanal en barras, el balance al cerrar la semana, el registro, los numeros
flotantes y la barra de pantallas abajo en movil. Tres cosas se dejaron fuera
a proposito:

- **"Maximo cuatro recursos" al pie de la letra.** El marcador ensena cuatro,
  pero las otras diez cifras siguen enteras en la pantalla de Canal en vez de
  esconderse dentro de otros paneles. Este juego expone sus formulas desde F1
  y el publico de incrementales las pide; lo que sobraba no era que existieran,
  era que estuvieran TODAS delante a la vez.
- **Interfaz que crece por secciones.** Solo se gana la pestana de Marcas, que
  es la unica que hasta que alguien te escribe es un panel vacio explicando un
  sistema que no te ha pasado. Escalonar Casa, Comunidad y Vida como pantallas
  que aparecen pediria repartir su contenido de otra forma, y eso ya no es una
  pasada de interfaz.
- **Iconos en la barra de pantallas de movil.** Las siete etiquetas caben a
  52 px sin cortarse, asi que se ha preferido la palabra al pictograma: un
  icono que hay que aprenderse no es mas accesible que una palabra que se lee.
- **Reloj de sesion en la tarjeta de estado.** Una franja dura ~4,3 s de
  simulacion (90 s / 21), asi que una cuenta tipo `01:42:18` seria un numero
  girando sin significado. En su lugar la tarjeta lleva un hilo de progreso de
  la franja en curso.

### Lo que el registro NO recuerda — decidido
El registro de actividad y el balance semanal viven en el store y no en
`GameState`: se derivan de comparar estados y se pierden al recargar. Es a
proposito —meter una lista de texto dentro de la simulacion determinista
costaria version de guardado, migracion y una superficie nueva que el banco de
balance tendria que ignorar a mano—, pero significa que continuar una partida
abre el registro en blanco. Si algun dia molesta, lo barato es guardar solo las
ultimas diez entradas.

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

### ~~El nivel de edicion automatico no tiene interfaz~~ — hecho
Resuelto: la tienda enseña un selector de tres niveles dentro de la categoria
Flujo de trabajo, visible solo con `programacion` comprado. Se ha puesto ahi y
no en la barra del reproductor a proposito — la barra es para lo que se decide
AHORA, y esto es una regla que se deja puesta. Verificado en el navegador:
pulsar cambia `nivelAuto` en el estado y el store guarda.

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
