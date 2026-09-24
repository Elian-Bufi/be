/**
 * RNF-ACC-001 (TEST-RNF-ACC-001): «contraste suficiente», con WCAG 2.2 AA como marco. B10-10 §7 deja los tokens al
 * sistema visual; esta prueba es la que impide que el sistema visual elija un color que no se lee.
 *
 * Lee los tokens de donde viven —`apps/web/src/app/tokens.css` (tema claro en `:root`, oscuro en `.tema-oscuro`) y
 * `apps/mobile/src/tema.ts`— y calcula la relación de contraste de cada par que las pantallas usan:
 * - texto sobre su fondo: 4,5:1 (WCAG 1.4.3);
 * - borde de un control, foco y puntos de la figura antropométrica: 3:1 (WCAG 1.4.11).
 *
 * Un par nuevo en las pantallas se declara acá. Un color que no está en los tokens no se puede verificar, y por eso la
 * prueba también falla si una hoja de estilo o un componente escribe un color literal fuera de los tokens.
 *
 * Uso: node --test scripts/contraste.test.cjs
 */
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');
const test = require('node:test');

const RAIZ = join(__dirname, '..');
const TOKENS_WEB = join(RAIZ, 'apps/web/src/app/tokens.css');
const TEMA_APK = join(RAIZ, 'apps/mobile/src/tema.ts');

