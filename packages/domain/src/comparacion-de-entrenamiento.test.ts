/**
 * Planificado y registrado (`comparacion-de-entrenamiento.ts`): la lógica que usan el gráfico y la tabla del website.
 * Datos sintéticos, validados contra el esquema estricto de la ejecución (API-TRN-19/21), para que las pruebas no se
 * apoyen en una forma que la API no puede devolver.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EjecucionDeEntrenamientoSchema, type EjecucionDeEntrenamiento, type Prescripcion, type SerieEjecutadaApi } from './contratos-entrenamiento';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import {
  COPY_COMPARACION,
  compararEjecucion,
  diferencia,
  diferenciaEnPalabras,
  ejerciciosComparables,
  etiquetaDeMedida,
  evolucion,
  medidasDisponibles,
  numerosDeSerie,
  rotuloCorto,
  observacionesDelEjercicio,
  seriesParaGraficar,
  textoDeDiferencia,
  textoPlanificado,
  textoRegistrado,
  type Medida,
} from './comparacion-de-entrenamiento';

const REPS: Medida = { variable: 'repeticiones' };
const KG: Medida = { variable: 'carga', unidad: 'kg' };
const LB: Medida = { variable: 'carga', unidad: 'lb' };
const RIR: Medida = { variable: 'rir' };

const BANCA = { exerciseId: 'ej-banca', exerciseVersionId: 'ver-banca-1', exerciseName: 'Press de banca' };
const SENTADILLA = { exerciseId: 'ej-sentadilla', exerciseVersionId: 'ver-sentadilla-1', exerciseName: 'Sentadilla' };
const MANCUERNAS = { versionId: 'ver-mancuernas-1', nombre: 'Press con mancuernas' };

type Reps = Prescripcion['sets'][number]['repetitions'];
const exacta = (value: number): Reps => ({ value });
const rango = (min: number, max: number): Reps => ({ min, max });

function prescripcion(id: string, ejercicio: typeof BANCA, reps: Reps[], extra: Partial<Prescripcion> = {}): Prescripcion {
  return {
    prescriptionId: id,
    order: 1,
    ...ejercicio,
    sets: reps.map((repetitions, i) => ({ setIndex: i + 1, repetitions, note: null })),
    intensity: null,
    suggestedLoad: null,
    professionalParameters: [],
    note: null,
    ...extra,
  };
}

const serie = (setIndex: number, completedRepetitions: number | null, load: SerieEjecutadaApi['load'] = { value: 60, unit: 'kg' }, rir: number | null = null): SerieEjecutadaApi => ({
  setIndex,
  load,
  completedRepetitions,
  rir,
  perceivedExertion: null,
});

type Registrado = { prescriptionId: string; sets?: SerieEjecutadaApi[]; resumen?: string; realizado?: { versionId: string; nombre: string } };

function registro(prescripciones: Prescripcion[], ejercicios: Registrado[], condicion: 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED' = 'COMPLETED') {
  const porSerie = ejercicios.every((e) => e.sets);
  return {
    granularity: condicion === 'NOT_COMPLETED' ? null : porSerie ? ('SET' as const) : ('EXERCISE_OR_SESSION' as const),
    sessionCondition: condicion,
    reason: null,
    exercises: ejercicios.map((e) => {
      const p = prescripciones.find((q) => q.prescriptionId === e.prescriptionId)!;
      const realizado = e.realizado ?? { versionId: p.exerciseVersionId, nombre: p.exerciseName };
      return {
        prescriptionId: e.prescriptionId,
        prescribedExerciseVersionId: p.exerciseVersionId,
        prescribedExerciseName: p.exerciseName,
        performedExerciseVersionId: realizado.versionId,
        performedExerciseName: realizado.nombre,
        substituted: realizado.versionId !== p.exerciseVersionId,
        sets: e.sets ?? null,
        executionSummary: e.resumen ? { description: e.resumen } : null,
      };
    }),
    sessionSummary: null,
  };
}

let secuencia = 0;
function ejecucion(opciones: {
  fecha: string;
  hora?: string;
  planId?: string;
  sesion?: string;
  prescripciones: Prescripcion[];
  registrado: Registrado[];
  condicion?: 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED';
  correccion?: { registrado: Registrado[]; motivo: string; rol?: 'ADVISEE' | 'PROFESSIONAL'; condicion?: 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED' };
  noResoluble?: boolean;
}): EjecucionDeEntrenamiento {
  const id = `x-${++secuencia}`;
  const ocurrio = `${opciones.fecha}T${opciones.hora ?? '10:00'}:00.000-03:00`;
  const correcciones = opciones.correccion
    ? [
        {
          correctionId: `c-${id}`,
          previousCorrectionId: null,
          reason: opciones.correccion.motivo,
          correction: registro(opciones.prescripciones, opciones.correccion.registrado, opciones.correccion.condicion),
          author: { identityId: 'pro-1', displayName: 'Prof. Sintética' },
          authorRole: opciones.correccion.rol ?? 'PROFESSIONAL',
          recordedAt: `${opciones.fecha}T20:00:00.000-03:00`,
        },
      ]
    : [];
  return EjecucionDeEntrenamientoSchema.parse({
    executionId: id,
    state: 'REGISTERED',
    adviseeId: 'ase-1',
    planId: opciones.planId ?? 'plan-v1',
    snapshotDigest: 'a'.repeat(64),
    occurrenceId: `oc-${id}`,
    date: opciones.fecha,
    timeZone: 'America/Argentina/Buenos_Aires',
    plannedSession: {
      sessionId: 'ses-a',
      label: opciones.sesion ?? 'Sesión A',
      order: 1,
      instructions: null,
      prescriptions: opciones.prescripciones,
      blockId: 'blq-1',
      blockLabel: 'Bloque 1',
      microcycleId: null,
      microcycleLabel: null,
    },
    original: registro(opciones.prescripciones, opciones.registrado, opciones.condicion),
    corrections: correcciones,
    effectiveView: opciones.noResoluble ? { kind: 'NOT_RESOLVABLE' } : correcciones.length ? { kind: 'CORRECTED', correctionId: correcciones[0]!.correctionId } : { kind: 'ORIGINAL' },
    occurredAt: ocurrio,
    recordedAt: ocurrio,
  });
}

const piramide = prescripcion('rx-banca', BANCA, [exacta(10), exacta(8), exacta(6)], { intensity: { criterion: 'RIR', target: { value: 2, reference: null } }, suggestedLoad: { value: 60, unit: 'kg' } });
const tresPorOcho = prescripcion('rx-banca', BANCA, [exacta(8), exacta(8), exacta(8)], { suggestedLoad: { value: 55, unit: 'kg' } });

// ─── A · Por serie dentro de una ejecución ──────────────────────────────────────────────────────

test('caso de aceptación · pirámide 10/8/6 contra 10/8/5: la serie 3 muestra −1, las otras, igual', () => {
  const x = ejecucion({ fecha: '2026-09-01', prescripciones: [piramide], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 10), serie(2, 8), serie(3, 5)] }] });
  const [banca] = compararEjecucion(x);
  const filas = seriesParaGraficar(banca!, REPS);
  assert.deepEqual(filas.map((f) => f.numero), [1, 2, 3]);
  assert.deepEqual(filas.map((f) => textoPlanificado(f.planificado, REPS)), ['10', '8', '6']);
  assert.deepEqual(filas.map((f) => textoRegistrado(f.registrado, REPS)), ['10', '8', '5']);
  assert.deepEqual(filas.map((f) => f.diferencia && textoDeDiferencia(f.diferencia, REPS)), ['igual', 'igual', '−1']);
  assert.equal(diferenciaEnPalabras(filas[2]!.diferencia!, REPS), '1 repetición menos que lo planificado');
});

test('números reales: una serie salteada queda como sin dato y una de más es adicional, sin prescripción inventada', () => {
  const x = ejecucion({ fecha: '2026-09-01', prescripciones: [tresPorOcho], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 8), serie(2, 8), serie(4, 6)] }] });
  const filas = seriesParaGraficar(compararEjecucion(x)[0]!, REPS);
  assert.deepEqual(filas.map((f) => f.numero), [1, 2, 3, 4]);
  assert.deepEqual(filas[2]!.planificado, { tipo: 'valor', valor: 8, origen: 'serie', sugerida: false });
  assert.deepEqual(filas[2]!.registrado, { tipo: 'sin-dato', motivo: 'serie-no-registrada' });
  assert.equal(filas[2]!.diferencia, null);
  assert.deepEqual(filas[3]!.planificado, { tipo: 'no-planificada' });
  assert.deepEqual(filas[3]!.registrado, { tipo: 'valor', valor: 6 });
  assert.equal(filas[3]!.diferencia, null);
  assert.equal(textoPlanificado(filas[3]!.planificado, REPS), COPY_COMPARACION.noPlanificada);
});

test('ausencia ≠ cero: sin ejercicio en el registro, con resumen o con un campo sin registrar, nunca hay un 0', () => {
  const sentadilla = prescripcion('rx-sentadilla', SENTADILLA, [rango(6, 8), rango(6, 8)]);
  const sinEjercicio = ejecucion({ fecha: '2026-09-01', prescripciones: [piramide, sentadilla], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, null, null)] }] });
  const [banca, sent] = compararEjecucion(sinEjercicio);
  assert.deepEqual(valores(seriesParaGraficar(sent!, REPS)), [
    { tipo: 'sin-dato', motivo: 'ejercicio-no-registrado' },
    { tipo: 'sin-dato', motivo: 'ejercicio-no-registrado' },
  ]);
  // La serie 1 se registró sin repeticiones ni carga: sin dato de cada campo, no cero.
  assert.deepEqual(seriesParaGraficar(banca!, REPS)[0]!.registrado, { tipo: 'sin-dato', motivo: 'campo-no-registrado' });
  assert.deepEqual(seriesParaGraficar(banca!, KG)[0]!.registrado, { tipo: 'sin-dato', motivo: 'campo-no-registrado' });
  assert.equal(textoRegistrado(seriesParaGraficar(banca!, KG)[0]!.registrado, KG), 'Sin dato: carga no registrada');

  const resumida = ejecucion({ fecha: '2026-09-02', prescripciones: [piramide], registrado: [{ prescriptionId: 'rx-banca', resumen: 'Series livianas por molestia en el hombro.' }] });
  const c = compararEjecucion(resumida)[0]!;
  assert.equal(c.resumen, 'Series livianas por molestia en el hombro.');
  assert.ok(seriesParaGraficar(c, REPS).every((f) => f.registrado.tipo === 'sin-dato' && f.registrado.motivo === 'registro-resumido'));
  for (const f of [...seriesParaGraficar(sent!, REPS), ...seriesParaGraficar(c, REPS)]) assert.notEqual(f.registrado.tipo, 'valor');
});

test('«no realizada» solo con la declaración de la sesión; una serie que falta en «realizada» es sin dato', () => {
  const noRealizada = ejecucion({ fecha: '2026-09-01', prescripciones: [piramide], registrado: [], condicion: 'NOT_COMPLETED' });
  assert.ok(seriesParaGraficar(compararEjecucion(noRealizada)[0]!, REPS).every((f) => f.registrado.tipo === 'no-realizada'));
  // «Realizada» no prueba cada serie, y una serie que falta no prueba que se omitió.
  const realizada = ejecucion({ fecha: '2026-09-02', prescripciones: [piramide], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 10)] }], condicion: 'COMPLETED' });
  const filas = seriesParaGraficar(compararEjecucion(realizada)[0]!, REPS);
  assert.deepEqual(filas.slice(1).map((f) => f.registrado), [
    { tipo: 'sin-dato', motivo: 'serie-no-registrada' },
    { tipo: 'sin-dato', motivo: 'serie-no-registrada' },
  ]);
});

test('rangos como rangos: 6-8 no se vuelve 7; dentro, por debajo y por encima se dicen respecto del rango', () => {
  const sentadilla = prescripcion('rx-sentadilla', SENTADILLA, [rango(6, 8), rango(6, 8), rango(6, 8)]);
  const x = ejecucion({ fecha: '2026-09-01', prescripciones: [sentadilla], registrado: [{ prescriptionId: 'rx-sentadilla', sets: [serie(1, 7), serie(2, 5), serie(3, 10)] }] });
  const filas = seriesParaGraficar(compararEjecucion(x)[0]!, REPS);
  assert.deepEqual(filas[0]!.planificado, { tipo: 'rango', min: 6, max: 8 });
  assert.equal(textoPlanificado(filas[0]!.planificado, REPS), '6-8');
  assert.deepEqual(filas.map((f) => textoDeDiferencia(f.diferencia!, REPS)), ['dentro del rango', '−1 del mínimo', '+2 del máximo']);
  assert.equal(diferenciaEnPalabras(filas[2]!.diferencia!, REPS), '2 repeticiones más que el máximo del rango');
});

test('repeticiones sin fijar, criterio y carga: la sugerida se marca, el %RM no se convierte y el RIR es de la prescripción', () => {
  const sinFijar = prescripcion('rx-dominadas', { exerciseId: 'ej-dom', exerciseVersionId: 'ver-dom', exerciseName: 'Dominadas' }, [null]);
  const conRm = prescripcion('rx-sentadilla', SENTADILLA, [exacta(5)], { intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM estimado por el profesional' } } } });
  const x = ejecucion({
    fecha: '2026-09-01',
    prescripciones: [sinFijar, conRm, piramide],
    registrado: [
      { prescriptionId: 'rx-dominadas', sets: [serie(1, 6, null)] },
      { prescriptionId: 'rx-sentadilla', sets: [serie(1, 5, { value: 100, unit: 'kg' })] },
      { prescriptionId: 'rx-banca', sets: [serie(1, 10, { value: 62.5, unit: 'kg' }, 1)] },
    ],
  });
  const [dominadas, sentadilla, banca] = compararEjecucion(x);
  const d = seriesParaGraficar(dominadas!, REPS)[0]!;
  assert.deepEqual(d.planificado, { tipo: 'sin-fijar' });
  assert.equal(d.diferencia, null);
  const s = seriesParaGraficar(sentadilla!, KG)[0]!;
  assert.deepEqual(s.planificado, { tipo: 'porcentaje-rm', valor: 75, referencia: '1RM estimado por el profesional' });
  assert.equal(textoPlanificado(s.planificado, KG), '75 % RM (1RM estimado por el profesional)');
  assert.equal(s.diferencia, null, 'un %RM no se compara con kg');
  const b = seriesParaGraficar(banca!, KG)[0]!;
  assert.deepEqual(b.planificado, { tipo: 'valor', valor: 60, origen: 'prescripcion', sugerida: true });
  assert.equal(textoPlanificado(b.planificado, KG), '60 kg (sugerida)');
  // La sugerida no es una obligación: la diferencia se dice respecto de ella, en el gráfico y en palabras.
  assert.equal(textoDeDiferencia(b.diferencia!, KG), '+2,5 kg respecto de la sugerida');
  assert.equal(diferenciaEnPalabras(b.diferencia!, KG), '2,5 kg más que la carga sugerida');
  assert.equal(rotuloCorto(b, KG), '+2,5 kg sug.');
  const r = seriesParaGraficar(banca!, RIR)[0]!;
  assert.deepEqual(r.planificado, { tipo: 'valor', valor: 2, origen: 'prescripcion', sugerida: false });
  assert.equal(diferenciaEnPalabras(r.diferencia!, RIR), '1 de RIR menos que lo planificado');
});

test('unidades: kg y lb no se mezclan; la otra unidad no se convierte y no tiene diferencia', () => {
  const x = ejecucion({ fecha: '2026-09-01', prescripciones: [piramide], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 10, { value: 135, unit: 'lb' })] }] });
  const c = compararEjecucion(x)[0]!;
  assert.deepEqual(medidasDisponibles([c]).map(etiquetaDeMedida), ['Repeticiones', 'Carga (kg)', 'Carga (lb)', 'RIR']);
  const kg = seriesParaGraficar(c, KG)[0]!;
  assert.deepEqual(kg.registrado, { tipo: 'otra-unidad', carga: { value: 135, unit: 'lb' } });
  assert.equal(kg.diferencia, null);
  const lb = seriesParaGraficar(c, LB)[0]!;
  assert.deepEqual(lb.registrado, { tipo: 'valor', valor: 135 });
  assert.deepEqual(lb.planificado, { tipo: 'otra-unidad', carga: { value: 60, unit: 'kg' } });
  assert.equal(lb.diferencia, null);
});

test('medidas: sin carga ni RIR en lo planificado ni en lo registrado, solo repeticiones', () => {
  const simple = prescripcion('rx-banca', BANCA, [exacta(8)]);
  const x = ejecucion({ fecha: '2026-09-01', prescripciones: [simple], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 8, null)] }] });
  assert.deepEqual(medidasDisponibles(compararEjecucion(x)), [REPS]);
});

test('correcciones: rige la vigente, y cada serie conserva el original para la trazabilidad', () => {
  const x = ejecucion({
    fecha: '2026-09-01',
    prescripciones: [tresPorOcho],
    registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 8), serie(2, 8), serie(3, 8)] }],
    correccion: { motivo: 'Fueron 7 en la segunda.', registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 8), serie(2, 7), serie(3, 8)] }] },
  });
  const c = compararEjecucion(x)[0]!;
  assert.deepEqual(c.fuente, { tipo: 'correccion', correctionId: `c-${x.executionId}`, autor: 'Prof. Sintética', rolDelAutor: 'PROFESSIONAL', registradaEl: x.corrections[0]!.recordedAt, motivo: 'Fueron 7 en la segunda.' });
  const filas = seriesParaGraficar(c, REPS);
  assert.deepEqual(filas.map((f) => textoRegistrado(f.registrado, REPS)), ['8', '7', '8']);
  assert.deepEqual(filas.map((f) => f.fila.corregida), [false, true, false]);
  assert.equal(filas[1]!.fila.enElOriginal?.completedRepetitions, 8);
  // Sin corrección, no hay «original» aparte.
  const sin = compararEjecucion(ejecucion({ fecha: '2026-09-02', prescripciones: [tresPorOcho], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 8)] }] }))[0]!;
  assert.equal(sin.filas[0]!.enElOriginal, undefined);
  assert.equal(sin.fuente.tipo, 'original');
});

test('corrección que cambia la condición a «no realizada»: rige la declaración corregida, y el original queda', () => {
  const x = ejecucion({
    fecha: '2026-09-01',
    prescripciones: [tresPorOcho],
    registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 8)] }],
    correccion: { motivo: 'Se cargó por error.', registrado: [], condicion: 'NOT_COMPLETED', rol: 'ADVISEE' },
  });
  const c = compararEjecucion(x)[0]!;
  assert.ok(c.filas.every((f) => f.registrada.tipo === 'no-realizada'));
  assert.equal(c.filas[0]!.enElOriginal?.completedRepetitions, 8);
  assert.equal(c.filas[0]!.corregida, true);
});

test('una vista vigente no resoluble no se grafica: sin dato, con su motivo', () => {
  const x = ejecucion({ fecha: '2026-09-01', prescripciones: [piramide], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 10)] }], noResoluble: true });
  const c = compararEjecucion(x)[0]!;
  assert.equal(c.fuente.tipo, 'no-resoluble');
  assert.ok(seriesParaGraficar(c, REPS).every((f) => f.registrado.tipo === 'sin-dato' && f.registrado.motivo === 'vista-no-resoluble'));
});

test('sustitución dentro de la ejecución: se ve lo registrado, pero no se calcula la diferencia con otro ejercicio', () => {
  const x = ejecucion({ fecha: '2026-09-01', prescripciones: [piramide], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 12)], realizado: MANCUERNAS }] });
  const c = compararEjecucion(x)[0]!;
  assert.equal(c.sustituido, true);
  assert.deepEqual(c.realizado, { exerciseVersionId: MANCUERNAS.versionId, nombre: MANCUERNAS.nombre });
  const f = seriesParaGraficar(c, REPS)[0]!;
  assert.deepEqual(f.registrado, { tipo: 'valor', valor: 12 });
  assert.equal(f.diferencia, null);
});

// ─── B · Evolución del mismo ejercicio ──────────────────────────────────────────────────────────

/**
 * El período sintético de la evolución: un 3 × 8 en la versión 1 y la pirámide en la versión 2, dos sesiones el mismo
 * día, una sustitución, un resumen, una sesión no realizada, una corrección y otro ejercicio con el mismo nombre.
 */
