/**
 * DL-114 · la excepción de zod frente a npm de verdad. En una carpeta temporal con copias de los package.json, el `.npmrc`
 * y el package-lock.json (sin node_modules), mete una ruta vulnerable, regenera el lockfile con npm, corre `npm audit`
 * como la CI y comprueba que la excepción no la tapa. No toca el repositorio. Necesita red (el registro de npm y su
 * servicio de avisos) y tarda unos minutos, así que no es parte de `npm test`.
 *
 * Uso, desde la raíz: node scripts/auditoria-de-dependencias.escenarios.cjs
 *
 * Escenarios, con lo esperado:
 *   1. la APK declara zod 3.25.76 → bloquea (1): otra ruta;
 *   2. la APK usa una biblioteca (sintética, local) que pide zod ^3.25.0 → bloquea (1): otra ruta;
 *   3. la API declara zod 3.25.76 → bloquea (1): la excepción es solo de la APK;
 *   4. sin cambios, el día siguiente al vencimiento → bloquea (1);
 *   5. sin cambios y sin poder construir el bundle → no aprueba (2): sin esa prueba, la excepción no se aplica.
 * Y los de node-forge, renovada el 2026-10-24 solo para la cadena de construcción de la APK:
 *   6. la APK declara node-forge 1.4.0 → bloquea (1): otra ruta, aunque sea del mismo espacio;
 *   7. la APK usa una biblioteca (sintética, local) que pide node-forge ^1.3.0 → bloquea (1): otra ruta;
 *   8. la API declara node-forge 1.4.0 → bloquea (1): la excepción es solo de la APK.
 * El escenario 5 también muestra que, sin cambios, la procedencia del lockfile real se demuestra: si no, daría 1.
 *
 * El bundle de Android no se construye: en la carpeta no hay node_modules. Cada escenario cambia una sola ruta, y la otra
 * excepción, que sigue en su camino declarado, también pide el bundle (desde el 2026-10-24, las dos lo exigen). Para ella
 * se usa un bundle mínimo sintético: solo la entrada de la APK, sin zod ni node-forge. El bundle real lo prueban
 * `auditoria-de-dependencias.test.cjs` y la CI. El escenario 5 no tiene ni ese, y ninguna excepción se aplica.
 * Sale con 0 si cada escenario dio lo esperado.
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { evaluarSalida, CODIGO, EXCEPCIONES } = require('./auditoria-de-dependencias.cjs');

const RAIZ = path.resolve(__dirname, '..');
const ZOD = EXCEPCIONES.find((e) => e.paquete === 'zod');

function diaSiguiente(fecha) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Una carpeta temporal con los manifiestos y el lockfile del repositorio, y nada más. */
function copiaAislada() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'be-escenario-'));
  for (const archivo of ['package.json', 'package-lock.json', '.npmrc']) {
    if (fs.existsSync(path.join(RAIZ, archivo))) fs.copyFileSync(path.join(RAIZ, archivo), path.join(dir, archivo));
  }
  const { workspaces } = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
  for (const espacio of workspaces) {
    fs.mkdirSync(path.join(dir, espacio), { recursive: true });
    fs.copyFileSync(path.join(RAIZ, espacio, 'package.json'), path.join(dir, espacio, 'package.json'));
  }
  return dir;
}

function editarJson(archivo, cambiar) {
  const json = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  cambiar(json);
  fs.writeFileSync(archivo, `${JSON.stringify(json, null, 2)}\n`);
}

/** El bundle mínimo sintético: solo la entrada de la APK, sin ningún módulo de zod ni de node-forge. */
const BUNDLE_SINTETICO = { entrada: 'apps/mobile/index.ts', fuentes: ['__prelude__', '/apps/mobile/index.ts', '/apps/mobile/App.tsx'] };

const npm = (dir, argumentos) => execSync(`npm ${argumentos}`, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });

function auditar(dir, espacio) {
  try {
    return npm(dir, `audit --omit=dev --json -w ${espacio}`);
  } catch (error) {
    return typeof error.stdout === 'string' ? error.stdout : '';
  }
}

