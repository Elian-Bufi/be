/**
 * Registro por serie con numeración salteada, por la API real y contra PostgreSQL (corrección de las series pendientes).
 *
 * Antes, la APK calculaba las pendientes y el número de la próxima serie por la **cantidad** de registros: con la 1 y
 * la 3 registradas, mostraba pendiente la «Serie 3» y registraba la próxima como 3, que la API rechaza por repetida.
 * Ahora usa `seriesPendientes` y `proximoNumeroDeSerie` del dominio. Estas pruebas fijan lo que la API admite y conserva:
 * - un borrador con series salteadas se guarda tal cual, sin renumerar;
 * - un número repetido se rechaza (lo que producía la numeración por cantidad), y el número que da el dominio se acepta;
 * - al confirmar, la ejecución conserva los números y lo realizado, nunca lo planificado.
 */
import type { INestApplication } from '@nestjs/common';
import { HoyDeEntrenamientoResponseSchema, proximoNumeroDeSerie, seriesPendientes, type Prescripcion } from '@be/domain';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { CATALOGO_DE_EJERCICIOS, circuitoConPlanDeEntrenamientoActivo } from './soporte-entrenamiento';

let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
});

/** Una serie realizada: 60 kg y las repeticiones que escribió la persona. */
const hecha = (setIndex: number, reps: number) => ({ setIndex, load: { value: 60, unit: 'kg' }, completedRepetitions: reps, rir: null, perceivedExertion: null });
const conSeries = (sets: ReturnType<typeof hecha>[]) => ({ granularity: 'SET', exercises: [{ prescriptionId: 'rx-banca', performedExerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca, sets }] });

async function borradorDeBanca() {
  const c = await circuitoConPlanDeEntrenamientoActivo(app, `series-${++contador}`);
  const apk = conSesion(app, c.ase.token);
  const hoy = HoyDeEntrenamientoResponseSchema.parse((await apk.get('/api/v1/me/training/today').expect(200)).body).data;
  const ocurrencia = hoy.occurrences[0]!;
  const banca = ocurrencia.plannedSession.prescriptions.find((p) => p.prescriptionId === 'rx-banca') as Prescripcion;
  const b = (await apk.put(`/api/v1/training/occurrences/${ocurrencia.occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
  const guardar = (expectedVersion: string, sets: ReturnType<typeof hecha>[]) => apk.patch(`/api/v1/training/execution-drafts/${b.draftId}`).send({ expectedVersion, changes: conSeries(sets) });
  return { apk, banca, draftId: b.draftId as string, version: b.version as string, guardar };
}

describe('Series pendientes · el número de serie es el real, no la cantidad de registros', () => {
  it('con solo la serie 3 registrada, el borrador la conserva como 3 y siguen pendientes la 1 y la 2', async () => {
    const { banca, version, guardar } = await borradorDeBanca();
    expect(banca.sets.map((s) => s.setIndex)).toEqual([1, 2, 3]);
    const v2 = (await guardar(version, [hecha(3, 7)]).expect(200)).body.data;
    const registradas = v2.exercises[0].sets as { setIndex: number }[];
    expect(registradas.map((s) => s.setIndex)).toEqual([3]);
    expect(seriesPendientes(banca, registradas).map((s) => s.setIndex)).toEqual([1, 2]);
    expect(proximoNumeroDeSerie(banca, registradas)).toBe(1);
  });

  it('con la 1 y la 3 registradas, la numeración por cantidad (3) se rechaza por repetida; la del dominio (2) se guarda', async () => {
    const { banca, version, guardar } = await borradorDeBanca();
    const v2 = (await guardar(version, [hecha(1, 8), hecha(3, 6)]).expect(200)).body.data;
    const registradas = v2.exercises[0].sets as ReturnType<typeof hecha>[];

    // Lo que hacía la APK: `registradas.length + 1` = 3, que ya existe.
    const porCantidad = registradas.length + 1;
    expect(porCantidad).toBe(3);
    const rechazo = await guardar(v2.version, [...registradas, hecha(porCantidad, 8)]);
    expect(rechazo.status).toBe(422);
    expect(JSON.stringify(rechazo.body.error.details)).toContain('DUPLICATE_SET_INDEX');

    // Lo que hace ahora: el número que da el dominio.
    const siguiente = proximoNumeroDeSerie(banca, registradas);
    expect(siguiente).toBe(2);
    const v3 = (await guardar(v2.version, [...registradas, hecha(siguiente!, 8)].sort((a, b) => a.setIndex - b.setIndex)).expect(200)).body.data;
    expect(v3.exercises[0].sets.map((s: { setIndex: number }) => s.setIndex)).toEqual([1, 2, 3]);
    expect(seriesPendientes(banca, v3.exercises[0].sets)).toEqual([]);
  });

  it('al confirmar, la ejecución conserva los números y lo realizado (5 en la serie 2), no lo planificado (8)', async () => {
    const { apk, draftId, version, guardar } = await borradorDeBanca();
    const v2 = (await guardar(version, [hecha(1, 8), hecha(3, 6)]).expect(200)).body.data;
    const v3 = (await guardar(v2.version, [hecha(1, 8), hecha(2, 5), hecha(3, 6)]).expect(200)).body.data;
    const confirmada = await apk
      .patch(`/api/v1/training/execution-drafts/${draftId}`)
      .send({ expectedVersion: v3.version, changes: { sessionCondition: 'COMPLETED' } })
      .expect(200);
    const registrada = await apk.post(`/api/v1/training/execution-drafts/${draftId}/confirm`, claveDeIdempotencia()).send({ expectedVersion: confirmada.body.data.version }).expect(201);
    const x = await apk.get(`/api/v1/training/executions/${registrada.body.data.executionId}`).expect(200);
    expect(x.body.data.original.exercises[0].sets.map((s: { setIndex: number; completedRepetitions: number }) => [s.setIndex, s.completedRepetitions])).toEqual([
      [1, 8],
      [2, 5],
      [3, 6],
    ]);
  });
});
