#!/usr/bin/env node
/**
 * Análisis de la medición antes/después de la cartera (WP-CARTERA-LECTURA-POR-CONJUNTOS, 2026-10-28). Lee las muestras
 * crudas que deja cartera-ab.rendimiento.ts y escribe `resumen-ab.md` y `resumen-ab.json` en la misma carpeta. Sin
 * dependencias: se puede volver a correr sobre los archivos versionados.
 *
 *   node test/rendimiento/analizar-ab.mjs <carpeta-de-resultados>
 *
 * Compara, escenario por escenario y repetición por repetición, la versión «base» (la lectura persona por persona de
 * main e4512cb) con la «propuesta» (la lectura por conjuntos), corridas alternadas en la misma máquina. Percentiles por
 * rango más cercano, como en las mediciones anteriores: p = el valor en la posición ⌈p/100·n⌉.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , carpeta] = process.argv;
if (!carpeta) {
  console.error('Uso: node analizar-ab.mjs <carpeta-de-resultados>');
  process.exit(2);
}

const leerJson = (ruta, porOmision = null) => (existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : porOmision);
const leerJsonl = (ruta) =>
  existsSync(ruta)
    ? readFileSync(ruta, 'utf8')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => JSON.parse(l))
    : [];

const muestras = leerJsonl(join(carpeta, 'muestras.jsonl'));
const lotes = leerJsonl(join(carpeta, 'lotes.jsonl'));
const filasDeDecision = leerJson(join(carpeta, 'filas-de-decision.json'), { porPedido: {}, sinRequestId: [] });
const consultas = leerJson(join(carpeta, 'consultas.json'), {}) ?? {};
const entorno = leerJson(join(carpeta, 'entorno.json'), {});
const poblacion = leerJson(join(carpeta, 'poblacion.json'), {});
const estado = leerJson(join(carpeta, 'estado.json'), {});

// ─── Utilidades ────────────────────────────────────────────────────────────────────────────

const VERSIONES = ['base', 'propuesta'];
const numeros = (v) => v.filter((x) => typeof x === 'number' && Number.isFinite(x));
const ordenar = (v) => [...numeros(v)].sort((a, b) => a - b);
function percentil(valores, p) {
  const v = ordenar(valores);
  if (v.length === 0) return null;
  return v[Math.min(v.length - 1, Math.max(0, Math.ceil((p / 100) * v.length) - 1))];
}
const suma = (v) => numeros(v).reduce((a, b) => a + b, 0);
const media = (v) => (numeros(v).length ? suma(v) / numeros(v).length : null);
const r0 = (n) => (n === null || n === undefined ? null : Math.round(n));
const r2 = (n) => (n === null || n === undefined ? null : Math.round(n * 100) / 100);
const f = (n) => (n === null || n === undefined ? '—' : new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n));
const f2 = (n) => (n === null || n === undefined ? '—' : new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n));
const pct = (antes, despues) => (antes && despues !== null && despues !== undefined ? r2(((despues - antes) / antes) * 100) : null);
const fpct = (p) => (p === null ? '—' : `${p > 0 ? '+' : ''}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(p)} %`);

const idsDeCommit = new Set(Object.entries(consultas).filter(([, texto]) => String(texto).trim().toUpperCase() === 'COMMIT').map(([id]) => id));
const sentenciasDe = (m) => (Array.isArray(m.sentencias) ? suma(m.sentencias.map((s) => s[1])) : null);
const sqlMsDe = (m) => (Array.isArray(m.sentencias) ? suma(m.sentencias.map((s) => s[2])) : null);
const commitsDe = (m) => (Array.isArray(m.sentencias) ? suma(m.sentencias.filter((s) => idsDeCommit.has(s[0])).map((s) => s[1])) : null);
const filasDe = (m) => (m.requestId && filasDeDecision.porPedido[m.requestId] ? filasDeDecision.porPedido[m.requestId].filas : null);

// ─── Grupos: escenario × versión × repetición ──────────────────────────────────────────────

const medidas = muestras.filter((m) => !m.calentamiento);
const clave = (m) => `${m.escenario}|${m.version}|r${m.repeticion}`;
const grupos = new Map();
for (const m of medidas) {
  if (!grupos.has(clave(m))) grupos.set(clave(m), []);
  grupos.get(clave(m)).push(m);
}
const lotePor = new Map(lotes.map((l) => [`${l.escenario}|${l.version}|r${l.repeticion}`, l]));

function resumirGrupo(ms, lote) {
  const ok = ms.filter((m) => m.status === 200 && m.error === null);
  const lat = ok.map((m) => m.latenciaMs);
  const paginasPorSegundo = lote && lote.modo === 'concurrente' && lote.duracionMs ? r2((ok.length * 1000) / lote.duracionMs) : null;
  const servidor = (campo) => percentil(ok.map((m) => m.servidor?.[campo]).filter((x) => x !== null && x !== undefined), 50);
  const filas = ok.map(filasDe).filter((x) => x !== null);
  return {
    pedidos: ms.length,
    conError: ms.length - ok.length,
    p50: r0(percentil(lat, 50)),
    p95: r0(percentil(lat, 95)),
    max: r0(percentil(lat, 100)),
    media: r0(media(lat)),
    paginasPorSegundo,
    duracionMs: lote?.duracionMs ?? null,
    pdpTramoMs: r0(servidor('pdpTramoMs')),
    pdpP95Ms: r0(percentil(ok.map((m) => m.servidor?.pdpTramoMs).filter((x) => x !== null && x !== undefined), 95)),
    lecturaMs: r0(servidor('lecturaMs')),
    lecturaP95Ms: r0(percentil(ok.map((m) => m.servidor?.lecturaMs).filter((x) => x !== null && x !== undefined), 95)),
    antesDelPdpMs: r0(servidor('antesDelPdpMs')),
    despuesDeLecturaMs: r0(servidor('despuesDeLecturaMs')),
    sentencias: r0(percentil(ok.map(sentenciasDe).filter((x) => x !== null), 50)),
    sqlMs: r0(percentil(ok.map(sqlMsDe).filter((x) => x !== null), 50)),
    commits: r0(percentil(ok.map(commitsDe).filter((x) => x !== null), 50)),
    filasDeDecision: filas.length ? { min: Math.min(...filas), max: Math.max(...filas), pedidosContados: filas.length } : null,
    items: r0(percentil(ok.map((m) => m.items), 50)),
    gcMs: r2(media(ok.map((m) => m.gcMs))),
    versionComoSeEsperaba: lote?.versionComoSeEsperaba ?? null,
    hilo: lote?.hilo?.utilizacion ?? null,
    nucleos: lote?.cpuDeLaMaquina?.nucleosOcupados ?? null,
    conexionesMax: lote?.actividad?.conexionesDeLaApiMax ?? null,
    esperas: lote?.actividad?.esperas ?? null,
    walSyncMs: lote?.wal?.wal_sync_time ?? null,
    walSync: lote?.wal?.wal_sync ?? null,
    xactCommit: lote?.base?.xact_commit ?? null,
  };
}

const resumen = {};
for (const [k, ms] of grupos) {
  const [escenario, version, rep] = k.split('|');
  resumen[escenario] ??= {};
  resumen[escenario][version] ??= {};
  resumen[escenario][version][rep] = resumirGrupo(ms, lotePor.get(k));
  // Las dos repeticiones juntas, para una lectura más estable.
  const todas = medidas.filter((m) => m.escenario === escenario && m.version === version);
  resumen[escenario][version].juntas = resumirGrupo(todas, null);
}

// ─── Apertura: por página y las primeras cuatro ────────────────────────────────────────────

function apertura(escenario, version) {
  const ms = medidas.filter((m) => m.escenario === escenario && m.version === version && m.status === 200 && m.apertura !== null);
  const porPagina = {};
  for (const m of ms) (porPagina[m.pagina] ??= []).push(m.latenciaMs);
  const porApertura = new Map();
  for (const m of ms) {
    const k = `${m.repeticion}|${m.apertura}`;
    const a = porApertura.get(k) ?? { total: 0, primerasCuatro: 0, paginas: 0, filas: 0 };
    a.total += m.latenciaMs;
    a.paginas++;
    if (m.pagina <= 4) a.primerasCuatro += m.latenciaMs;
    a.filas += filasDe(m) ?? 0;
    porApertura.set(k, a);
  }
  const aperturas = [...porApertura.values()];
  return {
    aperturas: aperturas.length,
    paginasPorApertura: r2(media(aperturas.map((a) => a.paginas))),
    porPagina: Object.fromEntries(Object.entries(porPagina).map(([p, v]) => [p, r0(percentil(v, 50))])),
    todaLaListaP50: r0(percentil(aperturas.map((a) => a.total), 50)),
    todaLaListaP95: r0(percentil(aperturas.map((a) => a.total), 95)),
    primerasCuatroP50: r0(percentil(aperturas.map((a) => a.primerasCuatro), 50)),
    primerasCuatroP95: r0(percentil(aperturas.map((a) => a.primerasCuatro), 95)),
    filasPorApertura: r0(media(aperturas.map((a) => a.filas))),
  };
}
const aperturas = {};
for (const escenario of Object.keys(resumen)) if (escenario.startsWith('A-')) aperturas[escenario] = Object.fromEntries(VERSIONES.map((v) => [v, apertura(escenario, v)]));

// ─── El texto ──────────────────────────────────────────────────────────────────────────────

const orden = (a, b) => {
  const peso = (e) => (e.startsWith('S-B') ? 0 : e.startsWith('S-H') ? 1 : e.startsWith('A-') ? 2 : 3);
  return peso(a) - peso(b) || a.localeCompare(b, 'es', { numeric: true });
};
const escenarios = Object.keys(resumen).sort(orden);
const descripcion = (e) => lotes.find((l) => l.escenario === e)?.descripcion ?? e;
const L = [];
const titulo = (t) => L.push('', `## ${t}`, '');
const tabla = (cabecera, filas) => {
  L.push(`| ${cabecera.join(' | ')} |`, `|${cabecera.map(() => '---').join('|')}|`);
  for (const fila of filas) L.push(`| ${fila.join(' | ')} |`);
  L.push('');
};

L.push('# Antes/después de la cartera: lectura persona por persona («base») contra lectura por conjuntos («propuesta»)', '');
L.push(`Generado por \`test/rendimiento/analizar-ab.mjs\` a partir de \`${carpeta}\`. Perfil ${entorno.perfil ?? '?'}; corrida ${entorno.corrida?.id ?? 'local'}; commit ${entorno.commit ?? '?'}; ${entorno.cpus ?? '?'} CPU (${entorno.modeloDeCpu ?? '?'}), ${entorno.memoriaGb ?? '?'} GB; Node ${entorno.node ?? '?'}; ${entorno.postgres ?? '?'}. Etapa final: ${estado.etapa ?? '?'}${estado.minutos ? `, ${estado.minutos} min` : ''}.`, '');
L.push('**Un resultado de acá describe esta máquina: no dice nada de Render.** Las dos versiones corrieron alternadas en el mismo proceso, contra la misma base y las mismas carteras; cada lote comprobó qué versión tenía puesta (columna «versión ok»), y las sentencias por pedido lo confirman.', '');

const versionesOk = lotes.every((l) => l.incompleto || l.versionComoSeEsperaba === true);
const erroresTotales = medidas.filter((m) => m.status !== 200 || m.error !== null).length;
L.push(`- Lotes: ${lotes.length} (${lotes.filter((l) => l.incompleto).length} incompletos). Versión puesta como se esperaba en todos: **${versionesOk ? 'sí' : 'NO'}**.`);
L.push(`- Pedidos medidos: ${medidas.length}; con error o sin respuesta: **${erroresTotales}**.`);
const coincidencias = Object.entries(poblacion.carteras ?? {}).map(([n, c]) => [n, c.lasDosVersionesCoinciden]);
L.push(`- Inventario de pendientes de cada cartera con las dos versiones (una apertura completa por versión): ${coincidencias.map(([n, c]) => `${n} ${c === true ? 'coinciden' : c === false ? '**DIFIEREN**' : '?'}`).join(' · ')}.`);
L.push('');

titulo('Latencia por escenario (ms, medida en el cliente)');
tabla(
  ['Escenario', 'Rep.', 'Versión', 'Pedidos', 'Errores', 'p50', 'p95', 'máx.', 'media', 'Páginas/s', 'Versión ok'],
  escenarios.flatMap((e) =>
    ['r1', 'r2', 'juntas'].flatMap((rep) =>
      VERSIONES.filter((v) => resumen[e][v]?.[rep]).map((v) => {
        const g = resumen[e][v][rep];
        return [rep === 'r1' && v === 'base' ? `**${e}**` : '', rep, v, g.pedidos, g.conError, f(g.p50), f(g.p95), f(g.max), f(g.media), g.paginasPorSegundo === null ? '—' : f2(g.paginasPorSegundo), rep === 'juntas' ? '—' : g.versionComoSeEsperaba ? 'sí' : 'NO'];
      }),
    ),
  ),
);

titulo('La comparación: propuesta contra base, en la misma repetición');
L.push('Δ = propuesta − base. La «variación de la base» es cuánto difirió la base entre sus dos repeticiones (p50): el piso de ruido con el que hay que comparar cada Δ.', '');
tabla(
  ['Escenario', 'Rep.', 'p50 base', 'p50 propuesta', 'Δ p50 (ms)', 'Δ p50 (%)', 'p95 base', 'p95 propuesta', 'Δ p95 (%)', 'Páginas/s base → propuesta', 'Variación de la base entre r1 y r2'],
  escenarios.flatMap((e) => {
    const b1 = resumen[e].base?.r1?.p50;
    const b2 = resumen[e].base?.r2?.p50;
    const variacion = b1 && b2 ? fpct(r2(((b2 - b1) / b1) * 100)) : '—';
    return ['r1', 'r2', 'juntas']
      .filter((rep) => resumen[e].base?.[rep] && resumen[e].propuesta?.[rep])
      .map((rep) => {
        const b = resumen[e].base[rep];
        const p = resumen[e].propuesta[rep];
        return [rep === 'r1' ? `**${e}**` : '', rep, f(b.p50), f(p.p50), f(p.p50 - b.p50), fpct(pct(b.p50, p.p50)), f(b.p95), f(p.p95), fpct(pct(b.p95, p.p95)), b.paginasPorSegundo === null ? '—' : `${f2(b.paginasPorSegundo)} → ${f2(p.paginasPorSegundo)} (${fpct(pct(b.paginasPorSegundo, p.paginasPorSegundo))})`, rep === 'r1' ? variacion : ''];
      });
  }),
);

titulo('Dónde cambió el tiempo: los bloques del servidor (medianas por pedido, ms)');
tabla(
  ['Escenario', 'Rep.', 'Versión', 'Antes del PDP', 'PDP (tramo)', 'PDP p95', 'Lectura', 'Lectura p95', 'Después de la lectura', 'GC medio', 'Hilo de Node', 'Núcleos de la máquina'],
  escenarios.flatMap((e) =>
    ['r1', 'r2'].flatMap((rep) =>
      VERSIONES.filter((v) => resumen[e][v]?.[rep]).map((v) => {
        const g = resumen[e][v][rep];
        return [rep === 'r1' && v === 'base' ? `**${e}**` : '', rep, v, f(g.antesDelPdpMs), f(g.pdpTramoMs), f(g.pdpP95Ms), f(g.lecturaMs), f(g.lecturaP95Ms), f(g.despuesDeLecturaMs), g.gcMs === null ? '—' : f2(g.gcMs), g.hilo === null ? '—' : `${f(g.hilo * 100)} %`, g.nucleos === null ? '—' : f2(g.nucleos)];
      }),
    ),
  ),
);

titulo('Sentencias, SQL, transacciones y filas de auditoría por pedido (lotes secuenciales y de apertura; medianas)');
tabla(
  ['Escenario', 'Rep.', 'Versión', 'Sentencias', 'SQL ejecutándose (ms)', 'COMMIT', 'Filas de decisión por pedido (mín. · máx.)', 'Ítems', 'Transacciones del lote (pg_stat_database)', 'Sincronizaciones del WAL · ms'],
  escenarios.flatMap((e) =>
    ['r1', 'r2'].flatMap((rep) =>
      VERSIONES.filter((v) => resumen[e][v]?.[rep]).map((v) => {
        const g = resumen[e][v][rep];
        return [rep === 'r1' && v === 'base' ? `**${e}**` : '', rep, v, f(g.sentencias), f(g.sqlMs), f(g.commits), g.filasDeDecision ? `${g.filasDeDecision.min} · ${g.filasDeDecision.max} (${g.filasDeDecision.pedidosContados} pedidos)` : '—', f(g.items), f(g.xactCommit), g.walSync === null ? '—' : `${f(g.walSync)} · ${f(g.walSyncMs)}`];
      }),
    ),
  ),
);

if (Object.keys(aperturas).length) {
  titulo('La apertura completa: por página y lo que lee el website (las primeras cuatro páginas)');
  tabla(
    ['Escenario', 'Versión', 'Aperturas', 'Páginas por apertura', 'p50 por página (1 … n)', 'Toda la lista: p50 · p95', 'Primeras 4 páginas: p50 · p95', 'Filas de decisión por apertura'],
    Object.entries(aperturas)
      .sort(([a], [b]) => orden(a, b))
      .flatMap(([e, porVersion]) =>
        VERSIONES.map((v) => {
          const a = porVersion[v];
          return [v === 'base' ? `**${e}**` : '', v, a.aperturas, f2(a.paginasPorApertura), Object.values(a.porPagina).map(f).join(' · '), `${f(a.todaLaListaP50)} · ${f(a.todaLaListaP95)}`, `${f(a.primerasCuatroP50)} · ${f(a.primerasCuatroP95)}`, f(a.filasPorApertura)];
        }),
      ),
  );
}

const concurrentes = escenarios.filter((e) => e.startsWith('C'));
if (concurrentes.length) {
  titulo('Concurrencia: conexiones y esperas de la base (muestras de pg_stat_activity cada 250 ms)');
  tabla(
    ['Escenario', 'Rep.', 'Versión', 'p50', 'Páginas/s', 'Conexiones de la API (máx.)', 'Hilo de Node', 'Núcleos', 'Esperas de las conexiones activas'],
    concurrentes.flatMap((e) =>
      ['r1', 'r2'].flatMap((rep) =>
        VERSIONES.filter((v) => resumen[e][v]?.[rep]).map((v) => {
          const g = resumen[e][v][rep];
          const esperas = g.esperas
            ? Object.entries(g.esperas)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([k, n]) => `${k} ${n}`)
                .join(' · ')
            : '—';
          return [rep === 'r1' && v === 'base' ? `**${e}**` : '', rep, v, f(g.p50), f2(g.paginasPorSegundo), g.conexionesMax ?? '—', g.hilo === null ? '—' : `${f(g.hilo * 100)} %`, g.nucleos === null ? '—' : f2(g.nucleos), esperas];
        }),
      ),
    ),
  );
}

titulo('Las poblaciones (lo contado en la base)');
for (const [nombre, c] of Object.entries(poblacion.carteras ?? {})) {
  const p = c.pendientes ?? {};
  L.push(`- **${nombre}** (${c.perfil}, ${c.personasPedidas} personas pedidas): ${p.items ?? '?'} pendientes en ${p.paginas ?? '?'} páginas; vínculos ${c.filas?.vinculos ?? '?'}; planes nutricionales ${c.filas?.planesNutricionales ?? '?'}; comidas ${c.filas?.comidasRegistradas ?? '?'}; sesiones ${c.filas?.sesionesDeEntrenamiento ?? '?'}; solicitudes ${c.filas?.solicitudesDeFormulario ?? '?'}; tomas ${c.filas?.tomasAntropometricasRegistradas ?? '?'}. Las dos versiones ${c.lasDosVersionesCoinciden === true ? 'coinciden' : c.lasDosVersionesCoinciden === false ? '**DIFIEREN**' : '?'} en el inventario.`);
}
L.push('');
L.push(`Siembra: ${poblacion.segundos ?? '?'} s. Errores de la historia: ${JSON.stringify(poblacion.erroresDeLaHistoria ?? {})}.`);
L.push('');
L.push('Filas de decisión sin request_id durante la medición: ' + (filasDeDecision.sinRequestId?.length ? JSON.stringify(filasDeDecision.sinRequestId) : 'ninguna') + '.');

writeFileSync(join(carpeta, 'resumen-ab.md'), `${L.join('\n')}\n`);
writeFileSync(join(carpeta, 'resumen-ab.json'), `${JSON.stringify({ entorno, estado, versionesOk, erroresTotales, coincidencias: Object.fromEntries(coincidencias), resumen, aperturas }, null, 2)}\n`);
console.log(`resumen-ab.md y resumen-ab.json escritos en ${carpeta}`);
