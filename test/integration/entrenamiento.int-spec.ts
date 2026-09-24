/**
 * WP-06 · el circuito de entrenamiento por la API real, contra PostgreSQL. Cada prueba cita la regla que verifica.
 *
 * Este archivo crece por tramos, como el paquete (docs/paquetes/WP-06.md §9.6). Tramo 1: evaluación y objetivo
 * (UC-P14; API-TRN-01 a 06) y el catálogo propio de ejercicios (RF-037; API-TRN-13 y API-INT-TRN-01). Tramo 2: el plan,
 * su validación y su activación (UC-P15, UC-P16; API-TRN-07 a 12). Tramo 3: «Hoy», las ocurrencias y el registro de la
 * ejecución, con su corrección (UC-P17, UC-E02; API-TRN-14 a 20). Tramo 4: revisión y continuidad (UC-P18; API-TRN-21 a 24).
 */
import type { INestApplication } from '@nestjs/common';
import { codificarOcurrencia } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { a3Vigente, prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto } from './soporte-vinculo';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { ProcesoService } from '../../apps/api/src/proceso/proceso.service';
import {
  activarPlanDeEntrenamiento,
  borradorDeEjecucion,
  CATALOGO_DE_EJERCICIOS,
  circuitoConPlanDeEntrenamientoActivo,
  circuitoDeEntrenamiento,
  circuitoListoParaPlanificarEntrenamiento,
  crearBorradorDeEntrenamiento,
  cuerpoDeEvaluacionDeEntrenamiento,
  cuerpoDeObjetivoDeEntrenamiento,
  estructuraDeEntrenamiento,
  sembrarPlanActivado,
  type CircuitoDeEntrenamiento,
} from './soporte-entrenamiento';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const fresco = (): Promise<CircuitoDeEntrenamiento> => circuitoDeEntrenamiento(app, `trn-${++contador}`);

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const evaluaciones = (adviseeId: string) => `/api/v1/advisees/${adviseeId}/training/evaluations`;
const objetivos = (adviseeId: string) => `/api/v1/advisees/${adviseeId}/training/objectives`;

// ─── UC-P14 · Evaluación y objetivo (RF-036, RF-064) ────────────────────────────────────────────

describe('UC-P14 · evaluación de entrenamiento (RF-036; API-TRN-01 a 03)', () => {
  it('TEST-RF-036 · la evaluación conserva la fuente de cada dato, y una posterior no sobrescribe la anterior (REG-06-97)', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const primera = await pro.post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    await pro.post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    const lista = await pro.get(evaluaciones(c.ase.id)).expect(200);
    expect(lista.body.data).toHaveLength(2);
    const una = await pro.get(`/api/v1/training/evaluations/${primera.body.data.evaluationId}`).expect(200);
    expect(una.body.data.assessment.entries.map((e: { source: string }) => e.source)).toEqual(['REPORTED', 'REPORTED', 'OBSERVED']);
    expect(una.body.data.professional.identityId).toBe(c.pro.id);
  });

  it('una evaluación no puede ocurrir en el futuro: TRAINING_EVALUATION_INVALID', async () => {
    const c = await fresco();
    const r = await conSesion(app, c.pro.token)
      .post(evaluaciones(c.ase.id))
      .send({ ...cuerpoDeEvaluacionDeEntrenamiento(), occurredAt: new Date(Date.now() + 86_400_000).toISOString() })
      .expect(422);
    expect(r.body.error.code).toBe('TRAINING_EVALUATION_INVALID');
  });

  it('un reintento con la misma clave no duplica; la misma clave con otro cuerpo es IDEMPOTENCY_KEY_REUSED', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const clave = claveDeIdempotencia();
    const cuerpo = cuerpoDeEvaluacionDeEntrenamiento();
    const a = await pro.post(evaluaciones(c.ase.id), clave).send(cuerpo).expect(201);
    const b = await pro.post(evaluaciones(c.ase.id), clave).send(cuerpo);
    expect(b.body.data.evaluationId).toBe(a.body.data.evaluationId);
    const r = await pro.post(evaluaciones(c.ase.id), clave).send({ ...cuerpo, professionalNotes: 'otra' }).expect(409);
    expect(r.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect((await pro.get(evaluaciones(c.ase.id)).expect(200)).body.data).toHaveLength(1);
  });

  it('DL-057 · otro profesional de entrenamiento del mismo asesorado no ve lo ajeno: el mismo 404 que lo inexistente', async () => {
    const c = await fresco();
    const otro = await prepararProfesional(app, `trn-otro-${contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otro, c.ase, 'ENTRENAMIENTO');
    const ev = await conSesion(app, c.pro.token).post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    const ajena = await conSesion(app, otro.token).get(`/api/v1/training/evaluations/${ev.body.data.evaluationId}`).expect(404);
    const inexistente = await conSesion(app, otro.token).get(`/api/v1/training/evaluations/${randomUUID()}`).expect(404);
    expect(ajena.body).toEqual(inexistente.body);
    expect((await conSesion(app, otro.token).get(evaluaciones(c.ase.id)).expect(200)).body.data).toEqual([]);
  });

  it('08 §11 · el alcance es el de entrenamiento: un profesional con vínculo de nutrición sobre el mismo asesorado recibe 404', async () => {
    const c = await fresco();
    const nutri = await prepararProfesional(app, `trn-nutri-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, nutri, c.ase, 'NUTRICION');
    await conSesion(app, nutri.token).post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(404);
    await conSesion(app, nutri.token).get(evaluaciones(c.ase.id)).expect(404);
  });

  it('S10-TRN-09 · revocado el consentimiento, la siguiente operación se deniega (08 §17)', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    await pro.get(evaluaciones(c.ase.id)).expect(200);
    await revocarB2(app, c.ase, c.consentId).expect(200);
    await pro.get(evaluaciones(c.ase.id)).expect(404);
    await pro.post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(404);
  });
});

describe('UC-P14 · objetivo de entrenamiento (RF-064; API-TRN-04 a 06)', () => {
  it('RF-064 · sin objetivo, el efectivo es null: ausencia legítima (09v10:648-656)', async () => {
    const c = await fresco();
    const r = await conSesion(app, c.pro.token).get(`${objetivos(c.ase.id)}/effective`).expect(200);
    expect(r.body).toEqual({ data: { objective: null } });
  });

  it('REG-06-98 · cada cambio es una versión nueva; el efectivo es la terminal de la sucesión, no la última por fecha', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const ev = await pro.post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    const v1 = await pro.post(objetivos(c.ase.id)).send(cuerpoDeObjetivoDeEntrenamiento(ev.body.data.evaluationId, 'Primer enunciado.')).expect(201);
    const v2 = await pro.post(objetivos(c.ase.id)).send(cuerpoDeObjetivoDeEntrenamiento(ev.body.data.evaluationId, 'Segundo enunciado.')).expect(201);
    expect(v2.body.data.predecessorVersionId).toBe(v1.body.data.versionId);
    const efectivo = await pro.get(`${objetivos(c.ase.id)}/effective`).expect(200);
    expect(efectivo.body.data.objective.versionId).toBe(v2.body.data.versionId);
    expect(efectivo.body.data.objective.objective).toEqual({ statement: 'Segundo enunciado.' });
    const historia = await pro.get(objetivos(c.ase.id)).expect(200);
    expect(historia.body.data.map((v: { isEffective: boolean }) => v.isEffective).sort()).toEqual([false, true]);
  });

  it('el objetivo se funda en una evaluación de este asesorado: EVALUATION_NOT_COMPATIBLE', async () => {
    const c = await fresco();
    const otro = await fresco();
    const ajena = await conSesion(app, otro.pro.token).post(evaluaciones(otro.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    const r = await conSesion(app, c.pro.token).post(objetivos(c.ase.id)).send(cuerpoDeObjetivoDeEntrenamiento(ajena.body.data.evaluationId)).expect(422);
    expect(r.body.error.code).toBe('EVALUATION_NOT_COMPATIBLE');
  });

  it('09v10:613 · el fundamento es obligatorio', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const ev = await pro.post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    await pro.post(objetivos(c.ase.id)).send({ ...cuerpoDeObjetivoDeEntrenamiento(ev.body.data.evaluationId), rationale: '' }).expect(400);
  });
});

// ─── RF-037 · Catálogo propio de ejercicios ─────────────────────────────────────────────────────

