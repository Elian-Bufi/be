/**
 * API-DSH-03 · el dashboard interdisciplinario con contenido real (09v11 §15; DL-031, condición de cierre).
 *
 * Lo que estas pruebas fijan, que es lo que el legajo exige y lo que sería fácil romper sin darse cuenta:
 * - cada dominio muestra hechos de **su** read model, con procedencia y autoría, y nada se agrega entre dominios;
 * - un dominio denegado dice `NOT_AVAILABLE_TO_VIEW` y **no filtra nada** al resumen de los otros;
 * - sin datos todavía, `summary` es `null` y no un objeto de ceros (RF-053: los faltantes se muestran como tales);
 * - el período acota los conteos;
 * - no existe ningún score, «estado general» ni compliance global (09v11 §15, regla crítica; B10-08 §10).
 */
import type { INestApplication } from '@nestjs/common';
import { DashboardResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { dashboard, prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto } from './soporte-vinculo';
import { circuitoConPlanActivo, cuerpoDeObjetivo, registrarComida } from './soporte-nutricion';
import { CATALOGO_DE_EJERCICIOS, circuitoConPlanDeEntrenamientoActivo, cuerpoDeObjetivoDeEntrenamiento } from './soporte-entrenamiento';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const leer = async (pro: Parameters<typeof dashboard>[1], asesoradoId: string) => DashboardResponseSchema.parse((await dashboard(app, pro, asesoradoId).expect(200)).body).data;

describe('API-DSH-03 · resumen por dominio', () => {
  it('nutrición: plan vigente, objetivo con su autoría, y el conteo de ingestas del asesorado', async () => {
    const c = await circuitoConPlanActivo(app, `dsh-nut-${++contador}`);
    await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    await registrarComida(app, c.ase, c.planId, c.dia, { comida: 1 }).expect(201);

    const d = await leer(c.pro, c.ase.id);
    const nut = d.domains.nutrition;
    if (!nut.available) throw new Error('nutrición debería estar disponible');
    expect(nut.summary).not.toBeNull();
    expect(nut.summary).toMatchObject({
      activePlan: { planVersionId: c.planId },
      registeredIntakes: 2,
    });
    // El objetivo conserva su autoría y su unidad: el dashboard no reinventa el dato (B10-08 §8.3).
    expect(nut.summary!.objective).toMatchObject({ estimatedEnergyRequirement: { unit: 'kcal/day' } });
    expect(nut.summary!.objective!.authoredBy.identityId).toBe(c.pro.id);
    expect(nut.summary!.activePlan!.activatedAt).toEqual(expect.any(String));
    expect(nut.summary!.lastIntakeAt).toEqual(expect.any(String));
  });

  it('entrenamiento: plan vigente y el conteo de ejecuciones registradas, que es un conteo y no una adherencia', async () => {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, `dsh-trn-${++contador}`);
    const d = await leer(c.pro, c.ase.id);
    const trn = d.domains.training;
    if (!trn.available) throw new Error('entrenamiento debería estar disponible');
    expect(trn.summary).toMatchObject({ activePlan: { planVersionId: c.planId }, registeredExecutions: 0, lastExecutionAt: null });
    expect(trn.summary!.objective!.authoredBy.identityId).toBe(c.pro.id);
  });

  it('un dominio autorizado y todavía vacío es summary: null, no un objeto de ceros (RF-053)', async () => {
    const pro = await prepararProfesional(app, `dsh-vacio-${++contador}`, ['NUTRICION']);
    const ase = await prepararAsesorado(app, `dsh-vacio-${++contador}`, { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');

    const d = await leer(pro, ase.id);
    expect(d.domains.nutrition).toEqual({ available: true, relationshipId: expect.any(String), summary: null });
  });
});

describe('API-DSH-03 · lo que el PDP no permite no se filtra por el resumen', () => {
  it('revocado el B2, el dominio pasa a NOT_AVAILABLE_TO_VIEW sin decir qué había detrás, y partialView queda en true', async () => {
    const c = await circuitoConPlanActivo(app, `dsh-revoca-${++contador}`);
    await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const antes = await leer(c.pro, c.ase.id);
    expect(antes.domains.nutrition.available).toBe(true);

    await revocarB2(app, c.ase, c.consentId).expect(200);
    // Sin ningún alcance permitido el guard responde 404, idéntico a un asesorado inexistente.
    await dashboard(app, c.pro, c.ase.id).expect(404);
  });

  it('con dos alcances y uno solo consentido: el denegado no aporta ni un conteo, y el aviso de vista parcial es uno solo', async () => {
    const etiqueta = `dsh-parcial-${++contador}`;
    const pro = await prepararProfesional(app, etiqueta, ['NUTRICION', 'ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, etiqueta, { a3: true });
    await vinculoCompleto(app, pro, ase, 'NUTRICION');
    const trn = await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    await revocarB2(app, ase, trn.consentId as string).expect(200);

    const d = await leer(pro, ase.id);
    expect(d.partialView).toBe(true);
    expect(d.domains.training).toEqual({ available: false, reason: 'NOT_AVAILABLE_TO_VIEW' });
    // El dominio denegado no deja rastro: ni conteo, ni fecha, ni identificador.
    expect(JSON.stringify(d.domains.training)).not.toContain(trn.vinculoId);
    expect(d.domains.nutrition.available).toBe(true);
  });
});

describe('API-DSH-03 · período y regla crítica', () => {
  it('el período acota el conteo: una ingesta fuera de la ventana no se cuenta', async () => {
    const c = await circuitoConPlanActivo(app, `dsh-periodo-${++contador}`);
    const hace10 = new Date(Date.now() - 10 * 86_400_000);
    await registrarComida(app, c.ase, c.planId, c.dia, { ocurrencia: hace10 }).expect(201);
    await registrarComida(app, c.ase, c.planId, c.dia, { comida: 1 }).expect(201);

    const desde = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const r = await conSesion(app, c.pro.token).get(`/api/v1/advisees/${c.ase.id}/dashboard?periodStart=${encodeURIComponent(desde)}`).expect(200);
    const nut = DashboardResponseSchema.parse(r.body).data.domains.nutrition;
    if (!nut.available) throw new Error('nutrición debería estar disponible');
    expect(nut.summary!.registeredIntakes).toBe(1);

    // Sin período, se cuentan las dos: el período acota, no oculta.
    const todo = await leer(c.pro, c.ase.id);
    const nutTodo = todo.domains.nutrition;
    if (!nutTodo.available) throw new Error('nutrición debería estar disponible');
    expect(nutTodo.summary!.registeredIntakes).toBe(2);
  });

  it('09v11 §15 · no existe score global, compliance ni riesgo, en ninguna parte de la respuesta', async () => {
    const c = await circuitoConPlanActivo(app, `dsh-sin-score-${++contador}`);
    await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    // Se miran las **claves** de la respuesta, no su texto: un nombre sintético puede contener cualquier palabra.
    const claves = (v: unknown): string[] =>
      Array.isArray(v) ? v.flatMap(claves) : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => [k.toLowerCase(), ...claves(x)]) : [];
    const todas = claves(await leer(c.pro, c.ase.id));
    for (const prohibido of ['score', 'risk', 'compliance', 'adherence', 'rating', 'level', 'grade', 'overall']) {
      expect(todas.filter((k) => k.includes(prohibido))).toEqual([]);
    }
  });
});

/**
 * Vigente es la terminal de cada cadena, no lo que quedó congelado en la versión de plan que se activó (hallazgo de
 * la auditoría de cierre, entrenamiento y nutrición por igual): la próxima revisión es la que fijó la última revisión
 * aplicada, no la que traía el plan al activarse; el objetivo es la terminal de su propia sucesión, que
 * CAMBIAR_OBJETIVO mueve sin tocar la versión de plan; y un seguimiento FINALIZADO deja de tener plan vigente, aunque
 * la versión activada siga siendo, técnicamente, la última (06:4297; DL-088 punto 18).
 */
describe('API-DSH-03 · lo vigente es la terminal de cada cadena, no lo que quedó en la versión de plan que se activó', () => {
  const hoyDe = (token: string) => conSesion(app, token).get('/api/v1/me/training/today');
  const borradorDe = (token: string, occurrenceId: string) => conSesion(app, token).put(`/api/v1/training/occurrences/${occurrenceId}/execution-draft`).send({});
  const guardar = (token: string, draftId: string, expectedVersion: string, changes: Record<string, unknown>) =>
    conSesion(app, token).patch(`/api/v1/training/execution-drafts/${draftId}`).send({ expectedVersion, changes });
  const confirmar = (token: string, draftId: string, expectedVersion: string, clave = claveDeIdempotencia()) =>
    conSesion(app, token).post(`/api/v1/training/execution-drafts/${draftId}/confirm`, clave).send({ expectedVersion });
  const serie = (setIndex: number, kg = 60, reps = 8, rir: number | null = 2) => ({ setIndex, load: { value: kg, unit: 'kg' }, completedRepetitions: reps, rir, perceivedExertion: null });
  const revisarTrn = (c: { pro: { token: string }; ase: { id: string } }, cuerpo: Record<string, unknown>) =>
    conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/reviews`).send(cuerpo);
  const aplicarTrn = (token: string, reviewId: string) => conSesion(app, token).post(`/api/v1/training/reviews/${reviewId}/apply`, claveDeIdempotencia()).send({ expectedVersion: 'v1' });
  const cuerpoDeRevisionTrn = (fecha: string, executionId: string, result: string, nextAction: Record<string, unknown> = {}): Record<string, unknown> => ({
    period: { start: fecha, end: fecha, timeZone: 'America/Argentina/Buenos_Aires' },
    evidenceReferences: [{ type: 'EXECUTION', id: executionId }],
    interpretation: 'Registró la sesión con la carga indicada.',
    result,
    rationale: 'Fundamento sintético del profesional.',
    nextAction: { description: 'Seguir con el bloque actual.', ...nextAction },
  });

  /** Un circuito de entrenamiento con una sesión registrada hoy, para revisar sobre evidencia real. */
  async function circuitoTrnConSesion(etiqueta: string) {
    const c = await circuitoConPlanDeEntrenamientoActivo(app, etiqueta);
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
    return { ...c, fecha: hoy.date as string, executionId: conf.body.data.executionId as string };
  }

  it('entrenamiento: reprogramar la revisión mueve «próxima revisión acordada» en el dashboard, no solo en review-context', async () => {
    const c = await circuitoTrnConSesion(`dsh-trn-reprog-${++contador}`);
    const antes = (await leer(c.pro, c.ase.id)).domains.training;
    if (!antes.available || !antes.summary) throw new Error('debería haber resumen');
    const original = antes.summary.activePlan!.nextReviewAt;

    const rev = await revisarTrn(c, cuerpoDeRevisionTrn(c.fecha, c.executionId, 'RESCHEDULE_REVIEW', { nextReviewAt: '2031-06-15' })).expect(201);
    await aplicarTrn(c.pro.token, rev.body.data.reviewId).expect(200);

    const despues = (await leer(c.pro, c.ase.id)).domains.training;
    if (!despues.available || !despues.summary) throw new Error('debería haber resumen');
    expect(despues.summary.activePlan!.nextReviewAt).toBe('2031-06-15');
    expect(despues.summary.activePlan!.nextReviewAt).not.toBe(original);
  });

  it('entrenamiento: cambiar el objetivo mueve el objetivo que muestra el dashboard, no solo /objectives/effective', async () => {
    const c = await circuitoTrnConSesion(`dsh-trn-obj-${++contador}`);
    const objetivo = { evaluationId: c.evaluationId, effectiveFrom: new Date().toISOString(), effectiveUntil: null, objective: { statement: 'Nuevo enunciado, posterior a la activación del plan.' }, rationale: 'Fundamento.' };
    const rev = await revisarTrn(c, cuerpoDeRevisionTrn(c.fecha, c.executionId, 'CHANGE_OBJECTIVE', { objective: objetivo })).expect(201);
    await aplicarTrn(c.pro.token, rev.body.data.reviewId).expect(200);

    const d = (await leer(c.pro, c.ase.id)).domains.training;
    if (!d.available || !d.summary) throw new Error('debería haber resumen');
    // El objetivo del resumen es el efectivo de ahora, no el que el plan tenía atado al activarse.
    expect(d.summary.objective!.statement).toBe('Nuevo enunciado, posterior a la activación del plan.');
    expect(d.summary.objective!.objectiveVersionId).not.toBe(c.objectiveVersionId);
  });

  it('entrenamiento: FINALIZAR deja sin plan vigente en el dashboard, aunque la versión activada siga siendo la última (DL-088.18)', async () => {
    const c = await circuitoTrnConSesion(`dsh-trn-fin-${++contador}`);
    const antes = (await leer(c.pro, c.ase.id)).domains.training;
    if (!antes.available) throw new Error('debería estar disponible');
    expect(antes.summary!.activePlan).not.toBeNull();

    const rev = await revisarTrn(c, cuerpoDeRevisionTrn(c.fecha, c.executionId, 'FINALIZE', { description: 'Cierre del seguimiento.' })).expect(201);
    await aplicarTrn(c.pro.token, rev.body.data.reviewId).expect(200);

    const despues = (await leer(c.pro, c.ase.id)).domains.training;
    if (!despues.available) throw new Error('debería estar disponible');
    expect(despues.summary!.activePlan).toBeNull();
  });

  it('nutrición: cambiar el objetivo mueve el objetivo que muestra el dashboard, no solo /objectives/effective (mismo patrón que entrenamiento)', async () => {
    const c = await circuitoConPlanActivo(app, `dsh-nut-obj-${++contador}`);
    const objetivoNuevo = cuerpoDeObjetivo(c.evaluationId, 1950);
    const respuesta = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/objectives`).send(objetivoNuevo).expect(201);

    const d = (await leer(c.pro, c.ase.id)).domains.nutrition;
    if (!d.available || !d.summary) throw new Error('debería haber resumen');
    // El nuevo objetivo, emitido después de activar el plan, es el que el resumen tiene que mostrar como vigente.
    expect(d.summary.objective!.objectiveVersionId).toBe(respuesta.body.data.versionId);
    expect(d.summary.objective!.estimatedEnergyRequirement).toMatchObject({ value: 1950 });
  });
});
