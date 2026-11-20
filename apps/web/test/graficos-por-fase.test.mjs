/**
 * WP-GRAFICOS-POR-FASE (DL-187): el período único de los gráficos (con la versión del plan), la franja de lo indicado,
 * las series y la carga × repeticiones indicadas y hechas, y el ejercicio de «Patrones». TEST-GPF-001 en adelante.
 *
 * La lógica es pura y se prueba con datos; lo que está en las pantallas se prueba leyendo el código, como las otras
 * pruebas del website. Cada prueba dice la mutación que la tiene que poner en rojo.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';
import { serieDisponible, terminosProhibidosEnUnGrafico } from '@be/domain';

const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const PER = await import('../src/app/pro/advisees/graficos/periodo-de-los-graficos.ts');
const FR = await import('../src/app/pro/advisees/graficos/entrenamiento/franja-de-lo-indicado.ts');
const PH = await import('../src/app/pro/advisees/graficos/entrenamiento/programado-y-hecho.ts');
const CRI = await import('../src/app/pro/advisees/graficos/entrenamiento/carga-repeticiones-y-rir.ts');
const P = await import('../src/app/pro/advisees/graficos/patrones/patrones.ts');
const ESTADO = await import('../src/app/pro/advisees/seguimiento/estado.ts');

const leer = (ruta) => readFileSync(new URL(`../src/app/pro/advisees/${ruta}`, import.meta.url), 'utf8');

const etapa = (planVersionId, dominio, etiqueta, desde, ultimoDia, abierta = false) => ({
  planVersionId,
  dominio,
  etiqueta,
  activadaEl: `${desde}T12:00:00.000Z`,
  finalizadaEl: abierta ? null : `${ultimoDia}T12:00:00.000Z`,
  motivoDeFin: abierta ? null : 'SUCCESSOR_ACTIVATED',
  desde,
  corte: abierta ? null : ultimoDia,
  ultimoDia,
  abierta,
  dias: 1,
  duracionMs: 1,
});
const ETAPAS = {
  TRAINING: [etapa('t1', 'TRAINING', 'v1', '2026-08-01', '2026-09-14'), etapa('t2', 'TRAINING', 'v2', '2026-09-15', '2026-10-26'), etapa('t3', 'TRAINING', 'v3', '2026-10-27', '2026-11-20', true)],
  NUTRITION: [etapa('n1', 'NUTRITION', 'v1', '2024-01-01', '2026-11-20', true)],
};
const CTX = { hoy: '2026-11-20', inicioDelVinculo: '2026-07-01', etapas: ETAPAS };

test('TEST-GPF-001 · las cuatro duraciones terminan hoy y cuentan hoy (mutación: 12 semanas con 85 días)', () => {
  const dias = (e) => {
    const p = PER.periodoDeLaEleccion(e, CTX);
    return PER.diasDelRango(p.desde, p.hasta);
  };
  assert.deepEqual(
    PER.DURACIONES.map((d) => dias({ tipo: 'DURACION', duracion: d.clave })),
    [28, 84, 182, 365],
  );
  assert.deepEqual(PER.ELECCION_POR_DEFECTO, { tipo: 'DURACION', duracion: 'DOCE_SEMANAS' });
  // Lo anterior al vínculo no se dibuja: el período lleva el día del vínculo (TB-16).
  assert.equal(PER.periodoDeLaEleccion({ tipo: 'DURACION', duracion: 'UN_ANIO' }, CTX).desdeElVinculo, '2026-07-01');
});

test('TEST-GPF-002 · «Desde que la acompañás»: el día del vínculo, o el último año y recortado (mutación: sin tope)', () => {
  assert.deepEqual(
    (({ desde, hasta, recortado }) => ({ desde, hasta, recortado }))(PER.periodoDeLaEleccion({ tipo: 'DESDE_EL_VINCULO' }, CTX)),
    { desde: '2026-07-01', hasta: '2026-11-20', recortado: false },
  );
  const viejo = PER.periodoDeLaEleccion({ tipo: 'DESDE_EL_VINCULO' }, { ...CTX, inicioDelVinculo: '2024-03-01' });
  assert.equal(viejo.recortado, true);
  assert.equal(PER.diasDelRango(viejo.desde, viejo.hasta), 365);
  assert.equal(PER.periodoDeLaEleccion({ tipo: 'DESDE_EL_VINCULO' }, { ...CTX, inicioDelVinculo: null }).recortado, true);
});

test('TEST-GPF-003 · a medida: hasta 366 días y sin pasar de hoy (mutación: aceptar 367 o un fin futuro)', () => {
  assert.equal(PER.problemaDelRango('2026-01-01', '2026-02-01', '2026-11-20'), null);
  assert.match(PER.problemaDelRango('2025-11-19', '2026-11-20', '2026-11-20'), /366/);
  assert.match(PER.problemaDelRango('2026-11-01', '2026-11-21', '2026-11-20'), /hoy/);
  assert.match(PER.problemaDelRango('2026-11-10', '2026-11-01', '2026-11-20'), /anterior/);
  assert.equal(PER.periodoDeLaEleccion({ tipo: 'A_MEDIDA', desde: '2026-11-10', hasta: '2026-11-01' }, CTX), null);
  assert.equal(PER.periodoDeLaEleccion({ tipo: 'A_MEDIDA', desde: '2026-10-01', hasta: '2026-10-31' }, CTX).hasta, '2026-10-31');
});

test('TEST-GPF-004 · por versión: su vigencia exacta, la anterior y la siguiente, y el recorte a 366 días (mutación: incluir el día del corte)', () => {
  const v2 = PER.periodoDeLaEleccion({ tipo: 'ETAPA', dominio: 'TRAINING', planVersionId: 't2' }, CTX);
  assert.deepEqual([v2.desde, v2.hasta, v2.recortado, v2.etapa.etiqueta], ['2026-09-15', '2026-10-26', false, 'v2']);
  // La vigente termina hoy.
  assert.equal(PER.periodoDeLaEleccion({ tipo: 'ETAPA', dominio: 'TRAINING', planVersionId: 't3' }, CTX).hasta, '2026-11-20');
  assert.equal(PER.etapaVecina(ETAPAS.TRAINING, 't2', -1).planVersionId, 't1');
  assert.equal(PER.etapaVecina(ETAPAS.TRAINING, 't2', 1).planVersionId, 't3');
  assert.equal(PER.etapaVecina(ETAPAS.TRAINING, 't3', 1), null);
  // Una versión de casi tres años se ve en sus últimos 366 días, y se dice.
  const n1 = PER.periodoDeLaEleccion({ tipo: 'ETAPA', dominio: 'NUTRITION', planVersionId: 'n1' }, CTX);
  assert.equal(n1.recortado, true);
  assert.equal(PER.diasDelRango(n1.desde, n1.hasta), 366);
  // Una versión que ya no está: `null`, y quien llama vuelve a la de siempre.
  assert.equal(PER.periodoDeLaEleccion({ tipo: 'ETAPA', dominio: 'TRAINING', planVersionId: 'otra' }, CTX), null);
  assert.equal(PER.textoDeLaEtapa(ETAPAS.TRAINING[1]), 'Entrenamiento v2 · del 15/9 al 26/10');
  assert.equal(PER.textoDeLaEtapa(ETAPAS.TRAINING[2]), 'Entrenamiento v3 · desde el 27/10 (vigente)');
});

test('TEST-GPF-005 · la ficha: «Desde que la acompañás» y la versión viajan en la dirección (mutación: perder `etapa`)', () => {
  const vinculo = ESTADO.periodoDeLaFicha(new URLSearchParams('p=vinculo'), '2026-07-01', '2026-11-20');
  assert.deepEqual([vinculo.desde, vinculo.hasta, vinculo.vinculo], ['2026-07-01', '2026-11-20', true]);
  assert.deepEqual(ESTADO.parametrosDePeriodo(vinculo), { p: 'vinculo', desde: null, hasta: null, etapa: null });
  const conEtapa = ESTADO.periodoDeLaFicha(new URLSearchParams('desde=2026-09-15&hasta=2026-10-26&etapa=TRAINING:0d3c9a2e-1111-4222-8333-444455556666'), null, '2026-11-20');
  assert.deepEqual(conEtapa.etapa, { dominio: 'TRAINING', planVersionId: '0d3c9a2e-1111-4222-8333-444455556666' });
  assert.equal(ESTADO.parametrosDePeriodo(conEtapa).etapa, 'TRAINING:0d3c9a2e-1111-4222-8333-444455556666');
  // Los atajos de los gráficos se leen de la dirección; elegir uno borra la versión.
  const doce = ESTADO.periodoDeLaFicha(new URLSearchParams('p=84'), null, '2026-11-20');
  assert.equal(doce.preset, 84);
  assert.deepEqual(ESTADO.parametrosDePeriodo(doce), { p: '84', desde: null, hasta: null, etapa: null });
  // Sin nada en la dirección, la ficha sigue en 90 días (GPF-D02): Resumen y Línea de tiempo no cambian.
  assert.equal(ESTADO.periodoDeLaFicha(new URLSearchParams(''), null, '2026-11-20').preset, 90);
});

// ─── La franja y lo indicado frente a lo hecho ─────────────────────────────────────────────────────

const fila = (numero, plan, hecho) => ({
  numero,
  setIndex: numero,
  planificada: plan === null ? { tipo: 'no-planificada' } : { tipo: 'planificada', repeticiones: plan, nota: null },
  registrada: hecho === null ? { tipo: 'sin-dato', motivo: 'serie-no-registrada' } : { tipo: 'registrada', serie: { setIndex: numero, completedRepetitions: hecho.reps, rir: null, perceivedExertion: null, load: hecho.kg === null ? null : { value: hecho.kg, unit: 'kg' } } },
  enElOriginal: undefined,
  corregida: false,
});
const obs = (id, planId, fecha, filas, extra = {}) => ({
  clave: `${id}|p1`,
  rol: 'planificado-y-registrado',
  delDia: { orden: 1, total: 1 },
  comparacion: {
    executionId: id,
    fecha,
    ocurrio: `${fecha}T21:00:00.000Z`,
    registradoEl: `${fecha}T22:00:00.000Z`,
    planId,
    sesion: 'Piernas A',
    prescriptionId: 'p1',
    orden: 1,
    prescripto: { exerciseId: 'sentadilla', exerciseVersionId: 'sv', nombre: 'Sentadilla' },
    realizado: { exerciseVersionId: 'sv', exerciseId: 'sentadilla', nombre: 'Sentadilla' },
    sustituido: false,
    identidad: 'misma-version',
    condicion: 'COMPLETED',
    resumen: null,
    fuente: { tipo: 'original', registradoEl: `${fecha}T22:00:00.000Z` },
    rirObjetivo: 2,
    porcentajeRm: null,
    cargaSugerida: { value: 100, unit: 'kg' },
    nota: null,
    prescripcion: {},
    filas,
    calentamiento: [],
    ...extra,
  },
});
const R = (min, max) => ({ min, max });
const OBS = [
  obs('e1', 'v1', '2026-10-01', [fila(1, R(8, 10), { reps: 11, kg: 100 }), fila(2, R(8, 10), { reps: 9, kg: 100 })]),
  obs('e2', 'v1', '2026-10-08', [fila(1, R(8, 10), { reps: 8, kg: 102.5 }), fila(2, R(8, 10), null)]),
  obs('e3', 'v2', '2026-10-20', [fila(1, { value: 5 }, { reps: 5, kg: 120 }), fila(2, { value: 5 }, { reps: 4, kg: 120 }), fila(3, { value: 5 }, { reps: 5, kg: 120 })], { cargaSugerida: { value: 120, unit: 'kg' } }),
];
const VIGENCIAS = [
  { domain: 'TRAINING', planVersionId: 'v1', label: 'v1', activatedAt: '2026-09-15T12:00:00.000Z', from: '2026-09-15', to: '2026-10-15', endedAt: '2026-10-15T12:00:00.000Z', endReason: 'SUCCESSOR_ACTIVATED' },
  { domain: 'TRAINING', planVersionId: 'v2', label: 'v2', activatedAt: '2026-10-15T12:00:00.000Z', from: '2026-10-15', to: null, endedAt: null, endReason: null },
];

test('TEST-GPF-006 · la franja en escalones según la versión y su vigencia (mutación: una sola franja para todo el período)', () => {
  const f = FR.franjasDeLoIndicado(OBS, { serie: 1, medida: { variable: 'repeticiones' }, vigencias: VIGENCIAS, desde: '2026-09-01', hasta: '2026-11-20' });
  assert.deepEqual(
    f.map((x) => [x.desde, x.hasta, x.minimo, x.maximo]),
    [
      ['2026-09-15', '2026-10-14', 8, 10],
      ['2026-10-15', '2026-11-20', 5, 5],
    ],
  );
  assert.match(f[0].rotulo, /8 a 10 rep · v1/);
  // Sin vigencias, del primer al último día con sesiones de la versión; y nunca fuera del eje.
  const sin = FR.franjasDeLoIndicado(OBS, { serie: 1, medida: { variable: 'repeticiones' }, vigencias: [], desde: '2026-10-05', hasta: '2026-11-20' });
  assert.deepEqual(sin.map((x) => [x.desde, x.hasta]), [['2026-10-05', '2026-10-08'], ['2026-10-20', '2026-10-20']]);
  // La carga sugerida en la unidad del panel también es una franja.
  assert.deepEqual(FR.franjasDeLoIndicado(OBS, { serie: 1, medida: { variable: 'carga', unidad: 'kg' }, vigencias: VIGENCIAS, desde: '2026-09-01', hasta: '2026-11-20' }).map((x) => x.minimo), [100, 120]);
  // En otra unidad, no.
  assert.deepEqual(FR.franjasDeLoIndicado(OBS, { serie: 1, medida: { variable: 'carga', unidad: 'lb' }, vigencias: VIGENCIAS, desde: '2026-09-01', hasta: '2026-11-20' }), []);
});

test('TEST-GPF-007 · ubicar sin calificar: dentro, por encima, por debajo, igual (mutación: «superaste», un color o «cumplió»)', () => {
  const rep = { variable: 'repeticiones' };
  assert.equal(FR.ubicacionRespectoDeLoIndicado(9, { minimo: 8, maximo: 10 }, rep), 'dentro de lo indicado (8 a 10 rep)');
  assert.equal(FR.ubicacionRespectoDeLoIndicado(12, { minimo: 8, maximo: 10 }, rep), '2 por encima de lo indicado (8 a 10 rep)');
  assert.equal(FR.ubicacionRespectoDeLoIndicado(4, { minimo: 5, maximo: 5 }, rep), '1 por debajo de lo indicado (5 rep)');
  assert.equal(FR.ubicacionRespectoDeLoIndicado(5, { minimo: 5, maximo: 5 }, rep), 'igual a lo indicado (5 rep)');
  assert.equal(FR.ubicacionRespectoDeLoIndicado(102.5, { minimo: 100, maximo: 100 }, { variable: 'carga', unidad: 'kg' }), '2,5 kg por encima de lo indicado (100 kg)');
  // En la lectura de cada punto, con lo indicado de su sesión.
  const puntos = [{ clave: 'a', fecha: '2026-10-01', hasta: null, en: '2026-10-01T21:00:00.000Z', valor: 11, rango: null, tramo: 't', marca: 'LLENA', tarde: false, lectura: '11 repeticiones' }];
  assert.equal(FR.conLaUbicacion(puntos, OBS, 1, rep)[0].lectura, '11 repeticiones · 1 por encima de lo indicado (8 a 10 rep)');
  for (const t of ['dentro de lo indicado (8 a 10 rep)', '2 por encima de lo indicado (8 a 10 rep)', FR.textoDeLoIndicado({ minimo: 8, maximo: 10 }, rep)]) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO']), [], t);
});

test('TEST-GPF-008 · GR-03 lleva la franja en repeticiones y carga, no en el RIR (mutación: franja en el RIR)', () => {
  const carril = (id) => ({ tipo: 'PUNTOS', id, nombre: id, unidad: id === 'carga' ? 'kg' : 'rep', metodo: null, indice: 0, puntos: [], indicado: [], escalones: [], unir: true, escala: { enteros: true }, cobertura: [], descripcion: '' });
  const con = CRI.conLoIndicadoDeFondo([carril('carga'), carril('repeticiones'), carril('rir')], OBS, { serie: 1, unidad: 'kg', vigencias: VIGENCIAS, desde: '2026-09-01', hasta: '2026-11-20' });
  assert.deepEqual(con.map((c) => (c.franjas ?? []).length), [2, 2, 0]);
  // Un % RM no se convierte a kg: se dice, y no hay franja de la carga.
  const conRm = [obs('e9', 'v1', '2026-10-01', [fila(1, R(8, 10), { reps: 9, kg: 100 })], { cargaSugerida: null, porcentajeRm: { valor: 75, referencia: null } })];
  assert.equal(FR.indicaPorcentajeRm(conRm, 1, { variable: 'carga', unidad: 'kg' }), true);
  assert.deepEqual(FR.franjasDeLoIndicado(conRm, { serie: 1, medida: { variable: 'carga', unidad: 'kg' }, vigencias: VIGENCIAS, desde: '2026-09-01', hasta: '2026-11-20' }), []);
});

test('TEST-GPF-009 · series y carga × repeticiones, indicadas y hechas, por sesión (mutación: contar una serie sin dato como hecha o un rango como número)', () => {
  const s = PH.programadoYHecho(OBS, 'kg', 'SESION');
  assert.deepEqual(
    s.map((x) => [x.seriesIndicadas, x.seriesHechas, x.volumenIndicado, x.volumenHecho]),
    [
      [2, 2, { minimo: 1600, maximo: 2000 }, 11 * 100 + 9 * 100],
      [2, 1, { minimo: 1600, maximo: 2000 }, 8 * 102.5],
      [3, 3, { minimo: 1800, maximo: 1800 }, 5 * 120 + 4 * 120 + 5 * 120],
    ],
  );
  assert.equal(PH.diferenciaDeSeries(1, 2), '1 serie menos que lo indicado (2)');
  assert.equal(PH.diferenciaDeSeries(3, 3), 'igual a lo indicado (3)');
  // «No realizada» es 0 (la única omisión declarada); un registro resumido no tiene series: sin dato, nunca 0.
  const noRealizada = obs('e4', 'v2', '2026-10-27', [fila(1, { value: 5 }, null)], { condicion: 'NOT_COMPLETED' });
  const resumido = obs('e5', 'v2', '2026-10-29', [{ ...fila(1, { value: 5 }, null), registrada: { tipo: 'sin-dato', motivo: 'registro-resumido' } }]);
  assert.deepEqual(PH.programadoYHecho([noRealizada, resumido], 'kg', 'SESION').map((x) => [x.seriesHechas, x.volumenHecho]), [[0, 0], [null, null]]);
  // Sin la carga sugerida, lo indicado queda «Sin indicar»: no se completa.
  const sinCarga = obs('e6', 'v2', '2026-11-03', [fila(1, { value: 5 }, { reps: 5, kg: null })], { cargaSugerida: null });
  const x = PH.programadoYHecho([sinCarga], 'kg', 'SESION')[0];
  assert.deepEqual([x.volumenIndicado, x.volumenHecho, x.seriesSinVolumen], [null, null, 1]);
});

test('TEST-GPF-010 · por semana, de lunes a domingo, sin completar lo que falta (mutación: sumar una semana con una sesión sin dato)', () => {
  const semanas = PH.programadoYHecho(OBS, 'kg', 'SEMANA');
  assert.deepEqual(semanas.map((s) => [s.fecha, s.hasta, s.sesiones, s.seriesIndicadas, s.seriesHechas]), [
    ['2026-09-28', '2026-10-04', 1, 2, 2],
    ['2026-10-05', '2026-10-11', 1, 2, 1],
    ['2026-10-19', '2026-10-25', 1, 3, 3],
  ]);
  const resumido = obs('e5', 'v2', '2026-10-21', [{ ...fila(1, { value: 5 }, null), registrada: { tipo: 'sin-dato', motivo: 'registro-resumido' } }]);
  const conHueco = PH.programadoYHecho([...OBS, resumido], 'kg', 'SEMANA').find((s) => s.fecha === '2026-10-19');
  assert.deepEqual([conHueco.sesiones, conHueco.seriesHechas, conHueco.seriesIndicadas], [2, null, 4]);
  // Los carriles: lleno lo hecho, hueco lo indicado; un rango es un segmento, no un número.
  const [series, carga] = PH.carrilesDeProgramadoYHecho(PH.programadoYHecho(OBS, 'kg', 'SESION'), 'kg');
  assert.deepEqual(series.puntos.map((p) => p.valor), [2, 1, 3]);
  assert.deepEqual(carga.indicado.map((p) => [p.valor, p.rango]), [[null, { desde: 1600, hasta: 2000 }], [null, { desde: 1600, hasta: 2000 }], [1800, null]]);
  for (const c of [series, carga]) for (const t of [c.nombre, ...c.puntos.map((p) => p.lectura), ...c.indicado.map((p) => p.lectura)]) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO']), [], t);
});

test('TEST-GPF-011 · «Armá tu gráfico» ofrece lo indicado y lo hecho, sin la palabra prohibida (mutación: «volumen» en pantalla)', () => {
  for (const id of PH.SERIES_DEL_VOLUMEN) {
    const s = serieDisponible(id);
    assert.ok(s, id);
    assert.equal(s.estado, 'OFRECIDA', id);
    assert.equal(s.fuente.tipo, 'CONTEXTO_DE_REVISION', id);
    for (const t of [s.definicion.nombre, s.definicion.nombreCorto, s.definicion.explicacion, s.definicion.comoSeCalcula, s.definicion.ausencias, ...s.definicion.limites]) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO']), [], t);
  }
  const textos = Object.values(PH.COPY_PROGRAMADO_Y_HECHO).flatMap((v) => (typeof v === 'string' ? [v] : typeof v === 'function' ? [v('kg'), v('SESION', 'x')] : Object.values(v)));
  for (const t of textos) assert.deepEqual(terminosProhibidosEnUnGrafico(String(t), ['ENTRENAMIENTO']), [], t);
  // La serie del catálogo: un rango de lo indicado no es un punto, y la nota lo dice.
  const indicada = PH.serieDelVolumen(OBS, { metricId: 'entrenamiento.carga-por-repeticiones-indicada', nombre: 'x', unidad: 'kg' });
  assert.deepEqual(indicada.points.map((p) => p.value), [1800]);
  assert.match(indicada.notes.join(' '), /2 sesiones indicaban un rango/);
  // La del volumen de la proyección sigue sin ofrecerse (la API no lo calcula).
  assert.equal(serieDisponible('entrenamiento.volumen-carga-externa').estado, 'PIDE_DL');
});

test('TEST-GPF-012 · «Patrones»: el ejercicio elegido y, por defecto, el básico con más sesiones (mutación: siempre el más registrado)', () => {
  const ej = (exerciseKey, name, sessions, loadUnits = ['kg']) => ({ exerciseKey, name, sessions, setNumbers: [1], loadUnits });
  // Sin ningún básico (de la lista de la v1) con sesiones, el de más sesiones.
  const lista = [ej('e:00000000-0000-4000-8000-0000000000aa', 'Curl femoral', 12), ej('e:00000000-0000-4000-8000-0000000000bb', 'Plancha', 9, [])];
  assert.equal(P.ejercicioPorDefectoDePatrones(lista), 'e:00000000-0000-4000-8000-0000000000aa');
  assert.deepEqual(P.ejerciciosParaElegir(lista).map((x) => x.name), ['Curl femoral', 'Plancha']);
  const masRegistrado = { kind: 'MOST_RECORDED', rank: 1 };
  assert.equal(P.ejercicioResuelto(masRegistrado, lista, false, false, 'e:00000000-0000-4000-8000-0000000000bb').nombre, 'Plancha');
  // Un gráfico de la carga no toma un ejercicio sin carga: sigue con el más registrado con carga.
  assert.equal(P.ejercicioResuelto(masRegistrado, lista, false, true, 'e:00000000-0000-4000-8000-0000000000bb').nombre, 'Curl femoral');
  // Uno fijo del enfoque se respeta.
  assert.equal(P.ejercicioResuelto({ kind: 'FIXED', exerciseKey: 'e:00000000-0000-4000-8000-0000000000aa', setIndex: 1, unit: 'kg' }, lista, false, false, 'e:00000000-0000-4000-8000-0000000000bb').nombre, 'Curl femoral');
});

test('TEST-GPF-013 · las pantallas usan el mismo selector y el gráfico nuevo (mutación: volver a los botones de 12 semanas y 6 meses)', () => {
  const historial = leer('graficos/entrenamiento/historial-del-ejercicio.tsx');
  assert.match(historial, /<SelectorDePeriodoDeGraficos /);
  assert.match(historial, /<ProgramadoYHechoEnPantalla /);
  assert.doesNotMatch(historial, /OPCIONES_DE_PERIODO/);
  assert.match(leer('graficos/patrones/patrones-del-plan-en-pantalla.tsx'), /<SelectorDePeriodoDeGraficos /);
  const barra = leer('seguimiento/barra.tsx');
  assert.match(barra, /VISTAS_CON_GRAFICOS\.includes\(vista\)/);
  assert.match(barra, /PRESETS_DE_LOS_GRAFICOS/);
  assert.deepEqual(ESTADO.VISTAS_CON_GRAFICOS, ['patrones', 'analizar']);
  assert.match(leer('graficos/patrones/cuerpo-de-patrones-en-pantalla.tsx'), /data-ejercicio-de-patrones/);
  for (const t of Object.values(PER.COPY_DEL_PERIODO).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v)))) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO', 'NUTRICION']), [], t);
});

test('TEST-GPF-014 · por semana en los bordes del período: la primera y la última semana partidas se dibujan con sus días (mutación: el lunes antes del eje, o «Fuera del volumen»)', async () => {
  // Un período del miércoles 30/9 al miércoles 21/10: la primera y la última semana quedan partidas.
  const limites = { desde: '2026-09-30', hasta: '2026-10-21' };
  const semanas = PH.programadoYHecho(OBS, 'kg', 'SEMANA', limites);
  assert.deepEqual(semanas.map((s) => [s.clave, s.fecha, s.hasta]), [
    ['2026-09-28', '2026-09-30', '2026-10-04'],
    ['2026-10-05', '2026-10-05', '2026-10-11'],
    ['2026-10-19', '2026-10-19', '2026-10-21'],
  ]);
  // Ninguna semana cae antes del eje ni después de su fin: los carriles las dibujan todas.
  for (const s of semanas) assert.ok(s.fecha >= limites.desde && s.hasta <= limites.hasta, s.clave);
  // Una semana partida va a la mitad de sus días; una entera, a los tres días de su lunes, como siempre.
  const EJE = await import('../src/app/pro/advisees/graficos/eje-de-fechas.ts');
  const escala = EJE.escalaDeFechas({ desde: '2026-09-30', hasta: '2026-10-21', hoy: '2026-11-20', desdeElVinculo: null }, { izquierda: 0, derecha: 2200 });
  assert.equal(Math.round(escala.xDePunto({ fecha: '2026-10-05', hasta: '2026-10-11', en: null })), Math.round(escala.x('2026-10-08')));
  assert.equal(Math.round(escala.xDePunto({ fecha: '2026-10-19', hasta: '2026-10-21', en: null })), Math.round(escala.x('2026-10-20')));
  // Un mes sigue a los tres días de su inicio (no cambia lo que ya se dibujaba).
  assert.equal(Math.round(escala.xDePunto({ fecha: '2026-10-01', hasta: '2026-10-31', en: null })), Math.round(escala.x('2026-10-04')));
  // «Armá tu gráfico»: el detalle de lo que no entra no dice la palabra prohibida.
  const conFuera = obs('e7', 'v2', '2026-10-22', [fila(1, { value: 5 }, { reps: 5, kg: 120 }), fila(2, { value: 5 }, { reps: 5, kg: null })], { cargaSugerida: { value: 120, unit: 'kg' } });
  const hecha = PH.serieDelVolumen([conFuera], { metricId: 'entrenamiento.carga-por-repeticiones-hecha', nombre: 'x', unidad: 'kg' });
  const detalle = hecha.points.flatMap((p) => p.detail.flatMap((d) => [d.label, d.value]));
  assert.ok(detalle.length > 0);
  for (const t of [...detalle, ...hecha.notes]) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO']), [], t);
});

test('TEST-GPF-015 · a medida y por versión respetan hoy y el vínculo (mutación: aceptar un fin futuro o una versión anterior al vínculo)', () => {
  // Antes del vínculo no hay nada que dibujar: se dice, y la elección no vale.
  assert.match(PER.problemaDelRango('2026-05-01', '2026-06-15', '2026-11-20', '2026-07-01'), /1\/7/);
  assert.equal(PER.periodoDeLaEleccion({ tipo: 'A_MEDIDA', desde: '2026-05-01', hasta: '2026-06-15' }, CTX), null);
  assert.equal(PER.problemaDelRango('2026-05-01', '2026-07-01', '2026-11-20', '2026-07-01'), null);
  // Una versión que terminó antes del vínculo no se ofrece; una que lo cruza, sí.
  const vieja = etapa('t0', 'TRAINING', 'v0', '2026-03-01', '2026-06-30');
  const cruza = etapa('t05', 'TRAINING', 'v0b', '2026-06-01', '2026-07-31');
  assert.deepEqual(PER.etapasElegibles([vieja, cruza, ...ETAPAS.TRAINING], '2026-07-01').map((e) => e.planVersionId), ['t05', 't1', 't2', 't3']);
  assert.equal(PER.etapasElegibles([vieja], null).length, 1);
  // El control de los gráficos no deja elegir un fin futuro y valida el rango con las reglas de los gráficos.
  const control = leer('control-de-periodo.tsx');
  assert.match(control, /max=\{graficos \? hoy : undefined\}/);
  assert.match(control, /problemaDelRango\?\.\(desde, hasta\)/);
  assert.match(leer('graficos/selector-de-periodo-de-graficos.tsx'), /problemaDelRango=\{\(desde, hasta\) => problemaDelRango\(desde, hasta, periodo\.hoy, vinculo\)\}/);
  // La ficha nombra la versión solo si el período de la dirección es el suyo.
  assert.match(leer('seguimiento/barra.tsx'), /e\.ultimoDia === periodo\.hasta && e\.desde <= periodo\.desde/);
});

test('TEST-GPF-016 · en «Patrones» la franja dura la vigencia de cada versión (mutación: no pasarle las vigencias y dejar huecos entre versiones)', () => {
  assert.match(leer('graficos/patrones/cuerpo-de-patrones-en-pantalla.tsx'), /vigencias=\{p\.vigencias\.entrenamiento\}/);
  // Con la vigencia, la franja de v1 llega hasta el día anterior a v2, aunque la última sesión de v1 sea antes.
  const franjas = FR.franjasDeLoIndicado(OBS, { serie: 1, medida: { variable: 'repeticiones' }, vigencias: VIGENCIAS, desde: '2026-09-20', hasta: '2026-11-20' });
  assert.deepEqual(franjas.map((f) => [f.desde, f.hasta]), [['2026-09-20', '2026-10-14'], ['2026-10-15', '2026-11-20']]);
});

test('TEST-GPF-017 · «Armá tu gráfico» dice qué serie elegida no tiene observaciones (mutación: que la indicada desaparezca sin aviso)', () => {
  const armado = leer('graficos/arma-tu-grafico/grafico-armado.tsx');
  assert.match(armado, /sinDatos: notaDeLasSinDatos\(grafico\.series, leidas\)/);
  assert.match(armado, /\.\.\.\(estado\.sinDatos \? \[estado\.sinDatos\] : \[\]\)/);
  assert.match(armado, /Sin observaciones en el período: /);
  const texto = 'Sin observaciones en el período: «Carga × rep. indicada». Lo indicado con un rango de repeticiones es un rango y no se dibuja como un número.';
  assert.deepEqual(terminosProhibidosEnUnGrafico(texto, ['ENTRENAMIENTO']), []);
});
