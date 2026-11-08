/**
 * WP-TABLERO-ALTA-GAMA TB-50 (pedido de Dirección del 2026-11-07) · TEST-TAG-036 · la evolución de las últimas tomas
 * ubica en pares y no mezcla lo que no se compara, sin React:
 *  1. las columnas son las últimas tomas con alguna medida de los pares (hasta cuatro), sin contar una toma con solo el
 *     peso, y cada fila tiene un valor por columna;
 *  2. un par sin ningún valor no se muestra, y una medida sin valores lo dice;
 *  3. kilos con kilos: las filas de una misma unidad usan el mismo largo de escala, nunca más angosto que el mínimo de la
 *     unidad, y dos unidades no comparten largo;
 *  4. la geometría: las columnas alineadas en todas las filas, más arriba cuanto más alto el valor, el mismo píxel por
 *     unidad en las filas de la misma unidad, y la marca con el estado del dato (TB-02);
 *  5. lo no comparable: la línea no cruza un cambio de protocolo ni un hueco, la diferencia va desde el cambio y lo dice;
 *  6. una propiedad con tomas al azar (semilla fija) sobre 3 y 5;
 *  7. los textos: con su signo y su unidad, sin «%», sin juicios y sin palabras prohibidas en Antropometría.
 * El dibujo, en las capturas del tablero (`EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/capturas.mjs`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { terminosProhibidosDeAntropometriaEn, terminosProhibidosEn } from '@be/domain';

const E = await import('../src/app/pro/advisees/seguimiento/evolucion-de-las-tomas.ts');
const G = await import('../src/app/pro/advisees/seguimiento/geometria.ts');
const { escalasDeLaEvolucion, evolucionDeLasTomas, geometriaDeLaFila, notaDeLaFila, resumenDeLaEvolucion, textoDeLaFila, diferenciaConUnidad, xDeLaColumna, PARES, METRICAS_DE_LA_EVOLUCION, MAXIMO_DE_TOMAS } = E;
const { RANGO_MINIMO_POR_UNIDAD, medidaDeMarca } = G;

const PROTOCOLO = 'p-isak';
const UNIDAD = { peso: 'kg', 'suma-6-pliegues-isak': 'mm', 'perimetro-cintura': 'cm', 'perimetro-brazo-flexionado': 'cm', 'pliegue-abdominal': 'mm', 'pliegue-triceps': 'mm' };

/**
 * Una toma como la deja `tomasDeLaEvolucion` (composicion.ts): por métrica, el valor, la unidad, la clase y la clave de
 * comparabilidad (protocolo, método y unidad). La suma de 6 pliegues es un cálculo (DERIVED).
 */
let n = 0;
function toma(fecha, valores, { protocolo = PROTOCOLO } = {}) {
  n++;
  const datos = new Map(
    Object.entries(valores).map(([metrica, valor]) => {
      const unidad = UNIDAD[metrica];
      const metodo = metrica === 'suma-6-pliegues-isak' ? 'm-suma6' : '';
      return [metrica, { valor, unidad, clase: metrica === 'suma-6-pliegues-isak' ? 'DERIVED' : 'MEASURED', comparable: `${protocolo}|${metodo}|${unidad}`, protocoloVersionId: protocolo, metodoVersionId: metodo || null, corregido: false }];
    }),
  );
  return { evaluacionId: `t-${String(n).padStart(3, '0')}`, fecha, instante: `${fecha}T12:00:00.000Z`, datos };
}
const completa = (fecha, c, ab, s6, peso, br, tr, opciones) => toma(fecha, { 'perimetro-cintura': c, 'pliegue-abdominal': ab, 'suma-6-pliegues-isak': s6, peso, 'perimetro-brazo-flexionado': br, 'pliegue-triceps': tr }, opciones);

const DIEGO = [
  completa('2026-05-18', 90.0, 24.0, 92.0, 84.6, 35.0, 12.0),
  completa('2026-06-29', 89.2, 23.1, 88.5, 83.9, 35.4, 11.5),
  completa('2026-08-10', 88.0, 22.0, 84.0, 82.9, 35.9, 11.0),
  completa('2026-09-21', 87.1, 21.4, 80.6, 81.8, 36.3, 10.6),
  completa('2026-11-01', 86.0, 20.6, 77.0, 80.9, 36.8, 10.1),
];
const filaDe = (e, metrica) => e.pares.flatMap((p) => p.filas).find((f) => f.metrica === metrica);

