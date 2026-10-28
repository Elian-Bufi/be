#!/usr/bin/env node
/**
 * Análisis de la medición de la cartera con concurrencia (encargo nocturno del 2026-10-28, §13). Lee las muestras crudas
 * que deja cartera-concurrencia.rendimiento.ts y escribe `resumen.md` y `resumen.json` en la misma carpeta. No usa
 * dependencias: se puede volver a correr sobre los archivos versionados.
 *
 *   node test/rendimiento/analizar-concurrencia.mjs <carpeta-de-resultados> [referencia.json] [carpeta-del-control]
 *
 * - <carpeta-de-resultados>: muestras.jsonl, lotes.jsonl, filas-de-decision.json, consultas.json, entorno.json, poblacion.json.
 * - [referencia.json]: la medición anterior (corrida 40641148313), para la comparación.
 * - [carpeta-del-control]: la salida del arnés anterior, sin cambios, corrido en la misma máquina antes que este.
 *
 * Percentiles por rango más cercano (el mismo método de la medición anterior): p = el valor en la posición ⌈p/100·n⌉.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , carpeta, rutaReferencia, carpetaControl] = process.argv;
if (!carpeta) {
  console.error('Uso: node analizar-concurrencia.mjs <carpeta-de-resultados> [referencia.json] [carpeta-del-control]');
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
const referencia = rutaReferencia ? leerJson(rutaReferencia) : null;
const control = (() => {
  if (!carpetaControl || !existsSync(carpetaControl)) return null;
  const archivo = readdirSync(carpetaControl).find((a) => /^cartera-.*\.json$/.test(a));
  return archivo ? leerJson(join(carpetaControl, archivo)) : null;
})();

// ─── Utilidades ────────────────────────────────────────────────────────────────────────────

const ordenar = (v) => [...v].sort((a, b) => a - b);
function percentil(valores, p) {
  const v = ordenar(valores.filter((x) => typeof x === 'number' && Number.isFinite(x)));
  if (v.length === 0) return null;
  const i = Math.min(v.length - 1, Math.max(0, Math.ceil((p / 100) * v.length) - 1));
  return v[i];
}
const suma = (v) => v.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
const media = (v) => {
  const w = v.filter((x) => typeof x === 'number' && Number.isFinite(x));
  return w.length ? suma(w) / w.length : null;
};
const r = (n, d = 1) => (n === null || n === undefined || !Number.isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d);
const f = (n, d = 0) => {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
};
const pct = (n) => (n === null || !Number.isFinite(n) ? '—' : `${f(n * 100, 0)} %`);

/** La distribución de un valor discreto: «600 (50)» o «598 (1) · 600 (49)». */
function distribucion(valores) {
  const conteo = new Map();
  for (const v of valores) conteo.set(v, (conteo.get(v) ?? 0) + 1);
  return [...conteo.entries()]
    .sort((a, b) => (a[0] ?? -1) - (b[0] ?? -1))
    .map(([v, n]) => `${v === null || v === undefined ? 'sin dato' : f(v)} (${n})`)
    .join(' · ');
}

// ─── Nombres de las sentencias ─────────────────────────────────────────────────────────────

/** El orden importa: la tabla principal de la consulta va antes que las que aparecen en sus subconsultas. */
const NOMBRES = [
  [/be_bloquear_lo_que_corta/i, 'PDP · bloqueos compartidos (función)'],
  [/actor_existe/, 'PDP · lectura de hechos (una sentencia, tres áreas)'],
  [/INSERT INTO "public"\."decision_de_acceso"/i, 'PDP · registro de decisiones (createMany)'],
  [/^\s*BEGIN/i, 'BEGIN'],
  [/^\s*COMMIT/i, 'COMMIT'],
  [/^\s*ROLLBACK/i, 'ROLLBACK'],
  [/FROM "public"\."sesion"/i, 'Sesión (guard)'],
  [/nombre_visible/, 'Lectura · nombres de las personas'],
  [/FROM "public"\."ingesta_nutricional"/i, 'Lectura · actividad nutricional (conteo y última)'],
  [/FROM "public"\."ejecucion_de_entrenamiento"/i, 'Lectura · actividad de entrenamiento (conteo y última)'],
  [/FROM "public"\."evaluacion_antropometrica"/i, 'Lectura · antropometría'],
  [/FROM "public"\."solicitud_de_formulario"/i, 'Lectura · solicitud de formulario abierta'],
  [/proxima_revision/, 'Lectura · próxima revisión vigente'],
  [/FROM "public"\."proceso_operativo"/i, 'Lectura · proceso abierto'],
  [/FROM "public"\."version_de_plan_nutricional"/i, 'Lectura · versiones del plan nutricional'],
  [/FROM "public"\."plan_nutricional"/i, 'Lectura · plan nutricional'],
  [/FROM "public"\."version_de_plan_de_entrenamiento"/i, 'Lectura · versiones del plan de entrenamiento'],
  [/FROM "public"\."plan_de_entrenamiento"/i, 'Lectura · plan de entrenamiento'],
  [/FROM "public"\."alcance_de_vinculo"/i, 'Paso 1 · alcances aceptados de la cartera'],
];

