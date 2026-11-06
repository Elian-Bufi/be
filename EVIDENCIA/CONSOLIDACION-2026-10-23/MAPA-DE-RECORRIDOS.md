# Mapa de los recorridos corregidos · 2026-10-23

Cada recorrido va de la pantalla a la API, de ahí a la regla, a la base y a lo que se ve. Los nombres de archivos,
operaciones y tablas son los reales. Las marcas dicen qué es qué:

- **[código]** está escrito así y se leyó en el código, en los PR #200, #203, #195 y #198.
- **[simplificación]** es una explicación para entender el recorrido; el código hace más cosas.

---

## 1. «Calorías registradas»: qué representa el número y qué falta (DL-153, PR #200)

**Lo que ve el profesional.** En la ficha de la persona, en el Resumen:

> Calorías registradas · **1.975 kcal por día** · Media de los días con valor · 7 días: 2 con valor · 4 sin registros · 1 subtotal · 1 comida del plan sin registro

En Analizar, en la lectura del día: «Subtotal de lo registrado · Comidas del plan: 3 de 4 registradas · 1 sin registro · Sin registro: Cena».

| Paso | Dónde | Qué pasa |
|---|---|---|
| Pantalla | `apps/web/src/app/pro/advisees/seguimiento/resumen-indicadores.tsx` (la tarjeta), `analizar.tsx` (la lectura) y `series.ts` (`useSeriesDelAnalisis`) | **[código]** La tarjeta pide la serie diaria de la métrica `nutricion.energia`. No calcula nada: dibuja lo que resume el dominio |
| API | `GET /api/v1/advisees/{id}/projections/NUTRITION_PRESCRIBED_VS_RECORDED?metric=ENERGY&grain=DAY` (**API-PRJ-01**) · `apps/api/src/analisis/analisis.controller.ts` | **[código]** El PDP decide con el alcance Nutrición. Una sola transacción lee: `registrosDeComidaDelPeriodo`, `versionesActivadas`, `instantaneasDe` (DL-153: una consulta más), `versionesDeObjetivo` y si hay registros de otros profesionales |
| Regla | `apps/api/src/analisis/lectura-proyecciones.ts` → `packages/domain/src/nutricion-del-analisis.ts` | **[código]** Pasos: `diasNutricionales` agrupa por fecha civil y aparta las anuladas → `comidasDelPlanDeLosDias` arma el **mismo contraste que la pestaña Registros** (`construirContraste`, de `nutricion.ts`, el de API-NUT-17) → `serieNutricional` suma lo conocido de cada día (`sumaExacta`) y le pone la calidad, lo que falta (`missing`) y `coverage.planMeals` |
| Base | `ingesta_nutricional`, `rectificacion_de_cantidades`, `anulacion_de_ingesta`, `version_de_plan_nutricional`, `instantanea_de_plan_nutricional`, `version_de_objetivo_nutricional` | **[código]** Nada se guarda: la proyección es una lectura derivada. **[simplificación]** «el día tipo» es el que la persona eligió al registrar una opción del plan, o el único que tiene el plan |
| Respuesta visible | `packages/domain/src/series-del-analisis.ts` (`resumirPeriodo`, `coberturaBreve`, `partesDeLaCobertura`) y `calidadEnPalabras` | **[código]** La media es de los días con valor, sin hoy, igual que antes. Los subtotales ahora cuentan las comidas del plan sin registro, y las partes nuevas dicen cuántas comidas faltan y en cuántos días no se sabe qué indicaba el plan |

**Antes y después, con el mismo dato** (un plan de cuatro comidas; el 21/10, tres registradas con cantidades):

