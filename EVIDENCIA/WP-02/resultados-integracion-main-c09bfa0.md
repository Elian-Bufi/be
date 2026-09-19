# Resultados de integración por ID de prueba

- Fuente: `resultados-integracion-main-c09bfa0-35412614860.json` (Jest `--json`), inicio 2026-09-19T01:26:31.364Z.
- Totales: **102** · pasaron **102** · fallaron **0** · pendientes 0.
- Suites: 9 (0 fallidas). Resultado global: **OK**.

## Por ID

| ID | Pasaron | Fallaron | Otras |
|---|---|---|---|
| (sin ID 11A) | 23 | 0 | 0 |
| E2E-08 | 1 | 0 | 0 |
| INV-06-22 | 2 | 0 | 0 |
| REG-06-18 | 1 | 0 | 0 |
| T-06-01 | 1 | 0 | 0 |
| T-06-02 | 2 | 0 | 0 |
| T-06-24 | 1 | 0 | 0 |
| TEST-AUTH-001 | 4 | 0 | 0 |
| TEST-AUTH-002 | 3 | 0 | 0 |
| TEST-AUTH-009 | 1 | 0 | 0 |
| TEST-AUTH-011 | 2 | 0 | 0 |
| TEST-AUTH-012 | 1 | 0 | 0 |
| TEST-AUTH-013 (b) | 3 | 0 | 0 |
| TEST-CT | 2 | 0 | 0 |
| TEST-CT-ACC-01 | 5 | 0 | 0 |
| TEST-CT-ACC-02 | 1 | 0 | 0 |
| TEST-CT-ACC-04 | 1 | 0 | 0 |
| TEST-CT-ACC-05 | 5 | 0 | 0 |
| TEST-CT-P1-ACC-P1-03 | 1 | 0 | 0 |
| TEST-DOM-008 | 1 | 0 | 0 |
| TEST-RF-001 | 3 | 0 | 0 |
| TEST-RF-002 | 2 | 0 | 0 |
| TEST-RF-069 | 1 | 0 | 0 |
| TEST-RNF-DAT-001 | 12 | 0 | 0 |
| TEST-RNF-REC-002 | 4 | 0 | 0 |
| TEST-RNF-SEC-002 | 1 | 0 | 0 |
| TEST-RNF-SEC-003 | 4 | 0 | 0 |
| TEST-RNF-SEC-005 | 1 | 0 | 0 |
| TEST-RUN-002 | 2 | 0 | 0 |
| TEST-RUN-003 | 3 | 0 | 0 |
| TEST-RUN-009 | 1 | 0 | 0 |
| TEST-UC-P25 | 1 | 0 | 0 |
| TEST-UC-P26 | 1 | 0 | 0 |
| TEST-UC-P27 | 5 | 0 | 0 |

## Detalle

