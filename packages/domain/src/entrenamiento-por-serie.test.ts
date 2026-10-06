/**
 * WP-ENTRENAMIENTO-SERIES (DL-122, DL-123, DL-124): los objetivos por serie, los eventos de tiempo y la compatibilidad
 * con la APK 0.13.2. Los datos de demostración son los del paquete de Dirección del 2026-10-06 (`sesion_demo.json`), que
 * no se cambian para que la prueba pase. El reloj es inyectado: ninguna prueba espera tiempo real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { EstructuraDePlanDeEntrenamientoEntradaSchema, PrescripcionEntradaSchema } from './contratos-entrenamiento';
import { EventoDeTiempoSchema, RegistrarEventosDeTiempoRequestSchema, type EventoDeTiempo, type InstanteDeEventoApi } from './contratos-entrenamiento-por-serie';
import { textoDeDescanso, textoDeDuracion, textoDelPlanDeLaSerie } from './copy-entrenamiento-por-serie';
import { sinCargasSugeridas } from './contratos-plantillas';
import { sinCargasDeLaSesion } from './habituales';
import { objetivosEfectivos, problemasDeObjetivosPorSerie, type PrescripcionParaResolver } from './objetivos-por-serie';
import { OPERACIONES } from './openapi';
import { aplicarEventos, calcularTiempos, enVivo, type ContextoDeEventos } from './sesion-de-entrenamiento';

// ─── Compatibilidad con la APK 0.13.2 ──────────────────────────────────────────────────────────

test('C01 · las respuestas de entrenamiento que lee la APK 0.13.2 no cambian de forma', () => {
  const congeladas = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'respuestas-que-lee-la-apk-instalada.json'), 'utf8')) as {
    operaciones: Record<string, { metodo: string; ruta: string; pedido: unknown; respuestas: Record<string, unknown> }>;
  };
  const entrenamiento = Object.entries(congeladas.operaciones).filter(([id]) => id.startsWith('API-TRN-'));
  assert.deepEqual(
    entrenamiento.map(([id]) => id).sort(),
    ['API-TRN-08', 'API-TRN-09', 'API-TRN-13', 'API-TRN-14', 'API-TRN-14-PERIODO', 'API-TRN-15', 'API-TRN-16', 'API-TRN-17', 'API-TRN-18', 'API-TRN-19', 'API-TRN-19-LISTA', 'API-TRN-20'],
  );
  for (const [id, congelada] of entrenamiento) {
    const op = OPERACIONES.find((o) => o.id === id)!;
    assert.equal(op.metodo, congelada.metodo, id);
    assert.equal(op.ruta, congelada.ruta, id);
    assert.deepEqual(op.request ? z.toJSONSchema(op.request, { target: 'draft-2020-12', io: 'input' }) : null, congelada.pedido, `${id}: el pedido`);
    for (const exito of op.exitos) {
      assert.deepEqual(exito.schema ? z.toJSONSchema(exito.schema, { target: 'draft-2020-12', io: 'output' }) : null, congelada.respuestas[exito.status], `${id}: la respuesta ${exito.status}`);
    }
  }
});

test('las operaciones nuevas son de familias propias, con su esquema estricto y su fuente', () => {
  const nuevas = OPERACIONES.filter((o) => /^API-(SER|TIE|EJE)-\d{2}$/.test(o.id));
  assert.deepEqual(nuevas.map((o) => o.id).sort(), ['API-EJE-01', 'API-EJE-02', 'API-EJE-03', 'API-SER-01', 'API-SER-02', 'API-TIE-01', 'API-TIE-02', 'API-TIE-03', 'API-TIE-04']);
  for (const o of nuevas) {
    assert.ok(o.fuente.includes('DL-12'), o.id);
    assert.ok(o.exitos.every((e) => e.schema), o.id);
  }
  // Las escrituras de imagen llevan Idempotency-Key; los eventos no, porque cada uno trae su identificador.
  assert.equal(OPERACIONES.find((o) => o.id === 'API-EJE-02')!.idempotencia, true);
  assert.equal(OPERACIONES.find((o) => o.id === 'API-EJE-03')!.idempotencia, true);
  assert.equal(OPERACIONES.find((o) => o.id === 'API-TIE-01')!.idempotencia, false);
});

// ─── Objetivos por serie (DL-122) ──────────────────────────────────────────────────────────────

interface SerieDemo {
  setIndex: number;
  plannedRepetitions: { min: number; max: number };
  suggestedLoad: { value: number; unit: 'kg' };
  plannedRir: number | null;
  recommendedRestSeconds: number | null;
}
const demo = JSON.parse(readFileSync(join(__dirname, '..', '..', '..', 'docs', 'fuente_entrenamiento', 'BE_Entrenamiento_Autonomo_2026-10-06', 'datos', 'sesion_demo.json'), 'utf8')) as {
  exercises: { fixtureKey: string; sets: SerieDemo[] }[];
};

/**
 * Las tres prescripciones de «Piernas A» como las cargaría el profesional: lo común en la prescripción y lo distinto en
 * cada serie. A y B usan el criterio RIR; C no declara criterio, tiene carga 0 kg y la última serie quita el descanso.
 */
