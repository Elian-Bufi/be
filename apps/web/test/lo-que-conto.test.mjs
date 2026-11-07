/**
 * WP-TABLERO-ALTA-GAMA TB-49 (DL-165 D-8) · «Lo que contó al empezar», sin React (TEST-TAG-033): la tarjeta del Resumen
 * ubica lo declarado en los formularios que pidió este profesional y no lo califica.
 *  1. solo las solicitudes respondidas, con la respuesta que rige (la elige `loDeclaradoV2`), cada pregunta en palabras;
 *  2. con su fecha y su procedencia: declarado por la persona, o cargado por un profesional y confirmado por ella;
 *  3. las dos más nuevas con sus respuestas, las demás con un enlace; sin solicitudes respondidas, no hay tarjeta;
 *  4. sin cuentas, sin puntajes y sin ningún botón que escriba (la lectura del componente).
 * Que «Tus hábitos» entre solo si este profesional la pidió lo garantiza API-FRM-04, que lista las solicitudes de quien
 * consulta (`profesionalId`). Los fixtures son los de `lo-declarado-v2.test.mjs`.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const { loDeclaradoV2 } = await import('../src/app/pro/advisees/forms/lo-declarado-v2.ts');
const { respondidasParaLeer, RESPUESTAS_A_LA_VISTA, solicitudQueConto } = await import('../src/app/pro/advisees/seguimiento/lo-que-conto.ts');

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

const PEDIDA = { formRequestId: 'req-1', templateName: 'Cómo comés hoy', status: 'RESPONDED', createdAt: '2026-11-03T12:00:00.000Z' };

test('TEST-TAG-033 · las respuestas que rigen, cada pregunta en palabras, con su fecha y «Declarado por la persona»', () => {
  const q = solicitudQueConto(PEDIDA, loDeclaradoV2(SOLICITUD, respuesta(), VERSION));
  assert.equal(q.titulo, 'Cómo comés hoy');
  assert.deepEqual(
    q.respuestas.map((r) => r.pregunta),
    ['¿Cómo es tu jornada?', 'Vasos de agua', 'Tus comidas'],
  );
  assert.equal(q.respuestas[0].valor, 'En casa', 'la etiqueta de la opción, nunca su código');
  assert.ok(!q.respuestas.some((r) => /nut_/.test(r.pregunta) || /^(casa|fuera)$/.test(r.valor)), 'ningún código a la vista');
  assert.equal(q.respondioEl, '2026-11-05T10:00:00.000Z');
  assert.equal(q.corrigioEl, null);
  assert.equal(q.transcripcion, null, 'respondió sola: la procedencia es «Declarado por la persona»');
  assert.equal(q.hayMas, false);
});

test('TEST-TAG-033 · con una corrección rige la corregida, y lo cargado por un profesional dice sus dos actos', () => {
  const corregida = solicitudQueConto(PEDIDA, loDeclaradoV2(SOLICITUD, respuesta({ rectificada: true }), VERSION));
  assert.equal(corregida.respuestas[0].valor, 'Fuera de casa');
  assert.equal(corregida.corrigioEl, '2026-11-06T12:00:00.000Z');
  const cargada = solicitudQueConto(PEDIDA, loDeclaradoV2(SOLICITUD, respuesta({ transcripcion: TRANSCRIPCION }), VERSION));
  assert.equal(cargada.transcripcion.professional.displayName, 'Sofía Paz');
  assert.equal(cargada.transcripcion.confirmedAt, '2026-11-05T10:00:00.000Z');
});

test('TEST-TAG-033 · sin respuesta, pendiente o sin el texto de las preguntas, no hay nada que mostrar de esa solicitud', () => {
  assert.equal(solicitudQueConto(PEDIDA, loDeclaradoV2(SOLICITUD, null, VERSION)), null);
  assert.equal(solicitudQueConto({ ...PEDIDA, status: 'PENDING' }, loDeclaradoV2(SOLICITUD, respuesta(), VERSION)), null);
  assert.equal(solicitudQueConto(PEDIDA, loDeclaradoV2(SOLICITUD, respuesta(), null)), null, 'la pantalla nunca muestra el código de una pregunta');
  assert.equal(solicitudQueConto(PEDIDA, null), null);
});

test('TEST-TAG-033 · a la vista, las primeras respuestas; las demás, en la solicitud', () => {
  assert.equal(RESPUESTAS_A_LA_VISTA, 4);
  const q = solicitudQueConto(PEDIDA, loDeclaradoV2(SOLICITUD, respuesta(), VERSION), 2);
  assert.equal(q.respuestas.length, 2);
  assert.equal(q.hayMas, true);
});

test('TEST-TAG-033 · las dos respondidas más nuevas, con sus respuestas; las demás, con un enlace; sin respondidas, ninguna', () => {
  const s = (id, estado, dia) => ({ formRequestId: id, status: estado, createdAt: `${dia}T12:00:00.000Z` });
  const r = respondidasParaLeer([s('a', 'RESPONDED', '2026-10-01'), s('b', 'PENDING', '2026-11-05'), s('c', 'RESPONDED', '2026-11-02'), s('d', 'RESPONDED', '2026-10-20')]);
  assert.deepEqual(
    r.leer.map((x) => x.formRequestId),
    ['c', 'd'],
  );
  assert.equal(r.otras, 1);
  assert.deepEqual(respondidasParaLeer([s('b', 'PENDING', '2026-11-05')]), { leer: [], otras: 0 });
});

test('TEST-TAG-033 · la tarjeta no cuenta, no califica y no escribe: solo lee y enlaza a la solicitud', () => {
  const fuente = readFileSync(new URL('../src/app/pro/advisees/seguimiento/lo-que-conto-en-pantalla.tsx', import.meta.url), 'utf8');
  const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(sinComentarios, /<button|onClick|onSubmit|api\.(crear|retirar|cargar|pedir)\w*\(/, 'ningún botón ni ninguna operación que escriba');
  assert.doesNotMatch(sinComentarios, /puntaje|cumpl|adherencia|racha|%|de \d+ respuestas/i, 'sin puntajes ni cuentas de respuestas');
  const lecturas = [...new Set([...sinComentarios.matchAll(/api\.(\w+)\(/g)].map((m) => m[1]))].sort();
  assert.deepEqual(lecturas, ['consultarDefinicionDePlantilla', 'consultarVistaDeSolicitud', 'listarSolicitudesDeFormulario'], 'las lecturas que ya hace la pestaña Información');
});
