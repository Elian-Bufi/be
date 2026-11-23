/**
 * WP-EDITOR-ENTRENAMIENTO (DL-196) · la planificación del plan: las fases por semanas, el almanaque, las ventanas de la
 * agenda y las aproximaciones con su redondeo (`planificacion-del-plan.ts`). El plan de ejemplo empieza el lunes 30 de
 * noviembre de 2026: «Base», 4 semanas, con Torso el lunes y Piernas el jueves; «Fuerza», 3 semanas, con Cuerpo completo
 * el lunes y el viernes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fechasPrevistas, problemasDeAgenda } from './agenda-de-entrenamiento';
import type { AgendaDeEntrenamiento, PlanificacionDelPlan } from './contratos-entrenamiento';
import { PlanificacionDelPlanSchema } from './contratos-entrenamiento';
import {
  cargasDeAproximacion,
  fechasDeLasFases,
  finDelPlan,
  implementoDelEjercicio,
  mesDelAlmanaque,
  mesParaAbrir,
  otroMes,
  pasoPorOmision,
  planificacionPodada,
  porcentajesPara,
  redondearAlPaso,
  semanasHasta,
  semanasQueSumanLasFases,
  seriesDeAproximacion,
  sinLasAnotaciones,
  ventanasDeLasSesiones,
} from './planificacion-del-plan';

const FASES = [
  { blockId: 'base', sessions: [{ sessionId: 'torso' }, { sessionId: 'piernas' }] },
  { blockId: 'fuerza', sessions: [{ sessionId: 'completo' }] },
];
const PLAN: PlanificacionDelPlan = {
  startDate: '2026-11-30',
  weeks: 7,
  goal: 'Ganar fuerza en los básicos sin dolor de rodilla',
  phases: [
    { blockId: 'base', weeks: 4 },
    { blockId: 'fuerza', weeks: 3 },
  ],
  privateNotes: { plan: 'Ojo con la rodilla izquierda', phases: [{ blockId: 'fuerza', text: 'Bajar si duerme mal' }] },
};
const AGENDA: AgendaDeEntrenamiento = {
  startDate: '2026-11-30',
  sessions: [
    { sessionId: 'torso', weekdays: ['MONDAY'] },
    { sessionId: 'piernas', weekdays: ['THURSDAY'] },
    { sessionId: 'completo', weekdays: ['MONDAY', 'FRIDAY'] },
  ],
  moves: [],
};

test('TEST-EE-01 · el fin del plan sale del inicio y las semanas, y las semanas salen del fin', () => {
  assert.equal(finDelPlan('2026-11-30', 7), '2027-01-17');
  assert.equal(semanasHasta('2026-11-30', '2027-01-17'), 7);
  // Una semana incompleta cuenta como una más; un fin antes del inicio no es una duración.
  assert.equal(semanasHasta('2026-11-30', '2026-12-01'), 1);
  assert.equal(semanasHasta('2026-11-30', '2026-11-29'), null);
});

test('TEST-EE-02 · las fases van una detrás de otra por semanas; una sin semanas corta la cuenta', () => {
  const fechas = fechasDeLasFases(PLAN, FASES);
  assert.deepEqual(fechas, [
    { posicion: 0, blockId: 'base', desde: '2026-11-30', hasta: '2026-12-27', semanas: 4 },
    { posicion: 1, blockId: 'fuerza', desde: '2026-12-28', hasta: '2027-01-17', semanas: 3 },
  ]);
  assert.equal(semanasQueSumanLasFases(PLAN, FASES), 7);
  const sinSemanas = fechasDeLasFases({ ...PLAN, phases: [{ blockId: 'base', weeks: null }, { blockId: 'fuerza', weeks: 3 }] }, FASES);
  assert.deepEqual(sinSemanas, [null, null]);
  assert.deepEqual(fechasDeLasFases({ ...PLAN, startDate: null }, FASES), [null, null]);
});

test('TEST-EE-03 · cada sesión va solo en las semanas de su fase; sin fechas, todas las semanas como antes', () => {
  const ventanas = ventanasDeLasSesiones(PLAN, FASES);
  const previstas = fechasPrevistas(AGENDA, '2026-12-21', '2027-01-03', ventanas).map((p) => `${p.date} ${p.sessionId}`);
  assert.deepEqual(previstas, [
    '2026-12-21 torso',
    '2026-12-24 piernas',
    // Desde el 28, la fase «Fuerza»: torso y piernas ya no van.
    '2026-12-28 completo',
    '2027-01-01 completo',
  ]);
  const sinVentanas = fechasPrevistas(AGENDA, '2026-12-28', '2026-12-28').map((p) => p.sessionId);
  assert.deepEqual(sinVentanas, ['torso', 'completo']);
  // Un movimiento desde una fecha fuera de la fase de la sesión no parte de una fecha prevista.
  const conMovimiento: AgendaDeEntrenamiento = { ...AGENDA, moves: [{ sessionId: 'torso', from: '2026-12-28', to: '2026-12-29' }] };
  assert.deepEqual(problemasDeAgenda(conMovimiento, new Set(['torso', 'piernas', 'completo']), ventanas).map((p) => p.code), ['AGENDA_MOVE_NOT_PLANNED']);
});

test('TEST-EE-04 · el almanaque: semanas de lunes a domingo, pintadas por su fase, con las sesiones de cada día', () => {
  const fases = fechasDeLasFases(PLAN, FASES);
  const diciembre = mesDelAlmanaque('2026-12', fases, AGENDA, ventanasDeLasSesiones(PLAN, FASES), '2026-12-03');
  // Del lunes 30 de noviembre al domingo 3 de enero: cinco semanas.
  assert.equal(diciembre.length, 5);
  assert.equal(diciembre[0]!.dias[0]!.fecha, '2026-11-30');
  assert.equal(diciembre[0]!.dias[0]!.delMes, false);
  assert.equal(diciembre[4]!.dias[6]!.fecha, '2027-01-03');
  assert.deepEqual(
    diciembre.map((s) => s.fase),
    [0, 0, 0, 0, 1],
  );
  const jueves3 = diciembre[0]!.dias[3]!;
  assert.deepEqual(jueves3.sesiones, ['piernas']);
  assert.equal(jueves3.hoy, true);
  assert.deepEqual(diciembre[4]!.dias[0]!.sesiones, ['completo']);
  // Antes del plan, ningún día tiene fase.
  const noviembre = mesDelAlmanaque('2026-11', fases, AGENDA, new Map(), '2026-11-02');
  assert.equal(noviembre[0]!.fase, null);
  // Un plan que empieza un miércoles: la semana partida toma la fase que cubre más días.
  const miercoles = fechasDeLasFases({ ...PLAN, startDate: '2026-12-02', phases: [{ blockId: 'base', weeks: 1 }, { blockId: 'fuerza', weeks: 1 }] }, FASES);
  const semanas = mesDelAlmanaque('2026-12', miercoles, null, new Map(), '2026-12-01');
  assert.deepEqual(semanas.slice(0, 3).map((s) => s.fase), [0, 1, 1]);
});

test('TEST-EE-05 · las flechas del almanaque cambian de mes, también de año; abre en el mes de hoy si cae en el plan', () => {
  assert.equal(otroMes('2026-12', 1), '2027-01');
  assert.equal(otroMes('2027-01', -1), '2026-12');
  assert.equal(mesParaAbrir(PLAN, '2026-12-15'), '2026-12');
  assert.equal(mesParaAbrir(PLAN, '2026-10-15'), '2026-11');
  assert.equal(mesParaAbrir(null, '2026-10-15'), '2026-10');
});

test('TEST-EE-06 · el redondeo de las aproximaciones no deja decimales raros: múltiplo de 2,5, de 5 o de 1', () => {
  assert.equal(redondearAlPaso(41.3, 2.5), 42.5);
  assert.equal(redondearAlPaso(41.3, 5), 40);
  assert.equal(redondearAlPaso(7.6, 1), 8);
  assert.equal(redondearAlPaso(0.1 + 0.2, 0.1), 0.3);
  // 40/60/80 % de 100 kg con barra: 40, 60 y 80; las repeticiones bajan 8, 5 y 3.
  assert.deepEqual(cargasDeAproximacion(100, [40, 60, 80], 2.5), [40, 60, 80]);
  assert.deepEqual(
    seriesDeAproximacion(100, porcentajesPara(3), 2.5, 'kg').map((s) => `${s.repetitions.value}×${s.suggestedLoad.value}`),
    ['8×40', '5×60', '3×80'],
  );
  // 87,5 kg en máquina de a 5: 35, 55 (52,5 redondea hacia arriba) y 70; ninguna llega a la de trabajo.
  assert.deepEqual(cargasDeAproximacion(87.5, [40, 60, 80], 5), [35, 55, 70]);
  assert.deepEqual(cargasDeAproximacion(10, [90, 95], 5), [5, 5]);
  // Con una carga chica, no bajan de un paso ni bajan de una a la siguiente.
  assert.deepEqual(cargasDeAproximacion(4, [20, 40, 60], 1), [1, 2, 2]);
});

test('TEST-EE-07 · el paso por omisión sale del implemento: máquina 5, barra 2,5, mancuernas livianas 1', () => {
  assert.equal(implementoDelEjercicio('Press de pecho en máquina'), 'MAQUINA');
  assert.equal(implementoDelEjercicio('Jalón al pecho'), 'MAQUINA');
  assert.equal(implementoDelEjercicio('Sentadilla trasera'), 'BARRA');
  assert.equal(implementoDelEjercicio('Curl de bíceps con mancuernas'), 'MANCUERNA');
  assert.equal(implementoDelEjercicio('Remo inclinado', 'PER_IMPLEMENT'), 'MANCUERNA');
  assert.equal(implementoDelEjercicio('Dominadas'), 'OTRO');
  assert.equal(pasoPorOmision('MAQUINA', 60), 5);
  assert.equal(pasoPorOmision('BARRA', 100), 2.5);
  assert.equal(pasoPorOmision('MANCUERNA', 8), 1);
  assert.equal(pasoPorOmision('MANCUERNA', 22), 2.5);
  assert.equal(pasoPorOmision('MAQUINA', 100, 'lb'), 10);
  assert.equal(pasoPorOmision('BARRA', 135, 'lb'), 5);
});

test('TEST-EE-08 · la planificación se poda con la estructura y las anotaciones no salen para nadie más', () => {
  const conAproximaciones: PlanificacionDelPlan = { ...PLAN, warmUps: [{ prescriptionId: 'p1', mode: 'PERCENT', percents: [40, 60, 80], step: 2.5 }] };
  const podada = planificacionPodada(conAproximaciones, ['base'], []);
  assert.deepEqual(podada?.phases, [{ blockId: 'base', weeks: 4 }]);
  assert.equal(podada?.warmUps, undefined);
  assert.deepEqual(podada?.privateNotes, { plan: 'Ojo con la rodilla izquierda', phases: [] });
  assert.equal(planificacionPodada({ startDate: null, weeks: null, goal: '  ', phases: [] }, [], []), null);
  assert.equal(sinLasAnotaciones(PLAN)?.privateNotes, undefined);
  assert.equal(sinLasAnotaciones(PLAN)?.goal, PLAN.goal);
});

test('TEST-EE-09 · el contrato: semanas enteras de 1 a 52 por fase, aproximaciones con un paso sin decimales raros', () => {
  assert.equal(PlanificacionDelPlanSchema.safeParse(PLAN).success, true);
  assert.equal(PlanificacionDelPlanSchema.safeParse({ ...PLAN, phases: [{ blockId: 'base', weeks: 0 }] }).success, false);
  assert.equal(PlanificacionDelPlanSchema.safeParse({ ...PLAN, phases: [{ blockId: 'base', weeks: 2.5 }] }).success, false);
  assert.equal(PlanificacionDelPlanSchema.safeParse({ ...PLAN, warmUps: [{ prescriptionId: 'p1', mode: 'PERCENT', percents: [40], step: 1.25 }] }).success, false);
  assert.equal(PlanificacionDelPlanSchema.safeParse({ ...PLAN, extra: true }).success, false);
});
