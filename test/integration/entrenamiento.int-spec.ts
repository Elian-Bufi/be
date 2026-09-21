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
import {
  circuitoDeEntrenamiento,
  cuerpoDeEvaluacionDeEntrenamiento,
  cuerpoDeObjetivoDeEntrenamiento,
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