const PRESCRIPCIONES: Record<string, PrescripcionParaResolver> = {
  A: {
    intensity: { criterion: 'RIR', target: { value: 3 } },
    suggestedLoad: { value: 16, unit: 'kg' },
    restSeconds: 90,
    sets: [
      { repetitions: { min: 12, max: 16 } },
      { repetitions: { min: 10, max: 12 }, rir: 2, suggestedLoad: { value: 18, unit: 'kg' }, restSeconds: 120 },
      { repetitions: { min: 8, max: 10 }, rir: 1, suggestedLoad: { value: 20, unit: 'kg' }, restSeconds: 150 },
    ],
  },
  B: {
    intensity: { criterion: 'RIR', target: { value: 3 } },
    suggestedLoad: { value: 10, unit: 'kg' },
    restSeconds: 90,
    sets: [
      { repetitions: { min: 10, max: 12 } },
      { repetitions: { min: 10, max: 12 }, rir: 2, suggestedLoad: { value: 12, unit: 'kg' }, restSeconds: 120 },
      { repetitions: { min: 8, max: 10 }, rir: 2, suggestedLoad: { value: 12, unit: 'kg' }, restSeconds: 120 },
    ],
  },
  C: {
    intensity: null,
    suggestedLoad: { value: 0, unit: 'kg' },
    restSeconds: 90,
    sets: [{ repetitions: { min: 10, max: 12 } }, { repetitions: { min: 10, max: 12 } }, { repetitions: { min: 8, max: 10 }, restSeconds: null }],
  },
};

test('P01 · cada serie de la demostración resuelve exactamente su rango, su carga, su RIR y su descanso', () => {
  assert.equal(demo.exercises.length, 3);
  for (const ejercicio of demo.exercises) {
    const efectivos = objetivosEfectivos(PRESCRIPCIONES[ejercicio.fixtureKey]!);
    assert.equal(efectivos.length, ejercicio.sets.length, ejercicio.fixtureKey);
    for (const [i, s] of ejercicio.sets.entries()) {
      const o = efectivos[i]!;
      assert.deepEqual(
        { setIndex: o.setIndex, repetitions: o.repetitions, suggestedLoad: o.suggestedLoad, rir: o.rir, restSeconds: o.restSeconds },
        { setIndex: s.setIndex, repetitions: s.plannedRepetitions, suggestedLoad: s.suggestedLoad, rir: s.plannedRir, restSeconds: s.recommendedRestSeconds },
        `${ejercicio.fixtureKey}${s.setIndex}`,
      );
    }
  }
});

