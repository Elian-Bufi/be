/**
 * La sustitución de un ejercicio en la sesión enfocada de la APK (DL-151): `apps/mobile/src/sustitucion-de-ejercicio.ts`,
 * con la tabla de series (`series-de-la-sesion.ts`) y el almacén local (`almacen-de-entrenamiento.ts`).
 *
 * Recupera lo que hacía la 0.13.2, con sus reglas:
 *  1. lo planificado no se pisa: API-TRN-17 lleva solo el realizado, y el cuerpo cumple el contrato estricto;
 *  2. antes de la primera serie, el ejercicio se suma sin series, y la primera serie ya viaja con el realizado;
 *  3. con series registradas, pasan al realizado tal cual (no se borran, no se renumeran, no cambian sus datos), y antes
 *     se pregunta cuáles;
 *  4. volver al planificado sin series saca el ejercicio del borrador; con series, las devuelve al planificado;
 *  5. los tiempos no se tocan: la corrida, la medición abierta y la fila enfocada quedan iguales;
 *  6. finalizar avisa antes un ejercicio sustituido sin series (SET_REQUIRED), y el resumen muestra las dos puntas.
 *
 * **Lo que esto no prueba:** el diálogo dibujado, el teclado, TalkBack ni el pedido real al catálogo. Eso queda para el
 * teléfono. Lo que la API acepta de lo que manda la APK lo prueba `test/integration/sustitucion-en-la-sesion.int-spec.ts`.
 * Uso: node --test scripts/sustitucion-de-ejercicio.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Los módulos de la APK se importan entre sí sin extensión, como los resuelve Metro: Node necesita que se la agreguen.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sus = await import('../apps/mobile/src/sustitucion-de-ejercicio.ts');
const series = await import('../apps/mobile/src/series-de-la-sesion.ts');
const { crearAlmacenDeEntrenamiento } = await import('../apps/mobile/src/almacen-de-entrenamiento.ts');
const { estadoLocal } = await import('../apps/mobile/src/corrida-de-entrenamiento.ts');
const { crearReloj } = await import('../apps/mobile/src/reloj-de-sesion.ts');
const { BorradorDeEjecucionSchema, COPY_ENTRENAMIENTO, EditarBorradorDeEjecucionRequestSchema, SesionConObjetivosSchema } = await import('@be/domain');

// ─── Una sesión de dos ejercicios, como la daría API-SER-02 ─────────────────────────────────────

const objetivo = (setIndex) => ({ setIndex, note: null, target: { repetitions: { value: 10 }, rir: null, suggestedLoad: null, restSeconds: 90 }, targetOrigin: { rir: 'NONE', suggestedLoad: 'NONE', restSeconds: 'SET' } });
const prescripcion = (prescriptionId, order, exerciseVersionId, exerciseName, cuantas) => ({
  prescriptionId,
  order,
  exerciseId: `ej-${exerciseVersionId}`,
  exerciseVersionId,
  exerciseName,
  image: null,
  sets: Array.from({ length: cuantas }, (_, i) => objetivo(i + 1)),
  intensity: null,
  suggestedLoad: null,
  restSeconds: null,
  loadBasis: null,
  repetitionBasis: null,
  professionalParameters: [],
  note: null,
});
const SESION = SesionConObjetivosSchema.parse({
  sessionId: 'sesion-a',
  label: 'Empuje A',
  order: 1,
  instructions: null,
  prescriptions: [prescripcion('pA', 1, 'ev-press-de-banca', 'Press de banca', 3), prescripcion('pB', 2, 'ev-remo', 'Remo con barra', 2)],
});
const [BANCA, REMO] = SESION.prescriptions;
const MANCUERNAS = { versionId: 'ev-press-con-mancuernas', nombre: 'Press con mancuernas' };
const INCLINADO = { versionId: 'ev-press-inclinado', nombre: 'Press inclinado' };
const PLANIFICADO = { versionId: BANCA.exerciseVersionId, nombre: BANCA.exerciseName };

/** Una serie registrada por la persona. */
const serie = (setIndex, kg, reps) => ({ setIndex, load: { value: kg, unit: 'kg' }, completedRepetitions: reps, rir: null, perceivedExertion: null });
/** Un ejercicio del borrador, como lo devuelve la API: `substituted` lo calcula ella comparando las dos versiones. */
const registrado = (p, realizado, sets) => ({
  prescriptionId: p.prescriptionId,
  prescribedExerciseVersionId: p.exerciseVersionId,
  prescribedExerciseName: p.exerciseName,
  performedExerciseVersionId: realizado.versionId,
  performedExerciseName: realizado.nombre,
  substituted: realizado.versionId !== p.exerciseVersionId,
  sets,
  executionSummary: null,
});
const borrador = (version, cambios = {}) =>
  BorradorDeEjecucionSchema.parse({
    draftId: 'borrador-1',
    version,
    state: 'DRAFT',
    occurrenceId: 'occ_demo',
    date: '2026-10-19',
    timeZone: 'America/Argentina/Buenos_Aires',
    planId: 'plan-1',
    sessionId: 'sesion-a',
    granularity: null,
    sessionCondition: null,
    reason: null,
    exercises: [],
    sessionSummary: null,
    occurredAt: null,
    executionId: null,
    createdAt: '2026-10-19T12:00:00.000Z',
    updatedAt: '2026-10-19T12:00:00.000Z',
    ...cambios,
  });
