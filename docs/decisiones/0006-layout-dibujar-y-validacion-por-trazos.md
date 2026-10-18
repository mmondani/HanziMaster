# ADR 0006 — Layout Dibujar virtual y validación local por trazos

**Estado:** Aceptada · **Fecha:** 2026-10-18 · **Iteración:** 003 Escritura a mano

## Contexto
En chino y japonés se pidió un layout "Dibujar" para los modos de recorrida: un canvas para escribir la palabra a mano y validarla carácter por carácter, sin tener en cuenta el orden ni la dirección de los trazos. Los errores deben quedar claramente marcados. Los layouts de cada idioma se guardan en el documento del idioma ([ADR 0002](./0002-modelo-de-datos-por-usuario.md)) y los modos los referencian por id.

## Decisión
- **Layout virtual:** Dibujar tiene un id reservado (`DRAW_LAYOUT_ID = '__draw__'`) y **no se guarda** en `Language.layouts`. `layoutOptions(language)` lo agrega al final solo si el código del idioma empieza con `zh` o `ja`. Un modo lo referencia como a cualquier layout, en el frente o en el reverso. No se migra nada y no se puede editar ni borrar.
- **Validación local por trazos, sin IA:** se usan los datos de trazos de Make Me a Hanzi (`hanzi-writer-data`), `hanzi-writer-data-jp` (kanji) y animCJK (kana). Cada celda del canvas es un carácter. Un comparador propio empareja uno a uno los trazos dibujados con los del carácter (asignación de costo mínimo; Fréchet de posición y de forma, largo; cada trazo se prueba en los dos sentidos) y devuelve los trazos faltantes y los mal hechos o sobrantes.
- **Datos desde jsDelivr con versión fija**, en caché `CacheFirst` del service worker y precargados al empezar un recorrido con Dibujar. Sin dependencias nuevas en `package.json`.

## Alternativas descartadas
- **Guardar Dibujar como un layout real del idioma:** exige migrar idiomas existentes y se podría editar o borrar.
- **Quiz de hanzi-writer:** evalúa en el orden de los trazos y su comparador no se exporta.
- **Reconocimiento con Gemini (AI Logic):** puede aceptar un carácter mal escrito que "se parece", requiere red y consume cuota.
- **Reconocedor local por imagen (WASM/modelo):** pesado, reconoce el carácter parecido en lugar de verificar los trazos, cubre mal el kana.
- **Autoalojar los datos en Hosting:** unos 9.500 JSON (~32 MB) en cada deploy.

## Consecuencias
- Depende de jsDelivr para lo no cacheado; sin red, solo se validan los caracteres ya descargados.
- Un carácter sin datos (raro o variante no cubierta, p. ej. 々) se muestra como "no se puede validar" y no cuenta como error.
- La validación es estricta: escribir en un trazo lo que el estándar hace en dos (o al revés) es un error.
- Las licencias de los datos (Arphic Public License, LGPL) exigen atribución: está en Más y en el sidebar.
- No hay reglas de Firestore nuevas: un modo con Dibujar solo guarda el id reservado.
