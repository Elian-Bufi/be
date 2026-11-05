/**
 * WP-FORMULARIOS-RONDA-2 (DL-165): lo que cambió de los formularios de inicio después de la prueba de Dirección.
 * - FR-05 · las ayudas, plegadas (D-2) y sin los minutos (D-3): dónde va la ayuda de cada pregunta, cuándo se ofrece
 *   «Quitar respuesta» y que ningún texto diga los minutos ni califique a la persona.
 * - FR-03 y FR-04 · una parte por pantalla (D-1): qué partes tiene una solicitud, qué se ve en cada una, qué falta y
 *   adónde lleva un problema al enviar.
 * - FR-08 · el formato 3 (D-6): el subcampo de varias opciones en un renglón y el ejemplo de un subcampo de texto, cómo
 *   se validan, se normalizan y se leen, qué hace que una versión sea de formato 3, y por qué no se le puede entregar a la
 *   APK 0.20: su esquema congelado no lo lee (DL-152).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { CAPACIDAD_FORMULARIOS_FORMATO_3, CAPACIDAD_OBJETIVOS_POR_SERIE, capacidadesDeclaradas } from './compatibilidad-de-clientes';
import { SubcampoDeListaSchema, VersionDePlantillaV2Schema, type CampoDePlantillaV2, type RespuestaDeCampoV2Entrada, type SeccionDePlantillaV2 } from './contratos-formularios-v2';
import { terminosProhibidosDeFormulariosEn } from './copy-formularios';
import { COPY_FORMULARIOS_V2 } from './copy-formularios-v2';
import { ayudaDeLaPregunta, camposCorregidos, camposVisibles, CODIGO_DE_PROBLEMA_V2, loQueUsaDelFormato3, normalizarValor, resumenDeValor, seOfreceQuitarRespuesta, TIPOS_CON_QUITAR_RESPUESTA, usaLoDelFormato3, validarRespuestasV2 } from './formularios-v2';
import { obligatoriasSinResponderDeLaParte, partesDelFormulario, pasoAcotado, pasoDelRepaso, preguntasQueSeVen, primeraParteCon } from './partes-de-formulario';

const op = (code: string, label = code) => ({ code, label });
const base = { category: 'HABITOS_Y_CONTEXTO' as const, helpText: null, purpose: 'Para armar tu plan.', showIf: null, requiredByDefault: false };

/** Todos los textos de un copy: las cadenas tal cual y las funciones con un valor de ejemplo. */
function textosDe(copy: Readonly<Record<string, unknown>>): string[] {
  return Object.values(copy).flatMap((v) => {
    if (typeof v === 'string') return [v];
    if (typeof v === 'function') return [String((v as (...a: unknown[]) => unknown)('Prueba', 'Prueba', 'Prueba'))];
    if (v && typeof v === 'object') return textosDe(v as Record<string, unknown>);
    return [];
  });
}

// ─── FR-05 · D-2 y D-3 ──────────────────────────────────────────────────────────────────────────

test('DL-165 D-2 · en una respuesta de texto, la ayuda es el texto de muestra; en las demás, una línea a la vista', () => {
  const texto: CampoDePlantillaV2 = { ...base, fieldCode: 'nut_algo', label: '¿Algo más?', dataType: 'TEXT', multiline: true, maxLength: 300, helpText: 'Por ejemplo: el asado del domingo.' };
  assert.deepEqual(ayudaDeLaPregunta(texto), { aLaVista: null, deMuestra: 'Por ejemplo: el asado del domingo.' });
  const numero: CampoDePlantillaV2 = { ...base, fieldCode: 'trn_dias', label: '¿Cuántos días?', dataType: 'NUMBER', unit: 'días', limits: null, helpText: 'Un número entero entre 1 y 7.' };
  assert.deepEqual(ayudaDeLaPregunta(numero), { aLaVista: 'Un número entero entre 1 y 7.', deMuestra: null });
  const opcion: CampoDePlantillaV2 = { ...base, fieldCode: 'nut_objetivo', label: '¿Qué buscás?', dataType: 'MULTI_CHOICE', options: [op('a'), op('b')], maxSelected: 2, exclusiveOptionCodes: [], otherOptionCode: null, helpText: 'Elegí hasta dos.' };
  assert.deepEqual(ayudaDeLaPregunta(opcion), { aLaVista: 'Elegí hasta dos.', deMuestra: null });
  // Sin ayuda, o solo con espacios: no hay nada que mostrar.
  assert.deepEqual(ayudaDeLaPregunta({ dataType: 'TEXT', helpText: '   ' }), { aLaVista: null, deMuestra: null });
  assert.deepEqual(ayudaDeLaPregunta({ dataType: 'BOOLEAN', helpText: null }), { aLaVista: null, deMuestra: null });
});

