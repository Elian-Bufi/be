# WP-NOVEDADES-Y-AVISOS — Centro de novedades, avisos push por Expo y recordatorios diarios de registro · definición del paquete

> **Pedido de Dirección del 2026-10-16:**
> - «Si quieres, ya puedes empezar con Expo Push. Y después hacemos la integración de la APK ya con eso sumado».
> - Avisos por las actualizaciones de los planes y por las revisiones de los profesionales.
> - Además, una vez por día, un recordatorio si la persona no guardó ninguna comida o ningún entrenamiento:
>   - comidas, a las 15:00 o a las 22-23;
>   - entrenamiento, después de las 20:00 o a las 22:00 junto al de nutrición.
>
> **Legajo:**
> - **04:** RF-061 (centro de novedades, P1) y RF-062 (push no sensible, P2).
> - **05:** UC-P30 y UC-E08.
> - **06:** §5.11 (T-06-07 y T-06-08; REG-06-29 y REG-06-30; INV-06-32 y 33).
> - **07:** §23 (Expo Push: envío post-commit best-effort, con el centro como respaldo) y §24 (el cron de la plataforma como primer escalón).
> - **08:** Expo Push como encargado AR→US; el push token es C3; sin C4 en el aviso.
> - **09v12:** §20-21 (bosquejo del contrato).
> - **B10-04:** §42 (eventos del vínculo).
>
> **Decisiones:** DEUDA_LEGAJO DL-133. **PR:** #163.

## 1. Objetivo y demostrables

Que la persona se entere cuando su profesional cambia algo, y que el profesional se entere cuando la persona responde, sin depender de que abran la pantalla justa. El circuito de BE (plan → registro → revisión → ajuste) tenía un hueco: la persona no sabía que había un plan nuevo hasta abrir Nutrición.

**Demostrables:**
1. **Un plan activado se ve en Novedades.** Martín Acosta activa un plan de entrenamiento y Diego ve «Plan nuevo de Entrenamiento» en Novedades. La APK lo muestra con su campana y el website con la suya.
2. **El aviso llega sin contenido.** Con los avisos activos y Firebase configurado, el teléfono recibe «BE · Tenés una novedad.». Tocarlo abre Novedades, que pide la sesión si hace falta.
3. **El recordatorio respeta lo registrado.** A las 15:00, con el recordatorio de comidas activo y sin comidas registradas ese día, llega «Tenés un recordatorio para hoy.». Si ya registró una comida, no llega nada.
4. **El profesional se entera de la respuesta.** Cuando la persona acepta la solicitud, el profesional ve «Diego Sosa aceptó tu solicitud de vínculo de Nutrición». Si la persona no declaró un nombre, ve la referencia neutral.

## 2. Delta frente a lo que existe

**Antes:** no había novedades ni avisos. RF-061 y RF-062 figuraban como `DEFERRED` en el 12 (`TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION`).

**Ahora:**
- **Base:** cinco tablas nuevas.
- **API:** seis operaciones de la familia NOV y una ruta interna.
- **Hechos:** siete operaciones existentes publican su novedad.
- **Plataforma:** una tarea programada en Render.
- **Website:** una campana y dos páginas.
- **APK:** una pantalla y dos secciones en Cuenta.

## 3. Modelo (migración aditiva `20261016120000_novedades_y_avisos`)

| Tabla | Qué es | Garantías en la base |
|---|---|---|
| `novedad` | T-06-07: una novedad para **una** persona (su audiencia). Guarda el tipo, el área, quién la originó, la referencia al recurso y el día del recordatorio. **No guarda texto.** | Solo se agrega. Clave única por hecho, tipo y destinatario. Un recordatorio no tiene autor y es de un día; el resto tiene autor. Siempre tiene área |
| `lectura_de_novedad` | UC-P30, paso 6: la primera vez que la persona la abrió | Solo se agrega; una por novedad |
| `suscripcion_push` | RF-062: un teléfono que recibe los avisos de una cuenta. El token es C3 | Una vigente por teléfono (índice parcial). Token con la forma de Expo. Baja coherente: fecha y motivo juntos, después del alta |
| `aviso_push` | T-06-08: un aviso a un teléfono, que referencia una sola novedad. Mutable, porque el estado avanza con la respuesta del canal | Único por novedad y teléfono. Intentos de 1 en adelante |
| `preferencia_de_recordatorio` | Los recordatorios de la persona: una fila por tipo, con su estado (sin booleanos) | — |

## 4. Operaciones

