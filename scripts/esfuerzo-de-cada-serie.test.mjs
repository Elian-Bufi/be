/**
 * DL-202 en la APK (docs/paquetes/WP-ESFUERZO-POR-SERIE.md), sin teléfono: «Pedir el esfuerzo de cada serie», con los
 * módulos puros de producción, en sus dos estados.
 *  1. La sesión (`series-de-la-sesion.ts`): encendida, la casilla registra el esfuerzo como siempre; apagada, sin él (ni
 *     lo escrito ni el del plan). Las aproximaciones nunca lo llevan.
 *  2. «Ya la hice» (`registro-rapido.ts`): lo mismo, con «Hice todo lo planificado» y con cambios.
 *  3. La corrección (`correccion-de-la-sesion.ts`): apagada, un ejercicio sin esfuerzos registrados no tiene el campo; uno
 *     con alguno lo sigue mostrando, y no se pierde.
 *  4. Lo que solo se ve en el código: la capacidad declarada, el `askSetEffort` leído de API-SER-02 y la columna que no
 *     se dibuja apagada.
 * Uso: node --test scripts/esfuerzo-de-cada-serie.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire, register } from 'node:module';
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
const s = await import('../apps/mobile/src/series-de-la-sesion.ts');
const rr = await import('../apps/mobile/src/registro-rapido.ts');
const c = await import('../apps/mobile/src/correccion-de-la-sesion.ts');
const fuente = (ruta) => readFileSync(resolve(RAIZ, ruta), 'utf8');

const objetivo = (rir) => ({ repetitions: { value: 8 }, rir, suggestedLoad: { value: 60, unit: 'kg' }, restSeconds: 120 });
const VACIA = { carga: '', repeticiones: '', rir: '', tiempo: '' };

// ─── 1. La sesión ───────────────────────────────────────────────────────────────────────────────

test('1 · encendida: la casilla registra el esfuerzo escrito y, vacío, el del plan, como hasta ahora', () => {
  const escrita = s.serieAlTildar({ ...VACIA, rir: '1' }, objetivo(2), 1, 'kg', 'WORKING', 'RIR', true);
  assert.ok(escrita.ok);
  assert.deepEqual([escrita.serie.rir, escrita.serie.fieldOrigins?.rir], [1, 'PERSON']);
  const comoElPlan = s.serieAlTildar(VACIA, objetivo(2), 1, 'kg', 'WORKING', 'RIR', true);
  assert.ok(comoElPlan.ok);
  assert.equal(comoElPlan.serie.rir, 2);
  // Sin decirlo (los llamados de antes), igual que encendida.
  assert.equal(s.serieAlTildar(VACIA, objetivo(2), 1, 'kg').serie.rir, 2);
});

test('1 · apagada: la serie se registra sin esfuerzo, ni el escrito antes ni el del plan, y sin procedencia del RIR', () => {
  for (const fila of [VACIA, { ...VACIA, rir: '1' }, { ...VACIA, repeticiones: '10', rir: '3' }]) {
    const l = s.serieAlTildar(fila, objetivo(2), 1, 'kg', 'WORKING', 'RIR', false);
    assert.ok(l.ok, JSON.stringify(l));
    assert.equal(l.serie.rir, null, JSON.stringify(fila));
    assert.equal(l.serie.fieldOrigins?.rir, undefined);
    d.SerieEjecutadaSchema.parse(l.serie);
  }
  // Un esfuerzo ilegible que quedó escrito no impide registrar: el campo no está.
  assert.ok(s.serieAlTildar({ ...VACIA, rir: 'x' }, objetivo(2), 1, 'kg', 'WORKING', 'RIR', false).ok);
  assert.equal(s.serieAlTildar({ ...VACIA, rir: 'x' }, objetivo(2), 1, 'kg', 'WORKING', 'RIR', true).ok, false);
  // «Terminar serie» valida igual que la casilla.
  assert.equal(s.alTerminarLaSerie({ ...VACIA, rir: 'x' }, objetivo(2), 1, 'kg', null, 1, 'RIR', false).tipo, 'registrar');
});

test('1 · las aproximaciones nunca muestran el esfuerzo: lo que se registra de lo escrito antes de finalizar, tampoco', () => {
  assert.equal(d.seMuestraElEsfuerzoDeLaSerie(true, 'WARM_UP'), false);
  const sesion = d.SesionConObjetivosSchema.parse({
    sessionId: 's1',
    label: 'Piernas A',
    order: 1,
    instructions: null,
    prescriptions: [
      {
        prescriptionId: 'p1',
        order: 1,
        exerciseId: 'ej-1',
        exerciseVersionId: 'ev-1',
        exerciseName: 'Sentadilla',
        image: null,
        sets: [
          { setIndex: 1, setKind: 'WARM_UP', note: null, target: objetivo(5), targetOrigin: { rir: 'SET', suggestedLoad: 'SET', restSeconds: 'NONE' } },
          { setIndex: 2, note: null, target: objetivo(2), targetOrigin: { rir: 'SET', suggestedLoad: 'SET', restSeconds: 'NONE' } },
        ],
        intensity: null,
        suggestedLoad: null,
        restSeconds: null,
        loadBasis: null,
        repetitionBasis: null,
        professionalParameters: [],
        note: null,
      },
    ],
  });
  const escritas = { 'p1:1': { ...VACIA, repeticiones: '5', unidad: 'kg' }, 'p1:2': { ...VACIA, repeticiones: '8', unidad: 'kg' } };
  const encendida = s.pendientesDeRegistrar(sesion, null, [], [], escritas, 'RIR', true);
  assert.deepEqual(
    encendida.map((x) => x.lectura.ok && x.lectura.serie.rir),
    [null, 2],
    'la aproximación sin esfuerzo; la efectiva con el del plan',
  );
  const apagada = s.pendientesDeRegistrar(sesion, null, [], [], escritas, 'RIR', false);
  assert.deepEqual(
    apagada.map((x) => x.lectura.ok && x.lectura.serie.rir),
    [null, null],
  );
});

// ─── 2. «Ya la hice» ────────────────────────────────────────────────────────────────────────────

const serieDelPlan = (setIndex, rir, extra = {}) => ({ setIndex, note: null, target: objetivo(rir), targetOrigin: { rir: 'SET', suggestedLoad: 'SET', restSeconds: 'NONE' }, ...extra });
const SESION = d.SesionConObjetivosSchema.parse({
  sessionId: 's1',
  label: 'Piernas A',
  order: 1,
  instructions: null,
  prescriptions: [
    {
      prescriptionId: 'p1',
      order: 1,
      exerciseId: 'ej-1',
      exerciseVersionId: 'ev-1',
      exerciseName: 'Sentadilla',
      image: null,
      sets: [1, 2].map((i) => serieDelPlan(i, 2)),
      intensity: null,
      suggestedLoad: null,
      restSeconds: null,
      loadBasis: null,
      repetitionBasis: null,
      professionalParameters: [],
      note: null,
    },
  ],
});
const AHORA = new Date('2026-11-26T20:00:00Z');

test('2 · «Hice todo lo planificado»: encendida, con el RIR del plan; apagada, sin esfuerzo', () => {
  for (const [pide, esperado] of [
    [undefined, 2],
    [true, 2],
    [false, null],
  ]) {
    const ctx = { sesion: SESION, fecha: '2026-11-26', hoy: '2026-11-26', ...(pide === undefined ? {} : { pideElEsfuerzo: pide }) };
    const r = rr.elegir(ctx, rr.respuestasIniciales(ctx), 'todo');
    const armado = rr.armarRegistro(ctx, r, AHORA);
    assert.ok(armado.ok, JSON.stringify(armado));
    assert.deepEqual(
      armado.changes.exercises[0].sets.map((x) => x.rir),
      [esperado, esperado],
      String(pide),
    );
  }
  assert.equal(rr.serieDelPlan(serieDelPlan(1, 2, { setKind: 'WARM_UP' })).rir, null, 'una aproximación, sin esfuerzo');
});

test('2 · con cambios y apagada, lo escrito en otros campos viaja; el esfuerzo, no', () => {
  const ctx = { sesion: SESION, fecha: '2026-11-26', hoy: '2026-11-26', pideElEsfuerzo: false };
  let r = rr.marcarEjercicio(rr.elegir(ctx, rr.respuestasIniciales(ctx), 'distinto'), 'p1', true);
  r = rr.escribir(r, 'p1', 1, 'repeticiones', '6');
  const armado = rr.armarRegistro(ctx, r, AHORA);
  assert.ok(armado.ok, JSON.stringify(armado));
  const [s1, s2] = armado.changes.exercises[0].sets;
  assert.deepEqual([s1.completedRepetitions, s1.rir, s1.fieldOrigins?.rir], [6, null, undefined]);
  assert.equal(s2.rir, null);
});

// ─── 3. La corrección ───────────────────────────────────────────────────────────────────────────

const ejecucionCon = (rir) => ({
  original: {
    granularity: 'SET',
    sessionCondition: 'COMPLETED',
    reason: null,
    exercises: [
      { prescriptionId: 'p1', prescribedExerciseVersionId: 'ev-1', prescribedExerciseName: 'Sentadilla', performedExerciseVersionId: 'ev-1', performedExerciseName: 'Sentadilla', substituted: false, sets: [{ setIndex: 1, load: { value: 60, unit: 'kg' }, completedRepetitions: 8, rir, perceivedExertion: null }], executionSummary: null },
    ],
    sessionSummary: null,
  },
  corrections: [],
  effectiveView: { kind: 'ORIGINAL' },
});

test('3 · la corrección: encendida, con el campo; apagada y sin esfuerzos registrados, sin él', () => {
  const encendida = c.estadoInicial(ejecucionCon(null), SESION, 'RIR', true);
  assert.equal(encendida.ejercicios[0].filas.some((f) => f.sinEsfuerzo), false);
  const apagada = c.estadoInicial(ejecucionCon(null), SESION, 'RIR', false);
  assert.ok(apagada.ejercicios[0].filas.every((f) => f.sinEsfuerzo === true));
  // Una serie que se suma tildándola, sin el esfuerzo del plan.
  let estado = c.corregir(apagada, { tipo: 'tildar', prescriptionId: 'p1', setIndex: 2 });
  estado = c.corregir(estado, { tipo: 'motivo', motivo: 'falto-cargar' });
  const armada = c.construirCorreccion(estado);
  assert.ok(armada.ok, JSON.stringify(armada));
  const sumada = armada.correction.exercises[0].sets.find((x) => x.setIndex === 2);
  assert.equal(sumada.rir, null, 'sin el RIR 2 del plan');
  assert.equal(sumada.recordedAs, 'AS_PLANNED');
  // La fila que se agrega hereda que no tiene el campo.
  assert.equal(c.corregir(apagada, { tipo: 'agregar', prescriptionId: 'p1' }).ejercicios[0].filas.at(-1).sinEsfuerzo, true);
});

test('3 · apagada, un ejercicio con un esfuerzo registrado lo sigue mostrando y no lo pierde', () => {
  const estado = c.estadoInicial(ejecucionCon(2), SESION, 'RIR', false);
  assert.equal(estado.ejercicios[0].filas.some((f) => f.sinEsfuerzo), false);
  assert.equal(estado.ejercicios[0].filas[0].escrita.rir, '2');
});

// ─── 4. Lo que se ve en el código ───────────────────────────────────────────────────────────────

test('4 · la APK declara la capacidad y lee `askSetEffort` de API-SER-02 en la sesión, «Ya la hice» y la corrección', () => {
  assert.match(fuente('apps/mobile/src/api.ts'), /CAPACIDAD_ESFUERZO_DE_CADA_SERIE,\r?\n\] as const;/);
  assert.match(fuente('apps/mobile/src/pantallas/entrenamiento.tsx'), /fijarSesionDelPlan\(draftId, s\.datos\.data\.session, false, notacionDeLaLectura\(s\.datos\.data\), s\.datos\.data\.askSetEffort\)/);
  assert.match(fuente('apps/mobile/src/pantallas/registro-rapido.tsx'), /askSetEffort === false \? \{ pideElEsfuerzo: false \}/);
  assert.match(fuente('apps/mobile/src/pantallas/correccion-de-entrenamiento.tsx'), /askSetEffort === false/);
  // La tabla no dibuja la columna del esfuerzo apagada, y la ayuda tampoco la explica.
  const tabla = fuente('apps/mobile/src/pantallas/sesion-enfocada.tsx');
  assert.match(tabla, /\{pideElEsfuerzo \? <Text style=\{\[estilos\.columna, estilos\.columnaDato\]\}>\{textosDelEsfuerzo\(notacion\)\.columna\}<\/Text> : null\}/);
  assert.match(tabla, /\{pideElEsfuerzo \? <Parrafo>/);
});
