/**
 * REV-A (docs/propuestas/REV-A_revisiones-del-asesorado.md; DEUDA_LEGAJO DL-134) contra PostgreSQL real: la persona lee
 * las revisiones que sus profesionales registraron sobre ella (API-NUT-19-LISTA y PROPIA; las de entrenamiento, iguales,
 * en el contrato).
 * - D1-A: completas, la misma forma que lee el profesional, sin notas ocultas (08 §6.2).
 * - D2-A: desde que se registran, con la aplicación a la vista.
 * - D3-A: con el vínculo terminado siguen ahí (08 §14.3).
 * - D3-bis-A: sin el A3 vigente, 403, como «Tu historial» (08:406). Lo ajeno y lo inexistente, el mismo 404, antes.
 * - La novedad de una revisión lleva a esa revisión.
 */
import type { INestApplication } from '@nestjs/common';
import { ListaDeNovedadesResponseSchema, ListaDeRevisionesPropiasResponseSchema, RevisionResponseSchema } from '@be/domain';
import request from 'supertest';
import { appDePrueba, conSesion } from './soporte-api';
import { circuitoConPlanActivo, cuerpoDeRevision, registrarComida } from './soporte-nutricion';
import { a3Vigente, finalizar, prepararAsesorado, versionDeVinculo } from './soporte-vinculo';

let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
});

/** Un circuito de Nutrición con una revisión registrada por su profesional. */
async function conRevision(etiqueta: string) {
  const c = await circuitoConPlanActivo(app, etiqueta);
  const reg = await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
  const evidencia = [{ type: 'EXECUTION', id: reg.body.data.executionId as string }];
  const r = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN', { nextReviewAt: '2030-01-01' })).expect(201);
  return { ...c, revision: RevisionResponseSchema.parse(r.body).data };
}

describe('REV-A · la persona lee sus revisiones de Nutrición', () => {
  it('completas y solo las propias, con la aplicación a la vista; la novedad de la revisión lleva a ella', async () => {
    const c = await conRevision('reva');
    const ase = conSesion(app, c.ase.token);
    const lista = ListaDeRevisionesPropiasResponseSchema.parse((await ase.get('/api/v1/me/nutrition/reviews').expect(200)).body);
    // La misma revisión que registró el profesional, entera: interpretación, fundamento, próxima acción y autor.
    expect(lista.data).toEqual([c.revision]);
    expect(lista.data[0]!.author.displayName).toBe('Profesional sintético nut-reva');
    const ruta = `/api/v1/me/nutrition/reviews/${c.revision.reviewId}`;
    expect(RevisionResponseSchema.parse((await ase.get(ruta).expect(200)).body).data).toEqual(c.revision);
    expect(c.revision.application).toBeNull();

    // La novedad de la revisión abre esa revisión.
    const novedades = ListaDeNovedadesResponseSchema.parse((await ase.get('/api/v1/me/news').expect(200)).body).data;
    expect(novedades.find((n) => n.kind === 'REVIEW_RECORDED')?.open).toEqual({ view: 'NUTRITION_REVIEW', referenceId: c.revision.reviewId });

    // Aplicada, la aplicación se ve con su fecha.
    await conSesion(app, c.pro.token).post(`/api/v1/nutrition/reviews/${c.revision.reviewId}/apply`).send({ expectedVersion: 'v1' }).expect(200);
    expect(RevisionResponseSchema.parse((await ase.get(ruta).expect(200)).body).data.application).toMatchObject({ type: 'CONTINUIDAD' });

    // Otra persona: el mismo 404, y su lista vacía. El profesional, por /me, tampoco la ve: no es suya como asesorado.
    const otra = await prepararAsesorado(app, 'reva-otra', { a3: true });
    await conSesion(app, otra.token).get(ruta).expect(404);
    expect((await conSesion(app, otra.token).get('/api/v1/me/nutrition/reviews').expect(200)).body.data).toEqual([]);
    await conSesion(app, c.pro.token).get(ruta).expect(404);
    await request(app.getHttpServer()).get('/api/v1/me/nutrition/reviews').expect(401);
  });

  it('con el vínculo terminado siguen ahí; sin el A3 vigente, 403; una inexistente sigue siendo 404', async () => {
    const c = await conRevision('reva-fin');
    const ase = conSesion(app, c.ase.token);
    await finalizar(app, c.ase.token, c.vinculoId, await versionDeVinculo(app, c.ase.token, c.vinculoId)).expect(200);
    expect((await ase.get('/api/v1/me/nutrition/reviews').expect(200)).body.data.map((r: { reviewId: string }) => r.reviewId)).toEqual([c.revision.reviewId]);
    await ase.get(`/api/v1/me/nutrition/reviews/${c.revision.reviewId}`).expect(200);

    await ase.post(`/api/v1/me/health-data-consents/${await a3Vigente(app, c.ase.token)}/revoke`).send({}).expect(200);
    expect((await ase.get('/api/v1/me/nutrition/reviews').expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    await ase.get(`/api/v1/me/nutrition/reviews/${c.revision.reviewId}`).expect(403);
    await ase.get('/api/v1/me/nutrition/reviews/00000000-0000-4000-8000-000000000000').expect(404);
  });
});
