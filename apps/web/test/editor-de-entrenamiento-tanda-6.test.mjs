/**
 * Tanda 6 del editor de Entrenamiento (ET2-D05, a ratificar) · sin React: el % RM y la carga del «Común», atados con el
 * 1RM en las dos direcciones, y «Redondear las cargas a» en el plan y en «Más opciones». Las cuentas viven en el dominio
 * (`packages/domain/src/porcentaje-y-carga-atados.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const EJERCICIO = leer('app/pro/advisees/training/ejercicio-del-editor.tsx');
const UNO_RM = leer('app/pro/advisees/training/uno-rm-del-ejercicio.tsx');
const CUADROS = leer('app/pro/advisees/training/cuadros-del-plan.tsx');
const CSS = leer('app/globals.css');

test('T6-01 · escribir el % recalcula la carga, y escribir la carga recalcula el %, en un solo cambio (Ctrl+Z)', () => {
  assert.match(EJERCICIO, /const carga = cargaDelPorcentajeAtada\(v\);\n\s*setOrigenDeLaCarga\('porcentaje'\);\n\s*onCambiar\(carga \? \{ intensity, suggestedLoad: carga \} : \{ intensity \}\);/);
  assert.match(EJERCICIO, /const pct = unoRMDeLaCarga && suggestedLoad \? porcentajeDeLaCarga\(suggestedLoad, unoRMDeLaCarga\) : null;/);
  assert.match(EJERCICIO, /onCambiar\(\{ suggestedLoad, intensity: \{ criterion: 'PERCENT_RM', target: \{ value: pct,/);
  assert.match(EJERCICIO, /onCambiar=\{cambiarLaCargaComun\}/);
  // Lo que se guarda como objetivo es el %; la carga atada solo con el 1RM en la misma unidad.
  assert.match(EJERCICIO, /atadura\.vigente\.valor\.unit === unidad \? atadura\.vigente\.valor : null/);
});

test('T6-02 · lo derivado se ve: «del %» en la carga o «de la carga» en el %, con su lugar reservado (RP-19)', () => {
  assert.match(EJERCICIO, /delPorcentaje: 'del %'/);
  assert.match(EJERCICIO, /deLaCarga: 'de la carga'/);
  assert.match(EJERCICIO, /<span className="celda-atada__marca" aria-hidden="true" data-marca-de-la-celda-atada>\n\s*\{marca \?\? ''\}/);
  assert.match(CSS, /\.celda-atada__marca \{[^}]*position: absolute;/);
  assert.match(CSS, /\.celda-atada > input,\n\.celda-atada \.celda-de-serie \{\n\s*padding-block-start: 0\.75rem;/);
});

test('T6-03 · si cambia el 1RM o el redondeo, las cargas se actualizan solas; al abrir no se toca nada', () => {
  assert.match(EJERCICIO, /const claveDelUnoRM = atadura\?\.leido \?/);
  assert.match(EJERCICIO, /if \(antes === null \|\| antes === claveDelUnoRM \|\| !unoRMDeLaCarga\) return;/);
  // El 1RM lo lee el ejercicio abierto y lo comparten el renglón y la planilla.
  assert.match(EJERCICIO, /const conUnoRM = abierto && criterioEfectivo === 'PERCENT_RM' && asesoradoId !== null && exerciseId !== null;/);
  assert.match(EJERCICIO, /<UnoRMDelEjercicio id=\{id\} nombre=\{nombre\} prescripcion=\{p\} unidad=\{unidadDe\(p\)\} unoRM=\{unoRM\} redondeo=\{redondeo\} onCambiar=\{onCambiar\} \/>/);
});

test('T6-04 · sin 1RM, el % queda solo y se dice en una línea', () => {
  assert.match(UNO_RM, /<span data-sin-uno-rm>\{SIN_UNO_RM_PARA_LAS_CARGAS\}<\/span>/);
  assert.match(UNO_RM, /cargaAtadaAlPorcentaje\(pct, vigente\.valor, implementoDelEjercicio\(nombre, p\.loadBasis \?\? null\), redondeo\)/);
});

test('T6-05 · «Redondear las cargas a» en «Configurar plan» (2,5 por omisión) y la excepción en «Más opciones»', () => {
  assert.match(CUADROS, /value=\{String\(p\.loadRounding \?\? REDONDEO_POR_OMISION\)\}/);
  assert.match(CUADROS, /\{COPY_REDONDEO\.delPlan\}/);
  assert.match(EJERCICIO, /<option value="PLAN">\{COPY_REDONDEO\.comoElPlan\}<\/option>/);
  assert.match(EJERCICIO, /criterioEfectivo === 'PERCENT_RM' && onRedondeo \? <RedondeoDelEjercicio /);
  assert.match(EDITOR, /redondeo=\{redondeoDelEjercicio\(plan, p\.prescriptionId\)\}/);
  assert.match(EDITOR, /loadRoundingByExercise: r === null \? otros : \[\.\.\.otros, \{ prescriptionId: id, step: r \}\]/);
});
