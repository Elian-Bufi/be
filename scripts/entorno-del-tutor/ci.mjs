// WP-ENTORNO-DEL-TUTOR (DL-184) · la prueba de punta a punta en la CI, contra un PostgreSQL efímero (el servicio del
// trabajo `entorno-del-tutor`). Nunca contra una base real: la guardia exige una base be_test_* de localhost.
//
//  1. Las migraciones y la API compilada, con la configuración de una prueba.
//  2. `armar` registra las tres profesionales y se detiene (salida 3): sin verificar, no pueden planificar. La API se
//     reinicia con BE_DEMO_PROFESIONALES (DL-036), como en test lo hace la configuración de Render.
//  3. `armar` con el origen de hace 7 días y la historia hasta ese día; los conteos.
//  4. `al-dia`: agrega los 7 días que faltan, sin duplicar: los conteos crecen y lo anterior queda igual.
//  5. `armar` otra vez: los conteos no cambian (REQ-TUT-62).
//  6. `comprobar`: la base contra la historia y lo que lee la profesional por la API.
//  7. Las capturas de las pantallas clave de cada persona, en Claro, a 1920 × 1080, con la cuenta de la profesional.
//
// Uso: BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_tutor node scripts/entorno-del-tutor/ci.mjs <salida>
// Requiere compilados el dominio, la API y el website contra la API local (BE_API_BASE_URL=http://localhost:3001).
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { REPO } from './catalogo.mjs';
import { generar, hoyEnBuenosAires, constantes } from './historia.mjs';
import { PERSONAS, PROFESIONAL } from './personas.mjs';

const require = createRequire(import.meta.url);
const salida = path.resolve(process.argv[2] ?? 'entorno-del-tutor');
fs.mkdirSync(salida, { recursive: true });
const BASE = process.env.BE_E2E_DATABASE_URL ?? '';
{
  const u = new URL(BASE || 'postgresql://x@nada/nada');
  if (!['localhost', '127.0.0.1'].includes(u.hostname) || !/^\/be_test_[a-z0-9_]+$/.test(u.pathname)) throw new Error('Guardia: BE_E2E_DATABASE_URL tiene que ser una base be_test_* de localhost.');
}
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CLAVE = randomBytes(24).toString('base64url');
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const registro = [];

