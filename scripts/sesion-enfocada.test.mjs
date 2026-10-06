/**
 * La tabla de series de la sesión enfocada de la APK (WP-ENTRENAMIENTO-SERIES §7.3; ACEPTACION M01 a M04):
 * `apps/mobile/src/series-de-la-sesion.ts` y el registro de series del almacén local (`almacen-de-entrenamiento.ts`).
 *
 * Lo que se prueba, con la sesión «Piernas A» de `datos/sesion_demo.json` (sintética) tal como la daría API-SER-02:
 *  1. los placeholders muestran el objetivo de ESA serie y nunca se envían;
 *  2. el RIR vacío es `null`, el 0 es 0 y admite decimales; la carga 0 es 0 kg, no «sin carga»;
 *  3. «Registrar serie N» se habilita solo con carga o repeticiones escritas;
 *  4. un doble toque es una sola serie y un solo pedido;
 *  5. API-TRN-17 lleva `exercises` entero, con lo del servidor y lo del teléfono, sin pisar una serie ya guardada;
 *  6. el resumen dice «N de M series registradas» y las que quedan «Sin registrar»;
 *  7. el descanso queda ligado a su serie al enfocar otra fila, y finalizar verifica antes los mínimos de API-TRN-18;
 *  8. el copy de las piezas nuevas pasa la guardia T13, y el contraste de lo que dibujan se mide en los dos temas.
 *
 * **Lo que esto no prueba:** el teclado real de Android, TalkBack ni el dibujo con Yoga. Eso queda para el teléfono.
 * Uso: node --test scripts/sesion-enfocada.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, register } from 'node:module';
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
const series = await import('../apps/mobile/src/series-de-la-sesion.ts');
const { crearAlmacenDeEntrenamiento } = await import('../apps/mobile/src/almacen-de-entrenamiento.ts');
const { crearReloj } = await import('../apps/mobile/src/reloj-de-sesion.ts');
const { COPY_ENTRENAMIENTO_POR_SERIE, SesionConObjetivosSchema, EditarBorradorDeEjecucionRequestSchema } = await import('@be/domain');

// ─── La sesión de demostración, como la daría API-SER-02 ────────────────────────────────────────

const demo = JSON.parse(readFileSync(resolve(RAIZ, 'docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/datos/sesion_demo.json'), 'utf8'));
const BASE_DE_CARGA = { 'Única mancuerna': 'SINGLE_IMPLEMENT', 'Por mancuerna; dos mancuernas': 'PER_IMPLEMENT', 'Carga externa total': 'TOTAL_EXTERNAL' };
const BASE_DE_REPETICIONES = { 'Por serie': 'PER_SET', 'Por pierna, no duplicar automáticamente': 'PER_SIDE' };
const NOMBRES = { sentadilla_goblet: 'Sentadilla goblet', peso_muerto_rumano_mancuernas: 'Peso muerto rumano con mancuernas', zancada_estatica: 'Zancada estática' };

function sesionDemo() {
  return SesionConObjetivosSchema.parse({
    sessionId: 'sesion-piernas-a',
    label: demo.name,
    order: 1,
    instructions: null,
    prescriptions: demo.exercises.map((e, i) => ({
      prescriptionId: `p${e.fixtureKey}`,
      order: i + 1,
      exerciseId: `ej-${e.catalogFixtureKey}`,
      exerciseVersionId: `ev-${e.catalogFixtureKey}`,
      exerciseName: NOMBRES[e.catalogFixtureKey],
      image: null,
      sets: e.sets.map((s) => ({
        setIndex: s.setIndex,
        note: null,
        target: { repetitions: s.plannedRepetitions, rir: s.plannedRir, suggestedLoad: s.suggestedLoad, restSeconds: s.recommendedRestSeconds },
        targetOrigin: { rir: s.plannedRir === null ? 'NONE' : 'SET', suggestedLoad: 'SET', restSeconds: s.recommendedRestSeconds === null ? 'NONE' : 'SET' },
      })),
      intensity: e.sets.some((s) => s.plannedRir !== null) ? { criterion: 'RIR', target: { value: e.sets[0].plannedRir, reference: null } } : null,
      suggestedLoad: null,
      restSeconds: null,
      loadBasis: BASE_DE_CARGA[e.loadBasis],
      repetitionBasis: BASE_DE_REPETICIONES[e.repetitionBasis],
      professionalParameters: [],
      note: null,
    })),
  });
}
const SESION = sesionDemo();
const [GOBLET, RUMANO, ZANCADA] = SESION.prescriptions;

const BORRADOR_VACIO = {
  draftId: 'borrador-1',
  version: 'v1',
  state: 'DRAFT',
  occurrenceId: 'occ_demo',
  date: '2026-10-06',
  timeZone: 'America/Argentina/Buenos_Aires',
  planId: 'plan-1',
  sessionId: 'sesion-piernas-a',
  granularity: null,
  sessionCondition: null,
  reason: null,
  exercises: [],
  sessionSummary: null,
  occurredAt: null,
  executionId: null,
  createdAt: '2026-10-06T16:00:00.000Z',
  updatedAt: '2026-10-06T16:00:00.000Z',
};

// ─── 1. Placeholders ────────────────────────────────────────────────────────────────────────────

test('1 · los placeholders muestran el objetivo de ESA serie: 12–16 / 10–12 / 8–10, la carga y el RIR de cada una', () => {
  const p = GOBLET.sets.map((s) => series.placeholdersDeLaSerie(s.target, 'kg'));
  assert.deepEqual(
    p.map((x) => [x.carga, x.repeticiones, x.rir]),
    [
      ['16', '12–16', '3'],
      ['18', '10–12', '2'],
      ['20', '8–10', '1'],
    ],
  );
  // Sin objetivo de RIR (la zancada) dice «Sin objetivo»; la carga 0 kg es un objetivo y se muestra.
  const z = series.placeholdersDeLaSerie(ZANCADA.sets[0].target, 'kg');
  assert.equal(z.rir, COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo);
  assert.equal(z.carga, '0');
  // Una serie de más, sin planificar: los tres dicen «Sin objetivo».
  assert.deepEqual(Object.values(series.placeholdersDeLaSerie(null, 'kg')), [COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo, COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo, COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo]);
  // Un objetivo en otra unidad lleva su unidad: no se compara kg con lb.
  assert.equal(series.placeholdersDeLaSerie({ ...GOBLET.sets[0].target, suggestedLoad: { value: 35, unit: 'lb' } }, 'kg').carga, '35 lb');
});

test('1 · los placeholders nunca se envían: solo viaja lo escrito, y una fila vacía no es una serie', () => {
  // La persona escribió solo las repeticiones de la serie 1: la carga y el RIR del plan (16 kg, RIR 3) no se copian.
  const lectura = series.leerFila({ carga: '', repeticiones: '14', rir: '' }, 1, 'kg');
  assert.equal(lectura.ok, true);
  assert.deepEqual(lectura.serie, { setIndex: 1, load: null, completedRepetitions: 14, rir: null, perceivedExertion: null });
  const { exercises } = series.ejerciciosParaGuardar(BORRADOR_VACIO, [{ prescriptionId: GOBLET.prescriptionId, performedExerciseVersionId: GOBLET.exerciseVersionId, serie: lectura.serie, enConflicto: false }]);
  assert.deepEqual(exercises, [{ prescriptionId: 'pA', performedExerciseVersionId: 'ev-sentadilla_goblet', sets: [{ setIndex: 1, load: null, completedRepetitions: 14, rir: null, perceivedExertion: null }] }]);
  // El cuerpo cumple el contrato estricto de API-TRN-17.
  assert.equal(EditarBorradorDeEjecucionRequestSchema.safeParse({ expectedVersion: 'v1', changes: { granularity: 'SET', exercises } }).success, true);
  // Nada del plan aparece en lo que se manda.
  const enviado = JSON.stringify(exercises);
  for (const delPlan of ['"value":16', '"rir":3', '12–16', COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo]) assert.ok(!enviado.includes(delPlan), `se colaba ${delPlan}`);
  // Una fila sin nada escrito no se registra, aunque tenga placeholders.
  assert.deepEqual(series.leerFila(series.FILA_VACIA, 1, 'kg'), { ok: false, errores: { fila: COPY_ENTRENAMIENTO_POR_SERIE.faltaUnDato } });
});

// ─── 2. RIR y carga ─────────────────────────────────────────────────────────────────────────────

test('2 · RIR vacío es null, 0 es 0 y admite decimales con coma o punto; fuera de 0 a 20 se dice en el campo', () => {
  const rir = (texto) => series.leerFila({ carga: '16', repeticiones: '14', rir: texto }, 1, 'kg');
  assert.equal(rir('').serie.rir, null);
  assert.equal(rir('0').serie.rir, 0);
  assert.equal(rir('2,5').serie.rir, 2.5);
  assert.equal(rir('2.5').serie.rir, 2.5);
  assert.equal(rir('20').serie.rir, 20);
  assert.deepEqual(rir('21').errores, { rir: 'El RIR va de 0 a 20.' });
  assert.match(rir('dos').errores.rir, /Escribí un número/);
  // El RIR nunca se calcula: con la carga y las repeticiones escritas y el RIR vacío, queda null.
  assert.equal(rir('').serie.rir, null);
});

test('2 · la carga 0 es «0 kg informado», distinta de «sin carga» (null); las repeticiones van sin decimales', () => {
  const cero = series.leerFila({ carga: '0', repeticiones: '10', rir: '' }, 1, 'kg');
  assert.deepEqual(cero.serie.load, { value: 0, unit: 'kg' });
  assert.equal(series.leerFila({ carga: '', repeticiones: '10', rir: '' }, 1, 'kg').serie.load, null);
  assert.deepEqual(series.leerFila({ carga: '12,5', repeticiones: '', rir: '' }, 2, 'lb').serie, { setIndex: 2, load: { value: 12.5, unit: 'lb' }, completedRepetitions: null, rir: null, perceivedExertion: null });
  assert.deepEqual(series.leerFila({ carga: '16', repeticiones: '10,5', rir: '' }, 1, 'kg').errores, { repeticiones: 'Las repeticiones van sin decimales.' });
  assert.deepEqual(series.leerFila({ carga: '-4', repeticiones: '10', rir: '' }, 1, 'kg').errores, { carga: 'La carga no puede ser negativa.' });
  // 0 repeticiones es un dato (lo intentó y no salió ninguna), no un vacío.
  assert.equal(series.leerFila({ carga: '', repeticiones: '0', rir: '' }, 1, 'kg').serie.completedRepetitions, 0);
});

// ─── 3. La regla de habilitación ────────────────────────────────────────────────────────────────

test('3 · «Registrar serie N» se habilita con carga o repeticiones escritas; solo el RIR, o espacios, no alcanzan', () => {
  assert.equal(series.puedeRegistrar({ carga: '', repeticiones: '', rir: '' }), false);
  assert.equal(series.puedeRegistrar({ carga: '  ', repeticiones: ' ', rir: '' }), false);
  assert.equal(series.puedeRegistrar({ carga: '', repeticiones: '', rir: '2' }), false, 'el dominio exige carga o repeticiones para confirmar (SET_WITHOUT_DATA)');
  assert.equal(series.puedeRegistrar({ carga: '16', repeticiones: '', rir: '' }), true);
  assert.equal(series.puedeRegistrar({ carga: '', repeticiones: '14', rir: '' }), true);
  assert.equal(series.leerFila({ carga: '', repeticiones: '', rir: '2' }, 1, 'kg').errores.fila, 'Anotá la carga o las repeticiones que hiciste.');
  // Lo escrito se declara para no perderlo al salir: también el RIR solo.
  assert.equal(series.hayAlgoEscrito({ carga: '', repeticiones: '', rir: '2' }), true);
});

// ─── 4. El doble toque ──────────────────────────────────────────────────────────────────────────

function diferido() {
  let resolver;
  const promesa = new Promise((r) => (resolver = r));
  return { promesa, resolver };
}

function almacenEnMemoria() {
  const datos = new Map();
  return { datos, leer: async (k) => datos.get(k) ?? null, guardar: async (k, v) => void datos.set(k, v), borrar: async (k) => void datos.delete(k) };
}

test('4 · un doble toque en «Registrar serie 1» es una sola serie y un solo pedido a la API', async () => {
  const pedidos = [];
  const respuesta = diferido();
  const api = {
    consultarBorradorDeEjecucion: async () => ({ ok: true, datos: { data: BORRADOR_VACIO } }),
    guardarBorradorDeEjecucion: (_t, _d, cuerpo) => (pedidos.push(cuerpo), respuesta.promesa),
    registrarEventosDeTiempo: async () => assert.fail('sin eventos pendientes'),
    tiemposDelBorrador: async () => assert.fail('no se usa'),
  };
  let n = 0;
  const almacen = crearAlmacenDeEntrenamiento({ almacen: almacenEnMemoria(), api, reloj: crearReloj({ ancla: 'proceso-prueba', monotonico: () => 0, civil: () => 0 }), nuevoId: (p) => `${p}-${String(++n).padStart(6, '0')}` });
  await almacen.abrirCuenta('cuenta-a', 'token-a');
  almacen.preparar({ draftId: 'borrador-1', occurrenceId: 'occ_demo', fecha: '2026-10-06', modo: 'en-vivo', etiqueta: 'Piernas A', sesion: SESION });
  almacen.fijarBorrador('borrador-1', BORRADOR_VACIO);
  const lectura = series.leerFila({ carga: '16', repeticiones: '14', rir: '3' }, 1, 'kg');
  const serie = { prescriptionId: 'pA', performedExerciseVersionId: 'ev-sentadilla_goblet', serie: lectura.serie };
  // Dos toques seguidos, antes de que la pantalla se vuelva a dibujar.
  assert.equal(almacen.registrarSerie('borrador-1', serie), 'registrada');
  assert.equal(almacen.registrarSerie('borrador-1', serie), 'repetida');
  const primera = almacen.sincronizar('borrador-1');
  const segunda = almacen.sincronizar('borrador-1');
  assert.equal(almacen.sesion('borrador-1').series.length, 1);
  respuesta.resolver({ ok: true, datos: { data: { ...BORRADOR_VACIO, version: 'v2', granularity: 'SET', exercises: [{ prescriptionId: 'pA', prescribedExerciseVersionId: 'ev-sentadilla_goblet', prescribedExerciseName: 'Sentadilla goblet', performedExerciseVersionId: 'ev-sentadilla_goblet', performedExerciseName: 'Sentadilla goblet', substituted: false, sets: [lectura.serie], executionSummary: null }] } } });
  await Promise.all([primera, segunda]);
  await new Promise((r) => setImmediate(r));
  assert.equal(pedidos.length, 1, 'un solo PATCH');
  assert.deepEqual(pedidos[0], { expectedVersion: 'v1', changes: { granularity: 'SET', exercises: [{ prescriptionId: 'pA', performedExerciseVersionId: 'ev-sentadilla_goblet', sets: [lectura.serie] }] } });
  assert.equal(almacen.sesion('borrador-1').series.length, 0, 'ya está en el borrador del servidor');
  // Un tercer toque, ya guardada, tampoco duplica.
  assert.equal(almacen.registrarSerie('borrador-1', serie), 'repetida');
});

// ─── 5. API-TRN-17 ──────────────────────────────────────────────────────────────────────────────

test('5 · TRN-17 lleva exercises entero: lo del servidor más lo del teléfono, sin pisar una serie ya guardada', () => {
  const delServidor = {
    exercises: [
      { prescriptionId: 'pA', prescribedExerciseVersionId: 'ev-a', prescribedExerciseName: 'A', performedExerciseVersionId: 'ev-a', performedExerciseName: 'A', substituted: false, sets: [{ setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: 14, rir: 3, perceivedExertion: null }], executionSummary: null },
    ],
  };
  const local = (prescriptionId, setIndex, completedRepetitions) => ({ prescriptionId, performedExerciseVersionId: `ev-${prescriptionId}`, serie: { setIndex, load: null, completedRepetitions, rir: null, perceivedExertion: null }, enConflicto: false });
  const r = series.ejerciciosParaGuardar(delServidor, [local('pA', 2, 11), local('pA', 1, 9), local('pB', 1, 12)]);
  assert.deepEqual(
    r.exercises.map((e) => [e.prescriptionId, e.sets.map((s) => [s.setIndex, s.completedRepetitions])]),
    [
      ['pA', [[1, 14], [2, 11]]],
      ['pB', [[1, 12]]],
    ],
  );
  assert.deepEqual(r.ocupadas.map((o) => [o.prescriptionId, o.serie.setIndex]), [['pA', 1]], 'la serie 1 del servidor no se pisa: queda en conflicto');
  // Al releer el borrador, la pendiente que el servidor ya tiene igual sale; la distinta queda en conflicto.
  const igual = { ...local('pA', 1, 14), serie: delServidor.exercises[0].sets[0] };
  assert.deepEqual(series.conciliarSeries([igual, local('pA', 1, 9), local('pA', 2, 11)], delServidor).map((l) => [l.serie.setIndex, l.serie.completedRepetitions, l.enConflicto]), [
    [1, 9, true],
    [2, 11, false],
  ]);
});

// ─── 6. El resumen y la disposición ─────────────────────────────────────────────────────────────

test('6 · el resumen dice «N de M series registradas» y cuáles quedan «Sin registrar», sin inventar «no realizada»', () => {
  const borrador = { exercises: [{ prescriptionId: 'pA', prescribedExerciseVersionId: 'ev-a', prescribedExerciseName: 'A', performedExerciseVersionId: 'ev-a', performedExerciseName: 'A', substituted: false, sets: [{ setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: 14, rir: 3, perceivedExertion: null }], executionSummary: null }] };
  const pendiente = { prescriptionId: 'pA', performedExerciseVersionId: 'ev-a', serie: { setIndex: 3, load: { value: 20, unit: 'kg' }, completedRepetitions: 9, rir: null, perceivedExertion: null }, enConflicto: false };
  const resumen = series.resumenDelRegistro(SESION, borrador, [pendiente]);
  assert.deepEqual(
    resumen.map((r) => [r.nombre, COPY_ENTRENAMIENTO_POR_SERIE.seriesRegistradas(r.registradas, r.planificadas), r.sinRegistrar]),
    [
      ['Sentadilla goblet', '2 de 3 series registradas', [2]],
      ['Peso muerto rumano con mancuernas', '0 de 3 series registradas', [1, 2, 3]],
      ['Zancada estática', '0 de 3 series registradas', [1, 2, 3]],
    ],
  );
  // Las filas dicen el estado de cada serie: guardada en el servidor, pendiente en el teléfono o sin registrar.
  assert.deepEqual(
    series.filasDelEjercicio(GOBLET, series.guardadasDe(borrador, 'pA'), [pendiente]).map((f) => [f.setIndex, f.estado]),
    [
      [1, 'guardada'],
      [2, 'sin-registrar'],
      [3, 'pendiente-de-enviar'],
    ],
  );
  assert.equal(series.ejerciciosYSeries(SESION.prescriptions), '3 ejercicios · 9 series');
});

test('6 · la banda «Plan de la serie N» y las bases declaradas, sin suponer lo que no se declaró', () => {
  assert.equal(series.bandaDeLaSerie(1, GOBLET.sets[0].target).completa, 'Plan de la serie 1: 16 kg · 12–16 rep. · RIR 3 · Descanso recomendado 01:30');
  assert.equal(series.bandaDeLaSerie(3, ZANCADA.sets[2].target).completa, 'Plan de la serie 3: 0 kg · 8–10 rep.');
  assert.equal(series.bandaDeLaSerie(4, null).completa, 'Plan de la serie 4: Sin objetivo');
  assert.deepEqual(series.basesDeLaPrescripcion(RUMANO), { carga: 'por mancuerna o implemento', repeticiones: 'por serie' });
  assert.deepEqual(series.basesDeLaPrescripcion({ loadBasis: null, repetitionBasis: null }), { carga: null, repeticiones: null });
});

test('6 · con la letra grande, la tabla pasa a tarjetas apiladas', () => {
  // El ancho disponible: la pantalla menos los 20 dp de relleno de cada lado.
  assert.equal(series.disposicionDeLaTabla(320, 1), 'tabla');
  assert.equal(series.disposicionDeLaTabla(372, 1.3), 'tabla');
  assert.equal(series.disposicionDeLaTabla(320, 1.3), 'tarjetas');
  assert.equal(series.disposicionDeLaTabla(372, 2), 'tarjetas');
});

// ─── 7. El descanso queda ligado a su serie; finalizar exige los mínimos ────────────────────────

test('7 · al terminar el descanso: la serie siguiente si la del descanso ya tiene registro; si no, la misma; lo enfocado se respeta', () => {
  const guardada1 = [{ setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: 14, rir: 3, perceivedExertion: null }];
  const conLa1 = series.filasDelEjercicio(GOBLET, guardada1, []);
  const sinNada = series.filasDelEjercicio(GOBLET, [], []);
  assert.equal(series.focoTrasElDescanso(conLa1, 1, 1), 2, '«Al terminar, seguís con la serie 2»');
  assert.equal(series.focoTrasElDescanso(sinNada, 1, 1), 1, 'el descanso empezó antes de registrar la serie 1: se queda en ella');
  assert.equal(series.focoTrasElDescanso(conLa1, 1, 3), 3, 'enfocar otra fila durante el descanso no reasigna el descanso ni se pisa');
  const todas = series.filasDelEjercicio(GOBLET, [1, 2, 3].map((n) => ({ ...guardada1[0], setIndex: n })), []);
  assert.equal(series.focoTrasElDescanso(todas, 3, 3), 3, 'sin serie siguiente, queda donde estaba');
});

test('7 · antes de cerrar la corrida se verifican los mínimos de API-TRN-18: condición y al menos una serie con datos', () => {
  const serie = { setIndex: 1, load: null, completedRepetitions: 12, rir: null, perceivedExertion: null };
  const conSeries = { sessionCondition: 'COMPLETED', sessionSummary: null, exercises: [{ prescriptionId: 'pA', sets: [serie], executionSummary: null }] };
  assert.equal(series.problemaParaConfirmar(null), 'Todavía no se cargó la sesión.');
  assert.equal(series.problemaParaConfirmar({ ...conSeries, sessionCondition: null }), 'Falta indicar cómo resultó la sesión.');
  assert.equal(series.problemaParaConfirmar({ ...conSeries, exercises: [] }), 'Registrá al menos una serie antes de finalizar.');
  assert.equal(series.problemaParaConfirmar(conSeries), null);
  assert.equal(series.problemaParaConfirmar({ sessionCondition: 'NOT_COMPLETED', sessionSummary: null, exercises: [] }), null, '«No pude realizarla» se confirma sin series');
  assert.equal(series.unidadDelEjercicio(GOBLET), 'kg');
  assert.equal(series.unidadDelEjercicio({ sets: [], suggestedLoad: { value: 35, unit: 'lb' } }), 'lb');
});

// ─── 8. El copy de las piezas nuevas y el contraste de lo que dibujan ───────────────────────────

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { terminosProhibidosDeEntrenamientoEn } = require('../packages/domain/dist/index.js');
const movil = (archivo) => resolve(RAIZ, 'apps/mobile/src', archivo);

/** Los textos de un archivo (literales, plantillas y texto JSX), como los extrae `scripts/copy-pantallas.test.cjs`. */
function textosDe(archivo) {
  const fuente = ts.createSourceFile(archivo, readFileSync(archivo, 'utf8'), ts.ScriptTarget.Latest, true, archivo.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.TSX);
  const textos = [];
  const visitar = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isJsxText(n)) {
      const t = n.text.trim();
      if (t) textos.push({ texto: t, linea: fuente.getLineAndCharacterOfPosition(n.getStart()).line + 1 });
    }
    ts.forEachChild(n, visitar);
  };
  visitar(fuente);
  return textos;
}

