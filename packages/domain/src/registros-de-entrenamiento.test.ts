/**
 * Los registros de Entrenamiento por sesión (WP-ESCRITORIO-AREAS, parte 2): la fila de cada sesión, su detalle serie por
 * serie y las vistas con su cuenta.
 *
 * Los resultados esperados se escriben a mano, a partir de la maqueta 25, del criterio (C-66 y C-68) y de las reglas de
 * la relación con el objetivo, que ya tienen su oráculo. Datos sintéticos, validados contra el esquema estricto de la
 * ejecución. Si una prueba falla, se corrige el cálculo, no el oráculo.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ObjetivosDeLaVersion } from './comparacion-de-entrenamiento';
import { EjecucionDeEntrenamientoSchema, type EjecucionDeEntrenamiento, type Prescripcion, type SerieEjecutadaApi } from './contratos-entrenamiento';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';
import {
  componerLasSesiones,
  contarLasVistasDeSesiones,
  filaDeLaSesion,
  relacionDeUnaSerie,
  serieRegistradaEnPalabras,
  sesionEnLaVista,
  VISTAS_DE_SESIONES,
  type ClaveDeVistaDeSesiones,
  type FilaDeSesion,
} from './registros-de-entrenamiento';

type Reps = Prescripcion['sets'][number]['repetitions'];
type Carga = NonNullable<SerieEjecutadaApi['load']>;
const kg = (value: number): Carga => ({ value, unit: 'kg' });
const rango = (min: number, max: number): Reps => ({ min, max });
const exacta = (value: number): Reps => ({ value });

const BANCA = { exerciseId: 'ej-banca', exerciseVersionId: 'ver-banca-1', exerciseName: 'Press de banca' };
const REMO = { exerciseId: 'ej-remo', exerciseVersionId: 'ver-remo-1', exerciseName: 'Remo con barra' };
const DOMINADAS = { exerciseId: 'ej-dominadas', exerciseVersionId: 'ver-dominadas-1', exerciseName: 'Dominadas' };
const MANCUERNAS = { versionId: 'ver-mancuernas-1', nombre: 'Press con mancuernas' };

function prescripcion(id: string, orden: number, ejercicio: typeof BANCA, reps: Reps[], notas: Record<number, string> = {}): Prescripcion {
  return { prescriptionId: id, order: orden, ...ejercicio, sets: reps.map((repetitions, i) => ({ setIndex: i + 1, repetitions, note: notas[i + 1] ?? null })), intensity: null, suggestedLoad: null, professionalParameters: [], note: null };
}
const serie = (setIndex: number, load: Carga | null, completedRepetitions: number | null, rir: number | null = null, perceivedExertion: number | null = null): SerieEjecutadaApi => ({ setIndex, load, completedRepetitions, rir, perceivedExertion });

type Registrado = { prescriptionId: string; sets?: SerieEjecutadaApi[]; resumen?: string; realizado?: { versionId: string; nombre: string } };
type Condicion = 'COMPLETED' | 'COMPLETED_WITH_DEVIATION' | 'NOT_COMPLETED';

function registro(prescripciones: Prescripcion[], ejercicios: Registrado[], condicion: Condicion = 'COMPLETED', motivo: string | null = null) {
  const porSerie = ejercicios.every((e) => e.sets);
  return {
    granularity: condicion === 'NOT_COMPLETED' ? null : porSerie ? ('SET' as const) : ('EXERCISE_OR_SESSION' as const),
    sessionCondition: condicion,
    reason: motivo,
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
function ejecucion(o: {
  fecha: string;
  hora?: string;
  planId?: string;
  sesion?: string;
  prescripciones: Prescripcion[];
  registrado: Registrado[];
  condicion?: Condicion;
  motivo?: string;
  correccion?: { registrado: Registrado[]; motivo: string };
  noResoluble?: boolean;
}): EjecucionDeEntrenamiento {
  const id = `x-${String(++secuencia).padStart(2, '0')}`;
  const ocurrio = `${o.fecha}T${o.hora ?? '18:10'}:00.000-03:00`;
  const correcciones = o.correccion
    ? [
        {
          correctionId: `c-${id}`,
          previousCorrectionId: null,
          reason: o.correccion.motivo,
          correction: registro(o.prescripciones, o.correccion.registrado),
          author: { identityId: 'pro-1', displayName: 'Prof. Sintética' },
          authorRole: 'PROFESSIONAL' as const,
          recordedAt: `${o.fecha}T21:00:00.000-03:00`,
        },
      ]
    : [];
  return EjecucionDeEntrenamientoSchema.parse({
    executionId: id,
    state: 'REGISTERED',
    adviseeId: 'ase-1',
    planId: o.planId ?? 'plan-v3',
    snapshotDigest: 'a'.repeat(64),
    occurrenceId: `oc-${id}`,
    date: o.fecha,
    timeZone: 'America/Argentina/Buenos_Aires',
    plannedSession: { sessionId: 'ses-b', label: o.sesion ?? 'B · Tren superior', order: 1, instructions: null, prescriptions: o.prescripciones, blockId: 'blq-1', blockLabel: 'Bloque 1', microcycleId: null, microcycleLabel: null },
    original: registro(o.prescripciones, o.registrado, o.condicion, o.motivo ?? null),
    corrections: correcciones,
    effectiveView: o.noResoluble ? { kind: 'NOT_RESOLVABLE' } : correcciones.length ? { kind: 'CORRECTED', correctionId: correcciones[0]!.correctionId } : { kind: 'ORIGINAL' },
    occurredAt: ocurrio,
    recordedAt: `${o.fecha}T19:22:00.000-03:00`,
  });
}

/** La sesión B de la maqueta: banca y remo con carga y RIR por serie; dominadas, solo repeticiones. */
const banca = prescripcion('rx-banca', 1, BANCA, [rango(6, 8), rango(6, 8), rango(6, 8), rango(6, 8)], { 4: 'Bajá la carga si hace falta' });
const remo = prescripcion('rx-remo', 2, REMO, [rango(8, 10), rango(8, 10), rango(8, 10), rango(8, 10)]);
const dominadas = prescripcion('rx-dominadas', 3, DOMINADAS, [exacta(6), exacta(6), exacta(6), exacta(6)]);
const SESION_B = [banca, remo, dominadas];

