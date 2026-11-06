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

test('TB-48 · se quita cualquier serie, también una del medio, y las demás conservan lo suyo', () => {
  const series = [{ repetitions: { value: 10 } }, { repetitions: { value: 8 }, suggestedLoad: { value: 60, unit: 'kg' }, rir: null }, { repetitions: { value: 6 }, restSeconds: 180 }];
  assert.deepEqual(X.sinLaSerie(series, 1), [series[0], series[2]], 'la del medio sale; la tercera pasa a ser la segunda con su descanso propio');
  assert.deepEqual(X.sinLaSerie(series, 0), [series[1], series[2]]);
  assert.equal(series.length, 3, 'no cambia la lista que recibe');
  const ejercicio = leer('training/ejercicio-del-editor.tsx');
  assert.match(ejercicio, /data-quitar-serie=\{n \+ 1\}\s+onClick=\{\(\) => onCambiar\(\{ sets: sinLaSerie\(p\.sets, n\) \}\)\}/);
  assert.match(ejercicio, /aria-label=\{`\$\{EDICION\.quitarLaSerie\(n\)\} de \$\{nombre\}`\}/);
  assert.doesNotMatch(ejercicio, /Quitar la última serie|slice\(0, -1\)/);
});

test('TB-48 · el microciclo se ofrece también con sesiones sueltas, que pasan a la «Semana 1» con sus identificadores', () => {
  const bloque = { blockId: ID(30), label: 'Fuerza', purpose: 'Base', sessions: [sesionConIds(), { ...sesionConIds(), sessionId: ID(40), prescriptions: [] }] };
  const organizado = X.organizadoEnMicrociclos(structuredClone(bloque));
  assert.equal('sessions' in organizado, false, 'un bloque usa microciclos o sesiones sueltas, nunca las dos');
  assert.deepEqual(organizado.microcycles.map((m) => [m.label, m.sessions.map((s) => s.sessionId)]), [['Semana 1', [ID(20), ID(40)]]]);
  assert.deepEqual([organizado.blockId, organizado.label, organizado.purpose], [ID(30), 'Fuerza', 'Base']);
  // La API lo acepta: no hay sesiones y microciclos juntos ni identificadores repetidos.
  assert.equal(normalizarEntrenamiento({ blocks: [organizado] }).ok, true);
  assert.equal(normalizarEntrenamiento({ blocks: [{ ...organizado, sessions: bloque.sessions }] }).ok, false, 'mutación: las sesiones quedan también en el bloque');
  assert.deepEqual(X.organizadoEnMicrociclos({ label: 'Vacío', sessions: [] }).microcycles, [{ label: 'Semana 1', purpose: null, sessions: [] }]);
  assert.equal(X.loQuePasaConLasSesiones(0), null);
  assert.equal(X.loQuePasaConLasSesiones(3), 'Las 3 sesiones del bloque pasan a «Semana 1».');
  const entrenamiento = leer('training/editor.tsx');
  assert.match(entrenamiento, /cambiar\(\(x\) => \(\(x\[i\] = organizadoEnMicrociclos\(x\[i\]!\)\), x\)\)/);
  assert.match(entrenamiento, /detalle: loQuePasaConLasSesiones\(sesiones\.length\),\s+noSePuede: sesiones\.length > TOPES_DE_ENTRENAMIENTO\.sesionesDelMicrociclo/);
  assert.doesNotMatch(entrenamiento, /Solo mientras el bloque no tiene sesiones/);
});

// ─── «Revisar el plan» (`advisees/revisar-el-plan.ts`) ──────────────────────────────────────────────────────────────
const R = await import('../src/app/pro/advisees/revisar-el-plan.ts');
const leerDelDominio = (archivo) => readFileSync(new URL(`../../../packages/domain/src/${archivo}`, import.meta.url), 'utf8');

