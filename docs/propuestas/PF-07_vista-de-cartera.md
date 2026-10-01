# PF-07 — Ficha: vista de cartera (a quién mirar hoy)

> **Estado:** PROPUESTA (2026-09-30). Pendiente de decisión de Dirección: D-1 a D-6 (§h). Nada de esto está implementado.
> **Base:** `main` en `53cc70e`, contrastado con el Plan Funcional Profesional v1.1 (§ PF-07 «Visión de seguimiento», DEC-09) y con la crítica de negocio del mismo día (`CRITICA-DE-NEGOCIO_2026-09-30.md`, mejora B).
> **Identificadores:** CAR-CU, CAR-CA y CAR-V son locales a esta ficha. Anclajes del legajo que se reutilizan: **REG-06-145/150** (próxima revisión y expectativa del Proceso, DL-055), **B10-08 §8.4** (no listar lo oculto), **10-B04:1171-1176** (vista parcial), el PDP y el dashboard por asesorado de WP-08 (`DashboardResponseSchema`). Lo que Dirección decida se registra como DL.

```yaml
package: PF-07 (propuesta; nombre canónico a confirmar por Dirección)
title: Vista de cartera del profesional
status: proposed
baseline_commit: 53cc70e
business_outcome: El profesional sabe cada mañana a quién tiene que mirar y por qué, sin abrir asesorado por asesorado y sin que BE califique a nadie
in_scope:
  - Una lista de asesorados con sus pendientes objetivos por dominio: revisión vencida o próxima, plan en borrador sin activar, sin plan activo, solicitud de formulario sin respuesta, última actividad registrada (fecha, no juicio)
  - Orden y filtros por dominio y por tipo de pendiente; período para «actividad registrada» (DEC-09 acotado a esta vista)
  - Enlace directo a la pestaña del asesorado que resuelve cada pendiente
out_of_scope:
  - Puntajes, porcentajes de cumplimiento, adherencia, rachas, semáforos por comportamiento de la persona
  - Recordatorios automáticos al asesorado, notificaciones push, correo
  - Vista para el asesorado (su Hoy y su historial ya existen en la APK)
  - Cambios en la APK
decisions: [D-1 a D-6]
acceptance: [CAR-CA-01 a CAR-CA-08]
verification: [CAR-V-01 a CAR-V-05]
evidence:
  - Pruebas de integración de la lectura (permisos por dominio, vista parcial, orden) y de rendimiento con cartera de 50 asesorados
  - Recorrido web con capturas
```

## a. Resultado para el usuario y problema que resuelve

### Resultado
En el espacio profesional, antes de «Tus asesorados», el profesional ve **Pendientes**: una lista con una fila por asesorado y dominio donde hay algo objetivo que hacer —«revisión vencida hace 3 días», «plan en borrador desde el 22/9», «sin plan activo», «formulario sin responder desde el 15/9»— y una columna de «última actividad registrada» con la fecha (no con un veredicto). Cada fila lleva a la pestaña que lo resuelve.

### Problema, verificado en `main`
- El espacio profesional (`apps/web/src/app/pro/espacio-profesional.tsx`) lista los vínculos («Tus asesorados», con la fecha de aceptación) y las solicitudes. Nada dice qué hay que hacer con cada uno.
- El dashboard existe **por asesorado** (`GET advisees/:adviseeId/dashboard`, WP-08): por dominio, plan vigente, objetivo, última revisión, conteo de registros del período y última actividad. Para veinte asesorados son veinte pantallas.
- La expectativa de revisión ya vive en el servidor: `proxima_revision` por Proceso operativo (fecha objetivo o «sin fecha», fuente versión de plan o revisión, cadena con predecesora). Nadie la agrega hoy.
- Los estados que hacen falta ya existen: versiones de plan `DRAFT`/`ACTIVATED`, Proceso `ABIERTO`/`CERRADO` por alcance, solicitudes de formulario con estado, ejecuciones e ingestas con fecha, evaluaciones antropométricas registradas.

### Qué pide esta ficha y dónde queda
Una **lectura agregada** (un endpoint) que recorre los vínculos vigentes del profesional y, para cada dominio disponible según el PDP, devuelve los pendientes calculados con reglas simples y fechadas. Sin tablas nuevas de negocio; a lo sumo, una vista materializada o índices si el volumen lo pide (§h técnicas). El website la muestra como lista ordenada y filtrable.

## b. Recorrido del profesional

