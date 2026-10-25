# Operación de Administración · el operador de BE

Quién lo usa: la persona con acceso a la base del ambiente (hoy, Dirección). Qué cubre: preparar el ambiente, incorporar al
primer administrador, recuperar un acceso perdido y retirar a un administrador. Base: WP-ADMINISTRACION (D-2, D-3),
DL-155 y 08 §25 y §28.3-bis.

**Nunca** se escriben en un ticket, un chat, una captura ni esta bitácora: el código de incorporación, la clave o el QR del
autenticador, los códigos de recuperación ni contraseñas.

## 1. Antes: la clave del segundo factor en el ambiente

**Qué es.** `BE_CLAVE_DEL_SEGUNDO_FACTOR` es una clave **del servidor**, no de una persona. De ella la API deriva dos
claves (HKDF): una cifra el secreto de cada autenticador guardado en la base (AES-256-GCM) y la otra firma las huellas de
los códigos de recuperación (HMAC). **No es el código de seis dígitos** de la aplicación autenticadora: ese código cambia
cada 30 segundos, lo escribe el administrador al entrar y no se configura en ningún lado. Nadie tiene que conocer, copiar
ni escribir esta clave.

**Cómo se configura, sin que pase por el chat, el repositorio ni los registros:**
1. Un PR **solo de configuración** (DL-008) agrega la variable al servicio `be-api` de `render.yaml`, con
   `generateValue: true`, como `JWT_SECRET` y `BE_SECRETO_DE_TAREAS`. Se integra **antes** que Administración: el código
   de `main` todavía no la lee, así que agregarla no cambia nada.
2. Al integrarlo en `main`, Render sincroniza el Blueprint. Como la variable no existe, la crea con un valor al azar
   (base64 de 256 bits, el formato que espera la API) y vuelve a desplegar `be-api`. El valor queda solo en Render: no pasa
   por la terminal de nadie. Las sincronizaciones siguientes no lo generan de nuevo mientras la variable exista (Render
   conserva las variables que ya están).
3. **Comprobar que está, sin verla:** en el panel de Render, `be-api` → Environment muestra `BE_CLAVE_DEL_SEGUNDO_FACTOR`
   con el valor oculto. No hace falta revelarlo. Después de integrar Administración, `/admin` muestra el formulario de
   entrada y no el aviso «La administración no está configurada en este ambiente».

Un efecto lateral conocido: cada push a `main` que toca `render.yaml` vuelve a aplicar la lista de IP de la base
(`ipAllowList: []`). Si el operador había habilitado su IP para conectarse desde afuera, queda cerrada. Para el camino
recomendado de la sección 2 no hace falta.

**Si falta.** `/admin` responde 503 «La administración no está configurada en este ambiente». El resto de BE (el website
profesional, las APK y la API) sigue igual. El comando `incorporar` funciona, porque no usa la clave, pero nadie puede
configurar su autenticador hasta que la clave exista.

**Si está mal formada** (solo puede pasar si se carga a mano: menos de 32 bytes o algo que no es base64): la API no
arranca y dice «Configuración inválida: BE_CLAVE_DEL_SEGUNDO_FACTOR debe ser base64…», sin el valor. El chequeo de salud
cancela ese despliegue y sigue la versión anterior, como con `JWT_SECRET` (docs/DESPLIEGUE.md).

**Si se reemplaza** (por una sospecha de filtración, o porque se borró y se volvió a crear el servicio): los autenticadores
guardados ya no se pueden descifrar y las huellas de los códigos de recuperación no coinciden. Ningún administrador
completa el segundo factor: sus códigos fallan como «no válidos». Las sesiones, las cuentas y los datos de profesionales y
personas no cambian. **No se rota sin un plan:** apenas cambia, `restablecer-segundo-factor` para cada administrador
(sección 4) y cada uno vuelve a configurar su autenticador con el código de incorporación nuevo.

## 2. Incorporar al primer administrador

1. **La persona crea una cuenta común** desde el alta del website, con su correo y su contraseña. Tiene que ser una cuenta
   aparte: no la de un profesional, no una con vínculos o invitaciones, y nunca una cuenta de la demostración. En `test`
   y `development` el comando solo acepta correos sintéticos (`@example.invalid`), como la siembra. El correo es solo el
   identificador de la cuenta, porque BE no le escribe. La contraseña se guarda en un gestor de contraseñas, nunca en el
   repositorio ni en un chat.
2. **El operador corre el comando en el Shell de `be-api`** (panel de Render → `be-api` → Shell; los servicios pagos lo
   tienen). La API ya está compilada en la imagen (`/app`) y el servicio tiene `DATABASE_URL` (por la red privada) y
   `APP_ENV`: no se copia nada fuera de Render ni hace falta habilitar una IP.

   ```bash
   cd /app
   node apps/api/dist/administracion/comando.js incorporar \
     --correo <la cuenta> --nombre "<cómo figura en el historial>" \
     --fundamento "<por qué se incorpora>" --operador "<quién corre el comando>"
   ```

   - Si el Shell no viera las variables del servicio, el comando lo dice («Falta DATABASE_URL.») y no hace nada.
   - Conviene correrlo sin un despliegue en curso: un despliegue cierra las sesiones del Shell.
   - Comprueba que la cuenta existe, está operativa, no es administradora, no es de un profesional y no tiene vínculos.
   - Cierra las sesiones comunes de esa cuenta: desde ahí solo entra a Administración.
   - Muestra **una sola vez** el código de incorporación: un solo uso, vence a las 24 horas. La base guarda su huella, no
     el código.

   Otro camino, con más pasos: una terminal propia con la API compilada y la URL externa de la base, con la IP habilitada
   (07 §29), anteponiendo `APP_ENV=test DATABASE_URL=<la del ambiente>` al mismo comando.
3. **El código se entrega por un canal seguro**, en persona o por uno que el operador ya conozca. Nunca va junto con la
   contraseña ni en el mismo mensaje que el correo. Si el operador y el administrador son la misma persona, no se entrega:
   se escribe directo en `/admin` y no se copia a ningún lado.
4. **La persona entra en `/admin`** con su correo y su contraseña, escribe el código de incorporación, carga el QR (o la
   clave a mano) en una aplicación de códigos, confirma con un código y **guarda los diez códigos de recuperación** fuera
   de esa computadora. No se vuelven a mostrar.
5. **Bitácora del operador** (08 §28.3-bis): fecha y hora, quién corrió el comando, la cuenta, el fundamento y el
   resultado. Sin el código. El comando además deja su registro de auditoría (`CMD-ADM-INCORPORAR`).

### Comprobar que no accede a datos de salud

- **Automático, en cada PR:** `test/integration/administracion.int-spec.ts` prueba que la sesión administrativa no
  autentica en ninguna operación de personas ni de profesionales, ni de salud (401 en cada una), y que la lista y la ficha
  no traen nada de las personas.
- **A mano, en el ambiente, sin capturas con datos ni tokens:**
  1. En `/admin`, la ficha de un profesional muestra su perfil (nombre visible, tipo, correo de acceso, estado de la
     cuenta), por área la verificación y la habilitación, y el historial. De las personas, solo **cuántas** recibirían un
     aviso, sin nombres. No aparecen fichas, registros, planes, fotos ni mediciones.
  2. Con la cuenta administradora, intentar entrar al website profesional o a una APK: responde que el correo o la
     contraseña no son válidos. Una identidad con el rol administrativo no abre sesiones de persona ni de profesional.
  3. En la auditoría, lo que hizo esa cuenta son solo operaciones `API-ADM-…`; los comandos del operador quedan como
     `CMD-ADM-…`.

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