function nombreDe(clave) {
  const texto = consultas[clave] ?? '';
  const interna = clave.endsWith('|0');
  if (interna) return /FOR (SHARE|KEY SHARE|NO KEY UPDATE|UPDATE)/i.test(texto) ? 'Interna · bloqueos dentro de la función' : `Interna · ${texto.replace(/\s+/g, ' ').slice(0, 50) || 'sin texto'}`;
  for (const [patron, nombre] of NOMBRES) if (patron.test(texto)) return nombre;
  return texto ? `Otra · ${texto.replace(/\s+/g, ' ').slice(0, 60)}` : `Otra · ${clave}`;
}

/** [clave, llamadas, ms, filas, hit, read, walRecords, walBytes] → por nombre. Las internas no suman a «tiempo en la base». */
function porNombre(deltas) {
  const r = new Map();
  for (const [clave, llamadas, ms, filas, hit, read, walRecords, walBytes] of deltas ?? []) {
    const n = nombreDe(clave);
    const x = r.get(n) ?? { llamadas: 0, ms: 0, filas: 0, hit: 0, read: 0, walRecords: 0, walBytes: 0, interna: clave.endsWith('|0') };
    x.llamadas += llamadas;
    x.ms += ms;
    x.filas += filas;
    x.hit += hit;
    x.read += read;
    x.walRecords += walRecords;
    x.walBytes += walBytes;
    r.set(n, x);
  }
  return r;
}

// ─── Muestras con sus filas de decisión ────────────────────────────────────────────────────

for (const m of muestras) {
  const d = m.requestId ? filasDeDecision.porPedido?.[m.requestId] : null;
  m.filasDeDecision = d ? d.filas : m.requestId ? 0 : null;
  m.decisionesPermitidas = d ? d.permitidas : null;
}
const idsDeMuestras = new Set(muestras.map((m) => m.requestId).filter(Boolean));
const filasAjenas = Object.entries(filasDeDecision.porPedido ?? {}).filter(([id]) => !idsDeMuestras.has(id));

const medidasDe = (lote) => muestras.filter((m) => m.lote === lote && !m.calentamiento);
const ok = (m) => m.status === 200 && !m.error;

