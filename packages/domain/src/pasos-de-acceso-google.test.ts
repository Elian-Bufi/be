/**
 * WP-ACCESO-GOOGLE (DL-138): la regla que comparten el website y la APK para seguir después de cada respuesta de la
 * familia GOO. Datos sintéticos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearClienteBe, type Resultado } from './cliente-http';
import type { IniciarSesionResponse } from './contratos';
import { COPY, MENSAJE_DE_CAMPO } from './copy';
import { COPY_ACCESO_GOOGLE } from './copy-acceso-google';
import { pasoDeAccesoConGoogle, type OperacionDeGoogle } from './pasos-de-acceso-google';

const SESION: IniciarSesionResponse = {
  data: {
    session: { id: 's1', expiresAt: '2026-10-17T00:00:00.000Z', renewable: false, accessToken: 'token-sintetico', tokenType: 'Bearer' },
    actor: { identityId: 'i1', accountOperationalState: 'OPERATIVA' },
  },
};

const rechazo = (status: number, codigo: string, extra: { issues?: { code: string; path: string }[]; correoDeGoogle?: string } = {}): Resultado<IniciarSesionResponse> => ({
  ok: false,
  tipo: 'API',
  status,
  codigo,
  issues: extra.issues ?? [],
  ...(extra.correoDeGoogle ? { correoDeGoogle: extra.correoDeGoogle } : {}),
});

const OPERACIONES: readonly OperacionDeGoogle[] = ['ENTRAR', 'VINCULAR', 'CREAR'];

test('con la sesión, la pantalla la guarda como la del login, con la hora del servidor si llegó', () => {
  assert.deepEqual(pasoDeAccesoConGoogle('ENTRAR', { ok: true, datos: SESION, fechaDelServidor: 'Fri, 16 Oct 2026 22:00:00 GMT' }, 'APK'), {
    tipo: 'SESION',
    sesion: SESION,
    fechaDelServidor: 'Fri, 16 Oct 2026 22:00:00 GMT',
  });
  assert.deepEqual(pasoDeAccesoConGoogle('CREAR', { ok: true, datos: SESION }, 'WEB'), { tipo: 'SESION', sesion: SESION, fechaDelServidor: null });
});

test('vincular o crear: el paso lleva el correo de la cuenta de Google; sin el correo, no se adivina', () => {
  assert.deepEqual(pasoDeAccesoConGoogle('ENTRAR', rechazo(409, 'GOOGLE_LINK_REQUIRED', { correoDeGoogle: 'persona@example.invalid' }), 'WEB'), {
    tipo: 'VINCULAR',
    correo: 'persona@example.invalid',
  });
  assert.deepEqual(pasoDeAccesoConGoogle('ENTRAR', rechazo(404, 'GOOGLE_ACCOUNT_NOT_FOUND', { correoDeGoogle: 'persona@example.invalid' }), 'APK'), {
    tipo: 'CREAR',
    correo: 'persona@example.invalid',
  });
  // Mientras la persona completaba el alta, alguien creó una cuenta con contraseña y ese correo: pasa a vincular.
  assert.deepEqual(pasoDeAccesoConGoogle('CREAR', rechazo(409, 'GOOGLE_LINK_REQUIRED', { correoDeGoogle: 'persona@example.invalid' }), 'WEB'), {
    tipo: 'VINCULAR',
    correo: 'persona@example.invalid',
  });
  assert.deepEqual(pasoDeAccesoConGoogle('ENTRAR', rechazo(409, 'GOOGLE_LINK_REQUIRED'), 'WEB'), { tipo: 'AVISO', mensaje: COPY_ACCESO_GOOGLE.noDisponible, reiniciar: true });
});

test('lo que dio Google ya no sirve: aviso y vuelta al correo y la contraseña, en las tres operaciones', () => {
  const casos: [number, string, string][] = [
    [401, 'GOOGLE_TOKEN_INVALID', COPY_ACCESO_GOOGLE.tokenInvalido],
    [422, 'GOOGLE_EMAIL_NOT_VERIFIED', COPY_ACCESO_GOOGLE.correoNoVerificado],
    [503, 'DEPENDENCY_UNAVAILABLE', COPY_ACCESO_GOOGLE.noDisponible],
  ];
  for (const operacion of OPERACIONES) {
    for (const [status, codigo, mensaje] of casos) {
      assert.deepEqual(pasoDeAccesoConGoogle(operacion, rechazo(status, codigo), 'WEB'), { tipo: 'AVISO', mensaje, reiniciar: true }, `${operacion} ${codigo}`);
    }
  }
  assert.deepEqual(pasoDeAccesoConGoogle('VINCULAR', rechazo(409, 'GOOGLE_ACCOUNT_ALREADY_LINKED'), 'APK'), { tipo: 'AVISO', mensaje: COPY_ACCESO_GOOGLE.yaVinculada, reiniciar: true });
  assert.deepEqual(pasoDeAccesoConGoogle('CREAR', rechazo(409, 'REGISTRATION_NOT_AVAILABLE'), 'WEB'), { tipo: 'AVISO', mensaje: COPY.registroNoDisponible, reiniciar: true });
});

test('al vincular, la contraseña se corrige en el mismo paso con el mensaje neutral del login; al entrar, la cuenta no opera', () => {
  assert.deepEqual(pasoDeAccesoConGoogle('VINCULAR', rechazo(401, 'INVALID_CREDENTIALS'), 'WEB'), { tipo: 'CAMPO', campo: 'contrasena', mensaje: COPY_ACCESO_GOOGLE.accesoFallido });
  assert.equal(COPY_ACCESO_GOOGLE.accesoFallido, COPY.loginFallido, 'el mismo texto que el login: no dice qué falló');
  assert.deepEqual(pasoDeAccesoConGoogle('VINCULAR', rechazo(400, 'INVALID_REQUEST', { issues: [{ code: 'REQUIRED', path: 'credential' }] }), 'APK'), {
    tipo: 'CAMPO',
    campo: 'contrasena',
    mensaje: COPY_ACCESO_GOOGLE.contrasenaRequerida,
  });
  assert.deepEqual(pasoDeAccesoConGoogle('ENTRAR', rechazo(401, 'INVALID_CREDENTIALS'), 'WEB'), { tipo: 'AVISO', mensaje: COPY_ACCESO_GOOGLE.accesoFallido, reiniciar: true });
  assert.deepEqual(pasoDeAccesoConGoogle('ENTRAR', rechazo(400, 'INVALID_REQUEST'), 'WEB'), { tipo: 'AVISO', mensaje: COPY_ACCESO_GOOGLE.tokenInvalido, reiniciar: true });
});

test('al crear, la casilla de mayoría de edad se marca en el mismo paso; un texto que cambió pide recargar o actualizar', () => {
  assert.deepEqual(pasoDeAccesoConGoogle('CREAR', rechazo(422, 'VALIDATION_FAILED', { issues: [{ code: 'ADULT_DECLARATION_REQUIRED', path: 'adultDeclaration.declared' }] }), 'WEB'), {
    tipo: 'CAMPO',
    campo: 'mayoriaDeEdad',
    mensaje: MENSAJE_DE_CAMPO.MAYORIA_REQUERIDA,
  });
  const otraVersion = rechazo(422, 'VALIDATION_FAILED', { issues: [{ code: 'ADULT_DECLARATION_VERSION_NOT_ACCEPTABLE', path: 'adultDeclaration.versionId' }] });
  assert.deepEqual(pasoDeAccesoConGoogle('CREAR', otraVersion, 'WEB'), { tipo: 'AVISO', mensaje: COPY.versionDesactualizada, reiniciar: false });
  assert.deepEqual(pasoDeAccesoConGoogle('CREAR', otraVersion, 'APK'), { tipo: 'AVISO', mensaje: COPY.versionDesactualizadaApk, reiniciar: false });
  assert.deepEqual(pasoDeAccesoConGoogle('CREAR', rechazo(422, 'TERMS_VERSION_NOT_ACCEPTABLE'), 'APK'), { tipo: 'AVISO', mensaje: COPY.versionDesactualizadaApk, reiniciar: false });
  assert.deepEqual(pasoDeAccesoConGoogle('CREAR', rechazo(422, 'PRIVACY_VERSION_NOT_ACCEPTABLE'), 'WEB'), { tipo: 'AVISO', mensaje: COPY.versionDesactualizada, reiniciar: false });
});

test('sin respuesta, demasiados intentos o una falla sin clasificar: aviso, y el paso sigue para reintentar', () => {
  assert.deepEqual(pasoDeAccesoConGoogle('CREAR', { ok: false, tipo: 'RED' }, 'APK'), { tipo: 'AVISO', mensaje: COPY.resultadoIncierto, reiniciar: false });
  assert.deepEqual(pasoDeAccesoConGoogle('VINCULAR', rechazo(429, 'RATE_LIMITED'), 'WEB'), { tipo: 'AVISO', mensaje: COPY.demasiadosIntentos, reiniciar: false });
  assert.deepEqual(pasoDeAccesoConGoogle('VINCULAR', rechazo(500, 'INTERNAL_ERROR'), 'WEB'), { tipo: 'AVISO', mensaje: COPY.noDisponible, reiniciar: false });
  assert.deepEqual(pasoDeAccesoConGoogle('ENTRAR', rechazo(503, 'DB_UNAVAILABLE'), 'WEB'), { tipo: 'AVISO', mensaje: COPY.noDisponible, reiniciar: false });
});

test('ningún paso muestra un código técnico', () => {
  const codigos = [
    'GOOGLE_LINK_REQUIRED',
    'GOOGLE_ACCOUNT_NOT_FOUND',
    'GOOGLE_TOKEN_INVALID',
    'GOOGLE_EMAIL_NOT_VERIFIED',
    'GOOGLE_ACCOUNT_ALREADY_LINKED',
    'DEPENDENCY_UNAVAILABLE',
    'INVALID_CREDENTIALS',
    'INVALID_REQUEST',
    'VALIDATION_FAILED',
    'TERMS_VERSION_NOT_ACCEPTABLE',
    'REGISTRATION_NOT_AVAILABLE',
    'RATE_LIMITED',
    'CODIGO_DESCONOCIDO',
  ];
  for (const operacion of OPERACIONES) {
    for (const codigo of codigos) {
      const paso = pasoDeAccesoConGoogle(operacion, rechazo(400, codigo), 'WEB');
      if (paso.tipo === 'AVISO' || paso.tipo === 'CAMPO') assert.doesNotMatch(paso.mensaje, /[A-Z]{3,}_[A-Z]/, `${operacion} ${codigo}`);
    }
  }
});

test('con el cliente real: el 409 de la API, con el correo en details, lleva a vincular con ese correo', async () => {
  const cliente = crearClienteBe({
    baseUrl: '/api/v1',
    superficie: 'WEB',
    fetch: (async () =>
      new Response(JSON.stringify({ error: { code: 'GOOGLE_LINK_REQUIRED', message: 'x', details: { email: 'persona@example.invalid' } } }), { status: 409 })) as unknown as typeof fetch,
  });
  assert.deepEqual(pasoDeAccesoConGoogle('ENTRAR', await cliente.iniciarSesionConGoogle('id-token-sintetico'), 'WEB'), { tipo: 'VINCULAR', correo: 'persona@example.invalid' });
});
