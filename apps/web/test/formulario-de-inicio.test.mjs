/**
 * WP-FORMULARIOS-DE-INICIO (DL-164) · la lógica pura de «Pedir información» con tipos nuevos y de «Cargar con la
 * persona» (`apps/web/src/app/pro/advisees/forms/formulario-de-inicio.ts`), sin React:
 *  1. lo que viene marcado al pedir (todas pedidas; requeridas las que la plantilla sugiere), también desde Entrenamiento
 *     (DL-165 D-29, con la tabla de los días y su tope), el pedido desde Nutrición y el «para qué» sugerido (FR-02);
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
const {
  camposEnOrden,
  CODIGO_DE_NUMERO_FUERA_DE_LIMITES,
  CODIGO_DE_PROBLEMA_V2,
  CONTEXTO_DE_ENTRENAMIENTO,
  CONTEXTO_DE_NUTRICION,
  COPY_FORMULARIOS,
  COPY_HABITOS,
  MENSAJE_DE_PROBLEMA_V2,
  PLANTILLA_ENTRENAMIENTO_V4,
  validarRespuestasV2,
} = await import('@be/domain');

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

test('pedir · DL-165 D-29: desde Entrenamiento, «Antes de entrenar» llega completo, como desde «Más», y el tope de los días actúa', () => {
  // Ya no hay una precarga aparte de seis preguntas: llegando desde el área se marca lo mismo que al elegirlo en «Más».
  assert.equal('precargaDeEntrenamiento' in m, false);
  const secciones = PLANTILLA_ENTRENAMIENTO_V4.sections;
  const marcado = m.marcadoPorOmision(secciones);
  // Todas pedidas, salvo el embarazo, que la plantilla no trae pedido (D-4): el profesional lo suma cuando corresponde.
  assert.deepEqual(camposEnOrden(secciones).filter((c) => !marcado.pedidas.includes(c.fieldCode)).map((c) => c.fieldCode), ['trn_embarazo']);
  // Las seis de DL-100 siguen adentro, y también la tabla «¿Qué días y en qué momento podés?», que antes no venía.
  for (const codigo of [...CONTEXTO_DE_ENTRENAMIENTO.campos, 'trn_dias_y_horario']) assert.ok(marcado.pedidas.includes(codigo), codigo);
  // Requeridas, las 18 que sugiere la plantilla (D-21): la tabla y los días por semana, sí; las preferencias, no.
  assert.equal(marcado.requeridas.length, 18);
  for (const codigo of ['trn_dias_y_horario', 'trn_dias_por_semana']) assert.ok(marcado.requeridas.includes(codigo), codigo);
  assert.equal(marcado.requeridas.includes('trn_preferencias'), false);

  // El porqué (D-5): con la tabla pedida, «días por semana» no pasa de los días marcados en ella.
  const tresDias = r('trn_dias_y_horario', { type: 'MATRIX', cells: [{ row: 'lun', column: 'manana' }, { row: 'mie', column: 'tarde' }, { row: 'vie', column: 'noche' }, { row: 'dom', column: 'no_puedo' }] });
  const cinco = r('trn_dias_por_semana', { type: 'NUMBER', number: 5, unit: null });
  const completo = { requestedFieldCodes: marcado.pedidas, requiredFieldCodes: marcado.requeridas };
  assert.deepEqual(
    validarRespuestasV2(secciones, completo, [tresDias, cinco])
      .filter((p) => p.code !== CODIGO_DE_PROBLEMA_V2.REQUIRED)
      .map((p) => [p.fieldCode, p.code]),
    [['trn_dias_por_semana', CODIGO_DE_PROBLEMA_V2.MORE_THAN_MARKED]],
  );
  // Con las seis de antes, la persona no veía la tabla, y el número no tenía tope.
  const deSeis = { requestedFieldCodes: [...CONTEXTO_DE_ENTRENAMIENTO.campos], requiredFieldCodes: [] };
  assert.deepEqual(validarRespuestasV2(secciones, deSeis, [cinco]), []);

  // Lo que sí precarga el área: el formulario y el área, desde el Resumen y desde el Plan, y su «para qué».
  for (const origen of ['entrenamiento', 'entrenamiento-plan']) assert.deepEqual(m.PRECARGA_DEL_ORIGEN[origen], { plantilla: PLANTILLA_ENTRENAMIENTO_V4.clave, area: 'ENTRENAMIENTO' }, origen);
  assert.equal(m.propositoAlElegir('', null, PLANTILLA_ENTRENAMIENTO_V4.clave).proposito, COPY_FORMULARIOS.propositoDeContextoDeEntrenamiento);
});

test('pedir · FR-02: desde Nutrición se llega con «Cómo comés hoy» y su área, y se vuelve a su Resumen', () => {
  assert.equal(m.origenDelPedido('nutricion'), 'nutricion');
  assert.equal(m.origenDelPedido('entrenamiento'), 'entrenamiento');
  assert.equal(m.origenDelPedido('entrenamiento-plan'), 'entrenamiento-plan');
  for (const otro of [null, '', 'ficha', 'https://otro.sitio']) assert.equal(m.origenDelPedido(otro), null, String(otro));
  assert.deepEqual(m.PRECARGA_DEL_ORIGEN.nutricion, { plantilla: CONTEXTO_DE_NUTRICION.clavePlantilla, area: 'NUTRICION' });
  assert.deepEqual(m.PRECARGA_DEL_ORIGEN.entrenamiento, { plantilla: CONTEXTO_DE_ENTRENAMIENTO.clavePlantilla, area: 'ENTRENAMIENTO' });

  // La dirección del botón del Resumen de Nutrición se lee de vuelta como un pedido desde Nutrición, con su formulario.
  const direccion = new URL(m.pedidoDesde('nutricion', 'ase/1'), 'https://be.local');
  assert.equal(direccion.pathname, '/pro/advisees/forms');
  assert.equal(direccion.searchParams.get('id'), 'ase/1');
  assert.equal(direccion.searchParams.get('vista'), 'pedir');
  assert.equal(direccion.searchParams.get('plantilla'), 'FRM-NUTRICION-INICIO');
  assert.equal(m.origenDelPedido(direccion.searchParams.get('volver')), 'nutricion');
  // La misma forma que el botón de Entrenamiento, que ya existía.
  assert.equal(m.pedidoDesde('entrenamiento', 'a1'), '/pro/advisees/forms?id=a1&vista=pedir&plantilla=FRM-ENTRENAMIENTO&volver=entrenamiento');

  assert.deepEqual(m.vueltaDelOrigen('nutricion', 'a1'), { ruta: '/pro/advisees/nutrition', href: '/pro/advisees/nutrition?id=a1&vista=resumen', texto: COPY_FORMULARIOS.volverANutricion });
  assert.deepEqual(m.vueltaDelOrigen('entrenamiento', 'a1'), { ruta: '/pro/advisees/training', href: '/pro/advisees/training?id=a1&vista=resumen', texto: COPY_FORMULARIOS.volverAEntrenamiento });
  assert.equal(m.vueltaDelOrigen('entrenamiento-plan', 'a1').href, '/pro/advisees/training?id=a1&vista=plan');
});

test('pedir · FR-02: al elegir un formulario se sugiere su «para qué» si el profesional no escribió uno, y lo suyo no se pisa', () => {
  const nutricion = COPY_FORMULARIOS.propositoDeContextoDeNutricion;
  const entrenamiento = COPY_FORMULARIOS.propositoDeContextoDeEntrenamiento;
  // Vacío: va el del formulario elegido, desde el área o desde «Más».
  assert.deepEqual(m.propositoAlElegir('', null, 'FRM-NUTRICION-INICIO'), { proposito: nutricion, sugerido: nutricion });
  assert.deepEqual(m.propositoAlElegir('  ', null, 'FRM-ENTRENAMIENTO'), { proposito: entrenamiento, sugerido: entrenamiento });
  // Cambia de formulario sin tocar el «para qué»: la sugerencia sigue al formulario elegido.
  assert.deepEqual(m.propositoAlElegir(nutricion, nutricion, 'FRM-ENTRENAMIENTO'), { proposito: entrenamiento, sugerido: entrenamiento });
  // Uno sin sugerencia deja vacío lo que era la sugerencia del anterior: no corresponde a este formulario.
  assert.deepEqual(m.propositoAlElegir(nutricion, nutricion, 'FRM-SALUD'), { proposito: '', sugerido: null });
  // DL-165, ronda 2.1: «Tus hábitos», aparte, sugiere el suyo, como al sumarlo a uno de área.
  const habitos = COPY_HABITOS.web.propositoDelFormulario;
  assert.deepEqual(m.propositoAlElegir(nutricion, nutricion, 'FRM-HABITOS'), { proposito: habitos, sugerido: habitos });
  assert.deepEqual(m.propositoAlElegir('', null, 'FRM-HABITOS'), { proposito: habitos, sugerido: habitos });
  // Lo que escribió el profesional no se pisa, ni sobre una sugerencia ni sin ella.
  assert.deepEqual(m.propositoAlElegir('Saber cómo come los fines de semana', nutricion, 'FRM-ENTRENAMIENTO'), { proposito: 'Saber cómo come los fines de semana', sugerido: nutricion });
  assert.deepEqual(m.propositoAlElegir('Armar tu plan de alimentación, de a poco', nutricion, 'FRM-NUTRICION-INICIO').proposito, 'Armar tu plan de alimentación, de a poco');
  assert.deepEqual(m.propositoAlElegir('Lo mío', null, 'FRM-NUTRICION-INICIO'), { proposito: 'Lo mío', sugerido: null });
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

test('cuerpo · un renglón sumado y dejado vacío no viaja (igual que la APK); una lista que queda sin renglones se retira', () => {
  const comida = { momento: 'almuerzo', que: 'Milanesa' };
  const respuestas = [
    r('nut_jornada', { type: 'CHOICE', option: 'en_casa', otherText: null }),
    r('nut_comidas_habituales', { type: 'LIST', items: [{}, comida, { que: '   ' }] }),
  ];
  assert.deepEqual(m.sinRenglonesVacios(respuestas), [respuestas[0], r('nut_comidas_habituales', { type: 'LIST', items: [comida] })], 'un renglón sin claves y uno con solo espacios se descartan');
  assert.deepEqual(m.respuestasParaEnviar(SECCIONES, respuestas), [respuestas[0], r('nut_comidas_habituales', { type: 'LIST', items: [comida] })]);
  assert.deepEqual(m.respuestasParaEnviar(SECCIONES, [r('nut_comidas_habituales', { type: 'LIST', items: [{}] })]), [], 'sin ningún renglón con algo, la lista no se envía');
  const sinCambios = [respuestas[0], r('nut_comidas_habituales', { type: 'LIST', items: [comida] })];
  assert.equal(m.sinRenglonesVacios(sinCambios), sinCambios, 'si no hay nada que sacar, es el mismo arreglo');
  assert.equal(m.revisarAntesDeEnviar(SECCIONES, SOLICITUD, m.sinRenglonesVacios(respuestas)).bloqueantes.length, 0, 'sin el renglón vacío, la revisión no frena');
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

test('DL-165 D-6 · un renglón con solo sus días elegidos (formato 3) está respondido; con la lista de días vacía, no; y se lee con las etiquetas', () => {
  const dias = [op('lun', 'Lunes'), op('jue', 'Jueves')];
  const otraActividad = { ...base, fieldCode: 'trn_otros_deportes', label: 'Contame cuáles', dataType: 'LIST', itemLabel: 'actividad', minItems: 1, maxItems: 4, itemFields: [{ code: 'cual', label: 'Cuál', required: true, dataType: 'TEXT', maxLength: 80 }, { code: 'que_dias', label: 'Qué días', required: true, dataType: 'MULTI_CHOICE', options: dias }] };
  const conDias = r('trn_otros_deportes', { type: 'LIST', items: [{ que_dias: ['lun'] }, { que_dias: [] }] });
  assert.deepEqual(m.sinRenglonesVacios([conDias]), [r('trn_otros_deportes', { type: 'LIST', items: [{ que_dias: ['lun'] }] })]);
  assert.deepEqual(m.lineasDeValor(otraActividad, { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun', 'jue'] }] }), ['Fútbol · Lunes, Jueves']);
  // El cuerpo que se manda deja los días en el orden de la pregunta, una vez cada uno.
  const secciones = [{ sectionCode: 'semana', title: 'Tu semana', intro: null, fields: [otraActividad] }];
  assert.deepEqual(m.respuestasParaEnviar(secciones, [r('trn_otros_deportes', { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['jue', 'lun', 'jue'] }] })]), [r('trn_otros_deportes', { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun', 'jue'] }] })]);
});

test('DL-165 D-5 · al cargar con la persona, pasar de los días marcados frena el envío en ese número', () => {
  const secciones = [
    {
      sectionCode: 'semana',
      title: 'Tu semana',
      intro: null,
      fields: [
        { ...base, fieldCode: 'dias', label: '¿Qué días podés?', dataType: 'MATRIX', rows: [op('lun', 'Lunes'), op('mar', 'Martes')], columns: [op('manana', 'Mañana'), op('no_puedo', 'No puedo')] },
        { ...base, fieldCode: 'por_semana', label: '¿Cuántos días?', dataType: 'NUMBER', unit: 'días', limits: { minimum: 1, maximum: 7, integer: true }, maxFromMatrix: { fieldCode: 'dias', exceptColumns: ['no_puedo'] } },
      ],
    },
  ];
  const solicitud = { requestedFieldCodes: ['dias', 'por_semana'], requiredFieldCodes: ['dias', 'por_semana'] };
  const respuestas = [r('dias', { type: 'MATRIX', cells: [{ row: 'lun', column: 'manana' }, { row: 'mar', column: 'no_puedo' }] }), r('por_semana', { type: 'NUMBER', number: 2, unit: 'días' })];
  const revision = m.revisarAntesDeEnviar(secciones, solicitud, respuestas);
  assert.deepEqual(revision.bloqueantes.map((p) => [p.code, p.fieldCode]), [[CODIGO_DE_PROBLEMA_V2.MORE_THAN_MARKED, 'por_semana']]);
  assert.deepEqual([...m.mensajesPorCampo(revision.bloqueantes).get('por_semana')], [MENSAJE_DE_PROBLEMA_V2[CODIGO_DE_PROBLEMA_V2.MORE_THAN_MARKED]]);
});

test('DL-165 D-4 · al pedir, la pregunta que la plantilla no trae pedida (el embarazo) viene sin marcar y tampoco obligatoria; las demás, como siempre', () => {
  const secciones = [
    {
      sectionCode: 'salud',
      title: 'Tu salud',
      intro: null,
      fields: [
        { ...base, fieldCode: 'trn_salud_corazon', label: '¿Corazón?', dataType: 'BOOLEAN', requiredByDefault: true },
        { ...base, fieldCode: 'trn_embarazo', label: '¿Embarazo?', dataType: 'CHOICE', options: [op('no'), op('si')], otherOptionCode: null, requiredByDefault: false, requestedByDefault: false },
        { ...base, fieldCode: 'fuma', label: '¿Fumás?', dataType: 'BOOLEAN' },
      ],
    },
  ];
  assert.deepEqual(m.marcadoPorOmision(secciones), { pedidas: ['trn_salud_corazon', 'fuma'], requeridas: ['trn_salud_corazon'] });
  assert.equal(m.noVienePedida(secciones[0].fields[1]), true);
  assert.equal(m.noVienePedida(secciones[0].fields[2]), false, 'sin la propiedad (formato 2), viene pedida');
  // Aunque la plantilla la sugiriera obligatoria, sin pedirla no puede ser obligatoria (REG-06-212).
  const raro = [{ ...secciones[0], fields: [{ ...secciones[0].fields[1], requiredByDefault: true }] }];
  assert.deepEqual(m.marcadoPorOmision(raro), { pedidas: [], requeridas: [] });
});
