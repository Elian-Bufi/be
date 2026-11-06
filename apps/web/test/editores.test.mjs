/**
 * WP-TABLERO-ALTA-GAMA TB-48 · lo que se arregla en los editores, en este tramo (sin React, con una mirada a los
 * componentes):
 *  1. los topes de un plan son los del contrato, y cada uno que se pasa es un problema con su lugar, antes de guardar;
 *  2. la nota de un ítem de Nutrición se escribe en el editor, en el campo del contrato que la persona ya lee en la app;
 *  3. el cuadro sin plantillas deja de prometer que se escriben en «Plantillas y habituales»;
 *  4. (segunda parte) duplicar un día tipo, una comida, una opción, una sesión y un ejercicio, y reordenar, con lo abierto
 *     siguiendo a su elemento y la copia sin identificadores (`advisees/editar-la-estructura.ts`).
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

// ─── La segunda parte: duplicar, reordenar y quitar (`advisees/editar-la-estructura.ts`) ──────────────────────────
const X = await import('../src/app/pro/advisees/editar-la-estructura.ts');
const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ALIMENTO = ID(900);
const conIds = () => ({
  dayTypes: [
    {
      dayTypeId: ID(1),
      label: 'Día de entrenamiento',
      meals: [
        { mealId: ID(2), label: 'Desayuno', prescriptionMode: 'DISH_OPTIONS', options: [{ optionId: ID(3), label: 'Avena', items: [{ itemId: ID(4), catalogItemId: ALIMENTO, quantity: { value: 40, unit: 'g' }, preparationState: 'RAW', note: 'Con canela' }] }] },
        { mealId: ID(5), label: 'Almuerzo', prescriptionMode: 'DISH_OPTIONS', options: [{ optionId: ID(6), label: 'Pollo', items: [{ itemId: ID(7), catalogItemId: ALIMENTO, quantity: null, preparationState: null, note: null }] }] },
      ],
    },
  ],
});
const sesionConIds = () => ({
  sessionId: ID(20),
  label: 'Sesión A',
  instructions: 'Entrada en calor de 10 minutos',
  prescriptions: [{ prescriptionId: ID(21), exerciseVersionId: ID(901), sets: [{ repetitions: { value: 8 }, suggestedLoad: { value: 60, unit: 'kg' } }, { repetitions: { min: 8, max: 10 } }], intensity: null, note: 'Bajar en tres segundos' }],
});
/** Todos los identificadores de nodo de una estructura, a cualquier profundidad. */
const ids = (x) => JSON.stringify(x).match(/"(dayTypeId|mealId|optionId|itemId|blockId|microcycleId|sessionId|prescriptionId)":"[^"]+"/g) ?? [];
const contador = (desde) => {
  let n = desde;
  return () => ID(n++);
};
const normalizarNutricion = (e) => d.problemasDeBorrador(d.normalizarEstructura(e, contador(500)), new Set([ALIMENTO]));
const normalizarEntrenamiento = (e) => d.normalizarEstructuraDeEntrenamiento(e, contador(600));

