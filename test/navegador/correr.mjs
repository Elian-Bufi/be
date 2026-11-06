// Corre los recorridos de navegador de punta a punta (bloque 6 del encargo de consolidación, 2026-10-19).
//
// Uso:  BE_RECORRIDOS_DATABASE_URL=postgresql://usuario:clave@localhost:5432/be_recorridos node test/navegador/correr.mjs [carpeta de resultados] [--solo sesion,pistas]
//
// Requiere la API y el website ya compilados: `npm run build:api` y el export del website con
// `BE_API_BASE_URL=http://localhost:3101 npm run build:web`. CHROME apunta al navegador (por omisión, el de Linux en la CI
// o el de Windows). La base se declara siempre y tiene que ser local (ver entorno.mjs): las migraciones se aplican ahí.
//
// Pasos: migraciones → API → cuentas de cada recorrido → API de nuevo, con la habilitación de esos profesionales
// (DL-036) → datos de cada recorrido → website con la CSP de render.yaml → recorridos → resultados.json.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { arrancarApi, baseDeclarada, REPO, servirWeb } from './entorno.mjs';
import { cuentas, datos, nuevaCorrida } from './preparar.mjs';
import { correrRecorridos } from './recorridos.mjs';

const argumentos = process.argv.slice(2);
const indiceSolo = argumentos.indexOf('--solo');
const solo = indiceSolo >= 0 ? argumentos[indiceSolo + 1].split(',') : null;
const salida = resolve(argumentos.find((a, i) => !a.startsWith('--') && i !== indiceSolo + 1) ?? 'resultados-recorridos');
const chrome =
  process.env.CHROME ?? (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');

const base = baseDeclarada();
for (const necesario of ['apps/api/dist/main.js', 'apps/web/out/index.html', 'packages/domain/dist/index.js']) {
  if (!existsSync(join(REPO, necesario))) throw new Error(`Falta ${necesario}: compilá antes (ver el encabezado).`);
}
mkdirSync(salida, { recursive: true });

console.log('migraciones…');
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'deploy'], {
  cwd: REPO,
  env: { ...process.env, DATABASE_URL: base },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const corrida = nuevaCorrida();
let api = await arrancarApi({ salida });
let web = null;
let resultados = [];
try {
  console.log(`cuentas de la corrida ${corrida}…`);
  const { estado, demo } = await cuentas(corrida);
  await api.parar();
  api = await arrancarApi({ demoProfesionales: demo, salida });
  console.log('datos de cada recorrido…');
  await datos(estado);
  // El estado tiene correos e identificadores sintéticos de esta corrida; la credencial es la sintética de api.mjs.
  writeFileSync(join(salida, 'estado.json'), JSON.stringify({ corrida, estado }, null, 2));
  web = await servirWeb();
  resultados = await correrRecorridos({ estado, salida, chrome, solo });
} finally {
  writeFileSync(join(salida, 'api.log'), api.registro());
  await web?.cerrar();
  await api.parar();
}

const fallas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - fallas.length} de ${resultados.length} recorridos bien${fallas.length ? `; fallaron: ${fallas.map((f) => f.nombre).join(', ')}` : ''}. Resultados en ${salida}`);
process.exit(fallas.length ? 1 : 0);
