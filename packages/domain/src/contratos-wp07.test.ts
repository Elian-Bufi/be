/**
 * WP-07 · los contratos de formularios de información profesional pertinente y las reglas puras que la API aplica
 * antes de tocar la base. Sin base, sin reloj y sin framework.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CrearSolicitudDeFormularioRequestSchema,
  EnviarRespuestaRequestSchema,
  RectificarRespuestaRequestSchema,
  RespuestaDeCampoEntradaSchema,
  RespuestaDeCampoSchema,
} from './contratos-formularios';
import {
  CATEGORIAS_DE_DATO,
  categoriaPertinenteParaAlcance,
  ESTADO_DE_SOLICITUD_DE_FORMULARIO_API,
  puedeSerRespondableEstructuralmente,
  requeridosDentroDeSolicitados,
  solicitudDentroDeLaPlantilla,
  TRANSICIONES_DE_SOLICITUD_DE_FORMULARIO,
} from './formularios';
import { transicionDe } from './maquina';
import { evaluarNuevaCorreccion, resolverVistaEfectiva } from './versionado';

// ─── D-B · dos estados, sin retorno (REG-06-210) ────────────────────────────────────────────────

test('REG-06-210 · la Solicitud nace PENDIENTE y solo puede pasar a RESPONDIDA; no hay un tercer estado', () => {
  assert.deepEqual(transicionDe(TRANSICIONES_DE_SOLICITUD_DE_FORMULARIO, 'CrearSolicitud', null)?.destino, 'PENDIENTE');
  assert.deepEqual(transicionDe(TRANSICIONES_DE_SOLICITUD_DE_FORMULARIO, 'RegistrarRespuesta', 'PENDIENTE')?.destino, 'RESPONDIDA');
  assert.equal(transicionDe(TRANSICIONES_DE_SOLICITUD_DE_FORMULARIO, 'RegistrarRespuesta', 'RESPONDIDA'), undefined, 'sin retorno: RESPONDIDA no vuelve a PENDIENTE');
  assert.equal(transicionDe(TRANSICIONES_DE_SOLICITUD_DE_FORMULARIO, 'CrearSolicitud', 'PENDIENTE'), undefined, 'no se crea dos veces');
});

test('09:1508 · el token del contrato es el del 09 en inglés; el del dominio, la palabra del 06', () => {
  assert.deepEqual(ESTADO_DE_SOLICITUD_DE_FORMULARIO_API, { PENDIENTE: 'PENDING', RESPONDIDA: 'RESPONDED' });
});

test('09:1610-1618 · respondable es una proyección, no un tercer estado: la mitad estructural es PENDIENTE únicamente', () => {
  assert.equal(puedeSerRespondableEstructuralmente('PENDIENTE'), true);
  assert.equal(puedeSerRespondableEstructuralmente('RESPONDIDA'), false);
});

// ─── Pertinencia (08 §11-bis, adaptada a P0; DL-095) ────────────────────────────────────────────

test('DL-095 · P0 es maximally permissive: las cuatro categorías son pertinentes en los tres Alcances', () => {
  for (const alcance of ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'] as const) {
    for (const categoria of CATEGORIAS_DE_DATO) assert.equal(categoriaPertinenteParaAlcance(alcance, categoria), true);
  }
  assert.equal(CATEGORIAS_DE_DATO.length, 4);
});

// ─── REG-06-212 · requerido ⊆ solicitado, y solicitado ⊆ plantilla ──────────────────────────────

test('REG-06-212 · lo requerido tiene que estar entre lo solicitado', () => {
  assert.equal(requeridosDentroDeSolicitados(['peso', 'altura'], ['peso']), true);
  assert.equal(requeridosDentroDeSolicitados(['peso'], ['peso', 'altura']), false, 'altura no fue solicitada');
  assert.equal(requeridosDentroDeSolicitados(['peso'], []), true, 'ningún campo obligatorio es legítimo');
});

test('REG-06-13 · lo solicitado tiene que existir en la versión de plantilla citada', () => {
  assert.equal(solicitudDentroDeLaPlantilla(['peso'], ['peso', 'altura']), true);
  assert.equal(solicitudDentroDeLaPlantilla(['peso', 'fantasma'], ['peso', 'altura']), false);
});

// ─── Forma del contrato (09 §22) ─────────────────────────────────────────────────────────────────

test('09:1500 · crear una Solicitud exige plantilla, propósito, alcance y al menos un campo solicitado', () => {
  const base = { templateVersionId: 'ftv_1', purpose: 'Antecedentes de salud', scope: 'ENTRENAMIENTO' as const, requestedFieldCodes: ['dolor'], requiredFieldCodes: [] };
  assert.equal(CrearSolicitudDeFormularioRequestSchema.safeParse(base).success, true);
  assert.equal(CrearSolicitudDeFormularioRequestSchema.safeParse({ ...base, requestedFieldCodes: [] }).success, false, 'al menos un campo');
  assert.equal(CrearSolicitudDeFormularioRequestSchema.safeParse({ ...base, professionalId: 'p1' }).success, false, 'server-owned: professionalId no lo declara el cliente');
});

test('09:1586-1587 · un campo opcional que no se responde se omite del arreglo: el contrato no admite un value nulo como respuesta', () => {
  assert.equal(RespuestaDeCampoEntradaSchema.safeParse({ fieldCode: 'dolor', value: 'Sin dolor' }).success, true);
  assert.equal(RespuestaDeCampoEntradaSchema.safeParse({ fieldCode: 'dolor', value: null }).success, false, 'nunca cero/default: se omite, no se manda null');
  assert.equal(EnviarRespuestaRequestSchema.safeParse({ answers: [] }).success, false, 'un envío sin ninguna respuesta no dice nada');
});

test('TEST-FRM-003 · cada respuesta persistida es SELF_REPORTED por invariante del schema, nunca otro valor', () => {
  const campo = { fieldCode: 'dolor', value: 'Sin dolor', unit: null, profileSourceRef: null, provenance: 'SELF_REPORTED' as const };
  assert.equal(RespuestaDeCampoSchema.safeParse(campo).success, true);
  assert.equal(RespuestaDeCampoSchema.safeParse({ ...campo, provenance: 'DIRECT_CAPTURE' }).success, false, 'ninguna respuesta de formulario es una medición profesional');
});

test('09 §22.8 · rectificar exige la versión esperada, motivo y al menos una respuesta — no es un PATCH parcial', () => {
  const base = { expectedVersion: 'v1', reason: 'Corrijo un dato mal tipeado.', answers: [{ fieldCode: 'dolor', value: 'Con dolor' }] };
  assert.equal(RectificarRespuestaRequestSchema.safeParse(base).success, true);
  assert.equal(RectificarRespuestaRequestSchema.safeParse({ ...base, expectedVersion: undefined }).success, false, '409 VERSION_CONFLICT necesita con qué comparar');
  assert.equal(RectificarRespuestaRequestSchema.safeParse({ ...base, reason: '' }).success, false);
});

// ─── FRM-08 reutiliza B-06 sin modificarlo (versionado.ts) ──────────────────────────────────────

test('09:1618 · rectificar no sobrescribe: crea una sucesora, y la original sigue siendo la vista ORIGINAL hasta que exista una', () => {
  const vista = resolverVistaEfectiva('resp_1', []);
  assert.deepEqual(vista, { tipo: 'ORIGINAL', id: 'resp_1' });
  const primera = evaluarNuevaCorreccion('resp_1', [], { originalId: 'resp_1', correccionPreviaId: null });
  assert.deepEqual(primera, { valida: true, correccionPreviaId: null });
  const cadena = [{ id: 'rect_1', originalId: 'resp_1', correccionPreviaId: null }];
  assert.deepEqual(resolverVistaEfectiva('resp_1', cadena), { tipo: 'CORREGIDA', id: 'rect_1', cadena: ['rect_1'] });
  // Una segunda rectificación que no sucede a la terminal (rect_1) queda rechazada, no crea una rama.
  const bifurcada = evaluarNuevaCorreccion('resp_1', cadena, { originalId: 'resp_1', correccionPreviaId: null });
  assert.deepEqual(bifurcada, { valida: false, motivo: 'NO_SUCEDE_A_LA_TERMINAL' });
});

// ─── El contrato generado (openapi.ts) ──────────────────────────────────────────────────────────

test('09 §22 · las 8 operaciones FRM están en el documento, sin cancelar/rechazar/caducar ni crear plantilla', async () => {
  const { documentoOpenApi } = await import('./openapi');
  const doc = documentoOpenApi() as { paths: Record<string, Record<string, unknown>> };
  const deFormularios = Object.entries(doc.paths).filter(([r]) => r.includes('form-') || r.includes('/me/form'));
  const operaciones = deFormularios.reduce((n, [, m]) => n + Object.keys(m).length, 0);
  assert.equal(operaciones, 8, 'API-FRM-01 a 08');
  const metodos = deFormularios.flatMap(([, m]) => Object.keys(m));
  assert.equal(metodos.includes('delete'), false, 'patrón «solo agregar»: sin DELETE en ningún endpoint de formularios');
  assert.equal(Object.keys(doc.paths).includes('/form-templates/{templateId}'), false, 'no hay operación de crear/editar plantilla (D-D)');
});