test('TB-48 · «Revisar el plan» lista lo que queda sin completar, cada cosa con su lugar', () => {
  const e = conIds();
  e.dayTypes[0].meals[1].options.push({ label: 'Tarta', items: [{ catalogItemId: ALIMENTO, quantity: null, preparationState: null }], recipeVersionId: ID(902) });
  assert.deepEqual(R.loQueQuedaSinCompletarEnNutricion(e.dayTypes), [{ code: R.INCOMPLETO.sinCantidad, path: 'dayTypes[0].meals[1].options[0].items[0].quantity' }], 'solo el ítem sin cantidad; la opción de receta no cuenta');
  assert.deepEqual(d.lugarDelProblema('dayTypes[0].meals[1].options[0].items[0].quantity'), { dia: 0, comida: 1, opcion: 0, item: 0 }, 'el editor lo ubica y lleva a su campo');
  const sesion = sesionConIds();
  sesion.prescriptions.push({ exerciseVersionId: ID(903), sets: [], intensity: null }, { exerciseVersionId: ID(904), sets: [{ repetitions: { value: 5 } }, { repetitions: null }], intensity: null });
  const bloques = [{ label: 'Bloque 1', microcycles: [{ label: 'Semana 1', sessions: [sesion] }] }];
  assert.deepEqual(R.loQueQuedaSinCompletarEnEntrenamiento(bloques), [
    { code: R.INCOMPLETO.sinSeries, path: 'blocks[0].microcycles[0].sessions[0].prescriptions[1]' },
    { code: R.INCOMPLETO.sinRepeticiones, path: 'blocks[0].microcycles[0].sessions[0].prescriptions[2].sets[1].repetitions' },
  ]);
  assert.deepEqual(d.lugarDelProblemaDeEntrenamiento('blocks[0].microcycles[0].sessions[0].prescriptions[2].sets[1].repetitions'), { bloque: 0, microciclo: 0, sesion: 0, ejercicio: 2, serie: 1 });
  // Lo que queda sin completar no es lo que no deja guardar: un plan así se guarda, se valida y se activa.
  assert.deepEqual(d.loQueNoDejaGuardarElEntrenamiento(bloques), []);
  assert.equal(normalizarEntrenamiento({ blocks: bloques }).ok, true);
  assert.deepEqual(normalizarNutricion(conIds()), []);
  for (const codigo of Object.values(R.INCOMPLETO)) assert.ok(R.TEXTO_DE_LO_INCOMPLETO[codigo], codigo);
});

test('TB-48 · «Validar plan» pasa a «Revisar el plan», y lo sin completar no bloquea nada', () => {
  assert.match(leerDelDominio('copy-nutricion.ts'), /validarPlan: 'Revisar el plan',/);
  assert.match(leerDelDominio('copy-entrenamiento.ts'), /validarPlan: 'Revisar el plan',/);
  assert.match(leerDelDominio('copy-entrenamiento.ts'), /noJuzga: 'Revisar el plan mira su forma, no su calidad/);
  for (const [archivo, funcion] of [['nutrition/editor.tsx', 'loQueQuedaSinCompletarEnNutricion(estructura)'], ['training/editor.tsx', 'loQueQuedaSinCompletarEnEntrenamiento(bloques)']]) {
    const editor = leer(archivo);
    assert.ok(editor.includes(`const falta = ${funcion};`), archivo);
    assert.match(editor, /setSinCompletar\(falta\);/);
    assert.match(editor, /<ul className="problemas-del-plan" data-sin-completar>/);
    // Nada más lee lo sin completar: ni guardar, ni el autoguardado, ni «Activar plan».
    assert.equal((editor.match(/sinCompletar\b/g) ?? []).length, 5, `${archivo}: el estado, la lista (tres veces) y su texto`);
    assert.doesNotMatch(editor, /Validar plan/);
  }
  for (const t of [...Object.values(R.TEXTO_DE_LO_INCOMPLETO), ...Object.values(R.COPY_REVISAR_EL_PLAN), 'Revisar el plan', 'No hay nada que impida activar.']) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.deepEqual(d.terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px|error/i, t);
  }
});

