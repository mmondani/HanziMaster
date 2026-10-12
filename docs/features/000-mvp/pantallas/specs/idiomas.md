# Specs · Idiomas y cuenta (G01, I01–I04)

Convenciones: ver [../README.md](../README.md). Datos: [../datos-ui.md](../datos-ui.md).

> La sección Idiomas se usa poco: por eso **no es un ítem principal de la navegación** (D3). Se llega desde *Más* (mobile) o el pie del sidebar (desktop), y desde el chip de idioma ("Administrar idiomas").

---

## G01 · Más (solo mobile)

- **Ruta:** `/mas`
- **Mockup:** `g01-mas.html`
- **Estructura:** tarjeta de cuenta (avatar con iniciales, nombre, email de Google) · sección "Configuración" con ítem **Idiomas** (→ I01) · botón **Cerrar sesión** (destructivo suave, separado del resto) · versión de la app.
- En desktop esta pantalla no existe (su contenido está en el sidebar); abrir `/mas` en ≥ 1024px redirige a `/flashcards`.

**Criterios de aceptación**
- **G01-1** Muestra el email de la cuenta de Google conectada.
- **G01-2** *Idiomas* abre I01; *Cerrar sesión* cierra la sesión y lleva a A01.
- **G01-3** El ítem "Más" del bottom nav figura activo en G01 y en las pantallas de Idiomas.

---

## I01 · Listado de idiomas

- **Ruta:** `/idiomas`
- **Mockup:** `i01-idiomas.html` · `?view=empty`
- **Estructura:** barra superior (← a Más en mobile) · H1 "Idiomas" · botón **Nuevo idioma** (desktop) / FAB (mobile) · texto explicativo breve · lista de idiomas (ícono con el carácter distintivo, nombre, resumen "5 campos · 7 tags · 3 layouts · 38 flashcards") → I02.
- **Estados:** vacío ("Todavía no configuraste ningún idioma" + *Nuevo idioma*), cargando (skeleton), error.

**Criterios de aceptación**
- **I01-1** Lista todos los idiomas con su resumen.
- **I01-2** Tocar un idioma abre su editor; *Nuevo idioma* abre el editor vacío.
- **I01-3** Sin idiomas muestra el estado vacío con acción para crear.

---

## I02 · Editor de idioma

- **Rutas:** `/idiomas/nuevo` · `/idiomas/:id` (pestaña en `?tab=campos|tags|layouts`)
- **Mockup:** `i02-idioma-editor.html` · `?tab=tags`, `?tab=layouts`, `?mode=new`, `?open=del`
- **Propósito:** ABM del idioma: nombre, campos de las cartas, set de tags y layouts.

### Estructura
- Barra superior: ← Volver · nombre del idioma · **Eliminar idioma** (desktop; en mobile al final de la pantalla).
- Campo **Nombre del idioma*** (siempre visible sobre las pestañas) con ayuda "Así aparece en los listados…". Un idioma nuevo también pide el **código de idioma** (para TTS y `lang`), ej. `zh-CN`, `ja-JP` (select con sugerencias).
- **Pestañas** `Campos · Tags · Layouts` (`role="tablist"`).
- Pie fijo: **Cancelar** · **Guardar idioma**.

#### Pestaña Campos
- Texto de ayuda: Palabra, Traducción y Tags son campos del sistema y no se eliminan.
- Botón **Agregar campo** (abre I03).
- Lista ordenable de campos: asa de arrastre (solo desktop, `aria-hidden`) · nombre (con candado si es de sistema) · descripción · badges (tipo, Audio, Obligatorio/Opcional) · botón **Editar**.
- **Reordenar** sin arrastre: *Mover arriba/abajo* dentro de I03 (alternativa de accesibilidad).

#### Pestaña Tags
- Campo + botón **Agregar** para nuevos tags; chips con ✕ para quitar. Aviso: "Quitar un tag también lo quita de las flashcards que lo usan."
- Evitar duplicados (sin distinguir mayúsculas).

#### Pestaña Layouts
- Botón **Nuevo layout** (→ I04). Grilla de tarjetas con miniatura del layout (`LayoutCanvas` de solo lectura), nombre y cantidad de campos → I04.

### Eliminar idioma
- `AlertDialog`: "¿Eliminar «{idioma}»? Se eliminarán también sus N flashcards y M mazos." y un input para **escribir el nombre del idioma**; el botón *Eliminar idioma* se habilita solo si coincide (D10).

