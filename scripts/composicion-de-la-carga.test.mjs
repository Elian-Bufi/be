/**
 * La figura de la carga de una toma en el website (`apps/web/src/app/pro/advisees/anthropometry/composicion-de-la-carga.ts`;
 * WP-ESCRITORIO-AREAS, parte 9). Se verifica que:
 * - ningún sitio se mueve: cada uno queda donde lo ponen las cuentas de la lámina sobre la caja de la imagen (DL-113);
 * - cada sitio que el protocolo declara tiene un campo, una sola vez, y ninguno sobra;
 * - las tarjetas van del lado decidido, no se pisan, quedan dentro de la escena y no bajan hasta la leyenda;
 * - ninguna guía se cruza con otra, en las dos figuras y en las dos familias;
 * - el orden del documento (el del foco) es el del protocolo, por tarjetas;
 * - una fila que crece (su error abajo) empuja la tarjeta, sin mover ningún sitio.
 *
 * Uso: node --test scripts/composicion-de-la-carga.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const c = await import('../apps/web/src/app/pro/advisees/anthropometry/composicion-de-la-carga.ts');
const { METRICAS } = require('./catalogo-antropometrico/catalogo-perfil-completo.cjs');

/** Las claves del «Perfil antropométrico completo», en su orden: 30 mediciones, 24 con sitio en la figura. */
const PERFIL = METRICAS.map((m) => m.clave);
const CASOS = ['HOMBRE', 'MUJER'].flatMap((sexo) => ['PERIMETROS', 'PLIEGUES'].map((familia) => ({ sexo, familia })));
const ANCHOS = [880, 832, 1000];
const E = c.ESCENA_DE_LA_CARGA;

test('ningún sitio se mueve: cada uno queda donde lo ponen las cuentas de la lámina, a cualquier ancho', () => {
  for (const { sexo, familia } of CASOS) {
    for (const ancho of ANCHOS) {
      const comp = c.componerLaCarga({ sexo, familia, claves: PERFIL, ancho });
      const figura = d.FIGURAS_DE_LA_LAMINA[sexo].ENTERO;
      assert.deepEqual(comp.imagen, { x: (ancho - 440) / 2, y: -12, ancho: 440, alto: 660 });
      assert.equal(comp.archivo, figura.archivo);
      for (const s of comp.sitios) {
        const esperado = familia === 'PERIMETROS' ? d.anilloEnLaLamina(comp.imagen, figura.perimetros[s.clave]) : d.puntoEnLaLamina(comp.imagen, figura.pliegues[s.clave]);
        assert.ok(Math.abs(s.cx - esperado.cx) < 1e-9 && Math.abs(s.cy - esperado.cy) < 1e-9, `${sexo} ${s.clave} a ${ancho}: ${s.cx},${s.cy} y no ${esperado.cx},${esperado.cy}`);
        if (familia === 'PERIMETROS') assert.ok(Math.abs(s.rx - esperado.rx) < 1e-9 && Math.abs(s.ry - esperado.ry) < 1e-9);
      }
    }
  }
  // Una fila que crece no mueve ningún sitio.
  const base = c.componerLaCarga({ sexo: 'MUJER', familia: 'PLIEGUES', claves: PERFIL, ancho: 880 });
  const conError = c.componerLaCarga({ sexo: 'MUJER', familia: 'PLIEGUES', claves: PERFIL, ancho: 880, altosDeFilas: { 'pliegue-triceps': 92 } });
  assert.deepEqual(conError.sitios, base.sitios);
});