async function arrancarApi(demo = '') {
  const env = {
    ...process.env,
    APP_ENV: 'development',
    PORT: '3001',
    DATABASE_URL: BASE,
    JWT_SECRET: randomBytes(36).toString('base64url'),
    BCRYPT_COST: '10',
    TRUST_PROXY_HOPS: '0',
    CORS_ALLOWED_ORIGINS: WEB,
    BE_DEMO_PROFESIONALES: demo,
    BE_CLAVE_DEL_SEGUNDO_FACTOR: randomBytes(32).toString('base64url'),
    RATE_LIMIT_REGISTRO_MAX: '100',
    RATE_LIMIT_LOGIN_MAX: '5000',
    RATE_LIMIT_LOGIN_IP_MAX: '5000',
    RATE_LIMIT_LOGIN_ID_MAX: '500',
    RATE_LIMIT_CONSULTA_PROTEGIDA_MAX: '5000',
  };
  const p = spawn(process.execPath, [path.join(REPO, 'apps/api/dist/main.js')], { cwd: REPO, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const anotar = (b) => {
    registro.push(b.toString());
    if (registro.length > 800) registro.splice(0, registro.length - 800);
  };
  p.stdout.on('data', anotar);
  p.stderr.on('data', anotar);
  for (let i = 0; i < 90; i++) {
    if (await fetch(`${API}/health/ready`).then((r) => r.ok).catch(() => false)) return p;
    await pausa(1000);
  }
  process.stderr.write(registro.join('').slice(-4000));
  throw new Error('La API no respondió /health/ready.');
}
async function parar(p) {
  if (!p || p.exitCode !== null) return;
  p.kill('SIGTERM');
  for (let i = 0; i < 20 && p.exitCode === null; i++) await pausa(250);
  if (p.exitCode === null) p.kill('SIGKILL');
}

const ENTORNO = { ...process.env, BE_TUTOR_DESTINO: 'local', BE_TUTOR_API: API, BE_TUTOR_BASE: BASE, BE_TUTOR_CLAVE: CLAVE, TZ: 'America/Argentina/Buenos_Aires' };
function cargar(...args) {
  console.log(`\n$ cargar.mjs ${args.join(' ')}`);
  const r = spawnSync(process.execPath, [path.join(REPO, 'scripts/entorno-del-tutor/cargar.mjs'), ...args], { cwd: REPO, env: ENTORNO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  fs.appendFileSync(path.join(salida, 'carga.log'), `\n$ cargar.mjs ${args.join(' ')}\n${r.stdout}${r.stderr}`);
  return r;
}
const conteos = (r) => r.stdout.split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
const total = (lista) => lista.reduce((s, x) => s + (x.comidas ?? 0) + (x.sesiones ?? 0) + (x.tomas ?? 0) + (x.notas ?? 0) + (x.tiempos ?? 0), 0);

// ─── 1 a 6: la carga ──────────────────────────────────────────────────────────────────────────────────────────

const hoy = hoyEnBuenosAires();
const origen = constantes.masDias(hoy, -7);
console.log('migraciones…');
execFileSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: REPO, env: { ...process.env, DATABASE_URL: BASE }, stdio: 'inherit', shell: process.platform === 'win32' });
let api = await arrancarApi();
let web = null;
const resultado = { origen, hoy, pasos: [] };
const paso = (nombre, ok, detalle = '') => {
  resultado.pasos.push({ nombre, ok, detalle });
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ` · ${detalle}` : ''}`);
};
try {
  const r1 = cargar('armar', '--origen', origen, '--hasta', origen);
  const demo = /BE_DEMO_PROFESIONALES=(.*)/.exec(r1.stdout)?.[1]?.trim();
  paso('las profesionales se registran y la carga se detiene hasta verificarlas', r1.status === 3 && !!demo, `salida ${r1.status}`);
  if (!demo) throw new Error('sin BE_DEMO_PROFESIONALES');
  await parar(api);
  api = await arrancarApi(demo);
  const r2 = cargar('armar', '--origen', origen, '--hasta', origen);
  paso('armar con el origen de hace 7 días', r2.status === 0, `salida ${r2.status}`);
  if (r2.status !== 0) throw new Error('armar falló');
  const a = conteos(cargar('resumen'));
  const r3 = cargar('al-dia');
  const b = conteos(cargar('resumen'));
  paso('al-dia agrega los días que faltan', r3.status === 0 && total(b) > total(a), `${total(a)} → ${total(b)} filas`);
  const r4 = cargar('armar');
  const c = conteos(cargar('resumen'));
  paso('armar otra vez no duplica nada', r4.status === 0 && total(c) === total(b), `${total(b)} → ${total(c)} filas`);
  const r5 = cargar('al-dia');
  const d = conteos(cargar('resumen'));
  paso('al-dia otra vez no duplica nada', r5.status === 0 && total(d) === total(c), `${total(c)} → ${total(d)} filas`);
  const r6 = cargar('comprobar');
  paso('comprobar: la base contra la historia y la API de la profesional', r6.status === 0, `salida ${r6.status}`);
  fs.writeFileSync(path.join(salida, 'conteos.json'), `${JSON.stringify({ antesDeAlDia: a, despues: d }, null, 2)}\n`);

  // ─── 8: los permisos (REQ-TUT-76) y el tutor travieso (REQ-TUT-77) ─────────────────────────────────────────
  await permisosYTutorTravieso(d);

  // ─── 7: las capturas ────────────────────────────────────────────────────────────────────────────────────────
  web = spawn(process.execPath, [path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/servir-web.mjs'), path.join(REPO, 'apps/web/out'), '3000', API], { stdio: 'inherit' });
  await pausa(1500);
  await capturas(d);
} finally {
  fs.writeFileSync(path.join(salida, 'api.log'), registro.join(''));
  fs.writeFileSync(path.join(salida, 'resultado.json'), `${JSON.stringify(resultado, null, 2)}\n`);
  web?.kill();
  await parar(api);
}
if (resultado.pasos.some((p) => !p.ok)) process.exitCode = 1;

// Lo que se pide a la API como un cliente: con la cuenta de quien sea, devuelve el estado y el cuerpo.
async function llamar(metodo, ruta, { token = null, cuerpo, superficie = 'WEB' } = {}) {
  const headers = { 'Content-Type': 'application/json', 'X-BE-Surface': superficie, 'Idempotency-Key': `ci-${randomBytes(12).toString('hex')}` };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${API}/api/v1${ruta}`, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await r.text();
  return { status: r.status, cuerpo: texto ? JSON.parse(texto) : null };
}
async function entrarComo(correo, clave, superficie = 'WEB') {
  const r = await llamar('POST', '/auth/sessions', { cuerpo: { method: 'LOCAL', identifier: correo, credential: clave }, superficie });
  return r.cuerpo.data.session.accessToken;
}
async function claveDeLaMuestra(clavePersona) {
  const { createHmac } = await import('node:crypto');
  const c = `tutor-g1.${clavePersona}@example.invalid`;
  return [c, `Be-${createHmac('sha256', CLAVE).update(c).digest('base64url').slice(0, 26)}`];
}
async function registrar(correo, clave, intencion, nombre) {
  const { createRequire } = await import('node:module');
  const dominio = createRequire(path.join(REPO, 'packages/domain/'))(path.join(REPO, 'packages/domain/dist/index.js'));
  const superficie = intencion === 'PROFESSIONAL' ? 'WEB' : 'APK';
  await llamar('POST', '/registrations', {
    superficie,
    cuerpo: {
      registrationIntent: intencion,
      identity: { localIdentifier: correo, localCredential: clave },
      profile: { displayName: nombre },
      termsAcceptance: { versionId: dominio.VERSION_VIGENTE.TERMINOS.id },
      privacyAcknowledgement: { versionId: dominio.VERSION_VIGENTE.PRIVACIDAD_INFO.id },
      adultDeclaration: { versionId: dominio.VERSION_VIGENTE.MAYORIA_DE_EDAD.id, declared: true },
    },
  });
  const token = await entrarComo(correo, clave, superficie);
  const yo = await llamar('GET', '/me', { token, superficie });
  return { token, id: yo.cuerpo.data.identityId };
}

/**
 * REQ-TUT-76: la cuenta de la profesional recibe «no existe» (o «sin permiso») al pedir lo de una persona que no es de la
 * muestra, y no entra a Administración. REQ-TUT-77: el tutor crea un borrador, escribe y archiva una nota, retira un
 * alimento propio e invita; después `al-dia` corre igual, sin tocar lo del tutor ni la cuenta ajena.
 */
async function permisosYTutorTravieso(conteosAntes) {
  const ajena = await registrar(`ajena.${randomBytes(4).toString('hex')}@example.invalid`, `Be-${randomBytes(16).toString('base64url')}`, 'ADVISEE', 'Cuenta ajena a la muestra');
  const [correo, clave] = await claveDeLaMuestra('julieta');
  const token = await entrarComo(correo, clave);
  const pedidos = [
    ['GET', `/advisees/${ajena.id}/dashboard`],
    ['GET', `/advisees/${ajena.id}/training/evaluations`],
    ['GET', `/advisees/${ajena.id}/professional-notes`],
    ['POST', `/advisees/${ajena.id}/professional-notes`, { text: 'Esta nota no puede existir.' }],
    ['GET', `/advisees/${ajena.id}/nutrition/plans`],
  ];
  const rechazos = [];
  for (const [m, ruta, cuerpo] of pedidos) {
    const r = await llamar(m, ruta, { token, cuerpo });
    rechazos.push(`${m} ${ruta.replace(ajena.id, '<ajena>')} → ${r.status}`);
    if (![403, 404].includes(r.status)) paso(`permisos: ${m} sobre una cuenta ajena se rechaza`, false, `${r.status}`);
  }
  const admin = await llamar('POST', '/admin/professionals/query', { token, cuerpo: {} });
  rechazos.push(`POST /admin/professionals/query → ${admin.status}`);
  paso('permisos: lo de una cuenta ajena es «no existe» y Administración no entra', rechazos.every((x) => /→ 40[134]$/.test(x)), rechazos.join(' · '));

  // El tutor travieso, con la cuenta de la profesional.
  const [ct, kt] = await claveDeLaMuestra('tomas');
  const tomas = await entrarComo(ct, kt, 'APK');
  const tomasId = (await llamar('GET', '/me', { token: tomas, superficie: 'APK' })).cuerpo.data.identityId;
  const hechos = [];
  const planes = await llamar('GET', `/advisees/${tomasId}/training/plans`, { token });
  // El borrador sale de la versión vigente: se prueba con cada activada hasta que la API la acepta como base.
  let borrador = null;
  for (const v of (planes.cuerpo?.data ?? []).filter((x) => x.state === 'ACTIVATED')) {
    borrador = await llamar('POST', `/advisees/${tomasId}/training/plans`, { token, cuerpo: { objectiveVersionId: v.objectiveVersionId, basedOnPlanId: v.planId } });
    if (borrador.status < 300) break;
  }
  borrador ??= { status: 0, cuerpo: null };
  hechos.push(`borrador del plan de Tomás → ${borrador.status}${borrador.status >= 300 ? ` (${borrador.cuerpo?.error?.code}: ${borrador.cuerpo?.error?.message})` : ''}`);
  const nota = await llamar('POST', `/advisees/${tomasId}/professional-notes`, { token, cuerpo: { text: 'Nota del tutor, de prueba.' } });
  hechos.push(`nota propia → ${nota.status}`);
  const notaId = nota.cuerpo?.data?.noteId ?? nota.cuerpo?.data?.id;
  if (notaId) hechos.push(`archivar la nota → ${(await llamar('POST', `/professional-notes/${notaId}/archive`, { token, cuerpo: {} })).status}`);
  const mios = (await llamar('GET', '/nutrition/catalog-items/mine?limit=50', { token })).cuerpo?.data ?? [];
  const alimento = mios.find((x) => x.available !== false);
  if (alimento) hechos.push(`retirar «${alimento.name}» → ${(await llamar('POST', `/nutrition/catalog-items/${alimento.catalogItemId}/retirement`, { token, cuerpo: { expectedVersion: alimento.version } })).status}`);
  hechos.push(`invitar → ${(await llamar('POST', '/relationship-invitations', { token, cuerpo: { scope: { code: 'ENTRENAMIENTO' }, purpose: (await import('node:module')).createRequire(path.join(REPO, 'packages/domain/'))(path.join(REPO, 'packages/domain/dist/index.js')).FINALIDAD_DE_ALCANCE.ENTRENAMIENTO } })).status}`);
  paso('el tutor travieso: crea, escribe, archiva, retira e invita', [borrador, nota].every((x) => x.status < 300), hechos.join(' · '));

  // Y la muestra se pone al día igual, sin duplicar ni tocar lo ajeno.
  const r = cargar('al-dia');
  const despues = conteos(cargar('resumen'));
  // Lo único nuevo es la nota que escribió el tutor: al-dia no duplica nada ni borra lo suyo.
  const delTutor = nota.status < 300 ? 1 : 0;
  paso('al-dia después del tutor travieso', r.status === 0 && total(despues) === total(conteosAntes) + delTutor, `salida ${r.status}; ${total(conteosAntes)} → ${total(despues)} filas (${delTutor} del tutor)`);
  const vinculosAjenos = await llamar('GET', '/me/relationships', { token: ajena.token, superficie: 'APK' });
  paso('la cuenta ajena sigue sin vínculos con la muestra', (vinculosAjenos.cuerpo?.data ?? []).length === 0, `${(vinculosAjenos.cuerpo?.data ?? []).length} vínculos`);
}

async function capturas() {
  const puppeteer = require('puppeteer-core');
  const { createHmac } = await import('node:crypto');
  const correo = `tutor-g1.julieta@example.invalid`;
  const clave = `Be-${createHmac('sha256', CLAVE).update(correo).digest('base64url').slice(0, 26)}`;
  const historia = generar({ origen, hoy });
  const navegador = await puppeteer.launch({ executablePath: process.env.CHROME ?? '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--lang=es-AR'] });
  const page = await navegador.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e.message).slice(0, 200)));
  await page.goto(`${WEB}/login?volver=${encodeURIComponent('/pro')}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => Object.keys(document.querySelector('#correo') ?? {}).some((k) => k.startsWith('__reactProps')), { timeout: 60_000 });
  await page.type('#correo', correo);
  await page.type('#contrasena', clave);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.pathname.startsWith('/pro'), { timeout: 60_000 });
  await page.evaluate(() => {
    document.documentElement.dataset.tema = 'claro';
    try {
      localStorage.setItem('be-apariencia', 'claro');
    } catch {}
  });
  const asentar = async () => {
    await page.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => {});
    await pausa(900);
  };
  const ir = async (ruta) => {
    await page.evaluate((u) => window.next.router.push(u), ruta);
    await asentar();
  };
  // La identidad de cada persona, por la API con su propia cuenta (la contraseña sale del mismo secreto).
  const idDe = async (clavePersona) => {
    const c = `tutor-g1.${clavePersona}@example.invalid`;
    const k = `Be-${createHmac('sha256', CLAVE).update(c).digest('base64url').slice(0, 26)}`;
    const cab = { 'Content-Type': 'application/json', 'X-BE-Surface': 'APK' };
    const s = await fetch(`${API}/api/v1/auth/sessions`, { method: 'POST', headers: cab, body: JSON.stringify({ method: 'LOCAL', identifier: c, credential: k }) }).then((r) => r.json());
    const yo = await fetch(`${API}/api/v1/me`, { headers: { ...cab, Authorization: `Bearer ${s.data.session.accessToken}` } }).then((r) => r.json());
    return yo.data?.identityId ?? null;
  };
  const indice = ['# Capturas de la muestra del tutor (WP-ENTORNO-DEL-TUTOR, DL-184)', '', `Origen ${origen}, hoy ${hoy}. ${PROFESIONAL.nombre}, en Claro y Azul noche, a 1920 × 1080 y a 1440 × 900. Datos sintéticos: ninguna persona es real.`, '', '| Archivo | Pantalla | Persona |', '|---|---|---|'];
  const VARIANTES = [['claro', 1920, 1080], ['azul-noche', 1920, 1080], ['claro', 1440, 900], ['azul-noche', 1440, 900]];
  const foto = async (archivo, que, quien = '—') => {
    const base = archivo.replace(/\.png$/, '');
    for (const [tema, ancho, alto] of VARIANTES) {
      await page.evaluate((t) => {
        document.documentElement.dataset.tema = t;
        try {
          localStorage.setItem('be-apariencia', t);
        } catch {}
      }, tema);
      await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
      await pausa(500);
      const nombre = `${base}__${tema}__${ancho}.png`;
      await page.screenshot({ path: path.join(salida, nombre) });
      indice.push(`| \`${nombre}\` | ${que} | ${quien} |`);
    }
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    console.log(`captura ${base} (4)`);
  };
  await asentar();
  await foto('00-inicio.png', 'Inicio de la profesional: «Te toca a vos», «Esperan respuesta» y «Tu semana»');
  await ir('/pro/advisees');
  await foto('01-personas.png', '«Las personas que acompañás»');
  const profundas = PERSONAS.filter((p) => !p.liviana);
  for (const [i, p] of profundas.entries()) {
    const pid = await idDe(p.clave).catch(() => null);
    if (!pid) {
      indice.push(`| — | no se encontró a ${p.nombre} en la lista | ${p.nombre} |`);
      continue;
    }
    const n = String(10 + i * 10);
    await ir(`/pro/advisees?id=${pid}`);
    await foto(`${n}-${p.clave}-ficha.png`, 'La ficha: la cinta del tiempo y el resumen', p.nombre);
    if (p.areas.ENTRENAMIENTO === 'J') {
      await ir(`/pro/advisees/training?id=${pid}`);
      await foto(`${n}-${p.clave}-entrenamiento.png`, 'Entrenamiento: el plan vigente con sus fases, bloques y calentamiento', p.nombre);
    }
    if (p.areas.NUTRICION === 'J') {
      await ir(`/pro/advisees/nutrition?id=${pid}`);
      await foto(`${n}-${p.clave}-nutricion.png`, 'Nutrición: el plan y lo registrado', p.nombre);
    }
    if (p.areas.ANTROPOMETRIA === 'J') {
      await ir(`/pro/advisees/anthropometry?id=${pid}`);
      await foto(`${n}-${p.clave}-antropometria.png`, 'Antropometría: las tomas', p.nombre);
    }
  }
  for (const [ruta, archivo, que] of [['/pro/templates', '90-plantillas.png', 'Sus plantillas, con versiones'], ['/pro/foods', '91-alimentos.png', 'Sus alimentos propios'], ['/pro/recipes', '92-recetas.png', 'Sus recetas']]) {
    await ir(ruta);
    await foto(archivo, que);
  }
  // Los gráficos que cruzan áreas, recortados al gráfico, en Claro a 1440 y a 1920 (para mostrarlos fuera de BE).
  try {
    await capturasDeGraficos({ page, ir, idDe, asentar, indice });
  } catch (e) {
    indice.push('', `Las capturas de los gráficos se cortaron: ${String(e?.message ?? e).slice(0, 300)}`);
    console.log('capturas de gráficos: falla', e);
  }
  indice.push('', `Errores de la página: ${errores.length ? errores.slice(0, 10).join(' | ') : 'ninguno'}.`, '', `La historia: ${historia.personas.length} personas.`);
  fs.writeFileSync(path.join(salida, 'indice.md'), `${indice.join('\n')}\n`);
  await navegador.close();
}

