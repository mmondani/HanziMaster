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

- **Paso 6 — sin virtualización:** en vez de `@tanstack/react-virtual` (dependencia prevista en el plan) el listado pagina de a 50 con "Mostrar más". Es más simple, accesible y testeable; no se instaló la dependencia. Reconsiderar si se superan varios miles de flashcards.
- **Paso 6 — acciones de F01 pendientes:** los botones *Seleccionar* e *Importar CSV* (y el menú `⋯` en mobile) se agregan en los pasos 7 y 8 junto con sus pantallas, para no dejar botones sin función. La fila ya incluye el espacio de selección (`sel-slot`).
- **Paso 6 — vista previa de F04:** el mockup no definía qué muestra el reverso al elegir un layout. Se asumió: frente = layout elegido, reverso = el siguiente layout distinto (o el mismo si hay uno solo). Se puede cambiar cuando se defina cómo se relacionan con los modos de recorrida.
- **Paso 6 — datos compartidos:** flashcards y mazos se cargan completos en proveedores de contexto (`FlashcardsProvider`, `DecksProvider`); el idioma activo filtra en el cliente. El conteo de uso de idiomas (`subscribeUsage`) quedó como suscripción aparte; podría derivarse de estos proveedores.
- **Paso 6 — accesibilidad de `FlipCard`:** el contenedor es `role="button"` y contiene botones de audio (anidado, como en el mockup). Los botones de audio detienen el giro. Revisar con lector de pantalla en el paso 13; alternativa: botón "Girar" separado (el recorrido ya lo tiene).
- **Paso 6 — "Completar con IA":** el formulario no incluye aún el botón; se agrega en el paso 12.
- **Paso 6 — tests de reglas:** hay que cerrar los emuladores que dejan los comandos `emulators:start` (un `emulators:exec` falla con "port taken" si quedó uno abierto).

- **Paso 7 — campos editables en masa:** se excluyen Palabra y Traducción (como en el mockup): cambiar el mismo valor en todas las flashcards no tiene sentido. El resto (incluidos Tags y campos propios) sí.
- **Paso 7 — "nuevo tag" en F06:** el diálogo tiene un campo "Nuevo tag" en línea en vez de abrir otro diálogo encima (evita diálogos anidados, que complican el foco y Esc).
- **Paso 7 — selección y filtros:** la selección solo cuenta las flashcards que están a la vista; si se filtra, las demás dejan de contar (y vuelven si se quita el filtro).
- **Paso 7 — "Seleccionar todas las visibles":** es un checkbox sobre la lista, visible en mobile y desktop (la spec lo pedía solo en desktop).
- **Paso 7 — ruta provisoria:** `/mazos/nuevo` es un placeholder hasta el paso 9; ya recibe `?cartas=id1,id2`.
- **Paso 7 — "Deshacer":** restaura las versiones previas de las flashcards modificadas (incluye su `updatedAt` anterior).
- **Paso 7 — tests:** varios tests del listado fallaban de forma intermitente por no esperar la carga de datos; ahora esperan a que desaparezca el esqueleto.

- **Paso 8 — formato del CSV (decidido en la revisión):** el encabezado usa los nombres de los campos del idioma (la comparación ignora mayúsculas y acentos); las palabras duplicadas no se agregan. Como complemento se acepta `,`, `;` o tabulación como separador (se detecta por la primera línea) y BOM de Excel. Una columna ausente toma el valor por defecto del campo; una celda vacía queda vacía.
- **Paso 8 — "fila N":** cuenta las filas de datos (el encabezado no cuenta ni las líneas en blanco), no el número de línea del archivo.
- **Paso 8 — duplicados:** se comparan por Palabra sin distinguir mayúsculas ni espacios, contra las flashcards del idioma y contra filas anteriores del mismo archivo.
- **Paso 8 — límites:** solo `.csv`, UTF-8 (un archivo con bytes inválidos se rechaza), máximo 1.000 filas. La vista previa muestra las primeras 50.
- **Paso 8 — durante la importación:** se pide confirmación si se intenta salir (el guard de cambios sin guardar se reutiliza). Las flashcards se guardan por lotes de 400; los tags nuevos se agregan al idioma antes que las flashcards.
- **Paso 8 — dependencia:** `papaparse` (+ `@types/papaparse`), prevista en el plan.
- **Paso 8 — ejemplos de la tabla de columnas:** son genéricos ("texto") salvo Palabra y Tags; podrían mejorarse con ejemplos por idioma.

