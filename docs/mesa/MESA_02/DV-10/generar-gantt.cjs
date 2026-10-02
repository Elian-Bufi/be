#!/usr/bin/env node
// DV-10 · Gantt de BE: figura, verificación falsable y tablas del documento.
//
// Sin dependencias: solo fs, path y child_process de Node. git se usa en modo lectura, para
// fechar los commits que cita DV-10_FASES.csv.
//
// Uso, desde la raíz del repositorio:
//   node docs/mesa/MESA_02/DV-10/generar-gantt.cjs
//
// Lee:     DV-10_FASES.csv · DV-10_DEPENDENCIAS.csv · DV-10_FUENTES_PR.csv ·
//          DV-10_FUENTES_RELEASES.csv · DV-10_COMMITS_POR_DIA.csv · docs/actas/*.md
//          y los archivos que citan las fases.
// Escribe: DV-10_GANTT.svg · DV-10_VERIFICACION.txt · las tablas de DV-10_GANTT.md que van
//          entre los marcadores <!-- generado:… -->.
// Sale con código 1 si alguna verificación falla. Las fuentes de git y GitHub se vuelven a
// capturar con capturar-fuentes-git.cjs.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const RAIZ = path.resolve(DIR, '..', '..', '..', '..');
const CORTE = { fecha: '2026-10-02', hora: '15:45', commit: 'c61b8f5' };
const EJE = { desde: '2026-09-05', hasta: '2026-10-19' }; // días incluidos en el eje
const MIN_DIA = 1440;

if (!fs.existsSync(path.join(RAIZ, 'docs', 'MANIFEST.sha256'))) {
  throw new Error('no encuentro la raíz del repositorio desde ' + DIR);
}

// ---------------------------------------------------------------------------------------------
// CSV y fechas
// ---------------------------------------------------------------------------------------------

function leerCsv(nombre) {
  const texto = fs.readFileSync(path.join(DIR, nombre), 'utf8').replace(/^﻿/, '');
  const filas = [];
  let fila = [];
  let campo = '';
  let comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else comillas = false;
      } else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo);
      campo = '';
      if (fila.length > 1 || fila[0] !== '') filas.push(fila);
      fila = [];
    } else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
  const [encabezado, ...resto] = filas;
  return resto.map((f, n) => {
    if (f.length !== encabezado.length) {
      throw new Error(`${nombre}: la fila ${n + 2} tiene ${f.length} campos y el encabezado ${encabezado.length}`);
    }
    const o = {};
    encabezado.forEach((h, k) => { o[h] = f[k]; });
    return o;
  });
}

// Los minutos se cuentan en hora argentina, tratada como si fuera UTC: así no hay husos en juego.
function minutos(fecha, hora) {
  const [a, m, d] = fecha.split('-').map(Number);
  const [hh, mm] = (hora || '00:00').split(':').map(Number);
  return Date.UTC(a, m - 1, d, hh, mm) / 60000;
}
const deFechaHora = (texto) => minutos(texto.slice(0, 10), texto.slice(11, 16) || '00:00');
const fechaDe = (min) => new Date(min * 60000).toISOString().slice(0, 10);
const horaDe = (min) => new Date(min * 60000).toISOString().slice(11, 16);
const diaMes = (fecha) => fecha.slice(8, 10) + '/' + fecha.slice(5, 7);
const lista = (texto) => (texto || '').split(';').map((s) => s.trim()).filter(Boolean);

function expandirPrs(texto) {
  const numeros = [];
  for (const parte of lista(texto)) {
    const [a, b] = parte.split('-').map(Number);
    for (let n = a; n <= (b || a); n++) numeros.push(n);
  }
  return numeros;
}

// ---------------------------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------------------------

const fases = leerCsv('DV-10_FASES.csv');
const dependencias = leerCsv('DV-10_DEPENDENCIAS.csv');
const prs = new Map(leerCsv('DV-10_FUENTES_PR.csv').map((p) => [Number(p.numero), p]));
const releases = leerCsv('DV-10_FUENTES_RELEASES.csv');
const releasePorTag = new Map(releases.map((r) => [r.tag, r]));
const commitsPorDia = leerCsv('DV-10_COMMITS_POR_DIA.csv').map((d) => ({ ...d, commits: Number(d.commits), merges: Number(d.merges) }));
const porId = new Map(fases.map((f) => [f.id, f]));

// Actas: el ID sale del nombre del archivo y la fecha también (ACTA_DIR_033_1_…_2026-09-09.md).
// Se separa por «_» en vez de usar una sola expresión regular: más fácil de leer y de revisar.
const actas = new Map();
for (const archivo of fs.readdirSync(path.join(RAIZ, 'docs', 'actas'))) {
  const partes = archivo.split('_');
  const fecha = /(\d{4}-\d{2}-\d{2})\.md$/.exec(archivo);
  if (partes[0] !== 'ACTA' || partes[1] !== 'DIR' || !/^\d{3}$/.test(partes[2]) || !fecha) continue;
  const id = /^\d$/.test(partes[3]) ? `${partes[2]}.${partes[3]}` : partes[2];
  if (actas.has(id)) throw new Error(`dos archivos para ACTA-DIR-${id}: ${actas.get(id).archivo} y ${archivo}`);
  actas.set(id, { archivo, fecha: fecha[1] });
}

const cacheCommits = new Map();
function minutoDeCommit(sha) {
  if (!cacheCommits.has(sha)) {
    let valor = null;
    try {
      const iso = execFileSync('git', ['log', '-1', '--format=%aI', sha], { cwd: RAIZ, encoding: 'utf8' }).trim();
      // Se truncan los segundos, igual que en DV-10_FUENTES_PR.csv (15:04:39 es 15:04).
      valor = Math.floor((new Date(iso).getTime() - 3 * 3600 * 1000) / 60000);
    } catch (e) {
      valor = null;
    }
    cacheCommits.set(sha, valor);
  }
  return cacheCommits.get(sha);
}

// ---------------------------------------------------------------------------------------------
// Verificación de cada fase
// ---------------------------------------------------------------------------------------------

