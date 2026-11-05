/**
 * WP-FORMULARIOS-RONDA-2 (FR-10; DL-165 D-9) · «Sus hábitos» en el website del profesional
 * (`apps/web/src/app/pro/advisees/forms/sus-habitos.ts`), sin React:
 *  1. la tarjeta: desde cuándo los comparte, cuándo se actualizaron y de dónde (sin decir de qué formulario ni de qué
 *     área), y lo declarado en el orden de la parte; lo que no contó no se lista;
 *  2. «Cargar con la persona» pregunta por los hábitos (API-HBT-05) solo si la versión trae la parte, no hay nada cargado
 *     y no se tocó nada; y precarga solo lo que la Solicitud pide de la parte, con lo que la persona le comparte;
 *  3. sin autorización (el 404) o con cualquier falla, no hay nada que precargar;
 *  4. los textos no califican ni usan los términos prohibidos.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const m = await import('../src/app/pro/advisees/forms/sus-habitos.ts');
const { lineasDeValor } = await import('../src/app/pro/advisees/forms/formulario-de-inicio.ts');
const { COPY_HABITOS, PLANTILLA_ENTRENAMIENTO_V3, PLANTILLA_NUTRICION_INICIO, PLANTILLA_NUTRICION_INICIO_V2, SECCION_DE_HABITOS, terminosProhibidosDeFormulariosEn } = await import('@be/domain');

const H = COPY_HABITOS.web;
/** Una fecha legible y estable para las pruebas: el día del instante, tal cual. */
const fecha = (iso) => iso.slice(0, 10);
const r = (fieldCode, answer) => ({ fieldCode, answer, provenance: 'SELF_REPORTED' });

const HORARIOS = r('habitos_horarios', { type: 'TIMES', times: [{ part: 'semana_me_levanto', time: '07:00' }, { part: 'semana_me_acuesto', time: '23:30' }] });
const SUENO = r('horas_de_sueno', { type: 'NUMBER', number: 7.5, unit: 'h' });
const HACE_DEPORTE = r('habitos_hace_deporte', { type: 'BOOLEAN', yes: true });
const DEPORTES = r('habitos_deportes', {
  type: 'LIST',
  items: [
    { cual: 'Fútbol', que_dias: ['mar', 'jue'], momento: 'noche', minutos: 90, exigencia: 'exigente' },
    { cual: 'Caminar', que_dias: ['sab'], momento: 'manana', minutos: 40, exigencia: 'suave' },
  ],
});
const ESTRES = r('habitos_estres', { type: 'CHOICE', option: 'cargada', otherText: null });

/** Lo que devuelve API-HBT-05 con estas respuestas vigentes (o sin vigente). */
const compartidos = (answers, origin = 'FORM') => ({
  section: SECCION_DE_HABITOS,
  sharedSince: '2026-11-05T12:00:00.000Z',
  current: answers === null ? null : { answers, recordedAt: '2026-11-04T09:30:00.000Z', origin },
});

test('1 · la tarjeta: desde cuándo los comparte, cuándo se actualizaron y de dónde, y lo declarado en el orden de la parte', () => {
  // Llegan en otro orden y con una pregunta que la parte no tiene: van en el orden de la parte, y la desconocida no se muestra.
  const t = m.tarjetaDeSusHabitos(compartidos([ESTRES, SUENO, r('trn_estres', { type: 'CHOICE', option: 'normal', otherText: null }), HORARIOS]), fecha);
  assert.equal(t.compartido, H.compartidoEl('2026-11-05'));
  assert.equal(t.compartido, 'Compartido por la persona el 2026-11-05');
  assert.equal(t.actualizados, 'Actualizados el 2026-11-04, en un formulario.');
  assert.deepEqual(t.habitos.map((h) => h.codigo), ['habitos_horarios', 'horas_de_sueno', 'habitos_estres']);
  // La pregunta es la de la parte; lo que no contó (la actividad del día, el deporte) no se lista.
  assert.deepEqual(t.habitos.map((h) => h.pregunta), ['¿A qué hora te levantás y te acostás?', '¿Cuántas horas dormís habitualmente?', '¿Cómo viene tu semana, en estrés?']);
  // Desde «Mis hábitos», el origen se dice así; nunca de qué formulario ni de qué área.
  const desdeLaApp = m.tarjetaDeSusHabitos(compartidos([SUENO], 'MY_HABITS'), fecha);
  assert.equal(desdeLaApp.actualizados, 'Actualizados el 2026-11-04, en «Mis hábitos».');
  for (const texto of [t.compartido, t.actualizados, desdeLaApp.actualizados]) assert.doesNotMatch(texto, /Nutrición|Entrenamiento|Cómo comés|Antes de entrenar/);
});

