/**
 * WP-GRAFICOS fase 2 (DL-174), los gráficos de Nutrición y Antropometría (GR-11 a GR-14, GR-18 y GR-20).
 * Este archivo lo escribe solo la rama de Nutrición y Antropometría (C), con sus IDs (TEST-GRF-040 a TEST-GRF-059); la
 * rama base dejó la primera prueba de su registro. Cada prueba dice la mutación que la tiene que hacer fallar.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { esIdDeGrafico, serieDisponible, terminosProhibidosEnUnGrafico } from '@be/domain';

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

const { GRAFICOS_DE_NUTRICION } = await import('../src/app/pro/advisees/graficos/nutricion/registro.ts');
const { GRAFICOS_DE_ANTROPOMETRIA } = await import('../src/app/pro/advisees/graficos/antropometria/registro.ts');
const E = await import('../src/app/pro/advisees/graficos/eje-de-fechas.ts');
const L = await import('../src/app/pro/advisees/graficos/nutricion-y-cuerpo/lienzo.ts');
const T = await import('../src/app/pro/advisees/graficos/nutricion/temporadas.ts');
const D = await import('../src/app/pro/advisees/graficos/nutricion/dias-de-nutricion.ts');
const G12 = await import('../src/app/pro/advisees/graficos/nutricion/energia-por-dia.ts');
const G13 = await import('../src/app/pro/advisees/graficos/nutricion/macros-en-paneles.ts');
const K = await import('../src/app/pro/advisees/graficos/nutricion/gramos-por-kilo.ts');
const G14 = await import('../src/app/pro/advisees/graficos/nutricion/indicado-y-registrado-por-dia.ts');
const { COPY_NUTRICION_EN_GRAFICOS } = await import('../src/app/pro/advisees/graficos/nutricion/copy.ts');
const TOMAS = await import('../src/app/pro/advisees/graficos/antropometria/tomas.ts');
const P = await import('../src/app/pro/advisees/graficos/antropometria/perfil-por-sitio.ts');
const M = await import('../src/app/pro/advisees/graficos/antropometria/masa-grasa-por-metodo.ts');
const { COPY_ANTROPOMETRIA_EN_GRAFICOS } = await import('../src/app/pro/advisees/graficos/antropometria/copy.ts');

// ─── Datos de prueba ────────────────────────────────────────────────────────────────────────────

const conocidas = { daysKnown: 1, daysUndetermined: [], expected: 3, withPlanOption: 3, withDifferentMeal: 0, withoutRecord: 0 };
const sinPlan = { daysKnown: 0, daysUndetermined: [{ reason: 'NO_ACTIVE_PLAN', days: 1 }], expected: 0, withPlanOption: 0, withDifferentMeal: 0, withoutRecord: 0 };
const cobertura = (planMeals = conocidas) => ({ records: 2, recordsWithQuantities: 2, recordsWithoutQuantities: 0, daysWithData: null, daysInBucket: null, planMeals });

/** Un punto diario de Nutrición (API-PRJ-01), con cantidades en todos sus registros y las comidas del plan conocidas. */
const dia = (fecha, valor, extra = {}) => ({
  pointId: `d:${fecha}`,
  date: fecha,
  dateEnd: null,
  at: null,
  value: valor,
  quality: valor === null ? 'UNKNOWN' : 'COMPLETE',
  n: 2,
  segment: 't1',
  corrected: false,
  partialBucket: false,
  dataClass: null,
  method: null,
  planVersionIds: ['v1'],
  coverage: cobertura(),
  missing: [],
  detail: [],
  sources: [],
  sourcesTruncated: false,
  ...extra,
});
const subtotal = (fecha, valor, reason, extra = {}) => dia(fecha, valor, { quality: 'PARTIAL', missing: [{ reason, count: 1 }], ...extra });

const UNIDAD = { ENERGY: 'kcal', PROTEIN: 'g', CARBOHYDRATE: 'g', FAT: 'g', FIBER: 'g' };
/** Una respuesta de API-PRJ-01 de Nutrición, por día. */
const resultado = (metric, puntos, { gaps = [], objetivo = [], dias = [], versiones = [] } = {}) => ({
  kind: 'NUTRITION_PRESCRIBED_VS_RECORDED',
  metric,
  recorded: { metricId: `nutricion.${metric}`, label: metric, unit: UNIDAD[metric], scale: 'RATIO', grain: 'DAY', aggregation: 'SUM_OF_KNOWN', points: puntos, gaps, segments: [], notes: [] },
  prescribed: { energyRequirement: [], note: '', objectiveSteps: objetivo, planned: { days: dias, meals: [] } },
  coverage: { daysInPeriod: 7, daysWithRecords: puntos.length, records: 0, recordsWithQuantities: 0, recordsWithoutQuantities: 0, differentMealsWithoutQuantities: 0, annulledExcluded: 0, rectifiedCountedOnce: 0, planMeals: conocidas },
  planVersions: versiones,
});
const version = (id, label, desde, hasta) => ({ domain: 'NUTRITION', planVersionId: id, label, activatedAt: `${desde}T12:00:00.000Z`, from: desde, to: hasta, endedAt: null, endReason: null });
const periodo = (desde, hasta, desdeElVinculo = null) => ({ desde, hasta, hoy: hasta, desdeElVinculo });
const escala = (desde, hasta) => E.escalaDeFechas(periodo(desde, hasta), { izquierda: 88, derecha: 700 });

/** Todos los textos de un gráfico armado: lo que ve y lo que oye quien lo usa. */
function textosDe(g) {
  return [
    g.descripcion,
    ...g.notas,
    ...g.leyenda.map((e) => e.texto),
    ...g.temporadas.flatMap((t) => [t.rotulo, t.corto]),
    ...g.paneles.flatMap((p) => [p.nombre, ...(p.tipo === 'VALORES' ? [p.unidad, p.metodo ?? '', ...p.uniones.map((u) => u.rotulo ?? '')] : p.filas.map((f) => f.nombre))]),
    ...g.tabla.columnas.flatMap((c) => [c.nombre, c.unidad]),
    ...g.tabla.filas.flatMap((f) => f.celdas.map((c) => c?.texto ?? '')),
    ...g.tabla.sinRegistros,
  ].filter((t) => t !== '');
}

/** Todos los textos de un diccionario de copy: las cadenas y lo que devuelven sus funciones, en singular y en plural. */
function textosDelCopy(objeto) {
  const salida = [];
  const recorrer = (v) => {
    if (typeof v === 'string') salida.push(v);
    else if (typeof v === 'function') for (const n of [1, 2]) salida.push(String(v(n, n, n, n)));
    else if (Array.isArray(v)) v.forEach(recorrer);
    else if (v && typeof v === 'object') Object.values(v).forEach(recorrer);
  };
  recorrer(objeto);
  return salida;
}

const textosGenerados = { NUTRICION: [], AMBAS: [], ANTROPOMETRIA: [] };

// ─── Las pruebas ────────────────────────────────────────────────────────────────────────────────

