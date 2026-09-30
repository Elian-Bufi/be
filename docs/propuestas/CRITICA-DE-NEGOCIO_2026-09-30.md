# Crítica de negocio por tipo de profesional — corte `main` en `53cc70e` (2026-09-30)

> **Qué es:** una lectura crítica de lo que BE le da hoy a cada profesional y de lo que le falta para trabajar con más personas sin bajar la calidad. Es una **propuesta para Dirección**, no un requisito: no convierte nada en canónico y no toca el legajo. Los identificadores que usa son locales a este documento.
>
> **Base leída:** contratos de `packages/domain` (`contratos-entrenamiento.ts`, `contratos-nutricion.ts`, `contratos-antropometria.ts`, `contratos-formularios.ts`), rutas de la API (`apps/api/src/entrenamiento`, `nutricion`, `antropometria`, `formularios`), pantallas del website (`apps/web/src/app/pro/advisees/*`) y las fichas PF-01/02, PF-03 y PF-04. Se consideran también los tres PR abiertos de la tanda del 2026-09-30 (#116 evolución visual, #117 aviso, #118 apariencia), sin integrar.
>
> **Regla que respeta:** BE no califica a las personas (sin puntajes, sin porcentajes de cumplimiento, sin «adherencia»), no infiere clínica y no delega decisiones en inteligencia artificial. Cada mejora propuesta se mide por **tiempo que le devuelve al profesional** y **decisiones que le deja tomar con contexto**, nunca por «gamificación».

## 1 Qué tiene hoy cada profesional (lo que existe en `main`)

| Profesional | Lo que ya resuelve | Cómo lo hace |
|---|---|---|
| **Entrenamiento** | Evaluar con contexto citado (PF-02), fijar objetivo, planificar bloques → microciclos → sesiones → prescripciones (ejercicio versionado, series con repeticiones o rango, intensidad, carga sugerida, parámetros propios, notas), validar y activar versiones, ver Hoy/ocurrencias/ejecuciones, revisar con contexto y comparar lo planificado con lo registrado (#115) | `training/plans` con versiones DRAFT → ACTIVATED y «nueva versión a partir de esta» (`basedOnPlanId`, DL-047); catálogo de ejercicios sembrado, propio (`PROFESSIONAL_MANUAL`) e importado con licencia (RF-060) |
| **Nutrición** | Evaluar con contexto (PF-04 I1), objetivo cuantitativo, plan por días tipo → comidas → opciones → ítems del catálogo con cantidad y estado de preparación, en modo platos u intercambios; ejecuciones del asesorado (prescripto y fuera de prescripción); revisiones | `nutrition/plans`, mismo ciclo de versiones; catálogo de alimentos sembrado, propio e importado |
| **Antropometría** | Evaluaciones con mediciones por protocolo versionado, correcciones y anulaciones trazables, cálculos con método declarado, evolución por métrica con huecos y grupos de comparabilidad (API-ANT-06; visual en #116) | protocolos y métodos del catálogo sintético; la figura de la toma (DL-073) |
| **Transversal** | Vínculo con alcance y consentimiento, formularios (plantillas versionadas FRM), permisos en el servidor (PDP), historial del asesorado en la APK, identidad visual y apariencia (#118) | `PlantillaDeFormulario` sembrada por migración; tipos `TEXT`, `NUMBER`, `BOOLEAN` |

Es una base seria: trazable, versionada, con el asesorado como titular de sus datos. La crítica no es sobre lo que hace, sino sobre **cuánto cuesta usarla con veinte personas en vez de con dos**.

## 2 Dónde pierde tiempo hoy (verificado en el código)

1. **Todo plan empieza en blanco o desde el plan anterior de la misma persona.** `CrearPlanDeEntrenamientoRequest` y `CrearPlanRequest` solo admiten `initialStructure` (lo que se escriba) o `basedOnPlanId` (una versión **del mismo asesorado**). No hay forma de reutilizar entre asesorados una estructura que el profesional ya validó cien veces: «fuerza 3 días, principiante», «12 semanas de hipertrofia», «día tipo de entrenamiento / de descanso». Con cinco asesorados se tolera; con veinte, el profesional termina copiando a mano de una pestaña a otra, con los errores que eso trae.
2. **El catálogo propio se carga elemento por elemento.** Un ejercicio o un alimento manual es una acción; no hay «mi lista de ejercicios habituales» ni agrupaciones. El profesional de nutrición que arma siempre las mismas 40 opciones de desayuno las vuelve a buscar cada vez.
3. **El profesional no puede crear sus propios formularios.** Las plantillas FRM vienen sembradas por migración (FRM-SALUD, FRM-HABITOS y FRM-ENTRENAMIENTO; la de nutrición está propuesta en PF-04, no sembrada). Una pregunta que este profesional necesita («¿tenés bicicleta fija?») no se puede agregar sin un cambio de código. Y los tipos de campo son tres. **Esto no es un olvido:** el legajo lo excluye para P0 («P0 no modela un builder libre arbitrario», REG-06-209; UC-P32), y WP-07 registra el editor de plantillas como **descartado por Dirección** (D-D y §8).
4. **No hay vista de cartera.** El profesional entra asesorado por asesorado. Quién tiene revisión vencida, quién no registró en dos semanas, quién tiene un plan en borrador sin activar: hoy hay que recordarlo. PF-07 (vista de seguimiento) lo prevé; sigue sin decidir.
5. **La antropometría no tiene protocolos del profesional.** Lo que mide cada uno (perímetros que usa, pliegues que toma, en qué orden) está fijo en el catálogo sintético. Un antropometrista con su rutina de toma hoy la adapta a la del catálogo, no al revés.
6. **Lo que la persona ya contestó no se reutiliza entre áreas** salvo por cita explícita (PF-02/PF-04 I1). Está bien que sea explícito (§5.3 del plan: sin duplicación silenciosa), pero cada área la vuelve a pedir.

## 3 Qué frena la escala (y qué no)

- **Lo que sí frena:** el costo por asesorado es casi constante (planificar desde cero, buscar en el catálogo, pedir el contexto). El profesional que hoy atiende diez y quiere atender treinta no gana nada con más pantallas: gana con **reutilización con trazabilidad** y con **una vista que le diga a quién mirar hoy**.
- **Lo que no frena, y no hay que tocar:** la versión inmutable, la validación antes de activar, la cita verificada, el consentimiento por alcance. Son lo que hace que BE sea profesional y no un cuaderno. Cualquier «preset» tiene que entrar por esa puerta: **una plantilla es un molde; el plan del asesorado sigue naciendo, validándose y activándose igual que hoy**.
- **Lo que parece escala y es ruido:** puntajes de adherencia, «rachas», rankings, resúmenes automáticos con IA que «recomiendan». El legajo los excluye (TEST-PRJ-009 lo vigila) y con razón: el profesional pierde el control del juicio y el asesorado pasa a ser calificado.

## 4 Qué le daría valor mañana, por orden de rendimiento

| # | Mejora | Para quién | Por qué primero | Qué exige |
|---|---|---|---|---|
| **A** | **Plantillas del profesional** para planes de entrenamiento y de comidas: guardar una versión como molde, empezar un plan desde un molde, mantener «mis plantillas» versionadas y propias | Entrenamiento y nutrición | Es el costo repetido más grande y se resuelve reutilizando el esquema de estructura que ya existe; sin cambios en la APK | Ficha `PLANTILLAS-DEL-PROFESIONAL_ficha.md` (adjunta); decisión de Dirección |
| **B** | **Vista de cartera** (PF-07): revisiones pendientes y vencidas, borradores sin activar, última actividad registrada por asesorado; sin puntajes | Los tres | Le dice a quién mirar hoy; se arma con datos que ya existen (`nextReviewAt`, estados de versión, ejecuciones) | Ficha PF-07 (pendiente); DEC-09 (selector de período) |
| **C** | **Listas propias del catálogo** («mis habituales»): favoritos y grupos de ejercicios/alimentos del profesional, con búsqueda | Entrenamiento y nutrición | Complementa A: una plantilla referencia ejercicios/alimentos; sin favoritos, buscar sigue costando | Cambio chico de contrato (marcas por profesional) |
| **D** | **Formularios propios** con tipos nuevos (selección simple/múltiple, fecha) | Los tres | Desbloquea preguntas por profesional sin código; la selección quedó fuera del primer incremento de contexto (DL-103; DEC-04 solo la recomienda) | **Levantar una exclusión vigente** (REG-06-209; WP-07 D-D, descartado por Dirección), con caso de negocio y modelo de permisos (Plan Funcional, línea 46); matriz de pertinencia y revisión de contenido (DEC-02). Un tipo de campo nuevo exige APK nueva: las publicadas no abren esa solicitud. No es solo técnica |
| **E** | **Protocolos propios de antropometría** (versión del profesional sobre el catálogo) | Antropometría | Menor volumen de uso hoy; la evolución visual (#116) resuelve antes la lectura | El legajo deja abierto el protocolo concreto al criterio profesional (T-06-33; UC-P19) y exige que sea identificable, versionado y reconstruible (REG-06-151/152/168) y que la comparación tenga fundamento (REG-06-162); los **métodos** son preestablecidos por BE (DIR-10-MET-A; REG-06-157/203/208). Es una extensión fuera del 09, como las plantillas |

**Recomendación:** A ahora (ficha adjunta), B como siguiente orden, C dentro de A o inmediatamente después. D y E cuando Dirección resuelva sus decisiones de contenido.

**Corrección del 2026-09-30.** La primera versión de este documento daba por sembrada una plantilla de nutrición que no existe y atribuía a DEC-04 una exclusión que fue de DL-103. Además no advertía que la mejora D choca con una exclusión vigente de P0. Lo marcó el reconocimiento previo a proponer D. La fila E citaba REG-06-154/157, que regulan la unidad de origen y las fórmulas, no los protocolos: se reemplazó por las anclas correctas.

## 5 Riesgos de ir por «presets» sin cuidado

- **Copiar y pegar sin adaptar.** Una plantilla aplicada sin mirar es un plan genérico. Mitigación en la ficha: el plan nace como **borrador** con la validación de siempre; la carga sugerida y las cantidades **no** se copian por defecto (son de la persona, no del molde); el origen queda registrado en la versión.
- **Datos de una persona dentro del molde.** Una nota de prescripción puede decir «cuidado con la rodilla de Juan». Mitigación: al guardar como plantilla se muestran las notas y se piden confirmar o vaciar; el texto libre del molde no se comparte con nadie.
- **Propiedad.** La plantilla es del profesional que la creó, no del vínculo ni del asesorado. Si el profesional deja BE, sus plantillas quedan inactivas; los planes ya aplicados conservan su copia (instantánea) y no dependen de la plantilla.
- **Catálogo que cambia.** Una plantilla referencia versiones de ejercicios o alimentos; si una versión deja de estar disponible, al aplicar se señala y no se activa hasta reemplazarla (a confirmar qué controla hoy `validate` sobre versiones no disponibles).

## 6 Lo que este documento no propone

- Compartir plantillas entre profesionales, mercados de plantillas ni plantillas «de BE» sugeridas: primero lo propio.
- Generación automática de planes o plantillas con IA.
- Cualquier métrica de cumplimiento o calificación del asesorado.
- Cambios en la APK: el asesorado no ve plantillas; recibe un plan igual al de hoy.
