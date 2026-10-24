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
const { clasificarAvisos, evaluarSalida, codigoFinal, procedenciaEnElLockfile, usuariosDe, copiasEnElBundle, CODIGO, EXCEPCIONES } = require('./auditoria-de-dependencias.cjs');

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
    // Si se acota a espacios, son espacios que la auditoría recorre (un nombre mal escrito no exceptuaría nada, en silencio).
    if (e.espacios) for (const espacio of e.espacios) assert.ok(['@be/api', '@be/web', '@be/mobile'].includes(espacio), espacio);
  }
});

test('una excepción acotada a un espacio no vale en otro: el zod de la CLI de Expo no tapa un zod viejo en la API', () => {
  const zod = { aviso: 'GHSA-mrhx-c7xc-m3w5', paquete: 'zod', espacios: ['@be/mobile'], motivo: 'de prueba', vence: '2026-10-31' };
  const informe = reporte(aviso('zod', 'GHSA-mrhx-c7xc-m3w5', 'high'));
  assert.deepEqual(clasificarAvisos(informe, [zod], HOY, '@be/mobile').exceptuados.map((a) => a.paquete), ['zod']);
  assert.deepEqual(clasificarAvisos(informe, [zod], HOY, '@be/api').fallan.map((a) => a.paquete), ['zod']);
  assert.deepEqual(clasificarAvisos(informe, [zod], HOY).fallan.map((a) => a.paquete), ['zod'], 'sin espacio, una excepción acotada no se aplica');
  // De punta a punta, por la salida de npm: en la API bloquea; en la APK, se informa exceptuado.
  assert.equal(evaluarSalida('@be/api', salida(aviso('zod', 'GHSA-mrhx-c7xc-m3w5', 'high')), [zod], HOY).codigo, CODIGO.VULNERABILIDADES);
  assert.equal(evaluarSalida('@be/mobile', salida(aviso('zod', 'GHSA-mrhx-c7xc-m3w5', 'high')), [zod], HOY).codigo, CODIGO.APRUEBA);
  // Y la declarada en el repositorio es la de la APK, no la de la API ni la del website.
  assert.deepEqual(EXCEPCIONES.find((e) => e.paquete === 'zod')?.espacios, ['@be/mobile']);
});

// ─── Procedencia: la excepción de zod vale solo para la cadena que se comprobó (propuesta del 2026-10-24) ───────

const ZOD = EXCEPCIONES.find((e) => e.paquete === 'zod');
const AVISO_ZOD = { source: 1, name: 'zod', dependency: 'zod', title: 'Zod can exhaust memory while validating oversized constrained collections', url: 'https://github.com/advisories/GHSA-mrhx-c7xc-m3w5', severity: 'high', range: '<4.6.6' };

/** La salida de npm para la APK con la forma real del 2026-10-24: el zod de la raíz, con la CLI y expo de intermedios. */
function salidaDeLaApk({ nodos = ['node_modules/zod'], rango = '<4.6.6' } = {}) {
  const vulnerabilities = {
    zod: { name: 'zod', severity: 'high', isDirect: false, via: [{ ...AVISO_ZOD, range: rango }], effects: ['@expo/cli'], range: rango, nodes: nodos, fixAvailable: false },
    '@expo/cli': { name: '@expo/cli', severity: 'high', isDirect: false, via: ['zod'], effects: ['expo'], range: '*', nodes: ['node_modules/@expo/cli'], fixAvailable: false },
    expo: { name: 'expo', severity: 'high', isDirect: true, via: ['@expo/cli'], effects: [], range: '*', nodes: ['node_modules/expo'], fixAvailable: false },
  };
  return JSON.stringify({ auditReportVersion: 2, vulnerabilities, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 3, critical: 0, total: 3 }, dependencies: { prod: 100, total: 100 } } });
}

/**
 * Un package-lock.json mínimo con la forma del real: la APK pide expo, expo pide la CLI, la CLI pide el zod 3 de la raíz,
 * Puppeteer lo usa en desarrollo, y el dominio tiene su zod 4.6.6 anidado. `cambios` reemplaza entradas (null las borra).
 */
