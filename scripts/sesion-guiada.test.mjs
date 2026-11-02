/**
 * La sesión guiada de la APK (PA-01 «Lo escrito no se pierde» y PA-02 «La sesión guiada», decisiones de Dirección del
 * 2026-11-02; contrato DL-161: `recordedAs` y `durationSeconds`).
 *
 * Lo que se prueba, sin teléfono:
 *  1. tildar una fila registra lo escrito y, en lo vacío, lo planificado que se veía; `recordedAs` dice cómo se cargó, y
 *     un rango de repeticiones no se convierte en un número;
 *  2. el tiempo de la serie: se escribe en minutos y segundos o en segundos, es opcional y va en `durationSeconds`;
 *  3. destildar: lo escrito vuelve a la fila, y la próxima API-TRN-17 saca la serie del borrador del servidor;
 *  4. lo escrito se guarda en el teléfono con una demora corta y al instante con `guardarYa`, con su unidad, y vuelve
 *     igual en un proceso nuevo; lo guardado con otra forma no anula la sesión;
 *  5. «Antes de finalizar» lista lo escrito sin registrar y lo registra de una;
 *  6. la franja: los tramos, la cuenta y «Ejercicio 2 de 5 · Serie 3 de 4»;
 *  7. el copy nuevo no califica.
 *
 * **Lo que esto no prueba:** el dibujo, el teclado de Android, el reloj de la fila en un teléfono ni TalkBack. Eso queda
 * para la candidata.
 * Uso: node --test scripts/sesion-guiada.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

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

const series = await import('../apps/mobile/src/series-de-la-sesion.ts');
const franja = await import('../apps/mobile/src/franja-de-la-sesion.ts');
const { TEXTOS_DE_LA_SESION, enumerar } = await import('../apps/mobile/src/textos-de-la-sesion.ts');
const { crearAlmacenDeEntrenamiento, claveDeLaCuenta, DEMORA_DE_LO_ESCRITO_MS } = await import('../apps/mobile/src/almacen-de-entrenamiento.ts');
const { crearReloj } = await import('../apps/mobile/src/reloj-de-sesion.ts');
const { COPY_ENTRENAMIENTO_POR_SERIE, EditarBorradorDeEjecucionRequestSchema, terminosProhibidosDeEntrenamientoEn } = await import('@be/domain');

// ─── Una sesión chica, como la daría API-SER-02 ─────────────────────────────────────────────────

const objetivo = (repetitions, suggestedLoad, rir = null) => ({ repetitions, rir, suggestedLoad, restSeconds: 90 });
const serieConObjetivo = (setIndex, target) => ({ setIndex, note: null, target, targetOrigin: { rir: target.rir === null ? 'NONE' : 'SET', suggestedLoad: target.suggestedLoad === null ? 'NONE' : 'SET', restSeconds: 'SET' } });
const prescripcion = (prescriptionId, order, nombre, sets) => ({
  prescriptionId,
  order,
  exerciseId: `ej-${prescriptionId}`,
  exerciseVersionId: `ev-${prescriptionId}`,
  exerciseName: nombre,
  image: null,
  sets,
  intensity: null,
  suggestedLoad: null,
  restSeconds: null,
  loadBasis: null,
  repetitionBasis: null,
  professionalParameters: [],
  note: null,
});
const GOBLET = prescripcion('pA', 1, 'Sentadilla goblet', [1, 2, 3].map((n) => serieConObjetivo(n, objetivo({ min: 12, max: 16 }, { value: 16, unit: 'kg' }, 3))));
const REMO = prescripcion('pB', 2, 'Remo con mancuerna', [1, 2].map((n) => serieConObjetivo(n, objetivo({ value: 10 }, { value: 35, unit: 'lb' }, 2))));
const PLANCHA = prescripcion('pC', 3, 'Plancha', [serieConObjetivo(1, objetivo({ min: 8, max: 10 }, null))]);
const SESION = { sessionId: 'sesion-1', label: 'Tren superior', order: 1, instructions: null, prescriptions: [GOBLET, REMO, PLANCHA] };

const BORRADOR = {
  draftId: 'borrador-1',
  version: 'v1',
  state: 'DRAFT',
  occurrenceId: 'occ-1',
  date: '2026-11-02',
  timeZone: 'America/Argentina/Buenos_Aires',
  planId: 'plan-1',
  sessionId: 'sesion-1',
  granularity: null,
  sessionCondition: null,
  reason: null,
  exercises: [],
  sessionSummary: null,
  occurredAt: null,
  executionId: null,
  createdAt: '2026-11-02T13:00:00.000Z',
  updatedAt: '2026-11-02T13:00:00.000Z',
};
const ejercicioDelServidor = (prescriptionId, sets, extra = {}) => ({
  prescriptionId,
  prescribedExerciseVersionId: `ev-${prescriptionId}`,
  prescribedExerciseName: prescriptionId,
  performedExerciseVersionId: `ev-${prescriptionId}`,
  performedExerciseName: prescriptionId,
  substituted: false,
  sets,
  executionSummary: null,
  ...extra,
});
const vacia = { carga: '', repeticiones: '', rir: '' };
const objetivoDe = (p, n) => p.sets.find((s) => s.setIndex === n).target;

// ─── 1. Tildar ──────────────────────────────────────────────────────────────────────────────────

test('1 · tildar sin escribir registra lo planificado que se veía: AS_PLANNED, y un rango de repeticiones queda sin informar', () => {
  const r = series.serieAlTildar(vacia, objetivoDe(GOBLET, 1), 1, 'kg');
  assert.equal(r.ok, true);
  assert.deepEqual(r.serie, { setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: null, rir: 3, perceivedExertion: null, recordedAs: 'AS_PLANNED' });
  // Con un número de repeticiones planificado, ese número; la carga del plan conserva su unidad (35 lb en una columna en kg).
  assert.deepEqual(series.serieAlTildar(vacia, objetivoDe(REMO, 2), 2, 'kg').serie, { setIndex: 2, load: { value: 35, unit: 'lb' }, completedRepetitions: 10, rir: 2, perceivedExertion: null, recordedAs: 'AS_PLANNED' });
  // El cuerpo cumple el contrato estricto de API-TRN-17 con los campos de DL-161.
  const { exercises } = series.ejerciciosParaGuardar(BORRADOR, [{ prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie: { ...r.serie, durationSeconds: 45 }, enConflicto: false }]);
  assert.equal(EditarBorradorDeEjecucionRequestSchema.safeParse({ expectedVersion: 'v1', changes: { granularity: 'SET', exercises } }).success, true);
});

test('1 · con algo escrito es TYPED: lo escrito manda y lo vacío toma el plan; el tiempo no cambia cómo se cargó', () => {
  assert.deepEqual(series.serieAlTildar({ carga: '', repeticiones: '14', rir: '' }, objetivoDe(GOBLET, 1), 1, 'kg').serie, { setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: 14, rir: 3, perceivedExertion: null, recordedAs: 'TYPED' });
  assert.deepEqual(series.serieAlTildar({ carga: '17,5', repeticiones: '', rir: '0' }, objetivoDe(REMO, 1), 1, 'lb').serie, { setIndex: 1, load: { value: 17.5, unit: 'lb' }, completedRepetitions: 10, rir: 0, perceivedExertion: null, recordedAs: 'TYPED' });
  // Solo el tiempo: los valores son los del plan, así que sigue siendo AS_PLANNED, con su duración.
  assert.deepEqual(series.serieAlTildar({ ...vacia, tiempo: '1:30' }, objetivoDe(REMO, 1), 1, 'kg').serie, { setIndex: 1, load: { value: 35, unit: 'lb' }, completedRepetitions: 10, rir: 2, perceivedExertion: null, recordedAs: 'AS_PLANNED', durationSeconds: 90 });
});

test('1 · sin carga ni repeticiones, ni escritas ni planificadas, no hay serie: se dice qué anotar, nunca se fabrica', () => {
  assert.deepEqual(series.serieAlTildar(vacia, objetivoDe(PLANCHA, 1), 1, 'kg'), { ok: false, errores: { fila: TEXTOS_DE_LA_SESION.repeticionesEnRango('8–10') } });
  assert.deepEqual(series.serieAlTildar(vacia, null, 4, 'kg'), { ok: false, errores: { fila: COPY_ENTRENAMIENTO_POR_SERIE.faltaUnDato } });
  // Solo el RIR, sin plan de carga ni de repeticiones: tampoco.
  assert.equal(series.serieAlTildar({ ...vacia, rir: '2' }, null, 4, 'kg').ok, false);
  // Lo escrito se valida como siempre, también el tiempo.
  assert.deepEqual(series.serieAlTildar({ carga: '-4', repeticiones: '', rir: '', tiempo: 'mucho' }, objetivoDe(GOBLET, 1), 1, 'kg').errores, { carga: 'La carga no puede ser negativa.', tiempo: TEXTOS_DE_LA_SESION.tiempoIlegible });
  // La carga 0 planificada es un valor: se registra 0 kg.
  assert.deepEqual(series.serieAlTildar(vacia, objetivo({ min: 8, max: 10 }, { value: 0, unit: 'kg' }), 1, 'kg').serie.load, { value: 0, unit: 'kg' });
});

// ─── 2. El tiempo ───────────────────────────────────────────────────────────────────────────────

test('2 · el tiempo se escribe en segundos, en minutos y segundos o con horas; vacío es null y nunca se infiere', () => {
  const segundos = (t) => series.leerTiempo(t);
  assert.deepEqual(segundos(''), { ok: true, segundos: null });
  assert.deepEqual(segundos('  '), { ok: true, segundos: null });
  assert.deepEqual(segundos('45'), { ok: true, segundos: 45 });
  assert.deepEqual(segundos('1:30'), { ok: true, segundos: 90 });
  assert.deepEqual(segundos('01:30'), { ok: true, segundos: 90 });
  assert.deepEqual(segundos('90:00'), { ok: true, segundos: 5400 });
  assert.deepEqual(segundos('1:02:30'), { ok: true, segundos: 3750 });
  assert.equal(segundos('1:75').ok, false);
  assert.equal(segundos('1:5').ok, false);
  assert.equal(segundos('uno').ok, false);
  assert.deepEqual(segundos('99999'), { ok: false, error: TEXTOS_DE_LA_SESION.tiempoMaximo });
  assert.equal(series.textoDeTiempo(90), '01:30');
  assert.equal(series.textoDeTiempo(3750), '1:02:30');
});

// ─── 3. Destildar ───────────────────────────────────────────────────────────────────────────────

test('3 · destildar devuelve lo escrito: una TYPED vuelve con sus valores; una AS_PLANNED, vacía y con el plan en gris', () => {
  assert.deepEqual(series.escritaDeLaSerie({ setIndex: 1, load: { value: 17.5, unit: 'kg' }, completedRepetitions: 14, rir: 2, perceivedExertion: null, recordedAs: 'TYPED', durationSeconds: 45 }, 'kg'), { carga: '17,5', repeticiones: '14', rir: '2', tiempo: '00:45', unidad: 'kg' });
  assert.deepEqual(series.escritaDeLaSerie({ setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: null, rir: 3, perceivedExertion: null, recordedAs: 'AS_PLANNED' }, 'kg'), { carga: '', repeticiones: '', rir: '', tiempo: '', unidad: 'kg' });
  // Sin `recordedAs` es TYPED: así quedó todo lo registrado antes de DL-161.
  assert.equal(series.escritaDeLaSerie({ setIndex: 2, load: null, completedRepetitions: 9, rir: null, perceivedExertion: null }, 'lb').repeticiones, '9');
});

test('3 · API-TRN-17 saca del borrador lo destildado; lo que el servidor no tiene ya está deshecho', () => {
  const s = (setIndex, completedRepetitions) => ({ setIndex, load: null, completedRepetitions, rir: null, perceivedExertion: null });
  const borrador = { exercises: [ejercicioDelServidor('pA', [s(1, 12), s(2, 11)]), ejercicioDelServidor('pB', [s(1, 10)]), ejercicioDelServidor('pC', [s(1, 8)], { substituted: true, performedExerciseVersionId: 'ev-otro' })] };
  const r = series.ejerciciosParaGuardar(borrador, [], [
    { prescriptionId: 'pA', setIndex: 2 },
    { prescriptionId: 'pB', setIndex: 1 },
    { prescriptionId: 'pC', setIndex: 1 },
    { prescriptionId: 'pA', setIndex: 3 },
  ]);
  // pA queda con la 1; pB, sin series y sin sustitución, sale del pedido; pC conserva la sustitución, sin series.
  assert.deepEqual(r.exercises, [
    { prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', sets: [s(1, 12)] },
    { prescriptionId: 'pC', performedExerciseVersionId: 'ev-otro', sets: [] },
  ]);
  assert.deepEqual(r.quitadasAplicadas.map((q) => `${q.prescriptionId}:${q.setIndex}`), ['pA:2', 'pB:1', 'pC:1']);
  assert.deepEqual(r.quitadasSinEfecto.map((q) => `${q.prescriptionId}:${q.setIndex}`), ['pA:3']);
  // Destildada y vuelta a registrar con otros datos: la del teléfono reemplaza a la del servidor, sin conflicto.
  const otra = { prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie: s(2, 9), enConflicto: false };
  const quitadas = [{ prescriptionId: 'pA', setIndex: 2 }];
  assert.deepEqual(series.conciliarSeries([otra], borrador, quitadas).map((l) => l.enConflicto), [false]);
  assert.deepEqual(series.conciliarSeries([otra], borrador).map((l) => l.enConflicto), [true], 'sin destildar, sigue siendo un conflicto');
  const reemplazo = series.ejerciciosParaGuardar(borrador, [otra], quitadas);
  assert.deepEqual(reemplazo.exercises[0].sets, [s(1, 12), s(2, 9)]);
  assert.deepEqual(reemplazo.ocupadas, []);
});

test('3 · cómo se cargó y cuánto duró cuentan para reconocer una serie que el servidor ya tiene', () => {
  const base = { setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: null, rir: 3, perceivedExertion: null };
  assert.equal(series.mismosDatos(base, { ...base, recordedAs: 'TYPED' }), true, 'ausente es TYPED');
  assert.equal(series.mismosDatos({ ...base, recordedAs: 'AS_PLANNED' }, base), false);
  assert.equal(series.mismosDatos({ ...base, durationSeconds: 40 }, { ...base, durationSeconds: null }), false);
  assert.equal(series.mismosDatos({ ...base, durationSeconds: null }, base), true);
});

// ─── 4. Lo escrito en el teléfono ───────────────────────────────────────────────────────────────

function almacenEnMemoria(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return { datos, escrituras: 0, leer: async (k) => datos.get(k) ?? null, guardar: async function (k, v) { this.escrituras++; datos.set(k, v); }, borrar: async (k) => void datos.delete(k) };
}

/** Un programador a pedido: la demora no corre sola. */
function programadorManual() {
  const tareas = [];
  return {
    tareas,
    programar(hacer, ms) {
      const tarea = { hacer, ms, cancelada: false };
      tareas.push(tarea);
      return () => (tarea.cancelada = true);
    },
    correr() {
      for (const t of tareas.splice(0)) if (!t.cancelada) t.hacer();
    },
    pendientes: () => tareas.filter((t) => !t.cancelada).length,
  };
}