// ─── WCAG 2.2: luminancia relativa y relación de contraste ──────────────────────────────────────
const lineal = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
function luminancia(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Color no válido para la prueba: ${hex} (se esperan seis dígitos hexadecimales)`);
  const n = parseInt(m[1], 16);
  return 0.2126 * lineal(n >> 16) + 0.7152 * lineal((n >> 8) & 255) + 0.0722 * lineal(n & 255);
}
function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

// ─── Lectura de los tokens ──────────────────────────────────────────────────────────────────────
function bloqueCss(css, selector) {
  const inicio = css.indexOf(`${selector} {`);
  assert.ok(inicio >= 0, `tokens.css no tiene el bloque ${selector}`);
  const fin = css.indexOf('}', inicio);
  const tokens = {};
  for (const [, nombre, valor] of css.slice(inicio, fin).matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) tokens[nombre] = valor.toLowerCase();
  return tokens;
}

function temasWeb() {
  const css = readFileSync(TOKENS_WEB, 'utf8');
  const claro = bloqueCss(css, ':root');
  // El tema oscuro redefine lo que cambia; el resto (el encabezado, la marca) es el mismo en los dos.
  const oscuro = { ...claro, ...bloqueCss(css, '.tema-oscuro') };
  return { claro, oscuro };
}

function temaApk() {
  const ts = readFileSync(TEMA_APK, 'utf8');
  const inicio = ts.indexOf('export const COLOR = {');
  assert.ok(inicio >= 0, 'tema.ts no exporta COLOR');
  const cuerpo = ts.slice(inicio, ts.indexOf('}', inicio));
  const tokens = {};
  for (const [, nombre, valor] of cuerpo.matchAll(/(\w+):\s*'(#[0-9a-f]{6})'/gi)) tokens[nombre] = valor.toLowerCase();
  return tokens;
}

// ─── Los pares que las pantallas usan ───────────────────────────────────────────────────────────
const TEXTO = 4.5;
const NO_TEXTO = 3;

/** [primer plano, fondo, mínimo, dónde se usa] — los nombres son los de tokens.css. */
const PARES_WEB = [
  ['texto', 'fondo', TEXTO, 'texto de la página'],
  ['texto', 'fondo-suave', TEXTO, 'texto en tarjetas, avisos y filas destacadas'],
  ['texto', 'superficie', TEXTO, 'texto en secciones'],
  ['tenue', 'fondo', TEXTO, 'ayudas, notas y datos secundarios'],
  ['tenue', 'fondo-suave', TEXTO, 'ayudas dentro de tarjetas'],
  ['tenue', 'superficie', TEXTO, 'ayudas dentro de secciones'],
  ['enlace', 'fondo', TEXTO, 'enlaces'],
  ['enlace', 'fondo-suave', TEXTO, 'enlaces dentro de tarjetas'],
  ['boton-texto', 'boton-fondo', TEXTO, 'botón primario'],
  ['boton-texto', 'boton-fondo-activo', TEXTO, 'botón primario al pasar el puntero'],
  ['boton-secundario-texto', 'fondo', TEXTO, 'botón secundario'],
  ['boton-secundario-texto', 'superficie', TEXTO, 'botón secundario dentro de una sección'],
  ['error', 'fondo', TEXTO, 'mensaje de error junto al campo'],
  ['error', 'error-fondo', TEXTO, 'título de un aviso de error'],
  ['texto', 'error-fondo', TEXTO, 'cuerpo de un aviso de error'],
  ['peligro-texto', 'peligro-fondo', TEXTO, 'botón de una acción destructiva'],
  ['exito', 'exito-fondo', TEXTO, 'título de un aviso de éxito'],
  ['texto', 'exito-fondo', TEXTO, 'cuerpo de un aviso de éxito'],
  ['encabezado-texto', 'encabezado-fondo', TEXTO, 'marca y navegación del encabezado'],
  ['encabezado-texto', 'encabezado-fondo-2', TEXTO, 'marca y navegación, del otro lado del degradé del encabezado'],
  ['encabezado-tenue', 'encabezado-fondo', TEXTO, 'aviso de ambiente de prueba en el encabezado'],
  ['encabezado-tenue', 'encabezado-fondo-2', TEXTO, 'aviso de ambiente de prueba, del otro lado del degradé'],
  ['borde-control', 'fondo', NO_TEXTO, 'borde de campos y casillas (1.4.11)'],
  ['borde-control', 'fondo-suave', NO_TEXTO, 'borde de campos dentro de tarjetas'],
  ['borde-control', 'superficie', NO_TEXTO, 'borde de campos dentro de secciones'],
  ['boton-secundario-borde', 'fondo', NO_TEXTO, 'contorno del botón secundario'],
  ['error', 'superficie', NO_TEXTO, 'borde de un campo con error'],
  ['foco', 'fondo', NO_TEXTO, 'anillo de foco'],
  ['foco', 'fondo-suave', NO_TEXTO, 'anillo de foco dentro de tarjetas'],
  ['foco', 'superficie', NO_TEXTO, 'anillo de foco dentro de secciones'],
  ['encabezado-foco', 'encabezado-fondo', NO_TEXTO, 'anillo de foco en el encabezado'],
  ['encabezado-foco', 'encabezado-fondo-2', NO_TEXTO, 'anillo de foco en el encabezado, del otro lado del degradé'],
];

/** Solo en el tema claro: la figura de la toma antropométrica vive en el espacio profesional (tramo D). */
const PARES_FIGURA = [
  ['figura-trazo', 'superficie', NO_TEXTO, 'contorno de la silueta sobre su tarjeta'],
  ['punto', 'figura-relleno', NO_TEXTO, 'punto de toma sobre la figura'],
  ['punto', 'punto-halo', NO_TEXTO, 'punto de toma sobre su halo'],
  ['punto', 'superficie', NO_TEXTO, 'anillo de perímetro que sale de la figura'],
];

const PARES_APK = [
  ['texto', 'fondo', TEXTO, 'texto de la pantalla'],
  ['texto', 'superficie', TEXTO, 'texto en tarjetas y secciones'],
  ['tenue', 'fondo', TEXTO, 'ayudas y notas'],
  ['tenue', 'superficie', TEXTO, 'ayudas dentro de tarjetas'],
  ['acento', 'fondo', TEXTO, 'enlaces y botón secundario'],
  ['acento', 'superficie', TEXTO, 'botón secundario dentro de una tarjeta'],
  ['botonTexto', 'botonFondo', TEXTO, 'botón primario y casilla marcada'],
  ['peligroTexto', 'peligroFondo', TEXTO, 'botón de una acción destructiva'],
  ['error', 'fondo', TEXTO, 'mensaje de error junto al campo'],
  ['error', 'superficie', TEXTO, 'mensaje de error dentro de una tarjeta'],
  ['error', 'errorFondo', TEXTO, 'título de un aviso de error'],
  ['texto', 'errorFondo', TEXTO, 'cuerpo de un aviso de error'],
  ['exito', 'exitoFondo', TEXTO, 'título de un aviso de éxito'],
  ['texto', 'exitoFondo', TEXTO, 'cuerpo de un aviso de éxito'],
  ['bordeControl', 'fondo', NO_TEXTO, 'borde de campos y casillas (1.4.11)'],
  ['bordeControl', 'superficie', NO_TEXTO, 'borde de campos dentro de tarjetas'],
  ['acento', 'fondo', NO_TEXTO, 'borde de casillas y opciones elegidas'],
];

function verificar(tema, pares, nombreDelTema) {
  const fallas = [];
  for (const [frente, fondo, minimo, uso] of pares) {
    assert.ok(tema[frente], `${nombreDelTema}: falta el token «${frente}» (${uso})`);
    assert.ok(tema[fondo], `${nombreDelTema}: falta el token «${fondo}» (${uso})`);
    const relacion = contraste(tema[frente], tema[fondo]);
    if (relacion < minimo) fallas.push(`${nombreDelTema} · ${uso}: ${frente} ${tema[frente]} sobre ${fondo} ${tema[fondo]} = ${relacion.toFixed(2)}:1 (mínimo ${minimo}:1)`);
  }
  assert.deepEqual(fallas, [], `Pares sin contraste suficiente:\n${fallas.join('\n')}`);
}

test('la fórmula de contraste es la de WCAG 2.2', () => {
  assert.equal(contraste('#000000', '#ffffff').toFixed(2), '21.00');
  assert.equal(contraste('#ffffff', '#ffffff').toFixed(2), '1.00');
  // Los dos defectos que existían antes del tramo A: por eso la prueba existe.
  assert.ok(contraste('#d1d5db', '#ffffff') < NO_TEXTO, 'el borde viejo de los campos no llegaba a 3:1');
  assert.ok(contraste('#f59e0b', '#ffffff') < NO_TEXTO, 'el foco viejo no llegaba a 3:1');
});

test('website · tema claro (espacio profesional y cuenta)', () => {
  const { claro } = temasWeb();
  verificar(claro, [...PARES_WEB, ...PARES_FIGURA], 'claro');
});

test('website · tema oscuro (landing, acceso, registro y legales)', () => {
  const { oscuro } = temasWeb();
  verificar(oscuro, PARES_WEB, 'oscuro');
});

/**
 * La cara pública pinta un degradé (`.tema-oscuro` en globals.css): de `fondo` a `fondo-suave`, con un velo del azul
 * encima. axe-core no puede medir texto sobre un degradé —lo deja «para revisión manual»—, así que se mide acá, en sus
 * puntos extremos: los dos colores de base y la mezcla más clara, con la proporción que declara la hoja de estilos.
 */
test('website · el texto de la cara pública se lee en todo el degradé', () => {
  const { oscuro } = temasWeb();
  const css = readFileSync(join(RAIZ, 'apps/web/src/app/globals.css'), 'utf8');
  const bloque = css.slice(css.indexOf('.tema-oscuro {'), css.indexOf('}', css.indexOf('.tema-oscuro {')));
  const velo = /color-mix\(in srgb, var\(--azul\) (\d+)%, transparent\)/.exec(bloque);
  assert.ok(velo, 'el degradé de .tema-oscuro cambió de forma: actualizar esta prueba');
  const proporcion = Number(velo[1]) / 100;
  const hex = (n) => Math.round(n).toString(16).padStart(2, '0');
  const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16));
  const mezcla = (arriba, abajo, p) => `#${rgb(arriba).map((c, i) => hex(c * p + rgb(abajo)[i] * (1 - p))).join('')}`;
  const fondos = { fondo: oscuro.fondo, 'fondo-suave': oscuro['fondo-suave'], 'velo del azul sobre el fondo': mezcla(oscuro.azul, oscuro.fondo, proporcion) };
  const fallas = [];
  for (const [nombreDelFondo, fondo] of Object.entries(fondos)) {
    for (const frente of ['texto', 'tenue', 'enlace', 'error', 'exito']) {
      const relacion = contraste(oscuro[frente], fondo);
      if (relacion < TEXTO) fallas.push(`${frente} sobre ${nombreDelFondo} (${fondo}) = ${relacion.toFixed(2)}:1`);
    }
  }
  assert.deepEqual(fallas, []);
});

