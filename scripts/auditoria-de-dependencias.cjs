/**
 * WP-01 §2 · la auditoría de dependencias de producción de la API, el website y la APK: falla con cualquier aviso de
 * severidad alta o crítica, salvo las excepciones declaradas en `EXCEPCIONES`. Cada excepción dice el aviso, el paquete,
 * por qué el riesgo queda acotado en BE y cuándo vence; una excepción vencida vuelve a hacer fallar la auditoría
 * (DL-114).
 *
 * Antes era `npm audit --omit=dev --audit-level=high` por espacio de trabajo, que no admite excepciones: un aviso sin
 * versión corregida en una herramienta de construcción bloqueaba toda integración.
 *
 * Un informe que no se puede leer **nunca aprueba**: si `npm audit` no pudo auditar (por ejemplo, `ENOAUDIT` con el
 * servicio de avisos caído), si la salida no es JSON o si el informe está incompleto, la auditoría falla con otro código
 * que el de las vulnerabilidades, para que no se confundan:
 *   0 · sin avisos altos ni críticos fuera de las excepciones vigentes;
 *   1 · hay avisos altos o críticos sin excepción, o una excepción vencida;
 *   2 · la auditoría no se pudo hacer: error de npm, salida que no es JSON o informe incompleto.
 *
 * Uso: node scripts/auditoria-de-dependencias.cjs (desde la raíz). `evaluarSalida` es la lógica completa, de la salida de
 * npm al código; se prueba en `auditoria-de-dependencias.test.cjs`.
 */
const { execSync } = require('node:child_process');

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
];

/** El identificador del aviso: `GHSA-…`, tomado de su URL. */
const idDelAviso = (via) => (typeof via.url === 'string' ? via.url.split('/').pop() : String(via.source));

/**
 * Los avisos altos o críticos de un reporte de `npm audit --json`, separados en los que fallan, los exceptuados y las
 * excepciones vencidas. `hoy` es una fecha `AAAA-MM-DD`. El reporte tiene que estar validado (`validarInforme`).
 */
function clasificarAvisos(reporte, excepciones, hoy) {
  const avisos = new Map();
  for (const vulnerabilidad of Object.values(reporte.vulnerabilities)) {
    for (const via of vulnerabilidad.via ?? []) {
      // Un `via` de texto es un paquete intermedio: su aviso real aparece en la entrada de ese paquete.
      if (typeof via === 'string' || !SEVERIDADES_QUE_FALLAN.has(via.severity)) continue;
      avisos.set(`${idDelAviso(via)}|${via.name}`, { aviso: idDelAviso(via), paquete: via.name, titulo: via.title, severidad: via.severity });
    }
  }
  const fallan = [];
  const exceptuados = [];
  const vencidas = [];
  for (const a of avisos.values()) {
    const excepcion = excepciones.find((e) => e.aviso === a.aviso && e.paquete === a.paquete);
    if (!excepcion) fallan.push(a);
    else if (hoy > excepcion.vence) vencidas.push({ ...a, vence: excepcion.vence });
    else exceptuados.push({ ...a, vence: excepcion.vence });
  }
  return { fallan, exceptuados, vencidas };
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
function evaluarSalida(espacio, salida, excepciones, hoy) {
  const { informe, problema } = validarInforme(salida);
  if (problema) return { codigo: CODIGO.NO_SE_PUDO_AUDITAR, lineas: [`✗ ${espacio}: la auditoría no se pudo hacer (${problema}); no se aprueba sin un informe válido`] };
  const { fallan, exceptuados, vencidas } = clasificarAvisos(informe, excepciones, hoy);
  const lineas = [
    ...fallan.map((a) => `✗ ${espacio}: ${a.severidad} · ${a.paquete} · ${a.aviso} · ${a.titulo}`),
    ...vencidas.map((a) => `✗ ${espacio}: excepción vencida el ${a.vence} · ${a.paquete} · ${a.aviso}: revisarla en DL-114`),
    ...exceptuados.map((a) => `· ${espacio}: exceptuado hasta el ${a.vence} · ${a.paquete} · ${a.aviso} (DL-114)`),
  ];
  const bloquea = fallan.length > 0 || vencidas.length > 0;
  if (!bloquea) lineas.push(`✓ ${espacio}: sin avisos altos ni críticos fuera de las excepciones declaradas`);
  return { codigo: bloquea ? CODIGO.VULNERABILIDADES : CODIGO.APRUEBA, lineas };
}

/** El código de toda la auditoría: el peor de los espacios (no poder auditar es peor que encontrar algo). */
const codigoFinal = (codigos) => Math.max(CODIGO.APRUEBA, ...codigos);

/** La salida de `npm audit --json`: también cuando termina con error, que es lo normal si encuentra algo. */
function salidaDeNpm(espacio) {
  try {
    return execSync(`npm audit --omit=dev --json -w ${espacio}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // Sin stdout (npm ausente, sin red, tiempo agotado) la validación lo trata como «no se pudo auditar».
    return typeof error.stdout === 'string' ? error.stdout : '';
  }
}

function principal() {
  const hoy = new Date().toISOString().slice(0, 10);
  const codigos = ESPACIOS.map((espacio) => {
    const { codigo, lineas } = evaluarSalida(espacio, salidaDeNpm(espacio), EXCEPCIONES, hoy);
    for (const l of lineas) console.log(l);
    return codigo;
  });
  process.exit(codigoFinal(codigos));
}

module.exports = { clasificarAvisos, validarInforme, evaluarSalida, codigoFinal, CODIGO, EXCEPCIONES };
if (require.main === module) principal();
