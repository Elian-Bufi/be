/**
 * PF-03, incremento 1 (DL-105) · «Lo planificado, visible y comparable», con el contrato actual, por la API real y
 * contra PostgreSQL. La API no cambia: estas pruebas fijan lo que el website y la APK necesitan que se conserve.
 * - Editar (como lo hace el editor web), guardar, validar, activar y consultar conserva las notas por serie, los
 *   parámetros con su unidad y la nota; una pirámide 10/8/6 se presenta serie por serie.
 * - La comparación de una ejecución usa la prescripción de la versión que rigió esa sesión (su instantánea), aunque
 *   después se active otra versión con otras series.
 * - Las respuestas que leen la APK y el website siguen validando contra los esquemas estrictos actuales.
 */
import type { INestApplication } from '@nestjs/common';
import {
  EjecucionDeEntrenamientoResponseSchema,
  HoyDeEntrenamientoResponseSchema,
  lineasDePrescripcion,
  PlanDeEntrenamientoResponseSchema,
  type Prescripcion,
  type VersionDePlanDeEntrenamiento,
} from '@be/domain';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, CATALOGO_DE_EJERCICIOS, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, type CircuitoParaPlanificar } from './soporte-entrenamiento';

let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
});

const plan = (c: CircuitoParaPlanificar, planId: string) => conSesion(app, c.pro.token).get(`/api/v1/training/plans/${planId}`);
const editar = (c: CircuitoParaPlanificar, planId: string, expectedVersion: string, blocks: unknown) =>
  conSesion(app, c.pro.token).patch(`/api/v1/training/plans/${planId}`).send({ expectedVersion, changes: { blocks } });
const hoy = (c: CircuitoParaPlanificar) => conSesion(app, c.ase.token).get('/api/v1/me/training/today');

/**
 * La misma transformación que hace el editor del website al guardar (`aEntrada` en
 * apps/web/src/app/pro/advisees/training/editor.tsx): la respuesta vuelve como entrada, con las notas por serie.
 */
function comoEntrada(v: VersionDePlanDeEntrenamiento) {
  const sesion = (s: VersionDePlanDeEntrenamiento['blocks'][number]['sessions'][number]) => ({
    sessionId: s.sessionId,
    label: s.label,
    instructions: s.instructions,
    prescriptions: s.prescriptions.map((p) => ({
      prescriptionId: p.prescriptionId,
      exerciseVersionId: p.exerciseVersionId,
      sets: p.sets.map((x) => ({ repetitions: x.repetitions, note: x.note })),
      intensity: p.intensity ? { criterion: p.intensity.criterion, target: { value: p.intensity.target.value, reference: p.intensity.target.reference } } : null,
      suggestedLoad: p.suggestedLoad,
      professionalParameters: p.professionalParameters.map((q) => ({ label: q.label, value: q.value, unit: q.unit })),
      note: p.note,
    })),
  });
  return v.blocks.map((b) => ({ blockId: b.blockId, label: b.label, purpose: b.purpose, microcycles: b.microcycles.map((m) => ({ microcycleId: m.microcycleId, label: m.label, purpose: m.purpose, sessions: m.sessions.map(sesion) })), sessions: b.sessions.map(sesion) }));
}