test('TEST-TAG-036 · las columnas son las últimas tomas con medidas de los pares, y cada fila tiene un valor por columna', () => {
  const conSoloPeso = [...DIEGO, toma('2026-11-05', { peso: 80.6 })];
  const e = evolucionDeLasTomas(conSoloPeso);
  assert.equal(e.columnas.length, MAXIMO_DE_TOMAS);
  assert.deepEqual(e.columnas.map((c) => c.fecha), ['2026-06-29', '2026-08-10', '2026-09-21', '2026-11-01'], 'las últimas cuatro, sin la toma con solo el peso');
  assert.deepEqual(e.pares.map((p) => p.par.clave), PARES.map((p) => p.clave), 'los tres pares, en su orden');
  for (const p of e.pares) for (const f of p.filas) assert.equal(f.valores.length, e.columnas.length, `${f.metrica}: un valor por columna`);
  assert.deepEqual(e.pares[0].filas.map((f) => f.metrica), ['perimetro-cintura', 'pliegue-abdominal'], 'la cintura con el pliegue abdominal');
  assert.deepEqual(e.pares[1].filas.map((f) => f.metrica), ['suma-6-pliegues-isak', 'peso']);
  assert.deepEqual(e.pares[2].filas.map((f) => f.metrica), ['perimetro-brazo-flexionado', 'pliegue-triceps']);
  assert.deepEqual(filaDe(e, 'perimetro-cintura').diferencia, { valor: -3.2, desde: 0, hasta: 3 });
  assert.equal(evolucionDeLasTomas(DIEGO, 3).columnas.length, 3, 'con poco lugar, tres');
  assert.ok(METRICAS_DE_LA_EVOLUCION.includes('peso') && METRICAS_DE_LA_EVOLUCION.length === 6);
});

test('TEST-TAG-036 · un par sin valores no se muestra, y una medida sin valores lo dice', () => {
  // Como Héctor: sin pliegues, con la cintura y el peso.
  const sinPliegues = [toma('2026-09-01', { 'perimetro-cintura': 101.2, peso: 86.4 }), toma('2026-10-01', { 'perimetro-cintura': 100.5, peso: 86.0 })];
  const e = evolucionDeLasTomas(sinPliegues);
  assert.deepEqual(e.pares.map((p) => p.par.clave), ['cintura-y-abdominal', 'pliegues-y-peso'], 'sin brazo ni tricipital, ese par no va');
  const abdominal = filaDe(e, 'pliegue-abdominal');
  assert.equal(abdominal.unidad, null);
  assert.equal(textoDeLaFila(abdominal), 'sin medir');
  assert.equal(notaDeLaFila(abdominal, () => ''), 'Pliegue abdominal: no se midió en estas tomas.');
  assert.equal(textoDeLaFila(filaDe(e, 'perimetro-cintura')), '−0,7 cm');
  // Una sola toma con medidas: la pieza lo dice, sin diferencias.
  const una = evolucionDeLasTomas([DIEGO[0]]);
  assert.equal(una.columnas.length, 1);
  assert.ok(una.pares.every((p) => p.filas.every((f) => f.diferencia === null)));
  assert.equal(textoDeLaFila(filaDe(una, 'peso')), 'una toma');
  assert.equal(evolucionDeLasTomas([toma('2026-10-01', { peso: 80 })]).pares.length, 0, 'con solo el peso, no hay pieza');
});

