/**
 * WP-01 §2 · la auditoría de dependencias de producción de la API, el website y la APK: falla con cualquier aviso de
 * severidad alta o crítica, salvo las excepciones declaradas en `EXCEPCIONES`. Cada excepción dice el aviso, el paquete,
 * por qué el riesgo queda acotado en BE y cuándo vence; una excepción vencida vuelve a hacer fallar la auditoría
 * (DL-114).
 *
 * Antes era `npm audit --omit=dev --audit-level=high` por espacio de trabajo, que no admite excepciones: un aviso sin
 * versión corregida en una herramienta de construcción bloqueaba toda integración.
 *
 * Una excepción con `procedencia` vale solo si en cada corrida se demuestra que el aviso corresponde exclusivamente a la
 * cadena declarada (propuesta del 2026-10-24 en DL-114):
 *   - npm encuentra vulnerable solo la copia declarada, y el lockfile dice que es la versión que se comprobó;
 *   - en producción, esa copia la usa solo el primer eslabón de la cadena, cada eslabón lo usa solo el siguiente, y el
 *     espacio de trabajo pide el último;
 *   - con `fueraDelBundle: 'android'`, el bundle de Android, construido como lo construye Gradle (`expo export:embed`), no
 *     tiene ningún módulo de esa copia ni de otra copia del paquete que el aviso abarque.
 * Si aparece otra ruta, el aviso bloquea como cualquier otro (1). Si algo de eso no se puede comprobar (falta el lockfile,
 * npm no dice qué copias encontró, el bundle no se pudo construir), la auditoría no aprueba (2).
 *
 * Un informe que no se puede leer **nunca aprueba**: si `npm audit` no pudo auditar (por ejemplo, `ENOAUDIT` con el
 * servicio de avisos caído), si la salida no es JSON o si el informe está incompleto, la auditoría falla con otro código
 * que el de las vulnerabilidades, para que no se confundan:
 *   0 · sin avisos altos ni críticos fuera de las excepciones vigentes;
 *   1 · hay avisos altos o críticos sin excepción, una excepción vencida o una ruta que la excepción no cubre;
 *   2 · la auditoría no se pudo hacer: error de npm, salida que no es JSON, informe incompleto o procedencia sin comprobar.
 *
 * Uso: `npm run audit:prod` (desde la raíz, con las dependencias instaladas; construye el dominio, que el bundle
 * necesita). `evaluarSalida` es la lógica completa, de la salida de npm al código; se prueba en
 * `auditoria-de-dependencias.test.cjs`, y con npm de verdad en `auditoria-de-dependencias.escenarios.cjs`.
 */
const { execSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ESPACIOS = ['@be/api', '@be/web', '@be/mobile'];
const SEVERIDADES_QUE_FALLAN = new Set(['high', 'critical']);
const SEVERIDADES = ['info', 'low', 'moderate', 'high', 'critical'];
const CODIGO = { APRUEBA: 0, VULNERABILIDADES: 1, NO_SE_PUDO_AUDITAR: 2 };

/** Las excepciones vigentes. Cada una se revisa antes de su vencimiento, o antes si sale la corrección. */
const EXCEPCIONES = [
  {
    aviso: 'GHSA-86w9-cpqp-85rv',
    paquete: 'node-forge',
    motivo:
      'Sin versión corregida: el aviso abarca hasta la 1.4.0, la última publicada (actualizado el 2026-10-01), y la última @expo/code-signing-certificates (0.0.7) sigue dependiendo de ella. node-forge entra por la CLI de Expo, que lo usa para firmar manifiestos de expo-updates y para la firma de iOS: BE no configura ninguna de las dos, y node-forge no viaja en el bundle de la APK ni está en la API ni en el website. El riesgo es bajo y acotado a la cadena de construcción (la CI y la máquina que construye la APK), no nulo.',
    vence: '2026-10-31',
  },
  {
    aviso: 'GHSA-vfj7-8cjw-p6xm',
    paquete: 'braces',
    motivo:
      'Sin versión corregida: el aviso (CVE-2026-93687, agotamiento de la pila con patrones muy anidados) abarca hasta la 3.0.3, la última publicada (actualizado el 2026-10-02). braces entra por la CLI de Expo y por metro (expo → @expo/cli → @expo/metro-file-map → micromatch → braces), que lo usan al construir para expandir los patrones de archivos de la configuración, no datos de las personas. braces no viaja en el bundle de la APK ni está en la API ni en el website. El riesgo es bajo y acotado a la cadena de construcción (la CI y la máquina que construye la APK), no nulo.',
    vence: '2026-10-31',
  },
  {
    aviso: 'GHSA-mrhx-c7xc-m3w5',
    paquete: 'zod',
    // Solo en la APK: en la API y el website, zod se corrige (4.6.6) y el aviso tiene que seguir bloqueando.
    espacios: ['@be/mobile'],
    // Lo que se comprobó el 2026-10-24, y lo único que la excepción cubre: si algo de esto cambia, deja de valer.
    procedencia: {
      copia: { ubicacion: 'node_modules/zod', version: '3.25.76' },
      // De la copia hacia la APK: @be/mobile → expo → @expo/cli → zod.
      cadena: [
        { ubicacion: 'node_modules/@expo/cli', version: '57.0.25' },
        { ubicacion: 'node_modules/expo', version: '57.0.23' },
      ],
      fueraDelBundle: 'android',
    },
    motivo:
      'Sin versión 3.x corregida: el aviso (agotamiento de memoria al validar listas muy grandes; actualizado el 2026-10-23) abarca todo zod anterior a la 4.6.6, y la CLI de Expo (@expo/cli 57.0.25) exige zod ^3.25.76. Ese zod 3 está en la raíz (node_modules/zod): lo recibiría cualquier import de zod fuera de @be/domain. Por eso la excepción exige, en cada corrida, que en producción lo use solo la CLI de Expo y que el bundle de Android no tenga ningún módulo suyo. La CLI lo carga también al construir el bundle (export:embed, el paso de Gradle), para validar la definición de los complementos de DevTools que declaran los paquetes instalados, no datos de las personas. La APK valida con el zod 4.6.6 de @be/domain, corregido en el mismo cambio. El riesgo es bajo y acotado a la cadena de construcción (la CI y la máquina que construye la APK), no nulo.',
    vence: '2026-10-31',
  },
];

/** El identificador del aviso: `GHSA-…`, tomado de su URL. */
const idDelAviso = (via) => (typeof via.url === 'string' ? via.url.split('/').pop() : String(via.source));

// ─── El lockfile: quién usa cada copia instalada ──────────────────────────────────────────────────

/** Los campos de un paquete instalado que cuentan en producción. Las de desarrollo de un paquete instalado no se instalan. */
const CAMPOS_DE_PRODUCCION = ['dependencies', 'optionalDependencies', 'peerDependencies'];

/** El nombre de una ubicación del lockfile: `node_modules/@expo/cli` → `@expo/cli`; un espacio de trabajo, el suyo. */
function nombreDe(paquetes, ubicacion) {
  if (paquetes[ubicacion]?.name) return paquetes[ubicacion].name;
  const i = ubicacion.lastIndexOf('node_modules/');
  return i < 0 ? ubicacion : ubicacion.slice(i + 'node_modules/'.length);
}

/**
 * Dónde encuentra Node el paquete `nombre` pedido desde la ubicación `desde` (la misma búsqueda hacia arriba por las
 * carpetas `node_modules`, sobre las ubicaciones del lockfile). Un enlace (un espacio de trabajo) lleva a su carpeta.
 * Devuelve `null` si no está instalado.
 */
function resolverEnLockfile(paquetes, desde, nombre) {
  const partes = desde === '' ? [] : desde.split('/');
  for (let i = partes.length; i >= 0; i--) {
    if (i > 0 && partes[i - 1] === 'node_modules') continue;
    const base = partes.slice(0, i).join('/');
    const candidata = base ? `${base}/node_modules/${nombre}` : `node_modules/${nombre}`;
    const entrada = paquetes[candidata];
    if (entrada) return entrada.link ? entrada.resolved : candidata;
  }
  return null;
}

/** Las ubicaciones que usan la de `ubicacion`, separadas en producción y desarrollo (paquete marcado `dev` o arista de desarrollo). */
function usuariosDe(paquetes, ubicacion) {
  const produccion = new Set();
  const desarrollo = new Set();
  for (const [desde, entrada] of Object.entries(paquetes)) {
    if (entrada.link) continue;
    const campos = [...CAMPOS_DE_PRODUCCION, ...(desde.includes('node_modules/') ? [] : ['devDependencies'])];
    for (const campo of campos) {
      for (const nombre of Object.keys(entrada[campo] ?? {})) {
        if (resolverEnLockfile(paquetes, desde, nombre) !== ubicacion) continue;
        if (campo === 'devDependencies' || entrada.dev) desarrollo.add(desde);
        else produccion.add(desde);
      }
    }
  }
  for (const u of produccion) desarrollo.delete(u);
  return { produccion: [...produccion], desarrollo: [...desarrollo] };
}

/** La carpeta de un espacio de trabajo en el lockfile: `@be/mobile` → `apps/mobile`. */
function ubicacionDelEspacio(paquetes, espacio) {
  const enlace = paquetes[`node_modules/${espacio}`];
  if (enlace?.link && paquetes[enlace.resolved]) return enlace.resolved;
  const propia = Object.keys(paquetes).find((u) => !u.includes('node_modules/') && paquetes[u].name === espacio);
  return propia ?? null;
}

const describir = (paquetes, ubicacion) => {
  if (ubicacion === '') return 'la raíz del repositorio';
  const entrada = paquetes[ubicacion];
  const nombre = nombreDe(paquetes, ubicacion);
  if (!ubicacion.includes('node_modules/')) return entrada?.name ? `${ubicacion} (${entrada.name})` : `${ubicacion}${entrada?.version ? ` ${entrada.version}` : ''}`;
  return `${ubicacion} (${nombre}${entrada?.version ? ` ${entrada.version}` : ''})`;
};

/**
 * La parte de la procedencia que se comprueba en el lockfile: las copias que encontró npm, sus versiones y la cadena de
 * quién las usa en producción. Devuelve `{ estado: 'demostrada', detalle }`, `{ estado: 'otra-ruta', detalle }` o
 * `{ estado: 'sin-verificar', detalle }`.
 */
function procedenciaEnElLockfile(aviso, excepcion, espacio, lockfile) {
  const { copia, cadena } = excepcion.procedencia;
  const otraRuta = (detalle) => ({ estado: 'otra-ruta', detalle });
  const sinVerificar = (detalle) => ({ estado: 'sin-verificar', detalle });
  // Sin cadena no habría a quién exigirle que sea el único que usa la copia.
  if (!copia?.ubicacion || !copia.version || !Array.isArray(cadena) || cadena.length === 0) return sinVerificar('la excepción no declara la copia, su versión y la cadena que la usa');

  if (!Array.isArray(aviso.nodos) || aviso.nodos.length === 0) return sinVerificar('npm no dice qué copias encontró vulnerables');
  const otras = aviso.nodos.filter((n) => n !== copia.ubicacion);
  if (otras.length > 0) return otraRuta(`npm encontró otra copia vulnerable: ${otras.join(', ')}`);

  const paquetes = lockfile?.packages;
  if (!paquetes || typeof paquetes !== 'object') return sinVerificar('no se pudo leer package-lock.json');
  const entrada = paquetes[copia.ubicacion];
  if (!entrada) return sinVerificar(`${copia.ubicacion} no está en package-lock.json`);
  if (entrada.version !== copia.version) return otraRuta(`${copia.ubicacion} es la ${entrada.version}, no la ${copia.version} que se comprobó`);

  // Cada eslabón tiene que ser el único que, en producción, usa al anterior.
  let anterior = copia.ubicacion;
  const desarrollo = usuariosDe(paquetes, copia.ubicacion).desarrollo;
  for (const eslabon of cadena) {
    const e = paquetes[eslabon.ubicacion];
    if (!e) return sinVerificar(`${eslabon.ubicacion} no está en package-lock.json`);
    if (eslabon.version && e.version !== eslabon.version) return otraRuta(`${eslabon.ubicacion} es la ${e.version}, no la ${eslabon.version} que se comprobó`);
    const { produccion } = usuariosDe(paquetes, anterior);
    const ajenos = produccion.filter((u) => u !== eslabon.ubicacion);
    if (ajenos.length > 0) return otraRuta(`${ajenos.map((u) => describir(paquetes, u)).join(', ')} también ${ajenos.length > 1 ? 'usan' : 'usa'} ${anterior} en producción`);
    if (!produccion.includes(eslabon.ubicacion)) return otraRuta(`${eslabon.ubicacion} ya no usa ${anterior}`);
    anterior = eslabon.ubicacion;
  }
  // Y el espacio de trabajo pide el último eslabón (expo es una dependencia directa de la APK).
  const carpeta = ubicacionDelEspacio(paquetes, espacio);
  if (!carpeta) return sinVerificar(`${espacio} no está en package-lock.json`);
  if (!usuariosDe(paquetes, anterior).produccion.includes(carpeta)) return otraRuta(`${espacio} no pide ${anterior}: la cadena no es la declarada`);

  const eslabones = [copia.ubicacion, ...cadena.map((e) => e.ubicacion)].map((u, i) => (i === 0 ? `${u} ${paquetes[u].version}` : `${nombreDe(paquetes, u)} ${paquetes[u].version}`));
  const detalle = [`procedencia comprobada en package-lock.json: ${[...eslabones, espacio].join(' ← ')}`];
  if (desarrollo.length > 0) detalle.push(`en desarrollo también la usa ${desarrollo.map((u) => describir(paquetes, u)).join(', ')} (fuera de esta auditoría de producción)`);
  return { estado: 'demostrada', detalle };
}

// ─── El bundle de Android: qué copias viajan en la APK ────────────────────────────────────────────

/** Una ruta del mapa de fuentes, relativa a la raíz del repositorio y con barras `/`. Metro las da desde la raíz, con `/`. */
function rutaRelativa(fuente, raiz) {
  let ruta = fuente.split('\\').join('/');
  if (raiz) {
    const r = raiz.split('\\').join('/').replace(/\/+$/, '');
    if (ruta.toLowerCase().startsWith(`${r.toLowerCase()}/`)) ruta = ruta.slice(r.length + 1);
  }
  return ruta.replace(/^\/+/, '');
}

/** Las copias del paquete que tienen módulos en el bundle: ubicación en el repositorio → cantidad de módulos. */
function copiasEnElBundle(fuentes, paquete, raiz = null) {
  const marca = `node_modules/${paquete}/`;
  const copias = new Map();
  for (const fuente of fuentes) {
    if (typeof fuente !== 'string') continue;
    const ruta = rutaRelativa(fuente, raiz);
    const i = ruta.lastIndexOf(marca);
    if (i < 0 || (i > 0 && ruta[i - 1] !== '/')) continue;
    const ubicacion = ruta.slice(0, i + marca.length - 1);
    copias.set(ubicacion, (copias.get(ubicacion) ?? 0) + 1);
  }
  return copias;
}

/** `<4.6.6` → [4, 6, 6]. Otra forma de rango no se sabe comprobar. */
function versionCorregida(rango) {
  const m = /^<\s*(\d+)\.(\d+)\.(\d+)$/.exec(String(rango ?? '').trim());
  return m ? m.slice(1).map(Number) : null;
}

/** Si el aviso abarca la versión: anterior a la corregida (una versión previa de la corregida también). `null` si no se entiende. */
function abarcada(version, corregida) {
  const m = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.exec(String(version ?? ''));
  if (!m) return null;
  const v = m.slice(1, 4).map(Number);
  for (let i = 0; i < 3; i++) if (v[i] !== corregida[i]) return v[i] < corregida[i];
  return Boolean(m[4]);
}

/** La parte de la procedencia que se comprueba en el bundle de Android. Mismos estados que `procedenciaEnElLockfile`. */
function procedenciaEnElBundle(aviso, excepcion, contexto) {
  const { copia, fueraDelBundle } = excepcion.procedencia;
  const otraRuta = (detalle) => ({ estado: 'otra-ruta', detalle });
  const sinVerificar = (detalle) => ({ estado: 'sin-verificar', detalle });
  if (fueraDelBundle !== 'android') return sinVerificar(`no se sabe comprobar el bundle «${fueraDelBundle}»`);
  const corregida = versionCorregida(aviso.rango);
  if (!corregida) return sinVerificar(`el rango del aviso («${aviso.rango}») no tiene la forma «<X.Y.Z»`);

  let bundle;
  try {
    bundle = contexto?.modulosDelBundle?.();
  } catch (error) {
    return sinVerificar(`no se pudo construir el bundle de Android: ${String(error?.message ?? error).split('\n')[0]}`);
  }
  if (!bundle || !Array.isArray(bundle.fuentes) || bundle.fuentes.length === 0) return sinVerificar('el bundle de Android no trae la lista de sus módulos');
  const rutas = bundle.fuentes.filter((f) => typeof f === 'string').map((f) => rutaRelativa(f, contexto.raiz));
  if (!bundle.entrada || !rutas.includes(rutaRelativa(bundle.entrada, contexto.raiz))) return sinVerificar('el mapa no tiene la entrada de la APK: no es el bundle de la app');

  const paquetes = contexto.lockfile.packages;
  const copias = copiasEnElBundle(rutas, aviso.paquete);
  if (copias.has(copia.ubicacion)) return otraRuta(`el bundle de Android incluye ${copias.get(copia.ubicacion)} módulos de ${copia.ubicacion} (${copia.version}): la APK la usaría al ejecutarse`);
  const enElBundle = [];
  for (const [ubicacion, modulos] of copias) {
    const version = paquetes[ubicacion]?.version;
    if (!version) return sinVerificar(`${ubicacion} está en el bundle y no en package-lock.json`);
    const instalada = contexto.versionInstalada?.(ubicacion) ?? null;
    if (instalada !== version) return sinVerificar(`${ubicacion} instalada es la ${instalada ?? '(no se pudo leer)'} y package-lock.json dice ${version}: node_modules no corresponde al lockfile`);
    const vulnerable = abarcada(version, corregida);
    if (vulnerable === null) return sinVerificar(`no se entiende la versión ${version} de ${ubicacion}`);
    if (vulnerable) return otraRuta(`el bundle de Android incluye ${ubicacion} (${version}), que el aviso abarca`);
    enElBundle.push(`${ubicacion} ${version} (${modulos} módulos)`);
  }
  const resumen = enElBundle.length > 0 ? enElBundle.join(', ') : 'ninguna';
  return { estado: 'demostrada', detalle: [`bundle de Android (${rutas.length} módulos): ninguno de ${copia.ubicacion}; ${aviso.paquete} en el bundle: ${resumen}`] };
}

/** Toda la procedencia: primero el lockfile, que es barato; el bundle se construye solo si el lockfile la demuestra. */
function comprobarProcedencia(aviso, excepcion, espacio, contexto) {
  const enElLockfile = procedenciaEnElLockfile(aviso, excepcion, espacio, contexto?.lockfile);
  if (enElLockfile.estado !== 'demostrada' || !excepcion.procedencia.fueraDelBundle) return enElLockfile;
  const enElBundle = procedenciaEnElBundle(aviso, excepcion, contexto);
  if (enElBundle.estado !== 'demostrada') return enElBundle;
  return { estado: 'demostrada', detalle: [...enElLockfile.detalle, ...enElBundle.detalle] };
}

// ─── Del informe de npm al resultado ──────────────────────────────────────────────────────────────

/**
 * Los avisos altos o críticos de un reporte de `npm audit --json`, separados en los que fallan, los exceptuados, las
 * excepciones vencidas y los que no se pudieron comprobar. `hoy` es una fecha `AAAA-MM-DD`. El reporte tiene que estar
 * validado (`validarInforme`). Una excepción con `espacios` vale solo en esos espacios de trabajo: en otro, el mismo aviso
 * bloquea. Una con `procedencia` necesita el `contexto` (lockfile y bundle): sin él, no se aplica.
 */
function clasificarAvisos(reporte, excepciones, hoy, espacio = null, contexto = null) {
  const avisos = new Map();
  for (const vulnerabilidad of Object.values(reporte.vulnerabilities)) {
    for (const via of vulnerabilidad.via ?? []) {
      // Un `via` de texto es un paquete intermedio: su aviso real aparece en la entrada de ese paquete.
      if (typeof via === 'string' || !SEVERIDADES_QUE_FALLAN.has(via.severity)) continue;
      const clave = `${idDelAviso(via)}|${via.name}`;
      const nodos = Array.isArray(vulnerabilidad.nodes) ? vulnerabilidad.nodes : null;
      const previo = avisos.get(clave);
      // Las copias instaladas que npm encontró vulnerables; si alguna entrada no las trae, no se sabe cuáles son.
      const todos = previo ? (previo.nodos && nodos ? [...new Set([...previo.nodos, ...nodos])] : null) : nodos;
      avisos.set(clave, { aviso: idDelAviso(via), paquete: via.name, titulo: via.title, severidad: via.severity, rango: via.range, nodos: todos });
    }
  }
  const fallan = [];
  const exceptuados = [];
  const vencidas = [];
  const sinVerificar = [];
  for (const a of avisos.values()) {
    const excepcion = excepciones.find((e) => e.aviso === a.aviso && e.paquete === a.paquete && (!e.espacios || (espacio !== null && e.espacios.includes(espacio))));
    if (!excepcion) fallan.push(a);
    else if (hoy > excepcion.vence) vencidas.push({ ...a, vence: excepcion.vence });
    else if (!excepcion.procedencia) exceptuados.push({ ...a, vence: excepcion.vence });
    else {
      const r = comprobarProcedencia(a, excepcion, espacio, contexto);
      if (r.estado === 'demostrada') exceptuados.push({ ...a, vence: excepcion.vence, procedencia: r.detalle });
      else if (r.estado === 'otra-ruta') fallan.push({ ...a, fueraDeLaExcepcion: r.detalle });
      else sinVerificar.push({ ...a, motivo: r.detalle });
    }
  }
  return { fallan, exceptuados, vencidas, sinVerificar };
}

/**
 * Lee la salida de `npm audit --json` y dice si es un informe completo. Devuelve `{ informe }` o `{ problema }`. Un
 * informe completo no trae `error`, tiene `vulnerabilities` y los conteos de `metadata.vulnerabilities`, y si esos conteos
 * declaran algo alto o crítico, el informe tiene que traer al menos un aviso de esa severidad: si no, está recortado.
 */
function validarInforme(salida) {
  if (typeof salida !== 'string' || salida.trim() === '') return { problema: 'npm audit no devolvió nada' };
  let informe;
  try {
    informe = JSON.parse(salida);
  } catch {
    return { problema: 'la salida de npm audit no es JSON' };
  }
  if (informe === null || typeof informe !== 'object' || Array.isArray(informe)) return { problema: 'la salida de npm audit no es un informe' };
  if (informe.error) return { problema: `npm audit no pudo auditar: ${informe.error.code ?? 'sin código'} · ${informe.error.summary ?? 'sin detalle'}` };
  if (informe.vulnerabilities === null || typeof informe.vulnerabilities !== 'object') return { problema: 'el informe no trae «vulnerabilities»' };
  const conteos = informe.metadata?.vulnerabilities;
  if (!conteos || !SEVERIDADES.every((s) => Number.isInteger(conteos[s]))) return { problema: 'el informe no trae los conteos de «metadata.vulnerabilities»' };
  const declarados = conteos.high + conteos.critical;
  const conAviso = Object.values(informe.vulnerabilities).some((v) => (v.via ?? []).some((via) => typeof via === 'object' && SEVERIDADES_QUE_FALLAN.has(via.severity)));
  if (declarados > 0 && !conAviso) return { problema: `el informe declara ${declarados} paquetes altos o críticos pero no trae ningún aviso de esa severidad` };
  return { informe };
}

/** De la salida de npm al resultado de un espacio de trabajo: el código (`CODIGO`) y las líneas a mostrar. */
function evaluarSalida(espacio, salida, excepciones, hoy, contexto = null) {
  const { informe, problema } = validarInforme(salida);
  if (problema) return { codigo: CODIGO.NO_SE_PUDO_AUDITAR, lineas: [`✗ ${espacio}: la auditoría no se pudo hacer (${problema}); no se aprueba sin un informe válido`] };
  const { fallan, exceptuados, vencidas, sinVerificar } = clasificarAvisos(informe, excepciones, hoy, espacio, contexto);
  const lineas = [
    ...fallan.map((a) => `✗ ${espacio}: ${a.severidad} · ${a.paquete} · ${a.aviso} · ${a.fueraDeLaExcepcion ? `la excepción no cubre esta ruta: ${a.fueraDeLaExcepcion}` : a.titulo}`),
    ...vencidas.map((a) => `✗ ${espacio}: excepción vencida el ${a.vence} · ${a.paquete} · ${a.aviso}: revisarla en DL-114`),
    ...sinVerificar.map((a) => `✗ ${espacio}: ${a.severidad} · ${a.paquete} · ${a.aviso} · no se pudo comprobar la procedencia (${a.motivo}); sin esa prueba, la excepción no se aplica`),
    ...exceptuados.flatMap((a) => [`· ${espacio}: exceptuado hasta el ${a.vence} · ${a.paquete} · ${a.aviso} (DL-114)`, ...(a.procedencia ?? []).map((l) => `    ${l}`)]),
  ];
  let codigo = CODIGO.APRUEBA;
  if (fallan.length > 0 || vencidas.length > 0) codigo = CODIGO.VULNERABILIDADES;
  if (sinVerificar.length > 0) codigo = CODIGO.NO_SE_PUDO_AUDITAR;
  if (codigo === CODIGO.APRUEBA) lineas.push(`✓ ${espacio}: sin avisos altos ni críticos fuera de las excepciones declaradas`);
  return { codigo, lineas };
}

/** El código de toda la auditoría: el peor de los espacios (no poder auditar es peor que encontrar algo). */
const codigoFinal = (codigos) => Math.max(CODIGO.APRUEBA, ...codigos);

// ─── La corrida real ──────────────────────────────────────────────────────────────────────────────

/** La salida de `npm audit --json`: también cuando termina con error, que es lo normal si encuentra algo. */
function salidaDeNpm(espacio) {
  try {
    return execSync(`npm audit --omit=dev --json -w ${espacio}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // Sin stdout (npm ausente, sin red, tiempo agotado) la validación lo trata como «no se pudo auditar».
    return typeof error.stdout === 'string' ? error.stdout : '';
  }
}

/**
 * Construye el bundle de Android de la APK como lo hace Gradle (`android/app/build.gradle`, bloque `react`): la entrada
 * que resuelve `expo/scripts/resolveAppEntry`, la CLI que trae `expo` y `export:embed` sin modo de desarrollo. Devuelve
 * la lista de módulos del mapa de fuentes y la entrada. Usa una carpeta temporal propia, también para la caché de Metro,
 * y la borra al terminar. `BE_AUDITORIA_MAX_WORKERS` limita los procesos de Metro en una máquina con poca memoria.
 */
function construirBundleDeAndroid(raiz) {
  const proyecto = path.join(raiz, 'apps', 'mobile');
  const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'be-auditoria-'));
  const env = { ...process.env, TMPDIR: temporal, TEMP: temporal, TMP: temporal, CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_OFFLINE: '1' };
  const node = (args, opciones = {}) => execFileSync(process.execPath, args, { cwd: proyecto, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024, ...opciones });
  try {
    const entrada = node(['-e', "require('expo/scripts/resolveAppEntry')", proyecto, 'android', 'absolute']).trim();
    const cli = node(['--print', "require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })"]).trim();
    const mapa = path.join(temporal, 'index.android.bundle.packager.map');
    const argumentos = [cli, 'export:embed', '--platform', 'android', '--dev', 'false', '--reset-cache', '--entry-file', entrada, '--bundle-output', path.join(temporal, 'index.android.bundle'), '--assets-dest', path.join(temporal, 'res'), '--sourcemap-output', mapa, '--minify', 'false'];
    if (/^\d+$/.test(process.env.BE_AUDITORIA_MAX_WORKERS ?? '')) argumentos.push('--max-workers', process.env.BE_AUDITORIA_MAX_WORKERS);
    try {
      node(argumentos, { timeout: 20 * 60 * 1000 });
    } catch (error) {
      const salida = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.trim().split('\n').filter(Boolean);
      throw new Error(`expo export:embed terminó con error (${salida.slice(-3).join(' · ') || error.message})`);
    }
    const { sources } = JSON.parse(fs.readFileSync(mapa, 'utf8'));
    return { fuentes: sources, entrada };
  } finally {
    // Si un proceso de Metro todavía tiene un archivo abierto (Windows), la carpeta queda en el temporal del sistema: no
    // cambia el resultado.
    try {
      fs.rmSync(temporal, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {}
  }
}

/** Lo que la procedencia necesita de este repositorio: el lockfile, el bundle (una vez, cuando haga falta) y node_modules. */
function crearContexto(raiz) {
  let lockfile = null;
  try {
    lockfile = JSON.parse(fs.readFileSync(path.join(raiz, 'package-lock.json'), 'utf8'));
  } catch {
    lockfile = null;
  }
  let bundle = null;
  return {
    raiz,
    lockfile,
    modulosDelBundle: () => (bundle ??= construirBundleDeAndroid(raiz)),
    versionInstalada: (ubicacion) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(raiz, ubicacion, 'package.json'), 'utf8')).version ?? null;
      } catch {
        return null;
      }
    },
  };
}

function principal() {
  const hoy = new Date().toISOString().slice(0, 10);
  const contexto = crearContexto(path.resolve(__dirname, '..'));
  const codigos = ESPACIOS.map((espacio) => {
    const { codigo, lineas } = evaluarSalida(espacio, salidaDeNpm(espacio), EXCEPCIONES, hoy, contexto);
    for (const l of lineas) console.log(l);
    return codigo;
  });
  process.exit(codigoFinal(codigos));
}

module.exports = {
  clasificarAvisos,
  validarInforme,
  evaluarSalida,
  codigoFinal,
  procedenciaEnElLockfile,
  procedenciaEnElBundle,
  usuariosDe,
  copiasEnElBundle,
  crearContexto,
  CODIGO,
  EXCEPCIONES,
};
if (require.main === module) principal();