test('DL-165 D-2 · «Quitar respuesta» va solo con algo elegido en una pregunta opcional, y solo donde se elige', () => {
  const solicitud = { requiredFieldCodes: ['nut_alergias'] };
  // Una opcional con algo elegido: sí. Sin nada elegido: no.
  assert.equal(seOfreceQuitarRespuesta({ fieldCode: 'nut_picoteo', dataType: 'CHOICE' }, solicitud, true), true);
  assert.equal(seOfreceQuitarRespuesta({ fieldCode: 'nut_picoteo', dataType: 'CHOICE' }, solicitud, false), false);
  // En una obligatoria no se ofrece: se cambia de opción.
  assert.equal(seOfreceQuitarRespuesta({ fieldCode: 'nut_alergias', dataType: 'BOOLEAN' }, solicitud, true), false);
  // Los cuatro tipos donde se elige; en un texto se borra lo escrito y en una lista se quita el renglón.
  assert.deepEqual([...TIPOS_CON_QUITAR_RESPUESTA], ['BOOLEAN', 'CHOICE', 'MULTI_CHOICE', 'MATRIX']);
  for (const dataType of ['TEXT', 'NUMBER', 'LIST', 'FOODS', 'TIMES'] as const) assert.equal(seOfreceQuitarRespuesta({ fieldCode: 'x', dataType }, solicitud, true), false, dataType);
});

test('DL-165 D-3 · ningún texto de los formularios V2 dice los minutos, y ninguno califica ni presenta la falta como incumplimiento', () => {
  assert.equal('minutos' in COPY_FORMULARIOS_V2, false);
  const textos = textosDe(COPY_FORMULARIOS_V2);
  assert.ok(textos.length > 40, `se leyeron ${textos.length} textos`);
  for (const t of textos) {
    assert.doesNotMatch(t, /minuto/i, t);
    assert.deepEqual(terminosProhibidosDeFormulariosEn(t), [], t);
  }
  // El botón y su nombre para el lector de pantalla dicen de qué pregunta son.
  assert.equal(COPY_FORMULARIOS_V2.paraQueBoton, '¿Para qué?');
  assert.equal(COPY_FORMULARIOS_V2.paraQueDe('¿Cuántas horas dormís?'), '¿Para qué? ¿Cuántas horas dormís?');
  assert.equal(COPY_FORMULARIOS_V2.quitarRespuestaDe('¿Picoteás?'), 'Quitar respuesta: ¿Picoteás?');
});

// ─── FR-03 y FR-04 · D-1 ────────────────────────────────────────────────────────────────────────

/** Cuatro secciones: la tercera solo tiene una pregunta que depende de otra, y la cuarta no se pide. */
const PARTES: SeccionDePlantillaV2[] = [
  {
    sectionCode: 'tu_dia',
    title: 'Tu día',
    intro: 'Para ubicar las comidas.',
    fields: [
      { ...base, fieldCode: 'jornada', label: '¿Cómo es tu jornada?', dataType: 'CHOICE', options: [op('casa'), op('afuera')], otherOptionCode: null },
      { ...base, fieldCode: 'vianda', label: '¿Llevás vianda?', dataType: 'BOOLEAN', showIf: { fieldCode: 'jornada', anyOf: ['afuera'] } },
    ],
  },
  {
    sectionCode: 'salud',
    title: 'Tu salud',
    intro: null,
    fields: [
      { ...base, fieldCode: 'alergias', label: '¿Tenés alergias?', dataType: 'BOOLEAN' },
      { ...base, fieldCode: 'medicacion', label: '¿Tomás medicación?', dataType: 'BOOLEAN' },
    ],
  },
  {
    sectionCode: 'detalle',
    title: 'El detalle',
    intro: null,
    fields: [{ ...base, fieldCode: 'cuales', label: '¿Cuáles?', dataType: 'TEXT', multiline: false, maxLength: 100, showIf: { fieldCode: 'alergias', anyOf: [true] } }],
  },
  { sectionCode: 'otra', title: 'Otra', intro: null, fields: [{ ...base, fieldCode: 'no_pedida', label: 'No se pide', dataType: 'BOOLEAN' }] },
];
const PEDIDO = { requestedFieldCodes: ['jornada', 'vianda', 'alergias', 'medicacion', 'cuales'], requiredFieldCodes: ['jornada', 'vianda', 'alergias', 'cuales'] };
const r = (fieldCode: string, answer: RespuestaDeCampoV2Entrada['answer']): RespuestaDeCampoV2Entrada => ({ fieldCode, answer });

