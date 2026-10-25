# WP-ADMINISTRACION · habilitación de profesionales por área

**Estado: DEFINIDO y en implementación** desde el 2026-10-25, por el encargo de Dirección de ese día, que resuelve las
decisiones D-1 a D-7. El trabajo va en PR en borrador: **no está integrado en `main` ni desplegado**. La aprobación de la
integración es sobre el resultado completo. Lo que este documento decía el 2026-10-23 (lo que existía y lo que faltaba
decidir) está resumido al final, en §17.

## 0. En criollo

Una persona de Administración de BE, con una cuenta propia que no es de ningún profesional, entra con su contraseña y un
código de una aplicación de códigos (TOTP). Ve la lista de los profesionales registrados, con la situación de cada uno por
área (Nutrición, Entrenamiento, Antropometría), y desde la ficha de un profesional puede:
- registrar una observación sobre un área pendiente, verificarla o rechazarla;
- suspender un área verificada y rehabilitarla;
- conceder o retirar la habilitación para operar un área en BE.

Cada decisión pide un fundamento interno y, cuando corresponde, el texto que se le comunica al profesional. La pantalla
dice antes qué cambia y qué sigue igual. La decisión queda con su autor, su fundamento y su momento; al profesional le
llega una novedad, y a las personas vinculadas en esa área, un aviso con el efecto, sin los motivos internos. El
administrador **no ve** fichas, registros, planes ni fotos de ninguna persona: ni en sus pantallas ni llamando a la API.

**No es** un alta pública de profesionales ni una certificación de matrículas: «habilitado para operar en BE» no es
«matrícula certificada». Esta versión administra profesionales que ya existen en BE (§2).

## 1. Decisiones de Dirección (2026-10-25)

| # | Decisión |
|---|---|
| D-1 | **A.** Gestionar profesionales ya registrados, con las lecturas, la búsqueda, los filtros y el historial necesarios para operar. El alta pública, la presentación de documentos y la certificación de matrículas quedan para otro paquete. |
| D-2 | **TOTP**, segundo factor con una aplicación de códigos, obligatorio para Administración. |
| D-3 | **Comando interno.** El primer administrador se incorpora con una operación explícita y auditada. Nada concede el rol en cada arranque. |
| D-4 | **Fuera.** No se implementa la suspensión global de cuentas: las decisiones son sobre áreas profesionales. |
| D-5 | **Información administrativa mínima:** identidad profesional, áreas, estados, decisiones y fundamentos. Sin fichas, registros, fotos ni información de salud. |
| D-6 | **Novedades:** al profesional, las decisiones relevantes; a las personas vinculadas, cuando una suspensión o un restablecimiento afecta su relación. |
| D-7 | **Convivencia con la demostración:** la preparación de datos nunca sobrescribe una decisión administrativa. |

Más los criterios del encargo: identidad administrativa separada (no se convierte ninguna cuenta de la demostración y no
hay autoasignación del rol); el servidor comprueba rol y segundo factor en **todas** las operaciones administrativas; sin
visor global de auditoría; verificación y habilitación siguen siendo dos cosas.

## 2. Qué es hoy «un profesional ya registrado»

En el código de `main` (`3724d3d`), un profesional es **una identidad BE con un perfil profesional** (`PerfilProfesional`,
06:2766). El perfil y las trayectorias por área (`VerificacionProfesional`, `Habilitacion`) no los crea el profesional:
los crea el servicio interno de DL-036, por dos caminos:
1. **La siembra de `test` y `development`** (`BE_DEMO_PROFESIONALES`): cuentas sintéticas (`@example.invalid`) que se
   registraron por la API pública y después se declaran por su identidad. Al arrancar, la API les crea el perfil y deja
   cada área declarada verificada y habilitada. Desde este paquete, una entrada puede pedir el área **pendiente de
   revisión** (quinto campo `PENDIENTE`): se presenta, pero no se verifica ni se habilita, y espera a Administración.
2. **Las pruebas**, con el mismo servicio.

Una persona que se registró con `registrationIntent: PROFESSIONAL` pero no tiene perfil profesional **no es** un
profesional registrado: no aparece en la lista, porque no hay nada que administrar (el perfil, las áreas y la presentación
son PRO-01 a 08, fuera de D-1). **Esta versión no incorpora profesionales nuevos:** sin perfil creado por el servicio
interno, no hay ficha administrable.

**Cómo aparece en la lista:** con su nombre visible del perfil profesional, su tipo de perfil (sanitario o no), su correo
de acceso y, por área, la situación de su verificación y de su habilitación. Un área sin trayectoria dice «Sin
presentación» y no ofrece acciones: presentar es del profesional (PRO-01 a 08).

## 3. Requisitos

