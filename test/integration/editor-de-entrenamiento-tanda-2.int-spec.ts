/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2) · por la API real contra PostgreSQL: TEST-ET2-API-01 a 06.
 *
 * - **El 1RM de referencia** (API-RMX-01 y 02): la calibración con su cuenta, lo declarado, el último registro en rango, el
 *   aviso cuando se aleja y elegir el registro; lo ajeno, el 404 de lo inexistente.
 * - **La carga de cada semana** en las lecturas del titular (API-TRN-09, «Hoy» y API-SER-02), con los mismos campos: la
 *   última APK congelada las lee sin rechazos, y el rótulo `week` solo sale con `training-week-load-1`.
 * - **El esfuerzo de la sesión** (API-ESF-01 y 02): la opción del plan, la pregunta solo para quien la declara, uno por
 *   sesión, la lectura del profesional y lo ajeno.
 * - **Las plantillas con su planificación** y **la clasificación de un propio**.
 * Las cuentas las prueba el dominio (`packages/domain/src/editor-de-entrenamiento-tanda-2.test.ts`).
 */
import type { INestApplication } from '@nestjs/common';
import {
  CAPACIDAD_ESFUERZO_DE_LA_SESION,
  CAPACIDAD_OBJETIVOS_POR_SERIE,
  CAPACIDAD_SEMANA_DE_LA_FASE,
  ClasificacionDeEjercicioPropioResponseSchema,
  EsfuerzosDeLaSesionResponseSchema,
  PlanConObjetivosResponseSchema,
  PlantillaDeEntrenamientoResponseSchema,
  UnoRMDeLaPersonaResponseSchema,
  UnoRMGuardadoResponseSchema,
  valorDeCapacidades,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { fechaLocalEn, ZONA_POR_DEFECTO } from '../../apps/api/src/nutricion/zona';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, CATALOGO_DE_EJERCICIOS, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento, estructuraDeEntrenamiento, type CircuitoParaPlanificar } from './soporte-entrenamiento';
