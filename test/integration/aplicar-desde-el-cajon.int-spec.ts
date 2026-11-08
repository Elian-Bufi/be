/**
 * WP-TABLERO-ALTA-GAMA TB-15 · TEST-TAG-013 (DL-163 D-6): aplicar desde el cajón «De a una» es aplicar. El cajón del
 * website usa la misma operación que la lista de Revisiones (API-NUT-20; la de Entrenamiento, API-TRN-24, en
 * `entrenamiento.int-spec.ts`, «TEST-TAG-013 · …»), con la clave del intento. Acá se fija lo que esa operación garantiza
 * y el cajón hereda, contra PostgreSQL real:
 * - lo que el cajón lee al abrir el cuadro (API-DSH-03): la revisión registrada y sin aplicar, con `application` en null;
 * - lo que lee antes del botón (API-NUT-19): el resultado, el fundamento y la próxima acción con su fecha;
 * - una versión vieja da el conflicto de siempre (VERSION_CONFLICT) y no aplica nada;
 * - el reintento con la misma Idempotency-Key devuelve la misma respuesta y no aplica dos veces: una sola aplicación y
 *   un solo evento;
 * - otra clave sobre la revisión ya aplicada da REVIEW_ALREADY_APPLIED, y el resumen la muestra aplicada.
 * No toca la API: prueba la que ya existe.
 */
import type { INestApplication } from '@nestjs/common';
import { DashboardResponseSchema, RevisionResponseSchema } from '@be/domain';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { circuitoConPlanActivo, cuerpoDeRevision, registrarComida } from './soporte-nutricion';

let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
});

describe('TEST-TAG-013 · aplicar desde el cajón es aplicar (Nutrición, API-NUT-20)', () => {
  it('la misma clave no aplica dos veces, una versión vieja da el conflicto de siempre y lo leído antes del botón es la revisión', async () => {
    const prisma = app.get(PrismaService);
    const c = await circuitoConPlanActivo(app, 'cajon-aplicar');
    const reg = await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const evidencia = [{ type: 'EXECUTION', id: reg.body.data.executionId as string }];
    const pro = conSesion(app, c.pro.token);
    const registrada = RevisionResponseSchema.parse(
      (await pro.post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN', { nextReviewAt: '2030-01-08' })).expect(201)).body,
    ).data;
    const ruta = `/api/v1/nutrition/reviews/${registrada.reviewId}/apply`;

    // Lo que lee el cajón al abrir el cuadro: registrada y sin aplicar.
    const antes = DashboardResponseSchema.parse((await pro.get(`/api/v1/advisees/${c.ase.id}/dashboard`).expect(200)).body).data.domains.nutrition;
    expect(antes.available && antes.summary?.lastReview).toMatchObject({ reviewId: registrada.reviewId, application: null });

    // Lo que lee antes del botón: el resultado, el fundamento y la próxima acción, con la fecha que deja.
    const leida = RevisionResponseSchema.parse((await pro.get(`/api/v1/nutrition/reviews/${registrada.reviewId}`).expect(200)).body).data;
    expect(leida).toMatchObject({ result: 'MAINTAIN', rationale: 'Fundamento profesional sintético.', nextAction: { description: 'Próxima acción sintética.', nextReviewAt: '2030-01-08' }, application: null });

    // Una versión vieja: el conflicto de siempre, y nada aplicado.
    const vieja = await pro.post(ruta).send({ expectedVersion: 'v2' }).expect(409);
    expect(vieja.body.error.code).toBe('VERSION_CONFLICT');
    expect(await prisma.aplicacionDeRevision.count({ where: { revisionId: registrada.reviewId } })).toBe(0);

    // El intento y su reintento con la misma clave: la misma respuesta, una sola aplicación y un solo evento.
    const clave = claveDeIdempotencia();
    const primera = await pro.post(ruta, clave).send({ expectedVersion: 'v1' }).expect(200);
    const reintento = await pro.post(ruta, clave).send({ expectedVersion: 'v1' }).expect(200);
    expect(reintento.body).toEqual(primera.body);
    expect(primera.body.data.application).toMatchObject({ type: 'CONTINUIDAD', processStateAfter: 'ABIERTO', createdPlanId: null });
    expect(await prisma.aplicacionDeRevision.count({ where: { revisionId: registrada.reviewId } })).toBe(1);
    expect(await prisma.eventoDeProceso.count({ where: { revisionId: registrada.reviewId, tipo: 'ContinuidadOCierreAplicado' } })).toBe(1);

    // Otra clave sobre la revisión ya aplicada: el conflicto de siempre.
    const otra = await pro.post(ruta).send({ expectedVersion: 'v1' }).expect(409);
    expect(otra.body.error.code).toBe('REVIEW_ALREADY_APPLIED');
    expect(await prisma.aplicacionDeRevision.count({ where: { revisionId: registrada.reviewId } })).toBe(1);

    // Al volver a abrir el cuadro, el resumen la muestra aplicada: el cajón ya no pregunta si la aplicás.
    const despues = DashboardResponseSchema.parse((await pro.get(`/api/v1/advisees/${c.ase.id}/dashboard`).expect(200)).body).data.domains.nutrition;
    expect(despues.available && despues.summary?.lastReview?.application).toMatchObject({ appliedAt: expect.any(String) });
  });
});