| ID | Qué cubre este paquete | Qué queda afuera |
|---|---|---|
| RF-007 | El administrador opera en el website (`/admin`), con su propia entrada | — |
| RF-011 | Revisar un área presentada y registrar observación o resolución trazable por área | La evidencia presentada (documentos): no existe en BE (D-1) |
| RF-012 | Verificar, rechazar o suspender un área, con fundamento; afecta solo esa área | — |
| RF-014 | Suspender y rehabilitar con motivo, área y autoría; la suspensión corta nuevas acciones sin borrar registros | La suspensión de cuenta entera (D-4, DL-020) |
| RF-015 | Verificación, habilitación, vínculo y consentimiento se evalúan por separado | — |
| RF-066 (P1) | Solo conceder y retirar la habilitación por área, explícitamente | La banda de capacidad y lo comercial |
| RF-061 (P1) | Avisos por Novedades al profesional y a las personas vinculadas (D-6) | — |
| 08 §25 | MFA obligatorio para el administrador, TOTP, códigos de recuperación de un solo uso, configurar y reemplazar auditados, reemplazar con reautenticación | SMS, llaves de seguridad |
| 08 §26 | Sesión administrativa revocable, más corta que el resto | — |
| 08 §28 | Sin datos de salud para el administrador | El break-glass (08 §28.2) |
| 08 §29 | Auditoría de las decisiones, del rol y del segundo factor | Un visor global de auditoría |

Fuera, aunque estén cerca: RF-008, 009, 010, 013 y 067 (alta y presentación del profesional), RF-068 (incidencias),
la certificación de matrículas, el break-glass y la capacidad del profesional.

## 4. Casos de uso

- **UC-P02 · Revisar y resolver la verificación de un área** (05 §4.6), adaptado: no hay presentación versionada (D-1),
  así que «la versión revisada» es la versión de la trayectoria del área en el momento de decidir (DL-156). Observar,
  verificar o rechazar un área `PENDIENTE`, con fundamento y confirmación.
- **UC-P03 · Suspender o rehabilitar un área** (05 §4.8): suspender un área `VERIFICADO`; rehabilitar una `SUSPENDIDO`.
  Rehabilitar restituye solo la verificación (REG-06-40).
- **UC-ADM-01 · Incorporar un administrador** (D-3): comando interno, auditado, sobre una identidad ya registrada y
  limpia (§6.1).
- **UC-ADM-02 · Entrar a Administración**: contraseña, después el segundo factor (código del autenticador o de
  recuperación); la primera vez, configurar el autenticador con el código de incorporación.
- **UC-ADM-03 · Recuperar el acceso**: un código de recuperación de un solo uso, y reemplazar el autenticador; si se
  perdieron las dos cosas, el operador restablece el segundo factor con el comando (§6.6).
- **UC-ADM-04 · Conceder o retirar la habilitación de un área** (REG-06-79; 06 §8.6.6): decisión explícita, separada de
  la verificación.
- **UC-ADM-05 · Consultar profesionales**: lista con búsqueda, filtros por área y situación, paginación y pendientes; ficha
  con la situación por área e historial cronológico de decisiones.

## 5. Permisos y decisiones

### 5.1 Qué puede decidir el administrador, por estado

Las transiciones son las del 06, ya en el dominio (`verificacion-profesional.ts`) y en los disparadores de la base. Este
paquete no agrega ninguna.

| Verificación del área | Acciones sobre la verificación | Efecto |
|---|---|---|
| Sin presentación | ninguna | presentar es del profesional (fuera de D-1) |
| `PENDIENTE` | Registrar observación · Verificar · Rechazar | la observación **no cambia el estado** (REG-06-37): sigue pendiente, sin suspender ni rechazar |
| `VERIFICADO` | Suspender | corta nuevas operaciones del área |
| `SUSPENDIDO` | Rehabilitar | vuelve a `VERIFICADO`; la habilitación queda como estaba |
| `RECHAZADO` | ninguna | volver a presentar es del profesional |

| Habilitación del área | Acción | Cuándo se ofrece |
|---|---|---|
| Sin habilitación | Conceder la habilitación | si el área tiene trayectoria de verificación |
| `CONCEDIDA` | Retirar la habilitación | siempre |
| `RETIRADA` | Conceder la habilitación | siempre (nueva concesión explícita) |

**Puede operar un área** quien la tiene `VERIFICADO` **y** con la habilitación `CONCEDIDA` (lo mismo que ya exige el PDP,
`evaluarAutorizacion`, y las comprobaciones de catálogos, plantillas y recetas). La pantalla lo dice en una frase («Puede
operar Nutrición en BE» o «No puede operar Nutrición: falta la habilitación»), sin convertir los dos estados en un
interruptor: cada uno se ve y se decide por separado.

