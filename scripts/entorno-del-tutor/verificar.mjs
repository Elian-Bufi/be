// WP-ENTORNO-DEL-TUTOR (DL-184) · el verificador automático (REQ-TUT-71 y 42): arma la historia de la muestra, aplica las
// reglas de verosimilitud (reglas.mjs) y la matriz de los gráficos por persona (matriz.mjs), y falla si algo no se
// cumple. No toca la base ni la API.
//
// Uso:  node scripts/entorno-del-tutor/verificar.mjs [--origen AAAA-MM-DD] [--hoy AAAA-MM-DD] [--salida <carpeta>]
//   --origen  el día en que se arma la muestra (por omisión, hoy en Buenos Aires);
//   --hoy     hasta dónde llega la historia (por omisión, el origen): para probar «ponerse al día»;
//   --salida  dónde dejar el informe (informe.md e informe.json).
//   BE_TUTOR_NOMBRES_REALES (opcional): un archivo FUERA del repositorio con los nombres de personas reales (uno por
//   renglón) contra los que se cruzan los de la muestra (REQ-TUT-45). El archivo no se imprime ni se copia.
// Requiere el dominio compilado (`npm run build:domain`): R-TXT-01 usa la guardia de vocabulario de BE.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { REPO } from './catalogo.mjs';
import { generar, huellaDe, hoyEnBuenosAires } from './historia.mjs';
import { rarezasDe, verificar } from './reglas.mjs';
import { verificarMatriz } from './matriz.mjs';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .join(' ')
    .split(/\s*--/)
    .filter(Boolean)
    .map((x) => x.split(/\s+/)),
);
const origen = args.origen ?? hoyEnBuenosAires();
const hoy = args.hoy ?? origen;

export function cargarDominio() {
  const ruta = path.join(REPO, 'packages/domain/dist/index.js');
  return fs.existsSync(ruta) ? createRequire(ruta)(ruta) : null;
}

export function nombresReales() {
  const archivo = process.env.BE_TUTOR_NOMBRES_REALES;
  if (!archivo) return [];
  if (path.resolve(archivo).startsWith(path.resolve(REPO))) throw new Error('BE_TUTOR_NOMBRES_REALES tiene que estar fuera del repositorio.');
  return fs.readFileSync(archivo, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

/** El resumen por persona (REQ-TUT-17 y 9): cuánto trae cada una, para el informe y para comparar con la carga. */
export function resumen(historia) {
  return historia.personas.map((p) => ({
    persona: p.nombre,
    desde: p.inicio,
    hasta: p.fin ?? 'hoy',
    areas: Object.entries(p.areas).map(([a, q]) => `${a.slice(0, 3)}:${q}`).join(' '),
    versionesTrn: p.trn.versiones.length,
    sesiones: p.trn.sesiones.length,
    conTiempos: p.trn.sesiones.filter((s) => s.tiempos).length,
    versionesNut: p.nut.versiones.length,
    comidas: p.nut.comidas.length,
    diferentes: p.nut.comidas.filter((c) => c.diferente).length,
    tomas: p.tomas.length,
    revisiones: p.revisiones.length,
    notas: p.notas.length,
    notasDeSesion: p.notasDeSesion.length,
    ...rarezasDe(p),
  }));
}

function informe(historia, v, m) {
  const l = [];
  const fallas = v.resultado.filter((x) => x.fallas.length);
  l.push(`# Verificación de la muestra del tutor (WP-ENTORNO-DEL-TUTOR, DL-184)`, '');
  l.push(`Semilla \`${historia.semilla}\`, origen ${historia.origen}, hoy ${historia.hoy}. Huella de la historia: \`${huellaDe(historia)}\`.`, '');
  l.push(`**${v.ok && m.ok ? 'Todo cumple.' : 'HAY FALLAS: la carga no corre.'}** Reglas: ${v.resultado.length - fallas.length} de ${v.resultado.length} cumplen. Matriz: ${m.celdas.filter((c) => c.ok).length} de ${m.celdas.length} celdas.`, '');
  l.push('## Las reglas', '', '| Regla | Quién | Resultado |', '|---|---|---|');
  for (const x of v.resultado) if (x.fallas.length || x.persona === 'la muestra') l.push(`| ${x.regla} | ${x.persona} | ${x.fallas.length ? `falla: ${x.fallas.slice(0, 3).join('; ').replace(/\|/g, '/')}${x.fallas.length > 3 ? ` (y ${x.fallas.length - 3} más)` : ''}` : 'cumple'} |`);
  l.push('', `Las demás ${v.resultado.filter((x) => !x.fallas.length && x.persona !== 'la muestra').length} combinaciones de regla y persona cumplen.`, '');
  l.push('## La matriz de los gráficos', '', '| ID | Gráfico | En BE | Persona | Se espera | Tiene el dato | Cumple |', '|---|---|---|---|---|---|---|');
  for (const c of m.celdas) l.push(`| ${c.id} | ${c.grafico} | ${c.estado} | ${c.persona} | ${c.esperado} | ${c.hay ? 'sí' : 'no'} | ${c.ok ? 'sí' : '**no**'} |`);
  l.push('', '## Lo que trae cada persona', '');
  const r = resumen(historia);
  const cols = Object.keys(r[0]);
  l.push(`| ${cols.join(' | ')} |`, `|${cols.map(() => '---').join('|')}|`);
  for (const x of r) l.push(`| ${cols.map((c) => x[c]).join(' | ')} |`);
  return `${l.join('\n')}\n`;
}

export function correr({ origen, hoy, salida = null }) {
  const historia = generar({ origen, hoy });
  const v = verificar(historia, { dominio: cargarDominio(), nombresReales: nombresReales() });
  const m = verificarMatriz(historia);
  const texto = informe(historia, v, m);
  if (salida) {
    fs.mkdirSync(salida, { recursive: true });
    fs.writeFileSync(path.join(salida, 'informe.md'), texto);
    fs.writeFileSync(path.join(salida, 'informe.json'), `${JSON.stringify({ semilla: historia.semilla, origen, hoy, huella: huellaDe(historia), reglas: v.resultado, matriz: m.celdas, resumen: resumen(historia) }, null, 2)}\n`);
  }
  return { historia, ok: v.ok && m.ok, v, m, texto };
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/').replace(/^\//, '')}` || import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const { historia, ok, v, m } = correr({ origen, hoy, salida: args.salida ?? null });
  for (const x of v.resultado.filter((y) => y.fallas.length)) {
    console.log(`FALLA ${x.regla} · ${x.persona}`);
    for (const f of x.fallas.slice(0, 5)) console.log(`   ${f}`);
    if (x.fallas.length > 5) console.log(`   (y ${x.fallas.length - 5} más)`);
  }
  for (const c of m.celdas.filter((y) => !y.ok)) console.log(`FALLA matriz ${c.id} · ${c.persona}: se espera «${c.esperado}» y ${c.hay ? 'tiene' : 'no tiene'} el dato`);
  console.log(`Origen ${origen}, hoy ${hoy}, huella ${huellaDe(historia).slice(0, 16)}. Reglas: ${v.resultado.filter((x) => !x.fallas.length).length}/${v.resultado.length}. Matriz: ${m.celdas.filter((c) => c.ok).length}/${m.celdas.length}. ${ok ? 'TODO CUMPLE' : 'HAY FALLAS'}`);
  process.exit(ok ? 0 : 1);
}
