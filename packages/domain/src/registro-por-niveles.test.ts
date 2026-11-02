/**
 * Registro por niveles (DL-161): cómo se cargó cada serie, su duración y el nivel de detalle de la sesión.
 *
 * Los resultados esperados se escriben a mano, desde la decisión de Dirección del 2026-11-02 y de las reglas del
 * legajo que la sostienen (B10-06 §56; 09v10:1099-1101). Datos sintéticos. Si una prueba falla, se corrige el cálculo,
 * no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { EjecucionDeEntrenamiento, EjercicioRegistradoEntrada, RegistroDeEjecucion, SerieEjecutadaApi } from './contratos-entrenamiento';
import { COPY_REGISTRO_POR_NIVELES, ETIQUETA_DE_NIVEL_DE_DETALLE, terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import { problemasDeCoherencia, problemasParaConfirmar } from './plan-de-entrenamiento';
import {
  ejerciciosEnSuForma,
  ejerciciosSinLaMarca,
  esNivelPorSerie,
  nivelDeDetalle,
  nivelDeDetalleDelRegistro,
  seCargoComoElPlan,
  serieEnSuForma,
  textoDelNivelDeDetalle,
  type NivelDeDetalle,
} from './registro-por-niveles';

const kg = (value: number) => ({ value, unit: 'kg' as const });
/** Una serie como la registraba la APK antes de DL-161: los cinco campos de siempre. */
const escrita = (setIndex: number, reps: number | null = 8, carga: number | null = 60): SerieEjecutadaApi => ({
  setIndex,
  load: carga === null ? null : kg(carga),
  completedRepetitions: reps,
  rir: null,
  perceivedExertion: null,
});
const comoElPlan = (setIndex: number, extra: Partial<SerieEjecutadaApi> = {}): SerieEjecutadaApi => ({ ...escrita(setIndex), recordedAs: 'AS_PLANNED', ...extra });

const CINCO = ['setIndex', 'load', 'completedRepetitions', 'rir', 'perceivedExertion'];

// ─── La serie en su forma ───────────────────────────────────────────────────────────────────────────────────

test('una serie registrada antes de DL-161 queda idéntica: los mismos cinco campos, en el mismo orden', () => {
  const s = escrita(1);
  assert.deepEqual(serieEnSuForma(s), s);
  assert.deepEqual(Object.keys(serieEnSuForma(s)), CINCO);
  // Sin carga ni repeticiones (un borrador a medio escribir) tampoco se completa nada.
  assert.deepEqual(serieEnSuForma(escrita(2, null, null)), escrita(2, null, null));
});

test('«TYPED» y una duración nula dicen lo mismo que la ausencia: no se guardan ni se devuelven', () => {
  assert.deepEqual(serieEnSuForma({ ...escrita(1), recordedAs: 'TYPED', durationSeconds: null }), escrita(1));
  assert.deepEqual(Object.keys(serieEnSuForma({ ...escrita(1), recordedAs: 'TYPED' })), CINCO);
});

test('«como el plan» y la duración se conservan tal cual: ni se pierden ni se completan', () => {
  assert.deepEqual(serieEnSuForma(comoElPlan(1, { durationSeconds: 45 })), { ...escrita(1), recordedAs: 'AS_PLANNED', durationSeconds: 45 });
  // Una duración de cero segundos es un dato (la escribió alguien): no es «sin duración».
  assert.deepEqual(serieEnSuForma({ ...escrita(1), durationSeconds: 0 }), { ...escrita(1), durationSeconds: 0 });
  // Una serie escrita con su duración: la marca no aparece.
  assert.deepEqual(Object.keys(serieEnSuForma({ ...escrita(1), recordedAs: 'TYPED', durationSeconds: 30 })), [...CINCO, 'durationSeconds']);
  assert.equal(seCargoComoElPlan(comoElPlan(1)), true);
  assert.equal(seCargoComoElPlan(escrita(1)), false);
});

