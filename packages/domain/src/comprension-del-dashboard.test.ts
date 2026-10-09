/**
 * WP-DASHBOARD-COMPRENSION (encargo del 2026-10-09): las reglas del dominio para comprender, investigar y actuar.
 * Novedades desde un corte, etapas de planificación, preguntas profesionales y la síntesis del Resumen.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ConfiguracionDeAnalisisSchema,
  ParametrosDePreguntaSchema,
  type EjercicioDelPeriodo,
  type EntradaDeLineaDeTiempo,
  type NovedadesDesde,
  type PuntoAnalitico,
  type SerieAnalitica,
  type VigenciaDePlan,
} from './contratos-analisis';
import type { ResumenDeAntropometria, ResumenDeEntrenamiento, ResumenDeNutricion } from './contratos-vinculo';
import {
  compararEtapas,
  duracionDeLaEtapa,
  etapaAnterior,
  etapaDeLaFecha,
  etapasDelArea,
  periodoDeLasEtapas,
  resumirEtapa,
  sinPlanEntre,
  TEXTO_SIN_DIFERENCIA_DE_ETAPAS,
  type EtapaDePlanificacion,
} from './etapas-de-planificacion';
import { contrasteDeLaComida, filaEnPalabras } from './contraste-de-comida';
import { conteosDesde, cumpleFiltros, novedadDesde } from './linea-de-tiempo';
import { definicionAntropometrica, definicionDeMetrica, MAXIMO_DE_METRICAS, type DefinicionDeMetrica } from './metricas-del-analisis';
import { PREGUNTAS_PROFESIONALES, requisitosDe, resolverPregunta, traeSeleccionesDelAsesorado, type ContextoDeLaPregunta } from './preguntas-profesionales';
import {
  claveDeObservacion,
  PALABRAS_QUE_CALIFICAN,
  primerPlanDelPeriodo,
  sintesisDelResumen,
  textoDeObservacion,
  textoDelAlcance,
  type DatosDeLaSintesis,
  type FormatoDeLaSintesis,
} from './sintesis-del-resumen';

const ZONA = 'America/Argentina/Buenos_Aires';
const def = (id: string): DefinicionDeMetrica => definicionDeMetrica(id) as DefinicionDeMetrica;

// ─── Novedades desde un corte (eje 1) ───────────────────────────────────────────────────────────

const CORTE = '2026-09-20T15:00:00.000Z'; // 12:00 en Buenos Aires

function entrada(id: string, o: Partial<EntradaDeLineaDeTiempo> = {}): EntradaDeLineaDeTiempo {
  return {
    timelineEntryId: `meal:${id}`,
    domain: 'NUTRITION',
    eventType: 'MEAL_RECORDED',
    source: { type: 'MEAL_RECORD', id: `00000000-0000-4000-8000-${id.padStart(12, '0')}` },
    occurredAt: '2026-09-21T16:00:00.000Z',
    occurredDate: '2026-09-21',
    recordedAt: '2026-09-21T16:05:00.000Z',
    recordedLate: false,
    timeZone: ZONA,
    author: null,
    title: 'Comida registrada · Almuerzo',
    details: [],
    state: 'EFFECTIVE',
    quality: [],
    planVersionId: null,
    exerciseKeys: [],
    relations: [],
    ...o,
  };
}

test('novedades desde la revisión: ocurrió después, se incorporó después o se corrigió después; la revisión misma no es novedad', () => {
  assert.equal(novedadDesde(entrada('1'), CORTE), 'OCURRIO_DESPUES');
  // Una comida del 18/9 cargada el 22/9: el hecho es anterior al corte, la información es nueva.
  assert.equal(novedadDesde(entrada('2', { occurredAt: '2026-09-18T16:00:00.000Z', occurredDate: '2026-09-18', recordedAt: '2026-09-22T10:00:00.000Z', recordedLate: true }), CORTE), 'INCORPORADO_DESPUES');
  // Registrada antes del corte y rectificada después: se corrigió después (el instante de la relación, no un updatedAt).
  const rectificada = entrada('3', {
    occurredAt: '2026-09-15T16:00:00.000Z',
    occurredDate: '2026-09-15',
    recordedAt: '2026-09-15T16:05:00.000Z',
    state: 'RECTIFIED',
    relations: [{ kind: 'RECTIFIED', at: '2026-09-25T09:00:00.000Z', target: null, label: 'Cantidades rectificadas' }],
  });
  assert.equal(novedadDesde(rectificada, CORTE), 'CORREGIDO_DESPUES');
  // Rectificada antes del corte: la revisión ya la vio.
  assert.equal(novedadDesde({ ...rectificada, relations: [{ kind: 'RECTIFIED', at: '2026-09-16T09:00:00.000Z', target: null, label: '' }] }, CORTE), null);
  // La ejecución de un plan no es una corrección.
  assert.equal(novedadDesde({ ...rectificada, relations: [{ kind: 'EXECUTES_PLAN_VERSION', at: '2026-09-25T09:00:00.000Z', target: null, label: '' }] }, CORTE), null);
  // El corte se excluye: lo registrado en el mismo instante es la revisión.
  assert.equal(novedadDesde(entrada('4', { occurredAt: CORTE, recordedAt: CORTE }), CORTE), null);
  // Un hecho sin hora del mismo día civil del corte, registrado después: sin hora no se puede saber; se cuenta como ocurrido después.
  assert.equal(novedadDesde(entrada('5', { occurredAt: null, occurredDate: '2026-09-20', recordedAt: '2026-09-20T20:00:00.000Z' }), CORTE), 'OCURRIO_DESPUES');
  assert.equal(novedadDesde(entrada('6', { occurredAt: null, occurredDate: '2026-09-19', recordedAt: '2026-09-20T20:00:00.000Z' }), CORTE), 'INCORPORADO_DESPUES');
});

test('los conteos desde el corte separan clase, dominio y tipo, y el filtro deja solo lo nuevo (sin mirar otros dominios)', () => {
  const entradas = [
    entrada('1'),
    entrada('2'),
    entrada('3', { occurredAt: '2026-09-18T16:00:00.000Z', occurredDate: '2026-09-18', recordedAt: '2026-09-22T10:00:00.000Z' }),
    entrada('4', { domain: 'TRAINING', eventType: 'TRAINING_SESSION_RECORDED', timelineEntryId: 'session:4' }),
    entrada('5', { occurredAt: '2026-09-10T16:00:00.000Z', occurredDate: '2026-09-10', recordedAt: '2026-09-10T16:00:00.000Z' }),
  ];
  const c = conteosDesde(entradas, CORTE);
  assert.equal(c.since, CORTE);
  assert.deepEqual(c.counts, [
    { kind: 'OCURRIO_DESPUES', domain: 'NUTRITION', eventType: 'MEAL_RECORDED', count: 2 },
    { kind: 'OCURRIO_DESPUES', domain: 'TRAINING', eventType: 'TRAINING_SESSION_RECORDED', count: 1 },
    { kind: 'INCORPORADO_DESPUES', domain: 'NUTRITION', eventType: 'MEAL_RECORDED', count: 1 },
  ]);
  assert.deepEqual(
    entradas.filter((e) => cumpleFiltros(e, { dominios: ['NUTRITION'], novedadesDesde: CORTE })).map((e) => e.timelineEntryId),
    ['meal:1', 'meal:2', 'meal:3'],
  );
});

// ─── Etapas de planificación (eje 4) ────────────────────────────────────────────────────────────

const V1 = '11111111-1111-4111-8111-111111111111';
const V2 = '22222222-2222-4222-8222-222222222222';
const V3 = '33333333-3333-4333-8333-333333333333';
const HOY = '2026-10-09';
const AHORA = '2026-10-09T15:00:00.000Z';

const vigencia = (planVersionId: string, label: string, activatedAt: string, from: string, to: string | null, endedAt: string | null, endReason: VigenciaDePlan['endReason'], domain: VigenciaDePlan['domain'] = 'NUTRITION'): VigenciaDePlan => ({
  domain,
  planVersionId,
  label,
  activatedAt,
  from,
  to,
  endedAt,
  endReason,
});

/** v1 rige un mes; v2 se activa el 1/8 a las 9 y v3 el mismo día a las 18; v3 sigue abierta. */
const VIGENCIAS: VigenciaDePlan[] = [
  vigencia(V3, 'v3', '2026-08-01T21:00:00.000Z', '2026-08-01', null, null, null),
  vigencia(V1, 'v1', '2026-07-01T12:00:00.000Z', '2026-07-01', '2026-08-01', '2026-08-01T12:00:00.000Z', 'SUCCESSOR_ACTIVATED'),
  vigencia(V2, 'v2', '2026-08-01T12:00:00.000Z', '2026-08-01', '2026-08-01', '2026-08-01T21:00:00.000Z', 'SUCCESSOR_ACTIVATED'),
];

