/**
 * La composición de la figura de la toma en el teléfono (`apps/mobile/src/composicion-de-la-figura.ts`). Se verifica que:
 * - los sitios no se mueven: cada uno queda donde lo pone la lámina, en los dos modos (DL-113);
 * - con la letra de siempre van las tarjetas del compositor, con sus grupos y su orden;
 * - con la letra grande la figura pasa a números, que bajan en orden por la columna, y la lista los repite;
 * - cada fila mide lo que su texto necesita con la letra de la persona;
 * - las tarjetas no se superponen y las guías van de su tarjeta a su sitio.
 * - las filas que eligen un sitio dicen al lector de pantalla su rol y si están elegidas (selección coordinada).
 * - mapa corporal: con más de una toma, cada fila lleva su gráfico chico, sin desbordar ni mover ningún sitio; y la
 *   familia que se dibuja es la que la toma tiene.
 * - el encuadre (pulido del 2026-10-04): el cuerpo es grande, empieza arriba, va a la derecha y lo recorta el borde, sin
 *   dejar afuera ningún sitio; su tamaño no cambia con la cantidad de medidas.
 * El mismo módulo dibuja la APK y la maqueta del navegador.
 *
 * Uso: node --test scripts/composicion-de-la-figura.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const c = await import('../apps/mobile/src/composicion-de-la-figura.ts');
const graficos = await import('../apps/mobile/src/graficos-por-toma.ts');

/** Una toma sintética con todos los sitios de la figura y una diferencia en cada uno. */
const VALORES = {
  'perimetro-cuello': 38, 'perimetro-hombros': 116, 'perimetro-pecho': 98, 'perimetro-brazo-relajado': 32, 'perimetro-brazo-flexionado': 34.5,
  'perimetro-antebrazo': 28, 'perimetro-muneca': 17, 'perimetro-cintura': 84, 'perimetro-abdomen': 86, 'perimetro-cadera': 98,
  'perimetro-muslo': 56, 'perimetro-pantorrilla': 37, 'perimetro-tobillo': 22,
  'pliegue-pectoral': 9, 'pliegue-axilar-media': 11, 'pliegue-triceps': 10, 'pliegue-subescapular': 12, 'pliegue-antebrazo': 5,
  'pliegue-supraespinal': 8, 'pliegue-biceps': 6, 'pliegue-cresta-iliaca': 13, 'pliegue-abdominal': 15, 'pliegue-muslo-frontal': 14, 'pliegue-pantorrilla': 7,
};
const MEDIDAS = Object.entries(VALORES).map(([metrica, value]) => ({
  metrica,
  nombre: metrica,
  actual: { punto: { value, unit: metrica.startsWith('pliegue') ? 'mm' : 'cm' } },
  anterior: null,
  diferencia: { delta: -0.5, unidad: '', dias: 7 },
}));
const CASOS = ['HOMBRE', 'MUJER'].flatMap((sexo) => ['PERIMETROS', 'PLIEGUES'].flatMap((familia) => [1, 1.15, 2].map((escalaDeLetra) => ({ sexo, familia, escalaDeLetra }))));
const componer = (caso, ancho = 320) => c.componerLaFigura({ ancho, medidas: MEDIDAS, ...caso });

test('los sitios no se mueven: cada uno queda donde lo pone la lámina, con tarjetas y con números', () => {
  for (const caso of CASOS) {
    const figura = componer(caso);
    const lugares = d.FIGURAS_DE_LA_LAMINA[caso.sexo].ENTERO;
    for (const s of figura.sitios) {
      const esperado = caso.familia === 'PERIMETROS' ? d.anilloEnLaLamina(figura.imagen, lugares.perimetros[s.clave]) : d.puntoEnLaLamina(figura.imagen, lugares.pliegues[s.clave]);
      assert.ok(Math.abs(s.cx - esperado.cx) < 1e-9 && Math.abs(s.cy - esperado.cy) < 1e-9, `${caso.sexo} ${caso.familia} ×${caso.escalaDeLetra}: ${s.clave} se movió`);
    }
  }
});