const resultados = []; // { nivel: 'OK' | 'FALLA' | 'AVISO', id, texto }
const anotar = (nivel, id, texto) => resultados.push({ nivel, id, texto });
const corteMin = minutos(CORTE.fecha, CORTE.hora);

for (const f of fases) {
  f.fuentes = [];
  for (const id of lista(f.actas)) {
    const a = actas.get(id);
    if (!a) { anotar('FALLA', f.id, `no hay archivo de ACTA-DIR-${id} en docs/actas`); continue; }
    const texto = fs.readFileSync(path.join(RAIZ, 'docs', 'actas', a.archivo), 'utf8');
    if (texto.includes(a.fecha)) anotar('OK', f.id, `ACTA-DIR-${id}: el nombre y el texto dicen ${a.fecha}`);
    else anotar('FALLA', f.id, `ACTA-DIR-${id}: el texto no repite la fecha del nombre (${a.fecha})`);
    const d = minutos(a.fecha);
    f.fuentes.push({ inicio: d, fin: d + MIN_DIA, precision: 'dia', origen: `ACTA-DIR-${id}` });
  }
  for (const n of expandirPrs(f.prs)) {
    const p = prs.get(n);
    if (!p) { anotar('FALLA', f.id, `el PR #${n} no está entre los integrados (DV-10_FUENTES_PR.csv)`); continue; }
    f.fuentes.push({ inicio: deFechaHora(p.primer_commit_art), fin: deFechaHora(p.integrado_art), precision: 'minuto', origen: `PR #${n}` });
  }
  for (const sha of lista(f.commits)) {
    const t = minutoDeCommit(sha);
    if (t === null) { anotar('FALLA', f.id, `el commit ${sha} no está en la historia de git`); continue; }
    f.fuentes.push({ inicio: t, fin: t, precision: 'minuto', origen: `commit ${sha}` });
  }
  const tags = f.releases === 'todas' ? releases.map((r) => r.tag) : lista(f.releases);
  for (const tag of tags) {
    const r = releasePorTag.get(tag);
    if (!r) { anotar('FALLA', f.id, `el release ${tag} no está en DV-10_FUENTES_RELEASES.csv`); continue; }
    const t = deFechaHora(r.publicado_art);
    f.fuentes.push({ inicio: t, fin: t, precision: 'minuto', origen: tag });
  }

  // Envolvente de las fuentes: de la más temprana a la más tardía.
  if (f.fuentes.length) {
    const ini = f.fuentes.reduce((a, b) => (b.inicio < a.inicio ? b : a));
    const fin = f.fuentes.reduce((a, b) => (b.fin > a.fin ? b : a));
    f.env = {
      inicio: { t: ini.inicio, precision: ini.precision, finExclusivo: false },
      fin: { t: fin.fin, precision: fin.precision, finExclusivo: fin.precision === 'dia' },
    };
    f.envDesde = fechaDe(f.env.inicio.t);
    f.envHasta = fechaDe(f.env.fin.finExclusivo ? f.env.fin.t - 1 : f.env.fin.t);
  }

  // Citas textuales: «ruta::texto», separadas por « || ».
  for (const cita of (f.citas || '').split(' || ').map((s) => s.trim()).filter(Boolean)) {
    const k = cita.indexOf('::');
    const ruta = cita.slice(0, k);
    const literal = cita.slice(k + 2);
    const absoluta = path.join(RAIZ, ruta);
    if (!fs.existsSync(absoluta)) { anotar('FALLA', f.id, `la cita apunta a ${ruta}, que no existe`); continue; }
    if (fs.readFileSync(absoluta, 'utf8').includes(literal)) anotar('OK', f.id, `${ruta} dice «${literal}»`);
    else anotar('FALLA', f.id, `${ruta} no contiene «${literal}»`);
  }

  const historia = f.tramo === 'HISTORIA';
  if (f.tipo === 'sin_fecha') {
    if (f.inicio || f.fin) anotar('FALLA', f.id, 'se declara sin fecha pero tiene fechas');
    else if (f.fuentes.length) anotar('FALLA', f.id, 'se declara sin fecha pero tiene fuentes fechadas');
    else anotar('OK', f.id, 'sin fuente fechada y sin fecha, como se declara');
    continue;
  }
  if (historia) {
    if (!f.fuentes.length) { anotar('FALLA', f.id, 'fase pasada sin acta, commit, PR ni release'); continue; }
    if (f.fin > CORTE.fecha) anotar('FALLA', f.id, `termina después del corte (${f.fin})`);
    if (f.tipo === 'barra' || f.tipo === 'releases') {
      if (f.inicio === f.envDesde && f.fin === f.envHasta) {
        anotar('OK', f.id, `${f.inicio} → ${f.fin} coincide con sus fuentes (${f.fuentes.length})`);
      } else {
        anotar('FALLA', f.id, `declara ${f.inicio} → ${f.fin}, y sus fuentes dan ${f.envDesde} → ${f.envHasta}`);
      }
    } else if (f.tipo === 'hito') {
      if (f.inicio !== f.fin) anotar('FALLA', f.id, 'un hito tiene una sola fecha');
      if (f.inicio >= f.envDesde && f.inicio <= f.envHasta) {
        anotar('OK', f.id, `${f.inicio} cae dentro de sus fuentes (${f.envDesde} → ${f.envHasta})`);
      } else {
        anotar('FALLA', f.id, `${f.inicio} cae fuera de sus fuentes (${f.envDesde} → ${f.envHasta})`);
      }
      if (f.hora) {
        const buscado = minutos(f.inicio, f.hora);
        const fuente = f.fuentes.find((s) => s.precision === 'minuto' && (s.inicio === buscado || s.fin === buscado));
        if (fuente) anotar('OK', f.id, `la hora ${f.hora} es la de ${fuente.origen}`);
        else anotar('FALLA', f.id, `ninguna fuente tiene la hora ${f.hora}`);
      }
    } else anotar('FALLA', f.id, `tipo desconocido: ${f.tipo}`);
  } else {
    if (f.fuentes.length) anotar('FALLA', f.id, 'una fila del plan no puede apoyarse en fuentes pasadas');
    if (f.inicio && f.inicio < CORTE.fecha) anotar('FALLA', f.id, `el plan empieza antes del corte (${f.inicio})`);
    if (/PLAN — SUJETO A GATE|A VERIFICAR/.test(f.estado)) anotar('OK', f.id, `rotulada «${f.estado}»`);
    else anotar('FALLA', f.id, 'una fila del plan tiene que llevar «PLAN — SUJETO A GATE» o «A VERIFICAR»');
  }
}

