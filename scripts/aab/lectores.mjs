/**
 * Lectores de la salida de las herramientas de Android (bundletool, aapt2, apksigner): funciones puras, que no leen
 * archivos ni corren nada, para poder probarlas con salidas copiadas de las reales. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS
 * (2026-11-02, con apk-desde-aab.mjs). Lo prueba scripts/aab/verificar-aab.test.cjs.
 */

const sinRetornos = (t) => String(t ?? '').replace(/\r/g, '');
/** aapt2 imprime un booleano como `true` o, en salidas viejas, como `(type 0x12)0xffffffff`. */
const esVerdadero = (v) => v === 'true' || /0xffffffff$/i.test(String(v ?? ''));

/**
 * Los permisos que pide el manifiesto que imprime `bundletool dump manifest` (XML de texto), ordenados. Cuenta
 * `uses-permission` y `uses-permission-sdk-23` con `android:name` en cualquier lugar del elemento: bundletool ordena los
 * atributos y `android:maxSdkVersion` sale ANTES de `android:name`. Corrección del 2026-11-02: la expresión anterior
 * exigía `android:name` primero y contaba 8 de los 10 permisos del AAB 0.18.0-candidata.2.
 */
export function permisosDelManifiesto(xml) {
  return [...sinRetornos(xml).matchAll(/<uses-permission(?:-sdk-23)?\s[^>]*?android:name="([^"]+)"/g)].map((m) => m[1]).sort();
}

/**
 * `aapt2 dump badging <apk>` → { paquete, versionCode, versionName, minSdk, targetSdk, permisos, abis }. Los permisos
 * son los `uses-permission` (y `-sdk-23`), no los `uses-implied-permission`; permisos y ABI, ordenados.
 */
export function leerBadging(texto) {
  const t = sinRetornos(texto);
  const paquete = /^package: (.*)$/m.exec(t)?.[1] ?? '';
  const campo = (nombre) => new RegExp(`\\b${nombre}='([^']*)'`).exec(paquete)?.[1] ?? null;
  const sdk = (nombre) => {
    const v = new RegExp(`^${nombre}:'(\\d+)'`, 'm').exec(t)?.[1];
    return v === undefined ? null : Number(v);
  };
  const versionCode = campo('versionCode');
  return {
    paquete: campo('name'),
    versionCode: versionCode !== null && /^\d+$/.test(versionCode) ? Number(versionCode) : null,
    versionName: campo('versionName'),
    minSdk: sdk('minSdkVersion') ?? sdk('sdkVersion'),
    targetSdk: sdk('targetSdkVersion'),
    permisos: [...t.matchAll(/^uses-permission(?:-sdk-23)?: name='([^']+)'/gm)].map((m) => m[1]).sort(),
    abis: ((/^native-code: (.*)$/m.exec(t)?.[1] ?? '').match(/'[^']+'/g) ?? []).map((s) => s.slice(1, -1)).sort(),
  };
}

/**
 * `aapt2 dump xmltree --file AndroidManifest.xml <apk>` → árbol { elemento, atributos, hijos }. Cada línea `E:` es un
 * elemento y cada `A:` un atributo del elemento con menos sangría que tenga encima; el nombre del atributo queda sin
 * espacio de nombres ni identificador (`android:autoVerify(0x010104ee)` → `autoVerify`) y el valor, sin comillas ni el
 * `(Raw: …)`.
 */
export function leerXmltree(texto) {
  const raiz = { elemento: null, atributos: {}, hijos: [] };
  const pila = [{ sangria: -1, nodo: raiz }];
  for (const linea of sinRetornos(texto).split('\n')) {
    const m = /^(\s*)([ENA]): (.*)$/.exec(linea);
    if (!m || m[2] === 'N') continue;
    const sangria = m[1].length;
    while (pila.length > 1 && pila[pila.length - 1].sangria >= sangria) pila.pop();
    const padre = pila[pila.length - 1].nodo;
    if (m[2] === 'E') {
      const nodo = { elemento: /^(\S+)/.exec(m[3])?.[1] ?? '', atributos: {}, hijos: [] };
      padre.hijos.push(nodo);
      pila.push({ sangria, nodo });
      continue;
    }
    const igual = m[3].indexOf('=');
    if (igual < 0) continue;
    const nombre = m[3].slice(0, igual).replace(/\(0x[0-9a-f]+\)$/i, '').split(':').pop();
    const crudo = m[3].slice(igual + 1);
    const cadena = /^"((?:[^"\\]|\\.)*)"/.exec(crudo);
    padre.atributos[nombre] = cadena ? cadena[1] : crudo.trim();
  }
  return raiz;
}

