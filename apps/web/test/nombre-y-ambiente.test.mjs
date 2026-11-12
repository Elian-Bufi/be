/**
 * WP-USO-FINAL en el website (DL-169) · UF-01, el nombre obligatorio, y UF-08, lo que dice el ambiente. Sin React:
 *  1. TEST-UF-001/002 · el campo «Nombre y apellido» se valida con la regla de la API, y un 422 del nombre vuelve al campo;
 *     el alta con correo lo pide arriba del correo y lo manda; el alta con Google lo trae propuesto y lo manda;
 *  2. TEST-UF-005 · «Antes de seguir»: qué se muestra según API-ACC-07 (`pasoQueSigue`) y qué se hace con lo que
 *     respondió API-ACC-06 (`alGuardarElNombre`, `yaSeGuardo`); la compuerta envuelve a `/account` y a `/pro`, y no a
 *     `/admin`; en Cuenta el nombre se cambia, pero no se quita (UF-D3);
 *  3. TEST-UF-012 (la mitad del website) · el ambiente del build y el interruptor llegan de `next.config.mjs`; los avisos
 *     de prueba se muestran según la regla del dominio, y ningún archivo del website los escribe por su cuenta.
 *
 * Uso: npm run test -w @be/web (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const N = await import('../src/lib/nombre-y-apellido.ts');
const { AVISOS_DE_PRUEBA, COPY, DESCARGAR_LA_APP, MENSAJE_DE_CAMPO } = await import('@be/domain');

const WEB = fileURLToPath(new URL('..', import.meta.url));
const leer = (ruta) => readFileSync(join(WEB, ruta), 'utf8');
const nombre = (ruta) => relative(WEB, ruta).replace(/\\/g, '/');

/** Todos los archivos de código del website. */
function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : /\.(tsx?|mjs|css)$/.test(n) ? [ruta] : [];
  });
}
const FUENTES = archivos(join(WEB, 'src'));

