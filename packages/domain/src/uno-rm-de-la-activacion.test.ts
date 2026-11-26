/**
 * Tanda 8 (ET2-D18, ratificada el 2026-11-26 con un matiz) · el 1RM de las cargas en % RM: en el borrador sigue al 1RM
 * (también en los ejercicios plegados); al activar queda congelado; la versión siguiente toma el vigente y avisa.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cambiosDesdeLaActivacion,
  cargasConElUnoRM,
  conElUnoRMDeLaActivacion,
  COPY_UNO_RM_DE_LA_ACTIVACION,
  sinElUnoRMDeLaActivacion,
  unoRMDeLaActivacion,
  unoRMDeLaActivacionEnUnRenglon,
  type PrescripcionConElUnoRM,
} from './uno-rm-de-la-activacion';
import { PlanificacionDelPlanSchema, type PlanificacionDelPlan } from './contratos-entrenamiento';
import { planificacionPodada } from './planificacion-del-plan';
import type { UnoRMVigente } from './repeticion-maxima';

const kg = (value: number) => ({ value, unit: 'kg' as const });
const vigente = (value: number, fecha = '2026-11-20'): UnoRMVigente => ({ origen: 'CALIBRATION', valor: kg(value), fecha, banda: 'CORE', serie: null, entryId: 'e1' });
const enPct = (prescriptionId: string, exerciseVersionId: string, pct: number, carga: number | null): PrescripcionConElUnoRM => ({
  prescriptionId,
  exerciseVersionId,
  intensity: { criterion: 'PERCENT_RM', target: { value: pct } },
  suggestedLoad: carga === null ? null : kg(carga),
});
// Dos sesiones: la primera abierta en el editor, la segunda plegada (para el dominio son iguales: todo el borrador).
const borrador = (cargaDeLaSentadilla: number) => [
  {
    sessions: [
      { prescriptions: [enPct('p1', 'v-sentadilla', 75, cargaDeLaSentadilla), { prescriptionId: 'p2', exerciseVersionId: 'v-remo', intensity: { criterion: 'RIR', target: { value: 2 } }, suggestedLoad: kg(40) }] },
    ],
    microcycles: [{ sessions: [{ prescriptions: [enPct('p3', 'v-press', 70, 70)] }] }],
  },
];
const ejercicioDe = (v: string) => ({ 'v-sentadilla': 'sentadilla', 'v-remo': 'remo', 'v-press': 'press' })[v] ?? null;

test('borrador: el 1RM cambia y se recalculan todas las cargas en % RM, también las de los ejercicios plegados', () => {
  const unoRM = new Map([['sentadilla', kg(140)], ['press', kg(105)]]);
  const r = cargasConElUnoRM(borrador(75), (p) => unoRM.get(ejercicioDe(p.exerciseVersionId) ?? '') ?? null, () => 'BARRA', () => 2.5);
  // Sentadilla: 140 × 75 % = 105 kg; press (en el microciclo, plegado): 105 × 70 % = 73,5 → 72,5 kg de a 2,5.
  assert.deepEqual(r.bloques[0]!.sessions![0]!.prescriptions[0]!.suggestedLoad, kg(105));
  assert.deepEqual(r.bloques[0]!.microcycles![0]!.sessions[0]!.prescriptions[0]!.suggestedLoad, kg(72.5));
  // El de RIR no se toca.
  assert.deepEqual(r.bloques[0]!.sessions![0]!.prescriptions[1]!.suggestedLoad, kg(40));
  assert.equal(r.cuantas, 2);
  assert.equal(COPY_UNO_RM_DE_LA_ACTIVACION.recalculadas(r.cuantas), 'Se recalcularon 2 cargas con el 1RM nuevo.');
  // Si ya están al día, no cuenta nada (no hay cambio que deshacer).
  assert.equal(cargasConElUnoRM(r.bloques, (p) => unoRM.get(ejercicioDe(p.exerciseVersionId) ?? '') ?? null, () => 'BARRA', () => 2.5).cuantas, 0);
});

test('activa: el 1RM queda congelado al activar, y un 1RM nuevo no cambia lo congelado ni las cargas', () => {
  const congelados = unoRMDeLaActivacion(borrador(75), ejercicioDe, new Map([['sentadilla', vigente(101.5)], ['press', null], ['remo', vigente(80)]]), '2026-11-26');
  // Solo los ejercicios en % RM con 1RM: la sentadilla (el press no tiene 1RM; el remo va en RIR).
  assert.deepEqual(congelados, [{ prescriptionId: 'p1', exerciseId: 'sentadilla', value: kg(101.5), origin: 'CALIBRATION', localDate: '2026-11-20', activatedOn: '2026-11-26' }]);
  const base: PlanificacionDelPlan = { startDate: null, weeks: 8, phases: [] };
  const planning = conElUnoRMDeLaActivacion(base, congelados)!;
  assert.ok(PlanificacionDelPlanSchema.safeParse(planning).success, 'el contrato lo acepta, opcional');
  assert.ok(PlanificacionDelPlanSchema.safeParse(base).success, 'sin el campo, como antes');
  assert.equal(unoRMDeLaActivacionEnUnRenglon(planning.oneRepMaxAtActivation![0]!), '1RM 101,5 kg · el de la activación (26 nov)');
  // Un 1RM posterior (105 kg) no toca lo congelado ni las cargas guardadas: la versión activa es una instantánea.
  const instantanea = JSON.parse(JSON.stringify({ planning, blocks: borrador(75) }));
  assert.deepEqual(cambiosDesdeLaActivacion(planning.oneRepMaxAtActivation, new Map([['sentadilla', vigente(105, '2026-12-01')]]))[0]?.despues, kg(105), 'el nuevo se ve como cambio, para la versión siguiente');
  assert.deepEqual(instantanea.planning.oneRepMaxAtActivation[0].value, kg(101.5));
  assert.deepEqual(instantanea.blocks[0].sessions[0].prescriptions[0].suggestedLoad, kg(75));
  // Se poda con los ejercicios, como lo demás de la planificación.
  assert.equal(planificacionPodada(planning, [], ['p9'])?.oneRepMaxAtActivation, undefined);
  assert.equal(conElUnoRMDeLaActivacion(planning, [])!.oneRepMaxAtActivation, undefined, 'sin ejercicios en % RM, sin el campo');
});

test('versión nueva: toma el 1RM vigente, avisa qué cambió y recalcula', () => {
  const congelados = [{ prescriptionId: 'p1', exerciseId: 'sentadilla', value: kg(100), origin: 'CALIBRATION' as const, localDate: '2026-11-20', activatedOn: '2026-11-26' }];
  const vigentes = new Map([['sentadilla', vigente(105, '2026-12-01')]]);
  const cambios = cambiosDesdeLaActivacion(congelados, vigentes);
  assert.deepEqual(cambios, [{ exerciseId: 'sentadilla', antes: kg(100), despues: kg(105) }]);
  assert.equal(COPY_UNO_RM_DE_LA_ACTIVACION.cambio('Sentadilla', cambios[0]!), 'El 1RM de Sentadilla cambió de 100 a 105 kg: las cargas se recalcularon.');
  const r = cargasConElUnoRM(borrador(75), (p) => (ejercicioDe(p.exerciseVersionId) === 'sentadilla' ? kg(105) : null), () => 'BARRA', () => 2.5);
  // 105 × 75 % = 78,75 → 80 kg de a 2,5.
  assert.deepEqual(r.bloques[0]!.sessions![0]!.prescriptions[0]!.suggestedLoad, kg(80));
  // Con el mismo 1RM, nada que avisar; el borrador deja de llevar el de la activación anterior.
  assert.deepEqual(cambiosDesdeLaActivacion(congelados, new Map([['sentadilla', vigente(100)]])), []);
  assert.equal(sinElUnoRMDeLaActivacion({ startDate: null, weeks: null, phases: [], oneRepMaxAtActivation: congelados }).oneRepMaxAtActivation, undefined);
});
