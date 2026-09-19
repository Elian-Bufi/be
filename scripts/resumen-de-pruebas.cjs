#!/usr/bin/env node
/**
 * Resume la salida JSON de Jest (`--json --outputFile`) por ID de prueba del 11A, para la evidencia de cada paquete.
 * Uso: node scripts/resumen-de-pruebas.cjs <resultados.json> [salida.md]
 * Cada prueba se agrupa por el primer ID de su título (TEST-…, E2E-…, INV-06-…, T-06-…, REG-06-…).
 */
const { readFileSync, writeFileSync } = require('node:fs');
const { basename } = require('node:path');

const [entrada, salida] = process.argv.slice(2);
if (!entrada) {
  process.stderr.write('Uso: node scripts/resumen-de-pruebas.cjs <resultados.json> [salida.md]\n');
  process.exit(2);
}

const r = JSON.parse(readFileSync(entrada, 'utf8'));
const ID = /(TEST-[A-Z0-9]+(?:-[A-Z0-9]+)*(?: \([ab]\))?|E2E-\d+|INV-06-\d+|T-06-\d+|REG-06-\d+)/;
const porId = new Map();
const filas = [];
for (const suite of r.testResults) {
  const archivo = basename(suite.name);
  for (const t of suite.assertionResults) {
    const nombre = [...t.ancestorTitles, t.title].join(' › ');
    const id = (t.title.match(ID) || nombre.match(ID) || [])[1] || '(sin ID 11A)';
    const e = porId.get(id) || { pasaron: 0, fallaron: 0, otras: 0 };
    if (t.status === 'passed') e.pasaron++;
    else if (t.status === 'failed') e.fallaron++;
    else e.otras++;
    porId.set(id, e);
    filas.push({ archivo, id, nombre, estado: t.status === 'passed' ? 'PASS' : t.status === 'failed' ? 'FAIL' : t.status.toUpperCase(), ms: t.duration ?? '' });
  }
}

const lineas = [
  `# Resultados de integración por ID de prueba`,
  '',
  `- Fuente: \`${basename(entrada)}\` (Jest \`--json\`), inicio ${new Date(r.startTime).toISOString()}.`,
  `- Totales: **${r.numTotalTests}** · pasaron **${r.numPassedTests}** · fallaron **${r.numFailedTests}** · pendientes ${r.numPendingTests}.`,
  `- Suites: ${r.numTotalTestSuites} (${r.numFailedTestSuites} fallidas). Resultado global: **${r.success ? 'OK' : 'FALLÓ'}**.`,
  '',
  '## Por ID',
  '',
  '| ID | Pasaron | Fallaron | Otras |',
  '|---|---|---|---|',
  ...[...porId.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, e]) => `| ${id} | ${e.pasaron} | ${e.fallaron} | ${e.otras} |`),
  '',
  '## Detalle',
  '',
  '| Archivo | Prueba | Estado | ms |',
  '|---|---|---|---|',
  ...filas.map((f) => `| ${f.archivo} | ${f.nombre.replace(/\|/g, '\\|')} | ${f.estado} | ${f.ms} |`),
  '',
];

const texto = lineas.join('\n');
if (salida) writeFileSync(salida, texto);
else process.stdout.write(texto);