test('TB-48 · mover y copiar corrigen las posiciones abiertas: cada una sigue a su elemento', () => {
  assert.deepEqual(X.mover(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(X.mover(['a', 'b', 'c', 'd'], 3, 1), ['a', 'd', 'b', 'c']);
  assert.deepEqual(X.mover(['a', 'b'], 1, 2), ['a', 'b'], 'fuera de la lista no mueve nada');
  // Propiedad: después de mover, lo que estaba en p está en posicionTrasMover(p).
  for (let largo = 1; largo <= 5; largo++) {
    for (let desde = 0; desde < largo; desde++) {
      for (let hacia = 0; hacia < largo; hacia++) {
        const antes = Array.from({ length: largo }, (_, n) => n);
        const despues = X.mover([...antes], desde, hacia);
        for (const p of antes) assert.equal(despues[X.posicionTrasMover(p, desde, hacia)], p, `${largo}: ${desde} → ${hacia}, ${p}`);
      }
    }
  }
  assert.deepEqual([...X.posicionesTrasMover(new Set([0, 2]), 0, 1)].sort(), [1, 2]);
  assert.deepEqual([...X.posicionesTrasInsertar(new Set([0, 1, 3]), 1)].sort(), [0, 2, 4]);
  assert.deepEqual([...X.posicionesTrasQuitar(new Set([0, 1, 3]), 1)].sort(), [0, 2]);
});

test('TB-48 · una copia va justo después, sin identificadores, con todo lo escrito y «(copia)» en el nombre', () => {
  // Nutrición: el día tipo, la comida y la opción.
  const e = conIds();
  const dia = X.copiaDelDiaTipo(e.dayTypes[0], 0);
  assert.deepEqual(ids(dia), [], 'el día tipo copiado no lleva ningún identificador');
  assert.equal(dia.label, 'Día de entrenamiento (copia)');
  assert.deepEqual(dia.meals[0].options[0].items[0], { catalogItemId: ALIMENTO, quantity: { value: 40, unit: 'g' }, preparationState: 'RAW', note: 'Con canela' });
  X.duplicarEn(e.dayTypes, 0, dia);
  assert.deepEqual(e.dayTypes.map((x) => x.label), ['Día de entrenamiento', 'Día de entrenamiento (copia)']);
  assert.equal(d.EstructuraDePlanEntradaSchema.safeParse(e).success, true);
  assert.deepEqual(normalizarNutricion(e), [], 'la API no ve nada repetido');
  dia.meals[0].options[0].items[0].quantity.value = 99;
  assert.equal(e.dayTypes[0].meals[0].options[0].items[0].quantity.value, 40, 'cambiar la copia no cambia el original');
  const comidas = conIds().dayTypes[0].meals;
  X.duplicarEn(comidas, 0, X.copiaDeLaComida(comidas[0], 0));
  assert.deepEqual(comidas.map((m) => m.label), ['Desayuno', 'Desayuno (copia)', 'Almuerzo']);
  assert.deepEqual(ids(comidas[1]), []);
  const opciones = conIds().dayTypes[0].meals[0].options;
  X.duplicarEn(opciones, 0, X.copiaDeLaOpcion(opciones[0], 0));
  assert.deepEqual([opciones[1].label, ids(opciones[1]).length], ['Avena (copia)', 0]);
  const receta = X.copiaDeLaOpcion({ optionId: ID(8), label: 'Tarta de verduras', items: [], recipeVersionId: ID(902) }, 0);
  assert.deepEqual(receta, { label: 'Tarta de verduras (copia)', items: [], recipeVersionId: ID(902) }, 'una de receta sigue citando la misma versión');
  // Mutación verificada: una copia con sus identificadores es lo que la API rechaza.
  const malHecha = conIds();
  malHecha.dayTypes.push(structuredClone(malHecha.dayTypes[0]));
  assert.ok(normalizarNutricion(malHecha).some((p) => p.code === 'DUPLICATE_NODE_ID'));

  // Entrenamiento: la sesión y el ejercicio.
  const sesiones = [sesionConIds()];
  X.duplicarEn(sesiones, 0, X.copiaDeLaSesion(sesiones[0], 0));
  assert.deepEqual([sesiones[1].label, sesiones[1].instructions, ids(sesiones[1]).length], ['Sesión A (copia)', 'Entrada en calor de 10 minutos', 0]);
  assert.deepEqual(sesiones[1].prescriptions[0].sets, sesiones[0].prescriptions[0].sets, 'las cargas y las repeticiones las escribió el profesional: se copian tal cual');
  const prescripciones = sesionConIds().prescriptions;
  X.duplicarEn(prescripciones, 0, X.copiaDelEjercicio(prescripciones[0]));
  assert.deepEqual(ids(prescripciones[1]), []);
  assert.equal(prescripciones[1].note, 'Bajar en tres segundos');
  const otra = { ...sesionConIds(), sessionId: ID(40), prescriptions: prescripciones.map((p, n) => (n === 0 ? { ...p, prescriptionId: ID(41) } : p)) };
  const plan = { blocks: [{ blockId: ID(30), label: 'Bloque 1', sessions: [...sesiones, otra] }] };
  assert.equal(d.EstructuraDePlanDeEntrenamientoEntradaSchema.safeParse(plan).success, true);
  assert.equal(normalizarEntrenamiento(plan).ok, true);
  const repetida = { blocks: [{ blockId: ID(30), label: 'Bloque 1', sessions: [sesionConIds(), sesionConIds()] }] };
  assert.equal(normalizarEntrenamiento(repetida).ok, false, 'mutación: la sesión copiada con su identificador');

  // El nombre de la copia entra en el largo del contrato, y sin nombre usa el de su lugar.
  assert.equal(X.nombreDeLaCopia('x'.repeat(80), 80, 'Comida').length, 80);
  assert.equal(X.nombreDeLaCopia('  ', 80, 'Comida 2'), 'Comida 2 (copia)');
});

test('TB-48 · los editores duplican y mueven con el módulo, y lo abierto sigue a su elemento', () => {
  const nutricion = leer('nutrition/editor.tsx');
  const comida = leer('nutrition/comida-del-editor.tsx');
  const entrenamiento = leer('training/editor.tsx');
  const ejercicio = leer('training/ejercicio-del-editor.tsx');
  // Nutrición: el día tipo en su menú; la comida en «Más», con «Subir» y «Bajar»; la opción, junto a su nombre.
  for (const clave of ['duplicarDiaTipo', 'moverAntes', 'moverDespues']) assert.match(nutricion, new RegExp(`texto: E\\.${clave}`));
  assert.match(nutricion, /duplicarEn\(x, i, copiaDelDiaTipo\(x\[i\]!, i\)\)/);
  assert.match(nutricion, /dejarAbiertas\(posicionesTrasMover\(abiertas, j, hacia\)\)/);
  assert.match(nutricion, /alSubir=\{\(\) => moverComida\(j, j - 1\)\}\s+alBajar=\{\(\) => moverComida\(j, j \+ 1\)\}/);
  assert.match(comida, /disabled=\{esLaUltima\} onClick=\{alBajar\}/);
  assert.match(comida, /\{ clave: 'duplicar', texto: E\.duplicarComida, alElegir: alDuplicar \}/);
  assert.match(comida, /onClick=\{\(\) => alDuplicarOpcion\(k\)\}/);
  // Entrenamiento: la sesión en su menú; el ejercicio con «Subir», «Bajar» y «Duplicar ejercicio».
  for (const clave of ['duplicarSesion', 'moverAntes', 'moverDespues']) assert.match(entrenamiento, new RegExp(`texto: E\\.${clave}`));
  assert.match(entrenamiento, /dejarAbiertos\(posicionesTrasMover\(abiertos, l, hacia\)\)/);
  assert.match(entrenamiento, /onSubir=\{\(\) => moverEjercicio\(l, l - 1\)\}/);
  assert.match(ejercicio, /disabled=\{esElUltimo\} onClick=\{onBajar\}/);
  assert.match(ejercicio, /\{ clave: 'duplicar', texto: EDICION\.duplicarEjercicio, alElegir: onDuplicar \}/);
});

test('TB-48 · los textos de duplicar y reordenar pasan las listas de términos', () => {
  const C = X.COPY_DE_LOS_EDITORES;
  const textos = Object.values(C).map((t) => (typeof t === 'function' ? t(2, 3) : t));
  for (const t of [...textos, X.loQuePasaConLasSesiones(1), X.loQuePasaConLasSesiones(3)]) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.deepEqual(d.terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px/i, t);
  }
});