test('TB-48 · «Guardar como plantilla» va con su texto, a la vista, y si no se puede dice por qué', () => {
  for (const [archivo, motivo] of [['nutrition/editor.tsx', 'sinPlantilla'], ['training/editor.tsx', 'antesHayQueCorregir']]) {
    const editor = leer(archivo);
    assert.doesNotMatch(editor, /Más acciones de esta versión/, `${archivo}: ya no es un menú «⋯» sin texto`);
    const boton = editor.slice(editor.indexOf('data-guardar-como-plantilla'), editor.indexOf('{COPY_PLANTILLAS.guardarComoPlantilla}') + 40);
    assert.ok(boton.length > 40 && boton.includes('{COPY_PLANTILLAS.guardarComoPlantilla}'), `${archivo}: el botón lleva el texto`);
    assert.ok(boton.includes(`aria-disabled={${motivo} ? true : undefined}`), `${archivo}: apagado sin perder el foco`);
    assert.ok(boton.includes(`aria-describedby={${motivo} ? 'motivo-sin-plantilla' : undefined}`), `${archivo}: el motivo, para el lector`);
    assert.ok(boton.includes(`onClick={() => (${motivo} ? setMensaje({ tipo: 'info', texto: ${motivo} }) : setGuardarPlantilla(true))}`), `${archivo}: al tocarlo apagado, el motivo`);
  }
  assert.equal(d.COPY_PLANTILLAS.guardarComoPlantilla, 'Guardar como plantilla');
});

test('TB-48 · la receta como opción, con buscador: por su nombre, sin tildes, y sin pedirle a la API una búsqueda que no tiene', async () => {
  const B = await import('../src/app/pro/advisees/nutrition/recetas-para-elegir.ts');
  const recetas = [{ name: 'Tarta de verduras' }, { name: 'Pollo al horno con arroz' }, { name: 'Arroz con leche' }, { name: 'Ensalada César' }];
  assert.deepEqual(B.recetasQueCoinciden(recetas, 'ARROZ').map((r) => r.name), ['Pollo al horno con arroz', 'Arroz con leche']);
  assert.deepEqual(B.recetasQueCoinciden(recetas, 'arroz pollo').map((r) => r.name), ['Pollo al horno con arroz'], 'todas las palabras, en cualquier orden');
  assert.deepEqual(B.recetasQueCoinciden(recetas, 'cesar').map((r) => r.name), ['Ensalada César'], 'sin tildes');
  assert.equal(B.recetasQueCoinciden(recetas, '   ').length, 4, 'sin texto, todas');
  assert.deepEqual(B.recetasQueCoinciden(recetas, 'pescado'), []);
  // De a 50, el máximo que admite API-REC-02, y solo con las claves que admite (limit y cursor).
  const paginacion = readFileSync(new URL('../../api/src/http/paginacion.ts', import.meta.url), 'utf8');
  assert.equal(B.RECETAS_POR_PAGINA, Number(/LIMITE_MAXIMO = (\d+)/.exec(paginacion)[1]));
  const editor = leer('nutrition/editor.tsx');
  assert.match(editor, /api\.listarRecetas\(token, \{ limit: String\(RECETAS_POR_PAGINA\), \.\.\.\(siguiente \? \{ cursor: siguiente \} : \{\}\) \}\)/);
  assert.match(editor, /const visibles = estado\.tipo === 'lista' \? recetasQueCoinciden\(estado\.recetas, texto\) : \[\];/);
  assert.match(editor, /<p className="nota" role="status" data-cuantas-recetas>/);
  const C = B.COPY_ELEGIR_RECETA;
  for (const t of [C.buscar, C.ayuda, C.cuantas(1, 1), C.cuantas(3, 3), C.cuantas(2, 9), C.ninguna(' pescado '), C.borrar, C.hayMas]) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px/i, t);
  }
  assert.equal(C.ninguna(' pescado '), 'Ninguna de tus recetas tiene «pescado» en el nombre.');
});