const PIEZAS_NUEVAS = ['pantallas/sesion-enfocada.tsx', 'pantallas/plan-por-serie.tsx', 'pantallas/tiempos-de-la-sesion.tsx', 'pantallas/recuperacion.tsx', 'series-de-la-sesion.ts', 'corrida-de-entrenamiento.ts', 'almacen-de-entrenamiento.ts'].map(movil);

test('8 · T13: el copy de las piezas nuevas no tiene puntajes, cumplimiento ni juicios, y no deriva «No realizada»', () => {
  const hallazgos = [];
  for (const archivo of PIEZAS_NUEVAS) {
    const contenido = readFileSync(archivo, 'utf8');
    for (const { texto, linea } of textosDe(archivo)) {
      for (const p of terminosProhibidosDeEntrenamientoEn(texto)) hallazgos.push(`${archivo.slice(RAIZ.length + 1)}:${linea} «${p}» en ${JSON.stringify(texto)}`);
      if (/no realizad/i.test(texto)) hallazgos.push(`${archivo.slice(RAIZ.length + 1)}:${linea} escribe ${JSON.stringify(texto)}`);
    }
    if (/execution\.sessionCondition/.test(contenido)) hallazgos.push(`${archivo.slice(RAIZ.length + 1)} lee execution.sessionCondition`);
  }
  assert.deepEqual(hallazgos, []);
  // Las frases de Dirección van literales, sin abreviar: la ayuda del RIR, su ejemplo y la explicación de los tiempos.
  const pieza = readFileSync(movil('pantallas/sesion-enfocada.tsx'), 'utf8');
  for (const clave of ['rirAyuda', 'rirEjemplo', 'explicacionDeTiempos', 'laSesionQuedoAbierta', 'faltaUnDato']) assert.ok(pieza.includes(clave) || readFileSync(movil('pantallas/entrenamiento.tsx'), 'utf8').includes(clave), `falta ${clave}`);
});