describe('RF-037 · catálogo propio de ejercicios (API-TRN-13 y API-INT-TRN-01)', () => {
  it('INV-06-143 · el catálogo sembrado está rotulado como sintético, y sin zonas ni porcentajes inventados', async () => {
    const c = await fresco();
    const r = await conSesion(app, c.pro.token).get('/api/v1/training/exercises?limit=50').expect(200);
    const sembrados = r.body.data.filter((e: { provenance: string }) => e.provenance === 'BE_SYNTHETIC_SEED');
    expect(sembrados).toHaveLength(12);
    for (const e of sembrados) {
      expect(e.muscleZones).toEqual([]);
      expect(e.didacticResources).toEqual([]);
      expect(Object.keys(e).sort()).toEqual(['available', 'didacticResources', 'exerciseId', 'muscleZones', 'name', 'provenance', 'versionId']);
    }
  });

  it('la búsqueda filtra por nombre', async () => {
    const c = await fresco();
    const r = await conSesion(app, c.pro.token).get('/api/v1/training/exercises?q=press').expect(200);
    const nombres = r.body.data.map((e: { name: string }) => e.name).sort();
    expect(nombres).toEqual(expect.arrayContaining(['Press con mancuernas', 'Press de banca', 'Press militar']));
    expect(nombres.every((n: string) => n.toLowerCase().includes('press'))).toBe(true);
  });

  it('§9.8 · la carga manual entra en WP-06 con cero zonas, y es del ámbito de quien la cargó (REG-06-135)', async () => {
    const c = await fresco();
    const otro = await prepararProfesional(app, `trn-cat-${contador}`, ['ENTRENAMIENTO']);
    const nombre = `Remo en máquina sintético ${randomUUID().slice(0, 8)}`;
    const creado = await conSesion(app, c.pro.token)
      .post('/api/v1/training/exercises')
      .send({ name: nombre, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } })
      .expect(201);
    expect(creado.body.data).toMatchObject({ name: nombre, provenance: 'PROFESSIONAL_MANUAL', muscleZones: [], available: true });
    const propio = await conSesion(app, c.pro.token).get(`/api/v1/training/exercises?q=${encodeURIComponent(nombre)}`).expect(200);
    expect(propio.body.data).toHaveLength(1);
    const ajeno = await conSesion(app, otro.token).get(`/api/v1/training/exercises?q=${encodeURIComponent(nombre)}`).expect(200);
    expect(ajeno.body.data).toEqual([]);
  });

  it('REG-06-139 · una zona o un material que el dominio todavía no tiene es un 422 con su motivo, no una relación inventada', async () => {
    const c = await fresco();
    const pro = conSesion(app, c.pro.token);
    const zona = await pro
      .post('/api/v1/training/exercises')
      .send({ name: 'Con zona', muscleZones: [{ zoneId: 'zone_chest', role: 'PRIMARY' }], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } })
      .expect(422);
    expect(zona.body.error.code).toBe('VALIDATION_FAILED');
    expect(zona.body.error.details.issues).toEqual([{ code: 'MUSCLE_ZONE_UNKNOWN', path: 'muscleZones[0].zoneId' }]);
    // El rol se valida por contrato: PRIMARY o SECONDARY, sin porcentaje (09v10:425-446).
    await pro
      .post('/api/v1/training/exercises')
      .send({ name: 'Con peso', muscleZones: [{ zoneId: 'zone_chest', role: 'PRIMARY', percentage: 63 }], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } })
      .expect(400);
  });

  it('el catálogo no es para cualquiera: un asesorado sin plan y un profesional solo de nutrición reciben 403', async () => {
    const ase = await prepararAsesorado(app, `trn-sinplan-${++contador}`, { a3: true });
    await conSesion(app, ase.token).get('/api/v1/training/exercises').expect(403);
    const nutri = await prepararProfesional(app, `trn-solonutri-${contador}`, ['NUTRICION']);
    await conSesion(app, nutri.token).get('/api/v1/training/exercises').expect(403);
    await conSesion(app, nutri.token).post('/api/v1/training/exercises').send({ name: 'x', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(403);
  });

  it('B10-06:762-768 · el asesorado con plan consulta el catálogo para sustituir: ve lo sembrado y lo de su profesional, no lo de otros', async () => {
    const c = await fresco();
    const otro = await prepararProfesional(app, `trn-ajeno-${contador}`, ['ENTRENAMIENTO']);
    const deSuPro = `Del profesional ${randomUUID().slice(0, 8)}`;
    const deOtro = `De otro ${randomUUID().slice(0, 8)}`;
    await conSesion(app, c.pro.token).post('/api/v1/training/exercises').send({ name: deSuPro, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201);
    await conSesion(app, otro.token).post('/api/v1/training/exercises').send({ name: deOtro, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201);
    await sembrarPlanActivado(prisma, c);
    const ase = conSesion(app, c.ase.token);
    expect((await ase.get(`/api/v1/training/exercises?q=${encodeURIComponent(deSuPro)}`).expect(200)).body.data).toHaveLength(1);
    expect((await ase.get(`/api/v1/training/exercises?q=${encodeURIComponent(deOtro)}`).expect(200)).body.data).toEqual([]);
    // Consultar no es cargar: el asesorado no agrega ejercicios al catálogo.
    await ase.post('/api/v1/training/exercises').send({ name: 'x', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(403);
  });
});

// ─── UC-P15 y UC-P16 · Plan (RF-039, RF-040, RF-041) ────────────────────────────────────────────

const plan = (planId: string) => `/api/v1/training/plans/${planId}`;

describe('UC-P15 · borrador de plan (RF-039, RF-040; API-TRN-07 a 10)', () => {
  it('TEST-RF-039 · el borrador es el mismo recurso del plan, en DRAFT, no vigente, sin Proceso; la jerarquía vuelve con orden y nombres', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `plan-${++contador}`);
    const b = await crearBorradorDeEntrenamiento(app, c);
    expect(b.body).toMatchObject({ state: 'DRAFT', isEffective: false, activatedAt: null, snapshotDigest: null, objectiveVersionId: c.objectiveVersionId });
    const [bloque] = b.body.blocks as { order: number; microcycles: unknown[]; sessions: { sessionId: string; prescriptions: { exerciseName: string; intensity: unknown }[] }[] }[];
    expect(bloque?.order).toBe(1);
    expect(bloque?.microcycles).toEqual([]);
    expect(bloque?.sessions.map((s) => s.sessionId)).toEqual(['ses-a', 'ses-b']);
    expect(bloque?.sessions[0]?.prescriptions.map((p) => p.exerciseName)).toEqual(['Press de banca', 'Sentadilla']);
    expect(bloque?.sessions[1]?.prescriptions[0]?.intensity).toBeNull();
    expect(await prisma.procesoOperativo.count({ where: { asesoradoId: c.ase.id } })).toBe(0);
  });

  it('REG-06-12 · un solo borrador por plan: el segundo es RESOURCE_CONFLICT y señala el existente', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `plan-${++contador}`);
    const b = await crearBorradorDeEntrenamiento(app, c);
    const r = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId }).expect(409);
    expect(r.body.error).toMatchObject({ code: 'RESOURCE_CONFLICT', details: { draftPlanId: b.planId } });
  });

  it('09v10:686 · el plan se ata al objetivo efectivo de este asesorado', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `plan-${++contador}`);
    const r = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: randomUUID() }).expect(422);
    expect(r.body.error.code).toBe('OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE');
  });

  it('REG-06-126 · con microciclos, las sesiones van bajo ellos; mezclar las dos formas en un bloque es TRAINING_PLAN_STRUCTURE_INVALID', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `plan-${++contador}`);
    const b = await crearBorradorDeEntrenamiento(app, c);
    const sesion = { label: 'A', prescriptions: [{ exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [], intensity: null }] };
    const conMicro = await conSesion(app, c.pro.token)
      .patch(plan(b.planId))
      .send({ expectedVersion: b.version, changes: { blocks: [{ label: 'B', microcycles: [{ label: 'Semana 1', purpose: 'Descarga', sessions: [sesion] }] }] } })
      .expect(200);
    expect(conMicro.body.data.blocks[0].microcycles[0]).toMatchObject({ label: 'Semana 1', purpose: 'Descarga', order: 1 });
    const mezcla = await conSesion(app, c.pro.token)
      .patch(plan(b.planId))
      .send({ expectedVersion: conMicro.body.data.version, changes: { blocks: [{ label: 'B', microcycles: [{ label: 'S', sessions: [sesion] }], sessions: [sesion] }] } })
      .expect(422);
    expect(mezcla.body.error.code).toBe('TRAINING_PLAN_STRUCTURE_INVALID');
  });

  it('REG-06-129 · RPE no es criterio de prescripción: INTENSITY_CRITERION_INVALID con su motivo', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `plan-${++contador}`);
    const b = await crearBorradorDeEntrenamiento(app, c);
    const prescripcion = { exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla, sets: [], intensity: { criterion: 'RPE', target: { value: 8 } } };
    const r = await conSesion(app, c.pro.token)
      .patch(plan(b.planId))
      .send({ expectedVersion: b.version, changes: { blocks: [{ label: 'B', sessions: [{ label: 'A', prescriptions: [prescripcion] }] }] } })
      .expect(422);
    expect(r.body.error).toMatchObject({
      code: 'INTENSITY_CRITERION_INVALID',
      details: { issues: [{ code: 'PERCEIVED_EXERTION_AS_CRITERION', path: 'blocks[0].sessions[0].prescriptions[0].intensity.criterion' }] },
    });
  });

  it('09v10:752 · una referencia a un ejercicio que no existe o no es del ámbito es EXERCISE_REFERENCE_INVALID', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `plan-${++contador}`);
    const otro = await prepararProfesional(app, `plan-otro-${contador}`, ['ENTRENAMIENTO']);
    const ajeno = await conSesion(app, otro.token).post('/api/v1/training/exercises').send({ name: 'Ajeno', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201);
    const b = await crearBorradorDeEntrenamiento(app, c);
    for (const exerciseVersionId of [randomUUID(), ajeno.body.data.versionId as string]) {
      const r = await conSesion(app, c.pro.token)
        .patch(plan(b.planId))
        .send({ expectedVersion: b.version, changes: { blocks: [{ label: 'B', sessions: [{ label: 'A', prescriptions: [{ exerciseVersionId, sets: [], intensity: null }] }] }] } })
        .expect(422);
      expect(r.body.error.code).toBe('EXERCISE_REFERENCE_INVALID');
    }
  });

  it('09v10:749 · editar con una versión vieja es VERSION_CONFLICT', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `plan-${++contador}`);
    const b = await crearBorradorDeEntrenamiento(app, c);
    await conSesion(app, c.pro.token).patch(plan(b.planId)).send({ expectedVersion: b.version, changes: estructuraDeEntrenamiento() }).expect(200);
    const r = await conSesion(app, c.pro.token).patch(plan(b.planId)).send({ expectedVersion: b.version, changes: estructuraDeEntrenamiento() }).expect(409);
    expect(r.body.error.code).toBe('VERSION_CONFLICT');
  });

  it('09v10:683 · el asesorado no ve el borrador: el mismo 404 que lo inexistente', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `plan-${++contador}`);
    const b = await crearBorradorDeEntrenamiento(app, c);
    const borrador = await conSesion(app, c.ase.token).get(plan(b.planId)).expect(404);
    const inexistente = await conSesion(app, c.ase.token).get(plan(randomUUID())).expect(404);
    expect(borrador.body).toEqual(inexistente.body);
  });
});

