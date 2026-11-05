/**
 * Lee y extrae un zip (un AAB, una APK o un .apks) sin herramientas externas. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS
 * (2026-11-02, con apk-desde-aab.mjs; la lectura del directorio central es la misma que usa firmar-aab.mjs). Sin zip64:
 * ni un AAB ni una APK de BE lo usan. Lo prueba scripts/aab/verificar-aab.test.cjs.
 *
 * - `leerZip`: nombre, CRC-32, tamaño, método y posición de cada entrada, y si el archivo trae el bloque de firma de APK
 *   (esquemas v2 y v3), que va justo antes del directorio central y termina con «APK Sig Block 42».
 * - `extraerZip`: todas las entradas, sin pisar ninguna. En Windows dos nombres que difieren solo en mayúsculas se
 *   pisan al extraer, y las APK con los recursos acortados los tienen (la 0.18.0-candidata.1 trae 54, como res/BW.xml y
 *   res/bW.xml): con `tar` se revisarían menos archivos que entradas. Por eso cada entrada va a `<carpeta>/<n>/<nombre>`,
 *   con n = 0 salvo que choque con otra ya extraída.
 */
import { closeSync, fstatSync, mkdirSync, openSync, readSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

export const MAGIA_DEL_BLOQUE_DE_FIRMA = 'APK Sig Block 42';

/** Los archivos de una firma JAR (v1) en META-INF: el manifiesto, los .SF, sus bloques y los SIG-*. */
export const esArchivoDeFirmaJar = (nombre) => /^META-INF\/(MANIFEST\.MF|[^/]+\.(SF|RSA|DSA|EC)|SIG-[^/]*)$/i.test(nombre);
/** Solo los bloques de una firma JAR (sin MANIFEST.MF, que puede quedar sin que haya firma v1). */
export const esBloqueDeFirmaJar = (nombre) => /^META-INF\/([^/]+\.(SF|RSA|DSA|EC)|SIG-[^/]*)$/i.test(nombre);

/** Lee exactamente buf.length bytes desde `posicion` (readSync puede devolver menos). */
function leerExacto(fd, buf, posicion) {
  let leidos = 0;
  while (leidos < buf.length) {
    const n = readSync(fd, buf, leidos, buf.length - leidos, posicion + leidos);
    if (n <= 0) throw new Error('el zip termina antes de lo que dice su directorio');
    leidos += n;
  }
  return buf;
}

/** → { entradas: [{ nombre, crc, tamano, comprimido, metodo, local }], conBloqueDeFirmaApk } */
export function leerZip(archivo) {
  const fd = openSync(archivo, 'r');
  try {
    return leerDirectorio(fd, archivo);
  } finally {
    closeSync(fd);
  }
}

function leerDirectorio(fd, archivo) {
  const total = fstatSync(fd).size;
  const cola = Math.min(total, 65_557);
  const fin = leerExacto(fd, Buffer.alloc(cola), total - cola);
  let p = cola - 22;
  while (p >= 0 && fin.readUInt32LE(p) !== 0x06054b50) p--;
  if (p < 0) throw new Error(`${basename(archivo)} no es un zip (sin fin de directorio central)`);
  const cantidad = fin.readUInt16LE(p + 10);
  const tamanoDelDirectorio = fin.readUInt32LE(p + 12);
  const desplazamiento = fin.readUInt32LE(p + 16);
  if (cantidad === 0xffff || tamanoDelDirectorio === 0xffffffff || desplazamiento === 0xffffffff) throw new Error(`${basename(archivo)} es zip64: no lo sé leer`);
  const dir = leerExacto(fd, Buffer.alloc(tamanoDelDirectorio), desplazamiento);
  const entradas = [];
  let q = 0;
  for (let i = 0; i < cantidad; i++) {
    if (dir.readUInt32LE(q) !== 0x02014b50) throw new Error(`${basename(archivo)}: directorio central dañado en la entrada ${i}`);
    const largoNombre = dir.readUInt16LE(q + 28);
    const largoExtra = dir.readUInt16LE(q + 30);
    const largoComentario = dir.readUInt16LE(q + 32);
    entradas.push({
      nombre: dir.toString('utf8', q + 46, q + 46 + largoNombre),
      crc: dir.readUInt32LE(q + 16),
      tamano: dir.readUInt32LE(q + 24),
      comprimido: dir.readUInt32LE(q + 20),
      metodo: dir.readUInt16LE(q + 10),
      local: dir.readUInt32LE(q + 42),
    });
    q += 46 + largoNombre + largoExtra + largoComentario;
  }
  const conBloqueDeFirmaApk = desplazamiento >= 32 && leerExacto(fd, Buffer.alloc(16), desplazamiento - 16).toString('latin1') === MAGIA_DEL_BLOQUE_DE_FIRMA;
  return { entradas, conBloqueDeFirmaApk };
}

/**
 * Extrae todas las entradas (guardadas o con deflate) a `<carpeta>/<n>/<nombre>` sin pisar ninguna (ver arriba), y
 * tampoco escribe encima de un archivo que ya estuviera en la carpeta: si lo hay, corta (se escribe con `wx`).
 * Rechaza nombres absolutos, con «..», con barra invertida, con dos puntos (una unidad, o un flujo alternativo de
 * NTFS) o con segmentos vacíos. → { archivos, choques, raices }: archivos extraídos, cuántos fueron a una raíz
 * distinta de la 0 por chocar en mayúsculas, y cuántas raíces hubo.
 */
export function extraerZip(archivo, carpeta) {
  const fd = openSync(archivo, 'r');
  try {
    const { entradas } = leerDirectorio(fd, archivo);
    const raices = [];
    let archivos = 0;
    let choques = 0;
    for (const e of entradas) {
      if (e.nombre.endsWith('/')) continue;
      const partes = e.nombre.split('/');
      if (e.nombre.includes(':') || e.nombre.includes('\\') || partes.some((s) => s === '' || s === '.' || s === '..')) throw new Error(`${basename(archivo)}: nombre de entrada no seguro: ${e.nombre}`);
      const minusculas = e.nombre.toLowerCase();
      const carpetas = partes.slice(0, -1).map((_, i) => partes.slice(0, i + 1).join('/').toLowerCase());
      let n = 0;
      for (; ; n++) {
        raices[n] ??= { archivos: new Set(), carpetas: new Set() };
        const r = raices[n];
        if (!r.archivos.has(minusculas) && !r.carpetas.has(minusculas) && !carpetas.some((c) => r.archivos.has(c))) break;
      }
      if (n > 0) choques++;
      raices[n].archivos.add(minusculas);
      for (const c of carpetas) raices[n].carpetas.add(c);

      const cabecera = leerExacto(fd, Buffer.alloc(30), e.local);
      if (cabecera.readUInt32LE(0) !== 0x04034b50) throw new Error(`${basename(archivo)}: cabecera local dañada en ${e.nombre}`);
      const desde = e.local + 30 + cabecera.readUInt16LE(26) + cabecera.readUInt16LE(28);
      const comprimidos = leerExacto(fd, Buffer.alloc(e.comprimido), desde);
      let datos;
      if (e.metodo === 0) datos = comprimidos;
      else if (e.metodo === 8) datos = inflateRawSync(comprimidos);
      else throw new Error(`${basename(archivo)}: ${e.nombre} usa el método ${e.metodo}, que no sé descomprimir`);
      if (datos.length !== e.tamano) throw new Error(`${basename(archivo)}: ${e.nombre} da ${datos.length} bytes y el directorio dice ${e.tamano}`);
      const destino = join(carpeta, String(n), ...partes);
      mkdirSync(dirname(destino), { recursive: true });
      writeFileSync(destino, datos, { flag: 'wx' });
      archivos++;
    }
    return { archivos, choques, raices: raices.length };
  } finally {
    closeSync(fd);
  }
}
