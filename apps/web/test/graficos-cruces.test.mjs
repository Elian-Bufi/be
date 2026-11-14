/**
 * WP-GRAFICOS fase 2 (DL-174), los cruces y «Armá tu gráfico» (GR-24, SP-01, SP-02 y GR-26).
 * Este archivo lo escribe solo la rama de los cruces y «Analizar» (D), con sus IDs (TEST-GRF-060 a 079); la rama base
 * dejó la primera prueba de su registro. Cada prueba dice la mutación que la pone en rojo.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  DETALLE_DE_CARGA_RAPIDA,
  definicionDeMetrica,
  esIdDeGrafico,
  FRASE_DE_LA_COINCIDENCIA,
  fraseDeLaCoincidencia,
  serieDisponible,
  terminosProhibidosEnUnGrafico,
} from '@be/domain';

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

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const GRAFICOS = join(WEB, 'src/app/pro/advisees/graficos');
const SEGUIMIENTO = join(WEB, 'src/app/pro/advisees/seguimiento');
const leer = (ruta) => readFileSync(ruta, 'utf8');

const { GRAFICOS_DE_CRUCES } = await import('../src/app/pro/advisees/graficos/cruces/registro.ts');
const ACCESO = await import('../src/app/pro/advisees/graficos/cruces/caso-de-acceso.ts');
const V = await import('../src/app/pro/advisees/graficos/cruces/ventanas.ts');
const D = await import('../src/app/pro/advisees/graficos/cruces/dos-etapas.ts');
const SP1 = await import('../src/app/pro/advisees/graficos/cruces/carbohidratos-y-fuerza.ts');
const SP2 = await import('../src/app/pro/advisees/graficos/cruces/energia-y-peso.ts');
const TC = await import('../src/app/pro/advisees/graficos/cruces/lo-que-tambien-cambio.ts');
const { COPY_DE_LOS_CRUCES } = await import('../src/app/pro/advisees/graficos/cruces/copy.ts');
const A = await import('../src/app/pro/advisees/graficos/arma-tu-grafico/compositor.ts');
const S = await import('../src/app/pro/advisees/graficos/arma-tu-grafico/superpuestas.ts');
const E = await import('../src/app/pro/advisees/graficos/eje-de-fechas.ts');

// ─── Datos de prueba (sintéticos) ─────────────────────────────────────────────────────────────────

const SENTADILLA = '2aba46d7-c2d9-539c-847f-dc13a4322e18';
const OTRO_EJERCICIO = '11111111-2222-4333-8444-555555555555';
const SIN_PROPIOS = { NUTRICION: false, ENTRENAMIENTO: false, ANTROPOMETRIA: false };
const acceso = (alcances, propios = {}) => ({ alcances, propios: { ...SIN_PROPIOS, ...propios } });
const CASO_1_SP01 = acceso(['NUTRICION', 'ENTRENAMIENTO'], { NUTRICION: true, ENTRENAMIENTO: true });
const CASO_1_SP02 = acceso(['NUTRICION', 'ANTROPOMETRIA'], { NUTRICION: true, ANTROPOMETRIA: true });

const dia = (inicio, n) => new Date(Date.parse(`${inicio}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const punto = (fecha, valor, extra = {}) => ({
  pointId: `p-${fecha}-${extra.segment ?? 's1'}-${valor}`,
  date: fecha,
  dateEnd: null,
  at: null,
  value: valor,
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
const serie = (metricId, unit, grain, points) => ({ metricId, label: metricId, unit, scale: 'RATIO', grain, aggregation: 'NONE', points, gaps: [], segments: [], notes: [] });
const fuerza = (fecha, carga, repeticiones, rir, extra = {}) => ({
  pointId: `f-${fecha}-${carga}-${extra.source ?? 'PERSON'}`,
  date: fecha,
  source: 'PERSON',
  origin: { type: 'TRAINING_EXECUTION', id: '00000000-0000-4000-8000-000000000001', prescriptionId: 'p1', setIndex: 1, corrected: false },
  writtenBy: { identityId: '00000000-0000-4000-8000-000000000002', displayName: 'Persona' },
  estimate: { specification: 'BE-E1RM', version: 1, method: 'EPLEY_V1', band: 'CORE', load: { value: carga, unit: 'kg' }, completedRepetitions: repeticiones, rir, equivalentRepetitions: repeticiones + rir, value: (carga * (30 + repeticiones + rir)) / 30 },
  ...extra,
});
const vigencia = (domain, planVersionId, label, from, to) => ({ domain, planVersionId, label, activatedAt: `${from}T12:00:00.000Z`, from, to, endedAt: to ? `${to}T12:00:00.000Z` : null, endReason: to ? 'SUCCESSOR_ACTIVATED' : null });
const escalon = (objectiveVersionId, from, to, value, unit = 'g/day') => ({ objectiveVersionId, from, to, amount: { value, unit }, energyShare: null });
const etapa = (letra, rotulo, desde, ultimoDia, planVersionId = null) => ({ letra, rotulo, desde, ultimoDia, planVersionId });
const ejercicioDelPeriodo = (id) => ({ exerciseKey: `e:${id}`, name: 'Sentadilla trasera con barra', otherNames: [], homonym: false, sessions: 8, setNumbers: [1, 2, 3], loadUnits: ['kg'], lastDate: '2026-11-10' });
const contexto = (a, extra = {}) => ({ acceso: a, ejercicios: null, medidas: null, ...extra });
const delRegistro = (codigo) => GRAFICOS_DE_CRUCES.find((g) => g.codigo === codigo);
const LEIDO = { desde: '2026-09-01', hasta: '2026-10-31' };
const ETAPA_A = etapa('A', 'versión 3', '2026-09-01', '2026-09-30', 'va');
const ETAPA_B = etapa('B', 'versión 4', '2026-10-01', '2026-10-31', 'vb');

// ─── El registro ──────────────────────────────────────────────────────────────────────────────────

test('TEST-GRF-060 · el registro de la rama es una lista de gráficos con identificadores estables y sin repetir', () => {
  for (const lista of [GRAFICOS_DE_CRUCES]) {
    assert.ok(Array.isArray(lista));
    const ids = lista.map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const g of lista) {
      assert.ok(esIdDeGrafico(g.id), g.id);
      assert.match(g.codigo, /^(GR|SP)-\d{2}$/, g.id);
      assert.equal(typeof g.ofrecido, 'function', g.id);
    }
  }
  assert.deepEqual(
    GRAFICOS_DE_CRUCES.map((g) => [g.id, g.codigo, g.ubicacion]),
    [
      ['cruce.dos-etapas', 'GR-24', 'COMPARACION'],
      ['cruce.carbohidratos-y-fuerza', 'SP-01', 'RELACION'],
      ['cruce.energia-y-peso', 'SP-02', 'RELACION'],
    ],
  );
  // Los componentes se cargan a pedido: el registro es un módulo .ts sin JSX ni .tsx importados (GR-T57).
  const registro = leer(join(GRAFICOS, 'cruces/registro.ts'));
  assert.doesNotMatch(registro, /^import [^;]*from '\.\/[^']*-en-pantalla'/m);
  for (const g of GRAFICOS_DE_CRUCES) assert.equal(typeof g.Grafico, 'function', g.id);
});

// ─── GR-24 · Dos etapas ───────────────────────────────────────────────────────────────────────────

test('TEST-GRF-061 · «Dos etapas» no se dibuja con menos de 5 de un lado y dice cuánto hay (mutación: dibujar con 4)', () => {
  assert.equal(D.MINIMO_POR_LADO, 5);
  const carga = definicionDeMetrica('entrenamiento.carga');
  const escala = A.escalaDeLaSerie(serieDisponible('entrenamiento.carga'), 'kg');
  const sesiones = (fechas, version) => fechas.map((f, i) => punto(f, 80 + i, { planVersionIds: [version] }));
  const deA = sesiones(['2026-09-02', '2026-09-09', '2026-09-16', '2026-09-23'], 'va');
  const deB = sesiones(['2026-10-01', '2026-10-05', '2026-10-09', '2026-10-13', '2026-10-17', '2026-10-21'], 'vb');
  const entrada = (puntos) => ({ serie: serie('entrenamiento.carga', 'kg', 'ORIGINAL', puntos), definicion: carga, a: ETAPA_A, b: ETAPA_B, leido: LEIDO, escala, lectura: (p) => `${p.value} kg` });
  const con4 = D.dosEtapasLadoALado(entrada([...deA, ...deB]));
  assert.equal(con4.dibujable, false);
  assert.deepEqual(con4.falta, { hacen: 5, hay: [4, 6], unidad: 'sesiones' });
  // Una sesión registrada después, con la versión A, cuenta en la A (la versión que ejecutó, no la fecha).
  const tarde = punto('2026-10-03', 84, { planVersionIds: ['va'] });
  const con5 = D.dosEtapasLadoALado(entrada([...deA, tarde, ...deB]));
  assert.equal(con5.dibujable, true);
  assert.equal(con5.falta, null);
  assert.deepEqual(
    con5.lados.map((l) => l.n),
    [5, 6],
  );
  assert.equal(con5.lados[0].cantidad, '5 sesiones');
});

test('TEST-GRF-062 · «Dos etapas» dibuja todas las observaciones, la mediana y lo que no entra; con el 1RM estimado, el RIR y las repeticiones de cada etapa', () => {
  const energia = definicionDeMetrica('nutricion.energia');
  const deA = [2000, 2100, 2200, 2300, 2400].map((v, i) => punto(dia('2026-09-01', i), v));
  const parcial = punto('2026-09-06', 1500, { quality: 'PARTIAL' });
  const deB = [2500, 2600, 2700, 2800, 2900].map((v, i) => punto(dia('2026-10-01', i), v));
  const d = D.dosEtapasLadoALado({
    serie: serie('nutricion.energia', 'kcal', 'DAY', [...deA, parcial, ...deB]),
    definicion: energia,
    a: ETAPA_A,
    b: ETAPA_B,
    leido: LEIDO,
    escala: A.escalaDeLaSerie(serieDisponible('nutricion.energia'), 'kcal'),
    lectura: (p) => A.lecturaDelPunto(p, energia, 'kcal'),
  });
  const [a, b] = d.lados;
  assert.equal(a.puntos.length, 6, 'todas las observaciones se ven, también la que no entra');
  assert.equal(a.n, 5);
  assert.equal(a.mediana, 2200);
  assert.deepEqual(a.afuera, ['1 con algún dato faltante']);
  assert.equal(a.puntos.find((p) => p.fecha === '2026-09-06').marca, 'HUECA');
  assert.equal(a.cantidad, '5 días');
  assert.equal(b.mediana, 2700);
  assert.match(d.descripcion, /^Etapa A \(versión 3, del 1\/9 al 30\/9\): 5 días, mediana 2\.200 kcal; fuera de la mediana: 1 con algún dato faltante\. Etapa B/);
  const g = D.geometriaDeDosEtapas(d, 600, 180);
  assert.equal(g.columnas.length, 2);
  assert.equal(g.columnas[0].marcas.length, 6);
  assert.ok(g.columnas[0].x2 <= g.columnas[1].x1, 'las etapas van lado a lado, sin pisarse');
  // Con el 1RM estimado: la mediana del RIR registrado y el rango de repeticiones de cada etapa; lo observado, en rombo y afuera.
  const uno = serieDisponible('entrenamiento.1rm-estimado');
  const deLaPersona = [
    ...[
      [80, 5, 1],
      [80, 5, 2],
      [81, 6, 2],
      [81, 6, 1],
      [82, 5, 2],
    ].map(([c, r, rir], i) => fuerza(dia('2026-09-03', 4 * i), c, r, rir)),
    ...[
      [84, 5, 1],
      [84, 6, 1],
      [85, 6, 0],
      [85, 6, 1],
      [86, 6, 1],
    ].map(([c, r, rir], i) => fuerza(dia('2026-10-03', 4 * i), c, r, rir)),
  ];
  const observada = fuerza('2026-10-20', 90, 3, 1, { source: 'OBSERVED', origin: { type: 'STRENGTH_OBSERVATION', id: '00000000-0000-4000-8000-000000000003' } });
  const puntos = [...deLaPersona, observada].map((p) => punto(p.date, p.estimate.value, { pointId: p.pointId, segment: p.source === 'OBSERVED' ? `observada:${p.pointId}` : 'estimacion' }));
  const f = D.dosEtapasLadoALado({ serie: serie(uno.id, 'kg', 'ORIGINAL', puntos), definicion: uno.definicion, a: ETAPA_A, b: ETAPA_B, leido: LEIDO, escala: A.escalaDeLaSerie(uno, 'kg'), lectura: () => '', fuerza: [...deLaPersona, observada] });
  assert.deepEqual(f.lados[0].fuerza, { sesiones: 5, medianaDelRir: 2, repeticiones: { desde: 5, hasta: 6 } });
  assert.deepEqual(f.lados[1].fuerza, { sesiones: 5, medianaDelRir: 1, repeticiones: { desde: 5, hasta: 6 } });
  assert.equal(f.lados[1].puntos.find((p) => p.clave === observada.pointId).marca, 'ROMBO');
  assert.deepEqual(f.lados[1].afuera, ['1 observada por el profesional']);
  assert.ok(f.extremos.arriba - f.extremos.abajo >= 10, 'el eje del 1RM estimado abarca 10 kg como mínimo');
  assert.equal(D.fuerzaEnPalabras(f.lados[0].fuerza), 'RIR registrado de mediana 2; series de 5 a 6 repeticiones.');
});

// ─── El caso de acceso y el caso negado ──────────────────────────────────────────────────────────

test('TEST-GRF-063 · SP-01 existe solo en el caso 1, y el caso negado no se ofrece ni pide lecturas (mutación: ofrecerlo con una sola área)', () => {
  assert.equal(ACCESO.cruceOfrecido('SP-01', CASO_1_SP01), true);
  assert.deepEqual(ACCESO.lecturasDelCruce('SP-01', CASO_1_SP01), ['nutricion.carbohidratos', 'nutricion.energia', 'entrenamiento.1rm-estimado']);
  const negados = [
    // Un entrenador con el alcance de Entrenamiento y sin Nutrición.
    acceso(['ENTRENAMIENTO'], { ENTRENAMIENTO: true }),
    // Con Nutrición permitida pero sin un plan propio (los registros que ve son de otro profesional): caso 2, fase 3.
    acceso(['NUTRICION', 'ENTRENAMIENTO'], { ENTRENAMIENTO: true }),
    acceso(['NUTRICION', 'ENTRENAMIENTO'], { NUTRICION: true }),
    acceso([], {}),
  ];
  const sp01 = delRegistro('SP-01');
  for (const a of negados) {
    assert.equal(ACCESO.cruceOfrecido('SP-01', a), false, JSON.stringify(a));
    assert.deepEqual(ACCESO.lecturasDelCruce('SP-01', a), [], 'el caso negado no pide ninguna lectura');
    assert.equal(sp01.ofrecido(contexto(a, { ejercicios: [ejercicioDelPeriodo(SENTADILLA)] })), false, 'no se ofrece: ni en gris ni con candado');
  }
  assert.equal(sp01.ofrecido(contexto(CASO_1_SP01, { ejercicios: [ejercicioDelPeriodo(SENTADILLA)] })), true);
  assert.equal(sp01.ofrecido(contexto(CASO_1_SP01, { ejercicios: [ejercicioDelPeriodo(OTRO_EJERCICIO)] })), false, 'sin un ejercicio de la lista de la v1, no hay 1RM estimado');
  // GR-24 se ofrece con un área con plan propio; sin ninguno, no.
  const gr24 = delRegistro('GR-24');
  assert.equal(gr24.ofrecido(contexto(acceso(['NUTRICION'], { NUTRICION: true }))), true);
  assert.equal(gr24.ofrecido(contexto(acceso(['NUTRICION', 'ANTROPOMETRIA'], { ANTROPOMETRIA: true }))), false);
  assert.deepEqual(ACCESO.areasConEtapas(CASO_1_SP01), ['ENTRENAMIENTO', 'NUTRICION']);
});

test('TEST-GRF-064 · SP-02 existe solo en el caso 1, con tomas de peso; el caso negado no se ofrece ni lee comidas (mutación: pedir la lectura de comidas igual)', () => {
  assert.equal(ACCESO.cruceOfrecido('SP-02', CASO_1_SP02), true);
  assert.deepEqual(ACCESO.lecturasDelCruce('SP-02', CASO_1_SP02), ['nutricion.energia', 'antropometria.peso']);
  const sp02 = delRegistro('SP-02');
  // Quien lleva solo Antropometría: no se ofrece y no se lee ningún registro de comida.
  const soloAntropometria = acceso(['ANTROPOMETRIA'], { ANTROPOMETRIA: true });
  assert.equal(ACCESO.cruceOfrecido('SP-02', soloAntropometria), false);
  assert.deepEqual(ACCESO.lecturasDelCruce('SP-02', soloAntropometria), []);
  assert.equal(sp02.ofrecido(contexto(soloAntropometria, { medidas: ['peso'] })), false);
  assert.equal(sp02.ofrecido(contexto(acceso(['ENTRENAMIENTO', 'NUTRICION'], { ENTRENAMIENTO: true, NUTRICION: true }), { medidas: null })), false);
  assert.equal(sp02.ofrecido(contexto(CASO_1_SP02, { medidas: ['peso', 'cintura'] })), true);
  assert.equal(sp02.ofrecido(contexto(CASO_1_SP02, { medidas: ['cintura'] })), false, 'sin tomas de peso no hay cruce');
});

// ─── SP-01 · Carbohidratos × 1RM estimado ───────────────────────────────────────────────────────

/** Etapa A del objetivo del 1/8 al 31/8 y B desde el 1/9; el plan de entrenamiento cambia el 15/9. */
function entradaDeSp01() {
  const carbohidratos = [];
  for (let i = 0; i < 31; i++) {
    const f = dia('2026-08-01', i);
    if (i < 24) carbohidratos.push(punto(f, i < 12 ? 250 : 270));
    else if (i < 28) carbohidratos.push(punto(f, 180, { quality: 'PARTIAL' }));
  }
  for (let i = 0; i < 61; i++) {
    const f = dia('2026-09-01', i);
    if (i < 30) carbohidratos.push(punto(f, 310));
    else if (i === 30) carbohidratos.push(punto(f, 200, { quality: 'PARTIAL' }));
  }
  const energia = [...Array.from({ length: 31 }, (_, i) => punto(dia('2026-08-01', i), 2000)), ...Array.from({ length: 61 }, (_, i) => punto(dia('2026-09-01', i), 2200))];
  const deA = [92, 93, 95, 94, 96, 95].map((v, i) => fuerza(dia('2026-08-03', 4 * i), v / (36 / 30), 5, 1));
  const deB = [98, 99, 101, 100, 102, 101, 100].map((v, i) => fuerza(dia('2026-09-16', 4 * i), v / (36 / 30), 5, 1));
  const orientativa = fuerza('2026-10-14', 70, 10, 1, { estimate: { ...fuerza('2026-10-14', 70, 10, 1).estimate, band: 'ORIENTATIVE' } });
  const bandas = [vigencia('TRAINING', 'tv3', 'v3', '2026-08-01', '2026-09-15'), vigencia('TRAINING', 'tv4', 'v4', '2026-09-15', null)];
  return {
    carbohidratos: serie('nutricion.carbohidratos', 'g', 'DAY', carbohidratos),
    energia: serie('nutricion.energia', 'kcal', 'DAY', energia),
    escalones: [escalon('o1', '2026-08-01', '2026-09-01', 250), escalon('o2', '2026-09-01', null, 300)],
    escalonesDeEnergia: [escalon('o1', '2026-08-01', '2026-09-01', 2000, 'kcal/day'), escalon('o2', '2026-09-01', null, 2200, 'kcal/day')],
    fuerza: [...deA, ...deB, orientativa],
    unidad: 'kg',
    bandasDeEntrenamiento: bandas,
    vigencias: bandas,
    objetivos: new Map([
      ['tv3', { rir: { desde: 2, hasta: 2 }, repeticiones: { desde: 5, hasta: 6 } }],
      ['tv4', { rir: { desde: 1, hasta: 1 }, repeticiones: { desde: 5, hasta: 6 } }],
    ]),
    ejercicio: 'Sentadilla trasera con barra',
    periodo: { desde: '2026-08-01', hasta: '2026-10-31' },
    hoy: '2026-11-14',
  };
}

