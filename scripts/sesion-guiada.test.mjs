/**
 * La sesión guiada de la APK (PA-01 «Lo escrito no se pierde» y PA-02 «La sesión guiada», decisiones de Dirección del
 * 2026-11-02; contrato DL-161: `recordedAs` y `durationSeconds`).
 *
 * Lo que se prueba, sin teléfono:
 *  1. tildar una fila registra lo escrito y, en lo vacío, lo planificado que se veía; `recordedAs` dice cómo se cargó, y
 *     un rango de repeticiones no se convierte en un número;
 *  2. el tiempo de la serie: se escribe en minutos y segundos o en segundos, es opcional y va en `durationSeconds`;
 *  3. destildar: lo escrito vuelve a la fila, y la próxima API-TRN-17 saca la serie del borrador del servidor; volver a
 *     tildarla mientras viaja un envío no la pierde (§4, con la respuesta retenida);
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
const { COPY_ENTRENAMIENTO_POR_SERIE, EditarBorradorDeEjecucionRequestSchema, SerieEjecutadaSchema, terminosProhibidosDeEntrenamientoEn } = await import('@be/domain');

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
  assert.deepEqual(series.serieAlTildar({ carga: '', repeticiones: '14', rir: '' }, objetivoDe(GOBLET, 1), 1, 'kg').serie, { setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: 14, rir: 3, perceivedExertion: null, recordedAs: 'TYPED', fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' } });
  assert.deepEqual(series.serieAlTildar({ carga: '17,5', repeticiones: '', rir: '0' }, objetivoDe(REMO, 1), 1, 'lb').serie, { setIndex: 1, load: { value: 17.5, unit: 'lb' }, completedRepetitions: 10, rir: 0, perceivedExertion: null, recordedAs: 'TYPED', fieldOrigins: { load: 'PERSON', completedRepetitions: 'PLAN', rir: 'PERSON' } });
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
  assert.deepEqual(series.escritaDeLaSerie({ setIndex: 1, load: { value: 17.5, unit: 'kg' }, completedRepetitions: 14, rir: 2, perceivedExertion: null, recordedAs: 'TYPED', durationSeconds: 45 }, 'kg'), { carga: '17,5', repeticiones: '14', rir: '2', tiempo: '00:45', unidad: 'kg', sinProcedencia: { carga: { value: 17.5, unit: 'kg' }, repeticiones: 14, rir: 2 } });
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
// ─── ED-70 · De dónde salió cada valor ───────────────────────────────────────────────────────────

/** Un objetivo de serie a mano: 60 kg × 8 con RIR 2, el ejemplo de §5.8 del paquete. */
const sesentaPorOcho = { repetitions: { value: 8 }, suggestedLoad: { value: 60, unit: 'kg' }, rir: 2, restSeconds: null, intensity: null };