test('cada sitio que el protocolo declara tiene su campo, una sola vez, y del lado decidido', () => {
  for (const { sexo, familia } of CASOS) {
    const comp = c.componerLaCarga({ sexo, familia, claves: PERFIL, ancho: 880 });
    const enTarjetas = comp.tarjetas.flatMap((t) => t.filas.map((f) => f.clave));
    const esperadas = c.clavesDeLaFamilia(sexo, familia, PERFIL);
    assert.equal(esperadas.length, familia === 'PERIMETROS' ? 13 : 11);
    assert.deepEqual([...enTarjetas].sort(), [...esperadas].sort(), `${sexo} ${familia}`);
    assert.equal(comp.guias.length, esperadas.length);
    for (const t of comp.tarjetas) {
      for (const f of t.filas) {
        const lado = Object.entries(c.TARJETAS_DE_LA_CARGA[familia]).find(([, grupos]) => grupos.some((g) => g.includes(f.clave)))?.[0];
        assert.equal(t.lado, lado, `${f.clave} va a la ${lado}`);
      }
    }
  }
  // A la derecha, en pliegues, solo los dos junto a la línea media.
  const pliegues = c.componerLaCarga({ sexo: 'MUJER', familia: 'PLIEGUES', claves: PERFIL, ancho: 880 });
  assert.deepEqual(pliegues.tarjetas.filter((t) => t.lado === 'DERECHA').flatMap((t) => t.filas.map((f) => f.clave)).sort(), ['pliegue-abdominal', 'pliegue-subescapular']);
  // Con un protocolo de pocas mediciones, solo sus sitios: la tarjeta que queda vacía no se dibuja.
  const pocas = c.componerLaCarga({ sexo: 'HOMBRE', familia: 'PERIMETROS', claves: ['peso', 'perimetro-cintura', 'perimetro-cadera'], ancho: 880 });
  assert.deepEqual(pocas.tarjetas.map((t) => t.filas.map((f) => f.clave)), [['perimetro-cintura', 'perimetro-cadera']]);
  assert.equal(c.componerLaCarga({ sexo: 'HOMBRE', familia: 'PLIEGUES', claves: ['peso', 'talla'], ancho: 880 }).tarjetas.length, 0);
  // Lo que no tiene sitio queda para «Fuera de la figura».
  assert.deepEqual(PERFIL.filter((x) => !c.clavesConSitio('MUJER').has(x)), ['peso', 'talla', 'edad', 'diametro-humero', 'diametro-biestiloideo', 'diametro-femur']);
});

test('las tarjetas no se pisan, quedan dentro de la escena y no bajan hasta la leyenda', () => {
  for (const { sexo, familia } of CASOS) {
    for (const pie of [0, 60, 112, 150, 260]) {
      const comp = c.componerLaCarga({ sexo, familia, claves: PERFIL, ancho: 880, pie });
      for (const lado of ['IZQUIERDA', 'DERECHA']) {
        const columna = comp.tarjetas.filter((t) => t.lado === lado).sort((a, b) => a.arriba - b.arriba);
        const piso = E.alto - E.margen - (lado === 'DERECHA' ? pie : 0);
        columna.forEach((t, i) => {
          assert.ok(t.arriba >= E.margen - 1e-9, `${sexo} ${familia}: una tarjeta empieza arriba de la escena (${t.arriba})`);
          assert.ok(t.arriba + t.alto <= piso + 1e-9, `${sexo} ${familia} con pie ${pie}: una tarjeta baja hasta ${t.arriba + t.alto} (piso ${piso})`);
          if (i > 0) assert.ok(t.arriba >= columna[i - 1].arriba + columna[i - 1].alto + E.separacion - 1e-9, `${sexo} ${familia}: dos tarjetas se pisan`);
          assert.equal(t.alto, t.filas.length * E.fila + 2 * (E.tarjeta.relleno + E.tarjeta.borde));
        });
        for (const t of columna) assert.equal(t.x, lado === 'IZQUIERDA' ? 0 : 880 - E.tarjeta.ancho);
      }
    }
  }
});

/** Si dos tramos se cortan (sin contar los extremos que comparten). */
function seCortan(p1, p2, p3, p4) {
  const o = (a, b, q) => Math.sign((b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x));
  return o(p1, p2, p3) * o(p1, p2, p4) < 0 && o(p3, p4, p1) * o(p3, p4, p2) < 0;
}
const tramos = (g) => [
  [g.desde, g.quiebre],
  [g.quiebre, g.hasta],
];

test('ninguna guía se cruza con otra, en las dos figuras y en las dos familias, y cada una va de su campo a su sitio', () => {
  for (const { sexo, familia } of CASOS) {
    for (const ancho of ANCHOS) {
      const comp = c.componerLaCarga({ sexo, familia, claves: PERFIL, ancho, pie: familia === 'PLIEGUES' ? 112 : 60 });
      const cruces = [];
      comp.guias.forEach((a, i) =>
        comp.guias.slice(i + 1).forEach((b) => {
          if (tramos(a).some(([p1, p2]) => tramos(b).some(([p3, p4]) => seCortan(p1, p2, p3, p4)))) cruces.push(`${a.clave} × ${b.clave}`);
        }),
      );
      assert.deepEqual(cruces, [], `${sexo} ${familia} a ${ancho}`);
      for (const g of comp.guias) {
        const t = comp.tarjetas.find((x) => x.filas.some((f) => f.clave === g.clave));
        const f = t.filas.find((x) => x.clave === g.clave);
        const s = comp.sitios.find((x) => x.clave === g.clave);
        assert.equal(g.desde.y, t.arriba + f.arriba + E.fila / 2, 'la guía sale a la altura de su campo');
        assert.equal(g.desde.x, t.lado === 'IZQUIERDA' ? t.x + t.ancho : t.x, 'la guía sale del borde de la tarjeta que mira a la figura');
        assert.equal(g.hasta.y, s.cy, 'la guía llega a la altura de su sitio');
        assert.ok(t.lado === 'IZQUIERDA' ? g.hasta.x < s.cx && g.hasta.x > g.quiebre.x : g.hasta.x > s.cx && g.hasta.x < g.quiebre.x, `${g.clave}: la guía llega al borde del sitio, del lado de su tarjeta`);
        assert.equal(g.posterior, s.posterior);
      }
    }
  }
  // Los dos pliegues posteriores lo dicen; los demás, no.
  const pliegues = c.componerLaCarga({ sexo: 'HOMBRE', familia: 'PLIEGUES', claves: PERFIL, ancho: 880 });
  assert.deepEqual(pliegues.sitios.filter((s) => s.posterior).map((s) => s.clave).sort(), ['pliegue-subescapular', 'pliegue-triceps']);
});

