/**
 * La corrección de una sesión registrada en la APK (PA-04, decisión de Dirección del 2026-11-02):
 * `apps/mobile/src/correccion-de-la-sesion.ts`.
 *
 * Lo que se prueba, con «Prueba Uno» (sintética): Sentadilla registrada en dos de sus tres series y Press de banca
 * planificado y sin registrar.
 *  1. lo planificado sin registrar aparece para cargarlo, en gris, y un ejercicio que no se registró aparece entero;
 *  2. el estado inicial arma lo mismo que rige: sin tocar nada, la corrección «no cambia nada»;
 *  3. lo que se suma viaja como TYPED y con la versión planificada; las filas vacías no viajan;
 *  4. lo que no se toca conserva su forma de carga, su esfuerzo y su duración; lo reescrito va TYPED y conserva la duración;
 *  5. quitar una serie no renumera las demás, «Deshacer» la devuelve, y un ejercicio sin series no viaja;
 *  6. una registrada vaciada es un error en esa fila; «8,5» repeticiones también, y «52,5» kg vuelve como 52,5;
 *  7. «No pude realizarla» queda sin series ni resumen; desde ahí se pueden cargar las series o contar cómo fue;
 *  8. el orden: lo que rige y después lo sumado;
 *  9. el motivo de un toque, u otro escrito, y sin motivo no se registra;
 * 10. los cambios se dicen en frases; todo lo construido pasa el contrato de API-TRN-20 y sus mínimos;
 * 11. los textos pasan la guardia de entrenamiento (T13).
 *
 * **Lo que esto no prueba:** el dibujo, el teclado ni TalkBack. Eso queda para el teléfono.
 * Uso: node --test scripts/correccion-de-la-sesion.test.mjs (después de construir @be/domain).
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

const c = await import('../apps/mobile/src/correccion-de-la-sesion.ts');
const { CorregirEjecucionRequestSchema, SesionConObjetivosSchema, problemasParaConfirmar, terminosProhibidosDeEntrenamientoEn } = await import('@be/domain');

// ─── Prueba Uno ──────────────────────────────────────────────────────────────────────────────────

const objetivo = (reps, carga) => ({ repetitions: { value: reps }, rir: 2, suggestedLoad: carga === null ? null : { value: carga, unit: 'kg' }, restSeconds: 90 });
const serieConObjetivo = (setIndex, reps, carga) => ({ setIndex, note: null, target: objetivo(reps, carga), targetOrigin: { rir: 'SET', suggestedLoad: 'SET', restSeconds: 'SET' } });
const prescripcion = (prescriptionId, order, nombre, series) => ({
  prescriptionId,
  order,
  exerciseId: `ej-${prescriptionId}`,
  exerciseVersionId: `ev-${prescriptionId}`,
  exerciseName: nombre,
  image: null,
  sets: series,
  intensity: null,
  suggestedLoad: null,
  restSeconds: null,
  loadBasis: null,
  repetitionBasis: null,
  professionalParameters: [],
  note: null,
});
const SESION = SesionConObjetivosSchema.parse({
  sessionId: 'prueba-uno',
  label: 'Prueba Uno',
  order: 1,
  instructions: null,
  prescriptions: [
    prescripcion('sentadilla', 1, 'Sentadilla', [serieConObjetivo(1, 8, 60), serieConObjetivo(2, 8, 60), serieConObjetivo(3, 8, 60)]),
    prescripcion('press', 2, 'Press de banca', [serieConObjetivo(1, 10, 45), serieConObjetivo(2, 10, 45), serieConObjetivo(3, 10, 45)]),
  ],
});

const serie = (setIndex, carga, reps, extra = {}) => ({ setIndex, load: carga === null ? null : { value: carga, unit: 'kg' }, completedRepetitions: reps, rir: null, perceivedExertion: null, ...extra });
const ejercicio = (id, nombre, sets) => ({ prescriptionId: id, prescribedExerciseVersionId: `ev-${id}`, prescribedExerciseName: nombre, performedExerciseVersionId: `ev-${id}`, performedExerciseName: nombre, substituted: false, sets, executionSummary: null });

const ORIGINAL = {
  granularity: 'SET',
  sessionCondition: 'COMPLETED',
  reason: null,
  exercises: [ejercicio('sentadilla', 'Sentadilla', [serie(1, 58, 8, { perceivedExertion: 7, durationSeconds: 40 }), serie(2, 55, 3, { recordedAs: 'AS_PLANNED' })])],
  sessionSummary: null,
};
const EJECUCION = { original: ORIGINAL, corrections: [], effectiveView: { kind: 'ORIGINAL' } };
const nombreDe = (id) => SESION.prescriptions.find((p) => p.prescriptionId === id)?.exerciseName ?? 'Ejercicio';

const inicial = () => c.estadoInicial(EJECUCION, SESION);
const hacer = (estado, ...acciones) => acciones.reduce((e, a) => c.corregir(e, a), estado);
const escribir = (prescriptionId, setIndex, campo, texto) => ({ tipo: 'escribir', prescriptionId, setIndex, campo, texto });
const conMotivo = (estado) => c.corregir(estado, { tipo: 'motivo', motivo: 'falto-cargar' });

/** Lo construido, pasado por el contrato de API-TRN-20 y los mínimos de una confirmación, como lo haría la API. */
function pasaElContrato(pedido) {
  const cuerpo = CorregirEjecucionRequestSchema.parse({ reason: pedido.reason, correction: pedido.correction });
  const r = cuerpo.correction;
  const granularidad = r.granularity === null ? null : r.granularity === 'SET' ? 'SERIE' : 'EJERCICIO_O_SESION';
  const condicion = { COMPLETED: 'REALIZADA', COMPLETED_WITH_DEVIATION: 'REALIZADA_CON_DESVIO', NOT_COMPLETED: 'NO_REALIZADA' }[r.sessionCondition];
  return problemasParaConfirmar({ condicion, granularidad, ejercicios: r.exercises, resumenDeSesion: r.sessionSummary });
}

