/**
 * La letra del website, autoalojada (WP-TABLERO-ALTA-GAMA, TB-01; DL-163 D-3): Inter variable y Poppins 600 viven en el
 * repo con su licencia y se cargan con next/font/local, sin pedir nada a terceros.
 * - los archivos y sus licencias (SIL OFL 1.1) están al lado del módulo que los carga;
 * - el website no pide letras afuera: alcanza con `font-src 'self'` de render.yaml, que no cambia;
 * - `package-lock.json` no suma ningún paquete de letras: los archivos se copiaron, no se instalaron;
 * - el texto usa la variable de Inter, y Poppins va solo en los momentos de marca.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const RAIZ = path.join(__dirname, '..');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');
const LETRA = 'apps/web/src/letra';

test('las dos letras y sus licencias están en el repo, al lado del módulo que las carga', () => {
  for (const archivo of ['inter-latin-variable.woff2', 'poppins-latin-600.woff2']) {
    const bytes = fs.readFileSync(path.join(RAIZ, LETRA, archivo));
    assert.equal(bytes.subarray(0, 4).toString('latin1'), 'wOF2', `${archivo} es un woff2`);
  }
  for (const licencia of ['LICENCIA-INTER.txt', 'LICENCIA-POPPINS.txt']) {
    assert.match(leer(`${LETRA}/${licencia}`), /SIL Open Font License, Version 1\.1/);
  }
  const modulo = leer(`${LETRA}/letra.ts`);
  assert.match(modulo, /from 'next\/font\/local'/);
  assert.match(modulo, /src: '\.\/inter-latin-variable\.woff2'/);
  assert.match(modulo, /weight: '100 900'/);
  assert.match(modulo, /src: '\.\/poppins-latin-600\.woff2'/);
  assert.equal((modulo.match(/adjustFontFallback: 'Arial'/g) ?? []).length, 2, 'las dos con el respaldo ajustado');
});

test('el website no pide letras a terceros y la política de contenido sigue en font-src self', () => {
  const csp = /name: Content-Security-Policy\s+value: "([^"]+)"/.exec(leer('render.yaml'))[1];
  assert.match(csp, /font-src 'self';/);
  const fuentes = [];
  const recorrer = (dir) => {
    for (const e of fs.readdirSync(path.join(RAIZ, dir), { withFileTypes: true })) {
      const r = `${dir}/${e.name}`;
      if (e.isDirectory()) recorrer(r);
      else if (/\.(tsx?|css|mjs)$/.test(e.name)) fuentes.push(r);
    }
  };
  recorrer('apps/web/src');
  for (const r of fuentes) {
    const texto = leer(r);
    assert.doesNotMatch(texto, /fonts\.(googleapis|gstatic)\.com|next\/font\/google|@import\s+url\(/, `${r} no pide letras afuera`);
  }
});

test('package-lock no suma paquetes de letras', () => {
  assert.doesNotMatch(leer('package-lock.json'), /@fontsource|"node_modules\/inter-ui"|"node_modules\/@fontsource/);
});

test('el texto usa Inter y Poppins va solo en los momentos de marca', () => {
  const css = leer('apps/web/src/app/globals.css');
  const base = /html,\s*body\s*\{([^}]*)\}/.exec(css)[1];
  assert.match(base, /font-family: var\(--letra-texto, Inter\)/);
  const usos = css.match(/var\(--letra-marca/g) ?? [];
  assert.equal(usos.length, 1, 'una sola regla con Poppins');
  const regla = /([^{}]+)\{[^}]*var\(--letra-marca/.exec(css)[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
  assert.deepEqual(
    regla.split(',').map((s) => s.trim()),
    ['.espacio-profesional__encabezado h1', '.marco-de-la-ficha__nombre h1'],
  );
  const layout = leer('apps/web/src/app/layout.tsx');
  assert.match(layout, /className=\{`\$\{letraDeTexto\.variable\} \$\{letraDeMarca\.variable\}`\}/);
});
