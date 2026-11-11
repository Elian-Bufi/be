// Las capturas de WP-TABLERO-ALTA-GAMA (TB-00 y la recaptura de cada parte, §8.1), en la CI: esta PC no levanta la API,
// el website y PostgreSQL juntos. Corre en el trabajo `capturas-del-tablero` (.github/workflows/capturas-del-tablero.yml)
// y deja las imágenes y las mediciones como artefacto. Solo datos sintéticos: la cohorte (08 §33).
//
// Uso:  BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:5432/be_test_cohorte node capturas.mjs <salida> [modo]
//   El modo es `tablero` (lo que sigue) o `flujos-de-planificacion`: la misma preparación y, en lugar de estas capturas,
//   el recorrido de flujos-de-planificacion.mjs (cómo un profesional crea y ajusta sus planes, paso a paso).
//   Requiere compilados la API (`npm run build:api`) y el website contra la API local
//   (`BE_API_BASE_URL=http://localhost:3001 npm run build:web`). CHROME apunta al navegador.
//
// Pasos: migraciones → API → los profesionales de la cohorte → API de nuevo, con su habilitación (DL-036) → sus
// ejercicios y las seis personas → website con la CSP de render.yaml → capturas → mediciones.json.
//
// Qué captura, en Claro y en Azul noche, a 1280 × 800, a 1440 × 900 y a 1920 × 950 (el área útil de un monitor de
// 1920 × 1080):
// la primera pantalla y la página entera del Espacio profesional, el Resumen de la ficha, «Analizar», Nutrición y
// Antropometría de Diego Sosa vistos por Sofía Paz, y el Espacio, el Resumen y Entrenamiento vistos por Martín Acosta.
// Cuenta las peticiones a la API al abrir cada página (TEST-TAG-032): la cuenta queda en mediciones.json.
// Desde TB-05, con «Ocultar nombres» prendido recorre el Espacio y el Resumen de cada profesional (TEST-TAG-004): si
// aparece el nombre de alguien de la cohorte, una inicial o un nombre en el título de la pestaña, la corrida falla.
// Desde TB-10, en cada Resumen anota en `primeraPantalla` dónde terminan las tarjetas, los valores de los indicadores y
// sus minigráficos, y el alto de la tarjeta más alta (A13 de la propuesta).
// Desde TB-24, la composición corporal de Diego en la pestaña y en la pregunta de «Analizar», el Resumen de Héctor (sin
// pliegues: la línea de los pesos) y, en `composicion`, cuántas columnas van partidas y qué dice la barra de la tarjeta.
// Desde TB-15, la revisión nueva de Nutrición de Diego, con «¿Cuándo la revisás?» sin nada elegido.
// Desde TB-50 y TB-51, en cada Resumen con la tarjeta de Antropometría, abre sus piezas plegadas (la composición de la
// última toma y la evolución de las últimas tomas), guarda la tarjeta sola (`<página>-antropometria-<ancho>.png`) y la
// vuelve a plegar; en `composicion` anota qué dice la barra (`reparto`) y, en `evolucion`, cuántas tomas y qué pares
// muestra. Abrir una pieza no lee nada: la cuenta de peticiones no cambia.
// Desde el arreglo de TEST-TAG-032 (TA-30): la cuenta sigue hasta que la API queda quieta (ninguna petición en curso y
// ninguna nueva en 1,5 s) y se compara con la tabla de `peticiones.mjs`: una cuenta distinta, para arriba o para abajo,
// hace fallar la corrida. Y la lista de nombres de TEST-TAG-004 ya no sale vacía: quitaba toda palabra, no solo los
// títulos («Lic.»), y la prueba no encontraba nunca un nombre.
// Desde TA-71: en el Espacio de cada profesional, en cada tamaño y en los dos temas, y con «Ocultar nombres», mide que
// el monograma, el nombre y el área de cada ficha de «Tu semana» queden adentro de su columna (`tu-semana.mjs`); una
// parte que se pasa hace fallar la corrida. Con «Ocultar nombres» guarda además «Tu semana» sola, en los dos temas y
// en los tres tamaños, para ver la referencia en pantalla.
// Desde TB-52 a TB-56 (DL-163 D-13, ampliada): el Plan de Nutrición de Diego visto por Sofía Paz, con el panel «Otras
// áreas» desplegado y el plan de Entrenamiento abierto; el Plan de Entrenamiento de Diego visto por Martín Acosta, con el
// de Nutrición abierto; y el Plan de Nutrición de Federico, con el pedido de Sofía Paz pendiente. En `otrasAreas` anota
// qué muestra el panel en cada página. Las dos primeras se recorren también con «Ocultar nombres». Sin la familia RES en
// la API (la rama del website sola), API-RES-04 da 404, no hay panel y las cuentas de esas páginas no coinciden.
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { diferenciasDePeticiones, esperarLaQuietud } from './peticiones.mjs';
import { fichasMedidas, medirTuSemana, partesQueSePasan } from './tu-semana.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '../../..');
const COHORTE = path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte');
const TRABAJO = path.join(REPO, 'EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/trabajo-cohorte');
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const salida = path.resolve(process.argv[2] ?? 'capturas-del-tablero');
// El recorrido: el del tablero (sin segundo argumento) o `flujos-de-planificacion` (flujos-de-planificacion.mjs), que usa
// la misma cohorte, la misma API y el mismo website, y recorre cómo un profesional crea y ajusta sus planes.
const MODO = process.argv[3] ?? 'tablero';
if (!['tablero', 'flujos-de-planificacion'].includes(MODO)) throw new Error(`Modo desconocido: ${MODO}.`);
const API = 'http://localhost:3001';
const WEB = 'http://localhost:3000';
const CHROME = process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
const TAMANOS = [
  [1280, 800],
  [1440, 900],
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
    // La cohorte da de alta nueve cuentas y las capturas inician sesión varias veces: los limitadores se prueban en
    // las pruebas de integración, no acá.
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

// ─── Las capturas ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Qué se captura de cada profesional: el nombre del archivo y la ruta, con {diego} o {federico} en lugar del
 * identificador. Desde TB-09, también el Resumen de Federico Álvarez, que tiene una revisión registrada sin aplicar: su
 * marco ofrece «Aplicar la revisión de Nutrición».
 */
const PAGINAS = {
  PRO_N: [
    ['espacio', '/pro'],
    // TB-12: el cajón «De a una», abierto con «Empezar por el primero» (la compilación de las capturas lo prende).
    ['cajon', '/pro', 'cajon'],
    ['resumen', '/pro/advisees?id={diego}'],
    ['resumen-federico', '/pro/advisees?id={federico}'],
    ['analizar', '/pro/advisees?id={diego}&vista=analizar'],
    // El gráfico grande: «Analizar» con Calorías elegida (se elige en pantalla, como lo haría el profesional).
    ['analizar-calorias', '/pro/advisees?id={diego}&vista=analizar', 'Calorías'],
    ['nutricion', '/pro/advisees/nutrition?id={diego}&vista=resumen'],
    ['antropometria', '/pro/advisees/anthropometry?id={diego}&vista=evolucion'],
    // TB-24: la composición corporal en la pestaña y en la pregunta de «Analizar», y el Resumen de Héctor Funes, que no
    // tiene pliegues: su tarjeta de Antropometría muestra la línea de los pesos, sin partir.
    ['antropometria-composicion', '/pro/advisees/anthropometry?id={diego}&vista=composicion'],
    ['analizar-composicion', '/pro/advisees?id={diego}&vista=analizar&pregunta=composicion-del-peso'],
    ['resumen-hector', '/pro/advisees?id={hector}'],
    // TB-15: la revisión nueva de Nutrición de Diego, con «¿Cuándo la revisás?» en «Lo que decidís», sin nada elegido.
    ['revision-nueva', '/pro/advisees/nutrition?id={diego}&vista=revisiones&preparar=1'],
    // TB-52 a TB-56: el Plan de Nutrición de Diego con «Otras áreas» desplegado y el plan de Entrenamiento que le comparte
    // Diego, abierto; y el de Federico, con el pedido de ver su plan de Entrenamiento esperando la respuesta.
    ['plan-otras-areas', '/pro/advisees/nutrition?id={diego}&vista=plan', 'otras-areas:ENTRENAMIENTO'],
    ['plan-federico-pedido', '/pro/advisees/nutrition?id={federico}&vista=plan', 'otras-areas'],
  ],
  PRO_T: [
    ['espacio', '/pro'],
    ['cajon', '/pro', 'cajon'],
    ['resumen', '/pro/advisees?id={diego}'],
    ['entrenamiento', '/pro/advisees/training?id={diego}&vista=resumen'],
    // TB-48: el editor de Entrenamiento, con el borrador que dejó la revisión de hoy de Camila Ortiz («Ajustar»): «Revisar
    // el plan» y «Guardar como plantilla» a la vista; y «Mis ejercicios», con «Cargar las zonas» en cada ejercicio propio
    // y, abiertas, las 17 zonas del primero con la figura (abrirlas no lee nada).
    ['plan-camila', '/pro/advisees/training?id={camila}&vista=plan'],
    ['mis-ejercicios', '/pro/exercises'],
    ['mis-ejercicios-zonas', '/pro/exercises', 'zonas'],
    // TB-52 a TB-56: el Plan de Entrenamiento de Diego con «Otras áreas» desplegado y el plan de Nutrición abierto.
    ['plan-otras-areas', '/pro/advisees/training?id={diego}&vista=plan', 'otras-areas:NUTRICION'],
  ],
};
const NOMBRES = { PRO_N: 'sofia-paz', PRO_T: 'martin-acosta' };

/**
 * TEST-TAG-004: los nombres de la cohorte, sacados de sus archivos (las seis personas y los tres profesionales), sin
 * los títulos. Cada palabra es una aparición: un apellido solo también es un nombre.
 */
const NOMBRES_DE_LA_COHORTE = (() => {
  const personas = [...fs.readFileSync(path.join(COHORTE, 'personas.mjs'), 'utf8').matchAll(/^\s+nombre: '([^']+)'/gm)].map((m) => m[1]);
  const profesionales = [...fs.readFileSync(path.join(COHORTE, 'catalogo.mjs'), 'utf8').matchAll(/^\s+[A-Z]: \{ nombre: '([^']+)'/gm)].map((m) => m[1]);
  if (personas.length < 6 || profesionales.length < 3) throw new Error('No se encontraron los nombres de la cohorte.');
  // Sin los títulos («Lic.»), que terminan en punto. Antes el punto iba sin escapar: quitaba toda palabra y la lista
  // salía vacía, así que la prueba no encontraba nunca un nombre (TA-30).
  const palabras = [...personas, ...profesionales].flatMap((n) => n.split(' ').filter((p) => p && !/\.$/.test(p)));
  if (palabras.length < 12) throw new Error(`TEST-TAG-004: solo ${palabras.length} palabras de nombres para buscar.`);
  return palabras;
})();
/** Las páginas que recorre «Ocultar nombres»: las de la prueba (el cajón se suma con TB-12). */
const CON_NOMBRES_OCULTOS = [
  // TB-12: el cajón, con su primer cuadro abierto. Va primero: con el diálogo abierto, el menú de la cuenta no se toca.
  ['cajon', '/pro', 'cajon'],
  ['espacio', '/pro'],
  ['resumen', '/pro/advisees?id={diego}'],
  // TB-52 a TB-56: el panel «Otras áreas» desplegado y el plan del otro abierto, cada uno en su página.
  ['plan-otras-areas', '/pro/advisees/nutrition?id={diego}&vista=plan', 'otras-areas:ENTRENAMIENTO', 'PRO_N'],
  ['plan-otras-areas', '/pro/advisees/training?id={diego}&vista=plan', 'otras-areas:NUTRICION', 'PRO_T'],
];

async function capturarTodo() {
  const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
  const diego = estado.personas?.diego?.aseId;
  if (!diego) throw new Error('La cohorte no dejó a Diego Sosa en estado.json.');
  const federico = estado.personas?.federico?.aseId;
  if (!federico) throw new Error('La cohorte no dejó a Federico Álvarez en estado.json.');
  const hector = estado.personas?.hector?.aseId;
  if (!hector) throw new Error('La cohorte no dejó a Héctor Funes en estado.json.');
  const camila = estado.personas?.camila?.aseId;
  if (!camila) throw new Error('La cohorte no dejó a Camila Ortiz en estado.json.');
  const c = cuentas();
  const mediciones = { hoy: estado.hoy, commit: process.env.GITHUB_SHA ?? null, paginas: [], errores: [] };
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--lang=es-AR', '--force-color-profile=srgb'],
    defaultViewport: { width: TAMANOS[0][0], height: TAMANOS[0][1], deviceScaleFactor: 1 },
  });
  try {
    for (const [prefijo, paginas] of Object.entries(PAGINAS)) {
      // Cada profesional en su propio contexto, sin la sesión del anterior.
      const contexto = await navegador.createBrowserContext();
      const page = await contexto.newPage();
      await page.emulateTimezone('America/Argentina/Buenos_Aires');
      page.on('pageerror', (e) => mediciones.errores.push(`${NOMBRES[prefijo]}: ${String(e).slice(0, 300)}`));
      let peticiones = 0;
      // TEST-TAG-032: las que están en curso y la hora de la última que empezó o terminó, para saber cuándo quedó quieta.
      const enLaApi = { enCurso: 0, ultima: Date.now() };
      const deLaApi = (r) => r.url().startsWith(`${API}/api/`) && r.method() !== 'OPTIONS';
      page.on('request', (r) => {
        if (!deLaApi(r)) return;
        peticiones += 1;
        enLaApi.enCurso += 1;
        enLaApi.ultima = Date.now();
      });
      const termino = (r) => {
        if (!deLaApi(r)) return;
        enLaApi.enCurso = Math.max(0, enLaApi.enCurso - 1);
        enLaApi.ultima = Date.now();
      };
      page.on('requestfinished', termino);
      page.on('requestfailed', termino);
      const quieta = () => esperarLaQuietud(() => enLaApi);
      await page.goto(`${WEB}/login?volver=${encodeURIComponent('/pro')}`, { waitUntil: 'networkidle0' });
      await page.type('#correo', c[`${prefijo}_CORREO`]);
      await page.type('#contrasena', c[`${prefijo}_CLAVE`]);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
      await page.waitForFunction(() => location.pathname.startsWith('/pro'), { timeout: 60_000 });
      await asentar(page);
      for (const [nombre, plantilla, metrica] of paginas) {
        const ruta = plantilla.replace('{diego}', diego).replace('{federico}', federico).replace('{hector}', hector).replace('{camila}', camila);
        // Para contar lo que pide una página al abrirse, se llega desde otra: la cuenta, que no comparte lecturas.
        await page.evaluate(() => window.next.router.push('/account'));
        await asentar(page);
        await quieta();
        peticiones = 0;
        // La sesión vive en memoria: se navega dentro de la aplicación, sin recargar.
        await page.evaluate((u) => window.next.router.push(u), ruta);
        await asentar(page);
        let asentada = await quieta();
        if (metrica === 'zonas') {
          // TB-48: «Cargar las zonas» del primer ejercicio propio; la ficha ya está leída, así que no suma peticiones.
          await page.evaluate(() => document.querySelector('[data-cambiar-zonas]')?.click());
          await asentar(page);
          asentada = (await quieta()) && asentada;
        } else if (metrica === 'cajon') {
          // TB-12: «Empezar por el primero» abre el cajón «De a una»; la cuenta suma las lecturas de su primer cuadro.
          await abrirElCajon(page);
          asentada = (await quieta()) && asentada;
        } else if (metrica?.startsWith('otras-areas')) {
          // TB-54: desplegar el panel lee los planes que se comparten (API-RES-06) y API-RES-07; abrir el plan completo
          // (TB-52) no lee nada más.
          asentada = (await abrirOtrasAreas(page, metrica.split(':')[1] ?? null, quieta)) && asentada;
        } else if (metrica) {
          await page.evaluate((m) => {
            const casilla = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === m)?.querySelector('input[type="checkbox"]');
            casilla?.click();
          }, metrica);
          await asentar(page);
          // Y «Ver los gráficos», que abre el gráfico de lo elegido.
          await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Ver los gráficos')?.click());
          await asentar(page);
          asentada = (await quieta()) && asentada;
        }
        // TB-09: la acción del momento que ofrece el marco de la ficha, si la hay (TEST-TAG-010, en pantalla).
        const cajon = metrica === 'cajon' ? await loQueMuestraElCajon(page) : null;
        const accionDelMarco = await page.evaluate(() => document.querySelector('[data-accion-de-la-ficha]')?.textContent?.trim() ?? null);
        // TB-24: cuántas columnas de la composición van partidas y cuántas no, y si la tarjeta de Antropometría del
        // Resumen muestra la barra de la última toma o la línea de los pesos.
        const composicion = await page.evaluate(() => ({
          partidas: document.querySelectorAll('.composicion__columna[data-partida="si"]').length,
          sinPartir: document.querySelectorAll('.composicion__columna[data-partida="no"]').length,
          cambios: document.querySelectorAll('.composicion__cambio').length,
          barraDeLaUltimaToma: document.querySelectorAll('.barra-de-la-composicion').length > 0,
          texto: document.querySelector('.composicion__resumen')?.textContent?.trim() ?? null,
          // TB-51: el reparto de la barra (grasa, músculo y resto, o grasa y libre de grasa) y lo que dice cada parte.
          reparto: document.querySelector('.reparto-del-peso')?.getAttribute('data-reparto') ?? null,
          partes: [...(document.querySelector('.reparto-del-peso')?.querySelectorAll('.reparto-del-peso__partes > li') ?? [])].map((li) => li.textContent.replace(/\s+/g, ' ').trim()),
        }));
        // TB-50: la evolución de las últimas tomas en la tarjeta de Antropometría del Resumen.
        const evolucion = await page.evaluate(() => {
          const pieza = document.querySelector('[data-pieza="evolucion"]');
          return pieza ? { tomas: Number(pieza.getAttribute('data-columnas')), pares: [...pieza.querySelectorAll('[data-par]')].map((e) => e.getAttribute('data-par')), aLaVista: document.querySelector('.evolucion-de-las-tomas__a-la-vista')?.textContent?.trim() ?? null } : null;
        });
        // TEST-TAG-032: cuántos indicadores mostró la página (cada uno lee su serie; la tabla puede contar por indicador).
        const indicadores = await page.evaluate(() => document.querySelectorAll('.indicador__valor').length);
        // TB-52 a TB-56: lo que muestra el panel «Otras áreas», si lo hay.
        const otrasAreas = await loQueMuestranLasOtrasAreas(page);
        const fila = { profesional: NOMBRES[prefijo], pagina: nombre, ruta: plantilla, peticionesAlAbrir: peticiones, asentada, indicadores, accionDelMarco, cajon, composicion, evolucion, otrasAreas, alto: {} };
        for (const tema of TEMAS) {
          // Con el cajón abierto (un diálogo modal) el menú de la cuenta no se toca: se cierra, se cambia el tema y se abre.
          if (metrica === 'cajon' && (await page.evaluate(() => document.documentElement.dataset.tema)) !== tema) {
            await page.evaluate(() => document.querySelector('dialog.cajon[open]')?.close());
            await ponerTema(page, tema);
            await abrirElCajon(page);
          } else if (metrica?.startsWith('otras-areas:') && (await page.evaluate(() => document.documentElement.dataset.tema)) !== tema) {
            await cerrarElPlanCompleto(page);
            await ponerTema(page, tema);
            await abrirOtrasAreas(page, metrica.split(':')[1], quieta);
          } else await ponerTema(page, tema);
          for (const [ancho, alto] of TAMANOS) {
            const carpeta = path.join(salida, NOMBRES[prefijo], tema);
            fs.mkdirSync(carpeta, { recursive: true });
            await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
            await pausa(700);
            await page.screenshot({ path: path.join(carpeta, `${nombre}-${ancho}-pantalla.png`) });
            // TB-50 y TB-51: la tarjeta de Antropometría con sus piezas abiertas, sola; después se vuelven a plegar.
            if (nombre.startsWith('resumen')) await tarjetaDeAntropometriaAbierta(page, path.join(carpeta, `${nombre}-antropometria-${ancho}.png`), fila, `${tema}-${ancho}`);
            // TB-10 (A13 de la propuesta): en el Resumen, dónde terminan las tarjetas, el valor de cada indicador y sus
            // minigráficos, y el alto de la tarjeta más alta, para comparar con la primera pantalla de cada tamaño.
            // TB-06 y TB-11 (§1 del paquete): en el Espacio, dónde terminan las cifras, «Tu semana» y las primeras tres
            // personas de «Te toca a vos», y dónde empieza y termina «Esperan respuesta».
            if (nombre === 'espacio') {
              const medida = await page.evaluate(() => {
                const caja = (selector) => document.querySelector(selector)?.getBoundingClientRect() ?? null;
                const personas = [...document.querySelectorAll('.mesa-persona')].map((e) => Math.round(e.getBoundingClientRect().bottom));
                const esperan = caja('#esperan-respuesta');
                return {
                  cifras: caja('.cifras-del-espacio') ? Math.round(caja('.cifras-del-espacio').bottom) : null,
                  tuSemana: caja('.tu-semana') ? Math.round(caja('.tu-semana').bottom) : null,
                  personas: personas.slice(0, 3),
                  esperanArriba: esperan ? Math.round(esperan.top) : null,
                  esperanAbajo: esperan ? Math.round(esperan.bottom) : null,
                  saludo: document.querySelector('.encabezado-del-espacio__saludo')?.textContent ?? null,
                  cifrasEnPalabras: [...document.querySelectorAll('.cifra-del-espacio__principal')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
                };
              });
              fila.primeraPantalla ??= {};
              fila.primeraPantalla[`${tema}-${ancho}`] = { ...medida, alto, personasQueEntran: medida.personas.filter((b) => b <= alto).length, entraEsperan: medida.esperanArriba !== null && medida.esperanArriba < alto };
              // TA-71: ninguna parte de una ficha de «Tu semana» se pasa de su columna.
              fila.tuSemana ??= {};
              fila.tuSemana[`${tema}-${ancho}`] = await laSemanaEntra(page, mediciones, `${NOMBRES[prefijo]} · ${tema} · ${ancho}`);
            }
            if (nombre.startsWith('resumen')) {
              const medida = await page.evaluate(() => {
                const cajas = (selector) => [...document.querySelectorAll(selector)].map((e) => e.getBoundingClientRect());
                const fondo = (selector) => {
                  const c = cajas(selector);
                  return c.length ? Math.round(Math.max(...c.map((r) => r.bottom))) : null;
                };
                const tarjetas = cajas('.areas > .area');
                return {
                  tarjetas: fondo('.areas > .area'),
                  tarjetaMasAlta: tarjetas.length ? Math.round(Math.max(...tarjetas.map((r) => r.height))) : null,
                  valores: fondo('.indicador__valor'),
                  minigraficos: fondo('.indicador [role="img"]'),
                };
              });
              fila.primeraPantalla ??= {};
              fila.primeraPantalla[`${tema}-${ancho}`] = { ...medida, alto, entranLosValores: medida.valores !== null && medida.valores <= alto, entranLosMinigraficos: medida.minigraficos !== null && medida.minigraficos <= alto };
            }
            const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
            // La página entera con la ventana estirada a su alto: con `fullPage`, los gráficos se quedan sin dibujo.
            await page.setViewport({ width: ancho, height: Math.min(Math.max(total, alto), 16000), deviceScaleFactor: 1 });
            await pausa(700);
            await page.screenshot({ path: path.join(carpeta, `${nombre}-${ancho}-entera.png`) });
            fila.alto[`${tema}-${ancho}`] = total;
          }
        }
        await page.setViewport({ width: TAMANOS[0][0], height: TAMANOS[0][1], deviceScaleFactor: 1 });
        mediciones.paginas.push(fila);
        console.log(`${NOMBRES[prefijo]} · ${nombre}: ${fila.peticionesAlAbrir} peticiones al abrir · ${JSON.stringify(fila.alto)}`);
      }
      await recorrerConNombresOcultos(page, prefijo, diego, mediciones);
      await contexto.close();
    }
  } finally {
    // TEST-TAG-032: lo medido contra la tabla de `peticiones.mjs`. Una diferencia hace fallar la corrida.
    mediciones.diferenciasDePeticiones = diferenciasDePeticiones(mediciones.paginas);
    fs.writeFileSync(path.join(salida, 'mediciones.json'), `${JSON.stringify(mediciones, null, 2)}\n`);
    await navegador.close();
  }
  for (const d of mediciones.diferenciasDePeticiones) console.error(`TEST-TAG-032 · ${d}`);
  if (mediciones.diferenciasDePeticiones.length > 0) process.exitCode = 1;
  // TA-71: una parte de una ficha de «Tu semana» que se pasa de su columna, en cualquier tamaño, tema o con los nombres
  // ocultos, hace fallar la corrida.
  for (const d of mediciones.tuSemanaQueSePasa ?? []) console.error(`TA-71 · ${d}`);
  if ((mediciones.tuSemanaQueSePasa ?? []).length > 0) process.exitCode = 1;
  return mediciones;
}

