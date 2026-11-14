// Junta, para cada requisito funcional del 04, lo que el repositorio permite comprobar: su ficha (actor, prioridad,
// obligación, aceptación), el canal y el caso de uso de DV-03, la prueba del plan (12 §5), las operaciones implementadas de
// su familia, los archivos de prueba que lo citan, las DL que lo tocan (con su estado) y los paquetes que lo nombran.
// No decide el estado: deja la evidencia para que el estado se asigne con criterio y se cite.
// Uso: node evidencia-por-requisito.mjs → datos/evidencia-rf.json
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const leer = (r) => readFileSync(join(raiz, r), 'utf8');

// ─── 04: fichas de RF ───────────────────────────────────────────────────────────────────────────
const doc04 = leer('docs/legajo/04_BE_LEG_04_v0.4.2.1.md').split(/\r?\n/);
const rf = [];
let grupo = null;
for (let i = 0; i < doc04.length; i++) {
  const l = doc04[i];
  if (/^## 7\./.test(l)) break;
  const g = l.match(/^### (.+)$/);
  if (g) grupo = g[1].trim();
  const h = l.match(/^#### (RF-\d{3}) — (.+)$/);
  if (!h) continue;
  const ficha = { id: h[1], titulo: h[2].trim(), grupo, linea04: i + 1 };
  for (let j = i + 1; j < doc04.length && !/^#{2,4} /.test(doc04[j]); j++) {
    const c = doc04[j].match(/^- \*\*(.+?):\*\* (.+)$/);
    if (!c) continue;
    const clave = { Actor: 'actor', Prioridad: 'prioridad', 'Obligación': 'obligacion', 'Verificación de aceptación': 'aceptacion', 'Derivación propietaria': 'derivacion', Fuente: 'fuente' }[c[1]];
    if (clave) ficha[clave] = c[2].trim();
  }
  rf.push(ficha);
}

// ─── DV-03: canal, UC y familia ─────────────────────────────────────────────────────────────────
function csv(texto) {
  const filas = [];
  let fila = [];
  let campo = '';
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (comillas) {
      if (ch === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (ch === '"') comillas = false;
      else campo += ch;
    } else if (ch === '"') comillas = true;
    else if (ch === ',') {
      fila.push(campo);
      campo = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else campo += ch;
  }
  if (campo || fila.length) {
    fila.push(campo);
    filas.push(fila);
  }
  const [cab, ...resto] = filas.filter((f) => f.some((x) => x.trim()));
  return resto.map((f) => Object.fromEntries(cab.map((c, k) => [c.replace(/^﻿/, '').trim(), (f[k] ?? '').trim()])));
}
const dv03 = new Map(csv(leer('docs/mesa/MESA_02/DV-03/DV-03_RF_POR_CANAL.csv')).map((f) => [f.ID, f]));

// ─── 12 §5: UC/TR, contrato, UX y prueba del plan ───────────────────────────────────────────────
const doc12 = leer('docs/legajo/12_BE_LEG_12_v1.0-H.md').split(/\r?\n/);
const matriz12 = new Map();
for (const l of doc12) {
  const m = l.match(/^\| `(RF-\d{3})` \| (P\d) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| `([^`]+)` \|/);
  if (m && !matriz12.has(m[1])) matriz12.set(m[1], { prioridad: m[2], capacidad: m[3].trim(), uc: m[4].trim(), contrato: m[5].trim(), ux: m[6].trim(), prueba11A: m[7] });
}

// ─── Operaciones implementadas (openapi.json generado desde el dominio) ─────────────────────────
const openapi = JSON.parse(leer('docs/api/openapi.json'));
const operaciones = [];
for (const [ruta, v] of Object.entries(openapi.paths))
  for (const [metodo, op] of Object.entries(v))
    if (op?.operationId) operaciones.push({ id: op.operationId, metodo: metodo.toUpperCase(), ruta, resumen: op.summary ?? '' });
const familiaDe = (id) => id.replace(/^API-/, '').replace(/-\d{2}.*$/, '');

// ─── Archivos de prueba que citan cada RF ───────────────────────────────────────────────────────
function recorrer(dir, filtro, acc = []) {
  const abs = join(raiz, dir);
  if (!existsSync(abs)) return acc;
  for (const n of readdirSync(abs)) {
    if (n === 'node_modules' || n === 'dist' || n.startsWith('.')) continue;
    const p = join(abs, n);
    const s = statSync(p);
    if (s.isDirectory()) recorrer(relative(raiz, p), filtro, acc);
    else if (filtro(n)) acc.push(relative(raiz, p).replace(/\\/g, '/'));
  }
  return acc;
}
const esPrueba = (n) => /\.(spec|test|int-spec)\.(ts|tsx|mjs|cjs|js)$/.test(n) || /^recorridos\.mjs$/.test(n);
const pruebas = [...recorrer('test', esPrueba), ...recorrer('apps', esPrueba), ...recorrer('packages', esPrueba), ...recorrer('scripts', esPrueba)];
const textoDe = new Map(pruebas.map((p) => [p, readFileSync(join(raiz, p), 'utf8')]));

// ─── DL: estado de la tabla y menciones en el cuerpo ────────────────────────────────────────────
const deuda = leer('docs/DEUDA_LEGAJO.md');
const estadoDL = new Map();
for (const l of deuda.split(/\r?\n/)) {
  const m = l.match(/^\| (DL-\d{3}) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| (.*) \|$/);
  if (m && !estadoDL.has(m[1])) estadoDL.set(m[1], { tema: m[4].trim(), estado: m[5].trim() });
}
const cuerpoDL = new Map();
for (const parte of deuda.split(/\n(?=## DL-\d{3})/)) {
  const m = parte.match(/^## (DL-\d{3})/);
  if (m) cuerpoDL.set(m[1], parte);
}

// ─── Paquetes ───────────────────────────────────────────────────────────────────────────────────
const paquetes = readdirSync(join(raiz, 'docs/paquetes')).filter((n) => n.endsWith('.md'));
const textoPaquete = new Map(paquetes.map((n) => [n, leer(`docs/paquetes/${n}`)]));

const normalizar = (r) => r.replace(/^\/api\/v1/, '').replace(/\?.*$/, '').replace(/\{[^}]+\}|:[a-zA-Z]+/g, '{}').replace(/\/$/, '');
const porRuta = new Map();
for (const o of operaciones) {
  const k = `${o.metodo} ${normalizar(o.ruta)}`;
  if (!porRuta.has(k)) porRuta.set(k, []);
  porRuta.get(k).push(o.id);
}
const citan = (ids) => pruebas.filter((p) => ids.some((id) => new RegExp(`\\b${id.replace(/[-]/g, '\\-')}\\b`).test(textoDe.get(p))));

const resultado = rf.map((f) => {
  const d = dv03.get(f.id) ?? {};
  const m = matriz12.get(f.id) ?? {};
  const familias = (d['Familia API (09)'] ?? '').split(/[\s,/·]+/).filter((x) => /^[A-Z]{2,}(-[A-Z]+)?$/.test(x));
  const re = new RegExp(`\\b${f.id}\\b`);
  // Las operaciones que el 12 §5 nombra por método y ruta, resueltas contra las implementadas.
  const nombradas = [...(m.contrato ?? '').matchAll(/\b(GET|POST|PUT|PATCH|DELETE)\s+(\/[\w/{}:.-]+)/g)].map((x) => `${x[1]} ${normalizar(x[2])}`);
  const delContrato = [...new Set(nombradas.flatMap((k) => porRuta.get(k) ?? []))];
  const ucs = [...new Set(`${d['UC que lo materializa (05)'] ?? ''} ${m.uc ?? ''}`.match(/UC-[PIES]\d{2}/g) ?? [])];
  return {
    ucs,
    rutasDelContrato: nombradas,
    operacionesDelContrato: delContrato,
    rutasSinOperacion: nombradas.filter((k) => !porRuta.has(k)),
    pruebasPorOperacion: citan(delContrato),
    pruebasPorUC: citan(ucs),
    ...f,
    canal: d.Canal ?? null,
    ucDV03: d['UC que lo materializa (05)'] ?? null,
    familias,
    uc12: m.uc ?? null,
    contrato12: m.contrato ?? null,
    prueba11A: m.prueba11A ?? null,
    operacionesDeLaFamilia: operaciones.filter((o) => familias.includes(familiaDe(o.id))).map((o) => `${o.id} ${o.metodo} ${o.ruta}`),
    pruebasQueLoCitan: pruebas.filter((p) => re.test(textoDe.get(p))),
    dl: [...cuerpoDL.entries()].filter(([, t]) => re.test(t)).map(([id]) => ({ id, ...(estadoDL.get(id) ?? {}) })),
    paquetes: paquetes.filter((n) => re.test(textoPaquete.get(n))),
  };
});

writeFileSync(join(aqui, '../datos/evidencia-rf.json'), JSON.stringify({ generado: new Date().toISOString(), requisitos: resultado }, null, 1));
const sinPrueba = resultado.filter((r) => !r.pruebasQueLoCitan.length).map((r) => r.id);
console.log(`requisitos: ${resultado.length} · archivos de prueba leídos: ${pruebas.length} · sin prueba que lo cite: ${sinPrueba.length} (${sinPrueba.join(' ')})`);