const objetivo = (setIndex: number, rir: number | null, carga: Carga | null) => ({ setIndex, target: { rir, suggestedLoad: carga }, targetOrigin: { rir: rir === null ? ('NONE' as const) : ('SET' as const), suggestedLoad: carga === null ? ('NONE' as const) : ('SET' as const) } });
/** Los objetivos por serie de la versión 3, como los da API-SER-01. */
const OBJETIVOS: ObjetivosDeLaVersion = new Map([
  ['rx-banca', [objetivo(1, 2, kg(62.5)), objetivo(2, 2, kg(62.5)), objetivo(3, 1, kg(62.5)), objetivo(4, 1, kg(60))]],
  ['rx-remo', [1, 2, 3, 4].map((n) => objetivo(n, 2, kg(47.5)))],
  ['rx-dominadas', [1, 2, 3, 4].map((n) => objetivo(n, null, null))],
]);

const BANCA_DENTRO = [serie(1, kg(62.5), 8, 2), serie(2, kg(62.5), 7, 2), serie(3, kg(62.5), 6, 1), serie(4, kg(60), 6, 1)];
const REMO_DENTRO = [serie(1, kg(47.5), 10, 2), serie(2, kg(47.5), 9, 2), serie(3, kg(47.5), 8, 2), serie(4, kg(47.5), 8, 2)];
const DOMINADAS_DENTRO = [1, 2, 3, 4].map((n) => serie(n, null, 6));
const TODO_DENTRO: Registrado[] = [
  { prescriptionId: 'rx-banca', sets: BANCA_DENTRO },
  { prescriptionId: 'rx-remo', sets: REMO_DENTRO },
  { prescriptionId: 'rx-dominadas', sets: DOMINADAS_DENTRO },
];

/** La sesión del 24 de la maqueta: la última de remo con el RIR por debajo, y la segunda de dominadas con una repetición menos. */
const DEL_24 = ejecucion({
  fecha: '2026-09-24',
  prescripciones: SESION_B,
  registrado: [
    { prescriptionId: 'rx-banca', sets: BANCA_DENTRO },
    { prescriptionId: 'rx-remo', sets: [...REMO_DENTRO.slice(0, 3), serie(4, kg(47.5), 8, 1)] },
    { prescriptionId: 'rx-dominadas', sets: [serie(1, null, 6), serie(2, null, 5), serie(3, null, 6), serie(4, null, 6)] },
  ],
});
const fila24 = filaDeLaSesion(DEL_24, OBJETIVOS);

