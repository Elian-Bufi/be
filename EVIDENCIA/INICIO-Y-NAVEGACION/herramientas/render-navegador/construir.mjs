// Arma el render de componentes en el navegador con esbuild: los archivos REALES de apps/mobile/src, react-native-web en
// lugar de react-native, y reemplazos para lo nativo (shims/). Uso: node construir.mjs
// Variables opcionales, para las comparaciones del pulido del mapa (LEEME):
// - BE_REPO: la raíz del repo que se compila; por omisión, este. Para el «antes», un árbol de trabajo (git worktree).
// - BE_DEPENDENCIAS: dónde están los node_modules de la app, si BE_REPO no los tiene (un árbol de trabajo no los tiene).
// - SALIDA: el archivo que se escribe en salida/; por omisión, maqueta.js.
// - ENCUADRE: «ancho,derecha», para compilar otro encuadre sin tocar el código; p. ej. 1.55,0.09 es la variante C.
import { build } from 'esbuild';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.BE_REPO ?? resolve(AQUI, '../../../..');
const DEPENDENCIAS = process.env.BE_DEPENDENCIAS ?? REPO;
const SALIDA = process.env.SALIDA ?? 'maqueta.js';
const MOVIL = join(REPO, 'apps/mobile/src');
const modulo = (nombre) => join(AQUI, 'node_modules', nombre);
const svg = [join(DEPENDENCIAS, 'apps/mobile/node_modules/react-native-svg'), join(DEPENDENCIAS, 'node_modules/react-native-svg')].find((r) => existsSync(r));

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

/** Con ENCUADRE, la composición se compila con esas dos constantes; el archivo no cambia. */
const encuadre = {
  name: 'encuadre',
  setup(b) {
    if (!process.env.ENCUADRE) return;
    const [ancho, derecha] = process.env.ENCUADRE.split(',').map(Number);
    if (!(ancho > 0 && derecha > 0)) throw new Error('ENCUADRE se escribe «ancho,derecha», por ejemplo 1.55,0.09');
    b.onLoad({ filter: /composicion-de-la-figura\.ts$/ }, (args) => {
      const fuente = readFileSync(args.path, 'utf8');
      const conAncho = fuente.replace(/anchoDeLaImagen: [\d.]+/, `anchoDeLaImagen: ${ancho}`);
      const conDerecha = conAncho.replace(/aLaDerechaDelEje: [\d.]+/, `aLaDerechaDelEje: ${derecha}`);
      if (conAncho === fuente || conDerecha === conAncho) throw new Error('ENCUADRE: no encontré las dos constantes de ENCUADRE en la composición');
      return { contents: conDerecha, loader: 'ts' };
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
  // Lo que la app importa y no está junto a BE_REPO se busca en BE_DEPENDENCIAS.
  nodePaths: [join(DEPENDENCIAS, 'node_modules'), join(DEPENDENCIAS, 'apps/mobile/node_modules')],
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
    ...(svg ? { 'react-native-svg': svg } : {}),
  },
  plugins: [reemplazos, encuadre],
});
console.log(`listo: salida/${SALIDA}`);
