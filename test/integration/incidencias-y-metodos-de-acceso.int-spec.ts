/**
 * RF-068 y RF-004 (DEUDA_LEGAJO DL-172; docs/paquetes/WP-RF068-RF004.md) contra PostgreSQL real y un Google falso local.
 * - TEST-INC-007 a 009: avisar un problema, verlo, y Administración que lo gestiona; la historia no se sobrescribe.
 * - TEST-MET-006 a 010: ver, vincular y desvincular Google desde la cuenta, sin quedarse nunca sin un método, con la
 *   entrada reciente y el segundo factor del profesional.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { TokensService } from '../../apps/api/src/sesion/tokens.service';
import { adm, administradorListo } from './soporte-administracion';
import { appDePrueba, conSesion, correoSintetico, CREDENCIAL_SINTETICA, NOMBRE_SINTETICO, OTRA_CREDENCIAL_SINTETICA, registrarOk, tokenDe } from './soporte-api';
import { googleDePrueba, idTokenDeGoogle, levantarGoogleFalso, reclamosDeGoogle, subSintetico, type GoogleFalso } from './soporte-google';
import { prepararAsesorado, prepararProfesional } from './soporte-vinculo';
import { VERSION_VIGENTE } from '@be/domain';

const prisma = new PrismaClient();
let google: GoogleFalso;
let app: INestApplication;

beforeAll(async () => {
  google = await levantarGoogleFalso();
  app = await appDePrueba(googleDePrueba(google));
});
afterAll(async () => {
  await app.close();
  await google.cerrar();
  await prisma.$disconnect();
});

const tokenDeGoogle = (sub: string, correo: string) => idTokenDeGoogle(google, reclamosDeGoogle(sub, correo));
const entrarConGoogle = (idToken: string) => request(app.getHttpServer()).post('/api/v1/auth/federated/google/sessions').send({ idToken });

describe('RF-068 · las incidencias administrativas mínimas', () => {
  it('TEST-INC-007 · la persona avisa un problema y ve lo suyo; otra persona no lo ve; la descripción no va a la auditoría', async () => {
    const ana = await prepararAsesorado(app, 'inc-ana');
    const beto = await prepararAsesorado(app, 'inc-beto');
    const descripcion = 'No me aparece el plan de esta semana (sintético).';
    const sinTexto = await conSesion(app, ana.token).post('/api/v1/incidents').send({ category: 'APP_FUNCTIONING', description: '   ' }).expect(422);
    expect(sinTexto.body.error.details.issues).toEqual([{ code: 'DESCRIPTION_REQUIRED', path: 'description' }]);
    const creada = await conSesion(app, ana.token).post('/api/v1/incidents').send({ category: 'APP_FUNCTIONING', description: `  ${descripcion}  ` }).expect(201);
    expect(creada.body.data).toMatchObject({ category: 'APP_FUNCTIONING', description: descripcion, state: 'OPEN', response: null });
    const id = creada.body.data.incidentId as string;
    const propias = (await conSesion(app, ana.token).get('/api/v1/me/incidents').expect(200)).body.data as { incidentId: string }[];
    expect(propias.map((i) => i.incidentId)).toEqual([id]);
    expect((await conSesion(app, beto.token).get('/api/v1/me/incidents').expect(200)).body.data).toEqual([]);
    const auditada = await prisma.registroDeAuditoria.findFirstOrThrow({ where: { operacion: 'API-INC-01', resultado: 'EXITO', recursoId: id } });
    expect(auditada).toMatchObject({ actorId: ana.id, sujetoId: ana.id, motivo: 'APP_FUNCTIONING' });
    expect(JSON.stringify(auditada)).not.toContain('plan de esta semana');
    // Un profesional también avisa, sin el segundo factor: avisar no es actuar como profesional.
    const pro = await prepararProfesional(app, 'inc-pro', ['NUTRICION']);
    const sinCodigo = await tokenDe(app, pro.correo, 'WEB');
    await conSesion(app, sinCodigo).post('/api/v1/incidents').send({ category: 'ACCESS', description: 'Sintético: no entra el código.' }).expect(201);
  });

  it('TEST-INC-008 · Administración la filtra, la toma, la resuelve con una respuesta y la reabre; quien la avisó ve el estado y la respuesta, nunca el motivo', async () => {
    const ana = await prepararAsesorado(app, 'inc-gestion');
    const id = (await conSesion(app, ana.token).post('/api/v1/incidents').send({ category: 'PROFILE', description: 'Sintético: mi nombre sale cortado.' }).expect(201)).body.data.incidentId as string;
    const a = await administradorListo(app, prisma, `inc-${randomUUID().slice(0, 6)}`);
    const pendientes = (await adm(app, a.token).post('/admin/incidents/query').send({ states: ['OPEN', 'IN_PROGRESS'], category: 'PROFILE', limit: 50 }).expect(200)).body.data as {
      incidentId: string;
      reporter: unknown;
      version: string;
      assignee: unknown;
    }[];
    expect(pendientes.find((i) => i.incidentId === id)).toMatchObject({ reporter: { identityId: ana.id, email: ana.correo }, version: 'v0', assignee: null });
    expect((await adm(app, a.token).post('/admin/incidents/query').send({ states: ['RESOLVED'], limit: 50 }).expect(200)).body.data.some((i: { incidentId: string }) => i.incidentId === id)).toBe(false);
    const cambiar = (cuerpo: Record<string, unknown>) => adm(app, a.token).post(`/admin/incidents/${id}/updates`).set('Idempotency-Key', randomUUID()).send(cuerpo);

    const tomada = await cambiar({ state: 'IN_PROGRESS', reason: 'La tomo: reviso el perfil.', expectedVersion: 'v0' }).expect(200);
    expect(tomada.body.data).toMatchObject({ state: 'IN_PROGRESS', version: 'v1', assignee: { identityId: a.id } });
    expect((await cambiar({ state: 'IN_PROGRESS', reason: 'Otra vez.', expectedVersion: 'v1' }).expect(422)).body.error.code).toBe('INVALID_STATE_TRANSITION');
    expect((await cambiar({ state: 'RESOLVED', reason: 'Se corrigió.', expectedVersion: 'v0', response: 'Listo.' }).expect(409)).body.error.code).toBe('VERSION_CONFLICT');
    expect((await cambiar({ state: 'RESOLVED', reason: 'Se corrigió.', expectedVersion: 'v1' }).expect(422)).body.error.details.issues).toEqual([{ code: 'RESPONSE_REQUIRED', path: 'response' }]);
    await cambiar({ state: 'RESOLVED', reason: 'Se corrigió el largo del nombre.', response: 'Ya se ve completo. Gracias por avisar.', expectedVersion: 'v1' }).expect(200);
    const vista = (await conSesion(app, ana.token).get('/api/v1/me/incidents').expect(200)).body.data[0];
    expect(vista).toMatchObject({ incidentId: id, state: 'RESOLVED', response: 'Ya se ve completo. Gracias por avisar.' });
    expect(JSON.stringify(vista)).not.toContain('largo del nombre');
    // Reabrirla deja la respuesta anterior a la vista, y la historia entera en el detalle.
    await cambiar({ state: 'IN_PROGRESS', reason: 'Volvió a pasar.', expectedVersion: 'v2' }).expect(200);
    const detalle = (await adm(app, a.token).get(`/admin/incidents/${id}`).expect(200)).body.data;
    expect(detalle.history.map((c: { from: string; to: string }) => `${c.from}->${c.to}`)).toEqual(['OPEN->IN_PROGRESS', 'IN_PROGRESS->RESOLVED', 'RESOLVED->IN_PROGRESS']);
    expect(detalle.history[1]).toMatchObject({ reason: 'Se corrigió el largo del nombre.', response: 'Ya se ve completo. Gracias por avisar.', administrator: { identityId: a.id } });
    expect((await conSesion(app, ana.token).get('/api/v1/me/incidents').expect(200)).body.data[0]).toMatchObject({ state: 'IN_PROGRESS', response: 'Ya se ve completo. Gracias por avisar.' });
    await adm(app, a.token).get(`/admin/incidents/${randomUUID()}`).expect(404);
    // Una sesión que no es administrativa no llega.
    await adm(app, ana.token).post('/admin/incidents/query').send({}).expect(403);
  });

  it('TEST-INC-009 · la base: no se borra, no cambia de estado sin su cambio, y lo cambia solo un administrador con su rol', async () => {
    const ana = await prepararAsesorado(app, 'inc-base');
    const id = (await conSesion(app, ana.token).post('/api/v1/incidents').send({ category: 'DATA_INTEGRITY', description: 'Sintético.' }).expect(201)).body.data.incidentId as string;
    await expect(prisma.$executeRaw`DELETE FROM "incidencia" WHERE "id" = ${id}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`UPDATE "incidencia" SET "estado" = 'RESUELTA', "version" = 1 WHERE "id" = ${id}::uuid`).rejects.toThrow(/cambio que lo registra/);
    await expect(prisma.$executeRaw`UPDATE "incidencia" SET "descripcion" = 'otra' WHERE "id" = ${id}::uuid`).rejects.toThrow(/solo cambian/);
    await expect(
      prisma.$executeRaw`INSERT INTO "cambio_de_incidencia" ("incidencia_id", "numero", "estado_anterior", "estado_nuevo", "motivo", "administrador_id", "procedencia")
                         VALUES (${id}::uuid, 1, 'ABIERTA', 'EN_CURSO', 'x', ${ana.id}::uuid, '{}'::jsonb)`,
    ).rejects.toThrow(/rol vigente/);
    const a = await administradorListo(app, prisma, `inc-base-${randomUUID().slice(0, 6)}`);
    await adm(app, a.token).post(`/admin/incidents/${id}/updates`).set('Idempotency-Key', randomUUID()).send({ state: 'IN_PROGRESS', reason: 'Lo veo.', expectedVersion: 'v0' }).expect(200);
    await expect(prisma.$executeRaw`UPDATE "cambio_de_incidencia" SET "motivo" = 'otro' WHERE "incidencia_id" = ${id}::uuid`).rejects.toThrow(/append-only/);
    // Un cambio que no parte del estado y la versión actuales tampoco entra.
    await expect(
      prisma.$executeRaw`INSERT INTO "cambio_de_incidencia" ("incidencia_id", "numero", "estado_anterior", "estado_nuevo", "motivo", "administrador_id", "procedencia")
                         VALUES (${id}::uuid, 2, 'ABIERTA', 'RESUELTA', 'x', ${a.id}::uuid, '{}'::jsonb)`,
    ).rejects.toThrow();
  });
});

describe('RF-004 · los métodos de acceso de una misma identidad', () => {
  it('TEST-MET-006 · vincular Google desde la cuenta: con la contraseña, y con otro correo solo si se confirma; después entra con Google a la misma identidad', async () => {
    const correo = correoSintetico('met-vincular');
    const id = await registrarOk(app, correo);
    const token = await tokenDe(app, correo);
    const yo = conSesion(app, token);
    expect((await yo.get('/api/v1/me/access-methods').expect(200)).body.data).toMatchObject({ methods: [{ type: 'PASSWORD', email: correo, removable: false }], canLinkGoogle: true });
    const sub = subSintetico();
    const correoDeGoogle = correoSintetico('met-vincular-google');
    const idToken = tokenDeGoogle(sub, correoDeGoogle);
    const mal = await yo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: OTRA_CREDENCIAL_SINTETICA }).expect(422);
    expect(mal.body.error.details.issues).toEqual([{ code: 'CREDENTIAL_INCORRECT', path: 'credential' }]);
    const distinto = await yo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: CREDENCIAL_SINTETICA }).expect(409);
    expect(distinto.body.error).toMatchObject({ code: 'GOOGLE_EMAIL_MISMATCH', details: { email: correoDeGoogle } });
    expect(await prisma.metodoDeAcceso.count({ where: { identidadId: id } })).toBe(1);
    const vinculada = await yo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: CREDENCIAL_SINTETICA, confirmDifferentEmail: true }).expect(201);
    expect(vinculada.body.data.methods.map((m: { type: string; removable: boolean }) => [m.type, m.removable])).toEqual([
      ['PASSWORD', false],
      ['GOOGLE', true],
    ]);
    expect(vinculada.body.data.canLinkGoogle).toBe(false);
    // Repetirlo no cambia nada.
    await yo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: CREDENCIAL_SINTETICA, confirmDifferentEmail: true }).expect(200);
    const sesion = await entrarConGoogle(idToken).expect(201);
    expect(sesion.body.data.actor.identityId).toBe(id);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-MET-02', resultado: 'EXITO', sujetoId: id, motivo: 'METODO_GOOGLE_ASOCIADO' } })).toBe(1);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-MET-02', resultado: 'RECHAZO', sujetoId: id, motivo: { in: ['CREDENCIAL_INCORRECTA', 'CORREO_DISTINTO_SIN_CONFIRMAR'] } } })).toBe(2);
  });

  it('TEST-MET-007 · desvincular Google deja la contraseña; Google ya no entra; volver a vincular la misma la reasocia, y otra distinta todavía no', async () => {
    const correo = correoSintetico('met-retirar');
    const id = await registrarOk(app, correo);
    const yo = conSesion(app, await tokenDe(app, correo));
    const sub = subSintetico();
    const idToken = tokenDeGoogle(sub, correo);
    const metodos = (await yo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: CREDENCIAL_SINTETICA }).expect(201)).body.data.methods as { methodId: string; type: string }[];
    const contrasena = metodos.find((m) => m.type === 'PASSWORD')!.methodId;
    const deGoogle = metodos.find((m) => m.type === 'GOOGLE')!.methodId;
    expect((await yo.delete(`/api/v1/me/access-methods/${contrasena}`).expect(422)).body.error.details.issues).toEqual([{ code: 'METHOD_NOT_REMOVABLE', path: 'methodId' }]);
    const sinGoogle = await yo.delete(`/api/v1/me/access-methods/${deGoogle}`).expect(200);
    expect(sinGoogle.body.data).toMatchObject({ methods: [{ type: 'PASSWORD' }], canLinkGoogle: true });
    await yo.delete(`/api/v1/me/access-methods/${deGoogle}`).expect(404);
    // Con la contraseña de ese correo, entrar con Google pide confirmarla (y API-GOO-02 la reasocia).
    expect((await entrarConGoogle(idToken).expect(409)).body.error.code).toBe('GOOGLE_LINK_REQUIRED');
    expect(await prisma.metodoDeAcceso.count({ where: { identidadId: id } })).toBe(2); // el método no se borra
    await yo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: CREDENCIAL_SINTETICA }).expect(201);
    expect((await prisma.cambioDeMetodoDeAcceso.findMany({ where: { metodoDeAccesoId: deGoogle }, orderBy: { numero: 'asc' } })).map((c) => c.accion)).toEqual(['RETIRO', 'REASOCIACION']);
    expect((await entrarConGoogle(idToken).expect(201)).body.data.actor.identityId).toBe(id);
    // Otra cuenta de Google, después de desvincular la primera: todavía no (DL-172 D-5).
    await yo.delete(`/api/v1/me/access-methods/${deGoogle}`).expect(200);
    const otra = await yo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken: tokenDeGoogle(subSintetico(), correo), credential: CREDENCIAL_SINTETICA }).expect(409);
    expect(otra.body.error.code).toBe('GOOGLE_ACCOUNT_REPLACEMENT_NOT_AVAILABLE');
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-MET-03', resultado: 'EXITO', sujetoId: id, motivo: 'METODO_GOOGLE_RETIRADO' } })).toBe(2);
  });

  it('TEST-MET-008 · nunca sin un método: una cuenta creada con Google no lo desvincula, y la base tampoco lo deja', async () => {
    const sub = subSintetico();
    const correo = correoSintetico('met-solo-google');
    const alta = await request(app.getHttpServer())
      .post('/api/v1/auth/federated/google/registrations')
      .send({
        idToken: tokenDeGoogle(sub, correo),
        registrationIntent: 'ADVISEE',
        profile: { displayName: NOMBRE_SINTETICO },
        termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
        privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
        adultDeclaration: { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
      })
      .expect(201);
    const id = alta.body.data.actor.identityId as string;
    const yo = conSesion(app, alta.body.data.session.accessToken as string);
    const lista = (await yo.get('/api/v1/me/access-methods').expect(200)).body.data;
    expect(lista).toMatchObject({ methods: [{ type: 'GOOGLE', email: correo, removable: false }], canLinkGoogle: false });
    expect((await yo.delete(`/api/v1/me/access-methods/${lista.methods[0].methodId}`).expect(409)).body.error.code).toBe('LAST_ACCESS_METHOD');
    await expect(
      prisma.$executeRaw`INSERT INTO "cambio_de_metodo_de_acceso" ("metodo_de_acceso_id", "identidad_id", "numero", "accion", "procedencia")
                         VALUES (${lista.methods[0].methodId}::uuid, ${id}::uuid, 1, 'RETIRO', '{}'::jsonb)`,
    ).rejects.toThrow(/último método/);
    // Sigue entrando con Google.
    await entrarConGoogle(tokenDeGoogle(sub, correo)).expect(201);
  });

  it('TEST-MET-009 · desvincular pide una entrada reciente; el profesional, además, el segundo factor', async () => {
    const correo = correoSintetico('met-reciente');
    const id = await registrarOk(app, correo);
    const yo = conSesion(app, await tokenDe(app, correo));
    const metodos = (await yo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken: tokenDeGoogle(subSintetico(), correo), credential: CREDENCIAL_SINTETICA }).expect(201)).body.data.methods as {
      methodId: string;
      type: string;
    }[];
    const deGoogle = metodos.find((m) => m.type === 'GOOGLE')!.methodId;
    const ahora = Date.now();
    const control = await prisma.controlDeSesion.findUniqueOrThrow({ where: { identidadId: id } });
    const vieja = await prisma.sesion.create({ data: { identidadId: id, momentoDeOcurrencia: new Date(ahora - 11 * 60_000), expiraEn: new Date(ahora + 3_600_000), versionDeControl: control.version } });
    const tokenViejo = app.get(TokensService).firmar({ sub: id, sid: vieja.id, tv: control.version }, vieja.expiraEn);
    expect((await conSesion(app, tokenViejo).delete(`/api/v1/me/access-methods/${deGoogle}`).expect(403)).body.error.code).toBe('STEP_UP_REQUIRED');
    // El profesional con una sesión sin el código del autenticador no vincula ni desvincula.
    const pro = await prepararProfesional(app, 'met-pro', ['ENTRENAMIENTO']);
    const sinCodigo = conSesion(app, await tokenDe(app, pro.correo, 'WEB'));
    expect((await sinCodigo.post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken: tokenDeGoogle(subSintetico(), pro.correo), credential: CREDENCIAL_SINTETICA }).expect(403)).body.error.code).toBe('MFA_REQUIRED');
    await sinCodigo.get('/api/v1/me/access-methods').expect(200);
    // Con el código verificado, sí.
    await conSesion(app, pro.token).post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken: tokenDeGoogle(subSintetico(), pro.correo), credential: CREDENCIAL_SINTETICA }).expect(201);
  });

  it('TEST-MET-010 · una cuenta de Google de otra identidad no se vincula; una desvinculada sin contraseña de ese correo dice que se desvinculó', async () => {
    const ana = correoSintetico('met-ana');
    await registrarOk(app, ana);
    const anaToken = await tokenDe(app, ana);
    const beto = correoSintetico('met-beto');
    await registrarOk(app, beto);
    const betoToken = await tokenDe(app, beto);
    const sub = subSintetico();
    const correoDeGoogle = correoSintetico('met-google-compartida');
    const idToken = tokenDeGoogle(sub, correoDeGoogle);
    const deAna = (await conSesion(app, anaToken).post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: CREDENCIAL_SINTETICA, confirmDifferentEmail: true }).expect(201)).body.data.methods as {
      methodId: string;
      type: string;
    }[];
    expect((await conSesion(app, betoToken).post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: CREDENCIAL_SINTETICA, confirmDifferentEmail: true }).expect(409)).body.error.code).toBe('GOOGLE_ACCOUNT_ALREADY_LINKED');
    await conSesion(app, anaToken).delete(`/api/v1/me/access-methods/${deAna.find((m) => m.type === 'GOOGLE')!.methodId}`).expect(200);
    // Desvinculada, sigue siendo de Ana: Beto no la toma, y entrar o crear una cuenta con ella dice que se desvinculó.
    await conSesion(app, betoToken).post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: CREDENCIAL_SINTETICA, confirmDifferentEmail: true }).expect(409);
    expect((await entrarConGoogle(idToken).expect(409)).body.error.code).toBe('GOOGLE_ACCOUNT_UNLINKED');
    const alta = await request(app.getHttpServer())
      .post('/api/v1/auth/federated/google/registrations')
      .send({
        idToken,
        registrationIntent: 'ADVISEE',
        profile: { displayName: NOMBRE_SINTETICO },
        termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
        privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
        adultDeclaration: { versionId: VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
      })
      .expect(409);
    expect(alta.body.error.code).toBe('GOOGLE_ACCOUNT_UNLINKED');
  });
});