test('una serie registrada se dice con lo que tiene, y lo que no se registró se dice como tal', () => {
  assert.equal(serieRegistradaEnPalabras(serie(1, kg(62.5), 8, 2)), '62,5 kg · 8 rep. · RIR 2');
  assert.equal(serieRegistradaEnPalabras(serie(1, null, 6)), 'carga no registrada · 6 rep.');
  assert.equal(serieRegistradaEnPalabras(serie(1, kg(40), null, null, 7)), '40 kg · repeticiones no registradas · esfuerzo percibido 7');
  // Un cero registrado es un valor: no se esconde.
  assert.equal(serieRegistradaEnPalabras(serie(1, kg(0), 0, 0)), '0 kg · 0 rep. · RIR 0');
});

test('una serie frente a su objetivo: cuentan las repeticiones y el RIR; la carga se dice y no cuenta', () => {
  const obj = { repetitions: rango(6, 8), rir: 2, suggestedLoad: kg(60) };
  assert.deepEqual(relacionDeUnaSerie(obj, serie(1, kg(60), 7, 2)), { conDiferencia: false, conDatoSinRegistrar: false, sinObjetivo: false, texto: 'Dentro de lo indicado', carga: null });
  assert.deepEqual(relacionDeUnaSerie(obj, serie(1, kg(60), 5, 2)), { conDiferencia: true, conDatoSinRegistrar: false, sinObjetivo: false, texto: 'Rep.: por debajo', carga: null });
  assert.deepEqual(relacionDeUnaSerie(obj, serie(1, kg(60), 9, 3)), { conDiferencia: true, conDatoSinRegistrar: false, sinObjetivo: false, texto: 'Rep.: por encima · RIR: por encima', carga: null });
  // La carga por encima de la sugerida se dice aparte y no es una diferencia: la serie sigue «dentro de lo indicado».
  assert.deepEqual(relacionDeUnaSerie(obj, serie(1, kg(65), 7, 2)), { conDiferencia: false, conDatoSinRegistrar: false, sinObjetivo: false, texto: 'Dentro de lo indicado', carga: 'Carga: por encima de la sugerida' });
  assert.deepEqual([relacionDeUnaSerie(obj, serie(1, kg(55), 7, 1)).texto, relacionDeUnaSerie(obj, serie(1, kg(55), 7, 1)).carga], ['RIR: por debajo', 'Carga: por debajo de la sugerida']);
  // Un dato que no se registró no es una diferencia: se dice aparte.
  assert.deepEqual(relacionDeUnaSerie(obj, serie(1, kg(60), 7, null)), { conDiferencia: false, conDatoSinRegistrar: true, sinObjetivo: false, texto: 'RIR: sin dato', carga: null });
  assert.deepEqual([relacionDeUnaSerie(obj, serie(1, null, 7, 2)).texto, relacionDeUnaSerie(obj, serie(1, null, 7, 2)).carga], ['Dentro de lo indicado', 'Carga: sin dato']);
  assert.equal(relacionDeUnaSerie(obj, serie(1, { value: 135, unit: 'lb' }, 7, 2)).carga, 'Carga: otra unidad: no se compara');
  // Sin ningún objetivo no hay con qué comparar: no dice «dentro de lo indicado».
  assert.deepEqual(relacionDeUnaSerie({ repetitions: null, rir: null, suggestedLoad: null }, serie(1, kg(60), 7, 2)), { conDiferencia: false, conDatoSinRegistrar: false, sinObjetivo: true, texto: 'Sin objetivo: no se compara', carga: null });
  // Si lo único indicado es la carga, tampoco: de las repeticiones y del RIR no hay qué decir, y lo de la carga va aparte.
  assert.deepEqual(relacionDeUnaSerie({ repetitions: null, rir: null, suggestedLoad: kg(60) }, serie(1, kg(70), 7, 2)), { conDiferencia: false, conDatoSinRegistrar: false, sinObjetivo: false, texto: 'Sin objetivo de repeticiones ni de RIR', carga: 'Carga: por encima de la sugerida' });
});

