/**
 * WP-GRAFICOS fase 2 (DL-174), la base del website: el eje de fechas común, los carriles, lo indicado del entrenamiento,
 * la tabla equivalente, los tramos de 92 días, el cursor con el teclado, los estados, los tokens nuevos, los registros,
 * los textos comunes y la cinta del tiempo (GR-23). TEST-GRF-010 a TEST-GRF-019 (las 001 a 009 son del dominio, en
 * `packages/domain/src/series-disponibles.test.ts`). Los datos son sintéticos y se validan contra los esquemas estrictos
 * de la API, para no apoyarse en una forma que la API no puede devolver.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EjecucionDeEntrenamientoSchema,
  EJERCICIOS_DE_LA_ESTIMACION_V1,
  EntradaDeLineaDeTiempoSchema,
  FRASE_DE_LA_COINCIDENCIA,
  NotaPropiaSchema,
  NotasDeLasSesionesResponseSchema,
  observacionesDelEjercicio,
  serieDisponible,
  terminosProhibidosEnUnGrafico,
} from '@be/domain';

// Los módulos de la base importan sin extensión (como pide el website): el gancho prueba con `.ts`.
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
const E = await import('../src/app/pro/advisees/graficos/eje-de-fechas.ts');
const C = await import('../src/app/pro/advisees/graficos/carriles.ts');
const T = await import('../src/app/pro/advisees/graficos/tabla-equivalente.ts');
const R = await import('../src/app/pro/advisees/graficos/registro-de-graficos.ts');
const { REGISTRO_DE_GRAFICOS } = await import('../src/app/pro/advisees/graficos/registros.ts');
const { COPY_DE_LOS_GRAFICOS, SENTIDO_CORTO, SENTIDO_EN_LA_LEYENDA } = await import('../src/app/pro/advisees/graficos/copy.ts');
const A = await import('../src/app/pro/advisees/graficos/adaptadores.ts');
const K = await import('../src/app/pro/advisees/graficos/cinta-del-tiempo.ts');
// La pasada visual (15/11): los ejes y los rótulos, las semanas, lo indicado en el tiempo y las versiones en el eje.
const J = await import('../src/app/pro/advisees/graficos/ejes.ts');
const S = await import('../src/app/pro/advisees/graficos/semanas.ts');
const L = await import('../src/app/pro/advisees/graficos/lo-indicado-en-el-tiempo.ts');
const V = await import('../src/app/pro/advisees/graficos/versiones-en-el-eje.ts');

// ─── Sesiones sintéticas de API-TRN-21, validadas contra el esquema estricto de la ejecución ──────
const BANCA = { exerciseId: 'ej-banca', exerciseVersionId: 'ver-banca-1', exerciseName: 'Press de banca' };
const prescripcion = (prescriptionId, repeticiones, extra = {}) => ({
  prescriptionId,
  order: 1,
  ...BANCA,
  sets: repeticiones.map((repetitions, i) => ({ setIndex: i + 1, repetitions, note: null })),
  intensity: null,
  suggestedLoad: null,
  professionalParameters: [],
  note: null,
  ...extra,
});
const serieRegistrada = (setIndex, carga, completedRepetitions, rir) => ({ setIndex, load: { value: carga, unit: 'kg' }, completedRepetitions, rir, perceivedExertion: null });
function sesion({ id, fecha, planId, rx, series, realizado = null, condicion = 'COMPLETED' }) {
  const ocurrio = `${fecha}T10:00:00.000-03:00`;
  return EjecucionDeEntrenamientoSchema.parse({
    executionId: id,
    state: 'REGISTERED',
    adviseeId: 'persona-1',
    planId,
    snapshotDigest: 'a'.repeat(64),
    occurrenceId: `oc-${id}`,
    date: fecha,
    timeZone: 'America/Argentina/Buenos_Aires',
    plannedSession: { sessionId: 'ses-a', label: 'Piernas A', order: 1, instructions: null, prescriptions: [rx], blockId: 'blq-1', blockLabel: 'Bloque 1', microcycleId: null, microcycleLabel: null },
    original: {
      granularity: 'SET',
      sessionCondition: condicion,
      reason: null,
      exercises: [
        {
          prescriptionId: rx.prescriptionId,
          prescribedExerciseVersionId: rx.exerciseVersionId,
          prescribedExerciseName: rx.exerciseName,
          performedExerciseVersionId: realizado?.versionId ?? rx.exerciseVersionId,
          performedExerciseName: realizado?.nombre ?? rx.exerciseName,
          substituted: realizado !== null,
          sets: series,
          executionSummary: null,
        },
      ],
      sessionSummary: null,
    },
    corrections: [],
    effectiveView: { kind: 'ORIGINAL' },
    occurredAt: ocurrio,
    recordedAt: ocurrio,
  });
}

const periodo = (desde, hasta, desdeElVinculo = null) => ({ desde, hasta, hoy: hasta, desdeElVinculo });
const punto = (clave, fecha, valor, extra = {}) => ({ clave, fecha, hasta: null, en: null, valor, rango: null, tramo: 's1', marca: 'LLENA', tarde: false, lectura: `${valor} kg`, ...extra });
const carril = (puntos, extra = {}) => ({
  tipo: 'PUNTOS',
  id: 'carga',
  nombre: 'Carga registrada en la serie 1',
  unidad: 'kg',
  metodo: null,
  indice: 0,
  puntos,
  indicado: [],
  escalones: [],
  unir: true,
  escala: { enteros: false },
  cobertura: [],
  descripcion: 'Tres sesiones.',
  ...extra,
});

test('TEST-GRF-010 · el eje de fechas: cada fecha en su mediodía, la semana a su mitad, la inversa y las marcas sin pisarse; lo anterior al vínculo no se dibuja', () => {
  const e = E.escalaDeFechas(periodo('2026-11-02', '2026-11-08'), { izquierda: 0, derecha: 700 });
  assert.equal(e.porDia, 100);
  assert.equal(e.x('2026-11-02'), 50);
  assert.equal(e.x('2026-11-08'), 650);
  assert.equal(e.fechaDeX(50), '2026-11-02');
  assert.equal(e.fechaDeX(699), '2026-11-08');
  assert.equal(e.xDePunto({ fecha: '2026-11-02', hasta: '2026-11-08', en: null }), 350);
  assert.equal(e.xDePunto({ fecha: '2026-11-03', hasta: null, en: '2026-11-03T18:00:00Z' }), 175);
  // Una hora que cae en otro día no se respeta: va al mediodía de su fecha.
  assert.equal(e.xDePunto({ fecha: '2026-11-03', hasta: null, en: '2026-11-05T18:00:00Z' }), 150);
  for (const [desde, hasta, ancho] of [
    ['2026-11-02', '2026-11-08', 320],
    ['2026-08-01', '2026-11-14', 700],
    ['2025-11-15', '2026-11-14', 900],
    ['2025-11-15', '2026-11-14', 300],
  ]) {
    const m = E.escalaDeFechas(periodo(desde, hasta), { izquierda: 0, derecha: ancho }).marcas;
    assert.ok(m.length >= 1, `${desde} a ${hasta} en ${ancho}`);
    for (let i = 1; i < m.length; i++) assert.ok(m[i].x - m[i - 1].x >= E.SEPARACION_MINIMA_DE_MARCAS, `${m[i - 1].texto} y ${m[i].texto} se pisan en ${ancho}`);
  }
  const conVinculo = E.escalaDeFechas(periodo('2026-11-02', '2026-11-08', '2026-11-05'), { izquierda: 0, derecha: 400 });
  assert.equal(conVinculo.desde, '2026-11-05');
  assert.equal(E.empiezaAntesDelVinculo(periodo('2026-11-02', '2026-11-08', '2026-11-05')), true);
  assert.equal(E.empiezaAntesDelVinculo(periodo('2026-11-02', '2026-11-08')), false);
  assert.equal(E.textoDeLaMarca('2026-11-03'), '3/11');
});

test('TEST-GRF-011 · la línea se corta en un hueco y entre tramos, Antropometría no une nada y lo indicado va hueco y por versión (mutación: unir a través de un hueco)', () => {
  const puntos = [punto('a', '2026-11-02', 10), punto('b', '2026-11-03', null), punto('c', '2026-11-04', 12), punto('d', '2026-11-05', 13), punto('e', '2026-11-06', 14, { tramo: 's2' })];
  assert.deepEqual(
    C.lineasDelCarril(puntos).map((l) => l.map((p) => p.clave)),
    [['c', 'd']],
  );
  const escala = E.escalaDeFechas(periodo('2026-11-02', '2026-11-08'), { izquierda: 0, derecha: 700 });
  const unido = C.geometriaDelCarril(carril(puntos), escala, 140);
  assert.equal(unido.lineas.length, 1);
  assert.equal(unido.marcas.length, 4, 'un hueco no es un punto en cero');
  const sueltos = C.geometriaDelCarril(carril(puntos, { unir: false }), escala, 140);
  assert.equal(sueltos.lineas.length, 0);
  // El rango mínimo de la serie manda sobre el de la unidad: el 1RM estimado abarca 10 kg.
  const fuerza = C.geometriaDelCarril(carril([punto('x', '2026-11-02', 100), punto('y', '2026-11-04', 101)], { escala: { enteros: false, rangoMinimo: 10 } }), escala, 140);
  assert.ok(fuerza.extremos.arriba - fuerza.extremos.abajo >= 10);
  // El RIR va de 0 a 5 como mínimo.
  const rir = C.geometriaDelCarril(carril([punto('r', '2026-11-02', 1)], { unidad: 'RIR', escala: { enteros: true, desdeCero: true, minimoDelMaximo: 5 } }), escala, 140);
  assert.equal(rir.extremos.abajo, 0);
  assert.ok(rir.extremos.arriba >= 5);
  assert.deepEqual(C.fechasConObservacion([carril(puntos)]), ['2026-11-02', '2026-11-04', '2026-11-05', '2026-11-06']);

  // Lo indicado (GR-T14): la prescripción de la versión que rigió cada sesión, hueca, y la línea solo dentro de una misma
  // prescripción de una misma versión. En la v1 el RIR es el de la prescripción (2); en la v2, el objetivo de la serie (0).
  const v1 = prescripcion('rx-banca', [{ min: 8, max: 10 }, { value: 8 }], { intensity: { criterion: 'RIR', target: { value: 2, reference: null } } });
  const v2 = prescripcion('rx-banca-2', [{ value: 6 }], { intensity: { criterion: 'RIR', target: { value: 1, reference: null } } });
  const sesiones = [
    sesion({ id: 'x-a', fecha: '2026-11-02', planId: 'tv1', rx: v1, series: [serieRegistrada(1, 60, 9, 2)] }),
    sesion({ id: 'x-b', fecha: '2026-11-04', planId: 'tv1', rx: v1, series: [serieRegistrada(1, 62.5, 8, 1)] }),
    sesion({ id: 'x-c', fecha: '2026-11-09', planId: 'tv2', rx: v2, series: [serieRegistrada(1, 65, 6, 1)] }),
    sesion({ id: 'x-d', fecha: '2026-11-11', planId: 'tv2', rx: v2, series: [serieRegistrada(1, 65, 6, 0)] }),
  ];
  const objetivos = new Map([['tv2', new Map([['rx-banca-2', [{ setIndex: 1, target: { rir: 0, suggestedLoad: null }, targetOrigin: { rir: 'SET', suggestedLoad: 'NONE' } }]]])]]);
  const opciones = { exerciseKey: 'e:ej-banca', serie: 1, medida: { variable: 'rir' }, desde: '2026-11-01', hasta: '2026-11-14' };
  const indicado = A.puntosDeLoIndicado(sesiones, objetivos, opciones);
  assert.deepEqual(
    indicado.map((p) => [p.fecha, p.valor, p.lectura]),
    [
      ['2026-11-02', 2, 'RIR 2'],
      ['2026-11-04', 2, 'RIR 2'],
      ['2026-11-09', 0, 'RIR 0'],
      ['2026-11-11', 0, 'RIR 0'],
    ],
  );
  assert.ok(indicado.every((p) => p.marca === 'HUECA' && p.tarde === false), 'lo indicado va hueco');
  assert.equal(indicado[0].tramo, indicado[1].tramo);
  assert.equal(indicado[2].tramo, indicado[3].tramo);
  assert.notEqual(indicado[1].tramo, indicado[2].tramo, 'otra versión corta la línea de lo indicado');
  assert.equal(C.lineasDelCarril(indicado).length, 2);
  // Un rango indicado es un segmento hueco, sin un valor del medio; lo que no está fijado no es un punto.
  const repeticiones = A.puntosDeLoIndicado(sesiones, objetivos, { ...opciones, medida: { variable: 'repeticiones' } });
  assert.deepEqual(repeticiones[0].rango, { desde: 8, hasta: 10 });
  assert.equal(repeticiones[0].valor, null);
  assert.equal(repeticiones[0].lectura, '8 a 10 rep');
  assert.deepEqual(
    repeticiones.slice(2).map((p) => p.valor),
    [6, 6],
  );
  assert.deepEqual(A.puntosDeLoIndicado(sesiones, objetivos, { ...opciones, medida: { variable: 'carga', unidad: 'kg' } }), [], 'sin carga sugerida ni objetivo, no hay punto');
  assert.equal(A.lecturaDeLoIndicado({ tipo: 'porcentaje-rm', valor: 75, referencia: null }, { variable: 'carga', unidad: 'kg' }), null, 'un % RM no se convierte a kg');
  assert.equal(A.lecturaDeLoIndicado({ tipo: 'otra-unidad', carga: { value: 100, unit: 'lb' } }, { variable: 'carga', unidad: 'kg' }), null, 'kg y lb nunca van juntas');
  assert.equal(A.lecturaDeLoIndicado({ tipo: 'valor', valor: 40, origen: 'prescripcion', sugerida: true }, { variable: 'carga', unidad: 'kg' }), '40 kg (sugerida)');
  // La misma lectura como serie analítica (para «Analizar» y `entrenamiento.rir-indicado`): solo valores, con su nota.
  const serie = A.serieDeLoIndicado(sesiones, objetivos, { ...opciones, metricId: 'entrenamiento.rir-indicado', nombre: 'RIR indicado en la serie', escala: 'ORDINAL' });
  assert.deepEqual(
    serie.points.map((p) => p.value),
    [2, 2, 0, 0],
  );
  assert.equal(serie.segments.length, 2);
  assert.match(serie.notes[0], /no lo que hizo la persona/);
  const conRango = A.serieDeLoIndicado(sesiones, objetivos, { ...opciones, medida: { variable: 'repeticiones' }, metricId: 'entrenamiento.repeticiones-indicadas', nombre: 'Repeticiones indicadas', escala: 'COUNT' });
  assert.deepEqual(
    conRango.points.map((p) => p.value),
    [6, 6],
  );
  assert.ok(conRango.notes.includes('2 sesiones indicaban un rango: no se dibuja como un número.'));
  // Los objetivos de API-SER-01, por prescripción, de las sesiones de los bloques y de los microciclos.
  const leidos = A.objetivosDelPlanLeido({ blocks: [{ sessions: [{ prescriptions: [{ prescriptionId: 'rx-1', sets: ['s1'] }] }], microcycles: [{ sessions: [{ prescriptions: [{ prescriptionId: 'rx-2', sets: ['s2'] }] }] }] }] });
  assert.deepEqual([...leidos.entries()], [
    ['rx-1', ['s1']],
    ['rx-2', ['s2']],
  ]);
});

test('TEST-GRF-012 · la tabla dice lo mismo que el dibujo: los subtotales, lo indicado, lo cargado después y los tramos sin registros como texto (mutación: perder los subtotales)', () => {
  const energia = carril(
    [
      punto('a', '2026-11-02', 2150, { lectura: '2.150 kcal' }),
      punto('b', '2026-11-08', 1850, { marca: 'HUECA', lectura: '1.850 kcal · subtotal: 1 comida sin cantidades', tarde: true }),
    ],
    {
      id: 'energia',
      nombre: 'Calorías registradas',
      unidad: 'kcal',
      indicado: [punto('i', '2026-11-02', 2200, { marca: 'HUECA', lectura: '2.200 kcal' })],
      cobertura: [
        { fecha: '2026-11-02', estado: 'con' },
        { fecha: '2026-11-03', estado: 'sin' },
        { fecha: '2026-11-04', estado: 'sin' },
        { fecha: '2026-11-05', estado: 'sin' },
        { fecha: '2026-11-06', estado: 'sin' },
        { fecha: '2026-11-07', estado: 'sin' },
        { fecha: '2026-11-08', estado: 'hueco' },
      ],
    },
  );
  const t = T.tablaEquivalente([energia, { tipo: 'EVENTOS', id: 'cinta', nombre: 'Lo que pasó', eventos: [] }]);
  assert.deepEqual(t.columnas, [{ id: 'energia', nombre: 'Calorías registradas', unidad: 'kcal' }]);
  assert.deepEqual(
    t.filas.map((f) => f.fecha),
    ['2026-11-02', '2026-11-08'],
  );
  const subtotal = t.filas[1].celdas[0];
  assert.equal(subtotal.marca, 'HUECA');
  assert.match(subtotal.texto, /subtotal: 1 comida sin cantidades/);
  assert.match(subtotal.texto, /cargado después/);
  assert.equal(t.filas[0].celdas[0].texto, '2.150 kcal · indicado: 2.200 kcal');
  assert.deepEqual(t.sinRegistros, ['del 3/11 al 7/11, sin registros']);
  assert.deepEqual(T.lecturaDeLaFecha(t, '2026-11-08'), [{ nombre: 'Calorías registradas', texto: subtotal.texto }]);
  assert.deepEqual(T.lecturaDeLaFecha(t, '2026-11-05'), [{ nombre: 'Calorías registradas', texto: T.TEXTO_SIN_DATO }]);
  assert.equal(C.lineaDeLoCargadoTarde(energia), '1 de 2 días se cargó en un día posterior (muesca arriba de la marca)');
});

test('TEST-GRF-013 · los tramos de 92 días cubren el período sin días repetidos ni perdidos (mutación: tramos de 93)', () => {
  const tramos = E.tramosDe('2025-11-15', '2026-11-14', 92);
  assert.equal(tramos.length, 4);
  assert.equal(tramos[0].desde, '2025-11-15');
  assert.equal(tramos.at(-1).hasta, '2026-11-14');
  const dias = (t) => Math.round((Date.parse(`${t.hasta}T12:00:00Z`) - Date.parse(`${t.desde}T12:00:00Z`)) / 86_400_000) + 1;
  assert.equal(
    tramos.reduce((n, t) => n + dias(t), 0),
    365,
  );
  for (const t of tramos) assert.ok(dias(t) <= 92, `${t.desde} a ${t.hasta}`);
  for (let i = 1; i < tramos.length; i++) assert.equal(Date.parse(`${tramos[i].desde}T12:00:00Z`) - Date.parse(`${tramos[i - 1].hasta}T12:00:00Z`), 86_400_000);
  assert.deepEqual(E.tramosDe('2026-11-14', '2026-11-14', 92), [{ desde: '2026-11-14', hasta: '2026-11-14' }]);
  assert.deepEqual(E.tramosDe('2026-11-15', '2026-11-14', 92), []);
  // API-TRN-21 (lo indicado y las sustituciones) se lee solo así: en tramos de 92 días, que es lo que admite la API.
  const lecturas = readFileSync(join(GRAFICOS, 'lecturas.ts'), 'utf8');
  assert.match(lecturas, /export const DIAS_POR_LECTURA_DE_LAS_SESIONES = 92;/);
  assert.match(lecturas, /leerEnTramos\(p\.periodo, DIAS_POR_LECTURA_DE_LAS_SESIONES, \(d, h\) => api\.contextoDeRevisionDeEntrenamiento\(/);
  assert.equal(lecturas.match(/api\.contextoDeRevisionDeEntrenamiento\(/g)?.length, 1, 'API-TRN-21 no se lee de otra manera');
  // La cinta (API-DSH-04) admite hasta 366 días por pedido: un período más largo se lee en tramos, del más reciente al más
  // antiguo, para que lo que quede afuera del tope de páginas sea lo más antiguo (mutación: tramos del más antiguo al más
  // reciente, o un solo pedido con todo el período).
  assert.equal(K.DIAS_POR_LECTURA_DE_LA_CINTA, 366);
  const deLaCinta = K.tramosDeLaCinta('2024-09-01', '2026-11-14');
  assert.equal(deLaCinta.length, 3);
  assert.deepEqual(deLaCinta[0], { desde: '2026-09-03', hasta: '2026-11-14' });
  assert.equal(deLaCinta.at(-1).desde, '2024-09-01');
  for (const t of deLaCinta) assert.ok(dias(t) <= 366, `${t.desde} a ${t.hasta}`);
  assert.equal(
    deLaCinta.reduce((n, t) => n + dias(t), 0),
    dias({ desde: '2024-09-01', hasta: '2026-11-14' }),
  );
  for (let i = 1; i < deLaCinta.length; i++) assert.equal(Date.parse(`${deLaCinta[i - 1].desde}T12:00:00Z`) - Date.parse(`${deLaCinta[i].hasta}T12:00:00Z`), 86_400_000);
  assert.deepEqual(K.tramosDeLaCinta('2026-08-01', '2026-11-14'), [{ desde: '2026-08-01', hasta: '2026-11-14' }]);
  assert.match(lecturas, /for \(const tramo of tramosDeLaCinta\(desde, hasta\)\)/);
  assert.match(lecturas, /periodStart: tramo\.desde, periodEnd: tramo\.hasta/);
  assert.equal(lecturas.match(/api\.lineaDeTiempo\(/g)?.length, 1, 'API-DSH-04 se lee solo por tramos');
  // Lo que se comparte en vuelo se descarta al responder: no queda nada guardado.
  assert.match(lecturas, /leer\(\)\.finally\(\(\) => enVuelo\.delete\(clave\)\)/);
});

test('TEST-GRF-014 · el cursor con el teclado: flechas, Inicio, Fin, Mayúscula arma un tramo y Escape lo suelta', () => {
  const fechas = ['2026-11-02', '2026-11-04', '2026-11-09'];
  const nada = { fecha: null, tramo: null };
  assert.deepEqual(E.moverElCursor(fechas, nada, 'ArrowRight', false), { fecha: '2026-11-02', tramo: null });
  assert.deepEqual(E.moverElCursor(fechas, nada, 'End', false), { fecha: '2026-11-09', tramo: null });
  assert.deepEqual(E.moverElCursor(fechas, { fecha: '2026-11-02', tramo: null }, 'Home', false), { fecha: '2026-11-02', tramo: null });
  const conTramo = E.moverElCursor(fechas, { fecha: '2026-11-09', tramo: null }, 'ArrowLeft', true);
  assert.deepEqual(conTramo, { fecha: '2026-11-04', tramo: { desde: '2026-11-04', hasta: '2026-11-09' } });
  assert.deepEqual(E.moverElCursor(fechas, conTramo, 'ArrowLeft', true), { fecha: '2026-11-02', tramo: { desde: '2026-11-02', hasta: '2026-11-09' } });
  assert.deepEqual(E.moverElCursor(fechas, conTramo, 'Escape', false), { fecha: '2026-11-04', tramo: null });
  assert.deepEqual(E.moverElCursor(fechas, { fecha: '2026-11-04', tramo: null }, 'Escape', false), nada);
  assert.equal(E.moverElCursor(fechas, nada, 'Escape', false), null);
  assert.equal(E.moverElCursor(fechas, nada, 'a', false), null);
  assert.equal(E.moverElCursor([], nada, 'ArrowRight', false), null);
});

test('TEST-GRF-015 · SIN_ACCESO no dibuja nada, y el gráfico es un grupo con nombre, con su resumen, su lectura viva y su tabla', () => {
  const estados = readFileSync(join(GRAFICOS, 'estado-del-grafico.tsx'), 'utf8');
  assert.match(estados, /case 'SIN_ACCESO':\s*return null;/);
  const paneles = readFileSync(join(GRAFICOS, 'paneles-alineados.tsx'), 'utf8');
  assert.match(paneles, /role="group"/);
  assert.match(paneles, /aria-roledescription="gráfico"/);
  assert.match(paneles, /aria-describedby=\{idDelResumen\}/);
  assert.match(paneles, /aria-hidden="true"/);
  assert.match(paneles, /tabIndex=\{0\}/);
  assert.match(paneles, /e\.pointerType === 'mouse'/, 'pasar por encima mueve la regla solo con mouse');
  assert.match(readFileSync(join(GRAFICOS, 'lectura-en-la-fecha.tsx'), 'utf8'), /aria-live="polite"/);
  const tabla = readFileSync(join(GRAFICOS, 'tabla-equivalente-en-pantalla.tsx'), 'utf8');
  assert.match(tabla, /<caption>/);
  assert.match(tabla, /scope="col"/);
  assert.match(tabla, /scope="row"/);
  // Ninguna lectura de datos de salud se guarda en el navegador.
  for (const archivo of ['lecturas.ts', 'paneles-alineados.tsx', 'cursor-de-fechas.tsx', 'adaptadores.ts', 'cinta-del-tiempo.ts', 'cinta-del-tiempo-en-pantalla.tsx', 'dibujo-de-la-cinta.tsx', 'medidas-del-grafico.ts'])
    assert.doesNotMatch(readFileSync(join(GRAFICOS, archivo), 'utf8'), /localStorage|sessionStorage|indexedDB/, archivo);
});

/** WCAG 2.2: la relación de contraste de dos colores hexadecimales. */
function contraste(a, b) {
  const l = (h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [l(a), l(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

test('TEST-GRF-016 · los tokens nuevos de los gráficos llegan a 3:1 contra la superficie en los dos temas', () => {
  const css = readFileSync(join(WEB, 'src/app/tokens.css'), 'utf8');
  const bloque = (selector) => {
    const inicio = css.indexOf(selector);
    assert.ok(inicio >= 0, selector);
    return css.slice(inicio, css.indexOf('\n}', inicio));
  };
  const valor = (texto, token) => {
    const m = texto.match(new RegExp(`\\s${token}:\\s*(#[0-9a-fA-F]{6})`));
    assert.ok(m, token);
    return m[1];
  };
  for (const selector of [':root {', "[data-tema='azul-noche'] {"]) {
    const b = bloque(selector);
    const superficie = valor(b, '--superficie');
    for (const token of ['--grafico-indicado', '--grafico-carga-rapida', '--grafico-cursor']) {
      const c = contraste(valor(b, token), superficie);
      assert.ok(c >= 3, `${token} en ${selector}: ${c.toFixed(2)}:1`);
    }
  }
});

test('TEST-GRF-017 · los registros de las cuatro ramas se unen sin IDs repetidos ni mal formados, y las cinco hojas y los cinco archivos de prueba están enganchados', () => {
  assert.ok(Array.isArray(REGISTRO_DE_GRAFICOS.todos));
  assert.equal(REGISTRO_DE_GRAFICOS.grafico('entrenamiento.uno-que-no-existe'), null);
  const vacio = () => null;
  const g = (id) => ({ id, codigo: 'GR-00', area: 'NUTRICION', titulo: 'Prueba', ubicacion: 'EN_EL_TIEMPO', series: [], requiere: { ejercicio: false, listaV1: false, medida: false }, ofrecido: (c) => c.acceso.alcances.includes('NUTRICION'), Grafico: vacio });
  assert.throws(() => R.crearRegistro([g('nutricion.uno'), g('nutricion.uno')]), /dos veces/);
  assert.throws(() => R.crearRegistro([g('Nutricion.uno')]), /mal formado/);
  const registro = R.crearRegistro([g('nutricion.uno')]);
  const sin = { acceso: { alcances: ['ENTRENAMIENTO'], propios: { NUTRICION: false, ENTRENAMIENTO: true, ANTROPOMETRIA: false } }, ejercicios: null, medidas: null };
  assert.deepEqual(registro.ofrecidos(sin), [], 'un área sin acceso no deja rastro');
  const layout = readFileSync(join(WEB, 'src/app/layout.tsx'), 'utf8');
  for (const hoja of ['base', 'entrenamiento', 'nutricion-y-cuerpo', 'cruces', 'patrones']) {
    assert.ok(existsSync(join(GRAFICOS, 'estilos', `${hoja}.css`)), hoja);
    assert.ok(layout.includes(`./pro/advisees/graficos/estilos/${hoja}.css`), hoja);
  }
  const prueba = JSON.parse(readFileSync(join(WEB, 'package.json'), 'utf8')).scripts.test;
  for (const archivo of ['graficos-base', 'graficos-entrenamiento', 'graficos-nutricion-y-cuerpo', 'graficos-cruces', 'graficos-patrones']) assert.ok(prueba.includes(`test/${archivo}.test.mjs`), archivo);
  // Un archivo .ts y uno .tsx con el mismo nombre se resolverían distinto en TypeScript y en el empaquetador (GR-T23).
  const nombres = ['adaptadores', 'carriles', 'cinta-del-tiempo', 'copy', 'eje-de-fechas', 'ejes', 'lecturas', 'lectura-de-lo-indicado', 'lo-indicado-en-el-tiempo', 'medidas-del-grafico', 'registro-de-graficos', 'registros', 'semanas', 'tabla-equivalente', 'versiones-en-el-eje'];
  for (const n of nombres) assert.ok(!existsSync(join(GRAFICOS, `${n}.tsx`)), `${n}.tsx choca con ${n}.ts`);
});

test('TEST-GRF-018 · los textos comunes de los gráficos pasan la guardia unida de las tres áreas', () => {
  const textos = [
    ...Object.values(COPY_DE_LOS_GRAFICOS).flatMap((v) => (typeof v === 'string' ? [v] : [])),
    COPY_DE_LOS_GRAFICOS.fueraDeLaEscala(1),
    COPY_DE_LOS_GRAFICOS.fueraDeLaEscala(3),
    COPY_DE_LOS_GRAFICOS.faltaHistoria(5, 'sesiones', [3, 7]),
    COPY_DE_LOS_GRAFICOS.faltaHistoria(4, 'semanas', [2]),
    COPY_DE_LOS_GRAFICOS.tramoElegido('3/11', '9/11'),
    ...Object.values(SENTIDO_EN_LA_LEYENDA),
    ...Object.values(SENTIDO_CORTO),
    COPY_DE_LOS_GRAFICOS.periodo('3 nov', null),
    COPY_DE_LOS_GRAFICOS.periodo('3 nov', '9 nov'),
    // La cinta del tiempo (GR-23) es de las tres áreas: sus textos pasan la unión de las tres listas.
    ...Object.values(K.COPY_DE_LA_CINTA).flatMap((v) => (typeof v === 'string' ? [v] : [])),
    K.COPY_DE_LA_CINTA.leidaHastaElTope(200),
    ...Object.values(K.SENTIDO_DEL_HECHO),
    ...Object.values(K.NOMBRE_DE_LA_FILA),
  ];
  for (const t of textos) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']), [], t);
  assert.equal(COPY_DE_LOS_GRAFICOS.faltaHistoria(5, 'sesiones', [3, 7]), 'Se arma con 5 sesiones por lado; hay 3 y 7.');
  assert.equal(COPY_DE_LOS_GRAFICOS.frase, 'Coinciden en el tiempo; esto no prueba que una cosa cause la otra.');
});

// ─── La cinta del tiempo (GR-23) ────────────────────────────────────────────────────────────────

const FUENTE_DEL_TIPO = {
  ANTHROPOMETRIC_EVALUATION_RECORDED: 'ANTHROPOMETRIC_EVALUATION',
  NUTRITION_REVIEW_RECORDED: 'NUTRITION_REVIEW',
  TRAINING_REVIEW_RECORDED: 'TRAINING_REVIEW',
  COORDINATION_NOTE_RECORDED: 'COORDINATION_NOTE',
  TRAINING_SESSION_RECORDED: 'TRAINING_EXECUTION',
  TRAINING_PLAN_ACTIVATED: 'TRAINING_PLAN_VERSION',
};
/** Un hecho de API-DSH-04, validado contra el esquema estricto de la línea de tiempo. */
const entrada = (id, domain, eventType, fecha, extra = {}) =>
  EntradaDeLineaDeTiempoSchema.parse({
    timelineEntryId: id,
    domain,
    eventType,
    source: { type: FUENTE_DEL_TIPO[eventType], id: id.split(':')[1] },
    occurredAt: null,
    occurredDate: fecha,
    recordedAt: `${fecha}T12:00:00.000-03:00`,
    recordedLate: false,
    timeZone: 'America/Argentina/Buenos_Aires',
    author: null,
    title: 'Hecho',
    details: [],
    state: 'EFFECTIVE',
    quality: [],
    planVersionId: null,
    exerciseKeys: [],
    relations: [],
    ...extra,
  });
const vigencia = (domain, planVersionId, label, from, to) => ({
  domain,
  planVersionId,
  label,
  activatedAt: `${from}T09:00:00.000-03:00`,
  from,
  to,
  endedAt: to === null ? null : `${to}T09:00:00.000-03:00`,
  endReason: to === null ? null : 'SUCCESSOR_ACTIVATED',
});

test('TEST-GRF-019 · la cinta del tiempo (GR-23): nada de un área sin acceso, ningún hábito ni nada anulado, las versiones como barras y lo que cae junto agrupado (mutación: dejar los eventos denegados)', () => {
  const entradas = [
    entrada('aeval:t1', 'ANTHROPOMETRY', 'ANTHROPOMETRIC_EVALUATION_RECORDED', '2026-11-03', { title: 'Toma antropométrica registrada', details: [{ label: 'Mediciones vigentes', value: '12' }, { label: 'Protocolo', value: 'ISAK 1' }] }),
    entrada('aeval:t3', 'ANTHROPOMETRY', 'ANTHROPOMETRIC_EVALUATION_RECORDED', '2026-11-04', { title: 'Toma antropométrica registrada' }),
    entrada('nrev:r1', 'NUTRITION', 'NUTRITION_REVIEW_RECORDED', '2026-11-05', { title: 'Revisión de Nutrición registrada', details: [{ label: 'Resultado', value: 'Mantener' }] }),
    entrada('trev:r2', 'TRAINING', 'TRAINING_REVIEW_RECORDED', '2026-11-06', { title: 'Revisión de Entrenamiento registrada', details: [{ label: 'Resultado', value: 'Ajustar' }] }),
    entrada('nota:n1', 'NUTRITION', 'COORDINATION_NOTE_RECORDED', '2026-11-06', { title: 'Nota de coordinación · Pedido de coordinación' }),
    entrada('tses:x1', 'TRAINING', 'TRAINING_SESSION_RECORDED', '2026-11-07', { title: 'Sesión registrada · Piernas A', quality: ['SESSION_WITH_DEVIATION'], exerciseKeys: ['e:ej-banca'] }),
    entrada('tses:x2', 'TRAINING', 'TRAINING_SESSION_RECORDED', '2026-11-08', { title: 'Sesión registrada · Piernas A', exerciseKeys: ['e:ej-banca'] }),
    entrada('aeval:t2', 'ANTHROPOMETRY', 'ANTHROPOMETRIC_EVALUATION_RECORDED', '2026-11-09', { title: 'Toma antropométrica registrada', state: 'ANNULLED' }),
    entrada('tplan:tv2', 'TRAINING', 'TRAINING_PLAN_ACTIVATED', '2026-11-04', { title: 'Plan de Entrenamiento activado · versión 2' }),
  ];
  const vigencias = [vigencia('TRAINING', 'tv1', 'v1', '2026-10-01', '2026-11-04'), vigencia('TRAINING', 'tv2', 'v2', '2026-11-04', null), vigencia('NUTRITION', 'nv1', 'v1', '2026-10-15', null)];
  const sustituida = sesion({ id: 'x-sus', fecha: '2026-11-10', planId: 'tv2', rx: prescripcion('rx-banca-2', [{ value: 6 }]), series: [serieRegistrada(1, 30, 8, 2)], realizado: { versionId: 'ver-mancuernas-1', nombre: 'Press con mancuernas' } });
  const otras = [
    { clave: 'habito:1', tipo: 'HABITO', area: 'ENTRENAMIENTO', desde: '2026-11-02', hasta: null, rotulo: 'Hábito declarado', detalle: null, agrupados: 1 },
    { clave: 'nota-persona:1', tipo: 'NOTA_DE_LA_PERSONA', area: 'ENTRENAMIENTO', desde: '2026-11-07', hasta: null, rotulo: 'Nota de la persona', detalle: null, agrupados: 1 },
  ];
  const fuentes = (alcances, exerciseKey = null) => ({ alcances, entradas, vigencias, ejecuciones: [sustituida], otras, exerciseKey });

  const todo = K.eventosDeLaCinta(fuentes(['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']));
  assert.deepEqual(
    todo.map((e) => e.clave),
    ['version:tv1', 'version:nv1', 'hecho:aeval:t1', 'version:tv2', 'hecho:aeval:t3', 'hecho:nrev:r1', 'hecho:trev:r2', 'hecho:nota:n1', 'hecho:tses:x1', 'nota-persona:1', 'sustitucion:x-sus:rx-banca-2'],
  );
  // Con solo Entrenamiento, nada de Nutrición ni de Antropometría (tampoco sus versiones), aunque la lectura lo trajera. La
  // nota de coordinación no es un dato de un área: es una comunicación dirigida a quien la lee (DL-140), y la API decide.
  const soloEntrenamiento = K.eventosDeLaCinta(fuentes(['ENTRENAMIENTO']));
  assert.deepEqual(
    soloEntrenamiento.map((e) => e.clave),
    ['version:tv1', 'version:tv2', 'hecho:trev:r2', 'hecho:nota:n1', 'hecho:tses:x1', 'nota-persona:1', 'sustitucion:x-sus:rx-banca-2'],
  );
  assert.ok(soloEntrenamiento.every((e) => e.area === null || e.area === 'ENTRENAMIENTO'));
  // Ningún hábito hasta su DL (GR-D10); nada anulado; ni una sesión sin cambios ni la activación (la versión ya es una
  // barra); y ninguna descarga inferida: solo los tipos declarados.
  const declarados = new Set(['VERSION_DE_PLAN', 'TOMA', 'SUSTITUCION', 'REVISION', 'NOTA_DE_COORDINACION', 'SESION_CON_CAMBIOS', 'NOTA_DE_LA_PERSONA', 'NOTA_PROPIA']);
  assert.ok(todo.every((e) => declarados.has(e.tipo)));
  for (const fuera of ['habito:1', 'hecho:aeval:t2', 'hecho:tses:x2', 'hecho:tplan:tv2']) assert.ok(!todo.some((e) => e.clave === fuera), fuera);
  // Una versión va del día que empezó a regir al día anterior al corte (ese día ya rige la siguiente); la vigente, sin fin.
  const porClave = (clave) => todo.find((e) => e.clave === clave);
  assert.deepEqual([porClave('version:tv1').hasta, porClave('version:tv2').hasta], ['2026-11-03', null]);
  assert.equal(K.textoDelEvento(porClave('version:tv1')), 'Del 1/10 al 3/11 · Entrenamiento · Plan de entrenamiento v1');
  assert.equal(K.textoDelEvento(porClave('version:tv2')), 'Desde el 4/11 · Entrenamiento · Plan de entrenamiento v2 (vigente)');
  assert.equal(K.textoDelEvento(porClave('hecho:aeval:t1')), '3/11 · Antropometría · Toma (Protocolo: ISAK 1)');
  assert.equal(K.textoDelEvento(porClave('hecho:nota:n1')), '6/11 · Nota de coordinación (Pedido de coordinación)');
  assert.equal(K.textoDelEvento(porClave('sustitucion:x-sus:rx-banca-2')), '10/11 · Entrenamiento · Sustitución (Se registró Press con mancuernas en lugar de Press de banca)');
  assert.equal(K.resumenDeLaCinta(todo), '3 versiones de planes, 2 tomas, 2 revisiones, 1 sesión con cambios, 1 sustitución, 1 nota de coordinación y 1 nota de la persona.');
  assert.deepEqual(K.loQueRigeEnLaFecha(todo, '2026-11-06'), ['rige Plan nutricional v1', 'rige Plan de entrenamiento v2', 'Revisión de Entrenamiento (Resultado: Ajustar)', 'Nota de coordinación (Pedido de coordinación)']);
  assert.deepEqual(
    K.eventosEnElPeriodo(todo, '2026-11-11', '2026-11-14').map((e) => e.clave),
    ['version:nv1', 'version:tv2'],
  );
  // En el cuadro de un ejercicio, las sesiones con cambios y las sustituciones son solo las de ese ejercicio.
  const cambios = (exerciseKey) => K.eventosDeLaCinta(fuentes(['ENTRENAMIENTO'], exerciseKey)).filter((e) => e.tipo === 'SESION_CON_CAMBIOS' || e.tipo === 'SUSTITUCION').length;
  assert.equal(cambios('e:ej-banca'), 2);
  assert.equal(cambios('e:ej-sentadilla'), 0);

  // Una fila por área con algo y una para las notas; lo que cae a menos de 18 px se agrupa y dice cuántos son y cuáles.
  const angosta = E.escalaDeFechas(periodo('2026-11-01', '2026-11-14'), { izquierda: 0, derecha: 140 });
  const g = K.geometriaDeLaCinta(soloEntrenamiento, angosta);
  assert.deepEqual(
    g.filas.map((f) => f.fila),
    ['ENTRENAMIENTO', 'NOTAS'],
  );
  assert.equal(g.alto, 2 * K.ALTO_DE_LA_FILA_DE_LA_CINTA);
  const [entrenamiento] = g.filas;
  assert.deepEqual(
    entrenamiento.barras.map((b) => [b.clave, b.texto]),
    [
      ['version:tv1', 'v1'],
      ['version:tv2', null],
    ],
  );
  assert.deepEqual(
    entrenamiento.hechos.map((h) => [h.evento.rotulo, h.hechos.length]),
    [
      ['3 hechos', 3],
      ['Sustitución', 1],
    ],
  );
  const grupo = entrenamiento.hechos[0].evento;
  assert.deepEqual([grupo.desde, grupo.hasta, grupo.agrupados], ['2026-11-06', '2026-11-07', 3]);
  assert.equal(grupo.detalle, '6/11 · Revisión de Entrenamiento; 7/11 · Sesión con cambios; 7/11 · Nota de la persona');
  assert.deepEqual(
    K.geometriaDeLaCinta(todo, angosta)
      .filas.find((f) => f.fila === 'ANTROPOMETRIA')
      .hechos.map((h) => h.evento.rotulo),
    ['2 hitos'],
  );
  const ancha = E.escalaDeFechas(periodo('2026-11-01', '2026-11-14'), { izquierda: 0, derecha: 1400 });
  assert.deepEqual(
    K.geometriaDeLaCinta(soloEntrenamiento, ancha).filas[0].hechos.map((h) => h.evento.rotulo),
    ['Revisión de Entrenamiento', '2 hechos', 'Sustitución'],
  );
  // Elegir con el puntero y con el teclado: una barra o un grupo eligen su tramo en todos los gráficos; un hecho, su fecha.
  const elegibles = K.elegiblesDeLaCinta(g);
  assert.deepEqual(
    elegibles.map((e) => e.clave),
    ['version:tv1', 'version:tv2', 'grupo:hecho:trev:r2', 'hecho:nota:n1', 'sustitucion:x-sus:rx-banca-2'],
  );
  assert.equal(K.elegibleEn(elegibles, g, 57, 10), 2);
  assert.equal(K.elegibleEn(elegibles, g, 20, 22), 0);
  assert.equal(K.elegibleEn(elegibles, g, 57, 30), 3);
  assert.equal(K.elegibleEn(elegibles, g, 57, 60), null);
  assert.deepEqual(K.cursorDelEvento(porClave('version:tv2'), '2026-11-14'), { fecha: '2026-11-04', tramo: { desde: '2026-11-04', hasta: '2026-11-14' } });
  assert.deepEqual(K.cursorDelEvento(grupo, '2026-11-14'), { fecha: '2026-11-06', tramo: { desde: '2026-11-06', hasta: '2026-11-07' } });
  assert.deepEqual(K.cursorDelEvento(porClave('hecho:aeval:t1'), '2026-11-14'), { fecha: '2026-11-03', tramo: null });
  assert.equal(K.moverEnLaCinta(5, null, 'ArrowRight'), 0);
  assert.equal(K.moverEnLaCinta(5, 0, 'ArrowLeft'), 0);
  assert.equal(K.moverEnLaCinta(5, null, 'End'), 4);
  assert.equal(K.moverEnLaCinta(5, 2, 'Escape'), -1);
  assert.equal(K.moverEnLaCinta(5, null, 'Escape'), null);
  assert.equal(K.moverEnLaCinta(0, null, 'Home'), null);
  assert.equal(K.moverEnLaCinta(5, 1, 'a'), null);
  assert.deepEqual(K.carrilDeLaCinta(soloEntrenamiento), { tipo: 'EVENTOS', id: 'cinta-del-tiempo', nombre: K.COPY_DE_LA_CINTA.titulo, eventos: soloEntrenamiento });

  // Los textos que arma la cinta pasan la guardia de las tres áreas.
  for (const t of [...todo.map(K.textoDelEvento), K.resumenDeLaCinta(todo), ...K.loQueRigeEnLaFecha(todo, '2026-11-06'), grupo.detalle])
    assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']), [], t);

  // La pantalla: un grupo con nombre que recibe el foco, su resumen, la lectura viva, el SVG que no se lee, sin flechas, y
  // sin acceso no dibuja nada. La lectura pide solo los tipos de la cinta y sin lo anulado.
  const pantalla = readFileSync(join(GRAFICOS, 'cinta-del-tiempo-en-pantalla.tsx'), 'utf8');
  for (const patron of [/role="group"/, /aria-roledescription="cinta del tiempo"/, /aria-describedby=\{idDelResumen\}/, /aria-live="polite"/, /aria-hidden="true"/, /tabIndex=\{0\}/, /estado=\{\{ tipo: 'SIN_ACCESO' \}\}/])
    assert.match(pantalla, patron);
  for (const archivo of ['cinta-del-tiempo-en-pantalla.tsx', 'dibujo-de-la-cinta.tsx']) assert.doesNotMatch(readFileSync(join(GRAFICOS, archivo), 'utf8'), /marker-end|markerEnd|<marker/, archivo);
  const lecturas = readFileSync(join(GRAFICOS, 'lecturas.ts'), 'utf8');
  assert.match(lecturas, /type: TIPOS_DE_HITO_DE_LA_CINTA\.join\(','\)/);
  assert.match(lecturas, /state: ESTADOS_DE_LA_CINTA\.join\(','\)/);
  assert.deepEqual(K.ESTADOS_DE_LA_CINTA, ['EFFECTIVE', 'RECTIFIED', 'CORRECTED']);
});

test('TEST-GRF-019 (b) · las notas de la tanda B en la cinta: las de la persona el día de su sesión y solo con Entrenamiento; las propias activas, en el día de Buenos Aires y en la fila de su ancla (mutación: dejar las de un área denegada o las archivadas)', () => {
  const deLaSesion = NotasDeLasSesionesResponseSchema.parse({
    data: {
      period: { start: '2026-11-01', end: '2026-11-14', timeZone: 'America/Argentina/Buenos_Aires' },
      notes: [
        { noteId: 'ns-1', executionId: 'x-sus', text: 'Me dolió el hombro en la última', recordedAt: '2026-11-10T20:00:00.000Z', executionDate: '2026-11-10' },
        { noteId: 'ns-2', executionId: 'x-otra', text: 'Llegué tarde', recordedAt: '2026-11-12T20:00:00.000Z', executionDate: '2026-11-12' },
      ],
    },
  }).data.notes;
  const propia = (noteId, recordedAt, anchor, archivedAt = null) => NotaPropiaSchema.parse({ noteId, adviseeId: 'persona-1', text: `Nota ${noteId}`, anchor, recordedAt, archivedAt });
  const propias = [
    // 23:30 del 7 en Buenos Aires: en UTC ya es el 8.
    propia('np-1', '2026-11-08T02:30:00.000Z', null),
    propia('np-2', '2026-11-09T15:00:00.000Z', { type: 'EXERCISE', exerciseId: 'ej-banca', exerciseName: 'Press de banca', inPlan: true }),
    propia('np-3', '2026-11-09T15:00:00.000Z', { type: 'MEAL', mealLabel: 'Almuerzo', inPlan: null }),
    propia('np-4', '2026-11-09T15:00:00.000Z', null, '2026-11-11T15:00:00.000Z'),
  ];
  const sustituida = sesion({ id: 'x-sus', fecha: '2026-11-10', planId: 'tv2', rx: prescripcion('rx-banca-2', [{ value: 6 }]), series: [serieRegistrada(1, 30, 8, 2)], realizado: { versionId: 'ver-mancuernas-1', nombre: 'Press con mancuernas' } });
  const fuentes = (alcances, exerciseKey = null) => ({ alcances, entradas: [], vigencias: [], ejecuciones: [sustituida], notasDeLaSesion: deLaSesion, notasPropias: propias, zona: 'America/Argentina/Buenos_Aires', exerciseKey });

  const todo = K.eventosDeLaCinta(fuentes(['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']));
  const notas = todo.filter((e) => e.tipo === 'NOTA_DE_LA_PERSONA' || e.tipo === 'NOTA_PROPIA');
  assert.deepEqual(
    notas.map((e) => [e.clave, e.desde, e.area]),
    [
      ['nota-propia:np-1', '2026-11-07', null],
      ['nota-propia:np-2', '2026-11-09', 'ENTRENAMIENTO'],
      ['nota-propia:np-3', '2026-11-09', 'NUTRICION'],
      ['nota-de-la-persona:ns-1', '2026-11-10', 'ENTRENAMIENTO'],
      ['nota-de-la-persona:ns-2', '2026-11-12', 'ENTRENAMIENTO'],
    ],
  );
  assert.equal(K.filaDelEvento(notas[0]), 'NOTAS');
  assert.equal(K.textoDelEvento(notas[1]), '9/11 · Entrenamiento · Nota propia sobre Press de banca (Nota np-2)');
  assert.equal(K.textoDelEvento(notas[3]), '10/11 · Entrenamiento · Nota de la persona (Me dolió el hombro en la última)');
  // Sin Entrenamiento no hay notas de la persona ni las propias atadas a un ejercicio; las archivadas no están nunca.
  const soloNutricion = K.eventosDeLaCinta(fuentes(['NUTRICION'])).map((e) => e.clave);
  assert.deepEqual(soloNutricion, ['nota-propia:np-1', 'nota-propia:np-3']);
  assert.ok(!todo.some((e) => e.clave === 'nota-propia:np-4'), 'una nota archivada no está en la cinta');
  // En el cuadro de un ejercicio: solo las notas de las sesiones con ese ejercicio y las propias atadas a él.
  assert.deepEqual(
    K.eventosDeLaCinta(fuentes(['ENTRENAMIENTO'], 'e:ej-banca'))
      .filter((e) => e.tipo === 'NOTA_DE_LA_PERSONA' || e.tipo === 'NOTA_PROPIA')
      .map((e) => e.clave),
    ['nota-propia:np-2', 'nota-de-la-persona:ns-1'],
  );
  assert.deepEqual(K.eventosDeLasNotasDeLaSesion(deLaSesion, 'e:ej-banca'), [], 'sin las sesiones leídas no se adivina de qué sesión habla una nota');
  // Con «Ocultar nombres» (PG-T73), las notas están con su día y su ancla, pero sin su texto hasta pedirlo (mutación: dejar
  // el texto a la vista).
  const ocultas = K.eventosDeLaCinta({ ...fuentes(['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']), conTextoDeLasNotas: false }).filter((e) => e.tipo === 'NOTA_DE_LA_PERSONA' || e.tipo === 'NOTA_PROPIA');
  assert.equal(ocultas.length, notas.length);
  assert.ok(ocultas.every((e) => e.detalle === null));
  assert.ok(!ocultas.map(K.textoDelEvento).join(' ').includes('hombro'));
  const pantalla = readFileSync(join(GRAFICOS, 'cinta-del-tiempo-en-pantalla.tsx'), 'utf8');
  assert.match(pantalla, /const ocultos = useNombresOcultos\(\);/);
  assert.match(pantalla, /const conTextoDeLasNotas = !ocultos \|\| verLasNotas;/);
  assert.match(pantalla, /\{COPY_DE_LA_CINTA\.mostrarLasNotas\}/);
  // La forma distingue la nota propia de la de coordinación, y los textos pasan la guardia de las tres áreas.
  assert.notEqual(K.ICONO_DEL_HECHO.NOTA_PROPIA, K.ICONO_DEL_HECHO.NOTA_DE_COORDINACION);
  for (const t of [...notas.map(K.textoDelEvento), K.resumenDeLaCinta(notas)]) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']), [], t);
  // La lectura: las de la persona solo con Entrenamiento y en tramos de 92 días; las propias de API-NPP-02; una falla que no
  // es un 404 se dice, no se vuelve «sin notas».
  const lecturas = readFileSync(join(GRAFICOS, 'lecturas.ts'), 'utf8');
  assert.match(lecturas, /conSesiones \? leerEnTramos\(p\.periodo, DIAS_MAXIMOS_DE_LAS_NOTAS_DE_LAS_SESIONES, \(d, h\) => api\.notasDeLasSesiones\(/);
  assert.match(lecturas, /limitarLectura\(\(\) => api\.notasPropias\(p\.token, p\.asesoradoId\)\)/);
  assert.match(lecturas, /if \(falla === null \|\| sinAcceso\(falla\)\) continue;/);
});

test('TEST-GRF-012 (b) · la tabla dice con palabras lo que dice la forma: lo tildado sin escribir, lo observado, lo reportado y lo calculado (mutación: dejarlo solo en la marca)', () => {
  const c = carril([
    punto('a', '2026-11-02', 80, { marca: 'HUECA_GRIS', lectura: '80 kg · 8 rep' }),
    punto('b', '2026-11-03', 99, { marca: 'ROMBO', lectura: '99 kg' }),
    punto('c', '2026-11-04', 70, { marca: 'CONTORNO_CORTADO', lectura: '70 kg' }),
    punto('d', '2026-11-05', 14, { marca: 'PUNTO_ADENTRO', lectura: '14 kg (calculado con Durnin y Womersley)' }),
    punto('e', '2026-11-06', 81, { marca: 'LLENA', lectura: '81 kg', tarde: true }),
  ]);
  const t = T.tablaEquivalente([c]);
  assert.deepEqual(
    t.filas.map((f) => f.celdas[0].texto),
    ['80 kg · 8 rep (tildado sin escribir: los números del plan)', '99 kg (observado por el profesional)', '70 kg (reportado)', '14 kg (calculado con Durnin y Womersley)', '81 kg (cargado después)'],
  );
  for (const f of t.filas) assert.deepEqual(terminosProhibidosEnUnGrafico(f.celdas[0].texto, ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']), [], f.celdas[0].texto);
});

test('TEST-GRF-011 (b) · el 1RM estimado por carrilDeSerie: lo observado por el profesional en rombo, lo orientativo hueco, el eje de 10 kg del catálogo y solo la lista de la v1; las semanas y las bandas no salen del eje (mutación: marcar lo observado como dato de la persona)', () => {
  const fuerza = (pointId, fecha, valor, extra = {}) => ({
    pointId,
    date: fecha,
    source: extra.observada ? 'OBSERVED' : 'PERSON',
    origin: extra.observada ? { type: 'STRENGTH_OBSERVATION', id: 'obs-1' } : { type: 'TRAINING_EXECUTION', id: 'x-1', prescriptionId: 'rx-1', setIndex: 1, corrected: false },
    estimate: { band: extra.banda ?? 'CORE', load: { value: 80, unit: 'kg' }, completedRepetitions: 5, rir: 1, equivalentRepetitions: 6, value: valor },
  });
  const s = A.serieDeLaFuerza({ estimate: { unit: 'kg', points: [fuerza('p1', '2026-11-02', 96), fuerza('p2', '2026-11-04', 97, { banda: 'ORIENTATIVE' }), fuerza('p3', '2026-11-05', 99, { observada: true })] } });
  const opciones = { id: 'f', nombre: '1RM estimado (Epley)', indice: 0, metodo: 'Epley', escala: { enteros: false }, descripcion: '', lectura: (p) => `${p.value} kg` };
  const c = A.carrilDeSerie(s, serieDisponible('entrenamiento.1rm-estimado'), opciones);
  assert.deepEqual(
    c.puntos.map((p) => [p.clave, p.marca]),
    [
      ['p1', 'LLENA'],
      ['p2', 'HUECA'],
      ['p3', 'ROMBO'],
    ],
  );
  assert.equal(c.escala.rangoMinimo, 10, 'el rango mínimo del catálogo manda (GR-T15)');
  assert.notEqual(c.puntos[0].tramo, c.puntos[2].tramo, 'lo observado no se une con lo de la persona');
  // Otra serie del catálogo sigue con la marca del dominio: un tramo con ese nombre no la vuelve rombo.
  const carga = A.carrilDeSerie({ ...s, points: s.points.map((p) => ({ ...p, segment: 'observada:x' })) }, serieDisponible('entrenamiento.carga', 'kg'), opciones);
  assert.ok(!carga.puntos.some((p) => p.marca === 'ROMBO'));
  assert.equal(carga.escala.rangoMinimo, undefined);
  // Solo un ejercicio del catálogo de la lista de la estimación tiene estimación: una versión suelta u otro ejercicio no se piden.
  const deLaLista = EJERCICIOS_DE_LA_ESTIMACION_V1[0].exerciseId;
  assert.equal(A.ejercicioDeLaEstimacion(`e:${deLaLista}`), deLaLista);
  assert.equal(A.ejercicioDeLaEstimacion(`v:${deLaLista}`), null);
  assert.equal(A.ejercicioDeLaEstimacion('e:00000000-0000-4000-8000-000000000000'), null);
  assert.equal(A.ejercicioDeLaEstimacion(null), null);
  const lecturas = readFileSync(join(GRAFICOS, 'lecturas.ts'), 'utf8');
  assert.match(lecturas, /const exerciseId = ejercicioDeLaEstimacion\(ref\.exerciseKey\);/);
  assert.doesNotMatch(lecturas, /exerciseKey\.replace\(/);

  // Una semana que empieza antes del vínculo se dibuja desde el primer día del eje; una que cae afuera, no.
  const escala = E.escalaDeFechas(periodo('2026-11-02', '2026-11-15', '2026-11-04'), { izquierda: 0, derecha: 1200 });
  const semanas = C.geometriaDelCarril(
    {
      tipo: 'BARRAS_SEMANALES',
      id: 's',
      nombre: 'Series por semana',
      unidad: 'series',
      semanas: [
        { lunes: '2026-10-26', valor: 40, dias: 3, lectura: '' },
        { lunes: '2026-11-02', valor: 12, dias: 2, lectura: '' },
        { lunes: '2026-11-09', valor: 14, dias: 3, lectura: '' },
      ],
      descripcion: '',
    },
    escala,
    140,
  );
  assert.deepEqual(
    semanas.barras.map((b) => b.lunes),
    ['2026-11-02', '2026-11-09'],
  );
  assert.equal(semanas.barras[0].x1, escala.x('2026-11-04') - escala.porDia / 2);
  assert.ok(semanas.barras.every((b) => b.x2 <= escala.x(escala.hasta) + escala.porDia / 2));
  assert.ok(semanas.extremos.arriba < 40, 'una semana fuera del eje no estira la escala');
  // Las bandas van del día que empezó a regir al anterior al corte, como las barras de la cinta: no se pisan.
  assert.deepEqual(
    A.bandasDeVersion([vigencia('TRAINING', 'tv1', 'v1', '2026-10-01', '2026-11-04'), vigencia('TRAINING', 'tv2', 'v2', '2026-11-04', null), vigencia('NUTRITION', 'nv1', 'v1', '2026-10-15', null)], 'ENTRENAMIENTO').map((b) => [b.desde, b.hasta]),
    [
      ['2026-10-01', '2026-11-03'],
      ['2026-11-04', null],
    ],
  );
});

// ─── La pasada visual (15/11; DISENO-VISUAL §1): lo que heredan las ramas B a E ──────────────────────────────────

test('TEST-GRV-001 · el eje vertical, sobrio: de 3 a 5 marcas redondas, sin un número repetido, que abarcan los datos (mutación: el «4, 4, 3» de la rama D)', () => {
  assert.deepEqual(J.marcasRedondas(136, 163).valores, [130, 140, 150, 160, 170]);
  assert.deepEqual(J.marcasRedondas(100, 110).valores, [100, 105, 110], 'el rango mínimo del 1RM (10 kg) sin «102,5»');
  assert.deepEqual(J.marcasRedondas(3, 4, { enteros: true }).valores, [2, 3, 4], 'dos repeticiones distintas no dejan un eje con dos marcas iguales');
  assert.deepEqual(J.marcasRedondas(0, 5, { enteros: true }).valores, [0, 2, 4, 6]);
  assert.deepEqual(J.marcasRedondas(0, 2870).valores, [0, 1000, 2000, 3000]);
  for (const [min, max, enteros] of [
    [0.4, 0.9, false],
    [12, 13, true],
    [80.6, 80.6, false],
    [1720, 2480, false],
    [3, 3, true],
    [0, 1, false],
    [96.5, 99, false],
    [117.5, 160.5, false],
    [0, 14, false],
  ]) {
    const m = J.marcasRedondas(min, max, { enteros });
    assert.ok(m.valores.length >= J.MARCAS_MINIMAS && m.valores.length <= J.MARCAS_MAXIMAS, `${min} a ${max}: ${m.valores.join(', ')}`);
    assert.ok(m.abajo <= min && m.arriba >= max, `${min} a ${max} entra en ${m.abajo} a ${m.arriba}`);
    const textos = m.valores.map((v) => J.textoDeLaMarcaDelEje(v, m.decimales));
    assert.equal(new Set(textos).size, textos.length, `sin números repetidos: ${textos.join(', ')}`);
    if (enteros) assert.ok(m.valores.every(Number.isInteger), 'lo que se cuenta va en enteros');
    if (min >= 0) assert.ok(m.abajo >= 0, 'lo que no baja de cero no tiene marcas negativas');
  }
  // Las barras arrancan en cero; los puntos, no: el carril de un 1RM no se aplasta contra el cero.
  const fuerza = C.geometriaDelCarril(carril([punto('x', '2026-11-02', 150), punto('y', '2026-11-04', 152)], { escala: { enteros: false, rangoMinimo: 10 } }), E.escalaDeFechas(periodo('2026-11-02', '2026-11-08'), { izquierda: 0, derecha: 700 }), 240);
  assert.ok(fuerza.extremos.abajo > 0);
  assert.ok(fuerza.marcasY.length >= 3 && fuerza.marcasY.length <= 5);
});

test('TEST-GRV-002 · sin rótulo en cada punto: el elegido, el último, el máximo y el mínimo, y nunca dos encimados (mutación: dibujar todos)', () => {
  const puntos = [
    { clave: 'a', valor: 141 },
    { clave: 'b', valor: 138 },
    { clave: 'c', valor: 160.5 },
    { clave: 'd', valor: 154.5 },
    { clave: 'e', valor: 157.5 },
  ];
  assert.deepEqual(J.puntosConRotulo(puntos, 'b'), ['b', 'e', 'c']);
  assert.deepEqual(J.puntosConRotulo(puntos, null), ['e', 'c', 'b']);
  assert.deepEqual(J.puntosConRotulo(puntos.slice(0, 3), null), ['c'], 'con menos de 4, solo el último');
  const caja = { izquierda: 0, derecha: 400, arriba: 0, abajo: 200 };
  const juntos = J.rotulosSinPisarse(
    [
      { clave: 'a', x: 100, y: 100, texto: '160,5' },
      { clave: 'b', x: 106, y: 102, texto: '154,5' },
      { clave: 'd', x: 104, y: 101, texto: '157,5' },
      { clave: 'c', x: 300, y: 100, texto: '141', abajo: true },
    ],
    caja,
  );
  assert.deepEqual(
    juntos.map((r) => r.clave),
    ['a', 'b', 'c'],
    'el segundo va abajo porque arriba pisaría al primero; el tercero pisaría en los dos lugares: no se dibuja',
  );
  assert.ok(juntos[1].ty > 102, 'el segundo, abajo de su punto');
  assert.ok(juntos[2].ty > 100, 'el mínimo, abajo de su punto');
  // Al borde, el rótulo se alinea hacia adentro; arriba de todo, va debajo del punto.
  const borde = J.rotulosSinPisarse([{ clave: 'z', x: 398, y: 4, texto: '99,5' }], caja);
  assert.equal(borde[0].ancla, 'end');
  assert.ok(borde[0].ty > 4);
  // Con muchos candidatos al azar, ninguno de los que quedan se pisa con otro.
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 9301 + 49297) % 233280) / 233280);
  const muchos = Array.from({ length: 60 }, (_, i) => ({ clave: `p${i}`, x: azar() * 400, y: 20 + azar() * 170, texto: String(100 + Math.round(azar() * 60)) }));
  const puestos = J.rotulosSinPisarse(muchos, caja);
  for (let i = 0; i < puestos.length; i++)
    for (let k = i + 1; k < puestos.length; k++) {
      const [x, y] = [puestos[i].caja, puestos[k].caja];
      assert.ok(!(x.x1 < y.x2 && y.x1 < x.x2 && x.y1 < y.y2 && y.y1 < x.y2), `${puestos[i].clave} y ${puestos[k].clave} se pisan`);
    }
});

test('TEST-GRV-003 · las fechas del eje, abreviadas y sin repetir el año (mutación: «nov 2025, dic 2025, ene 2026…»)', () => {
  assert.equal(E.textoDelEje('2026-11-03', false), '3 nov');
  assert.equal(E.textoDelEje('2026-01-01', true, true), 'ene 2026');
  assert.equal(E.textoDelEje('2026-02-01', true), 'feb');
  assert.equal(E.fechaCorta('2026-11-09', '2026-11-15'), 'lun 9 nov');
  assert.equal(E.diaYMes('2025-11-16', '2026-11-15'), '16 nov 2025');
  const anio = E.escalaDeFechas(periodo('2025-11-15', '2026-11-14'), { izquierda: 0, derecha: 1100 }).marcas.map((m) => m.texto);
  assert.equal(anio.filter((t) => /20\d\d/.test(t)).length, 2, `el año, en la primera y en enero: ${anio.join(', ')}`);
  assert.equal(anio[0], 'dic 2025');
  assert.ok(anio.includes('ene 2026'));
  const semana = E.escalaDeFechas(periodo('2026-11-02', '2026-11-08'), { izquierda: 0, derecha: 700 }).marcas.map((m) => m.texto);
  assert.equal(semana[0], '2 nov');
});

test('TEST-GRV-004 · una serie diaria con huecos, por semana: la media de los días con valor, sin hoy ni en el denominador, una semana sin dato vacía y nunca en cero (mutación: dibujar la semana vacía en cero; contar hoy en el «de 7»)', () => {
  const dias = [
    { fecha: '2026-11-02', valor: 2000 },
    { fecha: '2026-11-03', valor: null },
    { fecha: '2026-11-04', valor: 1800 },
    { fecha: '2026-11-15', valor: 5000 },
  ];
  const semanas = S.semanasDeLosDias(dias, '2026-11-02', '2026-11-15', '2026-11-15');
  assert.deepEqual(
    semanas.map((x) => [x.lunes, x.valor, x.conDato, x.dias, x.conHoy, x.hueca]),
    [
      ['2026-11-02', 1900, 2, 7, false, true],
      ['2026-11-09', null, 0, 7, true, true],
    ],
    'hoy sigue en curso: no entra en la media; una semana con 2 días de 7 no va llena',
  );
  assert.equal(S.denominadorDeLaSemana(semanas[0]), '2 de 7 días');
  assert.equal(S.denominadorDeLaSemana(semanas[1]), 'ningún día con valor');
  // Hoy no cuenta en el denominador: una semana entera hasta ayer dice «6 de 6 días», no «6 de 7».
  const hastaAyer = Array.from({ length: 6 }, (_, i) => ({ fecha: `2026-11-0${i + 2}`, valor: 2000 }));
  const conHoy = S.semanasDeLosDias([...hastaAyer, { fecha: '2026-11-08', valor: 900 }], '2026-11-02', '2026-11-08', '2026-11-08')[0];
  assert.equal(S.denominadorDeLaSemana(conHoy), '6 de 6 días');
  assert.equal(conHoy.valor, 2000, 'el valor de hoy (900, a medio día) no baja la media');
  // Un subtotal hace hueca a su semana; un período que corta la semana, también; siete de siete, llena.
  assert.equal(S.semanasDeLosDias([{ fecha: '2026-11-02', valor: 2000, parcial: true }], '2026-11-02', '2026-11-08', '2026-11-20')[0].hueca, true);
  assert.equal(S.semanasDeLosDias([{ fecha: '2026-11-04', valor: 2000 }], '2026-11-04', '2026-11-08', '2026-11-20')[0].hueca, true);
  const siete = Array.from({ length: 7 }, (_, i) => ({ fecha: `2026-11-0${i + 2}`, valor: 2000 }));
  assert.equal(S.semanasDeLosDias(siete, '2026-11-02', '2026-11-08', '2026-11-20')[0].hueca, false, 'siete días con valor: llena');
  assert.equal(S.convienePorSemana('2025-11-15', '2026-11-14'), true);
  assert.equal(S.convienePorSemana('2026-11-01', '2026-11-14'), false, 'un período corto se lee día por día');
  const g = S.geometriaPorSemana({ dias, desde: '2026-11-02', hasta: '2026-11-15', hoy: '2026-11-15', ancho: 400, alto: 132, fechas: ['2026-11-02', '2026-11-15'] });
  assert.equal(g.barras.length, 1);
  assert.equal(g.vacias.length, 1);
  assert.equal(g.eje[0].valor, 0, 'las barras arrancan en cero');
  assert.ok(g.eje.length >= 3 && g.eje.length <= 5);
  assert.ok(g.barras.every((b) => b.y < g.caja.abajo), 'ninguna barra en cero');
  assert.deepEqual(g.dias.map((d) => d.fecha), ['2026-11-02', '2026-11-04'], 'los días con valor van detrás, como puntos; hoy no, porque no entra en la media');
});

test('TEST-GRV-005 · lo que cambió en lo indicado, dicho en la versión y en la diferencia de dos etapas (mutación: «−1 rep» suelto)', () => {
  const v1 = prescripcion('rx-banca', [{ min: 8, max: 10 }, { value: 8 }], { intensity: { criterion: 'RIR', target: { value: 2, reference: null } } });
  const v2 = prescripcion('rx-banca-2', [{ value: 6 }], { intensity: { criterion: 'RIR', target: { value: 1, reference: null } } });
  const sesiones = [
    sesion({ id: 'x-a', fecha: '2026-11-02', planId: 'tv1', rx: v1, series: [serieRegistrada(1, 60, 9, 2)] }),
    sesion({ id: 'x-b', fecha: '2026-11-04', planId: 'tv1', rx: v1, series: [serieRegistrada(1, 62.5, 8, 1)] }),
    sesion({ id: 'x-c', fecha: '2026-11-09', planId: 'tv2', rx: v2, series: [serieRegistrada(1, 65, 6, 1)] }),
  ];
  const objetivos = new Map([['tv2', new Map([['rx-banca-2', [{ setIndex: 1, target: { rir: 0, suggestedLoad: null }, targetOrigin: { rir: 'SET', suggestedLoad: 'NONE' } }]]])]]);
  const observaciones = observacionesDelEjercicio(sesiones, 'e:ej-banca', sesiones, objetivos);
  const cambios = L.cambiosPorVersion(observaciones, [
    { clave: 'v1', desde: '2026-11-01', hasta: '2026-11-09' },
    { clave: 'v2', desde: '2026-11-09', hasta: null },
  ]);
  assert.deepEqual([...cambios.entries()], [['v2', 'de 8–10 a 6 repeticiones · RIR de 2 a 0']]);
  const enLaVersion = (planId) => L.loIndicadoEnElTramo(observaciones, (o) => o.comparacion.planId === planId, { serie: 1 });
  assert.deepEqual(enLaVersion('tv2'), { rir: { desde: 0, hasta: 0 }, repeticiones: { desde: 6, hasta: 6 }, carga: null });
  assert.equal(L.diferenciaDeLoIndicado(enLaVersion('tv1'), enLaVersion('tv2'), { variable: 'repeticiones' }), 'el plan indica 6 repeticiones (antes 8–10)');
  assert.equal(L.diferenciaDeLoIndicado(enLaVersion('tv1'), enLaVersion('tv2'), { variable: 'rir' }), 'el plan indica RIR 0 (antes 2)');
  const tres = { rir: null, repeticiones: { desde: 3, hasta: 3 }, carga: null };
  const cuatro = { rir: null, repeticiones: { desde: 4, hasta: 4 }, carga: null };
  assert.equal(L.diferenciaDeLoIndicado(cuatro, tres, { variable: 'repeticiones' }), 'el plan indica 1 repetición menos');
  assert.equal(L.diferenciaDeLoIndicado(tres, cuatro, { variable: 'repeticiones' }), 'el plan indica 1 repetición más');
  assert.equal(L.diferenciaDeLoIndicado(cuatro, cuatro, { variable: 'repeticiones' }), null, 'si no cambió, no se dice nada');
  assert.equal(L.diferenciaDeLoIndicado(null, cuatro, { variable: 'repeticiones' }), null);
  assert.equal(L.cambioCortoDeLoIndicado(cuatro, tres), 'de 4 a 3 repeticiones');
  // Ubica, no califica: ningún texto lleva una palabra que juzgue, ni una flecha.
  for (const t of [...cambios.values(), L.diferenciaDeLoIndicado(cuatro, tres, { variable: 'repeticiones' })]) {
    assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['ENTRENAMIENTO']), [], t);
    assert.doesNotMatch(t, /→|−\d/);
  }
});

test('TEST-GRV-006 · la leyenda, solo con las marcas que se ven (mutación: la leyenda de GR-02 con puntos que no se dibujan)', () => {
  const lleno = carril([punto('a', '2026-11-02', 10), punto('b', '2026-11-03', 11)]);
  assert.deepEqual(C.sentidosQueSeVen(['REGISTRADO', 'SUBTOTAL', 'INDICADO', 'OBSERVADA_POR_EL_PROFESIONAL'], [lleno]), ['REGISTRADO']);
  const conHueco = carril([punto('a', '2026-11-02', 10), punto('b', '2026-11-03', 11, { marca: 'HUECA' })], { indicado: [punto('i', '2026-11-02', 12, { marca: 'HUECA' })] });
  assert.deepEqual(C.sentidosQueSeVen(['REGISTRADO', 'SUBTOTAL', 'INDICADO', 'OBSERVADA_POR_EL_PROFESIONAL'], [conHueco]), ['REGISTRADO', 'SUBTOTAL', 'INDICADO']);
  // Un punto sin valor no es una marca: no pide su leyenda.
  assert.deepEqual(C.sentidosQueSeVen(['REGISTRADO', 'CALCULADO'], [carril([punto('a', '2026-11-02', null, { marca: 'PUNTO_ADENTRO' })])]), []);
  // La forma hueca dice más de una cosa: un subtotal de comida no pide «De más de 10 a 12 rep. equivalentes», ni al
  // revés (revisión del 15/11). El adaptador le pone a cada punto su sentido.
  const sub = carril([punto('a', '2026-11-02', 2000), punto('b', '2026-11-03', 900, { marca: 'HUECA', sentido: 'SUBTOTAL' })]);
  assert.deepEqual(C.sentidosQueSeVen(['REGISTRADO', 'SUBTOTAL', 'ORIENTATIVA'], [sub]), ['REGISTRADO', 'SUBTOTAL']);
  const ori = carril([punto('a', '2026-11-02', 150), punto('b', '2026-11-03', 152, { marca: 'HUECA', sentido: 'ORIENTATIVA' })]);
  assert.deepEqual(C.sentidosQueSeVen(['REGISTRADO', 'SUBTOTAL', 'ORIENTATIVA'], [ori]), ['REGISTRADO', 'ORIENTATIVA']);
  const analitico = (quality) => ({ pointId: 'p', date: '2026-11-03', dateEnd: null, at: null, value: 1, quality, n: 1, segment: 's1', corrected: false, partialBucket: false, dataClass: null, method: null, planVersionIds: [], coverage: null, missing: [], detail: [] });
  const fuente = (clave) => ({ marca: 'REGISTRADO', fuente: { tipo: 'PROYECCION', clave } });
  // «De más de 10 a 12»: el 10 ya no cae en dos categorías («Hasta 10» y «De 10 a 12»).
  assert.equal(SENTIDO_CORTO.ORIENTATIVA, 'De más de 10 a 12 rep. equivalentes');
  assert.equal(A.puntoDelCarril(analitico('PARTIAL'), fuente('TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE'), () => '').sentido, 'ORIENTATIVA');
  assert.equal(A.puntoDelCarril(analitico('PARTIAL'), fuente('NUTRITION_ENERGY_BY_DAY'), () => '').sentido, 'SUBTOTAL');
  assert.equal(A.puntoDelCarril(analitico('COMPLETE'), fuente('NUTRITION_ENERGY_BY_DAY'), () => '').sentido, undefined);
  const leyenda = readFileSync(join(GRAFICOS, 'marcas.tsx'), 'utf8');
  assert.match(leyenda, /<span className="visualmente-oculto">\{SENTIDO_EN_LA_LEYENDA\[sentido\]\}<\/span>/, 'el lector de pantalla oye el sentido entero');
  for (const t of Object.values(SENTIDO_CORTO)) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA']), [], t);
});

test('TEST-GRV-007 · las versiones, discretas: un tono que alterna, una línea en cada cambio y «v8 · de 4 a 3 repeticiones» si entra (mutación: el bloque gris con «Plan · versión 7»)', () => {
  const bandas = [
    { area: 'ENTRENAMIENTO', desde: '2025-11-16', hasta: '2026-05-16', rotulo: 'v7 · desde el 16/11' },
    { area: 'ENTRENAMIENTO', desde: '2026-05-17', hasta: null, rotulo: 'v8 · desde el 17/5', cambio: 'de 4 a 3 repeticiones' },
  ];
  const ancha = E.escalaDeFechas(periodo('2026-01-01', '2026-12-31'), { izquierda: 0, derecha: 1000 });
  const [v7, v8] = V.versionesEnElEje(bandas, ancha);
  assert.equal(v7.conLinea, false, 'el borde izquierdo no es un cambio');
  assert.equal(v7.tenue, false);
  assert.equal(v7.texto, 'v7');
  assert.equal(v8.conLinea, true);
  assert.equal(v8.tenue, true);
  assert.equal(v8.texto, 'v8 · de 4 a 3 repeticiones');
  assert.equal(v8.conCambio, true);
  const angosta = E.escalaDeFechas(periodo('2026-01-01', '2026-12-31'), { izquierda: 0, derecha: 200 });
  assert.equal(V.versionesEnElEje(bandas, angosta)[1].texto, 'v8', 'sin lugar, solo la versión');
  const minima = E.escalaDeFechas(periodo('2026-01-01', '2026-12-31'), { izquierda: 0, derecha: 12 });
  assert.equal(V.versionesEnElEje(bandas, minima)[1].texto, null, 'sin lugar para nada, nada');
});

test('TEST-GRV-008 · «Cómo leerlo» es un desplegable accesible y cerrado, con el nombre de su gráfico; las notas y la frase fija quedan a la vista y la tabla no parte un valor (mutación: esconder la frase o una nota)', () => {
  const como = readFileSync(join(GRAFICOS, 'como-leerlo.tsx'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(como, /<details className=\{\['grafico-base__como-leerlo'/);
  // Sin `title` (algunos lectores lo leían dos veces); con solo la «i», el lector oye su nombre y de qué gráfico es.
  assert.match(como, /<summary>\n\s*<Icono nombre="info" tamano=\{15\} \/>/);
  assert.match(como, /\{soloIcono \? <span className="visualmente-oculto">\{titulo\}<\/span> : titulo\}/);
  assert.match(como, /\{de \? <span className="visualmente-oculto">\{`: \$\{de\}`\}<\/span> : null\}/);
  assert.doesNotMatch(como, /<details[^>]*\bopen\b/, 'cerrado de entrada');
  const paneles = readFileSync(join(GRAFICOS, 'paneles-alineados.tsx'), 'utf8').replace(/\r\n/g, '\n');
  // Todas las notas, a la vista y antes del pie (`notasALaVista`, que prueba TEST-GRV-018); a «Cómo leerlo», las aclaraciones.
  const notas = paneles.indexOf('{visiblesAbajo.map((n) =>');
  const pie = paneles.indexOf('<ComoLeerlo de={titulo}>');
  assert.ok(notas > 0 && pie > notas, 'las notas van afuera de «Cómo leerlo»');
  assert.match(paneles, /const visiblesAbajo = notasALaVista\(\{ notas, tarde, fueraDeLaEscala, cambiosRecortados \}\);/);
  assert.match(paneles, /esLaFraseFija\(n\) \? \(\n\s*<FraseDeLaCoincidencia key=\{n\} texto=\{n\} \/>/);
  assert.match(paneles, /<ComoLeerlo de=\{titulo\}>\n\s*\{aclaraciones\.map/);
  // La leyenda, con las fichas de lo que no es un punto (la tira, la línea cortada: rama B), arriba del gráfico.
  const leyenda = paneles.indexOf('<Leyenda sentidos={visibles} fichas={fichas} />');
  assert.ok(leyenda > 0 && leyenda < paneles.indexOf('className="grafico-base__area"'), 'la leyenda va arriba del gráfico');
  assert.match(paneles, /return carriles <= 1 \? 240 : 140;/, 'un gráfico principal de 240 px');
  const css = readFileSync(join(GRAFICOS, 'estilos', 'base.css'), 'utf8');
  assert.match(css, /\.grafico-base__tabla td \{[^}]*white-space: nowrap;/);
  assert.match(css, /\.grafico-base__tabla table \{[^}]*font-variant-numeric: tabular-nums;/);
  assert.match(css, /\.grafico-base__como-leerlo > summary:focus-visible \{/);
});

test('TEST-GRV-009 · GR-24: la diferencia dice lo que cambió en lo indicado, Nutrición va por semana, la frase fija al pie y «Cómo leerlo» último (mutación: el peine de los días; el desplegable que salta antes de la frase)', () => {
  const etapas = readFileSync(join(WEB, 'src/app/pro/advisees/seguimiento/etapas.tsx'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(etapas, /return diferenciaDeLoIndicado\(enLaEtapa\(a\), enLaEtapa\(b\), medida\);/);
  assert.match(etapas, /o\.comparacion\.planId === e\.planVersionId/, 'lo indicado de cada etapa es el de la versión que ejecutó cada sesión');
  // Rama D (GR-VC13 y GR-VC12): de entrada por semana con más de seis semanas y alguna media (`porSemanaDeEntrada`, que usa
  // `convienePorSemana`); lo elegido a mano manda hasta que cambian las etapas.
  assert.match(etapas, /const porSemana = porSemanaElegido \?\? porSemanaDeEntrada\(leido\.desde, leido\.hasta, \[\.\.\.semanasDe\.values\(\)\]\);/);
  // Con otras etapas sin volver a montar la comparación, el modo vuelve al que conviene para el período nuevo.
  assert.match(etapas, /useEffect\(\(\) => setPorSemana\(null\), \[leido\.desde, leido\.hasta\]\);/);
  assert.match(etapas, /\{semanal \? \(\n\s*<MinigraficoPorSemana/);
  assert.match(etapas, /data-dia-por-dia/);
  const analizar = readFileSync(join(WEB, 'src/app/pro/advisees/seguimiento/analizar.tsx'), 'utf8').replace(/\r\n/g, '\n');
  const pie = analizar.slice(analizar.indexOf('<div className="pie-de-etapas">'), analizar.indexOf('debajo={', analizar.indexOf('<div className="pie-de-etapas">')));
  assert.match(pie, /<FraseDeLaCoincidencia \/>/);
  assert.match(pie, /<ComoLeerlo className="pie-de-etapas__como-leerlo">\n\s*<p>\{laPregunta\.limite\}<\/p>/);
  assert.ok(pie.indexOf('<FraseDeLaCoincidencia />') < pie.indexOf('<ComoLeerlo'), '«Cómo leerlo» va último: abierto, no cambia de lugar en el orden del foco');
  assert.doesNotMatch(pie, /no indica causa/);
  const css = readFileSync(join(WEB, 'src/app/globals.css'), 'utf8').replace(/\r\n/g, '\n');
  const regla = css.slice(css.indexOf('.pie-de-etapas__como-leerlo[open] {')).split('}')[0];
  assert.doesNotMatch(regla, /order:/, 'sin `order` que lo mueva al abrirse');
});

// ─── Revisión del 15/11 (pasada visual): §5 manda sobre la guía visual ─────────────────────────────

test('TEST-GRV-013 · GR-24 por semana: cada media dice a la vista con qué días se hizo, cuántos subtotales, qué quedó afuera y por qué, y la barra llena llega a 3:1 (mutación: contar los subtotales en silencio; el «5 de 7 días» solo en un globo)', () => {
  const S2 = S;
  // Una semana con un subtotal, un día con registros sin este valor y uno sin registros.
  const dias = [
    { fecha: '2026-11-02', valor: 2000 },
    { fecha: '2026-11-03', valor: 1500, parcial: true },
    { fecha: '2026-11-04', valor: null, conRegistros: true },
    { fecha: '2026-11-05', valor: 1900 },
    { fecha: '2026-11-06', valor: 2100 },
    { fecha: '2026-11-08', valor: 1800 },
  ];
  const [semana] = S2.semanasDeLosDias(dias, '2026-11-02', '2026-11-08', '2026-11-20');
  assert.deepEqual([semana.conDato, semana.subtotales, semana.sinValor, semana.sinRegistros, semana.hueca], [5, 1, 1, 1, true]);
  assert.equal(S2.lecturaDeLaSemana(semana, 'kcal'), 'Semana del 2 nov: 1.860 kcal, media de 5 de 7 días (1 subtotal); fuera de la media: 1 día sin registros, 1 día con registros sin este valor');
  // Hoy: fuera de la media, dicho. Una semana cuyo único dato es hoy no tiene media y lo dice (no «sin días con dato» con
  // un punto encima): el punto de hoy no se dibuja.
  const soloHoy = S2.semanasDeLosDias([{ fecha: '2026-11-16', valor: 2300 }], '2026-11-16', '2026-11-16', '2026-11-16');
  assert.equal(S2.lecturaDeLaSemana(soloHoy[0], 'kcal'), 'El 16 nov: ningún día con valor; fuera de la media: hoy, que sigue en curso (entra cuando termine)');
  const g = S2.geometriaPorSemana({ dias: [{ fecha: '2026-11-16', valor: 2300 }], desde: '2026-11-16', hasta: '2026-11-16', hoy: '2026-11-16', ancho: 300, alto: 132 });
  assert.equal(g.dias.length, 0, 'hoy no se dibuja como un punto sobre una semana sin media');
  assert.deepEqual(g.tira.map((t) => t.estado), ['hoy']);
  // El día que la API marca en curso (`partialBucket`) cuenta como hoy, aunque el navegador ya esté en otro día.
  const enCurso = S2.semanasDeLosDias([{ fecha: '2026-11-09', valor: 2000 }, { fecha: '2026-11-10', valor: 600, enCurso: true }], '2026-11-09', '2026-11-10', '2026-11-11');
  assert.equal(enCurso[0].valor, 2000);
  // La tira dice el estado de cada día: con valor, con algo que falta (subtotal o sin este valor), sin registros.
  const tira = S2.geometriaPorSemana({ dias, desde: '2026-11-02', hasta: '2026-11-08', hoy: '2026-11-20', ancho: 300, alto: 132 }).tira.map((t) => t.estado);
  assert.deepEqual(tira, ['con', 'hueco', 'hueco', 'con', 'con', 'sin', 'con']);
  // El nombre para el lector, sin primero contra último (§5.12); cada media, en la tabla de las semanas.
  const resumen = S2.resumenDeLasSemanas([semana], 'kcal');
  assert.doesNotMatch(resumen, /primer|últim/);
  assert.match(resumen, /1 tramo con media, de 1\.860 kcal; 0 con todos sus días con valor/);
  for (const t of [S2.lecturaDeLaSemana(semana, 'kcal'), resumen]) assert.deepEqual(terminosProhibidosEnUnGrafico(t, ['NUTRICION']), [], t);
  // El componente: la lectura a la vista y viva, el foco con flechas, la tabla de las semanas, la columna vacía de todo el
  // alto (no una raya sobre el cero) y el glifo de barra en el título.
  const pieza = readFileSync(join(GRAFICOS, 'minigrafico-por-semana.tsx'), 'utf8').replace(/\r\n/g, '\n');
  assert.match(pieza, /tabIndex=\{0\}\n\s*role="group"/);
  assert.match(pieza, /aria-live="polite" data-lectura-de-la-semana>\n\s*\{semanaElegida \? lecturaDeLaSemana\(semanaElegida, unidad\) : null\}/);
  assert.match(pieza, /<div className="visualmente-oculto">\n\s*<table data-tabla-de-las-semanas>/,'la tabla, oculta en un div (rama D: la tabla sola desbordaba la página a lo ancho)');
  assert.match(pieza, /className="minigrafico-por-semana__vacia" x=\{b\.x\} y=\{g\.caja\.arriba\} width=\{b\.ancho\} height=\{g\.caja\.abajo - g\.caja\.arriba\}/);
  assert.doesNotMatch(pieza, /<title>/, 'nada solo en el globo nativo');
  const etapas = readFileSync(join(WEB, 'src/app/pro/advisees/seguimiento/etapas.tsx'), 'utf8');
  assert.match(etapas, /\{semanal \? <MarcaDeBarra indice=\{indice\} \/> : <Marca indice=\{indice\} \/>\}/);
  // Rama D (GR-VC13): la leyenda, una vez, con las marcas que se ven y la regla de la media de GR-12; los días, con lo que BE
  // sabe de cada uno (un subtotal va a media altura en la tira), y las semanas, las de GR-12.
  assert.match(etapas, /<LeyendaPorSemana que=\{marcasPorSemanaQueSeVen\(\[\.\.\.semanasDe\.values\(\)\]\.flat\(\)\)\} comoSeArma=\{COPY_DE_LOS_CRUCES\.porSemana\.comoSeArma\} \/>/);
  assert.match(etapas, /dias=\{diasDeLaSerieDeNutricion\(s\.estado\.observaciones\.points\)\}\n\s*semanas=\{semanas \?\? undefined\}/);
  // Contraste (DISENO-VISUAL §1, principio 10): la barra llena a 3:1 contra la superficie y contra la hueca, y los puntos
  // de los días a 3:1 contra la superficie, en Claro y en Azul noche, con cada color de métrica.
  const css = readFileSync(join(WEB, 'src/app/tokens.css'), 'utf8');
  const bloque = (selector) => css.slice(css.indexOf(selector), css.indexOf('\n}', css.indexOf(selector)));
  const valor = (texto, token) => texto.match(new RegExp(`\\s${token}:\\s*(#[0-9a-fA-F]{6})`))[1];
  const mezcla = (color, alfa, fondo) =>
    `#${[1, 3, 5].map((i) => Math.round(parseInt(color.slice(i, i + 2), 16) * alfa + parseInt(fondo.slice(i, i + 2), 16) * (1 - alfa)).toString(16).padStart(2, '0')).join('')}`;
  for (const selector of [':root {', "[data-tema='azul-noche'] {"]) {
    const b = bloque(selector);
    const superficie = valor(b, '--superficie');
    for (const token of ['--metrica-1', '--metrica-2', '--metrica-3']) {
      const llena = mezcla(valor(b, token), S2.RELLENO_ENTERA, superficie);
      const hueca = mezcla(valor(b, token), S2.RELLENO_HUECA, superficie);
      assert.ok(contraste(llena, superficie) >= 3, `${token} lleno en ${selector}: ${contraste(llena, superficie).toFixed(2)}:1`);
      assert.ok(contraste(llena, hueca) >= 3, `${token} llena contra hueca en ${selector}: ${contraste(llena, hueca).toFixed(2)}:1`);
      const dia = mezcla(valor(b, token), S2.OPACIDAD_DE_LOS_DIAS, superficie);
      assert.ok(contraste(dia, superficie) >= 3, `${token}, los días, en ${selector}: ${contraste(dia, superficie).toFixed(2)}:1`);
    }
  }
});

test('TEST-GRV-014 · GR-24 por semana: ninguna barra mezcla días de A con días de B; la semana del cambio se parte en dos tramos (mutación: agrupar de lunes a domingo sin mirar las etapas)', () => {
  // B se activa un miércoles (4 nov): la semana del 2 nov son dos tramos, uno de cada lado de la línea.
  const etapas = [
    { desde: '2026-10-01', hasta: '2026-11-03', rotulo: 'A' },
    { desde: '2026-11-04', hasta: '2026-11-30', rotulo: 'B' },
  ];
  const dias = [];
  for (let d = 26; d <= 31; d++) dias.push({ fecha: `2026-10-${d}`, valor: 2000 });
  for (let d = 1; d <= 15; d++) dias.push({ fecha: `2026-11-${String(d).padStart(2, '0')}`, valor: d <= 3 ? 2000 : 2400 });
  const cortes = S.cortesDeLasEtapas(etapas).filter((f) => f > '2026-10-26' && f <= '2026-11-15');
  const tramos = S.semanasDeLosDias(dias, '2026-10-26', '2026-11-15', '2026-11-20', cortes);
  assert.deepEqual(
    tramos.map((t) => [S.cuandoEsLaSemana(t), t.valor, t.dias]),
    [
      ['Semana del 26 oct', 2000, 7],
      ['Del 2 al 3 nov', 2000, 2],
      ['Del 4 al 8 nov', 2400, 5],
      ['Semana del 9 nov', 2400, 7],
    ],
  );
  assert.ok(tramos.filter((t) => t.cortada).every((t) => t.hueca), 'un tramo cortado no va lleno');
  // En el dibujo: ninguna barra cruza la línea del cambio.
  const g = S.geometriaPorSemana({ dias, desde: '2026-10-26', hasta: '2026-11-15', hoy: '2026-11-20', ancho: 600, alto: 132, bandas: etapas });
  const linea = g.bandas[1].x;
  assert.ok(g.barras.every((b) => b.x + b.ancho <= linea || b.x >= linea), 'cada barra queda de un lado de la línea A|B');
  // A y B no contiguas: lo de en medio es su propio tramo, ni de A ni de B.
  const separadas = S.cortesDeLasEtapas([
    { desde: '2026-10-01', hasta: '2026-11-03' },
    { desde: '2026-11-06', hasta: '2026-11-30' },
  ]);
  assert.deepEqual(separadas, ['2026-10-01', '2026-11-04', '2026-11-06', '2026-12-01']);
  // Los meses del eje con «sept», como el dominio (`la-vez-pasada.ts`): una fecha se lee igual en GR-01 y en GR-04.
  assert.equal(E.textoDelEje('2026-09-09', false), '9 sept');
  assert.equal(E.diaYMes('2026-09-09', '2026-11-15'), '9 sept');
  // Las fechas del pie se miden por su texto: «15 nov 2025» no queda pegada a «2 mar».
  const largo = S.geometriaPorSemana({
    dias: [],
    desde: '2025-11-15',
    hasta: '2026-11-14',
    hoy: '2026-11-15',
    ancho: 520,
    alto: 132,
    fechas: ['2025-11-15', '2025-12-01', '2026-03-02', '2026-11-14'],
    textoDeLaFecha: (f) => E.diaYMes(f, '2026-11-15'),
  });
  const marcas = largo.fechas.map((f) => ({ ...f, ancho: E.diaYMes(f.fecha, '2026-11-15').length * 7 }));
  for (let i = 1; i < marcas.length; i++) {
    const a = marcas[i - 1];
    const b = marcas[i];
    const finA = a.ancla === 'start' ? a.x + a.ancho : a.ancla === 'end' ? a.x : a.x + a.ancho / 2;
    const inicioB = b.ancla === 'start' ? b.x : b.ancla === 'end' ? b.x - b.ancho : b.x - b.ancho / 2;
    assert.ok(inicioB - finA >= 8, `${a.fecha} y ${b.fecha} no se pegan (${(inicioB - finA).toFixed(1)} px)`);
  }
});

test('TEST-GRV-015 · los ejes, sin números repetidos en rangos chicos y sin marcas del medio que pidan decimales que el canal no tiene (mutación: cortar los decimales en 2; volver a la marca 80,5 entre 80 y 81)', () => {
  for (const [min, max] of [
    [0.49, 0.5],
    [0.85, 0.87],
    [1.5, 1.52],
  ]) {
    const m = J.marcasRedondas(min, max);
    const textos = m.valores.map((v) => J.textoDeLaMarcaDelEje(v, m.decimales));
    assert.equal(new Set(textos).size, textos.length, `${min} a ${max}: ${textos.join(' / ')}`);
    assert.ok(m.valores.length >= J.MARCAS_MINIMAS && m.valores.length <= J.MARCAS_MAXIMAS);
  }
  assert.deepEqual(J.marcasRedondas(0.49, 0.5).valores, [0.49, 0.495, 0.5]);
  // Las del medio del gráfico chico: solo en la grilla de los extremos y con sus decimales.
  assert.deepEqual(J.marcasDelMedio(80, 81, 0), [], '«80,5» entre «80» y «81» no entra en el canal: ninguna');
  assert.deepEqual(J.marcasDelMedio(3, 8, 0, { enteros: true }), [], '3, 4, 6, 8 sería una grilla despareja: ninguna');
  assert.deepEqual(J.marcasDelMedio(1800, 2400, 0), [2000, 2200]);
  assert.deepEqual(J.marcasDelMedio(80, 82, 1), [80.5, 81, 81.5], 'con un decimal en los extremos, las del medio pueden llevarlo');
  const mini = readFileSync(join(WEB, 'src/app/pro/advisees/seguimiento/minigrafico.tsx'), 'utf8');
  assert.match(mini, /marcasDelMedio\(base\.valor, tope\.valor, decimales, \{ enteros: escalaDeLaUnidad\(serie\.unit\)\.enteros \}\)/);
});

test('TEST-GRV-016 · el cambio de lo indicado es contra la versión inmediata anterior y cada sesión cuenta en la versión que la ejecutó (mutación: comparar con la última versión con sesiones; asignar por fecha)', () => {
  const rx = (id, reps) => prescripcion(id, [{ value: reps }]);
  const v6 = rx('rx-6', 4);
  const v7 = rx('rx-7', 5);
  const v8 = rx('rx-8', 3);
  const versiones = [
    { clave: 'v6', desde: '2026-10-01', hasta: '2026-11-09', planVersionId: 'tv6' },
    { clave: 'v7', desde: '2026-11-09', hasta: '2026-11-16', planVersionId: 'tv7' },
    { clave: 'v8', desde: '2026-11-16', hasta: null, planVersionId: 'tv8' },
  ];
  const cambios = (sesiones) => [...L.cambiosPorVersion(observacionesDelEjercicio(sesiones, 'e:ej-banca', sesiones, new Map()), versiones).entries()];
  const s6 = sesion({ id: 's6', fecha: '2026-11-02', planId: 'tv6', rx: v6, series: [serieRegistrada(1, 60, 4, 1)] });
  const s8 = sesion({ id: 's8', fecha: '2026-11-18', planId: 'tv8', rx: v8, series: [serieRegistrada(1, 65, 3, 1)] });
  // La v7 (5 repeticiones) no tiene sesiones: no se sabe qué indicaba, y la v8 no lleva un «de 4 a 3» que no ocurrió.
  assert.deepEqual(cambios([s6, s8]), []);
  const s7 = sesion({ id: 's7', fecha: '2026-11-10', planId: 'tv7', rx: v7, series: [serieRegistrada(1, 62.5, 5, 1)] });
  assert.deepEqual(cambios([s6, s7, s8]), [
    ['v7', 'de 4 a 5 repeticiones'],
    ['v8', 'de 5 a 3 repeticiones'],
  ]);
  // Una sesión del día del cambio hecha con la v7 cuenta en la v7, no en la v8 (REG-06-105).
  const s7b = sesion({ id: 's7b', fecha: '2026-11-16', planId: 'tv7', rx: v7, series: [serieRegistrada(1, 62.5, 5, 1)] });
  assert.deepEqual(cambios([s6, s7, s7b, s8]), [
    ['v7', 'de 4 a 5 repeticiones'],
    ['v8', 'de 5 a 3 repeticiones'],
  ]);
  // Sin `planVersionId`, por la fecha (como antes): la del día del cambio cae en la v8 y la mezcla.
  const porFecha = L.cambiosPorVersion(
    observacionesDelEjercicio([s6, s7, s7b, s8], 'e:ej-banca', [s6, s7, s7b, s8], new Map()),
    versiones.map(({ planVersionId, ...v }) => v),
  );
  assert.equal(porFecha.get('v8'), 'de 5 a 3–5 repeticiones');
  const fuerza = readFileSync(join(WEB, 'src/app/pro/advisees/fuerza/fuerza-en-analizar.tsx'), 'utf8');
  assert.match(fuerza, /planVersionId: v\.planVersionId \?\? null/);
});

test('TEST-GRV-017 · el cambio de lo indicado también en texto: en el nombre del gráfico y a la vista si no entra en la línea de su versión (mutación: dejarlo solo en el SVG)', () => {
  const bandas = [
    { area: 'ENTRENAMIENTO', desde: '2025-11-16', hasta: '2026-05-16', rotulo: 'v7 · desde el 16/11' },
    { area: 'ENTRENAMIENTO', desde: '2026-05-17', hasta: null, rotulo: 'v8 · desde el 17/5', cambio: 'de 4 a 3 repeticiones' },
  ];
  const ancha = V.versionesEnElEje(bandas, E.escalaDeFechas(periodo('2026-01-01', '2026-12-31'), { izquierda: 0, derecha: 1000 }));
  const angosta = V.versionesEnElEje(bandas, E.escalaDeFechas(periodo('2026-01-01', '2026-12-31'), { izquierda: 0, derecha: 200 }));
  assert.deepEqual(V.cambiosEnTexto(ancha, '2026-12-31'), ['v8, desde el 17 may: de 4 a 3 repeticiones']);
  assert.deepEqual(V.cambiosQueNoEntran(ancha, '2026-12-31'), [], 'si entra en su línea, no se repite abajo');
  assert.deepEqual(V.cambiosEnTexto(angosta, '2026-12-31'), ['v8, desde el 17 may: de 4 a 3 repeticiones']);
  assert.deepEqual(V.cambiosQueNoEntran(angosta, '2026-12-31'), ['v8, desde el 17 may: de 4 a 3 repeticiones'], 'si no entra, se dice a la vista');
  assert.equal(COPY_DE_LOS_GRAFICOS.cambiosDeLoIndicado(V.cambiosEnTexto(angosta, '2026-12-31')), 'Lo indicado cambió: v8, desde el 17 may: de 4 a 3 repeticiones.');
  const paneles = readFileSync(join(GRAFICOS, 'paneles-alineados.tsx'), 'utf8');
  assert.match(paneles, /\.\.\.\(cambios\.length > 0 \? \[COPY_DE_LOS_GRAFICOS\.cambiosDeLoIndicado\(cambios\)\] : \[\]\),/, 'en la descripción que oye el lector');
});

test('TEST-GRV-018 · la base: todas las notas a la vista, el método con un solo carril, los extremos de lo lleno, «Lo último» de cada carril y la región viva sin el mouse (mutación: llevar una nota a «Cómo leerlo»; rotular un subtotal como el mínimo; leer una sola fecha)', async () => {
  const N = await import('../src/app/pro/advisees/graficos/notas-del-grafico.ts');
  const frase = `${FRASE_DE_LA_COINCIDENCIA} Ventana: 4 semanas.`;
  const notas = N.notasALaVista({
    notas: ['Se leyó en tramos de 92 días.', frase, 'Media de 5 de 7 días.'],
    tarde: ['3 de 21 días cargados después'],
    fueraDeLaEscala: 2,
    cambiosRecortados: ['v8, desde el 17 may: de 4 a 3 repeticiones'],
  });
  assert.deepEqual(notas, [
    'Se leyó en tramos de 92 días.',
    frase,
    'Media de 5 de 7 días.',
    '3 de 21 días cargados después.',
    '2 valores no entran en la escala: llevan una muesca.',
    'Lo indicado cambió: v8, desde el 17 may: de 4 a 3 repeticiones.',
  ]);
  assert.equal(N.esLaFraseFija(frase), true, 'la frase fija con algo agregado sigue siendo la frase fija');
  assert.equal(N.esLaFraseFija('Se leyó en tramos de 92 días.'), false);
  // El método, a la vista con un solo carril, aunque el llamador pase su línea; sin repetirlo si ya está.
  assert.equal(N.lineaTenueDelGrafico({ detalle: '% · del 3 nov a hoy', porDefecto: 'x', metodo: 'Durnin y Womersley' }), '% · del 3 nov a hoy · Durnin y Womersley');
  assert.equal(N.lineaTenueDelGrafico({ detalle: '% · Durnin y Womersley', porDefecto: 'x', metodo: 'Durnin y Womersley' }), '% · Durnin y Womersley');
  assert.equal(N.lineaTenueDelGrafico({ detalle: undefined, porDefecto: 'kg · del 3 nov a hoy', metodo: null }), 'kg · del 3 nov a hoy');
  // Los extremos rotulados son de lo registrado lleno: el subtotal de 900 kcal no es «el mínimo del período».
  const puntos = [
    { clave: 'a', valor: 2000, marca: 'LLENA' },
    { clave: 'b', valor: 900, marca: 'HUECA' },
    { clave: 'c', valor: 2100, marca: 'LLENA' },
    { clave: 'd', valor: 1950, marca: 'LLENA' },
    { clave: 'e', valor: 2050, marca: 'LLENA' },
    { clave: 'f', valor: 2400, marca: 'HUECA_GRIS' },
  ];
  assert.deepEqual(J.rotulosDeLoLleno(puntos, null), { claves: ['f', 'c', 'd'], minimo: 'd' }, 'el último siempre; el máximo y el mínimo, de lo lleno');
  assert.deepEqual(J.rotulosDeLoLleno(puntos, 'b'), { claves: ['b', 'f', 'c', 'd'], minimo: 'd' }, 'el elegido, aunque sea un subtotal');
  // «Lo último» es lo último registrado de cada carril, con su fecha; lo indicado solo no cuenta.
  const peso = carril([punto('p1', '2026-11-02', 80, { lectura: '80 kg' }), punto('p2', '2026-11-10', 79.5, { lectura: '79,5 kg' })], { id: 'peso', nombre: 'Peso' });
  const kcal = carril([punto('c1', '2026-11-14', 2150, { lectura: '2.150 kcal' })], {
    id: 'kcal',
    nombre: 'Calorías',
    unidad: 'kcal',
    indicado: [punto('i1', '2026-11-15', 2300, { marca: 'HUECA', lectura: '2.300 kcal' })],
  });
  assert.deepEqual(T.loUltimoDeCadaCarril(T.tablaEquivalente([peso, kcal])), [
    { nombre: 'Peso', texto: '79,5 kg', fecha: '2026-11-10' },
    { nombre: 'Calorías', texto: '2.150 kcal', fecha: '2026-11-14' },
  ]);
  assert.deepEqual(T.loUltimoDeCadaCarril(T.tablaEquivalente([carril([punto('x', '2026-11-02', null)], { nombre: 'Pliegues' })])), [{ nombre: 'Pliegues', texto: T.TEXTO_SIN_DATO, fecha: null }]);
  // La región viva cambia con el clic, el toque o el teclado; lo de abajo del mouse va en un renglón que el lector no oye.
  const paneles = readFileSync(join(GRAFICOS, 'paneles-alineados.tsx'), 'utf8');
  assert.match(paneles, /<LecturaEnLaFecha tabla=\{tabla\} fecha=\{cursor\.fecha\} encima=\{encima\} tramo=\{cursor\.tramo\} hoy=\{periodo\.hoy\} \/>/);
  const lectura = readFileSync(join(GRAFICOS, 'lectura-en-la-fecha.tsx'), 'utf8');
  assert.match(lectura, /aria-live="polite" data-lectura-viva>/);
  assert.match(lectura, /<div className="grafico-base__lectura" aria-hidden="true" data-lectura-bajo-el-mouse>/);
  assert.match(lectura, /const vivo = fecha === null \? <LineaDeLoUltimo tabla=\{tabla\} hoy=\{hoy\} \/>/);
  // Una semana sin datos en un carril de barras: una columna de todo el alto, no una raya sobre el cero.
  assert.match(paneles, /className="grafico-base__semana-vacia" x=\{b\.x1 \+ 1\} y=\{0\} width=\{Math\.max\(1, b\.x2 - b\.x1 - 2\)\} height=\{b\.base\}/);
});

test('TEST-GRV-019 · GR-24: la descripción de cada gráfico chico para el lector, sin «la primera…; la última…» (mutación: volver a `resumenTextual`)', async () => {
  const { resumenSinPrimeroNiUltimo } = await import('../src/app/pro/advisees/seguimiento/resumen-del-grafico-chico.ts');
  const p = (date, value, quality = 'COMPLETE') => ({ pointId: date, date, dateEnd: null, value, quality, partialBucket: false, segment: 's1', dataClass: null, coverage: null, detail: [] });
  const serie = { label: 'Calorías registradas', unit: 'kcal', grain: 'DAY', points: [p('2026-11-02', 2000), p('2026-11-03', 1500, 'PARTIAL'), p('2026-11-04', null, 'UNKNOWN'), p('2026-11-05', 2100)] };
  const texto = resumenSinPrimeroNiUltimo(serie, { decimales: 0 }, '2026-11-02', '2026-11-08');
  assert.doesNotMatch(texto, /la primera|la última/);
  assert.match(texto, /^Calorías registradas \(kcal\), del .*: 3 observaciones con valor; 1 es un subtotal de lo registrado; 1 sin valor conocido\.$/);
  assert.equal(resumenSinPrimeroNiUltimo({ ...serie, points: [] }, { decimales: 0 }, '2026-11-02', '2026-11-08').endsWith('no hay datos en este período.'), true);
  const etapas = readFileSync(join(WEB, 'src/app/pro/advisees/seguimiento/etapas.tsx'), 'utf8');
  assert.doesNotMatch(etapas, /resumenTextual\(/);
});

test('TEST-GRV-020 · GR-01: «Ver las N anteriores» cuenta todas las veces de los 91 días leídos y la unidad es una sola para toda la lista (mutación: armar doce; sacar la unidad de las que se ven)', async () => {
  const V2 = await import('../src/app/pro/advisees/training/lista-de-la-vez-pasada.ts');
  const { vecesPasadas, VECES_EN_EL_EDITOR, textoDeLaSerie } = await import('@be/domain');
  // Dos veces por semana durante 13 semanas: 26 veces en los 91 días.
  const rx = prescripcion('rx-banca', [{ value: 8 }]);
  const sesiones = [];
  for (let i = 0; i < 26; i++) {
    const dia = new Date(Date.UTC(2026, 7, 17 + Math.floor(i / 2) * 7 + (i % 2) * 3, 12)).toISOString().slice(0, 10);
    sesiones.push(sesion({ id: `v-${String(i).padStart(2, '0')}`, fecha: dia, planId: 'tv1', rx, series: [serieRegistrada(1, 60 + i, 8, 2)] }));
  }
  const veces = vecesPasadas(sesiones, 'ej-banca', { cuantas: V2.TODAS_LAS_VECES });
  assert.equal(veces.length, 26, 'todas las veces de lo leído, no doce');
  assert.equal(veces[veces.length - 1].fecha, sesiones[0].date, 'abierta, la lista llega hasta la vez más vieja de lo leído');
  assert.equal(V2.anterioresQueQuedan(veces, VECES_EN_EL_EDITOR), 23, '«Ver las 23 anteriores», no «9»');
  // La unidad: las tres últimas sin carga (dominadas sin lastre) y una vieja con 10 kg. Arriba y en las fichas, la misma.
  const sinCarga = (id, fecha) => sesion({ id, fecha, planId: 'tv1', rx, series: [{ setIndex: 1, load: null, completedRepetitions: 8, rir: 2, perceivedExertion: null }] });
  const mezcla = [
    sesion({ id: 'm-1', fecha: '2026-11-02', planId: 'tv1', rx, series: [serieRegistrada(1, 10, 8, 1)] }),
    sinCarga('m-2', '2026-11-04'),
    sinCarga('m-3', '2026-11-06'),
    sinCarga('m-4', '2026-11-09'),
  ];
  const lista = vecesPasadas(mezcla, 'ej-banca', { cuantas: V2.TODAS_LAS_VECES });
  assert.equal(V2.unidadComun(lista), 'kg', 'la unidad de todas las veces, no de las tres que se ven');
  assert.equal(V2.unidadComun(lista.slice(0, VECES_EN_EL_EDITOR)), null, 'con solo las que se ven no habría unidad: era el error');
  const vieja = lista[lista.length - 1].como.series[0];
  assert.equal(V2.textoDeLaFicha(vieja, V2.unidadComun(lista)), textoDeLaSerie(vieja).replace(' kg ×', ' ×'));
  assert.match(V2.textoDeLaFicha(vieja, null), / kg × /, 'sin una unidad arriba, la ficha la dice');
});
