/**
 * La evidencia de una revisión (pasada del 2026-10-09; `apps/web/src/app/pro/advisees/evidencia.ts`): agrupada por día,
 * con selección explícita por grupo, sin nada marcado al abrir y con las mismas referencias individuales de siempre. Con
 * la parte 10 de WP-ESCRITORIO-AREAS: los días del período, lo que dice cada día y lo marcado al cambiar el período.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { avisoDeMarcasQuitadas, cuantas, cuentaDelDia, diasDelPeriodo, estadoDelGrupo, estadoDichoDelGrupo, marcar, marcasDelPeriodoNuevo, porDia, referenciasMarcadas, resumenDeLoMarcado, versionesDelPlan } = await import(
  '../apps/web/src/app/pro/advisees/evidencia.ts'
);

const COMIDAS = ['comida', 'comidas'];
const comida = (id, dia, hora = '08:10') => ({ tipo: 'EXECUTION', id, dia, texto: `${hora} · Comida del plan` });
const CANDIDATAS = [
  comida('c3', '2026-10-06'),
  comida('c1', '2026-10-05', '08:10'),
  comida('c2', '2026-10-05', '13:00'),
  comida('c4', '2026-10-06', '13:00'),
  comida('c5', '2026-10-06', '21:00'),
  { tipo: 'PLAN_VERSION', id: 'p1', dia: null, texto: 'Plan activado el 1 sept 2026' },
  { tipo: 'OBJECTIVE_VERSION', id: 'o1', dia: null, texto: 'Objetivo vigente' },
];

test('al abrir no hay nada marcado, y el resumen lo dice', () => {
  const ninguna = new Set();
  assert.equal(resumenDeLoMarcado(CANDIDATAS, ninguna, COMIDAS), 'Todavía no marcaste nada.');
  assert.deepEqual(referenciasMarcadas(CANDIDATAS, ninguna), []);
});

test('los registros se agrupan por día, del primero al último; la planificación y el objetivo quedan aparte', () => {
  const dias = porDia(CANDIDATAS);
  assert.deepEqual(dias.map(([d, items]) => [d, items.map((c) => c.id)]), [
    ['2026-10-05', ['c1', 'c2']],
    ['2026-10-06', ['c3', 'c4', 'c5']],
  ]);
  assert.equal(cuantas(3, COMIDAS), 'las 3 comidas');
  assert.equal(cuantas(1, ['sesión', 'sesiones']), 'la sesión');
});

test('marcar un día marca cada uno de sus registros y nada más; desmarcarlo saca solo esos', () => {
  const [, delSeis] = porDia(CANDIDATAS)[1];
  const conElSeis = marcar(new Set(['p1']), delSeis.map((c) => c.id), true);
  assert.deepEqual([...conElSeis].sort(), ['c3', 'c4', 'c5', 'p1']);
  assert.deepEqual(estadoDelGrupo(delSeis.map((c) => c.id), conElSeis), { marcadas: 3, todas: true, mixto: false });
  // Se puede cambiar uno por uno: el grupo queda en estado mixto.
  const sinUna = marcar(conElSeis, ['c4'], false);
  assert.deepEqual(estadoDelGrupo(delSeis.map((c) => c.id), sinUna), { marcadas: 2, todas: false, mixto: true });
  assert.deepEqual([...marcar(sinUna, delSeis.map((c) => c.id), false)], ['p1']);
});

test('el resumen dice lo marcado, no lo examinado; lo que viaja son las referencias individuales de siempre', () => {
  const elegidas = new Set(['c1', 'c3', 'c4', 'p1', 'o1']);
  const resumen = resumenDeLoMarcado(CANDIDATAS, elegidas, COMIDAS);
  assert.equal(resumen, 'Marcaste 5 de 7: 3 comidas de 2 días, 1 versión del plan y el objetivo.');
  assert.doesNotMatch(resumen, /examin/i, 'marcar no se presenta como haber examinado');
  assert.deepEqual(referenciasMarcadas(CANDIDATAS, elegidas), [
    { type: 'EXECUTION', id: 'c3' },
    { type: 'EXECUTION', id: 'c1' },
    { type: 'EXECUTION', id: 'c4' },
    { type: 'PLAN_VERSION', id: 'p1' },
    { type: 'OBJECTIVE_VERSION', id: 'o1' },
  ]);
  assert.equal(resumenDeLoMarcado(CANDIDATAS, new Set(['c2']), COMIDAS), 'Marcaste 1 de 7: 1 comida de 1 día.');
});

test('los días del período van todos, del primero al último, contando los dos extremos (también los que no tienen registros)', () => {
  assert.deepEqual(diasDelPeriodo('2026-09-29', '2026-10-02'), ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']);
  assert.deepEqual(diasDelPeriodo('2026-10-05', '2026-10-05'), ['2026-10-05']);
  assert.deepEqual(diasDelPeriodo('2028-02-28', '2028-03-01'), ['2028-02-28', '2028-02-29', '2028-03-01'], 'un año bisiesto');
  assert.equal(diasDelPeriodo('2026-07-15', '2026-10-14').length, 92, 'el período más largo de una revisión');
  assert.deepEqual(diasDelPeriodo('2026-10-06', '2026-10-05'), [], 'un período al revés no arma días');
  assert.deepEqual(diasDelPeriodo('', '2026-10-05'), []);
});

test('cada día dice cuántos registros tiene y, con una parte marcada, cuántos de ellos', () => {
  assert.equal(cuentaDelDia(3, 0, COMIDAS), '3 comidas');
  assert.equal(cuentaDelDia(1, 0, COMIDAS), '1 comida');
  assert.equal(cuentaDelDia(4, 2, COMIDAS), '2 de 4 comidas');
  assert.equal(cuentaDelDia(4, 4, COMIDAS), '4 comidas', 'todo marcado lo dice la casilla, no la cuenta');
  assert.equal(cuentaDelDia(1, 0, ['sesión', 'sesiones']), '1 sesión');
  assert.equal(estadoDichoDelGrupo(0, 3), 'sin marcar');
  assert.equal(estadoDichoDelGrupo(3, 3), 'todas marcadas');
  assert.equal(estadoDichoDelGrupo(1, 4), '1 de 4 marcadas');
});

test('al cambiar el período se quita solo lo marcado que quedó afuera, y se dice cuánto', () => {
  // El período nuevo ya no tiene el día 5 (c1 y c2), y sigue la misma versión del plan.
  const nuevas = CANDIDATAS.filter((c) => c.dia !== '2026-10-05');
  const { quedan, quitadas } = marcasDelPeriodoNuevo(new Set(['c1', 'c3', 'p1']), nuevas);
  assert.deepEqual([...quedan].sort(), ['c3', 'p1']);
  assert.equal(quitadas, 1);
  const igual = marcasDelPeriodoNuevo(new Set(['c3', 'o1']), nuevas);
  assert.deepEqual([...igual.quedan].sort(), ['c3', 'o1']);
  assert.equal(igual.quitadas, 0, 'si nada quedó afuera, no se quita nada');
  assert.equal(avisoDeMarcasQuitadas(1), 'Con el período nuevo se quitó 1 marca de lo que quedó afuera. Lo demás sigue marcado y lo que escribiste no cambió.');
  assert.match(avisoDeMarcasQuitadas(3), /^Con el período nuevo se quitaron 3 marcas /);
});

test('las versiones del plan se dicen por su fecha de activación; dos del mismo día, con la hora', () => {
  const textos = versionesDelPlan([
    { planId: 'p1', dia: '7 sept', hora: '09:00' },
    { planId: 'p2', dia: '15 oct', hora: '10:32' },
    { planId: 'p3', dia: '15 oct', hora: '18:05' },
  ]);
  assert.deepEqual(
    textos.map((c) => [c.tipo, c.id, c.dia, c.texto]),
    [
      ['PLAN_VERSION', 'p1', null, 'Plan activado el 7 sept'],
      ['PLAN_VERSION', 'p2', null, 'Plan activado el 15 oct, 10:32'],
      ['PLAN_VERSION', 'p3', null, 'Plan activado el 15 oct, 18:05'],
    ],
  );
  assert.deepEqual(versionesDelPlan([]), []);
});
