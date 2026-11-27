/**
 * DL-202 (WP-ESFUERZO-POR-SERIE) · «Pedir el esfuerzo de cada serie»: TEST-EP-01 a TEST-EP-06. La opción en sus dos
 * estados y ausente, la detección en los planes de antes, la copia en las plantillas, la capacidad de la app y lo que
 * cambia en Registros cuando el plan no la pide.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPACIDAD_ESFUERZO_DE_CADA_SERIE, CAPACIDADES_CONOCIDAS, valorDeCapacidades } from './compatibilidad-de-clientes';
import { PlanificacionDelPlanSchema, type PlanificacionDelPlan, type SerieEjecutadaApi } from './contratos-entrenamiento';
import { PlanConObjetivosSchema, SesionParaRegistrarSchema } from './contratos-entrenamiento-por-serie';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { COPY_ESFUERZO_DE_CADA_SERIE, declaroElEsfuerzo, hayEsfuerzoDeclarado, pideElEsfuerzoDeCadaSerie, seMuestraElEsfuerzoDeLaSerie } from './esfuerzo-de-cada-serie';
import { planificacionDesdeLaPlantilla, planificacionParaLaPlantilla } from './planificacion-de-la-plantilla';
import { PlanificacionDeLaPlantillaSchema } from './contratos-plantillas';
import { planificacionPodada } from './planificacion-del-plan';
import { relacionDeUnaSerie } from './registros-de-entrenamiento';

const serie = (s: Partial<SerieEjecutadaApi>): SerieEjecutadaApi => ({ setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: null, perceivedExertion: null, ...s });
const base: PlanificacionDelPlan = { startDate: null, weeks: null, goal: null, phases: [] };

test('TEST-EP-01 · la opción del plan: apagada por defecto, con sus dos valores y el texto en la notación del plan', () => {
  assert.equal(COPY_ESFUERZO_DE_CADA_SERIE.opcionDelPlan, 'Pedir el esfuerzo de cada serie');
  assert.equal(COPY_ESFUERZO_DE_CADA_SERIE.opcionExplicada('RPE'), 'La app le pregunta a la persona el RPE de cada serie efectiva, no de las aproximaciones.');
  assert.equal(COPY_ESFUERZO_DE_CADA_SERIE.opcionExplicada('RIR'), 'La app le pregunta a la persona el RIR de cada serie efectiva, no de las aproximaciones.');
  for (const t of [COPY_ESFUERZO_DE_CADA_SERIE.opcionDelPlan, COPY_ESFUERZO_DE_CADA_SERIE.opcionExplicada('RIR'), COPY_ESFUERZO_DE_CADA_SERIE.porLosRegistros]) assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
  // Ausente es válido (un plan de antes), y los dos valores también.
  assert.equal(PlanificacionDelPlanSchema.safeParse(base).success, true);
  assert.equal(PlanificacionDelPlanSchema.safeParse({ ...base, askSetEffort: true }).success, true);
  assert.equal(PlanificacionDelPlanSchema.safeParse({ ...base, askSetEffort: false }).success, true);
  assert.equal(PlanificacionDelPlanSchema.safeParse({ ...base, askSetEffort: 'si' }).success, false);
  // Sin nada escrito y sin registros, apagada.
  assert.equal(pideElEsfuerzoDeCadaSerie(base, false), false);
  assert.equal(pideElEsfuerzoDeCadaSerie(null, false), false);
});

test('TEST-EP-02 · lo escrito manda; ausente, se pide solo si la persona ya declaró esfuerzos en ese plan', () => {
  assert.equal(pideElEsfuerzoDeCadaSerie({ ...base, askSetEffort: true }, false), true);
  assert.equal(pideElEsfuerzoDeCadaSerie({ ...base, askSetEffort: false }, true), false);
  assert.equal(pideElEsfuerzoDeCadaSerie(base, true), true);
  // Declarar es escribir un RIR: tildar «como el plan», un RIR del plan o una aproximación no cuentan.
  assert.equal(declaroElEsfuerzo(serie({ rir: 2 })), true);
  assert.equal(declaroElEsfuerzo(serie({ rir: 2, fieldOrigins: { rir: 'PERSON' } })), true);
  assert.equal(declaroElEsfuerzo(serie({ rir: 0 })), true, 'el cero es un esfuerzo');
  assert.equal(declaroElEsfuerzo(serie({ rir: null })), false);
  assert.equal(declaroElEsfuerzo(serie({ rir: 2, recordedAs: 'AS_PLANNED' })), false);
  assert.equal(declaroElEsfuerzo(serie({ rir: 2, recordedAs: 'TYPED', fieldOrigins: { completedRepetitions: 'PERSON', rir: 'PLAN' } })), false);
  assert.equal(declaroElEsfuerzo(serie({ rir: 2, setKind: 'WARM_UP' })), false);
  assert.equal(hayEsfuerzoDeclarado([]), false);
  assert.equal(hayEsfuerzoDeclarado([{ exercises: [{ sets: [serie({})] }] }, { exercises: [{ sets: null }] }]), false);
  assert.equal(hayEsfuerzoDeclarado([{ exercises: [{ sets: [serie({})] }] }, { exercises: [{ sets: [serie({ setIndex: 2, rir: 1 })] }] }]), true);
});

test('TEST-EP-03 · en la app: las efectivas lo muestran si el plan lo pide; las aproximaciones, nunca', () => {
  assert.equal(seMuestraElEsfuerzoDeLaSerie(true, 'WORKING'), true);
  assert.equal(seMuestraElEsfuerzoDeLaSerie(false, 'WORKING'), false);
  assert.equal(seMuestraElEsfuerzoDeLaSerie(true, 'WARM_UP'), false);
  assert.equal(seMuestraElEsfuerzoDeLaSerie(false, 'WARM_UP'), false);
  // Sin el dato (una API anterior, sin la lectura), como hasta ahora: se pide.
  assert.equal(seMuestraElEsfuerzoDeLaSerie(undefined, undefined), true);
  assert.equal(seMuestraElEsfuerzoDeLaSerie(null, 'WORKING'), true);
});

test('TEST-EP-04 · la opción no se pierde al podar, y las plantillas la copian con su valor', () => {
  assert.equal(planificacionPodada({ ...base, askSetEffort: false }, [], [])?.askSetEffort, false, 'un «false» escrito no es una planificación vacía');
  assert.equal(planificacionPodada({ ...base, askSetEffort: true }, [], [])?.askSetEffort, true);
  assert.equal(planificacionPodada(base, [], []), null, 'ausente sigue ausente');
  for (const valor of [true, false]) {
    const plantilla = planificacionParaLaPlantilla({ ...base, weeks: 4, askSetEffort: valor })!;
    assert.equal(PlanificacionDeLaPlantillaSchema.safeParse(plantilla).success, true);
    assert.equal(plantilla.askSetEffort, valor);
    const aplicada = planificacionDesdeLaPlantilla(plantilla, { blocks: [] }, { blocks: [] });
    assert.equal(aplicada?.askSetEffort, valor);
  }
  assert.equal(planificacionParaLaPlantilla({ ...base, weeks: 4 })?.askSetEffort, undefined);
});

test('TEST-EP-05 · la capacidad de la app y los campos de API-SER-01 y API-SER-02', () => {
  assert.equal(CAPACIDAD_ESFUERZO_DE_CADA_SERIE, 'training-set-effort-1');
  assert.ok(CAPACIDADES_CONOCIDAS.includes(CAPACIDAD_ESFUERZO_DE_CADA_SERIE));
  assert.ok(valorDeCapacidades(CAPACIDADES_CONOCIDAS).length <= 256, 'todas juntas entran en la cabecera');
  assert.equal(SesionParaRegistrarSchema.shape.askSetEffort.safeParse(false).success, true);
  assert.equal(SesionParaRegistrarSchema.shape.askSetEffort.safeParse(undefined).success, true);
  assert.equal(PlanConObjetivosSchema.shape.askSetEffort.safeParse(true).success, true);
});

test('TEST-EP-06 · Registros: sin pedirlo, un RIR sin registrar no es un dato que falta; uno registrado se compara', () => {
  const objetivo = { repetitions: { value: 8 }, rir: 2, suggestedLoad: null };
  const sinRir = serie({});
  assert.equal(relacionDeUnaSerie(objetivo, sinRir, 'RIR').conDatoSinRegistrar, true, 'pidiéndolo, falta');
  const sinPedir = relacionDeUnaSerie(objetivo, sinRir, 'RIR', false);
  assert.equal(sinPedir.conDatoSinRegistrar, false);
  assert.equal(sinPedir.texto, 'Dentro de lo indicado');
  assert.equal(relacionDeUnaSerie(objetivo, serie({ rir: 0 }), 'RIR', false).texto, 'RIR: por debajo', 'lo registrado se sigue comparando');
});
