/**
 * WP-06 · los contratos de entrenamiento y las reglas que la API aplica antes de tocar la base: la estructura del
 * plan, el registro de ejecución y el identificador de la ocurrencia. Sin base, sin reloj y sin framework.
 *
 * Lo que se prueba acá es lo que decide el **código de error** y el **motivo** que recibe el cliente: la base
 * sostiene las mismas garantías por su cuenta (test/integration/maquinas-wp06.int-spec.ts), pero un cliente no puede
 * hacer nada útil con un «check_violation»; necesita saber qué corregir y dónde.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';
import * as contratosEntrenamiento from './contratos-entrenamiento';
import {
  CorregirEjecucionRequestSchema,
  EditarBorradorDeEjecucionRequestSchema,
  EstructuraDePlanDeEntrenamientoEntradaSchema,
  OcurrenciaSchema,
  PrescripcionEntradaSchema,
  SerieEjecutadaSchema,
  type EstructuraDePlanDeEntrenamientoEntrada,
} from './contratos-entrenamiento';
import {
  codificarOcurrencia,
  decodificarOcurrencia,
  interpretarCriterio,
  normalizarEstructuraDeEntrenamiento,
  problemasDeCoherencia,
  problemasDeCompletitud,
  problemasParaConfirmar,
  sesionesDelPlan,
  type RegistroEnBorrador,
} from './plan-de-entrenamiento';

const EJERCICIO = '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e02';
const OTRO_EJERCICIO = '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e03';
let secuencia = 0;
const nuevoId = () => `n${++secuencia}`;

function prescripcion(extra: Partial<z.input<typeof PrescripcionEntradaSchema>> = {}): z.input<typeof PrescripcionEntradaSchema> {
  return { exerciseVersionId: EJERCICIO, sets: [{ repetitions: { value: 8 } }], intensity: { criterion: 'RIR', target: { value: 2 } }, ...extra };
}
function estructura(e: z.input<typeof EstructuraDePlanDeEntrenamientoEntradaSchema>): EstructuraDePlanDeEntrenamientoEntrada {
  return EstructuraDePlanDeEntrenamientoEntradaSchema.parse(e);
}

// ─── Estructura del plan (REG-06-111, 126, 127; 09v10 §5) ───────────────────────────────────────

test('REG-06-126 · un plan simple omite microciclos y es válido: no se inventa un microciclo vacío (09v10:262)', () => {
  const r = normalizarEstructuraDeEntrenamiento(estructura({ blocks: [{ label: 'Bloque 1', sessions: [{ label: 'A', prescriptions: [prescripcion()] }] }] }), nuevoId);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.contenido.blocks[0]?.microcycles, []);
  assert.equal(r.contenido.blocks[0]?.sessions.length, 1);
  assert.deepEqual(problemasDeCompletitud(r.contenido), []);
});

test('REG-06-126 · con microciclos, la sesión cuelga del microciclo y la jerarquía se conserva tal cual', () => {
  const r = normalizarEstructuraDeEntrenamiento(
    estructura({ blocks: [{ label: 'B', microcycles: [{ label: 'Semana 1', purpose: 'Descarga', sessions: [{ label: 'A', prescriptions: [prescripcion()] }] }] }] }),
    nuevoId,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const [s] = sesionesDelPlan(r.contenido);
  assert.equal(s?.microciclo?.label, 'Semana 1');
  assert.equal(s?.ruta, 'blocks[0].microcycles[0].sessions[0]');
});

test('09v10:281 · un bloque con sesiones directas y microciclos a la vez es una estructura mal formada', () => {
  const r = normalizarEstructuraDeEntrenamiento(
    estructura({
      blocks: [{ label: 'B', microcycles: [{ label: 'S1', sessions: [] }], sessions: [{ label: 'A', prescriptions: [] }] }],
    }),
    nuevoId,
  );
  assert.deepEqual(r, { ok: false, tipo: 'ESTRUCTURA', issues: [{ code: 'SESSIONS_AND_MICROCYCLES_IN_BLOCK', path: 'blocks[0].sessions' }] });
});

test('REG-06-127 · el propósito es texto libre: «Descarga» no es un token ni pausa nada', () => {
  // El schema no tiene enum de propósitos: cualquier texto profesional entra.
  for (const purpose of ['Descarga', 'Acumulación', 'Lo que el profesional decida']) {
    assert.equal(EstructuraDePlanDeEntrenamientoEntradaSchema.safeParse({ blocks: [{ label: 'B', purpose, sessions: [] }] }).success, true);
  }
});

test('REG-06-111 · los identificadores que vienen se conservan y los que faltan los asigna el servidor', () => {
  const r = normalizarEstructuraDeEntrenamiento(
    estructura({ blocks: [{ blockId: 'blq-1', label: 'B', sessions: [{ sessionId: 'ses-a', label: 'A', prescriptions: [prescripcion({ prescriptionId: 'rx-1' }), prescripcion()] }] }] }),
    nuevoId,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const sesion = r.contenido.blocks[0]?.sessions[0];
  assert.equal(r.contenido.blocks[0]?.blockId, 'blq-1');
  assert.equal(sesion?.sessionId, 'ses-a');
  assert.equal(sesion?.prescriptions[0]?.prescriptionId, 'rx-1');
  assert.match(sesion?.prescriptions[1]?.prescriptionId ?? '', /^n\d+$/);
});

test('REG-06-111 · dos nodos con el mismo identificador no pueden coexistir: la ocurrencia y el registro dejarían de ser identificables', () => {
  const r = normalizarEstructuraDeEntrenamiento(
    estructura({ blocks: [{ label: 'B', sessions: [{ sessionId: 'x', label: 'A', prescriptions: [] }, { sessionId: 'x', label: 'B', prescriptions: [] }] }] }),
    nuevoId,
  );
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.tipo, 'ESTRUCTURA');
  assert.deepEqual(r.issues, [{ code: 'DUPLICATE_NODE_ID', path: 'blocks[0].sessions[1].sessionId' }]);
});

test('DL-088 · el identificador de nodo tiene alfabeto restringido: forma parte del occurrenceId', () => {
  assert.equal(EstructuraDePlanDeEntrenamientoEntradaSchema.safeParse({ blocks: [{ blockId: 'a.b', label: 'B' }] }).success, false);
  assert.equal(EstructuraDePlanDeEntrenamientoEntradaSchema.safeParse({ blocks: [{ blockId: 'a_b-1', label: 'B' }] }).success, true);
});

test('09v10:738-744 · validar informa lo que falta, vinculado a bloque, sesión y ejercicio, sin juzgar el programa', () => {
  const r = normalizarEstructuraDeEntrenamiento(
    estructura({ blocks: [{ label: 'B1' }, { label: 'B2', microcycles: [{ label: 'S1', sessions: [] }] }, { label: 'B3', sessions: [{ label: 'A', prescriptions: [] }] }] }),
    nuevoId,
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(problemasDeCompletitud(r.contenido), [
    { code: 'SESSION_REQUIRED', path: 'blocks[0].sessions' },
    { code: 'SESSION_REQUIRED', path: 'blocks[1].microcycles[0].sessions' },
    { code: 'PRESCRIPTION_REQUIRED', path: 'blocks[2].sessions[0].prescriptions' },
  ]);
  const vacio = normalizarEstructuraDeEntrenamiento(estructura({ blocks: [] }), nuevoId);
  assert.equal(vacio.ok && problemasDeCompletitud(vacio.contenido)[0]?.code, 'BLOCK_REQUIRED');
});

// ─── Intensidad (REG-06-128, 129; 09v10:344-394) ────────────────────────────────────────────────

test('REG-06-128 · el criterio es PERCENT_RM o RIR, y una prescripción sin criterio es legítima (no es un problema al validar)', () => {
  assert.deepEqual(interpretarCriterio('PERCENT_RM'), { criterio: 'PERCENT_RM' });
  assert.deepEqual(interpretarCriterio('RIR'), { criterio: 'RIR' });
  const r = normalizarEstructuraDeEntrenamiento(estructura({ blocks: [{ label: 'B', sessions: [{ label: 'A', prescriptions: [prescripcion({ intensity: null })] }] }] }), nuevoId);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.contenido.blocks[0]?.sessions[0]?.prescriptions[0]?.intensity, null);
  assert.deepEqual(problemasDeCompletitud(r.contenido), []);
});

test('REG-06-129 · el esfuerzo percibido nunca es criterio de prescripción: RPE es INTENSITY_CRITERION_INVALID con su motivo', () => {
  for (const criterio of ['RPE', 'rpe', 'PERCEIVED_EXERTION']) {
    const r = normalizarEstructuraDeEntrenamiento(
      estructura({ blocks: [{ label: 'B', sessions: [{ label: 'A', prescriptions: [prescripcion({ intensity: { criterion: criterio, target: { value: 8 } } })] }] }] }),
      nuevoId,
    );
    assert.deepEqual(r, { ok: false, tipo: 'INTENSIDAD', issues: [{ code: 'PERCEIVED_EXERTION_AS_CRITERION', path: 'blocks[0].sessions[0].prescriptions[0].intensity.criterion' }] });
  }
});

test('09v10:371 · los dos criterios a la vez se rechazan, y un tercero también', () => {
  assert.deepEqual(interpretarCriterio('PERCENT_RM+RIR'), { motivo: 'DOS_CRITERIOS' });
  assert.deepEqual(interpretarCriterio('LOAD'), { motivo: 'CRITERIO_DESCONOCIDO' });
  // Y el contrato no tiene dónde poner un segundo criterio: la intensidad es un solo objeto estricto.
  assert.equal(PrescripcionEntradaSchema.safeParse(prescripcion({ intensity: { criterion: 'RIR', target: { value: 2 }, percentRm: 75 } as never })).success, false);
});

test('09v10:391 · la carga sugerida no es criterio de intensidad: son dos campos distintos, y la carga exige unidad', () => {
  const r = PrescripcionEntradaSchema.safeParse(prescripcion({ suggestedLoad: { value: 80, unit: 'kg' } }));
  assert.equal(r.success, true);
  assert.equal(PrescripcionEntradaSchema.safeParse(prescripcion({ suggestedLoad: { value: 80 } as never })).success, false);
});

test('DL-088 · el objetivo de intensidad tiene rango de significado: un %RM mayor que 100 o un RIR negativo no significan nada', () => {
  const con = (criterion: string, value: number) =>
    normalizarEstructuraDeEntrenamiento(estructura({ blocks: [{ label: 'B', sessions: [{ label: 'A', prescriptions: [prescripcion({ intensity: { criterion, target: { value } } })] }] }] }), nuevoId);
  assert.equal(con('PERCENT_RM', 75).ok, true);
  assert.equal(con('PERCENT_RM', 180).ok, false);
  assert.equal(con('RIR', 0).ok, true);
  assert.equal(con('RIR', -1).ok, false);
});

test('REG-06-111 · un parámetro cuantitativo del profesional declara su unidad', () => {
  assert.equal(PrescripcionEntradaSchema.safeParse(prescripcion({ professionalParameters: [{ label: 'Descanso', value: 90, unit: 's' }] })).success, true);
  assert.equal(PrescripcionEntradaSchema.safeParse(prescripcion({ professionalParameters: [{ label: 'Descanso', value: 90 }] })).success, false);
  assert.equal(PrescripcionEntradaSchema.safeParse(prescripcion({ professionalParameters: [{ label: 'Tempo', value: '3-1-1' }] })).success, true);
});

// ─── Registro de ejecución (REG-06-130, 131, 132; 09v10 §27-§31) ────────────────────────────────

const serie = (setIndex: number, extra: Partial<z.input<typeof SerieEjecutadaSchema>> = {}) => ({
  setIndex,
  load: { value: 80, unit: 'kg' as const },
  completedRepetitions: 8,
  rir: 2,
  perceivedExertion: null,
  ...extra,
});
const registro = (r: Partial<RegistroEnBorrador>): RegistroEnBorrador => ({ condicion: 'REALIZADA', granularidad: 'SERIE', ejercicios: [], resumenDeSesion: null, ...r });

test('INV-06-152 · una serie captura carga con unidad, repeticiones, y RIR y esfuerzo opcionales (09v10:1072-1079)', () => {
  assert.equal(SerieEjecutadaSchema.safeParse(serie(1)).success, true);
  assert.equal(SerieEjecutadaSchema.safeParse(serie(1, { rir: null, perceivedExertion: null })).success, true);
  assert.equal(SerieEjecutadaSchema.safeParse({ ...serie(1), load: { value: 80 } }).success, false, 'una carga sin unidad no es una carga');
});

test('REG-06-131 · confirmar exige declarar la condición: la ausencia de registro nunca se confirma como nada', () => {
  assert.deepEqual(problemasParaConfirmar(registro({ condicion: null })), [{ code: 'SESSION_CONDITION_REQUIRED', path: 'sessionCondition' }]);
});

test('REG-06-131/132 · «No pude realizarla» se confirma sin granularidad y sin datos, con motivo opcional', () => {
  assert.deepEqual(problemasParaConfirmar(registro({ condicion: 'NO_REALIZADA', granularidad: null })), []);
});

test('REG-06-132 · una sesión NO_REALIZADA con series cargadas no se confirma, pero guardar el borrador sí se puede', () => {
  const r = registro({ condicion: 'NO_REALIZADA', granularidad: 'SERIE', ejercicios: [{ prescriptionId: 'rx-1', performedExerciseVersionId: EJERCICIO, sets: [serie(1)] }] });
  // Al guardar no se le borra nada a quien apretó «No pude realizarla» por error.
  assert.deepEqual(problemasDeCoherencia(r), { granularidad: [], valores: [] });
  assert.deepEqual(problemasParaConfirmar(r), [{ code: 'NOT_COMPLETED_WITH_EXECUTION_DATA', path: 'sessionCondition' }]);
});

test('09v10:1101 · un registro agregado no lleva series, y uno por serie no lleva resumen: no se sintetiza ninguna de las dos', () => {
  const agregadoConSeries = registro({ granularidad: 'EJERCICIO_O_SESION', ejercicios: [{ prescriptionId: 'rx-1', performedExerciseVersionId: EJERCICIO, sets: [serie(1)] }] });
  assert.deepEqual(problemasDeCoherencia(agregadoConSeries).granularidad, [{ code: 'GRANULARITY_MISMATCH', path: 'exercises[0]' }]);
  const porSerieConResumen = registro({ ejercicios: [{ prescriptionId: 'rx-1', performedExerciseVersionId: EJERCICIO, executionSummary: { description: 'Todo bien' } }] });
  assert.deepEqual(problemasDeCoherencia(porSerieConResumen).granularidad, [{ code: 'GRANULARITY_MISMATCH', path: 'exercises[0]' }]);
});

test('REG-06-132 · no se registran ejercicios antes de elegir granularidad', () => {
  const r = registro({ granularidad: null, ejercicios: [{ prescriptionId: 'rx-1', performedExerciseVersionId: EJERCICIO, sets: [serie(1)] }] });
  assert.deepEqual(problemasDeCoherencia(r).granularidad, [{ code: 'GRANULARITY_REQUIRED_FOR_EXERCISES', path: 'exercises[0]' }]);
});

test('una prescripción se registra una vez, y en ella cada serie tiene su índice', () => {
  const r = registro({
    ejercicios: [
      { prescriptionId: 'rx-1', performedExerciseVersionId: EJERCICIO, sets: [serie(1), serie(1)] },
      { prescriptionId: 'rx-1', performedExerciseVersionId: EJERCICIO, sets: [serie(1)] },
    ],
  });
  assert.deepEqual(problemasDeCoherencia(r).valores, [
    { code: 'DUPLICATE_SET_INDEX', path: 'exercises[0].sets[1].setIndex' },
    { code: 'DUPLICATE_PRESCRIPTION', path: 'exercises[1].prescriptionId' },
  ]);
});

test('09v10:1161 · para confirmar hace falta algo registrado; una serie sin carga ni repeticiones no registra nada', () => {
  assert.deepEqual(problemasParaConfirmar(registro({})), [{ code: 'EXECUTION_DATA_REQUIRED', path: 'exercises' }]);
  const vacia = registro({ ejercicios: [{ prescriptionId: 'rx-1', performedExerciseVersionId: EJERCICIO, sets: [serie(1, { load: null, completedRepetitions: null })] }] });
  assert.deepEqual(problemasParaConfirmar(vacia), [{ code: 'SET_WITHOUT_DATA', path: 'exercises[0].sets[0]' }]);
  const soloReps = registro({ ejercicios: [{ prescriptionId: 'rx-1', performedExerciseVersionId: EJERCICIO, sets: [serie(1, { load: null, rir: null })] }] });
  assert.deepEqual(problemasParaConfirmar(soloReps), [], 'sin RIR y sin carga también vale: no se infiere lo faltante');
});

test('09v10:1095 · en un registro agregado alcanza con el resumen de la sesión', () => {
  assert.deepEqual(problemasParaConfirmar(registro({ granularidad: 'EJERCICIO_O_SESION', resumenDeSesion: { description: 'Hice la rutina completa.' } })), []);
});

test('REG-06-130 · la sustitución es legítima: registrar otro ejercicio que el prescripto no es un problema', () => {
  const r = registro({ ejercicios: [{ prescriptionId: 'rx-1', performedExerciseVersionId: OTRO_EJERCICIO, sets: [serie(1)] }] });
  assert.deepEqual(problemasParaConfirmar(r), []);
});

test('09v10:995-1003 · el borrador se guarda por partes: cada campo es opcional, y la condición viaja como texto para dar su 422', () => {
  assert.equal(EditarBorradorDeEjecucionRequestSchema.safeParse({ expectedVersion: 'v1', changes: {} }).success, true);
  assert.equal(EditarBorradorDeEjecucionRequestSchema.safeParse({ expectedVersion: 'v1', changes: { sessionCondition: 'SKIPPED' } }).success, true);
  assert.equal(EditarBorradorDeEjecucionRequestSchema.safeParse({ expectedVersion: 'v1', changes: { ghost: 1 } }).success, false);
});

test('B10-06:879-884 · una corrección exige motivo', () => {
  const correction = { granularity: 'SET', sessionCondition: 'COMPLETED', reason: null, exercises: [], sessionSummary: null };
  assert.equal(CorregirEjecucionRequestSchema.safeParse({ reason: 'Cargué mal la carga.', correction }).success, true);
  assert.equal(CorregirEjecucionRequestSchema.safeParse({ reason: '  ', correction }).success, false);
});

// ─── La ocurrencia (DL-077; 09v10:924) ──────────────────────────────────────────────────────────

const OCURRENCIA = { versionDePlanId: 'a3bb189e-8bf9-4888-9912-ace4e6543002', sesionPlanificadaId: 'ses-a', fechaLocal: '2026-09-21' };

test('DL-077 · el occurrenceId vuelve a la misma ocurrencia, y dos ocurrencias distintas no comparten identificador', () => {
  const id = codificarOcurrencia(OCURRENCIA);
  assert.match(id, /^occ_[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodificarOcurrencia(id), OCURRENCIA);
  assert.notEqual(codificarOcurrencia({ ...OCURRENCIA, fechaLocal: '2026-09-22' }), id);
  assert.notEqual(codificarOcurrencia({ ...OCURRENCIA, sesionPlanificadaId: 'ses-b' }), id);
});

test('DL-077 · un identificador que el servidor no pudo emitir no decodifica: ni ajeno, ni alterado, ni en forma no canónica', () => {
  const id = codificarOcurrencia(OCURRENCIA);
  assert.equal(decodificarOcurrencia('occ_'), null);
  assert.equal(decodificarOcurrencia(id.replace('occ_', 'xyz_')), null);
  assert.equal(decodificarOcurrencia(id.slice(0, -3)), null);
  assert.equal(decodificarOcurrencia(`${id}!`), null);
  assert.equal(decodificarOcurrencia('occ_' + 'A'.repeat(400)), null);
  // Una sesión con un separador adentro no puede colarse: la forma decodificada se valida entera.
  assert.equal(decodificarOcurrencia(codificarOcurrencia({ ...OCURRENCIA, sesionPlanificadaId: 'a.b' })), null);
});

test('H-09-TRN-01 · la ocurrencia no tiene un estado «no realizada»: sin borrador es NOT_STARTED', () => {
  const estados = OcurrenciaSchema.shape.execution.shape.state.options;
  assert.deepEqual(estados, ['NOT_STARTED', 'DRAFT_IN_PROGRESS', 'REGISTERED']);
});

// ─── Cero juicio (DL-082; INV-06-153; TEST-PRJ-009) ─────────────────────────────────────────────

/**
 * La lista de WP-04, más lo que el 09 le prohíbe a entrenamiento (09v10 §40). La **única excepción** es el token
 * `PERCENT_RM`: es un criterio de prescripción de REG-06-128, no una medida de cumplimiento. Se exceptúa por nombre
 * exacto, no por patrón, para que cualquier otro «percent» siga saltando.
 */
