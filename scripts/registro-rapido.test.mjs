/**
 * El registro rápido de la APK, «Ya la hice» (PA-03; Dirección, 2026-11-02; DL-160 y DL-161):
 * `apps/mobile/src/registro-rapido.ts`, sin React, y lo que la pantalla y las tarjetas tienen que cumplir en su código.
 *
 * Lo que se prueba:
 *  1. lo planificado en una línea («3 × 10 · RIR 2 · 16 kg»), con la carga solo si el plan la trae;
 *  2. una serie «con lo planificado» lleva los valores del plan y `AS_PLANNED`; un rango no es un número, y sin carga
 *     ni repeticiones no hay serie: nunca se fabrica;
 *  3. los pasos se saltan cuando no hacen falta: con «todo», hoy, 1 → 2 → Listo;
 *  4. lo que se manda a API-TRN-17 cumple el contrato estricto y los mínimos de API-TRN-18, con la condición correcta;
 *  5. lo escrito va `TYPED` y solo con lo escrito; una serie sin tildar no se manda; un ejercicio sin tildar tampoco;
 *  6. «Hice algo distinto» sin nada tildado es una sesión resumida, con la frase y la nota;
 *  7. la hora: opcional hoy, obligatoria otro día, nunca futura, y se elige tocando;
 *  8. cuándo se ofrece, qué borrador no se pisa y qué ocurrencia vale otro día;
 *  9. la navegación, la guardia de textos y lo que la pantalla usa (ni la corrida ni botones propios).
 *
 * **Lo que esto no prueba:** el dibujo, el teclado de Android, TalkBack ni la API real. Eso queda para el teléfono y la CI.
 * Uso: node --test scripts/registro-rapido.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
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
const rr = await import('../apps/mobile/src/registro-rapido.ts');
const nav = await import('../apps/mobile/src/navegacion.ts');
const { fechaCorta } = await import('../apps/mobile/src/formato.ts');
const { EditarBorradorDeEjecucionRequestSchema, SesionConObjetivosSchema, problemasParaConfirmar, terminosProhibidosDeEntrenamientoEn } = await import('@be/domain');

// ─── Una sesión sintética, como la daría API-SER-02 ─────────────────────────────────────────────

const serie = (setIndex, target) => ({
  setIndex,
  note: null,
  target: { repetitions: null, rir: null, suggestedLoad: null, restSeconds: null, ...target },
  targetOrigin: { rir: 'NONE', suggestedLoad: 'NONE', restSeconds: 'NONE' },
});
const prescripcion = (id, orden, nombre, sets) => ({
  prescriptionId: id,
  order: orden,
  exerciseId: `ej-${id}`,
  exerciseVersionId: `ev-${id}`,
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
const kg = (value) => ({ value, unit: 'kg' });

/** Dos ejercicios que se registran con lo planificado: parejo con carga y RIR, y una pirámide sin carga. */
const GOBLET = prescripcion('pGoblet', 1, 'Sentadilla goblet', [1, 2, 3].map((n) => serie(n, { repetitions: { value: 10 }, rir: 2, suggestedLoad: kg(16) })));
const RUMANO = prescripcion('pRumano', 2, 'Peso muerto rumano', [10, 8, 6].map((reps, i) => serie(i + 1, { repetitions: { value: reps } })));
/** Dos que el plan no deja tildar sin escribir: un rango sin carga, y sin repeticiones ni carga. */
const ZANCADA = prescripcion('pZancada', 3, 'Zancada', [1, 2].map((n) => serie(n, { repetitions: { min: 10, max: 12 } })));
const PLANCHA = prescripcion('pPlancha', 4, 'Plancha', [1, 2].map((n) => serie(n, {})));

const sesion = (...prescriptions) => SesionConObjetivosSchema.parse({ sessionId: 's1', label: 'Piernas A', order: 1, instructions: null, prescriptions });
const SIMPLE = sesion(GOBLET, RUMANO);
const COMPLETA = sesion(GOBLET, RUMANO, ZANCADA, PLANCHA);

const HOY = '2026-11-02';
/** Las 17:00 en Buenos Aires. */
const AHORA = new Date('2026-11-02T20:00:00Z');
const ctxDe = (s, fecha = HOY) => ({ sesion: s, fecha, hoy: HOY });

/** Las respuestas de «Hice todo lo planificado», sin tocar nada más. */
function conTodo(ctx) {
  return rr.elegir(ctx, rr.respuestasIniciales(ctx), 'todo');
}

