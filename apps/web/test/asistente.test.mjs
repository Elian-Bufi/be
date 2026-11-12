/**
 * ED-14, ED-16 y ED-20 · El asistente de Entrenamiento y las entradas desde la ficha (WP-EDITORES-PROFESIONAL).
 * Lo que tiene lógica se prueba sin React (`asistente/paso-que-sigue.ts`, `accion-de-la-ficha.ts`); del editor se lee la
 * fuente.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const P = await import('../src/app/pro/advisees/asistente/paso-que-sigue.ts');
const F = await import('../src/app/pro/advisees/accion-de-la-ficha.ts');

const leer = (ruta) => readFileSync(new URL(`../src/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const EDITOR = leer('app/pro/advisees/training/editor.tsx');
const PLAN = leer('app/pro/advisees/training/plan.tsx');

const serie = (repetitions) => ({ repetitions });
const prescrita = { exerciseVersionId: 'e1', sets: [serie({ value: 8 }), serie({ value: 8 })], intensity: { criterion: 'RIR', value: 2 } };
const sinPrescribir = { exerciseVersionId: 'e2', sets: [serie(null)], intensity: null };
const sesion = (id, prescriptions) => ({ sessionId: id, label: id, instructions: null, prescriptions });
const bloque = (sessions) => [{ label: 'Bloque 1', sessions }];
const agenda = (...ids) => ({ startDate: '2026-11-16', sessions: ids.map((sessionId) => ({ sessionId, weekdays: ['MONDAY'] })), moves: [] });

test('ED-14 · el paso que sigue se deduce del borrador, un caso por paso', () => {
  assert.equal(P.pasoQueSigue(bloque([]), null), 2);
  assert.equal(P.pasoQueSigue(bloque([sesion('a', [])]), null), 3);
  assert.equal(P.pasoQueSigue(bloque([sesion('a', [sinPrescribir])]), null), 4);
  assert.equal(P.pasoQueSigue(bloque([sesion('a', [prescrita]), sesion('b', [prescrita])]), agenda('a')), 5);
  assert.equal(P.pasoQueSigue(bloque([sesion('a', [prescrita]), sesion('b', [prescrita])]), agenda('a', 'b')), 6);
  // Una sola sesión sin días no pide el paso 5: la persona la hace cuando quiere.
  assert.equal(P.pasoQueSigue(bloque([sesion('a', [prescrita])]), null), 6);
  // Las sesiones de un microciclo también cuentan.
  assert.equal(P.pasoQueSigue([{ label: 'B', microcycles: [{ label: 'Semana 1', sessions: [sesion('a', [])] }] }], null), 3);
});

test('ED-14 · borradores mezclados: sesiones con y sin ejercicios, series con valores propios y días sin asignar', () => {
  const propia = { ...prescrita, sets: [{ repetitions: { value: 8 }, rest: { seconds: 120 }, note: 'propia' }, serie({ value: 10 })] };
  const mezclado = bloque([sesion('a', [propia]), sesion('b', []), sesion('c', [sinPrescribir])]);
  // Lo primero que falta manda: una sesión sin ejercicios.
  assert.equal(P.pasoQueSigue(mezclado, null), 3);
  const antes = structuredClone(mezclado);
  P.pasoQueSigue(mezclado, agenda('a'));
  // Deducir no toca el borrador.
  assert.deepEqual(mezclado, antes);
  // El paso pedido en la dirección: del 1 al 7, nada más.
  assert.deepEqual(['1', '4', '7', '0', '8', 'x', null].map(P.pasoPedido), [1, 4, 7, null, null, null, null]);
});

test('TEST-EDP-017 · «Siguiente» nunca avanza sin la respuesta del servidor', async () => {
  const orden = [];
  let soltar;
  const guardar = () => new Promise((r) => (soltar = r)).then((v) => (orden.push('respondio'), v));
  const avance = P.sePuedeAvanzar({ sucio: true, guardando: false, guardar }).then((v) => (orden.push('decide'), v));
  // Hasta que responde el servidor, no se decide.
  await Promise.resolve();
  assert.deepEqual(orden, []);
  soltar({ version: 2 });
  assert.equal(await avance, true);
  assert.deepEqual(orden, ['respondio', 'decide']);
  // Si el guardado falla (o no se pudo intentar), no avanza.
  assert.equal(await P.sePuedeAvanzar({ sucio: true, guardando: false, guardar: async () => null }), false);
  // Mientras viaja otro guardado, espera.
  let llamado = false;
  assert.equal(await P.sePuedeAvanzar({ sucio: true, guardando: true, guardar: async () => ((llamado = true), {}) }), false);
  assert.equal(llamado, false);
  // Sin cambios, avanza sin escribir nada (TEST-EDP-055).
  assert.equal(await P.sePuedeAvanzar({ sucio: false, guardando: false, guardar: async () => ((llamado = true), {}) }), true);
  assert.equal(llamado, false);
  // El editor usa esta regla; cambiar el punto de partida pide confirmar (el cuadro del descarte, TB-47).
  assert.match(EDITOR, /sePuedeAvanzar\(\{ sucio, guardando, guardar: \(\) => guardar\(\) \}\)/);
  assert.match(EDITOR, /if \(!puede\) return setNoAvanzo\(true\);/);
  assert.match(EDITOR, /case 1:[\s\S]{0,400}setDescartar\(true\)/);
});

test('TEST-EDP-021 y TEST-EDP-055 · el asistente escribe con las operaciones de la estación y solo lo que toca', () => {
  const pasos = EDITOR.slice(EDITOR.indexOf('const contenidoDelPaso'), EDITOR.indexOf('const asistente = pasoDelAsistente'));
  assert.ok(pasos.length > 1000);
  // Ningún paso arma el borrador de nuevo: escribe con `cambiar` (o la agenda con los chips de la estación).
  assert.doesNotMatch(pasos, /setBloques\(/);
  assert.doesNotMatch(pasos, /setAgenda\(/);
  // Cada escritura toca un campo: el nombre de una sesión, una sesión nueva o la prescripción de un ejercicio.
  const escrituras = [...pasos.matchAll(/cambiar\(\((\w+)\) => \(([^;]*?), \1\)\)/g)].map((m) => m[2]);
  assert.deepEqual(escrituras, ['(lasSesiones(x)[n]!.label = e.target.value)', 'lasSesiones(x).push(sesionVacia(sesiones.length + 1))', '(lasSesiones(b)[n]!.prescriptions[l] = nueva)']);
  // Los días, con los mismos chips que la estación.
  assert.match(pasos, /chipsDeDias\(s, n\)/);
  assert.equal((EDITOR.match(/chipsDeDias\(s, n\)/g) ?? []).length, 2);
});

test('TEST-EDP-019 · la acción del plan sale del estado del área, un caso por estado', () => {
  assert.deepEqual(F.accionDelPlan(null), { tipo: 'crear', texto: 'Crear el plan', extra: '&asistente=1' });
  assert.deepEqual(F.accionDelPlan({ activePlan: null, draftPlan: null }), { tipo: 'crear', texto: 'Crear el plan', extra: '&asistente=1' });
  assert.deepEqual(F.accionDelPlan({ activePlan: { planVersionId: 'v' }, draftPlan: null }), { tipo: 'ajustar', texto: 'Ajustar el plan', extra: '&crear=vigente' });
  assert.equal(F.accionDelPlan({ activePlan: { planVersionId: 'v' }, draftPlan: { planVersionId: 'b' } }).tipo, 'seguir');
  assert.equal(F.accionDelPlan({ activePlan: null, draftPlan: { planVersionId: 'b' } }).tipo, 'seguir');
  // «Ajustar el plan» crea la versión una sola vez por llegada, y con un borrador lo abre sin crear otro.
  assert.match(PLAN, /ajusteHecho\.current = true;/);
  assert.match(PLAN, /versiones\.some\(\(v\) => v\.state === 'DRAFT'\)[^\n]*return ir\(\{ crear: null \}\)/);
});
