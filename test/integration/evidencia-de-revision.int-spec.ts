/**
 * DL-154 · la evidencia de una revisión registrada, contra PostgreSQL real (API-NUT-19-EVIDENCIA; la de entrenamiento,
 * en entrenamiento.int-spec.ts). Encargo de consolidación del 2026-10-23, punto 4; hallazgo UX-02 de la auditoría.
 *
 * Lo que fija:
 * - se ve lo que se seleccionó, en su orden, y nada más: una comida del período que no se marcó no aparece;
 * - persiste: una sesión nueva del profesional lee lo mismo;
 * - el sentido histórico: lo que la persona rectificó o deshizo después, y la versión del plan que se activó después,
 *   se dicen con su instante; el registro sigue en la evidencia;
 * - una revisión sin evidencia guardada devuelve la lista vacía, sin completar nada; una referencia que hoy no está en el
 *   seguimiento es NOT_FOUND, sin detalle;
 * - el permiso de hoy: con el consentimiento revocado, otro profesional o una revisión inexistente, el mismo 404;
 * - sin valores de salud ni puntajes en la respuesta.
 */
import type { INestApplication } from '@nestjs/common';
import { EvidenciaDeRevisionResponseSchema, RevisionResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, claveDeIdempotencia, conSesion, tokenDe } from './soporte-api';
import { activar, circuitoConPlanActivo, clavesProhibidas } from './soporte-nutricion';
import { prepararProfesional, revocarB2, vinculoCompleto } from './soporte-vinculo';

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

const ZONA = 'America/Argentina/Buenos_Aires';
const haceDias = (n: number) => new Date(Date.now() - n * 86_400_000);
const fechaCivil = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

/**
 * Un seguimiento con un plan de dos comidas (almuerzo y cena) y registros de dos días hechos desde la APK: anteayer las
 * dos comidas con las porciones del plan; ayer el almuerzo sin confirmar y algo diferente en la cena.
 */
