# Plan — 001 Mejoras

**Estado:** Terminado (aprobado 2026-10-13 con los supuestos de las preguntas abiertas; falta solo la revisión visual a mano, ver `notas.md`)
**Requerimientos:** [./requerimientos.md](./requerimientos.md)

## Resumen del enfoque
Son nueve mejoras independientes sobre pantallas ya existentes; se implementan una por paso, de modo que la app quede funcionando después de cada una. La lógica nueva (orden, paginación, renombrado de tags, modos por defecto) va como funciones puras en `src/lib/domain/`, con tests unitarios, y las pantallas solo la consumen. Los cambios de datos son mínimos y compatibles hacia atrás: `Deck.createdAt` y `Language.defaultModes` son campos opcionales, así que los documentos existentes siguen siendo válidos y no hace falta migración. Las dos mejoras de "compactar en mobile" son principalmente CSS más un ajuste de marcado.

Los requerimientos no traen criterios de aceptación numerados; este plan los deriva (`MJ1`…`MJ9`, uno por ítem, ver tabla al final) para poder escribir los tests. **Hay que confirmarlos junto con las preguntas abiertas.**

## Impacto en la arquitectura
- **Nuevo:**
  - `lib/domain/list-view.ts`: orden por fecha de creación y paginación (funciones puras).
  - `components/ui/pagination.tsx`: control `1 2 3 … 5` accesible.
  - `lib/theme.ts` ampliado: preferencia `system | light | dark` (en `localStorage`, clave `hm:theme`).
  - `features/more/theme-selector.tsx`: selector de tema.
  - `features/languages/default-modes-panel.tsx`: pestaña "Recorridas" del editor de idioma.
  - `features/flashcards/delete-selection-dialog.tsx`: confirmación de borrado masivo.
  - ADR 0005: modos de recorrida por defecto a nivel de idioma.
- **Modificado:**
  - Modelo: `Deck.createdAt?: number` y `Language.defaultModes?: TraversalMode[]`.
  - `FlashcardRepository.removeMany(ids)`; `LanguageChanges.renamedTags`.
  - `cascades.ts` (renombrar un tag se propaga a las flashcards).
  - `FlashcardView` (campos de lista, un elemento por línea), `FlashcardRow`, `DeckCard` (versión compacta mobile).
  - Pantallas: listados de flashcards y mazos, `SelectionBar`, `MorePage`, `TagsPanel`, `LanguageEditorPage`, `DeckFormPage`.
- **Sin cambios pero relevante:** reglas de Firestore (los campos nuevos no necesitan reglas nuevas), `getDeckStatus` (mazo "no disponible" derivado, ADR 0002), `addTag` (se reutiliza para validar el renombrado).

## Archivos
| Archivo | Acción | Motivo |
|---|---|---|
| `src/lib/types.ts` | modificar | `Deck.createdAt?`, `Language.defaultModes?` |
| `src/lib/domain/list-view.ts` (+ test) | crear | orden por `createdAt` y paginación |
| `src/components/ui/pagination.tsx` (+ test) | crear | paginador numerado |
| `src/features/flashcards/flashcards-page.tsx` | modificar | orden, paginación (reemplaza "Mostrar más"), borrado masivo |
| `src/features/decks/decks-page.tsx` | modificar | orden y paginación |
| `src/features/decks/deck-form-page.tsx` | modificar | guardar `createdAt`; precargar modos por defecto en mazos nuevos |
| `src/lib/theme.ts` (+ test), `src/main.tsx` | modificar | preferencia de tema persistida |
| `src/features/more/more-page.tsx`, `src/features/more/theme-selector.tsx` | modificar / crear | selector de tema |
| `src/components/layout/sidebar.tsx` | modificar | selector de tema en desktop (ver pregunta 3) |
| `src/features/languages/default-modes-panel.tsx` | crear | modos por defecto del idioma (reutiliza `ModeEditorDialog`) |
| `src/features/languages/language-editor-page.tsx` | modificar | pestaña "Recorridas", estado y guardado de `defaultModes` |
| `src/features/decks/mode-editor-dialog.tsx` | modificar | quedar reutilizable fuera del formulario de mazo (si hace falta) |
| `src/lib/domain/deck-rules.ts` (+ test) | modificar | `modesFromDefaults(language)`: copia con ids nuevos, omite los rotos |
| `src/features/languages/tags-panel.tsx` | modificar | editar (renombrar) tags |
| `src/features/languages/language-editor-page.tsx` | modificar | calcular `renamedTags` al guardar |
| `src/lib/domain/field-rules.ts` (+ test) | modificar | `renameTag(tags, from, to)` con validación |
| `src/lib/domain/cascades.ts` (+ test) | modificar | aplicar renombrados a las flashcards |
| `src/lib/repositories/{types,firestore-language-repository,firestore-flashcard-repository,memory-repositories}.ts` | modificar | `renamedTags` y `removeMany` |
| `src/features/flashcards/selection-bar.tsx` | modificar | botón "Eliminar" |
| `src/features/flashcards/delete-selection-dialog.tsx` | crear | confirmación con la cantidad |
| `src/components/flashcard/flashcard-view.tsx` (+ test) | modificar | listas en columna |
| `src/features/flashcards/flashcard-row.tsx`, `src/features/decks/deck-card.tsx` | modificar | marcado compacto mobile |
| `src/styles/components.css` | modificar | estilos compactos < 640px, paginador, listas |
| `tests/rules/firestore.rules.test.ts` | modificar | un caso con `createdAt`/`defaultModes` (documentos válidos) |
| `docs/arquitectura.md`, `docs/decisiones/0005-modos-por-defecto-del-idioma.md`, `docs/features/001-mejoras/notas.md` | modificar / crear | cierre de la iteración |

