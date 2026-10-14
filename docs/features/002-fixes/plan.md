# Plan — 002 Fixes

**Estado:** En curso (pendiente la prueba manual en Android)
**Requerimientos:** [./requerimientos.md](./requerimientos.md)

## Resumen del enfoque
Tres cambios independientes y chicos. (1) El selector de idioma de Gboard (Android) parpadea al cambiarlo desde el campo Palabra del formulario de nueva flashcard: no es un diálogo de la app, así que hay que ver qué de la página altera el foco o el viewport mientras está abierto (sospecha principal: el atributo `lang` del input) y confirmarlo en el dispositivo antes de dar el arreglo por bueno. (2) El detalle de la flashcard se sale de la pantalla en mobile: la grilla `.split` tiene una sola columna implícita (`auto`), y sus hijos tienen `min-width: auto`, así que el contenido de la vista previa (texto XL, `white-space`, `overflow-wrap`) la ensancha; se fija con `minmax(0, 1fr)` y `min-width: 0`. (3) Pulsación larga sobre una fila de flashcard entra al modo de selección ya existente (F02) con esa fila marcada; se implementa como un hook de gesto reutilizable y no cambia el modelo de datos.

## Impacto en la arquitectura
- **Nuevo:** `src/lib/hooks/use-long-press.ts` (gesto de pulsación larga, sin dependencias).
- **Modificado:** `flashcard-row.tsx` (usa el hook y evita la navegación tras una pulsación larga), `flashcards-page.tsx` (entrada al modo selección con una carta preseleccionada), `components.css` (`.split` en mobile; `user-select`/`-webkit-touch-callout` en filas), y según la causa, `field-input.tsx`.
- **Sin cambios pero relevante:** modelo de datos, reglas de Firestore, modo de selección (`SelectionBar`, borrado y edición masivos).

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `src/lib/hooks/use-long-press.ts` | crear | Detecta pulsación larga (~500 ms), cancela si el dedo se mueve > 10 px o hay scroll. |
| `src/lib/hooks/use-long-press.test.ts` | crear | Tests del hook con timers falsos. |
| `src/features/flashcards/flashcard-row.tsx` | modificar | Prop `onLongPress`; suprime el clic/navegación posterior; bloquea el menú contextual del navegador. |
| `src/features/flashcards/flashcards-page.tsx` | modificar | `startSelecting(id?)`: entra en modo selección y marca la carta. |
| `src/styles/components.css` | modificar | `.split` → `grid-template-columns: minmax(0, 1fr)` y `.split > * { min-width: 0 }`; `user-select: none` en `.item.card-row`. |
| `src/features/flashcards/flashcard-detail.test.tsx` | modificar | Test de regresión posible solo a nivel de marcado; la comprobación real es visual. |
| `src/features/flashcards/flashcards-list.test.tsx` / `selection-bulk.test.tsx` | modificar | Tests de la pulsación larga. |
| `src/components/flashcard/field-input.tsx` | modificar (según causa) | Ver paso 1 (atributo `lang` del input). |

## Dependencias nuevas
- Ninguna

## Pasos
- [x] **1. Diagnosticar el parpadeo del selector de idioma del teclado (Gboard)**
  - Qué: el diálogo no es de la app: es el selector de idioma de Gboard sobre el campo Palabra del formulario de nueva flashcard (Android). Parpadea cuando algo cambia el foco o la pantalla de la página mientras está abierto. Sospechas, por orden: (a) el atributo `lang` del `<input>` (`field-input.tsx:43`, p. ej. `zh`/`ja`): Android/Chrome lo usa como pista del IME y puede forzar un cambio de idioma al enfocar, reabriendo el selector; (b) un re-render que remonta o refocaliza el input (se descarta: no hay `autoFocus` ni `onBlur`, y el único `.focus()` solo corre con errores de validación); (c) cambios de alto del viewport (`dvh`) que reacomodan la página. Reproducir con depuración remota de Chrome (`chrome://inspect`) registrando `focus`/`blur`/`resize`/`visualViewport`, y probar quitando `lang` del input (y dejándolo solo en `FlashcardView`/detalle).
  - Verificación: prueba manual en el Android del usuario; test que compruebe que el input de la palabra no se remonta ni pierde el foco al re-renderizar. La causa real se anota en `notas.md`.
