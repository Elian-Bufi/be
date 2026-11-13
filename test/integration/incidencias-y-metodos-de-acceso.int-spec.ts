/**
 * RF-068 y RF-004 (DEUDA_LEGAJO DL-172; docs/paquetes/WP-RF068-RF004.md) contra PostgreSQL real y un Google falso local.
 * - TEST-INC-007 a 009: avisar un problema, verlo, y Administración que lo gestiona; la historia no se sobrescribe.
 * - TEST-MET-006 a 010: ver, vincular y desvincular Google desde la cuenta, sin quedarse nunca sin un método, con la
 *   entrada reciente y el segundo factor del profesional.
 * - TEST-MET-013 a 015 (la revisión de DL-172): el hecho de cada retiro y reasociación, el aviso por correo de cada cambio
 *   (D-11) y que una cuenta de Google desvinculada ya no identifique la cuenta para recuperar el acceso. El correo va a un
 *   proveedor falso local.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { TokensService } from '../../apps/api/src/sesion/tokens.service';
import { adm, administradorListo } from './soporte-administracion';
import { appDePrueba, conSesion, correoSintetico, CREDENCIAL_SINTETICA, NOMBRE_SINTETICO, OTRA_CREDENCIAL_SINTETICA, registrarOk, tokenDe } from './soporte-api';
import { levantarCorreoFalso, type CorreoFalso } from './soporte-correo';
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

describe('RF-004 · la revisión de DL-172: hechos, avisos y recuperación', () => {
  let correo: CorreoFalso;
  /** Con proveedor de correo (el falso) y con Google (el falso). */
  let conCorreo: INestApplication;
  beforeAll(async () => {
    correo = await levantarCorreoFalso();
    conCorreo = await appDePrueba({ correo: correo.config, ...googleDePrueba(google) });
  });
  afterAll(async () => {
    await conCorreo.close();
    await correo.cerrar();
  });
  const vincular = (a: INestApplication, token: string, idToken: string, confirmar = false) =>
    conSesion(a, token).post('/api/v1/me/access-methods').send({ type: 'GOOGLE', idToken, credential: CREDENCIAL_SINTETICA, ...(confirmar ? { confirmDifferentEmail: true } : {}) });
  const googleDe = (cuerpo: { data: { methods: { methodId: string; type: string }[] } }) => cuerpo.data.methods.find((m) => m.type === 'GOOGLE')!.methodId;
  const hechos = async (identidadId: string, metodoId: string) =>
    (await prisma.eventoDeDominio.findMany({ where: { identidadId }, select: { tipo: true, datos: true, actorId: true } })).filter((e) => (e.datos as { metodoDeAccesoId?: string } | null)?.metodoDeAccesoId === metodoId);

  it('TEST-MET-013 · cada retiro deja MetodoDeAccesoRetirado y cada reasociación MetodoDeAccesoAsociado (también la de API-GOO-02); la lista dice cuál se puede volver a vincular', async () => {
    const acceso = correoSintetico('met-hechos');
    const id = await registrarOk(app, acceso);
    const token = await tokenDe(app, acceso);
    expect((await conSesion(app, token).get('/api/v1/me/access-methods').expect(200)).body.data.relinkableGoogleEmail).toBeNull();
    // Una cuenta de Google con otro correo: se vincula, se desvincula y se reasocia desde la cuenta (API-MET-02 y 03).
    const deGoogle = correoSintetico('met-hechos-google');
    const idToken = tokenDeGoogle(subSintetico(), deGoogle);
    const vinculada = (await vincular(app, token, idToken, true).expect(201)).body;
    expect(vinculada.data.relinkableGoogleEmail).toBeNull();
    const metodo = googleDe(vinculada);
    const sinGoogle = (await conSesion(app, token).delete(`/api/v1/me/access-methods/${metodo}`).expect(200)).body.data;
    expect(sinGoogle).toMatchObject({ canLinkGoogle: true, relinkableGoogleEmail: deGoogle });
    expect((await vincular(app, token, idToken, true).expect(201)).body.data.relinkableGoogleEmail).toBeNull();
    await conSesion(app, token).delete(`/api/v1/me/access-methods/${metodo}`).expect(200);
    const delMetodo = await hechos(id, metodo);
    expect(delMetodo.filter((e) => e.tipo === 'MetodoDeAccesoRetirado')).toHaveLength(2);
    expect(delMetodo.filter((e) => e.tipo === 'MetodoDeAccesoAsociado').map((e) => e.datos)).toEqual(
      expect.arrayContaining([{ metodoDeAccesoId: metodo, tipo: 'GOOGLE' }, { metodoDeAccesoId: metodo, tipo: 'GOOGLE', reasociacion: true }]),
    );
    expect(delMetodo).toHaveLength(4);
    expect(delMetodo.every((e) => e.actorId === id)).toBe(true);

    // La reasociación al entrar (API-GOO-02, con la contraseña del mismo correo) también deja su hecho.
    const otra = correoSintetico('met-hechos-goo02');
    const otraId = await registrarOk(app, otra);
    const otraToken = await tokenDe(app, otra);
    const suToken = tokenDeGoogle(subSintetico(), otra);
    const suMetodo = googleDe((await vincular(app, otraToken, suToken).expect(201)).body);
    await conSesion(app, otraToken).delete(`/api/v1/me/access-methods/${suMetodo}`).expect(200);
    await request(app.getHttpServer()).post('/api/v1/auth/federated/google/links').send({ idToken: suToken, credential: CREDENCIAL_SINTETICA }).expect(201);
    const suyos = await hechos(otraId, suMetodo);
    expect(suyos.map((e) => e.tipo).sort()).toEqual(['MetodoDeAccesoAsociado', 'MetodoDeAccesoAsociado', 'MetodoDeAccesoRetirado']);
    expect(suyos.some((e) => (e.datos as { reasociacion?: boolean }).reasociacion === true)).toBe(true);
  });

  it('TEST-MET-014 · cada vínculo, reasociación o retiro se avisa al correo de acceso, con la cuenta de Google y el consejo de cambiar la contraseña (D-11)', async () => {
    const acceso = correoSintetico('met-aviso');
    await registrarOk(conCorreo, acceso);
    const token = await tokenDe(conCorreo, acceso);
    const deGoogle = correoSintetico('met-aviso-google');
    const idToken = tokenDeGoogle(subSintetico(), deGoogle);
    const metodo = googleDe((await vincular(conCorreo, token, idToken, true).expect(201)).body);
    const avisoDeVinculo = await correo.esperar(acceso);
    expect(avisoDeVinculo.asunto).toBe('Se vinculó una cuenta de Google a tu cuenta de BE');
    expect(avisoDeVinculo.texto).toContain(`se vinculó la cuenta de Google ${deGoogle}`);
    expect(avisoDeVinculo.texto).toMatch(/cambiá tu contraseña/);
    // A la cuenta de Google no le llega nada: el aviso es para el titular, en su correo de acceso.
    expect(correo.recibidos.some((m) => m.para === deGoogle)).toBe(false);
    // Repetirlo (200, sin cambios) no avisa de nuevo.
    await vincular(conCorreo, token, idToken, true).expect(200);
    await conSesion(conCorreo, token).delete(`/api/v1/me/access-methods/${metodo}`).expect(200);
    await correo.esperar(acceso, 2);
    const tras = correo.recibidos.filter((m) => m.para === acceso);
    expect(tras.map((m) => m.asunto)).toEqual(['Se vinculó una cuenta de Google a tu cuenta de BE', 'Se desvinculó una cuenta de Google de tu cuenta de BE']);
    expect(tras[1]!.texto).toContain(`se desvinculó la cuenta de Google ${deGoogle}`);

    // Al entrar: vincular (API-GOO-02) con la contraseña del mismo correo también avisa.
    const otra = correoSintetico('met-aviso-goo02');
    await registrarOk(conCorreo, otra);
    await request(conCorreo.getHttpServer()).post('/api/v1/auth/federated/google/links').send({ idToken: tokenDeGoogle(subSintetico(), otra), credential: CREDENCIAL_SINTETICA }).expect(201);
    expect((await correo.esperar(otra)).asunto).toBe('Se vinculó una cuenta de Google a tu cuenta de BE');
  });

  it('TEST-MET-015 · una cuenta de Google desvinculada ya no identifica la cuenta: recuperar con su correo no sugiere entrar con Google, y Administración no la encuentra por él', async () => {
    const acceso = correoSintetico('met-recuperar');
    const id = await registrarOk(conCorreo, acceso);
    const token = await tokenDe(conCorreo, acceso);
    const deGoogle = correoSintetico('met-recuperar-google');
    const metodo = googleDe((await vincular(conCorreo, token, tokenDeGoogle(subSintetico(), deGoogle), true).expect(201)).body);
    const pedir = () => request(conCorreo.getHttpServer()).post('/api/v1/auth/recovery-requests').set('X-BE-Surface', 'WEB').send({ identifier: deGoogle }).expect(202);
    // Vinculada, el correo de Google la identifica (como antes de esta revisión): SIN_CONTRASENA y el correo de «entrá con Google».
    const antes = await pedir();
    expect(await prisma.registroDeAuditoria.findFirst({ where: { operacion: 'API-ACC-P1-01', requestId: antes.headers['x-request-id'] as string } })).toMatchObject({ motivo: 'SIN_CONTRASENA', sujetoId: id });
    expect((await correo.esperar(deGoogle)).texto).toMatch(/Continuar con Google/);
    await conSesion(conCorreo, token).delete(`/api/v1/me/access-methods/${metodo}`).expect(200);
    // Desvinculada: como un correo sin cuenta. No le escribe «entrá con Google» (entrar con ella responde GOOGLE_ACCOUNT_UNLINKED).
    const recibidosAntes = correo.recibidos.filter((m) => m.para === deGoogle).length;
    const despues = await pedir();
    expect(await prisma.registroDeAuditoria.findFirst({ where: { operacion: 'API-ACC-P1-01', requestId: despues.headers['x-request-id'] as string } })).toMatchObject({ motivo: 'CUENTA_INEXISTENTE', sujetoId: null });
    // Un pedido con cuenta que manda correo después: cuando llega el suyo, el anterior ya se procesó.
    await request(conCorreo.getHttpServer()).post('/api/v1/auth/recovery-requests').set('X-BE-Surface', 'WEB').send({ identifier: acceso }).expect(202);
    // Tres a su correo de acceso: los avisos de vincular y de desvincular (D-11) y el código.
    await correo.esperar(acceso, 3);
    expect(correo.recibidos.filter((m) => m.para === acceso).some((m) => /código/.test(m.asunto))).toBe(true);
    expect(correo.recibidos.filter((m) => m.para === deGoogle)).toHaveLength(recibidosAntes);

    // La recuperación asistida (API-ADM-18) tampoco la encuentra por ese correo; por el de acceso, sí.
    const a = await administradorListo(conCorreo, prisma, `met-rec-${randomUUID().slice(0, 6)}`);
    const asistida = (email: string) => adm(conCorreo, a.token).post('/admin/access-recoveries').send({ email, rationale: 'Verificada por videollamada con su documento.' });
    expect((await asistida(deGoogle).expect(404)).body.error.code).toBe('RESOURCE_NOT_FOUND');
    await asistida(acceso).expect(201);
  });
});