| Archivo | Prueba | Estado | ms |
|---|---|---|---|
| sesiones.int-spec.ts | TEST-AUTH-001 — login inválido neutral › TEST-AUTH-001: código, cuerpo y headers indistinguibles; sin details; ninguna sesión creada | PASS | 310 |
| sesiones.int-spec.ts | TEST-AUTH-001 — login inválido neutral › TEST-AUTH-001: la causa real queda solo en la auditoría interna (09v7 T16) | PASS | 72 |
| sesiones.int-spec.ts | TEST-AUTH-001 — login inválido neutral › TEST-AUTH-001: el hash señuelo usa el costo de los hashes guardados aunque BCRYPT_COST cambie (DL-014) | PASS | 201 |
| sesiones.int-spec.ts | TEST-AUTH-001 — login inválido neutral › TEST-AUTH-001: tiempo indistinguible — medianas dentro de max(50 ms, 35 %) (DEUDA_LEGAJO DL-014) | PASS | 3254 |
| sesiones.int-spec.ts | TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local › TEST-CT-ACC-02: login 201 con el contrato exacto; Bearer de 12 h, sin renovación; fila de sesión con superficie | PASS | 168 |
| sesiones.int-spec.ts | TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local › TEST-CT-ACC-05: /me devuelve identidad, estado y sesión propios; nunca hash, token ni A3 | PASS | 159 |
| sesiones.int-spec.ts | TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local › TEST-CT-ACC-05: sin Authorization → 401 undefined | PASS | 2 |
| sesiones.int-spec.ts | TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local › TEST-CT-ACC-05: esquema no Bearer → 401 Basic abc | PASS | 2 |
| sesiones.int-spec.ts | TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local › TEST-CT-ACC-05: token basura → 401 Bearer no-es-un-jwt | PASS | 2 |
| sesiones.int-spec.ts | TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local › TEST-CT-ACC-05: token firmado con otro secreto o con alg none → 401 SESSION_INVALID | PASS | 151 |
| sesiones.int-spec.ts | TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local › TEST-UC-P26: logout (ACC-03) finaliza la sesión actual; la request siguiente da 401; repetir es idempotente; la cuenta sigue OPERATIVA | PASS | 233 |
| sesiones.int-spec.ts | TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local › TEST-CT-ACC-04: revocar todas (ACC-04) invalida las sesiones de web y APK en la request siguiente | PASS | 309 |
| sesiones.int-spec.ts | TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local › TEST-RF-002: parámetros de query no declarados en /me → 400 INVALID_REQUEST (09 §3.1) | PASS | 148 |
| sesiones.int-spec.ts | Suspensión revoca sesiones — INV-06-28 · 09v8 «suspensión que exige revocación invalida sesión» › TEST-RF-002: SuspenderCuenta revoca las sesiones vigentes, bloquea el login y RestablecerCuenta no las revive | PASS | 305 |
| sesiones.int-spec.ts | TEST-RNF-SEC-003 — límite de intentos neutral › TEST-RNF-SEC-003: login — 429 RATE_LIMITED idéntico exista o no la cuenta, aun con la contraseña correcta | PASS | 633 |
| sesiones.int-spec.ts | TEST-RNF-SEC-003 — límite de intentos neutral › TEST-RNF-SEC-003: login — cupo global por red (08:786): identificadores distintos desde la misma red también se frenan | PASS | 381 |
| sesiones.int-spec.ts | TEST-RNF-SEC-003 — límite de intentos neutral › TEST-RNF-SEC-003: login — cupo por identificador desde cualquier red (DL-030): un pool de IPs no multiplica los intentos contra una cuenta | PASS | 597 |
| sesiones.int-spec.ts | TEST-RNF-SEC-003 — límite de intentos neutral › TEST-RNF-SEC-003: registro — 429 al superar el límite por IP, sin crear identidad | PASS | 167 |
| registro.int-spec.ts | TEST-AUTH-002 — el registro no concede A3 › TEST-AUTH-002: tras ACC-01 existen A1 y A2 separados con evidencia propia, cero A3, sin rol ni sesión | PASS | 135 |
| registro.int-spec.ts | TEST-AUTH-002 — el registro no concede A3 › TEST-AUTH-002: CON-05 responde currentConsent null (A3 no otorgado) después del registro | PASS | 176 |
| registro.int-spec.ts | TEST-AUTH-002 — el registro no concede A3 › TEST-AUTH-002: un campo de consentimiento A3 en el registro se rechaza con 400 UNKNOWN_FIELD y no crea nada | PASS | 4 |
| registro.int-spec.ts | TEST-RF-001 — una identidad por identificador, garantizado por índice único › TEST-RF-001: 8 registros concurrentes con el mismo correo (keys distintas) crean exactamente 1 identidad | PASS | 194 |
| registro.int-spec.ts | TEST-RF-001 — una identidad por identificador, garantizado por índice único › TEST-RF-001: mayúsculas y espacios no evaden la unicidad (identificador normalizado) | PASS | 147 |
| registro.int-spec.ts | TEST-RF-001 — una identidad por identificador, garantizado por índice único › TEST-RF-001: la base rechaza por sí sola un segundo método LOCAL con la misma referencia (índice único) | PASS | 83 |
| registro.int-spec.ts | TEST-UC-P25 / TEST-CT-ACC-01 — registro › TEST-CT-ACC-01: 201 con el contrato exacto, sin sesión ni datos sensibles | PASS | 79 |
| registro.int-spec.ts | TEST-UC-P25 / TEST-CT-ACC-01 — registro › TEST-UC-P25: una sola transacción crea identidad OPERATIVA, perfil propio 1:1, método, credencial hasheada, eventos y auditoría | PASS | 90 |
| registro.int-spec.ts | TEST-UC-P25 / TEST-CT-ACC-01 — registro › TEST-DOM-008: ocurrencia y registro se guardan por separado en todos los hechos del alta | PASS | 91 |
| registro.int-spec.ts | TEST-UC-P25 / TEST-CT-ACC-01 — registro › TEST-CT-ACC-01: sin Idempotency-Key → 400 INVALID_REQUEST | PASS | 3 |
| registro.int-spec.ts | TEST-UC-P25 / TEST-CT-ACC-01 — registro › TEST-CT-ACC-01: Idempotency-Key inválida → 400 INVALID_REQUEST | PASS | 1 |
| registro.int-spec.ts | TEST-UC-P25 / TEST-CT-ACC-01 — registro › TEST-CT-ACC-01: versión de términos no vigente → 422 TERMS_VERSION_NOT_ACCEPTABLE; de privacidad → PRIVACY_VERSION_NOT_ACCEPTABLE | PASS | 3 |
| registro.int-spec.ts | TEST-UC-P25 / TEST-CT-ACC-01 — registro › TEST-CT-ACC-01: credencial corta o correo inválido → 400 INVALID_REQUEST con issues {code, path} | PASS | 2 |
| registro.int-spec.ts | TEST-UC-P25 / TEST-CT-ACC-01 — registro › TEST-AUTH-009: campos autoritativos del cliente (rol, estado, capacidades) → 400 UNKNOWN_FIELD | PASS | 5 |
| registro.int-spec.ts | TEST-RNF-REC-002 — idempotencia del registro › TEST-RNF-REC-002: misma key + mismo payload → mismo resultado sin duplicar efectos | PASS | 143 |
| registro.int-spec.ts | TEST-RNF-REC-002 — idempotencia del registro › TEST-RNF-REC-002: requests concurrentes con la misma key → una identidad y respuestas idénticas | PASS | 85 |
| registro.int-spec.ts | TEST-RNF-REC-002 — idempotencia del registro › TEST-RNF-REC-002: misma key con otro payload → 409 IDEMPOTENCY_KEY_REUSED | PASS | 151 |
| registro.int-spec.ts | TEST-RNF-SEC-005 — auditoría bloqueante (REQUIRED_SAME_TX) › TEST-RNF-SEC-005: si la auditoría del alta falla, no queda identidad ni efecto alguno (09v7 T18: no audit → no success) | PASS | 151 |
| registro.int-spec.ts | los identificadores de dominio son UUID opacos y no secuenciales | PASS | 156 |
| cierre.int-spec.ts | TEST-AUTH-011 — el cierre efectivo no permite una sesión nueva › TEST-AUTH-011: tras ACC-P1-03 el login con la credencial correcta da 401 neutral y no crea filas de sesión | PASS | 435 |
| cierre.int-spec.ts | TEST-AUTH-012 — el cierre invalida las sesiones actuales › TEST-AUTH-012: las sesiones previas de web y APK y la que ejecutó el cierre, con token aún vigente, dan 401 en la request siguiente | PASS | 328 |
| cierre.int-spec.ts | TEST-AUTH-013 — sin borrado silencioso › TEST-AUTH-013 (b): la identidad sigue presente en CERRADA con perfil, método, actos A1/A2 y eventos; el cierre queda asentado | PASS | 335 |
| cierre.int-spec.ts | TEST-AUTH-013 — sin borrado silencioso › TEST-AUTH-013 (b): lo único suprimido es el hash de la credencial (08 R-02), y la supresión queda registrada antes | PASS | 315 |
| cierre.int-spec.ts | TEST-AUTH-013 — sin borrado silencioso › TEST-AUTH-013 (b): la historia no se puede borrar después del cierre — la base rechaza DELETE de identidad, actos y eventos | PASS | 322 |
| cierre.int-spec.ts | TEST-UC-P27 / TEST-CT-P1-ACC-P1-03 — cierre de cuenta › TEST-CT-P1-ACC-P1-03: 201 con el contrato; identifica actor y fecha (RF-069) | PASS | 302 |
| cierre.int-spec.ts | TEST-UC-P27 / TEST-CT-P1-ACC-P1-03 — cierre de cuenta › TEST-RNF-REC-002: reintento con la misma key después del cierre → mismo resultado, sin duplicar el cierre | PASS | 314 |
| cierre.int-spec.ts | TEST-UC-P27 / TEST-CT-P1-ACC-P1-03 — cierre de cuenta › TEST-UC-P27 V03: sin consecuencias presentadas (versión no vigente) → 422 y la cuenta sigue OPERATIVA | PASS | 162 |
| cierre.int-spec.ts | TEST-UC-P27 / TEST-CT-P1-ACC-P1-03 — cierre de cuenta › TEST-UC-P27 V01: sin confirmación explícita → 422 y nada cambia | PASS | 155 |
| cierre.int-spec.ts | TEST-UC-P27 / TEST-CT-P1-ACC-P1-03 — cierre de cuenta › TEST-UC-P27 E01: sin sesión → 401 AUTHENTICATION_REQUIRED | PASS | 2 |
| cierre.int-spec.ts | TEST-UC-P27 / TEST-CT-P1-ACC-P1-03 — cierre de cuenta › TEST-UC-P27 step-up: sesión autenticada hace más de 10 minutos → 403 STEP_UP_REQUIRED y la cuenta sigue OPERATIVA (DL-017) | PASS | 174 |
| cierre.int-spec.ts | TEST-UC-P27 / TEST-CT-P1-ACC-P1-03 — cierre de cuenta › TEST-UC-P27: campo no declarado en el cuerpo → 400 UNKNOWN_FIELD | PASS | 150 |
| cierre.int-spec.ts | TEST-UC-P27 / TEST-CT-P1-ACC-P1-03 — cierre de cuenta › E2E-08: cierre → sesión inválida; el mismo correo no puede registrarse otra vez (identificador reservado, DL-011) | PASS | 370 |
| schema.int-spec.ts | Schema vs 06 — TEST-RUN-003 migration deploy › TEST-RUN-003: las migraciones de WP-01 y WP-02 quedaron aplicadas por migrate deploy | PASS | 43 |
| schema.int-spec.ts | Schema vs 06 — TEST-RUN-003 migration deploy › T-06-02: el enum de la base es exactamente el conjunto cerrado de @be/domain (06 §5.7.2) | PASS | 2 |
| schema.int-spec.ts | Schema vs 06 — TEST-RUN-003 migration deploy › T-06-01/T-06-02/T-06-24: columnas de identidad del 06 §5.4.2 con nulabilidad y defaults | PASS | 11 |
| schema.int-spec.ts | Schema vs 06 — TEST-RUN-003 migration deploy › los estados son enums, nunca booleanos: no hay columnas boolean en el schema | PASS | 4 |
| schema.int-spec.ts | Schema vs 06 — TEST-RUN-003 migration deploy › REG-06-18: ocurrencia desconocida queda NULL; el registro no se copia en su lugar | PASS | 4 |
| schema.int-spec.ts | Schema vs 06 — TEST-RUN-003 migration deploy › T-06-02: un valor fuera del conjunto cerrado es rechazado por la base | PASS | 12 |
| schema.int-spec.ts | INV-06-22 — exactamente un Perfil propio por Identidad › INV-06-22: una Identidad sin Perfil propio no puede confirmarse (constraint trigger diferido) | PASS | 3 |
| schema.int-spec.ts | INV-06-22 — exactamente un Perfil propio por Identidad › INV-06-22: un segundo Perfil propio para la misma Identidad viola el índice único | PASS | 4 |
| schema.int-spec.ts | 08 §12.2 — catálogo de textos versionados › el catálogo de la base es idéntico al de @be/domain, y cada hash es el SHA-256 del texto | PASS | 4 |
| schema.int-spec.ts | 08 §12.2 — catálogo de textos versionados › una versión publicada no se reescribe ni se borra | PASS | 4 |
| schema.int-spec.ts | 08 §29 — historia por adición › registro_de_auditoria: UPDATE es rechazado por la base | PASS | 3 |
| schema.int-spec.ts | 08 §29 — historia por adición › registro_de_auditoria: DELETE es rechazado por la base | PASS | 3 |
| schema.int-spec.ts | 08 §29 — historia por adición › registro_de_supresion: UPDATE es rechazado por la base | PASS | 3 |
| schema.int-spec.ts | 08 §29 — historia por adición › registro_de_supresion: DELETE es rechazado por la base | PASS | 2 |
| schema.int-spec.ts | 08 §29 — historia por adición › registro_de_idempotencia: UPDATE es rechazado por la base | PASS | 3 |
| schema.int-spec.ts | 08 §29 — historia por adición › registro_de_idempotencia: DELETE es rechazado por la base | PASS | 2 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE evento_de_dominio es rechazado (esquivaría los triggers de fila) | PASS | 3 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE registro_de_auditoria es rechazado (esquivaría los triggers de fila) | PASS | 1 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE registro_de_supresion es rechazado (esquivaría los triggers de fila) | PASS | 1 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE solicitud_de_cierre_de_cuenta es rechazado (esquivaría los triggers de fila) | PASS | 2 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE acto_registrable es rechazado (esquivaría los triggers de fila) | PASS | 1 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE identidad es rechazado (esquivaría los triggers de fila) | PASS | 3 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE version_de_texto es rechazado (esquivaría los triggers de fila) | PASS | 2 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE perfil_propio es rechazado (esquivaría los triggers de fila) | PASS | 2 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE metodo_de_acceso es rechazado (esquivaría los triggers de fila) | PASS | 2 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE credencial_local es rechazado (esquivaría los triggers de fila) | PASS | 1 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE sesion es rechazado (esquivaría los triggers de fila) | PASS | 4 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE control_de_sesion es rechazado (esquivaría los triggers de fila) | PASS | 2 |
| schema.int-spec.ts | 08 §29 — historia por adición › TRUNCATE registro_de_idempotencia es rechazado (esquivaría los triggers de fila) | PASS | 2 |
| schema.int-spec.ts | T-06-24 — una sesión no termina antes de empezar › CHECK sesion_cierre_coherente: la base rechaza una finalización anterior al inicio | PASS | 7 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — transiciones declaradas › la lista blanca tiene exactamente las 3 transiciones del 06 §5.7.4 | PASS | 1 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — transiciones declaradas › TEST-RNF-DAT-001 SuspenderCuenta: OPERATIVA → SUSPENDIDA con evento CuentaSuspendida (anterior/resultante, actor servicio) | PASS | 149 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — transiciones declaradas › TEST-RNF-DAT-001 RestablecerCuenta: SUSPENDIDA → OPERATIVA con evento CuentaRestablecida | PASS | 87 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — transiciones declaradas › TEST-RNF-DAT-001 CerrarCuenta: OPERATIVA → CERRADA con evento CuentaCerrada (vía ACC-P1-03) | PASS | 189 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — transiciones declaradas › TEST-RNF-DAT-001: guardas explícitas — sin fundamento no se suspende; sin resolución no se restablece | PASS | 84 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — SUSPENDIDA → CERRADA no existe › TEST-RNF-DAT-001: el servicio rechaza CerrarCuenta sobre una cuenta SUSPENDIDA (TRANSICION_NO_DECLARADA) y no deja efectos | PASS | 84 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — SUSPENDIDA → CERRADA no existe › TEST-RNF-DAT-001: la base rechaza SUSPENDIDA → CERRADA aunque se saltee el servicio | PASS | 101 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — SUSPENDIDA → CERRADA no existe › TEST-RNF-DAT-001: por ACC-P1-03 tampoco — una cuenta SUSPENDIDA no tiene sesión que la cierre | PASS | 152 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — CERRADA es terminal › TEST-RNF-DAT-001: la base rechaza CERRADA → OPERATIVA | PASS | 89 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — CERRADA es terminal › TEST-RNF-DAT-001: la base rechaza CERRADA → SUSPENDIDA | PASS | 90 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — CERRADA es terminal › TEST-RNF-DAT-001: el servicio rechaza RestablecerCuenta, SuspenderCuenta y CerrarCuenta sobre CERRADA | PASS | 96 |
| maquina-de-estado.int-spec.ts | TEST-RNF-DAT-001 — CERRADA es terminal › TEST-RNF-DAT-001: la base rechaza nacer SUSPENDIDA o CERRADA (estado inicial OPERATIVA, 06 §5.7.2) | PASS | 4 |
| contrato.int-spec.ts | TEST-CT: se ejercitan éxitos y errores de las siete operaciones autorizadas | PASS | 761 |
| contrato.int-spec.ts | TEST-CT: todo (status, código) observado está declarado para su operación; los éxitos coinciden con el contrato | PASS | 1 |
| concurrencia.int-spec.ts | TEST-RF-069 / 06 §5.7.4: dos cierres simultáneos con keys distintas → exactamente un CuentaCerrada; el otro 422 INVALID_STATE_TRANSITION | PASS | 357 |
| concurrencia.int-spec.ts | TEST-AUTH-011 en carrera: un login con la contraseña correcta que llega mientras el cierre retiene la cuenta → 401, sin sesión ACTIVA, con auditoría del rechazo | PASS | 207 |
| concurrencia.int-spec.ts | 06 §5.8 en carrera: sesiones que llegan mientras el cierre espera el bloqueo quedan revocadas, con finalización ≥ inicio | PASS | 256 |
| sanitizacion.int-spec.ts | TEST-RNF-SEC-002 / TEST-RNF-OBS-001 / TEST-RUN-009: ni credenciales, ni tokens, ni hashes, ni correos, ni IP en logs, auditoría o respuestas | PASS | 438 |
| sanitizacion.int-spec.ts | TEST-RUN-009: un error no clasificado deja en el log solo tipo y requestId, nunca el mensaje | PASS | 150 |
| despliegue.int-spec.ts | Despliegue reproducible — ASR-09 › TEST-RUN-002: /health/ready 200 contra base real con migraciones al día | PASS | 138 |
| despliegue.int-spec.ts | Despliegue reproducible — ASR-09 › TEST-RUN-002: artefacto con migración no aplicada → 503 DB_UNAVAILABLE / PENDIENTES | PASS | 129 |
| despliegue.int-spec.ts | Despliegue reproducible — ASR-09 › TEST-RUN-003 / 07 §62: una migración fallida aborta el deploy y no queda registrada como aplicada | PASS | 951 |
