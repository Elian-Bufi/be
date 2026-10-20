// El entorno de los recorridos de navegador (bloque 6 del encargo de consolidación, 2026-10-19): la API compilada y el
// export estático del website, locales, contra una base PostgreSQL local DECLARADA. Nada de acá toca test ni producción.
// - La base se declara con BE_RECORRIDOS_DATABASE_URL: sin ella no arranca nada, y tiene que ser local y llamarse
//   be_recorridos* (un script de demostración no cae en silencio en otra base).
// - El website se sirve con la MISMA política de contenido de render.yaml, leída de ahí; solo cambia el origen de la API.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const PUERTO_API = 3101;
export const PUERTO_WEB = 3100;
export const API = `http://localhost:${PUERTO_API}`;
export const WEB = `http://localhost:${PUERTO_WEB}`;

/** La base de los recorridos: declarada, local y propia. Si no, se aborta antes de hacer nada. */
export function baseDeclarada() {
  const url = process.env.BE_RECORRIDOS_DATABASE_URL;
  if (!url) throw new Error('Falta BE_RECORRIDOS_DATABASE_URL: la base de los recorridos se declara (local, be_recorridos*).');
  const u = new URL(url);
  if (!['localhost', '127.0.0.1'].includes(u.hostname)) throw new Error('Guardia: la base de los recorridos tiene que ser local. Abortado.');
  if (!/^\/be_recorridos[a-z0-9_]*$/.test(u.pathname)) throw new Error('Guardia: la base de los recorridos se llama be_recorridos*. Abortado.');
  return url;
}

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Arranca la API compilada (apps/api/dist). El secreto de firma se genera por corrida y no se imprime. Los límites de
 * frecuencia son los de siempre salvo el de altas: cada recorrido registra sus propias cuentas sintéticas, y el
 * limitador se prueba en las pruebas de integración, no acá.
 */
export async function arrancarApi({ demoProfesionales = '', salida }) {
  const env = {
    ...process.env,
    APP_ENV: 'test',
    PORT: String(PUERTO_API),
    DATABASE_URL: baseDeclarada(),
    JWT_SECRET: randomBytes(36).toString('base64url'),
    BCRYPT_COST: '10',
    TRUST_PROXY_HOPS: '0',
    CORS_ALLOWED_ORIGINS: WEB,
    BE_DEMO_PROFESIONALES: demoProfesionales,
    RATE_LIMIT_REGISTRO_MAX: '200',
  };
  const proceso = spawn(process.execPath, [join(REPO, 'apps/api/dist/main.js')], { cwd: REPO, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const registro = [];
  const anotar = (b) => {
    registro.push(b.toString());
    if (registro.length > 400) registro.splice(0, registro.length - 400);
  };
  proceso.stdout.on('data', anotar);
  proceso.stderr.on('data', anotar);
  for (let i = 0; i < 90; i++) {
    if (proceso.exitCode !== null) break;
    const ok = await fetch(`${API}/health/ready`).then((r) => r.ok).catch(() => false);
    if (ok) return { proceso, registro: () => registro.join(''), parar: () => parar(proceso) };
    await pausa(1000);
  }
  if (salida) process.stderr.write(registro.join('').slice(-4000));
  proceso.kill();
  throw new Error('La API no respondió /health/ready a tiempo.');
}

async function parar(proceso) {
  if (proceso.exitCode !== null) return;
  proceso.kill('SIGTERM');
  for (let i = 0; i < 20 && proceso.exitCode === null; i++) await pausa(250);
  if (proceso.exitCode === null) proceso.kill('SIGKILL');
}

/** La política de contenido de render.yaml (el servicio web), con la API local en connect-src. */
export function politicaDeContenido() {
  const yaml = readFileSync(join(REPO, 'render.yaml'), 'utf8');
  const m = /name: Content-Security-Policy\s+value: "([^"]+)"/.exec(yaml);
  if (!m) throw new Error('No encontré la CSP en render.yaml.');
  return m[1].replace(/https:\/\/be-api-[a-z0-9-]+\.onrender\.com/g, API);
}

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

/** Sirve apps/web/out como Render Static Site: la ruta, la ruta.html o la ruta/index.html; si no, 404.html. */
export function servirWeb() {
  const raiz = join(REPO, 'apps/web/out');
  const csp = politicaDeContenido();
  const archivo = async (ruta) => {
    const limpia = normalize(decodeURIComponent(ruta.split('?')[0])).replace(/^([/\\])+/, '');
    for (const candidato of [limpia, `${limpia}.html`, join(limpia, 'index.html')]) {
      const completo = join(raiz, candidato);
      if (!completo.startsWith(normalize(raiz))) return null;
      const info = await stat(completo).catch(() => null);
      if (info?.isFile()) return completo;
    }
    return null;
  };
  const servidor = createServer(async (req, res) => {
    const encontrado = await archivo(req.url ?? '/');
    const ruta = encontrado ?? join(raiz, '404.html');
    const contenido = await readFile(ruta).catch(() => null);
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!contenido) {
      res.statusCode = 404;
      return res.end('no encontrado');
    }
    if (!encontrado) res.statusCode = 404;
    res.setHeader('Content-Type', TIPOS[extname(ruta)] ?? 'application/octet-stream');
    res.end(contenido);
  });
  return new Promise((ok) => servidor.listen(PUERTO_WEB, () => ok({ cerrar: () => new Promise((c) => servidor.close(c)) })));
}