test('DL-165 D-1 · las partes son las secciones con algo pedido, en orden, y el total no cambia mientras se responde', () => {
  const partes = partesDelFormulario(PARTES, PEDIDO);
  assert.deepEqual(
    partes.map((p) => [p.indice, p.sectionCode, p.pedidas]),
    [
      [0, 'tu_dia', ['jornada', 'vianda']],
      [1, 'salud', ['alergias', 'medicacion']],
      [2, 'detalle', ['cuales']],
    ],
  );
  assert.equal(partes[0]!.intro, 'Para ubicar las comidas.');
  // Con todo oculto, «El detalle» sigue siendo una parte: «Parte 3 de 3» no se vuelve «de 2» al responder.
  const visibles = camposVisibles(PARTES, [r('alergias', { type: 'BOOLEAN', yes: false })]);
  assert.deepEqual(preguntasQueSeVen(partes[2]!, visibles), []);
  assert.deepEqual(preguntasQueSeVen(partes[1]!, visibles), ['alergias', 'medicacion']);
  // El repaso es el paso que sigue a la última parte; un paso fuera de rango se acota.
  assert.equal(pasoDelRepaso(partes), 3);
  assert.equal(pasoAcotado(partes, 9), 3);
  assert.equal(pasoAcotado(partes, -2), 0);
  assert.equal(COPY_FORMULARIOS_V2.parte(1, 3), 'Parte 1 de 3');
});

test('DL-165 D-1 · lo que falta en una parte son sus obligatorias visibles sin responder; lo oculto no falta', () => {
  const [dia, salud, detalle] = partesDelFormulario(PARTES, PEDIDO);
  // «¿Llevás vianda?» es obligatoria, pero con «En casa» no se ve: no falta.
  const enCasa = [r('jornada', { type: 'CHOICE', option: 'casa', otherText: null })];
  assert.deepEqual(obligatoriasSinResponderDeLaParte(dia!, PARTES, PEDIDO, enCasa), []);
  const afuera = [r('jornada', { type: 'CHOICE', option: 'afuera', otherText: null })];
  assert.deepEqual(obligatoriasSinResponderDeLaParte(dia!, PARTES, PEDIDO, afuera), ['vianda']);
  // La medicación es opcional: sin responderla no falta nada en «Tu salud».
  assert.deepEqual(obligatoriasSinResponderDeLaParte(salud!, PARTES, PEDIDO, [r('alergias', { type: 'BOOLEAN', yes: true })]), []);
  assert.deepEqual(obligatoriasSinResponderDeLaParte(detalle!, PARTES, PEDIDO, [r('alergias', { type: 'BOOLEAN', yes: true })]), ['cuales']);
  assert.equal(COPY_FORMULARIOS_V2.quedaronSinResponder(1, 'Tu día'), 'En «Tu día» quedó 1 pregunta obligatoria sin responder. Podés volver cuando quieras.');
  assert.equal(COPY_FORMULARIOS_V2.faltanPorResponder(2), 'Faltan 2 preguntas obligatorias por responder.');
});

test('DL-165 D-1 · un problema al enviar lleva a la primera parte, en el orden del formulario, con una pregunta con problema', () => {
  const partes = partesDelFormulario(PARTES, PEDIDO);
  assert.equal(primeraParteCon(partes, ['cuales', 'medicacion']), 1);
  assert.equal(primeraParteCon(partes, ['cuales']), 2);
  // Una pregunta que no es de ninguna parte (no se pidió) no lleva a ningún lado.
  assert.equal(primeraParteCon(partes, ['no_pedida']), null);
  assert.equal(primeraParteCon(partes, []), null);
});

