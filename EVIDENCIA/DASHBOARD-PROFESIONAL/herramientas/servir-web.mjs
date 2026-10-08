// Copia de EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/recorrido/servir-web.mjs. Sirve el export estático del website (apps/web/out) como lo hace Render Static Site, con la MISMA CSP de render.yaml,
// salvo connect-src, que apunta a la API local. Así el recorrido prueba que las imágenes se ven bajo la política real
// (img-src 'self' data:). Uso: node servir-web.mjs <carpeta out> <puerto> <origen de la API>
import { REPO } from './rutas.mjs';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const [raiz = `${REPO}/apps/web/out`, puerto = '3000', api = 'http://localhost:3001'] = process.argv.slice(2);
const CSP = `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ${api}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.woff2': 'font/woff2' };

async function archivo(ruta) {
  const limpia = normalize(decodeURIComponent(ruta.split('?')[0])).replace(/^([/\\])+/, '');
  for (const candidato of [limpia, `${limpia}.html`, join(limpia, 'index.html')]) {
    const completo = join(raiz, candidato);
    if (!completo.startsWith(normalize(raiz))) return null;
    const info = await stat(completo).catch(() => null);
    if (info?.isFile()) return completo;
  }
  return null;
}

createServer(async (req, res) => {
  const ruta = (await archivo(req.url ?? '/')) ?? join(raiz, '404.html');
  const contenido = await readFile(ruta).catch(() => null);
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!contenido) {
    res.statusCode = 404;
    return res.end('no encontrado');
  }
  res.setHeader('Content-Type', TIPOS[extname(ruta)] ?? 'application/octet-stream');
  res.end(contenido);
}).listen(Number(puerto), () => console.log(`web estática en http://localhost:${puerto} (CSP de render.yaml, API ${api})`));
