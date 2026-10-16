/**
 * WP-AGENDA-DE-ENTRENAMIENTO (DEUDA_LEGAJO DL-137) contra PostgreSQL real:
 * - el profesional guarda la agenda en el borrador (API-TRN-10): se valida contra las sesiones del plan, se poda al sacar
 *   una sesión, `null` la quita, queda en la instantánea al activar y la hereda la sucesora. La lee en el detalle del plan
 *   (API-SER-01);
 * - las respuestas que lee la APK instalada no cambian: ni el plan (API-TRN-09) ni «Hoy» (API-TRN-14) traen la agenda;
 * - la agenda del día va en su operación (API-AGE-01): lo previsto para hoy, lo pendiente y lo que viene; saltear una
 *   pendiente es registrarla «no realizada» sin hora (D-5), y deja de estar pendiente;
 * - los recordatorios: a las 10, la sesión de hoy y la pendiente; a las 22, solo si la de hoy sigue sin registrar; un
 *   plan sin agenda no avisa (DL-133 D-5 pasa de la opción A a la C).
 */
import type { INestApplication } from '@nestjs/common';
import {
  AgendaDeHoyResponseSchema,
  diaDeLaSemana,
  HoyDeEntrenamientoResponseSchema,
  PlanConObjetivosResponseSchema,
  referenciasDeEjercicio,
  type ContenidoDePlanDeEntrenamiento,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { appDePrueba, conSesion } from './soporte-api';
import {
  activarPlanDeEntrenamiento,
  circuitoListoParaPlanificarEntrenamiento,
  crearBorradorDeEntrenamiento,
  estructuraDeEntrenamiento,
  hecho,
  procesoDeEntrenamiento,
  type CircuitoDeEntrenamiento,
} from './soporte-entrenamiento';

const prisma = new PrismaClient();
const SECRETO = 'secreto-sintetico-de-la-tarea-de-recordatorios-agenda';
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba({ secretoDeTareas: SECRETO });
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const DIA_EN_CASTELLANO = { MONDAY: 'lunes', TUESDAY: 'martes', WEDNESDAY: 'miércoles', THURSDAY: 'jueves', FRIDAY: 'viernes', SATURDAY: 'sábado', SUNDAY: 'domingo' } as const;
const sumar = (fecha: string, dias: number) => new Date(new Date(`${fecha}T00:00:00.000Z`).getTime() + dias * 86_400_000).toISOString().slice(0, 10);
const plan = (planId: string) => `/api/v1/training/plans/${planId}`;
/** API-SER-01: el detalle del plan que lee el profesional, con la agenda. */
const agendaDelPlan = async (token: string, planId: string) => PlanConObjetivosResponseSchema.parse((await conSesion(app, token).get(`${plan(planId)}/detail`).expect(200)).body).data.agenda;
/** API-AGE-01: la agenda del día del titular. */
const agendaDelDia = async (token: string) => AgendaDeHoyResponseSchema.parse((await conSesion(app, token).get('/api/v1/me/training/agenda').expect(200)).body).data;
const hoyDe = async (token: string) => HoyDeEntrenamientoResponseSchema.parse((await conSesion(app, token).get('/api/v1/me/training/today').expect(200)).body).data;
const correr = (slot: 'MORNING' | 'NIGHT') => request(app.getHttpServer()).post('/internal/reminder-runs').set('Authorization', `Bearer ${SECRETO}`).send({ slot }).expect(200);
const recordatorios = (asesoradoId: string) =>
  prisma.novedad.findMany({
    where: { destinatarioId: asesoradoId, tipo: { in: ['RECORDATORIO_DE_ENTRENAMIENTO', 'RECORDATORIO_DE_SESION_DEL_DIA', 'RECORDATORIO_DE_SESION_PENDIENTE'] } },
    orderBy: { tipo: 'asc' },
  });

/** A va el día de anteayer y B, el de hoy, desde hace tres días. */
const agendaDeAnteayerYHoy = (hoy: string) => ({
  startDate: sumar(hoy, -3),
  sessions: [
    { sessionId: 'ses-a', weekdays: [diaDeLaSemana(sumar(hoy, -2))] },
    { sessionId: 'ses-b', weekdays: [diaDeLaSemana(hoy)] },
  ],
  moves: [],
});

/**
 * Activa por SQL el borrador que armó la API, como si se hubiera activado hace `dias` días: la API activa siempre
 * «ahora», una versión activada no se puede cambiar (INV-06-109), y lo pendiente necesita días en que el plan ya regía.
 * Es la siembra de `sembrarPlanActivado` (instantánea, transición con su hecho, versión efectiva y Proceso abierto), con
 * la instantánea de lo que guardó la API: la misma estructura, la agenda y los ejercicios congelados.
 */
async function activarHaceDias(c: CircuitoDeEntrenamiento, versionId: string, dias: number): Promise<void> {
  const v = await prisma.versionDePlanDeEntrenamiento.findUniqueOrThrow({ where: { id: versionId }, select: { contenido: true, planId: true } });
  const contenido = v.contenido as unknown as ContenidoDePlanDeEntrenamiento;
  const versiones = await prisma.versionDeEjercicio.findMany({ where: { id: { in: referenciasDeEjercicio(contenido) } }, select: { id: true, ejercicioId: true, nombre: true } });
  const ejercicios = Object.fromEntries(versiones.map((e) => [e.id, { exerciseId: e.ejercicioId, exerciseName: e.nombre }]));
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `INSERT INTO "instantanea_de_plan_de_entrenamiento" ("id","version_de_plan_id","contenido","huella") VALUES ('${randomUUID()}','${versionId}', $1::jsonb, '${'b'.repeat(64)}')`,
      JSON.stringify({ contenido, ejercicios }),
    );
    await tx.$executeRawUnsafe(
      `UPDATE "version_de_plan_de_entrenamiento" SET "estado" = 'ACTIVADA', "version" = "version" + 1, "momento_de_activacion" = now() - make_interval(days => ${dias}) WHERE "id" = '${versionId}'`,
    );
    await tx.$executeRawUnsafe(hecho(c, versionId, 'BORRADOR', 'ACTIVADA', 'VersionDePlanDeEntrenamientoActivada'));
    await tx.$executeRawUnsafe(`UPDATE "plan_de_entrenamiento" SET "version_efectiva_id" = '${versionId}' WHERE "id" = '${v.planId}'`);
    for (const sql of procesoDeEntrenamiento(c, versionId).sql) await tx.$executeRawUnsafe(sql);
  });
}

