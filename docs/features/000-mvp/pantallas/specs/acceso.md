# Specs · Acceso y conexión (A01–A04)

Convenciones: ver [../README.md](../README.md). Mockups en `../mockups/`.

---

## A01 · Ingreso con Google

- **Ruta:** `/login` (pública)
- **Mockup:** `a01-login.html` · estados `?view=loading`, `?view=error`
- **Propósito:** única forma de autenticarse. Cumple "Login mediante cuenta de Google".

### Estructura (igual en mobile y desktop; tarjeta centrada, máx. 420px)
1. Logo (漢), nombre "Hanzi Master" (H1) y una frase de propuesta de valor.
2. Botón **Ingresar con Google** (único CTA; estilo de botón oficial de Google: fondo blanco, logo "G" a color, texto oscuro, píldora, alto 52px).
3. Nota de privacidad: "Solo pueden ingresar las cuentas habilitadas. Tus flashcards son privadas…".

### Interacciones
- Click → abre el flujo de Google (popup/redirect de Firebase Auth).
- Tras autenticar, se consulta la colección de emails permitidos:
  - Está → redirige a `/flashcards` (o a la ruta privada que se intentó abrir).
  - No está → cierra la sesión de Firebase y navega a `/acceso-denegado` (A02).
- Con sesión activa al abrir `/login` → redirige a `/flashcards`.

### Estados
| Estado | Presentación |
|---|---|
| Normal | Botón habilitado |
| Conectando | Botón deshabilitado con spinner y texto "Conectando con Google…" (`aria-busy`) |
| Error (popup cerrado / red) | `Alert err` con `role="alert"`: "No se pudo completar el ingreso. Revisa tu conexión e inténtalo de nuevo." El botón sigue habilitado |

### Criterios de aceptación
- **A01-1** Un usuario sin sesión que abre cualquier ruta privada es llevado a `/login`.
- **A01-2** Presionar *Ingresar con Google* inicia la autenticación con Google y muestra el estado "Conectando".
- **A01-3** Un email presente en la colección de permitidos accede a `/flashcards`.
- **A01-4** Un email ausente de la colección termina sin sesión y en A02.
- **A01-5** Un fallo de autenticación muestra el mensaje de error y permite reintentar.
- **A01-6** El botón es operable con teclado y tiene foco visible; no se bloquea el pegado/gestores de contraseñas (no hay campos de contraseña).

---

## A02 · Acceso denegado

- **Ruta:** `/acceso-denegado` (pública)
- **Mockup:** `a02-acceso-denegado.html`
- **Propósito:** informar que la cuenta de Google no está habilitada.

### Estructura
1. Ícono de candado en círculo de error suave.
2. H1 "Esta cuenta no tiene acceso" y el email intentado en negrita.
3. Botón primario **Probar con otra cuenta** → `/login` (y fuerza selector de cuenta de Google).
4. Texto de ayuda: pedir que se agregue el email a la lista de autorizados.

### Criterios de aceptación
- **A02-1** Muestra el email con el que se intentó ingresar.
- **A02-2** No hay sesión activa mientras se ve esta pantalla.
- **A02-3** *Probar con otra cuenta* vuelve a A01 y permite elegir otra cuenta de Google.
- **A02-4** Abrir `/acceso-denegado` sin haber intentado ingresar redirige a `/login`.

---

## A03 · Sin conexión (pantalla completa)

- **Ruta:** sin ruta propia; la app la muestra en lugar de la pantalla pedida cuando **no puede iniciar** sin red (primera carga sin caché o sesión que no se puede validar). Fuera del shell.
- **Mockup:** `a03-sin-conexion.html`
- **Estructura:** ícono de red tachada, H1 "Sin conexión", texto explicativo, botón primario **Reintentar** y nota "Si ya habías abierto la app antes, tus flashcards guardadas siguen disponibles en este dispositivo."
- Al recuperar la red (evento `online`) o al presionar *Reintentar*, reintenta la carga y continúa a la ruta pedida.

**Criterios de aceptación**
- **A03-1** Sin red y sin posibilidad de iniciar, se muestra A03 con el botón *Reintentar*.
- **A03-2** *Reintentar* (o volver la conexión) reanuda la carga sin recargar manualmente.
- **A03-3** La pantalla es operable con teclado y anuncia el estado a lectores de pantalla.

## A04 · Aviso de sin conexión (dentro de la app)

- **Mockup:** `f01-flashcards.html?offline=1` (el parámetro `offline=1` funciona en cualquier pantalla del shell, solo para revisión).
- **Estructura:** franja fija arriba de toda pantalla del shell (`role="status"`, no interrumpe): "Sin conexión. Puedes seguir estudiando; los cambios se guardarán al volver la red." Desaparece sola al volver la red.
- Con caché local de Firestore: se puede listar, ver y **recorrer** mazos ya cargados. Las acciones que requieren red (**Completar con IA**, text-to-speech que dependa de red, importar CSV con sincronización) se deshabilitan con explicación: "Requiere conexión".

**Criterios de aceptación**
- **A04-1** Al perder la conexión aparece la franja sin bloquear la pantalla; al recuperarla desaparece.
- **A04-2** Sin conexión se pueden ver flashcards y mazos ya sincronizados y recorrer un mazo.
- **A04-3** "Completar con IA" queda deshabilitado sin conexión y explica el motivo.
- **A04-4** Los cambios hechos sin conexión se sincronizan al volver la red.
