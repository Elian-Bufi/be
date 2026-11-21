// Las capturas de WP-EVALUACION-Y-FORMULARIOS (DL-185): los formularios que la persona respondió, vinculados a la
// evaluación inicial, en la CI: esta PC no levanta la API, el website y PostgreSQL juntos. Corre en el trabajo
// «Evaluación y formularios» de `capturas-de-la-planificacion` (.github/workflows/capturas-de-la-planificacion.yml) y deja
// las imágenes como artefacto. Solo datos sintéticos: la cohorte (08 §33) y, encima, dos vínculos nuevos para que haya
// alguien sin plan en cada área: Lic. Sofía Paz con Camila Ortiz en Nutrición (Camila responde «Cómo comés hoy» y «Tus
// hábitos») y Prof. Martín Acosta con Héctor Funes en Entrenamiento (Héctor responde «Antes de entrenar»).
//
// Uso:  BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_cohorte node capturas.mjs <salida>
//   Requiere compilados la API (`npm run build:api`) y el website contra la API local
//   (`BE_API_BASE_URL=http://localhost:3001 npm run build:web`). CHROME apunta al navegador.
//
// Qué captura, en Claro y en Azul noche, a 1920 × 950, 1440 × 900 y 1280 × 800: en «Empezar el plan» de las dos áreas,
// el paso «Evaluación inicial» con los formularios para vincular (uno elegido y sus respuestas abiertas), la evaluación
// registrada con lo vinculado, las respuestas de la versión vinculada, el aviso de una versión más nueva después de que la
// persona corrige, y «Vincular un formulario».
// Cada pantalla es un paso: si uno falla, queda anotado en `capturas.json` con una captura del momento y se sigue.
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