function lockfile(cambios = {}) {
  const packages = {
    '': { name: 'be', workspaces: ['packages/domain', 'apps/api', 'apps/web', 'apps/mobile'], devDependencies: { 'puppeteer-core': '25.12.0' } },
    'apps/api': { name: '@be/api', version: '0.11.1', dependencies: { '@be/domain': '0.1.0' } },
    'apps/mobile': { name: '@be/mobile', version: '0.13.2', dependencies: { '@be/domain': '0.1.0', expo: '57.0.23', 'expo-constants': '57.0.18' } },
    'packages/domain': { name: '@be/domain', version: '0.1.0', dependencies: { zod: '4.6.6' } },
    'packages/domain/node_modules/zod': { version: '4.6.6' },
    'node_modules/@be/api': { resolved: 'apps/api', link: true },
    'node_modules/@be/domain': { resolved: 'packages/domain', link: true },
    'node_modules/@be/mobile': { resolved: 'apps/mobile', link: true },
    'node_modules/expo': { version: '57.0.23', dependencies: { '@expo/cli': '57.0.25' } },
    'node_modules/expo-constants': { version: '57.0.18', peerDependencies: { expo: '*' } },
    'node_modules/@expo/cli': { version: '57.0.25', dependencies: { zod: '^3.25.76', 'node-forge': '^1.3.3', '@expo/code-signing-certificates': '^0.0.6' }, peerDependencies: { expo: '*' } },
    'node_modules/@expo/code-signing-certificates': { version: '0.0.6', dependencies: { 'node-forge': '^1.4.0' } },
    'node_modules/node-forge': { version: '1.4.0' },
    'node_modules/zod': { version: '3.25.76' },
    'node_modules/puppeteer-core': { version: '25.12.0', dev: true, dependencies: { 'chromium-bidi': '17.0.2' } },
    'node_modules/chromium-bidi': { version: '17.0.2', dev: true, dependencies: { zod: '^3.24.1' } },
  };
  for (const [ubicacion, entrada] of Object.entries(cambios)) {
    if (entrada === null) delete packages[ubicacion];
    else packages[ubicacion] = { ...packages[ubicacion], ...entrada };
  }
  return { name: 'be', lockfileVersion: 3, packages };
}
const dependenciasDeLaApk = (extra) => ({ dependencies: { ...lockfile().packages['apps/mobile'].dependencies, ...extra } });

/** Un bundle de Android como el que arma Metro: la entrada, el dominio y su zod 4.6.6, y el `require` de la CLI. */
const BUNDLE = {
  entrada: 'apps/mobile/index.ts',
  fuentes: ['__prelude__', '/node_modules/@expo/cli/build/metro-require/require.js', '/apps/mobile/index.ts', '/apps/mobile/App.tsx', '/packages/domain/dist/index.js', '/packages/domain/node_modules/zod/index.cjs', '/packages/domain/node_modules/zod/v4/core/versions.cjs'],
};

/** El contexto de una corrida: el lockfile, el bundle (o el error al construirlo) y node_modules. Cuenta los bundles pedidos. */
function contexto({ lock = lockfile(), bundle = BUNDLE, instaladas = {} } = {}) {
  const ctx = {
    raiz: null,
    lockfile: lock,
    bundlesPedidos: 0,
    modulosDelBundle() {
      ctx.bundlesPedidos += 1;
      if (bundle instanceof Error) throw bundle;
      return bundle;
    },
    versionInstalada: (u) => (u in instaladas ? instaladas[u] : (lock?.packages?.[u]?.version ?? null)),
  };
  return ctx;
}
const texto = (r) => r.lineas.join('\n');

test('zod con la procedencia demostrada: se exceptúa, y la salida dice de dónde viene y qué zod viaja en la APK', () => {
  const ctx = contexto();
  const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, ctx);
  assert.equal(r.codigo, CODIGO.APRUEBA, texto(r));
  assert.match(texto(r), /exceptuado hasta el 2026-11-30 · zod · GHSA-mrhx-c7xc-m3w5 \(DL-114\)/);
  assert.match(texto(r), /procedencia comprobada en package-lock\.json: node_modules\/zod 3\.25\.76 ← @expo\/cli 57\.0\.25 ← expo 57\.0\.23 ← @be\/mobile/);
  assert.match(texto(r), /ninguno de node_modules\/zod; zod en el bundle: packages\/domain\/node_modules\/zod 4\.6\.6 \(2 módulos\)/);
  assert.match(texto(r), /en desarrollo también la usa node_modules\/chromium-bidi \(chromium-bidi 17\.0\.2\)/);
  assert.equal(ctx.bundlesPedidos, 1);
});