/** El cuerpo cumple el contrato estricto de API-TRN-17 y los mínimos de API-TRN-18 del dominio. */
function cumpleElContrato(changes) {
  assert.equal(EditarBorradorDeEjecucionRequestSchema.safeParse({ expectedVersion: 'v1', changes }).success, true, JSON.stringify(changes));
  const problemas = problemasParaConfirmar({
    condicion: { COMPLETED: 'REALIZADA', COMPLETED_WITH_DEVIATION: 'REALIZADA_CON_DESVIO' }[changes.sessionCondition],
    granularidad: { SET: 'SERIE', EXERCISE_OR_SESSION: 'EJERCICIO_O_SESION' }[changes.granularity],
    ejercicios: changes.exercises,
    resumenDeSesion: changes.sessionSummary,
  });
  assert.deepEqual(problemas, [], JSON.stringify(problemas));
}

// ─── 1. Lo planificado en una línea ─────────────────────────────────────────────────────────────

test('1 · lo planificado en una línea: «3 × 10 · RIR 2 · 16 kg», la carga solo si el plan la trae, y la pirámide como es', () => {
  assert.equal(rr.lineaDelPlan(GOBLET), '3 × 10 · RIR 2 · 16 kg');
  assert.equal(rr.lineaDelPlan(RUMANO), '3 × 10/8/6');
  assert.equal(rr.lineaDelPlan(ZANCADA), '2 × 10–12');
  assert.equal(rr.lineaDelPlan(PLANCHA), '2 series');
  // Cargas distintas en la misma unidad: una sola unidad al final; el cero es un objetivo.
  const escalonada = prescripcion('pE', 5, 'Escalonada', [serie(1, { repetitions: { value: 8 }, suggestedLoad: kg(0) }), serie(2, { repetitions: { value: 8 }, suggestedLoad: kg(20) })]);
  assert.equal(rr.lineaDelPlan(escalonada), '2 × 8 · 0/20 kg');
  // Una serie con objetivo y otra sin: la que falta se dice con un guion, no se copia la de al lado.
  const mixta = prescripcion('pM', 6, 'Mixta', [serie(1, { repetitions: { value: 8 }, rir: 1 }), serie(2, { repetitions: { value: 8 } })]);
  assert.equal(rr.lineaDelPlan(mixta), '2 × 8 · RIR 1/–');
  assert.equal(rr.lineaDeLaSerie(GOBLET.sets[0]), '10 rep. · RIR 2 · 16 kg');
  assert.equal(rr.lineaDeLaSerie(PLANCHA.sets[0]), 'Sin objetivo');
});

// ─── 2. La serie con lo planificado ─────────────────────────────────────────────────────────────

test('2 · una serie con lo planificado lleva los valores del plan y AS_PLANNED, nunca una duración inferida', () => {
  assert.deepEqual(rr.serieDelPlan(GOBLET.sets[1]), { setIndex: 2, load: { value: 16, unit: 'kg' }, completedRepetitions: 10, rir: 2, perceivedExertion: null, recordedAs: 'AS_PLANNED' });
  assert.deepEqual(rr.serieDelPlan(RUMANO.sets[2]), { setIndex: 3, load: null, completedRepetitions: 6, rir: null, perceivedExertion: null, recordedAs: 'AS_PLANNED' });
  // Un rango no es un número: con carga, la serie va con la carga y sin repeticiones; sin carga, no hay serie.
  const conCarga = serie(1, { repetitions: { min: 10, max: 12 }, suggestedLoad: kg(18) });
  assert.deepEqual(rr.serieDelPlan(conCarga), { setIndex: 1, load: { value: 18, unit: 'kg' }, completedRepetitions: null, rir: null, perceivedExertion: null, recordedAs: 'AS_PLANNED' });
  assert.equal(rr.serieDelPlan(ZANCADA.sets[0]), null);
  assert.equal(rr.serieDelPlan(PLANCHA.sets[0]), null);
  assert.equal(rr.seRegistraConElPlan(GOBLET), true);
  assert.equal(rr.seRegistraConElPlan(ZANCADA), false);
  for (const s of [...GOBLET.sets, ...RUMANO.sets]) assert.equal('durationSeconds' in rr.serieDelPlan(s), false);
});

// ─── 3. Los pasos ───────────────────────────────────────────────────────────────────────────────

