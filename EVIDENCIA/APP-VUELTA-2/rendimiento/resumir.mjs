// WP-APP-VUELTA-2 · AV2-16 · El resumen de la medición de cuadros (paquete §5.3), desde los crudos de `medir.sh`.
//
// Uso: node resumir.mjs            (lee antes/ y despues/ al lado de este archivo; escribe RESUMEN.md)
//      node resumir.mjs --prueba   (verifica el lector de gfxinfo con un ejemplo, sin teléfono)
//
// El criterio (§5.3): el percentil 90 en 16,7 ms o menos a 60 Hz (11,1 ms a 90 Hz y 8,3 ms a 120 Hz), y no más de 2
// puntos de cuadros lentos que la 0.23 en las mismas condiciones. De cada pantalla se toma la mediana de las tres
// corridas. Si no se cumple, primero se baja el costo (sin el brillo, un solo destello) y después se apaga el
// interruptor en la pantalla que no pasa.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PANTALLAS = ['inicio', 'nutricion-hoy', 'entrenamiento', 'tu-historial'];
const NOMBRE = { inicio: 'Inicio', 'nutricion-hoy': 'Nutrición Hoy', entrenamiento: 'Entrenamiento', 'tu-historial': 'Tu historial' };

/** Lo que importa de un `dumpsys gfxinfo`: los cuadros, los lentos (%) y los percentiles 50, 90 y 95, en ms. */
export function leerGfxinfo(texto) {
  const numero = (re) => {
    const m = re.exec(texto);
    return m ? Number(m[1].replace(',', '.')) : null;
  };
  return {
    cuadros: numero(/Total frames rendered:\s*(\d+)/),
    lentos: numero(/Janky frames:\s*\d+\s*\(([\d.,]+)%\)/),
    p50: numero(/50th percentile:\s*([\d.]+)ms/),
    p90: numero(/90th percentile:\s*([\d.]+)ms/),
    p95: numero(/95th percentile:\s*([\d.]+)ms/),
  };
}

const mediana = (valores) => {
  const v = valores.filter((x) => x !== null).sort((a, b) => a - b);
  if (v.length === 0) return null;
  return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};

/** El tope del percentil 90 según la frecuencia de la pantalla. */
export const topeDelP90 = (hz) => (hz >= 115 ? 8.3 : hz >= 85 ? 11.1 : 16.7);

function leerEtapa(etapa) {
  const dir = join(AQUI, etapa);
  if (!existsSync(dir)) return null;
  const dispositivo = Object.fromEntries(
    readFileSync(join(dir, 'dispositivo.txt'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );
  const pantallas = {};
  for (const p of PANTALLAS) {
    const corridas = readdirSync(dir)
      .filter((f) => new RegExp(`^${p}-\\d+\\.txt$`).test(f))
      .map((f) => leerGfxinfo(readFileSync(join(dir, f), 'utf8')));
    pantallas[p] = { corridas, lentos: mediana(corridas.map((c) => c.lentos)), p50: mediana(corridas.map((c) => c.p50)), p90: mediana(corridas.map((c) => c.p90)), p95: mediana(corridas.map((c) => c.p95)) };
  }
  const graficos = (archivo) => {
    const ruta = join(dir, archivo);
    if (!existsSync(ruta)) return null;
    const m = /Graphics:\s+([\d,]+)/.exec(readFileSync(ruta, 'utf8'));
    return m ? m[1] : null;
  };
  return { dispositivo, pantallas, memoria: { antes: graficos('memoria-antes.txt'), despues: graficos('memoria-despues.txt') } };
}

function resumir() {
  const antes = leerEtapa('antes');
  const despues = leerEtapa('despues');
  if (!antes && !despues) {
    console.error('No hay mediciones: corré primero bash medir.sh antes y bash medir.sh despues.');
    process.exit(1);
  }
  const hz = Number(despues?.dispositivo.frecuencia ?? antes?.dispositivo.frecuencia ?? 60) || 60;
  const tope = topeDelP90(hz);
  const filas = PANTALLAS.map((p) => {
    const a = antes?.pantallas[p];
    const d = despues?.pantallas[p];
    const p90Ok = d?.p90 != null ? d.p90 <= tope : null;
    const lentosOk = d?.lentos != null && a?.lentos != null ? d.lentos - a.lentos <= 2 : null;
    const veredicto = p90Ok === null || lentosOk === null ? 'falta medir' : p90Ok && lentosOk ? 'pasa' : 'no pasa';
    const f = (x, u = '') => (x == null ? '—' : `${String(x).replace('.', ',')}${u}`);
    return `| ${NOMBRE[p]} | ${f(a?.lentos, ' %')} | ${f(d?.lentos, ' %')} | ${f(a?.p90, ' ms')} | ${f(d?.p90, ' ms')} | ${f(d?.p50, ' ms')} · ${f(d?.p95, ' ms')} | ${veredicto} |`;
  });
  const texto = [
    '# AV2-16 · La medición de cuadros, antes y después',
    '',
    `Antes: ${antes ? `${antes.dispositivo.version} (${antes.dispositivo.versionCode}), ${antes.dispositivo.modelo}, Android ${antes.dispositivo.android}` : 'sin medir'}.`,
    `Después: ${despues ? `${despues.dispositivo.version} (${despues.dispositivo.versionCode}), ${despues.dispositivo.modelo}, Android ${despues.dispositivo.android}` : 'sin medir'}.`,
    `La pantalla va a ${hz} Hz: el percentil 90 tiene que quedar en ${String(tope).replace('.', ',')} ms o menos, y los cuadros lentos no pueden subir más de 2 puntos. De cada pantalla, la mediana de las tres corridas.`,
    '',
    '| Pantalla | Lentos antes | Lentos después | P90 antes | P90 después | P50 · P95 después | Resultado |',
    '|---|---|---|---|---|---|---|',
    ...filas,
    '',
    `Memoria de gráficos (dumpsys meminfo, Graphics, en kB): antes ${antes?.memoria.antes ?? '—'} → ${antes?.memoria.despues ?? '—'}; después ${despues?.memoria.antes ?? '—'} → ${despues?.memoria.despues ?? '—'}.`,
    '',
    '«Depurar superposición de GPU»: se mira a mano, con la captura de Inicio en despues/superposicion-inicio.png.',
    '',
  ].join('\n');
  writeFileSync(join(AQUI, 'RESUMEN.md'), texto);
  console.log(texto);
}

function prueba() {
  const ejemplo = `** Graphics info for pid 1234 [com.elianbufi.be] **

Stats since: 123456789ns
Total frames rendered: 612
Janky frames: 27 (4.41%)
Janky frames (legacy): 31 (5.07%)
50th percentile: 7ms
90th percentile: 14ms
95th percentile: 18ms
99th percentile: 33ms
Number Missed Vsync: 3`;
  const leido = leerGfxinfo(ejemplo);
  const esperado = { cuadros: 612, lentos: 4.41, p50: 7, p90: 14, p95: 18 };
  const bien = JSON.stringify(leido) === JSON.stringify(esperado) && topeDelP90(60) === 16.7 && topeDelP90(90) === 11.1 && topeDelP90(120) === 8.3;
  console.log(bien ? 'El lector de gfxinfo y el criterio andan.' : `No coincide: ${JSON.stringify(leido)}`);
  process.exit(bien ? 0 : 1);
}

if (process.argv.includes('--prueba')) prueba();
else resumir();