test('TEST-GRF-065 · SP-01: las calorías van al lado de los carbohidratos, el 1RM estimado con su eje mínimo y la lectura dice el ruido antes que el cambio (mutación: sacar las calorías)', () => {
  const e = entradaDeSp01();
  const carriles = SP1.carrilesDeCarbohidratosYFuerza(e);
  assert.deepEqual(
    carriles.map((c) => c.id),
    ['nutricion.carbohidratos', 'nutricion.energia', 'entrenamiento.1rm-estimado'],
  );
  assert.equal(carriles[2].escala.rangoMinimo, 10);
  assert.equal(carriles[2].unir, true);
  assert.equal(carriles[0].escalones.length, 2, 'el objetivo de los carbohidratos va en escalón');
  assert.equal(carriles[2].puntos.find((p) => p.fecha === '2026-10-14').marca, 'HUECA', 'lo orientativo va hueco');
  const l = SP1.lecturaDeCarbohidratosYFuerza(e);
  assert.deepEqual(l.ventana, { a: { desde: '2026-08-01', hasta: '2026-08-31' }, b: { desde: '2026-09-01', hasta: '2026-10-31' } });
  assert.deepEqual(l.primeraLinea, ['Con la versión 4 del plan de entrenamiento (desde el 15/9), el RIR indicado pasó de 2 a 1: la estimación cambia aunque la fuerza no.']);
  assert.equal(
    l.lineas[0],
    'Etapa A (objetivo desde el 1/8, 31 días): mediana de carbohidratos registrados de 260 g/día, con los 24 días que tienen cantidades en todos sus registros y ninguna comida del plan sin registro (7 quedaron afuera: 3 sin registro y 4 con algún dato faltante).',
  );
  assert.match(l.lineas[1], /^En Sentadilla trasera con barra, en la etapa A, el 1RM estimado \(Epley v1\) estuvo entre ≈ [\d,]+ y ≈ [\d,]+ kg en 6 sesiones, con RIR registrado de mediana 1 y series de 5 repeticiones\.$/);
  assert.match(l.lineas[3], /1 sesión orientativa \(de más de 10 a 12 repeticiones equivalentes\) se ve/);
  assert.ok(l.lineas.includes('Entre sesiones de la misma versión aparecen diferencias de hasta 2 kg.'), l.lineas.join('\n'));
  assert.ok(l.lineas.includes('Las calorías registradas, con el mismo criterio de días: mediana de 2.000 kcal/día en la etapa A y de 2.200 kcal/día en la B.'));
  assert.deepEqual(l.tambienCambio, ['Entrenamiento: se activó la versión 4 el 15/9']);
  assert.equal(l.frase, FRASE_DE_LA_COINCIDENCIA);
  assert.ok(l.noRegistra.includes('el sueño, que BE no registra'));
  for (const t of [...l.lineas, ...l.primeraLinea]) assert.doesNotMatch(t, /→|±|%|primero|último/, t);
  // Sin poder leer lo indicado, se dice que no se sabe (no «no cambió»).
  assert.deepEqual(SP1.lecturaDeCarbohidratosYFuerza({ ...e, objetivos: null }).primeraLinea, [COPY_DE_LOS_CRUCES.carbohidratosYFuerza.sinLoIndicado]);
});

