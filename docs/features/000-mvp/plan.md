# Plan — 000 MVP

**Estado:** Aprobado
**Requerimientos:** [./requerimientos.md](./requerimientos.md)
**Diseño de pantallas (aprobado):** [./pantallas/README.md](./pantallas/README.md) — specs con los criterios de aceptación citados abajo.

> Contexto: el repositorio todavía no tiene código ni `docs/arquitectura.md` (está vacío). Este plan incluye el andamiaje inicial del proyecto.

## Resumen del enfoque
SPA con **Vite + React + TypeScript** servida por Firebase Hosting, que habla directamente con **Firestore** y **Authentication** (login con Google). No hay servidor propio: la privacidad y la lista de emails permitidos se imponen con **reglas de seguridad de Firestore**. Todos los datos de un usuario viven bajo `users/{uid}/…`; la UI no conoce Firestore, solo hooks y servicios de `src/lib/` (la lógica de negocio —validación de layouts, parseo de CSV, búsqueda, mezcla— son funciones puras testeables). Se construye en **cortes verticales**: base y acceso → idiomas → flashcards → mazos → recorrido → PWA/offline → IA, de modo que cada paso deja la app funcionando. La IA va al final porque es la pieza que depende de configuración externa (App Check, API de Gemini).

## Impacto en la arquitectura
- **Nuevo:** toda la app (`src/`), proyecto Firebase (hosting, Firestore, Auth, reglas, emulador), PWA (manifest + service worker), pipeline de tests/lint.
- **Modelo de datos (Firestore):**
  ```
  allowedEmails/{email}                 ← id = email en minúsculas; solo lectura propia
  users/{uid}/languages/{languageId}    ← Language (fields, tags y layouts embebidos)
  users/{uid}/flashcards/{cardId}       ← Flashcard (languageId, values, tags)
  users/{uid}/decks/{deckId}            ← Deck (languageId, cardIds, modes, learning:'free')
  ```
  Los tipos están en [pantallas/datos-ui.md](./pantallas/datos-ui.md) (se promueven a `src/lib/types.ts` y a `docs/arquitectura.md` al cerrar).
- **Cambio respecto de `datos-ui.md`:** eliminar un layout **ya no borra los modos** que lo usan (decisión de la revisión). Los modos conservan su `layoutId` huérfano y el mazo se considera **no disponible** (se calcula en el cliente: algún modo apunta a un layout inexistente). Se repara editando el mazo (M02-8). Así no hay escrituras en cascada. Hay que corregir esa regla en `datos-ui.md`.
- **Cascadas por escritura en lote (cliente):** eliminar idioma → sus flashcards y mazos; eliminar flashcard → se quita de `cardIds`; quitar tag del idioma → se quita de las flashcards; eliminar campo → se borra el valor en las flashcards y el campo en los layouts. Se trocean en lotes de ≤ 500 operaciones.
- **Búsqueda y filtros en el cliente:** se suscribe (`onSnapshot`) a las flashcards del idioma activo y se filtra en memoria (volumen bajo, según `datos-ui.md`); lista virtualizada si supera ~50 filas.
- **Offline:** caché persistente de Firestore (`persistentLocalCache` con soporte multi-pestaña) + service worker para el shell (A03/A04).
- **Sin cambios pero relevante:** `docs/vision.md` (restricción de plataforma Firebase y privacidad por usuario).

## Archivos
Convención: código en inglés, textos de UI en español, archivos en kebab-case, un componente por archivo.

