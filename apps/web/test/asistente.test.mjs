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
const O = await import('../src/app/pro/advisees/asistente/operaciones-del-asistente.ts');
const { aplicarPrescripcion, leerPrescripcion } = await import('@be/domain');

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
  assert.equal(await avance, 'avanza');
  assert.deepEqual(orden, ['respondio', 'decide']);
  // Si el guardado falla (o no se pudo intentar), no avanza.
  assert.equal(await P.sePuedeAvanzar({ sucio: true, guardando: false, guardar: async () => null }), 'no-avanza');
  // Mientras viaja otro guardado, espera (no es una falla: no dice «No se pudo guardar»).
  let llamado = false;
  assert.equal(await P.sePuedeAvanzar({ sucio: true, guardando: true, guardar: async () => ((llamado = true), {}) }), 'espera');
  assert.equal(llamado, false);
  // Sin cambios, avanza sin escribir nada (TEST-EDP-055).
  assert.equal(await P.sePuedeAvanzar({ sucio: false, guardando: false, guardar: async () => ((llamado = true), {}) }), 'avanza');
  assert.equal(llamado, false);
  // El editor usa esta regla; cambiar el punto de partida pide confirmar (el cuadro del descarte, TB-47).
  assert.match(EDITOR, /sePuedeAvanzar\(\{ sucio, guardando, guardar: \(\) => guardar\(\) \}\)/);
  assert.match(EDITOR, /if \(decision === 'espera'\) return setAvanzarA\(n\);\n\s*if \(decision === 'no-avanza'\) return setNoAvanzo\(true\);/);
  // Lo que esperaba decide cuando el guardado en viaje termina.
  assert.match(EDITOR, /if \(avanzarA === null \|\| guardando\) return;[\s\S]{0,80}siguienteRef\.current\?\.\(avanzarA\)/);
  assert.match(EDITOR, /case 1:[\s\S]{0,400}setDescartar\(true\)/);
});

