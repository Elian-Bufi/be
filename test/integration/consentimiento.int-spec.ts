/**
 * WP-03 · Consentimientos B2 (06 §7.7) y A3 (08 §12.4) contra PostgreSQL real.
 * TEST-RF-020 · TEST-RF-022 · TEST-UC-P07 · TEST-UC-P08 · asimetría 7.5-05 · TEST-CT-CON-06…08 · E2E-01 (tramo A3).
 * La versión sucesora de B2 (C2 de DV-05) se publica en un schema aislado: no altera el catálogo compartido.
 */
import type { INestApplication } from '@nestjs/common';
import { VERSION_VIGENTE } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { migrarDeploy, RAIZ, urlConSchema } from './soporte';
import {
  a3Vigente,
  dashboard,
  finalizar,
  pausar,
  prepararAsesorado,
  prepararProfesional,
  revocarB2,
  versionDeVinculo,
  vinculoCompleto,
} from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('TEST-RF-020 / UC-P07 — B2 específico, versionado y con evidencia', () => {
  it('TEST-RF-020: otorgar deja una versión con texto, hash, alcance, finalidad, superficie y actor; el texto depende del perfil (08 §12.3)', async () => {
    const pn = await prepararProfesional(app, 'rf020n', ['NUTRICION']);
    const pt = await prepararProfesional(app, 'rf020t', ['ENTRENAMIENTO']);
    const a01 = await prepararAsesorado(app, 'rf020', { a3: true });
    const n1 = await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    const t1 = await vinculoCompleto(app, pt, a01, 'ENTRENAMIENTO', { b2: false });

    const requisitosN = await conSesion(app, a01.token).get(`/api/v1/relationships/${n1.vinculoId}/consent-requirements`).expect(200);
    expect(requisitosN.body.data).toMatchObject({
      scope: { code: 'NUTRICION' },
      purpose: 'ACOMPANAMIENTO_NUTRICIONAL',
      pertinentCategories: [],
      professionalProfileDisclosure: { profileType: 'HEALTH_PROFESSIONAL' },
      consentVersion: { id: 'acceso-profesional-sanitario-2026-09-demo' },
    });
    const requisitosT = await conSesion(app, a01.token).get(`/api/v1/relationships/${t1.vinculoId}/consent-requirements`).expect(200);
    expect(requisitosT.body.data.professionalProfileDisclosure.profileType).toBe('NON_HEALTH_PROFESSIONAL');
    expect(requisitosT.body.data.consentVersion.id).toBe('acceso-profesional-no-sanitario-2026-09-demo');
    expect(createHash('sha256').update(requisitosT.body.data.consentVersion.text, 'utf8').digest('hex')).toBe(requisitosT.body.data.consentVersion.textHash);

    const otorgado = await conSesion(app, a01.token)
      .post(`/api/v1/relationships/${n1.vinculoId}/consents`)
      .set('X-BE-Surface', 'APK')
      .send({ consentVersionId: 'acceso-profesional-sanitario-2026-09-demo' })
      .expect(201);
    expect(otorgado.body.data).toMatchObject({ state: 'ACTIVE', consentVersionId: 'acceso-profesional-sanitario-2026-09-demo', relationshipId: n1.vinculoId });
    const [version] = await prisma.versionDeConsentimiento.findMany({ where: { consentimientoId: otorgado.body.data.consentId } });
    expect(version).toMatchObject({
      decision: 'OTORGAMIENTO',
      situacionResultante: 'VIGENTE',
      versionDeTextoId: 'acceso-profesional-sanitario-2026-09-demo',
      hashDelTexto: requisitosN.body.data.consentVersion.textHash,
      alcance: 'NUTRICION',
      finalidad: 'ACOMPANAMIENTO_NUTRICIONAL',
      superficie: 'APK',
      actorId: a01.id,
      autoriaId: a01.id,
      predecesoraId: null,
      versionDeMatriz: null,
    });
    expect(version.categorias).toEqual([]);
    // El alcance no se amplía: el B2 de Nutrición no abre Entrenamiento.
    const r = await dashboard(app, pn, a01.id).expect(200);
    expect(r.body.data.domains.training).toEqual({ available: false, reason: 'NOT_AVAILABLE_TO_VIEW' });
  });

  it('INV-06-62: el profesional no otorga por el asesorado (404) y la versión presentada debe ser la aplicable (409)', async () => {
    const pn = await prepararProfesional(app, 'inv062', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'inv062', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    await conSesion(app, pn.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: 'acceso-profesional-sanitario-2026-09-demo' }).expect(404);
    const vieja = await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: 'acceso-profesional-no-sanitario-2026-09-demo' }).expect(409);
    expect(vieja.body.error.code).toBe('CONSENT_VERSION_STALE');
  });
});

