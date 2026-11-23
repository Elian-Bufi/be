/**
 * Las capacidades que declara un cliente (`X-BE-Capabilities`). DL-196 (punto 5): ya no deciden si un plan se activa o se
 * entrega (salieron `planExigeObjetivosPorSerie` y `prescripcionExigeObjetivosPorSerie`); solo moldean la forma de algunas
 * respuestas para quien no las declara.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearClienteBe } from './cliente-http';
import { CAPACIDAD_OBJETIVOS_POR_SERIE, capacidadesDeclaradas, HEADER_DE_CAPACIDADES, valorDeCapacidades } from './compatibilidad-de-clientes';

test('sin la cabecera, o con una que no se entiende, el cliente no declara ninguna capacidad', () => {
  assert.equal(capacidadesDeclaradas(undefined).size, 0);
  assert.equal(capacidadesDeclaradas(null).size, 0);
  assert.equal(capacidadesDeclaradas('').size, 0);
  assert.equal(capacidadesDeclaradas('otra-cosa').size, 0);
  assert.equal(capacidadesDeclaradas(`${CAPACIDAD_OBJETIVOS_POR_SERIE},${'x'.repeat(300)}`).size, 0, 'una cabecera desmedida no se lee');
  assert.deepEqual([...capacidadesDeclaradas(CAPACIDAD_OBJETIVOS_POR_SERIE)], [CAPACIDAD_OBJETIVOS_POR_SERIE]);
  assert.deepEqual([...capacidadesDeclaradas(` futura-1 , ${CAPACIDAD_OBJETIVOS_POR_SERIE} `)], [CAPACIDAD_OBJETIVOS_POR_SERIE]);
  assert.deepEqual([...capacidadesDeclaradas(['futura-1', CAPACIDAD_OBJETIVOS_POR_SERIE])], [CAPACIDAD_OBJETIVOS_POR_SERIE]);
  assert.equal(valorDeCapacidades([CAPACIDAD_OBJETIVOS_POR_SERIE, CAPACIDAD_OBJETIVOS_POR_SERIE]), CAPACIDAD_OBJETIVOS_POR_SERIE);
});

test('el cliente HTTP declara sus capacidades solo si las tiene, en todos los pedidos', async () => {
  const vistos: Headers[] = [];
  const fetch = (async (_url: string, init?: RequestInit) => {
    vistos.push(new Headers(init?.headers));
    return new Response(JSON.stringify({ error: { code: 'RESOURCE_NOT_FOUND', message: 'x' } }), { status: 404, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof globalThis.fetch;
  await crearClienteBe({ baseUrl: '/api/v1', superficie: 'APK', capacidades: [CAPACIDAD_OBJETIVOS_POR_SERIE], fetch }).hoyDeEntrenamiento('token-de-prueba');
  await crearClienteBe({ baseUrl: '/api/v1', superficie: 'APK', fetch }).hoyDeEntrenamiento('token-de-prueba');
  await crearClienteBe({ baseUrl: '/api/v1', superficie: 'WEB', capacidades: [], fetch }).hoyDeEntrenamiento('token-de-prueba');
  assert.equal(vistos[0]!.get(HEADER_DE_CAPACIDADES), CAPACIDAD_OBJETIVOS_POR_SERIE);
  assert.equal(vistos[1]!.get(HEADER_DE_CAPACIDADES), null);
  assert.equal(vistos[2]!.get(HEADER_DE_CAPACIDADES), null);
});