/**
 * TB-50 y TB-51: abre las piezas plegadas de la tarjeta de Antropometría del Resumen (abrirlas no lee nada), guarda la
 * tarjeta sola y anota su alto abierta y lo que dibuja la evolución; después las vuelve a plegar, para que la página
 * entera quede como la ve el profesional al llegar.
 */
async function tarjetaDeAntropometriaAbierta(page, archivo, fila, clave) {
  const tarjeta = await page.$('.area[data-area="ANTROPOMETRIA"]');
  if (!tarjeta) return;
  const abiertas = await page.evaluate(() => {
    const plegadas = [...document.querySelectorAll('.area[data-area="ANTROPOMETRIA"] details.pieza-del-area--plegada:not([open])')];
    for (const d of plegadas) d.open = true;
    return plegadas.length;
  });
  await pausa(500);
  const medida = await page.evaluate(() => {
    const t = document.querySelector('.area[data-area="ANTROPOMETRIA"]');
    const pieza = t?.querySelector('[data-pieza="evolucion"]');
    return { alto: t ? Math.round(t.getBoundingClientRect().height) : null, filasDibujadas: pieza ? pieza.querySelectorAll('.evolucion-de-las-tomas__fila[data-metrica] svg').length : 0, tomas: pieza ? Number(pieza.getAttribute('data-columnas')) : 0 };
  });
  await tarjeta.screenshot({ path: archivo });
  fila.antropometriaAbierta ??= {};
  fila.antropometriaAbierta[clave] = { ...medida, piezasAbiertas: abiertas };
  await page.evaluate(() => {
    for (const d of document.querySelectorAll('.area[data-area="ANTROPOMETRIA"] details.pieza-del-area--plegada[open]')) d.open = false;
    // La captura de la tarjeta desplaza la página: vuelve arriba, para que la primera pantalla se mida como siempre.
    window.scrollTo(0, 0);
  });
  await pausa(200);
}

