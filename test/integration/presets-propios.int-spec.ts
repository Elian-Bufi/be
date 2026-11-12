/**
 * ED-13 (WP-EDITORES-PROFESIONAL; DL-167) · Los presets propios nuevos, por la API real y contra PostgreSQL: la
 * prescripción habitual (API-HAB-06 a 08) y el reparto habitual (API-HAN-06 a 08). Lo que fija esta prueba:
 * - guardar, listar, reemplazar por nombre (con `replaces` y su versión), renombrar y quitar;
 * - la prescripción se valida como en un plan y no admite cargas; el reparto va en gramos por día (DJ-7);
 * - lo ve solo su profesional: lo ajeno es 404, y el profesional de otra área no los usa (403).
 */
import type { INestApplication } from '@nestjs/common';
import { ListaDePrescripcionesHabitualesResponseSchema, ListaDeRepartosHabitualesResponseSchema, PrescripcionHabitualResponseSchema, RepartoHabitualResponseSchema } from '@be/domain';
import { appDePrueba, conSesion } from './soporte-api';
import { circuitoDeEntrenamiento } from './soporte-entrenamiento';
import { circuitoListoParaPlanificar } from './soporte-nutricion';

let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
});

/** «Mi fuerza 5×3 · RIR 1»: cinco series de 3 con RIR 1 y 3 minutos de descanso, sin cargas. */
const fuerza = (rir = 1) => ({ sets: Array.from({ length: 5 }, () => ({ repetitions: { value: 3 }, rir })), intensity: { criterion: 'RIR', target: { value: rir } }, restSeconds: 180 });
const reparto = (proteina = 140) => ({ protein: { value: proteina, unit: 'g/day' }, carbohydrate: { value: 250, unit: 'g/day' }, fat: { value: 70, unit: 'g/day' } });

describe('ED-13 · la prescripción habitual (API-HAB-06 a 08)', () => {
  it('guardar, listar, reemplazar por nombre, renombrar y quitar', async () => {
    const c = await circuitoDeEntrenamiento(app, `presets-trn-${++contador}`);
    const pro = conSesion(app, c.pro.token);
    const guardada = PrescripcionHabitualResponseSchema.parse((await pro.post('/api/v1/training/prescription-presets').send({ name: 'Mi fuerza 5×3 · RIR 1', prescription: fuerza() }).expect(201)).body).data;
    expect([guardada.version, guardada.prescription.sets.length, guardada.prescription.restSeconds]).toEqual(['v1', 5, 180]);
    // El mismo nombre, sin señalar a cuál reemplaza: 409; señalándola con su versión, la reemplaza.
    expect((await pro.post('/api/v1/training/prescription-presets').send({ name: 'mi fuerza 5×3 · rir 1', prescription: fuerza(2) })).status).toBe(409);
    const otraVez = await pro.post('/api/v1/training/prescription-presets').send({ name: 'Mi fuerza 5×3 · RIR 1', prescription: fuerza(2), replaces: guardada.presetId, expectedVersion: 'v1' }).expect(201);
    expect([otraVez.body.data.presetId, otraVez.body.data.version, otraVez.body.data.prescription.sets[0].rir]).toEqual([guardada.presetId, 'v2', 2]);
    const lista = ListaDePrescripcionesHabitualesResponseSchema.parse((await pro.get('/api/v1/training/prescription-presets').expect(200)).body).data;
    expect(lista.map((p) => p.name)).toEqual(['Mi fuerza 5×3 · RIR 1']);
    const renombrada = await pro.patch(`/api/v1/training/prescription-presets/${guardada.presetId}`).send({ expectedVersion: 'v2', name: 'Fuerza 5×3' }).expect(200);
    expect([renombrada.body.data.name, renombrada.body.data.version]).toEqual(['Fuerza 5×3', 'v3']);
    expect((await pro.patch(`/api/v1/training/prescription-presets/${guardada.presetId}`).send({ expectedVersion: 'v2', state: 'REMOVED' })).status).toBe(409);
    await pro.patch(`/api/v1/training/prescription-presets/${guardada.presetId}`).send({ expectedVersion: 'v3', state: 'REMOVED' }).expect(200);
    expect((await pro.get('/api/v1/training/prescription-presets').expect(200)).body.data).toEqual([]);
  });

  it('no admite cargas, se valida como en un plan y lo ajeno es 404', async () => {
    const c = await circuitoDeEntrenamiento(app, `presets-trn-${++contador}`);
    const pro = conSesion(app, c.pro.token);
    const conCarga = { ...fuerza(), sets: [{ repetitions: { value: 3 }, rir: 1, suggestedLoad: { value: 100, unit: 'kg' } }] };
    expect((await pro.post('/api/v1/training/prescription-presets').send({ name: 'Con carga', prescription: conCarga })).status).toBe(400);
    const rpe = await pro.post('/api/v1/training/prescription-presets').send({ name: 'RPE', prescription: { ...fuerza(), intensity: { criterion: 'RPE', target: { value: 8 } } } }).expect(422);
    expect(rpe.body.error.code).toBe('INTENSITY_CRITERION_INVALID');
    const mia = (await pro.post('/api/v1/training/prescription-presets').send({ name: 'Mía', prescription: fuerza() }).expect(201)).body.data;
    const otro = await circuitoDeEntrenamiento(app, `presets-trn-${++contador}`);
    const ajeno = conSesion(app, otro.pro.token);
    expect((await ajeno.patch(`/api/v1/training/prescription-presets/${mia.presetId}`).send({ expectedVersion: 'v1', state: 'REMOVED' })).status).toBe(404);
    expect((await ajeno.get('/api/v1/training/prescription-presets').expect(200)).body.data).toEqual([]);
    // La persona no es profesional de Entrenamiento: no los usa.
    expect((await conSesion(app, c.ase.token).get('/api/v1/training/prescription-presets')).status).toBe(403);
  });
});