// ─── 1 y 2 ───────────────────────────────────────────────────────────────────────────────────────

test('1 · lo planificado sin registrar aparece para cargarlo, y un ejercicio sin registrar aparece entero', () => {
  const e = inicial();
  assert.deepEqual(
    e.ejercicios.map((ej) => [ej.nombre, ej.estaba, ej.filas.map((f) => `${f.setIndex}:${f.origen}`)]),
    [
      ['Sentadilla', true, ['1:registrada', '2:registrada', '3:planificada']],
      ['Press de banca', false, ['1:planificada', '2:planificada', '3:planificada']],
    ],
  );
  const [sentadilla, press] = e.ejercicios;
  // Lo registrado viene escrito, con coma si tiene decimales; lo planificado, vacío, con su objetivo para el gris.
  assert.deepEqual(sentadilla.filas[0].escrita, { carga: '58', repeticiones: '8', rir: '' });
  assert.deepEqual(press.filas[0].escrita, { carga: '', repeticiones: '', rir: '' });
  assert.deepEqual(press.filas[0].objetivo.repetitions, { value: 10 });
  assert.equal(c.estadoDelEjercicio(sentadilla), '2 de 3 series registradas');
  assert.equal(c.estadoDelEjercicio(press), 'Sin registrar');
});

test('2 · sin tocar nada, la corrección arma lo mismo que rige, y registrarla dice que no cambia nada', () => {
  const e = conMotivo(inicial());
  const construida = c.construirCorreccion(e);
  assert.equal(construida.ok, true);
  assert.equal(c.canonico(construida.correction), c.canonico(c.registroComoEntrada(ORIGINAL)));
  assert.deepEqual(c.cambiosDelEstado(e, ORIGINAL, nombreDe), []);
  const pedido = c.pedidoDeCorreccion(e, ORIGINAL);
  assert.deepEqual([pedido.ok, pedido.mensaje], [false, c.TEXTOS_DE_LA_CORRECCION.sinCambios]);
  assert.equal(c.hayAlgoSinGuardar(inicial(), inicial()), false);
});

// ─── 3 y 4 ───────────────────────────────────────────────────────────────────────────────────────