// Posición de cada fase en el tiempo, para dibujar y para comprobar dependencias.
for (const f of fases) {
  if (f.tipo === 'sin_fecha') continue;
  if (f.tipo === 'hito') {
    const t = f.hora ? minutos(f.inicio, f.hora) : minutos(f.inicio) + MIN_DIA / 2;
    const punto = { t, precision: f.hora ? 'minuto' : 'dia', finExclusivo: false };
    f.pos = { inicio: punto, fin: punto, hito: true };
  } else if (f.tramo === 'HISTORIA') {
    f.pos = { inicio: f.env.inicio, fin: f.env.fin, hito: false };
  } else {
    // Plan: arranca en el corte (o el día que diga) y termina al final de su último día.
    const desde = f.inicio === CORTE.fecha ? { t: corteMin, precision: 'minuto', finExclusivo: false }
      : { t: minutos(f.inicio), precision: 'dia', finExclusivo: false };
    f.pos = { inicio: desde, fin: { t: minutos(f.fin) + MIN_DIA, precision: 'dia', finExclusivo: true }, hito: false };
  }
}

// ---------------------------------------------------------------------------------------------
// Dependencias
// ---------------------------------------------------------------------------------------------

const fechaExtremo = (e) => fechaDe(e.finExclusivo ? e.t - 1 : e.t);
// ¿x ocurre en el mismo momento que y o después? Con minutos si las dos fuentes los tienen; si no, por día.
function noAntes(x, y) {
  if (x.precision === 'minuto' && y.precision === 'minuto') return x.t >= y.t;
  return fechaExtremo(x) >= fechaExtremo(y);
}

for (const d of dependencias) {
  const a = porId.get(d.de);
  const b = porId.get(d.a);
  const nombre = `${d.de} → ${d.a} (${d.tipo})`;
  d.resultado = '';
  if (!a || !b) { anotar('FALLA', nombre, 'una de las dos fases no existe'); d.resultado = 'FALLA'; continue; }
  if (!a.pos || !b.pos) { anotar('FALLA', nombre, 'una de las dos fases no tiene fecha'); d.resultado = 'FALLA'; continue; }
  let cumple;
  if (d.tipo === 'FS' || d.tipo === 'INVERTIDA') cumple = noAntes(b.pos.inicio, a.pos.fin);
  else if (d.tipo === 'SS') cumple = noAntes(b.pos.inicio, a.pos.inicio);
  else if (d.tipo === 'FF') cumple = noAntes(b.pos.fin, a.pos.fin);
  else { anotar('FALLA', nombre, 'tipo de dependencia desconocido'); d.resultado = 'FALLA'; continue; }
  if (d.tipo === 'INVERTIDA') {
    // Se declara invertida porque el orden natural no se respetó: tiene que seguir sin respetarse.
    d.resultado = cumple ? 'FALLA' : 'invertida, como se declaró';
    anotar(cumple ? 'FALLA' : 'OK', nombre, cumple ? 'se declaró invertida pero el orden se respeta' : `${d.a} empieza antes de que termine ${d.de}: la inversión declarada es real`);
  } else {
    d.resultado = cumple ? 'se cumple' : 'NO se cumple';
    anotar(cumple ? 'OK' : 'FALLA', nombre, cumple ? 'el orden de las fuentes la respeta' : 'el orden de las fuentes no la respeta');
  }
}

// ---------------------------------------------------------------------------------------------
// Cobertura: PR y releases
// ---------------------------------------------------------------------------------------------

const prsUsados = new Set();
fases.forEach((f) => expandirPrs(f.prs).forEach((n) => prsUsados.add(n)));
const prsSinFase = [...prs.keys()].filter((n) => !prsUsados.has(n)).sort((x, y) => x - y);
for (const n of prsSinFase) {
  anotar('AVISO', `PR #${n}`, `no está en ninguna fase («${prs.get(n).titulo}»): va a la tabla de omisiones`);
}
anotar('OK', 'cobertura', `${prsUsados.size} de ${prs.size} PR integrados tienen fase; ${releases.length} releases en el carril de la APK`);

// ---------------------------------------------------------------------------------------------
// Figura
// ---------------------------------------------------------------------------------------------

const FUENTE = "Inter, 'Segoe UI', Helvetica, Arial, sans-serif";
const C = {
  tinta: '#0F1C2E', secundario: '#3D4A5C', tenue: '#6B7A90', linea: '#C9D3E0', grilla: '#E6EBF1',
  cebra: '#F7F9FB', fondo: '#FFFFFF', plan: '#EEF2F7', planBorde: '#6B7A90', hueco: '#F1F2F4', punteado: '#AEB8C6',
  grupo: { 'Especificación': '#1F5FBF', 'Transición': '#C98F2C', 'Construcción': '#1FA97A', APK: '#0F1C2E', Plan: '#6B7A90' },
  invertida: '#C98F2C', columnas: '#1F5FBF',
};
const ENCABEZADO_GRUPO = {
  'Especificación': 'ESPECIFICACIÓN · fechada por actas (ACTA-DIR-021 a 033.2)',
  'Transición': 'TRANSICIÓN · intake, WP-01 y gate de implementación',
  'Construcción': 'CONSTRUCCIÓN · del primer commit al último merge de cada paquete',
  APK: 'APK · releases y hitos M0 a M3 del 02 §19.3',
  Plan: 'PLAN — SUJETO A GATE · desde el corte del 2026-10-02',
};