test('la APK declara zod 3: la excepción no lo tapa, y bloquea sin necesidad de construir el bundle', () => {
  const ctx = contexto({ lock: lockfile({ 'apps/mobile': dependenciasDeLaApk({ zod: '3.25.76' }) }) });
  const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, ctx);
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /✗ @be\/mobile: high · zod · GHSA-mrhx-c7xc-m3w5 · la excepción no cubre esta ruta: apps\/mobile \(@be\/mobile\) también usa node_modules\/zod en producción/);
  assert.doesNotMatch(texto(r), /exceptuado/);
  assert.equal(ctx.bundlesPedidos, 0);
});

test('una biblioteca que viaja en la APK trae zod 3: bloquea', () => {
  const lock = lockfile({
    'apps/mobile': dependenciasDeLaApk({ 'graficos-de-ejecucion': '1.0.0' }),
    'node_modules/graficos-de-ejecucion': { version: '1.0.0', dependencies: { zod: '^3.22.0' } },
  });
  const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, contexto({ lock }));
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /node_modules\/graficos-de-ejecucion \(graficos-de-ejecucion 1\.0\.0\) también usa node_modules\/zod en producción/);
});

test('la APK importa zod sin declararlo: el lockfile no lo ve, el bundle sí, y bloquea', () => {
  const bundle = { ...BUNDLE, fuentes: [...BUNDLE.fuentes, '/apps/mobile/src/validar.ts', '/node_modules/zod/index.cjs', '/node_modules/zod/v3/types.cjs'] };
  const ctx = contexto({ bundle });
  const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, ctx);
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /la excepción no cubre esta ruta: el bundle de Android incluye 2 módulos de node_modules\/zod \(3\.25\.76\): la APK la usaría al ejecutarse/);
  assert.equal(ctx.bundlesPedidos, 1);
});

test('npm encuentra otra copia vulnerable, por ejemplo anidada en la APK o con otro nombre (un alias): bloquea', () => {
  const lock = lockfile({ 'apps/mobile': dependenciasDeLaApk({ zod: '3.22.4' }), 'apps/mobile/node_modules/zod': { version: '3.22.4' } });
  const anidada = evaluarSalida('@be/mobile', salidaDeLaApk({ nodos: ['node_modules/zod', 'apps/mobile/node_modules/zod'] }), EXCEPCIONES, HOY, contexto({ lock }));
  assert.equal(anidada.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(anidada), /npm encontró otra copia vulnerable: apps\/mobile\/node_modules\/zod/);
  const alias = evaluarSalida('@be/mobile', salidaDeLaApk({ nodos: ['node_modules/zod', 'node_modules/zod3'] }), EXCEPCIONES, HOY, contexto());
  assert.equal(alias.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(alias), /npm encontró otra copia vulnerable: node_modules\/zod3/);
});

test('una copia vulnerable que npm no cuenta (de desarrollo) pero que entra al bundle: bloquea', () => {
  const lock = lockfile({ 'node_modules/chromium-bidi/node_modules/zod': { version: '3.24.1', dev: true } });
  const bundle = { ...BUNDLE, fuentes: [...BUNDLE.fuentes, '/node_modules/chromium-bidi/node_modules/zod/index.cjs'] };
  const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, contexto({ lock, bundle }));
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /el bundle de Android incluye node_modules\/chromium-bidi\/node_modules\/zod \(3\.24\.1\), que el aviso abarca/);
});

test('si cambia la versión de la copia o de un eslabón, la excepción deja de valer hasta repetir la comprobación', () => {
  for (const [ubicacion, version] of [['node_modules/zod', '3.25.77'], ['node_modules/@expo/cli', '57.0.26'], ['node_modules/expo', '57.0.24']]) {
    const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, contexto({ lock: lockfile({ [ubicacion]: { version } }) }));
    assert.equal(r.codigo, CODIGO.VULNERABILIDADES, ubicacion);
    assert.ok(texto(r).includes(`${ubicacion} es la ${version}, no la`), texto(r));
  }
});