test('las etapas salen de las versiones activadas: el día del corte es de la siguiente, dos activaciones el mismo día se separan por instantes y la abierta termina hoy', () => {
  const etapas = etapasDelArea(VIGENCIAS, 'NUTRITION', HOY, AHORA);
  assert.deepEqual(
    etapas.map((e) => [e.etiqueta, e.desde, e.ultimoDia, e.dias, e.abierta]),
    [
      ['v1', '2026-07-01', '2026-07-31', 31, false],
      ['v2', '2026-08-01', null, 0, false],
      ['v3', '2026-08-01', HOY, 70, true],
    ],
  );
  assert.equal(etapas[1]!.duracionMs, 9 * 3_600_000, 'v2 duró nueve horas: se lee por instantes');
  assert.equal(duracionDeLaEtapa(etapas[1]!), '9 horas (menos de un día)');
  assert.equal(duracionDeLaEtapa(etapas[2]!), '70 días, con hoy en curso');
  // El 1/8 es de v3: no se cuenta dos veces.
  assert.equal(etapaDeLaFecha(etapas, '2026-08-01')?.etiqueta, 'v3');
  assert.equal(etapaDeLaFecha(etapas, '2026-07-31')?.etiqueta, 'v1');
  assert.equal(etapaAnterior(etapas, V3)?.etiqueta, 'v2');
  assert.equal(etapaAnterior(etapas, V1), null);
  // Las de otro dominio no se mezclan.
  assert.deepEqual(etapasDelArea(VIGENCIAS, 'TRAINING', HOY, AHORA), []);
});

test('entre una versión y su sucesora no hay pausa; después de un cierre, sí, y sale de los datos', () => {
  const [v1, , v3] = etapasDelArea(VIGENCIAS, 'NUTRITION', HOY, AHORA);
  assert.equal(sinPlanEntre(v1!, v3!), null);
  const cerrada = etapasDelArea([vigencia(V1, 'v1', '2026-07-01T12:00:00.000Z', '2026-07-01', '2026-07-20', '2026-07-20T12:00:00.000Z', 'FOLLOW_UP_CLOSED'), vigencia(V2, 'v2', '2026-08-05T12:00:00.000Z', '2026-08-05', null, null, null)], 'NUTRITION', HOY, AHORA);
  assert.deepEqual(sinPlanEntre(cerrada[0]!, cerrada[1]!), { desde: '2026-07-20', hasta: '2026-08-04' });
});

const punto = (fecha: string, valor: number | null, o: Partial<PuntoAnalitico> = {}): PuntoAnalitico => ({
  pointId: `d:${fecha}`,
  date: fecha,
  dateEnd: null,
  at: null,
  value: valor,
  quality: valor === null ? 'UNKNOWN' : 'COMPLETE',
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
  ...o,
});

