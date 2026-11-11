/**
 * WP-TABLERO-ALTA-GAMA TB-24 (DL-163 D-11) · TEST-TAG-017 · la composición no mezcla métodos, sin React:
 *  1. la columna se parte solo con las dos masas de un mismo método de dos compartimentos que suman el peso de la toma;
 *  2. nunca con métodos distintos (la grasa de uno y la libre de grasa de otro) ni con un método que no suma el peso
 *     (Lee, cuatro componentes), que va en su fila;
 *  3. un cambio de método o de protocolo es una vertical, y ninguna diferencia la cruza;
 *  4. una toma con solo peso es una columna en contorno y no corta la fila del peso;
 *  5. una prueba de propiedad con tomas al azar (con una semilla fija) sobre las cuatro reglas;
 *  6. la tarjeta del Resumen (`laUltimaToma`), los textos (sin «%»), la lectura en tramos de 92 días y la misma vara;
 *  7. TB-51 (D-11, modificada por Dirección el 2026-11-07): la barra de la última toma en kilos con el porcentaje al lado
 *     (`repartoDe`): grasa, músculo y resto solo cuando el método calcula el músculo (De Rose y Guimarães, o Lee); si no,
 *     grasa y libre de grasa; las partes suman el peso, que es el 100 %, y el «%» se escribe en un solo lugar.
 * El dibujo, en las capturas del tablero (`EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/capturas.mjs`).
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const C = await import('../src/app/pro/advisees/seguimiento/composicion.ts');
const { composicionDe, escalaComun, laUltimaToma, particionDe, pesosDeLasTomas, repartoDe, textoDeLaParticion, textoDelReparto, textoDeLasDiferencias, textoDeLasDiferenciasDelReparto, tomasDeLaEvolucion, tramosDeLectura, DOS_COMPARTIMENTOS, MASAS_QUE_NO_SUMAN, TOLERANCIA_DE_LA_SUMA } = C;

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
  'masa-muscular-esqueletica-lee-peso': '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f23',
  'masa-osea-rocha': '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f24',
  'masa-residual-wurch': '3e0b1b56-6e0a-4d1a-8f1a-6a6d2b6a4f25',
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

// ─── TB-51 · la barra en kilos con el porcentaje al lado ─────────────────────────────────────────────────────────

/** De Rose y Guimarães, como lo calcula BE: la grasa y la libre de grasa de Faulkner, la ósea, la residual y el músculo. */
const cuatroC = (peso, grasa, osea, residual) => ({ ...faulkner(peso, grasa), 'masa-osea-rocha': osea, 'masa-residual-wurch': residual, 'masa-muscular-cuatro-componentes': Math.round((peso - grasa - osea - residual) * 10) / 10 });

test('TEST-TAG-017 · TB-51 · sin músculo en el método, la barra es grasa y libre de grasa, con el porcentaje del peso al lado', () => {
  const [t] = tomasDe([{ fecha: '2026-10-06', valores: dw(80.8, 14.2) }]);
  const r = repartoDe(t);
  assert.equal(r.tipo, 'DOS_COMPARTIMENTOS');
  assert.deepEqual(r.partes.map((p) => [p.clave, p.nombre, p.kg, p.porcentaje]), [['grasa', 'Grasa', 14.2, 17.6], ['libre', 'Libre de grasa', 66.6, 82.4]]);
  assert.equal(textoDelReparto(r), '80,8 kg = grasa 14,2 kg (17,6 %) + libre de grasa 66,6 kg (82,4 %)');
  assert.equal(r.resto, null);
  assert.equal(r.metodo, 'Durnin y Womersley, con Siri');
  assert.ok(!r.partes.some((p) => p.clave === 'musculo'), '«Músculo» va solo cuando el método lo calcula');
});

