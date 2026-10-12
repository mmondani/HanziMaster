# Navegación y rutas

## Mapa

```
/login (A01) ──► /acceso-denegado (A02)      [si el email no está autorizado]
(A03 sin conexión: reemplaza cualquier ruta si la app no puede iniciar; A04 es una franja sobre el shell)
   │
   ▼ (sesión válida)
┌── Shell de la app ───────────────────────────────────────────────┐
│ /flashcards (F01, F02, F06)                                       │
│   ├─ /flashcards/nueva (F03)                                      │
│   ├─ /flashcards/importar (F05)                                   │
│   └─ /flashcards/:id (F04) ─► /flashcards/:id/editar (F03)        │
│ /mazos (M01, M04)                                                 │
│   ├─ /mazos/nuevo (M02)       ← acepta ?cartas=id1,id2 (desde F02)│
│   └─ /mazos/:id (M03, M04) ─► /mazos/:id/editar (M02)             │
│ /mas (G01, solo mobile)                                           │
│ /idiomas (I01)                                                    │
│   ├─ /idiomas/nuevo (I02)                                         │
│   └─ /idiomas/:id (I02, I03) ─► /idiomas/:id/layouts/nuevo|:lid   │
│                                  (I04)                            │
└───────────────────────────────────────────────────────────────────┘
/mazos/:id/estudiar?modo=<id> (R01, R02, R03)   ← pantalla completa, fuera del shell
```

Todas las pantallas son alcanzables por URL (deep link). El router recomendado es `react-router` (dependencia a mencionar en el plan). Rutas privadas redirigen a `/login`; `/login` con sesión redirige a `/flashcards`.

## Shell por breakpoint

| | Mobile (< 1024px) | Desktop (≥ 1024px) |
|---|---|---|
| Navegación primaria | **Barra inferior** de 3 ítems: Flashcards · Mazos · Más (ícono + etiqueta, ítem activo resaltado) | **Sidebar fija** de 248px: logo, Flashcards, Mazos |
| Idiomas | Dentro de **Más** (G01 → I01) | Ítem secundario en el sidebar bajo "Configuración" |
| Cuenta / cerrar sesión | En **Más** | Pie del sidebar (avatar, email, botón cerrar sesión) |
| Selector de idioma | Chip en segunda línea bajo el título | Chip junto al título |
| Acción de crear | **FAB** `+` abajo a la derecha | Botón primario en el encabezado ("Nueva flashcard", "Nuevo mazo") |
| Acciones secundarias de F01 | Menú `⋯` (Seleccionar, Importar CSV) | Botones visibles |
| Pantallas hijas (formularios, detalle) | Sin barra inferior; botón **Volver** (←) en la barra superior; acciones guardar/cancelar en barra inferior fija | Sidebar visible; botón ← junto al título; acciones en barra inferior pegajosa |
| Diálogos | Hoja inferior (bottom sheet) | Diálogo centrado (≤ 560px) |
| Recorrido (R*) | Pantalla completa, sin navegación | Pantalla completa, sin sidebar |

- Ítem activo: `aria-current="page"` + color primario + fondo suave (no solo color).
- En mobile, el ítem "Más" se marca como activo también dentro de Idiomas.
- El **idioma seleccionado** es estado global (contexto), persistido en `localStorage` por usuario. Si el usuario no tiene idiomas, F01 y M01 muestran un estado vacío que lleva a I02 (`/idiomas/nuevo`).
- Volver conserva el estado de la pantalla anterior (scroll, búsqueda y filtros de F01 viven en la URL: `?q=&tag=`).
- Tras guardar, se vuelve a la pantalla de origen con un toast de confirmación.
- Al cambiar de ruta se mueve el foco al `<main>` (y se anuncia el título para lectores de pantalla).

## PWA

- `display: standalone`, `theme_color` = `--primary`, `background_color` = `--bg`; ícono maskable (el logo 汉 es provisorio).
- Respetar `env(safe-area-inset-*)` en barra inferior, FAB y barras de acciones (ya contemplado en los mockups).
- Meta viewport `width=device-width, initial-scale=1` (no deshabilitar el zoom).