let caso = 0;
/** Evalúa un módulo con estas variables de entorno y deja el entorno como estaba. */
async function conEntorno(archivo, variables) {
  const antes = Object.fromEntries(Object.keys(variables).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(variables)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    // Una URL distinta por caso: el módulo se vuelve a evaluar con el entorno de ese caso.
    return await import(`${new URL(archivo, import.meta.url).href}?caso=${++caso}`);
  } finally {
    for (const [k, v] of Object.entries(antes)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const REQUERIDO = MENSAJE_DE_CAMPO.DISPLAY_NAME_REQUIRED;
const INVALIDO = MENSAJE_DE_CAMPO.INVALID_DISPLAY_NAME;
const issue = (code, path = 'profile.displayName') => ({ code, path });
const api = (status, codigo, issues = []) => ({ ok: false, tipo: 'API', status, codigo, issues });
const RED = { ok: false, tipo: 'RED' };
const pasos = (...steps) => ({ ok: true, datos: { data: { steps } } });
const perfil = (displayName, version = 'v2') => ({ displayName, version, updatedAt: '2026-11-11T12:00:00.000Z' });

// ─── 1 · El campo «Nombre y apellido» ────────────────────────────────────────────────────────────────────────────────

test('TEST-UF-001 · el nombre se valida con la regla de la API: vacío falta; largo o con invisibles no se puede guardar', () => {
  assert.equal(N.errorDelNombre(''), REQUERIDO);
  assert.equal(N.errorDelNombre('   \t '), REQUERIDO, 'solo espacios es lo mismo que nada');
  assert.equal(N.errorDelNombre('a'.repeat(61)), INVALIDO);
  assert.equal(N.errorDelNombre('Ana​Paula'), INVALIDO, 'un carácter invisible');
  assert.equal(N.errorDelNombre('​'), INVALIDO);
  assert.equal(N.errorDelNombre('a'.repeat(60)), null, 'hasta 60 caracteres');
  assert.equal(N.errorDelNombre('  Persona   Sintética  '), null, 'los espacios de más los quita la API al guardar');
  assert.ok(REQUERIDO && INVALIDO && REQUERIDO !== INVALIDO, 'dos mensajes distintos, del dominio');
});

test('TEST-UF-001 · un 422 del nombre vuelve al campo con su mensaje; otro issue no es del nombre', () => {
  assert.equal(N.mensajeDelNombreEn([issue('DISPLAY_NAME_REQUIRED')]), REQUERIDO);
  assert.equal(N.mensajeDelNombreEn([issue('ADULT_DECLARATION_REQUIRED', 'adultDeclaration'), issue('INVALID_DISPLAY_NAME')]), INVALIDO);
  assert.equal(N.mensajeDelNombreEn([issue('ADULT_DECLARATION_REQUIRED', 'adultDeclaration')]), null);
  assert.equal(N.mensajeDelNombreEn([]), null);
});

test('TEST-UF-001/002 · el alta con correo pide el nombre arriba del correo y lo manda; la de Google lo trae propuesto y lo manda', () => {
  const alta = leer('src/app/register/formulario-de-registro.tsx');
  const campo = alta.indexOf('<CampoDeNombreYApellido');
  assert.ok(campo > 0 && campo < alta.indexOf('id="correo"'), 'el nombre va arriba del correo');
  assert.match(alta, /api\.registrar\(\{[^}]*\bnombre\b[^}]*\}/, 'el alta manda el nombre');
  assert.match(alta, /const delNombre = errorDelNombre\(nombre\)/, 'sin nombre, el formulario no se envía');
  assert.match(alta, /mensajeDelNombreEn\(r\.issues\)/, 'el 422 del nombre vuelve a su campo');

  const google = leer('src/components/acceso-con-google.tsx');
  assert.match(google, /nombre: paso\.nombre/, 'el paso CREAR conserva el nombre que propuso la API');
  assert.match(google, /useState\(propuesto \?\? ''\)/, 'el campo llega con el nombre de la cuenta de Google');
  assert.match(google, /propuesto \? COPY_DEL_NOMBRE\.ayudaConGoogle : COPY_DEL_NOMBRE\.ayuda/);
  assert.match(google, /registrarConGoogle\(idToken, marcados\.mayoria, nombre\)/);
  assert.match(google, /paso\.campo === 'nombre' \? \{ nombre: paso\.mensaje \}/, 'un CAMPO del nombre vuelve al nombre, no a la mayoría de edad');

  const campoDelNombre = leer('src/components/nombre-y-apellido.tsx');
  assert.match(campoDelNombre, /etiqueta=\{COPY_DEL_NOMBRE\.etiqueta\}/);
  assert.match(campoDelNombre, /autoComplete="name"/);
});

// ─── 2 · «Antes de seguir» ───────────────────────────────────────────────────────────────────────────────────────────

test('TEST-UF-005 · sin pasos sigue la página; con el nombre, el paso, con el nombre profesional propuesto si lo hay', () => {
  assert.deepEqual(N.pasoQueSigue(pasos()), { tipo: 'seguir' });
  assert.deepEqual(N.pasoQueSigue(pasos({ step: 'DISPLAY_NAME', suggestion: null })), { tipo: 'nombre', sugerencia: null });
  assert.deepEqual(N.pasoQueSigue(pasos({ step: 'DISPLAY_NAME', suggestion: 'Lic. Persona Sintética' })), { tipo: 'nombre', sugerencia: 'Lic. Persona Sintética' });
  assert.deepEqual(N.pasoQueSigue(pasos({ step: 'DISPLAY_NAME', suggestion: '  ' })), { tipo: 'nombre', sugerencia: null }, 'una propuesta en blanco no es propuesta');
});

test('TEST-UF-005 · un paso que el website no conoce no se saltea, aunque venga con uno que sí', () => {
  assert.deepEqual(N.pasoQueSigue(pasos({ step: 'TERMS_VERSION', suggestion: null })), { tipo: 'desconocido' });
  assert.deepEqual(N.pasoQueSigue(pasos({ step: 'DISPLAY_NAME', suggestion: null }, { step: 'EMAIL_VERIFICATION', suggestion: null })), { tipo: 'desconocido' });
  assert.deepEqual(N.pasoQueSigue(pasos({ step: 'EMAIL_VERIFICATION', suggestion: null }, { step: 'DISPLAY_NAME', suggestion: null })), { tipo: 'desconocido' });
});

test('TEST-UF-005 · sin respuesta no se deja pasar: se reintenta; una sesión que ya no sirve vuelve a Iniciar sesión', () => {
  for (const sin of [RED, api(503, 'SERVICE_UNAVAILABLE'), api(500, 'INTERNAL_ERROR'), api(429, 'RATE_LIMITED'), api(200, 'RESPUESTA_NO_RECONOCIDA'), api(404, 'NOT_FOUND')]) {
    assert.deepEqual(N.pasoQueSigue(sin), { tipo: 'sin-respuesta' }, JSON.stringify(sin));
  }
  for (const codigo of ['AUTHENTICATION_REQUIRED', 'SESSION_INVALID', 'SESSION_EXPIRED', 'SESSION_REVOKED']) {
    assert.deepEqual(N.pasoQueSigue(api(401, codigo)), { tipo: 'sesion' }, codigo);
  }
});

test('TEST-UF-005 · al guardar: sigue con 200; 409 se vuelve a leer; 422 al campo; sin respuesta se dice y se reintenta', () => {
  assert.deepEqual(N.alGuardarElNombre({ ok: true, datos: { data: perfil('Persona Sintética') } }), { tipo: 'guardado' });
  assert.deepEqual(N.alGuardarElNombre(api(409, 'VERSION_CONFLICT')), { tipo: 'releer' });
  assert.deepEqual(N.alGuardarElNombre(api(422, 'INVALID_PROFILE_DATA', [issue('DISPLAY_NAME_REQUIRED', 'changes.displayName')])), { tipo: 'campo', mensaje: REQUERIDO });
  assert.deepEqual(N.alGuardarElNombre(api(422, 'INVALID_PROFILE_DATA', [issue('INVALID_DISPLAY_NAME', 'changes.displayName')])), { tipo: 'campo', mensaje: INVALIDO });
  assert.deepEqual(N.alGuardarElNombre(api(422, 'INVALID_PROFILE_DATA')), { tipo: 'campo', mensaje: INVALIDO }, 'sin issue, igual es del nombre: es lo único que cambia');
  assert.deepEqual(N.alGuardarElNombre(RED), { tipo: 'aviso', mensaje: COPY.resultadoIncierto });
  assert.deepEqual(N.alGuardarElNombre(api(200, 'RESPUESTA_NO_RECONOCIDA')), { tipo: 'aviso', mensaje: COPY.resultadoIncierto });
  assert.deepEqual(N.alGuardarElNombre(api(401, 'SESSION_REVOKED')), { tipo: 'sesion' });
  assert.deepEqual(N.alGuardarElNombre(api(429, 'RATE_LIMITED')), { tipo: 'aviso', mensaje: COPY.demasiadosIntentos });
  assert.deepEqual(N.alGuardarElNombre(api(503, 'SERVICE_UNAVAILABLE')), { tipo: 'aviso', mensaje: COPY.noDisponible });
});

test('TEST-UF-005 · después de un 409, si lo leído es lo que se quería guardar, el intento sin respuesta se guardó', () => {
  assert.equal(N.yaSeGuardo(perfil('Persona Sintética'), '  Persona   Sintética '), true, 'con la normalización de la API');
  assert.equal(N.yaSeGuardo(perfil('Otra Persona'), 'Persona Sintética'), false, 'lo cambiaron en otro lugar: se revisa');
  assert.equal(N.yaSeGuardo(perfil(null, 'v0'), 'Persona Sintética'), false);
});

test('TEST-UF-005 · la compuerta envuelve a /account y a /pro, pregunta API-ACC-07 y no está en /admin', () => {
  for (const layout of ['src/app/account/layout.tsx', 'src/app/pro/layout.tsx']) {
    // UF-11 (DL-169): en /pro la página va, además, adentro del segundo factor del profesional; «Antes de seguir» sigue
    // envolviendo todo.
    assert.match(leer(layout), /<AntesDeSeguir espacio="(cuenta|pro)">\s*(\{children\}|<SegundoFactorDelProfesional>\{children\}<\/SegundoFactorDelProfesional>)\s*<\/AntesDeSeguir>/, layout);
  }
  const compuerta = leer('src/components/antes-de-seguir.tsx');
  assert.match(compuerta, /api\.loQueFaltaParaSeguir\(token\)/);
  assert.match(compuerta, /pasoQueSigue\(r\)/);
  assert.match(compuerta, /COPY_DEL_NOMBRE\.salir/, '«Cerrar sesión» está en el paso');
  const enAdmin = archivos(join(WEB, 'src/app/admin')).filter((r) => readFileSync(r, 'utf8').includes('AntesDeSeguir'));
  assert.deepEqual(enAdmin.map(nombre), [], 'la consola usa otra identidad');
  const usan = FUENTES.filter((r) => /<AntesDeSeguir\b/.test(readFileSync(r, 'utf8'))).map(nombre).sort();
  assert.deepEqual(usan, ['src/app/account/layout.tsx', 'src/app/pro/layout.tsx'], 'un solo lugar por espacio: el layout');
});

test('UF-D3 · en Cuenta el nombre se cambia, pero no se quita', () => {
  const cuenta = leer('src/app/account/cuenta.tsx');
  assert.doesNotMatch(cuenta, /Quitar|Quitaste|quitás/);
  assert.doesNotMatch(cuenta, /displayName: null/, 'nadie manda el nombre en null');
  assert.match(cuenta, /const problema = errorDelNombre\(escrito\)/, 'vacío, el campo dice que falta');
  assert.match(cuenta, /ayuda=\{COPY_DEL_NOMBRE\.noSeQuita\}/);
});

// ─── 3 · Lo que dice el ambiente (TEST-UF-012, la mitad del website) ────────────────────────────────────────────────

const SIN_RENDER = { RENDER: undefined, BE_GOOGLE_WEB_CLIENT_ID: undefined };

test('TEST-UF-012 · next.config: sin BE_AMBIENTE, `development` con next dev y `test` en otro build; el interruptor va tal cual', async () => {
  const build = (await conEntorno('../next.config.mjs', { ...SIN_RENDER, NODE_ENV: undefined, BE_AMBIENTE: undefined, BE_AVISOS_DE_PRUEBA: undefined })).default;
  assert.equal(build.env.BE_AMBIENTE, 'test', 'Render no la define hoy, y test es el único ambiente');
  assert.equal(build.env.BE_AVISOS_DE_PRUEBA, '');
  const dev = (await conEntorno('../next.config.mjs', { ...SIN_RENDER, NODE_ENV: 'development', BE_AMBIENTE: undefined, BE_AVISOS_DE_PRUEBA: undefined })).default;
  assert.equal(dev.env.BE_AMBIENTE, 'development');
  const prod = (await conEntorno('../next.config.mjs', { ...SIN_RENDER, NODE_ENV: 'production', BE_AMBIENTE: 'production', BE_AVISOS_DE_PRUEBA: ' No ' })).default;
  assert.equal(prod.env.BE_AMBIENTE, 'production');
  assert.equal(prod.env.BE_AVISOS_DE_PRUEBA, ' No ', 'tal cual: la regla del dominio lo lee');
});

test('TEST-UF-012 · los avisos se ven según la regla: en producción nunca; en test, salvo con el interruptor en «no»', async () => {
  const visibles = async (BE_AMBIENTE, BE_AVISOS_DE_PRUEBA) => (await conEntorno('../src/lib/ambiente.ts', { BE_AMBIENTE, BE_AVISOS_DE_PRUEBA })).AVISOS_DE_PRUEBA_VISIBLES;
  assert.equal(await visibles('production', undefined), false);
  assert.equal(await visibles('production', 'si'), false, 'el interruptor no los prende en producción');
  assert.equal(await visibles('test', undefined), true);
  assert.equal(await visibles('test', 'no'), false);
  assert.equal(await visibles('test', ' NO '), false);
  assert.equal(await visibles('development', undefined), true);
  assert.equal(await visibles('otro', undefined), true, 'un ambiente desconocido los muestra');
});

test('TEST-UF-012 · ningún archivo del website escribe un aviso de prueba por su cuenta, y cada uno pasa por la regla', () => {
  assert.ok(FUENTES.length > 100, `se esperaban los archivos del website y hay ${FUENTES.length}`);
  const PROHIBIDOS = [/ambiente de prueba/i, /correo inventado/i, /cuenta de google de prueba/i, /apk de prueba/i];
  const escritos = FUENTES.flatMap((r) => {
    const texto = readFileSync(r, 'utf8');
    return PROHIBIDOS.filter((p) => p.test(texto)).map((p) => `${nombre(r)} · ${p}`);
  });
  assert.deepEqual(escritos, [], 'los textos viven solo en AVISOS_DE_PRUEBA del dominio');
  // Los textos del dominio son los que la prueba busca: si cambian, la búsqueda se revisa.
  assert.ok(Object.values(AVISOS_DE_PRUEBA).every((t) => PROHIBIDOS.some((p) => p.test(t))));

  // Cada uso de un aviso está en la rama de AVISOS_DE_PRUEBA_VISIBLES, a pocos caracteres. Importarlo no es usarlo.
  const USO = /AVISOS_DE_PRUEBA\.(franja|general|registro|google|descargarLaApk)\b|\.avisoDePrueba\b|\bDESCARGAR_LA_APP\b/g;
  const sinLaRegla = [];
  const conAvisos = [];
  for (const r of FUENTES) {
    const texto = readFileSync(r, 'utf8').replace(/^import\s[^;]*;/gm, '');
    const usos = [...texto.matchAll(USO)];
    if (usos.length === 0) continue;
    conAvisos.push(nombre(r));
    for (const u of usos) {
      if (!texto.slice(Math.max(0, u.index - 160), u.index).includes('AVISOS_DE_PRUEBA_VISIBLES ?')) sinLaRegla.push(`${nombre(r)} · ${u[0]}`);
    }
  }
  assert.deepEqual(sinLaRegla, []);
  for (const esperado of ['src/components/pie.tsx', 'src/app/register/formulario-de-registro.tsx', 'src/components/acceso-con-google.tsx', 'src/app/page.tsx']) {
    assert.ok(conAvisos.includes(esperado), `${esperado} muestra su aviso de prueba`);
  }
  assert.ok(DESCARGAR_LA_APP && !/prueba/i.test(DESCARGAR_LA_APP), 'sin los avisos, el botón dice otra cosa');

  // La regla se evalúa en un solo lugar del website.
  const evaluan = FUENTES.filter((r) => /muestraLosAvisosDePrueba\(|AVISOS_DE_PRUEBA_VISIBLES =/.test(readFileSync(r, 'utf8'))).map(nombre);
  assert.deepEqual(evaluan, ['src/lib/ambiente.ts']);
});

test('TEST-UF-012 · sin el aviso del alta, el formulario no queda descrito por un aviso que no está', () => {
  const alta = leer('src/app/register/formulario-de-registro.tsx');
  assert.doesNotMatch(alta, /aria-describedby="registro-aviso"/);
  assert.match(alta, /aria-describedby=\{AVISOS_DE_PRUEBA_VISIBLES \? 'registro-aviso' : undefined\}/);
  const aviso = alta.indexOf('id="registro-aviso"');
  assert.ok(alta.slice(aviso - 80, aviso).includes('AVISOS_DE_PRUEBA_VISIBLES ?'), 'el aviso está solo con la regla');
});