describe('UC-P16 · validar y activar (RF-041; API-TRN-11 y 12)', () => {
  it('06:4330 · validar no es un estado: informa lo que falta con 200, y el borrador sigue DRAFT en la misma versión', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `act-${++contador}`);
    const pro = conSesion(app, c.pro.token);
    const vacio = await pro.post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId }).expect(201);
    const v = await pro.post(`${plan(vacio.body.data.planId)}/validate`).send({ expectedVersion: vacio.body.data.version }).expect(200);
    expect(v.body.data).toEqual({ valid: false, version: vacio.body.data.version, issues: [{ code: 'BLOCK_REQUIRED', path: 'blocks' }] });
    const despues = await pro.get(plan(vacio.body.data.planId)).expect(200);
    expect(despues.body.data).toMatchObject({ state: 'DRAFT', version: vacio.body.data.version });
  });

  it('REG-06-128 · validar no exige criterio de intensidad: una prescripción sin criterio es legítima', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `act-${++contador}`);
    const b = await crearBorradorDeEntrenamiento(app, c);
    const v = await conSesion(app, c.pro.token).post(`${plan(b.planId)}/validate`).send({ expectedVersion: b.version }).expect(200);
    expect(v.body.data).toMatchObject({ valid: true, issues: [] });
  });

  it('TEST-RF-041 · activar abre un Proceso de ENTRENAMIENTO, congela la instantánea y deja la versión efectiva', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `act-${++contador}`);
    const b = await crearBorradorDeEntrenamiento(app, c);
    const act = await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
    expect(act.body.data).toMatchObject({ planId: b.planId, state: 'ACTIVATED', processOpened: true, supersededPlanId: null });
    expect(act.body.data.snapshotDigest).toMatch(/^[0-9a-f]{64}$/);
    const proceso = await prisma.procesoOperativo.findUniqueOrThrow({ where: { id: act.body.data.processId } });
    expect(proceso).toMatchObject({ alcance: 'ENTRENAMIENTO', estado: 'ABIERTO', versionDeAperturaEntrenamientoId: b.planId, versionDeAperturaId: null });
    const leido = await conSesion(app, c.pro.token).get(plan(b.planId)).expect(200);
    expect(leido.body.data).toMatchObject({ state: 'ACTIVATED', isEffective: true, snapshotDigest: act.body.data.snapshotDigest });
  });

  it('DV-05 adversarial 8, variante de entrenamiento · un plan activado no se edita: PLAN_NOT_EDITABLE, y nada cambió', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `adv8-${++contador}`);
    const antes = await conSesion(app, c.pro.token).get(plan(c.planId)).expect(200);
    const r = await conSesion(app, c.pro.token).patch(plan(c.planId)).send({ expectedVersion: antes.body.data.version, changes: { blocks: [] } }).expect(422);
    expect(r.body.error.code).toBe('PLAN_NOT_EDITABLE');
    const despues = await conSesion(app, c.pro.token).get(plan(c.planId)).expect(200);
    expect(despues.body.data).toEqual(antes.body.data);
  });

  it('09v10:1592 · un cambio posterior del catálogo no altera la instantánea activada', async () => {
    const pro = await prepararProfesional(app, `snap-${++contador}`, ['ENTRENAMIENTO']);
    // Un ejercicio propio, para que la sucesora de catálogo no toque el sembrado que usan las demás pruebas.
    const propio = await conSesion(app, pro.token).post('/api/v1/training/exercises').send({ name: 'Remo sintético', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201);
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `snap-${contador}`, pro);
    const estructura = { blocks: [{ label: 'B', sessions: [{ label: 'A', prescriptions: [{ exerciseVersionId: propio.body.data.versionId, sets: [{ repetitions: { value: 10 } }], intensity: null }] }] }] };
    const b = await crearBorradorDeEntrenamiento(app, c, { initialStructure: estructura });
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
    const antes = await conSesion(app, c.pro.token).get(plan(b.planId)).expect(200);
    // Una sucesora del ejercicio con otro nombre, como la dejaría un cambio de catálogo. No hay operación P0 para
    // renombrar, así que se escribe directo: lo que se prueba es que la lectura del plan activado no la mira.
    await prisma.versionDeEjercicio.create({ data: { ejercicioId: propio.body.data.exerciseId, predecesoraId: propio.body.data.versionId, nombre: 'Remo renombrado', procedencia: {} } });
    const despues = await conSesion(app, c.pro.token).get(plan(b.planId)).expect(200);
    expect(despues.body.data.blocks).toEqual(antes.body.data.blocks);
    expect(despues.body.data.blocks[0].sessions[0].prescriptions[0].exerciseName).toBe('Remo sintético');
  });

  it('el asesorado ve la versión activada, desde la instantánea', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `ase-${++contador}`);
    const r = await conSesion(app, c.ase.token).get(plan(c.planId)).expect(200);
    expect(r.body.data).toMatchObject({ state: 'ACTIVATED', isEffective: true });
  });

  it('DL-047 · la sucesora parte de la instantánea con los mismos identificadores, y activarla es continuidad: no abre otro Proceso', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `suc-${++contador}`);
    const r = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }).expect(201);
    expect(r.body.data.predecessorPlanId).toBe(c.planId);
    const ids = (d: { blocks: { sessions: { sessionId: string }[] }[] }) => d.blocks.flatMap((b) => b.sessions.map((s) => s.sessionId));
    expect(ids(r.body.data)).toEqual(['ses-a', 'ses-b']);
    const act = await activarPlanDeEntrenamiento(app, c.pro, r.body.data.planId, r.body.data.version).expect(200);
    expect(act.body.data).toMatchObject({ processOpened: false, supersededPlanId: c.planId, processId: c.activacion.processId });
    const anterior = await conSesion(app, c.pro.token).get(plan(c.planId)).expect(200);
    expect(anterior.body.data).toMatchObject({ state: 'ACTIVATED', isEffective: false });
  });

  it('RF-041 · sin vigencias contradictorias: otro profesional con un seguimiento de entrenamiento abierto es ACTIVE_PLAN_CONFLICT', async () => {
    const primero = await circuitoConPlanDeEntrenamientoActivo(app, `conf-${++contador}`);
    const otro = await prepararProfesional(app, `conf-otro-${contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otro, primero.ase, 'ENTRENAMIENTO');
    const ev = await conSesion(app, otro.token).post(evaluaciones(primero.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    const ob = await conSesion(app, otro.token).post(objetivos(primero.ase.id)).send(cuerpoDeObjetivoDeEntrenamiento(ev.body.data.evaluationId)).expect(201);
    const b = await conSesion(app, otro.token)
      .post(`/api/v1/advisees/${primero.ase.id}/training/plans`)
      .send({ objectiveVersionId: ob.body.data.versionId, initialStructure: estructuraDeEntrenamiento() })
      .expect(201);
    const r = await activarPlanDeEntrenamiento(app, otro, b.body.data.planId, b.body.data.version).expect(409);
    expect(r.body.error.code).toBe('ACTIVE_PLAN_CONFLICT');
  });

  it('REG-06-91/93 · con la capacidad ocupada, activar para otro asesorado se rechaza y no cambia nada', async () => {
    const pro = await prepararProfesional(app, `cap-${++contador}`, ['ENTRENAMIENTO']);
    await prisma.$transaction((tx) =>
      app.get(ProcesoService).configurarCapacidad(tx, {
        profesionalId: pro.id,
        capacidad: { modo: 'LIMITADA', limite: 1 },
        actorServicio: 'PRUEBA',
        procedencia: { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'CAPACIDAD', superficie: null, requestId: null },
      }),
    );
    await circuitoConPlanDeEntrenamientoActivo(app, `cap-1-${contador}`, pro);
    const segundo = await circuitoListoParaPlanificarEntrenamiento(app, `cap-2-${contador}`, pro);
    const b = await crearBorradorDeEntrenamiento(app, segundo);
    const r = await activarPlanDeEntrenamiento(app, pro, b.planId, b.version).expect(422);
    expect(r.body.error.code).toBe('CAPACITY_NOT_AVAILABLE');
    const despues = await conSesion(app, pro.token).get(plan(b.planId)).expect(200);
    expect(despues.body.data).toMatchObject({ state: 'DRAFT', isEffective: false });
    expect(await prisma.procesoOperativo.count({ where: { asesoradoId: segundo.ase.id } })).toBe(0);
  });
});

// ─── UC-P17 · Hoy, ocurrencias y registro de ejecución (RF-042, RF-043; API-TRN-14 a 18) ────────

const hoyDe = (token: string) => conSesion(app, token).get('/api/v1/me/training/today');
const borradorDe = (token: string, occurrenceId: string) => conSesion(app, token).put(`/api/v1/training/occurrences/${occurrenceId}/execution-draft`).send({});
const guardar = (token: string, draftId: string, expectedVersion: string, changes: Record<string, unknown>) =>
  conSesion(app, token).patch(`/api/v1/training/execution-drafts/${draftId}`).send({ expectedVersion, changes });
const confirmar = (token: string, draftId: string, expectedVersion: string, clave = claveDeIdempotencia()) =>
  conSesion(app, token).post(`/api/v1/training/execution-drafts/${draftId}/confirm`, clave).send({ expectedVersion });

/** Una serie registrada: carga con unidad, repeticiones y RIR. */
const serie = (setIndex: number, kg = 60, reps = 8, rir: number | null = 2) => ({ setIndex, load: { value: kg, unit: 'kg' }, completedRepetitions: reps, rir, perceivedExertion: null });

describe('UC-P17 · «Hoy» del asesorado (RF-042; API-TRN-14)', () => {
  it('sin plan activado: NO_ACTIVE_PLAN, sin ocurrencias', async () => {
    const c = await circuitoDeEntrenamiento(app, `hoy-${++contador}`);
    const r = await hoyDe(c.ase.token).expect(200);
    expect(r.body.data).toMatchObject({ planState: 'NO_ACTIVE_PLAN', activePlan: null, occurrences: [] });
  });

  it('DL-077 · todas las sesiones del plan son ocurrencias de hoy: BE no elige cuál corresponde; cada una trae sus prescripciones (DL-079)', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `hoy-${++contador}`);
    const r = await hoyDe(c.ase.token).expect(200);
    expect(r.body.data).toMatchObject({ planState: 'AVAILABLE', activePlan: { planId: c.planId, trainingPlanId: c.trainingPlanId, snapshotVersion: c.activacion.snapshotDigest } });
    const ocurrencias = r.body.data.occurrences as { occurrenceId: string; date: string; plannedSession: { sessionId: string; blockLabel: string; prescriptions: { prescriptionId: string }[] }; execution: unknown }[];
    expect(ocurrencias.map((o) => o.plannedSession.sessionId)).toEqual(['ses-a', 'ses-b']);
    expect(ocurrencias[0]?.plannedSession.prescriptions.map((p) => p.prescriptionId)).toEqual(['rx-banca', 'rx-sentadilla']);
    expect(ocurrencias[0]?.plannedSession.blockLabel).toBe('Bloque 1');
    expect(ocurrencias.every((o) => o.date === r.body.data.date)).toBe(true);
    expect(ocurrencias[0]?.execution).toEqual({ state: 'NOT_STARTED', draftId: null, executionId: null, sessionCondition: null });
  });

  it('H-09-TRN-01 · sin registro no es «no realizada»: la ocurrencia sigue NOT_STARTED y ninguna condición aparece sola', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `hoy-${++contador}`);
    const r = await hoyDe(c.ase.token).expect(200);
    for (const o of r.body.data.occurrences) {
      expect(o.execution.state).toBe('NOT_STARTED');
      expect(o.execution.sessionCondition).toBeNull();
    }
    expect(JSON.stringify(r.body)).not.toContain('NOT_COMPLETED');
  });

  it('UC-P12 E06 · con el consentimiento revocado, hay plan pero el acceso está suspendido: NOT_AVAILABLE', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `hoy-${++contador}`);
    await revocarB2(app, c.ase, c.consentId).expect(200);
    const r = await hoyDe(c.ase.token).expect(200);
    expect(r.body.data).toMatchObject({ planState: 'NOT_AVAILABLE', activePlan: null, occurrences: [] });
  });
});

describe('DL-078 · ocurrencias por período, para registrar en diferido (API-TRN-14-PERIODO)', () => {
  it('lista las ocurrencias de los días en que el plan regía, y no inventa días anteriores a la activación', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `per-${++contador}`);
    const hoy = (await hoyDe(c.ase.token).expect(200)).body.data.date as string;
    const anteayer = new Date(new Date(`${hoy}T00:00:00.000Z`).getTime() - 2 * 86_400_000).toISOString().slice(0, 10);
    const r = await conSesion(app, c.ase.token).get(`/api/v1/me/training/occurrences?periodStart=${anteayer}&periodEnd=${hoy}`).expect(200);
    // El plan se activó hoy: los días anteriores no tienen ocurrencias.
    expect(new Set(r.body.data.occurrences.map((o: { date: string }) => o.date))).toEqual(new Set([hoy]));
    expect(r.body.data).toMatchObject({ planState: 'AVAILABLE', period: { start: anteayer, end: hoy } });
  });

  it('el período no llega al futuro ni pasa de 31 días', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `per-${++contador}`);
    const hoy = (await hoyDe(c.ase.token).expect(200)).body.data.date as string;
    const manana = new Date(new Date(`${hoy}T00:00:00.000Z`).getTime() + 86_400_000).toISOString().slice(0, 10);
    const hace40 = new Date(new Date(`${hoy}T00:00:00.000Z`).getTime() - 40 * 86_400_000).toISOString().slice(0, 10);
    await conSesion(app, c.ase.token).get(`/api/v1/me/training/occurrences?periodStart=${hoy}&periodEnd=${manana}`).expect(400);
    await conSesion(app, c.ase.token).get(`/api/v1/me/training/occurrences?periodStart=${hace40}&periodEnd=${hoy}`).expect(400);
    await conSesion(app, c.ase.token).get('/api/v1/me/training/occurrences').expect(400);
  });
});

describe('UC-P17 · borrador de ejecución y confirmación (RF-043; API-TRN-15 a 18)', () => {
  it('S10-TRN-01 · «Comenzar» dos veces da el mismo borrador: 201 y después 200', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `bor-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const primero = await borradorDe(c.ase.token, a.occurrenceId).expect(201);
    const segundo = await borradorDe(c.ase.token, a.occurrenceId).expect(200);
    expect(segundo.body.data.draftId).toBe(primero.body.data.draftId);
    expect(primero.body.data).toMatchObject({ state: 'DRAFT', occurrenceId: a.occurrenceId, granularity: null, sessionCondition: null, exercises: [] });
    const despues = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences[0];
    expect(despues.execution).toMatchObject({ state: 'DRAFT_IN_PROGRESS', draftId: primero.body.data.draftId });
  });

  it('S10-TRN-01 · diez «Comenzar» simultáneos dejan un solo borrador', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `bor-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const r = await Promise.all(Array.from({ length: 10 }, () => borradorDe(c.ase.token, a.occurrenceId)));
    expect(new Set(r.map((x) => x.body.data.draftId)).size).toBe(1);
    expect(r.filter((x) => x.status === 201)).toHaveLength(1);
    expect(await prisma.borradorDeEjecucionDeEntrenamiento.count({ where: { asesoradoId: c.ase.id } })).toBe(1);
  });

  it('CAND-10-TRN-09 · registro incremental por serie, y confirmar crea la ejecución como recurso nuevo', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `bor-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    const v2 = (await guardar(c.ase.token, b.draftId, b.version, { granularity: 'SET', exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1)] }] }).expect(200)).body.data;
    const v3 = (await guardar(c.ase.token, b.draftId, v2.version, { exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1), serie(2, 60, 7, 1)] }], sessionCondition: 'COMPLETED' }).expect(200)).body.data;
    expect(v3.exercises[0].sets).toHaveLength(2);
    const conf = await confirmar(c.ase.token, b.draftId, v3.version).expect(201);
    expect(conf.body.data).toMatchObject({ state: 'REGISTERED' });
    expect(conf.body.data.executionId).not.toBe(b.draftId);
    const x = await conSesion(app, c.ase.token).get(`/api/v1/training/executions/${conf.body.data.executionId}`).expect(200);
    expect(x.body.data).toMatchObject({ state: 'REGISTERED', original: { granularity: 'SET', sessionCondition: 'COMPLETED' }, corrections: [], effectiveView: { kind: 'ORIGINAL' } });
    expect(x.body.data.plannedSession.sessionId).toBe('ses-a');
  });

  it('REG-06-130 · la sustitución conserva lo prescripto y lo realizado, y no es un error; el plan no cambia (S10-TRN-04)', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `sus-${++contador}`);
    const planAntes = await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${c.planId}`).expect(200);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    const v = (
      await guardar(c.ase.token, b.draftId, b.version, {
        granularity: 'SET',
        sessionCondition: 'COMPLETED',
        exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressConMancuernas, sets: [serie(1, 22)] }],
      }).expect(200)
    ).body.data;
    expect(v.exercises[0]).toMatchObject({ prescribedExerciseName: 'Press de banca', performedExerciseName: 'Press con mancuernas', substituted: true });
    await confirmar(c.ase.token, b.draftId, v.version).expect(201);
    const planDespues = await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${c.planId}`).expect(200);
    expect(planDespues.body.data).toEqual(planAntes.body.data);
  });

  it('REG-06-131/132 · «No pude realizarla» se confirma sin granularidad, con motivo opcional, y es una condición registrada', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `nr-${++contador}`);
    const [, bOcu] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, bOcu.occurrenceId).expect(201)).body.data;
    const v = (await guardar(c.ase.token, b.draftId, b.version, { sessionCondition: 'NOT_COMPLETED' }).expect(200)).body.data;
    const conf = await confirmar(c.ase.token, b.draftId, v.version).expect(201);
    const x = await conSesion(app, c.ase.token).get(`/api/v1/training/executions/${conf.body.data.executionId}`).expect(200);
    expect(x.body.data.original).toMatchObject({ granularity: null, sessionCondition: 'NOT_COMPLETED', reason: null, exercises: [] });
    const hoy = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences[1];
    expect(hoy.execution).toMatchObject({ state: 'REGISTERED', sessionCondition: 'NOT_COMPLETED' });
  });

  it('09v10:1101 · el registro agregado no produce series: con resumen alcanza, y las series quedan nulas', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `agr-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    const v = (
      await guardar(c.ase.token, b.draftId, b.version, {
        granularity: 'EXERCISE_OR_SESSION',
        sessionCondition: 'COMPLETED_WITH_DEVIATION',
        reason: 'Hice menos series por falta de tiempo.',
        exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, executionSummary: { description: 'Dos series de ocho.' } }],
      }).expect(200)
    ).body.data;
    const conf = await confirmar(c.ase.token, b.draftId, v.version).expect(201);
    const x = await conSesion(app, c.ase.token).get(`/api/v1/training/executions/${conf.body.data.executionId}`).expect(200);
    expect(x.body.data.original.exercises[0]).toMatchObject({ sets: null, executionSummary: { description: 'Dos series de ocho.' } });
  });

  it('las series no van en un registro agregado: EXECUTION_GRANULARITY_INVALID', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `gi-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    const r = await guardar(c.ase.token, b.draftId, b.version, {
      granularity: 'EXERCISE_OR_SESSION',
      exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1)] }],
    }).expect(422);
    expect(r.body.error.code).toBe('EXECUTION_GRANULARITY_INVALID');
  });

  it('09v10:1538 · una condición fuera de las tres es SESSION_CONDITION_INVALID, y una prescripción ajena a la sesión es EXECUTION_VALUE_INVALID', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `ci-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    expect((await guardar(c.ase.token, b.draftId, b.version, { sessionCondition: 'SKIPPED' }).expect(422)).body.error.code).toBe('SESSION_CONDITION_INVALID');
    const r = await guardar(c.ase.token, b.draftId, b.version, {
      granularity: 'SET',
      exercises: [{ prescriptionId: 'rx-dominadas', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.dominadas, sets: [serie(1, 0, 6)] }],
    }).expect(422);
    expect(r.body.error).toMatchObject({ code: 'EXECUTION_VALUE_INVALID', details: { issues: [{ code: 'PRESCRIPTION_NOT_IN_SESSION', path: 'changes.exercises[0].prescriptionId' }] } });
  });

  it('09v10:1161 · confirmar sin condición no se puede: EXECUTION_DRAFT_NOT_READY', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `nl-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    const r = await confirmar(c.ase.token, b.draftId, b.version).expect(422);
    expect(r.body.error).toMatchObject({ code: 'EXECUTION_DRAFT_NOT_READY', details: { issues: [{ code: 'SESSION_CONDITION_REQUIRED', path: 'sessionCondition' }] } });
  });

  it('REG-06-115 · un reintento de confirmar no duplica; otra confirmación de la misma ocurrencia es EXECUTION_ALREADY_REGISTERED', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `dup-${++contador}`);
    const [, bOcu] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, bOcu.occurrenceId).expect(201)).body.data;
    const v = (await guardar(c.ase.token, b.draftId, b.version, { sessionCondition: 'NOT_COMPLETED' }).expect(200)).body.data;
    const clave = claveDeIdempotencia();
    const uno = await confirmar(c.ase.token, b.draftId, v.version, clave).expect(201);
    const reintento = await confirmar(c.ase.token, b.draftId, v.version, clave);
    expect(reintento.body.data.executionId).toBe(uno.body.data.executionId);
    const otra = await confirmar(c.ase.token, b.draftId, v.version).expect(409);
    expect(otra.body.error.code).toBe('EXECUTION_ALREADY_REGISTERED');
    expect(await prisma.ejecucionDeEntrenamiento.count({ where: { asesoradoId: c.ase.id } })).toBe(1);
  });

  it('06:5221 · confirmado, el borrador no se edita: la vuelta a borrador no existe', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `vuelta-${++contador}`);
    const [, bOcu] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, bOcu.occurrenceId).expect(201)).body.data;
    const v = (await guardar(c.ase.token, b.draftId, b.version, { sessionCondition: 'NOT_COMPLETED' }).expect(200)).body.data;
    await confirmar(c.ase.token, b.draftId, v.version).expect(201);
    const r = await guardar(c.ase.token, b.draftId, v.version, { sessionCondition: 'COMPLETED' }).expect(422);
    expect(r.body.error.code).toBe('INVALID_STATE_TRANSITION');
    // Y abrir el borrador de esa ocurrencia devuelve el mismo, ya registrado, con su ejecución.
    const otra = await borradorDe(c.ase.token, bOcu.occurrenceId).expect(200);
    expect(otra.body.data).toMatchObject({ draftId: b.draftId, state: 'REGISTERED' });
    expect(otra.body.data.executionId).toBeTruthy();
  });

  it('09v10:980 · el borrador no es evidencia: el profesional no lo ve', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `ev-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    await conSesion(app, c.ase.token).get(`/api/v1/training/execution-drafts/${b.draftId}`).expect(200);
    await conSesion(app, c.pro.token).get(`/api/v1/training/execution-drafts/${b.draftId}`).expect(404);
  });

  it('DL-077 · un occurrenceId ajeno, alterado o de otro asesorado es el mismo 404', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `occ-${++contador}`);
    const otro = await circuitoConPlanDeEntrenamientoActivo(app, `occ-otro-${contador}`);
    const [ajena] = (await hoyDe(otro.ase.token).expect(200)).body.data.occurrences;
    const r1 = await borradorDe(c.ase.token, ajena.occurrenceId).expect(404);
    const r2 = await borradorDe(c.ase.token, 'occ_no-es-una-ocurrencia').expect(404);
    expect(r1.body).toEqual(r2.body);
  });

  it('DL-088 · en diferido, el horario declarado tiene que caer en el día de la sesión', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `hora-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    const ayer = new Date(Date.now() - 36 * 3_600_000).toISOString();
    const r = await guardar(c.ase.token, b.draftId, b.version, { occurredAt: ayer }).expect(422);
    expect(r.body.error.details.issues[0].code).toBe('OCCURRED_AT_OUTSIDE_OCCURRENCE_DATE');
  });
});

