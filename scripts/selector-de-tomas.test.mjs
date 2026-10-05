/**
 * «Mi evolución» de la APK: el selector de tomas, el mapa corporal, Progreso y los indicadores (DL-117; DL-118).
 * Las reglas de las tomas viven en @be/domain (`tomasDelPeriodo`, `tomaDe`, `valoresPorToma`) y tienen sus pruebas allí.
 * Esta prueba cubre lo de la APK, por comportamiento y sin teléfono:
 *  1. Los textos: la lista para leer de las tomas del aviso de D-3. (Los gráficos chicos por orden de toma, y sus textos,
 *     se retiraron en DL-118: el progreso va sobre fechas reales; sus pruebas se fueron con ellos.)
 *  4. La pantalla (`disposicion-de-la-toma.ts`): cuántas columnas llevan los indicadores y cuándo una toma puede estar
 *     incompleta (D-3).
 *  5. Las tres vistas de DL-118 (Dirección, 2026-10-05): qué vistas hay, cuál se abre y qué toma muestra cada una, las
 *     rutas viejas, Progreso por Torso y Piernas con sus paneles, los bloques de Indicadores y la serie con fechas de
 *     una medida.
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
const disposicion = await import('../apps/mobile/src/disposicion-de-la-toma.ts');
const formato = await import('../apps/mobile/src/formato.ts');
const composicion = await import('../apps/mobile/src/composicion-de-la-figura.ts');
const zonas = await import('../apps/mobile/src/progreso-por-zonas.ts');
const serieDeLaMedida = await import('../apps/mobile/src/serie-de-la-medida.ts');

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

// ─── 1. Los textos ──────────────────────────────────────────────────────────────────────────────────────────────

test('las otras tomas del día se nombran como una lista para leer', () => {
  assert.equal(textos.enumerar(['T2']), 'T2');
  assert.equal(textos.enumerar(['T2', 'T3']), 'T2 y T3');
  assert.equal(textos.enumerar(['T2', 'T3', 'T4']), 'T2, T3 y T4');
  assert.equal(textos.enumerar([]), '');
});

// ─── 4. La pantalla ───────────────────────────────────────────────────────────────────────────────────────────

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
  assert.deepEqual(serieDeLaMedida.resumenDe(mismoDia, 'ev-tarde').medidas.map((m) => m.metrica), ['pliegue-triceps'], 'de la tarde se ve una parte: por eso el aviso');
});

// ─── 5. Las tres vistas de DL-118 ─────────────────────────────────────────────────────────────────────────────

const G_IMC = grupo('cmp-imc', 'kg/m2', { methodVersionId: '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f01' });
const G_EDAD = grupo('cmp-edad', 'años');
const G_CODO = grupo('cmp-codo', 'cm');
const derivado = (...args) => ({ ...punto(...args), dataClass: 'DERIVED' });

/**
 * Cuatro tomas: la T1 tiene sitios e indicadores; la T2, solo indicadores; la T3, solo sitios; la T4, la última, solo
 * indicadores. Es el caso «la última toma solo tiene indicadores, aunque haya mapas anteriores».
 */
const CUATRO = datos([
  serie('peso', [punto('ev-1', '2026-07-10', 82, G_PESO), punto('ev-2', '2026-08-01', 81, G_PESO), punto('ev-4', '2026-09-20', 79.5, G_PESO)], [G_PESO]),
  serie('perimetro-cintura', [punto('ev-1', '2026-07-10', 90, G_CINTURA), punto('ev-3', '2026-08-30', 88, G_CINTURA)], [G_CINTURA]),
  serie('imc', [derivado('ev-4', '2026-09-20', 25.1, G_IMC)], [G_IMC]),
]);

const contenidos = (dts) => d.tomasDelPeriodo(dts).map((t) => ({ toma: t, contenido: disposicion.contenidoDeLaToma(serieDeLaMedida.resumenDe(dts, t.evaluacionId)) }));

