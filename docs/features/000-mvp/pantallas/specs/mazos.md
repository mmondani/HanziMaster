# Specs · Mazos (M01–M04)

Convenciones: ver [../README.md](../README.md). Datos: [../datos-ui.md](../datos-ui.md).

---

## M01 · Listado de mazos

- **Ruta:** `/mazos` (privada, dentro del shell)
- **Mockup:** `m01-mazos.html` · `?view=empty`
- **Propósito:** ver los mazos del idioma elegido y empezar a estudiar uno.

### Estructura
- Encabezado: H1 "Mazos" + chip de idioma (igual que F01) + botón **Nuevo mazo** (desktop) / **FAB** (mobile).
- Búsqueda por nombre y contador de mazos.
- **Grilla de `DeckCard`** (1 columna en mobile, 2 desde 640px, 3 desde 1280px). Cada tarjeta:
  - Ícono de mazo, **nombre** (H3) y "N flashcards".
  - Ícono-botón de **detalle/ajustes** (`aria-label="Ver detalle de {nombre}"`) → M03.
  - Badges: cantidad de modos de recorrida y forma de aprendizaje ("Libre").
  - Botón primario **Estudiar** a todo el ancho → abre M04.

### Estados
| Estado | Presentación |
|---|---|
| Cargando | 3 tarjetas `Skeleton` |
| Vacío | `EmptyState`: "Aún no hay mazos en {idioma}" + *Crear mazo* |
| Mazo sin flashcards | El botón *Estudiar* se deshabilita y la tarjeta muestra "Sin flashcards" |
| Error | `Alert err` con *Reintentar* |
| Mazo no disponible | Algún modo del mazo usa un layout eliminado: la tarjeta muestra `Alert warn` "Mazo no disponible. Un layout que usaba fue eliminado.", oculta los badges y deshabilita *Estudiar*. El ícono de detalle sigue activo (mockup: 4.ª tarjeta de `m01-mazos.html`) |

### Criterios de aceptación
- **M01-1** Lista solo los mazos del idioma seleccionado con nombre, cantidad de cartas y modos.
- **M01-2** *Estudiar* abre la selección de modo (M04) de ese mazo.
- **M01-3** El ícono de detalle abre M03; *Nuevo mazo* / FAB abre M02.
- **M01-4** El cambio de idioma actualiza la lista.
- **M01-5** Un idioma sin mazos muestra el estado vacío con acción para crear.
- **M01-6** Un mazo sin flashcards no permite iniciar el recorrido.
- **M02-8** Al editar un mazo no disponible, el modo cuyo layout fue eliminado se marca con error y obliga a elegir otro layout; al guardar, el mazo vuelve a estar disponible (*decidido*).
- **M01-7** Un mazo con algún modo cuyo layout fue eliminado se muestra como "no disponible" y no permite iniciar el recorrido (*decidido*).

---

## M02 · Crear / editar mazo

- **Rutas:** `/mazos/nuevo` (acepta `?cartas=id1,id2` desde F02) · `/mazos/:id/editar`
- **Mockup:** `m02-mazo-form.html` · `?mode=edit`, `?open=picker`, `?open=modo-edit`, `?view=validation`
- **Propósito:** definir nombre, cartas, modos de recorrida y forma de aprendizaje.

### Estructura (pantalla hija; formulario de 820px)
1. **Nombre*** (input).
2. **Flashcards** (`Card`): contador, botón **Agregar** (abre el *picker*), lista de las cartas del mazo con ✕ para quitar cada una (`aria-label="Quitar {palabra} del mazo"`), enlace "Ver las N flashcards" cuando son muchas.
   - **Picker** (hoja grande): búsqueda, chips de tags, "Seleccionar todas las visibles", lista con checkbox; pie *Cancelar* · *Listo · N seleccionadas*. Las cartas ya incluidas llegan marcadas.