test('P02 · ausente hereda, null quita y un valor sobrescribe; null nunca se vuelve cero', () => {
  const [hereda, quita, sobrescribe] = objetivosEfectivos({
    intensity: { criterion: 'RIR', target: { value: 2 } },
    suggestedLoad: { value: 40, unit: 'kg' },
    restSeconds: 120,
    sets: [
      { repetitions: { value: 8 } },
      { repetitions: { value: 8 }, rir: null, suggestedLoad: null, restSeconds: null },
      { repetitions: { value: 8 }, rir: 0, suggestedLoad: { value: 0, unit: 'kg' }, restSeconds: 0 },
    ],
  });
  assert.deepEqual([hereda!.rir, hereda!.suggestedLoad, hereda!.restSeconds], [2, { value: 40, unit: 'kg' }, 120]);
  assert.deepEqual(hereda!.origin, { rir: 'PRESCRIPTION', suggestedLoad: 'PRESCRIPTION', restSeconds: 'PRESCRIPTION' });
  assert.deepEqual([quita!.rir, quita!.suggestedLoad, quita!.restSeconds], [null, null, null]);
  assert.deepEqual(quita!.origin, { rir: 'SET', suggestedLoad: 'SET', restSeconds: 'SET' });
  // El cero es un valor: RIR 0, carga 0 kg y descanso 0 s (superserie) se conservan.
  assert.deepEqual([sobrescribe!.rir, sobrescribe!.suggestedLoad, sobrescribe!.restSeconds], [0, { value: 0, unit: 'kg' }, 0]);
  // Sin nada que heredar, el origen es NONE.
  const [nada] = objetivosEfectivos({ intensity: null, sets: [{ repetitions: null }] });
  assert.deepEqual([nada!.rir, nada!.suggestedLoad, nada!.restSeconds, nada!.origin.rir], [null, null, null, 'NONE']);
});

test('P02 · con %RM no hay RIR por serie: el criterio rige para todas y conserva su semántica', () => {
  const p: PrescripcionParaResolver = { intensity: { criterion: 'PERCENT_RM', target: { value: 75 } }, sets: [{ repetitions: { value: 5 } }, { repetitions: { value: 5 }, rir: 2 }] };
  assert.equal(objetivosEfectivos(p)[0]!.rir, null);
  assert.deepEqual(problemasDeObjetivosPorSerie(p), [{ setIndex: 2, motivo: 'SET_RIR_WITHOUT_RIR_CRITERION' }]);
  // El RIR objetivo va de 0 a 10, con decimales; el realizado admite hasta 20, pero un objetivo no.
  const rango: PrescripcionParaResolver = { intensity: { criterion: ' rir ', target: { value: 2 } }, sets: [{ repetitions: null, rir: 0 }, { repetitions: null, rir: 2.5 }, { repetitions: null, rir: 10.5 }] };
  assert.deepEqual(problemasDeObjetivosPorSerie(rango), [{ setIndex: 3, motivo: 'SET_RIR_OUT_OF_RANGE' }]);
});

test('la entrada del plan admite los objetivos por serie y sigue siendo estricta', () => {
  const base = { exerciseVersionId: 'ev_1', intensity: null };
  assert.equal(PrescripcionEntradaSchema.safeParse({ ...base, sets: [{ repetitions: { value: 8 }, rir: null, suggestedLoad: { value: 0, unit: 'kg' }, restSeconds: 90 }], restSeconds: 60, loadBasis: 'PER_IMPLEMENT', repetitionBasis: 'PER_SIDE' }).success, true);
  assert.equal(PrescripcionEntradaSchema.safeParse({ ...base, sets: [{ repetitions: { value: 8 }, rpe: 7 }] }).success, false);
  assert.equal(PrescripcionEntradaSchema.safeParse({ ...base, sets: [{ repetitions: { value: 8 }, restSeconds: 3601 }] }).success, false);
  assert.equal(PrescripcionEntradaSchema.safeParse({ ...base, sets: [{ repetitions: { value: 8 }, restSeconds: 1.5 }] }).success, false);
  assert.equal(PrescripcionEntradaSchema.safeParse({ ...base, sets: [], loadBasis: 'TWO_DUMBBELLS' }).success, false);
  // Ausente y null llegan distintos al servidor: la herencia depende de eso.
  const leida = PrescripcionEntradaSchema.parse({ ...base, sets: [{ repetitions: null }, { repetitions: null, rir: null }] });
  assert.equal('rir' in leida.sets[0]!, false);
  assert.equal(leida.sets[1]!.rir, null);
});

