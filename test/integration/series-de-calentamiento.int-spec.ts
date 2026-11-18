/**
 * DL-178 (decisión de Dirección del 2026-11-18) · las series de calentamiento, por la API real contra PostgreSQL.
 *
 * - Lo de antes responde igual: un plan sin calentamiento se guarda sin la clave `setKind` y sale, para el cliente que no
 *   declara `training-set-kinds-1`, exactamente como antes. Con la capacidad, cada serie dice su tipo.
 * - El calentamiento va arriba: una serie de calentamiento después de una efectiva es un 422 sin cambios.
 * - Un plan con calentamiento se guarda con `WARM_UP` solo en esas series; no se activa mientras el titular no haya usado
 *   una APK que lo distinga; no se le entrega a una que no; y lo registrado lleva su tipo.
 * El cálculo (que el calentamiento no entra en la comparación, en el 1RM estimado ni en las cuentas) lo prueba el dominio
 * (`packages/domain/src/tipos-de-serie.test.ts`); acá, que la API guarda y devuelve lo que ese cálculo necesita.
 */
import type { INestApplication } from '@nestjs/common';
import {
  CAPACIDAD_OBJETIVOS_POR_SERIE,
  CAPACIDAD_TIPOS_DE_SERIE,
  COPY_CALENTAMIENTO_Y_LA_APP,
  PlanConObjetivosResponseSchema,
  valorDeCapacidades,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, CATALOGO_DE_EJERCICIOS, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { conLaApk } from './soporte-por-serie';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

/** La APK que distingue el calentamiento (y muestra los objetivos por serie). */
const LA_APK_NUEVA = valorDeCapacidades([CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_TIPOS_DE_SERIE]);
/** El website, que se despliega con la API: declara la capacidad. */
const conElWebsite = (token: string) => conLaApk(app, token, valorDeCapacidades([CAPACIDAD_TIPOS_DE_SERIE]));

/** La estructura de siempre, con las series del press de banca reemplazadas. */
function conLasSeriesDeLaBanca(sets: Record<string, unknown>[]): Record<string, unknown> {
  const e = estructuraDeEntrenamiento() as { blocks: { sessions: { prescriptions: { prescriptionId: string; sets: unknown[] }[] }[] }[] };
  e.blocks[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!.sets = sets;
  return e;
}
const CON_CALENTAMIENTO = [{ repetitions: { value: 12 }, setKind: 'WARM_UP' }, { repetitions: { value: 8 } }, { repetitions: { value: 8 } }];

/** Las series del press de banca tal como quedaron guardadas en la versión (el JSONB, sin pasar por la API). */
async function seriesGuardadas(planId: string): Promise<Record<string, unknown>[]> {
  const v = await prisma.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: planId } });
  const contenido = v.contenido as { blocks: { sessions: { prescriptions: { prescriptionId: string; sets: Record<string, unknown>[] }[] }[] }[] };
  return contenido.blocks[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!.sets;
}

