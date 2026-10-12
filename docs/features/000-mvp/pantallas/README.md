# Pantallas del MVP — Hanzi Master

**Estado:** Propuesto — pendiente de aprobación
**Requerimientos:** [../requerimientos.md](../requerimientos.md)
**Generado con:** skill `ui-ux-pro-max` (Claude Code), 2026-10-11

Esta carpeta contiene el diseño de todas las pantallas de la iteración 000 (web + PWA mobile) para que sean **aprobadas o corregidas antes de implementar**. No hay código de producción acá: los mockups son HTML estático solo para revisión.

## Cómo revisarlas

1. Abrir `mockups/index.html` en el navegador (doble clic; no requiere servidor).
2. Alternar **Mobile / Desktop / Ambas**, tema **Claro / Oscuro** y tamaño de la vista previa.
3. Cada pantalla tiene chips con sus estados (vacío, error, cargando, diálogos abiertos). Los marcos son clickeables: se puede navegar entre pantallas como en la app real.
4. Por pantalla: marcar **Aprobada / Con cambios** y escribir el comentario. Con **Copiar mis comentarios** se genera un resumen en Markdown para pegarlo en el chat con Claude Code.
5. Para abrir un mockup suelto: `mockups/<archivo>.html?<parámetros>` (ver columna "Mockup" abajo). Parámetros comunes: `view=empty|error|loading|…`, `open=<id de diálogo>`, `theme=dark`.

> Los mockups usan la fuente *Inter* y *Noto Serif SC* desde Google Fonts; sin internet se ven con la fuente del sistema, pero el diseño no cambia.

## Decisiones de diseño que necesitan tu visto bueno

Son decisiones que tomé donde el requerimiento no definía nada. Si alguna no te gusta, es el mejor momento para cambiarla.

| # | Decisión | Alternativa descartada |
|---|---|---|
| D1 | **Estilo sobrio y calmado** (superficies blancas, índigo como color de marca, sin ilustraciones). El caracter chino es el protagonista. | El generador del skill sugirió *claymorphism* infantil con tipografía lúdica; lo descarté por no encajar con un estudiante adulto que repasa muchas cartas. |
| D2 | **Navegación adaptable**: sidebar fija en desktop; en mobile, barra inferior con 3 ítems (*Flashcards, Mazos, Más*). | Barra inferior con 4 ítems incluyendo Idiomas (le daría demasiado peso a una sección poco usada). |
| D3 | **Idiomas queda en segundo plano**: en mobile vive dentro de *Más*; en desktop, en el pie del sidebar bajo "Configuración", con menor jerarquía visual. | — (cumple "no debe tener un lugar importante") |
| D4 | **Selector de idioma** como chip junto al título en Flashcards y Mazos (desplegable con acceso a "Administrar idiomas"). El idioma elegido es global y se recuerda entre sesiones. | Selector dentro de la barra de navegación. |
| D5 | **Pantallas hijas** (formularios, detalle) ocultan la barra inferior en mobile y muestran botón *Volver*; el recorrido de mazo es **pantalla completa sin navegación**. | Mantener la barra inferior siempre visible. |
| D6 | En **Mazos**, tocar la tarjeta no inicia el estudio: hay un botón explícito **Estudiar** (abre la elección de modo) y un ícono para el **detalle/edición**. | Toda la tarjeta como zona táctil que inicia el estudio (el requerimiento dice "al presionar un mazo se consulta el modo"; esto lo cumple pero evita iniciar por error). |
| D7 | **Recorrido**: además de swipe/teclado, hay botones ← → y *Girar* siempre visibles (accesibilidad: el swipe no puede ser la única forma). | Solo gestos. |
| D8 | **Layouts**: editor sobre una **grilla de 6 columnas** con controles numéricos (columna, fila, ancho, alto, tamaño de texto), más arrastre opcional en PC. | Editor libre por píxeles (frágil en mobile). |
| D9 | **Edición masiva** limitada a un campo por vez (para Tags: agregar / quitar / reemplazar). | Editar varios campos a la vez. |
| D10 | **Eliminar idioma** exige escribir su nombre (borra flashcards y mazos). Resto de eliminaciones: confirmación simple. | Confirmación simple para todo. |
| D11 | Se incluye **modo oscuro** (no estaba en los requerimientos; los tokens ya lo soportan y evita rehacer el sistema después). | Solo claro. |
| D12 | El máximo de **2 tags** aplica solo al autocompletado con IA; manualmente se pueden asignar todos los que se quiera. | — (según requerimiento) |
| D13 | **Textos de la UI** en español neutro con infinitivos e impersonales ("Ingresar con Google", "Guardar"), sin voseo. | Voseo rioplatense. |

## Decisiones tomadas en la revisión

- **Importar CSV**: el encabezado usa los nombres de los campos del idioma. Las palabras duplicadas **no se agregan** (ni sobrescriben).
- **Eliminar layout en uso**: se permite, pero antes se **advierte** qué mazos lo usan; una vez eliminado, esos mazos **no se pueden usar** (M01 los marca como no disponibles).
- **Mazo no disponible**: se **repara editándolo** y cambiando el layout del modo afectado.
- **Sin conexión**: hace falta; offline se puede ver y recorrer lo ya sincronizado y solo se deshabilita *Completar con IA*.
- **Sin conexión (pantallas)**: se agregan A03 (pantalla completa) y A04 (aviso dentro de la app).

## Preguntas abiertas

- [ ] **Recorrido**: ¿se muestra el tag/etiquetas en el reverso? El mockup sí, es configurable por layout.

## Índice de pantallas