- **Paso 9 — "mazo no disponible":** se deriva en el cliente (`getDeckStatus`): un mazo está roto si algún modo apunta a un layout que ya no existe en el idioma. No hay flag guardado ni escrituras en cascada. M01 lo marca con una alerta y deshabilita *Estudiar*; M03 explica el motivo y enlaza a Editar; M02 marca el modo afectado como "Layout eliminado" y exige elegir otro layout (M02-8), lo que repara el mazo. Cubre I04-7 y M01-7.
- **Paso 9 — un solo modo:** *Estudiar* inicia el recorrido directamente, sin diálogo (la spec lo dejaba "a confirmar"). Con varios modos se abre M04, que preselecciona el último modo usado (guardado en `localStorage`).
- **Paso 9 — recorrido provisorio:** `/mazos/:id/estudiar` es un placeholder fuera del shell hasta el paso 10; M04 y los atajos ya navegan a `?modo=<id>`.
- **Paso 9 — mazos vacíos o rotos en M03:** la pantalla muestra un aviso y deshabilita *Estudiar este mazo* (no figuraba en la spec).
- **Paso 9 — el modo exige nombre:** la spec solo pedía layouts; se valida también el nombre del modo.
- **Paso 9 — selector de flashcards:** pagina de a 50 y suma "Quitar todas las visibles" como alternancia del botón "Seleccionar todas las visibles".
- **Paso 9 — tipografía de listas en desktop:** el CSS heredado de los mockups muestra el texto de las filas `.item` en una sola línea en desktop (también en listas de Idiomas y Mazos); respeta lo aprobado en los mockups. Revisar en el paso 13 si se prefiere en columna.
- **Paso 9 — fixtures compartidos:** `MODE_A` y `MODE_B` viven en `src/test/fixtures.ts` (no se importan desde archivos `.test`).

- **Paso 10 — lógica en `src/lib/domain`:** la mezcla (`shuffle`, Fisher-Yates; `reshuffle`, que garantiza un orden distinto al anterior) y el estado del recorrido (`studyReducer`: girar, avanzar, retroceder, fin, reiniciar) son funciones puras con tests propios; la pantalla solo las conecta con teclado, gestos y diálogos.
- **Paso 10 — Espacio/Enter:** giran la carta solo cuando el foco está en el documento; si el foco está en la carta o en un botón, actúa el propio control (evita girar dos veces).
- **Paso 10 — gestos:** el swipe usa eventos táctiles con umbral de 60 px y solo cuenta si es más horizontal que vertical; con un diálogo abierto se ignoran teclas y gestos. El margen lateral de 16 px para no chocar con el gesto "atrás" lo da el padding del escenario.
- **Paso 10 — animación:** cada carta nueva se monta desde cero por el frente (sin giro de regreso). `prefers-reduced-motion` desactiva las transiciones por la regla global del CSS.
- **Paso 10 — salir:** la confirmación de salida se mantiene (la spec la dejaba "a confirmar"); tanto *Salir* como el fin del mazo llevan a `/mazos`.
- **Paso 10 — nombre accesible de la carta:** es "Girar carta. Mostrando el frente/reverso" (de `FlipCard`), no el texto literal de la spec ("Carta. Tocar para girar…"); mismo sentido.
- **Paso 10 — audio:** como en F04, cada campo con audio lleva su botón junto al campo; no se agrupa en la esquina de la carta.
- **Paso 10 — estados:** un modo inexistente, un mazo vacío o no disponible se informan en una pantalla simple con enlace al mazo; el recorrido no se inicia.
- **Paso 10 — placeholder eliminado:** `PlaceholderPage` ya no se usa y se borró.

- **Paso 11 — logo:** se usa **汉** (en lugar del 漢 del diseño) en el sidebar, el login, los íconos de la PWA y los mockups/docs. Los íconos (`public/*.png`: 192, 512, maskable 512, apple-touch 180, favicon 64) se generaron a partir del carácter en Noto Serif SC Bold sobre el índigo de la marca; no hay un SVG fuente en el repo. Si se cambia el logo, hay que regenerarlos.
- **Paso 11 — actualizaciones:** `registerType: 'prompt'` + `UpdatePrompt`: cuando hay una versión nueva se avisa y el usuario elige cuándo actualizar, para no recargar en medio de un recorrido. Los headers de Hosting (`firebase.json`) dejan `sw.js`, `index.html` y el manifest sin caché y los assets con hash como inmutables.
- **Paso 11 — qué se precachea:** HTML, JS, CSS e íconos (10 recursos). Las **fuentes no se precachean** (el chino simplificado pesa ~1,5 MB por peso, dos pesos): se guardan en caché al usarse (`CacheFirst`). Consecuencia: la primera visita con red es la que deja las fuentes disponibles sin conexión. Se podría evaluar un subset de la fuente o usar una sola variable.
- **Paso 11 — tamaño del bundle:** el JS principal pesa ~1,1 MB (335 KB gzip) por Firebase y React. Queda para el paso 13 evaluar división por rutas (`lazy`) y un chunk aparte de `firebase`.
- **Paso 11 — verificado en Chrome:** con un script temporal (puppeteer-core, fuera del repo) sobre `vite preview`: el service worker se activa, el manifest no tiene errores, `Page.getInstallabilityErrors` devuelve vacío, y sin red se carga `/login` y una ruta profunda (`/flashcards`, que redirige a `/login` por no haber sesión). **Sin verificar con una sesión real** (requiere el login de Google): ver y recorrer lo ya sincronizado sin conexión (A04-2) y la sincronización al volver la red (A04-4) dependen de la caché persistente de Firestore; probarlo a mano en modo avión.
- **Paso 11 — "Requiere conexión":** hoy ninguna acción de la app necesita red salvo iniciar sesión y la futura IA; las escrituras sin conexión quedan en cola en Firestore y se sincronizan solas. El deshabilitado de *Completar con IA* (A04-3) se hace en el paso 12.
- **Paso 11 — safe areas:** se agregó `viewport-fit=cover` para que `env(safe-area-inset-*)` funcione en la barra inferior, el FAB y las barras de acciones.

