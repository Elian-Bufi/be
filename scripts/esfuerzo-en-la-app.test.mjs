/**
 * DL-192 en la APK (DL-194, APK 0.32; docs/paquetes/WP-RPE-Y-MAXIMO-ESTIMADO.md §7), sin teléfono: el esfuerzo de cada
 * serie en la notación del plan, con los módulos puros de producción.
 *  1. La notación (`esfuerzo-en-la-app.ts`): la de API-TRN-09 y API-SER-02; sin el campo, RIR.
 *  2. Lo que se elige en RPE es una de las opciones del dominio (`OPCIONES_DE_RPE`) y se lee como el RIR que se manda; en
 *     RIR, el número de siempre. Lo guardado no cambia solo por leerse en RPE (un RIR de 5 no pasa a ser el 4 de «6 o
 *     menos»).
 *  3. La sesión (`series-de-la-sesion.ts`): lo planificado en gris y en la banda, la casilla (`serieAlTildar`) con su
 *     `fieldOrigins.rir`, y lo que vuelve al destildar. Cada serie se valida con el esquema del contrato.
 *  4. «Ya la hice» (`registro-rapido.ts`), la corrección (`correccion-de-la-sesion.ts`) y «La vez pasada», en RPE.
 *  5. Lo que solo se ve en el código: la capacidad declarada, la notación leída de API-SER-02 y API-TRN-09, y las opciones.
 * Uso: node --test scripts/esfuerzo-en-la-app.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { register } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Los módulos de la APK se importan entre sí sin extensión, como los resuelve Metro: Node necesita que se la agreguen.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const e = await import('../apps/mobile/src/esfuerzo-en-la-app.ts');
const s = await import('../apps/mobile/src/series-de-la-sesion.ts');
const rr = await import('../apps/mobile/src/registro-rapido.ts');
const c = await import('../apps/mobile/src/correccion-de-la-sesion.ts');
const vez = await import('../apps/mobile/src/la-vez-pasada-en-la-sesion.ts');
const fuente = (ruta) => readFileSync(resolve(RAIZ, ruta), 'utf8');

const objetivo = (rir, extra = {}) => ({ repetitions: { value: 8 }, rir, suggestedLoad: { value: 60, unit: 'kg' }, restSeconds: 120, ...extra });

// ─── 1. La notación ────────────────────────────────────────────────────────────────────────────

test('1 · la notación es la de la lectura: solo «RPE» es RPE; sin el campo (un plan de antes, una API sin DL-192), RIR', () => {
  assert.equal(e.notacionDeLaLectura({ effortNotation: 'RPE' }), 'RPE');
  for (const x of [{ effortNotation: 'RIR' }, {}, null, undefined, { effortNotation: 'rpe' }, { effortNotation: null }]) assert.equal(e.notacionDeLaLectura(x), 'RIR', JSON.stringify(x));
  // Los esquemas del contrato la traen: API-SER-02 (la sesión) y API-TRN-09 (la versión del plan).
  assert.ok(d.SesionParaRegistrarSchema.shape.effortNotation, 'API-SER-02 trae effortNotation');
  assert.ok(d.VersionDePlanDeEntrenamientoSchema.shape.effortNotation, 'API-TRN-09 trae effortNotation');
  assert.equal(d.CAPACIDAD_NOTACION_DEL_ESFUERZO, 'training-effort-notation-1');
});

test('1 · los textos que cambian con la notación: la columna, el título, la ayuda y su ejemplo', () => {
  const rir = e.textosDelEsfuerzo('RIR');
  assert.equal(rir.columna, d.COPY_ENTRENAMIENTO_POR_SERIE.columnaRir, 'en RIR, los del dominio, como siempre');
  assert.equal(rir.ayuda, d.COPY_ENTRENAMIENTO_POR_SERIE.rirAyuda);
  const rpe = e.textosDelEsfuerzo('RPE');
  assert.equal(rpe.columna, 'RPE');
  assert.equal(rpe.titulo, 'RPE (opcional)');
  assert.match(rpe.ejemplo, /^RPE 8: creés que te quedaban 2 repeticiones$/, 'el mismo ejemplo del RIR 2, en RPE');
  for (const t of [...Object.values(rpe), e.ERROR_DEL_RPE]) {
    assert.deepEqual(d.terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.doesNotMatch(t, /RPE prescripto|cumplimiento|adherencia|racha|puntaje|asesorado|volumen/i, t);
  }
});

// ─── 2. Elegir en RPE y leer el RIR ─────────────────────────────────────────────────────────────

test('2 · en RPE se elige una opción del dominio, y cada una se lee como su RIR: ida y vuelta sin perder nada', () => {
  assert.deepEqual(
    e.OPCIONES_DEL_RPE.map((o) => o.texto),
    ['10', '9,5', '9', '8,5', '8', '7,5', '7', '6,5', '6 o menos'],
  );
  assert.equal(e.OPCIONES_DEL_RPE, d.OPCIONES_DE_RPE, 'las opciones son las del dominio, no una copia');
  for (const o of d.OPCIONES_DE_RPE) {
    assert.deepEqual(e.leerEsfuerzo(o.texto, 'RPE'), { rir: o.rir }, o.texto);
    assert.equal(e.esfuerzoParaEditar(o.rir, 'RPE'), o.texto, `el RIR ${o.rir} vuelve a la fila como «${o.texto}»`);
  }
  assert.deepEqual(e.leerEsfuerzo('8', 'RPE'), { rir: 2 }, 'RPE 8 es RIR 2');
  assert.deepEqual(e.leerEsfuerzo('6', 'RPE'), { rir: 4 }, '6 es «6 o menos»: RIR 4');
  assert.deepEqual(e.leerEsfuerzo('  ', 'RPE'), { rir: null }, 'vacío es no informado');
  for (const malo of ['8,3', '11', 'ocho', '-1']) assert.equal(e.leerEsfuerzo(malo, 'RPE').error, e.ERROR_DEL_RPE, malo);
});

test('2 · en RIR, el número de siempre: de 0 a 20, con coma o punto; el cero es un valor', () => {
  assert.deepEqual(e.leerEsfuerzo('2', 'RIR'), { rir: 2 });
  assert.deepEqual(e.leerEsfuerzo('2,5', 'RIR'), { rir: 2.5 });
  assert.deepEqual(e.leerEsfuerzo('0', 'RIR'), { rir: 0 });
  assert.equal(e.leerEsfuerzo('21', 'RIR').error, 'El RIR va de 0 a 20.');
  assert.ok(e.leerEsfuerzo('dos', 'RIR').error);
  assert.equal(e.esfuerzoParaMostrar(0, 'RIR'), '0');
  assert.equal(e.esfuerzoParaMostrar(null, 'RPE'), null);
});

test('2 · RPE-D03 · un RIR de 5 se lee «6 o menos» y, si nadie lo toca, vuelve a viajar como 5', () => {
  assert.equal(e.esfuerzoParaEditar(5, 'RPE'), '6 o menos');
  assert.deepEqual(e.leerEsfuerzo('6 o menos', 'RPE', 5), { rir: 5 }, 'el mismo texto: el RIR de antes');
  assert.deepEqual(e.leerEsfuerzo('6 o menos', 'RPE'), { rir: 4 }, 'elegido de nuevo, sin lo de antes: RIR 4');
  assert.deepEqual(e.leerEsfuerzo('8', 'RPE', 5), { rir: 2 }, 'otra opción: la nueva');
  assert.equal(e.esfuerzoEnLaFrase(5, 'RPE'), 'RPE 6 o menos');
  assert.equal(e.esfuerzoEnLaFrase(null, 'RPE'), 'RPE no informado');
  assert.equal(e.esfuerzoEnLaFrase(2, 'RIR'), 'RIR 2');
});

// ─── 3. La sesión ───────────────────────────────────────────────────────────────────────────────

test('3 · lo planificado en gris y en la banda, en RPE; en RIR, igual que antes', () => {
  assert.equal(s.placeholdersDeLaSerie(objetivo(2), 'kg', 'RPE').rir, '8');
  assert.equal(s.placeholdersDeLaSerie(objetivo(0), 'kg', 'RPE').rir, '10', 'RIR 0 es RPE 10, no «Sin indicar»');
  assert.equal(s.placeholdersDeLaSerie(objetivo(null), 'kg', 'RPE').rir, d.COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo);
  assert.equal(s.placeholdersDeLaSerie(objetivo(2), 'kg').rir, '2', 'sin notación, RIR');
  const banda = s.bandaDeLaSerie(1, objetivo(2), 1, 'RPE');
  assert.match(banda.plan, /RPE 8/);
  assert.doesNotMatch(banda.plan, /RIR/);
  assert.equal(banda.plan, d.textoDelPlanDeLaSerie(objetivo(2), 'RPE'), 'con el texto del dominio');
  assert.match(s.bandaDeLaSerie(1, objetivo(2), 1).plan, /RIR 2/);
});

test('3 · la casilla en RPE manda el RIR con su procedencia: lo elegido es PERSON y lo vacío, el RIR del plan (PLAN)', () => {
  const elegida = s.serieAlTildar({ carga: '60', repeticiones: '8', rir: '8,5' }, objetivo(2), 1, 'kg', 'WORKING', 'RPE');
  assert.ok(elegida.ok);
  assert.equal(elegida.serie.rir, 1.5, 'RPE 8,5 es RIR 1,5');
  assert.equal(elegida.serie.fieldOrigins.rir, 'PERSON');
  d.SerieEjecutadaSchema.parse(elegida.serie);

  const vacia = s.serieAlTildar({ carga: '', repeticiones: '10', rir: '' }, objetivo(2), 1, 'kg', 'WORKING', 'RPE');
  assert.ok(vacia.ok);
  assert.equal(vacia.serie.rir, 2, 'lo que se veía en gris (RPE 8) viaja como su RIR');
  assert.equal(vacia.serie.fieldOrigins.rir, 'PLAN');
  d.SerieEjecutadaSchema.parse(vacia.serie);

  const comoElPlan = s.serieAlTildar({ carga: '', repeticiones: '', rir: '' }, objetivo(2), 1, 'kg', 'WORKING', 'RPE');
  assert.ok(comoElPlan.ok);
  assert.equal(comoElPlan.serie.recordedAs, 'AS_PLANNED');
  assert.equal(comoElPlan.serie.rir, 2);

  const mala = s.serieAlTildar({ carga: '60', repeticiones: '8', rir: '8,3' }, objetivo(2), 1, 'kg', 'WORKING', 'RPE');
  assert.equal(mala.ok, false);
  assert.equal(mala.errores.rir, e.ERROR_DEL_RPE);

  // En RIR, lo de siempre: «2» es RIR 2.
  const enRir = s.serieAlTildar({ carga: '60', repeticiones: '8', rir: '2' }, objetivo(3), 1, 'kg');
  assert.ok(enRir.ok);
  assert.equal(enRir.serie.rir, 2);
  // Y «Terminar serie» decide lo mismo que la casilla.
  assert.equal(s.alTerminarLaSerie({ carga: '60', repeticiones: '8', rir: '8,3' }, objetivo(2), 1, 'kg', null, 1, 'RPE').tipo, 'falta-un-dato');
  assert.equal(s.alTerminarLaSerie({ carga: '60', repeticiones: '8', rir: '9' }, objetivo(2), 1, 'kg', null, 1, 'RPE').tipo, 'registrar');
});

test('3 · al destildar en RPE, lo escrito vuelve como su opción y, sin tocarlo, se vuelve a registrar con el mismo RIR', () => {
  const serie = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 5, perceivedExertion: null, recordedAs: 'TYPED', fieldOrigins: { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' } };
  const vuelta = s.escritaDeLaSerie(serie, 'kg', 'RPE');
  assert.equal(vuelta.rir, '6 o menos');
  assert.equal(vuelta.rirAnterior, 5);
  const otraVez = s.serieAlTildar(vuelta, objetivo(2), 1, 'kg', 'WORKING', 'RPE');
  assert.ok(otraVez.ok);
  assert.equal(otraVez.serie.rir, 5, 'el RIR guardado no cambia solo por verse en RPE');
  // En RIR, la forma de siempre, sin campos de más.
  assert.equal(Object.hasOwn(s.escritaDeLaSerie(serie, 'kg'), 'rirAnterior'), false);
  assert.equal(s.escritaDeLaSerie(serie, 'kg').rir, '5');
});

test('3 · lo escrito sin registrar se lee igual al finalizar («Antes de finalizar»), en la notación de la sesión', () => {
  const sesion = { prescriptions: [{ prescriptionId: 'p1', exerciseName: 'Sentadilla', sets: [{ setIndex: 1, target: objetivo(2), targetOrigin: { rir: 'SET', suggestedLoad: 'SET', restSeconds: 'SET' } }] }] };
  const escritas = { 'p1:1': { carga: '60', repeticiones: '8', rir: '9', unidad: 'kg' } };
  const pendientes = s.pendientesDeRegistrar(sesion, null, [], [], escritas, 'RPE');
  assert.equal(pendientes.length, 1);
  assert.ok(pendientes[0].lectura.ok);
  assert.equal(pendientes[0].lectura.serie.rir, 1, 'RPE 9 es RIR 1');
});

// ─── 4. «Ya la hice», la corrección y «La vez pasada» ──────────────────────────────────────────

test('4 · «Ya la hice»: lo planificado de cada serie y del ejercicio, en RPE', () => {
  const sets = [1, 2, 3].map((i) => ({ setIndex: i, target: objetivo(i === 3 ? 1 : 2), targetOrigin: { rir: 'SET', suggestedLoad: 'SET', restSeconds: 'SET' } }));
  assert.match(rr.lineaDeLaSerie(sets[0], 'RPE'), /RPE 8/);
  assert.match(rr.lineaDeLaSerie(sets[0]), /RIR 2/, 'sin notación, RIR');
  const linea = rr.lineaDelPlan({ sets }, 'RPE');
  assert.match(linea, /RPE 8\/8\/9/, linea);
  assert.doesNotMatch(linea, /RIR/);
  assert.match(rr.lineaDelPlan({ sets }), /RIR 2\/2\/1/);
});

test('4 · la corrección: la fila vuelve en RPE con el RIR guardado; sin tocarla sigue igual, y los cambios se dicen en RPE', () => {
  const serie = { setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir: 5, perceivedExertion: null };
  const fila = c.filaDeLaSerie(serie, 'RPE');
  assert.equal(fila.rir, '6 o menos');
  assert.equal(fila.rirAnterior, 5);
  const enCorreccion = { setIndex: 1, origen: 'registrada', escrita: fila, unidad: 'kg', quitada: false, tildada: false, antes: serie, objetivo: objetivo(2), notacion: 'RPE' };
  assert.equal(c.estadoDeLaFila(enCorreccion), 'igual', 'leerla en RPE no la cambia');
  assert.equal(c.estadoDeLaFila({ ...enCorreccion, escrita: { ...fila, rir: '8' } }), 'cambiada');
  assert.equal(c.textoCortoDeSerie(serie, 'RPE'), '60 kg · 8 reps · RPE 6 o menos');
  assert.equal(c.textoCortoDeSerie({ ...serie, rir: 2 }), '60 kg · 8 reps · RIR 2', 'sin notación, como siempre');
  assert.match(c.textoDeLosErrores({ rir: e.ERROR_DEL_RPE }, 'RPE'), /^RPE: /);
  // En RIR, la fila de siempre.
  assert.deepEqual(c.filaDeLaSerie({ ...serie, rir: 2.5 }), { carga: '60', repeticiones: '8', rir: '2,5' });
});

test('4 · «La vez pasada» en RPE: la misma frase del dominio, con cada serie en RPE', () => {
  const v = {
    fecha: '2026-11-17',
    como: {
      tipo: 'series',
      series: [
        { numero: 1, carga: { value: 20, unit: 'kg' }, repeticiones: 8, rir: 2, duracion: null, cargaRapida: false, delPlan: [] },
        { numero: 2, carga: { value: 22, unit: 'kg' }, repeticiones: 6, rir: 1, duracion: null, cargaRapida: true, delPlan: [] },
      ],
      enLugarDe: null,
    },
    comparable: true,
  };
  const enRir = vez.lineaEnLaNotacion(v, '2026-11-22', false, 'RIR');
  assert.equal(enRir, d.lineaDeLaVezPasada(v, '2026-11-22', 'persona'), 'en RIR, la del dominio tal cual');
  const enRpe = vez.lineaEnLaNotacion(v, '2026-11-22', false, 'RPE');
  assert.equal(enRpe, enRir.replace('RIR 2', 'RPE 8').replace('RIR 1', 'RPE 9'), 'solo cambia cómo se escribe el esfuerzo');
  assert.match(enRpe, /22 kg × 6 · RPE 9 \(como el plan\)/);
  assert.equal(vez.lineaEnLaNotacion({ ...v, como: { tipo: 'resumida' } }, '2026-11-22', false, 'RPE'), d.lineaDeLaVezPasada({ ...v, como: { tipo: 'resumida' } }, '2026-11-22', 'persona'));
});

// ─── 5. Lo que solo se ve en el código ──────────────────────────────────────────────────────────

test('5 · la APK declara training-effort-notation-1 y lee la notación de API-SER-02 y de API-TRN-09', () => {
  const api = fuente('apps/mobile/src/api.ts');
  assert.match(api, /const CAPACIDADES = \[[^\]]*CAPACIDAD_NOTACION_DEL_ESFUERZO[^\]]*\] as const;/);
  const entrenamiento = fuente('apps/mobile/src/pantallas/entrenamiento.tsx');
  assert.match(entrenamiento, /entrenamientoLocal\.fijarSesionDelPlan\(draftId, s\.datos\.data\.session, false, notacionDeLaLectura\(s\.datos\.data\)\)/);
  assert.match(entrenamiento, /const notacion = local\?\.notacion \?\? 'RIR';/);
  for (const llamada of [/serieAlTildar\(escrita, f\.objetivo, f\.setIndex, unidadDeLaFila, f\.tipo, notacion\)/, /alTerminarLaSerie\([^)]*f\.numero, notacion\)/, /<TablaDeSeries\s+notacion=\{notacion\}/, /<AyudaDeLaTabla notacion=\{notacion\} \/>/]) assert.match(entrenamiento, llamada);
  assert.match(entrenamiento, /lineasDePrescripcion\(p, \{ notacion \}\)/, 'lo planificado, con el texto del dominio en la notación');
  assert.match(fuente('apps/mobile/src/pantallas/historial.tsx'), /const notacion = notacionDeLaLectura\(plan\);/, 'API-TRN-09');
  assert.match(fuente('apps/mobile/src/pantallas/plan-por-serie.tsx'), /notacionDeLaLectura\(r\.ok \? r\.datos\.data : null\)/, 'API-SER-02');
  assert.match(fuente('apps/mobile/src/pantallas/registro-rapido.tsx'), /notacion: notacionDeLaLectura\(lectura\.datos\.data\)/, 'API-SER-02');
  assert.match(fuente('apps/mobile/src/pantallas/correccion-de-entrenamiento.tsx'), /notacion: notacionDeLaLectura\(s\.ok \? s\.datos\.data : null\)/, 'API-SER-02');
  // La sesión guardada en el teléfono recuerda la notación y la lee tolerante: lo que falta es RIR.
  assert.match(fuente('apps/mobile/src/almacen-de-entrenamiento.ts'), /notacion: notacionDe\(x\.notacion\),/);
});

test('5 · en RPE el esfuerzo se elige con las opciones del dominio en la sesión, en «Ya la hice» y en la corrección', () => {
  const selector = fuente('apps/mobile/src/selector-de-rpe.tsx');
  assert.match(selector, /OPCIONES_DEL_RPE\.map\(/);
  assert.match(selector, /accessibilityRole="radiogroup"/);
  assert.match(selector, /accessibilityRole="radio"/);
  assert.match(selector, /onRequestClose=\{\(\) => setAbierto\(false\)\}/, 'el «atrás» de Android cierra sin cambiar nada');
  assert.doesNotMatch(selector, /\d+%/, 'sin porcentajes en los estilos');
  for (const pantalla of ['sesion-enfocada.tsx', 'registro-rapido.tsx', 'correccion-de-entrenamiento.tsx']) {
    const f = fuente(`apps/mobile/src/pantallas/${pantalla}`);
    assert.match(f, /notacion === 'RPE' \? \([\s\S]{0,80}<SelectorDeRpe/, pantalla);
  }
});
