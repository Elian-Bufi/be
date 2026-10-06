/**
 * `EVIDENCIA_VISUAL` (08 §12.4 y §21.3; precierre del 2026-10-06, §6; DL-125): el texto propuesto dice lo que exige el
 * 08 §21 y lo que hace la implementación, y deja a la vista que es una propuesta. Las operaciones nuevas tienen la forma
 * de sus vecinas de la familia CON.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crearClienteBe } from './cliente-http';
import { ActoDeEvidenciaVisualSchema, DetalleDeEvidenciaVisualRequeridaSchema, RequisitoDeEvidenciaVisualResponseSchema } from './contratos-evidencia-visual';
import { documentoOpenApi, OPERACIONES } from './openapi';
import { VERSION_VIGENTE, VERSIONES_PROPUESTAS } from './textos';

const texto = VERSION_VIGENTE.EVIDENCIA_VISUAL.texto;

test('el texto de EVIDENCIA_VISUAL es una propuesta, y lo dice en el texto mismo', () => {
  assert.ok(VERSIONES_PROPUESTAS.has(VERSION_VIGENTE.EVIDENCIA_VISUAL.id));
  assert.match(VERSION_VIGENTE.EVIDENCIA_VISUAL.id, /propuesta/);
  assert.match(texto, /Texto propuesto, pendiente de aprobación de Dirección y de validación jurídica\./);
  assert.match(texto, /Texto de demostración/);
  // Ninguna otra versión del catálogo es una propuesta.
  assert.equal(VERSIONES_PROPUESTAS.size, 1);
});

test('dice lo que pide el 08 §21: categoría destacada, opcional, privada, quién la ve, acceso corto, sin metadatos, sin IA, borrado y revocación', () => {
  for (const frase of [
    // §21.3: la categoría, específica y en el momento de la subida; no un consentimiento por foto.
    'sobre una sola categoría de datos: las fotos de comidas',
    'Se muestra antes de tu primera foto para el profesional que te acompaña en Nutrición',
    // §21.1: opcional, sin degradar el servicio.
    'Es opcional: podés registrar tus comidas sin fotos. No subir fotos no cambia nada del servicio.',
    // §21.2: acceso por alcance, vínculo y consentimiento vigentes; nadie más; ADMIN solo con acceso excepcional.
    'vos y el profesional que te acompaña en Nutrición, mientras el vínculo, su autorización de acceso y tu consentimiento de datos de salud estén vigentes',
    'No la ven otros asesorados ni otros profesionales.',
    'salvo el acceso excepcional de soporte, que queda registrado',
    // §21.4 y §21.5: privada, URL de 15 minutos como máximo, cada acceso registrado, metadatos depurados.
    'no tiene una dirección pública',
    'vence en 15 minutos como máximo y registra quién la abrió y cuándo',
    'como la ubicación y el modelo del teléfono',
    // 09v9 §28: ni cantidades ni IA.
    'no calcula cantidades, calorías ni nutrientes, y no la envía a ningún servicio de inteligencia artificial',
    // 08:451: supresión individual; §13: la revocación no borra historia.
    'Podés borrar cada foto cuando quieras',
    'Podés revocar esta autorización cuando quieras, desde Cuenta → Privacidad.',
    'Las fotos que ya subiste no se borran',
    // 08 §12.2: aceptar una versión nunca acepta futuras.
    'Aceptar esta versión no acepta versiones futuras.',
  ]) {
    assert.ok(texto.includes(frase), frase);
  }
});

test('las cuatro operaciones propuestas son de la familia propia EVI, con la forma de las CON, y MED-01 declara el 403 con su detalle', () => {
  const op = (id: string) => OPERACIONES.find((o) => o.id === id);
  assert.equal(op('API-EVI-01')?.ruta, '/relationships/{relationshipId}/visual-evidence-requirement');
  assert.equal(op('API-EVI-02')?.idempotencia, true);
  assert.deepEqual(op('API-EVI-02')?.errores[422], ['RELATIONSHIP_NOT_READY_FOR_CONSENT']);
  assert.equal(op('API-EVI-03')?.ruta, '/me/visual-evidence-consents');
  // Revocar es idempotente por semántica, como API-CON-04 y 08: sin Idempotency-Key, pero con el conflicto concurrente.
  assert.equal(op('API-EVI-04')?.idempotencia, false);
  assert.ok(op('API-EVI-04')?.errores[409]?.includes('RESOURCE_CONFLICT'));
  // El requisito comparte el límite de las lecturas protegidas, como API-CON-01.
  assert.ok(op('API-EVI-01')?.errores[429]?.includes('RATE_LIMITED'));
  for (const id of ['API-EVI-01', 'API-EVI-02', 'API-EVI-03', 'API-EVI-04']) assert.match(op(id)?.fuente ?? '', /DL-125/);

  const med01 = op('API-MED-01');
  assert.ok(med01?.errores[403]?.includes('VISUAL_EVIDENCE_ACT_REQUIRED'));
  assert.ok(med01?.errores[422]?.includes('ACTIVE_PLAN_REQUIRED'));
  const documento = documentoOpenApi() as { paths: Record<string, Record<string, { responses: Record<string, { description: string; content: Record<string, { schema: unknown }> }> }>> };
  const r403 = documento.paths['/me/media/upload-intents']!.post!.responses['403']!;
  assert.match(r403.description, /VISUAL_EVIDENCE_ACT_REQUIRED/);
  assert.match(JSON.stringify(r403.content['application/json']!.schema), /relationshipId/);
});

test('los contratos son estrictos: el cliente no elige profesional, alcance ni categoría', () => {
  const requisito = {
    data: {
      relationshipId: 'a',
      professional: { identityId: 'p', displayName: 'Lic. Demo' },
      scope: { code: 'NUTRICION', label: 'Nutrición' },
      category: 'MEAL_PHOTOS',
      consentVersion: { id: 'v', title: 't', text: 'x', textHash: 'h', effectiveFrom: '2026-10-06T00:00:00.000Z' },
      textApproval: 'PENDING_APPROVAL',
      enforced: false,
      currentConsent: null,
    },
  };
  assert.ok(RequisitoDeEvidenciaVisualResponseSchema.safeParse(requisito).success);
  assert.equal(RequisitoDeEvidenciaVisualResponseSchema.safeParse({ data: { ...requisito.data, extra: 1 } }).success, false);
  assert.equal(ActoDeEvidenciaVisualSchema.safeParse({ type: 'VISUAL_EVIDENCE' }).success, false);
  assert.ok(DetalleDeEvidenciaVisualRequeridaSchema.safeParse({ relationshipId: 'a', consentVersionId: 'v' }).success);
  assert.equal(DetalleDeEvidenciaVisualRequeridaSchema.safeParse({ relationshipId: 'a' }).success, false);
});

test('el cliente HTTP: el 403 de MED-01 trae el vínculo y la versión, validados; las cuatro llamadas van a sus rutas', async () => {
  const llamadas: { url: string; init: RequestInit }[] = [];
  const responder = (status: number, cuerpo: unknown) =>
    (async (url: string, init: RequestInit) => {
      llamadas.push({ url, init });
      return new Response(JSON.stringify(cuerpo), { status });
    }) as unknown as typeof fetch;
  const intencion = { purpose: 'MEAL_EVIDENCE', contentType: 'image/jpeg', byteSize: 1000, provenance: 'PERSON_PROVIDED', authorship: null } as const;
  const detalle = { relationshipId: 'a1', consentVersionId: VERSION_VIGENTE.EVIDENCIA_VISUAL.id };
  const conDetalle = crearClienteBe({ baseUrl: '/api/v1', superficie: 'APK', fetch: responder(403, { error: { code: 'VISUAL_EVIDENCE_ACT_REQUIRED', message: 'x', details: detalle } }) });
  const r = await conDetalle.crearIntencionDeSubida('t', intencion, 'clave-1');
  assert.deepEqual(r, { ok: false, tipo: 'API', status: 403, codigo: 'VISUAL_EVIDENCE_ACT_REQUIRED', issues: [], evidenciaVisual: detalle });
  // Un detalle con otra forma no se interpreta: la pantalla lo trata como un rechazo más.
  const malo = crearClienteBe({ baseUrl: '/api/v1', superficie: 'APK', fetch: responder(403, { error: { code: 'VISUAL_EVIDENCE_ACT_REQUIRED', message: 'x', details: { relationshipId: 'a1' } } }) });
  assert.deepEqual(await malo.crearIntencionDeSubida('t', intencion, 'clave-1'), { ok: false, tipo: 'API', status: 403, codigo: 'VISUAL_EVIDENCE_ACT_REQUIRED', issues: [] });

  const cliente = crearClienteBe({ baseUrl: '/api/v1', superficie: 'APK', fetch: responder(500, { error: { code: 'INTERNAL_ERROR', message: 'x' } }) });
  llamadas.length = 0;
  await cliente.consultarRequisitoDeEvidenciaVisual('t', 'a1');
  await cliente.otorgarEvidenciaVisual('t', 'a1', VERSION_VIGENTE.EVIDENCIA_VISUAL.id, 'clave-2');
  await cliente.consultarEvidenciasVisuales('t');
  await cliente.revocarEvidenciaVisual('t', 'e1');
  assert.deepEqual(
    llamadas.map((l) => `${l.init.method} ${l.url}`),
    ['GET /api/v1/relationships/a1/visual-evidence-requirement', 'POST /api/v1/relationships/a1/visual-evidence-consents', 'GET /api/v1/me/visual-evidence-consents', 'POST /api/v1/me/visual-evidence-consents/e1/revoke'],
  );
  const otorgar = llamadas[1]!.init;
  assert.equal((otorgar.headers as Record<string, string>)['Idempotency-Key'], 'clave-2');
  assert.deepEqual(JSON.parse(String(otorgar.body)), { consentVersionId: VERSION_VIGENTE.EVIDENCIA_VISUAL.id });
  // Revocar es idempotente por semántica: sin clave.
  assert.equal((llamadas[3]!.init.headers as Record<string, string>)['Idempotency-Key'], undefined);
});