Rehabilitar no concede una habilitación retirada; conceder no verifica. Ninguna decisión toca vínculos, consentimientos
ni planes.

### 5.2 Quién puede decidir

- **El servidor comprueba en cada operación administrativa** que la sesión sea administrativa, esté activa, tenga el rol
  vigente y el segundo factor vigente (§6.4). Ocultar un botón no autoriza nada.
- **Identidad separada.** El rol administrativo (`RolAdministrativo`) solo se asigna por el comando interno, sobre una
  identidad que no es profesional ni parte de ningún vínculo, solicitud o invitación (§6.1). No hay operación HTTP que
  asigne el rol, ni la propia identidad puede asignárselo.
- **Una identidad administrativa no opera como persona ni como profesional:** el inicio de sesión común (API-ACC-02 y la
  familia GOO) la rechaza con el 401 neutral, y una sesión administrativa no autentica en ninguna operación que no sea de
  Administración (`SesionGuard` la rechaza). Así, el administrador no lee datos de salud ni llamando directo a la API.
- **Una sesión profesional o de asesorado** que llama a una operación administrativa recibe `403 ACTION_FORBIDDEN`.

### 5.3 Lo que ve el administrador (D-5)

Del profesional: el nombre visible del perfil profesional, el tipo de perfil, el correo de acceso, el estado operativo de
la cuenta y la fecha del perfil. Por área: verificación, habilitación, desde cuándo, la última observación, si puede
operar y **cuántas** personas vinculadas recibirían un aviso (ACEPTADO o PAUSADO), sin nombres. El historial: las
decisiones y los hechos automáticos, con su autor o el servicio interno, estado anterior y posterior, fundamento, texto
comunicado y momento.

Nunca: nombres ni datos de las personas, planes, registros, fotos, mediciones, revisiones, formularios ni la auditoría
de otros accesos.

## 6. Autenticación administrativa

### 6.1 El primer administrador (D-3)

1. La persona crea una cuenta con el alta pública del website, como cualquiera (A1, A2 y la mayoría de edad).
2. El operador corre el comando interno, con acceso a la base del ambiente:
   `node apps/api/dist/administracion/comando.js incorporar --correo … --nombre … --fundamento … --operador …`
   - Se niega si la identidad no existe, si no es operativa, si tiene perfil profesional, verificaciones o habilitaciones,
     o si es parte de un vínculo, una solicitud o una invitación; si ya es administradora; y, en `test` o `development`,
     si el correo no es `@example.invalid`.
   - En una transacción: asigna el rol (`RolAdministrativo` VIGENTE, con nombre visible, fundamento y operador declarado),
     revoca sus sesiones comunes, emite un **código de incorporación** de un solo uso que vence a las 24 h y lo audita.
   - Imprime el código **una sola vez**, en la terminal del operador. La base guarda solo su huella SHA-256.
3. La persona entra en `/admin` con su correo y contraseña, escribe el código de incorporación, escanea el QR (o copia la
   clave) en su aplicación de códigos y confirma con un código. Recibe diez códigos de recuperación, que se muestran una
   sola vez.

Nada de esto ocurre al arrancar la API ni por una variable de entorno.

### 6.2 Primer factor

`API-ADM-01` (contraseña): mismo 401 neutral que el inicio de sesión común para un correo inexistente, una contraseña
incorrecta, una cuenta no operativa o una identidad sin rol administrativo; la causa queda solo en la auditoría. Límites:
los del inicio de sesión (por red, por red y correo, por correo). Abre una **sesión administrativa** (`Sesion.clase =
ADMINISTRATIVA`) que vence a las **8 h** (las comunes, a las 12 h: 08 §26.2), y responde qué falta: el segundo factor o su
configuración. **Con solo el primer factor no se lee ni se decide nada:** las únicas operaciones disponibles son las del
segundo factor, el estado de la propia sesión y cerrarla. Si en **10 minutos** no se completa el segundo factor, hay que
volver a empezar.

### 6.3 Segundo factor

- **TOTP** (RFC 6238: SHA-1, 6 dígitos, 30 s; la biblioteca `otpauth` 9.5.2, que en Node usa `node:crypto`). Se acepta el
  paso actual y uno de cada lado; **un código ya usado no vale otra vez** (se guarda el último paso aceptado y solo se
  acepta uno posterior).
- **Códigos de recuperación:** diez, de 60 bits, de un solo uso. Se guardan como HMAC-SHA-256 con una clave del servidor;
  usarlo lo marca usado en la misma transacción.
- **El secreto TOTP** se guarda cifrado con AES-256-GCM, con una clave derivada (HKDF) de `BE_CLAVE_DEL_SEGUNDO_FACTOR`,
  un secreto del ambiente que nunca se imprime. Sin esa clave, la administración responde «no configurada» (503) y el
  resto de BE sigue igual.
