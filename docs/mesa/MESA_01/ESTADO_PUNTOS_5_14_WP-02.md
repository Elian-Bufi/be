# MESA-01 — estado de DV-05 y DV-14 tras WP-02

> Nota de actualización del ejecutor técnico. **No modifica** la matriz ni el informe del 2026-09-10, ni `docs/mesa/MESA_02/DV-05/DV-05_CASOS_DE_PRUEBA.csv`: esos archivos están en `docs/MANIFEST.sha256`, y editarlos rompería la verificación de hashes de la entrega de Dirección. Cuando Dirección quiera consolidar, reemplaza los archivos y reemite el manifiesto.

**Fecha:** 2026-09-19 · **Paquete:** WP-02 «Identidad y sesiones» · **Fuente de exigencia:** `Entregables.pdf` de la escuela, puntos 5 («Casos de prueba») y 14 («Usuarios creados para acceder a la APK y al Website con diferentes roles»). El PDF no está versionado: ver `docs/fuente_escolar/LEEME.md`.

## Punto 5 — Casos de prueba: primeros resultados reales

El catálogo DV-05 (`DV-05_CASOS_DE_PRUEBA.csv`, 59 casos) tenía todos los casos en `NOT_EXECUTED`. WP-02 ejecuta los que caen dentro de su alcance, con su oráculo y contra PostgreSQL 16 real. Hay tres ejecuciones:
- **CI:** integración por Testcontainers en GitHub Actions;
- **ambiente `test`:** recorrido del website desplegado en Render;
- **APK:** en el teléfono de Dirección.

| Caso DV-05 | Oráculo verificado | Estado | Evidencia |
|---|---|---|---|
| **TEST-RF-001** (RF-001, UC-P25) | Con datos válidos se crea una sola identidad. Un correo ya asociado no produce una segunda cuenta, **ni con 8 altas concurrentes**: lo garantiza un índice único en la base. El alta no concede A3, rol ni acceso a terceros | **PASS** | `registro.int-spec.ts` (3 pruebas) · CI main `c09bfa0` |
| **TEST-AUTH-001** | Identificador inexistente, contraseña incorrecta y cuentas SUSPENDIDA o CERRADA dan el mismo `401 INVALID_CREDENTIALS`, con el mismo cuerpo y los mismos headers. El tiempo queda dentro de max(50 ms, 35 %) | **PASS** | `sesiones.int-spec.ts` (4 pruebas) · capturas `web-05`, `web-09` |
| **TEST-AUTH-002** | Después del registro existen A1 y A2 separados, con evidencia propia, y cero A3. CON-05 responde `currentConsent: null` | **PASS** | `registro.int-spec.ts` (3 pruebas) · capturas `web-02`, `web-03`, `web-06` |
| **TEST-AUTH-011** | Con la cuenta cerrada, un login con la contraseña correcta da 401 neutral y no crea sesión. También en carrera, con el cierre reteniendo la fila | **PASS** | `cierre.int-spec.ts` · `concurrencia.int-spec.ts` · captura `web-09` |
| **TEST-AUTH-012** | Las sesiones previas de web y APK, y la que ejecutó el cierre, dan 401 en la request siguiente aunque su token no haya vencido | **PASS** | `cierre.int-spec.ts` |
| **TEST-AUTH-013** | (b) Sin borrado silencioso: identidad, perfil, método, A1/A2 y eventos siguen presentes; la base rechaza el DELETE | **PASS (b)** | `cierre.int-spec.ts` (3 pruebas) |
| **TEST-AUTH-013** | (a) «Finaliza vínculos por eventos» | **BLOCKED** | no hay modelo de vínculos (DEUDA_LEGAJO DL-018) |
| TEST-AUTH-009 (parcial) | Campos autoritativos del cliente (rol, estado, capacidades) → `400 UNKNOWN_FIELD` | **PASS (parcial)** | `registro.int-spec.ts` |
| TEST-RF-006 / TEST-RF-007 | Solo parte del alcance: estado operativo visible (nunca «habilitado») y recorrido en website y APK | **Parcial** | capturas `web-06` · capturas del APK (§3) |

Además de los casos del catálogo DV-05, WP-02 ejecuta pruebas del 11A que la mesa todavía no transcribió:
- TEST-UC-P25/P26/P27;
- TEST-CT-ACC-01…05 y TEST-CT-P1-ACC-P1-03 (el runtime no emite códigos fuera del contrato);
- TEST-RNF-DAT-001 (una prueba por transición declarada y `SUSPENDIDA → CERRADA` rechazada en el servicio, la API y la base);
- TEST-RNF-REC-002, SEC-002, SEC-003, SEC-005 y OBS-001;
- TEST-RUN-003 y 009;
- TEST-DOM-008 y E2E-08.

Totales de la CI de `main` en `c09bfa0`:
- integración: **102 de 102**;
- unitarias: 29 de 29 en la API y 30 de 30 en el dominio.

Detalle por ID en `EVIDENCIA/WP-02/resultados-integracion-main-c09bfa0.md`.

## Punto 14 — Usuarios creados: primeras dos cuentas demo

Existen en el ambiente `test` y se verificaron el 2026-09-19 con alta, login, `/me`, CON-05 y logout (`EVIDENCIA/WP-02/cuentas-demo.txt`).

| Alias | Correo (sintético) | Rol | Creada por | Estado | A3 |
|---|---|---|---|---|---|
| **DEMO-A01** | `asesorado.demo.a01@example.invalid` | Asesorado (`registrationIntent: ADVISEE`) | Website (rewrite `/api/*`, superficie WEB) | OPERATIVA | no otorgado |
| **DEMO-A02** | `asesorado.demo.a02@example.invalid` | Asesorado (`registrationIntent: ADVISEE`) | API directa, como el APK (superficie APK) | OPERATIVA | no otorgado |

- **Contraseñas:** no están en el repositorio ni en ningún log. Están en `.env.cuentas-demo`, en la raíz del clon local de Dirección, y git ignora ese archivo (`.env.*`).
- **Dominio:** `example.invalid` está reservado (RFC 2606): ningún correo llega a una persona real.
- **Acceso:** las dos cuentas entran tanto al website como al APK. La cuenta es la misma en las dos superficies.

**«Con diferentes roles»: pendiente.** WP-02 solo registra asesorados (DEUDA_LEGAJO DL-024). El perfil profesional, las especialidades y la verificación (RF-008…014, UC-P01) son de paquetes posteriores, y las cuentas demo de profesional y administrador se agregan cuando existan esos roles. El `registrationIntent` es la intención declarada en el alta, no un rol concedido (09v8 §3.1).

## Estado de DV-05 y DV-14

| Punto | Estado anterior | Estado ahora |
|---|---|---|
| **5 · Casos de prueba** | documentado, sin ejecutar (`NOT_EXECUTED`) | **primeros resultados reales**: 6 casos del catálogo en PASS (TEST-AUTH-013 solo en su parte b), 1 BLOCKED con DL, 3 parciales |
| **14 · Usuarios creados** | pendiente (requiere runtime) | **dos cuentas demo de asesorado**, verificadas en `test`; faltan los roles profesional y administrador |
