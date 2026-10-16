/**
 * Una sola sesión en curso por titular, del lado de la APK (defecto de la 0.15.0-candidata.1 visto en el teléfono el
 * 2026-10-08): con una sesión abierta del 6/10, Inicio ofrecía «Iniciar entrenamiento», se abría otro borrador y el rechazo
 * de la API (ANOTHER_SESSION_IN_PROGRESS) llegaba después, al registrar una serie.
 *  1. La decisión (`apps/mobile/src/sesion-en-curso.ts`): primero la sesión en curso que informa la API (de cualquier día
 *     y dispositivo), después la del teléfono; la misma ocurrencia se retoma.
 *  2. El recorrido en el almacén del teléfono, con la regla del dominio que aplica API-TIE-01: el inicio rechazado no
 *     pierde nada (los eventos quedan pendientes y la serie escrita viaja igual); cerrada la otra, el reintento manda los
 *     mismos eventos y no duplica nada.
 *  3. En el código de las pantallas: se consulta antes de abrir el borrador, Inicio muestra la sesión de otro día y la
 *     sesión enfocada ofrece resolver la otra.
 * Uso: node --test scripts/sesion-en-curso.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

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
const enCurso = await import('../apps/mobile/src/sesion-en-curso.ts');
const almacenes = await import('../apps/mobile/src/almacen-de-entrenamiento.ts');
const series = await import('../apps/mobile/src/series-de-la-sesion.ts');
const { crearReloj } = await import('../apps/mobile/src/reloj-de-sesion.ts');
const { aplicarEventos, SesionConObjetivosSchema } = await import('@be/domain');

// ─── 1. La decisión ─────────────────────────────────────────────────────────────────────────────

const DEL_6 = { draftId: 'borrador-6', occurrenceId: 'occ_sesion_a_06', date: '2026-10-06', sessionId: 'ses-a', sessionLabel: 'Sesión A', runId: 'corrida-6', state: 'IN_PROGRESS', startedAt: '2026-10-07T00:05:40.158Z', lastSequence: 18 };
const abierta = { registrados: [{ eventId: 'e1', runId: 'r', sequence: 1, compoundActionId: null, type: 'SESSION_STARTED', at: { civil: '2026-10-07T23:16:00.000Z', monotonic: null, source: 'CIVIL' } }], pendientes: [] };
const cerrada = { registrados: [...abierta.registrados, { eventId: 'e2', runId: 'r', sequence: 2, compoundActionId: null, type: 'SESSION_FINISHED', resolution: 'LEFT_INCOMPLETE', at: { civil: '2026-10-07T23:30:00.000Z', monotonic: null, source: 'DECLARED' } }], pendientes: [] };
const delTelefono = (occurrenceId, corrida, modo = 'en-vivo') => ({ draftId: `borrador-${occurrenceId}`, occurrenceId, fecha: '2026-10-07', etiqueta: 'Sesión A', modo, corrida });

test('1 · la sesión en curso que informa la API bloquea iniciar otra, aunque el teléfono no la tenga (el caso del 6/10)', () => {
  assert.deepEqual(enCurso.otraSesionEnCurso('occ_sesion_a_08', DEL_6, []), { draftId: 'borrador-6', occurrenceId: 'occ_sesion_a_06', fecha: '2026-10-06', etiqueta: 'Sesión A' });
  // La misma ocurrencia no bloquea: se retoma (otro dispositivo, o la app reinstalada).
  assert.equal(enCurso.otraSesionEnCurso('occ_sesion_a_06', DEL_6, []), null);
});

test('1 · sin una en la API, bloquea la corrida abierta del teléfono (un inicio que la API todavía no tiene)', () => {
  const del7 = delTelefono('occ_sesion_a_07', { registrados: [], pendientes: abierta.registrados });
  assert.equal(enCurso.otraSesionEnCurso('occ_sesion_a_08', null, [del7]).occurrenceId, 'occ_sesion_a_07');
  // Si la API no respondió, decide el teléfono.
  assert.equal(enCurso.otraSesionEnCurso('occ_sesion_a_08', undefined, [del7]).occurrenceId, 'occ_sesion_a_07');
  // No bloquean: la misma ocurrencia, una corrida cerrada, una sin empezar, ni el registro de otro día (no corre).
  assert.equal(enCurso.otraSesionEnCurso('occ_sesion_a_07', null, [del7]), null);
  assert.equal(enCurso.otraSesionEnCurso('occ_sesion_a_08', null, [delTelefono('occ_x', cerrada)]), null);
  assert.equal(enCurso.otraSesionEnCurso('occ_sesion_a_08', null, [delTelefono('occ_x', { registrados: [], pendientes: [] })]), null);
  assert.equal(enCurso.otraSesionEnCurso('occ_sesion_a_08', null, [delTelefono('occ_x', abierta, 'otro-dia')]), null);
  assert.equal(enCurso.otraSesionEnCurso('occ_sesion_a_08', undefined, []), null);
});

test('1 · lo que se muestra: primero la sesión en curso de la API, que es la que bloquea; resuelta, la del teléfono', () => {
  const del7 = delTelefono('occ_sesion_a_07', { registrados: [], pendientes: abierta.registrados });
  assert.equal(enCurso.sesionEnCursoParaMostrar(DEL_6, [del7]).occurrenceId, 'occ_sesion_a_06');
  assert.equal(enCurso.sesionEnCursoParaMostrar(null, [del7]).occurrenceId, 'occ_sesion_a_07');
  assert.equal(enCurso.sesionEnCursoParaMostrar(undefined, []), null);
});

// ─── 2. El recorrido en el almacén del teléfono ─────────────────────────────────────────────────

const SESION = SesionConObjetivosSchema.parse({
  sessionId: 'ses-a',
  label: 'Sesión A',
  order: 1,
  instructions: null,
  prescriptions: ['rx-banca', 'rx-sentadilla'].map((id, i) => ({
    prescriptionId: id,
    order: i + 1,
    exerciseId: `ej-${id}`,
    exerciseVersionId: `ev-${id}`,
    exerciseName: id,
    image: null,
    sets: [{ setIndex: 1, note: null, target: { repetitions: { min: 8, max: 10 }, rir: null, suggestedLoad: null, restSeconds: null }, targetOrigin: { rir: 'NONE', suggestedLoad: 'NONE', restSeconds: 'NONE' } }],
    intensity: null,
    suggestedLoad: null,
    restSeconds: null,
    loadBasis: null,
    repetitionBasis: null,
    professionalParameters: [],
    note: null,
  })),
});

const BORRADOR = { draftId: 'borrador-7', version: 'v1', state: 'DRAFT', occurrenceId: 'occ_sesion_a_07', date: '2026-10-07', timeZone: 'America/Argentina/Buenos_Aires', planId: 'plan-1', sessionId: 'ses-a', granularity: null, sessionCondition: null, reason: null, exercises: [], sessionSummary: null, occurredAt: null, executionId: null, createdAt: '2026-10-07T23:16:15.414Z', updatedAt: '2026-10-07T23:16:15.414Z' };

/** Una API que aplica la regla del dominio de API-TIE-01, con otra sesión del titular en curso hasta que se cierra. */
function apiConOtraEnCurso() {
  const api = {
    otraAbierta: true,
    delServidor: [],
    pedidosDeTiempos: 0,
    guardados: [],
    borrador: BORRADOR,
    consultarBorradorDeEjecucion: async () => ({ ok: true, datos: { data: api.borrador } }),
    async guardarBorradorDeEjecucion(_t, _d, cuerpo) {
      api.guardados.push(cuerpo);
      api.borrador = { ...api.borrador, version: `v${Number(api.borrador.version.slice(1)) + 1}`, granularity: 'SET', exercises: cuerpo.changes.exercises.map((e) => ({ ...e, prescribedExerciseVersionId: e.performedExerciseVersionId, prescribedExerciseName: e.prescriptionId, performedExerciseName: e.prescriptionId, substituted: false, executionSummary: null })) };
      return { ok: true, datos: { data: api.borrador } };
    },
    tiemposDelBorrador: async () => assert.fail('no se usa'),
    async registrarEventosDeTiempo(_t, _d, { events }) {
      api.pedidosDeTiempos++;
      const { resultados, aRegistrar } = aplicarEventos(api.delServidor, events, { prescripciones: new Set(['rx-banca', 'rx-sentadilla']), otraSesionEnCurso: api.otraAbierta && events.some((e) => e.type === 'SESSION_STARTED') });
      api.delServidor.push(...aRegistrar);
      return { ok: true, datos: { data: { results: resultados, timing: { events: api.delServidor.map((event) => ({ event, receivedAt: '2026-10-07T23:20:00.000Z' })) } } } };
    },
  };
  return api;
}

