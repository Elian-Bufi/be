/**
 * WP-USO-FINAL · UF-01 (DEUDA_LEGAJO DL-169; UF-D1 a UF-D5, ratificadas por Dirección el 2026-11-11): el nombre es
 * obligatorio. Contra PostgreSQL real y un Google falso local (`soporte-google.ts`). Oráculos TEST-UF-001 a 005
 * (`docs/paquetes/WP-USO-FINAL-ORACULOS.md`).
 * - El alta con correo (API-ACC-01) y la de Google (API-GOO-03) sin el nombre no crean nada: 422 TERMS_VERSION_NOT_ACCEPTABLE
 *   con DISPLAY_NAME_REQUIRED, lo que un cliente anterior traduce a «Actualizá la app»; en blanco o inválido, VALIDATION_FAILED.
 * - Con el nombre, la cuenta nace con su perfil propio v1, y la auditoría no lo guarda.
 * - Google propone el nombre de la cuenta en el 404 de API-GOO-01 (UF-D2).
 * - El nombre se cambia pero no se quita (UF-D3), y la base no deja una versión nueva sin nombre.
 * - Una cuenta anterior, sin nombre, ve el paso en API-ACC-07 (UF-D4), con el nombre profesional propuesto si lo tiene.
 */
import type { INestApplication } from '@nestjs/common';
import { LoQueFaltaParaSeguirResponseSchema, PerfilPropioResponseSchema, VERSION_VIGENTE } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { VerificacionService } from '../../apps/api/src/profesional/verificacion.service';
import { appDePrueba, claveDeIdempotencia, conSesion, correoSintetico, cuerpoDeRegistro, DECLARACION_DE_MAYORIA, NOMBRE_SINTETICO, tokenDe } from './soporte-api';
import { googleDePrueba, idTokenDeGoogle, levantarGoogleFalso, reclamosDeGoogle, subSintetico, type GoogleFalso } from './soporte-google';
import { cuentaAnteriorSinNombre } from './soporte-nombre';

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

const RUTA_GOOGLE = '/api/v1/auth/federated/google';

const alta = (cuerpo: Record<string, unknown>) => request(app.getHttpServer()).post('/api/v1/registrations').set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo);
const conGoogle = (idToken: string, perfil: Record<string, unknown> | undefined) =>
  request(app.getHttpServer())
    .post(`${RUTA_GOOGLE}/registrations`)
    .send({
      idToken,
      registrationIntent: 'ADVISEE',
      ...(perfil === undefined ? {} : { profile: perfil }),
      termsAcceptance: { versionId: VERSION_VIGENTE.TERMINOS.id },
      privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
      adultDeclaration: DECLARACION_DE_MAYORIA,
    });
const tokenDeGoogle = (correo: string, cambios: Record<string, unknown> = {}) => idTokenDeGoogle(google, reclamosDeGoogle(subSintetico(), correo, cambios));

/** Todo lo que el alta deja de un correo: si quedó algo, el rechazo no fue limpio. */
async function loQueDejo(correo: string): Promise<number> {
  const metodos = await prisma.metodoDeAcceso.findMany({ where: { OR: [{ referencia: correo }, { correo }] }, select: { identidadId: true } });
  return metodos.length;
}
const sinElCuerpoDelPerfil = (correo: string) => {
  const { profile: _perfil, ...resto } = cuerpoDeRegistro(correo);
  return resto;
};

describe('TEST-UF-001 · el alta con correo sin nombre no crea nada (UF-D1)', () => {
  it('sin el perfil, o con el perfil vacío: 422 TERMS_VERSION_NOT_ACCEPTABLE con DISPLAY_NAME_REQUIRED, y nada creado', async () => {
    for (const [etiqueta, cuerpo] of [
      ['sin-perfil', (c: string) => sinElCuerpoDelPerfil(c)],
      ['perfil-vacio', (c: string) => ({ ...sinElCuerpoDelPerfil(c), profile: {} })],
    ] as const) {
      const correo = correoSintetico(`uf001-${etiqueta}`);
      const r = await alta(cuerpo(correo)).expect(422);
      expect(r.body.error.code).toBe('TERMS_VERSION_NOT_ACCEPTABLE');
      expect(r.body.error.details.issues).toEqual([{ code: 'DISPLAY_NAME_REQUIRED', path: 'profile.displayName' }]);
      expect(await loQueDejo(correo)).toBe(0);
    }
  });

  it('en blanco: 422 VALIDATION_FAILED con DISPLAY_NAME_REQUIRED; largo o con invisibles: INVALID_DISPLAY_NAME; nada creado', async () => {
    for (const [nombre, issue] of [
      ['   ', 'DISPLAY_NAME_REQUIRED'],
      ['x'.repeat(61), 'INVALID_DISPLAY_NAME'],
      ['Ana​Paz', 'INVALID_DISPLAY_NAME'],
    ] as const) {
      const correo = correoSintetico('uf001-invalido');
      const r = await alta({ ...cuerpoDeRegistro(correo), profile: { displayName: nombre } }).expect(422);
      expect(r.body.error.code).toBe('VALIDATION_FAILED');
      expect(r.body.error.details.issues).toEqual([{ code: issue, path: 'profile.displayName' }]);
      expect(await loQueDejo(correo)).toBe(0);
    }
  });
});

