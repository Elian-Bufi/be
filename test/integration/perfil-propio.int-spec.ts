/**
 * DEUDA_LEGAJO DL-009 (opción B) y DL-040, decididas por Dirección el 2026-10-15, contra PostgreSQL real: el nombre
 * visible del perfil propio (API-ACC-06 y su lectura, API-ACC-06-PROPIA) y quién lo ve.
 * - La persona lo declara, lo cambia o lo quita; cada cambio es una versión que la base solo deja agregar (REG-06-20).
 * - `/me` no cambia: su respuesta estricta es la que valida la APK instalada.
 * - El profesional lo ve mientras el vínculo esté vigente (aceptado o en pausa); con la solicitud pendiente, o cuando
 *   el vínculo terminó, ve la referencia neutral. El correo, nunca.
 */
import type { INestApplication } from '@nestjs/common';
import { ListaDeVinculosResponseSchema, MeResponseSchema, PerfilPropioResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { appDePrueba, conSesion } from './soporte-api';
import { dashboard, finalizar, pausar, prepararAsesorado, prepararProfesional, reanudar, solicitar, versionDeVinculo, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const REFERENCIA = /^Asesorado · [0-9a-f]{6}$/;
const leerPerfil = async (token: string) => PerfilPropioResponseSchema.parse((await conSesion(app, token).get('/api/v1/me/profile').expect(200)).body).data;
const editar = (token: string, cuerpo: object) => conSesion(app, token).patch('/api/v1/me/profile').send(cuerpo);

describe('API-ACC-06 — el nombre visible del perfil propio', () => {
  it('sin versiones es «v0» y sin nombre; guardarlo deja la versión 1, normalizada, una fila nueva y la auditoría; /me no cambia', async () => {
    const ase = await prepararAsesorado(app, 'perfil-alta');
    expect(await leerPerfil(ase.token)).toEqual({ displayName: null, version: 'v0', updatedAt: null });

    const r = await editar(ase.token, { expectedVersion: 'v0', changes: { displayName: '  Martina    Gómez ' } }).expect(200);
    const guardado = PerfilPropioResponseSchema.parse(r.body).data;
    expect(guardado).toMatchObject({ displayName: 'Martina Gómez', version: 'v1' });
    expect(guardado.updatedAt).not.toBeNull();
    expect(await leerPerfil(ase.token)).toEqual(guardado);

    const versiones = await prisma.versionDePerfilPropio.findMany({ where: { perfilPropio: { identidadId: ase.id } } });
    expect(versiones.map((v) => [v.numero, v.nombreVisible])).toEqual([[1, 'Martina Gómez']]);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-ACC-06', resultado: 'EXITO', actorId: ase.id } })).toBe(1);
    // La respuesta de /me sigue siendo la misma: la APK instalada la valida campo por campo.
    expect(MeResponseSchema.parse((await conSesion(app, ase.token).get('/api/v1/me').expect(200)).body).data.profile).toEqual({});
  });

  it('una versión vieja responde 409 VERSION_CONFLICT y no deja nada; quitar el nombre también es una versión', async () => {
    const ase = await prepararAsesorado(app, 'perfil-conflicto');
    await editar(ase.token, { expectedVersion: 'v0', changes: { displayName: 'Lucas Fernández' } }).expect(200);
    const conflicto = await editar(ase.token, { expectedVersion: 'v0', changes: { displayName: 'Otro nombre' } }).expect(409);
    expect(conflicto.body.error.code).toBe('VERSION_CONFLICT');
    expect(await prisma.versionDePerfilPropio.count({ where: { perfilPropio: { identidadId: ase.id } } })).toBe(1);

    const quitado = PerfilPropioResponseSchema.parse((await editar(ase.token, { expectedVersion: 'v1', changes: { displayName: null } }).expect(200)).body).data;
    expect(quitado).toMatchObject({ displayName: null, version: 'v2' });
    expect(await prisma.versionDePerfilPropio.count({ where: { perfilPropio: { identidadId: ase.id } } })).toBe(2);
  });

  it('un nombre vacío, largo o con caracteres de control: 422 INVALID_PROFILE_DATA; un campo que no es del perfil: 400 UNKNOWN_FIELD', async () => {
    const ase = await prepararAsesorado(app, 'perfil-invalido');
    for (const nombre of ['   ', 'x'.repeat(61), 'Ana\u0007Paz', 'Ana​Paz']) {
      const r = await editar(ase.token, { expectedVersion: 'v0', changes: { displayName: nombre } }).expect(422);
      expect(r.body.error.code).toBe('INVALID_PROFILE_DATA');
    }
    // Sesenta caracteres entran: el límite es el de la base.
    await editar(ase.token, { expectedVersion: 'v0', changes: { displayName: 'ñ'.repeat(60) } }).expect(200);
    for (const cuerpo of [
      { expectedVersion: 'v1', changes: { displayName: 'Ana', email: 'ana@example.invalid' } },
      { expectedVersion: 'v1', changes: { displayName: 'Ana' }, registrationIntent: 'PROFESSIONAL' },
    ]) {
      const r = await editar(ase.token, cuerpo).expect(400);
      expect(r.body.error.code).toBe('UNKNOWN_FIELD');
    }
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-ACC-06', resultado: 'RECHAZO', actorId: ase.id } })).toBe(4);
  });

  it('la historia del perfil solo se agrega: la base rechaza cambiar o borrar una versión, y apuntar a una que no es la última', async () => {
    const ase = await prepararAsesorado(app, 'perfil-historia');
    await editar(ase.token, { expectedVersion: 'v0', changes: { displayName: 'Valentina Ruiz' } }).expect(200);
    await editar(ase.token, { expectedVersion: 'v1', changes: { displayName: 'Valentina Ruiz Paz' } }).expect(200);
    const [primera] = await prisma.versionDePerfilPropio.findMany({ where: { perfilPropio: { identidadId: ase.id }, numero: 1 } });
    await expect(prisma.$executeRaw`UPDATE "version_de_perfil_propio" SET "nombre_visible" = 'Otra' WHERE "id" = ${primera!.id}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`DELETE FROM "version_de_perfil_propio" WHERE "id" = ${primera!.id}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`UPDATE "perfil_propio" SET "version_efectiva_id" = ${primera!.id}::uuid WHERE "identidad_id" = ${ase.id}::uuid`).rejects.toThrow(/la última de ese perfil/);
  });
});

describe('DL-040 — el profesional ve el nombre mientras el vínculo está vigente', () => {
  it('pendiente: la referencia; aceptado y en pausa: el nombre; terminado: otra vez la referencia', async () => {
    const pn = await prepararProfesional(app, 'nombre-visible', ['NUTRICION']);
    const ase = await prepararAsesorado(app, 'nombre-visible', { a3: true });
    await editar(ase.token, { expectedVersion: 'v0', changes: { displayName: 'Lucía Fernández' } }).expect(200);
    const nombreEnLaLista = async () =>
      ListaDeVinculosResponseSchema.parse((await conSesion(app, pn.token).get('/api/v1/me/relationships').expect(200)).body).data.find((v) => v.advisee.identityId === ase.id)?.advisee.displayName;

    // Con la solicitud pendiente, la persona todavía no aceptó: ninguna parte de su perfil.
    const otro = await prepararAsesorado(app, 'nombre-pendiente', { a3: true });
    await editar(otro.token, { expectedVersion: 'v0', changes: { displayName: 'Tomás Herrera' } }).expect(200);
    const pendiente = await solicitar(app, pn, otro.id, 'NUTRICION').expect(201);
    expect(pendiente.body.data.advisee.displayName).toMatch(REFERENCIA);

    const { vinculoId } = await vinculoCompleto(app, pn, ase, 'NUTRICION');
    expect(await nombreEnLaLista()).toBe('Lucía Fernández');
    expect((await dashboard(app, pn, ase.id).expect(200)).body.data.advisee.displayName).toBe('Lucía Fernández');

    await pausar(app, pn.token, vinculoId, await versionDeVinculo(app, pn.token, vinculoId), 'DISPONIBILIDAD').expect(200);
    expect(await nombreEnLaLista()).toBe('Lucía Fernández');
    await reanudar(app, pn.token, vinculoId, await versionDeVinculo(app, pn.token, vinculoId)).expect(200);

    await finalizar(app, ase.token, vinculoId, await versionDeVinculo(app, ase.token, vinculoId), 'DECISION_PERSONAL').expect(200);
    expect(await nombreEnLaLista()).toMatch(REFERENCIA);
  });
});
