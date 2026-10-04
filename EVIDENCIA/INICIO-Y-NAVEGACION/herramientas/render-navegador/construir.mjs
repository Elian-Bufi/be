// Arma el render de componentes en el navegador con esbuild: los archivos REALES de apps/mobile/src, react-native-web en
// lugar de react-native, y reemplazos para lo nativo (shims/). Uso: node construir.mjs
import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.BE_REPO ?? resolve(AQUI, '../../../..');
const MOVIL = join(REPO, 'apps/mobile/src');
const modulo = (nombre) => join(AQUI, 'node_modules', nombre);

/** `@movil/...` apunta a apps/mobile/src; `../api` de la app, al cliente sintético. */
const reemplazos = {
  name: 'reemplazos',
  setup(b) {
    b.onResolve({ filter: /^@movil\// }, (args) => {
      const base = join(MOVIL, args.path.slice('@movil/'.length));
      for (const ext of ['.tsx', '.ts']) if (existsSync(base + ext)) return { path: base + ext };
      return { path: base };
    });
    b.onResolve({ filter: /^(\.\.?\/)+api$/ }, (args) => {
      const normal = (ruta) => ruta.replace(/\\/g, '/').toLowerCase();
      if (normal(resolve(args.resolveDir, args.path)) === normal(join(MOVIL, 'api'))) return { path: join(AQUI, 'shims/api.ts') };
      return undefined;
    });
  },
};

await build({
  entryPoints: [join(AQUI, 'maqueta.tsx')],
  bundle: true,
  outfile: join(AQUI, 'salida/maqueta.js'),
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  jsx: 'automatic',
  minify: false,
  sourcemap: false,
  logLevel: 'warning',
  resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
  mainFields: ['browser', 'module', 'main'],
  loader: { '.png': 'dataurl', '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false', global: 'window' },
  alias: {
    react: modulo('react'),
    'react-dom': modulo('react-dom'),
    'react-native': join(AQUI, 'shims/react-native.js'),
    'react-native-web': modulo('react-native-web'),
    'expo-constants': join(AQUI, 'shims/expo-constants.js'),
    'expo-status-bar': join(AQUI, 'shims/vacio.js'),
    'expo-secure-store': join(AQUI, 'shims/vacio.js'),
    'react-native-safe-area-context': join(AQUI, 'shims/safe-area.js'),
    '@react-native-async-storage/async-storage': join(AQUI, 'shims/async-storage.js'),
  },
  plugins: [reemplazos],
});
console.log('listo: salida/maqueta.js');
