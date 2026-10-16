/**
 * Un enlace interno del website es un `Link` de Next, nunca un `<a href>` suelto. La sesión vive solo en la memoria de
 * la pestaña (DL-012): un ancla común carga la página de nuevo, y la persona queda fuera de su sesión, frente a
 * «Iniciar sesión». Pasó con «Volver a la ficha, donde estabas» en el aviso de una revisión registrada: el enlace que
 * ofrecía la vuelta era el que la cortaba (WP-ESCRITORIO-AREAS, parte 0).
 *
 * Esta prueba recorre el JSX del website con el compilador de TypeScript y exige que todo `<a>` sea de uno de los
 * casos que no recargan la aplicación: un ancla dentro de la misma página (`#campo`), una dirección de otro sitio, un
 * correo o un teléfono, o una descarga (`download`).
 *
 * Uso: node --test scripts/enlaces-del-website.test.cjs
 */
const assert = require('node:assert/strict');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const RAIZ = join(__dirname, '..');
const WEB = join(RAIZ, 'apps/web/src');

/** Todos los `.tsx` del website. */
function archivos(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return nombre.endsWith('.tsx') ? [ruta] : [];
  });
}

/** Destinos que no recargan la aplicación: dentro de la página, a otro sitio, un correo o un teléfono. */
const NO_RECARGA = /^(#|https?:\/\/|mailto:|tel:)/;

/** El comienzo fijo de un texto escrito en el código: una cadena o el arranque de una plantilla. Si no, `null`. */
function comienzoDe(e) {
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
  if (ts.isTemplateExpression(e)) return e.head.text;
  return null;
}

/**
 * El comienzo fijo del `href`, si se puede saber leyendo el archivo: escrito en el atributo, o en una constante del
 * mismo archivo (`const APK = 'https://…'`). `null` si el destino se arma en otro lado.
 */
function comienzoDelDestino(atributo, fuente) {
  const valor = atributo.initializer;
  if (!valor) return null;
  if (ts.isStringLiteral(valor)) return valor.text;
  if (!ts.isJsxExpression(valor) || !valor.expression) return null;
  const e = valor.expression;
  if (!ts.isIdentifier(e)) return comienzoDe(e);
  for (const sentencia of fuente.statements) {
    if (!ts.isVariableStatement(sentencia)) continue;
    for (const d of sentencia.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.name.text === e.text && d.initializer) return comienzoDe(d.initializer);
    }
  }
  return null;
}

/** Las anclas de un archivo que cargarían la página de nuevo, con su línea. */
function anclasQueRecargan(ruta, texto = readFileSync(ruta, 'utf8')) {
  const fuente = ts.createSourceFile(ruta, texto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const halladas = [];
  const mirar = (nodo) => {
    if ((ts.isJsxOpeningElement(nodo) || ts.isJsxSelfClosingElement(nodo)) && nodo.tagName.getText(fuente) === 'a') {
      const atributos = nodo.attributes.properties.filter(ts.isJsxAttribute);
      const href = atributos.find((a) => a.name.getText(fuente) === 'href');
      const descarga = atributos.some((a) => a.name.getText(fuente) === 'download');
      const comienzo = href ? comienzoDelDestino(href, fuente) : null;
      if (href && !descarga && !(comienzo !== null && NO_RECARGA.test(comienzo))) {
        const { line } = fuente.getLineAndCharacterOfPosition(nodo.getStart(fuente));
        halladas.push(`${relative(RAIZ, ruta).replace(/\\/g, '/')}:${line + 1} · ${nodo.getText(fuente).replace(/\s+/g, ' ').slice(0, 90)}`);
      }
    }
    ts.forEachChild(nodo, mirar);
  };
  mirar(fuente);
  return halladas;
}

test('ningún enlace interno del website es un ancla suelta: recargaría la página y cortaría la sesión', () => {
  const todos = archivos(WEB);
  assert.ok(todos.length > 50, `se esperaban los archivos del website y hay ${todos.length}`);
  const halladas = todos.flatMap((ruta) => anclasQueRecargan(ruta));
  assert.deepEqual(halladas, [], `Estos enlaces tienen que ser un Link de next/link:\n${halladas.join('\n')}`);
});

test('la prueba distingue un ancla que recarga de las que no', () => {
  const caso = (jsx, antes = '') => anclasQueRecargan(join(WEB, 'caso.tsx'), `${antes}export const X = () => (<p>${jsx}</p>);`).length;
  // Las que recargan: un destino interno escrito a mano, uno armado con una plantilla, uno que llega en una variable
  // y uno escrito en una constante del archivo.
  assert.equal(caso('<a href="/pro">Volver</a>'), 1);
  assert.equal(caso('<a href={`/pro/advisees?id=${id}`}>Ficha</a>'), 1);
  assert.equal(caso('<a href={retorno}>Volver a la ficha, donde estabas</a>'), 1);
  assert.equal(caso('<a href={aviso.volver}>Volver a la ficha, donde estabas</a>'), 1);
  assert.equal(caso('<a className="boton" href={FICHA}>Ficha</a>', "const FICHA = '/pro/advisees';\n"), 1);
  // Una dirección de otro sitio, escrita en una constante del archivo, no recarga la aplicación.
  assert.equal(caso('<a className="boton" href={APK}>Descargar</a>', "const APK = 'https://ejemplo.invalid/descarga';\n"), 0);
  // Las que no: dentro de la página, a otro sitio, un correo y una descarga.
  assert.equal(caso('<a href="#contenido">Ir al contenido</a>'), 0);
  assert.equal(caso('<a href={`#${campo}`}>El campo</a>'), 0);
  assert.equal(caso('<a href="https://ejemplo.invalid">Otro sitio</a>'), 0);
  assert.equal(caso('<a href="mailto:alguien@ejemplo.invalid">Escribir</a>'), 0);
  assert.equal(caso('<a href={archivo} download="datos.csv">Descargar</a>'), 0);
  // Y un `Link` no es un ancla.
  assert.equal(caso('<Link href="/pro">Volver</Link>'), 0);
});
