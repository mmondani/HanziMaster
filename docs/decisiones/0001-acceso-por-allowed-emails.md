# ADR 0001 — Acceso restringido por lista `allowedEmails`

**Estado:** Aceptada · **Fecha:** 2026-10-10 · **Iteración:** 000 MVP

## Contexto
`docs/vision.md` pide que cada usuario ingrese con su cuenta de Google y que sus datos sean privados. Además, la app no está abierta al público: solo deben entrar cuentas habilitadas. No hay servidor propio donde validar nada, así que la restricción tiene que imponerse en Firebase.

## Decisión
- Login con Google (Firebase Authentication).
- Una colección `allowedEmails/{email}` (id = email en minúsculas) define quién puede usar la app. Se administra **a mano en la consola de Firebase**; ningún cliente puede escribirla ni listarla.
- Las reglas de Firestore exigen sesión, correo **verificado** y que `allowedEmails/{email}` exista, además de que `uid` coincida con el dueño de `users/{uid}/**`. Cada usuario puede leer solo su propio documento de `allowedEmails` (así la app sabe si mostrar "Acceso denegado").
- Quien se autentica pero no está en la lista ve la pantalla de acceso denegado y se le cierra la sesión.

## Alternativas descartadas
- **Validar en el cliente solamente:** cualquiera podría saltearlo llamando a Firestore directamente.
- **Custom claims con Cloud Functions:** requiere servidor propio y plan Blaze; excesivo para un grupo reducido de usuarios.
- **Registro abierto:** contradice el alcance del MVP.

## Consecuencias
- Sumar o quitar usuarios es una operación manual en la consola (un documento por cuenta).
- Sin Cloud Functions ni costos de servidor.
- Las reglas están probadas con el emulador (`npm run test:rules`).
- La comprobación en el cliente es solo UX: la protección real son las reglas.
- Autenticación habilitada no implica acceso a la IA: ver [ADR 0003](./0003-ia-firebase-ai-logic.md).