| Archivo | Acción | Motivo |
|---|---|---|
| `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html` | crear | Andamiaje Vite + React + TS + lint |
| `firebase.json`, `.firebaserc` (proyecto `hanzi-master-701f9`), `firestore.rules`, `firestore.indexes.json` | crear | Hosting, reglas y emuladores |
| `src/styles/tokens.css`, `src/styles/base.css` | crear | Tokens copiados de `pantallas/mockups/assets/styles.css` + estilos base |
| `src/components/ui/*` (`button`, `field`, `chip`, `badge`, `alert`, `dialog`, `bottom-sheet`, `toast`, `empty-state`, `skeleton`, `switch`, `tabs`, `stepper`, …) | crear | Catálogo de [componentes.md](./pantallas/componentes.md) |
| `src/components/layout/*` (`app-shell`, `sidebar`, `bottom-nav`, `page-header`, `offline-banner`) | crear | Shell por breakpoint (navegacion.md) |
| `src/components/flashcard/*` (`flashcard-view`, `flip-card`, `tts-button`, `field-input`, `layout-canvas`) | crear | Componentes de dominio |
| `src/features/access/*`, `languages/*`, `flashcards/*`, `decks/*`, `study/*` | crear | Pantallas A01–A04, I01–I04, G01, F01–F06, M01–M04, R01–R03 |
| `src/lib/firebase.ts` | crear | Inicialización (Auth, Firestore con caché persistente) |
| `src/lib/auth/*` | crear | `useAuth`, login con Google, chequeo en `allowedEmails` |
| `src/lib/repositories/*` | crear | CRUD y suscripciones de languages / flashcards / decks (interfaz + implementación Firestore) |
| `src/lib/domain/*` | crear | Funciones puras: `layout-grid` (solapes/límites), `csv-import`, `search`, `shuffle`, `deck-status`, `field-rules`, `bulk-edit` |
| `src/lib/ai/*` | crear | Cliente de autocompletado con IA (Firebase AI Logic) |
| `src/lib/speech.ts` | crear | Wrapper de `speechSynthesis` |
| `src/app/router.tsx`, `src/app/providers.tsx`, `src/main.tsx` | crear | Rutas, guardas de sesión, contexto de idioma activo |
| `public/manifest.webmanifest`, íconos | crear | PWA |
| `tests/rules/*.test.ts` | crear | Reglas de seguridad contra el emulador |
| `src/**/*.test.ts(x)` | crear | Tests de criterios de aceptación junto a cada módulo |
| `docs/features/000-mvp/pantallas/datos-ui.md` | modificar | Regla de eliminación de layouts |
| `docs/arquitectura.md` | modificar (al cerrar) | Reflejar el estado real |

## Dependencias nuevas
Se instalan en la versión estable vigente al momento de ejecutar el paso 1 y se fijan en `package-lock.json`.

