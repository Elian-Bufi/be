/**
 * WP-USO-FINAL · UF-11 (DEUDA_LEGAJO DL-169; UF-D12, ratificada por Dirección el 2026-11-11; 08 §25 y §42, condición 6):
 * el segundo factor del profesional. Oráculo TEST-UF-014 (`docs/paquetes/WP-USO-FINAL-ORACULOS.md`).
 * - Una sesión de una identidad con perfil profesional, sin el segundo factor verificado, no lee ni decide nada como
 *   profesional: ni por el PDP, ni por un área, ni por las listas donde es el profesional. Como persona, todo igual, y
 *   API-ACC-07 no suma un paso (la APK 0.24 pediría actualizar).
 * - La primera vez se configura dentro de los 10 minutos de entrar (API-MFA-04 y 05); después se verifica con el
 *   autenticador (API-MFA-02) o con un código de recuperación de un solo uso (API-MFA-03), y se reemplaza o se renuevan
 *   los códigos desde una sesión reciente verificada (las otras sesiones vuelven a pedir el código).
 * - Los códigos se calculan con `otpauth` sobre la clave que devuelve la configuración; nada de eso queda en la auditoría.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { VerificacionService } from '../../apps/api/src/profesional/verificacion.service';
import { appDePrueba, conSesion, correoSintetico, registrarOk, tokenDe } from './soporte-api';
import { randomUUID } from 'node:crypto';
import { adm, administradorListo, codigoQueNoVale, primerFactor } from './soporte-administracion';
import { codigoDelPaso, verificarSegundoFactor } from './soporte-segundo-factor';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from './soporte-vinculo';

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
const pasoActual = (): number => Math.floor(Date.now() / 30_000);
const estado = async (token: string) => (await conSesion(app, token).get(RUTA).expect(200)).body.data;

/** Un profesional de Nutrición sin autenticador, recién entrado: como uno que incorporó Administración. */
async function profesionalSinAutenticador(etiqueta: string): Promise<Parte> {
  const correo = correoSintetico(`uf11-${etiqueta}`);
  const id = await registrarOk(app, correo, 'WEB');
  await app.get(PrismaService).$transaction((tx) =>
    app.get(VerificacionService).prepararProfesional(tx, id, { alcance: 'NUTRICION', tipo: 'SANITARIO', nombreVisible: `Lic. Segundo Factor ${etiqueta}` }, new Date()),
  );
  return { correo, id, token: await tokenDe(app, correo, 'WEB') };
}

/** Configura el autenticador por la API, como `/pro`, y devuelve la clave, el paso usado y los códigos. */
async function configurar(token: string): Promise<{ secreto: string; paso: number; codigos: string[] }> {
  const configuracion = await conSesion(app, token).post(`${RUTA}/enrollment`).send({}).expect(200);
  const secreto = configuracion.body.data.secret as string;
  const paso = pasoActual();
  const confirmada = await conSesion(app, token).post(`${RUTA}/enrollment/confirm`).send({ code: codigoDelPaso(secreto, paso) }).expect(200);
  return { secreto, paso, codigos: [...(confirmada.body.data.recoveryCodes as string[])] };
}