describe('TEST-UF-002 · con Google, el nombre llega propuesto y sin él tampoco se crea nada (UF-D1 y UF-D2)', () => {
  it('API-GOO-01 propone el nombre de la cuenta de Google en details.name; uno que no se puede guardar, null', async () => {
    const entrar = (idToken: string) => request(app.getHttpServer()).post(`${RUTA_GOOGLE}/sessions`).send({ idToken }).expect(404);
    const correo = correoSintetico('uf002-propuesto');
    expect((await entrar(tokenDeGoogle(correo, { name: '  Persona   de Google ' }))).body.error).toMatchObject({
      code: 'GOOGLE_ACCOUNT_NOT_FOUND',
      details: { email: correo, name: 'Persona de Google' },
    });
    const sinNombre = correoSintetico('uf002-sin-nombre');
    expect((await entrar(tokenDeGoogle(sinNombre, { name: undefined }))).body.error.details).toEqual({ email: sinNombre, name: null });
    const largo = correoSintetico('uf002-largo');
    expect((await entrar(tokenDeGoogle(largo, { name: 'x'.repeat(80) }))).body.error.details).toEqual({ email: largo, name: null });
  });

  it('API-GOO-03 sin el nombre: 422 TERMS_VERSION_NOT_ACCEPTABLE y nada creado; con el nombre corregido, la cuenta nace con ese', async () => {
    const correo = correoSintetico('uf002-alta');
    const idToken = tokenDeGoogle(correo, { name: 'Persona de Google' });
    const sinPerfil = await conGoogle(idToken, undefined).expect(422);
    expect(sinPerfil.body.error).toMatchObject({ code: 'TERMS_VERSION_NOT_ACCEPTABLE', details: { issues: [{ code: 'DISPLAY_NAME_REQUIRED', path: 'profile.displayName' }] } });
    expect(await loQueDejo(correo)).toBe(0);
    const enBlanco = await conGoogle(idToken, { displayName: ' ' }).expect(422);
    expect(enBlanco.body.error).toMatchObject({ code: 'VALIDATION_FAILED', details: { issues: [{ code: 'DISPLAY_NAME_REQUIRED', path: 'profile.displayName' }] } });
    expect(await loQueDejo(correo)).toBe(0);

    const creada = await conGoogle(idToken, { displayName: 'Persona Corregida' }).expect(201);
    const token = creada.body.data.session.accessToken as string;
    // Lo que se guarda es lo que la persona confirmó, no lo que propuso Google.
    expect(PerfilPropioResponseSchema.parse((await conSesion(app, token).get('/api/v1/me/profile').expect(200)).body).data).toMatchObject({ displayName: 'Persona Corregida', version: 'v1' });
  });
});

describe('TEST-UF-003 · la cuenta nace con su nombre: perfil propio v1, con auditoría y sin el nombre en ella', () => {
  it('el alta con correo deja la versión 1, normalizada, con la procedencia del alta; la auditoría no tiene el nombre', async () => {
    const correo = correoSintetico('uf003');
    const r = await alta({ ...cuerpoDeRegistro(correo), profile: { displayName: '  Nombre   De Alta ' } }).expect(201);
    const id = r.body.data.identityId as string;
    const token = await tokenDe(app, correo);
    expect(PerfilPropioResponseSchema.parse((await conSesion(app, token).get('/api/v1/me/profile').expect(200)).body).data).toMatchObject({ displayName: 'Nombre De Alta', version: 'v1' });
    const versiones = await prisma.versionDePerfilPropio.findMany({ where: { perfilPropio: { identidadId: id } } });
    expect(versiones.map((v) => [v.numero, v.nombreVisible, (v.procedencia as { operacion?: string }).operacion])).toEqual([[1, 'Nombre De Alta', 'API-ACC-01']]);
    const auditoria = await prisma.registroDeAuditoria.findMany({ where: { OR: [{ actorId: id }, { sujetoId: id }] } });
    expect(auditoria.some((a) => a.operacion === 'API-ACC-01' && a.resultado === 'EXITO')).toBe(true);
    expect(JSON.stringify(auditoria)).not.toContain('Nombre De Alta');
  });
});

