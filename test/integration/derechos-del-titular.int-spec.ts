/**
 * WP-USO-FINAL · UF-06 (DEUDA_LEGAJO DL-169; 08 §18 y §19; 09 v0.12 §14 y §15): los derechos de la persona. Oráculo
 * TEST-UF-011 (`docs/paquetes/WP-USO-FINAL-ORACULOS.md`).
 * - La exportación propia (API-EXP-01 y 02) se descarga por una ruta firmada que vence a los 15 minutos
 *   (API-EXP-02-DESCARGA), con lo del titular y sin datos de terceros salvo la referencia mínima de sus profesionales.
 * - Los pedidos de acceso, rectificación y supresión (API-RGT-01 a 03) quedan con su plazo, y Administración los resuelve
 *   una sola vez, con la respuesta a la persona y su fundamento interno (API-ADM-16 y 17).
 */
import type { INestApplication } from '@nestjs/common';
import { fechaCivil, plazoDelPedido } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { RutaDeExportacion } from '../../apps/api/src/derechos/ruta-de-exportacion';
import { appDePrueba, claveDeIdempotencia, conSesion, entornoDePrueba, tokenDe, transicionPorServicio } from './soporte-api';
import { adm, administradorListo } from './soporte-administracion';
import { circuitoConPlanActivo, circuitoListoParaPlanificar } from './soporte-nutricion';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const TODOS = { scope: { domains: ['NUTRITION', 'TRAINING', 'ANTHROPOMETRY'], period: null } };
const hoy = () => fechaCivil(new Date().toISOString(), 'America/Argentina/Buenos_Aires');

