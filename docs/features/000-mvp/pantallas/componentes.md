# Catálogo de componentes

Componentes reutilizables detectados en los mockups. Convención del proyecto: PascalCase, un componente por archivo, archivos en kebab-case (`src/components/…`), lógica en `src/lib/`. La columna *Clases* indica dónde ver el estilo de referencia en `mockups/assets/styles.css`.

## Estructura

| Componente | Descripción | Props sugeridas | Clases / usado en |
|---|---|---|---|
| `AppShell` | Layout con `Sidebar` (desktop) o `BottomNav` (mobile) + `<main>` | `children` | `.sidebar`, `.bottom-nav` · todas las pantallas A* excluidas y R* |
| `PushScreen` | Variante del shell para pantallas hijas: sin bottom nav, con `TopBar` | `title`, `backTo`, `actions` | `.topbar`, `body.push` · F03, F04, F05, M02, M03, I01, I02, I04 |
| `PageHeader` | Título + `LanguageSelector` + acciones | `title`, `actions`, `showLanguage` | `.page-head` · F01, M01 |
| `Sidebar` / `BottomNav` | Navegación primaria | `active` | `.sidebar`, `.bottom-nav` |
| `LanguageSelector` | Chip + listbox del idioma activo; incluye enlace "Administrar idiomas" | — (usa contexto) | `.lang-chip`, `.popover` · F01, M01 |
| `StudyScreen` | Marco de pantalla completa del recorrido | `deck`, `mode` | `.study` · R01–R03 |

## Controles

| Componente | Variantes / estados | Notas |
|---|---|---|
| `Button` | `primary`, `secondary`, `ghost`, `danger`, `danger-ghost`, `ai`; `lg`; `block`; `loading`; `disabled` | Alto mínimo 44px. `loading` deshabilita y muestra spinner. `.btn-*` |
| `IconButton` | 44×44, `aria-label` obligatorio | `.icon-btn` |
| `Fab` | Solo mobile, sobre el bottom nav | `.fab` |
| `TextField` / `TextArea` / `Select` | `label`, `required`, `optional`, `helper`, `error`, `readOnly`, `lang` | Label siempre visible; error con `aria-describedby`. `.field`, `.input` |
| `SearchField` | Píldora con lupa; filtra en vivo (debounce 200ms) | `.search` |
| `Switch` | `role="switch"`, 48×28 | `.switch` |
| `SegmentedControl` | 2–4 opciones excluyentes, `aria-pressed` | `.seg` |
| `Chip` | `toggle` (filtro/tag seleccionable), `static`, `removable` | `.chip`, alto 40px si es accionable |
| `Tag` | Etiqueta de solo lectura de una flashcard | `.tag` |
| `Badge` | Estado compacto (`ok`, `warn`, `err`, neutro) con ícono opcional | `.badge` |
| `TagPicker` | Chips seleccionables del set del idioma + "Nuevo tag" (abre `Sheet`) | F03, F06 |
| `Checkbox` / `Radio` | Nativos con `accent-color` | `.check` |

## Contenedores y feedback

| Componente | Descripción | Notas |
|---|---|---|
| `Card` | Superficie con borde y sombra suave | `.card` |
| `ListItem` | Fila con avatar/hanzi, 2 líneas de texto y acción; `selectable` | `.item` |
| `FlashcardRow` | `ListItem` de flashcard. Mobile: hanzi + pinyin + traducción + tags en 2–3 líneas. Desktop: tabla de columnas (Palabra · Pinyin · Traducción · Tags) | `.item.card-row`, `.row-head` |
| `DeckCard` | Tarjeta de mazo con acción "Estudiar" y link a detalle | `.deck-card` |
| `Sheet` / `Dialog` | Hoja inferior (mobile) o diálogo (desktop). Props: `title`, `onClose`, `footer`, `dismissConfirm` (si hay cambios sin guardar). Variante `AlertDialog` para confirmaciones destructivas | `.overlay`, `.sheet` |
| `Popover` | Menú anclado (selector de idioma, menú `⋯`) | `.popover` |
| `ActionBar` | Barra flotante de selección múltiple | `.action-bar` |
| `StickyFooter` | Botones Cancelar / Guardar fijos al pie del formulario | `.sticky-foot` |
| `Tabs` | `role="tablist"`; paneles con `hidden` | `.tabs` · I02 |
| `Stepper` | Pasos de importación | `.steps` · F05 |
| `Alert` | `info`, `ai`, `ok`, `warn`, `err` (con ícono + texto) | `.alert` |
| `Toast` | Confirmación breve, con "Deshacer" opcional | `.toast` |
| `EmptyState` | Ícono/carácter, título, texto, acciones | `.empty` |
| `Skeleton` | Placeholder de carga | `.skeleton` |
| `ProgressBar` | Avance del recorrido (`role="progressbar"`) | `.progress` |
| `Dropzone` | Zona de arrastre/selección de archivo | `.dropzone` · F05 |

## Específicos del dominio

| Componente | Descripción | Pantallas |
|---|---|---|
| `FlashcardView` | Renderiza una carta según un **layout** (campos, posición, tamaño) y una cara (frente/reverso). Es el componente más importante: lo usan estudio, vista previa del detalle y miniaturas de layouts | R01–R03, F04, I02 |
| `FlipCard` | Envuelve dos `FlashcardView` con giro 3D (`rotateY`), `backface-visibility: hidden`; accesible (button, Enter/Espacio) | R01, F04 |
| `TtsButton` | Botón con ícono de altavoz que reproduce el texto del campo (Web Speech API `speechSynthesis`, `lang` del idioma) | R01, F03, F04 |
| `FieldInput` | Renderiza el input adecuado según `FieldDef.type` (texto, lista, número) y muestra aviso de TTS | F03, F06 |
| `LayoutCanvas` | Grilla de 6 columnas con celdas posicionadas (`grid-column`/`grid-row`) y selección | I04, miniaturas en I02 |
| `AiFillButton` | Botón "Completar con IA" + estados (deshabilitado sin palabra, cargando, error) | F03 |
| `CsvImporter` | Flujo de 3 pasos con validación por fila | F05 |

## Reglas de composición

- Las pantallas **no** conocen Firestore: consumen hooks/servicios de `src/lib/` (`useFlashcards`, `useDecks`, `useLanguages`, …).
- `FlashcardView` es *puro*: recibe `card`, `layout`, `side`; no maneja audio ni giro.
- Cualquier lista de más de ~50 elementos (flashcards) debe virtualizarse o paginarse.
- Todo componente interactivo expone foco visible y nombre accesible; probar con teclado.
