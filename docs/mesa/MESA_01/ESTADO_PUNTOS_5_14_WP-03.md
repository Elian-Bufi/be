# MESA-01 — estado de DV-05 y DV-14 tras WP-03

> Nota de actualización del ejecutor técnico. **No modifica** la matriz ni el informe del 2026-09-10, ni `docs/mesa/MESA_02/DV-05/DV-05_CASOS_DE_PRUEBA.csv`: esos archivos están en `docs/MANIFEST.sha256`, y editarlos rompería la verificación de hashes de la entrega de Dirección. Cuando Dirección quiera consolidar, reemplaza los archivos y reemite el manifiesto.

**Fecha:** 2026-09-19 · **Paquete:** WP-03 «Vínculo, consentimiento y PDP» · **Fuente de exigencia:** `Entregables.pdf` de la escuela, puntos 5 («Casos de prueba») y 14 («Usuarios creados para acceder a la APK y al Website con diferentes roles»).

## Punto 5 — Casos de prueba

### Casos del catálogo DV-05 que WP-03 ejecuta

Todos corren contra PostgreSQL 16 real en la CI de `main` (`08cdd08`, integración **212/212**). El detalle por ID está en `EVIDENCIA/WP-03/resultados-integracion-main-08cdd08.md`.

| Caso DV-05 | Oráculo verificado | Estado | Evidencia |
|---|---|---|---|
| **TEST-AUTH-003** (variante profesional) | Un profesional con vínculo y B2, pero sin el A3 del titular, no accede | **PASS** | `pdp.int-spec.ts` · adversarial 3 en vivo |
| **TEST-AUTH-004** | Revocar A3 corta el acceso del profesional en la request siguiente; B2 no se toca | **PASS** | `pdp.int-spec.ts` |
| **TEST-AUTH-005** | B2 vigente sin A3 no produce acceso | **PASS** | `pdp.int-spec.ts` · captura `web-13` |
| **TEST-AUTH-006** | Aceptar el vínculo no concede consentimiento | **PASS** | `pdp.int-spec.ts` · capturas `web-07` a `web-09` |
| **TEST-AUTH-007** | PAUSADO corta ese alcance y no los demás | **PASS** | `pdp.int-spec.ts` · capturas `web-22`, `web-23` |
| **TEST-AUTH-008** | FINALIZADO no deja lectura residual y no borra la evidencia del consentimiento | **PASS** | `pdp.int-spec.ts` · capturas `web-26`, `web-27` |
| **TEST-AUTH-009** | Lo que el cliente declara (campos, parámetros, capacidades) no reemplaza al PDP | **PASS** | `pdp.int-spec.ts` · adversarial 4 en vivo |
| **TEST-AUTH-013 (a)** | El cierre de cuenta finaliza los vínculos por eventos, invalida las solicitudes pendientes y conserva la evidencia. También con operaciones concurrentes de la contraparte | **PASS** (cierra DL-018) | `cierre.int-spec.ts` · `concurrencia-wp03.int-spec.ts` |
| **TEST-RF-015** | Verificado no es autorizado; suspendido o sin habilitación, se corta | **PASS** | `pdp.int-spec.ts` |
| **TEST-RF-018 a 025** | Solicitud única (índice), aceptación, consentimiento con evidencia, dimensiones de autorización, revocación sin cascada, modo de acceso, pausa y cambio de profesional | **PASS** | `vinculo.int-spec.ts` · `consentimiento.int-spec.ts` · `pdp.int-spec.ts` |
| **TEST-RNF-PRI-002** | El corte es inmediato y verificable: 0 operaciones permitidas después de revocar, medido en ms, también con lecturas concurrentes | **PASS** | `mediciones-ci-main-08cdd08.jsonl` · `medicion-del-corte-test.json` · captura `web-00` |

### Casos adversariales (DV-05, D-B de Dirección)

Los seis casos de WP-03 son ejecutables de dos maneras:
- en CI, como pruebas;
- en vivo contra el ambiente `test`, con `node scripts/adversariales-wp03.mjs`, que imprime PASA o FALLA por caso.