function periodo(): EjecucionDeEntrenamiento[] {
  const bancaB = prescripcion('rx-banca-b', BANCA, [rango(6, 8), rango(6, 8)]);
  const homonimo = prescripcion('rx-otra-banca', { exerciseId: 'ej-banca-inclinada', exerciseVersionId: 'ver-bi', exerciseName: 'Press de banca' }, [exacta(12)]);
  return [
    ejecucion({ fecha: '2026-09-01', planId: 'plan-v1', prescripciones: [tresPorOcho], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 8), serie(2, 8), serie(3, 7)] }] }),
    ejecucion({ fecha: '2026-09-03', planId: 'plan-v1', prescripciones: [tresPorOcho], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 8, { value: 130, unit: 'lb' })] }] }),
    ejecucion({ fecha: '2026-09-05', planId: 'plan-v1', prescripciones: [tresPorOcho], registrado: [], condicion: 'NOT_COMPLETED' }),
    // Cambio de versión: la pirámide. Dos sesiones el mismo día.
    ejecucion({ fecha: '2026-09-08', hora: '09:00', planId: 'plan-v2', prescripciones: [piramide], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 10), serie(2, 8), serie(3, 5)] }] }),
    ejecucion({ fecha: '2026-09-08', hora: '18:00', planId: 'plan-v2', sesion: 'Sesión B', prescripciones: [bancaB, homonimo], registrado: [{ prescriptionId: 'rx-banca-b', sets: [serie(1, 7), serie(2, 5)] }, { prescriptionId: 'rx-otra-banca', sets: [serie(1, 12)] }] }),
    ejecucion({ fecha: '2026-09-10', planId: 'plan-v2', prescripciones: [piramide], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 12)], realizado: MANCUERNAS }] }),
    ejecucion({ fecha: '2026-09-12', planId: 'plan-v2', prescripciones: [piramide], registrado: [{ prescriptionId: 'rx-banca', resumen: 'Liviano por molestia en el hombro.' }] }),
    ejecucion({
      fecha: '2026-09-15',
      planId: 'plan-v2',
      prescripciones: [piramide],
      registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 9), serie(2, 8), serie(3, 6)] }],
      correccion: { motivo: 'Eran 10 en la primera.', registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 10), serie(2, 8), serie(3, 6)] }] },
    }),
  ];
}

