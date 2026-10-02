/**
 * DL-114 · la auditoría de dependencias, de la salida de `npm audit --json` al código de salida:
 * - un informe limpio aprueba (0); un aviso alto o crítico sin excepción, o una excepción vencida, bloquea (1);
 * - una excepción declarada y vigente no bloquea, y queda informada;
 * - un error de npm (ENOAUDIT), una salida que no es JSON o un informe incompleto **no aprueban**: la auditoría no se pudo
 *   hacer (2), con un código distinto del de las vulnerabilidades.
 * Las salidas imitan la forma real de npm 10 (`auditReportVersion` 2, `vulnerabilities` y `metadata.vulnerabilities`).
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { clasificarAvisos, evaluarSalida, codigoFinal, CODIGO, EXCEPCIONES } = require('./auditoria-de-dependencias.cjs');

const aviso = (name, ghsa, severity) => ({ source: 1, name, dependency: name, title: `Aviso de ${name}`, url: `https://github.com/advisories/${ghsa}`, severity, range: '*' });
const reporte = (...vias) => ({
  vulnerabilities: {
    expo: { name: 'expo', severity: 'high', via: ['@expo/cli'] },
    ...Object.fromEntries(vias.map((v) => [v.name, { name: v.name, severity: v.severity, via: [v] }])),
  },
});
/** La salida de npm como texto, con los conteos coherentes con los avisos. */
function salida(...vias) {
  const conteos = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  for (const v of vias) conteos[v.severity] += 1;
  const total = Object.values(conteos).reduce((a, b) => a + b, 0);
  const vulnerabilities = Object.fromEntries(vias.map((v) => [v.name, { name: v.name, severity: v.severity, isDirect: false, via: [v], effects: [], range: '*', nodes: [`node_modules/${v.name}`], fixAvailable: false }]));
  return JSON.stringify({ auditReportVersion: 2, vulnerabilities, metadata: { vulnerabilities: { ...conteos, total }, dependencies: { prod: 100, total: 100 } } });
}
const excepcion = { aviso: 'GHSA-aaaa-bbbb-cccc', paquete: 'node-forge', motivo: 'de prueba', vence: '2026-10-31' };
const HOY = '2026-10-02';

// ─── Clasificación ────────────────────────────────────────────────────────────────────────────

test('un aviso alto sin excepción se clasifica como bloqueante', () => {
  const r = clasificarAvisos(reporte(aviso('otro-paquete', 'GHSA-xxxx-yyyy-zzzz', 'high')), [excepcion], HOY);
  assert.deepEqual(r.fallan.map((a) => a.paquete), ['otro-paquete']);
});

test('la excepción es por aviso y paquete: el mismo aviso en otro paquete bloquea', () => {
  const r = clasificarAvisos(reporte(aviso('otro-paquete', 'GHSA-aaaa-bbbb-cccc', 'high')), [excepcion], HOY);
  assert.equal(r.fallan.length, 1);
});

// ─── De la salida de npm al código ─────────────────────────────────────────────────────────────

test('informe limpio: aprueba (0)', () => {
  const r = evaluarSalida('@be/api', salida(), [excepcion], HOY);
  assert.equal(r.codigo, CODIGO.APRUEBA);
  assert.match(r.lineas.join('\n'), /✓ @be\/api/);
});

test('vulnerabilidad alta sin excepción: bloquea (1)', () => {
  const r = evaluarSalida('@be/web', salida(aviso('otro-paquete', 'GHSA-xxxx-yyyy-zzzz', 'high')), [excepcion], HOY);
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(r.lineas.join('\n'), /✗ @be\/web: high · otro-paquete · GHSA-xxxx-yyyy-zzzz/);
});

test('excepción vigente: aprueba (0) y lo informa con su vencimiento', () => {
  const r = evaluarSalida('@be/mobile', salida(aviso('node-forge', 'GHSA-aaaa-bbbb-cccc', 'high')), [excepcion], HOY);
  assert.equal(r.codigo, CODIGO.APRUEBA);
  assert.match(r.lineas.join('\n'), /exceptuado hasta el 2026-10-31 · node-forge · GHSA-aaaa-bbbb-cccc/);
});

test('excepción vencida: bloquea (1)', () => {
  const r = evaluarSalida('@be/mobile', salida(aviso('node-forge', 'GHSA-aaaa-bbbb-cccc', 'critical')), [excepcion], '2026-11-01');
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(r.lineas.join('\n'), /excepción vencida el 2026-10-31/);
});

test('error de npm audit (ENOAUDIT): no aprueba; no se pudo auditar (2)', () => {
  const r = evaluarSalida('@be/api', '{"error":{"code":"ENOAUDIT","summary":"Audit endpoint unavailable"}}', [excepcion], HOY);
  assert.equal(r.codigo, CODIGO.NO_SE_PUDO_AUDITAR);
  assert.match(r.lineas.join('\n'), /ENOAUDIT · Audit endpoint unavailable/);
  assert.doesNotMatch(r.lineas.join('\n'), /✓/);
});

test('salida vacía o que no es JSON: no aprueba (2)', () => {
  for (const s of ['', '   ', 'npm ERR! network', '[]', 'null']) {
    assert.equal(evaluarSalida('@be/web', s, [], HOY).codigo, CODIGO.NO_SE_PUDO_AUDITAR, JSON.stringify(s));
  }
});

test('informe incompleto: sin «vulnerabilities», sin conteos o con conteos que no cierran, no aprueba (2)', () => {
  const sinVulnerabilidades = JSON.stringify({ auditReportVersion: 2, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 } } });
  const sinConteos = JSON.stringify({ auditReportVersion: 2, vulnerabilities: {} });
  const recortado = JSON.stringify({ auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 2, critical: 0, total: 2 } } });
  for (const s of [sinVulnerabilidades, sinConteos, recortado]) assert.equal(evaluarSalida('@be/api', s, [], HOY).codigo, CODIGO.NO_SE_PUDO_AUDITAR, s);
});

test('los avisos moderados no bloquean, como con --audit-level=high', () => {
  assert.equal(evaluarSalida('@be/mobile', salida(aviso('uuid', 'GHSA-w5hq-g745-h8pq', 'moderate')), [], HOY).codigo, CODIGO.APRUEBA);
});

test('el código final es el peor de los espacios: no poder auditar pesa más que una vulnerabilidad', () => {
  assert.equal(codigoFinal([CODIGO.APRUEBA, CODIGO.APRUEBA]), 0);
  assert.equal(codigoFinal([CODIGO.APRUEBA, CODIGO.VULNERABILIDADES]), 1);
  assert.equal(codigoFinal([CODIGO.VULNERABILIDADES, CODIGO.NO_SE_PUDO_AUDITAR, CODIGO.APRUEBA]), 2);
  assert.equal(codigoFinal([]), 0);
});

test('cada excepción declarada tiene motivo y una fecha de vencimiento', () => {
  for (const e of EXCEPCIONES) {
    assert.match(e.aviso, /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/);
    assert.ok(e.motivo.length > 40);
    assert.match(e.vence, /^\d{4}-\d{2}-\d{2}$/);
  }
});