function almacenEnMemoria() {
  const datos = new Map();
  return { leer: async (k) => datos.get(k) ?? null, guardar: async (k, v) => void datos.set(k, v), borrar: async (k) => void datos.delete(k) };
}

/** El estado del teléfono del 7/10: la sesión iniciada en el teléfono y su inicio rechazado por la del 6/10. */
async function inicioRechazado() {
  const api = apiConOtraEnCurso();
  let n = 0;
  const reloj = { ms: 0 };
  const a = almacenes.crearAlmacenDeEntrenamiento({ almacen: almacenEnMemoria(), api, reloj: crearReloj({ ancla: 'proceso-prueba', monotonico: () => reloj.ms, civil: () => Date.parse('2026-10-07T23:16:20.000Z') + reloj.ms }), nuevoId: (p) => `${p}-${String(++n).padStart(6, '0')}` });
  await a.abrirCuenta('cuenta-a01', 'token');
  a.preparar({ draftId: 'borrador-7', occurrenceId: 'occ_sesion_a_07', fecha: '2026-10-07', modo: 'en-vivo', etiqueta: 'Sesión A', sesion: SESION });
  a.fijarBorrador('borrador-7', BORRADOR);
  // La candidata dejaba iniciar: el teléfono no sabía de la sesión del 6/10.
  assert.equal(a.accion('borrador-7', { tipo: 'iniciar', prescriptionId: 'rx-banca' }).ok, true);
  await a.sincronizar('borrador-7');
  return { a, api, reloj };
}