function apiDePrueba(borrador = BORRADOR) {
  const api = {
    pedidos: [],
    borrador,
    consultarBorradorDeEjecucion: async () => ({ ok: true, datos: { data: api.borrador } }),
    guardarBorradorDeEjecucion: async (_t, _d, cuerpo) => {
      api.pedidos.push(cuerpo);
      const exercises = cuerpo.changes.exercises.map((e) => ejercicioDelServidor(e.prescriptionId, e.sets ?? null, { performedExerciseVersionId: e.performedExerciseVersionId }));
      api.borrador = { ...api.borrador, version: `v${api.pedidos.length + 1}`, granularity: 'SET', exercises };
      return { ok: true, datos: { data: api.borrador } };
    },
    registrarEventosDeTiempo: async () => assert.fail('sin eventos'),
    tiemposDelBorrador: async () => assert.fail('no se usa'),
  };
  return api;
}

async function almacenListo({ plano = almacenEnMemoria(), api = apiDePrueba(), programador = programadorManual() } = {}) {
  let n = 0;
  const almacen = crearAlmacenDeEntrenamiento({ almacen: plano, api, reloj: crearReloj({ ancla: 'proceso-prueba', monotonico: () => 0, civil: () => 0 }), nuevoId: (p) => `${p}-${++n}`, programar: programador.programar });
  await almacen.abrirCuenta('cuenta-a', 'token-a');
  if (!almacen.sesion('borrador-1')) almacen.preparar({ draftId: 'borrador-1', occurrenceId: 'occ-1', fecha: '2026-11-02', modo: 'otro-dia', etiqueta: 'Tren superior', sesion: SESION });
  await almacen.escrituras();
  return { almacen, plano, api, programador };
}