test('si la propia APK u otro paquete pide la CLI de Expo, la cadena deja de ser exclusiva: bloquea', () => {
  const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, contexto({ lock: lockfile({ 'apps/mobile': dependenciasDeLaApk({ '@expo/cli': '57.0.25' }) }) }));
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /apps\/mobile \(@be\/mobile\) también usa node_modules\/@expo\/cli en producción/);
  // Y si la APK deja de pedir expo, la cadena declarada no es la que hay.
  const sinExpo = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, contexto({ lock: lockfile({ 'apps/mobile': { dependencies: { '@be/domain': '0.1.0' } } }) }));
  assert.equal(sinExpo.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(sinExpo), /@be\/mobile no pide node_modules\/expo: la cadena no es la declarada/);
});

test('la ruta de desarrollo (Puppeteer) no cuenta, pero si pasa a producción es otra ruta y bloquea', () => {
  const lock = lockfile({
    '': { devDependencies: {}, dependencies: { 'puppeteer-core': '25.12.0' } },
    'node_modules/puppeteer-core': { dev: undefined },
    'node_modules/chromium-bidi': { dev: undefined },
  });
  const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, contexto({ lock }));
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /node_modules\/chromium-bidi \(chromium-bidi 17\.0\.2\) también usa node_modules\/zod en producción/);
});

test('sin la lista de copias de npm, sin lockfile o sin una entrada del lockfile, no se puede comprobar: no aprueba (2)', () => {
  const casos = [
    [salidaDeLaApk({ nodos: null }), contexto(), /npm no dice qué copias encontró vulnerables/],
    [salidaDeLaApk(), contexto({ lock: null }), /no se pudo leer package-lock\.json/],
    [salidaDeLaApk(), null, /no se pudo leer package-lock\.json/],
    [salidaDeLaApk(), contexto({ lock: lockfile({ 'node_modules/zod': null }) }), /node_modules\/zod no está en package-lock\.json/],
    [salidaDeLaApk(), contexto({ lock: lockfile({ 'node_modules/@expo/cli': null }) }), /node_modules\/@expo\/cli no está en package-lock\.json/],
  ];
  // Una excepción con procedencia pero sin cadena no se acepta: no habría a quién exigirle exclusividad.
  const sinCadena = { ...ZOD, procedencia: { ...ZOD.procedencia, cadena: [] } };
  const r = evaluarSalida('@be/mobile', salidaDeLaApk(), [sinCadena], HOY, contexto());
  assert.equal(r.codigo, CODIGO.NO_SE_PUDO_AUDITAR, texto(r));
  assert.match(texto(r), /la excepción no declara la copia, su versión y la cadena que la usa/);
  for (const [s, ctx, motivo] of casos) {
    const r = evaluarSalida('@be/mobile', s, EXCEPCIONES, HOY, ctx);
    assert.equal(r.codigo, CODIGO.NO_SE_PUDO_AUDITAR, texto(r));
    assert.match(texto(r), /no se pudo comprobar la procedencia/);
    assert.match(texto(r), motivo);
    assert.doesNotMatch(texto(r), /✓|exceptuado/);
  }
});

test('si el bundle no se puede construir, no es el de la APK o node_modules no es el del lockfile: no aprueba (2)', () => {
  const casos = [
    [{ bundle: new Error('expo export:embed terminó con error (Unable to resolve module @be/domain)') }, /no se pudo construir el bundle de Android: expo export:embed terminó con error/],
    [{ bundle: { entrada: 'apps/mobile/index.ts', fuentes: [] } }, /el bundle de Android no trae la lista de sus módulos/],
    [{ bundle: { entrada: 'apps/mobile/index.ts', fuentes: ['/packages/domain/dist/index.js'] } }, /el mapa no tiene la entrada de la APK/],
    [{ instaladas: { 'packages/domain/node_modules/zod': '4.6.5' } }, /instalada es la 4\.6\.5 y package-lock\.json dice 4\.6\.6: node_modules no corresponde al lockfile/],
  ];
  for (const [opciones, motivo] of casos) {
    const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, HOY, contexto(opciones));
    assert.equal(r.codigo, CODIGO.NO_SE_PUDO_AUDITAR, texto(r));
    assert.match(texto(r), motivo);
  }
});