- [x] **2. Arreglar el desborde del detalle de flashcard**
  - Qué: CSS de `.split` en una columna con `minmax(0, 1fr)` y `min-width: 0` en sus hijos; revisar que `.flip` y la tarjeta "Campos" respeten el ancho (`overflow-wrap: anywhere` en los valores largos).
  - Verificación: prueba manual a 320, 375 y 414 px con una carta de texto largo y layout con texto XL; sin scroll horizontal.
- [x] **3. Hook `useLongPress`**
  - Qué: `onPointerDown/Up/Move/Cancel/Leave`, temporizador de 500 ms, tolerancia de movimiento; devuelve props para esparcir en el elemento y un indicador de "disparó" para anular el clic posterior. Solo `pointerType` táctil o lápiz; con mouse no se activa (ahí ya existe el botón Seleccionar).
  - Verificación: tests unitarios (dispara a los 500 ms, no dispara si se suelta antes, ni si se mueve).
- [x] **4. Entrar al modo selección con pulsación larga**
  - Qué: `FlashcardRow` recibe `onLongPress`; en modo normal la pulsación larga llama a `startSelecting(card.id)`, que activa `selecting` y deja esa carta seleccionada; el clic que sigue no navega. Vibración corta opcional con `navigator.vibrate?.(10)`. En modo selección la pulsación larga no hace nada extra (el toque ya alterna).
  - Verificación: tests de pantalla (la pulsación larga activa la barra de selección con "1" seleccionada y no navega al detalle; un toque corto sigue abriendo el detalle).
- [x] **5. Cierre**
  - Qué: `npm test`, `npm run lint`, `npm run build`; actualizar `docs/arquitectura.md` (gesto de pulsación larga en el listado); completar `notas.md`.
  - Verificación: todo en verde.

## Cobertura de criterios de aceptación
Los requerimientos no traen criterios formales; se proponen estos (a confirmar al aprobar el plan).
| Criterio | Paso(s) | Cómo se verifica |
|---|---|---|
| FX1 · Cambiar el idioma del teclado (Gboard) en el campo Palabra no hace parpadear su selector | 1 | test `FX1-*` + prueba manual en Android |
| FX2 · El detalle de la flashcard no genera scroll horizontal en 320–414 px | 2 | prueba manual (jsdom no aplica CSS) |
| FX3 · Mantener apretada una fila (touch) entra en modo selección con esa carta marcada | 3, 4 | test `FX3-*` |
| FX4 · Un toque corto sigue abriendo el detalle; tras una pulsación larga no se navega | 4 | test `FX4-*` |
| FX5 · Una vez en modo selección, el flujo existente (editar, eliminar, crear mazo, cancelar) funciona igual | 4 | tests existentes de `selection-bulk` |

## Riesgos y alternativas descartadas
- **Riesgo:** la pulsación larga en mobile dispara el menú contextual / selección de texto del navegador → **Mitigación:** `onContextMenu` con `preventDefault` y `user-select: none` en la fila.
- **Riesgo:** el scroll vertical se confunde con pulsación larga → **Mitigación:** cancelar si el puntero se mueve más de 10 px (y por `pointercancel`).
- **Riesgo:** no se pudo reproducir el punto 1 → **Mitigación:** no adivinar; pedir el dato (ver preguntas).
- **Alternativa descartada:** agregar una librería de gestos → **Por qué:** es un gesto simple y no se agregan dependencias sin necesidad.
- **Alternativa descartada:** pulsación larga también con mouse → **Por qué:** en desktop ya existe el botón "Seleccionar" y la pulsación con mouse se confunde con arrastre.

## Preguntas abiertas
Resueltas (2026-10-13): el punto 1 es el selector de idioma de Gboard en Android, en el campo Palabra del formulario de nueva flashcard; la pulsación larga es solo para Flashcards y solo touch.
- Queda pendiente (no bloquea los pasos 2 a 5): que el usuario pruebe en su celular el arreglo del paso 1; no se puede reproducir desde jsdom.

## Al terminar
- [ ] Todos los criterios de aceptación verificados
- [x] Tests y lint pasan
- [x] `docs/arquitectura.md` actualizado
- [ ] ADR creado si corresponde (no se espera)
- [x] `notas.md` completado
