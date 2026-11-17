// Verificación REMOTA de la sesión (DL-147) en el despliegue de test, con las direcciones HTTPS reales, en Chrome y Edge
// instalados en esta máquina. Cuentas sintéticas nuevas (@example.invalid) por navegador; las contraseñas se generan
// acá, viven solo en memoria y no se imprimen. No toca datos de la cohorte ni de nadie más.
// Uso: node verificar-sesion.mjs [chrome|edge|todos]
import { randomBytes, randomUUID } from 'node:crypto';
import fs, { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const requerir = createRequire('C:/Users/bufim/BE-Best-entrenamiento/package.json');
const puppeteer = requerir('puppeteer-core');
const dominio = requerir('C:/Users/bufim/BE-Best-entrenamiento/packages/domain/dist/index.js');

const WEB = 'https://be-web-1ngj.onrender.com';
const API = 'https://be-api-hndp.onrender.com';
const SALIDA = join('C:/Users/bufim/AppData/Local/Temp/claude/C--Users-bufim-BE-Best/5a047096-4cd1-4db9-9da5-fb4a43ad72ef/scratchpad/remoto', new Date().toISOString().replace(/[:.]/g, '-'));
mkdirSync(SALIDA, { recursive: true });
const NAVEGADORES = {
  chrome: { nombre: 'Chrome', ruta: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
  edge: { nombre: 'Edge', ruta: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' },
};
const pedidos = process.argv[2] && process.argv[2] !== 'todos' ? [process.argv[2]] : Object.keys(NAVEGADORES);
const COOKIE = '__Secure-be-reanudacion';
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(metodo, ruta, { token, cuerpo, superficie = 'WEB', clave } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': superficie, Origin: WEB };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clave !== false && ['POST', 'PUT', 'DELETE'].includes(metodo)) headers['Idempotency-Key'] = `verif-${randomUUID()}`;
  const r = await fetch(`${API}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  return { status: r.status, json: texto ? JSON.parse(texto) : null };
}

async function cuentaNueva(etiqueta) {
  const correo = `verif-${etiqueta}-${randomUUID().slice(0, 8)}@example.invalid`;
  const clave = `${randomBytes(18).toString('base64url')}Aa1!`;
  const r = await pedir('POST', '/registrations', {
    cuerpo: {
      registrationIntent: 'ADVISEE',
      identity: { localIdentifier: correo, localCredential: clave },
      termsAcceptance: { versionId: dominio.VERSION_VIGENTE.TERMINOS.id },
      privacyAcknowledgement: { versionId: dominio.VERSION_VIGENTE.PRIVACIDAD_INFO.id },
      adultDeclaration: { versionId: dominio.VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
    },
  });
  if (r.status !== 201) throw new Error(`alta ${etiqueta}: ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  return { correo, clave };
}

const ruta = (p) => new URL(p.url()).pathname.replace(/\/$/, '') || '/';
async function esperarRuta(p, camino, timeout = 45_000) {
  await p.waitForFunction((c) => (location.pathname.replace(/\/$/, '') || '/') === c, { timeout, polling: 200 }, camino);
}
async function hidratado(p, selector) {
  await p.waitForFunction((s) => {
    const e = document.querySelector(s);
    return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps'));
  }, { timeout: 60_000, polling: 200 }, selector);
}
async function formularioDeEntrada(p, cuenta) {
  await hidratado(p, '#correo');
  await p.click('#correo', { clickCount: 3 });
  await p.type('#correo', cuenta.correo);
  await p.type('#contrasena', cuenta.clave);
  const boton = await p.waitForFunction(() => [...document.querySelectorAll('form button[type="submit"]')].find((b) => b.textContent.includes('Iniciar sesión')) ?? null, { timeout: 30_000, polling: 200 });
  await boton.asElement().click();
}
/** Espera a salir de la entrada (con sesión) y a que no quede el formulario. */
async function conSesion(p) {
  await p.waitForFunction(() => location.pathname !== '/login' && !document.querySelector('#correo') && !document.body.innerText.includes('Recuperando tu sesión'), { timeout: 60_000, polling: 250 });
  await pausa(1500);
  return ruta(p);
}
const textoDe = (p) => p.evaluate(() => document.body.innerText);
/** Anota los caminos por los que pasa la pestaña: una recarga que rebota por /login se ve acá aunque termine bien. */
function caminos(p) {
  const lista = [];
  p.on('framenavigated', (f) => {
    if (f === p.mainFrame()) lista.push(new URL(f.url()).pathname);
  });
  return lista;
}

const env = Object.fromEntries(
  fs.readFileSync('C:/Users/bufim/BE-datos-locales/cohorte-test/cuentas.env', 'utf8')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);

async function verificar(clave) {
  const { nombre, ruta: ejecutable } = NAVEGADORES[clave];
  const navegador = await puppeteer.launch({ executablePath: ejecutable, headless: true, args: ['--lang=es-AR', '--no-first-run', '--disable-gpu', '--disable-extensions', '--disable-background-networking', '--disable-component-update', '--renderer-process-limit=2', '--js-flags=--max-old-space-size=192'] });
  const version = await navegador.version();
  const resultados = [];
  const anotar = (id, ok, detalle = '') => {
    resultados.push({ id, ok, detalle });
    console.log(`${ok ? '✔' : '✖'} [${nombre}] ${id}${detalle ? ` · ${detalle}` : ''}`);
  };
  const captura = async (p, n) => p.screenshot({ path: join(SALIDA, `${clave}-${n}.png`) }).catch(() => {});
  try {
    // ─── Cuenta A: entrar, recargar, otra pestaña, salir ───────────────────────────────────────────────────────────
    const a = await cuentaNueva(`${clave}-a`);
    const ctx = await navegador.createBrowserContext();
    const p = await ctx.newPage();
    await p.setViewport({ width: 1366, height: 900 });
    const tokens = [];
    const mirar = async (r) => {
      if (r.request().method() !== 'POST' || !/\/api\/v1\/auth\/sessions(\/resume)?$/.test(new URL(r.url()).pathname)) return;
      const j = await r.json().catch(() => null);
      if (j?.data?.session?.accessToken) tokens.push(j.data.session.accessToken);
    };
    p.on('response', mirar);
    const recorrido = caminos(p);
    await p.goto(`${WEB}/login`, { waitUntil: 'networkidle2', timeout: 90_000 });
    await formularioDeEntrada(p, a);
    const destino = await conSesion(p);
    anotar('entrar', true, `aterriza en ${destino}`);
    await captura(p, '1-con-sesion');

    const cookies = await ctx.cookies();
    const c = cookies.find((x) => x.name === COOKIE);
    anotar(
      'cookie de reanudación con sus atributos',
      !!c && c.httpOnly && c.secure && c.sameSite === 'None' && c.path === '/api/v1/auth/sessions' && !!c.partitionKey && c.domain.includes('be-api'),
      c ? `dominio ${c.domain}, HttpOnly ${c.httpOnly}, Secure ${c.secure}, SameSite ${c.sameSite}, Path ${c.path}, partición ${JSON.stringify(c.partitionKey)}` : 'no hay cookie',
    );

    recorrido.length = 0;
    await p.reload({ waitUntil: 'networkidle2', timeout: 90_000 });
    const trasRecargar = await conSesion(p).catch(() => ruta(p));
    anotar('recargar conserva la sesión, sin pasar por la entrada', trasRecargar !== '/login' && !recorrido.includes('/login'), `después de recargar: ${trasRecargar}; caminos: ${recorrido.join(' → ')}`);

    const p2 = await ctx.newPage();
    await p2.setViewport({ width: 1366, height: 900 });
    p2.on('response', mirar);
    await p2.goto(`${WEB}${destino}`, { waitUntil: 'networkidle2', timeout: 90_000 });
    const enLaOtra = await conSesion(p2).catch(() => ruta(p2));
    anotar('otra pestaña entra sola', enLaOtra !== '/login', `segunda pestaña: ${enLaOtra}`);

    const almacen = [];
    for (const pag of [p, p2]) almacen.push(await pag.evaluate(() => JSON.stringify({ l: Object.entries(localStorage), s: Object.entries(sessionStorage) })));
    const filtrado = almacen.some((t) => tokens.some((k) => t.includes(k)) || /eyJ[\w-]{8,}\.[\w-]{8,}\./.test(t));
    anotar('ningún token en localStorage ni sessionStorage', tokens.length >= 2 && !filtrado, `tokens vistos: ${tokens.length}`);

    await p2.bringToFront();
    await p2.click('.menu-de-cuenta__boton');
    const salir = await p2.waitForFunction(() => [...document.querySelectorAll('.menu-de-cuenta__opcion')].find((b) => b.textContent.includes('Cerrar sesión')) ?? null, { timeout: 30_000, polling: 200 });
    await salir.asElement().click();
    await esperarRuta(p2, '/login');
    let otraSalio = true;
    await esperarRuta(p, '/login', 20_000).catch(() => (otraSalio = false));
    anotar('cerrar en una pestaña cierra la otra', otraSalio, `primera pestaña: ${ruta(p)}`);
    const sinCookie = !(await ctx.cookies()).some((x) => x.name === COOKIE);
    anotar('al cerrar, la cookie se borra', sinCookie);
    await p.bringToFront();
    await p.goto(`${WEB}${destino}`, { waitUntil: 'networkidle2', timeout: 90_000 });
    await pausa(3000);
    anotar('después de cerrar, recargar pide entrar', ruta(p) === '/login', `queda en ${ruta(p)}`);
    await ctx.close();

    // ─── Cuenta B: la falla de conexión y la revocación ──────────────────────────────────────────────────────────────
    const b = await cuentaNueva(`${clave}-b`);
    const ctxB = await navegador.createBrowserContext();
    const q = await ctxB.newPage();
    await q.setViewport({ width: 1366, height: 900 });
    let cortar = null; // 'entrar' | 'reanudar' | null
    await q.setRequestInterception(true);
    q.on('request', (req) => {
      if (req.isInterceptResolutionHandled()) return;
      const u = new URL(req.url());
      const esEntrar = req.method() === 'POST' && u.origin === API && u.pathname === '/api/v1/auth/sessions';
      const esReanudar = req.method() === 'POST' && u.origin === API && u.pathname === '/api/v1/auth/sessions/resume';
      if ((cortar === 'entrar' && esEntrar) || (cortar === 'reanudar' && esReanudar)) return req.abort('internetdisconnected');
      return req.continue();
    });
    await q.goto(`${WEB}/login`, { waitUntil: 'networkidle2', timeout: 90_000 });
    cortar = 'entrar';
    await formularioDeEntrada(q, b);
    await q.waitForFunction(() => !!document.querySelector('.aviso--error, [role="alert"]') && document.body.innerText.includes('No pudimos'), { timeout: 30_000, polling: 200 }).catch(() => {});
    const alEntrarSinRed = await textoDe(q);
    anotar(
      'entrar sin conexión dice «conexión», no «datos incorrectos»',
      alEntrarSinRed.includes('No pudimos conectarnos con BE') && !alEntrarSinRed.includes('No pudimos verificar los datos de acceso'),
      (alEntrarSinRed.match(/No pudimos[^\n]*/) ?? ['(sin mensaje)'])[0],
    );
    await captura(q, '2-entrar-sin-conexion');
    cortar = null;
    await q.goto(`${WEB}/login`, { waitUntil: 'networkidle2', timeout: 90_000 });
    await formularioDeEntrada(q, b);
    const destinoB = await conSesion(q);

    cortar = 'reanudar';
    await q.reload({ waitUntil: 'networkidle2', timeout: 90_000 });
    await q.waitForFunction(() => location.pathname === '/login' && !document.body.innerText.includes('Recuperando tu sesión'), { timeout: 45_000, polling: 250 }).catch(() => {});
    await pausa(1000);
    const alRecargarSinRed = await textoDe(q);
    const aviso = new URL(q.url()).searchParams.get('aviso');
    anotar(
      'recargar sin conexión lo dice (no «venció», no silencio)',
      aviso === 'sin-conexion' && alRecargarSinRed.includes('No pudimos conectarnos con BE para recuperar tu sesión'),
      `aviso=${aviso}`,
    );
    await captura(q, '3-recargar-sin-conexion');
    cortar = null;
    await q.goto(`${WEB}${destinoB}`, { waitUntil: 'networkidle2', timeout: 90_000 });
    const vuelve = await conSesion(q).catch(() => ruta(q));
    anotar('al volver la conexión, la sesión sigue', vuelve !== '/login', `queda en ${vuelve}`);

    // Revocación: «Cerrar todas las sesiones» desde otro lado (otra sesión de la misma cuenta, por la API).
    const otra = await pedir('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: b.correo, credential: b.clave }, clave: false });
    const tokenOtra = otra.json?.data?.session?.accessToken;
    const cierre = await pedir('DELETE', '/auth/sessions', { token: tokenOtra, clave: false });
    anotar('revocar todas desde otro lado (API)', cierre.status === 204, `estado ${cierre.status}`);
    await q.reload({ waitUntil: 'networkidle2', timeout: 90_000 });
    await q.waitForFunction(() => location.pathname === '/login' && !document.body.innerText.includes('Recuperando tu sesión'), { timeout: 45_000, polling: 250 }).catch(() => {});
    await pausa(1000);
    const avisoRev = new URL(q.url()).searchParams.get('aviso');
    anotar('una sesión revocada no se recupera al recargar', ruta(q) === '/login' && avisoRev !== 'sin-conexion', `queda en ${ruta(q)} (aviso=${avisoRev})`);
    await captura(q, '4-revocada');
    await ctxB.close();

    // ─── El espacio profesional (solo en Chrome, para no sumar inicios a la cuenta de la cohorte) ─────────────────────
    if (clave === 'chrome' && env.PRO_N_CORREO && env.PRO_N_CLAVE) {
      const ctxP = await navegador.createBrowserContext();
      const r = await ctxP.newPage();
      await r.setViewport({ width: 1440, height: 900 });
      const pasos = caminos(r);
      await r.goto(`${WEB}/login`, { waitUntil: 'networkidle2', timeout: 90_000 });
      await formularioDeEntrada(r, { correo: env.PRO_N_CORREO, clave: env.PRO_N_CLAVE });
      await esperarRuta(r, '/pro', 60_000);
      await r.waitForSelector('a.persona__abrir', { timeout: 60_000 });
      pasos.length = 0;
      await r.reload({ waitUntil: 'networkidle2', timeout: 90_000 });
      await r.waitForSelector('a.persona__abrir', { timeout: 60_000 }).catch(() => {});
      anotar('profesional: recargar /pro conserva la sesión, sin pasar por la entrada', ruta(r) === '/pro' && !pasos.includes('/login'), `caminos: ${pasos.join(' → ')}`);
      const ficha = await r.$eval('a.persona__abrir', (a) => a.getAttribute('href'));
      await r.goto(`${WEB}${ficha}&vista=linea&p=30`, { waitUntil: 'networkidle2', timeout: 90_000 });
      await r.waitForSelector('#titulo-asesorado', { timeout: 60_000 });
      pasos.length = 0;
      await r.reload({ waitUntil: 'networkidle2', timeout: 90_000 });
      await r.waitForSelector('#titulo-asesorado', { timeout: 60_000 }).catch(() => {});
      const u = new URL(r.url());
      anotar('profesional: recargar la ficha conserva persona, vista y período', u.pathname === '/pro/advisees' && u.searchParams.get('vista') === 'linea' && u.searchParams.get('p') === '30' && !pasos.includes('/login'), `${u.pathname}?vista=${u.searchParams.get('vista')}&p=${u.searchParams.get('p')}; caminos: ${pasos.join(' → ')}`);
      await captura(r, '5-ficha-tras-recargar');
      await ctxP.close();
    }
  } catch (e) {
    anotar('error inesperado', false, e.message.slice(0, 300));
  } finally {
    await navegador.close();
  }
  return { navegador: nombre, version, resultados };
}

const salud = await fetch(`${API}/health/ready`).then((r) => r.json()).catch(() => null);
const informe = { fecha: new Date().toISOString(), web: WEB, api: API, apiDesplegada: salud?.data?.version ?? null, corridas: [] };
for (const n of pedidos) informe.corridas.push(await verificar(n));
writeFileSync(join(SALIDA, 'informe.json'), JSON.stringify(informe, null, 2));
const fallas = informe.corridas.flatMap((c) => c.resultados.filter((r) => !r.ok).map((r) => `${c.navegador}: ${r.id}`));
console.log(`\nAPI ${JSON.stringify(informe.apiDesplegada)} · ${informe.corridas.map((c) => c.version).join(' · ')}`);
console.log(fallas.length ? `Fallas: ${fallas.join('; ')}` : 'Todo bien.');
console.log(`Informe y capturas: ${SALIDA}`);
