/**
 * TEST-GR-001 (WP-GRAFICOS GR-01, DL-174) y TEST-PG-010 (WP-PULIDO-GRANDES PG-11, DL-173): «La vez pasada», la misma
 * pieza en el editor del profesional y en la sesión de la APK.
 * - Las últimas veces del ejercicio, de la más reciente a la más vieja, con lo registrado vigente, serie por serie.
 * - Lo precargado del plan no se ve igual que lo escrito: «carga rápida» (o «como el plan») y «con la carga del plan».
 * - Lo cargado otro día y lo corregido, marcados.
 * - Una sustitución por otro ejercicio lo dice y no es comparable; este ejercicio hecho en lugar de otro, sí.
 * - Una sesión no realizada, o sin este ejercicio, no es una vez; una resumida lo dice.
 * - Sin flechas ni juicios.
 *
 * Los resultados esperados se escriben a mano, desde la propuesta de gráficos. Datos sintéticos.
 * Mutaciones que estas pruebas ponen en rojo: tomar `sustituido` como el mismo ejercicio (en `esDelMismoEjercicio`);
 * leer el original en vez de la corrección que rige; no saltear las no realizadas; perder la marca de carga rápida.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EjecucionDeEntrenamientoSchema, type EjecucionDeEntrenamiento, type Prescripcion, type SerieEjecutadaApi } from './contratos-entrenamiento';
import { TERMINOS_PROHIBIDOS_DE_FUERZA } from './estimacion-de-fuerza';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import {
  COPY_LA_VEZ_PASADA,
  esDelMismoEjercicio,
  fechaEnPocasPalabras,
  lineaDeLaVezPasada,
  loQueSeHizo,
  marcaDelPlan,
  textoDeLaSerie,
  vecesPasadas,
  type VezPasada,
} from './la-vez-pasada';
import { observacionesDelEjercicio } from './comparacion-de-entrenamiento';

const ZONA = 'America/Argentina/Buenos_Aires';
type Ejercicio = { readonly exerciseId: string; readonly exerciseVersionId: string; readonly exerciseName: string };
const SENTADILLA: Ejercicio = { exerciseId: '5a2c3d7f-8b02-4d02-8f02-7b7e3c7b1e02', exerciseVersionId: '5a2c3d7f-8b02-4d02-8f02-7b7e3c7b1f02', exerciseName: 'Sentadilla goblet' };
const PRENSA: Ejercicio = { exerciseId: '6b3d4e8a-9c13-4e13-9a13-8c8f4d8c2e03', exerciseVersionId: '6b3d4e8a-9c13-4e13-9a13-8c8f4d8c2f03', exerciseName: 'Prensa de piernas' };
/** Una versión que no se prescribe en ninguna sesión: no se sabe de qué ejercicio es. */
const SIN_IDENTIDAD: Ejercicio = { exerciseId: '7c4e5f9b-ad24-4f24-ab24-9d9a5e9d3e04', exerciseVersionId: '7c4e5f9b-ad24-4f24-ab24-9d9a5e9d3f04', exerciseName: 'Sentadilla en máquina' };

const prescripcionDe = (e: Ejercicio, id: string, orden: number): Prescripcion => ({
  prescriptionId: id,
  order: orden,
  ...e,
  sets: [1, 2, 3].map((setIndex) => ({ setIndex, repetitions: { min: 8, max: 10 }, note: null })),
  intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
  suggestedLoad: { value: 20, unit: 'kg' },
  professionalParameters: [],
  note: null,
});

/** Una serie escrita por la persona. */
const escrita = (setIndex: number, carga: number | null, reps: number | null, rir: number | null = 2, unidad: 'kg' | 'lb' = 'kg'): SerieEjecutadaApi => ({
  setIndex,
  load: carga === null ? null : { value: carga, unit: unidad },
  completedRepetitions: reps,
  rir,
  perceivedExertion: null,
});
/** Una serie tildada sin escribir: los valores del plan, con la marca. */
const tildada = (setIndex: number): SerieEjecutadaApi => ({ ...escrita(setIndex, 20, 10, 2), recordedAs: 'AS_PLANNED' });

interface Hecho {
  readonly prescripto: Ejercicio;
  readonly realizado?: Ejercicio;
  readonly series?: readonly SerieEjecutadaApi[];
  readonly resumen?: string;
  /** Está en la sesión del plan, pero el registro no lo incluye. */
  readonly sinRegistro?: boolean;
}