test('identidad: el mismo ejercicio por exerciseId, y otro con el mismo nombre queda aparte', () => {
  const ejercicios = ejerciciosComparables(periodo());
  const bancas = ejercicios.filter((e) => e.nombre === 'Press de banca');
  assert.equal(bancas.length, 2);
  assert.ok(bancas.every((e) => e.homonimo));
  assert.deepEqual(bancas.map((e) => e.clave).sort(), ['e:ej-banca', 'e:ej-banca-inclinada']);
  // El realizado por sustitución, sin una prescripción que diga a qué ejercicio pertenece, se identifica por su versión.
  assert.ok(ejercicios.some((e) => e.clave === `v:${MANCUERNAS.versionId}` && e.nombre === MANCUERNAS.nombre && !e.homonimo));
});

test('unidad de observación: una prescripción de una ejecución; dos ejecuciones el mismo día son dos puntos', () => {
  const obs = observacionesDelEjercicio(periodo(), 'e:ej-banca');
  assert.equal(obs.length, 8);
  const del8 = obs.filter((o) => o.comparacion.fecha === '2026-09-08');
  assert.deepEqual(del8.map((o) => [o.comparacion.sesion, o.delDia]), [
    ['Sesión A', { orden: 1, total: 2 }],
    ['Sesión B', { orden: 2, total: 2 }],
  ]);
  // El homónimo no entra en la evolución de este ejercicio.
  assert.ok(obs.every((o) => o.comparacion.prescripto.exerciseId === 'ej-banca'));
  assert.deepEqual(numerosDeSerie(obs), [1, 2, 3]);
});

