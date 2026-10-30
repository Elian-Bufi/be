// Comprobación en pantalla de los escenarios de la prueba breve (2026-10-26), en test, con la cuenta «Lic. Prueba Dos
// Áreas». Solo lectura: entra UNA vez por el website y bloquea en el navegador toda escritura que no sea abrir o cerrar
// la sesión. Mira:
// - la cartera, con las personas «Prueba»;
// - «Analizar» de Prueba Dos (con indicado del día) y de Prueba Tres (con alternativas): las capas de la leyenda, los
//   rombos o la explicación de por qué no hay, la lectura del día elegido y «Ver origen», con los números esperados;
// - la ficha de Prueba Cuatro (autorización revocada) y de Prueba Cinco (vínculo finalizado), sin acceso.
// - el hueco de Prueba Dos: el gris del gráfico y la lectura de ese día.
// Lee lo esperado de esperado-en-pantalla.json, que escribe la fase «verificar» de escenarios.mjs (calculado aparte).
// Nunca imprime el correo, la clave ni el token.
// Uso: [BE_PUPPETEER=<package.json de un árbol con puppeteer-core>] [BE_CHROME=<chrome.exe>] node ver-en-pantalla.mjs <salida>
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(process.env.BE_PUPPETEER ?? 'C:/Users/bufim/BE-seguridad-2026-10-23/package.json');
const puppeteer = require('puppeteer-core');
const API = 'https://be-api-hndp.onrender.com';
const WEB = 'https://be-web-1ngj.onrender.com';
const salida = process.argv[2];
if (!salida) throw new Error('uso: node ver-en-pantalla.mjs <salida>');
mkdirSync(salida, { recursive: true });