test('TEST-TAG-017 · TB-51 · con De Rose y Guimarães, la barra es grasa, músculo y resto, y el resto es lo óseo y lo residual', () => {
  const [t] = tomasDe([{ fecha: '2026-10-28', valores: cuatroC(98.8, 12.2, 12.9, 23.8) }]);
  const r = repartoDe(t);
  assert.equal(r.tipo, 'CUATRO_COMPONENTES');
  assert.deepEqual(r.partes.map((p) => [p.clave, p.kg, p.porcentaje]), [['grasa', 12.2, 12.3], ['musculo', 49.9, 50.5], ['resto', 36.7, 37.1]]);
  assert.equal(Math.round(r.partes.reduce((a, p) => a + p.kg, 0) * 10) / 10, 98.8, 'las tres partes suman el peso de la toma');
  assert.equal(r.resto, 'El resto es la masa ósea (12,9 kg) y la residual (23,8 kg: órganos, vísceras y líquidos).');
  assert.match(r.metodo, /De Rose y Guimarães.*Faulkner/);
  // Sin la ósea en la toma, el resto se dice igual, sin sus cifras.
  const sinDetalle = { ...cuatroC(98.8, 12.2, 12.9, 23.8) };
  delete sinDetalle['masa-osea-rocha'];
  assert.match(repartoDe(tomasDe([{ fecha: '2026-10-28', valores: sinDetalle }])[0]).resto, /^El resto es la masa ósea y la residual/);
  // Sin la grasa de Faulkner no hay cuatro componentes: la ecuación la resta, y otra grasa no la reemplaza.
  const sinGrasa = { ...dw(98.8, 15.0), 'masa-muscular-cuatro-componentes': 49.9 };
  assert.equal(repartoDe(tomasDe([{ fecha: '2026-10-28', valores: sinGrasa }])[0]).tipo, 'DOS_COMPARTIMENTOS');
});

test('TEST-TAG-017 · TB-51 · con el músculo de Lee, la grasa del método de la toma, el músculo y el resto por diferencia', () => {
  const [t] = tomasDe([{ fecha: '2026-07-01', valores: { ...dw(83.5, 15.0), 'masa-muscular-esqueletica-lee': 35.2 } }]);
  const r = repartoDe(t);
  assert.equal(r.tipo, 'MUSCULO_DE_LEE');
  assert.deepEqual(r.partes.map((p) => [p.clave, p.kg, p.porcentaje]), [['grasa', 15.0, 18.0], ['musculo', 35.2, 42.2], ['resto', 33.3, 39.9]]);
  assert.equal(r.metodo, 'la grasa, Durnin y Womersley, con Siri; el músculo, Lee, con perímetros');
  assert.match(r.resto, /no es grasa ni músculo esquelético.*por diferencia/);
  // Lee sin una grasa de dos compartimentos en la toma: no hay barra (la grasa no se inventa).
  assert.equal(repartoDe(tomasDe([{ fecha: '2026-07-01', valores: { peso: 83.5, 'masa-muscular-esqueletica-lee': 35.2 } }])[0]), null);
  // Un músculo que no entra en la libre de grasa: no se parte con él.
  assert.equal(repartoDe(tomasDe([{ fecha: '2026-07-01', valores: { ...dw(83.5, 15.0), 'masa-muscular-esqueletica-lee': 70 } }])[0]).tipo, 'DOS_COMPARTIMENTOS');
});

test('TEST-TAG-017 · TB-51 · la tarjeta compara solo dos tomas repartidas igual, y el cambio de reparto lo dice', () => {
  const u = laUltimaToma(tomasDe([
    { fecha: '2026-09-23', valores: cuatroC(99.2, 12.5, 12.9, 23.9) },
    { fecha: '2026-10-28', valores: cuatroC(98.8, 12.2, 12.9, 23.8) },
  ]));
  assert.equal(u.reparto.tipo, 'CUATRO_COMPONENTES');
  assert.equal(textoDeLasDiferenciasDelReparto(u.anterior.reparto, u.reparto), 'peso −0,4 kg · grasa −0,3 kg · músculo sin cambio · resto −0,1 kg');
  // De dos compartimentos a cuatro: no se comparan.
  const cambio = laUltimaToma(tomasDe([{ fecha: '2026-09-23', valores: dw(99.2, 15.3) }, { fecha: '2026-10-28', valores: cuatroC(98.8, 12.2, 12.9, 23.8) }]));
  assert.equal(cambio.anterior, null);
  assert.equal(cambio.cambioDeMetodo, true);
  // Con dos compartimentos, las mismas diferencias que antes de TB-51.
  const [a, b] = tomasDe([{ fecha: '2026-08-18', valores: dw(81.2, 14.7) }, { fecha: '2026-09-29', valores: dw(80.8, 14.2) }]).map((t) => repartoDe(t));
  assert.equal(textoDeLasDiferenciasDelReparto(a, b), 'peso −0,4 kg · grasa −0,5 kg · libre de grasa +0,1 kg');
});

