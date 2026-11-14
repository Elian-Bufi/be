/**
 * WP-PULIDO-GRANDES (DL-173) en el website, tanda A. Sin React ni navegador:
 *  1. TEST-PG-005 · PG-06: el QR y el botón llevan al archivo de la última publicación; sin la versión, sin la línea;
 *     sin QR con el ancho de un teléfono; los tres pasos, en castellano y por marca;
 *  2. TEST-PG-006 · PG-07: la página «no encontrada», en castellano y con sus dos salidas;
 *  3. TEST-PG-009 · PG-10: los avisos iguales del mismo ejercicio, en un grupo; «Completar» escribe solo las vacías;
 *     en Analizar · Fuerza, el mismo motivo en sesiones seguidas, en una fila;
 *  4. TEST-PG-013 · PG-14: ningún campo de fecha nativo en el website del profesional; la fecha en palabras, la semana
 *     desde el lunes, el teclado y los límites; el valor enviado, la misma fecha civil.
 * Tanda B (las notas):
 *  5. TEST-PG-015 · PG-16: «Tus notas» en las tres disposiciones del Resumen, con lo que dice PG-D11; los dos editores leen
 *     las notas una sola vez y las muestran al lado de cada ejercicio y cada comida; con «Ocultar nombres», ocultas;
 *  6. TEST-PG-014 · PG-15: Registros lee las notas aparte, con el período de las sesiones, y la fila dice «Con nota» sin
 *     color de alarma. Mutaciones verificadas: sacar «Tus notas» de una disposición; leer las notas en cada ejercicio.
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
const G = await import('../src/app/pro/advisees/avisos-agrupados.ts');
const F = await import('../src/lib/fecha-en-palabras.ts');
const FZ = await import('../src/app/pro/advisees/fuerza/fuerza.ts');
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
  assert.equal((c.match(/href=\{APK_DE_LA_ULTIMA\}/g) ?? []).length, 1, 'un solo botón, en la compu y en el teléfono (Dirección, 2026-11-14)');
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

test('TEST-PG-005 · el botón siempre; con el ancho de un teléfono, sin QR; los tres pasos, en castellano y por marca', () => {
  const css = leer('src/app/globals.css');
  const telefono = css.slice(css.indexOf('/* Con el ancho de un teléfono: sin QR'));
  assert.match(telefono, /^[^]*?@media \(max-width: 40rem\) \{[^]*?\.descarga__qr \{\n\s*display: none;\n\s*\}[^]*?\.descarga__boton \{\n\s*display: inline-flex;/);
  // Dirección, 2026-11-14: «el QR para descargar y un botón de descarga también». En la compu, los dos a la vista.
  assert.doesNotMatch(css.slice(0, css.indexOf('/* Con el ancho de un teléfono: sin QR')), /\.descarga__boton \{[^}]*display: none/);
  assert.match(leer('src/components/descarga-de-la-app.tsx'), /<a className="boton boton--primario descarga__boton" href=\{APK_DE_LA_ULTIMA\} download data-bajar-la-app>/);
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

// ── TEST-PG-009 · PG-10 ────────────────────────────────────────────────────────────────────────────────────────

const R = (b, s, p, serie) => `blocks[${b}].sessions[${s}].prescriptions[${p}].sets[${serie}].repetitions`;
const SIN = 'INCOMPLETO_SIN_REPETICIONES';

test('TEST-PG-009 · los avisos con el mismo motivo y el mismo ejercicio van en un grupo, con su rango', () => {
  const avisos = [
    { code: SIN, path: R(0, 1, 2, 0) },
    { code: SIN, path: R(0, 1, 2, 1) },
    { code: 'INCOMPLETO_SIN_SERIES', path: 'blocks[0].sessions[1].prescriptions[3]' },
    { code: SIN, path: R(0, 1, 2, 3) },
    { code: SIN, path: R(0, 1, 2, 2) },
    // Otro ejercicio, mismo motivo: otro grupo (la mutación «agrupar por motivo sin el ejercicio» lo junta).
    { code: SIN, path: R(0, 1, 4, 0) },
    // Mismo ejercicio, otro motivo: otro renglón.
    { code: 'REPETITIONS_NOT_READABLE', path: R(0, 1, 2, 1) },
    // La ruta con puntos y prefijo dice lo mismo que la de corchetes.
    { code: SIN, path: 'changes.blocks.0.sessions.1.prescriptions.4.sets.2.repetitions' },
  ];
  const g = G.agruparAvisos(avisos);
  assert.equal(g.length, 4);
  assert.deepEqual(g.map((x) => [x.code, x.ejercicio, x.series, x.avisos.length]), [
    [SIN, 'blocks[0].sessions[1].prescriptions[2]', [0, 1, 2, 3], 4],
    ['INCOMPLETO_SIN_SERIES', null, [], 1],
    [SIN, 'blocks[0].sessions[1].prescriptions[4]', [0, 2], 2],
    ['REPETITIONS_NOT_READABLE', 'blocks[0].sessions[1].prescriptions[2]', [1], 1],
  ]);
  // Ningún aviso se pierde: el grupo abierto los tiene todos, con su ruta para «Ir a corregir».
  assert.equal(g.flatMap((x) => x.avisos).length, avisos.length);
  assert.deepEqual(G.agruparAvisos([{ code: SIN, path: R(0, 0, 0, 0), extra: 1 }])[0].avisos, [{ code: SIN, path: R(0, 0, 0, 0), extra: 1 }]);
  // Microciclos: el grupo es del ejercicio de esa sesión de ese microciclo.
  const m = G.agruparAvisos([
    { code: SIN, path: 'blocks[1].microcycles[0].sessions[0].prescriptions[0].sets[0].repetitions' },
    { code: SIN, path: 'blocks[1].microcycles[1].sessions[0].prescriptions[0].sets[0].repetitions' },
  ]);
  assert.equal(m.length, 2);
  assert.deepEqual(G.lugarDelEjercicio('blocks[1].microcycles[0].sessions[2].prescriptions[3]'), { i: 1, j: 0, k: 2, l: 3 });
  assert.deepEqual(G.lugarDelEjercicio('blocks[1].sessions[2].prescriptions[3]'), { i: 1, j: null, k: 2, l: 3 });
  assert.equal(G.lugarDelEjercicio('agenda.sessions[0]'), null);
});

test('TEST-PG-009 · el rango se dice como se lee: «series 1 a 4», «series 1, 3 y 4»', () => {
  assert.equal(G.seriesEnPalabras([0, 1, 2, 3]), 'series 1 a 4');
  assert.equal(G.seriesEnPalabras([0, 2, 3]), 'series 1, 3 y 4');
  assert.equal(G.seriesEnPalabras([3, 0, 1, 2, 5]), 'series 1 a 4 y 6');
  assert.equal(G.seriesEnPalabras([0, 1]), 'series 1 y 2');
  assert.equal(G.seriesEnPalabras([1]), 'serie 2');
  assert.equal(G.seriesEnPalabras([0, 1, 2, 4, 5, 6]), 'series 1 a 3 y 5 a 7');
  assert.equal(G.COPY_AVISOS_AGRUPADOS.completar(4), 'Completar las cuatro');
  assert.equal(G.COPY_AVISOS_AGRUPADOS.completar(12), 'Completar las 12');
  assert.equal(G.COPY_AVISOS_AGRUPADOS.completadas('series 1 a 4', '10'), 'Series 1 a 4: 10 repeticiones');
  for (const t of textos(G.COPY_AVISOS_AGRUPADOS)) assert.deepEqual(terminosProhibidosEn(t), [], t);
});

test('TEST-PG-009 · «Completar» escribe solo las series del grupo y solo las vacías', () => {
  const sets = [{ repetitions: null }, { repetitions: { value: 8 } }, { repetitions: null, rir: 2 }, {}, { repetitions: null }];
  const r = G.completarLasVacias(sets, [0, 1, 2, 3], { value: 10 });
  assert.deepEqual(r.escritas, [0, 2, 3]);
  assert.deepEqual(r.sets, [{ repetitions: { value: 10 } }, { repetitions: { value: 8 } }, { repetitions: { value: 10 }, rir: 2 }, { repetitions: { value: 10 } }, { repetitions: null }]);
  // No cambia lo que recibe: «Deshacer» vuelve a lo de antes.
  assert.deepEqual(sets[0], { repetitions: null });
  assert.deepEqual(G.completarLasVacias(sets, [1], { min: 8, max: 12 }).escritas, []);
  assert.deepEqual(G.leerLasRepeticiones(' 10 '), { value: 10 });
  assert.deepEqual(G.leerLasRepeticiones('8-12'), { min: 8, max: 12 });
  for (const malo of ['', '0', '12-8', '8-8', 'diez', '8,5', '-3']) assert.equal(G.leerLasRepeticiones(malo), null, malo);
});

test('TEST-PG-009 · el editor agrupa lo sin completar en el cuadro y en el panel; el grupo se abre y conserva «Ir»', () => {
  const editor = leer('src/app/pro/advisees/training/editor.tsx');
  // Dentro del cuadro modal, sin «Completar»: su «Deshacer» no se alcanza con el cuadro abierto (revisión de la tanda A).
  assert.match(editor, /const sinCompletarAlActivar = confirmar \? enGrupos\(loQueQuedaSinCompletarEnEntrenamiento\(bloques\), conSuLugar\)\.map\(\(c\) => \(\{ \.\.\.c, completar: null \}\)\) : \[\];/);
  // Las filas, con una clave estable: lo abierto no pasa a la fila siguiente.
  assert.doesNotMatch(editor, /sinCompletarEnVivo\.map\(\(x, n\) =>/);
  assert.doesNotMatch(leer('src/app/pro/advisees/cuadro-antes-de-activar.tsx'), /sinCompletar\.map\(\(c, n\) =>/);
  assert.match(editor, /const sinCompletarEnVivo = enGrupos\(loQueQuedaSinCompletarEnEntrenamiento\(bloques\), enElPanel\);/);
  // Lo que impide activar no cambia: uno por renglón, y el principal cuenta lo mismo.
  assert.match(editor, /\.\.\.impideGuardar\.map\(\(p\) => conSuLugar\(p, PROBLEMA\[p\.code\]/);
  // «Completar» solo para las series sin repeticiones, con la operación de siempre y su «Deshacer».
  assert.match(editor, /completar: g\.code === INCOMPLETO\.sinRepeticiones \?/);
  const completar = editor.slice(editor.indexOf('const completarElGrupo ='), editor.indexOf('const enGrupos ='));
  assert.match(completar, /cambiar\(\(x\) => \{/);
  assert.match(completar, /completarLasVacias\(p\.sets, series, valor\)/);
  assert.match(completar, /setDeshacer\(\{/);
  assert.equal((editor.match(/<RenglonDeAviso cosa=\{x\}/g) ?? []).length, 2, 'los dos lugares del panel');
  assert.match(leer('src/app/pro/advisees/cuadro-antes-de-activar.tsx'), /<RenglonDeAviso cosa=\{c\} textoIr=\{A\.ir\} \/>/);
  const renglon = leer('src/app/pro/advisees/renglon-de-aviso.tsx');
  assert.match(renglon, /aria-expanded=\{abierto\}/);
  assert.match(renglon, /<span>\{d\.texto\}<\/span> \{d\.ir \? botonIr\(d\.ir\) : null\}/);
});

test('TEST-PG-009 · en Analizar · Fuerza, el mismo motivo en sesiones seguidas va en una fila; uno distinto corta', () => {
  assert.deepEqual(FZ.seguidasConElMismo(['a', 'a', 'b', 'a', 'a', 'a'], (x) => x), [['a', 'a'], ['b'], ['a', 'a', 'a']]);
  const s = (id, fecha, motivo = 'ninguna serie entra: el RIR es mayor que 2') => ({ tipo: 'sin-estimacion', fecha, executionId: id, motivo });
  const punto = { tipo: 'punto', fecha: '2026-12-03', punto: { pointId: 'p1' } };
  const filas = FZ.filasConLosMotivosSeguidos([s('e5', '2026-12-08'), s('e4', '2026-12-06'), s('e3', '2026-12-04'), punto, s('e2', '2026-12-02'), s('e1', '2026-12-01', 'otro motivo')]);
  assert.deepEqual(filas.map((f) => (f.tipo === 'sin-estimacion-seguidas' ? f.filas.map((x) => x.executionId) : f.tipo)), [['e5', 'e4', 'e3'], 'punto', 'sin-estimacion', 'sin-estimacion']);
  assert.equal(FZ.rangoDeSesiones(['2026-12-08', '2026-12-04', '2026-12-06']), 'del vie 4 dic al mar 8 dic, 3 sesiones');
  const fuente = leer('src/app/pro/advisees/fuerza/fuerza-en-analizar.tsx');
  assert.match(fuente, /const filas = filasConLosMotivosSeguidos\(filasDeLaEvolucion\(/);
  assert.match(fuente, /<summary>\{C\.verLasSesiones\(f\.filas\.length\)\}<\/summary>/);
});

// ── TEST-PG-013 · PG-14 ────────────────────────────────────────────────────────────────────────────────────────

test('TEST-PG-013 · ningún campo de fecha nativo en el website del profesional', () => {
  const pro = archivos(join(WEB, 'src/app/pro'));
  assert.ok(pro.length > 50);
  const nativos = pro.filter((r) => /type=["']date["']|type=\{["']date["']\}/.test(readFileSync(r, 'utf8'))).map(nombre);
  assert.deepEqual(nativos, [], 'cada campo de fecha es CampoDeFecha');
  // PG-T40 (a ratificar; revisión de la tanda A): los cinco campos de fecha Y HORA siguen nativos hasta que CampoDeFecha
  // tenga la hora en 24 h. La lista es cerrada: uno nuevo, o uno en otro archivo, pone la prueba en rojo.
  const conHora = pro.flatMap((r) => [...readFileSync(r, 'utf8').matchAll(/type=["']datetime-local["']|type=\{["']datetime-local["']\}/g)].map(() => nombre(r)));
  assert.deepEqual(conHora.sort(), [
    'src/app/pro/advisees/anthropometry/preparacion.tsx',
    'src/app/pro/advisees/nutrition/formularios.tsx',
    'src/app/pro/advisees/nutrition/formularios.tsx',
    'src/app/pro/advisees/training/resumen.tsx',
    'src/app/pro/advisees/training/resumen.tsx',
  ], 'los campos de fecha y hora nativos que quedan son los cinco declarados en PG-T40');
  const usos = pro.flatMap((r) => [...readFileSync(r, 'utf8').matchAll(/<CampoDeFecha\b/g)].map(() => nombre(r)));
  assert.ok(usos.length >= 14, `se esperaban los catorce campos y hay ${usos.length}`);
  for (const r of ['src/app/pro/advisees/control-de-periodo.tsx', 'src/app/pro/advisees/cuando-la-revisas.tsx', 'src/app/pro/advisees/fuerza/serie-observada.tsx', 'src/app/pro/advisees/periodo.tsx', 'src/app/pro/advisees/seguimiento/analizar.tsx', 'src/app/pro/advisees/training/agenda-del-plan.tsx']) {
    assert.ok(usos.includes(r), r);
  }
  // Los límites de hoy se conservan donde estaban.
  assert.match(leer('src/app/pro/advisees/fuerza/serie-observada.tsx'), /<CampoDeFecha id=\{`\$\{id\}-fecha`\} etiqueta=\{C\.fecha\} max=\{hoy\}/);
  assert.match(leer('src/app/pro/advisees/control-de-periodo.tsx'), /max=\{hasta \|\| hoy\}/);
  assert.match(leer('src/app/pro/advisees/training/agenda-del-plan.tsx'), /etiqueta=\{A\.moverA\} value=\{moviendo\.hacia\} min=\{agenda\.startDate\}/);
});

test('TEST-PG-013 · la fecha en palabras y con los nombres de acá, la semana desde el lunes', () => {
  assert.equal(F.fechaCorta('2026-11-27', '2026-11-13'), 'vie 27 nov');
  assert.equal(F.fechaCorta('2027-11-26', '2026-11-13'), 'vie 26 nov 2027');
  assert.equal(F.fechaCorta('2026-09-01', '2026-11-13'), 'mar 1 sept');
  assert.equal(F.fechaCompleta('2026-11-27'), 'viernes 27 de noviembre de 2026');
  assert.equal(F.fechaCompleta('2026-11-29'), 'domingo 29 de noviembre de 2026');
  assert.equal(F.mesEnPalabras(2026, 10), 'noviembre de 2026');
  // Noviembre de 2026 arranca un domingo: la primera semana tiene seis lugares vacíos y el 1 al final.
  const nov = F.semanasDelMes(2026, 10);
  assert.deepEqual(nov[0], [null, null, null, null, null, null, '2026-11-01']);
  assert.deepEqual(nov[nov.length - 1], ['2026-11-30', null, null, null, null, null, null]);
  assert.ok(nov.every((s) => s.length === 7));
  assert.deepEqual(F.DIAS_DE_LA_GRILLA, ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']);
  assert.equal(F.semanasDelMes(2027, 1).length, 4, 'febrero de 2027 arranca lunes y tiene 28 días');
  // Sin `Intl` para los nombres: no dependen del idioma del navegador.
  assert.doesNotMatch(leer('src/lib/fecha-en-palabras.ts').replace(/export function hoyEnBuenosAires[^]*?\n\}/, ''), /Intl\.|toLocale/);
  assert.equal(F.esFechaCivil('2026-02-30'), false);
  assert.equal(F.esFechaCivil('2026-02-28'), true);
});

test('TEST-PG-013 · el teclado: flechas, Inicio, Fin, Re Pág y Av Pág, sin salir de los límites', () => {
  const k = (f, t, mayus = false, min, max) => F.fechaConLaTecla(f, t, mayus, min, max);
  assert.equal(k('2026-11-27', 'ArrowLeft'), '2026-11-26');
  assert.equal(k('2026-11-30', 'ArrowRight'), '2026-12-01');
  assert.equal(k('2026-11-27', 'ArrowUp'), '2026-11-20');
  assert.equal(k('2026-11-27', 'ArrowDown'), '2026-12-04');
  assert.equal(k('2026-11-27', 'Home'), '2026-11-23', 'el lunes de esa semana');
  assert.equal(k('2026-11-27', 'End'), '2026-11-29', 'el domingo de esa semana');
  assert.equal(k('2026-01-31', 'PageDown'), '2026-02-28');
  assert.equal(k('2026-03-31', 'PageUp'), '2026-02-28');
  assert.equal(k('2026-11-27', 'PageUp', true), '2025-11-27');
  assert.equal(k('2028-02-29', 'PageDown', true), '2029-02-28');
  assert.equal(k('2026-11-27', 'Tab'), null);
  // Los límites: no se puede llegar a un día fuera.
  assert.equal(k('2026-11-13', 'ArrowRight', false, undefined, '2026-11-13'), '2026-11-13');
  assert.equal(k('2026-11-02', 'PageUp', false, '2026-11-01'), '2026-11-01');
  assert.equal(F.dentroDeLosLimites('2026-11-14', undefined, '2026-11-13'), false);
  assert.equal(F.dentroDeLosLimites('2026-11-13', '2026-11-13', '2026-11-13'), true);
  assert.equal(F.dentroDeLosLimites('2026-11-13', '', ''), true, 'un límite vacío no limita, como en el nativo');
  const campo = leer('src/components/campo-de-fecha.tsx');
  assert.match(campo, /if \(e\.key === 'Enter' \|\| e\.key === ' '\)/);
  assert.match(campo, /if \(e\.key === 'Escape' && abierto\)/);
  assert.match(campo, /aria-label=\{`\$\{fechaCompleta\(f\)\}/);
  assert.match(campo, /aria-disabled=\{dentroDeLosLimites\(f, min, max\) \? undefined : true\}/);
  // Elegir un día fuera de los límites no hace nada.
  assert.match(campo, /const elegir = \(f: string\) => \{\n\s*if \(!dentroDeLosLimites\(f, min, max\)\) return;/);
});

test('TEST-PG-013 · el valor enviado es la misma fecha civil AAAA-MM-DD que mandaba el campo nativo', () => {
  // Todo lo que el calendario produce tiene la forma del valor del nativo.
  for (const f of ['2026-11-27', '2026-12-31', '2027-01-01', '2028-02-29']) {
    for (const t of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']) {
      const n = F.fechaConLaTecla(f, t, false);
      assert.match(n, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(F.esFechaCivil(n), `${f} ${t} → ${n}`);
    }
  }
  for (const [s, semana] of F.semanasDelMes(2026, 11).entries()) for (const f of semana) if (f !== null) assert.ok(F.esFechaCivil(f), `${s}: ${f}`);
  // El campo le pasa a cada pantalla la fecha tal cual (como `e.target.value`), y nada más.
  const campo = leer('src/components/campo-de-fecha.tsx');
  assert.match(campo, /if \(f !== value\) onChange\(f\);/);
  for (const t of textos(F.COPY_CAMPO_DE_FECHA)) assert.deepEqual(terminosProhibidosEn(t), [], t);
});

// ── Tanda B · TEST-PG-014 (PG-15) y TEST-PG-015 (PG-16), la parte del website ──────────────────────────────────────

test('TEST-PG-015 · «Tus notas» va en las tres disposiciones del Resumen, después de las notas del equipo', () => {
  const resumen = leer('src/app/pro/advisees/seguimiento/resumen.tsx');
  assert.equal((resumen.match(/\{notas\}\s*\{tusNotas\}/g) ?? []).length, 3);
});

test('TEST-PG-015 · el bloc dice que solo lo ve quien escribe y que la persona lo recibe si pide sus datos (PG-D11)', async () => {
  const { COPY_NOTAS_PROPIAS } = await import('@be/domain');
  assert.match(COPY_NOTAS_PROPIAS.queSon, /^Solo las ves vos\./);
  assert.match(COPY_NOTAS_PROPIAS.queSon, /si la persona pide sus datos, las recibe/);
  assert.match(leer('src/app/pro/advisees/seguimiento/tus-notas.tsx'), /\{T\.queSon\}/);
});

test('TEST-PG-015 · los dos editores leen las notas una sola vez y las muestran al lado de cada ejercicio y cada comida', () => {
  for (const ruta of ['src/app/pro/advisees/training/plan.tsx', 'src/app/pro/advisees/nutrition/plan.tsx']) assert.match(leer(ruta), /<ProveedorDeNotasPropias token=\{token\} asesoradoId=\{asesoradoId\} sesionPerdida=\{sesionPerdida\}>/);
  assert.match(leer('src/app/pro/advisees/training/ejercicio-del-editor.tsx'), /<NotasAlLado ejercicio=\{exerciseId\} \/>/);
  assert.match(leer('src/app/pro/advisees/nutrition/comida-del-editor.tsx'), /<NotasAlLado comida=\{comida\.label\} \/>/);
  // API-NPP-02 se lee en el proveedor del editor y en el bloc del Resumen; nunca por ejercicio ni por comida.
  const conLectura = archivos(join(WEB, 'src'))
    .filter((r) => readFileSync(r, 'utf8').includes('api.notasPropias('))
    .map(nombre)
    .sort();
  assert.deepEqual(conLectura, ['src/app/pro/advisees/notas-propias.tsx', 'src/app/pro/advisees/seguimiento/tus-notas.tsx']);
});

test('TEST-PG-015 · con «Ocultar nombres», el texto de las notas no se ve hasta pedirlo (PG-T73)', () => {
  for (const ruta of ['src/app/pro/advisees/notas-propias.tsx', 'src/app/pro/advisees/seguimiento/tus-notas.tsx']) {
    const codigo = leer(ruta);
    assert.match(codigo, /useNombresOcultos\(\)/, ruta);
    assert.match(codigo, /\{T\.ocultas\}/, ruta);
    assert.match(codigo, /\{T\.mostrar\}/, ruta);
  }
});

test('TEST-PG-014 · Registros lee las notas aparte, con el período de las sesiones, y la fila dice «Con nota» sin color de alarma', () => {
  const codigo = leer('src/app/pro/advisees/training/ejecuciones.tsx');
  assert.match(codigo, /api\.notasDeLasSesiones\(token, asesoradoId, \{ periodStart: desde, periodEnd: hasta \}\)/);
  assert.match(codigo, /\$\{contexto\.period\.start\}\|\$\{contexto\.period\.end\}/);
  const fila = codigo.slice(codigo.indexOf('{conNota ? ('), codigo.indexOf(') : null}', codigo.indexOf('{conNota ? (')));
  assert.match(fila, /className="etiqueta-de-dato"/);
  assert.doesNotMatch(fila, /--(alerta|error|aviso|acento)/);
});