test('TEST-GRF-066 · la ventana de SP-01 se fija con las versiones del objetivo, de 3 semanas o más por etapa (mutación: aceptar una etapa de 2 semanas)', () => {
  assert.equal(V.DIAS_MINIMOS_DE_UNA_ETAPA_DEL_OBJETIVO, 21);
  const periodo = { desde: '2026-08-01', hasta: '2026-10-31' };
  const corta = V.etapasDelObjetivo([escalon('o1', '2026-08-01', '2026-09-01', 250), escalon('o2', '2026-09-01', '2026-09-15', 280), escalon('o3', '2026-09-15', null, 300)], periodo);
  assert.deepEqual(
    corta.map((e) => [e.desde, e.hasta, e.dias]),
    [
      ['2026-08-01', '2026-08-31', 31],
      ['2026-09-01', '2026-09-14', 14],
      ['2026-09-15', '2026-10-31', 47],
    ],
  );
  assert.deepEqual(V.ventanaDelObjetivo(corta), { tipo: 'FALTA', motivo: 'ETAPAS_CORTAS' });
  assert.deepEqual(V.ventanaDelObjetivo(V.etapasDelObjetivo([escalon('o1', '2026-08-01', null, 250)], periodo)), { tipo: 'FALTA', motivo: 'SIN_CAMBIO_DE_OBJETIVO' });
  // Una sola ventana: la última pareja seguida que llega a 3 semanas por lado, no la que «da».
  const tres = V.etapasDelObjetivo([escalon('o1', '2026-07-01', '2026-08-25', 250), escalon('o2', '2026-08-25', '2026-09-25', 280), escalon('o3', '2026-09-25', null, 300)], periodo);
  assert.equal(tres[0].recortada, true, 'una etapa que empieza antes del período se dice recortada');
  const v = V.ventanaDelObjetivo(tres);
  assert.equal(v.tipo, 'LISTA');
  assert.deepEqual([v.a.objectiveVersionId, v.b.objectiveVersionId], ['o2', 'o3']);
  // Los días de Nutrición: solo los que tienen cantidades en todos sus registros, y hoy no entra.
  const d = V.diasDeNutricion(serie('nutricion.energia', 'kcal', 'DAY', [punto('2026-11-10', 2000), punto('2026-11-11', 1500, { quality: 'PARTIAL' }), punto('2026-11-13', 2100), punto('2026-11-14', 300)]), '2026-11-10', '2026-11-14', '2026-11-14');
  assert.deepEqual([d.incluidos.length, d.conFaltantes, d.sinRegistro, d.enCurso, d.mediana], [2, 1, 1, true, 2050]);
});