const ESCENARIOS = [
  {
    nombre: 'la APK declara zod 3.25.76',
    espacio: '@be/mobile',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /apps\/mobile \(@be\/mobile\) también usa node_modules\/zod en producción/,
    preparar: (dir) => editarJson(path.join(dir, 'apps/mobile/package.json'), (p) => {
      p.dependencies.zod = '3.25.76';
    }),
  },
  {
    nombre: 'la APK usa una biblioteca que pide zod ^3.25.0',
    espacio: '@be/mobile',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /biblioteca-sintetica/,
    preparar: (dir) => {
      const biblioteca = path.join(dir, 'sintetica', 'biblioteca-sintetica');
      fs.mkdirSync(biblioteca, { recursive: true });
      fs.writeFileSync(path.join(biblioteca, 'package.json'), `${JSON.stringify({ name: 'biblioteca-sintetica', version: '1.0.0', main: 'index.js', dependencies: { zod: '^3.25.0' } }, null, 2)}\n`);
      fs.writeFileSync(path.join(biblioteca, 'index.js'), "module.exports = require('zod');\n");
      editarJson(path.join(dir, 'apps/mobile/package.json'), (p) => {
        p.dependencies['biblioteca-sintetica'] = 'file:../../sintetica/biblioteca-sintetica';
      });
    },
  },
  {
    nombre: 'la API declara zod 3.25.76',
    espacio: '@be/api',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /✗ @be\/api: high · zod · GHSA-mrhx-c7xc-m3w5/,
    preparar: (dir) => editarJson(path.join(dir, 'apps/api/package.json'), (p) => {
      p.dependencies.zod = '3.25.76';
    }),
  },
  {
    nombre: 'sin cambios, el día siguiente al vencimiento',
    espacio: '@be/mobile',
    esperado: CODIGO.VULNERABILIDADES,
    hoy: diaSiguiente(ZOD.vence),
    senal: new RegExp(`excepción vencida el ${ZOD.vence} · zod · GHSA-mrhx-c7xc-m3w5`),
  },
  {
    nombre: 'sin cambios y sin poder construir el bundle',
    espacio: '@be/mobile',
    esperado: CODIGO.NO_SE_PUDO_AUDITAR,
    sinBundle: true,
    senal: /no se pudo construir el bundle de Android: el escenario no construye el bundle/,
  },
  {
    nombre: 'la APK declara node-forge 1.4.0',
    espacio: '@be/mobile',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /apps\/mobile \(@be\/mobile\) también usa node_modules\/node-forge en producción/,
    preparar: (dir) => editarJson(path.join(dir, 'apps/mobile/package.json'), (p) => {
      p.dependencies['node-forge'] = '1.4.0';
    }),
  },
  {
    nombre: 'la APK usa una biblioteca que pide node-forge ^1.3.0',
    espacio: '@be/mobile',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /firmas-sinteticas .*también usa node_modules\/node-forge en producción/,
    preparar: (dir) => {
      const biblioteca = path.join(dir, 'sintetica', 'firmas-sinteticas');
      fs.mkdirSync(biblioteca, { recursive: true });
      fs.writeFileSync(path.join(biblioteca, 'package.json'), `${JSON.stringify({ name: 'firmas-sinteticas', version: '1.0.0', main: 'index.js', dependencies: { 'node-forge': '^1.3.0' } }, null, 2)}\n`);
      fs.writeFileSync(path.join(biblioteca, 'index.js'), "module.exports = require('node-forge');\n");
      editarJson(path.join(dir, 'apps/mobile/package.json'), (p) => {
        p.dependencies['firmas-sinteticas'] = 'file:../../sintetica/firmas-sinteticas';
      });
    },
  },
  {
    nombre: 'la API declara node-forge 1.4.0',
    espacio: '@be/api',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /✗ @be\/api: high · node-forge · GHSA-86w9-cpqp-85rv/,
    preparar: (dir) => editarJson(path.join(dir, 'apps/api/package.json'), (p) => {
      p.dependencies['node-forge'] = '1.4.0';
    }),
  },
];

/** Corre un escenario en su carpeta aislada. Devuelve la salida de npm, el lockfile y el resultado de la auditoría. */
function correrEscenario(escenario, hoy = new Date().toISOString().slice(0, 10)) {
  const dir = copiaAislada();
  try {
    if (escenario.preparar) {
      escenario.preparar(dir);
      npm(dir, 'install --package-lock-only --ignore-scripts --no-audit --no-fund');
    }
    const salida = auditar(dir, escenario.espacio);
    const lockfile = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8'));
    // En la carpeta no hay node_modules: el bundle no se construye. Ver el encabezado: el sintético es para la excepción
    // que el escenario no toca; el escenario 5 no tiene bundle.
    const contexto = {
      raiz: dir,
      lockfile,
      modulosDelBundle: () => {
        if (escenario.sinBundle) throw new Error('el escenario no construye el bundle');
        return BUNDLE_SINTETICO;
      },
      versionInstalada: () => null,
    };
    const resultado = evaluarSalida(escenario.espacio, salida, EXCEPCIONES, escenario.hoy ?? hoy, contexto);
    return { salida, lockfile, resultado };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function principal() {
  const hoy = new Date().toISOString().slice(0, 10);
  if (hoy > ZOD.vence) console.log(`Aviso: la excepción de zod venció el ${ZOD.vence}; los escenarios 1, 2 y 5 van a dar «vencida».`);
  let fallidos = 0;
  ESCENARIOS.forEach((escenario, i) => {
    const { resultado } = correrEscenario(escenario, hoy);
    const texto = resultado.lineas.join('\n');
    const bien = resultado.codigo === escenario.esperado && escenario.senal.test(texto);
    if (!bien) fallidos += 1;
    console.log(`${bien ? '✓' : '✗'} ${i + 1}. ${escenario.nombre} (${escenario.espacio}): código ${resultado.codigo}, se esperaba ${escenario.esperado}`);
    for (const l of resultado.lineas.filter((l) => l.includes('zod') || l.includes('node-forge'))) console.log(`     ${l}`);
  });
  console.log(fallidos === 0 ? '\nCada escenario dio lo esperado: la excepción no tapa ninguna de estas rutas.' : `\n${fallidos} escenario(s) no dieron lo esperado.`);
  process.exit(fallidos === 0 ? 0 : 1);
}

module.exports = { ESCENARIOS, correrEscenario };
if (require.main === module) principal();
