/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185) · TEST-EVF-001 a TEST-EVF-004, la parte pura:
 * - los contratos son estrictos: vincular pide la versión vista, de 1 a 20 formularios, y la respuesta nunca trae las
 *   respuestas de la persona (solo la referencia);
 * - las áreas son las dos con «Evaluación inicial», cada una con su Alcance;
 * - los textos ubican sin calificar y no dicen «asesorado», «cumplimiento», «adherencia», «racha», «puntaje» ni «estación».
 *
 * Mutaciones verificadas, cada una pone su prueba en rojo: aceptar un vínculo sin `expectedVersion`; sumar un campo con
 * las respuestas a `FormularioVinculadoSchema`; sumar Antropometría a las áreas; escribir «asesorado» en un texto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALCANCE_DE_LA_EVALUACION,
  AREAS_DE_LA_EVALUACION,
  FormularioVinculadoSchema,
  FormulariosVinculadosResponseSchema,
  MAXIMO_DE_FORMULARIOS_VINCULADOS,
  VincularFormulariosRequestSchema,
} from './contratos-evaluacion-y-formularios';
import { COPY_EVALUACION_Y_FORMULARIOS } from './copy-evaluacion-y-formularios';

const ID = '7f1c1d1e-5a4b-4c3d-8e2f-1a2b3c4d5e6f';
const vinculo = {
  linkId: ID,
  formResponseId: ID,
  formRequestId: ID,
  scope: 'NUTRICION',
  templateKey: 'FRM-NUTRICION-INICIO',
  templateName: 'Cómo comés hoy',
  templateVersion: '2',
  purpose: 'Para empezar tu plan',
  linkedVersion: 'v1',
  answeredAt: '2026-11-18T13:00:00.000Z',
  linkedAt: '2026-11-19T13:00:00.000Z',
  laterVersion: null,
};

test('TEST-EVF-001 · vincular pide la versión vista, de 1 a 20 formularios, y nada más', () => {
  assert.equal(VincularFormulariosRequestSchema.safeParse({ links: [{ formResponseId: ID, expectedVersion: 'v1' }] }).success, true);
  assert.equal(VincularFormulariosRequestSchema.safeParse({ links: [{ formResponseId: ID }] }).success, false);
  assert.equal(VincularFormulariosRequestSchema.safeParse({ links: [{ formResponseId: ID, expectedVersion: '1' }] }).success, false);
  assert.equal(VincularFormulariosRequestSchema.safeParse({ links: [] }).success, false);
  const veintiuno = Array.from({ length: MAXIMO_DE_FORMULARIOS_VINCULADOS + 1 }, () => ({ formResponseId: ID, expectedVersion: 'v1' }));
  assert.equal(VincularFormulariosRequestSchema.safeParse({ links: veintiuno }).success, false);
  assert.equal(VincularFormulariosRequestSchema.safeParse({ links: [{ formResponseId: ID, expectedVersion: 'v1', answers: [] }] }).success, false);
});

test('TEST-EVF-002 · un vínculo es una referencia: sin las respuestas, con la versión vinculada y la más nueva si hay', () => {
  assert.equal(FormularioVinculadoSchema.safeParse(vinculo).success, true);
  assert.equal(FormularioVinculadoSchema.safeParse({ ...vinculo, laterVersion: { version: 'v2', answeredAt: '2026-11-20T10:00:00.000Z' } }).success, true);
  assert.equal(FormularioVinculadoSchema.safeParse({ ...vinculo, sections: [] }).success, false);
  assert.equal(FormularioVinculadoSchema.safeParse({ ...vinculo, answers: [] }).success, false);
  assert.deepEqual(Object.keys(FormularioVinculadoSchema.shape).sort(), [
    'answeredAt',
    'formRequestId',
    'formResponseId',
    'laterVersion',
    'linkId',
    'linkedAt',
    'linkedVersion',
    'purpose',
    'scope',
    'templateKey',
    'templateName',
    'templateVersion',
  ]);
  assert.equal(FormulariosVinculadosResponseSchema.safeParse({ data: { evaluationId: ID, links: [vinculo] } }).success, true);
});

test('TEST-EVF-003 · las dos áreas con «Evaluación inicial», cada una con su Alcance', () => {
  assert.deepEqual([...AREAS_DE_LA_EVALUACION], ['nutrition', 'training']);
  assert.deepEqual(ALCANCE_DE_LA_EVALUACION, { nutrition: 'NUTRICION', training: 'ENTRENAMIENTO' });
});

test('TEST-EVF-004 · los textos ubican sin calificar y sin el vocabulario prohibido', () => {
  const textos = Object.values(COPY_EVALUACION_Y_FORMULARIOS).map((v) => (typeof v === 'function' ? (v as (x: string & number) => string)('12 nov' as string & number) : v));
  for (const t of textos) {
    assert.doesNotMatch(t, /\b(asesorad[oa]s?|cumplimiento|adherencia|racha|puntaje|estaci[oó]n)\b/i, t);
    assert.doesNotMatch(t, /\b(mejor|peor|bien|mal)\b/i, t);
  }
  assert.match(COPY_EVALUACION_Y_FORMULARIOS.hayUnaMasNueva('20 nov'), /conserva la que vinculaste/);
  assert.match(COPY_EVALUACION_Y_FORMULARIOS.ayudaParaVincular, /no se copian/);
});