test('TEST-TAG-036 · kilos con kilos: la misma vara en cada unidad, nunca más angosta que su mínimo', () => {
  const e = evolucionDeLasTomas(DIEGO);
  const escalas = escalasDeLaEvolucion(e, RANGO_MINIMO_POR_UNIDAD);
  const largo = (m) => Math.round((escalas.get(m).arriba - escalas.get(m).abajo) * 1000) / 1000;
  // Los centímetros: la cintura varía 3,2 cm y el brazo 1,4: los dos con 3,2.
  assert.equal(largo('perimetro-cintura'), 3.2);
  assert.equal(largo('perimetro-brazo-flexionado'), 3.2, 'un centímetro mide lo mismo en la cintura que en el brazo');
  // Los milímetros: la suma de 6 varía 11,5; el abdominal y el tricipital, con ese largo.
  assert.equal(largo('suma-6-pliegues-isak'), 11.5);
  assert.equal(largo('pliegue-abdominal'), 11.5);
  assert.equal(largo('pliegue-triceps'), 11.5);
  // Los kilos, solos: el peso varía 3,0.
  assert.equal(largo('peso'), 3);
  for (const f of e.pares.flatMap((p) => p.filas)) {
    const s = escalas.get(f.metrica);
    for (const v of f.valores) assert.ok(v.valor >= s.abajo - 1e-9 && v.valor <= s.arriba + 1e-9, `${f.metrica}: ${v.valor} entra en su escala`);
  }
  // Con poca variación, el mínimo de la unidad: 2 cm, 4 mm y 2 kg.
  const quieta = evolucionDeLasTomas([completa('2026-10-01', 86, 20, 77, 80.9, 36.8, 10), completa('2026-11-01', 86.2, 20.1, 77.4, 81.0, 36.8, 10.1)]);
  const q = escalasDeLaEvolucion(quieta, RANGO_MINIMO_POR_UNIDAD);
  assert.deepEqual(['perimetro-cintura', 'pliegue-abdominal', 'peso'].map((m) => Math.round((q.get(m).arriba - q.get(m).abajo) * 1000) / 1000), [2, 4, 2]);
});

test('TEST-TAG-036 · la geometría: columnas alineadas, el valor más alto más arriba, el mismo píxel por unidad y la marca del dato', () => {
  const e = evolucionDeLasTomas(DIEGO);
  const escalas = escalasDeLaEvolucion(e, RANGO_MINIMO_POR_UNIDAD);
  const ancho = 200;
  const g = (m) => geometriaDeLaFila(filaDe(e, m), escalas.get(m), ancho);
  const cintura = g('perimetro-cintura');
  const brazo = g('perimetro-brazo-flexionado');
  const abdominal = g('pliegue-abdominal');
  // Las mismas x en todas las filas: las tomas se leen en columna.
  for (const fila of [cintura, brazo, abdominal, g('peso')]) assert.deepEqual(fila.puntos.map((p) => p.x), [0, 1, 2, 3].map((i) => xDeLaColumna(i, 4, ancho)));
  assert.equal(xDeLaColumna(0, 4, ancho), E.MARGEN_DE_LAS_COLUMNAS);
  assert.equal(xDeLaColumna(3, 4, ancho), ancho - E.MARGEN_DE_LAS_COLUMNAS);
  // Más alto el valor, más arriba (menos y): la cintura baja, el brazo sube.
  for (let i = 1; i < 4; i++) {
    assert.ok(cintura.puntos[i].y > cintura.puntos[i - 1].y, 'la cintura baja: cada punto, más abajo');
    assert.ok(brazo.puntos[i].y < brazo.puntos[i - 1].y, 'el brazo sube: cada punto, más arriba');
  }
  // El mismo píxel por centímetro en las dos filas de centímetros.
  const pxPorUnidad = (fila) => (fila.puntos[0].y - fila.puntos[3].y) / (fila.puntos[3].valor - fila.puntos[0].valor);
  assert.ok(Math.abs(pxPorUnidad(cintura) - pxPorUnidad(brazo)) < 1e-9, 'kilos con kilos, en píxeles');
  // Todo adentro de la fila, debajo de la franja del valor escrito.
  for (const fila of [cintura, brazo, abdominal]) for (const p of fila.puntos) assert.ok(p.y >= E.FRANJA_DEL_VALOR - 1e-9 && p.y <= E.ALTO_DE_LA_FILA, `${p.y} dentro de la fila`);
  // Una línea por tramo, con las cuatro columnas; la marca, con el estado del dato y la regla de TB-02.
  assert.equal(cintura.trazos.length, 1);
  assert.equal(cintura.trazos[0].split('L').length, 4);
  assert.ok(cintura.puntos.every((p) => p.estado === 'lleno'), 'lo medido, lleno');
  assert.ok(g('suma-6-pliegues-isak').puntos.every((p) => p.estado === 'calculado'), 'la suma de 6, calculada (con su punto adentro)');
  assert.equal(medidaDeMarca('lleno', cintura.lugar).R, 3.5, 'con lugar de sobra, la marca llena de 3,5');
  assert.equal(cintura.puntos.filter((p) => p.ultimo).length, 1, 'una sola cifra en la tinta del texto: la última');
  assert.equal(cintura.puntos.at(-1).ultimo, true);
});