const PROHIBIDO = /adherence|compliance|score|grade|percent|cumplid|adherencia|volume|volumen|personalrecord|\bpr\b|musclemap|effective_?volume|fatigue|risk/i;
const EXCEPCIONES = new Set(['PERCENT_RM']);

function recorrer(nodo: unknown, ruta: string, hallazgos: string[]): void {
  if (Array.isArray(nodo)) {
    nodo.forEach((n, i) => recorrer(n, `${ruta}[${i}]`, hallazgos));
    return;
  }
  if (nodo && typeof nodo === 'object') {
    for (const [clave, valor] of Object.entries(nodo)) {
      if (clave === 'properties' && valor && typeof valor === 'object') {
        for (const nombre of Object.keys(valor)) if (PROHIBIDO.test(nombre) && !EXCEPCIONES.has(nombre)) hallazgos.push(`${ruta}.${nombre}`);
      }
      if (clave === 'enum' && Array.isArray(valor)) for (const v of valor) if (typeof v === 'string' && PROHIBIDO.test(v) && !EXCEPCIONES.has(v)) hallazgos.push(`${ruta}=${v}`);
      recorrer(valor, `${ruta}.${clave}`, hallazgos);
    }
  }
}

test('TEST-PRJ-009 · ningún schema de entrenamiento tiene puntaje, cumplimiento, volumen, marcas ni mapa muscular', () => {
  const hallazgos: string[] = [];
  let revisados = 0;
  for (const [nombre, valor] of Object.entries(contratosEntrenamiento)) {
    if (!(valor instanceof z.ZodType)) continue;
    revisados++;
    recorrer(z.toJSONSchema(valor, { unrepresentable: 'any', io: 'input' }), nombre, hallazgos);
    recorrer(z.toJSONSchema(valor, { unrepresentable: 'any', io: 'output' }), nombre, hallazgos);
  }
  assert.ok(revisados > 40, `se revisaron ${revisados} schemas`);
  assert.deepEqual(hallazgos, []);
});

