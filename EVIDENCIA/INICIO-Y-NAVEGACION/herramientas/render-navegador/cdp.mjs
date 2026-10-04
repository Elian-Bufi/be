// Capturas deterministas del render en el navegador: Chrome sin pantalla, controlado por su protocolo de depuración (CDP),
// con el WebSocket que trae Node 22. Espera a que carguen las fuentes y a que el ajuste de las etiquetas termine, y
// recién entonces saca la imagen. También devuelve las mediciones de las etiquetas (data-ajuste, data-cortado).
// Uso: node cdp.mjs <salida.png> <ancho> <alto> <url> [espera en ms]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const [salida, ancho, alto, url, esperaTxt = '6000'] = process.argv.slice(2);
const PUERTO = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--allow-file-access-from-files',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${join(AQUI, 'perfil-cdp')}`,
  `--remote-debugging-port=${PUERTO}`,
  `--window-size=${ancho},${alto}`,
  'about:blank',
]);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function objetivo() {
  for (let i = 0; i < 50; i++) {
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json();
      const pagina = lista.find((t) => t.type === 'page');
      if (pagina) return pagina.webSocketDebuggerUrl;
    } catch {
      /* Chrome todavía arranca */
    }
    await dormir(200);
  }
  throw new Error('Chrome no respondió');
}

try {
  const ws = new WebSocket(await objetivo());
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const pendientes = new Map();
  const eventos = [];
  ws.addEventListener('message', (m) => {
    const datos = JSON.parse(m.data);
    if (datos.id && pendientes.has(datos.id)) {
      pendientes.get(datos.id)(datos);
      pendientes.delete(datos.id);
    } else if (datos.method) eventos.push(datos.method);
  });
  const enviar = (method, params = {}) =>
    new Promise((r) => {
      const n = ++id;
      pendientes.set(n, r);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  await enviar('Page.enable');
  await enviar('Emulation.setDeviceMetricsOverride', { width: Number(ancho), height: Number(alto), deviceScaleFactor: 1, mobile: false });
  await enviar('Page.navigate', { url });
  for (let i = 0; i < 100 && !eventos.includes('Page.loadEventFired'); i++) await dormir(100);
  // Las fuentes de la página y de sus marcos, y el tiempo para que el ajuste corra con ellas.
  await dormir(Number(esperaTxt));
  const medicion = await enviar('Runtime.evaluate', {
    expression: process.env.EXPRESION || `(() => {
      const docs = [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)];
      return docs.map((d) => [...d.querySelectorAll('[data-ajuste]')].map((e) => e.textContent + ' ' + e.dataset.ajuste + (e.dataset.cortado === 'si' ? ' CORTADO' : '')).join('; ')).join(' | ');
    })()`,
    returnByValue: true,
  });
  const foto = await enviar('Page.captureScreenshot', { format: 'png' });
  writeFileSync(salida, Buffer.from(foto.result.data, 'base64'));
  console.log(`${salida} · ${medicion.result?.result?.value ?? ''}`);
  ws.close();
} finally {
  chrome.kill();
}
