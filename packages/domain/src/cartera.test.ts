/** Cartera del profesional (`cartera.ts`): clasificación por fechas civiles, orden por urgencia y copy sin juicios. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clasificarRevision, COPY_CARTERA, compararPendientes, ordenarPendientes, terminosProhibidosDeCarteraEn, TIPOS_DE_PENDIENTE, URGENCIA_DE_PENDIENTE } from './cartera';

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
});
