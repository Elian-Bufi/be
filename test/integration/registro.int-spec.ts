/**
 * WP-02 · Registro (API-ACC-01, UC-P25) contra PostgreSQL real.
 * TEST-AUTH-002 · TEST-RF-001 · TEST-UC-P25 · TEST-CT-ACC-01 · TEST-RNF-REC-002 · TEST-RNF-SEC-005 · TEST-DOM-008 · TEST-AUTH-009
 */
import type { INestApplication } from '@nestjs/common';
import {
  ErrorEnvelopeSchema,
  RegistrarIdentidadResponseSchema,
  RequisitoDeConsentimientoDeSaludResponseSchema,
  VERSION_VIGENTE,
} from '@be/domain';
import { Prisma, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AuditoriaService } from '../../apps/api/src/plataforma/auditoria.service';
import {
  appDePrueba,
  claveDeIdempotencia,
  conSesion,
  correoSintetico,
  cuerpoDeRegistro,
  registrar,
  registrarOk,
  tokenDe,
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

describe('TEST-AUTH-002 — el registro no concede A3', () => {
  it('TEST-AUTH-002: tras ACC-01 existen A1 y A2 separados con evidencia propia, cero A3, sin rol ni sesión', async () => {
    const correo = correoSintetico('auth002');
    const id = await registrarOk(app, correo, 'WEB');

    const actos = await prisma.actoRegistrable.findMany({ where: { identidadId: id }, orderBy: { tipo: 'asc' } });
    expect(actos.map((a) => a.tipo).sort()).toEqual(['PRIVACIDAD_INFO', 'TERMINOS']);
    expect(actos.filter((a) => a.tipo === 'DATOS_SALUD_BE')).toHaveLength(0);
    // 08 §12.2: cada acto con su versión, hash del texto mostrado, finalidad, superficie, actor y momento.
    for (const acto of actos) {
      const version = VERSION_VIGENTE[acto.tipo as 'TERMINOS' | 'PRIVACIDAD_INFO'];
      expect(acto).toMatchObject({
        estado: 'VIGENTE',
        versionDeTextoId: version.id,
        hashDelTexto: version.hash,
        finalidad: version.finalidad,
        superficie: 'WEB',
        actorId: id,
        autoriaId: id,
      });
      expect(acto.momentoDeOcurrencia).toBeInstanceOf(Date);
    }
    expect(actos[0].id).not.toBe(actos[1].id);
    // No se crea sesión en el alta (09v8 §2.2: sin auto-login).
    expect(await prisma.sesion.count({ where: { identidadId: id } })).toBe(0);
  });

  it('TEST-AUTH-002: CON-05 responde currentConsent null (A3 no otorgado) después del registro', async () => {
    const correo = correoSintetico('auth002-con05');
    await registrarOk(app, correo);
    const token = await tokenDe(app, correo);
    const res = await conSesion(app, token).get('/api/v1/me/health-data-consent-requirement').expect(200);
    const cuerpo = RequisitoDeConsentimientoDeSaludResponseSchema.parse(res.body);
    expect(cuerpo.data.currentConsent).toBeNull();
    expect(cuerpo.data.consentVersion.id).toBe(VERSION_VIGENTE.DATOS_SALUD_BE.id);
    expect(cuerpo.data.consentVersion.textHash).toBe(VERSION_VIGENTE.DATOS_SALUD_BE.hash);
  });

  it('TEST-AUTH-002: un campo de consentimiento A3 en el registro se rechaza con 400 UNKNOWN_FIELD y no crea nada', async () => {
    const correo = correoSintetico('auth002-a3');
    const res = await request(app.getHttpServer())
      .post('/api/v1/registrations')
      .set('Idempotency-Key', claveDeIdempotencia())
      .send({ ...cuerpoDeRegistro(correo), healthDataConsent: { versionId: VERSION_VIGENTE.DATOS_SALUD_BE.id } })
      .expect(400);
    expect(res.body.error.code).toBe('UNKNOWN_FIELD');
    expect(await prisma.metodoDeAcceso.count({ where: { referencia: correo } })).toBe(0);
  });
});

describe('TEST-RF-001 — una identidad por identificador, garantizado por índice único', () => {
  it('TEST-RF-001: 8 registros concurrentes con el mismo correo (keys distintas) crean exactamente 1 identidad', async () => {
    const correo = correoSintetico('concurrente');
    const respuestas = await Promise.all(Array.from({ length: 8 }, () => registrar(app, correo)));
    const estados = respuestas.map((r) => r.status).sort();
    expect(estados.filter((s) => s === 201)).toHaveLength(1);
    expect(estados.filter((s) => s === 409)).toHaveLength(7);
    for (const r of respuestas.filter((x) => x.status === 409)) {
      expect(r.body).toEqual({ error: { code: 'REGISTRATION_NOT_AVAILABLE', message: 'No pudimos completar el registro con esos datos.' } });
    }
    expect(await prisma.metodoDeAcceso.count({ where: { tipo: 'LOCAL', referencia: correo } })).toBe(1);
  });

  it('TEST-RF-001: mayúsculas y espacios no evaden la unicidad (identificador normalizado)', async () => {
    const correo = correoSintetico('normalizado');
    await registrarOk(app, correo);
    const res = await registrar(app, `  ${correo.toUpperCase()} `).expect(409);
    expect(res.body.error.code).toBe('REGISTRATION_NOT_AVAILABLE');
  });

  it('TEST-RF-001: la base rechaza por sí sola un segundo método LOCAL con la misma referencia (índice único)', async () => {
    const correo = correoSintetico('indice');
    const id = await registrarOk(app, correo);
    const procedencia = { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'INSERCION_DIRECTA', superficie: null, requestId: null };
    const error = await prisma.metodoDeAcceso
      .create({ data: { identidadId: id, tipo: 'LOCAL', referencia: correo, procedencia } })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect((error as Prisma.PrismaClientKnownRequestError).code).toBe('P2002');
    const [indice] = await prisma.$queryRaw<{ indexdef: string }[]>`
      SELECT indexdef FROM pg_indexes WHERE indexname = 'metodo_de_acceso_tipo_referencia_key'`;
    expect(indice.indexdef).toMatch(/CREATE UNIQUE INDEX .* \(tipo, referencia\)/);
  });
});

describe('TEST-UC-P25 / TEST-CT-ACC-01 — registro', () => {
  it('TEST-CT-ACC-01: 201 con el contrato exacto, sin sesión ni datos sensibles', async () => {
    const correo = correoSintetico('ct01');
    const res = await registrar(app, correo, { superficie: 'APK' }).expect(201);
    const cuerpo = RegistrarIdentidadResponseSchema.parse(res.body);
    expect(cuerpo.data).toMatchObject({ registrationIntent: 'ADVISEE', accountOperationalState: 'OPERATIVA' });
    expect(JSON.stringify(res.body)).not.toMatch(/accessToken|session|credential|hash/i);
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('TEST-UC-P25: una sola transacción crea identidad OPERATIVA, perfil propio 1:1, método, credencial hasheada, eventos y auditoría', async () => {
    const correo = correoSintetico('p25');
    const id = await registrarOk(app, correo, 'APK');
    const identidad = await prisma.identidad.findUniqueOrThrow({
      where: { id },
      include: { perfilPropio: true, metodosDeAcceso: { include: { credencialLocal: true } }, controlDeSesion: true },
    });
    expect(identidad.estadoOperativoDeCuenta).toBe('OPERATIVA');
    expect(identidad.autoriaDeCreacionId).toBe(id);
    expect(identidad.procedencia).toMatchObject({ fuente: 'PROPIA', casoDeUso: 'UC-P25', operacion: 'API-ACC-01', superficie: 'APK' });
    expect(identidad.perfilPropio).not.toBeNull();
    expect(identidad.controlDeSesion?.version).toBe(0);
    expect(identidad.metodosDeAcceso).toHaveLength(1);
    const credencial = identidad.metodosDeAcceso[0].credencialLocal?.hash ?? '';
    expect(credencial).toMatch(/^\$2[aby]\$10\$/); // bcrypt costo 10 (08 §24.2)
    expect(credencial).not.toContain('clave-sintetica');

    const eventos = await prisma.eventoDeDominio.findMany({ where: { identidadId: id }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(eventos.map((e) => e.tipo).sort()).toEqual(['IdentidadCreada', 'MetodoDeAccesoAsociado']);
    expect(eventos.find((e) => e.tipo === 'IdentidadCreada')?.datos).toEqual({ registrationIntent: 'ADVISEE' });
    const auditoria = await prisma.registroDeAuditoria.findMany({ where: { sujetoId: id, operacion: 'API-ACC-01' } });
    expect(auditoria).toHaveLength(1);
    expect(auditoria[0]).toMatchObject({ resultado: 'EXITO', actorId: id, superficie: 'APK' });
  });

  it('TEST-DOM-008: ocurrencia y registro se guardan por separado en todos los hechos del alta', async () => {
    const id = await registrarOk(app, correoSintetico('dom008'));
    const filas = await prisma.$queryRaw<{ tabla: string; ocurrencia: Date | null; registro: Date }[]>`
      SELECT 'identidad' AS tabla, momento_de_ocurrencia AS ocurrencia, momento_de_registro AS registro FROM identidad WHERE id = ${id}::uuid
      UNION ALL SELECT 'acto', momento_de_ocurrencia, momento_de_registro FROM acto_registrable WHERE identidad_id = ${id}::uuid
      UNION ALL SELECT 'evento', momento_de_ocurrencia, momento_de_registro FROM evento_de_dominio WHERE identidad_id = ${id}::uuid`;
    expect(filas.length).toBeGreaterThanOrEqual(5);
    for (const f of filas) {
      expect(f.ocurrencia).toBeInstanceOf(Date);
      expect(f.registro).toBeInstanceOf(Date);
      // La confirmación (ocurrencia) nunca es posterior al asiento (registro).
      expect(f.ocurrencia!.getTime()).toBeLessThanOrEqual(f.registro.getTime());
    }
  });

  it.each([
    ['sin Idempotency-Key', undefined, 400, 'INVALID_REQUEST'],
    ['Idempotency-Key inválida', 'corta', 400, 'INVALID_REQUEST'],
  ])('TEST-CT-ACC-01: %s → %s %s', async (_caso, clave, status, code) => {
    const req = request(app.getHttpServer()).post('/api/v1/registrations');
    if (clave) req.set('Idempotency-Key', clave);
    const res = await req.send(cuerpoDeRegistro(correoSintetico('sin-key'))).expect(status);
    expect(ErrorEnvelopeSchema.parse(res.body).error.code).toBe(code);
  });

  it('TEST-CT-ACC-01: versión de términos no vigente → 422 TERMS_VERSION_NOT_ACCEPTABLE; de privacidad → PRIVACY_VERSION_NOT_ACCEPTABLE', async () => {
    const base = cuerpoDeRegistro(correoSintetico('version'));
    const terminos = await request(app.getHttpServer())
      .post('/api/v1/registrations')
      .set('Idempotency-Key', claveDeIdempotencia())
      .send({ ...base, termsAcceptance: { versionId: 'terminos-vieja' } });
    expect(terminos.body.error.code).toBe('TERMS_VERSION_NOT_ACCEPTABLE');
    const privacidad = await request(app.getHttpServer())
      .post('/api/v1/registrations')
      .set('Idempotency-Key', claveDeIdempotencia())
      .send({ ...base, privacyAcknowledgement: { versionId: 'privacidad-vieja' } });
    expect(privacidad.body.error.code).toBe('PRIVACY_VERSION_NOT_ACCEPTABLE');
    expect(terminos.status).toBe(privacidad.status);
  });

  it('TEST-CT-ACC-01: credencial corta o correo inválido → 400 INVALID_REQUEST con issues {code, path}', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/registrations')
      .set('Idempotency-Key', claveDeIdempotencia())
      .send(cuerpoDeRegistro('no-es-correo', 'corta'))
      .expect(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
    expect(res.body.error.details.issues).toEqual(
      expect.arrayContaining([
        { code: 'INVALID_LOCAL_IDENTIFIER', path: 'identity.localIdentifier' },
        { code: 'CREDENCIAL_DEMASIADO_CORTA', path: 'identity.localCredential' },
      ]),
    );
  });

  it('TEST-AUTH-009: campos autoritativos del cliente (rol, estado, capacidades) → 400 UNKNOWN_FIELD', async () => {
    for (const extra of [{ role: 'PROFESSIONAL' }, { accountOperationalState: 'OPERATIVA' }, { actorCapabilities: ['X'] }]) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/registrations')
        .set('Idempotency-Key', claveDeIdempotencia())
        .send({ ...cuerpoDeRegistro(correoSintetico('auth009')), ...extra })
        .expect(400);
      expect(res.body.error.code).toBe('UNKNOWN_FIELD');
    }
  });
});

describe('TEST-RNF-REC-002 — idempotencia del registro', () => {
  it('TEST-RNF-REC-002: misma key + mismo payload → mismo resultado sin duplicar efectos', async () => {
    const correo = correoSintetico('replay');
    const clave = claveDeIdempotencia();
    const primera = await registrar(app, correo, { clave }).expect(201);
    const segunda = await registrar(app, correo, { clave }).expect(201);
    expect(segunda.body).toEqual(primera.body);
    expect(await prisma.identidad.count({ where: { id: primera.body.data.identityId } })).toBe(1);
    expect(await prisma.actoRegistrable.count({ where: { identidadId: primera.body.data.identityId } })).toBe(2);
  });

  it('TEST-RNF-REC-002: requests concurrentes con la misma key → una identidad y respuestas idénticas', async () => {
    const correo = correoSintetico('replay-concurrente');
    const clave = claveDeIdempotencia();
    const respuestas = await Promise.all(Array.from({ length: 4 }, () => registrar(app, correo, { clave })));
    expect(respuestas.map((r) => r.status)).toEqual([201, 201, 201, 201]);
    expect(new Set(respuestas.map((r) => r.body.data.identityId)).size).toBe(1);
  });

  it('TEST-RNF-REC-002: misma key con otro payload → 409 IDEMPOTENCY_KEY_REUSED', async () => {
    const clave = claveDeIdempotencia();
    await registrar(app, correoSintetico('reuso-a'), { clave }).expect(201);
    const res = await registrar(app, correoSintetico('reuso-b'), { clave }).expect(409);
    expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });
});

describe('TEST-RNF-SEC-005 — auditoría bloqueante (REQUIRED_SAME_TX)', () => {
  it('TEST-RNF-SEC-005: si la auditoría del alta falla, no queda identidad ni efecto alguno (09v7 T18: no audit → no success)', async () => {
    const auditoria = app.get(AuditoriaService);
    const original = auditoria.registrar.bind(auditoria);
    const espia = jest.spyOn(auditoria, 'registrar').mockImplementation(async (entrada, tx) => {
      if (entrada.resultado === 'EXITO') throw new Error('falla sintética de auditoría');
      return original(entrada, tx);
    });
    const correo = correoSintetico('sec005');
    try {
      const res = await registrar(app, correo).expect(500);
      expect(res.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: expect.any(String) } });
    } finally {
      espia.mockRestore();
    }
    expect(await prisma.metodoDeAcceso.count({ where: { referencia: correo } })).toBe(0);
    // Y la misma persona puede registrarse después: nada quedó a medias.
    await registrarOk(app, correo);
  });
});

it('los identificadores de dominio son UUID opacos y no secuenciales', async () => {
  const a = await registrarOk(app, correoSintetico('uuid-a'));
  const b = await registrarOk(app, correoSintetico('uuid-b'));
  expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(a).not.toBe(b);
});
