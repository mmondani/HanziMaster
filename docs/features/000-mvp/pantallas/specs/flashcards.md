# Specs · Flashcards (F01–F06)

Convenciones: ver [../README.md](../README.md). Datos: [../datos-ui.md](../datos-ui.md). Componentes: [../componentes.md](../componentes.md).

---

## F01 · Listado de flashcards

- **Ruta:** `/flashcards?q=&tag=` (privada, dentro del shell)
- **Mockup:** `f01-flashcards.html` · `?view=empty`, `?view=noresults`
- **Propósito:** ver, buscar y filtrar las flashcards del idioma elegido; punto de partida para crear, importar, seleccionar.

### Estructura
| Zona | Mobile | Desktop |
|---|---|---|
| Encabezado | H1 "Flashcards" + menú `⋯` (Seleccionar, Importar CSV); debajo el chip de idioma | H1 + chip de idioma + botones *Seleccionar* (ghost), *Importar CSV* (secundario), *Nueva flashcard* (primario) |
| Búsqueda | Campo píldora a todo el ancho, placeholder "Buscar por palabra o traducción" | Igual |
| Filtro de tags | Fila de chips con scroll horizontal: "Todas" + tags del idioma | Fila de chips que envuelve |
| Contador | "8 flashcards" (`aria-live="polite"`) | Igual |
| Lista | Filas de 2–3 líneas: hanzi (28px) · pinyin (negrita) · traducción · tags | Tabla con cabecera: Palabra · Pinyin · Traducción · Tags · › |
| Crear | **FAB** `+` | Botón del encabezado |

Las columnas visibles de la fila salen de los campos del idioma (el mockup muestra Palabra, Pinyin, Traducción, Tags). Palabra y Traducción siempre; el resto según espacio/configuración (decisión de implementación; por defecto: primer campo opcional de tipo texto + Tags).

### Interacciones
- **Buscar:** filtra a medida que se escribe (debounce ~200ms) por palabra y traducción; el contador se actualiza. El texto vive en `?q=`.
- **Filtrar por tag:** un tag a la vez (o varios con OR, a definir); "Todas" limpia. Vive en `?tag=`.
- **Tocar una fila:** navega a F04 (`/flashcards/:id`).
- **Cambiar el idioma:** el chip abre un listbox con los idiomas y "Administrar idiomas" (→ I01). Cambiar el idioma recarga la lista y limpia búsqueda/filtros.
- **Seleccionar** → entra en modo selección (F02).

### Estados
| Estado | Presentación |
|---|---|
| Cargando | 6 filas `Skeleton` |
| Vacío (idioma sin flashcards) | `EmptyState`: "Todavía no hay flashcards en {idioma}" + *Nueva flashcard* e *Importar CSV* |
| Sin resultados | `EmptyState`: "Sin resultados para “{q}”" + *Limpiar búsqueda* |
| Sin idiomas | `EmptyState` que lleva a `/idiomas/nuevo` |
| Error de carga | `Alert err` con *Reintentar* |

### Criterios de aceptación
- **F01-1** Muestra solo las flashcards del idioma seleccionado, con palabra, traducción y tags.
- **F01-2** Escribir en el buscador filtra la lista de forma incremental por palabra o traducción (sin distinguir mayúsculas/acentos).
- **F01-3** Elegir un tag muestra solo las flashcards con ese tag; "Todas" restaura la lista.
- **F01-4** Cambiar de idioma con el selector actualiza la lista y el selector se conserva al volver a la pantalla.
- **F01-5** Una búsqueda sin coincidencias muestra el estado "Sin resultados" con acción para limpiar.
- **F01-6** Un idioma sin flashcards muestra el estado vacío con accesos a crear e importar.
- **F01-7** Tocar una fila abre el detalle de esa flashcard.
- **F01-8** Los elementos accionables miden ≥ 44px y el listado es navegable con teclado.

---

## F02 · Selección múltiple

- **Ruta:** misma que F01 (modo de UI, no ruta)
- **Mockup:** `f01-flashcards.html?select=1`
- **Propósito:** elegir varias flashcards para **crear un mazo** o **editar un campo en masa**.

### Estructura
- Al entrar en modo selección, cada fila muestra un checkbox a la izquierda y tocar la fila **alterna la selección** (no navega).
- Filas seleccionadas: borde y fondo primarios suaves + checkbox con tilde (no solo color).
- **Barra de acciones flotante** (`ActionBar`) abajo (sobre el bottom nav en mobile): contador "3" (mobile) / "3 seleccionadas" (desktop) · **Crear mazo** · **Editar** · ✕ cancelar. El FAB se oculta.
- Se sale con ✕, con `Esc`, o tras completar una acción.

### Interacciones
- **Crear mazo** → `/mazos/nuevo?cartas=id1,id2,…` (M02 con las cartas precargadas).
- **Editar** → abre F06.
- Con 0 seleccionadas la barra muestra "0 seleccionadas" y las acciones quedan deshabilitadas.
- Desktop: opción "Seleccionar todas las visibles" en el encabezado de la tabla.