## Dependencias nuevas
- Ninguna (el paginador y el selector de tema son componentes propios).

## Pasos
- [x] **1. Orden por fecha de creación (MJ1)**
  - Qué: `Deck.createdAt?` (se asigna al crear y se conserva al editar). `list-view.ts` con `sortByCreated(items, 'desc' | 'asc')`; los mazos sin `createdAt` cuentan como los más antiguos. Selector de orden en la barra de herramientas de ambos listados, reflejado en la URL (`?orden=`).
  - Verificación: tests unitarios del orden (incluye mazos sin fecha) y de pantalla en ambos listados.
- [x] **2. Paginación numerada (MJ2)**
  - Qué: `paginate(items, page, size)` y componente `Pagination` (`1 2 3 … 5`, anterior/siguiente, `aria-current`). Reemplaza "Mostrar más" en flashcards y se agrega a mazos. Página en la URL (`?pagina=`); vuelve a 1 al cambiar búsqueda, tag, idioma u orden; una página fuera de rango se corrige a la última.
  - Verificación: tests de `paginate`, del componente y de ambos listados (cambio de página, reinicio al filtrar).
- [x] **3. Tema claro / oscuro / sistema (MJ3)**
  - Qué: `theme.ts` guarda la preferencia (con `try/catch` por si `localStorage` falla), la aplica al arrancar y sigue al sistema solo en modo "sistema". `ThemeSelector` (control segmentado) en Más.
  - Verificación: tests de `theme.ts` (`matchMedia` simulado) y de la pantalla Más; prueba manual de que persiste al recargar.
- [x] **4. Layouts: campos de lista en columna (MJ5)**
  - Qué: en `FlashcardView`, un campo `list` se dibuja con un elemento por línea (en vez de unidos por coma). El resto de campos queda igual. Se revisa el desborde cuando hay más líneas que filas de la grilla.
  - Verificación: test de `FlashcardView` (lista de 3 elementos → 3 líneas); prueba manual en el recorrido y en la vista previa del editor de layouts.
- [x] **5. Editar tags del idioma (MJ7)**
  - Qué: `renameTag` (valida vacío y duplicados con las reglas de `addTag`), botón de edición por tag en `TagsPanel` (edición en línea). El guardado calcula `renamedTags`; el repositorio y `cascades.ts` actualizan los tags de las flashcards en el mismo lote.
  - Verificación: tests de `renameTag`, de la cascada y de la pantalla (renombrar → la flashcard conserva el tag con el nuevo nombre; error si ya existe).
- [x] **6. Eliminar la selección múltiple (MJ6)**
  - Qué: botón "Eliminar" en `SelectionBar` (deshabilitado sin selección), diálogo de confirmación con la cantidad (`role="alertdialog"`), y `FlashcardRepository.removeMany` (una consulta de mazos y escritura por lotes). Tras borrar se sale del modo selección y se avisa con un toast.
  - Verificación: tests de pantalla (cancelar no borra; confirmar borra y quita las cartas de sus mazos) y del repositorio en memoria.
- [x] **7. Modos de recorrida por defecto del idioma (MJ4)**
  - Qué: `Language.defaultModes?`. Pestaña "Recorridas" en el editor de idioma (alta, edición y borrado, con `ModeEditorDialog`). Al crear un mazo nuevo, los modos se precargan como **copias** con ids nuevos (omitiendo los que apuntan a layouts eliminados); en el mazo se editan o borran libremente. Cambiar los defaults no toca los mazos existentes. ADR 0005.
  - Verificación: tests de `modesFromDefaults` y de pantalla (mazo nuevo trae los modos; editar uno en el mazo no cambia el idioma; mazo existente intacto).
- [x] **8. Lista de flashcards compacta en mobile (MJ8)**
  - Qué: por debajo de 1024px cada fila muestra solo palabra y traducción, con fuente más chica y menos relleno; el campo secundario y los tags dejan de verse (siguen en desktop y en el detalle).
  - Verificación: test de la fila (contenido) + revisión manual a 375px y horizontal; se vuelve a pasar el chequeo de contraste y de objetivo táctil (≥ 44px de alto cuando es una fila tocable).