// ─── Las zonas de un ejercicio propio, desde «Mis ejercicios» (`exercises/zonas-propias.ts`) ──────────────────────
test('TB-48 · las zonas de un ejercicio propio: las 17 del catálogo, en su orden, con su rol y nada más', async () => {
  const Z = await import('../src/app/pro/exercises/zonas-propias.ts');
  const catalogo = d.ZONAS_MUSCULARES.map((z) => z.zoneId);
  const eleccion = Z.eleccionDe([{ zoneId: 'gluteos', role: 'SECONDARY' }, { zoneId: 'cuadriceps', role: 'PRIMARY' }]);
  assert.deepEqual(Object.keys(eleccion), catalogo, 'una elección por zona del catálogo, en su orden');
  assert.equal(eleccion.trapecio, '');
  // Lo que viaja va en el orden del catálogo, sin las que no nombra, y la API lo acepta.
  const pedido = Z.pedidoDeZonas({ ...eleccion, isquios: 'SECONDARY' }, { versionId: ID(950), zonesVersion: 3 });
  assert.deepEqual(pedido, {
    exerciseVersionId: ID(950),
    expectedZonesVersion: 3,
    muscleZones: [
      { zoneId: 'gluteos', role: 'SECONDARY' },
      { zoneId: 'cuadriceps', role: 'PRIMARY' },
      { zoneId: 'isquios', role: 'SECONDARY' },
    ],
  });
  assert.equal(d.CambiarZonasDeEjercicioRequestSchema.safeParse(pedido).success, true);
  assert.deepEqual(d.problemasDeZonas(pedido.muscleZones), []);
  assert.deepEqual(Z.pedidoDeZonas(Z.eleccionDe([]), { versionId: ID(950), zonesVersion: 0 }).muscleZones, [], 'sin ninguna elegida, la lista vacía quita todas');
  assert.equal(Z.cambiaronLasZonas(eleccion, { ...eleccion }), false);
  assert.equal(Z.cambiaronLasZonas(eleccion, { ...eleccion, gluteos: 'PRIMARY' }), true);
  assert.equal(Z.cambiaronLasZonas(eleccion, { ...eleccion, gluteos: '' }), true);

  // La pantalla ofrece solo las 17 (las del dominio), con los roles de la figura, y no dibuja nada propio.
  const pieza = readFileSync(new URL('../src/app/pro/exercises/zonas-del-ejercicio.tsx', import.meta.url), 'utf8');
  assert.match(pieza, /\{ZONAS_MUSCULARES\.map\(\(z\) => \(/);
  assert.match(pieza, /<option value="PRIMARY">\{COPY_FIGURA_DE_ZONAS\.principal\}<\/option>\s+<option value="SECONDARY">\{COPY_FIGURA_DE_ZONAS\.secundaria\}<\/option>/);
  assert.match(pieza, /<FiguraDeZonas zonas=\{zonasElegidas\(eleccion\)\}/);
  assert.doesNotMatch(pieza, /<svg|<img|be-mask|zoneId: '/, 'ni puntos, ni máscaras, ni zonas escritas a mano');
  assert.doesNotMatch(pieza, /%/, 'sin porcentajes');
  assert.match(pieza, /api\.cambiarZonasDeEjercicio\(token, ficha\.exerciseId, pedidoDeZonas\(eleccion, ficha\), intento\.actual\(\)\);\s+intento\.registrar\(r\);/);
  assert.match(pieza, /r\.codigo === 'VERSION_CONFLICT' \? C\.conflicto/);
  const pagina = readFileSync(new URL('../src/app/pro/exercises/mis-ejercicios.tsx', import.meta.url), 'utf8');
  assert.match(pagina, /data-cambiar-zonas/);
  assert.match(pagina, /setAviso\(COPY_ZONAS_PROPIAS\.guardadas\(e\.name\)\);[\s\S]{0,120}releerFichas\(\);/);
  const C = Z.COPY_ZONAS_PROPIAS;
  for (const t of Object.values(C).map((t) => (typeof t === 'function' ? t('Sentadilla búlgara') : t))) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.deepEqual(d.terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px|%/i, t);
  }
});