const X_ID = 40;
const X_TEXTO = 78;
const X0 = 570;
const ANCHO_DIA = 24;
const DIAS = (minutos(EJE.hasta) - minutos(EJE.desde)) / MIN_DIA + 1;
const X1 = X0 + DIAS * ANCHO_DIA;
const ANCHO = X1 + 40;
const ALTO_FILA = 30;
const ALTO_GRUPO = 28;
const Y_EJE = 196;
const Y_FILAS = 208;
const x = (min) => X0 + ((min - minutos(EJE.desde)) / MIN_DIA) * ANCHO_DIA;
const anchoTexto = (texto, tam) => texto.length * tam * 0.55;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;
const txt = (xx, yy, contenido, attrs = {}) => {
  const a = Object.entries({ 'font-family': FUENTE, ...attrs }).map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
  return `<text x="${r1(xx)}" y="${r1(yy)}" ${a}>${esc(contenido)}</text>`;
};

// Disposición vertical.
let y = Y_FILAS;
let grupoActual = null;
const encabezados = [];
let indice = 0;
for (const f of fases) {
  if (f.grupo !== grupoActual) {
    encabezados.push({ grupo: f.grupo, y });
    y += ALTO_GRUPO;
    grupoActual = f.grupo;
  }
  f.y = y;
  f.yc = y + 15;
  f.par = indice % 2 === 1;
  y += ALTO_FILA;
  indice++;
}
const Y_FIN_FILAS = y;
const Y_HIST = Y_FIN_FILAS + 26;
const ALTO_HIST = 60;
const Y_BASE_HIST = Y_HIST + ALTO_HIST;
const Y_NOTAS = Y_BASE_HIST + 40;
const NOTAS = [
  'Cómo se lee: cada barra de construcción va del primer commit al último merge de sus PR, en hora argentina (UTC−3). Las fases fechadas solo por actas ocupan días enteros, porque las actas no tienen hora.',
  'Las actas fechan decisiones, no esfuerzo: las 15 del 06 al 09/09 registran aprobaciones y autorizaciones, no el tiempo de redacción. Las actas 001 a 020 no están en el repositorio (ACTA-DIR-034, Nota 3): lo anterior al 06/09 no se dibuja.',
  'La única dependencia invertida es WP-01: se ejecutó antes de la firma del gate y ACTA-DIR-034 lo ratificó (DL-001). Fuente: DV-10_FASES.csv y DV-10_DEPENDENCIAS.csv; figura generada con generar-gantt.cjs.',
];
const ALTO = Y_NOTAS + NOTAS.length * 17 + 24;

const xCorte = x(corteMin);
const t04 = porId.get('T04');
const xActa = x(t04.pos.inicio.t);
const capas = { fondo: [], bandas: [], grilla: [], etiquetas: [], marcas: [], flechas: [], encima: [] };

capas.fondo.push(`<rect width="${ANCHO}" height="${ALTO}" fill="${C.fondo}"/>`);

// Título, bajada y leyenda.
capas.encima.push(txt(ANCHO / 2, 40, 'Figura DV-10.1 — Gantt de BE: historia respaldada y plan sujeto a gate', { 'font-size': 19, 'font-weight': 700, fill: C.tinta, 'text-anchor': 'middle' }));
capas.encima.push(txt(ANCHO / 2, 62, 'Cada fase pasada cita su acta, commit, PR o release; lo que no tiene fuente va sin fecha. Corte: 2026-10-02 15:45, commit c61b8f5. Plan: hasta el vencimiento de la base de test.', { 'font-size': 12.5, 'font-weight': 500, fill: C.tenue, 'text-anchor': 'middle' }));
capas.encima.push(`<line x1="${X_ID}" y1="78" x2="${ANCHO - 40}" y2="78" stroke="${C.linea}"/>`);

const leyenda = [
  { tipo: 'barra', color: C.grupo['Especificación'], texto: 'Especificación (actas)' },
  { tipo: 'barra', color: C.grupo['Transición'], texto: 'Transición: intake y gate' },
  { tipo: 'barra', color: C.grupo['Construcción'], texto: 'Construcción (PR integrados)' },
  { tipo: 'hito', color: C.tinta, texto: 'Hito' },
  { tipo: 'release', color: C.tinta, texto: 'Release de la APK' },
  { tipo: 'plan', texto: 'Plan — sujeto a gate' },
  { tipo: 'sinfecha', texto: 'Sin fuente · sin fecha' },
  { tipo: 'flecha', texto: 'Dependencia' },
  { tipo: 'invertida', texto: 'Dependencia invertida' },
];
{
  let lx = X_ID;
  const ly = 100;
  for (const item of leyenda) {
    if (item.tipo === 'barra') capas.encima.push(`<rect x="${lx}" y="${ly - 6}" width="22" height="12" rx="3" fill="${item.color}"/>`);
    if (item.tipo === 'hito') capas.encima.push(`<path d="M${lx + 11} ${ly - 7}l7 7l-7 7l-7-7z" fill="${item.color}"/>`);
    if (item.tipo === 'release') capas.encima.push(`<line x1="${lx + 11}" y1="${ly - 7}" x2="${lx + 11}" y2="${ly + 7}" stroke="${item.color}" stroke-width="1.6"/>`);
    if (item.tipo === 'plan') capas.encima.push(`<rect x="${lx}" y="${ly - 6}" width="22" height="12" rx="3" fill="${C.fondo}" stroke="${C.planBorde}" stroke-width="1.4" stroke-dasharray="4 3"/>`);
    if (item.tipo === 'sinfecha') capas.encima.push(`<line x1="${lx}" y1="${ly}" x2="${lx + 22}" y2="${ly}" stroke="${C.punteado}" stroke-width="1.6" stroke-dasharray="1 3" stroke-linecap="round"/>`);
    if (item.tipo === 'flecha') capas.encima.push(`<path d="M${lx} ${ly}h18" stroke="${C.tenue}" stroke-width="1.2" fill="none" marker-end="url(#flecha)"/>`);
    if (item.tipo === 'invertida') capas.encima.push(`<path d="M${lx} ${ly}h18" stroke="${C.invertida}" stroke-width="1.4" stroke-dasharray="2 3" fill="none" marker-end="url(#flecha-invertida)"/>`);
    capas.encima.push(txt(lx + 28, ly + 4, item.texto, { 'font-size': 10.5, fill: C.secundario }));
    lx += 28 + anchoTexto(item.texto, 10.5) + 24;
  }
}

