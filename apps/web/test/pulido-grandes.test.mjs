/**
 * WP-PULIDO-GRANDES (DL-173) en el website, tanda A. Sin React ni navegador:
 *  1. TEST-PG-005 · PG-06: el QR y el botón llevan al archivo de la última publicación; sin la versión, sin la línea;
 *     sin QR con el ancho de un teléfono; los tres pasos, en castellano y por marca;
 *  2. TEST-PG-006 · PG-07: la página «no encontrada», en castellano y con sus dos salidas;
 *  3. TEST-PG-009 · PG-10: los avisos iguales del mismo ejercicio, en un grupo; «Completar» escribe solo las vacías;
 *     en Analizar · Fuerza, el mismo motivo en sesiones seguidas, en una fila;
 *  4. TEST-PG-013 · PG-14: ningún campo de fecha nativo en el website del profesional; la fecha en palabras, la semana
 *     desde el lunes, el teclado y los límites; el valor enviado, la misma fecha civil.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const D = await import('../src/lib/descarga-de-la-app.ts');
const N = await import('../src/lib/no-encontrada.ts');
const { terminosProhibidosEn } = await import('@be/domain');

const WEB = fileURLToPath(new URL('..', import.meta.url));
const leer = (ruta) => readFileSync(join(WEB, ruta), 'utf8');
const nombre = (ruta) => relative(WEB, ruta).replace(/\\/g, '/');
function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : /\.(tsx?)$/.test(n) ? [ruta] : [];
  });
}
/** Una copia que es una función, con valores de ejemplo: un número y un texto, o dos textos. */
const llamar = (f) => {
  try {
    return f(4, '0.28.0');
  } catch {
    return f('series 1 a 4', '10');
  }
};
/** Los textos de un objeto de copias, con las funciones llamadas con valores de ejemplo. */
const textos = (copia) =>
  Object.values(copia).flatMap((v) => (typeof v === 'function' ? [llamar(v)] : typeof v === 'string' ? [v] : typeof v === 'object' && v ? Object.values(v).filter((x) => typeof x === 'string') : []));

// ── TEST-PG-005 · PG-06 ────────────────────────────────────────────────────────────────────────────────────────

const ultima = (extra = {}) => ({
  tag_name: 'be-apk-0.28.0',
  assets: [
    { name: 'be-0.28.0-abc1234.apk', size: 85_000_000 },
    { name: 'be.apk', size: 84_783_608 },
    { name: 'be-0.28.0-abc1234.apk.sha256', size: 100 },
  ],
  ...extra,
});

