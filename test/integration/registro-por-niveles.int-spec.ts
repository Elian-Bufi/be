/**
 * Registro por niveles (DL-161), por la API real y contra PostgreSQL. La serie dice cómo se cargó (`recordedAs`) y cuánto
 * duró (`durationSeconds`). Lo que fija esta prueba:
 * - el borrador (API-TRN-17), la confirmación (API-TRN-18), la ejecución (API-TRN-19 y 19-LISTA) y la corrección
 *   (API-TRN-20) guardan y devuelven los dos campos tal cual, sin perderlos ni completarlos;
 * - lo que no existe no se guarda ni se devuelve: «TYPED» y una duración nula son lo mismo que la ausencia, así que una
 *   serie escrita llega con los cinco campos de siempre;
 * - una serie «como el plan» sin carga ni repeticiones se rechaza: no existe la serie realizada sin datos;
 * - una corrección que solo cambia la marca no corrige nada; una que cambia la duración, sí;
 * - la línea de tiempo del profesional (API-DSH-04) dice cómo se cargaron las series, con los nombres de Dirección del
 *   2026-11-02 («Carga completa», «Carga rápida», «Carga rápida con cambios»);
 * - el análisis del profesional (API-PRJ-01) marca el punto de una serie de carga rápida en su detalle y lo explica en
 *   la nota de la serie: el website lo dibuja hueco y lo deja fuera de los resúmenes y del cambio relativo; la cantidad
 *   de series registradas cuenta también las tildadas;
 * - la APK 0.18.0-candidata.1 (lo que congeló DL-152) lee igual lo registrado sin los campos nuevos, y no puede leer una
 *   ejecución que los trae: es el caso que queda documentado en DL-161.
 */
import type { INestApplication } from '@nestjs/common';
import { HoyDeEntrenamientoResponseSchema, LineaDeTiempoResponseSchema, ProyeccionResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { appDePrueba, conSesion } from './soporte-api';
import { CATALOGO_DE_EJERCICIOS, circuitoConPlanDeEntrenamientoActivo } from './soporte-entrenamiento';
import { LaApk } from './soporte-lecturas-de-la-apk';

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

type Serie = Record<string, unknown>;
const CINCO = ['setIndex', 'load', 'completedRepetitions', 'rir', 'perceivedExertion'];
/** Una serie escrita, como la manda la APK instalada: los cinco campos de siempre. */
const escrita = (setIndex: number, reps = 8, carga = 60): Serie => ({ setIndex, load: { value: carga, unit: 'kg' }, completedRepetitions: reps, rir: null, perceivedExertion: null });
/** Una serie tildada con lo planificado a la vista: los valores del plan (8 × 60 kg en «rx-banca»), con la marca. */
const comoElPlan = (setIndex: number, extra: Serie = {}): Serie => ({ ...escrita(setIndex), recordedAs: 'AS_PLANNED', ...extra });
const deBanca = (sets: Serie[]) => [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets }];
const conSeries = (sets: Serie[]) => ({ granularity: 'SET', exercises: deBanca(sets) });

