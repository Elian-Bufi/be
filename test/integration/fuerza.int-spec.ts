/**
 * La vertical de fuerza de WP-EDITORES-PROFESIONAL (DL-171), por la API real y contra PostgreSQL:
 * - TEST-EDP-061 · la serie observada (API-FZA-01 a 03): registrar con su estimación, lo que no se estima no se guarda,
 *   suceder (corregir y anular) con la versión esperada, lo ajeno es 404, la base impide cambiarla o borrarla y la
 *   persona no la recibe (RM-36, RM-37, RM-41 y RM-42);
 * - TEST-EDP-064 · la clave TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE de API-PRJ-01 suma las observaciones vigentes, con la
 *   especificación BE-E1RM v1; la clave de las marcas no cambia, y la persona no la recibe.
 * La regla por sesión sobre las ejecuciones la prueban los oráculos del dominio (`fuerza-del-analisis.test.ts`).
 */
import type { INestApplication } from '@nestjs/common';
import { ListaDeSeriesObservadasResponseSchema, ProyeccionResponseSchema, SerieObservadaResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { appDePrueba, conSesion } from './soporte-api';
import { CATALOGO_DE_EJERCICIOS, circuitoDeEntrenamiento } from './soporte-entrenamiento';

let app: INestApplication;
const prisma = new PrismaClient();
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

/** El Press de banca plano con barra del catálogo base: está en la lista de la v1 (ED-D18). */
const PRESS = 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7';
const ZONA = 'America/Argentina/Buenos_Aires';
const hoy = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const serie = (extra: Record<string, unknown> = {}) => ({ exerciseId: PRESS, localDate: hoy(), timeZone: ZONA, load: { value: 85, unit: 'kg' }, completedRepetitions: 5, rir: 1, note: null, ...extra });

async function circuito() {
  const c = await circuitoDeEntrenamiento(app, `fuerza-${++contador}`);
  const pro = conSesion(app, c.pro.token);
  return { c, pro, registrar: (cuerpo: object) => pro.post(`/api/v1/advisees/${c.ase.id}/training/observed-sets`).send(cuerpo), listar: () => pro.get(`/api/v1/advisees/${c.ase.id}/training/observed-sets`) };
}

describe('ED-72 · la serie observada por el profesional (API-FZA-01 a 03)', () => {
  it('RM-36 · 85 kg × 5 con RIR 1 se guarda con su estimación: 102,0 kg, núcleo, Epley v1, quién y cuándo', async () => {
    const x = await circuito();
    const r = SerieObservadaResponseSchema.parse((await x.registrar(serie()).expect(201)).body).data;
    expect(r.estimate).toEqual({ specification: 'BE-E1RM', version: 1, method: 'EPLEY_V1', band: 'CORE', load: { value: 85, unit: 'kg' }, completedRepetitions: 5, rir: 1, equivalentRepetitions: 6, value: 102 });
    expect([r.version, r.exerciseName, r.observedBy.identityId, r.localDate, r.supersedes]).toEqual(['v1', 'Press de banca plano con barra', x.c.pro.id, hoy(), null]);
    const lista = ListaDeSeriesObservadasResponseSchema.parse((await x.listar().expect(200)).body).data;
    expect(lista.map((o) => o.observationId)).toEqual([r.observationId]);
  });

  it('RM-37 · lo que no se puede estimar no se guarda y dice el motivo', async () => {
    const x = await circuito();
    const casos: [Record<string, unknown>, string, string][] = [
      [{ load: { value: 60, unit: 'kg' }, completedRepetitions: 15, rir: 0 }, 'MAS_DE_12', 'completedRepetitions'],
      [{ load: { value: 80, unit: 'kg' }, rir: null }, 'SIN_RIR', 'rir'],
      [{ load: { value: 80, unit: 'kg' }, rir: 3 }, 'RIR_MAYOR_QUE_2', 'rir'],
      [{ exerciseId: CATALOGO_DE_EJERCICIOS.pressDeBanca }, 'FUERA_DE_LA_LISTA', 'exerciseId'],
      [{ load: { value: 0, unit: 'kg' } }, 'SIN_CARGA', 'load'],
    ];
    for (const [cambio, motivo, lugar] of casos) {
      const r = await x.registrar(serie(cambio)).expect(422);
      expect([r.body.error.code, r.body.error.details.issues]).toEqual(['STRENGTH_OBSERVATION_NOT_ESTIMABLE', [{ code: motivo, path: lugar }]]);
    }
    const futura = await x.registrar(serie({ localDate: '2999-01-01' })).expect(422);
    expect(futura.body.error.details.issues).toEqual([{ code: 'OBSERVED_DATE_IN_FUTURE', path: 'localDate' }]);
    expect(ListaDeSeriesObservadasResponseSchema.parse((await x.listar().expect(200)).body).data).toEqual([]);
    expect(await prisma.serieObservada.count({ where: { asesoradoId: x.c.ase.id } })).toBe(0);
  });

  it('corregir y anular suceden a la vigente con su motivo y su versión; la anterior queda; dos veces es un conflicto', async () => {
    const x = await circuito();
    const original = (await x.registrar(serie()).expect(201)).body.data;
    const suceder = (id: string, cuerpo: object) => x.pro.post(`/api/v1/training/observed-sets/${id}/successors`).send(cuerpo);
    const corregida = (await suceder(original.observationId, { action: 'CORRECT', expectedVersion: 'v1', reason: 'Eran 4 repeticiones.', observation: { ...serie({ completedRepetitions: 4 }), exerciseId: undefined } }).expect(201)).body.data;
    expect(corregida.action).toBe('CORRECTED');
    expect([corregida.observation.version, corregida.observation.supersedes, corregida.observation.estimate.equivalentRepetitions]).toEqual(['v2', { observationId: original.observationId, reason: 'Eran 4 repeticiones.' }, 5]);
    expect((await x.listar().expect(200)).body.data.map((o: { observationId: string }) => o.observationId)).toEqual([corregida.observation.observationId]);
    // La anterior ya tiene sucesora: otra corrección sobre ella es un conflicto, también con la versión que tenía.
    expect((await suceder(original.observationId, { action: 'VOID', expectedVersion: 'v1', reason: 'Otra vez' })).status).toBe(409);
    expect((await suceder(corregida.observation.observationId, { action: 'VOID', expectedVersion: 'v1', reason: 'Versión vieja' })).status).toBe(409);
    const anulada = (await suceder(corregida.observation.observationId, { action: 'VOID', expectedVersion: 'v2', reason: 'No era de esta persona.' }).expect(201)).body.data;
    expect([anulada.action, anulada.voidedObservationId]).toEqual(['VOIDED', corregida.observation.observationId]);
    expect((await x.listar().expect(200)).body.data).toEqual([]);
    // Las tres filas siguen en la base: la historia no se borra.
    expect(await prisma.serieObservada.count({ where: { asesoradoId: x.c.ase.id } })).toBe(3);
  });

  it('la base impide cambiarla o borrarla', async () => {
    const x = await circuito();
    const r = (await x.registrar(serie()).expect(201)).body.data;
    await expect(prisma.$executeRaw`UPDATE "serie_observada" SET "rir" = 0 WHERE "id" = ${r.observationId}::uuid`).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRaw`DELETE FROM "serie_observada" WHERE "id" = ${r.observationId}::uuid`).rejects.toThrow(/append-only/);
  });

  it('RM-41 y RM-42 · lo ajeno es 404, y la persona no recibe ni las observaciones ni la estimación', async () => {
    const x = await circuito();
    const r = (await x.registrar(serie()).expect(201)).body.data;
    const otro = await circuito();
    expect((await otro.pro.post(`/api/v1/training/observed-sets/${r.observationId}/successors`).send({ action: 'VOID', expectedVersion: 'v1', reason: 'Ajena' })).status).toBe(404);
    expect((await otro.pro.get(`/api/v1/advisees/${x.c.ase.id}/training/observed-sets`)).status).toBe(404);
    const persona = conSesion(app, x.c.ase.token);
    expect((await persona.get(`/api/v1/advisees/${x.c.ase.id}/training/observed-sets`)).status).toBe(404);
    expect((await persona.get(`/api/v1/advisees/${x.c.ase.id}/projections/TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE`)).status).toBe(404);
  });
});

