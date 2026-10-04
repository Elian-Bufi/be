/**
 * «Mi evolución» de la APK: el selector de tomas, el mapa corporal y los indicadores (DL-117; cierre del 2026-10-04).
 * Las reglas de las tomas viven en @be/domain (`tomasDelPeriodo`, `tomaDe`, `valoresPorToma`) y tienen sus pruebas allí.
 * Esta prueba cubre lo de la APK, por comportamiento y sin teléfono:
 *  1. Qué hay de cada medida en cada toma (`graficos-por-toma.ts`): un valor de su grupo, otro grupo o nada. Una sola
 *     elección de toma decide el punto resaltado y el grupo con que se lee cada medida.
 *  2. Los gráficos chicos con 1, 3, 6 y 12 tomas: no desbordan ni se superponen, el eje es el orden de las tomas, los
 *     valores iguales van a media altura, un hueco no tiene punto y otro grupo lleva una raya.
 *  3. Sus textos: la lista equivalente, la frase del lector de pantalla y cómo se lee el eje.
 *  4. La pantalla (`disposicion-de-la-toma.ts`): qué abre un pedido de Inicio, cuándo se ve el selector, cuántas columnas
 *     llevan los indicadores y cuándo una toma puede estar incompleta (D-3).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const textos = await import('../apps/mobile/src/textos-por-toma.ts');
const graficos = await import('../apps/mobile/src/graficos-por-toma.ts');
const disposicion = await import('../apps/mobile/src/disposicion-de-la-toma.ts');
const formato = await import('../apps/mobile/src/formato.ts');
const composicion = await import('../apps/mobile/src/composicion-de-la-figura.ts');

// ─── Datos sintéticos, validados contra el esquema estricto de API-ANT-06 ──────────────────────────────────────

const ZONA = 'America/Argentina/Buenos_Aires';
const grupo = (comparabilityGroup, unit, extra = {}) => ({ comparabilityGroup, protocolVersionId: 'perfil', protocolName: 'Perfil antropométrico completo', methodVersionId: null, unit, ...extra });
const G_PESO = grupo('cmp-1', 'kg');
const G_CINTURA = grupo('cmp-2', 'cm');
const G_TRICEPS = grupo('cmp-3', 'mm');
const G_TRICEPS_ISAK = grupo('cmp-4', 'mm', { protocolVersionId: 'isak', protocolName: 'ISAK' });
let n = 0;
const punto = (evaluacion, dia, value, g, hora = '13') => ({
  occurredAt: `${dia}T${hora}:00:00.000Z`,
  recordedAt: `${dia}T${hora}:05:00.000Z`,
  value,
  unit: g.unit,
  sourceEvaluationId: evaluacion,
  sourceId: `origen-${++n}`,
  dataClass: 'MEASURED',
  comparabilityGroup: g.comparabilityGroup,
  correctionState: 'EFFECTIVE',
  incomparableWithPrevious: [],
});
const serie = (metricCode, series, groups) => ({ metricCode, series, gaps: [], comparability: { groups } });
const datos = (metrics) =>
  d.EvolucionResponseSchema.parse({
    data: { adviseeId: 'a', period: { start: '2026-07-01', end: '2026-09-28', timeZone: ZONA }, metrics, partialView: false, honesty: { interpolated: false, imputed: false, carriedForward: false } },
  }).data;

/** Tres tomas: el tríceps de agosto se tomó con otro protocolo, y la cintura no se midió en agosto. */
const TRES = datos([
  serie('peso', [punto('ev-1', '2026-07-20', 82.4, G_PESO), punto('ev-2', '2026-08-25', 80.9, G_PESO), punto('ev-3', '2026-09-24', 80, G_PESO)], [G_PESO]),
  serie('pliegue-triceps', [punto('ev-1', '2026-07-20', 12, G_TRICEPS), punto('ev-2', '2026-08-25', 11, G_TRICEPS_ISAK), punto('ev-3', '2026-09-24', 10, G_TRICEPS)], [G_TRICEPS, G_TRICEPS_ISAK]),
  serie('perimetro-cintura', [punto('ev-1', '2026-07-20', 90, G_CINTURA), punto('ev-3', '2026-09-24', 86.5, G_CINTURA)], [G_CINTURA]),
]);