let secuencia = 0;
function ejecucion(
  fecha: string,
  hechos: readonly Hecho[],
  o: { readonly condicion?: 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED'; readonly registradaEl?: string; readonly corregidas?: readonly SerieEjecutadaApi[]; readonly hora?: string } = {},
): EjecucionDeEntrenamiento {
  const x = `00000000-0000-4000-8000-${String(++secuencia).padStart(12, '0')}`;
  const ocurrio = `${fecha}T${o.hora ?? '18:00'}:00.000-03:00`;
  const condicion = o.condicion ?? 'COMPLETED';
  const resumida = hechos.some((h) => h.resumen !== undefined);
  const registro = (primeras?: readonly SerieEjecutadaApi[]) => ({
    granularity: condicion === 'NOT_COMPLETED' ? null : resumida ? 'EXERCISE_OR_SESSION' : 'SET',
    sessionCondition: condicion,
    reason: null,
    exercises:
      condicion === 'NOT_COMPLETED'
        ? []
        : hechos.flatMap((h, i) => {
            if (h.sinRegistro) return [];
            const hecho = h.realizado ?? h.prescripto;
            return {
              prescriptionId: `rx-${i}`,
              prescribedExerciseVersionId: h.prescripto.exerciseVersionId,
              prescribedExerciseName: h.prescripto.exerciseName,
              performedExerciseVersionId: hecho.exerciseVersionId,
              performedExerciseName: hecho.exerciseName,
              substituted: hecho !== h.prescripto,
              sets: h.resumen !== undefined ? null : [...(primeras && i === 0 ? primeras : (h.series ?? []))],
              executionSummary: h.resumen !== undefined ? { description: h.resumen } : null,
            };
          }),
    sessionSummary: null,
  });
  const correccion = `cor-${x}`;
  return EjecucionDeEntrenamientoSchema.parse({
    executionId: x,
    state: 'REGISTERED',
    adviseeId: 'persona-1',
    planId: 'plan-v1',
    snapshotDigest: 'a'.repeat(64),
    occurrenceId: `oc-${x}`,
    date: fecha,
    timeZone: ZONA,
    plannedSession: {
      sessionId: 'ses-a',
      label: 'Piernas A',
      order: 1,
      instructions: null,
      prescriptions: hechos.map((h, i) => prescripcionDe(h.prescripto, `rx-${i}`, i + 1)),
      blockId: 'blq-1',
      blockLabel: 'Bloque 1',
      microcycleId: null,
      microcycleLabel: null,
    },
    original: registro(),
    corrections: o.corregidas
      ? [{ correctionId: correccion, previousCorrectionId: null, reason: 'Anoté mal la carga', correction: registro(o.corregidas), author: { identityId: 'persona-1', displayName: 'Ana' }, authorRole: 'ADVISEE', recordedAt: `${fecha}T21:00:00.000-03:00` }]
      : [],
    effectiveView: o.corregidas ? { kind: 'CORRECTED', correctionId: correccion } : { kind: 'ORIGINAL' },
    occurredAt: ocurrio,
    recordedAt: o.registradaEl ?? ocurrio,
  });
}

const HOY = '2026-11-14';
const fechas = (veces: readonly VezPasada[]) => veces.map((v) => v.fecha);

// ─── Cuáles son las veces ───────────────────────────────────────────────────────────────────────────────────

test('TEST-GR-001 · las últimas tres veces, de la más reciente a la más vieja, con lo registrado serie por serie', () => {
  const historia = [
    ejecucion('2026-10-20', [{ prescripto: SENTADILLA, series: [escrita(1, 18, 10)] }]),
    ejecucion('2026-10-27', [{ prescripto: SENTADILLA, series: [escrita(1, 20, 9)] }]),
    ejecucion('2026-11-03', [{ prescripto: SENTADILLA, series: [escrita(1, 20, 8), escrita(2, 20, 8), escrita(3, 22, 6, 1)] }]),
    ejecucion('2026-10-30', [{ prescripto: SENTADILLA, series: [escrita(1, 20, 10)] }]),
  ];
  const veces = vecesPasadas(historia, SENTADILLA.exerciseId);
  // Por cuándo ocurrieron, no por el orden en que llegaron; la del 20/10 queda afuera (son tres).
  assert.deepEqual(fechas(veces), ['2026-11-03', '2026-10-30', '2026-10-27']);
  const ultima = veces[0]!;
  assert.equal(ultima.comparable, true);
  assert.equal(ultima.sesion, 'Piernas A');
  assert.deepEqual(ultima.como.tipo === 'series' ? ultima.como.series.map(textoDeLaSerie) : null, ['20 kg × 8 · RIR 2', '20 kg × 8 · RIR 2', '22 kg × 6 · RIR 1']);
  assert.equal(lineaDeLaVezPasada(ultima, HOY, 'persona'), 'La vez pasada, mar 3 nov: 20 kg × 8 · RIR 2, 20 kg × 8 · RIR 2, 22 kg × 6 · RIR 1');
  // La APK muestra una sola: la última.
  assert.deepEqual(fechas(vecesPasadas(historia, SENTADILLA.exerciseId, { cuantas: 1 })), ['2026-11-03']);
  // Un ejercicio que la persona nunca hizo no tiene ninguna: la línea no se dibuja (ni «0», ni «sin datos»).
  assert.deepEqual(vecesPasadas(historia, PRENSA.exerciseId), []);
});

test('TEST-PG-010 · «hasta» la fecha de la sesión que se registra: una posterior no es «pasada»; una de hoy, sí', () => {
  const historia = [ejecucion('2026-11-03', [{ prescripto: SENTADILLA, series: [escrita(1, 20, 8)] }]), ejecucion('2026-11-10', [{ prescripto: SENTADILLA, series: [escrita(1, 22, 8)] }])];
  assert.deepEqual(fechas(vecesPasadas(historia, SENTADILLA.exerciseId, { hasta: '2026-11-05' })), ['2026-11-03']);
  assert.deepEqual(fechas(vecesPasadas(historia, SENTADILLA.exerciseId, { hasta: '2026-11-10' })), ['2026-11-10', '2026-11-03']);
  assert.equal(lineaDeLaVezPasada(vecesPasadas(historia, SENTADILLA.exerciseId)[0]!, '2026-11-10', 'persona'), 'La vez pasada, hoy: 22 kg × 8 · RIR 2');
});

test('TEST-GR-001 · una sesión registrada como no realizada, o sin este ejercicio, no es una vez', () => {
  const historia = [
    ejecucion('2026-11-03', [{ prescripto: SENTADILLA, series: [escrita(1, 20, 8)] }]),
    // No realizada: la única omisión declarada; no es una vez del ejercicio.
    ejecucion('2026-11-06', [{ prescripto: SENTADILLA }], { condicion: 'NOT_COMPLETED' }),
    // Registrada con otro ejercicio de la sesión, pero sin la sentadilla: tampoco.
    ejecucion('2026-11-09', [{ prescripto: PRENSA, series: [escrita(1, 80, 10)] }, { prescripto: SENTADILLA, sinRegistro: true }]),
    // En el registro, pero sin ninguna serie ni resumen: no hay nada que mostrar.
    ejecucion('2026-11-11', [{ prescripto: SENTADILLA, series: [] }]),
  ];
  assert.deepEqual(fechas(vecesPasadas(historia, SENTADILLA.exerciseId)), ['2026-11-03']);
});

// ─── Lo precargado del plan, lo cargado otro día y lo corregido ─────────────────────────────────────────────

test('TEST-GR-001 · lo precargado del plan no se ve igual que lo escrito', () => {
  const conOrigenes: SerieEjecutadaApi = { ...escrita(2, 20, 10, 2), recordedAs: 'TYPED', fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' } };
  const [vez] = vecesPasadas([ejecucion('2026-11-03', [{ prescripto: SENTADILLA, series: [tildada(1), conOrigenes, escrita(3, 22, 6, 1)] }])], SENTADILLA.exerciseId);
  assert.ok(vez && vez.como.tipo === 'series');
  const [primera, segunda, tercera] = vez.como.series;
  assert.deepEqual([primera!.cargaRapida, primera!.delPlan], [true, []]);
  assert.deepEqual([segunda!.cargaRapida, segunda!.delPlan], [false, ['load', 'rir']]);
  assert.deepEqual([tercera!.cargaRapida, tercera!.delPlan], [false, []]);
  // Cada superficie lo dice con sus palabras: «carga rápida» en el website (DL-161), «como el plan» en la APK.
  assert.equal(marcaDelPlan(primera!, COPY_LA_VEZ_PASADA.cargaRapida), 'carga rápida');
  assert.equal(marcaDelPlan(segunda!, COPY_LA_VEZ_PASADA.cargaRapida), 'con la carga y el RIR del plan');
  assert.equal(marcaDelPlan(tercera!, COPY_LA_VEZ_PASADA.cargaRapida), null);
  assert.equal(loQueSeHizo(vez, 'profesional'), '20 kg × 10 · RIR 2 (carga rápida), 20 kg × 10 · RIR 2 (con la carga y el RIR del plan), 22 kg × 6 · RIR 1');
  assert.equal(loQueSeHizo(vez, 'persona'), '20 kg × 10 · RIR 2 (como el plan), 20 kg × 10 · RIR 2 (con la carga y el RIR del plan), 22 kg × 6 · RIR 1');
  // Una carga rápida sigue siendo del mismo ejercicio: es lo registrado, marcado.
  assert.equal(vez.comparable, true);
});

test('TEST-GR-001 · lo cargado otro día y lo corregido van marcados; rige la corrección', () => {
  const historia = [
    // Cargada al día siguiente: un recuerdo, no lo anotado en el momento.
    ejecucion('2026-11-03', [{ prescripto: SENTADILLA, series: [escrita(1, 20, 8)] }], { registradaEl: '2026-11-04T09:30:00.000-03:00' }),
    // Cargada esa misma noche: no es otro día.
    ejecucion('2026-11-05', [{ prescripto: SENTADILLA, series: [escrita(1, 20, 8)] }], { registradaEl: '2026-11-05T23:30:00.000-03:00' }),
    // Corregida: rige la corrección (24 kg), no el original (20 kg).
    ejecucion('2026-11-07', [{ prescripto: SENTADILLA, series: [escrita(1, 20, 8)] }], { corregidas: [escrita(1, 24, 8)] }),
  ];
  const [corregida, mismaNoche, otroDia] = vecesPasadas(historia, SENTADILLA.exerciseId);
  assert.deepEqual([corregida!.fecha, corregida!.corregida, corregida!.cargadaOtroDia], ['2026-11-07', true, false]);
  assert.equal(loQueSeHizo(corregida!, 'profesional'), '24 kg × 8 · RIR 2');
  assert.deepEqual([mismaNoche!.fecha, mismaNoche!.cargadaOtroDia], ['2026-11-05', false]);
  assert.deepEqual([otroDia!.fecha, otroDia!.cargadaOtroDia, otroDia!.corregida], ['2026-11-03', true, false]);
});

// ─── Lo comparable ──────────────────────────────────────────────────────────────────────────────────────────

test('TEST-PG-010 · hecha con otro ejercicio: lo dice y no es comparable; este hecho en lugar de otro, sí', () => {
  const historia = [
    // Prensa prescripta en otra sesión: así se sabe de qué ejercicio es su versión.
    ejecucion('2026-10-28', [{ prescripto: PRENSA, series: [escrita(1, 80, 10)] }]),
    // La sentadilla del plan, hecha con la prensa.
    ejecucion('2026-11-03', [{ prescripto: SENTADILLA, realizado: PRENSA, series: [escrita(1, 80, 10)] }]),
    // La prensa del plan, hecha con la sentadilla: lo registrado es de la sentadilla.
    ejecucion('2026-11-05', [{ prescripto: PRENSA, realizado: SENTADILLA, series: [escrita(1, 22, 8)] }]),
  ];
  const [enLugarDe, conOtro] = vecesPasadas(historia, SENTADILLA.exerciseId);
  assert.equal(enLugarDe!.fecha, '2026-11-05');
  assert.equal(enLugarDe!.comparable, true);
  assert.equal(loQueSeHizo(enLugarDe!, 'profesional'), '22 kg × 8 · RIR 2 (en lugar de Prensa de piernas)');
  assert.equal(conOtro!.fecha, '2026-11-03');
  assert.equal(conOtro!.comparable, false);
  assert.deepEqual(conOtro!.como, { tipo: 'con-otro', nombre: 'Prensa de piernas', identidad: 'otro-ejercicio' });
  assert.equal(lineaDeLaVezPasada(conOtro!, HOY, 'persona'), 'La vez pasada, mar 3 nov: la hiciste con Prensa de piernas');
  assert.equal(loQueSeHizo(conOtro!, 'profesional'), 'se hizo con Prensa de piernas');
  // La función pura: la sustitución por otro ejercicio no es el mismo (la mutación que la toma como tal la pone en rojo).
  const roles = observacionesDelEjercicio(historia, `e:${SENTADILLA.exerciseId}`).map((o) => [o.rol, esDelMismoEjercicio(o)]);
  assert.deepEqual(roles, [
    ['sustituido', false],
    ['por-sustitucion', true],
  ]);
});

test('TEST-GR-001 · una versión que no se puede identificar no se toma como el mismo ejercicio', () => {
  const historia = [ejecucion('2026-11-03', [{ prescripto: SENTADILLA, realizado: SIN_IDENTIDAD, series: [escrita(1, 40, 10)] }])];
  const [vez] = vecesPasadas(historia, SENTADILLA.exerciseId);
  assert.equal(vez!.comparable, false);
  assert.deepEqual(vez!.como, { tipo: 'con-otro', nombre: 'Sentadilla en máquina', identidad: 'desconocida' });
  assert.equal(loQueSeHizo(vez!, 'profesional'), 'se registró con Sentadilla en máquina, que no se puede identificar como este ejercicio');
});

test('TEST-GR-001 · resumida: no tiene series y lo dice; no se sintetizan', () => {
  const [vez] = vecesPasadas([ejecucion('2026-11-03', [{ prescripto: SENTADILLA, resumen: 'Hice todo como el plan' }])], SENTADILLA.exerciseId);
  assert.deepEqual(vez!.como, { tipo: 'resumida' });
  assert.equal(vez!.comparable, false);
  assert.equal(loQueSeHizo(vez!, 'persona'), 'la registraste resumida, sin series');
  assert.equal(loQueSeHizo(vez!, 'profesional'), 'se registró resumida, sin series');
});

test('TEST-GR-001 · una serie que falta queda sin dato: cada serie dice su número, nunca se corre ni se completa', () => {
  const [vez] = vecesPasadas([ejecucion('2026-11-03', [{ prescripto: SENTADILLA, series: [escrita(1, 20, 8), escrita(3, 22, 6, null)] }])], SENTADILLA.exerciseId);
  assert.equal(loQueSeHizo(vez!, 'profesional'), 'serie 1: 20 kg × 8 · RIR 2, serie 3: 22 kg × 6');
  // Sin carga, las repeticiones; sin repeticiones, la carga. RIR 0 es una respuesta. kg y lb, cada uno con su unidad.
  assert.equal(textoDeLaSerie({ carga: null, repeticiones: 12, rir: 0 }), '12 rep. · RIR 0');
  assert.equal(textoDeLaSerie({ carga: { value: 45, unit: 'lb' }, repeticiones: null, rir: null }), '45 lb');
  assert.equal(textoDeLaSerie({ carga: { value: 22.5, unit: 'kg' }, repeticiones: 8, rir: 1.5 }), '22,5 kg × 8 · RIR 1,5');
});

// ─── Las palabras ───────────────────────────────────────────────────────────────────────────────────────────

test('TEST-GR-001 · las fechas, en pocas palabras y enteras para el lector', () => {
  assert.equal(fechaEnPocasPalabras('2026-11-03', HOY), 'mar 3 nov');
  assert.equal(fechaEnPocasPalabras('2026-09-24', HOY), 'jue 24 sept');
  assert.equal(fechaEnPocasPalabras('2025-12-30', '2026-01-10'), 'mar 30 dic 2025');
  assert.equal(fechaEnPocasPalabras(HOY, HOY), 'hoy');
  assert.equal(fechaEnPocasPalabras('2026-11-03', HOY, true), 'martes 3 de noviembre');
  assert.equal(fechaEnPocasPalabras('2025-12-30', '2026-01-10', true), 'martes 30 de diciembre de 2025');
});

test('TEST-GR-001 · sin flechas ni juicios: ninguna palabra prohibida de Entrenamiento ni de la fuerza', () => {
  const historia = [
    ejecucion('2026-10-28', [{ prescripto: PRENSA, series: [escrita(1, 80, 10)] }]),
    ejecucion('2026-11-03', [{ prescripto: SENTADILLA, realizado: PRENSA, series: [escrita(1, 80, 10)] }]),
    ejecucion('2026-11-05', [{ prescripto: SENTADILLA, series: [tildada(1), escrita(2, 22, 8)] }]),
    ejecucion('2026-11-07', [{ prescripto: SENTADILLA, resumen: 'Todo bien' }]),
  ];
  const textos = vecesPasadas(historia, SENTADILLA.exerciseId).flatMap((v) => [lineaDeLaVezPasada(v, HOY, 'persona'), lineaDeLaVezPasada(v, HOY, 'profesional', true)]);
  const copias = Object.values(COPY_LA_VEZ_PASADA).flatMap((v) => (typeof v === 'string' ? [v] : [String((v as unknown as (...a: string[]) => string)('persona', 'Prensa'))]));
  for (const t of [...textos, ...copias]) {
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    for (const p of TERMINOS_PROHIBIDOS_DE_FUERZA) assert.ok(!t.toLowerCase().includes(p), `${p} en «${t}»`);
    assert.doesNotMatch(t, /[↑↓→←▲▼]|mejor|peor|récord|subí|bajá/i, t);
  }
});
