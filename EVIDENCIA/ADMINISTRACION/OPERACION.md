# Operación de Administración · el operador de BE

Quién lo usa: la persona con acceso a la base del ambiente (hoy, Dirección). Qué cubre: preparar el ambiente, incorporar al
primer administrador, recuperar un acceso perdido y retirar a un administrador. Base: WP-ADMINISTRACION (D-2, D-3),
DL-155 y 08 §25 y §28.3-bis.

**Nunca** se escriben en un ticket, un chat, una captura ni esta bitácora: el código de incorporación, la clave o el QR del
autenticador, los códigos de recuperación ni contraseñas.

## 1. Antes: la clave del segundo factor en el ambiente

- La API necesita `BE_CLAVE_DEL_SEGUNDO_FACTOR`: 32 bytes o más en base64 (común o url). En Render, `generateValue: true`
  en el servicio `be-api`. Va en un PR de configuración **antes** del código (DL-008), como cualquier variable nueva.
- Sin la clave, `/admin` dice «La administración no está configurada en este ambiente» (503) y el resto de BE sigue igual.
- **No se rota sin un plan.** La clave cifra los autenticadores y firma las huellas de los códigos de recuperación: si
  cambia, todos los administradores tienen que configurar su autenticador de nuevo (paso 3 de la sección 4).

## 2. Incorporar a un administrador

1. **La persona crea una cuenta común** desde el alta del website, con su correo y su contraseña. Tiene que ser una cuenta
   aparte: no la de un profesional, no una que tenga vínculos o invitaciones, y nunca una cuenta de la demostración. En
   `test` y `development`, solo correos sintéticos (`@example.invalid`).
2. **El operador corre el comando** desde una terminal con acceso a la base de ese ambiente (la URL externa con la IP
   habilitada, 07 §29, o el shell del servicio `be-api`), con la API compilada:

   ```bash
   APP_ENV=test DATABASE_URL=<la del ambiente> node apps/api/dist/administracion/comando.js incorporar \
     --correo <la cuenta> --nombre "<cómo figura en el historial>" \
     --fundamento "<por qué se incorpora>" --operador "<quién corre el comando>"
   ```

   - Comprueba que la cuenta existe, está operativa, no es administradora, no es de un profesional y no tiene vínculos.
   - Cierra las sesiones comunes de esa cuenta: desde ahí solo entra a Administración.
   - Muestra **una sola vez** el código de incorporación: un solo uso, vence a las 24 horas. La base guarda su huella, no
     el código.
3. **El código se entrega por un canal seguro**, en persona o por uno que el operador ya conozca. Nunca junto con la
   contraseña ni en el mismo mensaje que el correo.
4. **La persona entra en `/admin`** con su correo y su contraseña, escribe el código de incorporación, carga el QR (o la
   clave a mano) en una aplicación de códigos, confirma con un código y **guarda los diez códigos de recuperación** fuera
   de esa computadora. No se vuelven a mostrar.
5. **Bitácora del operador** (08 §28.3-bis): fecha y hora, quién corrió el comando, la cuenta, el fundamento y el
   resultado. Sin el código. El comando además deja su registro de auditoría (`CMD-ADM-INCORPORAR`).

## 3. Lo que el administrador resuelve solo

| Situación | Qué hace | Dónde |
|---|---|---|
| Cambió de teléfono o de aplicación | «Reemplazar el autenticador», con la contraseña. El anterior vale hasta confirmar el nuevo, salen diez códigos nuevos y sus otras sesiones de Administración terminan | `/admin/security` |
| Perdió el autenticador pero tiene códigos | Entra con «Usar un código de recuperación» (cada uno sirve una vez) y después reemplaza el autenticador | Entrada y `/admin/security` |
| «El autenticador quedó bloqueado» | Hubo diez códigos que no valen, seguidos. Entra con un código de recuperación, que lo desbloquea; si fueron intentos ajenos, reemplaza el autenticador y genera códigos nuevos | Entrada y `/admin/security` |
| Le quedan pocos códigos | «Generar códigos nuevos», con la contraseña. Los anteriores dejan de valer y sus otras sesiones terminan | `/admin/security` |

Recuperar no desactiva el segundo factor: un código de recuperación solo completa el paso de esa sesión (y desbloquea el
autenticador si estaba bloqueado).

## 4. Lo que necesita al operador

1. **Perdió el autenticador y los códigos** (o el autenticador quedó bloqueado y no le quedan códigos). Antes de hacer
   nada, el operador confirma que es la persona por un canal que ya conoce (no por el que llega el pedido). Un bloqueo
   que la persona no causó es una señal: alguien tiene su contraseña. Después:

   ```bash
   … comando.js restablecer-segundo-factor --correo <la cuenta> --fundamento "<por qué>" --operador "<quién>"
   ```

   Deja sin valor el autenticador, los códigos de recuperación y las sesiones de Administración de esa cuenta, y muestra
   un código de incorporación nuevo. La persona vuelve al paso 4 de la sección 2.
2. **Olvidó la contraseña.** BE no tiene recuperación de contraseña (fuera de alcance). Hoy la salida es crear otra cuenta,
   incorporarla y retirar la anterior.
3. **La cuenta se comprometió, o la persona deja la tarea.** Retirar el rol:

   ```bash
   … comando.js retirar --correo <la cuenta> --fundamento "<por qué>" --operador "<quién>"
   ```

   Corta todas sus sesiones al instante. Sus decisiones quedan en el historial con su nombre.
4. **Cambió la clave del ambiente** (sección 1): `restablecer-segundo-factor` para cada administrador.

Cada comando escribe su bitácora (como en el paso 5) y su registro de auditoría (`CMD-ADM-RESTABLECER`, `CMD-ADM-RETIRAR`).

## 5. Límites que conviene conocer

- La sesión dura 8 horas. El segundo factor vence después de 15 minutos sin actividad: se pide otro código, sin la
  contraseña.
- Después de la contraseña hay 10 minutos para el código; si no, se vuelve a empezar.
- Cinco códigos que no valen cierran la sesión. Diez seguidos, en cualquier sesión, bloquean el autenticador hasta un
  código de recuperación o un restablecimiento. Además, diez intentos por cuenta cada 15 minutos, y cinco entradas por red
  y cuenta cada 15 minutos.
- Un código del autenticador no vale dos veces, ni dentro de sus 30 segundos.
- Los rechazos quedan en la auditoría, con la operación intentada: códigos que no valen, bloqueos, una sesión común que
  probó una ruta de Administración y una lectura sin el segundo factor. Para revisarlos, el operador consulta
  `registro_de_auditoria` por `operacion` (`API-ADM-…`) y `motivo`.