| ID | Ruta | Qué hace |
|---|---|---|
| API-NOV-01 | `GET /me/news` | Las novedades propias, de la más nueva a la más vieja, con `unreadCount` sobre todas. Lectura protegida (límite por actor) |
| API-NOV-02 | `GET /me/news/{newsId}` | Una novedad propia, que queda leída (la primera lectura se registra). Si es de otro o no existe: 404 |
| API-NOV-03 | `PUT /me/push-subscriptions/{deviceId}` | El teléfono recibe los avisos de esta cuenta. Repetirlo igual no cambia nada; con otro token, lo reemplaza; si otra cuenta lo registra, la anterior queda dada de baja |
| API-NOV-04 | `DELETE /me/push-subscriptions/{deviceId}` | El teléfono deja de recibirlos. Repetirlo responde 204 |
| API-NOV-05 | `GET /me/notification-preferences` | Los recordatorios: `mealLogReminder` y `trainingLogReminder` |
| API-NOV-06 | `PUT /me/notification-preferences` | Reemplazarlos. Repetirlo no cambia nada |
| (interna) | `POST /internal/reminder-runs` | La corrida de los recordatorios. Fuera de `/api/v1` y del OpenAPI, como `/health`. Exige `Authorization: Bearer <BE_SECRETO_DE_TAREAS>`; sin él, o con otro, el mismo 404 |

**Compatibilidad:**
- `kind` y `open.view` son texto, no enumeraciones estrictas: la APK instalada valida las respuestas y un tipo nuevo no puede dejarla sin leer la lista.
- El título y el texto vienen armados por BE.
- `/me` no cambia.

## 5. Qué deja novedad, y a quién

| Hecho (operación) | Tipo | Para | Texto (ejemplo) |
|---|---|---|---|
| Activar una versión del plan (API-NUT-12, API-TRN-12) | `PLAN_ACTIVATED` | La persona | «Prof. Martín Acosta activó una versión nueva de tu plan de Entrenamiento.» |
| Registrar una revisión (API-NUT-18, API-TRN-22) | `REVIEW_RECORDED` | La persona | «Lic. Sofía Paz registró una revisión de Nutrición.» |
| Crear una solicitud de vínculo (API-REL-01) | `RELATIONSHIP_REQUEST_RECEIVED` | La contraparte | «… te envió una solicitud de vínculo de Nutrición.» |
| Aceptarla o rechazarla (API-REL-03 y 04) | `…_ACCEPTED` y `…_REJECTED` | El profesional | El rechazo no nombra a la persona |
| Pausar, reanudar o finalizar un alcance (API-REL-07 a 09) | `RELATIONSHIP_PAUSED`, `RESUMED` y `ENDED` | La otra parte | «… pausó el vínculo de Nutrición. La historia se conserva.» |
| Revocar el B2 (API-CON-04) | `CONSENT_REVOKED` | El profesional | «… revocó el consentimiento de datos de salud de Nutrición. Ya no ves su información de esa área.» |
| La corrida de las 15:00 y las 22:00 | `MEAL_LOG_REMINDER` y `TRAINING_LOG_REMINDER` | La persona | «Hoy todavía no registraste comidas. Si ya comiste, registralo en Nutrición.» |

**Cómo se arma la novedad:**
- **En la transacción del hecho:** si el hecho no se confirma, no hay novedad. Un reintento con la misma Idempotency-Key no da otra.
- **El nombre de quien la originó** se resuelve al leer con DL-040. El del profesional es el de su perfil. El de la persona, solo con un vínculo vigente entre los dos; si no, la referencia neutral.

## 6. Avisos push

**Cuándo sale:**
- **Después de confirmar.** El publicador pide una pasada del despachador a los 2 s y a los 20 s, fuera de la transacción. La corrida de recordatorios también despacha.

**Qué y a quién:**
- **Solo lo reciente y no leído:** novedades de las últimas 24 horas, registradas después de suscribir el teléfono, y que la persona no abrió.
- **Un aviso por teléfono por pasada:** nombra a la más nueva; las demás quedan `AGRUPADO`.
- **Lo que dice:** título «BE» y un texto genérico («Tenés una novedad.», «Tenés 2 novedades.», «Tenés un recordatorio para hoy.»).
- **Lo que lleva:** datos `{ type: "NEW_INTERNAL_UPDATE", referenceId }`. Sin nombres, sin áreas y sin contenido (UC-E08 §13.8.6).

**Cómo se manda:**
- **Sin duplicados:** tomar antes de mandar (INSERT o UPDATE condicionado) evita que dos pasadas manden lo mismo.
- **Presupuesto de 5 s, sin redirecciones y con la respuesta leída con tope:** el patrón de WP-08.

**Qué pasa si falla:**
- **Sin respuesta** (timeout, 5xx, 429): se reintenta en las pasadas siguientes, hasta tres intentos.
- **`DeviceNotRegistered`:** la suscripción se da de baja (`TOKEN_INVALIDO`).
- **El canal caído no borra nada:** la novedad sigue en el centro (UC-E08 E02).

**Configuración:**
- **`BE_AVISOS_PUSH=expo`** activa el canal; sin valor, `desactivado`, como en CI y desarrollo, donde no sale nada.
- **`EXPO_ACCESS_TOKEN`** es opcional: solo si se activa la seguridad reforzada de los avisos en Expo.

## 7. Recordatorios

**Cuándo corren:**
- **La tarea:** el cron `be-recordatorios` de Render corre a las 18:00 y a las 01:00 UTC, es decir, a las 15:00 y a las 22:00 de Argentina.
- **La franja:** la tarea llama a la ruta interna y la API decide la franja por su hora (14 a 18 → tarde; 21 a 23 → noche).

