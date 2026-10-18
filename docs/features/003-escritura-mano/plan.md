# Plan — 003 Escritura a mano

**Estado:** Terminado
**Requerimientos:** [./requerimientos.md](./requerimientos.md)

## Resumen del enfoque
"Dibujar" es un **layout virtual del sistema**: no se guarda en `Language.layouts`, tiene un id reservado (`DRAW_LAYOUT_ID`) y solo existe en idiomas cuyo código empieza con `zh` o `ja`. Así no hay migración ni cambios en Firestore: un modo de recorrida simplemente apunta a ese id. En el recorrido, la cara que usa ese layout muestra un **único `<canvas>`** con una celda guía por carácter de la palabra y los botones Deshacer, Borrar y Validar. La validación es **local y geométrica**, con los **datos de trazos de hanzi-writer** (Make Me a Hanzi / animCJK): para cada celda, un comparador propio empareja los trazos dibujados con los del carácter **sin importar orden ni dirección**, y detecta trazos faltantes, sobrantes o mal hechos.

No se usa el quiz de hanzi-writer: su `strokeMatches` (interno, no exportado) evalúa cada trazo contra el que toca según el orden, y rechaza los trazos fuera de orden. Tampoco se usa IA: puede dejar pasar errores de escritura.

## Datos de trazos
Formato común (hanzi-writer): por carácter, `strokes` (contornos SVG, sistema de 1024×1024 con el eje Y invertido) y `medians` (línea central de cada trazo, lista de puntos).

| Idioma | Caracteres | Fuente | Licencia |
|---|---|---|---|
| `zh-*` | hanzi simplificados y tradicionales | `hanzi-writer-data@2.0.1` | Arphic Public License |
| `ja-*` | kanji (formas japonesas) | `hanzi-writer-data-jp@0.0.2` (experimental) | Arphic PL + LGPL |
| `ja-*` | hiragana y katakana | animCJK `graphicsJaKana.txt` (no está en hanzi-writer-data-jp: `あ`/`ア` dan 404) | LGPL |

Las licencias exigen atribución: se agrega un apartado "Créditos" en Más.

## Impacto en la arquitectura
- **Nuevo:**
  - `lib/domain/handwriting.ts`: `DRAW_LAYOUT_ID`, `supportsHandwriting(language)`, `layoutOptions(language)` (layouts del idioma + Dibujar si corresponde), `drawableChars(word)`, resultado por carácter.
  - `lib/domain/strokes.ts`: modelo puro de trazos (agregar, deshacer, borrar, celda de cada trazo, normalización al sistema 1024×1024 de la celda).
  - `lib/domain/stroke-matching.ts`: comparador **independiente del orden y la dirección**. Matriz de compatibilidad trazo dibujado × trazo esperado (inicio/fin, dirección por segmentos, distancia de Fréchet y largo, probando ambos sentidos), asignación uno a uno y resultado `{ ok, missing[], extra[], wrong[] }`.
  - `lib/handwriting/char-data.ts`: carga de datos por carácter según el idioma, interfaz `CharDataLoader` inyectable (simulada en tests).
  - `components/flashcard/handwriting-canvas.tsx`: canvas con Pointer Events, guía de celdas, controles y marcado del resultado.
- **Modificado:**
  - `deck-rules.ts`: `hasLayout`, `describeMode` e `isModeBroken` reconocen Dibujar (un modo con Dibujar en un idioma que deja de ser zh/ja queda "roto", con el mecanismo derivado de siempre).
  - `mode-editor-dialog.tsx`: las opciones salen de `layoutOptions` (afecta mazos y modos por defecto del idioma).
  - `study-page.tsx`: la cara Dibujar renderiza el canvas en lugar de `FlashcardView`; los gestos sobre el canvas no giran la carta ni cuentan como swipe.
  - `vite.config.ts`: caché `CacheFirst` en el service worker para los datos de trazos de jsDelivr (ver pregunta 7).