function estadisticasDeLote(l) {
  const ms = medidasDe(l.lote);
  const buenas = ms.filter(ok);
  const lat = ms.map((m) => m.latenciaMs);
  const srv = buenas.map((m) => m.servidor).filter(Boolean);
  const duracionS = (l.duracionMs ?? 0) / 1000;
  const errores = {};
  for (const m of ms.filter((x) => !ok(x))) errores[m.error ?? `HTTP_${m.status}`] = (errores[m.error ?? `HTTP_${m.status}`] ?? 0) + 1;
  const decision = ms.map((m) => m.filasDeDecision);
  const personas = l.carteras?.[0]?.personas ?? null;
  // Sentencias por pedido (solo en los lotes secuenciales con estadísticas): cada pedido tiene las suyas.
  const conSentencias = buenas.filter((m) => Array.isArray(m.sentencias));
  const porPedido = conSentencias.map((m) => porNombre(m.sentencias));
  const nombres = new Set(porPedido.flatMap((p) => [...p.keys()]));
  const sentencias = [...nombres]
    .map((n) => {
      const llamadas = porPedido.map((p) => p.get(n)?.llamadas ?? 0);
      const msN = porPedido.map((p) => p.get(n)?.ms ?? 0);
      const interna = porPedido.some((p) => p.get(n)?.interna);
      return { nombre: n, interna, llamadasPorPedido: { min: Math.min(...llamadas), max: Math.max(...llamadas), media: media(llamadas) }, msPorPedido: media(msN), msPorLlamada: suma(msN) / Math.max(1, suma(llamadas)) };
    })
    .sort((a, b) => (b.msPorPedido ?? 0) - (a.msPorPedido ?? 0));
  const msEnLaBase = porPedido.map((p) => suma([...p.values()].filter((x) => !x.interna).map((x) => x.ms)));
  const sentenciasPorPedido = porPedido.map((p) => suma([...p.values()].filter((x) => !x.interna).map((x) => x.llamadas)));
  const commitsPorPedido = porPedido.map((p) => p.get('COMMIT')?.llamadas ?? 0);
  // Sentencias del lote entero (los lotes concurrentes no se pueden atribuir pedido por pedido).
  const delLote = l.sentencias ? porNombre(l.sentencias) : null;
  const n = ms.length;
  const base = l.base ?? {};
  const wal = l.wal ?? {};
  return {
    lote: l.lote,
    escenario: l.escenario,
    repeticion: l.repeticion,
    modo: l.modo,
    instrumentada: l.instrumentada,
    envolturasComoSeEsperaba: l.envolturasComoSeEsperaba,
    personas,
    clientes: l.carteras?.length ?? null,
    n,
    conError: n - buenas.length,
    errores,
    latencia: { min: r(Math.min(...lat)), p50: r(percentil(lat, 50)), p95: r(percentil(lat, 95)), p99: r(percentil(lat, 99)), max: r(Math.max(...lat)), media: r(media(lat)) },
    servidor: srv.length
      ? {
          total: { p50: r(percentil(srv.map((s) => s.totalMs), 50)), p95: r(percentil(srv.map((s) => s.totalMs), 95)), max: r(Math.max(...srv.map((s) => s.totalMs ?? 0))) },
          antesDelPdp: { p50: r(percentil(srv.map((s) => s.antesDelPdpMs), 50)) },
          pdpTramo: { p50: r(percentil(srv.map((s) => s.pdpTramoMs), 50)), p95: r(percentil(srv.map((s) => s.pdpTramoMs), 95)) },
          pdpPorDecision: { media: r(suma(srv.map((s) => s.pdpSumaMs)) / Math.max(1, suma(srv.map((s) => s.pdpLlamadas))), 2) },
          pdpLlamadas: distribucion(srv.map((s) => s.pdpLlamadas)),
          pdpReintentos: suma(srv.map((s) => s.pdpTransacciones - s.pdpLlamadas)),
          pdpTransaccionesFallidas: suma(srv.map((s) => s.pdpTransaccionesFallidas)),
          entrePdpYLectura: { p50: r(percentil(srv.map((s) => s.entrePdpYLecturaMs), 50), 2) },
          lectura: { p50: r(percentil(srv.map((s) => s.lecturaMs), 50)), p95: r(percentil(srv.map((s) => s.lecturaMs), 95)) },
          despuesDeLectura: { p50: r(percentil(srv.map((s) => s.despuesDeLecturaMs), 50), 2) },
          parteDelPdp: r(media(srv.map((s) => (s.totalMs ? (s.pdpTramoMs ?? 0) / s.totalMs : null))), 3),
          parteDeLaLectura: r(media(srv.map((s) => (s.totalMs ? s.lecturaMs / s.totalMs : null))), 3),
          clienteMenosServidor: { p50: r(percentil(buenas.filter((m) => m.servidor).map((m) => m.latenciaMs - (m.servidor.totalMs ?? 0)), 50), 2) },
        }
      : null,
    gc: { p50: r(percentil(ms.map((m) => m.gcMs), 50), 2), p95: r(percentil(ms.map((m) => m.gcMs), 95), 2), max: r(Math.max(0, ...ms.map((m) => m.gcMs ?? 0)), 2) },
    filasDeDecision: { esperadasPorPedido: personas === null ? null : 3 * personas, min: Math.min(...decision.filter((x) => x !== null)), max: Math.max(...decision.filter((x) => x !== null)), distribucion: distribucion(decision) },
    items: distribucion(buenas.map((m) => m.items)),
    pedidosPorSegundo: duracionS > 0 ? r(n / duracionS, 2) : null,
    concurrenciaEfectiva: l.duracionMs ? r(suma(lat) / l.duracionMs, 2) : null,
    duracionS: r(duracionS),
    hilo: l.hilo?.utilizacion ?? null,
    nucleosDelProceso: l.duracionMs ? r(((l.cpuDelProcesoMs?.usuario ?? 0) + (l.cpuDelProcesoMs?.sistema ?? 0)) / l.duracionMs, 2) : null,
    nucleosDePostgres: l.duracionMs && l.cpuDePostgresMs !== null ? r(l.cpuDePostgresMs / l.duracionMs, 2) : null,
    nucleosOcupadosDeLaMaquina: l.cpuDeLaMaquina?.nucleosOcupados ?? null,
    iowait: l.cpuDeLaMaquina?.iowait ?? null,
    porPedido: n
      ? {
          transaccionesConfirmadas: r((base.xact_commit ?? 0) / n, 1),
          transaccionesRevertidas: r((base.xact_rollback ?? 0) / n, 2),
          filasInsertadas: r((base.tup_inserted ?? 0) / n, 1),
          bloquesLeidosDelDisco: r((base.blks_read ?? 0) / n, 1),
          bloquesEnMemoria: r((base.blks_hit ?? 0) / n, 0),
          msActivosEnLaBase: r((base.active_time ?? 0) / n, 1),
          msEnTransaccionEsperandoALaApi: r((base.idle_in_transaction_time ?? 0) / n, 1),
          registrosWal: r((wal.wal_records ?? 0) / n, 0),
          bytesWal: r((wal.wal_bytes ?? 0) / n, 0),
          sincronizacionesWal: r((wal.wal_sync ?? 0) / n, 1),
          msSincronizandoWal: r((wal.wal_sync_time ?? 0) / n, 2),
          msEscribiendoWal: r((wal.wal_write_time ?? 0) / n, 2),
        }
      : null,
    deadlocks: base.deadlocks ?? null,
    checkpoints: (l.escritor?.checkpoints_timed ?? 0) + (l.escritor?.checkpoints_req ?? 0),
    autovacuumDeDecisiones: (l.tablas?.despues?.decision_de_acceso?.autovacuum ?? 0) - (l.tablas?.antes?.decision_de_acceso?.autovacuum ?? 0),
    bytesDeDecisionesAlEmpezar: l.tablas?.antes?.decision_de_acceso?.bytes ?? null,
    bytesDeDecisionesAgregados: (l.tablas?.despues?.decision_de_acceso?.bytes ?? 0) - (l.tablas?.antes?.decision_de_acceso?.bytes ?? 0),
    sentenciasPorPedido: conSentencias.length
      ? {
          pedidos: conSentencias.length,
          sentencias: { min: Math.min(...sentenciasPorPedido), max: Math.max(...sentenciasPorPedido) },
          commits: distribucion(commitsPorPedido),
          msEnLaBase: { p50: r(percentil(msEnLaBase, 50)), p95: r(percentil(msEnLaBase, 95)) },
          detalle: sentencias,
        }
      : null,
    sentenciasDelLote: delLote
      ? [...delLote.entries()].map(([nombre, x]) => ({ nombre, interna: x.interna, llamadasPorPedido: r(x.llamadas / Math.max(1, n), 1), msPorPedido: r(x.ms / Math.max(1, n), 2), msPorLlamada: r(x.ms / Math.max(1, x.llamadas), 3) })).sort((a, b) => (b.msPorPedido ?? 0) - (a.msPorPedido ?? 0))
      : null,
    actividad: l.actividad ?? null,
    errores: l.errores ?? [],
    incompleto: Boolean(l.incompleto),
  };
}