### Criterios de aceptación
- **F02-1** *Seleccionar* activa el modo selección y muestra la barra con el contador correcto.
- **F02-2** Tocar filas agrega/quita de la selección y actualiza el contador (anunciado por lector de pantalla).
- **F02-3** *Crear mazo* abre M02 con las flashcards seleccionadas ya agregadas.
- **F02-4** *Editar* abre F06 indicando la cantidad de flashcards afectadas.
- **F02-5** Cancelar limpia la selección y restaura el comportamiento normal de las filas.

---

## F03 · Crear / editar flashcard (con IA)

- **Rutas:** `/flashcards/nueva` · `/flashcards/:id/editar` (privadas, pantalla hija)
- **Mockup:** `f03-flashcard-form.html` · `?view=ai`, `?view=loading`, `?view=error`, `?view=validation`, `?mode=edit`
- **Propósito:** completar los campos configurados del idioma; opcionalmente con ayuda de IA.

### Estructura
- Barra superior: ← Volver, título "Nueva flashcard" / "Editar flashcard", badge con el idioma (desktop).
- **Formulario dinámico**: un `FieldInput` por cada `FieldDef` del idioma, en su orden. En el mockup: Palabra* (con botón IA a la derecha), Pinyin, Traducción*, Ejemplo (textarea), Tags (chips).
  - Campos con `tts` muestran la leyenda "Este campo tiene audio".
  - Campos obligatorios: `*` + texto accesible; opcionales: "(opcional)".
  - Tags: chips del set del idioma, selección múltiple, chip **+ Nuevo tag** (abre diálogo "Nuevo tag" que lo agrega al set del idioma y lo asigna).
- Pie fijo: **Cancelar**, (**Eliminar** solo en edición), **Guardar** (primario).
- Desktop: formulario de 760px alineado con el título; Pinyin y Traducción en dos columnas.

### Completar con IA
1. El botón **Completar con IA** (`ai`) está **deshabilitado** hasta que el campo Palabra tenga texto. En mobile se abrevia a "IA" con ícono.
2. Al presionarlo: botón en estado cargando ("Completando…"), los demás campos pasan a skeleton y se deshabilitan.
3. Resultado: se completan los campos **vacíos** (si el usuario ya escribió algo en un campo no se pisa); los **tags** se eligen del set existente del idioma, **máximo 2**; aparece el aviso morado "Completado con IA. Revisa los campos…" (`role="status"`).
4. Todo queda **editable**; el botón cambia a "Completar de nuevo" (en edición: "Volver a completar con IA").
5. Error de IA/red: `Alert err` "No se pudo completar con IA. Puedes reintentar o llenar los campos a mano." con *Reintentar*; el formulario sigue utilizable.

### Validación
- Al guardar se validan campos obligatorios; el error aparece **debajo del campo** ("La traducción es obligatoria."), con ícono y `aria-describedby`; el foco va al primer campo inválido. Con varios errores, resumen enfocable al inicio con enlaces a cada campo.
- Campos tipo número: teclado numérico y validación de formato. Tipo lista: tags/valores múltiples.
- Salir con cambios sin guardar pide confirmación ("¿Descartar los cambios?").
- Guardar con éxito → vuelve a F01 (o F04) con toast "Flashcard guardada".

### Criterios de aceptación
- **F03-1** El formulario muestra un input por cada campo configurado en el idioma, respetando tipo, orden, obligatorio y valor por defecto.
- **F03-2** No se puede guardar sin Palabra y Traducción; el mensaje aparece junto al campo.
- **F03-3** Una flashcard puede guardarse con 0 tags, y se pueden asignar varios.
- **F03-4** Se puede crear un tag nuevo desde el formulario; queda disponible en el set del idioma.
- **F03-5** El botón de IA está deshabilitado con la palabra vacía y habilitado al escribirla.
- **F03-6** Tras *Completar con IA* se rellenan los campos vacíos y se asignan como máximo 2 tags, todos existentes en el set del idioma.
- **F03-7** El resultado de la IA puede editarse antes de guardar y se indica visualmente que viene de IA.
- **F03-8** Un fallo de la IA muestra mensaje con reintento y no bloquea el llenado manual.
- **F03-9** En edición se precargan los valores; *Eliminar* pide confirmación y quita la flashcard de sus mazos.
- **F03-10** Todos los inputs tienen label visible, ≥ 48px de alto y fuente ≥ 16px.

---

## F04 · Detalle de flashcard

- **Ruta:** `/flashcards/:id`
- **Mockup:** `f04-flashcard-detalle.html` · `?side=back`, `?open=del`
- **Propósito:** "Al presionar una tarjeta se puede ver su contenido y editarlo".

### Estructura
- Barra superior: ← Volver · título "Flashcard" · acciones **Editar** y **Eliminar** (botones con texto en desktop; íconos en mobile).
- **Vista previa** de la carta con un `FlipCard` (toca para girar) y un control segmentado para elegir el **layout** a previsualizar (Estándar / Solo significado…).
- Tarjeta **Campos**: lista etiqueta/valor de todos los campos; los de TTS tienen botón de audio; tags como `Tag`.
- Pie: "Aparece en N mazos: …" con enlaces a M03.
- Desktop: dos columnas (vista previa | campos de 360px).