const banca = (v: { blocks: { sessions: { prescriptions: Prescripcion[] }[] }[] }): Prescripcion =>
  v.blocks[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca') as Prescripcion;

/** Como lo carga el profesional en el editor: pirámide con una nota en la serie 2, descanso con el atajo, tempo en texto. */
function conPiramide(bloques: ReturnType<typeof comoEntrada>) {
  const rx = bloques[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!;
  rx.sets = [{ repetitions: { value: 10 }, note: null }, { repetitions: { value: 8 }, note: 'pausa de 2 s abajo' }, { repetitions: { value: 6 }, note: null }];
  rx.professionalParameters = [
    { label: 'Descanso', value: 90, unit: 's' },
    { label: 'Tempo', value: 'bajar en 3 s, subir en 1 s', unit: null },
  ];
  rx.note = 'Espalda neutra en todo el recorrido';
  return bloques;
}

const LINEAS_DE_LA_PIRAMIDE = ['Serie 1: 10', 'Serie 2: 8 · pausa de 2 s abajo', 'Serie 3: 6', 'RIR 2', 'Carga sugerida: 60 kg', 'Descanso: 90 s', 'Tempo: bajar en 3 s, subir en 1 s', 'Notas: Espalda neutra en todo el recorrido'];

/** Profesional con un plan en borrador editado con la pirámide, validado y activado. */
async function planConPiramideActivado() {
  const c = await circuitoListoParaPlanificarEntrenamiento(app, `pf03-${++contador}`);
  const b = await crearBorradorDeEntrenamiento(app, c);
  const leida = PlanDeEntrenamientoResponseSchema.parse((await plan(c, b.planId).expect(200)).body).data;
  const editada = PlanDeEntrenamientoResponseSchema.parse((await editar(c, b.planId, leida.version, conPiramide(comoEntrada(leida))).expect(200)).body).data;
  const validada = await conSesion(app, c.pro.token).post(`/api/v1/training/plans/${b.planId}/validate`).send({ expectedVersion: editada.version }).expect(200);
  expect(validada.body.data.valid).toBe(true);
  await activarPlanDeEntrenamiento(app, c.pro, b.planId, editada.version).expect(200);
  return { c, planId: b.planId, editada };
}

describe('PF-03 · DL-105 · lo planificado se conserva y se presenta completo', () => {
  it('editar como el editor web, guardar, validar, activar y consultar conserva las notas por serie, los parámetros y la nota', async () => {
    const { c, planId, editada } = await planConPiramideActivado();
    expect(banca(editada).sets.map((s) => s.note)).toEqual([null, 'pausa de 2 s abajo', null]);

    // Guardar otra vez sin tocar nada, como hace el editor con cada cambio ajeno: la nota por serie no se pierde.
    const activada = PlanDeEntrenamientoResponseSchema.parse((await plan(c, planId).expect(200)).body).data;
    expect(activada.state).toBe('ACTIVATED');
    expect(lineasDePrescripcion(banca(activada))).toEqual(LINEAS_DE_LA_PIRAMIDE);

    // «Hoy» de la APK trae la prescripción completa de la instantánea, y valida contra el esquema estricto de la APK.
    const h = HoyDeEntrenamientoResponseSchema.parse((await hoy(c).expect(200)).body).data;
    const rx = h.occurrences[0]!.plannedSession.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!;
    expect(lineasDePrescripcion(rx)).toEqual(LINEAS_DE_LA_PIRAMIDE);
    expect(h.occurrences[0]!.plannedSession.instructions).toBe('Entrada en calor de diez minutos.');
  });

  it('un borrador sucesor parte de la instantánea con las notas por serie, y reeditarlo no las pierde', async () => {
    const { c, planId } = await planConPiramideActivado();
    const sucesora = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: planId }).expect(201);
    const leida = PlanDeEntrenamientoResponseSchema.parse((await plan(c, sucesora.body.data.planId).expect(200)).body).data;
    expect(lineasDePrescripcion(banca(leida))).toEqual(LINEAS_DE_LA_PIRAMIDE);
    const reeditada = PlanDeEntrenamientoResponseSchema.parse((await editar(c, leida.planId, leida.version, comoEntrada(leida)).expect(200)).body).data;
    expect(lineasDePrescripcion(banca(reeditada))).toEqual(LINEAS_DE_LA_PIRAMIDE);
  });
});

describe('PF-03 · DL-105 · la comparación usa la prescripción de la versión que rigió la sesión', () => {
  it('una ejecución registrada con la pirámide sigue mostrando 10/8/6 después de activar una versión con 5 × 5', async () => {
    const { c, planId } = await planConPiramideActivado();
    const [a] = HoyDeEntrenamientoResponseSchema.parse((await hoy(c).expect(200)).body).data.occurrences;
    const apk = conSesion(app, c.ase.token);
    const borrador = (await apk.put(`/api/v1/training/occurrences/${a!.occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
    const serie = (setIndex: number, reps: number) => ({ setIndex, load: { value: 60, unit: 'kg' }, completedRepetitions: reps, rir: 2, perceivedExertion: null });
    const guardado = (
      await apk
        .patch(`/api/v1/training/execution-drafts/${borrador.draftId}`)
        .send({
          expectedVersion: borrador.version,
          changes: { granularity: 'SET', sessionCondition: 'COMPLETED', exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 10), serie(2, 8), serie(3, 5)] }] },
        })
        .expect(200)
    ).body.data;
    // Lo planificado no se cargó como realizado: la serie 3 dice 5, lo que escribió la persona, no el 6 planificado.
    expect(guardado.exercises[0].sets.map((s: { completedRepetitions: number }) => s.completedRepetitions)).toEqual([10, 8, 5]);
    const registrada = await apk.post(`/api/v1/training/execution-drafts/${borrador.draftId}/confirm`, claveDeIdempotencia()).send({ expectedVersion: guardado.version }).expect(201);
    const executionId = registrada.body.data.executionId as string;

    // El profesional sucede el plan con 5 × 5 y lo activa.
    const sucesora = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: planId }).expect(201);
    const leida = PlanDeEntrenamientoResponseSchema.parse((await plan(c, sucesora.body.data.planId).expect(200)).body).data;
    const bloques = comoEntrada(leida);
    bloques[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!.sets = Array.from({ length: 5 }, () => ({ repetitions: { value: 5 }, note: null }));
    const v2 = PlanDeEntrenamientoResponseSchema.parse((await editar(c, leida.planId, leida.version, bloques).expect(200)).body).data;
    await activarPlanDeEntrenamiento(app, c.pro, v2.planId, v2.version).expect(200);
    expect(lineasDePrescripcion(banca(PlanDeEntrenamientoResponseSchema.parse((await plan(c, v2.planId).expect(200)).body).data))[0]).toBe('5 × 5');

    // La ejecución de antes se compara con lo que regía: la pirámide, con su nota y su versión.
    for (const token of [c.pro.token, c.ase.token]) {
      const x = EjecucionDeEntrenamientoResponseSchema.parse((await conSesion(app, token).get(`/api/v1/training/executions/${executionId}`).expect(200)).body).data;
      expect(x.planId).toBe(planId);
      const rx = x.plannedSession.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!;
      expect(lineasDePrescripcion(rx)).toEqual(LINEAS_DE_LA_PIRAMIDE);
      expect(x.original.exercises[0]!.sets!.map((s) => s.completedRepetitions)).toEqual([10, 8, 5]);
    }
  });
});