test('TEST-TAG-036 · lo no comparable: la línea no cruza un cambio ni un hueco, y la diferencia va desde el cambio', () => {
  const tomas = [
    completa('2026-06-29', 89.2, 23.1, 88.5, 83.9, 35.4, 11.5),
    // Una toma sin el pliegue abdominal: un hueco, sin completar.
    toma('2026-08-10', { 'perimetro-cintura': 88.0, 'suma-6-pliegues-isak': 84.0, peso: 82.9 }),
    // Cambia el protocolo de la toma: la cintura, el abdominal y el peso pasan a otro grupo.
    completa('2026-09-21', 87.1, 21.4, 80.6, 81.8, 36.3, 10.6, { protocolo: 'p-otro' }),
    completa('2026-11-01', 86.0, 20.6, 77.0, 80.9, 36.8, 10.1, { protocolo: 'p-otro' }),
  ];
  const e = evolucionDeLasTomas(tomas);
  const escalas = escalasDeLaEvolucion(e, RANGO_MINIMO_POR_UNIDAD);
  const cintura = filaDe(e, 'perimetro-cintura');
  assert.deepEqual(cintura.tramos, [[0, 1], [2, 3]], 'la línea se corta en el cambio');
  assert.equal(cintura.cambio, 2);
  assert.deepEqual(cintura.diferencia, { valor: -1.1, desde: 2, hasta: 3 }, 'la diferencia, desde el cambio');
  assert.match(notaDeLaFila(cintura, (i) => e.columnas[i].fecha), /^Cintura: cambia el protocolo, el método o la unidad el 2026-09-21; la diferencia va desde ahí\.$/);
  const abdominal = filaDe(e, 'pliegue-abdominal');
  assert.deepEqual(abdominal.tramos, [[0], [2, 3]], 'el hueco no se une');
  const geo = geometriaDeLaFila(abdominal, escalas.get('pliegue-abdominal'), 200);
  assert.equal(geo.trazos.length, 1, 'un solo trazo: el del tramo de dos');
  assert.equal(geo.trazos[0].split('L').length, 2, 'y une solo las dos columnas del tramo, no la del otro lado del hueco');
  assert.deepEqual(geo.huecos, [xDeLaColumna(1, 4, 200)], '«—» en la columna sin valor');
  // Un hueco sin cambio no corta la comparación: el tricipital va de la primera a la última.
  const conHueco = evolucionDeLasTomas([DIEGO[0], toma('2026-06-29', { 'perimetro-cintura': 89 }), DIEGO[2]]);
  const triceps = filaDe(conHueco, 'pliegue-triceps');
  assert.deepEqual(triceps.tramos, [[0], [2]]);
  assert.deepEqual(triceps.diferencia, { valor: -1, desde: 0, hasta: 2 });
  // Una sola toma después del cambio: sin comparar, y lo dice.
  const solo = evolucionDeLasTomas([DIEGO[0], DIEGO[1], completa('2026-08-10', 88, 22, 84, 82.9, 35.9, 11, { protocolo: 'p-otro' })]);
  const c = filaDe(solo, 'perimetro-cintura');
  assert.equal(c.diferencia, null);
  assert.equal(textoDeLaFila(c), 'sin comparar');
  assert.match(notaDeLaFila(c, (i) => solo.columnas[i].fecha), /desde ahí hay una sola toma/);
});