| Paquete | Para qué |
|---|---|
| `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript` | Stack base |
| `react-router-dom` | Rutas y deep links (navegacion.md) |
| `firebase` | Auth, Firestore, (IA según decisión) |
| `lucide-react` | Íconos SVG (un solo set, tree-shakeable); los mockups usan un set equivalente |
| `vite-plugin-pwa` | Manifest + service worker (Workbox) |
| `papaparse` | Parseo robusto de CSV (comillas, `;`, BOM) |
| `@tanstack/react-virtual` | Virtualización de la lista de flashcards y del picker |
| `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | Tests de componentes y lógica |
| `@firebase/rules-unit-testing`, `firebase-tools` (dev) | Tests de reglas con emulador y deploy |
| `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` | Lint (incluye accesibilidad) |
| `firebase/ai` (ya incluido en `firebase`) | IA con Firebase AI Logic; no suma paquetes |

Fuentes *Inter* y *Noto Serif SC*: se autoalojan con `@fontsource/inter` y `@fontsource-variable/noto-serif-sc` (o subset) para que funcionen offline; no dependen de Google Fonts en producción.

## Pasos
Cada paso termina con `npm run lint` y `npm test` en verde, salvo indicación.

- [x] **1. Andamiaje y tooling**
  - Qué: proyecto Vite + React + TS, ESLint, Vitest, alias `@/`, `tokens.css`, `firebase.json` con emuladores (Auth, Firestore, Hosting), scripts `dev`, `test`, `lint`, `emulators`.
  - Verificación: `npm run dev` muestra una página; un test de humo y el lint pasan.
- [x] **2. Reglas de seguridad y modelo base**
  - Qué: `firestore.rules` (acceso a `users/{uid}/**` solo si `request.auth.uid == uid` **y** el email existe en `allowedEmails`; `allowedEmails` solo se puede leer el propio documento; nada se escribe en `allowedEmails` desde el cliente). Tipos en `src/lib/types.ts`.
  - Verificación: `tests/rules` — usuario ajeno no lee/escribe datos de otro; email no permitido no accede; email permitido sí.
- [x] **3. Biblioteca de UI y shell**
  - Qué: componentes de `components/ui`, `AppShell` (sidebar ≥ 1024px / bottom nav 3 ítems), `PageHeader`, toasts, diálogos/bottom sheets accesibles (foco, `Esc`), rutas con guardas, foco al `<main>` al navegar.
  - Verificación: tests de navegación por teclado y de `aria-current`; revisión visual contra `mockups/` en 390px y 1280px, claro/oscuro.
- [x] **4. Acceso (A01–A02) y sin conexión (A03–A04)**
  - Qué: login con Google (popup), consulta a `allowedEmails`, cierre de sesión forzado si no está, `/acceso-denegado` con selector de cuenta forzado, guardas de ruta; `OfflineBanner` por `navigator.onLine` + evento `online/offline`; pantalla A03.
  - Verificación: tests A01-1…6, A02-1…4, A03-1…3, A04-1 con Auth/Firestore simulados (interfaz de `lib/auth`) y prueba manual con emulador.
- [x] **5. Idiomas (I01–I04, G01)**
  - Qué: repositorio de idiomas; I01; I02 con pestañas Campos/Tags/Layouts; I03 (campos de sistema protegidos, reordenar); I04 con `LayoutCanvas` (validación pura de límites/solapes en `layout-grid`); eliminación de idioma con nombre escrito; eliminación de campo y de layout con aviso de impacto; G01 (Más). Idioma activo en contexto + `localStorage`.
  - Verificación: tests I01-1…3, I02-1…7, I03-1…4, I04-1…7, G01-1…3; tests unitarios de `layout-grid` y `field-rules`.
- [x] **6. Flashcards: listado, formulario y detalle (F01–F04)**
  - Qué: repositorio de flashcards con suscripción por idioma; `search` (sin acentos ni mayúsculas, palabra + traducción); F01 con filtros por tag y estado en la URL (`?q=&tag=`); `FieldInput` dinámico por `FieldDef`; F03 (crear/editar/eliminar, tags nuevos al set del idioma); F04 con `FlipCard` + `FlashcardView` y mazos que la contienen. Aún **sin** botón de IA.
  - Verificación: tests F01-1…8, F03-1…4 y 9…10, F04-1…5; unit test de `search`.
- [ ] **7. Selección múltiple y edición masiva (F02, F06)**
  - Qué: modo selección, barra de acciones, edición masiva de un campo (tags: agregar/quitar/reemplazar) con *Deshacer*; *Crear mazo* navega a `/mazos/nuevo?cartas=…`.
  - Verificación: tests F02-1…5, F06-1…5; unit test de `bulk-edit`.
- [ ] **8. Importar CSV (F05)**
  - Qué: `csv-import` puro (encabezado = nombres de campos del idioma, duplicados por *Palabra* omitidos, filas inválidas con motivo, tags `;`, límite 1.000 filas, UTF-8), plantilla descargable, `CsvImporter` de 3 pasos, descarga de filas omitidas, escritura en lotes.
  - Verificación: tests F05-1…9 con CSV de ejemplo (duplicados, falta de columna obligatoria, BOM, comillas).
- [ ] **9. Mazos (M01–M04)**
  - Qué: repositorio de decks; `deck-status` (disponible / sin flashcards / no disponible por layout eliminado); M01 con tarjetas y estados; M02 con picker, modos y validaciones (incluye reparar modo huérfano, M02-8); M03; M04 (si hay un único modo se inicia directo).
  - Verificación: tests M01-1…7, M02-1…8, M03-1…3, M04-1…4; unit test de `deck-status`.
- [ ] **10. Recorrido (R01–R03)**
  - Qué: ruta a pantalla completa; `shuffle` (Fisher-Yates) puro; `FlipCard` con `rotateY` y `prefers-reduced-motion`; teclado (`←` `→` `Espacio` `Esc`), swipe (umbral ~60px), botones visibles; `TtsButton` con `speechSynthesis` y aviso si no hay voz; diálogo de fin de mazo; confirmación al salir.
  - Verificación: tests R01-1…9, R02-1, R03-1…2; unit test de `shuffle` (permutación, sin repetidos, orden distinto al remezclar).
- [ ] **11. PWA y offline**
  - Qué: `vite-plugin-pwa` (manifest standalone, ícono maskable, precache del shell), caché persistente de Firestore, deshabilitar acciones que requieren red con "Requiere conexión", safe-area insets.
  - Verificación: Lighthouse PWA instalable; prueba manual en modo avión: ver y recorrer lo ya sincronizado (A04-2), cambios sincronizan al volver (A04-4). Tests A04-3.
- [ ] **12. Completar con IA (F03-5…8, A04-3)**
  - Qué: `lib/ai` con **Firebase AI Logic** (Gemini vía SDK de cliente, salida estructurada con `responseSchema`), App Check activado y habilitación de la API en la consola. Entrada = palabra + idioma + definición de campos + set de tags; salida con esquema estructurado; el cliente **descarta** tags que no estén en el set y recorta a 2 tags; solo rellena campos vacíos; estado "viene de IA".
  - Verificación: tests F03-5…8 con el servicio de IA simulado; unit test del saneamiento de la respuesta; prueba manual con una palabra real.
- [ ] **13. Pasada final de calidad**
  - Qué: revisión de accesibilidad (contraste, foco, `aria-*`, objetivos ≥ 44px), 375px y landscape, modo oscuro, textos en español neutro (D13), despliegue a Hosting + reglas.
  - Verificación: checklist de [design-system.md](./pantallas/design-system.md); `firebase deploy` a un canal de preview.

## Cobertura de criterios de aceptación
| Criterios | Paso(s) | Cómo se verifica |
|---|---|---|
| A01-1…6, A02-1…4 | 3, 4 | tests de `features/access` + reglas (paso 2) |
| A03-1…3, A04-1, A04-2, A04-4 | 4, 11 | tests + prueba manual offline |
| A04-3, F03-5…8 | 12 | tests con IA simulada + prueba manual |
| G01-1…3, I01-1…3, I02-1…7, I03-1…4, I04-1…7 | 5 | tests de `features/languages` + unit de `layout-grid`/`field-rules` |
| F01-1…8, F03-1…4, F03-9…10, F04-1…5 | 6 | tests de `features/flashcards` + unit de `search` |
| F02-1…5, F06-1…5 | 7 | tests + unit de `bulk-edit` |
| F05-1…9 | 8 | tests con CSV de ejemplo + unit de `csv-import` |
| M01-1…7, M02-1…8, M03-1…3, M04-1…4 | 9 | tests de `features/decks` + unit de `deck-status` |
| R01-1…9, R02-1, R03-1…2 | 10 | tests de `features/study` + unit de `shuffle` |
| Privacidad por usuario y emails permitidos (vision.md, requerimientos) | 2 | tests de reglas con emulador |
| PWA instalable, usable en PC (requerimientos) | 11, 13 | Lighthouse + prueba manual |

## Riesgos y alternativas descartadas
- **Riesgo:** la lista de emails permitidos se evalúa en el cliente y en las reglas; si solo estuviera en el cliente, sería salteable. → **Mitigación:** la regla de Firestore es la barrera real (paso 2); el chequeo del cliente solo mejora la experiencia.
- **Riesgo:** `speechSynthesis` puede no tener voz para `zh-CN`/`ja-JP` en el dispositivo. → **Mitigación:** botón visible con toast explicativo (ya diseñado); no bloquea el estudio.
- **Riesgo:** el swipe choca con el gesto "atrás" del sistema o con el scroll. → **Mitigación:** margen lateral de 16px, `touch-action: pan-y`, y botones siempre visibles.
- **Riesgo:** escrituras en cascada grandes (idiomas con muchas flashcards) superan el límite de 500 por lote. → **Mitigación:** troceo en lotes y estado de progreso; el volumen esperado es bajo.
- **Riesgo:** edición con varias pestañas/dispositivos y caché offline. → **Mitigación:** caché persistente multi-pestaña; "última escritura gana" es aceptable para un solo usuario.
- **Alternativa descartada:** borrar en cascada los modos al eliminar un layout. → **Por qué:** la decisión de la revisión es que el mazo quede no disponible y se repare editándolo.
- **Alternativa descartada:** guardar un flag `unavailable` en el mazo. → **Por qué:** se deriva del estado actual y evita escrituras y desincronización.
- **Alternativa descartada:** Next.js / SSR. → **Por qué:** app privada tras login, hosting estático de Firebase, PWA; no hay SEO que justifique SSR.
- **Alternativa descartada:** CSS-in-JS o librería de componentes (MUI, etc.). → **Por qué:** los mockups ya definen tokens y componentes propios; CSS plano con variables mantiene el modo oscuro y el bundle chico.
- **Alternativa descartada:** E2E con Playwright en esta iteración. → **Por qué:** los criterios se cubren con tests de componentes + emulador; se puede sumar luego.

## Preguntas abiertas
- Ninguna pendiente. Resueltas en la revisión del plan:
  1. **Idioma del código:** inglés; UI, documentación y rutas en español.
  2. **IA:** **Firebase AI Logic** (SDK de cliente, sin servidor propio). Se protege con App Check y cuotas; el paso 12 lo configura.
  3. **Proyecto Firebase:** `hanzi-master-701f9` (va en `.firebaserc`). Los emails permitidos se cargan a mano en la consola. La región de Firestore se verifica con `firebase` CLI en el paso 1.
  4. **Primer idioma:** se crea **vacío**, con solo los tres campos de sistema (sin plantilla).
  5. **Tags en el reverso del recorrido:** se muestran si el campo Tags está incluido en el layout (no hay lógica especial).

## Al terminar
- [ ] Todos los criterios de aceptación verificados
- [ ] Tests y lint pasan
- [ ] `docs/arquitectura.md` actualizado
- [ ] ADR creado si corresponde (candidatos: reglas de acceso por `allowedEmails`; estrategia de IA; modelo de datos bajo `users/{uid}`; mazo "no disponible" derivado)
- [ ] `notas.md` completado
