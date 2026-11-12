/**
 * ED-70 (WP-EDITORES-PROFESIONAL; DL-171, DJ-2) · la procedencia por campo de la serie registrada, por la API real y
 * contra PostgreSQL (TEST-EDP-059 y TEST-EDP-060). Lo que fija esta prueba:
 * - el borrador (API-TRN-17), la confirmación (API-TRN-18), la ejecución (API-TRN-19 y 19-LISTA) y la corrección
 *   (API-TRN-20) guardan y devuelven `fieldOrigins` en su forma; un objeto vacío no se guarda;
 * - una clave sin valor, o `PERSON` en una serie tildada con lo planificado, es 422 con su código;
 * - cambiar solo la procedencia no es una corrección;
 * - en una corrección del profesional, un valor que cambió no puede decir `PERSON` (422); lo que no cambió, sí.
 * Sin migración: las series viven en el JSON del borrador, de la ejecución y de la corrección.
 */
import type { INestApplication } from '@nestjs/common';
import { HoyDeEntrenamientoResponseSchema } from '@be/domain';
import { appDePrueba, conSesion } from './soporte-api';
import { CATALOGO_DE_EJERCICIOS, circuitoConPlanDeEntrenamientoActivo } from './soporte-entrenamiento';

let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
});

type Serie = Record<string, unknown>;
/** El plan dice 60 kg × 8 en «rx-banca»; la persona escribe solo «10» y tilda. */
const soloLasRepeticiones = (setIndex: number): Serie => ({
  setIndex,
  load: { value: 60, unit: 'kg' },
  completedRepetitions: 10,
  rir: 2,
  perceivedExertion: null,
  fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PLAN' },
});
const todoEscrito = (setIndex: number, carga = 70): Serie => ({
  setIndex,
  load: { value: carga, unit: 'kg' },
  completedRepetitions: 8,
  rir: 2,
  perceivedExertion: null,
  fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' },
});
const deBanca = (sets: Serie[]) => [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets }];

async function borrador() {
  const c = await circuitoConPlanDeEntrenamientoActivo(app, `procedencia-${++contador}`);
  const apk = conSesion(app, c.ase.token);
  const hoy = HoyDeEntrenamientoResponseSchema.parse((await apk.get('/api/v1/me/training/today').expect(200)).body).data;
  const b = (await apk.put(`/api/v1/training/occurrences/${hoy.occurrences[0]!.occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
  const guardar = (expectedVersion: string, sets: Serie[]) => apk.patch(`/api/v1/training/execution-drafts/${b.draftId}`).send({ expectedVersion, changes: { granularity: 'SET', exercises: deBanca(sets) } });
  return { c, apk, draftId: b.draftId as string, version: b.version as string, guardar };
}

async function registrada(sets: Serie[]) {
  const b = await borrador();
  const v = (await b.apk.patch(`/api/v1/training/execution-drafts/${b.draftId}`).send({ expectedVersion: b.version, changes: { granularity: 'SET', exercises: deBanca(sets), sessionCondition: 'COMPLETED' } }).expect(200)).body.data;
  const conf = await b.apk.post(`/api/v1/training/execution-drafts/${b.draftId}/confirm`).send({ expectedVersion: v.version }).expect(201);
  return { ...b, executionId: conf.body.data.executionId as string, pro: conSesion(app, b.c.pro.token) };
}

const corregir = (cliente: ReturnType<typeof conSesion>, executionId: string, sets: Serie[]) =>
  cliente.post(`/api/v1/training/executions/${executionId}/corrections`).send({
    reason: 'Corrijo la carga.',
    correction: { granularity: 'SET', sessionCondition: 'COMPLETED', reason: null, exercises: deBanca(sets), sessionSummary: null },
  });

describe('ED-70 · la procedencia por campo de la serie registrada', () => {
  it('TEST-EDP-059 · el borrador, la ejecución y el historial devuelven cada valor con su origen; un objeto vacío no viaja', async () => {
    const x = await registrada([soloLasRepeticiones(1), { ...todoEscrito(2), fieldOrigins: {} }]);
    const leida = await x.apk.get(`/api/v1/training/executions/${x.executionId}`).expect(200);
    const sets = leida.body.data.original.exercises[0].sets as Serie[];
    expect(sets[0]).toEqual(soloLasRepeticiones(1));
    expect('fieldOrigins' in sets[1]!).toBe(false);
    const hoy = leida.body.data.date as string;
    const lista = await x.apk.get(`/api/v1/me/training/executions?periodStart=${hoy}&periodEnd=${hoy}`).expect(200);
    expect(lista.body.data.executions.find((e: { executionId: string }) => e.executionId === x.executionId).original.exercises[0].sets).toEqual(sets);
  });

  it('TEST-EDP-059 · una clave sin valor, o PERSON en una serie tildada, es 422 con su código, y no se guarda nada', async () => {
    const b = await borrador();
    const sinValor = await b.guardar(b.version, [{ ...soloLasRepeticiones(1), rir: null }]).expect(422);
    expect(sinValor.body.error.details.issues).toEqual([{ code: 'FIELD_ORIGIN_WITHOUT_VALUE', path: 'changes.exercises[0].sets[0].fieldOrigins.rir' }]);
    const tildada = await b.guardar(b.version, [{ ...soloLasRepeticiones(1), recordedAs: 'AS_PLANNED' }]).expect(422);
    expect(tildada.body.error.details.issues).toEqual([{ code: 'FIELD_ORIGIN_PERSON_AS_PLANNED', path: 'changes.exercises[0].sets[0].fieldOrigins.completedRepetitions' }]);
    const otraClave = await b.guardar(b.version, [{ ...soloLasRepeticiones(1), fieldOrigins: { perceivedExertion: 'PERSON' } }]);
    expect(otraClave.status).toBe(400);
    expect((await b.apk.get(`/api/v1/training/execution-drafts/${b.draftId}`).expect(200)).body.data.exercises).toEqual([]);
  });

  it('cambiar solo la procedencia no es una corrección', async () => {
    const x = await registrada([soloLasRepeticiones(1)]);
    const r = await corregir(x.apk, x.executionId, [{ ...soloLasRepeticiones(1), fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' } }]).expect(422);
    expect(r.body.error.details.issues).toEqual([{ code: 'CORRECTION_WITHOUT_CHANGES', path: 'correction' }]);
  });

  it('TEST-EDP-060 · el profesional corrige la carga: ese valor no puede decir PERSON; sin la clave, se guarda y conserva lo demás', async () => {
    const x = await registrada([todoEscrito(1)]);
    const mal = await corregir(x.pro, x.executionId, [todoEscrito(1, 72.5)]).expect(422);
    expect(mal.body.error.details.issues).toEqual([{ code: 'FIELD_ORIGIN_PERSON_ON_CHANGED_VALUE', path: 'correction.exercises[0].sets[0].fieldOrigins.load' }]);
    const bien = await corregir(x.pro, x.executionId, [{ ...todoEscrito(1, 72.5), fieldOrigins: { completedRepetitions: 'PERSON', rir: 'PERSON' } }]).expect(201);
    expect(bien.body.data.corrections[0].correction.exercises[0].sets[0].fieldOrigins).toEqual({ completedRepetitions: 'PERSON', rir: 'PERSON' });
    // La persona sí puede corregir lo suyo y decir que lo escribió ella.
    const propia = await corregir(x.apk, x.executionId, [todoEscrito(1, 75)]).expect(201);
    expect(propia.body.data.corrections[1].correction.exercises[0].sets[0].fieldOrigins).toEqual({ load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' });
  });
});
