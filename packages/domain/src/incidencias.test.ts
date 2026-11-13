/**
 * RF-068 (DL-172) · Oráculos de las incidencias administrativas (TEST-INC-001 a 006; docs/paquetes/WP-RF068-RF004-ORACULOS.md).
 * Escritos antes que el servicio y verificados con mutación: cada uno falla si se invierte o se quita la regla que cuida.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CATEGORIAS_DE_INCIDENCIA,
  COPY_INCIDENCIAS,
  decidirCambioDeIncidencia,
  ESTADOS_DE_INCIDENCIA,
  numeroDeVersionDeIncidencia,
  problemasDelReporte,
  ultimaRespuesta,
  versionDeIncidencia,
} from './incidencias';
import { CODIGO_INTERNO } from './index';
import { OPERACIONES } from './openapi';

const base = { estadoActual: 'OPEN', versionActual: 0, estadoNuevo: 'IN_PROGRESS', versionEsperada: 'v0', motivo: 'Lo tomo yo.', respuesta: null } as const;

test('TEST-INC-001 · las categorías son las cinco de 04 RF-068 y los estados, los tres del ciclo mínimo', () => {
  assert.deepEqual([...CATEGORIAS_DE_INCIDENCIA], ['ACCESS', 'PROFILE', 'RELATIONSHIP', 'DATA_INTEGRITY', 'APP_FUNCTIONING']);
  assert.deepEqual([...ESTADOS_DE_INCIDENCIA], ['OPEN', 'IN_PROGRESS', 'RESOLVED']);
  for (const c of CATEGORIAS_DE_INCIDENCIA) assert.ok(COPY_INCIDENCIAS.categorias[c]);
  for (const e of ESTADOS_DE_INCIDENCIA) assert.ok(COPY_INCIDENCIAS.propias.estado[e] && COPY_INCIDENCIAS.administracion.estado[e]);
});

test('TEST-INC-002 · el reporte: la descripción es obligatoria, sin contar los espacios, y tiene un tope de 2000 caracteres', () => {
  assert.deepEqual(problemasDelReporte('   '), [{ code: 'DESCRIPTION_REQUIRED', path: 'description' }]);
  assert.deepEqual(problemasDelReporte(undefined), [{ code: 'DESCRIPTION_REQUIRED', path: 'description' }]);
  assert.deepEqual(problemasDelReporte('No me deja entrar.'), []);
  assert.deepEqual(problemasDelReporte(` ${'a'.repeat(2000)} `), []);
  assert.deepEqual(problemasDelReporte('a'.repeat(2001)), [{ code: 'DESCRIPTION_TOO_LONG', path: 'description' }]);
  // Se cuentan caracteres, no unidades de UTF-16: 2000 emojis entran.
  assert.deepEqual(problemasDelReporte('😀'.repeat(2000)), []);
});

test('TEST-INC-003 · un cambio pide el motivo; resolverla, la respuesta para quien la reportó', () => {
  assert.deepEqual(decidirCambioDeIncidencia(base), { tipo: 'CAMBIAR', motivo: 'Lo tomo yo.', respuesta: null });
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, motivo: '  ' }), { tipo: 'INVALIDO', issues: [{ code: 'REASON_REQUIRED', path: 'reason' }] });
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, motivo: 'x'.repeat(1001) }), { tipo: 'INVALIDO', issues: [{ code: 'REASON_TOO_LONG', path: 'reason' }] });
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, estadoNuevo: 'RESOLVED' }), { tipo: 'INVALIDO', issues: [{ code: 'RESPONSE_REQUIRED', path: 'response' }] });
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, estadoNuevo: 'RESOLVED', respuesta: '  Ya está.  ' }), { tipo: 'CAMBIAR', motivo: 'Lo tomo yo.', respuesta: 'Ya está.' });
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, respuesta: 'x'.repeat(2001) }), { tipo: 'INVALIDO', issues: [{ code: 'RESPONSE_TOO_LONG', path: 'response' }] });
  // Pasar a «en curso» con una respuesta también vale: se le avisa a quien la reportó que se está viendo.
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, respuesta: 'Lo estamos viendo.' }), { tipo: 'CAMBIAR', motivo: 'Lo tomo yo.', respuesta: 'Lo estamos viendo.' });
});

test('TEST-INC-004 · contra la versión vista y a otro estado; reabrir una resuelta se puede', () => {
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, versionEsperada: 'v1' }), { tipo: 'VERSION' });
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, versionEsperada: '0' }), { tipo: 'VERSION' });
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, estadoNuevo: 'OPEN' }), { tipo: 'MISMO_ESTADO' });
  assert.deepEqual(decidirCambioDeIncidencia({ ...base, estadoActual: 'RESOLVED', versionActual: 2, versionEsperada: 'v2', estadoNuevo: 'IN_PROGRESS' }), {
    tipo: 'CAMBIAR',
    motivo: 'Lo tomo yo.',
    respuesta: null,
  });
  // Los textos se validan antes que la versión: el 422 dice qué corregir aunque la vista esté vieja.
  assert.equal(decidirCambioDeIncidencia({ ...base, versionEsperada: 'v9', motivo: '' }).tipo, 'INVALIDO');
  assert.equal(versionDeIncidencia(3), 'v3');
  assert.equal(numeroDeVersionDeIncidencia('v12'), 12);
  assert.equal(numeroDeVersionDeIncidencia('v01'), null);
  assert.equal(numeroDeVersionDeIncidencia('w1'), null);
});

test('TEST-INC-005 · quien la reportó ve la última respuesta, aunque se haya reabierto después', () => {
  assert.equal(ultimaRespuesta([]), null);
  assert.equal(ultimaRespuesta([{ numero: 1, respuesta: null }]), null);
  assert.equal(
    ultimaRespuesta([
      { numero: 3, respuesta: null },
      { numero: 2, respuesta: 'Ya quedó.' },
      { numero: 1, respuesta: 'Lo estamos viendo.' },
    ]),
    'Ya quedó.',
  );
  assert.equal(
    ultimaRespuesta([
      { numero: 1, respuesta: 'Lo estamos viendo.' },
      { numero: 2, respuesta: 'Ya quedó.' },
    ]),
    'Ya quedó.',
  );
});

test('TEST-INC-006 · el contrato: la persona reporta y ve lo suyo con sesión; Administración, con el segundo factor', () => {
  const op = (id: string) => OPERACIONES.find((o) => o.id === id);
  assert.deepEqual(
    ['API-INC-01', 'API-INC-02', 'API-INC-03', 'API-INC-04', 'API-INC-05'].map((id) => [id, op(id)?.metodo, op(id)?.ruta, op(id)?.autenticacion]),
    [
      ['API-INC-01', 'post', '/incidents', 'SESSION'],
      ['API-INC-02', 'get', '/me/incidents', 'SESSION'],
      ['API-INC-03', 'post', '/admin/incidents/query', 'SESSION_MFA'],
      ['API-INC-04', 'get', '/admin/incidents/{incidentId}', 'SESSION_MFA'],
      ['API-INC-05', 'post', '/admin/incidents/{incidentId}/updates', 'SESSION_MFA'],
    ],
  );
  assert.equal(op('API-INC-01')?.idempotencia, true);
  assert.equal(op('API-INC-05')?.idempotencia, true);
  for (const o of OPERACIONES.filter((x) => x.id.startsWith('API-INC-'))) assert.ok(o.fuente.includes('DL-172'), o.id);
  // Los textos de la pantalla, sin códigos internos.
  for (const t of Object.values(COPY_INCIDENCIAS.categorias)) assert.doesNotMatch(t, CODIGO_INTERNO);
});