const salida = path.resolve(process.argv[2] ?? 'capturas-de-la-evaluacion');
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CHROME = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
// Lo que pidió Dirección para esta entrega: 1920, 1440 y 1280 (su pantalla es de 1920 × 1080).
const TAMANOS = [
  [1920, 950],
  [1440, 900],
  [1280, 800],
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

// ─── Lo que la evaluación necesita, encima de la cohorte ─────────────────────────────────────────────────────────────

const { clienteDe, dominio } = await import(pathToFileURL(path.join(COHORTE, 'api.mjs')).href);
const cliente = clienteDe(API);
const F3 = dominio.CAPACIDAD_FORMULARIOS_FORMATO_3;

/** La versión vigente de una plantilla de inicio, por su clave, y sus campos (API-FRM-01 y API-FRI-01). */
async function plantilla(token, clave) {
  const lista = await cliente.pedir('GET', '/form-templates?limit=50', { token, capacidades: F3 });
  const p = lista.data.find((x) => x.key === clave);
  if (!p) throw new Error(`No está la plantilla ${clave}`);
  const v = await cliente.pedir('GET', `/form-templates/${p.templateId}/versions/${p.latestVersionId}/definition`, { token, capacidades: F3 });
  return { versionId: p.latestVersionId, campos: v.data.sections.flatMap((s) => s.fields.map((f) => f.fieldCode)) };
}

/** El profesional pide el formulario entero y la persona lo responde (API-FRM-03 y API-FRI-04). */
async function pedirYResponder(pro, ase, aseId, clave, alcance, respuestas) {
  const { versionId, campos } = await plantilla(pro, clave);
  const s = await cliente.pedir('POST', `/advisees/${aseId}/form-requests`, {
    token: pro,
    capacidades: F3,
    cuerpo: { templateVersionId: versionId, purpose: 'Para planificar con tu contexto', scope: alcance, requestedFieldCodes: campos, requiredFieldCodes: [] },
  });
  await cliente.pedir('POST', `/me/form-requests/${s.data.formRequestId}/answers`, {
    token: ase,
    superficie: 'APK',
    capacidades: F3,
    cuerpo: { answers: respuestas.filter((r) => campos.includes(r.fieldCode)), fromProposal: null },
  });
}

const op = (option) => ({ type: 'CHOICE', option, otherText: null });
const varias = (...options) => ({ type: 'MULTI_CHOICE', options, otherText: null });
const si = { type: 'BOOLEAN', yes: true };
const no = { type: 'BOOLEAN', yes: false };
const texto = (text) => ({ type: 'TEXT', text });
const numero = (number, unit) => ({ type: 'NUMBER', number, unit });
const DIAS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

/** «Antes de entrenar» (el de Diego Sosa en las capturas del contexto): una molestia en la rodilla, medicación y tres días. */
const ANTES_DE_ENTRENAR = [
  ...['trn_salud_dolor_de_pecho', 'trn_salud_mareos', 'trn_salud_cronica', 'trn_salud_huesos', 'trn_salud_supervision'].map((c) => ({ fieldCode: c, answer: no })),
  { fieldCode: 'trn_salud_corazon', answer: si },
  { fieldCode: 'medicacion_relevante', answer: si },
  { fieldCode: 'trn_medicacion_cual', answer: texto('Enalapril 10 mg, a la mañana') },
  { fieldCode: 'trn_apto_medico', answer: op('si') },
  { fieldCode: 'fuma', answer: no },
  { fieldCode: 'dolor_o_lesiones', answer: si },
  { fieldCode: 'trn_zonas', answer: varias('rodillas') },
  { fieldCode: 'trn_dolor_cuando', answer: op('al_esforzarme') },
  { fieldCode: 'trn_movimientos_que_molestan', answer: texto('Bajar escaleras y la sentadilla profunda') },
  { fieldCode: 'trn_dolor_tratamiento', answer: op('con_alta') },
  { fieldCode: 'trn_cirugias', answer: no },
  { fieldCode: 'trn_experiencia', answer: texto('Fútbol 5 los sábados; gimnasio hace dos años, seis meses') },
  { fieldCode: 'trn_experiencia_en_fuerza', answer: op('deje') },
  { fieldCode: 'trn_rir', answer: op('lo_escuche') },
  { fieldCode: 'trn_objetivo_principal', answer: op('ganar_fuerza') },
  { fieldCode: 'trn_objetivo_declarado', answer: texto('Subir las escaleras del trabajo sin que me moleste la rodilla') },
  { fieldCode: 'trn_dias_y_horario', answer: { type: 'MATRIX', cells: DIAS.map((d) => ({ row: d, column: ['lun', 'mie', 'vie'].includes(d) ? 'manana' : 'no_puedo' })) } },
  { fieldCode: 'trn_dias_por_semana', answer: numero(3, 'días por semana') },
  { fieldCode: 'trn_minutos_por_sesion', answer: numero(50, 'min') },
  { fieldCode: 'trn_lugar_y_equipamiento', answer: op('gimnasio_completo') },
  { fieldCode: 'trn_preferencias', answer: texto('Me gustan las máquinas; prefiero evitar correr') },
];

/** «Cómo comés hoy» (el de Diego Sosa en las capturas del contexto): alergia al maní, vianda y el asado del domingo. */
const COMO_COMES_HOY = [
  { fieldCode: 'nut_jornada', answer: op('fuera_horario_fijo') },
  { fieldCode: 'nut_comida_en_jornada', answer: varias('llevo_vianda') },
  { fieldCode: 'nut_quien_cocina', answer: op('compartido') },
  { fieldCode: 'nut_tiempo_para_cocinar', answer: op('15_a_30') },
  { fieldCode: 'nut_presupuesto', answer: op('a_veces') },
  { fieldCode: 'nut_momentos', answer: varias('desayuno', 'almuerzo', 'merienda', 'cena') },
  {
    fieldCode: 'nut_comidas_habituales',
    answer: {
      type: 'LIST',
      items: [
        { momento: 'desayuno', que: 'Café con leche y dos tostadas con queso', veces: 'todos_los_dias', porcion: '1 taza y 2 tostadas', preparacion: 'comprado_hecho', gusto: 'me_encanta' },
        { momento: 'almuerzo', que: 'Milanesa al horno con ensalada', veces: '2_o_3', porcion: '1 plato playo', preparacion: 'al_horno', gusto: 'me_encanta' },
        { momento: 'cena', que: 'Fideos con tuco', veces: '2_o_3', porcion: '1 plato hondo', preparacion: 'hervido_o_vapor', gusto: 'por_costumbre' },
      ],
    },
  },
  { fieldCode: 'nut_fin_de_semana', answer: op('bastante') },
  { fieldCode: 'nut_fin_de_semana_que_cambia', answer: texto('Asado el domingo con la familia') },
  { fieldCode: 'nut_afuera', answer: op('1_o_2') },
  { fieldCode: 'nut_alimentos_si', answer: { type: 'FOODS', foods: [{ name: 'Pollo', reason: null }, { name: 'Banana', reason: null }, { name: 'Arroz', reason: null }] } },
  { fieldCode: 'nut_alergias', answer: si },
  { fieldCode: 'nut_alergias_cuales', answer: texto('Maní: se me hinchan los labios') },
  { fieldCode: 'nut_intolerancias', answer: varias('ninguna') },
  { fieldCode: 'nut_estilo', answer: op('de_todo') },
  { fieldCode: 'nut_agua', answer: op('2_a_4') },
  { fieldCode: 'nut_mate', answer: op('amargo') },
  { fieldCode: 'nut_cafe_te', answer: op('1_o_2') },
  { fieldCode: 'nut_gaseosas', answer: op('a_veces_comunes') },
  { fieldCode: 'condiciones_declaradas', answer: varias('presion_alta') },
  { fieldCode: 'nut_condiciones_indicacion', answer: op('me_la_dijo') },
  { fieldCode: 'medicacion_relevante', answer: si },
  { fieldCode: 'nut_medicacion_cual', answer: texto('Enalapril 10 mg') },
  { fieldCode: 'nut_objetivo', answer: varias('mas_energia', 'acompanar_entrenamiento') },
  { fieldCode: 'nut_no_negociable', answer: texto('El asado del domingo') },
  { fieldCode: 'nut_ritmo_de_cambio', answer: op('de_a_uno') },
];

/** El vínculo completo por la API, como lo arma la persona: el profesional lo pide, ella lo acepta y da el B2. */
async function vincular(pro, ase, aseId, alcance) {
  const solicitud = await cliente.pedir('POST', '/relationship-requests', { token: pro, cuerpo: { target: { type: 'ADVISEE', identityId: aseId }, scope: { code: alcance }, purpose: dominio.FINALIDAD_DE_ALCANCE[alcance] } });
  const aceptada = await cliente.pedir('POST', `/relationship-requests/${solicitud.data.relationshipRequestId}/accept`, { token: ase, superficie: 'APK', cuerpo: { expectedVersion: solicitud.data.version ?? 'v1' } });
  const vinculoId = aceptada.data.relationshipId;
  const requisitos = await cliente.pedir('GET', `/relationships/${vinculoId}/consent-requirements`, { token: ase, superficie: 'APK' });
  await cliente.pedir('POST', `/relationships/${vinculoId}/consents`, { token: ase, superficie: 'APK', cuerpo: { consentVersionId: requisitos.data.consentVersion.id } });
}

/** «Tus hábitos» de Camila: lo justo para que haya un segundo formulario que vincular. */
const TUS_HABITOS = [
  { fieldCode: 'horas_de_sueno', answer: numero(7, 'h') },
  { fieldCode: 'habitos_hace_deporte', answer: no },
];

const sesiones = {};
async function prepararLaEvaluacion(ids) {
  const c = cuentas();
  const sesion = (prefijo, superficie = 'WEB') => cliente.sesion(c[`${prefijo}_CORREO`], c[`${prefijo}_CLAVE`], superficie);
  const martin = await sesion('PRO_T');
  const sofia = await sesion('PRO_N');
  sesiones.sofia = sofia;
  sesiones.camila = await sesion('ASE_CAMILA', 'APK');
  sesiones.hector = await sesion('ASE_HECTOR', 'APK');
  const pasos = [
    ['Lic. Sofía Paz con Camila Ortiz, en Nutrición', () => vincular(sofia, sesiones.camila, ids.camila, 'NUTRICION')],
    ['«Cómo comés hoy» de Camila Ortiz', () => pedirYResponder(sofia, sesiones.camila, ids.camila, 'FRM-NUTRICION-INICIO', 'NUTRICION', COMO_COMES_HOY)],
    ['«Tus hábitos» de Camila Ortiz', () => pedirYResponder(sofia, sesiones.camila, ids.camila, 'FRM-HABITOS', 'NUTRICION', TUS_HABITOS)],
    ['Prof. Martín Acosta con Héctor Funes, en Entrenamiento', () => vincular(martin, sesiones.hector, ids.hector, 'ENTRENAMIENTO')],
    ['«Antes de entrenar» de Héctor Funes', () => pedirYResponder(martin, sesiones.hector, ids.hector, 'FRM-ENTRENAMIENTO', 'ENTRENAMIENTO', ANTES_DE_ENTRENAR)],
  ];
  for (const [que, hacer] of pasos) {
    try {
      await hacer();
      console.log(`preparación: ${que}, listo`);
    } catch (e) {
      console.log(`preparación: ${que} no se pudo (${String(e?.message ?? e).slice(0, 300)}); las capturas siguen`);
    }
  }
}

/** La persona corrige su respuesta desde la APK (API-FRI-05): una versión más nueva, después de vincular. */
async function corregir(token, formResponseId, clave, respuestas, cambio) {
  // Las mismas preguntas que se pidieron (todas las de la versión), con una cambiada.
  const { campos } = await plantilla(sesiones.sofia, clave);
  await cliente.pedir('POST', `/me/form-responses/${formResponseId}/corrections`, {
    token,
    superficie: 'APK',
    capacidades: F3,
    cuerpo: { expectedVersion: 'v1', reason: 'Me olvidé de algo.', answers: respuestas.filter((r) => campos.includes(r.fieldCode)).map((r) => (r.fieldCode === cambio.fieldCode ? cambio : r)) },
  });
}

// ─── Las pantallas ──────────────────────────────────────────────────────────────────────────────────────────────

/** Abre «Registrar la evaluación» en «Empezar el plan» y espera los formularios para vincular. */
async function abrirLaEvaluacion(page, ruta) {
  await ir(page, ruta);
  await clic(page, '[data-paso-evaluacion]');
  await visible(page, '[data-elegir-formularios] [data-formulario-para-vincular]');
}

/**
 * WP-EVALUACION-INICIAL-2 (DL-189): en Nutrición la evaluación se abre sola en su paso, en tres bloques; lo que muestra
 * «Lo que contó» se vincula al registrar, sin casillas. Espera el formulario respondido y abre «Ver todo».
 */
async function abrirLaEvaluacionDeNutricion(page, ruta, nombre) {
  await ir(page, ruta);
  const fila = await visible(page, '[data-evaluacion-inicial] [data-lo-que-conto] [data-formulario-respondido]', nombre, 45_000);
  await (await fila.$('button')).click();
  await asentar(page);
  await (await visible(page, '[data-evaluacion-inicial]')).evaluate((x) => x.scrollIntoView({ block: 'start' }));
  await pausa(300);
}

/**
 * DL-189 (RP-10, EI-D16): con la evaluación registrada, el paso que toca es el objetivo y solo ese queda abierto; la
 * evaluación, con sus formularios vinculados, se abre tocando «Evaluación inicial» en la franja.
 */
async function abrirLaEtapaDeLaEvaluacion(page) {
  const boton = await visible(page, '[data-franja-de-pasos] [data-etapa="evaluacion"] button', null, 45_000);
  if ((await boton.evaluate((x) => x.getAttribute('aria-expanded'))) !== 'true') await boton.click();
  await asentar(page);
}

/** Nutrición (DL-189): elige el sexo en «Lo que necesita el cálculo» (no viene de ningún lado) y registra. */
async function registrarLaDeNutricion(page) {
  await clic(page, '[data-cambiar-dato="sexo"]');
  await page.select('[data-dato-del-calculo="sexo"] select', 'FEMALE');
  await clic(page, '[data-listo-dato="sexo"]');
  await clic(page, 'form[data-evaluacion-inicial] button[type="submit"]', 'Registrar la evaluación');
  await visible(page, '[data-franja-de-pasos] [data-etapa="evaluacion"][data-estado="listo"]', null, 45_000);
  await abrirLaEtapaDeLaEvaluacion(page);
  await visible(page, '[data-formularios-de-la-evaluacion] [data-formulario-vinculado]', null, 45_000);
  await (await visible(page, '[data-formularios-de-la-evaluacion]')).evaluate((x) => x.scrollIntoView({ block: 'center' }));
  await pausa(300);
}

/** Elige el formulario con ese nombre, abre sus respuestas y deja la lista a la vista. */
async function elegir(page, nombre) {
  const fila = await visible(page, '[data-elegir-formularios] [data-formulario-para-vincular]', nombre);
  const casilla = await fila.$('input[type="checkbox"]');
  if (!(await casilla.evaluate((x) => x.checked))) await casilla.click();
  await (await fila.$('button')).click();
  await asentar(page);
  await (await visible(page, '[data-elegir-formularios]')).evaluate((x) => x.scrollIntoView({ block: 'start' }));
  await pausa(300);
}

/** Escribe un dato y registra: el paso queda «Listo» y debajo, lo vinculado. */
async function registrar(page, prefijo) {
  const concepto = await visible(page, `#${prefijo}dato-0-concepto`);
  await concepto.type('Comidas por día');
  await (await visible(page, `#${prefijo}dato-0-valor`)).type('4');
  await clic(page, 'form.formulario button[type="submit"]', 'Registrar evaluación');
  await visible(page, '[data-franja-de-pasos] [data-etapa="evaluacion"][data-estado="listo"]', null, 45_000);
  await abrirLaEtapaDeLaEvaluacion(page);
  await visible(page, '[data-formularios-de-la-evaluacion] [data-formulario-vinculado]', null, 45_000);
  await (await visible(page, '[data-formularios-de-la-evaluacion]')).evaluate((x) => x.scrollIntoView({ block: 'center' }));
  await pausa(300);
}

const aLaVista = async (page, selector) => {
  await (await visible(page, selector)).evaluate((x) => x.scrollIntoView({ block: 'center' }));
  await pausa(300);
};

function pantallas(ids) {
  const area = (que, persona) => `/pro/advisees/${que}?id=${persona}&vista=plan`;
  return {
    PRO_N: [
      {
        nombre: '01-nutricion-evaluacion-inicial-tres-bloques',
        llegar: (page) => abrirLaEvaluacionDeNutricion(page, area('nutrition', ids.camila), 'Cómo comés hoy'),
      },
      {
        nombre: '02-nutricion-evaluacion-registrada-con-lo-vinculado',
        llegar: (page) => registrarLaDeNutricion(page),
        reponer: (page) => aLaVista(page, '[data-formularios-de-la-evaluacion]'),
      },
      {
        nombre: '03-nutricion-respuestas-de-la-version-vinculada',
        llegar: async (page) => {
          await clic(page, '[data-formulario-vinculado] button', 'Ver respuestas');
          await visible(page, '[data-formulario-vinculado] .formularios-de-la-evaluacion__respuestas');
          await aLaVista(page, '[data-formulario-vinculado]');
        },
        reponer: (page) => aLaVista(page, '[data-formulario-vinculado]'),
      },
      {
        nombre: '04-nutricion-version-mas-nueva',
        llegar: async (page, nota) => {
          // DL-189 (EI-D05): se vinculan todos los que mostró «Lo que contó» («Tus hábitos» también): se corrige el de «Cómo comés hoy».
          const formResponseId = await page.$$eval('[data-formulario-vinculado]', (xs) => (xs.find((x) => x.textContent.includes('Cómo comés hoy')) ?? xs[0]).getAttribute('data-formulario-vinculado'));
          await corregir(sesiones.camila, formResponseId, 'FRM-NUTRICION-INICIO', COMO_COMES_HOY, { fieldCode: 'nut_no_negociable', answer: texto('El asado del domingo y el helado del sábado') });
          nota('Camila Ortiz corrigió «Cómo comés hoy» después de vincularlo');
          // Ir a otra vista y volver: el plan se monta de nuevo y vuelve a leer lo vinculado (empujar la misma ruta no remonta).
          await ir(page, `/pro/advisees/nutrition?id=${ids.camila}&vista=resumen`);
          await ir(page, area('nutrition', ids.camila));
          await abrirLaEtapaDeLaEvaluacion(page);
          await visible(page, '[data-version-mas-nueva]', null, 45_000);
          await aLaVista(page, '[data-formularios-de-la-evaluacion]');
        },
        reponer: (page) => aLaVista(page, '[data-formularios-de-la-evaluacion]'),
      },
      {
        nombre: '05-nutricion-vincular-otro',
        llegar: async (page, nota) => {
          await clic(page, '[data-vincular-otro]');
          await visible(page, '[data-vincular-formularios]');
          const otro = await page.$('[data-vincular-formularios] [data-formulario-para-vincular] input[type="checkbox"]');
          if (otro) await otro.click();
          else nota('no había otro formulario para vincular');
          await aLaVista(page, '[data-vincular-formularios]');
        },
        reponer: (page) => aLaVista(page, '[data-vincular-formularios]'),
      },
    ],
    PRO_T: [
      {
        nombre: '06-entrenamiento-evaluacion-inicial-elegir',
        llegar: async (page) => {
          await abrirLaEvaluacion(page, area('training', ids.hector));
          await elegir(page, 'Antes de entrenar');
        },
      },
      {
        nombre: '07-entrenamiento-evaluacion-registrada-con-lo-vinculado',
        llegar: (page) => registrar(page, 'trn-'),
        reponer: (page) => aLaVista(page, '[data-formularios-de-la-evaluacion]'),
      },
    ],
  };
}

/** Lo que conviene anotar de cada captura para la revisión: desbordes a lo ancho y el alto de la página. */
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
    return {
      desbordeHorizontal: document.documentElement.scrollWidth - ancho,
      desbordan,
      alto: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
      vinculados: document.querySelectorAll('[data-formulario-vinculado]').length,
      paraVincular: document.querySelectorAll('[data-formulario-para-vincular]').length,
      // Lo que no puede decir la pantalla (B05 y el pedido de Dirección).
      prohibidas: (document.body.innerText.match(/\b(asesorad[oa]s?|cumplimiento|adherencia|racha|puntaje)\b/gi) ?? []).length,
    };
  });

