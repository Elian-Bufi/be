/**
 * WP-02 · Cierre de cuenta (API-ACC-P1-03, UC-P27, RF-069) contra PostgreSQL real.
 * TEST-AUTH-011 · TEST-AUTH-012 · TEST-AUTH-013 (b) · TEST-UC-P27 · TEST-RF-069 · TEST-CT-P1-ACC-P1-03 · E2E-08
 * WP-03 · TEST-AUTH-013 (a): el cierre finaliza los vínculos por eventos (cierra DEUDA_LEGAJO DL-018).
 */
import type { INestApplication } from '@nestjs/common';
import { SolicitarCierreResponseSchema, VERSION_VIGENTE } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { TokensService } from '../../apps/api/src/sesion/tokens.service';
import {
  appDePrueba,
  claveDeIdempotencia,
  conSesion,
  correoSintetico,
  cuerpoDeCierre,
  login,
  registrarOk,
  tokenDe,
} from './soporte-api';
import { dashboard, pausar, prepararAsesorado, prepararProfesional, solicitar, versionDeVinculo, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const CIERRE = '/api/v1/me/account-closure-requests';

async function cuentaCerrada(etiqueta: string) {
  const correo = correoSintetico(etiqueta);
  const id = await registrarOk(app, correo, 'WEB');
  const web = await tokenDe(app, correo, 'WEB');
  const apk = await tokenDe(app, correo, 'APK');
  const ejecutora = await tokenDe(app, correo, 'WEB');
  const clave = claveDeIdempotencia();
  const res = await conSesion(app, ejecutora).post(CIERRE, clave).set('X-BE-Surface', 'WEB').send(cuerpoDeCierre()).expect(201);
  return { correo, id, web, apk, ejecutora, clave, res };
}

describe('TEST-AUTH-011 — el cierre efectivo no permite una sesión nueva', () => {
  it('TEST-AUTH-011: tras ACC-P1-03 el login con la credencial correcta da 401 neutral y no crea filas de sesión', async () => {
    const { correo, id } = await cuentaCerrada('auth011');
    const antes = await prisma.sesion.count({ where: { identidadId: id } });
    const res = await login(app, correo).expect(401);
    expect(res.body).toEqual({ error: { code: 'INVALID_CREDENTIALS', message: 'No pudimos verificar los datos de acceso.' } });
    expect(await prisma.sesion.count({ where: { identidadId: id } })).toBe(antes);
    expect((await prisma.identidad.findUniqueOrThrow({ where: { id } })).estadoOperativoDeCuenta).toBe('CERRADA');
  });
});

describe('TEST-AUTH-012 — el cierre invalida las sesiones actuales', () => {
  it('TEST-AUTH-012: las sesiones previas de web y APK y la que ejecutó el cierre, con token aún vigente, dan 401 en la request siguiente', async () => {
    const { id, web, apk, ejecutora } = await cuentaCerrada('auth012');
    for (const token of [web, apk, ejecutora]) {
      const res = await conSesion(app, token).get('/api/v1/me').expect(401);
      expect(['SESSION_REVOKED', 'SESSION_INVALID']).toContain(res.body.error.code);
      await conSesion(app, token).get('/api/v1/me/health-data-consent-requirement').expect(401);
      await conSesion(app, token).delete('/api/v1/auth/sessions').expect(401);
    }
    const sesiones = await prisma.sesion.findMany({ where: { identidadId: id } });
    expect(sesiones).toHaveLength(3);
    expect(sesiones.every((s) => s.estado === 'REVOCADA' && s.motivoDeRevocacion === 'CIERRE_DE_CUENTA')).toBe(true);
    expect(sesiones.every((s) => s.expiraEn.getTime() > Date.now())).toBe(true); // los tokens seguían vigentes
  });
});

describe('TEST-AUTH-013 — sin borrado silencioso', () => {
  it('TEST-AUTH-013 (b): la identidad sigue presente en CERRADA con perfil, método, actos A1/A2 y eventos; el cierre queda asentado', async () => {
    const { id, res } = await cuentaCerrada('auth013');
    const identidad = await prisma.identidad.findUniqueOrThrow({
      where: { id },
      include: { perfilPropio: true, metodosDeAcceso: { include: { credencialLocal: true } }, actos: true, solicitudDeCierreDeCuenta: true },
    });
    expect(identidad.estadoOperativoDeCuenta).toBe('CERRADA');
    expect(identidad.perfilPropio).not.toBeNull();
    expect(identidad.metodosDeAcceso).toHaveLength(1); // el identificador sigue reservado (DL-011)
    expect(identidad.actos.map((a) => `${a.tipo}:${a.estado}`).sort()).toEqual(['PRIVACIDAD_INFO:VIGENTE', 'TERMINOS:REVOCADO']);
    expect(identidad.actos.find((a) => a.tipo === 'TERMINOS')?.momentoDeRevocacion).toBeInstanceOf(Date);
    expect(identidad.solicitudDeCierreDeCuenta).toMatchObject({
      id: res.body.data.id,
      actorId: id,
      versionDeConsecuenciasId: VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE.id,
    });

    const eventos = await prisma.eventoDeDominio.findMany({ where: { identidadId: id } });
    expect(eventos.map((e) => e.tipo).sort()).toEqual(['ActoRevocado', 'CuentaCerrada', 'IdentidadCreada', 'MetodoDeAccesoAsociado']);
    // 06 §5.7.5: el evento de transición conserva estado anterior y resultante.
    expect(eventos.find((e) => e.tipo === 'CuentaCerrada')).toMatchObject({ estadoAnterior: 'OPERATIVA', estadoResultante: 'CERRADA', actorId: id });
  });

  it('TEST-AUTH-013 (b): lo único suprimido es el hash de la credencial (08 R-02), y la supresión queda registrada antes', async () => {
    const { id } = await cuentaCerrada('auth013-supresion');
    const metodo = await prisma.metodoDeAcceso.findFirstOrThrow({ where: { identidadId: id }, include: { credencialLocal: true } });
    expect(metodo.credencialLocal).toBeNull();
    const supresiones = await prisma.registroDeSupresion.findMany({ where: { sujetoId: id } });
    expect(supresiones).toHaveLength(1);
    expect(supresiones[0]).toMatchObject({ categoria: 'CREDENCIAL_LOCAL', ejecutor: 'CerrarCuenta' });
    // 08 §29: la supresión ejecutada también queda en la auditoría (DL-019 A), en la misma transacción.
    expect(await prisma.registroDeAuditoria.findFirst({ where: { operacion: 'SUPRESION', sujetoId: id } })).toMatchObject({
      resultado: 'EXITO',
      recursoTipo: 'CredencialLocal',
      actorId: id,
    });
  });

  it('TEST-AUTH-013 (b): la historia no se puede borrar después del cierre — la base rechaza DELETE de identidad, actos y eventos', async () => {
    const { id } = await cuentaCerrada('auth013-borrado');
    await expect(prisma.$executeRaw`DELETE FROM evento_de_dominio WHERE identidad_id = ${id}::uuid`).rejects.toThrow();
    await expect(prisma.$executeRaw`DELETE FROM acto_registrable WHERE identidad_id = ${id}::uuid`).rejects.toThrow();
    await expect(prisma.$executeRaw`DELETE FROM identidad WHERE id = ${id}::uuid`).rejects.toThrow();
    expect(await prisma.identidad.count({ where: { id } })).toBe(1);
  });
});

describe('TEST-UC-P27 / TEST-CT-P1-ACC-P1-03 — cierre de cuenta', () => {
  it('TEST-CT-P1-ACC-P1-03: 201 con el contrato; identifica actor y fecha (RF-069)', async () => {
    const { id, res } = await cuentaCerrada('ct-p1-03');
    const cuerpo = SolicitarCierreResponseSchema.parse(res.body);
    expect(cuerpo.data).toMatchObject({ identityId: id, accountOperationalState: 'CERRADA' });
    const auditoria = await prisma.registroDeAuditoria.findFirst({ where: { operacion: 'API-ACC-P1-03', sujetoId: id, resultado: 'EXITO' } });
    expect(auditoria).toMatchObject({ actorId: id, recursoId: cuerpo.data.id, superficie: 'WEB' });
  });

  it('TEST-RNF-REC-002: reintento con la misma key después del cierre → mismo resultado, sin duplicar el cierre', async () => {
    const { id, ejecutora, clave, res } = await cuentaCerrada('cierre-replay');
    const replay = await conSesion(app, ejecutora).post(CIERRE, clave).send(cuerpoDeCierre()).expect(201);
    expect(replay.body).toEqual(res.body);
    expect(await prisma.eventoDeDominio.count({ where: { identidadId: id, tipo: 'CuentaCerrada' } })).toBe(1);
    // Misma key con otro cuerpo, aun con la sesión ya revocada: 409, nunca el resultado guardado.
    const otroCuerpo = await conSesion(app, ejecutora).post(CIERRE, clave).send(cuerpoDeCierre({ confirmed: false })).expect(409);
    expect(otroCuerpo.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    // Con otra key la sesión revocada no sirve para nada más.
    const otra = await conSesion(app, ejecutora).post(CIERRE).send(cuerpoDeCierre()).expect(401);
    expect(otra.body.error.code).toBe('SESSION_REVOKED');
  });

  it('TEST-UC-P27 V03: sin consecuencias presentadas (versión no vigente) → 422 y la cuenta sigue OPERATIVA', async () => {
    const correo = correoSintetico('p27-consecuencias');
    const id = await registrarOk(app, correo);
    const token = await tokenDe(app, correo);
    const res = await conSesion(app, token)
      .post(CIERRE)
      .send(cuerpoDeCierre({ consequencesAcknowledgement: { versionId: 'cierre-otra-version' } }))
      .expect(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect((await prisma.identidad.findUniqueOrThrow({ where: { id } })).estadoOperativoDeCuenta).toBe('OPERATIVA');
    await conSesion(app, token).get('/api/v1/me').expect(200);
  });

  it('TEST-UC-P27 V01: sin confirmación explícita → 422 y nada cambia', async () => {
    const correo = correoSintetico('p27-confirmacion');
    const id = await registrarOk(app, correo);
    const token = await tokenDe(app, correo);
    const res = await conSesion(app, token).post(CIERRE).send(cuerpoDeCierre({ confirmed: false })).expect(422);
    expect(res.body.error.details.issues).toEqual([{ code: 'EXPLICIT_CONFIRMATION_REQUIRED', path: 'confirmed' }]);
    expect((await prisma.identidad.findUniqueOrThrow({ where: { id } })).estadoOperativoDeCuenta).toBe('OPERATIVA');
    expect(await prisma.eventoDeDominio.count({ where: { identidadId: id, tipo: 'CuentaCerrada' } })).toBe(0);
  });

  it('TEST-UC-P27 E01: sin sesión → 401 AUTHENTICATION_REQUIRED', async () => {
    const res = await request(app.getHttpServer())
      .post(CIERRE)
      .set('Idempotency-Key', claveDeIdempotencia())
      .send(cuerpoDeCierre())
      .expect(401);
    expect(res.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('TEST-UC-P27 step-up: sesión autenticada hace más de 10 minutos → 403 STEP_UP_REQUIRED y la cuenta sigue OPERATIVA (DL-017)', async () => {
    const correo = correoSintetico('p27-stepup');
    const id = await registrarOk(app, correo);
    // Sesión sintética emitida hace 11 minutos, todavía vigente.
    const ahora = Date.now();
    const sesion = await prisma.sesion.create({
      data: {
        identidadId: id,
        momentoDeOcurrencia: new Date(ahora - 11 * 60_000),
        expiraEn: new Date(ahora + 3600_000),
        versionDeControl: 0,
      },
    });
    const token = app.get(TokensService).firmar({ sub: id, sid: sesion.id, tv: 0 }, sesion.expiraEn);
    await conSesion(app, token).get('/api/v1/me').expect(200); // la sesión es válida…
    const res = await conSesion(app, token).post(CIERRE).send(cuerpoDeCierre()).expect(403); // …pero no reciente
    expect(res.body.error.code).toBe('STEP_UP_REQUIRED');
    expect((await prisma.identidad.findUniqueOrThrow({ where: { id } })).estadoOperativoDeCuenta).toBe('OPERATIVA');
    // Volver a iniciar sesión satisface el step-up.
    const reciente = await tokenDe(app, correo);
    await conSesion(app, reciente).post(CIERRE).send(cuerpoDeCierre()).expect(201);
  });

  it('TEST-UC-P27: campo no declarado en el cuerpo → 400 UNKNOWN_FIELD', async () => {
    const correo = correoSintetico('p27-campo');
    await registrarOk(app, correo);
    const token = await tokenDe(app, correo);
    const res = await conSesion(app, token).post(CIERRE).send(cuerpoDeCierre({ deleteAllData: true })).expect(400);
    expect(res.body.error.code).toBe('UNKNOWN_FIELD');
  });

  it('E2E-08: cierre → sesión inválida; el mismo correo no puede registrarse otra vez (identificador reservado, DL-011)', async () => {
    const { correo, ejecutora } = await cuentaCerrada('e2e08');
    await conSesion(app, ejecutora).get('/api/v1/me').expect(401);
    const res = await request(app.getHttpServer())
      .post('/api/v1/registrations')
      .set('Idempotency-Key', claveDeIdempotencia())
      .send({
        registrationIntent: 'ADVISEE',
        identity: { localIdentifier: correo, localCredential: 'clave-sintetica-nueva-01' },
        termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
        privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
      })
      .expect(409);
    expect(res.body.error.code).toBe('REGISTRATION_NOT_AVAILABLE');
  });
});

describe('TEST-AUTH-013 (a) — el cierre finaliza los vínculos por eventos, sin borrado silencioso (DL-018)', () => {
  it('TEST-AUTH-013 (a): dos vínculos activos (uno pausado) y una solicitud pendiente; el cierre finaliza, invalida y conserva la evidencia', async () => {
    const pn = await prepararProfesional(app, 'auth013a-n', ['NUTRICION']);
    const pt = await prepararProfesional(app, 'auth013a-t', ['ENTRENAMIENTO']);
    const pa = await prepararProfesional(app, 'auth013a-a', ['ANTROPOMETRIA']);
    const a01 = await prepararAsesorado(app, 'auth013a', { a3: true });
    const n1 = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const t1 = await vinculoCompleto(app, pt, a01, 'ENTRENAMIENTO');
    await pausar(app, a01.token, t1.vinculoId, await versionDeVinculo(app, a01.token, t1.vinculoId)).expect(200);
    const pendiente = (await solicitar(app, pa, a01.id, 'ANTROPOMETRIA').expect(201)).body.data.relationshipRequestId as string;
    await dashboard(app, pn, a01.id).expect(200);

    await conSesion(app, await tokenDe(app, a01.correo)).post(CIERRE).send(cuerpoDeCierre()).expect(201);

    for (const id of [n1.vinculoId, t1.vinculoId]) {
      expect(await prisma.alcanceDeVinculo.findUniqueOrThrow({ where: { id } })).toMatchObject({ estado: 'FINALIZADO', motivoDeUltimaTransicion: 'CIERRE_DE_CUENTA' });
      const hecho = await prisma.eventoDeVinculo.findFirstOrThrow({ where: { alcanceDeVinculoId: id, tipo: 'AlcanceDeVinculoFinalizado' } });
      expect(hecho).toMatchObject({ actorServicio: 'SISTEMA', actorId: null, motivo: 'CIERRE_DE_CUENTA', estadoPosterior: 'FINALIZADO' });
    }
    // «preserva pausa previa» (06:3111).
    expect((await prisma.alcanceDeVinculo.findUniqueOrThrow({ where: { id: t1.vinculoId } })).pausadoPor).toBe('ASESORADO');
    const invalidada = await prisma.solicitudDeVinculo.findUniqueOrThrow({ where: { id: pendiente } });
    expect(invalidada.estado).toBe('INVALIDADA');
    expect(await prisma.eventoDeVinculo.count({ where: { solicitudDeVinculoId: pendiente, tipo: 'SolicitudDeVinculoInvalidada', actorServicio: 'SISTEMA' } })).toBe(1);
    // Sin borrado silencioso: los consentimientos y su cadena quedan como evidencia (REG-06-52, INV-06-64).
    for (const consentId of [n1.consentId, t1.consentId] as string[]) {
      const c = await prisma.consentimiento.findUniqueOrThrow({ where: { id: consentId }, include: { versiones: true } });
      expect(c.situacion).toBe('VIGENTE');
      expect(c.versiones).toHaveLength(1);
    }
    // Y el acceso profesional se cortó (08 §14.1: «Cierre de cuenta del asesorado | Corta todos los accesos profesionales»).
    await dashboard(app, pn, a01.id).expect(404);
    await dashboard(app, pt, a01.id).expect(404);
  });

  it('TEST-AUTH-013 (a): el cierre de la cuenta del profesional también finaliza sus vínculos por eventos', async () => {
    const pn = await prepararProfesional(app, 'auth013a-pro', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'auth013a-pro', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await conSesion(app, await tokenDe(app, pn.correo)).post(CIERRE).send(cuerpoDeCierre()).expect(201);
    const lista = await conSesion(app, a01.token).get('/api/v1/me/relationships').expect(200);
    expect(lista.body.data.find((v: { relationshipId: string }) => v.relationshipId === vinculoId)).toMatchObject({ relationshipState: 'FINALIZADO', accessMode: 'BLOCKED' });
  });
});