test('la fila de una sesión: «N de M registradas» y cuántas series quedaron con diferencias', () => {
  assert.equal(fila24.sesion, 'B · Tren superior');
  assert.equal(fila24.clase, 'POR_SERIE');
  assert.equal(fila24.condicion, 'Realizada');
  assert.equal(fila24.series, '12 de 12 registradas');
  assert.deepEqual([fila24.registradas, fila24.planificadas, fila24.sinRegistrar, fila24.conDiferencias], [12, 12, 0, 2]);
  assert.equal(fila24.frente, '2 series con diferencias');
  assert.equal(fila24.comoSeRegistro, 'Por serie');
  assert.deepEqual(fila24.fuente, { tipo: 'original', registradoEl: '2026-09-24T19:22:00.000-03:00' });
  // Con todo dentro de lo indicado, lo dice.
  const dentro = filaDeLaSesion(ejecucion({ fecha: '2026-09-19', prescripciones: SESION_B, registrado: TODO_DENTRO }), OBJETIVOS);
  assert.equal(dentro.frente, 'Dentro de lo indicado');
  assert.equal(dentro.conDiferencias, 0);
});

test('el detalle es una tabla con cada serie una sola vez: lo indicado, lo registrado y cómo quedó', () => {
  assert.deepEqual(fila24.ejercicios.map((e) => [e.nombre, e.cuenta, e.notaDeLoIndicado]), [
    ['Press de banca', '4 de 4 series registradas', null],
    ['Remo con barra', '4 de 4 series registradas', null],
    ['Dominadas', '4 de 4 series registradas', 'sin carga ni RIR indicados'],
  ]);
  const [deBanca, deRemo, deDominadas] = fila24.ejercicios;
  assert.deepEqual(deBanca!.series.map((s) => [s.numero, s.indicado, s.registrado, s.frente]), [
    [1, '62,5 kg · 6–8 rep. · RIR 2', '62,5 kg · 8 rep. · RIR 2', 'Dentro de lo indicado'],
    [2, '62,5 kg · 6–8 rep. · RIR 2', '62,5 kg · 7 rep. · RIR 2', 'Dentro de lo indicado'],
    [3, '62,5 kg · 6–8 rep. · RIR 1', '62,5 kg · 6 rep. · RIR 1', 'Dentro de lo indicado'],
    [4, '60 kg · 6–8 rep. · RIR 1', '60 kg · 6 rep. · RIR 1', 'Dentro de lo indicado'],
  ]);
  assert.equal(deBanca!.series[3]!.nota, 'Bajá la carga si hace falta');
  assert.deepEqual(deRemo!.series[3], {
    numero: 4,
    estado: 'REGISTRADA',
    nota: null,
    corregida: false,
    indicado: '47,5 kg · 8–10 rep. · RIR 2',
    registrado: '47,5 kg · 8 rep. · RIR 1',
    frente: 'RIR: por debajo',
    frenteDeLaCarga: null,
    conDiferencia: true,
    conDatoSinRegistrar: false,
    comparada: true,
  });
  assert.deepEqual(deDominadas!.series.map((s) => [s.indicado, s.registrado, s.frente, s.conDiferencia]), [
    ['6 rep.', 'carga no registrada · 6 rep.', 'Dentro de lo indicado', false],
    ['6 rep.', 'carga no registrada · 5 rep.', 'Rep.: por debajo', true],
    ['6 rep.', 'carga no registrada · 6 rep.', 'Dentro de lo indicado', false],
    ['6 rep.', 'carga no registrada · 6 rep.', 'Dentro de lo indicado', false],
  ]);
});