const VACIO = borrador('v1');
/** El cuerpo de API-TRN-17 cumple el contrato estricto: lo planificado no tiene por dónde viajar. */
const valeParaLaApi = (changes) => EditarBorradorDeEjecucionRequestSchema.safeParse({ expectedVersion: 'v1', changes }).success;

// ─── 1. Lo planificado no se pisa ───────────────────────────────────────────────────────────────

test('1 · solo cambia el realizado: el cuerpo de API-TRN-17 no lleva nada de lo planificado y cumple el contrato estricto', () => {
  const cambios = sus.cambiosParaSustituir(VACIO, BANCA, MANCUERNAS.versionId);
  assert.ok(valeParaLaApi(cambios));
  assert.doesNotMatch(JSON.stringify(cambios), /prescribed|Press de banca/);
  // Lo que se ve sale del borrador que devuelve la API: el planificado, el ejecutado y la marca, que calcula ella.
  const guardado = borrador('v2', { granularity: 'SET', exercises: [registrado(BANCA, MANCUERNAS, [])] });
  assert.deepEqual(sus.sustitucionDe(BANCA, guardado, []), { prescriptionId: 'pA', planificado: PLANIFICADO, ejercicioDelPlanificado: BANCA.exerciseId, ejecutado: MANCUERNAS, registradas: 0 });
  assert.deepEqual(sus.sustitucionDe(REMO, guardado, []).ejecutado, null, 'el otro ejercicio no se toca');
  assert.deepEqual(sus.sustitucionDe(BANCA, VACIO, []), { prescriptionId: 'pA', planificado: PLANIFICADO, ejercicioDelPlanificado: BANCA.exerciseId, ejecutado: null, registradas: 0 });
});

test('1 · la búsqueda no ofrece como sustituto el que ya figura ni el planificado, en ninguna versión', () => {
  const encontrado = (exerciseId, versionId) => ({ exerciseId, versionId });
  const resultados = [encontrado(BANCA.exerciseId, BANCA.exerciseVersionId), encontrado(BANCA.exerciseId, 'ev-press-de-banca-v2'), encontrado('ej-mancuernas', MANCUERNAS.versionId), encontrado('ej-inclinado', INCLINADO.versionId)];
  const ids = (s) => sus.sustitutosPosibles(s, resultados).map((e) => e.versionId);
  assert.deepEqual(ids(sus.sustitucionDe(BANCA, VACIO, [])), [MANCUERNAS.versionId, INCLINADO.versionId]);
  // Ya sustituido por mancuernas: tampoco se ofrece él; el planificado tiene su botón, «Volver al planificado».
  const sustituido = borrador('v2', { granularity: 'SET', exercises: [registrado(BANCA, MANCUERNAS, [])] });
  assert.deepEqual(ids(sus.sustitucionDe(BANCA, sustituido, [])), [INCLINADO.versionId]);
});

