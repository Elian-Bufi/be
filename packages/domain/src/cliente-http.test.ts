import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearClienteBe } from './cliente-http';
import { COPY } from './copy';
import { VERSION_VIGENTE } from './textos';

interface Llamada {
  url: string;
  init: RequestInit;
}

function fetchFalso(status: number, cuerpo: unknown, llamadas: Llamada[] = []): typeof fetch {
  return (async (url: string, init: RequestInit) => {
    llamadas.push({ url, init });
    return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status });
  }) as unknown as typeof fetch;
}

const ALTA = {
  data: {
    identityId: '6f1c1a4e-0000-4000-8000-000000000001',
    registrationIntent: 'ADVISEE',
    accountOperationalState: 'OPERATIVA',
    createdAt: '2026-09-18T12:00:00.000Z',
  },
};

test('cliente: el registro envía A1 y A2 con la versión vigente, superficie e Idempotency-Key; nunca A3', async () => {
  const llamadas: Llamada[] = [];
  const cliente = crearClienteBe({ baseUrl: 'https://api.example.invalid/api/v1', superficie: 'APK', fetch: fetchFalso(201, ALTA, llamadas) });
  const r = await cliente.registrar({ correo: 'persona@example.invalid', contrasena: 'clave-sintetica-01' }, 'clave-de-prueba-01');
  assert.equal(r.ok, true);
  const [{ url, init }] = llamadas;
  assert.equal(url, 'https://api.example.invalid/api/v1/registrations');
  const encabezados = init.headers as Record<string, string>;
  assert.equal(encabezados['X-BE-Surface'], 'APK');
  assert.equal(encabezados['Idempotency-Key'], 'clave-de-prueba-01');
  assert.equal(init.credentials, 'omit');
  const cuerpo = JSON.parse(String(init.body));
  assert.deepEqual(cuerpo.termsAcceptance, { versionId: VERSION_VIGENTE.TERMINOS.id });
  assert.deepEqual(cuerpo.privacyAcknowledgement, { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id });
  assert.equal(JSON.stringify(cuerpo).includes(VERSION_VIGENTE.DATOS_SALUD_BE.id), false);
  assert.equal(cuerpo.registrationIntent, 'ADVISEE');
});

test('cliente: una respuesta 2xx con otra forma no se interpreta (validación de contrato)', async () => {
  const cliente = crearClienteBe({ baseUrl: '/api/v1', superficie: 'WEB', fetch: fetchFalso(201, { data: { identityId: 'x', rol: 'ADMIN' } }) });
  const r = await cliente.registrar({ correo: 'a@example.invalid', contrasena: 'clave-sintetica-01' }, 'clave-de-prueba-01');
  assert.deepEqual(r, { ok: false, tipo: 'API', status: 201, codigo: 'RESPUESTA_NO_RECONOCIDA', issues: [] });
});

test('cliente: un ErrorEnvelope se traduce a su código e issues, sin exponer el mensaje del servidor', async () => {
  const cliente = crearClienteBe({
    baseUrl: '/api/v1',
    superficie: 'WEB',
    fetch: fetchFalso(400, { error: { code: 'INVALID_REQUEST', message: 'x', details: { issues: [{ code: 'CREDENCIAL_DEMASIADO_CORTA', path: 'identity.localCredential' }] } } }),
  });
  const r = await cliente.registrar({ correo: 'a@example.invalid', contrasena: 'corta' }, 'clave-de-prueba-01');
  assert.deepEqual(r, { ok: false, tipo: 'API', status: 400, codigo: 'INVALID_REQUEST', issues: [{ code: 'CREDENCIAL_DEMASIADO_CORTA', path: 'identity.localCredential' }] });
});

test('cliente: sin respuesta de red el resultado es RED (incierto), nunca éxito', async () => {
  const cliente = crearClienteBe({
    baseUrl: '/api/v1',
    superficie: 'WEB',
    fetch: (async () => {
      throw new TypeError('sin conexión');
    }) as unknown as typeof fetch,
  });
  assert.deepEqual(await cliente.consultarCuenta('token'), { ok: false, tipo: 'RED' });
});

test('cliente: el cierre envía la versión de consecuencias mostrada y confirmación explícita, con Bearer', async () => {
  const llamadas: Llamada[] = [];
  const cliente = crearClienteBe({
    baseUrl: '/api/v1',
    superficie: 'WEB',
    fetch: fetchFalso(201, { data: { id: 'c1', identityId: 'i1', accountOperationalState: 'CERRADA', requestedAt: '2026-09-18T12:00:00.000Z' } }, llamadas),
  });
  const r = await cliente.solicitarCierre('token-sintetico', 'clave-de-prueba-02');
  assert.equal(r.ok, true);
  assert.equal((llamadas[0].init.headers as Record<string, string>).Authorization, 'Bearer token-sintetico');
  assert.deepEqual(JSON.parse(String(llamadas[0].init.body)), {
    consequencesAcknowledgement: { versionId: VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE.id },
    confirmed: true,
  });
});