test('2 · el inicio rechazado no pierde nada; cerrada la otra, el reintento manda los mismos eventos, sin duplicar', async () => {
  const { a, api, reloj } = await inicioRechazado();
  let s = a.sesion('borrador-7');
  assert.deepEqual(s.problema, { tipo: 'conflicto', de: 'tiempos', motivo: 'ANOTHER_SESSION_IN_PROGRESS' });
  assert.equal(s.corrida.pendientes.length, 2, 'el inicio y el ejercicio activo quedan en el teléfono');
  // Lo que la persona sigue haciendo: una serie cronometrada y una serie escrita.
  reloj.ms += 30_000;
  a.accion('borrador-7', { tipo: 'cronometrar-serie', prescriptionId: 'rx-banca', setIndex: 1 });
  reloj.ms += 40_000;
  a.accion('borrador-7', { tipo: 'finalizar-serie' });
  const lectura = series.leerFila({ carga: '40', repeticiones: '10', rir: '2' }, 1, 'kg');
  assert.equal(a.registrarSerie('borrador-7', { prescriptionId: 'rx-banca', performedExerciseVersionId: 'ev-rx-banca', serie: lectura.serie }), 'registrada');
  const pedidosAntes = api.pedidosDeTiempos;
  await a.sincronizar('borrador-7');
  s = a.sesion('borrador-7');
  // La serie escrita viaja igual (API-TRN-17 no depende de los tiempos); los tiempos esperan la decisión.
  assert.equal(api.guardados.length, 1);
  assert.equal(api.borrador.exercises[0].sets[0].completedRepetitions, 10);
  assert.equal(s.series.length, 0, 'ya está en el borrador del servidor');
  assert.equal(api.pedidosDeTiempos, pedidosAntes, 'con el conflicto sin resolver, no se reenvían los tiempos solos');
  assert.equal(s.corrida.pendientes.length, 4, 'nada de lo marcado se descarta');
  // La persona deja incompleta la del 6/10; la pantalla reintenta esta.
  api.otraAbierta = false;
  const ids = s.corrida.pendientes.map((e) => e.eventId);
  await a.reintentar('borrador-7');
  s = a.sesion('borrador-7');
  assert.equal(s.problema, null);
  assert.equal(s.corrida.pendientes.length, 0);
  assert.deepEqual(api.delServidor.map((e) => e.eventId), ids, 'los mismos eventos, con sus instantes de entonces');
  // Un reenvío de lo mismo (una respuesta perdida) es DUPLICATE: nada se registra dos veces.
  const r = await api.registrarEventosDeTiempo('token', 'borrador-7', { events: api.delServidor.slice() });
  assert.deepEqual([...new Set(r.datos.data.results.map((x) => x.status))], ['DUPLICATE']);
  assert.equal(api.delServidor.length, 4);
});

test('2 · «Dejarlo incompleto» una sesión con el inicio rechazado: cerrada la otra, se guarda entera, sin afirmar el fin', async () => {
  const { a, api } = await inicioRechazado();
  api.otraAbierta = false;
  assert.equal(a.accion('borrador-7', { tipo: 'dejar-incompleta' }).ok, true);
  // Solo sincronizar no alcanza: el conflicto anterior frena los tiempos. Por eso el aviso reintenta antes de esperar.
  await a.sincronizar('borrador-7');
  assert.equal(api.delServidor.length, 0);
  await a.reintentar('borrador-7');
  assert.deepEqual(
    api.delServidor.map((e) => [e.type, e.resolution ?? null, e.at.source]),
    [
      ['SESSION_STARTED', null, 'MONOTONIC'],
      ['EXERCISE_ACTIVATED', null, 'MONOTONIC'],
      ['SESSION_FINISHED', 'LEFT_INCOMPLETE', 'DECLARED'],
    ],
  );
  assert.equal(a.sesion('borrador-7').problema, null);
  assert.equal(a.sesion('borrador-7').corrida.pendientes.length, 0);
});

