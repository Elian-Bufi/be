/**
 * Auditoría automática de accesibilidad de los recorridos núcleo del website (RNF-ACC-001; TEST-RNF-ACC-001;
 * docs/paquetes/WP-IDENTIDAD-VISUAL.md, tramo F).
 *
 * RNF-ACC-001 pide «auditoría automática y revisión manual de acceso, vínculo, Hoy, registro y revisión». Este script es
 * la parte automática del website: recorre con un navegador real las pantallas núcleo —como una persona, con los
 * enlaces, porque la sesión vive solo en memoria (DL-012)— y corre axe-core en cada una con las reglas de WCAG 2.0, 2.1
 * y 2.2, niveles A y AA. Criterio de cierre: cero violaciones críticas o serias.
 *
 * Solo datos sintéticos. Las cuentas se leen de un archivo local, nunca del repositorio ni de la línea de comandos, y
 * no se imprimen.
 *
 * Uso:
 *   BE_WEB_URL=http://localhost:3200 BE_AUDITORIA_CUENTAS=ruta/a/cuentas.json [CHROME=ruta/a/chrome] \
 *     node scripts/auditoria-accesibilidad.mjs <directorio de salida>
 * `cuentas.json`: `[{ "correo": "...", "clave": "..." }]`, la primera es un profesional con al menos un asesorado
 * vinculado en los tres alcances.
 * Sale con código 1 si hay alguna violación crítica o seria.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const RUTA_DE_AXE = require.resolve('axe-core/axe.min.js');
const VERSION_DE_AXE = require('axe-core/package.json').version;

const web = (process.env.BE_WEB_URL ?? '').replace(/\/+$/, '');
const archivoDeCuentas = process.env.BE_AUDITORIA_CUENTAS;
const chrome = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const salida = resolve(process.argv[2] ?? 'auditoria-accesibilidad');
if (!web || !archivoDeCuentas) {
  console.error('Faltan BE_WEB_URL o BE_AUDITORIA_CUENTAS (ver el encabezado del script).');
  process.exit(2);
}
mkdirSync(salida, { recursive: true });
const [PRO] = JSON.parse(readFileSync(archivoDeCuentas, 'utf8'));

const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const GRAVES = new Set(['critical', 'serious']);
const resultados = [];

const navegador = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--lang=es-AR', '--no-first-run'], userDataDir: join(salida, `.perfil-${process.pid}`) });
const P = await navegador.newPage();
const erroresDeConsola = [];
P.on('pageerror', (e) => erroresDeConsola.push(e.message));

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
async function esperarCarga() {
  await pausa(900);
  await P.waitForFunction(() => !document.body.innerText.includes('Cargando'), { timeout: 120_000 });
  await pausa(300);
}
async function clickTexto(texto) {
  await P.waitForFunction((x) => [...document.querySelectorAll('button, a')].some((e) => e.textContent.trim() === x && e.offsetParent !== null), { timeout: 120_000 }, texto);
  await P.evaluate((x) => [...document.querySelectorAll('button, a')].find((e) => e.textContent.trim() === x && e.offsetParent !== null).click(), texto);
}
async function irA(enlace, ruta) {
  await clickTexto(enlace);
  await P.waitForFunction((r) => (location.pathname + location.search).startsWith(r), { timeout: 120_000 }, ruta);
  await esperarCarga();
}

/** Corre axe-core sobre la pantalla actual y guarda el resultado con el recorrido que llevó hasta ella. */
async function auditar(pantalla, recorrido) {
  await esperarCarga();
  if (!(await P.evaluate(() => typeof window.axe !== 'undefined'))) await P.addScriptTag({ path: RUTA_DE_AXE });
  const r = await P.evaluate((etiquetas) => window.axe.run(document, { runOnly: { type: 'tag', values: etiquetas }, resultTypes: ['violations', 'incomplete'] }), ETIQUETAS);
  const violaciones = r.violations.map((v) => ({
    regla: v.id,
    impacto: v.impact,
    descripcion: v.help,
    criterios: v.tags.filter((t) => /^wcag\d/.test(t)),
    nodos: v.nodes.slice(0, 5).map((n) => ({ selector: n.target.join(' '), resumen: n.failureSummary })),
    cantidad: v.nodes.length,
  }));
  resultados.push({ pantalla, recorrido, url: new URL(P.url()).pathname + new URL(P.url()).search.replace(/id=[^&]+/, 'id=…'), violaciones, pendientesDeRevisionManual: r.incomplete.map((i) => ({ regla: i.id, impacto: i.impact, cantidad: i.nodes.length })) });
  const graves = violaciones.filter((v) => GRAVES.has(v.impacto));
  console.log(`${graves.length ? '✖' : '✔'} ${pantalla}: ${violaciones.length} violaciones (${graves.length} críticas o serias)`);
}