describe('TEST-UF-004 · el nombre se cambia pero no se quita, y la base lo sostiene (UF-D3)', () => {
  it('null o vacío: 422 INVALID_PROFILE_DATA con DISPLAY_NAME_REQUIRED, y el nombre anterior sigue', async () => {
    const correo = correoSintetico('uf004');
    await alta(cuerpoDeRegistro(correo)).expect(201);
    const token = await tokenDe(app, correo);
    for (const displayName of [null, '   ']) {
      const r = await conSesion(app, token).patch('/api/v1/me/profile').send({ expectedVersion: 'v1', changes: { displayName } }).expect(422);
      expect(r.body.error).toMatchObject({ code: 'INVALID_PROFILE_DATA', details: { issues: [{ code: 'DISPLAY_NAME_REQUIRED', path: 'changes.displayName' }] } });
    }
    expect(PerfilPropioResponseSchema.parse((await conSesion(app, token).get('/api/v1/me/profile').expect(200)).body).data).toMatchObject({ displayName: NOMBRE_SINTETICO, version: 'v1' });
    // Se cambia: una versión nueva.
    await conSesion(app, token).patch('/api/v1/me/profile').send({ expectedVersion: 'v1', changes: { displayName: 'Otro Nombre' } }).expect(200);
  });

  it('la base rechaza una versión nueva sin nombre, aunque se escriba por fuera de la API', async () => {
    const correo = correoSintetico('uf004-base');
    const id = (await alta(cuerpoDeRegistro(correo)).expect(201)).body.data.identityId as string;
    const perfil = await prisma.perfilPropio.findUniqueOrThrow({ where: { identidadId: id } });
    await expect(prisma.versionDePerfilPropio.create({ data: { perfilPropioId: perfil.id, numero: 2, nombreVisible: null, procedencia: { fuente: 'PRUEBA' } } })).rejects.toThrow(
      /lleva el nombre visible/,
    );
    expect(await prisma.versionDePerfilPropio.count({ where: { perfilPropioId: perfil.id } })).toBe(1);
  });
});

describe('TEST-UF-005 · «Antes de seguir»: API-ACC-07 lista el nombre que falta y deja de listarlo al guardarlo (UF-D4)', () => {
  const pendientes = async (token: string) => LoQueFaltaParaSeguirResponseSchema.parse((await conSesion(app, token).get('/api/v1/me/pending-steps').expect(200)).body).data.steps;

  it('una cuenta con nombre no tiene nada pendiente; una anterior, sin nombre, tiene el nombre; al guardarlo, nada', async () => {
    const correo = correoSintetico('uf005-con');
    await alta(cuerpoDeRegistro(correo)).expect(201);
    expect(await pendientes(await tokenDe(app, correo))).toEqual([]);

    const anterior = await cuentaAnteriorSinNombre(app, 'uf005');
    expect(await pendientes(anterior.token)).toEqual([{ step: 'DISPLAY_NAME', suggestion: null }]);
    expect(PerfilPropioResponseSchema.parse((await conSesion(app, anterior.token).get('/api/v1/me/profile').expect(200)).body).data).toEqual({ displayName: null, version: 'v0', updatedAt: null });
    await conSesion(app, anterior.token).patch('/api/v1/me/profile').send({ expectedVersion: 'v0', changes: { displayName: 'Ya Tengo Nombre' } }).expect(200);
    expect(await pendientes(anterior.token)).toEqual([]);
  });

  it('con perfil profesional, el paso propone su nombre profesional; sin sesión, 401; con consulta, 400', async () => {
    const anterior = await cuentaAnteriorSinNombre(app, 'uf005-pro', 'WEB');
    await prisma.$transaction((tx) =>
      app.get(VerificacionService).prepararProfesional(tx, anterior.id, { alcance: 'NUTRICION', tipo: 'SANITARIO', nombreVisible: 'Lic. Profesional Sintética' }, new Date()),
    );
    expect(await pendientes(anterior.token)).toEqual([{ step: 'DISPLAY_NAME', suggestion: 'Lic. Profesional Sintética' }]);
    await request(app.getHttpServer()).get('/api/v1/me/pending-steps').expect(401);
    await conSesion(app, anterior.token).get('/api/v1/me/pending-steps?x=1').expect(400);
  });
});
