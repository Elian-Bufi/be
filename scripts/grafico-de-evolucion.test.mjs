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

test('DL-118, con la forma del ejemplo de Dirección (2026-10-05): fechas reales, tres líneas de referencia, la toma bajo cada punto y los valores en fila', () => {
  const { desde, hasta } = d.limitesDelPeriodo(PERIODO, ZONA);
  const a = (fraccion) => new Date(desde + (hasta - desde) * fraccion).toISOString();
  // Tres observaciones: dos con un día de diferencia y otra mucho después. La T3 no tiene la medida: es un hueco.
  const obs = observaciones(punto(a(0.1), 88), punto(a(0.1 + 86_400_000 / (hasta - desde)), 87.5), punto(a(0.9), 86));
  const tomas = ['T1', 'T2', 'T4'];
  const anchoDelTexto = (t, s) => t.length * s * 0.56;
  for (const ancho of [120, 150, 300]) {
    for (const escala of [1, 1.3, 2]) {
      for (const elegida of [0, 1, 2, null]) {
        const alto = Math.round(96 + 28 * (escala - 1));
        const c = g.componerGraficoCompacto({ observaciones: obs, tomas, elegida, periodo: PERIODO, zonaHoraria: ZONA, ancho, alto, escalaDeLetra: escala, anchoDelTexto, formatoDelValor: (v) => String(v) });
        const etiqueta = `${ancho} dp ×${escala}, elegida ${elegida}`;
        assert.ok(c, etiqueta);
        // Ningún punto se sale ni baja hasta la fila de las tomas.
        const r = g.RADIO_COMPACTO_ELEGIDA;
        for (const p of c.puntos) {
          assert.ok(p.x - r >= 0 && p.x + r <= ancho, `${etiqueta}: un punto se sale en x`);
          assert.ok(p.y - r >= 0 && p.y + r <= alto - 11 * escala, `${etiqueta}: un punto se sale en y o pisa las tomas`);
        }
        // Fechas reales: el par de un día queda mucho más cerca que el par de meses. No es el orden de las tomas.
        const [p0, p1, p2] = c.puntos;
        assert.ok(p1.x - p0.x < (p2.x - p1.x) / 20, `${etiqueta}: el eje no está a escala`);
        // Tres líneas de referencia: los extremos del dominio, que no fuerza el cero, y el medio, redondo y entre ellos.
        const [arriba, medio, abajo] = c.marcasY.map((m) => m.valor);
        assert.equal(arriba, c.dominio.hasta);
        assert.equal(abajo, c.dominio.desde);
        assert.ok(Number.isInteger(medio) && medio > abajo && medio < arriba, `${etiqueta}: la línea del medio`);
        assert.ok(c.dominio.desde > 0, 'no fuerza el cero');
        // La toma bajo cada punto: la de su observación, en orden, adentro y sin pisarse; la elegida, siempre.
        const letra = 11 * escala;
        for (const t of c.tomas) {
          const medioAncho = anchoDelTexto(t.texto, letra) / 2;
          assert.equal(t.texto, tomas[t.indice]);
          assert.ok(t.x - medioAncho >= -1e-9 && t.x + medioAncho <= ancho + 1e-9, `${etiqueta}: la toma ${t.texto} se sale`);
        }
        for (let i = 1; i < c.tomas.length; i++) {
          const izquierda = c.tomas[i - 1];
          const derecha = c.tomas[i];
          assert.ok(derecha.x - anchoDelTexto(derecha.texto, letra) / 2 >= izquierda.x + anchoDelTexto(izquierda.texto, letra) / 2, `${etiqueta}: ${izquierda.texto} y ${derecha.texto} se pisan`);
        }
        if (elegida !== null) assert.ok(c.tomas.some((t) => t.indice === elegida), `${etiqueta}: falta la toma elegida`);
        assert.ok(c.tomas.some((t) => t.indice === 2), `${etiqueta}: la última, lejos de las otras, siempre entra`);
        // Los valores en fila, en el orden de los puntos.
        assert.deepEqual(c.valores, ['88', '87.5', '86']);
      }
    }
  }
  // T1 y T2 quedan a un día: no entran las dos, y gana la elegida.
  const conLaT2 = g.componerGraficoCompacto({ observaciones: obs, tomas, elegida: 1, periodo: PERIODO, zonaHoraria: ZONA, ancho: 300, alto: 96, escalaDeLetra: 1, anchoDelTexto, formatoDelValor: String });
  assert.deepEqual(conLaT2.tomas.map((t) => t.texto), ['T2', 'T4']);
  // Con una sola observación no hay gráfico: el valor ya está escrito.
  assert.equal(g.componerGraficoCompacto({ observaciones: obs.slice(0, 1), tomas: ['T1'], elegida: 0, periodo: PERIODO, zonaHoraria: ZONA, ancho: 200, alto: 96, escalaDeLetra: 1, anchoDelTexto: () => 10, formatoDelValor: String }), null);
});

test('los gráficos de Mi evolución no unen los puntos: no hay líneas, áreas ni tendencias (REG-06-166, DL-118)', () => {
  // El ejemplo de Dirección del 2026-10-05 une los puntos con una línea: eso no se toma. Una línea entre dos tomas sugiere
  // valores que nadie midió. Las únicas líneas son las de referencia y la guía del punto elegido.
  for (const archivo of ['progreso-de-una-medida.tsx', 'progreso.tsx', 'indicadores.tsx']) {
    const fuente = readFileSync(new URL(`../apps/mobile/src/pantallas/${archivo}`, import.meta.url), 'utf8');
    assert.doesNotMatch(fuente, /Polyline|Polygon|<Path\b/, `${archivo} dibuja un trazo entre puntos`);
  }
});
