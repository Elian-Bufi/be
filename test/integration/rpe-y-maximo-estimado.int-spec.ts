/**
 * DL-192 (WP-RPE-Y-MAXIMO-ESTIMADO) · la notación del esfuerzo por la API real contra PostgreSQL: TEST-RPE-020 a 025.
 *
 * - **Lo viejo sigue igual:** un plan sin notación se guarda sin la clave y se lee RIR; al titular sin la capacidad no le
 *   sale nada nuevo.
 * - **La notación vive en la versión del plan:** se elige al crear o al editar el borrador, se conserva si no se manda, se
 *   congela al activar y la sucesora la hereda. Los valores siguen siendo RIR: «RPE 8» es el criterio RIR con el valor 2.
 * - **El valor inicial es la última que usó el profesional,** con cualquier persona.
 * - **La APK de hoy** (la última congelada, que pregunta el RIR) lee y registra igual con un plan en RPE, y lo que manda
 *   se guarda tal cual; la que declara `training-effort-notation-1` recibe la notación.
 * - **Otro profesional** recibe el 404 de lo inexistente, también al cambiar la notación.
 * Las reglas de la conversión y del máximo estimado las prueba el dominio (`packages/domain/src/notacion-del-esfuerzo.test.ts`).
 */
import type { INestApplication } from '@nestjs/common';
import { CAPACIDAD_NOTACION_DEL_ESFUERZO, CAPACIDAD_OBJETIVOS_POR_SERIE, ListaDePlanesDeEntrenamientoResponseSchema, PlanConObjetivosResponseSchema, PlanDeEntrenamientoResponseSchema, valorDeCapacidades } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, CATALOGO_DE_EJERCICIOS, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, estructuraDeEntrenamiento } from './soporte-entrenamiento';
import { LA_ULTIMA_APK, LaApk } from './soporte-lecturas-de-la-apk';
import { conLaApk } from './soporte-por-serie';
import { prepararProfesional } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `rpe-${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

/** La APK 0.32 (DL-194): la de hoy más la notación del esfuerzo. */
const LA_APK_CON_LA_NOTACION = valorDeCapacidades([CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_NOTACION_DEL_ESFUERZO]);

async function contenidoGuardado(planId: string): Promise<Record<string, unknown>> {
  const v = await prisma.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: planId } });
  return v.contenido as Record<string, unknown>;
}

const detalle = async (token: string, planId: string) => PlanConObjetivosResponseSchema.parse((await conSesion(app, token).get(`/api/v1/training/plans/${planId}/detail`).expect(200)).body).data;

describe('DL-192 · lo viejo sigue igual', () => {
  it('TEST-RPE-020 · un plan sin notación se guarda sin la clave y se lee RIR en todas las lecturas del profesional', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('sin-notacion'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    expect(b.body.effortNotation).toBe('RIR');
    expect(Object.hasOwn(await contenidoGuardado(b.planId), 'effortNotation')).toBe(false);
    expect((await detalle(c.pro.token, b.planId)).effortNotation).toBe('RIR');
    const leida = PlanDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${b.planId}`).expect(200)).body).data;
    expect(leida.effortNotation).toBe('RIR');
    const lista = ListaDePlanesDeEntrenamientoResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/training/plans`).expect(200)).body).data;
    expect(lista.map((v) => v.effortNotation)).toEqual(['RIR']);
  });
});

describe('DL-192 · la notación vive en la versión del plan', () => {
  it('TEST-RPE-021 · se elige en el borrador, se conserva si no se manda, se quita al volver a RIR, y los valores siguen siendo RIR', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('editar'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const pro = conSesion(app, c.pro.token);
    const enRpe = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: estructuraDeEntrenamiento(), effortNotation: 'RPE' }).expect(200);
    expect(enRpe.body.data.effortNotation).toBe('RPE');
    expect((await contenidoGuardado(b.planId)).effortNotation).toBe('RPE');
    const leido = await detalle(c.pro.token, b.planId);
    expect(leido.effortNotation).toBe('RPE');
    // «RPE 8» es el criterio RIR con el valor 2: no hay un tercer criterio (REG-06-128).
    const banca = leido.blocks[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!;
    expect(banca.intensity).toEqual({ criterion: 'RIR', target: { value: 2, reference: null } });
    // Sin el campo, la notación sigue.
    const sinCampo = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: enRpe.body.data.version, changes: estructuraDeEntrenamiento() }).expect(200);
    expect(sinCampo.body.data.effortNotation).toBe('RPE');
    // De vuelta a RIR: la clave se quita (lo que no existe no se guarda).
    const enRir = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: sinCampo.body.data.version, changes: estructuraDeEntrenamiento(), effortNotation: 'RIR' }).expect(200);
    expect(enRir.body.data.effortNotation).toBe('RIR');
    expect(Object.hasOwn(await contenidoGuardado(b.planId), 'effortNotation')).toBe(false);
    // Una notación que no existe, o el RPE como criterio, no se guardan.
    await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: enRir.body.data.version, changes: estructuraDeEntrenamiento(), effortNotation: 'CR10' }).expect(400);
    const conRpeComoCriterio = estructuraDeEntrenamiento() as { blocks: { sessions: { prescriptions: { intensity: unknown }[] }[] }[] };
    conRpeComoCriterio.blocks[0]!.sessions[0]!.prescriptions[0]!.intensity = { criterion: 'RPE', target: { value: 8 } };
    const r = await pro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: enRir.body.data.version, changes: conRpeComoCriterio, effortNotation: 'RPE' }).expect(422);
    expect(r.body.error.code).toBe('INTENSITY_CRITERION_INVALID');
    expect(Object.hasOwn(await contenidoGuardado(b.planId), 'effortNotation')).toBe(false);
  });

  it('TEST-RPE-022 · se congela al activar y la sucesora la hereda; al crear se puede pedir otra', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('activar'));
    const b = await crearBorradorDeEntrenamiento(app, c, { effortNotation: 'RPE' });
    expect(b.body.effortNotation).toBe('RPE');
    const act = await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
    const instantanea = await prisma.instantaneaDePlanDeEntrenamiento.findFirstOrThrow({ where: { versionDePlanId: b.planId } });
    expect((instantanea.contenido as { contenido: { effortNotation?: string } }).contenido.effortNotation).toBe('RPE');
    expect((await detalle(c.pro.token, b.planId)).effortNotation).toBe('RPE');
    // La sucesora parte de la instantánea y trae su notación.
    const sucesora = await conSesion(app, c.pro.token)
      .post(`/api/v1/advisees/${c.ase.id}/training/plans`)
      .send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: act.body.data.planId })
      .expect(201);
    expect(sucesora.body.data.effortNotation).toBe('RPE');
  });

  it('TEST-RPE-023 · el valor inicial es la última que usó el profesional, con cualquier persona; pedir otra la cambia', async () => {
    const primera = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('inicial-1'));
    await crearBorradorDeEntrenamiento(app, primera, { effortNotation: 'RPE' });
    // Otra persona del mismo profesional: el borrador nace en RPE sin pedirlo.
    const segunda = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('inicial-2'), primera.pro);
    const b = await crearBorradorDeEntrenamiento(app, segunda);
    expect(b.body.effortNotation).toBe('RPE');
    expect((await contenidoGuardado(b.planId)).effortNotation).toBe('RPE');
    // Pedir RIR la cambia, y la próxima nace en RIR.
    const tercera = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('inicial-3'), primera.pro);
    expect((await crearBorradorDeEntrenamiento(app, tercera, { effortNotation: 'RIR' })).body.effortNotation).toBe('RIR');
    const cuarta = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('inicial-4'), primera.pro);
    expect((await crearBorradorDeEntrenamiento(app, cuarta)).body.effortNotation).toBe('RIR');
    // Otro profesional no hereda nada: nace en RIR.
    const otro = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('inicial-otro'));
    expect((await crearBorradorDeEntrenamiento(app, otro)).body.effortNotation).toBe('RIR');
  });
});

describe('DL-192 · la APK de hoy y la que viene', () => {
  it('TEST-RPE-024 · con un plan en RPE, la última APK congelada lee y registra en RIR como siempre, y lo que manda se guarda tal cual; la que declara la notación la recibe', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('apk'));
    const b = await crearBorradorDeEntrenamiento(app, c, { effortNotation: 'RPE' });
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);

    const apk = new LaApk(LA_ULTIMA_APK, () => app);
    const hoy = await apk.pide('API-TRN-14', { token: c.ase.token });
    const ocurrencia = (hoy.body.data.occurrences as { occurrenceId: string; plannedSession: { sessionId: string } }[]).find((o) => o.plannedSession.sessionId === 'ses-a')!.occurrenceId;
    const plan = await apk.pide('API-TRN-09', { token: c.ase.token, params: { planId: b.planId } });
    expect(Object.hasOwn(plan.body.data, 'effortNotation')).toBe(false);
    if (apk.lee('API-SER-02')) {
      const sesion = await apk.pide('API-SER-02', { token: c.ase.token, params: { occurrenceId: ocurrencia } });
      expect(Object.hasOwn(sesion.body.data, 'effortNotation')).toBe(false);
    }
    // Registra como siempre: el RIR, sin notación.
    const borrador = await apk.pide('API-TRN-15', { token: c.ase.token, params: { occurrenceId: ocurrencia }, cuerpo: {} });
    const series = [1, 2, 3].map((setIndex) => ({ setIndex, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 1.5, perceivedExertion: null }));
    const guardado = await apk.pide('API-TRN-17', {
      token: c.ase.token,
      params: { draftId: borrador.body.data.draftId },
      cuerpo: {
        expectedVersion: borrador.body.data.version,
        changes: { granularity: 'SET', sessionCondition: 'COMPLETED', exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: series }] },
      },
    });
    const confirmada = await apk.pide('API-TRN-18', { token: c.ase.token, params: { draftId: borrador.body.data.draftId }, cuerpo: { expectedVersion: guardado.body.data.version }, status: 201 });
    expect(apk.rechazos()).toEqual([]);
    const ejecucion = await prisma.ejecucionDeEntrenamiento.findUniqueOrThrow({ where: { id: confirmada.body.data.executionId } });
    const rir = (ejecucion.contenido as { exercises: { sets: { rir: number }[] }[] }).exercises[0]!.sets.map((s) => s.rir);
    expect(rir).toEqual([1.5, 1.5, 1.5]);

    // La APK 0.32 declara la notación: la recibe en la versión y en la sesión para registrar.
    const nueva = conLaApk(app, c.ase.token, LA_APK_CON_LA_NOTACION);
    expect((await nueva.get(`/api/v1/training/plans/${b.planId}`).expect(200)).body.data.effortNotation).toBe('RPE');
    expect((await nueva.get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(200)).body.data.effortNotation).toBe('RPE');
  });
});

describe('DL-192 · otro profesional', () => {
  it('TEST-RPE-025 · leer o cambiar la notación de un plan ajeno es el 404 de lo inexistente, y no cambia nada', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('ajeno'));
    const b = await crearBorradorDeEntrenamiento(app, c);
    const otroPro = await prepararProfesional(app, etiqueta('ajeno-pro'), ['ENTRENAMIENTO']);
    const otro = conSesion(app, otroPro.token);
    const inexistente = (await otro.patch(`/api/v1/training/plans/${randomUUID()}`).send({ expectedVersion: b.version, changes: estructuraDeEntrenamiento(), effortNotation: 'RPE' }).expect(404)).body;
    expect((await otro.patch(`/api/v1/training/plans/${b.planId}`).send({ expectedVersion: b.version, changes: estructuraDeEntrenamiento(), effortNotation: 'RPE' }).expect(404)).body).toEqual(inexistente);
    const leerInexistente = (await otro.get(`/api/v1/training/plans/${randomUUID()}/detail`).expect(404)).body;
    expect((await otro.get(`/api/v1/training/plans/${b.planId}/detail`).expect(404)).body).toEqual(leerInexistente);
    expect((await otro.get(`/api/v1/training/plans/${b.planId}`).expect(404)).body).toEqual((await otro.get(`/api/v1/training/plans/${randomUUID()}`).expect(404)).body);
    expect(Object.hasOwn(await contenidoGuardado(b.planId), 'effortNotation')).toBe(false);
  });
});