const resumenes = lotes.map(estadisticasDeLote);

// Aperturas completas: por página y por apertura.
function aperturas(escenario) {
  const ms = muestras.filter((m) => m.escenario === escenario && !m.calentamiento && m.apertura !== null);
  if (ms.length === 0) return null;
  const porPagina = new Map();
  for (const m of ms) porPagina.set(m.pagina, [...(porPagina.get(m.pagina) ?? []), m]);
  const paginas = [...porPagina.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pagina, v]) => ({
      pagina,
      n: v.length,
      conError: v.filter((m) => !ok(m)).length,
      p50: r(percentil(v.map((m) => m.latenciaMs), 50)),
      p95: r(percentil(v.map((m) => m.latenciaMs), 95)),
      pdpP50: r(percentil(v.map((m) => m.servidor?.pdpTramoMs ?? null), 50)),
      lecturaP50: r(percentil(v.map((m) => m.servidor?.lecturaMs ?? null), 50)),
      items: distribucion(v.map((m) => m.items)),
      filas: distribucion(v.map((m) => m.filasDeDecision)),
    }));
  const porApertura = new Map();
  for (const m of ms) porApertura.set(`${m.lote}|${m.apertura}`, [...(porApertura.get(`${m.lote}|${m.apertura}`) ?? []), m]);
  const totales = [...porApertura.values()].map((v) => {
    const orden = v.sort((a, b) => a.pagina - b.pagina);
    const hasta4 = orden.filter((m) => m.pagina <= 4);
    return {
      paginas: orden.length,
      ms: orden[orden.length - 1].finMs - orden[0].inicioMs,
      msHasta4: hasta4.length ? hasta4[hasta4.length - 1].finMs - hasta4[0].inicioMs : null,
      filas: suma(orden.map((m) => m.filasDeDecision ?? 0)),
      filasHasta4: suma(hasta4.map((m) => m.filasDeDecision ?? 0)),
      items: suma(orden.map((m) => m.items ?? 0)),
      completa: orden.every(ok) && orden[orden.length - 1].hasMore === false,
    };
  });
  return {
    paginas,
    aperturas: totales.length,
    paginasPorApertura: distribucion(totales.map((t) => t.paginas)),
    itemsPorApertura: distribucion(totales.map((t) => t.items)),
    msPorApertura: { p50: r(percentil(totales.map((t) => t.ms), 50)), p95: r(percentil(totales.map((t) => t.ms), 95)), max: r(Math.max(...totales.map((t) => t.ms))) },
    msPrimeras4: { p50: r(percentil(totales.map((t) => t.msHasta4), 50)) },
    filasPorApertura: distribucion(totales.map((t) => t.filas)),
    filasPrimeras4: distribucion(totales.map((t) => t.filasHasta4)),
    completas: totales.filter((t) => t.completa).length,
  };
}