describe('UC-E02 · corrección trazable (RF-044; API-TRN-19 y 20)', () => {
  async function registrada(etiqueta: string) {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `${etiqueta}-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    const v = (
      await guardar(c.ase.token, b.draftId, b.version, {
        granularity: 'SET',
        sessionCondition: 'COMPLETED',
        exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 80)] }],
      }).expect(200)
    ).body.data;
    const conf = await confirmar(c.ase.token, b.draftId, v.version).expect(201);
    return { ...c, executionId: conf.body.data.executionId as string };
  }
  const correccion = (kg: number) => ({
    reason: 'Cargué mal la carga.',
    correction: {
      granularity: 'SET',
      sessionCondition: 'COMPLETED',
      reason: null,
      exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, kg)] }],
      sessionSummary: null,
    },
  });

  it('S10-TRN-05 · corregir no sobrescribe: el original queda, la corrección es la vista efectiva, y la autoría es la real', async () => {
    const x = await registrada('cor');
    const r = await conSesion(app, x.ase.token).post(`/api/v1/training/executions/${x.executionId}/corrections`).send(correccion(60)).expect(201);
    expect(r.body.data.original.exercises[0].sets[0].load).toEqual({ value: 80, unit: 'kg' });
    expect(r.body.data.corrections).toHaveLength(1);
    expect(r.body.data.corrections[0]).toMatchObject({ reason: 'Cargué mal la carga.', authorRole: 'ADVISEE', author: { identityId: x.ase.id } });
    expect(r.body.data.effectiveView).toEqual({ kind: 'CORRECTED', correctionId: r.body.data.corrections[0].correctionId });
  });

  it('DL-076 · el profesional también corrige, y su corrección no se le atribuye al asesorado; la cadena sigue lineal', async () => {
    const x = await registrada('corpro');
    await conSesion(app, x.ase.token).post(`/api/v1/training/executions/${x.executionId}/corrections`).send(correccion(60)).expect(201);
    const r = await conSesion(app, x.pro.token).post(`/api/v1/training/executions/${x.executionId}/corrections`).send(correccion(65)).expect(201);
    const [primera, segunda] = r.body.data.corrections;
    expect(segunda).toMatchObject({ authorRole: 'PROFESSIONAL', author: { identityId: x.pro.id }, previousCorrectionId: primera.correctionId });
    expect(r.body.data.effectiveView).toEqual({ kind: 'CORRECTED', correctionId: segunda.correctionId });
  });

  it('otro profesional no ve ni corrige la ejecución: el mismo 404', async () => {
    const x = await registrada('corajeno');
    const otro = await prepararProfesional(app, `corajeno-otro-${contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otro, x.ase, 'ENTRENAMIENTO');
    await conSesion(app, otro.token).get(`/api/v1/training/executions/${x.executionId}`).expect(404);
    await conSesion(app, otro.token).post(`/api/v1/training/executions/${x.executionId}/corrections`).send(correccion(60)).expect(404);
  });

  it('una corrección exige motivo, y un registro corregido incompleto es EXECUTION_VALUE_INVALID', async () => {
    const x = await registrada('corinc');
    await conSesion(app, x.ase.token).post(`/api/v1/training/executions/${x.executionId}/corrections`).send({ ...correccion(60), reason: '' }).expect(400);
    const r = await conSesion(app, x.ase.token)
      .post(`/api/v1/training/executions/${x.executionId}/corrections`)
      .send({ reason: 'x', correction: { granularity: 'SET', sessionCondition: 'COMPLETED', reason: null, exercises: [], sessionSummary: null } })
      .expect(422);
    expect(r.body.error.code).toBe('EXECUTION_VALUE_INVALID');
  });
});

