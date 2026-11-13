/**
 * ED-11, ED-12, ED-15, ED-17, ED-24 y ED-25 · La estación de tres zonas y la galería de presets (WP-EDITORES-PROFESIONAL).
 * Lo que tiene lógica se prueba sin React (`estacion/estacion.ts`, `alcance-del-preset.ts`); del editor se lee la fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const d = await import('@be/domain');
const E = await import('../src/app/pro/advisees/estacion/estacion.ts');
const A = await import('../src/app/pro/advisees/alcance-del-preset.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const GALERIA = leer('app/pro/advisees/galeria-de-presets.tsx');

test('TEST-EDP-025 · los chips escriben la agenda de DL-137; un día con dos sesiones se dice, no se impide', () => {
  const hoy = '2026-11-16';
  let a = E.alternarDia(null, 's1', 'TUESDAY', hoy);
  assert.deepEqual(a, { startDate: hoy, sessions: [{ sessionId: 's1', weekdays: ['TUESDAY'] }], moves: [] });
  a = E.alternarDia(a, 's1', 'MONDAY', hoy);
  assert.deepEqual(a.sessions[0].weekdays, ['MONDAY', 'TUESDAY']);
  a = E.alternarDia(a, 's2', 'TUESDAY', hoy);
  const nombre = (id) => ({ s1: 'Torso A', s2: 'Piernas A' })[id];
  assert.deepEqual(E.diasCompartidos(a, 's2', nombre), ['martes, con Torso A']);
  // Se puede: los dos quedan en la agenda.
  assert.equal(a.sessions.length, 2);
  // Un chip no reordena la agenda; «Sin día» saca la sesión.
  a = E.alternarDia(a, 's1', 'FRIDAY', hoy);
  assert.deepEqual(a.sessions.map((s) => s.sessionId), ['s1', 's2']);
  assert.deepEqual(E.sinDias(a, 's1').sessions.map((s) => s.sessionId), ['s2']);
  // Apagar el último día también la saca: la API no admite una sesión sin días.
  assert.deepEqual(E.alternarDia(E.alternarDia(null, 's3', 'MONDAY', hoy), 's3', 'MONDAY', hoy).sessions, []);
  // Los días del preset, de una vez y en el orden de la semana.
  assert.deepEqual(E.ponerDias(null, 's1', ['FRIDAY', 'MONDAY'], hoy).sessions[0].weekdays, ['MONDAY', 'FRIDAY']);
  // La tira de la semana.
  const tira = E.tiraDeLaSemana(a, nombre);
  assert.deepEqual(tira.find((x) => x.dia === 'TUESDAY').sesiones, ['Torso A', 'Piernas A']);
  assert.equal(tira.length, 7);
});

const hipertrofia = d.prescripcionDelPreset(d.PRESETS_DE_PRESCRIPCION.find((p) => p.clave === 'HIPERTROFIA'));
const ej = (reps, extra = {}) => ({ exerciseVersionId: 'e', sets: [{ repetitions: reps }, { repetitions: reps }, { repetitions: reps }], intensity: null, ...extra });

test('TEST-EDP-013 · el alcance: la vista previa del paquete, y «Deshacer» devuelve exacto', () => {
  const sesion = [ej({ min: 6, max: 8 }, { suggestedLoad: { value: 140, unit: 'kg' } }), ej({ value: 8 }, { suggestedLoad: { value: 24, unit: 'kg' } }), ej({ value: 6 }), ej({ value: 8 }), ej({ value: 10 })];
  const a = A.alcanceDelPreset(sesion, [0, 1, 2, 3, 4], hipertrofia, () => 'X', 'Torso A');
  assert.equal(a.resumen, 'Se actualizan 5 ejercicios de Torso A. Las cargas se conservan y quedan para revisar. Cada uno pasa de 3 a 4 series.');
  assert.equal(a.soloLlenaLoVacio, false);
  const aplicadas = A.conLasDeLaPosicion(sesion, a.nuevas);
  assert.equal(aplicadas[0].suggestedLoad.value, 140);
  assert.equal(a.filas[0].cambio.carga.revisar, 'escrita para 6-8: revisala');
  // «Deshacer» es la operación inversa: con lo de antes, sale idéntico.
  assert.deepEqual(A.conLasDeLaPosicion(aplicadas, a.antes), sesion);
  // Aplicar dos veces no duplica series.
  const dos = A.conLasDeLaPosicion(aplicadas, A.alcanceDelPreset(aplicadas, [0, 1, 2, 3, 4], hipertrofia, () => 'X', 'Torso A').nuevas);
  assert.deepEqual(dos, aplicadas);
  // Un ejercicio recién agregado (una serie sin nada) se llena con un clic.
  assert.equal(A.alcanceDelPreset([{ exerciseVersionId: 'e', sets: [{ repetitions: null }], intensity: null }], [0], hipertrofia, () => 'X', 'A').soloLlenaLoVacio, true);
});

test('TEST-EDP-014 · la galería: nada viene elegido al abrir, y si pisa algo pasa por la vista previa del alcance', () => {
  assert.match(GALERIA, /const \[elegido, setElegido\] = useState<Elegido>\(null\);/);
  assert.match(GALERIA, /if \(paso === 'elegir' && !alcance\.soloLlenaLoVacio\) return setPaso\('alcance'\);/);
  // Un cuadro enfocado, con un solo principal (ED-10).
  assert.match(GALERIA, /<CuadroEnfocado\n/);
  assert.doesNotMatch(GALERIA, /boton--primario/);
});

test('TEST-EDP-015 · «Guardar como preset» escribe en lo que ya existe, y lo que no se puede se dice', () => {
  const menu = EDITOR.slice(EDITOR.indexOf('id="mas-de-la-version"'), EDITOR.indexOf('{/* ED-15: a 1280'));
  assert.match(menu, /CE\.elPlanComoPlantilla\}`, alElegir: \(\) => setGuardarPlantilla\(true\)/);
  assert.match(menu, /CE\.laSesionComoHabitual\}`,\n\s*alElegir: \(\) => \{\n\s*if \(sesion\) setSesionHabitual\(structuredClone\(sesion\)\);/);
  // ED-13: la prescripción habitual abre su diálogo (API-HAB-07, desde `prescripcion-habitual.tsx`); sin series, apagada con su motivo.
  assert.match(menu, /CE\.lasSeriesComoPrescripcion\}`, alElegir: \(\) => setPrescripcionHabitual\(true\), noSePuede: antesHayQueCorregir \?\? \(sesion\?\.prescriptions\.some\(\(x\) => x\.sets\.length > 0\) \? null : CE\.sinSeriesParaPrescripcion\) \}/);
  assert.doesNotMatch(EDITOR, /\/presets|api\.\w*[Pp]reset/);
});

test('TEST-EDP-054 · la barra: «Guardar ahora» y «Revisar y activar…» con su nombre fijo, y un solo botón lleno', () => {
  const barra = EDITOR.slice(EDITOR.indexOf('data-barra-de-comandos'), EDITOR.indexOf('<nav className="estacion__saltos"'));
  assert.equal((barra.match(/boton--primario/g) ?? []).length, 1);
  assert.match(barra, /\{COPY_GUARDADO\.guardarAhora\}/);
  assert.match(barra, /\{COPY_ANTES_DE_ACTIVAR\.revisarYActivar\}/);
  // Ningún texto de la barra depende del guardado: ni «Guardando…» en un botón ni un cambio de nombre.
  assert.doesNotMatch(barra, /guardando \? |sucio \? '|\{guardando && /);
});

test('TEST-EDP-018 · las tres zonas, con su salto por teclado y su propio desplazamiento', () => {
  for (const zona of ['estructura', 'editor', 'panel']) {
    assert.match(EDITOR, new RegExp(`id="zona-${zona}" className="estacion__zona[^"]*" data-zona="${zona}"[^>]*tabIndex=\\{-1\\}`), zona);
  }
  assert.match(EDITOR, /\['zona-estructura', CE\.irALaEstructura\],\n\s*\['zona-editor', CE\.irAlEditor\],\n\s*\['zona-panel', CE\.irAlPanel\],/);
  const css = leer('app/globals.css');
  assert.match(css, /\.estacion__zona \{\n\s*min-height: 0;\n\s*overflow-y: auto;/);
});

test('TEST-EDP-020 · la ayuda se dice una vez: el párrafo fijo se fue a la ayuda de primer uso, que se recuerda', () => {
  assert.doesNotMatch(EDITOR, /La persona no ve esta versión, y guardar no la activa/);
  assert.equal(E.PRIMER_USO_DE_LA_ESTACION.renglones.length, 3);
  const primerUso = leer('components/primer-uso.tsx');
  assert.match(primerUso, /window\.localStorage\.setItem\(clave, 'cerrada'\)/);
  assert.match(primerUso, /\} catch \{/);
  for (const t of [...E.PRIMER_USO_DE_LA_ESTACION.renglones, ...Object.values(E.COPY_ESTACION).filter((v) => typeof v === 'string')]) {
    assert.deepEqual(d.terminosProhibidosEn(t), [], t);
    assert.doesNotMatch(t, /asesorad|DL-|TB-|ED-/i, t);
  }
});

test('TEST-EDP-026 · el panel dice en vivo lo mismo que el cuadro, sin esperar a «Revisar»', () => {
  // PG-10 (WP-PULIDO-GRANDES): lo mismo, con los iguales del mismo ejercicio en un renglón.
  assert.match(EDITOR, /const sinCompletarEnVivo = enGrupos\(loQueQuedaSinCompletarEnEntrenamiento\(bloques\), enElPanel\)/);
  assert.match(EDITOR, /\.\.\.impideGuardar\.map\(\(p\) => enElPanel\(/);
  // La validación final sigue siendo la de la API: el panel no activa.
  const panel = EDITOR.slice(EDITOR.indexOf('id="zona-panel"'), EDITOR.indexOf('</aside>'));
  assert.doesNotMatch(panel, /activar\(\)|api\./);
});
