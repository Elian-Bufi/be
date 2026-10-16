/**
 * El buscador de los catálogos contra PostgreSQL real: la búsqueda por nombre no depende de tildes, eñes ni mayúsculas
 * («sandia» encuentra «Sandía»), y los comodines siguen escapados (pedido de Dirección del 2026-10-16; DL-098 es la
 * parte de los proveedores externos). Alimentos (API-NUT-13 y su búsqueda) y ejercicios (API-TRN-13 y su búsqueda).
 */
import type { INestApplication } from '@nestjs/common';
import { appDePrueba, conSesion } from './soporte-api';
import { prepararProfesional } from './soporte-vinculo';

let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
});

const composicion = { referenceAmount: '100g', energyKcal: 30, proteinG: 0.6, carbohydrateG: 7.6, fatG: 0.2 };

describe('el buscador de los catálogos, sin tildes', () => {
  it('alimentos: «sandia» y «SANDÍA» encuentran «Sandía sintética»; «pina» encuentra «Piña sintética»; un comodín no comodinea', async () => {
    const pro = await prepararProfesional(app, 'busqueda-nut', ['NUTRICION']);
    const nut = conSesion(app, pro.token);
    await nut.post('/api/v1/nutrition/catalog-items').send({ name: 'Sandía sintética', itemType: 'FOOD', composition: composicion }).expect(201);
    await nut.post('/api/v1/nutrition/catalog-items').send({ name: 'Piña sintética', itemType: 'FOOD', composition: composicion }).expect(201);
    const buscar = async (q: string) => ((await nut.post('/api/v1/nutrition/catalog-items/search').send({ q, limit: 50 }).expect(200)).body.data as { name: string }[]).map((i) => i.name);
    expect(await buscar('sandia')).toContain('Sandía sintética');
    expect(await buscar('SANDÍA SINT')).toContain('Sandía sintética');
    expect(await buscar('pina sint')).toContain('Piña sintética');
    // La lectura con el texto en la URL (API-NUT-13) busca igual.
    const porUrl = ((await nut.get(`/api/v1/nutrition/catalog-items?q=${encodeURIComponent('sandía')}&limit=50`).expect(200)).body.data as { name: string }[]).map((i) => i.name);
    expect(porUrl).toContain('Sandía sintética');
    // «%» y «_» se buscan como letras, no como comodines.
    expect(await buscar('sand%a')).not.toContain('Sandía sintética');
    expect(await buscar('pi_a')).not.toContain('Piña sintética');
  });

  it('ejercicios: «elevacion» encuentra «Elevación de talones sintética»', async () => {
    const pro = await prepararProfesional(app, 'busqueda-trn', ['ENTRENAMIENTO']);
    const trn = conSesion(app, pro.token);
    await trn.post('/api/v1/training/exercises').send({ name: 'Elevación de talones sintética', muscleZones: [], didacticResources: [], provenance: { type: 'MANUAL_ENTRY' } }).expect(201);
    const nombres = ((await trn.post('/api/v1/training/exercises/search').send({ q: 'elevacion de tal', limit: 50 }).expect(200)).body.data as { name: string }[]).map((e) => e.name);
    expect(nombres).toContain('Elevación de talones sintética');
  });
});