**Qué recuerda cada franja:**
- **Tarde:** comidas.
- **Noche:** comidas y entrenamiento.

**Cuándo hay recordatorio:**
1. La persona lo activó.
2. Tiene un plan vigente del área: versión efectiva con su Proceso ABIERTO.
3. Ese día no tiene registros. Una comida anulada no cuenta; una sesión cuenta si está registrada.
4. El PDP la deja registrar: vínculo vigente, B2 y A3. Se pregunta con `evaluarSinRegistrar`, que no deja una decisión de acceso.

**Garantías:**
- **No se repite:** cada recordatorio es único por persona, tipo, día y franja; repetir la corrida no crea otro.
- **No se duplica en el teléfono:** en la noche, una persona con los dos pendientes recibe un solo aviso.
- **La zona:** `America/Argentina/Buenos_Aires`, la de BE.

**El entrenamiento, todos los días:** el plan no tiene días de la semana, así que el recordatorio de entrenamiento también llega en un día de descanso. El texto lo contempla («Si entrenaste, registralo») y se apaga con su casilla. Ver DL-133, D-5.

## 8. UX

**Website:**
- **La campana:** en el encabezado, con «Novedades» y el número sin leer como dato, sin colores de alarma.
- **Las páginas:** `/pro/news` en el espacio profesional y `/account/news` en la cuenta.
- **«Abrir»:** marca leída y lleva a la pantalla que la resuelve (la ficha del asesorado o los vínculos). Lo que solo se ve en la app se dice.

**APK:**
- **La campana:** en la cabecera, junto al avatar, con el número.
- **Novedades:** una lista con «Sin leer» en palabras. Tocar una la marca leída y lleva a Nutrición, a Entrenamiento o a Vínculos.
- **Cuenta:**
  - «Tu nombre» (DL-009 y DL-040: la APK ya lo puede poner, cambiar o quitar).
  - «Avisos en este teléfono»: activarlos pide el permiso de Android en ese momento. La primera vez se encienden los dos recordatorios, que se apagan con su casilla.
- **Tocar un aviso** abre Novedades. Sin sesión, después de iniciarla (UC-E08 E03).
- **Antes de cerrar la sesión o la cuenta,** el teléfono deja de recibir los avisos de esa cuenta.

**El ícono del aviso:** es el isotipo en blanco con transparencia, como pide Android, generado por `scripts/generar-icono-de-aviso.cjs`. Lo verifica `scripts/icono-de-aviso.test.cjs`.

## 9. Lo que necesita Dirección para el teléfono

La parte de avisos de la APK necesita **Firebase Cloud Messaging**, porque Expo entrega los avisos de Android por FCM. Los pasos están en `docs/DESPLIEGUE.md`, «Avisos push», y son dos:
1. **El proyecto de Firebase** de BE, con su `google-services.json`, fuera del repo.
2. **La clave de la cuenta de servicio FCM V1,** subida a las credenciales del proyecto de Expo.

**Sin Firebase:**
- La APK se construye igual y el centro de novedades funciona.
- Cuenta dice «Los avisos todavía no están disponibles en esta versión de la app».

## 10. Pruebas y evidencia

| Prueba | Qué cubre |
|---|---|
| `test/integration/novedades.int-spec.ts` (8) | Las novedades de cada hecho, sin contenido. El nombre según DL-040. La primera lectura. El 404 de una ajena. Solo agregar. Teléfonos de una cuenta por vez. Preferencias con auditoría. Recordatorios con un Expo falso: el aviso sin contenido, el token de acceso, `DeviceNotRegistered`, la corrida repetida, una comida registrada, el B2 revocado y lo anterior a la suscripción |
| `test/integration/contrato.int-spec.ts` | NOV-01 a 06 con éxitos y errores declarados |
| `test/integration/schema.int-spec.ts` | `novedad` y `lectura_de_novedad` rechazan TRUNCATE |
| `packages/domain/src/novedades.test.ts` | Los textos del aviso y de la novedad (sin números ni áreas en el aviso), las franjas y la compatibilidad con un tipo desconocido |
| `apps/api/src/novedades/canal-expo.spec.ts`, `config/entorno.spec.ts` | Los tickets de Expo, el secreto comparado entero y las variables nuevas |
| `scripts/avisos-del-telefono.test.mjs` | La lógica de la APK: el permiso al activar, sin Firebase, un identificador por teléfono, renovar al entrar y retirar al salir |
| `scripts/copy-pantallas.test.cjs` | Las pantallas nuevas, con todas las listas de términos |

## 11. Fuera de alcance

- ~~Que el asesorado lea sus revisiones~~: se hizo el mismo día, aparte, con REV-A (DL-134). La novedad de una revisión abre esa revisión, completa.
- **Los recibos de Expo:** saber si FCM entregó el aviso.
- **El push en el navegador.**
- **Correo y WhatsApp.**

## 12. Deudas

- **DL-133** (decidida): la familia NOV, el modo, los recordatorios y las decisiones D-1 a D-10.
- **Antes de datos reales** (08 §42): el DPA de Expo, el texto de privacidad que nombre el canal y el tiempo de retención de las novedades y los avisos.
