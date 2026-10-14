# Notas — 002 Fixes

## Desvíos del plan
- Ninguno en los pasos. La causa del punto 1 no se pudo confirmar en el dispositivo (ver Pendientes).

## Decisiones tomadas durante la implementación
- **FX1:** se quitó el atributo `lang` de los `<input>` de `FieldInput`; se mantiene en la vista de la carta y en el detalle. El resto del código no tiene `autoFocus`, `onBlur` ni listeners de `resize` que expliquen el parpadeo.
- **FX2:** `.split` pasa a `grid-template-columns: minmax(0, 1fr)` y sus hijos a `min-width: 0`.
- **FX3/FX4:** `useLongPress` (500 ms, tolerancia de 10 px, solo `pointerType` distinto de `mouse`). Vibra 10 ms si el dispositivo lo permite. `.item.card-row` lleva `user-select: none` y `-webkit-touch-callout: none`, y el enlace `draggable={false}`.

## Verificación
- `npm test` (399), `npm run lint` y `npm run build`: en verde. Tests nuevos: `use-long-press.test.tsx`, `FX3`/`FX4` en `selection-bulk.test.tsx`, `FX1` en `flashcard-form.test.tsx`.

## Pendientes
- **Probar en el Android del usuario (FX1):** cambiar el idioma de Gboard desde el campo Palabra de "Nueva flashcard". Si sigue parpadeando, la causa no es `lang`: depurar con `chrome://inspect` (`focus`/`blur`/`visualViewport.resize`).
- **Revisión visual a mano (FX2):** detalle de flashcard a 320, 375 y 414 px con texto largo y layout con texto XL. jsdom no aplica CSS.
- **Prueba en el celular (FX3):** la pulsación larga no debe abrir el menú contextual ni seleccionar texto; el scroll vertical no debe activarla.

## Aprendizajes
- El diálogo que parpadeaba era del teclado (Gboard), no de la app: conviene preguntar qué se ve antes de buscar en el código.