const escenarios = [...new Set(resumenes.map((x) => x.escenario))];
const aperturasPorEscenario = Object.fromEntries(escenarios.filter((e) => e.startsWith('A-')).map((e) => [e, aperturas(e)]));

// La sobrecarga de la instrumentación: el mismo escenario, con y sin.
function mezclar(escenario) {
  const ls = resumenes.filter((x) => x.escenario === escenario);
  const ms = muestras.filter((m) => m.escenario === escenario && !m.calentamiento && ok(m));
  if (!ms.length) return null;
  const lat = ms.map((m) => m.latenciaMs);
  return { lotes: ls.length, n: ms.length, p50: r(percentil(lat, 50)), p95: r(percentil(lat, 95)), max: r(Math.max(...lat)), media: r(media(lat)) };
}
const grande = resumenes.find((x) => /^S-B\d+$/.test(x.escenario) && x.personas === Math.max(...resumenes.filter((y) => /^S-B\d+$/.test(y.escenario)).map((y) => y.personas)));
const escenarioGrande = grande?.escenario ?? null;
const sobrecarga = escenarioGrande
  ? (() => {
      const con = mezclar(escenarioGrande);
      const sin = mezclar(`${escenarioGrande}-sin`);
      return con && sin ? { con, sin, diferenciaP50: r(con.p50 - sin.p50), relativaP50: r((con.p50 - sin.p50) / sin.p50, 3), diferenciaMedia: r(con.media - sin.media), relativaMedia: r((con.media - sin.media) / sin.media, 3) } : null;
    })()
  : null;

const resumen = {
  generado: new Date().toISOString(),
  estado,
  entorno,
  poblacion,
  lotes: resumenes,
  aperturas: aperturasPorEscenario,
  sobrecarga,
  filasDeDecisionSinMuestra: { pedidos: filasAjenas.length, filas: suma(filasAjenas.map(([, d]) => d.filas)) },
  filasDeDecisionSinRequestId: filasDeDecision.sinRequestId ?? [],
  referencia: referencia?.resultados ?? null,
  control: control?.resultados ?? null,
};
writeFileSync(join(carpeta, 'resumen.json'), `${JSON.stringify(resumen, null, 2)}\n`);

// ─── El informe en Markdown ────────────────────────────────────────────────────────────────

const L = [];
const tabla = (encabezado, filas) => {
  L.push(`| ${encabezado.join(' | ')} |`, `|${encabezado.map(() => '---').join('|')}|`, ...filas.map((fila) => `| ${fila.join(' | ')} |`), '');
};

L.push(`# Cartera con concurrencia e historia · resumen generado`, '');
L.push(`Generado por \`test/rendimiento/analizar-concurrencia.mjs\` a partir de las muestras de esta carpeta. Perfil: **${entorno.perfil ?? '—'}**. Estado de la corrida: **${estado.etapa ?? '—'}**${estado.lote ? ` (último lote: ${estado.lote})` : ''}.`, '');
L.push('## La máquina y la base', '');
const pg = entorno.parametrosDePostgres ?? {};
tabla(
  ['Dato', 'Valor'],
  [
    ['Corrida de GitHub Actions', entorno.corrida ? `${entorno.corrida.id} (intento ${entorno.corrida.intento ?? '—'})` : '—'],
    ['Commit medido', entorno.commit ? `\`${entorno.commit}\`` : '—'],
    ['Runner', `${entorno.runner?.imagen ?? '—'} ${entorno.runner?.version ?? ''}`.trim()],
    ['CPU', `${entorno.cpus ?? '—'} · ${entorno.modeloDeCpu ?? '—'}`],
    ['Memoria', `${f(entorno.memoriaGb, 1)} GB`],
    ['Node', entorno.node ?? '—'],
    ['PostgreSQL', (entorno.postgres ?? '—').split(' on ')[0]],
    ['Imagen de PostgreSQL', entorno.imagenDePostgres ? `\`${entorno.imagenDePostgres}\`` : '—'],
    ['shared_buffers · max_connections', `${pg.shared_buffers ?? '—'} · ${pg.max_connections ?? '—'}`],
    ['fsync · synchronous_commit', `${pg.fsync ?? '—'} · ${pg.synchronous_commit ?? '—'}`],
    ['Conexiones de la API vistas (máximo en concurrencia · al terminar)', `${f(Math.max(0, ...resumenes.map((x) => x.actividad?.conexionesDeLaApiMax ?? 0)))} · ${f(entorno.conexionesDeLaApiAlTerminar)}`],
    ['Duración de la corrida', `${f(entorno.minutos)} min (población: ${f(poblacion.segundos)} s)`],
  ],
);