test('1 · se ofrece con el borrador leído y por serie; por ejercicio o sesión, la pantalla ofrece antes pasar a por serie', () => {
  assert.equal(sus.sePuedeSustituir(null), false, 'sin el borrador no hay versión con la que guardar');
  assert.equal(sus.sePuedeSustituir(VACIO), true, 'sin la forma elegida, se elige por serie');
  assert.equal(sus.sePuedeSustituir(borrador('v2', { granularity: 'SET' })), true);
  assert.equal(sus.sePuedeSustituir(borrador('v2', { granularity: 'EXERCISE_OR_SESSION' })), false);
  assert.equal(sus.sePuedeSustituir({ ...VACIO, state: 'REGISTERED' }), false, 'una sesión registrada se corrige, no se sustituye');
});

// ─── 2. Antes de la primera serie ───────────────────────────────────────────────────────────────

test('2 · antes de la primera serie, el ejercicio se suma sin series y se elige por serie, como en la 0.13.2', () => {
  assert.deepEqual(sus.cambiosParaSustituir(VACIO, BANCA, MANCUERNAS.versionId), {
    granularity: 'SET',
    exercises: [{ prescriptionId: 'pA', performedExerciseVersionId: MANCUERNAS.versionId, sets: [] }],
  });
  // Sin series no hay nada que reasignar: no se pregunta.
  assert.equal(sus.textoDeLaConfirmacion(sus.sustitucionDe(BANCA, VACIO, []), MANCUERNAS), null);
  // Con otro ejercicio ya registrado, ese queda tal cual y no se vuelve a elegir la forma.
  const conRemo = borrador('v2', { granularity: 'SET', exercises: [registrado(REMO, { versionId: REMO.exerciseVersionId, nombre: REMO.exerciseName }, [serie(1, 40, 10)])] });
  assert.deepEqual(sus.cambiosParaSustituir(conRemo, BANCA, MANCUERNAS.versionId), {
    exercises: [
      { prescriptionId: 'pB', performedExerciseVersionId: REMO.exerciseVersionId, sets: [serie(1, 40, 10)] },
      { prescriptionId: 'pA', performedExerciseVersionId: MANCUERNAS.versionId, sets: [] },
    ],
  });
});

test('2 · la serie que se registra después viaja con el ejecutado, en su ejercicio', () => {
  const sustituido = borrador('v2', { granularity: 'SET', exercises: [registrado(BANCA, MANCUERNAS, [])] });
  assert.equal(sus.ejercicioRealizadoDe(sustituido, BANCA), MANCUERNAS.versionId);
  assert.equal(sus.ejercicioRealizadoDe(VACIO, BANCA), BANCA.exerciseVersionId, 'sin sustitución, el planificado');
  const local = { prescriptionId: 'pA', performedExerciseVersionId: sus.ejercicioRealizadoDe(sustituido, BANCA), serie: serie(1, 22, 10), enConflicto: false };
  assert.deepEqual(series.ejerciciosParaGuardar(sustituido, [local]).exercises, [{ prescriptionId: 'pA', performedExerciseVersionId: MANCUERNAS.versionId, sets: [serie(1, 22, 10)] }]);
});

// ─── 3. Con series registradas ──────────────────────────────────────────────────────────────────