test('3 · sumar lo que faltó: viaja como TYPED, con la versión planificada, y las filas vacías no viajan', () => {
  const e = conMotivo(hacer(inicial(), escribir('press', 1, 'carga', '45'), escribir('press', 1, 'repeticiones', '9'), escribir('press', 1, 'rir', '3'), escribir('press', 2, 'repeticiones', '10')));
  const pedido = c.pedidoDeCorreccion(e, ORIGINAL);
  assert.equal(pedido.ok, true, pedido.mensaje);
  const press = pedido.correction.exercises.find((x) => x.prescriptionId === 'press');
  assert.equal(press.performedExerciseVersionId, 'ev-press');
  assert.deepEqual(press.sets, [
    { setIndex: 1, load: { value: 45, unit: 'kg' }, completedRepetitions: 9, rir: 3, perceivedExertion: null, recordedAs: 'TYPED' },
    { setIndex: 2, load: null, completedRepetitions: 10, rir: null, perceivedExertion: null, recordedAs: 'TYPED' },
  ]);
  // La serie 3 de Press y la 3 de Sentadilla quedaron vacías: no se fabrican.
  assert.deepEqual(pedido.correction.exercises.find((x) => x.prescriptionId === 'sentadilla').sets.map((s) => s.setIndex), [1, 2]);
  assert.deepEqual(pasaElContrato(pedido), []);
  assert.equal(c.hayAlgoSinGuardar(e, inicial()), true);
});

test('4 · lo que no se toca conserva cómo se cargó, el esfuerzo y la duración; lo reescrito va TYPED y conserva la duración', () => {
  // «58» reescrito como «58,0» dice lo mismo: no es un cambio.
  const igual = c.construirCorreccion(hacer(inicial(), escribir('sentadilla', 1, 'carga', '58,0')));
  assert.deepEqual(igual.correction.exercises[0].sets, ORIGINAL.exercises[0].sets);
  const e = hacer(inicial(), escribir('sentadilla', 1, 'carga', '60'), escribir('sentadilla', 2, 'repeticiones', '5'));
  const [s1, s2] = c.construirCorreccion(e).correction.exercises[0].sets;
  assert.deepEqual(s1, { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: null, perceivedExertion: 7, recordedAs: 'TYPED', durationSeconds: 40 });
  // La 2 estaba «como lo planificado»; al reescribirla pasa a escrita, y no tenía duración: no se inventa.
  assert.deepEqual(s2, { setIndex: 2, load: { value: 55, unit: 'kg' }, completedRepetitions: 5, rir: null, perceivedExertion: null, recordedAs: 'TYPED' });
  // Sin tocar la 2, conserva su AS_PLANNED.
  const soloLa1 = c.construirCorreccion(hacer(inicial(), escribir('sentadilla', 1, 'carga', '60'))).correction.exercises[0].sets;
  assert.equal(soloLa1[1].recordedAs, 'AS_PLANNED');
  // Cambiar la unidad del ejercicio cambia la carga registrada: es un cambio, y va escrita.
  const enLibras = c.construirCorreccion(hacer(inicial(), { tipo: 'unidad', prescriptionId: 'sentadilla', unidad: 'lb' })).correction.exercises[0].sets;
  assert.deepEqual(enLibras.map((s) => [s.load.unit, s.recordedAs]), [['lb', 'TYPED'], ['lb', 'TYPED']]);
});

// ─── 5 y 6 ───────────────────────────────────────────────────────────────────────────────────────

test('5 · quitar una serie no renumera las demás, «Deshacer» la devuelve, y un ejercicio sin series no viaja', () => {
  const quitada = hacer(inicial(), { tipo: 'quitar', prescriptionId: 'sentadilla', setIndex: 1 });
  assert.deepEqual(c.construirCorreccion(quitada).correction.exercises[0].sets.map((s) => s.setIndex), [2]);
  assert.deepEqual(c.cambiosDelEstado(quitada, ORIGINAL, nombreDe), ['Sentadilla · serie 1: se quita (58 kg · 8 reps)']);
  const devuelta = c.corregir(quitada, { tipo: 'deshacer', prescriptionId: 'sentadilla', setIndex: 1 });
  assert.equal(c.canonico(c.construirCorreccion(devuelta).correction), c.canonico(c.registroComoEntrada(ORIGINAL)));
  // Sin ninguna serie de Sentadilla y con una de Press, Sentadilla no viaja.
  const otra = hacer(inicial(), { tipo: 'quitar', prescriptionId: 'sentadilla', setIndex: 1 }, { tipo: 'quitar', prescriptionId: 'sentadilla', setIndex: 2 }, escribir('press', 1, 'repeticiones', '10'));
  assert.deepEqual(c.construirCorreccion(otra).correction.exercises.map((x) => x.prescriptionId), ['press']);
  // Sin ninguna serie en toda la sesión realizada, no se registra.
  const vacia = hacer(inicial(), { tipo: 'quitar', prescriptionId: 'sentadilla', setIndex: 1 }, { tipo: 'quitar', prescriptionId: 'sentadilla', setIndex: 2 });
  assert.deepEqual([c.construirCorreccion(vacia).ok, c.construirCorreccion(vacia).mensaje], [false, c.TEXTOS_DE_LA_CORRECCION.sinNingunaSerie]);
  // «Agregar una serie» suma la siguiente, nueva y sin objetivo.
  const conOtra = c.corregir(inicial(), { tipo: 'agregar', prescriptionId: 'sentadilla' });
  assert.deepEqual(conOtra.ejercicios[0].filas.at(-1), { setIndex: 4, origen: 'nueva', escrita: { carga: '', repeticiones: '', rir: '' }, unidad: 'kg', quitada: false, antes: null, objetivo: null });
});