test('DL-118: el mapa y Progreso solo con tomas que tienen sitios; Indicadores solo con indicadores; nunca una vista vacía', () => {
  const c = contenidos(CUATRO);
  assert.deepEqual(c.map((x) => [x.toma.etiqueta, x.contenido.conSitios, x.contenido.conIndicadores]), [
    ['T1', true, true],
    ['T2', false, true],
    ['T3', true, false],
    ['T4', false, true],
  ]);
  assert.deepEqual(disposicion.vistasDisponibles(c.map((x) => x.contenido)), ['MAPA', 'PROGRESO', 'INDICADORES']);
  // Sin ninguna toma con sitios, no hay mapa ni Progreso: no se dibuja una figura vacía.
  const soloPeso = datos([serie('peso', [punto('ev-1', '2026-07-10', 82, G_PESO), punto('ev-2', '2026-08-01', 81, G_PESO)], [G_PESO])]);
  assert.deepEqual(disposicion.vistasDisponibles(contenidos(soloPeso).map((x) => x.contenido)), ['INDICADORES']);
  // Sin indicadores, no hay pestaña de indicadores vacía.
  const soloSitios = datos([serie('perimetro-cintura', [punto('ev-1', '2026-07-10', 90, G_CINTURA)], [G_CINTURA])]);
  assert.deepEqual(disposicion.vistasDisponibles(contenidos(soloSitios).map((x) => x.contenido)), ['MAPA', 'PROGRESO']);
  assert.deepEqual(disposicion.vistasDisponibles([]), [], 'sin mediciones en el período, ninguna vista');
});

test('DL-118: la primera visita abre el mapa si la última toma tiene sitios; si no, Indicadores. Comparar y Evolución abren Progreso', () => {
  const todas = ['MAPA', 'PROGRESO', 'INDICADORES'];
  assert.equal(disposicion.vistaQueSeVe('TOMA', todas, true), 'MAPA');
  assert.equal(disposicion.vistaQueSeVe('TOMA', todas, false), 'INDICADORES', 'la última toma solo tiene indicadores');
  assert.equal(disposicion.vistaQueSeVe('COMPARAR', todas, true), 'PROGRESO', 'la vista vieja de Comparar');
  assert.equal(disposicion.vistaQueSeVe('EVOLUCION', todas, true), 'PROGRESO', 'la vista vieja de Evolución');
  for (const v of todas) assert.equal(disposicion.vistaQueSeVe(v, todas, false), v, 'lo elegido se respeta');
  assert.equal(disposicion.vistaQueSeVe('MAPA', ['INDICADORES'], false), 'INDICADORES', 'sin tomas con sitios no se muestra un mapa vacío');
  assert.equal(disposicion.vistaQueSeVe('PROGRESO', ['INDICADORES'], false), 'INDICADORES');
  assert.equal(disposicion.vistaQueSeVe('INDICADORES', ['MAPA', 'PROGRESO'], true), 'MAPA', 'sin indicadores, otra vista con datos');
  assert.equal(disposicion.vistaQueSeVe('TOMA', [], false), null, 'sin mediciones, ninguna');
});

