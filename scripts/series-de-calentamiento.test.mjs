/**
 * DL-178 (decisión de Dirección del 2026-11-18) · las series de calentamiento en la APK: se ven y se registran
 * diferenciadas («Calentamiento»), y no entran en la cuenta, en la barra de la sesión ni en «Serie N de M».
 *
 * **Lo que esto no prueba:** el dibujo, el teléfono ni TalkBack. Eso queda para la candidata.
 * Uso: node --test scripts/series-de-calentamiento.test.mjs (después de construir @be/domain).
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
const { filaDeAcciones } = await import('../apps/mobile/src/descanso-automatico.ts');
const { serieDelPlan } = await import('../apps/mobile/src/registro-rapido.ts');

const objetivo = (reps) => ({ repetitions: { value: reps }, rir: 2, suggestedLoad: { value: 60, unit: 'kg' }, restSeconds: 90 });
const serie = (setIndex, reps, setKind) => ({
  setIndex,
  note: null,
  ...(setKind ? { setKind } : {}),
  target: objetivo(reps),
  targetOrigin: { rir: 'PRESCRIPTION', suggestedLoad: 'PRESCRIPTION', restSeconds: 'PRESCRIPTION' },
});
const BANCA = { prescriptionId: 'rx-banca', exerciseName: 'Press de banca', sets: [serie(1, 12, 'WARM_UP'), serie(2, 5, 'WARM_UP'), serie(3, 8), serie(4, 8), serie(5, 8)] };
const SIN_CALENTAMIENTO = { prescriptionId: 'rx-remo', exerciseName: 'Remo', sets: [serie(1, 10), serie(2, 10)] };
const registrada = (setIndex, setKind) => ({ setIndex, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 2, perceivedExertion: null, ...(setKind ? { setKind } : {}) });

test('DL-178 · las filas: el calentamiento lleva «C» y se nombra así; las efectivas se numeran 1, 2, 3', () => {
  const filas = series.filasDelEjercicio(BANCA, [], []);
  assert.deepEqual(
    filas.map((f) => [f.setIndex, f.tipo, f.numero, series.marcaDeLaFila(f), series.nombreDeLaFila(f)]),
    [
      [1, 'WARM_UP', null, 'C', 'Calentamiento'],
      [2, 'WARM_UP', null, 'C', 'Calentamiento'],
      [3, 'WORKING', 1, '1', 'Serie 1'],
      [4, 'WORKING', 2, '2', 'Serie 2'],
      [5, 'WORKING', 3, '3', 'Serie 3'],
    ],
  );
  // Sin calentamiento, todo como antes: el número es el setIndex.
  assert.deepEqual(
    series.filasDelEjercicio(SIN_CALENTAMIENTO, [], []).map((f) => [f.setIndex, f.tipo, f.numero]),
    [
      [1, 'WORKING', 1],
      [2, 'WORKING', 2],
    ],
  );
  assert.equal(series.bandaDeLaSerie(1, objetivo(12), null).titulo, 'Plan del calentamiento');
  assert.equal(series.bandaDeLaSerie(3, objetivo(8), 1).titulo, series.bandaDeLaSerie(1, objetivo(8)).titulo, 'la serie 1 efectiva se titula como la serie 1 de siempre');
});

test('DL-178 · registrar: el calentamiento viaja con su tipo; una efectiva, sin el campo, como siempre', () => {
  const vacia = { ...series.FILA_VACIA };
  const c = series.serieAlTildar(vacia, objetivo(12), 1, 'kg', 'WARM_UP');
  assert.equal(c.ok, true);
  assert.equal(c.serie.setKind, 'WARM_UP');
  const e = series.serieAlTildar(vacia, objetivo(8), 3, 'kg');
  assert.equal(e.ok, true);
  assert.equal('setKind' in e.serie, false);
  // El registro rápido («como el plan») también.
  assert.equal(serieDelPlan(serie(1, 12, 'WARM_UP')).setKind, 'WARM_UP');
  assert.equal('setKind' in serieDelPlan(serie(3, 8)), false);
});

test('DL-178 · la barra y la cuenta son de las efectivas: registrar el calentamiento no avanza nada', () => {
  const sesion = { prescriptions: [BANCA] };
  const borrador = (sets) => ({ exercises: [{ prescriptionId: 'rx-banca', prescribedExerciseVersionId: 'v', prescribedExerciseName: 'Press de banca', performedExerciseVersionId: 'v', performedExerciseName: 'Press de banca', substituted: false, sets, executionSummary: null }] });
  const soloCalentamiento = series.resumenDelRegistro(sesion, borrador([registrada(1, 'WARM_UP'), registrada(2, 'WARM_UP')]), []);
  assert.deepEqual([soloCalentamiento[0].registradas, soloCalentamiento[0].planificadas, soloCalentamiento[0].sinRegistrar], [0, 3, [3, 4, 5]]);
  assert.deepEqual(franja.cuentaDelRecorrido(soloCalentamiento), { registradas: 0, planificadas: 3 });
  assert.equal(franja.tramosDelRecorrido(soloCalentamiento, 'rx-banca')[0].fraccion, 0);
  const conUna = series.resumenDelRegistro(sesion, borrador([registrada(1, 'WARM_UP'), registrada(2, 'WARM_UP'), registrada(3)]), []);
  assert.deepEqual(franja.cuentaDelRecorrido(conUna), { registradas: 1, planificadas: 3 });
  // Un calentamiento sin registrar no queda como «sin registrar» en «Antes de finalizar»: no cuenta.
  assert.deepEqual(series.resumenDelRegistro(sesion, borrador([registrada(3), registrada(4), registrada(5)]), [])[0].sinRegistrar, []);
});

test('DL-178 · «Serie N de M», «Terminar calentamiento» y la cuenta de la sesión', () => {
  const filas = series.filasDelEjercicio(BANCA, [], []);
  assert.equal(franja.posicionEnLaSesion(1, 2, filas[0], 3), 'Ejercicio 1 de 2 · Calentamiento');
  assert.equal(franja.posicionEnLaSesion(1, 2, filas[2], 3), 'Ejercicio 1 de 2 · Serie 1 de 3');
  const numeroDe = (i) => filas.find((f) => f.setIndex === i)?.numero ?? i;
  const base = { pausada: false, prescriptionId: 'rx-banca', haySiguienteEjercicio: false, numeroDe };
  assert.equal(filaDeAcciones({ ...base, abierta: { kind: 'SET', prescriptionId: 'rx-banca', setIndex: 1 }, siguienteSinRegistrar: null }).medio.texto, 'Terminar calentamiento');
  assert.equal(filaDeAcciones({ ...base, abierta: { kind: 'SET', prescriptionId: 'rx-banca', setIndex: 3 }, siguienteSinRegistrar: null }).medio.texto, 'Terminar serie 1');
  assert.equal(filaDeAcciones({ ...base, abierta: null, siguienteSinRegistrar: 1 }).medio.texto, 'Empezar calentamiento');
  // Sin `numeroDe` (y sin calentamiento), como siempre.
  assert.equal(filaDeAcciones({ pausada: false, prescriptionId: 'rx-remo', haySiguienteEjercicio: false, abierta: { kind: 'SET', prescriptionId: 'rx-remo', setIndex: 2 }, siguienteSinRegistrar: null }).medio.texto, 'Terminar serie 2');
  assert.equal(series.ejerciciosYSeries([BANCA, SIN_CALENTAMIENTO]), '2 ejercicios · 5 series efectivas + 2 de calentamiento');
  assert.equal(series.ejerciciosYSeries([SIN_CALENTAMIENTO]), '1 ejercicio · 2 series');
});
