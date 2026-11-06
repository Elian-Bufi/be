/**
 * WP-TABLERO-ALTA-GAMA TB-48 · lo que se arregla en los editores, en este tramo (sin React, con una mirada a los
 * componentes):
 *  1. los topes de un plan son los del contrato, y cada uno que se pasa es un problema con su lugar, antes de guardar;
 *  2. la nota de un ítem de Nutrición se escribe en el editor, en el campo del contrato que la persona ya lee en la app;
 *  3. el cuadro sin plantillas deja de prometer que se escriben en «Plantillas y habituales».
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const T = await import('../src/app/pro/advisees/topes-del-plan.ts');
const d = await import('@be/domain');

const leer = (ruta) => readFileSync(new URL(`../src/app/pro/advisees/${ruta}`, import.meta.url), 'utf8');
/** El máximo de un arreglo del contrato (zod 4), también si es opcional. */
function maximo(esquema) {
  let s = esquema;
  while (s._def.innerType) s = s._def.innerType;
  return s._def.checks.find((c) => c._zod.def.check === 'max_length')._zod.def.maximum;
}
const muchos = (n, f) => Array.from({ length: n }, (_, i) => f(i));

test('TB-48 · los topes del editor son los del contrato', () => {
  const N = T.TOPES_DE_NUTRICION;
  assert.equal(N.diasTipo, maximo(d.EstructuraDePlanEntradaSchema.shape.dayTypes));
  assert.equal(N.comidas, maximo(d.DiaTipoEntradaSchema.shape.meals));
  assert.equal(N.opciones, maximo(d.ComidaEntradaSchema.shape.options));
  assert.equal(N.items, maximo(d.OpcionDeComidaEntradaSchema.shape.items));
  const E = T.TOPES_DE_ENTRENAMIENTO;
  assert.equal(E.bloques, maximo(d.EstructuraDePlanDeEntrenamientoEntradaSchema.shape.blocks));
  assert.equal(E.microciclos, maximo(d.BloqueEntradaSchema.shape.microcycles));
  assert.equal(E.sesionesDelBloque, maximo(d.BloqueEntradaSchema.shape.sessions));
  assert.equal(E.sesionesDelMicrociclo, maximo(d.MicrocicloEntradaSchema.shape.sessions));
  assert.equal(E.ejercicios, maximo(d.SesionEntradaSchema.shape.prescriptions));
  assert.equal(E.series, maximo(d.PrescripcionEntradaSchema.shape.sets));
  assert.equal(E.parametros, maximo(d.PrescripcionEntradaSchema.shape.professionalParameters));
});

test('TB-48 · en el tope no hay ningún problema; pasado, uno por lugar, en el orden de la estructura', () => {
  const N = T.TOPES_DE_NUTRICION;
  const opcion = (items) => ({ items: muchos(items, () => ({})) });
  const comida = (opciones, items = 1) => ({ options: muchos(opciones, () => opcion(items)) });
  const dia = (comidas, opciones = 1, items = 1) => ({ meals: muchos(comidas, () => comida(opciones, items)) });
  assert.deepEqual(T.topesPasadosDeNutricion(muchos(N.diasTipo, () => dia(N.comidas, N.opciones, N.items))), []);
  assert.deepEqual(T.topesPasadosDeNutricion([dia(1), dia(N.comidas + 1), { meals: [comida(N.opciones + 1), comida(1, N.items + 1)] }]), [
    { code: T.TOPE.comidas, path: 'dayTypes[1]' },
    { code: T.TOPE.opciones, path: 'dayTypes[2].meals[0]' },
    { code: T.TOPE.items, path: 'dayTypes[2].meals[1].options[0]' },
  ]);
  assert.deepEqual(T.topesPasadosDeNutricion(muchos(N.diasTipo + 1, () => dia(1))), [{ code: T.TOPE.diasTipo, path: 'dayTypes' }]);

  const E = T.TOPES_DE_ENTRENAMIENTO;
  const ejercicio = (series, parametros = 0) => ({ sets: muchos(series, () => ({})), professionalParameters: muchos(parametros, () => ({})) });
  const sesion = (ejercicios, series = 1) => ({ prescriptions: muchos(ejercicios, () => ejercicio(series)) });
  assert.deepEqual(T.topesPasadosDeEntrenamiento([{ sessions: muchos(E.sesionesDelBloque, () => sesion(E.ejercicios, E.series)) }]), []);
  assert.deepEqual(
    T.topesPasadosDeEntrenamiento([
      { sessions: muchos(E.sesionesDelBloque + 1, () => sesion(1)) },
      { microcycles: [{ sessions: muchos(E.sesionesDelMicrociclo + 1, () => sesion(1)) }, { sessions: [sesion(E.ejercicios + 1), { prescriptions: [ejercicio(E.series + 1, E.parametros + 1)] }] }] },
    ]),
    [
      { code: T.TOPE.sesiones, path: 'blocks[0]' },
      { code: T.TOPE.sesiones, path: 'blocks[1].microcycles[0]' },
      { code: T.TOPE.ejercicios, path: 'blocks[1].microcycles[1].sessions[0]' },
      { code: T.TOPE.series, path: 'blocks[1].microcycles[1].sessions[1].prescriptions[0]' },
      { code: T.TOPE.parametros, path: 'blocks[1].microcycles[1].sessions[1].prescriptions[0]' },
    ],
  );
  assert.deepEqual(T.topesPasadosDeEntrenamiento([...muchos(E.bloques + 1, () => ({ sessions: [] }))]), [{ code: T.TOPE.bloques, path: 'blocks' }]);
  assert.deepEqual(T.topesPasadosDeEntrenamiento([{ microcycles: muchos(E.microciclos + 1, () => ({ sessions: [] })) }]), [{ code: T.TOPE.microciclos, path: 'blocks[0]' }]);
});

