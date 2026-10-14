# Arquitectura — Hanzi Master

**Última revisión:** 2026-10-13 (iteración 002 · Fixes)

Hanzi Master es una SPA/PWA para estudiar idiomas con flashcards. No tiene servidor propio: el navegador habla directamente con Firebase (Authentication, Firestore, AI Logic) y la privacidad se impone con reglas de seguridad de Firestore. Producción: https://hanzi-master-701f9.web.app (proyecto Firebase `hanzi-master-701f9`).

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript 6, Vite 8, `react-router-dom` 7 (data router) |
| Estilos | CSS propio con tokens (`src/styles/tokens.css`, `components.css`, `base.css`); fuentes autoalojadas con `@fontsource` (Inter, Noto Serif SC) |
| Íconos / CSV | `lucide-react`, `papaparse` |
| Datos y acceso | Firebase: Authentication (Google), Firestore (`(default)`, `us-central1`), Hosting |
| IA | Firebase AI Logic con Gemini Developer API (modelo en `VITE_AI_MODEL`, por defecto `gemini-3.5-flash`) |
| PWA | `vite-plugin-pwa` (`registerType: 'prompt'`), caché persistente multipestaña de Firestore |
| Calidad | Vitest + Testing Library (jsdom), ESLint 9 (`jsx-a11y`, `react-hooks`), tests de reglas con el emulador de Firestore |

## Organización del código

```
src/
  app/            app.tsx (proveedores), routes.tsx (mapa de rutas, pantallas con lazy), data-layout.tsx
  components/
    ui/           primitivas (button, field, input, dialog, toast, tabs, chip…)
    layout/       app-shell, sidebar, bottom-nav, top-bar, selector de idioma, aviso offline, aviso de actualización
    flashcard/    flashcard-view (los campos de lista, un elemento por línea), flip-card, layout-canvas, field-input, tts-button
  features/       una carpeta por área: access, languages, flashcards, decks, study, more (páginas + hooks de pantalla + tests)
  lib/
    types.ts      tipos del dominio (Language, Flashcard, Deck…)
    domain/       lógica pura sin React ni Firebase (reglas de campos, grilla de layouts, búsqueda, formulario, edición masiva,
                  importación CSV, reglas de mazo, mezcla, sesión de estudio, cascadas, saneamiento de la IA)
    repositories/ interfaces + implementación Firestore + `MemoryRepositories` (tests)
    auth/         servicio de autenticación (interfaz + Firebase) y `AuthProvider`
    languages|flashcards|decks/   proveedores de contexto con los datos suscritos
    ai/           cliente de Gemini, prompt y `AiProvider`
    firebase.ts   inicialización (App, Auth, Firestore, App Check opcional, emuladores)
  test/           utilidades de test (render de la app con servicios simulados, fixtures)
```

Reglas de capas:
- **La UI nunca toca Firestore.** Accede a `Repositories` (`useRepositories`) y a los proveedores de contexto. Los repositorios se inyectan (`RepositoriesProvider`), así los tests usan `MemoryRepositories`.
- **La lógica de negocio vive en `lib/domain`**, como funciones puras con tests unitarios.
- La autenticación y la IA también son interfaces inyectables (`AuthService`, `AiCompleter`).

## Modelo de datos (Firestore)

```
allowedEmails/{email}                 id = email en minúsculas; solo lectura del propio documento
users/{uid}/languages/{languageId}    Language: fields, tags, layouts y defaultModes embebidos
users/{uid}/flashcards/{cardId}       Flashcard: languageId, values por id de campo, tags
users/{uid}/decks/{deckId}            Deck: languageId, cardIds, modes (frente/reverso por layout), learning:'free', createdAt?
```

- Los campos de cada idioma son configurables (`FieldDef`); `word`, `translation` y `tags` son campos de sistema y no se pueden eliminar.
- Un layout es una grilla de 6 columnas × hasta 12 filas con los campos ubicados (`LayoutItem`); sin arrastrar y soltar, solo con controles.
- **Modos por defecto:** `Language.defaultModes` se **copia** (ids nuevos) a cada mazo nuevo; no afecta a los existentes y los rotos se omiten. Ver [ADR 0005](./decisiones/0005-modos-por-defecto-del-idioma.md).
- **`Deck.createdAt`** (opcional) se asigna al crear el mazo y se conserva al editarlo; los mazos anteriores no lo tienen y cuentan como los más antiguos al ordenar. Las flashcards ya tenían `createdAt`.
- **Mazo "no disponible"** es un estado **derivado**, no guardado: algún modo apunta a un layout que ya no existe. Se repara editando ese modo.
- **Cascadas en el cliente** (escritura por lotes, `lib/domain/cascades.ts`): eliminar idioma → sus flashcards y mazos; eliminar flashcard → se quita de los mazos; quitar un tag del idioma → se quita de las flashcards; renombrar un tag → se renombra en las flashcards (`LanguageChanges.renamedTags`, resuelto desde los nombres originales); eliminar la selección de flashcards → `removeMany` las borra y las quita de los mazos en una sola pasada (sin deshacer); eliminar un campo → se borra su valor y su lugar en los layouts.
- Las flashcards del usuario se suscriben completas (`onSnapshot`) y se filtran por idioma, búsqueda y tags en memoria: el volumen esperado es bajo.
- **Listados:** flashcards y mazos se ordenan por fecha de creación (`?orden=recientes|antiguas`, por defecto los más recientes) y se paginan en memoria (`?pagina=`; 50 flashcards o 12 mazos por página). La lógica es pura, en `lib/domain/list-view.ts`; cualquier cambio de filtro, búsqueda, orden o idioma vuelve a la página 1. En mobile las filas de flashcards (< 1024px: palabra y traducción) y las tarjetas de mazo (< 640px: nombre, configuración y estudiar) se compactan solo por CSS.
- **Selección por pulsación larga:** en el listado de flashcards, mantener apretada una fila (solo touch/lápiz, 500 ms; se cancela si el dedo se mueve) entra en el modo de selección con esa carta marcada y no navega al detalle. El gesto es `lib/hooks/use-long-press.ts`.
- Los inputs de campos no declaran `lang` (solo la vista de la carta); la tipografía CJK sale de la clase `han-input`.
- El idioma activo se recuerda en `localStorage` (`hm:active-language:{uid}`).
- **Tema:** claro, oscuro o el del sistema (`lib/theme.ts`). La preferencia vive en `localStorage` (`hm:theme`, por dispositivo, no en la cuenta) y se elige en Más (mobile) o en el sidebar (desktop).