test('4 · lo escrito se ve al instante, se guarda con una demora de unos 400 ms y vuelve igual en un proceso nuevo, con su unidad', async () => {
  const { almacen, plano, programador } = await almacenListo();
  assert.equal(DEMORA_DE_LO_ESCRITO_MS, 400);
  const antes = plano.escrituras;
  almacen.escribirEnFila('borrador-1', 'pB:1', { carga: '35', repeticiones: '', rir: '', tiempo: '', unidad: 'lb' });
  almacen.escribirEnFila('borrador-1', 'pB:1', { carga: '35', repeticiones: '1', rir: '', tiempo: '', unidad: 'lb' });
  almacen.escribirEnFila('borrador-1', 'pB:1', { carga: '35', repeticiones: '10', rir: '', tiempo: '', unidad: 'lb' });
  assert.equal(almacen.sesion('borrador-1').escritas['pB:1'].repeticiones, '10', 'se ve al instante');
  assert.equal(almacen.estadoDelGuardado(), 'guardando', 'todavía no está en el teléfono');
  assert.equal(programador.pendientes(), 1, 'una sola escritura demorada por pausa, no una por tecla');
  assert.equal(programador.tareas.at(-1).ms, 400);
  await almacen.escrituras();
  assert.equal(plano.escrituras, antes, 'nada se escribió antes de la demora');
  programador.correr();
  await almacen.escrituras();
  assert.equal(plano.escrituras, antes + 1);
  assert.equal(almacen.estadoDelGuardado(), 'en-el-telefono');
  // Un proceso nuevo sobre el mismo almacenamiento: como si Android hubiera cerrado la app.
  const { almacen: otro } = await almacenListo({ plano });
  assert.deepEqual(otro.sesion('borrador-1').escritas, { 'pB:1': { carga: '35', repeticiones: '10', rir: '', tiempo: '', unidad: 'lb' } });
});

