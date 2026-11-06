/**
 * WP-TABLERO-ALTA-GAMA TB-24 (DL-163 D-11) · TEST-TAG-017 · la composición no mezcla métodos, sin React:
 *  1. la columna se parte solo con las dos masas de un mismo método de dos compartimentos que suman el peso de la toma;
 *  2. nunca con métodos distintos (la grasa de uno y la libre de grasa de otro) ni con un método que no suma el peso
 *     (Lee, cuatro componentes), que va en su fila;
 *  3. un cambio de método o de protocolo es una vertical, y ninguna diferencia la cruza;
 *  4. una toma con solo peso es una columna en contorno y no corta la fila del peso;
 *  5. una prueba de propiedad con tomas al azar (con una semilla fija) sobre las cuatro reglas;
 *  6. la tarjeta del Resumen (`laUltimaToma`), los textos (sin «%»), la lectura en tramos de 92 días y la misma vara.
 * El dibujo, en las capturas del tablero (`EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/capturas.mjs`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import test from 'node:test';

const C = await import('../src/app/pro/advisees/seguimiento/composicion.ts');
const { composicionDe, escalaComun, laUltimaToma, particionDe, pesosDeLasTomas, textoDeLaParticion, textoDeLasDiferencias, tomasDeLaEvolucion, tramosDeLectura, DOS_COMPARTIMENTOS, MASAS_QUE_NO_SUMAN, TOLERANCIA_DE_LA_SUMA } = C;

const ZONA = 'America/Argentina/Buenos_Aires';
const ID = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const PROTOCOLO = ID(900);
const OTRO_PROTOCOLO = ID(901);
/** Las versiones de método del catálogo (nombres-de-metricas.ts): DW hombres, Faulkner y Lee. */
const METODO = {
  'masa-grasa-durnin-womersley': '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f29',
  'masa-libre-de-grasa-durnin-womersley': '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f2b',
  'masa-grasa-faulkner': '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f1c',
  'masa-libre-de-grasa-faulkner': '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f1d',
  'masa-muscular-esqueletica-lee': '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f22',
  'masa-muscular-cuatro-componentes': '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f21',
};

let siguiente = 1;
/**
 * Una respuesta de API-ANT-06 armada como la arma la API: un bloque por métrica, cada punto con su evaluación y su grupo
 * de comparabilidad (protocolo, método y unidad), con nombres de grupo propios de la respuesta.
 * `tomas`: [{ fecha, valores: { metrica: valor }, protocolo?, metodos?: { metrica: versión } }].
 */
function respuesta(tomas, { prefijo = 'cmp', parcial = false } = {}) {
  const porMetrica = new Map();
  const grupos = new Map();
  for (const t of tomas) {
    t.evaluacion ??= ID(siguiente++);
    for (const [metrica, valor] of Object.entries(t.valores)) {
      const metodo = metrica === 'peso' ? null : (t.metodos?.[metrica] ?? METODO[metrica] ?? null);
      const protocolo = t.protocolo ?? PROTOCOLO;
      const clave = `${protocolo}|${metodo ?? ''}|kg`;
      if (!grupos.has(clave)) grupos.set(clave, { comparabilityGroup: `${prefijo}-${grupos.size + 1}`, protocolVersionId: protocolo, protocolName: 'ISAK', methodVersionId: metodo, unit: 'kg' });
      const lista = porMetrica.get(metrica) ?? [];
      lista.push({
        occurredAt: `${t.fecha}T12:00:00.000Z`,
        recordedAt: `${t.fecha}T12:30:00.000Z`,
        value: valor,
        unit: 'kg',
        sourceEvaluationId: t.evaluacion,
        sourceId: ID(siguiente++),
        dataClass: metrica === 'peso' ? 'MEASURED' : 'DERIVED',
        comparabilityGroup: grupos.get(clave).comparabilityGroup,
        correctionState: 'EFFECTIVE',
        incomparableWithPrevious: [],
      });
      porMetrica.set(metrica, lista);
    }
  }
  const fechas = tomas.map((t) => t.fecha).sort();
  return {
    adviseeId: ID(1),
    period: { start: fechas[0] ?? '2026-01-01', end: fechas.at(-1) ?? '2026-01-01', timeZone: ZONA },
    metrics: [...porMetrica.entries()].map(([metricCode, series]) => ({
      metricCode,
      series,
      gaps: [],
      comparability: { groups: [...grupos.values()].filter((g) => series.some((p) => p.comparabilityGroup === g.comparabilityGroup)) },
    })),
    partialView: parcial,
    honesty: { interpolated: false, imputed: false, carriedForward: false },
  };
}
const dw = (peso, grasa) => ({ peso, 'masa-grasa-durnin-womersley': grasa, 'masa-libre-de-grasa-durnin-womersley': Math.round((peso - grasa) * 10) / 10 });
const faulkner = (peso, grasa) => ({ peso, 'masa-grasa-faulkner': grasa, 'masa-libre-de-grasa-faulkner': Math.round((peso - grasa) * 10) / 10 });
const tomasDe = (lista, opciones) => tomasDeLaEvolucion([respuesta(lista, opciones)]).tomas;