/**
 * TA-71: mide «Tu semana» en la página (`medirTuSemana`) y anota en `mediciones.tuSemanaQueSePasa` cada parte de una
 * ficha que se pasa de su columna. Devuelve, para la fila de la página, cuántas fichas midió y lo que se pasa. La
 * cohorte tiene revisiones en la semana de los dos profesionales (una vencida y una a tres días): sin ninguna ficha
 * medida la corrida no probaría nada, y también falla.
 */
async function laSemanaEntra(page, mediciones, donde) {
  const columnas = await page.evaluate(medirTuSemana);
  const sePasan = fichasMedidas(columnas) === 0 ? ['no se midió ninguna ficha de «Tu semana»'] : partesQueSePasan(columnas);
  mediciones.tuSemanaQueSePasa ??= [];
  for (const frase of sePasan) mediciones.tuSemanaQueSePasa.push(`${donde} · ${frase}`);
  return { fichas: fichasMedidas(columnas), sePasan };
}

/**
 * TEST-TAG-004 · «Ocultar nombres» no deja pasar un nombre (TB-05): se prende en el menú de la cuenta, como lo haría el
 * profesional, y en cada página se lee lo que se ve (el texto visible, los rótulos accesibles y el título de la
 * pestaña). Falla si aparece una palabra de un nombre de la cohorte o un monograma con iniciales. Se apaga al terminar.
 */