- **Intentos:** cinco códigos fallidos en una sesión la revocan. **Diez códigos del autenticador que no valen, seguidos,
  en cualquier sesión de la identidad, lo bloquean** (se cuentan en la base, en el autenticador, y no se vacían al abrir
  otra sesión ni al reiniciar la API): bloqueado, ni un código correcto se evalúa (`SECOND_FACTOR_LOCKED`). Lo desbloquea
  un código de recuperación, o el operador restableciendo el segundo factor. Además, diez intentos por identidad cada 15
  minutos (429, en memoria). Revisión de seguridad del 2026-10-25: sin el bloqueo, el cupo por sesión permitía unos 960
  intentos por día abriendo sesiones nuevas.
- **Pedidos simultáneos:** cada intento toma la fila del segundo factor de su sesión y, con ella tomada, vuelve a leer la
  sesión: un pedido que esperaba detrás del quinto fallido ya no se evalúa.
- **Configurar** (primera vez o después de un restablecimiento) exige el código de incorporación, **vigente también al
  confirmar**. La configuración pendiente vence a los 10 minutos.
- **Reemplazar el autenticador** (el anterior se perdió o se cambia de teléfono) exige una sesión con el segundo factor
  vigente **y la contraseña otra vez** (08 §25). El autenticador anterior sigue valiendo hasta que el nuevo se confirma:
  nunca queda la cuenta sin segundo factor. Al confirmar, salen diez códigos de recuperación nuevos y los anteriores dejan
  de valer, y **las otras sesiones administrativas de la identidad terminan** (`CREDENCIALES_ADMINISTRATIVAS_RENOVADAS`).
- **Regenerar los códigos de recuperación**: segundo factor vigente y contraseña; también terminan las otras sesiones.
- **El operador y una confirmación al mismo tiempo:** configurar y confirmar toman la identidad en modo compartido y el
  comando, en modo exclusivo; el comando además toma los autenticadores antes de revocarlos y falla entero si quedara
  uno activo. Un restablecimiento nunca dice «Listo» con un autenticador vivo.

### 6.4 Vigencia, reanudación y reautenticación (en el servidor)

- El segundo factor de una sesión vale mientras haya actividad administrativa: **15 minutos sin actividad** lo vencen, y
  hay que escribir un código nuevo (la contraseña no). A las **8 h** vence la sesión y hay que entrar de nuevo.
- La vigencia vive en la base (`SegundoFactorDeSesion`), no en el token ni en el navegador.
- **Recargar la página** reanuda la sesión administrativa con su propia cookie (HttpOnly, solo para
  `/api/v1/admin/auth/sessions`), con el mismo mecanismo rotativo de DL-147. La reanudación devuelve un token de la misma
  sesión y lo que **el servidor** dice de su segundo factor: si venció, la pantalla pide el código. Reanudar nunca valida
  un segundo factor.
- **Cerrar sesión** (`API-ADM-03`) finaliza la sesión en la base y borra la cookie.

### 6.5 Lo que se audita

`RegistroDeAuditoria`, en la misma transacción: el comando (incorporar, restablecer, retirar), cada primer factor (éxito
o rechazo con su motivo), cada intento de segundo factor (también el bloqueo y el desbloqueo del autenticador, un paso
que no corresponde, un plazo vencido y el cupo de 429), la configuración y el reemplazo del autenticador, el uso de un
código de recuperación, la regeneración de códigos, cada lectura administrativa y cada decisión. **Los rechazos de los
guards también:** una sesión común en una ruta de Administración (`SESION_NO_ADMINISTRATIVA`), una sesión administrativa
que ya no vale (revocada, vencida, sin rol) y una lectura o decisión sin el segundo factor (`MFA_REQUERIDO:…`), con la
operación que se intentó. Nunca un secreto, un código, un token ni el QR: ni en la auditoría, ni en los logs, ni en las
capturas.

### 6.6 Si el administrador pierde el autenticador

1. **Con un código de recuperación:** entra con la contraseña y un código de recuperación, y reemplaza el autenticador
   (§6.3). El código usado no vuelve a valer. Es también la salida si el autenticador quedó bloqueado por códigos que no
   valen: el código de recuperación lo desbloquea.
2. **Sin autenticador ni códigos:** el operador corre
   `node apps/api/dist/administracion/comando.js restablecer-segundo-factor --correo … --fundamento … --operador …`. En una
   transacción, revoca el autenticador y los códigos, revoca las sesiones administrativas y emite un código de
   incorporación nuevo (24 h). La persona vuelve a configurar el autenticador como la primera vez. **No hay un modo sin
   segundo factor:** sin completar la configuración, no hay acceso.