test('una serie sin registrar es un hueco: se cuenta aparte, no es una diferencia ni un cero', () => {
  // Realizada con desvío: de las doce indicadas se registraron nueve.
  const x = ejecucion({
    fecha: '2026-09-26',
    condicion: 'COMPLETED_WITH_DEVIATION',
    motivo: 'Me quedé sin tiempo',
    prescripciones: SESION_B,
    registrado: [
      { prescriptionId: 'rx-banca', sets: BANCA_DENTRO },
      { prescriptionId: 'rx-remo', sets: REMO_DENTRO },
      { prescriptionId: 'rx-dominadas', sets: [serie(1, null, 6)] },
    ],
  });
  const f = filaDeLaSesion(x, OBJETIVOS);
  assert.equal(f.condicion, 'Realizada con desvío');
  assert.equal(f.motivo, 'Me quedé sin tiempo');
  assert.equal(f.series, '9 de 12 registradas');
  assert.equal(f.frente, '3 series sin registrar');
  assert.deepEqual([f.sinRegistrar, f.conDiferencias], [3, 0]);
  const sinRegistrar = f.ejercicios[2]!.series[1]!;
  assert.deepEqual([sinRegistrar.estado, sinRegistrar.indicado, sinRegistrar.registrado, sinRegistrar.frente, sinRegistrar.conDiferencia], ['SIN_REGISTRAR', '6 rep.', 'Sin registrar', 'Sin registro: no se compara', false]);
  assert.equal(f.ejercicios[2]!.cuenta, '1 de 4 series registradas');
  // Un ejercicio entero sin registrar: sus series también son huecos.
  const sinUnEjercicio = filaDeLaSesion(ejecucion({ fecha: '2026-09-27', prescripciones: SESION_B, registrado: [{ prescriptionId: 'rx-banca', sets: BANCA_DENTRO }] }), OBJETIVOS);
  assert.equal(sinUnEjercicio.series, '4 de 12 registradas');
  assert.equal(sinUnEjercicio.frente, '8 series sin registrar');
  // Con huecos y con diferencias, las dos cosas, en ese orden.
  const lasDos = filaDeLaSesion(
    ejecucion({ fecha: '2026-09-28', prescripciones: SESION_B, registrado: [{ prescriptionId: 'rx-banca', sets: [serie(1, kg(62.5), 9, 2)] }, { prescriptionId: 'rx-remo', sets: REMO_DENTRO }, { prescriptionId: 'rx-dominadas', sets: DOMINADAS_DENTRO }] }),
    OBJETIVOS,
  );
  assert.equal(lasDos.frente, '3 series sin registrar · 1 serie con diferencias');
});

test('una sesión registrada como no realizada, o resumida, no se cuenta serie por serie: no dice «0 de 12»', () => {
  const noRealizada = filaDeLaSesion(ejecucion({ fecha: '2026-09-20', condicion: 'NOT_COMPLETED', motivo: 'Viaje laboral', prescripciones: SESION_B, registrado: [] }), OBJETIVOS);
  assert.deepEqual([noRealizada.clase, noRealizada.condicion, noRealizada.motivo, noRealizada.registradas, noRealizada.planificadas], ['NO_REALIZADA', 'No realizada', 'Viaje laboral', null, null]);
  assert.equal(noRealizada.series, 'Sin series: la sesión se registró así');
  assert.equal(noRealizada.frente, 'No hay series que comparar');
  assert.deepEqual(noRealizada.ejercicios, []);
  assert.equal(noRealizada.comoSeRegistro, null);
  const resumida = filaDeLaSesion(ejecucion({ fecha: '2026-09-21', prescripciones: SESION_B, registrado: [{ prescriptionId: 'rx-banca', resumen: 'Hice las cuatro series, sin anotar' }] }), OBJETIVOS);
  assert.deepEqual([resumida.clase, resumida.registradas, resumida.comoSeRegistro], ['RESUMIDA', null, 'Por ejercicio o sesión']);
  assert.equal(resumida.series, 'Registro resumido: sin series');
  assert.equal(resumida.frente, 'No se compara serie por serie');
  assert.deepEqual([resumida.ejercicios[0]!.cuenta, resumida.ejercicios[0]!.resumen], ['Registro resumido', 'Hice las cuatro series, sin anotar']);
  assert.deepEqual(resumida.ejercicios[0]!.series.map((s) => [s.estado, s.registrado, s.frente]), Array.from({ length: 4 }, () => ['RESUMIDA', 'Registro resumido', 'No se compara serie por serie']));
  for (const f of [noRealizada, resumida]) assert.doesNotMatch(`${f.series} ${f.frente}`, /\b0 de\b/);
  // Ninguna de las dos tiene «series sin registrar»: no se registró serie por serie.
  assert.deepEqual([noRealizada.sinRegistrar, resumida.sinRegistrar], [0, 0]);
});

