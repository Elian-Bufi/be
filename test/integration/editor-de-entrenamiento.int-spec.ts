/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, parte A) · la planificación del plan por la API real contra PostgreSQL: TEST-EE-API-01
 * a 04.
 *
 * - **Se guarda con el borrador** (API-TRN-10) y se lee en API-SER-01: el inicio y las semanas del plan, las semanas de
 *   cada fase, el objetivo, las aproximaciones y las anotaciones privadas. Sin el campo, sigue; `null`, se quita. Lo que
 *   nombra fases o ejercicios que ya no están se poda.
 * - **Las anotaciones son del profesional:** no salen en ninguna lectura del titular ni en la exportación de sus datos.
 * - **Otro profesional** recibe el 404 de lo inexistente, también al mandar la planificación.
 * Las fechas de las fases, el almanaque y el redondeo los prueba el dominio (`planificacion-del-plan.test.ts`).
 */
import type { INestApplication } from '@nestjs/common';
import { PlanConObjetivosResponseSchema, type PlanificacionDelPlan } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { appDePrueba, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { prepararProfesional } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `ee-${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const NOTA_PRIVADA = 'Ojo con la rodilla izquierda: no me lo contó a mí';
const NOTA_DE_LA_FASE = 'Si duerme mal, bajar una serie';

/** La estructura de siempre, con la fase identificada (el editor le pone su identificador al crearla). */
function estructuraConFase(): Record<string, unknown> {
  const e = estructuraDeEntrenamiento() as { blocks: Record<string, unknown>[] };
  e.blocks[0]!.blockId = 'fase-base';
  return e;
}

const PLANIFICACION: PlanificacionDelPlan = {
  startDate: '2026-11-30',
  weeks: 8,
  goal: 'Ganar fuerza en los básicos',
  phases: [
    { blockId: 'fase-base', weeks: 4 },
    // Una fase que no está en la estructura: se poda.
    { blockId: 'fase-que-no-esta', weeks: 2 },
  ],
  warmUps: [
    { prescriptionId: 'rx-banca', mode: 'PERCENT', percents: [40, 60, 80], step: 2.5 },
    { prescriptionId: 'rx-que-no-esta', mode: 'MANUAL', percents: [], step: 5 },
  ],
  privateNotes: { plan: NOTA_PRIVADA, phases: [{ blockId: 'fase-base', text: NOTA_DE_LA_FASE }] },
};

const detalle = async (token: string, planId: string) => PlanConObjetivosResponseSchema.parse((await conSesion(app, token).get(`/api/v1/training/plans/${planId}/detail`).expect(200)).body).data;

describe('DL-196 · la planificación se guarda con el borrador', () => {
  it('TEST-EE-API-01 · se guarda, se lee en el detalle del profesional, se poda, se conserva sin el campo y se quita con null', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('guardar'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const pro = conSesion(app, c.pro.token);
    // Un plan de antes no tiene planificación.
    expect((await detalle(c.pro.token, b.planId)).planning).toBeNull();
    const conPlan = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: estructuraConFase(), planning: PLANIFICACION }).expect(200);
    const leida = (await detalle(c.pro.token, b.planId)).planning;
    expect(leida).toEqual({
      ...PLANIFICACION,
      phases: [{ blockId: 'fase-base', weeks: 4 }],
      warmUps: [{ prescriptionId: 'rx-banca', mode: 'PERCENT', percents: [40, 60, 80], step: 2.5 }],
    });
    // Sin el campo, sigue.
    const sinCampo = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: conPlan.body.data.version, changes: estructuraConFase() }).expect(200);
    expect((await detalle(c.pro.token, b.planId)).planning?.goal).toBe('Ganar fuerza en los básicos');
    // Semanas que no son enteras, o un redondeo con decimales raros, no se guardan.
    await pro
      .patch(`/api/v1/training/plans/${b.planId}`)
      .send({ expectedVersion: sinCampo.body.data.version, changes: estructuraConFase(), planning: { ...PLANIFICACION, phases: [{ blockId: 'fase-base', weeks: 2.5 }] } })
      .expect(400);
    await pro
      .patch(`/api/v1/training/plans/${b.planId}`)
      .send({ expectedVersion: sinCampo.body.data.version, changes: estructuraConFase(), planning: { ...PLANIFICACION, warmUps: [{ prescriptionId: 'rx-banca', mode: 'PERCENT', percents: [40], step: 1.25 }] } })
      .expect(400);
    // Con null, se quita.
    await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: sinCampo.body.data.version, changes: estructuraConFase(), planning: null }).expect(200);
    expect((await detalle(c.pro.token, b.planId)).planning).toBeNull();
    const v = await prisma.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: b.planId } });
    expect(Object.hasOwn(v.contenido as Record<string, unknown>, 'planning')).toBe(false);
  });
});

describe('DL-196 · las anotaciones son del profesional', () => {
  it('TEST-EE-API-02 · activada, la persona no ve la planificación en sus lecturas ni las anotaciones en la exportación de sus datos', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('privadas'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const guardado = await conSesion(app, c.pro.token).patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: estructuraConFase(), planning: PLANIFICACION }).expect(200);
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, guardado.body.data.version).expect(200);
    // El profesional la sigue leyendo en la activada (de su instantánea).
    expect((await detalle(c.pro.token, b.planId)).planning?.privateNotes?.plan).toBe(NOTA_PRIVADA);
    // La persona: ni la clave ni el texto, en el plan y en «Hoy».
    const titular = conSesion(app, c.ase.token);
    const plan = await titular.get(`/api/v1/training/plans/${b.planId}`).expect(200);
    expect(Object.hasOwn(plan.body.data, 'planning')).toBe(false);
    expect(plan.text).not.toContain(NOTA_PRIVADA);
    const hoy = await titular.get('/api/v1/me/training/today').expect(200);
    expect(hoy.text).not.toContain(NOTA_PRIVADA);
    expect(hoy.text).not.toContain(NOTA_DE_LA_FASE);
    // La exportación de sus datos: el plan está, las anotaciones no.
    const pedida = await titular.post('/api/v1/me/exports').send({ scope: { domains: ['TRAINING'], period: null } }).expect(201);
    const estado = (await titular.get(`/api/v1/me/exports/${pedida.body.data.exportId as string}`).expect(200)).body.data;
    const descarga = await request(app.getHttpServer()).get(`/api/v1${estado.download.path}`).expect(200);
    const archivo = JSON.parse(descarga.text);
    expect(archivo.entrenamiento.planes.length).toBeGreaterThan(0);
    expect(descarga.text).not.toContain(NOTA_PRIVADA);
    expect(descarga.text).not.toContain(NOTA_DE_LA_FASE);
    expect(descarga.text).toContain('Ganar fuerza en los básicos');
  });
});

describe('DL-196 · otro profesional', () => {
  it('TEST-EE-API-03 · mandar la planificación a un plan ajeno es el 404 de lo inexistente, y no cambia nada', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('ajeno'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const otroPro = await prepararProfesional(app, etiqueta('ajeno-pro'), ['ENTRENAMIENTO']);
    const otro = conSesion(app, otroPro.token);
    const inexistente = (await otro.patch(`/api/v1/training/plans/${randomUUID()}`).send({ expectedVersion: b.version, changes: estructuraConFase(), planning: PLANIFICACION }).expect(404)).body;
    expect((await otro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: estructuraConFase(), planning: PLANIFICACION }).expect(404)).body).toEqual(inexistente);
    expect((await otro.get(`/api/v1/training/plans/${b.planId}/detail`).expect(404)).body).toEqual((await otro.get(`/api/v1/training/plans/${randomUUID()}/detail`).expect(404)).body);
    expect((await detalle(c.pro.token, b.planId)).planning).toBeNull();
  });
});