test('DL-118: cada vista muestra la toma elegida si tiene datos para ella; si no, la anterior más cercana con datos', () => {
  const c = contenidos(CUATRO);
  const tomas = c.map((x) => x.toma);
  const datosPara = (vista) => (t) => disposicion.tieneDatosPara(vista, c.find((x) => x.toma.evaluacionId === t.evaluacionId).contenido);
  const de = (vista, elegida) => disposicion.tomaDeLaVista(tomas, elegida, datosPara(vista))?.etiqueta ?? null;
  // La última toma (T4) solo tiene indicadores: el mapa muestra la T3, la última con sitios, con su fecha.
  assert.equal(de('MAPA', 'ev-4'), 'T3');
  assert.equal(de('INDICADORES', 'ev-4'), 'T4');
  // La T2 no tiene sitios: el mapa muestra la T1, la anterior; nunca una posterior si hay una anterior.
  assert.equal(de('MAPA', 'ev-2'), 'T1');
  assert.equal(de('PROGRESO', 'ev-2'), 'T1');
  // La T3 no tiene indicadores: Indicadores muestra la T2.
  assert.equal(de('INDICADORES', 'ev-3'), 'T2');
  // Sin anterior con datos, la primera posterior.
  const t2 = tomas.slice(1);
  assert.equal(disposicion.tomaDeLaVista(t2, 'ev-2', datosPara('MAPA'))?.etiqueta, 'T3');
  // Sin elección, la última con datos.
  assert.equal(de('MAPA', null), 'T3');
  assert.equal(de('INDICADORES', null), 'T4');
  assert.equal(disposicion.tomaDeLaVista(tomas, 'ev-1', () => false), null, 'sin ninguna con datos, ninguna');
  // El selector va con más de una toma para la vista.
  assert.equal(disposicion.seVeElSelectorDeTomas(2), true);
  assert.equal(disposicion.seVeElSelectorDeTomas(1), false);
});

test('DL-118: «Ver la toma» abre la última; Comparar abre Progreso; «Ver su evolución» abre un sitio en Progreso y otra medida en Indicadores', () => {
  assert.deepEqual(disposicion.eleccionesDelPedido({ vista: 'ultima' }), [
    ['mi-evolucion:vista', 'TOMA'],
    ['mi-evolucion:toma', null],
  ]);
  assert.deepEqual(disposicion.eleccionesDelPedido({ vista: 'comparar' }), [['mi-evolucion:vista', 'PROGRESO']]);
  assert.deepEqual(disposicion.eleccionesDelPedido({ vista: 'evolucion', metrica: 'peso' }), [
    ['mi-evolucion:vista', 'INDICADORES'],
    ['mi-evolucion:medida', 'peso'],
  ]);
  // Un sitio: Progreso, con su familia, y el panel lo decide la medida.
  assert.deepEqual(disposicion.eleccionesDelPedido({ vista: 'evolucion', metrica: 'pliegue-triceps' }), [
    ['mi-evolucion:vista', 'PROGRESO'],
    ['mi-evolucion:medida', 'pliegue-triceps'],
    ['mi-evolucion:familia', 'PLIEGUES'],
    ['mi-evolucion:panel', null],
  ]);
  assert.deepEqual(disposicion.eleccionesDelPedido({}), [], 'sin pedido, manda lo que la persona eligió');
  assert.equal(disposicion.familiaDelSitio('perimetro-cadera'), 'PERIMETROS');
  assert.equal(disposicion.familiaDelSitio('imc'), null);
});

test('DL-118: cada sitio de la figura va en una sola zona, y la figura del compositor de esa zona lo tiene, para los dos sexos', () => {
  for (const familia of ['PERIMETROS', 'PLIEGUES']) {
    for (const sexo of ['HOMBRE', 'MUJER']) {
      const entero = familia === 'PERIMETROS' ? d.FIGURAS_DE_LA_LAMINA[sexo].ENTERO.perimetros : d.FIGURAS_DE_LA_LAMINA[sexo].ENTERO.pliegues;
      // Los mismos sitios que la figura entera: ninguno sin zona, ninguno de más.
      assert.deepEqual(Object.keys(zonas.ZONA_DEL_SITIO[familia]).sort(), Object.keys(entero).sort(), `${familia} ${sexo}`);
      for (const [clave, zona] of Object.entries(zonas.ZONA_DEL_SITIO[familia])) {
        const figura = d.FIGURAS_DE_LA_LAMINA[sexo][zonas.ENCUADRE_DE_LA_ZONA[zona]];
        const lugares = familia === 'PERIMETROS' ? figura.perimetros : figura.pliegues;
        assert.ok(lugares[clave], `${clave} no tiene lugar en la figura de ${zona} (${sexo})`);
        assert.equal(disposicion.familiaDelSitio(clave), familia, `${clave}: la familia de la pantalla y la de las zonas coinciden`);
      }
    }
  }
  // El torso reúne cuello, hombros, brazos y tronco; las piernas, la cadera y los miembros inferiores.
  const torso = Object.entries(zonas.ZONA_DEL_SITIO.PERIMETROS).filter(([, z]) => z === 'TORSO').map(([c]) => c);
  for (const c of ['perimetro-cuello', 'perimetro-hombros', 'perimetro-brazo-relajado', 'perimetro-muneca', 'perimetro-cintura', 'perimetro-abdomen']) assert.ok(torso.includes(c), c);
  const piernas = Object.entries(zonas.ZONA_DEL_SITIO.PERIMETROS).filter(([, z]) => z === 'PIERNAS').map(([c]) => c);
  assert.deepEqual(piernas.sort(), ['perimetro-cadera', 'perimetro-muslo', 'perimetro-pantorrilla', 'perimetro-tobillo']);
});

