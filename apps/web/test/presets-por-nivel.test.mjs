/**
 * WP-PRESETS-POR-NIVEL (DL-203) · sin React: los presets de BE en la intensidad del plan (parte 2) y los presets de fase
 * y de sesión del profesional (parte 3). Las cuentas, en el dominio (`packages/domain/src/prescripcion-rapida.test.ts`
 * y `packages/domain/src/presets-por-nivel.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as d from '@be/domain';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const GALERIA = leer('app/pro/advisees/galeria-de-presets.tsx');
const A = await import('../src/app/pro/advisees/alcance-del-preset.ts');
const { AYUDAS_DEL_EDITOR } = await import('../src/app/pro/advisees/training/ayudas-del-editor.tsx').catch(() => ({ AYUDAS_DEL_EDITOR: null }));

const hipertrofia = d.PRESETS_DE_PRESCRIPCION.find((p) => p.clave === 'HIPERTROFIA');
const ejercicio = (extra = {}) => ({ exerciseVersionId: 'e1', sets: [{ repetitions: { value: 10 } }], intensity: null, ...extra });

// ─── Parte 2 · la galería de presets de prescripción ─────────────────────────────────────────────────────────────

test('PN-2.1 · el alcance de un preset de BE sigue la intensidad de cada ejercicio: RPE 8, 70 % RM o sin esfuerzo', () => {
  const ps = [ejercicio(), ejercicio({ intensity: { criterion: 'PERCENT_RM', target: { value: 80, reference: null } }, suggestedLoad: { value: 60, unit: 'kg' } })];
  const intensidadDe = (p) => d.intensidadParaElPreset(p, 'RPE', false);
  const a = A.alcanceDelPresetDeBe(ps, [0, 1], hipertrofia, intensidadDe, () => 'Sentadilla', 'Piernas A');
  assert.deepEqual(a.filas.map((f) => f.cambio.intensidad.despues), ['RPE 8', '70 % RM']);
  assert.equal(a.nuevas.get(0).intensity.target.value, 2, 'RPE 8 se guarda como RIR 2');
  assert.equal(a.nuevas.get(1).intensity.criterion, 'PERCENT_RM');
  // En % RM la carga sale del 1RM: no queda «para revisar» ni dice que «se conserva».
  assert.equal(a.filas[1].cambio.carga.delUnoRm, true);
  assert.equal(a.filas[1].cambio.carga.revisar, null);
  assert.doesNotMatch(a.resumen, /se conservan/);
  // Sin esfuerzo: «Solo carga y repeticiones».
  const sin = A.alcanceDelPresetDeBe([ejercicio({ sets: [{ repetitions: null }] })], [0], hipertrofia, () => 'NONE', () => 'Sentadilla', 'Piernas A');
  assert.equal(sin.nuevas.get(0).intensity, null);
  assert.equal(sin.soloLlenaLoVacio, true, 'un ejercicio vacío: con un clic');
});

test('PN-2.1 · la galería y el editor leen los presets en la intensidad del plan y piden la carga del 1RM', () => {
  assert.match(GALERIA, /detalleDelPreset\(p, intensidad\)/);
  assert.match(GALERIA, /alcanceDelPresetDeBe\(prescripciones, posiciones, elegido\.preset, intensidadDe, nombreDe, nombreDeLaSesion\)/);
  assert.match(GALERIA, /f\.cambio\.carga\.delUnoRm \? C\.cargaQueSaleDelUnoRm/);
  assert.doesNotMatch(GALERIA, /prescripcionDelPreset\(elegido\.preset\)/, 'mutación: vuelve el RIR fijo');
  assert.match(EDITOR, /intensidad=\{intensidadElegida\(plan, notacion\)\}/);
  assert.match(EDITOR, /intensidadParaElPreset\(p, intensidadElegida\(plan, notacion\), !!p\.prescriptionId && \(plan\.withoutIntensity \?\? \[\]\)\.includes\(p\.prescriptionId\)\)/);
  assert.match(EDITOR, /calcularLasCargasDe\(\[\.\.\.a\.nuevas\.values\(\)\]\);/);
  // La carga del % RM sale del 1RM con el redondeo del plan, y no se apila aparte (Ctrl+Z vuelve a antes del preset).
  assert.match(EDITOR, /\(q\) => redondeoDelEjercicio\(planDelUnoRM, q\.prescriptionId\),\n\s*\);\n\s*if \(r\.cuantas > 0\) \{\n\s*setBloques\(r\.bloques\);\n\s*setSucio\(true\);\n\s*\}/);
  assert.ok(EDITOR.indexOf('const [cargasPorCalcular, setCargasPorCalcular]') < EDITOR.indexOf("if (error === 'no-disponible' && plantilla) return"), 'los hooks antes de las salidas tempranas');
});

test('PN-2.2 · «Elegí un preset para ver qué trae» aparece una sola vez: junto a «Usar» apagado', () => {
  assert.equal(GALERIA.split('C.nadaElegido').length - 1, 1);
  assert.match(GALERIA, /apagado: !elegido \? C\.nadaElegido/);
});

test('PN-2.3 · el «?» va pegado al título, con un ejemplo resuelto (II.17)', () => {
  assert.match(GALERIA, /ayuda=\{\{ nombre: AYUDAS_DEL_EDITOR\.presets\.nombre, contenido: <ContenidoDeLaAyuda ayuda=\{AYUDAS_DEL_EDITOR\.presets\} \/> \}\}/);
  const fuente = leer('app/pro/advisees/training/ayudas-del-editor.tsx');
  assert.match(fuente, /presets: \{\n\s*nombre: 'Qué es un preset',/);
  assert.match(fuente, /ejemplo:\n\s*'Ejemplo: «Hipertrofia» en un plan en RPE escribe 4 × 8-12 con RPE 8/);
  if (AYUDAS_DEL_EDITOR) for (const t of Object.values(AYUDAS_DEL_EDITOR.presets).flat()) assert.deepEqual(d.terminosProhibidosDeEntrenamientoEn(t), [], t);
});