const CARPETA = 'C:/Users/bufim/BE-datos-locales/prueba-test';
const cuentas = Object.fromEntries(
  readFileSync(join(CARPETA, 'cuentas.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const estado = JSON.parse(readFileSync(join(CARPETA, 'estado.json'), 'utf8'));
const esperado = JSON.parse(readFileSync(join(CARPETA, 'esperado-en-pantalla.json'), 'utf8'));
const ID = (p) => cuentas[`${p}_ID`];

const C = { registrado: 'Registrado', objetivo: 'Objetivo del profesional', indicado: 'Indicado en el plan' };
const PROHIBIDOS = /cumplimiento|adherencia|\d\s?%/i;
const fallas = [];
const controles = [];
function control(nombre, ok, detalle = '') {
  controles.push({ nombre, ok, detalle });
  if (!ok) fallas.push(nombre);
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${nombre}${detalle ? ` · ${detalle}` : ''}`);
}
const plantilla = (camino) => camino.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');

const navegador = await puppeteer.launch({ executablePath: process.env.BE_CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--lang=es-AR', '--no-first-run', '--no-default-browser-check'] });
let token = null;
const respuestas = [];
const bloqueados = [];
const erroresDePagina = [];
const erroresDeConsola = [];
let paso = 'abrir el navegador';
let p = null;
const texto = (sel) => p.evaluate((s) => (document.querySelector(s)?.innerText ?? '').replace(/\s+/g, ' '), sel);
try {
  const contexto = await navegador.createBrowserContext();
  p = await contexto.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  p.on('pageerror', (e) => erroresDePagina.push(e.message));
  p.on('console', (m) => {
    if (m.type() !== 'error') return;
    const url = m.location()?.url ?? '';
    if (/\/api\/v1\/auth\/sessions\/resume$/.test(url) && m.text().includes('401')) return;
    // Las fichas sin acceso (Cuatro y Cinco) responden 404: es lo esperado y se comprueba aparte.
    if (m.text().includes('404')) return;
    erroresDeConsola.push(`${m.text().slice(0, 200)} ${plantilla(url.replace(API, ''))}`);
  });
  await p.setRequestInterception(true);
  const PERMITIDAS = [
    ['POST', /^\/api\/v1\/auth\/sessions(\/resume)?$/],
    ['DELETE', /^\/api\/v1\/auth\/sessions\/current$/],
    ['POST', /^\/api\/v1\/advisees\/[^/]+\/timeline\/search$/],
  ];
  p.on('request', (req) => {
    if (req.isInterceptResolutionHandled()) return;
    const u = new URL(req.url());
    if (u.origin === API && !['GET', 'HEAD', 'OPTIONS'].includes(req.method()) && !PERMITIDAS.some(([m, r]) => m === req.method() && r.test(u.pathname))) {
      bloqueados.push(`${req.method()} ${plantilla(u.pathname)}`);
      return req.abort('blockedbyclient');
    }
    return req.continue();
  });
  p.on('response', async (r) => {
    const u = new URL(r.url());
    if (u.origin !== API || r.request().method() === 'OPTIONS') return;
    respuestas.push({ metodo: r.request().method(), camino: plantilla(u.pathname), status: r.status() });
    if (r.request().method() === 'POST' && u.pathname === '/api/v1/auth/sessions' && r.status() === 201) {
      try {
        token = (await r.json()).data.session.accessToken;
      } catch {}
    }
  });

  paso = 'entrar';
  await p.goto(`${WEB}/login`, { waitUntil: 'networkidle2', timeout: 60_000 });
  await p.waitForFunction(() => {
    const e = document.querySelector('#correo');
    return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps'));
  }, { timeout: 60_000, polling: 100 });
  await p.type('#correo', cuentas.PRO_CORREO);
  await p.type('#contrasena', cuentas.PRO_CLAVE);
  const boton = await p.waitForFunction(() => [...document.querySelectorAll('form button[type="submit"]')].find((b) => b.textContent.includes('Iniciar sesión')) ?? null, { timeout: 30_000 });
  await boton.asElement().click();
  await p.waitForFunction(() => (location.pathname.replace(/\/$/, '') || '/') === '/pro', { timeout: 30_000, polling: 100 });
  control('entra al website profesional como «Lic. Prueba Dos Áreas»', true);

  paso = 'la cartera';
  await p.waitForFunction(() => document.querySelectorAll('a.persona__abrir').length > 0, { timeout: 30_000, polling: 100 });
  await p.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => {});
  const cartera = await texto('main');
  const enLaCartera = ['Prueba Uno', 'Prueba Dos', 'Prueba Tres', 'Prueba Cuatro', 'Prueba Cinco'].filter((n) => cartera.includes(n));
  control('la cartera muestra a Uno, Dos, Tres y Cuatro por su nombre (Cinco finalizó: sin su nombre)', ['Prueba Uno', 'Prueba Dos', 'Prueba Tres', 'Prueba Cuatro'].every((n) => enLaCartera.includes(n)) && !enLaCartera.includes('Prueba Cinco'), enLaCartera.join(', '));
  await p.screenshot({ path: join(salida, 'cartera.png') });

  for (const caso of esperado.casos) {
    paso = `Analizar de ${caso.persona}`;
    const r0 = respuestas.length;
    await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(ID(caso.prefijo))}&vista=analizar&m=nutricion.energia&desde=${esperado.desde}&hasta=${esperado.hasta}&f=${caso.dia}`, { waitUntil: 'networkidle2', timeout: 60_000 });
    await p.waitForFunction(() => document.querySelector('.paneles-sincronizados figure.grafico figcaption') && (document.querySelector('.panel-de-lectura')?.innerText ?? '').length > 0, { timeout: 30_000, polling: 100 });
    await p
      .waitForFunction((n) => (n > 0 ? document.querySelectorAll('.paneles-sincronizados figure.grafico .grafico__indicado path').length === n : !!document.querySelector('.grafico__nota-del-indicado')), { timeout: 30_000, polling: 100 }, caso.rombos)
      .catch(() => {});
    await p.waitForFunction((t) => (document.querySelector('.panel-de-lectura')?.innerText ?? '').includes(t), { timeout: 30_000, polling: 100 }, caso.enLaLectura).catch(() => {});
    await p.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => {});
    const vista = await p.evaluate(() => ({
      leyenda: (document.querySelector('.paneles-sincronizados figure.grafico figcaption')?.innerText ?? '').replace(/\s+/g, ' '),
      rombos: document.querySelectorAll('.paneles-sincronizados figure.grafico .grafico__indicado path').length,
      nota: (document.querySelector('.grafico__nota-del-indicado')?.innerText ?? '').replace(/\s+/g, ' '),
      lectura: (document.querySelector('.panel-de-lectura')?.innerText ?? '').replace(/\s+/g, ' '),
    }));
    const capas = caso.rombos > 0 ? [C.registrado, C.objetivo, C.indicado] : [C.registrado, C.objetivo];
    control(`${caso.persona}: la leyenda nombra ${capas.join(', ')}`, capas.every((c) => vista.leyenda.includes(c)) && (caso.rombos > 0 || !vista.leyenda.includes(C.indicado)), vista.leyenda.slice(0, 220));
    if (caso.rombos > 0) control(`${caso.persona}: un rombo por día con indicado (${caso.rombos})`, vista.rombos === caso.rombos, `${vista.rombos} rombos`);
    else control(`${caso.persona}: sin rombos, y debajo del gráfico se dice por qué`, vista.rombos === 0 && vista.nota.includes(caso.nota), vista.nota.slice(0, 260));
    control(`${caso.persona}: la lectura del ${caso.dia} dice ${caso.enLaLectura.slice(0, 60)}…`, vista.lectura.includes(caso.enLaLectura), vista.lectura.slice(0, 320));
    for (const t of caso.enLaLecturaTambien ?? []) control(`${caso.persona}: la lectura del ${caso.dia} incluye «${t}»`, vista.lectura.includes(t), '');
    await p.screenshot({ path: join(salida, `analizar-${caso.prefijo.toLowerCase()}.png`) });
    if (caso.hueco) {
      // El hueco: el gráfico sombrea los días sin registros (no los dibuja como cero) y la lectura de ese día lo dice.
      const sombras = await p.evaluate(() => document.querySelectorAll('.paneles-sincronizados figure.grafico .grafico__sin-registros').length);
      control(`${caso.persona}: el gráfico sombrea los días sin registros`, sombras >= 1, `${sombras} zonas en gris`);
      paso = `el hueco de ${caso.persona}`;
      await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(ID(caso.prefijo))}&vista=analizar&m=nutricion.energia&desde=${esperado.desde}&hasta=${esperado.hasta}&f=${caso.hueco.dia}`, { waitUntil: 'networkidle2', timeout: 60_000 });
      await p.waitForFunction((t) => (document.querySelector('.panel-de-lectura')?.innerText ?? '').includes(t), { timeout: 30_000, polling: 100 }, caso.hueco.texto).catch(() => {});
      const lecturaDelHueco = await texto('.panel-de-lectura');
      control(`${caso.persona}: la lectura del ${caso.hueco.dia} dice «${caso.hueco.texto}»`, lecturaDelHueco.includes(caso.hueco.texto), lecturaDelHueco.slice(0, 200));
      await p.screenshot({ path: join(salida, `hueco-${caso.prefijo.toLowerCase()}.png`) });
      await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(ID(caso.prefijo))}&vista=analizar&m=nutricion.energia&desde=${esperado.desde}&hasta=${esperado.hasta}&f=${caso.dia}`, { waitUntil: 'networkidle2', timeout: 60_000 });
      await p.waitForFunction((t) => (document.querySelector('.panel-de-lectura')?.innerText ?? '').includes(t), { timeout: 30_000, polling: 100 }, caso.enLaLectura).catch(() => {});
    }

    paso = `Ver origen de ${caso.persona}`;
    const ver = await p.evaluateHandle(() => [...document.querySelectorAll('.panel-de-lectura button.boton--enlace')].find((b) => b.textContent.trim().startsWith('Ver origen')) ?? null);
    if (!ver.asElement()) control(`${caso.persona}: «Ver origen» está en la lectura`, false);
    else {
      await ver.asElement().click();
      await p.waitForFunction((n) => document.querySelectorAll('.fuentes-del-dato__lista .fuente:not(.fuente--sin-leer)').length === n, { timeout: 30_000, polling: 100 }, caso.comidas).catch(() => {});
      await p.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => {});
      const origen = await p.evaluate(() => ({
        leidas: document.querySelectorAll('.fuentes-del-dato__lista .fuente:not(.fuente--sin-leer)').length,
        texto: (document.querySelector('.fuentes-del-dato')?.innerText ?? '').replace(/\s+/g, ' '),
      }));
      control(`${caso.persona}: «Ver origen» trae las ${caso.comidas} comidas del ${caso.dia}`, origen.leidas === caso.comidas, `${origen.leidas} leídas`);
      for (const t of caso.enElOrigen) control(`${caso.persona}: «Ver origen» dice «${t}»`, origen.texto.includes(t), '');
      const zona = await p.evaluate(() => [...document.querySelectorAll('.paneles-sincronizados, .panel-de-lectura, .fuentes-del-dato')].map((e) => e.innerText).join(' '));
      control(`${caso.persona}: sin «cumplimiento», «adherencia» ni porcentajes (B05)`, !PROHIBIDOS.test(zona), (zona.match(PROHIBIDOS) ?? [''])[0]);
      writeFileSync(join(salida, `origen-${caso.prefijo.toLowerCase()}.txt`), origen.texto);
      // La captura, con la ventana alta y las comidas ya leídas: una captura de página completa cambia el tamaño de la
      // ventana, y el panel vuelve a cargar los registros («Cargando el registro…») justo cuando se toma.
      await p.setViewport({ width: 1440, height: 1300 });
      await p.waitForFunction((n) => document.querySelectorAll('.fuentes-del-dato__lista .fuente:not(.fuente--sin-leer)').length === n, { timeout: 30_000, polling: 100 }, caso.comidas).catch(() => {});
      await p.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => {});
      const leidasAlCapturar = await p.evaluate(() => document.querySelectorAll('.fuentes-del-dato__lista .fuente:not(.fuente--sin-leer)').length);
      control(`${caso.persona}: la captura de «Ver origen» muestra las ${caso.comidas} comidas leídas`, leidasAlCapturar === caso.comidas, `${leidasAlCapturar} leídas`);
      await p.screenshot({ path: join(salida, `origen-${caso.prefijo.toLowerCase()}.png`) });
      await p.setViewport({ width: 1440, height: 900 });
    }
    const conError = respuestas.slice(r0).filter((r) => r.status >= 400);
    control(`${caso.persona}: la API respondió sin errores`, conError.length === 0, conError.map((r) => `${r.metodo} ${r.camino} ${r.status}`).join(' | '));
  }

  for (const [prefijo, nombre] of [['ASE_CUATRO', 'Prueba Cuatro'], ['ASE_CINCO', 'Prueba Cinco']]) {
    paso = `la ficha de ${nombre}`;
    await p.goto(`${WEB}/pro/advisees?id=${encodeURIComponent(ID(prefijo))}`, { waitUntil: 'networkidle2', timeout: 60_000 });
    await p.waitForNetworkIdle({ idleTime: 1000, timeout: 30_000 }).catch(() => {});
    const t = await texto('main');
    const sinDatos = !t.includes('Analizar') || t.includes('Por ahora no tenés acceso') || t.includes('No encontramos');
    control(`${nombre}: la ficha no muestra su información`, sinDatos, t.slice(0, 240));
    await p.screenshot({ path: join(salida, `ficha-${prefijo.toLowerCase()}.png`) });
  }
  await contexto.close();
} catch (e) {
  control('recorrido del website', false, `en el paso «${paso}»: ${e.message.slice(0, 300)}`);
  if (p) {
    try {
      await p.screenshot({ path: join(salida, 'falla.png') });
      console.log(`  al fallar: ${plantilla(p.url())} · ${(await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 300)}`);
    } catch {}
  }
} finally {
  await navegador.close();
}

