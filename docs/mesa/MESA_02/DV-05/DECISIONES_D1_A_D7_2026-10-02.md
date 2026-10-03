# DV-05 · Las decisiones D-1 a D-7, para Dirección

> **Fecha:** 2026-10-02, guardada en el repositorio el 2026-10-03 · **De:** el ejecutor técnico · **Fuente:** `MATRIZ_DE_RECONCILIACION_DV-05_2026-10.md` §3 y §6, en
> esta misma carpeta.
> **Qué es:** la tabla que pidió Dirección el 2026-10-02 para decidir los casos de DV-05 que dependen de ella. No cambia
> ningún oráculo ni ningún archivo del manifiesto. **Solo D-1 está decidida** (Dirección autorizó la opción A el
> 2026-10-02). Las demás son recomendaciones del ejecutor y esperan la respuesta de Dirección.

## La tabla

| # | Requisito afectado | Decisión necesaria | Recomendación | Consecuencia | Prueba faltante |
|---|---|---|---|---|---|
| **D-1** | TEST-AUTH-004 y la variante del titular de TEST-AUTH-003 (08:406; DL-089; DL-115) | Si el A3 del titular rige también en antropometría y formularios | **Decidida el 2026-10-02: opción A.** Implementada en el PR #133, sin integrar | Con #133 integrado, revocar el A3 corta la evolución propia y el detalle, responder y corregir un formulario propio. La lista propia sigue. Los dos casos se reclasifican en la próxima versión de la matriz | **Escrita:** `a3-del-titular.int-spec.ts`, la PE-01, verificada con una mutación. Falta la prueba en el teléfono con la candidata 0.13.2 |
| **D-2** | TEST-RF-006, RF-007, RF-010, RF-012 y TEST-AUTH-010: verificación de profesionales, administrador y break-glass (WP-09; DL-036) | Si se declaran fuera de la entrega en 11B, o se construye una administración mínima | **Declararlos fuera de la entrega**, como la opción A de la ficha de administración: la escuela pide «diferentes roles», no un administrador, y el 08 §25 exige MFA al administrador siempre | Quedan 5 casos P0 no ejecutables, cada uno con su motivo escrito. Ante la pregunta del tribunal, la respuesta está en el 08 §25 y en la decisión del 2026-09-22 | **Ninguna** si se declaran fuera. Opcional: la parte de RF-012 que se puede probar con el servicio interno (que suspender un alcance no toque el otro). Tamaño S |
| **D-3** | TEST-RF-054, la línea temporal (WP-10, M-11; DL-054) | Si se declara fuera de la entrega | **Declararla fuera.** Los eventos que la alimentarían ya se guardan | Queda 1 caso P0 no ejecutable. El ID de la línea temporal en el 09 es API-DSH-04, y hoy lo usa «Pendientes»: lo resuelve DL-116 | **Ninguna** si se declara fuera |
| **D-4** | TEST-DOM-007, las zonas musculares (DL-081) | Si se declara fuera de la entrega | **Declararlo fuera.** No hay zonas en la entrega y DEC-047 no está en el repositorio | Queda 1 caso P0 no ejecutable, con motivo | **Ninguna** si se declara fuera |
| **D-5** | TEST-FRM-001, y partes de TEST-RF-071 y TEST-FRM-002 (DL-095; hallazgo H-4) | 1. Qué oráculo rige para TEST-FRM-001 a 004: el de DV-05 o el de `docs/paquetes/WP-07-ORACULOS.md`, que difieren.<br>2. Si se prueba el rechazo por campo no autorizado con una matriz restringida que exista solo en la prueba | 1. **Rige DV-05**: es el entregable de la mesa, y la revisión de la v5 verificó que su rechazo de TEST-FRM-001 lo sostiene el 09 §22.3. WP-07-ORACULOS lleva una nota que remite a DV-05. Sus pruebas siguen valiendo como complemento, y donde falta el oráculo de DV-05 se agrega.<br>2. **Sí**: muestra el mecanismo, no una política clínica, que sigue esperando VJR-1, VJR-4 y VD-1 | TEST-FRM-001 pasa de no ejecutable a cubierto en su mecanismo. La política de pertinencia sigue abierta | El rechazo `FORM_REQUEST_NOT_ALLOWED` de TEST-FRM-001, con una matriz restringida que existe solo en la prueba. Tamaño S a M |
| **D-6** | TEST-FRM-004 y parte de TEST-RF-071: el perfil propio y `profileSourceRef` (DL-009; DL-095; hallazgo H-5) | Si el perfil propio tiene campos para el 10/10 (ficha de perfil) y si se prueba ya la conservación de `profileSourceRef` | **Para el 10/10, perfil sin campos** (opción A de la ficha de perfil) y **escribir ya la prueba de conservación**: cierra el hallazgo H-5 y no promete más | TEST-FRM-004 sigue en parte, con el motivo declarado. H-5 queda cerrado | La conservación de `profileSourceRef` en una respuesta. Tamaño S, cerca de una hora |
| **D-7** | Las variantes Google, Maps y Push de TEST-RF-059 (`docs/QUE-FALTA.md` §7) | Si se declaran no ejecutables en 11B | **Declararlas no ejecutables**: están fuera del alcance declarado | Lo que sí está en el alcance, la caída de Open Food Facts y de wger con su alternativa, se cubre con la PE-11 | La PE-11: los dos 503 con su alternativa y el núcleo funcionando. Tamaño M |

## Si Dirección acepta las recomendaciones

- **Fuera de la entrega, con su motivo en 11B:** D-2, D-3, D-4 y D-7. Son 7 casos P0 y 2 variantes, sin pruebas nuevas.
- **Pruebas a escribir:** el rechazo de TEST-FRM-001 con una matriz restringida (D-5) y la conservación de `profileSourceRef` (D-6). Las dos son chicas y no tocan el producto.
- **Ya hecho:** D-1, en el PR #133.
- **Documentos sin tocar el manifiesto:** una nota en `WP-07-ORACULOS.md` (D-5) y una versión nueva de la matriz con las filas que cambien.
