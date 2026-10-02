#!/usr/bin/env node
// DV-10 · Captura de las fuentes de git y de GitHub que fechan la historia del Gantt.
//
// Solo lectura: git log, git rev-list, git merge-base, gh repo view, gh pr list, gh api
// (GET de los commits de un PR) y gh release list. No escribe nada fuera de esta carpeta.
//
// Uso, desde la raíz del repositorio y con `gh` autenticado:
//   node docs/mesa/MESA_02/DV-10/capturar-fuentes-git.cjs [--hasta <commit>]
//
// --hasta fija el corte. Por defecto es c61b8f5, el HEAD del 2026-10-02 sobre el que se armó
// el DV-10. Entran los PR integrados, los releases publicados y los commits hasta ese commit,
// así que repetir la captura después da el mismo resultado mientras no se reescriba la historia.
//
// Escribe, al lado de este archivo:
//   DV-10_FUENTES_PR.csv        un PR por fila: primer commit, integración y forma del merge
//   DV-10_FUENTES_RELEASES.csv  un release de la APK por fila: publicación y commit del tag
//   DV-10_COMMITS_POR_DIA.csv   commits por día, con cuántos son merges
//
// Las horas se dan en UTC (como las devuelve gh) y en hora argentina (UTC-3, sin horario de
// verano desde 2009), que es la que usa el Gantt.
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HASTA_POR_DEFECTO = 'c61b8f524c804551b0b874af568dbbb417b86c4e';
const DESTINO = __dirname;

function ejecutar(programa, argumentos) {
  return execFileSync(programa, argumentos, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
}

function argumento(nombre, porDefecto) {
  const i = process.argv.indexOf(nombre);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : porDefecto;
}

// Hora argentina: UTC-3 fijo.
function aArgentina(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error('fecha inválida: ' + iso);
  return new Date(d.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ');
}

function aUtc(iso) {
  return new Date(iso).toISOString().replace('.000Z', 'Z');
}

function campoCsv(valor) {
  const s = valor === null || valor === undefined ? '' : String(valor);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function escribirCsv(nombre, encabezado, filas) {
  const lineas = [encabezado.join(',')].concat(filas.map((f) => encabezado.map((c) => campoCsv(f[c])).join(',')));
  fs.writeFileSync(path.join(DESTINO, nombre), lineas.join('\n') + '\n', 'utf8');
  console.log('escrito ' + nombre + ': ' + filas.length + ' filas');
}

const raiz = ejecutar('git', ['rev-parse', '--show-toplevel']);
process.chdir(raiz);

const hasta = ejecutar('git', ['rev-parse', argumento('--hasta', HASTA_POR_DEFECTO)]);
const hastaFecha = ejecutar('git', ['log', '-1', '--format=%cI', hasta]);
const hastaMs = new Date(hastaFecha).getTime();
const repo = ejecutar('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
console.log('repositorio ' + repo + ' · corte ' + hasta.slice(0, 7) + ' (' + hastaFecha + ')');

// ---- PR integrados -------------------------------------------------------------------------
const prs = JSON.parse(
  ejecutar('gh', [
    'pr', 'list', '--state', 'merged', '--limit', '1000',
    '--json', 'number,title,headRefName,createdAt,mergedAt,mergeCommit',
  ]),
)
  .filter((p) => new Date(p.mergedAt).getTime() <= hastaMs)
  .sort((a, b) => a.number - b.number);

const filasPr = prs.map((p) => {
  const merge = p.mergeCommit && p.mergeCommit.oid;
  if (!merge) throw new Error('PR #' + p.number + ' sin commit de merge');
  // El merge tiene que estar en la historia del corte: si no, la fuente no es verificable desde aquí.
  execFileSync('git', ['merge-base', '--is-ancestor', merge, hasta]);
  const padres = ejecutar('git', ['rev-list', '--parents', '-n', '1', merge]).split(' ').slice(1);
  let fechas;
  let forma;
  if (padres.length === 2) {
    // Merge con dos padres: los commits del PR son los alcanzables desde la rama y no desde main.
    forma = 'merge';
    fechas = ejecutar('git', ['log', '--format=%aI', padres[0] + '..' + padres[1]]).split('\n').filter(Boolean);
  } else {
    // Squash: los commits del PR no están en la historia de main; se leen de GitHub.
    forma = 'squash';
    fechas = ejecutar('gh', [
      'api', '--paginate', 'repos/' + repo + '/pulls/' + p.number + '/commits', '--jq', '.[].commit.author.date',
    ]).split('\n').filter(Boolean);
  }
  if (fechas.length === 0) throw new Error('PR #' + p.number + ' sin commits propios');
  const primera = fechas.map((f) => new Date(f).getTime()).reduce((a, b) => Math.min(a, b));
  return {
    numero: p.number,
    rama: p.headRefName,
    titulo: p.title,
    primer_commit_utc: aUtc(new Date(primera).toISOString()),
    primer_commit_art: aArgentina(new Date(primera).toISOString()),
    creado_utc: aUtc(p.createdAt),
    integrado_utc: aUtc(p.mergedAt),
    integrado_art: aArgentina(p.mergedAt),
    commit_merge: merge.slice(0, 7),
    forma,
    commits_en_pr: fechas.length,
  };
});
escribirCsv(
  'DV-10_FUENTES_PR.csv',
  ['numero', 'rama', 'titulo', 'primer_commit_utc', 'primer_commit_art', 'creado_utc', 'integrado_utc', 'integrado_art', 'commit_merge', 'forma', 'commits_en_pr'],
  filasPr,
);

// ---- Releases de la APK ---------------------------------------------------------------------
const releases = JSON.parse(
  ejecutar('gh', ['release', 'list', '--limit', '1000', '--json', 'tagName,name,publishedAt,isLatest']),
)
  .filter((r) => new Date(r.publishedAt).getTime() <= hastaMs)
  .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));

const filasRelease = releases.map((r) => {
  let commit = '';
  try {
    commit = ejecutar('git', ['rev-list', '-n', '1', r.tagName]).slice(0, 7);
  } catch (e) {
    commit = 'tag ausente en el clon';
  }
  return {
    tag: r.tagName,
    nombre: r.name,
    publicado_utc: aUtc(r.publishedAt),
    publicado_art: aArgentina(r.publishedAt),
    commit_del_tag: commit,
    latest_al_capturar: r.isLatest ? 'sí' : 'no',
  };
});
escribirCsv(
  'DV-10_FUENTES_RELEASES.csv',
  ['tag', 'nombre', 'publicado_utc', 'publicado_art', 'commit_del_tag', 'latest_al_capturar'],
  filasRelease,
);

// ---- Commits por día ------------------------------------------------------------------------
const porDia = new Map();
for (const linea of ejecutar('git', ['log', '--format=%aI %P', hasta]).split('\n').filter(Boolean)) {
  const partes = linea.split(' ');
  const dia = aArgentina(partes[0]).slice(0, 10);
  const registro = porDia.get(dia) || { fecha_art: dia, commits: 0, merges: 0 };
  registro.commits += 1;
  if (partes.length - 1 > 1) registro.merges += 1;
  porDia.set(dia, registro);
}
escribirCsv(
  'DV-10_COMMITS_POR_DIA.csv',
  ['fecha_art', 'commits', 'merges'],
  Array.from(porDia.values()).sort((a, b) => (a.fecha_art < b.fecha_art ? -1 : 1)),
);
