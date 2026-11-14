/**
 * WP-GRAFICOS fase 2 (DL-174), los gráficos de Entrenamiento (GR-02, GR-03, GR-05 y GR-06).
 * Este archivo lo escribe solo la rama de Entrenamiento (B), con sus IDs (TEST-GRF-020 en adelante); la
 * rama base deja la primera prueba de su registro.
 *
 * TEST-GRF-021 a TEST-GRF-039: la lógica es pura (los `.ts` de `graficos/entrenamiento/`) y se prueba con datos; lo que
 * está en las pantallas (`*-en-pantalla.tsx`, el cuadro del ejercicio y «Analizar · Fuerza») se prueba leyendo el código,
 * como las otras pruebas del website. Cada prueba dice la mutación que la tiene que poner en rojo.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';
import { DETALLE_DE_CARGA_RAPIDA, epley, esIdDeGrafico, marcaDelPunto, serieDisponible, seriesOfrecidas, terminosProhibidosEnUnGrafico } from '@be/domain';

// Los módulos de los gráficos importan sin extensión (como pide el website): el gancho prueba con `.ts`.
const gancho = `export async function resolve(especificador, contexto, siguiente) {
  try {
    return await siguiente(especificador, contexto);
  } catch (error) {
    if (/^\\.\\.?\\//.test(especificador) && !/\\.[cm]?[jt]sx?$/.test(especificador)) return siguiente(especificador + '.ts', contexto);
    throw error;
  }
}`;
register('data:text/javascript,' + encodeURIComponent(gancho), import.meta.url);

const { GRAFICOS_DE_ENTRENAMIENTO } = await import('../src/app/pro/advisees/graficos/entrenamiento/registro.ts');
const FE = await import('../src/app/pro/advisees/graficos/entrenamiento/fuerza-estimada.ts');
const CR = await import('../src/app/pro/advisees/graficos/entrenamiento/carga-repeticiones-y-rir.ts');
const RI = await import('../src/app/pro/advisees/graficos/entrenamiento/rir-indicado-y-registrado.ts');
const PE = await import('../src/app/pro/advisees/graficos/entrenamiento/perfil-carga-repeticiones.ts');
const CO = await import('../src/app/pro/advisees/graficos/entrenamiento/comparador.ts');
const PH = await import('../src/app/pro/advisees/graficos/entrenamiento/periodo-del-historial.ts');
const TX = await import('../src/app/pro/advisees/graficos/entrenamiento/copy.ts');
const CA = await import('../src/app/pro/advisees/graficos/carriles.ts');
const EJ = await import('../src/app/pro/advisees/graficos/eje-de-fechas.ts');
const TE = await import('../src/app/pro/advisees/graficos/tabla-equivalente.ts');
const AD = await import('../src/app/pro/advisees/graficos/adaptadores.ts');

const leer = (ruta) => readFileSync(new URL(`../src/app/pro/advisees/${ruta}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ─── Datos de prueba ─────────────────────────────────────────────────────────────────────────────

const SENTADILLA = '2aba46d7-c2d9-539c-847f-dc13a4322e18';
const REMO_EN_POLEA = '0b9e4c1a-1111-4abc-9def-123456789abc';
const diego = { identityId: '11111111-1111-4111-8111-111111111111', displayName: 'Diego Sosa' };
const martin = { identityId: '22222222-2222-4222-8222-222222222222', displayName: 'Martín Acosta' };
const ex = (n) => `33333333-3333-4333-8333-3333333333${String(n).padStart(2, '0')}`;

const estimacion = (carga, reps, rir, unidad = 'kg') => {
  const n = reps + rir;
  return { specification: 'BE-E1RM', version: 1, method: 'EPLEY_V1', band: n <= 10 ? 'CORE' : 'ORIENTATIVE', load: { value: carga, unit: unidad }, completedRepetitions: reps, rir, equivalentRepetitions: n, value: n === 1 ? carga : (carga * (30 + n)) / 30 };
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

const vigencia = (planVersionId, label, from, to) => ({ domain: 'TRAINING', planVersionId, label, activatedAt: `${from}T12:00:00.000Z`, from, to, endedAt: null, endReason: null });
const V2 = vigencia('pv2', 'v2', '2026-10-01', '2026-10-20');
const V3 = vigencia('pv3', 'v3', '2026-10-20', null);
const VIGENCIAS = [V2, V3];

const PERSONA = { load: 'PERSON', completedRepetitions: 'PERSON', rir: 'PERSON' };
const kg = (value, unit = 'kg') => ({ value, unit });
const hecha = (setIndex, carga, reps, rir, extra = {}) => ({ setIndex, load: carga, completedRepetitions: reps, rir, perceivedExertion: null, recordedAs: 'TYPED', fieldOrigins: PERSONA, ...extra });
const fila = (numero, serie, repeticiones = { value: 5 }) => ({
  numero,
  planificada: { tipo: 'planificada', repeticiones, nota: null },
  registrada: serie ? { tipo: 'registrada', serie } : { tipo: 'sin-dato', motivo: 'serie-no-registrada' },
  enElOriginal: undefined,
  corregida: false,
});
const observacion = (executionId, fecha, planId, filas, { rirObjetivo = 2, rol = 'planificado-y-registrado', prescriptionId = 'p1' } = {}) => ({
  clave: `${executionId}|${prescriptionId}`,
  rol,
  delDia: { orden: 1, total: 1 },
  comparacion: {
    executionId,
    fecha,
    ocurrio: `${fecha}T15:00:00-03:00`,
    registradoEl: `${fecha}T16:00:00-03:00`,
    planId,
    sesion: 'Piernas A',
    prescriptionId,
    orden: 1,
    prescripto: { exerciseId: SENTADILLA, exerciseVersionId: 'v1', nombre: 'Sentadilla trasera con barra' },
    realizado: { exerciseVersionId: 'v1', exerciseId: SENTADILLA, nombre: 'Sentadilla trasera con barra' },
    sustituido: false,
    identidad: 'mismo-ejercicio',
    condicion: 'COMPLETED',
    resumen: null,
    fuente: { tipo: 'original', registradoEl: `${fecha}T16:00:00-03:00` },
    rirObjetivo,
    porcentajeRm: null,
    cargaSugerida: null,
    nota: null,
    prescripcion: {},
    filas,
  },
});
const punto = (pointId, date, value, extra = {}) => ({
  pointId,
  date,
  dateEnd: null,
  at: null,
  value,
  quality: 'COMPLETE',
  n: 1,
  segment: 't1',
  corrected: false,
  partialBucket: false,
  dataClass: null,
  method: null,
  planVersionIds: [],
  coverage: null,
  missing: [],
  detail: [],
  sources: [],
  sourcesTruncated: false,
  ...extra,
});
const serieAnalitica = (metricId, unit, points) => ({ metricId, label: metricId, unit, scale: 'RATIO', grain: 'ORIGINAL', aggregation: 'NONE', points, gaps: [], segments: [], notes: [] });
const periodo = (desde, hasta, desdeElVinculo = null) => ({ desde, hasta, hoy: hasta, desdeElVinculo });
const escala = (p = periodo('2026-10-01', '2026-11-14')) => EJ.escalaDeFechas(p, { izquierda: 56, derecha: 700 });
/** Cada marca del eje se escribe con los decimales del eje: ninguna se redondea a otro número. */
const seEscribeTalCual = (g) => g.marcasY.every((m) => Math.abs(Number(m.valor.toFixed(g.extremos.decimales)) - m.valor) < 1e-9);

