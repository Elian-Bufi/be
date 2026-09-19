/**
 * T13 de WP-04 (REG-06-125; TEST-PRJ-009): cero puntaje también en el copy de las pantallas.
 * La prueba de @be/domain recorre los schemas, el OpenAPI y COPY_NUTRICION. Esta recorre el texto escrito directo en
 * las pantallas de nutrición del website y del APK: literales de cadena, plantillas y texto JSX, extraídos con el
 * compilador de TypeScript (los comentarios no cuentan: no se muestran). Usa la misma lista de términos prohibidos.
 *
 * Uso: node --test scripts/copy-nutricion.test.cjs (después de construir @be/domain).
 */
const assert = require('node:assert/strict');
const { readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const { terminosProhibidosEn } = require('../packages/domain/dist/index.js');

const RAIZ = join(__dirname, '..');
const WEB = join(RAIZ, 'apps/web/src/app/pro/advisees/nutrition');
const ARCHIVOS = [...readdirSync(WEB).filter((f) => f.endsWith('.tsx')).map((f) => join(WEB, f)), join(RAIZ, 'apps/mobile/src/pantallas/nutricion.tsx')];

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

test('T13 · el copy de las pantallas de nutrición (website y APK) no tiene puntajes, porcentajes ni juicios', () => {
  assert.ok(ARCHIVOS.length >= 8, `se esperaban las pantallas de nutrición, hay ${ARCHIVOS.length}`);
  const porArchivo = ARCHIVOS.map((a) => [a, textosDe(a)]);
  assert.ok(porArchivo.every(([, t]) => t.length > 0), 'cada pantalla tiene copy extraído');
  const hallazgos = porArchivo.flatMap(([a, textos]) =>
    textos.flatMap(({ texto, linea }) => terminosProhibidosEn(texto).map((p) => `${a.slice(RAIZ.length + 1)}:${linea} «${p}» en ${JSON.stringify(texto)}`)),
  );
  assert.deepEqual(hallazgos, []);
});

test('T13 · el extractor encuentra un término prohibido en el copy e ignora los estilos', () => {
  const contenido = "const s = StyleSheet.create({ w: { width: '100%' } }); export const X = () => <p className=\"a\">Adherencia del 82 %</p>;";
  const textos = textosDe('fixture.tsx', contenido).map((t) => t.texto);
  assert.deepEqual(textos, ['Adherencia del 82 %']);
  assert.deepEqual(terminosProhibidosEn(textos.join(' ')), ['adherencia', '%']);
});