/**
 * Los gráficos que cruzan áreas, para mostrar qué se ve cuando se cargan datos: SP-01 con Valeria, «Armá tu gráfico» con
 * Tomás (fuerza, proteína y peso), y «Patrones» de cada persona con lo indicado frente a lo registrado. Cada gráfico se
 * recorta a su tarjeta, en Claro, a 1440 y a 1920, con el doble de densidad para que se lea en un teléfono.
 */
async function capturasDeGraficos({ page, ir, idDe, asentar, indice }) {
  const carpeta = path.join(salida, 'graficos');
  fs.mkdirSync(carpeta, { recursive: true });
  page.on('dialog', (d) => void d.accept().catch(() => {}));
  indice.push('', '## Gráficos que cruzan áreas (recortados)', '', '| Archivo | Gráfico | Persona |', '|---|---|---|');
  const claro = async (ancho) => {
    await page.evaluate(() => {
      document.documentElement.dataset.tema = 'claro';
      try {
        localStorage.setItem('be-apariencia', 'claro');
      } catch {}
    });
    await page.setViewport({ width: ancho, height: ancho === 1920 ? 1080 : 900, deviceScaleFactor: 2 });
    await pausa(700);
  };
  const sinCargando = async () => {
    await page.waitForFunction(() => ![...document.querySelectorAll('[aria-busy="true"], .cargando')].some((n) => n.offsetParent !== null), { timeout: 20_000 }).catch(() => {});
    await asentar();
  };
  const recortar = async (selector, archivo, que, quien) => {
    const els = await page.$$(selector);
    let n = 0;
    for (const [i, el] of els.entries()) {
      await el.evaluate((x) => x.scrollIntoView({ block: 'start' }));
      await sinCargando();
      const caja = await el.boundingBox();
      if (!caja || caja.width < 50 || caja.height < 50) continue;
      const grafico = (await el.evaluate((x) => x.dataset.grafico ?? 'x')).replace(/[^a-z0-9.-]/gi, '_');
      const nombre = archivo.replace('{i}', String(i + 1).padStart(2, '0')).replace('{g}', grafico);
      await el.screenshot({ path: path.join(carpeta, nombre), captureBeyondViewport: true });
      indice.push(`| \`graficos/${nombre}\` | ${que} | ${quien} |`);
      n++;
    }
    console.log(`gráficos: ${archivo} → ${n}`);
    return n;
  };
  const valeria = await idDe('valeria').catch(() => null);
  const tomas = await idDe('tomas').catch(() => null);
  const carolina = await idDe('carolina').catch(() => null);
  // Ventanas cortas (unas 12 semanas) alrededor de una fase del plan, para que se lean pocos puntos: la semana `w` de la
  // historia de cada persona es `origen + (w - semanas) × 7` (las semanas cuentan hacia atrás desde el origen).
  const semanaDe = (clave, w) => constantes.masDias(origen, (w - PERSONAS.find((x) => x.clave === clave).semanas) * 7);
  const ventana = (clave, w0, w1) => `desde=${semanaDe(clave, w0)}&hasta=${w1 === null ? hoy : semanaDe(clave, w1)}`;
  const VENTANAS = {
    // Valeria: seis semanas antes y seis después de «Más carbohidratos» (semana 51, la misma de «Fuerza 4-6»).
    valeria: ventana('valeria', 45, 57),
    // Tomás: el final de «Hipertrofia 3» y todo «Fuerza 2» (semana 55), hasta hoy.
    fuerzaFinal: ventana('tomas', 49, null),
    // Tomás: el viaje de nueve días y el ajuste de calorías (semana 30).
    viaje: ventana('tomas', 24, 36),
    // Tomás: «Fuerza» (semana 14), la descarga (20) y la vuelta a «Hipertrofia 2» (21).
    primeraFuerza: ventana('tomas', 12, 24),
  };
  indice.push('', `Ventanas: ${Object.entries(VENTANAS).map(([k, v]) => `${k} ${v}`).join(' · ')}`, '');
  for (const ancho of [1920]) {
    await claro(ancho);
    // f. WP-GRAFICOS-POR-FASE (GPF-01 a GPF-08) con Tomás: «Patrones» en 12 semanas con el ejercicio por omisión (la
    // sentadilla, el básico con más sesiones), el selector abierto, una versión del plan elegida (y la anterior), y la
    // franja de lo indicado en GR-03. Las series y la carga × repeticiones van con «Armá tu gráfico» (escenas de b).
    if (tomas) {
      try {
        await porFase({ page, ir, asentar, sinCargando, recortar, carpeta, indice, ancho, tomas });
      } catch (e) {
        indice.push(`| — | las escenas por fase se cortaron: ${String(e?.message ?? e).slice(0, 200)} | Tomás M. |`);
        console.log('escenas por fase: falla', e);
      }
    }
    // a. SP-01 con Valeria, desde «Analizar» → «Ver la relación»: la ventana corta y, para contrastar, el año.
    if (valeria) {
      for (const [sufijo, periodo] of [['12s', VENTANAS.valeria], ['365', 'p=365']]) {
        await ir(`/pro/advisees?id=${valeria}&vista=analizar&pregunta=ver-la-relacion&${periodo}`);
        await sinCargando();
        // En una ventana corta, el ejercicio por omisión puede ser otro: se elige la sentadilla trasera, como en el año.
        const ejercicio = await page.evaluate(() => {
          for (const sel of document.querySelectorAll('main select')) {
            const op = [...sel.options].find((o) => /^Sentadilla trasera/i.test(o.textContent.trim()));
            if (!op) continue;
            if (sel.value !== op.value) {
              Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, op.value);
              sel.dispatchEvent(new Event('change', { bubbles: true }));
            }
            return op.textContent.trim();
          }
          return 'sin sentadilla en la lista';
        });
        indice.push(`| — | SP-01 ${sufijo}: ${ejercicio} | Valeria Q. |`);
        await pausa(1500);
        await sinCargando();
        await recortar('article[data-grafico]', `a-valeria-relacion-{g}-${sufijo}__${ancho}.png`, `«Ver la relación» (SP-01 y SP-02), ${periodo}`, 'Valeria Q.');
      }
    }
    // b. «Armá tu gráfico» con Tomás: cada escena, sus tres series (a 1440 solo la primera).
    const ENT = (serie) => [['Área', 'Entrenamiento'], ['Ejercicio', 'Sentadilla trasera'], ['Serie', serie]];
    const ESCENAS = [
      ['fuerza-proteina-peso', 'Fuerza, proteína y peso', VENTANAS.fuerzaFinal, [ENT('1RM'), [['Área', 'Nutrici'], ['Serie', 'prote.*(kilo|kg)']], [['Área', 'Antropometr'], ['Medida', '^\\s*Peso']]]],
      ['fuerza-proteina-peso-365', 'Fuerza, proteína y peso', 'p=365', [ENT('1RM'), [['Área', 'Nutrici'], ['Serie', 'prote.*(kilo|kg)']], [['Área', 'Antropometr'], ['Medida', '^\\s*Peso']]]],
      ['sentadilla-carga-reps-rir', 'Sentadilla: carga, repeticiones y RIR', VENTANAS.fuerzaFinal, [ENT('^Carga registrada'), ENT('^Repeticiones registradas'), ENT('^RIR registrado')]],
      ['sentadilla-rir-indicado', 'Sentadilla: lo indicado y lo hecho', VENTANAS.fuerzaFinal, [ENT('^RIR indicado'), ENT('^RIR registrado'), ENT('1RM')]],
      // GPF-07: las series indicadas y las hechas, y la carga × repeticiones indicada y hecha (DL-187), en 12 semanas.
      ['series-indicadas-y-hechas', 'Sentadilla: series indicadas y hechas', 'p=84', [ENT('^Series indicadas'), ENT('^Series registradas'), ENT('^Carga × repeticiones hecha')]],
      ['carga-por-repeticiones', 'Sentadilla: carga × repeticiones indicada y hecha', 'p=84', [ENT('^Carga × repeticiones indicada'), ENT('^Carga × repeticiones hecha')]],
      ['volumen-y-energia', 'Volumen de sentadilla y calorías', VENTANAS.viaje, [ENT('^Series registradas'), ENT('^Volumen de carga'), [['Área', 'Nutrici'], ['Serie', '^(Calor|Energ).*registrad']]]],
      ['fuerza-carbohidratos-proteina', 'Fuerza y macros', VENTANAS.primeraFuerza, [ENT('1RM'), [['Área', 'Nutrici'], ['Serie', '^Carbohidratos registrados$|^Carbohidratos registrados']], [['Área', 'Nutrici'], ['Serie', '^Prote[ií]nas registradas$|^Prote[ií]nas registradas \\(']]]],
    ];
    for (const [clave, titulo, periodo, grupos] of tomas ? ESCENAS : []) {
      await ir('/pro/advisees');
      await ir(`/pro/advisees?id=${tomas}&vista=patrones&${periodo}`);
      await sinCargando();
      const boton = await page.$('[data-arma-tu-grafico]');
      if (!boton) {
        indice.push('| — | sin «Armá tu gráfico» en Patrones | Tomás M. |');
        break;
      }
      await boton.evaluate((x) => x.scrollIntoView({ block: 'center' }));
      await boton.click();
      await page.waitForSelector('.compositor', { timeout: 15_000 });
      await pausa(500);
      const elegir = (etiqueta, patron) =>
        page.evaluate(
          (et, pa) => {
            const raiz = document.querySelector('.compositor');
            const label = [...raiz.querySelectorAll('label')].find((l) => l.textContent.trim().startsWith(et));
            const sel = label ? document.getElementById(label.htmlFor) : null;
            if (!sel) return `sin ${et}`;
            const re = new RegExp(pa, 'i');
            const op = [...sel.options].find((o) => re.test(o.textContent.trim())) ?? null;
            if (!op) return `sin opción ${pa} en ${et}: ${[...sel.options].map((o) => o.textContent).join(' / ')}`;
            Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, op.value);
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            return op.textContent;
          },
          etiqueta,
          patron,
        );
      const agregar = async () => {
        await page.evaluate(() => [...document.querySelectorAll('.compositor__agregar button')].find((b) => b.textContent.trim() === 'Agregar')?.click());
        await pausa(600);
      };
      const pasos = [];
      await page.type('.compositor input[type="text"]', titulo);
      for (const grupo of grupos) {
        for (const [et, pa] of grupo) {
          pasos.push(await elegir(et, pa));
          await pausa(300);
        }
        await agregar();
      }
      console.log(`compositor ${clave}:`, pasos.join(' | '));
      indice.push(`| — | compositor ${clave}: ${pasos.join(' · ')} | Tomás M. |`);
      await sinCargando();
      await pausa(1500);
      await page.evaluate(() => {
        const raiz = document.querySelector('.compositor');
        const cuadro = raiz.closest('[role="dialog"], dialog') ?? raiz;
        cuadro.setAttribute('data-captura', 'compositor');
      });
      if (clave === 'fuerza-proteina-peso') await recortar('[data-captura="compositor"]', `b-tomas-arma-tu-grafico-selector__${ancho}.png`, '«Armá tu gráfico»: las tres series elegidas', 'Tomás M.');
      await recortar('.compositor__vista-previa', `b-tomas-${clave}__${ancho}.png`, `«Armá tu gráfico»: ${titulo}`, 'Tomás M.');
      await page.evaluate(() => {
        const raiz = document.querySelector('.compositor');
        const cuadro = raiz.closest('[role="dialog"], dialog') ?? document;
        [...cuadro.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Cancelar')?.click();
      });
      await pausa(800);
    }
    // c, d y e. «Patrones» de cada una: cada tarjeta, con los cruces a pedido abiertos.
    for (const [clave, pid, nombre] of [
      ['tomas', tomas, 'Tomás M.'],
      ['valeria', valeria, 'Valeria Q.'],
      ['carolina', carolina, 'Carolina R.'],
    ]) {
      if (!pid) continue;
      await ir(`/pro/advisees?id=${pid}&vista=patrones&p=365`);
      await sinCargando();
      for (const b of await page.$$('[data-ver-el-cruce]')) {
        await b.evaluate((x) => x.scrollIntoView({ block: 'center' }));
        await b.click().catch(() => {});
        await pausa(400);
      }
      await sinCargando();
      await recortar('article[data-grafico]', `e-${clave}-patrones-{i}-{g}__${ancho}.png`, '«Patrones»: una tarjeta', nombre);
    }
  }
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
}

