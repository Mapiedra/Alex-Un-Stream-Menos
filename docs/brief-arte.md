# Brief de arte — "La Máquina de Hacer Vídeos"

Documento para encargar el pixel art. Contiene todo lo que un artista necesita para presupuestar sin tener que preguntar.

---

## 1. Qué es el proyecto

Un incremental narrativo de navegador, de unas dos horas, sobre la carrera de un creador de contenido. **La interfaz del juego es un reproductor de streaming**: cabecera de canal, escena grande, webcam en la esquina, chat lateral y barra de controles. El arte va casi todo dentro de esa "escena".

Web estática (React), sin motor de juego. Los sprites se muestran escalados por múltiplos enteros, nunca interpolados.

## 2. Referencias

En `docs/ref/`:

| Fichero | Qué aporta |
|---|---|
| `avatar-canal.webp` | El personaje: silueta, gafas con brillo cian, paleta del rim light |
| `intro-calle.png` | **La referencia principal.** Calle nocturna con lluvia, neones, farolas |
| `twitch-directo-chat.png` | El encuadre real del reproductor y el chat |
| `twitch-webcam-juego.png` | La webcam en esquina y su relación con la escena |

El estilo objetivo es exactamente el de `intro-calle.png`.

## 3. Especificación técnica

| Parámetro | Valor |
|---|---|
| Resolución virtual de escena | **480 × 270** (16:9) |
| Escalado en pantalla | ×1, ×2, ×3, ×4 — enteros, `NEAREST`, sin antialias |
| Formato de entrega | PNG con transparencia + JSON de Aseprite |
| Animación | 2-4 frames por estado, 8-12 fps, sin interpolación |
| Paleta | **Cerrada.** La define `src/ui/theme/palette.ts`, extraída de las referencias |
| Prohibido | Degradados suaves, sombras difuminadas, antialias. Las transiciones de color van con *dithering* |

**La paleta es un límite duro, no una sugerencia.** El proyecto tiene un test que falla si aparece un color fuera de ella. Se entrega junto con este brief como fichero `.gpl` / `.ase`.

## 4. Principios de diseño visual

**Frío fuera, cálido dentro.** Es el eje de todo el juego. El neón de la calle es frío, grita y se apaga: representa el *alcance*, la gente que pasa. La luz de las ventanas es cálida y estable: representa la *comunidad*, la gente que se queda. Cualquier decisión de color debería reforzar ese contraste.

**El personaje es reconocible por silueta y setup, nunca por caricatura facial.** Está inspirado en una persona real y el tono del proyecto es de homenaje, no de parodia física.

**La escena crece por capas.** No son seis ilustraciones distintas de una habitación: es una escena que va acumulando objetos. Cada mejora que el jugador compra en el juego debe poder aparecer como una capa nueva sin rehacer el fondo.

## 5. Lotes

Ordenados por cuándo hacen falta. Cada lote es presupuestable por separado.

### L3 — Iconos · *primero*
- 8 iconos de recurso (alcance, comunidad, calidad, vida, hype, ingresos, ideas, fatiga) — **16×16**
- ~20 iconos de mejora, agrupables por familia (equipo, flujo, rutina, casa, formatos) — **16×16**
- 10 iconos de formato de contenido — **16×16**

### L5 — Chrome de interfaz · *primero*
- Marcos 9-slice: panel, panel elevado, botón normal / hover / deshabilitado
- Barra de progreso, barra de recurso
- Cursores (normal, mano)
- Insignia "en directo", insignia de verificado

### L8 — Emotes del chat
- ~12 emotes de **28×28**, estilo de emote de plataforma (gato bailando, caras de reacción, aplauso). Son nombres inventados; no se copia ningún emote existente.

### L1 — Habitación · *el lote grande*
- **6 etapas** de espacio interior, en **480×270**, construidas por capas
- ~30 objetos sueltos que aparecen al comprarse: micro, segunda pantalla, luz, silla, PC, estantería (con 3 estados de llenado), cocina, zona de ocio, plantas, gato
- Cada etapa se compone del fondo + los objetos ya comprados

### L2 — Avatar
- 5 estados: inactivo, produciendo, cansado, descansando, de vacaciones
- 2-4 frames cada uno
- Tamaño de webcam: **96×96**

### L7 — Calle (la ventana)
- Fondo de calle nocturna en **3-4 capas de parallax**
- Farolas con cono volumétrico
- Capa de lluvia en bucle
- **3 variantes de densidad** (calle vacía / normal / llena) según la fase de la partida
- Rótulos de neón encendidos y apagados

### L4 — Ilustraciones de evento
- ~12 tarjetas de **160×90**: conferencia, directo solidario, mudanza, gato, vacaciones, burnout, club de lectura, mensaje de la comunidad, y varias de vida cotidiana

### L6 — Pantallas
- Pantalla de título
- 3 pantallas de epílogo (retiro cómodo, retiro justo, seguir en la rueda)

## 6. Qué NO hay que dibujar

No hay empleados, ni editor, ni equipo. **El creador trabaja solo**: es una regla dura del diseño y afecta al arte. Ninguna escena debe mostrar a otra persona trabajando para él.

## 7. Entrega

- Un `.ase` por lote, con capas nombradas y separadas
- Sprite sheets exportados en PNG + JSON
- Los objetos de L1 en capas independientes, no aplanados sobre el fondo

## 8. Preguntas abiertas para el artista

1. ¿480×270 es cómodo, o prefieres trabajar a 320×180 y escalar?
2. ¿Los objetos de L1 pueden compartir rejilla para simplificar el montaje por capas?
3. ¿Prefieres recibir la paleta como `.gpl`, `.ase` o ambos?
4. ¿Qué lotes se pueden solapar y cuáles necesitan que el anterior esté cerrado?
