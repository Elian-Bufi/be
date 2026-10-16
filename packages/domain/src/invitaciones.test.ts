/**
 * WP-INVITACION (DL-136): el código corto, el token del enlace, el estado derivado y el contrato de la familia INV.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { crearClienteBe } from './cliente-http';
import {
  ALFABETO_DEL_CODIGO,
  BYTES_DEL_CODIGO,
  CodigoDeInvitacionSchema,
  codigoDesdeBytes,
  enlaceDeInvitacion,
  esTokenDeInvitacion,
  estadoDeInvitacion,
  formatearCodigo,
  InvitacionCreadaResponseSchema,
  InvitacionSchema,
  LARGO_DEL_CODIGO,
  normalizarCodigo,
  SecretoDeInvitacionRequestSchema,
  tokenDelFragmento,
  VIGENCIA_DE_LA_INVITACION_MS,
  VistaPreviaDeInvitacionResponseSchema,
} from './contratos-invitaciones';
import { documentoOpenApi, erroresDeclarados, OPERACIONES } from './openapi';

const TOKEN = randomBytes(32).toString('base64url');

test('el alfabeto del código tiene 32 símbolos distintos y ninguno de los que se confunden (0, 1, I, O)', () => {
  assert.equal(ALFABETO_DEL_CODIGO.length, 32);
  assert.equal(new Set(ALFABETO_DEL_CODIGO).size, 32);
  for (const ambiguo of ['0', '1', 'I', 'O']) assert.ok(!ALFABETO_DEL_CODIGO.includes(ambiguo), ambiguo);
  assert.equal(LARGO_DEL_CODIGO, 8);
  assert.equal(BYTES_DEL_CODIGO * 8, LARGO_DEL_CODIGO * 5);
});

test('codigoDesdeBytes: 40 bits de a 5, del más significativo al menos, sin sesgo', () => {
  assert.equal(codigoDesdeBytes(new Uint8Array([0, 0, 0, 0, 0])), '22222222');
  assert.equal(codigoDesdeBytes(new Uint8Array([255, 255, 255, 255, 255])), 'ZZZZZZZZ');
  // 00001 repetido ocho veces = 0x08 0x42 0x10 0x84 0x21: cada símbolo es el segundo del alfabeto.
  assert.equal(codigoDesdeBytes(new Uint8Array([0x08, 0x42, 0x10, 0x84, 0x21])), '33333333');
  assert.equal(codigoDesdeBytes(new Uint8Array([0, 0, 0, 0, 1])), '22222223');
  // Cada valor de 5 bits llega a su símbolo: el último grupo son los 5 bits de abajo del quinto byte.
  for (let v = 0; v < 32; v++) assert.equal(codigoDesdeBytes(new Uint8Array([0, 0, 0, 0, v]))[7], ALFABETO_DEL_CODIGO[v]);
  // Los bytes de más no cambian el resultado; los de menos, no alcanzan.
  assert.equal(codigoDesdeBytes(new Uint8Array([0, 0, 0, 0, 1, 99, 99])), '22222223');
  assert.throws(() => codigoDesdeBytes(new Uint8Array([1, 2, 3, 4])), RangeError);
  for (let i = 0; i < 200; i++) {
    const codigo = codigoDesdeBytes(randomBytes(BYTES_DEL_CODIGO));
    assert.match(codigo, /^[2-9A-HJ-NP-Z]{8}$/);
    assert.ok(CodigoDeInvitacionSchema.safeParse(formatearCodigo(codigo)).success);
    assert.equal(normalizarCodigo(formatearCodigo(codigo)), codigo);
  }
});

test('normalizarCodigo: mayúsculas, sin espacios ni guiones (también los del teclado del teléfono); lo demás no es un código', () => {
  assert.equal(formatearCodigo('ABCDEFGH'), 'ABCD-EFGH');
  for (const escrito of ['ABCD-EFGH', 'abcd-efgh', 'AbCdEfGh', ' ABCD EFGH ', 'ABCD–EFGH', 'ABCD—EFGH', 'ABCD‑EFGH', 'AB-CD-EF-GH']) {
    assert.equal(normalizarCodigo(escrito), 'ABCDEFGH', escrito);
  }
  for (const invalido of ['', 'ABCD-EFG', 'ABCD-EFGHJ', 'ABCD-EFG0', 'ABCD-EFG1', 'ABCD-EFGI', 'ABCD-EFGO', 'ABCD_EFGH', 'ABCD.EFGH', 'ÁBCD-EFGH']) {
    assert.equal(normalizarCodigo(invalido), null, invalido);
  }
});

test('el token del enlace: 32 bytes en base64url sin relleno; va en el fragmento, que no llega al servidor', () => {
  assert.equal(TOKEN.length, 43);
  assert.ok(esTokenDeInvitacion(TOKEN));
  assert.ok(esTokenDeInvitacion(` ${TOKEN} `));
  assert.ok(!esTokenDeInvitacion(`${TOKEN}=`));
  assert.ok(!esTokenDeInvitacion(TOKEN.slice(1)));
  assert.ok(!esTokenDeInvitacion(`${TOKEN.slice(1)}+`));
  const enlace = enlaceDeInvitacion('https://be.example.invalid/', TOKEN);
  assert.equal(enlace, `https://be.example.invalid/invitacion#t=${TOKEN}`);
  const url = new URL(enlace);
  assert.equal(url.pathname, '/invitacion');
  assert.equal(url.search, '');
  assert.equal(tokenDelFragmento(url.hash), TOKEN);
  assert.equal(tokenDelFragmento(`t=${TOKEN}`), TOKEN);
  assert.equal(tokenDelFragmento('#t=corto'), null);
  assert.equal(tokenDelFragmento(''), null);
  assert.equal(tokenDelFragmento(`#x=${TOKEN}`), null);
});

test('estadoDeInvitacion: la resolución manda sobre el vencimiento; sin resolución, vence exactamente a su hora', () => {
  const ahora = new Date('2026-10-16T12:00:00.000Z');
  const antes = new Date(ahora.getTime() - 1);
  const despues = new Date(ahora.getTime() + 1);
  assert.equal(estadoDeInvitacion({ resolucion: null, venceEn: despues }, ahora), 'PENDING');
  assert.equal(estadoDeInvitacion({ resolucion: null, venceEn: ahora }, ahora), 'EXPIRED');
  assert.equal(estadoDeInvitacion({ resolucion: null, venceEn: antes }, ahora), 'EXPIRED');
  assert.equal(estadoDeInvitacion({ resolucion: 'USADA', venceEn: antes }, ahora), 'USED');
  assert.equal(estadoDeInvitacion({ resolucion: 'REVOCADA', venceEn: antes }, ahora), 'REVOKED');
  assert.equal(estadoDeInvitacion({ resolucion: 'REVOCADA', venceEn: despues }, ahora), 'REVOKED');
  assert.equal(VIGENCIA_DE_LA_INVITACION_MS, 7 * 24 * 60 * 60 * 1000);
});

test('el cuerpo de ver y usar: el token o el código, uno solo, sin campos de más', () => {
  assert.ok(SecretoDeInvitacionRequestSchema.safeParse({ token: TOKEN }).success);
  assert.ok(SecretoDeInvitacionRequestSchema.safeParse({ code: 'abcd-efgh' }).success);
  assert.ok(!SecretoDeInvitacionRequestSchema.safeParse({}).success);
  assert.ok(!SecretoDeInvitacionRequestSchema.safeParse({ token: TOKEN, code: 'ABCD-EFGH' }).success);
  assert.ok(!SecretoDeInvitacionRequestSchema.safeParse({ token: TOKEN, professionalId: 'x' }).success);
  assert.ok(!SecretoDeInvitacionRequestSchema.safeParse({ token: '' }).success);
});

test('el contrato de la familia INV: rutas, idempotencia, límite de intentos, y el token solo en la respuesta de crear', () => {
  const op = (id: string) => OPERACIONES.find((o) => o.id === id);
  const familia = OPERACIONES.filter((o) => /^API-INV-\d{2}$/.test(o.id)).map((o) => `${o.id} ${o.metodo.toUpperCase()} ${o.ruta}`);
  assert.deepEqual(familia, [
    'API-INV-01 POST /relationship-invitations',
    'API-INV-02 GET /relationship-invitations',
    'API-INV-03 POST /relationship-invitations/{invitationId}/revoke',
    'API-INV-04 POST /relationship-invitations/preview',
    'API-INV-05 POST /relationship-invitations/claim',
  ]);
  assert.deepEqual(['API-INV-01', 'API-INV-02', 'API-INV-03', 'API-INV-04', 'API-INV-05'].map((id) => op(id)?.idempotencia), [true, false, true, false, true]);
  for (const id of ['API-INV-04', 'API-INV-05']) {
    assert.deepEqual(erroresDeclarados(id)['429'], ['RATE_LIMITED'], id);
    assert.ok(erroresDeclarados(id)['404']?.includes('RESOURCE_NOT_FOUND'), id);
  }
  assert.deepEqual(op('API-INV-05')?.exitos.map((e) => e.status), [201, 200]);
  for (const codigo of ['INVITATION_EXPIRED', 'INVITATION_USED', 'INVITATION_REVOKED', 'COUNTERPART_NOT_ELIGIBLE']) {
    assert.ok(erroresDeclarados('API-INV-05')['422']?.includes(codigo), codigo);
  }
  for (const o of OPERACIONES.filter((x) => x.id.startsWith('API-INV-'))) assert.match(o.fuente, /familia INV/);

  // El token y el código salen solo en el 201 de crear; ni la lista, ni la anulada, ni la vista previa los traen.
  assert.ok(!('token' in InvitacionSchema.shape) && !('code' in InvitacionSchema.shape));
  const vista = VistaPreviaDeInvitacionResponseSchema.shape.data.shape;
  assert.ok(!('token' in vista) && !('code' in vista));
  const doc = documentoOpenApi() as { paths: Record<string, Record<string, { responses: Record<string, unknown> }>> };
  const respuestas = (ruta: string, metodo: string) => JSON.stringify(doc.paths[ruta]?.[metodo]?.responses ?? {});
  assert.match(respuestas('/relationship-invitations', 'post'), /"token"/);
  for (const [ruta, metodo] of [
    ['/relationship-invitations', 'get'],
    ['/relationship-invitations/{invitationId}/revoke', 'post'],
    ['/relationship-invitations/preview', 'post'],
    ['/relationship-invitations/claim', 'post'],
  ] as const) {
    assert.doesNotMatch(respuestas(ruta, metodo), /"token"/, `${metodo} ${ruta}`);
  }
  // La respuesta de crear exige las dos formas: el token de 43 y el código XXXX-XXXX.
  const creada = {
    data: {
      invitationId: '6f1c1a4e-0000-4000-8000-000000000001',
      scope: { code: 'NUTRICION', label: 'Nutrición' },
      purpose: 'ACOMPANAMIENTO_NUTRICIONAL',
      state: 'PENDING',
      createdAt: '2026-10-16T12:00:00.000Z',
      expiresAt: '2026-10-23T12:00:00.000Z',
      usedAt: null,
      revokedAt: null,
      relationshipRequestId: null,
      token: TOKEN,
      code: 'ABCD-EFGH',
    },
  };
  assert.ok(InvitacionCreadaResponseSchema.safeParse(creada).success);
  assert.ok(!InvitacionCreadaResponseSchema.safeParse({ data: { ...creada.data, code: 'ABCDEFGH' } }).success);
});

test('cliente: crear manda alcance y finalidad con Idempotency-Key; ver y usar mandan el secreto en el cuerpo, nunca en la URL', async () => {
  const llamadas: { url: string; init: RequestInit }[] = [];
  const fetchFalso = (async (url: string, init: RequestInit) => {
    llamadas.push({ url, init });
    return new Response(JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x' } }), { status: 404 });
  }) as unknown as typeof fetch;
  const cliente = crearClienteBe({ baseUrl: 'https://api.example.invalid/api/v1', superficie: 'WEB', fetch: fetchFalso });
  await cliente.crearInvitacion('sesion', 'ENTRENAMIENTO', 'clave-de-prueba-01');
  await cliente.verInvitacion('sesion', { token: TOKEN });
  await cliente.usarInvitacion('sesion', { code: 'ABCD-EFGH' }, 'clave-de-prueba-02');
  await cliente.anularInvitacion('sesion', 'inv-1', 'clave-de-prueba-03');
  await cliente.consultarInvitaciones('sesion', { state: 'PENDING' });
  assert.deepEqual(
    llamadas.map((l) => `${l.init.method} ${l.url.replace('https://api.example.invalid/api/v1', '')}`),
    [
      'POST /relationship-invitations',
      'POST /relationship-invitations/preview',
      'POST /relationship-invitations/claim',
      'POST /relationship-invitations/inv-1/revoke',
      'GET /relationship-invitations?state=PENDING',
    ],
  );
  assert.deepEqual(JSON.parse(String(llamadas[0]?.init.body)), { scope: { code: 'ENTRENAMIENTO' }, purpose: 'PLANIFICACION_DEL_ENTRENAMIENTO' });
  assert.equal((llamadas[0]?.init.headers as Record<string, string>)['Idempotency-Key'], 'clave-de-prueba-01');
  assert.deepEqual(JSON.parse(String(llamadas[1]?.init.body)), { token: TOKEN });
  assert.equal((llamadas[1]?.init.headers as Record<string, string>)['Idempotency-Key'], undefined);
  assert.deepEqual(JSON.parse(String(llamadas[2]?.init.body)), { code: 'ABCD-EFGH' });
  for (const l of llamadas) assert.ok(!l.url.includes(TOKEN) && !l.url.includes('ABCD'), l.url);
});