- **Sin cambios pero relevante:** modelo de datos de Firestore, reglas, `FlipCard` (ya respeta `data-no-flip`), editor de layouts (Dibujar no aparece ni se puede editar ni borrar).

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `src/lib/domain/handwriting.ts` (+ `.test.ts`) | crear | Layout virtual, caracteres a dibujar, resultado |
| `src/lib/domain/strokes.ts` (+ `.test.ts`) | crear | Trazos, deshacer, borrar, normalización |
| `src/lib/domain/stroke-matching.ts` (+ `.test.ts`) | crear | Comparación sin orden ni dirección |
| `src/lib/handwriting/char-data.ts` (+ `.test.ts`) | crear | Carga de datos por idioma y parseo de animCJK |
| `src/lib/domain/deck-rules.ts` (+ `.test.ts`) | modificar | Dibujar como layout válido / roto |
| `src/components/flashcard/handwriting-canvas.tsx` (+ `.test.tsx`) | crear | Canvas, controles y marcado |
| `src/features/decks/mode-editor-dialog.tsx` | modificar | Opción Dibujar solo en zh/ja |
| `src/features/decks/handwriting-mode.test.tsx` | crear | Criterios del selector de layouts |
| `src/features/study/study-page.tsx`, `study.test.tsx` | modificar | Cara Dibujar en el recorrido |
| `src/features/more/…` | modificar | Créditos y licencias de los datos |
| `src/styles/components.css` | modificar | Estilos del canvas, celdas y resultado |
| `vite.config.ts` | modificar | Caché de los datos de trazos |
| `src/test/fixtures/strokes/*.json` | crear | Datos reales de unos pocos caracteres para los tests |

## Dependencias nuevas
- **Ninguna en `package.json`**: los datos se sirven desde jsDelivr con versión fija (`hanzi-writer-data@2.0.1`, `hanzi-writer-data-jp@0.0.2` y animCJK fijado a un commit). El comparador y el dibujo son propios; la librería `hanzi-writer` no hace falta.

## Pasos
- [x] **1. Dominio de Dibujar**
  - Qué: `handwriting.ts` y ajustes en `deck-rules.ts`.
  - Verificación: unitarias; `deck-rules.test.ts` sigue pasando.
- [x] **2. Selector de layouts con Dibujar**
  - Qué: `ModeEditorDialog` usa `layoutOptions`; `describeMode` muestra "Dibujar".
  - Verificación: test de pantalla: en zh/ja aparece Dibujar (mazo y modos por defecto); en otros idiomas no.
- [x] **3. Modelo de trazos y canvas**
  - Qué: `strokes.ts` + `HandwritingCanvas` (Pointer Events, `touch-action: none`, escala por `devicePixelRatio`, celdas guía, Deshacer y Borrar). Palabras de varios caracteres: una celda por carácter. En mobile (< 640px) las celdas van **una debajo de la otra**, ocupando el ancho disponible, y el canvas queda dentro de un contenedor con scroll vertical; como el canvas usa `touch-action: none` (si no, dibujar desplazaría la página), se deja una **franja lateral para hacer scroll con el dedo** e indicadores "Carácter 2 de 4" con botones para ir a la celda anterior/siguiente. En desktop, en fila (varias filas si no entran). Cada trazo se asigna a la celda que contiene la mayoría de sus puntos.
  - Verificación: unitarias (asignación de trazos a celdas, incluso los que cruzan un borde; distribución en filas); test del componente (deshacer quita el último trazo, borrar deja vacío, botones deshabilitados sin trazos). Prueba manual con mouse, dedo y lápiz.
- [x] **4. Datos de trazos**
  - Qué: `CharDataLoader` por idioma (zh, ja-kanji, ja-kana), caché y manejo de caracteres sin datos.
  - Verificación: unitarias con fixtures; prueba manual de carga y de uso sin conexión.
- [x] **5. Comparador sin orden ni dirección**
  - Qué: `stroke-matching.ts`. Los tests usan las medians reales como "trazos dibujados", con ruido, en otro orden, invertidos, con uno de menos, uno de más y uno de otro carácter.
  - Verificación: unitarias; calibración manual de tolerancias con escritura real (mouse y dedo) anotada en `notas.md`.
- [x] **6. Validación y marcado**
  - Qué: botón Validar; por celda, correcto/incorrecto; marcado de los trazos con error (pregunta 5); mensaje "¡Correcto!" si todo está bien.
  - Verificación: test del componente con loader simulado.
- [x] **7. Integración en el recorrido**
  - Qué: cara Dibujar en `StudyPage`; el canvas no gira la carta ni dispara el swipe; al cambiar de carta se limpia.
  - Verificación: `study.test.tsx`; prueba manual en mobile.
- [x] **8. Cierre**
  - Qué: créditos, lint, tests, build; `arquitectura.md`, ADR 0006 (layout virtual + validación geométrica local), `notas.md`.
  - Verificación: `npm run lint`, `npm test`, `npm run build`.

## Cobertura de criterios de aceptación
Los tests nombran los criterios E1–E8, en el orden de los ítems de `requerimientos.md`.

