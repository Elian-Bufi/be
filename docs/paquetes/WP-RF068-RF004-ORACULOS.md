# WP-RF068-RF004 — oráculos

> Escritos antes que el servicio. Los del dominio se verificaron con mutación (15 mutaciones de la lógica, todas
> muertas, el 2026-11-13). Paquete: `WP-RF068-RF004.md`; DEUDA_LEGAJO DL-172.

## RF-068 · Incidencias (`packages/domain/src/incidencias.test.ts` y `test/integration/incidencias-y-metodos-de-acceso.int-spec.ts`)

| ID | Qué exige | Dónde |
|---|---|---|
| TEST-INC-001 | Las cinco categorías de RF-068 y los tres estados, con su texto | dominio |
| TEST-INC-002 | La descripción es obligatoria sin contar los espacios, con un tope de 2000 caracteres (contados como caracteres) | dominio |
| TEST-INC-003 | Un cambio pide el motivo; resolver, la respuesta para quien la avisó; los topes de cada texto | dominio |
| TEST-INC-004 | Contra la versión vista; a otro estado; reabrir una resuelta se puede | dominio |
| TEST-INC-005 | Quien avisó ve la última respuesta, aunque se haya reabierto | dominio |
| TEST-INC-006 | El contrato: rutas, autenticación e idempotencia de API-INC-01 a 05, y su DL | dominio |
| TEST-INC-007 | Avisar y ver lo propio; otra persona no lo ve; la descripción no va a la auditoría; un profesional avisa sin su segundo factor | integración |
| TEST-INC-008 | Administración filtra, toma, resuelve y reabre; quien avisó ve el estado y la respuesta, nunca el motivo; 409 por versión, 422 por mismo estado o sin respuesta | integración |
| TEST-INC-009 | La base: no se borra, no cambia sin su cambio, solo un administrador con rol vigente, la historia no se edita | integración |

## RF-004 · Métodos de acceso (`packages/domain/src/metodos-de-acceso.test.ts` y la misma prueba de integración)

| ID | Qué exige | Dónde |
|---|---|---|
| TEST-MET-001 | Un método vale sin cambios o con una cantidad par; una contraseña suprimida o un Google retirado no sirven | dominio |
| TEST-MET-002 | Nunca sin un método: Google se retira solo si queda la contraseña; la contraseña no se retira; lo retirado es 404 | dominio |
| TEST-MET-003 | El mismo correo se vincula; otro, solo con la confirmación explícita; sin contraseña, no | dominio |
| TEST-MET-004 | Nunca una cuenta de Google en dos identidades ni dos en una; la desvinculada se reasocia, otra distinta todavía no | dominio |
| TEST-MET-005 | El contrato de API-MET-01 a 03 (STEP_UP y MFA), y entrar con una cuenta desvinculada lo dice | dominio |
| TEST-MET-006 | Vincular con la contraseña y, con otro correo, solo confirmado; después Google entra a la misma identidad; auditado | integración |
| TEST-MET-007 | Desvincular deja la contraseña; Google pide confirmarla para volver; la reasociación es una fila nueva; otra distinta, 409 | integración |
| TEST-MET-008 | Una cuenta creada con Google no se queda sin método, ni por la API ni por la base | integración |
| TEST-MET-009 | Desvincular pide una entrada reciente; el profesional, su segundo factor para vincular | integración |
| TEST-MET-010 | Una cuenta de Google de otra identidad no se vincula, ni desvinculada; entrar o crear con ella dice que se desvinculó | integración |