1. Entra al espacio profesional. Arriba, **Pendientes** (N), con filtros por dominio (nutrición, entrenamiento, antropometría) y por tipo. Debajo, «Tus asesorados» como hoy.
2. Cada fila: asesorado · dominio · pendiente (uno de los tipos de §d) · desde cuándo · última actividad registrada · «Abrir». «Abrir» va a la pestaña del dominio de ese asesorado, a la sección pertinente (plan, revisiones, formularios).
3. Cambia el período de «última actividad» (predeterminado: 30 días; el mismo `FiltroDePeriodo` de las otras vistas). No cambia los pendientes de revisión ni de plan, que no dependen del período.
4. Si un dominio de un asesorado no está disponible para este profesional, **no aparece** (B10-08 §8.4). Si algún dominio de algún asesorado quedó fuera por eso, un aviso único: «Hay datos que no podés ver» (misma regla que `partialView` del dashboard).
5. Con cero pendientes: «Nada pendiente con lo que BE puede saber. Lo que no está registrado, no está acá.»

## c. Casos de uso

### CAR-CU-01 — Ver los pendientes de toda la cartera (profesional, website)
- Precondición: profesional con al menos un vínculo vigente.
- Flujo: `GET me/portfolio?period…&domain…&kind…`. BE resuelve, por vínculo y dominio disponible, los pendientes de §d y la última actividad del período.
- Postcondición: lista ordenada por urgencia objetiva (§d), paginada (50 por página).

### CAR-CU-02 — Ir del pendiente a la acción
«Abrir» lleva a `/pro/advisees/<dominio>?id=…&vista=…` con la vista que corresponde al tipo (plan → `plan`; revisión → `revisiones`; formulario → `forms`). Sin precargar ni decidir nada por el profesional.

### CAR-CU-03 — Vínculo pausado o dominio no disponible
El asesorado no aparece en Pendientes para ese dominio; sigue en «Tus asesorados» con su estado de vínculo. Ningún texto explica el motivo (misma neutralidad que el dashboard).

### CAR-CU-04 — Revisión «sin fecha» (REG-06-150)
Una expectativa sin fecha objetivo aparece como «revisión pendiente desde el <registro>», nunca como vencida: no hay fecha que vencer.

### CAR-CU-05 — Período de actividad
El período afecta solo la columna «última actividad registrada» y su conteo. Cambiarlo no reordena pendientes de revisión ni de plan.

## d. Diccionario: tipos de pendiente y orden

| Tipo | Regla (todo con datos existentes) | Dominios | Urgencia |
|---|---|---|---|
| `REVIEW_OVERDUE` | Expectativa vigente con `fechaObjetivo < hoy` (fecha civil del profesional) y sin revisión posterior | nutrición, entrenamiento | 1 (días de atraso, mayor primero) |
| `REVIEW_DUE_SOON` | `fechaObjetivo` dentro de los próximos 7 días (D-2) | nutrición, entrenamiento | 2 |
| `REVIEW_UNDATED` | Expectativa sin fecha (REG-06-150) | nutrición, entrenamiento | 3 (más antigua primero) |
| `PLAN_DRAFT_PENDING` | Existe una versión `DRAFT` posterior a la última activada, o sin ninguna activada | nutrición, entrenamiento | 4 (más antigua primero) |
| `NO_ACTIVE_PLAN` | Proceso abierto sin versión `ACTIVATED` | nutrición, entrenamiento | 5 |
| `FORM_REQUEST_OPEN` | Solicitud de formulario de este profesional sin respuesta ni cierre | los tres | 6 (más antigua primero) |
| `ANTHRO_DRAFT_PENDING` | Evaluación antropométrica en preparación de este profesional | antropometría | 7 |

**Columna «última actividad registrada»:** fecha del último registro del asesorado en el dominio dentro del período (ejecución, ingesta, evaluación registrada), o «sin registros en el período». Es un dato, no un pendiente: **no** genera fila por sí sola (D-3) y nunca se traduce a «inactivo», «abandonó» ni colores por comportamiento.

Lo que **no** es un pendiente: cantidad de registros vs. planificados, sesiones «incompletas», días sin ingesta. Eso es lectura del profesional en la revisión, con contexto (REG y TEST-PRJ-009).

## e. Textos de pantalla (incremento 1)

- Título: «Pendientes». Subtítulo: «Lo que BE puede saber con lo registrado. No es una evaluación de nadie.»
- Tipos: «Revisión vencida hace N días», «Revisión en N días», «Revisión pendiente desde el <fecha>», «Plan en borrador desde el <fecha>», «Sin plan activo», «Formulario sin responder desde el <fecha>», «Evaluación en preparación desde el <fecha>».
- Actividad: «Último registro: <fecha>» · «Sin registros en el período».
- Vacío: «Nada pendiente con lo que BE puede saber. Lo que no está registrado, no está acá.»
- Nunca: «inactivo», «riesgo», «adherencia», «cumplimiento», «alerta», colores rojo/verde por persona.

## f. Cambios en API, persistencia y pantallas

