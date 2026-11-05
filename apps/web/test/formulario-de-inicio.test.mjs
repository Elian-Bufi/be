/**
 * WP-FORMULARIOS-DE-INICIO (DL-164) · la lógica pura de «Pedir información» con tipos nuevos y de «Cargar con la
 * persona» (`apps/web/src/app/pro/advisees/forms/formulario-de-inicio.ts`), sin React:
 *  1. lo que viene marcado al pedir (todas pedidas; requeridas las que la plantilla sugiere) y la precarga de
 *     entrenamiento con los seis códigos de DL-100;
 *  2. cada tipo dicho en palabras con sus opciones, y la condición de una pregunta con las etiquetas, nunca los códigos;
 *  3. el estado del formulario: una respuesta por campo, en orden, y lo oculto por una condición se retira;
 *  4. la revisión antes de enviar: lo que la API rechazaría frena; un obligatorio sin responder se marca y no frena;
 *  5. los mensajes por campo (con el renglón de una lista), el cuerpo canónico y los problemas que devuelve la API.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const m = await import('../src/app/pro/advisees/forms/formulario-de-inicio.ts');
const { CODIGO_DE_NUMERO_FUERA_DE_LIMITES, CODIGO_DE_PROBLEMA_V2, CONTEXTO_DE_ENTRENAMIENTO, MENSAJE_DE_PROBLEMA_V2 } = await import('@be/domain');

// ─── Una versión con los nueve tipos y una condicional ──────────────────────────────────────────

const base = { category: 'HABITOS_Y_CONTEXTO', helpText: null, purpose: null, showIf: null, requiredByDefault: false };
const op = (code, label = code) => ({ code, label });
const CAMPOS = [
  { ...base, fieldCode: 'nut_jornada', label: '¿Cómo es tu jornada?', dataType: 'CHOICE', options: [op('en_casa', 'En casa'), op('fuera_de_casa', 'Fuera de casa'), op('no_trabaja', 'No trabajo ni estudio')], otherOptionCode: null, requiredByDefault: true },
  { ...base, fieldCode: 'nut_comida_en_jornada', label: '¿Cómo resolvés la comida?', dataType: 'MULTI_CHOICE', options: [op('vianda', 'Llevo vianda'), op('compro', 'Compro algo'), op('ninguna', 'Ninguna')], maxSelected: 2, exclusiveOptionCodes: ['ninguna'], otherOptionCode: null, showIf: { fieldCode: 'nut_jornada', anyOf: ['en_casa', 'fuera_de_casa'] } },
  { ...base, fieldCode: 'nut_alergias', label: '¿Tenés alguna alergia?', dataType: 'BOOLEAN', requiredByDefault: true },
  { ...base, fieldCode: 'nut_alergias_detalle', label: '¿A qué?', dataType: 'TEXT', multiline: true, maxLength: 300, showIf: { fieldCode: 'nut_alergias', anyOf: [true] }, requiredByDefault: true },
  { ...base, fieldCode: 'nut_agua', label: 'Vasos de agua por día', dataType: 'NUMBER', unit: 'vasos', limits: { minimum: 0, maximum: 30, integer: true } },
  {
    ...base,
    fieldCode: 'nut_comidas_habituales',
    label: 'Las comidas que más se repiten',
    dataType: 'LIST',
    itemLabel: 'comida',
    minItems: 1,
    maxItems: 5,
    itemFields: [
      { code: 'momento', label: 'Momento', required: true, dataType: 'CHOICE', options: [op('desayuno', 'Desayuno'), op('almuerzo', 'Almuerzo')] },
      { code: 'que', label: 'Qué comés', required: true, dataType: 'TEXT', maxLength: 200 },
    ],
  },
  { ...base, fieldCode: 'trn_tecnica', label: 'Técnica', dataType: 'MATRIX', rows: [op('sentadilla', 'Sentadilla'), op('dominada', 'Dominada')], columns: [op('sola', 'Sola'), op('ayuda', 'Con ayuda'), op('no', 'No la hago')] },
  { ...base, fieldCode: 'nut_alimentos_no', label: 'Alimentos que no', dataType: 'FOODS', suggestions: ['Leche', 'Berenjena', 'Cerdo'], reasons: [op('gusto', 'No me gusta'), op('cae_mal', 'Me cae mal')], maxItems: 20 },
  { ...base, fieldCode: 'nut_horarios', label: 'Horarios', dataType: 'TIMES', parts: [op('levanto', 'Me levanto'), op('acuesto', 'Me acuesto')] },
];
const SECCIONES = [
  { sectionCode: 'dia', title: 'Tu día', intro: null, fields: CAMPOS.slice(0, 5) },
  { sectionCode: 'semana', title: 'Tu semana', intro: 'Lo más importante.', fields: CAMPOS.slice(5) },
];
const TODOS = CAMPOS.map((c) => c.fieldCode);
const SOLICITUD = { requestedFieldCodes: TODOS, requiredFieldCodes: ['nut_jornada', 'nut_alergias', 'nut_alergias_detalle', 'nut_comidas_habituales'] };
const r = (fieldCode, answer) => ({ fieldCode, answer });

// ─── 1. Lo que viene marcado al pedir ───────────────────────────────────────────────────────────

test('pedir · vienen todas pedidas y, requeridas, solo las que la plantilla sugiere', () => {
  const marcado = m.marcadoPorOmision(SECCIONES);
  assert.deepEqual(marcado.pedidas, TODOS);
  assert.deepEqual(marcado.requeridas, ['nut_jornada', 'nut_alergias', 'nut_alergias_detalle']);
});

test('pedir · la precarga desde Entrenamiento toma los seis códigos de DL-100 solo si la versión los tiene', () => {
  const conTodos = m.precargaDeEntrenamiento([...CONTEXTO_DE_ENTRENAMIENTO.campos, 'trn_tecnica', 'trn_otro_deporte']);
  assert.deepEqual(conTodos.pedidas, CONTEXTO_DE_ENTRENAMIENTO.campos);
  assert.deepEqual(conTodos.requeridas, CONTEXTO_DE_ENTRENAMIENTO.requeridos);
  assert.equal(conTodos.pedidas.length, 6, 'FRM-ENTRENAMIENTO v2 reutiliza los seis códigos (DL-164 D-7)');
  const sinUno = m.precargaDeEntrenamiento(CONTEXTO_DE_ENTRENAMIENTO.campos.filter((c) => c !== 'trn_preferencias'));
  assert.equal(sinUno.pedidas.includes('trn_preferencias'), false, 'no se pide una pregunta que la versión no tiene');
  assert.deepEqual(sinUno.requeridas, CONTEXTO_DE_ENTRENAMIENTO.requeridos);
});

// ─── 2. En palabras ─────────────────────────────────────────────────────────────────────────────

test('responde con · cada tipo en palabras, con un resumen de sus opciones y nunca los códigos', () => {
  const por = Object.fromEntries(CAMPOS.map((c) => [c.fieldCode, m.respondeConV2(c)]));
  assert.equal(por.nut_jornada, 'Una opción · En casa, Fuera de casa, No trabajo ni estudio');
  assert.equal(por.nut_comida_en_jornada, 'Varias opciones · Llevo vianda, Compro algo, Ninguna');
  assert.equal(por.nut_alergias, 'Sí o no');
  assert.equal(por.nut_alergias_detalle, 'Texto');
  assert.equal(por.nut_agua, 'Número · vasos');
  assert.equal(por.nut_comidas_habituales, 'Lista · de 1 a 5 (comida) · Momento, Qué comés');
  assert.equal(por.trn_tecnica, 'Tabla · 2 filas · Sola, Con ayuda, No la hago');
  assert.equal(por.nut_alimentos_no, 'Alimentos · 3 sugeridos · con el motivo');
  assert.equal(por.nut_horarios, 'Horarios · Me levanto, Me acuesto');
  // Los códigos de la plantilla llevan guion bajo («en_casa», «cae_mal»); una etiqueta nunca.
  for (const texto of Object.values(por)) assert.doesNotMatch(texto, /_/, 'sin códigos: solo etiquetas');
  const muchas = { ...CAMPOS[0], options: Array.from({ length: 9 }, (_, i) => op(`o${i}`, `Opción ${i + 1}`)) };
  assert.equal(m.respondeConV2(muchas), 'Una opción · Opción 1, Opción 2, Opción 3, Opción 4, Opción 5, Opción 6… (9 opciones)');
});

test('condición · se dice con las etiquetas del campo del que depende; si no está, que depende de otra pregunta', () => {
  assert.equal(m.condicionEnPalabras(CAMPOS[0], CAMPOS), null);
  assert.equal(m.condicionEnPalabras(CAMPOS[1], CAMPOS), 'Solo si «¿Cómo es tu jornada?» es En casa o Fuera de casa.');
  assert.equal(m.condicionEnPalabras(CAMPOS[3], CAMPOS), 'Solo si «¿Tenés alguna alergia?» es Sí.');
  assert.equal(m.condicionEnPalabras(CAMPOS[3], CAMPOS.filter((c) => c.fieldCode !== 'nut_alergias')), 'Solo si responde otra pregunta.');
});

// ─── 3. El estado del formulario ────────────────────────────────────────────────────────────────

test('estado · una respuesta por campo, en el orden del formulario; null deja la pregunta sin responder', () => {
  let rs = m.conRespuesta(SECCIONES, [], 'nut_agua', { type: 'NUMBER', number: 8, unit: 'vasos' });
  rs = m.conRespuesta(SECCIONES, rs, 'nut_jornada', { type: 'CHOICE', option: 'en_casa', otherText: null });
  assert.deepEqual(rs.map((x) => x.fieldCode), ['nut_jornada', 'nut_agua'], 'en el orden del formulario, no en el que se respondió');
  rs = m.conRespuesta(SECCIONES, rs, 'nut_agua', { type: 'NUMBER', number: 9, unit: 'vasos' });
  assert.equal(m.respuestaDe(rs, 'nut_agua').number, 9, 'reemplaza, no duplica');
  rs = m.conRespuesta(SECCIONES, rs, 'nut_agua', null);
  assert.deepEqual(rs.map((x) => x.fieldCode), ['nut_jornada']);
  assert.equal(m.respuestaDe(rs, 'nut_agua'), undefined);
});

test('estado · cambiar la respuesta de la que depende una condicional retira lo que quedó oculto (DL-164 D-2)', () => {
  let rs = m.conRespuesta(SECCIONES, [], 'nut_alergias', { type: 'BOOLEAN', yes: true });
  rs = m.conRespuesta(SECCIONES, rs, 'nut_alergias_detalle', { type: 'TEXT', text: 'Maní' });
  assert.deepEqual(rs.map((x) => x.fieldCode), ['nut_alergias', 'nut_alergias_detalle']);
  rs = m.conRespuesta(SECCIONES, rs, 'nut_alergias', { type: 'BOOLEAN', yes: false });
  assert.deepEqual(rs.map((x) => x.fieldCode), ['nut_alergias'], 'el detalle ya no se ve: no se guarda');
});

test('varias opciones · la exclusiva va sola, elegir otra la saca, y el tope no se pasa', () => {
  const campo = CAMPOS[1];
  assert.deepEqual(m.alternarOpcionMultiple(campo, ['vianda'], 'ninguna'), ['ninguna']);
  assert.deepEqual(m.alternarOpcionMultiple(campo, ['ninguna'], 'vianda'), ['vianda']);
  assert.deepEqual(m.alternarOpcionMultiple(campo, ['vianda', 'compro'], 'vianda'), ['compro'], 'desmarcar siempre se puede');
  const sinTope = { ...campo, maxSelected: 1 };
  assert.deepEqual(m.alternarOpcionMultiple(sinTope, ['vianda'], 'compro'), ['vianda'], 'con el tope alcanzado no cambia nada');
});

// ─── 4. La revisión antes de enviar ─────────────────────────────────────────────────────────────

test('revisión · un obligatorio sin responder se marca pero no frena; lo que la API rechazaría sí frena', () => {
  const sinNada = m.revisarAntesDeEnviar(SECCIONES, SOLICITUD, []);
  assert.deepEqual(sinNada.bloqueantes, []);
  assert.deepEqual(sinNada.sinResponder, ['nut_jornada', 'nut_alergias', 'nut_comidas_habituales'], 'el detalle de alergias está oculto: no se exige');
  const conProblemas = m.revisarAntesDeEnviar(SECCIONES, SOLICITUD, [
    r('nut_jornada', { type: 'CHOICE', option: 'en_casa', otherText: null }),
    r('nut_agua', { type: 'NUMBER', number: NaN, unit: 'vasos' }),
    r('nut_comidas_habituales', { type: 'LIST', items: [{ momento: 'almuerzo', que: 'Milanesa' }, { que: 'Mate' }] }),
  ]);
  assert.deepEqual(
    conProblemas.bloqueantes.map((p) => [p.fieldCode, p.code]),
    [
      ['nut_agua', CODIGO_DE_PROBLEMA_V2.TYPE_MISMATCH],
      ['nut_comidas_habituales', CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_REQUIRED],
    ],
  );
  assert.ok(conProblemas.bloqueantes.every((p) => p.code !== CODIGO_DE_PROBLEMA_V2.REQUIRED), 'el obligatorio no está entre los bloqueantes');
  assert.deepEqual(conProblemas.sinResponder, ['nut_alergias']);
});

// ─── 5. Mensajes, cuerpo y problemas de la API ──────────────────────────────────────────────────

test('mensajes · por campo, con el renglón de la lista y sin repetir', () => {
  const problemas = [
    { code: CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_REQUIRED, path: 'answers[2].answer.items[1].momento', fieldCode: 'nut_comidas_habituales' },
    { code: CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_REQUIRED, path: 'answers[2].answer.items[1].que', fieldCode: 'nut_comidas_habituales' },
    { code: CODIGO_DE_PROBLEMA_V2.REPEATED_ITEM, path: 'answers[3].answer.foods[2].name', fieldCode: 'nut_alimentos_no' },
    { code: CODIGO_DE_NUMERO_FUERA_DE_LIMITES.ABOVE_MAXIMUM, path: 'answers[1].answer', fieldCode: 'nut_agua' },
  ];
  const mensajes = m.mensajesPorCampo(problemas);
  assert.deepEqual(mensajes.get('nut_comidas_habituales'), [`Renglón 2: ${MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_REQUIRED]}`]);
  assert.deepEqual(mensajes.get('nut_alimentos_no'), [`Alimento 3: ${MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.REPEATED_ITEM]}`]);
  assert.deepEqual(mensajes.get('nut_agua'), [MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_NUMERO_FUERA_DE_LIMITES.ABOVE_MAXIMUM]]);
  for (const textos of mensajes.values()) for (const t of textos) assert.doesNotMatch(t, /NaN|answers\[/, 'nunca repite el valor ni el path');
});

test('cuerpo · lo que se envía va en su forma canónica: textos sin bordes y opciones en el orden del campo', () => {
  const enviadas = m.respuestasParaEnviar(SECCIONES, [
    r('nut_comida_en_jornada', { type: 'MULTI_CHOICE', options: ['compro', 'vianda'], otherText: null }),
    r('nut_alergias_detalle', { type: 'TEXT', text: '  Maní  ' }),
  ]);
  assert.deepEqual(enviadas, [
    r('nut_comida_en_jornada', { type: 'MULTI_CHOICE', options: ['vianda', 'compro'], otherText: null }),
    r('nut_alergias_detalle', { type: 'TEXT', text: 'Maní' }),
  ]);
});

test('problemas de la API · con fieldCode se toma; sin él, se deduce del índice del path; lo que no se ubica se descarta', () => {
  const enviadas = [r('nut_jornada', { type: 'CHOICE', option: 'en_casa', otherText: null }), r('nut_agua', { type: 'NUMBER', number: 99, unit: 'vasos' })];
  const problemas = m.problemasDeLaApi(
    [
      { code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[1].answer', fieldCode: 'nut_agua' },
      { code: 'FORM_ANSWER_UNKNOWN_OPTION', path: 'answers[0].answer' },
      { code: 'INVALID_REQUEST', path: 'answers' },
    ],
    enviadas,
  );
  assert.deepEqual(problemas, [
    { code: 'FORM_ANSWER_ABOVE_MAXIMUM', path: 'answers[1].answer', fieldCode: 'nut_agua' },
    { code: 'FORM_ANSWER_UNKNOWN_OPTION', path: 'answers[0].answer', fieldCode: 'nut_jornada' },
  ]);
});

test('por sección · se agrupa por la sección de la versión en el orden del formulario; lo ajeno va al final; un solo grupo no lleva título', () => {
  assert.deepEqual(m.porSeccion(SECCIONES, ['trn_tecnica', 'nut_agua', 'nut_jornada', 'x_vieja']), [
    { clave: 'dia', titulo: 'Tu día', codigos: ['nut_jornada', 'nut_agua'] },
    { clave: 'semana', titulo: 'Tu semana', codigos: ['trn_tecnica'] },
    { clave: 'sin-seccion', titulo: null, codigos: ['x_vieja'] },
  ]);
  assert.deepEqual(m.porSeccion(null, ['b', 'a']), [{ clave: 'sin-seccion', titulo: null, codigos: ['b', 'a'] }], 'sin la versión, un solo grupo en el orden dado');
  assert.deepEqual(m.porSeccion(SECCIONES, ['nut_agua', 'nut_jornada']), [{ clave: 'dia', titulo: null, codigos: ['nut_jornada', 'nut_agua'] }], 'con una sola sección el título sobra');
  assert.deepEqual(m.porSeccion(SECCIONES, []), []);
});

test('en renglones · una lista da un renglón por ítem, una tabla uno por fila y lo demás una línea, con etiquetas', () => {
  const porCampo = new Map(CAMPOS.map((c) => [c.fieldCode, c]));
  assert.deepEqual(m.lineasDeValor(porCampo.get('nut_comidas_habituales'), { type: 'LIST', items: [{ momento: 'almuerzo', que: 'Milanesa' }, { momento: 'desayuno', que: 'Café' }] }), ['Almuerzo · Milanesa', 'Desayuno · Café']);
  assert.deepEqual(m.lineasDeValor(porCampo.get('trn_tecnica'), { type: 'MATRIX', cells: [{ row: 'sentadilla', column: 'ayuda' }, { row: 'dominada', column: 'no' }] }), ['Sentadilla: Con ayuda', 'Dominada: No la hago']);
  assert.deepEqual(m.lineasDeValor(porCampo.get('nut_horarios'), { type: 'TIMES', times: [{ part: 'levanto', time: '07:00' }] }), ['Me levanto: 07:00']);
  assert.deepEqual(m.lineasDeValor(porCampo.get('nut_alimentos_no'), { type: 'FOODS', foods: [{ name: 'Leche', reason: 'cae_mal' }, { name: 'Cerdo', reason: null }] }), ['Leche (Me cae mal), Cerdo']);
  assert.deepEqual(m.lineasDeValor(porCampo.get('nut_agua'), { type: 'NUMBER', number: 2.5, unit: 'vasos' }), ['2,5 vasos']);
});
