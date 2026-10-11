/**
 * El minigráfico de un indicador del Resumen (WP-ESCRITORIO-AMABLE, parte 3; `apps/web/src/app/pro/advisees/seguimiento/
 * geometria.ts`): los mismos puntos y los mismos cortes que el gráfico de «Analizar», en chico.
 * - un punto por observación con valor, y ninguno de menos por falta de lugar: se achica la marca;
 * - la línea une solo puntos del mismo tramo, y lo que está sin completar va suelto;
 * - un día sin registros se sombrea y no es un punto en cero; el día en curso no se sombrea;
 * - un día con registros y sin cantidades no es un punto ni un día sin registros;
 * - dos marcas en el eje vertical, en números redondos, que encierran todo lo dibujado.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const { diasSinRegistros, extremosDelEje, geometriaDelMinigrafico, mediodia, xDe } = await import('../apps/web/src/app/pro/advisees/seguimiento/geometria.ts');

const punto = (date, value, extra = {}) => ({
  pointId: `p-${date}-${extra.segment ?? 't0'}`,
  date,
  dateEnd: null,
  at: null,
  value,
  quality: 'COMPLETE',
  n: 1,
  segment: 't0',
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
const dia = (n) => new Date(Date.UTC(2026, 8, n, 12)).toISOString().slice(0, 10); // septiembre de 2026
const BASE = { sinRegistros: [], desde: dia(1), hasta: dia(30), ancho: 300, alto: 72, inicioDelPlan: null };

test('los extremos del eje son números redondos que encierran los valores', () => {
  assert.deepEqual(extremosDelEje(1085, 2260), { abajo: 1000, arriba: 3000, decimales: 0 });
  assert.deepEqual(extremosDelEje(77.6, 78.9), { abajo: 77, arriba: 79, decimales: 0 });
  assert.deepEqual(extremosDelEje(79.25, 79.85), { abajo: 79, arriba: 80, decimales: 0 });
  assert.deepEqual(extremosDelEje(57.5, 62.5), { abajo: 55, arriba: 65, decimales: 0 });
  // Con medias unidades, las dos marcas llevan el mismo número de decimales, y ninguna se escribe redondeada.
  assert.deepEqual(extremosDelEje(79.8, 80.2), { abajo: 79.8, arriba: 80.2, decimales: 1 });
  assert.deepEqual(extremosDelEje(79.7, 80.4), { abajo: 79.5, arriba: 80.5, decimales: 1 });
  // Un solo valor: se abre un margen alrededor, para que el punto no quede en un borde.
  const uno = extremosDelEje(60, 60);
  assert.ok(uno.abajo < 60 && uno.arriba > 60, JSON.stringify(uno));
  // Una métrica que no baja de cero no muestra una marca negativa.
  assert.equal(extremosDelEje(0, 3).abajo, 0);
  assert.equal(extremosDelEje(1, 1).abajo >= 0, true);
  for (const [a, b] of [[0.2, 0.9], [3, 4], [12, 97], [1211, 1950], [80.2, 79.8].sort()]) {
    const e = extremosDelEje(a, b);
    assert.ok(e.abajo <= a && e.arriba >= b && e.arriba > e.abajo, `${a}–${b}: ${JSON.stringify(e)}`);
  }
});

test('un punto por observación con valor; lo que no tiene valor no es un punto ni un día sin registros', () => {
  const puntos = [punto(dia(2), 1800), punto(dia(3), 2100), punto(dia(4), null), punto(dia(5), 1900, { quality: 'PARTIAL' })];
  const g = geometriaDelMinigrafico({ ...BASE, puntos, sinRegistros: diasSinRegistros([{ from: dia(6), to: dia(9) }], dia(30)) });
  assert.equal(g.puntos.length, 3);
  assert.deepEqual(g.puntos.map((p) => p.hueco), [false, false, true]);
  // El subtotal se ve hueco: su marca no es más chica que la de un punto lleno.
  assert.ok(g.puntos[2].r >= g.puntos[0].r);
  // El día 4 (registros sin cantidades) no se sombrea: el sombreado es solo de los días 6 a 9.
  assert.equal(g.sinRegistros.length, 1);
  const anchoDeUnDia = (g.caja.derecha - g.caja.izquierda) / 30;
  assert.ok(Math.abs(g.sinRegistros[0].ancho - 4 * anchoDeUnDia) < 0.01, `${g.sinRegistros[0].ancho} contra ${4 * anchoDeUnDia}`);
  // Todo lo dibujado queda adentro de la caja, y las dos marcas del eje lo encierran.
  for (const p of g.puntos) assert.ok(p.x >= g.caja.izquierda && p.x <= g.caja.derecha && p.y >= g.caja.arriba - 0.001 && p.y <= g.caja.abajo + 0.001, JSON.stringify(p));
  assert.deepEqual(g.eje.map((m) => m.valor), [2200, 1800]);
  assert.deepEqual(g.eje.map((m) => m.texto), ['2.200', '1.800']);
  assert.ok(g.eje[0].y < g.eje[1].y, 'la marca de arriba va arriba');
});

test('la línea une solo puntos del mismo tramo, y lo que está sin completar va suelto', () => {
  const puntos = [
    punto(dia(2), 80, { segment: 't0' }),
    punto(dia(9), 79.5, { segment: 't0' }),
    // Otro protocolo: otro tramo. No se une con el anterior.
    punto(dia(16), 81, { segment: 't1' }),
    punto(dia(23), 80.6, { segment: 't1' }),
    punto(dia(27), 80.4, { segment: 't1' }),
    // Un tramo de un solo punto no tiene línea.
    punto(dia(29), 82, { segment: 't2' }),
    // El día en curso: suelto y hueco.
    punto(dia(30), 40, { segment: 't1', partialBucket: true }),
  ];
  const g = geometriaDelMinigrafico({ ...BASE, puntos });
  assert.equal(g.puntos.length, 7, 'ningún punto se quita');
  assert.equal(g.tramos.length, 2);
  assert.deepEqual(g.tramos.map((t) => t.split('L').length), [2, 3], 'dos puntos en el primer tramo y tres en el segundo: el día en curso no se une');
  assert.equal(g.puntos[6].hueco, true);
  // Cada trazo empieza y termina en los puntos de su tramo.
  const [a, b] = [g.puntos[0], g.puntos[1]];
  assert.equal(g.tramos[0], `M${a.x} ${a.y} L${b.x} ${b.y}`);
});

test('con muchos días en poco ancho no se quita ningún punto: se achica la marca', () => {
  const de = (dias) => {
    const hasta = '2026-10-10';
    const desde = new Date(mediodia(hasta) - (dias - 1) * 86_400_000).toISOString().slice(0, 10);
    const puntos = Array.from({ length: dias }, (_, i) => punto(new Date(mediodia(desde) + i * 86_400_000).toISOString().slice(0, 10), 1500 + (i % 7) * 60));
    return geometriaDelMinigrafico({ ...BASE, desde, hasta, puntos, ancho: 300 });
  };
  const [semana, trimestre, anio] = [de(7), de(90), de(365)];
  assert.deepEqual([semana.puntos.length, trimestre.puntos.length, anio.puntos.length], [7, 90, 365]);
  assert.ok(semana.puntos[0].r > trimestre.puntos[0].r && trimestre.puntos[0].r > anio.puntos[0].r, `${semana.puntos[0].r} · ${trimestre.puntos[0].r} · ${anio.puntos[0].r}`);
  assert.ok(anio.puntos[0].r >= 1.5, 'la marca más chica todavía se ve');
});

test('el día en curso no se sombrea, y el inicio del plan se marca solo si cae adentro del período', () => {
  // El hueco llega hasta hoy: se sombrea hasta ayer.
  assert.deepEqual(diasSinRegistros([{ from: dia(27), to: dia(30) }], dia(30)), [{ desde: dia(27), hasta: dia(29) }]);
  // Un hueco que es solo el día en curso no se sombrea.
  assert.deepEqual(diasSinRegistros([{ from: dia(30), to: dia(30) }], dia(30)), []);
  const puntos = [punto(dia(22), 1700), punto(dia(24), 1900)];
  const conPlan = geometriaDelMinigrafico({ ...BASE, puntos, inicioDelPlan: dia(20) });
  assert.ok(conPlan.inicioDelPlan > conPlan.caja.izquierda && conPlan.inicioDelPlan < conPlan.puntos[0].x, 'la marca del plan va antes de su primer registro');
  assert.equal(geometriaDelMinigrafico({ ...BASE, puntos, inicioDelPlan: dia(1) }).inicioDelPlan, null, 'un plan que ya regía al empezar el período no se marca');
  assert.equal(geometriaDelMinigrafico({ ...BASE, puntos, inicioDelPlan: null }).inicioDelPlan, null);
});

test('sin valores no hay nada que dibujar, y dos tomas del mismo día no se pisan', () => {
  const vacio = geometriaDelMinigrafico({ ...BASE, puntos: [punto(dia(3), null)] });
  assert.deepEqual([vacio.puntos.length, vacio.tramos.length, vacio.eje.length], [0, 0, 0]);
  const tomas = [punto(dia(10), 80, { at: `${dia(10)}T08:00:00.000Z`, segment: 'a' }), punto(dia(10), 80.2, { at: `${dia(10)}T18:00:00.000Z`, segment: 'a', pointId: 'tarde' })];
  const g = geometriaDelMinigrafico({ ...BASE, puntos: tomas });
  assert.ok(g.puntos[1].x > g.puntos[0].x, 'la de la tarde va a la derecha de la de la mañana');
  assert.equal(xDe(tomas[0]) < xDe(tomas[1]), true);
});
