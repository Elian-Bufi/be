/**
 * RP-25 «Guardar como receta» (WP-RECORRIDO-PLAN-PULIDO, DL-188, DL-191) · Una opción de alimentos del plan pasa a ser una
 * receta propia, con su foto: lo que impide, el cuerpo de API-REC-01 (una porción, las notas en la descripción), la opción
 * que pasa a citar la receta sin perder su identidad, y la miniatura de una imagen recién cargada. Sin React.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const R = await import('../src/app/pro/advisees/nutrition/opcion-como-receta.ts');
const I = await import('../src/app/pro/advisees/nutrition/imagenes-de-las-recetas.ts');
const leer = (r) => readFileSync(new URL(`../src/${r}`, import.meta.url), 'utf8');

const GALLETA = '00000000-0000-4000-8000-000000000001';
const HUEVO = '00000000-0000-4000-8000-000000000002';
const nombres = { [GALLETA]: 'Galleta de arroz', [HUEVO]: 'Huevo' };
const item = (catalogItemId, value, unit = 'g', preparationState = 'AS_PURCHASED', extra = {}) => ({ catalogItemId, quantity: value === null ? null : { value, unit }, preparationState, ...extra });
const opcion = (extra = {}) => ({ optionId: 'op-1', label: 'Galletas de arroz con huevo', items: [item(GALLETA, 30), item(HUEVO, 50, 'g', 'COOKED')], ...extra });
const versiones = new Map([
  [GALLETA, 'v-galleta'],
  [HUEVO, 'v-huevo'],
]);

test('RP-25: una opción completa se puede guardar como receta', () => {
  assert.deepEqual(R.loQueImpide(opcion(), nombres), []);
});

test('RP-25: lo que una receta no admite se dice alimento por alimento', () => {
  const o = opcion({ items: [item(GALLETA, null), item(HUEVO, 2, 'unit', null), item(GALLETA, 6000)] });
  const lineas = R.loQueImpide(o, nombres);
  assert.ok(lineas.includes('Galleta de arroz: falta la cantidad.'));
  assert.ok(lineas.some((l) => l.startsWith('Huevo: está en unidades')));
  assert.ok(lineas.includes('Huevo: falta el estado de preparación.'));
  assert.ok(lineas.some((l) => l.includes('hasta 5000 g')));
  assert.deepEqual(R.loQueImpide(opcion({ items: [] }), nombres), [R.COPY_OPCION_COMO_RECETA.sinAlimentos]);
  assert.deepEqual(R.loQueImpide(opcion({ items: [], recipeVersionId: 'rv' }), nombres), [R.COPY_OPCION_COMO_RECETA.yaEsReceta]);
  const muchos = opcion({ items: Array.from({ length: 41 }, () => item(GALLETA, 10)) });
  assert.equal(R.loQueImpide(opcion({ items: [item(GALLETA, 5000)] }), nombres).length, 0, '5000 entra');
  assert.ok(R.loQueImpide(muchos, nombres)[0].includes('hasta 40 alimentos'));
  const notasLargas = opcion({ items: [item(GALLETA, 30, 'g', 'RAW', { note: 'x'.repeat(300) }), item(HUEVO, 50, 'g', 'RAW', { note: 'y'.repeat(300) })] });
  assert.ok(R.loQueImpide(notasLargas, nombres).some((l) => l.includes('admite 500')));
});

test('RP-25: la cantidad va como el servidor arma la porción del plan (un decimal), y una que no se entiende no viaja', () => {
  // Con un decimal, igual: la persona ve la misma cantidad y los mismos macros.
  assert.deepEqual(R.loQueImpide(opcion({ items: [item(GALLETA, 12.5), item(HUEVO, 0.1)] }), nombres), []);
  // Con más, la porción sería otra (2,25 → 2,3), y 0,04 quedaría en 0: el borrador no se podría guardar.
  assert.deepEqual(R.loQueImpide(opcion({ items: [item(GALLETA, 2.25)] }), nombres), [
    'Galleta de arroz: una receta lleva la cantidad con un decimal, y 2,25 g quedaría en 2,3 g. Redondeala en la opción.',
  ]);
  assert.match(R.loQueImpide(opcion({ items: [item(GALLETA, 0.04)] }), nombres)[0], /quedaría en 0 g/);
  // Lo que no se entiende viaja como NaN en el borrador: se dice y no se manda.
  assert.deepEqual(R.loQueImpide(opcion({ items: [item(GALLETA, Number.NaN)] }), nombres), ['Galleta de arroz: la cantidad no se entiende.']);
  assert.equal(R.cuerpoDeLaReceta(opcion({ items: [item(GALLETA, 2.25)] }), 0, nombres, versiones).tipo, 'no-se-puede');
});

test('RP-25: cerrar tras un pedido sin respuesta conserva la clave; al cerrar, el foco va a la cabecera de la opción', () => {
  const cuadro = leer('app/pro/advisees/nutrition/guardar-como-receta.tsx');
  assert.match(cuadro, /if \(!intento\.quedoIncierto\(\)\) intento\.descartar\(\);/);
  assert.doesNotMatch(cuadro, /^\s*intento\.descartar\(\);$/m, 'no se descarta sin mirar si quedó incierto');
  const editor = leer('app/pro/advisees/nutrition/editor.tsx');
  assert.match(editor, /focoTrasLaReceta\.current = donde && donde\.i === i \? `[^`]*\[data-opcion-plegable="\$\{donde\.k \+ 1\}"\] \.opcion-plegable__boton`/);
  // Después del efecto del cuadro que lo cierra, y solo si el foco quedó en el documento.
  assert.match(editor, /if \(activo && activo !== document\.body\) return;\n\s*document\.querySelector<HTMLElement>\(destino\)\?\.focus\(\);/);
});

test('RP-25: el cuerpo de API-REC-01 es una porción, con el nombre de la opción y las notas en la descripción', () => {
  const o = opcion({ items: [item(GALLETA, 30, 'g', 'AS_PURCHASED', { note: 'Integrales' }), item(HUEVO, 50, 'g', 'COOKED', { householdMeasure: { kind: 'UNIT', count: 1, amountPerUnit: 50 } })] });
  const r = R.cuerpoDeLaReceta(o, 0, nombres, versiones);
  assert.equal(r.tipo, 'listo');
  assert.deepEqual(r.cuerpo, {
    name: 'Galletas de arroz con huevo',
    servings: 1,
    description: 'Galleta de arroz: Integrales',
    steps: [],
    ingredients: [
      { catalogItemId: GALLETA, catalogItemVersionId: 'v-galleta', quantity: { value: 30, unit: 'g' }, preparationState: 'AS_PURCHASED' },
      { catalogItemId: HUEVO, catalogItemVersionId: 'v-huevo', quantity: { value: 50, unit: 'g' }, preparationState: 'COOKED' },
    ],
  });
  assert.equal(R.conMedidasCaseras(o.items), true);
  assert.equal(R.cuerpoDeLaReceta(opcion(), 0, nombres, versiones).cuerpo.description, null);
  // Sin nombre, el de la pestaña.
  assert.equal(R.cuerpoDeLaReceta(opcion({ label: '  ' }), 1, nombres, versiones).cuerpo.name, 'Opción 2');
});

test('RP-25: un alimento que el catálogo ya no devuelve no se cita, y un 422 dice cuál', () => {
  const r = R.cuerpoDeLaReceta(opcion(), 0, nombres, new Map([[GALLETA, 'v-galleta']]));
  assert.deepEqual(r, { tipo: 'sin-version', nombres: ['Huevo'] });
  assert.match(R.COPY_OPCION_COMO_RECETA.sinVersion(r.nombres), /^No pudimos usar Huevo: ya no está/);
  assert.deepEqual(R.alimentosQueNoSePudieron([{ path: 'ingredients[1].catalogItemVersionId' }, { path: 'ingredients[1].catalogItemId' }, { path: 'name' }], opcion(), nombres), ['Huevo']);
});

test('RP-25: lo que lleva, en renglones', () => {
  assert.deepEqual(R.loQueLleva(opcion().items, nombres), ['Galleta de arroz, 30 g, Tal como se adquiere', 'Huevo, 50 g, Cocido']);
});

const estructura = () => [
  { label: 'Día', meals: [{ label: 'Merienda', prescriptionMode: 'DISH_OPTIONS', options: [opcion(), { label: 'Fruta', items: [item(GALLETA, 10)] }] }] },
];

test('RP-25: la opción pasa a citar la receta, con su identidad y su nombre, sin tocar la estructura de entrada', () => {
  const e = estructura();
  const antes = structuredClone(e);
  const r = R.opcionComoReceta(e, { i: 0, j: 0, k: 0, optionId: 'op-1', label: 'Galletas de arroz con huevo' }, { recipeVersionId: 'rv-1' });
  assert.equal(r.tipo, 'convertida');
  assert.deepEqual(r.estructura[0].meals[0].options[0], { optionId: 'op-1', label: 'Galletas de arroz con huevo', items: [], recipeVersionId: 'rv-1' });
  assert.deepEqual(r.estructura[0].meals[0].options[1], e[0].meals[0].options[1]);
  assert.deepEqual(e, antes);
  // Reintentar no la cambia otra vez.
  assert.equal(R.opcionComoReceta(r.estructura, { i: 0, j: 0, k: 0, optionId: 'op-1', label: 'x' }, { recipeVersionId: 'rv-1' }).tipo, 'ya-estaba');
});

test('RP-25: la opción se encuentra por su identidad aunque se mueva; una nueva, por su lugar y su nombre', () => {
  const e = estructura();
  e[0].meals[0].options.reverse();
  const r = R.opcionComoReceta(e, { i: 0, j: 0, k: 0, optionId: 'op-1', label: 'Galletas de arroz con huevo' }, { recipeVersionId: 'rv-1' });
  assert.equal(r.tipo, 'convertida');
  assert.equal(r.k, 1);
  const nueva = R.opcionComoReceta(e, { i: 0, j: 0, k: 0, optionId: null, label: 'Fruta' }, { recipeVersionId: 'rv-2' });
  assert.equal(nueva.tipo, 'convertida');
  assert.equal('optionId' in nueva.estructura[0].meals[0].options[0], false, 'sin identidad, no se inventa una');
  assert.equal(R.opcionComoReceta(e, { i: 0, j: 0, k: 0, optionId: null, label: 'Otro nombre' }, { recipeVersionId: 'rv-2' }).tipo, 'no-se-pudo');
});

test('RP-25: la miniatura de una imagen recién cargada se pide por su medio; la de la lista, con sus rutas', () => {
  const rutas = { thumbnail: { path: '/a' }, large: { path: '/b' }, expiresAt: '2026-11-23T12:00:00.000Z' };
  assert.deepEqual(I.imagenDeLaCabecera({ image: { mediaId: 'm1', paths: rutas } }, false), { medioId: 'm1', rutas });
  assert.equal(I.imagenDeLaCabecera({ image: { mediaId: 'm1' } }, false), null, 'leída sin rutas: el plato, sin pedir nada');
  assert.deepEqual(I.imagenDeLaCabecera({ image: { mediaId: 'm1' } }, true), { medioId: 'm1', rutas: null });
  assert.equal(I.imagenDeLaCabecera({ image: null }, true), null);
  assert.equal(I.imagenDeLaCabecera(null, true), null);
});

test('RP-25: el editor ofrece «Agregar foto» junto a la cabecera y «Guardar como receta» en la opción, como botones discretos', () => {
  const comida = leer('app/pro/advisees/nutrition/comida-del-editor.tsx');
  const acceso = comida.slice(comida.indexOf('data-agregar-foto-a-la-opcion') - 900, comida.indexOf('data-agregar-foto-a-la-opcion'));
  assert.match(acceso, /<\/h4>/, 'el acceso va después del título, no adentro del botón de la cabecera');
  assert.match(acceso, /boton boton--discreto/);
  assert.match(comida, /data-guardar-como-receta=\{k \+ 1\}/);
  const editor = leer('app/pro/advisees/nutrition/editor.tsx');
  assert.match(editor, /<GuardarComoReceta/);
  assert.match(editor, /alGuardarComoReceta=/);
  const cuadro = leer('app/pro/advisees/nutrition/guardar-como-receta.tsx');
  assert.match(cuadro, /<ImagenDeReceta/, 'la foto, con el recuadro de siempre');
  assert.match(cuadro, /<RenglonDelAviso/, 'el error con su renglón reservado (RP-19)');
  assert.match(cuadro, /api\.crearReceta\(/, 'la operación de siempre (API-REC-01)');
  assert.match(leer('app/globals.css'), /\.opcion-plegable__fila > \.opcion-plegable__foto \{/);
});

test('RP-25: los textos no usan palabras prohibidas', () => {
  const C = R.COPY_OPCION_COMO_RECETA;
  const conEjemplo = (v) => (C.sinVersion === v || C.noSePudieron === v ? v(['Huevo']) : C.masDeUnDecimal === v ? v('Huevo', 2.25, 'g') : C.demasiados === v || C.notasLargas === v ? v(41) : v('Huevo', 'g'));
  const textos = JSON.stringify(Object.values(C).map((v) => (typeof v !== 'function' ? v : conEjemplo(v))));
  for (const p of ['cumplimiento', 'adherencia', 'racha', 'puntaje', 'asesorado', 'estación', '%']) assert.equal(textos.toLowerCase().includes(p), false, p);
});
