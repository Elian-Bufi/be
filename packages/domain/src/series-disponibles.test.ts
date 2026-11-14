/**
 * WP-GRAFICOS fase 2 (DL-174), la base del dominio: el catálogo de series, la composición de «Armá tu gráfico», la frase
 * de la coincidencia, la guardia de vocabulario unida, las marcas por su sentido, los IDs de los sugeridos y el ruido de
 * la estimación. TEST-GRF-001 a TEST-GRF-009; cada una dice la mutación que la tiene que hacer fallar.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { PuntoAnalitico, VigenciaDePlan } from './contratos-analisis';
import type { PuntoDeFuerza } from './contratos-fuerza';
import { DETALLE_DE_CARGA_RAPIDA } from './series-del-analisis';
import { GRAFICOS_SUGERIDOS, IdDeGraficoSchema, esIdDeGrafico, graficoSugerido } from './graficos-sugeridos';
import { cambioDeLoIndicado, lecturaPorVersion } from './lectura-de-la-estimacion';
import { MARCA_SEGUN_EL_DATO, marcaDelPunto, marcaDelPuntoDeFuerza } from './marcas-de-los-graficos';
import { definicionDeMetrica } from './metricas-del-analisis';
import { OPERACIONES } from './openapi';
import {
  SERIES_DISPONIBLES,
  composicionPermitida,
  ejesCompatibles,
  fraseDeLaCoincidencia,
  serieDisponible,
  seriesOfrecidas,
  type AccesoDeLaPersona,
  type SerieDisponible,
  type SerieElegida,
} from './series-disponibles';
import { FRASE_DE_LA_COINCIDENCIA, terminosProhibidosEnUnGrafico } from './vocabulario-de-los-graficos';

const ALCANCE_DEL_AREA = { NUTRICION: 'NUTRICION', ENTRENAMIENTO: 'ENTRENAMIENTO', ANTROPOMETRIA: 'ANTROPOMETRIA' } as const;
const serie = (id: string, unidad?: string): SerieDisponible => {
  const s = serieDisponible(id, unidad);
  assert.ok(s, `el catálogo no tiene ${id}`);
  return s;
};
const elegida = (id: string, unidad?: string): SerieElegida => {
  const s = serie(id, unidad);
  return { serie: s, unidad: unidad ?? s.definicion.unidad };
};
const acceso = (alcances: AccesoDeLaPersona['alcances'], propios: Partial<AccesoDeLaPersona['propios']> = {}): AccesoDeLaPersona => ({
  alcances,
  propios: { NUTRICION: false, ENTRENAMIENTO: false, ANTROPOMETRIA: false, ...propios },
});

test('TEST-GRF-001 · cada serie del catálogo tiene su área, su eje X, una fuente que existe en openapi.ts, sus alcances y su método si es derivada (mutación: una serie de Nutrición sin NUTRICION)', () => {
  const ids = new Set(OPERACIONES.map((o) => o.id));
  assert.equal(new Set(SERIES_DISPONIBLES.map((s) => s.id)).size, SERIES_DISPONIBLES.length, 'hay un identificador repetido');
  for (const s of SERIES_DISPONIBLES) {
    assert.match(s.id, /^(nutricion|entrenamiento|antropometria)\.[a-z0-9-]+$/, s.id);
    assert.equal(s.definicion.id, s.id, s.id);
    assert.ok(['FECHA', 'SESION', 'SEMANA'].includes(s.ejeX), s.id);
    assert.ok(s.acceso.alcances.includes(ALCANCE_DEL_AREA[s.definicion.area]), `${s.id} no pide el alcance de su área`);
    if (s.fuente.tipo === 'PROYECCION') assert.ok(ids.has(s.fuente.operacion), s.id);
    if (s.fuente.tipo === 'CONTEXTO_DE_REVISION') for (const o of s.fuente.operaciones) assert.ok(ids.has(o), `${s.id}: ${o}`);
    if (s.fuente.tipo === 'DERIVADA') {
      assert.ok(s.metodo, `${s.id} es derivada y no dice su método`);
      for (const de of s.fuente.de) assert.ok(serieDisponible(de), `${s.id} deriva de ${de}, que no está`);
    }
  }
  // La fuerza dice su método en pantalla, y solo la ve el profesional (DL-171).
  const fuerza = serie('entrenamiento.1rm-estimado');
  assert.equal(fuerza.metodo?.rotulo, '1RM estimado (Epley v1)');
  assert.equal(fuerza.acceso.soloProfesional, true);
  assert.deepEqual(fuerza.rangoMinimoDelEje, { kg: 10, lb: 22 });
  assert.equal(fuerza.definicion.cambioRelativo, false);
});

test('TEST-GRF-002 · seriesOfrecidas no ofrece nada de un área sin acceso, y los g/kg solo con las dos áreas y lo propio en las dos (mutación: con una)', () => {
  const soloNutricion = seriesOfrecidas(acceso(['NUTRICION'], { NUTRICION: true }));
  assert.ok(soloNutricion.length > 0);
  assert.ok(soloNutricion.every((s) => s.definicion.area === 'NUTRICION'));
  assert.ok(!soloNutricion.some((s) => s.id.endsWith('-por-kilo')));
  assert.deepEqual(seriesOfrecidas(acceso([])), []);
  // Ninguna serie EN_PREPARACION o PIDE_DL se ofrece, ni con todos los alcances.
  const todo = seriesOfrecidas(acceso(['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'], { NUTRICION: true, ENTRENAMIENTO: true, ANTROPOMETRIA: true }));
  assert.ok(todo.every((s) => s.estado === 'OFRECIDA'));
  assert.ok(!todo.some((s) => s.id === 'entrenamiento.volumen-carga-externa' || s.id === 'nutricion.energia-prevista-del-dia'));
  // Una serie de dos áreas, si se ofreciera, pide lo propio en las dos.
  const porKilo = { ...serie('nutricion.proteinas-por-kilo'), estado: 'OFRECIDA' as const };
  const ofrecida = (a: AccesoDeLaPersona) => a.alcances.length > 0 && porKilo.acceso.alcances.every((x) => a.alcances.includes(x)) && porKilo.acceso.alcances.every((x) => a.propios[x]);
  assert.equal(ofrecida(acceso(['NUTRICION'], { NUTRICION: true })), false);
  assert.equal(ofrecida(acceso(['NUTRICION', 'ANTROPOMETRIA'], { NUTRICION: true })), false);
  assert.equal(ofrecida(acceso(['NUTRICION', 'ANTROPOMETRIA'], { NUTRICION: true, ANTROPOMETRIA: true })), true);
  assert.deepEqual(porKilo.acceso.alcances, ['NUTRICION', 'ANTROPOMETRIA']);
});

test('TEST-GRF-003 · composicionPermitida: tres unidades, semana con sesión y cuatro series no se superponen; dos unidades van una a cada lado (mutación: dejar tres unidades)', () => {
  const kg = elegida('entrenamiento.carga', 'kg');
  const rir = elegida('entrenamiento.rir');
  const energia = elegida('nutricion.energia');
  const carbohidratos = elegida('nutricion.carbohidratos');
  const tres = composicionPermitida([kg, carbohidratos, rir], 'OVERLAY');
  assert.equal(tres.permitida, false);
  assert.equal(tres.motivo, 'MAS_DE_DOS_UNIDADES');
  const semanal = { serie: { ...serie('entrenamiento.series-registradas'), ejeX: 'SEMANA' as const }, unidad: 'series' };
  assert.equal(composicionPermitida([semanal, kg], 'OVERLAY').motivo, 'EJE_X_DISTINTO');
  assert.equal(ejesCompatibles('FECHA', 'SESION'), true);
  assert.equal(ejesCompatibles('SEMANA', 'SEMANA'), true);
  assert.equal(ejesCompatibles('SEMANA', 'FECHA'), false);
  assert.equal(composicionPermitida([kg, rir, energia, carbohidratos], 'PANELS').motivo, 'MAS_DE_TRES');
  assert.equal(composicionPermitida([], 'PANELS').motivo, 'NINGUNA');
  const dos = composicionPermitida([carbohidratos, kg], 'OVERLAY');
  assert.equal(dos.permitida, true);
  assert.deepEqual(
    dos.ejesY.map((e) => [e.lado, e.unidad]),
    [
      ['IZQUIERDA', 'g'],
      ['DERECHA', 'kg'],
    ],
  );
  // Misma familia y unidad comparten eje (DL-126): proteínas y carbohidratos, un solo eje.
  const mismoEje = composicionPermitida([carbohidratos, elegida('nutricion.proteinas')], 'OVERLAY');
  assert.equal(mismoEje.ejesY.length, 1);
  assert.deepEqual(mismoEje.ejesY[0].series, ['nutricion.carbohidratos', 'nutricion.proteinas']);
  // Alineadas admite cualquier mezcla de hasta tres, un eje por serie.
  assert.equal(composicionPermitida([kg, carbohidratos, rir], 'PANELS').ejesY.length, 3);
});

test('TEST-GRF-004 · la frase va con dos áreas o con dos ejes, en cualquier modo (mutación: sacarla)', () => {
  const kg = elegida('entrenamiento.carga', 'kg');
  const rir = elegida('entrenamiento.rir');
  const carbohidratos = elegida('nutricion.carbohidratos');
  assert.equal(fraseDeLaCoincidencia([kg, carbohidratos], 'PANELS', 2), FRASE_DE_LA_COINCIDENCIA);
  assert.equal(composicionPermitida([kg, carbohidratos], 'PANELS').frase, FRASE_DE_LA_COINCIDENCIA);
  assert.equal(composicionPermitida([kg, rir], 'OVERLAY').frase, FRASE_DE_LA_COINCIDENCIA);
  assert.equal(composicionPermitida([kg, rir], 'PANELS').frase, null);
  assert.equal(composicionPermitida([kg], 'OVERLAY').frase, null);
  assert.equal(FRASE_DE_LA_COINCIDENCIA, 'Coinciden en el tiempo; esto no prueba que una cosa cause la otra.');
});

test('TEST-GRF-005 · la guardia une las listas de las áreas del gráfico, cada una con su regla (mutación: aplicar solo la de la primera área)', () => {
  // El porcentaje: prohibido con Nutrición aunque también esté Antropometría; «% RM» admitido solo en Entrenamiento.
  assert.ok(terminosProhibidosEnUnGrafico('Grasa corporal 18 %', ['ANTROPOMETRIA', 'NUTRICION']).includes('%'));
  assert.deepEqual(terminosProhibidosEnUnGrafico('Grasa corporal 18 %', ['ANTROPOMETRIA']), []);
  assert.deepEqual(terminosProhibidosEnUnGrafico('Carga al 80 % RM', ['ENTRENAMIENTO']), []);
  assert.ok(terminosProhibidosEnUnGrafico('Carga al 80 % RM', ['ENTRENAMIENTO', 'NUTRICION']).includes('%'));
  // La lista de la segunda área también cuenta.
  assert.ok(terminosProhibidosEnUnGrafico('El volumen de la semana', ['NUTRICION', 'ENTRENAMIENTO']).includes('volumen'));
  assert.ok(terminosProhibidosEnUnGrafico('Récord de la persona', ['ANTROPOMETRIA', 'ENTRENAMIENTO']).includes('récord'));
  // La negación que admite Antropometría no la salva de Nutrición; y lo de todo gráfico va también negado.
  assert.deepEqual(terminosProhibidosEnUnGrafico('Esto no es un diagnóstico', ['ANTROPOMETRIA']), []);
  assert.ok(terminosProhibidosEnUnGrafico('Sin puntaje ni racha', ['NUTRICION']).includes('puntaje'));
  assert.ok(terminosProhibidosEnUnGrafico('La persona asesorada', ['ANTROPOMETRIA']).includes('asesorada'));
  assert.deepEqual(terminosProhibidosEnUnGrafico(FRASE_DE_LA_COINCIDENCIA, ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']), []);
  // Los textos que define el catálogo pasan por la guardia de su área. Los del diccionario de DL-126 los revisa la rama
  // que pase «Analizar» al catálogo (D): dos de ellos tienen hoy un término prohibido, en negación (registros y carga).
  for (const s of SERIES_DISPONIBLES.filter((x) => x.estado !== 'PIDE_DL')) {
    const propia = s.definicion !== definicionDeMetrica(s.id);
    const textos = [s.metodo?.rotulo ?? '', ...(propia ? [s.definicion.nombre, s.definicion.nombreCorto, s.definicion.explicacion, s.definicion.comoSeCalcula, s.definicion.ausencias, ...s.definicion.limites] : [])];
    for (const t of textos) assert.deepEqual(terminosProhibidosEnUnGrafico(t, [s.definicion.area]), [], `${s.id}: «${t}»`);
  }
});

const punto = (extra: Partial<PuntoAnalitico> = {}): PuntoAnalitico => ({
  pointId: 'p1',
  date: '2026-11-02',
  dateEnd: null,
  at: null,
  value: 80,
  quality: 'COMPLETE',
  n: 1,
  segment: 's1',
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

test('TEST-GRF-006 · las marcas: lo indicado hueco, la carga rápida hueca y gris, la observada en rombo (mutación: carga rápida llena)', () => {
  const registrada = { marca: 'REGISTRADO' as const };
  assert.equal(marcaDelPunto(punto(), registrada), 'LLENA');
  assert.equal(marcaDelPunto(punto({ detail: [DETALLE_DE_CARGA_RAPIDA] }), registrada), 'HUECA_GRIS');
  assert.equal(marcaDelPunto(punto({ quality: 'PARTIAL' }), registrada), 'HUECA');
  assert.equal(marcaDelPunto(punto(), { marca: 'INDICADO' }), 'HUECA');
  assert.equal(marcaDelPunto(punto({ dataClass: 'REPORTED' }), { marca: 'MEDIDO_O_CALCULADO' }), 'CONTORNO_CORTADO');
  assert.equal(marcaDelPunto(punto({ dataClass: 'DERIVED' }), { marca: 'MEDIDO_O_CALCULADO' }), 'PUNTO_ADENTRO');
  const estimacion = (band: 'CORE' | 'ORIENTATIVE') => ({ specification: 'BE-E1RM' as const, version: 1 as const, method: 'EPLEY_V1' as const, band, load: { value: 80, unit: 'kg' as const }, completedRepetitions: 5, rir: 1, equivalentRepetitions: 6, value: 96 });
  assert.equal(marcaDelPuntoDeFuerza({ source: 'OBSERVED', estimate: estimacion('CORE') }), 'ROMBO');
  assert.equal(marcaDelPuntoDeFuerza({ source: 'PERSON', estimate: estimacion('ORIENTATIVE') }), 'HUECA');
  assert.equal(marcaDelPuntoDeFuerza({ source: 'PERSON', estimate: estimacion('CORE') }), 'LLENA');
  assert.equal(MARCA_SEGUN_EL_DATO.CARGA_RAPIDA, 'HUECA_GRIS');
});

test('TEST-GRF-007 · los IDs de los sugeridos: únicos, con la forma area.nombre y validados por una expresión, no por una lista (GR-T17)', () => {
  assert.equal(new Set(GRAFICOS_SUGERIDOS.map((g) => g.id)).size, GRAFICOS_SUGERIDOS.length);
  for (const g of GRAFICOS_SUGERIDOS) {
    assert.ok(esIdDeGrafico(g.id), g.id);
    for (const s of g.series) assert.ok(serieDisponible(s), `${g.codigo} usa ${s}, que no está en el catálogo`);
  }
  assert.ok(IdDeGraficoSchema.safeParse('cruce.uno-nuevo-que-no-conozco').success);
  assert.equal(graficoSugerido('cruce.uno-nuevo-que-no-conozco'), null);
  for (const malo of ['Entrenamiento.carga', 'otra.cosa', 'nutricion.', 'nutricion.energía', 'nutricion.energia por dia']) assert.equal(IdDeGraficoSchema.safeParse(malo).success, false, malo);
  assert.ok(!GRAFICOS_SUGERIDOS.some((g) => ['GR-04', 'GR-11', 'GR-23'].includes(g.codigo)));
});

const fuerza = (fecha: string, valor: number, extra: { banda?: 'CORE' | 'ORIENTATIVE'; rir?: number; reps?: number; observada?: boolean } = {}): PuntoDeFuerza => ({
  pointId: `x:${fecha}`,
  date: fecha,
  source: extra.observada ? 'OBSERVED' : 'PERSON',
  origin: extra.observada ? { type: 'STRENGTH_OBSERVATION', id: '44444444-4444-4444-8444-444444444444' } : { type: 'TRAINING_EXECUTION', id: '33333333-3333-4333-8333-333333333333', prescriptionId: 'p1', setIndex: 1, corrected: false },
  writtenBy: { identityId: '11111111-1111-4111-8111-111111111111', displayName: 'Diego Sosa' },
  estimate: { specification: 'BE-E1RM', version: 1, method: 'EPLEY_V1', band: extra.banda ?? 'CORE', load: { value: 80, unit: 'kg' }, completedRepetitions: extra.reps ?? 5, rir: extra.rir ?? 1, equivalentRepetitions: 6, value: valor },
});
const banda = (id: string, desde: string, hasta: string | null): VigenciaDePlan => ({ domain: 'TRAINING', planVersionId: id, label: id, activatedAt: `${desde}T10:00:00.000Z`, from: desde, to: hasta, endedAt: null, endReason: null });

test('TEST-GRF-008 · el ruido de la estimación: con menos de cuatro sesiones del núcleo es null; con cuatro, la mayor diferencia entre seguidas (mutación: con dos)', () => {
  const bandas = [banda('v1', '2026-10-01', '2026-10-20'), banda('v2', '2026-10-20', null)];
  const puntos = [
    fuerza('2026-10-02', 96, { rir: 1, reps: 5 }),
    fuerza('2026-10-06', 98, { rir: 2, reps: 6 }),
    fuerza('2026-10-09', 99, { rir: 0, reps: 5 }),
    fuerza('2026-10-20', 101, { rir: 1, reps: 4 }),
    fuerza('2026-10-22', 103, { rir: 1, reps: 4 }),
    fuerza('2026-10-24', 104, { observada: true }),
  ];
  const [v1, v2] = lecturaPorVersion(puntos, bandas);
  assert.equal(v1.planVersionId, 'v1');
  assert.equal(v1.sesiones, 3);
  assert.equal(v1.medianaDelRir, 1);
  assert.deepEqual(v1.repeticiones, { desde: 5, hasta: 6 });
  assert.equal(v1.diferenciaEntreSesiones, null);
  // El día del corte ya rige la siguiente; lo observado por el profesional no cuenta.
  assert.equal(v2.sesiones, 2);
  const cuatro = lecturaPorVersion([...puntos, fuerza('2026-10-13', 95.5)], bandas)[0];
  assert.equal(cuatro.sesiones, 4);
  assert.equal(cuatro.diferenciaEntreSesiones, 3.5);
  // Lo orientativo no entra en la diferencia.
  assert.equal(lecturaPorVersion([...puntos.slice(0, 3), fuerza('2026-10-13', 70, { banda: 'ORIENTATIVE' })], bandas)[0].diferenciaEntreSesiones, null);
  assert.equal(cambioDeLoIndicado({ rir: { desde: 2, hasta: 2 }, repeticiones: null }, { rir: { desde: 1, hasta: 1 }, repeticiones: null }), 'el RIR indicado pasó de 2 a 1: la estimación cambia aunque la fuerza no');
  assert.equal(cambioDeLoIndicado({ rir: { desde: 1, hasta: 2 }, repeticiones: { desde: 8, hasta: 8 } }, { rir: { desde: 1, hasta: 2 }, repeticiones: { desde: 8, hasta: 8 } }), null);
  for (const t of [cambioDeLoIndicado({ rir: null, repeticiones: { desde: 8, hasta: 10 } }, { rir: { desde: 1, hasta: 1 }, repeticiones: { desde: 6, hasta: 6 } }) ?? '']) {
    assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO']), [], t);
    assert.ok(!/±|→|%/.test(t), t);
  }
});

test('TEST-GRF-009 · Antropometría va en puntos sueltos y se resuelve con la unidad de los datos (GR-D5)', () => {
  assert.ok(SERIES_DISPONIBLES.filter((s) => s.definicion.area === 'ANTROPOMETRIA').every((s) => s.unirPuntos === false));
  const pliegue = serie('antropometria.pliegue-tricipital', 'mm');
  assert.equal(pliegue.unirPuntos, false);
  assert.equal(pliegue.definicion.unidad, 'mm');
  assert.equal(serie('antropometria.peso', 'lb').definicion.unidad, 'lb');
  assert.equal(serie('antropometria.peso').definicion.nombreCorto, serie('antropometria.peso', 'lb').definicion.nombreCorto);
  assert.equal(serieDisponible('antropometria.Peso'), null);
  assert.equal(serieDisponible('otra.cosa'), null);
  assert.ok(SERIES_DISPONIBLES.filter((s) => s.definicion.area !== 'ANTROPOMETRIA').every((s) => s.unirPuntos === true));
});