async function borrador() {
  const c = await circuitoConPlanDeEntrenamientoActivo(app, `niveles-${++contador}`);
  const apk = conSesion(app, c.ase.token);
  const hoy = HoyDeEntrenamientoResponseSchema.parse((await apk.get('/api/v1/me/training/today').expect(200)).body).data;
  const ocurrencia = hoy.occurrences[0]!;
  const b = (await apk.put(`/api/v1/training/occurrences/${ocurrencia.occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
  const guardar = (expectedVersion: string, changes: Record<string, unknown>) => apk.patch(`/api/v1/training/execution-drafts/${b.draftId}`).send({ expectedVersion, changes });
  return { c, apk, draftId: b.draftId as string, version: b.version as string, guardar };
}

/** Una sesión registrada con estas series de banca. */
async function registrada(sets: Serie[]) {
  const b = await borrador();
  const v = (await b.guardar(b.version, { ...conSeries(sets), sessionCondition: 'COMPLETED' }).expect(200)).body.data;
  const conf = await b.apk.post(`/api/v1/training/execution-drafts/${b.draftId}/confirm`).send({ expectedVersion: v.version }).expect(201);
  return { ...b, executionId: conf.body.data.executionId as string };
}

const corregir = (x: { apk: ReturnType<typeof conSesion>; executionId: string }, sets: Serie[]) =>
  x.apk.post(`/api/v1/training/executions/${x.executionId}/corrections`).send({
    reason: 'Me faltó anotar la duración.',
    correction: { granularity: 'SET', sessionCondition: 'COMPLETED', reason: null, exercises: deBanca(sets), sessionSummary: null },
  });

describe('Registro por niveles (DL-161) · la serie dice cómo se cargó y cuánto duró', () => {
  it('el borrador guarda y devuelve la marca y la duración; «TYPED» y una duración nula no se guardan ni se devuelven', async () => {
    const b = await borrador();
    const r = await b.guardar(b.version, conSeries([comoElPlan(1, { durationSeconds: 42 }), { ...escrita(2, 7), recordedAs: 'TYPED', durationSeconds: null }, escrita(3, 6)])).expect(200);
    const sets = r.body.data.exercises[0].sets as Serie[];
    expect(sets).toEqual([{ ...escrita(1), recordedAs: 'AS_PLANNED', durationSeconds: 42 }, escrita(2, 7), escrita(3, 6)]);
    expect(Object.keys(sets[1]!)).toEqual(CINCO);
    expect(Object.keys(sets[2]!)).toEqual(CINCO);
    // En la base, igual: lo que no existe no se guarda.
    const guardado = await prisma.borradorDeEjecucionDeEntrenamiento.findUniqueOrThrow({ where: { id: b.draftId }, select: { contenido: true } });
    const enLaBase = (guardado.contenido as unknown as { exercises: { sets: Serie[] }[] }).exercises[0]!.sets;
    expect(enLaBase.map((s) => Object.keys(s).sort())).toEqual([[...CINCO, 'durationSeconds', 'recordedAs'].sort(), [...CINCO].sort(), [...CINCO].sort()]);
    // La lectura del borrador (API-TRN-16) devuelve lo mismo.
    const leido = await b.apk.get(`/api/v1/training/execution-drafts/${b.draftId}`).expect(200);
    expect(leido.body.data.exercises[0].sets).toEqual(sets);
  });

  it('una serie «como el plan» sin carga ni repeticiones se rechaza al guardar: no existe la serie realizada sin datos', async () => {
    const b = await borrador();
    const soloRir = { setIndex: 1, load: null, completedRepetitions: null, rir: 2, perceivedExertion: null, recordedAs: 'AS_PLANNED' };
    const r = await b.guardar(b.version, conSeries([soloRir])).expect(422);
    expect(r.body.error.code).toBe('EXECUTION_VALUE_INVALID');
    expect(r.body.error.details.issues).toEqual([{ code: 'SET_WITHOUT_DATA', path: 'changes.exercises[0].sets[0]' }]);
    // Una duración fuera de rango o con decimales no es una duración: el pedido no pasa el contrato.
    for (const durationSeconds of [-1, 36001, 12.5]) {
      const malo = await b.guardar(b.version, conSeries([comoElPlan(1, { durationSeconds })]));
      expect(malo.status).toBeGreaterThanOrEqual(400);
      expect(malo.status).toBeLessThan(500);
    }
    // Una marca que no existe, tampoco.
    const otraMarca = await b.guardar(b.version, conSeries([{ ...escrita(1), recordedAs: 'GUESSED' }]));
    expect(otraMarca.status).toBeGreaterThanOrEqual(400);
    expect(otraMarca.status).toBeLessThan(500);
    // El borrador sigue sin series: nada de lo rechazado quedó guardado.
    expect((await b.apk.get(`/api/v1/training/execution-drafts/${b.draftId}`).expect(200)).body.data.exercises).toEqual([]);
  });

  it('al confirmar, la ejecución conserva la marca y la duración; la serie escrita llega con los cinco campos de siempre', async () => {
    const x = await registrada([comoElPlan(1, { durationSeconds: 40 }), comoElPlan(2), escrita(3, 6)]);
    const leida = await x.apk.get(`/api/v1/training/executions/${x.executionId}`).expect(200);
    const sets = leida.body.data.original.exercises[0].sets as Serie[];
    expect(sets).toEqual([{ ...escrita(1), recordedAs: 'AS_PLANNED', durationSeconds: 40 }, { ...escrita(2), recordedAs: 'AS_PLANNED' }, escrita(3, 6)]);
    expect(Object.keys(sets[2]!)).toEqual(CINCO);
    // «Tu historial» (API-TRN-19-LISTA) lee la misma ejecución con lo mismo.
    const hoy = leida.body.data.date as string;
    const lista = await x.apk.get(`/api/v1/me/training/executions?periodStart=${hoy}&periodEnd=${hoy}`).expect(200);
    expect(lista.body.data.executions.find((e: { executionId: string }) => e.executionId === x.executionId).original.exercises[0].sets).toEqual(sets);
  });

  it('una corrección que solo cambia la marca no corrige nada; una que cambia la duración, sí, y lo demás queda como estaba', async () => {
    const x = await registrada([comoElPlan(1, { durationSeconds: 40 }), escrita(2)]);
    // Sin la marca, o con «TYPED» explícito: los datos son los mismos.
    for (const sets of [[{ ...escrita(1), durationSeconds: 40 }, escrita(2)], [comoElPlan(1, { durationSeconds: 40 }), { ...escrita(2), recordedAs: 'TYPED', durationSeconds: null }]]) {
      const igual = await corregir(x, sets).expect(422);
      expect(igual.body.error.details.issues).toEqual([{ code: 'CORRECTION_WITHOUT_CHANGES', path: 'correction' }]);
    }
    // La duración sí es un dato: corregirla corrige.
    const r = await corregir(x, [comoElPlan(1, { durationSeconds: 55 }), escrita(2)]).expect(201);
    expect(r.body.data.corrections[0].correction.exercises[0].sets).toEqual([{ ...escrita(1), recordedAs: 'AS_PLANNED', durationSeconds: 55 }, escrita(2)]);
    expect(r.body.data.original.exercises[0].sets).toEqual([{ ...escrita(1), recordedAs: 'AS_PLANNED', durationSeconds: 40 }, escrita(2)]);
    // Sacar la duración también es corregir; la serie vuelve a los cinco campos.
    const sin = await corregir(x, [comoElPlan(1), escrita(2)]).expect(201);
    expect(sin.body.data.corrections[1].correction.exercises[0].sets[0]).toEqual({ ...escrita(1), recordedAs: 'AS_PLANNED' });
    // Una serie «como el plan» sin datos tampoco entra por la corrección.
    const vacia = await corregir(x, [{ setIndex: 1, load: null, completedRepetitions: null, rir: null, perceivedExertion: null, recordedAs: 'AS_PLANNED' }, escrita(2)]).expect(422);
    expect(vacia.body.error.details.issues).toEqual([{ code: 'SET_WITHOUT_DATA', path: 'correction.exercises[0].sets[0]' }]);
  });

  it('la línea de tiempo del profesional dice cómo se cargaron las series', async () => {
    const parte = await registrada([comoElPlan(1), comoElPlan(2), escrita(3, 6)]);
    const lectura = LineaDeTiempoResponseSchema.parse((await conSesion(app, parte.c.pro.token).get(`/api/v1/advisees/${parte.c.ase.id}/timeline`).expect(200)).body);
    const sesion = lectura.data.entries.find((e) => e.timelineEntryId === `tses:${parte.executionId}`)!;
    expect(sesion.details.find((d) => d.label === 'Cómo se cargó')?.value).toBe('Carga rápida con cambios');
    expect(sesion.details.find((d) => d.label === 'Series con datos')?.value).toBe('3');

    const toda = await registrada([comoElPlan(1), comoElPlan(2), comoElPlan(3)]);
    const deToda = LineaDeTiempoResponseSchema.parse((await conSesion(app, toda.c.pro.token).get(`/api/v1/advisees/${toda.c.ase.id}/timeline`).expect(200)).body);
    expect(deToda.data.entries.find((e) => e.timelineEntryId === `tses:${toda.executionId}`)!.details.find((d) => d.label === 'Cómo se cargó')?.value).toBe('Carga rápida');

    const escritas = await registrada([escrita(1), escrita(2)]);
    const deEscritas = LineaDeTiempoResponseSchema.parse((await conSesion(app, escritas.c.pro.token).get(`/api/v1/advisees/${escritas.c.ase.id}/timeline`).expect(200)).body);
    expect(deEscritas.data.entries.find((e) => e.timelineEntryId === `tses:${escritas.executionId}`)!.details.find((d) => d.label === 'Cómo se cargó')?.value).toBe('Carga completa');
  });

  it('el análisis del profesional marca el punto de la serie de carga rápida y lo explica; la cantidad de series cuenta las dos', async () => {
    const x = await registrada([comoElPlan(1), escrita(2, 7)]);
    const pro = conSesion(app, x.c.pro.token);
    const base = `/api/v1/advisees/${x.c.ase.id}/projections/TRAINING_PROGRESSION_BY_EXERCISE`;
    const lista = ProyeccionResponseSchema.parse((await pro.get(base).expect(200)).body).data.result!;
    if (lista.kind !== 'TRAINING_PROGRESSION_BY_EXERCISE') throw new Error('otra clave');
    const banca = lista.exercises.find((e) => /banca/i.test(e.name));
    expect(banca).toBeDefined();
    const serieDe = async (query: string) => {
      const r = ProyeccionResponseSchema.parse((await pro.get(`${base}?exerciseId=${banca!.exerciseKey}&${query}`).expect(200)).body).data.result!;
      if (r.kind !== 'TRAINING_PROGRESSION_BY_EXERCISE') throw new Error('otra clave');
      return r.progression!.series;
    };
    // La serie 1 se tildó sin escribir: su punto está (con los valores del plan) y lleva la marca en el detalle.
    const tildada = await serieDe('metric=LOAD&setIndex=1');
    expect(tildada.points.map((p) => p.value)).toEqual([60]);
    expect(tildada.points[0]!.detail).toContainEqual({ label: 'Cómo se cargó', value: 'Carga rápida, tildada sin escribir' });
    expect(tildada.notes.join(' ')).toMatch(/carga rápida \(tildada sin escribir, con los valores del plan\): es un punto hueco/);
    // La serie 2 se escribió: punto lleno, sin marca ni nota.
    const escritaLeida = await serieDe('metric=REPETITIONS&setIndex=2');
    expect(escritaLeida.points.map((p) => p.value)).toEqual([7]);
    expect(escritaLeida.points[0]!.detail.some((d) => d.label === 'Cómo se cargó')).toBe(false);
    expect(escritaLeida.notes.join(' ')).not.toMatch(/carga rápida/);
    // La cantidad de series registradas se cuenta siempre, también la tildada.
    expect((await serieDe('metric=SETS_RECORDED')).points.map((p) => p.value)).toEqual([2]);
  });

  it('la APK 0.18.0-candidata.1 lee igual lo registrado sin los campos nuevos; una ejecución que los trae no la puede leer', async () => {
    const vieja = new LaApk('0.18.0-candidata.1', () => app);
    // Cargada con una APK nueva, toda escrita y sin cronómetro: lo que viaja es lo de siempre.
    const sinNada = await registrada([{ ...escrita(1), recordedAs: 'TYPED', durationSeconds: null }, escrita(2)]);
    await vieja.pide('API-TRN-19', { token: sinNada.c.ase.token, params: { executionId: sinNada.executionId } });
    expect(vieja.rechazos()).toEqual([]);
    // El caso que queda (DL-161): con una serie «como el plan» o con una duración, la APK anterior rechaza la respuesta
    // por el campo que no conoce. Esa APK nunca los manda; solo pasa si la misma persona vuelve a una versión anterior.
    for (const sets of [[comoElPlan(1), escrita(2)], [{ ...escrita(1), durationSeconds: 30 }, escrita(2)]]) {
      const conCampos = await registrada(sets);
      await vieja.pide('API-TRN-19', { token: conCampos.c.ase.token, params: { executionId: conCampos.executionId } });
      const rechazos = vieja.rechazos();
      expect(rechazos.length).toBeGreaterThan(0);
      expect(rechazos.join(' ')).toMatch(/recordedAs|durationSeconds/);
    }
  });
});