async function recorrerConNombresOcultos(page, prefijo, diego, mediciones) {
  mediciones.ocultarNombres ??= [];
  await alternarNombresOcultos(page, true);
  for (const [nombre, plantilla, accion, soloDe] of CON_NOMBRES_OCULTOS) {
    if (soloDe && soloDe !== prefijo) continue;
    await page.evaluate(() => window.next.router.push('/account'));
    await asentar(page);
    await page.evaluate((u) => window.next.router.push(u), plantilla.replace('{diego}', diego));
    await asentar(page);
    if (accion === 'cajon') await abrirElCajon(page);
    if (accion?.startsWith('otras-areas')) await abrirOtrasAreas(page, accion.split(':')[1] ?? null, () => esperarLaQuietud(() => ({ enCurso: 0, ultima: 0 })));
    const visto = await page.evaluate(() => ({
      texto: document.body.innerText,
      rotulos: [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).join('\n'),
      titulo: document.title,
      iniciales: document.querySelectorAll('[data-retrato="iniciales"]').length,
    }));
    const todo = [visto.texto, visto.rotulos, visto.titulo].join('\n');
    const apariciones = NOMBRES_DE_LA_COHORTE.filter((palabra) => new RegExp(`(^|[^\\p{L}])${palabra}([^\\p{L}]|$)`, 'u').test(todo));
    const fila = { profesional: NOMBRES[prefijo], pagina: nombre, apariciones, monogramasConIniciales: visto.iniciales };
    mediciones.ocultarNombres.push(fila);
    console.log(`ocultar nombres · ${NOMBRES[prefijo]} · ${nombre}: ${apariciones.length ? `APARECEN ${apariciones.join(', ')}` : 'ningún nombre'} · ${visto.iniciales} monogramas con iniciales`);
    if (apariciones.length > 0 || visto.iniciales > 0) process.exitCode = 1;
    if (nombre === 'espacio') {
      // TA-71: con los nombres ocultos, la referencia («Asesorado · …») tampoco se pasa de su columna. Se mide en los dos
      // temas y los tres tamaños, y se guarda «Tu semana» sola para verla en pantalla.
      fila.tuSemana = {};
      for (const tema of TEMAS) {
        await ponerTema(page, tema);
        const carpeta = path.join(salida, NOMBRES[prefijo], tema);
        fs.mkdirSync(carpeta, { recursive: true });
        for (const [ancho, alto] of TAMANOS) {
          await page.setViewport({ width: ancho, height: alto, deviceScaleFactor: 1 });
          await pausa(500);
          fila.tuSemana[`${tema}-${ancho}`] = await laSemanaEntra(page, mediciones, `${NOMBRES[prefijo]} · nombres ocultos · ${tema} · ${ancho}`);
          const semana = await page.$('.tu-semana');
          if (semana) await semana.screenshot({ path: path.join(carpeta, `tu-semana-nombres-ocultos-${ancho}.png`) });
        }
      }
      await page.setViewport({ width: TAMANOS[0][0], height: TAMANOS[0][1], deviceScaleFactor: 1 });
    }
  }
  await alternarNombresOcultos(page, false);
}