/**
 * Un plan, con agenda o sin ella, activado y con el recordatorio de entrenamiento encendido. Con `diasAtras`, activado
 * hace esos días (`activarHaceDias`); si no, por la API.
 */
async function planConAgenda(etiqueta: string, agendaPara: ((hoy: string) => Record<string, unknown>) | null, diasAtras = 0) {
  const c = await circuitoListoParaPlanificarEntrenamiento(app, `${etiqueta}-${++contador}`);
  const hoy = (await hoyDe(c.ase.token)).date;
  const b = await crearBorradorDeEntrenamiento(app, c);
  let version = b.version;
  if (agendaPara) {
    const r = await conSesion(app, c.pro.token).patch(plan(b.planId)).send({ expectedVersion: b.version, changes: estructuraDeEntrenamiento(), agenda: agendaPara(hoy) }).expect(200);
    version = r.body.data.version as string;
  }
  if (diasAtras > 0) await activarHaceDias(c, b.planId, diasAtras);
  else await activarPlanDeEntrenamiento(app, c.pro, b.planId, version).expect(200);
  await conSesion(app, c.ase.token).put('/api/v1/me/notification-preferences').send({ mealLogReminder: false, trainingLogReminder: true }).expect(200);
  return { ...c, hoy, planId: b.planId };
}

/** Abre el borrador de una ocurrencia, le pone la condición y lo confirma, sin hora. */
async function registrar(token: string, occurrenceId: string, sessionCondition: 'COMPLETED' | 'NOT_COMPLETED') {
  const a = conSesion(app, token);
  const borrador = (await a.put(`/api/v1/training/occurrences/${occurrenceId}/execution-draft`).send({}).expect(201)).body.data;
  const changes = sessionCondition === 'NOT_COMPLETED' ? { sessionCondition } : { sessionCondition, granularity: 'EXERCISE_OR_SESSION', sessionSummary: { description: 'Hecha completa.' } };
  const v = (await a.patch(`/api/v1/training/execution-drafts/${borrador.draftId}`).send({ expectedVersion: borrador.version, changes }).expect(200)).body.data;
  return (await a.post(`/api/v1/training/execution-drafts/${borrador.draftId}/confirm`).send({ expectedVersion: v.version }).expect(201)).body.data;
}