/** Las sesiones de la fuerza de GR-02: tres en la v2 y cuatro en la v3 (la del día del corte ya es de la v3). */
const FUERZA = [
  deSesion(ex(1), '2026-10-05', 80, 5, 2),
  deSesion(ex(2), '2026-10-09', 80, 5, 2),
  deSesion(ex(3), '2026-10-13', 82.5, 6, 1),
  deSesion(ex(4), '2026-10-20', 85, 5, 1),
  deSesion(ex(5), '2026-10-23', 85, 5, 1),
  deSesion(ex(6), '2026-10-27', 85, 6, 0),
  deSesion(ex(7), '2026-10-30', 87.5, 5, 1),
];
/** El comparador de esas sesiones: la v2 indicaba RIR 2 y la v3, RIR 1, con 5 repeticiones en la serie 1. */
const OBSERVACIONES = FUERZA.map((p, i) => observacion(p.origin.id, p.date, i < 3 ? 'pv2' : 'pv3', [fila(1, hecha(1, kg(p.estimate.load.value), p.estimate.completedRepetitions, p.estimate.rir))], { rirObjetivo: i < 3 ? 2 : 1 }));

const todosLosTextos = (copia, muestras) =>
  Object.values(copia).flatMap((v) => {
    if (typeof v === 'string') return [v];
    if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
    if (typeof v === 'function') return (muestras.get(v) ?? []).map((args) => v(...args));
    if (v && typeof v === 'object') return Object.values(v).filter((x) => typeof x === 'string');
    return [];
  });

// ─── El registro ─────────────────────────────────────────────────────────────────────────────────

test('TEST-GRF-020 · el registro de la rama es una lista de gráficos con identificadores estables y sin repetir', () => {
  for (const lista of [GRAFICOS_DE_ENTRENAMIENTO]) {
    assert.ok(Array.isArray(lista));
    const ids = lista.map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const g of lista) {
      assert.ok(esIdDeGrafico(g.id), g.id);
      assert.match(g.codigo, /^(GR|SP)-\d{2}$/, g.id);
      assert.equal(typeof g.ofrecido, 'function', g.id);
    }
  }
});

test('TEST-GRF-021 · todos los textos de la rama pasan la guardia de Entrenamiento: sin «volumen», «1RM real», signo más-menos, porcentaje ni flecha (mutación: un texto con «±»)', () => {
  const muestras = new Map([
    [TX.COPY_DEL_HISTORIAL.serieN, [[2]]],
    [TX.COPY_DEL_HISTORIAL.abrirEnAnalizarDe, [['Carga, repeticiones y RIR de la serie 1']]],
    [TX.COPY_DEL_HISTORIAL.sinSesionesEnElPeriodo, [['en las últimas 12 semanas']]],
    [TX.COPY_DEL_HISTORIAL.sesiones, [[1], [4]]],
    [TX.COPY_FUERZA_ESTIMADA.version, [['v3', '20/10']]],
    [TX.COPY_FUERZA_ESTIMADA.versionCorta, [['v3']]],
    [TX.COPY_FUERZA_ESTIMADA.sesiones, [[1], [5]]],
    [TX.COPY_FUERZA_ESTIMADA.medianaDelRir, [['1,5']]],
    [TX.COPY_FUERZA_ESTIMADA.repeticiones, [['5', '6'], ['5', '5']]],
    [TX.COPY_FUERZA_ESTIMADA.ruido, [['3', 'kg']]],
    [TX.COPY_FUERZA_ESTIMADA.cambio, [['la versión 2', 'la versión 3', 'el RIR indicado pasó de 2 a 1: la estimación cambia aunque la fuerza no']]],
    [TX.COPY_FUERZA_ESTIMADA.unRirMueve, [['80', 'kg', '2,7']]],
    [TX.COPY_FUERZA_ESTIMADA.extremos, [['≈ 92 kg', '3/10', '≈ 98 kg', '12/11']]],
    [TX.COPY_FUERZA_ESTIMADA.descripcion, [[1, '≈ 92 kg', '≈ 92 kg'], [7, '≈ 92 kg', '≈ 98 kg']]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.titulo, [[1]]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.carga, [[1]]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.repeticiones, [[1]]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.rir, [[1]]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.repeticionesEnPalabras, [['1', true], ['8', false]]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.rirEnPalabras, [['1']]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.rirIndicadoEnPalabras, [['1', '2'], ['2', '2']]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.delDia, [['2 de 2']]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.descripcion, [[1, 1], [6, 2]]],
    [TX.COPY_CARGA_REPETICIONES_Y_RIR.sinDatos, [[2]]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.titulo, [[1]]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.carril, [[1]]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.opcion, [['80 kg', 1], ['80 kg', 3]]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.escalon, [['2', 'v3 · desde el 20/10']]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.lecturaRegistrado, [['1', '80 kg'], ['1', null]]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.lecturaIndicado, [['2']]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.porVersion, [['La versión 3 (desde el 20/10)', 4, '80 kg', 'de 1 a 2', '2'], ['Las sesiones desde el 3/11', 1, null, null, null]]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.deA, [['1', '2'], ['1', '1']]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.segunLaSesion, [['1', '3']]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.menos, [['80 kg', 'la versión 2', 'la versión 3', '2', '1']]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.mas, [['80 kg', 'la versión 2', 'la versión 3', '1', '2']]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.igual, [['80 kg', 'la versión 2', 'la versión 3', '1']]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.sinVersion, [['3/11']]],
    [TX.COPY_RIR_INDICADO_Y_REGISTRADO.sinSesiones, [[1]]],
    [TX.COPY_PERFIL.titulo, [['kg']]],
    [TX.COPY_PERFIL.queEs, [['kg']]],
    [TX.COPY_PERFIL.lasCurvas, [[['≈ 95 kg · de la fórmula']], [['≈ 95 kg · de la fórmula', '≈ 100 kg · de la fórmula']]]],
    [TX.COPY_PERFIL.ejeY, [['kg']]],
    [TX.COPY_PERFIL.rotuloDeLaCurva, [['100 kg']]],
    [TX.COPY_PERFIL.fuera, [[1], [3]]],
    [TX.COPY_PERFIL.lectura, [['80 kg', 5, '1', '6', '3/11 · últimas 4 semanas']]],
    [TX.COPY_PERFIL.descripcion, [[1, 1], [9, 4]]],
  ]);
  const textos = [
    ...todosLosTextos(TX.COPY_DEL_HISTORIAL, muestras),
    ...todosLosTextos(TX.COPY_FUERZA_ESTIMADA, muestras),
    ...todosLosTextos(TX.COPY_CARGA_REPETICIONES_Y_RIR, muestras),
    ...todosLosTextos(TX.COPY_RIR_INDICADO_Y_REGISTRADO, muestras),
    ...todosLosTextos(TX.COPY_PERFIL, muestras),
    ...Object.values(TX.PREGUNTAS_DE_ENTRENAMIENTO),
  ];
  assert.ok(textos.length > 90, `se esperaban todos los textos, hay ${textos.length}`);
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO']), [], t);
    assert.doesNotMatch(t, /[±→%]/, t);
  }
  // La guardia ve lo prohibido (si no, esta prueba no prueba nada).
  assert.notDeepEqual(terminosProhibidosEnUnGrafico('Hasta 3 kg ± 1', ['ENTRENAMIENTO']), []);
  assert.notDeepEqual(terminosProhibidosEnUnGrafico('El volumen de la semana', ['ENTRENAMIENTO']), []);
});

