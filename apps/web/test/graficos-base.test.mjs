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
import { EjecucionDeEntrenamientoSchema, EntradaDeLineaDeTiempoSchema, terminosProhibidosEnUnGrafico } from '@be/domain';

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
const { COPY_DE_LOS_GRAFICOS, SENTIDO_EN_LA_LEYENDA } = await import('../src/app/pro/advisees/graficos/copy.ts');
const A = await import('../src/app/pro/advisees/graficos/adaptadores.ts');
const K = await import('../src/app/pro/advisees/graficos/cinta-del-tiempo.ts');

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
  assert.equal(C.lineaDeLoCargadoTarde(energia), '1 de 2 días cargados después');
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
  const nombres = ['adaptadores', 'carriles', 'cinta-del-tiempo', 'copy', 'eje-de-fechas', 'lecturas', 'medidas-del-grafico', 'registro-de-graficos', 'registros', 'tabla-equivalente'];
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