test('si el aviso cambia: un rango que abarca la 4.6.6 hace bloquear al zod del dominio en el bundle; un rango de otra forma no se puede comprobar', () => {
  const masAmplio = evaluarSalida('@be/mobile', salidaDeLaApk({ rango: '<4.6.7' }), EXCEPCIONES, HOY, contexto());
  assert.equal(masAmplio.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(masAmplio), /el bundle de Android incluye packages\/domain\/node_modules\/zod \(4\.6\.6\), que el aviso abarca/);
  const otraForma = evaluarSalida('@be/mobile', salidaDeLaApk({ rango: '>=3.0.0 <4.6.6' }), EXCEPCIONES, HOY, contexto());
  assert.equal(otraForma.codigo, CODIGO.NO_SE_PUDO_AUDITAR);
  assert.match(texto(otraForma), /no tiene la forma «<X\.Y\.Z»/);
});

test('vencimiento (renovada el 2026-10-24): el 2026-11-30 todavía vale; desde el 2026-12-01 bloquea aunque la procedencia esté demostrada, y no construye el bundle', () => {
  assert.equal(evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, '2026-11-30', contexto()).codigo, CODIGO.APRUEBA);
  const ctx = contexto();
  const r = evaluarSalida('@be/mobile', salidaDeLaApk(), EXCEPCIONES, '2026-12-01', ctx);
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /excepción vencida el 2026-11-30 · zod · GHSA-mrhx-c7xc-m3w5: revisarla en DL-114/);
  assert.equal(ctx.bundlesPedidos, 0);
});

test('en los otros espacios no vale ni con la procedencia demostrada, y no construye el bundle', () => {
  for (const espacio of ['@be/api', '@be/web', '@be/domain', null]) {
    const ctx = contexto();
    const r = evaluarSalida(espacio, salidaDeLaApk(), EXCEPCIONES, HOY, ctx);
    assert.equal(r.codigo, CODIGO.VULNERABILIDADES, String(espacio));
    assert.match(texto(r), /high · zod · GHSA-mrhx-c7xc-m3w5 · Zod can exhaust memory/);
    assert.equal(ctx.bundlesPedidos, 0, String(espacio));
  }
});

test('las copias del bundle se reconocen por su carpeta, con rutas de Windows o absolutas, sin confundir zod con zod-validation-error', () => {
  const windows = copiasEnElBundle(['C:\\repo\\node_modules\\zod\\index.cjs', 'C:\\Repo\\packages\\domain\\node_modules\\zod\\v4\\core\\versions.cjs'], 'zod', 'C:\\repo');
  assert.deepEqual([...windows], [['node_modules/zod', 1], ['packages/domain/node_modules/zod', 1]]);
  const linux = copiasEnElBundle(['/node_modules/zod-validation-error/index.js', '/node_modules/foo/node_modules/zod/lib/index.js', '/apps/mobile/src/zod/esquema.ts'], 'zod');
  assert.deepEqual([...linux], [['node_modules/foo/node_modules/zod', 1]]);
});

test('las excepciones declaradas exigen procedencia y bundle, y son solo las dos que Dirección renovó el 2026-10-24, hasta el 2026-11-30', () => {
  assert.deepEqual(ZOD.espacios, ['@be/mobile']);
  assert.deepEqual(ZOD.procedencia.copia, { ubicacion: 'node_modules/zod', version: '3.25.76' });
  assert.deepEqual(ZOD.procedencia.cadena, [
    { ubicacion: 'node_modules/@expo/cli', version: '57.0.25' },
    { ubicacion: 'node_modules/expo', version: '57.0.23' },
  ]);
  assert.equal(ZOD.procedencia.tambienPor, undefined, 'la del zod tiene las mismas condiciones que se ratificaron: un solo camino');
  assert.equal(ZOD.procedencia.fueraDelBundle, 'android');
  // braces se retiró (GitHub retiró el aviso el 2026-10-23); ninguna vale más allá del 2026-11-30.
  assert.deepEqual(EXCEPCIONES.map((e) => `${e.aviso} · ${e.paquete} · ${e.vence}`), ['GHSA-86w9-cpqp-85rv · node-forge · 2026-11-30', 'GHSA-mrhx-c7xc-m3w5 · zod · 2026-11-30']);
});