test('TEST-EDP-021 · el asistente escribe con las operaciones de la estación y solo lo que toca', () => {
  const pasos = EDITOR.slice(EDITOR.indexOf('const contenidoDelPaso'), EDITOR.indexOf('const asistente = pasoDelAsistente'));
  assert.ok(pasos.length > 1000);
  // Ningún paso arma el borrador de nuevo: escribe con `cambiar` (o la agenda con los chips de la estación).
  assert.doesNotMatch(pasos, /setBloques\(/);
  assert.doesNotMatch(pasos, /setAgenda\(/);
  // Cada escritura toca un campo de una sesión de su grupo: el nombre, una sesión nueva o la prescripción de un ejercicio.
  const escrituras = [...pasos.matchAll(/cambiar\(\((\w+)\) => \(([^;]*?), \1\)\)/g)].map((m) => m[2]);
  assert.deepEqual(escrituras, ['(sesionesDelGrupo(x, g)[n]!.label = e.target.value)', 'sesionesDelGrupo(x, g).push(sesionVacia(g.sesiones.length + 1))', '(sesionesDelGrupo(b, g)[n]!.prescriptions[l] = nueva)']);
  // Los días, con los mismos chips que la estación.
  assert.match(pasos, /chipsDeDias\(s, n\)/);
  assert.equal((EDITOR.match(/chipsDeDias\(s, n\)/g) ?? []).length, 2);
  // El paso 4 muestra el nombre, lo que tiene ahora y la marca de la carga, al lado de la línea.
  assert.match(pasos, /<strong>\{nombre\}<\/strong>[^\n]*ejercicioPlegadoDelEditor\(x, 0\)\.resumen/);
  assert.match(pasos, /const revisar = cargaARevisar\(clave, x\);/);
});

// ── TEST-EDP-055 · el oráculo de ida y vuelta, con datos: un borrador mezclado pasa por lo que escriben los pasos ────
const serieConPropios = { repetitions: { value: 8 }, rir: 1, restSeconds: 150, suggestedLoad: { value: 82.5, unit: 'kg' }, note: 'pausa abajo' };
const conTodo = {
  prescriptionId: 'p1',
  exerciseVersionId: 'e1',
  sets: [serieConPropios, { repetitions: { min: 6, max: 8 } }],
  intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM estimado por el profesional' } } },
  suggestedLoad: { value: 100, unit: 'kg' },
  professionalParameters: [{ label: 'Tempo', value: '3-1-1', unit: null }],
  notes: 'sin rebote',
};
const mezclado = () => [
  { label: 'Fuerza', microcycles: [
    { label: 'Semana 1', sessions: [{ sessionId: 's1', label: 'Torso A', instructions: 'calentar 10 min', prescriptions: [conTodo] }] },
    { label: 'Semana 2', sessions: [{ sessionId: 's2', label: 'Torso B', instructions: null, prescriptions: [] }] },
  ] },
  { label: 'Descarga', sessions: [{ sessionId: 's3', label: 'Sesión A', instructions: null, prescriptions: [prescrita] }] },
];

test('TEST-EDP-055 · los pasos 2 a 5 recorren todas las sesiones del plan, por bloque y por semana', () => {
  const b = mezclado();
  const grupos = O.gruposDelAsistente(b);
  assert.deepEqual(grupos.map((g) => [g.i, g.j, g.titulo, g.sesiones.length]), [
    [0, 0, 'Fuerza · Semana 1', 1],
    [0, 1, 'Fuerza · Semana 2', 1],
    [1, null, 'Descarga', 1],
  ]);
  // Lo que sugiere `pasoQueSigue` (la sesión vacía de la semana 2) está en lo que muestra el paso 3.
  assert.equal(P.pasoQueSigue(b, null), 3);
  const vacias = grupos.flatMap((g) => g.sesiones.filter((s) => s.prescriptions.length === 0).map((s) => s.label));
  assert.deepEqual(vacias, ['Torso B']);
  assert.equal(O.claveDeLaSesion(grupos[1], 0), 'b0-m1-s0');
  assert.equal(O.claveDeLaSesion(grupos[2], 0), 'b1-s0');
});

test('TEST-EDP-055 · pasar por los pasos sin escribir deja el borrador idéntico, y cada escritura toca un campo', () => {
  const original = mezclado();
  const b = structuredClone(original);
  O.gruposDelAsistente(b);
  P.pasoQueSigue(b, null);
  assert.deepEqual(b, original);
  // Paso 2: el nombre de la sesión de la semana 2, y nada más.
  O.sesionesDelGrupo(b, { i: 0, j: 1 })[0].label = 'Piernas';
  const esperado = structuredClone(original);
  esperado[0].microcycles[1].sessions[0].label = 'Piernas';
  assert.deepEqual(b, esperado);
  // Paso 4: una línea sin RIR no toca el criterio % RM, las notas, los parámetros ni los valores propios de la serie 1.
  const l = leerPrescripcion('2×8');
  assert.ok(l.ok);
  const { prescripcion, cambio } = aplicarPrescripcion(conTodo, l.leida);
  assert.deepEqual(prescripcion, { ...conTodo, sets: [serieConPropios, { repetitions: { value: 8 } }] });
  assert.deepEqual(cambio.sePierde, []);
  // Con RIR, el % RM que se pierde se dice antes.
  const conRir = leerPrescripcion('2×8 RIR 2');
  assert.ok(conRir.ok);
  assert.match(aplicarPrescripcion(conTodo, conRir.leida).cambio.sePierde.join(' · '), /Su criterio % RM \(75 %, referencia «1RM estimado por el profesional»\) pasa a ser RIR 2/);
});

test('ED-11 · un preset de estructura no borra nada propio: reemplaza solo las sesiones sin nada escrito', () => {
  const sesiones = [
    { label: 'Sesión A', instructions: null, prescriptions: [] },
    { sessionId: 'x', label: 'Sesión B', instructions: null, prescriptions: [] },
    { label: 'Movilidad', instructions: null, prescriptions: [] },
    { label: 'Sesión C', instructions: 'suave', prescriptions: [] },
    { label: 'Torso', instructions: null, prescriptions: [prescrita] },
  ];
  const conDias = (s) => s.sessionId === 'x';
  assert.deepEqual(O.loQueReemplazaLaEstructura(sesiones, conDias), [0]);
  const lista = structuredClone(sesiones);
  O.conLaEstructura(lista, ['Torso A', 'Piernas A'], conDias);
  // Las demás quedan en su orden, y las del preset se suman al final.
  assert.deepEqual(lista.map((s) => s.label), ['Sesión B', 'Movilidad', 'Sesión C', 'Torso', 'Torso A', 'Piernas A']);
  assert.deepEqual(lista.slice(0, 4), sesiones.slice(1));
});

test('DJ-8 · la marca de la carga va con el ejercicio como quedó: se va al editar o deshacer, y sigue al moverse', () => {
  const firma = O.firmaDeLaCarga(conTodo);
  // Sin identificadores: sobrevive al autoguardado, que trae los del servidor.
  assert.equal(O.firmaDeLaCarga({ ...conTodo, prescriptionId: 'otro' }), firma);
  assert.equal(O.firmaDeLaCarga({ ...conTodo, sets: [{ ...serieConPropios, repetitions: { value: 6 } }, conTodo.sets[1]] }) === firma, false);
  assert.equal(O.firmaDeLaCarga({ ...conTodo, suggestedLoad: { value: 105, unit: 'kg' } }) === firma, false);
  assert.match(EDITOR, /setCargasARevisar\(\(m\) => \(\{ \.\.\.m, \[clave\]: \(m\[clave\] \?\? \[\]\)\.filter\(\(x\) => !firmas\.has\(x\.firma\)\) \}\)\);/);
});

test('TEST-EDP-019 · la acción del plan sale del estado del área, un caso por estado', () => {
  assert.deepEqual(F.accionDelPlan(null), { tipo: 'crear', texto: 'Empezar el plan', extra: '&asistente=1' });
  assert.deepEqual(F.accionDelPlan({ activePlan: null, draftPlan: null }), { tipo: 'crear', texto: 'Empezar el plan', extra: '&asistente=1' });
  assert.deepEqual(F.accionDelPlan({ activePlan: { planVersionId: 'v' }, draftPlan: null }), { tipo: 'ajustar', texto: 'Ajustar el plan', extra: '&crear=vigente' });
  assert.equal(F.accionDelPlan({ activePlan: { planVersionId: 'v' }, draftPlan: { planVersionId: 'b' } }).tipo, 'seguir');
  assert.equal(F.accionDelPlan({ activePlan: null, draftPlan: { planVersionId: 'b' } }).tipo, 'seguir');
  // «Ajustar el plan» crea la versión una sola vez por llegada, y con un borrador lo abre sin crear otro.
  assert.match(PLAN, /ajusteHecho\.current = true;/);
  assert.match(PLAN, /versiones\.some\(\(v\) => v\.state === 'DRAFT'\)[^\n]*return ir\(\{ crear: null \}\)/);
});