describe('DL-137 · la agenda del plan (API-TRN-10 y API-SER-01)', () => {
  it('se valida contra las sesiones del plan, se poda al sacar una sesión, `null` la quita, queda en la instantánea y la hereda la sucesora', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, `ag-plan-${++contador}`);
    const b = await crearBorradorDeEntrenamiento(app, c);
    const p = conSesion(app, c.pro.token);
    const agenda = {
      startDate: '2026-10-19',
      sessions: [
        { sessionId: 'ses-a', weekdays: ['MONDAY', 'THURSDAY'] },
        { sessionId: 'ses-b', weekdays: ['WEDNESDAY'] },
      ],
      moves: [{ sessionId: 'ses-a', from: '2026-10-22', to: '2026-10-23' }],
    };

    // Una sesión que no está en el plan no se guarda, y el error dice dónde.
    const mala = await p
      .patch(plan(b.planId))
      .send({ expectedVersion: b.version, changes: estructuraDeEntrenamiento(), agenda: { ...agenda, sessions: [{ sessionId: 'ses-z', weekdays: ['MONDAY'] }], moves: [] } })
      .expect(422);
    expect(mala.body.error.code).toBe('TRAINING_PLAN_STRUCTURE_INVALID');
    expect(mala.body.error.details.issues).toEqual([{ code: 'AGENDA_SESSION_UNKNOWN', path: 'agenda.sessions[0].sessionId' }]);

    const guardada = (await p.patch(plan(b.planId)).send({ expectedVersion: b.version, changes: estructuraDeEntrenamiento(), agenda }).expect(200)).body.data;
    expect(await agendaDelPlan(c.pro.token, b.planId)).toEqual(agenda);
    // La forma que lee la APK instalada no cambia: ni la edición ni el plan traen la agenda.
    expect(guardada).not.toHaveProperty('agenda');
    expect((await p.get(plan(b.planId)).expect(200)).body.data).not.toHaveProperty('agenda');

    // Sacar la sesión B sin mandar la agenda la conserva, sin B ni sus movimientos.
    const soloA = estructuraDeEntrenamiento() as { blocks: { sessions: unknown[] }[] };
    soloA.blocks[0]!.sessions = soloA.blocks[0]!.sessions.slice(0, 1);
    const podada = (await p.patch(plan(b.planId)).send({ expectedVersion: guardada.version, changes: soloA }).expect(200)).body.data;
    expect(await agendaDelPlan(c.pro.token, b.planId)).toEqual({ ...agenda, sessions: [agenda.sessions[0]] });

    // `null` la quita; volver a mandarla la pone, y al activar queda en la instantánea.
    const sinAgenda = (await p.patch(plan(b.planId)).send({ expectedVersion: podada.version, changes: estructuraDeEntrenamiento(), agenda: null }).expect(200)).body.data;
    expect(await agendaDelPlan(c.pro.token, b.planId)).toBeNull();
    const otraVez = (await p.patch(plan(b.planId)).send({ expectedVersion: sinAgenda.version, changes: estructuraDeEntrenamiento(), agenda }).expect(200)).body.data;
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, otraVez.version).expect(200);
    expect(await agendaDelPlan(c.pro.token, b.planId)).toEqual(agenda);
    expect((await conSesion(app, c.ase.token).get(plan(b.planId)).expect(200)).body.data).not.toHaveProperty('agenda');

    // La sucesora parte de lo activado: hereda la agenda, que el profesional puede cambiar.
    const sucesora = (await p.post(`/api/v1/advisees/${c.ase.id}/training/plans`).send({ objectiveVersionId: c.objectiveVersionId, basedOnPlanId: b.planId }).expect(201)).body.data;
    expect(await agendaDelPlan(c.pro.token, sucesora.planId)).toEqual(agenda);
  });
});