test('con el package-lock.json del repositorio, la procedencia declarada es la que hay', () => {
  const lock = require('../package-lock.json');
  const r = procedenciaEnElLockfile({ paquete: 'zod', rango: '<4.6.6', nodos: ['node_modules/zod'] }, ZOD, '@be/mobile', lock);
  assert.equal(r.estado, 'demostrada', JSON.stringify(r.detalle));
  assert.match(r.detalle[0], /node_modules\/zod 3\.25\.76 ← @expo\/cli 57\.0\.25 ← expo 57\.0\.23 ← @be\/mobile/);
  // En producción, la usa solo la CLI de Expo; el dominio tiene su propio zod corregido.
  assert.deepEqual(usuariosDe(lock.packages, 'node_modules/zod').produccion, ['node_modules/@expo/cli']);
  assert.deepEqual(usuariosDe(lock.packages, 'packages/domain/node_modules/zod').produccion, ['packages/domain']);
  assert.equal(lock.packages['packages/domain/node_modules/zod'].version, '4.6.6');
});

// ─── node-forge: renovada el 2026-10-24 hasta el 2026-11-30, solo en la cadena de construcción de la APK ──────────

const FORGE = EXCEPCIONES.find((e) => e.paquete === 'node-forge');
const AVISO_FORGE = {
  source: 1,
  name: 'node-forge',
  dependency: 'node-forge',
  title: 'node-forge RSA PKCS#1 v1.5 signature verification accepts extra nested DigestAlgorithm elements',
  url: 'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
  severity: 'high',
  range: '<=1.4.0',
};

/** La salida de npm para la APK con la forma real del 2026-10-24: node-forge de la raíz, sin versión corregida. */
function salidaConForge({ nodos = ['node_modules/node-forge'], rango = '<=1.4.0' } = {}) {
  const vulnerabilities = {
    'node-forge': { name: 'node-forge', severity: 'high', isDirect: false, via: [{ ...AVISO_FORGE, range: rango }], effects: ['@expo/cli', '@expo/code-signing-certificates'], range: rango, nodes: nodos, fixAvailable: false },
    '@expo/code-signing-certificates': { name: '@expo/code-signing-certificates', severity: 'high', isDirect: false, via: ['node-forge'], effects: ['@expo/cli'], range: '*', nodes: ['node_modules/@expo/code-signing-certificates'], fixAvailable: false },
    '@expo/cli': { name: '@expo/cli', severity: 'high', isDirect: false, via: ['@expo/code-signing-certificates', 'node-forge'], effects: ['expo'], range: '*', nodes: ['node_modules/@expo/cli'], fixAvailable: false },
    expo: { name: 'expo', severity: 'high', isDirect: true, via: ['@expo/cli'], effects: [], range: '*', nodes: ['node_modules/expo'], fixAvailable: false },
  };
  return JSON.stringify({ auditReportVersion: 2, vulnerabilities, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 4, critical: 0, total: 4 }, dependencies: { prod: 100, total: 100 } } });
}

test('node-forge con la procedencia demostrada: se exceptúa en la APK, por sus dos caminos dentro de la CLI, y el bundle no lo tiene', () => {
  const ctx = contexto();
  const r = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, ctx);
  assert.equal(r.codigo, CODIGO.APRUEBA, texto(r));
  assert.match(texto(r), /exceptuado hasta el 2026-11-30 · node-forge · GHSA-86w9-cpqp-85rv \(DL-114\)/);
  assert.match(texto(r), /procedencia comprobada en package-lock\.json: node_modules\/node-forge 1\.4\.0 ← @expo\/cli 57\.0\.25 ← expo 57\.0\.23 ← @be\/mobile; también node_modules\/node-forge ← @expo\/code-signing-certificates 0\.0\.6 ← @expo\/cli/);
  assert.match(texto(r), /ninguno de node_modules\/node-forge; node-forge en el bundle: ninguna/);
  assert.equal(ctx.bundlesPedidos, 1);
});