### Criterios de aceptación
- **I02-1** Se puede crear un idioma con nombre, y nace con los tres campos de sistema (Palabra, Traducción, Tags).
- **I02-2** No se puede eliminar ninguno de los tres campos de sistema; no se puede quedar con menos de tres.
- **I02-3** Se pueden agregar, editar, reordenar y eliminar los demás campos.
- **I02-4** Se puede definir y editar el set de tags del idioma (agregar/quitar, sin duplicados).
- **I02-5** Desde la pestaña Layouts se crean, editan y eliminan layouts.
- **I02-6** Eliminar un idioma exige escribir su nombre y avisa de lo que se borrará.
- **I02-7** Cambios sin guardar piden confirmación al salir; el nombre es obligatorio y único.

---

## I03 · Editor de campo

- **Ruta:** diálogo sobre I02 (sin ruta propia)
- **Mockup:** `i02-idioma-editor.html?open=campo`
- **Campos del formulario:**
  | Control | Detalle |
  |---|---|
  | Nombre* | texto; único dentro del idioma |
  | Descripción | texto opcional; se muestra como ayuda en F03 |
  | Tipo | segmentado **Texto / Lista / Número** (bloqueado en campos de sistema) |
  | Valor por defecto | input según el tipo; vacío si se deja en blanco |
  | Text-to-speech | `Switch` — solo disponible para tipo Texto; muestra el ícono de audio en layouts y formularios |
  | Obligatorio | `Switch` — bloqueado en *activado* para Palabra y Traducción |
  | Mover arriba / abajo | reordena dentro de la lista |
- Pie: **Eliminar** (izquierda, destructivo; oculto en campos de sistema; avisa que se borra el dato de las flashcards y se quita de los layouts) · **Cancelar** · **Guardar**.

**Criterios de aceptación**
- **I03-1** Permite definir nombre, descripción, tipo (texto/lista/número), valor por defecto, TTS y obligatorio/opcional.
- **I03-2** En Palabra, Traducción y Tags no se puede eliminar el campo ni cambiar el tipo; Palabra y Traducción permanecen obligatorias.
- **I03-3** El nombre vacío o repetido muestra un error junto al campo.
- **I03-4** Eliminar un campo no de sistema pide confirmación e informa del impacto.

---

## I04 · Editor de layout

- **Rutas:** `/idiomas/:id/layouts/nuevo` · `/idiomas/:id/layouts/:layoutId`
- **Mockup:** `i04-layout-editor.html` · `?open=del`
- **Propósito:** "elección de campos que se muestran en cada layout, qué posición ocupan y qué tamaño tienen".

### Estructura
- Campo **Nombre del layout***.
- Dos zonas (desktop: lienzo a la izquierda, propiedades de 360px a la derecha; mobile: apiladas, lienzo primero):
  - **Disposición** — `LayoutCanvas`: grilla de **6 columnas** × filas de 44px (proporción de carta). Cada campo colocado es una celda (botón) que muestra un ejemplo de contenido; la celda **seleccionada** tiene anillo de foco; las celdas libres se ven punteadas. Aviso contextual si el campo tiene TTS ("se mostrará el ícono de audio").
  - **Campo seleccionado** — `select` del campo; **Columna**, **Fila**, **Ancho**, **Alto** (selects numéricos que validan que no se salga de la grilla ni se solape); **Tamaño del texto** S/M/L/XL; **Alineación** Izq./Centro/Der.; *Quitar del layout*.
  - Botón **Agregar campo al layout** (lista solo los campos del idioma aún no usados).
- Pie fijo: **Cancelar** · **Eliminar layout** (solo si ya existe; avisa de los mazos afectados) · **Guardar layout**.
- En PC se puede además **arrastrar** las celdas; el arrastre es opcional y siempre hay controles equivalentes.

### Eliminar layout
- `AlertDialog`: "¿Eliminar el layout «X»?". Si lo usan modos de recorrida: alerta con la cantidad de modos y los **nombres de los mazos** afectados, y el texto "Una vez eliminado, esos mazos dejarán de poder usarse. Esta acción no se puede deshacer.". Si no lo usa nadie, confirmación simple.

### Criterios de aceptación
- **I04-1** Se pueden elegir qué campos del idioma aparecen en el layout.
- **I04-2** Cada campo tiene posición (columna/fila) y tamaño (ancho/alto y tamaño de texto) editables.
- **I04-3** Los campos no pueden solaparse ni salirse de la grilla; se informa el error junto a los controles.
- **I04-4** Un idioma admite varios layouts; cada uno tiene nombre.
- **I04-5** Eliminar un layout usado por modos de recorrida **advierte antes** cuántos modos y qué mazos lo usan, y que esos mazos dejarán de poder usarse (*decidido*); la acción exige confirmar.
- **I04-6** Todo se puede hacer sin arrastrar (teclado y táctil).
- **I04-7** Tras eliminar un layout en uso, los mazos afectados quedan marcados como "no disponibles" (ver M01-7) y no se pueden recorrer hasta repararlos editándolos (M02-8).