// ─── 1. Qué hay de cada medida en cada toma ───────────────────────────────────────────────────────────────────

test('cada toma tiene un valor del grupo de la elegida, la medida con otro grupo, o nada; nunca un cero', () => {
  const tomas = d.tomasDelPeriodo(TRES);
  const p = graficos.puntosDeLaToma(TRES, tomas, 'ev-3');
  assert.equal(p.elegida, 2);
  const medidas = graficos.resumenDe(TRES, 'ev-3').medidas;
  const tipos = (metrica) => p.estados(medidas.find((m) => m.metrica === metrica)).map((e) => e.tipo);
  assert.deepEqual(tipos('peso'), ['valor', 'valor', 'valor']);
  assert.deepEqual(tipos('pliegue-triceps'), ['valor', 'otro-grupo', 'valor'], 'el tríceps ISAK de agosto no se compara: es una raya, no un punto');
  assert.deepEqual(tipos('perimetro-cintura'), ['valor', 'sin-dato', 'valor'], 'sin medición en agosto: un hueco');
  const triceps = p.estados(medidas.find((m) => m.metrica === 'pliegue-triceps'));
  assert.equal(triceps[1].observacion.punto.value, 11, 'la raya conserva su valor, para decirlo en la lista');
});

test('una sola elección de toma decide el punto resaltado y el grupo con que se lee cada medida', () => {
  const tomas = d.tomasDelPeriodo(TRES);
  const p = graficos.puntosDeLaToma(TRES, tomas, 'ev-2');
  assert.equal(p.elegida, 1);
  const triceps = graficos.resumenDe(TRES, 'ev-2').medidas.find((m) => m.metrica === 'pliegue-triceps');
  // Elegida la toma ISAK, el gráfico se lee con ese protocolo: las otras dos tomas quedan como otro grupo.
  assert.deepEqual(p.estados(triceps).map((e) => e.tipo), ['otro-grupo', 'valor', 'otro-grupo']);
  // El resumen se calcula una vez por respuesta.
  assert.equal(graficos.resumenDe(TRES, 'ev-2'), graficos.resumenDe(TRES, 'ev-2'));
});

// ─── 2. Los gráficos chicos ───────────────────────────────────────────────────────────────────────────────────

const valor = (v, unit = 'kg') => ({ tipo: 'valor', observacion: { punto: { value: v, unit } } });
const SIN = { tipo: 'sin-dato' };
const OTRO = (v) => ({ tipo: 'otro-grupo', observacion: { punto: { value: v, unit: 'mm' } } });

/** Tomas de prueba con valores, huecos y otro grupo mezclados; la elegida es la última, que siempre tiene valor. */
const mezcla = (cantidad) => Array.from({ length: cantidad }, (_, i) => (i === cantidad - 1 ? valor(80) : i % 4 === 1 ? SIN : i % 4 === 2 ? OTRO(5) : valor(78 + (i % 3))));

test('con 1, 3, 6 y 12 tomas el gráfico no desborda ni superpone puntos, en los anchos y altos de la pantalla', () => {
  for (const cantidad of [1, 3, 6, 12]) {
    for (const ancho of [97, 120, 137, 160, 296]) {
      for (const alto of [18, 24, 26, 40]) {
        const caso = `${cantidad} tomas en ${ancho}×${alto}`;
        const estados = mezcla(cantidad);
        const g = graficos.geometriaDePuntos({ ancho, alto, estados, elegida: cantidad - 1 });
        if (cantidad === 1) {
          assert.equal(g, null, 'una sola toma no dibuja un recorrido: su valor ya está escrito');
          continue;
        }
        for (const p of g.puntos) {
          assert.ok(p.x - p.radio >= 0 && p.x + p.radio <= ancho, `${caso}: un punto se sale por los costados`);
          assert.ok(p.y - p.radio >= 0 && p.y + p.radio <= alto, `${caso}: un punto se sale por arriba o por abajo`);
          assert.ok(p.radio >= 1.5, `${caso}: un punto de ${p.radio} dp ya no se distingue`);
        }
        const porIndice = new Map(g.puntos.map((p) => [p.indice, p]));
        for (let i = 1; i < cantidad; i++) {
          const a = porIndice.get(i - 1);
          const b = porIndice.get(i);
          if (a && b) assert.ok(b.x - a.x >= a.radio + b.radio, `${caso}: los puntos ${i} y ${i + 1} se tocan`);
        }
        for (const m of g.marcas) assert.ok(m.y1 >= 0 && m.y2 <= alto && m.x >= 0 && m.x <= ancho, `${caso}: una raya se sale`);
      }
    }
  }
});