test('TEST-GRF-040 · el registro de la rama es una lista de gráficos con identificadores estables y sin repetir', () => {
  for (const lista of [GRAFICOS_DE_NUTRICION, GRAFICOS_DE_ANTROPOMETRIA]) {
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

test('TEST-GRF-041 · GR-11: una proporción de las calorías se escribe y no se dibuja ni se convierte; la cantidad va en escalón hasta el día anterior al cambio (mutación: convertir la proporción a gramos)', () => {
  const objetivo = [
    { objectiveVersionId: 'o1', from: '2026-09-01', to: '2026-10-01', amount: { value: 120, unit: 'g/day' }, energyShare: null },
    { objectiveVersionId: 'o2', from: '2026-10-01', to: null, amount: null, energyShare: 30 },
  ];
  const escalones = T.escalonesDelObjetivo(objetivo, '2026-09-15', '2026-10-20', 0);
  assert.deepEqual(
    escalones.map((e) => [e.desde, e.hasta, e.valor]),
    [['2026-09-15', '2026-09-30', 120]],
    'solo la cantidad: la proporción no es un escalón',
  );
  assert.ok(!escalones.some((e) => e.valor === 30), 'la proporción no se dibuja con su número');
  const proporciones = T.proporcionesDelObjetivo(objetivo, 'PROTEIN', 'Proteínas registradas', '2026-09-15', '2026-10-20');
  assert.equal(proporciones.length, 1);
  assert.match(proporciones[0], /^Proteínas registradas, objetivo desde el 1\/10: 30 de las calorías \(proporción\): BE no la convierte a gramos ni la dibuja\.$/);
  assert.equal(T.objetivoDelDia(objetivo, 'PROTEIN', '2026-09-20'), 'objetivo 120 g');
  // Las temporadas: cada versión del plan y del objetivo, con su rótulo; las del plan, alternadas de fondo, sin color de juicio.
  const versiones = [version('v2', 'v2', '2026-09-02', '2026-10-05'), version('v3', 'v3', '2026-10-05', null)];
  const temporadas = T.temporadasDeNutricion(versiones, objetivo, '2026-09-15', '2026-10-20');
  assert.deepEqual(
    temporadas.map((t) => t.rotulo),
    ['Objetivo desde el 1/9', 'Plan v2 · desde el 2/9', 'Objetivo desde el 1/10', 'Plan v3 · desde el 5/10'],
  );
  const ubicadas = L.temporadasUbicadas(temporadas, escala('2026-09-15', '2026-10-20'));
  assert.deepEqual(
    ubicadas.map((t) => [t.clave, t.banda, t.conCambio]),
    [
      ['objetivo:o1', null, false],
      ['plan:v2', 0, false],
      ['objetivo:o2', null, true],
      ['plan:v3', 1, true],
    ],
  );
  // Dos rótulos cortos nunca se pisan: el que no entra queda en la lista de temporadas, en texto.
  const conRotulo = ubicadas.filter((t) => t.conRotulo);
  for (let i = 1; i < conRotulo.length; i++) assert.ok(Math.max(conRotulo[i].x1, 88) >= Math.max(conRotulo[i - 1].x1, 88) + conRotulo[i - 1].corto.length * 7, 'los rótulos no se pisan');
});

test('TEST-GRF-042 · GR-12: un día lleno con todo registrado, hueco si es un subtotal, cortado sin poder saber si faltan comidas y nada sin registros; la tabla dice lo mismo (mutación: un día sin registros como cero)', () => {
  const puntos = [
    dia('2026-11-02', 2150),
    subtotal('2026-11-03', 1850, 'SIN_CANTIDADES'),
    dia('2026-11-05', 2000, { coverage: cobertura(sinPlan) }),
    dia('2026-11-06', null, { missing: [{ reason: 'SIN_CANTIDADES', count: 2 }] }),
  ];
  const g = G12.graficoDeEnergia({
    resultado: resultado('ENERGY', puntos, { gaps: [{ from: '2026-11-04', to: '2026-11-04', days: 1, state: 'NO_DATA' }] }),
    cargadoTarde: new Set(['2026-11-03']),
    desde: '2026-11-02',
    hasta: '2026-11-08',
    hoy: '2026-11-09',
  });
  textosGenerados.NUTRICION.push(...textosDe(g));
  const panel = g.paneles[0];
  assert.deepEqual(
    panel.marcas.map((m) => [m.fecha, m.marca, m.tarde]),
    [
      ['2026-11-02', 'LLENA', false],
      ['2026-11-03', 'HUECA', true],
      ['2026-11-05', 'CONTORNO_CORTADO', false],
    ],
  );
  assert.ok(!panel.marcas.some((m) => m.valor === 0), 'un día sin registros ni valor no es un cero');
  const fila = (f) => g.tabla.filas.find((x) => x.fecha === f);
  assert.match(fila('2026-11-02').celdas[0].texto, /^2\.150 kcal · con cantidades en todos sus registros y sin comidas del plan sin registro$/);
  assert.match(fila('2026-11-03').celdas[0].texto, /subtotal: 1 registro sin cantidades \(cargado después\)$/);
  assert.match(fila('2026-11-05').celdas[0].texto, /no se puede saber si faltan comidas \(no regía un plan\)$/);
  assert.equal(fila('2026-11-06').celdas[0].texto, 'sin valor: 2 registros sin cantidades');
  assert.equal(fila('2026-11-04'), undefined, 'el día sin registros no es una fila: va en el texto de los tramos');
  assert.deepEqual(g.tabla.sinRegistros, ['el 4/11, sin registros']);
  assert.ok(g.leyenda.some((e) => e.muestra.tipo === 'MARCA' && e.muestra.marca === 'CONTORNO_CORTADO'));
  // El eje de las calorías empieza en cero: una diferencia chica no parece un salto.
  const geometria = L.geometriaDeValores(panel, escala('2026-11-02', '2026-11-08'), 132);
  assert.equal(geometria.extremos.abajo, 0);
  // Sin la lectura de lo cargado después, las marcas no lo dicen y la nota sí.
  const sinTarde = G12.graficoDeEnergia({ resultado: resultado('ENERGY', puntos), cargadoTarde: null, desde: '2026-11-02', hasta: '2026-11-08', hoy: '2026-11-09' });
  assert.ok(sinTarde.notas.includes(COPY_NUTRICION_EN_GRAFICOS.sinLoCargadoDespues));
  assert.ok(sinTarde.paneles[0].marcas.every((m) => !m.tarde));
});

test('TEST-GRF-043 · GR-12: la media de la semana dice con qué días se hizo y cuáles quedaron afuera; con menos de 4 no hay media y hoy no cuenta (mutación: promediar también los subtotales)', () => {
  const semana = [
    dia('2026-11-02', 2000),
    dia('2026-11-03', 2200),
    subtotal('2026-11-05', 1800, 'SIN_CANTIDADES'),
    dia('2026-11-06', 2400),
    dia('2026-11-07', 1600, { coverage: cobertura(sinPlan) }),
    subtotal('2026-11-08', 1000, 'COMIDA_DEL_PLAN_SIN_REGISTRO'),
  ];
  const [media] = G12.mediasDeLasSemanas(semana, 'ENERGY', '2026-11-02', '2026-11-08', '2026-11-10');
  assert.equal(media.valor, 2050, 'el promedio de los cuatro días con cantidades en todos sus registros');
  assert.equal(media.incluidos, 4);
  assert.equal(media.dias, 7);
  assert.equal(
    media.texto,
    '2.050 kcal por día de media · con 4 de 7 días; 1 sin registro, 1 con cantidades faltantes y 1 con comidas del plan sin registro · en 1 día no se puede saber si faltan comidas',
  );
  // Con hoy adentro de la semana: hoy y lo que viene no cuentan, y con dos días no alcanza.
  const [corta] = G12.mediasDeLasSemanas(semana, 'ENERGY', '2026-11-02', '2026-11-08', '2026-11-06');
  assert.equal(corta.valor, null);
  assert.equal(corta.dias, 4);
  assert.equal(corta.texto, 'sin media: hacen falta 4 días con cantidades en todos sus registros · con 2 de 4 días; 1 sin registro y 1 con cantidades faltantes · hoy no cuenta');
  // En el dibujo, la media es un tramo continuo sobre los días de su semana; sin media, no hay tramo.
  const g = G12.graficoDeEnergia({ resultado: resultado('ENERGY', semana), cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-08', hoy: '2026-11-10' });
  assert.deepEqual(
    g.paneles[0].medias.map((t) => [t.desde, t.hasta, t.valor]),
    [['2026-11-02', '2026-11-08', 2050]],
  );
  assert.ok(g.tabla.filas.every((f) => f.celdas[2]?.texto === media.texto), 'cada día de la semana dice la media de su semana');
  textosGenerados.NUTRICION.push(...textosDe(g), corta.texto);
});

test('TEST-GRF-044 · GR-13: cuatro paneles con su eje y su objetivo, la fibra sin dato no es cero, y nunca barras apiladas (mutación: dibujar la fibra sin dato como 0 g)', () => {
  const objetivo = [{ objectiveVersionId: 'o1', from: '2026-11-01', to: null, amount: { value: 120, unit: 'g/day' }, energyShare: null }];
  const resultados = [
    resultado('PROTEIN', [dia('2026-11-02', 130), dia('2026-11-03', 125)], { objetivo }),
    resultado('CARBOHYDRATE', [dia('2026-11-02', 250), dia('2026-11-03', 240)]),
    resultado('FAT', [dia('2026-11-02', 70), dia('2026-11-03', 65)]),
    resultado('FIBER', [dia('2026-11-02', 22), dia('2026-11-03', null, { missing: [{ reason: 'SIN_DATO_DEL_NUTRIENTE', count: 2 }] })]),
  ];
  const g = G13.graficoDeMacros({ resultados, macros: G13.MACROS_DEL_GRAFICO, cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-08' });
  textosGenerados.NUTRICION.push(...textosDe(g));
  assert.deepEqual(
    g.paneles.map((p) => p.id),
    ['nutricion.proteinas', 'nutricion.carbohidratos', 'nutricion.grasas', 'nutricion.fibra'],
  );
  assert.ok(g.paneles.every((p) => p.tipo === 'VALORES' && p.unidad === 'g' && p.escala.desdeCero === true), 'cada uno en su panel, con su eje desde cero');
  assert.deepEqual(
    g.paneles[0].escalones.map((e) => [e.desde, e.hasta, e.valor]),
    [['2026-11-02', '2026-11-08', 120]],
  );
  const fibra = g.paneles[3];
  assert.deepEqual(
    fibra.marcas.map((m) => m.fecha),
    ['2026-11-02'],
    'la fibra sin dato no es un punto en cero',
  );
  const fila = g.tabla.filas.find((f) => f.fecha === '2026-11-03');
  assert.equal(fila.celdas[3].texto, 'sin valor: 2 registros sin el dato de este nutriente');
  assert.match(fila.celdas[0].texto, /^125,0 g · con cantidades en todos sus registros y sin comidas del plan sin registro · objetivo 120 g$/);
  assert.ok(g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.macros.sinBarrasApiladas));
});

test('TEST-GRF-045 · GR-13 en g/kg: cada día con el peso medido de la última toma en ese día o antes, sin valor sin una toma anterior, y la línea se corta donde cambia el peso (mutación: usar la última toma del período para un día anterior)', () => {
  const peso = (id, fecha, valor, clase = 'MEASURED', tramo = 'cmp-1#1') => ({ ...dia(fecha, valor), pointId: `m:${id}`, at: `${fecha}T13:00:00.000Z`, dataClass: clase, segment: tramo, coverage: null, planVersionIds: [] });
  const serieDePeso = {
    metricId: 'antropometria.peso',
    label: 'Peso',
    unit: 'kg',
    scale: 'RATIO',
    grain: 'ORIGINAL',
    aggregation: 'NONE',
    points: [peso('a', '2026-11-03', 80), peso('r', '2026-11-05', 90, 'REPORTED'), peso('l', '2026-11-06', 170, 'MEASURED', 'cmp-2#2'), peso('b', '2026-11-10', 78)],
    gaps: [],
    segments: [
      { segment: 'cmp-1#1', label: 'ISAK · kg', breakReason: null },
      { segment: 'cmp-2#2', label: 'Balanza · lb', breakReason: 'Cambió la unidad.' },
    ],
    notes: [],
  };
  const pesos = K.pesosMedidos(serieDePeso);
  assert.deepEqual(
    pesos.map((p) => [p.fecha, p.valor]),
    [
      ['2026-11-03', 80],
      ['2026-11-10', 78],
    ],
    'solo el peso medido y en kg: el reportado y el de otra unidad no se usan',
  );
  const gramos = resultado('PROTEIN', [dia('2026-11-02', 160), dia('2026-11-03', 160), dia('2026-11-09', 156), subtotal('2026-11-10', 117, 'SIN_CANTIDADES')]).recorded;
  const s = K.serieAnaliticaPorKilo(gramos, pesos, 'nutricion.proteinas-por-kilo', 'Proteínas registradas por kilo de peso');
  const punto = (f) => s.points.find((p) => p.date === f);
  assert.equal(s.unit, 'g/kg');
  assert.equal(punto('2026-11-02').value, null, 'sin una toma anterior, sin valor');
  assert.ok(punto('2026-11-02').missing.some((m) => m.reason === K.SIN_TOMA_ANTERIOR));
  assert.equal(punto('2026-11-03').value, 2, 'la toma del mismo día cuenta');
  assert.equal(punto('2026-11-09').value, 156 / 80, 'la toma anterior, no la última del período (78 kg es posterior)');
  assert.equal(punto('2026-11-10').value, 1.5);
  assert.equal(punto('2026-11-10').quality, 'PARTIAL', 'un subtotal en gramos sigue siendo un subtotal en g/kg');
  assert.notEqual(punto('2026-11-09').segment, punto('2026-11-10').segment, 'la línea se corta donde cambia el peso usado');
  assert.equal(punto('2026-11-09').detail.at(-1).value, 'peso del 3/11: 80 kg');
  // El peso anterior al período se busca hasta un año antes, sin pasar del inicio del vínculo (TB-16).
  assert.deepEqual(K.inicioDeLaBusquedaDelPeso('2026-11-02', null), { desde: '2025-11-02', hasta: '2026-11-01' });
  assert.deepEqual(K.inicioDeLaBusquedaDelPeso('2026-11-02', '2026-06-01'), { desde: '2026-06-01', hasta: '2026-11-01' });
  assert.equal(K.inicioDeLaBusquedaDelPeso('2026-11-02', '2026-11-02'), null);
  // La tarjeta: los pesos usados, los días sin peso y los dos alcances en la guardia.
  const resultados = G13.MACROS_POR_KILO.map((m) => resultado(m.metrica, [dia('2026-11-02', 160), dia('2026-11-03', 160), dia('2026-11-09', 156)]));
  const g = G13.graficoDeMacrosPorKilo({ resultados, macros: G13.MACROS_POR_KILO, cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-09', pesos, pesoBuscadoDesde: '2025-11-02' });
  textosGenerados.AMBAS.push(...textosDe(g));
  assert.ok(g.paneles.every((p) => p.unidad === 'g/kg'));
  assert.deepEqual(
    g.paneles.map((p) => p.id),
    ['nutricion.proteinas-por-kilo', 'nutricion.carbohidratos-por-kilo', 'nutricion.grasas-por-kilo'],
  );
  assert.ok(g.notas.includes('Pesos usados: 80 kg (toma del 3/11).'));
  assert.ok(g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.porKilo.diasSinPeso(1)));
  assert.ok(g.notas.includes('El peso anterior se buscó desde el 2/11.'));
  assert.match(g.tabla.filas.find((f) => f.fecha === '2026-11-09').celdas[0].texto, /^1,95 g\/kg · .* · peso del 3\/11: 80 kg$/);
});

test('TEST-GRF-046 · GR-14: la diferencia con su signo va solo en los días con todo registrado; sin indicado cuando el plan deja elegir, y no se inventa (mutación: restarle lo indicado a un subtotal)', () => {
  const indicado = (fecha, valor) => ({ date: fecha, state: 'DETERMINED', value: valor, planVersionId: 'v1', dayTypeId: 'dt', dayType: 'Día habitual' });
  const conOpciones = (fecha) => ({ date: fecha, state: 'UNDETERMINED', reason: 'SEVERAL_OPTIONS', planVersionId: 'v1', mealsWithSeveralOptions: [{ meal: 'Almuerzo', options: 2 }] });
  const resultados = [
    resultado('ENERGY', [dia('2026-11-02', 2150), subtotal('2026-11-03', 1850, 'COMIDA_DEL_PLAN_SIN_REGISTRO'), dia('2026-11-04', 2000)], {
      dias: [indicado('2026-11-02', 2012), indicado('2026-11-03', 2012), conOpciones('2026-11-04')],
    }),
    resultado('PROTEIN', [dia('2026-11-02', 130)], { dias: [indicado('2026-11-02', 112)] }),
    resultado('CARBOHYDRATE', []),
    resultado('FAT', [dia('2026-11-02', 61.5)], { dias: [indicado('2026-11-02', 74)] }),
  ];
  const g = G14.graficoDeLaComparacion({ resultados, contraste: null, desde: '2026-11-02', hasta: '2026-11-08', enTramos: false });
  textosGenerados.NUTRICION.push(...textosDe(g));
  const [energia, proteinas, , grasas] = g.paneles;
  assert.deepEqual(
    energia.uniones.map((u) => [u.fecha, u.rotulo]),
    [['2026-11-02', '+138 kcal']],
    'el subtotal del 3/11 no lleva diferencia',
  );
  assert.deepEqual(
    proteinas.uniones.map((u) => u.rotulo),
    ['+18 g'],
  );
  assert.deepEqual(
    grasas.uniones.map((u) => u.rotulo),
    ['−12,5 g'],
  );
  assert.equal(G14.diferenciaConSigno(5, 5, 'g', 1), '0 g');
  // Lo indicado es un rombo hueco del color de lo indicado; con varias opciones, no hay rombo.
  const rombos = energia.marcas.filter((m) => m.marca === 'ROMBO');
  assert.deepEqual(
    rombos.map((m) => m.fecha),
    ['2026-11-02', '2026-11-03'],
  );
  assert.ok(rombos.every((m) => m.color === null && m.tramo === null));
  const celda = (fecha, i) => g.tabla.filas.find((f) => f.fecha === fecha).celdas[i].texto;
  assert.match(celda('2026-11-02', 0), /^registrado 2\.150 kcal \(.*\) · indicado 2\.012 kcal · diferencia \+138 kcal$/);
  assert.match(celda('2026-11-03', 0), /sin diferencia escrita: lo registrado es un subtotal$/);
  assert.match(celda('2026-11-04', 0), /· sin indicado: comidas con varias opciones$/);
  assert.ok(g.notas.some((n) => n.startsWith('La diferencia es lo registrado menos lo indicado')));
  assert.ok(g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.indicadoYRegistrado.sinTira), 'sin la lectura de las comidas, la tira no está y se dice');
  assert.ok(!g.paneles.some((p) => p.tipo === 'TIRA'));
});

test('TEST-GRF-047 · GR-14: la tira por comida dice con la opción del plan, con una comida diferente o sin registro; un día sin registros es un hueco y una comida diferente sin cantidades no es 0 g (mutación: dibujar un día sin registros como todas sin registro)', () => {
  const comida = (mealId, label, state, diferentes = []) => ({ mealId, label, state, registeredOptionId: null, executionId: null, differentMealExecutionIds: diferentes, quantityDifferences: [] });
  const contraste = [
    { date: '2026-11-02', planId: 'p1', dayTypeId: 'dt', dataState: 'HAS_DATA', meals: [comida('m1', 'Desayuno', 'REGISTERED'), comida('m2', 'Almuerzo', 'NO_DATA', ['x1']), comida('m3', 'Cena', 'NO_DATA')], outsidePrescription: [] },
    { date: '2026-11-03', planId: 'p1', dayTypeId: 'dt', dataState: 'NO_DATA', meals: [comida('m1', 'Desayuno', 'NO_DATA'), comida('m2', 'Almuerzo', 'NO_DATA'), comida('m3', 'Cena', 'NO_DATA')], outsidePrescription: [] },
    { date: '2026-11-04', planId: null, dayTypeId: null, dataState: 'HAS_DATA', meals: [], outsidePrescription: [] },
  ];
  const tira = G14.tiraDeLasComidas(contraste, '2026-11-02', '2026-11-08');
  assert.deepEqual(
    tira.filas.map((f) => [f.nombre, f.celdas.map((c) => `${c.fecha}:${c.estado}`)]),
    [
      ['Desayuno', ['2026-11-02:CON_OPCION']],
      ['Almuerzo', ['2026-11-02:COMIDA_DIFERENTE']],
      ['Cena', ['2026-11-02:SIN_REGISTRO']],
    ],
  );
  assert.equal(G14.comidasEnPalabras(contraste[0]), 'Desayuno: con la opción del plan · Almuerzo: con una comida diferente · Cena: sin registro');
  assert.equal(G14.comidasEnPalabras(contraste[1]), 'sin registros');
  assert.equal(G14.comidasEnPalabras(contraste[2]), 'sin plan vigente: no se conocen sus comidas');
  const resultados = [
    resultado('ENERGY', [subtotal('2026-11-02', 900, 'COMIDA_DIFERENTE_SIN_CANTIDADES')], { dias: [{ date: '2026-11-02', state: 'DETERMINED', value: 2012, planVersionId: 'v1', dayTypeId: 'dt', dayType: 'Día habitual' }] }),
    resultado('PROTEIN', []),
    resultado('CARBOHYDRATE', []),
    resultado('FAT', []),
  ];
  const g = G14.graficoDeLaComparacion({ resultados, contraste, desde: '2026-11-02', hasta: '2026-11-08', enTramos: true });
  textosGenerados.NUTRICION.push(...textosDe(g));
  assert.equal(g.paneles.at(-1).tipo, 'TIRA');
  const registrado = g.paneles[0].marcas.find((m) => m.marca !== 'ROMBO');
  assert.equal(registrado.marca, 'HUECA');
  assert.equal(registrado.valor, 900, 'lo registrado es lo conocido: la comida diferente sin cantidades no suma 0 g ni otro número');
  assert.equal(g.paneles[0].uniones.length, 0);
  assert.match(g.tabla.filas.find((f) => f.fecha === '2026-11-02').celdas[0].texto, /1 comida diferente sin cantidades/);
  assert.ok(g.notas.includes('Las comidas de cada día se leyeron en tramos de 92 días.'));
  assert.ok(g.leyenda.some((e) => e.muestra.tipo === 'COMIDA' && e.muestra.estado === 'COMIDA_DIFERENTE'));
});

/** Una respuesta de API-ANT-06 con sus métricas. */
const evolucion = (metricas, partialView = false) => ({
  adviseeId: 'a',
  period: { start: '2026-09-01', end: '2026-11-14', timeZone: 'America/Argentina/Buenos_Aires' },
  metrics: metricas,
  partialView,
  honesty: { interpolated: false, imputed: false, carriedForward: false },
});
const toma = (sourceId, evaluacion, fecha, valor, grupo, unidad, extra = {}) => ({
  occurredAt: `${fecha}T13:00:00.000Z`,
  recordedAt: `${fecha}T13:05:00.000Z`,
  value: valor,
  unit: unidad,
  sourceEvaluationId: evaluacion,
  sourceId,
  dataClass: 'MEASURED',
  comparabilityGroup: grupo,
  correctionState: 'EFFECTIVE',
  incomparableWithPrevious: [],
  ...extra,
});
const grupo = (id, protocolo, unidad, metodo = null) => ({ comparabilityGroup: id, protocolVersionId: protocolo, protocolName: protocolo, methodVersionId: metodo, unit: unidad });
const metrica = (codigo, puntos, grupos) => ({ metricCode: codigo, series: puntos, gaps: [], comparability: { groups: grupos } });

test('TEST-GRF-048 · GR-18: los pares por sitio solo dentro del mismo grupo de comparabilidad, un sitio sin medir es un hueco y cada familia tiene su eje común (mutación: unir dos tomas de grupos distintos)', () => {
  const datos = evolucion([
    metrica('pliegue-triceps', [toma('t1', 'ev1', '2026-09-10', 12, 'cmp-1', 'mm'), toma('t2', 'ev2', '2026-11-05', 10, 'cmp-1', 'mm')], [grupo('cmp-1', 'isak', 'mm')]),
    metrica('pliegue-subescapular', [toma('s1', 'ev1', '2026-09-10', 15, 'cmp-1', 'mm'), toma('s2', 'ev2', '2026-11-05', 14, 'cmp-2', 'mm')], [grupo('cmp-1', 'isak', 'mm'), grupo('cmp-2', 'otro', 'mm')]),
    metrica('pliegue-biceps', [toma('b1', 'ev1', '2026-09-10', 6, 'cmp-1', 'mm')], [grupo('cmp-1', 'isak', 'mm')]),
    metrica('perimetro-cintura', [toma('c1', 'ev1', '2026-09-10', 80, 'cmp-3', 'cm'), toma('c2', 'ev2', '2026-11-05', 79.2, 'cmp-3', 'cm')], [grupo('cmp-3', 'isak', 'cm')]),
    metrica('peso', [toma('p1', 'ev1', '2026-09-10', 72, 'cmp-4', 'kg'), toma('p2', 'ev3', '2026-11-10', 71, 'cmp-4', 'kg')], [grupo('cmp-4', 'isak', 'kg')]),
  ]);
  const observaciones = TOMAS.observacionesDeLasTomas([datos, datos]);
  assert.equal(observaciones.length, 9, 'la misma observación de dos tramos cuenta una vez');
  const tomas = P.tomasConSitios(observaciones);
  assert.deepEqual(
    tomas.map((t) => [t.evaluacionId, t.etiqueta, t.sitios]),
    [
      ['ev1', 'T1', 4],
      ['ev2', 'T2', 3],
    ],
    'una toma con solo el peso no tiene sitios',
  );
  assert.deepEqual(P.tomasPorOmision(tomas), { antes: 'ev1', despues: 'ev2' });
  const perfil = P.perfilPorSitio(observaciones, tomas, 'ev1', 'ev2');
  const fila = (m) => perfil.grupos.flatMap((g) => g.filas).find((f) => f.metrica === m);
  assert.deepEqual(
    perfil.grupos.map((g) => [g.familia, g.unidad, g.filas.map((f) => f.metrica)]),
    [
      ['PLIEGUES', 'mm', ['pliegue-triceps', 'pliegue-subescapular', 'pliegue-biceps']],
      ['PERIMETROS', 'cm', ['perimetro-cintura']],
    ],
  );
  assert.equal(fila('pliegue-triceps').estado, 'PAR');
  assert.equal(fila('pliegue-triceps').diferencia, '−2 mm');
  assert.equal(fila('perimetro-cintura').diferencia, '−0,8 cm');
  assert.equal(fila('pliegue-subescapular').estado, 'OTRO_GRUPO', 'otro protocolo: no se une ni se resta');
  assert.equal(fila('pliegue-subescapular').diferencia, null);
  assert.equal(fila('pliegue-biceps').estado, 'SOLO_ANTES');
  assert.equal(P.filaEnPalabras(fila('pliegue-biceps'), perfil.antes, perfil.despues).despues, 'sin dato en la toma del 5/11');
  assert.equal(P.filaEnPalabras(fila('pliegue-subescapular'), perfil.antes, perfil.despues).diferencia, COPY_ANTROPOMETRIA_EN_GRAFICOS.perfil.otroGrupo);
  const pliegues = perfil.grupos[0];
  assert.ok(pliegues.extremos.abajo <= 6 && pliegues.extremos.arriba >= 15, 'un eje común para la familia');
  assert.equal(P.xDelValor(pliegues.extremos.abajo, pliegues.extremos, 100, 500), 100);
  assert.equal(P.perfilPorSitio(observaciones, tomas, 'ev1', 'ev1'), null);
  textosGenerados.ANTROPOMETRIA.push(perfil.descripcion, ...perfil.grupos.flatMap((g) => g.filas.flatMap((f) => Object.values(P.filaEnPalabras(f, perfil.antes, perfil.despues)))));
});

test('TEST-GRF-049 · GR-20: los métodos de una masa comparten el eje, Lee va aparte, nada une dos tomas y la separación es de la misma toma (mutación: un eje propio por método)', () => {
  const dwHombres = '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f29';
  const faulkner = '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f1c';
  const lee = '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f22';
  const calculada = { dataClass: 'DERIVED' };
  const datos = evolucion(
    [
      metrica('masa-grasa-durnin-womersley', [toma('d1', 'ev1', '2026-09-10', 14.2, 'g1', 'kg', calculada), toma('d2', 'ev2', '2026-11-05', 13.8, 'g1', 'kg', calculada)], [grupo('g1', 'isak', 'kg', dwHombres)]),
      metrica('masa-grasa-faulkner', [toma('f1', 'ev1', '2026-09-10', 12.0, 'g2', 'kg', calculada), toma('f2', 'ev2', '2026-11-05', 11.9, 'g2', 'kg', calculada)], [grupo('g2', 'isak', 'kg', faulkner)]),
      metrica('masa-muscular-esqueletica-lee', [toma('l1', 'ev2', '2026-11-05', 30.1, 'g3', 'kg', calculada)], [grupo('g3', 'isak', 'kg', lee)]),
    ],
    true,
  );
  const g = M.graficoDeMasas(TOMAS.observacionesDeLasTomas([datos]), '2026-09-01', '2026-11-14', { parcial: true, enTramos: false });
  textosGenerados.ANTROPOMETRIA.push(...textosDe(g));
  assert.deepEqual(
    g.paneles.map((p) => p.id),
    ['masa-grasa', 'masa-muscular'],
    'la libre de grasa no está; la muscular de Lee, aparte',
  );
  const grasa = g.paneles[0];
  assert.deepEqual([...new Set(grasa.marcas.map((m) => m.serie))], ['masa-grasa-durnin-womersley', 'masa-grasa-faulkner']);
  assert.deepEqual([...new Set(grasa.marcas.map((m) => m.forma))], ['CIRCULO', 'CUADRADO'], 'cada método con su forma');
  assert.ok(grasa.marcas.every((m) => m.marca === 'PUNTO_ADENTRO' && m.tramo === null), 'calculado, con su punto adentro, y suelto');
  const geometria = L.geometriaDeValores(grasa, escala('2026-09-01', '2026-11-14'), 132);
  assert.ok(geometria.extremos.abajo <= 11.9 && geometria.extremos.arriba >= 14.2, 'un solo eje para los dos métodos');
  assert.equal(geometria.lineas.length, 0, 'nada une dos tomas');
  assert.deepEqual(
    grasa.uniones.map((u) => [u.fecha, u.rotulo, u.forma]),
    [
      ['2026-09-10', '2,2 kg', 'SEPARACION'],
      ['2026-11-05', '1,9 kg', 'SEPARACION'],
    ],
  );
  const fila = g.tabla.filas.find((f) => f.fecha === '2026-09-10');
  assert.equal(fila.celdas[0].texto, '14,2 kg · Masa grasa (Durnin y Womersley), hombres');
  assert.equal(fila.celdas[2].texto, 'se separan 2,2 kg');
  for (const nota of [COPY_ANTROPOMETRIA_EN_GRAFICOS.masas.porConstruccion, COPY_ANTROPOMETRIA_EN_GRAFICOS.masas.leeAparte, COPY_ANTROPOMETRIA_EN_GRAFICOS.sinErrorDeMedicion, COPY_ANTROPOMETRIA_EN_GRAFICOS.parcial]) {
    assert.ok(g.notas.includes(nota), nota);
  }
  assert.equal(M.graficoDeMasas([], '2026-09-01', '2026-11-14', { parcial: false, enTramos: false }), null);
});

test('TEST-GRF-050 · el lienzo: la línea une solo marcas de la misma serie y del mismo tramo, lo suelto no se une, y el eje abarca las uniones, el objetivo y las medias (mutación: unir lo indicado con lo registrado)', () => {
  const marca = (clave, serie, fecha, valor, tramo, extra = {}) => ({ clave, serie, fecha, en: null, valor, marca: 'LLENA', forma: 'CIRCULO', color: 0, tarde: false, tramo, ...extra });
  const panel = {
    tipo: 'VALORES',
    id: 'p',
    nombre: 'Prueba',
    unidad: 'g',
    metodo: null,
    escala: { enteros: false },
    marcas: [
      marca('a', 'registrado', '2026-11-02', 100, 't1'),
      marca('b', 'registrado', '2026-11-03', 110, 't1'),
      marca('c', 'registrado', '2026-11-04', 120, 't2'),
      marca('d', 'registrado', '2026-11-05', 130, 't2'),
      marca('i1', 'indicado', '2026-11-02', 90, null, { marca: 'ROMBO', color: null }),
      marca('i2', 'indicado', '2026-11-03', 95, null, { marca: 'ROMBO', color: null }),
      marca('fuera', 'registrado', '2026-10-20', 999, 't0'),
    ],
    uniones: [{ clave: 'u', fecha: '2026-11-02', en: null, desde: 90, hasta: 100, rotulo: '+10 g', forma: 'DIFERENCIA' }],
    escalones: [{ clave: 'o', desde: '2026-10-01', hasta: '2026-11-30', valor: 160, color: 0 }],
    medias: [{ clave: 'm', desde: '2026-11-02', hasta: '2026-11-08', valor: 50, color: 0 }],
  };
  const e = escala('2026-11-02', '2026-11-08');
  const g = L.geometriaDeValores(panel, e, 132);
  assert.equal(g.lineas.length, 2, 'dos tramos de lo registrado; lo indicado no se une');
  assert.ok(g.lineas.every((l) => l.serie === 'registrado' && l.puntos.length === 2));
  assert.ok(!g.marcas.some((m) => m.clave === 'fuera'), 'lo de fuera del período no se dibuja');
  assert.ok(g.extremos.abajo <= 50 && g.extremos.arriba >= 160, 'el eje abarca la media y el objetivo');
  assert.equal(g.escalones[0].x1, e.x('2026-11-02') - e.porDia / 2, 'el objetivo se recorta al período');
  assert.equal(g.uniones[0].x, e.x('2026-11-02'));
  // La tira por comida: cada celda en su día, sin pisar la del día siguiente.
  const tira = L.geometriaDeTira({ tipo: 'TIRA', id: 't', nombre: 'Comidas', filas: [{ clave: 'c', nombre: 'Cena', celdas: [{ fecha: '2026-11-02', estado: 'SIN_REGISTRO' }] }] }, e);
  assert.ok(tira.filas[0].celdas[0].ancho < e.porDia);
  assert.deepEqual(L.huecosEnTexto([{ from: '2026-10-30', to: '2026-11-03' }], '2026-11-02', '2026-11-08'), ['del 2/11 al 3/11, sin registros']);
});

test('TEST-GRF-051 · los registros: cada gráfico se ofrece solo con su área, los g/kg solo con Nutrición y Antropometría y lo propio en las dos, y el registro se lee sin cargar ninguna pantalla (mutación: ofrecer los g/kg con una sola área)', () => {
  const contexto = (alcances, propios = {}) => ({ acceso: { alcances, propios: { NUTRICION: false, ENTRENAMIENTO: false, ANTROPOMETRIA: false, ...propios } }, ejercicios: null, medidas: null });
  const ofrecidos = (lista, c) => lista.filter((g) => g.ofrecido(c)).map((g) => g.id);
  const deNutricion = ['nutricion.energia-por-dia', 'nutricion.macros-en-paneles', 'nutricion.indicado-y-registrado-por-dia'];
  assert.deepEqual(ofrecidos(GRAFICOS_DE_NUTRICION, contexto(['ENTRENAMIENTO'], { ENTRENAMIENTO: true })), [], 'un área sin acceso no deja rastro');
  assert.deepEqual(ofrecidos(GRAFICOS_DE_NUTRICION, contexto(['NUTRICION'], { NUTRICION: true })), deNutricion);
  assert.deepEqual(ofrecidos(GRAFICOS_DE_NUTRICION, contexto(['NUTRICION', 'ANTROPOMETRIA'], { NUTRICION: true })), deNutricion, 'sin tomas propias, no hay g/kg');
  assert.deepEqual(ofrecidos(GRAFICOS_DE_NUTRICION, contexto(['NUTRICION', 'ANTROPOMETRIA'], { NUTRICION: true, ANTROPOMETRIA: true })), [
    'nutricion.energia-por-dia',
    'nutricion.macros-en-paneles',
    'nutricion.macros-por-kilo',
    'nutricion.indicado-y-registrado-por-dia',
  ]);
  assert.deepEqual(ofrecidos(GRAFICOS_DE_ANTROPOMETRIA, contexto(['NUTRICION'], { NUTRICION: true })), []);
  assert.deepEqual(ofrecidos(GRAFICOS_DE_ANTROPOMETRIA, contexto(['ANTROPOMETRIA'], { ANTROPOMETRIA: true })), ['antropometria.perfil-por-sitio', 'antropometria.masa-grasa-por-metodo']);
  // Los códigos de la propuesta y dónde va cada uno en «Patrones».
  const todos = [...GRAFICOS_DE_NUTRICION, ...GRAFICOS_DE_ANTROPOMETRIA];
  assert.deepEqual(
    todos.map((g) => [g.id, g.codigo, g.ubicacion]),
    [
      ['nutricion.energia-por-dia', 'GR-12', 'EN_EL_TIEMPO'],
      ['nutricion.macros-en-paneles', 'GR-13', 'EN_EL_TIEMPO'],
      ['nutricion.macros-por-kilo', 'GR-13', 'EN_EL_TIEMPO'],
      ['nutricion.indicado-y-registrado-por-dia', 'GR-14', 'EN_EL_TIEMPO'],
      ['antropometria.perfil-por-sitio', 'GR-18', 'COMPARACION'],
      ['antropometria.masa-grasa-por-metodo', 'GR-20', 'EN_EL_TIEMPO'],
    ],
  );
  // Cada gráfico es un componente que trae su pantalla recién al dibujarse: este archivo no puede cargar un .tsx.
  for (const g of todos) assert.equal(typeof g.Grafico, 'function', g.id);
  // El catálogo: la rama programó los g/kg, que ahora se ofrecen (con los dos alcances).
  for (const id of ['nutricion.proteinas-por-kilo', 'nutricion.carbohidratos-por-kilo', 'nutricion.grasas-por-kilo']) {
    const s = serieDisponible(id);
    assert.equal(s.estado, 'OFRECIDA', id);
    assert.equal(s.definicion.implementada, true, id);
    assert.deepEqual(s.acceso.alcances, ['NUTRICION', 'ANTROPOMETRIA'], id);
    assert.equal(s.definicion.cambioRelativo, false, id);
  }
  assert.equal(serieDisponible('antropometria.masa-grasa-faulkner').unirPuntos, false, 'Antropometría, solo puntos');
});

test('TEST-GRF-052 · las lecturas: «Analizar» lee los g/kg con la rama C, y ninguna pieza de la rama guarda datos de salud en el navegador (mutación: dejar las derivadas en «sin especificación»)', () => {
  const lecturas = readFileSync(join(GRAFICOS, 'lecturas.ts'), 'utf8');
  assert.match(lecturas, /if \(serie\.fuente\.tipo === 'DERIVADA'\) return leerSeriePorKilo\(p, serie\);/);
  const deNutricion = readFileSync(join(GRAFICOS, 'nutricion/lecturas-de-nutricion.ts'), 'utf8');
  assert.match(deNutricion, /export async function leerSeriePorKilo/);
  assert.match(deNutricion, /'ANTHROPOMETRY_LONGITUDINAL', \{ periodStart: desde, periodEnd: hasta, metric: 'peso' \}/, 'el peso de las tomas propias, por API-PRJ-01');
  assert.match(deNutricion, /late: 'true'/, 'lo cargado después, de API-DSH-04');
  for (const carpeta of ['nutricion', 'antropometria', 'nutricion-y-cuerpo']) {
    for (const archivo of readdirSync(join(GRAFICOS, carpeta))) {
      assert.doesNotMatch(readFileSync(join(GRAFICOS, carpeta, archivo), 'utf8'), /localStorage|sessionStorage|indexedDB/, `${carpeta}/${archivo}`);
    }
  }
});

test('TEST-GRF-053 · los archivos de la rama: ningún .ts con un .tsx del mismo nombre (GR-T23), y la hoja de estilos usa solo los tokens (mutación: un color suelto)', () => {
  for (const carpeta of ['nutricion', 'antropometria', 'nutricion-y-cuerpo']) {
    for (const archivo of readdirSync(join(GRAFICOS, carpeta)).filter((a) => a.endsWith('.ts'))) {
      assert.ok(!existsSync(join(GRAFICOS, carpeta, archivo.replace(/\.ts$/, '.tsx'))), `${carpeta}/${archivo} choca con su .tsx`);
    }
  }
  const hoja = readFileSync(join(GRAFICOS, 'estilos/nutricion-y-cuerpo.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(hoja, /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/, 'los colores, siempre de los tokens de los dos temas');
  // Los registros cargan cada pantalla con un import diferido (este archivo ya los importó con Node, sin JSX).
  for (const archivo of ['nutricion/registro.ts', 'antropometria/registro.ts']) {
    const fuente = readFileSync(join(GRAFICOS, archivo), 'utf8');
    assert.match(fuente, /graficoPerezoso\(\(\) => import\('\.\//, archivo);
    assert.doesNotMatch(fuente, /^import [^;]*-en-pantalla'/m, `${archivo} no importa una pantalla de entrada`);
  }
});

test('TEST-GRF-054 · las pantallas que ya existían: «Registros» suma «Día por día» arriba de la lista y «Evolución» suma «Por sitio» y «Por método», con su código cargado al dibujarse', () => {
  const registros = readFileSync(join(WEB, 'src/app/pro/advisees/nutrition/registros.tsx'), 'utf8');
  assert.match(registros, /dynamic\(\(\) => import\('\.\.\/graficos\/nutricion\/dia-por-dia-en-registros'\)/);
  assert.ok(registros.indexOf('<DiaPorDia ') < registros.indexOf('<Contraste '), '«Día por día» va arriba de la lista');
  const evolucion = readFileSync(join(WEB, 'src/app/pro/advisees/anthropometry/evolucion.tsx'), 'utf8');
  assert.match(evolucion, /import\('\.\.\/graficos\/antropometria\/vistas-de-evolucion'\)/);
  assert.match(evolucion, /aria-pressed=\{manera === m\.clave\}/, 'la vista elegida se dice, no solo se ve');
  for (const texto of ["'Por medida'", "'Por sitio'", "'Por método'"]) assert.ok(evolucion.includes(texto), texto);
  const lienzo = readFileSync(join(GRAFICOS, 'nutricion-y-cuerpo/lienzo-en-pantalla.tsx'), 'utf8');
  assert.match(lienzo, /role="group"/);
  assert.match(lienzo, /aria-roledescription="gráfico"/);
  assert.match(lienzo, /aria-describedby=\{idDelResumen\}/);
  assert.match(lienzo, /tabIndex=\{0\}/);
  assert.match(lienzo, /e\.pointerType === 'mouse'/, 'pasar por encima mueve la regla solo con mouse');
  assert.match(lienzo, /<LecturaEnLaFecha /);
  assert.match(lienzo, /<TablaEquivalente /);
  const perfil = readFileSync(join(GRAFICOS, 'antropometria/perfil-por-sitio-en-pantalla.tsx'), 'utf8');
  assert.match(perfil, /<caption>/);
  assert.match(perfil, /scope="row"/);
});

test('TEST-GRF-055 · la guardia unida: ningún texto de la rama usa las palabras prohibidas de su área, ni el signo de porcentaje en Nutrición, ni dice que un día está entero o lo «consumido» (mutación: «Días completos» en una nota)', () => {
  const deNutricion = [...textosDelCopy(COPY_NUTRICION_EN_GRAFICOS), ...textosGenerados.NUTRICION];
  const deLasDos = textosGenerados.AMBAS;
  const deAntropometria = [...textosDelCopy(COPY_ANTROPOMETRIA_EN_GRAFICOS), ...textosGenerados.ANTROPOMETRIA];
  assert.ok(deNutricion.length > 100 && deLasDos.length > 10 && deAntropometria.length > 30, 'las pruebas anteriores dejaron sus textos');
  for (const t of deNutricion) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['NUTRICION']), [], t);
  for (const t of deLasDos) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['NUTRICION', 'ANTROPOMETRIA']), [], t);
  for (const t of deAntropometria) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ANTROPOMETRIA']), [], t);
  for (const t of [...deNutricion, ...deLasDos]) {
    assert.doesNotMatch(t, /%/, t);
    assert.doesNotMatch(t, /complet[oa]s?\b|consumid|consumo|ingerid/i, t);
  }
  for (const t of [...deNutricion, ...deLasDos, ...deAntropometria]) assert.doesNotMatch(t, /→|←|↑|↓/, `sin flechas: ${t}`);
  // La prueba muerde: con la palabra, la guardia la encuentra.
  assert.notDeepEqual(terminosProhibidosEnUnGrafico('Días completos: 3 de 4 con buen cumplimiento', ['NUTRICION']), []);
});

test('TEST-GRF-056 · lo que dice cada día en Nutrición: los faltantes por motivo, hoy en curso como subtotal y el motivo de no saber las comidas (mutación: decir «con todo registrado» de un subtotal)', () => {
  assert.equal(D.saberDelDia(dia('2026-11-02', 10)), 'CON_TODO');
  assert.equal(D.saberDelDia(dia('2026-11-02', 10, { partialBucket: true })), 'CON_ALGO_QUE_FALTA', 'hoy sigue en curso');
  assert.equal(D.saberDelDia(subtotal('2026-11-02', 10, 'COMIDA_DEL_PLAN_SIN_REGISTRO')), 'CON_ALGO_QUE_FALTA');
  assert.equal(D.saberDelDia(dia('2026-11-02', 10, { coverage: null })), 'SIN_SABER_SI_FALTAN_COMIDAS', 'sin cobertura no se afirma nada');
  const sinDiaTipo = { ...sinPlan, daysUndetermined: [{ reason: 'DAY_TYPE_NOT_RECORDED', days: 1 }] };
  assert.match(D.calidadDelDia(dia('2026-11-02', 10, { coverage: cobertura(sinDiaTipo) }), false), /el plan tiene más de un día tipo y ningún registro dice cuál/);
  const varios = dia('2026-11-02', 10, {
    quality: 'PARTIAL',
    partialBucket: true,
    missing: [
      { reason: 'SIN_CANTIDADES', count: 2 },
      { reason: 'COMIDA_DIFERENTE_SIN_CANTIDADES', count: 1 },
      { reason: 'COMIDA_DEL_PLAN_SIN_REGISTRO', count: 1 },
    ],
  });
  assert.equal(D.calidadDelDia(varios, true), 'subtotal: hoy, el día sigue en curso; 2 registros sin cantidades, 1 comida diferente sin cantidades y 1 comida del plan sin registro (cargado después)');
  assert.equal(D.faltanCantidades(subtotal('2026-11-02', 10, 'COMIDA_DEL_PLAN_SIN_REGISTRO')), false);
  assert.equal(D.faltanCantidades(subtotal('2026-11-02', 10, 'SIN_DATO_DEL_NUTRIENTE')), true);
  assert.equal(D.marcaDelDia(dia('2026-11-02', null)), null, 'sin valor no hay marca');
});
