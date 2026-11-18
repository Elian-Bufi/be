/**
 * WP-GRAFICOS fase 2 (DL-174), los cruces y «Armá tu gráfico» (GR-24, SP-01, SP-02 y GR-26).
 * Este archivo lo escribe solo la rama de los cruces y «Analizar» (D), con sus IDs (TEST-GRF-060 a 079 y, desde la pasada
 * visual y la revisión del 15/11, TEST-GRVD-001 en adelante); la rama base dejó la primera prueba de su registro. Cada
 * prueba dice la mutación que la pone en rojo.
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
  SERIES_DISPONIBLES,
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
const FC = await import('../src/app/pro/advisees/graficos/arma-tu-grafico/fecha-compartida.ts');
const SN = await import('../src/app/pro/advisees/graficos/cruces/semanas-de-nutricion.ts');
const G12 = await import('../src/app/pro/advisees/graficos/nutricion/energia-por-dia.ts');
const SEM = await import('../src/app/pro/advisees/graficos/semanas.ts');
const CAR = await import('../src/app/pro/advisees/graficos/carriles.ts');
const TE = await import('../src/app/pro/advisees/graficos/tabla-equivalente.ts');
const EJE = await import('../src/app/pro/advisees/graficos/ejes.ts');
const LI = await import('../src/app/pro/advisees/graficos/lo-indicado-en-el-tiempo.ts');
const PG = await import('../src/app/pro/advisees/graficos/cruces/preguntas-con-graficos.ts');

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
  // Una orientativa (11 repeticiones equivalentes) en la etapa A: se ve hueca y no entra en la mediana, ni en la del RIR
  // ni en el rango de repeticiones (mutación: contar todo lo de la persona, como antes; el rango diría «de 5 a 9» y la
  // lectura de SP-01, que usa el núcleo, «de 5 a 6», en la misma pantalla).
  const base = fuerza('2026-09-25', 70, 9, 2);
  const orientativa = { ...base, pointId: 'f-orientativa', estimate: { ...base.estimate, band: 'ORIENTATIVE' } };
  const puntos = [...deLaPersona, orientativa, observada].map((p) =>
    punto(p.date, p.estimate.value, { pointId: p.pointId, segment: p.source === 'OBSERVED' ? `observada:${p.pointId}` : 'estimacion', quality: p.estimate.band === 'CORE' ? 'COMPLETE' : 'PARTIAL' }),
  );
  const f = D.dosEtapasLadoALado({ serie: serie(uno.id, 'kg', 'ORIGINAL', puntos), definicion: uno.definicion, a: ETAPA_A, b: ETAPA_B, leido: LEIDO, escala: A.escalaDeLaSerie(uno, 'kg'), lectura: () => '', fuerza: [...deLaPersona, orientativa, observada] });
  assert.deepEqual(f.lados[0].fuerza, { sesiones: 5, medianaDelRir: 2, repeticiones: { desde: 5, hasta: 6 } });
  assert.deepEqual(f.lados[0].afuera, ['1 orientativa']);
  assert.equal(f.lados[0].puntos.find((p) => p.clave === 'f-orientativa').marca, 'HUECA');
  assert.match(D.fuerzaEnPalabras({ sesiones: 0, medianaDelRir: null, repeticiones: null }), /núcleo/);
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
  // Un entrenador sin Nutrición: GR-24 se ofrece con un ejercicio con sesiones, y sin ejercicio no pide las comidas de un
  // área sin acceso (mutación: comparar las calorías sin ejercicio aunque falte Nutrición).
  const soloEntrenamiento = acceso(['ENTRENAMIENTO'], { ENTRENAMIENTO: true });
  assert.equal(gr24.ofrecido(contexto(soloEntrenamiento)), false, 'sin un ejercicio con sesiones no hay qué comparar');
  assert.equal(gr24.ofrecido(contexto(soloEntrenamiento, { ejercicios: [ejercicioDelPeriodo(OTRO_EJERCICIO)] })), true);
  assert.equal(D.referenciaDeLaComparacion(null, soloEntrenamiento), null, 'sin ejercicio y sin Nutrición no se lee nada');
  assert.equal(D.referenciaDeLaComparacion(null, null), null, 'sin saber el acceso, tampoco');
  assert.equal(D.referenciaDeLaComparacion(null, acceso(['NUTRICION', 'ENTRENAMIENTO'], { ENTRENAMIENTO: true })), null, 'Nutrición sin un plan propio no tiene etapas propias');
  assert.deepEqual(D.referenciaDeLaComparacion(null, acceso(['NUTRICION'], { NUTRICION: true })), { metricId: 'nutricion.energia', exerciseKey: null, setIndex: null, unit: null });
  const sentadilla = { exerciseKey: `e:${SENTADILLA}`, nombre: 'Sentadilla trasera con barra', unidad: 'kg', serie: null };
  assert.deepEqual(D.referenciaDeLaComparacion(sentadilla, soloEntrenamiento), { metricId: 'entrenamiento.1rm-estimado', exerciseKey: `e:${SENTADILLA}`, setIndex: null, unit: 'kg' });
  assert.deepEqual(D.referenciaDeLaComparacion({ ...sentadilla, exerciseKey: `e:${OTRO_EJERCICIO}`, serie: 2 }, soloEntrenamiento), { metricId: 'entrenamiento.carga', exerciseKey: `e:${OTRO_EJERCICIO}`, setIndex: 2, unit: 'kg' });
  assert.equal(D.referenciaDeLaComparacion(sentadilla, acceso(['NUTRICION'], { NUTRICION: true })), null, 'un ejercicio sin el alcance de Entrenamiento no se lee');
  const enPantalla = leer(join(GRAFICOS, 'cruces/dos-etapas-en-pantalla.tsx'));
  assert.match(enPantalla, /const elegida = referenciaDeLaComparacion\(ejercicio, acceso \?\? null\);/);
  // Pedir un ejercicio nombra Entrenamiento: solo con ese alcance; sin él (o sin saber el acceso), el gráfico no está
  // (mutación: pedirle un ejercicio de Entrenamiento a una nutricionista sin ese alcance).
  assert.match(enPantalla, /const conEntrenamiento = acceso\?\.alcances\.includes\('ENTRENAMIENTO'\) \?\? false;/);
  assert.match(enPantalla, /if \(elegida === null\) \{[^}]*setEstado\(conEntrenamiento \? \{ tipo: 'SIN_DATOS', texto: C\.elegiUnEjercicio \} : \{ tipo: 'SIN_ACCESO' \}\);\s*return;/);
  // Un gráfico armado no pide una serie de un área sin acceso (mutación: leer igual y esperar el 404 de la API).
  assert.equal(A.serieConAcceso(serieDisponible('nutricion.energia'), soloEntrenamiento), false);
  assert.equal(A.serieConAcceso(serieDisponible('entrenamiento.1rm-estimado'), soloEntrenamiento), true);
  assert.equal(A.serieConAcceso(serieDisponible('antropometria.peso'), acceso(['NUTRICION'], { NUTRICION: true })), false);
  assert.equal(A.serieConAcceso({ acceso: { alcances: ['NUTRICION', 'ANTROPOMETRIA'] } }, acceso(['NUTRICION', 'ANTROPOMETRIA'], { NUTRICION: true })), false, 'una serie de dos áreas pide lo propio en las dos');
  assert.equal(A.serieConAcceso({ acceso: { alcances: ['NUTRICION', 'ANTROPOMETRIA'] } }, CASO_1_SP02), true);
  const armado = leer(join(GRAFICOS, 'arma-tu-grafico/grafico-armado.tsx'));
  assert.match(armado, /if \(!serieConAcceso\(catalogo, acceso\)\) return \{ tipo: 'sin-acceso' \};/);
  assert.ok(armado.indexOf('if (!serieConAcceso(catalogo, acceso))') < armado.indexOf('await leerLaFuerza('), 'decide antes de leer');
  assert.match(armado, /leerUna\(p, ref, i, ejercicios, acceso\)/);
  assert.match(leer(join(GRAFICOS, 'arma-tu-grafico/compositor-en-pantalla.tsx')), /<GraficoArmadoEnPantalla [^>]*acceso=\{acceso\}/);
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
  assert.deepEqual(l.primeraLinea, ['Con la versión 4 del plan de entrenamiento (desde el 15/9), el RIR indicado pasó de 2 a 1: la estimación puede cambiar aunque la fuerza no cambie.']);
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
  // Seguidas de verdad: una versión del objetivo sin los carbohidratos no trae su escalón, y las de alrededor no son
  // seguidas (mutación: aceptar dos etapas con otra versión en el medio).
  const conUnaEnElMedio = V.etapasDelObjetivo([escalon('o1', '2026-07-01', '2026-08-25', 250), escalon('o3', '2026-09-01', null, 300)], periodo);
  assert.deepEqual(conUnaEnElMedio.map((e) => [e.desde, e.hasta]), [['2026-08-01', '2026-08-24'], ['2026-09-01', '2026-10-31']]);
  assert.deepEqual(V.ventanaDelObjetivo(conUnaEnElMedio), { tipo: 'FALTA', motivo: 'ETAPAS_CORTAS' });
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
  // GR-VC13: es la media de la semana de GR-12, con cuándo es la semana y con cuántos días se hizo (TEST-GRVD-001).
  const semanas = SP2.mediaSemanal(e.energia, e.periodo.desde, e.periodo.hasta, e.hoy);
  assert.ok(semanas.every((s) => s.dias >= 0));
  assert.match(semanas.find((s) => s.valor !== null).lectura, /^Semana del \d+ \S+: .* por día de media · con \d+ de \d+ días/);
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

test('TEST-GRF-069 · tres unidades apagan «Superpuestas» y dicen por qué; dos unidades la permiten con un eje a cada lado y la frase; lo indicado va en el eje de lo registrado (mutación: dejar tres unidades; darle a lo indicado su eje)', () => {
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
  // GR-T59: lo indicado va en el eje de lo registrado de su misma unidad. El RIR registrado y el RIR indicado no tienen
  // familia: sin esta regla serían dos ejes «RIR» con escalas distintas. Mutación: darle a lo indicado su propio eje.
  const rir = A.serieElegidaDe('entrenamiento.rir', 'RIR', 'ORIGINAL');
  const rirIndicado = A.serieElegidaDe('entrenamiento.rir-indicado', 'RIR', 'ORIGINAL');
  const carga = A.serieElegidaDe('entrenamiento.carga', 'kg', 'ORIGINAL');
  const conLoIndicado = A.superposicionDeLasElegidas([rir, rirIndicado]);
  assert.equal(conLoIndicado.permitida, true);
  assert.deepEqual(conLoIndicado.lados, ['IZQUIERDA', 'IZQUIERDA'], 'lo indicado comparte el eje y la escala de lo registrado');
  assert.deepEqual(conLoIndicado.composicion.ejesY.map((e) => e.series), [['entrenamiento.rir', 'entrenamiento.rir-indicado']]);
  assert.equal(conLoIndicado.composicion.frase, null, 'una sola área y un solo eje no llevan la frase');
  // Lo indicado no suma un eje: con la carga quedan dos, aunque el dominio cuente tres grupos.
  const conLaCarga = A.superposicionDeLasElegidas([rirIndicado, carga, rir]);
  assert.equal(conLaCarga.permitida, true);
  assert.deepEqual(conLaCarga.lados, ['DERECHA', 'IZQUIERDA', 'DERECHA']);
  assert.equal(conLaCarga.composicion.ejesY.length, 2);
  // Sin lo registrado de su unidad, lo indicado va en su propio eje.
  assert.deepEqual(A.superposicionDeLasElegidas([rirIndicado, carga]).lados, ['IZQUIERDA', 'DERECHA']);
  // Con el RIR registrado de dos ejercicios, lo indicado no se pone en el eje de uno de ellos: no se sabe de cuál es, y
  // quedan tres ejes (mutación: ponerlo en el eje del primero que aparece).
  const dosRir = A.superposicionDeLasElegidas([rir, rir, rirIndicado]);
  assert.equal(dosRir.permitida, false);
  assert.equal(dosRir.motivo, 'MAS_DE_DOS_UNIDADES');
  assert.equal(A.esLoIndicadoDe('entrenamiento.rir-indicado'), true);
  assert.equal(A.esLoIndicadoDe('entrenamiento.rir'), false);
  // El compositor no se traba: con «Superpuestas» elegida y una sola serie (o tres unidades), se ve y se guarda
  // «Alineadas», que es lo que muestra el modo, y «Agregar al enfoque» sigue (mutación: apagarlo con el motivo).
  assert.deepEqual(A.modoDelCompositor({ modo: 'OVERLAY', series: 1, titulo: 'Fuerza', motivo: '«Superpuestas» pide dos series o tres.' }), { modo: 'PANELS', apagado: null });
  assert.deepEqual(A.modoDelCompositor({ modo: 'OVERLAY', series: 2, titulo: 'Fuerza', motivo: null }), { modo: 'OVERLAY', apagado: null });
  assert.deepEqual(A.modoDelCompositor({ modo: 'PANELS', series: 0, titulo: 'Fuerza', motivo: null }), { modo: 'PANELS', apagado: 'FALTA_SERIE' });
  assert.deepEqual(A.modoDelCompositor({ modo: 'PANELS', series: 2, titulo: '  ', motivo: null }), { modo: 'PANELS', apagado: 'FALTA_NOMBRE' });
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
  // Lo que «Analizar» muestra de cada serie que ofrece (el nombre, cómo se calcula, las ausencias y los límites) pasa la
  // guardia de su área: el hallazgo de la base (tres límites con un término prohibido dicho en negación) queda corregido
  // (mutación: devolverle a `nutricion.registros` el término prohibido que decía en negación).
  const ofrecidas = SERIES_DISPONIBLES.filter((s) => s.estado === 'OFRECIDA');
  assert.ok(ofrecidas.length > 10, `se revisaron ${ofrecidas.length} series`);
  for (const s of ofrecidas) {
    const d = s.definicion;
    for (const t of [d.nombre, d.nombreCorto, d.explicacion, d.comoSeCalcula, d.ausencias, ...d.limites]) assert.deepEqual(terminosProhibidosEnUnGrafico(t, [d.area]), [], `${s.id}: ${t}`);
  }
});

test('TEST-GRF-073 · Antropometría sigue en puntos sueltos también superpuesta, y lo indicado del entrenamiento va suelto y en rombo (mutación: unir las tomas; unir lo indicado)', () => {
  const escala = E.escalaDeFechas(PERIODO, { izquierda: 56, derecha: 500 });
  const energia = carrilDe('energia', 'kcal', 0, [puntoDelCarril('2026-11-02', 2000), puntoDelCarril('2026-11-03', 2100), puntoDelCarril('2026-11-04', 2050)]);
  const peso = carrilDe('peso', 'kg', 1, [puntoDelCarril('2026-11-02', 81.2), puntoDelCarril('2026-11-09', 80.9)], { unir: false });
  const g = S.geometriaSuperpuesta([energia, peso], ['IZQUIERDA', 'DERECHA'], ['Calorías', 'Peso'], escala, 200, 562);
  assert.equal(g.series[0].lineas.length, 1);
  assert.equal(g.series[1].lineas.length, 0, 'nada une dos tomas');
  assert.equal(g.series[1].marcas.length, 2);
  assert.equal(serieDisponible('antropometria.peso').unirPuntos, false);
  // GR-T59: lo indicado del entrenamiento elegido en «Analizar» también va suelto: rombos huecos, sin línea, con su
  // leyenda. Mutación: unir lo indicado con una línea o dibujarlo con el punto lleno de lo registrado.
  const lienzo = leer(join(SEGUIMIENTO, 'lienzo.tsx'));
  assert.match(lienzo, /const indicadas = new Set\(series\.filter\(\(s\) => s\.indicada === true\)\.map\(\(s\) => s\.indice\)\);/);
  assert.match(lienzo, /stroke=\{suelta \? 'none' : e\.color\}/);
  assert.match(lienzo, /\{observada \|\| indicada \? <Rombo /);
  // GR-D5 y §4.5 también en «Analizar»: las tomas de Antropometría van en puntos sueltos en todos los modos, también
  // superpuestas con las calorías (mutación: unir las tomas en el lienzo, como antes).
  assert.match(lienzo, /const sinLinea = new Set\(series\.filter\(\(s\) => s\.indicada === true \|\| s\.unir === false\)\.map\(\(s\) => s\.indice\)\);/);
  assert.match(lienzo, /const suelta = sinLinea\.has\(t\.indice\);/);
  assert.equal(A.unirLaSerieDe('antropometria.peso', 'kg'), false);
  assert.equal(A.unirLaSerieDe('antropometria.perimetro-cintura', 'cm'), false, 'cualquier medida, no solo las del catálogo fijo');
  assert.equal(A.unirLaSerieDe('nutricion.energia'), true);
  assert.equal(A.unirLaSerieDe('entrenamiento.rir-indicado'), false);
  assert.equal(A.unirLaSerieDe('entrenamiento.1rm-estimado', 'kg'), true);
  const analizar = leer(join(SEGUIMIENTO, 'analizar.tsx'));
  assert.match(analizar, /indicada: esLoIndicadoDe\(s\.ref\.metricId\),/);
  assert.match(analizar, /unir: unirLaSerieDe\(s\.ref\.metricId, s\.estado\.serie\.unit\),/);
  assert.match(analizar, /data-leyenda="indicado"/);
  // En un gráfico armado de «Patrones», lo indicado también va suelto: el catálogo deja unir el RIR indicado (mutación:
  // unirlo con una línea, como lo registrado).
  assert.equal(A.unirLaSerie(serieDisponible('entrenamiento.rir-indicado')), false);
  assert.equal(A.unirLaSerie(serieDisponible('entrenamiento.rir')), true);
  assert.equal(A.unirLaSerie(serieDisponible('antropometria.peso')), false);
  const armado = leer(join(GRAFICOS, 'arma-tu-grafico/grafico-armado.tsx'));
  assert.match(armado, /const carril: CarrilDePuntos = \{ \.\.\.delCatalogo, unir: unirLaSerie\(elegida\.serie\) \};/);
  // La leyenda dice lo que está dibujado y qué es cada forma en su serie (mutación: la leyenda fija de antes, sin el
  // rombo de lo observado ni lo indicado).
  assert.deepEqual(A.leyendaDeLasSeries([{ id: 'entrenamiento.rir', indicada: false, marcas: ['LLENA', 'HUECA_GRIS'] }, { id: 'entrenamiento.rir-indicado', indicada: true, marcas: ['HUECA'] }]), ['REGISTRADO', 'INDICADO', 'CARGA_RAPIDA']);
  assert.deepEqual(A.leyendaDeLasSeries([{ id: 'entrenamiento.1rm-estimado', indicada: false, marcas: ['LLENA', 'HUECA', 'ROMBO'] }]), ['REGISTRADO', 'ORIENTATIVA', 'OBSERVADA_POR_EL_PROFESIONAL']);
  assert.deepEqual(A.leyendaDeLasSeries([{ id: 'nutricion.energia', indicada: false, marcas: ['LLENA', 'HUECA'] }, { id: 'antropometria.peso', indicada: false, marcas: ['CONTORNO_CORTADO', 'PUNTO_ADENTRO'] }]), ['REGISTRADO', 'SUBTOTAL', 'REPORTADO', 'CALCULADO']);
  assert.doesNotMatch(armado, /leyenda=\{\['REGISTRADO', 'SUBTOTAL'\]\}/);
  // SP-01 y SP-02 también: la leyenda sale de lo dibujado (mutación: la lista fija, que decía «reportado» u «observada»
  // aunque no hubiera ninguno).
  const sp02 = SP2.carrilesDeEnergiaYPeso(entradaDeSp02());
  const formas = A.leyendaDeLosCarriles(sp02);
  assert.ok(formas.includes('REGISTRADO'));
  for (const s of formas) {
    const marca = { REGISTRADO: 'LLENA', SUBTOTAL: 'HUECA', REPORTADO: 'CONTORNO_CORTADO', CALCULADO: 'PUNTO_ADENTRO' }[s];
    assert.ok(sp02.some((c) => c.tipo === 'PUNTOS' && c.puntos.some((p) => p.valor !== null && p.marca === marca)), `${s} está dibujado`);
  }
  assert.deepEqual(A.leyendaDeLosCarriles([{ tipo: 'PUNTOS', id: 'entrenamiento.1rm-estimado', puntos: [{ valor: 100, marca: 'LLENA' }, { valor: 101, marca: 'HUECA' }, { valor: null, marca: 'ROMBO' }] }]), ['REGISTRADO', 'ORIENTATIVA']);
  for (const archivo of ['cruces/carbohidratos-y-fuerza-en-pantalla.tsx', 'cruces/energia-y-peso-en-pantalla.tsx']) {
    const fuente = leer(join(GRAFICOS, archivo));
    assert.match(fuente, /leyenda=\{leyendaDeLosCarriles\(carriles\)\}/, archivo);
    assert.doesNotMatch(fuente, /leyenda=\{\[/, archivo);
  }
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

test('TEST-GRF-076 · «Analizar» usa la regla nueva, los nombres de Dirección, la frase de la coincidencia, «Dos etapas» lado a lado y la cinta del tiempo arriba, con la fecha elegida compartida (mutación: volver a «Juntas»; sacar la cinta o su proveedor)', () => {
  const analizar = leer(join(SEGUIMIENTO, 'analizar.tsx'));
  assert.match(analizar, /superposicionDeLasElegidas\(elegidasParaSuperponer\)/);
  assert.doesNotMatch(analizar, /superposicionPermitida\(/);
  assert.match(analizar, /texto=\{NOMBRE_DEL_MODO\.PANELS\}/);
  assert.match(analizar, /texto=\{NOMBRE_DEL_MODO\.OVERLAY\}/);
  assert.doesNotMatch(analizar, /texto="Juntas"|texto="Separadas"/);
  assert.doesNotMatch(analizar, /Coincidencia temporal: no indica causa/);
  // La frase fija con la pieza de la base, a la vista, al pie de los gráficos y al pie de las etapas (la pasada visual).
  assert.equal((analizar.match(/<FraseDeLaCoincidencia \/>/g) ?? []).length, 2, 'al pie de los gráficos y al pie de las etapas');
  assert.doesNotMatch(analizar, /\{FRASE_DE_LA_COINCIDENCIA\}/);
  assert.match(analizar, /\{dosEjes \? <p className="nota analizar__dos-ejes">\{COMO_LEER_DOS_EJES\}<\/p> : null\}/);
  assert.deepEqual(A.NOMBRE_DEL_MODO, { PANELS: 'Alineadas', OVERLAY: 'Superpuestas' });
  // GR-23 arriba de «Analizar» (WP-GRAFICOS §4.2): sobre el intervalo que se ve, con los alcances de hoy y las versiones
  // propias, y solo cuando ya se sabe qué áreas hay (así no lee dos veces).
  assert.match(analizar, /import\('\.\.\/graficos\/cinta-del-tiempo-en-pantalla'\)\.then\(\(m\) => m\.CintaDelTiempoLeida\)/);
  // La cinta comparte la fecha elegida con los gráficos (§3.8): el proveedor del cursor, controlado por la fecha de
  // «Analizar». Mutación: sacar el proveedor (la cinta vuelve a su propio cursor y no mueve la lectura).
  assert.match(
    analizar,
    /\{dibujables\.length > 0 && !disponibles\.cargando \? \(\s*<ProveedorDelCursor fecha=\{fecha\} limites=\{\{ desde, hasta \}\} alElegirFecha=\{\(f\) => cambiar\(\{ fecha: f \}\)\}>\s*<CintaDelTiempoLeida lectura=\{\{ token, asesoradoId, sesionPerdida \}\} alcances=\{alcancesDeLaCinta\} vigencias=\{vigenciasDeLaCinta\} periodo=\{\{ desde, hasta, hoy, desdeElVinculo: null \}\} \/>\s*<\/ProveedorDelCursor>/,
  );
  const cursor = leer(join(GRAFICOS, 'cursor-de-fechas.tsx'));
  assert.match(cursor, /if \(!alElegirFecha\) return null;/, 'sin quién decida afuera, el cursor es propio, como siempre');
  assert.match(cursor, /<Contexto\.Provider value=\{controlado \?\? propio\}>/);
  // Lo que cae antes de lo que se ve se lleva a su borde, y la cinta sigue viendo elegido el evento que empieza antes (la
  // barra de una versión vigente desde antes): si no, la flecha volvía siempre al primero (mutación: que la cinta vea la
  // fecha acotada de la página).
  const intervalo = { desde: '2026-10-01', hasta: '2026-10-31' };
  assert.equal(FC.acotarAlIntervalo('2026-09-15', intervalo), '2026-10-01');
  assert.equal(FC.acotarAlIntervalo('2026-11-03', intervalo), '2026-10-31');
  assert.equal(FC.acotarAlIntervalo('2026-10-12', intervalo), '2026-10-12');
  assert.equal(FC.fechaVistaAdentro('2026-10-01', '2026-09-15', intervalo), '2026-09-15', 'la cinta sigue viendo su evento');
  assert.equal(FC.fechaVistaAdentro('2026-10-20', '2026-09-15', intervalo), '2026-10-20', 'si la página cambió la fecha por otro lado, manda la página');
  assert.equal(FC.fechaVistaAdentro('2026-10-20', null, intervalo), '2026-10-20');
  assert.equal(FC.fechaVistaAdentro('2026-10-01', '2026-09-15', null), '2026-10-01', 'sin límites, la de la página, como siempre');
  assert.match(cursor, /const vista = fechaVistaAdentro\(fecha, pedida, intervalo\);/);
  assert.match(cursor, /alElegirFecha\(f === null \|\| intervalo === null \? f : acotarAlIntervalo\(f, intervalo\)\);/);
  assert.match(analizar, /const alcancesDeLaCinta = useMemo\(\(\) => accesoDeLosDisponibles\(disponibles\)\.alcances, \[disponibles\]\);/);
  assert.ok(analizar.indexOf('<CintaDelTiempoLeida') < analizar.indexOf('<Lienzo'), 'la cinta va arriba de los gráficos');
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
  assert.deepEqual(TC.cambiosDeLoIndicado(objetivos, bandas, '2026-08-01', '2026-10-31'), ['Con la versión 4 del plan de entrenamiento (desde el 15/9), el RIR indicado pasó de 2 a 1: la estimación puede cambiar aunque la fuerza no cambie.']);
  assert.deepEqual(TC.cambiosDeLoIndicado(objetivos, bandas, '2026-09-20', '2026-10-31'), [], 'un cambio fuera de la ventana no se dice');
  assert.deepEqual(TC.versionesQueSeActivaron([vigencia('NUTRITION', 'nv2', 'v2', '2026-10-04', null), vigencia('NUTRITION', 'nv1', 'v1', '2026-08-01', '2026-10-04')], '2026-09-01', '2026-10-31'), ['Nutrición: se activó la versión 2 el 4/10']);
  // «Comparar dos etapas»: lo que también cambió entre A y B sale de las etapas del año de las dos áreas, no de las
  // versiones del período de la ficha. Dos etapas de Entrenamiento de junio a agosto, con la ficha en noviembre: la
  // versión de Nutrición del 10/7 y la v3 de Entrenamiento entre A y B se dicen (mutación: leer solo lo del período de
  // la ficha, que no las tiene, y decir que no se activó nada).
  const etapaDe = (dominio, planVersionId, etiqueta, desde) => ({ dominio, planVersionId, etiqueta, desde });
  const deEntrenamiento = [etapaDe('TRAINING', 't2', 'v2', '2026-06-01'), etapaDe('TRAINING', 't3', 'v3', '2026-07-01'), etapaDe('TRAINING', 't4', 'v4', '2026-08-01'), etapaDe('TRAINING', 't5', 'v5', '2026-10-01')];
  const deNutricion = [etapaDe('NUTRITION', 'n1', 'v1', '2026-05-01'), etapaDe('NUTRITION', 'n2', 'v2', '2026-07-10'), etapaDe('NUTRITION', 'n3', 'v3', '2026-11-01')];
  assert.deepEqual(TC.versionesEntreLasEtapas([...deEntrenamiento, ...deNutricion], deEntrenamiento[0], deEntrenamiento[2], '2026-08-31'), ['Entrenamiento: se activó la versión 3 el 1/7', 'Nutrición: se activó la versión 2 el 10/7']);
  assert.deepEqual(TC.versionesEntreLasEtapas([...deEntrenamiento.slice(2, 4), ...deNutricion], deEntrenamiento[2], deEntrenamiento[3], '2026-10-31'), [], 'nada entre las dos: no se inventa');
  const etapasTsx = leer(join(SEGUIMIENTO, 'etapas.tsx'));
  assert.match(etapasTsx, /versionesEntreLasEtapas\(\[\.\.\.etapas, \.\.\.etapasDeLaOtraArea\], primera, segunda, segunda\.ultimoDia \?\? leido\.hasta\)/);
  assert.doesNotMatch(etapasTsx, /disponibles\.vigencias/, 'no sale de las versiones del período de la ficha');
  assert.match(etapasTsx, /tambienCambio === null \? \(?\s*<p className="nota">\{COPY_DE_LOS_CRUCES\.sinLasVersiones\}<\/p>/, 'si no se pudieron leer, se dice que no se sabe');
  assert.match(leer(join(SEGUIMIENTO, 'analizar.tsx')), /etapasDeLaOtraArea=\{etapasDelAno\.fallaDe\[destino\.area === 'NUTRICION' \? 'TRAINING' : 'NUTRITION'\] \? null : etapasDelAno\.etapas\[destino\.area === 'NUTRICION' \? 'TRAINING' : 'NUTRITION'\]\}/);
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
  // GR-T15 también en «Analizar»: el eje del 1RM estimado abarca 10 kg (22 lb) como mínimo, en «Alineadas» y en
  // «Superpuestas» (mutación: dejar el dominio automático, que estira 2 kg de ruido a todo el alto).
  assert.equal(A.rangoMinimoDelCatalogo('entrenamiento.1rm-estimado', 'kg'), 10);
  assert.equal(A.rangoMinimoDelCatalogo('entrenamiento.1rm-estimado', 'lb'), 22);
  assert.equal(A.rangoMinimoDelCatalogo('entrenamiento.carga', 'kg'), undefined);
  assert.deepEqual(A.dominioConRangoMinimo([100.2, 101.8, 99.6], 10), [95, 106]);
  assert.equal(A.dominioConRangoMinimo([90, 104], 10), null, 'si los valores ya abarcan el rango, el eje queda como siempre');
  assert.equal(A.dominioConRangoMinimo([], 10), null);
  assert.equal(A.dominioConRangoMinimo([100], undefined), null);
  const lienzo = leer(join(SEGUIMIENTO, 'lienzo.tsx'));
  assert.match(lienzo, /<YAxis width=\{ANCHO_DEL_EJE\} domain=\{dominioDelEje\(false\)\}/);
  assert.match(lienzo, /<YAxis yAxisId="derecha" orientation="right" width=\{ANCHO_DEL_EJE\} domain=\{dominioDelEje\(true\)\}/);
  assert.match(lienzo, /if \(modo === 'RELATIVE'\) return DOMINIO_AUTOMATICO;/);
  assert.match(leer(join(SEGUIMIENTO, 'analizar.tsx')), /rangoMinimo: rangoMinimoDelCatalogo\(s\.ref\.metricId, s\.estado\.serie\.unit\),/);
});

test('TEST-GRF-079 · nada de la rama guarda datos de salud en el navegador, y ningún .ts choca con un .tsx del mismo nombre (GR-T23)', () => {
  for (const carpeta of ['cruces', 'arma-tu-grafico']) {
    const archivos = readdirSync(join(GRAFICOS, carpeta));
    for (const a of archivos) assert.doesNotMatch(leer(join(GRAFICOS, carpeta, a)), /localStorage|sessionStorage|indexedDB/, `${carpeta}/${a}`);
    for (const a of archivos.filter((x) => x.endsWith('.ts'))) assert.ok(!existsSync(join(GRAFICOS, carpeta, a.replace(/\.ts$/, '.tsx'))), `${carpeta}/${a} choca con su .tsx`);
  }
});

// ─── La pasada visual y la revisión del 15/11 (TEST-GRVD-*) ───────────────────────────────────────────

/** Un día de Nutrición con cantidades en todos sus registros y las comidas del plan conocidas (lleno en GR-12). */
const comidasConocidas = { daysKnown: 1, daysUndetermined: [], expected: 3, withPlanOption: 3, withDifferentMeal: 0, withoutRecord: 0 };
const diaLleno = (fecha, valor) => punto(fecha, valor, { coverage: { records: 2, recordsWithQuantities: 2, recordsWithoutQuantities: 0, daysWithData: null, daysInBucket: null, planMeals: comidasConocidas } });
const diaSubtotal = (fecha, valor) => punto(fecha, valor, { quality: 'PARTIAL', missing: [{ reason: 'SIN_CANTIDADES', count: 1 }] });