// ─── FR-08 · el formato 3 ───────────────────────────────────────────────────────────────────────

const DIAS = [op('lun', 'Lunes'), op('mar', 'Martes'), op('mie', 'Miércoles'), op('jue', 'Jueves'), op('vie', 'Viernes'), op('sab', 'Sábado'), op('dom', 'Domingo')];
const OTRA_ACTIVIDAD: CampoDePlantillaV2 = {
  ...base,
  fieldCode: 'trn_otros_deportes',
  label: 'Contame cuáles',
  dataType: 'LIST',
  itemLabel: 'actividad',
  minItems: 1,
  maxItems: 6,
  itemFields: [
    { code: 'cual', label: 'Cuál', required: true, dataType: 'TEXT', maxLength: 80, helpText: 'Fútbol, natación, baile…' },
    { code: 'que_dias', label: 'Qué días', required: true, dataType: 'MULTI_CHOICE', options: DIAS },
    { code: 'momento', label: 'En qué momento', required: false, dataType: 'CHOICE', options: [op('manana', 'Mañana'), op('noche', 'Noche')] },
  ],
};
const DE_FORMATO_3: SeccionDePlantillaV2[] = [{ sectionCode: 'tu_semana', title: 'Tu semana', intro: null, fields: [OTRA_ACTIVIDAD] }];
const PIDE_TODO = { requestedFieldCodes: ['trn_otros_deportes'], requiredFieldCodes: ['trn_otros_deportes'] };
const conDias = (que_dias: unknown): RespuestaDeCampoV2Entrada[] => [{ fieldCode: 'trn_otros_deportes', answer: { type: 'LIST', items: [{ cual: 'Fútbol', que_dias } as never] } }];

test('DL-165 D-6 · el contrato admite el subcampo de varias opciones y el ejemplo del renglón; el formato es 2 o 3', () => {
  assert.equal(SubcampoDeListaSchema.safeParse({ code: 'que_dias', label: 'Qué días', required: true, dataType: 'MULTI_CHOICE', options: DIAS }).success, true);
  // Con una sola opción no es una pregunta de varias.
  assert.equal(SubcampoDeListaSchema.safeParse({ code: 'que_dias', label: 'Qué días', required: true, dataType: 'MULTI_CHOICE', options: [op('lun')] }).success, false);
  assert.equal(SubcampoDeListaSchema.safeParse({ code: 'cual', label: 'Cuál', required: true, dataType: 'TEXT', maxLength: 80, helpText: 'Fútbol…' }).success, true);
  // El ejemplo es solo de los textos: un número con `helpText` no pasa (el esquema es estricto).
  assert.equal(SubcampoDeListaSchema.safeParse({ code: 'min', label: 'Minutos', required: true, dataType: 'NUMBER', unit: null, limits: null, helpText: 'x' }).success, false);
  const version = { templateId: 'a', templateVersionId: 'b', key: 'K', name: 'N', purpose: 'P', domain: null, version: '3', status: 'SELECTABLE', usesNewTypes: true, estimatedMinutes: null, sections: DE_FORMATO_3, supersededByVersionId: null, effectiveSince: '2026-11-05T00:00:00.000Z', provenanceNote: 'x' };
  assert.equal(VersionDePlantillaV2Schema.safeParse({ ...version, format: 3 }).success, true);
  assert.equal(VersionDePlantillaV2Schema.safeParse({ ...version, format: 2 }).success, true);
  assert.equal(VersionDePlantillaV2Schema.safeParse({ ...version, format: 4 }).success, false);
});

