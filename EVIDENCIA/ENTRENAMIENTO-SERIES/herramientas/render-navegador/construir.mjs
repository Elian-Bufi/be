// Arma el render de componentes de Entrenamiento en el navegador con esbuild (WP-ENTRENAMIENTO-SERIES §11, V01): los
// archivos REALES de apps/mobile/src, react-native-web en lugar de react-native, y reemplazos para lo nativo (shims/).
// Es el arnés de EVIDENCIA/NUTRICION-RECETAS adaptado. Uso: node construir.mjs
// - BE_REPO: la raíz del repo que se compila; por omisión, cuatro carpetas arriba (esta carpeta vive en
//   EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/render-navegador).
// - SALIDA: el archivo que se escribe en salida/; por omisión, maqueta.js (lo cargan evidencia.html y telefono.html), o
//   maqueta-real.js con API_REAL.
// - API_REAL=1: las pantallas hablan con la API local real (shims/api-real.ts), y el reloj de la sesión es el inyectable
//   (shims/reloj-controlado.ts), que el recorrido adelanta; la composición es maqueta-real.tsx (navegación real) y la
//   página, salida/evidencia-real.html, servida por servir-arnes.mjs con /api/* reenviado a la API.
// Los datos del paquete de Dirección (`sesion_demo.json` y `CATALOGO.json`) se leen del repo con el alias
// «@paquete-entrenamiento/...», y sus tres imágenes se copian a salida/fotos: las dibujan la sesión, el plan y la técnica.
// El reloj de la sesión queda detenido en un instante fijo (shims/reloj-de-sesion.ts), para que las capturas no cambien.
import { build } from 'esbuild';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.BE_REPO ?? resolve(AQUI, '../../../..');
const API_REAL = process.env.API_REAL === '1';
const SALIDA = process.env.SALIDA ?? (API_REAL ? 'maqueta-real.js' : 'maqueta.js');
const MOVIL = join(REPO, 'apps/mobile/src');
const PAQUETE = join(REPO, 'docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06');
const modulo = (nombre) => join(AQUI, 'node_modules', nombre);
mkdirSync(join(AQUI, 'salida/fotos'), { recursive: true });
for (const imagen of ['sentadilla_goblet.png', 'peso_muerto_rumano_mancuernas.png', 'zancada_estatica.png']) cpSync(join(PAQUETE, 'ejercicios', imagen), join(AQUI, 'salida/fotos', imagen));
const svg = [join(REPO, 'apps/mobile/node_modules/react-native-svg'), join(REPO, 'node_modules/react-native-svg')].find((r) => existsSync(r));
const normal = (ruta) => ruta.split('\\').join('/').toLowerCase();

/**
 * `@movil/...` apunta a apps/mobile/src; `../api` de la app, al cliente sintético; `./reloj-de-sesion` de la app, al reloj
 * detenido (que importa el real como `@movil-real/...`); `@paquete-entrenamiento/...`, a los datos del paquete.
 */
const reemplazos = {
  name: 'reemplazos',
  setup(b) {
    const enMovil = (base) => {
      for (const ext of ['.tsx', '.ts']) if (existsSync(base + ext)) return { path: base + ext };
      return { path: base };
    };
    b.onResolve({ filter: /^@movil\// }, (args) => enMovil(join(MOVIL, args.path.slice('@movil/'.length))));
    b.onResolve({ filter: /^@movil-real\// }, (args) => enMovil(join(MOVIL, args.path.slice('@movil-real/'.length))));
    b.onResolve({ filter: /^@paquete-entrenamiento\// }, (args) => ({ path: join(PAQUETE, args.path.slice('@paquete-entrenamiento/'.length)) }));
    b.onResolve({ filter: /^(\.\.?\/)+api$/ }, (args) => {
      if (normal(resolve(args.resolveDir, args.path)) === normal(join(MOVIL, 'api'))) return { path: join(AQUI, API_REAL ? 'shims/api-real.ts' : 'shims/api.ts') };
      return undefined;
    });
    b.onResolve({ filter: /^(\.\.?\/)+reloj-de-sesion$/ }, (args) => {
      // Con la API real, el reloj de la sesión es el inyectable: avanza cuando el recorrido lo adelanta.
      if (normal(resolve(args.resolveDir, args.path)) === normal(join(MOVIL, 'reloj-de-sesion'))) return { path: join(AQUI, API_REAL ? 'shims/reloj-controlado.ts' : 'shims/reloj-de-sesion.ts') };
      return undefined;
    });
    // El reloj del teléfono (precierre del 2026-10-06, §3): sin módulo nativo en el navegador, el del recorrido (del
    // proceso, o del arranque simulado con `?reloj=arranque`) o el detenido de las capturas.
    b.onResolve({ filter: /^(\.\.?\/)+reloj-del-telefono$/ }, (args) => {
      if (normal(resolve(args.resolveDir, args.path)) === normal(join(MOVIL, 'reloj-del-telefono'))) return { path: join(AQUI, API_REAL ? 'shims/reloj-del-telefono-real.ts' : 'shims/reloj-del-telefono-detenido.ts') };
      return undefined;
    });
  },
};

await build({
  entryPoints: [join(AQUI, API_REAL ? 'maqueta-real.tsx' : 'maqueta.tsx')],
  bundle: true,
  outfile: join(AQUI, 'salida', SALIDA),
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  minify: false,
  sourcemap: false,
  logLevel: 'warning',
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
  mainFields: ['browser', 'module', 'main'],
  nodePaths: [join(REPO, 'node_modules'), join(REPO, 'apps/mobile/node_modules')],
  loader: { '.png': 'dataurl', '.jpg': 'dataurl', '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false', global: 'window' },
  alias: {
    react: modulo('react'),
    'react-dom': modulo('react-dom'),
    'react-native': join(AQUI, 'shims/react-native.js'),
    'react-native-web': modulo('react-native-web'),
    'expo-constants': join(AQUI, 'shims/expo-constants.js'),
    'expo-status-bar': join(AQUI, 'shims/vacio.js'),
    'expo-secure-store': join(AQUI, 'shims/expo-secure-store.js'),
    'expo-crypto': join(AQUI, 'shims/expo-crypto.js'),
    'react-native-safe-area-context': join(AQUI, 'shims/safe-area.js'),
    '@react-native-async-storage/async-storage': join(AQUI, API_REAL ? 'shims/async-storage-local.js' : 'shims/async-storage.js'),
    ...(svg ? { 'react-native-svg': svg } : {}),
  },
  plugins: [reemplazos],
});
console.log(`listo: salida/${SALIDA}`);