- [x] **9. Lista de mazos compacta en mobile (MJ9)**
  - Qué: por debajo de 640px `DeckCard` es una sola fila: nombre, botón de configuración y botón Estudiar (ícono + texto corto). Se ocultan contador y badges; un mazo "no disponible" conserva un indicador mínimo.
  - Verificación: test de la tarjeta y revisión manual a 375px.
- [x] **10. Cierre**
  - Qué: `docs/arquitectura.md` (modelo, tema, paginación), ADR 0005, `notas.md`, despliegue a Hosting si lo apruebas.
  - Verificación: `npm test`, `npm run test:rules`, lint y build en verde.

## Cobertura de criterios de aceptación
| Criterio (derivado) | Paso | Cómo se verifica |
|---|---|---|
| MJ1 · Ambos listados se ordenan por fecha de creación (más recientes / más antiguas) | 1 | tests `MJ1-*` |
| MJ2 · Ambos listados muestran paginación numerada y cambian de página | 2 | tests `MJ2-*` |
| MJ3 · En Más se elige claro, oscuro o sistema; se recuerda | 3 | tests `MJ3-*` + manual |
| MJ4 · El idioma define modos por defecto que se copian a los mazos nuevos y se editan por mazo | 7 | tests `MJ4-*` |
| MJ5 · Los campos de lista se ven un elemento por línea en los layouts | 4 | tests `MJ5-*` + manual |
| MJ6 · En selección múltiple se eliminan las flashcards elegidas, con confirmación | 6 | tests `MJ6-*` |
| MJ7 · Los tags del idioma se pueden editar (renombrar) y se actualizan en las flashcards | 5 | tests `MJ7-*` |
| MJ8 · En mobile cada flashcard del listado muestra palabra y traducción, más compacta | 8 | test `MJ8-*` + manual 375px |
| MJ9 · En mobile cada mazo del listado muestra nombre, configuración y estudiar | 9 | test `MJ9-*` + manual 375px |

## Riesgos y alternativas descartadas
- **Riesgo:** los mazos existentes no tienen `createdAt`. → **Mitigación:** se tratan como los más antiguos y no se migra; al editarlos no se inventa una fecha. Si quieres un orden real para los actuales, habría que fijarlo a mano.
- **Riesgo:** una lista larga puede desbordar su celda en la grilla del layout. → **Mitigación:** revisar con el tamaño de texto del layout y permitir que la celda crezca/desplace; verificado a mano.
- **Riesgo:** renombrar un tag no es atómico si hay más de un lote (misma limitación que ADR 0002). → **Mitigación:** se asume por el volumen; el renombrado es idempotente, repetirlo repara.
- **Alternativa descartada:** guardar el tema en Firestore. → **Por qué:** es una preferencia del dispositivo y evita una escritura y una carga inicial; ver pregunta 3.
- **Alternativa descartada:** que los mazos referencien los modos por defecto en vez de copiarlos. → **Por qué:** el requerimiento pide poder editarlos y borrarlos por mazo, y una referencia haría que editar el idioma cambie mazos ya armados.
- **Alternativa descartada:** paginar en el servidor. → **Por qué:** las flashcards ya se suscriben completas (ADR 0002); se pagina en memoria.

## Preguntas abiertas
1. **Orden:** ¿orden por defecto "más recientes primero" y el usuario puede invertirlo? ¿Se mantiene la búsqueda actual junto con el orden? (Supuesto: sí a ambas.)
2. **Paginación:** ¿tamaños de página 50 flashcards y 12 mazos? ¿Se elimina el botón "Mostrar más"? (Supuesto: sí.)
3. **Tema:** (a) ¿se guarda solo en el dispositivo (`localStorage`) o en la cuenta? (b) "Más" solo existe en mobile y en desktop redirige a Flashcards: ¿agrego también el selector al sidebar de desktop? (Supuesto: dispositivo + selector en el sidebar.)
4. **Modos por defecto:** ¿solo aplican a mazos **nuevos** (no cambian los existentes)? ¿Si se elimina un layout usado por un modo por defecto, ese modo se marca como roto en el idioma y se omite al crear mazos? (Supuesto: sí a ambas.)
5. **Eliminar la selección:** ¿alcanza con la confirmación, o también quieres "Deshacer" en el toast como en la edición masiva? El modo de selección existe solo en Flashcards; ¿los mazos no lo necesitan? (Supuesto: solo confirmación, y solo flashcards.)
6. **Renombrar tag:** si el nuevo nombre ya existe, ¿se bloquea con error o se fusionan los dos tags? (Supuesto: se bloquea.)
7. **Mazo compacto en mobile:** un mazo "no disponible" necesita seguir viéndose como tal; ¿vale un ícono de advertencia junto al nombre y el botón Estudiar deshabilitado? (Supuesto: sí.)
8. **Criterios de aceptación:** ¿confirmas los `MJ1`…`MJ9` de arriba como criterios de la iteración?

## Al terminar
- [x] Todos los criterios de aceptación verificados
- [x] Tests y lint pasan
- [x] `docs/arquitectura.md` actualizado
- [x] ADR creado si corresponde
- [x] `notas.md` completado