test('TEST-TAG-017 · TB-51 · propiedad: las partes suman el peso, el porcentaje es el de cada parte y «Músculo» sale solo de un método que lo calcula', () => {
  const r = azar(20261107);
  for (let caso = 0; caso < 400; caso++) {
    const peso = Math.round((55 + r() * 50) * 10) / 10;
    const grasa = Math.round(peso * (0.08 + r() * 0.3) * 10) / 10;
    const valores = { peso };
    const forma = r();
    if (forma < 0.25) Object.assign(valores, dw(peso, grasa));
    else if (forma < 0.45) Object.assign(valores, faulkner(peso, grasa));
    else if (forma < 0.7) Object.assign(valores, cuatroC(peso, grasa, Math.round((8 + r() * 6) * 10) / 10, Math.round(peso * 0.241 * 10) / 10));
    else if (forma < 0.9) Object.assign(valores, dw(peso, grasa), { [r() < 0.5 ? 'masa-muscular-esqueletica-lee' : 'masa-muscular-esqueletica-lee-peso']: Math.round(peso * (0.2 + r() * 0.6) * 10) / 10 });
    else if (r() < 0.5) valores['masa-muscular-esqueletica-lee'] = 30;
    const [t] = tomasDe([{ fecha: '2026-10-01', valores }]);
    const rep = repartoDe(t);
    if (!rep) {
      assert.ok(!t.datos.has('masa-grasa-durnin-womersley') && !t.datos.has('masa-grasa-faulkner'), `caso ${caso}: sin barra, solo sin una grasa con que partir`);
      continue;
    }
    const suma = rep.partes.reduce((a, p) => a + p.kg, 0);
    assert.ok(Math.abs(suma - peso) <= TOLERANCIA_DE_LA_SUMA + 1e-9, `caso ${caso}: las partes suman el peso (${suma} y ${peso})`);
    for (const p of rep.partes) {
      assert.ok(p.kg > 0, `caso ${caso}: ${p.clave} positiva`);
      assert.equal(p.porcentaje, Math.round((p.kg / peso) * 1000) / 10, `caso ${caso}: el porcentaje de ${p.clave} es del peso de esa toma`);
    }
    const conMusculo = rep.partes.some((p) => p.clave === 'musculo');
    const calculaMusculo = t.datos.has('masa-muscular-cuatro-componentes') || t.datos.has('masa-muscular-esqueletica-lee') || t.datos.has('masa-muscular-esqueletica-lee-peso');
    if (conMusculo) assert.ok(calculaMusculo, `caso ${caso}: «Músculo» sale de un método que lo calcula`);
    assert.deepEqual(rep.partes.map((p) => p.clave), conMusculo ? ['grasa', 'musculo', 'resto'] : ['grasa', 'libre'], `caso ${caso}: grasa, músculo y resto, o grasa y libre de grasa`);
    if (rep.tipo === 'CUATRO_COMPONENTES') assert.equal(rep.partes[0].kg, t.datos.get('masa-grasa-faulkner').valor, `caso ${caso}: la grasa de cuatro componentes es la de Faulkner`);
  }
});

test('TEST-TAG-017 · TB-51 · el «%» va solo junto a los kilos de cada parte, y los textos no califican', () => {
  const [t] = tomasDe([{ fecha: '2026-10-28', valores: cuatroC(98.8, 12.2, 12.9, 23.8) }]);
  const rep = repartoDe(t);
  assert.equal(C.porcentajeEnPalabras(12.3), '12,3 %');
  assert.equal(C.parteEnPalabras(rep.partes[1]), 'músculo 49,9 kg (50,5 %)');
  // Cada «%» del reparto sigue a una cifra, y cada parte tiene sus kilos antes de su porcentaje.
  assert.deepEqual(textoDelReparto(rep).match(/\d+,\d %/g), ['12,3 %', '50,5 %', '37,1 %']);
  assert.equal(textoDelReparto(rep), '98,8 kg = grasa 12,2 kg (12,3 %) + músculo 49,9 kg (50,5 %) + resto 36,7 kg (37,1 %)');
  for (const texto of [rep.resto, rep.metodo, textoDelReparto(rep)]) assert.doesNotMatch(texto, /\bbien\b|\bmal\b|normal|ideal|saludable|exceso/i, texto);
  // El «%» de la composición se escribe en un solo lugar del código (fuera de los comentarios).
  const codigo = readFileSync(new URL('../src/app/pro/advisees/seguimiento/composicion.ts', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l));
  assert.deepEqual(codigo.filter((l) => l.includes('%')).map((l) => l.trim().slice(0, 40)), ['export const porcentajeEnPalabras = (x: '], 'un solo literal con «%»: porcentajeEnPalabras');
});
