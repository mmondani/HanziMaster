# ADR 0004 — PWA con actualización a pedido y datos sin conexión desde la caché de Firestore

**Estado:** Aceptada · **Fecha:** 2026-10-12 · **Iteración:** 000 MVP

## Contexto
La visión pide usar la app en PC y en el celular. Para estudiar en el celular conviene poder instalarla y recorrer los mazos sin red.

## Decisión
- **PWA** con `vite-plugin-pwa`: manifest `standalone`, íconos (incluido maskable) y service worker que precachea el shell (HTML, JS, CSS, íconos). Las fuentes (~1,5 MB por peso del chino simplificado) no se precachean: se guardan al usarse.
- **`registerType: 'prompt'`**: cuando hay una versión nueva se avisa y la persona elige cuándo actualizar. Una actualización automática podría recargar la página en medio de un recorrido.
- **Datos sin conexión:** caché persistente de Firestore con soporte multipestaña. Lo sincronizado se ve y se recorre sin red; las escrituras quedan en cola y se sincronizan al volver.
- **Hosting:** `sw.js`, `index.html` y el manifest sin caché; los assets con hash como inmutables. `/__/` (handler de inicio de sesión de Firebase) queda fuera del service worker.
- Las pantallas se cargan con `lazy` y Firebase tiene su propio chunk; todo se precachea para que funcione sin red.

## Consecuencias
- La primera visita con red es la que deja las fuentes disponibles sin conexión.
- Sin conexión solo falla lo que necesita red: iniciar sesión y Completar con IA.
- Si cambia el logo hay que regenerar los íconos de `public/` (no hay SVG fuente en el repo).
- El comportamiento sin conexión con una sesión real quedó sin verificar automáticamente (ver `notas.md`).