test('TB-48 · los dos editores cuentan los topes con lo que no deja guardar, antes de pedirle nada a la API', () => {
  const entrenamiento = leer('training/editor.tsx');
  assert.match(entrenamiento, /const loQueNoDejaGuardar = \(bloques: Bloques\) => \[\.\.\.loQueNoDejaGuardarElEntrenamiento\(bloques\), \.\.\.topesPasadosDeEntrenamiento\(bloques\)\];/);
  assert.equal((entrenamiento.match(/loQueNoDejaGuardarElEntrenamiento\(bloques\)/g) ?? []).length, 1, 'todo pasa por la función que suma los topes');
  const nutricion = leer('nutrition/editor.tsx');
  assert.match(nutricion, /const loQueNoDejaGuardarElPlan = \(e: Estructura\) => \[\.\.\.loQueNoDejaGuardar\(e\), \.\.\.topesPasadosDeNutricion\(e\)\];/);
  assert.doesNotMatch(nutricion, /loQueNoDejaGuardar\(estructura\)/);
  for (const editor of [entrenamiento, nutricion]) {
    assert.match(editor, /\.\.\.TEXTO_DE_LOS_TOPES,/);
    assert.match(editor, /impide\.some\(\(p\) => esUnTope\(p\.code\)\) \? AVISO_DE_LOS_TOPES/);
  }
});

test('TB-48 · los textos de los topes dicen cuánto admite cada cosa y pasan las listas de términos', () => {
  const textos = [...Object.values(T.TEXTO_DE_LOS_TOPES), T.AVISO_DE_LOS_TOPES];
  assert.equal(Object.keys(T.TEXTO_DE_LOS_TOPES).length, Object.keys(T.TOPE).length);
  for (const t of textos) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.deepEqual(d.terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px/i, t);
  }
  for (const codigo of Object.values(T.TOPE)) assert.match(T.TEXTO_DE_LOS_TOPES[codigo], /\d+/, codigo);
});

test('TB-48 · la nota del ítem: el editor la escribe en el campo del contrato, hasta donde el contrato admite', () => {
  const comida = leer('nutrition/comida-del-editor.tsx');
  assert.match(comida, /<TextoAPedido[\s\S]*?valor=\{item\.note \?\? null\}[\s\S]*?maximo=\{COPY_NOTA_DEL_ITEM\.maximo\}[\s\S]*?alCambiar=\{\(v\) => onCambiar\(\{ note: v \}\)\}/);
  assert.match(comida, /maximo: 300/);
  const item = { catalogItemId: '00000000-0000-4000-8000-000000000001', quantity: null, preparationState: null };
  assert.equal(d.ItemPrescriptoEntradaSchema.safeParse({ ...item, note: 'x'.repeat(300) }).success, true);
  assert.equal(d.ItemPrescriptoEntradaSchema.safeParse({ ...item, note: 'x'.repeat(301) }).success, false);
  assert.deepEqual(d.terminosProhibidosEn('Nota para la persona'), []);
});

test('TB-48 · el cuadro sin plantillas no promete que se escriben en «Plantillas y habituales»', () => {
  assert.doesNotMatch(d.COPY_PLANTILLAS.dondeSeArman, /se escriben/);
  assert.match(d.COPY_PLANTILLAS.dondeSeArman, /«Guardar como plantilla»/);
});
