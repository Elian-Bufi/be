// El profesional ve lo persistido (H01): después de que el asesorado registró las dos sesiones en la APK, la pestaña
// Ejecuciones muestra, por serie, el objetivo histórico frente a la carga, las repeticiones y el RIR informados, y los
// tiempos con su certeza. Los valores esperados salen de lo que el recorrido de la APK dejó en apk.json, calculados con
// el guion del reloj y el paquete; ninguno se escribe a mano acá.
// - «Piernas A»: todo medido (el guion de DECISIONES_Y_TIEMPOS.md).
// - «Recuperación de prueba» y «Recuperación con el reloj del arranque»: la app se cerró con un descanso abierto, que queda
//   incompleto; el total queda estimado con el reloj del proceso y medido con el del arranque.
// Uso: node recorrido-web-ejecuciones.mjs   (lee estado.json y apk.json; escribe recorrido-web-ejecuciones.json)
import { REPO, enTrabajo } from './rutas.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');
const dominio = require(`${REPO}/packages/domain/dist/index.js`);

const estado = JSON.parse(fs.readFileSync(enTrabajo('estado.json'), 'utf8'));
const apk = JSON.parse(fs.readFileSync(enTrabajo('apk.json'), 'utf8'));
const WEB = 'http://localhost:3000';
const CRED = 'clave-sintetica-de-prueba-01';
const dir = enTrabajo('capturas-web/');
fs.mkdirSync(dir, { recursive: true });
const controles = [];
const control = (nombre, ok, detalle = '') => {
  controles.push({ nombre, ok: !!ok, detalle: String(detalle).slice(0, 600) });
  console.log(`${ok ? '✓' : '✗'} ${nombre}${detalle ? ` · ${String(detalle).slice(0, 220)}` : ''}`);
};

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--lang=es-AR'], defaultViewport: { width: 1280, height: 900 } });
const page = await browser.newPage();
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
const esperarTexto = (t, ms = 60000) => page.waitForFunction((x) => document.body.innerText.includes(x), { timeout: ms }, t);
async function escribir(sel, valor) {
  await page.waitForSelector(sel, { timeout: 30000 });
  await page.$eval(sel, (el) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.type(sel, valor);
}

/** Abre el detalle de la ejecución de esa sesión y devuelve sus tablas por serie y sus tiempos. */
async function leerEjecucion(sesion) {
  await page.evaluate((s) => {
    const li = [...document.querySelectorAll('li.lista__item')].find((x) => x.querySelector('.lista__titulo')?.textContent.includes(s));
    const d = li.querySelector('details');
    if (!d.open) li.querySelector('details summary').click();
  }, sesion);
  await page.waitForFunction(
    (s) => {
      const li = [...document.querySelectorAll('li.lista__item')].find((x) => x.querySelector('.lista__titulo')?.textContent.includes(s));
      return li && (li.innerText.includes('Tiempo transcurrido') || li.innerText.includes('no tiene tiempos'));
    },
    { timeout: 60000 },
    sesion,
  );
  return page.evaluate((s) => {
    const li = [...document.querySelectorAll('li.lista__item')].find((x) => x.querySelector('.lista__titulo')?.textContent.includes(s));
    const tablas = [...li.querySelectorAll('table.tabla--objetivos')].map((t) => ({ titulo: t.querySelector('caption')?.innerText.trim(), filas: [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('th, td')].map((c) => c.innerText.replace(/\s+/g, ' ').trim())) }));
    const tiempos = {};
    for (const dt of li.querySelectorAll('dl.datos-de-tiempo dt')) tiempos[dt.innerText.trim()] = dt.nextElementSibling?.innerText.trim();
    li.scrollIntoView();
    return { tablas, tiempos };
  }, sesion);
}
const fila = (tablas, ejercicio, n) => tablas.find((t) => t.titulo === ejercicio)?.filas.find((f) => f[0] === String(n));

