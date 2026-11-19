/**
 * ENP-D01, ratificado por Dirección el 19/11 · el nombre de una fase para mostrar. Las fases de planes viejos con el
 * nombre automático «Bloque N» se leen «Fase N»; un nombre propio queda tal cual y el dato guardado no cambia.
 *
 * Uso: npm run test -w @be/domain (después de construirlo).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { conNombresDeFase, nombreDeLaFase } from './copy-entrenamiento';

test('ENP-D01 · «Bloque N» automático se lee «Fase N»; un nombre propio, tal cual; sin nombre, «Fase N» por su lugar', () => {
  assert.equal(nombreDeLaFase('Bloque 1'), 'Fase 1');
  assert.equal(nombreDeLaFase(' Bloque 12 ', 4), 'Fase 12');
  assert.equal(nombreDeLaFase('Bloque de fuerza'), 'Bloque de fuerza');
  assert.equal(nombreDeLaFase('Bloque A'), 'Bloque A');
  assert.equal(nombreDeLaFase('Pretemporada', 0), 'Pretemporada');
  assert.equal(nombreDeLaFase('', 1), 'Fase 2');
  assert.equal(nombreDeLaFase('  '), '');
});

test('ENP-D01 · las lecturas reciben copias con el nombre para mostrar: lo guardado no cambia', () => {
  const guardadas = [{ blockId: 'b1', label: 'Bloque 1', purpose: 'Base' }, { blockId: 'b2', label: 'Hipertrofia', purpose: null }, { blockId: 'b3', label: '', purpose: null }];
  const antes = structuredClone(guardadas);
  assert.deepEqual(conNombresDeFase(guardadas).map((b) => b.label), ['Fase 1', 'Hipertrofia', 'Fase 3']);
  assert.equal(conNombresDeFase(guardadas)[0]!.purpose, 'Base');
  assert.deepEqual(guardadas, antes);
});