// ─── UC-P18 · Revisión y continuidad (RF-045, RF-046, RF-056; API-TRN-21 a 24) ──────────────────

const contextoDe = (c: { pro: { token: string }; ase: { id: string } }, q = '') => conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/training/review-context${q}`);
const revisar = (c: { pro: { token: string }; ase: { id: string } }, cuerpo: Record<string, unknown>) => conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/reviews`).send(cuerpo);
const aplicar = (token: string, reviewId: string, clave = claveDeIdempotencia()) => conSesion(app, token).post(`/api/v1/training/reviews/${reviewId}/apply`, clave).send({ expectedVersion: 'v1' });

function cuerpoDeRevisionDeEntrenamiento(fecha: string, evidencia: { type: string; id: string }[], result: string, nextAction: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    period: { start: fecha, end: fecha, timeZone: 'America/Argentina/Buenos_Aires' },
    evidenceReferences: evidencia,
    interpretation: 'Registró la sesión con la carga indicada.',
    result,
    rationale: 'Fundamento sintético del profesional.',
    nextAction: { description: 'Seguir con el bloque actual.', ...nextAction },
  };
}

/** Un circuito con una sesión registrada hoy, para revisar sobre evidencia real. */
async function conSesionRegistrada(etiqueta: string) {
  const c = await circuitoConPlanDeEntrenamientoActivo(app, `${etiqueta}-${++contador}`);
  const hoy = (await hoyDe(c.ase.token).expect(200)).body.data;
  const b = (await borradorDe(c.ase.token, hoy.occurrences[0].occurrenceId).expect(201)).body.data;
  const v = (
    await guardar(c.ase.token, b.draftId, b.version, {
      granularity: 'SET',
      sessionCondition: 'COMPLETED',
      exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 62)] }],
    }).expect(200)
  ).body.data;
  const conf = await confirmar(c.ase.token, b.draftId, v.version).expect(201);
  return { ...c, fecha: hoy.date as string, executionId: conf.body.data.executionId as string, borradorB: hoy.occurrences[1].occurrenceId as string };
}

describe('UC-P18 · contexto de revisión (RF-045; API-TRN-21)', () => {
  it('TEST-RF-045 · reúne objetivo, plan y ejecuciones registradas; los días sin registro son «sin dato»; abrirlo no crea revisión', async () => {
    const c = await conSesionRegistrada('ctx');
    // Un borrador abierto de la otra sesión: no es evidencia y no aparece.
    await borradorDe(c.ase.token, c.borradorB).expect(201);
    const antes = await prisma.revisionDeEntrenamiento.count();
    const r = await contextoDe(c).expect(200);
    expect(await prisma.revisionDeEntrenamiento.count()).toBe(antes);
    expect(r.body.data.objective.versionId).toBe(c.objectiveVersionId);
    expect(r.body.data.activePlanVersions.map((v: { planId: string }) => v.planId)).toEqual([c.planId]);
    expect(r.body.data.registeredExecutions.map((x: { executionId: string }) => x.executionId)).toEqual([c.executionId]);
    expect(r.body.data.missingData).not.toContain(c.fecha);
    expect(r.body.data.missingData).toHaveLength(6);
    expect(r.body.data.process).toMatchObject({ state: 'ABIERTO' });
  });

  it('09v10:1285-1295 · el contexto no calcula volumen, marcas, mapa ni puntaje', async () => {
    const c = await conSesionRegistrada('ctx');
    const texto = JSON.stringify((await contextoDe(c).expect(200)).body).toLowerCase();
    for (const prohibido of ['volume', 'score', 'compliance', 'adherence', 'personalrecord', '"pr"', 'musclemap']) expect(texto).not.toContain(prohibido);
  });
});

