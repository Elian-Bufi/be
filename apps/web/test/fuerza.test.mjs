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

// ─── Revisión adversaria del 13/11 ─────────────────────────────────────────────────────────────────────────────

test('TEST-EDP-066 (revisión del 13/11) · el cuadro de la carga arranca de nuevo cada vez: ninguna elegida, y el % RM de la prescripción de ese momento', () => {
  const p75 = { intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: null } } };
  assert.deepEqual(F.entradaDelCuadroDeLaCarga(p75, 'kg'), { elegida: null, porcentaje: '75', paso: 2.5, sentido: 'ABAJO', propia: null });
  assert.equal(F.entradaDelCuadroDeLaCarga({ intensity: { criterion: 'PERCENT_RM', target: { value: 72.5 } } }, 'lb').porcentaje, '72,5');
  assert.equal(F.entradaDelCuadroDeLaCarga({ intensity: { criterion: 'PERCENT_RM', target: { value: 72.5 } } }, 'lb').paso, 5);
  assert.equal(F.entradaDelCuadroDeLaCarga({ intensity: { criterion: 'RIR', target: { value: 2 } } }, 'kg').porcentaje, '');
  // El estado se reinicia al entrar al paso y al cerrar, con la prescripción de ese momento (no la de cuando se montó).
  const hook = readFileSync(new URL('../src/app/pro/advisees/fuerza/carga-desde-la-estimacion.tsx', import.meta.url), 'utf8');
  assert.match(hook, /const entrada = entradaDelCuadroDeLaCarga\(prescripcion, unidad\);/);
  assert.match(hook, /const reiniciar = \(\) => \{\n\s*setElegida\(entrada\.elegida\);\n\s*setPorcentaje\(entrada\.porcentaje\);\n\s*setPaso\(entrada\.paso\);\n\s*setSentido\(entrada\.sentido\);\n\s*setPropia\(entrada\.propia\);/);
  const detalle = readFileSync(new URL('../src/app/pro/advisees/fuerza/detalle-del-ejercicio.tsx', import.meta.url), 'utf8');
  assert.match(detalle, /if \(p\.tipo === 'carga'\) carga\.reiniciar\(\);/);
  assert.match(detalle.slice(detalle.indexOf('const cerrar = '), detalle.indexOf('const abrir = ')), /carga\.reiniciar\(\);/);
});