const serie = (d: DefinicionDeMetrica, puntos: PuntoAnalitico[], grain: SerieAnalitica['grain'] = 'DAY'): SerieAnalitica => ({
  metricId: d.id,
  label: d.nombre,
  unit: d.unidad,
  scale: d.escala,
  grain,
  aggregation: 'NONE',
  points: puntos,
  gaps: [],
  segments: [...new Set(puntos.map((p) => p.segment))].map((segment) => ({ segment, label: '', breakReason: null })),
  notes: [],
});

test('nutrición por las fechas de la etapa, con la media de las observaciones originales (regresión 1.875 kcal, n = 8) y lo cargado con otra versión dicho', () => {
  const etapas = etapasDelArea(VIGENCIAS, 'NUTRITION', HOY, AHORA);
  const energia = def('nutricion.energia');
  // Ocho días de v1 que alternan 1.500 y 2.250 kcal: la media de los días es 1.875 (no la de semanas).
  const dias = ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16'];
  const puntos = dias.map((f, i) => punto(f, i % 2 === 0 ? 1500 : 2250, { planVersionIds: [V1] }));
  // Un día de v1 cargado después de activarse la siguiente: la API lo asoció a la versión vigente al cargarlo.
  puntos.push(punto('2026-07-30', 1875, { planVersionIds: [V3] }));
  const r = resumirEtapa(serie(energia, puntos), energia, etapas[0]!, { desde: '2026-07-01', hasta: HOY });
  assert.equal(r.lente, 'FECHAS_DE_LA_ETAPA');
  assert.equal(r.resumen?.valor, 1875);
  assert.equal(r.resumen?.n, 9);
  assert.equal(r.deOtraVersion, 1, 'se dice cuántos días del rango tienen registros asociados a otra versión');
  // Sin el día cargado tarde, la regresión del paquete anterior: 1.875 kcal con n = 8.
  const sinTardio = resumirEtapa(serie(energia, puntos.slice(0, 8)), energia, etapas[0]!, { desde: '2026-07-01', hasta: HOY });
  assert.deepEqual([sinTardio.resumen?.valor, sinTardio.resumen?.n], [1875, 8]);
  // v2 no tiene un día entero: no se resume por fechas, y se dice por qué.
  const v2 = resumirEtapa(serie(energia, puntos), energia, etapas[1]!, { desde: '2026-07-01', hasta: HOY });
  assert.equal(v2.motivoSinResumen, 'SIN_DIA_ENTERO');
});

test('entrenamiento por la versión ejecutada: una sesión de v1 del día del corte sigue siendo de v1 y no se reatribuye', () => {
  const etapas = etapasDelArea(VIGENCIAS.map((v) => ({ ...v, domain: 'TRAINING' as const })), 'TRAINING', HOY, AHORA);
  const series = definicionDeMetrica('entrenamiento.series-registradas') as DefinicionDeMetrica;
  const puntos = [
    punto('2026-07-10', 4, { planVersionIds: [V1] }),
    punto('2026-07-20', 3, { planVersionIds: [V1] }),
    // Hecha el 1/8 a la mañana con v1, antes de activarse v2: es de v1.
    punto('2026-08-01', 4, { planVersionIds: [V1] }),
    punto('2026-08-05', 5, { planVersionIds: [V3] }),
  ];
  const s = serie(series, puntos, 'ORIGINAL');
  const v1 = resumirEtapa(s, series, etapas[0]!, { desde: '2026-07-01', hasta: HOY });
  assert.equal(v1.lente, 'VERSION_EJECUTADA');
  assert.equal(v1.resumen?.observaciones, 3);
  assert.equal(v1.fueraDeLasFechas, 1);
  const v3 = resumirEtapa(s, series, etapas[2]!, { desde: '2026-07-01', hasta: HOY });
  assert.equal(v3.resumen?.observaciones, 1);
  // v2 duró horas: por versión se puede leer igual (no tuvo sesiones).
  const v2 = resumirEtapa(s, series, etapas[1]!, { desde: '2026-07-01', hasta: HOY });
  assert.equal(v2.resumen?.observaciones, 0);
  // Un total de etapas de distinta duración no se resta.
  const c = compararEtapas(s, series, etapas[0]!, etapas[2]!, { desde: '2026-07-01', hasta: HOY });
  assert.equal(c.diferencia, null);
  assert.ok(c.motivoSinDiferencia === 'DURACIONES_DISTINTAS' || c.motivoSinDiferencia === 'PERIODO_INCOMPLETO');
  assert.ok(TEXTO_SIN_DIFERENCIA_DE_ETAPAS[c.motivoSinDiferencia!].length > 0);
});

test('antropometría entre etapas: un cambio de método corta la comparación y lo dice en palabras', () => {
  const etapas = etapasDelArea(VIGENCIAS, 'NUTRITION', HOY, AHORA);
  const suma = definicionAntropometrica('suma-6-pliegues-isak', 'mm');
  const s = serie(suma, [punto('2026-07-05', 72, { segment: 'cmp-1#1', dataClass: 'DERIVED' }), punto('2026-09-01', 60, { segment: 'cmp-2#2', dataClass: 'DERIVED' })], 'ORIGINAL');
  const c = compararEtapas(s, suma, etapas[0]!, etapas[2]!, { desde: '2026-07-01', hasta: HOY });
  assert.equal(c.diferencia, null);
  assert.equal(c.motivoSinDiferencia, 'TRAMOS_NO_COMPARABLES');
  assert.match(TEXTO_SIN_DIFERENCIA_DE_ETAPAS.TRAMOS_NO_COMPARABLES, /protocolo, el método o la unidad/);
  // Con el mismo tramo, la diferencia es descriptiva: B − A.
  const mismo = serie(suma, [punto('2026-07-05', 72, { segment: 'cmp-1#1' }), punto('2026-09-01', 69, { segment: 'cmp-1#1' })], 'ORIGINAL');
  assert.equal(compararEtapas(mismo, suma, etapas[0]!, etapas[2]!, { desde: '2026-07-01', hasta: HOY }).diferencia, -3);
});