test('4 · al pasar a segundo plano o al salir, guardarYa escribe lo que esperaba su demora', async () => {
  const { almacen, plano, programador } = await almacenListo();
  almacen.escribirEnFila('borrador-1', 'pA:2', { carga: '', repeticiones: '13', rir: '', tiempo: '00:40', unidad: 'kg' });
  await almacen.guardarYa();
  assert.equal(programador.pendientes(), 0, 'la demora se canceló: ya se escribió');
  assert.equal(almacen.estadoDelGuardado(), 'en-el-telefono');
  const { almacen: otro } = await almacenListo({ plano });
  assert.equal(otro.sesion('borrador-1').escritas['pA:2'].tiempo, '00:40');
});

test('4 · registrar borra lo escrito de esa fila en el mismo cambio; la unidad y las filas de más también se guardan', async () => {
  const { almacen, plano, programador } = await almacenListo();
  almacen.escribirEnFila('borrador-1', 'pA:1', { carga: '18', repeticiones: '', rir: '', tiempo: '', unidad: 'kg' });
  almacen.fijarUnidad('borrador-1', 'pA', 'lb');
  assert.equal(almacen.sesion('borrador-1').escritas['pA:1'].unidad, 'lb', 'lo escrito pasa a leerse en la unidad nueva');
  almacen.fijarFilasDeMas('borrador-1', 'pA', 1);
  const lectura = series.serieAlTildar(almacen.sesion('borrador-1').escritas['pA:1'], objetivoDe(GOBLET, 1), 1, 'lb');
  assert.equal(almacen.registrarSerie('borrador-1', { prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie: lectura.serie }), 'registrada');
  const s = almacen.sesion('borrador-1');
  assert.equal(s.escritas['pA:1'], undefined);
  assert.deepEqual(s.series[0].serie.load, { value: 18, unit: 'lb' });
  assert.equal(programador.pendientes(), 0, 'registrar no espera: se guarda al instante');
  await almacen.escrituras();
  const { almacen: otro } = await almacenListo({ plano });
  assert.deepEqual([otro.sesion('borrador-1').unidades, otro.sesion('borrador-1').filasDeMas, otro.sesion('borrador-1').escritas], [{ pA: 'lb' }, { pA: 1 }, {}]);
  assert.equal(otro.sesion('borrador-1').series.length, 1);
});