test('TEST-TAG-017 · la columna se parte solo con las dos masas de un método de dos compartimentos que suman el peso', () => {
  const [t] = tomasDe([{ fecha: '2026-10-06', valores: dw(80.8, 14.2) }]);
  const p = particionDe(t, 'DURNIN_WOMERSLEY');
  assert.deepEqual([p.peso, p.libre, p.grasa, p.familia], [80.8, 66.6, 14.2, 'DURNIN_WOMERSLEY']);
  assert.equal(particionDe(t, 'FAULKNER'), null, 'con Faulkner no hay masas: no se parte');
  const c = composicionDe([t]);
  assert.equal(c.familia, 'DURNIN_WOMERSLEY');
  assert.equal(c.columnas[0].particion.libre + c.columnas[0].particion.grasa, 80.8);
  assert.equal(c.unaSola, true, 'con una sola toma partida, el cambio aparece con la segunda');
  assert.equal(textoDeLaParticion(p), '80,8 kg = 66,6 libre de grasa + 14,2 grasa');
});

test('TEST-TAG-017 · nunca se parte con métodos distintos ni con un método que no suma el peso', () => {
  const tomas = tomasDe([
    // La grasa de Durnin y Womersley con la libre de grasa de Faulkner: suman el peso, pero son dos métodos.
    { fecha: '2026-06-01', valores: { peso: 84, 'masa-grasa-durnin-womersley': 15.3, 'masa-libre-de-grasa-faulkner': 68.7 } },
    // Lee no suma el peso: aunque esté con la grasa, la columna no se parte, y Lee va en su fila.
    { fecha: '2026-07-01', valores: { peso: 83.5, 'masa-grasa-durnin-womersley': 15.0, 'masa-muscular-esqueletica-lee': 68.5 } },
    // Las dos masas de un método que no suman el peso de la toma (calculadas sobre otro peso).
    { fecha: '2026-08-01', valores: { peso: 83.0, 'masa-grasa-durnin-womersley': 14.8, 'masa-libre-de-grasa-durnin-womersley': 66.0 } },
  ]);
  const c = composicionDe(tomas);
  assert.equal(c.familia, null, 'ninguna toma tiene un método que la parta');
  assert.ok(c.columnas.every((x) => x.particion === null && x.sinPartir === 'NO_SUMA'));
  for (const t of tomas) for (const f of Object.keys(DOS_COMPARTIMENTOS)) assert.equal(particionDe(t, f), null);
  // Lee nunca es una parte de la columna: con un método que sí parte, sigue en su fila y dice que no suma.
  const conMetodo = composicionDe(tomasDe([
    { fecha: '2026-07-01', valores: { ...dw(83.5, 15.0), 'masa-muscular-esqueletica-lee': 35.2 } },
    { fecha: '2026-08-01', valores: { ...dw(83.0, 14.6), 'masa-muscular-esqueletica-lee': 35.4 } },
  ]));
  const lee = conMetodo.filas.find((f) => f.clave === 'masa-muscular-esqueletica-lee');
  assert.equal(lee.suma, false);
  assert.equal(lee.diferencia, 0.2);
  for (const col of conMetodo.columnas) assert.equal(Math.round((col.particion.libre + col.particion.grasa) * 10) / 10, col.peso, 'la columna es libre + grasa, sin Lee');
  assert.ok(MASAS_QUE_NO_SUMAN.includes('masa-muscular-cuatro-componentes'));
});