/** Un generador con semilla: la misma corrida da los mismos casos. */
function azar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('TEST-TAG-036 · propiedad: con tomas al azar, la línea nunca une lo no comparable ni un hueco, y la vara es una por unidad', () => {
  const r = azar(20261107);
  const metricas = Object.keys(UNIDAD);
  for (let caso = 0; caso < 300; caso++) {
    const lista = [];
    let dia = 1;
    for (let i = 0; i < 1 + Math.floor(r() * 7); i++) {
      dia += 20 + Math.floor(r() * 30);
      const valores = {};
      for (const m of metricas) if (r() < 0.75) valores[m] = Math.round((10 + r() * 90) * 10) / 10;
      const fecha = new Date(Date.UTC(2026, 0, dia)).toISOString().slice(0, 10);
      lista.push(toma(fecha, valores, { protocolo: r() < 0.15 ? 'p-otro' : PROTOCOLO }));
    }
    const e = evolucionDeLasTomas(lista);
    assert.ok(e.columnas.length <= MAXIMO_DE_TOMAS);
    const escalas = escalasDeLaEvolucion(e, RANGO_MINIMO_POR_UNIDAD);
    const largos = new Map();
    for (const f of e.pares.flatMap((p) => p.filas)) {
      for (const t of f.tramos) {
        for (let j = 1; j < t.length; j++) {
          assert.equal(t[j], t[j - 1] + 1, `caso ${caso}: un tramo une columnas seguidas`);
          assert.equal(f.valores[t[j]].comparable, f.valores[t[j - 1]].comparable, `caso ${caso}: un tramo une solo lo comparable`);
        }
        for (const i of t) assert.ok(f.valores[i], `caso ${caso}: un tramo no pasa por un hueco`);
      }
      if (f.diferencia) {
        const { desde, hasta } = f.diferencia;
        const clave = f.valores[hasta].comparable;
        for (let i = desde; i <= hasta; i++) assert.ok(!f.valores[i] || f.valores[i].comparable === clave, `caso ${caso}: la diferencia de ${f.metrica} no cruza un cambio`);
      }
      if (f.unidad) {
        const s = escalas.get(f.metrica);
        const largo = Math.round((s.arriba - s.abajo) * 1e6);
        if (largos.has(f.unidad)) assert.equal(largo, largos.get(f.unidad), `caso ${caso}: una sola vara para ${f.unidad}`);
        largos.set(f.unidad, largo);
        assert.ok(largo >= RANGO_MINIMO_POR_UNIDAD[f.unidad] * 1e6 - 1, `caso ${caso}: nunca más angosta que el mínimo de ${f.unidad}`);
        const geo = geometriaDeLaFila(f, s, 180);
        assert.equal(geo.puntos.length + geo.huecos.length, e.columnas.length, `caso ${caso}: cada columna, un punto o un hueco`);
      }
    }
  }
});

test('TEST-TAG-036 · los textos ubican: con su signo y su unidad, sin «%» ni juicios', () => {
  const e = evolucionDeLasTomas(DIEGO);
  assert.equal(resumenDeLaEvolucion(e), 'Cintura −3,2 cm · pliegue abdominal −2,5 mm');
  assert.equal(diferenciaConUnidad(0.4, 'kg'), '+0,4 kg');
  assert.equal(diferenciaConUnidad(0.02, 'cm'), 'sin cambio');
  const textos = [
    ...PARES.flatMap((p) => [p.titulo, ...p.medidas.map((m) => m.nombre)]),
    ...e.pares.flatMap((p) => p.filas.map(textoDeLaFila)),
    resumenDeLaEvolucion(e),
    E.UNA_SOLA_TOMA_CON_MEDIDAS,
    E.COMO_SE_LEE_LA_EVOLUCION,
    'sin medir',
    'sin comparar',
    'una toma',
  ];
  for (const t of textos) {
    assert.doesNotMatch(t, /%|\bbien\b|\bmal\b|normal|ideal|mejor|peor|progres/i, t);
    assert.deepEqual(terminosProhibidosDeAntropometriaEn(t), [], t);
    assert.deepEqual(terminosProhibidosEn(t), [], t);
  }
});