// Eje: meses, días y referencias.
{
  const desde = minutos(EJE.desde);
  const meses = [];
  for (let d = 0; d < DIAS; d++) {
    const t = desde + d * MIN_DIA;
    const f = fechaDe(t);
    const fecha = new Date(t * 60000);
    const lunes = fecha.getUTCDay() === 1;
    const clave = f.slice(0, 7);
    if (!meses.length || meses[meses.length - 1].clave !== clave) meses.push({ clave, desde: d, hasta: d });
    else meses[meses.length - 1].hasta = d;
    capas.grilla.push(txt(x(t) + ANCHO_DIA / 2, Y_EJE - 8, String(Number(f.slice(8, 10))), {
      'font-size': 9.5, 'font-weight': lunes ? 600 : 500, fill: lunes ? C.secundario : C.tenue, 'text-anchor': 'middle',
    }));
    capas.grilla.push(`<line x1="${r1(x(t))}" y1="${Y_EJE - 4}" x2="${r1(x(t))}" y2="${Y_EJE}" stroke="${C.linea}"/>`);
    if (lunes) capas.grilla.push(`<line x1="${r1(x(t))}" y1="${Y_EJE}" x2="${r1(x(t))}" y2="${Y_BASE_HIST}" stroke="${C.grilla}"/>`);
  }
  const nombres = { '09': 'septiembre 2026', '10': 'octubre 2026' };
  for (const m of meses) {
    const xa = x(desde + m.desde * MIN_DIA);
    const xb = x(desde + (m.hasta + 1) * MIN_DIA);
    // Alineado a la izquierda del mes: así ninguna línea de referencia lo corta.
    capas.grilla.push(txt(xa + 6, Y_EJE - 26, nombres[m.clave.slice(5, 7)] || m.clave, { 'font-size': 10.5, 'font-weight': 600, fill: C.secundario }));
    capas.grilla.push(`<line x1="${r1(xa)}" y1="${Y_EJE - 38}" x2="${r1(xa)}" y2="${Y_EJE}" stroke="${C.linea}"/>`);
  }
  capas.grilla.push(`<line x1="${X0}" y1="${Y_EJE}" x2="${X1}" y2="${Y_EJE}" stroke="${C.linea}"/>`);
  capas.grilla.push(`<line x1="${X1}" y1="${Y_EJE - 38}" x2="${X1}" y2="${Y_EJE}" stroke="${C.linea}"/>`);
  // Referencias arriba del eje.
  capas.encima.push(txt(xActa, Y_EJE - 50, '18/09 18:48 · ACTA-DIR-034 firmada', { 'font-size': 9.5, 'font-weight': 600, fill: C.tinta, 'text-anchor': 'middle' }));
  capas.encima.push(txt(xCorte, Y_EJE - 50, 'corte · 02/10 15:45', { 'font-size': 9.5, 'font-weight': 600, fill: C.tinta, 'text-anchor': 'middle' }));
}

// Bandas: el hueco sin fuentes y el plan.
{
  const xa = x(minutos('2026-09-10'));
  const xb = x(minutos('2026-09-16'));
  capas.bandas.push(`<rect x="${r1(xa)}" y="${Y_EJE}" width="${r1(xb - xa)}" height="${Y_FIN_FILAS - Y_EJE}" fill="${C.hueco}" opacity="0.9"/>`);
  capas.encima.push(txt((xa + xb) / 2, Y_FILAS + 18, 'sin actas ni commits', { 'font-size': 9.5, 'font-weight': 600, fill: C.tenue, 'text-anchor': 'middle' }));
  capas.bandas.push(`<rect x="${r1(xCorte)}" y="${Y_EJE}" width="${r1(X1 - xCorte)}" height="${Y_BASE_HIST - Y_EJE}" fill="${C.plan}" opacity="0.85"/>`);
  capas.encima.push(txt((xCorte + X1) / 2, Y_FILAS + 18, 'PLAN — SUJETO A GATE', { 'font-size': 10.5, 'font-weight': 700, fill: C.secundario, 'text-anchor': 'middle', 'letter-spacing': '0.4' }));
}

// Cebra y encabezados de grupo.
for (const f of fases) {
  if (f.par) capas.fondo.push(`<rect x="${X_ID - 8}" y="${f.y}" width="${X1 - X_ID + 8}" height="${ALTO_FILA}" fill="${C.cebra}"/>`);
}
for (const e of encabezados) {
  capas.etiquetas.push(`<line x1="${X_ID - 8}" y1="${e.y + 0.5}" x2="${X1}" y2="${e.y + 0.5}" stroke="${C.linea}"/>`);
  if (e.grupo === 'Plan') capas.etiquetas.push(`<rect x="${X_ID}" y="${e.y + 10}" width="14" height="9" rx="2" fill="${C.fondo}" stroke="${C.planBorde}" stroke-width="1.3" stroke-dasharray="3 2"/>`);
  else capas.etiquetas.push(`<rect x="${X_ID}" y="${e.y + 10}" width="14" height="9" rx="2" fill="${C.grupo[e.grupo]}"/>`);
  capas.etiquetas.push(txt(X_ID + 22, e.y + 19.5, ENCABEZADO_GRUPO[e.grupo], { 'font-size': 12, 'font-weight': 600, fill: C.tinta, 'letter-spacing': '0.2' }));
}