// ─── SP-02 · Calorías × peso ────────────────────────────────────────────────────────────────────

function entradaDeSp02() {
  const peso = serie('antropometria.peso', 'kg', 'ORIGINAL', [
    punto('2026-09-30', 81.2, { segment: 't1', pointId: 'toma-30-9' }),
    punto('2026-10-14', 80.8, { segment: 't2', pointId: 'toma-14-10' }),
    punto('2026-10-21', 80.3, { segment: 't1', pointId: 'toma-21-10' }),
    punto('2026-10-28', 80.1, { segment: 't1', pointId: 'toma-28-10' }),
  ]);
  const energia = [];
  for (let i = 0; i < 26; i++) {
    const f = dia('2026-10-02', i);
    if (i < 19) energia.push(punto(f, 2150));
    else if (i < 22) energia.push(punto(f, 1200, { quality: 'PARTIAL' }));
  }
  return {
    energia: serie('nutricion.energia', 'kcal', 'DAY', energia),
    escalones: [escalon('o3', '2026-09-01', '2026-10-02', 2300, 'kcal/day'), escalon('o4', '2026-10-02', null, 2100, 'kcal/day')],
    peso,
    vigencias: [vigencia('NUTRITION', 'nv2', 'v2', '2026-10-10', null)],
    periodo: { desde: '2026-09-01', hasta: '2026-11-14' },
    hoy: '2026-11-14',
  };
}