/** Prende o apaga «Ocultar nombres» desde el menú de la cuenta, sin teclado (como `ponerTema`). */
async function alternarNombresOcultos(page, prender) {
  await page.waitForSelector('.menu-de-cuenta__boton', { timeout: 15_000 });
  await page.evaluate(() => document.querySelector('.menu-de-cuenta__boton').click());
  await page.waitForSelector('.menu-de-cuenta__ocultar input[type="checkbox"]', { timeout: 5_000 });
  await page.evaluate((p) => {
    const casilla = document.querySelector('.menu-de-cuenta__ocultar input[type="checkbox"]');
    if (casilla.checked !== p) casilla.click();
  }, prender);
  await page.evaluate(() => document.querySelector('.menu-de-cuenta__boton').click());
  await page.waitForFunction(() => !document.querySelector('.menu-de-cuenta__panel'), { timeout: 3_000 });
  await pausa(300);
}

/** TB-12: abre el cajón «De a una» con su botón, como lo haría el profesional. Sin el botón (apagado), no hace nada. */
async function abrirElCajon(page) {
  await page.evaluate(() => document.querySelector('.cajon__empezar')?.click());
  await page.waitForSelector('dialog.cajon[open]', { timeout: 10_000 }).catch(() => {});
  await asentar(page);
}