test('cada ejecución se compara con su propia prescripción: el 3 × 8 viejo no se compara con la pirámide', () => {
  const puntos = evolucion(observacionesDelEjercicio(periodo(), 'e:ej-banca'), REPS, 3);
  // Serie 3: en la versión 1 se planificó 8 y se registró 7; en la 2, 6 y 5.
  assert.deepEqual(puntos[0]!.planificado, { tipo: 'valor', valor: 8, origen: 'serie', sugerida: false });
  assert.equal(textoDeDiferencia(puntos[0]!.diferencia!, REPS), '−1');
  assert.deepEqual(puntos[3]!.planificado, { tipo: 'valor', valor: 6, origen: 'serie', sugerida: false });
  assert.equal(textoDeDiferencia(puntos[3]!.diferencia!, REPS), '−1');
});

test('evolución de la serie 1: valores, sin dato, no realizada, sustitución, resumen y corrección, sin promediar', () => {
  const puntos = evolucion(observacionesDelEjercicio(periodo(), 'e:ej-banca'), REPS, 1);
  assert.deepEqual(
    puntos.map((p) => [textoPlanificado(p.planificado, REPS), textoRegistrado(p.registrado, REPS)]),
    [
      ['8', '8'],
      ['8', '8'],
      ['8', COPY_COMPARACION.noRealizada],
      ['10', '10'],
      ['6-8', '7'],
      ['10', 'Se registró otro ejercicio'],
      ['10', 'Sin dato por serie: se registró un resumen'],
      ['10', '10'],
    ],
  );
  // La corrección rige, y el original sigue a mano.
  assert.equal(puntos[7]!.fila!.corregida, true);
  assert.equal(puntos[7]!.fila!.enElOriginal?.completedRepetitions, 9);
  // En la sustitución no hay diferencia: lo registrado es de otro ejercicio.
  assert.equal(puntos[5]!.diferencia, null);
});

