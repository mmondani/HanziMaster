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

## Pendientes
- **Firestore:** base `(default)` en `us-central1` (modo nativo, Standard), con protección contra borrado activada. Reglas e índices desplegados. App web "Hanzi Master" registrada (appId `1:1080712858573:web:1f1c69736b157476abd284`); su config va en `.env.local` (ver `.env.example`).
- **Pendiente manual:** habilitar Authentication → proveedor Google en la consola, y crear el documento `allowedEmails/mmondani89@gmail.com` (la CLI no crea documentos).
