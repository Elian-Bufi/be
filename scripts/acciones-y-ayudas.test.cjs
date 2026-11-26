/**
 * RP-24 (WP-RECORRIDO-PLAN-PULIDO, DL-188) · La guardia de las acciones y los «?» de la planificación.
 *
 * Dirección (22/11): «no usar texto subrayado como enlace para acciones, a menos que lo amerite: ensucia mucho y da
 * aspecto de web vieja»; y el «?» «no va al lado del título: va en la esquina superior derecha» de su sección o tarjeta.
 * Esta prueba recorre el JSX con el compilador de TypeScript y falla si vuelve alguna de las dos cosas:
 *
 * 1. En la planificación (Nutrición, Entrenamiento, la evaluación, plantillas, habituales, recetas y las piezas compartidas
 *    de la ficha), un elemento con la clase `boton--enlace` tiene que ser un enlace de verdad, dentro de una frase: un
 *    `Enlace`, un `Link` o un `<a href>`. DL-196 (E2, regla más estricta de Dirección del 23/11): un botón nunca va
 *    subrayado, ni siquiera los «Ir a…» de listas y avisos que llevan a otro lugar (`data-navega`): esos van como
 *    `boton--discreto` con flecha (`boton--con-flecha`). Una acción (cambiar, quitar, duplicar, abrir un cuadro, desplegar,
 *    reintentar) es un botón: `boton--discreto`, `boton--quieto` o `boton--secundario`.
 * 2. Un `<a>` no es una acción: no lleva `onClick` sin `href`.
 * 3. En todo /pro y en los componentes, un «?» (`ExplicacionAPedido` sin `boton="Fuente"`) va con `lugar="esquina"`, y
 *    nunca adentro de un título (`h1` a `h6`). La clase `titulo-con-ayuda`, que lo ponía al lado del título, no vuelve.
 *
 * Uso: node --test scripts/acciones-y-ayudas.test.cjs
 */
const assert = require('node:assert/strict');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const RAIZ = join(__dirname, '..');
const WEB = join(RAIZ, 'apps/web/src');

function archivos(dir, recursivo = true) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return recursivo ? archivos(ruta) : [];
    return nombre.endsWith('.tsx') ? [ruta] : [];
  });
}

/** La planificación y sus piezas compartidas: donde una acción no se escribe como enlace. */
const PLANIFICACION = [
  // DL-200: Antropometría también (las acciones de la toma, sus resultados y «Qué vas a calcular»).
  ...['advisees/nutrition', 'advisees/training', 'advisees/evaluacion', 'advisees/anthropometry', 'templates', 'recipes'].flatMap((d) => archivos(join(WEB, 'app/pro', d))),
  ...archivos(join(WEB, 'app/pro/advisees'), false),
  ...['texto-a-pedido.tsx', 'cuadro-enfocado.tsx', 'campo-de-fecha.tsx', 'estados.tsx', 'explicacion-a-pedido.tsx'].map((n) => join(WEB, 'components', n)),
];
/** Donde rige la regla del «?»: todo /pro y los componentes. */
const CON_AYUDAS = [...archivos(join(WEB, 'app/pro')), ...archivos(join(WEB, 'components'))];

const NAVEGACION = new Set(['Enlace', 'Link']);

function nombreDe(tag) {
  return ts.isIdentifier(tag) ? tag.text : tag.getText();
}

function atributo(attrs, nombre) {
  return attrs.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText() === nombre);
}

/** El texto fijo de un `className`: una cadena o lo fijo de una plantilla. */
function textoDeLaClase(attrs) {
  const a = atributo(attrs, 'className');
  if (!a || !a.initializer) return '';
  const v = a.initializer;
  if (ts.isStringLiteral(v)) return v.text;
  if (ts.isJsxExpression(v) && v.expression) {
    const e = v.expression;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
    if (ts.isTemplateExpression(e)) return [e.head.text, ...e.templateSpans.map((s) => s.literal.text)].join(' ');
    return e.getText();
  }
  return '';
}

