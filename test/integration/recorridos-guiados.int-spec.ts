/**
 * WP-RECORRIDOS-GUIADOS (DEUDA_LEGAJO DL-195) contra PostgreSQL real: API-RGU-01 y 02, los recorridos guiados que vio u
 * omitió cada usuario (TEST-GUI-016 a 019).
 * - Sin sesión, 401. Con sesión, cada usuario lee y marca solo lo suyo: no hay titular en la ruta.
 * - Marcar con el mismo estado no cambia nada ni deja otra auditoría; con el otro, lo reemplaza.
 * - Un recorrido que no existe es 404; un estado que no existe o un campo de más, 400.
 * - La base solo acepta identificadores con la forma de los de @be/domain.
 */
import type { INestApplication } from '@nestjs/common';
import { RecorridosVistosResponseSchema, RecorridoVistoResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { appDePrueba, conSesion, correoSintetico, registrarOk, tokenDe } from './soporte-api';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

async function usuario(etiqueta: string): Promise<{ id: string; token: string }> {
  const correo = correoSintetico(etiqueta);
  const id = await registrarOk(app, correo);
  return { id, token: await tokenDe(app, correo) };
}

const RUTA = '/api/v1/me/guided-tours';

describe('DL-195 · los recorridos guiados de cada usuario', () => {
  it('TEST-GUI-016 · sin sesión, 401 al leer y al marcar', async () => {
    await request(app.getHttpServer()).get(RUTA).expect(401);
    await request(app.getHttpServer()).put(`${RUTA}/training-plan-editor`).send({ state: 'SEEN' }).expect(401);
  });

  it('TEST-GUI-017 · cada usuario ve y marca solo lo suyo', async () => {
    const yo = await usuario('rgu-yo');
    const otro = await usuario('rgu-otro');
    expect(RecorridosVistosResponseSchema.parse((await conSesion(app, yo.token).get(RUTA).expect(200)).body).data).toEqual([]);

    const marcado = RecorridoVistoResponseSchema.parse((await conSesion(app, yo.token).put(`${RUTA}/training-plan-editor`).send({ state: 'SKIPPED' }).expect(200)).body).data;
    expect(marcado).toMatchObject({ tourId: 'training-plan-editor', state: 'SKIPPED' });

    // El otro no lo ve, y lo que marca queda solo para él.
    expect(RecorridosVistosResponseSchema.parse((await conSesion(app, otro.token).get(RUTA).expect(200)).body).data).toEqual([]);
    await conSesion(app, otro.token).put(`${RUTA}/nutrition-plan-editor`).send({ state: 'SEEN' }).expect(200);
    expect(RecorridosVistosResponseSchema.parse((await conSesion(app, yo.token).get(RUTA).expect(200)).body).data.map((x) => x.tourId)).toEqual(['training-plan-editor']);
    expect(await prisma.recorridoGuiadoVisto.count({ where: { identidadId: yo.id } })).toBe(1);
    expect(await prisma.recorridoGuiadoVisto.count({ where: { identidadId: otro.id } })).toBe(1);

    // Una identidad en el cuerpo no cambia de quién es: el cuerpo no la acepta.
    await conSesion(app, yo.token).put(`${RUTA}/nutrition-plan-editor`).send({ state: 'SEEN', identityId: otro.id }).expect(400);
    expect(await prisma.recorridoGuiadoVisto.count({ where: { identidadId: otro.id } })).toBe(1);
  });

  it('TEST-GUI-018 · repetir no cambia nada ni audita otra vez; el otro estado lo reemplaza', async () => {
    const yo = await usuario('rgu-repetir');
    const ruta = `${RUTA}/nutrition-plan-editor`;
    await conSesion(app, yo.token).put(ruta).send({ state: 'SKIPPED' }).expect(200);
    await conSesion(app, yo.token).put(ruta).send({ state: 'SKIPPED' }).expect(200);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-RGU-02', actorId: yo.id } })).toBe(1);
    const visto = RecorridoVistoResponseSchema.parse((await conSesion(app, yo.token).put(ruta).send({ state: 'SEEN' }).expect(200)).body).data;
    expect(visto.state).toBe('SEEN');
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-RGU-02', actorId: yo.id } })).toBe(2);
    expect(await prisma.recorridoGuiadoVisto.count({ where: { identidadId: yo.id } })).toBe(1);
  });

  it('TEST-GUI-019 · lo que no existe: 404 el recorrido, 400 el estado o un parámetro; la base rechaza otra forma', async () => {
    const yo = await usuario('rgu-errores');
    expect((await conSesion(app, yo.token).put(`${RUTA}/otro-recorrido`).send({ state: 'SEEN' }).expect(404)).body.error.code).toBe('RESOURCE_NOT_FOUND');
    await conSesion(app, yo.token).put(`${RUTA}/training-plan-editor`).send({ state: 'DONE' }).expect(400);
    await conSesion(app, yo.token).get(`${RUTA}?tourId=training-plan-editor`).expect(400);
    await expect(prisma.recorridoGuiadoVisto.create({ data: { identidadId: yo.id, recorrido: 'Con Mayúsculas', estado: 'VISTO', procedencia: {} } })).rejects.toThrow();
  });
});