3. **Si además perdió la contraseña:** BE todavía no tiene recuperación de contraseña (RF-005). El operador retira el rol
   (`retirar`) e incorpora otra identidad.

El procedimiento completo, con el registro manual del operador (08 §28.3-bis), está en
`EVIDENCIA/ADMINISTRACION/OPERACION.md`.

## 7. Historia y auditoría de las decisiones

`EventoDeVerificacion` se extiende de forma explícita, sin tocar sus filas anteriores:
- `tipo_de_actor`: `SERVICIO_INTERNO` (todas las filas que ya existían y lo que hace la siembra) o `ADMINISTRADOR`;
- `administrador_id`: la identidad del administrador, solo con `ADMINISTRADOR` (CHECK); `actor_servicio`, solo con el
  servicio interno;
- `mensaje_al_profesional`: el texto comunicado, separado del `fundamento` interno;
- `version_previa`: la versión de la trayectoria al decidir (la «versión revisada», DL-156).

Cada decisión registra administrador, profesional, área, acción (el tipo del hecho), estado anterior y posterior,
fundamento, texto comunicado y momento. La tabla sigue siendo de solo agregar. El historial que ve el administrador es el
de estas decisiones: no hay visor global de auditoría.

## 8. Concurrencia, idempotencia y efecto real

- **Una decisión, una transacción:** el cambio de estado, su hecho, las novedades, la auditoría y el registro de
  idempotencia confirman juntos o no confirma ninguno. El aviso push sale después de confirmar (07 §23): una novedad nunca
  afirma una decisión que no se guardó.
- **Doble clic o reintento:** `Idempotency-Key` obligatoria; el reintento con la misma clave devuelve la misma respuesta
  sin repetir la decisión ni los avisos. La clave única de cada novedad (tipo, destinatario, hecho) lo sostiene también.
- **Dos administradores con información vieja:** cada área tiene una versión (`a<verificación>-<habilitación>`); la
  decisión la manda como `expectedVersion`. Si cambió, `409 VERSION_CONFLICT`: no se decide nada, la pantalla conserva lo
  escrito, vuelve a leer y muestra la situación actual.
- **Bloqueos, en el orden único del proyecto** (`prisma/concurrencia.ts`): la identidad del profesional, después su
  verificación y su habilitación del área. El PDP y las comprobaciones de catálogos, plantillas y recetas toman esas filas
  en modo compartido: una decisión y una operación profesional en curso quedan siempre una antes de la otra.
- **Las credenciales del administrador, también en ese orden:** renovar los códigos de recuperación (API-ADM-09) toma la
  identidad del administrador en modo exclusivo, como el comando del operador, y con ella tomada vuelve a leer la sesión y
  su segundo factor. Configurar y confirmar el autenticador la toman en modo compartido. Queda como máximo un lote de
  códigos vigente, y una renovación que quedó ordenada después de una revocación no emite códigos (pasada de cierre, §14).
- **Efecto inmediato:** el PDP y esas comprobaciones leen el estado en cada pedido, sin caché. Una sesión abierta del
  profesional no sirve para operar el área suspendida desde el pedido siguiente; las otras áreas siguen. No se revocan
  las sesiones del profesional (DL-157).
- **Conservación:** suspender o retirar no borra ni oculta planes, registros, borradores ni historia. Rehabilitar o
  conceder no recupera nada: cada pedido siguiente vuelve a pasar por el PDP completo, así que un vínculo finalizado o un
  consentimiento revocado siguen cortando.
- **La persona y sus propios datos:** se conservan las reglas vigentes. Su historia propia se sigue leyendo. Lo que se
  decide con el par profesional–persona (lo de «Hoy» y registrar en el plan de ese profesional) queda no disponible
  mientras el área del profesional no opera, como con un consentimiento revocado (UC-P12 E06).

## 9. Avisos (D-6)

Tipos nuevos de novedad, con los mecanismos de WP-NOVEDADES-Y-AVISOS:

| Tipo (`kind`) | A quién | Cuándo | Abre |
|---|---|---|---|
| `ADMINISTRATIVE_DECISION` | al profesional | cada decisión sobre un área suya | el centro de novedades |
| `PROFESSIONAL_ACCESS_SUSPENDED` | a cada persona con un vínculo ACEPTADO o PAUSADO en esa área | cuando el profesional deja de poder operar el área (suspender o retirar la habilitación) | sus vínculos |
| `PROFESSIONAL_ACCESS_RESTORED` | ídem | cuando vuelve a poder operar (rehabilitar o conceder) | sus vínculos |

- Al profesional: el área, la decisión, el texto que le comunicó Administración y qué significa («tus planes y registros se
  conservan»). Nunca el fundamento interno.