test('node-forge en la API o el website bloquea aunque la procedencia esté demostrada, y no construye el bundle', () => {
  for (const espacio of ['@be/api', '@be/web', null]) {
    const ctx = contexto();
    const r = evaluarSalida(espacio, salidaConForge(), EXCEPCIONES, HOY, ctx);
    assert.equal(r.codigo, CODIGO.VULNERABILIDADES, String(espacio));
    assert.match(texto(r), /high · node-forge · GHSA-86w9-cpqp-85rv/);
    assert.equal(ctx.bundlesPedidos, 0, String(espacio));
  }
});

test('una dependencia de la APK que trae node-forge para ejecutarse no queda exceptuada por ser del mismo espacio: bloquea', () => {
  const lock = lockfile({
    'apps/mobile': dependenciasDeLaApk({ 'firmas-en-el-telefono': '1.0.0' }),
    'node_modules/firmas-en-el-telefono': { version: '1.0.0', dependencies: { 'node-forge': '^1.3.0' } },
  });
  const ctx = contexto({ lock });
  const r = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, ctx);
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /la excepción no cubre esta ruta: node_modules\/firmas-en-el-telefono \(firmas-en-el-telefono 1\.0\.0\) también usa node_modules\/node-forge en producción/);
  assert.equal(ctx.bundlesPedidos, 0);
  // La propia APK que lo declara, igual.
  const directa = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, contexto({ lock: lockfile({ 'apps/mobile': dependenciasDeLaApk({ 'node-forge': '1.4.0' }) }) }));
  assert.equal(directa.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(directa), /apps\/mobile \(@be\/mobile\) también usa node_modules\/node-forge en producción/);
});

test('si otro paquete usa el de firma de Expo (por ejemplo expo-updates en la APK), es otro camino y bloquea', () => {
  const lock = lockfile({
    'apps/mobile': dependenciasDeLaApk({ 'expo-updates': '57.0.4' }),
    'node_modules/expo-updates': { version: '57.0.4', dependencies: { '@expo/code-signing-certificates': '0.0.6' } },
  });
  const r = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, contexto({ lock }));
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /node_modules\/expo-updates \(expo-updates 57\.0\.4\) también usa node_modules\/@expo\/code-signing-certificates en producción/);
});

test('si un camino declarado ya no existe, la declaración quedó vieja: no vale hasta revisarla', () => {
  const sinForge = lockfile({ 'node_modules/@expo/code-signing-certificates': { dependencies: {} } });
  const r1 = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, contexto({ lock: sinForge }));
  assert.equal(r1.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r1), /node_modules\/@expo\/code-signing-certificates ya no usa node_modules\/node-forge/);
  const cli = lockfile().packages['node_modules/@expo/cli'];
  const sinFirma = lockfile({ 'node_modules/@expo/cli': { dependencies: { zod: cli.dependencies.zod, 'node-forge': cli.dependencies['node-forge'] } } });
  const r2 = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, contexto({ lock: sinFirma }));
  assert.equal(r2.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r2), /node_modules\/@expo\/cli ya no usa node_modules\/@expo\/code-signing-certificates/);
});

test('si cambia la versión de node-forge, del paquete de firma o de la CLI, deja de valer hasta repetir la comprobación', () => {
  for (const [ubicacion, version] of [['node_modules/node-forge', '1.3.3'], ['node_modules/@expo/code-signing-certificates', '0.0.7'], ['node_modules/@expo/cli', '57.0.26']]) {
    const r = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, contexto({ lock: lockfile({ [ubicacion]: { version } }) }));
    assert.equal(r.codigo, CODIGO.VULNERABILIDADES, ubicacion);
    assert.ok(texto(r).includes(`${ubicacion} es la ${version}, no la`), texto(r));
  }
});