test('plantillas y habituales sin cargas quitan también la carga de cada serie, y conservan RIR y descanso', () => {
  const sesion = { label: 'S', prescriptions: [{ exerciseVersionId: 'ev_1', intensity: null, suggestedLoad: { value: 20, unit: 'kg' as const }, sets: [{ repetitions: null, suggestedLoad: { value: 22, unit: 'kg' as const }, restSeconds: 60 }] }] };
  const estructura = EstructuraDePlanDeEntrenamientoEntradaSchema.parse({ blocks: [{ label: 'B', sessions: [sesion] }] });
  const plantilla = sinCargasSugeridas(estructura).blocks[0]!.sessions![0]!.prescriptions[0]!;
  assert.equal('suggestedLoad' in plantilla, false);
  assert.deepEqual(plantilla.sets[0], { repetitions: null, restSeconds: 60 });
  const habitual = sinCargasDeLaSesion(estructura.blocks[0]!.sessions![0]!).prescriptions[0]!;
  assert.deepEqual(habitual.sets[0], { repetitions: null, restSeconds: 60 });
});

// ─── Eventos de tiempo (DL-124) ────────────────────────────────────────────────────────────────

const INICIO_CIVIL = Date.parse('2026-10-06T13:00:00.000-03:00');
/** Un instante monotónico del proceso `ancla`, `s` segundos después del inicio; el civil avanza igual salvo que se diga. */
const mono = (s: number, ancla = 'proceso-uno', civilS = s): InstanteDeEventoApi => ({
  civil: new Date(INICIO_CIVIL + civilS * 1000).toISOString(),
  monotonic: { anchor: ancla, ms: 5_000 + s * 1000 },
  source: 'MONOTONIC',
});
const declarado = (s: number): InstanteDeEventoApi => ({ civil: new Date(INICIO_CIVIL + s * 1000).toISOString(), monotonic: null, source: 'DECLARED' });

/** Un evento sin su identidad: el tipo, su carga y su instante. */
type Paso = EventoDeTiempo extends infer E ? (E extends unknown ? Omit<E, 'eventId' | 'runId' | 'sequence' | 'compoundActionId'> & { compoundActionId?: string | null } : never) : never;

/** Arma eventos con secuencia e identificadores correlativos; cada dispositivo genera los suyos, con su corrida. */
function corrida(pasos: readonly Paso[], runId = 'corrida-uno'): EventoDeTiempo[] {
  return pasos.map((p, i) => ({ compoundActionId: null, ...p, eventId: `${runId}-${String(i + 1).padStart(3, '0')}`, runId, sequence: i + 1 }) as EventoDeTiempo);
}

const CONTEXTO: ContextoDeEventos = { prescripciones: new Set(['pA', 'pB', 'pC']), otraSesionEnCurso: false };
const RECOMENDADO = (p: string, n: number) => (p === 'pA' ? ([90, 120, 150][n - 1] ?? null) : null);