test('las líneas no cruzan lo desconocido ni otra prescripción', () => {
  const puntos = evolucion(observacionesDelEjercicio(periodo(), 'e:ej-banca'), REPS, 1);
  const reg = puntos.map((p) => p.tramoRegistrado);
  // 8, 8 se unen; la no realizada corta; 10 y 7 se unen (el mismo día, dos sesiones con valor); la sustitución y el
  // resumen cortan; el 10 corregido queda solo.
  assert.equal(reg[0], reg[1]);
  assert.equal(reg[2], null);
  assert.notEqual(reg[3], reg[1]);
  assert.equal(reg[3], reg[4]);
  assert.deepEqual([reg[5], reg[6]], [null, null]);
  assert.notEqual(reg[7], reg[4]);
  assert.notEqual(reg[7], null);

  const plan = puntos.map((p) => p.tramoPlanificado);
  // El 3 × 8 de la versión 1 se une consigo mismo (tres ocurrencias de la misma prescripción)…
  assert.equal(plan[0], plan[1]);
  assert.equal(plan[1], plan[2]);
  // …y no con la pirámide de la versión 2. El rango de la sesión B no es una línea, y corta.
  assert.notEqual(plan[3], plan[2]);
  assert.equal(plan[4], null);
  assert.notEqual(plan[5], plan[3]);
  assert.equal(plan[5], plan[6]);
  assert.equal(plan[6], plan[7]);
});

