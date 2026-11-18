/**
 * El segundo factor del profesional después de DL-177 (decisión de Dirección del 2026-11-18, a ratificar): «solo
 * contraseña hasta tener correo». Reemplaza lo que este archivo probaba de UF-11 (DL-169; UF-D12; TEST-UF-014), que hacía
 * obligatorio el autenticador del profesional.
 * - **El profesional entra con su contraseña y actúa como profesional:** API-MFA-01 dice NOT_REQUIRED, y el PDP, las áreas,
 *   las listas, las invitaciones y las novedades responden sin pedir el código. No se le ofrece configurar nada: API-MFA-02
 *   a 06 responden INVALID_STATE_TRANSITION, y la sesión no guarda un segundo factor.
 * - **La persona, igual que siempre:** nunca tuvo segundo factor.
 * - **Administración no se debilita:** la contraseña sola no lee ni decide nada (403 MFA_REQUIRED), el código se pide en
 *   cada sesión, vence a los 15 minutos sin actividad, y la sesión común de un profesional no sirve en la consola.
 * - **API-ADM-19 sigue funcionando** (la consola no lo ofrece mientras la política no lo exija): exige el segundo factor de
 *   la sesión administrativa, deja de valer lo configurado y cierra todas las sesiones de la cuenta.
 */
