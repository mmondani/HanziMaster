# ADR 0005 — Modos de recorrida por defecto en el idioma, copiados al crear el mazo

**Estado:** Aceptada · **Fecha:** 2026-10-13 · **Iteración:** 001 Mejoras

## Contexto
Armar los mismos modos de recorrida (frente/reverso por layout) en cada mazo nuevo es repetitivo. Se pidió poder definirlos una vez por idioma, y que luego cada mazo pueda editarlos o borrarlos. Los modos de un mazo ya se guardan dentro del mazo (`Deck.modes`, ver [ADR 0002](./0002-modelo-de-datos-por-usuario.md)).

## Decisión
- `Language.defaultModes?: TraversalMode[]` vive dentro del documento del idioma, igual que sus campos, tags y layouts. Es opcional: los idiomas anteriores no lo tienen y no se migran.
- Al abrir **Nuevo mazo**, el formulario precarga **copias** de esos modos con **ids nuevos** (`modesFromDefaults`, en `lib/domain/deck-rules.ts`). A partir de ahí son modos del mazo como cualquier otro.
- Cambiar los modos por defecto **no toca los mazos existentes**, y editar o quitar un modo en un mazo no cambia el idioma.
- Un modo por defecto cuyo layout fue eliminado **no se borra**: se marca en la pestaña "Recorridas" del idioma y se **omite** al crear mazos. Es el mismo criterio que el mazo "no disponible" derivado de ADR 0002 (no se guardan marcas que puedan quedar desactualizadas).

## Alternativas descartadas
- **Que el mazo referencie los modos del idioma:** editar el idioma cambiaría mazos ya armados y haría imposible "borrar o editar para cada mazo".
- **Aplicar los cambios de los modos por defecto a los mazos existentes:** sorprendente y destructivo (pisaría modos personalizados).
- **Borrar el modo por defecto al eliminar su layout:** pierde la configuración sin aviso; marcarlo deja que el usuario lo repare.

## Consecuencias
- El documento del idioma crece un poco (decenas de modos como mucho); sigue lejos del límite de 1 MiB.
- Eliminar un layout no avisa que lo usa un modo por defecto (el diálogo de eliminación solo cuenta mazos); el modo queda marcado como roto en el idioma.
- No hay reglas de Firestore nuevas: `users/{uid}/**` ya cubre los campos.
