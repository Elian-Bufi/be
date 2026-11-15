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
import { esIdDeGrafico, GRAFICOS_SUGERIDOS, graficoSugerido, serieDisponible, terminosProhibidosEnUnGrafico, textoDeFaltante } from '@be/domain';

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
const LEIDO = await import('../src/app/pro/advisees/graficos/nutricion-y-cuerpo/leido.ts');

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
    ...g.aclaraciones,
    g.metodo ?? '',
    ...g.leyenda.flatMap((e) => [e.texto, e.largo]),
    ...(g.porSemana ? [g.porSemana.detalle, g.porSemana.descripcion, ...g.porSemana.aclaraciones, ...g.porSemana.leyenda.flatMap((e) => [e.texto, e.largo]), ...g.porSemana.columnas.flatMap((c) => [c.nombre, c.unidad]), ...g.porSemana.tramos.flatMap((t) => t.textos)] : []),
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

/** La guardia unida sobre textos que arma una prueba posterior a TEST-GRF-055: las mismas reglas, en el lugar. */
function sinPalabrasProhibidas(textos, areas) {
  for (const t of textos) {
    assert.deepEqual(terminosProhibidosEnUnGrafico(t, areas), [], t);
    if (areas.includes('NUTRICION')) assert.doesNotMatch(t, /%|complet[oa]s?\b|consumid|consumo|ingerid/i, t);
    assert.doesNotMatch(t, /→|←|↑|↓/, `sin flechas: ${t}`);
  }
}

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
    ubicadas.map((t) => [t.clave, t.tenue, t.conCambio]),
    [
      ['objetivo:o1', null, false],
      ['plan:v2', false, false],
      ['objetivo:o2', null, true],
      ['plan:v3', true, true],
    ],
    'las versiones del plan alternan como en la base: la primera sin fondo, la siguiente con el tono tenue',
  );
  // Dos rótulos nunca se pisan: cada uno es el entero, el corto o nada (y la temporada sigue en el texto).
  const conRotulo = ubicadas.filter((t) => t.texto !== null);
  assert.ok(conRotulo.length > 0);
  for (const t of conRotulo) assert.ok(t.texto === t.rotulo || t.texto === t.corto, t.texto);
  for (let i = 1; i < conRotulo.length; i++) assert.ok(Math.max(conRotulo[i].x1, 88) + 4 >= Math.max(conRotulo[i - 1].x1, 88) + 4 + conRotulo[i - 1].texto.length * 6.6 + 8, 'los rótulos no se pisan');
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
  // Con registros de otro profesional que no se ven (`partialView`), el número del día no es todo lo registrado: se dice.
  assert.ok(!g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.deOtroProfesional));
  const parcial = G12.graficoDeEnergia({ resultado: resultado('ENERGY', puntos), cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-08', hoy: '2026-11-09', parcial: true });
  assert.ok(parcial.notas.includes(COPY_NUTRICION_EN_GRAFICOS.deOtroProfesional), 'la vista parcial se dice (mutación: callarla)');
  // Una versión que rige desde el año anterior lleva su año en la temporada.
  const deAntes = G12.graficoDeEnergia({ resultado: resultado('ENERGY', puntos, { versiones: [version('v1', 'v1', '2025-12-01', null)] }), cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-08', hoy: '2026-11-09' });
  assert.deepEqual(
    deAntes.temporadas.map((t) => t.rotulo),
    ['Plan v1 · desde el 1/12/2025'],
  );
  textosGenerados.NUTRICION.push(...textosDe(parcial), ...textosDe(deAntes));
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
  // En el dibujo «Por semana», la media es la barra de su semana: hueca, porque no entraron los siete días.
  const g = G12.graficoDeEnergia({ resultado: resultado('ENERGY', semana), cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-08', hoy: '2026-11-10' });
  assert.deepEqual(
    g.paneles[0].semanas.map((t) => [t.desde, t.hasta, t.valor, t.entera]),
    [['2026-11-02', '2026-11-08', 2050, false]],
  );
  assert.deepEqual(g.porSemana.tramos.map((t) => t.textos), [[media.texto]], 'la lectura de la semana dice la misma media, con sus días');
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
  assert.ok(g.aclaraciones.includes(COPY_NUTRICION_EN_GRAFICOS.macros.sinBarrasApiladas), 'en «Cómo leerlo»');
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
  // La búsqueda empezó el año anterior: sin el año, «desde el 2/11» se leería como el primer día del período.
  assert.ok(g.notas.includes('El peso anterior se buscó desde el 2/11/2025.'));
  assert.match(g.tabla.filas.find((f) => f.fecha === '2026-11-09').celdas[0].texto, /^1,95 g\/kg · .* · peso del 3\/11: 80 kg$/);
  assert.ok(!g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.deOtroProfesional) && !g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.porKilo.tomasDeOtro));
  // Un peso del año anterior (GR-T44 lo busca hasta un año antes) lleva su año: no se lee como reciente (mutación: sacar el año).
  const delAnioPasado = [{ clave: 'm:v', fecha: '2025-12-20', en: '2025-12-20T13:00:00.000Z', valor: 80 }];
  const enero = G13.MACROS_POR_KILO.map((m) => resultado(m.metrica, [dia('2026-01-05', 160)]));
  const viejo = G13.graficoDeMacrosPorKilo({ resultados: enero, macros: G13.MACROS_POR_KILO, cargadoTarde: new Set(), desde: '2026-01-01', hasta: '2026-01-31', pesos: delAnioPasado, pesoBuscadoDesde: '2025-01-01', parcial: true, pesosParciales: true });
  textosGenerados.AMBAS.push(...textosDe(viejo));
  assert.match(viejo.tabla.filas[0].celdas[0].texto, / · peso del 20\/12\/2025: 80 kg$/);
  assert.ok(viejo.notas.includes('Pesos usados: 80 kg (toma del 20/12/2025).'));
  assert.equal(K.serieAnaliticaPorKilo(enero[0].recorded, delAnioPasado, 'nutricion.proteinas-por-kilo', 'P').points[0].detail.at(-1).value, 'peso del 20/12/2025: 80 kg', '«Analizar» también');
  assert.equal(L.diaYMes('2026-01-05', '2026-01-31'), '5/1');
  // Lo de otro profesional no se ve y no suma: se dice, en los gramos y en el peso (mutación: no decirlo).
  assert.ok(viejo.notas.includes(COPY_NUTRICION_EN_GRAFICOS.deOtroProfesional));
  assert.ok(viejo.notas.includes(COPY_NUTRICION_EN_GRAFICOS.porKilo.tomasDeOtro));
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
  assert.ok(g.aclaraciones.some((n) => n.startsWith('La diferencia es lo registrado menos lo indicado')));
  assert.ok(g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.indicadoYRegistrado.sinTira), 'sin la lectura de las comidas, la tira no está y se dice');
  assert.ok(!g.paneles.some((p) => p.tipo === 'TIRA'));
  // Con registros de otro profesional que no se ven, la diferencia no es contra todo lo registrado: se dice.
  assert.ok(!g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.deOtroProfesional));
  assert.ok(G14.graficoDeLaComparacion({ resultados, contraste: null, desde: '2026-11-02', hasta: '2026-11-08', enTramos: false, parcial: true }).notas.includes(COPY_NUTRICION_EN_GRAFICOS.deOtroProfesional));
  // Las pantallas pasan la vista parcial de cada lectura a GR-12, GR-13 (también en g/kg, con la de los pesos) y GR-14.
  const pantalla = (archivo) => readFileSync(join(GRAFICOS, 'nutricion', archivo), 'utf8');
  assert.match(pantalla('energia-por-dia-en-pantalla.tsx'), /parcial: energia\.datos\.parcial/);
  assert.equal(pantalla('macros-en-paneles-en-pantalla.tsx').match(/parcial: macros\.datos\.some\(\(m\) => m\.parcial\)/g)?.length, 2);
  assert.match(pantalla('macros-en-paneles-en-pantalla.tsx'), /pesosParciales: pesos\.datos\.parcial/);
  assert.match(pantalla('indicado-y-registrado-por-dia-en-pantalla.tsx'), /parcial: metricas\.datos\.some\(\(m\) => m\.parcial\)/);
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
  assert.ok(g.aclaraciones.includes('Las comidas de cada día se leyeron en tramos de 92 días.'));
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
  // Entre tomas de dos años, la más vieja lleva su año: «20/11» solo se leería como de este año (mutación: sacarlo).
  const deDosAnios = TOMAS.observacionesDeLasTomas([
    evolucion([metrica('pliegue-triceps', [toma('v1', 'ev0', '2025-11-20', 13, 'cmp-1', 'mm'), toma('v2', 'ev9', '2026-11-05', 10, 'cmp-1', 'mm')], [grupo('cmp-1', 'isak', 'mm')])]),
  ]);
  const dosAnios = P.perfilPorSitio(deDosAnios, P.tomasConSitios(deDosAnios), 'ev0', 'ev9');
  assert.match(dosAnios.descripcion, /^Perfil por sitio entre la toma del 20\/11\/2025 y la del 5\/11:/);
  assert.equal(P.filaEnPalabras({ ...dosAnios.grupos[0].filas[0], antes: null }, dosAnios.antes, dosAnios.despues).antes, 'sin dato en la toma del 20/11/2025');
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
  assert.equal(fila.celdas[0].texto, '14,2 kg (calculado) · Masa grasa (Durnin y Womersley), hombres', 'el punto adentro, dicho con palabras');
  assert.equal(fila.celdas[2].texto, 'se separan 2,2 kg');
  for (const nota of [COPY_ANTROPOMETRIA_EN_GRAFICOS.masas.porConstruccion, COPY_ANTROPOMETRIA_EN_GRAFICOS.sinErrorDeMedicion, COPY_ANTROPOMETRIA_EN_GRAFICOS.parcial]) {
    assert.ok(g.notas.includes(nota), nota);
  }
  assert.ok(g.aclaraciones.includes(COPY_ANTROPOMETRIA_EN_GRAFICOS.masas.leeAparte));
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
    semanas: [{ clave: 'm', desde: '2026-11-02', hasta: '2026-11-08', valor: 50, entera: false, texto: '50 g' }],
    cobertura: [],
  };
  const e = escala('2026-11-02', '2026-11-08');
  const g = L.geometriaDeValores(panel, e, 132);
  assert.equal(g.lineas.length, 2, 'dos tramos de lo registrado; lo indicado no se une');
  assert.ok(g.lineas.every((l) => l.serie === 'registrado' && l.puntos.length === 2));
  assert.ok(!g.marcas.some((m) => m.clave === 'fuera'), 'lo de fuera del período no se dibuja');
  assert.ok(g.extremos.abajo <= 90 && g.extremos.arriba >= 160, 'el eje abarca lo indicado de la unión y el objetivo');
  assert.equal(g.barras.length, 0, 'día por día no hay barras');
  const porSemana = L.geometriaDeValores(panel, e, 132, 'SEMANA');
  assert.equal(porSemana.extremos.abajo, 0, 'por semana, el eje arranca en cero, como las barras de la base');
  assert.ok(porSemana.extremos.arriba >= 160);
  assert.equal(porSemana.lineas.length, 0, 'por semana, los días van sueltos detrás');
  assert.equal(g.escalones[0].x1, e.x('2026-11-02') - e.porDia / 2, 'el objetivo se recorta al período');
  assert.equal(g.uniones[0].x, e.x('2026-11-02'));
  // La tira por comida: cada celda en su día, sin pisar la del día siguiente.
  const tira = L.geometriaDeTira({ tipo: 'TIRA', id: 't', nombre: 'Comidas', filas: [{ clave: 'c', nombre: 'Cena', celdas: [{ fecha: '2026-11-02', estado: 'SIN_REGISTRO' }] }] }, e);
  assert.ok(tira.filas[0].celdas[0].ancho < e.porDia);
  assert.deepEqual(L.huecosEnTexto([{ from: '2026-10-30', to: '2026-11-03' }], '2026-11-02', '2026-11-08'), ['del 2/11 al 3/11, sin registros']);
  // Las marcas del eje vertical son las redondas de la base (de 3 a 5, sin un número repetido); GR-18 usa las mismas.
  assert.deepEqual(
    g.marcasY.map((m) => m.valor),
    g.extremos.valores,
  );
  assert.ok(g.marcasY.length >= 3 && g.marcasY.length <= 5);
  assert.equal(new Set(g.marcasY.map((m) => m.valor)).size, g.marcasY.length);
  assert.match(readFileSync(join(GRAFICOS, 'antropometria/perfil-por-sitio-en-pantalla.tsx'), 'utf8'), /g\.extremos\.valores\.map\(/, 'GR-18 escribe su eje con las marcas redondas de la base');
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

test('TEST-GRF-054 · las pantallas que ya existían: «Registros» suma «Día por día» arriba de la lista (y al releer en silencio no salta) y «Evolución» suma «Por sitio» y «Por método», con su código cargado al dibujarse (mutación: volver a «cargando» al releer las comidas)', () => {
  const registros = readFileSync(join(WEB, 'src/app/pro/advisees/nutrition/registros.tsx'), 'utf8');
  assert.match(registros, /dynamic\(\(\) => import\('\.\.\/graficos\/nutricion\/dia-por-dia-en-registros'\)/);
  assert.ok(registros.indexOf('<DiaPorDia ') < registros.indexOf('<Contraste '), '«Día por día» va arriba de la lista');
  // «Registros» relee en silencio después de guardar una estimación, para que la lista no salte: el gráfico de arriba
  // tampoco vuelve a «cargando» (su alto cambiaría y movería la lista).
  const vez = ['t', 'a', '2026-11-01', '2026-11-30', 0];
  assert.equal(LEIDO.esLaMismaLectura(null, vez), false, 'la primera lectura carga');
  assert.equal(LEIDO.esLaMismaLectura(vez, [...vez]), true, 'lo mismo, releído: sigue a la vista');
  assert.equal(LEIDO.esLaMismaLectura(vez, ['t', 'a', '2026-10-01', '2026-11-30', 0]), false, 'otro período carga');
  assert.equal(LEIDO.esLaMismaLectura(vez, ['t', 'a', '2026-11-01', '2026-11-30', 1]), false, '«Reintentar» carga');
  const leido = readFileSync(join(GRAFICOS, 'nutricion-y-cuerpo/grafico-leido.tsx'), 'utf8');
  assert.match(leido, /if \(!esLaMismaLectura\(leidoCon\.current, identidad\)\) setEstado\(\{ tipo: 'CARGANDO' \}\);/);
  assert.match(leido, /\}, \[\.\.\.deps, \.\.\.refrescos, vuelta\]\);/);
  assert.match(
    readFileSync(join(GRAFICOS, 'nutricion/indicado-y-registrado-por-dia-en-pantalla.tsx'), 'utf8'),
    /\[lectura\.token, lectura\.asesoradoId, desde, hasta, hoy\],\s*\[contraste\],/,
    'las comidas releídas son un refresco, no otra lectura',
  );
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

test('TEST-GRF-057 · el registro de la rama y los sugeridos del dominio dicen lo mismo: cada gráfico con su código, su área, su lugar, sus series y sus alcances (mutación: sacar la tarjeta de los g/kg de GRAFICOS_SUGERIDOS o dejarle un solo alcance)', () => {
  const todos = [...GRAFICOS_DE_NUTRICION, ...GRAFICOS_DE_ANTROPOMETRIA];
  const contexto = (alcances) => ({ acceso: { alcances, propios: { NUTRICION: true, ENTRENAMIENTO: true, ANTROPOMETRIA: true } }, ejercicios: null, medidas: null });
  for (const g of todos) {
    const s = graficoSugerido(g.id);
    assert.ok(s, `${g.id} no está en GRAFICOS_SUGERIDOS: un enfoque que lo guarde no lo encontraría en el dominio`);
    assert.deepEqual([s.codigo, s.area, s.ubicacion, [...s.series]], [g.codigo, g.area, g.ubicacion, [...g.series]], g.id);
    assert.deepEqual(s.requiere, g.requiere, g.id);
    // Con los alcances que declara el dominio (y lo propio en cada uno) se ofrece; sin uno de ellos, no.
    assert.equal(g.ofrecido(contexto([...s.alcances])), true, `${g.id} con ${s.alcances.join(' y ')}`);
    for (const a of s.alcances) assert.equal(g.ofrecido(contexto(s.alcances.filter((x) => x !== a))), false, `${g.id} sin ${a}`);
  }
  assert.deepEqual(graficoSugerido('nutricion.macros-por-kilo')?.alcances, ['NUTRICION', 'ANTROPOMETRIA']);
  // Y al revés: los sugeridos de Nutrición y Antropometría de la fase 2 tienen todos su gráfico en el registro de la rama.
  const ids = new Set(todos.map((g) => g.id));
  for (const s of GRAFICOS_SUGERIDOS.filter((x) => x.fase === 2 && (x.area === 'NUTRICION' || x.area === 'ANTROPOMETRIA'))) assert.ok(ids.has(s.id), `${s.id} no está en el registro de la rama`);
});

test('TEST-GRF-058 · lo cargado después: si la lectura quedó a medias, se sabe desde el día más viejo leído, lo anterior no se marca y la nota lo dice; entera, sin nota (mutación: tomar una lectura a medias como entera)', () => {
  const entrada = (fecha, tarde = true) => ({ occurredDate: fecha, recordedLate: tarde });
  const entera = D.loCargadoDespues([entrada('2026-11-06'), entrada('2026-11-03')], true, '2026-11-02');
  assert.deepEqual([...entera.dias].sort(), ['2026-11-03', '2026-11-06']);
  assert.equal(entera.sabidoDesde, null);
  // La línea de tiempo viene de la más reciente a la más vieja: si no se leyó entera, antes del día más viejo no se sabe.
  const aMedias = D.loCargadoDespues([entrada('2026-11-08'), entrada('2026-11-06'), entrada('2026-11-05', false)], false, '2026-11-02');
  assert.equal(aMedias.sabidoDesde, '2026-11-05');
  assert.deepEqual([...aMedias.dias].sort(), ['2026-11-06', '2026-11-08']);
  assert.equal(D.loCargadoDespues([entrada('2026-11-02')], false, '2026-11-02').sabidoDesde, null, 'si lo leído llega al primer día, se sabe de todo el período');
  // GR-12 y GR-13 lo dicen en una nota, y marcan solo lo que se leyó.
  const puntos = [dia('2026-11-02', 2000), dia('2026-11-06', 2100)];
  const energia = (lo) => G12.graficoDeEnergia({ resultado: resultado('ENERGY', puntos), cargadoTarde: lo.dias, cargadoTardeSabidoDesde: lo.sabidoDesde, desde: '2026-11-02', hasta: '2026-11-08', hoy: '2026-11-09' });
  const g = energia(aMedias);
  assert.ok(g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.cargadoDespuesDesde('5/11')));
  assert.deepEqual(
    g.paneles[0].marcas.map((m) => [m.fecha, m.tarde]),
    [
      ['2026-11-02', false],
      ['2026-11-06', true],
    ],
  );
  assert.ok(!energia(entera).notas.some((n) => n.startsWith('Lo cargado después se leyó desde')), 'leída entera, no hay nota');
  const macros = G13.graficoDeMacros({ resultados: G13.MACROS_DEL_GRAFICO.map((m) => resultado(m.metrica, puntos)), macros: G13.MACROS_DEL_GRAFICO, cargadoTarde: aMedias.dias, cargadoTardeSabidoDesde: aMedias.sabidoDesde, desde: '2026-11-02', hasta: '2026-11-08' });
  assert.ok(macros.notas.includes(COPY_NUTRICION_EN_GRAFICOS.cargadoDespuesDesde('5/11')));
  sinPalabrasProhibidas([...g.notas, ...macros.notas], ['NUTRICION']);
  // La lectura lo usa: lo que no se leyó no se marca como cargado a tiempo.
  assert.match(readFileSync(join(GRAFICOS, 'nutricion/lecturas-de-nutricion.ts'), 'utf8'), /loCargadoDespues\(r\.datos\.data, r\.datos\.completa, desde\)/);
});

test('TEST-GRF-059 · la tabla dice con palabras lo que dice la forma: la masa calculada lo dice, un día sin peso anterior lo dice una sola vez y sin marca, y el motivo de los g/kg se lee en «Analizar» (mutación: sacar «(calculado)» de la celda de una masa)', () => {
  const datos = evolucion([metrica('masa-grasa-durnin-womersley', [toma('d1', 'ev1', '2026-09-10', 14.2, 'g1', 'kg', { dataClass: 'DERIVED' })], [grupo('g1', 'isak', 'kg', '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f29')])]);
  const masas = M.graficoDeMasas(TOMAS.observacionesDeLasTomas([datos]), '2026-09-01', '2026-11-14', { parcial: false, enTramos: false });
  assert.equal(masas.paneles[0].marcas[0].marca, 'PUNTO_ADENTRO');
  const celda = masas.tabla.filas[0].celdas[0];
  assert.equal(celda.marca, 'PUNTO_ADENTRO');
  assert.match(celda.texto, /^14,2 kg \(calculado\) · /, 'el punto adentro no llega al lector de pantalla: la celda lo dice');
  // Los g/kg de un día sin una toma anterior: sin valor, dicho una vez, y sin marca.
  const pesos = [{ clave: 'm:a', fecha: '2026-11-03', en: '2026-11-03T13:00:00.000Z', valor: 80 }];
  const resultados = G13.MACROS_POR_KILO.map((m) => resultado(m.metrica, [dia('2026-11-02', 160), dia('2026-11-03', 160)]));
  const porKilo = G13.graficoDeMacrosPorKilo({ resultados, macros: G13.MACROS_POR_KILO, cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-08', pesos, pesoBuscadoDesde: null });
  const sinPeso = porKilo.tabla.filas.find((f) => f.fecha === '2026-11-02').celdas[0];
  assert.equal(sinPeso.texto, 'sin valor: sin una toma de peso anterior');
  assert.equal(sinPeso.marca, null, 'no se dibuja');
  assert.equal(porKilo.tabla.filas.find((f) => f.fecha === '2026-11-03').celdas[0].texto, '2 g/kg · con cantidades en todos sus registros y sin comidas del plan sin registro · peso del 3/11: 80 kg');
  // «Analizar» y su exportación escriben con sus palabras los motivos que no conocen: el de los g/kg se lee entero.
  assert.equal(K.SIN_TOMA_ANTERIOR, 'SIN_TOMA_DE_PESO_ANTERIOR');
  assert.equal(textoDeFaltante(K.SIN_TOMA_ANTERIOR), 'sin toma de peso anterior');
  sinPalabrasProhibidas([celda.texto], ['ANTROPOMETRIA']);
  sinPalabrasProhibidas(
    porKilo.tabla.filas.flatMap((f) => f.celdas.map((c) => c?.texto ?? '')).filter((t) => t !== ''),
    ['NUTRICION', 'ANTROPOMETRIA'],
  );
});

// ─── La pasada visual de la rama C (15/11; DISENO-VISUAL §1 y §2 «C»; WP-GRAFICOS §13.4): TEST-GRVC-001 a 008 ───────

const PS = await import('../src/app/pro/advisees/graficos/nutricion/por-semana.ts');
const SEMANAS = await import('../src/app/pro/advisees/graficos/semanas.ts');

/** Siete días seguidos desde un lunes, con un valor cada uno (o lo que diga `cambio`). */
const semanaDe = (lunes, valor, cambio = {}) =>
  Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(Date.parse(`${lunes}T12:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10);
    return cambio[fecha] === undefined ? dia(fecha, valor) : cambio[fecha];
  }).filter((p) => p !== null);

test('TEST-GRVC-001 · Nutrición por semana: la media de la semana (v1) como barra, llena solo con los siete días, una semana sin media es una columna gris y nunca una barra en cero, hoy no cuenta y GR-12, GR-13 y GR-14 dicen la misma media (mutaciones: dibujar la semana sin media en cero; llenar la barra con 6 de 7)', () => {
  // Tres semanas: la primera entera, la segunda con un subtotal (6 de 7), la tercera con 2 días (sin media) y hoy adentro.
  const puntos = [
    ...semanaDe('2026-10-19', 2000),
    ...semanaDe('2026-10-26', 2100, { '2026-10-28': subtotal('2026-10-28', 900, 'SIN_CANTIDADES') }),
    dia('2026-11-02', 1800),
    dia('2026-11-03', 1900),
  ];
  const g = G12.graficoDeEnergia({ resultado: resultado('ENERGY', puntos), cargadoTarde: new Set(), desde: '2026-10-19', hasta: '2026-11-05', hoy: '2026-11-05' });
  const [entera, conUnoAfuera, corta] = g.paneles[0].semanas;
  assert.deepEqual([entera.valor, entera.entera], [2000, true], 'siete días, todos con todo registrado: llena');
  assert.deepEqual([conUnoAfuera.valor, conUnoAfuera.entera], [2100, false], 'con un subtotal afuera, hueca (mutación: llenarla con 6 de 7)');
  assert.match(conUnoAfuera.texto, /con 6 de 7 días; 1 con cantidades faltantes/);
  assert.equal(corta.valor, null, 'dos días no alcanzan: sin media');
  assert.match(corta.texto, /^sin media: hacen falta 4 días/);
  assert.match(corta.texto, /hoy no cuenta/);
  // En el dibujo: dos barras desde cero y una columna gris de todo el alto, nunca una barra en cero.
  const e = escala('2026-10-19', '2026-11-05');
  const geo = L.geometriaDeValores(g.paneles[0], e, 240, 'SEMANA');
  assert.equal(geo.barras.length, 2);
  assert.equal(geo.vacias.length, 1, 'la semana sin media es una columna');
  assert.ok(!geo.barras.some((b) => b.valor === 0), 'ninguna barra en cero (mutación: dibujarla en cero)');
  assert.equal(geo.extremos.abajo, 0);
  assert.ok(geo.barras.every((b) => b.base > b.y && b.x2 > b.x1));
  // Dos semanas seguidas no se pegan: hay aire entre una barra y la siguiente.
  assert.ok(geo.barras[0].x2 < geo.barras[1].x1);
  // La tira de cada día: con todo, con algo que falta, sin registros y hoy aparte.
  const tira = new Map(g.paneles[0].cobertura.map((d) => [d.fecha, d.estado]));
  assert.equal(tira.get('2026-10-19'), 'con');
  assert.equal(tira.get('2026-10-28'), 'hueco');
  assert.equal(tira.get('2026-11-04'), 'sin');
  assert.equal(tira.get('2026-11-05'), 'hoy');
  // La lectura de cada semana dice su media con sus días; de entrada, la última con media.
  assert.equal(g.porSemana.tramos.length, 3);
  assert.equal(L.tramoDeEntrada(g.porSemana.tramos).desde, '2026-10-26');
  assert.equal(PS.nombreDelTramo(g.porSemana.tramos[0]), 'Semana del 19 oct');
  assert.equal(PS.nombreDelTramo(g.porSemana.tramos[2]), 'Del 2 al 5 nov', 'la semana cortada por el período dice sus días');
  // La leyenda de «Por semana», solo con lo que se ve: llena, hueca, sin media y los días.
  assert.deepEqual(
    g.porSemana.leyenda.map((x) => x.clave),
    ['semana-entera', 'semana-hueca', 'sin-media', 'cada-dia'],
  );
  const soloEnteras = G12.graficoDeEnergia({ resultado: resultado('ENERGY', semanaDe('2026-10-19', 2000)), cargadoTarde: new Set(), desde: '2026-10-19', hasta: '2026-10-25', hoy: '2026-11-05' });
  assert.deepEqual(
    soloEnteras.porSemana.leyenda.map((x) => x.clave),
    ['semana-entera', 'cada-dia'],
    'sin semanas huecas ni sin media, esas fichas no van',
  );
  // GR-13 y GR-14 usan la misma media de la semana que GR-12: el mismo número para la misma semana.
  const macros = G13.graficoDeMacros({ resultados: G13.MACROS_DEL_GRAFICO.map((m) => resultado(m.metrica, puntos)), macros: G13.MACROS_DEL_GRAFICO, cargadoTarde: new Set(), desde: '2026-10-19', hasta: '2026-11-05', hoy: '2026-11-05' });
  assert.deepEqual(
    macros.paneles[0].semanas.map((s) => s.valor),
    g.paneles[0].semanas.map((s) => s.valor),
  );
  const comparacion = G14.graficoDeLaComparacion({ resultados: G14.METRICAS_DE_LA_COMPARACION.map((m) => resultado(m.metrica, puntos)), contraste: null, desde: '2026-10-19', hasta: '2026-11-05', hoy: '2026-11-05', enTramos: false });
  assert.deepEqual(
    comparacion.paneles[0].semanas.map((s) => s.valor),
    g.paneles[0].semanas.map((s) => s.valor),
  );
  // De entrada por semana solo con más de seis semanas (la regla de la base); con menos, día por día.
  assert.equal(SEMANAS.convienePorSemana('2026-08-01', '2026-11-05'), true);
  assert.equal(SEMANAS.convienePorSemana('2026-10-07', '2026-11-05'), false);
  sinPalabrasProhibidas([...textosDe(g), ...textosDe(macros), ...textosDe(comparacion)], ['NUTRICION']);
});

test('TEST-GRVC-002 · GR-14 por semana: lo indicado de los días de la semana sin promediarlo y sin diferencia (va solo día por día); sin indicado del día, una sola línea a la vista y el párrafo en «Cómo leerlo»; los g/kg van solo día por día (mutaciones: restar dos medias; llevar el párrafo entero a la vista)', () => {
  const indicado = (fecha, valor) => ({ date: fecha, state: 'DETERMINED', value: valor, planVersionId: 'v1', dayTypeId: 'dt', dayType: 'Día habitual' });
  const conOpciones = (fecha) => ({ date: fecha, state: 'UNDETERMINED', reason: 'SEVERAL_OPTIONS', planVersionId: 'v1', mealsWithSeveralOptions: [{ meal: 'Almuerzo', options: 2 }] });
  const puntos = semanaDe('2026-11-02', 2000);
  const dias = [indicado('2026-11-02', 2100), indicado('2026-11-03', 2200), indicado('2026-11-04', 2100)];
  const resultados = G14.METRICAS_DE_LA_COMPARACION.map((m, i) => resultado(m.metrica, i === 0 ? puntos : [], i === 0 ? { dias } : {}));
  const g = G14.graficoDeLaComparacion({ resultados, contraste: null, desde: '2026-11-02', hasta: '2026-11-08', hoy: '2026-11-10', enTramos: false });
  const [energia] = g.porSemana.tramos[0].textos;
  assert.match(energia, /^2\.000 kcal por día de media · con 7 de 7 días · indicado del día de 2\.100 kcal a 2\.200 kcal en 3 días$/);
  assert.doesNotMatch(energia, /diferencia|[+−]\d/, 'por semana no hay diferencia: restar dos medias de días distintos no es una diferencia');
  assert.ok(g.porSemana.aclaraciones.includes(COPY_NUTRICION_EN_GRAFICOS.indicadoYRegistrado.laDiferenciaVaDiaPorDia));
  assert.ok(g.porSemana.leyenda.some((x) => x.clave === 'indicado'), 'los rombos tenues de lo indicado están en la leyenda de la semana');
  // Por semana no hay uniones ni líneas: los días van sueltos detrás de la barra.
  const geo = L.geometriaDeValores(g.paneles[0], escala('2026-11-02', '2026-11-08'), 140, 'SEMANA');
  assert.equal(geo.uniones.length, 0);
  assert.equal(geo.lineas.length, 0);
  // Sin indicado del día en todo el período: una sola línea, corta, a la vista; el párrafo del dominio, en «Cómo leerlo».
  const sinIndicado = G14.graficoDeLaComparacion({
    resultados: G14.METRICAS_DE_LA_COMPARACION.map((m, i) => resultado(m.metrica, i === 0 ? puntos : [], i === 0 ? { dias: [conOpciones('2026-11-02'), conOpciones('2026-11-03')] } : {})),
    contraste: null,
    desde: '2026-11-02',
    hasta: '2026-11-08',
    hoy: '2026-11-10',
    enTramos: false,
  });
  const linea = sinIndicado.notas.find((n) => n.startsWith('Sin indicado del día'));
  assert.equal(linea, 'Sin indicado del día en estas fechas: comidas con varias opciones.');
  assert.ok(!sinIndicado.notas.some((n) => n.includes('«Ver origen»')), 'el párrafo entero no va a la vista');
  assert.ok(sinIndicado.aclaraciones.some((n) => n.includes('«Ver origen»')), 'va en «Cómo leerlo»');
  assert.ok(!sinIndicado.aclaraciones.includes(COPY_NUTRICION_EN_GRAFICOS.indicadoYRegistrado.comoSeLeeLaDiferencia), 'sin indicado, no se explica una diferencia que no hay');
  // Los g/kg van solo día por día: una media de la semana mezclaría dos pesos sin decirlo.
  const pesos = [{ clave: 'm:a', fecha: '2026-11-01', en: null, valor: 80 }];
  const porKilo = G13.graficoDeMacrosPorKilo({ resultados: G13.MACROS_POR_KILO.map((m) => resultado(m.metrica, puntos)), macros: G13.MACROS_POR_KILO, cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-08', pesos, pesoBuscadoDesde: null });
  assert.equal(porKilo.porSemana, null);
  assert.ok(porKilo.paneles.every((p) => p.tipo === 'VALORES' && p.semanas.length === 0));
  assert.ok(porKilo.aclaraciones.includes(COPY_NUTRICION_EN_GRAFICOS.porKilo.soloDiaPorDia));
  sinPalabrasProhibidas([...textosDe(g), ...textosDe(sinIndicado)], ['NUTRICION']);
  sinPalabrasProhibidas(textosDe(porKilo), ['NUTRICION', 'ANTROPOMETRIA']);
});

test('TEST-GRVC-003 · sin rótulo en cada punto: el elegido, el último y los extremos de lo lleno, sin pisarse; con dos métodos, el elegido y el último de cada uno; la diferencia de GR-14 solo en la fecha elegida y la última; por semana, la media de la semana elegida (mutación: rotular todos los puntos)', () => {
  const e = escala('2026-11-02', '2026-11-29');
  const marca = (clave, fecha, valor, extra = {}) => ({ clave, serie: 'registrado', fecha, en: null, valor, marca: 'LLENA', forma: 'CIRCULO', color: 0, tarde: false, tramo: 't', ...extra });
  const fechas = Array.from({ length: 20 }, (_, i) => new Date(Date.parse('2026-11-02T12:00:00Z') + i * 86_400_000).toISOString().slice(0, 10));
  const panel = {
    tipo: 'VALORES',
    id: 'p',
    nombre: 'Prueba',
    unidad: 'kcal',
    metodo: null,
    escala: { enteros: true, desdeCero: true },
    marcas: fechas.map((f, i) => (i === 3 ? marca(`m${i}`, f, 500, { marca: 'HUECA' }) : marca(`m${i}`, f, 2000 + (i % 5) * 100))),
    uniones: [],
    escalones: [],
    semanas: [],
    cobertura: [],
  };
  const geo = L.geometriaDeValores(panel, e, 240);
  const sinElegir = L.rotulosDelPanel(geo, e, 240, null, 'DIA', 16);
  assert.ok(sinElegir.length >= 1 && sinElegir.length <= 3, `pocos rótulos, no uno por punto: ${sinElegir.length} (mutación: rotularlos todos)`);
  assert.ok(sinElegir.some((r) => r.clave === 'm19'), 'el último lleva su número');
  assert.ok(!sinElegir.some((r) => r.clave === 'm3'), 'un subtotal no se rotula como el mínimo del período');
  const conElegido = L.rotulosDelPanel(geo, e, 240, fechas[7], 'DIA', 16);
  assert.equal(conElegido[0].clave, 'm7', 'el elegido va primero');
  for (const lista of [sinElegir, conElegido])
    for (let i = 0; i < lista.length; i++)
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i].caja;
        const b = lista[j].caja;
        assert.ok(a.x2 <= b.x1 || b.x2 <= a.x1 || a.y2 <= b.y1 || b.y2 <= a.y1, 'dos rótulos no se pisan');
      }
  // Dos métodos en el mismo panel (GR-20): el elegido y el último de cada uno, sin el máximo de los dos juntos.
  const dosMetodos = {
    ...panel,
    marcas: [
      marca('d1', '2026-11-03', 14, { serie: 'dw', tramo: null }),
      marca('d2', '2026-11-20', 13.5, { serie: 'dw', tramo: null }),
      marca('f1', '2026-11-03', 12, { serie: 'fk', forma: 'CUADRADO', color: 1, tramo: null }),
      marca('f2', '2026-11-20', 11.8, { serie: 'fk', forma: 'CUADRADO', color: 1, tramo: null }),
    ],
  };
  const geo2 = L.geometriaDeValores(dosMetodos, e, 140);
  const r2 = L.rotulosDelPanel(geo2, e, 140, null, 'DIA', 16).map((r) => r.clave);
  assert.ok(r2.includes('d2') && r2.includes('f2'), 'el último de cada método');
  assert.ok(!r2.includes('d1') && !r2.includes('f1'), 'sin elegir, nada más');
  // La diferencia de GR-14: solo en la fecha elegida y en la última, no en cada día.
  const conUniones = {
    ...panel,
    marcas: fechas.slice(0, 6).map((f, i) => marca(`r${i}`, f, 2000 + i * 10)),
    uniones: fechas.slice(0, 6).map((f, i) => ({ clave: `u${i}`, fecha: f, en: null, desde: 1900, hasta: 2000 + i * 10, rotulo: `+${100 + i * 10} kcal`, forma: 'DIFERENCIA' })),
  };
  const geo3 = L.geometriaDeValores(conUniones, e, 240);
  const diferencias = L.rotulosDelPanel(geo3, e, 240, fechas[2], 'DIA', 16).filter((r) => r.clave.startsWith('u:'));
  assert.ok(diferencias.length >= 1 && diferencias.length <= 2, 'una o dos diferencias, no una por día');
  for (const d of diferencias) assert.ok(['+120 kcal', '+150 kcal'].includes(d.texto), `la del día elegido y la del último: ${d.texto}`);
  // Por semana: la media de la semana elegida (o, sin elegir, la de la última con media), arriba de su barra.
  const g = G12.graficoDeEnergia({ resultado: resultado('ENERGY', [...semanaDe('2026-11-02', 2000), ...semanaDe('2026-11-09', 2100)]), cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-15', hoy: '2026-11-20' });
  const e2 = escala('2026-11-02', '2026-11-15');
  const geoS = L.geometriaDeValores(g.paneles[0], e2, 240, 'SEMANA');
  assert.deepEqual(
    L.rotulosDelPanel(geoS, e2, 240, null, 'SEMANA', 16).map((r) => r.texto),
    ['2.100'],
  );
  assert.deepEqual(
    L.rotulosDelPanel(geoS, e2, 240, '2026-11-04', 'SEMANA', 16).map((r) => r.texto),
    ['2.000'],
  );
});

test('TEST-GRVC-004 · lo que §5 pide a la vista no se esconde en «Cómo leerlo»: el método en la línea tenue, lo cargado después, lo de otro profesional, una proporción que no se dibuja y los pesos de los g/kg; lo que aclara va a «Cómo leerlo» (mutación: llevar lo cargado después o los pesos usados a «Cómo leerlo»)', () => {
  const objetivo = [{ objectiveVersionId: 'o2', from: '2026-11-01', to: null, amount: null, energyShare: 30 }];
  const puntos = [dia('2026-11-02', 2000), dia('2026-11-03', 2100), dia('2026-11-04', 1900)];
  const g = G12.graficoDeEnergia({ resultado: resultado('ENERGY', puntos, { objetivo }), cargadoTarde: new Set(['2026-11-03']), desde: '2026-11-02', hasta: '2026-11-08', hoy: '2026-11-09', parcial: true });
  assert.equal(g.metodo, COPY_NUTRICION_EN_GRAFICOS.metodoDeLaSuma, 'el método va a la línea tenue (§5.6)');
  assert.ok(g.notas.includes('1 de 3 días con registros cargados después.'), 'lo cargado después, a la vista (§5.14)');
  assert.ok(g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.deOtroProfesional));
  assert.ok(g.notas.some((n) => n.includes('(proporción): BE no la convierte a gramos ni la dibuja')), 'lo que no se dibuja se dice a la vista');
  for (const n of g.notas) assert.ok(!g.aclaraciones.includes(n), `una nota no va dos veces: ${n}`);
  assert.ok(g.aclaraciones.some((n) => n.startsWith(COPY_NUTRICION_EN_GRAFICOS.metodoDeLaSuma)), 'el método entero, en «Cómo leerlo»');
  assert.ok(g.aclaraciones.includes(COPY_NUTRICION_EN_GRAFICOS.diaSinRegistros));
  assert.ok(!g.notas.includes(COPY_NUTRICION_EN_GRAFICOS.diaSinRegistros), 'el dibujo ya lo muestra: la explicación va a «Cómo leerlo»');
  // Los g/kg: los pesos usados y los días sin peso, a la vista; la regla del peso, en «Cómo leerlo».
  const pesos = [{ clave: 'm:a', fecha: '2026-11-03', en: null, valor: 80 }];
  const porKilo = G13.graficoDeMacrosPorKilo({ resultados: G13.MACROS_POR_KILO.map((m) => resultado(m.metrica, puntos)), macros: G13.MACROS_POR_KILO, cargadoTarde: new Set(), desde: '2026-11-02', hasta: '2026-11-08', pesos, pesoBuscadoDesde: '2025-11-02' });
  assert.equal(porKilo.metodo, COPY_NUTRICION_EN_GRAFICOS.porKilo.metodo);
  assert.ok(porKilo.notas.includes('Pesos usados: 80 kg (toma del 3/11).'), 'los pesos usados, a la vista');
  assert.ok(porKilo.notas.includes(COPY_NUTRICION_EN_GRAFICOS.porKilo.diasSinPeso(1)));
  assert.ok(porKilo.notas.includes('El peso anterior se buscó desde el 2/11/2025.'), 'con días sin peso, desde cuándo se buscó va a la vista');
  assert.ok(porKilo.aclaraciones.some((n) => n.includes(COPY_NUTRICION_EN_GRAFICOS.porKilo.reglaDelPeso)));
  // La leyenda: una ficha corta a la vista y el texto entero, con la forma, para el lector de pantalla.
  for (const x of [g, porKilo]) for (const f of x.leyenda) assert.ok(f.texto.length <= 30 && f.largo.length > f.texto.length, `${f.texto} / ${f.largo}`);
  sinPalabrasProhibidas([...textosDe(g)], ['NUTRICION']);
});

test('TEST-GRVC-005 · GR-20: con menos de 4 tomas va como tabla a la vista; nunca nombra un método que no aparece; «por construcción» solo con los dos métodos, y el error de medición siempre a la vista (mutaciones: nombrar a Faulkner sin datos; dibujar dos puntitos)', () => {
  const dw = '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f29';
  const fk = '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f1c';
  const calculada = { dataClass: 'DERIVED' };
  const tomasDe = (fechas, metodos) =>
    TOMAS.observacionesDeLasTomas([
      evolucion(metodos.map((m) => metrica(m.codigo, fechas.map((f, i) => toma(`${m.codigo}${i}`, `ev${i}`, f, m.valor + i * 0.1, m.grupo, 'kg', calculada)), [grupo(m.grupo, 'isak', 'kg', m.metodo)]))),
    ]);
  const soloDW = [
    { codigo: 'masa-grasa-durnin-womersley', valor: 15, grupo: 'g1', metodo: dw },
    { codigo: 'masa-libre-de-grasa-durnin-womersley', valor: 64, grupo: 'g2', metodo: dw },
  ];
  const dos = M.graficoDeMasas(tomasDe(['2026-09-30', '2026-11-12'], soloDW), '2026-08-18', '2026-11-15', { parcial: false, enTramos: false });
  assert.equal(dos.comoTabla, true, 'con dos tomas, tabla (mutación: dibujar dos puntitos)');
  assert.ok(dos.aclaraciones.some((n) => n.startsWith('Con 2 tomas va como tabla')));
  const todos = [...textosDe(dos), ...dos.tabla.columnas.map((c) => c.nombre)];
  assert.ok(!todos.some((t) => /Faulkner/.test(t)), `Faulkner no aparece y no se nombra: ${todos.filter((t) => /Faulkner/.test(t)).join(' | ')}`);
  assert.ok(!dos.notas.includes(COPY_ANTROPOMETRIA_EN_GRAFICOS.masas.porConstruccion), 'sin los dos métodos, no hay «por construcción»');
  assert.ok(dos.notas.includes(COPY_ANTROPOMETRIA_EN_GRAFICOS.sinErrorDeMedicion), 'el error de medición, a la vista (§5.7)');
  assert.deepEqual(
    dos.leyenda.map((f) => f.texto),
    ['Durnin y Womersley'],
    'una ficha por método, aunque esté en dos paneles',
  );
  assert.deepEqual(
    dos.tabla.columnas.map((c) => c.nombre),
    ['Masa grasa según Durnin y Womersley', 'Masa libre de grasa según Durnin y Womersley'],
    'sin la columna de un método ausente ni la de la separación',
  );
  // Con 4 tomas y los dos métodos, va como gráfico, con «por construcción» a la vista y la separación.
  const ambos = [soloDW[0], { codigo: 'masa-grasa-faulkner', valor: 12, grupo: 'g3', metodo: fk }];
  const cuatro = M.graficoDeMasas(tomasDe(['2026-08-20', '2026-09-20', '2026-10-20', '2026-11-12'], ambos), '2026-08-18', '2026-11-15', { parcial: false, enTramos: false });
  assert.equal(cuatro.comoTabla, false);
  assert.ok(cuatro.notas.includes(COPY_ANTROPOMETRIA_EN_GRAFICOS.masas.porConstruccion));
  assert.ok(cuatro.tabla.columnas.some((c) => c.id === 'masa-grasa:separacion'));
  assert.equal(cuatro.metodo, COPY_ANTROPOMETRIA_EN_GRAFICOS.masas.metodo, 'cada número con su método: en la línea tenue');
  sinPalabrasProhibidas([...textosDe(dos), ...textosDe(cuatro)], ['ANTROPOMETRIA']);
});

test('TEST-GRVC-006 · GR-18: el nombre de cada sitio entero (en dos renglones si no entra, nunca con «…»), la línea tenue con qué se compara, el error de medición a la vista y la reducción localizada en «Cómo leerlo» (mutación: cortar el nombre con «…»)', () => {
  assert.deepEqual(P.nombreEnRenglones('Pliegue tricipital', 30), ['Pliegue tricipital']);
  const largo = 'Perímetro del brazo flexionado y contraído';
  const partido = P.nombreEnRenglones(largo, 24);
  assert.equal(partido.length, 2);
  assert.equal(partido.join(' '), largo, 'entero, sin «…»');
  const datos = evolucion([
    metrica('perimetro-cintura', [toma('b1', 'ev1', '2026-10-02', 80, 'c1', 'cm'), toma('b2', 'ev2', '2026-11-12', 79.2, 'c1', 'cm')], [grupo('c1', 'isak', 'cm')]),
    metrica('pliegue-triceps', [toma('t1', 'ev1', '2026-10-02', 12, 'c2', 'mm'), toma('t2', 'ev2', '2026-11-12', 12.2, 'c2', 'mm')], [grupo('c2', 'isak', 'mm')]),
  ]);
  const obs = TOMAS.observacionesDeLasTomas([datos]);
  const tomas = P.tomasConSitios(obs);
  const perfil = P.perfilPorSitio(obs, tomas, 'ev1', 'ev2');
  assert.equal(P.detalleDelPerfil(perfil), 'pliegues en mm y perímetros en cm · entre la toma del 2/10 y la del 12/11');
  const fila = perfil.grupos[1].filas[0];
  const angosto = P.filasDelGrupo({ filas: [{ ...fila, nombre: largo }] }, 300);
  assert.ok(angosto.filas[0].renglones.length === 2 && angosto.alto > 26, 'en poco ancho, dos renglones y la fila más alta');
  assert.ok(!angosto.filas[0].renglones.some((r) => r.includes('…')));
  const ancho = P.filasDelGrupo({ filas: [{ ...fila, nombre: largo }] }, 1400);
  assert.equal(ancho.filas[0].renglones.length, 1, 'con lugar, un renglón');
  const textos = P.notasDelPerfil(perfil, { parcial: true, enTramos: true });
  assert.ok(textos.notas.includes(COPY_ANTROPOMETRIA_EN_GRAFICOS.sinErrorDeMedicion), '§5.7: a la vista');
  assert.ok(textos.notas.includes(COPY_ANTROPOMETRIA_EN_GRAFICOS.parcial));
  assert.ok(textos.aclaraciones.includes(COPY_ANTROPOMETRIA_EN_GRAFICOS.perfil.sinReduccionLocalizada), 'la explicación fisiológica, con su fuente, en «Cómo leerlo» (§5.1)');
  assert.ok(textos.aclaraciones.includes(COPY_ANTROPOMETRIA_EN_GRAFICOS.leidoEnTramos));
  // El eje de cada familia: de 3 a 5 marcas redondas, sin repetir.
  for (const g of perfil.grupos) {
    assert.ok(g.extremos.valores.length >= 3 && g.extremos.valores.length <= 5, g.extremos.valores.join(', '));
    assert.equal(new Set(g.extremos.valores).size, g.extremos.valores.length);
  }
  const pantalla = readFileSync(join(GRAFICOS, 'antropometria/perfil-por-sitio-en-pantalla.tsx'), 'utf8');
  assert.doesNotMatch(pantalla.replace(/\/\*[\s\S]*?\*\//g, ''), /…/, 'GR-18 no corta un nombre (fuera de los comentarios)');
  assert.match(pantalla, /<ComoLeerlo de=\{C\.perfil\.titulo\}>/);
  sinPalabrasProhibidas([P.detalleDelPerfil(perfil), ...textos.notas, ...textos.aclaraciones, ...P.nombreEnRenglones(largo, 24)], ['ANTROPOMETRIA']);
});

test('TEST-GRVC-007 · en pantalla: «Por semana | Día por día» con aria-pressed y por semana de entrada con más de seis semanas, la lectura de la semana es una región viva, su tabla tiene caption y encabezados con alcance, la leyenda tiene su texto entero para el lector, «Cómo leerlo» lleva el nombre de su gráfico y la hoja usa solo tokens (mutación: decidir el modo sin la regla de la base)', () => {
  const lienzo = readFileSync(join(GRAFICOS, 'nutricion-y-cuerpo/lienzo-en-pantalla.tsx'), 'utf8');
  assert.match(lienzo, /convienePorSemana\(desde, periodo\.hasta\) \? 'SEMANA' : 'DIA'/, 'la regla de la base (GR-V01)');
  assert.match(lienzo, /aria-pressed=\{modo === 'SEMANA'\}/);
  assert.match(lienzo, /aria-pressed=\{modo === 'DIA'\}/);
  assert.match(lienzo, /aria-live="polite" data-lectura-de-la-semana/);
  assert.match(lienzo, /<caption>\{CS\.tabla\(titulo\)\}<\/caption>/);
  assert.match(lienzo, /<th scope="row">\{nombreDelTramo\(t\)\}<\/th>/);
  assert.match(lienzo, /<span className="visualmente-oculto">\{e\.largo\}<\/span>/, 'la ficha corta y el texto entero para el lector');
  assert.match(lienzo, /<ComoLeerlo de=\{titulo\}>/);
  assert.match(lienzo, /RELLENO_ENTERA : RELLENO_HUECA/, 'las barras con el relleno de la base, medido a 3:1 en los dos temas (TEST-GRV-013)');
  assert.match(lienzo, /className="grafico-base__cabecera"/);
  assert.match(lienzo, /altoDelCarril\(densidad, deValores\)/, '240 px con un panel, 140 con más (la base)');
  assert.doesNotMatch(lienzo, /valoresDelEjeVertical/, 'el eje de la base, sin la regla vieja de tres marcas');
  // «Registros»: el botón dice qué gráfico es, sin «día por día» (también va por semana).
  const registros = readFileSync(join(GRAFICOS, 'nutricion/dia-por-dia-en-registros.tsx'), 'utf8');
  assert.match(registros, /ocultar: 'Ocultar el gráfico'/);
  assert.equal(COPY_NUTRICION_EN_GRAFICOS.indicadoYRegistrado.titulo, 'Lo indicado y lo registrado');
  const hoja = readFileSync(join(GRAFICOS, 'estilos/nutricion-y-cuerpo.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(hoja, /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
});

test('TEST-GRVC-008 · las palabras: ningún archivo de la rama dice «asesorado», «cumplimiento», «adherencia», «racha» ni «puntaje», ni siquiera negados, y los textos nuevos pasan la guardia unida (mutación: «sin racha» en una ficha)', () => {
  const archivos = ['nutricion', 'antropometria', 'nutricion-y-cuerpo'].flatMap((c) => readdirSync(join(GRAFICOS, c)).map((a) => join(GRAFICOS, c, a)));
  for (const archivo of [...archivos, join(GRAFICOS, 'estilos/nutricion-y-cuerpo.css')]) {
    const fuente = readFileSync(archivo, 'utf8').replace(/asesoradoId/g, '');
    assert.doesNotMatch(fuente, /asesorad|cumplimiento|adherencia|racha|puntaje/i, archivo);
  }
  sinPalabrasProhibidas(textosDelCopy(COPY_NUTRICION_EN_GRAFICOS), ['NUTRICION']);
  sinPalabrasProhibidas(textosDelCopy(COPY_ANTROPOMETRIA_EN_GRAFICOS), ['ANTROPOMETRIA']);
  // La prueba muerde: «sin racha» cae en la expresión de arriba.
  assert.match('Sin racha esta semana', /asesorad|cumplimiento|adherencia|racha|puntaje/i);
});
