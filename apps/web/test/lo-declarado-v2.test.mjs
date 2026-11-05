/**
 * WP-FORMULARIOS-DE-INICIO (DL-164) · «Lo que declaró» para una respuesta V2 (API-FRI-03), en
 * `apps/web/src/app/pro/advisees/forms/lo-declarado-v2.ts`: las reglas son las de `loDeclarado` del dominio (qué versión
 * rige, «Corregida», «Antes»), aplicadas sobre cada valor dicho en palabras con las etiquetas de la plantilla; se suman
 * las respuestas crudas de la versión que rige y la transcripción (quién cargó, cuándo confirmó, qué corrigió).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const m = await import('../src/app/pro/advisees/forms/lo-declarado-v2.ts');

const base = { category: 'HABITOS_Y_CONTEXTO', helpText: null, purpose: null, showIf: null, requiredByDefault: false };
const op = (code, label) => ({ code, label });
const VERSION = {
  sections: [
    {
      sectionCode: 'dia',
      title: 'Tu día',
      intro: null,
      fields: [
        { ...base, fieldCode: 'nut_jornada', label: '¿Cómo es tu jornada?', dataType: 'CHOICE', options: [op('casa', 'En casa'), op('fuera', 'Fuera de casa')], otherOptionCode: null },
        { ...base, fieldCode: 'nut_agua', label: 'Vasos de agua', dataType: 'NUMBER', unit: 'vasos', limits: null },
        {
          ...base,
          fieldCode: 'nut_comidas',
          label: 'Tus comidas',
          dataType: 'LIST',
          itemLabel: 'comida',
          minItems: 1,
          maxItems: 5,
          itemFields: [
            { code: 'momento', label: 'Momento', required: true, dataType: 'CHOICE', options: [op('desayuno', 'Desayuno'), op('cena', 'Cena')] },
            { code: 'que', label: 'Qué comés', required: true, dataType: 'TEXT', maxLength: 200 },
          ],
        },
      ],
    },
  ],
};
const SOLICITUD = { requestedFieldCodes: ['nut_jornada', 'nut_agua', 'nut_comidas'], requiredFieldCodes: ['nut_jornada'] };
const a = (fieldCode, answer) => ({ fieldCode, answer, provenance: 'SELF_REPORTED' });
const ORIGINAL = [a('nut_jornada', { type: 'CHOICE', option: 'casa', otherText: null }), a('nut_agua', { type: 'NUMBER', number: 6, unit: 'vasos' }), a('nut_comidas', { type: 'LIST', items: [{ momento: 'desayuno', que: 'Café con leche' }] })];
const CORREGIDA = [a('nut_jornada', { type: 'CHOICE', option: 'fuera', otherText: null }), a('nut_comidas', { type: 'LIST', items: [{ momento: 'desayuno', que: 'Café con leche' }, { momento: 'cena', que: 'Sopa' }] })];
const TRANSCRIPCION = { professional: { identityId: 'p-1', displayName: 'Sofía Paz' }, loadedAt: '2026-11-04T14:00:00.000Z', confirmedAt: '2026-11-05T10:00:00.000Z', correctedFieldCodes: ['nut_agua'] };

function respuesta({ rectificada = false, transcripcion = null, vista } = {}) {
  const rectificacion = { rectificationId: 'r-1', previousRectificationId: null, reason: 'Me equivoqué', answers: CORREGIDA, version: 'v2', recordedAt: '2026-11-06T12:00:00.000Z' };
  return {
    formResponseId: 'resp-1',
    formRequestId: 'req-1',
    adviseeId: 'a-1',
    templateVersionId: 'tv-1',
    original: { answers: ORIGINAL },
    rectifications: rectificada ? [rectificacion] : [],
    effectiveView: vista ?? (rectificada ? { kind: 'RECTIFIED', rectificationId: 'r-1' } : { kind: 'ORIGINAL' }),
    transcription: transcripcion,
    version: rectificada ? 'v2' : 'v1',
    submittedAt: '2026-11-05T10:00:00.000Z',
  };
}

test('sin respuesta · todas las preguntas pedidas, sin responder, y nada que rija', () => {
  const d = m.loDeclaradoV2(SOLICITUD, null, VERSION);
  assert.equal(d.estado, 'SIN_RESPONDER');
  assert.deepEqual(d.filas.map((f) => [f.pregunta, f.valor, f.requerida]), [['¿Cómo es tu jornada?', null, true], ['Vasos de agua', null, false], ['Tus comidas', null, false]]);
  assert.equal(d.queRige, null);
  assert.equal(d.transcripcion, null);
  assert.equal(d.corregidasAntesDeConfirmar.size, 0);
});

test('respondida · cada valor en palabras con las etiquetas (nunca el código), y la versión que rige con sus valores crudos', () => {
  const d = m.loDeclaradoV2(SOLICITUD, respuesta(), VERSION);
  assert.equal(d.estado, 'RESPONDIDA');
  assert.deepEqual(d.filas.map((f) => f.valor), ['En casa', '6 vasos', 'Desayuno · Café con leche']);
  assert.equal(d.queRige, ORIGINAL);
  assert.equal(d.historia.length, 1);
  assert.equal(d.historia[0].respuestas[0].valor, 'En casa');
});

test('corregida · rige la corrección: «Corregida» y «Antes» comparan los textos, y queRige son las respuestas de la corrección', () => {
  const d = m.loDeclaradoV2(SOLICITUD, respuesta({ rectificada: true }), VERSION);
  const por = new Map(d.filas.map((f) => [f.codigo, f]));
  assert.deepEqual([por.get('nut_jornada').valor, por.get('nut_jornada').corregida, por.get('nut_jornada').antes], ['Fuera de casa', true, { tipo: 'VALOR', texto: 'En casa' }]);
  assert.deepEqual([por.get('nut_agua').valor, por.get('nut_agua').corregida, por.get('nut_agua').antes], [null, true, { tipo: 'VALOR', texto: '6 vasos' }], 'la corrección no trajo el agua: queda sin responder, y se dice qué había');
  assert.equal(por.get('nut_comidas').valor, 'Desayuno · Café con leche; Cena · Sopa');
  assert.equal(d.queRige, CORREGIDA);
  assert.equal(d.corrigioEl, '2026-11-06T12:00:00.000Z');
});

test('transcripción · si lo cargó un profesional, se sabe quién, cuándo confirmó la persona y qué corrigió antes', () => {
  const d = m.loDeclaradoV2(SOLICITUD, respuesta({ transcripcion: TRANSCRIPCION }), VERSION);
  assert.equal(d.transcripcion.professional.displayName, 'Sofía Paz');
  assert.deepEqual([...d.corregidasAntesDeConfirmar], ['nut_agua']);
  assert.equal(d.filas.find((f) => f.codigo === 'nut_agua').corregida, false, 'corregir antes de confirmar no es una corrección de la respuesta');
});

test('sin resolver · la API señala una corrección que no entrega: ninguna versión rige y no hay valores crudos', () => {
  const d = m.loDeclaradoV2(SOLICITUD, respuesta({ vista: { kind: 'RECTIFIED', rectificationId: 'r-ausente' } }), VERSION);
  assert.equal(d.estado, 'SIN_RESOLVER');
  assert.equal(d.queRige, null);
});

test('sin el formulario · las filas no tienen texto de pregunta y el valor de una opción muestra el código, nunca lo inventa', () => {
  const d = m.loDeclaradoV2(SOLICITUD, respuesta(), null);
  assert.deepEqual(d.filas.map((f) => f.pregunta), [null, null, null]);
  assert.equal(d.filas[0].valor, 'casa');
});