test('3 · con series registradas pasan al ejecutado tal cual: mismas series, mismo orden, mismos datos; el resto no cambia', () => {
  const s1 = serie(1, 60, 10);
  const s3 = serie(3, 60, 8);
  const r1 = serie(1, 40, 12);
  const conSeries = borrador('v3', { granularity: 'SET', exercises: [registrado(BANCA, PLANIFICADO, [s1, s3]), registrado(REMO, { versionId: REMO.exerciseVersionId, nombre: REMO.exerciseName }, [r1])] });
  const cambios = sus.cambiosParaSustituir(conSeries, BANCA, MANCUERNAS.versionId);
  assert.deepEqual(cambios, {
    exercises: [
      { prescriptionId: 'pA', performedExerciseVersionId: MANCUERNAS.versionId, sets: [s1, s3] },
      { prescriptionId: 'pB', performedExerciseVersionId: REMO.exerciseVersionId, sets: [r1] },
    ],
  });
  assert.ok(valeParaLaApi(cambios));
  // El borrador que se usó no cambió: lo que se arma es una copia.
  assert.equal(conSeries.exercises[0].performedExerciseVersionId, BANCA.exerciseVersionId);
});

test('3 · antes de reasignar series se pregunta cuáles: también las del teléfono que todavía no se enviaron', () => {
  const unaGuardada = borrador('v2', { granularity: 'SET', exercises: [registrado(BANCA, PLANIFICADO, [serie(1, 60, 10)])] });
  assert.equal(
    sus.textoDeLaConfirmacion(sus.sustitucionDe(BANCA, unaGuardada, []), MANCUERNAS),
    'La serie que ya registraste de «Press de banca» pasa a contar como «Press con mancuernas». Sus datos no cambian, y lo planificado por tu profesional tampoco.',
  );
  // Una pendiente en el teléfono cuenta: cuando se envíe, se suma al ejercicio con su ejecutado.
  const pendiente = { prescriptionId: 'pA', performedExerciseVersionId: BANCA.exerciseVersionId, serie: serie(2, 60, 9), enConflicto: false };
  const conLaPendiente = sus.sustitucionDe(BANCA, unaGuardada, [pendiente]);
  assert.equal(conLaPendiente.registradas, 2);
  assert.match(sus.textoDeLaConfirmacion(conLaPendiente, MANCUERNAS), /^Las 2 series que ya registraste de «Press de banca» pasan a contar como «Press con mancuernas»/);
  // Ya sustituido, cambiar por otro dice desde cuál.
  const sustituido = borrador('v3', { granularity: 'SET', exercises: [registrado(BANCA, MANCUERNAS, [serie(1, 22, 10)])] });
  assert.match(sus.textoDeLaConfirmacion(sus.sustitucionDe(BANCA, sustituido, []), INCLINADO), /de «Press con mancuernas» pasa a contar como «Press inclinado»/);
  // Elegir el que ya figura no pregunta ni cambia nada.
  assert.equal(sus.textoDeLaConfirmacion(sus.sustitucionDe(BANCA, sustituido, []), MANCUERNAS), null);
  assert.equal(sus.cambiosParaSustituir(sustituido, BANCA, MANCUERNAS.versionId), null);
});

test('3 · una serie del teléfono que se envía después de sustituir se suma al ejercicio con su ejecutado: un ejercicio, un realizado', () => {
  // Se registró con el planificado, no se pudo enviar todavía, y mientras tanto se guardó la sustitución.
  const pendiente = { prescriptionId: 'pA', performedExerciseVersionId: BANCA.exerciseVersionId, serie: serie(2, 22, 9), enConflicto: false };
  const sustituido = borrador('v3', { granularity: 'SET', exercises: [registrado(BANCA, MANCUERNAS, [serie(1, 22, 10)])] });
  assert.deepEqual(series.ejerciciosParaGuardar(sustituido, [pendiente]).exercises, [{ prescriptionId: 'pA', performedExerciseVersionId: MANCUERNAS.versionId, sets: [serie(1, 22, 10), serie(2, 22, 9)] }]);
});

// ─── 4. Volver al planificado ───────────────────────────────────────────────────────────────────