test('6 · una registrada vaciada es un error en su fila; los números se leen con las reglas del registro', () => {
  const vaciada = c.construirCorreccion(hacer(inicial(), escribir('sentadilla', 2, 'carga', ''), escribir('sentadilla', 2, 'repeticiones', '')));
  assert.equal(vaciada.ok, false);
  assert.deepEqual(vaciada.errores.get(c.claveDeFila('sentadilla', 2)), { fila: 'Anotá la carga o las repeticiones de la serie 2, o quitala.' });
  const decimales = c.construirCorreccion(hacer(inicial(), escribir('press', 1, 'repeticiones', '8,5')));
  assert.deepEqual(decimales.errores.get(c.claveDeFila('press', 1)), { repeticiones: 'Las repeticiones van sin decimales.' });
  const negativa = c.construirCorreccion(hacer(inicial(), escribir('press', 1, 'carga', '-5')));
  assert.equal(negativa.errores.get(c.claveDeFila('press', 1)).carga, 'La carga no puede ser negativa.');
  const media = c.construirCorreccion(hacer(inicial(), escribir('press', 1, 'carga', '52,5'), escribir('press', 1, 'repeticiones', '6')));
  assert.deepEqual(media.correction.exercises[1].sets[0].load, { value: 52.5, unit: 'kg' });
  assert.equal(c.paraEditar(52.5), '52,5');
});

// ─── 7 y 8 ───────────────────────────────────────────────────────────────────────────────────────

test('7 · «No pude realizarla» queda sin series ni resumen; desde ahí se cargan las series o se cuenta cómo fue', () => {
  const no = conMotivo(c.corregir(inicial(), { tipo: 'condicion', condicion: 'NOT_COMPLETED' }));
  const pedido = c.pedidoDeCorreccion(no, ORIGINAL);
  assert.deepEqual(pedido.correction, { granularity: null, sessionCondition: 'NOT_COMPLETED', reason: null, exercises: [], sessionSummary: null });
  assert.deepEqual(pasaElContrato(pedido), []);
  assert.deepEqual(c.cambiosDelEstado(no, ORIGINAL, nombreDe)[0], 'Cómo resultó: Realizada → No pude realizarla');

  const NO_REALIZADA = { granularity: null, sessionCondition: 'NOT_COMPLETED', reason: 'Me dolía la rodilla', exercises: [], sessionSummary: null };
  const desdeNo = c.estadoInicial({ original: NO_REALIZADA, corrections: [], effectiveView: { kind: 'ORIGINAL' } }, SESION);
  assert.equal(desdeNo.sinDatosAntes, true);
  assert.deepEqual(desdeNo.ejercicios.map((ej) => ej.filas.length), [3, 3]);
  const conSeries = conMotivo(hacer(desdeNo, { tipo: 'condicion', condicion: 'COMPLETED' }, escribir('sentadilla', 1, 'repeticiones', '8')));
  const p1 = c.pedidoDeCorreccion(conSeries, NO_REALIZADA);
  assert.deepEqual([p1.correction.granularity, p1.correction.exercises.length, p1.correction.reason], ['SET', 1, 'Me dolía la rodilla']);
  assert.deepEqual(pasaElContrato(p1), []);
  const contado = conMotivo(hacer(desdeNo, { tipo: 'condicion', condicion: 'COMPLETED_WITH_DEVIATION' }, { tipo: 'resumen-de-sesion', texto: 'Hice media sesión' }));
  const p2 = c.pedidoDeCorreccion(contado, NO_REALIZADA);
  assert.deepEqual([p2.correction.granularity, p2.correction.sessionSummary], ['EXERCISE_OR_SESSION', { description: 'Hice media sesión' }]);
  assert.deepEqual(pasaElContrato(p2), []);
  const lasDos = c.construirCorreccion(hacer(contado, escribir('press', 1, 'repeticiones', '10')));
  assert.deepEqual([lasDos.ok, lasDos.mensaje], [false, c.TEXTOS_DE_LA_CORRECCION.seriesYResumen]);
});