/** El ejemplo reproducible principal de DECISIONES_Y_TIEMPOS.md, con el reloj monotónico de un solo proceso. */
const EJEMPLO = corrida([
  { type: 'SESSION_STARTED', at: mono(0) },
  { type: 'EXERCISE_ACTIVATED', prescriptionId: 'pA', at: mono(10) },
  { type: 'SET_TIMING_STARTED', timingId: 'serie-a1', prescriptionId: 'pA', setIndex: 1, at: mono(20) },
  { type: 'SET_TIMING_FINISHED', timingId: 'serie-a1', at: mono(60) },
  { type: 'REST_STARTED', restId: 'descanso-a1', prescriptionId: 'pA', setIndex: 1, at: mono(65) },
  { type: 'REST_FINISHED', restId: 'descanso-a1', at: mono(155) },
  { type: 'SET_TIMING_STARTED', timingId: 'serie-a2', prescriptionId: 'pA', setIndex: 2, at: mono(170) },
  { type: 'SET_TIMING_FINISHED', timingId: 'serie-a2', at: mono(210) },
  { type: 'REST_STARTED', restId: 'descanso-a2', prescriptionId: 'pA', setIndex: 2, at: mono(215) },
  { type: 'REST_FINISHED', restId: 'descanso-a2', at: mono(350) },
  { type: 'EXERCISE_ACTIVATED', prescriptionId: 'pB', at: mono(450) },
  { type: 'SESSION_PAUSED', at: mono(500) },
  { type: 'SESSION_RESUMED', at: mono(620) },
  { type: 'SESSION_FINISHED', resolution: 'FINISHED', at: mono(900) },
]);

test('T01 · el ejemplo principal: 900/120/780, A 440, B 330, sin ejercicio 10, todo medido', () => {
  const { resultados, aRegistrar } = aplicarEventos([], EJEMPLO, CONTEXTO);
  assert.ok(resultados.every((r) => r.status === 'RECORDED'));
  const t = calcularTiempos(aRegistrar, RECOMENDADO);
  assert.equal(t.state, 'FINISHED');
  assert.deepEqual(
    [t.session.elapsed, t.session.pauses, t.session.withoutPauses].map((d) => [d.ms! / 1000, d.quality]),
    [
      [900, 'MEASURED'],
      [120, 'MEASURED'],
      [780, 'MEASURED'],
    ],
  );
  assert.deepEqual(
    t.exercises.map((e) => [e.prescriptionId, e.duration.ms! / 1000]),
    [
      ['pA', 440],
      ['pB', 330],
    ],
  );
  assert.equal(t.unassigned.ms! / 1000, 10);
  // La suma de los ejercicios y de lo no asignado da exactamente la sesión sin pausas.
  assert.equal(t.exercises.reduce((n, e) => n + e.duration.ms!, 0) + t.unassigned.ms!, t.session.withoutPauses.ms);
});

test('T02 y T03 · descansos 90/90 y 135/120; series medidas de 40 s; A3 sin medir no aparece como medida', () => {
  const t = calcularTiempos(aplicarEventos([], EJEMPLO, CONTEXTO).aRegistrar, RECOMENDADO);
  assert.deepEqual(
    t.rests.map((r) => [r.setIndex, r.duration.ms! / 1000, r.duration.quality, r.recommendedSeconds, r.differenceMs! / 1000]),
    [
      [1, 90, 'MEASURED', 90, 0],
      [2, 135, 'MEASURED', 120, 15],
    ],
  );
  assert.deepEqual(
    t.timedSets.map((s) => [s.setIndex, s.duration.ms! / 1000, s.duration.quality]),
    [
      [1, 40, 'MEASURED'],
      [2, 40, 'MEASURED'],
    ],
  );
  assert.equal(
    t.timedSets.some((s) => s.setIndex === 3),
    false,
  );
  assert.equal(textoDeDescanso(t.rests[1]!), '02:15 registrado · 02:00 recomendado · +00:15');
  assert.equal(textoDeDescanso(t.rests[0]!), '01:30 registrado · 01:30 recomendado · ±00:00');
});