test('TEST-EDP-059 · ED-70 · con el plan 60 kg × 8 y RIR 2, escribir solo «10» registra 60 × 10 con RIR 2: la carga y el RIR del plan, las repeticiones de la persona', () => {
  const r = series.serieAlTildar({ ...vacia, repeticiones: '10' }, sesentaPorOcho, 1, 'kg');
  assert.deepEqual(r.serie, { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 10, rir: 2, perceivedExertion: null, recordedAs: 'TYPED', fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' } });
  // Cumple el contrato estricto de la serie.
  assert.equal(SerieEjecutadaSchema.safeParse(r.serie).success, true);
  // Escribir el mismo número que el plan es escribirlo: PERSON. Y lo que no tiene valor no lleva clave.
  assert.deepEqual(series.serieAlTildar({ carga: '60', repeticiones: '', rir: '' }, { ...sesentaPorOcho, rir: null }, 1, 'kg').serie.fieldOrigins, { load: 'PERSON', completedRepetitions: 'PLAN' });
  // Cada combinación de escrito y heredado, con sus claves en el orden del contrato.
  const quien = (escrito) => (escrito ? 'PERSON' : 'PLAN');
  for (const carga of ['', '60'])
    for (const repeticiones of ['', '8'])
      for (const rir of ['', '2']) {
        const s = series.serieAlTildar({ carga, repeticiones, rir }, sesentaPorOcho, 1, 'kg').serie;
        if (!carga && !repeticiones && !rir) {
          assert.equal(s.recordedAs, 'AS_PLANNED');
          assert.equal('fieldOrigins' in s, false, 'AS_PLANNED va sin el campo: todo es del plan');
          continue;
        }
        assert.deepEqual(s.fieldOrigins, { load: quien(carga), completedRepetitions: quien(repeticiones), rir: quien(rir) }, `${carga}|${repeticiones}|${rir}`);
        assert.deepEqual(Object.keys(s.fieldOrigins), ['load', 'completedRepetitions', 'rir']);
      }
});

test('TEST-EDP-059 · ED-70 · el RIR que completa el plan queda PLAN, y sin RIR planificado no hay clave', () => {
  const conRir = series.serieAlTildar({ carga: '62,5', repeticiones: '8', rir: '' }, sesentaPorOcho, 1, 'kg').serie;
  assert.equal(conRir.rir, 2);
  assert.equal(conRir.fieldOrigins.rir, 'PLAN');
  const sinRir = series.serieAlTildar({ carga: '62,5', repeticiones: '8', rir: '' }, { ...sesentaPorOcho, rir: null }, 1, 'kg').serie;
  assert.equal(sinRir.rir, null);
  assert.deepEqual(sinRir.fieldOrigins, { load: 'PERSON', completedRepetitions: 'PERSON' });
  // Un rango de repeticiones no se convierte en número: las repeticiones quedan sin valor y sin clave.
  const rango = series.serieAlTildar({ carga: '60', repeticiones: '', rir: '' }, { ...sesentaPorOcho, repetitions: { min: 8, max: 10 } }, 1, 'kg').serie;
  assert.deepEqual(rango.fieldOrigins, { load: 'PERSON', rir: 'PLAN' });
});

test('ED-70 · destildar devuelve escrito solo lo de la persona: lo del plan vuelve en gris, y volver a tildar da la misma serie', () => {
  const tildada = series.serieAlTildar({ ...vacia, repeticiones: '10' }, sesentaPorOcho, 1, 'kg').serie;
  const restaurar = series.escritaDeLaSerie(tildada, 'kg');
  assert.deepEqual(restaurar, { carga: '', repeticiones: '10', rir: '', tiempo: '', unidad: 'kg' });
  assert.deepEqual(series.serieAlTildar(restaurar, sesentaPorOcho, 1, 'kg').serie, tildada);
  // Una serie de antes de la procedencia (sin el campo) vuelve escrita entera, como siempre.
  const { fieldOrigins: _, ...deAntes } = tildada;
  assert.deepEqual(series.escritaDeLaSerie(deAntes, 'kg'), { carga: '60', repeticiones: '10', rir: '2', tiempo: '', unidad: 'kg', sinProcedencia: { carga: { value: 60, unit: 'kg' }, repeticiones: 10, rir: 2 } });
});

/** Una serie que registró la 0.24, antes de la procedencia: 60 kg × 10 con RIR 2, TYPED y sin `fieldOrigins`. */
const deLa024 = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 10, rir: 2, perceivedExertion: null, recordedAs: 'TYPED' };

test('ED-70 · una serie de la 0.24 destildada y vuelta a tildar sin cambios vuelve igual: ninguna clave PERSON en lo que no se escribió', () => {
  const restaurar = series.escritaDeLaSerie(deLa024, 'kg');
  const vuelta = series.serieAlTildar(restaurar, sesentaPorOcho, 1, 'kg').serie;
  assert.deepEqual(vuelta, deLa024, 'sin el campo: no se sabe quién escribió cada valor');
  assert.equal(series.mismosDatos(deLa024, vuelta), true, 'la vuelta no cambia nada, como antes de ED-70');
  // Lo que viaja en la API-TRN-17 es la misma serie que el servidor ya tenía.
  const borrador = { exercises: [ejercicioDelServidor('pA', [deLa024])] };
  const { exercises } = series.ejerciciosParaGuardar(borrador, [{ prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie: vuelta, enConflicto: false }], [{ prescriptionId: 'pA', setIndex: 1 }]);
  assert.deepEqual(exercises[0].sets, [deLa024]);
  assert.equal(JSON.stringify(exercises).includes('PERSON'), false);
  assert.equal(EditarBorradorDeEjecucionRequestSchema.safeParse({ expectedVersion: 'v1', changes: { granularity: 'SET', exercises } }).success, true);
});

test('ED-70 · al volver a tildar una serie de la 0.24, solo lo que la persona cambia es suyo; lo que vacía lo completa el plan', () => {
  const restaurar = series.escritaDeLaSerie(deLa024, 'kg');
  assert.deepEqual(series.serieAlTildar({ ...restaurar, repeticiones: '11' }, sesentaPorOcho, 1, 'kg').serie.fieldOrigins, { completedRepetitions: 'PERSON' });
  assert.deepEqual(series.serieAlTildar({ ...restaurar, rir: '' }, sesentaPorOcho, 1, 'kg').serie.fieldOrigins, { rir: 'PLAN' });
  assert.deepEqual(series.serieAlTildar({ ...restaurar, carga: '62,5' }, sesentaPorOcho, 1, 'kg').serie.fieldOrigins, { load: 'PERSON' });
  // Otra unidad es otra carga: la cambió la persona.
  assert.deepEqual(series.serieAlTildar({ ...restaurar, unidad: 'lb' }, sesentaPorOcho, 1, 'lb').serie.fieldOrigins, { load: 'PERSON' });
  // El mismo número, escrito con punto, es el mismo valor: sigue sin clave.
  assert.equal('fieldOrigins' in series.serieAlTildar({ ...restaurar, carga: '60.0' }, sesentaPorOcho, 1, 'kg').serie, false);
  // Vaciar todo es tildar con lo planificado: AS_PLANNED, sin el campo.
  assert.equal(series.serieAlTildar({ ...restaurar, carga: '', repeticiones: '', rir: '' }, sesentaPorOcho, 1, 'kg').serie.recordedAs, 'AS_PLANNED');
  // Una serie con procedencia parcial (un valor sin clave) vuelve con su misma procedencia.
  const parcial = { ...deLa024, completedRepetitions: 8, fieldOrigins: { load: 'PERSON', completedRepetitions: 'PLAN' } };
  const restaurada = series.escritaDeLaSerie(parcial, 'kg');
  assert.deepEqual(restaurada.sinProcedencia, { rir: 2 });
  assert.deepEqual(series.serieAlTildar(restaurada, sesentaPorOcho, 1, 'kg').serie, parcial);
});

test('ED-70 · «Antes de finalizar» registra una serie de la 0.24 destildada como estaba, sin PERSON', () => {
  const goblet = { ...deLa024, load: { value: 16, unit: 'kg' }, completedRepetitions: 14, rir: 3 };
  const borrador = { exercises: [ejercicioDelServidor('pA', [goblet])] };
  const escritas = { 'pA:1': series.escritaDeLaSerie(goblet, 'kg') };
  const [pendiente] = series.pendientesDeRegistrar(SESION, borrador, [], [{ prescriptionId: 'pA', setIndex: 1 }], escritas);
  assert.deepEqual(pendiente.lectura.serie, goblet);
});

test('ED-70 · la procedencia cuenta para reconocer una serie que el servidor ya tiene, sin importar el orden de las claves', () => {
  const base = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 10, rir: 2, perceivedExertion: null };
  const local = { ...base, fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' } };
  assert.equal(series.mismosDatos(local, { ...base, fieldOrigins: { rir: 'PLAN', load: 'PLAN', completedRepetitions: 'PERSON' } }), true);
  assert.equal(series.mismosDatos(local, { ...base, fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PLAN' } }), false);
  assert.equal(series.mismosDatos(local, base), false, 'sin el campo es «sin saber», no lo mismo');
  assert.equal(series.mismosDatos({ ...base, fieldOrigins: {} }, base), true, 'un objeto vacío dice lo mismo que la ausencia');
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

test('4 · ED-70 · una serie de la 0.24 que se destilda y se vuelve a tildar sin cambios no se reemplaza: lo que no se sabe quién escribió sobrevive a un proceso nuevo', async () => {
  const api = apiDePrueba();
  const { almacen, plano } = await almacenListo({ api });
  const goblet = { setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: 14, rir: 3, perceivedExertion: null, recordedAs: 'TYPED' };
  api.borrador = { ...api.borrador, granularity: 'SET', exercises: [ejercicioDelServidor('pA', [goblet])] };
  almacen.fijarBorrador('borrador-1', api.borrador);
  assert.equal(almacen.quitarSerie('borrador-1', 'pA', 1, series.escritaDeLaSerie(goblet, 'kg')), 'quitada');
  await almacen.guardarYa();
  // La app se cierra con la fila destildada: lo que no se sabe quién escribió vuelve con ella.
  const { almacen: otro } = await almacenListo({ plano, api });
  const escrita = otro.sesion('borrador-1').escritas['pA:1'];
  assert.deepEqual(escrita.sinProcedencia, { carga: { value: 16, unit: 'kg' }, repeticiones: 14, rir: 3 });
  const vuelta = series.serieAlTildar(escrita, objetivoDe(GOBLET, 1), 1, 'kg').serie;
  assert.equal(otro.registrarSerie('borrador-1', { prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie: vuelta }), 'registrada');
  assert.deepEqual([otro.sesion('borrador-1').quitadas, otro.sesion('borrador-1').series], [[], []], 'alcanza con no sacarla del borrador');
  const pedidos = api.pedidos.length;
  await otro.sincronizar('borrador-1');
  assert.equal(api.pedidos.length, pedidos, 'sin pedido que reemplace la serie del servidor');
});

test('4 · lo que no se sabe quién escribió, guardado con otra forma, se descarta solo y la fila sigue', async () => {
  const plano = almacenEnMemoria();
  const { almacen } = await almacenListo({ plano });
  await almacen.escrituras();
  const guardado = JSON.parse(plano.datos.get(claveDeLaCuenta('cuenta-a')));
  guardado.sesiones[0].escritas = {
    'pA:1': { carga: '16', repeticiones: '14', rir: '', unidad: 'kg', sinProcedencia: { carga: { value: 16, unit: 'oz' }, repeticiones: 14, rir: 'tres' } },
    'pA:2': { carga: '16', repeticiones: '', rir: '', unidad: 'kg', sinProcedencia: 'otra cosa' },
  };
  plano.datos.set(claveDeLaCuenta('cuenta-a'), JSON.stringify(guardado));
  const { almacen: otro } = await almacenListo({ plano });
  assert.deepEqual(otro.sesion('borrador-1').escritas, {
    'pA:1': { carga: '16', repeticiones: '14', rir: '', tiempo: '', unidad: 'kg', sinProcedencia: { repeticiones: 14 } },
    'pA:2': { carga: '16', repeticiones: '', rir: '', tiempo: '', unidad: 'kg' },
  });
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

/**
 * Retiene la respuesta del próximo API-TRN-17: el servidor ya lo aplicó, pero el teléfono no se entera hasta `soltar()`.
 * Así se toca la casilla mientras el envío está en vuelo, como un toque sin querer en el teléfono.
 */
function retenerLaProximaRespuesta(api) {
  const original = api.guardarBorradorDeEjecucion;
  let soltar = null;
  let avisar = null;
  const llego = new Promise((r) => (avisar = r));
  api.guardarBorradorDeEjecucion = async (...args) => {
    api.guardarBorradorDeEjecucion = original;
    const respuesta = await original(...args);
    const suelta = new Promise((r) => (soltar = r));
    avisar();
    await suelta;
    return respuesta;
  };
  return { llego, soltar: () => soltar() };
}

const filaDe = (almacen, n) => {
  const s = almacen.sesion('borrador-1');
  return series.filasDelEjercicio(GOBLET, series.guardadasVigentes(s.borrador, 'pA', s.quitadas), s.series).find((f) => f.setIndex === n);
};

test('4 · destildar y volver a tildar mientras viaja el envío que la saca: la serie no se pierde ni se destilda sola', async () => {
  const api = apiDePrueba();
  const { almacen } = await almacenListo({ api });
  almacen.fijarBorrador('borrador-1', api.borrador);
  const serie = { setIndex: 2, load: { value: 16, unit: 'kg' }, completedRepetitions: 14, rir: 3, perceivedExertion: null, recordedAs: 'TYPED' };
  const laSerie = { prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie };
  almacen.registrarSerie('borrador-1', laSerie);
  await almacen.sincronizar('borrador-1');
  assert.deepEqual(series.guardadasDe(api.borrador, 'pA'), [serie], 'la serie 2 está guardada en el servidor');
  // Un toque sin querer: se destilda y sale el pedido que la saca del borrador.
  const retenido = retenerLaProximaRespuesta(api);
  almacen.quitarSerie('borrador-1', 'pA', 2, series.escritaDeLaSerie(serie, 'kg'));
  const envio = almacen.sincronizar('borrador-1');
  await retenido.llego;
  assert.deepEqual(api.pedidos.at(-1).changes.exercises, [], 'el pedido en vuelo la saca');
  // Antes de la respuesta, la vuelve a tildar: queda tildada, pendiente de enviar, y la quitada sigue.
  assert.equal(almacen.registrarSerie('borrador-1', laSerie), 'registrada');
  assert.equal(filaDe(almacen, 2).estado, 'pendiente-de-enviar');
  assert.deepEqual(almacen.sesion('borrador-1').quitadas, [{ prescriptionId: 'pA', setIndex: 2 }]);
  retenido.soltar();
  await envio;
  // Volvió el borrador sin la serie 2: la del teléfono sigue pendiente, y la fila sigue tildada.
  assert.deepEqual(series.guardadasDe(almacen.sesion('borrador-1').borrador, 'pA'), []);
  assert.equal(filaDe(almacen, 2).estado, 'pendiente-de-enviar');
  await almacen.sincronizar('borrador-1');
  assert.deepEqual(series.guardadasDe(api.borrador, 'pA'), [serie], 'la vuelta siguiente la vuelve a guardar, igual');
  assert.deepEqual([almacen.sesion('borrador-1').series, almacen.sesion('borrador-1').quitadas], [[], []]);
  assert.equal(filaDe(almacen, 2).estado, 'guardada');
});

test('4 · tildar, destildar y volver a tildar antes de que vuelva el envío: la quitada de después no borra la serie', async () => {
  const api = apiDePrueba();
  const { almacen } = await almacenListo({ api });
  almacen.fijarBorrador('borrador-1', api.borrador);
  const serie = { setIndex: 1, load: { value: 16, unit: 'kg' }, completedRepetitions: null, rir: 3, perceivedExertion: null, recordedAs: 'AS_PLANNED' };
  const laSerie = { prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie };
  const retenido = retenerLaProximaRespuesta(api);
  almacen.registrarSerie('borrador-1', laSerie);
  const envio = almacen.sincronizar('borrador-1');
  await retenido.llego;
  // El envío en vuelo la puede guardar: destildarla deja una quitada; volver a tildarla, otra serie igual en el teléfono.
  assert.equal(almacen.quitarSerie('borrador-1', 'pA', 1, null), 'quitada');
  assert.deepEqual(almacen.sesion('borrador-1').quitadas, [{ prescriptionId: 'pA', setIndex: 1 }]);
  assert.equal(almacen.registrarSerie('borrador-1', laSerie), 'registrada');
  retenido.soltar();
  await envio;
  // Volvió el borrador con la serie 1. La del teléfono no se da por enviada: su fila tiene una quitada que ese pedido no
  // llevaba, y la vuelta siguiente la aplica.
  assert.deepEqual(series.guardadasDe(almacen.sesion('borrador-1').borrador, 'pA'), [serie]);
  assert.equal(almacen.sesion('borrador-1').series.length, 1);
  assert.equal(filaDe(almacen, 1).estado, 'pendiente-de-enviar');
  await almacen.sincronizar('borrador-1');
  assert.deepEqual(series.guardadasDe(api.borrador, 'pA'), [serie], 'la serie 1 sigue en el servidor');
  assert.deepEqual([almacen.sesion('borrador-1').series, almacen.sesion('borrador-1').quitadas], [[], []]);
  assert.equal(filaDe(almacen, 1).estado, 'guardada');
  assert.equal(api.pedidos.length, 2);
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

test('ED-70 · la APK lee un borrador con procedencia y, al volver a guardarlo entero (API-TRN-17), no la pierde ni la cambia', () => {
  const delServidor = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 10, rir: 2, perceivedExertion: null, fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' } };
  const borrador = { exercises: [ejercicioDelServidor('pA', [delServidor])] };
  const nueva = series.serieAlTildar({ ...vacia, carga: '62,5' }, sesentaPorOcho, 2, 'kg').serie;
  const { exercises } = series.ejerciciosParaGuardar(borrador, [{ prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie: nueva, enConflicto: false }]);
  assert.deepEqual(exercises[0].sets, [delServidor, nueva]);
  assert.deepEqual(nueva.fieldOrigins, { load: 'PERSON', completedRepetitions: 'PLAN', rir: 'PLAN' });
  assert.equal(EditarBorradorDeEjecucionRequestSchema.safeParse({ expectedVersion: 'v1', changes: { granularity: 'SET', exercises } }).success, true);
  // La serie que el servidor ya tiene igual, con sus claves en otro orden, se reconoce: no queda en conflicto.
  const devuelta = { ...nueva, fieldOrigins: { rir: 'PLAN', completedRepetitions: 'PLAN', load: 'PERSON' } };
  const conLaNueva = { exercises: [ejercicioDelServidor('pA', [delServidor, devuelta])] };
  assert.deepEqual(series.conciliarSeries([{ prescriptionId: 'pA', performedExerciseVersionId: 'ev-pA', serie: nueva, enConflicto: false }], conLaNueva), []);
});