test('el período que lee dos etapas cubre las dos y se recorta al máximo de un año, diciéndolo', () => {
  const etapas = etapasDelArea(VIGENCIAS, 'NUTRITION', HOY, AHORA);
  assert.deepEqual(periodoDeLasEtapas(etapas[0]!, etapas[2]!, HOY, 366), { desde: '2026-07-01', hasta: HOY, recortado: false });
  const vieja: EtapaDePlanificacion = { ...etapas[0]!, desde: '2025-01-01' };
  const p = periodoDeLasEtapas(vieja, etapas[2]!, HOY, 366);
  assert.equal(p.recortado, true);
  assert.equal(p.desde, '2025-10-09');
  // Lo leído no llega al principio de la etapa: se marca recortada.
  const energia = def('nutricion.energia');
  assert.equal(resumirEtapa(serie(energia, [punto('2025-12-01', 2000)]), energia, vieja, { desde: p.desde, hasta: p.hasta }).recortada, true);
});

// ─── Preguntas profesionales (eje 2) ────────────────────────────────────────────────────────────

const SENTADILLA = 'e:44444444-4444-4444-8444-444444444444';
const DE_OTRO = 'e:55555555-5555-4555-8555-555555555555';
const ejercicio = (exerciseKey: string, o: Partial<EjercicioDelPeriodo> = {}): EjercicioDelPeriodo => ({
  exerciseKey,
  name: 'Sentadilla',
  otherNames: [],
  homonym: false,
  sessions: 8,
  setNumbers: [1, 2, 3],
  loadUnits: ['kg'],
  lastDate: '2026-10-08',
  ...o,
});

const CONTEXTO: ContextoDeLaPregunta = {
  hoy: HOY,
  maximoDeDias: 366,
  areas: new Set(['NUTRICION', 'ENTRENAMIENTO']),
  etapas: { NUTRITION: etapasDelArea(VIGENCIAS, 'NUTRITION', HOY, AHORA), TRAINING: [] },
  ejercicios: [ejercicio(SENTADILLA)],
  medidas: new Set(['antropometria.peso', 'antropometria.perimetro-cintura']),
};

test('ninguna pregunta elige un ejercicio, una medida ni una versión por la persona: lo pide', () => {
  assert.deepEqual(resolverPregunta('progreso-de-un-ejercicio', {}, CONTEXTO), { estado: 'FALTA_ELEGIR', requisitos: ['EJERCICIO'], noAplican: [] });
  assert.deepEqual(resolverPregunta('alimentacion-y-medidas', {}, CONTEXTO), { estado: 'FALTA_ELEGIR', requisitos: ['MEDIDA_CORPORAL'], noAplican: [] });
  assert.deepEqual(resolverPregunta('cambio-desde-el-plan', { area: 'NUTRICION' }, CONTEXTO), { estado: 'FALTA_ELEGIR', requisitos: ['VERSION'], noAplican: [] });
  assert.deepEqual(resolverPregunta('comparar-etapas', { area: 'NUTRICION', stageA: V1, stageB: V1 }, CONTEXTO), { estado: 'FALTA_ELEGIR', requisitos: ['ETAPAS'], noAplican: ['ETAPAS'] });
  // Con el ejercicio elegido, la serie y la unidad también se eligen (se ofrecen las registradas).
  assert.deepEqual(resolverPregunta('progreso-de-un-ejercicio', { exerciseKey: SENTADILLA }, CONTEXTO), { estado: 'FALTA_ELEGIR', requisitos: ['SERIE', 'UNIDAD'], noAplican: [] });
});

test('lo elegido para otro asesorado no aplica: se dice y se vuelve a pedir, nunca se sustituye', () => {
  const r = resolverPregunta('progreso-de-un-ejercicio', { exerciseKey: DE_OTRO, setIndex: 1, unit: 'kg' }, CONTEXTO);
  assert.deepEqual(r, { estado: 'FALTA_ELEGIR', requisitos: ['EJERCICIO'], noAplican: ['EJERCICIO'] });
  const v = resolverPregunta('cambio-desde-el-plan', { area: 'NUTRICION', planVersionId: '99999999-9999-4999-8999-999999999999' }, CONTEXTO);
  assert.deepEqual(v, { estado: 'FALTA_ELEGIR', requisitos: ['VERSION'], noAplican: ['VERSION'] });
  const m = resolverPregunta('alimentacion-y-medidas', { bodyMetric: 'antropometria.suma-6-pliegues-isak' }, CONTEXTO);
  assert.deepEqual(m, { estado: 'FALTA_ELEGIR', requisitos: ['MEDIDA_CORPORAL'], noAplican: ['MEDIDA_CORPORAL'] });
  // Un área que el PDP no deja ver tampoco aplica.
  assert.deepEqual(resolverPregunta('registrado-vs-indicado', { area: 'ENTRENAMIENTO' }, { ...CONTEXTO, areas: new Set(['NUTRICION']) }), { estado: 'FALTA_ELEGIR', requisitos: ['AREA'], noAplican: ['AREA'] });
  assert.equal(traeSeleccionesDelAsesorado({ exerciseKey: SENTADILLA, setIndex: 1 }), true);
  assert.equal(traeSeleccionesDelAsesorado({ area: 'NUTRICION', bodyMetric: 'antropometria.peso' }), false);
});

