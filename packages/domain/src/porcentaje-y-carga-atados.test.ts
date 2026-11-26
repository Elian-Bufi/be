/**
 * Tanda 6 del editor de Entrenamiento (ET2-D18, a ratificar) · el % RM y la carga, atados en las dos direcciones, con el
 * redondeo «a una carga lógica de gimnasio» del plan y su excepción por ejercicio.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cargaAtadaAlPorcentaje,
  pasoDeLasCargas,
  porcentajeDeLaCarga,
  REDONDEO_POR_OMISION,
  redondeoDelEjercicio,
  SIN_UNO_RM_PARA_LAS_CARGAS,
} from './repeticion-maxima';
import { PlanificacionDelPlanSchema, type PlanificacionDelPlan } from './contratos-entrenamiento';
import { PlanificacionDeLaPlantillaSchema } from './contratos-plantillas';
import { planificacionPodada } from './planificacion-del-plan';
import { planificacionDesdeLaPlantilla, planificacionParaLaPlantilla } from './planificacion-de-la-plantilla';

const kg = (value: number) => ({ value, unit: 'kg' as const });

test('% → carga: 1RM × %, redondeada al paso elegido (1, 2,5 o 5) y nunca 0', () => {
  // 101,5 kg × 30 % = 30,45 kg.
  assert.deepEqual(cargaAtadaAlPorcentaje(30, kg(101.5), 'BARRA', 1), kg(30));
  assert.deepEqual(cargaAtadaAlPorcentaje(30, kg(101.5), 'BARRA', 2.5), kg(30));
  assert.deepEqual(cargaAtadaAlPorcentaje(30, kg(101.5), 'BARRA', 5), kg(30));
  // 100 kg × 72 % = 72 kg.
  assert.deepEqual(cargaAtadaAlPorcentaje(72, kg(100), 'BARRA', 1), kg(72));
  assert.deepEqual(cargaAtadaAlPorcentaje(72, kg(100), 'BARRA', 2.5), kg(72.5));
  assert.deepEqual(cargaAtadaAlPorcentaje(72, kg(100), 'MAQUINA', 5), kg(70));
  // Muy chica: un paso, nunca 0.
  assert.deepEqual(cargaAtadaAlPorcentaje(30, kg(5), 'BARRA', 5), kg(5));
});

test('el automático es el redondeo de siempre (ET1-D06): 1 kg por debajo de 40 kg solo con «automático»', () => {
  // 100 kg × 33 % = 33 kg: en automático, una barra de menos de 40 kg va de a 1.
  assert.equal(pasoDeLasCargas('AUTO', 'BARRA', 33), 1);
  assert.deepEqual(cargaAtadaAlPorcentaje(33, kg(100), 'BARRA', 'AUTO'), kg(33));
  // Con 2,5 elegido, la misma carga va de a 2,5.
  assert.equal(pasoDeLasCargas(2.5, 'BARRA', 33), 2.5);
  assert.deepEqual(cargaAtadaAlPorcentaje(33, kg(100), 'BARRA', 2.5), kg(32.5));
  // Automático en una máquina pesada: de a 5.
  assert.equal(pasoDeLasCargas('AUTO', 'MAQUINA', 120), 5);
});

test('carga → %: carga ÷ 1RM, redondeado a 0,5 %', () => {
  assert.equal(porcentajeDeLaCarga(kg(30), kg(101.5)), 29.5); // 29,56 %
  assert.equal(porcentajeDeLaCarga(kg(80), kg(100)), 80);
  assert.equal(porcentajeDeLaCarga(kg(76), kg(100)), 76);
  assert.equal(porcentajeDeLaCarga(kg(76.3), kg(100)), 76.5);
  assert.equal(porcentajeDeLaCarga(kg(76.2), kg(100)), 76);
});

test('sin 1RM (o en otra unidad), el % queda solo: no hay carga → % ni % → carga', () => {
  assert.equal(porcentajeDeLaCarga(kg(80), null), null);
  assert.equal(porcentajeDeLaCarga(kg(80), kg(0)), null);
  assert.equal(porcentajeDeLaCarga(kg(80), { value: 200, unit: 'lb' }), null);
  assert.equal(porcentajeDeLaCarga(null, kg(100)), null);
  assert.match(SIN_UNO_RM_PARA_LAS_CARGAS, /^Sin 1RM: cargalo para calcular las cargas/);
});

test('el redondeo del ejercicio: su excepción, si no el del plan, si no 2,5', () => {
  assert.equal(REDONDEO_POR_OMISION, 2.5);
  assert.equal(redondeoDelEjercicio(null, 'p1'), 2.5);
  assert.equal(redondeoDelEjercicio({ loadRounding: 1 }, 'p1'), 1);
  assert.equal(redondeoDelEjercicio({ loadRounding: 1, loadRoundingByExercise: [{ prescriptionId: 'p1', step: 5 }] }, 'p1'), 5);
  assert.equal(redondeoDelEjercicio({ loadRounding: 'AUTO', loadRoundingByExercise: [{ prescriptionId: 'p1', step: 5 }] }, 'p2'), 'AUTO');
});

test('el contrato: el redondeo es opcional, se poda con los ejercicios y pasa a la plantilla y de vuelta', () => {
  const base: PlanificacionDelPlan = { startDate: null, weeks: null, phases: [] };
  assert.ok(PlanificacionDelPlanSchema.safeParse(base).success, 'sin el campo, como antes');
  const con: PlanificacionDelPlan = { ...base, loadRounding: 'AUTO', loadRoundingByExercise: [{ prescriptionId: 'p1', step: 5 }, { prescriptionId: 'p9', step: 1 }] };
  assert.ok(PlanificacionDelPlanSchema.safeParse(con).success);
  assert.ok(!PlanificacionDelPlanSchema.safeParse({ ...base, loadRounding: 3 }).success, 'solo 1, 2,5, 5 o automático');
  const podada = planificacionPodada(con, [], ['p1']);
  assert.deepEqual(podada?.loadRoundingByExercise, [{ prescriptionId: 'p1', step: 5 }]);
  assert.equal(podada?.loadRounding, 'AUTO');
  // Solo el redondeo ya es una planificación (no se pierde al guardar).
  assert.deepEqual(planificacionPodada({ ...base, loadRounding: 5 }, [], []), { ...base, goal: null, loadRounding: 5 });
  const plantilla = planificacionParaLaPlantilla(podada);
  assert.ok(PlanificacionDeLaPlantillaSchema.safeParse(plantilla).success);
  assert.equal(plantilla?.loadRounding, 'AUTO');
  const estructura = { blocks: [{ blockId: 'b1', sessions: [{ sessionId: 's1', prescriptions: [{ prescriptionId: 'p1' }] }] }] };
  const delPlan = { blocks: [{ blockId: 'b9', sessions: [{ sessionId: 's9', prescriptions: [{ prescriptionId: 'p7' }] }] }] };
  const traida = planificacionDesdeLaPlantilla(plantilla, estructura as never, delPlan as never);
  assert.deepEqual(traida?.loadRoundingByExercise, [{ prescriptionId: 'p7', step: 5 }], 'la excepción sigue a su ejercicio');
});
