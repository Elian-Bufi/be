/**
 * T13 de WP-04, extendido en WP-05 (REG-06-125; TEST-PRJ-009): cero puntaje también en el copy de las pantallas.
 * La prueba de @be/domain recorre los schemas, el OpenAPI y los diccionarios de copy. Esta recorre el texto escrito
 * directo en las pantallas del website y del APK: literales de cadena, plantillas y texto JSX, extraídos con el
 * compilador de TypeScript (los comentarios no cuentan: no se muestran).
 *
 * Cada dominio trae su propia lista: nutrición prohíbe puntajes, porcentajes y juicios; antropometría suma los
 * términos que insinúan que un hueco es un valor o que un derivado es un diagnóstico (INV-06-176/177; RF-048).
 *
 * Uso: node --test scripts/copy-pantallas.test.cjs (después de construir @be/domain).
 */
const assert = require('node:assert/strict');
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { terminosProhibidosEn, terminosProhibidosDeAntropometriaEn } = require('../packages/domain/dist/index.js');

const RAIZ = join(__dirname, '..');
const tsx = (dir) => readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => join(dir, f));

/** Las pantallas de cada dominio, con la lista de términos que le corresponde. */
const DOMINIOS = [
  {
    nombre: 'nutrición',
    archivos: [...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/nutrition')), join(RAIZ, 'apps/mobile/src/pantallas/nutricion.tsx')],
    prohibidos: terminosProhibidosEn,
    minimo: 8,
  },
  {
    nombre: 'antropometría',
    archivos: [...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/anthropometry')), join(RAIZ, 'apps/mobile/src/pantallas/antropometria.tsx')],
    prohibidos: terminosProhibidosDeAntropometriaEn,
    minimo: 5,
  },
];

/** Estilos de React Native: valores como '100%' no son texto para la persona. */
function dentroDeEstilos(nodo) {
  for (let n = nodo.parent; n; n = n.parent) {
    if (ts.isCallExpression(n) && n.expression.getText() === 'StyleSheet.create') return true;
    if (ts.isJsxAttribute(n) && ['className', 'style', 'id', 'htmlFor', 'key', 'href', 'accessibilityRole', 'keyboardType'].includes(n.name.getText())) return true;
    if (ts.isImportDeclaration(n)) return true;
  }
  return false;
}

function textosDe(archivo, contenido = readFileSync(archivo, 'utf8')) {
  const fuente = ts.createSourceFile(archivo, contenido, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const textos = [];
  const visitar = (n) => {
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isJsxText(n)) && !dentroDeEstilos(n)) {
      const t = n.text.trim();
      if (t) textos.push({ texto: t, linea: fuente.getLineAndCharacterOfPosition(n.getStart()).line + 1 });
    }
    ts.forEachChild(n, visitar);
  };
  visitar(fuente);
  return textos;
}

for (const dominio of DOMINIOS) {
  test(`T13 · el copy de las pantallas de ${dominio.nombre} no tiene puntajes, juicios ni huecos completados`, () => {
    assert.ok(dominio.archivos.length >= dominio.minimo, `se esperaban las pantallas de ${dominio.nombre}, hay ${dominio.archivos.length}`);
    const porArchivo = dominio.archivos.map((a) => [a, textosDe(a)]);
    assert.ok(
      porArchivo.every(([, t]) => t.length > 0),
      'cada pantalla tiene copy extraído',
    );
    const hallazgos = porArchivo.flatMap(([a, textos]) =>
      textos.flatMap(({ texto, linea }) => dominio.prohibidos(texto).map((p) => `${a.slice(RAIZ.length + 1)}:${linea} «${p}» en ${JSON.stringify(texto)}`)),
    );
    assert.deepEqual(hallazgos, []);
  });
}

test('T13 · el extractor encuentra un término prohibido en el copy e ignora los estilos', () => {
  const contenido = "const s = StyleSheet.create({ w: { width: '100%' } }); export const X = () => <p className=\"a\">Adherencia del 82 %</p>;";
  const textos = textosDe('fixture.tsx', contenido).map((t) => t.texto);
  assert.deepEqual(textos, ['Adherencia del 82 %']);
  assert.deepEqual(terminosProhibidosEn(textos.join(' ')), ['adherencia', '%']);
});

test('T13 · en antropometría, un juicio afirmativo se detecta y su negación explícita no', () => {
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('Este resultado es un diagnóstico'), ['diagnóstico']);
  assert.deepEqual(terminosProhibidosDeAntropometriaEn('Un resultado calculado no es un diagnóstico'), []);
});

/**
 * Guardia estructural (REG-06-16; 09v11:650-657). La API publica dos magnitudes: `magnitude`, el valor tal como se
 * tomó, y `effectiveMagnitude`, el que rige después de resolver la cadena de correcciones por relación. El titular
 * de la tarjeta tiene que mostrar el que rige: mostrar el original ahí lo dejaba contradiciendo al cálculo derivado
 * que ya usaba el corregido, con la insignia «Vigente» al lado. Que el campo exista en el contrato no alcanza; esta
 * prueba fija que la pantalla lo use, porque el error fue de lectura, no de contrato.
 */
test('T13 · el titular de la medición muestra el valor vigente, no el original', () => {
  const archivo = join(RAIZ, 'apps/web/src/app/pro/advisees/anthropometry/evaluaciones.tsx');
  const fuente = ts.createSourceFile(archivo, readFileSync(archivo, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let titular = null;
  const visitar = (n) => {
    if (ts.isJsxElement(n) && n.openingElement.tagName.getText() === 'h4' && /medicion\.metric/.test(n.getText())) titular = n.getText();
    ts.forEachChild(n, visitar);
  };
  visitar(fuente);
  assert.ok(titular, 'se esperaba el encabezado de la medición');
  assert.match(titular, /effectiveMagnitude/, 'el titular tiene que leer effectiveMagnitude');
  assert.doesNotMatch(
    titular.replace(/effectiveMagnitude\s*\?\?\s*medicion\.magnitude/g, ''),
    /medicion\.magnitude\b/,
    'el original solo entra como respaldo de la cadena no resoluble, nunca como titular propio',
  );
});
