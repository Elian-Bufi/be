/**
 * Arma el resumen por ID de prueba a partir del `resultados-integracion.json` que publica la CI (Jest `--json`).
 *
 * Por qué existe: la evidencia de cada paquete tiene que poder rehacerse igual en cualquier momento. La primera vez
 * este resumen se armó a mano, y un resumen a mano no es verificable: nadie puede repetirlo y comparar.
 *
 * El ID de cada prueba sale del **primer identificador del 11A** que aparece en su título completo (nombre de los
 * `describe` más el del `it`). Una prueba sin ningún ID cuenta en «(sin ID 11A)»: no se la esconde ni se la infla.
 *
 * Uso: node scripts/resumen-integracion.mjs <resultados-integracion.json> <salida.md> [inicioDeLaCorrida]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [entrada, salida] = process.argv.slice(2);
if (!entrada || !salida) throw new Error('uso: node scripts/resumen-integracion.mjs <resultados.json> <salida.md>');

const d = JSON.parse(readFileSync(entrada, 'utf8'));

/**
 * Los identificadores del 11A, de más específico a menos: la alternancia de una expresión regular se resuelve por
 * orden, así que `TEST-CT-ACC-01` tiene que ir antes que `TEST-CT` o el bare se comería al numerado.
 * `TEST-AUTH-013` se subdivide en (a) y (b) en el propio 11A, y esa distinción se conserva.
 */
const ID = new RegExp(
  [
    'TEST-CT-P1-ACC-P1-\\d+',
    'TEST-CT-ACC-\\d+',
    'TEST-AUTH-013 \\([ab]\\)',
    'TEST-UC-P\\d+',
    'TEST-[A-Z]+(?:-[A-Z]+)*-\\d+',
    'TEST-CT',
    'E2E-\\d+',
    'T-06-\\d+',
    'REG-06-\\d+',
    'INV-06-\\d+',
  ].join('|'),
);
const SIN_ID = '(sin ID 11A)';

/**
 * El ID sale del título del `it`, no del `describe`. Un `describe` suele nombrar la regla del 06 que enmarca al
 * grupo entero («API-MTH-01/02 — métodos versionados (REG-06-203)»), así que buscar ahí primero hundiría todas las
 * pruebas del grupo bajo esa regla y haría desaparecer su ID propio. Solo si el `it` no trae ninguno se mira arriba.
 */
function idDe(titulo, ancestros) {
  return titulo.match(ID)?.[0] ?? ancestros.join(' ').match(ID)?.[0] ?? SIN_ID;
}

const porId = new Map();
const filas = [];
for (const suite of d.testResults) {
  // Jest `--json` nombra la suite en `name` y sus pruebas en `assertionResults`.
  const archivo = suite.name.split(/[\\/]/).pop();
  for (const t of suite.assertionResults) {
    const titulo = [...t.ancestorTitles, t.title].join(' › ');
    const id = idDe(t.title, t.ancestorTitles);
    const cubo = porId.get(id) ?? { paso: 0, fallo: 0, otra: 0 };
    if (t.status === 'passed') cubo.paso += 1;
    else if (t.status === 'failed') cubo.fallo += 1;
    else cubo.otra += 1;
    porId.set(id, cubo);
    filas.push({ archivo, titulo, estado: t.status === 'passed' ? 'PASS' : t.status === 'failed' ? 'FAIL' : t.status.toUpperCase(), ms: t.duration ?? 0 });
  }
}

/** «(sin ID)» primero y después alfabético, que es como se leyó el resumen del paquete anterior. */
const orden = [...porId.keys()].sort((a, b) => (a === SIN_ID ? -1 : b === SIN_ID ? 1 : a.localeCompare(b, 'es')));

const md = [
  '# Resultados de integración por ID de prueba',
  '',
  `- Fuente: \`resultados-integracion.json\` (Jest \`--json\`), inicio ${new Date(d.startTime).toISOString()}.`,
  `- Totales: **${d.numTotalTests}** · pasaron **${d.numPassedTests}** · fallaron **${d.numFailedTests}** · pendientes ${d.numPendingTests}.`,
  `- Suites: ${d.numTotalTestSuites} (${d.numFailedTestSuites} fallidas). Resultado global: **${d.success ? 'OK' : 'CON FALLOS'}**.`,
  '',
  '## Por ID',
  '',
  '| ID | Pasaron | Fallaron | Otras |',
  '|---|---|---|---|',
  ...orden.map((id) => {
    const c = porId.get(id);
    return `| ${id} | ${c.paso} | ${c.fallo} | ${c.otra} |`;
  }),
  '',
  '## Detalle',
  '',
  '| Suite | Prueba | Estado | ms |',
  '|---|---|---|---|',
  ...filas.map((f) => `| ${f.archivo} | ${f.titulo.replace(/\|/g, '\\|')} | ${f.estado} | ${Math.round(f.ms)} |`),
  '',
].join('\n');

writeFileSync(salida, md);
process.stdout.write(`${d.numPassedTests}/${d.numTotalTests} · ${orden.length} ids · ${salida}\n`);