/** Lo que muestra el primer cuadro del cajón: la posición, la pregunta, las salidas y si el foco está en la pregunta. */
const loQueMuestraElCajon = (page) =>
  page.evaluate(() => {
    const d = document.querySelector('dialog.cajon[open]');
    if (!d) return { abierto: false };
    const texto = (sel) => d.querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    return {
      abierto: true,
      posicion: texto('.cajon__posicion'),
      pregunta: texto('.cajon__pregunta'),
      salidas: [...d.querySelectorAll('.cajon__salidas a, .cajon__salidas button')].map((e) => e.textContent.trim()),
      conTramo: Boolean(d.querySelector('.tramo__titulo')),
      focoEnLaPregunta: document.activeElement === d.querySelector('.cajon__pregunta'),
    };
  });

/**
 * TB-54 y TB-52: despliega el panel «Otras áreas» como lo haría el profesional (con su renglón) y, si se pide un área,
 * abre su plan completo. Sin panel (sin otra área, o sin la familia RES en la API), no hace nada. Devuelve si la API quedó
 * quieta.
 */
async function abrirOtrasAreas(page, area, quieta) {
  await page.evaluate(() => {
    const d = document.querySelector('.otras-areas__plegado');
    if (d && !d.open) d.querySelector('summary')?.click();
  });
  await asentar(page);
  let asentada = await quieta();
  if (area) {
    await page.evaluate((a) => document.querySelector(`[data-ver-el-plan="${a}"]`)?.click(), area);
    await page.waitForSelector('dialog.dialogo--panel[open] [data-plan-compartido]', { timeout: 10_000 }).catch(() => {});
    await asentar(page);
    asentada = (await quieta()) && asentada;
  }
  return asentada;
}