test('cada pregunta lista arma hasta tres métricas, con la etapa como período cuando corresponde', () => {
  const progreso = resolverPregunta('progreso-de-un-ejercicio', { exerciseKey: SENTADILLA, setIndex: 2, unit: 'kg' }, CONTEXTO);
  assert.equal(progreso.estado, 'LISTA');
  if (progreso.estado !== 'LISTA' || progreso.destino.tipo !== 'ANALIZAR') throw new Error('debía analizar');
  assert.deepEqual(
    progreso.destino.metricas.map((m) => [m.metricId, m.exerciseKey, m.setIndex, m.unit]),
    [
      ['entrenamiento.carga', SENTADILLA, 2, 'kg'],
      ['entrenamiento.repeticiones', SENTADILLA, 2, null],
      ['entrenamiento.rir', SENTADILLA, 2, null],
    ],
  );
  const desdeElPlan = resolverPregunta('cambio-desde-el-plan', { area: 'NUTRICION', planVersionId: V1 }, CONTEXTO);
  if (desdeElPlan.estado !== 'LISTA' || desdeElPlan.destino.tipo !== 'ANALIZAR') throw new Error('debía analizar');
  assert.deepEqual(desdeElPlan.destino.periodo, { desde: '2026-07-01', hasta: '2026-07-31', recortado: false });
  assert.equal(desdeElPlan.destino.etapa?.etiqueta, 'v1');
  const etapas = resolverPregunta('comparar-etapas', { area: 'NUTRICION', stageA: V3, stageB: V1 }, CONTEXTO);
  if (etapas.estado !== 'LISTA' || etapas.destino.tipo !== 'ETAPAS') throw new Error('debía comparar etapas');
  assert.deepEqual([etapas.destino.a.etiqueta, etapas.destino.b.etiqueta], ['v1', 'v3'], 'A es siempre la anterior');
  for (const p of PREGUNTAS_PROFESIONALES) {
    const r = resolverPregunta(p.id, { area: 'NUTRICION', planVersionId: V1, stageA: V1, stageB: V3, bodyMetric: 'antropometria.peso', exerciseKey: SENTADILLA, setIndex: 1, unit: 'kg' }, CONTEXTO);
    assert.equal(r.estado, 'LISTA', p.id);
    if (r.estado === 'LISTA' && r.destino.tipo === 'ANALIZAR') assert.ok(r.destino.metricas.length <= MAXIMO_DE_METRICAS, p.id);
  }
  assert.deepEqual(requisitosDe('registrado-vs-indicado', { area: 'ENTRENAMIENTO' }), ['AREA', 'EJERCICIO']);
  assert.equal(PREGUNTAS_PROFESIONALES.filter((p) => p.principal).length, 4, 'pocas a la vista; el resto en «Más preguntas»');
});

test('los parámetros de una pregunta son identificadores: el texto libre y las claves desconocidas se rechazan; las vistas viejas siguen valiendo', () => {
  assert.equal(ParametrosDePreguntaSchema.safeParse({ bodyMetric: 'peso de la persona' }).success, false);
  assert.equal(ParametrosDePreguntaSchema.safeParse({ nota: 'texto' }).success, false);
  // Una versión de plan es un UUID: un texto no viaja en la URL ni queda en una vista guardada.
  for (const campo of ['planVersionId', 'stageA', 'stageB']) assert.equal(ParametrosDePreguntaSchema.safeParse({ [campo]: 'texto libre de la persona' }).success, false, campo);
  assert.equal(ParametrosDePreguntaSchema.safeParse({ area: 'NUTRICION', stageA: '11111111-1111-4111-8111-111111111111', stageB: '22222222-2222-4222-8222-222222222222' }).success, true);
  assert.equal(ParametrosDePreguntaSchema.safeParse({ exerciseKey: SENTADILLA, setIndex: 1, unit: 'kg' }).success, true);
  const vieja = {
    schemaVersion: 1,
    metrics: [{ metricId: 'nutricion.energia', exerciseKey: null, setIndex: null, unit: null }],
    mode: 'PANELS',
    grain: 'DAY',
    period: { kind: 'LAST_DAYS', days: 30 },
    layers: { planBands: true, events: true },
    reference: { kind: 'FIRST_DAYS', days: 7 },
    comparison: null,
  };
  assert.equal(ConfiguracionDeAnalisisSchema.safeParse(vieja).success, true);
  assert.equal(ConfiguracionDeAnalisisSchema.safeParse({ ...vieja, question: { id: 'progreso-de-un-ejercicio', params: { exerciseKey: SENTADILLA, setIndex: 1, unit: 'kg' } } }).success, true);
  assert.equal(ConfiguracionDeAnalisisSchema.safeParse({ ...vieja, question: { id: 'otra-pregunta', params: {} } }).success, false);
});

// ─── Síntesis del Resumen (eje 1) ───────────────────────────────────────────────────────────────

const PRO = { identityId: '66666666-6666-4666-8666-666666666666', displayName: 'Lic. Sintética' };
const REVISION = '77777777-7777-4777-8777-777777777777';
const BORRADOR = '88888888-8888-4888-8888-888888888888';
const OBJETIVO = '99999999-9999-4999-8999-999999999990';
const TOMA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const nutricion = (o: Partial<ResumenDeNutricion> = {}): ResumenDeNutricion => ({
  activePlan: { planVersionId: V3, activatedAt: '2026-09-25T13:00:00.000Z', nextReviewAt: '2026-10-12' },
  objective: { objectiveVersionId: OBJETIVO, estimatedEnergyRequirement: { value: 1950, unit: 'kcal/day' }, authoredBy: PRO, effectiveFrom: '2026-09-25T13:00:00.000Z' },
  lastReview: { reviewId: REVISION, recordedAt: CORTE, author: PRO, application: { appliedAt: '2026-09-20T15:10:00.000Z', createdPlanId: V3, createdObjectiveVersionId: OBJETIVO } },
  draftPlan: null,
  registeredIntakes: 40,
  lastIntakeAt: '2026-10-09T13:00:00.000Z',
  ...o,
});

const entrenamiento = (o: Partial<ResumenDeEntrenamiento> = {}): ResumenDeEntrenamiento => ({
  activePlan: { planVersionId: V1, activatedAt: '2026-07-01T12:00:00.000Z', nextReviewAt: '2026-11-30' },
  objective: { objectiveVersionId: OBJETIVO, statement: 'Objetivo sintético', authoredBy: PRO, effectiveFrom: '2026-07-01T12:00:00.000Z' },
  lastReview: null,
  draftPlan: null,
  registeredExecutions: 12,
  lastExecutionAt: '2026-10-08T13:00:00.000Z',
  ...o,
});

