/**
 * ED-13 · Los presets propios en el website (WP-EDITORES-PROFESIONAL; DL-167): una prescripción habitual se aplica como
 * un preset de BE (DJ-8): con un clic si solo llena lo vacío, con la vista previa del alcance si pisa algo, las cargas
 * se conservan y «Deshacer» devuelve lo de antes. Y el reparto habitual se escribe siempre en gramos (DJ-7).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const A = await import('../src/app/pro/advisees/alcance-del-preset.ts');

const habitual = { sets: [{ repetitions: { value: 3 } }, { repetitions: { value: 3 } }, { repetitions: { value: 3 } }], intensity: { criterion: 'RIR', target: { value: 1, reference: null } }, restSeconds: 180 };
const nombreDe = (p) => p.exerciseVersionId;

test('ED-13 · sobre ejercicios vacíos, un clic: la habitual llena las series', () => {
  const vacios = [{ exerciseVersionId: 'Sentadilla', sets: [{ repetitions: null }], intensity: null }];
  const a = A.alcanceDeLaHabitual(vacios, [0], habitual, nombreDe, 'Piernas A');
  assert.equal(a.soloLlenaLoVacio, true);
  assert.equal(a.nuevas.get(0).sets.length, 3);
  assert.equal(a.nuevas.get(0).intensity.criterion, 'RIR');
});

test('ED-13 (DJ-8) · si pisa algo, la vista previa lo dice; las cargas se conservan y «Deshacer» devuelve lo de antes', () => {
  const conCargas = [{ exerciseVersionId: 'Press', sets: [{ repetitions: { min: 6, max: 8 } }, { repetitions: { min: 6, max: 8 } }], intensity: null, suggestedLoad: { value: 80, unit: 'kg' } }];
  const antes = structuredClone(conCargas);
  const a = A.alcanceDeLaHabitual(conCargas, [0], habitual, nombreDe, 'Torso A');
  assert.equal(a.soloLlenaLoVacio, false);
  assert.deepEqual(a.nuevas.get(0).suggestedLoad, { value: 80, unit: 'kg' });
  assert.equal(a.filas[0].cambio.carga.revisar, 'escrita para 6-8: revisala');
  assert.match(a.resumen, /pasa de 2 a 3 series/);
  assert.deepEqual(a.antes.get(0), antes[0]);
  assert.deepEqual(conCargas, antes);
});

test('DJ-7 · el reparto habitual se lee y se guarda en gramos por día, sin porcentajes', () => {
  const fuente = readFileSync(new URL('../src/app/pro/advisees/nutrition/repartos-habituales.tsx', import.meta.url), 'utf8');
  assert.match(fuente, /unit: 'g\/day' as const/);
  assert.doesNotMatch(fuente, /%/);
});

test('ED-11 · las plantillas son una pestaña de la galería de estructura: se leen al abrirla, y reemplazar descarta antes de crear', () => {
  const galeria = readFileSync(new URL('../src/app/pro/advisees/galeria-de-presets.tsx', import.meta.url), 'utf8');
  const editor = readFileSync(new URL('../src/app/pro/advisees/training/editor.tsx', import.meta.url), 'utf8');
  const plan = readFileSync(new URL('../src/app/pro/advisees/training/plan.tsx', import.meta.url), 'utf8');
  // Solo en la galería de estructura, y la lista se pide al abrir la pestaña.
  assert.match(galeria, /\{tarea === 'estructura' && plantillas && paso === 'elegir' \? \(/);
  assert.match(galeria, /if \(abierto && pestana === 'plantillas'\) void leerPlantillas\(\);/);
  // Nada viene elegido al cambiar de pestaña (TEST-EDP-014).
  assert.match(galeria, /setPestana\(p\);\n\s*setElegido\(null\);/);
  // El editor descarta con la versión que muestra y solo si se hizo le pide al plan el borrador nuevo desde la plantilla.
  const reemplazar = editor.slice(editor.indexOf('async function reemplazarConPlantilla'), editor.indexOf("if (error === 'no-disponible')"));
  assert.ok(reemplazar.indexOf('descartarBorradorDePlanDeEntrenamiento') < reemplazar.indexOf('onReemplazarConPlantilla(templateVersionId)'));
  assert.match(reemplazar, /if \(queNoSeHizo\) return setFalloAlReemplazar\(queNoSeHizo\);/);
  // El plan lo crea con API-TRN-07 desde la plantilla: la API anota de cuál salió (`templateOrigin`).
  assert.match(plan, /onReemplazarConPlantilla=\{\(id\) => \{\n\s*setFalloDesdePlantilla\(null\);\n\s*setDesdePlantilla\(true\);\n\s*void aplicar\(id, true\);/);
  assert.match(plan, /fromTemplateVersionId: templateVersionId/);
});

test('EDT-54 (revisión del 13/11) · sin objetivo vigente no se descarta nada, y si el nuevo no nace se desmonta el editor del descartado', () => {
  const galeria = readFileSync(new URL('../src/app/pro/advisees/galeria-de-presets.tsx', import.meta.url), 'utf8');
  const editor = readFileSync(new URL('../src/app/pro/advisees/training/editor.tsx', import.meta.url), 'utf8');
  const plan = readFileSync(new URL('../src/app/pro/advisees/training/plan.tsx', import.meta.url), 'utf8');
  // El editor no descarta si el nuevo no puede nacer: el motivo va antes del descarte.
  const reemplazar = editor.slice(editor.indexOf('async function reemplazarConPlantilla'), editor.indexOf("if (error === 'no-disponible')"));
  assert.ok(reemplazar.indexOf('if (plantillasNoSePueden) return setFalloAlReemplazar(plantillasNoSePueden);') > -1);
  assert.ok(reemplazar.indexOf('plantillasNoSePueden') < reemplazar.indexOf('descartarBorradorDePlanDeEntrenamiento'));
  // La galería apaga el principal con el motivo y lo dice en la vista previa.
  assert.match(galeria, /apagado: plantillas\?\.noSePuede \?\? null/);
  assert.match(galeria, /if \(!plantillas \|\| plantillas\.noSePuede\) return;/);
  assert.match(galeria, /data-no-se-puede-reemplazar/);
  // El plan pasa el motivo: falta leer el objetivo, o no hay uno vigente.
  assert.match(plan, /plantillasNoSePueden=\{motivoSinObjetivo\}/);
  assert.match(plan, /r\.datos\.faltan\.objetivo \? COPY_PLANTILLAS_EN_LA_GALERIA\.sinObjetivoLeido : COPY_PLANTILLAS_EN_LA_GALERIA\.sinObjetivo/);
  // `aplicar`: sin objetivo, el motivo (nunca un return mudo); con la creación fallida tras un descarte, se vuelve a leer el plan.
  const aplicar = plan.slice(plan.indexOf('async function aplicar('), plan.indexOf('const leerPlantillas'));
  assert.match(aplicar, /if \(!objetivo\) \{\n\s*setFalloDesdePlantilla\(motivoSinObjetivo\);\n\s*if \(trasDescartar\) void cargar\(false\);\n\s*return;/);
  assert.match(aplicar, /if \(!res\.ok\) \{\n\s*setFalloDesdePlantilla\([^\n]+\);\n\s*if \(trasDescartar\) void cargar\(false\);\n\s*return;/);
  assert.doesNotMatch(aplicar, /if \(!objetivo\) return;/);
});

test('ED-13 (revisión del 13/11) · usar un reparto que pisa lo escrito lo dice y ofrece «Deshacer»', async () => {
  const R = await import('../src/app/pro/advisees/nutrition/reparto-que-se-pisa.ts');
  const nuevos = { proteina: '150', carbohidratos: '250', grasas: '70' };
  assert.equal(R.loQueSePisa({ proteina: '160', carbohidratos: '280', grasas: '75' }, nuevos), 'P 160 · C 280 · G 75');
  assert.equal(R.loQueSePisa({ proteina: '160', carbohidratos: '', grasas: '' }, nuevos), 'P 160 · C — · G —');
  // Vacío o igual: no hay nada que deshacer.
  assert.equal(R.loQueSePisa({ proteina: '', carbohidratos: ' ', grasas: '' }, nuevos), null);
  assert.equal(R.loQueSePisa({ ...nuevos }, nuevos), null);
  const fuente = readFileSync(new URL('../src/app/pro/advisees/nutrition/repartos-habituales.tsx', import.meta.url), 'utf8');
  assert.match(fuente, /onUsar\(\{ \.\.\.pisado\.antes \}\);/);
  assert.match(fuente, /pisado && sigueEscrito \?/);
});
