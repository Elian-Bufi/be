/**
 * DL-030 — el website llama a la API cross-origin. CORS con allowlist explícita (07:704-707; nunca `*`):
 * - el origen del website recibe Access-Control-Allow-Origin con los headers del contrato;
 * - cualquier otro origen, no;
 * - los errores del body parser (JSON inválido, cuerpo > 16 kB) también llevan CORS y X-Request-Id, para que el
 *   navegador los lea como error de la API y no como error de red.
 */
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { appDePrueba, claveDeIdempotencia, cuerpoDeRegistro, correoSintetico } from './soporte-api';

const WEBSITE = 'https://website-sintetico.example';
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba({ corsAllowedOrigins: [WEBSITE] });
});
afterAll(async () => {
  await app.close();
});

it('preflight del registro desde el website: 204 con el origen y los headers del contrato', async () => {
  const res = await request(app.getHttpServer())
    .options('/api/v1/registrations')
    .set('Origin', WEBSITE)
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'content-type,idempotency-key,x-be-surface')
    .expect(204);
  expect(res.headers['access-control-allow-origin']).toBe(WEBSITE);
  expect(res.headers['access-control-allow-headers']).toBe('authorization,content-type,idempotency-key,x-be-surface');
  expect(res.headers['access-control-allow-credentials']).toBeUndefined();
});

it('preflight de un DELETE con Authorization (cerrar sesión): permitido desde el website', async () => {
  const res = await request(app.getHttpServer())
    .options('/api/v1/auth/sessions/current')
    .set('Origin', WEBSITE)
    .set('Access-Control-Request-Method', 'DELETE')
    .set('Access-Control-Request-Headers', 'authorization,x-be-surface')
    .expect(204);
  expect(res.headers['access-control-allow-origin']).toBe(WEBSITE);
  expect(res.headers['access-control-allow-methods']).toContain('DELETE');
});

it('otro origen no recibe Access-Control-Allow-Origin (allowlist, nunca `*`)', async () => {
  const res = await request(app.getHttpServer())
    .options('/api/v1/registrations')
    .set('Origin', 'https://ajeno.example')
    .set('Access-Control-Request-Method', 'POST');
  expect(res.headers['access-control-allow-origin']).toBeUndefined();
});

it('una respuesta real al website expone X-Request-Id', async () => {
  const res = await request(app.getHttpServer())
    .post('/api/v1/registrations')
    .set('Origin', WEBSITE)
    .set('Idempotency-Key', claveDeIdempotencia())
    .send(cuerpoDeRegistro(correoSintetico('cors')))
    .expect(201);
  expect(res.headers['access-control-allow-origin']).toBe(WEBSITE);
  expect(res.headers['access-control-expose-headers']).toContain('x-request-id');
});

it.each([
  ['JSON inválido', '{no es json'],
  ['cuerpo mayor a 16 kB', JSON.stringify({ relleno: 'x'.repeat(20_000) })],
])('error del body parser (%s): ErrorEnvelope con CORS y X-Request-Id, no un error de red', async (_caso, cuerpo) => {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/sessions')
    .set('Origin', WEBSITE)
    .set('Content-Type', 'application/json')
    .send(cuerpo);
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe('INVALID_REQUEST');
  expect(res.headers['access-control-allow-origin']).toBe(WEBSITE);
  expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
});