try {
  await page.goto(`${WEB}/login?volver=${encodeURIComponent(`/pro/advisees/training?id=${estado.aseId}`)}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await escribir('#correo', estado.proCorreo);
  await escribir('#contrasena', CRED);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {}), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => location.pathname.startsWith('/pro/advisees/training'), { timeout: 60000 });
  control('después del login vuelve a la pestaña Entrenamiento del asesorado', true);
  await page.evaluate((u) => window.next.router.push(u), `/pro/advisees/training?id=${estado.aseId}&vista=ejecuciones`);
  await esperarTexto('Sesiones registradas', 90000);
  await page.waitForFunction(() => document.querySelectorAll('li.lista__item details summary').length >= 2, { timeout: 90000 });

  // ─── «Piernas A»: el plan histórico de cada serie y los tiempos medidos ───────────────────────
  const piernas = await leerEjecucion(apk.piernas.sesion);
  for (const s of apk.piernas.series) {
    const f = fila(piernas.tablas, s.ejercicio, s.setIndex);
    const registrado = [dominio.cantidad(s.carga.value, s.carga.unit), `${s.repeticiones} rep.`, ...(s.rir === null ? [] : [`RIR ${dominio.numero(s.rir)}`])].join(' · ');
    control(`${s.ejercicio} · serie ${s.setIndex}: el plan histórico «${s.plan}» y lo registrado «${registrado}»`, f && f[1] === s.plan && f[2] === registrado, JSON.stringify(f));
  }
  for (const r of apk.piernas.descansos) control(`${r.ejercicio} · descanso de la serie ${r.setIndex}: «${r.texto}»`, fila(piernas.tablas, r.ejercicio, r.setIndex)?.[4] === r.texto, JSON.stringify(fila(piernas.tablas, r.ejercicio, r.setIndex)));
  for (const m of apk.piernas.seriesCronometradas) control(`${m.ejercicio} · serie ${m.setIndex}: «${m.texto}»`, fila(piernas.tablas, m.ejercicio, m.setIndex)?.[5] === m.texto, JSON.stringify(fila(piernas.tablas, m.ejercicio, m.setIndex)));
  for (const [etiqueta, valor] of Object.entries(apk.piernas.tiemposEsperados)) control(`«${apk.piernas.sesion}» · ${etiqueta}: «${valor}»`, piernas.tiempos[etiqueta] === valor, JSON.stringify(piernas.tiempos));
  await page.screenshot({ path: fileURLToPath(new URL('07-ejecucion-piernas-a-por-serie-y-tiempos.png', dir)), fullPage: true });

  // ─── Las dos recuperaciones: lo que cruzó un cierre de la app ─────────────────────────────────
  // Con el reloj del proceso queda estimado; con el del arranque, medido. El valor esperado es el que calculó la API, que el
  // recorrido de la APK ya comparó con sus propias anclas (a no más de `toleranciaMs`): acá se exige que el profesional vea
  // exactamente eso, con su calidad. Precierre del 2026-10-06, §3: ya no hay pisos.
  for (const [i, r] of [apk.recuperacion, apk.recuperacionDelArranque].entries()) {
    const ejecucion = await leerEjecucion(r.sesion);
    for (const x of r.descansos) control(`«${r.sesion}» · ${x.ejercicio} · el descanso que quedó abierto al cerrarse la app: «${x.texto}»`, fila(ejecucion.tablas, x.ejercicio, x.setIndex)?.[4] === x.texto, JSON.stringify(fila(ejecucion.tablas, x.ejercicio, x.setIndex)));
    for (const [etiqueta, valor] of Object.entries(r.tiemposEsperados)) {
      control(`«${r.sesion}» · ${etiqueta}: «${valor}» (el cálculo de la API, a ${r.anclas.calculadoMs - r.anclas.esperadoMs} ms de las anclas del recorrido)`, ejecucion.tiempos[etiqueta] === valor, JSON.stringify(ejecucion.tiempos));
    }
    await page.screenshot({ path: fileURLToPath(new URL(`${String(8 + i).padStart(2, '0')}-ejecucion-${r.reloj === 'arranque' ? 'recuperacion-medida-con-el-reloj-del-arranque' : 'recuperacion-estimada-e-incompleta'}.png`, dir)), fullPage: true });
  }
} catch (e) {
  control('el recorrido terminó sin errores', false, e.stack ?? String(e));
  await page.screenshot({ path: fileURLToPath(new URL('error-ejecuciones.png', dir)), fullPage: true }).catch(() => {});
} finally {
  control('sin errores de página ni de CSP', errores.filter((e) => !/favicon/.test(e)).length === 0, errores.join(' | '));
  fs.writeFileSync(enTrabajo('recorrido-web-ejecuciones.json'), JSON.stringify({ controles }, null, 2));
  await browser.close();
  const fallas = controles.filter((c) => !c.ok).length;
  console.log(`${controles.length - fallas}/${controles.length} controles`);
  process.exit(fallas ? 1 : 0);
}
