/**
 * ED-40 y ED-41 · Pedir información, compacto, e invitar o pedir el vínculo sin ambigüedad (WP-EDITORES-PROFESIONAL).
 * TEST-EDP-033 (lo enviado es lo marcado, con las partes plegadas o abiertas), TEST-EDP-034 (plegar no oculta una
 * obligatoria: la cuenta de cada parte las nombra), TEST-EDP-058 (el aviso de un pedido pendiente aparece antes de
 * enviar y no lo impide) y TEST-EDP-035 (ningún estado pendiente se dice como acceso).
 *
 * Uso: npm run test -w @be/web.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const P = await import('../src/app/pro/advisees/forms/partes-del-pedido.ts');
const V = await import('../src/app/pro/vinculo-en-palabras.ts');
const PEDIR = readFileSync(new URL('../src/app/pro/advisees/forms/pedir.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const campo = (fieldCode, showIf = null) => ({ fieldCode, showIf });
const comoComes = [campo('a'), campo('b'), campo('c', { fieldCode: 'b', anyOf: [true] })];
const habitos = [campo('d'), campo('e')];

test('TEST-EDP-034 · la cuenta de cada parte dice lo pedido, las obligatorias y lo que se suma si corresponde', () => {
  const c = P.cuentaDeLaParte(comoComes, ['a', 'c', 'd'], ['a', 'b', 'd']);
  assert.deepEqual(c, { total: 3, pedidas: 2, obligatorias: 1, condicionales: 1 });
  assert.equal(P.cuentaEnPalabras(c), '2 de 3 pedidas · 1 obligatoria · 1 que se suma si corresponde');
  // Una obligatoria sin pedir no cuenta como obligatoria: lo que sale es lo pedido.
  assert.equal(P.cuentaEnPalabras(P.cuentaDeLaParte(comoComes, [], ['a'])), '0 de 3 pedidas');
  assert.equal(P.cuentaEnPalabras({ total: 12, pedidas: 12, obligatorias: 3, condicionales: 2 }), '12 de 12 pedidas · 3 obligatorias · 2 que se suman si corresponde');
});

test('TEST-EDP-033 · «Pedir todas» y «Ninguna» tocan solo su parte, sin repetir ni reordenar lo de las otras', () => {
  const pedidas = ['d', 'a'];
  assert.deepEqual(P.pedirTodas(pedidas, comoComes), ['d', 'a', 'b', 'c']);
  assert.deepEqual(P.ninguna(['d', 'a', 'b', 'e'], comoComes), ['d', 'e']);
  assert.deepEqual(P.ninguna(P.pedirTodas(pedidas, habitos), habitos), ['a']);
  // Plegar no cambia lo que se envía: lo enviado sale de lo pedido, no de lo que se ve.
  assert.match(PEDIR, /requestedFieldCodes: elegidas,/);
  assert.match(PEDIR, /const elegidas = preguntas\.map\(\(c\) => c\.fieldCode\)\.filter\(\(c\) => pedidas\.includes\(c\)\);/);
  // Con algo por completar en las preguntas, todas se abren: el foco tiene que llegar a lo que falta.
  assert.match(PEDIR, /partesAbiertas\.has\(codigo\) \|\| !!faltas\.preguntas/);
});

test('ED-40 · el resumen junto al botón y lo que le llega a la persona', () => {
  assert.equal(P.resumenDelPedido(49, 19, 'Nutrición'), 'Vas a pedir 49 preguntas (19 obligatorias) para Nutrición. Pedir no amplía tu acceso.');
  assert.equal(P.resumenDelPedido(1, 0, null), 'Vas a pedir 1 pregunta (ninguna obligatoria). Pedir no amplía tu acceso.');
  assert.equal(
    P.loQueLeLlega('Camila', 'Cómo comés hoy', 49, 6),
    'Lo que le llega a Camila: «Cómo comés hoy», con 49 preguntas en 6 partes y el para qué que escribas. Lo ve al abrir «Información» en su teléfono.',
  );
  assert.doesNotMatch(P.loQueLeLlega(null, 'X', 2, 1), /partes|aviso|notificaci/);
});

test('TEST-EDP-058 · el pedido pendiente del mismo formulario se avisa antes de enviar, sin impedirlo', () => {
  const s = (templateId, status, createdAt) => ({ templateId, templateName: templateId === 't1' ? 'Cómo comés hoy' : 'Otro', status, createdAt });
  const enviadas = [s('t1', 'RESPONDED', '2026-11-01T10:00:00Z'), s('t1', 'PENDING', '2026-11-03T10:00:00Z'), s('t1', 'PENDING', '2026-11-05T10:00:00Z'), s('t2', 'PENDING', '2026-11-06T10:00:00Z')];
  assert.equal(P.pedidoPendiente(enviadas, 't1').createdAt, '2026-11-05T10:00:00Z');
  assert.equal(P.pedidoPendiente(enviadas.slice(0, 1), 't1'), null);
  assert.equal(P.pedidoPendiente(enviadas, 't3'), null);
  assert.equal(P.avisoDelPendiente('Cómo comés hoy', '5/11'), 'Ya hay un pedido de «Cómo comés hoy» del 5/11 que todavía no respondió. Podés enviar otro igual.');
  // Se dice junto al botón, y el botón no depende del aviso.
  assert.match(PEDIR, /data-pedido-pendiente/);
  const boton = PEDIR.slice(PEDIR.indexOf('data-enviar') - 400, PEDIR.indexOf('data-enviar'));
  assert.doesNotMatch(boton, /pendiente/);
});

test('TEST-EDP-035 · ningún estado pendiente se dice como acceso; aceptar tampoco abre los datos', () => {
  assert.equal(V.ESTADO_DE_LA_INVITACION.PENDING, 'Invitación creada · todavía no la usó');
  assert.equal(V.estadoDeLaSolicitud('PENDIENTE', 'Camila'), 'Pendiente de respuesta de Camila');
  for (const t of [V.ESTADO_DE_LA_INVITACION.PENDING, V.estadoDeLaSolicitud('PENDIENTE', 'Camila'), V.estadoDeLaSolicitud('PENDIENTE', null)]) {
    assert.doesNotMatch(t, /acceso|accede|ve sus datos|vinculad|asesorad/i, t);
  }
  // Donde se nombra el acceso, es para decir que lo decide la persona.
  for (const t of [V.ESTADO_DE_LA_INVITACION.USED, V.estadoDeLaSolicitud('ACEPTADA', 'Camila')]) assert.match(t, /el acceso a sus datos lo decide la persona/);
  assert.equal(V.ENTRADAS_DEL_VINCULO.invitar.subtitulo, 'enlace, QR o código');
  assert.equal(V.ENTRADAS_DEL_VINCULO.pedir.subtitulo, 'con su identificador');
});

test('ED-41 · el vencimiento con fecha y hora, en la hora de Buenos Aires', () => {
  assert.equal(V.venceElDiaYHora('2026-11-19T17:30:00Z'), 'Vence el 19 de noviembre a las 14:30.');
  assert.equal(V.venceElDiaYHora('2026-11-20T02:05:00Z'), 'Vence el 19 de noviembre a las 23:05.');
});