test('4 · lo guardado por una versión anterior, o con otra forma, no anula la sesión: lo que no se entiende se descarta solo', async () => {
  const plano = almacenEnMemoria();
  const { almacen } = await almacenListo({ plano });
  await almacen.escrituras();
  const guardado = JSON.parse(plano.datos.get(claveDeLaCuenta('cuenta-a')));
  // Una versión anterior no tenía estos campos; acá además hay entradas con otra forma.
  delete guardado.sesiones[0].filasDeMas;
  guardado.sesiones[0].escritas = { 'pA:1': { carga: '16', repeticiones: '12', rir: '', unidad: 'kg' }, 'pA:2': { carga: '1', repeticiones: '', rir: '', unidad: 'oz' }, basura: 3, 'pB:x': { carga: '' } };
  guardado.sesiones[0].unidades = { pA: 'lb', pB: 'piedras' };
  guardado.sesiones[0].quitadas = [{ prescriptionId: 'pA', setIndex: 1 }, { prescriptionId: '', setIndex: 2 }, 'otra cosa'];
  plano.datos.set(claveDeLaCuenta('cuenta-a'), JSON.stringify(guardado));
  const { almacen: otro } = await almacenListo({ plano });
  const s = otro.sesion('borrador-1');
  assert.ok(s, 'la sesión se lee');
  assert.deepEqual(s.escritas, { 'pA:1': { carga: '16', repeticiones: '12', rir: '', tiempo: '', unidad: 'kg' } });
  assert.deepEqual(s.unidades, { pA: 'lb' });
  assert.deepEqual(s.filasDeMas, {});
  assert.deepEqual(s.quitadas, [{ prescriptionId: 'pA', setIndex: 1 }]);
  // Nada se apartó a recuperación: la sesión era legible.
  assert.equal([...plano.datos.keys()].filter((k) => k.startsWith('be-entrenamiento-recuperacion:')).length, 0);
});

