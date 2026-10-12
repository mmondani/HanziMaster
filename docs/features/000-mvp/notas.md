# Notas — 000 MVP

## Desviaciones del plan
- **Paso 1 — ESLint 9 en lugar de 10:** `eslint-plugin-jsx-a11y` (6.10) todavía no declara compatibilidad con ESLint 10, así que se fijó `eslint@9` y `@eslint/js@9`. Revisar al actualizar el plugin.
- **Paso 1 — fuentes:** se quitó el `@import` de Google Fonts de `tokens.css`; el autoalojamiento (`@fontsource`) se hace en el paso 3, como indica el plan.
- **Paso 1 — firestore.rules provisorio:** deniega todo hasta el paso 2.

- **Paso 2 — reglas:** además de estar en `allowedEmails`, se exige `email_verified == true` (no estaba en el plan; es más estricto). Los tests de reglas se corren con `npm run test:rules` (emulador) y quedan fuera de `npm test`, que solo ejecuta `src/`.

- **Paso 3 — `Dialog` único:** el plan listaba `dialog` y `bottom-sheet` por separado; es un solo componente (`Dialog`) porque el CSS lo muestra como hoja inferior en mobile y centrado en desktop.
- **Paso 3 — estilos:** en vez de reescribir el CSS, se portó `styles.css` de los mockups a `src/styles/components.css` (clases `btn`, `card`, `sheet`, …) y los componentes React usan esas clases. Los mockups siguen siendo la referencia visual.
- **Paso 3 — fuentes:** Noto Serif SC se carga con el subset `chinese-simplified` (500 y 700); caracteres fuera de ese subset (algunos kanji japoneses) caen a la serif del sistema. Revisar al probar japonés.
- **Paso 3 — rutas provisorias:** `src/app/routes.tsx` usa `PlaceholderPage`; cada paso posterior reemplaza la suya. `OfflineBanner` queda para el paso 4, como en el plan.

- **Paso 4 — A04 y detección de red:** la franja usa `navigator.onLine` y los eventos `online`/`offline`; no detecta "conectado a una red sin internet". Aceptable para el MVP.
- **Paso 4 — sesión sin red:** si no hay red, la validación en `allowedEmails` se resuelve desde la caché local de Firestore; solo si no está cacheada se muestra A03.
- **Paso 4 — pruebas:** el flujo con el popup real de Google no se puede automatizar; los tests usan un `FakeAuthService`. Probar a mano con la cuenta habilitada.

- **Paso 5 — arrastre en el editor de layouts:** el plan lo mencionaba como opcional ("en PC se puede además arrastrar"). No se implementó: todo se hace con controles (I04-6) y es un buen candidato para una iteración posterior. Por la misma razón se omitió el asa de arrastre en la lista de campos; se reordena con "Mover arriba/abajo" en el editor de campo.
- **Paso 5 — G01-3 ("Más" activo en Idiomas):** las pantallas de Idiomas son pantallas "push" (como en el mockup), así que no muestran la barra inferior en mobile; "Más" figura activo en G01. El sidebar de desktop marca "Idiomas" como activo en todo `/idiomas/*`.
- **Paso 5 — layouts de un idioma nuevo:** no se pueden crear hasta guardar el idioma (la pestaña Layouts lo avisa). Los layouts se guardan directamente en el documento del idioma al presionar "Guardar layout"; el editor de idioma no los toca salvo para quitar campos eliminados.
- **Paso 5 — I04-7:** el criterio ("los mazos afectados quedan no disponibles") se verifica aquí solo en el dato (los modos conservan su `layoutId`); la presentación "Mazo no disponible" y el bloqueo de *Estudiar* son M01-7 y se prueban en el paso 9 con `deck-status`.
- **Paso 5 — dependencias de datos:** las cuentas de flashcards y mazos del listado de idiomas salen de suscribirse a esas colecciones completas (volumen bajo). Si crecen mucho, reemplazar por contadores.
- **Paso 5 — selector de idioma activo:** el estado global (`useLanguages().active`, persistido en `localStorage` por usuario) está listo; el chip selector de F01/M01 se construye en los pasos 6 y 9.

## Pendientes
- **Firestore:** base `(default)` en `us-central1` (modo nativo, Standard), con protección contra borrado activada. Reglas e índices desplegados. App web "Hanzi Master" registrada (appId `1:1080712858573:web:1f1c69736b157476abd284`); su config va en `.env.local` (ver `.env.example`).
- **Pendiente manual:** habilitar Authentication → proveedor Google en la consola, y crear el documento `allowedEmails/mmondani89@gmail.com` (la CLI no crea documentos).
