/**
 * WP-USO-FINAL · UF-04 (DEUDA_LEGAJO DL-169; UF-D6 a UF-D8, ratificadas por Dirección el 2026-11-11): la entrada de los
 * profesionales reales. Oráculo TEST-UF-009 (`docs/paquetes/WP-USO-FINAL-ORACULOS.md`).
 * - API-ADM-14: Administración incorpora una cuenta que ya existe, con una sesión administrativa con segundo factor y con
 *   fundamento. Crea el perfil con su matrícula y, por área, la presentación, la verificación y la habilitación, con los
 *   hechos de M-02 del administrador. Un rechazo no deja nada a medias.
 * - El profesional entra a /pro con su segundo factor (UF-11), y la persona que acepta su solicitud ve su nombre
 *   profesional.
 * - API-ADM-15: el nombre profesional cambia con fundamento y su hecho; la base no deja cambiarlo sin él.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion, correoSintetico, registrarOk, tokenDe } from './soporte-api';
import { adm, administradorListo, primerFactor } from './soporte-administracion';
import { verificarSegundoFactor } from './soporte-segundo-factor';
import { aceptar, prepararAsesorado, solicitar } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const etiqueta = (e: string) => `uf04-${e}-${randomUUID().slice(0, 6)}`;
const FUNDAMENTO = 'Matrícula MN 000000 verificada en el registro público sintético el 2026-11-12.';
const cuerpo = (correo: string, cambios: Record<string, unknown> = {}) => ({
  email: correo,
  professionalName: 'Lic. Incorporada Sintética',
  profileType: 'HEALTH_PROFESSIONAL',
  license: { number: 'MN 000000', jurisdiction: 'Ciudad Autónoma de Buenos Aires' },
  scopes: ['NUTRICION'],
  rationale: FUNDAMENTO,
  ...cambios,
});
const incorporar = (token: string, body: Record<string, unknown>, clave = claveDeIdempotencia()) => adm(app, token).post('/admin/professionals').set('Idempotency-Key', clave).send(body);
/** Lo que dejó en la base una incorporación de esta identidad: perfil, verificaciones, habilitaciones y hechos. */
const loQueDejo = async (identidadId: string) => ({
  perfiles: await prisma.perfilProfesional.count({ where: { identidadId } }),
  verificaciones: await prisma.verificacionProfesional.count({ where: { identidadId } }),
  habilitaciones: await prisma.habilitacion.count({ where: { identidadId } }),
  hechos: await prisma.eventoDeVerificacion.count({ where: { identidadId } }),
});