import type { INestApplication } from '@nestjs/common';
import { SEGUNDO_FACTOR_DEL_PROFESIONAL_EXIGIDO } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion, correoSintetico, registrarOk, tokenDe } from './soporte-api';
import { adm, administradorListo, codigoTotp, primerFactor } from './soporte-administracion';
import { prepararAsesorado, prepararProfesional, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const RUTA = '/api/v1/me/second-factor';
const estado = async (token: string) => (await conSesion(app, token).get(RUTA).expect(200)).body.data;

describe('DL-177 · el profesional entra con su contraseña y actúa como profesional, sin el autenticador', () => {
  it('la política vigente no exige el segundo factor al profesional', () => {
    expect(SEGUNDO_FACTOR_DEL_PROFESIONAL_EXIGIDO).toBe(false);
  });

  it('una sesión recién entrada con la contraseña: el PDP, las áreas, las listas, las invitaciones y las novedades responden', async () => {
    const pro = await prepararProfesional(app, 'dl177-pro', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'dl177-pro', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pro, ase, 'NUTRICION');
    // Otra sesión del mismo profesional, solo con la contraseña: como volver a entrar.
    const nueva = await tokenDe(app, pro.correo, 'WEB');
    expect(await estado(nueva)).toEqual({ secondFactor: { state: 'NOT_REQUIRED' }, recoveryCodesRemaining: null, recentSignInUntil: expect.any(String) });
    const s = conSesion(app, nueva);
    // El PDP: el tablero de la persona.
    await s.get(`/api/v1/advisees/${ase.id}/dashboard`).expect(200);
    // Un área: el catálogo de Nutrición.
    await s.post('/api/v1/nutrition/catalog-items/search').send({ q: 'arroz', limit: 5 }).expect(200);
    // Las listas: su vínculo como profesional y su detalle.
    const vinculos = (await s.get('/api/v1/me/relationships').expect(200)).body.data as { professional: { identityId: string } }[];
    expect(vinculos.filter((v) => v.professional.identityId === pro.id)).toHaveLength(1);
    await s.get(`/api/v1/relationships/${vinculoId}`).expect(200);
    // Invitar, y ver sus invitaciones.
    await s.post('/api/v1/relationship-invitations').send({ scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' }).expect(201);
    expect(((await s.get('/api/v1/relationship-invitations').expect(200)).body.data as unknown[]).length).toBeGreaterThanOrEqual(1);
    // Las novedades que recibe como profesional (la persona aceptó su solicitud).
    const novedades = (await s.get('/api/v1/me/news').expect(200)).body as { data: { source: { identityId: string } | null }[] };
    expect(novedades.data.some((n) => n.source?.identityId === ase.id)).toBe(true);
    // Como persona, todo igual, y sin un paso nuevo.
    await s.get('/api/v1/me').expect(200);
    expect((await s.get('/api/v1/me/pending-steps').expect(200)).body.data.steps).toEqual([]);
    // Ninguna sesión del profesional guardó un segundo factor.
    expect(await prisma.segundoFactorDeSesion.count({ where: { identidadId: pro.id } })).toBe(0);
  });

  it('no se le pide ni se le ofrece el autenticador: API-MFA-02 a 06 no aplican, y la auditoría dice por qué', async () => {
    const pro = await prepararProfesional(app, 'dl177-mfa', ['ENTRENAMIENTO']);
    const s = conSesion(app, pro.token);
    for (const [ruta, cuerpo] of [
      [`${RUTA}/enrollment`, {}],
      [`${RUTA}/enrollment/confirm`, { code: '123456' }],
      [`${RUTA}/verification`, { code: '123456' }],
      [`${RUTA}/recovery-code`, { recoveryCode: 'AAAA-AAAA-AAAA' }],
      [`${RUTA}/recovery-codes`, {}],
    ] as const) {
      const r = await s.post(ruta).send(cuerpo);
      expect([ruta, r.status, r.body.error?.code]).toEqual([ruta, 422, 'INVALID_STATE_TRANSITION']);
    }
    // La sesión sigue sirviendo, y no se creó ningún autenticador, ningún código ni ningún segundo factor de sesión.
    expect((await estado(pro.token)).secondFactor).toEqual({ state: 'NOT_REQUIRED' });
    await s.get('/api/v1/me').expect(200);
    expect(await prisma.factorTotp.count({ where: { identidadId: pro.id } })).toBe(0);
    expect(await prisma.codigoDeRecuperacion.count({ where: { identidadId: pro.id } })).toBe(0);
    expect(await prisma.segundoFactorDeSesion.count({ where: { identidadId: pro.id } })).toBe(0);
    expect(
      await prisma.registroDeAuditoria.count({ where: { actorId: pro.id, operacion: 'API-MFA-04', resultado: 'RECHAZO', motivo: 'PASO_NO_PERMITIDO:SEGUNDO_FACTOR_NO_EXIGIDO' } }),
    ).toBe(1);
  });

  it('una persona sin perfil profesional, como siempre: nada que configurar, y la base no le guarda un segundo factor', async () => {
    const ase = await prepararAsesorado(app, 'dl177-persona', { superficie: 'APK' });
    expect(await estado(ase.token)).toEqual({ secondFactor: { state: 'NOT_REQUIRED' }, recoveryCodesRemaining: null, recentSignInUntil: expect.any(String) });
    const r = await conSesion(app, ase.token).post(`${RUTA}/enrollment`).send({}).expect(422);
    expect(r.body.error.code).toBe('INVALID_STATE_TRANSITION');
    expect(
      await prisma.registroDeAuditoria.count({ where: { actorId: ase.id, operacion: 'API-MFA-04', resultado: 'RECHAZO', motivo: 'PASO_NO_PERMITIDO:SIN_PERFIL_PROFESIONAL' } }),
    ).toBe(1);
    const sesion = await prisma.sesion.findFirstOrThrow({ where: { identidadId: ase.id, estado: 'ACTIVA' }, select: { id: true } });
    await expect(prisma.$executeRaw`INSERT INTO "segundo_factor_de_sesion" ("sesion_id", "identidad_id") VALUES (${sesion.id}::uuid, ${ase.id}::uuid)`).rejects.toThrow(/segundo factor/);
  });
});

describe('DL-177 · Administración sigue igual: contraseña y autenticador, con su vencimiento de 15 minutos', () => {
  it('la contraseña sola no lee ni decide nada; con el código, sí; 15 minutos sin actividad lo vuelven a pedir', async () => {
    const pro = await prepararProfesional(app, 'dl177-adm', ['NUTRICION']);
    const a = await administradorListo(app, prisma, `dl177-${randomUUID().slice(0, 6)}`);
    // Solo la contraseña: la sesión administrativa existe, pero pide el código y no responde nada.
    const solo = await primerFactor(app, a.correo).expect(201);
    expect(solo.body.data.secondFactor.state).toBe('REQUIRED');
    const t = solo.body.data.session.accessToken as string;
    for (const pedido of [adm(app, t).post('/admin/professionals/query').send({}), adm(app, t).get(`/admin/professionals/${pro.id}`)]) {
      const res = await pedido;
      expect([res.status, res.body.error?.code]).toEqual([403, 'MFA_REQUIRED']);
    }
    // Con el código del autenticador, sí.
    await adm(app, t).post('/admin/auth/sessions/current/second-factor').send({ code: codigoTotp(a.secreto, 30_000) }).expect(200);
    await adm(app, t).post('/admin/professionals/query').send({}).expect(200);
    // 15 minutos sin actividad vencen el segundo factor de la sesión administrativa.
    const sesionId = (await adm(app, t).get('/admin/auth/sessions/current').expect(200)).body.data.session.id as string;
    const hace = new Date(Date.now() - 16 * 60_000);
    await prisma.segundoFactorDeSesion.update({ where: { sesionId }, data: { verificadoEn: hace, ultimaActividad: hace } });
    const vencida = await adm(app, t).post('/admin/professionals/query').send({});
    expect([vencida.status, vencida.body.error?.code]).toEqual([403, 'MFA_REQUIRED']);
    expect((await adm(app, t).get('/admin/auth/sessions/current').expect(200)).body.data.secondFactor).toEqual({ state: 'REQUIRED', deadline: null });
  });

  it('la sesión común de un profesional, que ya no pide el código, no sirve en la consola, y su contraseña no la abre', async () => {
    const pro = await prepararProfesional(app, 'dl177-consola', ['NUTRICION']);
    expect((await estado(pro.token)).secondFactor).toEqual({ state: 'NOT_REQUIRED' });
    await adm(app, pro.token).post('/admin/professionals/query').send({}).expect(403);
    await primerFactor(app, pro.correo).expect(401);
  });
});

describe('DL-177 · API-ADM-19 sigue en el contrato (la consola no lo ofrece mientras la política no lo exija)', () => {
  it('exige el segundo factor de Administración; restablecer cierra todas las sesiones, y el profesional vuelve a entrar con su contraseña', async () => {
    const pro = await prepararProfesional(app, 'dl177-rsf', ['NUTRICION']);
    const otra = await tokenDe(app, pro.correo, 'WEB');
    const a = await administradorListo(app, prisma, `dl177-rsf-${randomUUID().slice(0, 6)}`);
    const restablecer = (token: string, cuerpo: Record<string, unknown>) => adm(app, token).post('/admin/professional-second-factor-resets').send(cuerpo);
    const fundamento = 'Escribió desde el correo de la cuenta y confirmó su matrícula (sintético).';

    // Sin el segundo factor de la sesión administrativa: 403. Los 422 en su campo; un correo sin cuenta, 404.
    const sinSegundo = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    expect((await restablecer(sinSegundo, { email: pro.correo, rationale: fundamento }).expect(403)).body.error.code).toBe('MFA_REQUIRED');
    const issue = async (cuerpo: Record<string, unknown>) => (await restablecer(a.token, cuerpo).expect(422)).body.error.details.issues;
    expect(await issue({ email: pro.correo, rationale: '  ' })).toEqual([{ code: 'RATIONALE_REQUIRED', path: 'rationale' }]);
    expect(await issue({ email: a.correo, rationale: fundamento })).toEqual([{ code: 'ACCOUNT_IS_ADMINISTRATIVE', path: 'email' }]);
    const persona = correoSintetico('dl177-rsf-persona');
    await registrarOk(app, persona, 'WEB');
    expect(await issue({ email: persona, rationale: fundamento })).toEqual([{ code: 'ACCOUNT_NOT_PROFESSIONAL', path: 'email' }]);
    await restablecer(a.token, { email: correoSintetico('dl177-rsf-nadie'), rationale: fundamento }).expect(404);

    const hecho = await restablecer(a.token, { email: pro.correo.toUpperCase(), rationale: fundamento }).expect(200);
    expect(hecho.body.data).toMatchObject({ identityId: pro.id, authenticatorRevoked: false });
    expect(hecho.body.data.sessionsRevoked).toBeGreaterThanOrEqual(2);
    for (const viejo of [pro.token, otra]) expect((await conSesion(app, viejo).get('/api/v1/me').expect(401)).body.error.code).toBe('SESSION_REVOKED');
    // Vuelve a entrar solo con la contraseña, y actúa como profesional.
    const nueva = await tokenDe(app, pro.correo, 'WEB');
    expect((await estado(nueva)).secondFactor).toEqual({ state: 'NOT_REQUIRED' });
    await conSesion(app, nueva).post('/api/v1/nutrition/catalog-items/search').send({ q: 'arroz', limit: 5 }).expect(200);
    // El hecho, con el fundamento y el administrador; la auditoría, sin el fundamento.
    expect(await prisma.restablecimientoDeSegundoFactor.findMany({ where: { identidadId: pro.id } })).toEqual([expect.objectContaining({ administradorId: a.id, fundamento })]);
    const auditada = await prisma.registroDeAuditoria.findFirstOrThrow({ where: { operacion: 'API-ADM-19', resultado: 'EXITO', sujetoId: pro.id } });
    expect(auditada).toMatchObject({ actorId: a.id, motivo: `SESIONES_REVOCADAS:${hecho.body.data.sessionsRevoked}` });
    expect(JSON.stringify(auditada)).not.toContain(fundamento);
    // La base no deja registrar un restablecimiento sin un administrador vigente, ni borrarlo.
    await expect(
      prisma.restablecimientoDeSegundoFactor.create({ data: { identidadId: pro.id, administradorId: pro.id, fundamento: 'x', procedencia: { fuente: 'PRUEBA' } } }),
    ).rejects.toThrow(/rol administrativo vigente/);
    await expect(prisma.$executeRaw`DELETE FROM "restablecimiento_de_segundo_factor" WHERE "identidad_id" = ${pro.id}::uuid`).rejects.toThrow();
  });
});