test('1 · sin vigente, o sin nada contado, la tarjeta lo dice: no hay fecha de actualización ni preguntas', () => {
  for (const sinNada of [compartidos(null), compartidos([])]) {
    const t = m.tarjetaDeSusHabitos(sinNada, fecha);
    assert.equal(t.compartido, 'Compartido por la persona el 2026-11-05');
    assert.equal(t.actualizados, null);
    assert.deepEqual(t.habitos, []);
  }
  assert.equal(H.sinHabitos, 'Todavía no contó sus hábitos.');
});

test('1 · cada valor va en renglones con las etiquetas de la parte: una actividad por renglón, un horario por parte', () => {
  const t = m.tarjetaDeSusHabitos(compartidos([HORARIOS, SUENO, HACE_DEPORTE, DEPORTES]), fecha);
  const por = Object.fromEntries(t.habitos.map((h) => [h.codigo, lineasDeValor(h.campo, h.valor)]));
  assert.deepEqual(por.habitos_horarios, ['Entre semana · me levanto: 07:00', 'Entre semana · me acuesto: 23:30']);
  assert.deepEqual(por.horas_de_sueno, ['7,5 h']);
  assert.deepEqual(por.habitos_hace_deporte, ['Sí']);
  assert.equal(por.habitos_deportes.length, 2);
  assert.match(por.habitos_deportes[0], /^Fútbol · Martes, Jueves · Noche · 90 min · Exigente/);
  assert.match(por.habitos_deportes[1], /^Caminar · Sábado · Mañana · 40 min · Suave/);
  // Nunca un código a la vista.
  for (const lineas of Object.values(por)) for (const l of lineas) assert.doesNotMatch(l, /\b(semana_me_levanto|mar|jue|noche|exigente)\b/);
});

test('2 · «Cargar con la persona» pregunta por los hábitos solo con la parte en la versión, sin nada cargado y sin nada tocado', () => {
  const conLaParte = PLANTILLA_NUTRICION_INICIO_V2.sections;
  assert.equal(m.preguntaPorLosHabitosAlCargar({ secciones: conLaParte, hayPropuesta: false, tocado: false }), true);
  assert.equal(m.preguntaPorLosHabitosAlCargar({ secciones: PLANTILLA_ENTRENAMIENTO_V3.sections, hayPropuesta: false, tocado: false }), true);
  // Lo cargado se respeta y lo escrito no se pisa.
  assert.equal(m.preguntaPorLosHabitosAlCargar({ secciones: conLaParte, hayPropuesta: true, tocado: false }), false);
  assert.equal(m.preguntaPorLosHabitosAlCargar({ secciones: conLaParte, hayPropuesta: false, tocado: true }), false);
  // Una versión sin la parte (la v1 de «Cómo comés hoy», que lee la APK 0.20): ni se pregunta.
  assert.equal(m.preguntaPorLosHabitosAlCargar({ secciones: PLANTILLA_NUTRICION_INICIO.sections, hayPropuesta: false, tocado: false }), false);
});