async function capturarTodo() {
  const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
  const ids = {};
  for (const clave of ['camila', 'hector']) {
    ids[clave] = estado.personas?.[clave]?.aseId;
    if (!ids[clave]) throw new Error(`La cohorte no dejó a ${clave} en estado.json.`);
  }
  await prepararLaEvaluacion(ids);
  const resultado = { hoy: estado.hoy, commit: process.env.GITHUB_SHA ?? null, pantallas: [], errores: [] };
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR', '--force-color-profile=srgb'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
  });
  try {
    for (const [prefijo, lista] of Object.entries(pantallas(ids))) {
      const contexto = await navegador.createBrowserContext();
      const page = await contexto.newPage();
      await page.emulateTimezone('America/Argentina/Buenos_Aires');
      page.on('pageerror', (e) => resultado.errores.push(`${prefijo}: ${String(e).slice(0, 300)}`));
      await entrar(page, prefijo);
      for (const p of lista) {
        const fila = { pantalla: p.nombre, profesional: prefijo, ok: true, notas: [], medidas: {} };
        const nota = (t) => fila.notas.push(t);
        try {
          await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
          const extra = await p.llegar(page, nota);
          if (extra) fila.extra = extra;
          for (const tema of TEMAS) {
            await ponerTema(page, tema);
            for (const [ancho, alto] of TAMANOS) {
              await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
              await pausa(700);
              if (p.reponer) await p.reponer(page);
              await page.screenshot({ path: path.join(salida, `${p.nombre}-${tema}-${ancho}.png`) });
              fila.medidas[`${tema}-${ancho}`] = await medir(page);
            }
          }
        } catch (e) {
          fila.ok = false;
          fila.error = String(e?.message ?? e).slice(0, 500);
          await page.screenshot({ path: path.join(salida, `${p.nombre}-FALLO.png`) }).catch(() => {});
        }
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
        resultado.pantallas.push(fila);
        console.log(`${prefijo} · ${p.nombre}: ${fila.ok ? 'bien' : `FALLÓ (${fila.error})`}${fila.notas.length ? ` · ${fila.notas.join(' · ')}` : ''}`);
      }
      await contexto.close();
    }
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
