# Notas — 003 Escritura a mano

## Desvíos del plan

- **Paso 4 — versión de los datos japoneses:** `hanzi-writer-data-jp@0.0.2` (la última) se publicó sin los JSON de los caracteres; los datos están en la `0.0.1`. Se fija esa versión en la URL.
- **Pasos 3–6 — orden:** el comparador (paso 5) y la carga de datos (paso 4) se hicieron antes del componente (paso 3), porque el componente los usa.
- **Paso 5 — suavizado:** el largo y la forma de cada trazo se miden sobre el trazo remuestreado y suavizado (promedio móvil de 3 puntos). Sin eso, el temblor fino de la entrada (táctil o mouse) inflaba el largo de los trazos cortos y se rechazaban trazos bien hechos.
- **Paso 6 — sin conexión:** Validar **no** se deshabilita sin conexión (el plan original con Gemini lo hacía). Los trazos de los caracteres del mazo se descargan al empezar el recorrido y quedan en la caché del service worker, así que se puede validar sin red; si un carácter no se pudo descargar, se avisa y se puede reintentar.
- **Paso 6 — resultado viejo:** si se sigue dibujando mientras se valida, el resultado de lo anterior se descarta (`drawingReducer` compara el dibujo validado con el actual).
- **Calibración — nivel relajado por defecto:** después de probar con mouse, se pidió una validación más permisiva. Las tolerancias pasaron a ser un objeto, `DEFAULT_TOLERANCES` (tipo `Tolerances`), con un parámetro opcional en `matchCharacter` y `judgeCharacter`. Eso deja la base lista para un ajuste de exigencia que elija el usuario. Para calibrar hubo controles temporales en la página de prueba; ya se sacaron.
- **Mobile — un carácter a la vez en lugar de celdas apiladas con scroll:** el plan (pregunta 3 resuelta) apilaba las celdas con scroll vertical, una franja lateral para desplazarse y botones de anterior/siguiente. Al probarlo, el scroll no resultó cómodo. Ahora se ve una sola celda, la más grande que entra en la carta, con indicadores numerados y flechas para cambiar de carácter.
  - `cellGrid` recibe `paged` y el alto disponible.
  - `useElementWidth` pasó a ser `useElementSize`.
  - Deshacer recibe la celda visible.
  - Al validar con errores se salta al primer carácter con errores.
- **Agregado a pedido — tocar un trazo lo borra:** no estaba en los requerimientos. Un gesto que se mueve menos de 8 px es un toque.
  - Sobre un trazo, lo borra; si no hay un trazo cerca, no hace nada.
  - Antes, un toque se guardaba como un trazo sin largo y contaba como "mal hecho"; ahora nunca se dibuja.
  - En mobile solo se buscan los trazos del carácter visible.
  - Un `pointercancel` sin movimiento no borra nada.
- **Errores sin lista visible:** a pedido, cuando hay errores ya no se enumeran en texto debajo de las celdas ("Carácter 2: Falta 1 trazo"). Solo se ve "Hay errores: están marcados en rojo." y las marcas del dibujo. El detalle sigue en el DOM con `sr-only` para lectores de pantalla. Los caracteres sin datos ("No se puede validar") sí se siguen mostrando, porque no tienen ninguna marca en el dibujo.
- **Agregado a pedido — swipe en los indicadores:** en mobile, deslizar sobre la tira de indicadores cambia de carácter: hacia la izquierda pasa al siguiente y hacia la derecha al anterior. Cuenta desde 40 px y tiene que ser más horizontal que vertical. El swipe no se hace sobre la celda porque ahí el dedo dibuja.
- **Paso 8 — créditos:** además de en Más (que solo existe en mobile), la atribución de los datos está al pie del sidebar de desktop (`components/layout/data-credits.tsx`).
- **Tests:** `src/test-setup.ts` reemplaza `HTMLCanvasElement.getContext` por uno que devuelve `null` (jsdom no pinta y avisaba por consola). `renderApp` recibe un quinto parámetro con el loader de trazos y por defecto usa los fixtures (`src/test/stroke-fixtures.ts`, con datos reales de 口 你 好 三 人 十 学 生 見 い ア ー): ningún test sale a la red.

