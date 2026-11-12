/**
 * ED-32 · La receta nueva entra como opción de su comida, sin salir del plan (WP-EDITORES-PROFESIONAL; V3 N-03).
 * TEST-EDP-030 en su parte del website: la opción guarda `recipeVersionId`; agregar no toca la estructura de entrada; el
 * reintento no duplica; si la comida ya no está o llegó al tope, no se agrega en otra.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const R = await import('../src/app/pro/advisees/nutrition/receta-en-el-plan.ts');

const opcion = (label) => ({ label, items: [] });
const comida = (label, options, mealId) => ({ ...(mealId ? { mealId } : {}), label, prescriptionMode: 'DISH_OPTIONS', options });
const plan = () => [
  { dayTypeId: 'd1', label: 'Entrenamiento', meals: [comida('Desayuno', [opcion('A')], 'm1'), comida('Merienda', [opcion('Fruta')], 'm2')] },
  { label: 'Descanso', meals: [comida('Colación', [opcion('Opción 1')])] },
];
const budin = { recipeVersionId: 'rv1', name: 'Budín' };

test('ED-32 · la receta entra como la opción siguiente de su comida, con su versión, sin tocar la estructura de entrada', () => {
  const e = plan();
  const antes = structuredClone(e);
  const r = R.agregarLaReceta(e, { i: 0, j: 1, mealId: 'm2', label: 'Merienda', nombre: 'Merienda' }, budin);
  assert.equal(r.tipo, 'agregada');
  assert.deepEqual([r.i, r.j, r.k], [0, 1, 1]);
  assert.deepEqual(r.estructura[0].meals[1].options[1], { label: 'Budín', items: [], recipeVersionId: 'rv1' });
  assert.deepEqual(e, antes);
  // El reintento con la misma versión no la duplica: la encuentra.
  const otra = R.agregarLaReceta(r.estructura, { i: 0, j: 1, mealId: 'm2', label: 'Merienda', nombre: 'Merienda' }, budin);
  assert.deepEqual(otra, { tipo: 'ya-estaba', i: 0, j: 1, k: 1 });
});

test('ED-32 · la comida se busca por su identidad aunque se haya movido; una nueva, por su lugar y su nombre', () => {
  const e = plan();
  // La merienda subió al primer lugar mientras se escribía la receta.
  [e[0].meals[0], e[0].meals[1]] = [e[0].meals[1], e[0].meals[0]];
  const r = R.agregarLaReceta(e, { i: 0, j: 1, mealId: 'm2', label: 'Merienda', nombre: 'Merienda' }, budin);
  assert.deepEqual([r.tipo, r.i, r.j], ['agregada', 0, 0]);
  // Una comida nueva (sin identidad): su lugar y su nombre tal como está escrito.
  assert.equal(R.agregarLaReceta(plan(), { i: 1, j: 0, mealId: null, label: 'Colación', nombre: 'Colación' }, budin).tipo, 'agregada');
  // Si en ese lugar ahora hay otra comida, no se agrega ahí.
  assert.deepEqual(R.agregarLaReceta(plan(), { i: 1, j: 0, mealId: null, label: 'Cena', nombre: 'Cena' }, budin), { tipo: 'no-se-pudo', motivo: 'YA_NO_ESTA' });
  // Si se quitó, tampoco.
  const sinMerienda = plan();
  sinMerienda[0].meals.splice(1, 1);
  assert.deepEqual(R.agregarLaReceta(sinMerienda, { i: 0, j: 1, mealId: 'm2', label: 'Merienda', nombre: 'Merienda' }, budin), { tipo: 'no-se-pudo', motivo: 'YA_NO_ESTA' });
});

test('ED-32 · con doce opciones, no se agrega y se dice por qué; el texto ofrece reintentar', () => {
  const e = plan();
  e[0].meals[1].options = Array.from({ length: 12 }, (_, n) => opcion(`O${n}`));
  assert.deepEqual(R.agregarLaReceta(e, { i: 0, j: 1, mealId: 'm2', label: 'Merienda', nombre: 'Merienda' }, budin), { tipo: 'no-se-pudo', motivo: 'TOPE' });
  assert.match(R.COPY_RECETA_NUEVA.noSeAgrego('Merienda', 'TOPE'), /12 opciones/);
  assert.equal(R.COPY_RECETA_NUEVA.agregarla('Merienda'), 'Agregarla a Merienda');
  assert.equal(R.COPY_RECETA_NUEVA.agregada('Budín', 1, 'Merienda'), '«Budín» quedó en Mis recetas (versión 1) y es la opción 2 de Merienda.');
});