/**
 * Del manifiesto (salida de `aapt2 dump xmltree`): los intent-filter con sus esquemas, hosts y prefijos (juntando todos
 * sus `data`, como hace Android) y si piden `autoVerify`; los esquemas de todos los intent-filter (no los de `queries`,
 * que solo declaran qué apps puede ver la app) y los nombres de los `meta-data`.
 */
export function enlacesDelManifiesto(texto) {
  const filtros = [];
  const metaDatos = new Set();
  const recorrer = (nodo) => {
    if (nodo.elemento === 'intent-filter') {
      const datos = nodo.hijos.filter((h) => h.elemento === 'data').map((h) => h.atributos);
      const lista = (clave) => [...new Set(datos.map((d) => d[clave]).filter((v) => typeof v === 'string'))].sort();
      filtros.push({ autoVerify: esVerdadero(nodo.atributos.autoVerify), esquemas: lista('scheme'), hosts: lista('host'), prefijos: lista('pathPrefix') });
    }
    if (nodo.elemento === 'meta-data' && typeof nodo.atributos.name === 'string') metaDatos.add(nodo.atributos.name);
    for (const hijo of nodo.hijos) recorrer(hijo);
  };
  recorrer(leerXmltree(texto));
  return { filtros, esquemas: [...new Set(filtros.flatMap((f) => f.esquemas))].sort(), metaDatos: [...metaDatos].sort() };
}

/**
 * `apksigner verify -v --print-certs` (y su código de salida) → { verifica, esquemas: { v1, v2, v3, 'v3.1', v4 },
 * firmantes, sha256: [...], sha1: [...], avisos }. Un esquema que apksigner no informa queda en null (no se afirma).
 */
export function leerVerificacionApksigner(texto, codigo) {
  const t = sinRetornos(texto);
  const esquema = (v) => {
    const m = new RegExp(`^Verified using ${v.replace('.', '\\.')} scheme \\([^)]*\\): (true|false)$`, 'm').exec(t);
    return m ? m[1] === 'true' : null;
  };
  const firmantes = /^Number of signers: (\d+)$/m.exec(t)?.[1];
  return {
    verifica: codigo === 0 && /^Verifies$/m.test(t) && !/DOES NOT VERIFY/.test(t),
    esquemas: { v1: esquema('v1'), v2: esquema('v2'), v3: esquema('v3'), 'v3.1': esquema('v3.1'), v4: esquema('v4') },
    firmantes: firmantes === undefined ? null : Number(firmantes),
    sha256: [...t.matchAll(/^Signer #\d+ certificate SHA-256 digest: ([0-9a-f]{64})$/gim)].map((m) => m[1].toLowerCase()),
    sha1: [...t.matchAll(/^Signer #\d+ certificate SHA-1 digest: ([0-9a-f]{40})$/gim)].map((m) => m[1].toLowerCase()),
    avisos: (t.match(/^WARNING:/gm) ?? []).length,
  };
}

/**
 * El valor por omisión (configuración `()`) de un recurso de texto en `aapt2 dump resources <apk>`, o null si no está.
 * Sirve para los recursos de Firebase (project_id, google_app_id…); quien llama decide qué imprimir de ese valor.
 */
export function leerRecursoDeTexto(volcado, nombre) {
  if (!/^[A-Za-z0-9_]+$/.test(nombre)) throw new Error(`nombre de recurso inválido: ${nombre}`);
  const lineas = sinRetornos(volcado).split('\n');
  const inicio = lineas.findIndex((l) => new RegExp(`^\\s*resource 0x[0-9a-f]+ string/${nombre}(\\s|$)`, 'i').test(l));
  if (inicio < 0) return null;
  for (let i = inicio + 1; i < lineas.length && !/^\s*(resource|type) /.test(lineas[i]); i++) {
    const m = /^\s*\(\)\s+"((?:[^"\\]|\\.)*)"/.exec(lineas[i]);
    if (m) return m[1];
  }
  return null;
}