test('4 · destildar una serie que el servidor ya tiene: lo escrito vuelve a la fila y el próximo envío la saca del borrador', async () => {
  const api = apiDePrueba();
  const { almacen } = await almacenListo({ api });
  almacen.fijarBorrador('borrador-1', api.borrador);
  const serie = { setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: 14, rir: 3, perceivedExertion: null, recordedAs: 'TYPED' };
  almacen.registrarSerie('borrador-1', { prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie });
  await almacen.sincronizar('borrador-1');
  assert.equal(api.pedidos.length, 1);
  assert.deepEqual(api.pedidos[0].changes.exercises, [{ prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', sets: [serie] }], 'viaja con recordedAs');
  assert.equal(almacen.sesion('borrador-1').series.length, 0, 'ya está en el servidor');
  // Destildar: la del servidor queda para sacarla; lo escrito vuelve a la fila.
  const restaurar = series.escritaDeLaSerie(serie, 'kg');
  assert.equal(almacen.quitarSerie('borrador-1', 'pA', 1, restaurar), 'quitada');
  assert.deepEqual(almacen.sesion('borrador-1').quitadas, [{ prescriptionId: 'pA', setIndex: 1 }]);
  assert.equal(almacen.sesion('borrador-1').escritas['pA:1'].repeticiones, '14');
  const filas = series.filasDelEjercicio(GOBLET, series.guardadasVigentes(almacen.sesion('borrador-1').borrador, 'pA', almacen.sesion('borrador-1').quitadas), []);
  assert.equal(filas[0].estado, 'sin-registrar', 'la fila vuelve a estar sin registrar antes de enviar');
  await almacen.sincronizar('borrador-1');
  assert.deepEqual(api.pedidos[1].changes.exercises, [], 'el pedido la saca: el ejercicio queda sin series y sale');
  assert.deepEqual(almacen.sesion('borrador-1').quitadas, []);
  // Volver a tildarla con los mismos datos antes de enviar no manda nada: alcanza con no sacarla.
  almacen.registrarSerie('borrador-1', { prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie });
  await almacen.sincronizar('borrador-1');
  assert.equal(api.pedidos.length, 3);
  almacen.quitarSerie('borrador-1', 'pA', 1, null);
  assert.equal(almacen.registrarSerie('borrador-1', { prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie }), 'registrada');
  assert.deepEqual([almacen.sesion('borrador-1').quitadas, almacen.sesion('borrador-1').series], [[], []]);
  await almacen.sincronizar('borrador-1');
  assert.equal(api.pedidos.length, 3, 'sin pedido de más');
});

test('4 · destildar una serie que solo está en el teléfono no manda nada al servidor', async () => {
  const api = apiDePrueba();
  const { almacen } = await almacenListo({ api });
  almacen.fijarBorrador('borrador-1', api.borrador);
  almacen.registrarSerie('borrador-1', { prescriptionId: 'pB', performedExerciseVersionId: 'ev-pB', serie: { setIndex: 2, load: { value: 35, unit: 'lb' }, completedRepetitions: 10, rir: 2, perceivedExertion: null, recordedAs: 'AS_PLANNED' } });
  assert.equal(almacen.quitarSerie('borrador-1', 'pB', 2, null), 'quitada');
  assert.deepEqual([almacen.sesion('borrador-1').series, almacen.sesion('borrador-1').quitadas], [[], []]);
  await almacen.sincronizar('borrador-1');
  assert.equal(api.pedidos.length, 0);
  assert.equal(almacen.quitarSerie('borrador-1', 'pB', 2, null), 'sin-serie');
});

// ─── 5. Antes de finalizar ──────────────────────────────────────────────────────────────────────

test('5 · lo escrito sin registrar se lista por ejercicio y se lee como al tildarlo; una fila de más escrita reaparece', () => {
  const escritas = {
    'pA:2': { carga: '', repeticiones: '13', rir: '', tiempo: '', unidad: 'kg' },
    'pA:4': { carga: '20', repeticiones: '8', rir: '', tiempo: '', unidad: 'kg' },
    'pC:1': { carga: '', repeticiones: '', rir: '2', tiempo: '', unidad: 'kg' },
    'pB:1': { carga: '', repeticiones: '', rir: '', tiempo: '', unidad: 'kg' },
  };
  const pendientes = series.pendientesDeRegistrar(SESION, BORRADOR, [], [], escritas);
  assert.deepEqual(
    pendientes.map((p) => [p.prescriptionId, p.setIndex, p.planificada, p.lectura.ok]),
    [
      ['pA', 2, true, true],
      ['pA', 4, false, true],
      ['pC', 1, true, false],
    ],
  );
  assert.equal(pendientes[0].lectura.serie.recordedAs, 'TYPED');
  assert.deepEqual(pendientes[0].lectura.serie.load, { value: 16, unit: 'kg' }, 'lo vacío toma el plan');
  assert.equal(series.motivoDeLaLectura(pendientes[2].lectura), TEXTOS_DE_LA_SESION.repeticionesEnRango('8–10'));
  // El resumen nombra las escritas, y la fila de más aparece en la tabla aunque no se haya sumado con «Agregar una serie».
  const resumen = series.resumenDelRegistro(SESION, BORRADOR, [], [], escritas);
  assert.deepEqual(resumen.map((r) => r.escritas), [[2, 4], [], [1]]);
  assert.deepEqual(series.filasDelEjercicio(GOBLET, [], [], 0, undefined, [4]).map((f) => [f.setIndex, f.planificada]), [[1, true], [2, true], [3, true], [4, false]]);
  assert.equal(TEXTOS_DE_LA_SESION.escritasDe('Sentadilla goblet', [2, 4]), 'Sentadilla goblet: las series 2 y 4.');
  assert.equal(TEXTOS_DE_LA_SESION.escritasDe('Plancha', [1]), 'Plancha: la serie 1.');
  assert.equal(enumerar([1, 2, 3]), '1, 2 y 3');
});

test('5 · al tildar, el foco pasa a la próxima sin registrar del mismo ejercicio; el descanso queda con la serie hecha', () => {
  const guardada = (n) => ({ setIndex: n, load: { value: 16, unit: 'kg' }, completedRepetitions: 12, rir: 3, perceivedExertion: null });
  const conLa1 = series.filasDelEjercicio(GOBLET, [guardada(1)], []);
  assert.equal(series.focoTrasTildar(conLa1, 1, 1), 2);
  assert.equal(series.focoTrasTildar(conLa1, 1, 3), 3, 'si tildó otra fila, la enfocada sigue');
  const todas = series.filasDelEjercicio(GOBLET, [1, 2, 3].map(guardada), []);
  assert.equal(series.focoTrasTildar(todas, 3, 3), 3, 'nunca pasa solo al ejercicio siguiente');
  const salteada = series.filasDelEjercicio(GOBLET, [guardada(2), guardada(3)], []);
  assert.equal(series.focoTrasTildar(salteada, 3, 3), 1, 'vuelve a la primera que quedó sin registrar');
  assert.equal(series.serieQueOriginaElDescanso(conLa1, 2), 1, 'el descanso que empieza ahora es el de la serie 1, no el de la 2');
  assert.equal(series.serieQueOriginaElDescanso(conLa1, 1), 1);
  assert.equal(series.serieQueOriginaElDescanso(series.filasDelEjercicio(GOBLET, [], []), 1), 1);
});

// ─── 6. La franja ───────────────────────────────────────────────────────────────────────────────

test('6 · la franja: un tramo por ejercicio con lo registrado de cada uno, el actual marcado, y «Ejercicio 2 de 5 · Serie 3 de 4»', () => {
  const resumen = [
    { prescriptionId: 'pA', nombre: 'A', ejecutado: null, registradas: 3, planificadas: 3, sinRegistrar: [], escritas: [] },
    { prescriptionId: 'pB', nombre: 'B', ejecutado: null, registradas: 1, planificadas: 2, sinRegistrar: [2], escritas: [] },
    { prescriptionId: 'pC', nombre: 'C', ejecutado: null, registradas: 0, planificadas: 1, sinRegistrar: [1], escritas: [] },
  ];
  assert.deepEqual(franja.tramosDelRecorrido(resumen, 'pB'), [
    { prescriptionId: 'pA', fraccion: 1, actual: false },
    { prescriptionId: 'pB', fraccion: 0.5, actual: true },
    { prescriptionId: 'pC', fraccion: 0, actual: false },
  ]);
  assert.deepEqual(franja.cuentaDelRecorrido(resumen), { registradas: 4, planificadas: 6 });
  assert.equal(TEXTOS_DE_LA_SESION.tramos(4, 6), '4 de 6 series planificadas registradas en la sesión');
  assert.equal(franja.posicionEnLaSesion(2, 5, { setIndex: 3, planificada: true }, 4), 'Ejercicio 2 de 5 · Serie 3 de 4');
  assert.equal(franja.posicionEnLaSesion(2, 5, { setIndex: 5, planificada: false }, 4), 'Ejercicio 2 de 5 · Serie 5 · sin planificar');
  assert.equal(franja.posicionEnLaSesion(1, 3, null, 0), 'Ejercicio 1 de 3');
});

// ─── 7. El copy ─────────────────────────────────────────────────────────────────────────────────

test('7 · el copy nuevo no califica: sin cumplimiento (tampoco negado), sin «bien», «mal» ni «excelente», sin «no realizada»', () => {
  // Cada frase armada con valores de ejemplo, según lo que recibe.
  const ejemplos = { ejercicioYSerie: [2, 5, 'Serie 3 de 4'], relojEnCurso: [2, 'menos de un minuto'], cambiarUnidad: ['lb'], repeticionesEnRango: ['8–10'], escritasDe: ['Remo', [1, 2]], noSePudoRegistrar: ['Remo', 2, 'anotá la carga.'] };
  const textos = Object.entries(TEXTOS_DE_LA_SESION).map(([clave, valor]) => (typeof valor === 'string' ? valor : valor(...(ejemplos[clave] ?? [2, 3]))));
  assert.ok(textos.length > 30);
  const hallazgos = textos.flatMap((t) => [
    ...terminosProhibidosDeEntrenamientoEn(t).map((p) => `«${p}» en ${t}`),
    ...(/\b(bien|mal|excelente|perfecto|genial)\b/i.test(t) ? [`juicio en ${t}`] : []),
    ...(/no realizad/i.test(t) ? [`«no realizada» en ${t}`] : []),
  ]);
  assert.deepEqual(hallazgos, []);
});