## Seguridad y privacidad

- **Autenticación:** Google con ventana emergente (`prompt: select_account`).
- **Acceso:** además de autenticarse, el correo debe estar verificado y figurar en `allowedEmails` (se administra a mano en la consola; las reglas no permiten escribirlo ni listarlo desde el cliente). Ver [ADR 0001](./decisiones/0001-acceso-por-allowed-emails.md).
- **Privacidad:** `users/{uid}/**` solo lo lee y escribe su dueño habilitado. Todo lo demás está denegado (`firestore.rules`, probado en `tests/rules/firestore.rules.test.ts` con el emulador: `npm run test:rules`).
- La configuración web de Firebase no es secreta, pero se mantiene en `.env.local` (fuera del repo); `.env.example` lista las variables.
- **IA:** AI Logic con "modo de usuarios autenticados" aplicado (solo sesiones de Firebase Auth) y App Check opcional con reCAPTCHA Enterprise (`VITE_APPCHECK_SITE_KEY`). La clave de Gemini vive en Firebase, no en la app. Ver [ADR 0003](./decisiones/0003-ia-firebase-ai-logic.md).

## Navegación

Mapa en `src/app/routes.tsx` (detalle en `docs/features/000-mvp/pantallas/navegacion.md`):
- Públicas: `/login`, `/acceso-denegado`.
- Privadas (`RequireAuth` → `DataLayout`, que monta los proveedores de datos): `/flashcards…`, `/mazos…`, `/idiomas…`, `/mas` dentro del `AppShell` (barra lateral en desktop ≥ 1024px, barra inferior en mobile); el recorrido `/mazos/:id/estudiar` es pantalla completa, fuera del shell.
- Las pantallas se cargan bajo demanda (`lazy` de React Router).

## Sin conexión y PWA

- Firestore usa `persistentLocalCache` con `persistentMultipleTabManager`: lo ya sincronizado se ve y se recorre sin red, y las escrituras quedan en cola y se sincronizan al volver.
- El service worker (generado por `vite-plugin-pwa`) precachea el shell (HTML, JS, CSS, íconos); las fuentes se guardan en caché al usarse. Cuando hay una versión nueva se avisa (`UpdatePrompt`) y el usuario elige cuándo actualizar, para no recargar en medio de un recorrido.
- `Completar con IA` es la única acción que requiere red: se deshabilita sin conexión.

## IA: completar flashcards

`lib/domain/ai-completion.ts` define la interfaz `AiCompleter`, arma el pedido (palabra + definición de los campos + set de tags) y **sanea** la respuesta: solo rellena campos vacíos, nunca la palabra, valida números y listas, y limita los tags al set del idioma (máximo 2). `lib/ai/gemini-completer.ts` es la implementación real: carga `firebase/ai` bajo demanda y usa salida estructurada (`responseSchema`).

## Build, entornos y despliegue

- `npm run dev` apunta al proyecto real (con `VITE_USE_EMULATORS=true` usa los emuladores de Auth y Firestore: `npm run emulators`).
- `npm run build` (tsc + Vite): JS inicial ~244 KB de app y ~650 KB de Firebase en su propio chunk; el SDK de IA va aparte.
- Despliegue: `firebase deploy --only hosting` (las reglas e índices de Firestore se despliegan con `--only firestore`). Hosting reescribe todo a `index.html`; `sw.js`, `index.html` y el manifest salen sin caché y los assets con hash como inmutables (`firebase.json`).
- Las decisiones y desvíos de cada iteración están en `docs/features/NNN-nombre/notas.md` (000 MVP, 001 Mejoras, 002 Fixes).

## Pruebas

- `npm test`: unitarias de dominio y tests de pantalla por criterio de aceptación (`F03-6`, `M02-3`… en los nombres), con repositorios, autenticación e IA simulados.
- `npm run test:rules`: reglas de Firestore contra el emulador.
- Lo que no se automatiza y se probó a mano: sesión real de Google, IA real, instalación y uso sin conexión (ver `notas.md`).
