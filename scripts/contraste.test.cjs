/**
 * RNF-ACC-001 (TEST-RNF-ACC-001): «contraste suficiente», con WCAG 2.2 AA como marco. B10-10 §7 deja los tokens al
 * sistema visual; esta prueba es la que impide que el sistema visual elija un color que no se lee.
 *
 * Lee los tokens de donde viven —`apps/web/src/app/tokens.css` («Claro» en `:root`, «Azul noche» en
 * `[data-tema='azul-noche']`; la persona elige, Dirección 2026-09-30) y
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
const hex = (n) => Math.round(n).toString(16).padStart(2, '0');
const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(1 + i, 3 + i), 16));
/** El color que se ve con `arriba` en una proporción `p` sobre `abajo` (una capa translúcida). */
const mezcla = (arriba, abajo, p) => `#${rgb(arriba).map((c, i) => hex(c * p + rgb(abajo)[i] * (1 - p))).join('')}`;

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
  // Azul noche redefine lo que cambia; el resto (el encabezado, la marca) es el mismo en los dos.
  const oscuro = { ...claro, ...bloqueCss(css, "[data-tema='azul-noche']") };
  return { claro, oscuro };
}

/** Los dos temas de la APK (`AZUL_NOCHE` y `CLARO` en tema.ts): solo los valores hexadecimales; el velo no es texto. */
function temaApk(nombre) {
  const ts = readFileSync(TEMA_APK, 'utf8');
  const inicio = ts.search(new RegExp(`export const ${nombre}(: \\w+)? = \\{`));
  assert.ok(inicio >= 0, `tema.ts no exporta ${nombre}`);
  const cuerpo = ts.slice(inicio, ts.indexOf('};', inicio));
  const tokens = {};
  for (const [, clave, valor] of cuerpo.matchAll(/(\w+):\s*'(#[0-9a-f]{6})'/gi)) tokens[clave] = valor.toLowerCase();
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
  ['encabezado-tenue', 'encabezado-fondo', TEXTO, 'borde del botón de la cuenta y de su retrato, en el encabezado (se sigue midiendo como texto)'],
  ['encabezado-tenue', 'encabezado-fondo-2', TEXTO, 'el mismo borde, del otro lado del degradé del encabezado'],
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

/** En las dos apariencias: la figura de la toma antropométrica se ve en cualquiera (tramo D; Dirección 2026-09-30). */
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
  ['acento', 'superficieElevada', TEXTO, 'botón secundario tonal y opción elegida'],
  ['texto', 'superficieElevada', TEXTO, 'texto en fichas y en la zona elegida'],
  ['tenue', 'superficieElevada', TEXTO, 'detalle dentro de una ficha'],
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
  ['laminaNombre', 'laminaTarjeta', TEXTO, 'rótulo de un sitio en la lámina de la toma'],
  ['laminaValor', 'laminaTarjeta', TEXTO, 'valor de un sitio en la lámina de la toma'],
  ['laminaDetalle', 'laminaTarjeta', TEXTO, 'diferencia con la toma anterior en la lámina'],
  ['laminaContorno', 'laminaFondo', NO_TEXTO, 'contorno de la silueta sobre la lámina de la toma (1.4.11)'],
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

/** En las dos apariencias: los gráficos de entrenamiento y de antropometría se ven en cualquiera. */
const PARES_GRAFICO = [
  ['grafico-planificado', 'superficie', NO_TEXTO, 'barras, franjas y línea de lo planificado'],
  ['grafico-registrado', 'superficie', NO_TEXTO, 'barras, puntos y línea de lo registrado'],
  ['grafico-planificado', 'fondo-suave', NO_TEXTO, 'muestra de lo planificado en la leyenda'],
  ['grafico-registrado', 'fondo-suave', NO_TEXTO, 'muestra de lo registrado en la leyenda'],
  ['grafico-hueco', 'superficie', NO_TEXTO, 'rayado de una sesión sin dato en el gráfico'],
  // «Analizar» (WP-DASHBOARD-PROFESIONAL): línea, punto y muestra de cada métrica, sobre el lienzo y en la leyenda.
  ['metrica-1', 'superficie', NO_TEXTO, 'línea y puntos de la primera métrica'],
  ['metrica-2', 'superficie', NO_TEXTO, 'línea y puntos de la segunda métrica'],
  ['metrica-3', 'superficie', NO_TEXTO, 'línea y puntos de la tercera métrica'],
  ['metrica-1', 'fondo-suave', NO_TEXTO, 'primera métrica sobre una banda de vigencia o en el panel de lectura'],
  ['metrica-2', 'fondo-suave', NO_TEXTO, 'segunda métrica sobre una banda de vigencia o en el panel de lectura'],
  ['metrica-3', 'fondo-suave', NO_TEXTO, 'tercera métrica sobre una banda de vigencia o en el panel de lectura'],
];

/** sRGB → CIELAB (D65), para medir cuán distintos se ven dos colores (ΔE 1976). */
function lab(hex) {
  const [r, g, b] = rgb(hex).map(lineal);
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
const deltaE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

/** El matiz de un color, en grados (HSL). */
function matiz(hex) {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

/**
 * La decisión de la paleta de «Analizar»: ninguna métrica es roja, ámbar ni verde, porque se leerían como un juicio
 * (malo, alerta o bueno) o como el foco. Sus matices quedan entre los azules, los cianes y los violetas (170° a 300°).
 */
test('website · las métricas de «Analizar» no tienen matices de juicio (ni rojo, ni ámbar, ni verde)', () => {
  const fallas = [];
  for (const [nombreDelTema, tema] of Object.entries(temasWeb())) {
    for (const m of ['metrica-1', 'metrica-2', 'metrica-3']) {
      const h = matiz(tema[m]);
      if (h === null || h < 170 || h > 300) fallas.push(`${nombreDelTema} · ${m} ${tema[m]}: matiz ${h === null ? 'gris' : h.toFixed(0)}°`);
    }
  }
  assert.deepEqual(fallas, []);
});

/**
 * Las tres métricas de «Analizar» se distinguen entre sí y de lo que significa otra cosa: el foco, el error, el éxito
 * y los enlaces. ΔE ≥ 20 (una diferencia que se ve a simple vista); la forma y el trazo dan la segunda vía.
 */
test('website · las métricas de «Analizar» no se confunden entre sí ni con el foco, el error, el éxito o los enlaces', () => {
  const fallas = [];
  for (const [nombreDelTema, tema] of Object.entries(temasWeb())) {
    const metricas = ['metrica-1', 'metrica-2', 'metrica-3'];
    for (const m of metricas) {
      for (const otro of ['foco', 'error', 'exito', 'enlace', ...metricas.filter((x) => x !== m)]) {
        const d = deltaE(tema[m], tema[otro]);
        if (d < 20) fallas.push(`${nombreDelTema} · ${m} ${tema[m]} y ${otro} ${tema[otro]}: ΔE ${d.toFixed(1)}`);
      }
    }
  }
  assert.deepEqual(fallas, []);
});

test('la fórmula de contraste es la de WCAG 2.2', () => {
  assert.equal(contraste('#000000', '#ffffff').toFixed(2), '21.00');
  assert.equal(contraste('#ffffff', '#ffffff').toFixed(2), '1.00');
  // Los dos defectos que existían antes del tramo A: por eso la prueba existe.
  assert.ok(contraste('#d1d5db', '#ffffff') < NO_TEXTO, 'el borde viejo de los campos no llegaba a 3:1');
  assert.ok(contraste('#f59e0b', '#ffffff') < NO_TEXTO, 'el foco viejo no llegaba a 3:1');
});

test('website · apariencia «Claro», todas las pantallas', () => {
  const { claro } = temasWeb();
  verificar(claro, [...PARES_WEB, ...PARES_FIGURA, ...PARES_GRAFICO], 'claro');
});

test('website · apariencia «Azul noche», todas las pantallas', () => {
  const { oscuro } = temasWeb();
  verificar(oscuro, [...PARES_WEB, ...PARES_FIGURA, ...PARES_GRAFICO], 'azul noche');
});

/**
 * La cara pública pinta un degradé (`.cara-publica` en globals.css): de `fondo` a `fondo-suave`, con un velo del azul
 * encima. axe-core no puede medir texto sobre un degradé —lo deja «para revisión manual»—, así que se mide acá, en sus
 * puntos extremos: los dos colores de base y la mezcla más clara, con la proporción que declara la hoja de estilos.
 */
test('website · el texto de la cara pública se lee en todo el degradé, en las dos apariencias', () => {
  const temas = temasWeb();
  const css = readFileSync(join(RAIZ, 'apps/web/src/app/globals.css'), 'utf8');
  const bloque = css.slice(css.indexOf('.cara-publica {'), css.indexOf('}', css.indexOf('.cara-publica {')));
  const velo = /color-mix\(in srgb, var\(--azul\) (\d+)%, transparent\)/.exec(bloque);
  assert.ok(velo, 'el degradé de .cara-publica cambió de forma: actualizar esta prueba');
  const proporcion = Number(velo[1]) / 100;
  const fallas = [];
  for (const [nombreDelTema, tema] of Object.entries(temas)) {
    const fondos = { fondo: tema.fondo, 'fondo-suave': tema['fondo-suave'], 'velo del azul sobre el fondo': mezcla(tema.azul, tema.fondo, proporcion) };
    for (const [nombreDelFondo, fondo] of Object.entries(fondos)) {
      for (const frente of ['texto', 'tenue', 'enlace', 'error', 'exito']) {
        const relacion = contraste(tema[frente], fondo);
        if (relacion < TEXTO) fallas.push(`${nombreDelTema} · ${frente} sobre ${nombreDelFondo} (${fondo}) = ${relacion.toFixed(2)}:1`);
      }
    }
  }
  assert.deepEqual(fallas, []);
});

test('APK · Azul noche', () => {
  verificar(temaApk('AZUL_NOCHE'), PARES_APK, 'APK Azul noche');
});

test('APK · Claro', () => {
  verificar(temaApk('CLARO'), PARES_APK, 'APK Claro');
});

test('APK · los dos temas declaran los mismos colores', () => {
  assert.deepEqual(Object.keys(temaApk('CLARO')).sort(), Object.keys(temaApk('AZUL_NOCHE')).sort());
  assert.deepEqual(Object.keys(translucidosApk('CLARO')).sort(), Object.keys(translucidosApk('AZUL_NOCHE')).sort());
});

/** Los colores translúcidos de la APK, escritos `#rrggbbaa` en tema.ts: el vidrio de la barra inferior. */
function translucidosApk(nombre) {
  const ts = readFileSync(TEMA_APK, 'utf8');
  const inicio = ts.search(new RegExp(`export const ${nombre}(: \\w+)? = \\{`));
  const cuerpo = ts.slice(inicio, ts.indexOf('};', inicio));
  const tokens = {};
  for (const [, clave, valor] of cuerpo.matchAll(/(\w+):\s*'(#[0-9a-f]{8})'/gi)) tokens[clave] = valor.toLowerCase();
  return tokens;
}

/**
 * La barra inferior de la APK es un vidrio translúcido (DL-117): al desplazarse, el contenido pasa por detrás. Sus
 * etiquetas se miden sobre la mezcla del vidrio con cada color opaco del tema, que es el peor caso de lo que puede pasar
 * detrás, y no solo sobre el vidrio quieto.
 */
test('APK · las etiquetas de la barra se leen sobre el vidrio, pase lo que pase detrás', () => {
  const fallas = [];
  for (const nombre of ['AZUL_NOCHE', 'CLARO']) {
    const opacos = temaApk(nombre);
    const vidrio = translucidosApk(nombre).barraVidrio;
    assert.ok(vidrio, `${nombre}: falta el token «barraVidrio»`);
    const [base, alfa] = [vidrio.slice(0, 7), parseInt(vidrio.slice(7), 16) / 255];
    for (const frente of ['barraTexto', 'barraElegido']) {
      assert.ok(opacos[frente], `${nombre}: falta el token «${frente}»`);
      for (const [clave, detras] of Object.entries(opacos)) {
        const relacion = contraste(opacos[frente], mezcla(base, detras, alfa));
        if (relacion < TEXTO) fallas.push(`${nombre} · ${frente} sobre el vidrio con ${clave} detrás = ${relacion.toFixed(2)}:1`);
      }
    }
  }
  assert.deepEqual(fallas, []);
});

/**
 * El vidrio de las tarjetas (pulido del 2026-10-04): un brillo translúcido arriba. El texto se mide sobre la mezcla del
 * brillo con la tarjeta, que es donde más se aclara, además de sobre la tarjeta sola.
 */
test('APK · el brillo del vidrio no baja el contraste del texto de las tarjetas', () => {
  const fallas = [];
  for (const nombre of ['AZUL_NOCHE', 'CLARO']) {
    const opacos = temaApk(nombre);
    const translucidos = translucidosApk(nombre);
    for (const [brillo, fondo, frentes] of [
      ['laminaBrillo', 'laminaTarjeta', ['laminaNombre', 'laminaValor', 'laminaDetalle']],
      ['vidrioBrillo', 'superficie', ['texto', 'tenue', 'acento']],
    ]) {
      assert.ok(translucidos[brillo], `${nombre}: falta el token «${brillo}»`);
      const [base, alfa] = [translucidos[brillo].slice(0, 7), parseInt(translucidos[brillo].slice(7), 16) / 255];
      for (const frente of frentes) {
        const relacion = contraste(opacos[frente], mezcla(base, opacos[fondo], alfa));
        if (relacion < TEXTO) fallas.push(`${nombre} · ${frente} sobre ${fondo} con ${brillo} = ${relacion.toFixed(2)}:1`);
      }
    }
  }
  assert.deepEqual(fallas, []);
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