- A las personas: el efecto operativo, sin motivos. «Este profesional tiene suspendido el acceso a Nutrición en BE» y qué
  pasa mientras tanto; al restablecer, que el acceso depende de que el vínculo y la autorización sigan vigentes.
- La autoría queda en la base (la identidad del administrador); la respuesta la muestra como de BE (`source: null`).
- **Compatibilidad con las APK publicadas:** `kind` y `open.view` son texto en el contrato y en la candidata 0.17.0-3; las
  vistas son de las que ya conoce (`NEWS`, `RELATIONSHIPS`); el alcance es uno de los tres. La 0.13.2 no lee novedades. Lo
  prueba la lectura congelada de DL-152, con estos tipos presentes.
- Sin canal de soporte ni botones de acciones que no existen: el texto no promete «responder» ni «subsanar».

## 10. Convivencia con la demostración (D-7)

`prepararProfesional` (la siembra al arrancar y las pruebas):
- **no toca un área con una decisión administrativa** (un hecho con `tipo_de_actor = ADMINISTRADOR` para esa identidad y
  esa área): ni la verificación ni la habilitación. No alcanza con proteger `SUSPENDIDO`: tampoco verifica un pendiente
  observado ni vuelve a conceder una habilitación retirada;
- toma las filas del área con bloqueo, en el orden único: una decisión simultánea queda antes o después;
- **nunca prepara como profesional a una identidad administrativa;**
- con el quinto campo `PENDIENTE` en `BE_DEMO_PROFESIONALES`, presenta el área y la deja pendiente.

Se prueba reiniciando la API y repitiendo la preparación después de una observación, una suspensión y una retirada.

## 11. Operaciones

Familia propia de BE, **ADM** (DL-155): el 09 define PRO-09 a 13 sobre «presentaciones» que no existen en esta versión
(D-1), así que se adaptan con IDs propios y se citan como fuente. Prefijo `/api/v1`.

| ID | Método y ruta | AuthN | Idempotencia | Fuente |
|---|---|---|---|---|
| API-ADM-01 | `POST /admin/auth/sessions` | PUBLIC | no | 08 §25 · ACC-02 |
| API-ADM-02 | `POST /admin/auth/sessions/resume` | cookie | no | DL-147 |
| API-ADM-03 | `DELETE /admin/auth/sessions/current` | sesión administrativa | semántica | ACC-03 |
| API-ADM-04 | `GET /admin/auth/sessions/current` | primer factor | — | ACC-05 |
| API-ADM-05 | `POST /admin/auth/sessions/current/second-factor` | primer factor | no | 08 §25 |
| API-ADM-06 | `POST /admin/auth/sessions/current/recovery-code` | primer factor | no | 08 §25 |
| API-ADM-07 | `POST /admin/auth/second-factor/enrollment` | primer factor (+ incorporación o contraseña) | no | 08 §25 |
| API-ADM-08 | `POST /admin/auth/second-factor/enrollment/confirm` | primer factor | no | 08 §25 |
| API-ADM-09 | `POST /admin/auth/recovery-codes` | SESSION_MFA + contraseña | no | 08 §25 |
| API-ADM-10 | `POST /admin/professionals/query` | SESSION_MFA | — | PRO-09 |
| API-ADM-11 | `GET /admin/professionals/{professionalId}` | SESSION_MFA | — | PRO-10 |
| API-ADM-12 | `GET /admin/professionals/{professionalId}/history` | SESSION_MFA | — | PRO-10 |
| API-ADM-13 | `POST /admin/professionals/{professionalId}/scopes/{scope}/decisions` | SESSION_MFA | `Idempotency-Key` | PRO-11, 12 y 13 |

`API-ADM-10` lleva la búsqueda en el cuerpo, no en la URL (DL-127). `API-ADM-13` recibe `{ expectedVersion, decision,
rationale, messageToProfessional }`, con `decision` = `OBSERVE`, `VERIFY`, `REJECT`, `SUSPEND`, `REINSTATE`,
`GRANT_ENABLEMENT` o `WITHDRAW_ENABLEMENT`. Errores: 400, 401, 403 (`ACTION_FORBIDDEN`, `MFA_REQUIRED`), 404 (profesional
inexistente o sin perfil, el mismo), 409 (`VERSION_CONFLICT`, `IDEMPOTENCY_KEY_REUSED`), 422 (`INVALID_STATE_TRANSITION`,
`RATIONALE_REQUIRED`, `VALIDATION_FAILED`). Los esquemas viven en `packages/domain/src/contratos-administracion.ts` y el
OpenAPI se genera de ahí.

Comando interno (no HTTP): `incorporar`, `restablecer-segundo-factor` y `retirar` (§6).

## 12. Datos (una migración)