L.push('## La población', '');
const carteras = poblacion.carteras ?? {};
const claves = ['alcancesNutricion', 'alcancesEntrenamiento', 'alcancesAntropometria', 'versionesNutricionalesActivadas', 'versionesNutricionalesBorrador', 'versionesDeEntrenamientoActivadas', 'procesosAbiertosNutricion', 'procesosAbiertosEntrenamiento', 'proximasRevisiones', 'revisionesNutricionales', 'comidasRegistradas', 'personasConComidas', 'sesionesDeEntrenamiento', 'personasConSesiones', 'solicitudesDeFormulario', 'solicitudesRespondidas', 'tomasAntropometricasRegistradas', 'tomasAntropometricasEnPreparacion', 'medicionesAntropometricas'];
const nombresDeCarteras = Object.keys(carteras);
tabla(
  ['Filas en la base', ...nombresDeCarteras],
  [
    ['Personas pedidas', ...nombresDeCarteras.map((c) => f(carteras[c].personasPedidas))],
    ...claves.map((k) => [k, ...nombresDeCarteras.map((c) => (typeof carteras[c].filas?.[k] === 'number' ? f(carteras[c].filas[k]) : String(carteras[c].filas?.[k] ?? '—')))]),
    ['Pendientes (ítems)', ...nombresDeCarteras.map((c) => f(carteras[c].pendientes?.items))],
    ['Páginas de 50', ...nombresDeCarteras.map((c) => f(carteras[c].pendientes?.paginas))],
  ],
);
for (const c of nombresDeCarteras) {
  const t = carteras[c].pendientes?.porTipo;
  if (t && Object.keys(t).length) L.push(`- **${c}**, pendientes por área y tipo: ${Object.entries(t).sort().map(([k, v]) => `${k} ${v}`).join(' · ')}`);
}
if (Object.keys(poblacion.erroresDeLaHistoria ?? {}).length) L.push('', `**Errores al sembrar la historia:** ${Object.entries(poblacion.erroresDeLaHistoria).map(([k, v]) => `${k} (${v})`).join(' · ')}`);
const totales = poblacion.totalesDeLaBaseAlEmpezarLaMedicion ?? {};
const totalesFin = poblacion.totalesDeLaBaseAlTerminar ?? {};
L.push('', `Toda la base al empezar a medir: ${f(totales.identidad)} identidades, ${f(totales.decision_de_acceso)} decisiones de acceso (${f((totales['decision_de_acceso.bytes'] ?? 0) / 1024 ** 2, 1)} MB), ${f(totales.ingesta_nutricional)} comidas registradas. Al terminar: ${f(totalesFin.decision_de_acceso)} decisiones (${f((totalesFin['decision_de_acceso.bytes'] ?? 0) / 1024 ** 2, 1)} MB).`, '');

L.push('## Latencia por lote', '');
L.push('Latencia medida en el cliente (mismo proceso que la API), en ms. Cada lote, después de su calentamiento. Los pedidos con error **están** en la latencia y se cuentan aparte.', '');
tabla(
  ['Lote', 'Modo', 'Personas', 'Clientes', 'n', 'Con error', 'p50', 'p95', 'p99', 'Máximo', 'Pedidos/s', 'Concurrencia efectiva'],
  resumenes.map((x) => [x.lote, x.modo + (x.instrumentada ? '' : ' · sin instrumentar'), f(x.personas), f(x.clientes), f(x.n), x.conError ? `**${f(x.conError)}** ${JSON.stringify(x.errores)}` : '0', f(x.latencia.p50), f(x.latencia.p95), f(x.latencia.p99), f(x.latencia.max), f(x.pedidosPorSegundo, 2), f(x.concurrenciaEfectiva, 2)]),
);

L.push('## Dónde se va el tiempo del servidor', '');
L.push('Medianas por pedido, en ms, de la instrumentación del arnés. «Antes del PDP»: sesión, límite y la consulta de vínculos. «PDP»: de la primera decisión a la última. «Lectura»: la transacción de pendientes. «Después»: orden, paginación y respuesta.', '');
tabla(
  ['Lote', 'Total', 'Antes del PDP', 'PDP', 'ms por decisión', 'Lectura', 'Después', 'PDP / total', 'Lectura / total', 'Reintentos del PDP', 'GC p50 · máx.'],
  resumenes
    .filter((x) => x.servidor)
    .map((x) => [x.lote, f(x.servidor.total.p50), f(x.servidor.antesDelPdp.p50, 1), f(x.servidor.pdpTramo.p50), f(x.servidor.pdpPorDecision.media, 2), f(x.servidor.lectura.p50), f(x.servidor.despuesDeLectura.p50, 1), pct(x.servidor.parteDelPdp), pct(x.servidor.parteDeLaLectura), f(x.servidor.pdpReintentos), `${f(x.gc.p50, 1)} · ${f(x.gc.max, 1)}`]),
);