// ─── GR-02 · el 1RM estimado ─────────────────────────────────────────────────────────────────────

test('TEST-GRF-022 · GR-02: la mediana del RIR y el rango de repeticiones de cada versión salen de los puntos del día de esa versión, y el ruido se dice desde 4 sesiones (mutación: asignar cada punto a la versión de hoy)', () => {
  const l = FE.lecturasPorVersion(FUERZA, VIGENCIAS, 'kg');
  assert.deepEqual(
    l.map((x) => [x.planVersionId, x.rotulo, x.texto]),
    [
      [
        'pv2',
        'Versión 2, desde el 1/10',
        '3 sesiones · mediana del RIR registrado: 2 · de 5 a 6 repeticiones en la serie usada · con menos de 4 sesiones de hasta 10 repeticiones equivalentes, todavía no alcanza para decir cuánto cambia entre sesiones',
      ],
      ['pv3', 'Versión 3, desde el 20/10', '4 sesiones · mediana del RIR registrado: 1 · de 5 a 6 repeticiones en la serie usada · entre sesiones de esta versión aparecen diferencias de hasta 3 kg'],
    ],
  );
  // La sesión del día del corte ya es de la versión que empieza ese día.
  assert.equal(FE.lecturaDeLaVersionEn('2026-10-20', l)?.planVersionId, 'pv3');
  assert.equal(FE.lecturaDeLaVersionEn('2026-10-19', l)?.planVersionId, 'pv2');
  assert.equal(FE.lecturaDeLaVersionEn('2026-09-01', l), null);
  // Lo observado por el profesional no es una sesión de la persona: no cuenta.
  const conObservada = FE.lecturasPorVersion([...FUERZA, observada('o1', '2026-10-06', 100, 3, 0)], VIGENCIAS, 'kg');
  assert.match(conObservada[0].texto, /^3 sesiones/);
});

test('TEST-GRF-023 · GR-02: la primera línea dice que cambió lo indicado entre versiones, sin flecha ni el primer punto contra el último (mutación: comparar con la versión de hoy)', () => {
  const objetivos = FE.objetivosDeLasVersiones(FUERZA, OBSERVACIONES, VIGENCIAS);
  assert.deepEqual(objetivos.get('pv2'), { rir: { desde: 2, hasta: 2 }, repeticiones: { desde: 5, hasta: 5 } });
  assert.deepEqual(objetivos.get('pv3'), { rir: { desde: 1, hasta: 1 }, repeticiones: { desde: 5, hasta: 5 } });
  const cambios = FE.cambiosDeLoIndicado(VIGENCIAS, objetivos);
  assert.deepEqual(cambios, ['De la versión 2 a la versión 3, el RIR indicado pasó de 2 a 1: la estimación cambia aunque la fuerza no.']);
  // Sin cambio en lo indicado, no hay primera línea.
  const igual = FUERZA.map((p, i) => observacion(p.origin.id, p.date, i < 3 ? 'pv2' : 'pv3', [fila(1, hecha(1, kg(80), 5, 1))], { rirObjetivo: 2 }));
  assert.deepEqual(FE.cambiosDeLoIndicado(VIGENCIAS, FE.objetivosDeLasVersiones(FUERZA, igual, VIGENCIAS)), []);
  // Un rango de repeticiones que cambia también mueve la estimación.
  const conRango = FUERZA.map((p, i) => observacion(p.origin.id, p.date, i < 3 ? 'pv2' : 'pv3', [fila(1, hecha(1, kg(80), 5, 1), i < 3 ? { min: 4, max: 6 } : { min: 8, max: 10 })], { rirObjetivo: 2 }));
  assert.deepEqual(FE.cambiosDeLoIndicado(VIGENCIAS, FE.objetivosDeLasVersiones(FUERZA, conRango, VIGENCIAS)), [
    'De la versión 2 a la versión 3, las repeticiones indicadas pasaron de entre 4 y 6 a entre 8 y 10: la estimación cambia aunque la fuerza no.',
  ]);
  // Ningún texto de la fuerza compara dos puntos con una flecha ni da un porcentaje.
  const textos = [...cambios, ...FE.lecturasPorVersion(FUERZA, VIGENCIAS, 'kg').map((x) => x.texto), FE.extremosDeLaFuerza(FUERZA), FE.cuantoMueveUnRir(FUERZA[6])];
  for (const t of textos) {
    assert.doesNotMatch(t, /[→±%]/, t);
    assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO']), [], t);
  }
  assert.equal(FE.extremosDeLaFuerza(FUERZA), 'El valor más bajo del período: ≈ 98,5 kg (5/10); el más alto: ≈ 105 kg (30/10).');
  assert.equal(FE.cuantoMueveUnRir(FUERZA[6]), 'Con Epley, un RIR de diferencia mueve la estimación en la carga sobre 30: con 87,5 kg, unos 2,9 kg.');
});

test('TEST-GRF-024 · GR-02: el eje del 1RM estimado abarca 10 kg (22 lb) como mínimo, del catálogo, y sus marcas dicen su valor (mutación: sin el rango mínimo)', () => {
  const tres = FUERZA.slice(3, 6); // 102, 102 y 102 kg: sin el rango mínimo, el eje abarcaría casi nada.
  const puntos = FE.puntosDelCarrilDeFuerza(tres, []);
  const carril = FE.carrilDeLaFuerza(puntos, tres, 'kg');
  assert.equal(carril.escala.rangoMinimo, 10);
  assert.equal(FE.rangoMinimoDeLaFuerza('lb'), 22);
  assert.equal(carril.metodo, 'Epley v1');
  assert.equal(carril.nombre, '1RM estimado (Epley v1)');
  const g = CA.geometriaDelCarril(carril, escala(), 140);
  assert.ok(g.extremos.arriba - g.extremos.abajo >= 10, `${g.extremos.abajo} a ${g.extremos.arriba}`);
  assert.ok(seEscribeTalCual(g), JSON.stringify(g.marcasY));
  assert.equal(carril.descripcion, '3 estimaciones en el período, todas de ≈ 102 kg.');
});