- **Paso 12 — modelo:** por defecto `gemini-3.5-flash`, configurable con `VITE_AI_MODEL` (`.env.local`). El identificador exacto no se pudo verificar desde el código: si la consola/API lo rechaza, ajustar la variable.
- **Paso 12 — consola:** AI Logic activado con *Gemini Developer API* y "modo de usuarios autenticados" aplicado (el SDK adjunta solo el token de Firebase Auth). No se encontró en la consola un límite por usuario; la cuota se puede acotar en Google Cloud (Generative Language API). App Check es **opcional**: se inicializa solo si existe `VITE_APPCHECK_SITE_KEY` (reCAPTCHA Enterprise, sin secret key en el cliente); en desarrollo imprime un debug token que hay que registrar en la consola. No activar *Enforce* hasta probar con la app desplegada.
- **Paso 12 — arquitectura:** el servicio es una interfaz `AiCompleter` (`lib/domain/ai-completion.ts`) provista por `AiProvider`; el real (`lib/ai/gemini-completer.ts`) carga `firebase/ai` con `import()` al primer uso, así que no pesa en el arranque. Sin `AiProvider` el botón no se muestra (así los tests existentes no cambian). El prompt y el `responseSchema` (campos como lista `{fieldId, value}` con `fieldId` restringido por enum, y tags restringidos al set del idioma) se arman a partir de la definición de campos del idioma.
- **Paso 12 — saneamiento:** `applyAiResult` solo rellena campos vacíos, nunca toca la Palabra, ignora ids desconocidos, valida números, normaliza listas, y limita tags al set del idioma (sin distinguir mayúsculas) con máximo 2; los tags solo se asignan si el usuario no eligió ninguno.
- **Paso 12 — "Completar de nuevo":** además de los vacíos, se pueden reemplazar los valores que puso la IA en la pasada anterior y que el usuario no editó (se recuerdan en `AiApplied`). Lo que el usuario escribió o editó nunca se pisa. En edición el botón dice siempre "Volver a completar con IA".
- **Paso 12 — viene de IA:** se marca con borde/fondo violeta **más** el texto "Completado con IA: revísalo." bajo el campo (no solo color); la marca desaparece al editar el campo.
- **Paso 12 — estados:** durante la carga los campos (incluida la Palabra, para que la respuesta no quede desfasada) pasan a esqueleto/deshabilitados y los tags quedan `inert`. Sin conexión el botón se deshabilita y explica "Requiere conexión para completar con IA." (A04-3). Si la IA no aporta nada nuevo se avisa con un mensaje informativo.
- **Paso 12 — test:** `F03-3` era frágil bajo carga (un reenvío tardío de datos remontaba el formulario y perdía lo tipeado); ahora espera a que la lista refleje la flashcard antes de navegar.
- **Paso 12 — sin verificar:** la llamada real a Gemini requiere sesión de Google; probar a mano con una palabra real (ver pendientes).

## Pendientes
- **Firestore:** base `(default)` en `us-central1` (modo nativo, Standard), con protección contra borrado activada. Reglas e índices desplegados. App web "Hanzi Master" registrada (appId `1:1080712858573:web:1f1c69736b157476abd284`); su config va en `.env.local` (ver `.env.example`).
- **Pendiente manual:** habilitar Authentication → proveedor Google en la consola, y crear el documento `allowedEmails/mmondani89@gmail.com` (la CLI no crea documentos).
- **Pendiente manual (paso 12):** probar *Completar con IA* con una palabra real en `npm run dev` (con `VITE_USE_EMULATORS` desactivado), verificar que los tags devueltos son del set y, tras desplegar, activar *Enforce* de App Check para AI Logic.