describe('TEST-UF-014 · sin el segundo factor, la sesión no actúa como profesional; como persona, todo igual', () => {
  it('el PDP, las áreas, las listas y las invitaciones del profesional no responden nada profesional hasta verificar', async () => {
    const pro = await prepararProfesional(app, 'uf11-sin', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'uf11-sin', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pro, ase, 'NUTRICION');
    // Otra sesión del mismo profesional, sin verificar: como volver a entrar.
    const sin = await tokenDe(app, pro.correo, 'WEB');
    expect((await estado(sin)).secondFactor).toEqual({ state: 'REQUIRED' });
    const s = conSesion(app, sin);
    // El PDP: el tablero de la persona, el mismo 404 que lo ajeno.
    await s.get(`/api/v1/advisees/${ase.id}/dashboard`).expect(404);
    await conSesion(app, pro.token).get(`/api/v1/advisees/${ase.id}/dashboard`).expect(200);
    // Un área: el catálogo de Nutrición, como a quien no la opera.
    await s.post('/api/v1/nutrition/catalog-items/search').send({ q: 'arroz', limit: 5 }).expect(403);
    // Las listas: sus vínculos como profesional no existen para esta sesión, ni su detalle ni sus transiciones.
    const vinculos = (await s.get('/api/v1/me/relationships').expect(200)).body.data as { professional: { identityId: string } }[];
    expect(vinculos.filter((v) => v.professional.identityId === pro.id)).toEqual([]);
    expect(((await conSesion(app, pro.token).get('/api/v1/me/relationships').expect(200)).body.data as unknown[]).length).toBe(1);
    await s.get(`/api/v1/relationships/${vinculoId}`).expect(404);
    const solicitudes = (await s.get('/api/v1/me/relationship-requests').expect(200)).body.data as unknown[];
    expect(solicitudes).toEqual([]);
    // Invitar, como quien no opera el área; y sus invitaciones no aparecen.
    const invitar = await s.post('/api/v1/relationship-invitations').send({ scope: { code: 'NUTRICION' }, purpose: 'ACOMPANAMIENTO_NUTRICIONAL' }).expect(422);
    expect(invitar.body.error.code).toBe('SCOPE_NOT_AVAILABLE');
    expect((await s.get('/api/v1/relationship-invitations').expect(200)).body.data).toEqual([]);
    // Las novedades que recibe como profesional (la persona aceptó su solicitud) tampoco.
    const conSegundoFactor = (await conSesion(app, pro.token).get('/api/v1/me/news').expect(200)).body as { data: { source: { identityId: string } | null }[] };
    expect(conSegundoFactor.data.some((n) => n.source?.identityId === ase.id)).toBe(true);
    const sinSegundoFactor = (await s.get('/api/v1/me/news').expect(200)).body as { data: { source: { identityId: string } | null }[] };
    expect(sinSegundoFactor.data.filter((n) => n.source?.identityId === ase.id)).toEqual([]);
    // Como persona, todo igual: /me, su perfil y lo que falta, sin un paso nuevo.
    await s.get('/api/v1/me').expect(200);
    await s.get('/api/v1/me/profile').expect(200);
    expect((await s.get('/api/v1/me/pending-steps').expect(200)).body.data.steps).toEqual([]);
    // Al verificar, la misma sesión actúa como profesional.
    await verificarSegundoFactor(app, pro.id, sin);
    expect((await estado(sin)).secondFactor.state).toBe('VERIFIED');
    await s.get(`/api/v1/advisees/${ase.id}/dashboard`).expect(200);
    await s.post('/api/v1/nutrition/catalog-items/search').send({ q: 'arroz', limit: 5 }).expect(200);
    await s.get(`/api/v1/relationships/${vinculoId}`).expect(200);
  });

  it('una persona sin perfil profesional no tiene nada que configurar, y la base no le guarda un segundo factor', async () => {
    const ase = await prepararAsesorado(app, 'uf11-persona', { superficie: 'APK' });
    expect(await estado(ase.token)).toEqual({ secondFactor: { state: 'NOT_REQUIRED' }, recoveryCodesRemaining: null, recentSignInUntil: expect.any(String) });
    const r = await conSesion(app, ase.token).post(`${RUTA}/enrollment`).send({}).expect(422);
    expect(r.body.error.code).toBe('INVALID_STATE_TRANSITION');
    const sesion = await prisma.sesion.findFirstOrThrow({ where: { identidadId: ase.id, estado: 'ACTIVA' }, select: { id: true } });
    await expect(prisma.$executeRaw`INSERT INTO "segundo_factor_de_sesion" ("sesion_id", "identidad_id") VALUES (${sesion.id}::uuid, ${ase.id}::uuid)`).rejects.toThrow(/segundo factor/);
  });
});