type Sets = { sets: { setKind?: string }[] }[];
const tiposDeLaBanca = (body: { data: { blocks: { sessions: { prescriptions: ({ prescriptionId: string } & Sets[number])[] }[] }[] } }) =>
  body.data.blocks[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!.sets.map((s) => s.setKind);

describe('DL-178 · lo de antes responde igual', () => {
  it('un plan sin calentamiento se guarda sin la clave; sin la capacidad sale como antes, y con ella cada serie dice WORKING', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('sin-calentamiento'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    expect(JSON.stringify(await seriesGuardadas(b.planId))).not.toContain('setKind');
    const sinLaCapacidad = (await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${b.planId}`).expect(200)).body;
    expect(JSON.stringify(sinLaCapacidad)).not.toContain('setKind');
    const conLaCapacidad = (await conElWebsite(c.pro.token).get(`/api/v1/training/plans/${b.planId}`).expect(200)).body;
    expect(tiposDeLaBanca(conLaCapacidad)).toEqual(['WORKING', 'WORKING', 'WORKING']);
    // API-SER-01: sin calentamiento no hay nada que esperar de la app de la persona.
    const detalle = PlanConObjetivosResponseSchema.parse((await conElWebsite(c.pro.token).get(`/api/v1/training/plans/${b.planId}/detail`).expect(200)).body);
    expect(detalle.data.setKindsDelivery).toEqual({ required: false, adviseeClientCapable: false });
    // Y se activa como siempre, sin que la persona haya usado la APK nueva.
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
  });
});

describe('DL-178 · el calentamiento va arriba', () => {
  it('una serie de calentamiento después de una efectiva es un 422 TRAINING_PLAN_STRUCTURE_INVALID, y no cambia nada', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('fuera-de-lugar'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const r = await conSesion(app, c.pro.token)
      .patch(`/api/v1/training/plans/${b.planId}`)
      .send({ expectedVersion: b.version, changes: conLasSeriesDeLaBanca([{ repetitions: { value: 8 } }, { repetitions: { value: 12 }, setKind: 'WARM_UP' }]) })
      .expect(422);
    expect(r.body.error.code).toBe('TRAINING_PLAN_STRUCTURE_INVALID');
    expect(JSON.stringify(r.body.error)).toContain('WARM_UP_AFTER_WORKING_SET');
    expect(JSON.stringify(await seriesGuardadas(b.planId))).not.toContain('setKind');
    // Un tipo que no existe no es un 422: el contrato lo rechaza antes.
    await conSesion(app, c.pro.token)
      .patch(`/api/v1/training/plans/${b.planId}`)
      .send({ expectedVersion: b.version, changes: conLasSeriesDeLaBanca([{ repetitions: { value: 8 }, setKind: 'COOL_DOWN' }]) })
      .expect(400);
  });
});

describe('DL-178 · un plan con calentamiento', () => {
  it('se guarda con WARM_UP solo en el calentamiento; se activa cuando la persona usó la APK que lo distingue; no le llega a una que no; y se registra con su tipo', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('con-calentamiento'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const guardado = await conSesion(app, c.pro.token)
      .patch(`/api/v1/training/plans/${b.planId}`)
      .send({ expectedVersion: b.version, changes: conLasSeriesDeLaBanca(CON_CALENTAMIENTO) })
      .expect(200);
    const version = guardado.body.data.version as string;
    expect(await seriesGuardadas(b.planId)).toEqual([
      { repetitions: { value: 12 }, note: null, setKind: 'WARM_UP' },
      { repetitions: { value: 8 }, note: null },
      { repetitions: { value: 8 }, note: null },
    ]);
    expect(tiposDeLaBanca((await conElWebsite(c.pro.token).get(`/api/v1/training/plans/${b.planId}`).expect(200)).body)).toEqual(['WARM_UP', 'WORKING', 'WORKING']);
    const detalle = () => conElWebsite(c.pro.token).get(`/api/v1/training/plans/${b.planId}/detail`).expect(200);
    expect(PlanConObjetivosResponseSchema.parse((await detalle()).body).data.setKindsDelivery).toEqual({ required: true, adviseeClientCapable: false });

    // Sin la APK nueva, no se activa: el mismo 409 de DL-122, con su motivo, y sin ningún cambio.
    const clave = claveDeIdempotencia();
    const rechazo = await activarPlanDeEntrenamiento(app, c.pro, b.planId, version, clave).expect(409);
    expect(rechazo.body.error).toEqual({ code: 'CLIENT_CAPABILITY_REQUIRED', message: COPY_CALENTAMIENTO_Y_LA_APP.activacionBloqueada });
    expect(await prisma.instantaneaDePlanDeEntrenamiento.count({ where: { versionDePlanId: b.planId } })).toBe(0);

    // La persona abre «Hoy» con la APK nueva: queda registrado, y con la misma clave se activa.
    await conLaApk(app, c.ase.token, LA_APK_NUEVA).get('/api/v1/me/training/today').expect(200);
    expect(PlanConObjetivosResponseSchema.parse((await detalle()).body).data.setKindsDelivery).toEqual({ required: true, adviseeClientCapable: true });
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, version, clave).expect(200);

    // A una APK que no distingue el calentamiento no le llega: lo vería todo efectivo.
    const vieja = (await conSesion(app, c.ase.token).get('/api/v1/me/training/today').expect(200)).body;
    expect(vieja.data.planState).toBe('NOT_AVAILABLE');
    await conSesion(app, c.ase.token).get(`/api/v1/training/plans/${b.planId}`).expect(404);

    // La APK nueva lo ve con su tipo y lo registra así.
    const apk = conLaApk(app, c.ase.token, LA_APK_NUEVA);
    const hoy = (await apk.get('/api/v1/me/training/today').expect(200)).body;
    const ocurrencia = (hoy.data.occurrences as { occurrenceId: string; plannedSession: { sessionId: string; prescriptions: ({ prescriptionId: string } & Sets[number])[] } }[]).find(
      (o) => o.plannedSession.sessionId === 'ses-a',
    )!;
    expect(ocurrencia.plannedSession.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!.sets.map((s) => s.setKind)).toEqual(['WARM_UP', 'WORKING', 'WORKING']);
    const sesion = (await apk.get(`/api/v1/training/occurrences/${ocurrencia.occurrenceId}/session`).expect(200)).body;
    expect((sesion.data.session.prescriptions as ({ prescriptionId: string } & Sets[number])[]).find((p) => p.prescriptionId === 'rx-banca')!.sets.map((s) => s.setKind)).toEqual([
      'WARM_UP',
      'WORKING',
      'WORKING',
    ]);
    const abierto = await apk.put(`/api/v1/training/occurrences/${ocurrencia.occurrenceId}/execution-draft`).send({});
    expect([200, 201]).toContain(abierto.status);
    const serie = (setIndex: number, kg: number, reps: number, extra: Record<string, unknown> = {}) => ({ setIndex, load: { value: kg, unit: 'kg' }, completedRepetitions: reps, rir: 2, perceivedExertion: null, ...extra });
    const editado = await apk
      .patch(`/api/v1/training/execution-drafts/${abierto.body.data.draftId}`)
      .send({
        expectedVersion: abierto.body.data.version,
        changes: {
          granularity: 'SET',
          sessionCondition: 'COMPLETED',
          exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 40, 12, { setKind: 'WARM_UP' }), serie(2, 60, 8), serie(3, 60, 8, { setKind: 'WORKING' })] }],
        },
      })
      .expect(200);
    expect((editado.body.data.exercises[0].sets as { setKind?: string }[]).map((s) => s.setKind)).toEqual(['WARM_UP', 'WORKING', 'WORKING']);
    // Se guarda solo el calentamiento: una efectiva queda idéntica a las de antes, aunque viniera con WORKING.
    const borrador = await prisma.borradorDeEjecucionDeEntrenamiento.findUniqueOrThrow({ where: { id: abierto.body.data.draftId } });
    const guardadas = (borrador.contenido as { exercises: { sets: Record<string, unknown>[] }[] }).exercises[0]!.sets;
    expect(guardadas.map((s) => s.setKind)).toEqual(['WARM_UP', undefined, undefined]);

    const confirmado = await apk.post(`/api/v1/training/execution-drafts/${abierto.body.data.draftId}/confirm`, claveDeIdempotencia()).send({ expectedVersion: editado.body.data.version }).expect(201);
    // El profesional lo lee con su tipo; lo registrado no se retiene a nadie (DL-122), pero sin la capacidad sale sin el campo.
    const ejecucion = (await conElWebsite(c.pro.token).get(`/api/v1/training/executions/${confirmado.body.data.executionId}`).expect(200)).body;
    expect((ejecucion.data.original.exercises[0].sets as { setKind?: string }[]).map((s) => s.setKind)).toEqual(['WARM_UP', 'WORKING', 'WORKING']);
    const sinElCampo = (await conSesion(app, c.pro.token).get(`/api/v1/training/executions/${confirmado.body.data.executionId}`).expect(200)).body;
    expect(JSON.stringify(sinElCampo)).not.toContain('setKind');
    expect(await prisma.capacidadDeClienteDeclarada.count({ where: { identidadId: c.ase.id, capacidad: CAPACIDAD_TIPOS_DE_SERIE } })).toBe(1);
  });
});
