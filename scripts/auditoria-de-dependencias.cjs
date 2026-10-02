/**
 * WP-01 §2 · la auditoría de dependencias de producción de la API, el website y la APK: falla con cualquier aviso de
 * severidad alta o crítica, salvo las excepciones declaradas en `EXCEPCIONES`. Cada excepción dice el aviso, el paquete,
 * por qué no aplica a BE y cuándo vence; una excepción vencida vuelve a hacer fallar la auditoría (DL-114).
 *
 * Antes era `npm audit --omit=dev --audit-level=high` por espacio de trabajo, que no admite excepciones: un aviso sin
 * versión corregida en una herramienta de construcción bloqueaba toda integración.
 *
 * Uso: node scripts/auditoria-de-dependencias.cjs (desde la raíz). La lógica es una función pura, probada en
 * `auditoria-de-dependencias.test.cjs`.
 */
const { execSync } = require('node:child_process');

const ESPACIOS = ['@be/api', '@be/web', '@be/mobile'];
const SEVERIDADES_QUE_FALLAN = new Set(['high', 'critical']);

/** Las excepciones vigentes. Cada una se revisa antes de su vencimiento, o antes si sale la corrección. */
const EXCEPCIONES = [
  {
    aviso: 'GHSA-86w9-cpqp-85rv',
    paquete: 'node-forge',
    motivo:
      'Sin versión corregida: el aviso abarca hasta la 1.4.0, la última publicada (actualizado el 2026-10-01). node-forge entra solo por la CLI de Expo (@expo/cli → @expo/code-signing-certificates), que firma actualizaciones OTA: BE no usa expo-updates ni esa firma, y node-forge no viaja en el bundle de la APK ni está en la API ni en el website.',
    vence: '2026-10-31',
  },
];

/** El identificador del aviso: `GHSA-…`, tomado de su URL. */
const idDelAviso = (via) => (typeof via.url === 'string' ? via.url.split('/').pop() : String(via.source));

/**
 * Los avisos altos o críticos de un reporte de `npm audit --json`, separados en los que fallan, los exceptuados y las
 * excepciones vencidas. `hoy` es una fecha `AAAA-MM-DD`.
 */
function clasificarAvisos(reporte, excepciones, hoy) {
  const avisos = new Map();
  for (const vulnerabilidad of Object.values(reporte.vulnerabilities ?? {})) {
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

function auditar(espacio) {
  try {
    return JSON.parse(execSync(`npm audit --omit=dev --json -w ${espacio}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }));
  } catch (error) {
    // `npm audit` termina con código 1 cuando encuentra algo; el reporte igual sale por stdout.
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
}

function principal() {
  const hoy = new Date().toISOString().slice(0, 10);
  let falla = false;
  for (const espacio of ESPACIOS) {
    const { fallan, exceptuados, vencidas } = clasificarAvisos(auditar(espacio), EXCEPCIONES, hoy);
    for (const a of fallan) console.log(`✗ ${espacio}: ${a.severidad} · ${a.paquete} · ${a.aviso} · ${a.titulo}`);
    for (const a of vencidas) console.log(`✗ ${espacio}: excepción vencida el ${a.vence} · ${a.paquete} · ${a.aviso}: revisarla en DL-114`);
    for (const a of exceptuados) console.log(`· ${espacio}: exceptuado hasta el ${a.vence} · ${a.paquete} · ${a.aviso} (DL-114)`);
    if (fallan.length === 0 && vencidas.length === 0) console.log(`✓ ${espacio}: sin avisos altos ni críticos fuera de las excepciones declaradas`);
    falla ||= fallan.length > 0 || vencidas.length > 0;
  }
  process.exit(falla ? 1 : 0);
}

module.exports = { clasificarAvisos, EXCEPCIONES };
if (require.main === module) principal();
