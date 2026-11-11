/**
 * La cola de revisiones y lo que la cartera toma de ella (`cola-de-revisiones.ts`; DL-163 D-6; TB-13 y TB-14).
 * TEST-TAG-011 (la parte del dominio) y TEST-TAG-012 (el motivo, el orden y los textos).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terminosProhibidosDeCarteraEn } from './cartera';
import {
  compararFilasDeLaCola,
  MOTIVOS_DE_LA_COLA,
  motivoDeLaCola,
  revisionEnLaCartera,
  sinPlanActivoEnLaCartera,
  TEXTO_DEL_MOTIVO,
  type HechosDeLaCola,
} from './cola-de-revisiones';
import { revisionPendiente } from './revision';

const HOY = '2026-11-06';
const base: HechosDeLaCola = {
  procesoAbierto: true,
  planActivadoEn: '2026-10-01',
  ultimaRevision: null,
  expectativa: { fechaObjetivo: '2026-11-01', registradaEn: '2026-10-01' },
  aplicacionPosterior: null,
  hoy: HOY,
};

test('TEST-TAG-011 · una revisión aplicada como «Mantener» sin fecha nueva no sigue como vencida en la cartera', () => {
  // La expectativa del 1 nov venció; una revisión registrada después se aplicó sin acordar otra fecha.
  assert.deepEqual(revisionEnLaCartera('2026-11-01', true, HOY), { kind: null, dias: null });
  // Es lo que dice el dominio de revisión (REG-06-150): la misma expectativa, resuelta, no es un pendiente.
  assert.deepEqual(revisionPendiente({ procesoAbierto: true, expectativa: { fechaObjetivo: '2026-11-01', registradaEn: '2026-10-01' }, revisionAplicadaPosterior: true, ahora: HOY }), { pendiente: false });
  // Sin una aplicación posterior, la clasificación de siempre.
  assert.deepEqual(revisionEnLaCartera('2026-11-01', false, HOY), { kind: 'REVIEW_OVERDUE', dias: 5 });
  assert.deepEqual(revisionEnLaCartera('2026-11-10', false, HOY), { kind: 'REVIEW_DUE_SOON', dias: 4 });
  assert.deepEqual(revisionEnLaCartera(null, false, HOY), { kind: 'REVIEW_UNDATED', dias: null });
  // Resuelta también si era próxima o sin fecha: la revisión ya se hizo.
  assert.deepEqual(revisionEnLaCartera('2026-11-10', true, HOY), { kind: null, dias: null });
  assert.deepEqual(revisionEnLaCartera(null, true, HOY), { kind: null, dias: null });
  assert.deepEqual(revisionEnLaCartera(undefined, false, HOY), { kind: null, dias: null });
});

test('TEST-TAG-011 · un seguimiento cerrado con «Finalizar» no vuelve como «Sin plan activo»; uno sin empezar, sí', () => {
  assert.equal(sinPlanActivoEnLaCartera({ procesoAbierto: false, borrador: false, cerradoConFinalizar: true }), false);
  assert.equal(sinPlanActivoEnLaCartera({ procesoAbierto: false, borrador: false, cerradoConFinalizar: false }), true);
  assert.equal(sinPlanActivoEnLaCartera({ procesoAbierto: true, borrador: false, cerradoConFinalizar: false }), false);
  assert.equal(sinPlanActivoEnLaCartera({ procesoAbierto: false, borrador: true, cerradoConFinalizar: false }), false, 'con un borrador, el pendiente es el borrador');
});

test('TEST-TAG-012 · la última revisión sin aplicar es «Próxima acción pendiente», aunque la revisión acordada siga vencida', () => {
  assert.deepEqual(motivoDeLaCola({ ...base, ultimaRevision: { registradaEn: '2026-11-02', aplicadaEn: null } }), { motivo: 'NEXT_ACTION_PENDING', desde: '2026-11-02' });
  // Aplicada, deja de serlo.
  assert.notEqual(motivoDeLaCola({ ...base, ultimaRevision: { registradaEn: '2026-11-02', aplicadaEn: '2026-11-03' } })?.motivo, 'NEXT_ACTION_PENDING');
});

test('TEST-TAG-012 · «Revisión pendiente» es la del dominio: vencida o sin fecha, nunca a futuro', () => {
  assert.deepEqual(motivoDeLaCola(base), { motivo: 'REVIEW_DUE', desde: '2026-11-01' });
  assert.deepEqual(motivoDeLaCola({ ...base, expectativa: { fechaObjetivo: HOY, registradaEn: '2026-10-01' } }), { motivo: 'REVIEW_DUE', desde: HOY }, 'la fecha de hoy ya llegó');
  assert.deepEqual(motivoDeLaCola({ ...base, expectativa: { fechaObjetivo: null, registradaEn: '2026-10-05' } }), { motivo: 'REVIEW_DUE', desde: '2026-10-05' });
  assert.equal(motivoDeLaCola({ ...base, expectativa: { fechaObjetivo: '2026-11-20', registradaEn: '2026-10-01' } }), null, 'una revisión programada no es un pendiente');
});

test('TEST-TAG-012 · «Sin revisión acordada»: un plan activo sin ninguna, o con la que había resuelta por una aplicación posterior', () => {
  assert.deepEqual(motivoDeLaCola({ ...base, expectativa: undefined }), { motivo: 'ACTIVE_PLAN_WITHOUT_REVIEW', desde: '2026-10-01' });
  assert.deepEqual(motivoDeLaCola({ ...base, ultimaRevision: { registradaEn: '2026-11-02', aplicadaEn: '2026-11-03' }, aplicacionPosterior: { aplicadaEn: '2026-11-03' } }), {
    motivo: 'ACTIVE_PLAN_WITHOUT_REVIEW',
    desde: '2026-11-03',
  });
  // Si después se activó otra versión, desde esa activación.
  assert.deepEqual(motivoDeLaCola({ ...base, planActivadoEn: '2026-11-04', aplicacionPosterior: { aplicadaEn: '2026-11-03' } })?.desde, '2026-11-04');
  // Sin seguimiento abierto o sin plan activado, nada.
  assert.equal(motivoDeLaCola({ ...base, procesoAbierto: false, expectativa: undefined }), null);
  assert.equal(motivoDeLaCola({ ...base, planActivadoEn: null, expectativa: undefined }), null);
});

test('TEST-TAG-012 · el orden: «Próxima acción pendiente» primero y «Sin revisión acordada» último; después, lo más antiguo', () => {
  const filas = [
    { motivo: 'ACTIVE_PLAN_WITHOUT_REVIEW' as const, desde: '2026-01-01', adviseeId: 'a', domain: 'NUTRITION' },
    { motivo: 'REVIEW_DUE' as const, desde: '2026-11-01', adviseeId: 'b', domain: 'NUTRITION' },
    { motivo: 'NEXT_ACTION_PENDING' as const, desde: '2026-11-05', adviseeId: 'c', domain: 'TRAINING' },
    { motivo: 'REVIEW_DUE' as const, desde: '2026-10-01', adviseeId: 'd', domain: 'TRAINING' },
  ];
  assert.deepEqual(
    [...filas].sort(compararFilasDeLaCola).map((f) => f.adviseeId),
    ['c', 'd', 'b', 'a'],
  );
  assert.deepEqual(MOTIVOS_DE_LA_COLA, ['NEXT_ACTION_PENDING', 'REVIEW_DUE', 'ACTIVE_PLAN_WITHOUT_REVIEW']);
});

test('TEST-TAG-031 · los textos de la cola pasan la lista de términos de la cartera', () => {
  for (const texto of Object.values(TEXTO_DEL_MOTIVO)) assert.deepEqual(terminosProhibidosDeCarteraEn(texto), [], texto);
  assert.deepEqual(TEXTO_DEL_MOTIVO, { NEXT_ACTION_PENDING: 'Próxima acción pendiente', REVIEW_DUE: 'Revisión pendiente', ACTIVE_PLAN_WITHOUT_REVIEW: 'Sin revisión acordada' });
});