test('si se registró otro ejercicio, sus series cuentan como registradas y no se comparan con lo indicado', () => {
  // Una versión que no es de ningún ejercicio indicado en el período: no se sabe si es el mismo.
  const x = ejecucion({
    fecha: '2026-09-22',
    prescripciones: SESION_B,
    registrado: [{ prescriptionId: 'rx-banca', sets: BANCA_DENTRO, realizado: MANCUERNAS }, { prescriptionId: 'rx-remo', sets: REMO_DENTRO }, { prescriptionId: 'rx-dominadas', sets: DOMINADAS_DENTRO }],
  });
  const f = filaDeLaSesion(x, OBJETIVOS);
  assert.equal(f.series, '12 de 12 registradas');
  assert.equal(f.frente, 'Un ejercicio no se compara');
  const e = f.ejercicios[0]!;
  assert.deepEqual([e.nombre, e.enLugarDe, e.identidad], ['Press con mancuernas', 'Press de banca', 'desconocida']);
  assert.ok(e.aviso && /no se puede saber si lo registrado es el mismo ejercicio/.test(e.aviso));
  assert.ok(e.series.every((s) => s.frente === 'No se compara: no se puede saber si es el mismo ejercicio' && !s.conDiferencia && !s.comparada));
  // Si la versión registrada es de otro ejercicio indicado en el período, se sabe que es otro.
  const otro = filaDeLaSesion(
    ejecucion({ fecha: '2026-09-23', prescripciones: SESION_B, registrado: [{ prescriptionId: 'rx-banca', sets: BANCA_DENTRO, realizado: { versionId: REMO.exerciseVersionId, nombre: REMO.exerciseName } }] }),
    OBJETIVOS,
  );
  assert.deepEqual([otro.ejercicios[0]!.identidad, otro.ejercicios[0]!.series[0]!.frente], ['otro-ejercicio', 'Otro ejercicio: no se compara']);
});

test('si no se pudo leer lo indicado, la sesión lo dice: no afirma «Dentro de lo indicado» ni cuenta diferencias', () => {
  const f = filaDeLaSesion(DEL_24, null);
  assert.equal(f.seLeyoLoIndicado, false);
  assert.equal(f.series, '12 de 12 registradas');
  assert.equal(f.frente, 'No se pudo leer lo indicado');
  assert.equal(f.conDiferencias, null);
  const s = f.ejercicios[1]!.series[3]!;
  assert.deepEqual([s.indicado, s.frente, s.conDiferencia], ['8–10 rep. · la carga y el RIR no se pudieron leer', 'No se pudo leer lo indicado', false]);
  assert.equal(f.ejercicios[2]!.notaDeLoIndicado, null);
  assert.equal(sesionEnLaVista(f, 'CON_DIFERENCIAS'), false);
});

test('rige la corrección vigente, y la serie que cambió lo dice', () => {
  const x = ejecucion({
    fecha: '2026-09-17',
    prescripciones: SESION_B,
    registrado: TODO_DENTRO,
    correccion: { motivo: 'Anotó mal la última de remo', registrado: [TODO_DENTRO[0]!, { prescriptionId: 'rx-remo', sets: [...REMO_DENTRO.slice(0, 3), serie(4, kg(47.5), 11, 2)] }, TODO_DENTRO[2]!] },
  });
  const f = filaDeLaSesion(x, OBJETIVOS);
  assert.deepEqual(f.fuente, { tipo: 'correccion', correctionId: `c-${x.executionId}`, autor: 'Prof. Sintética', rolDelAutor: 'PROFESSIONAL', registradaEl: '2026-09-17T21:00:00.000-03:00', motivo: 'Anotó mal la última de remo' });
  assert.equal(f.frente, '1 serie con diferencias');
  const cambiada = f.ejercicios[1]!.series[3]!;
  assert.deepEqual([cambiada.registrado, cambiada.frente, cambiada.corregida], ['47,5 kg · 11 rep. · RIR 2', 'Rep.: por encima', true]);
  assert.equal(f.ejercicios[1]!.series[0]!.corregida, false);
  // También la condición es la de la corrección: el original decía «con desvío», y la corrección, que se realizó.
  const conOtraCondicion = filaDeLaSesion(
    ejecucion({ fecha: '2026-09-18', condicion: 'COMPLETED_WITH_DEVIATION', motivo: 'Me dolía el hombro', prescripciones: SESION_B, registrado: TODO_DENTRO, correccion: { motivo: 'Marcó desvío por error', registrado: TODO_DENTRO } }),
    OBJETIVOS,
  );
  assert.deepEqual([conOtraCondicion.condicion, conOtraCondicion.conDesvioONoRealizada, conOtraCondicion.motivo], ['Realizada', false, null]);
  // Si lo que rige no se puede determinar, no se muestra ni se cuenta nada.
  const sinVigente = filaDeLaSesion(ejecucion({ fecha: '2026-09-16', prescripciones: SESION_B, registrado: TODO_DENTRO, noResoluble: true }), OBJETIVOS);
  assert.deepEqual([sinVigente.clase, sinVigente.condicion, sinVigente.series, sinVigente.registradas], ['SIN_REGISTRO_VIGENTE', null, 'El registro vigente no se puede determinar', null]);
  assert.deepEqual(sinVigente.ejercicios, []);
});