test('APK · tema oscuro', () => {
  verificar(temaApk(), PARES_APK, 'APK');
});

/** Todo color literal en estilos vive en los tokens: si no, la prueba no lo ve. */
test('ningún estilo del website ni de la APK escribe un color fuera de los tokens', () => {
  const archivos = [];
  const recorrer = (dir) => {
    for (const nombre of readdirSync(dir)) {
      const ruta = join(dir, nombre);
      if (statSync(ruta).isDirectory()) recorrer(ruta);
      else if (/\.(css|tsx?)$/.test(nombre) && ruta !== TOKENS_WEB && ruta !== TEMA_APK) archivos.push(ruta);
    }
  };
  recorrer(join(RAIZ, 'apps/web/src'));
  recorrer(join(RAIZ, 'apps/mobile/src'));
  archivos.push(join(RAIZ, 'apps/mobile/App.tsx'));
  const literales = [];
  for (const archivo of archivos) {
    readFileSync(archivo, 'utf8')
      .split('\n')
      .forEach((linea, i) => {
        const sinComentario = linea.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
        for (const [color] of sinComentario.matchAll(/#[0-9a-f]{3,8}\b(?![-\w])/gi)) {
          // Un «#» seguido de hexadecimal en un selector o una ancla no es un color.
          if (/href=|id=|getElementById|querySelector/.test(sinComentario)) continue;
          literales.push(`${relative(RAIZ, archivo)}:${i + 1} ${color}`);
        }
        if (/\brgba?\(\s*\d/.test(sinComentario)) literales.push(`${relative(RAIZ, archivo)}:${i + 1} rgb()`);
      });
  }
  assert.deepEqual(literales, [], `Colores escritos fuera de los tokens:\n${literales.join('\n')}`);
});