// Líneas de referencia: una marca corta bajo el rótulo y la línea desde el eje hacia abajo, sin cruzar
// los nombres de los meses ni los números de día.
for (const [xr, ancho, opacidad, hasta] of [[xActa, 1.5, 0.5, Y_FIN_FILAS], [xCorte, 1.2, 0.6, Y_BASE_HIST]]) {
  capas.grilla.push(`<line x1="${r1(xr)}" y1="${Y_EJE - 45}" x2="${r1(xr)}" y2="${Y_EJE - 39}" stroke="${C.tinta}" stroke-width="${ancho}" opacity="${opacidad}"/>`);
  capas.grilla.push(`<line x1="${r1(xr)}" y1="${Y_EJE}" x2="${r1(xr)}" y2="${hasta}" stroke="${C.tinta}" stroke-width="${ancho}" opacity="${opacidad}"/>`);
}

// Filas.
const RADIO = 6.5;
const titulo = (f) => {
  const fechas = f.tipo === 'sin_fecha' ? 'sin fecha' : f.inicio === f.fin ? f.inicio + (f.hora ? ' ' + f.hora : '') : `${f.inicio} → ${f.fin}`;
  return `${f.id} · ${f.fase}\n${fechas}\nFuente: ${f.fuente}\nEstado: ${f.estado}`;
};
for (const f of fases) {
  const raiz = f.id === 'T04';
  capas.etiquetas.push(txt(X_ID, f.y + 13, f.id, { 'font-size': 9.5, 'font-weight': 600, fill: C.tenue }));
  capas.etiquetas.push(txt(X_TEXTO, f.y + 13, f.etiqueta, { 'font-size': 10.5, 'font-weight': raiz ? 700 : 400, fill: C.tinta }));
  capas.etiquetas.push(txt(X_TEXTO, f.y + 25.5, f.fuente_figura, { 'font-size': 9.5, 'font-weight': 500, fill: C.tenue }));
  if (anchoTexto(f.etiqueta, 10.5) > X0 - X_TEXTO - 12) anotar('AVISO', f.id, 'la etiqueta puede no entrar en la columna');
  if (anchoTexto(f.fuente_figura, 9.5) > X0 - X_TEXTO - 12) anotar('AVISO', f.id, 'la fuente de la figura puede no entrar en la columna');

  const color = C.grupo[f.grupo];
  const tooltip = `<title>${esc(titulo(f))}</title>`;
  if (f.tipo === 'sin_fecha') {
    const xa = f.tramo === 'PLAN' ? xCorte + 6 : X0 + 6;
    const xb = f.tramo === 'PLAN' ? X1 - 6 : xCorte - 6;
    const leyendaFila = f.tramo === 'PLAN' ? 'sin fecha · A VERIFICAR' : 'sin fuente · sin fecha';
    const ancho = anchoTexto(leyendaFila, 9.5) + 12;
    capas.marcas.push(`<g>${tooltip}<line x1="${r1(xa)}" y1="${f.yc}" x2="${r1(xb)}" y2="${f.yc}" stroke="${C.punteado}" stroke-width="1.6" stroke-dasharray="1 3" stroke-linecap="round"/>`
      + `<rect x="${r1(xb - ancho)}" y="${f.yc - 8}" width="${r1(ancho)}" height="16" fill="${f.tramo === 'PLAN' ? C.plan : C.fondo}"/>`
      + txt(xb - 6, f.yc + 3.5, leyendaFila, { 'font-size': 9.5, 'font-weight': 600, fill: C.tenue, 'text-anchor': 'end', 'font-style': 'italic' }) + '</g>');
    continue;
  }
  if (f.tipo === 'releases') {
    let marcas = '';
    for (const r of releases) {
      const xr = x(deFechaHora(r.publicado_art));
      marcas += `<line x1="${r1(xr)}" y1="${f.yc - 7}" x2="${r1(xr)}" y2="${f.yc + 7}" stroke="${C.tinta}" stroke-width="1.6" opacity="0.85"><title>${esc(`${r.tag} · ${r.publicado_art} · ${r.nombre}`)}</title></line>`;
    }
    // Solo se rotula la primera: la última queda en la etiqueta de la fila, donde ninguna flecha la pisa.
    const primero = releases[0];
    marcas += txt(x(deFechaHora(primero.publicado_art)) - 5, f.yc + 3.5, primero.tag.replace('be-apk-', ''), { 'font-size': 9.5, 'font-weight': 600, fill: C.secundario, 'text-anchor': 'end' });
    capas.marcas.push(`<g>${tooltip}${marcas}</g>`);
    continue;
  }
  if (f.pos.hito) {
    const xc = x(f.pos.inicio.t);
    const radio = raiz ? RADIO * 1.4 : RADIO;
    f.xa = xc - radio;
    f.xb = xc + radio;
    const plan = f.tramo === 'PLAN';
    const relleno = plan ? C.fondo : color;
    const borde = raiz ? `stroke="${C.tinta}" stroke-width="2.2"` : plan ? `stroke="${C.planBorde}" stroke-width="1.6"` : `stroke="${C.fondo}" stroke-width="2"`;
    let extra = '';
    if (raiz) extra = txt(xc + radio + 6, f.yc + 3.5, '18:48', { 'font-size': 9.5, 'font-weight': 600, fill: C.tinta });
    if (f.id === 'P02') extra = txt(xc + radio + 6, f.yc + 3.5, '10/10', { 'font-size': 9.5, 'font-weight': 600, fill: C.secundario });
    capas.marcas.push(`<g>${tooltip}<path d="M${r1(xc)} ${r1(f.yc - radio)}l${r1(radio)} ${r1(radio)}l${r1(-radio)} ${r1(radio)}l${r1(-radio)} ${r1(-radio)}z" fill="${relleno}" ${borde}/>${extra}</g>`);
    continue;
  }
  // Barras.
  let xa = x(f.pos.inicio.t);
  let xb = x(f.pos.fin.t);
  if (f.pos.inicio.precision === 'dia') xa += 2;
  if (f.pos.fin.precision === 'dia') xb -= 2;
  if (xb - xa < 8) xb = xa + 8;
  f.xa = xa;
  f.xb = xb;
  if (f.tramo === 'PLAN') {
    let extra = '';
    if (f.id === 'P03') extra = txt(xa - 6, f.yc + 3.5, '16 a 18/10 · la fecha exacta está en Render', { 'font-size': 9.5, 'font-weight': 600, fill: C.secundario, 'text-anchor': 'end' });
    capas.marcas.push(`<g>${tooltip}<rect x="${r1(xa)}" y="${f.yc - 6}" width="${r1(xb - xa)}" height="12" rx="3" fill="${C.fondo}" stroke="${C.planBorde}" stroke-width="1.4" stroke-dasharray="4 3"/>${extra}</g>`);
  } else {
    capas.marcas.push(`<g>${tooltip}<rect x="${r1(xa)}" y="${f.yc - 6}" width="${r1(xb - xa)}" height="12" rx="3" fill="${color}"/></g>`);
  }
}