test('TEST-GRVD-001 · una sola media semanal (GR-VC13): GR-24 por semana y SP-02 dan lo mismo que GR-12 para la misma semana; un subtotal no entra y una semana con días sin media no es un cero ni un tramo vacío (mutación: promediar también los subtotales en GR-24; dibujar la semana sin media como la vacía; calcular otra media)', () => {
  // Semana del 2 nov: 4 días sin faltantes (2.000, 2.200, 2.400 y 1.600), 2 subtotales (1.000 y 1.300) y el 4 sin registros.
  // Semana del 9 nov: 3 días sin faltantes y 1 subtotal: tiene días, pero no media.
  const puntos = [
    diaLleno('2026-11-02', 2000),
    diaLleno('2026-11-03', 2200),
    diaLleno('2026-11-05', 2400),
    diaLleno('2026-11-06', 1600),
    diaSubtotal('2026-11-07', 1000),
    diaSubtotal('2026-11-08', 1300),
    diaLleno('2026-11-09', 2100),
    diaLleno('2026-11-10', 2000),
    diaLleno('2026-11-11', 1900),
    diaSubtotal('2026-11-12', 800),
  ];
  const [desde, hasta, hoy] = ['2026-11-02', '2026-11-15', '2026-11-20'];
  const gr12 = G12.mediasDeLasSemanas(puntos, 'ENERGY', desde, hasta, hoy);
  const gr24 = SN.semanasDeNutricion(puntos, 'ENERGY', desde, hasta, hoy);
  assert.equal(gr12[0].valor, 2050, 'GR-12: los cuatro días sin faltantes');
  assert.deepEqual(
    gr24.map((s) => [s.lunes, s.desde, s.hasta, s.valor, s.conDato, s.completa, s.conDias, s.texto]),
    gr12.map((m) => [m.lunes, m.desde, m.hasta, m.valor, m.incluidos, m.entera, m.conDias, m.texto]),
    'GR-24 por semana es la misma media que GR-12, con el mismo texto',
  );
  // La media de antes (con los subtotales adentro) daba 1.750 kcal con «6 de 7 días (2 subtotales)»: ya no se dice.
  const lectura = SEM.lecturaDeLaSemana(gr24[0], 'kcal');
  assert.equal(lectura, `Semana del 2 nov: ${gr12[0].texto}`);
  assert.doesNotMatch(lectura, /1\.750|subtotal/);
  assert.equal(gr24[1].valor, null);
  assert.equal(gr24[1].conDias, true);
  // En el dibujo: una barra (la semana con media), la semana sin media con su contorno cortado (no la columna gris) y los
  // días de las dos, también el subtotal, como puntos; la tira marca el subtotal a media altura.
  const g = SEM.geometriaPorSemana({ dias: SN.diasDeLaSerieDeNutricion(puntos), desde, hasta, hoy, ancho: 420, alto: 132, semanas: gr24 });
  assert.deepEqual(g.barras.map((b) => b.semana.valor), [2050]);
  assert.deepEqual(g.sinMedia.map((b) => b.semana.desde), ['2026-11-09']);
  assert.equal(g.vacias.length, 0, 'una semana con días no es una semana vacía');
  assert.ok(g.dias.some((d) => d.fecha === '2026-11-12'), 'los días de la semana sin media se ven igual');
  assert.equal(g.tira.find((d) => d.fecha === '2026-11-07').estado, 'hueco');
  assert.equal(g.tira.find((d) => d.fecha === '2026-11-02').estado, 'con');
  assert.deepEqual(SEM.marcasPorSemanaQueSeVen(gr24), { entera: false, hueca: true, sinMedia: true, vacia: false }, 'la leyenda dice solo lo que se ve');
  assert.match(SEM.resumenDeLasSemanas(gr24, 'kcal'), /1 tramo con media, de 2\.050 kcal; 0 con todos sus días con valor; 1 tramo con días y sin media/);
  // Las semanas siguen partidas en el cambio de etapa, y cada tramo es la media de GR-12 de ese tramo.
  const etapas = [
    { desde: '2026-10-01', hasta: '2026-11-04' },
    { desde: '2026-11-05', hasta: '2026-11-30' },
  ];
  const cortadas = SN.semanasDeNutricion(puntos, 'ENERGY', desde, hasta, hoy, etapas);
  assert.deepEqual(
    cortadas.map((s) => [s.desde, s.hasta]),
    [
      ['2026-11-02', '2026-11-04'],
      ['2026-11-05', '2026-11-08'],
      ['2026-11-09', '2026-11-15'],
    ],
  );
  assert.equal(cortadas[0].texto, G12.mediasDeLasSemanas(puntos, 'ENERGY', '2026-11-02', '2026-11-04', hoy)[0].texto);
  assert.ok(cortadas.every((s) => !s.completa), 'un tramo cortado no va lleno');
  // SP-02: la misma media, en el carril semanal de la base.
  const sp02 = SP2.mediaSemanal(serie('nutricion.energia', 'kcal', 'DAY', puntos), desde, hasta, hoy);
  assert.deepEqual(
    sp02.map((s) => [s.lunes, s.valor, s.dias, s.entera, s.conDias]),
    gr12.map((m) => [m.lunes, m.valor, m.incluidos, m.entera, m.conDias]),
  );
  assert.equal(sp02[0].lectura, `Semana del 2 nov: ${gr12[0].texto}`);
  const carril = { tipo: 'BARRAS_SEMANALES', id: 'nutricion.energia-media-semanal', nombre: 'Media', unidad: 'kcal', semanas: sp02, descripcion: '' };
  const escala = E.escalaDeFechas({ desde, hasta, hoy, desdeElVinculo: null }, { izquierda: 40, derecha: 400 });
  const gc = CAR.geometriaDelCarril(carril, escala, 140);
  assert.deepEqual([gc.barras.length, gc.barras[0].hueca, gc.sinMedia.length, gc.vacias.length], [1, true, 1, 0]);
  // La tabla equivalente tiene también la semana sin media, que dice por qué (no cuenta como lo último registrado).
  const tabla = TE.tablaEquivalente([carril]);
  assert.deepEqual(tabla.filas.map((f) => [f.fecha, f.celdas[0].registrada]), [['2026-11-02', true], ['2026-11-09', false]]);
  assert.match(tabla.filas[1].celdas[0].texto, /sin media: hacen falta 4 días/);
  assert.deepEqual(
    SP2.fichasDeLasSemanas(sp02).map((x) => x.glifo),
    ['SEMANA_HUECA', 'SEMANA_SIN_MEDIA'],
  );
  // Una sola implementación: el adaptador y SP-02 llaman a la de GR-12, no calculan otra (mutación: otra media).
  const fuente = leer(join(GRAFICOS, 'cruces', 'semanas-de-nutricion.ts'));
  assert.match(fuente, /import \{ mediasDeLasSemanas, type MediaDeLaSemana \} from '\.\.\/nutricion\/por-semana';/);
  assert.doesNotMatch(fuente, /\.reduce\(/, 'el adaptador no promedia nada');
  assert.doesNotMatch(leer(join(GRAFICOS, 'cruces', 'energia-y-peso.ts')), /incluidos\.push|\.reduce\(\(t, v\)/);
  const pantalla = leer(join(SEGUIMIENTO, 'etapas.tsx'));
  assert.match(pantalla, /semanasDeNutricion\(s\.estado\.observaciones\.points, metrica, leido\.desde, leido\.hasta, hoy, bandas\)/);
  assert.doesNotMatch(pantalla, /parcial: p\.quality === 'PARTIAL'/);
  // Los g/kg y la cantidad de registros no tienen media de la semana: van día por día (GR-VC02).
  assert.equal(SN.metricaConMediaDeLaSemana({ area: 'NUTRICION', parametro: 'RECORDS' }), null);
  assert.equal(SN.metricaConMediaDeLaSemana({ area: 'NUTRICION', parametro: 'ENERGY' }), 'ENERGY');
  assert.equal(SN.metricaConMediaDeLaSemana({ area: 'ENTRENAMIENTO', parametro: 'ENERGY' }), null);
  // De entrada por semana solo con alguna media (GR-VC12), y con más de seis semanas.
  assert.equal(SN.porSemanaDeEntrada('2026-09-01', '2026-11-15', [gr24]), true);
  assert.equal(SN.porSemanaDeEntrada('2026-09-01', '2026-11-15', [[gr24[1]]]), false, 'sin ninguna media, día por día');
  assert.equal(SN.porSemanaDeEntrada('2026-11-02', '2026-11-15', [gr24]), false, 'dos semanas: día por día');
  for (const x of [lectura, ...sp02.map((s) => s.lectura), ...COPY_DE_LOS_CRUCES.porSemana.comoSeArma, SEM.resumenDeLasSemanas(gr24, 'kcal')]) assert.deepEqual(terminosProhibidosEnUnGrafico(x, ['NUTRICION']), [], x);
});

test('TEST-GRVD-002 · GR-24 lado a lado: el eje con 3 a 5 marcas redondas sin números repetidos, la leyenda una sola vez con lo que se ve y «Lo que también cambió» con el cambio de lo indicado (mutación: el «4, 4, 3» del eje; la leyenda fija en cada métrica; perder el cambio de 4 a 3 repeticiones)', () => {
  // Las repeticiones de la serie 1: 4 en toda la etapa A y 3 en toda la B. Antes las marcas eran el piso, el medio y el
  // techo, y con dos enteros seguidos el medio se escribía igual que un extremo: «4, 4, 3».
  const puntos = [];
  for (let i = 0; i < 5; i++) puntos.push(punto(dia('2026-09-02', i * 5), 4), punto(dia('2026-10-02', i * 5), 3));
  const d = D.dosEtapasLadoALado({
    serie: serie('entrenamiento.repeticiones', 'rep', 'ORIGINAL', puntos),
    definicion: { id: 'entrenamiento.repeticiones', area: 'ENTRENAMIENTO', decimales: 0 },
    a: ETAPA_A,
    b: ETAPA_B,
    leido: LEIDO,
    escala: { enteros: true },
    lectura: () => '',
  });
  assert.equal(d.dibujable, true);
  const g = D.geometriaDeDosEtapas(d, 640, 124);
  const textos = g.marcasY.map((m) => EJE.textoDeLaMarcaDelEje(m.valor, d.extremos.decimales));
  assert.ok(g.marcasY.length >= 3 && g.marcasY.length <= 5, textos.join(', '));
  assert.equal(new Set(textos).size, textos.length, `ningún número repetido: ${textos.join(', ')}`);
  assert.ok(g.marcasY.every((m) => Number.isInteger(m.valor)), 'las repeticiones, en enteros');
  // La leyenda, una vez y con lo que se ve: acá todo entra en la mediana (sin «fuera», sin rombo).
  assert.deepEqual(D.marcasDeDosEtapas([d]), { enLaMediana: true, afuera: false, cargaRapida: false, observada: false, mediana: true });
  const conAfuera = D.dosEtapasLadoALado({
    serie: serie('nutricion.energia', 'kcal', 'DAY', [...[0, 1, 2, 3, 4].map((i) => punto(dia('2026-09-02', i), 2000)), punto(dia('2026-09-10', 0), 900, { quality: 'PARTIAL' }), ...[0, 1, 2, 3, 4].map((i) => punto(dia('2026-10-02', i), 2100))]),
    definicion: { id: 'nutricion.energia', area: 'NUTRICION', decimales: 0 },
    a: ETAPA_A,
    b: ETAPA_B,
    leido: LEIDO,
    escala: { enteros: false, desdeCero: true },
    lectura: () => '',
  });
  assert.equal(D.marcasDeDosEtapas([d, conAfuera]).afuera, true, 'el subtotal fuera de la mediana tiene su ficha');
  // Lo que también cambió: el cambio de lo indicado, de la versión 7 a la 8, en una línea (antes: «no hay otro cambio»).
  const cambio = LI.cambioCortoDeLoIndicado({ rir: null, repeticiones: { desde: 4, hasta: 4 }, carga: null }, { rir: null, repeticiones: { desde: 3, hasta: 3 }, carga: null });
  assert.equal(cambio, 'de 4 a 3 repeticiones');
  assert.equal(TC.cambioDeLoIndicadoEntreLasEtapas(cambio, 'Sentadilla trasera con barra', { etiqueta: 'v7' }, { etiqueta: 'v8' }), 'Lo indicado para Sentadilla trasera con barra: de 4 a 3 repeticiones (de la versión 7 a la 8)');
  assert.equal(TC.cambioDeLoIndicadoEntreLasEtapas(null, 'Sentadilla trasera con barra', { etiqueta: 'v7' }, { etiqueta: 'v8' }), null);
  const etapas = leer(join(SEGUIMIENTO, 'etapas.tsx'));
  // También con el 1RM estimado solo (sin una métrica por serie): antes no se leía lo indicado y la lista quedaba vacía.
  assert.match(etapas, /\?\? metricas\.find\(\(m\) => m\.exerciseKey !== null\)\?\.exerciseKey \?\? null/);
  assert.match(etapas, /cambioDeLoIndicadoEntreLasEtapas\(cambioCortoDeLoIndicado\(loIndicadoDeLaEtapa\(primera\), loIndicadoDeLaEtapa\(segunda\)\), nombreDelEjercicio, primera, segunda\)/);
  assert.match(etapas, /loIndicadoEnElTramo\(indicado\.observaciones, \(o\) => o\.comparacion\.planId === e\.planVersionId\)/, 'lo indicado de cada etapa, el de la versión que ejecutó cada sesión');
  assert.match(etapas, /<li key="lo-indicado" data-cambio-de-lo-indicado>/);
  assert.match(etapas, /\{sinLoIndicado \? <p className="nota">\{COPY_DE_LOS_CRUCES\.sinLoIndicadoDeLasEtapas\}<\/p> : null\}/, 'si no se pudo leer, se dice');
  assert.match(etapas, /<LeyendaDeDosEtapas marcas=\{marcasDelLadoALado\} \/>/);
  assert.equal((etapas.match(/conLeyenda=\{false\}/g) ?? []).length, 1, 'cada métrica sin su propia leyenda');
  const pantalla = leer(join(GRAFICOS, 'cruces/dos-etapas-en-pantalla.tsx'));
  assert.match(pantalla, /\{textoDeLaMarcaDelEje\(m\.valor, d\.extremos\.decimales\)\}/);
  assert.match(pantalla, /className="grafico-base__titulo dos-etapas__titulo"/, 'el título de la base (16 px)');
  assert.doesNotMatch(pantalla, /<details|cruce__frase/, '«Cómo leerlo» y la frase, con las piezas de la base');
  for (const x of [COPY_DE_LOS_CRUCES.sinLoIndicadoDeLasEtapas, ...Object.values(COPY_DE_LOS_CRUCES.leyenda).flatMap((v) => [v.corto, v.largo])]) assert.deepEqual(terminosProhibidosEnUnGrafico(x, ['NUTRICION', 'ENTRENAMIENTO']), [], x);
});

test('TEST-GRVD-003 · GR-12 y GR-13 en «Analizar», y «Ver la relación» con SP-01 y SP-02, solo con lo que se ofrece hoy; el caso negado no aparece (mutación: ofrecer la pregunta de la relación a un entrenador; leer un área sin acceso)', () => {
  const ids = (p, c) => PG.graficosDeLaPregunta(p, c).map((g) => g.id);
  const nutri = PG.PREGUNTA_DE_NUTRICION_POR_DIA;
  const relacion = PG.PREGUNTA_DE_LA_RELACION;
  // Un entrenador sin Nutrición: ninguna de las dos (no aparecen, ni en gris).
  const entrenador = PG.contextoDelRegistro(acceso(['ENTRENAMIENTO'], { ENTRENAMIENTO: true }), { ejercicios: [ejercicioDelPeriodo(SENTADILLA)], antropometria: null });
  assert.deepEqual(ids(nutri, entrenador), []);
  assert.deepEqual(ids(relacion, entrenador), []);
  // La nutricionista que también lleva Antropometría con tomas de peso: GR-12, GR-13 (también en g/kg) y SP-02.
  const nutricionista = PG.contextoDelRegistro(CASO_1_SP02, { ejercicios: null, antropometria: [{ metricCode: 'peso', observations: 3 }, { metricCode: 'cintura', observations: 0 }] });
  assert.deepEqual(nutricionista.medidas, ['peso'], 'solo las medidas con tomas en el período');
  assert.deepEqual(ids(nutri, nutricionista), ['nutricion.energia-por-dia', 'nutricion.macros-en-paneles', 'nutricion.macros-por-kilo']);
  assert.deepEqual(ids(relacion, nutricionista), ['cruce.energia-y-peso']);
  // Sin tomas de peso, SP-02 no está; sin Antropometría propia, tampoco los g/kg.
  assert.deepEqual(ids(relacion, PG.contextoDelRegistro(CASO_1_SP02, { ejercicios: null, antropometria: [] })), []);
  assert.deepEqual(ids(nutri, PG.contextoDelRegistro(acceso(['NUTRICION', 'ANTROPOMETRIA'], { NUTRICION: true }), { ejercicios: null, antropometria: [{ metricCode: 'peso', observations: 3 }] })), ['nutricion.energia-por-dia', 'nutricion.macros-en-paneles']);
  // El caso 1 de SP-01: con un ejercicio de la lista de la v1, sí; con otro, no.
  const conLaV1 = PG.contextoDelRegistro(CASO_1_SP01, { ejercicios: [ejercicioDelPeriodo(OTRO_EJERCICIO), ejercicioDelPeriodo(SENTADILLA)], antropometria: null });
  assert.deepEqual(ids(relacion, conLaV1), ['cruce.carbohidratos-y-fuerza']);
  assert.deepEqual(ids(relacion, PG.contextoDelRegistro(CASO_1_SP01, { ejercicios: [ejercicioDelPeriodo(OTRO_EJERCICIO)], antropometria: null })), []);
  // El ejercicio de SP-01: el más registrado de la lista de la v1, o el elegido; nunca uno fuera de la lista.
  assert.deepEqual(PG.ejercicioDelCruce([ejercicioDelPeriodo(OTRO_EJERCICIO), ejercicioDelPeriodo(SENTADILLA)], null), { exerciseKey: `e:${SENTADILLA}`, nombre: 'Sentadilla trasera con barra', unidad: 'kg', serie: null });
  assert.equal(PG.ejercicioDelCruce([ejercicioDelPeriodo(SENTADILLA)], `e:${OTRO_EJERCICIO}`).exerciseKey, `e:${SENTADILLA}`);
  assert.equal(PG.ejercicioDelCruce([ejercicioDelPeriodo(OTRO_EJERCICIO)], null), null);
  assert.equal(PG.esPreguntaConGraficos('ver-la-relacion'), true);
  assert.equal(PG.esPreguntaConGraficos('comparar-etapas'), false);
  // En pantalla: «Analizar» las abre con su pieza y la lista ofrece solo las que tienen algún gráfico ofrecido.
  const analizar = leer(join(SEGUIMIENTO, 'analizar.tsx'));
  assert.match(analizar, /if \(esPreguntaConGraficos\(preguntaConGraficos\)\) return <GraficosEnAnalizar tituloId=\{`\$\{id\}-titulo`\} pregunta=\{preguntaConGraficos\} \/>;/);
  assert.match(analizar, /\.filter\(\(p\) => graficosDeLaPregunta\(p, c\)\.length > 0\)/);
  assert.match(analizar, /<ListaDePreguntas conGraficos=\{preguntasConGraficos\} \/>/);
  assert.match(leer(join(SEGUIMIENTO, 'preguntas.tsx')), /\{conGraficos\.map\(\(p\) => \(/);
  const pieza = leer(join(SEGUIMIENTO, 'graficos-en-analizar.tsx'));
  assert.match(pieza, /graficosDeLaPregunta\(pregunta, contextoDelRegistro\(acceso, disponibles\)\)/);
  assert.match(pieza, /acceso=\{acceso\}/, 'cada gráfico recibe el acceso con que se ofreció');
  // Abierta por la dirección sin nada que ofrecer (un entrenador que escribe «pregunta=ver-la-relacion»), responde como una
  // pregunta que no existe: vuelve a «Analizar» sin pregunta, sin el título ni un aviso que delate qué hay.
  assert.match(pieza, /const sinNadaQueOfrecer = !disponibles\.cargando && !disponibles\.falla && graficos\.length === 0;/);
  assert.match(pieza, /if \(sinNadaQueOfrecer\) ir\(parametrosDePregunta\(null\)\);/);
  assert.match(pieza, /if \(disponibles\.cargando \|\| sinNadaQueOfrecer\) return <Cargando \/>;/);
  assert.ok(pieza.indexOf('if (disponibles.cargando || sinNadaQueOfrecer) return') < pieza.indexOf('<h2 id={tituloId}>'), 'el título no se ve antes de saber si se ofrece');
  for (const p of Object.values(PG.PREGUNTAS_CON_GRAFICOS)) for (const x of [p.pregunta, p.muestra]) assert.deepEqual(terminosProhibidosEnUnGrafico(x, ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']), [], x);
});

test('TEST-GRVD-004 · SP-01 y SP-02 con el lenguaje de la base: la frase una sola vez, la lectura a la vista adentro de la tarjeta y lo fisiológico en su «Cómo leerlo»; «Analizar» con la frase y el límite en «Cómo leerlo» (mutación: la frase dos veces; un desplegable propio sin el nombre de su gráfico)', () => {
  for (const archivo of ['cruces/carbohidratos-y-fuerza-en-pantalla.tsx', 'cruces/energia-y-peso-en-pantalla.tsx']) {
    const fuente = leer(join(GRAFICOS, archivo));
    assert.equal((fuente.match(/COPY_DE_LOS_CRUCES\.frase/g) ?? []).length, 1, archivo);
    assert.match(fuente, /aclaraciones=\{C\.comoLeerlo\}/, archivo);
    assert.match(fuente, /aLaVista=\{<LecturaDelCruce lectura=\{\w+\} ventana=\{C\.ventana\} \/>\}/, archivo);
  }
  const lectura = leer(join(GRAFICOS, 'cruces/lectura-del-cruce.tsx'));
  assert.doesNotMatch(lectura, /<details|lectura\.frase/, 'la frase y «Cómo leerlo» no se repiten en la lectura');
  // Lo de §5.1 sigue a la vista: la ventana, lo que también cambió y lo que BE no registra.
  for (const x of ['COPY_DE_LOS_CRUCES.ventana', 'COPY_DE_LOS_CRUCES.tambienCambio', 'COPY_DE_LOS_CRUCES.noRegistra']) assert.ok(lectura.includes(x), x);
  assert.match(leer(join(GRAFICOS, 'cruces/energia-y-peso-en-pantalla.tsx')), /fichas=\{semanal \? fichasDeLasSemanas\(semanal\.semanas\) : \[\]\}/);
  const analizar = leer(join(SEGUIMIENTO, 'analizar.tsx'));
  const pie = analizar.slice(analizar.indexOf('<div className="analizar__pie-de-la-frase">'));
  assert.ok(pie.indexOf('<FraseDeLaCoincidencia />') < pie.indexOf('<ComoLeerlo className="analizar__como-leerlo"'), 'la frase a la vista; el límite, último, en «Cómo leerlo»');
  assert.match(pie, /<ComoLeerlo className="analizar__como-leerlo" de="los gráficos de la pregunta">\n\s*<p>\{laPregunta\.limite\}<\/p>/);
  // Con dos ejes, que un cruce de líneas no quiere decir nada va a la vista, debajo del gráfico (GR-26).
  assert.match(analizar, /\{dosEjes \? <p className="nota analizar__dos-ejes">\{COMO_LEER_DOS_EJES\}<\/p> : null\}/);
  assert.match(A.COMO_LEER_DOS_EJES, /que dos líneas se crucen o se separen no quiere decir nada/);
  const css = leer(join(GRAFICOS, 'estilos', 'cruces.css'));
  assert.match(css, /\.analizar__pie-de-la-frase \.analizar__como-leerlo\[open\] \{\s*flex: 1 1 100%;/);
  // «Superpuestas» en SVG propio: la leyenda arriba del dibujo, la lectura con `hoy` (la de la base), la frase con su
  // pieza y el nombre de cada línea entero o ninguno (mutación: volver a cortarlo con «…»).
  const sup = leer(join(GRAFICOS, 'arma-tu-grafico/superpuestas-en-pantalla.tsx'));
  assert.ok(sup.indexOf('<Leyenda sentidos={leyenda} />') < sup.indexOf('className="grafico-base__area"'), 'la leyenda arriba del dibujo');
  assert.match(sup, /<LecturaEnLaFecha tabla=\{tabla\} fecha=\{cursor\.fecha\} tramo=\{cursor\.tramo\} hoy=\{periodo\.hoy\} \/>/);
  assert.match(sup, /\{frase \? <FraseDeLaCoincidencia texto=\{frase\} \/> : null\}/);
  assert.doesNotMatch(sup, /\.slice\(0, 17\)/);
  assert.match(sup, /s\.rotulo\.texto\.length \* ANCHO_DE_UNA_LETRA <= LUGAR_DE_LOS_NOMBRES - 8/);
});

test('TEST-GRVD-005 · «Agrupar por: Semana» de Nutrición en «Analizar» dibuja la media de GR-12, no la semana de la API con los subtotales (mutación: pedir la semana a API-PRJ-01; dibujar la semana sin media como un cero)', () => {
  const puntos = [
    diaLleno('2026-11-02', 2000),
    diaLleno('2026-11-03', 2200),
    diaLleno('2026-11-05', 2400),
    diaLleno('2026-11-06', 1600),
    diaSubtotal('2026-11-07', 1000),
    diaLleno('2026-11-09', 2100),
    diaSubtotal('2026-11-12', 800),
  ];
  const dias = serie('nutricion.energia', 'kcal', 'DAY', puntos);
  const [desde, hasta, hoy] = ['2026-11-02', '2026-11-15', '2026-11-20'];
  const semanal = SN.serieSemanalDeNutricion(dias, 'ENERGY', desde, hasta, hoy);
  const gr12 = G12.mediasDeLasSemanas(puntos, 'ENERGY', desde, hasta, hoy);
  assert.equal(semanal.grain, 'WEEK');
  assert.deepEqual(
    semanal.points.map((p) => [p.date, p.dateEnd, p.value, p.n, p.quality]),
    [
      ['2026-11-02', '2026-11-08', gr12[0].valor, 4, 'PARTIAL'],
      ['2026-11-09', '2026-11-15', null, 1, 'UNKNOWN'],
    ],
    'la media de GR-12 (2.050 kcal, sin el subtotal); la semana sin media no tiene valor (no es un cero)',
  );
  assert.equal(semanal.points[0].value, 2050);
  assert.deepEqual(semanal.points[0].detail, [{ label: SN.DETALLE_DE_LA_MEDIA_DE_LA_SEMANA, value: gr12[0].texto }]);
  assert.ok(semanal.points.every((p) => p.segment === 'semana-v1'));
  assert.equal(semanal.points[0].partialBucket, false);
  assert.equal(SN.serieSemanalDeNutricion(dias, 'ENERGY', '2026-11-04', hasta, hoy).points[0].partialBucket, true, 'una semana cortada por el período es un balde sin completar');
  // El despacho: con una métrica de Nutrición por semana se leen los días (una lectura) y se arma la semana de GR-12.
  const series = leer(join(SEGUIMIENTO, 'series.ts'));
  assert.match(series, /const conMediaDeLaSemana = p\.grano === 'WEEK' \? metricaConMediaDeLaSemana\(p\.definicion\) : null;/);
  assert.match(series, /const deLosDias = pedidoDe\(p\.ref, p\.definicion, 'DAY', periodo\);/);
  assert.match(series, /serie: serieSemanalDeNutricion\(estado\.observaciones, conMediaDeLaSemana, periodo\.desde, periodo\.hasta, hoyEn\(estado\.zona\)\)/);
  assert.ok(series.indexOf('if (conMediaDeLaSemana !== null)') < series.indexOf('const pedido = pedidoDe(p.ref, p.definicion, p.grano, periodo);'), 'decide antes de pedir la semana a la API');
  // El diccionario dice la misma regla en «Cómo se calcula».
  assert.match(definicionDeMetrica('nutricion.energia').comoSeCalcula, /Por semana, la media de la semana \(v1\): el promedio de los días con cantidades en todos sus registros, si son 4 o más/);
  assert.doesNotMatch(definicionDeMetrica('nutricion.energia').comoSeCalcula, /la semana es la media de los días con valor/);
});

test('TEST-GRVD-006 · lo que mostraron las capturas: las tomas y las sesiones se ven en un año, las kcal del dibujo van enteras y la tabla oculta no desborda la página (mutación: medir la toma con el ancho de un día; «1.924,8 kcal» en el dibujo; la tabla con la clase oculta)', () => {
  const sp02 = SP2.carrilesDeEnergiaYPeso(entradaDeSp02());
  assert.equal(sp02.find((c) => c.id === 'antropometria.peso').porSesion, true, 'cada toma con la marca de una sesión');
  assert.match(leer(join(GRAFICOS, 'cruces/carbohidratos-y-fuerza.ts')), /const fuerza: CarrilDePuntos = \{\n\s*tipo: 'PUNTOS',\n(?:\s*\/\/.*\n)*\s*porSesion: true,/);
  const lienzo = leer(join(SEGUIMIENTO, 'lienzo.tsx'));
  assert.match(lienzo, /medidaDeMarca\(estadoDeMarca\(pt\), sinLinea\.has\(indice\) \? Math\.max\(espacioPorDia, LUGAR_DE_UN_PUNTO_SUELTO\) : espacioPorDia\)/, 'en «Analizar», un punto suelto (una toma) no queda de un píxel');
  const paneles = leer(join(GRAFICOS, 'paneles-alineados.tsx'));
  assert.match(paneles, /maximumFractionDigits: unidad === 'kcal' \? 0 : 1/);
  assert.match(paneles, /texto: valorCorto\(p\.valor, carril\.unidad\)/);
  assert.doesNotMatch(leer(join(GRAFICOS, 'minigrafico-por-semana.tsx')), /<table className="visualmente-oculto"/);
});
