/**
 * La composición de la figura de la toma en el teléfono (`apps/mobile/src/composicion-de-la-figura.ts`). Se verifica que:
 * - los sitios no se mueven: cada uno queda donde lo pone la lámina, en los dos modos (DL-113);
 * - con la letra de siempre van las tarjetas del compositor, con sus grupos y su orden;
 * - con la letra grande la figura pasa a números, que bajan en orden por la columna, y la lista los repite;
 * - cada fila mide lo que su texto necesita con la letra de la persona;
 * - las tarjetas no se superponen y las guías van de su tarjeta a su sitio.
 * - las filas que eligen un sitio dicen al lector de pantalla su rol y si están elegidas (selección coordinada).
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

test('las filas que eligen un sitio dicen su rol y si están elegidas; la lista de números mide 48 dp', () => {
  // La selección coordinada (fila, aro y detalle) se ve en el dibujo; el lector de pantalla tiene que oír cuál está
  // elegida (B10-10:36). Las filas de las tarjetas miden lo que fija la composición; la lista de números no depende de ella.
  const fuente = readFileSync(new URL('../apps/mobile/src/pantallas/figura-de-la-toma.tsx', import.meta.url), 'utf8');
  assert.match(fuente, /accessibilityState={{ selected: elegida }}/);
  assert.match(fuente, /accessibilityState={{ selected: s.clave === elegida }}/);
  assert.equal((fuente.match(/accessibilityRole="button"/g) ?? []).length, 2);
  assert.match(fuente, /gap: 10, minHeight: 48,/);
});