- `RolAdministrativo`: identidad, estado (`VIGENTE` → `RETIRADA`), nombre visible, fundamento, operador declarado;
  como máximo uno vigente por identidad.
- `CodigoDeIncorporacion`: huella SHA-256, motivo (incorporación o restablecimiento), vencimiento, uso o anulación.
- `FactorTotp`: secreto cifrado, estado (`PENDIENTE`, `ACTIVO`, `REEMPLAZADO`, `REVOCADO`, `DESCARTADO`), último paso
  aceptado; uno activo y uno pendiente por identidad, como máximo.
- `CodigoDeRecuperacion`: huella HMAC, lote, uso, invalidación.
- `SegundoFactorDeSesion`: por sesión administrativa, cuándo se verificó, con qué, la última actividad y los intentos.
- `Sesion.clase` (`PERSONAL` | `ADMINISTRATIVA`), inmutable; motivos de revocación nuevos.
- `EventoDeVerificacion`: `tipo_de_actor`, `administrador_id`, `mensaje_al_profesional`, `version_previa` (§7).
- `TipoDeNovedad`: los tres tipos de §9.

Los disparadores de la base exigen las transiciones de cada estado y que lo inmutable no cambie.

## 13. Experiencia de uso

Sigue `docs/ux/GUIA-UX-UI.md` (escritorio primero: 1440, 1280 y 1024; Claro y Azul noche) y las reglas de B10-03.

- **Entrada** (`/admin`): correo y contraseña; después el código, o la configuración con el código de incorporación, o
  «Usar un código de recuperación». Explica que es la entrada de Administración y que no es para profesionales.
- **Lista**: búsqueda por nombre o correo, filtros por área y por situación, paginación, y los pendientes de revisión a la
  vista, con su cantidad. Cada fila: el profesional y su situación por área, con texto y forma, no solo con color. Volver
  de una ficha conserva filtros, búsqueda y posición.
- **Ficha**: identidad; una tarjeta por área con verificación, habilitación, si puede operar, desde cuándo y sus acciones;
  debajo, el historial cronológico. La nota «BE no certifica matrículas ni credenciales profesionales» está a la vista.
- **Confirmación** (diálogo modal): profesional, área, qué cambia, qué sigue igual y a quiénes se avisa; el fundamento
  interno y el texto para el profesional, con sus validaciones. La acción con efecto no es la opción por defecto.
- **Estados**: cargando, vacío, sin acceso, segundo factor vencido, error con reintento y conflicto (conserva lo escrito y
  muestra la situación actual).
- Teclado, foco y diálogos accesibles; mensajes anunciados; la letra no se achica para que entre más.

## 14. Pruebas

| Criterio del encargo | Pruebas |
|---|---|
| 1. Entra con MFA y opera; sin MFA no accede | integración `administracion-acceso`; recorrido `administracion` |
| 2. Profesional o asesorado sin privilegios administrativos | integración `administracion-permisos` |
| 3. Sin datos de salud, ni llamando a la API | integración `administracion-permisos` (cada operación de salud con la sesión administrativa: 401) |
| 4. Transiciones válidas e inválidas | dominio `administracion.test.ts`; integración `administracion-decisiones` |
| 5. Suspender Nutrición bloquea esa área y no otra | integración `administracion-efectos` |
| 6. Restablecer no recupera consentimientos ni vínculos | integración `administracion-efectos` |
| 7. Autor y fundamento; reintentos y conflictos | integración `administracion-decisiones` |
| 8. Avisos una vez y solo de decisiones confirmadas | integración `administracion-avisos`; DL-152 con los tipos nuevos |
| 9. Reiniciar y volver a preparar no deshace decisiones | integración `administracion-siembra` |
| 10. Configuración y recuperación de MFA sin vía sin protección | integración `administracion-acceso` (reutilización, intentos, vencimientos, reemplazo, restablecimiento); `administracion-renovacion-de-codigos` (renovaciones simultáneas y frente al operador o al cierre de la sesión) |

Pruebas del 11A que este paquete ejercita: TEST-RF-007, TEST-RF-011, TEST-RF-012, TEST-RF-014 y TEST-AUTH-010 (la
identidad administrativa no obtiene actoría profesional). Las lecturas congeladas de DL-152 no se tocan. La automatización
no reemplaza la prueba con personas ni con un lector de pantalla.

**Revisión de seguridad del 2026-10-25.** Una revisión de solo lectura del código (otra instancia del mismo modelo, no una
persona) buscó saltear el segundo factor, lecturas indebidas, decisiones duplicadas, conflictos silenciosos y
automatismos que pisen una decisión humana. Encontró cinco puntos, todos del segundo factor, y ninguno de las otras cuatro
clases; los cinco y uno menor quedaron corregidos, cada uno con su prueba (bloque «Revisión de seguridad» de
`administracion.int-spec.ts`), y cada prueba se comprobó contra su mutación (sin la corrección, falla):

