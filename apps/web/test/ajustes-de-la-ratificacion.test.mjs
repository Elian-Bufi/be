/**
 * Ajustes de la ratificación de Dirección del 19/11 (wp-ajustes-de-la-ratificacion) · lo que toca la web. Lo puro se
 * prueba con datos; de las pantallas se lee la fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fuente = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ─── ENP-D01 · «Bloque N» de un plan viejo se lee «Fase N» ─────────────────────────────────────────────────────

test('ENP-D01 · en el editor (copiar a, el asistente) la fase «Bloque 2» de un plan viejo se lee «Fase 2»', async () => {
  const C = await import('../src/app/pro/advisees/training/copiar-a.ts');
  const A = await import('../src/app/pro/advisees/asistente/operaciones-del-asistente.ts');
  const viejo = [
    { blockId: 'b1', label: 'Bloque 1', sessions: [{ sessionId: 's1', label: 'Piernas', instructions: null, prescriptions: [] }] },
    { blockId: 'b2', label: 'Bloque 2', sessions: [{ sessionId: 's2', label: 'Torso', instructions: null, prescriptions: [] }] },
  ];
  assert.deepEqual(C.gruposDelPlan(viejo).map((g) => g.nombre), ['Fase 1', 'Fase 2']);
  assert.deepEqual(A.gruposDelAsistente(viejo).map((g) => g.titulo), ['Fase 1', 'Fase 2']);
  // El dato guardado no cambia.
  assert.equal(viejo[1].label, 'Bloque 2');
});

test('ENP-D01 · la versión activa, lo compartido, la plantilla y la historia anterior muestran la fase con su nombre para leer', () => {
  assert.match(fuente('../src/app/pro/advisees/training/plan.tsx'), /const bloques = conNombresDeFase\(version\.blocks\);\n  const mira: LoQueSeMiraDelPlan = loQueSeMiraDelPlan\(bloques,/);
  assert.match(fuente('../src/app/pro/advisees/seguimiento/plan-compartido.tsx'), /const bloques = conNombresDeFase\(enOrden\(plan\.plan\.blocks\)\);/);
  assert.match(fuente('../src/app/pro/templates/detalle-de-la-plantilla.tsx'), /\{nombreDeLaFase\(b\.label, i\)\}/);
  assert.match(fuente('../src/app/pro/advisees/previous-history/historia-anterior.ts'), /conDetalle\(nombreDeLaFase\(b\.label, i\)/);
  assert.match(fuente('../src/app/pro/advisees/training/agenda-del-plan.tsx'), /\[nombreDeLaFase\(b\.label, bi\)\]/);
  assert.match(fuente('../src/app/pro/advisees/training/editor.tsx'), /const nombreDelBloque = \(b: \{ readonly label: string \}, n: number\): string => nombreDeLaFase\(b\.label, n\);/);
});

// ─── La nota de origen de Nutrición: la versión que se aplicó ──────────────────────────────────────────────────

test('la nota de origen de Nutrición sale de notaDeOrigenNutricional, con la versión aplicada (como en Entrenamiento)', () => {
  const pieza = fuente('../src/app/pro/advisees/nutrition/plantillas.tsx');
  assert.match(pieza, /setTexto\(notaDeOrigenNutricional\(origen, r\.ok \? r\.datos\.data : null\)\);/);
  assert.doesNotMatch(pieza, /COPY_PLANTILLAS\.creadaDesde\(r\.datos\.data\.name, r\.datos\.data\.versionNumber\)/, 'nunca el número de la vigente como el aplicado');
});

// ─── DL-108 D-3 · al guardar como plantilla, los nombres, los parámetros y la referencia del %RM ────────────────

test('DL-108 D-3 · los diálogos de «Guardar como plantilla» muestran lo que viaja, además de las notas, para vaciarlo', () => {
  const entrenamiento = fuente('../src/app/pro/advisees/training/plantillas.tsx');
  assert.match(entrenamiento, /items=\{loQueViajaALaPlantilla\(estructura\)\}/);
  assert.match(entrenamiento, /onVaciar=\{\(x\) => setEstructura\(\(e\) => vaciarLoQueViaja\(e, x\)\)\}/);
  const nutricion = fuente('../src/app/pro/advisees/nutrition/plantillas.tsx');
  assert.match(nutricion, /items=\{loQueViajaALaPlantillaNutricional\(estructura\)\}/);
  // Lo que se guarda es la estructura revisada, no la de entrada.
  assert.match(entrenamiento, /structure: estructura,/);
  assert.match(nutricion, /structure: estructura,/);
  const pieza = fuente('../src/app/pro/advisees/lo-que-viaja-a-la-plantilla.tsx');
  assert.match(pieza, /aria-label=\{`\$\{accion\}: \$\{x\.rotulo\}`\}/, 'cada botón dice qué vacía');
});

// ─── «Sin indicar» en seguimiento y gráficos ────────────────────────────────────────────────────────────────────

test('«Sin indicar» en todas las pantallas: lo que el profesional no indicó no se dice «Sin objetivo»', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const raiz = (ruta) => fileURLToPath(new URL(ruta, import.meta.url));
  const archivos = (dir) => readdirSync(dir).flatMap((n) => (n === 'node_modules' ? [] : statSync(join(dir, n)).isDirectory() ? archivos(join(dir, n)) : /\.tsx?$/.test(n) && !/\.test\./.test(n) ? [join(dir, n)] : []));
  // Solo los textos (entre comillas), no los comentarios: ningún texto que empiece con «Sin objetivo» en el website, el
  // dominio ni la APK (Dirección, 19/11: un valor que el profesional no indicó se dice «Sin indicar» en todas las pantallas).
  for (const archivo of [...archivos(raiz('../src/')), ...archivos(raiz('../../../packages/domain/src/')), ...archivos(raiz('../../mobile/src/'))]) {
    const texto = readFileSync(archivo, 'utf8');
    assert.doesNotMatch(texto, /['"`][Ss]in objetivo/, archivo);
  }
  const dominio = await import('@be/domain');
  assert.equal(dominio.COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo, 'Sin indicar', 'el texto compartido: el editor, la versión activa, los registros y la APK');
  const C = await import('../src/app/pro/advisees/graficos/nutricion/copy.ts');
  assert.equal(C.COPY_NUTRICION_EN_GRAFICOS.sinObjetivo, 'Sin indicar');
  const d = await import('@be/domain');
  assert.equal(d.objetivoParaExportar([], '2026-11-01', '2026-11-07'), 'sin indicar');
  // El objetivo vigente que no se indicó, en «Información». («sin dato», lo que el catálogo no tiene, es otra cosa y se queda.)
  assert.match(fuente('../src/app/pro/advisees/seguimiento/informacion.tsx'), /: 'Sin indicar'\}/);
});

// ─── El catálogo de ejercicios a 1280 × 800 ─────────────────────────────────────────────────────────────────────

test('El catálogo a 1280 × 800: «Prescripción para todos» va plegada y el pie comparte su último renglón; la escena 11 exige 3 resultados', () => {
  const catalogo = fuente('../src/app/pro/advisees/training/agregar-ejercicio.tsx');
  assert.match(catalogo, /<details\n\s+className="agregar-ejercicio__para-todos-pliegue"\n\s+open=\{paraTodosAbierta\}/, 'plegada; la abre quien la usa');
  // Revisión adversaria del 19/11: cerrada con algo que no se entiende, «Agregar» no es un return mudo. Antes el «open»
  // seguía en true (había algo escrito), React no reabría el pliegue cerrado a mano y el motivo quedaba adentro, sin verse.
  assert.match(catalogo, /if \(lectura && !lectura\.ok\) return setParaTodosAbierta\(true\);/, 'abre el pliegue para mostrar el motivo');
  assert.match(catalogo, /lectura && !paraTodosAbierta \? <span className="campo__error"> · \{V\.prescripcionNoSeEntiende\}<\/span>/, 'cerrado, el rótulo avisa');
  assert.ok(catalogo.indexOf('<details') < catalogo.indexOf('<label className="agregar-ejercicio__para-todos" data-para-todos>'), 'el campo va adentro del pliegue');
  assert.match(catalogo, /setParaTodosAbierta\(false\);\n\s+\}, \[abierto\]\);/, 'cada apertura empieza plegada');
  const css = fuente('../src/app/globals.css');
  assert.match(css, /\.agregar-ejercicio__para-todos-pliegue \{\n\s+flex: 0 1 auto;/);
  assert.match(css, /\.agregar-ejercicio__para-todos-pliegue\[open\] \{\n\s+flex-basis: 100%;/);
  assert.match(css, /\.agregar-item__antes\.agregar-ejercicio__aviso-del-catalogo \{\n\s+flex: 1 1 9rem;/, 'el aviso del catálogo ya no ocupa un renglón entero');
  const capturas = fuente('../../../EVIDENCIA/ENTRENAMIENTO-PLANIFICACION/herramientas/capturas.mjs');
  assert.match(capturas, /if \(window\.innerWidth <= 1280 && window\.innerHeight <= 800 && enteras < 3\) problemas\.push/);
  assert.match(capturas, /nombre: '11b-prescripcion-para-todos-abierta'/);
});