describe('DL-137 · la agenda del día (API-AGE-01)', () => {
  it('trae lo previsto, lo pendiente y lo que viene; saltear la pendiente la registra «no realizada» sin hora', async () => {
    const c = await planConAgenda('ag-hoy', agendaDeAnteayerYHoy, 3);
    const dia = await agendaDelDia(c.ase.token);
    expect(dia).toMatchObject({ date: c.hoy, planState: 'AVAILABLE', planId: c.planId, startDate: sumar(c.hoy, -3) });
    expect(dia.today.map((f) => [f.sessionId, f.plannedDate, f.resolvedBy])).toEqual([['ses-b', c.hoy, null]]);
    expect(dia.pending.map((f) => [f.sessionId, f.plannedDate])).toEqual([['ses-a', sumar(c.hoy, -2)]]);
    expect(dia.upcoming).toEqual([
      { sessionId: 'ses-a', plannedDate: sumar(c.hoy, 5) },
      { sessionId: 'ses-b', plannedDate: sumar(c.hoy, 7) },
    ]);
    // La ocurrencia de hoy de la agenda es la misma que la de «Hoy», que no cambia de forma.
    const hoy = await hoyDe(c.ase.token);
    expect(hoy.occurrences.find((o) => o.plannedSession.sessionId === 'ses-b')?.occurrenceId).toBe(dia.today[0]?.occurrenceId);
    expect(hoy.occurrences).toHaveLength(2);

    // Saltear: la «no realizada» de la fecha prevista, sin hora; BE pone el último instante de ese día (D-5).
    const salteada = await registrar(c.ase.token, dia.pending[0]!.occurrenceId, 'NOT_COMPLETED');
    const finDelDia = new Date(new Date(`${sumar(c.hoy, -1)}T00:00:00-03:00`).getTime() - 1).toISOString();
    expect(salteada.occurredAt).toBe(finDelDia);
    expect((await agendaDelDia(c.ase.token)).pending).toEqual([]);

    // Hacer la de hoy la resuelve, con la condición registrada.
    const hecha = await registrar(c.ase.token, dia.today[0]!.occurrenceId, 'COMPLETED');
    expect((await agendaDelDia(c.ase.token)).today[0]?.resolvedBy).toEqual({ executionId: hecha.executionId, date: c.hoy, sessionCondition: 'COMPLETED' });
  });

  it('un plan sin agenda responde con las listas vacías, y sin plan, NO_ACTIVE_PLAN', async () => {
    const c = await planConAgenda('ag-sin', null);
    expect(await agendaDelDia(c.ase.token)).toMatchObject({ planState: 'AVAILABLE', planId: c.planId, startDate: null, today: [], pending: [], upcoming: [] });
    const sinPlan = await circuitoListoParaPlanificarEntrenamiento(app, `ag-sin-plan-${++contador}`);
    expect(await agendaDelDia(sinPlan.ase.token)).toMatchObject({ planState: 'NO_ACTIVE_PLAN', planId: null, today: [] });
  });
});

describe('DL-137 · los recordatorios de entrenamiento según la agenda', () => {
  it('a las 10, la sesión de hoy y la pendiente; a las 22, solo si la de hoy sigue sin registrar; sin agenda, nada', async () => {
    const conPendiente = await planConAgenda('ag-rec', agendaDeAnteayerYHoy, 3);
    const sinAgenda = await planConAgenda('ag-rec-sin', null);

    await correr('MORNING');
    const manana = await recordatorios(conPendiente.ase.id);
    expect(manana.map((n) => n.tipo)).toEqual(['RECORDATORIO_DE_SESION_DEL_DIA', 'RECORDATORIO_DE_SESION_PENDIENTE']);
    // La pendiente lleva la fecha prevista, y el texto dice de qué día es.
    const vista = (await conSesion(app, conPendiente.ase.token).get('/api/v1/me/news?limit=10').expect(200)).body.data as { kind: string; date: string; body: string; open: { view: string } }[];
    const pendiente = vista.find((n) => n.kind === 'TRAINING_SESSION_PENDING_REMINDER')!;
    expect(pendiente.date).toBe(sumar(conPendiente.hoy, -2));
    expect(pendiente.body).toContain(`del ${DIA_EN_CASTELLANO[diaDeLaSemana(sumar(conPendiente.hoy, -2))]}.`);
    expect(pendiente.open.view).toBe('TRAINING');
    expect(await recordatorios(sinAgenda.ase.id)).toEqual([]);

    // Repetir la corrida no crea otro.
    await correr('MORNING');
    expect(await recordatorios(conPendiente.ase.id)).toHaveLength(2);

    // A la noche, la de hoy sigue sin registrar: el recordatorio de las 22.
    await correr('NIGHT');
    expect((await recordatorios(conPendiente.ase.id)).map((n) => n.tipo)).toContain('RECORDATORIO_DE_ENTRENAMIENTO');
    expect(await recordatorios(sinAgenda.ase.id)).toEqual([]);

    // Otra persona que ya registró la de hoy: la noche no le recuerda nada.
    const alDia = await planConAgenda('ag-rec-al-dia', agendaDeAnteayerYHoy, 3);
    await registrar(alDia.ase.token, (await agendaDelDia(alDia.ase.token)).today[0]!.occurrenceId, 'COMPLETED');
    await correr('NIGHT');
    expect(await recordatorios(alDia.ase.id)).toEqual([]);
  });
});