test('TEST-GRF-067 · SP-02: de una toma a otra con 14 días o más y el mismo protocolo, las calorías desde el cambio de objetivo, el peso en puntos sueltos y el error de medición dicho (mutación: tomar la toma de otro protocolo)', () => {
  assert.equal(V.DIAS_MINIMOS_ENTRE_TOMAS, 14);
  const e = entradaDeSp02();
  const par = V.ventanaDeLasTomas(V.tomasDe(e.peso));
  assert.deepEqual([par.a.fecha, par.b.fecha, par.dias], ['2026-09-30', '2026-10-28', 28], 'la del 14/10 es de otro protocolo; la del 21/10 queda a 7 días');
  const l = SP2.lecturaDeEnergiaYPeso(e);
  assert.deepEqual(l.lineas, [
    'Desde el cambio de objetivo del 2/10 hasta la toma del 28/10 (26 días), la mediana de calorías registradas fue de 2.150 kcal/día, con los 19 días que tienen cantidades en todos sus registros y ninguna comida del plan sin registro (7 quedaron afuera: 4 sin registro y 3 con algún dato faltante).',
    'El peso pasó de 81,2 kg en la toma del 30/9 a 80,1 kg en la del 28/10, 28 días después.',
    'BE no tiene cargado el error de medición de quien mide ni las condiciones de cada toma: no se puede decir si 1,1 kg lo supera.',
    'Lo registrado puede no ser todo lo comido.',
  ]);
  assert.deepEqual(l.tambienCambio, ['Nutrición: se activó la versión 2 el 10/10']);
  assert.equal(l.frase, FRASE_DE_LA_COINCIDENCIA);
  const carriles = SP2.carrilesDeEnergiaYPeso(e);
  assert.deepEqual(
    carriles.map((c) => [c.id, c.tipo]),
    [
      ['nutricion.energia', 'PUNTOS'],
      ['nutricion.energia-media-semanal', 'BARRAS_SEMANALES'],
      ['antropometria.peso', 'PUNTOS'],
    ],
  );
  assert.equal(carriles[2].unir, false, 'nada une dos tomas');
  assert.match(carriles[2].puntos.find((p) => p.fecha === '2026-10-28').lectura, /7 días después de la toma anterior/);
  // La media semanal dice con cuántos días se hizo; una semana sin días enteros no tiene media (no es un cero).
  const semanas = SP2.mediaSemanal(e.energia, e.hoy);
  assert.ok(semanas.every((s) => s.dias >= 0));
  assert.match(semanas.find((s) => s.valor !== null).lectura, /^media de .* con \d+ días? con cantidades en todos sus registros/);
  // Sin dos tomas a 14 días, no hay ventana y se dice.
  const sinVentana = SP2.lecturaDeEnergiaYPeso({ ...e, peso: serie('antropometria.peso', 'kg', 'ORIGINAL', [punto('2026-10-21', 80.3), punto('2026-10-28', 80.1)]) });
  assert.equal(sinVentana.falta, COPY_DE_LOS_CRUCES.energiaYPeso.sinVentana);
  assert.deepEqual(sinVentana.lineas, []);
});

// ─── GR-26 · «Superpuestas» ─────────────────────────────────────────────────────────────────────

const carrilDe = (id, unidad, indice, puntos, extra = {}) => ({
  tipo: 'PUNTOS',
  id,
  nombre: id,
  unidad,
  metodo: null,
  indice,
  puntos,
  indicado: [],
  escalones: [],
  unir: true,
  escala: { enteros: false },
  cobertura: [],
  descripcion: '',
  ...extra,
});
const puntoDelCarril = (fecha, valor, extra = {}) => ({ clave: `${fecha}-${valor}`, fecha, hasta: null, en: null, valor, rango: null, tramo: 's1', marca: 'LLENA', tarde: false, lectura: String(valor), ...extra });
const PERIODO = { desde: '2026-11-01', hasta: '2026-11-10', hoy: '2026-11-10', desdeElVinculo: null };

test('TEST-GRF-068 · «Superpuestas» con dos unidades: un eje a cada lado, cada uno rotulado con su nombre y su unidad, y los nombres al final de las líneas sin pisarse (mutación: un solo eje)', () => {
  const escala = E.escalaDeFechas(PERIODO, { izquierda: 56, derecha: 500 });
  const carbohidratos = carrilDe('carbohidratos', 'g', 0, [puntoDelCarril('2026-11-02', 250), puntoDelCarril('2026-11-05', 300), puntoDelCarril('2026-11-09', 310)]);
  const uno = carrilDe('uno', 'kg', 2, [puntoDelCarril('2026-11-03', 100), puntoDelCarril('2026-11-09', 101)], { escala: { enteros: false, rangoMinimo: 10 } });
  const g = S.geometriaSuperpuesta([carbohidratos, uno], ['IZQUIERDA', 'DERECHA'], ['Carbohidratos', '1RM estimado'], escala, 200, 562);
  assert.deepEqual(
    g.ejes.map((e) => [e.lado, e.rotulo]),
    [
      ['IZQUIERDA', 'Carbohidratos · g'],
      ['DERECHA', '1RM estimado · kg'],
    ],
  );
  const derecho = g.ejes[1];
  assert.ok(derecho.extremos.arriba - derecho.extremos.abajo >= 10, 'la escala de cada eje es la de «Alineadas»: el rango mínimo del 1RM estimado');
  for (const s of g.series) for (const m of s.marcas) assert.ok(m.y >= 0 && m.y <= 200, `${s.id} dentro de la caja`);
  const [r1, r2] = g.series.map((s) => s.rotulo);
  assert.equal(r1.x, 562);
  assert.ok(Math.abs(r1.y - r2.y) >= S.SEPARACION_DE_LOS_NOMBRES - 0.001, 'los nombres de dos líneas no se pisan');
  // Con un solo lado, un solo eje.
  assert.equal(S.geometriaSuperpuesta([carbohidratos, uno], ['IZQUIERDA', 'IZQUIERDA'], ['Carbohidratos', '1RM estimado'], escala, 200, 562).ejes.length, 1);
});

