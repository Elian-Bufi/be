# TPL — Ficha: plantillas del profesional para planes de entrenamiento y de comidas

> **Estado:** PROPUESTA (2026-09-30). Pendiente de decisión de Dirección: D-1 a D-7 (§h). Nada de esto está implementado.
> **Base:** `main` en `53cc70e`, contrastado con la crítica de negocio del mismo día (`CRITICA-DE-NEGOCIO_2026-09-30.md`, mejora A).
> **Identificadores:** TPL, TPL-CU, TPL-CA y TPL-V son locales a esta ficha. Anclajes del legajo que se reutilizan: **DL-047** (nueva versión a partir de la efectiva), **REG-06-145** (próxima revisión), **REG-06-111** (parámetros con unidad), **RF-060** (procedencia del catálogo), **INV-06-109** (la versión activada no se edita) y los permisos del PDP. Las decisiones que Dirección tome se registran como DL en `docs/DEUDA_LEGAJO.md`.

```yaml
package: TPL (propuesta; nombre canónico a definir por Dirección)
title: Plantillas del profesional para planes de entrenamiento y de comidas
status: proposed
baseline_commit: 53cc70e
business_outcome: El profesional reutiliza estructuras que ya validó, sin copiar a mano y sin perder que cada plan es de una persona
in_scope:
  - Guardar una versión de plan (entrenamiento o nutrición) como plantilla propia, con nombre y descripción
  - Empezar un plan nuevo para un asesorado desde una plantilla propia (nace borrador; validar y activar como hoy)
  - «Mis plantillas»: listar, ver, renombrar, versionar y archivar; solo del profesional que las creó
  - Origen trazable en la versión del plan (qué plantilla y qué versión)
out_of_scope:
  - Compartir plantillas entre profesionales, plantillas de BE, mercado o sugerencias
  - Generación automática (IA) de planes o plantillas
  - Cambios en la APK (el asesorado no ve plantillas)
  - Plantillas de formularios, de evaluaciones o de protocolos antropométricos
  - Métricas de uso, cumplimiento o calificación
decisions: [D-1 a D-7]
acceptance: [TPL-CA-01 a TPL-CA-09]
verification: [TPL-V-01 a TPL-V-06]
evidence:
  - Pruebas de integración del ciclo guardar → aplicar → validar → activar, y de los permisos
  - Recorrido web del profesional con capturas; la APK sin cambios, comprobada con un plan aplicado desde plantilla
```

## a. Resultado para el usuario y problema que resuelve

### Resultado
El profesional de entrenamiento o de nutrición guarda como **plantilla** una estructura que le funciona («Fuerza 3 días — nivel inicial», «Semana tipo con 4 comidas, modo intercambios»), y cuando incorpora a una persona **empieza desde esa plantilla**: el plan nace como borrador con la estructura ya puesta, lo adapta (ejercicios alternativos, series, cargas, cantidades), lo valida y lo activa exactamente como hoy. Cada versión de plan dice de qué plantilla vino.

### Problema, verificado en `main`
- `CrearPlanDeEntrenamientoRequest` y `CrearPlanRequest` (nutrición) solo admiten `initialStructure` o `basedOnPlanId`, y `basedOnPlanId` es una versión del **mismo asesorado** (DL-047). No existe reutilización entre asesorados; el profesional copia a mano.
- Los editores (`training/editor.tsx`, `nutrition/editor.tsx`) arrancan vacíos o «a partir de la versión activa» de esa persona.
- No hay ninguna entidad de plantilla de plan en Prisma (`PlanDeEntrenamiento`/`VersionDePlanDeEntrenamiento`/`InstantaneaDePlanDeEntrenamiento` y sus homólogas nutricionales son por asesorado). Lo único reutilizable hoy es el catálogo (ejercicios y alimentos) y las plantillas de formularios sembradas.

### Qué pide esta ficha y dónde queda
Una entidad nueva, **propia del profesional y sin asesorado**, que guarda una **estructura de plan** con el mismo esquema de entrada que ya valida la API (`EstructuraDePlanDeEntrenamientoEntrada`, `EstructuraDePlanEntrada`), versionada e inmutable como los planes. Aplicarla es un caso particular de crear un plan: `initialStructure` sale de la plantilla y la versión registra el origen.

## b. Recorrido del profesional

