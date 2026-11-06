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

const { diasSinRegistros, estadoDeMarca, extremosDelEje, geometriaDelMinigrafico, LETRA_MINIMA, medidaDeMarca, medidaDelAro, medidaDelRombo, mediodia, rayaDeCorregido, xDe } = await import('../apps/web/src/app/pro/advisees/seguimiento/geometria.ts');

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

test('con muchos días en poco ancho no se quita ningún punto: se achica la marca hasta su mínimo', () => {
  const de = (dias) => {
    const hasta = '2026-10-10';
    const desde = new Date(mediodia(hasta) - (dias - 1) * 86_400_000).toISOString().slice(0, 10);
    const puntos = Array.from({ length: dias }, (_, i) => punto(new Date(mediodia(desde) + i * 86_400_000).toISOString().slice(0, 10), 1500 + (i % 7) * 60));
    return geometriaDelMinigrafico({ ...BASE, desde, hasta, puntos, ancho: 300 });
  };
  const [semana, trimestre, anio] = [de(7), de(90), de(365)];
  assert.deepEqual([semana.puntos.length, trimestre.puntos.length, anio.puntos.length], [7, 90, 365]);
  // TB-02 (DL-163 D-3): la regla de los cuatro gráficos tiene un piso, 1,25 para el lleno; a 90 y a 365 días los dos
  // llegan al piso (antes, 1,5 y una escala propia del minigráfico). Con TB-04, el minigráfico deja de marcar cada día.
  assert.ok(semana.puntos[0].r > trimestre.puntos[0].r && trimestre.puntos[0].r >= anio.puntos[0].r, `${semana.puntos[0].r} · ${trimestre.puntos[0].r} · ${anio.puntos[0].r}`);
  assert.equal(anio.puntos[0].r, 1.25, 'la marca más chica todavía se ve');
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

// ─── Los gráficos chicos de la comparación de dos etapas (C-12) ─────────────────────────────────

test('sin etapas, fechas ni objetivo, el dibujo es el de siempre: nada de eso aparece ni le saca lugar', () => {
  const puntos = [punto(dia(2), 1800), punto(dia(20), 2100)];
  const g = geometriaDelMinigrafico({ ...BASE, puntos });
  assert.deepEqual([g.bandas.length, g.fechas.length, g.plan.length], [0, 0, 0]);
  assert.equal(g.caja.abajo, BASE.alto - 8, 'sin fechas no se reserva el renglón del pie');
});

test('las dos etapas son bandas que no se pisan, cada una con su letra, recortadas a lo leído', () => {
  const puntos = [punto(dia(3), 1800), punto(dia(25), 2100)];
  const g = geometriaDelMinigrafico({
    ...BASE,
    puntos,
    bandas: [
      // A empezó antes de lo leído: se dibuja desde el comienzo del período.
      { desde: '2026-08-20', hasta: dia(14), rotulo: 'A' },
      { desde: dia(15), hasta: dia(30), rotulo: 'B' },
      // Una etapa entera fuera de lo leído no es una banda.
      { desde: '2026-07-01', hasta: '2026-07-31', rotulo: 'X' },
    ],
  });
  assert.deepEqual(g.bandas.map((b) => b.rotulo), ['A', 'B']);
  const [a, b] = g.bandas;
  assert.ok(Math.abs(a.x - g.caja.izquierda) < 0.01, 'A arranca en el borde izquierdo del dibujo');
  assert.ok(Math.abs(a.x + a.ancho - b.x) < 0.01, 'B empieza donde termina A: el día del corte es de B');
  assert.ok(Math.abs(b.x + b.ancho - g.caja.derecha) < 0.01, 'B llega al borde derecho');
  // 14 días de A y 16 de B, en un período de 30.
  assert.ok(Math.abs(a.ancho / b.ancho - 14 / 16) < 0.001, `${a.ancho} / ${b.ancho}`);
  // El primer punto está en A y el segundo en B.
  assert.ok(g.puntos[0].x < b.x && g.puntos[1].x > b.x);
  // La letra de cada etapa va en una franja propia, arriba: ningún punto se dibuja ahí, así no la pisa.
  assert.equal(g.caja.arriba, 8 + 14);
  for (const p of g.puntos) assert.ok(p.y >= g.caja.arriba - 0.001, JSON.stringify(p));
  assert.equal(geometriaDelMinigrafico({ ...BASE, puntos }).caja.arriba, 8, 'sin etapas no se reserva la franja');
});

test('un gráfico con alto de sobra puede pedir un eje más ajustado; sin pedirlo, el eje es el de siempre', () => {
  // Las calorías de un día en curso (227) con un objetivo de 2.100: el eje de siempre llega a 3.000; el ajustado, a 2.500.
  assert.deepEqual(extremosDelEje(227, 2100), { abajo: 0, arriba: 3000, decimales: 0 });
  assert.deepEqual(extremosDelEje(227, 2100, 4), { abajo: 0, arriba: 2500, decimales: 0 });
  // El peso: de 78 a 84 pasa a 79 a 83.
  assert.deepEqual(extremosDelEje(79.2, 82.4), { abajo: 78, arriba: 84, decimales: 0 });
  assert.deepEqual(extremosDelEje(79.2, 82.4, 4), { abajo: 79, arriba: 83, decimales: 0 });
  // Ajustado o no, el eje encierra todos los valores.
  for (const [a, b] of [[0.2, 0.9], [3, 4], [12, 97], [1211, 1950], [79.8, 80.2], [60, 60]]) {
    const e = extremosDelEje(a, b, 4);
    assert.ok(e.abajo <= a && e.arriba >= b && e.arriba > e.abajo, `${a}–${b}: ${JSON.stringify(e)}`);
  }
  const puntos = [punto(dia(2), 1200), punto(dia(20), 1300), punto(dia(30), 227, { partialBucket: true })];
  const plan = [{ desde: dia(1), hasta: null, valor: 2100 }];
  assert.deepEqual(geometriaDelMinigrafico({ ...BASE, puntos, plan }).eje.map((m) => m.valor), [3000, 0]);
  assert.deepEqual(geometriaDelMinigrafico({ ...BASE, puntos, plan, divisionesDelEje: 4 }).eje.map((m) => m.valor), [2500, 0]);
});

test('las fechas del pie reservan su renglón; la primera y la última van siempre, y una del medio solo si no pisa a otra', () => {
  const puntos = [punto(dia(2), 1800), punto(dia(28), 2100)];
  const g = geometriaDelMinigrafico({ ...BASE, puntos, alto: 132, fechas: [dia(1), dia(15), dia(30)] });
  assert.equal(g.caja.abajo, 132 - 8 - 18, 'el dibujo deja el renglón de las fechas');
  assert.deepEqual(g.fechas.map((f) => [f.fecha, f.ancla]), [[dia(1), 'start'], [dia(15), 'middle'], [dia(30), 'end']]);
  for (const p of g.puntos) assert.ok(p.y <= g.caja.abajo + 0.001, 'ningún punto baja al renglón de las fechas');
  // B empezó dos días después que lo leído: su fecha pisaría a la primera, y no se escribe. Las otras dos, sí.
  const pegadas = geometriaDelMinigrafico({ ...BASE, puntos, alto: 132, fechas: [dia(1), dia(3), dia(30)] });
  assert.deepEqual(pegadas.fechas.map((f) => f.fecha), [dia(1), dia(30)]);
  // Una fecha de afuera del período no se escribe, y una repetida va una vez.
  const afuera = geometriaDelMinigrafico({ ...BASE, puntos, alto: 132, fechas: ['2026-08-01', dia(1), dia(1), dia(30)] });
  assert.deepEqual(afuera.fechas.map((f) => f.fecha), [dia(1), dia(30)]);
});

test('el objetivo se dibuja por escalones que no se pisan, y entra en el eje aunque nadie haya registrado ese valor', () => {
  const puntos = [punto(dia(2), 1200), punto(dia(20), 1300)];
  const sinObjetivo = geometriaDelMinigrafico({ ...BASE, puntos });
  const g = geometriaDelMinigrafico({
    ...BASE,
    puntos,
    plan: [
      // Como lo manda la API: el primero termina el día en que empieza el segundo. Ese día tiene un solo valor, el nuevo.
      { desde: '2026-08-15', hasta: dia(15), valor: 2100 },
      // Sigue vigente: llega hasta el final de lo leído.
      { desde: dia(15), hasta: null, valor: 1950 },
    ],
  });
  assert.equal(g.plan.length, 2);
  const [p1, p2] = g.plan;
  assert.ok(Math.abs(p1.x1 - g.caja.izquierda) < 0.01 && Math.abs(p2.x2 - g.caja.derecha) < 0.01, 'de borde a borde');
  assert.ok(Math.abs(p1.x2 - p2.x1) < 0.01, 'el primero termina donde empieza el segundo: el día del cambio tiene un solo valor');
  assert.ok(p1.y < p2.y, '2.100 va más arriba que 1.950');
  // El eje encierra el objetivo: sin él llegaba a 1.300; con él, hasta 2.100 o más.
  assert.ok(sinObjetivo.eje[0].valor < 2100 && g.eje[0].valor >= 2100, `${sinObjetivo.eje[0].valor} → ${g.eje[0].valor}`);
  for (const s of g.plan) assert.ok(s.y >= g.caja.arriba - 0.001 && s.y <= g.caja.abajo + 0.001, 'la línea del objetivo queda adentro del dibujo');
  // Un escalón que terminó antes de lo leído no se dibuja.
  assert.equal(geometriaDelMinigrafico({ ...BASE, puntos, plan: [{ desde: '2026-07-01', hasta: '2026-07-31', valor: 2000 }] }).plan.length, 0);
});

test('DL-161: una serie de carga rápida (tildada sin escribir) es un punto hueco, y sigue en su línea', () => {
  const rapida = { detail: [{ label: 'Cómo se cargó', value: 'Carga rápida, tildada sin escribir' }] };
  const puntos = [punto(dia(2), 60), punto(dia(9), 60, rapida), punto(dia(16), 62.5)];
  const g = geometriaDelMinigrafico({ ...BASE, puntos });
  assert.deepEqual(g.puntos.map((p) => p.hueco), [false, true, false]);
  // Hueca no es más chica: se tiene que ver hueca.
  assert.ok(g.puntos[1].r >= g.puntos[0].r);
  // No es un dato sin completar: la línea la une con las otras dos.
  assert.equal(g.tramos.length, 1);
  assert.equal((g.tramos[0].match(/L/g) ?? []).length, 2);
  // Otro detalle con el mismo rótulo no la vuelve hueca: se reconoce por el rótulo y el valor.
  const otra = geometriaDelMinigrafico({ ...BASE, puntos: [punto(dia(2), 60, { detail: [{ label: 'Cómo se cargó', value: 'Carga completa' }] })] });
  assert.deepEqual(otra.puntos.map((p) => p.hueco), [false]);
});

// ─── TEST-TAG-006 · La gramática de las marcas (WP-TABLERO-ALTA-GAMA, TB-02; DL-163 D-3) ─────────────────────────

const LUGARES = [0.4, 1, 2.7, 4, 6, 10, 24, 80];
const ESTADOS = ['lleno', 'hueco', 'reportado', 'calculado'];

test('TEST-TAG-006 · cada marca con estado tiene su mínimo, a cualquier densidad', () => {
  for (const d of LUGARES) {
    const lleno = medidaDeMarca('lleno', d);
    assert.ok(lleno.R >= 1.25 && lleno.R <= 3.5, `lleno a ${d}: ${lleno.R}`);
    assert.equal(lleno.trazo, 0);
    assert.equal(lleno.halo, d >= 6, 'el halo, solo con lugar de sobra');
    for (const estado of ['hueco', 'reportado', 'calculado']) {
      const m = medidaDeMarca(estado, d);
      assert.ok(m.R >= (estado === 'hueco' ? 2.75 : 3.25), `${estado} a ${d}: ${m.R}`);
      assert.ok(m.R >= lleno.R + 1, 'una marca con estado es más grande que el lleno');
      assert.equal(m.trazo, m.R >= 4 ? 1.5 : 1.25);
      assert.equal(Number((m.r + m.trazo / 2).toFixed(6)), m.R, 'en el SVG va R menos medio trazo');
    }
  }
});

test('TEST-TAG-006 · el lleno se distingue del hueco: el agujero se ve a densidad 1', () => {
  for (const d of LUGARES) {
    const lleno = medidaDeMarca('lleno', d);
    const hueco = medidaDeMarca('hueco', d);
    // El agujero del hueco (su radio menos el trazo) mide por lo menos lo que el punto lleno más chico.
    assert.ok(hueco.R - hueco.trazo >= 1.25, `agujero a ${d}: ${hueco.R - hueco.trazo}`);
    assert.ok(hueco.R - lleno.R >= 1, 'el borde del hueco queda afuera del lleno');
    const reportado = medidaDeMarca('reportado', d);
    assert.ok(reportado.corte, 'lo reportado va cortado');
    assert.ok(Math.abs(reportado.corte[0] * 8 - 2 * Math.PI * reportado.r) < 1e-4, 'cuatro trazos y cuatro cortes iguales');
    const calculado = medidaDeMarca('calculado', d);
    assert.ok(calculado.puntoAdentro !== null && calculado.puntoAdentro >= 0.75 && calculado.puntoAdentro < calculado.r - calculado.trazo / 2);
    assert.equal(hueco.corte, null);
    assert.equal(hueco.puntoAdentro, null);
  }
});

test('TEST-TAG-006 · lo elegido rodea la marca sin taparla; el rombo es del tamaño del hueco', () => {
  for (const d of LUGARES) {
    const hueco = medidaDeMarca('hueco', d);
    for (const estado of ESTADOS) {
      const m = medidaDeMarca(estado, d);
      const aro = medidaDelAro(d);
      assert.ok(aro.r - aro.trazo / 2 - aro.separacion >= m.R, `el aro no pisa la marca ${estado} a ${d}`);
    }
    const rombo = medidaDelRombo(d);
    assert.equal(rombo.mediaDiagonal, Number((hueco.R + 1).toFixed(6)));
    assert.ok(rombo.mediaDiagonal < 2 * hueco.R, 'no es el doble');
    const lleno = medidaDeMarca('lleno', d);
    const raya = rayaDeCorregido(lleno);
    assert.ok(raya.arriba - raya.grueso / 2 > lleno.R, 'la raya de lo corregido va encima, sin tocar la marca');
  }
});

test('TEST-TAG-006 · el estado sale del punto: la clase manda sobre el subtotal', () => {
  assert.equal(estadoDeMarca(punto(dia(1), 10)), 'lleno');
  assert.equal(estadoDeMarca(punto(dia(1), 10, { quality: 'PARTIAL' })), 'hueco');
  assert.equal(estadoDeMarca(punto(dia(1), 10, { partialBucket: true })), 'hueco');
  assert.equal(estadoDeMarca(punto(dia(1), 10, { dataClass: 'REPORTED', quality: 'PARTIAL' })), 'reportado');
  assert.equal(estadoDeMarca(punto(dia(1), 10, { dataClass: 'DERIVED' })), 'calculado');
  assert.equal(LETRA_MINIMA, 12.5);
});

test('TEST-TAG-006 · ningún punto del minigráfico queda fuera del lienzo', () => {
  for (const [dias, ancho] of [
    [7, 120],
    [30, 300],
    [90, 300],
    [365, 260],
  ]) {
    const hasta = '2026-10-10';
    const desde = new Date(mediodia(hasta) - (dias - 1) * 86_400_000).toISOString().slice(0, 10);
    const puntos = Array.from({ length: dias }, (_, i) =>
      punto(new Date(mediodia(desde) + i * 86_400_000).toISOString().slice(0, 10), i % 5 === 0 ? 10 : 2000 + i, i % 3 === 0 ? { quality: 'PARTIAL' } : i % 7 === 0 ? { dataClass: 'REPORTED' } : {}),
    );
    const g = geometriaDelMinigrafico({ ...BASE, desde, hasta, puntos, ancho, alto: 72 });
    for (const p of g.puntos) {
      assert.ok(p.x - p.r >= 0 && p.x + p.r <= ancho && p.y - p.r >= 0 && p.y + p.r <= 72, `${dias} días: ${p.x},${p.y} r ${p.r}`);
      assert.equal(p.r, p.medida.R);
    }
  }
});

// ─── TEST-TAG-007 · El minigráfico del indicador no esconde días (WP-TABLERO-ALTA-GAMA, TB-04; DL-163 D-5) ──────────

const geometria = await import('../apps/web/src/app/pro/advisees/seguimiento/geometria.ts');
const { estadosDeLosDias, geometriaDelIndicador, LUGAR_PARA_MARCAR_CADA_DIA, SEMANAL_CON_MAS_DE_DIAS } = geometria;

const fecha = (desde, i) => new Date(mediodia(desde) + i * 86_400_000).toISOString().slice(0, 10);
/** Un período diario: `forma(i)` da el valor del día i (o null: sin registros) y sus extras. */
function periodo(dias, forma, { hoy = null, ancho = 300 } = {}) {
  const desde = '2026-08-10'; // un lunes
  const hasta = fecha(desde, dias - 1);
  const puntos = [];
  const sinRegistros = [];
  for (let i = 0; i < dias; i++) {
    const f = forma(i);
    if (f === null) sinRegistros.push({ desde: fecha(desde, i), hasta: fecha(desde, i) });
    else puntos.push(punto(fecha(desde, i), f.valor, f.extra ?? {}));
  }
  const entrada = { puntos, sinRegistros, desde, hasta, hoy: hoy ?? hasta, diaria: true, ancho, lienzo: 72, inicioDelPlan: null };
  return { entrada, g: geometriaDelIndicador(entrada), desde, hasta };
}
/** El estado que la tira dibuja en el día i: la celda que cubre su centro. */
function estadoEnLaTira(g, i) {
  const x = g.porDia * (i + 0.5);
  const celda = g.tira.find((c) => x >= c.x - 0.5 && x <= c.x + c.ancho + 0.5);
  return celda?.estado ?? 'nada';
}

test('TEST-TAG-007 · con poco lugar, cada día tiene su celda en la tira con su estado', () => {
  // 90 días en 300 px: 3,3 por día. Días con valor, subtotales y días sin registros mezclados.
  const forma = (i) => (i % 9 === 4 ? null : i % 11 === 6 ? { valor: 900, extra: { quality: 'PARTIAL' } } : { valor: 2000 + (i % 5) * 40 });
  const { entrada, g } = periodo(90, forma);
  assert.ok(g.porDia < LUGAR_PARA_MARCAR_CADA_DIA);
  const esperados = estadosDeLosDias(entrada);
  assert.equal(esperados.length, 90);
  for (let i = 0; i < 90; i++) assert.equal(estadoEnLaTira(g, i), esperados[i].estado, `día ${i}`);
  // Hoy (el último) va marcado debajo.
  assert.ok(g.hoy && g.hoy.x <= g.porDia * 89.5 && g.hoy.x + g.hoy.ancho >= g.porDia * 89.5);
});

test('TEST-TAG-007 · a 90 días la línea es la media de cada semana de BE, con su denominador, y los días van claros', () => {
  const forma = (i) => (i === 3 ? null : { valor: 1000 + i });
  const { g, desde } = periodo(90, forma);
  assert.ok(90 > SEMANAL_CON_MAS_DE_DIAS);
  assert.equal(g.modo, 'semanal');
  // La primera semana (lunes 10 a domingo 16 de agosto): seis días con valor (el jueves no tiene registros).
  const primera = g.semanas[0];
  assert.equal(primera.lunes, desde);
  assert.deepEqual([primera.conValor, primera.dias], [6, 7]);
  assert.equal(primera.valor, Number(((1000 + 1000 + 1 + 1002 + 1004 + 1005 + 1006) / 6).toFixed(6)));
  assert.equal(primera.medida.estado, 'lleno');
  // La semana de hoy va hueca, y hoy queda fuera de su media.
  const ultima = g.semanas.at(-1);
  assert.equal(ultima.medida.estado, 'hueco');
  // Del lunes 2 al sábado 7 de noviembre: seis días en el período, cinco en la media (hoy, el 7, sigue en curso).
  assert.deepEqual([ultima.lunes, ultima.dias, ultima.conValor], ['2026-11-02', 6, 5]);
  assert.ok(g.semanas.every((s) => s.conValor <= s.dias));
  // Cada día con valor, un punto claro detrás; ningún día queda sin dibujar.
  assert.equal(g.puntos.length, 89);
  assert.ok(g.puntos.every((p) => p.claro));
});

test('TEST-TAG-007 · con poco lugar y menos semanas, la línea se corta y llevan marca la última y las aisladas', () => {
  // 30 días en 100 px: 3,3 por día. El día 10 queda solo entre dos días sin registros.
  const forma = (i) => (i === 9 || i === 11 ? null : i === 20 ? { valor: 2050, extra: { quality: 'PARTIAL' } } : { valor: 2000 + i });
  const { g } = periodo(30, forma, { ancho: 100 });
  assert.equal(g.modo, 'pocos');
  // Tres tramos: días 0-8, 12-19 y 21-29 (el 10 está aislado y el 20 está sin completar).
  assert.equal(g.tramos.length, 3);
  const marcados = g.puntos.map((p) => p.clave);
  assert.ok(marcados.includes('p-2026-08-20-t0'), 'la aislada lleva marca');
  assert.ok(marcados.includes('p-2026-09-08-t0'), 'la última lleva marca');
  assert.equal(g.puntos.length, 2, 'las demás van en la línea, sin marca');
});

test('TEST-TAG-007 · con más lugar, todo día con valor tiene su marca', () => {
  const forma = (i) => (i % 6 === 2 ? null : { valor: 2000 + i * 3 });
  const { g, entrada } = periodo(30, forma, { ancho: 300 });
  assert.equal(g.modo, 'todos');
  assert.equal(g.puntos.length, entrada.puntos.length);
});

test('TEST-TAG-007 · lo que cae fuera de la escala es una muesca en su día, contada, y no un punto', () => {
  const forma = (i) => (i === 15 ? { valor: 120, extra: { quality: 'PARTIAL' } } : { valor: 2000 + (i % 4) * 30 });
  const { g } = periodo(30, forma, { ancho: 300 });
  assert.deepEqual(g.fuera, { abajo: 1, arriba: 0 });
  assert.equal(g.muescas.length, 1);
  assert.ok(Math.abs(g.muescas[0].x - g.porDia * 15.5) < 1e-6, 'la muesca va en su día');
  assert.ok(g.muescas[0].abajo);
  assert.ok(!g.puntos.some((p) => p.clave === 'p-2026-08-25-t0'), 'no se ubica en una altura que no es la suya');
});

test('TEST-TAG-007 · con uno a tres días con valor no hay línea ni media', () => {
  const forma = (i) => (i === 2 || i === 5 || i === 6 ? { valor: 1800 + i } : null);
  const { g } = periodo(90, forma);
  assert.equal(g.modo, 'sueltos');
  assert.deepEqual([g.tramos.length, g.semanas.length], [0, 0]);
  assert.equal(g.puntos.length, 3);
});

test('TEST-TAG-007 · la línea no cruza lo sin completar ni une sesiones de otro tramo', () => {
  const sesiones = [punto('2026-09-01', 60), punto('2026-09-03', 62.5), punto('2026-09-05', 65, { segment: 't1' }), punto('2026-09-08', 65, { segment: 't1' })];
  const g = geometriaDelIndicador({ puntos: sesiones, sinRegistros: [], desde: '2026-08-10', hasta: '2026-11-07', hoy: '2026-11-07', diaria: false, ancho: 300, lienzo: 72, inicioDelPlan: null });
  assert.equal(g.modo, 'todos');
  assert.equal(g.tramos.length, 2, 'un tramo por segmento');
  assert.equal(g.tira.length, 0, 'las sesiones no llevan tira');
});

test('TEST-TAG-007 · una diferencia chica no parece un precipicio: la escala mínima de cada unidad', () => {
  const { RANGO_MINIMO_POR_UNIDAD } = geometria;
  const tomas = [punto('2026-08-12', 81.2), punto('2026-09-23', 81.0), punto('2026-11-01', 81.0)];
  const entrada = { puntos: tomas, sinRegistros: [], desde: '2026-08-09', hasta: '2026-11-06', hoy: '2026-11-06', diaria: false, ancho: 290, lienzo: 72, inicioDelPlan: null };
  const sinMinimo = geometriaDelIndicador(entrada);
  const conMinimo = geometriaDelIndicador({ ...entrada, rangoMinimo: RANGO_MINIMO_POR_UNIDAD.kg });
  const salto = (g) => Math.abs(g.puntos[0].y - g.puntos[1].y);
  assert.ok(salto(sinMinimo) > 50, 'sin la escala mínima, −0,2 kg ocupa casi todo el alto');
  assert.ok(salto(conMinimo) < 72 / 8, `con 2 kg de escala, −0,2 kg ocupa menos de un octavo del alto (${salto(conMinimo).toFixed(1)})`);
  assert.deepEqual([RANGO_MINIMO_POR_UNIDAD.kg, RANGO_MINIMO_POR_UNIDAD.cm, RANGO_MINIMO_POR_UNIDAD.mm], [2, 2, 4]);
});