test('TEST-GRF-025 · GR-02: lleno hasta 10 repeticiones equivalentes, hueco de 10 a 12, rombo para lo observado; sin línea a través de una sesión sin estimación (mutación: un solo tramo para todo)', () => {
  const puntos = [deSesion(ex(1), '2026-10-05', 80, 5, 2), deSesion(ex(3), '2026-10-12', 70, 10, 1), observada('o1', '2026-10-14', 90, 3, 0), deSesion(ex(4), '2026-10-16', 82.5, 5, 2)];
  // El 9/10 hubo una sesión del ejercicio sin estimación: corta la línea entre el 5/10 y el 12/10.
  const noEntraron = [{ executionId: ex(2), date: '2026-10-09', prescriptionId: 'p1', setIndex: 1, reason: 'SIN_RIR', fields: [] }];
  const tardias = new Set([ex(4)]);
  const p = FE.puntosDelCarrilDeFuerza(puntos, noEntraron, [], tardias);
  // Lo de la persona primero y lo observado al final: la observación del 14/10 no corta la línea del 12 al 16.
  assert.deepEqual(
    p.map((x) => [x.fecha, x.marca, x.tramo, x.tarde]),
    [
      ['2026-10-05', 'LLENA', 'persona-0', false],
      ['2026-10-12', 'HUECA', 'persona-1', false],
      ['2026-10-16', 'LLENA', 'persona-1', true],
      ['2026-10-14', 'ROMBO', 'observada:o:o1', false],
    ],
  );
  assert.equal(p[1].lectura, '≈ 95,5 kg · 70 kg × 10 · RIR 1 · orientativa');
  assert.match(p[3].lectura, /observada por vos$/);
  const lineas = CA.lineasDelCarril(p);
  assert.deepEqual(
    lineas.map((l) => l.map((x) => x.fecha)),
    [['2026-10-12', '2026-10-16']],
    'la línea no cruza el 9/10 ni pasa por lo observado',
  );
});

// ─── GR-03 · carga, repeticiones y RIR ──────────────────────────────────────────────────────────

test('TEST-GRF-026 · GR-03: tres carriles, cada uno con su unidad; el eje del RIR va de 0 al máximo registrado, con 5 como mínimo, y cada marca dice su valor (mutación: el RIR sin desde cero ni mínimo)', () => {
  const carga = serieAnalitica('entrenamiento.carga', 'kg', [punto('c1', '2026-10-05', 80), punto('c2', '2026-10-12', 82.5)]);
  const reps = serieAnalitica('entrenamiento.repeticiones', 'rep', [punto('r1', '2026-10-05', 5), punto('r2', '2026-10-12', 6)]);
  const rir = serieAnalitica('entrenamiento.rir', 'RIR', [punto('i1', '2026-10-05', 1), punto('i2', '2026-10-12', 2)]);
  const carriles = CR.carrilesDeCargaRepeticionesYRir({ carga, repeticiones: reps, rir }, { serie: 1, indicado: [], cargadoTarde: new Set() });
  assert.deepEqual(
    carriles.map((c) => [c.id, c.unidad, c.nombre]),
    [
      ['carga', 'kg', 'Carga registrada en la serie 1'],
      ['repeticiones', 'rep', 'Repeticiones registradas en la serie 1'],
      ['rir', 'RIR', 'RIR registrado en la serie 1'],
    ],
  );
  const g = CA.geometriaDelCarril(carriles[2], escala(), 140);
  assert.equal(g.extremos.abajo, 0);
  assert.ok(g.extremos.arriba >= 5, String(g.extremos.arriba));
  assert.ok(seEscribeTalCual(g), JSON.stringify(g.marcasY));
  // Un RIR alto agranda el eje hasta escribirlo; ninguna marca queda fuera de la escala.
  const alto = CR.carrilesDeCargaRepeticionesYRir({ carga: null, repeticiones: null, rir: serieAnalitica('entrenamiento.rir', 'RIR', [punto('i1', '2026-10-05', 8.5)]) }, { serie: 1, indicado: [], cargadoTarde: new Set() });
  const g2 = CA.geometriaDelCarril(alto[0], escala(), 140);
  assert.ok(g2.extremos.arriba >= 8.5 && g2.fueraDeLaEscala === 0);
  assert.ok(seEscribeTalCual(g2), JSON.stringify(g2.marcasY));
  // La base: de 0 a 5, la marca del medio no se escribe como «3» en el lugar de 2,5.
  assert.ok(!g.marcasY.some((m) => m.valor === 2.5 && g.extremos.decimales === 0));
});

test('TEST-GRF-027 · GR-03: un RIR sin escribir no es 0: no se dibuja y la tabla dice «sin dato» (mutación: dibujar un RIR vacío como 0)', () => {
  const carga = serieAnalitica('entrenamiento.carga', 'kg', [punto('c1', '2026-10-05', 80), punto('c2', '2026-10-12', 80)]);
  const rir = serieAnalitica('entrenamiento.rir', 'RIR', [punto('i1', '2026-10-05', null), punto('i2', '2026-10-12', 1)]);
  const [cCarga, cRir] = CR.carrilesDeCargaRepeticionesYRir({ carga, repeticiones: null, rir }, { serie: 1, indicado: [], cargadoTarde: new Set() });
  const g = CA.geometriaDelCarril(cRir, escala(), 140);
  assert.equal(g.marcas.length, 1, 'el RIR vacío no es un punto');
  assert.ok(g.marcas.every((m) => m.clave !== 'i1'));
  const tabla = TE.tablaEquivalente([cCarga, cRir]);
  assert.deepEqual(TE.lecturaDeLaFecha(tabla, '2026-10-05'), [
    { nombre: 'Carga registrada en la serie 1', texto: '80 kg' },
    { nombre: 'RIR registrado en la serie 1', texto: 'sin dato' },
  ]);
  assert.equal(TE.lecturaDeLaFecha(tabla, '2026-10-12')[1].texto, 'RIR 1');
});

