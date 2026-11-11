// Extrae de resumen-ab.json (test/rendimiento/analizar-ab.mjs) los números que muestra el PDF didáctico y los deja en
// datos.json, al lado de la fuente Typst. Uso: node datos.mjs <carpeta-de-resultados-con-resumen-ab.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , carpeta] = process.argv;
if (!carpeta) {
  console.error('Uso: node datos.mjs <carpeta-de-resultados>');
  process.exit(2);
}
const R = JSON.parse(readFileSync(join(carpeta, 'resumen-ab.json'), 'utf8'));
const r1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);
const pct = (a, b) => (a && b !== null && b !== undefined ? r1(((b - a) / a) * 100) : null);

const ESCENARIOS = [
  ['S-B50', '50 personas'],
  ['S-B100', '100 personas'],
  ['S-B200', '200 personas'],
  ['S-H200', '200 con historia'],
  ['C1', '1 a la vez, sin pausa'],
  ['C3', '3 a la vez, sin pausa'],
  ['C5', '5 a la vez, sin pausa'],
];
const filas = [];
for (const [id, que] of ESCENARIOS) {
  const e = R.resumen[id];
  if (!e?.base?.juntas || !e?.propuesta?.juntas) continue;
  const b = e.base.juntas;
  const p = e.propuesta.juntas;
  const rep = (v, k) => [e[v].r1?.[k] ?? null, e[v].r2?.[k] ?? null];
  filas.push({
    escenario: id,
    que,
    pedidos: { base: b.pedidos, propuesta: p.pedidos },
    errores: { base: b.conError, propuesta: p.conError },
    p50: { base: b.p50, propuesta: p.p50, delta: pct(b.p50, p.p50), r1: pct(e.base.r1?.p50, e.propuesta.r1?.p50), r2: pct(e.base.r2?.p50, e.propuesta.r2?.p50) },
    p95: { base: b.p95, propuesta: p.p95, delta: pct(b.p95, p.p95) },
    variacionDeLaBase: pct(e.base.r1?.p50, e.base.r2?.p50),
    paginasPorSegundo: { base: e.base.r1?.paginasPorSegundo ?? null, propuesta: e.propuesta.r1?.paginasPorSegundo ?? null, r2: { base: e.base.r2?.paginasPorSegundo ?? null, propuesta: e.propuesta.r2?.paginasPorSegundo ?? null } },
    sentencias: { base: e.base.r1?.sentencias ?? null, propuesta: e.propuesta.r1?.sentencias ?? null },
    sqlMs: { base: e.base.r1?.sqlMs ?? null, propuesta: e.propuesta.r1?.sqlMs ?? null },
    lectura: { base: rep('base', 'lecturaMs'), propuesta: rep('propuesta', 'lecturaMs') },
    pdp: { base: rep('base', 'pdpTramoMs'), propuesta: rep('propuesta', 'pdpTramoMs') },
    filasDeDecision: { base: e.base.r1?.filasDeDecision ?? null, propuesta: e.propuesta.r1?.filasDeDecision ?? null },
    commits: { base: e.base.r1?.commits ?? null, propuesta: e.propuesta.r1?.commits ?? null },
  });
}
const aperturas = Object.entries(R.aperturas ?? {}).map(([id, v]) => ({
  escenario: id,
  base: v.base,
  propuesta: v.propuesta,
  deltaPrimerasCuatro: pct(v.base?.primerasCuatroP50, v.propuesta?.primerasCuatroP50),
  deltaTodaLaLista: pct(v.base?.todaLaListaP50, v.propuesta?.todaLaListaP50),
}));
const datos = {
  estado: 'medido',
  corrida: R.entorno?.corrida?.id ?? null,
  commit: R.entorno?.commit ?? null,
  maquina: `${R.entorno?.cpus ?? '?'} CPU (${R.entorno?.modeloDeCpu ?? '?'}), ${R.entorno?.memoriaGb ?? '?'} GB, Node ${R.entorno?.node ?? '?'}, PostgreSQL ${String(R.entorno?.postgres ?? '?').split(' ')[1] ?? '?'}`,
  minutos: R.estado?.minutos ?? null,
  versionesOk: R.versionesOk,
  erroresTotales: R.erroresTotales,
  coinciden: Object.values(R.coincidencias ?? {}).every((c) => c === true),
  carteras: Object.keys(R.coincidencias ?? {}).length,
  filas,
  aperturas,
};
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'datos.json'), `${JSON.stringify(datos, null, 2)}\n`);
console.log(`datos.json: ${filas.length} escenarios, ${aperturas.length} aperturas`);
