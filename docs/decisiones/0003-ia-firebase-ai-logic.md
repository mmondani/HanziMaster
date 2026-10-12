# ADR 0003 — IA con Firebase AI Logic (Gemini) desde el cliente

**Estado:** Aceptada · **Fecha:** 2026-10-12 · **Iteración:** 000 MVP

## Contexto
La propuesta de valor incluye completar flashcards con IA a partir de una palabra. La app no tiene servidor propio y la clave de un modelo no puede ir en el código del cliente.

## Decisión
- **Firebase AI Logic** con el proveedor **Gemini Developer API**, llamado desde el SDK de cliente (`firebase/ai`). La clave de Gemini queda en Firebase.
- **Protección:** se aplica el "modo de usuarios autenticados" de AI Logic (solo sesiones de Firebase Auth) y App Check con reCAPTCHA Enterprise, opcional (`VITE_APPCHECK_SITE_KEY`). En desarrollo se usa un token de depuración. Activar *Enforce* de App Check queda como paso posterior a verificar en producción.
- **Modelo configurable:** `VITE_AI_MODEL`, por defecto `gemini-3.5-flash`. Cambiarlo no requiere tocar código.
- **Salida estructurada:** `responseSchema` con los campos del idioma como lista `{fieldId, value}` (con `fieldId` restringido por enum) y los tags restringidos al set del idioma.
- **El cliente no confía en la respuesta** (`applyAiResult`): solo rellena campos vacíos, nunca toca la palabra, valida números y listas, descarta tags fuera del set y limita a 2. "Completar de nuevo" solo reemplaza lo que puso la IA y el usuario no editó.
- La IA es una interfaz (`AiCompleter`) inyectada con `AiProvider`: los tests usan una simulada y sin proveedor el botón no se muestra.
- Sin conexión el botón se deshabilita; un fallo muestra el error con "Reintentar" y no bloquea el llenado manual.
- El SDK de IA se carga con `import()` al primer uso.

## Alternativas descartadas
- **Cloud Function como intermediario:** requiere servidor propio y plan Blaze; AI Logic ya resuelve ocultar la clave.
- **Vertex AI como proveedor:** exige plan Blaze.
- **Clave de Gemini en el cliente:** expone la clave.

## Consecuencias
- En la capa gratuita de Gemini Developer API, Google puede usar el contenido enviado para mejorar sus productos. Solo viajan palabras de vocabulario, la definición de los campos y los nombres de los tags; no hay datos personales.
- Está sujeto a la cuota gratuita del proyecto (acotable en Google Cloud, API Generative Language). No se encontró en la consola un límite por usuario.
- Cualquier cuenta de Google que se autentique en la app obtiene un token válido para AI Logic aunque no esté en `allowedEmails`; solo App Check con *Enforce* lo mitiga. Queda como pendiente de seguridad.
- El identificador del modelo depende de Google: si deja de existir hay que cambiar la variable de entorno y volver a construir.