// Flechas de dependencia: curvas suaves de un extremo al otro.
for (const d of dependencias) {
  const a = porId.get(d.de);
  const b = porId.get(d.a);
  if (!a || !b || a.xa === undefined || b.xa === undefined) continue;
  let sx;
  let ex;
  let camino;
  if (d.tipo === 'SS') {
    sx = a.xa; ex = b.xa;
    camino = `M${r1(sx)} ${a.yc}C${r1(sx - 16)} ${a.yc} ${r1(ex - 16)} ${b.yc} ${r1(ex - 1.5)} ${b.yc}`;
  } else if (d.tipo === 'FF') {
    sx = a.xb; ex = b.xb;
    camino = `M${r1(sx)} ${a.yc}C${r1(Math.max(sx, ex) + 18)} ${a.yc} ${r1(Math.max(sx, ex) + 18)} ${b.yc} ${r1(ex + 1.5)} ${b.yc}`;
  } else if (d.tipo === 'INVERTIDA') {
    sx = a.xa; ex = b.xa;
    camino = `M${r1(sx)} ${a.yc}C${r1(sx - 50)} ${a.yc} ${r1(ex - 46)} ${b.yc} ${r1(ex - 1.5)} ${b.yc}`;
  } else {
    sx = a.xb; ex = b.xa;
    camino = `M${r1(sx)} ${a.yc}C${r1(sx + 16)} ${a.yc} ${r1(ex - 16)} ${b.yc} ${r1(ex - 1.5)} ${b.yc}`;
  }
  const tituloFlecha = `<title>${esc(`${d.de} → ${d.a} (${d.tipo}): ${d.fuente}`)}</title>`;
  if (d.tipo === 'INVERTIDA') {
    capas.flechas.push(`<path d="${camino}" fill="none" stroke="${C.invertida}" stroke-width="1.5" stroke-dasharray="2 3" marker-end="url(#flecha-invertida)">${tituloFlecha}</path>`);
    capas.flechas.push(txt(ex - 52, (a.yc + b.yc) / 2 + 3.5, 'ratificado después (DL-001)', { 'font-size': 9.5, 'font-weight': 600, fill: C.secundario, 'text-anchor': 'end' }));
  } else {
    capas.flechas.push(`<path d="${camino}" fill="none" stroke="${C.tenue}" stroke-width="1.15" opacity="0.9" marker-end="url(#flecha)">${tituloFlecha}</path>`);
  }
}

// Commits por día: una sola serie, en el mismo eje.
{
  const maximo = Math.max(...commitsPorDia.map((d) => d.commits));
  const total = commitsPorDia.reduce((s, d) => s + d.commits, 0);
  const merges = commitsPorDia.reduce((s, d) => s + d.merges, 0);
  capas.etiquetas.push(`<line x1="${X_ID - 8}" y1="${Y_HIST - 12.5}" x2="${X1}" y2="${Y_HIST - 12.5}" stroke="${C.linea}"/>`);
  capas.etiquetas.push(txt(X_TEXTO, Y_HIST + 14, 'Commits por día', { 'font-size': 10.5, 'font-weight': 600, fill: C.tinta }));
  capas.etiquetas.push(txt(X_TEXTO, Y_HIST + 28, `${total} commits del ${diaMes(commitsPorDia[0].fecha_art)} al ${diaMes(commitsPorDia[commitsPorDia.length - 1].fecha_art)}, ${merges} de ellos merges`, { 'font-size': 9.5, 'font-weight': 500, fill: C.tenue }));
  capas.etiquetas.push(txt(X_TEXTO, Y_HIST + 41, `git log hasta ${CORTE.commit} · DV-10_COMMITS_POR_DIA.csv`, { 'font-size': 9.5, 'font-weight': 500, fill: C.tenue }));
  for (const d of commitsPorDia) {
    const xa = x(minutos(d.fecha_art)) + 3;
    const ancho = ANCHO_DIA - 6;
    const alto = Math.max(1.5, (d.commits / maximo) * (ALTO_HIST - 12));
    const tope = Y_BASE_HIST - alto;
    const r = Math.min(3, alto / 2);
    capas.marcas.push(`<path d="M${r1(xa)} ${Y_BASE_HIST}V${r1(tope + r)}Q${r1(xa)} ${r1(tope)} ${r1(xa + r)} ${r1(tope)}H${r1(xa + ancho - r)}Q${r1(xa + ancho)} ${r1(tope)} ${r1(xa + ancho)} ${r1(tope + r)}V${Y_BASE_HIST}Z" fill="${C.columnas}" opacity="0.55"><title>${esc(`${d.fecha_art}: ${d.commits} commits (${d.merges} merges)`)}</title></path>`);
    if (d.commits === maximo) capas.marcas.push(txt(xa + ancho / 2, tope - 4, String(maximo), { 'font-size': 9.5, 'font-weight': 600, fill: C.secundario, 'text-anchor': 'middle' }));
  }
  capas.marcas.push(`<line x1="${X0}" y1="${Y_BASE_HIST}" x2="${X1}" y2="${Y_BASE_HIST}" stroke="${C.linea}"/>`);
}

// Notas al pie.
NOTAS.forEach((nota, i) => capas.encima.push(txt(X_ID, Y_NOTAS + i * 17, nota, { 'font-size': 9.5, 'font-weight': 500, fill: C.tenue })));

