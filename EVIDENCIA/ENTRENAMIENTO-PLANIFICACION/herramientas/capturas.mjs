// Las capturas de WP-ENTRENAMIENTO-PLANIFICACION (DL-181): el editor del plan de Entrenamiento con los bloques de la
// sesión, la revisión honesta en el panel, el menú de la fase entero, el criterio arriba de las series con la edición
// conjunta y el preset con la sesión vacía. En la CI: esta PC no levanta la API, el website y PostgreSQL juntos. Corre en
// el trabajo `capturas-de-la-planificacion` (.github/workflows/capturas-de-la-planificacion.yml) y deja las imágenes como
// artefacto. Solo datos sintéticos: la cohorte (08 §33) y, encima, una versión en preparación del plan de Diego Sosa con
// un bloque en vueltas en una sesión, con el nombre de lo que trabaja («Pierna» en «Piernas A»), que arma Prof. Martín
// Acosta por la API.
//
// Uso:  BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_cohorte node capturas.mjs <salida>
//   Requiere compilados la API (`npm run build:api`) y el website contra la API local
//   (`BE_API_BASE_URL=http://localhost:3001 npm run build:web`). CHROME apunta al navegador.
//
// Qué captura, en Claro y en Azul noche, a 1280 × 800, a 1536 × 730 (Windows al 125 % con Chrome al 100 % en 1920 × 1080)
// y a 1920 × 950. El tramo 2 suma una escena por punto que cambia la pantalla (06 a 15): la escritura rápida sin aplicar,
// «Ir a…» y «Volver a la revisión», el cambio de criterio, de dónde sale cada valor, las próximas fechas, el catálogo con
// los elegidos y sin resultados, «Sesiones vacías» y la versión activa agrupada por bloque (activa la versión con bloques
// por la API y prepara otra sobre ella). Cada pantalla es un paso: si uno falla, queda anotado en `capturas.json` con una captura del momento y
// se sigue. `capturas.json` anota, además, si un menú abierto queda entero y si la tabla de series se desplaza adentro.
//
// WP-PLANTILLAS-DE-ENTRENAMIENTO (DL-182) suma las escenas 16 a 21, con el mismo editor sin persona: la colección con lo
// que está en preparación, una plantilla nueva en blanco, el editor de la plantilla con sus bloques, «Antes de guardar»
// con lo que cambia, el detalle con sus versiones después de guardar la 2 y el plan de Diego Sosa creado desde la versión
// 1, que dice «versión 1» aunque la vigente sea la 2. Lo arma Prof. Martín Acosta por la API (`prepararLasPlantillas`).
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '../../..');
const COHORTE = path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte');
const TRABAJO = path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/trabajo-cohorte');
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const OTPAuth = createRequire(path.join(REPO, 'apps/api/'))('otpauth');

const salida = path.resolve(process.argv[2] ?? 'capturas-de-la-planificacion');
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CHROME = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
const TAMANOS = [
  [1280, 800],
  [1536, 730],
  [1920, 950],
];
const TEMAS = ['claro', 'azul-noche'];

/** La base se declara y tiene que ser local y de prueba: la misma guardia que la cohorte (destino.mjs). */
const BASE = process.env.BE_E2E_DATABASE_URL ?? '';
{
  const u = new URL(BASE || 'postgresql://x@nada/nada');
  if (!['localhost', '127.0.0.1'].includes(u.hostname) || !/^\/be_test_[a-z0-9_]+$/.test(u.pathname)) {
    throw new Error('Guardia: BE_E2E_DATABASE_URL tiene que ser una base be_test_* de localhost.');
  }
}
for (const necesario of ['apps/api/dist/main.js', 'apps/web/out/index.html', 'packages/domain/dist/index.js']) {
  if (!fs.existsSync(path.join(REPO, necesario))) throw new Error(`Falta ${necesario}: compilá antes (ver el encabezado).`);
}
fs.mkdirSync(salida, { recursive: true });
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── La API, la cohorte y el website ────────────────────────────────────────────────────────────────────────────

const SECRETO = randomBytes(36).toString('base64url');
const CLAVE_DEL_SEGUNDO_FACTOR = randomBytes(32).toString('base64url');
let registroDeLaApi = [];

async function arrancarApi(demoProfesionales = '') {
  const env = {
    ...process.env,
    APP_ENV: 'development',
    PORT: '3001',
    DATABASE_URL: BASE,
    JWT_SECRET: SECRETO,
    BCRYPT_COST: '10',
    TRUST_PROXY_HOPS: '0',
    CORS_ALLOWED_ORIGINS: WEB,
    BE_DEMO_PROFESIONALES: demoProfesionales,
    BE_CLAVE_DEL_SEGUNDO_FACTOR: CLAVE_DEL_SEGUNDO_FACTOR,
    RATE_LIMIT_REGISTRO_MAX: '50',
    RATE_LIMIT_LOGIN_MAX: '100',
  };
  const proceso = spawn(process.execPath, [path.join(REPO, 'apps/api/dist/main.js')], { cwd: REPO, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const anotar = (b) => {
    registroDeLaApi.push(b.toString());
    if (registroDeLaApi.length > 600) registroDeLaApi = registroDeLaApi.slice(-600);
  };
  proceso.stdout.on('data', anotar);
  proceso.stderr.on('data', anotar);
  for (let i = 0; i < 90; i++) {
    if (proceso.exitCode !== null) break;
    if (await fetch(`${API}/health/ready`).then((r) => r.ok).catch(() => false)) return proceso;
    await pausa(1000);
  }
  process.stderr.write(registroDeLaApi.join('').slice(-4000));
  proceso.kill();
  throw new Error('La API no respondió /health/ready a tiempo.');
}

async function parar(proceso) {
  if (!proceso || proceso.exitCode !== null) return;
  proceso.kill('SIGTERM');
  for (let i = 0; i < 20 && proceso.exitCode === null; i++) await pausa(250);
  if (proceso.exitCode === null) proceso.kill('SIGKILL');
}

const cohorte = (fase) =>
  execFileSync(process.execPath, [path.join(COHORTE, 'cargar.mjs'), 'local', fase], {
    cwd: COHORTE,
    env: { ...process.env, BE_E2E_DATABASE_URL: BASE, BE_API: API },
    stdio: 'inherit',
  });

/** Las cuentas sintéticas que generó la cohorte en esta corrida. Nunca se imprimen ni se suben. */
function cuentas() {
  const texto = fs.readFileSync(path.join(TRABAJO, 'cuentas.env'), 'utf8');
  return Object.fromEntries(
    texto
      .split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );
}

// ─── Ayudas del navegador ───────────────────────────────────────────────────────────────────────────────────────

/** Espera a que la página termine de pedir datos y de acomodarse. */
async function asentar(page) {
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => {});
  await pausa(700);
}

/** Navega dentro de la aplicación, sin recargar: la sesión vive en memoria. */
async function ir(page, ruta) {
  await page.evaluate((u) => window.next.router.push(u), ruta);
  await asentar(page);
}

/** El elemento visible que coincide con el selector (y, si se pide, contiene el texto). */
async function visible(page, selector, texto = null, timeout = 30_000) {
  const h = await page.waitForFunction(
    (s, t) => [...document.querySelectorAll(s)].find((e) => (t === null || e.textContent.includes(t)) && (e.offsetParent !== null || getComputedStyle(e).position === 'fixed')) ?? null,
    { timeout, polling: 150 },
    selector,
    texto,
  );
  return h.asElement();
}

/** Un clic de verdad, con el elemento a la vista. */
async function clic(page, selector, texto = null) {
  const e = await visible(page, selector, texto);
  await e.evaluate((x) => x.scrollIntoView({ block: 'center' }));
  await pausa(150);
  await e.click();
  await asentar(page);
  return e;
}

/** Vacía un campo de verdad: el foco, Ctrl+A y borrar (el triple clic no seleccionaba todo en el buscador). */
async function vaciar(page, elemento) {
  await elemento.click();
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
}

/** El tema, como lo aplica el menú de la cuenta (`aplicarTema`): el atributo y la preferencia guardada. */
async function ponerTema(page, tema) {
  await page.evaluate((t) => {
    document.documentElement.dataset.tema = t;
    try {
      localStorage.setItem('be-apariencia', t);
    } catch {}
  }, tema);
  await pausa(500);
}

/** Cierra los cuadros abiertos con Escape, hasta que no quede ninguno. */
async function cerrarCuadros(page) {
  for (let i = 0; i < 4 && (await page.$('dialog[open]')); i++) {
    await page.keyboard.press('Escape');
    await pausa(400);
  }
}

// UF-11 (DL-169): la compuerta de `/pro` pide el segundo factor una vez por sesión. La cohorte lo configuró y guardó la
// clave del autenticador en sus cuentas; acá se escribe el código de un paso de 30 s que esa cuenta no usó.
const PERIODO_MS = 30_000;
const codigoDelPaso = (secreto, paso) =>
  new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(secreto), algorithm: 'SHA1', digits: 6, period: 30 }).generate({ timestamp: paso * PERIODO_MS });