test('una serie de más, un dato sin registrar y una carga por encima: se dicen, y ninguna es una diferencia', () => {
  const x = ejecucion({
    fecha: '2026-09-15',
    prescripciones: SESION_B,
    registrado: [
      { prescriptionId: 'rx-banca', sets: [serie(1, kg(65), 8, 2), serie(2, kg(62.5), 7, null), ...BANCA_DENTRO.slice(2), serie(5, kg(50), 12, 3)] },
      { prescriptionId: 'rx-remo', sets: REMO_DENTRO },
      { prescriptionId: 'rx-dominadas', sets: DOMINADAS_DENTRO },
    ],
  });
  const f = filaDeLaSesion(x, OBJETIVOS);
  assert.equal(f.series, '12 de 12 registradas · 1 adicional');
  assert.equal(f.frente, '1 serie con un dato sin registrar');
  assert.equal(f.conDiferencias, 0);
  const s = f.ejercicios[0]!.series;
  assert.equal(f.ejercicios[0]!.cuenta, '4 de 4 series registradas · 1 adicional');
  assert.deepEqual([s[0]!.frente, s[0]!.frenteDeLaCarga, s[0]!.conDiferencia], ['Dentro de lo indicado', 'Carga: por encima de la sugerida', false]);
  assert.deepEqual([s[1]!.frente, s[1]!.conDatoSinRegistrar], ['RIR: sin dato', true]);
  assert.deepEqual([s[4]!.estado, s[4]!.indicado, s[4]!.registrado, s[4]!.frente], ['ADICIONAL', 'Adicional: no estaba indicada', '50 kg · 12 rep. · RIR 3', 'Adicional: no se compara']);
});

test('si lo indicado no fija ningún objetivo, la sesión no dice «Dentro de lo indicado»: no hubo con qué comparar', () => {
  const libre = prescripcion('rx-libre', 1, DOMINADAS, [null, null]);
  const x = ejecucion({ fecha: '2026-09-14', prescripciones: [libre], registrado: [{ prescriptionId: 'rx-libre', sets: [serie(1, null, 8), serie(2, null, 7)] }] });
  const f = filaDeLaSesion(x, new Map([['rx-libre', [objetivo(1, null, null), objetivo(2, null, null)]]]));
  assert.equal(f.series, '2 de 2 registradas');
  assert.equal(f.frente, 'Sin objetivos que comparar');
  assert.deepEqual(f.ejercicios[0]!.series.map((s) => [s.indicado, s.frente, s.comparada]), [
    ['Sin objetivo', 'Sin objetivo: no se compara', false],
    ['Sin objetivo', 'Sin objetivo: no se compara', false],
  ]);
});