describe('ED-74 · la estimación por ejercicio en API-PRJ-01 (TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE)', () => {
  it('TEST-EDP-064 · suma las observaciones vigentes con BE-E1RM v1; la clave de las marcas no cambia', async () => {
    const x = await circuito();
    const o = (await x.registrar(serie()).expect(201)).body.data;
    await x.registrar(serie({ load: { value: 70, unit: 'kg' }, completedRepetitions: 12, rir: 0 })).expect(201);
    const leer = (query: string) => x.pro.get(`/api/v1/advisees/${x.c.ase.id}/projections/TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE${query}`).expect(200);
    const sinEjercicio = ProyeccionResponseSchema.parse((await leer('')).body).data;
    expect(sinEjercicio.derivation).toEqual({ specificationId: 'BE-E1RM', version: '1', method: 'EPLEY_V1' });
    const r = sinEjercicio.result;
    expect(r?.kind === 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE' && r.exercises.map((e) => [e.exerciseId, e.observations, e.units])).toEqual([[PRESS, 2, ['kg']]]);
    // Apagado, solo la del núcleo; encendido, también la de 12 repeticiones equivalentes.
    const apagado = ProyeccionResponseSchema.parse((await leer(`?exerciseId=${PRESS}`)).body).data.result;
    expect(apagado?.kind === 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE' && apagado.estimate?.points.map((p) => p.pointId)).toEqual([`o:${o.observationId}`]);
    const encendido = ProyeccionResponseSchema.parse((await leer(`?exerciseId=${PRESS}&includeOrientative=true`)).body).data.result;
    expect(encendido?.kind === 'TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE' && encendido.estimate?.points.length).toBe(2);
    // Un filtro que no es de la clave es un 400.
    expect((await x.pro.get(`/api/v1/advisees/${x.c.ase.id}/projections/TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE?metric=LOAD`)).status).toBe(400);
    const marcas = ProyeccionResponseSchema.parse((await x.pro.get(`/api/v1/advisees/${x.c.ase.id}/projections/TRAINING_PERSONAL_RECORDS`).expect(200)).body).data;
    expect([marcas.dataState, marcas.reason, marcas.result]).toEqual(['INSUFFICIENT_INFORMATION', 'SPECIFICATION_PENDING', null]);
  });
});