test('TEST-PRJ-009 · el control detecta un campo prohibido, y la excepción de PERCENT_RM no abre la puerta a otro «percent»', () => {
  const hallazgos: string[] = [];
  recorrer(z.toJSONSchema(z.object({ compliancePercent: z.number(), criterion: z.enum(['PERCENT_RM', 'PERCENT_COMPLETED']) })), 'prueba', hallazgos);
  assert.deepEqual(hallazgos, ['prueba.compliancePercent', 'prueba.properties.criterion=PERCENT_COMPLETED']);
});

test('TEST-PRJ-009 · el OpenAPI de entrenamiento tampoco expone nada de eso, y tiene las 26 operaciones', async () => {
  const { documentoOpenApi } = await import('./openapi');
  const doc = documentoOpenApi() as { paths: Record<string, unknown> };
  const hallazgos: string[] = [];
  const deEntrenamiento = Object.entries(doc.paths).filter(([r]) => r.includes('training'));
  for (const [ruta, metodos] of deEntrenamiento) recorrer(metodos, ruta, hallazgos);
  const operaciones = deEntrenamiento.reduce((n, [, m]) => n + Object.keys(m as object).length, 0);
  assert.equal(operaciones, 26, 'las 24 TRN, la carga manual (INT-TRN-01) y la lectura por período (DL-078)');
  assert.deepEqual(hallazgos, []);
});

test('§4.1 · la asimetría del contrato: dos colecciones de ejecución, una sola de plan, y ninguna de borradores de plan', async () => {
  const { documentoOpenApi } = await import('./openapi');
  const rutas = Object.keys((documentoOpenApi() as { paths: Record<string, unknown> }).paths);
  assert.ok(rutas.includes('/training/execution-drafts/{draftId}'));
  assert.ok(rutas.includes('/training/executions/{executionId}'));
  assert.ok(rutas.includes('/training/plans/{planId}'));
  assert.equal(rutas.some((r) => r.includes('plan-drafts')), false, 'no se inventa /training/plan-drafts por simetría');
  assert.ok(rutas.includes('/training/occurrences/{occurrenceId}/execution-draft'), 'el borrador cuelga de la ocurrencia, en singular');
});