test('TEST-GRF-069 · tres unidades apagan «Superpuestas» y dicen por qué; dos unidades la permiten con un eje a cada lado y la frase (mutación: dejar tres unidades)', () => {
  const tres = [A.serieElegidaDe('entrenamiento.carga', 'kg', 'ORIGINAL'), A.serieElegidaDe('nutricion.carbohidratos', 'g', 'DAY'), A.serieElegidaDe('entrenamiento.rir', 'RIR', 'ORIGINAL')];
  const s = A.superposicionDeLasElegidas(tres);
  assert.equal(s.permitida, false);
  assert.equal(s.motivo, 'MAS_DE_DOS_UNIDADES');
  assert.equal(A.motivoDeSuperpuestas(s.motivo, s.grupos, ['Carga', 'Carbohidratos', 'RIR']), '«Superpuestas» admite dos unidades, una a cada lado. Con kg, g y RIR, miralas alineadas.');
  // La misma unidad y tres medidas distintas: también son tres ejes.
  const kilos = [A.serieElegidaDe('entrenamiento.carga', 'kg', 'ORIGINAL'), A.serieElegidaDe('entrenamiento.1rm-estimado', 'kg', 'ORIGINAL'), A.serieElegidaDe('antropometria.peso', 'kg', 'ORIGINAL')];
  const k = A.superposicionDeLasElegidas(kilos);
  assert.equal(k.motivo, 'MAS_DE_DOS_UNIDADES');
  assert.equal(A.motivoDeSuperpuestas(k.motivo, k.grupos, ['Carga', '1RM estimado', 'Peso']), '«Superpuestas» admite dos ejes, uno a cada lado. Carga (kg), 1RM estimado (kg) y Peso (kg) son medidas distintas: miralas alineadas.');
  const dos = [A.serieElegidaDe('nutricion.carbohidratos', 'g', 'DAY'), A.serieElegidaDe('entrenamiento.1rm-estimado', 'kg', 'ORIGINAL')];
  const d = A.superposicionDeLasElegidas(dos);
  assert.equal(d.permitida, true);
  assert.deepEqual(d.lados, ['IZQUIERDA', 'DERECHA']);
  assert.equal(d.composicion.ejesY.length, 2);
  assert.equal(d.composicion.frase, FRASE_DE_LA_COINCIDENCIA, 'dos áreas o dos ejes llevan la frase');
});

test('TEST-GRF-070 · series con distinto eje X no se superponen: una agrupada por semana va solo con otras semanales (mutación: superponer semana con sesión)', () => {
  const mezcla = A.superposicionDeLasElegidas([A.serieElegidaDe('nutricion.carbohidratos', 'g', 'WEEK'), A.serieElegidaDe('entrenamiento.carga', 'kg', 'ORIGINAL')]);
  assert.equal(mezcla.permitida, false);
  assert.equal(mezcla.motivo, 'EJE_X_DISTINTO');
  assert.match(A.motivoDeSuperpuestas(mezcla.motivo, mezcla.grupos, []), /semanales/);
  const semanales = A.superposicionDeLasElegidas([A.serieElegidaDe('nutricion.energia', 'kcal', 'WEEK'), A.serieElegidaDe('entrenamiento.series-registradas', 'series', 'WEEK')]);
  assert.equal(semanales.permitida, true);
  // Día y sesión comparten el eje de fechas.
  assert.equal(A.superposicionDeLasElegidas([A.serieElegidaDe('nutricion.energia', 'kcal', 'DAY'), A.serieElegidaDe('entrenamiento.carga', 'kg', 'ORIGINAL')]).permitida, true);
  const una = A.superposicionDeLasElegidas([A.serieElegidaDe('nutricion.energia', 'kcal', 'DAY')]);
  assert.equal(una.motivo, 'UNA_SOLA');
  assert.equal(A.motivoDeSuperpuestas(una.motivo, una.grupos, []), '«Superpuestas» pide dos series o tres.');
});