test('ED-76 (revisión del 13/11) · RM-43 en el cuadro de la carga: se ofrece la de la tarjeta (65 × 8), no la orientativa de esa sesión', () => {
  // La sesión del 11/12: 70 × 12 RIR 0 (98 kg, orientativa) y 65 × 8 RIR 2 (86,5 kg). Antes, otra con solo orientativas.
  const apagado = [deSesion(E1, '2026-12-11', 65, 8, 2, 2)];
  const encendido = [deSesion(E1, '2026-12-11', 70, 12, 0, 1), deSesion(E2, '2026-12-04', 60, 12, 0, 1)];
  const lista = F.estimacionesParaLaCarga(apagado, encendido);
  assert.deepEqual(
    lista.map((p) => [p.date, p.estimate.load.value]),
    [
      ['2026-12-11', 65],
      ['2026-12-04', 60],
    ],
  );
  // Es el mismo valor que muestra la tarjeta.
  assert.equal(F.valorDeLaTarjeta(apagado, encendido), lista[0]);
  // Una observación orientativa, que no tiene otra, también se ofrece.
  assert.equal(F.estimacionesParaLaCarga([], [observada('o1', '2026-12-10', 60, 11, 0)]).length, 1);
  const detalle = readFileSync(new URL('../src/app/pro/advisees/fuerza/detalle-del-ejercicio.tsx', import.meta.url), 'utf8');
  assert.match(detalle, /puntos=\{estimacionesParaLaCarga\(/);
  assert.doesNotMatch(detalle, /puntos=\{deLaUnidad\.encendido/);
});

test('ED-76 (revisión del 13/11) · una lectura que falla no es «no hay estimaciones»: se dice y se reintenta', () => {
  const detalle = readFileSync(new URL('../src/app/pro/advisees/fuerza/detalle-del-ejercicio.tsx', import.meta.url), 'utf8');
  const desde = detalle.indexOf("} else if (paso.tipo === 'carga') {");
  const paso = detalle.slice(desde, detalle.indexOf('principal = {', desde));
  assert.match(paso, /deLaUnidad\.tipo === 'error' \? \(/);
  assert.match(paso, /<BloqueDeEstado tipo="error"[^>]*onReintentar=\{recargarLaUnidad\}/);
  assert.match(paso, /data-no-disponible/);
  assert.doesNotMatch(paso, /sinEstimaciones/);
  // Y desde su lista se abre «Cómo se calculó» (ED-73), que vuelve al cuadro con «Atrás».
  assert.match(paso, /onComoSeCalculo=\{\(p\) => setPaso\(\{ tipo: 'como', punto: p, desde: 'carga' \}\)\}/);
  assert.match(detalle, /alTocar: \(\) => setPaso\(\{ tipo: 'carga' \}\)/);
});

test('ED-74 (revisión del 13/11) · con el interruptor apagado, una sesión con solo orientativas es un hueco con su fila, y la tarjeta orientativa abre la evolución encendida', () => {
  // ED-75: Diego, una sola sesión, 70 × 10 con RIR 2 (12 equivalentes).
  const sola = deSesion(E1, '2026-12-18', 70, 10, 2);
  const solo = F.sesionesSoloOrientativas([], [sola]);
  assert.deepEqual(solo, [sola]);
  const filas = F.filasDeLaEvolucion([], [], solo);
  assert.deepEqual(
    filas.map((f) => [f.tipo, f.fecha, f.motivo]),
    [['sin-estimacion', '2026-12-18', F.SOLO_ORIENTATIVAS]],
  );
  // Entre dos puntos, separa la línea.
  const puntos = [deSesion(E2, '2026-12-01', 75, 8, 2), deSesion(E3, '2026-12-22', 80, 6, 2)];
  const conHueco = F.sesionesSoloOrientativas(puntos, [...puntos, sola]);
  assert.deepEqual(F.tramosDeLaLinea(puntos, [], conHueco), []);
  assert.deepEqual(F.tramosDeLaLinea(puntos, []), [[0, 1]]);
  // Si además una serie no entró, el motivo de la fila es el de las orientativas (sí hubo series que entran).
  const noEntro = [{ executionId: E1, date: '2026-12-18', prescriptionId: 'p1', setIndex: 2, reason: 'RIR_MAYOR_QUE_2', fields: [] }];
  assert.equal(F.filasDeLaEvolucion([], noEntro, solo)[0].motivo, F.SOLO_ORIENTATIVAS);
  // Encendido no hay ninguna; una observación no es una sesión.
  assert.deepEqual(F.sesionesSoloOrientativas([sola], [sola]), []);
  assert.deepEqual(F.sesionesSoloOrientativas([], [observada('o1', '2026-12-18', 60, 11, 0)]), []);
  // «Ver evolución» desde un valor orientativo lleva el interruptor encendido.
  assert.match(F.haciaLaEvolucion('a', PRESS, 'kg', true), /&orientativas=1$/);
  assert.doesNotMatch(F.haciaLaEvolucion('a', PRESS, 'kg'), /orientativas/);
  const tarjeta = readFileSync(new URL('../src/app/pro/advisees/fuerza/tarjeta.tsx', import.meta.url), 'utf8');
  assert.match(tarjeta, /haciaLaEvolucion\(asesoradoId, exerciseId, e\.unidad, e\.banda === 'ORIENTATIVA'\)/);
});

test('ED-74 (revisión del 13/11) · con el teclado: cada fecha de la tabla elige su punto, como tocarlo en el gráfico (WCAG 2.1.1)', () => {
  const fuente = readFileSync(new URL('../src/app/pro/advisees/fuerza/fuerza-en-analizar.tsx', import.meta.url), 'utf8');
  const tabla = fuente.slice(fuente.indexOf('function TablaDeOrigen('), fuente.indexOf('function Lectura('));
  assert.match(tabla, /<button type="button" className="boton boton--enlace" aria-pressed=\{esLaElegida\} data-elegir-punto onClick=\{\(\) => onElegir\(p\)\}>/);
  assert.match(fuente, /<TablaDeOrigen [^\n]*onElegir=\{\(p\) => setElegidoId\(p\.pointId\)\}/);
});

test('ED-74 (revisión del 13/11) · la maqueta 15: eje de fechas, hoy, marcas sin estimación, franjas del plan y lo que no entra por fecha', () => {
  assert.deepEqual(F.fechasDelEje('2026-11-16', '2026-12-22'), ['2026-11-16', '2026-11-25', '2026-12-04', '2026-12-13', '2026-12-22']);
  assert.deepEqual(F.fechasDelEje('2026-12-22', '2026-12-22'), ['2026-12-22']);
  assert.equal(F.fechasDelEje('2026-12-20', '2026-12-22').length, 3);
  assert.equal(F.diaConSemana('2026-12-04'), 'vie 4 dic');
  const versiones = [
    { domain: 'TRAINING', label: 'v9', from: '2026-10-01', to: '2026-12-14' },
    { domain: 'TRAINING', label: 'v10', from: '2026-12-14', to: null },
    { domain: 'NUTRITION', label: 'v3', from: '2026-12-01', to: null },
  ];
  assert.equal(F.versionDelPlanEn('2026-12-13', versiones), 'versión 9');
  // El día del corte ya rige la siguiente.
  assert.equal(F.versionDelPlanEn('2026-12-14', versiones), 'versión 10');
  assert.equal(F.versionDelPlanEn('2026-09-01', versiones), null);
  const puntos = [deSesion(E1, '2026-12-01', 75, 8, 2), deSesion(E3, '2026-12-18', 70, 12, 0)];
  const noEntraron = [
    { executionId: E2, date: '2026-12-04', prescriptionId: 'p1', setIndex: 1, reason: 'MAS_DE_12', fields: [] },
    { executionId: E1, date: '2026-12-01', prescriptionId: 'p1', setIndex: 2, reason: 'RIR_MAYOR_QUE_2', fields: [] },
  ];
  const r = F.loQueNoEntraPorFecha(puntos, noEntraron);
  assert.deepEqual(r.lineas, [`vie 4 dic: ninguna serie entra: ${COPY_FUERZA.motivo.MAS_DE_12}`, `mar 1 dic: la serie 2 no entra: ${COPY_FUERZA.motivo.RIR_MAYOR_QUE_2}`]);
  assert.equal(r.quedan, 0);
  assert.equal(F.loQueNoEntraPorFecha(puntos, noEntraron, [], 1).quedan, 1);
  const fuente = readFileSync(new URL('../src/app/pro/advisees/fuerza/fuerza-en-analizar.tsx', import.meta.url), 'utf8');
  for (const pieza of ['fuerza-en-analizar__franja', 'fuerza-en-analizar__hoy', 'fuerza-en-analizar__sin-estimacion', 'fechasDelEje(desde, hasta)', 'data-no-entra-por-fecha', 'versionDelPlanEn(elegido.date, versiones)']) assert.ok(fuente.includes(pieza), pieza);
});

test('ED-73 (revisión del 13/11) · «Cómo se calculó» dice la regla por sesión y distingue otra prescripción del mismo ejercicio', () => {
  const p = deSesion(E1, '2026-12-18', 85, 5, 1, 2);
  const noEntraron = [
    { executionId: E1, date: '2026-12-18', prescriptionId: 'p2', setIndex: 1, reason: 'SIN_RIR', fields: [] },
    { executionId: E1, date: '2026-12-18', prescriptionId: 'p1', setIndex: 3, reason: 'RIR_MAYOR_QUE_2', fields: [] },
  ];
  assert.deepEqual(F.loQueNoEntroEnLaSesion(p, noEntraron), [`Serie 3: ${COPY_FUERZA.motivo.RIR_MAYOR_QUE_2}`, `Serie 1, de la otra prescripción del ejercicio: ${COPY_FUERZA.motivo.SIN_RIR}`]);
  const como = readFileSync(new URL('../src/app/pro/advisees/fuerza/como-se-calculo.tsx', import.meta.url), 'utf8');
  assert.match(como, /se toma la de mayor carga, nunca la de mayor estimación/);
  assert.doesNotMatch(como, /es la que entra\./);
});

test('§5.8 (revisión del 13/11) · los textos que no eran ciertos en todos los casos', () => {
  const fuente = readFileSync(new URL('../src/app/pro/advisees/fuerza/fuerza-en-analizar.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(fuente, /entre 2 y 3 kg/);
  assert.doesNotMatch(fuente, /entra siempre/);
  const tarjeta = readFileSync(new URL('../src/app/pro/advisees/fuerza/tarjeta.tsx', import.meta.url), 'utf8');
  assert.match(tarjeta, /p\.source === 'OBSERVED' \? C\.orientativaObservada : C\.orientativaDeSesion/);
  // La lectura es la del último año: el rótulo lo dice.
  assert.match(tarjeta, /enElUltimoAnio: 'en el último año'/);
  assert.doesNotMatch(tarjeta, /desde el inicio del acompañamiento/);
});

test('ED-72 (revisión del 13/11) · la fecha futura que rechaza la API viaja en issues[].code, no en el código del error', () => {
  assert.equal(F.esLaFechaFutura({ ok: false, tipo: 'API', codigo: 'VALIDATION_FAILED', issues: [{ code: 'OBSERVED_DATE_IN_FUTURE', path: 'localDate' }] }), true);
  assert.equal(F.esLaFechaFutura({ ok: false, tipo: 'API', codigo: 'VALIDATION_FAILED', issues: [{ code: 'OTRO' }] }), false);
  assert.equal(F.esLaFechaFutura({ ok: false, tipo: 'RED' }), false);
  const fuente = readFileSync(new URL('../src/app/pro/advisees/fuerza/serie-observada.tsx', import.meta.url), 'utf8');
  assert.match(fuente, /esLaFechaFutura\(r\) \? COPY_SERIE_OBSERVADA\.fechaFutura/);
  assert.doesNotMatch(fuente, /r\.codigo === 'OBSERVED_DATE_IN_FUTURE'/);
});