### Interacciones
- **Editar** → `/flashcards/:id/editar` (F03).
- **Eliminar** → diálogo de alerta "¿Eliminar esta flashcard?" (indica en cuántos mazos está). Confirmar → vuelve a F01 con toast "Flashcard eliminada" + *Deshacer*.

### Criterios de aceptación
- **F04-1** Muestra todos los campos de la flashcard con sus valores y tags.
- **F04-2** La vista previa gira al tocarla (o con Enter/Espacio) y permite cambiar de layout.
- **F04-3** Los campos con TTS tienen un botón que reproduce el audio.
- **F04-4** *Editar* abre el formulario precargado; *Eliminar* requiere confirmación.
- **F04-5** Se listan los mazos que contienen la flashcard con enlace a cada uno.

---

## F05 · Importar CSV

- **Ruta:** `/flashcards/importar`
- **Mockup:** `f05-importar-csv.html` · `?view=preview`, `?view=result`, `?view=error`
- **Propósito:** cargar muchas flashcards de una vez respetando los campos del idioma.

### Flujo (3 pasos, `Stepper` con `aria-current="step"`)
1. **Archivo:** `Dropzone` (arrastrar o *Elegir archivo*); tabla "Columnas esperadas" generada de los campos del idioma (nombre de columna, obligatoria sí/no, ejemplo); *Descargar plantilla CSV*. Límites informados: `.csv`, UTF-8, hasta 1.000 filas. **La primera fila es el encabezado y usa exactamente los nombres de los campos del idioma** (*decidido*). Tags separados por `;`; los tags inexistentes se crean.
2. **Revisar:** resumen ("12 filas válidas", "2 filas con problemas se omitirán: …"), tabla de vista previa con estado por fila (OK / Falta traducción / Duplicada). **Duplicada** = ya existe una flashcard del idioma con la misma *Palabra* (o está repetida dentro del archivo); las duplicadas **no se agregan ni sobrescriben** (*decidido*), pie fijo **Elegir otro archivo** · **Importar N flashcards**.
3. **Listo:** confirmación con cantidades (importadas, omitidas, tags nuevos), *Ver flashcards* y *Descargar filas omitidas*.

### Estados de error
- Archivo ilegible / falta columna obligatoria / codificación inválida → `Alert err` indicando la causa y *Elegir otro archivo*.
- Importación en curso: botón en estado cargando con progreso; no se puede salir sin confirmar.

### Criterios de aceptación
- **F05-1** Se puede seleccionar un CSV por selector de archivos o arrastrando.
- **F05-2** Las columnas esperadas se derivan de los campos configurados del idioma y se puede descargar una plantilla.
- **F05-3** Antes de importar se muestra una vista previa con filas válidas y con problemas, y los motivos.
- **F05-4** Se importan solo las filas válidas; las inválidas se informan y pueden descargarse.
- **F05-5** Los tags del CSV que no existen se agregan al set del idioma.
- **F05-6** Un archivo sin las columnas obligatorias se rechaza con un mensaje que indica cuál falta.
- **F05-8** El encabezado del CSV se interpreta por los nombres de los campos del idioma; una columna que no corresponde a ningún campo se ignora y se avisa.
- **F05-9** Una fila cuya Palabra ya existe en el idioma (o repetida en el mismo archivo) se omite, no modifica la flashcard existente y figura como "Duplicada" en la vista previa y en las filas omitidas.
- **F05-7** Al terminar se informa el resultado y se puede ir al listado.

---

## F06 · Edición masiva

- **Ruta:** diálogo sobre F01 (sin ruta propia)
- **Mockup:** `f01-flashcards.html?select=1&open=bulk`
- **Propósito:** cambiar un campo de todas las flashcards seleccionadas.

### Estructura (bottom sheet en mobile / diálogo en desktop)
- Título "Editar N flashcards" + ✕.
- **Campo a modificar** (`select` con los campos editables del idioma).
- Si el campo es **Tags**: control segmentado **Agregar / Quitar / Reemplazar** + chips de tags (con "+ Nuevo tag").
- Otros campos: un input del tipo del campo con el nuevo valor (reemplaza el existente).
- Resumen en texto plano del efecto ("Se agregará **HSK1** a las 3 flashcards…").
- Pie: **Cancelar** · **Aplicar a N**.

### Criterios de aceptación
- **F06-1** Permite elegir cualquier campo editable y el nuevo valor/tags.
- **F06-2** Para Tags permite agregar, quitar o reemplazar.
- **F06-3** El resumen indica claramente cuántas flashcards se modificarán y cómo.
- **F06-4** Aplicar actualiza todas las seleccionadas, sale del modo selección y muestra toast con *Deshacer*.
- **F06-5** Cancelar o cerrar no modifica nada.
