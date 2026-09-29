# Entregable B · La plantilla tiene que corresponder al Alcance de la Solicitud

**Rama:** `fix/plantilla-alcance` (base `main` `065689b`). **Sin cambios de contrato ni de base.**

## Regla y de dónde sale

- **UC-P32, precondición 7:** «Existe una plantilla BE versionada compatible con esa finalidad» (`05:15074`). **E04:** «Plantilla incompatible o no seleccionable → no se envía como si fuera válida» (`05:15156`).
- **FRM-03** ya declara `422 FORM_TEMPLATE_NOT_SELECTABLE` (`09 v0.16.1:1552`).
- **Qué significa el dominio de una versión de plantilla:** `NULL` es transversal a los tres Alcances (D-D; `prisma/schema.prisma`, `VersionDePlantillaDeFormulario.dominio`). Con valor, es de ese Alcance: hoy, `FRM-ENTRENAMIENTO` (DL-100).
- **Regla aplicada:** si la versión tiene dominio y no coincide con el Alcance pedido, `422 FORM_TEMPLATE_NOT_SELECTABLE` y no se escribe nada. Las transversales (FRM-SALUD, FRM-HABITOS) siguen admitidas en los tres.

**Qué no se decidió.** La compatibilidad con la *finalidad* (propósito en texto libre) no tiene una regla mecánica en el canon. No se inventa: queda como pregunta para Dirección, con el pie de UC-P32. Tampoco se tocaron permisos ni categorías sensibles.

## Problema reproducido

En `main`, FRM-03 no comparaba el dominio de la plantilla con el Alcance: se podía crear una Solicitud de «Antecedentes para entrenamiento» con Alcance NUTRICION.
- La prueba `formularios-alcance.int-spec.ts` corrida **sin la corrección**: 1 fallada, 2 aprobadas. Falla el cruce, que respondió 201 en lugar de 422.
- **Con la corrección:** 3/3.

## Corrección

- **API** (`apps/api/src/formularios/solicitudes.service.ts`): el control va después del PDP y de la existencia y vigencia de la versión, junto con los demás del contrato. Un actor sin autorización recibe el mismo 404 neutral: el cruce no revela nada.
- **Puntos de entrada:** FRM-03 es la única operación que crea Solicitudes. No hay siembra ni otra ruta que las cree.
- **Website** (`forms/pedir.tsx`):
  - con una plantilla con dominio, el Alcance queda fijo en ese y se explica por qué;
  - con una transversal, se ofrecen los tres;
  - los rechazos de FRM-03 que dependen de lo elegido (`FORM_TEMPLATE_NOT_SELECTABLE`, `FORM_REQUEST_NOT_ALLOWED`, `FORM_REQUEST_INVALID`) dicen su motivo, en vez de «el servicio no está disponible».
- **APK:** no crea Solicitudes; no cambia. Las respuestas de FRM que lee la 0.12.0 no cambian de forma.
- **Solicitudes ya creadas con un cruce:** no se tocan. La regla aplica a las nuevas.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| Integración `formularios-alcance.int-spec.ts`: válidos (plantilla de entrenamiento en su Alcance; transversal en NUTRICION y ENTRENAMIENTO); cruce con 422 sin escrituras (Solicitudes y eventos); después, **con la misma Idempotency-Key explícita**, el pedido en el Alcance correcto se procesa (el rechazo no quedó guardado), su repetición devuelve lo mismo y queda **exactamente una** Solicitud y un evento; privacidad (sin autorización, el cruce da el mismo 404 que una plantilla válida y que un asesorado inexistente) | 3/3 (antes de la corrección, 2/3) |
| Regresión de formularios, contrato y PF-02 (`contrato`, `contexto-entrenamiento`, `formularios-errores`) | 40/40 |
| `npm test`, typecheck, `openapi:verificar`, legajo | verdes |
| Recorrido web local (API compilada, PostgreSQL 16 con base nueva, `next dev`, Chrome sin interfaz, datos sintéticos): Alcance fijo con la plantilla de entrenamiento, tres Alcances con la transversal, pedido enviado y guardado en ENTRENAMIENTO (comprobado en la base) | 5/5, sin errores de consola. Capturas en `B-plantilla-y-alcance/` |

## Límites

- El mensaje del website ante un 422 de FRM-03 no se vio en el navegador: la pantalla ya no deja armar el cruce. Se verificó por typecheck y revisión.
- **Decisión pendiente de Dirección:** si una plantilla transversal tiene que declarar, además, finalidades compatibles (UC-P32, precondición 7, «compatible con esa finalidad»). Hoy el propósito es texto libre.

**Corrección de la auditoría (2026-09-29).** La prueba decía reusar la clave, pero el helper generaba una nueva en cada pedido. Ahora el helper `pedir` recibe la clave explícita, y el caso usa la misma en el rechazo, en el pedido válido y en su repetición.
