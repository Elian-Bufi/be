/**
 * RP-24 «Cierre de Nutrición» (WP-RECORRIDO-PLAN-PULIDO, DL-188) · Lo que se cerró del recorrido de Nutrición, sin React:
 * la lista de «Rangos indicados» con la acción discreta, el «?» en la esquina, la miniatura de la receta en el editor con
 * las rutas en lote, y lo BAJA que se veía en pantalla (el ajuste sin signo, «Hay datos nuevos» a medianoche, el pedido del
 * objetivo que vuelve a `false`, el renglón de la versión del objetivo, los íconos de las tarjetas y el 422 de
 * Administración). La guardia de las acciones y los «?» está en `scripts/acciones-y-ayudas.test.cjs`.
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

const N = await import('../src/app/pro/advisees/datos-nuevos.ts');
const I = await import('../src/app/pro/advisees/nutrition/imagenes-de-las-recetas.ts');
const K = await import('../src/app/pro/advisees/nutrition/calculador-del-objetivo.ts');
const d = await import('@be/domain');
const leer = (r) => readFileSync(new URL(`../src/${r}`, import.meta.url), 'utf8');
const ESTILOS = leer('app/globals.css');

const YO = 'p-yo';
const dominios = (cambios = {}) => ({
  nutrition: {
    available: true,
    relationshipId: 'r1',
    summary: {
      activePlan: null,
      objective: null,
      lastReview: null,
      draftPlan: null,
      registeredIntakes: 4,
      lastIntakeAt: '2026-11-21T13:00:00.000Z',
      ...cambios,
    },
  },
  training: { available: false, reason: 'NOT_AVAILABLE_TO_VIEW' },
  anthropometry: { available: true, relationshipId: 'r3', summary: null },
});
const HOY = { start: '2026-11-15T03:00:00.000Z', end: '2026-11-22T03:00:00.000Z' };
const MANANA = { start: '2026-11-16T03:00:00.000Z', end: '2026-11-23T03:00:00.000Z' };

test('RP-D93 · a medianoche el período corre y el conteo baja: no es «Hay datos nuevos»', () => {
  const antes = N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], dominios(), YO, HOY);
  // A las 0:00 el período corrió un día: un registro viejo salió del período y el conteo bajó a 3. Nadie registró nada.
  const aMedianoche = N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], dominios({ registeredIntakes: 3 }), YO, MANANA);
  assert.equal(N.hayDatosNuevos(antes, aMedianoche), false);
  // Con otro período, un registro nuevo sí se ve: cambia la fecha del último.
  const conUnoNuevo = N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], dominios({ registeredIntakes: 4, lastIntakeAt: '2026-11-22T03:10:00.000Z' }), YO, MANANA);
  assert.equal(N.hayDatosNuevos(antes, conUnoNuevo), true);
  // En el mismo período, el conteo sigue contando (un registro con fecha de otro día).
  assert.equal(N.hayDatosNuevos(antes, N.huellaDelArea('NUTRICION', ['NUTRICION:Activo'], dominios({ registeredIntakes: 5 }), YO, HOY)), true);
  // Y el acceso, aunque haya cambiado el período.
  assert.equal(N.hayDatosNuevos(antes, N.huellaDelArea('NUTRICION', ['NUTRICION:Pausado'], dominios({ registeredIntakes: 3 }), YO, MANANA)), true);
  // Sin período (como antes), se compara todo.
  assert.equal(N.hayDatosNuevos(N.huellaDelArea('NUTRICION', [], dominios(), YO), N.huellaDelArea('NUTRICION', [], dominios({ registeredIntakes: 3 }), YO)), true);
  // Las dos lecturas de la ficha y del área pasan el período del resumen.
  assert.match(leer('app/pro/advisees/marco-del-area.tsx'), /dominios, yoId, panel\?\.ok \? panel\.datos\.data\.period : null\)/);
  assert.match(leer('app/pro/advisees/workspace.tsx'), /dominios, yoId, respuesta\.datos\.data\.period\)/);
});

test('RP-D95 · el ajuste guardado se dice como se escribe: «Déficit de 300 kcal por día», sin signo', () => {
  const n = (x, dec) => d.numero(x, dec);
  assert.equal(K.ajusteEnPalabras({ kind: 'KCAL', value: -300 }, 2400, n), 'Déficit de 300 kcal por día');
  assert.equal(K.ajusteEnPalabras({ kind: 'KCAL', value: 250 }, 2400, n), 'Superávit de 250 kcal por día');
  assert.equal(K.ajusteEnPalabras({ kind: 'PERCENT', value: -10 }, 2450, n), `Déficit del 10 % de las ${n(2450, 0)} kcal del gasto total`);
  assert.equal(K.ajusteEnPalabras(null, 2400, n), 'Sin ajuste');
  assert.equal(K.ajusteEnPalabras({ kind: 'KCAL', value: 0 }, 2400, n), 'Sin ajuste');
  for (const t of [K.ajusteEnPalabras({ kind: 'KCAL', value: -300 }, 2400, n), K.ajusteEnPalabras({ kind: 'PERCENT', value: 5 }, 2000, n)]) assert.doesNotMatch(t, /[−-]\d|\+\d/, t);
  const referencia = leer('app/pro/advisees/nutrition/referencia-del-objetivo.tsx');
  assert.match(referencia, /\{ajusteEnPalabras\(p\.adjustment, r\.totals\?\.day \?\? null, numero\)\}/);
  assert.doesNotMatch(referencia, /value > 0 \? '\+'/);
});

test('RP-D96 · «Usarla ahora» vuelve a estar a mano: el pedido del objetivo vuelve a false cuando el borrador lo cita', () => {
  const editor = leer('app/pro/advisees/nutrition/editor.tsx');
  assert.match(editor, /const objetivoCitado = !!version && !!objetivo && objetivo\.versionId === version\.objectiveVersionId;/);
  assert.match(editor, /if \(objetivoPedido && objetivoCitado\) setObjetivoPedido\(false\);/);
});

test('RP-D98 · la versión del objetivo va en su propio renglón: el número que llega después no la hace saltar', () => {
  assert.match(ESTILOS, /\.plan__objetivo > \[data-version-del-objetivo\] \{\s*flex-basis: 100%;/);
  assert.match(leer('app/pro/advisees/nutrition/editor.tsx'), /<p className="nota" data-version-del-objetivo>/);
});

test('RP-D97 · las tarjetas del cuadro de la opción llevan el ícono de cada macro, como el editor', () => {
  const cuadro = leer('app/pro/advisees/nutrition/cuadro-de-la-opcion.tsx');
  assert.match(cuadro, /<Icono nombre=\{ICONO_DEL_MACRO\[MACRO_DEL_NUTRIENTE\[n\]\]\} tamano=\{15\} \/>\n\s*\{NOMBRE_DEL_TOTAL\[n\]\}/);
  assert.match(cuadro, /<Icono nombre="fibra" tamano=\{15\} \/>/);
  assert.match(cuadro, /className="cuadro-de-la-opcion__rango-del-macro"/);
});

test('RP-D94 · Administración dice por qué no se decidió una propuesta, no «no disponible»', () => {
  const admin = leer('app/admin/recipes/propuestas-al-recetario.tsx');
  assert.match(admin, /setFallo\(textoDeLaDecision\(res\)\);/);
  assert.match(admin, /res\.codigo === 'INVALID_STATE_TRANSITION'\) return C\.yaDecidida;/);
  assert.match(admin, /i\.code === 'OWN_FOOD_NOT_PROPOSABLE'\)\) return C\.conAlimentosAMano;/);
  for (const t of [d.COPY_RECETARIO.yaDecidida, d.COPY_RECETARIO.conAlimentosAMano, d.COPY_RECETARIO.noSeDecidio]) assert.deepEqual(d.terminosProhibidosEn(t), [], t);
});

test('RP-D90 · «Rangos indicados»: el nombre, la acción discreta y los tres macros en columnas', () => {
  const lista = leer('app/pro/advisees/nutrition/rangos-indicados-del-plan.tsx');
  const fila = lista.slice(lista.indexOf('const fila = '), lista.indexOf('  return (\n    <section className="rangos-indicados"'));
  assert.match(fila, /className="boton boton--discreto rangos-indicados__accion"/);
  assert.match(fila, /aria-label=\{r \? C\.cambiar\(nombre\) : C\.escribir\(nombre\)\}/);
  assert.match(fila, /\{r \? C\.cambiarCorto : C\.escribirCorto\}/);
  assert.match(fila, /MACROS_DEL_RANGO\.map\(\(m\) =>/);
  assert.doesNotMatch(fila, /boton--enlace/);
  assert.match(ESTILOS, /\.rangos-indicados__macros \{\s*display: grid;\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(ESTILOS, /\.rangos-indicados__renglon \{[^}]*grid-template-areas:/);
});

test('RP-D91 · el «?» en la esquina: lo que abre flota y se cierra con Escape o tocando afuera', () => {
  const pieza = leer('components/explicacion-a-pedido.tsx');
  assert.match(pieza, /export function EncabezadoConAyuda\(/);
  assert.match(pieza, /lugar = 'en-la-linea'/);
  assert.match(pieza, /if \(e\.key !== 'Escape'\) return;/);
  assert.match(pieza, /document\.addEventListener\('pointerdown', afuera\)/);
  assert.match(pieza, /<ExplicacionAPedido nombre=\{nombre\} como=\{como\} lugar="esquina">/);
  assert.match(ESTILOS, /\.encabezado-con-ayuda \{\s*display: flex;\s*align-items: flex-start;\s*justify-content: space-between;/);
});

test('RP-D92 · la miniatura de la receta en el editor: las rutas firmadas en lote de la lista propia, nunca un pedido por imagen', () => {
  const dias = [{ meals: [{ options: [{ recipeVersionId: 'rv1' }, { recipeVersionId: null }, { recipeVersionId: 'rv2' }, { recipeVersionId: 'rv-desconocida' }] }] }, { meals: [{ options: [{ recipeVersionId: 'rv1' }] }] }];
  const citadas = { rv1: { recipeId: 'r1' }, rv2: { recipeId: 'r2' } };
  assert.deepEqual(I.recetasDelPlan(dias, citadas), ['r1', 'r2']);
  assert.deepEqual(I.recetasDelPlan([{ meals: [{ options: [{ recipeVersionId: null }] }] }], citadas), []);
  const leidas = [{ recipeId: 'r1', name: 'Avena', image: null }, { recipeId: 'r2', name: 'Guiso', image: null }];
  const conImagen = { recipeId: 'r1', name: 'Avena', image: { mediaId: 'm1', paths: { thumbnail: '/a', large: '/b' } } };
  const m = I.porReceta(leidas, new Map([['r1', conImagen]]));
  assert.equal(m.get('r1'), conImagen, 'la imagen recién cargada reemplaza a la leída');
  assert.equal(m.get('r2').name, 'Guiso');
  const gancho = leer('app/pro/advisees/nutrition/imagenes-de-las-recetas.ts');
  assert.match(gancho, /api\.listarRecetas\(token, \{ limit: String\(RECETAS_POR_PAGINA\)/);
  assert.doesNotMatch(gancho, /consultarReceta|accederAMedio/);
  const editor = leer('app/pro/advisees/nutrition/editor.tsx');
  // Sin rutas firmadas no se pide la miniatura: el plato de respaldo.
  assert.match(editor, /const conRutas = deLaLista\?\.image\?\.paths \? deLaLista\.image : null;/);
  assert.match(editor, /medioId=\{conRutas\?\.mediaId \?\? null\}/);
  assert.match(editor, /<ImagenEnElCajon token=\{token\} sesionPerdida=\{sesionPerdida\} receta=\{deLaLista\} onCambio=\{imagenes\.actualizar\} \/>/);
  const comida = leer('app/pro/advisees/nutrition/comida-del-editor.tsx');
  assert.match(comida, /imagenDeLaOpcion\?\.\(o\.recipeVersionId, 'cabecera'\) \?\? <Icono nombre="receta" tamano=\{18\} \/>/);
  assert.match(comida, /imagenDeLaOpcion\(opcion\.recipeVersionId, 'cuerpo'\)/);
  // La miniatura mide lo que el renglón de la cabecera: no la agranda (RP-19).
  assert.match(ESTILOS, /\.opcion-plegable__miniatura \{[^}]*height: 2rem;/);
});

test('RP-24 · los textos nuevos no usan palabras prohibidas y el «%» lleva su base', () => {
  const R = leer('app/pro/advisees/nutrition/rangos-indicados.ts');
  for (const t of ["cambiarCorto: 'Cambiar'", "escribirCorto: 'Indicar'"]) assert.ok(R.includes(t), t);
  for (const t of [d.COPY_RECETARIO.yaDecidida, d.COPY_RECETARIO.conAlimentosAMano]) assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|asesorad|estaci[oó]n|%/i);
});