## Decisiones

- Dibujar es un layout virtual del sistema con id reservado `__draw__` (ver [ADR 0006](../../decisiones/0006-layout-dibujar-y-validacion-por-trazos.md)).
- Un modo nuevo propone los layouts propios del idioma; Dibujar se elige a mano (si el idioma tiene un solo layout, no se propone Dibujar como reverso).
- Si un idioma deja de ser chino o japonés, sus modos con Dibujar quedan "rotos" con el mecanismo derivado de siempre, y se describen como "Dibujar (solo chino o japonés)".
- Tolerancias del comparador: nivel relajado, en `DEFAULT_TOLERANCES` de `lib/domain/stroke-matching.ts`, en unidades de una celda de 1024.
  - Fréchet ≤ 240 y forma normalizada ≤ 0,52.
  - Largo entre 0,35× y 3× el esperado; ajuste de tamaño entre 0,6× y 1,8×.
  - El nivel inicial era 210 / 0,42 / 0,35–2,6× / 0,6–1,6×.
- Resultado con los 12 caracteres de los fixtures y ondulaciones de la mano simuladas:
  - Aceptación: ±45 el 100 %, ±60 el 98 %, ±75 el 93 %, ±90 el 89 %. Con el nivel inicial: 97 %, 91 %, 86 % y 80 %.
  - Ningún carácter pasa por otro (0 de 132 pares).
  - Siguen sin pasar un 口 con el 横折 incompleto y un 十 con el vertical a la mitad.
- Se descartaron dos niveles más permisivos:
  - Fréchet en 260: no acepta más que 240 y ya deja pasar el 十 con el vertical a la mitad.
  - "Muy relajado" (310 / 0,62 / 0,25–3,5× / 0,45–2×): además deja pasar un carácter por otro.
- Límite conocido, en cualquier nivel: un 丿 recto (sin la curva) pasa en 人. El comparador mide posición y recorrido, no la curvatura fina.

## Pendientes

- [x] Prueba manual con escritura real (mouse en desktop y dedo en mobile), con una página de prueba temporal que ya se borró. A partir de esa prueba se eligió el nivel relajado.
- [x] Prueba manual en mobile: un carácter a la vez, indicadores y flechas, tamaño de la celda dentro de la carta (aprobado por el usuario).
- [ ] Prueba manual de tocar para borrar: que los puntos cortos (丶) no se tomen como toques y que se acierte al trazo con el dedo. Si se pierden puntos, bajar `TAP_SLOP` (8 px) en `handwriting-canvas.tsx`.
- [ ] Prueba manual del swipe sobre los indicadores en un celular real.
- [ ] Prueba manual sin conexión: abrir un recorrido con Dibujar con red, cortarla y validar.
- [ ] Revisar los colores del canvas en modo oscuro.
- [ ] Probar con lápiz (stylus).
- Idea para otra iteración: un ajuste de exigencia elegido por el usuario (Estricta / Normal / Relajada). El comparador ya acepta `Tolerances` como parámetro.
- Tests intermitentes **ya existentes** (también fallan sin los cambios de esta iteración, solo con la suite completa y la máquina cargada): `deck-detail.test.tsx › recuerda el último modo usado…` y `languages-list.test.tsx › G01-2…`. Aislados pasan.

## Aprendizajes

- El quiz de hanzi-writer exige el orden de los trazos: su `strokeMatches` compara contra el trazo que toca y no se exporta. Sus datos sí sirven para comparar sin orden con una asignación global (algoritmo húngaro).
- Los datos de hanzi-writer, hanzi-writer-data-jp y animCJK comparten el sistema de coordenadas (1024, eje Y hacia arriba con base 900).
- Calibrar con valores que se mueven en vivo, sobre una página de prueba, sirvió más que fijarlos solo con tests de ruido simulado. Los tests sirvieron después para elegir entre niveles candidatos sin perder la detección de errores.
- En mobile, dibujar y hacer scroll compiten por el mismo gesto. Es mejor evitar el scroll (un carácter a la vez) que repartir el área entre las dos cosas.