1. En **Plan** de un asesorado, sobre una versión (borrador o activada): «Guardar como plantilla». Se piden nombre y descripción; se muestran las notas de texto libre que se van a copiar (instrucciones, propósitos, notas de prescripción/comida) para confirmarlas o vaciarlas (D-3). Se guarda la versión 1 de la plantilla.
2. En el espacio profesional, **Mis plantillas** (por área): lista con nombre, área, fecha, cantidad de sesiones o días tipo, y estado (activa/archivada). Ver una plantilla muestra su estructura en solo lectura, con el mismo componente que muestra un plan.
3. En un asesorado sin plan activo, o al crear una versión nueva: «Empezar desde una plantilla» → elegir una de las propias → el borrador nace con la estructura de la plantilla y el objetivo que se elija (el objetivo **no** viene de la plantilla: es de la persona, D-2). Cargas sugeridas y cantidades: vacías por defecto, con la opción de traerlas como referencia (D-2).
4. El profesional adapta, valida y activa. La versión muestra «Creada desde la plantilla X, versión N».
5. Cambiar una plantilla crea una versión nueva de la plantilla (inmutable la anterior); los planes ya aplicados no cambian. Archivar la saca de la lista para aplicar; no borra nada.

El asesorado no ve nada distinto: recibe un plan como cualquier otro.

## c. Casos de uso

### TPL-CU-01 — Guardar una versión de plan como plantilla (profesional, website)
- Precondición: el profesional tiene el vínculo con alcance del área y puede leer esa versión.
- Flujo: elige «Guardar como plantilla», nombra, revisa las notas (D-3), confirma. BE copia la **estructura** (bloques/microciclos/sesiones/prescripciones o días tipo/comidas/opciones/ítems) y **no** copia: identidad del asesorado, objetivo, `nextReviewAt`, cargas sugeridas y cantidades (salvo lo que D-2 decida), ni referencias a evaluaciones o citas.
- Postcondición: plantilla v1 del profesional, con `origin = { planId, versionId }` para trazabilidad interna (no visible para terceros).
- Alternativa: la versión referencia un ejercicio o alimento **no disponible** → se guarda igual y la plantilla lo marca; al aplicar, se señala (TPL-CU-04).

### TPL-CU-02 — Empezar un plan desde una plantilla (profesional, website)
- Precondición: vínculo con alcance; permiso de crear plan para ese asesorado (el de hoy); plantilla propia y activa.
- Flujo: `POST advisees/:id/{training|nutrition}/plans` con `fromTemplateVersionId` (excluyente con `basedOnPlanId`) y `objectiveVersionId`. BE valida la estructura con el esquema de siempre y crea el **borrador**.
- Postcondición: versión DRAFT con `templateOrigin = { templateId, templateVersionId }`. Validar y activar no cambian.

### TPL-CU-03 — Gestionar mis plantillas (profesional, website)
Listar (paginado), ver, renombrar/describir (no cambia la estructura ni crea versión), **nueva versión** (edita la estructura con el mismo editor y guarda como versión N+1), archivar/desarchivar.

### TPL-CU-04 — Aplicar con elementos del catálogo que ya no están disponibles
Al aplicar, cada prescripción o ítem cuya versión de catálogo no está `available` se conserva en el borrador **señalada**; la validación del plan la informa como hoy informa lo incompleto (a confirmar en `validate`, §h técnicas). No se sustituye nada en silencio.

### TPL-CU-05 — Baja del profesional o del alcance
Las plantillas son del profesional. Si pierde el alcance o deja BE, no se aplican más; los planes aplicados conservan su instantánea y siguen siendo del asesorado. Nada se borra.

## d. Diccionario de campos (plantilla)

| Campo | Tipo | Regla |
|---|---|---|
| `templateId`, `versionId` | id opaco | Como los planes: entidad + versiones inmutables |
| `area` | `TRAINING` \| `NUTRITION` | Fija al crear |
| `ownerIdentityId` | id | El profesional que la creó; nunca otro |
| `name` | texto ≤ 120 | Obligatorio; único por profesional y área (mayúsculas indistintas) |
| `description` | texto ≤ 1000 | Opcional |
| `structure` | `EstructuraDePlanDeEntrenamientoEntrada` \| `EstructuraDePlanEntrada` | Validada con el esquema existente al guardar; instantánea JSON como en los planes |
| `copiedLoads` / `copiedQuantities` | booleano | Si la plantilla guarda cargas sugeridas / cantidades como referencia (D-2) |
| `origin` | `{ planId, versionId }` \| `null` | De qué versión de plan salió; visible solo para el propietario, sin datos del asesorado |
| `status` | `ACTIVE` \| `ARCHIVED` | Archivada no se aplica; se puede reactivar |
| `createdAt`, `version` | fecha, entero | Como los planes |