test('copy: sin frases prohibidas por el 10 (10-B02, 10-ADD, 10-B10)', () => {
  const todo = JSON.stringify(COPY) + COPY.resumenDeErrores(2);
  for (const prohibida of ['Aceptar todo', 'ya tiene una cuenta', 'usuario inexistente', 'contraseña incorrecta', 'incompleta', 'Eliminar todos mis datos', 'Borrar historia', 'fueron borrados']) {
    assert.equal(todo.includes(prohibida), false, prohibida);
  }
  assert.equal(COPY.loginFallido, 'No pudimos verificar los datos de acceso.');
  assert.notEqual(COPY.a1Texto, COPY.a2Texto);
});

/**
 * Las dos colecciones de la familia ANT viven en rutas distintas y el legajo no las intercambia: la de las
 * registradas «no es una vía residual para leer un draft» (09v16:1718). Una pantalla que pida el borrador por la ruta
 * equivocada recibe un 404 y se ve como si no hubiera nada, que es justo lo que pasó una vez. Esta prueba fija a qué
 * ruta va cada método del cliente, que es donde ese error se cuela.
 */
test('cliente ANT: cada operación va a la ruta que declara el 09, y las dos colecciones no se cruzan', async () => {
  const rutas: string[] = [];
  const registrar = (): typeof fetch =>
    (async (url: string) => {
      rutas.push(new URL(url).pathname + new URL(url).search);
      // La forma de la respuesta no importa acá: lo que se verifica es a dónde fue la llamada.
      return new Response('{}', { status: 500 });
    }) as unknown as typeof fetch;
  const cliente = crearClienteBe({ baseUrl: 'https://api.example.invalid/api/v1', superficie: 'WEB', fetch: registrar() });
  const ase = '6f1c1a4e-0000-4000-8000-000000000001';
  const eval1 = '6f1c1a4e-0000-4000-8000-000000000002';
  const med = '6f1c1a4e-0000-4000-8000-000000000003';

  await cliente.crearEvaluacionAntropometrica(
    't',
    ase,
    { occurredAt: '2026-09-18T12:00:00.000Z', specificationVersionId: eval1, source: { type: 'DIRECT_CAPTURE' }, directMeasurements: [{ metricCode: 'peso', value: 1, unit: 'kg' }] },
    'k',
  );
  await cliente.crearBorradorAntropometrico('t', ase, {}, 'k');
  await cliente.listarBorradoresAntropometricos('t', ase);
  await cliente.listarEvaluacionesAntropometricas('t', ase);
  await cliente.consultarEvaluacionAntropometrica('t', eval1);
  await cliente.consultarBorradorAntropometrico('t', eval1);
  await cliente.guardarBorradorAntropometrico('t', eval1, { expectedVersion: 'v1', directMeasurements: [] });
  await cliente.registrarEvaluacionAntropometrica('t', eval1, 'v1', 'k');
  await cliente.corregirMedicion('t', eval1, { targetId: med, reason: 'x', magnitude: { value: 1, unit: 'kg' } }, 'k');
  await cliente.anularMedicion('t', med, { reason: 'x' }, 'k');
  await cliente.evolucionAntropometrica('t', ase, { metric: 'peso', periodStart: '2026-09-01', periodEnd: '2026-09-18' });

  assert.deepEqual(rutas, [
    `/api/v1/advisees/${ase}/anthropometry/evaluations`,
    `/api/v1/advisees/${ase}/anthropometry/evaluation-drafts`,
    `/api/v1/advisees/${ase}/anthropometry/evaluation-drafts`,
    `/api/v1/advisees/${ase}/anthropometry/evaluations`,
    `/api/v1/anthropometry/evaluations/${eval1}`,
    `/api/v1/anthropometry/evaluation-drafts/${eval1}`,
    `/api/v1/anthropometry/evaluation-drafts/${eval1}`,
    `/api/v1/anthropometry/evaluation-drafts/${eval1}/register`,
    `/api/v1/anthropometry/evaluations/${eval1}/corrections`,
    `/api/v1/anthropometry/measurements/${med}/annulments`,
    `/api/v1/advisees/${ase}/anthropometry/progress?metric=peso&periodStart=2026-09-01&periodEnd=2026-09-18`,
  ]);
});