L.push('## La base por pedido', '');
L.push('Promedios del lote entero (contadores de PostgreSQL de la base medida; el arnés lee desde otra base). «En transacción esperando a la API»: tiempo con una transacción abierta y la conexión ociosa, esperando la sentencia siguiente.', '');
tabla(
  ['Lote', 'Transacciones', 'Filas insertadas', 'ms activos en la base', 'ms en transacción esperando a la API', 'Registros WAL', 'KB de WAL', 'Sincronizaciones WAL', 'ms sincronizando WAL', 'Bloques leídos del disco', 'Checkpoints', 'Autovacuum de decisiones'],
  resumenes.filter((x) => x.porPedido).map((x) => [x.lote, f(x.porPedido.transaccionesConfirmadas, 1), f(x.porPedido.filasInsertadas, 1), f(x.porPedido.msActivosEnLaBase, 1), f(x.porPedido.msEnTransaccionEsperandoALaApi, 1), f(x.porPedido.registrosWal), f(x.porPedido.bytesWal / 1024, 1), f(x.porPedido.sincronizacionesWal, 1), f(x.porPedido.msSincronizandoWal, 2), f(x.porPedido.bloquesLeidosDelDisco, 1), f(x.checkpoints), f(x.autovacuumDeDecisiones)]),
);

L.push('## Filas nuevas en `decision_de_acceso`, pedido por pedido', '');
L.push('Contadas por el `request_id` de cada pedido, después de medir. «Esperadas» = 3 por persona (una por área del catálogo).', '');
tabla(
  ['Lote', 'Esperadas por pedido', 'Mínimo', 'Máximo', 'Distribución (valor (pedidos))', 'Bytes agregados a la tabla en el lote'],
  resumenes.map((x) => [x.lote, f(x.filasDeDecision.esperadasPorPedido), f(x.filasDeDecision.min), f(x.filasDeDecision.max), x.filasDeDecision.distribucion, f(x.bytesDeDecisionesAgregados)]),
);
L.push(`Filas de decisión de pedidos que no son muestras (siembra e inventario): ${f(resumen.filasDeDecisionSinMuestra.pedidos)} pedidos, ${f(resumen.filasDeDecisionSinMuestra.filas)} filas. Sin request_id: ${JSON.stringify(resumen.filasDeDecisionSinRequestId)}.`, '');