test('los ejercicios en su forma: las series se normalizan; un ejercicio resumido queda igual', () => {
  const ejercicios: EjercicioRegistradoEntrada[] = [
    { prescriptionId: 'rx-banca', performedExerciseVersionId: 'ver-banca', sets: [{ ...escrita(1), recordedAs: 'TYPED' }, comoElPlan(2, { durationSeconds: null })] },
    { prescriptionId: 'rx-remo', performedExerciseVersionId: 'ver-remo', executionSummary: { description: 'Tres series livianas.' } },
  ];
  assert.deepEqual(ejerciciosEnSuForma(ejercicios), [
    { prescriptionId: 'rx-banca', performedExerciseVersionId: 'ver-banca', sets: [escrita(1), { ...escrita(2), recordedAs: 'AS_PLANNED' }] },
    { prescriptionId: 'rx-remo', performedExerciseVersionId: 'ver-remo', executionSummary: { description: 'Tres series livianas.' } },
  ]);
  // Sin la marca, para saber si una corrección cambia algún dato: la duración sí queda.
  assert.deepEqual(ejerciciosSinLaMarca(ejercicios.slice(0, 1).map((e) => ('sets' in e ? { ...e, sets: [comoElPlan(1, { durationSeconds: 40 })] } : e))), [
    { prescriptionId: 'rx-banca', performedExerciseVersionId: 'ver-banca', sets: [{ ...escrita(1), durationSeconds: 40 }] },
  ]);
});

// ─── Sin serie realizada sin datos ──────────────────────────────────────────────────────────────────────────

const enBorrador = (sets: SerieEjecutadaApi[]) => ({
  condicion: 'REALIZADA' as const,
  granularidad: 'SERIE' as const,
  ejercicios: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: 'ver-banca', sets }],
  resumenDeSesion: null,
});

test('una serie «como el plan» sin carga ni repeticiones se rechaza ya al guardar; una escrita a medias, recién al confirmar', () => {
  // Solo el RIR del plan: no hay carga ni repeticiones que la persona haya confirmado.
  const soloRir = { ...escrita(1, null, null), rir: 2, recordedAs: 'AS_PLANNED' as const };
  assert.deepEqual(problemasDeCoherencia(enBorrador([soloRir])).valores, [{ code: 'SET_WITHOUT_DATA', path: 'exercises[0].sets[0]' }]);
  // Una escrita sin datos sigue como antes: se guarda en el borrador y se frena al confirmar.
  assert.deepEqual(problemasDeCoherencia(enBorrador([escrita(1, null, null)])).valores, []);
  assert.deepEqual(problemasParaConfirmar(enBorrador([escrita(1, null, null)])), [{ code: 'SET_WITHOUT_DATA', path: 'exercises[0].sets[0]' }]);
  // Al confirmar, la de «como el plan» se dice una sola vez.
  assert.deepEqual(problemasParaConfirmar(enBorrador([escrita(1), { ...soloRir, setIndex: 2 }])), [{ code: 'SET_WITHOUT_DATA', path: 'exercises[0].sets[1]' }]);
  // Con la carga o con las repeticiones del plan, se puede.
  assert.deepEqual(problemasParaConfirmar(enBorrador([comoElPlan(1), { ...comoElPlan(2), load: null }, { ...comoElPlan(3), completedRepetitions: null }])), []);
  // La duración sola no es un dato de la serie: lo que registra es la carga o las repeticiones.
  assert.deepEqual(problemasParaConfirmar(enBorrador([{ ...escrita(1, null, null), durationSeconds: 50 }])), [{ code: 'SET_WITHOUT_DATA', path: 'exercises[0].sets[0]' }]);
});

// ─── El nivel de detalle ────────────────────────────────────────────────────────────────────────────────────

type Registro = Pick<RegistroDeEjecucion, 'sessionCondition' | 'granularity'> & { exercises: { sets: SerieEjecutadaApi[] | null }[] };
const porSerie = (...ejercicios: SerieEjecutadaApi[][]): Registro => ({ sessionCondition: 'COMPLETED', granularity: 'SET', exercises: ejercicios.map((sets) => ({ sets })) });

test('el nivel de detalle: con detalle, como el plan, parte como el plan, resumida o no realizada', () => {
  assert.equal(nivelDeDetalleDelRegistro(porSerie([escrita(1), escrita(2)], [escrita(1)])), 'CON_DETALLE');
  assert.equal(nivelDeDetalleDelRegistro(porSerie([comoElPlan(1), comoElPlan(2)], [comoElPlan(1)])), 'COMO_EL_PLAN');
  // Una sola serie escrita en toda la sesión alcanza para que sea «parte».
  assert.equal(nivelDeDetalleDelRegistro(porSerie([comoElPlan(1), comoElPlan(2)], [escrita(1)])), 'PARTE_COMO_EL_PLAN');
  // La duración no cambia el nivel: medir no es escribir.
  assert.equal(nivelDeDetalleDelRegistro(porSerie([{ ...comoElPlan(1), durationSeconds: 40 }])), 'COMO_EL_PLAN');
  assert.equal(nivelDeDetalleDelRegistro(porSerie([{ ...escrita(1), durationSeconds: 40 }])), 'CON_DETALLE');
  // Con desvío también se dice cómo se cargó: la condición es otra cosa, la declara la persona.
  assert.equal(nivelDeDetalleDelRegistro({ ...porSerie([comoElPlan(1)]), sessionCondition: 'COMPLETED_WITH_DEVIATION' }), 'COMO_EL_PLAN');
  assert.equal(nivelDeDetalleDelRegistro({ sessionCondition: 'COMPLETED', granularity: 'EXERCISE_OR_SESSION', exercises: [{ sets: null }] }), 'RESUMIDA');
  assert.equal(nivelDeDetalleDelRegistro({ sessionCondition: 'COMPLETED_WITH_DEVIATION', granularity: 'EXERCISE_OR_SESSION', exercises: [] }), 'RESUMIDA');
  assert.equal(nivelDeDetalleDelRegistro({ sessionCondition: 'NOT_COMPLETED', granularity: null, exercises: [] }), 'NO_REALIZADA');
});

