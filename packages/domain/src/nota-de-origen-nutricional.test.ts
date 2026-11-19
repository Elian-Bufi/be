/**
 * Ratificación de Dirección del 19/11 · la nota de origen de un plan de Nutrición dice la versión de la plantilla que se
 * aplicó, no la vigente (como Entrenamiento en #294). Mutación: volver a decir el número de la vigente pone en rojo el
 * caso de la versión anterior.
 *
 * Uso: npm run test -w @be/domain (después de construirlo).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { COPY_PLANTILLAS, notaDeOrigenNutricional } from './copy-plantillas';
import { terminosProhibidosDeEntrenamientoEn } from './copy-entrenamiento';

const VIGENTE = { name: 'Base 3 comidas', versionId: 'v3', versionNumber: 3 };

test('la nota de origen de Nutrición: con la vigente aplicada, su número; con una anterior, nunca el número de la vigente como el aplicado', () => {
  assert.equal(notaDeOrigenNutricional({ templateVersionId: 'v3' }, VIGENTE), COPY_PLANTILLAS.creadaDesde('Base 3 comidas', 3));
  const anterior = notaDeOrigenNutricional({ templateVersionId: 'v1' }, VIGENTE);
  assert.doesNotMatch(anterior, /versión 3\./);
  assert.notEqual(anterior, COPY_PLANTILLAS.creadaDesde('Base 3 comidas', 3));
  assert.match(anterior, /^Creada desde la plantilla «Base 3 comidas», con una versión anterior a la vigente/);
  assert.equal(notaDeOrigenNutricional({ templateVersionId: 'v1' }, null), COPY_PLANTILLAS.origenDesconocido);
  assert.deepEqual(terminosProhibidosDeEntrenamientoEn(anterior), []);
});
