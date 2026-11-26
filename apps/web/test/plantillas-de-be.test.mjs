/**
 * WP-EDITOR-ENTRENAMIENTO-TANDA-3 (DL-199) · sin React: las Plantillas de BE en el website (TEST-ET3-30 a TEST-ET3-34).
 * Las cuentas viven en el dominio (`packages/domain/src/plantillas-de-be.test.ts`) y la API en su prueba de integración.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const DIALOGO = leer('app/pro/advisees/empezar-desde-plantilla.tsx');
const PLAN = leer('app/pro/advisees/training/plan.tsx');
const NUTRICION = leer('app/pro/advisees/nutrition/plan.tsx');
const ADMIN = leer('app/admin/training-templates/plantillas-de-be.tsx');
const PAGINA = leer('app/admin/training-templates/page.tsx');
const MENU = leer('app/admin/menu-administrativo.tsx');
const CSS = leer('app/globals.css');

test('TEST-ET3-30 · el selector de origen «Mis plantillas · Plantillas de BE» va solo en Entrenamiento, como el del Recetario', () => {
  assert.match(DIALOGO, /className="selector-de-origen" role="group" aria-label=\{COPY_PLANTILLAS_DE_BE\.deDonde\}/);
  assert.match(DIALOGO, /aria-pressed=\{origen === 'mias'\}/);
  assert.match(DIALOGO, /aria-pressed=\{origen === 'be'\}/);
  assert.equal(D.COPY_PLANTILLAS_DE_BE.mias, 'Mis plantillas');
  assert.equal(D.COPY_PLANTILLAS_DE_BE.deBe, 'Plantillas de BE');
  assert.match(PLAN, /deBe=\{\{ leer: leerPlantillasDeBe, onAplicar: \(clave, version\) => void aplicarDeBe\(clave, version\) \}\}/);
  assert.doesNotMatch(NUTRICION, /deBe=/, 'Nutrición sigue con sus plantillas propias');
});

test('TEST-ET3-31 · las de BE se leen la primera vez que se eligen, con su falla y su reintento; la elegida muestra sus fases', () => {
  assert.match(DIALOGO, /if \(abierto && origen === 'be' && lecturaDeBe === null\) void cargarDeBe\(\);/);
  assert.match(DIALOGO, /titulo=\{COPY_PLANTILLAS_DE_BE\.noCargaron\} onReintentar=\{onReintentar\}/);
  assert.match(DIALOGO, /data-vista-de-la-plantilla-de-be/);
  assert.match(DIALOGO, /COPY_PLANTILLAS_DE_BE\.propuesta/);
  assert.match(DIALOGO, /confirmarDeshabilitado=\{enBe \? !laDeBe : !elegida\}/);
  // La vista tiene un alto reservado y la lista no se corre al elegir (RP-19).
  // Un alto fijo: con un mínimo y un tope, elegir agrandaba el diálogo (centrado) y la lista subía.
  const vista = CSS.slice(CSS.indexOf('.plantilla-de-be__vista {'), CSS.indexOf('}', CSS.indexOf('.plantilla-de-be__vista {')));
  assert.match(vista, /\n\s*block-size: min\(60vh, 34rem\);/);
  assert.doesNotMatch(vista, /min-block-size|max-block-size/);
});

test('TEST-ET3-32 · aplicarla usa API-TPB-02 con la versión que se vio, y el aviso dice lo resuelto, lo que falta y lo que no entró', () => {
  assert.match(PLAN, /api\.crearPlanDesdePlantillaDeBe\(token, asesoradoId, \{ objectiveVersionId: objetivo, templateKey: clave, templateVersion: version \}/);
  assert.match(PLAN, /COPY_PLANTILLAS_DE_BE\.paraCompletar\(sinUnoRM\)/);
  assert.match(PLAN, /COPY_PLANTILLAS_DE_BE\.noEntraron\(unavailableExercises\)/);
  assert.equal(D.resumenDeLasCargas([{ estado: 'RESUELTA' }, { estado: 'SIN_UNO_RM' }]), '1 de 2 cargas en % RM salen del 1RM de la persona; las otras quedan para completar.');
  assert.equal(D.COPY_PLANTILLAS_DE_BE.paraCompletar(['Press de banca plano con barra']), 'Sin 1RM, para completar: Press de banca plano con barra.');
});

test('TEST-ET3-33 · Administración: /admin/training-templates, en el menú, para ofrecerlas o retirarlas con su historia', () => {
  assert.match(PAGINA, /<PuertaAdministrativa>/);
  assert.match(MENU, /href="\/admin\/training-templates"/);
  assert.match(ADMIN, /apiAdministrativa\.plantillasDeBe\(token\)/);
  assert.match(ADMIN, /apiAdministrativa\.decidirSobrePlantillaDeBe\(sesion\.token, p\.key/);
  assert.match(ADMIN, /data-historia/);
  // El renglón del aviso, reservado (RP-19), y las acciones como botón (sin subrayado).
  assert.match(ADMIN, /recetario__lugar-del-aviso" role="alert"/);
  assert.doesNotMatch(ADMIN, /<a /);
});

test('TEST-ET3-34 · los textos: sin las palabras que BE no usa, y todo «%» con su base', () => {
  const textos = JSON.stringify([D.COPY_PLANTILLAS_DE_BE.queTraen, D.COPY_PLANTILLAS_DE_BE_EN_ADMINISTRACION, D.PLANTILLAS_DE_BE]).toLowerCase();
  for (const w of ['cumplimiento', 'adherencia', 'racha', 'puntaje', 'asesorado', 'estación', 'volumen']) assert.equal(textos.includes(w), false, w);
  assert.match(D.COPY_PLANTILLAS_DE_BE.queTraen, /% RM salen del 1RM/);
});