/**
 * WP-GRAFICOS-POR-FASE: las escenas del período y de la franja con Tomás, en Claro. Cada una deja su captura en
 * `graficos/` y su renglón en el índice: lo que eligió (el ejercicio, la versión) queda escrito.
 */
async function porFase({ page, ir, asentar, sinCargando, recortar, carpeta, indice, ancho, tomas }) {
  const renglon = (archivo, que) => indice.push('| `graficos/' + archivo + '` | ' + que + ' | Tomás M. |');
  const vista = async (archivo, que) => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await pausa(400);
    await page.screenshot({ path: path.join(carpeta, archivo) });
    renglon(archivo, que);
  };
  const gr03 = 'article:has(section[data-grafico="GR-03"])';
  // f1. 12 semanas, con el ejercicio que abre «Patrones».
  await ir('/pro/advisees');
  await ir(`/pro/advisees?id=${tomas}&vista=patrones&p=84`);
  await sinCargando();
  const ejercicio = await page.evaluate(() => {
    const sel = document.querySelector('[data-ejercicio-de-patrones] select');
    return sel ? (sel.options[sel.selectedIndex]?.textContent?.trim() ?? '—') : 'sin selector de ejercicio';
  });
  indice.push(`| — | «Patrones» en 12 semanas abre con: ${ejercicio} | Tomás M. |`);
  await vista(`f1-tomas-patrones-12-semanas__${ancho}.png`, '«Patrones» en 12 semanas: el período y el ejercicio elegido');
  await recortar(gr03, `f1-tomas-franja-12-semanas-{i}__${ancho}.png`, 'GR-03 con la franja de lo indicado, 12 semanas', 'Tomás M.');
  // f2. El selector abierto: las duraciones, «Desde que la acompañás», a medida y por versión del plan.
  await page.evaluate(() => window.scrollTo(0, 0));
  await pausa(300);
  await page.click('[data-selector-de-periodo] .periodo-del-seguimiento__boton');
  await pausa(600);
  const panel = await page.$('[data-selector-de-periodo] .periodo-del-seguimiento__panel');
  if (panel) {
    const archivo = `f2-tomas-selector-abierto__${ancho}.png`;
    await panel.screenshot({ path: path.join(carpeta, archivo) });
    renglon(archivo, 'El selector de período de los gráficos, abierto');
  }
  // f3. Una versión del plan de Entrenamiento: la segunda más nueva (la anterior a la vigente), y después «La anterior».
  const version = await page.evaluate(() => {
    const sel = document.querySelector('[data-por-version] select');
    const grupo = sel ? [...sel.querySelectorAll('optgroup')].find((g) => g.label === 'Entrenamiento') : null;
    const op = grupo ? (grupo.querySelectorAll('option')[1] ?? grupo.querySelectorAll('option')[0]) : null;
    if (!sel || !op) return `sin versiones: ${sel ? [...sel.options].map((o) => o.textContent).join(' / ') : 'sin selector'}`;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(sel, op.value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return op.textContent.trim();
  });
  indice.push(`| — | versión elegida: ${version} | Tomás M. |`);
  await asentar();
  await sinCargando();
  await pausa(1200);
  await vista(`f3-tomas-una-version__${ancho}.png`, `«Patrones» en una versión del plan (${version})`);
  await recortar(gr03, `f3-tomas-franja-una-version-{i}__${ancho}.png`, `GR-03 con la franja, en la versión ${version}`, 'Tomás M.');
  const anterior = await page.evaluate(() => {
    const b = [...document.querySelectorAll('[data-pasos-entre-versiones] button')][0];
    if (!b || b.disabled) return 'sin anterior';
    b.click();
    return b.textContent.trim();
  });
  indice.push(`| — | «La anterior»: ${anterior} | Tomás M. |`);
  await asentar();
  await sinCargando();
  await pausa(1200);
  await vista(`f4-tomas-la-version-anterior__${ancho}.png`, '«La anterior»: la versión de antes, con su vigencia');
  await recortar(gr03, `f4-tomas-franja-version-anterior-{i}__${ancho}.png`, 'GR-03 con la franja, en la versión anterior', 'Tomás M.');
}