| | Antes (`0fb1bff`) | Después (#200) |
|---|---|---|
| Calidad del 21/10 | `COMPLETE`, «sin faltantes» | `PARTIAL`, «subtotal de lo registrado» |
| Lo que falta | Nada | `COMIDA_DEL_PLAN_SIN_REGISTRO` × 1 · «Sin registro: Cena» |
| Media del Resumen | 1.975 kcal, de 2 días | 1.975 kcal, de 2 días: no cambia |
| Subtotales del Resumen | 0 | 1 |

---

## 2. Una revisión registrada: en qué se apoyó (DL-154, PR #203)

**Lo que ve el profesional.** En Nutrición · Revisiones, cada revisión dice:

> Nutrición · período revisado: 20 oct – 21 oct 2026 · registró: Lic. … · Evidencia seleccionada: 2 comidas · 1 versión del plan

Con «Ver la evidencia» aparece la lista, por ejemplo: «22 oct 2026 · Almuerzo · opción del plan» y, debajo, «Se deshizo después de esta revisión (24 oct 2026, 03:19): quedó fuera de los totales».

| Paso | Dónde | Qué pasa |
|---|---|---|
| Seleccionar | `apps/web/src/app/pro/advisees/evidencia-de-revision.tsx` (`SeleccionDeEvidencia`) y `nutrition/revisiones.tsx` (`FormularioDeRevision`) | **[código]** Las candidatas salen del contexto de revisión del período (API-NUT-17): las comidas, las versiones del plan y el objetivo. Nada viene marcado |
| Registrar | `POST /api/v1/advisees/{id}/nutrition/reviews` (**API-NUT-18**) · `apps/api/src/nutricion/revisiones.service.ts` | **[código]** El PDP decide, se valida la revisión (`evaluarRevision`) y cada referencia (`exigirEvidenciaReconstruible`: de esta persona, de este profesional, una comida no anulada) |
| Guardar | Tabla `revision_nutricional`, columna `evidencias` (JSON), de solo agregar | **[código]** Se guardan las referencias tal como llegaron, `{type, id}`, en su orden. No hay tabla nueva |
| Leer la lista | API-NUT-17 → `previousReviews` (la forma `RevisionSchema`, la misma que lee la APK con REV-A) | **[código]** El resumen «2 comidas · 1 versión del plan» se cuenta en el website desde `evidenceReferences` (`resumenDeLaEvidencia`), sin otra lectura |
| Resolver la evidencia | `GET /api/v1/nutrition/reviews/{reviewId}/evidence` (**API-NUT-19-EVIDENCIA**, nueva) → `RevisionesService.evidencia` → `apps/api/src/evidencia/evidencia-de-revision.ts` | **[código]** Pasos: la misma decisión que API-NUT-19 (el PDP y el profesional del seguimiento); se leen las referencias guardadas (`referenciasGuardadas`) y cada una se busca en el seguimiento; lo de después de `momento_de_registro` de la revisión es un cambio posterior |
| Base | `ingesta_nutricional` con `rectificacion_de_cantidades`, `correccion_de_ingesta` y `anulacion_de_ingesta`; `instantanea_de_plan_nutricional` (el nombre de la comida); `version_de_plan_nutricional` (el número y la sucesora); `version_de_objetivo_nutricional` (y su sucesora) | **[código]** Solo lectura |
| Lo visible | `apps/web/src/app/pro/advisees/evidencia-registrada.tsx` y `packages/domain/src/evidencia-registrada.ts` | **[código]** Los grupos (comidas por fecha, planificación), cada nombre y cada cambio posterior en palabras. **[simplificación]** «Abrir» abre el `Panel` (un `<dialog>` modal) con `DetalleDeRegistroDeComida`, que vuelve a pedir el registro (API-ING-03) con el permiso de hoy |

**Entrenamiento** es igual, con **API-TRN-23-EVIDENCIA** (`training/reviews/{id}/evidence`), la tabla `revision_de_entrenamiento` y, como registros, las sesiones de `ejecucion_de_entrenamiento` con sus correcciones. Las sesiones se abren con API-TRN-19.

---

## 3. Sustituir un ejercicio en la APK (DL-151, PR #195)

**Lo que ve la persona.** En la sesión enfocada, «Sustituir ejercicio» abre un diálogo. Desde el 23/10, la ayuda dice: «Vale para todas las series de este ejercicio en esta sesión, las que ya registraste y las que faltan: no se puede cambiar una serie sola». Después de elegir, la tarjeta dice «Ejecutado: Press con mancuernas · Sustituido», debajo del planificado.

| Paso | Dónde | Qué pasa |
|---|---|---|
| Pantalla | `apps/mobile/src/pantallas/sesion-enfocada.tsx` (el diálogo) y `entrenamiento.tsx` (`sustituir`) | **[código]** Si ya hay series registradas, antes pregunta (`textoDeLaConfirmacion`): «Las 2 series que ya registraste de «Press de banca» pasan a contar como «Press con mancuernas», y las que registres después también» |
| Buscar | `POST /api/v1/training/exercises/search` (**API-TRN-13-BUSQUEDA**), con el texto en el cuerpo | **[código]** Desde #189 cada fila trae `origin`: una APK construida sobre la base vieja lo rechazaría; la rama está al día |
| Guardar | `PATCH /api/v1/training/execution-drafts/{id}` (**API-TRN-17**), con la versión vigente del borrador | **[código]** Solo viaja `performedExerciseVersionId` por ejercicio (`cambiosParaSustituir`); lo planificado no tiene por dónde viajar. Primero se manda lo pendiente del teléfono |
| Base | `borrador_de_ejecucion_de_entrenamiento.contenido` (JSON); al confirmar (**API-TRN-18**), `ejecucion_de_entrenamiento` | **[código]** El plan no cambia. La API calcula `substituted` comparando lo planificado y lo realizado |
| Lo visible | La tarjeta, «Ver rutina» y el resumen antes de finalizar | **[código]** Las dos puntas: planificado y ejecutado. **[simplificación]** «un ejercicio, un realizado»: el contrato admite un realizado por ejercicio, no por serie |

---

## 4. Que una APK instalada siga leyendo la API (DL-152, PR #198)

**Lo que protege.** Las APK validan **cada respuesta** con esquemas estrictos (`z.strictObject`, en `packages/domain/src/cliente-http.ts`). Un campo nuevo en una respuesta que lee una APK publicada hace que esa pantalla diga que no reconoce la respuesta, en todos los teléfonos que no se actualizaron.

| Paso | Dónde | Qué pasa |
|---|---|---|
| Congelar | `scripts/congelar-lo-que-lee-la-apk.mjs <tag>` → `packages/domain/fixtures/lecturas-de-la-apk/0.13.2.json` y `0.17.0-candidata.3.json` | **[código]** Desde las fuentes de cada tag publicado: qué operaciones llama la APK (44 y 80) y el JSON Schema de lo que acepta cada lectura. No se edita a mano ni se regenera desde `main` |
| Probar el contrato | `packages/domain/src/lecturas-de-la-apk.test.ts` | **[código]** Lo congelado se lee igual; cada operación sigue con su verbo y su ruta |
| Probar la API real | `test/integration/lecturas-de-las-apk.int-spec.ts` | **[código]** Pide cada operación como la pide esa APK y valida la respuesta real con el esquema congelado; al final exige haberlas leído todas |
| En este encargo | #204, la combinación | **[código]** Lo nuevo de DL-153 (API-PRJ-01) y de DL-154 (dos operaciones nuevas) no está entre lo que leen las APK: por eso se eligió así. La forma de la revisión (`RevisionSchema`), que la candidata lee con REV-A, no cambió |
