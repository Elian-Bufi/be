// Sirve el render de la APK en el navegador (react-native-web) y reenvía /api/* a la API local, para que la pantalla
// real hable con la API real desde el mismo origen. En el teléfono la imagen la descarga el código nativo y no rige la
// política CORP del navegador; acá, el mismo origen la evita sin tocar la API.
// Uso: node servir-arnes.mjs <carpeta del render> <puerto> <origen de la API>
import { createServer, request } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const [raiz, puerto = '3002', api = 'http://localhost:3001'] = process.argv.slice(2);
const destino = new URL(api);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };

createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) {
    const reenvio = request({ hostname: destino.hostname, port: destino.port, path: req.url, method: req.method, headers: { ...req.headers, host: destino.host } }, (r) => {
      res.writeHead(r.statusCode ?? 502, r.headers);
      r.pipe(res);
    });
    reenvio.on('error', () => {
      res.statusCode = 502;
      res.end();
    });
    return req.pipe(reenvio);
  }
  const ruta = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^([/\\])+/, '') || 'index.html';
  const completo = join(raiz, ruta);
  const info = await stat(completo).catch(() => null);
  if (!completo.startsWith(normalize(raiz)) || !info?.isFile()) {
    res.statusCode = 404;
    return res.end('no encontrado');
  }
  res.setHeader('Content-Type', TIPOS[extname(completo)] ?? 'application/octet-stream');
  res.end(await readFile(completo));
}).listen(Number(puerto), () => console.log(`arnés en http://localhost:${puerto}, /api → ${api}`));