test('con la letra de siempre van las tarjetas del compositor, con sus grupos y su orden', () => {
  for (const familia of ['PERIMETROS', 'PLIEGUES']) {
    const figura = componer({ sexo: 'HOMBRE', familia, escalaDeLetra: 1 });
    assert.equal(figura.modo, 'TARJETAS');
    const grupos = (familia === 'PERIMETROS' ? d.TARJETAS_DE_PERIMETROS : d.TARJETAS_DE_PLIEGUES).ENTERO.map((g) => g.filter((clave) => clave in VALORES)).filter((g) => g.length > 0);
    assert.deepEqual(
      figura.tarjetas.map((t) => t.filas.map((f) => f.sitio.clave)),
      grupos,
    );
  }
});

test('con la letra grande la figura pasa a números, que bajan en orden por la columna; la lista los repite en ese orden', () => {
  for (const caso of CASOS.filter((x) => x.escalaDeLetra === 2)) {
    const figura = componer(caso);
    assert.equal(figura.modo, 'NUMEROS', `${caso.sexo} ${caso.familia}`);
    const columna = [...figura.tarjetas].sort((a, b) => a.y - b.y).map((t) => t.filas[0].sitio.numero);
    assert.deepEqual(columna, columna.map((_, i) => i + 1), `${caso.sexo} ${caso.familia}: la columna no baja en orden`);
    assert.deepEqual(
      figura.sitios.map((s) => s.numero),
      figura.sitios.map((_, i) => i + 1),
    );
  }
});

test('cada fila mide lo que su texto necesita con la letra de la persona, y un rótulo largo usa dos líneas', () => {
  let conDosLineas = 0;
  for (const caso of CASOS.filter((x) => x.escalaDeLetra < 2)) {
    const figura = componer(caso);
    if (figura.modo !== 'TARJETAS') continue;
    for (const t of figura.tarjetas) {
      for (const f of t.filas) {
        const minimo = (f.lineasDelRotulo * c.INTERLINEA.rotulo + c.INTERLINEA.valor) * caso.escalaDeLetra;
        assert.ok(f.alto >= minimo, `${f.sitio.clave} ×${caso.escalaDeLetra}: ${f.alto} < ${minimo}`);
        if (f.lineasDelRotulo === 2) conDosLineas++;
      }
    }
  }
  assert.ok(conDosLineas > 0, 'ningún rótulo largo pasó a dos líneas');
});

test('las tarjetas no se superponen y quedan dentro de la lámina; cada guía va de su tarjeta al borde de su sitio', () => {
  for (const caso of CASOS) {
    const figura = componer(caso);
    const orden = [...figura.tarjetas].sort((a, b) => a.y - b.y);
    assert.ok(orden[0].y >= 10 - 1e-6, `${caso.sexo} ${caso.familia} ×${caso.escalaDeLetra}: la primera tarjeta se sale por arriba`);
    assert.ok(orden.at(-1).y + orden.at(-1).alto <= figura.alto - 10 + 1e-6, `${caso.sexo} ${caso.familia} ×${caso.escalaDeLetra}: la última se sale por abajo`);
    for (let i = 1; i < orden.length; i++) assert.ok(orden[i].y >= orden[i - 1].y + orden[i - 1].alto - 1e-6, `${caso.sexo} ${caso.familia} ×${caso.escalaDeLetra}: tarjetas superpuestas`);
    for (const t of figura.tarjetas) {
      for (const f of t.filas) {
        const guia = figura.guias.find((g) => g.clave === f.sitio.clave);
        assert.equal(guia.desde.x, t.x + t.ancho + 2);
        assert.equal(guia.desde.y, f.y);
        assert.deepEqual(guia.hasta, { x: f.sitio.izquierda - 3, y: f.sitio.cy });
      }
    }
  }
});