test('3 · con «todo», hoy, el recorrido es 1 → 2 → Listo; la nota, el detalle y otro día suman su paso', () => {
  const ctx = ctxDe(SIMPLE);
  const inicial = rr.respuestasIniciales(ctx);
  // Antes de elegir se cuenta el camino más corto: la franja nunca anuncia un paso que después se saltea.
  assert.deepEqual(rr.pasosDelRecorrido(ctx, inicial), ['como', 'ejercicios', 'listo']);
  const todo = conTodo(ctx);
  assert.deepEqual(rr.pasosDelRecorrido(ctx, todo), ['como', 'ejercicios', 'listo']);
  assert.equal(rr.esElUltimoPaso(ctx, todo, 'ejercicios'), true, '«Registrar sesión» va en el paso 2');
  assert.deepEqual(rr.pasosDelRecorrido(ctx, { ...todo, pidioNota: true }), ['como', 'ejercicios', 'cuando', 'listo']);
  const cambio = rr.marcarCambio(todo, 'pGoblet', true);
  assert.deepEqual(rr.pasosDelRecorrido(ctx, cambio), ['como', 'ejercicios', 'detalle', 'listo']);
  assert.deepEqual(rr.pasosDelRecorrido(ctx, rr.elegir(ctx, todo, 'parte')), ['como', 'ejercicios', 'cuando', 'listo'], 'con «una parte», la nota es un paso');
  // Desde una pendiente (otro día) la hora es obligatoria: el paso está aunque sea «todo».
  const pendiente = ctxDe(SIMPLE, '2026-10-30');
  assert.deepEqual(rr.pasosDelRecorrido(pendiente, conTodo(pendiente)), ['como', 'ejercicios', 'cuando', 'listo']);
  // Un ejercicio que el plan no deja tildar sin escribir lleva al detalle sin «Cambié algo».
  const completa = ctxDe(COMPLETA);
  assert.deepEqual(rr.pasosDelRecorrido(completa, conTodo(completa)), ['como', 'ejercicios', 'detalle', 'listo']);
  assert.deepEqual(rr.ejerciciosConDetalle(completa, conTodo(completa)).map((p) => p.prescriptionId), ['pZancada', 'pPlancha']);
  // Nunca menos de dos pasos ni más de cinco.
  const largo = { ...rr.elegir(completa, conTodo(completa), 'parte'), pidioNota: true };
  assert.equal(rr.pasosDelRecorrido(completa, rr.marcarCambio(largo, 'pGoblet', true)).length, 5);
  assert.equal(rr.pasoSiguiente(ctx, todo, 'como'), 'ejercicios');
  assert.equal(rr.pasoAnterior(ctx, cambio, 'detalle'), 'ejercicios');
  assert.equal(rr.pasoAnterior(ctx, todo, 'como'), 'como');
});

test('3 · elegir arma los ejercicios: con «todo» llegan tildados; «Cambié algo» y escribir tildan lo que tocan', () => {
  const ctx = ctxDe(SIMPLE);
  const todo = conTodo(ctx);
  assert.deepEqual(Object.values(todo.ejercicios).map((e) => e.hecho), [true, true]);
  const parte = rr.elegir(ctx, todo, 'parte');
  assert.deepEqual(Object.values(parte.ejercicios).map((e) => e.hecho), [false, false], 'con «una parte», se tilda lo hecho');
  assert.equal(rr.elegir(ctx, parte, 'parte'), parte, 'la misma elección no borra lo tildado');
  const cambio = rr.marcarCambio(parte, 'pRumano', true);
  assert.equal(cambio.ejercicios.pRumano.hecho, true, 'si cambió algo, lo hizo');
  assert.equal(rr.marcarEjercicio(cambio, 'pRumano', false).ejercicios.pRumano.cambio, false);
  const sinSerie = rr.marcarSerie(cambio, 'pRumano', 2, false);
  assert.equal(rr.escribir(sinSerie, 'pRumano', 2, 'repeticiones', '7').ejercicios.pRumano.series[2].hecha, true, 'escribir en una serie la tilda');
});

// ─── 4. Lo que se manda ─────────────────────────────────────────────────────────────────────────

