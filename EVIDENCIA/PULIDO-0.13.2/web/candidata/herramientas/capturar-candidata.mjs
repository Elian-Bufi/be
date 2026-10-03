// Website sobre la candidata 0.13.2 combinada (tanda del 2026-10-03, etapa B): las mismas vistas en 360, 390 y 1440 de
// ancho, en los dos temas y con letra normal y grande (la raíz al 150 %, como la letra grande del navegador). Además:
// - el visor «Ver en tamaño real» de la lámina;
// - un error de validación con el teclado emulado, y el enlace del aviso hasta el campo;
// - el eje de un índice (cintura/cadera) en la evolución;
// - la imagen exportada, con sus dimensiones.
// El teclado del teléfono no existe en Chrome de escritorio: se emula achicando el alto de la ventana, que es lo que hace
// `interactive-widget=resizes-content`. Es una emulación, no una prueba en el teléfono.
// Uso: node capturar-tanda3.mjs <carpeta>
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/bufim/AppData/Local/Temp/claude/C--Users-bufim-BE-Best/48b6effd-4f9c-500b-87ab-08468f0503c1/scratchpad/e2e/tanda/');
const puppeteer = require('puppeteer-core');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const estado = JSON.parse(fs.readFileSync(path.join(AQUI, '../e2e-ux/estado.json'), 'utf8'));
const [carpeta = 'tanda3'] = process.argv.slice(2);
const dir = path.join(AQUI, 'web', carpeta);
fs.mkdirSync(dir, { recursive: true });
const WEB = 'http://localhost:3000';
// La clave de la cuenta sintética de la base local se pasa por el entorno: no se publica.
const CLAVE = process.env.BE_CLAVE_LOCAL ?? '';
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const registro = [];
const errores = [];

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--lang=es-AR'], defaultViewport: { width: 1440, height: 900 } });
const p = await browser.newPage();
p.on('pageerror', (e) => errores.push(String(e)));
p.on('console', (m) => m.type() === 'error' && !/favicon|DevTools|status of 40[34]/.test(m.text()) && errores.push(m.text()));
const cdp = await p.createCDPSession();
await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });

const ir = async (url) => {
  await p.evaluate((u) => window.next.router.push(u), url);
  const destino = new URL(url, WEB);
  await p.waitForFunction((ruta, busqueda) => location.pathname.replace(/\/$/, '') === ruta.replace(/\/$/, '') && location.search === busqueda, { timeout: 60000 }, destino.pathname, destino.search).catch(() => errores.push(`no navegó a ${url}`));
  await p.waitForFunction(() => !/Cargando…/.test(document.querySelector('main')?.textContent ?? ''), { timeout: 90000 }).catch(() => errores.push(`quedó cargando: ${url}`));
  await pausa(900);
};
const tamano = async (ancho, alto) => {
  await p.setViewport({ width: ancho, height: alto, deviceScaleFactor: ancho < 500 ? 2 : 1 });
  await pausa(400);
};
const letra = async (grande) => {
  await p.evaluate((g) => {
    document.documentElement.style.fontSize = g ? '150%' : '';
  }, grande);
  await pausa(300);
};
const tema = async (valor) => {
  await p.evaluate((v) => {
    const s = [...document.querySelectorAll('select')].find((x) => [...x.options].some((o) => o.value === 'claro') && [...x.options].some((o) => o.value === 'azul-noche'));
    if (!s) return;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, v);
    s.dispatchEvent(new Event('change', { bubbles: true }));
  }, valor);
  await pausa(500);
};
const elegir = (sel, texto) =>
  p.evaluate(
    (s, t) => {
      const el = document.querySelector(s);
      const o = el && [...el.options].find((x) => x.textContent.includes(t));
      if (!o) return false;
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, o.value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    sel,
    texto,
  );

async function capturar(nombre, { entera = false, medir = null } = {}) {
  await pausa(300);
  const medidas = await p.evaluate((selector) => {
    const objetivo = selector ? document.querySelector(selector) : null;
    return {
      desborde: document.documentElement.scrollWidth > window.innerWidth + 1,
      altoDeLaPagina: document.documentElement.scrollHeight,
      principalEn: objetivo ? Math.round(objetivo.getBoundingClientRect().top + window.scrollY) : null,
    };
  }, medir);
  registro.push({ nombre, ...medidas });
  await p.screenshot({ path: path.join(dir, `${nombre}.png`) });
  if (entera) await p.screenshot({ path: path.join(dir, `${nombre}-entera.png`), fullPage: true });
}

/** Dónde quedan el foco, la barra fija y los botones, con la ventana actual. */
const posiciones = () =>
  p.evaluate(() => {
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const foco = r(document.activeElement);
    const barra = r(document.querySelector('.acciones--fijas'));
    const guardar = [...document.querySelectorAll('.acciones--fijas button')].map((b) => r(b));
    const alto = window.innerHeight;
    const id = document.activeElement?.id || null;
    const error = id ? r(document.getElementById(`${id}-error`)) : null;
    return {
      foco: id ?? document.activeElement?.className ?? null,
      campoVisible: !!foco && foco.top >= 0 && foco.bottom <= alto,
      campoTapadoPorLaBarra: !!foco && !!barra && foco.bottom > barra.top && foco.top < barra.bottom,
      errorDelCampoVisible: error ? error.top >= 0 && error.bottom <= (barra ? barra.top : alto) : null,
      guardarVisible: guardar.some((g) => g && g.top >= 0 && g.bottom <= alto),
    };
  });

const ultimoCampo = () =>
  p.evaluate(() => {
    const campos = [...document.querySelectorAll('main input[inputmode="decimal"]')].filter((x) => x.id.startsWith('ant-') && !x.id.includes('libre'));
    const ultimo = campos.at(-1);
    if (!ultimo) return null;
    ultimo.focus();
    return ultimo.id;
  });

try {
  await p.goto(`${WEB}/login`, { waitUntil: 'networkidle0', timeout: 240000 });
  await p.type('#correo', estado.proCorreo);
  await p.type('#contrasena', CLAVE);
  await Promise.all([p.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), p.keyboard.press('Enter')]);
  await p.waitForFunction(() => !location.pathname.startsWith('/login'), { timeout: 60000 });
  await pausa(1500);

  // ─── La matriz: tema × ancho × letra ───────────────────────────────────────────────────────────────────────────
  for (const t of ['azul-noche', 'claro']) {
    await tema(t);
    for (const grande of [false, true]) {
      await letra(grande);
      for (const [ancho, alto] of [[360, 740], [390, 844], [1440, 900]]) {
        await tamano(ancho, alto);
        const s = `${ancho}-${t}-${grande ? 'letra-grande' : 'letra-normal'}`;
        await ir(`/pro/advisees/anthropometry?id=${estado.aseId}&vista=evaluaciones`);
        await capturar(`a-tomas-${s}`, { entera: !grande, medir: '.tomas' });
        registro.push({ nombre: `a-tomas-${s}-orden`, orden: await p.evaluate(() => [...document.querySelectorAll('.tomas__fecha')].map((x) => x.textContent)), abierta: await p.evaluate(() => document.querySelector('.tomas__toma[aria-current="true"] .tomas__fecha')?.textContent ?? null) });
        await ir(`/pro/advisees/anthropometry?id=${estado.aseId}&vista=lamina`);
        await p.waitForSelector('.lamina__svg', { timeout: 60000 }).catch(() => errores.push('sin lámina'));
        await pausa(1200);
        await capturar(`b-lamina-${s}`, { entera: !grande, medir: '.lamina__lienzo' });
        await ir(`/pro/advisees/anthropometry?id=${estado.aseId}&vista=preparacion`);
        await p.waitForSelector('#ant-protocolo', { timeout: 60000 }).catch(() => {});
        await elegir('#ant-protocolo', 'Perfil antropométrico completo');
        await pausa(900);
        const campo = await ultimoCampo();
        await pausa(400);
        if (ancho < 500) {
          await tamano(ancho, alto - 330);
          await p.evaluate(() => document.activeElement?.scrollIntoView({ block: 'nearest' }));
          await pausa(600);
        }
        const nombre = `c-preparacion-${s}${ancho < 500 ? '-teclado-emulado' : ''}`;
        registro.push({ nombre, campo, ...(await posiciones()) });
        await capturar(nombre);
      }
    }
  }
  await letra(false);
  await tema('azul-noche');

  // ─── El visor de la lámina en el teléfono ─────────────────────────────────────────────────────────────────────
  await tamano(390, 844);
  await ir(`/pro/advisees/anthropometry?id=${estado.aseId}&vista=lamina`);
  await p.waitForSelector('.lamina__svg', { timeout: 60000 }).catch(() => {});
  await pausa(1200);
  const boton = await p.evaluateHandle(() => [...document.querySelectorAll('.lamina__ampliar button')][0] ?? null);
  if (boton.asElement()) {
    await boton.asElement().evaluate((b) => b.scrollIntoView({ block: 'center' }));
    await pausa(300);
    await boton.asElement().click();
    await pausa(900);
    const visor = await p.evaluate(() => {
      const v = document.querySelector('.lamina__visor');
      const b = document.querySelector('.lamina__ampliar button');
      v?.scrollIntoView({ block: 'start' });
      return { hayVisor: !!v, seDesplaza: !!v && v.scrollWidth > v.clientWidth, anchoDelLienzo: document.querySelector('.lamina__lienzo--ampliado')?.getBoundingClientRect().width ?? null, ariaPressed: b?.getAttribute('aria-pressed'), texto: b?.textContent };
    });
    await pausa(500);
    registro.push({ nombre: 'd-visor-ampliado-390', ...visor });
    await capturar('d-visor-ampliado-390');
    await p.evaluate(() => {
      const v = document.querySelector('.lamina__visor');
      if (v) v.scrollLeft = 300;
    });
    await pausa(400);
    await capturar('d-visor-ampliado-390-desplazado');
    await p.evaluate(() => document.querySelector('.lamina__ampliar button')?.click());
    await pausa(600);
    registro.push({ nombre: 'd-visor-vuelta', ariaPressed: await p.evaluate(() => document.querySelector('.lamina__ampliar button')?.getAttribute('aria-pressed')), hayVisor: await p.evaluate(() => !!document.querySelector('.lamina__visor')) });
  } else errores.push('sin botón «Ver en tamaño real»');

  // ─── Un error de validación con el teclado emulado ────────────────────────────────────────────────────────────
  for (const grande of [false, true]) {
    await letra(grande);
    await tamano(390, 844);
    await ir(`/pro/advisees/anthropometry?id=${estado.aseId}&vista=preparacion`);
    await p.waitForSelector('#ant-protocolo', { timeout: 60000 }).catch(() => {});
    await elegir('#ant-protocolo', 'Perfil antropométrico completo');
    await pausa(900);
    const id = await ultimoCampo();
    await p.keyboard.type('12,5,3');
    await tamano(390, 844 - 330);
    await p.evaluate(() => document.activeElement?.scrollIntoView({ block: 'nearest' }));
    await pausa(500);
    const sufijo = grande ? '-letra-grande' : '';
    await capturar(`e-validacion-1-escrito${sufijo}`);
    await p.evaluate(() => [...document.querySelectorAll('.acciones--fijas button')].find((b) => /Guardar/.test(b.textContent))?.click());
    await pausa(1500);
    const aviso = await p.evaluate(() => {
      const a = document.querySelector('.aviso--error');
      const r = a?.getBoundingClientRect();
      return {
        hayAviso: !!a,
        avisoVisible: !!r && r.top >= 0 && r.top < window.innerHeight,
        focoEnElAviso: !!a && (a === document.activeElement || a.contains(document.activeElement)),
        enlaces: [...(a?.querySelectorAll('a') ?? [])].map((x) => x.textContent),
      };
    });
    registro.push({ nombre: `e-validacion-2-aviso${sufijo}`, campo: id, ...aviso });
    await capturar(`e-validacion-2-aviso${sufijo}`);
    await p.evaluate(() => document.querySelector('.aviso--error a')?.click());
    await pausa(1500);
    registro.push({ nombre: `e-validacion-3-en-el-campo${sufijo}`, ...(await posiciones()) });
    await capturar(`e-validacion-3-en-el-campo${sufijo}`);
    // Un segundo «Guardar» con el error todavía ahí: el aviso vuelve a tomar el foco.
    await p.evaluate(() => [...document.querySelectorAll('.acciones--fijas button')].find((b) => /Guardar/.test(b.textContent))?.click());
    await pausa(1500);
    registro.push({ nombre: `e-validacion-4-segundo-guardar${sufijo}`, ...(await p.evaluate(() => { const a = document.querySelector('.aviso--error'); const r = a?.getBoundingClientRect(); return { focoEnElAviso: !!a && (a === document.activeElement || a.contains(document.activeElement)), avisoVisible: !!r && r.top >= 0 && r.top < window.innerHeight }; })) });
    await capturar(`e-validacion-4-segundo-guardar${sufijo}`);
  }
  await letra(false);

  // ─── El eje de un índice en la evolución ──────────────────────────────────────────────────────────────────────
  for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
    await tamano(ancho, alto);
    await ir(`/pro/advisees/anthropometry?id=${estado.aseId}&vista=evolucion`);
    await p.waitForSelector('#ant-evolucion-metrica', { timeout: 60000 }).catch(() => errores.push('sin selector de métrica'));
    const hay = await elegir('#ant-evolucion-metrica', 'Índice cintura/cadera');
    await pausa(1500);
    const eje = await p.evaluate(() => {
      const textos = [...document.querySelectorAll('.recharts-yAxis text, .yAxis text')].map((x) => x.textContent);
      return { rotulos: textos };
    });
    registro.push({ nombre: `f-evolucion-indice-${ancho}`, hayIndice: hay, ...eje });
    await p.evaluate(() => document.querySelector('.recharts-wrapper')?.scrollIntoView({ block: 'center' }));
    await pausa(500);
    await capturar(`f-evolucion-indice-${ancho}`);
  }

  // ─── La imagen exportada ──────────────────────────────────────────────────────────────────────────────────────
  await tamano(1440, 900);
  await ir(`/pro/advisees/anthropometry?id=${estado.aseId}&vista=lamina`);
  await p.waitForSelector('.lamina__svg', { timeout: 60000 }).catch(() => {});
  await pausa(1500);
  const antes = new Set(fs.readdirSync(dir));
  await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Descargar imagen/.test(b.textContent))?.click());
  for (let i = 0; i < 40; i++) {
    const nuevos = fs.readdirSync(dir).filter((f) => !antes.has(f) && f.endsWith('.png'));
    if (nuevos.length) {
      fs.renameSync(path.join(dir, nuevos[0]), path.join(dir, 'g-exportada.png'));
      const b = fs.readFileSync(path.join(dir, 'g-exportada.png'));
      registro.push({ nombre: 'g-exportada', ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20), bytes: b.length });
      break;
    }
    await pausa(500);
  }
} catch (e) {
  errores.push(String(e));
} finally {
  fs.writeFileSync(path.join(dir, 'registro.json'), JSON.stringify({ registro, errores }, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ capturas: registro.length, errores }, null, 1));