/** Cierra el plan completo con su «Cerrar», para que el menú de la cuenta se pueda tocar. */
async function cerrarElPlanCompleto(page) {
  await page.evaluate(() => document.querySelector('dialog.dialogo--panel[open] .dialogo__encabezado button')?.click());
  await page.waitForFunction(() => !document.querySelector('dialog.dialogo--panel[open]'), { timeout: 3_000 }).catch(() => {});
}

/** Lo que muestra el panel «Otras áreas»: si está, su renglón, cada área con lo que dice, la línea de tu área y el plan abierto. */
const loQueMuestranLasOtrasAreas = (page) =>
  page.evaluate(() => {
    const panel = document.querySelector('[data-otras-areas]');
    if (!panel) return null;
    const texto = (e) => e?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const plan = document.querySelector('dialog.dialogo--panel[open] [data-plan-compartido]');
    return {
      desplegado: panel.querySelector('.otras-areas__plegado')?.open ?? false,
      renglon: texto(panel.querySelector('.otras-areas__renglon')),
      areas: [...panel.querySelectorAll('.otras-areas__area')].map((li) => ({ area: li.getAttribute('data-area'), estado: li.getAttribute('data-estado'), texto: texto(li) })),
      loDeTuArea: texto(panel.querySelector('[data-lo-de-tu-area]')),
      planAbierto: plan ? { area: plan.getAttribute('data-plan-compartido'), sesiones: plan.querySelectorAll('.plan-compartido__sesion').length, comidas: plan.querySelectorAll('.comida-del-plan').length, semanas: plan.querySelectorAll('.plan-compartido__avance tbody tr').length } : null,
    };
  });

