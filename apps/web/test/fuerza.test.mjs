/**
 * §5.8 · La fuerza estimada en el website (WP-EDITORES-PROFESIONAL; DL-171): lo que lee la tarjeta (ED-75), lo que dice
 * el cuadro de la serie observada mientras se escribe (ED-72), lo que escribe el cuadro de la carga (ED-76) y la tabla y
 * los tramos de la evolución (ED-74). Y la guardia de los textos de la vertical, que lee también los comentarios.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { COPY_FUERZA, terminosProhibidosDeFuerzaEn } from '@be/domain';

const F = await import('../src/app/pro/advisees/fuerza/fuerza.ts');

const PRESS = 'b5a3ddca-2d35-5d67-833b-cedfe0f6b1d7';
const diego = { identityId: '11111111-1111-4111-8111-111111111111', displayName: 'Diego Sosa' };
const martin = { identityId: '22222222-2222-4222-8222-222222222222', displayName: 'Martín Acosta' };
const estimacion = (carga, reps, rir) => {
  const n = reps + rir;
  return { specification: 'BE-E1RM', version: 1, method: 'EPLEY_V1', band: n <= 10 ? 'CORE' : 'ORIENTATIVE', load: { value: carga, unit: 'kg' }, completedRepetitions: reps, rir, equivalentRepetitions: n, value: n === 1 ? carga : (carga * (30 + n)) / 30 };
};
const deSesion = (id, date, carga, reps, rir, setIndex = 1) => ({
  pointId: `x:${id}:p1:${setIndex}`,
  date,
  source: 'PERSON',
  origin: { type: 'TRAINING_EXECUTION', id, prescriptionId: 'p1', setIndex, corrected: false },
  writtenBy: diego,
  estimate: estimacion(carga, reps, rir),
});
const observada = (id, date, carga, reps, rir) => ({ pointId: `o:${id}`, date, source: 'OBSERVED', origin: { type: 'STRENGTH_OBSERVATION', id }, writtenBy: martin, estimate: estimacion(carga, reps, rir) });
const E1 = '33333333-3333-4333-8333-333333333331';
const E2 = '33333333-3333-4333-8333-333333333332';
const E3 = '33333333-3333-4333-8333-333333333333';

test('ED-75 · RM-43: con 70 × 12 RIR 0 y 65 × 8 RIR 2 en la última sesión, la tarjeta muestra 65 × 8 (la regla con el interruptor apagado)', () => {
  const apagado = [deSesion(E1, '2026-12-11', 65, 8, 2, 2)];
  const encendido = [deSesion(E1, '2026-12-11', 70, 12, 0, 1)];
  const p = F.valorDeLaTarjeta(apagado, encendido);
  assert.equal(p.estimate.load.value, 65);
  assert.equal(F.laSerie(p), '65 kg × 8 · RIR 2');
});

test('ED-75 · si la última sesión solo tiene orientativas, la tarjeta muestra la de mayor carga de ellas, aunque una anterior tenga núcleo', () => {
  const apagado = [deSesion(E1, '2026-12-08', 80, 6, 2)];
  const encendido = [deSesion(E1, '2026-12-08', 80, 6, 2), deSesion(E2, '2026-12-18', 70, 12, 0)];
  const p = F.valorDeLaTarjeta(apagado, encendido);
  assert.equal(p.origin.id, E2);
  assert.equal(p.estimate.band, 'ORIENTATIVE');
});

test('ED-75 · sin puntos, ningún valor; y lo que hace falta lleva la regla del RIR', () => {
  assert.equal(F.valorDeLaTarjeta([], []), null);
  const falta = F.loQueHaceFalta([
    { executionId: E1, date: '2026-12-01', prescriptionId: 'p1', setIndex: 1, reason: 'RIR_MAYOR_QUE_2', fields: [] },
    { executionId: E1, date: '2026-12-01', prescriptionId: 'p1', setIndex: 2, reason: 'RIR_MAYOR_QUE_2', fields: [] },
    { executionId: E2, date: '2026-12-04', prescriptionId: 'p1', setIndex: 1, reason: 'SIN_RIR', fields: [] },
  ]);
  assert.equal(falta.regla, COPY_FUERZA.reglaDelRir);
  assert.equal(falta.motivos, 'Las series registradas no entran: el RIR es mayor que 2; no tiene RIR.');
  assert.equal(F.loQueHaceFalta([]).motivos, null);
});

test('ED-72 · el cuadro estima en vivo y dice por qué no, sin guardar lo que no se estima (RM-36 y RM-37)', () => {
  const base = { exerciseId: PRESS, fecha: '2026-12-22', unidad: 'kg' };
  const r = F.serieObservadaEnVivo({ ...base, carga: '85', repeticiones: '5', rir: 1 });
  assert.equal(r.tipo, 'estima');
  assert.equal(r.estimacion.valor, 102);
  assert.equal(r.estimacion.banda, 'NUCLEO');
  assert.deepEqual(F.serieObservadaEnVivo({ ...base, carga: '60', repeticiones: '15', rir: 0 }), { tipo: 'no-se-estima', texto: COPY_FUERZA.masDe12 });
  assert.deepEqual(F.serieObservadaEnVivo({ ...base, carga: '80', repeticiones: '5', rir: null }), { tipo: 'no-se-estima', texto: COPY_FUERZA.sinRir });
  assert.deepEqual(F.serieObservadaEnVivo({ ...base, carga: '80', repeticiones: '5', rir: F.RIR_MAS_DE_2 }), { tipo: 'no-se-estima', texto: COPY_FUERZA.rirMayorQue2 });
  assert.equal(F.serieObservadaEnVivo({ ...base, carga: '', repeticiones: '5', rir: 1 }).tipo, 'incompleta');
  assert.equal(F.serieObservadaEnVivo({ ...base, carga: '0', repeticiones: '5', rir: 1 }).tipo, 'incompleta');
  assert.equal(F.serieObservadaEnVivo({ ...base, carga: '80', repeticiones: '5,5', rir: 1 }).tipo, 'incompleta');
  // La carga con coma, como se escribe.
  assert.equal(F.serieObservadaEnVivo({ ...base, carga: '82,5', repeticiones: '4', rir: 1 }).carga, 82.5);
  // Fuera de la lista de la v1, tampoco (RM-16).
  assert.equal(F.serieObservadaEnVivo({ ...base, exerciseId: '00000000-0000-4000-8000-000000000000', carga: '85', repeticiones: '5', rir: 1 }).tipo, 'no-se-estima');
});

test('ED-76 · con % RM se escriben la carga, el % y la referencia con el método y la fecha, nunca el valor (RM-40)', () => {
  const p = { intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: null } }, suggestedLoad: null };
  const c = F.loQueSeEscribeEnLaFilaGeneral(p, { value: 72.5, unit: 'kg' }, 75, '2026-12-18');
  assert.deepEqual(c, { suggestedLoad: { value: 72.5, unit: 'kg' }, intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM estimado · Epley v1 · 18/12/2026' } } } });
  assert.doesNotMatch(JSON.stringify(c.intensity), /98/);
  // La prescripción de entrada no cambia.
  assert.equal(p.suggestedLoad, null);
});

test('ED-76 · con el criterio RIR, o sin criterio, solo la carga: BE no convierte entre criterios', () => {
  const rir = { intensity: { criterion: 'RIR', target: { value: 2 } }, suggestedLoad: { value: 60, unit: 'kg' } };
  assert.deepEqual(F.loQueSeEscribeEnLaFilaGeneral(rir, { value: 72.5, unit: 'kg' }, 75, '2026-12-18'), { suggestedLoad: { value: 72.5, unit: 'kg' } });
  assert.deepEqual(F.loQueSeEscribeEnLaFilaGeneral({ intensity: null }, { value: 165, unit: 'lb' }, 75, '2026-12-18'), { suggestedLoad: { value: 165, unit: 'lb' } });
  assert.equal(F.textoDelPrincipalDeLaCarga(72.5, 'kg', 'Press de banca plano con barra'), 'Escribir 72,5 kg en Press de banca plano con barra');
});

test('ED-76 · la antigüedad de cada estimación, en días y semanas, sin pasar por UTC', () => {
  assert.equal(F.antiguedad('2026-12-22', '2026-12-22'), 'de hoy');
  assert.equal(F.antiguedad('2026-12-21', '2026-12-22'), 'de ayer');
  assert.equal(F.antiguedad('2026-12-18', '2026-12-22'), 'de hace 4 días');
  assert.equal(F.antiguedad('2026-12-15', '2026-12-22'), 'de hace 1 semana');
  assert.equal(F.antiguedad('2026-11-01', '2026-12-22'), 'de hace 7 semanas');
});

test('ED-74 · sin línea a través de un hueco: una sesión sin estimación entre dos puntos los separa', () => {
  const puntos = [deSesion(E1, '2026-12-01', 75, 8, 2), deSesion(E2, '2026-12-08', 80, 6, 2), deSesion(E3, '2026-12-15', 85, 4, 1)];
  const sinHueco = F.tramosDeLaLinea(puntos, []);
  assert.deepEqual(sinHueco, [
    [0, 1],
    [1, 2],
  ]);
  const hueco = [{ executionId: '33333333-3333-4333-8333-333333333339', date: '2026-12-11', prescriptionId: 'p1', setIndex: 1, reason: 'CARGA_RAPIDA', fields: [] }];
  assert.deepEqual(F.tramosDeLaLinea(puntos, hueco), [[0, 1]]);
  // Una serie que no entró en una sesión que sí tiene punto no es un hueco.
  const deLaMisma = [{ executionId: E3, date: '2026-12-15', prescriptionId: 'p1', setIndex: 2, reason: 'RIR_MAYOR_QUE_2', fields: [] }];
  assert.equal(F.tramosDeLaLinea(puntos, deLaMisma).length, 2);
});

test('ED-74 · la tabla de origen: los puntos y las sesiones sin estimación, del más reciente al más antiguo', () => {
  const puntos = [deSesion(E1, '2026-12-01', 75, 8, 2), observada('o1', '2026-11-23', 80, 5, 1)];
  // La serie 2 de la sesión del 1/12 no entró, pero esa sesión tiene su punto: no es una fila sin estimación.
  const noEntraron = [
    { executionId: E2, date: '2026-12-11', prescriptionId: 'p1', setIndex: 1, reason: 'CARGA_RAPIDA', fields: [] },
    { executionId: E1, date: '2026-12-01', prescriptionId: 'p1', setIndex: 2, reason: 'RIR_MAYOR_QUE_2', fields: [] },
  ];
  const filas = F.filasDeLaEvolucion(puntos, noEntraron);
  assert.deepEqual(
    filas.map((f) => [f.tipo, f.fecha]),
    [
      ['sin-estimacion', '2026-12-11'],
      ['punto', '2026-12-01'],
      ['punto', '2026-11-23'],
    ],
  );
  assert.equal(filas[0].motivo, `ninguna serie entra: ${COPY_FUERZA.motivo.CARGA_RAPIDA}`);
});

test('ED-73 · en la sesión del punto, las series que no entraron y por qué, en orden', () => {
  const p = deSesion(E1, '2026-12-18', 70, 12, 0, 3);
  const noEntraron = [
    { executionId: E1, date: '2026-12-18', prescriptionId: 'p1', setIndex: 2, reason: 'VALOR_DEL_PLAN', fields: ['rir'] },
    { executionId: E1, date: '2026-12-18', prescriptionId: 'p1', setIndex: 1, reason: 'MAS_DE_12', fields: [] },
    { executionId: E2, date: '2026-12-15', prescriptionId: 'p1', setIndex: 1, reason: 'SIN_RIR', fields: [] },
  ];
  assert.deepEqual(F.loQueNoEntroEnLaSesion(p, noEntraron), ['Serie 1: tiene más de 12 repeticiones equivalentes', 'Serie 2: el RIR es el del plan']);
  assert.deepEqual(F.loQueNoEntroEnLaSesion(observada('o1', '2026-12-18', 80, 5, 1), noEntraron), []);
});

test('§5.8 · los textos de la vertical pasan la guardia de fuerza y de Entrenamiento, también en los comentarios (RM-13, RM-32)', () => {
  const carpeta = new URL('../src/app/pro/advisees/fuerza/', import.meta.url);
  const archivos = readdirSync(carpeta).filter((a) => /\.tsx?$/.test(a));
  assert.ok(archivos.length >= 7);
  for (const archivo of archivos) {
    const fuente = readFileSync(new URL(archivo, carpeta), 'utf8');
    assert.deepEqual(terminosProhibidosDeFuerzaEn(fuente), [], archivo);
  }
  // Y la guardia ve lo que tiene que ver.
  assert.deepEqual(terminosProhibidosDeFuerzaEn('subió un 5 %'), ['%']);
  assert.deepEqual(terminosProhibidosDeFuerzaEn('tu nueva marca personal'), ['marca personal']);
});
