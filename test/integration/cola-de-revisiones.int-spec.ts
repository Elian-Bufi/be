/**
 * WP-TABLERO-ALTA-GAMA · TB-13 y TB-14 (DL-163 D-6): la cartera con la definición de pendiente del dominio de revisión
 * y la cola de revisiones (API-DSH-02, 09 v0.11 §14).
 *
 * - TEST-TAG-011 · la divergencia y el seguimiento finalizado: una revisión aplicada como «Mantener» sin fecha nueva no
 *   sigue como vencida en API-CAR-01, y un seguimiento cerrado con «Finalizar» no vuelve como «Sin plan activo». La
 *   forma de API-CAR-01 no cambia (la valida su schema estricto).
 * - TEST-TAG-012 · la cola, con sus dos estados: «Próxima acción pendiente» primero y «Sin revisión acordada» último;
 *   abrirla no resuelve nada; lo ajeno no aparece.
 */
import type { INestApplication } from '@nestjs/common';
import { CarteraResponseSchema, ColaDeRevisionesResponseSchema, type CarteraResponse, type ColaDeRevisionesResponse } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento } from './soporte-entrenamiento';
import { activar, circuitoListoParaPlanificar, crearBorrador, cuerpoDeRevision, PUNTAJE_PROHIBIDO } from './soporte-nutricion';
import { prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto, type Parte } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
const etiqueta = () => `cola-${++contador}-${randomUUID().slice(0, 4)}`;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const cartera = async (pro: Parte, query = ''): Promise<CarteraResponse> => CarteraResponseSchema.parse((await conSesion(app, pro.token).get(`/api/v1/me/portfolio${query}`).expect(200)).body);
const deLaCartera = (r: CarteraResponse, adviseeId: string) => r.data.items.filter((i) => i.advisee.identityId === adviseeId).map((i) => i.kind);
const cola = async (pro: Parte, query = ''): Promise<ColaDeRevisionesResponse> => ColaDeRevisionesResponseSchema.parse((await conSesion(app, pro.token).get(`/api/v1/me/review-queue${query}`).expect(200)).body);
const deLaCola = (r: ColaDeRevisionesResponse, adviseeId: string) => r.data.filter((i) => i.advisee.identityId === adviseeId);
const enDias = (n: number): string => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const hoyCivil = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

/** Una revisión de Nutrición sobre la versión activada, registrada y, si se pide, aplicada. */
async function revisarNutricion(pro: Parte, adviseeId: string, versionId: string, resultado: string, extra: Record<string, unknown> = {}, aplicar = true): Promise<string> {
  const r = await conSesion(app, pro.token).post(`/api/v1/advisees/${adviseeId}/nutrition/reviews`).send(cuerpoDeRevision([{ type: 'PLAN_VERSION', id: versionId }], resultado, extra)).expect(201);
  const reviewId = r.body.data.reviewId as string;
  if (aplicar) await conSesion(app, pro.token).post(`/api/v1/nutrition/reviews/${reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
  return reviewId;
}

/** Lo mismo en Entrenamiento. */
async function revisarEntrenamiento(pro: Parte, adviseeId: string, versionId: string, resultado: string, extra: Record<string, unknown> = {}, aplicar = true): Promise<string> {
  const hoy = hoyCivil();
  const cuerpo = {
    period: { start: hoy, end: hoy, timeZone: 'America/Argentina/Buenos_Aires' },
    evidenceReferences: [{ type: 'PLAN_VERSION', id: versionId }],
    interpretation: 'Registró las sesiones del bloque. Interpretación sintética.',
    result: resultado,
    rationale: 'Fundamento sintético del profesional.',
    nextAction: { description: 'Próxima acción sintética.', ...extra },
  };
  const r = await conSesion(app, pro.token).post(`/api/v1/advisees/${adviseeId}/training/reviews`).send(cuerpo).expect(201);
  const reviewId = r.body.data.reviewId as string;
  if (aplicar) await conSesion(app, pro.token).post(`/api/v1/training/reviews/${reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
  return reviewId;
}

describe('TEST-TAG-011 · TB-13: la cartera con la definición de pendiente del dominio de revisión', () => {
  it('una revisión aplicada como «Mantener» sin fecha nueva no sigue como vencida; con fecha nueva, la nueva manda', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    const a = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    const bA = await crearBorrador(app, a, { nextReviewAt: '2026-01-15' });
    await activar(app, pro, bA.planId, bA.version).expect(200);
    expect(deLaCartera(await cartera(pro), a.ase.id)).toEqual(['REVIEW_OVERDUE']);

    await revisarNutricion(pro, a.ase.id, bA.planId, 'MAINTAIN');
    // Lo que dice el dominio de revisión (API-NUT-17, `pendingReview`): ya no hay una revisión pendiente.
    const contexto = await conSesion(app, pro.token).get(`/api/v1/advisees/${a.ase.id}/nutrition/review-context`).expect(200);
    expect(contexto.body.data.pendingReview).toEqual({ pending: false, since: null });
    // Y la cartera dice lo mismo: no sigue como vencida, ni como ningún otro pendiente de revisión.
    expect(deLaCartera(await cartera(pro), a.ase.id)).toEqual([]);

    // Otra persona: «Mantener» con una fecha nueva cercana deja la próxima, no la vencida.
    const b = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    const bB = await crearBorrador(app, b, { nextReviewAt: '2026-01-15' });
    await activar(app, pro, bB.planId, bB.version).expect(200);
    await revisarNutricion(pro, b.ase.id, bB.planId, 'MAINTAIN', { nextReviewAt: enDias(3) });
    expect(deLaCartera(await cartera(pro), b.ase.id)).toEqual(['REVIEW_DUE_SOON']);

    // Una revisión registrada y sin aplicar no resuelve nada: la vencida sigue.
    const c = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    const bC = await crearBorrador(app, c, { nextReviewAt: '2026-01-15' });
    await activar(app, pro, bC.planId, bC.version).expect(200);
    await revisarNutricion(pro, c.ase.id, bC.planId, 'MAINTAIN', {}, false);
    expect(deLaCartera(await cartera(pro), c.ase.id)).toEqual(['REVIEW_OVERDUE']);
  });

  it('un seguimiento cerrado con «Finalizar» no vuelve como «Sin plan activo»', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const b = await crearBorradorDeEntrenamiento(app, c, { nextReviewAt: enDias(20) });
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
    expect(deLaCartera(await cartera(c.pro), c.ase.id)).toEqual([]);

    await revisarEntrenamiento(c.pro, c.ase.id, b.planId, 'FINALIZE', { description: 'Cierre del seguimiento.' });
    const r = await cartera(c.pro);
    expect(deLaCartera(r, c.ase.id)).toEqual([]);
    expect(JSON.stringify(r)).not.toMatch(PUNTAJE_PROHIBIDO);
  });
});

