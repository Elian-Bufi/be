/**
 * WP-FORMULARIOS-RONDA-2 (FR-10; DL-165 D-9) · «Sus hábitos» en el website del profesional
 * (`apps/web/src/app/pro/advisees/forms/sus-habitos.ts`), sin React:
 *  1. la tarjeta: desde cuándo los comparte, cuándo se actualizaron y de dónde (sin decir de qué formulario ni de qué
 *     área), y lo declarado en el orden de la parte; lo que no contó no se lista;
 *  2. «Cargar con la persona» pregunta por los hábitos (API-HBT-05) solo si la versión trae la parte, no hay nada cargado
 *     y no se tocó nada; y precarga solo lo que la Solicitud pide de la parte, con lo que la persona le comparte;
 *  3. sin autorización (el 404) o con cualquier falla, no hay nada que precargar;
 *  4. los textos no califican ni usan los términos prohibidos;
 *  5. ronda 2.1 (DL-165 D-15 nueva): «Cargar con la persona» precarga «Tus hábitos» aparte (FRM-HABITOS v2) como la parte
 *     de la ronda 2; las de área nuevas (v3 y v4) no la traen;
 *  6. ronda 2.1 (D-17 nueva; D-24): sin que se los comparta, la tarjeta lo dice y ofrece «Pedir acceso a sus hábitos», con
 *     su último pedido y desde cuándo puede volver a pedirlo; nunca qué respondió la persona.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const m = await import('../src/app/pro/advisees/forms/sus-habitos.ts');
const { lineasDeValor } = await import('../src/app/pro/advisees/forms/formulario-de-inicio.ts');
const {
  COPY_HABITOS,
  PLANTILLA_ENTRENAMIENTO_V3,
  PLANTILLA_ENTRENAMIENTO_V4,
  PLANTILLA_HABITOS_V2,
  PLANTILLA_NUTRICION_INICIO,
  PLANTILLA_NUTRICION_INICIO_V2,
  PLANTILLA_NUTRICION_INICIO_V3,
  SECCION_DE_HABITOS,
  terminosProhibidosDeFormulariosEn,
} = await import('@be/domain');

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

// ─── Ronda 2.1 ──────────────────────────────────────────────────────────────────────────────────

test('5 · «Tus hábitos» aparte se precarga como la parte de la ronda 2; «Cómo comés hoy» v3 y «Antes de entrenar» v4 no la traen', () => {
  const secciones = PLANTILLA_HABITOS_V2.sections;
  assert.equal(m.preguntaPorLosHabitosAlCargar({ secciones, hayPropuesta: false, tocado: false }), true);
  const pideTodo = { requestedFieldCodes: secciones.flatMap((s) => s.fields.map((c) => c.fieldCode)) };
  assert.deepEqual(m.precargaAlCargar(secciones, pideTodo, compartidos([HORARIOS, SUENO, ESTRES]))?.respuestas.map((x) => x.fieldCode), ['habitos_horarios', 'horas_de_sueno', 'habitos_estres']);
  for (const p of [PLANTILLA_NUTRICION_INICIO_V3, PLANTILLA_ENTRENAMIENTO_V4]) {
    assert.equal(m.preguntaPorLosHabitosAlCargar({ secciones: p.sections, hayPropuesta: false, tocado: false }), false, `${p.clave} v${p.version}`);
  }
});

/** Lo que devuelve API-HBT-07. */
const sabe = (cambios = {}) => ({
  scopes: ['NUTRICION'],
  receives: false,
  sharedSince: null,
  latestSeenAt: null,
  pendingHabitsRequestSince: null,
  accessRequest: null,
  canRequestAccess: true,
  canRequestAccessFrom: null,
  ...cambios,
});
const pedido = (status, requestedAt = '2026-11-02T10:00:00.000Z') => ({ accessRequestId: 'pa-1', scope: 'NUTRICION', status, requestedAt });