| # | Caso | Estado en CI | Estado en `test` (2026-09-19 13:18Z) |
|---|---|---|---|
| 1 | Asesorado ajeno e identificador inventado: 404 idéntico, sin diferencia de tiempo útil | PASS | PASA (medianas de 235 y 227 ms) |
| 2 | Revocar B2: la request siguiente del profesional ya es 404; el vínculo sigue | PASS | PASA (404 en la request siguiente) |
| 3 | (variante profesional) B2 sin A3 no presume consentimiento de salud | PASS | PASA |
| 4 | Campos y parámetros autoritativos del cliente no cambian la decisión | PASS | PASA |
| 5 | Llamar la API directo, sin pantallas, da el mismo 404 | PASS | PASA |
| 9 | Vínculo PAUSADO: 404 para el profesional; el asesorado ve el acceso bloqueado | PASS | PASA |
| 6, 7, 8, 10 | Dependen de dominios (anular mediciones, evolución con huecos, plan activado, borrador ajeno) | — | asignados a **WP-04** (DL-042) |

Salida de la corrida en `test`: `EVIDENCIA/WP-03/adversariales-test.json`.

## Punto 14 — Usuarios creados: ahora con dos roles

Existen en el ambiente `test`. Las contraseñas no están en el repositorio ni en ningún log: están en `.env.cuentas-demo`, en el clon local de Dirección, y git ignora ese archivo. El dominio `example.invalid` está reservado (RFC 2606).

| Alias | Correo (sintético) | Identificador BE | Rol | Alcance | Superficie |
|---|---|---|---|---|---|
| **DEMO-A01** | `asesorado.demo.a01@example.invalid` | (WP-02) | Asesorado | — | website y APK |
| **DEMO-A02** | `asesorado.demo.a02@example.invalid` | (WP-02) | Asesorado | — | website y APK |
| **DEMO-PN** | `demo.pn@example.invalid` | `9172fae6-13b8-4d34-8139-711b89d460c4` | **Profesional** (perfil sanitario) | Nutrición, verificado y habilitado | website (`/pro`) |
| **DEMO-PT** | `demo.pt@example.invalid` | `81e11918-19f7-4f56-ac5c-1420a3da77bb` | **Profesional** (perfil no sanitario) | Entrenamiento, verificado y habilitado | website (`/pro`) |

- **Cómo nacen los profesionales:** se registran por la API pública como cualquier persona. Después se declaran por su identidad en `BE_DEMO_PROFESIONALES` (`render.yaml`, PR #18). Al arrancar, la API les aplica el servicio interno de verificación (DL-036): perfil profesional, alcance VERIFICADO y habilitación CONCEDIDA. No hay endpoint administrativo.
- **Qué no es:** «profesional» no es un rol que se guarde en el cliente. La API informa la capacidad `PROFESSIONAL_WORKSPACE` para navegar, y el acceso a los datos de un asesorado lo decide el PDP en cada operación.
- **Verificación en `test`:** el 2026-09-19, DEMO-PN inició sesión, `/me` informó `PROFESSIONAL_WORKSPACE`, y recorrió el flujo completo como profesional en el website (`EVIDENCIA/WP-03/web/`) y en los casos adversariales. DEMO-PT también inicia sesión y `/me` le informa `PROFESSIONAL_WORKSPACE` (verificado el mismo día).
- **Pendiente:** el rol administrador llega con su paquete.

## Estado de DV-05 y DV-14

| Punto | Estado tras WP-02 | Estado ahora |
|---|---|---|
| **5 · Casos de prueba** | 6 casos en PASS, 1 BLOCKED (TEST-AUTH-013 a), 3 parciales | TEST-AUTH-003 a 009 y 013 (a) en PASS, TEST-RF-015 y 018 a 025 en PASS, TEST-RNF-PRI-002 en PASS, y 6 de los 10 adversariales ejecutables en vivo. Los otros 4 están asignados a WP-04 |
| **14 · Usuarios creados** | dos cuentas demo de asesorado | cuatro cuentas: **dos asesorados y dos profesionales** (sanitario y no sanitario), verificadas en `test`. Falta el administrador |