test('TEST-GRF-071 · una vista guardada con OVERLAY de antes se ve igual: una sola familia y unidad, un solo eje, sin frase nueva en el dibujo (mutación: abrir un segundo eje siempre)', () => {
  const macros = ['nutricion.carbohidratos', 'nutricion.grasas', 'nutricion.proteinas'].map((id) => A.serieElegidaDe(id, 'g', 'DAY'));
  const m = A.superposicionDeLasElegidas(macros);
  assert.equal(m.permitida, true);
  assert.deepEqual(m.lados, ['IZQUIERDA', 'IZQUIERDA', 'IZQUIERDA']);
  assert.equal(m.composicion.ejesY.length, 1);
  assert.equal(fraseDeLaCoincidencia(macros, 'OVERLAY', 1), null);
  const masas = ['antropometria.masa-grasa-durnin-womersley', 'antropometria.masa-libre-de-grasa-durnin-womersley'].map((id) => A.serieElegidaDe(id, 'kg', 'ORIGINAL'));
  assert.deepEqual(A.superposicionDeLasElegidas(masas).lados, ['IZQUIERDA', 'IZQUIERDA']);
  // El lienzo abre el eje de la derecha solo con una serie de ese lado, y «Analizar» da lado solo en «Superpuestas».
  const lienzo = leer(join(SEGUIMIENTO, 'lienzo.tsx'));
  assert.match(lienzo, /const dosEjes = modo === 'OVERLAY' && series\.some\(aLaDerecha\);/);
  assert.match(lienzo, /\{dosEjes \? \(\s*<YAxis yAxisId="derecha" orientation="right"/);
  const analizar = leer(join(SEGUIMIENTO, 'analizar.tsx'));
  assert.match(analizar, /\.\.\.\(modo === 'OVERLAY' \? \{ lado: ladoDe\.get\(s\.clave\) \?\? 'IZQUIERDA' \} : \{\}\)/);
  // En la URL y en las vistas guardadas, los modos siguen siendo los de siempre.
  const estado = leer(join(SEGUIMIENTO, 'estado.ts'));
  assert.match(estado, /const MODOS: Readonly<Record<string, Modo>> = \{ P: 'PANELS', S: 'OVERLAY', R: 'RELATIVE' \};/);
});

test('TEST-GRF-072 · los textos de la rama pasan la guardia unida de las áreas que juntan; con Nutrición, ni el signo de porcentaje (mutación: un «%» en la lectura de un cruce)', () => {
  const todas = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];
  const textos = [];
  const juntar = (v) => {
    if (typeof v === 'string') textos.push(v);
    else if (typeof v === 'function') textos.push(v('1,1 kg', 'A', 'versión 3'));
    else if (Array.isArray(v)) v.forEach(juntar);
    else if (v && typeof v === 'object') Object.values(v).forEach(juntar);
  };
  juntar(COPY_DE_LOS_CRUCES);
  juntar(TC.LO_QUE_BE_NO_REGISTRA);
  juntar([A.NOMBRE_DEL_MODO, A.QUE_HACE_EL_MODO, A.COMO_LEER_DOS_EJES, A.NOMBRE_DEL_AREA]);
  for (const motivo of ['UNA_SOLA', 'NINGUNA', 'MAS_DE_TRES', 'EJE_X_DISTINTO']) textos.push(A.motivoDeSuperpuestas(motivo, [], []));
  const sp01 = SP1.lecturaDeCarbohidratosYFuerza(entradaDeSp01());
  const sp02 = SP2.lecturaDeEnergiaYPeso(entradaDeSp02());
  for (const l of [sp01, sp02]) textos.push(...l.lineas, ...l.primeraLinea, ...l.tambienCambio, ...l.noRegistra, l.frase);
  textos.push(...SP1.carrilesDeCarbohidratosYFuerza(entradaDeSp01()).flatMap((c) => [c.nombre, c.descripcion, ...c.puntos.map((p) => p.lectura)]));
  textos.push(...SP2.carrilesDeEnergiaYPeso(entradaDeSp02()).flatMap((c) => [c.nombre, c.descripcion, ...(c.tipo === 'PUNTOS' ? c.puntos.map((p) => p.lectura) : c.semanas.map((s) => s.lectura))]));
  assert.ok(textos.length > 60, `se revisaron ${textos.length} textos`);
  for (const t of textos) assert.deepEqual(terminosProhibidosEnUnGrafico(t, todas), [], t);
  // La prueba de la prueba: un porcentaje en la lectura de un cruce con Nutrición se detecta.
  assert.deepEqual(terminosProhibidosEnUnGrafico('Los carbohidratos subieron un 12 % en la etapa B', ['NUTRICION', 'ENTRENAMIENTO']), ['%']);
});

test('TEST-GRF-073 · Antropometría sigue en puntos sueltos también superpuesta (mutación: unir las tomas)', () => {
  const escala = E.escalaDeFechas(PERIODO, { izquierda: 56, derecha: 500 });
  const energia = carrilDe('energia', 'kcal', 0, [puntoDelCarril('2026-11-02', 2000), puntoDelCarril('2026-11-03', 2100), puntoDelCarril('2026-11-04', 2050)]);
  const peso = carrilDe('peso', 'kg', 1, [puntoDelCarril('2026-11-02', 81.2), puntoDelCarril('2026-11-09', 80.9)], { unir: false });
  const g = S.geometriaSuperpuesta([energia, peso], ['IZQUIERDA', 'DERECHA'], ['Calorías', 'Peso'], escala, 200, 562);
  assert.equal(g.series[0].lineas.length, 1);
  assert.equal(g.series[1].lineas.length, 0, 'nada une dos tomas');
  assert.equal(g.series[1].marcas.length, 2);
  assert.equal(serieDisponible('antropometria.peso').unirPuntos, false);
});

test('TEST-GRF-074 · el selector ofrece el catálogo con el acceso de hoy: sin un área no hay nada de ella, el 1RM estimado solo con la lista de la v1 y los sugeridos primero (mutación: ofrecer el 1RM con cualquier ejercicio)', () => {
  const soloNutricion = A.seriesParaElegir(acceso(['NUTRICION'], { NUTRICION: true }));
  assert.deepEqual(soloNutricion.ENTRENAMIENTO, []);
  assert.deepEqual(soloNutricion.ANTROPOMETRIA, []);
  assert.ok(soloNutricion.NUTRICION.some((s) => s.id === 'nutricion.energia'));
  assert.ok(!soloNutricion.NUTRICION.some((s) => s.estado !== 'OFRECIDA'), 'lo que está en preparación o pide una DL no se ofrece');
  // Los que usan los gráficos sugeridos van primero: «Registros» no está en ninguno.
  assert.equal(soloNutricion.NUTRICION.at(-1).id, 'nutricion.registros');
  const deEntrenamiento = A.seriesParaElegir(CASO_1_SP01).ENTRENAMIENTO;
  assert.ok(A.seriesDelEjercicio(deEntrenamiento, `e:${SENTADILLA}`).some((s) => s.id === 'entrenamiento.1rm-estimado'));
  assert.ok(!A.seriesDelEjercicio(deEntrenamiento, `e:${OTRO_EJERCICIO}`).some((s) => s.id === 'entrenamiento.1rm-estimado'));
  assert.ok(!A.seriesDelEjercicio(deEntrenamiento, `v:${SENTADILLA}`).some((s) => s.id === 'entrenamiento.1rm-estimado'), 'una versión sin ejercicio conocido no entra en la lista');
  const uno = serieDisponible('entrenamiento.1rm-estimado');
  assert.deepEqual(A.referenciaDeEntrenamiento(uno, `e:${SENTADILLA}`, 2, 'lb'), { metricId: 'entrenamiento.1rm-estimado', exerciseKey: `e:${SENTADILLA}`, setIndex: null, unit: 'lb' });
  assert.deepEqual(A.referenciaDeEntrenamiento(serieDisponible('entrenamiento.carga'), `e:${SENTADILLA}`, 2, 'lb'), { metricId: 'entrenamiento.carga', exerciseKey: `e:${SENTADILLA}`, setIndex: 2, unit: 'lb' });
  assert.equal(A.referenciaDeEntrenamiento(serieDisponible('entrenamiento.repeticiones'), `e:${SENTADILLA}`, 2, 'kg').unit, null);
  const selector = leer(join(SEGUIMIENTO, 'selector.tsx'));
  assert.match(selector, /seriesParaElegir\(accesoDeLosDisponibles\(disponibles\)\)/);
  assert.doesNotMatch(selector, /METRICAS_DEL_DICCIONARIO/);
});

test('TEST-GRF-075 · el despacho: lo del diccionario se lee como siempre y lo que solo está en el catálogo, por su camino (mutación: leer el 1RM estimado como una métrica del diccionario)', () => {
  assert.equal(A.caminoDeLaLectura('nutricion.energia'), 'DICCIONARIO');
  assert.equal(A.caminoDeLaLectura('antropometria.peso'), 'DICCIONARIO');
  assert.equal(A.caminoDeLaLectura('entrenamiento.1rm-estimado'), 'CATALOGO');
  assert.equal(A.caminoDeLaLectura('entrenamiento.rir-indicado'), 'CATALOGO');
  assert.equal(A.caminoDeLaLectura('entrenamiento.no-existe'), null);
  assert.equal(A.definicionDeLaSerie('entrenamiento.1rm-estimado').nombre, '1RM estimado (Epley v1)');
  assert.equal(A.definicionDeLaSerie('nutricion.energia').nombre, 'Calorías registradas');
  const series = leer(join(SEGUIMIENTO, 'series.ts'));
  assert.match(series, /if \(caminoDeLaLectura\(p\.ref\.metricId\) !== 'CATALOGO'\) return leerSerie\(token, asesoradoId, p, periodo\);/);
  assert.match(series, /void leerSerieDelAnalisis\(token, asesoradoId, p, periodo, sesionPerdida\)/);
  assert.match(series, /return definicionDeMetrica\(ref\.metricId, unidad\) \?\? definicionDeLaSerie\(ref\.metricId, unidad\);/);
  // La descarga también vuelve a leer por el mismo camino, con el acceso de este momento.
  assert.match(leer(join(SEGUIMIENTO, 'analizar.tsx')), /leerSerieDelAnalisis\(token, asesoradoId, s, periodo, sesionPerdida\)/);
});

test('TEST-GRF-076 · «Analizar» usa la regla nueva, los nombres de Dirección, la frase de la coincidencia y «Dos etapas» lado a lado (mutación: volver a «Juntas»)', () => {
  const analizar = leer(join(SEGUIMIENTO, 'analizar.tsx'));
  assert.match(analizar, /superposicionDeLasElegidas\(elegidasParaSuperponer\)/);
  assert.doesNotMatch(analizar, /superposicionPermitida\(/);
  assert.match(analizar, /texto=\{NOMBRE_DEL_MODO\.PANELS\}/);
  assert.match(analizar, /texto=\{NOMBRE_DEL_MODO\.OVERLAY\}/);
  assert.doesNotMatch(analizar, /texto="Juntas"|texto="Separadas"/);
  assert.doesNotMatch(analizar, /Coincidencia temporal: no indica causa/);
  assert.equal((analizar.match(/\{FRASE_DE_LA_COINCIDENCIA\}/g) ?? []).length, 2, 'al pie de los gráficos y al pie de las etapas');
  assert.match(analizar, /\{dosEjes \? <p className="nota analizar__dos-ejes">\{COMO_LEER_DOS_EJES\}<\/p> : null\}/);
  assert.deepEqual(A.NOMBRE_DEL_MODO, { PANELS: 'Alineadas', OVERLAY: 'Superpuestas' });
  const etapas = leer(join(SEGUIMIENTO, 'etapas.tsx'));
  assert.match(etapas, /dosEtapasLadoALado\(\{/);
  assert.match(etapas, /Lado a lado, con todas las observaciones/);
  for (const archivo of ['como-se-lee.tsx', 'composicion-en-analizar.tsx']) assert.doesNotMatch(leer(join(SEGUIMIENTO, archivo)), />[^<]*«Juntas»[^<]*</, archivo);
});

test('TEST-GRF-077 · lo indicado de cada versión sale de las sesiones de esa versión, y lo que cambió se dice en la primera línea (mutación: asignar una sesión a la versión de hoy)', () => {
  const bandas = [vigencia('TRAINING', 'tv3', 'v3', '2026-08-01', '2026-09-15'), vigencia('TRAINING', 'tv4', 'v4', '2026-09-15', null)];
  const ejecucion = (date, rir, sets, planId = 'plan-sin-banda') => ({ date, planId, plannedSession: { prescriptions: [{ exerciseId: SENTADILLA, intensity: { criterion: 'RIR', target: { value: rir, reference: null } }, sets }, { exerciseId: OTRO_EJERCICIO, intensity: null, sets: [] }] } });
  const series5y6 = [
    { setIndex: 1, repetitions: { value: 5 }, note: null },
    { setIndex: 2, repetitions: { min: 5, max: 6 }, note: null },
  ];
  // La sesión del 18/9 ejecutó la versión 3 aunque se registró con la 4 vigente: va a la 3 (la que la rigió).
  const objetivos = TC.objetivosPorVersion(
    [ejecucion('2026-09-10', 2, series5y6), ejecucion('2026-09-14', 2, series5y6), ejecucion('2026-09-20', 1, series5y6), ejecucion('2026-09-18', 2, series5y6, 'tv3')],
    SENTADILLA,
    bandas,
  );
  assert.deepEqual(objetivos.get('tv3'), { rir: { desde: 2, hasta: 2 }, repeticiones: { desde: 5, hasta: 6 } });
  assert.deepEqual(objetivos.get('tv4'), { rir: { desde: 1, hasta: 1 }, repeticiones: { desde: 5, hasta: 6 } });
  assert.deepEqual(TC.cambiosDeLoIndicado(objetivos, bandas, '2026-08-01', '2026-10-31'), ['Con la versión 4 del plan de entrenamiento (desde el 15/9), el RIR indicado pasó de 2 a 1: la estimación cambia aunque la fuerza no.']);
  assert.deepEqual(TC.cambiosDeLoIndicado(objetivos, bandas, '2026-09-20', '2026-10-31'), [], 'un cambio fuera de la ventana no se dice');
  assert.deepEqual(TC.versionesQueSeActivaron([vigencia('NUTRITION', 'nv2', 'v2', '2026-10-04', null), vigencia('NUTRITION', 'nv1', 'v1', '2026-08-01', '2026-10-04')], '2026-09-01', '2026-10-31'), ['Nutrición: se activó la versión 2 el 4/10']);
});

test('TEST-GRF-078 · la lectura de cada punto dice lo que hace falta para leerlo, y la escala de cada serie es la misma en los dos modos', () => {
  const energia = definicionDeMetrica('nutricion.energia');
  assert.equal(A.lecturaDelPunto(punto('2026-11-02', 1850, { quality: 'PARTIAL' }), energia, 'kcal'), '1.850 kcal · subtotal: falta algún dato');
  const carga = definicionDeMetrica('entrenamiento.carga');
  assert.match(A.lecturaDelPunto(punto('2026-11-02', 80, { detail: [DETALLE_DE_CARGA_RAPIDA] }), carga, 'kg'), /^80 kg · carga rápida: tildada sin escribir/);
  const uno = serieDisponible('entrenamiento.1rm-estimado').definicion;
  assert.equal(A.lecturaDelPunto(punto('2026-11-02', 98.4, { quality: 'PARTIAL', segment: 'estimacion' }), uno, 'kg'), '98,4 kg · estimación orientativa');
  assert.equal(A.lecturaDelPunto(punto('2026-11-02', 98.4, { segment: 'observada:x' }), uno, 'kg'), '98,4 kg · observada por el profesional');
  assert.equal(A.lecturaDelPunto(punto('2026-11-02', null), energia, 'kcal'), 'sin valor conocido');
  assert.deepEqual(A.escalaDeLaSerie(serieDisponible('entrenamiento.1rm-estimado'), 'kg'), { enteros: false, rangoMinimo: 10 });
  assert.deepEqual(A.escalaDeLaSerie(serieDisponible('entrenamiento.1rm-estimado'), 'lb'), { enteros: false, rangoMinimo: 22 });
  assert.deepEqual(A.escalaDeLaSerie(serieDisponible('entrenamiento.rir'), 'RIR'), { enteros: true, desdeCero: true, minimoDelMaximo: 5 });
  assert.deepEqual(A.escalaDeLaSerie(serieDisponible('entrenamiento.repeticiones'), 'rep'), { enteros: true });
});

test('TEST-GRF-079 · nada de la rama guarda datos de salud en el navegador, y ningún .ts choca con un .tsx del mismo nombre (GR-T23)', () => {
  for (const carpeta of ['cruces', 'arma-tu-grafico']) {
    const archivos = readdirSync(join(GRAFICOS, carpeta));
    for (const a of archivos) assert.doesNotMatch(leer(join(GRAFICOS, carpeta, a)), /localStorage|sessionStorage|indexedDB/, `${carpeta}/${a}`);
    for (const a of archivos.filter((x) => x.endsWith('.ts'))) assert.ok(!existsSync(join(GRAFICOS, carpeta, a.replace(/\.ts$/, '.tsx'))), `${carpeta}/${a} choca con su .tsx`);
  }
});
