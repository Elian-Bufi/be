/**
 * DL-201 (WP-PROGRESION-POR-EJERCICIO) · el cuadro ancho de «Progresión…» y la progresión por ejercicio en el editor
 * (TEST-PE-10 a TEST-PE-14). Las cuentas viven en el dominio y tienen sus pruebas allá
 * (`packages/domain/src/progresion-por-ejercicio.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CUADRO = leer('app/pro/advisees/training/asistente-de-progresion.tsx');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const EJERCICIO = leer('app/pro/advisees/training/ejercicio-del-editor.tsx');
const DESHACER = leer('app/pro/advisees/training/deshacer-del-editor.ts');
const FASES = leer('app/pro/advisees/training/fases-del-plan.ts');
const CSS = leer('app/globals.css');

test('TEST-PE-10 · un cuadro ancho al centro, con el título en un renglón y un solo «?» en la esquina', () => {
  assert.match(CUADRO, /forma="dialogo"\n\s+ancho\n/);
  assert.doesNotMatch(CUADRO, /forma="panel"/);
  assert.match(CUADRO, /titulo=\{\[P\.tituloCorto, fase, persona\]\.filter\(Boolean\)\.join\(' · '\)\}/);
  assert.match(CUADRO, /ayuda=\{\{ nombre: 'Cómo funciona la progresión, con ejemplos', contenido: <AyudaDeLaProgresion \/> \}\}/);
  // El «?» pegado al título, a la izquierda; «Cerrar», solo a la derecha.
  assert.match(CSS, /\.asistente-de-progresion \.cuadro-enfocado__ayuda \{\n  align-self: center;\n  margin-inline-start: 0;\n\}/);
  assert.match(CSS, /\.asistente-de-progresion \.cajon__cerrar \{\n  margin-inline-start: auto;\n\}/);
  // Ningún «?» suelto: ni en el modelo ni en la descarga.
  assert.doesNotMatch(CUADRO, /ExplicacionAPedido/);
  // El ejemplo resuelto de cada modelo y de la descarga, en la ayuda.
  assert.match(CUADRO, /P\.ejemplos\[m\]/);
  assert.match(CUADRO, /P\.descargaEjemplo/);
});

test('TEST-PE-11 · dos columnas: la configuración a la izquierda y la vista previa en vivo a la derecha', () => {
  assert.match(CUADRO, /className="asistente-de-progresion__configuracion"/);
  assert.match(CUADRO, /<section className="asistente-de-progresion__vista-previa"/);
  assert.match(CSS, /\.asistente-de-progresion__cuerpo \{\n  position: relative;\n  display: grid;\n  grid-template-columns: minmax\(0, 33rem\) minmax\(0, 1fr\);/);
  // El selector de modelo en una fila; la lista de ejercicios se desplaza sola.
  assert.match(CSS, /\.asistente-de-progresion__selector \{\n  display: flex;\n  flex-wrap: nowrap;/);
  assert.match(CSS, /\.asistente-de-progresion__elegidos \{[^}]*max-height: 10\.5rem;\n  overflow-y: auto;/);
  // El ejercicio de muestra, de un desplegable entre los afectados; la descarga, marcada en la tabla.
  assert.match(CUADRO, /data-campo="ejercicio-de-muestra"/);
  assert.match(CUADRO, /asistente-de-progresion__marca-de-descarga/);
  // Las casillas y los radios con el estilo de BE.
  assert.match(CSS, /\.asistente-de-progresion input:is\(\[type='checkbox'\], \[type='radio'\]\):not\(\.selector-segmentado__opcion input\) \{\n  appearance: none;/);
  // Junto a su tema, no al final de la hoja.
  assert.ok(CSS.indexOf('.asistente-de-progresion__cuerpo {') < CSS.indexOf('.selector-segmentado {'));
});

test('TEST-PE-12 · «Se aplica a»: toda la fase o los ejercicios elegidos, por sesión, con la ficha de la regla propia', () => {
  assert.match(CUADRO, /\{P\.aToda\} \(\{ejercicios\.length === 1 \? '1 ejercicio' : `\$\{ejercicios\.length\} ejercicios`\}\)/);
  assert.match(CUADRO, /asistente-de-progresion__nombre-de-la-sesion/);
  assert.match(CUADRO, /data-con-regla-propia/);
  assert.match(CUADRO, /const textoPrincipal = elegidos !== null \? P\.aplicarA\(elegidos\.length\)/);
  assert.equal(D.COPY_PROGRESIONES.aplicarA(1), 'Aplicar a 1 ejercicio');
  assert.equal(D.COPY_PROGRESIONES.aplicar, 'Aplicar a la fase');
  assert.match(CUADRO, /data-usar-la-de-la-fase/);
});

test('TEST-PE-13 · en el editor: «Progresión…» en el «Más» del ejercicio, su regla plegado y la cuenta en la fase', () => {
  assert.match(EJERCICIO, /\{ clave: 'progresion', texto: COPY_PROGRESION_DEL_EJERCICIO, alElegir: onProgresion \}/);
  assert.match(EJERCICIO, /\{!abierto && progresionPropia \? \(/);
  assert.match(EDITOR, /setProgresionAbierta\(\{ blockId: fase, prescriptionId: id, copia: null \}\)/);
  assert.match(EDITOR, /COPY_PROGRESIONES\.conPropias\(/);
  assert.match(EDITOR, /desdeElEjercicio=\{progresionAbierta\.prescriptionId \?\? null\}/);
});

test('TEST-PE-14 · deshacer cubre aplicar y quitar; duplicar la fase copia las reglas propias', () => {
  for (const clave of ['aplicasteLaProgresion', 'aplicasteLaProgresionA', 'quitasteLaProgresion', 'volvisteALaDeLaFase']) assert.match(DESHACER, new RegExp(`  ${clave}: `));
  assert.match(EDITOR, /cambiarPlanificacion\(p, deshacer\);/);
  assert.match(EDITOR, /cambiarPlanificacion\(sinReglaPropia\(plan, ids\), COPY_DESHACER\.volvisteALaDeLaFase\(ids\.length\)\);/);
  assert.match(FASES, /reglasPropiasParaLaCopia\(p, original, copia\.bloque\.blockId!, copia\.prescripciones\)/);
});
