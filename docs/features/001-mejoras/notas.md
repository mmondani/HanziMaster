# Notas — 001 Mejoras

## Desvíos del plan
- **Paso 3:** `ThemeSelector` quedó en `src/components/layout/theme-selector.tsx` (no en `features/more/`) porque lo usan la pantalla Más y el sidebar; `components/layout` no debe importar de `features/`.
- **Paso 2:** el paginador (`Pagination`) y el selector de orden (`SortSelect`) son componentes de `components/ui`; la lógica (`paginate`, `pageSlots`, `parsePage`, `sortByCreated`) quedó en `lib/domain/list-view.ts`, junto con el orden, en vez de archivos separados.
- **Paso 6:** el botón "Mostrar más" y su test (F01) se reemplazaron por el paginador; no se pidió conservarlos.

## Decisiones tomadas durante la implementación
- Orden por defecto: más recientes primero; los mazos sin `createdAt` (anteriores a esta iteración) cuentan como los más antiguos y no se les inventa fecha al editarlos.
- Tamaños de página: 50 flashcards, 12 mazos. Página y orden viven en la URL (`?pagina=`, `?orden=`).
- Tema: solo en el dispositivo (`localStorage`); selector en Más (mobile) y en el sidebar (desktop, donde Más redirige).
- Renombrar un tag a un nombre ya existente se bloquea con error (no se fusionan). Un tag renombrado y luego quitado se quita de las flashcards con su nombre original.
- Eliminar la selección: solo confirmación, sin "Deshacer". Aplica únicamente a Flashcards (los mazos no tienen modo de selección).
- Modos por defecto: copias con ids nuevos, solo para mazos nuevos; los rotos se marcan en el idioma y se omiten (ADR 0005).
- Mobile: fila de flashcard compacta bajo 1024px; tarjeta de mazo compacta bajo 640px (la grilla de mazos pasa a 2 columnas desde 640px). Un mazo "no disponible" conserva un ícono de advertencia.

## Verificación
- `npm test` (392 tests), `npm run test:rules` (12), `npm run lint` y `npm run build`: en verde.
- Criterios MJ1–MJ9: ver nombres de test `MJ1-*` … `MJ9-*`.

## Pendientes
- **Revisión visual a mano** (jsdom no aplica CSS): filas de flashcards a 375px y en horizontal, tarjetas de mazo a 375px, paginador a 375px (hasta 9 botones, envuelve si no entra), selector de tema en el sidebar (248px) y lista de campos de lista con muchas líneas dentro de una celda chica del layout (la lista tiene scroll vertical).
- Los criterios MJ1–MJ9 no estaban en el requerimiento; se derivaron en el plan y se aceptaron al aprobarlo.
- El diálogo de eliminar un layout no avisa que lo usa un modo por defecto (queda marcado como roto en el idioma).
- Despliegue a Hosting: no se hizo; queda a tu pedido (`firebase deploy --only hosting`).

## Aprendizajes
- Con `display: contents` en `.row` y en `.meta` se pudo compactar las tarjetas y las filas con CSS sin duplicar marcado.
- Los tests de pantalla ven el sidebar y la pantalla Más a la vez (el CSS que oculta uno no corre en jsdom): hay que acotar con `within(main)`.
