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
import { CarteraResponseSchema, type CarteraResponse } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { activarPlanDeEntrenamiento, circuitoListoParaPlanificarEntrenamiento, crearBorradorDeEntrenamiento } from './soporte-entrenamiento';
import { activar, circuitoListoParaPlanificar, crearBorrador, cuerpoDeRevision, PUNTAJE_PROHIBIDO } from './soporte-nutricion';
import { prepararProfesional, type Parte } from './soporte-vinculo';

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