const esperadas = (r) => (r.metodo === 'POST' && r.camino === '/api/v1/auth/sessions/resume' && r.status === 401) || r.status === 404;
const noExitosas = respuestas.filter((r) => r.status >= 400 && !esperadas(r));
control('ninguna respuesta de la API con error (fuera de los 404 de lo que no se puede leer)', noExitosas.length === 0, noExitosas.length ? JSON.stringify(noExitosas).slice(0, 300) : '');
control('ninguna escritura bloqueada (mirar no escribe)', bloqueados.length === 0, bloqueados.join(' | '));
control('sin errores de JavaScript', erroresDePagina.length === 0, erroresDePagina.join(' | ').slice(0, 300));
control('sin errores de consola (CSP incluida)', erroresDeConsola.length === 0, erroresDeConsola.join(' | ').slice(0, 300));
if (token) {
  const cierre = await fetch(`${API}/api/v1/auth/sessions/current`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'X-BE-Surface': 'WEB' } });
  control('cierre de la sesión: 204', cierre.status === 204, `status=${cierre.status}`);
}
writeFileSync(join(salida, 'informe.json'), JSON.stringify({ fin: new Date().toISOString(), controles, respuestas: respuestas.length, bloqueados }, null, 2));
console.log(fallas.length ? `\nFALLAS: ${fallas.join(' · ')}` : '\nTodo en orden.');
process.exit(fallas.length ? 1 : 0);
void estado;