| Criterio | Paso(s) | Cómo se verifica |
|---|---|---|
| Dibujar disponible como layout extra solo en chino/japonés | 1, 2 | `handwriting.test.ts`, `handwriting-mode.test.tsx` |
| Layout con un único canvas a mano alzada | 3, 7 | `handwriting-canvas.test.tsx`, `study.test.tsx`, manual |
| Botón para deshacer trazo a trazo | 3 | `strokes.test.ts`, `handwriting-canvas.test.tsx` |
| Botón para borrar todo | 3 | `strokes.test.ts`, `handwriting-canvas.test.tsx` |
| Botón para validar contra la palabra | 6 | `handwriting-canvas.test.tsx` |
| Comparación carácter por carácter, sin orden ni dirección de trazos | 5 | `stroke-matching.test.ts` (trazos permutados e invertidos) |
| Errores marcados claramente | 6 | `handwriting-canvas.test.tsx` |
| Indicación de "correcto" sin errores | 6 | `handwriting-canvas.test.tsx` |

## Riesgos y alternativas descartadas
- **Riesgo:** tolerancia mal calibrada (demasiado estricta con el dedo en mobile o demasiado permisiva). → **Mitigación:** umbrales en constantes, tests con ruido y calibración manual en desktop y mobile.
- **Riesgo:** dos trazos casi iguales (p. ej. los horizontales de 三) se asignan cruzados. → **Mitigación:** asignación global (minimiza el costo total), no greedy por trazo.
- **Riesgo:** un trazo continuo que en el estándar son dos (o al revés, p. ej. 口 hecho en dos o tres trazos). → **Mitigación:** cuenta como error, que es lo correcto para practicar escritura. Se documenta.
- **Riesgo:** los datos japoneses de kanji son experimentales y pueden faltar caracteres o tener formas chinas. → **Mitigación:** carácter sin datos = celda "no se puede validar" (pregunta 6); prueba manual con un set de palabras japonesas.
- **Riesgo:** palabras largas (chengyu, palabras japonesas de 4–6 caracteres) dejan celdas muy chicas en mobile. → **Mitigación:** en mobile, celdas apiladas con scroll vertical; cada celda se valida de forma independiente.
- **Riesgo:** en mobile, dibujar y hacer scroll compiten por el mismo gesto. → **Mitigación:** franja lateral de scroll fuera del área de dibujo y botones anterior/siguiente celda.
- **Riesgo:** con Dibujar en el frente, tocar el canvas no debe girar la carta. → **Mitigación:** `data-no-flip` en el área de dibujo; se gira con el botón Girar o tocando fuera del canvas.
- **Riesgo:** licencias Arphic/LGPL. → **Mitigación:** se usan solo los datos (no se modifica código LGPL) con atribución visible.
- **Alternativa descartada:** quiz de `hanzi-writer` → **Por qué:** exige el orden de los trazos y su matcher no se exporta.
- **Alternativa descartada:** Gemini/IA → **Por qué:** puede dejar pasar errores de escritura (decisión del usuario).
- **Alternativa descartada:** reconocedor local por imagen (WASM/modelo) → **Por qué:** pesado, reconoce el carácter "parecido" en lugar de verificar trazos, y cubre mal el kana.
- **Alternativa descartada:** guardar Dibujar como layout real en cada idioma → **Por qué:** requiere migrar idiomas y se podría editar o borrar.

## Preguntas abiertas
Resueltas el 2026-10-18:
1. **Cara:** Dibujar se elige como cualquier otro layout, **en el frente o en el reverso** (también en los dos).
2. **"Agregar uno más":** es **una opción más en el selector de layouts** del modo (mazos y modos por defecto del idioma). No se crean modos automáticamente.
3. **Celdas:** una celda guía por carácter (estilo 田字格) dentro de un único canvas. **En mobile, una debajo de la otra** con scroll vertical, para que cada celda tenga un área de dibujo grande. En desktop, en fila (y varias filas si no entran).
4. **Qué se valida:** el campo **Palabra**. Espacios, puntuación, letras latinas y números se ignoran. Kanji y kana se validan igual.
5. **Marcado:** celda con error con borde rojo; trazos propios mal hechos o sobrantes en rojo; **trazos faltantes punteados en rojo** en su lugar. Sin errores: celdas en verde y "¡Correcto!".
6. **Carácter sin datos:** la celda se muestra como "no se puede validar" y no cuenta como error.
7. **Datos:** **CDN jsDelivr con versión fija**, con caché en el service worker (`CacheFirst`, sin vencimiento corto) para no volver a descargar los trazos ya usados. Al empezar un recorrido con Dibujar se precargan los caracteres del mazo.

## Al terminar
- [x] Todos los criterios de aceptación verificados: tests automatizados, más la prueba manual del usuario con mouse en desktop y en mobile. Quedan dos pruebas manuales menores en `notas.md`: sin conexión y puntos cortos al tocar para borrar.
- [x] Tests, lint y build pasan. Los dos tests intermitentes ya existían, ver notas.
- [x] `docs/arquitectura.md` actualizado
- [x] ADR creado si corresponde (0006)
- [x] `notas.md` completado
