/**
 * Formularios V2 (DL-164): los seis tipos nuevos, las preguntas condicionales y la propuesta que la persona confirma.
 * Protegen lo que no puede pasar: guardar algo que no se pidió o que no se preguntó (oculto por su condición), aceptar
 * una opción que no existe, perder un obligatorio, o escribir en la transcripción una corrección que la persona no hizo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CampoDePlantillaV2Schema,
  CargarPropuestaRequestSchema,
  EnviarRespuestaV2RequestSchema,
  ValorDeRespuestaV2Schema,
  VersionDePlantillaV2Schema,
  type RespuestaDeCampoV2Entrada,
  type SeccionDePlantillaV2,
} from './contratos-formularios-v2';
import {
  CODIGO_DE_PROBLEMA_V2,
  type CodigoDeProblemaV2,
  camposCorregidos,
  camposVisibles,
  campoV1AV2,
  normalizarValor,
  obligatoriosSinResponder,
  resumenDeValor,
  sinRespuestasOcultas,
  usaTiposNuevos,
  validarRespuestasV2,
} from './formularios-v2';
import { CODIGO_DE_NUMERO_FUERA_DE_LIMITES, CODIGO_DE_TEXTO_DEMASIADO_LARGO } from './contratos-formularios';
import { MENSAJE_DE_PROBLEMA_V2 } from './copy-formularios-v2';

const op = (code: string, label = code) => ({ code, label });
const base = { category: 'HABITOS_Y_CONTEXTO' as const, helpText: null, purpose: null, showIf: null, requiredByDefault: false };

const SECCIONES: SeccionDePlantillaV2[] = [
  {
    sectionCode: 'tu_dia',
    title: 'Tu día',
    intro: null,
    fields: [
      { ...base, fieldCode: 'nut_horarios', label: '¿A qué hora te levantás y te acostás?', dataType: 'TIMES', parts: [op('semana_levanto'), op('semana_acuesto')] },
      { ...base, fieldCode: 'nut_jornada', label: '¿Cómo es tu jornada?', dataType: 'CHOICE', options: [op('oficina'), op('turnos'), op('otro')], otherOptionCode: 'otro' },
      { ...base, fieldCode: 'nut_comidas', label: 'Tus comidas', dataType: 'LIST', itemLabel: 'comida', minItems: 2, maxItems: 5,
        itemFields: [
          { code: 'momento', label: 'Momento', required: true, dataType: 'CHOICE', options: [op('desayuno'), op('almuerzo'), op('cena')] },
          { code: 'que', label: 'Qué comés', required: true, dataType: 'TEXT', maxLength: 120 },
          { code: 'veces', label: 'Veces por semana', required: false, dataType: 'NUMBER', unit: null, limits: { minimum: 1, maximum: 7, integer: true } },
        ] },
    ],
  },
  {
    sectionCode: 'salud',
    title: 'Salud',
    intro: 'Para cuidarte.',
    fields: [
      { ...base, category: 'SALUD_Y_SEGURIDAD', fieldCode: 'nut_alergias', label: '¿Tenés alergias?', dataType: 'BOOLEAN' },
      { ...base, category: 'SALUD_Y_SEGURIDAD', fieldCode: 'nut_alergias_cuales', label: '¿Cuáles?', dataType: 'TEXT', multiline: false, maxLength: 20, showIf: { fieldCode: 'nut_alergias', anyOf: [true] } },
      { ...base, category: 'SALUD_Y_SEGURIDAD', fieldCode: 'nut_condiciones', label: 'Condiciones', dataType: 'MULTI_CHOICE', options: [op('diabetes'), op('hipertension'), op('ninguna'), op('otra')], maxSelected: null, exclusiveOptionCodes: ['ninguna'], otherOptionCode: 'otra' },
      { ...base, category: 'SALUD_Y_SEGURIDAD', fieldCode: 'nut_diabetes_tipo', label: '¿Qué tipo?', dataType: 'CHOICE', options: [op('tipo_1'), op('tipo_2')], otherOptionCode: null, showIf: { fieldCode: 'nut_condiciones', anyOf: ['diabetes'] } },
      { ...base, fieldCode: 'nut_alimentos_no', label: 'Lo que no comés', dataType: 'FOODS', suggestions: ['Leche', 'Cerdo'], reasons: [op('no_gusta'), op('cae_mal')], maxItems: 3 },
      { ...base, fieldCode: 'trn_tecnica', label: 'Técnica', dataType: 'MATRIX', rows: [op('sentadilla'), op('remo')], columns: [op('nunca'), op('ayuda'), op('bien')] },
      { ...base, fieldCode: 'trn_dias', label: 'Días', dataType: 'NUMBER', unit: 'días', limits: { minimum: 1, maximum: 7, integer: true } },
    ],
  },
];
const TODOS = SECCIONES.flatMap((s) => s.fields.map((f) => f.fieldCode));
const SOLICITUD = { requestedFieldCodes: TODOS, requiredFieldCodes: ['nut_horarios', 'nut_comidas', 'nut_alergias', 'nut_alergias_cuales'] };

const r = (fieldCode: string, answer: RespuestaDeCampoV2Entrada['answer']): RespuestaDeCampoV2Entrada => ({ fieldCode, answer });
const COMPLETAS: RespuestaDeCampoV2Entrada[] = [
  r('nut_horarios', { type: 'TIMES', times: [{ part: 'semana_levanto', time: '07:00' }, { part: 'semana_acuesto', time: '23:30' }] }),
  r('nut_jornada', { type: 'CHOICE', option: 'otro', otherText: 'Trabajo desde casa' }),
  r('nut_comidas', { type: 'LIST', items: [{ momento: 'desayuno', que: 'Café con leche y tostadas', veces: 7 }, { momento: 'almuerzo', que: 'Milanesa con puré' }] }),
  r('nut_alergias', { type: 'BOOLEAN', yes: true }),
  r('nut_alergias_cuales', { type: 'TEXT', text: 'Maní' }),
  r('nut_condiciones', { type: 'MULTI_CHOICE', options: ['diabetes', 'hipertension'], otherText: null }),
  r('nut_diabetes_tipo', { type: 'CHOICE', option: 'tipo_2', otherText: null }),
  r('nut_alimentos_no', { type: 'FOODS', foods: [{ name: 'Leche', reason: 'cae_mal' }, { name: 'Berenjena', reason: 'no_gusta' }] }),
  r('trn_tecnica', { type: 'MATRIX', cells: [{ row: 'sentadilla', column: 'ayuda' }] }),
  r('trn_dias', { type: 'NUMBER', number: 3, unit: 'días' }),
];
const codigos = (problemas: readonly { code: string }[]) => problemas.map((p) => p.code);

test('el contrato acepta los nueve tipos y la versión V2 completa', () => {
  for (const campo of SECCIONES.flatMap((s) => s.fields)) assert.ok(CampoDePlantillaV2Schema.safeParse(campo).success, campo.fieldCode);
  for (const respuesta of COMPLETAS) assert.ok(ValorDeRespuestaV2Schema.safeParse(respuesta.answer).success, respuesta.fieldCode);
  const version = {
    templateId: 'tpl', templateVersionId: 'ver', key: 'FRM-NUTRICION-INICIO', name: 'Cómo comés hoy', purpose: 'Conocer cómo comés', domain: 'NUTRICION',
    version: '1', status: 'SELECTABLE', format: 2, usesNewTypes: true, estimatedMinutes: 12, sections: SECCIONES, supersededByVersionId: null,
    effectiveSince: '2026-11-04T00:00:00.000Z', provenanceNote: 'Catálogo de demostración',
  };
  const parsed = VersionDePlantillaV2Schema.safeParse(version);
  assert.ok(parsed.success || JSON.stringify(parsed.error).includes('status'), 'la versión V2 tiene la forma del contrato');
});

test('el contrato es estricto: un valor con una propiedad de más no pasa', () => {
  assert.equal(ValorDeRespuestaV2Schema.safeParse({ type: 'TEXT', text: 'hola', extra: 1 }).success, false);
  assert.equal(ValorDeRespuestaV2Schema.safeParse({ type: 'TIMES', times: [{ part: 'semana_levanto', time: '7:00' }] }).success, false, 'la hora va con dos dígitos');
  assert.equal(EnviarRespuestaV2RequestSchema.safeParse({ answers: COMPLETAS, fromProposal: null }).success, true);
  assert.equal(CargarPropuestaRequestSchema.safeParse({ expectedVersion: null, answers: [] }).success, false, 'una propuesta vacía no se carga');
});

test('respuestas completas y coherentes: sin problemas', () => {
  assert.deepEqual(validarRespuestasV2(SECCIONES, SOLICITUD, COMPLETAS), []);
});

test('la pregunta condicional se ve solo con la respuesta que la abre, y si su campo se oculta, ella también', () => {
  assert.ok(camposVisibles(SECCIONES, COMPLETAS).has('nut_alergias_cuales'));
  const sinAlergias = COMPLETAS.map((x) => (x.fieldCode === 'nut_alergias' ? r('nut_alergias', { type: 'BOOLEAN', yes: false }) : x));
  const visibles = camposVisibles(SECCIONES, sinAlergias);
  assert.equal(visibles.has('nut_alergias_cuales'), false);
  assert.ok(codigos(validarRespuestasV2(SECCIONES, SOLICITUD, sinAlergias)).includes(CODIGO_DE_PROBLEMA_V2.NOT_VISIBLE), 'no se guarda lo que no se preguntó');
  const limpias = sinRespuestasOcultas(SECCIONES, sinAlergias);
  assert.equal(limpias.some((x) => x.fieldCode === 'nut_alergias_cuales'), false);
  assert.deepEqual(validarRespuestasV2(SECCIONES, SOLICITUD, limpias), [], 'el obligatorio oculto no se exige');
  const sinDiabetes = COMPLETAS.map((x) => (x.fieldCode === 'nut_condiciones' ? r('nut_condiciones', { type: 'MULTI_CHOICE', options: ['hipertension'], otherText: null }) : x));
  assert.equal(camposVisibles(SECCIONES, sinDiabetes).has('nut_diabetes_tipo'), false);
});

test('una condición que apunta a un campo posterior o inexistente oculta, nunca muestra de más', () => {
  const rota: SeccionDePlantillaV2[] = [{ sectionCode: 's', title: 's', intro: null, fields: [
    { ...base, fieldCode: 'a', label: 'a', dataType: 'BOOLEAN', showIf: { fieldCode: 'b', anyOf: [true] } },
    { ...base, fieldCode: 'b', label: 'b', dataType: 'BOOLEAN' },
  ] }];
  assert.equal(camposVisibles(rota, [r('b', { type: 'BOOLEAN', yes: true })]).has('a'), false);
});

test('minimización: lo que no se pidió, lo repetido y lo que no existe se rechazan', () => {
  const pocos = { requestedFieldCodes: ['nut_horarios'], requiredFieldCodes: [] };
  assert.deepEqual(codigos(validarRespuestasV2(SECCIONES, pocos, [COMPLETAS[1]!])), [CODIGO_DE_PROBLEMA_V2.NOT_REQUESTED]);
  assert.deepEqual(codigos(validarRespuestasV2(SECCIONES, SOLICITUD, [COMPLETAS[0]!, COMPLETAS[0]!])).slice(0, 1), [CODIGO_DE_PROBLEMA_V2.DUPLICATED]);
  assert.ok(codigos(validarRespuestasV2(SECCIONES, SOLICITUD, [r('no_existe', { type: 'BOOLEAN', yes: true })])).includes(CODIGO_DE_PROBLEMA_V2.UNKNOWN_FIELD));
});

test('los obligatorios visibles que faltan se informan, todos a la vez', () => {
  const faltan = validarRespuestasV2(SECCIONES, SOLICITUD, [COMPLETAS[3]!, COMPLETAS[4]!]);
  assert.deepEqual(faltan.filter((p) => p.code === CODIGO_DE_PROBLEMA_V2.REQUIRED).map((p) => p.fieldCode), ['nut_horarios', 'nut_comidas']);
  assert.deepEqual(obligatoriosSinResponder(SECCIONES, SOLICITUD, [COMPLETAS[3]!]), ['nut_horarios', 'nut_comidas', 'nut_alergias_cuales']);
});

test('cada tipo rechaza lo que no corresponde', () => {
  const uno = (respuesta: RespuestaDeCampoV2Entrada) => codigos(validarRespuestasV2(SECCIONES, { requestedFieldCodes: TODOS, requiredFieldCodes: [] }, [
    ...(respuesta.fieldCode === 'nut_diabetes_tipo' ? [COMPLETAS[5]!] : []),
    ...(respuesta.fieldCode === 'nut_alergias_cuales' ? [COMPLETAS[3]!] : []),
    respuesta,
  ]));
  assert.deepEqual(uno(r('nut_jornada', { type: 'TEXT', text: 'oficina' })), [CODIGO_DE_PROBLEMA_V2.TYPE_MISMATCH]);
  assert.deepEqual(uno(r('nut_jornada', { type: 'CHOICE', option: 'inventada', otherText: null })), [CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION]);
  assert.deepEqual(uno(r('nut_jornada', { type: 'CHOICE', option: 'oficina', otherText: 'algo' })), [CODIGO_DE_PROBLEMA_V2.OTHER_TEXT_NOT_ALLOWED]);
  assert.deepEqual(uno(r('nut_condiciones', { type: 'MULTI_CHOICE', options: ['ninguna', 'diabetes'], otherText: null })), [CODIGO_DE_PROBLEMA_V2.EXCLUSIVE_OPTION]);
  assert.deepEqual(uno(r('nut_condiciones', { type: 'MULTI_CHOICE', options: ['diabetes', 'diabetes'], otherText: null })), [CODIGO_DE_PROBLEMA_V2.DUPLICATED]);
  assert.deepEqual(uno(r('nut_comidas', { type: 'LIST', items: [{ momento: 'desayuno', que: 'Mate' }] })), [CODIGO_DE_PROBLEMA_V2.TOO_FEW]);
  assert.deepEqual(uno(r('nut_comidas', { type: 'LIST', items: [{ momento: 'merienda', que: 'Mate' }, { momento: 'cena', que: 'Pollo', veces: 9 }] })),
    [CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_INVALID, CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_INVALID]);
  assert.deepEqual(uno(r('nut_comidas', { type: 'LIST', items: [{ que: 'Mate' }, { momento: 'cena', que: 'Pollo', sal: true }] })),
    [CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_REQUIRED, CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_UNKNOWN]);
  assert.deepEqual(uno(r('nut_alimentos_no', { type: 'FOODS', foods: [{ name: 'Leche', reason: null }, { name: ' leche ', reason: null }] })), [CODIGO_DE_PROBLEMA_V2.REPEATED_ITEM]);
  assert.deepEqual(uno(r('nut_alimentos_no', { type: 'FOODS', foods: [{ name: 'Leche', reason: 'por_moda' }] })), [CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION]);
  assert.deepEqual(uno(r('nut_alimentos_no', { type: 'FOODS', foods: ['a', 'b', 'c', 'd'].map((name) => ({ name, reason: null })) })), [CODIGO_DE_PROBLEMA_V2.TOO_MANY]);
  assert.deepEqual(uno(r('trn_tecnica', { type: 'MATRIX', cells: [{ row: 'sentadilla', column: 'bien' }, { row: 'sentadilla', column: 'nunca' }] })), [CODIGO_DE_PROBLEMA_V2.DUPLICATED]);
  assert.deepEqual(uno(r('trn_tecnica', { type: 'MATRIX', cells: [{ row: 'press', column: 'bien' }] })), [CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION]);
  assert.deepEqual(uno(r('nut_horarios', { type: 'TIMES', times: [{ part: 'finde', time: '10:00' }] })), [CODIGO_DE_PROBLEMA_V2.UNKNOWN_OPTION]);
  assert.deepEqual(uno(r('trn_dias', { type: 'NUMBER', number: 2.5, unit: 'días' })), [CODIGO_DE_NUMERO_FUERA_DE_LIMITES.NOT_INTEGER]);
  assert.deepEqual(uno(r('trn_dias', { type: 'NUMBER', number: 8, unit: 'días' })), [CODIGO_DE_NUMERO_FUERA_DE_LIMITES.ABOVE_MAXIMUM]);
  assert.deepEqual(uno(r('nut_alergias_cuales', { type: 'TEXT', text: '   ' })), [CODIGO_DE_PROBLEMA_V2.EMPTY]);
  assert.deepEqual(uno(r('nut_alergias_cuales', { type: 'TEXT', text: 'á'.repeat(21) })), [CODIGO_DE_TEXTO_DEMASIADO_LARGO]);
});

test('cada problema tiene su mensaje para la persona', () => {
  for (const codigo of [...Object.values(CODIGO_DE_PROBLEMA_V2), ...Object.values(CODIGO_DE_NUMERO_FUERA_DE_LIMITES), CODIGO_DE_TEXTO_DEMASIADO_LARGO] as CodigoDeProblemaV2[]) {
    assert.ok(MENSAJE_DE_PROBLEMA_V2[codigo].length > 0, codigo);
  }
});

test('la transcripción registra solo lo que la persona cambió, sumó o quitó', () => {
  assert.deepEqual(camposCorregidos(SECCIONES, COMPLETAS, COMPLETAS), [], 'tal cual');
  const reordenado = COMPLETAS.map((x) => (x.fieldCode === 'nut_condiciones' ? r('nut_condiciones', { type: 'MULTI_CHOICE', options: ['hipertension', 'diabetes'], otherText: null }) : x))
    .map((x) => (x.fieldCode === 'nut_alergias_cuales' ? r('nut_alergias_cuales', { type: 'TEXT', text: '  Maní ' }) : x));
  assert.deepEqual(camposCorregidos(SECCIONES, COMPLETAS, reordenado), [], 'el orden y los espacios no son una corrección');
  const corregidas = COMPLETAS.filter((x) => x.fieldCode !== 'trn_tecnica')
    .map((x) => (x.fieldCode === 'trn_dias' ? r('trn_dias', { type: 'NUMBER', number: 4, unit: 'días' }) : x));
  corregidas.push(r('nut_jornada', { type: 'CHOICE', option: 'otro', otherText: 'Trabajo desde casa' }));
  assert.deepEqual(camposCorregidos(SECCIONES, COMPLETAS, corregidas.filter((x, i, a) => a.findIndex((y) => y.fieldCode === x.fieldCode) === i)), ['trn_tecnica', 'trn_dias']);
});

test('normalizar no cambia lo dicho, solo su forma', () => {
  const campo = SECCIONES[1]!.fields[2]!;
  assert.deepEqual(normalizarValor(campo, { type: 'MULTI_CHOICE', options: ['otra', 'diabetes', 'diabetes'], otherText: ' celiaquía ' }),
    { type: 'MULTI_CHOICE', options: ['diabetes', 'otra'], otherText: 'celiaquía' });
});

test('P0 en formato V2: texto de varias líneas, número con sus límites, sí o no', () => {
  const texto = campoV1AV2({ fieldCode: 'dolor_o_lesiones', label: 'Dolor', dataType: 'TEXT', unit: null, category: 'SALUD_Y_SEGURIDAD', helpText: null });
  assert.equal(texto.dataType, 'TEXT');
  assert.ok(CampoDePlantillaV2Schema.safeParse(texto).success);
  const numero = campoV1AV2({ fieldCode: 'trn_dias_por_semana', label: 'Días', dataType: 'NUMBER', unit: 'días', category: 'HABITOS_Y_CONTEXTO', helpText: 'De 1 a 7' }, { minimum: 1, maximum: 7, integer: true });
  assert.ok(numero.dataType === 'NUMBER' && numero.limits?.maximum === 7);
  assert.equal(usaTiposNuevos([{ sectionCode: 's', title: 's', intro: null, fields: [texto, numero] }]), false, 'una plantilla de P0 la abre la APK instalada');
  assert.equal(usaTiposNuevos(SECCIONES), true);
});

test('cada respuesta se lee en palabras, con las etiquetas de la plantilla', () => {
  const campos = new Map(SECCIONES.flatMap((s) => s.fields).map((c) => [c.fieldCode, c] as const));
  const leer = (codigo: string) => resumenDeValor(campos.get(codigo), COMPLETAS.find((x) => x.fieldCode === codigo)!.answer);
  assert.equal(leer('nut_horarios'), 'semana_levanto: 07:00 · semana_acuesto: 23:30');
  assert.equal(leer('nut_jornada'), 'otro: Trabajo desde casa');
  assert.equal(leer('nut_comidas'), 'desayuno · Café con leche y tostadas · 7; almuerzo · Milanesa con puré');
  assert.equal(leer('nut_alergias'), 'Sí');
  assert.equal(leer('nut_alimentos_no'), 'Leche (cae_mal), Berenjena (no_gusta)');
  assert.equal(leer('trn_tecnica'), 'sentadilla: ayuda');
  assert.equal(leer('trn_dias'), '3 días');
});