test('mapa corporal: con más de una toma cada fila lleva su gráfico chico, sin mover ningún sitio ni desbordar', () => {
  const doce = Array.from({ length: 12 }, (_, i) => (i % 5 === 3 ? { tipo: 'sin-dato' } : { tipo: 'valor', observacion: { punto: { value: 30 + (i % 4), unit: 'cm' } } }));
  for (const ancho of [320, 360, 411]) {
    for (const caso of CASOS) {
      const etiqueta = `${ancho} dp, ${caso.sexo} ${caso.familia} ×${caso.escalaDeLetra}`;
      const sin = c.componerLaFigura({ ancho, medidas: MEDIDAS, ...caso });
      const con = c.componerLaFigura({ ancho, medidas: MEDIDAS, ...caso, puntos: true });
      assert.equal(con.modo, sin.modo, `${etiqueta}: el gráfico no cambia el modo`);
      // Los sitios siguen donde los pone la lámina, en la imagen de esta composición.
      const lugares = d.FIGURAS_DE_LA_LAMINA[caso.sexo].ENTERO;
      for (const s of con.sitios) {
        const esperado = caso.familia === 'PERIMETROS' ? d.anilloEnLaLamina(con.imagen, lugares.perimetros[s.clave]) : d.puntoEnLaLamina(con.imagen, lugares.pliegues[s.clave]);
        assert.ok(Math.abs(s.cx - esperado.cx) < 1e-9 && Math.abs(s.cy - esperado.cy) < 1e-9, `${etiqueta}: ${s.clave} se movió`);
      }
      for (const t of con.tarjetas) {
        // En una tarjeta, los gráficos tienen todos el mismo ancho: los puntos de cada toma quedan en columna.
        if (con.modo === 'TARJETAS') assert.equal(new Set(t.filas.map((f) => f.anchoDeLosPuntos)).size, 1, `${etiqueta}: gráficos de anchos distintos en una tarjeta`);
        for (const [i, f] of t.filas.entries()) {
          if (con.modo === 'NUMEROS') {
            assert.equal(f.anchoDeLosPuntos, null, 'con números, el gráfico va en la lista');
            continue;
          }
          // El gráfico cabe en el contenido de la fila (la tarjeta sin su relleno ni sus bordes) y comparte la última
          // línea con la diferencia.
          assert.ok(f.anchoDeLosPuntos <= t.ancho - 18, etiqueta);
          if (f.sitio.diferencia) assert.ok(f.anchoDeLosPuntos + 6 + c.anchoEstimado(f.sitio.diferencia, c.LETRA.detalle * caso.escalaDeLetra) <= t.ancho - 18 + 1, `${etiqueta}: la diferencia de ${f.sitio.clave} no entra junto al gráfico`);
          assert.ok(f.anchoDeLosPuntos >= 60, `${etiqueta}: ${f.anchoDeLosPuntos} dp es poco para doce tomas`);
          // La fila tiene lugar para su texto con la letra de la persona y, debajo, para el gráfico; y nunca menos de 48 dp.
          const texto = Math.ceil((f.enLinea ? c.INTERLINEA.valor : f.lineasDelRotulo * c.INTERLINEA.rotulo + c.INTERLINEA.valor) * caso.escalaDeLetra) + 8;
          assert.ok(f.alto >= texto + c.ALTO_DE_LOS_PUNTOS && f.alto >= c.ALTO_MINIMO_DE_FILA, `${etiqueta}: la fila no tiene lugar para el gráfico`);
          assert.ok(f.alto >= sin.tarjetas.find((x) => x.filas[0].sitio.clave === t.filas[0].sitio.clave).filas[i].alto, etiqueta);
          const g = graficos.geometriaDePuntos({ ancho: f.anchoDeLosPuntos, alto: c.ALTO_DEL_GRAFICO_EN_LA_FILA, estados: doce, elegida: 11 });
          for (const p of g.puntos) {
            assert.ok(p.x - p.radio >= 0 && p.x + p.radio <= f.anchoDeLosPuntos && p.y + p.radio <= c.ALTO_DEL_GRAFICO_EN_LA_FILA, `${etiqueta}: doce tomas desbordan la fila`);
            assert.ok(p.radio >= 1.5, `${etiqueta}: con doce tomas, un punto de ${p.radio} dp ya no se distingue`);
          }
        }
      }
    }
  }
  // Sin gráficos (una sola toma), las filas no los reservan.
  assert.ok(componer({ sexo: 'HOMBRE', familia: 'PERIMETROS', escalaDeLetra: 1 }).tarjetas.every((t) => t.filas.every((f) => f.anchoDeLosPuntos === null)));
});

