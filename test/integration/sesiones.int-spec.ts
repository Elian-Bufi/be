/**
 * WP-02 · Sesiones (API-ACC-02…05, UC-P26) contra PostgreSQL real.
 * TEST-AUTH-001 · TEST-RF-002 · TEST-UC-P26 · TEST-CT-ACC-02…05 · TEST-RNF-SEC-003 · suspensión revoca sesiones (INV-06-28)
 */
import type { INestApplication } from '@nestjs/common';
import { IniciarSesionResponseSchema, MeResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { CredencialesService } from '../../apps/api/src/plataforma/credenciales.service';
import request from 'supertest';
import {
  appDePrueba,
  conSesion,
  correoSintetico,
  cuerpoDeCierre,
  CREDENCIAL_SINTETICA,
  login,
  mediana,
  OTRA_CREDENCIAL_SINTETICA,
  registrar,
  registrarOk,
  tokenDe,
  transicionPorServicio,
} from './soporte-api';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const NEUTRAL = { error: { code: 'INVALID_CREDENTIALS', message: 'No pudimos verificar los datos de acceso.' } };

describe('TEST-AUTH-001 — login inválido neutral', () => {
  let existente: string;
  let suspendida: string;
  let cerrada: string;

  beforeAll(async () => {
    existente = correoSintetico('auth001-existente');
    suspendida = correoSintetico('auth001-suspendida');
    cerrada = correoSintetico('auth001-cerrada');
    await registrarOk(app, existente);
    const idSuspendida = await registrarOk(app, suspendida);
    await transicionPorServicio(app, idSuspendida, 'SuspenderCuenta');
    await registrarOk(app, cerrada);
    const token = await tokenDe(app, cerrada);
    await conSesion(app, token).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()).expect(201);
  });

  const casos = () => [
    ['identificador inexistente', correoSintetico('auth001-nadie'), CREDENCIAL_SINTETICA],
    ['contraseña incorrecta', existente, OTRA_CREDENCIAL_SINTETICA],
    ['cuenta SUSPENDIDA con contraseña correcta', suspendida, CREDENCIAL_SINTETICA],
    ['cuenta CERRADA con contraseña correcta', cerrada, CREDENCIAL_SINTETICA],
  ] as const;

  it('TEST-AUTH-001: código, cuerpo y headers indistinguibles; sin details; ninguna sesión creada', async () => {
    const sesionesAntes = await prisma.sesion.count();
    const respuestas = [];
    for (const [, identificador, credencial] of casos()) respuestas.push(await login(app, identificador, credencial));
    for (const r of respuestas) {
      expect(r.status).toBe(401);
      expect(r.body).toEqual(NEUTRAL);
      expect(r.headers['content-length']).toBe(respuestas[0].headers['content-length']);
      expect(r.headers['content-type']).toBe(respuestas[0].headers['content-type']);
      expect(r.headers['www-authenticate']).toBeUndefined();
    }
    expect(await prisma.sesion.count()).toBe(sesionesAntes);
  });

  it('TEST-AUTH-001: la causa real queda solo en la auditoría interna (09v7 T16)', async () => {
    const [, identificador, credencial] = casos()[2];
    const r = await login(app, identificador, credencial).expect(401);
    const fila = await prisma.registroDeAuditoria.findFirst({ where: { requestId: r.headers['x-request-id'] } });
    expect(fila).toMatchObject({ operacion: 'API-ACC-02', resultado: 'RECHAZO', motivo: 'CUENTA_SUSPENDIDA' });
  });

  it('TEST-AUTH-001: el hash señuelo usa el costo de los hashes guardados aunque BCRYPT_COST cambie (DL-014)', async () => {
    await registrarOk(app, correoSintetico('costo')); // garantiza al menos un hash de costo 10 en la base
    const otra = await appDePrueba({ costoBcrypt: 12 });
    try {
      expect(otra.get(CredencialesService).costoDelSenuelo()).toBe(10);
    } finally {
      await otra.close();
    }
  });

  it('TEST-AUTH-001: tiempo indistinguible — medianas dentro de max(50 ms, 35 %) (DEUDA_LEGAJO DL-014)', async () => {
    const lista = casos();
    const tiempos: number[][] = lista.map(() => []);
    await login(app, existente, OTRA_CREDENCIAL_SINTETICA); // calentamiento
    for (let vuelta = 0; vuelta < 12; vuelta++) {
      // Intercalado: la carga de la máquina afecta a todos los casos por igual.
      for (let i = 0; i < lista.length; i++) {
        const [, identificador, credencial] = lista[i];
        const inicio = process.hrtime.bigint();
        await login(app, identificador, credencial).expect(401);
        tiempos[i].push(Number(process.hrtime.bigint() - inicio) / 1e6);
      }
    }
    const medianas = tiempos.map(mediana);
    const referencia = medianas[1]; // contraseña incorrecta: la rama con usuario real
    const tolerancia = Math.max(50, referencia * 0.35);
    process.stdout.write(
      `${JSON.stringify({ prueba: 'TEST-AUTH-001', medianasMs: Object.fromEntries(lista.map(([n], i) => [n, Math.round(medianas[i] * 10) / 10])), toleranciaMs: Math.round(tolerancia) })}\n`,
    );
    for (const m of medianas) expect(Math.abs(m - referencia)).toBeLessThanOrEqual(tolerancia);
  });
});