const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-labelledby="dv10-titulo dv10-desc">`,
  '<title id="dv10-titulo">Figura DV-10.1 — Gantt de BE: historia respaldada y plan sujeto a gate</title>',
  `<desc id="dv10-desc">Gantt del proyecto BE del 2026-09-06 al 2026-10-19. Historia en ${fases.filter((f) => f.tramo === 'HISTORIA' && f.tipo !== 'sin_fecha').length} filas fechadas por actas, commits, PR y releases, más ${fases.filter((f) => f.tramo === 'HISTORIA' && f.tipo === 'sin_fecha').length} sin fuente ni fecha; plan rotulado PLAN — SUJETO A GATE desde el corte del 2026-10-02. La tabla equivalente está en DV-10_FASES.csv.</desc>`,
  `<defs><marker id="flecha" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" fill="${C.tenue}"/></marker>`
    + `<marker id="flecha-invertida" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" fill="${C.invertida}"/></marker></defs>`,
  ...capas.fondo, ...capas.bandas, ...capas.grilla, ...capas.etiquetas, ...capas.flechas, ...capas.marcas, ...capas.encima,
  '</svg>',
].join('\n');
fs.writeFileSync(path.join(DIR, 'DV-10_GANTT.svg'), svg + '\n', 'utf8');

// ---------------------------------------------------------------------------------------------
// Verificación escrita y tablas del documento
// ---------------------------------------------------------------------------------------------

const documento = path.join(DIR, 'DV-10_GANTT.md');
const MARCADORES = ['tabla-fases', 'tabla-dependencias', 'verificacion'];
const patronMarcador = (nombre) => new RegExp(`(<!-- generado:${nombre}:inicio -->)[\\s\\S]*?(<!-- generado:${nombre}:fin -->)`);
let textoDocumento = fs.existsSync(documento) ? fs.readFileSync(documento, 'utf8') : null;
if (textoDocumento === null) anotar('AVISO', 'documento', 'no existe DV-10_GANTT.md: las tablas no se vuelcan');
else for (const nombre of MARCADORES) {
  if (!patronMarcador(nombre).test(textoDocumento)) anotar('AVISO', 'documento', `faltan los marcadores de ${nombre} en DV-10_GANTT.md`);
}

const cuenta = (nivel) => resultados.filter((r) => r.nivel === nivel).length;
const historicas = fases.filter((f) => f.tramo === 'HISTORIA' && f.tipo !== 'sin_fecha');
const conFuente = historicas.filter((f) => f.fuentes.length);
const resumen = [
  `Fases: ${fases.length} (historia fechada ${historicas.length}, historia sin fecha ${fases.filter((f) => f.tramo === 'HISTORIA' && f.tipo === 'sin_fecha').length}, plan ${fases.filter((f) => f.tramo === 'PLAN').length})`,
  `Fases pasadas fechadas con fuente: ${conFuente.length} de ${historicas.length}`,
  `Dependencias: ${dependencias.length} (${dependencias.filter((d) => d.resultado === 'se cumple').length} se cumplen, ${dependencias.filter((d) => d.resultado === 'invertida, como se declaró').length} invertida declarada, ${dependencias.filter((d) => d.resultado === 'NO se cumple' || d.resultado === 'FALLA').length} fallan)`,
  `PR integrados con fase: ${prsUsados.size} de ${prs.size}${prsSinFase.length ? ` (sin fase: ${prsSinFase.map((n) => '#' + n).join(', ')})` : ''}`,
  `Controles: ${cuenta('OK')} OK · ${cuenta('FALLA')} FALLA · ${cuenta('AVISO')} AVISO`,
];
const informe = [
  'DV-10 · Verificación falsable del Gantt',
  `Corte: ${CORTE.fecha} ${CORTE.hora} (hora argentina), commit ${CORTE.commit}`,
  'Generado por generar-gantt.cjs a partir de DV-10_FASES.csv, DV-10_DEPENDENCIAS.csv y las fuentes capturadas.',
  '',
  ...resumen,
  '',
  ...resultados.map((r) => `[${r.nivel}] ${r.id}: ${r.texto}`),
  '',
].join('\n');
fs.writeFileSync(path.join(DIR, 'DV-10_VERIFICACION.txt'), informe, 'utf8');

const celda = (s) => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
function fechasDeFila(f) {
  if (f.tipo === 'sin_fecha') return f.tramo === 'PLAN' ? 'sin fecha · A VERIFICAR' : 'sin fecha';
  const hora = f.hora ? ` ${f.hora}` : '';
  return f.inicio === f.fin ? f.inicio + hora : `${f.inicio} → ${f.fin}`;
}
const tablaFases = [
  '| ID | Tramo | Fase | Fechas | Fuente | Estado |',
  '|---|---|---|---|---|---|',
  ...fases.map((f) => `| ${f.id} | ${f.tramo === 'PLAN' ? 'plan' : 'historia'} | ${celda(f.fase)} | ${celda(fechasDeFila(f))} | ${celda(f.fuente)} | ${celda(f.estado)} |`),
].join('\n');
const tablaDependencias = [
  '| De → a | Tipo | Resultado en las fuentes | Fuente de la dependencia |',
  '|---|---|---|---|',
  ...dependencias.map((d) => `| ${d.de} → ${d.a} | ${d.tipo} | ${celda(d.resultado)} | ${celda(d.fuente)}${d.nota ? ` · ${celda(d.nota)}` : ''} |`),
].join('\n');
const tablaVerificacion = ['```text', ...resumen, '```'].join('\n');

if (textoDocumento !== null) {
  const contenidos = { 'tabla-fases': tablaFases, 'tabla-dependencias': tablaDependencias, verificacion: tablaVerificacion };
  for (const nombre of MARCADORES) {
    textoDocumento = textoDocumento.replace(patronMarcador(nombre), (m, a, b) => `${a}\n${contenidos[nombre]}\n${b}`);
  }
  fs.writeFileSync(documento, textoDocumento, 'utf8');
}

console.log(resumen.join('\n'));
for (const r of resultados.filter((x) => x.nivel !== 'OK')) console.log(`[${r.nivel}] ${r.id}: ${r.texto}`);
process.exit(cuenta('FALLA') ? 1 : 0);
