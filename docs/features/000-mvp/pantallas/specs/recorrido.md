# Specs · Recorrido de mazo (R01–R03)

Convenciones: ver [../README.md](../README.md). Es la pantalla donde el usuario pasa más tiempo: priorizar fluidez y cero distracciones.

- **Ruta:** `/mazos/:id/estudiar?modo=<id>` (privada, **fuera del shell**: sin sidebar ni bottom nav)
- **Mockups:** `r01-recorrido.html` (frente) · `?side=back` (R02) · `?end=1` (R03)
- **Forma de aprendizaje MVP: "Libre"** — el orden es aleatorio (se mezcla al empezar y al "volver a mezclar") y **no se registra** si el usuario acertó.

---

## R01 · Frente de la carta

### Estructura
- **Barra superior:** ✕ salir (izquierda) · nombre del mazo y "{modo} · Libre" (centro) · contador "1 / 12" (derecha, `aria-live="polite"`).
- **Barra de progreso** fina (`role="progressbar"`, `aria-valuenow`).
- **Carta** (`FlipCard`): centrada; en mobile proporción 3:4 (máx. 62% del alto de pantalla), en desktop 4:3 (máx. 720px de ancho). Renderiza el **layout del frente** del modo elegido con `FlashcardView`. En el mockup: hanzi enorme `clamp(72px, 22vw, 140px)` + pinyin.
  - **Ícono de audio** (`TtsButton`, 48px) en la esquina superior derecha de la carta **solo si** algún campo mostrado en esa cara tiene `tts` habilitado; al tocarlo reproduce ese campo **sin girar la carta**. Si hay varios campos con TTS, cada uno lleva su propio botón junto al campo.
- **Ayuda** (texto pequeño): mobile "Toca la carta para girarla · desliza para avanzar"; desktop "Clic o Espacio para girar · ← → para navegar · Esc para salir".
- **Controles inferiores** (siempre visibles): botón circular ← anterior (deshabilitado en la primera), botón **Girar**, botón circular → siguiente.

### Interacciones
| Acción | Mobile | Desktop |
|---|---|---|
| Girar | Tap en la carta o botón *Girar* | Clic en la carta, `Espacio`/`Enter` o botón *Girar* |
| Siguiente | Swipe a la izquierda o botón → | `→` o clic en el botón → |
| Anterior | Swipe a la derecha o botón ← | `←` o clic en el botón ← |
| Salir | ✕ | ✕ o `Esc` |
| Audio | Tap en el ícono de altavoz | Clic en el ícono |

- Al pasar a otra carta, esta **siempre se muestra por el frente** (sin animación de giro de regreso).
- Umbral de swipe ≈ 60px horizontal; el scroll vertical no se ve afectado (`touch-action: pan-y`); se evita colisión con el gesto "atrás" del sistema dejando 16px de margen lateral.
- Giro: `rotateY` 380ms (con `prefers-reduced-motion`: cambio inmediato).
- Los gestos se ignoran mientras haya un diálogo abierto.

---

## R02 · Reverso de la carta

- Es la misma pantalla con la carta girada, mostrando el **layout del reverso** del modo (en el mockup: traducción grande, ejemplo con su ícono de audio, tags).
- Mismos controles. Girar de nuevo vuelve al frente. El `aria-label` de la carta cambia ("Carta. Tocar para girar. Mostrando reverso").

---

## R03 · Fin del mazo

- Se muestra como diálogo (hoja inferior en mobile / centrado en desktop) al intentar avanzar desde la **última** carta (la 12/12).
- Contenido: ícono de éxito, "¡Terminaste el mazo!", "Recorriste las N flashcards de «{mazo}»".
- Acciones: **Volver a mezclar** (primario; reinicia con un nuevo orden aleatorio en el mismo modo) · **Salir** (→ `/mazos`).
- No se cierra tocando el fondo ni con `Esc` (debe elegirse una opción); el foco inicial va a *Volver a mezclar*.

### Salir en cualquier momento
- ✕ / `Esc` abre un diálogo de confirmación: "¿Salir del recorrido? No se guarda el avance…" con **Seguir estudiando** y **Salir**. (Dado que el modo Libre no registra nada, la confirmación puede omitirse si el usuario lo prefiere — *decisión a confirmar*.)

## Estados especiales
| Estado | Presentación |
|---|---|
| Cargando mazo | Carta con `Skeleton`; controles deshabilitados |
| Mazo de 1 carta | Siguiente lleva directo a R03 |
| Error al cargar | Pantalla con `Alert err` y *Reintentar* / *Salir* |
| Sin voz disponible para TTS | El botón queda visible pero muestra toast "Tu dispositivo no tiene voz para este idioma" |

## Criterios de aceptación
- **R01-1** Al comenzar, las cartas del mazo se recorren en orden aleatorio y se muestra el frente de la primera con su layout de frente.
- **R01-2** Un clic/tap en la carta la gira y muestra el layout del reverso; otro la devuelve al frente.
- **R01-3** En PC, `→` y `←` navegan; también hay botones en pantalla que hacen lo mismo.
- **R01-4** En mobile, swipe a izquierda avanza y a derecha retrocede; también hay botones.
- **R01-5** Cada carta nueva se muestra por el frente; el contador y la barra de progreso se actualizan.
- **R01-6** Los campos mostrados con TTS habilitado tienen un ícono de audio que, al hacer clic/tap, reproduce el texto sin girar la carta; los campos sin TTS no lo muestran.
- **R01-7** *Salir* (✕/`Esc`) permite abandonar el recorrido en cualquier momento.
- **R02-1** El reverso muestra exactamente los campos/posiciones/tamaños del layout de reverso del modo elegido.
- **R03-1** Al terminar la última carta se pregunta si volver a mezclar o salir.
- **R03-2** *Volver a mezclar* reinicia el recorrido con un orden distinto; *Salir* vuelve a la lista de mazos.
- **R01-8** La carta es operable con teclado (foco visible, Enter/Espacio) y anuncia la cara visible a lectores de pantalla; respeta `prefers-reduced-motion`.
- **R01-9** El tamaño del hanzi se adapta al viewport sin desbordar en 375px de ancho ni en landscape.