const antropometria: ResumenDeAntropometria = { lastEvaluation: { evaluationId: TOMA, occurredAt: '2026-10-08T11:00:00.000Z', registeredAt: '2026-10-08T11:30:00.000Z', author: PRO }, registeredEvaluations: 3 };

const novedades = (counts: NovedadesDesde['counts']) => ({ estado: 'LISTA' as const, valor: { conteos: { since: CORTE, counts }, leidoDesde: '2025-10-09' } });

const DATOS: DatosDeLaSintesis = {
  hoy: HOY,
  zonaHoraria: ZONA,
  periodo: { desde: '2026-07-12', hasta: HOY },
  nutricion: {
    resumen: nutricion(),
    novedades: novedades([
      { kind: 'OCURRIO_DESPUES', domain: 'NUTRITION', eventType: 'MEAL_RECORDED', count: 34 },
      { kind: 'OCURRIO_DESPUES', domain: 'NUTRITION', eventType: 'NUTRITION_PLAN_ACTIVATED', count: 1 },
      { kind: 'OCURRIO_DESPUES', domain: 'TRAINING', eventType: 'TRAINING_SESSION_RECORDED', count: 9 },
      { kind: 'INCORPORADO_DESPUES', domain: 'NUTRITION', eventType: 'MEAL_RECORDED', count: 3 },
      { kind: 'CORREGIDO_DESPUES', domain: 'NUTRITION', eventType: 'MEAL_RECORDED', count: 2 },
    ]),
    cobertura: {
      estado: 'LISTA',
      valor: { daysInPeriod: 90, daysWithRecords: 52, records: 280, recordsWithQuantities: 272, recordsWithoutQuantities: 8, differentMealsWithoutQuantities: 4, annulledExcluded: 2, rectifiedCountedOnce: 2 },
    },
  },
  entrenamiento: { resumen: entrenamiento(), novedades: { estado: 'NO_APLICA' }, cobertura: { estado: 'LISTA', valor: { sesiones: 23, conCambios: 1, noRealizadas: 1, resumidas: 1 } } },
  antropometria: { resumen: antropometria, comparabilidad: { estado: 'LISTA', valor: [{ metricCode: 'peso', nombre: 'Peso', grupos: 2 }, { metricCode: 'talla', nombre: 'Talla', grupos: 1 }] } },
};

const FORMATO: FormatoDeLaSintesis = { fecha: (f) => `${Number(f.slice(8, 10))}/${Number(f.slice(5, 7))}`, dia: (i) => `${Number(i.slice(8, 10))}/${Number(i.slice(5, 7))}` };

test('la síntesis prioriza pendientes, después planificación y comparabilidad, información nueva y cobertura; cada área con su corte', () => {
  const s = sintesisDelResumen(DATOS);
  assert.deepEqual(
    s.map((o) => `${o.prioridad}:${claveDeObservacion(o)}`),
    [
      '1:NUTRICION:PROXIMA_REVISION',
      '2:NUTRICION:PLAN_ACTIVADO_DESPUES_DEL_CORTE',
      '2:NUTRICION:OBJETIVO_NUEVO_DESPUES_DEL_CORTE',
      '2:ANTROPOMETRIA:CAMBIO_DE_COMPARABILIDAD',
      '3:NUTRICION:NOVEDADES_DESDE_EL_CORTE',
      '3:ANTROPOMETRIA:ULTIMA_TOMA',
      '4:NUTRICION:COBERTURA_NUTRICIONAL',
      '4:ENTRENAMIENTO:COBERTURA_DE_ENTRENAMIENTO',
    ],
  );
  const novedad = s.find((o) => o.regla === 'NOVEDADES_DESDE_EL_CORTE');
  assert.ok(novedad && novedad.regla === 'NOVEDADES_DESDE_EL_CORTE');
  // Solo lo de Nutrición: las 9 sesiones de Entrenamiento no se cuentan en el corte de Nutrición.
  assert.deepEqual([novedad.args.ocurrieron, novedad.args.incorporadas, novedad.args.corregidas], [34, 3, 2]);
  assert.equal(textoDeObservacion(novedad, FORMATO), '34 comidas registradas, 3 hechos anteriores cargados después y 2 registros anteriores corregidos o anulados.');
  assert.equal(textoDelAlcance(novedad.alcance, FORMATO), 'Desde la revisión del 20/9');
  assert.deepEqual(novedad.accion, { tipo: 'LINEA_DE_TIEMPO', dominio: 'NUTRITION', desde: CORTE });
  // Entrenamiento no tiene revisión: no hay novedades «desde»; su cobertura es del período seleccionado.
  const cobertura = s.find((o) => o.regla === 'COBERTURA_DE_ENTRENAMIENTO');
  assert.equal(textoDelAlcance(cobertura!.alcance, FORMATO), 'En el período seleccionado');
  assert.equal(textoDeObservacion(cobertura!, FORMATO), '23 sesiones registradas (1 con cambios, 1 registrada como no realizada, 1 resumida, sin series).');
  // El objetivo nuevo salió de aplicar la revisión: se dice así.
  assert.match(textoDeObservacion(s.find((o) => o.regla === 'OBJETIVO_NUEVO_DESPUES_DEL_CORTE')!, FORMATO), /creado al aplicar la última revisión/);
});

