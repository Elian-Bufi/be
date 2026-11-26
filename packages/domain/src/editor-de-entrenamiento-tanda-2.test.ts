/**
 * WP-EDITOR-ENTRENAMIENTO-TANDA-2 (DL-198) · el 1RM de referencia y sus tres orígenes, el % RM, la carga de cada semana,
 * el esfuerzo de la sesión, la planificación de las plantillas y las capacidades nuevas: TEST-ET2-01 a TEST-ET2-09.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  avisoEnPalabras,
  baseDelPorcentaje,
  calibrar,
  cargaDelPorcentaje,
  COPY_UNO_RM,
  cuentaDelUnoRM,
  entraEnElRegistro,
  esConBarra,
  origenDelUnoRM,
  ultimoRegistroEnRango,
  unoRMDeLaSerie,
  vigenteDelUnoRM,
  type SesionParaElUnoRM,
  type UnoRMGuardado,
} from './repeticion-maxima';
import { bloquesDeLaSemana, prescripcionDeLaSemana, semanaDeLaFase, semanaQueRige, type SemanaDeLaFase } from './carga-de-la-semana';
import { cargaDeLaSesion, COPY_ESFUERZO_DE_LA_SESION, esfuerzoEnUnRenglon, RegistrarEsfuerzoDeLaSesionRequestSchema } from './esfuerzo-de-la-sesion';
import { planificacionDesdeLaPlantilla, planificacionParaLaPlantilla } from './planificacion-de-la-plantilla';
import { PlanificacionDeLaPlantillaSchema } from './contratos-plantillas';
import { PlanificacionDelPlanSchema, type PlanificacionDelPlan, type ProgresionDeLaFase } from './contratos-entrenamiento';
import { SumarUnoRMRequestSchema } from './contratos-repeticion-maxima';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { terminosProhibidosDeFuerzaEn } from './estimacion-de-fuerza';
import { CAPACIDADES_CONOCIDAS, capacidadesDeclaradas, valorDeCapacidades, CAPACIDAD_ESFUERZO_DE_LA_SESION, CAPACIDAD_SEMANA_DE_LA_FASE } from './compatibilidad-de-clientes';
import { planificacionPodada } from './planificacion-del-plan';

const kg = (value: number) => ({ value, unit: 'kg' as const });

test('TEST-ET2-01 · la calibración: 30 kg × 8 a RIR 1 = 39 kg, con la cuenta a la vista; fuera de rango no calibra', () => {
  const r = calibrar({ carga: kg(30), repeticiones: 8, rir: 1 });
  assert.deepEqual(r, { ok: true, valor: kg(39) });
  assert.equal(cuentaDelUnoRM({ carga: kg(30), repeticiones: 8, rir: 1 }), '30 × (1 + (8 + 1) / 30) = 39 kg');
  // Al medio kilo, con la cuenta exacta: 32,5 × (1 + 12/30) = 45,5.
  assert.equal(unoRMDeLaSerie({ carga: kg(32.5), repeticiones: 10, rir: 2 }), 45.5);
  // Con una sola repetición equivalente, la carga.
  assert.equal(unoRMDeLaSerie({ carga: kg(100), repeticiones: 1, rir: 0 }), 100);
  assert.deepEqual(calibrar({ carga: kg(30), repeticiones: 13, rir: 0 }), { ok: false, motivo: 'REPETICIONES_FUERA' });
  assert.deepEqual(calibrar({ carga: kg(30), repeticiones: 8, rir: 3 }), { ok: false, motivo: 'RIR_MAYOR_QUE_2' });
  assert.deepEqual(calibrar({ carga: kg(0), repeticiones: 8, rir: 1 }), { ok: false, motivo: 'SIN_CARGA' });
  assert.equal(origenDelUnoRM('CALIBRATION', '2026-11-25', null), 'calculado en la calibración del 25 nov');
  assert.equal(origenDelUnoRM('RECORD', '2026-12-02', 'ORIENTATIVE'), 'calculado con el registro del 2 dic · orientativo');
  assert.equal(origenDelUnoRM('DECLARED', '2026-11-25', null), 'declarado el 25 nov');
});

const deLaPersona = { recordedAs: 'TYPED' as const, fieldOrigins: { load: 'PERSON' as const, completedRepetitions: 'PERSON' as const, rir: 'PERSON' as const } };

test('TEST-ET2-02 · el registro (Epley v2): cualquier ejercicio con carga, de 8 a 12 repeticiones a RIR 0 a 2, escrito por la persona', () => {
  assert.equal(entraEnElRegistro({ ...deLaPersona, load: kg(20), completedRepetitions: 10, rir: 2 }), true);
  assert.equal(entraEnElRegistro({ ...deLaPersona, load: kg(20), completedRepetitions: 7, rir: 2 }), false, 'menos de 8');
  assert.equal(entraEnElRegistro({ ...deLaPersona, load: kg(20), completedRepetitions: 13, rir: 0 }), false, 'más de 12');
  assert.equal(entraEnElRegistro({ ...deLaPersona, load: kg(20), completedRepetitions: 10, rir: 3 }), false, 'RIR 3');
  assert.equal(entraEnElRegistro({ ...deLaPersona, load: null, completedRepetitions: 10, rir: 1 }), false, 'sin carga externa');
  assert.equal(entraEnElRegistro({ ...deLaPersona, recordedAs: 'AS_PLANNED', load: kg(20), completedRepetitions: 10, rir: 1 }), false, 'tildada con lo del plan');
  assert.equal(entraEnElRegistro({ ...deLaPersona, fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PERSON' }, load: kg(20), completedRepetitions: 10, rir: 1 }), false);
  assert.equal(entraEnElRegistro({ ...deLaPersona, sustituido: true, load: kg(20), completedRepetitions: 10, rir: 1 }), false);
  const sesiones: SesionParaElUnoRM[] = [
    { executionId: 'a', fecha: '2026-11-20', prescriptionId: 'p', series: [{ ...deLaPersona, setIndex: 1, load: kg(30), completedRepetitions: 8, rir: 1 }] },
    {
      executionId: 'b',
      fecha: '2026-11-27',
      prescriptionId: 'p',
      series: [
        { ...deLaPersona, setIndex: 1, load: kg(32), completedRepetitions: 10, rir: 2 },
        { ...deLaPersona, setIndex: 2, load: kg(34), completedRepetitions: 8, rir: 1 },
        { ...deLaPersona, setIndex: 3, load: kg(36), completedRepetitions: 5, rir: 1 },
      ],
    },
  ];
  const r = ultimoRegistroEnRango(sesiones, 'kg', false)!;
  // La sesión más nueva y, en ella, la de mayor carga que entra (la de 5 repeticiones no entra).
  assert.equal(r.executionId, 'b');
  assert.equal(r.setIndex, 2);
  assert.deepEqual(r.valor, kg(44));
  assert.equal(r.banda, 'ORIENTATIVE');
  assert.equal(ultimoRegistroEnRango(sesiones, 'kg', true)!.banda, 'CORE');
  assert.equal(ultimoRegistroEnRango(sesiones, 'lb', true), null, 'sin convertir entre kg y lb');
  assert.equal(esConBarra(['BARBELL', 'BENCH'], 'Press'), true);
  assert.equal(esConBarra(['DUMBBELL'], 'Press con barra'), false);
  assert.equal(esConBarra([], 'Sentadilla trasera con barra'), true);
});

const guardado = (o: Partial<UnoRMGuardado>): UnoRMGuardado => ({
  entryId: 'g1',
  origen: 'CALIBRATION',
  valor: kg(39),
  fecha: '2026-11-25',
  registradoEn: '2026-11-25T10:00:00.000Z',
  serie: { carga: kg(30), repeticiones: 8, rir: 1 },
  banda: 'CORE',
  ...o,
});
const registro = (valor: number, fecha: string) => ({
  valor: kg(valor),
  fecha,
  serie: { carga: kg(valor * 0.7), repeticiones: 10, rir: 2 },
  banda: 'CORE' as const,
  executionId: 'e',
  prescriptionId: 'p',
  setIndex: 1,
});

test('TEST-ET2-03 · BE usa el más reciente; si un registro nuevo se aleja más del 10 %, avisa y no cambia nada solo', () => {
  assert.deepEqual(vigenteDelUnoRM([], null), { vigente: null, aviso: null });
  assert.equal(vigenteDelUnoRM([], registro(40, '2026-11-26')).vigente?.origen, 'RECORD');
  // Un registro más nuevo y cercano (+2,6 %): pasa a ser el que se usa.
  const cerca = vigenteDelUnoRM([guardado({})], registro(40, '2026-11-30'));
  assert.equal(cerca.vigente?.origen, 'RECORD');
  assert.equal(cerca.aviso, null);
  // Uno que se aleja (+15 %): sigue la calibración, con el aviso.
  const lejos = vigenteDelUnoRM([guardado({})], registro(45, '2026-12-02'));
  assert.equal(lejos.vigente?.origen, 'CALIBRATION');
  assert.equal(lejos.aviso?.diferencia, 15);
  assert.equal(avisoEnPalabras(lejos.aviso!), 'El registro del 2 dic da 45 kg, 15 % más que la calibración del 25 nov (39 kg). BE sigue usando el valor guardado hasta que elijas.');
  assert.deepEqual(terminosProhibidosDeEntrenamientoEn(avisoEnPalabras(lejos.aviso!)), []);
  // Un registro más viejo que lo guardado no cuenta; a igual fecha, lo guardado.
  assert.equal(vigenteDelUnoRM([guardado({})], registro(60, '2026-11-20')).vigente?.origen, 'CALIBRATION');
  assert.equal(vigenteDelUnoRM([guardado({})], registro(60, '2026-11-25')).aviso, null);
  // Lo guardado más reciente gana entre lo guardado: lo declarado después de la calibración.
  const declarado = guardado({ entryId: 'g2', origen: 'DECLARED', valor: kg(42), fecha: '2026-11-28', registradoEn: '2026-11-28T09:00:00.000Z', serie: null, banda: null });
  assert.equal(vigenteDelUnoRM([guardado({}), declarado], null).vigente?.origen, 'DECLARED');
  // Entre kg y lb no se compara.
  assert.equal(vigenteDelUnoRM([guardado({})], { ...registro(100, '2026-12-01'), valor: { value: 100, unit: 'lb' } }).vigente?.origen, 'CALIBRATION');
});

test('TEST-ET2-04 · el % RM: la carga sale del 1RM, redondeada al paso, nunca 0, con la base a la vista', () => {
  const c = cargaDelPorcentaje(70, kg(39), 'BARRA');
  assert.deepEqual(c, kg(27));
  assert.equal(baseDelPorcentaje(70, kg(39), c), '70 % de 39 kg = 27 kg');
  assert.deepEqual(terminosProhibidosDeEntrenamientoEn(baseDelPorcentaje(70, kg(39), c)), []);
  // Con 100 kg, de a 2,5: 72,5 % → 72,5 kg; en una máquina, de a 5: 75.
  assert.deepEqual(cargaDelPorcentaje(72.5, kg(100), 'BARRA'), kg(72.5));
  assert.deepEqual(cargaDelPorcentaje(72.5, kg(100), 'MAQUINA'), kg(75));
  // Una carga muy chica queda en un paso: nunca 0.
  assert.deepEqual(cargaDelPorcentaje(30, kg(2), 'MANCUERNA'), kg(1));
  for (const t of [COPY_UNO_RM.queEs, COPY_UNO_RM.masReciente, COPY_UNO_RM.calibracionExplicada, COPY_UNO_RM.calibracionEjemplo, COPY_UNO_RM.reglaDelRegistro, COPY_UNO_RM.orientativo, COPY_UNO_RM.ejemploDelPorcentaje]) {
    assert.deepEqual(terminosProhibidosDeFuerzaEn(t), [], t);
  }
});

const lineal: ProgresionDeLaFase = { blockId: 'f1', model: 'LINEAR', loadStep: 2.5, repStep: 0, repRange: null, waves: null, deload: null, prescriptionIds: null };
const semana = (p: ProgresionDeLaFase, n: number, semanas = 6): SemanaDeLaFase => ({ progresion: p, semana: n, semanas });
const presc = {
  prescriptionId: 'p1',
  suggestedLoad: kg(80),
  sets: [
    { setKind: 'WARM_UP' as const, repetitions: { value: 8 }, suggestedLoad: kg(40) },
    { repetitions: { value: 6 } },
    { repetitions: { value: 6 }, suggestedLoad: kg(85) },
    { repetitions: { value: 6 } },
  ],
};

test('TEST-ET2-05 · la carga de cada semana: lineal, doble, ondulante y descarga, sobre la misma sesión', () => {
  // Semana 1: la misma prescripción, sin tocar.
  assert.equal(prescripcionDeLaSemana(presc, semana(lineal, 1), 'Sentadilla trasera con barra', null), presc);
  // Semana 3 lineal: +5 kg a la común y a la serie propia (la pirámide sigue); la aproximación a mano no cambia.
  const s3 = prescripcionDeLaSemana(presc, semana(lineal, 3), 'Sentadilla trasera con barra', null);
  assert.deepEqual(s3.suggestedLoad, kg(85));
  assert.deepEqual(s3.sets[2]!.suggestedLoad, kg(90));
  assert.deepEqual(s3.sets[0]!.suggestedLoad, kg(40));
  // Con aproximaciones «Por porcentaje», se recalculan desde la carga de la semana.
  const conAprox = prescripcionDeLaSemana(presc, semana(lineal, 3), 'Sentadilla trasera con barra', { prescriptionId: 'p1', mode: 'FROM_WORKING_LOAD', workingLoadShares: [50], step: 2.5 });
  assert.deepEqual(conAprox.sets[0]!.suggestedLoad, kg(42.5));
  // Doble: las repeticiones suben dentro del rango.
  const doble: ProgresionDeLaFase = { ...lineal, model: 'DOUBLE', repStep: null, repRange: { min: 6, max: 8 } };
  assert.deepEqual(prescripcionDeLaSemana(presc, semana(doble, 2), 'Sentadilla', null).sets[1]!.repetitions, { value: 7 });
  assert.deepEqual(prescripcionDeLaSemana(presc, semana(doble, 4), 'Sentadilla', null).suggestedLoad, kg(82.5));
  // Ondulante: la liviana al 80 % de la carga de trabajo (64, de a 2,5: 65), por la misma parte en cada serie (85 → 70).
  const ondulante: ProgresionDeLaFase = { ...lineal, model: 'UNDULATING', loadStep: null, repStep: null, waves: [100, 80, 90] };
  const liviana = prescripcionDeLaSemana(presc, semana(ondulante, 2), 'Sentadilla trasera con barra', null);
  assert.deepEqual(liviana.suggestedLoad, kg(65));
  assert.deepEqual(liviana.sets[2]!.suggestedLoad, kg(70));
  // Descarga por series: se van las últimas efectivas; la aproximación queda.
  const porSeries: ProgresionDeLaFase = { ...lineal, model: null, loadStep: null, repStep: null, deload: { week: 4, mode: 'SETS', workingLoadShare: 60, setsRemoved: 2 } };
  const descarga = prescripcionDeLaSemana(presc, semana(porSeries, 4), 'Sentadilla', null);
  assert.equal(descarga.sets.length, 2);
  assert.equal(descarga.sets[0]!.setKind, 'WARM_UP');
  // Una regla de otros ejercicios no toca este.
  assert.equal(prescripcionDeLaSemana(presc, semana({ ...lineal, prescriptionIds: ['otro'] }, 3), 'Sentadilla', null), presc);
});

test('TEST-ET2-06 · la semana que rige y el plan entero en una fecha; sin progresiones, el mismo contenido', () => {
  const fase = { posicion: 0, blockId: 'f1', desde: '2026-11-30', hasta: '2027-01-10', semanas: 6 };
  assert.equal(semanaQueRige(fase, '2026-11-30'), 1);
  assert.equal(semanaQueRige(fase, '2026-12-14'), 3);
  assert.equal(semanaQueRige(fase, '2026-11-01'), 1, 'antes de la fase, la primera');
  assert.equal(semanaQueRige(fase, '2027-03-01'), 6, 'después, la última');
  assert.equal(semanaQueRige({ ...fase, semanasFuera: 2 }, '2027-03-01'), 4, 'una fase cortada termina antes');
  const bloques = [{ blockId: 'f1', microcycles: [], sessions: [{ sessionId: 's1', prescriptions: [presc] }] }];
  const planificacion: PlanificacionDelPlan = { startDate: '2026-11-30', weeks: 6, goal: null, phases: [{ blockId: 'f1', weeks: 6 }], progressions: [lineal] };
  assert.equal(semanaDeLaFase(planificacion, bloques, 'f1', '2026-12-14')?.semana, 3);
  const semana3 = bloquesDeLaSemana(bloques, planificacion, '2026-12-14', () => 'Sentadilla trasera con barra');
  assert.deepEqual(semana3[0]!.sessions[0]!.prescriptions[0]!.suggestedLoad, kg(85));
  const { progressions: _sin, ...sinProgresion } = planificacion;
  assert.deepEqual(bloquesDeLaSemana(bloques, sinProgresion, '2026-12-14', () => ''), bloques);
  assert.deepEqual(bloquesDeLaSemana(bloques, null, '2026-12-14', () => ''), bloques);
  // Sin fechas de fase, no hay semana: la sesión de siempre.
  assert.equal(semanaDeLaFase({ ...planificacion, startDate: null }, bloques, 'f1', '2026-12-14'), null);
});

test('TEST-ET2-07 · el esfuerzo de la sesión (Foster): esfuerzo × minutos, los minutos con su origen y los textos', () => {
  assert.equal(cargaDeLaSesion(7, 60), 420);
  assert.equal(cargaDeLaSesion(7, null), null);
  assert.equal(RegistrarEsfuerzoDeLaSesionRequestSchema.safeParse({ rating: 7, durationMinutes: 60, durationSource: 'TIMER' }).success, true);
  assert.equal(RegistrarEsfuerzoDeLaSesionRequestSchema.safeParse({ rating: 7, durationMinutes: null, durationSource: null }).success, true);
  assert.equal(RegistrarEsfuerzoDeLaSesionRequestSchema.safeParse({ rating: 7, durationMinutes: 60, durationSource: null }).success, false);
  assert.equal(RegistrarEsfuerzoDeLaSesionRequestSchema.safeParse({ rating: 11, durationMinutes: null, durationSource: null }).success, false);
  assert.equal(RegistrarEsfuerzoDeLaSesionRequestSchema.safeParse({ rating: 6.5, durationMinutes: null, durationSource: null }).success, false);
  assert.equal(esfuerzoEnUnRenglon({ rating: 7, durationMinutes: 60, sessionLoad: 420 }), '7 · Muy duro · 60 min → 420');
  for (const t of Object.values(COPY_ESFUERZO_DE_LA_SESION)) if (typeof t === 'string') assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
  // La opción del plan viaja en la planificación y no se pierde al podarla.
  const p = PlanificacionDelPlanSchema.parse({ startDate: null, weeks: null, phases: [], askSessionEffort: true });
  assert.equal(planificacionPodada(p, [], [])?.askSessionEffort, true);
});

test('TEST-ET2-08 · las plantillas guardan y aplican la planificación, sin nada de la persona, por el lugar de cada cosa', () => {
  const delPlan: PlanificacionDelPlan = {
    startDate: '2026-11-30',
    weeks: 8,
    goal: 'Fuerza',
    phases: [{ blockId: 'f1', weeks: 4 }, { blockId: 'f2', weeks: 4 }],
    warmUps: [{ prescriptionId: 'p2', mode: 'FROM_WORKING_LOAD', workingLoadShares: [40, 60, 80], step: 2.5 }],
    progressions: [{ ...lineal, blockId: 'f2', prescriptionIds: ['p2'] }],
    intensity: 'PERCENT_RM',
    privateNotes: { plan: 'privado', phases: [] },
    favoriteCharts: [{ kind: 'PHASE_PROGRESSION', id: 'f2' }],
    askSessionEffort: true,
  };
  const plantilla = planificacionParaLaPlantilla(delPlan)!;
  assert.equal(PlanificacionDeLaPlantillaSchema.safeParse(plantilla).success, true);
  assert.equal('startDate' in plantilla || 'goal' in plantilla || 'privateNotes' in plantilla || 'favoriteCharts' in plantilla, false);
  // Con datos de la persona, el esquema de la plantilla no los acepta.
  assert.equal(PlanificacionDeLaPlantillaSchema.safeParse({ ...plantilla, privateNotes: { plan: 'x', phases: [] } }).success, false);
  const estructura = { blocks: [{ blockId: 'f1', sessions: [{ prescriptions: [{ prescriptionId: 'p1' }] }] }, { blockId: 'f2', sessions: [{ prescriptions: [{ prescriptionId: 'p2' }] }] }] };
  const nuevo = { blocks: [{ blockId: 'n1', microcycles: [], sessions: [{ prescriptions: [{ prescriptionId: 'q1' }] }] }, { blockId: 'n2', microcycles: [], sessions: [{ prescriptions: [{ prescriptionId: 'q2' }] }] }] };
  const aplicada = planificacionDesdeLaPlantilla(plantilla, estructura, nuevo)!;
  assert.equal(aplicada.startDate, null);
  assert.deepEqual(aplicada.phases, [{ blockId: 'n1', weeks: 4 }, { blockId: 'n2', weeks: 4 }]);
  assert.equal(aplicada.warmUps?.[0]?.prescriptionId, 'q2');
  assert.deepEqual(aplicada.progressions?.[0]?.prescriptionIds, ['q2']);
  assert.equal(aplicada.progressions?.[0]?.blockId, 'n2');
  assert.equal(aplicada.intensity, 'PERCENT_RM');
  assert.equal(aplicada.askSessionEffort, true);
  // Lo que no tiene lugar en el plan se poda.
  const corto = { blocks: [{ blockId: 'n1', microcycles: [], sessions: [{ prescriptions: [{ prescriptionId: 'q1' }] }] }] };
  const podada = planificacionDesdeLaPlantilla(plantilla, estructura, corto)!;
  assert.deepEqual(podada.phases, [{ blockId: 'n1', weeks: 4 }]);
  assert.equal(podada.progressions, undefined);
  assert.equal(planificacionParaLaPlantilla(null), null);
});

test('TEST-ET2-09 · las capacidades nuevas y el contrato de API-RMX-02', () => {
  assert.ok(CAPACIDADES_CONOCIDAS.includes(CAPACIDAD_SEMANA_DE_LA_FASE));
  assert.ok(CAPACIDADES_CONOCIDAS.includes(CAPACIDAD_ESFUERZO_DE_LA_SESION));
  // Todas juntas entran en la cabecera (256 caracteres).
  const todas = valorDeCapacidades([...CAPACIDADES_CONOCIDAS]);
  assert.ok(todas.length <= 256, `${todas.length}`);
  assert.equal(capacidadesDeclaradas(todas).size, CAPACIDADES_CONOCIDAS.length);
  const id = '00000000-0000-4000-8000-000000000001';
  assert.equal(SumarUnoRMRequestSchema.safeParse({ origin: 'CALIBRATION', exerciseId: id, localDate: '2026-11-25', load: kg(30), completedRepetitions: 8, rir: 1 }).success, true);
  assert.equal(SumarUnoRMRequestSchema.safeParse({ origin: 'DECLARED', exerciseId: id, localDate: '2026-11-25', value: kg(40) }).success, true);
  assert.equal(SumarUnoRMRequestSchema.safeParse({ origin: 'RECORD', exerciseId: id, executionId: id, prescriptionId: 'p1', setIndex: 1 }).success, true);
  // Un registro nunca trae su valor desde el cliente.
  assert.equal(SumarUnoRMRequestSchema.safeParse({ origin: 'RECORD', exerciseId: id, executionId: id, prescriptionId: 'p1', setIndex: 1, value: kg(50) }).success, false);
});

test('TEST-ET2-10 · los bordes (revisión de #325): el 10 % justo, la escala que acepta la base, el % RM en lb y la «M» de una fase cortada', () => {
  // El umbral es «más del 10 %»: con 100 de base, 110 no avisa y pasa a ser el que se usa; 110,5 avisa.
  const base = guardado({ valor: kg(100), serie: null });
  assert.equal(vigenteDelUnoRM([base], registro(110, '2026-12-01')).aviso, null);
  assert.equal(vigenteDelUnoRM([base], registro(110, '2026-12-01')).vigente?.origen, 'RECORD');
  assert.equal(vigenteDelUnoRM([base], registro(90, '2026-12-01')).aviso, null);
  assert.equal(vigenteDelUnoRM([base], registro(110.5, '2026-12-01')).aviso?.diferencia, 11);
  assert.equal(vigenteDelUnoRM([base], registro(89.5, '2026-12-01')).aviso?.diferencia, -11);
  // La cuenta que redondea a 0 o pasa de 1000 no calibra (la base la rechazaría con un 500) ni es el registro.
  assert.deepEqual(calibrar({ carga: kg(0.1), repeticiones: 1, rir: 0 }), { ok: false, motivo: 'FUERA_DE_ESCALA' });
  assert.deepEqual(calibrar({ carga: kg(900), repeticiones: 12, rir: 2 }), { ok: false, motivo: 'FUERA_DE_ESCALA' });
  assert.deepEqual(calibrar({ carga: kg(1000), repeticiones: 1, rir: 0 }), { ok: true, valor: kg(1000) });
  const persona = { load: kg(900), completedRepetitions: 12, rir: 2, fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' } } as const;
  assert.equal(entraEnElRegistro(persona), false);
  assert.equal(entraEnElRegistro({ ...persona, load: kg(100) }), true);
  assert.deepEqual(terminosProhibidosDeFuerzaEn(COPY_UNO_RM.motivo.FUERA_DE_ESCALA), []);
  // En lb, al paso de las libras y nunca 0.
  const lb = (value: number) => ({ value, unit: 'lb' as const });
  assert.deepEqual(cargaDelPorcentaje(70, lb(225), 'BARRA'), lb(160), '157,5 lb, de a 5 lb');
  assert.deepEqual(cargaDelPorcentaje(5, lb(20), 'MAQUINA'), lb(5));
  // Una fase de 6 semanas en un plan de 4: la regla sigue con sus 6, y la persona ve «de 4», las que le llegan.
  const bloques = [{ blockId: 'f1', microcycles: [], sessions: [{ sessionId: 's1', prescriptions: [presc] }] }];
  const cortada: PlanificacionDelPlan = { startDate: '2026-11-30', weeks: 4, goal: null, phases: [{ blockId: 'f1', weeks: 6 }], progressions: [lineal] };
  const s = semanaDeLaFase(cortada, bloques, 'f1', '2027-03-01');
  assert.equal(s?.semana, 4);
  assert.equal(s?.semanas, 6);
  assert.equal(s?.semanasQueEntran, 4);
  const entera = semanaDeLaFase({ ...cortada, weeks: 6 }, bloques, 'f1', '2026-12-14');
  assert.equal(entera?.semanasQueEntran, 6);
});
