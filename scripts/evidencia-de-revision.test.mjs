/**
 * La evidencia de una revisión (pasada del 2026-10-09; `apps/web/src/app/pro/advisees/evidencia.ts`): agrupada por día,
 * con selección explícita por grupo, sin nada marcado al abrir y con las mismas referencias individuales de siempre.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { cuantas, estadoDelGrupo, marcar, porDia, referenciasMarcadas, resumenDeLoMarcado } = await import('../apps/web/src/app/pro/advisees/evidencia.ts');

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