// ─── 3. En el código de las pantallas ───────────────────────────────────────────────────────────

const fuente = (ruta) => readFileSync(resolve(RAIZ, ruta), 'utf8');

test('3 · antes de abrir el borrador se consulta la sesión en curso, y si hay otra no se abre nada', () => {
  const ENTRENAMIENTO = fuente('apps/mobile/src/pantallas/entrenamiento.tsx');
  const abrir = ENTRENAMIENTO.slice(ENTRENAMIENTO.indexOf('  async function abrir() {'), ENTRENAMIENTO.indexOf('  return { abriendo, fallo, abrir, otraEnCurso } as const;'));
  const consulta = abrir.indexOf('await api.sesionEnCurso(token)');
  const decision = abrir.indexOf('if (otra) return setOtraEnCurso(otra);');
  const borrador = abrir.indexOf('await api.abrirBorradorDeEjecucion(token, o.occurrenceId)');
  assert.ok(consulta > 0 && decision > consulta && borrador > decision, 'API-TIE-04 y la decisión van antes de API-TRN-15');
  assert.match(abrir, /otraSesionEnCurso\(o\.occurrenceId, enCurso\.ok \? enCurso\.datos\.data\.inProgress : undefined, entrenamientoLocal\.sesiones\(\)\)/);
  // Las dos tarjetas que ofrecen «Iniciar entrenamiento» muestran la otra sesión, y dejada incompleta vuelven a intentar.
  const INICIO = fuente('apps/mobile/src/pantallas/inicio-entrenamiento.tsx');
  for (const [nombre, codigo] of [
    ['Entrenamiento', ENTRENAMIENTO],
    ['Inicio', INICIO],
  ]) {
    assert.match(codigo, /\{otraEnCurso \? <AvisoDeEntrenamientoEnCurso enCurso=\{otraEnCurso\} token=\{token\} sesionPerdida=\{sesionPerdida\} ir=\{ir\} alTerminar=\{\(\) => void abrir\(\)\} motivo=\{MOTIVO_ANTES_DE_INICIAR\} \/> : null\}/, nombre);
  }
});

test('3 · Inicio muestra la sesión en curso de otro día, y la sesión enfocada ofrece resolver la que la bloquea', () => {
  const INICIO = fuente('apps/mobile/src/pantallas/inicio-entrenamiento.tsx');
  assert.match(INICIO, /useLecturaRecordada\(token, 'entrenamiento-en-curso', pedirEnCurso, sesionPerdida\)/, 'la misma lectura que Entrenamiento');
  assert.match(INICIO, /const deOtroDia = ahora && !hoy\.occurrences\.some\(\(o\) => o\.occurrenceId === ahora\.occurrenceId\) \? ahora : null;/);
  assert.match(INICIO, /enCurso=\{ahora\?\.occurrenceId === o\.occurrenceId\}/, '«Continuar» si es la sesión en curso');
  const ENTRENAMIENTO = fuente('apps/mobile/src/pantallas/entrenamiento.tsx');
  assert.match(ENTRENAMIENTO, /local\.problema\.motivo === 'ANOTHER_SESSION_IN_PROGRESS'/);
  assert.match(ENTRENAMIENTO, /<OtraSesionQueBloquea draftId=\{draftId\} token=\{token\} sesionPerdida=\{sesionPerdida\} ir=\{ir\} alTerminar=\{\(\) => entrenamientoLocal\.reintentar\(draftId\)\} \/>/);
  const ENFOCADA = fuente('apps/mobile/src/pantallas/sesion-enfocada.tsx');
  assert.doesNotMatch(ENFOCADA, /desde Entrenamiento, y después reintentá/, 'ya no manda a otra pantalla a resolverlo');
  // Lo que se muestra va primero por la API, en Inicio y en Entrenamiento.
  assert.match(INICIO, /const ahora = sesionEnCursoParaMostrar\(remota, local\.sesiones\(\)\);/);
  assert.match(ENTRENAMIENTO, /const ahora: EnCurso \| null = sesionEnCursoParaMostrar\(remota, local\.sesiones\(\)\);/);
  // «Dejarlo incompleto» reintenta lo pendiente antes de esperar el envío.
  const dejar = ENTRENAMIENTO.slice(ENTRENAMIENTO.indexOf('  async function dejarIncompleto() {'), ENTRENAMIENTO.indexOf('    alTerminar();'));
  assert.ok(dejar.indexOf('await entrenamientoLocal.reintentar(e.draftId);') > 0 && dejar.indexOf('await entrenamientoLocal.reintentar(e.draftId);') < dejar.indexOf('sincronizarYEsperar(e.draftId)'));
});
