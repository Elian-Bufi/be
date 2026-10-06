// Capturas deterministas del render en el navegador: Chrome sin pantalla, controlado por su protocolo de depuración (CDP),
// con el WebSocket que trae Node 22. Espera a que carguen las fuentes, a que la escena termine sus acciones y a que el
// ajuste de las etiquetas termine, y recién entonces saca la imagen.
// Uso: node cdp.mjs <salida.png> <ancho> <alto> <url> [espera en ms]
// - ESCALA_DE_PANTALLA=2: la imagen con el doble de píxeles, nítida en un teléfono.
// - AJUSTAR=1: el alto de la pantalla crece hasta mostrar todo el contenido (una captura de la pantalla entera, con la
//   barra flotando al final, como cuando se llega al último contenido).
// Siempre informa: el error de una acción de la escena, si lo hubo, y los textos cortados (con «…» o sin entrar en su
// caja: el control de cortes de INICIO-Y-NAVEGACION, `cortes.js`).
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const [salida, ancho, alto, url, esperaTxt = '6000'] = process.argv.slice(2);
const CORTES = readFileSync(join(AQUI, 'cortes.js'), 'utf8');
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
  const evaluar = async (expression) => (await enviar('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
  const escala = Number(process.env.ESCALA_DE_PANTALLA ?? '1');
  await enviar('Page.enable');
  await enviar('Emulation.setDeviceMetricsOverride', { width: Number(ancho), height: Number(alto), deviceScaleFactor: escala, mobile: false });
  await enviar('Page.navigate', { url });
  for (let i = 0; i < 100 && !eventos.includes('Page.loadEventFired'); i++) await dormir(100);
  await dormir(Number(esperaTxt));
  if (process.env.AJUSTAR === '1') {
    // El contenido del ScrollView de react-native-web: lo que sobra se suma al alto de la pantalla.
    const sobra = await evaluar(`(() => {
      const raiz = document.getElementById('root');
      const desplazables = [...raiz.querySelectorAll('div')].filter((e) => ['auto', 'scroll'].includes(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 1);
      return desplazables.reduce((m, e) => Math.max(m, e.scrollHeight - e.clientHeight), 0);
    })()`);
    if (sobra > 0) {
      // Crecen el teléfono (--alto) y la ventana, lo mismo: lo que rodea al teléfono (el aviso, el título) no cambia.
      const extra = Math.ceil(sobra);
      await evaluar(`(() => { const s = document.documentElement.style; s.setProperty('--alto', (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto')) + ${extra}) + 'px'); })()`);
      await enviar('Emulation.setDeviceMetricsOverride', { width: Number(ancho), height: Number(alto) + extra, deviceScaleFactor: escala, mobile: false });
      await dormir(1500);
    }
  }
  // La ventana, del alto justo de la página: sin franja gris debajo ni nada afuera.
  const pagina = await evaluar('Math.ceil(document.body.getBoundingClientRect().bottom)');
  if (typeof pagina === 'number' && pagina > 0) {
    await enviar('Emulation.setDeviceMetricsOverride', { width: Number(ancho), height: pagina, deviceScaleFactor: escala, mobile: false });
    await dormir(800);
  }
  const informe = await evaluar(`(() => {
    const error = document.body.dataset.error || '';
    const cortes = ${CORTES};
    const extra = ${process.env.EXPRESION ? process.env.EXPRESION : "''"};
    return [error ? 'ERROR DE LA ESCENA: ' + error : '', 'cortes ' + cortes, extra ? String(extra) : ''].filter(Boolean).join(' · ');
  })()`);
  const foto = await enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(salida, Buffer.from(foto.result.data, 'base64'));
  console.log(`${salida.split('/').pop()} · ${informe ?? ''}`);
  ws.close();
} finally {
  chrome.kill();
}