test('4 · «todo», de un toque: por serie, «Realizada», cada serie con lo planificado, y cumple API-TRN-17 y 18', () => {
  const ctx = ctxDe(SIMPLE);
  const armado = rr.armarRegistro(ctx, conTodo(ctx), AHORA);
  assert.equal(armado.ok, true);
  const { changes, resumen } = armado;
  assert.equal(changes.granularity, 'SET');
  assert.equal(changes.sessionCondition, 'COMPLETED');
  assert.equal(changes.sessionSummary, null);
  assert.equal(changes.reason, null);
  assert.equal(changes.occurredAt, null, 'hoy, sin hora elegida, la pone la API');
  assert.deepEqual(
    changes.exercises.map((e) => [e.prescriptionId, e.performedExerciseVersionId, e.sets.map((s) => s.recordedAs).join(',')]),
    [
      ['pGoblet', 'ev-pGoblet', 'AS_PLANNED,AS_PLANNED,AS_PLANNED'],
      ['pRumano', 'ev-pRumano', 'AS_PLANNED,AS_PLANNED,AS_PLANNED'],
    ],
  );
  cumpleElContrato(changes);
  assert.deepEqual(resumen, { forma: 'series', ejercicios: 2, deEjercicios: 2, series: 6, condicion: 'COMPLETED', nivel: 'COMO_EL_PLAN' });
  assert.equal(rr.textoDelResumen(resumen), 'Registraste 2 de 2 ejercicios · 6 series.');
  // «Listo» dice el mismo rótulo que lee el profesional en el website (DL-161).
  assert.equal(rr.loQueVeTuProfesional(resumen), 'Tu profesional ve cómo la cargaste: «Cargada como el plan».');
  assert.equal(rr.textoAntesDeRegistrar(resumen), 'Vas a registrar 2 de 2 ejercicios · 6 series. Queda como «Realizada».');
});

test('4 · un ejercicio sin tildar no se manda y la sesión queda «Realizada con desvío»', () => {
  const ctx = ctxDe(SIMPLE);
  const armado = rr.armarRegistro(ctx, rr.marcarEjercicio(conTodo(ctx), 'pRumano', false), AHORA);
  assert.equal(armado.ok, true);
  assert.deepEqual(armado.changes.exercises.map((e) => e.prescriptionId), ['pGoblet']);
  assert.equal(armado.changes.sessionCondition, 'COMPLETED_WITH_DEVIATION');
  cumpleElContrato(armado.changes);
  assert.equal(rr.textoDelResumen(armado.resumen), 'Registraste 1 de 2 ejercicios · 3 series.');
  // Con «una parte» y todo tildado, vale lo que la persona dijo: con desvío.
  const parte = rr.elegir(ctx, conTodo(ctx), 'parte');
  const todas = rr.marcarEjercicio(rr.marcarEjercicio(parte, 'pGoblet', true), 'pRumano', true);
  assert.equal(rr.armarRegistro(ctx, todas, AHORA).changes.sessionCondition, 'COMPLETED_WITH_DEVIATION');
  // Sin nada tildado, con «todo» o «una parte», falta tildar: no se registra una sesión vacía.
  const nada = rr.armarRegistro(ctx, parte, AHORA);
  assert.deepEqual([nada.ok, nada.paso, nada.motivo], [false, 'ejercicios', rr.TEXTOS_DEL_REGISTRO_RAPIDO.faltaTildar]);
});

// ─── 5. Lo escrito ──────────────────────────────────────────────────────────────────────────────

test('5 · «Cambié algo»: lo escrito va TYPED y solo con lo escrito; lo tildado sin escribir, con el plan; lo destildado no va', () => {
  const ctx = ctxDe(SIMPLE);
  let r = rr.marcarCambio(conTodo(ctx), 'pGoblet', true);
  r = rr.escribir(r, 'pGoblet', 1, 'carga', '18,5');
  r = rr.escribir(r, 'pGoblet', 1, 'repeticiones', '9');
  r = rr.marcarSerie(r, 'pGoblet', 3, false);
  const armado = rr.armarRegistro(ctx, r, AHORA);
  assert.equal(armado.ok, true);
  const goblet = armado.changes.exercises.find((e) => e.prescriptionId === 'pGoblet');
  assert.deepEqual(goblet.sets, [
    // El RIR no se escribió: queda sin informar, no se copia el del plan.
    { setIndex: 1, load: { value: 18.5, unit: 'kg' }, completedRepetitions: 9, rir: null, perceivedExertion: null, recordedAs: 'TYPED' },
    { setIndex: 2, load: { value: 16, unit: 'kg' }, completedRepetitions: 10, rir: 2, perceivedExertion: null, recordedAs: 'AS_PLANNED' },
  ]);
  assert.equal(armado.changes.sessionCondition, 'COMPLETED_WITH_DEVIATION', 'una serie que no hizo es un desvío');
  assert.equal(armado.resumen.nivel, 'PARTE_COMO_EL_PLAN');
  cumpleElContrato(armado.changes);
  // Escribir valores con todas las series hechas no es un desvío por sí solo.
  const sinDesvio = rr.armarRegistro(ctx, rr.escribir(rr.marcarCambio(conTodo(ctx), 'pGoblet', true), 'pGoblet', 2, 'repeticiones', '11'), AHORA);
  assert.equal(sinDesvio.changes.sessionCondition, 'COMPLETED');
  // Con todas sus series destildadas, el ejercicio no se hizo: no se manda (SET_REQUIRED).
  let vacio = rr.marcarCambio(conTodo(ctx), 'pRumano', true);
  for (const n of [1, 2, 3]) vacio = rr.marcarSerie(vacio, 'pRumano', n, false);
  const sinRumano = rr.armarRegistro(ctx, vacio, AHORA);
  assert.deepEqual(sinRumano.changes.exercises.map((e) => e.prescriptionId), ['pGoblet']);
  assert.equal(sinRumano.changes.sessionCondition, 'COMPLETED_WITH_DEVIATION');
});

