/**
 * WP-EDITOR-ENTRENAMIENTO-TANDA-3 (DL-199) · sin React: la sugerencia de progresión en el panel del ejercicio y el cardio
 * en el editor (TEST-ET3-40 a TEST-ET3-44). Las cuentas viven en el dominio y tienen sus pruebas allá
 * (`packages/domain/src/editor-de-entrenamiento-tanda-3.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SUGERENCIA = leer('app/pro/advisees/training/sugerencia-de-progresion.tsx');
const PANEL = leer('app/pro/advisees/training/panel-del-editor.tsx');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const EJERCICIO = leer('app/pro/advisees/training/ejercicio-del-editor.tsx');
const CARDIO = leer('app/pro/advisees/training/cardio-del-ejercicio.tsx');
const VISTA = leer('app/pro/advisees/training/vista-de-la-persona.tsx');
const REVISAR = leer('app/pro/advisees/revisar-el-plan.ts');
const CSS = leer('app/globals.css');

test('TEST-ET3-40 · la sugerencia sale de la lectura de «La vez pasada» y va en el panel del ejercicio, arriba de la carga', () => {
  assert.match(PANEL, /\{sugerencia \? sugerencia\(lectura\.tipo === 'lista' \? lectura\.veces : null\) : null\}/);
  assert.match(EDITOR, /<SugerenciaDeProgresionEnElPanel\n/);
  // Con una progresión en la fase no se sugiere (ET3-D12); el cardio no la lleva; una plantilla no tiene persona.
  assert.match(EDITOR, /conProgresionDeLaFase=\{!!regla && regla\.model !== null && seAplicaA\(regla, ejercicioEnFoco\.prescriptionId\)\}/);
  assert.match(EDITOR, /plantilla \|\| foco\.tipo !== 'ejercicio' \|\| cardioDe\(ejercicioEnFoco\)/);
});

test('TEST-ET3-41 · nunca cambia nada sola: «Aplicar» escribe por el cambio del editor y «Descartar» se recuerda por la vez', () => {
  assert.match(EDITOR, /onAplicar=\{\(sugerida\) => cambiarEjercicio\(l, conLaCargaSubida\(ejercicioEnFoco, sugerida\)\)\}/);
  assert.match(SUGERENCIA, /claveDeLaSugerencia\(exerciseId, s\)/);
  assert.match(SUGERENCIA, /window\.sessionStorage\.setItem\(CLAVE_DE_LO_DESCARTADO/);
  // Las dos acciones son botones (sin subrayado) y el «?» va en la esquina, con su ejemplo.
  assert.match(SUGERENCIA, /className="boton boton--quieto boton--compacto"[\s\S]*data-aplicar-sugerencia/);
  assert.match(SUGERENCIA, /className="boton boton--discreto boton--compacto"[\s\S]*data-descartar-sugerencia/);
  assert.match(SUGERENCIA, /<ExplicacionAPedido nombre="Qué es la sugerencia de progresión" como="div" lugar="esquina">/);
  assert.match(D.COPY_SUGERENCIA_DE_PROGRESION.ejemplo, /^Ejemplo: /);
  // Sin color de juicio: el bloque usa el borde y el fondo suave de los tokens.
  const bloque = CSS.slice(CSS.indexOf('.sugerencia-de-progresion {'), CSS.indexOf('.sugerencia-de-progresion--hecha {'));
  assert.match(bloque, /background: var\(--fondo-suave\)/);
  assert.doesNotMatch(bloque, /--exito|--error|#[0-9a-f]{3,6}/i);
});

test('TEST-ET3-42 · el cardio en el editor: los campos del cardio en lugar de la planilla, sin aproximaciones ni criterio de fuerza', () => {
  assert.match(EJERCICIO, /\{cardio \? \(\n\s*<CardioDelEjercicio id=\{id\} nombre=\{nombre\} prescripcion=\{p\} onCambiar=\{onCambiar\} \/>\n\s*\) : \(\n\s*<SeriesDelEjercicio /);
  assert.match(EJERCICIO, /\{onAproximaciones && !cardio \? \(/);
  assert.match(EJERCICIO, /\{p\.sets\.length > 1 && !cardio \? \(/);
  assert.match(EJERCICIO, /\{cardio \? null : <CriterioDelEjercicio /);
  assert.match(EJERCICIO, /const criterioEfectivo: Criterio \| null = cardio \? null :/);
  // Pasar a cardio y volver a series, en «Más».
  assert.match(EJERCICIO, /COPY_CARDIO\.pasarASeries, alElegir: \(\) => onCambiar\(sinElCardio\(p\)\)/);
  assert.match(EJERCICIO, /COPY_CARDIO\.pasarACardio, alElegir: \(\) => onCambiar\(conElCardio\(p, CARDIO_SIN_INDICAR\)\)/);
  // Los de cardio por su clasificación entran como cardio.
  assert.match(EDITOR, /esDeCardioPorLaClasificacion\(marcados\[n\][^)]*\) \? conElCardio\(x, CARDIO_SIN_INDICAR\)/);
});

test('TEST-ET3-43 · los campos del cardio: lo que no se entiende no se guarda, el motivo en un renglón reservado y el lugar del valor siempre', () => {
  assert.match(CARDIO, /<p id=\{`\$\{id\}-cardio-motivo`\} className="cardio-del-ejercicio__motivo" role="status"/);
  assert.match(CARDIO, /data-valor-de-la-intensidad=\{tipo\}/);
  assert.match(CARDIO, /aria-invalid=\{duracionMal \|\| undefined\}/);
  assert.match(CARDIO, /<ExplicacionAPedido nombre="Cómo se planifica un ejercicio de cardio" como="div" lugar="esquina">/);
  assert.match(CARDIO, /<p>Ejemplo: ciclismo, 30 min, 12 km, zona 2\./);
  const bloque = CSS.slice(CSS.indexOf('.cardio-del-ejercicio__motivo {'));
  assert.match(bloque.slice(0, 200), /min-height: 1\.3em/);
  assert.match(CSS, /\.cardio-del-ejercicio__campos \{\n\s*display: grid;\n\s*grid-template-columns: repeat\(4, minmax\(9rem, 1fr\)\);/);
});

test('TEST-ET3-44 · «Ver como la persona» y «Antes de activar» con el cardio: su renglón y, si falta, la duración', () => {
  assert.match(VISTA, /\{cardioDe\(p\) \? \(\n\s*<p className="telefono-de-muestra__plan" data-vista-cardio>/);
  assert.match(REVISAR, /if \(cardio\) return void \(cardio\.duracionMinutos === null \? r\.push\(\{ code: INCOMPLETO\.sinDuracion, path: rp \}\) : undefined\);/);
  const sinDuracion = { prescriptions: [{ sets: [{ repetitions: null }], professionalParameters: [{ label: 'Duración', value: 'Sin indicar' }] }] };
  const conDuracion = { prescriptions: [{ sets: [{ repetitions: null }], professionalParameters: [{ label: 'Duración', value: 30, unit: 'min' }] }] };
  // La cuenta del dominio que usa la revisión.
  assert.equal(D.cardioDe(sinDuracion.prescriptions[0]).duracionMinutos, null);
  assert.equal(D.cardioDe(conDuracion.prescriptions[0]).duracionMinutos, 30);
});