test('pendientes explícitos: revisión sin aplicar, próxima revisión cercana o pasada y borrador sin activar', () => {
  const s = sintesisDelResumen({
    ...DATOS,
    nutricion: {
      ...DATOS.nutricion!,
      resumen: nutricion({
        lastReview: { reviewId: REVISION, recordedAt: CORTE, author: PRO, application: null },
        activePlan: { planVersionId: V3, activatedAt: '2026-09-01T13:00:00.000Z', nextReviewAt: '2026-10-05' },
        objective: null,
        draftPlan: { planVersionId: BORRADOR, recordedAt: '2026-10-07T12:00:00.000Z', fromReviewId: null },
      }),
    },
  });
  const pendientes = s.filter((o) => o.prioridad === 1).map((o) => o.regla);
  assert.deepEqual(pendientes, ['REVISION_SIN_APLICAR', 'PROXIMA_REVISION', 'BORRADOR_SIN_ACTIVAR']);
  assert.equal(textoDeObservacion(s[0]!, FORMATO), 'La revisión del 20/9 está registrada y su resultado todavía no se aplicó.');
  assert.equal(textoDeObservacion(s[1]!, FORMATO), 'La próxima revisión acordada era el 5/10 (hace 4 días).');
  assert.equal(textoDeObservacion(s[2]!, FORMATO), 'Hay una versión nueva del plan en borrador, creada el 7/10. No rige hasta que se active.');
  // Sin número: el `version` del borrador es su token de concurrencia, y el número para la persona es el orden de activación.
  assert.doesNotMatch(textoDeObservacion(s[2]!, FORMATO), /versión \d/);
  assert.deepEqual(s[2]!.accion, { tipo: 'PLANIFICACION', area: 'NUTRICION', planVersionId: BORRADOR });
  // Una revisión acordada para dentro de un mes todavía no es un pendiente.
  const lejos = sintesisDelResumen({ ...DATOS, nutricion: { ...DATOS.nutricion!, resumen: nutricion({ activePlan: { planVersionId: V3, activatedAt: '2026-09-25T13:00:00.000Z', nextReviewAt: '2026-11-20' } }) } });
  assert.equal(lejos.some((o) => o.regla === 'PROXIMA_REVISION'), false);
});

test('la cobertura dice desde cuándo rige el plan si empezó dentro del período: «1 de 90 días» no son 89 días sin registrar', () => {
  const vigencia = (from: string, to: string | null) => ({ domain: 'NUTRITION' as const, planVersionId: V3, label: 'v1', activatedAt: `${from}T06:01:00.000Z`, from, to, endedAt: null, endReason: null });
  const conPlanDeHoy = sintesisDelResumen({
    ...DATOS,
    nutricion: {
      ...DATOS.nutricion!,
      vigencias: [vigencia(HOY, null)],
      cobertura: { estado: 'LISTA', valor: { daysInPeriod: 90, daysWithRecords: 1, records: 2, recordsWithQuantities: 1, recordsWithoutQuantities: 1, differentMealsWithoutQuantities: 0, annulledExcluded: 0, rectifiedCountedOnce: 0 } },
    },
  });
  const cobertura = conPlanDeHoy.find((o) => o.regla === 'COBERTURA_NUTRICIONAL')!;
  assert.equal(
    textoDeObservacion(cobertura, FORMATO),
    '1 de 90 días con algún registro; 2 registros: 1 con cantidades y 1 sin cantidades. El plan rige desde el 9/10: antes, en el período, no había un plan de este seguimiento.',
  );
  // Un plan que ya regía al empezar el período (aunque después lo sucediera otro) no agrega nada.
  assert.equal(primerPlanDelPeriodo([vigencia('2026-06-01', '2026-09-25'), vigencia('2026-09-25', null)], '2026-07-12'), null);
  assert.equal(primerPlanDelPeriodo([vigencia('2026-09-25', null), vigencia('2026-08-01', '2026-09-25')], '2026-07-12'), '2026-08-01');
  assert.equal(primerPlanDelPeriodo([], '2026-07-12'), null);
  assert.equal(primerPlanDelPeriodo(undefined, '2026-07-12'), null);
  // Sin vigencias en los datos (como antes), el texto no cambia.
  assert.doesNotMatch(textoDeObservacion(sintesisDelResumen(DATOS).find((o) => o.regla === 'COBERTURA_NUTRICIONAL')!, FORMATO), /rige desde/);
});

test('una lectura que falló se dice y un área no autorizada no aporta nada', () => {
  const s = sintesisDelResumen({ ...DATOS, nutricion: { ...DATOS.nutricion!, novedades: { estado: 'FALLO' }, cobertura: { estado: 'FALLO' } }, entrenamiento: null });
  const fallas = s.filter((o) => o.regla === 'PARTE_NO_DISPONIBLE');
  assert.deepEqual(fallas.map((o) => textoDeObservacion(o, FORMATO)), ['No pudimos completar esta parte (lo nuevo desde la revisión).', 'No pudimos completar esta parte (la cobertura del período).']);
  // Lo que falta va primero, entre las cuatro a la vista: escondido detrás de «Ver todas», la síntesis parecía completa.
  assert.deepEqual(s.slice(0, 2).map((o) => o.regla), ['PARTE_NO_DISPONIBLE', 'PARTE_NO_DISPONIBLE']);
  assert.ok(fallas.every((o) => o.prioridad === 1));
  assert.equal(s.some((o) => o.area === 'ENTRENAMIENTO'), false);
});

test('un corte anterior a lo que se pudo leer se dice; sin novedades, también', () => {
  const vieja = sintesisDelResumen({
    ...DATOS,
    nutricion: { ...DATOS.nutricion!, resumen: nutricion({ lastReview: { reviewId: REVISION, recordedAt: '2025-06-01T12:00:00.000Z', author: PRO, application: { appliedAt: '2025-06-01T12:10:00.000Z', createdPlanId: null, createdObjectiveVersionId: null } } }), novedades: novedades([]) },
  });
  const o = vieja.find((x) => x.regla === 'NOVEDADES_DESDE_EL_CORTE')!;
  assert.equal(textoDeObservacion(o, FORMATO), 'No hay registros nuevos, cargas tardías ni correcciones. Se revisó desde el 9/10: el máximo de lectura es un año.');
});

