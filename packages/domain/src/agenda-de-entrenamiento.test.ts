/**
 * WP-AGENDA-DE-ENTRENAMIENTO (DL-137): el calendario, qué registro resuelve cada fecha prevista y qué queda pendiente
 * (`agenda-de-entrenamiento.ts`). El plan de ejemplo es el de Dirección: torso el lunes, piernas el miércoles y cuerpo
 * completo el viernes, desde el lunes 19 de octubre de 2026.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  agendaDelDia,
  diaDeLaSemana,
  fechasPrevistas,
  pendientesParaRecordar,
  problemasDeAgenda,
  resolverFechasPrevistas,
  type EjecucionParaLaAgenda,
} from './agenda-de-entrenamiento';
import type { AgendaDeEntrenamiento } from './contratos-entrenamiento';

const AGENDA: AgendaDeEntrenamiento = {
  startDate: '2026-10-19',
  sessions: [
    { sessionId: 'torso', weekdays: ['MONDAY'] },
    { sessionId: 'piernas', weekdays: ['WEDNESDAY'] },
    { sessionId: 'completo', weekdays: ['FRIDAY'] },
  ],
  moves: [],
};
const SESIONES = new Set(['torso', 'piernas', 'completo', 'movilidad']);
const hecha = (sessionId: string, date: string, condition: EjecucionParaLaAgenda['condition'] = 'COMPLETED'): EjecucionParaLaAgenda => ({ sessionId, date, condition });
const fechas = (xs: readonly { sessionId: string; date: string }[]) => xs.map((x) => `${x.date} ${x.sessionId}`);

test('el día de la semana sale del calendario, con el lunes primero', () => {
  assert.equal(diaDeLaSemana('2026-10-19'), 'MONDAY');
  assert.equal(diaDeLaSemana('2026-10-21'), 'WEDNESDAY');
  assert.equal(diaDeLaSemana('2026-10-25'), 'SUNDAY');
  assert.equal(diaDeLaSemana('2028-02-29'), 'TUESDAY');
});

test('las fechas exactas salen de la fecha de inicio y los días; nada antes del inicio', () => {
  assert.deepEqual(fechas(fechasPrevistas(AGENDA, '2026-10-12', '2026-10-31')), [
    '2026-10-19 torso',
    '2026-10-21 piernas',
    '2026-10-23 completo',
    '2026-10-26 torso',
    '2026-10-28 piernas',
    '2026-10-30 completo',
  ]);
  // Dos sesiones el mismo día van en el orden de la agenda.
  const doble: AgendaDeEntrenamiento = { ...AGENDA, sessions: [...AGENDA.sessions, { sessionId: 'movilidad', weekdays: ['MONDAY', 'FRIDAY'] }] };
  assert.deepEqual(fechas(fechasPrevistas(doble, '2026-10-19', '2026-10-19')), ['2026-10-19 torso', '2026-10-19 movilidad']);
});

test('el profesional mueve una fecha suelta: deja de estar en la original y aparece en la nueva', () => {
  const movida: AgendaDeEntrenamiento = { ...AGENDA, moves: [{ sessionId: 'piernas', from: '2026-10-21', to: '2026-10-22' }] };
  assert.deepEqual(fechas(fechasPrevistas(movida, '2026-10-19', '2026-10-25')), ['2026-10-19 torso', '2026-10-22 piernas', '2026-10-23 completo']);
  // La semana siguiente sigue con su miércoles: el movimiento es de una sola fecha.
  assert.deepEqual(fechas(fechasPrevistas(movida, '2026-10-26', '2026-10-30')), ['2026-10-26 torso', '2026-10-28 piernas', '2026-10-30 completo']);
});

test('una agenda que no se puede guardar dice por qué, con la ruta del campo', () => {
  assert.deepEqual(problemasDeAgenda(AGENDA, SESIONES), []);
  const mala: AgendaDeEntrenamiento = {
    startDate: '2026-10-19',
    sessions: [
      { sessionId: 'torso', weekdays: ['MONDAY', 'MONDAY'] },
      { sessionId: 'torso', weekdays: ['TUESDAY'] },
      { sessionId: 'fantasma', weekdays: ['FRIDAY'] },
    ],
    moves: [
      { sessionId: 'torso', from: '2026-10-20', to: '2026-10-22' },
      { sessionId: 'torso', from: '2026-10-19', to: '2026-10-18' },
      { sessionId: 'torso', from: '2026-10-19', to: '2026-10-20' },
    ],
  };
  assert.deepEqual(
    problemasDeAgenda(mala, SESIONES).map((p) => `${p.code} ${p.path}`),
    [
      'AGENDA_WEEKDAY_DUPLICATED agenda.sessions[0].weekdays',
      'AGENDA_SESSION_DUPLICATED agenda.sessions[1].sessionId',
      'AGENDA_SESSION_UNKNOWN agenda.sessions[2].sessionId',
      // El martes 20 no es una fecha prevista de torso (la primera entrada manda: los lunes).
      'AGENDA_MOVE_NOT_PLANNED agenda.moves[0].from',
      'AGENDA_MOVE_BEFORE_START agenda.moves[1].to',
      'AGENDA_MOVE_DUPLICATED agenda.moves[2].from',
    ],
  );
  // Mover piernas a otro miércoles en el que ya va es un choque.
  const choque: AgendaDeEntrenamiento = { ...AGENDA, moves: [{ sessionId: 'piernas', from: '2026-10-21', to: '2026-10-28' }] };
  assert.deepEqual(problemasDeAgenda(choque, SESIONES).map((p) => p.code), ['AGENDA_MOVE_COLLISION']);
});

test('cada fecha prevista se resuelve con la ejecución que le corresponde, aunque sea otro día', () => {
  const previstas = fechasPrevistas(AGENDA, '2026-10-19', '2026-10-30');
  const r = resolverFechasPrevistas(previstas, [
    hecha('torso', '2026-10-19'),
    // Piernas del miércoles 21, hecha el jueves 22: la resuelve («lo voy a pasar para mañana»).
    hecha('piernas', '2026-10-22'),
    // Cuerpo completo del viernes 23, salteada a propósito: la resuelve la «no realizada» explícita.
    hecha('completo', '2026-10-23', 'NOT_COMPLETED'),
    // Torso del lunes 26 adelantado al domingo 25: después del lunes 19, antes del 26.
    hecha('torso', '2026-10-25'),
  ]);
  assert.deepEqual(
    r.map((p) => `${p.date} ${p.sessionId} ← ${p.resolvedBy ? `${p.resolvedBy.date} ${p.resolvedBy.condition}` : 'sin registro'}`),
    [
      '2026-10-19 torso ← 2026-10-19 COMPLETED',
      '2026-10-21 piernas ← 2026-10-22 COMPLETED',
      '2026-10-23 completo ← 2026-10-23 NOT_COMPLETED',
      '2026-10-26 torso ← 2026-10-25 COMPLETED',
      '2026-10-28 piernas ← sin registro',
      '2026-10-30 completo ← sin registro',
    ],
  );
});

test('una ejecución resuelve una sola fecha, y la ausencia de registro nunca es «no realizada»', () => {
  const previstas = fechasPrevistas(AGENDA, '2026-10-19', '2026-10-28');
  // Una sola de piernas, el miércoles 21: no puede resolver también la del 28.
  const r = resolverFechasPrevistas(previstas, [hecha('piernas', '2026-10-21')]);
  assert.deepEqual(r.filter((p) => p.sessionId === 'piernas').map((p) => p.resolvedBy?.date ?? null), ['2026-10-21', null]);
  // Sin ninguna ejecución, todo queda sin registro: nada se infiere.
  assert.ok(resolverFechasPrevistas(previstas, []).every((p) => p.resolvedBy === null));
});

test('«Hoy» muestra lo previsto para el día y lo pendiente; una pendiente se recuerda dos días y se ve una semana', () => {
  // El viernes 23: hoy toca cuerpo completo; piernas del miércoles quedó sin registro.
  const viernes = agendaDelDia(AGENDA, [hecha('torso', '2026-10-19')], '2026-10-23', '2026-10-19');
  assert.deepEqual(fechas(viernes.hoy), ['2026-10-23 completo']);
  assert.deepEqual(fechas(viernes.pendientes), ['2026-10-21 piernas']);
  assert.deepEqual(fechas(pendientesParaRecordar(viernes, '2026-10-23')), ['2026-10-21 piernas']);
  // El sábado 24 se sigue viendo, pero el aviso ya no insiste: pasaron tres días.
  const sabado = agendaDelDia(AGENDA, [hecha('torso', '2026-10-19')], '2026-10-24', '2026-10-19');
  assert.deepEqual(fechas(sabado.pendientes), ['2026-10-21 piernas', '2026-10-23 completo']);
  assert.deepEqual(fechas(pendientesParaRecordar(sabado, '2026-10-24')), ['2026-10-23 completo']);
  // El miércoles 28 vuelve a tocar piernas: la vieja deja su lugar a la de hoy.
  const miercoles = agendaDelDia(AGENDA, [hecha('torso', '2026-10-19'), hecha('torso', '2026-10-26'), hecha('completo', '2026-10-23')], '2026-10-28', '2026-10-19');
  assert.deepEqual(fechas(miercoles.hoy), ['2026-10-28 piernas']);
  assert.deepEqual(fechas(miercoles.pendientes), []);
  // Antes de que la versión empiece a regir no había nada previsto.
  assert.deepEqual(fechas(agendaDelDia(AGENDA, [], '2026-10-23', '2026-10-22').pendientes), []);
});

test('lo que viene es la semana siguiente sin lo ya hecho; una sesión del plan anterior no adelanta el nuevo', () => {
  // El sábado 24, con el torso del lunes 19 hecho: el de hoy adelanta el del lunes 26, que ya no está entre lo que viene.
  const sabado = agendaDelDia(AGENDA, [hecha('torso', '2026-10-19'), hecha('torso', '2026-10-24')], '2026-10-24', '2026-10-19');
  assert.deepEqual(fechas(sabado.proximas), ['2026-10-28 piernas', '2026-10-30 completo']);
  // Sin el del lunes 19, el de hoy primero pone al día ese (D-4: hecha después resuelve antes que adelantada).
  const atrasada = agendaDelDia(AGENDA, [hecha('torso', '2026-10-24')], '2026-10-24', '2026-10-19');
  assert.deepEqual(fechas(atrasada.proximas), ['2026-10-26 torso', '2026-10-28 piernas', '2026-10-30 completo']);
  // La versión nueva rige desde el viernes 23: el torso del miércoles 21, con la anterior, no resuelve el lunes 26.
  const nueva = agendaDelDia(AGENDA, [hecha('torso', '2026-10-21')], '2026-10-24', '2026-10-23');
  assert.deepEqual(fechas(nueva.proximas), ['2026-10-26 torso', '2026-10-28 piernas', '2026-10-30 completo']);
  // La resolución conserva la ejecución entera, con lo que la API le haya sumado.
  const conId = agendaDelDia(AGENDA, [{ ...hecha('torso', '2026-10-19'), executionId: 'x-1' }], '2026-10-19', '2026-10-19');
  assert.equal(conId.hoy[0]?.resolvedBy?.executionId, 'x-1');
});