test('lo que no se puede confirmar no recibe un nivel inventado', () => {
  assert.equal(nivelDeDetalleDelRegistro(porSerie()), null);
  assert.equal(nivelDeDetalleDelRegistro(porSerie([])), null);
  assert.equal(nivelDeDetalleDelRegistro({ sessionCondition: 'COMPLETED', granularity: null, exercises: [] }), null);
});

test('el nivel de una ejecución es el de lo que rige: la corrección vigente; con la cadena sin resolver, no se dice', () => {
  const original = { ...porSerie([comoElPlan(1), comoElPlan(2)]), reason: null, sessionSummary: null } as unknown as RegistroDeEjecucion;
  const corregido = { ...porSerie([comoElPlan(1), escrita(2, 6)]), reason: null, sessionSummary: null } as unknown as RegistroDeEjecucion;
  const correccion = { correctionId: 'c-1', previousCorrectionId: null, reason: 'La segunda fue de 6', correction: corregido, author: { identityId: 'a', displayName: 'A' }, authorRole: 'ADVISEE', recordedAt: '2026-11-02T20:00:00.000Z' };
  const x = (effectiveView: EjecucionDeEntrenamiento['effectiveView']) => ({ original, corrections: [correccion], effectiveView }) as unknown as EjecucionDeEntrenamiento;
  assert.equal(nivelDeDetalle(x({ kind: 'ORIGINAL' })), 'COMO_EL_PLAN');
  assert.equal(nivelDeDetalle(x({ kind: 'CORRECTED', correctionId: 'c-1' })), 'PARTE_COMO_EL_PLAN');
  assert.equal(nivelDeDetalle(x({ kind: 'NOT_RESOLVABLE' })), null);
});

// ─── Las palabras ───────────────────────────────────────────────────────────────────────────────────────────

const NIVELES: readonly NivelDeDetalle[] = ['CON_DETALLE', 'COMO_EL_PLAN', 'PARTE_COMO_EL_PLAN', 'RESUMIDA', 'NO_REALIZADA'];

test('cada nivel en palabras, y «No realizada» sale de la condición que registró la persona', () => {
  assert.deepEqual(
    NIVELES.map((n) => textoDelNivelDeDetalle(n)),
    ['Con detalle', 'Cargada como el plan', 'Parte como el plan', 'Resumida, sin series', 'No realizada'],
  );
  assert.deepEqual(
    NIVELES.filter((n) => esNivelPorSerie(n)),
    ['CON_DETALLE', 'COMO_EL_PLAN', 'PARTE_COMO_EL_PLAN'],
  );
  assert.equal(esNivelPorSerie(null), false);
  assert.equal(COPY_REGISTRO_POR_NIVELES.duro('00:45'), 'Duró 00:45');
});

test('los textos describen cómo se cargó: sin puntajes, sin cumplimiento, sin «bien» ni «mal» y sin tildes de aprobado', () => {
  const textos = [
    ...Object.values(ETIQUETA_DE_NIVEL_DE_DETALLE),
    ...NIVELES.map((n) => textoDelNivelDeDetalle(n)),
    COPY_REGISTRO_POR_NIVELES.comoSeCargo,
    COPY_REGISTRO_POR_NIVELES.comoElPlan,
    COPY_REGISTRO_POR_NIVELES.queEsComoElPlan,
    COPY_REGISTRO_POR_NIVELES.duro('01:30'),
  ];
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /\b(bien|mal|excelente|perfect[oa]|correct[oa]|incorrect[oa]|cumpli)/i, t);
    assert.doesNotMatch(t, /[✓✔☑✅]/u, t);
  }
});
