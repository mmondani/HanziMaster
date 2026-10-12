# Sistema de diseño — Hanzi Master (MVP)

Fuente de verdad de los valores: `mockups/assets/styles.css` (bloques `:root` y `:root[data-theme="dark"]`). Este documento explica el *porqué* y las reglas de uso.

## Principios

1. **El caracter es el protagonista.** Tipografía serif grande para hanzi/kanji; todo lo demás es discreto.
2. **Mobile primero, desktop como ampliación** (un solo código responsive; breakpoint de layout en `1024px`).
3. **Una acción primaria por pantalla** (botón índigo sólido); las demás son secundarias o *ghost*.
4. **Nada depende solo de un gesto**: todo swipe/drag tiene un botón equivalente.
5. **Estados siempre diseñados**: cargando, vacío, error, validación.

## Color (tokens semánticos)

Nunca usar hex en componentes; solo `var(--token)`.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--bg` | `#F6F7FF` | `#0F1020` | Fondo de página |
| `--surface` | `#FFFFFF` | `#181A2E` | Tarjetas, inputs, sheets |
| `--surface-2` | `#EEF0FB` | `#20233B` | Fondos secundarios, hover, chips |
| `--text` | `#1E1B4B` | `#E8E9FF` | Texto principal (contraste ≥ 7:1) |
| `--text-muted` | `#4B5563` | `#A9ADCC` | Texto secundario (≥ 4.5:1 sobre `--bg` y `--surface`) |
| `--border` / `--border-strong` | `#D5DAF0` / `#7A83B5` | `#32365A` / `#7378B0` | Separadores / bordes de inputs (≥ 3:1) |
| `--primary` | `#4F46E5` | `#818CF8` | Marca, acción primaria, foco |
| `--on-primary` | `#FFFFFF` | `#0F1020` | Texto sobre primario |
| `--primary-soft` / `--primary-text` | `#E7E8FD` / `#4338CA` | `#2A2D58` / `#A5B4FC` | Selección, ítem activo, tags |
| `--success` / `--success-soft` | `#15803D` / `#DCFCE7` | `#4ADE80` / `#12331F` | Confirmaciones |
| `--danger` / `--danger-soft` | `#C21F1F` / `#FEE2E2` | `#F87171` / `#3B1818` | Eliminar, errores |
| `--warn` / `--warn-soft` | `#B45309` / `#FEF3C7` | `#FBBF24` / `#3A2A0A` | Avisos |
| `--ai` / `--ai-soft` | `#7C3AED` / `#F3E8FF` | `#C4B5FD` / `#2E2150` | Todo lo que viene de IA (botón y aviso) |
| `--ring` | `#4F46E5` | `#A5B4FC` | Anillo de foco |

Reglas: el color nunca es el único indicador (siempre ícono o texto: p. ej. error = ícono + mensaje). El tema se elige por `prefers-color-scheme` y se puede forzar con `data-theme` en `<html>`.

## Tipografía

| Rol | Fuente | Tamaño / peso |
|---|---|---|
| UI | **Inter** (fallback `system-ui`) | Cuerpo 16/1.5 · Pequeño 14 · Mínimo 12 (solo badges/meta) |
| Caracteres (hanzi/kanji) | **Noto Serif SC** (+ `Noto Serif JP` para japonés; fallback `Songti SC`, serif) | Lista 28 · Detalle 28–112 · Carta de estudio `clamp(72px, 22vw, 140px)` |
| Títulos | Inter 700 | H1 24 · H2 18 · H3 16 |

- Cuerpo ≥ 16px en inputs (evita zoom automático en iOS).
- Los campos con texto del idioma de estudio llevan `lang="zh"` / `lang="ja"` (selección de glifo correcta y lectores de pantalla).
- Cargar solo pesos 400/500/600/700 de Inter y 500/700 de Noto Serif; `font-display: swap`.

## Espaciado, radios y elevación

- Escala base 4px: `4 · 8 · 12 · 16 · 24 · 32 · 48` (`--sp-1`…`--sp-7`). Gutter de página: 16px mobile / 32px desktop.
- Radios: `8` (badges) · `12` (botones, inputs, ítems) · `16` (tarjetas) · `24` (sheets, carta de estudio) · `999` (chips/píldoras).
- Sombras: `--shadow-1` (tarjetas) · `--shadow-2` (FAB, carta) · `--shadow-3` (sheets, popovers, barra de acciones). No inventar otras.
- Contenedor máximo: 1120px (listas) y anchos más angostos para formularios (`--w`: 640–1000px), alineados a la izquierda con el título.

## Iconografía

- Trazo (outline) 1.75px, 24px por defecto (`20px` en botones, `16px` en badges). **Un solo set**: en producción usar **Lucide** (`lucide-react`) o **Phosphor** (`@phosphor-icons/react`); los nombres de los mockups (`search`, `plus`, `sparkles`, `volume`, …) mapean 1:1 a Lucide. *Agregar la dependencia debe mencionarse en el plan.*
- Prohibido emoji como ícono. Los íconos decorativos junto a texto llevan `aria-hidden="true"`; los botones solo-ícono, `aria-label`.
- El logo provisorio es el carácter 汉 sobre fondo índigo (placeholder, a definir).

## Interacción y movimiento

- **Tamaño táctil mínimo 44×44px** (botones, ítems, chips accionables ≥ 40px alto + 8px de separación).
- Feedback de pulsación < 100ms (`:active` con `scale(.98)`); transiciones de estado 150–220ms; giro de carta 380ms.
- Hojas modales (`sheet`): en < 768px suben desde abajo; en ≥ 768px son diálogos centrados. Entran 220ms, siempre con botón de cerrar visible y cierre con `Esc` / tap en el fondo.
- `prefers-reduced-motion`: se anulan animaciones (el giro de la carta pasa a cambio inmediato con fundido).
- Cursor `pointer` en todo lo clickeable en desktop; `touch-action: manipulation` en botones.

## Accesibilidad (obligatorio)

- Contraste de texto ≥ 4.5:1, componentes ≥ 3:1, en claro **y** oscuro.
- Foco visible siempre (`outline: 3px solid var(--ring)`; nunca `outline: none` sin reemplazo).
- Inputs con `<label>` visible (nunca solo placeholder); obligatorios con `*` + texto accesible; errores debajo del campo con `aria-describedby`, no solo en color.
- Orden de tabulación = orden visual. La carta del recorrido es un `button` con `aria-label` que indica la cara visible; cambio de contador con `aria-live="polite"`.
- Diálogos con `role="dialog"`/`alertdialog`, `aria-modal`, foco atrapado y devuelto al disparador.
- Toasts: `aria-live="polite"`, no roban foco, autocierre 3–5s, con *Deshacer* cuando aplique.

## Estados estándar

| Estado | Patrón |
|---|---|
| Cargando listas | Skeleton (`.skeleton`) con la forma de la fila; nunca spinner a pantalla completa |
| Cargando acción | Botón deshabilitado + spinner + texto en gerundio ("Completando…") |
| Vacío | Ícono/carácter + título + frase + botón de acción primaria |
| Error | Alerta `.alert.err` con causa **y** acción de recuperación (Reintentar) |
| Sin resultados | Mensaje con el término buscado + botón "Limpiar búsqueda" |
| Deshabilitado | Opacidad .45 + `cursor: not-allowed` + atributo `disabled` |