describe('UC-P18 · revisión y aplicación (RF-046; API-TRN-22 a 24)', () => {
  it('REG-06-117 · no existe un séptimo resultado: PROGRESS es REVIEW_RESULT_INVALID', async () => {
    const c = await conSesionRegistrada('rev');
    const r = await revisar(c, cuerpoDeRevisionDeEntrenamiento(c.fecha, [{ type: 'EXECUTION', id: c.executionId }], 'PROGRESS')).expect(422);
    expect(r.body.error.code).toBe('REVIEW_RESULT_INVALID');
  });

  it('09v10:1627 · registrar no aplica; aplicar es otro acto, una sola vez', async () => {
    const c = await conSesionRegistrada('rev');
    const rev = await revisar(c, cuerpoDeRevisionDeEntrenamiento(c.fecha, [{ type: 'EXECUTION', id: c.executionId }], 'MAINTAIN', { nextReviewAt: '2030-01-01' })).expect(201);
    expect(rev.body.data.application).toBeNull();
    const ap = await aplicar(c.pro.token, rev.body.data.reviewId).expect(200);
    expect(ap.body.data.application).toMatchObject({ type: 'CONTINUIDAD', processStateAfter: 'ABIERTO', createdPlanId: null });
    const otra = await aplicar(c.pro.token, rev.body.data.reviewId).expect(409);
    expect(otra.body.error.code).toBe('REVIEW_ALREADY_APPLIED');
  });

  it('REG-06-117 · progresar conservando la estructura es ADJUST: aplicar crea el borrador sucesor desde la instantánea, sin tocar la activa', async () => {
    const c = await conSesionRegistrada('adj');
    const activaAntes = await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${c.planId}`).expect(200);
    const rev = await revisar(c, cuerpoDeRevisionDeEntrenamiento(c.fecha, [{ type: 'EXECUTION', id: c.executionId }], 'ADJUST')).expect(201);
    const ap = await aplicar(c.pro.token, rev.body.data.reviewId).expect(200);
    const sucesor = await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${ap.body.data.application.createdPlanId}`).expect(200);
    expect(sucesor.body.data).toMatchObject({ state: 'DRAFT', predecessorPlanId: c.planId });
    expect(sucesor.body.data.blocks).toEqual(activaAntes.body.data.blocks);
    const activaDespues = await conSesion(app, c.pro.token).get(`/api/v1/training/plans/${c.planId}`).expect(200);
    expect(activaDespues.body.data).toEqual(activaAntes.body.data);
  });

  it('09v10:1426-1432 · sin éxito completo no hay evento: ADJUST con un borrador ya abierto no se aplica y no deja rastro de aplicación', async () => {
    const c = await conSesionRegistrada('parcial');
    await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: c.planId }).expect(201);
    const rev = await revisar(c, cuerpoDeRevisionDeEntrenamiento(c.fecha, [{ type: 'EXECUTION', id: c.executionId }], 'ADJUST')).expect(201);
    const r = await aplicar(c.pro.token, rev.body.data.reviewId).expect(422);
    expect(r.body.error.code).toBe('CONTINUITY_ACTION_NOT_APPLICABLE');
    expect(await prisma.eventoDeProceso.count({ where: { revisionDeEntrenamientoId: rev.body.data.reviewId } })).toBe(0);
    expect(await prisma.aplicacionDeRevisionDeEntrenamiento.count({ where: { revisionId: rev.body.data.reviewId } })).toBe(0);
  });

  it('CHANGE_OBJECTIVE emite la versión nueva del objetivo al aplicar', async () => {
    const c = await conSesionRegistrada('obj');
    const objetivo = { evaluationId: c.evaluationId, effectiveFrom: new Date().toISOString(), effectiveUntil: null, objective: { statement: 'Nuevo enunciado.' }, rationale: 'Fundamento.' };
    const rev = await revisar(c, cuerpoDeRevisionDeEntrenamiento(c.fecha, [{ type: 'EXECUTION', id: c.executionId }], 'CHANGE_OBJECTIVE', { objective: objetivo })).expect(201);
    const ap = await aplicar(c.pro.token, rev.body.data.reviewId).expect(200);
    const efectivo = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/training/objectives/effective`).expect(200);
    expect(efectivo.body.data.objective).toMatchObject({ versionId: ap.body.data.application.createdObjectiveVersionId, objective: { statement: 'Nuevo enunciado.' } });
  });

  it('FINALIZE cierra el seguimiento: el asesorado se queda sin plan vigente y no se registra más', async () => {
    const c = await conSesionRegistrada('fin');
    const rev = await revisar(c, cuerpoDeRevisionDeEntrenamiento(c.fecha, [{ type: 'EXECUTION', id: c.executionId }], 'FINALIZE', { description: 'Cierre del seguimiento.' })).expect(201);
    const ap = await aplicar(c.pro.token, rev.body.data.reviewId).expect(200);
    expect(ap.body.data.application).toMatchObject({ type: 'CIERRE_PROCESO', processStateAfter: 'CERRADO' });
    expect((await hoyDe(c.ase.token).expect(200)).body.data.planState).toBe('NO_ACTIVE_PLAN');
    const r = await borradorDe(c.ase.token, c.borradorB).expect(422);
    expect(r.body.error.code).toBe('ACTIVE_PLAN_REQUIRED');
    // Y ya no hay seguimiento abierto para revisar.
    expect((await revisar(c, cuerpoDeRevisionDeEntrenamiento(c.fecha, [{ type: 'EXECUTION', id: c.executionId }], 'MAINTAIN')).expect(422)).body.error.code).toBe('REVIEW_NOT_ALLOWED');
  });

  it('REG-06-141 · la evidencia es reconstruible: una ejecución ajena o un borrador no son evidencia', async () => {
    const c = await conSesionRegistrada('evi');
    const otro = await conSesionRegistrada('evi-otro');
    const borrador = (await borradorDe(c.ase.token, c.borradorB).expect(201)).body.data.draftId as string;
    for (const id of [otro.executionId, borrador]) {
      const r = await revisar(c, cuerpoDeRevisionDeEntrenamiento(c.fecha, [{ type: 'EXECUTION', id }], 'MAINTAIN')).expect(422);
      expect(r.body.error.code).toBe('REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE');
    }
  });

  it('otro profesional no ve ni aplica la revisión: el mismo 404', async () => {
    const c = await conSesionRegistrada('revajena');
    const rev = await revisar(c, cuerpoDeRevisionDeEntrenamiento(c.fecha, [{ type: 'EXECUTION', id: c.executionId }], 'MAINTAIN')).expect(201);
    const otro = await prepararProfesional(app, `revajena-otro-${contador}`, ['ENTRENAMIENTO']);
    await vinculoCompleto(app, otro, c.ase, 'ENTRENAMIENTO');
    await conSesion(app, otro.token).get(`/api/v1/training/reviews/${rev.body.data.reviewId}`).expect(404);
    await aplicar(otro.token, rev.body.data.reviewId).expect(404);
  });
});

// ─── E2E-05 · el circuito completo, con el asesorado en la APK (11A:684) ────────────────────────

describe('E2E-05 · entrenamiento: plan → ejecución en la APK → revisión (11A:684)', () => {
  it('evaluar, fijar objetivo, planificar, activar, registrar desde la APK, corregir, revisar, aplicar y continuar', async () => {
    const pro = await prepararProfesional(app, `e2e05-${++contador}`, ['ENTRENAMIENTO']);
    const aseApk = await prepararAsesorado(app, `e2e05-${contador}`, { a3: true, superficie: 'APK' });
    await vinculoCompleto(app, pro, aseApk, 'ENTRENAMIENTO');
    const p = conSesion(app, pro.token);
    // El asesorado opera desde la APK: cada pedido declara la superficie, que queda en la procedencia.
    const apk = {
      get: (ruta: string) => conSesion(app, aseApk.token).get(ruta).set('X-BE-Surface', 'APK'),
      put: (ruta: string) => conSesion(app, aseApk.token).put(ruta).set('X-BE-Surface', 'APK'),
      patch: (ruta: string) => conSesion(app, aseApk.token).patch(ruta).set('X-BE-Surface', 'APK'),
      post: (ruta: string) => conSesion(app, aseApk.token).post(ruta).set('X-BE-Surface', 'APK'),
    };

    // UC-P14: evaluación con fuentes y objetivo con fundamento.
    const ev = await p.post(`/api/v1/advisees/${aseApk.id}/training/evaluations`).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    const ob = await p.post(`/api/v1/advisees/${aseApk.id}/training/objectives`).send(cuerpoDeObjetivoDeEntrenamiento(ev.body.data.evaluationId)).expect(201);

    // UC-P15 y UC-P16: el borrador no es vigente, validar no activa, activar abre el Proceso de ENTRENAMIENTO.
    const b = await p.post(`/api/v1/advisees/${aseApk.id}/training/plans`).send({ objectiveVersionId: ob.body.data.versionId, initialStructure: estructuraDeEntrenamiento() }).expect(201);
    expect((await apk.get('/api/v1/me/training/today').expect(200)).body.data.planState).toBe('NO_ACTIVE_PLAN');
    expect((await p.post(`/api/v1/training/plans/${b.body.data.planId}/validate`).send({ expectedVersion: b.body.data.version }).expect(200)).body.data.valid).toBe(true);
    const act = await activarPlanDeEntrenamiento(app, pro, b.body.data.planId, b.body.data.version).expect(200);
    expect(act.body.data).toMatchObject({ processOpened: true });

    // UC-P17 en la APK: «Hoy» trae las dos sesiones sin registro, sin ninguna condición inferida.
    const hoy = (await apk.get('/api/v1/me/training/today').expect(200)).body.data;
    expect(hoy.occurrences.map((o: { execution: { state: string } }) => o.execution.state)).toEqual(['NOT_STARTED', 'NOT_STARTED']);
    const [a, bOcu] = hoy.occurrences;

    // Sesión A: series de press de banca, sentadilla sustituida por press con mancuernas, realizada con desvío.
    const borradorA = (await apk.put(`/api/v1/training/occurrences/${a.occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
    const v1 = (
      await apk
        .patch(`/api/v1/training/execution-drafts/${borradorA.draftId}`)
        .send({
          expectedVersion: borradorA.version,
          changes: { granularity: 'SET', exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 60, 8, 2)] }] },
        })
        .expect(200)
    ).body.data;
    const v2 = (
      await apk
        .patch(`/api/v1/training/execution-drafts/${borradorA.draftId}`)
        .send({
          expectedVersion: v1.version,
          changes: {
            exercises: [
              { prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 60, 8, 2), serie(2, 60, 7, 1)] },
              { prescriptionId: 'rx-sentadilla', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressConMancuernas, sets: [serie(1, 20, 10, null)] },
            ],
            sessionCondition: 'COMPLETED_WITH_DEVIATION',
            reason: 'Me molestaba la rodilla.',
          },
        })
        .expect(200)
    ).body.data;
    expect(v2.exercises[1]).toMatchObject({ prescribedExerciseName: 'Sentadilla', performedExerciseName: 'Press con mancuernas', substituted: true });
    const regA = await apk.post(`/api/v1/training/execution-drafts/${borradorA.draftId}/confirm`).set('Idempotency-Key', claveDeIdempotencia()).send({ expectedVersion: v2.version }).expect(201);

    // Sesión B: «No pude realizarla», sin motivo: es un acto registrado, no una ausencia.
    const borradorB = (await apk.put(`/api/v1/training/occurrences/${bOcu.occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
    const vb = (await apk.patch(`/api/v1/training/execution-drafts/${borradorB.draftId}`).send({ expectedVersion: borradorB.version, changes: { sessionCondition: 'NOT_COMPLETED' } }).expect(200)).body.data;
    await apk.post(`/api/v1/training/execution-drafts/${borradorB.draftId}/confirm`).set('Idempotency-Key', claveDeIdempotencia()).send({ expectedVersion: vb.version }).expect(201);
    const trasRegistrar = (await apk.get('/api/v1/me/training/today').expect(200)).body.data.occurrences;
    expect(trasRegistrar.map((o: { execution: { sessionCondition: string } }) => o.execution.sessionCondition)).toEqual(['COMPLETED_WITH_DEVIATION', 'NOT_COMPLETED']);

    // UC-E02: el asesorado corrige la carga de la primera serie; el original queda.
    const corregida = await apk
      .post(`/api/v1/training/executions/${regA.body.data.executionId}/corrections`)
      .set('Idempotency-Key', claveDeIdempotencia())
      .send({
        reason: 'La primera serie fue con 62,5 kg.',
        correction: {
          granularity: 'SET',
          sessionCondition: 'COMPLETED_WITH_DEVIATION',
          reason: 'Me molestaba la rodilla.',
          exercises: [
            { prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 62.5, 8, 2), serie(2, 60, 7, 1)] },
            { prescriptionId: 'rx-sentadilla', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressConMancuernas, sets: [serie(1, 20, 10, null)] },
          ],
          sessionSummary: null,
        },
      })
      .expect(201);
    expect(corregida.body.data.original.exercises[0].sets[0].load.value).toBe(60);
    expect(corregida.body.data.corrections[0].correction.exercises[0].sets[0].load.value).toBe(62.5);

    // La procedencia dice desde dónde se registró (T-06-23): la APK.
    const fila = await prisma.ejecucionDeEntrenamiento.findUniqueOrThrow({ where: { id: regA.body.data.executionId } });
    expect((fila.procedencia as { superficie: string }).superficie).toBe('APK');

    // UC-P18: el profesional ve lo registrado y la corrección, sin borradores ni cálculos; ver no es revisar.
    const ctx = (await p.get(`/api/v1/advisees/${aseApk.id}/training/review-context`).expect(200)).body.data;
    expect(ctx.registeredExecutions).toHaveLength(2);
    expect(ctx.corrections).toHaveLength(1);
    expect(await prisma.revisionDeEntrenamiento.count({ where: { proceso: { asesoradoId: aseApk.id } } })).toBe(0);

    // La progresión conservando la estructura es AJUSTAR: el borrador sucesor nace de la instantánea.
    const rev = await p
      .post(`/api/v1/advisees/${aseApk.id}/training/reviews`)
      .send({
        period: ctx.period,
        evidenceReferences: [{ type: 'EXECUTION', id: regA.body.data.executionId }],
        interpretation: 'Completó el press con una serie menos de lo previsto; la sentadilla se sustituyó por molestia.',
        result: 'ADJUST',
        rationale: 'Se mantiene la estructura; se ajusta la sesión A.',
        nextAction: { description: 'Ajustar la sesión A y reprogramar la sentadilla.', nextReviewAt: '2030-01-01' },
      })
      .expect(201);
    const aplicada = await p.post(`/api/v1/training/reviews/${rev.body.data.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
    const sucesor = (await p.get(`/api/v1/training/plans/${aplicada.body.data.application.createdPlanId}`).expect(200)).body.data;
    const act2 = await activarPlanDeEntrenamiento(app, pro, sucesor.planId, sucesor.version).expect(200);
    expect(act2.body.data).toMatchObject({ processOpened: false, supersededPlanId: b.body.data.planId });

    // La APK ve la versión nueva; lo registrado contra la anterior se conserva, y hoy nadie registró nada nuevo.
    const hoy2 = (await apk.get('/api/v1/me/training/today').expect(200)).body.data;
    expect(hoy2.activePlan.planId).toBe(sucesor.planId);
    const registradaAntes = await apk.get(`/api/v1/training/executions/${regA.body.data.executionId}`).expect(200);
    expect(registradaAntes.body.data.planId).toBe(b.body.data.planId);
  });
});

