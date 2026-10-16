/** Cartera del profesional (`cartera.ts`): clasificación por fechas civiles, orden por urgencia y copy sin juicios. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  clasificarRevision,
  contarPendientesPorVista,
  COPY_CARTERA,
  compararPendientes,
  filtrarPendientes,
  filtroDeLaVistaDePendientes,
  ordenarPendientes,
  terminosProhibidosDeCarteraEn,
  TIPOS_DE_LA_VISTA_DE_PENDIENTES,
  TIPOS_DE_PENDIENTE,
  URGENCIA_DE_PENDIENTE,
  VISTAS_DE_PENDIENTES,
  vistaDeLosFiltrosDePendientes,
  type PendienteFiltrable,
} from './cartera';

test('una expectativa de revisión se clasifica por fechas civiles: vencida, próxima (hasta 7 días), sin fecha, o todavía no', () => {
  assert.deepEqual(clasificarRevision('2026-09-27', '2026-09-30'), { kind: 'REVIEW_OVERDUE', dias: 3 });
  assert.deepEqual(clasificarRevision('2026-09-30', '2026-09-30'), { kind: 'REVIEW_DUE_SOON', dias: 0 }, 'hoy es próxima, no vencida');
  assert.deepEqual(clasificarRevision('2026-10-07', '2026-09-30'), { kind: 'REVIEW_DUE_SOON', dias: 7 }, 'el día 7 entra en la ventana');
  assert.deepEqual(clasificarRevision('2026-10-08', '2026-09-30'), { kind: null, dias: null }, 'el día 8 todavía no es un pendiente');
  assert.deepEqual(clasificarRevision(null, '2026-09-30'), { kind: 'REVIEW_UNDATED', dias: null }, 'sin fecha nunca vence');
  // Cambio de mes y de año: aritmética de calendario, no de milisegundos.
  assert.deepEqual(clasificarRevision('2025-12-31', '2026-01-02'), { kind: 'REVIEW_OVERDUE', dias: 2 });
  assert.deepEqual(clasificarRevision('2026-10-03', '2026-09-30', 3), { kind: 'REVIEW_DUE_SOON', dias: 3 }, 'la ventana es un parámetro');
});

test('el orden es por urgencia objetiva, con más atraso primero y lo más antiguo primero; estable por asesorado', () => {
  const filas = [
    { kind: 'FORM_REQUEST_OPEN' as const, since: '2026-09-01', daysOverdue: null, adviseeId: 'b' },
    { kind: 'REVIEW_OVERDUE' as const, since: '2026-09-20', daysOverdue: 10, adviseeId: 'c' },
    { kind: 'REVIEW_OVERDUE' as const, since: '2026-09-27', daysOverdue: 3, adviseeId: 'a' },
    { kind: 'PLAN_DRAFT_PENDING' as const, since: '2026-09-10', daysOverdue: null, adviseeId: 'a' },
    { kind: 'PLAN_DRAFT_PENDING' as const, since: '2026-09-05', daysOverdue: null, adviseeId: 'z' },
    { kind: 'REVIEW_UNDATED' as const, since: null, daysOverdue: null, adviseeId: 'b' },
    { kind: 'REVIEW_UNDATED' as const, since: null, daysOverdue: null, adviseeId: 'a' },
  ];
  assert.deepEqual(
    ordenarPendientes(filas).map((f) => `${f.kind}:${f.adviseeId}`),
    ['REVIEW_OVERDUE:c', 'REVIEW_OVERDUE:a', 'REVIEW_UNDATED:a', 'REVIEW_UNDATED:b', 'PLAN_DRAFT_PENDING:z', 'PLAN_DRAFT_PENDING:a', 'FORM_REQUEST_OPEN:b'],
  );
  assert.deepEqual(filas.map((f) => f.kind).slice(0, 2), ['FORM_REQUEST_OPEN', 'REVIEW_OVERDUE'], 'no muta la entrada');
  assert.equal(compararPendientes(filas[2]!, filas[2]!), 0);
  // Toda urgencia está definida y es única.
  assert.equal(new Set(TIPOS_DE_PENDIENTE.map((t) => URGENCIA_DE_PENDIENTE[t])).size, TIPOS_DE_PENDIENTE.length);
});

test('TEST-PRJ-009 · el copy de la cartera describe hechos fechados y no califica a nadie', () => {
  const p = COPY_CARTERA.pendiente;
  const textos: string[] = [
    ...(Object.values(COPY_CARTERA).filter((v) => typeof v === 'string') as string[]),
    ...Object.values(COPY_CARTERA.dominio),
    ...Object.values(COPY_CARTERA.tipo),
    ...Object.values(COPY_CARTERA.vista),
    p.REVIEW_OVERDUE(1),
    p.REVIEW_OVERDUE(12),
    p.REVIEW_DUE_SOON(0),
    p.REVIEW_DUE_SOON(1),
    p.REVIEW_DUE_SOON(7),
    p.REVIEW_UNDATED('3 sept 2026'),
    p.PLAN_DRAFT_PENDING('3 sept 2026'),
    p.NO_ACTIVE_PLAN(),
    p.FORM_REQUEST_OPEN('3 sept 2026'),
    p.ANTHRO_DRAFT_PENDING('3 sept 2026'),
    COPY_CARTERA.ultimoRegistro('3 sept 2026'),
  ];
  assert.deepEqual(textos.flatMap((t) => terminosProhibidosDeCarteraEn(t).map((x) => `${x} en «${t}»`)), []);
  assert.equal(p.REVIEW_OVERDUE(1), 'Revisión vencida hace 1 día');
  assert.equal(p.REVIEW_DUE_SOON(0), 'Revisión hoy');
  assert.deepEqual(terminosProhibidosDeCarteraEn('Asesorado inactivo, en riesgo'), ['inactivo', 'riesgo'], 'el control detecta lo propio de una lista de personas');
  // Las vistas tienen todas su nombre, y los nombres no se repiten.
  assert.deepEqual(Object.keys(COPY_CARTERA.vista), [...VISTAS_DE_PENDIENTES]);
  assert.equal(new Set(Object.values(COPY_CARTERA.vista)).size, VISTAS_DE_PENDIENTES.length);
});

// Una cartera con los siete tipos repartidos en las tres áreas, ya en el orden de la urgencia.
const CARTERA: readonly (PendienteFiltrable & { readonly quien: string })[] = [
  { kind: 'REVIEW_OVERDUE', domain: 'training', quien: 'b' },
  { kind: 'REVIEW_DUE_SOON', domain: 'nutrition', quien: 'a' },
  { kind: 'REVIEW_DUE_SOON', domain: 'training', quien: 'c' },
  { kind: 'REVIEW_UNDATED', domain: 'nutrition', quien: 'd' },
  { kind: 'PLAN_DRAFT_PENDING', domain: 'training', quien: 'a' },
  { kind: 'NO_ACTIVE_PLAN', domain: 'nutrition', quien: 'c' },
  { kind: 'FORM_REQUEST_OPEN', domain: 'nutrition', quien: 'e' },
  { kind: 'ANTHRO_DRAFT_PENDING', domain: 'anthropometry', quien: 'c' },
];

test('las vistas de «Pendientes» reparten los siete tipos: cada uno está en una vista y en una sola, y «Todo» los tiene a todos', () => {
  assert.deepEqual([...VISTAS_DE_PENDIENTES], ['TODO', 'REVISIONES', 'PLANES', 'FORMULARIOS', 'EVALUACIONES']);
  assert.deepEqual([...TIPOS_DE_LA_VISTA_DE_PENDIENTES.TODO], [...TIPOS_DE_PENDIENTE]);
  const repartidos = VISTAS_DE_PENDIENTES.filter((v) => v !== 'TODO').flatMap((v) => TIPOS_DE_LA_VISTA_DE_PENDIENTES[v]);
  assert.deepEqual([...repartidos].sort(), [...TIPOS_DE_PENDIENTE].sort(), 'ni falta ni se repite ninguno');
  // Dentro de cada vista, los tipos van en el orden de la urgencia: la vista no reordena nada.
  for (const v of VISTAS_DE_PENDIENTES) {
    const urgencias = TIPOS_DE_LA_VISTA_DE_PENDIENTES[v].map((t) => URGENCIA_DE_PENDIENTE[t]);
    assert.deepEqual(urgencias, [...urgencias].sort((a, b) => a - b), v);
  }
});

test('la cantidad que anuncia cada vista es la cantidad de filas que trae, y las cuatro vistas suman «Todo»', () => {
  const cuentas = contarPendientesPorVista(CARTERA);
  assert.deepEqual(cuentas, { TODO: 8, REVISIONES: 4, PLANES: 2, FORMULARIOS: 1, EVALUACIONES: 1 });
  assert.equal(cuentas.REVISIONES + cuentas.PLANES + cuentas.FORMULARIOS + cuentas.EVALUACIONES, cuentas.TODO);
  for (const v of VISTAS_DE_PENDIENTES) {
    const filas = filtrarPendientes(CARTERA, filtroDeLaVistaDePendientes(v));
    assert.equal(filas.length, cuentas[v], v);
    assert.ok(filas.every((f) => TIPOS_DE_LA_VISTA_DE_PENDIENTES[v].includes(f.kind)), v);
  }
  assert.deepEqual(contarPendientesPorVista([]), { TODO: 0, REVISIONES: 0, PLANES: 0, FORMULARIOS: 0, EVALUACIONES: 0 }, 'una cartera leída y vacía da ceros');
});

test('filtrar no reordena: las filas salen en el orden en que llegaron, y la entrada no cambia', () => {
  const quienes = (filas: readonly { readonly quien: string }[]) => filas.map((f) => f.quien).join('');
  assert.equal(quienes(filtrarPendientes(CARTERA, filtroDeLaVistaDePendientes('TODO'))), 'bacdacec');
  assert.equal(quienes(filtrarPendientes(CARTERA, filtroDeLaVistaDePendientes('REVISIONES'))), 'bacd');
  assert.equal(quienes(filtrarPendientes(CARTERA, { tipos: [], area: 'nutrition' })), 'adce', 'un área sola');
  assert.equal(quienes(filtrarPendientes(CARTERA, { tipos: ['REVIEW_DUE_SOON'], area: null })), 'ac', 'un tipo suelto');
  assert.equal(quienes(filtrarPendientes(CARTERA, { tipos: ['REVIEW_DUE_SOON', 'PLAN_DRAFT_PENDING'], area: 'training' })), 'ca', 'tipos y área se suman');
  assert.equal(quienes(filtrarPendientes(CARTERA, { tipos: ['FORM_REQUEST_OPEN'], area: 'training' })), '', 'lo que no coincide con nada da una lista vacía');
  assert.equal(CARTERA.length, 8);
});

test('una selección es una vista con nombre solo si son exactamente sus tipos y no hay un área', () => {
  for (const v of VISTAS_DE_PENDIENTES) assert.equal(vistaDeLosFiltrosDePendientes(filtroDeLaVistaDePendientes(v)), v);
  assert.equal(vistaDeLosFiltrosDePendientes({ tipos: [...TIPOS_DE_PENDIENTE], area: null }), 'TODO', 'los siete tipos, uno por uno, también son «Todo»');
  assert.equal(vistaDeLosFiltrosDePendientes({ tipos: ['REVIEW_UNDATED', 'REVIEW_OVERDUE', 'REVIEW_DUE_SOON'], area: null }), 'REVISIONES', 'el orden en que se eligieron no importa');
  assert.equal(vistaDeLosFiltrosDePendientes({ tipos: ['FORM_REQUEST_OPEN'], area: null }), 'FORMULARIOS', 'el único tipo de una vista es esa vista');
  assert.equal(vistaDeLosFiltrosDePendientes({ tipos: ['REVIEW_OVERDUE'], area: null }), null, 'una parte de una vista es una combinación a medida');
  assert.equal(vistaDeLosFiltrosDePendientes({ tipos: ['REVIEW_OVERDUE', 'REVIEW_DUE_SOON', 'NO_ACTIVE_PLAN'], area: null }), null, 'tres tipos que no son los de «Revisiones»');
  assert.equal(vistaDeLosFiltrosDePendientes({ tipos: [], area: 'nutrition' }), null, 'con un área, ninguna vista queda elegida');
  assert.equal(vistaDeLosFiltrosDePendientes({ tipos: ['FORM_REQUEST_OPEN'], area: 'nutrition' }), null);
});