test('DL-118: el torso va en dos paneles con más de cinco sitios; los paneles no duplican ni omiten sitios y no dependen de la toma', () => {
  for (const familia of ['PERIMETROS', 'PLIEGUES']) {
    const todos = Object.keys(zonas.ZONA_DEL_SITIO[familia]);
    const paneles = zonas.panelesDeProgreso(familia, () => true);
    assert.deepEqual(paneles.map((p) => p.clave), ['TORSO-TRONCO', 'TORSO-BRAZOS', 'PIERNAS'], familia);
    const repartidos = paneles.flatMap((p) => p.sitios);
    assert.equal(new Set(repartidos).size, repartidos.length, `${familia}: un sitio en dos paneles`);
    assert.deepEqual([...repartidos].sort(), [...todos].sort(), `${familia}: un sitio sin panel`);
    for (const p of paneles.filter((x) => x.zona === 'TORSO')) assert.ok(p.sitios.every((c) => p.sitiosDeLaZona.includes(c)), 'el panel es parte de su zona');
    // Los dos paneles del torso comparten la zona entera: la figura no cambia de tamaño al pasar de uno a otro.
    assert.deepEqual(paneles[0].sitiosDeLaZona, paneles[1].sitiosDeLaZona);
  }
  // Con cinco sitios o menos en el torso, un solo panel.
  const pocos = new Set(['perimetro-cuello', 'perimetro-cintura', 'perimetro-cadera']);
  const p = zonas.panelesDeProgreso('PERIMETROS', (c) => pocos.has(c));
  assert.deepEqual(p.map((x) => [x.clave, x.sitios]), [
    ['TORSO', ['perimetro-cuello', 'perimetro-cintura']],
    ['PIERNAS', ['perimetro-cadera']],
  ]);
  // Una zona sin datos no aparece.
  assert.deepEqual(zonas.panelesDeProgreso('PLIEGUES', (c) => c === 'pliegue-pantorrilla').map((x) => x.clave), ['PIERNAS']);
  assert.deepEqual(zonas.panelesDeProgreso('PLIEGUES', () => false), []);
  // El panel que se ve: el pedido si sigue; si no, el de la medida; si no, el primero.
  const todos = zonas.panelesDeProgreso('PLIEGUES', () => true);
  assert.equal(zonas.panelQueSeVe(todos, 'PIERNAS', 'pliegue-triceps').clave, 'PIERNAS');
  assert.equal(zonas.panelQueSeVe(todos, null, 'pliegue-triceps').clave, 'TORSO-BRAZOS');
  assert.equal(zonas.panelQueSeVe(todos, 'TORSO', null).clave, 'TORSO-TRONCO', 'un panel que ya no existe pasa al primero');
  assert.equal(zonas.panelQueSeVe([], null, null), null);
});