En la **versión de plan**: `templateOrigin: { templateId, templateVersionId } | null`, además de `predecessorPlanId` (los dos pueden convivir: nueva versión de un plan que nació de una plantilla).

## e. Textos de pantalla (incremento 1)

- «Guardar como plantilla», «Empezar desde una plantilla», «Mis plantillas», «Nueva versión de la plantilla», «Archivar».
- Aviso al guardar: «La plantilla copia la estructura, no a la persona: no lleva objetivo, cargas ni cantidades. Revisá las notas antes de guardarla: no deberían nombrar a nadie.»
- En la versión del plan: «Creada desde la plantilla «Fuerza 3 días», versión 2. El plan es de esta persona: la plantilla no cambia si lo editás.»
- Nunca: «recomendado», «óptimo», «puntaje», «cumplimiento».

## f. Cambios en API, persistencia y pantallas

### f.1 API (contratos nuevos en `@be/domain`, OpenAPI con cambio)
| Ruta | Qué hace |
|---|---|
| `POST training/plan-templates` · `POST nutrition/plan-templates` | Crear desde `{ name, description?, structure, copiedLoads?/copiedQuantities? }` o desde `{ fromPlanVersionId, name, … }` (TPL-CU-01) |
| `GET …/plan-templates` (paginado, filtro por estado) · `GET …/plan-templates/:templateId` | Solo las propias |
| `POST …/plan-templates/:templateId/versions` | Nueva versión con `expectedVersion` (misma regla de concurrencia que los planes) |
| `PATCH …/plan-templates/:templateId` | Nombre, descripción, estado |
| `POST advisees/:adviseeId/{training\|nutrition}/plans` | Gana `fromTemplateVersionId?` (excluyente con `basedOnPlanId` y con `initialStructure`) |
| Respuestas de versión de plan | Ganan `templateOrigin` (nullable) |

Errores: `TEMPLATE_NOT_FOUND` (404 neutral: inexistente o ajena, sin distinguir), `TEMPLATE_ARCHIVED` (422), `TEMPLATE_NAME_TAKEN` (409), `PLAN_SOURCE_CONFLICT` (422 si llegan dos orígenes).

### f.2 Persistencia (Prisma, migración nueva)
`plantilla_de_plan` (id, área, propietario, nombre, estado, fechas) y `version_de_plantilla_de_plan` (id, plantilla, número, estructura JSON, cargas/cantidades copiadas, origen, fecha). Índice único (propietario, área, nombre normalizado). Columna `origen_de_plantilla` (JSON nullable) en `version_de_plan_de_entrenamiento` y `version_de_plan_nutricional`. Sin cambios en tablas del asesorado.

### f.3 Autorización (PDP)
Acciones nuevas: `PLAN_TEMPLATE_MANAGE` (crear, versionar, editar, archivar; requiere identidad profesional con el alcance del área en al menos un vínculo vigente, **sin** asesorado) y `PLAN_TEMPLATE_READ` (propias). Aplicar una plantilla usa el permiso existente de crear plan para ese asesorado. Nadie que no sea el propietario lee una plantilla.

### f.4 Website
- `pro/advisees/training/plan.tsx` y `nutrition/plan.tsx`: botón «Guardar como plantilla» en la versión; diálogo con nombre, descripción y revisión de notas.
- Creación de plan (`editor.tsx` de cada área): «Empezar desde una plantilla» junto a «en blanco» y «a partir de la versión activa».
- Nueva ruta `pro/templates` («Mis plantillas»), con lista, detalle en solo lectura reutilizando la vista de estructura del plan, nueva versión con el editor existente.
- Copy con la misma prueba de términos prohibidos (TEST-PRJ-009).

### f.5 APK
Sin cambios. Comprobación: un plan aplicado desde plantilla se ve y se registra igual que uno creado a mano (Hoy, ocurrencias, ejecuciones).

## g. Criterios de aceptación y verificación

| Id | Criterio |
|---|---|
| TPL-CA-01 | Guardar como plantilla copia solo la estructura; ninguna referencia al asesorado, objetivo, revisión ni citas queda en la plantilla |
| TPL-CA-02 | Las notas de texto libre se muestran antes de guardar y se pueden vaciar una por una |
| TPL-CA-03 | Cargas sugeridas y cantidades no se copian por defecto; si se copian, la versión de plan las muestra como «referencia de la plantilla» hasta que el profesional las confirme (según D-2) |
| TPL-CA-04 | Aplicar crea un borrador con `templateOrigin`; validar y activar se comportan como hoy |
| TPL-CA-05 | Una plantilla ajena responde 404 neutral en toda ruta; una archivada no se aplica |
| TPL-CA-06 | Nueva versión de plantilla no altera planes ya aplicados; una versión de plantilla es inmutable |
| TPL-CA-07 | Elementos de catálogo no disponibles se señalan al aplicar y no se sustituyen |
| TPL-CA-08 | Nombre único por profesional y área; concurrencia con `expectedVersion` |
| TPL-CA-09 | La APK muestra y registra un plan aplicado desde plantilla sin diferencia |

