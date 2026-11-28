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

// ─── Parte 3 · los presets en todos los niveles (DL-203) ─────────────────────────────────────────────────────────

const GUARDAR = leer('app/pro/advisees/training/guardar-como-preset.tsx');
const HABITUAL = leer('app/pro/advisees/training/prescripcion-habitual.tsx');
const G = await import('../src/app/pro/advisees/galeria-de-presets.tsx').catch(() => null);

test('PN-3 · una sola galería con una pestaña por nivel, que se abre en la del lugar desde donde se pide', () => {
  assert.match(GALERIA, /export const PESTANAS_DE_LA_GALERIA: readonly PestanaDeLaGaleria\[\] = \['plan', 'fase', 'sesion', 'series'\];/);
  assert.match(GALERIA, /pestana: \{ plan: 'Plan', fase: 'Fase', sesion: 'Sesión', series: 'Series' \}/);
  // Cada pestaña con «De BE» y «Tuyos».
  for (const p of ['plan', 'fase', 'sesion']) assert.match(GALERIA, new RegExp(`aria-labelledby="galeria-${p}-de-be"`), p);
  assert.match(GALERIA, /aria-labelledby="galeria-de-be"/);
  // BE no tiene presets de sesión: no elige ejercicios (ED-D2). Las estructuras de BE van en «Fase».
  assert.match(GALERIA, /sesionesDeBe: 'BE no arma sesiones: no elige ejercicios\. Las tuyas, sí\.'/);
  assert.match(GALERIA, /PRESETS_DE_ESTRUCTURA\.map/);
  assert.equal(d.PRESETS_DE_BE.filter((p) => p.tipo !== 'ESTRUCTURA' && p.tipo !== 'PRESCRIPCION').length, 0, 'ni de fase ni de sesión');
  // Se abre en la pestaña de cada lugar.
  assert.match(EDITOR, /\{ clave: 'usar-preset', texto: COPY_PRESETS_EN_EL_EDITOR\.usarPresetDeSesion, alElegir: \(\) => setGaleria\(\{ pestana: 'sesion', ejercicio: null \}\) \}/);
  assert.match(EDITOR, /\{ clave: 'desde-preset', texto: COPY_PRESETS_EN_EL_EDITOR\.agregarFaseDesdePreset, alElegir: \(\) => setGaleria\(\{ pestana: 'fase', ejercicio: null \}\) \}/);
  assert.match(EDITOR, /data-galeria-de-prescripcion onClick=\{\(\) => setGaleria\(\{ pestana: 'series', ejercicio: null \}\)\}/);
  assert.match(EDITOR, /\{ clave: 'estructura', texto: CE\.galeriaDeEstructura, alElegir: \(\) => setGaleria\(\{ pestana: 'plan', ejercicio: null \}\) \}/);
  assert.doesNotMatch(EDITOR, /tarea: '(prescripcion|estructura)'/, 'mutación: vuelve la galería por tarea');
  // Al cambiar de pestaña, nada queda elegido.
  assert.match(GALERIA, /const elegirPestana = \(p: PestanaDeLaGaleria\) => \{\n\s*setPestana\(p\);\n\s*setElegido\(null\);/);
  if (G) for (const t of [...Object.values(G.COPY_GALERIA_POR_NIVEL.pestana), G.COPY_GALERIA_POR_NIVEL.sesionesDeBe, G.COPY_GALERIA_POR_NIVEL.faseNueva('Base'), G.COPY_GALERIA_POR_NIVEL.sinCargas]) {
    assert.deepEqual(d.terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|puntaje|volumen/i, t);
  }
});

test('PN-3 · «Guardar como preset» en el «⋯» de la fase y de la sesión, con lo que no se guarda dicho antes', () => {
  assert.match(EDITOR, /setGuardarComoPreset\(\{ tipo: 'FASE', de: nombreDelBloque\(bloque, i\), armado: presetDeEstaFase \}\)/);
  assert.match(EDITOR, /setGuardarComoPreset\(\{ tipo: 'SESION', de: nombreDeLaSesion\(sesion, k\), armado: presetDeSesionDe\(sesion, plan\) \}\)/);
  assert.match(EDITOR, /const presetDeEstaFase = bloque \? presetDeFaseDe\(bloque, plan, agendaVisible\) : null;/);
  // Una fase con microciclos no se guarda: no se crean microciclos nuevos.
  assert.match(EDITOR, /'noSePuede' in presetDeEstaFase \? presetDeEstaFase\.noSePuede/);
  // El cuadro dice qué no viaja y qué textos viajan, para revisar que no nombren a la persona (como API-HAB-07).
  assert.match(GUARDAR, /data-no-se-guarda/);
  assert.match(GUARDAR, /data-se-guardan-escritos/);
  assert.match(GUARDAR, /revisá que no nombren a la persona/);
  assert.match(GUARDAR, /kind: 'SESION', session: que\.armado\.contenido/);
  assert.match(GUARDAR, /kind: 'FASE', phase: que\.armado\.contenido/);
  // El nombre es único entre los tres niveles: uno de otro nivel no se reemplaza.
  assert.match(GUARDAR, /confirmarDeshabilitado=\{nombre\.trim\(\)\.length === 0 \|\| !!deOtroNivel\}/);
  // La lista trae los tres niveles: las series siguen siendo `lista`.
  assert.match(HABITUAL, /const lista = useMemo\(\(\) => estado\.todos\.filter\(\(p\): p is PrescripcionHabitual => p\.kind === 'SERIES'\), \[estado\.todos\]\);/);
});

test('PN-3 · aplicar: la sesión en la vacía o como nueva, la fase como fase nueva; ids nuevos, un solo «Deshacer»', () => {
  // Un cambio grande con su texto: la estructura, la planificación y la agenda vuelven juntas con Ctrl+Z.
  assert.match(EDITOR, /\}, COPY_DESHACER\.aplicasteElPreset\(p\.name\)\);\n\s*\/\/ Lo que va en la planificación entra en el mismo cambio/);
  assert.match(EDITOR, /cambiar\(\(x\) => \(x\.splice\(n, 0, f\.bloque\), x\), COPY_DESHACER\.aplicasteElPreset\(p\.name\)\);/);
  // Los identificadores se remapean al aplicar.
  assert.match(EDITOR, /const a = sesionDelPreset\(p\.session, \(\) => crypto\.randomUUID\(\)\);/);
  assert.match(EDITOR, /const f = faseDelPreset\(p\.phase, p\.phase\.label, \(\) => crypto\.randomUUID\(\)\);/);
  // La sesión vacía conserva su identificador (sus días no se pierden).
  assert.match(EDITOR, /ss\[k\] = \{ \.\.\.a\.sesion, sessionId: ss\[k\]!\.sessionId \?\? a\.sesion\.sessionId \}/);
  // Las cargas del % RM salen del 1RM de quien lo recibe.
  assert.match(EDITOR, /calcularLasCargasDe\(a\.sesion\.prescriptions, versiones\);/);
  assert.match(EDITOR, /calcularLasCargasDe\(sesionesDeLaFase\(f\.bloque\)\.flatMap\(\(s\) => s\.prescriptions\), versiones\);/);
  // Si pisa el nombre o las indicaciones de la sesión vacía, primero «antes → después».
  assert.match(GALERIA, /if \(paso === 'elegir' && pisaLaSesion\.length > 0\) return setPaso\('alcance'\);/);
  // Los topes del contrato.
  assert.match(EDITOR, /noSePuedeAgregarFase=\{bloques\.length >= TOPES_DE_ENTRENAMIENTO\.bloques \?/);
  assert.match(EDITOR, /sesiones\.length >= topeDeSesiones \? COPY_PRESETS_EN_EL_EDITOR\.topeDeSesiones\(topeDeSesiones\)/);
  assert.equal(leer('app/pro/advisees/training/deshacer-del-editor.ts').includes("aplicasteElPreset: (nombre: string) => `Aplicaste el preset «${nombre}».`"), true);
});