const ultimoPaso = {};

async function entrar(page, prefijo) {
  const c = cuentas();
  await page.goto(`${WEB}/login?volver=${encodeURIComponent('/pro')}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => Object.keys(document.querySelector('#correo') ?? {}).some((k) => k.startsWith('__reactProps')), { timeout: 60_000 });
  await page.type('#correo', c[`${prefijo}_CORREO`]);
  await page.type('#contrasena', c[`${prefijo}_CLAVE`]);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => location.pathname.startsWith('/pro'), { timeout: 60_000 });
  const conCompuerta = await page.waitForSelector('#mfa-codigo', { timeout: 20_000 }).then(() => true).catch(() => false);
  if (conCompuerta) {
    const secreto = c[`${prefijo}_AUTENTICADOR`];
    if (!secreto) throw new Error(`La cohorte no guardó el autenticador de ${prefijo}.`);
    const usado = Math.max(Number(c[`${prefijo}_ULTIMO_PASO`] ?? -1), ultimoPaso[prefijo] ?? -1);
    while (Math.floor(Date.now() / PERIODO_MS) <= usado) await pausa(1000);
    const paso = Math.floor(Date.now() / PERIODO_MS);
    ultimoPaso[prefijo] = paso;
    await page.waitForFunction(() => Object.keys(document.querySelector('#mfa-codigo') ?? {}).some((k) => k.startsWith('__reactProps')), { timeout: 30_000 });
    await page.type('#mfa-codigo', codigoDelPaso(secreto, paso));
    await clic(page, 'form button[type="submit"]', 'Confirmar');
    await page.waitForFunction(() => !document.querySelector('#mfa-codigo'), { timeout: 30_000 });
  }
  await asentar(page);
}


// ─── El plan en preparación con bloques, encima de la cohorte ───────────────────────────────────────────────────

const { clienteDe, dominio } = await import(pathToFileURL(path.join(COHORTE, 'api.mjs')).href);
const cliente = clienteDe(API);
/** Lo que declara el website: lee el tipo de serie y los bloques de la sesión. */
const DEL_WEBSITE = dominio.valorDeCapacidades([dominio.CAPACIDAD_TIPOS_DE_SERIE, dominio.CAPACIDAD_BLOQUES_DE_LA_SESION, dominio.CAPACIDAD_FORMULARIOS_FORMATO_3]);

/**
 * Prof. Martín Acosta prepara una versión nueva del plan de Diego Sosa (o sigue la que ya tiene en preparación) y le arma
 * en la primera sesión con dos ejercicios o más un bloque en vueltas (3, con 90 s al terminar cada vuelta) con el nombre
 * de lo que trabaja la sesión («Pierna» en «Piernas A»), y con un tercer ejercicio, «Complementarios», seguido. Devuelve
 * dónde quedó esa sesión, para pedirla en la dirección.
 */
async function prepararLosBloques(ids, nota) {
  const c = cuentas();
  const martin = await cliente.sesion(c.PRO_T_CORREO, c.PRO_T_CLAVE, 'WEB');
  const lista = await cliente.pedir('GET', `/advisees/${ids.diego}/training/plans?limit=50`, { token: martin, capacidades: DEL_WEBSITE });
  let borrador = lista.data.find((v) => v.state === 'DRAFT');
  if (!borrador) {
    const vigente = lista.data.find((v) => v.isEffective) ?? lista.data[0];
    const objetivo = await cliente.pedir('GET', `/advisees/${ids.diego}/training/objectives/effective`, { token: martin });
    const objectiveVersionId = objetivo.data.objective?.versionId ?? vigente?.objectiveVersionId;
    borrador = (await cliente.pedir('POST', `/advisees/${ids.diego}/training/plans`, { token: martin, cuerpo: { objectiveVersionId, ...(vigente ? { basedOnPlanId: vigente.planId } : {}) } })).data;
  }
  const detalle = (await cliente.pedir('GET', `/training/plans/${borrador.planId}/detail`, { token: martin, capacidades: DEL_WEBSITE })).data;
  const fases = dominio.estructuraConObjetivosComoEntrada(detalle);
  // La primera sesión con dos ejercicios o más, y su lugar (fase, semana si la hay, sesión).
  let lugar = null;
  fases.forEach((f, i) => {
    const grupos = (f.microcycles ?? []).length > 0 ? f.microcycles.map((m, j) => ({ j, sesiones: m.sessions })) : [{ j: null, sesiones: f.sessions ?? [] }];
    for (const g of grupos) g.sesiones.forEach((s, k) => {
      if (!lugar && s.prescriptions.length >= 2) lugar = { i, j: g.j, k, sesion: s };
    });
  });
  if (!lugar) throw new Error('El plan de Diego Sosa no tiene una sesión con dos ejercicios.');
  const s = lugar.sesion;
  const vueltas = 3;
  const vacia = { repetitions: { value: 10 } };
  // El nombre del bloque, coherente con su sesión: las capturas las ve el tutor («Torso» dentro de «Piernas A», con
  // sentadilla y zancadas, confundía).
  const nombreDelBloque = /pierna/i.test(s.label) ? 'Pierna' : /torso/i.test(s.label) ? 'Torso' : 'Principal';
  s.exerciseGroups = [
    { groupId: 'g-1', label: nombreDelBloque, kind: 'ROUNDS', rounds: vueltas, restAfterRoundSeconds: 90 },
    ...(s.prescriptions.length >= 3 ? [{ groupId: 'g-2', label: 'Complementarios', kind: 'SEQUENTIAL' }] : []),
  ];
  s.prescriptions.forEach((p, n) => {
    if (n < 2) {
      p.exerciseGroupId = 'g-1';
      p.sets = dominio.seriesParaLasVueltas(p.sets, vueltas, vacia);
    } else if (n === 2) p.exerciseGroupId = 'g-2';
  });
  // ENP-D01, ratificado el 19/11: la fase lleva el nombre automático de los planes viejos («Bloque N»), que en pantalla se
  // lee «Fase N» (escenas 01, 15 y 15b). El dato guardado queda «Bloque N».
  lugar.nombreViejo = `Bloque ${lugar.i + 1}`;
  fases[lugar.i].label = lugar.nombreViejo;
  const guardado = await cliente.pedir('PATCH', `/training/plans/${borrador.planId}`, { token: martin, capacidades: DEL_WEBSITE, cuerpo: { expectedVersion: detalle.version, changes: { blocks: fases } } });
  nota(`bloques en la fase ${lugar.i + 1}${lugar.j === null ? '' : `, semana ${lugar.j + 1}`}, sesión ${lugar.k + 1} (${s.prescriptions.length} ejercicios)`);
  // Tramo 2 (§7): la versión con bloques se activa, para ver la versión activa agrupada bajo su bloque, y se prepara una
  // nueva sobre ella (con los mismos bloques) para el editor. Si no se puede activar, el editor sigue con esta.
  lugar.activada = false;
  try {
    await cliente.pedir('POST', `/training/plans/${borrador.planId}/activate`, { token: martin, capacidades: DEL_WEBSITE, cuerpo: { expectedVersion: guardado.data.version } });
    lugar.activada = true;
    const objetivo = await cliente.pedir('GET', `/advisees/${ids.diego}/training/objectives/effective`, { token: martin });
    await cliente.pedir('POST', `/advisees/${ids.diego}/training/plans`, { token: martin, cuerpo: { objectiveVersionId: objetivo.data.objective?.versionId ?? detalle.objectiveVersionId, basedOnPlanId: borrador.planId } });
    nota('la versión con bloques quedó activa y hay otra en preparación sobre ella');
  } catch (e) {
    nota(`no se activó la versión con bloques: ${String(e?.message ?? e).slice(0, 240)}`);
  }
  return lugar;
}

// ─── Las plantillas, sin persona (DL-182) ────────────────────────────────────────────────────────────────────────

/**
 * Prof. Martín Acosta arma una plantilla sin persona con la estructura de la versión en preparación de Diego Sosa (con
 * sus bloques) y la guarda (versión 1); descarta esa versión de Diego y crea otra desde la plantilla (versión 1); abre
 * cambios sobre la plantilla (el nombre de una sesión), que la escena 19 guarda como versión 2; y deja una plantilla
 * nueva sin título en preparación. Devuelve lo que piden las escenas.
 */
async function prepararLasPlantillas(ids, nota) {
  const c = cuentas();
  const martin = await cliente.sesion(c.PRO_T_CORREO, c.PRO_T_CLAVE, 'WEB');
  const op = (metodo, ruta, cuerpo) => cliente.pedir(metodo, ruta, { token: martin, capacidades: DEL_WEBSITE, ...(cuerpo ? { cuerpo } : {}) });
  const lista = await op('GET', `/advisees/${ids.diego}/training/plans?limit=50`);
  const borrador = lista.data.find((v) => v.state === 'DRAFT');
  if (!borrador) throw new Error('Diego Sosa no tiene una versión en preparación de la que tomar la estructura.');
  const detalle = (await op('GET', `/training/plans/${borrador.planId}/detail`)).data;
  // Lo de Diego no viaja a la plantilla (D-3 de DL-108, revisión del 2026-11-19): como en «Guardar como plantilla», cada
  // nota de texto libre (el propósito de la fase, «Consolidar: 135 kg de sentadilla…», las instrucciones y las notas) se
  // vacía antes de guardarla; las cargas no van (D-2). La escena 18 verifica que ninguna aparezca en el editor.
  const conNotas = { blocks: dominio.estructuraConObjetivosComoEntrada(detalle) };
  const notasDeDiego = dominio.notasDeLaEstructura(conNotas).map((n) => n.texto);
  const fases = dominio.notasDeLaEstructura(conNotas).reduce((e, n) => dominio.vaciarNota(e, n.lugar), conNotas).blocks;
  plantillas.notasDeDiego = notasDeDiego;
  // 1. La plantilla, en blanco y sin persona: la estructura, el nombre y la descripción; guardada, es la versión 1.
  const nueva = (await op('POST', '/training/plan-template-drafts', {})).data;
  const preparada = (
    await op('PATCH', `/training/plan-template-drafts/${nueva.draftId}`, { expectedVersion: nueva.version, structure: { blocks: fases }, name: 'Fuerza en vueltas', description: 'Tres días, con un bloque en vueltas en la sesión de piernas.' })
  ).data;
  const v1 = (await op('POST', `/training/plan-template-drafts/${nueva.draftId}/publish`, { expectedVersion: preparada.version })).data;
  // 2. El plan de Diego desde la versión 1 (la que está en preparación se descarta: un plan tiene una sola).
  await op('POST', `/training/plans/${borrador.planId}/discard`, { expectedVersion: detalle.version });
  const objetivo = await op('GET', `/advisees/${ids.diego}/training/objectives/effective`);
  await op('POST', `/advisees/${ids.diego}/training/plans`, { objectiveVersionId: objetivo.data.objective?.versionId ?? detalle.objectiveVersionId, fromTemplateVersionId: v1.versionId });
  // 3. Cambios en preparación sobre la versión 1: el nombre de la primera sesión.
  const cambios = (await op('PUT', `/training/plan-templates/${v1.templateId}/draft`, {})).data;
  const estructura = structuredClone(cambios.structure);
  const primera = estructura.blocks[0]?.sessions?.[0] ?? estructura.blocks[0]?.microcycles?.[0]?.sessions?.[0];
  if (primera) primera.label = `${primera.label} con saltos`;
  await op('PATCH', `/training/plan-template-drafts/${cambios.draftId}`, { expectedVersion: cambios.version, structure: estructura });
  // 4. Una plantilla nueva, todavía sin título.
  await op('POST', '/training/plan-template-drafts', {});
  nota(`plantilla «Fuerza en vueltas» (versión 1), el plan de Diego desde ella, cambios en preparación y una nueva sin título`);
  return { templateId: v1.templateId, cambios: cambios.draftId };
}

/** Lo que no puede aparecer en el editor de una plantilla: lo que depende de una persona, y las palabras que no van. */
const sinPersonaEnPantalla = (page) =>
  page.evaluate(() => {
    const problemas = [];
    for (const [selector, que] of [
      ['.estacion__chips', 'los días de una sesión'],
      ['#pestana-otras', '«Otras áreas»'],
      ['[data-revisar-y-activar]', '«Revisar y activar…»'],
      ['[data-fechas-de-la-agenda]', 'las fechas de la agenda'],
      ['.panel-de-contexto, [data-panel-de-contexto]', 'el contexto de la persona'],
    ]) {
      if (document.querySelector(selector)) problemas.push(`aparece ${que}`);
    }
    const texto = document.querySelector('main')?.innerText ?? '';
    for (const palabra of [/asesorad/i, /estación/i, /cumplimiento|adherencia|racha|puntaje/i]) if (palabra.test(texto)) problemas.push(`dice «${texto.match(palabra)[0]}»`);
    return problemas;
  });

// ─── Las pantallas ──────────────────────────────────────────────────────────────────────────────────────────────

/** El panel a la vista: a menos de 1440 se abre con «Panel»; a 1440 o más ya está. */
async function conElPanel(page) {
  const oculto = await page.evaluate(() => {
    const p = document.querySelector('#zona-panel');
    return !p || getComputedStyle(p).display === 'none';
  });
  if (oculto) await clic(page, '[data-abrir-panel]');
}

function pantallas(ids, lugar) {
  const pedido = `bloque=${lugar.i + 1}${lugar.j === null ? '' : `&micro=${lugar.j + 1}`}&sesion=${lugar.k + 1}`;
  const editor = `/pro/advisees/training?id=${ids.diego}&vista=plan&${pedido}`;
  return [
    {
      nombre: '01-sesion-con-bloques',
      llegar: async (page) => {
        await ir(page, editor);
        await visible(page, '.bloque-del-editor');
        // La revisión se pide sola cuando lo guardado se queda quieto: se espera su respuesta.
        await page.waitForSelector('[data-estado-de-la-revision="lista"], [data-estado-de-la-revision="fallo"]', { timeout: 30_000 }).catch(() => {});
        await asentar(page);
        // El bloque a la vista, arriba del centro (que se desplaza solo).
        await page.evaluate(() => document.querySelector('.bloque-del-editor')?.scrollIntoView({ block: 'start' }));
        await pausa(300);
      },
    },
    {
      nombre: '02-revision-en-el-panel',
      vistaInicial: [1280, 800],
      llegar: async (page) => {
        await conElPanel(page);
        await visible(page, '[data-revision]');
      },
      despues: async (page) => {
        await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
        const abierto = await page.$('.estacion[data-panel-abierto]');
        if (abierto) await clic(page, '[data-abrir-panel]');
      },
    },
    {
      nombre: '03-menu-de-la-fase',
      vistaInicial: [1280, 800],
      llegar: async (page) => {
        await clic(page, '#menu-del-bloque');
        await visible(page, '.menu-de-acciones__panel[data-ubicado]');
      },
      despues: async (page) => {
        await page.keyboard.press('Escape');
        await pausa(300);
      },
    },
    {
      nombre: '04-ejercicio-abierto-y-series-elegidas',
      llegar: async (page) => {
        await clic(page, '.bloque-del-editor [id^="abrir-ejercicio-"]');
        await visible(page, '[data-criterio-del-ejercicio]');
        await clic(page, '[data-seleccionar-series]');
        const casillas = await page.$$('.series-del-editor__elegir input[type="checkbox"]');
        for (const c of casillas.slice(0, 2)) await c.click();
        await asentar(page);
        // El ejercicio abierto desde su título: el criterio arriba, la barra y las series.
        await page.evaluate(() => document.querySelector('.bloque-del-editor [data-abierta]')?.scrollIntoView({ block: 'start' }));
        await pausa(300);
      },
    },
    {
      nombre: '05-sesion-vacia-con-un-preset',
      llegar: async (page, nota) => {
        await clic(page, '[data-mas-sesion]');
        await page.keyboard.press('Enter');
        await asentar(page);
        await clic(page, '[data-galeria-de-prescripcion]');
        await clic(page, '.galeria__tarjeta[data-preset]');
        const texto = await page.evaluate(() => document.querySelector('[data-para-los-que-agregues]')?.textContent ?? null);
        if (!texto) nota('la galería no dijo qué hace el preset con la sesión vacía');
        else if (/queda como su prescripción/.test(texto)) nota('la galería todavía dice «queda como su prescripción»');
      },
      despues: (page) => cerrarCuadros(page),
    },
    // ─── Tramo 2 ───────────────────────────────────────────────────────────────────────────────────────────────
    {
      // C7: la escritura rápida con su rótulo, su lectura y «Aplicar»; lo escrito sin aplicar, en el panel.
      nombre: '06-escritura-rapida-sin-aplicar',
      llegar: async (page) => {
        await ir(page, editor);
        await visible(page, '.bloque-del-editor');
        await clic(page, '.bloque-del-editor [id^="abrir-ejercicio-"]');
        const linea = await visible(page, '[data-linea-de-prescripcion] input');
        await vaciar(page, linea);
        await page.keyboard.type('4x8-12 RIR 2 90 s');
        await asentar(page);
        await page.evaluate(() => document.querySelector('[data-linea-de-prescripcion]')?.scrollIntoView({ block: 'center' }));
        await pausa(300);
      },
    },
    {
      // C9: «Ir a…» desde el panel lleva a la línea (el campo exacto) y deja «Volver a la revisión».
      nombre: '07-ir-al-campo-y-volver',
      vistaInicial: [1280, 800],
      llegar: async (page, nota) => {
        await conElPanel(page);
        await page.waitForFunction(() => [...document.querySelectorAll('[data-revision] li')].some((li) => li.textContent.includes('escritura rápida')), { timeout: 20_000 });
        await page.evaluate(() => [...document.querySelectorAll('[data-revision] li')].find((li) => li.textContent.includes('escritura rápida'))?.querySelector('[data-ir-al-problema]')?.click());
        await asentar(page);
        await visible(page, '[data-volver-a-la-revision]');
        const foco = await page.evaluate(() => document.activeElement?.id ?? '');
        if (!foco.endsWith('-linea')) nota(`el foco quedó en «${foco}», no en la escritura rápida`);
        const panelAbierto = await page.$('.estacion[data-panel-abierto]');
        if (panelAbierto) nota('a 1280 el panel quedó abierto encima de la sesión');
      },
      despues: async (page) => {
        // Lo escrito se borra (y con eso deja de estar pendiente) y la barra se oculta.
        const linea = await page.$('[data-linea-de-prescripcion] input');
        if (linea) await vaciar(page, linea);
        const ocultar = await page.$('[data-volver-a-la-revision] .boton--enlace');
        if (ocultar) await ocultar.click();
        await asentar(page);
      },
    },
    {
      // C7: cambiar el criterio dice qué se quita y ofrece «Deshacer».
      nombre: '08-cambio-de-criterio',
      llegar: async (page) => {
        const id = await (await visible(page, 'select[id$="-criterio"]')).evaluate((e) => e.id);
        const ahora = await page.$eval(`#${id}`, (e) => e.value);
        await page.select(`#${id}`, ahora === 'RIR' ? 'PERCENT_RM' : 'RIR');
        await asentar(page);
        await visible(page, '[data-cambio-de-criterio]');
        await page.evaluate(() => document.querySelector('[data-criterio-del-ejercicio]')?.scrollIntoView({ block: 'center' }));
        await pausa(300);
      },
      despues: async (page) => {
        const deshacer = await page.$('[data-deshacer-el-criterio]');
        if (deshacer) await deshacer.click();
        await asentar(page);
      },
    },
    {
      // C8: cada valor dice si es común, propio o sin indicar (un valor propio en la carga de la serie 2).
      nombre: '09-de-donde-sale-cada-valor',
      llegar: async (page, nota) => {
        const celda = await visible(page, 'input[id$="-serie-1-carga"]');
        await vaciar(page, celda);
        await page.keyboard.type('130');
        await page.keyboard.press('Tab');
        await asentar(page);
        await page.evaluate(() => document.querySelector('.series-del-editor')?.scrollIntoView({ block: 'center' }));
        await pausa(300);
        const marcas = await page.$$eval('[data-origen-de-la-celda]', (x) => x.map((e) => e.textContent));
        if (!marcas.includes('propio')) nota(`las marcas de las celdas: ${marcas.join(', ') || 'ninguna'}`);
      },
      antesDeCapturar: async (page) => {
        await page.evaluate(() => document.querySelector('.series-del-editor')?.scrollIntoView({ block: 'center' }));
        await pausa(200);
      },
      // Revisión del tramo 2: el rótulo «Común» entra en su columna y no se pisa con «en cada serie».
      verificar: (page) =>
        page.evaluate(() => {
          const problemas = [];
          for (const fila of document.querySelectorAll('[data-fila-general]')) {
            const th = fila.querySelector(':scope > th');
            const texto = [...(th?.childNodes ?? [])].find((n) => n.nodeType === 3 && n.textContent.trim());
            const vecino = fila.querySelector(':scope > td .nota');
            if (!th || !texto || !vecino) continue;
            const r = document.createRange();
            r.selectNodeContents(texto);
            const delRotulo = r.getBoundingClientRect();
            const delVecino = vecino.getBoundingClientRect();
            const borde = th.getBoundingClientRect().right;
            if (delRotulo.right > borde + 0.5) problemas.push(`«${texto.textContent.trim()}» se sale de su columna (${Math.round(delRotulo.right - borde)} px)`);
            if (delRotulo.right > delVecino.left + 0.5 && delRotulo.top < delVecino.bottom && delVecino.top < delRotulo.bottom) problemas.push(`«${texto.textContent.trim()}» se pisa con «${vecino.textContent.trim()}»`);
          }
          return problemas;
        }),
    },
    {
      // C5: los días junto a cada sesión y «Ver próximas fechas» a pedido.
      nombre: '10-proximas-fechas',
      llegar: async (page) => {
        await clic(page, '[data-sesion-de-la-lista="1"] [data-dia="MONDAY"]');
        await clic(page, '[data-sesion-de-la-lista="2"] [data-dia="WEDNESDAY"]');
        await clic(page, '[data-ver-proximas-fechas]');
        await visible(page, '[data-proximas-fechas]');
        await pausa(300);
      },
      // Revisión del tramo 2: la captura quedaba arriba y cortaba «Las próximas dos semanas» antes de las sesiones. Va al
      // calendario, con la semana encima si entra.
      antesDeCapturar: async (page) => {
        await page.evaluate(() => {
          const zona = document.querySelector('#zona-editor');
          const semana = document.querySelector('[data-proximas-fechas] .agenda-del-plan__subtitulo');
          const calendario = document.querySelector('[data-proximas-fechas] .agenda-del-plan__calendario');
          if (!zona || !calendario) return;
          const z = zona.getBoundingClientRect();
          const desde = (semana ?? calendario).getBoundingClientRect().top;
          const hasta = calendario.getBoundingClientRect().bottom;
          // La semana arriba si todo entra; si no, el calendario entero contra el borde de abajo.
          zona.scrollTop += hasta - desde <= z.height - 16 ? desde - z.top - 8 : hasta - z.bottom + 8;
        });
        await pausa(250);
      },
      verificar: (page) =>
        page.evaluate(() => {
          const zona = document.querySelector('#zona-editor')?.getBoundingClientRect();
          const sesiones = [...document.querySelectorAll('[data-proximas-fechas] .agenda-del-plan__calendario .agenda-del-plan__sesion')];
          if (sesiones.length === 0) return ['las próximas dos semanas no muestran ninguna sesión'];
          const aLaVista = sesiones.filter((e) => {
            const r = e.getBoundingClientRect();
            return zona && r.top >= Math.max(zona.top, 0) - 1 && r.bottom <= Math.min(zona.bottom, window.innerHeight) + 1;
          });
          return aLaVista.length > 0 ? [] : [`ninguna de las ${sesiones.length} sesiones del calendario queda a la vista`];
        }),
      despues: async (page) => {
        const cerrar = await page.$('[data-cerrar-agenda]');
        if (cerrar) await cerrar.click();
        await asentar(page);
      },
    },
    {
      // C6: el catálogo con los elegidos a la vista en el pie fijo; crear o importar, en «No encuentro el ejercicio».
      nombre: '11-catalogo-con-elegidos',
      llegar: async (page) => {
        await clic(page, '#agregar-ejercicios-a-la-sesion');
        const campo = await visible(page, '.agregar-item__buscador input[type="search"]');
        await campo.type('sentadilla');
        await page.keyboard.press('Enter');
        await page.waitForSelector('[data-marcar-ejercicio]', { timeout: 20_000 });
        for (const c of (await page.$$('[data-marcar-ejercicio]')).slice(0, 3)) await c.click();
        await asentar(page);
      },
      // Ratificación del 19/11: la lista se mira desde arriba, sin desplazar, como al abrir el catálogo.
      antesDeCapturar: (page) =>
        page.evaluate(() => {
          const cuerpo = document.querySelector('dialog[open] .cajon__cuerpo, .cajon__cuerpo');
          if (cuerpo) cuerpo.scrollTop = 0;
        }),
      // Revisión del tramo 2: el campo «Prescripción para todos» se veía como una línea finita y la tercera ficha quedaba
      // cortada contra el borde, sin que se notara que seguía. Ratificación del 19/11: a 1280 × 800 el pie tapaba la lista
      // (se veía el título del catálogo y no los ejercicios); ahora se ven al menos 3 resultados sin desplazar.
      verificar: (page) =>
        page.evaluate(() => {
          const problemas = [];
          // Los del cajón abierto: otro cajón cerrado en la página mide cero y no cuenta.
          const pie = document.querySelector('dialog[open] .cajon__pie')?.getBoundingClientRect();
          const cuerpo = document.querySelector('dialog[open] .cajon__cuerpo')?.getBoundingClientRect();
          if (pie && cuerpo) {
            const abajo = Math.min(pie.top, cuerpo.bottom);
            const filas = [...document.querySelectorAll('dialog[open] [data-marcar-ejercicio]')].map((c) => (c.closest('tr, li') ?? c).getBoundingClientRect());
            const enteras = filas.filter((r) => r.height > 0 && r.top >= cuerpo.top - 1 && r.bottom <= abajo + 1).length;
            if (window.innerWidth <= 1280 && window.innerHeight <= 800 && enteras < 3) problemas.push(`se ven ${enteras} resultados enteros sin desplazar (hacen falta 3)`);
          }
          // Plegada, «Prescripción para todos» es un renglón; el campo se mide en la escena 11b, abierta.
          const pliegue = document.querySelector('[data-para-todos-pliegue]');
          if (!pliegue) problemas.push('«Prescripción para todos» no está plegada');
          const campo = pliegue?.open ? document.querySelector('[data-para-todos] input') : null;
          const alto = campo?.getBoundingClientRect().height ?? 40;
          if (alto < 36) problemas.push(`el campo de la prescripción para todos mide ${Math.round(alto)} px de alto`);
          // El ejemplo de adentro entra entero.
          if (campo?.placeholder) {
            const estilo = getComputedStyle(campo);
            const lienzo = document.createElement('canvas').getContext('2d');
            lienzo.font = estilo.font;
            const libre = campo.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
            if (lienzo.measureText(campo.placeholder).width > libre + 1) problemas.push(`el ejemplo «${campo.placeholder}» no entra en el campo`);
          }
          const lista = document.querySelector('[data-elegidos] ul');
          if (!lista) return [...problemas, 'no están los elegidos'];
          const l = lista.getBoundingClientRect();
          if (lista.scrollWidth > lista.clientWidth + 1) problemas.push('la lista de elegidos se desplaza de costado');
          for (const b of lista.querySelectorAll('[data-quitar-elegido]')) {
            const r = b.getBoundingClientRect();
            if (r.left < l.left - 1 || r.right > l.right + 1) problemas.push(`«${b.textContent.trim()}» queda cortada a lo ancho`);
            if (r.top < l.bottom - 1 && r.bottom > l.bottom + 1) problemas.push(`«${b.textContent.trim()}» queda cortada a lo alto`);
            // Con tres elegidos (los de la escena) entran todos: ninguno escondido debajo, aunque esté entero.
            else if (r.top >= l.bottom - 1) problemas.push(`«${b.textContent.trim()}» queda escondida debajo de los otros`);
          }
          if (pie && pie.height > window.innerHeight * 0.35) problemas.push(`el pie ocupa ${Math.round(pie.height)} px de ${window.innerHeight}`);
          return problemas;
        }),
    },
    {
      // Ratificación del 19/11: «Prescripción para todos» abierta ocupa su renglón, con el campo a su alto y el ejemplo
      // entero adentro.
      nombre: '11b-prescripcion-para-todos-abierta',
      llegar: async (page) => {
        await clic(page, '[data-para-todos-pliegue] > summary');
        await visible(page, '[data-para-todos] input');
      },
      verificar: (page) =>
        page.evaluate(() => {
          const problemas = [];
          const campo = document.querySelector('[data-para-todos] input');
          const alto = campo?.getBoundingClientRect().height ?? 0;
          if (alto < 36) problemas.push(`el campo de la prescripción para todos mide ${Math.round(alto)} px de alto`);
          if (campo?.placeholder) {
            const estilo = getComputedStyle(campo);
            const lienzo = document.createElement('canvas').getContext('2d');
            lienzo.font = estilo.font;
            const libre = campo.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
            if (lienzo.measureText(campo.placeholder).width > libre + 1) problemas.push(`el ejemplo «${campo.placeholder}» no entra en el campo`);
          }
          return problemas;
        }),
      despues: (page) => clic(page, '[data-para-todos-pliegue] > summary'),
    },
    {
      // C6: sin resultados, «No encuentro el ejercicio» abierto, con crear e importar.
      nombre: '12-catalogo-sin-resultados',
      llegar: async (page) => {
        const campo = await visible(page, '.agregar-item__buscador input[type="search"]');
        await vaciar(page, campo);
        await page.keyboard.type('qxqxqxjw');
        await page.keyboard.press('Enter');
        await visible(page, '[data-sin-resultados]');
        await visible(page, '[data-crear-ejercicio]');
      },
      despues: async (page) => {
        await page.keyboard.press('Escape');
        await pausa(400);
        const cerrar = await page.$$('dialog[open] button');
        for (const b of cerrar) if ((await b.evaluate((e) => e.textContent ?? '')).includes('Cerrar sin guardar')) await b.click();
        await cerrarCuadros(page);
      },
    },
    {
      // C11: una fase nueva, sin sesiones: «Sesiones vacías».
      nombre: '13-sesiones-vacias',
      llegar: async (page) => {
        await ir(page, editor);
        await clic(page, '[data-agregar-bloque]');
        await page.keyboard.press('Enter');
        await asentar(page);
        await visible(page, '[data-sesiones-vacias]');
      },
    },
    {
      // C11: «Armar Sesión A, B y C»: tres sesiones, sin pedir nombre ni propósito, con sus días a mano.
      nombre: '14-sesiones-armadas',
      llegar: async (page) => {
        await clic(page, '[data-armar-sesiones-vacias]');
        await visible(page, '[data-sesion-de-la-lista="3"]');
      },
    },
    {
      // §7: la versión activa agrupa los ejercicios bajo su bloque, como los ve la persona en la APK nueva.
      nombre: '15-version-activa-por-bloque',
      llegar: async (page) => {
        if (!lugar.activada) throw new Error('la versión con bloques no se activó (ver «preparacion» en capturas.json)');
        await ir(page, `/pro/advisees/training?id=${ids.diego}&vista=plan&version=activa&${pedido}`);
        await visible(page, '[data-bloque-del-plan]');
        await page.evaluate(() => document.querySelector('[data-bloque-del-plan]')?.scrollIntoView({ block: 'center' }));
        await pausa(300);
      },
      // ENP-D01, ratificado el 19/11: la fase guardada «Bloque N» se lee «Fase N» en la versión activa.
      verificar: (page) =>
        page.evaluate((viejo) => {
          const texto = document.querySelector('main')?.innerText ?? '';
          const fase = viejo.replace('Bloque', 'Fase');
          return [...(texto.includes(fase) ? [] : [`no dice «${fase}»`]), ...(new RegExp(`${viejo}(?!\\d)`).test(texto) ? [`dice «${viejo}» como nombre de la fase`] : [])];
        }, lugar.nombreViejo),
    },
    {
      // DL-108 D-3, ratificado el 19/11: «Guardar como plantilla» muestra, además de las notas, los nombres (el bloque
      // «Pierna», la sesión), los parámetros y la referencia del %RM, para confirmarlos o vaciarlos uno por uno.
      nombre: '15b-guardar-como-plantilla-con-nombres',
      llegar: async (page) => {
        await clic(page, '.menu-de-acciones__boton', 'Plantillas');
        await clic(page, '.menu-de-acciones__panel button', 'Guardar como plantilla');
        await visible(page, 'dialog[open] [data-lo-que-viaja-a-la-plantilla]');
        await page.evaluate(() => document.querySelector('dialog[open] [data-lo-que-viaja-a-la-plantilla]')?.scrollIntoView({ block: 'center' }));
        await pausa(300);
      },
      verificar: (page) =>
        page.evaluate(() => {
          const lista = document.querySelector('dialog[open] [data-lo-que-viaja-a-la-plantilla]');
          const nombres = [...(lista?.querySelectorAll('li[data-tipo="NOMBRE"]') ?? [])].map((li) => li.textContent ?? '');
          return nombres.some((t) => t.includes('Pierna')) ? [] : ['el bloque «Pierna» no aparece para revisar'];
        }),
      despues: async (page) => {
        await page.keyboard.press('Escape');
        await pausa(300);
        await cerrarCuadros(page);
      },
    },
    // ─── WP-PLANTILLAS-DE-ENTRENAMIENTO (DL-182) ──────────────────────────────────────────────────────────────
    {
      // La colección: «Nueva plantilla», lo que está en preparación (una nueva, sin título) y los cambios junto a su versión.
      nombre: '16-plantillas-en-la-coleccion',
      llegar: async (page, nota) => {
        plantillas.datos = await prepararLasPlantillas(ids, nota);
        await ir(page, '/pro/templates');
        await visible(page, '[data-plantillas-en-preparacion]');
        await visible(page, '[data-cambios-en-preparacion]');
        await page.evaluate(() => document.querySelector('#titulo-plantillas')?.scrollIntoView({ block: 'start' }));
        await pausa(300);
      },
      verificar: (page) =>
        page.evaluate(() => {
          const texto = document.querySelector('main')?.innerText ?? '';
          return [
            ...(texto.includes('Sin título') ? [] : ['no dice «Sin título» en la plantilla nueva']),
            ...(texto.includes('Versión 1 disponible · cambios en preparación') ? [] : ['no dice que la versión 1 sigue disponible con cambios en preparación']),
          ];
        }),
    },
    {
      // «Nueva plantilla»: el editor en blanco, sin pedir nada antes ni a ninguna persona.
      nombre: '17-plantilla-nueva-en-blanco',
      llegar: async (page) => {
        await clic(page, '[data-nueva-plantilla]');
        await page.waitForFunction(() => location.pathname.startsWith('/pro/templates/training'), { timeout: 30_000 });
        await visible(page, '[data-cabecera-de-la-plantilla]');
        await visible(page, '[data-sesiones-vacias]');
      },
      verificar: sinPersonaEnPantalla,
    },
    {
      // El editor de la plantilla: el mismo núcleo que el del plan, con la sesión del bloque en vueltas.
      nombre: '18-editor-de-la-plantilla',
      llegar: async (page) => {
        await ir(page, `/pro/templates/training?preparacion=${plantillas.datos.cambios}&${pedido}`);
        await visible(page, '.bloque-del-editor');
        await clic(page, '.bloque-del-editor [id^="abrir-ejercicio-"]');
        await page.waitForSelector('[data-estado-de-la-revision="lista"], [data-estado-de-la-revision="fallo"]', { timeout: 30_000 }).catch(() => {});
        await asentar(page);
        // El bloque, arriba del centro (que se desplaza solo); la página, arriba: la cabecera de la plantilla a la vista.
        await page.evaluate(() => {
          document.querySelector('.bloque-del-editor')?.scrollIntoView({ block: 'start' });
          window.scrollTo(0, 0);
        });
        await pausa(300);
      },
      verificar: async (page) => [
        ...(await sinPersonaEnPantalla(page)),
        ...((await page.$('[data-sin-dias-en-la-plantilla]')) ? [] : ['no dice que una plantilla no tiene días']),
        // Nada escrito para Diego llega a la plantilla: ni el propósito de su fase ni sus notas (D-3 de DL-108).
        ...(await page.evaluate((notas) => {
          const texto = document.querySelector('main')?.innerText ?? '';
          const valores = [...document.querySelectorAll('main input, main textarea')].map((x) => x.value).join(' ');
          return notas.filter((n) => texto.includes(n) || valores.includes(n)).map((n) => `aparece una nota del plan de Diego: «${n}»`);
        }, plantillas.notasDeDiego)),
      ],
    },
    {
      // «Antes de guardar»: lo que impide, lo que queda para completar al usarla, lo que cambia frente a la versión 1.
      nombre: '19-antes-de-guardar-la-plantilla',
      llegar: async (page) => {
        await clic(page, '[data-revisar-y-guardar]');
        await visible(page, '[data-antes-de-guardar-la-plantilla]');
        await visible(page, '[data-lo-que-cambia] [data-contadores]');
        await page.waitForFunction(() => {
          const b = [...document.querySelectorAll('dialog[open] button')].find((x) => x.textContent.includes('Guardar nueva versión'));
          return b && !b.disabled && b.getAttribute('aria-disabled') !== 'true';
        }, { timeout: 30_000 });
      },
    },
    {
      // Guardada la versión 2: el detalle en la colección, agrupado por bloque y con sus versiones.
      nombre: '20-detalle-con-versiones',
      llegar: async (page) => {
        await clic(page, 'dialog[open] button', 'Guardar nueva versión');
        await page.waitForFunction(() => location.pathname === '/pro/templates', { timeout: 30_000 });
        await visible(page, '[data-version-de-la-plantilla="2"]');
        await page.evaluate(() => document.querySelector('[data-versiones-de-la-plantilla]')?.scrollIntoView({ block: 'center' }));
        await pausa(300);
      },
      verificar: (page) =>
        page.evaluate(() => {
          const v1 = document.querySelector('[data-version-de-la-plantilla="1"]')?.textContent ?? '';
          const bloque = document.querySelector('[data-bloque-de-la-plantilla]');
          return [...(v1.includes('se usó en 1 plan') ? [] : [`la versión 1 dice «${v1}»`]), ...(bloque ? [] : ['el detalle no agrupa por bloque'])];
        }),
    },
    {
      // El plan de Diego, creado desde la versión 1: dice «versión 1», aunque la vigente de la plantilla sea la 2.
      nombre: '21-plan-desde-la-plantilla',
      llegar: async (page) => {
        await ir(page, `/pro/advisees/training?id=${ids.diego}&vista=plan`);
        await visible(page, '[data-nota-de-origen]');
        await page.evaluate(() => document.querySelector('[data-nota-de-origen]')?.scrollIntoView({ block: 'center' }));
        await pausa(300);
      },
      verificar: (page) =>
        page.evaluate(() => {
          const t = document.querySelector('[data-nota-de-origen]')?.textContent ?? '';
          return /versión 1\./.test(t) ? [] : [`la nota de origen dice «${t}»`];
        }),
    },
  ];
}