test('8 · el orden: primero lo que rige, en su orden, y después lo sumado, en el orden de la sesión', () => {
  // Lo que rige tiene Press antes que Sentadilla (se registró así): la corrección conserva ese orden.
  const alReves = { ...ORIGINAL, exercises: [ejercicio('press', 'Press de banca', [serie(1, 45, 10)]), ...ORIGINAL.exercises] };
  const e = c.estadoInicial({ original: alReves, corrections: [], effectiveView: { kind: 'ORIGINAL' } }, SESION);
  assert.deepEqual(e.ejercicios.map((ej) => ej.prescriptionId), ['press', 'sentadilla']);
  assert.equal(c.canonico(c.construirCorreccion(e).correction), c.canonico(c.registroComoEntrada(alReves)));
  // Y una corrección vigente manda sobre el original.
  const corregida = { original: ORIGINAL, corrections: [{ correctionId: 'k1', correction: alReves }], effectiveView: { kind: 'CORRECTED', correctionId: 'k1' } };
  assert.deepEqual(c.estadoInicial(corregida, SESION).ejercicios.map((ej) => ej.filas.filter((f) => f.origen === 'registrada').length), [1, 2]);
  assert.equal(c.cambioLoQueRige(EJECUCION, corregida), true);
  assert.equal(c.cambioLoQueRige(EJECUCION, EJECUCION), false);
});

// ─── 9 a 11 ──────────────────────────────────────────────────────────────────────────────────────

test('9 · el motivo se elige de un toque, u otro se escribe; sin motivo no se registra', () => {
  const cambiado = hacer(inicial(), escribir('sentadilla', 1, 'carga', '60'));
  assert.deepEqual([c.pedidoDeCorreccion(cambiado, ORIGINAL).ok, c.pedidoDeCorreccion(cambiado, ORIGINAL).mensaje], [false, c.TEXTOS_DE_LA_CORRECCION.faltaElMotivo]);
  assert.equal(c.pedidoDeCorreccion(c.corregir(cambiado, { tipo: 'motivo', motivo: 'otro-numero' }), ORIGINAL).reason, 'Anoté un número distinto');
  const otro = c.corregir(cambiado, { tipo: 'motivo', motivo: 'otro' });
  assert.equal(c.pedidoDeCorreccion(otro, ORIGINAL).ok, false, 'con «Otro motivo» hay que escribirlo');
  assert.equal(c.pedidoDeCorreccion(c.corregir(otro, { tipo: 'otro-motivo', texto: '  La balanza marcaba mal  ' }), ORIGINAL).reason, 'La balanza marcaba mal');
});