test('T05 · un reintento no suma; el mismo identificador con otro contenido es un conflicto', () => {
  const primeros = aplicarEventos([], EJEMPLO.slice(0, 6), CONTEXTO).aRegistrar;
  const reintento = aplicarEventos(primeros, EJEMPLO.slice(4, 8), CONTEXTO);
  assert.deepEqual(
    reintento.resultados.map((r) => r.status),
    ['DUPLICATE', 'DUPLICATE', 'RECORDED', 'RECORDED'],
  );
  const total = [...primeros, ...reintento.aRegistrar];
  assert.equal(calcularTiempos(total, RECOMENDADO).rests[0]!.duration.ms, 90_000);
  // El fin del descanso con otro instante: conflicto, y lo que sigue en el pedido no se procesa.
  const otro = { ...EJEMPLO[5]!, at: mono(170) } as EventoDeTiempo;
  const conflicto = aplicarEventos(total, [otro, EJEMPLO[8]!], CONTEXTO);
  assert.deepEqual(
    conflicto.resultados.map((r) => [r.status, r.reason]),
    [
      ['CONFLICT', 'EVENT_ID_REUSED'],
      ['REJECTED', 'PREVIOUS_EVENT_NOT_RECORDED'],
    ],
  );
  // Otro evento en una secuencia ocupada, o uno que salta la secuencia.
  const ocupada = { ...EJEMPLO[8]!, eventId: 'evento-nuevo', sequence: 3 } as EventoDeTiempo;
  assert.deepEqual(aplicarEventos(total, [ocupada], CONTEXTO).resultados[0], { eventId: 'evento-nuevo', status: 'CONFLICT', reason: 'SEQUENCE_REUSED' });
  const salto = { ...EJEMPLO[8]!, sequence: 12 } as EventoDeTiempo;
  assert.equal(aplicarEventos(total, [salto], CONTEXTO).resultados[0]!.reason, 'SEQUENCE_GAP');
});

test('T04 · una medición a la vez, nada se mide en pausa y terminar exige resolver lo abierto', () => {
  const abierto = aplicarEventos([], EJEMPLO.slice(0, 5), CONTEXTO).aRegistrar; // descanso A1 abierto
  const intento = (ev: Paso) =>
    aplicarEventos(abierto, [{ compoundActionId: null, ...ev, eventId: 'evento-intento', runId: 'corrida-uno', sequence: 6 } as EventoDeTiempo], CONTEXTO).resultados[0]!.reason;
  assert.equal(intento({ type: 'SET_TIMING_STARTED', timingId: 'serie-a2', prescriptionId: 'pA', setIndex: 2, at: mono(100) }), 'MEASUREMENT_OPEN');
  assert.equal(intento({ type: 'SESSION_PAUSED', at: mono(100) }), 'MEASUREMENT_OPEN');
  assert.equal(intento({ type: 'SESSION_FINISHED', resolution: 'FINISHED', at: mono(100) }), 'MEASUREMENT_OPEN');
  assert.equal(intento({ type: 'REST_FINISHED', restId: 'otro-descanso', at: mono(100) }), 'MEASUREMENT_NOT_OPEN');
  assert.equal(intento({ type: 'EXERCISE_ACTIVATED', prescriptionId: 'pZ', at: mono(100) }), 'PRESCRIPTION_NOT_IN_SESSION');
  // Cambiar de ejercicio durante el descanso es legítimo y no reasigna el descanso.
  assert.equal(intento({ type: 'EXERCISE_ACTIVATED', prescriptionId: 'pB', at: mono(100) }), null);
  // Dejar la sesión incompleta no exige resolver lo abierto: también queda incompleto.
  assert.equal(intento({ type: 'SESSION_FINISHED', resolution: 'LEFT_INCOMPLETE', at: declarado(3600) }), null);
  // La acción compuesta: finalizar el descanso e iniciar la serie, con el mismo identificador de acción.
  const compuesta = aplicarEventos(
    abierto,
    [
      { eventId: 'evento-006', runId: 'corrida-uno', sequence: 6, compoundActionId: 'accion-uno', type: 'REST_FINISHED', restId: 'descanso-a1', at: mono(155) },
      { eventId: 'evento-007', runId: 'corrida-uno', sequence: 7, compoundActionId: 'accion-uno', type: 'SET_TIMING_STARTED', timingId: 'serie-a2', prescriptionId: 'pA', setIndex: 2, at: mono(155) },
    ],
    CONTEXTO,
  );
  assert.deepEqual(
    compuesta.resultados.map((r) => r.status),
    ['RECORDED', 'RECORDED'],
  );
});

