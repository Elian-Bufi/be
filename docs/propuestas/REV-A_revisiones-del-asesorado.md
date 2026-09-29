# Propuesta · El asesorado lee sus propias revisiones de entrenamiento y nutrición

> **Estado:** PROPUESTA para decisión de Dirección. **No implementada.** Sale del trabajo condicionado de la tanda del 2026-09-29 (punto 7 de la orden). Los identificadores `REV-A-*` son locales a esta propuesta.

## Qué dice el legajo, y qué no

**APROBADO:**
- **08, matriz §6.2** (`docs/legajo/08_BE_LEG_08_v0.1.5.md:205`): «Revisiones/decisiones profesionales | C4 | profesional | **✔ (sin notas secretas — §9.15)**» en la columna del titular.
- **08:495:** «El asesorado ve **toda su historia** desde el producto (§9.15 — sin notas secretas) y puede exportarla».

**Lo que el canon no fija:**
1. **Contrato.** API-TRN-23 (`09 v0.10:1375`) y API-NUT-19 (`09 v0.9:904`) solo definen la lectura del profesional: incluye «evidencia, interpretación, resultado, fundamento, next action y estado de aplicación». No hay una operación `/me/...` para el titular.
2. **Qué son las «notas secretas».** La revisión no tiene un campo de notas privadas. Tiene `interpretation` y `rationale`, que escribe el profesional, y `evidenceReferences`, que apuntan a evaluaciones, ejecuciones o ingestas. El 08 no dice si la interpretación y el fundamento son para el asesorado.
3. **Cuándo se ve.** Si al registrarla, o recién cuando el profesional la aplica (continuidad o cierre, API-TRN-24 / API-NUT-20).
4. **Pantallas.** B10 no tiene una pantalla del asesorado para revisiones. Hoy la APK no lee revisiones.
5. **Con el acceso suspendido.** El caso de DL-089: revocado el B2 o pausado el vínculo, ¿el titular conserva la lectura de lo propio? Para las ingestas se resolvió de forma distinta en la lista y en el detalle (hallazgo H-1 de la ficha PF-04).

Por esas cinco preguntas **no se implementó**: cualquiera de ellas es una decisión de producto o de legajo.

## Lo que existe y se reutiliza

| Pieza | Dónde |
|---|---|
| Lectura del profesional: `RevisionDeEntrenamientoSchema` y `RevisionSchema` (nutrición) | `packages/domain/src/contratos-entrenamiento.ts:680`, `contratos-nutricion.ts:483` |
| Rutas `GET /training/reviews/:id` y `GET /nutrition/reviews/:id` | `apps/api/src/entrenamiento/entrenamiento.controller.ts:235`, `apps/api/src/nutricion/nutricion.controller.ts:207` |
| Proyección para el titular de otros recursos (patrón a copiar) | «Tu historial de entrenamiento» (API-TRN-19-LISTA, DL-096) y el objetivo en «Plan actual» (`ObjetivoParaAsesoradoSchema`), que omiten el fundamento y el método |

## Propuesta (REV-A)

**REV-A-1 · Contrato.** Dos lecturas nuevas del titular, con esquema **propio** (no se amplía el del profesional ni ningún esquema estricto que ya lee la APK publicada):
- `GET /me/training/reviews` y `GET /me/training/reviews/{reviewId}`;
- `GET /me/nutrition/reviews` y `GET /me/nutrition/reviews/{reviewId}`;
- con solo los campos que Dirección decida mostrar (REV-A-D1). Nunca identificadores de recursos que el titular no pueda abrir.

**REV-A-2 · Autorización.** El titular, con A3 vigente, como «Tu historial» (DL-096). Qué pasa con el B2 revocado o el vínculo pausado se decide en REV-A-D3. Otro asesorado o un profesional recibe el mismo 404 neutral.

**REV-A-3 · APK.** Una sección «Revisiones» en Entrenamiento y en Nutrición, con la fecha, el resultado en lenguaje claro (sin juicios ni puntajes; REG-06-117 y REG-06-125) y el texto que decida REV-A-D1. Necesita una APK nueva.

## Decisiones pendientes

| ID | Pregunta | Alternativas y consecuencia | Recomendación |
|---|---|---|---|
| REV-A-D1 | ¿Qué campos ve el asesorado? | **A.** Resultado, período, próxima acción y fecha; sin interpretación ni fundamento, como el objetivo en «Plan actual». **B.** Además, la interpretación y el fundamento: más transparencia, pero el profesional hoy los escribe sin saber que el asesorado los lee. **C.** B, con un aviso en el website del profesional de que esos textos los ve el asesorado, vigente desde la decisión y no retroactivo | **C**, o **A** si Dirección prefiere no cambiar lo que escribe el profesional |
| REV-A-D2 | ¿Desde cuándo? | **A.** Al registrarla. **B.** Recién cuando se aplica: una revisión registrada y no aplicada todavía puede corregirse con otra | **B** |
| REV-A-D3 | ¿Con el B2 revocado o el vínculo pausado? | **A.** Sigue leyendo lo propio con A3 (08:495: su historia es suya). **B.** Se suspende como las lecturas profesionales | **A**, coherente con «Tu historial» |
| REV-A-D4 | ¿Entra en la exportación del titular? | La exportación del titular es del 08 §19/§20 | Sí, cuando exista la exportación |

## Criterios de aceptación

| Criterio | Riesgo | Prueba |
|---|---|---|
| El titular lee solo sus revisiones, y en su proyección | Leer las de otra persona, o campos del profesional | Integración: 404 idéntico ante una ajena o inexistente; el esquema propio no trae los campos excluidos por REV-A-D1 |
| Sin juicios ni puntajes | Calificar a la persona | Control de términos prohibidos de entrenamiento y nutrición (TEST-PRJ-009) |
| La APK publicada no se rompe | Un esquema estricto con propiedades nuevas | No se toca ninguna respuesta existente: operaciones nuevas |
| Cumple REV-A-D2 y REV-A-D3 | Mostrar lo no aplicado, o cortar lo propio | Integración por estado de aplicación, A3, B2 y vínculo |

## Archivos que tocaría

- `packages/domain/src/contratos-entrenamiento.ts`, `contratos-nutricion.ts`, `cliente-http.ts` y `openapi.ts`;
- `apps/api/src/entrenamiento/revisiones.service.ts`, `apps/api/src/nutricion/revisiones.service.ts` y sus controladores;
- `apps/mobile/src/pantallas/entrenamiento.tsx`, `nutricion.tsx` y `App.tsx`;
- `test/integration/`: una suite nueva.

**Primer incremento, una vez decididas REV-A-D1 a D3:**
1. Un PR de contrato y API, sin APK.
2. Un PR de APK, que se publica junto con otros cambios de la APK.