test('5 · un plan sin número para registrar pide anotarlo: nunca se fabrica una serie, y un valor ilegible se señala en su campo', () => {
  const ctx = ctxDe(COMPLETA);
  const sinEscribir = rr.armarRegistro(ctx, conTodo(ctx), AHORA);
  assert.equal(sinEscribir.ok, false);
  assert.equal(sinEscribir.paso, 'detalle');
  assert.equal(sinEscribir.motivo, 'Zancada, serie 1: anotá la carga o las repeticiones que hiciste.');
  assert.ok(sinEscribir.errores[rr.claveDeSerie('pZancada', 1)].fila);
  assert.ok(sinEscribir.errores[rr.claveDeSerie('pPlancha', 2)].fila);
  let r = conTodo(ctx);
  for (const [id, n, reps] of [
    ['pZancada', 1, '11'],
    ['pZancada', 2, '10'],
    ['pPlancha', 1, '1'],
  ])
    r = rr.escribir(r, id, n, 'repeticiones', reps);
  r = rr.marcarSerie(r, 'pPlancha', 2, false);
  const armado = rr.armarRegistro(ctx, r, AHORA);
  assert.equal(armado.ok, true);
  assert.deepEqual(
    armado.changes.exercises.map((e) => [e.prescriptionId, e.sets.map((s) => `${s.setIndex}:${s.completedRepetitions}:${s.recordedAs}`).join(' ')]),
    [
      ['pGoblet', '1:10:AS_PLANNED 2:10:AS_PLANNED 3:10:AS_PLANNED'],
      ['pRumano', '1:10:AS_PLANNED 2:8:AS_PLANNED 3:6:AS_PLANNED'],
      ['pZancada', '1:11:TYPED 2:10:TYPED'],
      ['pPlancha', '1:1:TYPED'],
    ],
  );
  cumpleElContrato(armado.changes);
  assert.equal(rr.textoDelResumen(armado.resumen), 'Registraste 4 de 4 ejercicios · 9 series.');
  // Un valor que no se puede leer queda en su campo, y el recorrido vuelve al detalle.
  const ilegible = rr.armarRegistro(ctx, rr.escribir(r, 'pZancada', 1, 'repeticiones', '11,5'), AHORA);
  assert.deepEqual([ilegible.ok, ilegible.paso, ilegible.motivo], [false, 'detalle', 'Zancada, serie 1: revisá lo que escribiste.']);
  assert.ok(ilegible.errores[rr.claveDeSerie('pZancada', 1)].repeticiones);
});

// ─── 6. Una sesión distinta ─────────────────────────────────────────────────────────────────────

test('6 · «Hice algo distinto» sin nada tildado se registra resumida: la frase y la nota son el resumen', () => {
  const ctx = ctxDe(SIMPLE);
  const distinto = rr.elegir(ctx, rr.respuestasIniciales(ctx), 'distinto');
  const sola = rr.armarRegistro(ctx, distinto, AHORA);
  assert.equal(sola.ok, true);
  assert.deepEqual(sola.changes, {
    granularity: 'EXERCISE_OR_SESSION',
    sessionCondition: 'COMPLETED_WITH_DEVIATION',
    exercises: [],
    sessionSummary: { description: 'Hice algo distinto.' },
    reason: null,
    occurredAt: null,
  });
  cumpleElContrato(sola.changes);
  const conNota = rr.armarRegistro(ctx, { ...distinto, nota: '  Salí a correr 40 minutos.  ' }, AHORA);
  assert.equal(conNota.changes.sessionSummary.description, 'Hice algo distinto: Salí a correr 40 minutos.');
  assert.equal(rr.textoDelResumen(conNota.resumen), 'Registraste la sesión resumida, sin series.');
  assert.equal(rr.loQueVeTuProfesional(conNota.resumen), 'Tu profesional ve cómo la cargaste: «Resumida, sin series».');
  // Con algo tildado, va por serie, y la nota viaja como motivo.
  const conUno = rr.armarRegistro(ctx, { ...rr.marcarEjercicio(distinto, 'pGoblet', true), nota: 'Cambié el orden.' }, AHORA);
  assert.equal(conUno.changes.granularity, 'SET');
  assert.equal(conUno.changes.reason, 'Cambié el orden.');
  assert.equal(conUno.changes.sessionSummary, null);
  cumpleElContrato(conUno.changes);
});

