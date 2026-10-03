/** Lecturas recordadas durante una sesión de la APK (`lecturas-de-la-sesion.ts`): aislamiento, olvido y respuestas tardías. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Resultado } from './cliente-http';
import { clasificarFalla, crearMemoriaDeLecturas } from './lecturas-de-la-sesion';

type Falla = Exclude<Resultado<unknown>, { ok: true }>;
const api = (status: number, codigo: string): Falla => ({ ok: false, tipo: 'API', status, codigo, issues: [] });

test('una sesión nunca ve lo que leyó otra, y volver al token anterior no lo recupera', () => {
  const m = crearMemoriaDeLecturas();
  assert.equal(m.guardar('token-a', m.marca('token-a'), 'mi-evolucion', { toma: 1 }), true);
  assert.deepEqual(m.leer('token-a', 'mi-evolucion'), { toma: 1 });
  assert.equal(m.leer('token-b', 'mi-evolucion'), undefined);
  assert.equal(m.leer('token-a', 'mi-evolucion'), undefined);
});

test('una respuesta pedida antes de cerrar la sesión llega tarde y no repuebla nada', () => {
  const m = crearMemoriaDeLecturas();
  const marca = m.marca('token-a');
  m.olvidarLaSesion();
  assert.equal(m.guardar('token-a', marca, 'mi-evolucion', { toma: 1 }), false);
  assert.equal(m.leer('token-a', 'mi-evolucion'), undefined);
});

test('una respuesta de la sesión anterior no se guarda en la nueva, aunque llegue después de iniciarla', () => {
  const m = crearMemoriaDeLecturas();
  const deLaAnterior = m.marca('token-a');
  m.olvidarLaSesion();
  m.marca('token-b');
  assert.equal(m.guardar('token-a', deLaAnterior, 'mi-evolucion', { de: 'a' }), false);
  assert.equal(m.leer('token-b', 'mi-evolucion'), undefined);
});

test('escribir olvida todas las lecturas y descarta las que estaban en camino; las selecciones quedan hasta cerrar la sesión', () => {
  const m = crearMemoriaDeLecturas();
  m.guardar('token-a', m.marca('token-a'), 'hoy-nutricional:', { comidas: 3 });
  m.recordarSeleccion('token-a', 'mi-evolucion:familia', 'PLIEGUE');
  const enCamino = m.marca('token-a');
  m.olvidarLecturas();
  assert.equal(m.leer('token-a', 'hoy-nutricional:'), undefined);
  assert.equal(m.guardar('token-a', enCamino, 'entrenamiento-hoy', { sesiones: 1 }), false);
  assert.equal(m.leerSeleccion('token-a', 'mi-evolucion:familia'), 'PLIEGUE');
  m.olvidarLaSesion();
  assert.equal(m.leerSeleccion('token-a', 'mi-evolucion:familia'), undefined);
});

test('olvidar una clave (la API negó el acceso) no toca las demás', () => {
  const m = crearMemoriaDeLecturas();
  const marca = m.marca('token-a');
  m.guardar('token-a', marca, 'mi-evolucion', 1);
  m.guardar('token-a', marca, 'mis-solicitudes', 2);
  m.olvidar('mi-evolucion');
  assert.equal(m.leer('token-a', 'mi-evolucion'), undefined);
  assert.equal(m.leer('token-a', 'mis-solicitudes'), 2);
});

test('con el tope lleno sale primero lo que se guardó hace más tiempo; volver a guardar lo renueva', () => {
  const m = crearMemoriaDeLecturas(2);
  const marca = m.marca('token-a');
  m.guardar('token-a', marca, 'a', 1);
  m.guardar('token-a', marca, 'b', 2);
  m.guardar('token-a', marca, 'a', 3);
  m.guardar('token-a', marca, 'c', 4);
  assert.equal(m.leer('token-a', 'b'), undefined);
  assert.equal(m.leer('token-a', 'a'), 3);
  assert.equal(m.leer('token-a', 'c'), 4);
});

test('solo un código de sesión cierra la sesión: un 403, un 429, un 503 o la falta de red no', () => {
  for (const codigo of ['AUTHENTICATION_REQUIRED', 'SESSION_INVALID', 'SESSION_EXPIRED', 'SESSION_REVOKED']) assert.equal(clasificarFalla(api(401, codigo)), 'sesion');
  assert.equal(clasificarFalla({ ok: false, tipo: 'RED' }), 'pasajera');
  assert.equal(clasificarFalla(api(429, 'RATE_LIMITED')), 'pasajera');
  assert.equal(clasificarFalla(api(503, 'DB_UNAVAILABLE')), 'pasajera');
  assert.equal(clasificarFalla(api(502, 'RESPUESTA_NO_RECONOCIDA')), 'pasajera');
  assert.equal(clasificarFalla(api(403, 'ACTION_FORBIDDEN')), 'acceso');
  assert.equal(clasificarFalla(api(404, 'RESOURCE_NOT_FOUND')), 'acceso');
  assert.equal(clasificarFalla(api(409, 'VERSION_CONFLICT')), 'otra');
  assert.equal(clasificarFalla(api(200, 'RESPUESTA_NO_RECONOCIDA')), 'otra');
});
