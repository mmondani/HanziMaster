# ADR 0002 — Modelo de datos bajo `users/{uid}` y "mazo no disponible" derivado

**Estado:** Aceptada · **Fecha:** 2026-10-10 · **Iteración:** 000 MVP

## Contexto
Los datos de cada usuario solo los puede ver ese usuario. La app es de un único usuario por cuenta (sin compartir mazos), el volumen esperado es bajo (cientos o pocos miles de flashcards) y debe poder usarse sin conexión.

## Decisión
**Estructura:**
```
users/{uid}/languages/{languageId}   campos, tags y layouts embebidos en el idioma
users/{uid}/flashcards/{cardId}      languageId, values por id de campo, tags
users/{uid}/decks/{deckId}           languageId, cardIds, modes, learning:'free'
```
- Todo cuelga de `users/{uid}`: una sola regla de seguridad cubre toda la privacidad.
- Campos, tags y layouts viven **dentro** del documento del idioma: se leen en una sola suscripción y se editan juntos.
- Las flashcards se suscriben completas y se filtran en el cliente (búsqueda sin acentos, tags, idioma). No se usan índices compuestos.
- Las cascadas (borrar idioma, flashcard, tag o campo) se hacen en el cliente con escrituras por lotes.

**Mazo "no disponible":** es un estado **derivado**, no un campo guardado. Un mazo está no disponible si algún modo de recorrido apunta a un layout que ya no existe. Eliminar un layout **no borra los modos** que lo usan: el mazo se marca como no disponible y se repara cambiando el layout de ese modo.

## Alternativas descartadas
- **Colecciones raíz con `ownerId`:** exige reglas por documento y consultas siempre filtradas; más fácil equivocarse y filtrar datos de otros.
- **Layouts como subcolección:** más lecturas y sin beneficio con pocos layouts por idioma.
- **Guardar una marca `unavailable` en el mazo:** puede quedar desactualizada, y habría que mantenerla en cada cascada.
- **Cascadas con Cloud Functions:** requiere servidor propio; el cliente alcanza para este volumen.

## Consecuencias
- Un documento de idioma muy grande podría acercarse al límite de 1 MiB de Firestore; con el uso previsto (decenas de campos y layouts) está lejos.
- Las cascadas del cliente no son atómicas si se supera un lote (se trocean en lotes de ≤ 400 operaciones): una caída a mitad puede dejar datos huérfanos. Se asume por el volumen y porque los datos sobrantes no rompen la app.
- Filtrar en el cliente exige descargar todas las flashcards del usuario; si el volumen creciera mucho habría que paginar o consultar por idioma.
- La reparación de mazos no disponibles es siempre manual, por decisión de producto.
