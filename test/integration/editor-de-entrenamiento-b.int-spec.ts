/**
 * DL-196 (WP-EDITOR-ENTRENAMIENTO, parte B) · por la API real contra PostgreSQL: TEST-EE-API-10 y 11.
 *
 * - **Las progresiones y los gráficos favoritos** viajan en la planificación del borrador (API-TRN-10), se leen en
 *   API-SER-01 y se podan con la estructura: la de una fase que no está se va; la de ejercicios elegidos queda con los que
 *   siguen. Una regla mal formada es un 400 y no cambia nada. La persona no las recibe (como toda la planificación).
 * - **El buscador filtra por zona** (EE-D41): con `zoneId`, solo los ejercicios que trabajan esa zona en su asignación
 *   vigente; una zona que no es de las 17 es un 422 `INVALID_FILTER`.
 * Las cuentas (semanas, descarga, conteo por músculo) las prueba el dominio (`progresiones.test.ts`,
 * `distribucion-por-musculo.test.ts`).
 */
import type { INestApplication } from '@nestjs/common';
import { PlanConObjetivosResponseSchema, type PlanificacionDelPlan, type ProgresionDeLaFase } from '@be/domain';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { prepararProfesional } from './soporte-vinculo';

let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `eeb-${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
});

function estructuraConFase(): Record<string, unknown> {
  const e = estructuraDeEntrenamiento() as { blocks: Record<string, unknown>[] };
  e.blocks[0]!.blockId = 'fase-base';
  return e;
}

const lineal: ProgresionDeLaFase = {
  blockId: 'fase-base',
  model: 'LINEAR',
  loadStep: 2.5,
  repStep: 0,
  repRange: null,
  waves: null,
  deload: { week: 4, mode: 'LOAD', workingLoadShare: 60, setsRemoved: 2 },
  prescriptionIds: ['rx-banca', 'rx-que-no-esta'],
};

const PLANIFICACION: PlanificacionDelPlan = {
  startDate: '2026-11-30',
  weeks: 4,
  goal: null,
  phases: [{ blockId: 'fase-base', weeks: 4 }],
  progressions: [lineal, { ...lineal, blockId: 'fase-que-no-esta', prescriptionIds: null }],
  favoriteCharts: [
    { kind: 'PHASE_PROGRESSION', id: 'fase-base' },
    { kind: 'EXERCISE_LOAD', id: 'rx-banca' },
    { kind: 'PHASE_DISTRIBUTION', id: 'fase-que-no-esta' },
  ],
};

const detalle = async (token: string, planId: string) => PlanConObjetivosResponseSchema.parse((await conSesion(app, token).get(`/api/v1/training/plans/${planId}/detail`).expect(200)).body).data;

describe('DL-196 parte B · las progresiones y los favoritos del plan', () => {
  it('TEST-EE-API-10 · se guardan con el borrador, se podan con la estructura, lo mal formado es un 400 y la persona no las recibe', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('progresion'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const pro = conSesion(app, c.pro.token);
    const guardado = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: estructuraConFase(), planning: PLANIFICACION }).expect(200);
    const leida = (await detalle(c.pro.token, b.planId)).planning;
    expect(leida?.progressions).toEqual([{ ...lineal, prescriptionIds: ['rx-banca'] }]);
    expect(leida?.favoriteCharts).toEqual([
      { kind: 'PHASE_PROGRESSION', id: 'fase-base' },
      { kind: 'EXERCISE_LOAD', id: 'rx-banca' },
    ]);
    // Una descarga al 100 % o un rango al revés no se guardan, y lo guardado sigue igual.
    for (const mala of [{ ...lineal, deload: { week: 4, mode: 'LOAD', workingLoadShare: 100, setsRemoved: 2 } }, { ...lineal, model: 'DOUBLE', repRange: { min: 12, max: 8 } }]) {
      await pro
        .patch(`/api/v1/training/plans/${b.planId}`)
        .send({ expectedVersion: guardado.body.data.version, changes: estructuraConFase(), planning: { ...PLANIFICACION, progressions: [mala] } })
        .expect(400);
    }
    expect((await detalle(c.pro.token, b.planId)).planning?.progressions).toEqual([{ ...lineal, prescriptionIds: ['rx-banca'] }]);
    // Activada, la persona no recibe la planificación: la regla no le llega todavía (EE-D30).
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, guardado.body.data.version).expect(200);
    const plan = await conSesion(app, c.ase.token).get(`/api/v1/training/plans/${b.planId}`).expect(200);
    expect(Object.hasOwn(plan.body.data, 'planning')).toBe(false);
    expect(plan.text).not.toContain('progressions');
  });
});

describe('DL-196 parte B · el buscador filtra por zona', () => {
  it('TEST-EE-API-11 · con zoneId, solo los ejercicios que trabajan esa zona; una zona desconocida es un 422', async () => {
    const pro = await prepararProfesional(app, etiqueta('zona'), ['ENTRENAMIENTO']);
    const trn = conSesion(app, pro.token);
    const sufijo = randomUUID().slice(0, 6);
    await trn
      .post('/api/v1/training/exercises')
      .send({ name: `Elevación de talones zonal ${sufijo}`, muscleZones: [{ zoneId: 'gemelos', role: 'PRIMARY' }], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } })
      .expect(201);
    await trn
      .post('/api/v1/training/exercises')
      .send({ name: `Aperturas zonales ${sufijo}`, muscleZones: [{ zoneId: 'pectoral', role: 'PRIMARY' }, { zoneId: 'deltoides', role: 'SECONDARY' }], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } })
      .expect(201);
    const buscar = async (cuerpo: Record<string, unknown>) => ((await trn.post('/api/v1/training/exercises/search').send({ limit: 50, ...cuerpo }).expect(200)).body.data as { name: string }[]).map((e) => e.name);
    expect(await buscar({ q: `zonal ${sufijo}`, zoneId: 'gemelos' })).toEqual([`Elevación de talones zonal ${sufijo}`]);
    // Como secundaria también entra.
    expect(await buscar({ q: `zonal ${sufijo}`, zoneId: 'deltoides' })).toEqual([`Aperturas zonales ${sufijo}`]);
    expect(await buscar({ q: `zonal ${sufijo}`, zoneId: 'isquios' })).toEqual([]);
    // Sin texto, todos los de esa zona (entre ellos, el propio).
    expect(await buscar({ q: '', zoneId: 'gemelos' })).toContain(`Elevación de talones zonal ${sufijo}`);
    const rechazo = await trn.post('/api/v1/training/exercises/search').send({ q: '', zoneId: 'cuello' }).expect(422);
    expect(JSON.stringify(rechazo.body)).toContain('INVALID_FILTER');
  });
});
