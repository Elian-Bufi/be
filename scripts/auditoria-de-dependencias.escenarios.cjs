/**
 * DL-114 · la auditoría de dependencias frente a npm de verdad. En una carpeta temporal con copias de los package.json, el
 * `.npmrc` y el package-lock.json (sin node_modules), mete una ruta vulnerable, regenera el lockfile con npm, corre
 * `npm audit` como la CI y comprueba el resultado. No toca el repositorio. Necesita red (el registro de npm y su servicio
 * de avisos) y tarda unos minutos, así que no es parte de `npm test`.
 *
 * Uso, desde la raíz: node scripts/auditoria-de-dependencias.escenarios.cjs
 *
 * Desde el 2026-11-11 (UF-12 de WP-USO-FINAL) no hay excepciones: node-forge está fuera del aviso y la CLI de Expo
 * 57.0.33 ya no pide zod. Escenarios, con lo esperado:
 *   1 a 3. sin cambios, el 2026-12-01, en la APK, la API y el website → aprueba (0): no depende de una prórroga;
 *   4. la CLI de Expo vuelve a la 57.0.25, que pide zod 3 → bloquea (1);
 *   5. la APK declara zod 3.25.76 → bloquea (1);
 *   6. la APK usa una biblioteca (sintética, local) que pide zod ^3.25.0 → bloquea (1);
 *   7. la API declara zod 3.25.76 → bloquea (1);
 *   8. la APK declara node-forge 1.4.0 → bloquea (1);
 *   9. la API declara node-forge 1.4.0 → bloquea (1).
 * Si el servicio de avisos publica algo nuevo, los escenarios 1 a 3 lo muestran: eso es lo que tienen que hacer.
 * Sale con 0 si cada escenario dio lo esperado.
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { evaluarSalida, CODIGO, EXCEPCIONES } = require('./auditoria-de-dependencias.cjs');

const RAIZ = path.resolve(__dirname, '..');

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

const npm = (dir, argumentos) => execSync(`npm ${argumentos}`, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });

function auditar(dir, espacio) {
  try {
    return npm(dir, `audit --omit=dev --json -w ${espacio}`);
  } catch (error) {
    return typeof error.stdout === 'string' ? error.stdout : '';
  }
}

/** Sin cambios, el día en que vencían las excepciones retiradas: aprueba sin ninguna (UF-12). */
const sinCambios = (espacio) => ({
  nombre: `sin cambios, el 2026-12-01 (${espacio})`,
  espacio,
  esperado: CODIGO.APRUEBA,
  hoy: '2026-12-01',
  senal: new RegExp(`✓ ${espacio.replace('/', '\\/')}: sin avisos altos ni críticos`),
});

const ESCENARIOS = [
  sinCambios('@be/mobile'),
  sinCambios('@be/api'),
  sinCambios('@be/web'),
  {
    // Con `overrides` en la raíz, `npm install --package-lock-only` no vuelve a resolver la CLI ya fijada en el lockfile:
    // la APK la fija directamente, que es la misma ruta (la CLI 57.0.25 pide zod ^3.25.76).
    nombre: 'la CLI de Expo vuelve a la 57.0.25, que pide zod 3',
    espacio: '@be/mobile',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /✗ @be\/mobile: high · zod · GHSA-mrhx-c7xc-m3w5/,
    preparar: (dir) => editarJson(path.join(dir, 'apps/mobile/package.json'), (p) => {
      p.dependencies['@expo/cli'] = '57.0.25';
    }),
  },
  {
    nombre: 'la APK declara zod 3.25.76',
    espacio: '@be/mobile',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /✗ @be\/mobile: high · zod · GHSA-mrhx-c7xc-m3w5/,
    preparar: (dir) => editarJson(path.join(dir, 'apps/mobile/package.json'), (p) => {
      p.dependencies.zod = '3.25.76';
    }),
  },
  {
    nombre: 'la APK usa una biblioteca que pide zod ^3.25.0',
    espacio: '@be/mobile',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /✗ @be\/mobile: high · zod · GHSA-mrhx-c7xc-m3w5/,
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
    nombre: 'la APK declara node-forge 1.4.0',
    espacio: '@be/mobile',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /✗ @be\/mobile: high · node-forge · GHSA-/,
    preparar: (dir) => editarJson(path.join(dir, 'apps/mobile/package.json'), (p) => {
      p.dependencies['node-forge'] = '1.4.0';
    }),
  },
  {
    nombre: 'la API declara node-forge 1.4.0',
    espacio: '@be/api',
    esperado: CODIGO.VULNERABILIDADES,
    senal: /✗ @be\/api: high · node-forge · GHSA-/,
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
    // En la carpeta no hay node_modules: el bundle no se construye. Sin excepciones, la auditoría no lo pide; si alguna
    // vez se declara una con procedencia, este escenario no la da por comprobada (2).
    const contexto = {
      raiz: dir,
      lockfile,
      modulosDelBundle: () => {
        throw new Error('el escenario no construye el bundle');
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
  let fallidos = 0;
  ESCENARIOS.forEach((escenario, i) => {
    const { resultado } = correrEscenario(escenario, hoy);
    const texto = resultado.lineas.join('\n');
    const bien = resultado.codigo === escenario.esperado && escenario.senal.test(texto);
    if (!bien) fallidos += 1;
    console.log(`${bien ? '✓' : '✗'} ${i + 1}. ${escenario.nombre} (${escenario.espacio}): código ${resultado.codigo}, se esperaba ${escenario.esperado}`);
    for (const l of resultado.lineas.filter((l) => !bien || l.includes('zod') || l.includes('node-forge'))) console.log(`     ${l}`);
  });
  console.log(fallidos === 0 ? '\nCada escenario dio lo esperado: sin excepciones, la auditoría aprueba lo de hoy y bloquea cada una de estas rutas.' : `\n${fallidos} escenario(s) no dieron lo esperado.`);
  process.exit(fallidos === 0 ? 0 : 1);
}

module.exports = { ESCENARIOS, correrEscenario };
if (require.main === module) principal();