test('4 · volver al planificado sin series saca el ejercicio: el borrador queda como antes de sustituir', () => {
  const sinSeries = borrador('v2', { granularity: 'SET', exercises: [registrado(BANCA, MANCUERNAS, [])] });
  assert.deepEqual(sus.cambiosParaSustituir(sinSeries, BANCA, PLANIFICADO.versionId), { exercises: [] });
  // Sin sustitución, «volver» no tiene nada que hacer.
  assert.equal(sus.cambiosParaSustituir(VACIO, BANCA, PLANIFICADO.versionId), null);
});

test('4 · volver al planificado con series las devuelve a él, tal cual, y antes lo pregunta', () => {
  const conSeries = borrador('v3', { granularity: 'SET', exercises: [registrado(BANCA, MANCUERNAS, [serie(1, 22, 10), serie(2, 22, 9)])] });
  assert.deepEqual(sus.cambiosParaSustituir(conSeries, BANCA, PLANIFICADO.versionId), {
    exercises: [{ prescriptionId: 'pA', performedExerciseVersionId: PLANIFICADO.versionId, sets: [serie(1, 22, 10), serie(2, 22, 9)] }],
  });
  assert.equal(
    sus.textoDeLaConfirmacion(sus.sustitucionDe(BANCA, conSeries, []), PLANIFICADO),
    'Las 2 series que ya registraste de «Press con mancuernas» pasan a contar como «Press de banca», el ejercicio planificado. Sus datos no cambian, y lo planificado por tu profesional tampoco.',
  );
});

// ─── 5. Los tiempos no se tocan ─────────────────────────────────────────────────────────────────

function almacenEnMemoria() {
  const datos = new Map();
  return { leer: async (k) => datos.get(k) ?? null, guardar: async (k, v) => void datos.set(k, v), borrar: async (k) => void datos.delete(k) };
}

test('5 · guardar la sustitución no toca la corrida: mismos eventos, el descanso sigue abierto y la fila enfocada es la misma', async () => {
  let n = 0;
  let segundos = 0;
  const api = {
    consultarBorradorDeEjecucion: async () => assert.fail('no se lee'),
    guardarBorradorDeEjecucion: async () => assert.fail('la sustitución la guarda la pantalla, no el envío de series'),
    registrarEventosDeTiempo: async () => assert.fail('no se envía'),
    tiemposDelBorrador: async () => assert.fail('no se lee'),
  };
  const reloj = crearReloj({ ancla: 'proceso-prueba', monotonico: () => 5_000 + segundos * 1000, civil: () => Date.parse('2026-10-19T12:00:00.000Z') + segundos * 1000 });
  const almacen = crearAlmacenDeEntrenamiento({ almacen: almacenEnMemoria(), api, reloj, nuevoId: (p) => `${p}-${String(++n).padStart(6, '0')}` });
  await almacen.abrirCuenta('cuenta-a', 'token-a');
  almacen.preparar({ draftId: 'borrador-1', occurrenceId: 'occ_demo', fecha: '2026-10-19', modo: 'en-vivo', etiqueta: 'Empuje A', sesion: SESION });
  almacen.fijarBorrador('borrador-1', borrador('v2', { granularity: 'SET', exercises: [registrado(BANCA, PLANIFICADO, [serie(1, 60, 10)])] }));
  // La sesión corre, con el descanso de la serie 1 en curso y la serie 2 enfocada.
  assert.equal(almacen.accion('borrador-1', { tipo: 'iniciar', prescriptionId: 'pA' }).ok, true);
  segundos = 75;
  assert.equal(almacen.accion('borrador-1', { tipo: 'iniciar-descanso', prescriptionId: 'pA', setIndex: 1 }).ok, true);
  segundos = 100;
  almacen.enfocar('borrador-1', { prescriptionId: 'pA', setIndex: 2 });
  const antes = almacen.sesion('borrador-1');
  // Lo que hace la pantalla al guardar: los cambios sobre el borrador vigente, y el borrador que devuelve la API.
  assert.ok(valeParaLaApi(sus.cambiosParaSustituir(antes.borrador, BANCA, MANCUERNAS.versionId)));
  almacen.fijarBorrador('borrador-1', borrador('v3', { granularity: 'SET', exercises: [registrado(BANCA, MANCUERNAS, [serie(1, 60, 10)])] }));
  const despues = almacen.sesion('borrador-1');
  assert.deepEqual(despues.corrida, antes.corrida, 'ningún evento nuevo, ninguno quitado: no se reinicia ni se duplica nada');
  assert.deepEqual(estadoLocal(despues.corrida).medicionAbierta, estadoLocal(antes.corrida).medicionAbierta);
  assert.equal(estadoLocal(despues.corrida).medicionAbierta.kind, 'REST');
  assert.deepEqual(despues.foco, { prescriptionId: 'pA', setIndex: 2 });
  assert.equal(despues.problema, null);
  // La serie guardada sigue guardada, ahora del ejecutado; la próxima viaja con él.
  assert.deepEqual(series.guardadasDe(despues.borrador, 'pA'), [serie(1, 60, 10)]);
  assert.equal(almacen.registrarSerie('borrador-1', { prescriptionId: 'pA', performedExerciseVersionId: sus.ejercicioRealizadoDe(despues.borrador, BANCA), serie: serie(2, 22, 10) }), 'registrada');
  assert.deepEqual(series.ejerciciosParaGuardar(despues.borrador, almacen.sesion('borrador-1').series).exercises, [{ prescriptionId: 'pA', performedExerciseVersionId: MANCUERNAS.versionId, sets: [serie(1, 60, 10), serie(2, 22, 10)] }]);
});