describe('TEST-UF-009 · API-ADM-14: Administración incorpora a un profesional real', () => {
  it('solo con una sesión administrativa con segundo factor; el profesional queda con sus áreas, su matrícula y los hechos del administrador', async () => {
    const a = await administradorListo(app, prisma, etiqueta('admin'));
    const correo = correoSintetico('uf04-pro');
    const id = await registrarOk(app, correo, 'WEB');
    // Una sesión común no obtiene nada de Administración; una administrativa sin el segundo factor, tampoco.
    const persona = await prepararAsesorado(app, 'uf04-comun');
    await conSesion(app, persona.token).post('/api/v1/admin/professionals').send(cuerpo(correo)).expect(403);
    const sinSegundoFactor = (await primerFactor(app, a.correo).expect(201)).body.data.session.accessToken as string;
    expect((await incorporar(sinSegundoFactor, cuerpo(correo)).expect(403)).body.error.code).toBe('MFA_REQUIRED');
    expect(await loQueDejo(id)).toEqual({ perfiles: 0, verificaciones: 0, habilitaciones: 0, hechos: 0 });

    const clave = claveDeIdempotencia();
    const r = await incorporar(a.token, cuerpo(` ${correo.toUpperCase()} `), clave).expect(201);
    expect(r.body.data.professional).toMatchObject({
      professionalId: id,
      displayName: 'Lic. Incorporada Sintética',
      profileType: 'HEALTH_PROFESSIONAL',
      email: correo,
      license: { number: 'MN 000000', jurisdiction: 'Ciudad Autónoma de Buenos Aires' },
    });
    const nutricion = (r.body.data.scopes as { scope: string; situation: string; canOperate: boolean }[]).find((s) => s.scope === 'NUTRICION');
    expect(nutricion).toMatchObject({ situation: 'CAN_OPERATE', canOperate: true });
    expect((r.body.data.scopes as { scope: string; situation: string }[]).filter((s) => s.scope !== 'NUTRICION').every((s) => s.situation === 'NOT_PRESENTED')).toBe(true);
    // Los hechos de M-02, del administrador y con el fundamento.
    const hechos = await prisma.eventoDeVerificacion.findMany({ where: { identidadId: id }, orderBy: { secuencia: 'asc' } });
    expect(hechos.map((h) => h.tipo)).toEqual(['PerfilProfesionalCreado', 'AlcancePresentado', 'AlcanceVerificado', 'HabilitacionConcedida']);
    expect(hechos.every((h) => h.tipoDeActor === 'ADMINISTRADOR' && h.administradorId === a.id && h.fundamento === FUNDAMENTO)).toBe(true);
    const perfil = await prisma.perfilProfesional.findUniqueOrThrow({ where: { identidadId: id } });
    expect(perfil).toMatchObject({ tipo: 'SANITARIO', nombreVisible: 'Lic. Incorporada Sintética', matriculaNumero: 'MN 000000', matriculaJurisdiccion: 'Ciudad Autónoma de Buenos Aires' });
    // La auditoría registra la incorporación, sin el fundamento ni la matrícula.
    const auditoria = await prisma.registroDeAuditoria.findMany({ where: { operacion: 'API-ADM-14', sujetoId: id } });
    expect(auditoria.map((x) => x.resultado)).toContain('EXITO');
    expect(JSON.stringify(auditoria)).not.toContain('MN 000000');
    expect(JSON.stringify(auditoria)).not.toContain('registro público');
    // La misma clave devuelve lo mismo; otra clave, 422: ya es profesional.
    expect((await incorporar(a.token, cuerpo(` ${correo.toUpperCase()} `), clave).expect(201)).body).toEqual(r.body);
    const otra = await incorporar(a.token, cuerpo(correo)).expect(422);
    expect(otra.body.error.details.issues).toEqual([{ code: 'ALREADY_PROFESSIONAL', path: 'email' }]);
    expect(await loQueDejo(id)).toEqual({ perfiles: 1, verificaciones: 1, habilitaciones: 1, hechos: 4 });
  });

  it('lo que no se puede pedir no deja nada: sin fundamento, sin matrícula, un correo sin cuenta y una cuenta administrativa', async () => {
    const a = await administradorListo(app, prisma, etiqueta('rechazos'));
    const correo = correoSintetico('uf04-rechazo');
    const id = await registrarOk(app, correo, 'WEB');
    const issues = async (cambios: Record<string, unknown>) => (await incorporar(a.token, cuerpo(correo, cambios)).expect(422)).body.error.details.issues;
    expect(await issues({ rationale: '  ' })).toEqual([{ code: 'RATIONALE_REQUIRED', path: 'rationale' }]);
    expect(await issues({ license: null })).toEqual([{ code: 'LICENSE_REQUIRED', path: 'license' }]);
    expect(await issues({ profileType: 'NON_HEALTH_PROFESSIONAL' })).toEqual([{ code: 'LICENSE_NOT_APPLICABLE', path: 'license' }]);
    expect(await issues({ scopes: [] })).toEqual([{ code: 'SCOPES_REQUIRED', path: 'scopes' }]);
    expect(await issues({ professionalName: ' ' })).toEqual([{ code: 'DISPLAY_NAME_REQUIRED', path: 'professionalName' }]);
    await incorporar(a.token, cuerpo(correoSintetico('uf04-nadie'))).expect(404);
    expect(await issues({ email: a.correo })).toEqual([{ code: 'ACCOUNT_IS_ADMINISTRATIVE', path: 'email' }]);
    // Fuera de las cuentas sintéticas, en test no se incorpora (como el comando del primer administrador).
    expect(await issues({ email: 'persona.real@ejemplo.com.ar' })).toEqual([{ code: 'SYNTHETIC_ACCOUNT_REQUIRED', path: 'email' }]);
    expect(await loQueDejo(id)).toEqual({ perfiles: 0, verificaciones: 0, habilitaciones: 0, hechos: 0 });
    const rechazos = await prisma.registroDeAuditoria.findMany({ where: { operacion: 'API-ADM-14', actorId: a.id, resultado: 'RECHAZO' } });
    expect(rechazos.length).toBeGreaterThanOrEqual(7);
  });

  it('el profesional entra con su segundo factor, la persona ve su nombre profesional, y el nombre cambia solo con su hecho (API-ADM-15)', async () => {
    const a = await administradorListo(app, prisma, etiqueta('nombre'));
    const correo = correoSintetico('uf04-nombre');
    const id = await registrarOk(app, correo, 'WEB');
    await incorporar(a.token, cuerpo(correo)).expect(201);
    // Entra a /pro: la primera vez configura su segundo factor (UF-11) y después opera como profesional.
    const token = await tokenDe(app, correo, 'WEB');
    expect((await conSesion(app, token).get('/api/v1/me/second-factor').expect(200)).body.data.secondFactor.state).toBe('ENROLLMENT_REQUIRED');
    await verificarSegundoFactor(app, id, token);
    const pro = { correo, id, token };
    const ase = await prepararAsesorado(app, 'uf04-persona', { a3: true });
    const solicitud = await solicitar(app, pro, ase.id, 'NUTRICION').expect(201);
    await aceptar(app, ase, solicitud.body.data.relationshipRequestId).expect(200);
    const nombreQueVe = async () => ((await conSesion(app, ase.token).get('/api/v1/me/relationships').expect(200)).body.data as { professional: { identityId: string; displayName: string } }[]).find((v) => v.professional.identityId === id)?.professional.displayName;
    expect(await nombreQueVe()).toBe('Lic. Incorporada Sintética');

    // API-ADM-15: contra el nombre que se vio; con otro, 409.
    const cambiar = (body: Record<string, unknown>, clave = claveDeIdempotencia()) => adm(app, a.token).post(`/admin/professionals/${id}/name`).set('Idempotency-Key', clave).send(body);
    await cambiar({ professionalName: 'Lic. Nueva', expectedName: 'Otro nombre', rationale: 'Pedido por el canal de ayuda.' }).expect(409);
    expect((await cambiar({ professionalName: 'Lic. Nueva', expectedName: 'Lic. Incorporada Sintética', rationale: ' ' }).expect(422)).body.error.details.issues).toEqual([{ code: 'RATIONALE_REQUIRED', path: 'rationale' }]);
    const cambiado = await cambiar({ professionalName: '  Lic.  Incorporada Sintética Pérez ', expectedName: 'Lic. Incorporada Sintética', rationale: 'Pedido por el canal de ayuda, con su matrícula.' }).expect(200);
    expect(cambiado.body.data.professional.displayName).toBe('Lic. Incorporada Sintética Pérez');
    expect(await nombreQueVe()).toBe('Lic. Incorporada Sintética Pérez');
    const cambios = await prisma.cambioDeNombreProfesional.findMany({ where: { identidadId: id } });
    expect(cambios).toHaveLength(1);
    expect(cambios[0]).toMatchObject({ nombreAnterior: 'Lic. Incorporada Sintética', nombreNuevo: 'Lic. Incorporada Sintética Pérez', administradorId: a.id, fundamento: 'Pedido por el canal de ayuda, con su matrícula.' });
    await adm(app, a.token).post('/admin/professionals/no-es-un-id/name').set('Idempotency-Key', claveDeIdempotencia()).send({ professionalName: 'X', expectedName: 'Y', rationale: 'Z' }).expect(404);
  });

  it('la base no deja cambiar el nombre profesional sin su cambio registrado, ni tocar otra columna, ni borrar el perfil', async () => {
    const a = await administradorListo(app, prisma, etiqueta('base'));
    const correo = correoSintetico('uf04-base');
    const id = await registrarOk(app, correo, 'WEB');
    await incorporar(a.token, cuerpo(correo)).expect(201);
    await expect(prisma.$executeRaw`UPDATE "perfil_profesional" SET "nombre_visible" = 'Lic. Sin Hecho' WHERE "identidad_id" = ${id}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`UPDATE "perfil_profesional" SET "matricula_numero" = 'MN 1' WHERE "identidad_id" = ${id}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`DELETE FROM "perfil_profesional" WHERE "identidad_id" = ${id}::uuid`).rejects.toThrow(/append-only/);
    // Un cambio registrado en otra transacción no habilita el UPDATE de esta.
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$executeRaw`UPDATE "perfil_profesional" SET "nombre_visible" = 'Lic. Otra' WHERE "identidad_id" = ${id}::uuid`;
      }),
    ).rejects.toThrow(/append-only/);
    expect((await prisma.perfilProfesional.findUniqueOrThrow({ where: { identidadId: id } })).nombreVisible).toBe('Lic. Incorporada Sintética');
  });
});