L.push('## Concurrencia: la máquina', '');
tabla(
  ['Lote', 'Clientes', 'Hilo de Node ocupado', 'Núcleos del proceso', 'Núcleos de PostgreSQL', 'Núcleos ocupados de la máquina', 'iowait', 'Conexiones de la API (máx.)', 'Activas (máx. · prom.)', 'Esperas vistas (activas)'],
  resumenes
    .filter((x) => x.modo === 'concurrente' || x.modo === 'secuencial')
    .map((x) => [
      x.lote,
      f(x.clientes),
      pct(x.hilo),
      f(x.nucleosDelProceso, 2),
      f(x.nucleosDePostgres, 2),
      f(x.nucleosOcupadosDeLaMaquina, 2),
      pct(x.iowait),
      f(x.actividad?.conexionesDeLaApiMax),
      x.actividad ? `${f(x.actividad.activasDeLaApiMax)} · ${f(x.actividad.activasDeLaApiPromedio, 2)}` : '—',
      x.actividad ? Object.entries(x.actividad.esperas ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(' · ') : '—',
    ]),
);

for (const [escenario, a] of Object.entries(aperturasPorEscenario)) {
  if (!a) continue;
  L.push(`## Apertura completa · ${escenario}`, '');
  L.push(`${f(a.aperturas)} aperturas (${f(a.completas)} completas). Páginas por apertura: ${a.paginasPorApertura}. Ítems por apertura: ${a.itemsPorApertura}. Tiempo de una apertura: p50 ${f(a.msPorApertura.p50)} ms, p95 ${f(a.msPorApertura.p95)} ms; las primeras 4 páginas (lo que lee el website de una vez): p50 ${f(a.msPrimeras4.p50)} ms. Filas de decisión por apertura: ${a.filasPorApertura}; en las primeras 4 páginas: ${a.filasPrimeras4}.`, '');
  tabla(
    ['Página', 'n', 'Con error', 'p50 (ms)', 'p95 (ms)', 'PDP p50', 'Lectura p50', 'Ítems', 'Filas de decisión'],
    a.paginas.map((p) => [f(p.pagina), f(p.n), f(p.conError), f(p.p50), f(p.p95), f(p.pdpP50), f(p.lecturaP50), p.items, p.filas]),
  );
}

L.push('## Sentencias por pedido (lotes secuenciales con estadísticas)', '');
for (const x of resumenes.filter((y) => y.sentenciasPorPedido)) {
  const s = x.sentenciasPorPedido;
  L.push(`### ${x.lote}`, '', `${f(s.pedidos)} pedidos. Sentencias por pedido: ${f(s.sentencias.min)} a ${f(s.sentencias.max)}. COMMIT por pedido: ${s.commits}. Tiempo de ejecución en la base (sentencias de primer nivel): p50 ${f(s.msEnLaBase.p50, 1)} ms, p95 ${f(s.msEnLaBase.p95, 1)} ms.`, '');
  tabla(
    ['Sentencia', 'Llamadas por pedido (mín.–máx.)', 'ms por pedido (media)', 'ms por llamada'],
    s.detalle.map((d) => [d.nombre + (d.interna ? ' *(dentro de otra)*' : ''), `${f(d.llamadasPorPedido.min)}–${f(d.llamadasPorPedido.max)}`, f(d.msPorPedido, 2), f(d.msPorLlamada, 3)]),
  );
}

L.push('## Sentencias por pedido en concurrencia (promedio del lote)', '');
for (const x of resumenes.filter((y) => y.modo === 'concurrente' && y.sentenciasDelLote)) {
  L.push(`### ${x.lote}`, '');
  tabla(
    ['Sentencia', 'Llamadas por pedido', 'ms por pedido', 'ms por llamada'],
    x.sentenciasDelLote.slice(0, 14).map((d) => [d.nombre + (d.interna ? ' *(dentro de otra)*' : ''), f(d.llamadasPorPedido, 1), f(d.msPorPedido, 2), f(d.msPorLlamada, 3)]),
  );
}

L.push('## Comparación con la medición anterior', '');
const deRef = (n, fuente) => fuente?.find((x) => x.personas === n) ?? null;
const tamanios = [...new Set(resumenes.filter((x) => /^S-B\d+$/.test(x.escenario)).map((x) => x.personas))].sort((a, b) => a - b);
tabla(
  ['Personas', 'Referencia 40641148313: p50 · p95 · máx.', 'Control (arnés anterior, esta máquina): p50 · p95 · máx.', 'Esta medición, instrumentada (todas las repeticiones): p50 · p95 · máx. (n)', 'Sin instrumentar: p50 · p95 · máx. (n)'],
  tamanios.map((n) => {
    const ref = deRef(n, referencia?.resultados);
    const ctl = deRef(n, control?.resultados);
    const con = mezclar(`S-B${n}`);
    const sin = mezclar(`S-B${n}-sin`);
    const tri = (o) => (o ? `${f(o.mediana ?? o.p50)} · ${f(o.p95)} · ${f(o.maximo ?? o.max)}` : '—');
    return [f(n), ref ? tri(ref.ms) : '—', ctl ? tri(ctl.ms) : '—', con ? `${tri(con)} (${f(con.n)})` : '—', sin ? `${tri(sin)} (${f(sin.n)})` : '—'];
  }),
);
if (sobrecarga) {
  L.push(`**Sobrecarga de la instrumentación** (escenario ${escenarioGrande}, aplicación y servidor juntos): mediana ${f(sobrecarga.con.p50)} ms con instrumentación y ${f(sobrecarga.sin.p50)} ms sin ella (${f(sobrecarga.diferenciaP50, 1)} ms, ${pct(sobrecarga.relativaP50)}); media ${f(sobrecarga.con.media)} contra ${f(sobrecarga.sin.media)} ms (${pct(sobrecarga.relativaMedia)}).`, '');
}

const conErrores = resumenes.filter((x) => x.errores.length || x.incompleto);
if (conErrores.length) {
  L.push('## Errores del arnés', '');
  for (const x of conErrores) L.push(`- ${x.lote}${x.incompleto ? ' (**incompleto**)' : ''}: ${x.errores.slice(0, 5).join(' · ')}${x.errores.length > 5 ? ` … y ${x.errores.length - 5} más` : ''}`);
  L.push('');
}
const envolturas = resumenes.filter((x) => x.envolturasComoSeEsperaba === false);
if (envolturas.length) L.push(`**Atención:** en ${envolturas.map((x) => x.lote).join(', ')} la instrumentación no quedó como se esperaba.`, '');

writeFileSync(join(carpeta, 'resumen.md'), `${L.join('\n')}\n`);
console.log(`resumen.md y resumen.json en ${carpeta}: ${resumenes.length} lotes, ${muestras.length} muestras.`);