// ─── Cierre de WP-06 · lo que encontró la auditoría del paquete contra el legajo ─────────────────
// Cuatro revisores independientes (seguridad, contrato, dominio, UX) auditaron el paquete antes de cerrarlo. Cada prueba
// fija un hallazgo que resistió el intento de refutarlo; el detalle está en DEFENSA/WP-06.md §5.

describe('Cierre de WP-06 · seguridad', () => {
  it('09 v0.16.1:220-221 · un reintento con la misma Idempotency-Key vuelve a pasar por el PDP: revocado B2, es el mismo 404', async () => {
    const c = await circuitoDeEntrenamiento(app, `reintento-${++contador}`);
    const p = conSesion(app, c.pro.token);
    const clave = claveDeIdempotencia();
    const cuerpo = cuerpoDeEvaluacionDeEntrenamiento();
    const primera = await p.post(evaluaciones(c.ase.id), clave).send(cuerpo).expect(201);
    // Mientras nada cambió, el reintento se sirve igual, y la re-decisión queda registrada.
    const decisiones = () => prisma.decisionDeAcceso.count({ where: { actorId: c.pro.id, operacion: 'API-TRN-01', resultado: 'PERMITIDA' } });
    const antes = await decisiones();
    const reintento = await p.post(evaluaciones(c.ase.id), clave).send(cuerpo).expect(201);
    expect(reintento.body).toEqual(primera.body);
    expect(await decisiones()).toBe(antes + 1);
    expect(await prisma.evaluacionDeEntrenamiento.count({ where: { asesoradoId: c.ase.id } })).toBe(1);
    // Revocado el consentimiento, el reintento ya no devuelve la respuesta guardada: es el 404 de cualquier otro pedido.
    await revocarB2(app, c.ase, c.consentId).expect(200);
    const trasRevocar = await p.post(evaluaciones(c.ase.id), clave).send(cuerpo).expect(404);
    expect(trasRevocar.body.error.code).toBe('RESOURCE_NOT_FOUND');
    // Con otro cuerpo y la misma clave tampoco hay 409: un recurso no revelable no confirma nada (09:227).
    await p.post(evaluaciones(c.ase.id), clave).send({ ...cuerpo, professionalNotes: 'Otra nota.' }).expect(404);
  });

  it('09:207 · un occurrenceId con forma de UUID que no lo es, o con una fecha que no existe, es 404 y nunca 500', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `occ-${++contador}`);
    const crudo = (texto: string) => `occ_${Buffer.from(texto, 'latin1').toString('base64url')}`;
    await borradorDe(c.ase.token, crudo('------------------------------------.ses-a.2026-09-20')).expect(404);
    await borradorDe(c.ase.token, codificarOcurrencia({ versionDePlanId: c.planId, sesionPlanificadaId: 'ses-a', fechaLocal: '2026-02-30' })).expect(404);
    await borradorDe(c.ase.token, codificarOcurrencia({ versionDePlanId: c.planId, sesionPlanificadaId: 'ses-a', fechaLocal: '2026-00-00' })).expect(404);
  });

  it('09v10:683 · el catálogo manual del profesional no se le abre al asesorado por un borrador, y deja de verse al revocar', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `cat-${++contador}`);
    const nombre = `Remo sintético ${contador}`;
    await conSesion(app, c.pro.token).post('/api/v1/training/exercises').send({ name: nombre, muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201);
    const b = await crearBorradorDeEntrenamiento(app, c);
    // Con un borrador que no ve, el catálogo sigue sin ser para él.
    await conSesion(app, c.ase.token).get('/api/v1/training/exercises').expect(403);
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
    const buscar = async () => (await conSesion(app, c.ase.token).get(`/api/v1/training/exercises?q=${encodeURIComponent(nombre)}`).expect(200)).body.data.map((e: { name: string }) => e.name);
    expect(await buscar()).toEqual([nombre]);
    await revocarB2(app, c.ase, c.consentId).expect(200);
    expect(await buscar()).toEqual([]);
  });
});

