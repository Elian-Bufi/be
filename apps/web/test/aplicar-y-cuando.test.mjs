/**
 * WP-TABLERO-ALTA-GAMA TB-15 (DL-163 D-6): aplicar desde el cajón y «¿Cuándo la revisás?», sin React
 * (`src/lib/cuando-la-revisas.ts`, `src/app/pro/advisees/aplicar-la-revision.ts` y `src/app/pro/cajon.ts`) y con una mirada
 * a los componentes:
 *  1. TEST-TAG-013 · aplicar desde el cajón es aplicar: la misma operación que Revisiones, con la clave del intento, los
 *     mismos conflictos y los mismos textos; el cuadro pregunta por una revisión registrada y sin aplicar solo si lo dice
 *     lo leído al abrir; el foco nunca va al botón. La parte de integración (la misma clave no aplica dos veces y una
 *     versión vieja da el conflicto de siempre) está en test/integration (aplicar-desde-el-cajon y entrenamiento).
 *  2. TEST-TAG-034 · «¿Cuándo la revisás?» empieza sin nada elegido, dice la fecha que resulta y su efecto, no ofrece
 *     «Sin fecha por ahora» con «Reprogramar revisión» y sale solo de fechas del profesional.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const cuando = await import('../src/lib/cuando-la-revisas.ts');
const aplicar = await import('../src/app/pro/advisees/aplicar-la-revision.ts');
const { COPY_CAJON, revisionPorAplicar } = await import('../src/app/pro/cajon.ts');
const { EFECTO_VISIBLE_DE_RESULTADO, EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO, terminosProhibidosDeCarteraEn, terminosProhibidosDeEntrenamientoEn, terminosProhibidosEn } = await import('@be/domain');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8');
const PIEZA = leer('app/pro/aplicar-en-el-cajon.tsx');
const CAJON = leer('app/pro/cajon-de-a-una.tsx');
const MODELO = leer('lib/cuando-la-revisas.ts');
const enPalabras = (f) => `día ${f}`;
const RESULTADOS = ['MAINTAIN', 'ADJUST', 'REPLACE', 'RESCHEDULE_REVIEW', 'CHANGE_OBJECTIVE', 'FINALIZE'];

// ─── TEST-TAG-013 ─────────────────────────────────────────────────────────────────────────────────────────────

test('TEST-TAG-013 · la pieza del cajón usa las operaciones de Revisiones, con la clave del intento, y solo ellas', () => {
  const llamadas = [...new Set([...PIEZA.matchAll(/\bapi\.(\w+)\(/g)].map((m) => m[1]))].sort();
  assert.deepEqual(llamadas, ['aplicarRevision', 'aplicarRevisionDeEntrenamiento', 'consultarRevision', 'consultarRevisionDeEntrenamiento']);
  // La misma forma de llamar que la lista de Revisiones de cada área: la clave del intento, que un reintento incierto reusa.
  for (const [area, metodo] of [
    ['nutrition', 'aplicarRevision'],
    ['training', 'aplicarRevisionDeEntrenamiento'],
  ]) {
    const lista = leer(`app/pro/advisees/${area}/revisiones.tsx`);
    assert.match(lista, new RegExp(`api\\.${metodo}\\(token, revision\\.reviewId, intento\\.actual\\(\\)\\)`), area);
    assert.match(PIEZA, new RegExp(`api\\.${metodo}\\(token, revisionId, intento\\.actual\\(\\)\\)`), area);
    assert.match(lista, /falloPropioDeAplicar\(r\) \?\? mensajeDeFallo\(r\)/, area);
    assert.match(lista, new RegExp(`textoDeLaAplicacion\\('${area}', a\\)`), area);
  }
  assert.match(PIEZA, /intento\.registrar\(r\)/);
  assert.match(PIEZA, /falloPropioDeAplicar\(r\) \?\? mensajeDeFallo\(r\)/);
  assert.doesNotMatch(PIEZA, /nuevaClaveDeIdempotencia/);
  // El cajón en sí sigue sin escribir: la escritura vive solo en su pieza (TEST-TAG-009 lo mira en el cajón).
  assert.doesNotMatch(CAJON, /api\.aplicar|nuevaClaveDeIdempotencia|useClaveDeIntento/);
});

test('TEST-TAG-013 · los conflictos de siempre: no aplicable ahora y ya aplicada; los demás, como cualquier escritura', () => {
  const api = (codigo) => ({ ok: false, tipo: 'API', codigo, status: 409, issues: [] });
  assert.equal(aplicar.falloPropioDeAplicar(api('CONTINUITY_ACTION_NOT_APPLICABLE')), aplicar.COPY_APLICAR.noAplicableAhora);
  assert.equal(aplicar.falloPropioDeAplicar(api('REVIEW_ALREADY_APPLIED')), aplicar.COPY_APLICAR.yaAplicada);
  assert.equal(aplicar.falloPropioDeAplicar(api('VERSION_CONFLICT')), null);
  assert.equal(aplicar.falloPropioDeAplicar({ ok: false, tipo: 'RED' }), null);
});

test('TEST-TAG-013 · el cuadro pregunta por aplicar solo si lo leído al abrir trae una revisión registrada y sin aplicar', () => {
  const ultima = { reviewId: 'r-1', recordedAt: '2026-10-16T13:00:00.000Z', author: { identityId: 'p', displayName: 'P' } };
  const dominios = (application) => ({
    nutrition: { available: true, summary: { lastReview: { ...ultima, application } } },
    training: { available: true, summary: null },
    anthropometry: { available: false },
  });
  const aplicada = { appliedAt: '2026-10-17T10:00:00.000Z', createdPlanId: null, createdObjectiveVersionId: null };
  for (const kind of ['REVIEW_OVERDUE', 'REVIEW_DUE_SOON', 'REVIEW_UNDATED']) {
    assert.deepEqual(revisionPorAplicar({ kind, domain: 'nutrition' }, dominios(null)), { reviewId: 'r-1', recordedAt: ultima.recordedAt }, kind);
    assert.equal(revisionPorAplicar({ kind, domain: 'nutrition' }, dominios(aplicada)), null, kind);
  }
  // Un borrador o un área sin plan no son una revisión; Antropometría no tiene; un área que no se lee, tampoco.
  assert.equal(revisionPorAplicar({ kind: 'PLAN_DRAFT_PENDING', domain: 'nutrition' }, dominios(null)), null);
  assert.equal(revisionPorAplicar({ kind: 'REVIEW_OVERDUE', domain: 'training' }, dominios(null)), null);
  assert.equal(revisionPorAplicar({ kind: 'ANTHRO_DRAFT_PENDING', domain: 'anthropometry' }, dominios(null)), null);
  assert.equal(revisionPorAplicar({ kind: 'REVIEW_OVERDUE', domain: 'nutrition' }, { ...dominios(null), nutrition: { available: false } }), null);
  assert.equal(COPY_CAJON.preguntaDeAplicar('16 oct'), 'La revisión del 16 oct está registrada y sin aplicar. ¿La aplicás?');
});

test('TEST-TAG-013 · antes del botón, el resultado, el fundamento, la próxima acción y el efecto con la fecha; después, lo que hizo', () => {
  for (const r of RESULTADOS) {
    assert.equal(aplicar.efectoDelResultado('nutrition', r), EFECTO_VISIBLE_DE_RESULTADO[r]);
    assert.equal(aplicar.efectoDelResultado('training', r), EFECTO_VISIBLE_DE_RESULTADO_DE_ENTRENAMIENTO[r]);
  }
  assert.equal(aplicar.efectoDeLaFecha('MAINTAIN', '2026-11-16', enPalabras), 'La próxima revisión queda para el día 2026-11-16.');
  assert.equal(aplicar.efectoDeLaFecha('ADJUST', null, enPalabras), 'No se acuerda una fecha nueva: la revisión que ya estaba acordada no cambia.');
  assert.equal(aplicar.efectoDeLaFecha('FINALIZE', '2026-11-16', enPalabras), null);
  for (const marca of ['Resultado', 'Fundamento', 'revision.rationale', 'revision.nextAction.description', 'efectoDelResultado(area, revision.result)', 'efectoDeLaFecha(']) assert.ok(PIEZA.includes(marca), marca);
  // Lo escrito va antes del botón.
  assert.ok(PIEZA.indexOf('efectoDelResultado(area') < PIEZA.indexOf('data-aplicar-en-el-cajon'));
  const nada = { processStateAfter: 'ABIERTO', createdPlanId: null, createdObjectiveVersionId: null };
  assert.equal(aplicar.textoDeLaAplicacion('nutrition', nada), 'Continuidad aplicada');
  assert.equal(aplicar.textoDeLaAplicacion('training', nada), 'Próxima acción aplicada.');
  assert.match(aplicar.textoDeLaAplicacion('nutrition', { ...nada, createdPlanId: 'p' }), /^Continuidad aplicada: se preparó una nueva versión del plan en borrador\./);
  assert.match(aplicar.textoDeLaAplicacion('training', { ...nada, createdObjectiveVersionId: 'o' }), /^Próxima acción aplicada: se emitió una nueva versión del objetivo\.$/);
  assert.equal(aplicar.textoDeLaAplicacion('training', { ...nada, processStateAfter: 'CERRADO' }), 'Seguimiento cerrado. La historia se conserva.');
});

test('TEST-TAG-013 · el foco nunca va al botón de aplicar, Enter no es un atajo y sin leer la revisión no se ofrece aplicar', () => {
  assert.doesNotMatch(PIEZA, /\.focus\(|autoFocus|onKeyDown|'Enter'/);
  // El botón aparece solo con la revisión leída y sin aplicar.
  assert.match(PIEZA, /\{revision && !yaAplicada \? \(\s*<button[^>]*data-aplicar-en-el-cajon/);
  // Lo aplicado se dice en su cuadro y en el cierre, sin cuentas ni festejos.
  for (const t of [COPY_CAJON.aplicadas, COPY_CAJON.aplicadaEnElCierre, COPY_CAJON.aplicada({ domain: 'training' })]) assert.doesNotMatch(t, /\d|¡|!|felicit|genial|bien hecho/i, t);
});

test('TEST-TAG-013 · los textos nuevos pasan las listas de términos', () => {
  const textos = [
    ...Object.values(aplicar.COPY_APLICAR),
    ...Object.values(aplicar.VERBO_DE_APLICAR),
    aplicar.efectoDeLaFecha('MAINTAIN', null, enPalabras),
    COPY_CAJON.preguntaDeAplicar('16 oct'),
    COPY_CAJON.leyendoLaRevision,
    COPY_CAJON.sinLeerLaRevision,
    COPY_CAJON.verLaRevision,
    COPY_CAJON.alAplicar,
    COPY_CAJON.aplicada({ domain: 'nutrition' }),
    COPY_CAJON.seguirElBorrador,
    COPY_CAJON.aplicadas,
    COPY_CAJON.aplicadaEnElCierre,
  ];
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosDeCarteraEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px/i, t);
  }
});

// ─── TEST-TAG-034 ─────────────────────────────────────────────────────────────────────────────────────────────

test('TEST-TAG-034 · nada viene elegido: sin elegir no hay fecha y falta elegir, también «Sin fecha por ahora»', () => {
  assert.deepEqual(cuando.NADA_ELEGIDO, { tipo: 'NADA' });
  assert.equal(cuando.fechaQueResulta(cuando.NADA_ELEGIDO, '2026-11-06'), undefined);
  assert.equal(cuando.loQueFalta(cuando.NADA_ELEGIDO, '2026-11-06'), cuando.COPY_CUANDO.falta);
  assert.equal(cuando.claveDeLaEleccion(cuando.NADA_ELEGIDO), null);
  assert.equal(cuando.loQueFalta({ tipo: 'SIN_FECHA' }, '2026-11-06'), null);
  // «Elegir una fecha» sin la fecha, o con una que no existe, todavía falta.
  assert.equal(cuando.loQueFalta({ tipo: 'FECHA', fecha: '' }, '2026-11-06'), cuando.COPY_CUANDO.faltaLaFecha);
  assert.equal(cuando.fechaQueResulta({ tipo: 'FECHA', fecha: '2026-02-30' }, '2026-11-06'), undefined);
  // Al activar, sin una fecha en la versión, nada; con una, esa, dicha como la que ya estaba.
  assert.deepEqual(cuando.eleccionAlActivar(null), cuando.NADA_ELEGIDO);
  assert.deepEqual(cuando.eleccionAlActivar('2026-11-20'), { tipo: 'FECHA', fecha: '2026-11-20', yaEstaba: true });
  // Las pantallas: la revisión valida que se eligió; el cuadro de activar espera a que se elija.
  for (const area of ['nutrition', 'training']) {
    const lista = leer(`app/pro/advisees/${area}/revisiones.tsx`);
    assert.match(lista, /useState<EleccionDeLaProxima>\(NADA_ELEGIDO\)/, area);
    assert.match(lista, /loQueFalta\(cuando, hoy, resultado \|\| null\)/, area);
    assert.doesNotMatch(lista, /Próxima revisión \(opcional\)/, area);
    const editor = leer(`app/pro/advisees/${area}/editor.tsx`);
    assert.match(editor, /useState<EleccionDeLaProxima>\(NADA_ELEGIDO\)/, area);
    assert.match(editor, /confirmarDeshabilitado=\{fechaQueResulta\(cuando, hoyEn\(\)\) === undefined\}/, area);
    assert.match(editor, /momento="ACTIVAR"/, area);
  }
});

test('TEST-TAG-034 · cada opción dice la fecha que resulta, contada desde hoy', () => {
  const hoy = '2026-12-28';
  assert.equal(cuando.fechaQueResulta({ tipo: 'EN_SEMANAS', semanas: 1 }, hoy), '2027-01-04');
  assert.equal(cuando.fechaQueResulta({ tipo: 'EN_SEMANAS', semanas: 2 }, hoy), '2027-01-11');
  assert.equal(cuando.fechaQueResulta({ tipo: 'EN_SEMANAS', semanas: 4 }, hoy), '2027-01-25');
  assert.equal(cuando.fechaQueResulta({ tipo: 'FECHA', fecha: '2027-02-01' }, hoy), '2027-02-01');
  assert.equal(cuando.fechaQueResulta({ tipo: 'SIN_FECHA' }, hoy), null);
  const opciones = cuando.opcionesDeLaPregunta(hoy, true, enPalabras);
  assert.deepEqual(
    opciones.map((o) => o.texto),
    ['En 1 semana · día 2027-01-04', 'En 2 semanas · día 2027-01-11', 'En 4 semanas · día 2027-01-25', 'Elegir una fecha', 'Sin fecha por ahora'],
  );
  for (const o of opciones) assert.equal(cuando.claveDeLaEleccion(o.eleccion), o.clave);
});

test('TEST-TAG-034 · con «Reprogramar revisión» no hay «Sin fecha por ahora», y con «Finalizar» no se pregunta', () => {
  assert.equal(cuando.admiteSinFecha('RESCHEDULE_REVIEW'), false);
  for (const r of RESULTADOS.filter((x) => x !== 'RESCHEDULE_REVIEW')) assert.equal(cuando.admiteSinFecha(r), true, r);
  assert.ok(!cuando.opcionesDeLaPregunta('2026-11-06', false, enPalabras).some((o) => o.clave === 'sin-fecha'));
  assert.deepEqual(cuando.eleccionAlCambiarElResultado({ tipo: 'SIN_FECHA' }, 'RESCHEDULE_REVIEW'), cuando.NADA_ELEGIDO);
  assert.deepEqual(cuando.eleccionAlCambiarElResultado({ tipo: 'EN_SEMANAS', semanas: 2 }, 'RESCHEDULE_REVIEW'), { tipo: 'EN_SEMANAS', semanas: 2 });
  assert.deepEqual(cuando.eleccionAlCambiarElResultado({ tipo: 'SIN_FECHA' }, 'MAINTAIN'), { tipo: 'SIN_FECHA' });
  assert.equal(cuando.loQueFalta(cuando.NADA_ELEGIDO, '2026-11-06', 'RESCHEDULE_REVIEW'), cuando.COPY_CUANDO.faltaParaReprogramar);
  assert.equal(cuando.sePregunta('FINALIZE'), false);
  assert.equal(cuando.sePregunta('MAINTAIN'), true);
});

test('TEST-TAG-034 · el efecto se dice en el acto que fija la fecha, y «Sin fecha por ahora» dice lo que hace BE hoy', () => {
  const C = cuando.COPY_CUANDO;
  assert.equal(C.efecto('REVISION', 'miércoles 11 nov'), 'Al aplicar esta revisión, la próxima queda para el miércoles 11 nov.');
  assert.equal(C.efecto('ACTIVAR', 'miércoles 11 nov'), 'Al activar, la próxima revisión queda para el miércoles 11 nov.');
  assert.equal(C.efectoSinFecha('ACTIVAR', true), 'Sin fecha acordada, esta área no aparece en las revisiones de «Te toca a vos».');
  assert.match(C.efectoSinFecha('ACTIVAR', false), /^Al activar no se acuerda una fecha nueva: la revisión que ya estaba acordada no cambia\.$/);
  assert.match(C.efectoSinFecha('REVISION', false), /^Al aplicar esta revisión no se acuerda una fecha nueva/);
  // En la revisión nunca se promete que el área sale de la cola: la expectativa que ya estaba sigue (TA-41).
  assert.doesNotMatch(C.efectoSinFecha('REVISION', true), /no aparece/);
});

test('TEST-TAG-034 · lo acordado la última vez va como dato, y todo sale de fechas del profesional', () => {
  assert.equal(cuando.cicloAcordadoAntes([]), null);
  assert.equal(cuando.cicloAcordadoAntes([{ dia: '2026-10-05', acordada: '2026-11-02' }]), 'a las 4 semanas');
  assert.equal(cuando.cicloAcordadoAntes([{ dia: '2026-10-05', acordada: '2026-10-12' }]), 'a la semana');
  assert.equal(cuando.cicloAcordadoAntes([{ dia: '2026-10-05', acordada: '2026-10-15' }]), 'a los 10 días');
  // La última revisión con una fecha, sin importar el orden en que llegan.
  assert.equal(
    cuando.cicloAcordadoAntes([
      { dia: '2026-09-01', acordada: '2026-09-15' },
      { dia: '2026-10-05', acordada: '2026-11-02' },
      { dia: '2026-10-20', acordada: null },
    ]),
    'a las 4 semanas',
  );
  assert.equal(cuando.COPY_CUANDO.cicloAntes('a las 4 semanas'), 'La última vez acordaste revisar a las 4 semanas.');
  // El modelo no conoce nada de lo que registra la persona.
  assert.doesNotMatch(MODELO, /registeredIntakes|registeredExecutions|lastIntakeAt|lastExecutionAt|lastActivityAt/);
  assert.deepEqual([...MODELO.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]), ['@be/domain']);
});

test('TEST-TAG-034 · los textos de la pregunta pasan las listas de términos de Nutrición y de Entrenamiento', () => {
  const C = cuando.COPY_CUANDO;
  const textos = [
    C.pregunta,
    C.enSemanas(1, 'miércoles 11 nov'),
    C.enSemanas(4, 'miércoles 2 dic'),
    C.elegirUnaFecha,
    C.laFecha,
    C.sinFecha,
    C.yaEstaba,
    C.cicloAntes('a las 4 semanas'),
    C.efecto('REVISION', 'lunes 16 nov'),
    C.efecto('ACTIVAR', 'lunes 16 nov'),
    C.efectoSinFecha('ACTIVAR', true),
    C.efectoSinFecha('ACTIVAR', false),
    C.efectoSinFecha('REVISION', false),
    C.falta,
    C.faltaParaReprogramar,
    C.faltaLaFecha,
  ];
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeEntrenamientoEn(t), [], t);
    assert.deepEqual(terminosProhibidosDeCarteraEn(t), [], t);
    assert.doesNotMatch(t, /cumplimiento|adherencia|racha|px/i, t);
  }
});