| ID | Pantalla | Mockup | Spec |
|---|---|---|---|
| A01 | Ingreso con Google | `a01-login.html` | [acceso](specs/acceso.md) |
| A02 | Acceso denegado | `a02-acceso-denegado.html` | [acceso](specs/acceso.md) |
| A03 | Sin conexión (pantalla completa) | `a03-sin-conexion.html` | [acceso](specs/acceso.md) |
| A04 | Aviso sin conexión (en la app) | `f01-flashcards.html?offline=1` | [acceso](specs/acceso.md) |
| F01 | Listado de flashcards | `f01-flashcards.html` | [flashcards](specs/flashcards.md) |
| F02 | Selección múltiple | `f01-flashcards.html?select=1` | [flashcards](specs/flashcards.md) |
| F03 | Crear / editar flashcard (con IA) | `f03-flashcard-form.html` | [flashcards](specs/flashcards.md) |
| F04 | Detalle de flashcard | `f04-flashcard-detalle.html` | [flashcards](specs/flashcards.md) |
| F05 | Importar CSV | `f05-importar-csv.html` | [flashcards](specs/flashcards.md) |
| F06 | Edición masiva | `f01-flashcards.html?select=1&open=bulk` | [flashcards](specs/flashcards.md) |
| M01 | Listado de mazos | `m01-mazos.html` | [mazos](specs/mazos.md) |
| M02 | Crear / editar mazo | `m02-mazo-form.html` | [mazos](specs/mazos.md) |
| M03 | Detalle de mazo | `m03-mazo-detalle.html` | [mazos](specs/mazos.md) |
| M04 | Elegir modo de recorrida | `m01-mazos.html?open=modo` | [mazos](specs/mazos.md) |
| R01 | Recorrido · frente | `r01-recorrido.html` | [recorrido](specs/recorrido.md) |
| R02 | Recorrido · reverso | `r01-recorrido.html?side=back` | [recorrido](specs/recorrido.md) |
| R03 | Fin del mazo | `r01-recorrido.html?end=1` | [recorrido](specs/recorrido.md) |
| G01 | Más (solo mobile) | `g01-mas.html` | [idiomas](specs/idiomas.md) |
| I01 | Listado de idiomas | `i01-idiomas.html` | [idiomas](specs/idiomas.md) |
| I02 | Editor de idioma (Campos / Tags / Layouts) | `i02-idioma-editor.html` | [idiomas](specs/idiomas.md) |
| I03 | Editor de campo | `i02-idioma-editor.html?open=campo` | [idiomas](specs/idiomas.md) |
| I04 | Editor de layout | `i04-layout-editor.html` | [idiomas](specs/idiomas.md) |

## Trazabilidad con los requerimientos

| Requerimiento | Pantallas |
|---|---|
| PWA, mobile primero y usable en PC | Todas (responsive; ver [navegacion.md](navegacion.md)) |
| Login con Google + lista de emails permitidos | A01, A02 |
| Secciones Idiomas / Flashcards / Mazos; Idiomas de baja prominencia | G01, I01, navegación |
| Elegir idioma en Flashcards y Mazos | F01, M01 (selector de idioma) |
| ABM de idiomas: campos, mínimo 3 campos, tags iniciales, layouts | I01–I04 |
| Alta una a una de flashcards | F03 |
| Carga por CSV | F05 |
| Tags (0..n), set inicial y creación de nuevos | F03, I02 (pestaña Tags) |
| Completar con IA (tags máx. 2, editable) | F03 |
| Listado, selección múltiple, crear mazo / editar masivo | F01, F02, F06 |
| Buscador por palabra y traducción, resultados en vivo | F01 |
| Ver y editar una flashcard | F04, F03 |
| ABM de mazos con nombre, cartas, modos de recorrida, forma de aprendizaje | M01–M03 |
| Modo de recorrida a elegir al presionar un mazo | M04 |
| Girar con click/tap; flechas / swipe | R01, R02 |
| Ícono de text-to-speech | R01, R02, F04, F03 |
| Fin del mazo: volver a mezclar o salir; salir en cualquier momento | R03, R01 |
| PWA: funcionamiento sin conexión | A03, A04 |

## Contenido de la carpeta

```
pantallas/
├── README.md              ← este archivo (índice, decisiones, trazabilidad)
├── design-system.md       ← tokens, tipografía, espaciado, estados, accesibilidad
├── navegacion.md          ← mapa de navegación, rutas propuestas, shells por breakpoint
├── componentes.md         ← catálogo de componentes reutilizables y su API sugerida
├── datos-ui.md            ← modelo de datos que asumen las pantallas (supuestos)
├── specs/                 ← una spec por sección con una subsección por pantalla
│   ├── acceso.md  flashcards.md  mazos.md  recorrido.md  idiomas.md
└── mockups/               ← HTML estático (solo para revisión)
    ├── index.html         ← galería con comentarios
    ├── assets/styles.css  ← tokens y componentes (reutilizables en Vite)
    ├── assets/shell.js    ← solo interacciones de demo, NO es código de producción
    └── *.html             ← una pantalla por archivo
```

## Para Claude Code (al implementar)

- Leer primero `design-system.md`, `navegacion.md` y `componentes.md`; luego la spec de la sección que se implementa.
- Los **tokens** de `mockups/assets/styles.css` (bloque `:root` y `:root[data-theme="dark"]`) se copian tal cual a `src/styles/tokens.css`.
- El HTML de los mockups es referencia visual: **no copiar `shell.js`** ni el marcado tal cual; reimplementar como componentes React (un componente por archivo, PascalCase; lógica en `src/lib/`).
- Cada spec termina con **criterios de aceptación** numerados (`A01-1`, `F03-4`…) pensados para convertirse en tests (convención del proyecto: toda feature incluye tests de sus criterios).
- Si la implementación se desvía de una pantalla aprobada, anotarlo en `notas.md` de la iteración.