function valorDeCadena(a) {
  if (!a || !a.initializer) return null;
  if (ts.isStringLiteral(a.initializer)) return a.initializer.text;
  if (ts.isJsxExpression(a.initializer) && a.initializer.expression && ts.isStringLiteral(a.initializer.expression)) return a.initializer.expression.text;
  return null;
}

/** Lo que encuentra en un archivo: `{ acciones, ayudas }`, cada uno una lista de «archivo:renglón qué». */
function revisar(fuenteTexto, ruta, { planificacion = true, ayudas = true } = {}) {
  const fuente = ts.createSourceFile(ruta, fuenteTexto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const acciones = [];
  const deAyuda = [];
  const donde = (n) => `${ruta}:${fuente.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
  const dentroDeUnTitulo = (n) => {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isJsxElement(p) && /^h[1-6]$/.test(nombreDe(p.openingElement.tagName))) return true;
    }
    return false;
  };
  const visitar = (n) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = nombreDe(n.tagName);
      const clase = textoDeLaClase(n.attributes);
      if (planificacion) {
        if (/\bboton--enlace\b/.test(clase)) {
          const enlace = NAVEGACION.has(tag) || (tag === 'a' && atributo(n.attributes, 'href'));
          if (!enlace) acciones.push(`${donde(n)} <${tag}> con boton--enlace: un botón va como botón discreto (si lleva a otro lugar, con flecha: boton--con-flecha)`);
        }
        // DL-196 (E2): lo que lleva a otro lugar desde una lista o un aviso es un botón discreto con su flecha.
        if (tag === 'button' && atributo(n.attributes, 'data-navega') && !/\bboton--discreto\b/.test(clase)) {
          acciones.push(`${donde(n)} <button data-navega> sin boton--discreto: un «Ir a…» va como botón discreto con flecha`);
        }
        if (tag === 'a' && atributo(n.attributes, 'onClick') && !atributo(n.attributes, 'href')) acciones.push(`${donde(n)} <a> con onClick y sin href: es un botón`);
      }
      if (ayudas) {
        if (/\btitulo-con-ayuda\b/.test(clase)) deAyuda.push(`${donde(n)} titulo-con-ayuda: el «?» va en la esquina (EncabezadoConAyuda)`);
        if (tag === 'ExplicacionAPedido') {
          const esFuente = valorDeCadena(atributo(n.attributes, 'boton')) === 'Fuente';
          if (!esFuente && valorDeCadena(atributo(n.attributes, 'lugar')) !== 'esquina') deAyuda.push(`${donde(n)} un «?» sin lugar="esquina"`);
        }
        if ((tag === 'ExplicacionAPedido' || tag === 'QueEsElRecetario') && dentroDeUnTitulo(n)) deAyuda.push(`${donde(n)} un «?» adentro de un título`);
      }
    }
    ts.forEachChild(n, visitar);
  };
  visitar(fuente);
  return { acciones, ayudas: deAyuda };
}

test('la guardia reconoce lo que tiene que rechazar (y lo que no)', () => {
  const malo = `export const X = () => (<>
    <button type="button" className="boton boton--enlace" onClick={f}>Cambiar el nombre</button>
    <button type="button" className="boton boton--enlace" data-navega onClick={() => irA('plan')}>Ir a Sesión A</button>
    <a onClick={f}>Quitar</a>
    <div className="titulo-con-ayuda"><h2>T</h2><ExplicacionAPedido nombre="x">y</ExplicacionAPedido></div>
    <h3>Recetario <QueEsElRecetario /></h3>
  </>);`;
  const r = revisar(malo, 'malo.tsx');
  // El «Ir a Sesión A» subrayado cuenta dos veces: subrayado y sin botón discreto (DL-196, E2).
  assert.equal(r.acciones.length, 4, r.acciones.join('\n'));
  assert.equal(r.ayudas.length, 3, r.ayudas.join('\n'));
  const bueno = `export const X = () => (<>
    <button type="button" className="boton boton--discreto" onClick={f}>Cambiar el nombre</button>
    <button type="button" className="boton boton--discreto boton--con-flecha" data-navega onClick={() => irA('plan')}>Ver plan</button>
    <Enlace className="boton boton--enlace" href="/pro">Ver la toma</Enlace>
    <EncabezadoConAyuda titulo="T" nombre="x" ayuda="y" />
    <ExplicacionAPedido nombre="x" lugar="esquina">y</ExplicacionAPedido>
    <ExplicacionAPedido boton="Fuente" nombre="x">cita</ExplicacionAPedido>
  </>);`;
  assert.deepEqual(revisar(bueno, 'bueno.tsx'), { acciones: [], ayudas: [] });
});

test('en la planificación, ninguna acción va escrita como enlace subrayado', () => {
  const todas = PLANIFICACION.flatMap((ruta) => revisar(readFileSync(ruta, 'utf8'), relative(RAIZ, ruta), { ayudas: false }).acciones);
  assert.deepEqual(todas, []);
});

test('en /pro, el «?» va en la esquina, nunca al lado ni adentro de un título', () => {
  const todas = CON_AYUDAS.flatMap((ruta) => revisar(readFileSync(ruta, 'utf8'), relative(RAIZ, ruta), { planificacion: false }).ayudas);
  assert.deepEqual(todas, []);
  const estilos = readFileSync(join(WEB, 'app/globals.css'), 'utf8');
  assert.doesNotMatch(estilos, /^\.titulo-con-ayuda/m, 'el bloque viejo de .titulo-con-ayuda no vuelve');
  assert.match(estilos, /\.a-pedido--esquina > \.a-pedido__texto:not\(\[hidden\]\) \{[^}]*position: absolute;/, 'lo que abre el «?» flota: no corre lo de abajo');
  assert.match(estilos, /\.boton--discreto \{[^}]*text-decoration: none;/, 'el botón discreto no se subraya');
  assert.match(estilos, /\.boton--con-flecha::after \{[^}]*content: '›' \/ '';/, 'el «Ir a…» lleva su flecha, que el lector no lee');
});

test('II.17 · en un cuadro que se cierra, el «?» va pegado al título, a su derecha, nunca junto a «Cerrar»', () => {
  const cuadro = readFileSync(join(WEB, 'components/cuadro-enfocado.tsx'), 'utf8');
  const fuente = ts.createSourceFile('cuadro-enfocado.tsx', cuadro, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const clase = (n) => (ts.isJsxElement(n) ? textoDeLaClase(n.openingElement.attributes) : ts.isJsxSelfClosingElement(n) ? textoDeLaClase(n.attributes) : '');
  let renglon = null;
  let cabecera = null;
  const buscar = (n) => {
    if (/\bcuadro-enfocado__renglon-del-titulo\b/.test(clase(n))) renglon = n;
    if (/\bcajon__cabecera\b/.test(clase(n))) cabecera = n;
    ts.forEachChild(n, buscar);
  };
  buscar(fuente);
  assert.ok(renglon && cabecera, 'el renglón del título y la cabecera del cuadro');
  const texto = renglon.getText();
  // En el renglón, el título y después su «?».
  assert.ok(texto.indexOf('<h2') >= 0 && texto.indexOf('<h2') < texto.indexOf('data-ayuda-del-cuadro'), 'el «?» después del título, en su renglón');
  assert.doesNotMatch(texto, /cajon__cerrar/, '«Cerrar» no va en el renglón del título');
  // En la cabecera, el «?» ya no es un hijo suelto al lado de «Cerrar».
  const hijos = cabecera.children.filter((h) => ts.isJsxElement(h) || ts.isJsxSelfClosingElement(h) || ts.isJsxExpression(h)).map((h) => h.getText());
  assert.ok(!hijos.some((h) => /data-ayuda-del-cuadro/.test(h) && !/cuadro-enfocado__renglon-del-titulo/.test(h)), 'el «?» no queda junto a «Cerrar»');
  const estilos = readFileSync(join(WEB, 'app/globals.css'), 'utf8');
  assert.match(estilos, /\.cuadro-enfocado__renglon-del-titulo \{[^}]*align-items: center;/, 'alineado verticalmente con el título');
  assert.doesNotMatch(estilos.match(/\.cuadro-enfocado__ayuda \{[^}]*\}/)[0], /margin-inline-start: auto/, 'no se empuja hacia «Cerrar»');
});

module.exports = { revisar };
