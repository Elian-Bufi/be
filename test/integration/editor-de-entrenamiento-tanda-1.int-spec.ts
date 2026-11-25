/**
 * DL-197 (WP-EDITOR-ENTRENAMIENTO-TANDA-1) por la API real contra PostgreSQL con todas las migraciones aplicadas:
 * - **TEST-ET1-API-01 · la clasificación del catálogo:** el buscador la trae solo si se pide (la APK 0.32 busca con la misma
 *   operación y su esquema estricto no la conoce); con el cursor se lee el catálogo entero, los 186 con su clasificación; un
 *   ejercicio propio la acepta opcional al crearlo.
 * - **TEST-ET1-API-02 · fases de más:** un plan cuyas fases suman más semanas que el plan se guarda, pero no se activa
 *   (Dirección, 2026-11-25: «NO SE PUEDE ACTIVAR»); validar lo dice con `PHASES_EXCEED_PLAN_WEEKS`.
 * - **TEST-ET1-API-03 · la intensidad del plan** se guarda en la planificación y se lee en el detalle.
 */
import type { INestApplication } from '@nestjs/common';
import { BusquedaDeEjerciciosResponseSchema, PlanConObjetivosResponseSchema, type EjercicioEncontrado, type PlanificacionDelPlan } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from './soporte';
import { appDePrueba, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { prepararProfesional } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `et1-${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const BUSCAR = '/api/v1/training/exercises/search';
const SEMBRADOS = new Set((JSON.parse(readFileSync(join(RAIZ, 'prisma', 'datos', 'catalogo-base', 'ejercicios.json'), 'utf8')).ejercicios as { wgerId: number }[]).map((e) => String(e.wgerId)));

describe('DL-197 · la clasificación del catálogo', () => {
  it('TEST-ET1-API-01 · solo si se pide; el catálogo entero por el cursor, con los 186 clasificados; un propio la acepta opcional', async () => {
    const pro = await prepararProfesional(app, etiqueta('trn'), ['ENTRENAMIENTO']);
    const s = conSesion(app, pro.token);
    // Sin pedirla, la forma de siempre: sin la clave (lo que lee la APK 0.32).
    const sin = (await s.post(BUSCAR).send({ q: 'press de banca plano con barra', limit: 5 }).expect(200)).body;
    expect(Object.hasOwn(sin.data[0], 'classification')).toBe(false);
    const con = BusquedaDeEjerciciosResponseSchema.parse((await s.post(BUSCAR).send({ q: 'press de banca plano con barra', limit: 5, withClassification: true }).expect(200)).body).data;
    expect(con[0]).toMatchObject({ name: 'Press de banca plano con barra', classification: { muscleGroup: 'CHEST', movementPattern: 'PUSH', joints: 'MULTI' } });
    expect(con[0]!.classification!.equipment).toEqual(expect.arrayContaining(['BARBELL', 'BENCH']));

    // Un propio, con y sin clasificación.
    await s
      .post('/api/v1/training/exercises')
      .send({ name: 'Remo trilimbo clasificado', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' }, classification: { muscleGroup: 'BACK', equipment: ['CABLE'], movementPattern: 'PULL', joints: 'MULTI' } })
      .expect(201);
    await s.post('/api/v1/training/exercises').send({ name: 'Remo trilimbo sin clasificar', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201);
    // Una clasificación con un valor que no existe no pasa el esquema: un 400, como todo cuerpo mal formado.
    await s
      .post('/api/v1/training/exercises')
      .send({ name: 'Remo inventado', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' }, classification: { muscleGroup: 'NECK', equipment: [], movementPattern: null, joints: null } })
      .expect(400);

    // El catálogo entero, página por página, como lo lee «Agregar ejercicios».
    const todos: EjercicioEncontrado[] = [];
    let cursor: string | null = null;
    for (let vuelta = 0; vuelta < 40; vuelta += 1) {
      const pagina = BusquedaDeEjerciciosResponseSchema.parse((await s.post(BUSCAR).send({ q: '', limit: 50, withClassification: true, ...(cursor ? { cursor } : {}) }).expect(200)).body);
      todos.push(...pagina.data);
      if (!pagina.page.hasMore) break;
      cursor = pagina.page.nextCursor;
    }
    // Los 186 del catálogo base (otras pruebas importan de wger en la misma base: esos no tienen la siembra).
    const delCatalogoBase = todos.filter((e) => e.externalSource?.provider === 'WGER' && SEMBRADOS.has(e.externalSource.externalId));
    expect(delCatalogoBase.length).toBe(186);
    expect(delCatalogoBase.every((e) => e.classification?.muscleGroup && e.classification.movementPattern && e.classification.joints && e.classification.equipment.length > 0)).toBe(true);
    expect(todos.find((e) => e.name === 'Remo trilimbo clasificado')?.classification).toEqual({ muscleGroup: 'BACK', equipment: ['CABLE'], movementPattern: 'PULL', joints: 'MULTI' });
    expect(todos.find((e) => e.name === 'Remo trilimbo sin clasificar')?.classification).toEqual({ muscleGroup: null, equipment: [], movementPattern: null, joints: null });
    // Sin repetidos entre páginas.
    expect(new Set(todos.map((e) => e.exerciseId)).size).toBe(todos.length);
  });
});

/** La estructura de siempre, con la fase identificada. */
function estructuraConFase(): Record<string, unknown> {
  const e = estructuraDeEntrenamiento() as { blocks: Record<string, unknown>[] };
  e.blocks[0]!.blockId = 'fase-base';
  return e;
}
const detalle = async (token: string, planId: string) => PlanConObjetivosResponseSchema.parse((await conSesion(app, token).get(`/api/v1/training/plans/${planId}/detail`).expect(200)).body).data;

describe('DL-197 · fases de más y la intensidad del plan', () => {
  it('TEST-ET1-API-02 · con fases que suman más que el plan, se guarda pero no se activa; ajustado, se activa', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('fases'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const pro = conSesion(app, c.pro.token);
    const deMas: PlanificacionDelPlan = { startDate: '2026-11-30', weeks: 4, goal: null, phases: [{ blockId: 'fase-base', weeks: 6 }] };
    const guardado = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: estructuraConFase(), planning: deMas }).expect(200);
    const rechazo = await activarPlanDeEntrenamiento(app, c.pro, b.planId, guardado.body.data.version).expect(422);
    expect(JSON.stringify(rechazo.body)).toContain('PHASES_EXCEED_PLAN_WEEKS');
    // Llevar el plan a 6 semanas: se activa.
    const ajustado = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: guardado.body.data.version, changes: estructuraConFase(), planning: { ...deMas, weeks: 6 } }).expect(200);
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, ajustado.body.data.version).expect(200);
  });

  it('TEST-ET1-API-03 · la intensidad del plan se guarda con la planificación; RIR, la de siempre, no se escribe', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('intensidad'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const pro = conSesion(app, c.pro.token);
    const r = await pro
      .patch(`/api/v1/training/plans/${b.planId}`)
      .send({ expectedVersion: b.version, changes: estructuraConFase(), planning: { startDate: null, weeks: null, goal: null, phases: [], intensity: 'PERCENT_RM' } })
      .expect(200);
    expect((await detalle(c.pro.token, b.planId)).planning?.intensity).toBe('PERCENT_RM');
    await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: r.body.data.version, changes: estructuraConFase(), planning: { startDate: null, weeks: null, goal: null, phases: [], intensity: 'RIR' } }).expect(200);
    expect((await detalle(c.pro.token, b.planId)).planning).toBeNull();
    await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: r.body.data.version, changes: estructuraConFase(), planning: { startDate: null, weeks: null, goal: null, phases: [], intensity: 'RPE' } }).expect((x) => expect([400, 409]).toContain(x.status));
  });
});