describe('TEST-RF-002 / TEST-UC-P26 / TEST-CT-ACC-02…05 — sesión local', () => {
  it('TEST-CT-ACC-02: login 201 con el contrato exacto; Bearer de 12 h, sin renovación; fila de sesión con superficie', async () => {
    const correo = correoSintetico('ct02');
    const id = await registrarOk(app, correo);
    const res = await login(app, `  ${correo.toUpperCase()}  `, CREDENCIAL_SINTETICA, 'APK').expect(201);
    const cuerpo = IniciarSesionResponseSchema.parse(res.body);
    expect(cuerpo.data.actor).toEqual({ identityId: id, accountOperationalState: 'OPERATIVA' });
    expect(cuerpo.data.session).toMatchObject({ renewable: false, tokenType: 'Bearer' });
    const duracion = new Date(cuerpo.data.session.expiresAt).getTime() - Date.now();
    expect(duracion).toBeGreaterThan(11.9 * 3600_000);
    expect(duracion).toBeLessThanOrEqual(12 * 3600_000);
    const sesion = await prisma.sesion.findUniqueOrThrow({ where: { id: cuerpo.data.session.id } });
    expect(sesion).toMatchObject({ identidadId: id, estado: 'ACTIVA', superficie: 'APK', versionDeControl: 0 });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('TEST-CT-ACC-05: /me devuelve identidad, estado y sesión propios; nunca hash, token ni A3', async () => {
    const correo = correoSintetico('ct05');
    const id = await registrarOk(app, correo);
    const sesion = await login(app, correo).expect(201);
    const token = sesion.body.data.session.accessToken as string;
    const res = await conSesion(app, token).get('/api/v1/me').expect(200);
    const cuerpo = MeResponseSchema.parse(res.body);
    expect(cuerpo.data).toEqual({
      identityId: id,
      accountOperationalState: 'OPERATIVA',
      registrationIntent: 'ADVISEE',
      profile: {},
      actorCapabilities: [],
      session: { id: sesion.body.data.session.id, expiresAt: sesion.body.data.session.expiresAt },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/hash|token|consent|password|credential|example\.invalid/i);
  });

  it.each([
    ['sin Authorization', undefined, 'AUTHENTICATION_REQUIRED'],
    ['esquema no Bearer', 'Basic abc', 'AUTHENTICATION_REQUIRED'],
    ['token basura', 'Bearer no-es-un-jwt', 'SESSION_INVALID'],
  ])('TEST-CT-ACC-05: %s → 401 %s', async (_caso, encabezado, code) => {
    const req = request(app.getHttpServer()).get('/api/v1/me');
    if (encabezado) req.set('Authorization', encabezado);
    const res = await req.expect(401);
    expect(res.body.error.code).toBe(code);
  });

  it('TEST-CT-ACC-05: token firmado con otro secreto o con alg none → 401 SESSION_INVALID', async () => {
    const correo = correoSintetico('forjado');
    const id = await registrarOk(app, correo);
    const real = await login(app, correo).expect(201);
    const sid = real.body.data.session.id as string;
    const exp = Math.floor(Date.now() / 1000) + 600;
    const otroSecreto = jwt.sign({ sid, tv: 0, exp }, 'otro-secreto-sintetico-de-32-caracteres-xx', {
      subject: id,
      issuer: 'be-api',
      audience: 'be',
    });
    const sinFirma = jwt.sign({ sid, tv: 0, exp, sub: id, iss: 'be-api', aud: 'be' }, '', { algorithm: 'none' });
    for (const token of [otroSecreto, sinFirma]) {
      const res = await conSesion(app, token).get('/api/v1/me').expect(401);
      expect(res.body.error.code).toBe('SESSION_INVALID');
    }
  });

  it('TEST-UC-P26: logout (ACC-03) finaliza la sesión actual; la request siguiente da 401; repetir es idempotente; la cuenta sigue OPERATIVA', async () => {
    const correo = correoSintetico('logout');
    const id = await registrarOk(app, correo);
    const res = await login(app, correo).expect(201);
    const token = res.body.data.session.accessToken as string;
    await conSesion(app, token).delete('/api/v1/auth/sessions/current').expect(204);
    expect((await conSesion(app, token).get('/api/v1/me').expect(401)).body.error.code).toBe('SESSION_REVOKED');
    const repetido = await conSesion(app, token).delete('/api/v1/auth/sessions/current').expect(204);
    // DL-029: el 204 idempotente de una sesión que ya no estaba activa no se audita como éxito.
    expect(await prisma.registroDeAuditoria.findFirst({ where: { requestId: repetido.headers['x-request-id'] } })).toMatchObject({
      operacion: 'API-ACC-03',
      resultado: 'RECHAZO',
      motivo: 'SESION_YA_NO_ACTIVA',
    });
    const sesion = await prisma.sesion.findUniqueOrThrow({ where: { id: res.body.data.session.id } });
    expect(sesion.estado).toBe('FINALIZADA');
    expect(sesion.momentoDeFinalizacion).toBeInstanceOf(Date);
    // «Finalizar sesión no cierra la cuenta» (05 UC-P26).
    expect((await prisma.identidad.findUniqueOrThrow({ where: { id } })).estadoOperativoDeCuenta).toBe('OPERATIVA');
    await login(app, correo).expect(201);
  });

  it('TEST-CT-ACC-04: revocar todas (ACC-04) invalida las sesiones de web y APK en la request siguiente', async () => {
    const correo = correoSintetico('revocar-todas');
    await registrarOk(app, correo);
    const web = await tokenDe(app, correo, 'WEB');
    const apk = await tokenDe(app, correo, 'APK');
    await conSesion(app, web).get('/api/v1/me').expect(200);
    await conSesion(app, apk).delete('/api/v1/auth/sessions').expect(204);
    for (const token of [web, apk]) {
      expect((await conSesion(app, token).get('/api/v1/me').expect(401)).body.error.code).toBe('SESSION_REVOKED');
    }
    // Una sesión nueva vuelve a funcionar (la versión de control avanzó y la nueva la toma).
    const nueva = await tokenDe(app, correo);
    await conSesion(app, nueva).get('/api/v1/me').expect(200);
  });

  it('TEST-RF-002: parámetros de query no declarados en /me → 400 INVALID_REQUEST (09 §3.1)', async () => {
    const correo = correoSintetico('query');
    await registrarOk(app, correo);
    const token = await tokenDe(app, correo);
    const res = await conSesion(app, token).get('/api/v1/me?identityId=otra').expect(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });
});

describe('Suspensión revoca sesiones — INV-06-28 · 09v8 «suspensión que exige revocación invalida sesión»', () => {
  it('TEST-RF-002: SuspenderCuenta revoca las sesiones vigentes, bloquea el login y RestablecerCuenta no las revive', async () => {
    const correo = correoSintetico('suspension');
    const id = await registrarOk(app, correo);
    const token = await tokenDe(app, correo);
    await conSesion(app, token).get('/api/v1/me').expect(200);

    const evaluacion = await transicionPorServicio(app, id, 'SuspenderCuenta');
    expect(evaluacion.permitida).toBe(true);
    expect((await conSesion(app, token).get('/api/v1/me').expect(401)).body.error.code).toBe('SESSION_REVOKED');
    const antes = await prisma.sesion.count({ where: { identidadId: id } });
    expect((await login(app, correo).expect(401)).body).toEqual(NEUTRAL);
    expect(await prisma.sesion.count({ where: { identidadId: id } })).toBe(antes);
    const revocadas = await prisma.sesion.findMany({ where: { identidadId: id } });
    expect(revocadas.every((s) => s.estado === 'REVOCADA' && s.motivoDeRevocacion === 'SUSPENSION_DE_CUENTA')).toBe(true);

    await transicionPorServicio(app, id, 'RestablecerCuenta');
    await conSesion(app, token).get('/api/v1/me').expect(401);
    await login(app, correo).expect(201);
  });
});

describe('TEST-RNF-SEC-003 — límite de intentos neutral', () => {
  let limitada: INestApplication;
  beforeAll(async () => {
    limitada = await appDePrueba({
      limites: {
        login: { maximo: 3, ventanaMs: 60_000 },
        loginPorIp: { maximo: 12, ventanaMs: 60_000 },
        loginPorIdentificador: { maximo: 100, ventanaMs: 60_000 },
        registro: { maximo: 2, ventanaMs: 60_000 },
      },
    });
  });
  afterAll(() => limitada.close());

  it('TEST-RNF-SEC-003: login — 429 RATE_LIMITED idéntico exista o no la cuenta, aun con la contraseña correcta', async () => {
    const correo = correoSintetico('limite');
    await registrarOk(app, correo);
    const inexistente = correoSintetico('limite-nadie');
    for (let i = 0; i < 3; i++) {
      await login(limitada, correo, OTRA_CREDENCIAL_SINTETICA).expect(401);
      await login(limitada, inexistente, OTRA_CREDENCIAL_SINTETICA).expect(401);
    }
    const a = await login(limitada, correo, CREDENCIAL_SINTETICA).expect(429);
    const b = await login(limitada, inexistente, CREDENCIAL_SINTETICA).expect(429);
    expect(a.body).toEqual({ error: { code: 'RATE_LIMITED', message: 'Demasiados intentos. Probá de nuevo más tarde.' } });
    expect(b.body).toEqual(a.body);
    // El límite es por IP + identificador: otra cuenta no queda bloqueada por intentos ajenos.
    const otra = correoSintetico('limite-otra');
    await registrarOk(app, otra);
    await login(limitada, otra).expect(201);
  });

  it('TEST-RNF-SEC-003: login — cupo global por red (08:786): identificadores distintos desde la misma red también se frenan', async () => {
    const global = await appDePrueba({
      limites: {
        login: { maximo: 100, ventanaMs: 60_000 },
        loginPorIp: { maximo: 4, ventanaMs: 60_000 },
        loginPorIdentificador: { maximo: 100, ventanaMs: 60_000 },
        registro: { maximo: 100, ventanaMs: 60_000 },
      },
    });
    try {
      for (let i = 0; i < 4; i++) await login(global, correoSintetico(`spray-${i}`), OTRA_CREDENCIAL_SINTETICA).expect(401);
      const r = await login(global, correoSintetico('spray-5'), OTRA_CREDENCIAL_SINTETICA).expect(429);
      expect(r.body.error.code).toBe('RATE_LIMITED');
    } finally {
      await global.close();
    }
  });

  it('TEST-RNF-SEC-003: login — cupo por identificador desde cualquier red (DL-030): un pool de IPs no multiplica los intentos contra una cuenta', async () => {
    const pool = await appDePrueba(
      {
        saltosDeProxy: 1,
        limites: {
          login: { maximo: 100, ventanaMs: 60_000 },
          loginPorIp: { maximo: 100, ventanaMs: 60_000 },
          loginPorIdentificador: { maximo: 3, ventanaMs: 60_000 },
          registro: { maximo: 100, ventanaMs: 60_000 },
        },
      },
    );
    try {
      const correo = correoSintetico('pool');
      await registrarOk(app, correo);
      // Cada intento llega desde otra dirección del «proxy» (X-Forwarded-For confiable a un salto).
      for (let i = 1; i <= 3; i++) await login(pool, correo, OTRA_CREDENCIAL_SINTETICA).set('X-Forwarded-For', `203.0.113.${i}`).expect(401);
      const r = await login(pool, correo, CREDENCIAL_SINTETICA).set('X-Forwarded-For', '203.0.113.99').expect(429);
      expect(r.body.error.code).toBe('RATE_LIMITED');
      // Neutral: un identificador inexistente se frena igual.
      const nadie = correoSintetico('pool-nadie');
      for (let i = 1; i <= 3; i++) await login(pool, nadie, OTRA_CREDENCIAL_SINTETICA).set('X-Forwarded-For', `198.51.100.${i}`).expect(401);
      await login(pool, nadie, OTRA_CREDENCIAL_SINTETICA).set('X-Forwarded-For', '198.51.100.99').expect(429);
    } finally {
      await pool.close();
    }
  });

  it('TEST-RNF-SEC-003: registro — 429 al superar el límite por IP, sin crear identidad', async () => {
    await registrar(limitada, correoSintetico('lim-reg-1')).expect(201);
    await registrar(limitada, correoSintetico('lim-reg-2')).expect(201);
    const correo = correoSintetico('lim-reg-3');
    const res = await registrar(limitada, correo).expect(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(await prisma.metodoDeAcceso.count({ where: { referencia: correo } })).toBe(0);
  });
});
