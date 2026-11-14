// Capturas del website en test para el respaldo de la demostración (base de la defensa): lo que se mostraría en vivo
// si la red o Render fallan. Solo navega y mira: no crea, no edita, no borra nada. Cada profesional sintético entra,
// recorre sus pantallas sobre Diego Sosa y cierra la sesión. Chrome sin interfaz y con su propio perfil temporal (no
// toca otro Chrome abierto). Las credenciales se leen del archivo local y nunca se imprimen ni se guardan.
// Uso (Node 22):
//   BE_CUENTAS_COHORTE=<cuentas.env> PUPPETEER_DESDE=<package.json con puppeteer-core> CHROME=<chrome.exe>
//   SALIDA=<carpeta> node capturar-respaldo-demo.mjs
// Escribe <SALIDA>/<nn>-<nombre>.png y <SALIDA>/registro.json (qué se capturó, cuándo, con qué cuenta y qué versión).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

for (const v of ['BE_CUENTAS_COHORTE', 'PUPPETEER_DESDE', 'CHROME', 'SALIDA']) if (!process.env[v]) throw new Error(`falta ${v}`);
const requerir = createRequire(process.env.PUPPETEER_DESDE);
const puppeteer = requerir('puppeteer-core');
const WEB = 'https://be-web-1ngj.onrender.com';
const API = 'https://be-api-hndp.onrender.com/api/v1';
const SALIDA = process.env.SALIDA;
fs.mkdirSync(SALIDA, { recursive: true });
const env = Object.fromEntries(
  fs.readFileSync(process.env.BE_CUENTAS_COHORTE, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const DIEGO = env.ASE_DIEGO_ID;
if (!DIEGO) throw new Error('falta el id de Diego');

// Qué mira cada profesional: [nombre del archivo, ruta relativa (con el id de Diego), qué se espera ver].
const RECORRIDOS = [
  {
    cuenta: 'PRO_N',
    rol: 'Profesional de nutrición',
    pantallas: [
      ['espacio-profesional', '/pro', 'a.persona__abrir'],
      ['ficha-resumen', `/pro/advisees?id=${DIEGO}&vista=resumen`, '#titulo-asesorado'],
      ['ficha-linea-de-tiempo', `/pro/advisees?id=${DIEGO}&vista=linea`, '#titulo-asesorado'],
      ['ficha-analizar', `/pro/advisees?id=${DIEGO}&vista=analizar&p=365`, '#titulo-asesorado'],
      ['nutricion-plan', `/pro/advisees/nutrition?id=${DIEGO}&vista=plan`, 'main'],
      ['nutricion-registros', `/pro/advisees/nutrition?id=${DIEGO}&vista=registros`, 'main'],
      ['nutricion-revisiones', `/pro/advisees/nutrition?id=${DIEGO}&vista=revisiones`, 'main'],
      // La antropometría de Diego también la lleva la profesional de nutrición (apartado 14); la de antropometría sola
      // trabaja con Camila Ortiz.
      ['antropometria-tomas', `/pro/advisees/anthropometry?id=${DIEGO}&vista=evaluaciones`, 'main'],
      ['antropometria-evolucion', `/pro/advisees/anthropometry?id=${DIEGO}&vista=evolucion`, 'main', 'elegir-peso'],
    ],
  },
  {
    cuenta: 'PRO_T',
    rol: 'Profesional de entrenamiento',
    pantallas: [['entrenamiento', `/pro/advisees/training?id=${DIEGO}`, 'main']],
  },
  {
    // El asesorado usa sobre todo la APK; en el website ve sus vínculos con sus consentimientos y sus novedades. La
    // página de la cuenta no se captura: muestra el identificador BE completo, que no se versiona.
    cuenta: 'ASE_DIEGO',
    rol: 'Asesorado (website)',
    pantallas: [
      ['asesorado-vinculos', '/account/relationships', 'main'],
      ['asesorado-novedades', '/account/news', 'main'],
    ],
  },
];

async function versionDeLaApi() {
  try {
    const r = await fetch(`${API.replace('/api/v1', '')}/health/ready`);
    const j = await r.json();
    return j?.data?.version?.commit ?? null;
  } catch {
    return null;
  }
}

const registro = { web: WEB, apiCommit: await versionDeLaApi(), comienzo: new Date().toISOString(), capturas: [], errores: [] };
const navegador = await puppeteer.launch({
  executablePath: process.env.CHROME,
  headless: true,
  args: ['--lang=es-AR', '--no-first-run', '--disable-extensions', '--force-color-profile=srgb'],
});
let n = 0;
try {
  for (const recorrido of RECORRIDOS) {
    const contexto = await navegador.createBrowserContext();
    const p = await contexto.newPage();
    await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
    await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    try {
      await p.goto(`${WEB}/login`, { waitUntil: 'networkidle2', timeout: 120_000 });
      await p.waitForFunction(() => {
        const e = document.querySelector('#correo');
        return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps'));
      }, { timeout: 90_000, polling: 250 });
      await p.click('#correo', { clickCount: 3 });
      await p.type('#correo', env[`${recorrido.cuenta}_CORREO`]);
      await p.click('#contrasena', { clickCount: 3 });
      await p.type('#contrasena', env[`${recorrido.cuenta}_CLAVE`]);
      const boton = await p.waitForFunction(() => [...document.querySelectorAll('form button[type="submit"]')].find((b) => b.textContent.includes('Iniciar sesión')) ?? null, { timeout: 30_000 });
      await boton.asElement().click();
      await p.waitForFunction(() => location.pathname.startsWith('/pro') || location.pathname.startsWith('/account'), { timeout: 120_000 });
      for (const [nombre, ruta, selector, accion] of recorrido.pantallas) {
        n += 1;
        const archivo = `${String(n).padStart(2, '0')}-${nombre}.png`;
        try {
          await p.goto(`${WEB}${ruta}`, { waitUntil: 'networkidle2', timeout: 120_000 });
          await p.waitForSelector(selector, { timeout: 90_000 });
          await pausa(4500);
          if (accion === 'elegir-peso') {
            // La primera métrica de la lista es la edad; para mostrar la evolución sirve más la masa corporal.
            const valor = await p.evaluate(() => {
              for (const s of document.querySelectorAll('select')) {
                const o = [...s.options].find((x) => /masa corporal|peso/i.test(x.textContent));
                if (o) {
                  s.setAttribute('data-captura', 'metrica');
                  return o.value;
                }
              }
              return null;
            });
            if (valor !== null) {
              await p.select('[data-captura="metrica"]', valor);
              await pausa(2500);
            }
          }
          await p.screenshot({ path: join(SALIDA, archivo) });
          registro.capturas.push({ archivo, rol: recorrido.rol, pantalla: nombre, ruta: ruta.replace(DIEGO, '{diego}'), momento: new Date().toISOString() });
        } catch (e) {
          registro.errores.push({ archivo, pantalla: nombre, error: String(e?.message ?? e).slice(0, 160) });
        }
      }
    } finally {
      // Cerrar la sesión desde el menú de la cuenta, para no dejarla abierta.
      await p.click('.menu-de-cuenta__boton').catch(() => {});
      const salir = await p.waitForFunction(() => [...document.querySelectorAll('button, a')].find((b) => /Cerrar sesión/.test(b.textContent)) ?? null, { timeout: 15_000 }).catch(() => null);
      if (salir) await salir.asElement().click().catch(() => {});
      await pausa(1500);
      await contexto.close();
    }
  }
} finally {
  await navegador.close();
  registro.fin = new Date().toISOString();
  fs.writeFileSync(join(SALIDA, 'registro.json'), JSON.stringify(registro, null, 1));
  console.log(`${registro.capturas.length} capturas, ${registro.errores.length} errores · API ${registro.apiCommit ?? 'sin dato'}`);
  for (const e of registro.errores) console.log(`  error en ${e.pantalla}: ${e.error}`);
}