test('encuadre: el cuerpo empieza arriba y no cambia de tamaño con la cantidad de medidas', () => {
  for (const ancho of [280, 320, 350, 372]) {
    for (const sexo of ['HOMBRE', 'MUJER']) {
      for (const familia of ['PERIMETROS', 'PLIEGUES']) {
        const etiqueta = `${ancho} dp, ${sexo} ${familia}`;
        const cuerpo = d.FIGURAS_DE_LA_LAMINA[sexo].ENTERO.cuerpo;
        const todas = c.componerLaFigura({ ancho, sexo, familia, medidas: MEDIDAS, escalaDeLetra: 1, puntos: true });
        const deLaFamilia = MEDIDAS.filter((m) => m.metrica.startsWith(familia === 'PERIMETROS' ? 'perimetro' : 'pliegue'));
        const una = c.componerLaFigura({ ancho, sexo, familia, medidas: deLaFamilia.slice(0, 1), escalaDeLetra: 1, puntos: true });
        // El borde de arriba del cuerpo, en el margen: nunca un hueco encima, ni con muchas tarjetas.
        assert.ok(Math.abs(todas.imagen.y + (cuerpo.arriba / 100) * todas.imagen.alto - 10) < 1e-9, `${etiqueta}: el cuerpo no empieza arriba`);
        assert.deepEqual(una.imagen, todas.imagen, `${etiqueta}: sumar medidas cambió el tamaño o el lugar del cuerpo`);
      }
    }
  }
});

test('encuadre: el borde derecho recorta el cuerpo, pero ningún sitio queda afuera ni debajo de las tarjetas', () => {
  for (const ancho of [280, 320, 350, 372]) {
    for (const caso of CASOS) {
      const etiqueta = `${ancho} dp, ${caso.sexo} ${caso.familia} ×${caso.escalaDeLetra}`;
      const figura = c.componerLaFigura({ ancho, medidas: MEDIDAS, ...caso, puntos: true });
      assert.ok(figura.imagen.x + figura.imagen.ancho > ancho, `${etiqueta}: la figura no llega al borde derecho`);
      const derechaDeLasTarjetas = Math.max(...figura.tarjetas.map((t) => t.x + t.ancho));
      for (const s of figura.sitios) {
        // El centro del sitio a la vista: ahí responde el toque y ahí está su dibujo, aunque un anillo del tronco se
        // corte en el borde. El punto de un pliegue, entero.
        assert.ok(s.cx > derechaDeLasTarjetas && s.cx < ancho, `${etiqueta}: el centro de ${s.clave} queda fuera de la vista`);
        assert.ok(s.cy > 0 && s.cy < figura.alto, `${etiqueta}: ${s.clave} queda fuera, arriba o abajo`);
        if (!s.anillo) assert.ok(s.cx + 7 <= ancho, `${etiqueta}: el punto de ${s.clave} se corta en el borde`);
        // Donde llega la guía, a la vista y a la derecha de las tarjetas.
        assert.ok(s.izquierda - 3 > derechaDeLasTarjetas, `${etiqueta}: la guía de ${s.clave} termina debajo de una tarjeta`);
        assert.equal(c.sitioTocado(figura.sitios, s.cx, s.cy)?.tipo !== undefined, true, `${etiqueta}: tocar ${s.clave} no responde`);
      }
    }
  }
});

test('la figura dibuja la familia elegida si la toma la tiene; si no, la otra: nunca una silueta vacía', () => {
  assert.equal(c.familiaQueSeVe('PERIMETROS', true, true), 'PERIMETROS');
  assert.equal(c.familiaQueSeVe('PLIEGUES', true, true), 'PLIEGUES');
  assert.equal(c.familiaQueSeVe('PERIMETROS', false, true), 'PLIEGUES', 'una toma solo con pliegues');
  assert.equal(c.familiaQueSeVe('PLIEGUES', true, false), 'PERIMETROS', 'una toma solo con perímetros');
});

test('las filas que eligen un sitio dicen su rol y si están elegidas; la lista de números mide 48 dp', () => {
  // La selección coordinada (fila, aro y detalle) se ve en el dibujo; el lector de pantalla tiene que oír cuál está
  // elegida (B10-10:36). Las filas de las tarjetas miden lo que fija la composición; la lista de números no depende de ella.
  const fuente = readFileSync(new URL('../apps/mobile/src/pantallas/figura-de-la-toma.tsx', import.meta.url), 'utf8');
  assert.match(fuente, /accessibilityState={{ selected: elegida }}/);
  assert.match(fuente, /accessibilityState={{ selected: s.clave === elegida }}/);
  assert.equal((fuente.match(/accessibilityRole="button"/g) ?? []).length, 2);
  assert.match(fuente, /gap: 10, minHeight: 48,/);
});