test('5 · la pantalla no marca tiempos al sustituir: `sustituir` no arma eventos ni cambia la fila enfocada', () => {
  const fuente = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx'), 'utf8');
  const inicio = fuente.indexOf('async function sustituir(');
  const cuerpo = fuente.slice(inicio, fuente.indexOf('\n  }\n', inicio));
  assert.ok(inicio > 0 && cuerpo.includes('cambiosParaSustituir(vigente'), 'la pantalla arma los cambios sobre el borrador vigente');
  assert.doesNotMatch(cuerpo, /\bhacer\(|\.accion\(|enfocar\(/);
});

// ─── 6. Antes de finalizar ──────────────────────────────────────────────────────────────────────

test('6 · un ejercicio sustituido sin series se dice antes de finalizar (API-TRN-18 lo rechaza con SET_REQUIRED)', () => {
  const sinSeries = borrador('v3', { granularity: 'SET', sessionCondition: 'COMPLETED', exercises: [registrado(REMO, { versionId: REMO.exerciseVersionId, nombre: REMO.exerciseName }, [serie(1, 40, 12)]), registrado(BANCA, MANCUERNAS, [])] });
  assert.equal(
    series.problemaParaConfirmar(sinSeries),
    `Sustituiste «Press de banca» por «Press con mancuernas», pero no registraste ninguna serie de ese ejercicio. Registrá una, o pasá a ese ejercicio y volvé al planificado desde «${COPY_ENTRENAMIENTO.sustituirEjercicio}».`,
  );
  // Con una serie, ya se puede.
  const conUna = { ...sinSeries, exercises: [sinSeries.exercises[0], registrado(BANCA, MANCUERNAS, [serie(1, 22, 10)])] };
  assert.equal(series.problemaParaConfirmar(conUna), null);
});

test('6 · el resumen antes de finalizar y la rutina muestran las dos puntas: el planificado y el ejecutado', () => {
  const sustituido = borrador('v3', { granularity: 'SET', exercises: [registrado(BANCA, MANCUERNAS, [serie(1, 22, 10)])] });
  assert.deepEqual(
    series.resumenDelRegistro(SESION, sustituido, []).map((r) => [r.nombre, r.ejecutado, r.registradas]),
    [
      ['Press de banca', 'Press con mancuernas', 1],
      ['Remo con barra', null, 0],
    ],
  );
});