/** Los dos temas de la APK, leídos de tema.ts como en `scripts/contraste.test.cjs`. */
function temaApk(nombre) {
  const fuente = readFileSync(movil('tema.ts'), 'utf8');
  const inicio = fuente.search(new RegExp(`export const ${nombre}(: \\w+)? = \\{`));
  const cuerpo = fuente.slice(inicio, fuente.indexOf('};', inicio));
  return Object.fromEntries([...cuerpo.matchAll(/(\w+):\s*'(#[0-9a-f]{6})'/gi)].map(([, clave, valor]) => [clave, valor.toLowerCase()]));
}
const lineal = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const luminancia = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lineal(n >> 16) + 0.7152 * lineal((n >> 8) & 255) + 0.0722 * lineal(n & 255);
};
const contraste = (a, b) => {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
};

test('8 · contraste medido en lo que dibuja la sesión enfocada: el objetivo en gris, la fila activa y las celdas, en los dos temas', () => {
  // [primer plano, fondo, mínimo, dónde se usa]: 4,5:1 para texto y 3:1 para bordes y glifos (WCAG 1.4.3 y 1.4.11).
  const PARES = [
    ['tenue', 'fondo', 4.5, 'el objetivo de la serie en gris, dentro de la celda (placeholder)'],
    ['texto', 'fondo', 4.5, 'lo escrito y lo guardado en la celda'],
    ['bordeControl', 'fondo', 3, 'el borde de la celda que se escribe'],
    ['acento', 'superficie', 4.5, '«Serie actual», «Ver técnica» y «Ver rutina»'],
    ['acento', 'fondo', 3, 'el borde de la fila activa'],
    ['tenue', 'superficie', 4.5, 'los detalles dentro de las tarjetas'],
    ['botonTexto', 'botonFondo', 4.5, '«Registrar serie N» y «Finalizar descanso»'],
    ['botonTexto', 'acento', 3, 'el tilde de una serie guardada'],
    ['error', 'superficie', 4.5, 'una serie en conflicto'],
    ['peligroTexto', 'peligroFondo', 3, 'el signo del aviso en la recuperación'],
  ];
  const fallas = [];
  for (const nombre of ['AZUL_NOCHE', 'CLARO']) {
    const tema = temaApk(nombre);
    for (const [frente, fondo, minimo, uso] of PARES) {
      const relacion = contraste(tema[frente], tema[fondo]);
      if (relacion < minimo) fallas.push(`${nombre} · ${uso}: ${relacion.toFixed(2)}:1`);
    }
  }
  assert.deepEqual(fallas, []);
  // Y las piezas usan esos pares: si alguien cambia el fondo de la celda, esta prueba lo ve.
  const pieza = readFileSync(movil('pantallas/sesion-enfocada.tsx'), 'utf8');
  assert.match(pieza, /placeholder: \{[^}]*color: COLOR\.tenue/);
  assert.match(pieza, /celdaEditable: \{[^}]*borderColor: COLOR\.bordeControl, backgroundColor: COLOR\.fondo/);
  assert.match(pieza, /celdaQuieta: \{[^}]*backgroundColor: COLOR\.fondo/);
  assert.match(pieza, /filaActiva: \{[^}]*borderColor: COLOR\.acento/);
  assert.match(pieza, /serieActual: \{[^}]*color: COLOR\.acento/);
  // Ningún brillo interno: la superficie es mate (WP-ENTRENAMIENTO-SERIES §7.7).
  assert.doesNotMatch(readFileSync(movil('vidrio.tsx'), 'utf8'), /LinearGradient|BrilloDeVidrio\(/);
  for (const archivo of ['pantallas/progreso.tsx', 'pantallas/indicadores.tsx', 'pantallas/figura-de-la-toma.tsx', 'pantallas/sesion-enfocada.tsx']) assert.doesNotMatch(readFileSync(movil(archivo), 'utf8'), /BrilloDeVidrio/, archivo);
});