// ─── 7. La hora ─────────────────────────────────────────────────────────────────────────────────

test('7 · la hora: opcional hoy, obligatoria otro día; se elige en horas en punto, en UTC−3, y nunca futura', () => {
  const ctx = ctxDe(SIMPLE);
  assert.equal(rr.instanteDe('2026-11-01', 18), '2026-11-01T21:00:00.000Z');
  assert.equal(rr.instanteDe('2026-11-01', 23), '2026-11-02T02:00:00.000Z', 'las 23 en Buenos Aires ya son mañana en UTC');
  const ayer = { ...conTodo(ctx), pidioNota: true, dia: '2026-11-01' };
  assert.deepEqual(rr.armarRegistro(ctx, ayer, AHORA), { ok: false, paso: 'cuando', motivo: rr.TEXTOS_DEL_REGISTRO_RAPIDO.faltaLaHora });
  assert.equal(rr.armarRegistro(ctx, { ...ayer, hora: 9 }, AHORA).changes.occurredAt, '2026-11-01T12:00:00.000Z');
  assert.equal(rr.armarRegistro(ctx, { ...conTodo(ctx), hora: 8 }, AHORA).changes.occurredAt, '2026-11-02T11:00:00.000Z', 'hoy también se puede elegir');
  assert.deepEqual(rr.armarRegistro(ctx, { ...conTodo(ctx), hora: 20 }, AHORA), { ok: false, paso: 'cuando', motivo: rr.TEXTOS_DEL_REGISTRO_RAPIDO.revisaLaHora });
  // A las 17: la tarde llega hasta las 17 y la noche todavía no; otro día, todas.
  assert.deepEqual(rr.horasDisponibles('tarde', HOY, AHORA), [12, 13, 14, 15, 16, 17]);
  assert.deepEqual(rr.horasDisponibles('noche', HOY, AHORA), []);
  assert.deepEqual(rr.franjasDisponibles(HOY, AHORA).map((f) => f.valor), ['manana', 'tarde']);
  assert.deepEqual(rr.horasDisponibles('noche', '2026-11-01', AHORA), [19, 20, 21, 22, 23]);
  assert.deepEqual(rr.horasDisponibles('manana', '2026-11-03', AHORA), [], 'un día futuro no tiene horas');
  assert.equal(rr.horaQueSigue(21, HOY, AHORA), null, 'al pasar de ayer a hoy, las 21 se sueltan');
  assert.equal(rr.horaQueSigue(9, HOY, AHORA), 9);
  assert.equal(rr.franjaDe(12), 'tarde');
  assert.equal(rr.textoDeHora(7), '07:00');
});

test('7 · los días se tocan: «Hoy», «Ayer» y cinco más; desde una pendiente, el día es el de la pendiente', () => {
  const dias = rr.diasParaElegir(ctxDe(SIMPLE));
  assert.equal(dias.length, rr.DIAS_PARA_ELEGIR);
  assert.deepEqual(dias.slice(0, 3), [
    { valor: '2026-11-02', texto: 'Hoy' },
    { valor: '2026-11-01', texto: 'Ayer' },
    { valor: '2026-10-31', texto: fechaCorta('2026-10-31') },
  ]);
  assert.equal(dias.at(-1).valor, '2026-10-27');
  assert.deepEqual(rr.diasParaElegir(ctxDe(SIMPLE, '2026-10-30')), []);
  assert.equal(rr.diaAnterior('2026-03-01', 1), '2026-02-28');
  const pendiente = ctxDe(SIMPLE, '2026-10-30');
  const r = conTodo(pendiente);
  assert.equal(r.dia, '2026-10-30');
  assert.equal(rr.armarRegistro(pendiente, { ...r, hora: 19 }, AHORA).changes.occurredAt, '2026-10-30T22:00:00.000Z');
});