// ─── Objetivos de 48 dp (tanda de cierre de la 0.13.2) ──────────────────────────────────────────────────────────

/** Los sitios que, de frente, quedan casi en el mismo lugar: ahí el toque en la figura no elige, elige la fila. */
const COINCIDENTES = new Set(['perimetro-brazo-relajado', 'perimetro-brazo-flexionado', 'pliegue-triceps', 'pliegue-biceps', 'pliegue-cresta-iliaca', 'pliegue-supraespinal']);

test('las filas de las tarjetas miden al menos 48 dp: son objetivos táctiles, y la letra no se agranda para eso', () => {
  for (const caso of CASOS) {
    const figura = componer(caso);
    if (figura.modo !== 'TARJETAS') continue;
    for (const t of figura.tarjetas) for (const f of t.filas) assert.ok(f.alto >= c.ALTO_MINIMO_DE_FILA, `${caso.sexo} ${caso.familia} ×${caso.escalaDeLetra}: ${f.sitio.clave} mide ${f.alto}`);
  }
  assert.equal(c.ALTO_MINIMO_DE_FILA, 48);
  // El nombre del sitio va a 13 sp (pulido del 2026-10-04: «nombre legible»); antes, 12.
  assert.deepEqual(c.LETRA, { rotulo: 13, valor: 15, detalle: 12, ficha: 12 });
});

test('tocar el dibujo de un sitio lo elige; solo los que coinciden de frente quedan sin elección directa', () => {
  for (const caso of CASOS) {
    const figura = componer(caso);
    for (const s of figura.sitios) {
      const toque = c.sitioTocado(figura.sitios, s.cx, s.cy);
      const etiqueta = `${caso.sexo} ${caso.familia} ×${caso.escalaDeLetra}: ${s.clave}`;
      if (toque?.tipo === 'sitio') assert.equal(toque.clave, s.clave, etiqueta);
      else {
        assert.equal(toque?.tipo, 'ambiguo', etiqueta);
        assert.ok(toque.claves.includes(s.clave) && toque.claves.every((k) => COINCIDENTES.has(k)), `${etiqueta}: parejo con ${toque.claves}`);
      }
    }
  }
});

test('un sitio aislado responde hasta 24 dp de su dibujo (un objetivo de 48 dp), y no más', () => {
  const figura = componer({ sexo: 'HOMBRE', familia: 'PERIMETROS', escalaDeLetra: 1 });
  const tobillo = figura.sitios.find((s) => s.clave === 'perimetro-tobillo');
  for (const [dx, dy] of [[0, 23], [0, -23], [tobillo.anillo.rx + 23, 0], [-(tobillo.anillo.rx + 23), 0]]) {
    assert.deepEqual(c.sitioTocado(figura.sitios, tobillo.cx + dx, tobillo.cy + dy), { tipo: 'sitio', clave: 'perimetro-tobillo' }, `a ${dx},${dy}`);
  }
  assert.equal(c.sitioTocado(figura.sitios, tobillo.cx, tobillo.cy + 25), null);
  // El dibujo no crece: el anillo es el de la lámina.
  assert.ok(tobillo.anillo.rx < 24 && tobillo.anillo.ry <= 4);
});

test('un toque nunca elige un sitio si otro queda casi a la misma distancia: ampliar el área no crea elecciones dudosas', () => {
  for (const caso of CASOS) {
    const figura = componer(caso);
    for (let x = 0; x <= figura.ancho; x += 3) {
      for (let y = 0; y <= figura.alto; y += 3) {
        const toque = c.sitioTocado(figura.sitios, x, y);
        if (toque?.tipo !== 'sitio') continue;
        const distancias = figura.sitios.map((s) => ({ clave: s.clave, d: c.distanciaAlSitio(s, x, y) })).sort((a, b) => a.d - b.d);
        assert.equal(distancias[0].clave, toque.clave, `${caso.sexo} ${caso.familia} en ${x},${y}`);
        assert.ok(distancias[0].d <= c.RADIO_DE_TOQUE);
        assert.ok(distancias.length < 2 || distancias[1].d - distancias[0].d >= c.MARGEN_DE_AMBIGUEDAD, `${caso.sexo} ${caso.familia} en ${x},${y}: ${distancias[0].clave} contra ${distancias[1].clave}`);
      }
    }
  }
});