describe('TEST-TAG-012 · TB-14: la cola de revisiones (API-DSH-02), con sus dos estados', () => {
  it('«Próxima acción pendiente» primero, «Revisión pendiente» en el medio y «Sin revisión acordada» al final; lo programado no entra', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    const conPlan = async (extra: Record<string, unknown> = {}) => {
      const c = await circuitoListoParaPlanificar(app, etiqueta(), pro);
      const b = await crearBorrador(app, c, extra);
      await activar(app, pro, b.planId, b.version).expect(200);
      return { ...c, versionId: b.planId };
    };
    // A: revisión registrada y sin aplicar. B: revisión acordada vencida. C: plan activo sin revisión acordada.
    // D: «Mantener» aplicado sin fecha nueva sobre una vencida. E: revisión acordada a 30 días. F: solo un borrador.
    const a = await conPlan({ nextReviewAt: '2026-01-15' });
    const revisionDeA = await revisarNutricion(pro, a.ase.id, a.versionId, 'MAINTAIN', {}, false);
    const b = await conPlan({ nextReviewAt: '2026-01-15' });
    const c = await conPlan();
    const d = await conPlan({ nextReviewAt: '2026-01-15' });
    const revisionDeD = await revisarNutricion(pro, d.ase.id, d.versionId, 'MAINTAIN');
    const e = await conPlan({ nextReviewAt: enDias(30) });
    const f = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    await crearBorrador(app, f);

    const revisionesDelProfesional = () => prisma.revisionNutricional.count({ where: { proceso: { profesionalId: pro.id } } });
    const revisionesAntes = await revisionesDelProfesional();
    const r = await cola(pro);
    const hoy = hoyCivil();
    expect(r.data.map((i) => i.reason.code)).toEqual(['NEXT_ACTION_PENDING', 'REVIEW_DUE', 'ACTIVE_PLAN_WITHOUT_REVIEW', 'ACTIVE_PLAN_WITHOUT_REVIEW']);
    expect(deLaCola(r, a.ase.id)).toEqual([
      expect.objectContaining({
        domain: 'NUTRITION',
        pendingSince: hoy,
        agreedReviewDate: '2026-01-15',
        sourceReferences: [
          { type: 'REVIEW', id: revisionDeA },
          { type: 'PLAN_VERSION', id: a.versionId },
        ],
      }),
    ]);
    expect(deLaCola(r, b.ase.id)).toEqual([expect.objectContaining({ reason: { code: 'REVIEW_DUE' }, pendingSince: '2026-01-15', agreedReviewDate: '2026-01-15', sourceReferences: [{ type: 'PLAN_VERSION', id: b.versionId }] })]);
    expect(deLaCola(r, c.ase.id)).toEqual([expect.objectContaining({ reason: { code: 'ACTIVE_PLAN_WITHOUT_REVIEW' }, pendingSince: hoy, agreedReviewDate: null, sourceReferences: [{ type: 'PLAN_VERSION', id: c.versionId }] })]);
    expect(deLaCola(r, d.ase.id)).toEqual([
      expect.objectContaining({
        reason: { code: 'ACTIVE_PLAN_WITHOUT_REVIEW' },
        agreedReviewDate: null,
        sourceReferences: [
          { type: 'REVIEW', id: revisionDeD },
          { type: 'PLAN_VERSION', id: d.versionId },
        ],
      }),
    ]);
    expect(deLaCola(r, e.ase.id)).toEqual([]);
    expect(deLaCola(r, f.ase.id)).toEqual([]);
    expect(JSON.stringify(r)).not.toMatch(PUNTAJE_PROHIBIDO);

    // Abrirla no resuelve nada: ninguna revisión nueva, y la misma lista otra vez.
    expect(await revisionesDelProfesional()).toBe(revisionesAntes);
    expect((await cola(pro)).data).toEqual(r.data);
    // API-CAR-01 no cambia de forma: la cartera sigue diciendo lo suyo, validada con su schema estricto.
    expect(deLaCartera(await cartera(pro), b.ase.id)).toEqual(['REVIEW_OVERDUE']);
    expect(deLaCartera(await cartera(pro), c.ase.id)).toEqual([]);

    // Los filtros del 09 (`domain` y `status`) y la paginación recorren la misma lista.
    expect((await cola(pro, '?status=REVIEW_DUE')).data.map((i) => i.advisee.identityId)).toEqual([b.ase.id]);
    expect((await cola(pro, '?domain=TRAINING')).data).toEqual([]);
    const p1 = await cola(pro, '?limit=3');
    expect(p1.page).toMatchObject({ limit: 3, hasMore: true });
    const p2 = await cola(pro, `?limit=3&cursor=${encodeURIComponent(p1.page.nextCursor as string)}`);
    expect([...p1.data, ...p2.data]).toEqual(r.data);
    expect(p2.page.hasMore).toBe(false);
  });

  it('Entrenamiento: un plan activo sin revisión acordada entra al final, y al finalizar el seguimiento sale', async () => {
    const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta());
    const b = await crearBorradorDeEntrenamiento(app, c);
    await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
    expect(deLaCola(await cola(c.pro), c.ase.id)).toEqual([expect.objectContaining({ domain: 'TRAINING', reason: { code: 'ACTIVE_PLAN_WITHOUT_REVIEW' }, agreedReviewDate: null })]);
    const revision = await revisarEntrenamiento(c.pro, c.ase.id, b.planId, 'MAINTAIN', {}, false);
    expect(deLaCola(await cola(c.pro), c.ase.id)).toEqual([expect.objectContaining({ reason: { code: 'NEXT_ACTION_PENDING' }, sourceReferences: [{ type: 'REVIEW', id: revision }, { type: 'PLAN_VERSION', id: b.planId }] })]);
    await revisarEntrenamiento(c.pro, c.ase.id, b.planId, 'FINALIZE', { description: 'Cierre del seguimiento.' });
    expect(deLaCola(await cola(c.pro), c.ase.id)).toEqual([]);
  });

  it('un área que el PDP deniega no aparece; otro profesional y la persona no ven nada; sin sesión, 401; la query se valida', async () => {
    const pro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    const a = await circuitoListoParaPlanificar(app, etiqueta(), pro);
    const bA = await crearBorrador(app, a);
    await activar(app, pro, bA.planId, bA.version).expect(200);
    expect(deLaCola(await cola(pro), a.ase.id)).toHaveLength(1);

    const otro = await prepararProfesional(app, etiqueta(), ['NUTRICION']);
    expect((await cola(otro)).data).toEqual([]);
    expect((await cola(a.ase)).data).toEqual([]);

    await revocarB2(app, a.ase, a.consentId).expect(200);
    const r = await cola(pro);
    expect(JSON.stringify(r)).not.toContain(a.ase.id);
    // Una persona con vínculo y sin plan no está en la cola: «Empezar el plan» es de la cartera.
    const sinPlan = await prepararAsesorado(app, etiqueta(), { a3: true });
    await vinculoCompleto(app, pro, sinPlan, 'NUTRICION');
    expect(deLaCola(await cola(pro), sinPlan.id)).toEqual([]);

    await conSesion(app, 'token-invalido').get('/api/v1/me/review-queue').expect(401);
    const s = conSesion(app, pro.token);
    expect((await s.get('/api/v1/me/review-queue?foo=1').expect(400)).body.error.code).toBe('INVALID_REQUEST');
    await s.get('/api/v1/me/review-queue?domain=ANTHROPOMETRY').expect(400);
    await s.get('/api/v1/me/review-queue?status=REVIEW_OVERDUE').expect(400);
    await s.get('/api/v1/me/review-queue?limit=0').expect(400);
    expect((await s.get('/api/v1/me/review-queue?cursor=%3F%3F').expect(400)).body.error.code).toBe('INVALID_CURSOR');
  });
});