test('ninguna plantilla califica a la persona ni a su desempeño', () => {
  const variantes: DatosDeLaSintesis[] = [
    DATOS,
    { ...DATOS, nutricion: { ...DATOS.nutricion!, resumen: nutricion({ lastReview: { reviewId: REVISION, recordedAt: CORTE, author: PRO, application: null }, draftPlan: { planVersionId: BORRADOR, recordedAt: '2026-10-07T12:00:00.000Z', fromReviewId: REVISION }, activePlan: { planVersionId: V3, activatedAt: '2026-09-25T13:00:00.000Z', nextReviewAt: HOY } }), novedades: { estado: 'FALLO' } } },
    { ...DATOS, entrenamiento: { ...DATOS.entrenamiento!, cobertura: { estado: 'LISTA', valor: { sesiones: 0, conCambios: 0, noRealizadas: 0, resumidas: 0 } } }, antropometria: { resumen: { lastEvaluation: antropometria.lastEvaluation, registeredEvaluations: 0 }, comparabilidad: { estado: 'FALLO' } } },
  ];
  for (const d of variantes) {
    for (const o of sintesisDelResumen(d)) {
      const texto = `${textoDelAlcance(o.alcance, FORMATO)} ${textoDeObservacion(o, FORMATO)}`;
      assert.doesNotMatch(texto, PALABRAS_QUE_CALIFICAN, `${claveDeObservacion(o)}: ${texto}`);
    }
  }
});

// ─── Contraste de una comida con lo indicado (eje 2) ────────────────────────────────────────────

test('una comida contra su opción indicada: sin confirmar sigue sin confirmar, una diferente queda afuera y la diferencia es una resta', () => {
  const opcion = {
    optionId: '10000000-0000-4000-8000-000000000001',
    label: 'Arroz con pollo',
    order: 1,
    recipe: null,
    image: null,
    items: [
      { itemId: '10000000-0000-4000-8000-0000000000a1', catalogItemVersionId: '10000000-0000-4000-8000-0000000000b1', name: 'Arroz', quantity: { value: 120, unit: 'g' as const }, preparationState: null, note: null },
      { itemId: '10000000-0000-4000-8000-0000000000a2', catalogItemVersionId: '10000000-0000-4000-8000-0000000000b2', name: 'Pollo', quantity: { value: 150, unit: 'g' as const }, preparationState: null, note: null },
      { itemId: '10000000-0000-4000-8000-0000000000a3', catalogItemVersionId: '10000000-0000-4000-8000-0000000000b3', name: 'Aceite', quantity: null, preparationState: null, note: null },
    ],
    planned: { energyKcal: { value: null, missing: [] }, carbohydrateG: { value: null, missing: [] }, fatG: { value: null, missing: [] }, proteinG: { value: null, missing: [] }, fiberG: { value: null, missing: [] } },
  };
  const sinConfirmar = contrasteDeLaComida({ kind: 'PLAN_OPTION', option: opcion, consumption: { status: 'UNCONFIRMED', items: [], source: 'ORIGINAL', rectifiedAt: null }, description: null });
  if (sinConfirmar.tipo !== 'CON_LA_OPCION') throw new Error('con la opción');
  assert.ok(sinConfirmar.filas.every((f) => f.estado === 'SIN_CONFIRMAR' && f.registrado === 'sin confirmar'));
  const informada = contrasteDeLaComida({
    kind: 'PLAN_OPTION',
    option: opcion,
    consumption: {
      status: 'REPORTED',
      items: [
        { itemId: '10000000-0000-4000-8000-0000000000a1', quantity: { value: 100, unit: 'g' }, notEaten: false },
        { itemId: '10000000-0000-4000-8000-0000000000a2', quantity: null, notEaten: true },
        { itemId: '10000000-0000-4000-8000-0000000000a3', quantity: { value: 5, unit: 'ml' }, notEaten: false },
      ],
      source: 'ORIGINAL',
      rectifiedAt: null,
    },
    description: null,
  });
  if (informada.tipo !== 'CON_LA_OPCION') throw new Error('con la opción');
  assert.deepEqual(informada.filas.map(filaEnPalabras), [
    'Arroz: indicado 120 g · registrado 100 g (−20 g)',
    'Pollo: indicado 150 g · registrado no lo comió',
    'Aceite: indicado sin cantidad indicada · registrado 5 ml',
  ]);
  assert.deepEqual(contrasteDeLaComida({ kind: 'DIFFERENT', option: null, consumption: null, description: 'Una pizza' }), { tipo: 'FUERA_DE_LO_INDICADO', descripcion: 'Una pizza' });
  for (const f of informada.filas) assert.doesNotMatch(filaEnPalabras(f), /%|cumpl|adherencia/i);
});

test('comparar dos etapas arma las métricas del área: en entrenamiento pide el ejercicio, la serie y la unidad', () => {
  const nut = resolverPregunta('comparar-etapas', { area: 'NUTRICION', stageA: V1, stageB: V3, bodyMetric: 'antropometria.peso' }, CONTEXTO);
  if (nut.estado !== 'LISTA' || nut.destino.tipo !== 'ETAPAS') throw new Error('debía comparar etapas');
  assert.deepEqual(nut.destino.metricas.map((m) => m.metricId), ['nutricion.energia', 'nutricion.proteinas', 'antropometria.peso']);
  const trn = resolverPregunta('comparar-etapas', { area: 'ENTRENAMIENTO', stageA: V1, stageB: V3 }, { ...CONTEXTO, etapas: { NUTRITION: [], TRAINING: etapasDelArea(VIGENCIAS.map((v) => ({ ...v, domain: 'TRAINING' as const })), 'TRAINING', HOY, AHORA) } });
  assert.deepEqual(trn, { estado: 'FALTA_ELEGIR', requisitos: ['EJERCICIO'], noAplican: [] });
});