| # | Qué pasaba | Corrección |
|---|---|---|
| F1 | El cupo de cinco era por sesión y cada entrada abría otra: unos 960 intentos por día | Diez fallidos seguidos bloquean el autenticador, en la base, hasta un código de recuperación o el operador |
| F2 | Un pedido que esperaba detrás del quinto fallido se evaluaba sobre la sesión ya revocada | Con la fila tomada, se vuelve a leer la sesión y sus intentos |
| F3 | Un restablecimiento simultáneo a una confirmación podía dejar vivo el autenticador nuevo | El comando toma los autenticadores y la identidad; configurar y confirmar la toman en modo compartido; si quedara uno activo, el comando falla entero |
| F4 | Reemplazar el autenticador o generar códigos dejaba vivas las otras sesiones | Terminan, con su motivo; la propia sigue |
| F5 | Los rechazos de los guards no dejaban rastro | Se auditan con la operación intentada |
| menor | El código de incorporación se miraba al empezar la configuración, no al confirmarla | Tiene que seguir vigente al confirmar |

**Pasada de cierre del 2026-10-25 (encargo de Dirección, punto 1).** La hipótesis: renovar los códigos de recuperación no
tomaba un bloqueo común ni volvía a leer la sesión. Se comprobó con PostgreSQL real y pruebas que ordenan las operaciones
con bloqueos, no con pausas (`administracion-renovacion-de-codigos.int-spec.ts`), y **se confirmó**. Dos renovaciones
simultáneas dejaban dos lotes vigentes, y una renovación que ya había pasado el guard emitía códigos después de un
restablecimiento, una retirada o el cierre de su sesión. La corrección toma la identidad en modo exclusivo y vuelve a leer
la sesión dentro de la transacción. Las 8 pruebas fallan sin ella, y cada parte tiene una mutación que la detecta. Detalle:
`EVIDENCIA/ADMINISTRACION/CONCURRENCIA-DE-LA-RENOVACION.md`.

## 15. Fuera del paquete

El alta pública de profesionales (PRO-01 a 08), la presentación y la revisión de documentos, la certificación de
matrículas, la suspensión de la cuenta entera (DL-020), el break-glass, las incidencias (RF-068), la capacidad (RF-066 en
lo comercial), la gestión de administradores desde la pantalla (es por comando), la aprobación de cuatro ojos (08 §28.3:
con un solo operador), un visor global de auditoría y la recuperación de contraseña.

## 16. Tensiones con el legajo

- **DL-155** · la familia ADM en lugar de PRO-09 a 13 (no hay presentaciones), y la lista de profesionales que B10-03 §21
  no permitía inventar: la pide Dirección en D-1.
- **DL-156** · «la versión revisada» (UC-P02, REG-06-38) es la de la trayectoria del área, no la de una presentación.
- **DL-157** · el 08 §26.3 y PRO-12 dicen que suspender una verificación revoca las sesiones del profesional. Revocarlas
  cortaría también las otras áreas, contra el criterio de Dirección («no afecta otras áreas»). Provisorio: no se revocan; el
  corte es por operación (08 §26.4: «la sesión autentica, no autoriza»).

## 17. Historia de este documento

- **2026-10-23** (encargo de consolidación, punto 8): se registró la intención, lo que existía (el modelo de datos, la
  historia, las reglas, el servicio interno de DL-036 y el efecto en el PDP), sus dependencias (MFA, primer administrador,
  sin salud, vínculos vigentes, siembra, documentos) y las siete decisiones abiertas con la recomendación del ejecutor.
  Integrado en `main` con #205, sin aprobar decisiones.
- **2026-10-25**: Dirección resolvió D-1 a D-7 y autorizó definir, implementar y probar el paquete, sin integrar ni
  desplegar. Este documento pasa a ser la definición.
- **2026-10-25, más tarde**: la revisión de seguridad (§14) y sus correcciones en el segundo factor: bloqueo por fallos
  seguidos, pedidos simultáneos, el comando del operador, las otras sesiones al renovar credenciales y la auditoría de los
  guards. Las migraciones del paquete, que todavía no se desplegaron en ningún ambiente, se corrigieron en el lugar.
- **2026-10-25, pasada de cierre** (encargo de Dirección): la concurrencia al renovar los códigos de recuperación,
  confirmada y corregida (§8 y §14). Además, el procedimiento de la clave del segundo factor y del primer administrador
  (`EVIDENCIA/ADMINISTRACION/OPERACION.md`), con la variable en un PR de configuración que se integra antes. El alcance
  no cambia: perfiles profesionales que ya existen; el alta completa de profesionales nuevos sigue pendiente.