// ─── 8. Cuándo se ofrece y qué no se pisa ───────────────────────────────────────────────────────

test('8 · «Ya la hice» se ofrece sin borrador, sin la sesión en curso ni en este teléfono, y con algo para tildar', () => {
  const o = (state, prescriptions = [GOBLET]) => ({ occurrenceId: 'o1', execution: { state, draftId: null, executionId: null, sessionCondition: null }, plannedSession: { prescriptions } });
  assert.equal(rr.sePuedeOfrecer(o('NOT_STARTED'), false, []), true);
  assert.equal(rr.sePuedeOfrecer(o('DRAFT_IN_PROGRESS'), false, []), false, 'con un borrador queda «Continuar», que conserva lo cargado');
  assert.equal(rr.sePuedeOfrecer(o('REGISTERED'), false, []), false);
  assert.equal(rr.sePuedeOfrecer(o('NOT_STARTED'), true, []), false);
  assert.equal(rr.sePuedeOfrecer(o('NOT_STARTED'), false, [{ occurrenceId: 'o1' }]), false);
  assert.equal(rr.sePuedeOfrecer(o('NOT_STARTED'), false, [{ occurrenceId: 'otra' }]), true);
  assert.equal(rr.sePuedeOfrecer(o('NOT_STARTED', []), false, []), false);
});

test('8 · un borrador con series o un resumen no se pisa, salvo que sea lo que mandó este mismo recorrido', () => {
  const b = { draftId: 'd1', version: 'v2', exercises: [], sessionSummary: null };
  assert.equal(rr.borradorConDatos(b, null), false);
  assert.equal(rr.borradorConDatos({ ...b, exercises: [{ prescriptionId: 'pGoblet' }] }, null), true);
  assert.equal(rr.borradorConDatos({ ...b, sessionSummary: { description: 'Algo' } }, null), true);
  const nuestro = { draftId: 'd1', version: 'v2', cuerpo: '{}' };
  assert.equal(rr.borradorConDatos({ ...b, exercises: [{ prescriptionId: 'pGoblet' }] }, nuestro), false, 'un reintento de lo nuestro');
  assert.equal(rr.borradorConDatos({ ...b, version: 'v3', exercises: [{ prescriptionId: 'pGoblet' }] }, nuestro), true, 'si después lo tocó otro, no');
});

test('8 · otro día, la ocurrencia de la misma sesión y de la misma versión del plan', () => {
  const o = (occurrenceId, sessionId, planId, state = 'NOT_STARTED', executionId = null) => ({ occurrenceId, planId, plannedSession: { sessionId }, execution: { state, executionId } });
  assert.deepEqual(rr.ocurrenciaDelDia([o('x', 's2', 'p1'), o('y', 's1', 'p1')], 's1', 'p1'), { ok: true, occurrenceId: 'y', executionId: null });
  assert.deepEqual(rr.ocurrenciaDelDia([o('y', 's1', 'p0')], 's1', 'p1'), { ok: false, motivo: rr.TEXTOS_DEL_REGISTRO_RAPIDO.otroPlanEseDia });
  assert.deepEqual(rr.ocurrenciaDelDia([], 's1', 'p1'), { ok: false, motivo: rr.TEXTOS_DEL_REGISTRO_RAPIDO.sinSesionEseDia });
  assert.deepEqual(rr.ocurrenciaDelDia([o('y', 's1', 'p1', 'REGISTERED', 'e9')], 's1', 'p1'), { ok: true, occurrenceId: 'y', executionId: 'e9' });
});

// ─── 9. Navegación, textos y lo que usa la pantalla ─────────────────────────────────────────────

test('9 · el registro rápido es de Entrenamiento y deja la barra a la vista; registrado, «Atrás» vuelve adonde se abrió', () => {
  const ruta = { nombre: 'registro-rapido', occurrenceId: 'o1', fecha: HOY, etiqueta: 'Piernas A', sessionId: 's1', planId: 'p1' };
  assert.equal(nav.moduloDe(ruta), 'entrenamiento');
  assert.equal(nav.sinBarraInferior(ruta), false, 'no es la sesión enfocada');
  assert.deepEqual(nav.anterior(ruta), { nombre: 'entrenamiento' });
  for (const origen of [{ nombre: 'inicio' }, { nombre: 'entrenamiento' }]) {
    const abierto = nav.navegar(origen, ruta);
    assert.deepEqual(nav.anterior(abierto), origen);
    const registrada = nav.navegar(abierto, { nombre: 'ejecucion-de-entrenamiento', id: 'e1' }, 'reemplazar');
    assert.deepEqual(nav.anterior(registrada), origen, 'el registro reemplaza al recorrido');
  }
  assert.equal(nav.mismaPantalla(ruta, { ...ruta, occurrenceId: 'o2' }), false);
});