test('TEST-TAG-017 · un cambio de método corta las diferencias: ninguna cruza la vertical', () => {
  const tomas = tomasDe([
    { fecha: '2026-03-02', valores: dw(86.0, 17.0) },
    { fecha: '2026-04-13', valores: dw(85.2, 16.4) },
    { fecha: '2026-06-09', valores: faulkner(84.0, 12.6) },
    { fecha: '2026-07-21', valores: faulkner(83.1, 12.0) },
  ]);
  const c = composicionDe(tomas);
  assert.equal(c.familia, 'FAULKNER', 'el de la toma partida más reciente');
  assert.deepEqual(c.cambios, [{ fecha: '2026-06-09', motivo: 'METODO' }]);
  assert.deepEqual(c.entre, { desde: '2026-06-09', hasta: '2026-07-21' });
  const grasa = c.filas.find((f) => f.clave === 'grasa');
  assert.equal(grasa.diferencia, -0.6, 'la diferencia es entre las dos de Faulkner, no desde la de Durnin y Womersley');
  // Las de Durnin y Womersley van sin partir en el gráfico de Faulkner, con su método escrito.
  assert.deepEqual(c.columnas.slice(0, 2).map((x) => [x.particion, x.sinPartir, x.otroMetodo]), [[null, 'OTRO_METODO', 'DURNIN_WOMERSLEY'], [null, 'OTRO_METODO', 'DURNIN_WOMERSLEY']]);
  // Eligiendo Durnin y Womersley, el gráfico es el suyo, y sus diferencias tampoco cruzan.
  const d = composicionDe(tomas, 'DURNIN_WOMERSLEY');
  assert.deepEqual(d.entre, { desde: '2026-03-02', hasta: '2026-04-13' });
  assert.equal(d.filas.find((f) => f.clave === 'peso').diferencia, -0.8);
  // Un cambio de protocolo con el mismo método también corta.
  const p = composicionDe(tomasDe([
    { fecha: '2026-03-02', valores: dw(86.0, 17.0) },
    { fecha: '2026-04-13', valores: dw(85.2, 16.4), protocolo: OTRO_PROTOCOLO },
    { fecha: '2026-05-25', valores: dw(84.9, 16.0), protocolo: OTRO_PROTOCOLO },
  ]));
  assert.deepEqual(p.cambios, [{ fecha: '2026-04-13', motivo: 'PROTOCOLO' }]);
  assert.deepEqual(p.entre, { desde: '2026-04-13', hasta: '2026-05-25' });
});