/** Lo que arma la escena 16 para las que siguen. */
const plantillas = { datos: null, notasDeDiego: [] };

/** Lo que conviene anotar de cada captura: desbordes a lo ancho, el alto de la página y si algún menú queda cortado. */
const medir = (page) =>
  page.evaluate(() => {
    const ancho = document.documentElement.clientWidth;
    const desbordan = [...document.querySelectorAll('body *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.right > ancho + 1 && getComputedStyle(e).position !== 'fixed';
      })
      .slice(0, 6)
      .map((e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? `.${e.className.trim().split(/\s+/).join('.')}` : ''}`);
    // ENP-D11: el panel de un menú abierto tiene que estar entero dentro de la ventana.
    const menu = [...document.querySelectorAll('.menu-de-acciones__panel:not([hidden])')].map((m) => {
      const r = m.getBoundingClientRect();
      return { entero: r.left >= 0 && r.top >= 0 && r.right <= window.innerWidth && r.bottom <= window.innerHeight, x: Math.round(r.left), y: Math.round(r.top), ancho: Math.round(r.width), alto: Math.round(r.height) };
    });
    // ENP-D14: la tabla de series no se desplaza adentro.
    const tablas = [...document.querySelectorAll('.series-del-editor')].map((t) => ({ desplaza: t.scrollWidth - t.clientWidth, contenedor: (t.parentElement?.scrollWidth ?? 0) - (t.parentElement?.clientWidth ?? 0) }));
    return {
      desbordeHorizontal: document.documentElement.scrollWidth - ancho,
      desbordan,
      alto: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
      menu,
      tablas,
      revision: document.querySelector('[data-estado-de-la-revision]')?.textContent?.trim() ?? null,
    };
  });

async function capturarTodo() {
  const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
  const ids = { diego: estado.personas?.diego?.aseId };
  if (!ids.diego) throw new Error('La cohorte no dejó a Diego Sosa en estado.json.');
  const notasDeLaPreparacion = [];
  const lugar = await prepararLosBloques(ids, (t) => notasDeLaPreparacion.push(t));
  console.log(`preparación: ${notasDeLaPreparacion.join(' · ')}`);
  const resultado = { hoy: estado.hoy, commit: process.env.GITHUB_SHA ?? null, preparacion: notasDeLaPreparacion, pantallas: [], errores: [] };
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR', '--force-color-profile=srgb'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
  try {
    const contexto = await navegador.createBrowserContext();
    const page = await contexto.newPage();
    await page.emulateTimezone('America/Argentina/Buenos_Aires');
    page.on('pageerror', (e) => resultado.errores.push(String(e).slice(0, 300)));
    await entrar(page, 'PRO_T');
    for (const p of pantallas(ids, lugar)) {
      const fila = { pantalla: p.nombre, ok: true, notas: [], medidas: {} };
      const problemas = [];
      const nota = (t) => fila.notas.push(t);
      try {
        const [anchoInicial, altoInicial] = p.vistaInicial ?? [1440, 900];
        await page.setViewport({ width: anchoInicial, height: altoInicial, deviceScaleFactor: 1 });
        await pausa(400);
        await p.llegar(page, nota);
        for (const tema of TEMAS) {
          await ponerTema(page, tema);
          for (const [ancho, alto] of TAMANOS) {
            await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
            await pausa(700);
            // Revisión del tramo 2: una escena puede acomodar lo que se ve en cada tamaño (el desplazamiento cambia al
            // cambiar la ventana) y verificar lo que tiene que verse; lo que no cumple hace fallar el paso, con las
            // capturas igual tomadas.
            if (p.antesDeCapturar) await p.antesDeCapturar(page);
            await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}.png`) });
            fila.medidas[`${tema}-${ancho}`] = await medir(page);
            if (p.verificar) problemas.push(...(await p.verificar(page)).map((x) => `${tema} ${ancho}: ${x}`));
          }
        }
        if (problemas.length > 0) throw new Error(`no cumple lo que tiene que verse: ${problemas.slice(0, 6).join(' · ')}`);
      } catch (e) {
        fila.ok = false;
        fila.error = String(e?.message ?? e).slice(0, 500);
        await page.screenshot({ path: path.join(salida, `${p.nombre}-FALLO.png`) }).catch(() => {});
      }
      if (p.despues) await p.despues(page).catch(() => {});
      resultado.pantallas.push(fila);
      console.log(`${p.nombre}: ${fila.ok ? 'bien' : `FALLÓ (${fila.error})`}${fila.notas.length ? ` · ${fila.notas.join(' · ')}` : ''}`);
    }
    await contexto.close();
  } finally {
    fs.writeFileSync(path.join(salida, 'capturas.json'), `${JSON.stringify(resultado, null, 2)}\n`);
    await navegador.close();
  }
  return resultado;
}