test('9 · los textos no califican: sin puntajes, sin «cumplimiento», sin «bien», «mal» ni «excelente», y sin tildes de aprobado', () => {
  const T = rr.TEXTOS_DEL_REGISTRO_RAPIDO;
  const textos = [
    ...Object.values(T).map((v) => (typeof v === 'function' ? v('Piernas A', 2) : v)),
    ...rr.ELECCIONES.map((e) => e.texto),
    ...Object.values(rr.NOMBRE_DEL_PASO),
    ...rr.FRANJAS.map((f) => f.texto),
    rr.textoAntesDeRegistrar({ forma: 'series', ejercicios: 1, deEjercicios: 2, series: 3, condicion: 'COMPLETED_WITH_DEVIATION' }),
    rr.textoDelResumen({ forma: 'resumen', ejercicios: 0, deEjercicios: 2, series: 0, condicion: 'COMPLETED_WITH_DEVIATION' }),
    ...['CON_DETALLE', 'COMO_EL_PLAN', 'PARTE_COMO_EL_PLAN', 'RESUMIDA', null].map((nivel) => rr.loQueVeTuProfesional({ nivel })),
  ];
  const todo = textos.join(' | ');
  assert.deepEqual(terminosProhibidosDeEntrenamientoEn(todo), []);
  assert.doesNotMatch(todo, /\b(bien|mal|excelente|felicitaciones|genial)\b/i);
  assert.doesNotMatch(todo, /[✓✔☑]/u);
  assert.doesNotMatch(todo, /no realizad/i, '«Ya la hice» nunca registra «No realizada»');
});

const fuente = (ruta) => readFileSync(resolve(RAIZ, ruta), 'utf8');

test('9 · la pantalla no arranca la corrida, usa las piezas de ui.tsx, y confirma con la clave del intento', () => {
  const PANTALLA = fuente('apps/mobile/src/pantallas/registro-rapido.tsx');
  assert.doesNotMatch(PANTALLA, /useAbrirOcurrencia\(|entrenamientoLocal\.(preparar|accion)\(/, 'sin corrida ni cronómetros');
  assert.doesNotMatch(PANTALLA, /\b(Pressable|TouchableOpacity|TouchableHighlight)\b/, 'ninguna forma de botón propia');
  const pasos = ['api.abrirBorradorDeEjecucion(token, ocurrencia)', 'api.guardarBorradorDeEjecucion(token, borrador.draftId', 'api.confirmarEjecucion(token, borrador.draftId, version, intento.actual())', 'intento.registrar(c);'];
  const lugares = pasos.map((p) => PANTALLA.indexOf(p));
  assert.ok(lugares.every((l, i) => l > 0 && (i === 0 || l > lugares[i - 1])), `PUT, PATCH y POST, en orden: ${lugares}`);
  assert.match(PANTALLA, /borradorConDatos\(borrador, nuestro\.current\)/, 'antes del PATCH se mira lo que el borrador ya tiene');
  // Las entradas: al lado de «Iniciar entrenamiento» en Hoy y en Inicio, y «La hice ese día» en las pendientes.
  const ENTRENAMIENTO = fuente('apps/mobile/src/pantallas/entrenamiento.tsx');
  const INICIO = fuente('apps/mobile/src/pantallas/inicio-entrenamiento.tsx');
  assert.match(ENTRENAMIENTO, /TEXTOS_DEL_REGISTRO_RAPIDO\.yaLaHice\} tipo="secundario" onPress=\{\(\) => ir\(aRegistroRapido\(o\)\)\}/);
  assert.match(ENTRENAMIENTO, /TEXTOS_DEL_REGISTRO_RAPIDO\.laHiceEseDia/);
  assert.match(ENTRENAMIENTO, /aRegistroRapido\(ocurrenciaDeHoy, \{ occurrenceId, fecha: prevista \}\)/);
  assert.match(INICIO, /TEXTOS_DEL_REGISTRO_RAPIDO\.yaLaHice\} tipo="secundario" onPress=\{\(\) => ir\(aRegistroRapido\(o\)\)\}/);
});