test('DL-118: los indicadores van en cuatro bloques; la edad es un dato de la toma y los diámetros van en «más datos»; nada se pierde', () => {
  const toma = datos([
    serie('peso', [punto('ev-1', '2026-09-20', 80, G_PESO)], [G_PESO]),
    serie('talla', [punto('ev-1', '2026-09-20', 176, grupo('cmp-talla', 'cm'))], [grupo('cmp-talla', 'cm')]),
    serie('edad', [punto('ev-1', '2026-09-20', 20, G_EDAD)], [G_EDAD]),
    serie('diametro-humero', [punto('ev-1', '2026-09-20', 7, G_CODO)], [G_CODO]),
    serie('perimetro-cintura', [punto('ev-1', '2026-09-20', 84, G_CINTURA)], [G_CINTURA]),
    serie('imc', [derivado('ev-1', '2026-09-20', 25.8, G_IMC)], [G_IMC]),
  ]);
  const r = serieDeLaMedida.resumenDe(toma, 'ev-1');
  const b = disposicion.bloquesDeIndicadores(r);
  const claves = (lista) => lista.map((m) => m.metrica);
  assert.deepEqual(claves(b.mediciones), ['peso', 'talla']);
  assert.deepEqual(claves(b.resultados), ['imc']);
  assert.deepEqual(claves(b.contexto), ['edad']);
  assert.deepEqual(claves(b.masDatos), ['diametro-humero']);
  // Todo lo que no tiene sitio está en un bloque; la cintura, que tiene sitio, va en el mapa.
  const enBloques = [...b.mediciones, ...b.resultados, ...b.contexto, ...b.masDatos].map((m) => m.metrica).sort();
  assert.deepEqual(enBloques, [...r.medidas, ...r.derivadas].map((m) => m.metrica).filter((m) => m !== 'perimetro-cintura').sort());
});

test('DL-118: la serie de una medida usa el grupo de la toma elegida, cuenta aparte el otro grupo y conserva las fechas reales', () => {
  // El tríceps: julio y septiembre con un protocolo, agosto con ISAK.
  const propio = serieDeLaMedida.serieDeLaMedida(TRES, 'pliegue-triceps', 'cmp-3');
  assert.equal(propio.grupo, 'cmp-3');
  assert.deepEqual(propio.observaciones.map((o) => [o.fecha, o.punto.value]), [
    ['2026-07-20', 12],
    ['2026-09-24', 10],
  ]);
  assert.equal(propio.enOtrosGrupos, 1, 'el de agosto no se dibuja en este eje, pero se cuenta');
  assert.deepEqual(propio.grupos.map((g) => g.comparabilityGroup).sort(), ['cmp-3', 'cmp-4']);
  const isak = serieDeLaMedida.serieDeLaMedida(TRES, 'pliegue-triceps', 'cmp-4');
  assert.deepEqual(isak.observaciones.map((o) => o.punto.value), [11]);
  assert.equal(isak.enOtrosGrupos, 2);
  // Sin grupo pedido, el más reciente.
  assert.equal(serieDeLaMedida.serieDeLaMedida(TRES, 'pliegue-triceps', null).grupo, 'cmp-3');
  // La cintura no se midió en agosto: dos observaciones y, entre ellas, nada inventado.
  const cintura = serieDeLaMedida.serieDeLaMedida(TRES, 'perimetro-cintura', 'cmp-2');
  assert.deepEqual(cintura.observaciones.map((o) => o.punto.value), [90, 86.5]);
  assert.equal(serieDeLaMedida.indiceDeLaToma(cintura.observaciones, 'ev-3'), 1);
  assert.equal(serieDeLaMedida.indiceDeLaToma(cintura.observaciones, 'ev-2'), null, 'la toma de agosto no tiene la cintura');
  assert.deepEqual(serieDeLaMedida.serieDeLaMedida(TRES, 'perimetro-muslo', null).observaciones, [], 'una medida que no está, vacía');
});