// ─── La corrida ─────────────────────────────────────────────────────────────────────────────────────────────────

console.log('migraciones…');
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'deploy'], {
  cwd: REPO,
  env: { ...process.env, DATABASE_URL: BASE },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
let api = await arrancarApi();
let web = null;
try {
  console.log('la cohorte: profesionales…');
  cohorte('profesionales');
  const demo = /BE_DEMO_PROFESIONALES=(.*)/.exec(fs.readFileSync(path.join(TRABAJO, 'demo-profesionales.txt'), 'utf8'))[1].trim();
  await parar(api);
  api = await arrancarApi(demo);
  console.log('la cohorte: ejercicios y personas…');
  cohorte('ejercicios');
  cohorte('personas');
  cohorte('resumen');
  web = spawn(process.execPath, [path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/servir-web.mjs'), path.join(REPO, 'apps/web/out'), '3000', API], {
    stdio: 'inherit',
  });
  await pausa(1500);
  const r = await capturarTodo();
  const fallas = r.pantallas.filter((p) => !p.ok);
  console.log(`${r.pantallas.length - fallas.length} de ${r.pantallas.length} pantallas capturadas; errores de la página: ${r.errores.length ? r.errores.slice(0, 8).join(' | ') : 'ninguno'}`);
  if (fallas.length) process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(salida, 'api.log'), registroDeLaApi.join(''));
  web?.kill();
  await parar(api);
}