test('10 · los cambios se dicen en frases, y el resumen de un ejercicio se corrige sin inventar series', () => {
  const e = hacer(inicial(), escribir('sentadilla', 1, 'carga', '60'), escribir('press', 2, 'carga', '45'), escribir('press', 2, 'repeticiones', '9'), { tipo: 'condicion', condicion: 'COMPLETED_WITH_DEVIATION' }, { tipo: 'comentario', texto: 'Cambié el orden' });
  assert.deepEqual(c.cambiosDelEstado(e, ORIGINAL, nombreDe), [
    'Cómo resultó: Realizada → Realizada con desvío',
    'Comentario de la sesión: «Cambié el orden»',
    'Sentadilla · serie 1: 58 kg · 8 reps → 60 kg · 8 reps',
    'Press de banca · serie 2: se suma (45 kg · 9 reps)',
  ]);
  assert.equal(c.TEXTOS_DE_LA_CORRECCION.cambios(4), '4 cambios');
  // Un registro por resumen: se corrige el resumen; vaciarlo lo quita, y sin nada no se registra.
  const RESUMIDO = { granularity: 'EXERCISE_OR_SESSION', sessionCondition: 'COMPLETED', reason: null, exercises: [{ ...ejercicio('sentadilla', 'Sentadilla', null), executionSummary: { description: 'Tres series' } }], sessionSummary: null };
  const r = c.estadoInicial({ original: RESUMIDO, corrections: [], effectiveView: { kind: 'ORIGINAL' } }, SESION);
  assert.deepEqual(r.ejercicios.map((ej) => [ej.prescriptionId, ej.resumen, ej.filas.length]), [['sentadilla', 'Tres series', 0], ['press', '', 0]]);
  assert.equal(c.canonico(c.construirCorreccion(r).correction), c.canonico(c.registroComoEntrada(RESUMIDO)));
  const conPress = conMotivo(c.corregir(r, { tipo: 'resumen', prescriptionId: 'press', texto: 'Dos series livianas' }));
  const p = c.pedidoDeCorreccion(conPress, RESUMIDO);
  assert.deepEqual(p.correction.exercises.map((x) => x.prescriptionId), ['sentadilla', 'press']);
  assert.deepEqual(pasaElContrato(p), []);
  assert.deepEqual(c.cambiosDelEstado(conPress, RESUMIDO, nombreDe), ['Press de banca: se suma un resumen']);
  const sinNada = c.corregir(r, { tipo: 'resumen', prescriptionId: 'sentadilla', texto: ' ' });
  assert.deepEqual([c.construirCorreccion(sinNada).ok, c.construirCorreccion(sinNada).mensaje], [false, c.TEXTOS_DE_LA_CORRECCION.sinNada]);
});

test('11 · T13: los textos de la corrección no califican', () => {
  const textos = [];
  const juntar = (v) => {
    if (typeof v === 'string') textos.push(v);
    else if (typeof v === 'function') textos.push(String(v(2, 3)));
    else if (v && typeof v === 'object') Object.values(v).forEach(juntar);
  };
  juntar(c.TEXTOS_DE_LA_CORRECCION);
  c.CONDICIONES.forEach((o) => textos.push(o.texto));
  const hallazgos = textos.flatMap((t) => terminosProhibidosDeEntrenamientoEn(t).map((p) => `«${p}» en ${JSON.stringify(t)}`));
  assert.deepEqual(hallazgos, []);
  // Ninguno juzga ni nombra la ausencia como «No realizada».
  assert.deepEqual(textos.filter((t) => /\b(bien|mal|excelente|cumpli)|no realizad/i.test(t)), []);
});

test('12 · lo que dibuja cada fila: igual, cambiada, quitada, sumada o vacía; sus errores en una frase; tabla o tarjetas', () => {
  const e = hacer(inicial(), escribir('sentadilla', 1, 'carga', '60'), { tipo: 'quitar', prescriptionId: 'sentadilla', setIndex: 2 }, escribir('press', 1, 'repeticiones', '10'));
  const [sentadilla, press] = e.ejercicios;
  assert.deepEqual(sentadilla.filas.map(c.estadoDeLaFila), ['cambiada', 'quitada', 'vacia']);
  assert.deepEqual(press.filas.map(c.estadoDeLaFila), ['sumada', 'vacia', 'vacia']);
  assert.deepEqual(inicial().ejercicios[0].filas.map(c.estadoDeLaFila), ['igual', 'igual', 'vacia']);
  assert.equal(c.textoDeLosErrores({ repeticiones: 'Las repeticiones van sin decimales.' }), 'Repeticiones: Las repeticiones van sin decimales.');
  assert.equal(c.textoDeLosErrores(undefined), null);
  // Un teléfono de 360 dp deja unos 294 dp dentro de la tarjeta: entra la tabla; con la letra grande, tarjetas.
  assert.equal(c.disposicionDeLaCorreccion(294, 1), 'tabla');
  assert.equal(c.disposicionDeLaCorreccion(294, 1.3), 'tarjetas');
  assert.equal(c.disposicionDeLaCorreccion(400, 1.7), 'tarjetas');
});