describe('ED-13 · el reparto habitual (API-HAN-06 a 08)', () => {
  it('en gramos por día: guardar, reemplazar y quitar; otra unidad es 400; lo ajeno, 404', async () => {
    const c = await circuitoListoParaPlanificar(app, `presets-nut-${++contador}`);
    const pro = conSesion(app, c.pro.token);
    const guardado = RepartoHabitualResponseSchema.parse((await pro.post('/api/v1/nutrition/macro-presets').send({ name: 'Alta en proteínas', distribution: reparto() }).expect(201)).body).data;
    expect(guardado.distribution.protein).toEqual({ value: 140, unit: 'g/day' });
    const enProporcion = { ...reparto(), protein: { value: 30, unit: 'energy_share' } };
    expect((await pro.post('/api/v1/nutrition/macro-presets').send({ name: 'En proporción', distribution: enProporcion })).status).toBe(400);
    expect((await pro.post('/api/v1/nutrition/macro-presets').send({ name: 'Alta en proteínas', distribution: reparto(160) })).status).toBe(409);
    await pro.post('/api/v1/nutrition/macro-presets').send({ name: 'Alta en proteínas', distribution: reparto(160), replaces: guardado.presetId, expectedVersion: 'v1' }).expect(201);
    const lista = ListaDeRepartosHabitualesResponseSchema.parse((await pro.get('/api/v1/nutrition/macro-presets').expect(200)).body).data;
    expect(lista.map((r) => [r.name, r.version, r.distribution.protein.value])).toEqual([['Alta en proteínas', 'v2', 160]]);
    const otro = await circuitoListoParaPlanificar(app, `presets-nut-${++contador}`);
    expect((await conSesion(app, otro.pro.token).patch(`/api/v1/nutrition/macro-presets/${guardado.presetId}`).send({ expectedVersion: 'v2', state: 'REMOVED' })).status).toBe(404);
    await pro.patch(`/api/v1/nutrition/macro-presets/${guardado.presetId}`).send({ expectedVersion: 'v2', state: 'REMOVED' }).expect(200);
    expect((await pro.get('/api/v1/nutrition/macro-presets').expect(200)).body.data).toEqual([]);
  });
});