import { LA_ULTIMA_APK, LaApk } from './soporte-lecturas-de-la-apk';
import { conLaApk } from './soporte-por-serie';
import { prepararProfesional } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = (nombre: string): string => `et2-${nombre}-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const hoy = (): string => fechaLocalEn(new Date(), ZONA_POR_DEFECTO);
const antes = (dias: number): string => new Date(Date.parse(`${hoy()}T12:00:00Z`) - dias * 86_400_000).toISOString().slice(0, 10);
const LA_APK_NUEVA = valorDeCapacidades([CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_SEMANA_DE_LA_FASE, CAPACIDAD_ESFUERZO_DE_LA_SESION]);

const detalle = async (token: string, planId: string) => PlanConObjetivosResponseSchema.parse((await conSesion(app, token).get(`/api/v1/training/plans/${planId}/detail`).expect(200)).body).data;

/** El borrador con la planificación pedida (la fase con todas las semanas del plan), activado. */
async function planActivo(c: CircuitoParaPlanificar, planning: (blockId: string) => Record<string, unknown>): Promise<{ planId: string; blockId: string; exerciseId: string }> {
  const b = await crearBorradorDeEntrenamiento(app, c);
  const leido = await detalle(c.pro.token, b.planId);
  const blockId = leido.blocks[0]!.blockId;
  const banca = leido.blocks[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!;
  // La estructura con el identificador de la fase: sin él, la API le pondría otro y la planificación quedaría sin su fase.
  const changes = estructuraDeEntrenamiento() as { blocks: Record<string, unknown>[] };
  changes.blocks[0]!.blockId = blockId;
  const conPlan = await conSesion(app, c.pro.token)
    .patch(`/api/v1/training/plans/${b.planId}`)
    .send({ expectedVersion: b.version, changes, planning: planning(blockId) })
    .expect(200);
  await activarPlanDeEntrenamiento(app, c.pro, b.planId, conPlan.body.data.version).expect(200);
  return { planId: b.planId, blockId, exerciseId: banca.exerciseId };
}

/** La persona registra hoy la sesión A con estas series del press de banca, escritas por ella. */
async function registrarHoy(c: CircuitoParaPlanificar, series: readonly { carga: number; reps: number; rir: number }[]): Promise<string> {
  const ase = conSesion(app, c.ase.token);
  const hoyLeido = await ase.get('/api/v1/me/training/today').expect(200);
  const ocurrencia = (hoyLeido.body.data.occurrences as { occurrenceId: string; plannedSession: { sessionId: string } }[]).find((o) => o.plannedSession.sessionId === 'ses-a')!.occurrenceId;
  const borrador = await ase.put(`/api/v1/training/occurrences/${ocurrencia}/execution-draft`).send({}).expect((r) => expect([200, 201]).toContain(r.status));
  const sets = series.map((s, n) => ({
    setIndex: n + 1,
    load: { value: s.carga, unit: 'kg' },
    completedRepetitions: s.reps,
    rir: s.rir,
    perceivedExertion: null,
    recordedAs: 'TYPED',
    fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' },
  }));
  const guardado = await ase
    .patch(`/api/v1/training/execution-drafts/${borrador.body.data.draftId}`)
    .send({ expectedVersion: borrador.body.data.version, changes: { granularity: 'SET', sessionCondition: 'COMPLETED', exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets }] } })
    .expect(200);
  const confirmada = await ase.post(`/api/v1/training/execution-drafts/${borrador.body.data.draftId}/confirm`).send({ expectedVersion: guardado.body.data.version }).expect(201);
  return confirmada.body.data.executionId as string;
}

describe('DL-198 · el 1RM de referencia', () => {
  it('TEST-ET2-API-01 · la calibración (30 kg × 8 a RIR 1 = 39 kg), lo declarado, lo más reciente y lo que no se puede calibrar', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('calibrar'));
    const { exerciseId } = await planActivo(c, (blockId) => ({ startDate: hoy(), weeks: 4, phases: [{ blockId, weeks: 4 }] }));
    const pro = conSesion(app, c.pro.token);
    const ruta = `/api/v1/advisees/${c.ase.id}/training/one-rep-max`;
    const vacio = UnoRMDeLaPersonaResponseSchema.parse((await pro.get(`${ruta}?exerciseIds=${exerciseId}`).expect(200)).body).data[0]!;
    expect(vacio.current).toBeNull();
    const cal = UnoRMGuardadoResponseSchema.parse(
      (await pro.post(ruta).send({ origin: 'CALIBRATION', exerciseId, localDate: antes(2), load: { value: 30, unit: 'kg' }, completedRepetitions: 8, rir: 1 }).expect(201)).body,
    ).data;
    expect(cal.entry.value).toEqual({ value: 39, unit: 'kg' });
    expect(cal.entry.method).toEqual({ specification: 'BE-E1RM', version: 2, method: 'EPLEY_V2' });
    expect(cal.exercise.current).toMatchObject({ origin: 'CALIBRATION', value: { value: 39, unit: 'kg' } });
    // Lo declarado después pasa a ser el que usa BE; lo anterior queda en la historia.
    await pro.post(ruta).send({ origin: 'DECLARED', exerciseId, localDate: antes(1), value: { value: 42, unit: 'kg' }, note: 'Lo dijo su profe anterior' }).expect(201);
    const leido = UnoRMDeLaPersonaResponseSchema.parse((await pro.get(`${ruta}?exerciseIds=${exerciseId}`).expect(200)).body).data[0]!;
    expect(leido.current?.origin).toBe('DECLARED');
    expect(leido.history.map((h) => h.origin)).toEqual(['DECLARED', 'CALIBRATION']);
    // Fuera de rango, o con fecha futura: 422, y no se guarda nada.
    const fuera = await pro.post(ruta).send({ origin: 'CALIBRATION', exerciseId, localDate: hoy(), load: { value: 30, unit: 'kg' }, completedRepetitions: 15, rir: 0 }).expect(422);
    expect(fuera.body.error.details.issues[0].code).toBe('REPETICIONES_FUERA');
    await pro.post(ruta).send({ origin: 'CALIBRATION', exerciseId, localDate: hoy(), load: { value: 30, unit: 'kg' }, completedRepetitions: 8, rir: 3 }).expect(422);
    await pro.post(ruta).send({ origin: 'DECLARED', exerciseId, localDate: antes(-3), value: { value: 40, unit: 'kg' } }).expect(422);
    expect(await prisma.unoRMDeReferencia.count({ where: { asesoradoId: c.ase.id } })).toBe(2);
    // La base no deja cambiarlo ni borrarlo.
    await expect(prisma.unoRMDeReferencia.updateMany({ where: { asesoradoId: c.ase.id }, data: { valor: 1 } })).rejects.toThrow(/append-only/);
  });

  it('TEST-ET2-API-02 · el último registro en rango (Epley v2), el aviso cuando se aleja más del 10 % y elegir el registro', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('registro'));
    const { exerciseId } = await planActivo(c, (blockId) => ({ startDate: hoy(), weeks: 4, phases: [{ blockId, weeks: 4 }] }));
    const pro = conSesion(app, c.pro.token);
    const ruta = `/api/v1/advisees/${c.ase.id}/training/one-rep-max`;
    await pro.post(ruta).send({ origin: 'CALIBRATION', exerciseId, localDate: antes(1), load: { value: 30, unit: 'kg' }, completedRepetitions: 8, rir: 1 }).expect(201);
    // 32 × 10 a RIR 2 y 34 × 8 a RIR 1 entran; 36 × 5 no (menos de 8). La de mayor carga que entra: 34 × 1,3 = 44,2 → 44.
    await registrarHoy(c, [
      { carga: 32, reps: 10, rir: 2 },
      { carga: 34, reps: 8, rir: 1 },
      { carga: 36, reps: 5, rir: 1 },
    ]);
    const leido = UnoRMDeLaPersonaResponseSchema.parse((await pro.get(`${ruta}?exerciseIds=${exerciseId}`).expect(200)).body).data[0]!;
    expect(leido.lastRecord).toMatchObject({ value: { value: 44, unit: 'kg' }, localDate: hoy(), setIndex: 2, set: { completedRepetitions: 8, rir: 1 } });
    // 44 frente a 39 es un 13 % más: BE sigue con la calibración y avisa.
    expect(leido.current?.origin).toBe('CALIBRATION');
    expect(leido.warning?.differencePercent).toBe(13);
    // Elegir el registro lo guarda (BE lo vuelve a calcular): pasa a ser el que usa.
    const r = leido.lastRecord!;
    const elegido = UnoRMGuardadoResponseSchema.parse(
      (await pro.post(ruta).send({ origin: 'RECORD', exerciseId, executionId: r.executionId, prescriptionId: r.prescriptionId, setIndex: r.setIndex }).expect(201)).body,
    ).data;
    expect(elegido.entry).toMatchObject({ origin: 'RECORD', value: { value: 44, unit: 'kg' } });
    expect(elegido.exercise.current).toMatchObject({ origin: 'RECORD', entryId: elegido.entry.entryId });
    expect(elegido.exercise.warning).toBeNull();
    // Otro registro que no es el último no se elige.
    await pro.post(ruta).send({ origin: 'RECORD', exerciseId, executionId: r.executionId, prescriptionId: r.prescriptionId, setIndex: 1 }).expect(422);
  });

  it('TEST-ET2-API-03 · otro profesional, la persona y lo inexistente reciben lo mismo: el 404', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('ajeno'));
    const { exerciseId } = await planActivo(c, (blockId) => ({ startDate: hoy(), weeks: 4, phases: [{ blockId, weeks: 4 }] }));
    const otroPro = await prepararProfesional(app, etiqueta('ajeno-pro'), ['ENTRENAMIENTO']);
    const otro = conSesion(app, otroPro.token);
    const ruta = (id: string) => `/api/v1/advisees/${id}/training/one-rep-max`;
    const inexistente = (await otro.get(`${ruta(randomUUID())}?exerciseIds=${exerciseId}`).expect(404)).body;
    expect((await otro.get(`${ruta(c.ase.id)}?exerciseIds=${exerciseId}`).expect(404)).body).toEqual(inexistente);
    const cuerpo = { origin: 'DECLARED', exerciseId, localDate: hoy(), value: { value: 40, unit: 'kg' } };
    expect((await otro.post(ruta(c.ase.id)).send(cuerpo).expect(404)).body.error.code).toBe(inexistente.error.code);
    await conSesion(app, c.ase.token).get(`${ruta(c.ase.id)}?exerciseIds=${exerciseId}`).expect(404);
    expect(await prisma.unoRMDeReferencia.count({ where: { asesoradoId: c.ase.id } })).toBe(0);
  });
});

describe('DL-198 · la carga de cada semana llega a la app', () => {
  it('TEST-ET2-API-04 · en la semana 3 de una lineal de +2,5 kg, el titular recibe 65 kg en los mismos campos; el profesional sigue viendo la base; la APK congelada lee sin rechazos', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('semana'));
    const lineal = (blockId: string) => ({ blockId, model: 'LINEAR', loadStep: 2.5, repStep: 0, repRange: null, waves: null, deload: null, prescriptionIds: ['rx-banca'] });
    const { planId } = await planActivo(c, (blockId) => ({ startDate: antes(14), weeks: 6, phases: [{ blockId, weeks: 6 }], progressions: [lineal(blockId)] }));
    // El titular, sin capacidades: los mismos campos con la carga de la semana 3.
    const ase = conSesion(app, c.ase.token);
    const plan = (await ase.get(`/api/v1/training/plans/${planId}`).expect(200)).body.data;
    const banca = plan.blocks[0].sessions[0].prescriptions.find((p: { prescriptionId: string }) => p.prescriptionId === 'rx-banca');
    expect(banca.suggestedLoad).toEqual({ value: 65, unit: 'kg' });
    const hoyLeido = await ase.get('/api/v1/me/training/today').expect(200);
    const o = (hoyLeido.body.data.occurrences as { occurrenceId: string; plannedSession: { sessionId: string; prescriptions: { prescriptionId: string; suggestedLoad: unknown }[] } }[]).find((x) => x.plannedSession.sessionId === 'ses-a')!;
    expect(o.plannedSession.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!.suggestedLoad).toEqual({ value: 65, unit: 'kg' });
    const sinRotulo = (await conLaApk(app, c.ase.token).get(`/api/v1/training/occurrences/${o.occurrenceId}/session`).expect(200)).body.data;
    expect(Object.hasOwn(sinRotulo, 'week')).toBe(false);
    expect(sinRotulo.session.prescriptions.find((p: { prescriptionId: string }) => p.prescriptionId === 'rx-banca').sets.map((s: { target: { suggestedLoad: unknown } }) => s.target.suggestedLoad)).toEqual([
      { value: 65, unit: 'kg' },
      { value: 65, unit: 'kg' },
      { value: 65, unit: 'kg' },
    ]);
    // La sentadilla no está en la regla: queda igual.
    expect(sinRotulo.session.prescriptions.find((p: { prescriptionId: string }) => p.prescriptionId === 'rx-sentadilla').suggestedLoad).toBeNull();
    // Con `training-week-load-1`, el rótulo de la semana.
    const conRotulo = (await conLaApk(app, c.ase.token, LA_APK_NUEVA).get(`/api/v1/training/occurrences/${o.occurrenceId}/session`).expect(200)).body.data;
    expect(conRotulo.week).toEqual({ phaseWeek: 3, phaseWeeks: 6, deload: false });
    // El profesional edita sobre la base: 60 kg.
    const delPro = await detalle(c.pro.token, planId);
    expect(delPro.blocks[0]!.sessions[0]!.prescriptions.find((p) => p.prescriptionId === 'rx-banca')!.suggestedLoad).toEqual({ value: 60, unit: 'kg' });
    // La última APK congelada lee «Hoy», el plan y la sesión con sus esquemas estrictos, sin rechazos.
    const apk = new LaApk(LA_ULTIMA_APK, () => app);
    await apk.pide('API-TRN-14', { token: c.ase.token });
    await apk.pide('API-TRN-09', { token: c.ase.token, params: { planId } });
    if (apk.lee('API-SER-02')) await apk.pide('API-SER-02', { token: c.ase.token, params: { occurrenceId: o.occurrenceId } });
    expect(apk.rechazos()).toEqual([]);
  });
});

describe('DL-198 · el esfuerzo de la sesión', () => {
  it('TEST-ET2-API-05 · la opción del plan, la pregunta solo para quien la declara, uno por sesión y la lectura del profesional', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('esfuerzo'));
    await planActivo(c, (blockId) => ({ startDate: hoy(), weeks: 4, phases: [{ blockId, weeks: 4 }], askSessionEffort: true }));
    const ase = conSesion(app, c.ase.token);
    const hoyLeido = await ase.get('/api/v1/me/training/today').expect(200);
    const ocurrencia = (hoyLeido.body.data.occurrences as { occurrenceId: string; plannedSession: { sessionId: string } }[]).find((o) => o.plannedSession.sessionId === 'ses-a')!.occurrenceId;
    expect(Object.hasOwn((await conLaApk(app, c.ase.token).get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(200)).body.data, 'askSessionEffort')).toBe(false);
    expect((await conLaApk(app, c.ase.token, LA_APK_NUEVA).get(`/api/v1/training/occurrences/${ocurrencia}/session`).expect(200)).body.data.askSessionEffort).toBe(true);
    const executionId = await registrarHoy(c, [{ carga: 60, reps: 8, rir: 2 }]);
    const ruta = `/api/v1/training/executions/${executionId}/session-effort`;
    // Los minutos van con su origen.
    await ase.post(ruta).send({ rating: 7, durationMinutes: 60, durationSource: null }).expect(400);
    // El profesional no responde por ella: el 404 de lo inexistente.
    await conSesion(app, c.pro.token).post(ruta).send({ rating: 7, durationMinutes: 60, durationSource: 'TIMER' }).expect(404);
    const r = (await ase.post(ruta).send({ rating: 7, durationMinutes: 60, durationSource: 'TIMER' }).expect(201)).body.data;
    expect(r).toMatchObject({ executionId, rating: 7, durationMinutes: 60, durationSource: 'TIMER', sessionLoad: 420, sessionLabel: 'Sesión A' });
    // Uno por sesión.
    const otra = await ase.post(ruta, claveDeIdempotencia()).send({ rating: 5, durationMinutes: null, durationSource: null }).expect(409);
    expect(otra.body.error.code).toBe('RESOURCE_CONFLICT');
    // El profesional lo lee en el período; otro profesional, el 404.
    const periodo = `periodStart=${antes(7)}&periodEnd=${hoy()}`;
    const lista = EsfuerzosDeLaSesionResponseSchema.parse((await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/training/session-efforts?${periodo}`).expect(200)).body).data;
    expect(lista.efforts.map((e) => e.sessionLoad)).toEqual([420]);
    const otroPro = await prepararProfesional(app, etiqueta('esfuerzo-otro'), ['ENTRENAMIENTO']);
    await conSesion(app, otroPro.token).get(`/api/v1/advisees/${c.ase.id}/training/session-efforts?${periodo}`).expect(404);
    await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/training/session-efforts`).expect(400);
  });
});

describe('DL-198 · las plantillas con su planificación y la clasificación de un propio', () => {
  it('TEST-ET2-API-06 · una plantilla guarda la planificación sin nada de la persona y el plan que sale de ella la recibe con sus fases', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta('plantilla'));
    const estructura = estructuraDeEntrenamiento() as { blocks: Record<string, unknown>[] };
    estructura.blocks[0]!.blockId = 'fase-1';
    const planning = {
      weeks: 6,
      phases: [{ blockId: 'fase-1', weeks: 6 }],
      progressions: [{ blockId: 'fase-1', model: 'LINEAR', loadStep: 2.5, repStep: 0, repRange: null, waves: null, deload: null, prescriptionIds: ['rx-banca'] }],
      intensity: 'PERCENT_RM',
      askSessionEffort: true,
    };
    const t = PlantillaDeEntrenamientoResponseSchema.parse(
      (await conSesion(app, c.pro.token).post('/api/v1/training/plan-templates').send({ name: `Fuerza ${etiqueta('t')}`, structure: estructura, planning }).expect(201)).body,
    ).data;
    expect(t.planning).toMatchObject({ weeks: 6, intensity: 'PERCENT_RM', askSessionEffort: true });
    // Con datos de la persona, el contrato no la acepta.
    await conSesion(app, c.pro.token)
      .post('/api/v1/training/plan-templates')
      .send({ name: `Otra ${etiqueta('t')}`, structure: estructura, planning: { ...planning, privateNotes: { plan: 'x', phases: [] } } })
      .expect(400);
    const b = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, fromTemplateVersionId: t.versionId }).expect(201);
    const plan = await detalle(c.pro.token, b.body.data.planId);
    const fase = plan.blocks[0]!.blockId;
    expect(plan.planning).toMatchObject({ startDate: null, weeks: 6, phases: [{ blockId: fase, weeks: 6 }], intensity: 'PERCENT_RM', askSessionEffort: true });
    expect(plan.planning?.progressions?.[0]).toMatchObject({ blockId: fase, model: 'LINEAR' });
    expect(plan.planning?.progressions?.[0]?.prescriptionIds).toEqual([plan.blocks[0]!.sessions[0]!.prescriptions[0]!.prescriptionId]);
  });

  it('TEST-ET2-API-07 · la clasificación de un propio se cambia con la versión que se vio; lo ajeno, el 404', async () => {
    const pro = await prepararProfesional(app, etiqueta('clasificacion'), ['ENTRENAMIENTO']);
    const s = conSesion(app, pro.token);
    const creado = (await s.post('/api/v1/training/exercises').send({ name: `Remo propio ${etiqueta('r')}`, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201)).body.data;
    const ruta = `/api/v1/training/exercises/${creado.exerciseId}/classification`;
    const clasificacion = { muscleGroup: 'BACK', equipment: ['DUMBBELL', 'BENCH'], movementPattern: 'PULL', joints: 'MULTI' };
    const r = ClasificacionDeEjercicioPropioResponseSchema.parse((await s.put(ruta).send({ expectedClassificationVersion: 0, classification: clasificacion }).expect(200)).body).data;
    expect(r).toEqual({ exerciseId: creado.exerciseId, classificationVersion: 1, classification: clasificacion });
    await s.put(ruta).send({ expectedClassificationVersion: 0, classification: clasificacion }).expect(409);
    const propios = (await s.get('/api/v1/training/own-exercises').expect(200)).body.data as { exerciseId: string; classificationVersion: number; classification: unknown }[];
    expect(propios.find((e) => e.exerciseId === creado.exerciseId)).toMatchObject({ classificationVersion: 1, classification: clasificacion });
    const otro = await prepararProfesional(app, etiqueta('clasificacion-otro'), ['ENTRENAMIENTO']);
    await conSesion(app, otro.token).put(ruta).send({ expectedClassificationVersion: 1, classification: clasificacion }).expect(404);
    expect(await prisma.clasificacionDeEjercicio.count({ where: { ejercicioId: creado.exerciseId } })).toBe(1);
  });
});