async function recorrer(ancho, alto, superficie) {
  await P.setViewport({ width: ancho, height: alto });
  const s = (x) => `${x} · ${superficie}`;
  // Acceso (RNF-ACC-001: «acceso»).
  await P.goto(`${web}/`, { waitUntil: 'networkidle2', timeout: 180_000 });
  await auditar(s('Landing'), 'PUBLIC (B10-02 §3)');
  await P.goto(`${web}/register`, { waitUntil: 'networkidle2', timeout: 180_000 });
  await auditar(s('Crear cuenta'), 'acceso');
  await P.goto(`${web}/legal/terminos`, { waitUntil: 'networkidle2', timeout: 180_000 });
  await auditar(s('Términos'), 'acceso');
  await P.goto(`${web}/login`, { waitUntil: 'networkidle2', timeout: 180_000 });
  await auditar(s('Iniciar sesión'), 'acceso');
  await P.waitForFunction(() => {
    const e = document.querySelector('#correo');
    return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps'));
  }, { timeout: 180_000 });
  await P.type('#correo', PRO.correo);
  await P.type('#contrasena', PRO.clave);
  await clickTexto('Iniciar sesión');
  await P.waitForFunction(() => document.body.innerText.includes('Ir al espacio profesional'), { timeout: 120_000 });
  await auditar(s('Cuenta'), 'acceso');
  // Vínculo (RNF-ACC-001: «vínculo»).
  await irA('Vínculos', '/account/relationships');
  await auditar(s('Vínculos'), 'vínculo');
  await irA('Privacidad', '/account/privacy');
  await auditar(s('Privacidad y consentimientos'), 'vínculo');
  await irA('Cuenta', '/account');
  await irA('Ir al espacio profesional', '/pro');
  await auditar(s('Espacio profesional'), 'vínculo');
  // Revisión (RNF-ACC-001: «revisión»): el workspace y las pestañas de los tres dominios.
  await irA('Abrir', '/pro/advisees?id=');
  await auditar(s('Workspace del asesorado'), 'revisión');
  const dominios = [
    ['Abrir Nutrición', '/pro/advisees/nutrition', [['Resumen', 'resumen'], ['Plan', 'plan'], ['Registros', 'registros'], ['Revisiones', 'revisiones']]],
    ['Abrir Entrenamiento', '/pro/advisees/training', [['Resumen', 'resumen'], ['Plan', 'plan'], ['Ejecuciones', 'ejecuciones'], ['Revisiones', 'revisiones']]],
    ['Abrir Antropometría', '/pro/advisees/anthropometry', [['Evaluaciones', 'evaluaciones'], ['En preparación', 'preparacion'], ['Evolución', 'evolucion']]],
  ];
  for (const [abrir, ruta, pestanas] of dominios) {
    await irA(abrir, ruta);
    for (const [pestana, vista] of pestanas) {
      await clickTexto(pestana);
      await P.waitForFunction((v) => location.search.includes(`vista=${v}`), { timeout: 120_000 }, vista);
      await auditar(s(`${abrir.replace('Abrir ', '')} · ${pestana}`), 'revisión');
    }
    await irA('Asesorado', '/pro/advisees?id=');
  }
  await irA('Pedir información', '/pro/advisees/forms');
  await auditar(s('Información (formularios)'), 'revisión');
}

try {
  await recorrer(1280, 900, 'escritorio');
  // Otra pestaña, otra sesión: la anterior vive en la memoria de esa pestaña.
  await recorrer(390, 844, 'celular');
} finally {
  await navegador.close();
}

const graves = resultados.flatMap((r) => r.violaciones.filter((v) => GRAVES.has(v.impacto)).map((v) => ({ pantalla: r.pantalla, ...v })));
const informe = {
  fecha: new Date().toISOString(),
  herramienta: `axe-core ${VERSION_DE_AXE}`,
  reglas: ETIQUETAS,
  criterioDeCierre: 'cero violaciones críticas o serias (RNF-ACC-001)',
  pantallas: resultados.length,
  violacionesGraves: graves.length,
  erroresDeConsola,
  resultados,
};
writeFileSync(join(salida, 'auditoria-accesibilidad.json'), JSON.stringify(informe, null, 2));
console.log(`\n${resultados.length} pantallas · ${graves.length} violaciones críticas o serias · informe en ${join(salida, 'auditoria-accesibilidad.json')}`);
process.exit(graves.length > 0 ? 1 : 0);