test('6 · sin que se los comparta: lo dice, ofrece pedir acceso y qué le llega; con un pedido, cuándo, y desde cuándo puede volver a pedir', () => {
  // Nunca pidió: «Pedir acceso a sus hábitos», con lo que le llega a la persona.
  assert.deepEqual(m.tarjetaSinAcceso(sabe(), fecha), { lineas: ['Por ahora no te comparte sus hábitos. Es su decisión.'], boton: 'Pedir acceso a sus hábitos', queLeLlega: H.queLeLlega });
  // Pendiente, hace menos de 7 días: sin botón, y desde cuándo puede volver a pedirlo.
  assert.deepEqual(m.tarjetaSinAcceso(sabe({ accessRequest: pedido('PENDING'), canRequestAccess: false, canRequestAccessFrom: '2026-11-09T10:00:00.000Z' }), fecha), {
    lineas: ['Por ahora no te comparte sus hábitos. Es su decisión.', 'Le pediste acceso el 2026-11-02. Lo decide la persona.', 'Podés volver a pedirlo desde el 2026-11-09.'],
    boton: null,
    queLeLlega: null,
  });
  // Pendiente, pasaron los 7 días: «Volver a pedir acceso» (el pedido nuevo reemplaza al pendiente).
  assert.equal(m.tarjetaSinAcceso(sabe({ accessRequest: pedido('PENDING', '2026-10-20T10:00:00.000Z') }), fecha)?.boton, 'Volver a pedir acceso');
  // Respondido: dice cuándo pidió, nunca qué respondió la persona.
  const respondido = m.tarjetaSinAcceso(sabe({ accessRequest: pedido('ANSWERED'), canRequestAccess: false, canRequestAccessFrom: '2026-11-09T10:00:00.000Z' }), fecha);
  assert.deepEqual(respondido?.lineas, ['Por ahora no te comparte sus hábitos. Es su decisión.', 'Le pediste acceso el 2026-11-02.', 'Podés volver a pedirlo desde el 2026-11-09.']);
  for (const l of respondido?.lineas ?? []) assert.doesNotMatch(l, /dijo que no|rechaz|no quiso|aceptó/i);
  // Si API-HBT-07 dice que los recibe (se cruzó con un cambio), no se dibuja nada a medias.
  assert.equal(m.tarjetaSinAcceso(sabe({ receives: true, sharedSince: '2026-11-05T12:00:00.000Z', canRequestAccess: false }), fecha), null);
});

test('6 · desde qué área sale el pedido: la de donde llegó si es suya; si no, la primera, y con más de una se dice cuál', () => {
  assert.deepEqual(m.areaDelPedidoDeAcceso(['NUTRICION'], null), { area: 'NUTRICION', aviso: null });
  assert.deepEqual(m.areaDelPedidoDeAcceso(['NUTRICION', 'ENTRENAMIENTO'], 'ENTRENAMIENTO'), { area: 'ENTRENAMIENTO', aviso: null });
  assert.deepEqual(m.areaDelPedidoDeAcceso(['NUTRICION', 'ENTRENAMIENTO'], null), { area: 'NUTRICION', aviso: 'Se lo pedís desde Nutrición.' });
  // Llegó desde un área que no es suya con esta persona: la primera de las suyas.
  assert.deepEqual(m.areaDelPedidoDeAcceso(['ENTRENAMIENTO'], 'NUTRICION'), { area: 'ENTRENAMIENTO', aviso: null });
});

test('6 · qué se hace con la respuesta de API-HBT-06', () => {
  assert.equal(m.trasPedirAcceso({ ok: true }), 'enviado');
  assert.equal(m.trasPedirAcceso({ ok: false, tipo: 'API', codigo: 'HABITS_ALREADY_SHARED' }), 'ya-los-comparte');
  assert.equal(m.trasPedirAcceso({ ok: false, tipo: 'API', codigo: 'HABITS_ACCESS_REQUEST_TOO_SOON' }), 'muy-pronto');
  assert.equal(m.trasPedirAcceso({ ok: false, tipo: 'API', codigo: 'RESOURCE_NOT_FOUND' }), 'sin-acceso');
  assert.equal(m.trasPedirAcceso({ ok: false, tipo: 'API', codigo: 'RATE_LIMITED' }), 'otro');
  assert.equal(m.trasPedirAcceso({ ok: false, tipo: 'RED' }), 'otro');
});

test('6 · los textos de «Pedir acceso» no presionan, no califican ni usan los términos prohibidos', () => {
  const textos = [H.noLosComparte, H.queLeLlega, H.pedirAcceso, H.volverAPedirAcceso, H.pidiendo, H.pedidoEnviado, H.pedidoPendiente('5 nov'), H.pedidoRespondido('5 nov'), H.volverAPedirDesde('12 nov'), H.yaLosComparte, H.pedidoDesdeElArea('Nutrición')];
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
    assert.doesNotMatch(t, /\bpx\b|cumplimiento|adherencia|recomendad|deberías|tenés que/i, t);
  }
  // Lo decide la persona, y se dice.
  assert.match(H.noLosComparte, /Es su decisión/);
  assert.match(H.queLeLlega, /que sí o que no/);
});
