// WP-ENTORNO-DEL-TUTOR (DL-184) · las guardias de la carga, aparte para poder probarlas sin base ni API. Corren antes de
// cualquier lectura o escritura: el destino (la base y la API tienen que ser del mismo ambiente), la confirmación de test,
// el secreto de las contraseñas, la generación y las opciones.
//
// Ningún mensaje de error repite la URL de la base: lleva la contraseña. Por eso `new URL` va dentro de un try: el
// TypeError de Node trae la entrada entera en `input` y la terminal la mostraría.

/** La API del ambiente test (render.yaml, be-api). La de cada otro destino se rechaza. */
export const API_DE_TEST = 'https://be-api-hndp.onrender.com';
const LOCALES = ['localhost', '127.0.0.1'];
const OPCIONES = ['origen', 'hasta', 'generacion'];

function url(texto, variable) {
  try {
    return new URL(texto);
  } catch {
    throw new Error(`Guardia: ${variable} no es una URL válida (no se muestra: puede llevar una contraseña).`);
  }
}

/** El destino de la carga, desde las variables de entorno; lanza si algo no cierra. */
export function destinoDesde(env) {
  const nombre = env.BE_TUTOR_DESTINO;
  const api = env.BE_TUTOR_API;
  const base = env.BE_TUTOR_BASE;
  if (!['local', 'test'].includes(nombre)) throw new Error('BE_TUTOR_DESTINO tiene que ser local o test.');
  if (!api || !base) throw new Error('Faltan BE_TUTOR_API y BE_TUTOR_BASE.');
  const u = url(base, 'BE_TUTOR_BASE');
  const a = url(api, 'BE_TUTOR_API');
  if (!['postgres:', 'postgresql:'].includes(u.protocol)) throw new Error('Guardia: BE_TUTOR_BASE tiene que ser una URL de PostgreSQL.');
  // Un parámetro como `host` cambia el servidor al que se conecta de verdad: solo se acepta sslmode.
  for (const k of u.searchParams.keys()) if (k !== 'sslmode') throw new Error(`Guardia: BE_TUTOR_BASE no puede llevar el parámetro ${k}.`);
  if (a.username || a.password || a.search || a.hash || !['/', ''].includes(a.pathname)) throw new Error('Guardia: BE_TUTOR_API tiene que ser solo el origen de la API (sin ruta ni parámetros).');
  if (nombre === 'local') {
    if (!LOCALES.includes(u.hostname) || !/^\/be_test_[a-z0-9_]+$/.test(u.pathname)) throw new Error('Guardia: en local, solo una base be_test_* de localhost.');
    // La API también: si no, las cuentas se crearían en otro ambiente sin la confirmación de test.
    if (!LOCALES.includes(a.hostname) || !['http:', 'https:'].includes(a.protocol)) throw new Error('Guardia: en local, la API tiene que ser la de localhost.');
  }
  if (nombre === 'test') {
    if (!/\.render\.com$/.test(u.hostname) || u.pathname !== '/be_test') throw new Error('Guardia: en test, solo la base be_test de Render.');
    if (a.origin !== API_DE_TEST) throw new Error(`Guardia: en test, la API tiene que ser ${API_DE_TEST}.`);
    if (env.BE_TUTOR_CONFIRMO_TEST !== 'si') throw new Error('Para cargar en test hace falta BE_TUTOR_CONFIRMO_TEST=si.');
    u.searchParams.set('sslmode', 'require');
  }
  const clave = env.BE_TUTOR_CLAVE ?? '';
  if (clave.length < 24) throw new Error('BE_TUTOR_CLAVE tiene que tener 24 caracteres o más.');
  return { nombre, api: a.origin, base: u.href, clave };
}

/** Las opciones `--clave valor` de la línea de comandos; una desconocida (o mal escrita) frena todo. */
export function opcionesDesde(argumentos) {
  const opciones = Object.fromEntries(argumentos.join(' ').split(/\s*--/).filter(Boolean).map((x) => x.trim().split(/\s+/)));
  for (const k of Object.keys(opciones)) if (!OPCIONES.includes(k)) throw new Error(`Opción desconocida: --${k} (van ${OPCIONES.map((x) => `--${x}`).join(', ')}).`);
  for (const k of ['origen', 'hasta']) if (k in opciones && !/^\d{4}-\d{2}-\d{2}$/.test(opciones[k] ?? '')) throw new Error(`--${k} va con una fecha AAAA-MM-DD.`);
  return opciones;
}

/** La generación: un entero de 1 a 999 (es parte de los correos y de los ids de la muestra). */
export function generacionDesde(valor) {
  if (valor === undefined) return 1;
  if (!/^[1-9]\d{0,2}$/.test(String(valor))) throw new Error('--generacion va con un entero de 1 a 999.');
  return Number(valor);
}