test('TEST-TAG-017 · una toma con solo peso es una columna en contorno y no corta la fila del peso', () => {
  const c = composicionDe(tomasDe([
    { fecha: '2026-08-04', valores: dw(81.6, 15.0) },
    { fecha: '2026-08-29', valores: { peso: 81.2 } },
    { fecha: '2026-09-29', valores: dw(81.2, 14.7) },
  ]));
  assert.deepEqual(c.columnas.map((x) => [x.particion !== null, x.sinPartir]), [[true, null], [false, 'SOLO_PESO'], [true, null]]);
  const peso = c.filas.find((f) => f.clave === 'peso');
  assert.equal(peso.puntos.length, 3, 'la toma con solo peso está en la fila del peso');
  assert.equal(new Set(peso.puntos.map((x) => x.tramo)).size, 1, 'y no la corta');
  assert.equal(c.filas.find((f) => f.clave === 'grasa').puntos.length, 2, 'la grasa, solo de las partidas');
  assert.deepEqual(c.entre, { desde: '2026-08-04', hasta: '2026-09-29' });
  assert.equal(c.cambios.length, 0);
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
const sumarDias = (civil, n) => new Date(Date.parse(`${civil}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

test('TEST-TAG-017 · propiedad: con tomas al azar, toda columna partida es de un solo método que suma el peso, y ninguna diferencia cruza un cambio', () => {
  const r = azar(20261106);
  const metricas = ['masa-grasa-durnin-womersley', 'masa-libre-de-grasa-durnin-womersley', 'masa-grasa-faulkner', 'masa-libre-de-grasa-faulkner', ...MASAS_QUE_NO_SUMAN];
  for (let caso = 0; caso < 300; caso++) {
    let fecha = '2025-11-10';
    const lista = [];
    for (let i = 0; i < 2 + Math.floor(r() * 9); i++) {
      fecha = sumarDias(fecha, 14 + Math.floor(r() * 40));
      const peso = Math.round((60 + r() * 40) * 10) / 10;
      const grasa = Math.round(peso * (0.1 + r() * 0.25) * 10) / 10;
      const valores = { peso };
      const forma = r();
      if (forma < 0.35) Object.assign(valores, dw(peso, grasa));
      else if (forma < 0.6) Object.assign(valores, faulkner(peso, grasa));
      else if (forma < 0.85) for (const m of metricas) if (r() < 0.4) valores[m] = Math.round((m.includes('grasa-') && !m.includes('libre') ? grasa : peso - grasa + (r() < 0.3 ? 1.5 : 0)) * 10) / 10;
      lista.push({ fecha, valores, protocolo: r() < 0.1 ? OTRO_PROTOCOLO : PROTOCOLO });
    }
    const tomas = tomasDe(lista);
    for (const pedida of [null, 'DURNIN_WOMERSLEY', 'FAULKNER']) {
      const c = composicionDe(tomas, pedida);
      for (const col of c.columnas) {
        if (!col.particion) continue;
        const t = tomas.find((x) => x.evaluacionId === col.evaluacionId);
        const { grasa, libre } = DOS_COMPARTIMENTOS[col.particion.familia];
        assert.equal(col.particion.familia, c.familia, 'una columna partida es del método que se mira');
        assert.equal(t.datos.get(grasa).valor, col.particion.grasa);
        assert.equal(t.datos.get(libre).valor, col.particion.libre);
        assert.ok(Math.abs(col.particion.grasa + col.particion.libre - col.peso) <= TOLERANCIA_DE_LA_SUMA, 'las dos partes suman el peso');
        assert.ok(!MASAS_QUE_NO_SUMAN.includes(grasa) && !MASAS_QUE_NO_SUMAN.includes(libre), 'lo que no suma el peso nunca es una parte');
      }
      // Una toma con las dos masas de un método que suman el peso siempre se parte con ese método, si es el que se mira.
      for (const t of tomas) if (c.familia && particionDe(t, c.familia)) assert.ok(c.columnas.find((x) => x.evaluacionId === t.evaluacionId).particion);
      if (c.entre) {
        assert.ok(!c.cambios.some((m) => m.fecha > c.entre.desde && m.fecha <= c.entre.hasta), `una diferencia cruza un cambio (caso ${caso})`);
        const filas = c.filas.filter((f) => f.suma);
        assert.ok(filas.every((f) => f.desde.fecha === c.entre.desde && f.hasta.fecha === c.entre.hasta), 'las tres filas, con las mismas fechas');
      }
    }
  }
});

test('la tarjeta del Resumen: la última toma partida y lo que cambió desde la anterior del mismo método', () => {
  const u = laUltimaToma(tomasDe([
    { fecha: '2026-08-18', valores: dw(81.2, 14.7) },
    { fecha: '2026-09-29', valores: dw(80.8, 14.2) },
  ]));
  assert.equal(u.fecha, '2026-09-29');
  assert.equal(u.anterior.fecha, '2026-08-18');
  assert.equal(textoDeLasDiferencias(u.anterior.particion, u.particion), 'peso −0,4 kg · grasa −0,5 kg · libre de grasa +0,1 kg');
  // Con un cambio de método entre las dos, no hay diferencias.
  const conCambio = laUltimaToma(tomasDe([
    { fecha: '2026-08-18', valores: faulkner(81.2, 12.2) },
    { fecha: '2026-09-29', valores: dw(80.8, 14.2) },
  ]));
  assert.equal(conCambio.anterior, null);
  assert.equal(conCambio.cambioDeMetodo, true);
  // Una toma posterior con solo peso se dice aparte; sin ninguna partida, no hay barra y queda la línea de los pesos.
  const despues = laUltimaToma(tomasDe([{ fecha: '2026-09-29', valores: dw(80.8, 14.2) }, { fecha: '2026-10-20', valores: { peso: 80.5 } }]));
  assert.deepEqual(despues.despues, { fecha: '2026-10-20', peso: 80.5 });
  const sinMetodo = tomasDe([{ fecha: '2026-09-29', valores: { peso: 85.6 } }, { fecha: '2026-10-27', valores: { peso: 85.4 } }]);
  assert.equal(laUltimaToma(sinMetodo), null);
  assert.equal(pesosDeLasTomas(sinMetodo).length, 2);
});

test('los textos ubican: sin «%», sin «bien» ni «mal», con el signo y la unidad', () => {
  const [a, b] = tomasDe([{ fecha: '2026-08-18', valores: dw(81.2, 14.7) }, { fecha: '2026-09-29', valores: dw(81.2, 14.2) }]).map((t) => particionDe(t, 'DURNIN_WOMERSLEY'));
  const textos = [textoDeLaParticion(a), textoDeLasDiferencias(a, b), C.UNA_SOLA_TOMA, C.NO_SUMA_CON_LAS_OTRAS, ...Object.values(C.TEXTO_SIN_PARTIR), ...Object.values(C.TEXTO_DEL_CAMBIO)];
  assert.equal(textoDeLasDiferencias(a, b), 'peso sin cambio · grasa −0,5 kg · libre de grasa +0,5 kg');
  assert.equal(C.unDecimal(17), '17,0', 'los kilos van siempre con un decimal, como los calcula el método');
  for (const t of textos) assert.doesNotMatch(t, /%|por ciento|\bbien\b|\bmal\b|normal|ideal/i, t);
});

test('la lectura en tramos de 92 días cubre el período sin huecos ni solapes, y las respuestas se juntan por lo que son', () => {
  const tramos = tramosDeLectura('2025-11-07', '2026-11-06');
  assert.equal(tramos.length, 4);
  assert.equal(tramos[0].desde, '2025-11-07');
  assert.equal(tramos.at(-1).hasta, '2026-11-06');
  for (let i = 1; i < tramos.length; i++) assert.equal(sumarDias(tramos[i - 1].hasta, 1), tramos[i].desde);
  for (const t of tramos) assert.ok((Date.parse(t.hasta) - Date.parse(t.desde)) / 86400000 + 1 <= 92);
  assert.deepEqual(tramosDeLectura('2026-10-01', '2026-10-01'), [{ desde: '2026-10-01', hasta: '2026-10-01' }]);
  // Dos respuestas con los mismos grupos nombrados distinto: una sola clave de comparabilidad, sin un cambio de método.
  const { tomas } = tomasDeLaEvolucion([respuesta([{ fecha: '2026-06-01', valores: dw(84, 15) }], { prefijo: 'cmp' }), respuesta([{ fecha: '2026-09-01', valores: dw(83, 14.5) }], { prefijo: 'otro' })]);
  const c = composicionDe(tomas);
  assert.equal(c.cambios.length, 0);
  assert.deepEqual(c.entre, { desde: '2026-06-01', hasta: '2026-09-01' });
  assert.equal(tomasDeLaEvolucion([respuesta([{ fecha: '2026-06-01', valores: { peso: 80 } }], { parcial: true })]).parcial, true);
});

test('«Cuánto cambió cada parte» usa la misma vara en todas las filas', () => {
  const escalas = escalaComun([{ puntos: [{ valor: 84 }, { valor: 80.8 }] }, { puntos: [{ valor: 15.3 }, { valor: 14.2 }] }, { puntos: [{ valor: 66.6 }, { valor: 66.6 }] }]);
  const largos = escalas.map((e) => Math.round((e.arriba - e.abajo) * 1000) / 1000);
  assert.deepEqual(largos, [3.2, 3.2, 3.2], 'un kilo mide lo mismo en cada fila');
  assert.ok(escalas.every((e, i) => e.abajo <= [80.8, 14.2, 66.6][i] + 1e-9 && e.arriba >= [84, 15.3, 66.6][i] - 1e-9), 'cada fila entra en su escala');
  assert.deepEqual(escalaComun([{ puntos: [{ valor: 70 }] }]).map((e) => e.arriba - e.abajo), [2], 'nunca más angosta que 2 kg');
});
