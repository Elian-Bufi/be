// Extrae las 56 fichas de casos de uso del documento canónico 05 (docs/legajo/05_BE_LEG_05_v0.15.md), sin reescribirlas,
// y les suma: el canal y el actor del índice de DV-04, y la evidencia que cita cada caso en el repositorio (pruebas, DL,
// paquetes, evidencias). Correspondencias de campos para casos incluidos y de extensión, que el 05 escribe distinto:
//   disparador ← «Disparador» | «Invocado por» (incluidos) | «Condición de extensión» (extensiones)
//   flujo      ← «Flujo principal» | «Flujo incluido» | «Flujo diferencial»
// Uso: node casos-de-uso.mjs → datos/casos-de-uso.json
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '../../../..');
const leer = (r) => readFileSync(join(raiz, r), 'utf8').replace(/\r/g, '');
const limpio = (s) => s.replace(/`/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();

// ─── Índice de DV-04 (canal y actor derivados) ────────────────────────────────────────────────────
const dv04 = leer('docs/mesa/MESA_02/DV-04/DV-04_FICHAS.md');
const indice = new Map();
for (const l of dv04.slice(dv04.indexOf('## Índice de los 56 casos')).split('\n')) {
  const m = l.match(/^\| `(UC-[PIES]\d{2})` \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]*) \|$/);
  if (m) indice.set(m[1], { tipo: m[2].trim(), nombre: m[3].trim(), canal: m[4].trim(), actor: m[5].trim(), rfIndice: m[6].match(/RF-\d{3}/g) ?? [] });
}

// ─── Fichas del 05 ───────────────────────────────────────────────────────────────────────────────
const doc05 = leer('docs/legajo/05_BE_LEG_05_v0.15.md');
const lineas05 = doc05.split('\n');
const CAMPOS = {
  Objetivo: 'objetivo', 'Actor principal': 'actorPrincipal', 'Actores secundarios': 'actoresSecundarios', Disparador: 'disparador',
  'Invocado por': 'disparador', 'Condición de extensión': 'disparador', Precondiciones: 'precondiciones',
  'Postcondiciones de éxito': 'postcondiciones', Postcondiciones: 'postcondiciones', 'Garantías mínimas': 'garantias',
  'Flujo principal': 'flujo', 'Flujo incluido': 'flujo', 'Flujo diferencial': 'flujo', Variantes: 'variantes', Variante: 'variantes',
  Excepciones: 'excepciones', 'Requisitos relacionados': 'requisitos', 'Casos incluidos': 'incluidos', 'Casos extendidos': 'extendidos',
  'Casos relacionados': 'relacionados', 'Criterio de cierre': 'cierre', Tipo: 'tipo05', Alcance: 'alcance',
};
const ORIGEN_DISPARADOR = { Disparador: 'disparador', 'Invocado por': 'invocado', 'Condición de extensión': 'extension' };

/** Ítems de una lista (numerada o con viñetas); subtítulos ##### y subítems se integran al texto. */
function items(bloque) {
  const res = [];
  let prefijo = '';
  for (const l of bloque.split('\n')) {
    const sub = l.match(/^#####\s+[0-9.]*\s*(.+)$/);
    if (sub) {
      prefijo = limpio(sub[1]);
      continue;
    }
    const m = l.match(/^(\s*)(?:\d+\.|-|\*)\s+(.*)$/);
    if (m && m[1].length < 2) res.push((prefijo ? `${prefijo}: ` : '') + limpio(m[2]));
    else if (m && res.length) res[res.length - 1] += (/[:;]$/.test(res[res.length - 1]) ? ' ' : '; ') + limpio(m[2]);
    else if (l.trim() && !/^#/.test(l) && res.length) res[res.length - 1] += ' ' + limpio(l);
    else if (l.trim() && !/^#/.test(l) && !res.length) res.push((prefijo ? `${prefijo}: ` : '') + limpio(l));
  }
  return res.map((x) => x.replace(/:\s*;/g, ':').replace(/;\s*;/g, ';'));
}
/** Variantes y excepciones: «V01 — Título» (como subtítulo ##### o en negrita) con su resultado. */
function alternativas(bloque) {
  const res = [];
  const partes = bloque.split(/\n(?=#####\s|\*\*[VE]\d{2}\b)/);
  for (const p of partes) {
    const h = p.match(/^(?:#####\s+[0-9.]*\s*|\*\*)([VE]\d{2})\s*[—-]\s*([^*\n]+)/);
    if (!h) continue;
    const cuerpo = p.slice(h[0].length).replace(/^\*\*/, '');
    const resultado = (cuerpo.match(/(?:\*\*)?Resultado:?(?:\*\*)?:?\s*([^\n]+)/) || [])[1];
    const condicion = cuerpo.replace(/(?:\*\*)?Resultado:?(?:\*\*)?:?\s*[^\n]+/, '').split('\n').filter((l) => l.trim()).map(limpio).join(' ');
    res.push({ id: h[1], titulo: limpio(h[2]), condicion: condicion || null, resultado: resultado ? limpio(resultado) : null });
  }
  return res;
}

const fichas = new Map();
const cabeceras = [];
lineas05.forEach((l, i) => {
  const m = l.match(/^### ([0-9.]+)\s+(UC-[PIES]\d{2}) — (.+)$/);
  if (m) cabeceras.push({ i, seccion: m[1].replace(/\.$/, ''), id: m[2], nombre: limpio(m[3]) });
});
cabeceras.forEach((c, k) => {
  const fin = k + 1 < cabeceras.length ? cabeceras[k + 1].i : lineas05.findIndex((l, j) => j > c.i && /^## /.test(l));
  const cuerpo = lineas05.slice(c.i + 1, fin > 0 ? fin : undefined);
  const f = { id: c.id, nombre: c.nombre, seccion05: c.seccion, linea05: c.i + 1 };
  let actual = null;
  let buffer = [];
  const volcar = () => {
    if (!actual) return;
    const texto = buffer.join('\n').trim();
    const campo = CAMPOS[actual];
    if (!campo) return;
    if (campo === 'variantes' || campo === 'excepciones') f[campo] = [...(f[campo] ?? []), ...alternativas(texto)];
    else if (['objetivo', 'actorPrincipal', 'cierre', 'tipo05'].includes(campo)) f[campo] = limpio(texto.split('\n').filter((x) => !/^#/.test(x)).join(' '));
    else if (campo === 'disparador') {
      f.disparador = items(texto).join(' ') || limpio(texto);
      f.origenDelDisparador = ORIGEN_DISPARADOR[actual];
    } else if (campo === 'requisitos') {
      f.rf = [...new Set(texto.match(/RF-\d{3}/g) ?? [])];
      f.rnf = [...new Set(texto.match(/RNF-[A-Z]+-\d{3}/g) ?? [])];
    } else if (['incluidos', 'extendidos', 'relacionados'].includes(campo)) f[campo] = [...new Set(texto.match(/UC-[PIES]\d{2}|TR-\d{2}/g) ?? [])];
    else if (campo === 'flujo') {
      const nuevos = items(texto);
      f.flujo = [...(f.flujo ?? []), ...nuevos];
      f.origenDelFlujo = actual;
    } else f[campo] = [...(f[campo] ?? []), ...items(texto)];
  };
  for (const l of cuerpo) {
    const h = l.match(/^####\s+[0-9.]+\s+(.+?)\s*$/);
    if (h) {
      volcar();
      const titulo = h[1].replace(/\s+—.*$/, '').trim();
      actual = CAMPOS[titulo] ? titulo : Object.keys(CAMPOS).find((k) => titulo.startsWith(k + ' ')) ?? titulo;
      buffer = [];
    } else buffer.push(l);
  }
  volcar();
  fichas.set(c.id, f);
});

// ─── Evidencia en el repositorio ──────────────────────────────────────────────────────────────────
function recorrer(dir, filtro, acc = []) {
  const abs = join(raiz, dir);
  if (!existsSync(abs)) return acc;
  for (const n of readdirSync(abs)) {
    if (['node_modules', 'dist', '.git', 'exports', 'source'].includes(n) || n.startsWith('.')) continue;
    const p = join(abs, n);
    if (statSync(p).isDirectory()) recorrer(relative(raiz, p), filtro, acc);
    else if (filtro(n)) acc.push(relative(raiz, p).replace(/\\/g, '/'));
  }
  return acc;
}
const esPrueba = (n) => /\.(spec|test|int-spec)\.(ts|tsx|mjs|cjs|js)$/.test(n) || n === 'recorridos.mjs';
const pruebas = ['test', 'apps', 'packages', 'scripts'].flatMap((d) => recorrer(d, esPrueba));
const contenido = new Map(pruebas.map((p) => [p, readFileSync(join(raiz, p), 'utf8')]));
const deuda = leer('docs/DEUDA_LEGAJO.md');
const cuerpoDL = new Map(deuda.split(/\n(?=## DL-\d{3})/).map((t) => [t.match(/^## (DL-\d{3})/)?.[1], t]).filter(([k]) => k));
const estadoDL = new Map();
for (const l of deuda.split('\n')) {
  const m = l.match(/^\| (DL-\d{3}) \| [^|]* \| [^|]* \| ([^|]*) \| (.*) \|$/);
  if (m && !estadoDL.has(m[1])) estadoDL.set(m[1], { tema: m[2].trim(), estado: m[3].trim() });
}
const paquetes = readdirSync(join(raiz, 'docs/paquetes')).filter((n) => n.endsWith('.md'));
const textoPaquete = new Map(paquetes.map((n) => [n, leer(`docs/paquetes/${n}`)]));
const documentos = recorrer('EVIDENCIA', (n) => n === 'LEEME.md').concat(recorrer('DEFENSA', (n) => n.endsWith('.md')));
const textoDocumento = new Map(documentos.map((p) => [p, readFileSync(join(raiz, p), 'utf8')]));

const resultado = [...fichas.values()].map((f) => {
  const i = indice.get(f.id) ?? {};
  const re = new RegExp(`\\b${f.id}\\b`);
  return {
    ...f,
    tipo: i.tipo ?? null,
    canal: i.canal ?? null,
    actor: i.actor ?? null,
    rf: [...new Set([...(f.rf ?? []), ...(i.rfIndice ?? [])])].sort(),
    evidencia: {
      pruebas: pruebas.filter((p) => re.test(contenido.get(p))),
      dl: [...cuerpoDL.entries()].filter(([, t]) => re.test(t)).map(([id]) => ({ id, ...(estadoDL.get(id) ?? {}) })),
      paquetes: paquetes.filter((n) => re.test(textoPaquete.get(n))),
      documentos: documentos.filter((p) => re.test(textoDocumento.get(p))),
    },
  };
});

writeFileSync(join(aqui, '../datos/casos-de-uso.json'), JSON.stringify({ fuente: 'docs/legajo/05_BE_LEG_05_v0.15.md (fichas) + docs/mesa/MESA_02/DV-04/DV-04_FICHAS.md (índice)', generado: new Date().toISOString(), casos: resultado }, null, 1));
const faltan = (k) => resultado.filter((r) => !r[k] || (Array.isArray(r[k]) && !r[k].length)).map((r) => r.id);
console.log(`casos: ${resultado.length}`);
for (const k of ['objetivo', 'actorPrincipal', 'disparador', 'precondiciones', 'flujo', 'variantes', 'excepciones', 'postcondiciones', 'rf']) console.log(`  sin ${k}: ${faltan(k).join(' ') || '—'}`);