test('las sesiones van de la más nueva a la más vieja, y cada vista trae lo que dice su nombre', () => {
  const sesiones = [
    ejecucion({ fecha: '2026-09-12', prescripciones: SESION_B, registrado: TODO_DENTRO }),
    ejecucion({ fecha: '2026-09-13', condicion: 'NOT_COMPLETED', prescripciones: SESION_B, registrado: [] }),
    DEL_24,
    ejecucion({ fecha: '2026-09-26', condicion: 'COMPLETED_WITH_DEVIATION', prescripciones: SESION_B, registrado: [{ prescriptionId: 'rx-banca', sets: BANCA_DENTRO }] }),
  ];
  const filas = componerLasSesiones(sesiones, new Map([['plan-v3', OBJETIVOS]]));
  assert.deepEqual(filas.map((f) => f.fecha), ['2026-09-26', '2026-09-24', '2026-09-13', '2026-09-12']);
  assert.deepEqual(contarLasVistasDeSesiones(filas), { TODAS: 4, CON_DIFERENCIAS: 1, CON_DESVIO_O_NO_REALIZADA: 2, SIN_REGISTRAR: 1 });
  const de = (vista: ClaveDeVistaDeSesiones) => filas.filter((f) => sesionEnLaVista(f, vista)).map((f) => f.fecha.slice(8));
  assert.deepEqual(de('CON_DIFERENCIAS'), ['24']);
  assert.deepEqual(de('CON_DESVIO_O_NO_REALIZADA'), ['26', '13']);
  assert.deepEqual(de('SIN_REGISTRAR'), ['26']);
  assert.deepEqual(VISTAS_DE_SESIONES.map((v) => [v.clave, v.nombre]), [
    ['TODAS', 'Todas las sesiones'],
    ['CON_DIFERENCIAS', 'Con diferencias'],
    ['CON_DESVIO_O_NO_REALIZADA', 'Con desvío o no realizada'],
    ['SIN_REGISTRAR', 'Con series sin registrar'],
  ]);
});

test('si una versión del plan no se pudo leer, «Con diferencias» queda sin número: no es un cero', () => {
  const sesiones = [DEL_24, ejecucion({ fecha: '2026-08-30', planId: 'plan-v2', prescripciones: SESION_B, registrado: TODO_DENTRO })];
  const filas = componerLasSesiones(sesiones, new Map([['plan-v3', OBJETIVOS]]));
  assert.deepEqual(filas.map((f) => [f.fecha, f.seLeyoLoIndicado, f.frente]), [
    ['2026-09-24', true, '2 series con diferencias'],
    ['2026-08-30', false, 'No se pudo leer lo indicado'],
  ]);
  assert.deepEqual(contarLasVistasDeSesiones(filas), { TODAS: 2, CON_DIFERENCIAS: null, CON_DESVIO_O_NO_REALIZADA: 0, SIN_REGISTRAR: 0 });
  // Una sesión no realizada de esa versión no impide contar: no se compara serie por serie.
  const conNoRealizada = componerLasSesiones([DEL_24, ejecucion({ fecha: '2026-08-29', planId: 'plan-v2', condicion: 'NOT_COMPLETED', prescripciones: SESION_B, registrado: [] })], new Map([['plan-v3', OBJETIVOS]]));
  assert.equal(contarLasVistasDeSesiones(conNoRealizada).CON_DIFERENCIAS, 1);
});

test('ningún texto de estas filas usa una palabra que BE no dice de un entrenamiento', () => {
  const todas: FilaDeSesion[] = [
    fila24,
    filaDeLaSesion(DEL_24, null),
    filaDeLaSesion(ejecucion({ fecha: '2026-09-20', condicion: 'NOT_COMPLETED', prescripciones: SESION_B, registrado: [] }), OBJETIVOS),
    filaDeLaSesion(ejecucion({ fecha: '2026-09-21', prescripciones: SESION_B, registrado: [{ prescriptionId: 'rx-banca', resumen: 'Sin anotar' }] }), OBJETIVOS),
    filaDeLaSesion(ejecucion({ fecha: '2026-09-22', prescripciones: SESION_B, registrado: [{ prescriptionId: 'rx-banca', sets: BANCA_DENTRO, realizado: MANCUERNAS }] }), OBJETIVOS),
  ];
  const textos = [
    ...todas.flatMap((f) => [f.series, f.frente, ...f.ejercicios.flatMap((e) => [e.cuenta, e.notaDeLoIndicado ?? '', e.aviso ?? '', ...e.series.flatMap((s) => [s.indicado, s.registrado, s.frente])])]),
    ...VISTAS_DE_SESIONES.flatMap((v) => [v.nombre, v.queTrae]),
  ];
  for (const t of textos) assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
  for (const t of textos) assert.doesNotMatch(t, /%|—/);
});
