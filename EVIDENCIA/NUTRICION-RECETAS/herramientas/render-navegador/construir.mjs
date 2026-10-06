// Arma el render de componentes de Nutrición en el navegador con esbuild (WP-NUTRICION-RECETAS): los archivos REALES de
// apps/mobile/src, react-native-web en lugar de react-native, y reemplazos para lo nativo (shims/). Uso: node construir.mjs
// - BE_REPO: la raíz del repo que se compila; por omisión, cuatro carpetas arriba (esta carpeta vive en
//   EVIDENCIA/NUTRICION-RECETAS/herramientas/render-navegador).
// - SALIDA: el archivo que se escribe en salida/; por omisión, maqueta.js (telefono.html).
// Los datos del paquete de Dirección (las tres recetas y los ocho alimentos) se leen del repo con el alias
// «@paquete-nutricion/...»: el cálculo de sus macros lo hace el dominio, en shims/api.ts. Sus tres fotos se copian a
// salida/fotos antes de armar: las dibujan las tarjetas y la galería sintética.
import { build } from 'esbuild';
import { cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.BE_REPO ?? resolve(AQUI, '../../../..');
const SALIDA = process.env.SALIDA ?? 'maqueta.js';
const MOVIL = join(REPO, 'apps/mobile/src');
const PAQUETE = join(REPO, 'docs/fuente_nutricion/BE_Nutricion_Demo_2026-10-05/datos');
const modulo = (nombre) => join(AQUI, 'node_modules', nombre);
cpSync(join(REPO, 'docs/fuente_nutricion/BE_Nutricion_Demo_2026-10-05/fotos'), join(AQUI, 'salida/fotos'), { recursive: true });
const svg = [join(REPO, 'apps/mobile/node_modules/react-native-svg'), join(REPO, 'node_modules/react-native-svg')].find((r) => existsSync(r));

/** `@movil/...` apunta a apps/mobile/src; `../api` de la app, al cliente sintético; `@paquete-nutricion/...`, a los datos. */
const reemplazos = {
  name: 'reemplazos',
  setup(b) {
    b.onResolve({ filter: /^@movil\// }, (args) => {
      const base = join(MOVIL, args.path.slice('@movil/'.length));
      for (const ext of ['.tsx', '.ts']) if (existsSync(base + ext)) return { path: base + ext };
      return { path: base };
    });
    b.onResolve({ filter: /^@paquete-nutricion\// }, (args) => ({ path: join(PAQUETE, args.path.slice('@paquete-nutricion/'.length)) }));
    b.onResolve({ filter: /^(\.\.?\/)+api$/ }, (args) => {
      const normal = (ruta) => ruta.split('\\').join('/').toLowerCase();
      if (normal(resolve(args.resolveDir, args.path)) === normal(join(MOVIL, 'api'))) return { path: join(AQUI, 'shims/api.ts') };
      return undefined;
    });
  },
};

await build({
  entryPoints: [join(AQUI, 'maqueta.tsx')],
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
    'expo-secure-store': join(AQUI, 'shims/vacio.js'),
    'expo-image-picker': join(AQUI, 'shims/expo-image-picker.js'),
    'react-native-safe-area-context': join(AQUI, 'shims/safe-area.js'),
    '@react-native-async-storage/async-storage': join(AQUI, 'shims/async-storage.js'),
    ...(svg ? { 'react-native-svg': svg } : {}),
  },
  plugins: [reemplazos],
});
console.log(`listo: salida/${SALIDA}`);