test('TEST-GRF-028 · GR-03: lo tildado sin escribir va hueco y gris y lo dice; el RIR indicado de cada sesión va hueco en el panel del RIR (mutación: la carga rápida llena)', () => {
  const rapida = { detail: [{ label: DETALLE_DE_CARGA_RAPIDA.label, value: DETALLE_DE_CARGA_RAPIDA.value }] };
  const rir = serieAnalitica('entrenamiento.rir', 'RIR', [punto('i1', '2026-10-05', 2, rapida), punto('i2', '2026-10-12', 1)]);
  // Lo indicado de cada sesión, como lo arma `puntosDeLoIndicado` de la base (probado en graficos-base.test.mjs): huecos.
  const indicado = ['2026-10-05', '2026-10-09', '2026-10-13'].map((fecha, i) => ({
    clave: `indicado:${ex(i + 1)}:p1:1`,
    fecha,
    hasta: null,
    en: `${fecha}T15:00:00-03:00`,
    valor: 2,
    rango: null,
    tramo: 'indicado:1',
    marca: 'HUECA',
    tarde: false,
    lectura: 'RIR 2',
  }));
  const [c] = CR.carrilesDeCargaRepeticionesYRir({ carga: null, repeticiones: null, rir }, { serie: 1, indicado, cargadoTarde: new Set(['2026-10-12']) });
  assert.equal(c.indicado, indicado, 'lo indicado va en el mismo panel que lo registrado, aparte');
  assert.equal(c.puntos[0].marca, 'HUECA_GRIS');
  assert.notEqual(c.puntos[0].marca, 'LLENA');
  assert.match(c.puntos[0].lectura, /carga rápida/);
  assert.equal(c.puntos[1].tarde, true, 'lo cargado después se marca');
  const g = CA.geometriaDelCarril(c, escala(), 140);
  assert.ok(g.indicado.length === 3 && g.indicado.every((m) => m.marca === 'HUECA'));
  // La tabla dice lo indicado al lado de lo registrado, sin mezclarlos.
  assert.equal(TE.lecturaDeLaFecha(TE.tablaEquivalente([c]), '2026-10-05')[0].texto, 'RIR 2 · carga rápida (tildada sin escribir: los valores del plan) · indicado: RIR 2');
  // En pantalla, lo indicado es el RIR de esa serie en la versión que rigió cada sesión, del comparador.
  const pantalla = leer('graficos/entrenamiento/carga-repeticiones-y-rir-en-pantalla.tsx');
  assert.match(pantalla, /puntosDeLoIndicado\(lista\.ejecuciones, lista\.objetivosPorVersion, \{ exerciseKey, serie: numero, medida: \{ variable: 'rir' \}/);
  assert.match(pantalla, /leyenda=\{LEYENDA\}/);
});

// ─── GR-05 · el RIR indicado y el registrado ─────────────────────────────────────────────────────

const CARGAS = [
  observacion(ex(11), '2026-10-02', 'pv2', [fila(1, hecha(1, kg(80), 5, 2))]),
  observacion(ex(12), '2026-10-06', 'pv2', [fila(1, hecha(1, kg(80, 'lb'), 5, 3))]),
  observacion(ex(13), '2026-10-09', 'pv2', [fila(1, hecha(1, kg(80), 5, 2))]),
  observacion(ex(14), '2026-10-13', 'pv2', [fila(1, hecha(1, kg(80), 5, 2, { recordedAs: 'AS_PLANNED', fieldOrigins: { load: 'PLAN', completedRepetitions: 'PLAN', rir: 'PLAN' } }))]),
  observacion(ex(15), '2026-10-21', 'pv3', [fila(1, hecha(1, kg(80), 5, 1))], { rirObjetivo: 1 }),
  observacion(ex(16), '2026-10-24', 'pv3', [fila(1, hecha(1, kg(82.5), 5, 1))], { rirObjetivo: 2 }),
  observacion(ex(17), '2026-10-28', 'pv3', [fila(1, hecha(1, kg(80), 5, 1))], { rirObjetivo: 1 }),
];
const BANDAS = AD.bandasDeVersion(VIGENCIAS, 'ENTRENAMIENTO');

test('TEST-GRF-029 · GR-05: «a igual carga» deja la misma carga **y** la misma unidad, escrita por la persona (mutación: filtrar sin la unidad)', () => {
  const sesiones = RI.sesionesDelRir(CARGAS, 1);
  assert.equal(sesiones.length, 7);
  assert.deepEqual(
    RI.cargasDeLaSerie(sesiones).map((c) => [c.clave, c.sesiones]),
    [
      ['80|kg', 4],
      ['82.5|kg', 1],
      ['80|lb', 1],
    ],
  );
  const a80 = RI.aIgualCarga(sesiones, '80|kg');
  assert.deepEqual(
    a80.map((s) => s.fecha),
    ['2026-10-02', '2026-10-09', '2026-10-21', '2026-10-28'],
  );
  assert.ok(a80.every((s) => s.carga.unit === 'kg' && s.carga.value === 80 && !s.cargaRapida));
  assert.equal(RI.aIgualCarga(sesiones, null).length, 7);
});

test('TEST-GRF-030 · GR-05: el escalón de lo indicado por versión, hueco donde cambia según la sesión; lo que se ve, en palabras y sin la carga rápida (mutación: un escalón que no existió)', () => {
  const sesiones = RI.sesionesDelRir(CARGAS, 1);
  const c = RI.carrilDelRirIndicadoYRegistrado(sesiones, { serie: 1, bandas: BANDAS, tardias: new Set(), filtrado: false });
  // La v2 indicó siempre RIR 2: un escalón. La v3 indicó 1 o 2 según la sesión: hueco en cada sesión, sin escalón.
  assert.deepEqual(
    c.escalones.map((e) => [e.desde, e.hasta, e.valor]),
    [['2026-10-02', '2026-10-13', 2]],
  );
  assert.deepEqual(
    c.indicado.map((p) => [p.fecha, p.valor, p.marca]),
    [
      ['2026-10-21', 1, 'HUECA'],
      ['2026-10-24', 2, 'HUECA'],
      ['2026-10-28', 1, 'HUECA'],
    ],
  );
  assert.equal(c.puntos.find((p) => p.fecha === '2026-10-13').marca, 'HUECA_GRIS');
  assert.equal(c.unir, true);
  assert.equal(RI.carrilDelRirIndicadoYRegistrado(RI.aIgualCarga(sesiones, '80|kg'), { serie: 1, bandas: BANDAS, tardias: new Set(), filtrado: true }).unir, false, 'a igual carga no se une a través de otra carga');
  assert.deepEqual(RI.loQueSeVe(sesiones, BANDAS, null), [
    'La versión 2 (desde el 1/10): 4 sesiones; RIR registrado de 2 a 3; indicado: 2.',
    'La versión 3 (desde el 20/10): 3 sesiones; RIR registrado 1; indicado: de 1 a 2, según la sesión.',
  ]);
  const a80 = RI.aIgualCarga(sesiones, '80|kg');
  assert.deepEqual(RI.loQueSeVe(a80, BANDAS, { value: 80, unit: 'kg' }), [
    'La versión 2 (desde el 1/10): 2 sesiones con 80 kg; RIR registrado 2; indicado: 2.',
    'La versión 3 (desde el 20/10): 2 sesiones con 80 kg; RIR registrado 1; indicado: 1.',
    'La misma carga (80 kg), con menos RIR registrado en la versión 3 (desde el 20/10) que en la versión 2 (desde el 1/10): mediana de 1 frente a 2.',
  ]);
  for (const t of [...RI.loQueSeVe(a80, BANDAS, { value: 80, unit: 'kg' }), c.descripcion]) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO']), [], t);
  // Un rango indicado es un segmento hueco.
  const conRango = RI.carrilDelRirIndicadoYRegistrado([{ ...sesiones[0], indicado: { desde: 1, hasta: 2 } }], { serie: 1, bandas: BANDAS, tardias: new Set(), filtrado: false });
  assert.deepEqual(conRango.indicado[0].rango, { desde: 1, hasta: 2 });
  assert.equal(conRango.indicado[0].valor, null);
});

// ─── GR-06 · el perfil carga-repeticiones ────────────────────────────────────────────────────────

test('TEST-GRF-031 · GR-06: solo las series que escribió la persona, con RIR de 0 a 2 y en una sola unidad (mutación: una serie del plan en el perfil)', () => {
  const obs = [
    observacion(ex(21), '2026-10-05', 'pv2', [
      fila(1, hecha(1, kg(80), 5, 1)),
      fila(2, hecha(2, kg(80), 5, 2, { recordedAs: 'AS_PLANNED' })),
      fila(3, hecha(3, kg(80), 5, 2, { fieldOrigins: { load: 'PLAN', completedRepetitions: 'PERSON', rir: 'PERSON' } })),
      fila(4, hecha(4, kg(80), 5, 2, { fieldOrigins: undefined })),
      fila(5, hecha(5, kg(80), 5, 3)),
      fila(6, hecha(6, kg(80), 5, null)),
      fila(7, hecha(7, kg(175, 'lb'), 5, 1)),
    ]),
    observacion(ex(22), '2026-10-06', 'pv2', [fila(1, hecha(1, kg(90), 5, 1))], { rol: 'sustituido' }),
  ];
  const { puntos, fuera } = PE.puntosDelPerfil(obs, 'kg', '2026-11-14');
  assert.deepEqual(
    puntos.map((p) => [p.carga, p.repeticiones, p.rir, p.equivalentes]),
    [[80, 5, 1, 6]],
  );
  assert.equal(fuera, 5, 'carga rápida, valor del plan, sin procedencia, RIR 3 y sin RIR');
  assert.equal(PE.laEscribioLaPersona(hecha(1, kg(80), 5, 1, { recordedAs: 'AS_PLANNED' })), false);
  assert.equal(PE.entraEnElPerfil(hecha(1, kg(80), 5, 2.5)), false);
  assert.equal(PE.puntosDelPerfil(obs, 'lb', '2026-11-14').puntos.length, 1, 'cada unidad, su gráfico');
  assert.equal(PE.unidadMasReciente(obs), 'kg');
});

test('TEST-GRF-032 · GR-06: las curvas de igual 1RM estimado son de la fórmula de Epley v1, rotuladas así, hasta 12 repeticiones equivalentes y solo en la lista de la v1 (mutación: curvas sin rótulo)', () => {
  const puntos = [
    { equivalentes: 6, carga: 80 },
    { equivalentes: 4, carga: 85 },
    { equivalentes: 10, carga: 72.5 },
    { equivalentes: 15, carga: 60 },
  ].map((p, i) => ({ clave: `s${i}`, fecha: '2026-11-01', unidad: 'kg', repeticiones: p.equivalentes - 1, rir: 1, reciente: true, lectura: '', ...p }));
  const curvas = PE.curvasDeLaFormula(puntos, 'kg');
  assert.ok(curvas.length >= 1 && curvas.length <= 3);
  for (const c of curvas) {
    assert.equal(c.valor % 5, 0, 'redondeada a 5 kg');
    assert.match(c.rotulo, /de la fórmula/);
    assert.equal(c.puntos.length, 12);
    assert.equal(c.puntos[0].carga, c.valor, 'con una repetición equivalente, la carga es la estimación');
    for (const p of c.puntos.slice(1)) assert.ok(Math.abs(epley(p.carga, p.equivalentes) - c.valor) < 1e-9, `${p.carga} × ${p.equivalentes}`);
  }
  assert.deepEqual(PE.curvasDeLaFormula([], 'kg'), []);
  assert.ok(PE.curvasDeLaFormula(puntos.map((p) => ({ ...p, unidad: 'lb' })), 'lb').every((c) => c.valor % 10 === 0));
  // En pantalla: las curvas solo con un ejercicio de la lista, y con su leyenda.
  const pantalla = leer('graficos/entrenamiento/perfil-carga-repeticiones-en-pantalla.tsx');
  assert.match(pantalla, /curvas: enLaLista \? curvasDeLaFormula\(puntos, unidad\) : \[\]/);
  assert.match(pantalla, /enLaLista \? C\.queSonLasCurvas : C\.sinCurvas/);
  assert.match(TX.COPY_PERFIL.curva, /de la fórmula/);
});

test('TEST-GRF-033 · GR-06: las últimas 4 semanas (28 días con hoy) van aparte, con otra forma (mutación: contar 4 semanas sin el día de hoy)', () => {
  assert.equal(PE.DIAS_RECIENTES, 28);
  assert.equal(PE.inicioDeLasRecientes('2026-11-14'), '2026-10-18');
  const obs = [observacion(ex(31), '2026-10-17', 'pv2', [fila(1, hecha(1, kg(80), 5, 1))]), observacion(ex(32), '2026-10-18', 'pv2', [fila(1, hecha(1, kg(80), 5, 1))])];
  assert.deepEqual(
    PE.puntosDelPerfil(obs, 'kg', '2026-11-14').puntos.map((p) => [p.fecha, p.reciente]),
    [
      ['2026-10-17', false],
      ['2026-10-18', true],
    ],
  );
  const pantalla = leer('graficos/entrenamiento/perfil-carga-repeticiones-en-pantalla.tsx');
  // La forma lo dice además del color: punto lleno o cruz.
  assert.match(pantalla, /if \(p\.reciente\) return <circle /);
  assert.match(pantalla, /data-anterior=""/);
  // Con el teclado, las flechas recorren las series; la lectura es una región viva cortés y hay tabla.
  assert.match(pantalla, /const nuevo = indiceConTeclado\(e, elegido, puntos\.length\);/);
  assert.match(pantalla, /<div className="grafico-base__lectura" aria-live="polite">/);
  assert.match(pantalla, /<caption>\{titulo\}<\/caption>/);
});

// ─── El cuadro del ejercicio ─────────────────────────────────────────────────────────────────────

test('TEST-GRF-034 · el cuadro se abre con el historial para todos los ejercicios y la tarjeta de fuerza sigue solo en la v1 (mutación: GR-02 o la tarjeta para cualquier ejercicio)', () => {
  const detalle = leer('fuerza/detalle-del-ejercicio.tsx');
  const vez = detalle.indexOf('<LaVezPasada lectura={vezPasada}');
  const acceso = detalle.indexOf('<AccesoAlHistorial nombre={nombre} onAbrir={(p) => abrir({ tipo: p })} />');
  const tarjeta = detalle.indexOf('<TarjetaDeFuerza');
  assert.ok(vez > 0 && vez < acceso && acceso < tarjeta, 'lo registrado abajo de lo indicado, y el historial antes de la tarjeta');
  assert.match(detalle, /\} else if \(paso\.tipo === 'historial' \|\| paso\.tipo === 'perfil'\) \{\n\s*titulo = COPY_DEL_HISTORIAL\.titulo\[paso\.tipo\];\n\s*cuerpo = <PasoDelHistorialDiferido paso=\{paso\.tipo\}/);
  // Los demás ejercicios, desde el cuadro de «La vez pasada» (GR-01): con el historial y sin la tarjeta de fuerza.
  const pieza = leer('training/la-vez-pasada.tsx');
  const cuadro = pieza.slice(pieza.indexOf('export function CuadroDeLaVezPasada'));
  assert.ok(cuadro.indexOf('<LaVezPasada lectura={lectura}') < cuadro.indexOf('<AccesoAlHistorial nombre={nombre} onAbrir={setPaso} />'));
  assert.match(cuadro, /<PasoDelHistorialDiferido paso=\{paso\}/);
  assert.doesNotMatch(cuadro, /TarjetaDeFuerza/);
  const editor = leer('training/ejercicio-del-editor.tsx');
  assert.match(editor, /const conFuerza = exerciseId !== null && entraEnLaEstimacion\(exerciseId\);/);
  // En el historial, GR-02 solo con un ejercicio de la lista de la v1, y el gráfico mismo no se dibuja fuera de ella.
  const historial = leer('graficos/entrenamiento/historial-del-ejercicio.tsx');
  assert.match(historial, /const enLaLista = entraEnLaEstimacion\(exerciseId\);/);
  assert.match(historial, /\{enLaLista \? \(\n\s*<div className="historial-del-ejercicio__grafico">\n\s*<FuerzaEstimada /);
  assert.match(leer('graficos/entrenamiento/fuerza-estimada-en-pantalla.tsx'), /if \(!enLaLista\) return null;/);
  // GR-03 y GR-05 comparten el cursor (un solo eje de fechas) y el paso se carga recién al abrirlo.
  assert.ok(historial.indexOf('<ProveedorDelCursor>') < historial.indexOf('<CargaRepeticionesYRir {...props} />'));
  assert.ok(historial.indexOf('<CargaRepeticionesYRir {...props} />') < historial.indexOf('<RirIndicadoYRegistrado {...props} />'));
  assert.match(leer('graficos/entrenamiento/acceso-al-historial.tsx'), /dynamic\(\(\) => import\('\.\/historial-del-ejercicio'\)\.then\(\(m\) => m\.PasoDelHistorial\), \{ ssr: false/);
});

test('TEST-GRF-035 · el período (12 semanas, 6 meses o desde que la acompañás, hasta un año) y «Abrir en Analizar» con lo elegido (mutación: un período de más de un año)', () => {
  const hoy = '2026-11-14';
  const menos = (n) => new Date(Date.parse(`${hoy}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
  assert.equal(PH.periodoDelHistorial('DOCE_SEMANAS', hoy, null).desde, menos(83));
  assert.equal(PH.periodoDelHistorial('SEIS_MESES', hoy, null).desde, menos(181));
  const reciente = PH.periodoDelHistorial('DESDE_EL_VINCULO', hoy, '2026-09-01');
  assert.deepEqual([reciente.desde, reciente.recortado], ['2026-09-01', false]);
  const viejo = PH.periodoDelHistorial('DESDE_EL_VINCULO', hoy, '2024-03-01');
  assert.deepEqual([viejo.desde, viejo.recortado], [menos(364), true]);
  assert.equal(PH.periodoDelHistorial('DESDE_EL_VINCULO', hoy, null).recortado, true);
  // Un vínculo más nuevo que el período: lo anterior no se dibuja (TB-16).
  assert.equal(EJ.inicioDelEje(PH.periodoDelHistorial('SEIS_MESES', hoy, '2026-10-01')), '2026-10-01');
  const p = PH.periodoDelHistorial('DOCE_SEMANAS', hoy, null);
  const enAnalizar = (href) => {
    const [ruta, query] = href.split('?');
    return { ruta, ...Object.fromEntries(new URLSearchParams(query)) };
  };
  assert.deepEqual(enAnalizar(PH.haciaElProgresoEnAnalizar('a1', `e:${SENTADILLA}`, 2, 'kg', p)), {
    ruta: '/pro/advisees',
    id: 'a1',
    vista: 'analizar',
    pregunta: 'progreso-de-un-ejercicio',
    ejercicio: `e:${SENTADILLA}`,
    serie: '2',
    unidad: 'kg',
    desde: menos(83),
    hasta: hoy,
  });
  assert.deepEqual(enAnalizar(PH.haciaLaFuerzaEnAnalizar('a1', SENTADILLA, 'lb', true, p)).orientativas, '1');
  assert.equal(enAnalizar(PH.haciaLaFuerzaEnAnalizar('a1', SENTADILLA, 'kg', false, p)).pregunta, 'fuerza-estimada');
  assert.deepEqual([enAnalizar(PH.haciaLoIndicadoEnAnalizar('a1', `e:${SENTADILLA}`, p)).pregunta, enAnalizar(PH.haciaLoIndicadoEnAnalizar('a1', `e:${SENTADILLA}`, p)).area], ['registrado-vs-indicado', 'ENTRENAMIENTO']);
  assert.equal(TX.COPY_DEL_HISTORIAL.sinSesiones, 'Sin sesiones registradas desde el inicio del acompañamiento.');
  for (const o of PH.OPCIONES_DE_PERIODO) assert.ok(PH.DIAS_DE_LA_OPCION[o] <= 366, o);
});

// ─── El catálogo, lo cargado después y el registro ──────────────────────────────────────────────

test('TEST-GRF-036 · el RIR indicado es una serie ofrecida del catálogo, hueca y leída del comparador por `leerSerieDelCatalogo` (mutación: ofrecerla sin lectura)', () => {
  const s = serieDisponible('entrenamiento.rir-indicado');
  assert.equal(s.estado, 'OFRECIDA');
  assert.equal(s.fuente.tipo, 'CONTEXTO_DE_REVISION');
  assert.equal(s.marca, 'INDICADO');
  const conEntrenamiento = { alcances: ['ENTRENAMIENTO'], propios: { NUTRICION: false, ENTRENAMIENTO: true, ANTROPOMETRIA: false } };
  assert.ok(seriesOfrecidas(conEntrenamiento).some((x) => x.id === 'entrenamiento.rir-indicado'));
  assert.ok(!seriesOfrecidas({ alcances: ['NUTRICION'], propios: { NUTRICION: true, ENTRENAMIENTO: false, ANTROPOMETRIA: false } }).some((x) => x.id === 'entrenamiento.rir-indicado'));
  // La lee `leerSerieDelCatalogo` con lo indicado de la base (el comparador en tramos de 92 días y API-SER-01).
  const lecturas = leer('graficos/lecturas.ts');
  assert.match(lecturas, /if \(serie\.fuente\.tipo === 'CONTEXTO_DE_REVISION'\) return leerLoIndicado\(p, ref, serie\);/);
  // Lo que viene de esa lectura es lo indicado: hueco, aunque el punto sea completo.
  assert.equal(marcaDelPunto(punto('i1', '2026-10-05', 2), s), 'HUECA');
  // Los gráficos de la rama leen el comparador con las lecturas de la base, y en el historial una sola vez para todos.
  const leyendo = leer('graficos/entrenamiento/lecturas-del-ejercicio.ts');
  assert.match(leyendo, /const sesiones = await leerLasSesionesEnTramos\(p\);/);
  assert.match(leyendo, /const objetivos = await leerLosObjetivosDeLasVersiones\(p, sesiones\.ejecuciones\.map\(\(x\) => x\.planId\)\);/);
  assert.match(leyendo, /if \(objetivos\.tipo !== 'lista'\) return objetivos;/, 'una versión que no se leyó es una falla, no lo indicado de otra');
  assert.match(leyendo, /const propio = useComparadorPropio\(lectura, periodo, activo && !delProveedor\);/);
  const historial = leer('graficos/entrenamiento/historial-del-ejercicio.tsx');
  assert.ok(historial.indexOf('<ProveedorDelComparador lectura={lectura} periodo={periodo}>') < historial.indexOf('<CargaRepeticionesYRir {...props} />'));
  // La cinta del tiempo (GR-23) va debajo de GR-03 y GR-05, con solo lo de Entrenamiento y de este ejercicio.
  assert.ok(historial.indexOf('<RirIndicadoYRegistrado {...props} />') < historial.indexOf('<CintaDelEjercicio '));
  assert.match(historial, /alcances=\{\['ENTRENAMIENTO'\]\}/);
  assert.match(historial, /exerciseKey=\{exerciseKey\}\n\s*periodo=\{periodo\}/);
});

test('TEST-GRF-037 · lo cargado en un día posterior se marca, en el día de la zona de la persona (mutación: comparar en UTC)', () => {
  const zona = 'America/Argentina/Buenos_Aires';
  const ejecuciones = [
    // 22:30 del mismo día en Buenos Aires, ya el 4/11 en UTC: no es tarde.
    { executionId: ex(41), date: '2026-11-03', recordedAt: '2026-11-04T01:30:00.000Z', timeZone: zona },
    // 9:00 del día siguiente: es tarde.
    { executionId: ex(42), date: '2026-11-03', recordedAt: '2026-11-04T12:00:00.000Z', timeZone: zona },
  ];
  assert.deepEqual([...CO.cargadasDespues(ejecuciones)], [ex(42)]);
  assert.equal(CO.diaCivilEn('2026-11-04T01:30:00.000Z', zona), '2026-11-03');
  const obs = [observacion(ex(41), '2026-11-03', 'pv3', []), observacion(ex(42), '2026-11-03', 'pv3', []), observacion(ex(43), '2026-11-05', 'pv3', [])];
  assert.deepEqual([...CO.fechasCargadasDespues(obs, new Set([ex(42)]))], ['2026-11-03']);
  assert.equal(CO.mediana([3, 1, 2]), 2);
  assert.equal(CO.mediana([1, 2]), 1.5);
  assert.equal(CO.mediana([]), null);
});

test('TEST-GRF-038 · el registro ofrece GR-02 solo con un ejercicio de la lista de la v1, y nada sin el alcance de Entrenamiento (mutación: ofrecer GR-02 sin un ejercicio de la lista)', () => {
  assert.deepEqual(
    GRAFICOS_DE_ENTRENAMIENTO.map((g) => [g.codigo, g.id, g.ubicacion]),
    [
      ['GR-02', 'entrenamiento.fuerza-estimada', 'EN_EL_TIEMPO'],
      ['GR-03', 'entrenamiento.carga-repeticiones-y-rir', 'EN_EL_TIEMPO'],
      ['GR-05', 'entrenamiento.rir-indicado-y-registrado', 'EN_EL_TIEMPO'],
      ['GR-06', 'entrenamiento.perfil-carga-repeticiones', 'COMPARACION'],
    ],
  );
  const ejercicio = (exerciseKey, sessions = 3) => ({ exerciseKey, name: 'x', otherNames: [], homonym: false, sessions, setNumbers: [1, 2], loadUnits: ['kg'], lastDate: '2026-11-10' });
  const contexto = (alcances, ejercicios) => ({ acceso: { alcances, propios: { NUTRICION: false, ENTRENAMIENTO: alcances.includes('ENTRENAMIENTO'), ANTROPOMETRIA: false } }, ejercicios, medidas: null });
  const ofrecidos = (c) => GRAFICOS_DE_ENTRENAMIENTO.filter((g) => g.ofrecido(c)).map((g) => g.codigo);
  assert.deepEqual(ofrecidos(contexto(['ENTRENAMIENTO'], [ejercicio(`e:${SENTADILLA}`)])), ['GR-02', 'GR-03', 'GR-05', 'GR-06']);
  assert.deepEqual(ofrecidos(contexto(['ENTRENAMIENTO'], [ejercicio(`e:${REMO_EN_POLEA}`)])), ['GR-03', 'GR-05', 'GR-06']);
  assert.deepEqual(ofrecidos(contexto(['ENTRENAMIENTO'], [ejercicio(`e:${SENTADILLA}`, 0)])), [], 'sin sesiones no hay qué mostrar');
  assert.deepEqual(ofrecidos(contexto(['NUTRICION'], null)), [], 'un área sin acceso no deja rastro');
  for (const g of GRAFICOS_DE_ENTRENAMIENTO) assert.equal(typeof g.Grafico, 'function', g.id);
});

test('TEST-GRF-039 · en «Analizar · Fuerza», GR-02 suma la primera línea, cada versión con su ruido y el rango mínimo del eje, y el ruido va antes que la diferencia (mutación: sacar el rango mínimo)', () => {
  const fuente = leer('fuerza/fuerza-en-analizar.tsx');
  const zonas = fuente.slice(fuente.indexOf('<div className="fuerza-en-analizar__zonas">'));
  assert.ok(zonas.indexOf('data-cambio-de-lo-indicado') < zonas.indexOf('<Grafico '), 'la primera línea, arriba del gráfico');
  assert.ok(zonas.indexOf('<Grafico ') < zonas.indexOf('<PorVersion lecturas={porVersion} />'));
  assert.match(fuente, /return cambiosDeLoIndicado\(versiones, objetivosDeLasVersiones\(linea\.puntos, observaciones, versiones\)\);/);
  assert.match(fuente, /const rango = rangoMinimoDeLaFuerza\(unidad\) \?\? 0;/);
  const lectura = fuente.slice(fuente.indexOf('function Lectura('));
  assert.ok(lectura.indexOf('data-ruido-de-la-version') > 0 && lectura.indexOf('data-ruido-de-la-version') < lectura.indexOf('{anterior && diferencia ? ('), 'el ruido antes que la diferencia');
  // Lo de antes sigue (ED-74): la tabla elige el punto con el teclado.
  assert.match(fuente, /<TablaDeOrigen [^\n]*onElegir=\{\(p\) => setElegidoId\(p\.pointId\)\}/);
});
