/**
 * WP-EDITOR-ENTRENAMIENTO parte B (DL-196) · las progresiones y las descargas (`progresiones.ts`), la carga para N
 * repeticiones (`carga-desde-la-estimacion.ts`) y el contrato de la planificación con progresiones y favoritos:
 * TEST-EE-30 a TEST-EE-37.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargaParaRepeticiones } from './carga-desde-la-estimacion';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { PlanificacionDelPlanSchema, type PlanificacionDelPlan, type ProgresionDeLaFase } from './contratos-entrenamiento';
import { planificacionPodada } from './planificacion-del-plan';
import {
  conProgresion,
  COPY_PROGRESIONES,
  maximoPorSemana,
  progresionDeLaFase,
  progresionEnPalabras,
  progresionParaOtraFase,
  progresionPorOmision,
  seAplicaA,
  semanaDeLaFecha,
  semanasDelEjercicio,
  sinProgresion,
  type BaseDelEjercicio,
} from './progresiones';

const sentadilla: BaseDelEjercicio = { carga: 80, unidad: 'kg', repeticiones: 6, series: 4, paso: 2.5 };
const regla = (p: Partial<ProgresionDeLaFase>): ProgresionDeLaFase => ({ ...progresionPorOmision('fase-1', null, 2.5), ...p });

test('TEST-EE-30 · lineal: +2,5 kg por semana, y las repeticiones si se pide', () => {
  const s = semanasDelEjercicio(regla({ model: 'LINEAR', loadStep: 2.5, repStep: 0 }), sentadilla, 4);
  assert.deepEqual(s.map((x) => x.carga), [80, 82.5, 85, 87.5]);
  assert.deepEqual(s.map((x) => x.repeticiones), [6, 6, 6, 6]);
  const conReps = semanasDelEjercicio(regla({ model: 'LINEAR', loadStep: 0, repStep: 1 }), sentadilla, 3);
  assert.deepEqual(conReps.map((x) => [x.carga, x.repeticiones]), [[80, 6], [80, 7], [80, 8]]);
  // Sin carga de trabajo, no se inventa: la carga queda vacía y las repeticiones siguen la regla.
  const sinCarga = semanasDelEjercicio(regla({ model: 'LINEAR', loadStep: 2.5, repStep: 1 }), { ...sentadilla, carga: null }, 2);
  assert.deepEqual(sinCarga.map((x) => [x.carga, x.repeticiones]), [[null, 6], [null, 7]]);
});

test('TEST-EE-31 · doble progresión: primero las repeticiones del rango, después la carga', () => {
  const banca: BaseDelEjercicio = { carga: 60, unidad: 'kg', repeticiones: 8, series: 3, paso: 2.5 };
  const s = semanasDelEjercicio(regla({ model: 'DOUBLE', repRange: { min: 8, max: 12 }, loadStep: 2.5 }), banca, 7);
  assert.deepEqual(s.map((x) => x.repeticiones), [8, 9, 10, 11, 12, 8, 9]);
  assert.deepEqual(s.map((x) => x.carga), [60, 60, 60, 60, 60, 62.5, 62.5]);
});

test('TEST-EE-32 · ondulante: pesada, liviana y media, redondeadas al paso del implemento', () => {
  const s = semanasDelEjercicio(regla({ model: 'UNDULATING', waves: [100, 80, 90] }), { ...sentadilla, carga: 87.5 }, 4);
  assert.deepEqual(s.map((x) => x.ola), ['PESADA', 'LIVIANA', 'MEDIA', 'PESADA']);
  // 87,5 × 0,8 = 70; 87,5 × 0,9 = 78,75 → 80 (de a 2,5: nunca decimales raros).
  assert.deepEqual(s.map((x) => x.carga), [87.5, 70, 80, 87.5]);
  const maquina = semanasDelEjercicio(regla({ model: 'UNDULATING', waves: [100, 80, 90] }), { ...sentadilla, carga: 47, paso: 5 }, 3);
  assert.ok(maquina.every((x) => (x.carga ?? 0) % 5 === 0), JSON.stringify(maquina));
});

test('TEST-EE-33 · la descarga: un escalón en la semana elegida y la progresión retoma donde quedó', () => {
  const lineal = regla({ model: 'LINEAR', loadStep: 2.5, repStep: 0, deload: { week: 4, mode: 'LOAD', workingLoadShare: 60, setsRemoved: 2 } });
  const s = semanasDelEjercicio(lineal, sentadilla, 6);
  // 85 × 0,6 = 51 → 50 (de a 2,5); después, 87,5 (la semana 4 del modelo) y 90.
  assert.deepEqual(s.map((x) => x.carga), [80, 82.5, 85, 50, 87.5, 90]);
  assert.deepEqual(s.map((x) => x.descarga), [false, false, false, true, false, false]);
  const porSeries = semanasDelEjercicio(regla({ model: null, deload: { week: 2, mode: 'SETS', workingLoadShare: 60, setsRemoved: 2 } }), sentadilla, 3);
  assert.deepEqual(porSeries.map((x) => [x.carga, x.series]), [[80, 4], [80, 2], [80, 4]]);
  // Nunca menos de una serie; una descarga fuera de la fase no se aplica.
  assert.equal(semanasDelEjercicio(regla({ deload: { week: 1, mode: 'SETS', workingLoadShare: 60, setsRemoved: 9 } }), sentadilla, 2)[0]!.series, 1);
  assert.ok(semanasDelEjercicio(regla({ deload: { week: 8, mode: 'LOAD', workingLoadShare: 60, setsRemoved: 1 } }), sentadilla, 4).every((x) => !x.descarga));
  // Descarga en la semana 1: la base es la carga de trabajo.
  assert.equal(semanasDelEjercicio(regla({ deload: { week: 1, mode: 'LOAD', workingLoadShare: 50, setsRemoved: 1 } }), sentadilla, 1)[0]!.carga, 40);
  // Sin series efectivas, la descarga por series no inventa una.
  assert.equal(semanasDelEjercicio(regla({ deload: { week: 1, mode: 'SETS', workingLoadShare: 60, setsRemoved: 2 } }), { ...sentadilla, series: 0 }, 1)[0]!.series, 0);
});

test('TEST-EE-33b · cargas chicas: ni la descarga ni la ondulante dejan una carga en 0', () => {
  // Una mancuerna de 1 kg (paso 1): 40 % son 0,4 kg, que al paso daría 0. Queda en un paso, sin pasar la carga de trabajo.
  const liviana: BaseDelEjercicio = { carga: 1, unidad: 'kg', repeticiones: 15, series: 3, paso: 1 };
  const ola = semanasDelEjercicio(regla({ model: 'UNDULATING', waves: [100, 40, 40] }), liviana, 3);
  assert.deepEqual(ola.map((x) => x.carga), [1, 1, 1]);
  const descarga = semanasDelEjercicio(regla({ deload: { week: 2, mode: 'LOAD', workingLoadShare: 40, setsRemoved: 1 } }), { ...liviana, carga: 2.5, paso: 2.5 }, 2);
  assert.ok(descarga.every((x) => (x.carga ?? 0) > 0), JSON.stringify(descarga));
  assert.ok(descarga.every((x) => (x.carga ?? 0) <= 2.5), JSON.stringify(descarga));
  // En libras, lo mismo.
  const enLibras = semanasDelEjercicio(regla({ model: 'UNDULATING', waves: [100, 40, 90] }), { carga: 2.5, unidad: 'lb', repeticiones: 12, series: 2, paso: 5 }, 3);
  assert.ok(enLibras.every((x) => (x.carga ?? 0) > 0), JSON.stringify(enLibras));
});

test('TEST-EE-34 · a qué se aplica, guardar, quitar y llevarla a la copia de la fase', () => {
  const toda = regla({ model: 'LINEAR' });
  assert.ok(seAplicaA(toda, 'p1'));
  const elegidos = regla({ model: 'LINEAR', prescriptionIds: ['p1'] });
  assert.ok(seAplicaA(elegidos, 'p1'));
  assert.ok(!seAplicaA(elegidos, 'p2'));
  const plan: PlanificacionDelPlan = { startDate: null, weeks: null, goal: null, phases: [] };
  const con = conProgresion(conProgresion(plan, toda), { ...elegidos, blockId: 'fase-1' });
  // DL-201: la de la fase y la propia de p1 conviven; la de la fase es la general.
  assert.equal(con.progressions?.length, 2, 'la de la fase y la propia');
  assert.equal(progresionDeLaFase(con, 'fase-1')?.prescriptionIds, null);
  assert.equal(sinProgresion(con, 'fase-1').progressions, undefined);
  const copia = progresionParaOtraFase(elegidos, 'fase-2', new Map([['p1', 'q1']]));
  assert.deepEqual([copia.blockId, copia.prescriptionIds], ['fase-2', ['q1']]);
  assert.equal(progresionParaOtraFase(elegidos, 'fase-2').prescriptionIds, null);
});

test('TEST-EE-35 · el contrato y la poda: progresiones y favoritos de lo que sigue en el plan', () => {
  const p: PlanificacionDelPlan = {
    startDate: '2026-11-30',
    weeks: 8,
    goal: null,
    phases: [{ blockId: 'f1', weeks: 4 }],
    progressions: [regla({ blockId: 'f1', model: 'LINEAR', prescriptionIds: ['p1', 'p9'] }), regla({ blockId: 'f9', model: 'LINEAR' }), regla({ blockId: 'f1', model: null, prescriptionIds: ['p8'] })],
    favoriteCharts: [
      { kind: 'EXERCISE_LOAD', id: 'p1' },
      { kind: 'EXERCISE_LOAD', id: 'p9' },
      { kind: 'PHASE_DISTRIBUTION', id: 'f1' },
      { kind: 'PHASE_PROGRESSION', id: 'f9' },
    ],
  };
  assert.ok(PlanificacionDelPlanSchema.safeParse(p).success);
  const podada = planificacionPodada(p, ['f1'], ['p1']);
  assert.deepEqual(podada?.progressions?.map((x) => [x.blockId, x.prescriptionIds]), [['f1', ['p1']]]);
  assert.deepEqual(podada?.favoriteCharts, [{ kind: 'EXERCISE_LOAD', id: 'p1' }, { kind: 'PHASE_DISTRIBUTION', id: 'f1' }]);
  // Mal formadas: un rango al revés, una descarga de más del 95 %, una ondulante de dos semanas.
  for (const mala of [regla({ repRange: { min: 12, max: 8 } }), regla({ deload: { week: 2, mode: 'LOAD', workingLoadShare: 100, setsRemoved: 1 } }), { ...regla({}), waves: [100, 80] }]) {
    assert.equal(PlanificacionDelPlanSchema.safeParse({ ...p, progressions: [mala] }).success, false, JSON.stringify(mala));
  }
  // Solo progresiones: la planificación no queda vacía.
  assert.notEqual(planificacionPodada({ startDate: null, weeks: null, goal: null, phases: [], progressions: [regla({ blockId: 'f1' })] }, ['f1'], []), null);
});

test('TEST-EE-36 · la carga para N repeticiones: la cuenta a la vista y los límites del método', () => {
  const r = cargaParaRepeticiones(100, 'kg', 8, 2);
  assert.ok(r.hay);
  // 100 × 30 / 40 = 75.
  assert.equal(r.carga, 75);
  assert.equal(r.cuenta, '≈ 100 kg × 30 ÷ (30 + 8 + 2) = 75 kg → 75 kg');
  assert.equal(r.orientativa, false);
  const orientativa = cargaParaRepeticiones(100, 'kg', 10, 1);
  assert.ok(orientativa.hay && orientativa.orientativa);
  // 100 × 30 / 41 = 73,17 → 72,5 (hacia abajo).
  assert.equal(orientativa.hay && orientativa.carga, 72.5);
  assert.deepEqual(cargaParaRepeticiones(100, 'kg', 12, 1), { hay: false, motivo: 'FUERA_DE_LOS_LIMITES' });
  assert.deepEqual(cargaParaRepeticiones(100, 'kg', 0, 1), { hay: false, motivo: 'DATOS_INVALIDOS' });
  // DL-171 (R3): RIR de 0 a 2. 5 repeticiones con RIR 3 suman 8 equivalentes, pero el método no estima con ese RIR.
  assert.deepEqual(cargaParaRepeticiones(100, 'kg', 5, 3), { hay: false, motivo: 'FUERA_DE_LOS_LIMITES' });
  assert.deepEqual(cargaParaRepeticiones(100, 'kg', 5, 2.5), { hay: false, motivo: 'FUERA_DE_LOS_LIMITES' });
  assert.ok(cargaParaRepeticiones(100, 'kg', 5, 2).hay);
  const una = cargaParaRepeticiones(101, 'kg', 1, 0);
  assert.ok(una.hay && una.carga === 100);
  const enLibras = cargaParaRepeticiones(225, 'lb', 5, 2);
  assert.ok(enLibras.hay && enLibras.unidad === 'lb' && enLibras.carga % 5 === 0);
});

test('TEST-EE-37 · las semanas en el calendario y los textos', () => {
  const fase = { desde: '2026-11-30', hasta: '2026-12-27', semanas: 4 };
  assert.equal(semanaDeLaFecha(fase, '2026-11-30'), 1);
  assert.equal(semanaDeLaFecha(fase, '2026-12-07'), 2);
  assert.equal(semanaDeLaFecha(fase, '2026-12-27'), 4);
  assert.equal(semanaDeLaFecha(fase, '2026-12-28'), null);
  assert.deepEqual(
    maximoPorSemana(fase, [
      { fecha: '2026-12-01', valor: 80 },
      { fecha: '2026-12-03', valor: 82.5 },
      { fecha: '2026-12-15', valor: 85 },
    ]),
    [82.5, null, 85, null],
  );
  assert.equal(progresionEnPalabras(regla({ model: 'LINEAR', loadStep: 2.5, repStep: 0, deload: { week: 4, mode: 'LOAD', workingLoadShare: 60, setsRemoved: 2 } }), 'kg'), 'Lineal: +2,5 kg por semana · descarga en la semana 4 (60 % de la carga de trabajo)');
  const textos = [
    ...Object.values(COPY_PROGRESIONES).flatMap((v) => (typeof v === 'string' ? [v] : typeof v === 'function' ? [(v as (...a: unknown[]) => string)(3, 4)] : Object.values(v))),
    progresionEnPalabras(regla({ model: 'UNDULATING', waves: [100, 80, 90] }), 'kg'),
    progresionEnPalabras(regla({ model: 'DOUBLE', repRange: { min: 8, max: 12 }, loadStep: 2.5 }), 'kg'),
  ];
  for (const t of textos) assert.deepEqual(terminosProhibidosDeEntrenamientoEn(String(t)), [], String(t));
});