test('dentro de cada tarjeta los campos van en el orden decidido: solo dos sitios a la misma altura cambian de fila entre sí; el documento va en el orden del protocolo', () => {
  for (const { sexo, familia } of CASOS) {
    for (const pie of [0, 112]) {
      const comp = c.componerLaCarga({ sexo, familia, claves: PERFIL, ancho: 880, pie });
      const cy = new Map(comp.sitios.map((s) => [s.clave, s.cy]));
      const decididas = Object.values(c.TARJETAS_DE_LA_CARGA[familia]).flat();
      for (const t of comp.tarjetas) {
        const claves = t.filas.map((f) => f.clave);
        const decidida = decididas.find((g) => g.includes(claves[0]));
        // Cada par fuera del orden decidido es de dos sitios a la misma altura (tríceps y bíceps; cresta ilíaca y supraespinal).
        const fueraDeOrden = claves.flatMap((a, i) => claves.slice(i + 1).filter((b) => decidida.indexOf(b) < decidida.indexOf(a)).map((b) => [a, b]));
        for (const [a, b] of fueraDeOrden) assert.ok(Math.abs(cy.get(a) - cy.get(b)) < 1, `${sexo} ${familia}: ${a} y ${b} cambiaron de fila y no están a la misma altura`);
      }
      const primeras = comp.tarjetas.map((t) => Math.min(...t.filas.map((f) => PERFIL.indexOf(f.clave))));
      assert.deepEqual(primeras, [...primeras].sort((a, b) => a - b), `${sexo} ${familia}: las tarjetas van en el orden del protocolo`);
    }
  }
  // En perímetros, con el perfil completo, el orden del documento es exactamente el del protocolo (arriba a la derecha,
  // el brazo, la cintura y la pierna).
  const perimetros = c.componerLaCarga({ sexo: 'MUJER', familia: 'PERIMETROS', claves: PERFIL, ancho: 880 });
  assert.deepEqual(
    perimetros.tarjetas.flatMap((t) => t.filas.map((f) => f.clave)),
    PERFIL.filter((x) => x.startsWith('perimetro-')),
  );
});

test('una fila que crece agranda su tarjeta y la guía de las de abajo sigue saliendo de su campo', () => {
  const comp = c.componerLaCarga({ sexo: 'MUJER', familia: 'PLIEGUES', claves: PERFIL, ancho: 880, altosDeFilas: { 'pliegue-pectoral': 96 } });
  const t = comp.tarjetas.find((x) => x.filas.some((f) => f.clave === 'pliegue-pectoral'));
  assert.equal(t.alto, 96 + 3 * E.fila + 2 * (E.tarjeta.relleno + E.tarjeta.borde));
  const axilar = t.filas.find((f) => f.clave === 'pliegue-axilar-media');
  assert.equal(axilar.arriba, E.tarjeta.relleno + E.tarjeta.borde + 96);
  assert.equal(comp.guias.find((g) => g.clave === 'pliegue-axilar-media').desde.y, t.arriba + axilar.arriba + E.fila / 2);
});

test('el trazo de una guía y los arcos de un anillo', () => {
  const g = { desde: { x: 292, y: 100 }, quiebre: { x: 308, y: 100 }, hasta: { x: 350.25, y: 180.5 } };
  assert.equal(c.trazoDeLaGuia(g), 'M292.0 100.0H308.0L350.3 180.5');
  const s = { cx: 100, cy: 50, rx: 20, ry: 3.4 };
  assert.equal(c.arcoDelAnillo(s, 'DELANTERA'), 'M80.0 50.0A20.0 3.4 0 0 0 120.0 50.0');
  assert.equal(c.arcoDelAnillo(s, 'TRASERA'), 'M80.0 50.0A20.0 3.4 0 0 1 120.0 50.0');
});
