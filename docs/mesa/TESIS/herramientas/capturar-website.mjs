// Capturas del website en test para la imagen representativa de la tesis: la cartera de la profesional sintética de
// Nutrición y la ficha de Diego Sosa (Resumen y Analizar). Chrome sin interfaz, con su propio perfil temporal (no toca
// otro Chrome abierto). Las credenciales se leen del archivo local y no se imprimen. Al terminar, cierra la sesión.
// Uso (Node 22):
//   BE_CUENTAS_COHORTE=<cuentas.env> PUPPETEER_DESDE=<package.json de un proyecto con puppeteer-core>
//   CHROME=<chrome.exe> SALIDA=<carpeta> node capturar-website.mjs
// Las capturas elegidas se copian a documento/imagenes (portada-website.png es la ficha de Diego, vista Resumen).
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

for (const v of ['BE_CUENTAS_COHORTE', 'PUPPETEER_DESDE', 'CHROME', 'SALIDA']) if (!process.env[v]) throw new Error(`falta ${v}`);
const requerir = createRequire(process.env.PUPPETEER_DESDE);
const puppeteer = requerir('puppeteer-core');
const WEB = 'https://be-web-1ngj.onrender.com';
const SALIDA = process.env.SALIDA;
const env = Object.fromEntries(
  fs.readFileSync(process.env.BE_CUENTAS_COHORTE, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const cuenta = { correo: env.PRO_N_CORREO, clave: env.PRO_N_CLAVE };
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

const navegador = await puppeteer.launch({
  executablePath: process.env.CHROME,
  headless: true,
  args: ['--lang=es-AR', '--no-first-run', '--disable-extensions', '--force-color-profile=srgb'],
});
const registro = [];
try {
  const p = await navegador.newPage();
  await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await p.goto(`${WEB}/login`, { waitUntil: 'networkidle2', timeout: 90_000 });
  await p.waitForFunction(() => {
    const e = document.querySelector('#correo');
    return !!e && Object.keys(e).some((k) => k.startsWith('__reactProps'));
  }, { timeout: 60_000, polling: 200 });
  await p.click('#correo', { clickCount: 3 });
  await p.type('#correo', cuenta.correo);
  await p.click('#contrasena', { clickCount: 3 });
  await p.type('#contrasena', cuenta.clave);
  const boton = await p.waitForFunction(() => [...document.querySelectorAll('form button[type="submit"]')].find((b) => b.textContent.includes('Iniciar sesión')) ?? null, { timeout: 30_000 });
  await boton.asElement().click();
  await p.waitForFunction(() => location.pathname.startsWith('/pro'), { timeout: 90_000 });
  await p.waitForSelector('a.persona__abrir', { timeout: 90_000 });
  await pausa(2500);
  await p.screenshot({ path: join(SALIDA, 'cartera.png') });
  registro.push('cartera');
  const href = await p.evaluate(() => [...document.querySelectorAll('a.persona__abrir')].find((a) => a.closest('li, tr, article, div')?.innerText.includes('Diego Sosa'))?.getAttribute('href') ?? null);
  if (!href) throw new Error('no encontré la ficha de Diego Sosa');
  for (const [vista, extra] of [['resumen', ''], ['analizar', '&p=365']]) {
    await p.goto(`${WEB}${href}&vista=${vista}${extra}`, { waitUntil: 'networkidle2', timeout: 90_000 });
    await p.waitForSelector('#titulo-asesorado', { timeout: 60_000 });
    await pausa(4000);
    await p.screenshot({ path: join(SALIDA, `diego-${vista}.png`) });
    registro.push(`diego-${vista}`);
  }
  // Cerrar la sesión desde el menú de la cuenta.
  await p.click('.menu-de-cuenta__boton').catch(() => {});
  const salir = await p.waitForFunction(() => [...document.querySelectorAll('button, a')].find((b) => /Cerrar sesión/.test(b.textContent)) ?? null, { timeout: 15_000 }).catch(() => null);
  if (salir) {
    await salir.asElement().click();
    await p.waitForFunction(() => location.pathname === '/login' || location.pathname === '/', { timeout: 30_000 }).catch(() => {});
    registro.push('sesión cerrada');
  } else registro.push('no se encontró «Cerrar sesión»');
} finally {
  await navegador.close();
}
console.log(registro.join(' · '));