test('el eje es el orden de las tomas: misma distancia entre tomas, aunque entre ellas pasen días distintos', () => {
  const g = graficos.geometriaDePuntos({ ancho: 160, alto: 26, estados: [valor(1), valor(2), valor(3), valor(4), valor(5), valor(6)], elegida: 5 });
  const pasos = g.xs.slice(1).map((x, i) => x - g.xs[i]);
  assert.ok(pasos.every((p) => Math.abs(p - pasos[0]) < 1e-9), 'T1, T2, T3… van a la misma distancia');
  assert.ok(g.xs[0] < g.xs[5], 'T1 a la izquierda y la última a la derecha');
});

test('valores iguales a media altura, un hueco sin punto, otro grupo con una raya y la elegida resaltada', () => {
  const iguales = graficos.geometriaDePuntos({ ancho: 140, alto: 26, estados: [valor(80), valor(80), valor(80)], elegida: 2 });
  assert.equal(new Set(iguales.puntos.map((p) => p.y)).size, 1, 'sin escala que inventar');
  assert.ok(Math.abs(iguales.puntos[0].y - iguales.base.y / 2) < 1e-9, 'a media altura, entre el techo y la base');

  const g = graficos.geometriaDePuntos({ ancho: 140, alto: 26, estados: [valor(12, 'mm'), SIN, OTRO(11), valor(10, 'mm')], elegida: 3 });
  assert.deepEqual(g.puntos.map((p) => p.indice), [0, 3], 'el hueco y el otro grupo no tienen punto');
  assert.deepEqual(g.marcas.map((m) => m.indice), [2], 'otro grupo: una raya');
  assert.ok(g.marcas.every((m) => m.y2 === g.base.y && m.y1 < m.y2), 'la raya sale de la base y es vertical: no une dos tomas');
  assert.ok(Math.abs(g.base.x1 - g.xs[0]) < 1e-9 && Math.abs(g.base.x2 - g.xs.at(-1)) < 1e-9, 'la base es fija: de la primera toma a la última');
  const elegida = g.puntos.find((p) => p.elegida);
  assert.equal(elegida.indice, 3);
  assert.ok(g.puntos.every((p) => p.elegida || p.radio < elegida.radio), 'la elegida es más grande');
  assert.ok(g.puntos.find((p) => p.indice === 0).y < elegida.y, 'el valor más alto va más arriba');
});

test('el gráfico chico se dibuja con puntos y una base, sin trazos que unan tomas', () => {
  // La forma la da la geometría (probada arriba); el componente no agrega ningún trazo libre entre puntos.
  const PUNTOS = readFileSync(resolve(RAIZ, 'apps/mobile/src/pantallas/puntos-por-toma.tsx'), 'utf8');
  const codigo = PUNTOS.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  assert.doesNotMatch(codigo, /<Polyline|<Path|<Polygon/, 'ninguna línea une dos tomas');
  assert.equal((codigo.match(/<Line /g) ?? []).length, 2, 'solo la base y la raya de otro grupo');
  assert.match(codigo, /<Line key=\{`otro-\$\{m\.indice\}`\} x1=\{m\.x\} x2=\{m\.x\}/, 'la raya es vertical, en la x de su toma: no une dos tomas');
});

// ─── 3. Los textos ────────────────────────────────────────────────────────────────────────────────────────────

const tomas = [
  { evaluacionId: 'ev-1', etiqueta: 'T1', fecha: '2026-07-20', instante: 1, metricas: 3 },
  { evaluacionId: 'ev-2', etiqueta: 'T2', fecha: '2026-08-25', instante: 2, metricas: 1 },
  { evaluacionId: 'ev-3', etiqueta: 'T3', fecha: '2026-09-24', instante: 3, metricas: 3 },
];