describe('TEST-UF-014 · configurar, verificar, recuperar y reemplazar', () => {
  it('la primera vez se configura dentro de los 10 minutos de entrar, con diez códigos; un código que no vale descuenta intentos', async () => {
    const pro = await profesionalSinAutenticador('config');
    const inicial = await estado(pro.token);
    expect(inicial.secondFactor.state).toBe('ENROLLMENT_REQUIRED');
    const sesion = await prisma.sesion.findFirstOrThrow({ where: { identidadId: pro.id, estado: 'ACTIVA' }, select: { momentoDeOcurrencia: true } });
    expect(new Date(inicial.secondFactor.deadline).getTime() - sesion.momentoDeOcurrencia.getTime()).toBe(10 * 60 * 1000);
    const configuracion = await conSesion(app, pro.token).post(`${RUTA}/enrollment`).send({}).expect(200);
    const secreto = configuracion.body.data.secret as string;
    expect(configuracion.body.data.otpauthUri).toMatch(/^otpauth:\/\/totp\//);
    const mal = await conSesion(app, pro.token).post(`${RUTA}/enrollment/confirm`).send({ code: codigoQueNoVale(secreto) }).expect(422);
    expect(mal.body.error).toMatchObject({ code: 'SECOND_FACTOR_INVALID', details: { attemptsRemaining: 4 } });
    const bien = await conSesion(app, pro.token).post(`${RUTA}/enrollment/confirm`).send({ code: codigoDelPaso(secreto, pasoActual()) }).expect(200);
    expect(bien.body.data.recoveryCodes).toHaveLength(10);
    expect(bien.body.data.secondFactor).toEqual({ state: 'VERIFIED', method: 'ENROLLMENT' });
    expect((await estado(pro.token)).recoveryCodesRemaining).toBe(10);
    // Ni la clave ni los códigos en la auditoría.
    const auditoria = JSON.stringify(await prisma.registroDeAuditoria.findMany({ where: { actorId: pro.id, operacion: { startsWith: 'API-MFA-' } } }));
    expect(auditoria).toContain('API-MFA-05');
    expect(auditoria).not.toContain(secreto);
    for (const c of bien.body.data.recoveryCodes as string[]) expect(auditoria).not.toContain(c);
  });

  it('otra sesión: el código de recuperación vale una sola vez, el del autenticador también, y el bloqueo de intentos revoca la sesión', async () => {
    const pro = await profesionalSinAutenticador('otra');
    const { secreto, paso, codigos } = await configurar(pro.token);
    // Con un código de recuperación: verificada, con uno menos.
    const s2 = await tokenDe(app, pro.correo, 'WEB');
    expect((await estado(s2)).secondFactor).toEqual({ state: 'REQUIRED' });
    const recuperada = await conSesion(app, s2).post(`${RUTA}/recovery-code`).send({ recoveryCode: codigos[0] }).expect(200);
    expect(recuperada.body.data).toEqual({ secondFactor: { state: 'VERIFIED', method: 'RECOVERY_CODE' }, recoveryCodesRemaining: 9 });
    // El mismo código otra vez, en otra sesión: no vale.
    const s3 = await tokenDe(app, pro.correo, 'WEB');
    await conSesion(app, s3).post(`${RUTA}/recovery-code`).send({ recoveryCode: codigos[0] }).expect(422);
    // El del autenticador del paso siguiente al de la configuración vale; el mismo, otra vez, no.
    const siguiente = codigoDelPaso(secreto, paso + 1);
    expect((await conSesion(app, s3).post(`${RUTA}/verification`).send({ code: siguiente }).expect(200)).body.data.secondFactor).toEqual({ state: 'VERIFIED', method: 'TOTP' });
    const s4 = await tokenDe(app, pro.correo, 'WEB');
    await conSesion(app, s4).post(`${RUTA}/verification`).send({ code: siguiente }).expect(422);
    // Cinco códigos que no valen en una sesión la revocan (el quinto ya responde 401).
    const s5 = await tokenDe(app, pro.correo, 'WEB');
    for (let i = 0; i < 4; i++) await conSesion(app, s5).post(`${RUTA}/verification`).send({ code: codigoQueNoVale(secreto) }).expect(422);
    await conSesion(app, s5).post(`${RUTA}/verification`).send({ code: codigoQueNoVale(secreto) }).expect(401);
    await conSesion(app, s5).get('/api/v1/me').expect(401);
    // Las demás sesiones siguen: la de la configuración, verificada.
    expect((await estado(pro.token)).secondFactor.state).toBe('VERIFIED');
  });

  it('reemplazar el autenticador y renovar los códigos: el nuevo vale, el viejo no, y las otras sesiones vuelven a pedir el código', async () => {
    const pro = await profesionalSinAutenticador('reemplazo');
    const viejo = await configurar(pro.token);
    const otra = await tokenDe(app, pro.correo, 'WEB');
    await conSesion(app, otra).post(`${RUTA}/recovery-code`).send({ recoveryCode: viejo.codigos[0] }).expect(200);
    // Reemplazo desde la sesión de la configuración: reciente y verificada.
    expect((await estado(pro.token)).recentSignInUntil).not.toBeNull();
    const nuevo = await configurar(pro.token);
    expect(nuevo.secreto).not.toBe(viejo.secreto);
    // La otra sesión vuelve a pedir el código; los códigos viejos y el autenticador viejo ya no valen.
    expect((await estado(otra)).secondFactor).toEqual({ state: 'REQUIRED' });
    await conSesion(app, otra).post(`${RUTA}/recovery-code`).send({ recoveryCode: viejo.codigos[1] }).expect(422);
    await conSesion(app, otra).post(`${RUTA}/verification`).send({ code: codigoDelPaso(viejo.secreto, pasoActual()) }).expect(422);
    await conSesion(app, otra).post(`${RUTA}/verification`).send({ code: codigoDelPaso(nuevo.secreto, nuevo.paso + 1) }).expect(200);
    // Códigos nuevos desde la sesión reciente: los anteriores dejan de valer y la otra sesión vuelve a pedir el código.
    const renovados = (await conSesion(app, pro.token).post(`${RUTA}/recovery-codes`).send({}).expect(200)).body.data.recoveryCodes as string[];
    expect(renovados).toHaveLength(10);
    expect((await estado(otra)).secondFactor).toEqual({ state: 'REQUIRED' });
    await conSesion(app, otra).post(`${RUTA}/recovery-code`).send({ recoveryCode: nuevo.codigos[0] }).expect(422);
    await conSesion(app, otra).post(`${RUTA}/recovery-code`).send({ recoveryCode: renovados[0] }).expect(200);
    // Sin el segundo factor vigente no se reemplaza nada.
    const sinVerificar = await tokenDe(app, pro.correo, 'WEB');
    expect((await conSesion(app, sinVerificar).post(`${RUTA}/enrollment`).send({}).expect(422)).body.error.code).toBe('INVALID_STATE_TRANSITION');
    expect((await conSesion(app, sinVerificar).post(`${RUTA}/recovery-codes`).send({}).expect(422)).body.error.code).toBe('INVALID_STATE_TRANSITION');
  });
});

describe('TEST-UF-014 · Administración restablece el segundo factor de un profesional (API-ADM-19, UF-T56)', () => {
  it('quien configuró un autenticador ajeno queda afuera: se revoca, los códigos dejan de valer, las sesiones terminan y el profesional lo configura de nuevo', async () => {
    // Revisión adversarial de la etapa 2: con la contraseña del profesional, otro configuró su autenticador en los primeros
    // 10 minutos. Sin esta operación, el profesional legítimo quedaba en REQUIRED para siempre.
    const pro = await profesionalSinAutenticador('restablecer');
    const ajeno = await configurar(pro.token);
    const otra = await tokenDe(app, pro.correo, 'WEB');
    expect((await estado(otra)).secondFactor).toEqual({ state: 'REQUIRED' });
    const a = await administradorListo(app, prisma, `uf11-rsf-${randomUUID().slice(0, 6)}`);
    const restablecer = (token: string, cuerpo: Record<string, unknown>) => adm(app, token).post('/admin/professional-second-factor-resets').send(cuerpo);
    const fundamento = 'Escribió desde el correo de la cuenta y confirmó su matrícula (sintético).';

    // Sin el segundo factor de la sesión administrativa: 403. Los 422 en su campo; un correo sin cuenta, 404.
    const sinSegundo = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    expect((await restablecer(sinSegundo, { email: pro.correo, rationale: fundamento }).expect(403)).body.error.code).toBe('MFA_REQUIRED');
    const issue = async (cuerpo: Record<string, unknown>) => (await restablecer(a.token, cuerpo).expect(422)).body.error.details.issues;
    expect(await issue({ email: pro.correo, rationale: '  ' })).toEqual([{ code: 'RATIONALE_REQUIRED', path: 'rationale' }]);
    expect(await issue({ email: a.correo, rationale: fundamento })).toEqual([{ code: 'ACCOUNT_IS_ADMINISTRATIVE', path: 'email' }]);
    const persona = correoSintetico('uf11-rsf-persona');
    await registrarOk(app, persona, 'WEB');
    expect(await issue({ email: persona, rationale: fundamento })).toEqual([{ code: 'ACCOUNT_NOT_PROFESSIONAL', path: 'email' }]);
    await restablecer(a.token, { email: correoSintetico('uf11-rsf-nadie'), rationale: fundamento }).expect(404);

    const hecho = await restablecer(a.token, { email: pro.correo.toUpperCase(), rationale: fundamento }).expect(200);
    expect(hecho.body.data).toMatchObject({ identityId: pro.id, authenticatorRevoked: true });
    expect(hecho.body.data.sessionsRevoked).toBeGreaterThanOrEqual(2);
    // Las sesiones de antes terminan; el autenticador y los códigos ajenos ya no valen.
    for (const viejo of [pro.token, otra]) expect((await conSesion(app, viejo).get('/api/v1/me').expect(401)).body.error.code).toBe('SESSION_REVOKED');
    expect(await prisma.factorTotp.count({ where: { identidadId: pro.id, estado: 'ACTIVO' } })).toBe(0);
    expect(await prisma.codigoDeRecuperacion.count({ where: { identidadId: pro.id, momentoDeUso: null, momentoDeInvalidacion: null } })).toBe(0);
    // El profesional entra de nuevo y lo configura él: el autenticador ajeno no sirve para verificar.
    const nueva = await tokenDe(app, pro.correo, 'WEB');
    expect((await estado(nueva)).secondFactor.state).toBe('ENROLLMENT_REQUIRED');
    const propio = await configurar(nueva);
    expect(propio.secreto).not.toBe(ajeno.secreto);
    expect((await estado(nueva)).secondFactor.state).toBe('VERIFIED');
    // El hecho, con el fundamento y el administrador; la auditoría, sin el fundamento.
    expect(await prisma.restablecimientoDeSegundoFactor.findMany({ where: { identidadId: pro.id } })).toEqual([
      expect.objectContaining({ administradorId: a.id, fundamento, autenticadorRevocado: true }),
    ]);
    const auditada = await prisma.registroDeAuditoria.findFirstOrThrow({ where: { operacion: 'API-ADM-19', resultado: 'EXITO', sujetoId: pro.id } });
    expect(auditada).toMatchObject({ actorId: a.id, motivo: `SESIONES_REVOCADAS:${hecho.body.data.sessionsRevoked}` });
    expect(JSON.stringify(auditada)).not.toContain(fundamento);
    // La base no deja registrar un restablecimiento sin un administrador vigente, ni borrarlo.
    await expect(
      prisma.restablecimientoDeSegundoFactor.create({ data: { identidadId: pro.id, administradorId: pro.id, fundamento: 'x', autenticadorRevocado: false, procedencia: { fuente: 'PRUEBA' } } }),
    ).rejects.toThrow(/rol administrativo vigente/);
    await expect(prisma.$executeRaw`DELETE FROM "restablecimiento_de_segundo_factor" WHERE "identidad_id" = ${pro.id}::uuid`).rejects.toThrow();
  });
});
