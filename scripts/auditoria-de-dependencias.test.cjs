/**
 * DL-114 · la auditoría de dependencias falla con un aviso alto o crítico, salvo una excepción declarada y vigente; una
 * excepción vencida vuelve a fallar. Los reportes son recortes de `npm audit --json` con la forma real.
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { clasificarAvisos, EXCEPCIONES } = require('./auditoria-de-dependencias.cjs');

const aviso = (name, ghsa, severity) => ({ source: 1, name, title: `Aviso de ${name}`, url: `https://github.com/advisories/${ghsa}`, severity, range: '*' });
const reporte = (...vias) => ({
  vulnerabilities: {
    expo: { name: 'expo', severity: 'high', via: ['@expo/cli'] },
    ...Object.fromEntries(vias.map((v) => [v.name, { name: v.name, severity: v.severity, via: [v] }])),
  },
});
const excepcion = { aviso: 'GHSA-aaaa-bbbb-cccc', paquete: 'node-forge', motivo: 'de prueba', vence: '2026-10-31' };

test('un aviso alto sin excepción hace fallar la auditoría', () => {
  const r = clasificarAvisos(reporte(aviso('otro-paquete', 'GHSA-xxxx-yyyy-zzzz', 'high')), [excepcion], '2026-10-02');
  assert.deepEqual(r.fallan.map((a) => a.paquete), ['otro-paquete']);
});

test('un aviso exceptuado y vigente no falla, y queda informado', () => {
  const r = clasificarAvisos(reporte(aviso('node-forge', 'GHSA-aaaa-bbbb-cccc', 'high')), [excepcion], '2026-10-02');
  assert.deepEqual(r.fallan, []);
  assert.deepEqual(r.exceptuados.map((a) => a.aviso), ['GHSA-aaaa-bbbb-cccc']);
});

test('una excepción vencida vuelve a fallar', () => {
  const r = clasificarAvisos(reporte(aviso('node-forge', 'GHSA-aaaa-bbbb-cccc', 'critical')), [excepcion], '2026-11-01');
  assert.deepEqual(r.vencidas.map((a) => a.vence), ['2026-10-31']);
});

test('la excepción es por aviso y paquete: el mismo aviso en otro paquete falla', () => {
  const r = clasificarAvisos(reporte(aviso('otro-paquete', 'GHSA-aaaa-bbbb-cccc', 'high')), [excepcion], '2026-10-02');
  assert.equal(r.fallan.length, 1);
});

test('los avisos moderados no hacen fallar, como con --audit-level=high', () => {
  const r = clasificarAvisos(reporte(aviso('uuid', 'GHSA-w5hq-g745-h8pq', 'moderate')), [], '2026-10-02');
  assert.deepEqual(r, { fallan: [], exceptuados: [], vencidas: [] });
});

test('cada excepción declarada tiene motivo y una fecha de vencimiento', () => {
  for (const e of EXCEPCIONES) {
    assert.match(e.aviso, /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/);
    assert.ok(e.motivo.length > 40);
    assert.match(e.vence, /^\d{4}-\d{2}-\d{2}$/);
  }
});