/** Espera a que la página termine de pedir datos y de acomodarse. */
async function asentar(page) {
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 30_000 }).catch(() => {});
  await pausa(600);
}

/**
 * El tema se elige en el menú de la cuenta (WP-ESCRITORIO-AMABLE), sin teclado y sin mover el foco, como en
 * EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/paginas.mjs: Escape cerraría otro panel y dejaría el aro de foco.
 */
async function ponerTema(page, tema) {
  if ((await page.evaluate(() => document.documentElement.dataset.tema)) === tema) return;
  await page.waitForSelector('.menu-de-cuenta__boton', { timeout: 15_000 });
  await page.evaluate(() => document.querySelector('.menu-de-cuenta__boton').click());
  await page.waitForSelector('.menu-de-cuenta__panel input[type="radio"]', { timeout: 5_000 });
  await page.evaluate((t) => document.querySelector(`.menu-de-cuenta__panel input[type="radio"][value="${t}"]`).click(), tema);
  await page.waitForFunction((t) => document.documentElement.dataset.tema === t, { timeout: 5_000 }, tema);
  await page.evaluate(() => document.querySelector('.menu-de-cuenta__boton').click());
  await page.waitForFunction(() => !document.querySelector('.menu-de-cuenta__panel'), { timeout: 3_000 });
  await pausa(300);
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
  if (MODO === 'flujos-de-planificacion') {
    const { recorrerLosFlujos } = await import('./flujos-de-planificacion.mjs');
    const estado = JSON.parse(fs.readFileSync(path.join(TRABAJO, 'estado.json'), 'utf8'));
    await recorrerLosFlujos({ puppeteer, CHROME, WEB, salida, cuentas: cuentas(), estado, asentar, pausa });
  } else {
    const m = await capturarTodo();
    console.log(`errores de la página: ${m.errores.length ? m.errores.slice(0, 8).join(' | ') : 'ninguno'}`);
    if (process.exitCode === 1) console.error('Falló un guardián: TEST-TAG-004 (un nombre o una inicial con «Ocultar nombres»), TEST-TAG-032 (las peticiones al abrir) o TA-71 (una ficha de «Tu semana» que se pasa de su columna). Ver mediciones.json.');
  }
} finally {
  fs.writeFileSync(path.join(salida, 'api.log'), registroDeLaApi.join(''));
  web?.kill();
  await parar(api);
}