test('DL-165 D-6 · varias opciones en el renglón: al menos una, todas de la pregunta y sin repetir', () => {
  assert.deepEqual(validarRespuestasV2(DE_FORMATO_3, PIDE_TODO, conDias(['lun', 'jue'])), []);
  for (const mal of [[], ['lun', 'feriado'], ['lun', 'lun'], 'lun', 3]) {
    const problemas = validarRespuestasV2(DE_FORMATO_3, PIDE_TODO, conDias(mal));
    assert.deepEqual(problemas.map((p) => [p.code, p.path]), [[CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_INVALID, 'answers[0].answer.items[0].que_dias']], JSON.stringify(mal));
  }
  // Un subcampo de texto no acepta una lista.
  const textoComoLista = [{ fieldCode: 'trn_otros_deportes', answer: { type: 'LIST' as const, items: [{ cual: ['Fútbol'], que_dias: ['lun'] }] } }];
  assert.deepEqual(validarRespuestasV2(DE_FORMATO_3, PIDE_TODO, textoComoLista).map((p) => p.code), [CODIGO_DE_PROBLEMA_V2.ITEM_FIELD_INVALID]);
});

test('DL-165 D-6 · la forma canónica ordena las opciones del renglón como la pregunta; la transcripción no ve un cambio de orden', () => {
  const normal = normalizarValor(OTRA_ACTIVIDAD, { type: 'LIST', items: [{ cual: ' Fútbol ', que_dias: ['jue', 'lun', 'jue'] }] });
  assert.deepEqual(normal, { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun', 'jue'] }] });
  assert.deepEqual(camposCorregidos(DE_FORMATO_3, conDias(['jue', 'lun']), conDias(['lun', 'jue'])), []);
  assert.deepEqual(camposCorregidos(DE_FORMATO_3, conDias(['lun']), conDias(['lun', 'jue'])), ['trn_otros_deportes']);
  // En palabras, con las etiquetas de la pregunta: «Fútbol · Lunes, Jueves · Noche».
  assert.equal(resumenDeValor(OTRA_ACTIVIDAD, { type: 'LIST', items: [{ cual: 'Fútbol', que_dias: ['lun', 'jue'], momento: 'noche' }] }), 'Fútbol · Lunes, Jueves · Noche');
});

test('DL-165 · lo que hace de formato 3 a una versión: el subcampo de varias opciones o el ejemplo de un renglón', () => {
  assert.deepEqual(loQueUsaDelFormato3(DE_FORMATO_3), ['trn_otros_deportes.cual: el ejemplo del renglón', 'trn_otros_deportes.que_dias: varias opciones en el renglón']);
  assert.equal(usaLoDelFormato3(PARTES), false);
  // La capacidad se declara junto a la de los objetivos por serie y se lee como cualquier otra.
  assert.deepEqual([...capacidadesDeclaradas(`${CAPACIDAD_OBJETIVOS_POR_SERIE},${CAPACIDAD_FORMULARIOS_FORMATO_3}`)], [CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_FORMULARIOS_FORMATO_3]);
});

test('DL-152 · la APK 0.20 no lee el formato 3: su esquema congelado de API-FRI-01 rechaza el renglón con varias opciones y el formato 3, y lee el formato 2', () => {
  const congelado = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'lecturas-de-la-apk', '0.20.0-candidata.1.json'), 'utf8')) as { lecturas: Record<string, { respuesta: Record<string, unknown> }> };
  const deLaApk020 = z.fromJSONSchema(congelado.lecturas['API-FRI-01']!.respuesta as Parameters<typeof z.fromJSONSchema>[0]);
  const version = { templateId: 'a', templateVersionId: 'b', key: 'K', name: 'N', purpose: 'P', domain: null, version: '1', status: 'SELECTABLE', usesNewTypes: true, estimatedMinutes: null, supersededByVersionId: null, effectiveSince: '2026-11-05T00:00:00.000Z', provenanceNote: 'x' };
  const sinLoNuevo: SeccionDePlantillaV2[] = [{ sectionCode: 's', title: 'S', intro: null, fields: [{ ...OTRA_ACTIVIDAD, itemFields: [{ code: 'cual', label: 'Cuál', required: true, dataType: 'TEXT', maxLength: 80 }] }] }];
  assert.equal(deLaApk020.safeParse({ data: { ...version, format: 2, sections: sinLoNuevo } }).success, true);
  // Por eso se le retiene: con el formato 3 o con el subtipo nuevo, esa pantalla diría «respuesta no reconocida».
  assert.equal(deLaApk020.safeParse({ data: { ...version, format: 3, sections: sinLoNuevo } }).success, false);
  assert.equal(deLaApk020.safeParse({ data: { ...version, format: 2, sections: DE_FORMATO_3 } }).success, false);
});