test('node-forge en el bundle de Android: la copia declarada u otra que el aviso abarque (<=1.4.0) bloquean; una fuera del rango, no', () => {
  const conLaDeclarada = { ...BUNDLE, fuentes: [...BUNDLE.fuentes, '/node_modules/node-forge/lib/forge.js'] };
  const r1 = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, contexto({ bundle: conLaDeclarada }));
  assert.equal(r1.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r1), /el bundle de Android incluye 1 módulos de node_modules\/node-forge \(1\.4\.0\): la APK la usaría al ejecutarse/);
  const otra = { ...BUNDLE, fuentes: [...BUNDLE.fuentes, '/node_modules/firmas/node_modules/node-forge/lib/rsa.js'] };
  for (const [version, codigo] of [['1.4.0', CODIGO.VULNERABILIDADES], ['1.3.1', CODIGO.VULNERABILIDADES], ['1.4.0-rc.1', CODIGO.VULNERABILIDADES], ['1.4.1', CODIGO.APRUEBA]]) {
    const lock = lockfile({ 'node_modules/firmas/node_modules/node-forge': { version, dev: true } });
    const r = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, contexto({ lock, bundle: otra }));
    assert.equal(r.codigo, codigo, `${version}: ${texto(r)}`);
    if (codigo === CODIGO.VULNERABILIDADES) assert.match(texto(r), /node_modules\/firmas\/node_modules\/node-forge .*que el aviso abarca/);
    else assert.match(texto(r), /node-forge en el bundle: node_modules\/firmas\/node_modules\/node-forge 1\.4\.1 \(1 módulos\)/);
  }
});

test('sin el paquete de firma en el lockfile, o con un camino declarado sin versión, no se puede comprobar: no aprueba (2)', () => {
  const r = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, HOY, contexto({ lock: lockfile({ 'node_modules/@expo/code-signing-certificates': null }) }));
  assert.equal(r.codigo, CODIGO.NO_SE_PUDO_AUDITAR, texto(r));
  assert.match(texto(r), /node_modules\/@expo\/code-signing-certificates no está en package-lock\.json/);
  const sinVersion = { ...FORGE, procedencia: { ...FORGE.procedencia, tambienPor: [{ ubicacion: 'node_modules/@expo/code-signing-certificates' }] } };
  const r2 = evaluarSalida('@be/mobile', salidaConForge(), [sinVersion], HOY, contexto());
  assert.equal(r2.codigo, CODIGO.NO_SE_PUDO_AUDITAR, texto(r2));
  assert.match(texto(r2), /la excepción declara otros caminos sin su ubicación y su versión/);
});

test('vencimiento de node-forge: el 2026-11-30 vale; desde el 2026-12-01 bloquea, y no se renueva sola', () => {
  assert.equal(evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, '2026-11-30', contexto()).codigo, CODIGO.APRUEBA);
  const r = evaluarSalida('@be/mobile', salidaConForge(), EXCEPCIONES, '2026-12-01', contexto());
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /excepción vencida el 2026-11-30 · node-forge · GHSA-86w9-cpqp-85rv: revisarla en DL-114/);
});

test('braces ya no está exceptuado: si GitHub volviera a publicar el aviso, bloquea como cualquier otro', () => {
  const r = evaluarSalida('@be/mobile', salida(aviso('braces', 'GHSA-vfj7-8cjw-p6xm', 'high')), EXCEPCIONES, HOY, contexto());
  assert.equal(r.codigo, CODIGO.VULNERABILIDADES);
  assert.match(texto(r), /✗ @be\/mobile: high · braces · GHSA-vfj7-8cjw-p6xm/);
});

test('con el package-lock.json del repositorio, la procedencia declarada de node-forge es la que hay', () => {
  const lock = require('../package-lock.json');
  const r = procedenciaEnElLockfile({ paquete: 'node-forge', rango: '<=1.4.0', nodos: ['node_modules/node-forge'] }, FORGE, '@be/mobile', lock);
  assert.equal(r.estado, 'demostrada', JSON.stringify(r.detalle));
  assert.match(r.detalle[0], /node_modules\/node-forge 1\.4\.0 ← @expo\/cli 57\.0\.25 ← expo 57\.0\.23 ← @be\/mobile; también node_modules\/node-forge ← @expo\/code-signing-certificates 0\.0\.6 ← @expo\/cli/);
  assert.deepEqual(usuariosDe(lock.packages, 'node_modules/node-forge').produccion.sort(), ['node_modules/@expo/cli', 'node_modules/@expo/code-signing-certificates']);
  assert.deepEqual(usuariosDe(lock.packages, 'node_modules/@expo/code-signing-certificates').produccion, ['node_modules/@expo/cli']);
});
