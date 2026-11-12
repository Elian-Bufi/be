/**
 * WP-USO-FINAL · UF-07 (DEUDA_LEGAJO DL-169): Ayuda y contacto. Oráculo TEST-UF-017 (`docs/paquetes/WP-USO-FINAL-ORACULOS.md`).
 * API-SOP-01 publica, sin sesión, las direcciones que tiene la configuración, o `null` si no están; no lee la base.
 */
import type { INestApplication } from '@nestjs/common';
import { CanalDeContactoResponseSchema } from '@be/domain';
import request from 'supertest';
import { appDePrueba } from './soporte-api';

let conCanal: INestApplication;
let sinCanal: INestApplication;

beforeAll(async () => {
  conCanal = await appDePrueba({ contacto: { soporte: 'soporte@example.invalid', privacidad: 'privacidad@example.invalid' } });
  sinCanal = await appDePrueba();
});
afterAll(async () => {
  await conCanal.close();
  await sinCanal.close();
});

describe('TEST-UF-017 · el canal de ayuda y contacto sale de la configuración', () => {
  it('con las direcciones cargadas, las publica sin sesión, con una caché pública corta', async () => {
    const r = await request(conCanal.getHttpServer()).get('/api/v1/support/contact').expect(200);
    expect(CanalDeContactoResponseSchema.parse(r.body)).toEqual({ data: { supportEmail: 'soporte@example.invalid', privacyEmail: 'privacidad@example.invalid' } });
    expect(r.headers['cache-control']).toBe('public, max-age=300');
  });

  it('sin configuración, null: ninguna pantalla puede inventar una dirección', async () => {
    const r = await request(sinCanal.getHttpServer()).get('/api/v1/support/contact').set('X-BE-Surface', 'APK').expect(200);
    expect(r.body).toEqual({ data: { supportEmail: null, privacyEmail: null } });
  });

  it('un parámetro de más es 400; con un token inválido responde igual, porque no lo mira', async () => {
    await request(conCanal.getHttpServer()).get('/api/v1/support/contact?x=1').expect(400);
    await request(conCanal.getHttpServer()).get('/api/v1/support/contact').set('Authorization', 'Bearer no-es-un-token').expect(200);
  });
});
