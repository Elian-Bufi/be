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
const { terminosProhibidosEn, terminosProhibidosDeAntropometriaEn, terminosProhibidosDeEntrenamientoEn } = require('../packages/domain/dist/index.js');

const RAIZ = join(__dirname, '..');
/** Los textos también viven en módulos sin JSX (`.ts`): se leen como TypeScript, no como TSX. */
const tipoDeArchivo = (archivo) => (archivo.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.TSX);
/** Las frases de Inicio y de los gráficos chicos que se arman fuera de las pantallas, en módulos puros. */
const movil = (archivo) => join(RAIZ, 'apps/mobile/src', archivo);
const tsx = (dir) => readdirSync(dir).filter((f) => f.endsWith('.tsx')).map((f) => join(dir, f));

/**
 * Inicio (DL-117): cada tarjeta vive en el archivo de su módulo y se revisa con la lista de su dominio. Las piezas comunes
 * y la tarjeta de Información, que muestran texto de cualquier módulo, se revisan con las tres.
 */
const inicio = (archivo) => join(RAIZ, 'apps/mobile/src/pantallas', archivo);
const INICIO_COMUN = ['inicio.tsx', 'tarjeta-de-inicio.tsx', 'inicio-informacion.tsx'].map(inicio);

/** Las pantallas de cada dominio, con la lista de términos que le corresponde. */
const DOMINIOS = [
  {
    nombre: 'nutrición',
    archivos: [...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/nutrition')), join(RAIZ, 'apps/mobile/src/pantallas/nutricion.tsx'), inicio('inicio-nutricion.tsx'), movil('lecturas-de-inicio.ts'), ...INICIO_COMUN],
    prohibidos: terminosProhibidosEn,
    minimo: 8,
  },
  {
    nombre: 'antropometría',
    archivos: [
      ...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/anthropometry')),
      ...['antropometria.tsx', 'figura-de-la-toma.tsx', 'indicadores.tsx', 'progreso.tsx', 'progreso-de-una-medida.tsx'].map((archivo) => join(RAIZ, 'apps/mobile/src/pantallas', archivo)),
      movil('textos-por-toma.ts'),
      inicio('inicio-mediciones.tsx'),
      ...INICIO_COMUN,
    ],
    prohibidos: terminosProhibidosDeAntropometriaEn,
    minimo: 5,
  },
  {
    nombre: 'entrenamiento',
    archivos: [...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/training')), join(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx'), inicio('inicio-entrenamiento.tsx'), movil('lecturas-de-inicio.ts'), ...INICIO_COMUN],
    prohibidos: terminosProhibidosDeEntrenamientoEn,
    minimo: 7,
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
  const fuente = ts.createSourceFile(archivo, contenido, ts.ScriptTarget.Latest, true, tipoDeArchivo(archivo));
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
 *
 * DL-113: el titular dejó de ser un `<h4>` por tarjeta y pasó a ser la fila de la lista de mediciones
 * (`medicion__fila`). Cambió dónde se busca; lo que se exige es lo mismo.
 */
test('T13 · el titular de la medición muestra el valor vigente, no el original', () => {
  const archivo = join(RAIZ, 'apps/web/src/app/pro/advisees/anthropometry/evaluaciones.tsx');
  const fuente = ts.createSourceFile(archivo, readFileSync(archivo, 'utf8'), ts.ScriptTarget.Latest, true, tipoDeArchivo(archivo));
  let titular = null;
  const visitar = (n) => {
    if (ts.isJsxElement(n) && /className="medicion__fila"/.test(n.openingElement.getText())) titular = n.getText();
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

/**
 * WP-06 §9.2 · la guardia estructural de entrenamiento. «No realizada» es copy legítimo cuando el asesorado lo
 * registró y prohibido cuando se deriva de la ausencia (B10-06:794-796): la misma cadena, las dos cosas. Una lista
 * negra no las distingue. Esta prueba fija, sobre el código de las pantallas, que:
 * - ninguna pantalla escribe «No realizada» por su cuenta: el texto vive solo en el dominio;
 * - el estado de una ocurrencia se muestra solo a través de `vistaDeOcurrencia`, que llega a la condición únicamente
 *   por una ejecución registrada;
 * - ninguna pantalla lee `execution.sessionCondition` directamente, que es la puerta para saltearse esa función.
 */
test('WP-06 §9.2 · ninguna pantalla de entrenamiento deriva «No realizada» de la ausencia de registro', () => {
  const archivos = [...tsx(join(RAIZ, 'apps/web/src/app/pro/advisees/training')), join(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx')];
  assert.ok(archivos.length >= 7, `se esperaban las pantallas de entrenamiento, hay ${archivos.length}`);
  const hallazgos = [];
  for (const a of archivos) {
    const contenido = readFileSync(a, 'utf8');
    for (const { texto, linea } of textosDe(a, contenido)) if (/no realizad/i.test(texto)) hallazgos.push(`${a.slice(RAIZ.length + 1)}:${linea} escribe ${JSON.stringify(texto)}`);
    if (/execution\.sessionCondition/.test(contenido)) hallazgos.push(`${a.slice(RAIZ.length + 1)} lee execution.sessionCondition sin pasar por vistaDeOcurrencia`);
  }
  assert.deepEqual(hallazgos, []);
  // La pantalla que lista ocurrencias usa la función: si alguien la saca, esta línea lo dice.
  assert.match(readFileSync(join(RAIZ, 'apps/mobile/src/pantallas/entrenamiento.tsx'), 'utf8'), /vistaDeOcurrencia\(/);
});

test('WP-06 §9.2 · la guardia detecta una pantalla que escribe «No realizada» o lee la condición suelta', () => {
  const contenido = "export const X = ({ o }) => <p>{o.execution.sessionCondition ? 'Registrada' : 'No realizada'}</p>;";
  const textos = textosDe('fixture.tsx', contenido).map((t) => t.texto);
  assert.ok(textos.some((t) => /no realizad/i.test(t)));
  assert.match(contenido, /execution\.sessionCondition/);
});