test('la lista equivalente dice el valor de cada toma, un hueco como «sin dato» y otro grupo como «no comparable»', () => {
  assert.equal(textos.textoPorToma([valor(82.4), SIN, valor(80)], tomas), 'T1 82,4 · T2 sin dato · T3 80 kg');
  assert.equal(textos.textoPorToma([valor(12, 'mm'), OTRO(11), valor(10, 'mm')], tomas), 'T1 12 · T2 no comparable · T3 10 mm');
  assert.equal(textos.textoPorToma([SIN, SIN, SIN], tomas), 'T1 sin dato · T2 sin dato · T3 sin dato');
});

test('para el lector de pantalla, cada toma con su fecha, su valor con unidad, el otro grupo dicho y cuál es la elegida', () => {
  const mes = (f) => formato.fechaCorta(f);
  assert.equal(textos.frasePorToma([valor(82.4), SIN, valor(80)], tomas, 'ev-3', formato.fechaCorta), `T1, ${mes('2026-07-20')}: 82,4 kg; T2, ${mes('2026-08-25')}: sin dato; T3, ${mes('2026-09-24')}: 80 kg (la elegida)`);
  assert.match(textos.frasePorToma([valor(12, 'mm'), OTRO(11), valor(10, 'mm')], tomas, 'ev-3', formato.fechaCorta), /T2, [^:]+: 11 mm, con otro protocolo, método o unidad: no se compara;/);
  assert.match(formato.fechaCorta('2026-07-20'), /^20 jul$/, 'sin año y sin punto');
});

test('las otras tomas del día se nombran como una lista para leer', () => {
  assert.equal(textos.enumerar(['T2']), 'T2');
  assert.equal(textos.enumerar(['T2', 'T3']), 'T2 y T3');
  assert.equal(textos.enumerar(['T2', 'T3', 'T4']), 'T2, T3 y T4');
  assert.equal(textos.enumerar([]), '');
});

test('la pantalla dice que el eje de los gráficos chicos es el orden de las tomas, no el tiempo', () => {
  const sinRaya = textos.comoSeLeenLosPuntos(tomas, false);
  assert.match(sinRaya, /un punto por toma, en orden, de T1 a T3/);
  assert.match(sinRaya, /misma distancia aunque entre dos tomas pasen días distintos/);
  assert.match(sinRaya, /En Evolución, el gráfico de una medida usa las fechas/);
  assert.doesNotMatch(sinRaya, /raya/);
  assert.match(textos.comoSeLeenLosPuntos(tomas, true), /Una raya sobre la base es una toma con esa medida en otro protocolo, método o unidad: no se compara\./);
});

// ─── 4. La pantalla ───────────────────────────────────────────────────────────────────────────────────────────

test('«Ver la toma» desde Inicio abre la última toma en el mapa o en los indicadores; «Ver su evolución», la medida', () => {
  assert.deepEqual(disposicion.eleccionesDelPedido({ vista: 'ultima' }), [
    ['mi-evolucion:vista', 'TOMA'],
    ['mi-evolucion:toma', null],
  ]);
  assert.deepEqual(disposicion.eleccionesDelPedido({ vista: 'evolucion', metrica: 'peso' }), [
    ['mi-evolucion:vista', 'EVOLUCION'],
    ['mi-evolucion:medida', 'peso'],
  ]);
  assert.deepEqual(disposicion.eleccionesDelPedido({}), [], 'sin pedido, manda lo que la persona eligió');
  assert.equal(disposicion.vistaDeLaToma('TOMA', true), 'MAPA');
  assert.equal(disposicion.vistaDeLaToma('TOMA', false), 'INDICADORES', 'una toma sin perímetros ni pliegues abre los indicadores');
  for (const vista of ['MAPA', 'INDICADORES', 'COMPARAR', 'EVOLUCION']) assert.equal(disposicion.vistaDeLaToma(vista, false), vista);
});

test('«Ver su evolución» abre con días que incluyen esa toma, y no achica los que ya alcanzaban', () => {
  // El período termina el 4/10: una toma del 27/9 entra en 30 días; una del 20/7, recién en 90.
  assert.equal(disposicion.diasQueIncluyen('2026-09-27', '2026-10-04', '30'), '30');
  assert.equal(disposicion.diasQueIncluyen('2026-08-24', '2026-10-04', '30'), '60');
  assert.equal(disposicion.diasQueIncluyen('2026-07-20', '2026-10-04', '30'), '90');
  assert.equal(disposicion.diasQueIncluyen('2026-09-27', '2026-10-04', '90'), '90', 'si ya alcanzaban, quedan los que eligió la persona');
  assert.equal(disposicion.diasQueIncluyen('2026-09-05', '2026-10-04', '30'), '30', 'el día 30 entra en 30 días');
  assert.equal(disposicion.diasQueIncluyen('2026-09-04', '2026-10-04', '30'), '60', 'el día 31 ya no');
});