async function escenario(etiqueta: string) {
  const c = await circuitoConPlanActivo(app, `evi-${etiqueta}-${++contador}`);
  const hoy = (await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today/options').expect(200)).body.data;
  const [almuerzo, cena] = hoy.meals as { mealId: string; label: string; options: { optionId: string }[] }[];
  const dayTypeId = hoy.dayTypes[0].dayTypeId as string;
  const opcion = async (comida: { mealId: string; options: { optionId: string }[] }, ocurrio: Date, status: string) =>
    (
      await conSesion(app, c.ase.token)
        .post('/api/v1/me/nutrition/meal-records', claveDeIdempotencia())
        .send({ kind: 'PLAN_OPTION', activePlanId: c.planId, dayTypeId, mealId: comida.mealId, optionId: comida.options[0]!.optionId, occurredAt: ocurrio.toISOString(), consumption: { status }, observation: null })
        .expect(201)
    ).body.data as { recordId: string; version: string };
  const almuerzoAnteayer = await opcion(almuerzo!, haceDias(2), 'PLAN_PORTIONS');
  const cenaAnteayer = await opcion(cena!, haceDias(2), 'PLAN_PORTIONS');
  const almuerzoAyer = await opcion(almuerzo!, haceDias(1), 'UNCONFIRMED');
  const diferenteAyer = (
    await conSesion(app, c.ase.token)
      .post('/api/v1/me/nutrition/meal-records', claveDeIdempotencia())
      .send({ kind: 'DIFFERENT', activePlanId: c.planId, dayTypeId, mealId: cena!.mealId, occurredAt: haceDias(1).toISOString(), description: 'Una pizza con amigos', approximateQuantity: null, mediaIds: [] })
      .expect(201)
  ).body.data as { recordId: string };
  return { c, almuerzo: almuerzo!, cena: cena!, almuerzoAnteayer, cenaAnteayer, almuerzoAyer, diferenteAyer };
}

type Escenario = Awaited<ReturnType<typeof escenario>>;

/** La revisión del profesional, con las dos comidas de anteayer, el almuerzo de ayer, el plan y el objetivo. */
async function revisar(e: Escenario, resultado = 'MAINTAIN') {
  const r = await conSesion(app, e.c.pro.token)
    .post(`/api/v1/advisees/${e.c.ase.id}/nutrition/reviews`, claveDeIdempotencia())
    .send({
      period: { start: fechaCivil(haceDias(2)), end: fechaCivil(haceDias(1)), timeZone: ZONA },
      evidenceReferences: [
        { type: 'EXECUTION', id: e.almuerzoAnteayer.recordId },
        { type: 'EXECUTION', id: e.cenaAnteayer.recordId },
        { type: 'EXECUTION', id: e.almuerzoAyer.recordId },
        { type: 'PLAN_VERSION', id: e.c.planId },
        { type: 'OBJECTIVE_VERSION', id: e.c.objectiveVersionId },
      ],
      interpretation: 'Registró las dos comidas anteayer; ayer, el almuerzo sin cantidades. Interpretación no diagnóstica.',
      result: resultado,
      rationale: 'Fundamento sintético.',
      nextAction: { description: 'Seguir con el plan.' },
    })
    .expect(201);
  return RevisionResponseSchema.parse(r.body).data;
}

const evidencia = async (token: string, reviewId: string) => EvidenciaDeRevisionResponseSchema.parse((await conSesion(app, token).get(`/api/v1/nutrition/reviews/${reviewId}/evidence`).expect(200)).body).data;

describe('API-NUT-19-EVIDENCIA · la evidencia de una revisión registrada (DL-154)', () => {
  it('lo seleccionado, en su orden y nada más; persiste en otra sesión; sin cantidades ni puntajes', async () => {
    const e = await escenario('sel');
    const rev = await revisar(e);
    const r = await evidencia(e.c.pro.token, rev.reviewId);
    expect(r).toMatchObject({ reviewId: rev.reviewId, area: 'NUTRITION', recordedAt: rev.recordedAt, period: rev.period });
    expect(r.items.map((i) => i.reference)).toEqual(rev.evidenceReferences);
    expect(r.items.map((i) => [i.state, i.what])).toEqual([
      ['AVAILABLE', { kind: 'MEAL_RECORD', meal: e.almuerzo.label, recordKind: 'PLAN_OPTION' }],
      ['AVAILABLE', { kind: 'MEAL_RECORD', meal: e.cena.label, recordKind: 'PLAN_OPTION' }],
      ['AVAILABLE', { kind: 'MEAL_RECORD', meal: e.almuerzo.label, recordKind: 'PLAN_OPTION' }],
      ['AVAILABLE', { kind: 'PLAN_VERSION', number: 1 }],
      ['AVAILABLE', { kind: 'OBJECTIVE_VERSION' }],
    ]);
    expect(r.items[0]).toMatchObject({ source: { type: 'MEAL_RECORD', id: e.almuerzoAnteayer.recordId }, occurredDate: fechaCivil(haceDias(2)), changesAfterReview: [] });
    expect(r.items[3]!.source).toEqual({ type: 'NUTRITION_PLAN_VERSION', id: e.c.planId });
    // La comida diferente de ayer está en el período, pero no se marcó: no es evidencia de esta revisión.
    expect(JSON.stringify(r)).not.toContain(e.diferenteAyer.recordId);
    expect(clavesProhibidas(r)).toEqual([]);
    expect(JSON.stringify(r)).not.toMatch(/"(quantity|consumed|energyKcal|items)":\s*\{/);
    // Volver a entrar: otra sesión del mismo profesional lee lo mismo (está guardado, no armado en el navegador).
    const otraSesion = await tokenDe(app, e.c.pro.correo, 'WEB');
    expect(await evidencia(otraSesion, rev.reviewId)).toEqual(r);
  });

  it('lo que cambió después de la revisión se dice con su instante, y el registro sigue en la evidencia', async () => {
    const e = await escenario('desp');
    const rev = await revisar(e, 'ADJUST');
    // Después de revisar: la persona confirma las cantidades del almuerzo de ayer y deshace la cena de anteayer.
    await conSesion(app, e.c.ase.token).post(`/api/v1/nutrition/meal-records/${e.almuerzoAyer.recordId}/consumed-quantities`).send({ consumption: { status: 'PLAN_PORTIONS' }, expectedVersion: e.almuerzoAyer.version }).expect(201);
    await conSesion(app, e.c.ase.token).post(`/api/v1/nutrition/meal-records/${e.cenaAnteayer.recordId}/annulment`).send({ reason: 'Me equivoqué de día', expectedVersion: e.cenaAnteayer.version }).expect(201);
    // Y el profesional aplica la revisión (AJUSTAR) y activa la versión sucesora del plan.
    const aplicada = (await conSesion(app, e.c.pro.token).post(`/api/v1/nutrition/reviews/${rev.reviewId}/apply`, claveDeIdempotencia()).send({ expectedVersion: 'v1' }).expect(200)).body.data.application;
    const sucesora = (await conSesion(app, e.c.pro.token).get(`/api/v1/nutrition/plans/${aplicada.createdPlanId}`).expect(200)).body.data;
    await activar(app, e.c.pro, aplicada.createdPlanId, sucesora.version).expect(200);

    const r = await evidencia(e.c.pro.token, rev.reviewId);
    const de = (id: string) => r.items.find((i) => i.reference.id === id)!;
    expect(r.items).toHaveLength(5);
    expect(de(e.almuerzoAnteayer.recordId).changesAfterReview).toEqual([]);
    expect(de(e.almuerzoAyer.recordId).changesAfterReview.map((c) => c.kind)).toEqual(['RECTIFIED']);
    expect(de(e.cenaAnteayer.recordId)).toMatchObject({ state: 'AVAILABLE', changesAfterReview: [{ kind: 'ANNULLED' }] });
    expect(de(e.c.planId).changesAfterReview.map((c) => c.kind)).toEqual(['SUCCEEDED']);
    for (const i of r.items) for (const c of i.changesAfterReview) expect(new Date(c.at).getTime()).toBeGreaterThan(new Date(rev.recordedAt).getTime());
  });

  it('una revisión sin evidencia guardada no se completa con el período; una referencia que hoy no está es NOT_FOUND', async () => {
    const e = await escenario('vacia');
    const rev = await revisar(e);
    // Revisiones anteriores a esta regla, sembradas como estarían en la base: una sin evidencia y otra con una referencia
    // que no es de este seguimiento. La API no deja registrarlas así (REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE).
    const fila = await prisma.revisionNutricional.findUniqueOrThrow({ where: { id: rev.reviewId } });
    const crear = (evidencias: unknown) =>
      prisma.revisionNutricional.create({
        data: {
          procesoId: fila.procesoId,
          periodoInicio: fila.periodoInicio,
          periodoFin: fila.periodoFin,
          zonaHoraria: fila.zonaHoraria,
          evidencias: evidencias as never,
          interpretacion: 'Revisión sembrada por la prueba.',
          resultado: fila.resultado,
          fundamento: 'Sembrada.',
          proximaAccion: fila.proximaAccion as never,
          autorId: fila.autorId,
          procedencia: { prueba: 'DL-154' } as never,
        },
      });
    const sinEvidencia = await crear([]);
    expect((await evidencia(e.c.pro.token, sinEvidencia.id)).items).toEqual([]);
    const ajena = randomUUID();
    const conAjena = await crear([
      { type: 'EXECUTION', id: e.almuerzoAnteayer.recordId },
      { type: 'EXECUTION', id: ajena },
    ]);
    const r = await evidencia(e.c.pro.token, conAjena.id);
    expect(r.items.map((i) => [i.reference.id, i.state])).toEqual([
      [e.almuerzoAnteayer.recordId, 'AVAILABLE'],
      [ajena, 'NOT_FOUND'],
    ]);
    expect(r.items[1]).toEqual({ reference: { type: 'EXECUTION', id: ajena }, state: 'NOT_FOUND', source: null, occurredDate: null, occurredAt: null, what: null, changesAfterReview: [] });
  });

  it('el permiso de hoy: consentimiento revocado, otro profesional o revisión inexistente dan el mismo 404; una consulta inválida, 400', async () => {
    const e = await escenario('perm');
    const rev = await revisar(e);
    const ruta = `/api/v1/nutrition/reviews/${rev.reviewId}/evidence`;
    await conSesion(app, e.c.pro.token).get(`${ruta}?periodStart=2026-01-01`).expect(400);
    const inexistente = await conSesion(app, e.c.pro.token).get(`/api/v1/nutrition/reviews/${randomUUID()}/evidence`).expect(404);
    const otro = await prepararProfesional(app, `evi-otro-${contador}`, ['NUTRICION']);
    await vinculoCompleto(app, otro, e.c.ase, 'NUTRICION');
    const deOtro = await conSesion(app, otro.token).get(ruta).expect(404);
    expect(deOtro.body.error.code).toBe(inexistente.body.error.code);
    // La persona retira el consentimiento de Nutrición: una referencia vieja no concede acceso.
    await revocarB2(app, e.c.ase, e.c.consentId).expect(200);
    const revocado = await conSesion(app, e.c.pro.token).get(ruta).expect(404);
    expect(revocado.body.error.code).toBe(inexistente.body.error.code);
    expect(JSON.stringify(revocado.body)).not.toContain(e.almuerzoAnteayer.recordId);
    // Igual que la revisión misma (API-NUT-19): el mismo criterio.
    await conSesion(app, e.c.pro.token).get(`/api/v1/nutrition/reviews/${rev.reviewId}`).expect(404);
  });
});