describe('TEST-UF-011 · la exportación propia, por una ruta firmada y temporal, sin datos de terceros', () => {
  it('la persona descarga lo suyo; lo de otra persona del mismo profesional no está, ni el correo del profesional', async () => {
    const c = await circuitoConPlanActivo(app, 'uf06-exp');
    const otra = await circuitoListoParaPlanificar(app, 'uf06-otra', c.pro);
    const pedida = await conSesion(app, c.ase.token).post('/api/v1/me/exports').send(TODOS).expect(201);
    expect(pedida.body.data).toMatchObject({ state: 'READY', domains: ['NUTRITION', 'TRAINING', 'ANTHROPOMETRY'], download: null });
    const id = pedida.body.data.exportId as string;
    const estado = (await conSesion(app, c.ase.token).get(`/api/v1/me/exports/${id}`).expect(200)).body.data;
    expect(estado.download.path).toMatch(/^\/exports\/content\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const vence = new Date(estado.download.expiresAt).getTime() - Date.now();
    expect(vence).toBeGreaterThan(14 * 60 * 1000);
    expect(vence).toBeLessThanOrEqual(15 * 60 * 1000);
    // La de otra persona: el mismo 404 que lo inexistente.
    await conSesion(app, otra.ase.token).get(`/api/v1/me/exports/${id}`).expect(404);
    await conSesion(app, c.ase.token).get(`/api/v1/me/exports/${randomUUID()}`).expect(404);
    // La descarga, sin sesión: el archivo como adjunto.
    const descarga = await request(app.getHttpServer()).get(`/api/v1${estado.download.path}`).expect(200);
    expect(descarga.headers['content-type']).toMatch(/application\/json/);
    expect(descarga.headers['content-disposition']).toMatch(/^attachment; filename="be-mis-datos-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(descarga.headers['cache-control']).toBe('no-store');
    const texto = descarga.text;
    const archivo = JSON.parse(texto);
    expect(archivo.formato).toBe('be-exportacion-propia/1');
    expect(archivo.titular.id).toBe(c.ase.id);
    expect(archivo.vinculos).toHaveLength(1);
    expect(archivo.vinculos[0].profesional).toEqual({ identidad: c.pro.id, nombreProfesional: expect.any(String) });
    expect(archivo.vinculos[0].consentimientos.length).toBeGreaterThan(0);
    expect(archivo.nutricion.planes.length).toBeGreaterThan(0);
    for (const clave of ['perfil', 'metodosDeAcceso', 'actos', 'formularios', 'habitos']) expect(Array.isArray(archivo[clave])).toBe(true);
    expect(Array.isArray(archivo.nutricion.registros) && Array.isArray(archivo.entrenamiento.registros) && Array.isArray(archivo.antropometria.medidas)).toBe(true);
    // Nada de otra persona ni el correo del profesional; tampoco la procedencia técnica de las filas.
    expect(texto).not.toContain(otra.ase.id);
    expect(texto).not.toContain(otra.ase.correo);
    expect(texto).not.toContain(c.pro.correo);
    expect(texto).not.toContain('"procedencia"');
    // La entrega queda auditada, sin el contenido.
    const entregas = await prisma.registroDeAuditoria.findMany({ where: { operacion: 'API-EXP-02-DESCARGA', resultado: 'EXITO', sujetoId: c.ase.id } });
    expect(entregas).toHaveLength(1);
    expect(JSON.stringify(entregas)).not.toContain('be-exportacion-propia');
    // El archivo no se guarda: la exportación es una fila con sus dominios y su vencimiento.
    expect(Object.keys(await prisma.exportacionPropia.findUniqueOrThrow({ where: { id } })).sort()).toEqual(['dominios', 'id', 'momentoDeRegistro', 'procedencia', 'titularId', 'venceEn']);
  });

  it('cada registro va con su estado vigente: una comida anulada sale anulada, y las notas sobre la persona y sus fotos están', async () => {
    // Revisión adversarial de la etapa 2: el archivo leía las filas originales, sin correcciones ni anulaciones (Ley
    // 25.326, art. 4: la calidad del dato).
    const c = await circuitoConPlanActivo(app, 'uf06-estado');
    const registrada = await conSesion(app, c.ase.token)
      .post('/api/v1/me/nutrition/meal-records')
      .send({ kind: 'DIFFERENT', activePlanId: c.planId, dayTypeId: null, mealId: null, occurredAt: new Date().toISOString(), description: 'Un sándwich sintético', approximateQuantity: null, mediaIds: [] })
      .expect(201);
    const { recordId, version } = registrada.body.data as { recordId: string; version: string };
    await conSesion(app, c.ase.token).post(`/api/v1/nutrition/meal-records/${recordId}/annulment`).send({ reason: 'Me equivoqué (sintético)', expectedVersion: version }).expect(201);
    const id = (await conSesion(app, c.ase.token).post('/api/v1/me/exports').send(TODOS).expect(201)).body.data.exportId as string;
    const ruta = (await conSesion(app, c.ase.token).get(`/api/v1/me/exports/${id}`).expect(200)).body.data.download.path as string;
    const archivo = JSON.parse((await request(app.getHttpServer()).get(`/api/v1${ruta}`).expect(200)).text);
    const registros = archivo.nutricion.registros as { registro: { id: string }; anulado: boolean; anulacion: unknown; correcciones: unknown[]; rectificacionesDeCantidades: unknown[] }[];
    expect(registros).toHaveLength(1);
    expect(registros[0]).toMatchObject({ anulado: true, correcciones: [], rectificacionesDeCantidades: [] });
    expect(registros[0]!.anulacion).not.toBeNull();
    expect(JSON.stringify(registros[0])).toContain(recordId);
    // Las medidas, con su estado; los formularios, con sus rectificaciones; las notas y los medios, aunque estén vacíos.
    expect(Array.isArray(archivo.notasDeCoordinacion) && Array.isArray(archivo.medios)).toBe(true);
    expect(Array.isArray(archivo.nutricion.revisiones) && Array.isArray(archivo.entrenamiento.revisiones)).toBe(true);
    for (const toma of archivo.antropometria.medidas as { mediciones: { medicion: unknown; anulada: boolean; correcciones: unknown[] }[] }[]) {
      for (const m of toma.mediciones) expect(Object.keys(m).sort()).toEqual(['anulacion', 'anulada', 'correcciones', 'medicion']);
    }
    for (const f of archivo.formularios as Record<string, unknown>[]) expect(Object.keys(f).sort()).toEqual(['rectificaciones', 'respuesta']);
  });

  it('una ruta emitida no sobrevive a una revocación de las sesiones ni a una cuenta suspendida: el mismo 404', async () => {
    // Revisión adversarial de la etapa 2: con una sesión robada se pedía una ruta, y la persona recuperaba el acceso (o
    // cerraba todas sus sesiones): durante 15 minutos más, la ruta seguía entregando el archivo.
    const c = await circuitoConPlanActivo(app, 'uf06-revocada');
    const id = (await conSesion(app, c.ase.token).post('/api/v1/me/exports').send(TODOS).expect(201)).body.data.exportId as string;
    const ruta = (await conSesion(app, c.ase.token).get(`/api/v1/me/exports/${id}`).expect(200)).body.data.download.path as string;
    await request(app.getHttpServer()).get(`/api/v1${ruta}`).expect(200);
    await request(app.getHttpServer()).delete('/api/v1/auth/sessions').set('Authorization', `Bearer ${c.ase.token}`).expect(204);
    await request(app.getHttpServer()).get(`/api/v1${ruta}`).expect(404);
    const rechazo = await prisma.registroDeAuditoria.findFirstOrThrow({ where: { operacion: 'API-EXP-02-DESCARGA', resultado: 'RECHAZO', motivo: 'SESIONES_REVOCADAS' }, orderBy: { momentoDeRegistro: 'desc' } });
    expect(rechazo.sujetoId).toBeNull();
    // Con una sesión nueva, una ruta nueva vale; con la cuenta suspendida, tampoco.
    const nueva = await tokenDe(app, c.ase.correo, 'WEB');
    const otra = (await conSesion(app, nueva).get(`/api/v1/me/exports/${id}`).expect(200)).body.data.download.path as string;
    await request(app.getHttpServer()).get(`/api/v1${otra}`).expect(200);
    await transicionPorServicio(app, c.ase.id, 'SuspenderCuenta');
    await request(app.getHttpServer()).get(`/api/v1${otra}`).expect(404);
  });

  it('pedir derechos y crear exportaciones tiene cupo por persona: el 429 queda auditado', async () => {
    const limites = { ...entornoDePrueba().limites, derechos: { maximo: 2, ventanaMs: 60 * 60 * 1000 } };
    const conCupo = await appDePrueba({ limites });
    try {
      const c = await circuitoConPlanActivo(conCupo, 'uf06-cupo');
      for (let i = 0; i < 2; i++) await conSesion(conCupo, c.ase.token).post('/api/v1/me/data-rights-requests').send({ type: 'ACCESS', scope: {} }).expect(201);
      expect((await conSesion(conCupo, c.ase.token).post('/api/v1/me/data-rights-requests').send({ type: 'ACCESS', scope: {} }).expect(429)).body.error.code).toBe('RATE_LIMITED');
      for (let i = 0; i < 2; i++) await conSesion(conCupo, c.ase.token).post('/api/v1/me/exports').send(TODOS).expect(201);
      await conSesion(conCupo, c.ase.token).post('/api/v1/me/exports').send(TODOS).expect(429);
      expect(await prisma.registroDeAuditoria.count({ where: { sujetoId: c.ase.id, resultado: 'RECHAZO', motivo: 'CUPO_AGOTADO', operacion: { in: ['API-RGT-01', 'API-EXP-01'] } } })).toBe(2);
    } finally {
      await conCupo.close();
    }
  });

  it('una ruta alterada o vencida es el mismo 404, y una exportación sin dominios no se pide', async () => {
    const c = await circuitoConPlanActivo(app, 'uf06-ruta');
    const id = (await conSesion(app, c.ase.token).post('/api/v1/me/exports').send({ scope: { domains: ['NUTRITION'], period: null } }).expect(201)).body.data.exportId as string;
    const ruta = (await conSesion(app, c.ase.token).get(`/api/v1/me/exports/${id}`).expect(200)).body.data.download.path as string;
    const alterada = ruta.slice(0, -2) + (ruta.endsWith('AA') ? 'BB' : 'AA');
    await request(app.getHttpServer()).get(`/api/v1${alterada}`).expect(404);
    const firmas = app.get(RutaDeExportacion);
    const reloj = firmas.ahora;
    try {
      firmas.ahora = () => Date.now() + 16 * 60 * 1000;
      await request(app.getHttpServer()).get(`/api/v1${ruta}`).expect(404);
    } finally {
      firmas.ahora = reloj;
    }
    await request(app.getHttpServer()).get(`/api/v1${ruta}`).expect(200);
    const sinDominios = await conSesion(app, c.ase.token).post('/api/v1/me/exports').send({ scope: { domains: [], period: null } }).expect(422);
    expect(sinDominios.body.error.details.issues).toEqual([{ code: 'DOMAINS_REQUIRED', path: 'scope.domains' }]);
  });
});

describe('TEST-UF-011 · los pedidos de derechos, con su plazo, y su resolución por Administración', () => {
  it('la persona pide y ve lo suyo; Administración lo resuelve una sola vez y la persona ve la respuesta, no el fundamento', async () => {
    const c = await circuitoConPlanActivo(app, 'uf06-rgt');
    const otra = await circuitoListoParaPlanificar(app, 'uf06-rgt-otra', c.pro);
    const acceso = await conSesion(app, c.ase.token).post('/api/v1/me/data-rights-requests').send({ type: 'ACCESS', scope: { note: '  Quiero saber qué datos tienen de mí.  ' } }).expect(201);
    expect(acceso.body.data).toMatchObject({ type: 'ACCESS', state: 'RECEIVED', note: 'Quiero saber qué datos tienen de mí.', deadline: plazoDelPedido('ACCESS', hoy()), response: null, resolvedAt: null });
    const supresion = await conSesion(app, c.ase.token).post('/api/v1/me/data-rights-requests').send({ type: 'SUPPRESSION', scope: {} }).expect(201);
    expect(supresion.body.data.deadline).toBe(plazoDelPedido('SUPPRESSION', hoy()));
    await conSesion(app, otra.ase.token).post('/api/v1/me/data-rights-requests').send({ type: 'RECTIFICATION', scope: {} }).expect(201);
    const id = acceso.body.data.requestId as string;
    await conSesion(app, c.ase.token).get(`/api/v1/me/data-rights-requests/${id}`).expect(200);
    await conSesion(app, otra.ase.token).get(`/api/v1/me/data-rights-requests/${id}`).expect(404);
    const propios = (await conSesion(app, c.ase.token).get('/api/v1/me/data-rights-requests').expect(200)).body.data as { requestId: string }[];
    expect(propios.map((p) => p.requestId).sort()).toEqual([id, supresion.body.data.requestId].sort());

    const a = await administradorListo(app, prisma, `uf06-${randomUUID().slice(0, 6)}`);
    const pendientes = (await adm(app, a.token).post('/admin/data-rights-requests/query').send({ state: 'RECEIVED', limit: 50 }).expect(200)).body.data as { requestId: string; subject: { identityId: string; email: string } }[];
    expect(pendientes.find((p) => p.requestId === id)?.subject).toEqual({ identityId: c.ase.id, email: c.ase.correo });
    const resolver = (cuerpo: Record<string, unknown>) => adm(app, a.token).post(`/admin/data-rights-requests/${id}/resolution`).set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo);
    expect((await resolver({ outcome: 'RESOLVED', response: 'Te enviamos el archivo.', rationale: ' ' }).expect(422)).body.error.details.issues).toEqual([{ code: 'RATIONALE_REQUIRED', path: 'rationale' }]);
    const resuelto = await resolver({ outcome: 'RESOLVED', response: 'Te enviamos el archivo con tus datos.', rationale: 'Identidad confirmada por el canal de ayuda.' }).expect(200);
    expect(resuelto.body.data).toMatchObject({ state: 'RESOLVED', rationale: 'Identidad confirmada por el canal de ayuda.' });
    expect((await resolver({ outcome: 'REJECTED', response: 'Otra vez.', rationale: 'Otra vez.' }).expect(422)).body.error.code).toBe('INVALID_STATE_TRANSITION');
    const visto = (await conSesion(app, c.ase.token).get(`/api/v1/me/data-rights-requests/${id}`).expect(200)).body.data;
    expect(visto).toMatchObject({ state: 'RESOLVED', response: 'Te enviamos el archivo con tus datos.' });
    expect(JSON.stringify(visto)).not.toContain('Identidad confirmada');
    // La base: un pedido no se borra, y no se resuelve sin un administrador con su rol.
    await expect(prisma.$executeRaw`DELETE FROM "pedido_de_derecho" WHERE "id" = ${id}::uuid`).rejects.toThrow(/append-only/);
    await expect(
      prisma.$executeRaw`UPDATE "pedido_de_derecho" SET "estado" = 'RESUELTO', "respuesta" = 'x', "fundamento" = 'x', "administrador_id" = ${c.pro.id}::uuid, "momento_de_resolucion" = now() WHERE "id" = ${supresion.body.data.requestId}::uuid`,
    ).rejects.toThrow(/administrador/);
  });
});
