/**
 * DL-151 · la sustitución de un ejercicio desde la sesión enfocada de la APK, por la API real y contra PostgreSQL.
 *
 * La APK 0.13.2 sustituía; las candidatas 0.15 a 0.17 no lo ofrecían, y ahora vuelve
 * (`apps/mobile/src/sustitucion-de-ejercicio.ts`). La regla de la API ya estaba probada en `entrenamiento.int-spec.ts`
 * (REG-06-130): la sustitución en el mismo pedido que las series. Esto fija lo que manda la APK nueva y lo que conserva:
 * - el asesorado busca el sustituto con API-TRN-13-BUSQUEDA, con el texto en el cuerpo (DL-130), también por un nombre
 *   alternativo (DL-141);
 * - antes de la primera serie, el ejercicio se guarda sin series y con el realizado, y la serie que llega después queda
 *   en él;
 * - con series registradas, cambiar el realizado las conserva tal cual (salteadas, sin renumerar), y volver al
 *   planificado también; sin series, volver al planificado saca el ejercicio y el borrador queda como antes;
 * - lo planificado no cambia, ni en el borrador ni en el plan, y los tiempos de la sesión tampoco: el descanso abierto
 *   sigue abierto y se sigue marcando;
 * - un ejercicio sustituido sin series no se confirma (SET_REQUIRED), que la APK dice antes de finalizar; un realizado
 *   fuera del catálogo de ese plan es EXERCISE_REFERENCE_INVALID, que la APK dice en el diálogo;
 * - lo confirmado muestra las dos puntas al titular y al profesional del plan.
 */
import type { INestApplication } from '@nestjs/common';
import {
  BorradorDeEjecucionResponseSchema,
  BusquedaDeEjerciciosResponseSchema,
  ConfirmacionDeEjecucionResponseSchema,
  EjecucionDeEntrenamientoResponseSchema,
  ResultadoDeEventosResponseSchema,
  TiemposDeSesionResponseSchema,
  type BorradorDeEjecucion,
} from '@be/domain';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { CATALOGO_DE_EJERCICIOS } from './soporte-entrenamiento';
import { abrirBorrador, activar, borradorDeLaDemo, conLaApk, corrida, mandarEventos, ocurrenciaDeHoy, prescripcionIdDe, SESION_DEMO, type EjercicioDeLaDemo, type Paso, type PlanDeLaDemo } from './soporte-por-serie';

let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
});

const [EJ_A, EJ_B] = SESION_DEMO.exercises as [EjercicioDeLaDemo, EjercicioDeLaDemo];
const A = prescripcionIdDe(EJ_A);
const B = prescripcionIdDe(EJ_B);
/** El ejercicio sembrado «Press con mancuernas», que también se encuentra como «Dumbbell press» (DL-141). */
const EJERCICIO_PRESS_CON_MANCUERNAS = '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e03';

/** «Piernas A» activada, con el titular usando la APK que muestra los objetivos por serie. */
async function planActivado(nombre: string): Promise<PlanDeLaDemo> {
  const plan = await borradorDeLaDemo(app, `${nombre}-${++contador}-${randomUUID().slice(0, 4)}`);
  await activar(app, plan).expect(200);
  return plan;
}

const planificadoDe = (plan: PlanDeLaDemo, e: EjercicioDeLaDemo): string => plan.ejercicios.get(e.catalogFixtureKey)!.versionId;
/** Una serie registrada: carga y repeticiones escritas por la persona. */
const hecha = (setIndex: number, kg: number, reps: number) => ({ setIndex, load: { value: kg, unit: 'kg' }, completedRepetitions: reps, rir: null, perceivedExertion: null });

/** API-TRN-17 desde la APK, con la versión vista; el borrador que vuelve, validado con el contrato. */
async function guardar(plan: PlanDeLaDemo, draftId: string, expectedVersion: string, changes: Record<string, unknown>): Promise<BorradorDeEjecucion> {
  const r = await conLaApk(app, plan.ase.token).patch(`/api/v1/training/execution-drafts/${draftId}`).send({ expectedVersion, changes }).expect(200);
  return BorradorDeEjecucionResponseSchema.parse(r.body).data;
}

const tiempos = async (plan: PlanDeLaDemo, draftId: string) => TiemposDeSesionResponseSchema.parse((await conSesion(app, plan.ase.token).get(`/api/v1/training/execution-drafts/${draftId}/timing`).expect(200)).body).data;