test('T08 · una sola sesión en curso: otro dispositivo u otra sesión no la duplican', () => {
  const empezada = aplicarEventos([], EJEMPLO.slice(0, 2), CONTEXTO).aRegistrar;
  const otroDispositivo = corrida([{ type: 'SESSION_STARTED', at: mono(30, 'proceso-otro') }], 'corrida-dos');
  assert.equal(aplicarEventos(empezada, otroDispositivo, CONTEXTO).resultados[0]!.reason, 'SESSION_ALREADY_STARTED');
  const siguiente = corrida([{ type: 'EXERCISE_ACTIVATED', prescriptionId: 'pB', at: mono(40, 'proceso-otro') }], 'corrida-dos').map((e) => ({ ...e, sequence: 3 }));
  assert.equal(aplicarEventos(empezada, siguiente, CONTEXTO).resultados[0]!.reason, 'RUN_MISMATCH');
  assert.equal(aplicarEventos([], EJEMPLO.slice(0, 1), { ...CONTEXTO, otraSesionEnCurso: true }).resultados[0]!.reason, 'ANOTHER_SESSION_IN_PROGRESS');
});

test('T06 · después de un reinicio nada es medido: lo que cruza procesos es estimado y lo abierto queda incompleto', () => {
  const eventos = aplicarEventos(
    [],
    corrida([
      { type: 'SESSION_STARTED', at: mono(0) },
      { type: 'EXERCISE_ACTIVATED', prescriptionId: 'pA', at: mono(10) },
      { type: 'REST_STARTED', restId: 'descanso-a1', prescriptionId: 'pA', setIndex: 1, at: mono(65) },
      // La app murió; al reabrir, la persona dice que el descanso terminó ahora: es otro proceso.
      { type: 'REST_FINISHED', restId: 'descanso-a1', at: mono(400, 'proceso-dos') },
      { type: 'SET_TIMING_STARTED', timingId: 'serie-a2', prescriptionId: 'pA', setIndex: 2, at: mono(410, 'proceso-dos') },
      { type: 'MEASUREMENT_LEFT_INCOMPLETE', measurementId: 'serie-a2', at: mono(900, 'proceso-dos') },
      { type: 'SESSION_FINISHED', resolution: 'FINISHED', at: mono(905, 'proceso-dos') },
    ]),
    CONTEXTO,
  ).aRegistrar;
  const t = calcularTiempos(eventos, RECOMENDADO);
  assert.deepEqual([t.rests[0]!.duration.ms! / 1000, t.rests[0]!.duration.quality], [335, 'ESTIMATED']);
  assert.deepEqual(t.timedSets[0]!.duration, { ms: null, quality: 'INCOMPLETE' });
  assert.deepEqual([t.session.elapsed.ms! / 1000, t.session.elapsed.quality], [905, 'ESTIMATED']);
  // Una sesión abandonada que se deja incompleta no se cierra a la hora en que se resolvió.
  const abandonada = calcularTiempos(
    aplicarEventos([], corrida([{ type: 'SESSION_STARTED', at: mono(0) }, { type: 'SESSION_FINISHED', resolution: 'LEFT_INCOMPLETE', at: declarado(86_400) }]), CONTEXTO).aRegistrar,
    RECOMENDADO,
  );
  assert.equal(abandonada.state, 'LEFT_INCOMPLETE');
  assert.equal(abandonada.finishedAt, null);
  assert.deepEqual(abandonada.session.elapsed, { ms: null, quality: 'INCOMPLETE' });
});

