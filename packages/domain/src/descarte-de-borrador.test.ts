/**
 * Descartar un borrador (`descarte-de-borrador.ts`; DL-163 D-21; TB-47). TEST-TAG-029, la parte del dominio: qué versión
 * se descarta, que lo descartado no ocupe lugar en la cadena y que nunca se lea como borrador.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cadenaSinDescartadas, esVersionVisible, estadoDeVersionDePlanApi, evaluarDescarteDeBorrador, type EstadoDeVersionConDescarte } from './descarte-de-borrador';
import { TRANSICIONES_DE_VERSION_DE_PLAN_DE_ENTRENAMIENTO } from './entrenamiento';
import { TRANSICIONES_DE_VERSION_DE_PLAN } from './nutricion';
import { evaluarSucesion } from './versionado';

test('TEST-TAG-029 · solo un borrador se descarta; una versión activada, nunca', () => {
  assert.deepEqual(evaluarDescarteDeBorrador('BORRADOR'), { permitido: true });
  assert.deepEqual(evaluarDescarteDeBorrador('ACTIVADA'), { permitido: false, motivo: 'YA_ACTIVADA' });
});

test('TEST-TAG-029 · lo descartado o inexistente responde igual: descartar dos veces no revela nada', () => {
  assert.deepEqual(evaluarDescarteDeBorrador('DESCARTADA'), { permitido: false, motivo: 'NO_VISIBLE' });
  assert.deepEqual(evaluarDescarteDeBorrador(null), { permitido: false, motivo: 'NO_VISIBLE' });
  assert.equal(esVersionVisible('DESCARTADA'), false);
  assert.equal(esVersionVisible('BORRADOR'), true);
  assert.equal(esVersionVisible('ACTIVADA'), true);
});

const version = (id: string, predecesoraId: string | null, estado: EstadoDeVersionConDescarte) => ({ id, objetoId: 'plan', predecesoraId, estado });

test('TEST-TAG-029 · un plan que nunca se activó: después de descartar, el borrador nuevo vuelve a ser la raíz', () => {
  const versiones = [version('b1', null, 'DESCARTADA')];
  // Sin sacar lo descartado, el borrador viejo seguiría ocupando la raíz.
  assert.deepEqual(evaluarSucesion(versiones, { objetoId: 'plan', predecesoraId: null }), { valida: false, motivo: 'PRIMERA_YA_EXISTE' });
  assert.deepEqual(evaluarSucesion(cadenaSinDescartadas(versiones), { objetoId: 'plan', predecesoraId: null }), { valida: true });
});

test('TEST-TAG-029 · un plan activado: después de descartar, el borrador nuevo vuelve a ser la sucesora de la vigente', () => {
  const versiones = [version('v1', null, 'ACTIVADA'), version('b1', 'v1', 'DESCARTADA'), version('b2', 'v1', 'DESCARTADA')];
  assert.deepEqual(evaluarSucesion(versiones, { objetoId: 'plan', predecesoraId: 'v1' }), { valida: false, motivo: 'BIFURCACION' });
  assert.deepEqual(evaluarSucesion(cadenaSinDescartadas(versiones), { objetoId: 'plan', predecesoraId: 'v1' }), { valida: true });
  // Un borrador vivo sigue frenando la bifurcación: descartar no abre ramas.
  const conBorrador = [...versiones, version('b3', 'v1', 'BORRADOR')];
  assert.deepEqual(evaluarSucesion(cadenaSinDescartadas(conBorrador), { objetoId: 'plan', predecesoraId: 'v1' }), { valida: false, motivo: 'BIFURCACION' });
  // Lo activado nunca sale de la cadena.
  assert.deepEqual(cadenaSinDescartadas(conBorrador).map((v) => v.id), ['v1', 'b3']);
});

test('TEST-TAG-029 · una versión descartada nunca se lee como borrador: la lectura falla cerrada', () => {
  assert.equal(estadoDeVersionDePlanApi('BORRADOR'), 'DRAFT');
  assert.equal(estadoDeVersionDePlanApi('ACTIVADA'), 'ACTIVATED');
  assert.throws(() => estadoDeVersionDePlanApi('DESCARTADA'), /descartada no se lee/);
});

test('06 §10.7 · la máquina literal no cambia: DESCARTADA es una extensión aparte (TA-64)', () => {
  for (const t of [...TRANSICIONES_DE_VERSION_DE_PLAN, ...TRANSICIONES_DE_VERSION_DE_PLAN_DE_ENTRENAMIENTO]) {
    assert.notEqual(t.destino as string, 'DESCARTADA');
    assert.notEqual(t.origen as string | null, 'DESCARTADA');
  }
});
