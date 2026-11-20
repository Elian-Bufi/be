/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185) · TEST-EVF-030 a TEST-EVF-035 · los formularios vinculados a la evaluación inicial
 * en el website, sin navegador:
 *  1. qué se ofrece para vincular: los del área de la evaluación, sin los ya vinculados, del más nuevo al más viejo;
 *  2. el tope de 20, también contando los ya vinculados;
 *  3. lo que se manda: cada elegido con la versión que se vio, en el orden de la lista;
 *  4. el aviso de la evaluación recién registrada se toma una sola vez, y solo en memoria;
 *  5. dónde se monta: en el formulario de la evaluación de las dos áreas (y vincula después de registrar), debajo de
 *     «Registrada el …» en «Empezar el plan» y en Resumen;
 *  6. la privacidad: nada se guarda en el navegador y nada de lo respondido se escribe en la evaluación ni en el fundamento.
 * Lo que se ve, en las capturas (`EVIDENCIA/EVALUACION-Y-FORMULARIOS/herramientas/capturas.mjs`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const V = await import('../src/app/pro/advisees/evaluacion/formularios-vinculados.ts');
const AQUI = dirname(fileURLToPath(import.meta.url));
const leer = (ruta) => readFileSync(join(AQUI, '../src/app/pro/advisees', ruta), 'utf8');

const form = (formResponseId, scope, answeredAt, version = 'v1') => ({
  formRequestId: `s-${formResponseId}`,
  formResponseId,
  scope,
  templateKey: 'FRM-NUTRICION-INICIO',
  templateName: 'Cómo comés hoy',
  templateVersion: '2',
  purpose: 'Para empezar tu plan',
  requestedAt: '2026-11-10T12:00:00.000Z',
  answeredAt,
  version,
  rectified: version !== 'v1',
  transcribedConfirmedAt: null,
  sections: [],
});

test('TEST-EVF-030 · se ofrecen los del área de la evaluación, sin los ya vinculados, del más nuevo al más viejo', () => {
  const forms = [
    form('a', 'NUTRICION', '2026-11-12T12:00:00.000Z'),
    form('b', 'ENTRENAMIENTO', '2026-11-18T12:00:00.000Z'),
    form('c', 'NUTRICION', '2026-11-15T12:00:00.000Z', 'v2'),
    form('d', 'NUTRICION', '2026-11-14T12:00:00.000Z'),
  ];
  assert.deepEqual(V.formulariosParaVincular(forms, 'nutrition').map((f) => f.formResponseId), ['c', 'd', 'a']);
  assert.deepEqual(V.formulariosParaVincular(forms, 'training').map((f) => f.formResponseId), ['b']);
  assert.deepEqual(V.formulariosParaVincular(forms, 'nutrition', [{ formResponseId: 'd' }]).map((f) => f.formResponseId), ['c', 'a']);
  // No cambia la lista que recibe.
  assert.deepEqual(forms.map((f) => f.formResponseId), ['a', 'b', 'c', 'd']);
});

test('TEST-EVF-031 · el tope de 20, contando los ya vinculados', () => {
  assert.deepEqual(V.alternarElegido([], 'a'), { elegidos: ['a'], tope: false });
  assert.deepEqual(V.alternarElegido(['a'], 'a'), { elegidos: [], tope: false });
  const diecinueve = Array.from({ length: 19 }, (_, i) => `x${i}`);
  assert.equal(V.alternarElegido(diecinueve, 'a').elegidos.length, 20);
  assert.deepEqual(V.alternarElegido(diecinueve, 'a', 1), { elegidos: diecinueve, tope: true });
  // Desmarcar siempre se puede.
  assert.equal(V.alternarElegido(diecinueve, 'x0', 5).elegidos.length, 18);
});

test('TEST-EVF-032 · se manda cada elegido con la versión que se vio, en el orden de la lista', () => {
  const forms = [form('c', 'NUTRICION', '2026-11-15T12:00:00.000Z', 'v2'), form('a', 'NUTRICION', '2026-11-12T12:00:00.000Z')];
  assert.deepEqual(V.vinculosAEnviar(forms, ['a', 'c', 'ya-no-esta']), [
    { formResponseId: 'c', expectedVersion: 'v2' },
    { formResponseId: 'a', expectedVersion: 'v1' },
  ]);
  assert.deepEqual(V.vinculosAEnviar(forms, []), []);
  const vinculo = (laterVersion) => ({ linkId: 'l', formResponseId: 'a', laterVersion });
  assert.equal(V.conVersionMasNueva([vinculo(null), vinculo({ version: 'v2', answeredAt: '2026-11-19T12:00:00.000Z' })]).length, 1);
});

test('TEST-EVF-033 · el aviso de la evaluación recién registrada se toma una sola vez', () => {
  assert.equal(V.tomarAvisoDeVinculos('e1'), null);
  V.dejarAvisoDeVinculos('e1', 'No se vincularon.');
  assert.equal(V.tomarAvisoDeVinculos('e2'), null);
  assert.equal(V.tomarAvisoDeVinculos('e1'), 'No se vincularon.');
  assert.equal(V.tomarAvisoDeVinculos('e1'), null);
});

test('TEST-EVF-034 · se monta en la evaluación de las dos áreas, en «Empezar el plan» y en Resumen, y vincula después de registrar', () => {
  const nutricion = leer('nutrition/formularios.tsx');
  assert.match(nutricion, /<ElegirFormularios area="nutrition"/);
  // Primero se registra la evaluación (API-NUT-01 sin cambios) y después se vincula, antes de avisar que quedó.
  assert.match(nutricion, /api\.crearEvaluacion\([\s\S]*vincularAlRegistrar\(token, 'nutrition', r\.datos\.data\.evaluationId, vinculos\);[\s\S]*onRegistrada\(r\.datos\.data\.evaluationId\)/);
  const entrenamiento = leer('training/resumen.tsx');
  assert.match(entrenamiento, /<ElegirFormularios area="training"/);
  assert.match(entrenamiento, /api\.crearEvaluacionDeEntrenamiento\([\s\S]*vincularAlRegistrar\(token, 'training', r\.datos\.data\.evaluationId, vinculos\);[\s\S]*onRegistrada\(\)/);
  // En la evaluación más reciente: una lectura por pantalla, no una por evaluación (el límite de consultas protegidas).
  assert.match(entrenamiento, /e\.evaluationId === evaluacionMasReciente\(evaluaciones\.datos\) \? \(\s*<FormulariosDeLaEvaluacion key=\{e\.evaluationId\} area="training"/);
  assert.match(leer('nutrition/resumen.tsx'), /<FormulariosDeLaEvaluacion key=\{lista\[0\]\.evaluationId\} area="nutrition"/);
  for (const [archivo, area] of [
    ['nutrition/plan.tsx', 'nutrition'],
    ['training/plan.tsx', 'training'],
  ]) {
    assert.match(leer(archivo), new RegExp(`detalleDeLaEvaluacion=\\{ultima \\? <FormulariosDeLaEvaluacion key=\\{ultima\\.evaluationId\\} area="${area}"`), archivo);
  }
  // «Empezar el plan» lo muestra debajo de «Registrada el …», solo con una evaluación registrada.
  assert.match(leer('primer-plan.tsx'), /typeof p\.evaluacion === 'string' \? p\.detalleDeLaEvaluacion : null/);
});

test('TEST-EVF-035 · nada se guarda en el navegador y nada de lo respondido se escribe en la evaluación ni en el fundamento', () => {
  const componente = leer('evaluacion/formularios-de-la-evaluacion.tsx');
  const logica = leer('evaluacion/formularios-vinculados.ts');
  for (const codigo of [componente, logica]) {
    assert.doesNotMatch(codigo, /localStorage|sessionStorage|indexedDB/);
    assert.doesNotMatch(codigo, /fundamento|rationale|assessment|professionalNotes/);
  }
  // Las únicas escrituras son las de la familia EVF; las respuestas solo se leen (API-CTX-01 y API-EVF-04).
  const llamadas = [...componente.matchAll(/api\.([a-zA-Z]+)\(/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(llamadas)].sort(), ['desvincularFormulario', 'formularioVinculado', 'formulariosVinculados', 'respuestasDelContexto', 'vincularFormularios']);
  // Los textos salen del dominio (COPY_EVALUACION_Y_FORMULARIOS), revisado por TEST-EVF-004.
  assert.match(componente, /COPY_EVALUACION_Y_FORMULARIOS as C/);
  // La conducta alimentaria, como en el panel: el renglón del dominio, plegado si es sensible.
  assert.match(componente, /renglonesDelFormulario\(form\)/);
  assert.match(componente, /x\.sensible \?/);
});
