/**
 * WP-EDITOR-ENTRENAMIENTO-TANDA-2 (DL-198) · sin React: lo que el website hace con el 1RM de referencia, la vista de la
 * persona, el esfuerzo de la sesión, las plantillas con su planificación, la clasificación de un propio y los desplegables
 * (TEST-ET2-10 a TEST-ET2-18). Las cuentas viven en el dominio y tienen sus pruebas allá
 * (`packages/domain/src/editor-de-entrenamiento-tanda-2.test.ts`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const UNO_RM = leer('app/pro/advisees/training/uno-rm-del-ejercicio.tsx');
const VISTA = leer('app/pro/advisees/training/vista-de-la-persona.tsx');
const GRAFICO = leer('app/pro/advisees/training/grafico-de-la-carga-de-la-sesion.tsx');
const EJECUCIONES = leer('app/pro/advisees/training/ejecuciones.tsx');
const CUADROS = leer('app/pro/advisees/training/cuadros-del-plan.tsx');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const EJERCICIO = leer('app/pro/advisees/training/ejercicio-del-editor.tsx');
const PLANTILLAS = leer('app/pro/advisees/training/plantillas.tsx');
const CLASIFICACION = leer('app/pro/exercises/clasificacion-del-propio.tsx');
const MIS_EJERCICIOS = leer('app/pro/exercises/mis-ejercicios.tsx');
const CSS = leer('app/globals.css');

test('TEST-ET2-10 · el 1RM en el ejercicio: solo en % RM, con persona y ejercicio del catálogo, y con su origen a la vista', () => {
  assert.match(EJERCICIO, /criterioEfectivo === 'PERCENT_RM' && asesoradoId !== null && exerciseId !== null \? \(\n\s*<UnoRMDelEjercicio /);
  assert.match(UNO_RM, /origenDelUnoRM\(vigente\.origen, vigente\.fecha, vigente\.banda\)/);
  assert.match(UNO_RM, /baseDelPorcentaje\(pct, vigente\.valor, carga\)/);
  // Nada cambia solo: las cargas se ponen o se recalculan con un clic.
  assert.match(UNO_RM, /onClick=\{\(\) => onCambiar\(conLasCargasDelUnoRM\(p, carga, vigente\)\)\} data-poner-las-cargas/);
  assert.match(UNO_RM, /COPY_UNO_RM\.otraUnidad/);
  // RP-19: el renglón de la base y el de la cuenta están siempre.
  assert.match(UNO_RM, /<p className="nota uno-rm-del-ejercicio__base" role="status" data-base-del-porcentaje>/);
  assert.match(UNO_RM, /<p className="cuadro-del-uno-rm__cuenta" role="status" data-cuenta-del-uno-rm>/);
});

test('TEST-ET2-11 · el cuadro del 1RM: tres orígenes como control segmentado con el teclado, la cuenta en vivo y el registro elegido por la API', () => {
  assert.match(UNO_RM, /const ORIGENES: readonly Origen\[\] = \['CALIBRATION', 'RECORD', 'DECLARED'\];/);
  assert.match(UNO_RM, /role="radiogroup" aria-label=\{T\.queOrigen\}/);
  assert.match(UNO_RM, /e\.key === 'ArrowRight' \|\| e\.key === 'ArrowDown'/);
  assert.match(UNO_RM, /cuentaDelUnoRM\(serie\)/);
  // El registro se elige por cuál es: la API lo vuelve a leer y a calcular.
  assert.match(UNO_RM, /origin: 'RECORD', exerciseId, executionId: registro\.executionId, prescriptionId: registro\.prescriptionId, setIndex: registro\.setIndex/);
  assert.match(UNO_RM, /data-ejemplo-resuelto>\{COPY_UNO_RM\.calibracionEjemplo\}/);
  // Las cargas desde el 1RM: la común, sin cargas propias en las efectivas; las aproximaciones quedan.
  const p = { prescriptionId: 'p', exerciseVersionId: 'v', suggestedLoad: null, intensity: { criterion: 'PERCENT_RM', target: { value: 70, reference: null } }, sets: [{ setKind: 'WARM_UP', repetitions: { value: 8 }, suggestedLoad: { value: 10, unit: 'kg' } }, { repetitions: { value: 8 }, suggestedLoad: { value: 30, unit: 'kg' } }] };
  const carga = D.cargaDelPorcentajeDe(70, { value: 39, unit: 'kg' }, 'Sentadilla', null);
  assert.deepEqual(carga, { value: 27, unit: 'kg' });
});

test('TEST-ET2-12 · «Ver como la persona»: la misma cuenta que la API y los textos de la APK, solo lectura', () => {
  assert.match(VISTA, /sesionDeLaSemana\(elegida, laSemana, planificacion, nombreDe\)/);
  assert.match(VISTA, /objetivosEfectivos\(p\)/);
  assert.match(VISTA, /textoDelPlanDeLaSerie\(/);
  assert.match(VISTA, /COPY_ENTRENAMIENTO_POR_SERIE\.planDeLaSerie\(r\.numero\)/);
  assert.match(VISTA, /COPY_ESFUERZO_DE_LA_SESION\.pregunta/);
  assert.doesNotMatch(VISTA, /<input|onCambiar/);
  assert.match(EDITOR, /data-ver-como-la-persona/);
  assert.match(EDITOR, /<VistaDeLaPersona\n\s*abierto=\{vistaDeLaPersona\}/);
});

test('TEST-ET2-13 · el esfuerzo de la sesión: la opción del plan, lo registrado y el gráfico desde 0 con su «?» y su tabla', () => {
  assert.match(CUADROS, /data-pedir-el-esfuerzo/);
  assert.match(CUADROS, /COPY_ESFUERZO_DE_LA_SESION\.opcionDelPlan/);
  assert.match(EJECUCIONES, /api\.esfuerzosDeLaSesion\(token, asesoradoId, \{ periodStart: desde, periodEnd: hasta \}\)/);
  assert.match(EJECUCIONES, /<EsfuerzoDeLaSesionEnElDetalle esfuerzos=\{esfuerzos\} executionId=\{x\.executionId\} \/>/);
  assert.match(GRAFICO, /for \(let v = 0; v <= tope/);
  assert.match(GRAFICO, /T\.queEs/);
  assert.match(GRAFICO, /T\.ejemplo/);
  assert.match(GRAFICO, /'Ver la tabla'/);
  assert.match(GRAFICO, /aria-live="polite" data-lectura-carga-de-la-sesion/);
});

test('TEST-ET2-14 · las plantillas guardan y leen su planificación; «Configurar plan» en una plantilla, sin fechas ni anotaciones', () => {
  assert.match(EDITOR, /setPlanificacion\(planificacionDeLaPlantillaComoDelPlan\(p\.datos\.data\.planning \?\? null\)\);/);
  assert.match(EDITOR, /planning: planificacionParaLaPlantilla\(planificacionQueViaja\(planificacion, bloquesEnviados\)\),/);
  assert.match(EDITOR, /planificacion=\{planificacionParaLaPlantilla\(planificacionQueViaja\(planificacion, bloques\)\)\}/);
  assert.match(PLANTILLAS, /\.\.\.\(planificacion \? \{ planning: planificacion \} : \{\}\),/);
  assert.match(CUADROS, /\{enLaPlantilla \? null : \(\n\s*<div className="datos-del-plan__fecha" data-inicio-del-plan>/);
  assert.match(EDITOR, /aproximaciones=\{aproximacionesDe\(plan, p\.prescriptionId\)\}/);
});

test('TEST-ET2-15 · la clasificación de un propio: su cuadro, con la versión que se vio, y su renglón en la tarjeta', () => {
  assert.match(CLASIFICACION, /api\.cambiarClasificacionDeEjercicio\(token, ejercicio\.exerciseId, \{ expectedClassificationVersion: ejercicio\.classificationVersion \?\? 0, classification: c \}/);
  assert.match(CLASIFICACION, /r\.codigo === 'VERSION_CONFLICT' \? T\.cambio/);
  assert.match(MIS_EJERCICIOS, /data-cambiar-clasificacion/);
  assert.match(MIS_EJERCICIOS, /clasificacionEnUnRenglon\(e\.classification\) \?\? `Clasificación: \$\{COPY_CLASIFICACION_DEL_PROPIO\.sinIndicar\}`/);
});

test('TEST-ET2-16 · ET1-D20: `plan-y-fases.tsx` y `notacion-del-plan.tsx` se borraron; la letra de la sesión vive aparte', () => {
  assert.equal(existsSync(new URL('../src/app/pro/advisees/training/plan-y-fases.tsx', import.meta.url)), false);
  assert.equal(existsSync(new URL('../src/app/pro/advisees/training/notacion-del-plan.tsx', import.meta.url)), false);
  assert.match(EDITOR, /import \{ letraDeLaSesion \} from '\.\/letra-de-la-sesion';/);
  assert.doesNotMatch(CSS, /\.notacion-del-plan\b/);
});

test('TEST-ET2-17 · los desplegables del editor y sus cuadros: 44 px y la flecha con su lugar', () => {
  const bloque = CSS.slice(CSS.indexOf('/* ─── DL-198 · WP-EDITOR-ENTRENAMIENTO-TANDA-2'));
  assert.match(bloque, /select:not\(\[multiple\]\):not\(\[size\]\) \{\n\s*box-sizing: border-box;\n\s*min-height: 44px;\n\s*padding: 0\.45rem 2\.4rem 0\.45rem 0\.75rem;/);
  assert.match(bloque, /text-overflow: ellipsis;/);
  // Los colores, de los tokens.
  for (const linea of bloque.split('\n').filter((l) => /(color|background|fill|stroke):/.test(l))) assert.doesNotMatch(linea, /#[0-9a-f]{3,8}\b|rgb\(/i, linea);
});

test('TEST-ET2-18 · las palabras de BE en las pantallas nuevas: sin «volumen», «cumplimiento», «adherencia», «racha», «puntaje» ni «asesorado»', () => {
  for (const [nombre, fuente] of Object.entries({ UNO_RM, VISTA, GRAFICO, CLASIFICACION })) {
    const textos = [...fuente.matchAll(/'([^'\n]*)'|`([^`\n]*)`|>([^<>{}\n]+)</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '');
    for (const t of textos.filter((x) => !x.includes('/'))) assert.doesNotMatch(t, /\bvolumen\b|cumplimiento|adherencia|\bracha\b|puntaje|asesorad|estaci[oó]n\b/i, `${nombre}: ${t}`);
  }
  for (const t of Object.values(D.COPY_UNO_RM)) if (typeof t === 'string') assert.deepEqual(D.terminosProhibidosDeFuerzaEn(t), [], t);
});