3. **Modos de recorrida** (`Card`): lista de modos (nombre + "Frente: … · Reverso: …") con botón de quitar; **Agregar modo** abre un diálogo con *Nombre*, *Layout del frente*, *Layout del reverso* (selects con los layouts del idioma). Puede haber varios; al menos uno.
4. **Forma de aprendizaje** (`Card`): radio **Libre** (seleccionado y único habilitado: "recorre siempre en orden aleatorio y no registra si acertaste") y una opción deshabilitada "Repaso espaciado · Próximamente".
5. Pie fijo: **Cancelar**, (**Eliminar mazo** solo en edición), **Guardar mazo**.

### Validación
- Nombre obligatorio; al menos 1 flashcard y 1 modo de recorrida ("El mazo necesita al menos un modo de recorrida." junto a la sección).
- Si el idioma no tiene layouts, la sección de modos informa y enlaza a I02 → pestaña Layouts.
- Salir con cambios sin guardar pide confirmación. Guardar → M03 con toast.

### Criterios de aceptación
- **M02-1** Permite crear un mazo con nombre, flashcards del idioma y al menos un modo de recorrida.
- **M02-2** El picker permite buscar y filtrar por tags, y elegir/quitar varias flashcards.
- **M02-3** Al llegar desde F02 las flashcards seleccionadas ya están en el mazo.
- **M02-4** Se pueden agregar varios modos; cada uno combina un layout de frente y uno de reverso del idioma.
- **M02-5** "Libre" es la única forma de aprendizaje seleccionable y está preseleccionada.
- **M02-6** No se guarda sin nombre, sin flashcards o sin modos; los errores aparecen junto a su sección.
- **M02-7** En edición se precargan los datos; *Eliminar mazo* pide confirmación y no elimina las flashcards.

---

## M03 · Detalle de mazo

- **Ruta:** `/mazos/:id`
- **Mockup:** `m03-mazo-detalle.html`
- **Propósito:** "Se puede ver un detalle de los campos que lo componen y editarlos".

### Estructura
- Barra superior: ← Volver · nombre del mazo · **Editar** (texto en desktop, ícono en mobile).
- `Card` resumen: pares clave/valor (Flashcards, Idioma, Forma de aprendizaje), chips de los **modos de recorrida** y botón grande **Estudiar este mazo** (abre M04).
- Lista de las primeras flashcards del mazo (hanzi, pinyin, traducción) que llevan a F04, y "Ver las N flashcards" para expandir.

### Criterios de aceptación
- **M03-1** Muestra nombre, cantidad de cartas, modos de recorrida y forma de aprendizaje.
- **M03-2** Lista las flashcards del mazo y cada una abre su detalle.
- **M03-3** *Editar* abre M02 precargado; *Estudiar este mazo* abre M04.

---

## M04 · Elegir modo de recorrida

- **Ruta:** diálogo sobre M01 / M03 (sin ruta propia)
- **Mockup:** `m01-mazos.html?open=modo`
- **Propósito:** "Al presionar un mazo se consulta cuál de los modos de recorrida configurados se quiere usar".

### Estructura (bottom sheet en mobile / diálogo en desktop)
- Título "{Mazo} · ¿Cómo recorrerlo?" + ✕.
- **Radio group** de tarjetas, una por modo: nombre + "Frente: … · Reverso: …". El primero viene preseleccionado (o el último usado).
- Nota: "Forma de aprendizaje: **Libre** · orden aleatorio, sin registrar aciertos."
- Pie: **Cancelar** · **Comenzar** (primario) → `/mazos/:id/estudiar?modo=<id>`.
- Si el mazo tiene un único modo, **no se muestra el diálogo** y se inicia directamente (decisión a confirmar).

### Criterios de aceptación
- **M04-1** Lista todos los modos configurados del mazo y permite elegir uno.
- **M04-2** *Comenzar* abre el recorrido con el modo elegido y el mazo mezclado al azar.
- **M04-3** Cancelar o `Esc` cierra el diálogo sin iniciar nada.
- **M04-4** Navegable con teclado (flechas cambian de opción, Enter confirma).
