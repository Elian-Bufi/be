/**
 * La geometría del gráfico de evolución de la APK (`apps/mobile/src/grafico-de-evolucion.ts`): eje temporal a escala,
 * eje vertical con la regla común del website, marcas que no se pisan y el toque que elige una observación. Casos:
 * vacío, una observación, valores iguales, rango estrecho y observaciones cercanas.
 *
 * Uso: node --test scripts/grafico-de-evolucion.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const g = await import('../apps/mobile/src/grafico-de-evolucion.ts');

const ZONA = 'America/Argentina/Buenos_Aires';
const PERIODO = { start: '2026-07-06', end: '2026-10-03' };
const G = { comparabilityGroup: 'cmp-1', protocolVersionId: 'perfil', protocolName: 'Perfil', methodVersionId: null, unit: 'cm' };
let n = 0;
const punto = (instante, value) => ({
  occurredAt: instante,
  recordedAt: instante,
  value,
  unit: 'cm',
  sourceEvaluationId: `ev-${++n}`,
  sourceId: `o-${n}`,
  dataClass: 'MEASURED',
  comparabilityGroup: 'cmp-1',
  correctionState: 'EFFECTIVE',
  incomparableWithPrevious: [],
});
const observaciones = (...puntos) => d.prepararSerie({ metricCode: 'perimetro-cintura', series: puntos, gaps: [], comparability: { groups: [G] } }, ZONA).observaciones;
const componer = (obs, extra = {}) =>
  g.componerGrafico({
    observaciones: obs,
    periodo: PERIODO,
    zonaHoraria: ZONA,
    ancho: 320,
    alto: 220,
    escalaDeLetra: 1,
    anchoDelTexto: (texto, tamano) => texto.length * tamano * 0.56,
    formatoDelValor: (v) => String(v),
    formatoDeLaFecha: (f) => f.slice(5),
    ...extra,
  });

test('el eje temporal está a escala: una toma a mitad del período cae a mitad del ancho útil', () => {
  const { desde, hasta } = d.limitesDelPeriodo(PERIODO, ZONA);
  const mitad = new Date((desde + hasta) / 2).toISOString();
  const c = componer(observaciones(punto(mitad, 86)));
  const centro = (c.area.izquierda + c.area.derecha) / 2;
  assert.ok(Math.abs(c.puntos[0].x - centro) < 0.5);
});

test('el eje vertical usa la regla común: no fuerza el cero y no agranda una diferencia chica', () => {
  const c = componer(observaciones(punto('2026-08-01T13:00:00Z', 85), punto('2026-09-01T13:00:00Z', 85.4)));
  assert.deepEqual(c.dominio, d.dominioDelEjeVertical(85, 85.4));
  assert.ok(c.dominio.desde > 0, 'no arranca en cero');
  // 0,4 cm de diferencia ocupan menos de un décimo del alto útil.
  const altoUtil = c.area.abajo - c.area.arriba;
  assert.ok(Math.abs(c.puntos[0].y - c.puntos[1].y) < altoUtil / 10);
  assert.ok(c.marcasY.length >= 2, 'las marcas muestran el rango');
});

test('una sola observación, o valores iguales: queda centrada en un eje con rango visible', () => {
  for (const obs of [observaciones(punto('2026-09-01T13:00:00Z', 72)), observaciones(punto('2026-08-01T13:00:00Z', 72), punto('2026-09-01T13:00:00Z', 72))]) {
    const c = componer(obs);
    const medio = (c.area.arriba + c.area.abajo) / 2;
    assert.ok(Math.abs(c.puntos[0].y - medio) < 0.5);
    assert.ok(c.marcasY.length >= 2);
  }
});

test('sin observaciones no hay puntos, y el gráfico igual se compone', () => {
  const c = componer([]);
  assert.equal(c.puntos.length, 0);
  assert.ok(c.marcasX.length > 0);
});

test('las marcas verticales son redondas y sin errores de coma', () => {
  assert.deepEqual(g.marcasVerticales(80, 93), [80, 85, 90]);
  assert.deepEqual(g.marcasVerticales(9, 11), [9, 9.5, 10, 10.5, 11]);
  assert.deepEqual(g.marcasVerticales(-1, 2), [-1, 0, 1, 2]);
});

test('con la letra grande, las fechas del eje se saltean para no pisarse', () => {
  const obs = observaciones(punto('2026-08-01T13:00:00Z', 85));
  const normal = componer(obs);
  const grande = componer(obs, { escalaDeLetra: 2 });
  assert.ok(grande.marcasX.length < normal.marcasX.length);
  for (const c of [normal, grande]) for (let i = 1; i < c.marcasX.length; i++) assert.ok(c.marcasX[i].x > c.marcasX[i - 1].x);
});

test('el toque elige la observación más cercana dentro del radio; lejos, ninguna', () => {
  const c = componer(observaciones(punto('2026-09-10T13:00:00Z', 85), punto('2026-09-10T15:00:00Z', 86)));
  const [a, b] = c.puntos;
  assert.equal(g.puntoMasCercano(c, a.x, a.y), 0);
  assert.equal(g.puntoMasCercano(c, b.x, b.y + 2), 1);
  assert.equal(g.puntoMasCercano(c, c.area.izquierda, c.area.arriba), null);
});

test('en la APK, el gráfico y su lista salen de las mismas filas; el gráfico va primero, sin elegir días (DL-118)', () => {
  // filasDelPeriodo (dominio) da las observaciones del grupo elegido con la fecha civil de la zona de la serie, y los
  // huecos recortados al período. El gráfico toma de ahí sus puntos, y la lista, sus filas: no pueden diferir. DL-118
  // retiró la elección de 30, 60 o 90 días que iba antes del gráfico: se ve el período que trajo la lectura.
  const serie = readFileSync(new URL('../apps/mobile/src/serie-de-la-medida.ts', import.meta.url), 'utf8');
  assert.match(serie, /const filas = filasDelPeriodo\(serie, grupo, datos\.period\);/);
  assert.match(serie, /const observaciones = filas\.flatMap\(/);
  const pantalla = readFileSync(new URL('../apps/mobile/src/pantallas/progreso-de-una-medida.tsx', import.meta.url), 'utf8');
  assert.match(pantalla, /<GraficoConFechas observaciones=\{serie\.observaciones\}/);
  assert.match(pantalla, /<ListaDeLaSerie filas=\{serie\.filas\} \/>/);
});

test('DL-118: el gráfico compacto usa las fechas reales, muestra la escala y no se sale, en los anchos y letras de la pantalla', () => {
  const { desde, hasta } = d.limitesDelPeriodo(PERIODO, ZONA);
  const a = (fraccion) => new Date(desde + (hasta - desde) * fraccion).toISOString();
  // Tres observaciones: dos con un día de diferencia y otra mucho después.
  const obs = observaciones(punto(a(0.1), 88), punto(a(0.1 + 86_400_000 / (hasta - desde)), 87.5), punto(a(0.9), 86));
  for (const ancho of [120, 150, 300]) {
    for (const escala of [1, 1.3, 2]) {
      const alto = Math.round(64 + 16 * (escala - 1));
      const c = g.componerGraficoCompacto({ observaciones: obs, periodo: PERIODO, zonaHoraria: ZONA, ancho, alto, escalaDeLetra: escala, anchoDelTexto: (t, s) => t.length * s * 0.56, formatoDelValor: (v) => String(v) });
      const etiqueta = `${ancho} dp ×${escala}`;
      assert.ok(c, etiqueta);
      for (const p of c.puntos) {
        assert.ok(p.x - 5 >= 0 && p.x + 5 <= ancho, `${etiqueta}: un punto se sale en x`);
        assert.ok(p.y - 5 >= 0 && p.y + 5 <= alto, `${etiqueta}: un punto se sale en y`);
      }
      // Fechas reales: el par de un día queda mucho más cerca que el par de meses.
      const [p0, p1, p2] = c.puntos;
      assert.ok(p1.x - p0.x < (p2.x - p1.x) / 20, `${etiqueta}: el eje no está a escala`);
      // La escala se ve: los extremos del dominio, que no fuerza el cero.
      assert.deepEqual(c.marcasY.map((m) => m.valor), [c.dominio.hasta, c.dominio.desde]);
      assert.ok(c.dominio.desde > 0, 'no fuerza el cero');
      assert.deepEqual(c.marcasX.map((m) => m.fecha), [PERIODO.start, PERIODO.end]);
    }
  }
  // Con una sola observación no hay gráfico: el valor ya está escrito.
  assert.equal(g.componerGraficoCompacto({ observaciones: obs.slice(0, 1), periodo: PERIODO, zonaHoraria: ZONA, ancho: 200, alto: 64, escalaDeLetra: 1, anchoDelTexto: () => 10, formatoDelValor: String }), null);
});