describe('Cierre de WP-06 · contrato y dominio', () => {
  async function unaRegistrada(etiqueta: string) {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `${etiqueta}-${++contador}`);
    const hoy = (await hoyDe(c.ase.token).expect(200)).body.data;
    const b = (await borradorDe(c.ase.token, hoy.occurrences[0].occurrenceId).expect(201)).body.data;
    const v = (
      await guardar(c.ase.token, b.draftId, b.version, {
        granularity: 'SET',
        sessionCondition: 'COMPLETED',
        exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 70)] }],
      }).expect(200)
    ).body.data;
    const conf = await confirmar(c.ase.token, b.draftId, v.version).expect(201);
    return { ...c, fecha: hoy.date as string, executionId: conf.body.data.executionId as string };
  }

  it('B10-06:879-884 · una corrección igual a lo que rige no es una corrección: EXECUTION_VALUE_INVALID', async () => {
    const x = await unaRegistrada('sincambio');
    const igual = {
      reason: 'Reviso el registro.',
      correction: {
        granularity: 'SET',
        sessionCondition: 'COMPLETED',
        reason: null,
        exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 70)] }],
        sessionSummary: null,
      },
    };
    const r = await conSesion(app, x.ase.token).post(`/api/v1/training/executions/${x.executionId}/corrections`).send(igual).expect(422);
    expect(r.body.error).toMatchObject({ code: 'EXECUTION_VALUE_INVALID', details: { issues: [{ code: 'CORRECTION_WITHOUT_CHANGES', path: 'correction' }] } });
    expect(await prisma.correccionDeEjecucionDeEntrenamiento.count({ where: { ejecucionId: x.executionId } })).toBe(0);
  });

  it('06:5253 · «Hoy» muestra la condición que rige después de corregir, no la del original', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `vigente-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    const v = (await guardar(c.ase.token, b.draftId, b.version, { sessionCondition: 'NOT_COMPLETED' }).expect(200)).body.data;
    const conf = await confirmar(c.ase.token, b.draftId, v.version).expect(201);
    // Apretó «No pude realizarla» por error: la corrige a realizada, con un resumen de la sesión.
    await conSesion(app, c.ase.token)
      .post(`/api/v1/training/executions/${conf.body.data.executionId}/corrections`)
      .send({ reason: 'Sí la hice.', correction: { granularity: 'EXERCISE_OR_SESSION', sessionCondition: 'COMPLETED', reason: null, exercises: [], sessionSummary: { description: 'La hice completa.' } } })
      .expect(201);
    const despues = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences.find((o: { occurrenceId: string }) => o.occurrenceId === a.occurrenceId);
    expect(despues.execution).toMatchObject({ state: 'REGISTERED', sessionCondition: 'COMPLETED' });
  });

  it('06:5233 · el día que se activa una sucesora, cada sesión aparece una vez y la ya registrada no se registra de nuevo', async () => {
    const x = await unaRegistrada('cambio');
    const p = conSesion(app, x.pro.token);
    const sucesora = (await p.post(`/api/v1/advisees/${x.ase.id}/training/plans`).send({ objectiveVersionId: x.objectiveVersionId, basedOnPlanId: x.planId }).expect(201)).body.data;
    await activarPlanDeEntrenamiento(app, x.pro, sucesora.planId, sucesora.version).expect(200);
    const hoy = (await hoyDe(x.ase.token).expect(200)).body.data.occurrences as { occurrenceId: string; planId: string; plannedSession: { sessionId: string }; execution: { state: string } }[];
    expect(hoy.map((o) => o.plannedSession.sessionId).sort()).toEqual(['ses-a', 'ses-b']);
    expect(hoy.find((o) => o.plannedSession.sessionId === 'ses-a')).toMatchObject({ planId: x.planId, execution: { state: 'REGISTERED' } });
    expect(hoy.find((o) => o.plannedSession.sessionId === 'ses-b')).toMatchObject({ planId: sucesora.planId, execution: { state: 'NOT_STARTED' } });
    // La de la sucesora, pedida a mano, no se abre.
    const otra = codificarOcurrencia({ versionDePlanId: sucesora.planId, sesionPlanificadaId: 'ses-a', fechaLocal: x.fecha });
    const r = await borradorDe(x.ase.token, otra).expect(422);
    expect(r.body.error).toMatchObject({ code: 'OCCURRENCE_NOT_EXECUTABLE', details: { issues: [{ code: 'SESSION_STARTED_IN_OTHER_VERSION' }] } });
    // Y la base tampoco lo deja, aunque el servicio se equivocara.
    const sembrado = borradorDeEjecucion(x, sucesora.planId, { sesion: 'ses-a', fecha: x.fecha });
    await expect(prisma.$executeRawUnsafe(sembrado.sql)).rejects.toThrow(/una sola vez por día/);
  });

  it('06:4351 · el horario declarado cae mientras la versión regía: antes de activarla es OCCURRED_AT_OUTSIDE_PLAN_VERSION', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `vigencia-${++contador}`);
    const hoy = (await hoyDe(c.ase.token).expect(200)).body.data;
    const activada = new Date(c.activacion.activatedAt as string);
    const antes = new Date(activada.getTime() - 60_000);
    // Si la activación fue en el primer minuto del día local, un minuto antes es otro día y la regla que falla es otra.
    const mismoDia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(antes) === hoy.date;
    const b = (await borradorDe(c.ase.token, hoy.occurrences[0].occurrenceId).expect(201)).body.data;
    const r = await guardar(c.ase.token, b.draftId, b.version, { occurredAt: antes.toISOString() }).expect(422);
    expect(r.body.error.details.issues[0].code).toBe(mismoDia ? 'OCCURRED_AT_OUTSIDE_PLAN_VERSION' : 'OCCURRED_AT_OUTSIDE_OCCURRENCE_DATE');
  });

  it('06:4297 · después de FINALIZAR, ninguna versión se presenta como vigente', async () => {
    const x = await unaRegistrada('fin');
    const rev = await revisar(x, cuerpoDeRevisionDeEntrenamiento(x.fecha, [{ type: 'EXECUTION', id: x.executionId }], 'FINALIZE')).expect(201);
    await aplicar(x.pro.token, rev.body.data.reviewId).expect(200);
    const lista = (await conSesion(app, x.pro.token).get(`/api/v1/advisees/${x.ase.id}/training/plans`).expect(200)).body.data;
    expect(lista.map((v: { isEffective: boolean }) => v.isEffective)).toEqual([false]);
    expect((await conSesion(app, x.pro.token).get(`/api/v1/training/plans/${x.planId}`).expect(200)).body.data).toMatchObject({ state: 'ACTIVATED', isEffective: false });
  });

  it('REG-06-142 · una versión de plan que se cita como evidencia es una versión ACTIVADA, no un borrador que después cambia', async () => {
    const x = await unaRegistrada('evid');
    const borrador = (await conSesion(app, x.pro.token).post(`/api/v1/advisees/${x.ase.id}/training/plans`).send({ objectiveVersionId: x.objectiveVersionId, basedOnPlanId: x.planId }).expect(201)).body.data;
    const r = await revisar(x, cuerpoDeRevisionDeEntrenamiento(x.fecha, [{ type: 'PLAN_VERSION', id: borrador.planId }], 'MAINTAIN')).expect(422);
    expect(r.body.error.code).toBe('REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE');
    await revisar(x, cuerpoDeRevisionDeEntrenamiento(x.fecha, [{ type: 'PLAN_VERSION', id: x.planId }], 'MAINTAIN')).expect(201);
  });

  it('06:5972 · una revisión vieja aplicada tarde no resuelve una expectativa que nació después de ella', async () => {
    const x = await unaRegistrada('pend');
    const vieja = (await revisar(x, cuerpoDeRevisionDeEntrenamiento(x.fecha, [{ type: 'EXECUTION', id: x.executionId }], 'MAINTAIN')).expect(201)).body.data;
    // Después de registrar la vieja, se fija una próxima revisión para ayer: queda pendiente.
    const proceso = await prisma.procesoOperativo.findFirstOrThrow({ where: { profesionalId: x.pro.id, asesoradoId: x.ase.id, alcance: 'ENTRENAMIENTO', estado: 'ABIERTO' } });
    const ayer = new Date(new Date(`${x.fecha}T12:00:00Z`).getTime() - 86_400_000).toISOString().slice(0, 10);
    await app.get(PrismaService).$transaction((tx) =>
      app.get(ProcesoService).fijarProximaRevision(tx, {
        procesoId: proceso.id,
        fecha: ayer,
        fuente: { versionDePlanDeEntrenamientoId: x.planId },
        actorId: x.pro.id,
        procedencia: { fuente: 'PROPIA', casoDeUso: 'PRUEBA', operacion: 'SIEMBRA', superficie: null, requestId: null },
        momento: new Date(),
      }),
    );
    const pendiente = async () => (await contextoDe(x).expect(200)).body.data.pendingReview.pending;
    expect(await pendiente()).toBe(true);
    await aplicar(x.pro.token, vieja.reviewId).expect(200);
    expect(await pendiente()).toBe(true);
    const nueva = (await revisar(x, cuerpoDeRevisionDeEntrenamiento(x.fecha, [{ type: 'EXECUTION', id: x.executionId }], 'MAINTAIN')).expect(201)).body.data;
    await aplicar(x.pro.token, nueva.reviewId).expect(200);
    expect(await pendiente()).toBe(false);
  });

  it('09v10:1438 · dos aplicaciones simultáneas de la misma revisión: una aplica, la otra es REVIEW_ALREADY_APPLIED, nunca 500', async () => {
    const x = await unaRegistrada('doble');
    const rev = (await revisar(x, cuerpoDeRevisionDeEntrenamiento(x.fecha, [{ type: 'EXECUTION', id: x.executionId }], 'MAINTAIN')).expect(201)).body.data;
    const r = await Promise.all([aplicar(x.pro.token, rev.reviewId), aplicar(x.pro.token, rev.reviewId)]);
    expect(r.map((y) => y.status).sort()).toEqual([200, 409]);
    expect(r.find((y) => y.status === 409)?.body.error.code).toBe('REVIEW_ALREADY_APPLIED');
    expect(await prisma.aplicacionDeRevisionDeEntrenamiento.count({ where: { revisionId: rev.reviewId } })).toBe(1);
  });

  it('09v10:1441 · CAMBIAR OBJETIVO con una evaluación ajena se rechaza al registrar la revisión, no recién al aplicarla', async () => {
    const x = await unaRegistrada('cobj');
    const r = await revisar(
      x,
      cuerpoDeRevisionDeEntrenamiento(x.fecha, [{ type: 'EXECUTION', id: x.executionId }], 'CHANGE_OBJECTIVE', { objective: cuerpoDeObjetivoDeEntrenamiento(randomUUID()) }),
    ).expect(422);
    expect(r.body.error).toMatchObject({ code: 'REVIEW_COMPONENT_REQUIRED', details: { issues: [{ code: 'EVALUATION_NOT_COMPATIBLE', path: 'nextAction.objective.evaluationId' }] } });
    expect(await prisma.revisionDeEntrenamiento.count({ where: { proceso: { asesoradoId: x.ase.id } } })).toBe(0);
  });

  it('09v10:696 · TRN-08 tiene la vista del asesorado: solo lo activado, nunca el borrador', async () => {
    const x = await unaRegistrada('trn08');
    await conSesion(app, x.pro.token).post(`/api/v1/advisees/${x.ase.id}/training/plans`).send({ objectiveVersionId: x.objectiveVersionId, basedOnPlanId: x.planId }).expect(201);
    const propias = (await conSesion(app, x.ase.token).get(`/api/v1/advisees/${x.ase.id}/training/plans`).expect(200)).body.data;
    expect(propias.map((v: { planId: string; state: string; isEffective: boolean }) => [v.planId, v.state, v.isEffective])).toEqual([[x.planId, 'ACTIVATED', true]]);
    expect((await conSesion(app, x.ase.token).get(`/api/v1/advisees/${x.ase.id}/training/plans?state=DRAFT`).expect(200)).body.data).toEqual([]);
    // Otro asesorado no lista los planes de este.
    const otro = await prepararAsesorado(app, `trn08-otro-${contador}`, { a3: true });
    await conSesion(app, otro.token).get(`/api/v1/advisees/${x.ase.id}/training/plans`).expect(404);
  });

  it('RF-036 · la evaluación guarda su contexto (04:456; 09v10:190), y sin contexto es null', async () => {
    const c = await fresco();
    const con = await conSesion(app, c.pro.token).post(evaluaciones(c.ase.id)).send({ ...cuerpoDeEvaluacionDeEntrenamiento(), context: 'Consulta inicial, previa al bloque.' }).expect(201);
    const leer = (id: string) => conSesion(app, c.pro.token).get(`/api/v1/training/evaluations/${id}`).expect(200);
    expect((await leer(con.body.data.evaluationId)).body.data.context).toBe('Consulta inicial, previa al bloque.');
    const sin = await conSesion(app, c.pro.token).post(evaluaciones(c.ase.id)).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
    expect((await leer(sin.body.data.evaluationId)).body.data.context).toBeNull();
  });
});

describe('DL-089 opción A · revocado el consentimiento, el asesorado conserva su propia historia', () => {
  /** Un circuito con una ejecución ya registrada por el titular. */
  async function conHistoria(etiqueta: string) {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `${etiqueta}-${++contador}`);
    const [a] = (await hoyDe(c.ase.token).expect(200)).body.data.occurrences;
    const b = (await borradorDe(c.ase.token, a.occurrenceId).expect(201)).body.data;
    const v = (
      await guardar(c.ase.token, b.draftId, b.version, {
        granularity: 'SET',
        sessionCondition: 'COMPLETED',
        exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 80)] }],
      }).expect(200)
    ).body.data;
    const conf = await confirmar(c.ase.token, b.draftId, v.version).expect(201);
    return { ...c, executionId: conf.body.data.executionId as string };
  }

  it('08:58 y 08:199 · revocado el B2, el titular sigue leyendo su ejecución registrada y su plan activado; el profesional, no', async () => {
    const x = await conHistoria('dl089-b2');
    await revocarB2(app, x.ase, x.consentId).expect(200);

    // El titular conserva su historia: la ejecución que registró y el plan tal como lo aceptó.
    const eje = await conSesion(app, x.ase.token).get(`/api/v1/training/executions/${x.executionId}`).expect(200);
    expect(eje.body.data.executionId).toBe(x.executionId);
    await conSesion(app, x.ase.token).get(`/api/v1/training/plans/${x.planId}`).expect(200);
    const lista = await conSesion(app, x.ase.token).get(`/api/v1/advisees/${x.ase.id}/training/plans`).expect(200);
    expect(lista.body.data.map((v: { planId: string }) => v.planId)).toContain(x.planId);

    // El profesional deja de ver: el mismo 404 no revelador de siempre (TEST-AUTH-005).
    await conSesion(app, x.pro.token).get(`/api/v1/training/executions/${x.executionId}`).expect(404);
    await conSesion(app, x.pro.token).get(`/api/v1/training/plans/${x.planId}`).expect(404);
  });

  it('UC-P17 E03 · lo que opera sobre el plan vigente sigue bajo el PDP del profesional: «Hoy» es NOT_AVAILABLE y no se puede corregir', async () => {
    const x = await conHistoria('dl089-opera');
    await revocarB2(app, x.ase, x.consentId).expect(200);
    const hoy = await hoyDe(x.ase.token).expect(200);
    expect(hoy.body.data).toMatchObject({ planState: 'NOT_AVAILABLE', activePlan: null, occurrences: [] });
    await conSesion(app, x.ase.token)
      .post(`/api/v1/training/executions/${x.executionId}/corrections`)
      .send({
        reason: 'Cargué mal la carga.',
        correction: {
          granularity: 'SET',
          sessionCondition: 'COMPLETED',
          reason: null,
          exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets: [serie(1, 60)] }],
          sessionSummary: null,
        },
      })
      .expect(404);
  });

  it('08:406 · revocado el A3, se suspende también lo propio: la historia deja de leerse', async () => {
    const x = await conHistoria('dl089-a3');
    const a3 = await a3Vigente(app, x.ase.token);
    await conSesion(app, x.ase.token).post(`/api/v1/me/health-data-consents/${a3}/revoke`).send({}).expect(200);
    await conSesion(app, x.ase.token).get(`/api/v1/training/executions/${x.executionId}`).expect(403);
    await conSesion(app, x.ase.token).get(`/api/v1/training/plans/${x.planId}`).expect(403);
    await conSesion(app, x.ase.token).get(`/api/v1/advisees/${x.ase.id}/training/plans`).expect(403);
  });

  it('DL-057 · conservar la historia propia no abre nada de otro: un borrador ajeno sigue siendo 404', async () => {
    const x = await conHistoria('dl089-ajeno');
    const otro = await prepararAsesorado(app, `dl089-otro-${++contador}`);
    await revocarB2(app, x.ase, x.consentId).expect(200);
    await conSesion(app, otro.token).get(`/api/v1/training/executions/${x.executionId}`).expect(404);
    await conSesion(app, otro.token).get(`/api/v1/training/plans/${x.planId}`).expect(404);
  });
});
