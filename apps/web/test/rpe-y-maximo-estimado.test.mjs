/**
 * WP-RPE-Y-MAXIMO-ESTIMADO (DL-192) · sin React: lo que el website hace con la notación del esfuerzo (TEST-RPE-040 a 046).
 * La conversión y el máximo estimado viven en el dominio (`notacion-del-esfuerzo.ts`) y tienen sus pruebas allá; acá se
 * fija que la fuerza, el editor y los registros los usen, y lo que dicen.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as D from '@be/domain';

const F = await import('../src/app/pro/advisees/fuerza/fuerza.ts');
const leer = (r) => readFileSync(new URL(`../src/app/pro/advisees/${r}`, import.meta.url), 'utf8');

const PRESS = 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7';
const diego = { identityId: '11111111-1111-4111-8111-111111111111', displayName: 'Diego Sosa' };
const estimacion = (carga, reps, rir) => {
  const n = reps + rir;
  return { specification: 'BE-E1RM', version: 1, method: 'EPLEY_V1', band: n <= 10 ? 'CORE' : 'ORIENTATIVE', load: { value: carga, unit: 'kg' }, completedRepetitions: reps, rir, equivalentRepetitions: n, value: n === 1 ? carga : (carga * (30 + n)) / 30 };
};
const punto = (carga, reps, rir) => ({
  pointId: 'x:e1:p1:1',
  date: '2026-11-20',
  source: 'PERSON',
  origin: { type: 'TRAINING_EXECUTION', id: '33333333-3333-4333-8333-333333333331', prescriptionId: 'p1', setIndex: 1, corrected: false },
  writtenBy: diego,
  estimate: estimacion(carga, reps, rir),
});

test('TEST-RPE-040 · la serie de origen y con qué se estimó, en cada notación; sin notación, RIR como siempre', () => {
  const p = punto(100, 5, 2);
  assert.equal(F.laSerie(p), '100 kg × 5 · RIR 2');
  assert.equal(F.laSerie(p, 'RPE'), '100 kg × 5 · RPE 8');
  assert.equal(F.conQueSeEstimoElPunto(p, 'RPE'), 'estimado con 5 reps a RPE 8 · 100 kg');
  assert.equal(F.conQueSeEstimoElPunto(p, 'RIR'), 'estimado con 5 reps a RIR 2 · 100 kg');
  assert.equal(F.conQueSeEstimoElPunto(punto(82.5, 8, 1.5), 'RPE'), 'estimado con 8 reps a RPE 8,5 · 82,5 kg');
});

test('TEST-RPE-041 · la regla y los motivos de la estimación, en RPE: los mismos límites (RIR 0 a 2 = RPE 8 a 10)', () => {
  const E1 = '33333333-3333-4333-8333-333333333331';
  const noEntraron = [
    { executionId: E1, date: '2026-11-20', prescriptionId: 'p1', setIndex: 2, reason: 'RIR_MAYOR_QUE_2', fields: [] },
    { executionId: E1, date: '2026-11-20', prescriptionId: 'p1', setIndex: 3, reason: 'SIN_RIR', fields: [] },
  ];
  const enRpe = F.loQueHaceFalta(noEntraron, 'RPE');
  assert.match(enRpe.regla, /RPE 8 a 10 \(RIR 0 a 2\)/);
  assert.match(enRpe.motivos, /el RPE es menor que 8/);
  assert.match(enRpe.motivos, /no tiene RPE/);
  assert.equal(F.loQueHaceFalta(noEntraron).regla, D.COPY_FUERZA.reglaDelRir);
  assert.deepEqual(F.loQueNoEntroEnLaSesion(punto(100, 5, 1), noEntraron, 'RPE'), ['Serie 2: el RPE es menor que 8', 'Serie 3: no tiene RPE']);
});

test('TEST-RPE-042 · el cuadro de la serie observada se lee en RPE y guarda el RIR', () => {
  const base = { exerciseId: PRESS, fecha: '2026-11-20', unidad: 'kg' };
  assert.deepEqual(
    [...F.RIR_DEL_CUADRO, F.RIR_MAS_DE_2].map((r) => F.opcionDelCuadro(r, 'RPE', 'Más de 2')),
    ['10', '9,5', '9', '8,5', '8', 'Menos de 8'],
  );
  assert.deepEqual(
    [...F.RIR_DEL_CUADRO, F.RIR_MAS_DE_2].map((r) => F.opcionDelCuadro(r, 'RIR', 'Más de 2')),
    ['0', '0,5', '1', '1,5', '2', 'Más de 2'],
  );
  const estima = F.serieObservadaEnVivo({ ...base, carga: '100', repeticiones: '5', rir: 2 }, 'RPE');
  assert.equal(estima.tipo, 'estima');
  // Lo que se manda es el RIR: RPE 8 es RIR 2.
  assert.equal(estima.rir, 2);
  assert.deepEqual(F.serieObservadaEnVivo({ ...base, carga: '100', repeticiones: '5', rir: F.RIR_MAS_DE_2 }, 'RPE'), { tipo: 'no-se-estima', texto: 'Con un RPE menor que 8 no se estima' });
  assert.deepEqual(F.serieObservadaEnVivo({ ...base, carga: '100', repeticiones: '5', rir: null }, 'RPE'), { tipo: 'no-se-estima', texto: 'Sin RPE no se puede estimar' });
  const cuadro = leer('fuerza/serie-observada.tsx');
  assert.match(cuadro, /opcionDelCuadro\(r, notacion, C\.masDe2\)/);
  assert.match(cuadro, /rir: enVivo\.rir/);
});

test('TEST-RPE-043 · el editor guarda la notación con el borrador, la provee a las series y la ofrece al pie de las sesiones', () => {
  const editor = leer('training/editor.tsx');
  assert.match(editor, /effortNotation: notacion,/);
  assert.match(editor, /setNotacion\(notacionDe\(r\.datos\.data\.effortNotation\)\)/);
  assert.match(editor, /<ProveedorDeLaNotacion value=\{plantilla \? NOTACION_POR_OMISION : notacion\}>/);
  // DL-197 (ET1-D10): la notación se elige con la intensidad del plan, en «Configurar plan» (RIR o RPE).
  assert.match(editor, /if \(c\.notacion !== notacion\) setNotacion\(c\.notacion\);/);
  assert.match(leer('training/cuadros-del-plan.tsx'), /nombreDeLaIntensidad: \{ RIR: 'RIR', RPE: 'RPE', PERCENT_RM: '% RM', NONE: 'Solo carga y repeticiones' \}/);
  const ejercicio = leer('training/ejercicio-del-editor.tsx');
  // Las celdas del RIR se escriben y se leen en la notación; lo guardado es el RIR.
  assert.match(ejercicio, /escribir=\{rirEnCampo\(notacion\)\}/);
  assert.match(ejercicio, /leer=\{leerElRir\(notacion\)\}/);
  assert.match(ejercicio, /leerRpeEscrito\(t\)/);
  const selector = leer('training/notacion-del-plan.tsx');
  // Lo largo y las fuentes, detrás del «?».
  assert.match(selector, /<ExplicacionAPedido nombre="Qué es el RPE y cómo se guarda" como="div" lugar="esquina">/);
  assert.match(selector, /aria-pressed=\{n === notacion\}/);
});

test('TEST-RPE-044 · lo registrado y la fuerza se leen en la notación del plan de la persona', () => {
  assert.match(leer('training/entrenamiento.tsx'), /<ConLaNotacionDeLaPersona token=\{contexto\.token\} asesoradoId=\{contexto\.asesoradoId\} clave=\{vista\}>/);
  assert.match(leer('training/ejecuciones.tsx'), /componerLasSesiones\(ejecuciones, objetivosPorVersion, notacion\)/);
  assert.match(leer('fuerza/fuerza-en-analizar.tsx'), /<ConLaNotacionDeLaPersona token=\{token\} asesoradoId=\{asesoradoId\}>/);
  assert.match(leer('fuerza/tarjeta.tsx'), /conQueSeEstimoElPunto\(p, notacion\)/);
  assert.match(leer('notacion-del-esfuerzo.tsx'), /notacionDeLasVersiones\(r\.datos\.data\)/);
  // Activar una versión en otra notación se lee sin recargar: «Plan» la toma de las versiones que vuelve a leer, y las
  // demás vistas releen la notación al entrar.
  assert.match(leer('notacion-del-esfuerzo.tsx'), /\}, \[token, asesoradoId, clave\]\);/);
  assert.match(leer('training/plan.tsx'), /const notacionDeLaPersona = r\?\.ok \? notacionDeLasVersiones\(r\.datos\.versiones\) : notacionDeArriba;/);
  assert.match(leer('training/plan.tsx'), /<ProveedorDeLaNotacion value=\{notacionDeLaPersona\}>/);
});

test('TEST-RPE-046 · antes de activar, el cambio de notación se dice, y los renglones y «La vez pasada» van en la del borrador', async () => {
  const C = await import('../src/app/pro/advisees/comparar-versiones.ts');
  const V = await import('../src/app/pro/advisees/training/lista-de-la-vez-pasada.ts');
  const plan = [{ blockId: 'b1', label: 'Fase 1', purpose: null, sessions: [{ sessionId: 's1', label: 'Piernas A', instructions: null, prescriptions: [] }] }];
  const como = { nombreDelEjercicio: () => 'Ejercicio', renglon: () => '' };
  // Mismo contenido, otra notación: la app de la persona va a preguntar distinto, y eso es un cambio.
  const c = C.compararEntrenamiento(plan, plan, { ...como, notaciones: { vigente: 'RIR', borrador: 'RPE' } });
  assert.deepEqual(c.lista, ['Cómo se escribe el esfuerzo: RIR → RPE']);
  assert.equal(c.modificados, 1);
  assert.equal(C.compararEntrenamiento(plan, plan, { ...como, notaciones: { vigente: 'RPE', borrador: 'RPE' } }).lista.length, 0);
  assert.equal(C.compararEntrenamiento(plan, plan, como).lista.length, 0);
  const editor = leer('training/editor.tsx');
  assert.match(editor, /renglon: \(p\) => ejercicioPlegadoDelEditor\(p, 0, notacion\)\.resumen,\n(?:.*\n){0,2}.*notaciones: \{ vigente: notacionDe\(vigente\.plan\.effortNotation\), borrador: notacion \}/);
  // «La vez pasada»: la ficha corta y la entera, en la notación; sin notación, RIR.
  const serie = { numero: 1, carga: { value: 100, unit: 'kg' }, repeticiones: 5, rir: 2, cargaRapida: false, delPlan: [] };
  assert.equal(V.textoDeLaFicha(serie, 'kg'), '100 × 5 · RIR 2');
  assert.equal(V.textoDeLaFicha(serie, 'kg', 'RPE'), '100 × 5 · RPE 8');
  assert.match(leer('training/la-vez-pasada.tsx'), /textoDeLaFicha\(serie, unidad, notacion\)/);
});

test('TEST-RPE-045 · los textos de pantalla nuevos pasan las guardias de Entrenamiento y de fuerza', () => {
  const textos = [
    'Menos de 8',
    'RPE observado',
    'Con más de 12 repeticiones equivalentes, o con un RPE menor que 8, no se estima: el cuadro lo dice y no guarda nada.',
    'No se entiende: va un RPE de 6 a 10, de a medio punto, o «6 o menos».',
    'Qué es el RPE y cómo se guarda',
    F.conQueSeEstimoElPunto(punto(100, 5, 2), 'RPE'),
  ];
  for (const t of textos) {
    assert.deepEqual(D.terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.deepEqual(D.terminosProhibidosDeFuerzaEn(t), [], t);
  }
});