test('TEST-PG-005 · el QR y el botón llevan al archivo de la última publicación, no a una página', () => {
  assert.equal(D.APK_DE_LA_ULTIMA, 'https://github.com/Elian-Bufi/be/releases/latest/download/be.apk');
  assert.equal(D.NOMBRE_DEL_ARCHIVO, 'be.apk');
  const c = leer('src/components/descarga-de-la-app.tsx');
  assert.match(c, /<CodigoQr texto=\{APK_DE_LA_ULTIMA\} etiqueta=\{C\.etiquetaDelQr\}/);
  assert.equal((c.match(/href=\{APK_DE_LA_ULTIMA\}/g) ?? []).length, 2, 'el botón del teléfono y el enlace de la compu');
  assert.ok(D.COPY_DESCARGA.etiquetaDelQr.includes(D.APK_DE_LA_ULTIMA), 'el texto alternativo dice el enlace');
  // Ninguna pantalla vuelve a la página de publicaciones de GitHub.
  for (const r of archivos(join(WEB, 'src/app')).filter((r) => !r.includes('invitacion'))) assert.doesNotMatch(readFileSync(r, 'utf8'), /releases\/latest['"`]/, nombre(r));
  const portada = leer('src/app/page.tsx');
  assert.match(portada, /<DescargaDeLaApp textoDelBoton=\{AVISOS_DE_PRUEBA_VISIBLES \? AVISOS_DE_PRUEBA\.descargarLaApk : COPY_DESCARGA\.bajar\} \/>/);
  assert.equal(D.COPY_DESCARGA.bajar, 'Bajar BE');
  assert.equal(D.COPY_DESCARGA.escanea, 'Escaneá para bajar BE');
});

test('TEST-PG-005 · la versión y el tamaño salen de la última publicación; si no se pueden leer, la línea no se dibuja', () => {
  assert.deepEqual(D.datosDeLaUltima(ultima()), { version: '0.28.0', tamano: '85 MB' });
  assert.deepEqual(D.datosDeLaUltima(ultima({ tag_name: 'be-apk-0.28.0-candidata.1' })), { version: '0.28.0-candidata.1', tamano: '85 MB' });
  // Sin la copia con el nombre fijo, no se dice la versión: el QR bajaría otra cosa que la línea.
  assert.equal(D.datosDeLaUltima(ultima({ assets: [{ name: 'be-0.28.0-abc1234.apk', size: 85_000_000 }] })), null);
  assert.equal(D.datosDeLaUltima(ultima({ tag_name: 'v0.28.0' })), null);
  assert.equal(D.datosDeLaUltima(ultima({ assets: [{ name: 'be.apk', size: 0 }] })), null);
  assert.equal(D.datosDeLaUltima(ultima({ assets: [{ name: 'be.apk', size: '85' }] })), null);
  for (const nada of [null, undefined, 'error', 42, { message: 'API rate limit exceeded' }]) assert.equal(D.datosDeLaUltima(nada), null);
  assert.equal(D.tamanoEnPalabras(84_783_608), '85 MB');
  assert.equal(D.tamanoEnPalabras(8_440_000), '8,4 MB');
  assert.equal(D.COPY_DESCARGA.version('0.28.0', '85 MB'), 'Versión 0.28.0 · 85 MB');
  const c = leer('src/components/descarga-de-la-app.tsx');
  // La línea solo con datos, y la lectura con un tiempo máximo, sin credenciales ni de dónde viene.
  assert.match(c, /\{datos \? \(\n\s*<p className="descarga__version" data-version-de-la-app>/);
  assert.match(c, /fetch\(LECTURA_DE_LA_ULTIMA, \{ signal: control\.signal, credentials: 'omit', referrerPolicy: 'no-referrer' \}\)/);
  assert.match(c, /\.catch\(\(\) => setDatos\(null\)\)/);
  // Ninguna versión escrita a mano en la portada ni en el componente.
  for (const r of ['src/app/page.tsx', 'src/components/descarga-de-la-app.tsx', 'src/lib/descarga-de-la-app.ts']) assert.doesNotMatch(leer(r), /Versión \d|0\.\d+\.\d+-candidata/, r);
});

test('TEST-PG-005 · con el ancho de un teléfono no hay QR: hay un botón; los tres pasos, en castellano y por marca', () => {
  const css = leer('src/app/globals.css');
  const telefono = css.slice(css.indexOf('/* Con el ancho de un teléfono: sin QR'));
  assert.match(telefono, /^[^]*?@media \(max-width: 40rem\) \{[^]*?\.descarga__qr \{\n\s*display: none;\n\s*\}[^]*?\.descarga__en-el-telefono \{\n\s*display: inline-flex;/);
  assert.match(css, /\.descarga__en-el-telefono \{\n\s*display: none;\n\}/);
  assert.deepEqual(Object.keys(D.PASOS_DE_LA_INSTALACION), ['samsung', 'motorola', 'xiaomi']);
  for (const [marca, pasos] of Object.entries(D.PASOS_DE_LA_INSTALACION)) {
    assert.equal(pasos.length, 3, marca);
    for (const p of pasos) {
      assert.ok(p.texto && p.enElDibujo, marca);
      assert.doesNotMatch(p.texto, /\b(Settings|Install|Allow|Downloads|from this source|anyway)\b/, `${marca}: en castellano`);
    }
  }
  const c = leer('src/components/descarga-de-la-app.tsx');
  assert.match(c, /<DibujoDelPaso marca=\{marca\} paso=\{\(n \+ 1\) as 1 \| 2 \| 3\} etiqueta=/);
  assert.match(c, /role="img" aria-label=\{etiqueta\}/);
  for (const t of [...textos(D.COPY_DESCARGA), ...Object.values(D.PASOS_DE_LA_INSTALACION).flat().flatMap((p) => [p.texto, p.enElDibujo])]) assert.deepEqual(terminosProhibidosEn(t), [], t);
});

// ── TEST-PG-006 · PG-07 ────────────────────────────────────────────────────────────────────────────────────────

test('TEST-PG-006 · la página no encontrada, en castellano y con sus dos salidas', () => {
  assert.deepEqual({ ...N.COPY_NO_ENCONTRADA }, {
    titulo: 'Esta página no existe',
    bajada: 'Si venías de una invitación, pedile a tu profesional un enlace nuevo.',
    alInicio: 'Ir al inicio',
    entrar: 'Entrar',
  });
  const p = leer('src/app/not-found.tsx');
  assert.match(p, /export default function NoEncontrada\(\)/);
  assert.match(p, /<h1>\{C\.titulo\}<\/h1>/);
  assert.match(p, /<Link className="boton boton--primario" href="\/">\n\s*\{C\.alInicio\}/);
  assert.match(p, /<Link className="boton boton--secundario" href="\/login">\n\s*\{C\.entrar\}/);
  assert.match(p, /title: 'Esta página no existe · BE', robots: \{ index: false, follow: false \}/);
  // Ningún texto de Next en inglés, y nada que redirija, busque o registre la dirección pedida.
  assert.doesNotMatch(p, /could not be found|not found|404:/i);
  assert.doesNotMatch(p, /redirect|useRouter|router\.|fetch\(|api\.|usePathname|location/);
  for (const t of Object.values(N.COPY_NO_ENCONTRADA)) assert.deepEqual(terminosProhibidosEn(t), [], t);
});