Verificación: TPL-V-01 integración del ciclo completo (entrenamiento); TPL-V-02 ídem nutrición; TPL-V-03 permisos (propietario, otro profesional, sin alcance); TPL-V-04 catálogo no disponible; TPL-V-05 recorrido web con capturas; TPL-V-06 APK con un plan aplicado (sin build nuevo: la APK vigente sirve).

## h. Decisiones pendientes (Dirección)

| Id | Decisión | Opciones | Recomendación |
|---|---|---|---|
| **D-1** | Alcance de la plantilla | (a) solo del profesional que la creó; (b) compartible dentro de un equipo | **(a)** en el incremento 1: sin decisiones de propiedad ni de revisión de contenido entre pares |
| **D-2** | Qué se copia además de la estructura | (a) nada cuantitativo de la persona (sin cargas ni cantidades); (b) cargas y cantidades como «referencia» marcadas, a confirmar; (c) todo | **(b)** con el interruptor apagado por defecto: en nutrición la cantidad es parte de la receta del profesional; en entrenamiento la carga es de la persona |
| **D-3** | Texto libre | (a) copiar y avisar; (b) mostrar cada nota y exigir confirmarla o vaciarla; (c) no copiar notas | **(b)**: conserva el trabajo y obliga a mirar |
| **D-4** | Propiedad ante baja del profesional | (a) quedan del profesional, inactivas; (b) se borran; (c) pasan a BE | **(a)**; borrar no hace falta y «pasar a BE» abre una decisión de contenido |
| **D-5** | Objetivo | (a) siempre de la persona (la plantilla no lo trae); (b) la plantilla sugiere un tipo de objetivo | **(a)**: el objetivo es la decisión clínica-profesional por persona (PF-04 D-5 y DL-105 van en ese sentido) |
| **D-6** | Catálogo importado con licencia dentro de una plantilla | (a) se referencia como en un plan; (b) se excluye | **(a)**: la referencia a una versión con procedencia ya es trazable (RF-060) |
| **D-7** | Nombre canónico del paquete y su lugar en la ruta (¿PF-09? ¿dentro de PF-03/PF-05?) | — | Que Dirección lo fije al emitir la orden |

### Técnicas (las resuelve quien implemente, dentro del paquete aprobado)
- Confirmar qué controla hoy `validate` sobre versiones de catálogo no disponibles y reutilizarlo para TPL-CU-04.
- Reutilizar el componente de vista de estructura del plan para el detalle de la plantilla, sin duplicarlo.
- Límites: mismos máximos que la estructura de plan; ≤ 200 plantillas activas por profesional y área (evita listas inmanejables; se puede subir).

## i. Primer incremento recomendado y división en PR

1. **PR-1 (dominio + API + Prisma, entrenamiento):** contratos, migración, PDP, rutas, `fromTemplateVersionId` en crear plan, pruebas de integración TPL-V-01/03/04. Sin website.
2. **PR-2 (website, entrenamiento):** guardar, mis plantillas, empezar desde plantilla, recorrido con capturas.
3. **PR-3 (nutrición, dominio + API + website):** el mismo patrón, con D-2 aplicado a cantidades.
4. **APK:** ninguna; comprobación TPL-V-06 con la APK vigente.

Estimación honesta: PR-1 y PR-2 en una tanda; PR-3 en la siguiente. Riesgo principal: D-2 y D-3, que cambian el diálogo de guardado; conviene decidirlas antes de PR-2.

## Fuentes
`packages/domain/src/contratos-entrenamiento.ts` (esquemas de estructura y `CrearPlanDeEntrenamientoRequest`), `contratos-nutricion.ts` (`EstructuraDePlanEntrada`, `CrearPlanRequest`, catálogo), `prisma/schema.prisma` (modelos de plan y versiones), `apps/web/src/app/pro/advisees/{training,nutrition}/{plan,editor}.tsx`, fichas PF-03 y PF-04, `docs/propuestas/BE_Plan_Funcional_Profesional_v1-1.md` §5.3.