describe('TEST-RF-022 / UC-P08 — revocar corta el acceso futuro, sin cascada y sin borrar historia', () => {
  it('TEST-RF-022: revocar B2-T1 no toca B2-N1; PT pierde acceso, PN lo conserva; la revocación queda como versión y como hecho', async () => {
    const pn = await prepararProfesional(app, 'rf022n', ['NUTRICION']);
    const pt = await prepararProfesional(app, 'rf022t', ['ENTRENAMIENTO']);
    const a01 = await prepararAsesorado(app, 'rf022', { a3: true });
    const n1 = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const t1 = await vinculoCompleto(app, pt, a01, 'ENTRENAMIENTO');
    await dashboard(app, pt, a01.id).expect(200);

    const revocado = await revocarB2(app, a01, t1.consentId as string).expect(200);
    expect(revocado.body.data).toMatchObject({ consentId: t1.consentId, state: 'REVOKED' });
    await dashboard(app, pt, a01.id).expect(404);
    await dashboard(app, pn, a01.id).expect(200);
    expect((await prisma.consentimiento.findUniqueOrThrow({ where: { id: n1.consentId as string } })).situacion).toBe('VIGENTE');

    const cadena = await prisma.versionDeConsentimiento.findMany({ where: { consentimientoId: t1.consentId as string }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(cadena.map((v) => [v.decision, v.situacionResultante, v.versionDeTextoId])).toEqual([
      ['OTORGAMIENTO', 'VIGENTE', 'acceso-profesional-no-sanitario-2026-09-demo'],
      ['REVOCACION', 'REVOCADO', null],
    ]);
    expect(cadena[1].predecesoraId).toBe(cadena[0].id);
    expect(await prisma.eventoDeVinculo.count({ where: { consentimientoId: t1.consentId as string, tipo: 'ConsentimientoRevocado' } })).toBe(1);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-CON-04', resultado: 'EXITO', recursoId: t1.consentId as string } })).toBe(1);
  });

  it('Revocar dos veces no crea una segunda revocación (09v8:1713-1727): misma fecha, una sola versión REVOCACION', async () => {
    const pn = await prepararProfesional(app, 'replay', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'replay', { a3: true });
    const { consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const primera = await revocarB2(app, a01, consentId as string).expect(200);
    const segunda = await revocarB2(app, a01, consentId as string).expect(200);
    expect(segunda.body).toEqual(primera.body);
    expect(await prisma.versionDeConsentimiento.count({ where: { consentimientoId: consentId as string, decision: 'REVOCACION' } })).toBe(1);
  });
});

describe('Asimetría 7.5-05 — revocar no finaliza; finalizar no revoca ni borra', () => {
  it('REG-06-51 / INV-06-63: revocar B2 deja el vínculo ACEPTADO; REG-06-52 / INV-06-64: finalizar deja el B2 y su cadena intactos', async () => {
    const pn = await prepararProfesional(app, 'asimetria', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'asimetria', { a3: true });
    const uno = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await revocarB2(app, a01, uno.consentId as string).expect(200);
    expect((await prisma.alcanceDeVinculo.findUniqueOrThrow({ where: { id: uno.vinculoId } })).estado).toBe('ACEPTADO');

    await finalizar(app, a01.token, uno.vinculoId, await versionDeVinculo(app, a01.token, uno.vinculoId)).expect(200);
    const dos = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await finalizar(app, a01.token, dos.vinculoId, await versionDeVinculo(app, a01.token, dos.vinculoId)).expect(200);
    const consentimiento = await prisma.consentimiento.findUniqueOrThrow({ where: { id: dos.consentId as string }, include: { versiones: true } });
    expect(consentimiento.situacion).toBe('VIGENTE');
    expect(consentimiento.versiones.map((v) => v.decision)).toEqual(['OTORGAMIENTO']);
    // Sin acceso igual: lo corta la dimensión VÍNCULO del PDP, no una revocación implícita.
    await dashboard(app, pn, a01.id).expect(404);
  });

  it('OtorgarNuevamente (REVOCADO → VIGENTE): nueva versión encadenada; el acceso vuelve solo con el vínculo ACEPTADO', async () => {
    const pn = await prepararProfesional(app, 'reotorgar', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'reotorgar', { a3: true });
    const { vinculoId, consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await revocarB2(app, a01, consentId as string).expect(200);
    await pausar(app, a01.token, vinculoId, await versionDeVinculo(app, a01.token, vinculoId)).expect(200);
    const noListo = await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: 'acceso-profesional-sanitario-2026-09-demo' }).expect(422);
    expect(noListo.body.error.code).toBe('RELATIONSHIP_NOT_READY_FOR_CONSENT');
    await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/resume`).send({ expectedVersion: await versionDeVinculo(app, a01.token, vinculoId) }).expect(200);
    const re = await conSesion(app, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: 'acceso-profesional-sanitario-2026-09-demo' }).expect(200);
    expect(re.body.data.consentId).toBe(consentId);
    const cadena = await prisma.versionDeConsentimiento.findMany({ where: { consentimientoId: consentId as string }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(cadena.map((v) => v.decision)).toEqual(['OTORGAMIENTO', 'REVOCACION', 'REOTORGAMIENTO']);
    await dashboard(app, pn, a01.id).expect(200);
  });
});

describe('AceptarNuevaVersion — C2 publicada no se acepta sola (DV-05 TEST-RF-020 paso 6; INV-06-61)', () => {
  const SCHEMA = 'wp03_version_b2';
  let aislada: INestApplication;
  let bd: PrismaClient;

  beforeAll(async () => {
    const url = urlConSchema(process.env.DATABASE_URL as string, SCHEMA);
    const previa = process.env.DATABASE_URL;
    bd = new PrismaClient({ datasources: { db: { url } } });
    await bd.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    migrarDeploy(url, join(RAIZ, 'prisma', 'schema.prisma'));
    process.env.DATABASE_URL = url;
    try {
      aislada = await appDePrueba();
    } finally {
      process.env.DATABASE_URL = previa;
    }
  });
  afterAll(async () => {
    await aislada.close();
    await bd.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await bd.$disconnect();
  });

  it('con C2 publicada, el B2 vigente sigue en C1 hasta que el asesorado acepta C2; C1 pasa a ser 409; la cadena queda lineal', async () => {
    const pn = await prepararProfesional(aislada, 'c2', ['NUTRICION']);
    const a01 = await prepararAsesorado(aislada, 'c2', { a3: true });
    const { vinculoId, consentId } = await vinculoCompleto(aislada, pn, a01, 'NUTRICION');
    const c2 = 'Versión sucesora sintética de B2 (C2). Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.';
    await bd.versionDeTexto.create({
      data: {
        id: 'b2-sanitario-c2-prueba',
        tipo: 'CONSENTIMIENTO_PROFESIONAL_SANITARIO',
        titulo: 'Autorizar acceso a un profesional de la salud (C2)',
        finalidad: 'AUTORIZACION_DE_ACCESO_PROFESIONAL',
        texto: c2,
        hash: createHash('sha256').update(c2, 'utf8').digest('hex'),
        vigenteDesde: new Date(),
        reemplazaAId: 'acceso-profesional-sanitario-2026-09-demo',
      },
    });
    // La versión nueva no está aceptada por publicarse: el B2 sigue vigente en C1 y el acceso continúa.
    const detalle = await conSesion(aislada, a01.token).get(`/api/v1/relationships/${vinculoId}`).expect(200);
    expect(detalle.body.data.consent).toMatchObject({ state: 'ACTIVE', consentVersionId: 'acceso-profesional-sanitario-2026-09-demo' });
    await dashboard(aislada, pn, a01.id).expect(200);
    const requisitos = await conSesion(aislada, a01.token).get(`/api/v1/relationships/${vinculoId}/consent-requirements`).expect(200);
    expect(requisitos.body.data.consentVersion.id).toBe('b2-sanitario-c2-prueba');
    await conSesion(aislada, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: 'acceso-profesional-sanitario-2026-09-demo' }).expect(409);
    const aceptada = await conSesion(aislada, a01.token).post(`/api/v1/relationships/${vinculoId}/consents`).send({ consentVersionId: 'b2-sanitario-c2-prueba' }).expect(200);
    expect(aceptada.body.data).toMatchObject({ consentId, consentVersionId: 'b2-sanitario-c2-prueba', state: 'ACTIVE' });
    const cadena = await bd.versionDeConsentimiento.findMany({ where: { consentimientoId: consentId as string }, orderBy: { momentoDeRegistro: 'asc' } });
    expect(cadena.map((v) => [v.decision, v.versionDeTextoId])).toEqual([
      ['OTORGAMIENTO', 'acceso-profesional-sanitario-2026-09-demo'],
      ['NUEVA_VERSION', 'b2-sanitario-c2-prueba'],
    ]);
    // Una segunda sucesora de C1 rompería la cadena lineal: la base la rechaza (REG-06-12).
    await expect(
      bd.versionDeTexto.create({
        data: { id: 'b2-rama', tipo: 'CONSENTIMIENTO_PROFESIONAL_SANITARIO', titulo: 'x', finalidad: 'x', texto: 'x', hash: 'x', vigenteDesde: new Date(), reemplazaAId: 'acceso-profesional-sanitario-2026-09-demo' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});

describe('A3 — otorgar, historial y revocar (API-CON-06, 07, 08)', () => {
  it('E2E-01 (tramo A3): otorgar crea un acto con evidencia; reotorgar tras revocar es un acto nuevo y el revocado queda', async () => {
    const a01 = await prepararAsesorado(app, 'a3-ciclo', { superficie: 'WEB' });
    const vacio = await conSesion(app, a01.token).get('/api/v1/me/health-data-consents').expect(200);
    expect(vacio.body).toEqual({ data: [], page: { limit: 20, nextCursor: null, hasMore: false } });
    const primero = await conSesion(app, a01.token).post('/api/v1/me/health-data-consents', claveDeIdempotencia()).set('X-BE-Surface', 'WEB').send({ consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id }).expect(201);
    expect(primero.body.data).toMatchObject({ type: 'HEALTH_DATA_BE', state: 'ACTIVE', consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id });
    const acto = await prisma.actoRegistrable.findUniqueOrThrow({ where: { id: primero.body.data.consentId } });
    expect(acto).toMatchObject({ tipo: 'DATOS_SALUD_BE', estado: 'VIGENTE', hashDelTexto: VERSION_VIGENTE.DATOS_SALUD_BE.hash, superficie: 'WEB', actorId: a01.id });
    expect(acto.direccionIp).not.toBeNull();

    await conSesion(app, a01.token).post(`/api/v1/me/health-data-consents/${primero.body.data.consentId}/revoke`).send({}).expect(200);
    const segundo = await conSesion(app, a01.token).post('/api/v1/me/health-data-consents', claveDeIdempotencia()).send({ consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id }).expect(201);
    expect(segundo.body.data.consentId).not.toBe(primero.body.data.consentId);
    const historial = await conSesion(app, a01.token).get('/api/v1/me/health-data-consents').expect(200);
    expect(historial.body.data.map((a: { state: string }) => a.state)).toEqual(['ACTIVE', 'REVOKED']);
    expect(JSON.stringify(historial.body)).not.toMatch(/direccion|agente|ip/i);
    expect(await a3Vigente(app, a01.token)).toBe(segundo.body.data.consentId);
    expect(await prisma.eventoDeDominio.count({ where: { identidadId: a01.id, tipo: 'ActoOtorgado' } })).toBe(2);
  });

  it('A3 no crea B2 ni habilita a ningún profesional (09:2503-2508)', async () => {
    const pn = await prepararProfesional(app, 'a3-solo', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'a3-solo', { a3: true });
    await dashboard(app, pn, a01.id).expect(404);
    expect(await prisma.consentimiento.count({ where: { alcanceDeVinculo: { vinculo: { asesoradoId: a01.id } } } })).toBe(0);
  });

  it('Dos otorgamientos A3 simultáneos: uno vigente; el otro 409 CONSENT_ALREADY_ACTIVE (índice parcial en la base)', async () => {
    const a01 = await prepararAsesorado(app, 'a3-carrera');
    const respuestas = await Promise.all(
      Array.from({ length: 5 }, () => conSesion(app, a01.token).post('/api/v1/me/health-data-consents', claveDeIdempotencia()).send({ consentVersionId: VERSION_VIGENTE.DATOS_SALUD_BE.id })),
    );
    expect(respuestas.filter((r) => r.status === 201)).toHaveLength(1);
    expect(respuestas.filter((r) => r.status === 409 && r.body.error.code === 'CONSENT_ALREADY_ACTIVE')).toHaveLength(4);
    expect(await prisma.actoRegistrable.count({ where: { identidadId: a01.id, tipo: 'DATOS_SALUD_BE', estado: 'VIGENTE' } })).toBe(1);
  });
});
