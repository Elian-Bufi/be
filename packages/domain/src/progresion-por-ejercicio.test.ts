/**
 * DL-201 (WP-PROGRESION-POR-EJERCICIO) · la progresión por ejercicio, con el patrón de la intensidad (ET1-D11): la regla de
 * la fase la hereda cada ejercicio; una regla propia la pisa; un ejercicio lleva como mucho una propia. TEST-PE-01 a
 * TEST-PE-07.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bloquesDeLaSemana, esSemanaDeDescarga, prescripcionDeLaSemana, reglaQueRige, semanaDeLaFase, type SemanaDeLaFase } from './carga-de-la-semana';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { MAXIMO_DE_PROGRESIONES, PlanificacionDelPlanSchema, type PlanificacionDelPlan, type ProgresionDeLaFase } from './contratos-entrenamiento';
import { PlanificacionDeLaPlantillaSchema } from './contratos-plantillas';
import { planificacionDesdeLaPlantilla, planificacionParaLaPlantilla } from './planificacion-de-la-plantilla';
import {
  cambiaAlgo,
  conProgresion,
  COPY_PROGRESIONES,
  progresionCorta,
  progresionDeLaFase,
  progresionDelEjercicio,
  reglaPropiaDe,
  reglasPropias,
  reglasPropiasParaLaCopia,
  sinLaProgresion,
  sinReglaPropia,
} from './progresiones';

const kg = (value: number) => ({ value, unit: 'kg' as const });
const regla = (p: Partial<ProgresionDeLaFase>): ProgresionDeLaFase => ({ blockId: 'f1', model: 'LINEAR', loadStep: 2.5, repStep: 0, repRange: null, waves: null, deload: null, prescriptionIds: null, ...p });
const sinModelo = (ids: string[]): ProgresionDeLaFase => regla({ model: null, loadStep: null, repStep: null, prescriptionIds: ids });
const base: PlanificacionDelPlan = { startDate: '2026-11-30', weeks: 8, goal: null, phases: [{ blockId: 'f1', weeks: 6 }] };

test('TEST-PE-01 · precedencia: la propia; si no, la de la fase; si no, ninguna', () => {
  const plan: PlanificacionDelPlan = {
    ...base,
    progressions: [regla({}), regla({ loadStep: 5, prescriptionIds: ['banca'] }), sinModelo(['curl'])],
  };
  assert.deepEqual(progresionDelEjercicio(plan, 'f1', 'banca').origen, 'PROPIA');
  assert.equal(progresionDelEjercicio(plan, 'f1', 'banca').regla?.loadStep, 5);
  assert.equal(progresionDelEjercicio(plan, 'f1', 'sentadilla').origen, 'FASE');
  assert.equal(progresionDelEjercicio(plan, 'f1', 'sentadilla').regla?.loadStep, 2.5);
  // «Sin progresión» para ese ejercicio, aunque la fase tenga una: rige y no cambia nada.
  assert.equal(progresionDelEjercicio(plan, 'f1', 'curl').origen, 'PROPIA');
  assert.equal(cambiaAlgo(progresionDelEjercicio(plan, 'f1', 'curl').regla), false);
  assert.equal(progresionDelEjercicio({ ...base }, 'f1', 'banca').origen, 'NINGUNA');
  // Sin regla de la fase, el que no tiene una propia queda sin progresión.
  const soloPropias: PlanificacionDelPlan = { ...base, progressions: [regla({ prescriptionIds: ['banca'] })] };
  assert.equal(progresionDelEjercicio(soloPropias, 'f1', 'sentadilla').origen, 'NINGUNA');
  assert.equal(progresionDeLaFase(soloPropias, 'f1'), null);
  assert.equal(reglasPropias(plan, 'f1').length, 2);
});

test('TEST-PE-02 · el contrato rechaza que se pisen: dos de la fase, o un ejercicio en dos propias', () => {
  const ok: PlanificacionDelPlan = { ...base, progressions: [regla({}), regla({ prescriptionIds: ['a', 'b'] }), sinModelo(['c'])] };
  assert.ok(PlanificacionDelPlanSchema.safeParse(ok).success);
  // La plantilla toma el mismo arreglo (con `pick`), con el mismo refinamiento.
  assert.ok(PlanificacionDeLaPlantillaSchema.safeParse({ weeks: 8, phases: [], progressions: ok.progressions }).success);
  const dosDeLaFase = PlanificacionDelPlanSchema.safeParse({ ...base, progressions: [regla({}), regla({ loadStep: 5 })] });
  assert.equal(dosDeLaFase.success, false);
  assert.match(dosDeLaFase.error!.issues[0]!.message, /una sola regla general/);
  const pisadas = PlanificacionDelPlanSchema.safeParse({ ...base, progressions: [regla({ prescriptionIds: ['a', 'b'] }), sinModelo(['b'])] });
  assert.equal(pisadas.success, false);
  assert.match(pisadas.error!.issues[0]!.message, /ya tiene una progresión propia/);
  assert.deepEqual(pisadas.error!.issues[0]!.path, ['progressions', 1, 'prescriptionIds', 0]);
  assert.equal(PlanificacionDelPlanSchema.safeParse({ ...base, progressions: [regla({ prescriptionIds: ['a', 'a'] })] }).success, false, 'repetido en la misma');
  // La clave es la fase y el ejercicio: la regla que quedó en otra fase (un ejercicio movido) no traba.
  assert.ok(PlanificacionDelPlanSchema.safeParse({ ...base, progressions: [regla({ prescriptionIds: ['a'] }), regla({ blockId: 'f2', prescriptionIds: ['a'] })] }).success);
  assert.equal(plantillaRechazaPisadas(), true);
  // Hasta 200 reglas (antes 12): una por ejercicio en un plan grande.
  const muchas = Array.from({ length: MAXIMO_DE_PROGRESIONES }, (_, n) => regla({ prescriptionIds: [`p${n}`] }));
  assert.ok(PlanificacionDelPlanSchema.safeParse({ ...base, progressions: muchas }).success);
  assert.equal(PlanificacionDelPlanSchema.safeParse({ ...base, progressions: [...muchas, regla({ prescriptionIds: ['otra'] })] }).success, false);
  // Los mensajes no usan palabras que no van en pantalla.
  for (const i of [...dosDeLaFase.error!.issues, ...pisadas.error!.issues]) assert.deepEqual(terminosProhibidosDeEntrenamientoEn(i.message), [], i.message);
});

function plantillaRechazaPisadas(): boolean {
  return !PlanificacionDeLaPlantillaSchema.safeParse({ weeks: 8, phases: [], progressions: [regla({ prescriptionIds: ['a'] }), regla({ prescriptionIds: ['a'] })] }).success;
}

test('TEST-PE-03 · aplicar y quitar sin pisarse: una propia saca a sus ejercicios de la otra', () => {
  let plan = conProgresion(base, regla({}));
  plan = conProgresion(plan, regla({ loadStep: 5, prescriptionIds: ['a', 'b'] }));
  plan = conProgresion(plan, sinModelo(['b', 'c']));
  assert.deepEqual(reglaPropiaDe(plan, 'f1', 'a')?.prescriptionIds, ['a']);
  assert.deepEqual(reglaPropiaDe(plan, 'f1', 'b')?.prescriptionIds, ['b', 'c']);
  assert.ok(PlanificacionDelPlanSchema.safeParse(plan).success);
  // Editar la propia de [b, c] para que sea de [c] solo: se reemplaza, y b vuelve a la de la fase.
  const editada = reglaPropiaDe(plan, 'f1', 'b')!;
  const otra = conProgresion(plan, { ...editada, prescriptionIds: ['c'] }, editada);
  assert.equal(reglaPropiaDe(otra, 'f1', 'b'), null);
  assert.equal(progresionDelEjercicio(otra, 'f1', 'b').origen, 'FASE');
  // La de la fase reemplaza a la de la fase y deja las propias.
  const nueva = conProgresion(plan, regla({ model: 'UNDULATING', loadStep: null, waves: [100, 80, 90] }));
  assert.equal(progresionDeLaFase(nueva, 'f1')?.model, 'UNDULATING');
  assert.equal(reglasPropias(nueva, 'f1').length, 2);
  // «Usar la de la fase» y quitar la de la fase.
  assert.equal(reglaPropiaDe(sinReglaPropia(plan, ['a']), 'f1', 'a'), null);
  assert.equal(reglasPropias(sinReglaPropia(plan, ['a']), 'f1').length, 1, 'la que quedó vacía se va');
  const sinFase = sinLaProgresion(plan, progresionDeLaFase(plan, 'f1')!);
  assert.equal(progresionDeLaFase(sinFase, 'f1'), null);
  assert.equal(reglasPropias(sinFase, 'f1').length, 2);
  assert.equal(sinReglaPropia(sinLaProgresion(base, regla({})), ['x']).progressions, undefined);
});

test('TEST-PE-04 · la carga de la semana por ejercicio: cada uno con la regla que lo rige', () => {
  const presc = (id: string) => ({ prescriptionId: id, suggestedLoad: kg(80), sets: [{ repetitions: { value: 6 } }, { repetitions: { value: 6 } }] });
  const s: SemanaDeLaFase = {
    progresion: regla({}),
    propias: [regla({ loadStep: 5, prescriptionIds: ['banca'] }), sinModelo(['curl'])],
    semana: 3,
    semanas: 6,
  };
  assert.deepEqual(prescripcionDeLaSemana(presc('sentadilla'), s, 'Sentadilla trasera con barra', null).suggestedLoad, kg(85));
  assert.deepEqual(prescripcionDeLaSemana(presc('banca'), s, 'Press de banca plano con barra', null).suggestedLoad, kg(90));
  const curl = presc('curl');
  assert.equal(prescripcionDeLaSemana(curl, s, 'Curl de bíceps con barra', null), curl, '«Sin progresión»: la misma');
  assert.equal(reglaQueRige(s, 'banca')?.loadStep, 5);
  assert.equal(reglaQueRige({ progresion: null, propias: s.propias }, 'sentadilla'), null);

  // Por la fecha, desde la planificación: semanaDeLaFase trae la de la fase y las propias.
  const plan: PlanificacionDelPlan = { ...base, progressions: [regla({ prescriptionIds: ['banca'] })] };
  const bloques = [{ blockId: 'f1', sessions: [{ sessionId: 's1', prescriptions: [presc('sentadilla'), presc('banca')] }], microcycles: [] }];
  const laSemana = semanaDeLaFase(plan, bloques, 'f1', '2026-12-14')!;
  assert.equal(laSemana.progresion, null);
  assert.equal(laSemana.propias?.length, 1);
  const enLaSemana3 = bloquesDeLaSemana(bloques, plan, '2026-12-14', () => 'Press de banca plano con barra');
  assert.deepEqual(enLaSemana3[0]!.sessions[0]!.prescriptions.map((p) => p.suggestedLoad), [kg(80), kg(85)]);
});

test('TEST-PE-05 · la descarga de la sesión: si a alguno de sus ejercicios le toca', () => {
  const s: SemanaDeLaFase = {
    progresion: regla({}),
    propias: [regla({ prescriptionIds: ['banca'], deload: { week: 4, mode: 'LOAD', workingLoadShare: 60, setsRemoved: 2 } })],
    semana: 4,
    semanas: 6,
  };
  assert.equal(esSemanaDeDescarga(s), true, 'alguna regla de la fase');
  assert.equal(esSemanaDeDescarga(s, ['sentadilla']), false, 'la sesión sin banca no descarga');
  assert.equal(esSemanaDeDescarga(s, ['sentadilla', 'banca']), true);
  assert.equal(esSemanaDeDescarga({ ...s, semana: 3 }, ['banca']), false);
});

test('TEST-PE-06 · duplicar la fase y las plantillas llevan las reglas propias, con los ejercicios nuevos', () => {
  const plan: PlanificacionDelPlan = { ...base, progressions: [regla({}), regla({ loadStep: 5, prescriptionIds: ['a', 'b'] }), sinModelo(['c']), regla({ prescriptionIds: ['z'] })] };
  const mapa = new Map([
    ['a', 'a2'],
    ['b', 'b2'],
    ['c', 'c2'],
  ]);
  const copiadas = reglasPropiasParaLaCopia(plan, 'f1', 'f2', mapa);
  assert.deepEqual(
    copiadas.map((r) => [r.blockId, r.prescriptionIds, r.model]),
    [
      ['f2', ['a2', 'b2'], 'LINEAR'],
      ['f2', ['c2'], null],
    ],
    'la de «z», sin copia, no pasa a valer para toda la fase',
  );
  assert.ok(PlanificacionDelPlanSchema.safeParse({ ...plan, phases: [...plan.phases, { blockId: 'f2', weeks: 6 }], progressions: [...plan.progressions!, ...copiadas] }).success);
  // La plantilla: la guarda y, al aplicarla, cada ejercicio pasa al suyo del plan nuevo.
  const plantilla = planificacionParaLaPlantilla(plan)!;
  const estructura = { blocks: [{ blockId: 'f1', sessions: [{ prescriptions: [{ prescriptionId: 'a' }, { prescriptionId: 'b' }, { prescriptionId: 'c' }, { prescriptionId: 'z' }] }] }] };
  const nuevo = { blocks: [{ blockId: 'n1', microcycles: [], sessions: [{ prescriptions: [{ prescriptionId: 'qa' }, { prescriptionId: 'qb' }, { prescriptionId: 'qc' }, { prescriptionId: 'qz' }] }] }] };
  const aplicada = planificacionDesdeLaPlantilla(plantilla, estructura, nuevo)!;
  assert.equal(progresionDeLaFase(aplicada, 'n1')?.loadStep, 2.5);
  assert.equal(reglaPropiaDe(aplicada, 'n1', 'qb')?.loadStep, 5);
  assert.equal(cambiaAlgo(progresionDelEjercicio(aplicada, 'n1', 'qc').regla), false);
});

test('TEST-PE-07 · en pocas palabras, para el ejercicio plegado y la fase', () => {
  assert.equal(progresionCorta(regla({}), 'kg'), '↑ +2,5 kg/sem');
  assert.equal(progresionCorta(regla({ repStep: 1 }), 'kg'), '↑ +2,5 kg y +1 rep/sem');
  assert.equal(progresionCorta(regla({ model: 'DOUBLE', repRange: { min: 8, max: 12 } }), 'lb'), '↑ 8-12 reps, +2,5 lb');
  assert.equal(progresionCorta(regla({ model: 'UNDULATING', waves: [100, 80, 90] }), 'kg'), '↑ Ondulante');
  assert.equal(progresionCorta(regla({ model: null, deload: { week: 4, mode: 'LOAD', workingLoadShare: 60, setsRemoved: 2 } }), 'kg'), 'Descarga S4');
  assert.equal(progresionCorta(sinModelo(['a']), 'kg'), 'Sin progresión');
  for (const t of [COPY_PROGRESIONES.conPropias(2), COPY_PROGRESIONES.aplicarA(3), COPY_PROGRESIONES.volvieronALaFase(2), COPY_PROGRESIONES.comoSeVe, COPY_PROGRESIONES.aplicadaA(1)]) {
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
  }
  assert.equal(COPY_PROGRESIONES.aplicarA(1), 'Aplicar a 1 ejercicio');
});