test('carga en kg: la sesión en lb es otra unidad, sin conversión, y corta la línea', () => {
  const puntos = evolucion(observacionesDelEjercicio(periodo(), 'e:ej-banca'), KG, 1);
  assert.deepEqual(puntos[1]!.registrado, { tipo: 'otra-unidad', carga: { value: 130, unit: 'lb' } });
  assert.equal(puntos[1]!.tramoRegistrado, null);
  assert.deepEqual(puntos[0]!.planificado, { tipo: 'valor', valor: 55, origen: 'prescripcion', sugerida: true });
  assert.deepEqual(puntos[3]!.planificado, { tipo: 'valor', valor: 60, origen: 'prescripcion', sugerida: true });
});

test('una serie que no existe en una observación deja el punto vacío, sin llamarla «adicional», y no se une', () => {
  // La sesión B tiene dos series: la serie 3 no está planificada ni registrada ahí. No es adicional: nada se registró.
  const puntos = evolucion(observacionesDelEjercicio(periodo(), 'e:ej-banca'), REPS, 3);
  const b = puntos[4]!;
  assert.equal(b.fila, null);
  assert.deepEqual(b.planificado, { tipo: 'sin-serie' });
  assert.deepEqual(b.registrado, { tipo: 'sin-dato', motivo: 'serie-no-registrada' });
  assert.equal(textoPlanificado(b.planificado, REPS), COPY_COMPARACION.sinSerieEnLaPrescripcion);
  assert.equal(rotuloCorto(b, REPS), 'sin serie');
  assert.equal(b.tramoRegistrado, null);
  // En la sesión no realizada, la serie 3 planificada es «no realizada», por la declaración de la sesión.
  assert.deepEqual(puntos[2]!.registrado, { tipo: 'no-realizada' });
});

