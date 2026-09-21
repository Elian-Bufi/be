/**
 * WP-06 · el circuito de entrenamiento por la API real, contra PostgreSQL. Cada prueba cita la regla que verifica.
 *
 * Este archivo crece por tramos, como el paquete (docs/paquetes/WP-06.md §9.6). Tramo 1: evaluación y objetivo
 * (UC-P14; API-TRN-01 a 06) y el catálogo propio de ejercicios (RF-037; API-TRN-13 y API-INT-TRN-01).
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto } from './soporte-vinculo';
import { ProcesoService } from '../../apps/api/src/proceso/proceso.service';
import {
  activarPlanDeEntrenamiento,
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