test('el selector de tomas va en las vistas de una toma, con más de una; no en Evolución', () => {
  for (const vista of ['MAPA', 'INDICADORES', 'COMPARAR']) {
    assert.equal(disposicion.seVeElSelectorDeTomas(vista, 3), true, vista);
    assert.equal(disposicion.seVeElSelectorDeTomas(vista, 1), false, `${vista} con una sola toma`);
  }
  assert.equal(disposicion.seVeElSelectorDeTomas('EVOLUCION', 3), false);
});

test('los indicadores van en dos columnas cuando entran, y en una cuando la letra o el ancho lo piden', () => {
  const valorMasLargo = (texto, escala) => disposicion.anchoDelValorEstimado(texto, 22 * escala);
  const columnas = (ancho, escala, texto = '172,5 cm') => disposicion.columnasDeIndicadores({ ancho, escalaDeLetra: escala, anchoDelValorMasLargo: valorMasLargo(texto, escala) });
  // El ancho útil de la pantalla: el del teléfono menos los 20 dp de relleno de cada lado.
  assert.equal(columnas(360 - 40, 1), 2, '360 dp con la letra de siempre');
  assert.equal(columnas(320 - 40, 1), 2, '320 dp con la letra de siempre');
  assert.equal(columnas(360 - 40, 1.15), 2, '360 dp con la letra un poco más grande');
  assert.equal(columnas(360 - 40, 1.3), 1, '360 dp con letra grande');
  assert.equal(columnas(411 - 40, 1.3), 2, '411 dp con letra grande todavía entra');
  assert.equal(columnas(411 - 40, 2), 1, '411 dp con la letra al doble');
  assert.equal(columnas(360 - 40, 1, '1.234,56 kg/m²'), 1, 'un valor que no entra en media pantalla no se parte: una columna');
  // La estimación del valor sale de la tabla medida con Roboto: «25,3 kg/m²» mide 4,94 em, más la holgura.
  const medido = 4.9391 * 22;
  const estimado = disposicion.anchoDelValorEstimado('25,3 kg/m²', 22);
  assert.ok(estimado >= medido && estimado <= medido * 1.08, `${estimado} contra ${medido}`);
});

test('D-3: si otra evaluación cayó el mismo día, la toma puede estar incompleta y la pantalla lo dice', () => {
  // La API muestra una medición por día y por medida: el peso del 24/9 es el de la evaluación de la mañana, y de la de
  // la tarde se ven solo los pliegues, que la de la mañana no tomó.
  const mismoDia = datos([
    serie('peso', [punto('ev-1', '2026-08-25', 80.9, G_PESO), punto('ev-manana', '2026-09-24', 80, G_PESO, '12')], [G_PESO]),
    serie('pliegue-triceps', [punto('ev-tarde', '2026-09-24', 10, G_TRICEPS, '20')], [G_TRICEPS]),
  ]);
  const t = d.tomasDelPeriodo(mismoDia);
  assert.deepEqual(t.map((x) => [x.etiqueta, x.evaluacionId, x.fecha]), [
    ['T1', 'ev-1', '2026-08-25'],
    ['T2', 'ev-manana', '2026-09-24'],
    ['T3', 'ev-tarde', '2026-09-24'],
  ]);
  assert.deepEqual(disposicion.otrasTomasDelDia(t, 'ev-tarde').map((x) => x.etiqueta), ['T2']);
  assert.deepEqual(disposicion.otrasTomasDelDia(t, 'ev-manana').map((x) => x.etiqueta), ['T3']);
  assert.deepEqual(disposicion.otrasTomasDelDia(t, 'ev-1'), [], 'una toma sola en su día no lleva el aviso');
  assert.deepEqual(graficos.resumenDe(mismoDia, 'ev-tarde').medidas.map((m) => m.metrica), ['pliegue-triceps'], 'de la tarde se ve una parte: por eso el aviso');
});