test('la declaración «no realizada» cubre lo planificado, no una serie que la sesión no tenía', () => {
  const dos = prescripcion('rx-banca', BANCA, [exacta(8), exacta(8)]);
  const x = ejecucion({ fecha: '2026-09-01', prescripciones: [dos], registrado: [], condicion: 'NOT_COMPLETED' });
  const [p] = evolucion(observacionesDelEjercicio([x], 'e:ej-banca'), REPS, 3);
  assert.deepEqual(p!.planificado, { tipo: 'sin-serie' });
  assert.deepEqual(p!.registrado, { tipo: 'sin-dato', motivo: 'serie-no-registrada' });
  const [q] = evolucion(observacionesDelEjercicio([x], 'e:ej-banca'), REPS, 2);
  assert.deepEqual(q!.registrado, { tipo: 'no-realizada' });
});

test('filtrar por versión no cambia a qué ejercicio se atribuye una sustitución (la identidad sale del período)', () => {
  const sentadilla = prescripcion('rx-sentadilla', SENTADILLA, [exacta(5)]);
  const v1 = ejecucion({ fecha: '2026-09-01', planId: 'plan-v1', prescripciones: [sentadilla], registrado: [{ prescriptionId: 'rx-sentadilla', sets: [serie(1, 5)] }] });
  const v2 = ejecucion({ fecha: '2026-09-08', planId: 'plan-v2', prescripciones: [tresPorOcho], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 5)], realizado: { versionId: SENTADILLA.exerciseVersionId, nombre: 'Sentadilla' } }] });
  // Solo la v2 a la vista, pero con el período completo como referencia de identidad.
  const obs = observacionesDelEjercicio([v2], 'e:ej-sentadilla', [v1, v2]);
  assert.deepEqual(obs.map((o) => [o.comparacion.planId, o.rol]), [['plan-v2', 'por-sustitucion']]);
});

test('otra versión del mismo ejercicio no es otro ejercicio: el punto conserva su valor y su diferencia', () => {
  const v2DeBanca = { versionId: 'ver-banca-2', nombre: 'Press de banca' };
  const conV2 = prescripcion('rx-banca-x', { ...BANCA, exerciseVersionId: 'ver-banca-2' }, [exacta(8)]);
  const a = ejecucion({ fecha: '2026-09-01', prescripciones: [tresPorOcho], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 7)], realizado: v2DeBanca }] });
  const b = ejecucion({ fecha: '2026-09-02', prescripciones: [conV2], registrado: [{ prescriptionId: 'rx-banca-x', sets: [serie(1, 8)] }] });
  const obs = observacionesDelEjercicio([a, b], 'e:ej-banca');
  assert.deepEqual(obs.map((o) => o.rol), ['planificado-y-registrado', 'planificado-y-registrado']);
  const [p] = evolucion(obs, REPS, 1);
  assert.deepEqual(p!.registrado, { tipo: 'valor', valor: 7 });
  assert.equal(textoDeDiferencia(p!.diferencia!, REPS), '−1');
  assert.equal(ejerciciosComparables([a, b]).filter((e) => e.nombre === 'Press de banca').length, 1);
});

test('el ejercicio realizado por sustitución tiene su evolución: lo planificado era de otro ejercicio', () => {
  const obs = observacionesDelEjercicio(periodo(), `v:${MANCUERNAS.versionId}`);
  assert.equal(obs.length, 1);
  assert.equal(obs[0]!.rol, 'por-sustitucion');
  const [p] = evolucion(obs, REPS, 1);
  assert.deepEqual(p!.planificado, { tipo: 'otro-ejercicio', nombre: 'Press de banca' });
  assert.deepEqual(p!.registrado, { tipo: 'valor', valor: 12 });
  assert.equal(p!.diferencia, null);
});