test('2 · se precarga solo lo que la Solicitud pide de la parte, con lo que la persona le comparte, y cuándo lo declaró', () => {
  const secciones = PLANTILLA_NUTRICION_INICIO_V2.sections;
  const todo = compartidos([HORARIOS, SUENO, HACE_DEPORTE, DEPORTES, ESTRES]);
  // Pide la parte entera y otras preguntas del área: se precarga solo la parte.
  const pideTodo = { requestedFieldCodes: secciones.flatMap((s) => s.fields.map((c) => c.fieldCode)) };
  const completa = m.precargaAlCargar(secciones, pideTodo, todo);
  assert.deepEqual(completa?.respuestas.map((x) => x.fieldCode), ['habitos_horarios', 'horas_de_sueno', 'habitos_hace_deporte', 'habitos_deportes', 'habitos_estres']);
  assert.equal(completa?.declaradosEl, '2026-11-04T09:30:00.000Z');
  // Lo precargado no lleva la procedencia: es lo que se carga, y la persona lo confirma.
  assert.ok(completa?.respuestas.every((x) => !('provenance' in x)));
  // Pide solo dos de la parte: solo esas.
  const pocas = m.precargaAlCargar(secciones, { requestedFieldCodes: ['habitos_horarios', 'horas_de_sueno', 'nut_jornada'] }, todo);
  assert.deepEqual(pocas?.respuestas.map((x) => x.fieldCode), ['habitos_horarios', 'horas_de_sueno']);
  // Sin «¿Hacés ejercicio…?» pedido, la lista que depende de él no se ve: no se precarga.
  const sinLaPregunta = m.precargaAlCargar(secciones, { requestedFieldCodes: ['habitos_deportes', 'horas_de_sueno'] }, todo);
  assert.deepEqual(sinLaPregunta?.respuestas.map((x) => x.fieldCode), ['horas_de_sueno']);
  // Con «No» en el deporte, la lista vieja no se arrastra.
  const sinDeporte = m.precargaAlCargar(secciones, pideTodo, compartidos([r('habitos_hace_deporte', { type: 'BOOLEAN', yes: false }), DEPORTES]));
  assert.deepEqual(sinDeporte?.respuestas.map((x) => x.fieldCode), ['habitos_hace_deporte']);
});

test('3 · sin autorización (el 404) o con una falla, sin vigente o si la Solicitud no pide nada de lo que contó: nada que precargar', () => {
  const secciones = PLANTILLA_ENTRENAMIENTO_V3.sections;
  const pideTodo = { requestedFieldCodes: secciones.flatMap((s) => s.fields.map((c) => c.fieldCode)) };
  assert.equal(m.precargaAlCargar(secciones, pideTodo, null), null);
  assert.equal(m.precargaAlCargar(secciones, pideTodo, compartidos(null)), null);
  assert.equal(m.precargaAlCargar(secciones, { requestedFieldCodes: ['trn_experiencia', 'habitos_estres'] }, compartidos([SUENO])), null);
  // Una versión sin la parte no precarga nada aunque la persona se los comparta.
  assert.equal(m.precargaAlCargar(PLANTILLA_NUTRICION_INICIO.sections, { requestedFieldCodes: ['nut_horarios', 'nivel_de_actividad'] }, compartidos([HORARIOS, SUENO])), null);
});

test('4 · los textos del profesional no califican ni usan los términos prohibidos', () => {
  const textos = [H.titulo, H.declarado, H.compartidoEl('5 nov'), H.actualizadoEl('5 nov', 'FORM'), H.actualizadoEl('5 nov', 'MY_HABITS'), H.sinHabitos, H.noEsMedicion, H.precargados('5 nov')];
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
    assert.doesNotMatch(t, /\bpx\b|cumplimiento|adherencia/i, t);
  }
  assert.equal(H.precargados('5 nov'), 'Sus hábitos, como los compartió el 5 nov: preguntale si siguen igual.');
});