test('T06 · si el reloj civil se adelanta al monotónico (el teléfono durmió), el descanso es estimado; si se atrasa, sigue medido', () => {
  const descanso = (fin: InstanteDeEventoApi) =>
    calcularTiempos(
      aplicarEventos(
        [],
        corrida([
          { type: 'SESSION_STARTED', at: mono(0) },
          { type: 'REST_STARTED', restId: 'descanso-a1', prescriptionId: 'pA', setIndex: 1, at: mono(60) },
          { type: 'REST_FINISHED', restId: 'descanso-a1', at: fin },
        ]),
        CONTEXTO,
      ).aRegistrar,
      RECOMENDADO,
    ).rests[0]!.duration;
  // El monotónico contó 90 s y el civil 150 s: pudo haber dormido. Se informa el civil, como estimado.
  assert.deepEqual(descanso(mono(150, 'proceso-uno', 210)), { ms: 150_000, quality: 'ESTIMATED' });
  // El civil retrocedió una hora: el monotónico sigue valiendo.
  assert.deepEqual(descanso(mono(150, 'proceso-uno', -3450)), { ms: 90_000, quality: 'MEASURED' });
});

test('mientras corre: la sesión sin pausas y el descanso se recalculan desde los instantes, sin sumar ticks', () => {
  const eventos = aplicarEventos([], EJEMPLO.slice(0, 5), CONTEXTO).aRegistrar;
  const vivo = enVivo(eventos, mono(125));
  assert.deepEqual(vivo.sesionSinPausas, { ms: 125_000, quality: 'MEASURED' });
  assert.deepEqual(vivo.medicionAbierta, { ms: 60_000, quality: 'MEASURED' });
  assert.equal(vivo.pausada, false);
});

test('el contrato de eventos es estricto: el instante monotónico lleva su ancla y un pedido tiene hasta 30 eventos', () => {
  const ev = EJEMPLO[0]!;
  assert.equal(EventoDeTiempoSchema.safeParse(ev).success, true);
  assert.equal(EventoDeTiempoSchema.safeParse({ ...ev, at: { ...ev.at, monotonic: null } }).success, false);
  assert.equal(EventoDeTiempoSchema.safeParse({ ...ev, at: { ...ev.at, source: 'DECLARED' } }).success, false);
  assert.equal(EventoDeTiempoSchema.safeParse({ ...ev, extra: 1 }).success, false);
  assert.equal(RegistrarEventosDeTiempoRequestSchema.safeParse({ events: Array.from({ length: 31 }, () => ev) }).success, false);
  assert.equal(RegistrarEventosDeTiempoRequestSchema.safeParse({ events: [] }).success, false);
});

// ─── Textos ────────────────────────────────────────────────────────────────────────────────────

test('los textos del plan de la serie y de los tiempos dicen el dato sin juzgarlo', () => {
  const [a1] = objetivosEfectivos(PRESCRIPCIONES.A!);
  assert.equal(textoDelPlanDeLaSerie(a1!), '16 kg · 12–16 rep. · RIR 3');
  const [c1] = objetivosEfectivos(PRESCRIPCIONES.C!);
  assert.equal(textoDelPlanDeLaSerie(c1!), '0 kg · 10–12 rep.');
  assert.equal(textoDelPlanDeLaSerie({ repetitions: null, rir: null, suggestedLoad: null, restSeconds: null }), 'Sin objetivo');
  assert.equal(textoDelPlanDeLaSerie({ repetitions: { value: 8 }, rir: 2.5, suggestedLoad: { value: 22.5, unit: 'lb' }, restSeconds: null }), '22,5 lb · 8 rep. · RIR 2,5');
  assert.equal(textoDeDescanso({ duration: { ms: 105_000, quality: 'MEASURED' }, recommendedSeconds: 90, differenceMs: 15_000 }), '01:45 registrado · 01:30 recomendado · +00:15');
  assert.equal(textoDeDescanso({ duration: { ms: 75_000, quality: 'ESTIMATED' }, recommendedSeconds: null, differenceMs: null }), '01:15 estimado · sin recomendado');
  assert.equal(textoDeDescanso({ duration: { ms: null, quality: 'INCOMPLETE' }, recommendedSeconds: 90, differenceMs: null }), 'Incompleto · 01:30 recomendado');
  assert.equal(textoDeDuracion({ ms: null, quality: 'NO_DATA' }), 'No informado');
});