test('una sustitución con un ejercicio prescripto en el período se reconoce por su versión', () => {
  const sentadilla = prescripcion('rx-sentadilla', SENTADILLA, [exacta(5)]);
  const x1 = ejecucion({ fecha: '2026-09-01', prescripciones: [sentadilla], registrado: [{ prescriptionId: 'rx-sentadilla', sets: [serie(1, 5)] }] });
  const x2 = ejecucion({ fecha: '2026-09-02', prescripciones: [tresPorOcho], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 5)], realizado: { versionId: SENTADILLA.exerciseVersionId, nombre: 'Sentadilla' } }] });
  const obs = observacionesDelEjercicio([x1, x2], 'e:ej-sentadilla');
  assert.deepEqual(obs.map((o) => o.rol), ['planificado-y-registrado', 'por-sustitucion']);
  assert.equal(ejerciciosComparables([x1, x2]).filter((e) => e.nombre === 'Sentadilla').length, 1);
});

test('rótulo del eje: la diferencia o el estado, nunca vacío cuando falta el dato', () => {
  const puntos = evolucion(observacionesDelEjercicio(periodo(), 'e:ej-banca'), REPS, 1);
  assert.deepEqual(
    puntos.map((p) => rotuloCorto(p, REPS)),
    ['igual', 'igual', COPY_COMPARACION.noRealizadaCorto, 'igual', 'en rango', 'otro ejercicio', 'sin dato', 'igual'],
  );
  const kg = evolucion(observacionesDelEjercicio(periodo(), 'e:ej-banca'), KG, 1);
  assert.equal(rotuloCorto(kg[1]!, KG), 'en lb');
  const x = ejecucion({ fecha: '2026-09-01', prescripciones: [tresPorOcho], registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, 8), serie(4, 6)] }] });
  assert.deepEqual(seriesParaGraficar(compararEjecucion(x)[0]!, REPS).map((s) => rotuloCorto(s, REPS)), ['igual', 'sin dato', 'sin dato', 'adicional']);
  const sentadilla = prescripcion('rx-sentadilla', SENTADILLA, [rango(6, 8), rango(6, 8)]);
  const y = ejecucion({ fecha: '2026-09-01', prescripciones: [sentadilla], registrado: [{ prescriptionId: 'rx-sentadilla', sets: [serie(1, 5), serie(2, 9)] }] });
  assert.deepEqual(seriesParaGraficar(compararEjecucion(y)[0]!, REPS).map((s) => rotuloCorto(s, REPS)), ['−1 mín.', '+1 máx.']);
});

test('sin ejecuciones, no hay ejercicios ni puntos: el estado vacío lo decide la pantalla', () => {
  assert.deepEqual(ejerciciosComparables([]), []);
  assert.deepEqual(evolucion([], REPS, 1), []);
});

test('diferencia: sin dos valores comparables no hay diferencia', () => {
  assert.equal(diferencia({ tipo: 'sin-fijar' }, { tipo: 'valor', valor: 3 }), null);
  assert.equal(diferencia({ tipo: 'valor', valor: 3, origen: 'serie', sugerida: false }, { tipo: 'sin-dato', motivo: 'serie-no-registrada' }), null);
  assert.equal(diferencia({ tipo: 'valor', valor: 3, origen: 'serie', sugerida: false }, { tipo: 'no-realizada' }), null);
  // Decimales sin ruido binario: 62,5 − 60,1 es 2,4.
  assert.deepEqual(diferencia({ tipo: 'valor', valor: 60.1, origen: 'prescripcion', sugerida: true }, { tipo: 'valor', valor: 62.5 }), { tipo: 'distinta', delta: 2.4, respectoDeLaSugerida: true });
  assert.deepEqual(diferencia({ tipo: 'valor', valor: 8, origen: 'serie', sugerida: false }, { tipo: 'valor', valor: 8 }), { tipo: 'igual', respectoDeLaSugerida: false });
});

test('TEST-PRJ-009 · el copy de la comparación no puntúa ni juzga', () => {
  const textos = [
    ...Object.values(COPY_COMPARACION),
    ...['serie-no-registrada', 'ejercicio-no-registrado', 'registro-resumido', 'vista-no-resoluble', 'otro-ejercicio', 'campo-no-registrado'].map((motivo) =>
      textoRegistrado({ tipo: 'sin-dato', motivo } as never, REPS),
    ),
  ];
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosDeEntrenamientoEn(t).map((p) => `${p} en «${t}»`)), []);
});

function valores(filas: ReturnType<typeof seriesParaGraficar>) {
  return filas.map((f) => f.registrado);
}