### f.1 API
`GET me/portfolio` (nuevo, OpenAPI con cambio): query `periodStart?`, `periodEnd?`, `domain?`, `kind?`, `cursor?`. Respuesta:
```
{ data: { period, partialView, generatedAt,
  items: [{ advisee: ResumenDeActor, relationshipId, domain, kind, since: FechaLocal | null, daysOverdue: int | null,
            lastActivityAt: Instante | null, activityCount: int, open: { view, section } }] },
  page }
```
Regla de acceso: para cada vínculo vigente, el mismo control por dominio que usa el dashboard (`NOT_AVAILABLE_TO_VIEW` → se omite y `partialView = true`). Sin nuevos permisos: es una agregación de lecturas ya autorizadas; se registra igual una acción de PDP `PORTFOLIO_READ` para auditoría.

### f.2 Persistencia
Sin tablas nuevas. Índices a evaluar: `proxima_revision (proceso_id, fecha_objetivo)`, versiones de plan por (proceso, estado, fecha). Si la cartera supera ~200 asesorados, vista materializada refrescada por evento (fuera del incremento 1).

### f.3 Website
- `pro/espacio-profesional.tsx`: sección «Pendientes» arriba de «Tus asesorados», con filtros y `FiltroDePeriodo`; tabla con `data-etiqueta` para móvil; «Abrir» como enlace.
- Copy en `@be/domain` (`copy-cartera.ts`) bajo la prueba de términos prohibidos.

### f.4 APK
Sin cambios.

## g. Criterios de aceptación y verificación

| Id | Criterio |
|---|---|
| CAR-CA-01 | Cada fila corresponde a un pendiente de §d, con la fecha que lo origina; ningún pendiente se infiere de conteos de registros |
| CAR-CA-02 | Un dominio no disponible para el profesional no aparece ni se explica; `partialView` es un aviso único |
| CAR-CA-03 | El orden sigue la urgencia de §d; empates por antigüedad |
| CAR-CA-04 | Revisión sin fecha nunca figura como vencida |
| CAR-CA-05 | Cambiar el período afecta solo la actividad, no los pendientes de revisión ni de plan |
| CAR-CA-06 | «Abrir» lleva a la vista pertinente del asesorado sin precargar decisiones |
| CAR-CA-07 | Copy sin términos prohibidos (TEST-PRJ-009) |
| CAR-CA-08 | 50 asesorados con tres dominios responden en menos de 1 s en local (medición registrada) |

Verificación: CAR-V-01 integración de permisos y vista parcial; CAR-V-02 reglas de pendiente con datos sintéticos por tipo; CAR-V-03 orden y paginación; CAR-V-04 rendimiento con cartera sintética de 50; CAR-V-05 recorrido web con capturas, escritorio y 390 px.

## h. Decisiones pendientes (Dirección)

| Id | Decisión | Opciones | Recomendación |
|---|---|---|---|
| **D-1** | Alcance del incremento 1 | (a) revisión + plan (nutrición y entrenamiento); (b) más formularios y antropometría | **(b)**: los tipos extra son lecturas baratas y evitan otra ronda |
| **D-2** | Ventana de «revisión en N días» | 7 días fijos / configurable por profesional | **7 días fijos** en el incremento 1 |
| **D-3** | «Sin registros en el período» como pendiente | (a) no, solo columna; (b) sí, como tipo de menor urgencia | **(a)**: convertirlo en pendiente es el primer paso hacia «inactivo», que el legajo prohíbe |
| **D-4** | Orden por urgencia fijo o elegible | fijo / columnas ordenables | fijo + filtro por tipo; ordenar por columna en un incremento 2 |
| **D-5** | Cartera y DEC-09 | resolver el selector de período del historial en esta ficha o aparte | **aparte**: DEC-09 es de la APK; acá el período solo acota la actividad |
| **D-6** | Nombre canónico y lugar en la ruta (PF-07 tal cual, o parte de otro paquete) | — | PF-07 como en el plan |

### Técnicas (dentro del paquete aprobado)
- Una sola consulta por dominio con `IN` de vínculos, no N+1; medir con la cartera sintética de CAR-V-04.
- Reutilizar la resolución por dominio del dashboard (mismo servicio) para no duplicar la regla de acceso.
- «Hoy» en la fecha civil del profesional; si no hay zona en el perfil, la del asesorado del Proceso, y se registra cuál se usó.

## i. Primer incremento recomendado y división en PR

1. **PR-1 (dominio + API):** contrato, lectura agregada con reglas de §d, permisos, pruebas de integración CAR-V-01..04.
2. **PR-2 (website):** sección «Pendientes», filtros, período, recorrido con capturas.
3. **APK:** ninguna.

Orden respecto de las plantillas (TPL): independientes; si hay que elegir una sola tanda, **cartera primero** (rinde para los tres dominios y no tiene decisiones de contenido) y plantillas después.

## Fuentes
`packages/domain/src/contratos-vinculo.ts` (dashboard por asesorado), `prisma/schema.prisma` (`ProcesoOperativo`, `ProximaRevision`, versiones de plan), `apps/web/src/app/pro/espacio-profesional.tsx`, `docs/propuestas/BE_Plan_Funcional_Profesional_v1-1.md` (PF-07, DEC-09, V-16).
