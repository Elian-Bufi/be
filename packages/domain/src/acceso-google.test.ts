/**
 * WP-ACCESO-GOOGLE (DL-138): el contrato de la familia GOO, la declaración de mayoría de edad del alta (08 §24.7 a), el
 * cliente y el copy. Datos sintéticos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearClienteBe } from './cliente-http';
import { RegistrarIdentidadRequestSchema } from './contratos';
import {
  DetalleDeCuentaDeGoogleInexistenteSchema,
  DetalleDeCuentaDeGoogleSchema,
  IniciarSesionConGoogleRequestSchema,
  LARGO_MAXIMO_DEL_ID_TOKEN,
  RegistrarConGoogleRequestSchema,
  RUTAS_DE_ACCESO_GOOGLE,
  VincularGoogleRequestSchema,
} from './contratos-acceso-google';
import { COPY_ACCESO_GOOGLE } from './copy-acceso-google';
import { declaracionDeMayoriaDeEdad, ISSUE_DE_MAYORIA_DE_EDAD, problemaDeMayoriaDeEdad } from './mayoria-de-edad';
import { documentoOpenApi, erroresDeclarados, OPERACIONES } from './openapi';
import { VERSION_VIGENTE } from './textos';

const SESION = {
  data: {
    session: { id: 's1', expiresAt: '2026-10-17T00:00:00.000Z', renewable: false, accessToken: 'token-sintetico', tokenType: 'Bearer' },
    actor: { identityId: 'i1', accountOperationalState: 'OPERATIVA' },
  },
};

interface Llamada {
  url: string;
  init: RequestInit;
}

function fetchFalso(status: number, cuerpo: unknown, llamadas: Llamada[] = []): typeof fetch {
  return (async (url: string, init: RequestInit) => {
    llamadas.push({ url, init });
    return new Response(JSON.stringify(cuerpo), { status });
  }) as unknown as typeof fetch;
}

test('mayoría de edad: falta, sin marcar, otra versión o vigente; el cuerpo que manda el cliente es la versión vigente', () => {
  const vigente = VERSION_VIGENTE.MAYORIA_DE_EDAD.id;
  assert.equal(problemaDeMayoriaDeEdad(undefined), 'FALTA');
  assert.equal(problemaDeMayoriaDeEdad({ versionId: vigente, declared: false }), 'SIN_DECLARAR');
  assert.equal(problemaDeMayoriaDeEdad({ versionId: 'otra', declared: true }), 'VERSION_NO_VIGENTE');
  assert.equal(problemaDeMayoriaDeEdad({ versionId: vigente, declared: true }), null);
  assert.deepEqual(declaracionDeMayoriaDeEdad(true), { versionId: vigente, declared: true });
  assert.deepEqual(ISSUE_DE_MAYORIA_DE_EDAD, { REQUERIDA: 'ADULT_DECLARATION_REQUIRED', VERSION_NO_VIGENTE: 'ADULT_DECLARATION_VERSION_NOT_ACCEPTABLE' });
});

test('ACC-01: la declaración es optativa en el schema (la API decide con un 422), estricta, y sin fecha de nacimiento', () => {
  const base = {
    registrationIntent: 'ADVISEE',
    identity: { localIdentifier: 'persona@example.invalid', localCredential: 'clave-sintetica-01' },
    termsAcceptance: { versionId: 'a' },
    privacyAcknowledgement: { versionId: 'b' },
  };
  assert.ok(RegistrarIdentidadRequestSchema.safeParse(base).success);
  assert.ok(RegistrarIdentidadRequestSchema.safeParse({ ...base, adultDeclaration: declaracionDeMayoriaDeEdad(true) }).success);
  assert.ok(!RegistrarIdentidadRequestSchema.safeParse({ ...base, adultDeclaration: { ...declaracionDeMayoriaDeEdad(true), birthDate: '2000-01-01' } }).success);
  assert.ok(!RegistrarIdentidadRequestSchema.safeParse({ ...base, adultDeclaration: true }).success);
});

test('GOO: el ID token va en el cuerpo, con tope; vincular pide la contraseña; el alta, los mismos actos que ACC-01', () => {
  assert.ok(IniciarSesionConGoogleRequestSchema.safeParse({ idToken: 'a.b.c' }).success);
  assert.ok(!IniciarSesionConGoogleRequestSchema.safeParse({ idToken: '' }).success);
  assert.ok(!IniciarSesionConGoogleRequestSchema.safeParse({ idToken: 'x'.repeat(LARGO_MAXIMO_DEL_ID_TOKEN + 1) }).success);
  assert.ok(!IniciarSesionConGoogleRequestSchema.safeParse({ idToken: 'a.b.c', email: 'x@example.invalid' }).success, 'el correo lo dice el token, no el cliente');
  assert.ok(!VincularGoogleRequestSchema.safeParse({ idToken: 'a.b.c' }).success);
  assert.ok(VincularGoogleRequestSchema.safeParse({ idToken: 'a.b.c', credential: 'clave' }).success);
  const alta = { idToken: 'a.b.c', registrationIntent: 'ADVISEE', termsAcceptance: { versionId: 'a' }, privacyAcknowledgement: { versionId: 'b' } };
  assert.ok(RegistrarConGoogleRequestSchema.safeParse({ ...alta, adultDeclaration: declaracionDeMayoriaDeEdad(true) }).success);
  assert.ok(!RegistrarConGoogleRequestSchema.safeParse({ ...alta, identity: { localCredential: 'x' } }).success, 'sin contraseña');
  assert.ok(DetalleDeCuentaDeGoogleSchema.safeParse({ email: 'persona@example.invalid' }).success);
});

test('OpenAPI: GOO-01 a 03 bajo /auth/federated/google, públicas, sin Idempotency-Key, con sus errores y el correo en details', () => {
  const goo = OPERACIONES.filter((o) => o.id.startsWith('API-GOO-'));
  assert.deepEqual(
    goo.map((o) => `${o.id} ${o.metodo.toUpperCase()} ${o.ruta}`),
    [
      `API-GOO-01 POST ${RUTAS_DE_ACCESO_GOOGLE.sesiones}`,
      `API-GOO-02 POST ${RUTAS_DE_ACCESO_GOOGLE.vinculos}`,
      `API-GOO-03 POST ${RUTAS_DE_ACCESO_GOOGLE.registros}`,
    ],
  );
  for (const op of goo) {
    assert.equal(op.autenticacion, 'PUBLIC');
    assert.equal(op.idempotencia, false);
    assert.match(op.fuente, /DL-138/);
    const errores = erroresDeclarados(op.id);
    // UC-E05 E01: Google sin configurar o sin responder, sumado al 503 común de la base.
    assert.deepEqual(errores['503'], ['DEPENDENCY_UNAVAILABLE', 'DB_UNAVAILABLE']);
    assert.deepEqual(errores['401'], ['GOOGLE_TOKEN_INVALID', 'INVALID_CREDENTIALS']);
    assert.ok(errores['422']!.includes('GOOGLE_EMAIL_NOT_VERIFIED'));
  }
  assert.deepEqual(erroresDeclarados('API-GOO-01')['404'], ['GOOGLE_ACCOUNT_NOT_FOUND']);
  assert.deepEqual(erroresDeclarados('API-GOO-01')['409'], ['GOOGLE_LINK_REQUIRED', 'GOOGLE_ACCOUNT_UNLINKED']);
  // Las dos que escriben suman el 409 transversal del conflicto concurrente (un deadlock que persiste).
  assert.deepEqual(erroresDeclarados('API-GOO-02')['409'], ['GOOGLE_ACCOUNT_ALREADY_LINKED', 'RESOURCE_CONFLICT']);
  assert.deepEqual(erroresDeclarados('API-GOO-03')['409'], ['GOOGLE_LINK_REQUIRED', 'REGISTRATION_NOT_AVAILABLE', 'GOOGLE_ACCOUNT_UNLINKED', 'RESOURCE_CONFLICT']);
  assert.deepEqual(
    OPERACIONES.find((o) => o.id === 'API-GOO-03')!.exitos.map((e) => e.status),
    [201, 200],
  );
  assert.ok(erroresDeclarados('API-ACC-01')['422']!.includes('VALIDATION_FAILED'));
  // El correo de la cuenta de Google, en details del 404 y del 409, documentado en el OpenAPI.
  const paths = documentoOpenApi().paths as Record<string, Record<string, { responses: Record<string, { description: string; content: { 'application/json': { schema: unknown } } }> }>>;
  const goo01 = paths[RUTAS_DE_ACCESO_GOOGLE.sesiones]!.post!.responses;
  assert.match(goo01['404']!.description, /GOOGLE_ACCOUNT_NOT_FOUND: details\.email/);
  // DL-169 (UF-D2): el 404 trae también el nombre de la cuenta de Google, para proponerlo.
  assert.match(goo01['404']!.description, /details\.name/);
  assert.match(JSON.stringify(goo01['404']!.content['application/json'].schema), /"name"/);
  assert.match(goo01['409']!.description, /GOOGLE_LINK_REQUIRED: details\.email/);
  assert.match(JSON.stringify(goo01['409']!.content['application/json'].schema), /"email"/);
});

test('cliente: el alta envía la declaración solo si la pantalla la pasa; con Google, A1, A2 y la declaración marcada', async () => {
  const llamadas: Llamada[] = [];
  const cliente = crearClienteBe({ baseUrl: 'https://api.example.invalid/api/v1', superficie: 'APK', fetch: fetchFalso(201, SESION, llamadas) });
  await cliente.registrar({ correo: 'persona@example.invalid', contrasena: 'clave-sintetica-01', nombre: 'Persona Sintética', mayoriaDeEdad: true }, 'clave-de-prueba-01');
  assert.deepEqual(JSON.parse(String(llamadas[0]!.init.body)).adultDeclaration, { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true });
  await cliente.registrar({ correo: 'persona@example.invalid', contrasena: 'clave-sintetica-01', nombre: 'Persona Sintética' }, 'clave-de-prueba-02');
  assert.equal('adultDeclaration' in JSON.parse(String(llamadas[1]!.init.body)), false, 'sin la casilla, el cliente no declara por la persona');

  const r = await cliente.registrarConGoogle('id-token-sintetico', true, 'Persona de Google');
  assert.equal(r.ok, true);
  assert.equal(llamadas[2]!.url, `https://api.example.invalid/api/v1${RUTAS_DE_ACCESO_GOOGLE.registros}`);
  const cuerpo = JSON.parse(String(llamadas[2]!.init.body));
  assert.deepEqual(cuerpo, {
    idToken: 'id-token-sintetico',
    registrationIntent: 'ADVISEE',
    profile: { displayName: 'Persona de Google' },
    termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
    privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
    adultDeclaration: { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
  });
  // El ID token viaja en el cuerpo, nunca en la URL.
  assert.ok(llamadas.every((l) => !l.url.includes('id-token-sintetico')));
});

test('cliente: entrar y vincular con Google van a sus rutas con el token en el cuerpo; el correo de details llega como correoDeGoogle', async () => {
  const llamadas: Llamada[] = [];
  const ok = crearClienteBe({ baseUrl: '/api/v1', superficie: 'WEB', fetch: fetchFalso(201, SESION, llamadas) });
  assert.equal((await ok.iniciarSesionConGoogle('t1')).ok, true);
  assert.equal((await ok.vincularGoogle('t2', 'clave-sintetica-01')).ok, true);
  assert.equal(llamadas[0]!.url, `/api/v1${RUTAS_DE_ACCESO_GOOGLE.sesiones}`);
  assert.deepEqual(JSON.parse(String(llamadas[0]!.init.body)), { idToken: 't1' });
  assert.equal(llamadas[1]!.url, `/api/v1${RUTAS_DE_ACCESO_GOOGLE.vinculos}`);
  assert.deepEqual(JSON.parse(String(llamadas[1]!.init.body)), { idToken: 't2', credential: 'clave-sintetica-01' });

  const vincular = crearClienteBe({
    baseUrl: '/api/v1',
    superficie: 'WEB',
    fetch: fetchFalso(409, { error: { code: 'GOOGLE_LINK_REQUIRED', message: 'x', details: { email: 'persona@example.invalid' } } }),
  });
  assert.deepEqual(await vincular.iniciarSesionConGoogle('t3'), { ok: false, tipo: 'API', status: 409, codigo: 'GOOGLE_LINK_REQUIRED', issues: [], correoDeGoogle: 'persona@example.invalid' });
  // Otro código con details no se interpreta como correo.
  const otro = crearClienteBe({ baseUrl: '/api/v1', superficie: 'WEB', fetch: fetchFalso(409, { error: { code: 'RESOURCE_CONFLICT', message: 'x', details: { email: 'persona@example.invalid' } } }) });
  assert.equal('correoDeGoogle' in (await otro.iniciarSesionConGoogle('t4')), false);
});

test('copy de Google: sin códigos técnicos ni frases prohibidas por el 10, y siempre con la salida del correo y la contraseña', () => {
  const todo = Object.values(COPY_ACCESO_GOOGLE)
    .map((v) => (typeof v === 'function' ? v('persona@example.invalid') : v))
    .join('\n');
  for (const prohibida of ['ya tiene una cuenta', 'usuario inexistente', 'contraseña incorrecta', 'GOOGLE_', 'token', 'sub ']) {
    assert.equal(todo.includes(prohibida), false, prohibida);
  }
  assert.match(COPY_ACCESO_GOOGLE.noDisponible, /correo y tu contraseña/);
  assert.match(COPY_ACCESO_GOOGLE.vincularTexto('persona@example.invalid'), /persona@example\.invalid/);
});

test('TEST-UF-002 · cliente: el 404 de una cuenta de Google sin identidad trae el correo y el nombre que propone la API (UF-D2)', async () => {
  const conNombre = crearClienteBe({
    baseUrl: '/api/v1',
    superficie: 'APK',
    fetch: fetchFalso(404, { error: { code: 'GOOGLE_ACCOUNT_NOT_FOUND', message: 'x', details: { email: 'persona@example.invalid', name: 'Persona de Google' } } }),
  });
  assert.deepEqual(await conNombre.iniciarSesionConGoogle('t5'), {
    ok: false,
    tipo: 'API',
    status: 404,
    codigo: 'GOOGLE_ACCOUNT_NOT_FOUND',
    issues: [],
    correoDeGoogle: 'persona@example.invalid',
    nombreDeGoogle: 'Persona de Google',
  });
  const sinNombre = crearClienteBe({
    baseUrl: '/api/v1',
    superficie: 'WEB',
    fetch: fetchFalso(404, { error: { code: 'GOOGLE_ACCOUNT_NOT_FOUND', message: 'x', details: { email: 'persona@example.invalid', name: null } } }),
  });
  const r = await sinNombre.iniciarSesionConGoogle('t6');
  assert.equal(r.ok === false && r.tipo === 'API' ? r.nombreDeGoogle : 'otro', null);
  assert.ok(DetalleDeCuentaDeGoogleInexistenteSchema.safeParse({ email: 'persona@example.invalid', name: null }).success);
  assert.equal(DetalleDeCuentaDeGoogleInexistenteSchema.safeParse({ email: 'persona@example.invalid' }).success, false, 'el nombre viene siempre, aunque sea null');
});

test('TEST-UF-001 y 002 · el alta con correo y la de Google aceptan el nombre en el perfil, y sin él el schema no corta: la API responde el 422 preciso', () => {
  const alta = {
    registrationIntent: 'ADVISEE',
    identity: { localIdentifier: 'persona@example.invalid', localCredential: 'clave-sintetica-01' },
    termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
    privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
  };
  assert.ok(RegistrarIdentidadRequestSchema.safeParse({ ...alta, profile: { displayName: 'Persona Sintética' } }).success);
  assert.ok(RegistrarIdentidadRequestSchema.safeParse(alta).success, 'sin perfil: lo rechaza la API con TERMS_VERSION_NOT_ACCEPTABLE, no el schema');
  assert.ok(RegistrarIdentidadRequestSchema.safeParse({ ...alta, profile: {} }).success);
  assert.equal(RegistrarIdentidadRequestSchema.safeParse({ ...alta, profile: { displayName: 'Ana', alias: 'x' } }).success, false, 'el perfil sigue estricto');
  const conGoogle = { idToken: 't', registrationIntent: 'ADVISEE', termsAcceptance: alta.termsAcceptance, privacyAcknowledgement: alta.privacyAcknowledgement };
  assert.ok(RegistrarConGoogleRequestSchema.safeParse({ ...conGoogle, profile: { displayName: 'Persona de Google' } }).success);
  assert.ok(RegistrarConGoogleRequestSchema.safeParse(conGoogle).success);
});
