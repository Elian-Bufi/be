/**
 * WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138): lo que se configura alrededor de «Continuar con Google» en el website y la APK.
 * - **El botón depende del client ID del build:** sin él, ni el website ni la APK lo muestran; con un valor que no tiene
 *   la forma de un client ID, el build se corta sin repetirlo (puede ser un secreto pegado por error).
 * - **Las cabeceras de be-web** admiten solo lo que pide Google Identity Services, y el Referrer-Policy deja ver el origen.
 * - **La APK no carga la biblioteca de Google al arrancar:** solo al tocar el botón. Sin su parte nativa, no se cae.
 * - **Toda alta con correo manda la declaración de mayoría de edad** (08 §24.7 a): sin ella, la API ya no crea la cuenta.
 * Datos sintéticos: el client ID de las pruebas no existe.
 *
 * Uso: node --test scripts/acceso-con-google.test.mjs
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CLIENT_ID_SINTETICO = '123456789012-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com';
const NO_ES_UN_CLIENT_ID = 'GOCSPX-esto-no-es-un-client-id';
let caso = 0;

/** Evalúa un archivo de configuración con estas variables de entorno, y deja el entorno como estaba. */
async function conEntorno(archivo, variables) {
  const antes = Object.fromEntries(Object.keys(variables).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(variables)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    // Una URL distinta por caso: el módulo se vuelve a evaluar con el entorno de ese caso.
    return (await import(`${new URL(archivo, import.meta.url).href}?caso=${++caso}`)).default;
  } finally {
    for (const [k, v] of Object.entries(antes)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test('APK: sin GOOGLE_WEB_CLIENT_ID no hay client ID en la app; con uno válido, llega en extra; con otro valor, el build se corta', async () => {
  const sin = await conEntorno('../apps/mobile/app.config.ts', { GOOGLE_WEB_CLIENT_ID: undefined });
  assert.equal(sin.extra.googleWebClientId, null);
  const con = await conEntorno('../apps/mobile/app.config.ts', { GOOGLE_WEB_CLIENT_ID: ` ${CLIENT_ID_SINTETICO} ` });
  assert.equal(con.extra.googleWebClientId, CLIENT_ID_SINTETICO);
  await assert.rejects(conEntorno('../apps/mobile/app.config.ts', { GOOGLE_WEB_CLIENT_ID: NO_ES_UN_CLIENT_ID }), (error) => {
    assert.match(error.message, /GOOGLE_WEB_CLIENT_ID no tiene la forma de un client ID/);
    assert.equal(error.message.includes(NO_ES_UN_CLIENT_ID), false, 'el mensaje no repite el valor');
    return true;
  });
  // Sin plugin de configuración de la biblioteca: en Android no hace falta (ver app.config.ts).
  assert.equal(JSON.stringify(con.plugins).includes('google-signin'), false);
});

test('website: sin BE_GOOGLE_WEB_CLIENT_ID el build no lleva client ID; con uno válido, sí; con otro valor, el build se corta', async () => {
  const sin = await conEntorno('../apps/web/next.config.mjs', { BE_GOOGLE_WEB_CLIENT_ID: undefined, RENDER: undefined });
  assert.equal(sin.env.BE_GOOGLE_WEB_CLIENT_ID, '');
  const con = await conEntorno('../apps/web/next.config.mjs', { BE_GOOGLE_WEB_CLIENT_ID: CLIENT_ID_SINTETICO, RENDER: undefined });
  assert.equal(con.env.BE_GOOGLE_WEB_CLIENT_ID, CLIENT_ID_SINTETICO);
  await assert.rejects(conEntorno('../apps/web/next.config.mjs', { BE_GOOGLE_WEB_CLIENT_ID: NO_ES_UN_CLIENT_ID, RENDER: undefined }), (error) => {
    assert.match(error.message, /BE_GOOGLE_WEB_CLIENT_ID no tiene la forma de un client ID/);
    assert.equal(error.message.includes(NO_ES_UN_CLIENT_ID), false, 'el mensaje no repite el valor');
    return true;
  });
});

/** El valor de una cabecera de be-web en render.yaml. */
function cabeceraDeLaWeb(nombre) {
  const blueprint = readFileSync(join(RAIZ, 'render.yaml'), 'utf8');
  const web = blueprint.slice(blueprint.indexOf('name: be-web'));
  const desde = web.indexOf(`name: ${nombre}`);
  assert.ok(desde >= 0, `be-web no declara ${nombre}`);
  const valor = /value:\s*"?([^"\n]+)"?/.exec(web.slice(desde));
  return valor[1].trim();
}

test('be-web: la CSP admite solo lo que pide Google Identity Services, y el Referrer-Policy deja ver el origen', () => {
  const csp = new Map(
    cabeceraDeLaWeb('Content-Security-Policy')
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((partes) => partes[0])
      .map(([directiva, ...fuentes]) => [directiva, fuentes]),
  );
  const GIS = 'https://accounts.google.com/gsi/';
  assert.ok(csp.get('script-src').includes(`${GIS}client`));
  assert.ok(csp.get('style-src').includes(`${GIS}style`));
  assert.ok(csp.get('connect-src').includes(GIS));
  assert.deepEqual(csp.get('frame-src'), [GIS]);
  // Ningún otro origen de Google, ni comodines.
  const deGoogle = [...csp.values()].flat().filter((f) => /google/i.test(f));
  assert.deepEqual(deGoogle.filter((f) => !f.startsWith(GIS)), []);
  assert.equal([...csp.values()].flat().some((f) => f.includes('*')), false);
  // Lo que ya estaba sigue: nadie enmarca al website, y no hay objetos ni otra base.
  assert.deepEqual(csp.get('frame-ancestors'), ["'none'"]);
  assert.deepEqual(csp.get('object-src'), ["'none'"]);
  assert.deepEqual(csp.get('default-src'), ["'self'"]);
  // Google valida el client ID con el origen que lee del Referer: con no-referrer rechaza todo. Hacia otros sitios viaja
  // solo el origen, nunca la ruta ni la consulta.
  assert.equal(cabeceraDeLaWeb('Referrer-Policy'), 'strict-origin-when-cross-origin');
});

/** Los archivos de código de una carpeta, con sus subcarpetas. */
function archivos(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}
const APK = [...archivos(join(RAIZ, 'apps/mobile/src')), join(RAIZ, 'apps/mobile/App.tsx')];
const WEB = archivos(join(RAIZ, 'apps/web/src'));
const nombre = (ruta) => relative(RAIZ, ruta).replace(/\\/g, '/');

test('APK: la biblioteca de Google se carga recién al tocar el botón, desde un solo módulo', () => {
  const usan = APK.filter((ruta) => readFileSync(ruta, 'utf8').includes('@react-native-google-signin/google-signin'));
  assert.deepEqual(usan.map(nombre), ['apps/mobile/src/google.ts']);
  const modulo = readFileSync(usan[0], 'utf8');
  // Solo tipos en lo alto del módulo; la biblioteca, con require, dentro de la función que la carga.
  for (const linea of modulo.split('\n').filter((l) => /^import .*@react-native-google-signin/.test(l))) assert.match(linea, /^import type /);
  assert.match(modulo, /function cargar\([^)]*\)[^{]*\{[\s\S]*require\('@react-native-google-signin\/google-signin'\)/);
  assert.match(modulo, /if \(!CLIENT_ID_WEB_DE_GOOGLE\) return \{ tipo: 'NO_DISPONIBLE' \}/);
});

test('website: el script de Google se pide desde un solo módulo, y solo el de Google Identity Services', () => {
  const usan = WEB.filter((ruta) => readFileSync(ruta, 'utf8').includes('accounts.google.com'));
  assert.deepEqual(usan.map(nombre), ['apps/web/src/lib/google.ts']);
  // La CSP compara la ruta, no la consulta (`?hl=` es el idioma).
  const direcciones = readFileSync(usan[0], 'utf8').match(/https:\/\/accounts\.google\.com[^'"\s`?]*/g);
  assert.deepEqual([...new Set(direcciones)], ['https://accounts.google.com/gsi/client']);
});

test('toda alta con correo, en el website y en la APK, manda la casilla de mayoría de edad (DL-138, D-10)', () => {
  const llamadas = [...WEB, ...APK].flatMap((ruta) => {
    const texto = readFileSync(ruta, 'utf8');
    // El cliente de la API (`api.registrar`), no el registro del teléfono para los avisos (`d.api.registrar`).
    return [...texto.matchAll(/(?<![\w.])api\.registrar\(([^;]*)\)/g)].map((m) => ({ ruta: nombre(ruta), argumentos: m[1] }));
  });
  assert.deepEqual(llamadas.map((l) => l.ruta).sort(), ['apps/mobile/src/pantallas/registro.tsx', 'apps/web/src/app/register/formulario-de-registro.tsx']);
  for (const { ruta, argumentos } of llamadas) assert.match(argumentos, /mayoriaDeEdad: actos\.mayoria/, ruta);
});