describe('DL-151 · sustituir un ejercicio desde la sesión enfocada de la APK', () => {
  it('antes de la primera serie: el sustituto se busca como en la APK, se guarda sin series y la serie que llega después queda en él; ni el plan ni los tiempos cambian', async () => {
    const plan = await planActivado('sus-antes');
    const apk = conLaApk(app, plan.ase.token);
    const planAntes = (await conSesion(app, plan.pro.token).get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body;
    const { draftId, version } = await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase));

    // La sesión corre: empezó, A es el ejercicio activo y el descanso de su serie 1 está abierto (API-TIE-01).
    const base = Date.now() - 20 * 60 * 1000;
    const pasos: Paso[] = [
      { s: 0, evento: { type: 'SESSION_STARTED' } },
      { s: 1, evento: { type: 'EXERCISE_ACTIVATED', prescriptionId: A } },
      { s: 60, evento: { type: 'REST_STARTED', restId: 'descanso-a1', prescriptionId: A, setIndex: 1 } },
    ];
    await mandarEventos(app, plan.ase, draftId, corrida(pasos, base, 'corrida-sustitucion')).expect(200);
    const tiemposAntes = await tiempos(plan, draftId);
    expect(tiemposAntes.openMeasurement).toMatchObject({ kind: 'REST', prescriptionId: A, setIndex: 1 });

    // El sustituto, buscado con API-TRN-13-BUSQUEDA como la APK nueva, por su nombre alternativo.
    const encontrados = BusquedaDeEjerciciosResponseSchema.parse((await apk.post('/api/v1/training/exercises/search').send({ q: 'dumbbell press', limit: 20 }).expect(200)).body).data;
    const sustituto = encontrados.find((e) => e.exerciseId === EJERCICIO_PRESS_CON_MANCUERNAS);
    expect(sustituto).toMatchObject({ name: 'Press con mancuernas', matchedAlternativeName: 'Dumbbell press' });

    // Lo que manda la APK antes de la primera serie (`cambiosParaSustituir`): el ejercicio, sin series, con el realizado.
    const v2 = await guardar(plan, draftId, version, { granularity: 'SET', exercises: [{ prescriptionId: A, performedExerciseVersionId: sustituto!.versionId, sets: [] }] });
    expect(v2.exercises).toEqual([
      {
        prescriptionId: A,
        prescribedExerciseVersionId: planificadoDe(plan, EJ_A),
        prescribedExerciseName: expect.any(String),
        performedExerciseVersionId: sustituto!.versionId,
        performedExerciseName: 'Press con mancuernas',
        substituted: true,
        sets: [],
        executionSummary: null,
      },
    ]);
    expect(v2.exercises[0]!.prescribedExerciseName).not.toBe('Press con mancuernas');

    // La primera serie, como la manda el envío de siempre: lo del servidor más la serie del teléfono, en su ejercicio.
    const v3 = await guardar(plan, draftId, v2.version, { exercises: [{ prescriptionId: A, performedExerciseVersionId: sustituto!.versionId, sets: [hecha(1, 22, 10)] }] });
    expect(v3.exercises[0]).toMatchObject({ prescribedExerciseVersionId: planificadoDe(plan, EJ_A), performedExerciseVersionId: sustituto!.versionId, substituted: true, sets: [hecha(1, 22, 10)] });

    // Los tiempos no cambiaron: los mismos eventos y el descanso abierto. Y se siguen marcando.
    expect(await tiempos(plan, draftId)).toEqual(tiemposAntes);
    const fin = ResultadoDeEventosResponseSchema.parse(
      (await mandarEventos(app, plan.ase, draftId, corrida([{ s: 150, evento: { type: 'REST_FINISHED', restId: 'descanso-a1' } }], base, 'corrida-sustitucion', 4)).expect(200)).body,
    ).data;
    expect(fin.results.map((r) => r.status)).toEqual(['RECORDED']);
    expect(fin.timing.rests.map((d) => [d.prescriptionId, d.setIndex, d.duration])).toEqual([[A, 1, { ms: 90_000, quality: 'MEASURED' }]]);

    // El plan no cambió (S10-TRN-04).
    expect((await conSesion(app, plan.pro.token).get(`/api/v1/training/plans/${plan.planId}`).expect(200)).body).toEqual(planAntes);
  });

  it('con series registradas, cambiar el realizado las conserva tal cual, y volver al planificado también; sin series, volver lo saca y el borrador queda como antes', async () => {
    const plan = await planActivado('sus-con-series');
    const { draftId, version } = await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase));
    // La 1 y la 3, salteadas: no se renumeran.
    const series = [hecha(1, 16, 14), hecha(3, 20, 9)];
    const v2 = await guardar(plan, draftId, version, { granularity: 'SET', exercises: [{ prescriptionId: A, performedExerciseVersionId: planificadoDe(plan, EJ_A), sets: series }] });
    expect(v2.exercises[0]).toMatchObject({ substituted: false, sets: series });

    // Sustituir: cambia solo el realizado.
    const v3 = await guardar(plan, draftId, v2.version, { exercises: [{ prescriptionId: A, performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: series }] });
    expect(v3.exercises[0]).toEqual({ ...v2.exercises[0], performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, performedExerciseName: 'Sentadilla', substituted: true });

    // Volver al planificado con series: las mismas series, otra vez del planificado.
    const v4 = await guardar(plan, draftId, v3.version, { exercises: [{ prescriptionId: A, performedExerciseVersionId: planificadoDe(plan, EJ_A), sets: series }] });
    expect(v4.exercises).toEqual(v2.exercises);

    // B, sustituido antes de su primera serie y vuelto al planificado: sale del borrador, que queda como antes.
    const conB = await guardar(plan, draftId, v4.version, {
      exercises: [
        { prescriptionId: A, performedExerciseVersionId: planificadoDe(plan, EJ_A), sets: series },
        { prescriptionId: B, performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [] },
      ],
    });
    expect(conB.exercises[1]).toMatchObject({ prescriptionId: B, prescribedExerciseVersionId: planificadoDe(plan, EJ_B), substituted: true, sets: [] });
    const sinB = await guardar(plan, draftId, conB.version, { exercises: [{ prescriptionId: A, performedExerciseVersionId: planificadoDe(plan, EJ_A), sets: series }] });
    expect(sinB.exercises).toEqual(v2.exercises);

    // Un realizado que no es del catálogo de este plan: EXERCISE_REFERENCE_INVALID, y nada cambia.
    const ajeno = await conLaApk(app, plan.ase.token)
      .patch(`/api/v1/training/execution-drafts/${draftId}`)
      .send({ expectedVersion: sinB.version, changes: { exercises: [{ prescriptionId: A, performedExerciseVersionId: randomUUID(), sets: series }] } })
      .expect(422);
    expect(ajeno.body.error).toMatchObject({ code: 'EXERCISE_REFERENCE_INVALID', details: { issues: [{ code: 'PERFORMED_EXERCISE_INVALID', path: 'changes.exercises[0].performedExerciseVersionId' }] } });
    const vigente = BorradorDeEjecucionResponseSchema.parse((await conLaApk(app, plan.ase.token).get(`/api/v1/training/execution-drafts/${draftId}`).expect(200)).body).data;
    expect([vigente.version, vigente.exercises]).toEqual([sinB.version, v2.exercises]);
  });

  it('un ejercicio sustituido sin series no se confirma (SET_REQUIRED); con su serie, lo confirmado muestra las dos puntas al titular y al profesional', async () => {
    const plan = await planActivado('sus-confirmar');
    const { draftId, version } = await abrirBorrador(app, plan.ase, await ocurrenciaDeHoy(app, plan.ase));
    const confirmar = (expectedVersion: string) => conLaApk(app, plan.ase.token).post(`/api/v1/training/execution-drafts/${draftId}/confirm`, claveDeIdempotencia()).send({ expectedVersion });

    const sinSeries = await guardar(plan, draftId, version, {
      granularity: 'SET',
      sessionCondition: 'COMPLETED_WITH_DEVIATION',
      exercises: [
        { prescriptionId: A, performedExerciseVersionId: planificadoDe(plan, EJ_A), sets: [hecha(1, 16, 14)] },
        { prescriptionId: B, performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [] },
      ],
    });
    const rechazo = await confirmar(sinSeries.version).expect(422);
    expect(rechazo.body.error).toMatchObject({ code: 'EXECUTION_DRAFT_NOT_READY', details: { issues: [{ code: 'SET_REQUIRED', path: 'exercises[1].sets' }] } });

    // Con su serie, como la manda el envío de siempre: lo del servidor tal cual, más la serie del teléfono en B.
    const conSerie = await guardar(plan, draftId, sinSeries.version, {
      exercises: [
        { prescriptionId: A, performedExerciseVersionId: planificadoDe(plan, EJ_A), sets: [hecha(1, 16, 14)] },
        { prescriptionId: B, performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [hecha(1, 30, 8)] },
      ],
    });
    const { executionId } = ConfirmacionDeEjecucionResponseSchema.parse((await confirmar(conSerie.version).expect(201)).body).data;
    for (const token of [plan.ase.token, plan.pro.token]) {
      const x = EjecucionDeEntrenamientoResponseSchema.parse((await conSesion(app, token).get(`/api/v1/training/executions/${executionId}`).expect(200)).body).data;
      expect(x.original.exercises.map((e) => [e.prescriptionId, e.prescribedExerciseVersionId, e.performedExerciseName, e.substituted, e.sets])).toEqual([
        [A, planificadoDe(plan, EJ_A), sinSeries.exercises[0]!.prescribedExerciseName, false, [hecha(1, 16, 14)]],
        [B, planificadoDe(plan, EJ_B), 'Sentadilla', true, [hecha(1, 30, 8)]],
      ]);
    }
  });
});
