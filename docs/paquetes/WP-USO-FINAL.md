# WP-USO-FINAL — lo que la demostración no necesitaba y el uso real sí

> **Estado:** DECLARADO el 2026-11-11. Ese mismo día Dirección **ratificó UF-D1 a UF-D13** y pidió la **etapa 1**: lo que
> bloquea y tiene que entrar antes de congelar la app el 25/11. La etapa 1 (UF-12, UF-00, UF-01 y UF-08) quedó
> **integrada** el 2026-11-12 con #253 (§12). La **etapa 2**, el resto del P0 salvo UF-10, quedó declarada ese mismo día
> (§13) y se programa en un PR en borrador, sin integrar.
>
> **Encargo** (Dirección, 2026-11-11):
> - «En la creación de la cuenta ya tiene que ponerle el nombre. Empecemos a completar esas secciones que por ser datos
>   de prueba no tuvimos en cuenta, pero ya lo tenemos que armar como para el uso final: poner el nombre de la persona no
>   puede ser una opción. Si se te ocurren otras cosas que ya tenemos que estar puliendo, decime.»
> - En el website, a quien recibe el acompañamiento se lo nombra por su nombre («Diego no la ve hasta que actives»).
>   Donde no hay un nombre propio posible, se dice «persona», nunca «asesorado». Eso lo programa WP-EDITORES-PROFESIONAL
>   (PR #251, ED-06 y ED-D9) y acá no se duplica (§10).
> - Sobre las apps anteriores: «no te preocupes de las apps viejas: hasta que te diga, solo mi celular tiene las apps, o
>   2 o 3 personas de mi familia que instale para probar». Desde ese mismo día, la descarga del website sirve siempre la
>   última versión: la 0.23.0-candidata.2 hasta el 2026-11-12 y, desde ese día, la 0.24.0-candidata.1.
>
> **Fuente:** el código de `main` `bb757d9`, leído con git y grep, sin levantar la API, la web ni la base. Se suman cinco
> hallazgos de una revisión de Codex sobre el mismo commit, verificados uno por uno (§3, filas 26 a 30).
>
> **Decisiones:** DEUDA_LEGAJO DL-169 (lo que decidió Dirección) y UF-D1 a UF-D13 (§7, cada una con su recomendación).
>
> **Esta declaración:** rama `wp-uso-final`, desde `main` `bb757d9`. Es solo documentación: no tiene código ni migraciones.

## 0. Legajo y decisiones que cita

- **08 §42 (Ready-for-Real-Data):** 24 condiciones que se exigen antes del primer dato real sensible. El documento dice
  que «hoy NO se cumple». La condición 1, la validación jurídica de los textos, «no es dispensable por una mera acta de
  Dirección».
- **El resto del 08:**
  - §33: en `test` van solo datos sintéticos;
  - §12: los textos versionados;
  - §18 y §19: la supresión y los derechos del titular;
  - §24.7: la mayoría de edad.
- **04 RF-005** (P1): recuperar el acceso local sin crear otra identidad y con una respuesta inicial neutra.
- **Las operaciones bosquejadas en el 09:**
  - en el 09 v0.12, API-ACC-P1-01 y 02 (la recuperación), API-RGT-01 a 03 (los derechos del titular) y API-EXP-01 y 02
    (la exportación propia);
  - en el 09 v0.8, API-PRO-01 a 08 (el perfil profesional propio y sus presentaciones).
- **DL-009 (opción B) y DL-040** (2026-10-15): el nombre visible es un solo campo, de la persona. Lo ve el profesional
  con un vínculo vigente; sin nombre, ve la referencia neutral.
- **DL-024:** la UI registra solo a quien recibe el acompañamiento (`registrationIntent: 'ADVISEE'`).
- **DL-036 y DL-155:** el perfil profesional lo crea el servicio interno, y Administración verifica y habilita por área.
- **DL-138, en especial D-10:** cuando el alta empezó a exigir la declaración de mayoría de edad, el alta de las APK
  instaladas recibe 422 TERMS_VERSION_NOT_ACCEPTABLE. Es el código que esas APK ya traducen a «Actualizá la app para
  continuar». Es el precedente de UF-D1.
- **DL-152:** lo que leen las APK instaladas, congelado por versión. Lo enmienda UF-00.
- **Otras deudas que se tocan:**
  - DL-114, la excepción de la auditoría, que vence el 2026-11-30 a las 21:00 (Argentina);
  - DL-015, el limitador en memoria;
  - DL-019 y DL-026, que no purgan la idempotencia ni las sesiones;
  - DL-120, los medios guardados en PostgreSQL;
  - DL-159, la cartera por conjuntos (#222).
- **Otros paquetes:**
  - `WP-ADMINISTRACION.md` §2 (qué es hoy un profesional) y §6 (el primer administrador);
  - WP-EDITORES-PROFESIONAL (#251): ED-06, ED-08, ED-D7 y ED-D9.

## 1. Objetivo y demostrables

BE funciona de punta a punta para la demostración, pero varias cosas se resolvieron pensando en datos de prueba. Este
paquete junta lo que falta para que personas y profesionales reales usen BE, y lo ordena por lo que bloquea. **No
reemplaza el gate del 08 §42:** UF-02 lo recorre condición por condición, y lo que no es código queda a nombre de su
dueño (§9).

Lo que se va a poder mostrar:
1. **Crear una cuenta pide el nombre,** con correo o con Google. Con Google, el nombre llega propuesto y la persona lo
   confirma o lo corrige.
2. **Una cuenta que ya existe sin nombre lo completa al entrar,** en la web y en la app nueva, antes de seguir.
3. **Un profesional real entra a BE por Administración,** con su nombre profesional y su matrícula verificada.
4. **Quien olvidó la contraseña la recupera** sin perder su historia ni sus vínculos.
5. **Los textos legales son los de verdad,** y las cuentas que ya existen aceptan la versión nueva.
6. **La persona descarga sus datos y pide la supresión** por un canal publicado.
7. **En producción no aparece nada de prueba:** ni los avisos ni el catálogo de demostración.
8. **Producción existe aparte de `test`,** con una restauración probada.
9. **El documento del gate** dice, condición por condición, qué está, con su evidencia, y qué falta, con su dueño.

## 2. Lo que no cambia

- **«Ubicar, nunca calificar».** El anti-enumeración, la autorización en el servidor y la historia inmutable siguen
  igual. Las versiones del perfil propio guardadas con el nombre en `null` quedan en la historia.
- **Quién ve el nombre** (DL-040): el profesional lo ve solo con un vínculo vigente. Antes de aceptar o después de
  terminar, ve la referencia neutral. El correo no lo ve nunca.
- **`/me` (API-ACC-05) no trae el nombre:** su respuesta es estricta y la lee la última APK. El nombre se lee aparte.
- **`test` sigue siendo de datos sintéticos** (08 §33) mientras el gate no se cumpla.
- **El legajo no se toca,** ni `docs/MANIFEST.sha256` ni `render.yaml`. Los cambios de infraestructura los decide y los
  aplica Dirección (UF-10).

## 3. Inventario (verificado en `main` `bb757d9`)

Severidad: **bloquea** (impide el uso real), **importante** o **pulido**. «Toca» dice qué capas cambian.

| # | Ítem | Estado | Severidad | Toca | APK nueva | Evidencia | Parte |
|---|---|---|---|---|---|---|---|
| 1 | El alta con correo no pide el nombre: el perfil del pedido está vacío por contrato | confirmado | bloquea | API, web, app, base | sí | `packages/domain/src/contratos.ts:274` (`profile: z.strictObject({})`, «ninguno aprobado», DL-009); `apps/web/src/app/register/formulario-de-registro.tsx:79`; `apps/mobile/src/pantallas/registro.tsx:48` | UF-01 |
| 2 | El alta con Google tampoco lo pide, y la API no lee el nombre de la cuenta de Google | confirmado | bloquea | API, web, app | sí | `contratos-acceso-google.ts:38`; `verificador-de-google.ts:133` (devuelve solo `sub` y correo) | UF-01 |
| 3 | El nombre se puede quitar: «Quitaste tu nombre: los profesionales ven tu referencia» | confirmado | importante | API, web, app | sí | `perfil-propio.service.ts:70` (acepta `null`); `apps/web/src/app/account/cuenta.tsx:244`; lo congelado de API-ACC-06 lo admite | UF-01 |
| 4 | Las cuentas sin nombre se ven como «Asesorado · c36743», y la app ofrece «Agregá tu nombre» como opción | confirmado (cuántas hay en `test`: a verificar en la base) | importante | web, app | sí | `contratos-perfil-propio.ts:41`; `apps/mobile/src/perfil.ts:89` | UF-01 (el texto, #251) |
| 5 | El nombre profesional es obligatorio en la base, pero lo pone solo el servicio interno y nadie lo puede cambiar | confirmado | importante | API, web (`/admin`) | no | `prisma/schema.prisma:632`; `verificacion.service.ts:67` (única creación) | UF-01, UF-04 |
| 6 | No hay cómo entra un profesional real: la siembra solo corre en `test` o `development` con `@example.invalid`, la UI registra solo personas y no hay presentación (PRO-01 a 08) | confirmado | bloquea | API, web | no | `siembra-demo.service.ts:32,42`; `cliente-http.ts:517` (DL-024); `WP-ADMINISTRACION.md` §2 | UF-04 |
| 7 | La matrícula no se guarda ni se muestra | confirmado | importante | base, API, web, app | sí, si se muestra en la app | `schema.prisma:628-639`; `WP-ADMINISTRACION.md:23` («no es una certificación de matrículas») | UF-04 |
| 8 | No hay recuperación de contraseña (RF-005, P1) | confirmado | bloquea | API, web, app | sí | `EVIDENCIA/ADMINISTRACION/OPERACION.md:122`; 04 RF-005 | UF-03 |
| 9 | BE no manda correos: no tiene proveedor ni biblioteca | confirmado | bloquea (para 8 y 10) | API | no | `OPERACION.md:52-53` («BE no le escribe»); `apps/api` no tiene biblioteca de correo | UF-03 |
| 10 | El correo de las cuentas con contraseña no se verifica (el de Google, sí) | confirmado | importante | API, web, app | sí | `registro.service.ts` (sin verificación); `verificador-de-google.ts:132` | UF-13 |
| 11 | Los textos legales son de demostración: 11 textos llevan «Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.» | confirmado | bloquea | dominio, API, web, app | sí | `packages/domain/src/textos.ts:70` y los ids `*-demo` y `*-propuesta` (341-465) | UF-05 |
| 12 | Una versión nueva de los términos o de la privacidad no se puede aceptar desde una cuenta que ya existe: solo se acepta en el alta | confirmado | bloquea (cuando cambien los textos) | API, web, app | sí | `registro.service.ts:51`; no hay operación para A1 ni A2 después del alta | UF-05 |
| 13 | Los avisos de prueba están escritos fijos: «Ambiente de prueba · solo datos sintéticos», «usá un correo inventado», «Usá una cuenta de Google de prueba», «Descargar la APK de prueba» | confirmado | bloquea (en producción) | web, app | sí | `apps/mobile/src/cabecera.tsx:85`; `apps/web/src/components/pie.tsx:28`; `formulario-de-registro.tsx:167`; `pantallas/registro.tsx:109`; `copy-acceso-google.ts:44`; `apps/web/src/app/page.tsx:120` | UF-08 |
| 14 | El catálogo de demostración (alimentos con valores sintéticos y ejercicios) lo crean las migraciones: una base de producción también lo tendría | confirmado | bloquea (estimaciones de Nutrición) | API, base | no | `prisma/migrations/20260920100000_circuito_nutricional/migration.sql:841` y siguientes («Valores sintéticos de demostración»); `20260921100000_circuito_de_entrenamiento/migration.sql:689` | UF-09 |
| 15 | Faltan fotos de recetas: se muestra «Sin imagen de referencia» | el texto, confirmado; cuántas faltan, a verificar | pulido | datos | no | `copy-recetas.ts:169` | UF-23 |
| 16 | Derechos de la persona: cerrar la cuenta existe; descargar los datos y pedir la supresión, no. Los textos dicen que el canal «se publicará» | confirmado | bloquea | API, web, app | sí | `cierre.service.ts:28`; `textos.ts:101,117`; API-RGT y API-EXP sin implementar | UF-06 |
| 17 | No hay canal de soporte ni de contacto | confirmado | bloquea | web, app, textos | sí | `textos.ts:87` («el canal que se publique antes de operar con datos reales»); no hay `mailto:` ni contacto en la web ni en la app | UF-07 |
| 18 | Producción no existe: hay solo `test`, sin copias ni restauración probadas | confirmado | bloquea | infraestructura | sí (una build que apunte a producción) | `render.yaml` (`be-db-test`, `be-api` con `APP_ENV` test, `be-web` y el cron); `apps/api/src/config/entorno.ts:9` (admite `production`); `docs/QUE-FALTA.md:176-183` | UF-10 |
| 19 | El profesional no tiene segundo factor (08 §42, condición 6) | confirmado | bloquea | API, web | no | `segundo-factor.ts` existe solo en `apps/api/src/administracion/` | UF-11 |
| 20 | DL-114 vence: desde el 2026-12-01 a las 00:00 UTC, la auditoría falla y la CI se corta | confirmado | bloquea (la CI) | CI | no | `scripts/auditoria-de-dependencias.cjs:72,92`; node-forge ya está en 1.4.2 (`package-lock.json:11814`); queda zod 3.25.76 por `@expo/cli` 57.0.25 | UF-12 |
| 21 | El formato argentino: la hora en 24 h ya está en los ayudantes de la web y de la app; que la fecha sea igual en todas las pantallas está a verificar | 24 h, confirmado; la fecha, a verificar | pulido | web, app | tal vez | `apps/web/src/lib/formato.ts:6` (`h23`); `apps/mobile/src/formato.ts:41` | UF-22 |
| 22 | Términos y privacidad: la web los enlaza en el pie de las páginas públicas; la app los muestra en el alta. Después del alta, en la app, a verificar | a verificar | importante | app | sí | `pie.tsx:18-21`; `apps/mobile/src/actos-del-alta.tsx` | UF-15 |
| 23 | La app no avisa que hay una versión nueva; la web enlaza a la última release de GitHub | confirmado | importante (sostiene UF-00) | app, web | sí | `apps/web/src/app/page.tsx:10-11`; no hay aviso en `apps/mobile/src` | UF-14 |
| 24 | Los avisos del teléfono dependen de que la build traiga Firebase | a verificar, build por build | importante | app | sí | `apps/mobile/src/avisos.ts:10` | UF-16 |
| 25 | Solo hay app para Android | confirmado | importante (alcance) | app | — | `apps/mobile/app.config.ts:97` (solo `android`) | fuera (§11) |
| 26 | Codex 1: la reanudación de la sesión web reintenta sin un plazo por intento; un pedido colgado deja la pantalla en «restaurando» | confirmado | pulido para producción | web, dominio | no | `apps/web/src/lib/sesion.tsx:91-108`; `packages/domain/src/cliente-http.ts:435` (`fetch` sin señal). La APK sí tiene plazo: 75 s (`sesion-persistente.ts:211`, `api.ts:59`) | UF-18 |
| 27 | Codex 2: readiness atribuye a «migraciones pendientes» cualquier error al leer `_prisma_migrations`, también un tiempo agotado, y responde 503 DB_UNAVAILABLE | confirmado | pulido para producción | API | no | `apps/api/src/health/health.service.ts:60-81`; `health.controller.ts:41-48` | UF-19 |
| 28 | Codex 3: el limitador de intentos vive en la memoria de cada proceso | confirmado (DL-015) | limitación conocida | API | no | `apps/api/src/plataforma/limitador.service.ts:12,19` | UF-20 |
| 29 | Codex 4: lo que lee la 0.23 no está congelado en `main` (`VIGENTES` llega a la 0.22), y la 0.23.0-candidata.2 tampoco | confirmado | importante | pruebas | no | `packages/domain/src/lecturas-de-la-apk.test.ts:57`; #249 congela la candidata.1; tag `be-apk-0.23.0-candidata.2` en `c9ec44f` | UF-00 |
| 30 | Codex 5: la cartera calcula todos los pendientes y después pagina | confirmado | importante (escala) | API | no | `apps/api/src/cartera/lectura-cartera.ts:125-126` | lo resuelve #222 (DL-159) |
| 31 | No se purgan la idempotencia ni las sesiones | confirmado (DL-019 y DL-026) | pulido | API, base | no | `docs/QUE-FALTA.md:188`; no hay purga en `apps/api/src` | UF-21 |

## 4. Partes

Las partes P0 bloquean el uso real; las P1 son importantes y las P2, pulido. Cada parte deja la rama en un estado que
sirve aunque el plazo corte lo que sigue. Las decisiones de la implementación se numeran desde UF-T01 y se ratifican
antes de integrar las que cambian un contrato.

| ID | Parte | Prioridad | Decisión | Toca | APK nueva |
|---|---|---|---|---|---|
| UF-00 | Las APK anteriores, en suspenso (enmienda de DL-152) | P0 (habilita UF-01) | UF-D11 | pruebas | no |
| UF-01 | El nombre obligatorio | P0 | UF-D1 a UF-D5 | dominio, API, base, web, app | sí |
| UF-02 | El gate del 08 §42, condición por condición | P0 | — | documento | no |
| UF-03 | Recuperar el acceso, con el correo de BE | P0 | UF-D9 | API, web, app | sí |
| UF-04 | La entrada de los profesionales reales | P0 | UF-D6 a UF-D8 | API, base, web; app si se muestra la matrícula | según UF-D8 |
| UF-05 | Los textos legales de verdad y su versión nueva en las cuentas que ya existen | P0 | UF-D4 | dominio, API, web, app | sí |
| UF-06 | Los derechos de la persona: descargar sus datos y pedir la supresión | P0 | — | API, base, web, app | sí |
| UF-07 | Ayuda y contacto | P0 | — | web, app, textos | sí |
| UF-08 | Lo que dice el ambiente | P0 | — | web, app | sí |
| UF-09 | El catálogo sin demostración en producción | P0 | UF-D10 | API | no |
| UF-10 | El ambiente de producción, con copias y restauración probada | P0 | — | infraestructura (Dirección) | sí (build de producción) |
| UF-11 | El segundo factor del profesional | P0 | UF-D12 | API, web | no |
| UF-12 | DL-114 antes del 30/11 | P0, con fecha | UF-D13 | CI, dependencias | según UF-D13 |
| UF-13 | Verificar el correo de las cuentas con contraseña | P1 | UF-D4 | API, web, app | sí |
| UF-14 | La app avisa que hay una versión nueva | P1 | — | web, app | sí |
| UF-15 | Los textos legales a mano en la app | P1 | — | app | sí |
| UF-16 | Los avisos del teléfono en la build de producción | P1 | — | app | sí |
| UF-17 | El nombre profesional y la matrícula, a la vista de la persona | P1 | UF-D8 | app, web | sí |
| UF-18 | La reanudación de la sesión web, con plazo por intento | P2 | — | web, dominio | no |
| UF-19 | Readiness: «no pude leer» no es «pendientes» | P2 | — | API | no |
| UF-20 | El limitador compartido, declarado como límite | P2 | — | API, documento | no |
| UF-21 | Purgar la idempotencia y las sesiones vencidas | P2 | — | API, base | no |
| UF-22 | La fecha, igual en todas las pantallas | P2 | — | web, app | tal vez |
| UF-23 | Las recetas de ejemplo con foto | P2 | — | datos | no |
| UF-24 | El profesional se presenta solo (API-PRO-01 a 08) | P2 | UF-D6 | API, base, web | no |

### 4.1 P0 · bloquean el uso real

**UF-00 · Las APK anteriores, en suspenso (enmienda de DL-152)**
- *Resuelve:* la regla de Dirección del 2026-11-11 y el hallazgo 4 de Codex.
- *Qué cambia:*
  1. `VIGENTES` (`packages/domain/src/lecturas-de-la-apk.test.ts:57`) conserva solo la última versión distribuida. Hoy
     es la 0.23.0-candidata.2 (tag `be-apk-0.23.0-candidata.2`, `c9ec44f`), la que sirve la descarga del website.
  2. La candidata.2 se congela con `node scripts/congelar-lo-que-lee-la-apk.mjs be-apk-0.23.0-candidata.2`. El cierre
     de la 0.23 está en #249, que congela la candidata.1. Lo recomendable es que #249 congele la .2 en su lugar, porque la
     .1 ya no se distribuye y la .2 solo cambia la fila fija. Si #249 se integra como está, UF-00 cambia la .1 por la
     .2. No se duplica el cierre.
  3. Salen de `packages/domain/fixtures/lecturas-de-la-apk/` los congelados de la 0.13.2, la 0.20, la 0.21 y la 0.22,
     como el 2026-11-05 con la 0.17 y la 0.18. Quedan en la historia de git y se regeneran desde sus tags.
  4. Lo que nombra una versión que sale:
     - `formularios-ronda-2.test.ts:216-224` (la 0.20 no lee el formato 3) se retira. La regla de la API sigue probada
       en `compatibilidad-de-clientes`;
     - `test/integration/administracion.int-spec.ts:596` (`LaApk('0.20.0-candidata.1')`) pasa a la versión vigente;
     - `test/integration/registro-por-niveles.int-spec.ts:181-183` (`LaApk('0.13.2')`, la APK anterior a DL-161) se
       retira;
     - `SOLO_EL_RECHAZO` (`lecturas-de-las-apk.int-spec.ts:104`) pierde la 0.13.2. Con UF-01 entran ahí API-ACC-01 y
       API-GOO-03 de la 0.23: el alta que se rechaza, como D-5 de DL-152;
     - `habitos-de-la-persona.test.ts:360-380` recorre lo que haya y no cambia;
     - C01 y D10 protegen lo que leía la 0.13.2 (UF-D11). Están en `entrenamiento-por-serie.test.ts:53`,
       `entrenamiento-por-serie.int-spec.ts:324`, `recetas-y-registro.test.ts` y `nutricion.int-spec.ts`.
  5. Las herramientas quedan:
     - el script de congelar;
     - `test/integration/soporte-lecturas-de-la-apk.ts` (`LaApk`);
     - las dos pruebas;
     - las capacidades (`X-BE-Capabilities`).

     La CI no cambia: el job `verificar` corre la prueba del dominio y el job `integracion`, la de integración.
  6. DL-152 suma la nota de la enmienda. Cuando Dirección «establezca una estable», `VIGENTES` vuelve a tener la estable
     y la última candidata.
- *Dado* `main` con UF-00, *cuando* corre la CI, *entonces* la prueba del dominio exige exactamente
  `['0.23.0-candidata.2']` y la de integración lee todas sus lecturas contra la API de hoy.
- *Dado* un cambio de la API que rompe una lectura de la 0.23.0-candidata.2, *cuando* corre la CI, *entonces* falla.
- *Consecuencia para #251:* ED-08 y ED-D7 tratan la persona cuya app no muestra los objetivos por serie. Con todos en la
  última versión, el bloqueo de activación por la app vieja puede volverse un aviso. Lo decide ese paquete; acá queda
  como dependencia (§10).

**UF-01 · El nombre obligatorio**
- *Resuelve:* filas 1 a 5 del inventario.
- *Qué cambia:*
  1. **El alta con correo (API-ACC-01)** pide `profile.displayName`, validado con `nombreVisibleValido`: de 1 a 60
     caracteres, sin caracteres invisibles. Se guarda como la versión 1 del perfil propio en la misma transacción del
     alta, con su auditoría, que no guarda el nombre (como hoy). La web y la app piden «Nombre y apellido» (UF-D5)
     arriba del correo.
  2. **El alta con Google (API-GOO-03)** también pide `profile.displayName`. «Crear la cuenta con Google» trae el nombre
     de la cuenta de Google en un campo que se puede corregir (UF-D2). La persona lo confirma o lo corrige.
  3. **Un alta sin el nombre,** de la 0.23 o anterior, responde lo de UF-D1 y no crea nada.
  4. **Las cuentas que ya existen sin nombre:** al entrar, la web (`/account` y `/pro`) y la app nueva muestran «Antes
     de seguir» con «¿Cómo te llamás?» (UF-D4).
     - No se puede saltear; sí se puede cerrar la sesión.
     - Guardar usa API-ACC-06 con su `expectedVersion`.
     - Si la identidad tiene perfil profesional, el paso propone el nombre profesional.
  5. **El nombre ya no se quita** (UF-D3):
     - API-ACC-06 con `displayName: null` responde 422;
     - la web saca «Quitar» y el texto «Quitaste tu nombre»;
     - la base rechaza una versión nueva del perfil propio sin nombre. Va en un disparador, porque la historia conserva
       las versiones con `null`.
  6. **El profesional:**
     - su nombre personal sigue la misma regla;
     - el que ven las personas es el del perfil profesional, que ya es obligatorio en la base. Lo pone la incorporación
       (UF-04) y lo cambia Administración (UF-D7).
  7. **La referencia neutral** queda solo para las cuentas que todavía no entraron. Con #251, dice «Persona · …».
  8. **Los ayudantes que crean cuentas** suman el nombre: `test/integration/soporte-api.ts`, `test/navegador/api.mjs`,
     `scripts/adversariales-wp03.mjs` a `wp06.mjs` y `scripts/medir-corte-wp03.mjs`.
- *Se integra junto:* la API, la web y la APK nueva, como DL-138. Con la API sola, el alta de la web dejaría de andar.
- *Dado* el alta en la web o en la app nueva, *cuando* el nombre está vacío, *entonces* no se envía y el campo dice qué
  falta; *cuando* está completo, *entonces* la cuenta nace con su nombre (perfil propio v1).
- *Dado* un alta, con correo o con Google, sin `profile.displayName`, *cuando* llega a la API, *entonces* responde 422
  TERMS_VERSION_NOT_ACCEPTABLE con el issue `DISPLAY_NAME_REQUIRED`, y no crea la identidad ni nada más.
- *Dado* «Crear la cuenta con Google», *cuando* se abre, *entonces* el campo trae el nombre de la cuenta de Google, y
  la persona lo corrige o lo confirma antes de crear la cuenta.
- *Dado* una cuenta sin nombre, *cuando* entra por la web o por la app nueva, *entonces* ve «Antes de seguir» y no
  llega a otra pantalla hasta guardar su nombre.
- *Dado* una cuenta con nombre, *cuando* lo manda vacío o en `null`, *entonces* la API responde 422 y el nombre
  anterior sigue.

**UF-02 · El gate del 08 §42, condición por condición**
- *Qué es:* `EVIDENCIA/USO-FINAL/GATE-08-42.md`. Para cada una de las 24 condiciones dice su estado, con la evidencia
  (archivo, prueba o documento), la parte UF que la cubre o, si no es código, su dueño y su fecha (§9).
- *Dado* el documento, *cuando* Dirección decide si entra el primer dato real, *entonces* cada condición tiene estado y
  evidencia, o un dueño y una fecha. Ninguna condición se da por cumplida sin evidencia.

**UF-03 · Recuperar el acceso, con el correo de BE**
- *Resuelve:* filas 8 y 9 del inventario. Implementa RF-005 (UC-E09 → UC-P26) con API-ACC-P1-01 y 02 del 09 v0.12.
- *Qué cambia:*
  1. **El correo de BE:** un proveedor transaccional con DPA y un remitente de un dominio propio (UF-D9).
  2. **Pedir:** `POST /auth/recovery-requests` responde 202 neutro, exista o no la cuenta, con el límite de intentos.
  3. **Completar:** con el código de un solo uso y vigencia corta, la persona define una contraseña nueva. Sus sesiones
     terminan, la identidad es la misma y todo queda auditado.
  4. **Una cuenta que solo tiene Google** no tiene contraseña que recuperar (02:302): la pantalla ofrece «Entrar con
     Google».
  5. **Hasta tener el correo,** la recuperación es asistida (UF-D9).
- *Dado* «Olvidé mi contraseña», *cuando* la persona escribe un correo, *entonces* la respuesta es la misma exista o no
  la cuenta.
- *Dado* un código vigente, *cuando* define una contraseña nueva, *entonces* entra con ella, sus otras sesiones
  terminan y conserva su historia y sus vínculos.
- *Dado* un código vencido o ya usado, *cuando* se presenta, *entonces* nada cambia.

**UF-04 · La entrada de los profesionales reales**
- *Resuelve:* filas 5 a 7 del inventario.
- *Qué cambia* (con UF-D6 como se recomienda):
  1. **El profesional crea su cuenta** como cualquiera, con su nombre (UF-01), y pide entrar como profesional por el
     canal de UF-07.
  2. **Administración verifica la matrícula fuera de BE,** en el registro público que corresponda, y lo incorpora desde
     `/admin` con una operación nueva, **API-ADM-14 · Incorporar un profesional**:
     - se aplica sobre una cuenta que ya existe;
     - lleva el nombre profesional, el tipo (sanitario o no), la matrícula si es sanitario (número y jurisdicción) y las
       áreas;
     - lleva un fundamento que dice dónde se verificó.
  3. **Crea el perfil y, por área, la verificación y la habilitación,** con los hechos de M-02 y el actor ADMINISTRADOR
     (DL-155). Las precondiciones se fijan con las de `CMD-ADM-INCORPORAR`.
  4. **Cambiar el nombre profesional:** **API-ADM-15**, de Administración, con fundamento (UF-D7).
  5. **La matrícula se guarda** en una migración que solo agrega columnas. Se muestra según UF-D8 (UF-17).
- *Dado* una cuenta con nombre y una matrícula verificada, *cuando* Administración la incorpora con fundamento,
  *entonces* el profesional entra a `/pro` con sus áreas, y la persona que acepta su invitación ve su nombre
  profesional.
- *Dado* `APP_ENV=production`, *cuando* arranca la API, *entonces* la siembra no crea profesionales (ya es así) y
  API-ADM-14 es el único camino.

**UF-05 · Los textos legales de verdad y su versión nueva en las cuentas que ya existen**
- *Resuelve:* filas 11 y 12 del inventario.
- *Qué cambia:*
  1. **Versiones nuevas, sin el aviso de demostración,** de los textos de `textos.ts`: términos, privacidad, datos de
     salud, B2 sanitario y no sanitario, cierre, evidencia visual y lo que se comparte entre áreas. Llevan:
     - el responsable;
     - el canal de derechos y de contacto (UF-06 y UF-07);
     - dónde está la infraestructura (Frankfurt, `render.yaml`) y con qué mecanismo.
  2. **El texto lo redacta y lo valida la asesoría jurídica** (condición 1 del gate). El código lo carga con su versión,
     su hash y su sucesión (`reemplazaA`).
  3. **Las cuentas que ya existen** aceptan la versión nueva de A1 y A2 en «Antes de seguir». API-ACC-07 la lista y
     **API-ACC-08 · Aceptar la versión vigente** registra el acto con la versión que la pantalla mostró.
  4. **Los consentimientos por vínculo** ya avisan «hay una versión nueva para revisar» (`consentimiento.tsx:8`). Se
     verifica que alcance.
- *Dado* una versión nueva vigente, *cuando* entra una persona que aceptó la anterior, *entonces* «Antes de seguir» le
  muestra el texto, y sin aceptarlo no sigue. Puede salir o cerrar la cuenta.
- *Dado* el alta, *cuando* se crea una cuenta, *entonces* acepta la versión nueva.
- *Dado* cualquier texto vigente, *cuando* se lee, *entonces* no dice «demostración».

**UF-06 · Los derechos de la persona**
- *Resuelve:* fila 16 del inventario.
- *Qué cambia:*
  1. **«Descargar mis datos»** (API-EXP-01 y 02): un archivo con lo suyo, sin datos de terceros salvo la referencia
     mínima:
     - el perfil;
     - los vínculos y los consentimientos;
     - los registros;
     - los planes recibidos;
     - las medidas y los formularios.

     Se genera con auditoría y se descarga por una ruta firmada y temporal.
  2. **«Pedir la supresión» y los demás derechos** (API-RGT-01 a 03): una solicitud que Administración resuelve dentro
     de los plazos de la Ley 25.326 (art. 14: diez días corridos para el acceso; art. 16: cinco días hábiles para
     rectificar o suprimir), a confirmar con la asesoría.
  3. **La política** dice qué se conserva, qué se suprime y cuándo (08 §18 y §19). La restauración repite las
     supresiones (UF-10).
  4. **En la app,** Perfil → «Tus datos»; en la web, `/account`.
- *Dado* una persona con registros, *cuando* pide sus datos, *entonces* recibe un archivo con lo suyo y sin datos de
  otras personas, y la auditoría lo registra.
- *Dado* un pedido de supresión resuelto, *cuando* se restaura una copia anterior, *entonces* la supresión se vuelve a
  aplicar.

**UF-07 · Ayuda y contacto**
- *Resuelve:* fila 17 del inventario.
- *Qué cambia:* un canal publicado, con un correo de soporte y de privacidad, que aparece:
  - en la web, en el pie y en `/account`;
  - en la app, en Perfil → «Ayuda y contacto»;
  - en los textos de UF-05.

  Por ese canal llegan también los pedidos de UF-04 y la recuperación asistida (UF-D9). Las incidencias de RF-068
  quedan afuera (§11).
- *Dado* la app o la web, *cuando* la persona busca ayuda, *entonces* encuentra el canal en un toque desde Perfil o
  desde el pie.

**UF-08 · Lo que dice el ambiente**
- *Resuelve:* fila 13 del inventario.
- *Qué cambia:* los avisos de prueba salen del ambiente y no de un texto fijo. En `test` siguen; en producción no
  aparecen:
  - la franja de la app;
  - el pie;
  - «usá un correo inventado»;
  - el aviso de Google;
  - «Descargar la APK de prueba».

  La APK de producción es otra build, que apunta a la API de producción.
- *Dado* `test`, *cuando* se abre la app o la web, *entonces* los avisos de prueba siguen.
- *Dado* producción, *cuando* se recorren la app y la web, *entonces* no aparece ningún texto de prueba. Una prueba
  recorre los textos.

**UF-09 · El catálogo sin demostración en producción**
- *Resuelve:* fila 14 del inventario.
- *Qué cambia* (con UF-D10 como se recomienda): con `APP_ENV=production`, la API no ofrece los ítems
  `BE_SYNTHETIC_SEED` en los buscadores ni los acepta en un plan nuevo. En `test` todo sigue igual. Las filas quedan,
  porque las crean las migraciones y la historia no se borra.
- *Dado* producción, *cuando* el profesional busca «arroz», *entonces* no aparece el ítem «Demostración».
- *Dado* `test`, *cuando* busca lo mismo, *entonces* sí aparece, con su origen.

**UF-10 · El ambiente de producción, con copias y restauración probada**
- *Resuelve:* fila 18 del inventario (08 §42, condiciones 8, 9 y 10).
- *Qué cambia:*
  1. **Base, API, web y cron propios,** con `APP_ENV=production`, datos exclusivos y sin siembra. La base se alcanza
     solo por la red privada.
  2. **Copias automáticas y una restauración probada** en un ambiente aparte, que repite las supresiones (08 §18).
  3. **El plan de Render, su costo y el cambio de `render.yaml`** los decide y los aplica Dirección. Este paquete no
     toca `render.yaml` sin su ok.
  4. **La APK de producción** es una build propia.
- *Dado* producción, *cuando* se restaura la copia del día anterior en un ambiente aparte, *entonces* la API arranca,
  readiness da OK y las supresiones registradas después de la copia se vuelven a aplicar. La evidencia queda en
  `EVIDENCIA/USO-FINAL/`.

**UF-11 · El segundo factor del profesional**
- *Resuelve:* fila 19 del inventario (08 §42, condición 6).
- *Qué cambia* (con UF-D12 como se recomienda): la sesión profesional del website (`/pro`) pide el segundo factor de
  Administración (`segundo-factor.ts`), con TOTP y códigos de recuperación. La app de la persona no lo pide.
- *Dado* un profesional sin segundo factor, *cuando* entra a `/pro`, *entonces* lo configura antes de ver a una
  persona.
- *Dado* un profesional que lo perdió, *cuando* usa un código de recuperación, *entonces* entra y lo reemplaza.

**UF-12 · DL-114 antes del 30/11**
- *Resuelve:* fila 20 del inventario.
- *Qué cambia:* Dirección decide antes del 2026-11-30 a las 21:00 (Argentina), con UF-D13.
  - node-forge ya está en 1.4.2, fuera del aviso: lo comprueba en `main` la prueba del lockfile. Su excepción se puede
    retirar.
  - Queda zod 3.25.76, que llega por `@expo/cli` 57.0.25.
  - La excepción no se renueva sola.
- *Dado* el 2026-12-01, *cuando* corre la auditoría, *entonces* pasa por lo que decidió Dirección, no por una prórroga
  automática.

### 4.2 P1 · importantes

**UF-13 · Verificar el correo de las cuentas con contraseña.** Después del alta, BE manda un código. «Antes de seguir»
lo pide (UF-D4), y hasta verificarlo la recuperación no se ofrece. Las cuentas de Google ya llegan verificadas.
- *Dado* una cuenta nueva con contraseña, *cuando* escribe el código vigente, *entonces* el correo queda verificado.
- *Dado* un correo mal escrito, *cuando* la persona lo nota, *entonces* puede corregirlo antes de verificar.

**UF-14 · La app avisa que hay una versión nueva.** UF-00 supone que todos tienen la última versión, y fuera de Google
Play nada se lo dice al teléfono.
- *Qué cambia:* al abrir, la app lee un dato público con la última versión y su enlace, y si hay una más nueva lo dice
  en una línea con «Descargar».
- *Dado* una app más vieja que la última publicada, *cuando* se abre, *entonces* lo dice y ofrece la descarga.
- *Dado* la última, *cuando* se abre, *entonces* no dice nada.

**UF-15 · Los textos legales a mano en la app.** Perfil enlaza a los términos, la privacidad y los consentimientos
vigentes, con su versión.
- *Dado* Perfil, *cuando* la persona busca los términos, *entonces* los lee con su versión.

**UF-16 · Los avisos del teléfono en la build de producción.** La build de producción trae Firebase, y la evidencia
dice si los avisos llegan.
- *Dado* la APK de producción, *cuando* se activan los avisos, *entonces* el teléfono recibe una novedad de prueba.

**UF-17 · El nombre profesional y la matrícula, a la vista de la persona** (UF-D8). Aparecen en la invitación y en «Tus
profesionales».
- *Dado* un profesional sanitario incorporado, *cuando* la persona mira su invitación, *entonces* ve su nombre
  profesional, su matrícula y su jurisdicción.

### 4.3 P2 · pulido

**UF-18 · La reanudación de la sesión web, con plazo por intento** (Codex 1).
- *Qué cambia:* cada intento de `reanudarSesion` en la web corta a un plazo con una señal, como la APK, y cuenta como
  falla pasajera.
- *Dado* un pedido que no responde, *cuando* vence el plazo, *entonces* la web reintenta o muestra «sin conexión», y
  nunca queda en «restaurando».

**UF-19 · Readiness: «no pude leer» no es «pendientes»** (Codex 2).
- *Qué cambia:* `verificarMigraciones` distingue la tabla que falta, el tiempo agotado y otro error, y el cuerpo dice
  cuál fue.
- *Dado* un tiempo agotado al leer `_prisma_migrations`, *cuando* se pide readiness, *entonces* el detalle dice «no se
  pudo verificar», no «pendientes».

**UF-20 · El limitador compartido, declarado como límite** (Codex 3, DL-015).
- *Qué cambia:* con una sola instancia, el límite es aceptable. La documentación de producción dice que un reinicio
  pierde los contadores. Si alguna vez hay más de una instancia, los contadores pasan a PostgreSQL.
- *Dado* más de una instancia, *cuando* se planifica el cambio, *entonces* el limitador compartido va antes.

**UF-21 · Purgar la idempotencia y las sesiones vencidas** (DL-019 y DL-026).
- *Qué cambia:* una tarea que borra lo vencido después de su ventana y deja auditado cuánto borró.
- *Dado* registros vencidos, *cuando* corre la tarea, *entonces* se borran y la idempotencia vigente sigue intacta.

**UF-22 · La fecha, igual en todas las pantallas.** Un recorrido de capturas compara cómo se escriben la fecha y la
hora en la web y en la app, y lo que difiere pasa a los ayudantes `formato.ts`.
- *Dado* el recorrido, *cuando* se comparan las pantallas, *entonces* la fecha se escribe de una sola manera por lugar
  y la hora siempre en 24 h.

**UF-23 · Las recetas de ejemplo con foto.** Se cuentan las que faltan y se completan con el estilo de las tres
originales.
- *Dado* las recetas de ejemplo, *cuando* se listan, *entonces* ninguna dice «Sin imagen de referencia».

**UF-24 · El profesional se presenta solo** (API-PRO-01 a 08). Después de UF-04, un profesional declara su perfil, sus
áreas y su presentación, y Administración la revisa en la ficha que ya existe.
- *Dado* una presentación, *cuando* Administración la resuelve, *entonces* queda trazada por área, como hoy.

## 5. Las operaciones nuevas y los contratos que cambian

| Operación | Qué es | Parte |
|---|---|---|
| API-ACC-01 | `profile.displayName` obligatorio (lo de UF-D1 si falta) | UF-01 |
| API-GOO-03 | `profile.displayName` obligatorio | UF-01 |
| API-GOO-01 (el error GOOGLE_ACCOUNT_NOT_FOUND) | `details.name`, el nombre de la cuenta de Google (UF-D2) | UF-01 |
| API-ACC-06 | `displayName: null` responde 422 | UF-01 |
| API-ACC-07 (nueva) | «Lo que falta para seguir»: una lista con el nombre y, después, los textos y el correo | UF-01, UF-05, UF-13 |
| API-ACC-08 (nueva) | Aceptar la versión vigente de A1 o A2 | UF-05 |
| API-ACC-P1-01 y 02 (del 09 v0.12) | Pedir y completar la recuperación | UF-03 |
| API-ADM-14 y 15 (nuevas) | Incorporar un profesional y cambiar su nombre profesional | UF-04 |
| API-EXP-01 y 02 (del 09 v0.12) | La exportación propia | UF-06 |
| API-RGT-01 a 03 (del 09 v0.12) | Las solicitudes de derechos | UF-06 |

La forma exacta de cada una se fija en la implementación y se ratifica antes de integrar. Con UF-00, lo que cambia una
lectura de la 0.23.0-candidata.2 se ve en la CI.

## 6. Oráculos a escribir

Van en `WP-USO-FINAL-ORACULOS.md`, con TEST-UF-001 en adelante, antes de programar cada parte:

| Oráculo | Qué prueba |
|---|---|
| TEST-UF-001 | El alta con correo sin nombre: 422 y no se crea nada |
| TEST-UF-002 | El alta con Google sin nombre: lo mismo |
| TEST-UF-003 | El alta con nombre crea el perfil propio v1, con auditoría y sin el nombre en ella |
| TEST-UF-004 | Quitar el nombre responde 422, y la base rechaza una versión nueva sin nombre |
| TEST-UF-005 | API-ACC-07 lista el nombre que falta, y deja de listarlo al guardarlo |
| TEST-UF-006 | `VIGENTES` es exactamente la última versión, y su lectura de integración pasa |
| TEST-UF-007 | La recuperación responde igual exista o no la cuenta |
| TEST-UF-008 | El código de recuperación vencido o usado no cambia nada, y el vigente revoca las sesiones |
| TEST-UF-009 | API-ADM-14 solo con una sesión administrativa y fundamento; el profesional queda con sus áreas |
| TEST-UF-010 | Ningún texto vigente dice «demostración», y la versión nueva se pide en «Antes de seguir» |
| TEST-UF-011 | La exportación trae solo lo del titular |
| TEST-UF-012 | En producción no hay avisos de prueba (web y app) |
| TEST-UF-013 | En producción el buscador no ofrece `BE_SYNTHETIC_SEED`, y en `test` sí |
| TEST-UF-014 | `/pro` pide el segundo factor |
| TEST-UF-015 | La restauración repite las supresiones |

## 7. Decisiones (UF-D)

| ID | Pregunta | Recomendación | Alternativa |
|---|---|---|---|
| UF-D1 | ¿Qué pasa con un alta sin nombre? | **La API lo exige,** en API-ACC-01 y en API-GOO-03. Sin él responde 422 TERMS_VERSION_NOT_ACCEPTABLE con el issue `DISPLAY_NAME_REQUIRED`, que es el código que la 0.23 ya traduce a «Los textos cambiaron. Actualizá la app para continuar.» (`pantallas/registro.tsx:78`; DL-138 D-10). Con un nombre inválido responde 422 con `INVALID_DISPLAY_NAME`. *Fundamento:* desde la regla del 2026-11-11 no hay apps anteriores que sostener, y la garantía queda en el servidor, que es donde BE pone las suyas | *Solo como referencia, la del plan anterior a esa regla:* la API sigue aceptando el alta sin nombre de los clientes viejos, la cuenta nace «sin nombre» y la web y la app nueva lo piden al entrar. Servía si las APK viejas importaban |
| UF-D2 | ¿De dónde sale el nombre propuesto con Google? | **De la API:** lo lee del token ya verificado (`name`) y lo devuelve en `details.name`, junto al correo, en GOOGLE_ACCOUNT_NOT_FOUND. Así lo hace hoy con el correo, «sin decodificar el token» en la pantalla. La 0.23 lee esos detalles estrictos, así que su paso de Google mostraría un error general, pero tampoco puede crear la cuenta (UF-D1) | Cada cliente decodifica el `name` del token que ya tiene: la API no cambia, pero hay dos decodificadores y se contradice el diseño de hoy |
| UF-D3 | ¿Se puede quitar el nombre? | **No:** se cambia, no se quita. API-ACC-06 responde 422 a `null` | Se puede quitar, y «Antes de seguir» lo vuelve a pedir: es una vuelta sin sentido |
| UF-D4 | ¿El paso «Antes de seguir» es solo para el nombre? | **Es genérico,** con API-ACC-07 («Lo que falta para seguir»). Hoy pide el nombre; con UF-05 suma la versión nueva de los textos y con UF-13, el correo. Cuesta casi lo mismo y evita tres pantallas sueltas | Solo el nombre, leyendo API-ACC-06-PROPIA (`displayName: null`). Los textos y el correo traerían su propio paso |
| UF-D5 | ¿Un campo o dos? | **Uno,** «Nombre y apellido», de 1 a 60 caracteres (DL-040), como el `name` de Google. El saludo usa la primera palabra (TB-06) | Nombre y apellido separados, que permiten ordenar por apellido. Es más fricción y cambia el esquema |
| UF-D6 | ¿Cómo entra un profesional real? | **Administración lo incorpora desde `/admin`** (API-ADM-14), con segundo factor, fundamento y auditoría, después de verificar la matrícula fuera de BE. No hace falta un comando ni entrar a la base, y usa la consola que ya existe | Un comando interno, como el del primer administrador (WP-ADMINISTRACION §6.1). O la autogestión de API-PRO-01 a 08 primero (UF-24), que lleva más tiempo |
| UF-D7 | ¿Quién cambia el nombre profesional? | **Administración, con fundamento** (API-ADM-15), porque es parte de lo verificado y coincide con la matrícula. El profesional lo pide por el canal | El profesional lo edita solo (API-PRO-02), con el riesgo de que no coincida con lo verificado |
| UF-D8 | ¿Se muestra la matrícula? | **Sí, para los sanitarios:** el número y la jurisdicción verificados, en la invitación y en «Tus profesionales» (UF-17) | Solo la ve Administración |
| UF-D9 | ¿Correo de BE o recuperación asistida? | **Un proveedor transaccional con DPA y un dominio propio,** y la recuperación por código (UF-03). Hasta tenerlo, una recuperación asistida por Administración, con fundamento: revoca las sesiones y emite un código de un solo uso, como la incorporación | Solo la asistida durante el piloto, sin correo |
| UF-D10 | ¿Qué se hace con el catálogo de demostración? | **En producción, la API no lo ofrece** (filtro por ambiente), y las filas quedan | Una migración que lo marca no disponible en todos los ambientes. Rompe la cohorte de `test` |
| UF-D11 | ¿Qué pasa con C01 y D10? | **Se retiran con UF-00:** protegen lo que leía la 0.13.2, que sale de `VIGENTES`, y quedan en la historia | Quedan hasta que un cambio las toque |
| UF-D12 | ¿El profesional tiene segundo factor antes del piloto? | **Sí, obligatorio en `/pro`** antes del primer dato real (08 §42, condición 6), con el de Administración | Optativo durante el piloto, con una fecha para volverlo obligatorio |
| UF-D13 | ¿Qué se hace con DL-114 antes del 30/11? | **Retirar la excepción de node-forge,** que ya está en 1.4.2. Para zod 3, verificar si un parche de Expo del mismo SDK lo saca; si no, que Dirección la renueve con las mismas condiciones hasta el SDK siguiente, porque el riesgo queda en la cadena de construcción y fuera del bundle. **Lo decide Dirección:** la excepción no se prorroga sola | Subir de SDK antes del 30/11, con el riesgo de una APK nueva apurada |

## 8. Etapas y orden

1. **UF-00,** solo pruebas, después de #249 o junto con él (§10).
2. **UF-01,** con la API, la web y la APK nueva integradas juntas. Sale una candidata nueva.
3. **En paralelo:**
   - UF-12, con fecha;
   - UF-02, que es documento.
4. **UF-04, UF-07, UF-08 y UF-09:** API y web, y la app para UF-07 y UF-08.
5. **UF-03 y UF-13,** cuando Dirección elija el correo (UF-D9).
6. **UF-05,** cuando lleguen los textos validados.
7. **UF-06 y UF-11.**
8. **UF-10,** cuando Dirección decida el plan y el costo.
9. **Las P1 y las P2,** según las pruebas con las personas.

**La app se congela el 25/11** (el plan de WP-EDITORES-PROFESIONAL, #251). Las partes que piden una APK nueva tienen que
entrar en esa candidata o esperar la siguiente. UF-01 es la primera: sin ella, la app nueva no puede crear cuentas
(UF-D1). Si UF-01 no llega al 25/11, la API no exige el nombre hasta que salga la APK que lo pide.

## 9. Lo que no es código (y también bloquea)

Son condiciones del 08 §42 que no se resuelven programando. Quedan a nombre de Dirección y de la asesoría jurídica, y
UF-02 las sigue:

| Qué | Dueño |
|---|---|
| La validación jurídica de los textos (condición 1). Un acta de Dirección no la dispensa | Dirección y la asesoría jurídica |
| Los DPA vigentes con los proveedores: Render, Google y el proveedor de correo (condición 15) | Dirección |
| La transferencia internacional, porque la infraestructura está en Frankfurt, con su mecanismo documentado (condición 16) | Dirección y la asesoría jurídica |
| El registro de las bases ante la autoridad, si corresponde (condición 20) | Dirección y la asesoría jurídica |
| El runbook de incidentes, ensayado (condición 14) | Dirección |
| El procedimiento para un menor descubierto, ensayado (condición 22) | Dirección |
| El acceso del operador fuera de la aplicación, con bitácora (condición 21) | Dirección |

## 10. Dependencias y coordinación

- **#251 (WP-EDITORES-PROFESIONAL):**
  - ED-06 y ED-D9 nombran a la persona en el website y cambian «asesorado» por «persona». UF-01 no duplica esos textos:
    garantiza que las cuentas nuevas tengan nombre, y la referencia neutral queda para las que no entraron.
  - **Se simplifica:** ED-08 y ED-D7 tratan la persona cuya app no muestra los objetivos por serie. Con todos en la
    última versión (UF-00), el bloqueo de activación por la app vieja puede volverse un aviso. Lo decide #251; acá
    queda como dependencia.
- **#249 (cierre de la 0.23):** congela la 0.23.0-candidata.1. UF-00 recomienda congelar la candidata.2 y no duplica el
  cierre.
- **#222 (DL-159):** la cartera por conjuntos resuelve el hallazgo 5 de Codex. No hay parte UF.
- **#252 y los demás PR abiertos:** suman DL-167 y DL-168 al final de DEUDA_LEGAJO. El índice y el final del archivo
  van a chocar con DL-169 al integrar. Se resuelve conservando las tres.

## 11. Fuera de alcance

- **iPhone:** pide una cuenta de Apple paga y una Mac o un servicio. Lo decide Dirección.
- **Google Play:** está en pausa, y no es necesario para UF-14.
- **Las incidencias administrativas** (RF-068) y un sistema de tickets: alcanza con el canal de UF-07.
- **La cartera:** está en #222.
- **El nombre de la persona en los textos del website:** está en #251.
- **Lo comercial de producción.**
- **Cambiar el legajo.**

## 12. La etapa 1, programada (2026-11-11, PR #253, sin integrar)

Dirección ratificó UF-D1 a UF-D13 el 2026-11-11 y pidió que lo que bloquea entre antes de congelar la app el 25/11. La
etapa 1 son las cuatro partes que no esperan una decisión de afuera (un proveedor de correo, los textos jurídicos, el
plan de producción): UF-12, UF-00, UF-01 y UF-08. Los oráculos, escritos antes del código y verificados con mutación,
están en `WP-USO-FINAL-ORACULOS.md` (TEST-UF-001 a 006, 012 y 016, que es nuevo: UF-12 no tenía).

### 12.1 Lo que quedó

| Parte | Qué quedó | Oráculos |
|---|---|---|
| UF-12 | `EXCEPCIONES` vacía. node-forge 1.4.3 (fuera del aviso, y corrige los cuatro medios y bajos del 2026-11-10) y la CLI de Expo 57.0.33 (SDK 57, «Remove the Zod production dependency»), solo en el lockfile. La auditoría no depende de una fecha: no falla el 2026-12-01. | TEST-UF-016 |
| UF-00 | `VIGENTES = ['0.23.0-candidata.2']`, congelada desde `c9ec44f`; salen los congelados de la 0.13.2 a la 0.23.0-candidata.1, C01 y D10, y las pruebas que nombraban esas versiones. | TEST-UF-006 |
| UF-01 | La API exige el nombre en el alta con correo y con Google, lo propone desde Google, no deja quitarlo, la base no acepta una versión nueva sin nombre y API-ACC-07 dice qué falta. La web y la APK piden «Nombre y apellido» al crear la cuenta y muestran «Antes de seguir» a una cuenta anterior sin nombre. | TEST-UF-001 a 005 |
| UF-08 | Los avisos de prueba salen del ambiente y de `BE_AVISOS_DE_PRUEBA`; ninguna pantalla los escribe por su cuenta. | TEST-UF-012 |

**El profesional (UF-01, punto 6).** Su nombre personal sigue la misma regla: lo pide el alta y, si es una cuenta
anterior sin nombre, «Antes de seguir» en `/pro` le propone su nombre profesional. El nombre profesional, el que ven las
personas, ya es obligatorio en la base; incorporarlo con su matrícula y cambiarlo es UF-04 (API-ADM-14 y 15), que no
entra en esta etapa.

### 12.2 Decisiones de la implementación (UF-T, a ratificar las que cambian un contrato)

| ID | Decisión | Alternativa descartada |
|---|---|---|
| UF-T01 | API-ACC-07 es un ID nuevo de la familia ACC, que el 09 no usa. La guardia de trazabilidad lo admite por una lista explícita con su DL y exige que el 09 no lo tenga. | Una familia propia (otra sigla): contradecía el nombre que ratificó Dirección en UF-D4. |
| UF-T02 | API-ACC-07 es `GET /me/pending-steps` y responde `steps: [{ step, suggestion }]`. El paso viaja como texto, como el `kind` de la novedad: un paso nuevo (UF-05, UF-13) no deja sin leer la respuesta a una APK instalada, que pide actualizar. | Un enum estricto: la APK de ese momento dejaría de entrar cuando se sume el paso de los textos. |
| UF-T03 | Sin `profile.displayName`, el alta responde 422 TERMS_VERSION_NOT_ACCEPTABLE (UF-D1); con el nombre en blanco, 422 VALIDATION_FAILED con DISPLAY_NAME_REQUIRED; largo o con invisibles, INVALID_DISPLAY_NAME. Es el mismo criterio que la mayoría de edad de DL-138: lo que manda un cliente anterior se traduce a «actualizá»; lo que se corrige en la pantalla, al campo. | VALIDATION_FAILED también sin el nombre: la 0.23 mostraría un error general en vez de pedir actualizar. |
| UF-T04 | API-GOO-03 valida el nombre antes de verificar el token, también cuando la cuenta de Google ya tiene identidad (el reintento que responde 200). | Saltear el nombre en el reintento: abría una forma de entrar sin nombre por el alta. |
| UF-T05 | La base lo sostiene con un disparador sobre lo que se inserta, no con un CHECK: las versiones viejas guardadas sin nombre quedan en la historia, que es de solo agregar. | Un CHECK `NOT VALID`: hace lo mismo, pero una validación posterior de la restricción fallaría por la historia. |
| UF-T06 | En las pruebas, las cuentas nacen con «Persona Sintética»; una cuenta anterior, sin nombre, se arma como la armaba el alta (`soporte-nombre.ts`). Las pruebas que dependían de la falta de nombre pasan a la regla nueva, y las de los avisos del teléfono exigen además que no viaje el nombre. | Mantener cuentas sin nombre en las pruebas: probarían un estado que la API ya no crea. |
| UF-T07 | Lo que solo recibe el rechazo, en la prueba de las lecturas de la APK, se decide por lo que manda la APK (`soloElRechazo`) y no por su número; la del soporte, `LA_ULTIMA_APK`, por la carpeta. Así la próxima candidata no obliga a tocar estas pruebas. | Una lista por versión: había que cambiarla con cada candidata. |
| UF-T08 | UF-08 se decide al construir cada cliente: el website con `BE_AMBIENTE` (sin ella, `test`, el único ambiente que existe) y `BE_AVISOS_DE_PRUEBA`; la APK con `APP_ENV` y `BE_AVISOS_DE_PRUEBA`. Un ambiente que no se reconoce muestra los avisos. | Preguntarle el ambiente a la API al abrir: un parpadeo en cada carga y un pedido más, para algo que se sabe al construir. |
| UF-T09 | UF-12 por el camino angosto: solo la CLI de Expo dentro del rango que ya pide `expo` 57.0.23, sin tocar ningún package.json ni módulo nativo de la app. | `expo` 57.0.32 con `expo install --fix`: suben también los módulos nativos (expo-modules-core, expo-notifications, expo-image-picker…), más cambio en una APK que se congela el 25/11. |
| UF-T10 | De C01 queda, con su nombre propio, la prueba de que los datos de un plan sin objetivos por serie no se reinterpretan: no dependía de ninguna APK. El «D10» de `nutricion.int-spec.ts` es otro (un reintento no duplica) y no se toca. | Retirar C01 entero: se perdía una garantía de la historia. |

### 12.3 Lo que decidieron la web y la APK (UF-T11 a UF-T14)

| ID | Decisión | Alternativa descartada |
|---|---|---|
| UF-T11 | **Website:** «Antes de seguir» va en los layouts de `/account` y `/pro` (la consola `/admin` queda afuera) y se pregunta una vez por sesión y por pestaña. Sin respuesta (red, 5xx, 429, 404 o una respuesta que no reconoce) no deja pasar: «Reintentar», y reintenta solo al volver la conexión. Mientras pregunta, la página no se monta: ninguna lee datos antes de tiempo ni se monta dos veces. | Dejar pasar sin respuesta: el website depende de la API para todo, y una página montada a ciegas se volvería a montar. |
| UF-T12 | **APK:** pregunta con cada sesión (login, Google o la recuperada), con un tope de 10 s. Sin respuesta (sin red, el tope, 5xx, 429 o 404) deja seguir y vuelve a preguntar al volver al primer plano y al cambiar de pantalla. Lo que la API contesta no se saltea: el nombre se pide, y un paso desconocido o una respuesta que no reconoce piden actualizar. | Bloquear sin respuesta, como el website: la app trabaja sin conexión con lo guardado, y trabarla castigaría a todas las cuentas por una anterior sin nombre, que es rara. |
| UF-T13 | **En el paso**, sin navegación ni campana (llevarían a otra pantalla) y con «Cerrar sesión» siempre; en la APK, Atrás deja la app en segundo plano, como en Inicio, y nunca muestra lo de abajo. El campo deja escribir hasta 80 caracteres, para que un nombre largo muestre su error en vez de cortarse sin aviso. | — |
| UF-T14 | **Perfil de la APK** ya no ofrece «Agregá tu nombre» (AV-03 y AV-17): sin nombre muestra la referencia, que con #251 dirá «Persona · …». Se cambia y no se quita en Mis datos y en Cuenta del website. | Dejar «Agregá tu nombre» como atajo: el paso ya lo pide antes de llegar, y sería una segunda puerta para lo mismo. |

### 12.4 Lo que tiene que hacer o decidir Dirección

- **Nada en Render para integrar.** El PR no toca `render.yaml` ni pide variables nuevas para funcionar: sin ellas, el
  website de `test` sigue mostrando los avisos de prueba, como hoy.
- **Para apagar los avisos de prueba en `test` (UF-08):**
  - **el website:** en Render, be-web → Environment → agregar `BE_AVISOS_DE_PRUEBA` con el valor `no` → «Save, rebuild,
    and deploy»;
  - **la APK:** ya está. Dirección decidió el 2026-11-11 que la 0.24 salga sin los avisos de prueba, y desde este PR el
    perfil `test` de `apps/mobile/eas.json` lleva `"BE_AVISOS_DE_PRUEBA": "no"` (`construir-aab.mjs` le pasa al build
    todo el entorno del perfil). Toda APK de `test` sale sin ellos.
- **Para producción (UF-10, cuando exista):** be-web con `BE_AMBIENTE=production` (sin ella mostraría los avisos) y la
  API con `APP_ENV=production`, como ya está previsto.
- **zod de Expo (DL-114):** no hay nada que renovar. La CLI de Expo 57.0.33 ya no lo pide. Si la candidata 0.24 no se
  pudiera construir por la CLI nueva, la salida es volver ese cambio del lockfile y que Dirección decida si renueva la
  excepción hasta el SDK siguiente: no vuelve sola.

### 12.5 Lo que falta para cerrar la etapa

- ~~La CI en verde del PR y la integración, con el sí de Dirección~~: integrado el 2026-11-12 (main `549f41e3`) y
  desplegado en `test` ese mismo día.
- **La APK 0.24.0-candidata.1 (publicada el 2026-11-12 como «latest»:** tag `be-apk-0.24.0-candidata.1` en `1cb3cdc`,
  versionCode 38, SHA-256 `39a76ae7…4396`; AAB y APK verificados con todo bien, con la 0.23.0-candidata.2 de referencia;
  lo que lee, congelado: 89 operaciones, las 88 de la 0.23 y API-ACC-07, con su escenario en
  `lecturas-de-las-apk.int-spec.ts`), que pide el nombre: se construye después de integrar y desplegar, porque llama a
  API-ACC-07 al entrar (con la API de antes, no podría seguir). Desde ese despliegue, la 0.23 ya no crea cuentas (pide
  actualizar) y su paso de Google muestra un error general; lo que ya existe sigue andando. Se publica como «latest»,
  sin los avisos de prueba (§12.4), y se congela lo que lee (UF-00: reemplaza a la 0.23.0-candidata.2 en `VIGENTES`). La
  numeración la decidió Dirección el 2026-11-11: la muestra con vidrio de WP-APP-VUELTA-2 sale después, como 0.25,
  prerelease y solo para Dirección, construida sobre `main` con este paquete integrado.
- **En el teléfono:** crear una cuenta con correo y con Google (el nombre propuesto), entrar con una cuenta anterior sin
  nombre («Antes de seguir»), cambiar el nombre y comprobar que no se puede vaciar, y ver que la app sale sin los avisos
  de prueba (la regla, con y sin el interruptor, la cubre TEST-UF-012). Que la APK se haya construido con la CLI nueva
  de Expo es, además, la prueba de UF-12 en la app.

## 13. La etapa 2 (declarada el 2026-11-12)

Dirección pidió todo el P0 antes del 25/11, cuando se congela la app. El 2026-11-12 delegó las decisiones técnicas:
«Okey a tus recomendaciones, cualquier cosa lo revisamos, pero no podemos frenar». Por eso las decisiones de la
implementación nuevas (UF-T15 en adelante) se toman con la recomendación y quedan **a ratificar por Dirección**, cada
una con su alternativa. Integrar a `main` sigue siendo de Dirección: la etapa va en un PR en borrador.

### 13.1 Las partes y el orden

La etapa 2 son las ocho partes P0 que quedan, sin UF-10, que es de Dirección:

| Orden | Parte | Toca | APK nueva | Lo que espera de Dirección |
|---|---|---|---|---|
| 1 | UF-09 · El catálogo sin demostración en producción | API | no | nada |
| 2 | UF-11 · El segundo factor del profesional | API, base, web | no | nada |
| 3 | UF-04 · La entrada de los profesionales reales (API-ADM-14 y 15) | API, base, web (`/admin`) | no | nada |
| 4 | UF-06 · Los derechos de la persona | API, base, web, app | sí | los plazos, con la asesoría |
| 5 | UF-07 · Ayuda y contacto | web, app, textos | sí | las direcciones |
| 6 | UF-03 · Recuperar el acceso | API, web, app | sí | el proveedor de correo |
| 7 | UF-05 · Los textos legales de verdad | dominio, API, web, app | sí | el texto validado |
| 8 | UF-02 · El gate del 08 §42, condición por condición | documento | no | lo que no es código (§9) |

Por qué este orden:
- **Primero, lo que no espera a nadie y no pide una APK nueva** (UF-09, UF-11 y UF-04).
- **UF-11 antes que UF-04:** un profesional real que entra por Administración llega a `/pro` con el segundo factor desde
  el primer día.
- **UF-06 es la parte más grande de la app:** va primero entre las que piden una APK nueva, para llegar a la candidata
  del 25/11.
- **UF-07 antes que UF-03 y que UF-05:** la recuperación asistida y los pedidos de UF-04 llegan por el canal de UF-07, y
  los textos nuevos de UF-05 nombran ese canal y el de los derechos.
- **UF-02 al final,** porque cita la evidencia de todas.

La **primera mitad** (UF-09, UF-11, UF-04 y UF-06) se programa primero. La segunda (UF-07, UF-03, UF-05 y UF-02) sigue
en el mismo PR.

### 13.2 Lo que depende de Dirección

- **UF-03:** la cuenta del proveedor de correo, con su DPA, y el dominio propio del remitente. Mientras tanto:
  - la recuperación asistida de UF-D9: Administración revoca las sesiones y emite un código de un solo uso, con
    fundamento;
  - el adaptador del proveedor, listo para cuando Dirección cargue la clave en Render. Sin clave, la API no manda
    correos y lo dice.
- **UF-05:** el contenido de los textos lo redacta y lo valida la asesoría jurídica (condición 1 del gate). Se programa
  el mecanismo: la versión, su hash, su sucesión (`reemplazaA`), «Antes de seguir» y API-ACC-08. La versión nueva queda
  **sin publicar** hasta esa validación.
- **UF-07:** las direcciones de soporte y de privacidad, por configuración. Ninguna dirección personal queda en el
  repositorio.
- **UF-10:** lo decide y lo aplica Dirección: el plan de Render, su costo y el cambio de `render.yaml`.
- **UF-06:** los plazos de la Ley 25.326 (art. 14, diez días corridos para el acceso; art. 16, cinco días hábiles para
  rectificar o suprimir) quedan «a confirmar con la asesoría».

### 13.3 Las reglas de la etapa

- **La 0.24.0-candidata.1 es la última APK distribuida** (`VIGENTES`). Toda respuesta de la API sigue validando contra
  lo que esa APK lee (`lecturas-de-la-apk.test.ts` y `lecturas-de-las-apk.int-spec.ts`): un cambio de la API nunca
  rompe lo que la 0.24 ya hace.
- **API-ACC-07 no emite un paso nuevo hasta que haya una APK que lo entienda.** La 0.24 pide actualizar ante un paso que
  no conoce (UF-T12). El segundo factor del profesional (UF-11) no pasa por API-ACC-07: lo pide `/pro` en el website, y
  la app de la persona no lo pide.
- **Las partes con APK nueva** entran en la candidata que se congela el 25/11 o esperan la siguiente.
- **El método, el de la etapa 1:**
  - los oráculos primero (TEST-UF-007 en adelante, en `WP-USO-FINAL-ORACULOS.md`), cada uno probado en rojo con una
    mutación;
  - un commit por parte, con su TRACE;
  - las migraciones solo agregan;
  - los contratos, en `packages/domain`, con OPERACIONES y el OpenAPI al día;
  - la API, con permisos, auditoría, idempotencia donde corresponde y límites de intento.

### 13.4 La primera mitad, programada (PR #257, sin integrar)

| Parte | Qué quedó | Oráculos |
|---|---|---|
| UF-09 | Con `APP_ENV=production` la API no ofrece lo sembrado como demostración (`BE_SYNTHETIC_SEED`) en los buscadores, las fichas visuales ni los habituales, y nada nuevo lo acepta (un plan, una plantilla, una receta, una comida o una sesión habitual, un registro). En `test` y en desarrollo, todo igual. Las filas quedan. | TEST-UF-013 |
| UF-11 | Una sesión de una identidad con perfil profesional actúa como profesional solo con el segundo factor verificado en esa sesión: sin él, el PDP deniega, ningún área opera y las listas donde es el profesional (vínculos, solicitudes, invitaciones, novedades) no traen lo suyo. Como persona, todo igual. La familia MFA (API-MFA-01 a 06) lo configura, lo verifica con el autenticador o un código de recuperación, lo reemplaza y renueva los códigos. `/pro` lo pide antes de montar la página, y «Seguridad» (`/pro/security`) lo administra. | TEST-UF-014 |
| UF-04 | API-ADM-14 incorpora una cuenta que ya existe (por su correo) como profesional: el perfil con su nombre profesional, su tipo y la matrícula de un sanitario (dos columnas nuevas), y por área la presentación, la verificación y la habilitación, con los hechos del administrador y el fundamento. API-ADM-15 cambia el nombre profesional con su hecho (`cambio_de_nombre_profesional`), y la base no deja cambiarlo sin él. La consola `/admin` incorpora desde la lista y cambia el nombre desde la ficha, que muestra la matrícula. | TEST-UF-009 |
| UF-06 | La persona descarga lo suyo: API-EXP-01 registra la exportación (24 h) y API-EXP-02 da una ruta firmada de 15 minutos (API-EXP-02-DESCARGA), que arma el archivo en ese momento con lo del titular y, de sus profesionales, solo el identificador y el nombre profesional. Pide el acceso, la rectificación o la supresión con API-RGT-01 a 03, cada pedido con su plazo, y Administración los resuelve una sola vez con API-ADM-16 y 17, con la respuesta para la persona y el fundamento interno. Dos tablas nuevas (`pedido_de_derecho` y `exportacion_propia`). «Tus datos» está en la cuenta del website, en Perfil de la app (APK nueva) y en `/admin/rights`. | TEST-UF-011 |

### 13.5 Decisiones de la implementación (UF-T15 en adelante, a ratificar por Dirección)

| ID | Decisión | Alternativa descartada |
|---|---|---|
| UF-T15 | **UF-09 · quién decide.** La regla vive en el dominio (`ofreceElCatalogoDeDemostracion`) y la decide el `APP_ENV` de la API, nunca el cliente. Solo `test` y `development` ofrecen el catálogo de demostración; producción y un ambiente que no se reconoce, no. Es al revés que los avisos de UF-08: un alimento con valores inventados en una base real lleva a una estimación equivocada, y en un ambiente mal configurado solo se pierde un ejemplo. | «Todo lo que no sea producción lo ofrece», como los avisos: un ambiente mal configurado ofrecería valores inventados. |
| UF-T16 | **UF-09 · dónde se filtra.** En un solo lugar de cada catálogo, el criterio de lo que un actor ve (`alimentoVisible` y `ejercicioVisible`). Alcanza a los buscadores (API-NUT-13, API-TRN-13 y sus búsquedas, que lee la 0.24 con la misma forma), las fichas visuales (API-EJE-05), los habituales y cada validación de lo que algo nuevo cita. Lo ya citado se lee sin filtro (las instantáneas y `versionesPorId`): la historia no se borra. | Filtrar solo los buscadores y validar aparte en cada escritura: más lugares donde olvidarse uno. |
| UF-T17 | **UF-11 · dónde se exige.** En el servidor, en cada pedido: `SesionGuard` lee de la base el estado del segundo factor de la sesión (perfil profesional, autenticador activo y verificación de esa sesión) y lo anota en el contexto del pedido. Lo preguntan el PDP (la situación del actor, `conSegundoFactor`), el criterio de las áreas (`puedeOperarArea`) y las listas donde la identidad es el profesional. Sin él responde lo que ya responde a quien no puede: el 404 de lo ajeno, el 403 o el 422 de quien no opera el área, y listas sin lo profesional. Ninguna operación que ya existe suma un código de error. | Un 403 MFA_REQUIRED en cada operación profesional: sumarlo al contrato de unas cien operaciones y clasificar cada una (de la persona, del profesional o de los dos). |
| UF-T18 | **UF-11 · sobre la sesión común.** El segundo factor va sobre la sesión de siempre, en la misma tabla del de Administración (una migración amplía su disparador a la sesión común de un profesional). La app de la persona no cambia: sus sesiones actúan como persona, también la de un profesional. | Una clase de sesión PROFESIONAL con su propia entrada, como Administración: otro inicio de sesión para `/pro`. |
| UF-T19 | **UF-11 · la primera vez se configura solo,** dentro de los 10 minutos de entrar (con la contraseña o con Google), sin un código de incorporación: un token robado no alcanza. Pasado el plazo, se vuelve a entrar. | Un código que emite Administración, como para los administradores: un paso más para cada profesional que ya existe. |
| UF-T20 | **UF-11 · cuánto vale.** Lo que dura la sesión (12 h como máximo), sin vencer por inactividad. Reemplazar el autenticador o renovar los códigos pide además una entrada reciente (10 minutos), igual con contraseña que con Google; las otras sesiones de la identidad vuelven a pedir el código, sin cerrarse (pueden ser las de la app). Cinco códigos que no valen revocan la sesión, como en Administración. | Los 15 minutos de inactividad de Administración, que en un consultorio piden el código a cada rato; o la contraseña para reemplazar, que una cuenta de Google no tiene. |
| UF-T21 | **UF-11 · la familia MFA** (API-MFA-01 a 06, `/me/second-factor`), propia de BE y declarada en la guardia de trazabilidad con DL-169. No pasa por API-ACC-07. | Un paso más de API-ACC-07: la 0.24 de un profesional que usa la app como persona pediría actualizar. |
| UF-T22 | **UF-11 · el contexto del pedido.** El estado viaja en un AsyncLocalStorage, como la captura de decisiones del PDP, que abre un middleware después de los parsers del cuerpo. Fuera de un pedido (una tarea interna) o para otra identidad (la persona que mira el modo de acceso de su profesional) no hay condición: no es una acción de esa sesión. | Pasar la sesión como parámetro a las cerca de cincuenta llamadas al criterio de las áreas. |
| UF-T23 | **UF-04 · la cuenta, por su correo.** API-ADM-14 la encuentra por el correo de acceso o el de Google, que Administración conoce por el canal, y la toma en modo exclusivo: dos incorporaciones de la misma cuenta quedan una después de la otra. Sin cuenta, 404; administrativa, no operativa o ya profesional, 422 en el campo del correo. | Por el identificador de la identidad, que Administración no conoce. |
| UF-T24 | **UF-04 · los hechos de siempre.** La incorporación registra, del administrador y con el mismo fundamento, el perfil creado y, por área, la presentación, la verificación y la habilitación: la trayectoria de M-02 de cualquier área. No avisa por Novedades: el profesional lo sabe por el canal, y al entrar configura su segundo factor. | Un hecho nuevo «incorporado» que saltee la trayectoria: la historia de esas áreas quedaría distinta de la de las demás. |
| UF-T25 | **UF-04 · el nombre cambia en el perfil, con su hecho.** El perfil profesional era de solo agregar; la migración reemplaza esa guardia por una que solo deja cambiar el nombre, y solo con su `cambio_de_nombre_profesional` en la misma transacción (el nombre anterior, el nuevo, el fundamento y el administrador). Todo lo demás del perfil sigue inmutable, con el mismo mensaje de antes, y los cerca de treinta lugares que leen el nombre no cambian. API-ADM-15 va contra el nombre que vio el administrador (409 si cambió). | Una tabla de versiones del nombre que lean todos: tocar los cerca de treinta lectores. |
| UF-T26 | **UF-04 · en `test`, solo cuentas sintéticas** (`@example.invalid`), como el comando del primer administrador (08 §33); en producción, cualquiera. La siembra de la demostración sigue como está. | Cualquier cuenta también en `test`: abriría la puerta a datos reales antes del gate. |
| UF-T27 | **UF-04 · la matrícula,** un número (hasta 40 caracteres) y una jurisdicción (hasta 80), solo de un sanitario y en dos columnas nuevas y nulas del perfil (CHECK: las dos o ninguna, y solo de un sanitario). La ve Administración en la ficha; mostrarla a la persona es UF-17 (P1). | Guardarla en la procedencia del perfil: no se podría exigir ni consultar. |
| UF-T28 | **UF-06 · los IDs del 09.** API-RGT-01 a 03 y API-EXP-01 y 02 son los del 09 v0.12 (§14 y §15), que no estaban en el inventario de BE: la guardia de trazabilidad los declara aparte (`IDS_DEL_09_FUERA_DEL_INVENTARIO`), con DL-169. La descarga es API-EXP-02-DESCARGA, una variante propia con su sufijo. Administración resuelve con API-ADM-16 y 17, de su familia. | Una familia propia (por ejemplo, API-DER): se perdería el hilo con el 09, que ya los nombra. |
| UF-T29 | **UF-06 · el archivo no se guarda.** La exportación guarda solo sus dominios y su vencimiento (24 horas); el archivo se arma al descargarlo, con lo del titular en ese momento, y cada entrega se audita sin el contenido. | Generarlo y guardarlo: otra copia de datos de salud para proteger y borrar, y una tarea que la arme. |
| UF-T30 | **UF-06 · la descarga, por una ruta firmada** de 15 minutos (08 §21): la misma construcción que la de los medios, con otra clave derivada (HKDF) del secreto del servidor, así una ruta de un medio no abre una exportación. Cada lectura de API-EXP-02 da una ruta nueva. Una ruta alterada, vencida o de una exportación vencida, el mismo 404. Como no lleva sesión, el cupo es por red (el de las lecturas protegidas, 429), antes de verificarla. | Que API-EXP-02 devuelva el archivo con la sesión en el encabezado: el navegador del teléfono y la pestaña nueva del website no llevan ese encabezado. |
| UF-T31 | **UF-06 · los plazos.** Diez días corridos para el acceso (Ley 25.326, art. 14) y cinco días hábiles para rectificar o suprimir (art. 16), en la fecha civil de Buenos Aires. Los hábiles son de lunes a viernes, sin contar feriados: el plazo queda igual o antes que el legal, nunca después. A confirmar con la asesoría. | Descontar los feriados nacionales: un plazo algo más largo, con una tabla para mantener cada año (los feriados puente los fija el Gobierno). |
| UF-T32 | **UF-06 · quién resuelve.** Administración, una sola vez: hecho o no se pudo, con la respuesta que ve la persona y el fundamento, que ve solo Administración. La supresión se hace con el cierre de la cuenta y la política de 08 §18, no con un borrado nuevo; la respuesta dice lo hecho y lo que se conserva. La base no deja resolver sin un administrador con su rol vigente, ni cambiar nada más del pedido. | Que la supresión borre al pedirla: contradice lo que la ley obliga a conservar y la historia de solo agregar. |
| UF-T33 | **UF-06 · en la app.** «Tus datos» es un ajuste de Perfil, después de Privacidad (TEST-AVR-004 cambia con esa fila, con su nota). La descarga la hace el navegador del teléfono: el archivo no pasa por la app. | Un enlace dentro de Privacidad, sin tocar TEST-AVR-004: menos a la vista. O guardar el archivo desde la app: más código nativo y una copia en el teléfono. |
| UF-T34 | **UF-03 · un código, no un enlace.** La prueba temporal (08 §24.4) es un código de diez caracteres del alfabeto de los códigos (Crockford, 50 bits), que la persona escribe en la pantalla donde lo pidió, con guion o sin él. El correo es texto plano y no lleva enlaces. La base guarda solo su huella: un HMAC con una clave derivada (HKDF) del secreto del servidor, propia de la recuperación (08 §31.4). | Un enlace con un token: pide abrir la app desde el correo (enlaces profundos en la APK) y enseña a tocar enlaces que llegan por correo, que es la forma del phishing. |
| UF-T35 | **UF-03 · la respuesta neutra.** API-ACC-P1-01 responde siempre 202 con un `recoveryId` nuevo, el vencimiento de un código por correo (30 minutos) y `delivery`, que depende del ambiente (EMAIL con proveedor, ASSISTED sin él) y nunca de la cuenta. El trabajo es el mismo en todas las ramas, y el correo sale después de confirmar, sin esperarlo. Al completar, vale cualquier código vigente de la cuenta del pedido. | Un 202 sin cuerpo, como lo bosqueja el 09, y completar con el correo y el código: el correo viajaría dos veces y el pedido no tendría dónde contar sus intentos. |
| UF-T36 | **UF-03 · vigencias e intentos.** El código del correo vale 30 minutos y el asistido, 24 horas; los dos sirven una vez. Cinco códigos que no valen sobre un pedido lo anulan. Pedir: 3 por hora por correo, desde cualquier red (08 §38), y 30 por hora por red. Completar: 10 cada 15 minutos por red. Una contraseña nueva que no cumple la política no gasta un intento. | Sin tope por pedido, solo el cupo por red: quien cambia de red seguiría probando códigos del mismo pedido. |
| UF-T37 | **UF-03 · la cuenta con Google.** No tiene contraseña que recuperar (02:302): el pedido no crea nada y, si BE manda correos, le llega uno que dice que entra con «Continuar con Google». La pantalla lo recuerda siempre, sin decir si la cuenta existe. Una cuenta con los dos métodos recupera su contraseña. | Crearle una contraseña a la cuenta de Google: un segundo método que nadie pidió. |
| UF-T38 | **UF-03 · el proveedor de correo.** Un adaptador para Brevo o Postmark, los dos con DPA y una API por HTTPS, con `BE_CORREO_PROVEEDOR`, `BE_CORREO_CLAVE` y `BE_CORREO_REMITENTE` (las tres juntas o ninguna; en producción, un remitente que no sea sintético). Sin configuración, la API no manda correos y la respuesta dice ASSISTED. El correo se manda sin reintentos, con presupuesto de tiempo y sin registrar el destinatario ni el texto. | SMTP con una biblioteca: otra dependencia y otro puerto. O un solo proveedor fijo: Dirección elige con la cuenta y el DPA. |
| UF-T39 | **UF-03 · la recuperación asistida** (UF-D9), API-ADM-18 de la familia ADM, con segundo factor y fundamento: Administración verifica a la persona por el canal de ayuda y emite un código de un solo uso. Cierra las sesiones de la cuenta y anula sus códigos anteriores. No tiene idempotencia, para que el código no quede guardado: cada envío emite uno nuevo y anula el anterior. No sirve para cuentas administrativas (las restablece el operador con el comando interno) ni para las que entran con Google. La persona usa el código en la misma pantalla que el del correo. | Que Administración defina la contraseña: la conocería. O un código emitido sin cerrar las sesiones: quien tomó la cuenta seguiría adentro. |
| UF-T40 | **UF-03 · la credencial cambia solo con su hecho.** El cambio se registra en `cambio_de_credencial` (el método, la recuperación usada y la transacción). La guardia de la base, que desde WP-02 no dejaba modificar la credencial, ahora deja hacerlo solo con ese hecho en la misma transacción; la supresión al cierre sigue igual. | Aflojar la guardia sin un hecho: cualquier código podría cambiar una contraseña sin dejar rastro en la base. |
| UF-T41 | **UF-03 · al terminar, entra.** El website (`/recover`) y la APK (Iniciar sesión → «¿Olvidaste tu contraseña?») inician sesión con la contraseña nueva y siguen como el login. Si eso no responde, ofrecen «Iniciar sesión». La consola tiene «Recuperar el acceso» (`/admin/access`), que muestra el código una sola vez. | Volver a Iniciar sesión y escribirla otra vez: un paso más, justo después de elegirla. |
| UF-T42 | **UF-07 · el canal sale de la API.** API-SOP-01 (`GET /support/contact`, familia SOP, propia de BE) es pública y devuelve lo que tiene la configuración (`BE_CONTACTO_SOPORTE` y `BE_CONTACTO_PRIVACIDAD`), o `null`; no lee la base y se puede guardar cinco minutos. El website (estático) y la APK la leen cada vez que muestran el canal, así que cambiar una dirección no pide otro build ni otra APK. Sin configuración, las pantallas dicen que el canal todavía no está publicado. | Las direcciones en el build de cada cliente: cambiarlas pediría una APK nueva. |
| UF-T43 | **UF-07 · dos direcciones.** Soporte (la app, la cuenta, recuperar el acceso, entrar como profesional) y privacidad (los datos y los derechos, 08 §19), cada una optativa. En producción, una dirección de un dominio reservado para ejemplos (`.invalid`, `.example`, `example.com`…) no deja arrancar la API. | Una sola dirección: los pedidos de derechos, que tienen plazo legal, se mezclarían con las consultas de soporte. |
| UF-T44 | **UF-07 · dónde está.** En el website, «Ayuda y contacto» en el pie de cada página pública (la página `/help`, con los casos más comunes) y una sección en `/account`; en la APK, Perfil → «Ayuda y contacto», después de «Tus datos» (TEST-AVR-004 cambia con esa fila, con su nota). En la recuperación asistida (web y APK), la dirección de soporte a la que hay que escribir. Cada dirección abre el correo con un asunto. | Las direcciones en el pie de todas las páginas: un pedido a la API en cada página pública. |
| UF-T45 | **UF-07 · ninguna dirección en el código.** Una guardia (`scripts/sin-correos-en-el-codigo.test.cjs`) recorre lo que se publica (el dominio, la API, el website y la APK, sin las pruebas) y exige que toda dirección sea de un dominio reservado para ejemplos. | Revisarlo a mano en cada PR: el repositorio es público y una dirección escrita se publica con el primer push. |

### 13.6 La segunda mitad, programada (PR #257, sin integrar)

Las decisiones de esta mitad siguen en la tabla del §13.5, desde UF-T34, y quedan a ratificar como las demás.

| Parte | Qué quedó | Oráculos |
|---|---|---|
| UF-03 | La persona pide la recuperación con su correo (API-ACC-P1-01) y la respuesta es la misma exista o no la cuenta: un 202 con el pedido, su vencimiento y cómo llega el código. Con el código y una contraseña nueva (API-ACC-P1-02) la cambia: la identidad es la misma, todas sus sesiones terminan y queda auditado; un código que no vale, siempre el mismo 422, y cinco anulan el pedido. El correo de BE es un adaptador para Brevo o Postmark que se prende con `BE_CORREO_*`; sin él, rige la recuperación asistida: Administración emite el código desde `/admin/access` (API-ADM-18), con fundamento, y cierra las sesiones. Dos tablas nuevas (`recuperacion_de_acceso` y `cambio_de_credencial`), y la base deja cambiar una credencial solo con su cambio registrado. En el website, `/recover` desde Iniciar sesión; en la APK (nueva), «¿Olvidaste tu contraseña?» en Iniciar sesión. | TEST-UF-007 y TEST-UF-008 |
| UF-07 | El canal de ayuda y contacto sale de la configuración de la API y se lee con API-SOP-01, pública: la dirección de soporte y la de privacidad, o `null` si Dirección todavía no las cargó (`BE_CONTACTO_SOPORTE` y `BE_CONTACTO_PRIVACIDAD`). En el website, «Ayuda y contacto» en el pie (`/help`) y en `/account`; en la APK (nueva), Perfil → «Ayuda y contacto». La recuperación asistida muestra la dirección de soporte. Una guardia exige que ninguna dirección real quede escrita en el código. | TEST-UF-017 |
