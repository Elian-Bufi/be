/**
 * Lee la alineación de los segmentos de carga (PT_LOAD) de una biblioteca ELF, para la comprobación de páginas de 16 KB
 * de Google Play: en los dispositivos de 64 bits, cada segmento de carga tiene que estar alineado a 16384 bytes
 * (https://developer.android.com/guide/practices/page-sizes). Sin dependencias ni herramientas externas.
 * WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28). Lo prueba scripts/aab/verificar-aab.test.cjs con ELF sintéticos.
 */
export const PAGINA_DE_16_KB = 16384;
const PT_LOAD = 1;

/** { bits, alineaciones: [p_align de cada PT_LOAD] } o `null` si no es un ELF. */
export function cargasDeElf(buf) {
  if (buf.length < 64 || buf.readUInt32BE(0) !== 0x7f454c46) return null;
  const clase = buf[4];
  const le = buf[5] === 1;
  const r16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
  const r32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
  const r64 = (o) => Number(le ? buf.readBigUInt64LE(o) : buf.readBigUInt64BE(o));
  let phoff;
  let phentsize;
  let phnum;
  if (clase === 2) {
    phoff = r64(32);
    phentsize = r16(54);
    phnum = r16(56);
  } else if (clase === 1) {
    phoff = r32(28);
    phentsize = r16(42);
    phnum = r16(44);
  } else return null;
  const alineaciones = [];
  for (let i = 0; i < phnum; i++) {
    const o = phoff + i * phentsize;
    if (o + phentsize > buf.length) break;
    if (r32(o) !== PT_LOAD) continue;
    alineaciones.push(clase === 2 ? r64(o + 48) : r32(o + 28));
  }
  return { bits: clase === 2 ? 64 : 32, alineaciones };
}

/** Si todos los segmentos de carga están alineados a 16 KB (o más). Sin segmentos, no se puede afirmar: `false`. */
export function alineadaA16Kb(buf) {
  const elf = cargasDeElf(buf);
  if (!elf || elf.alineaciones.length === 0) return { elf, alineada: false };
  return { elf, alineada: elf.alineaciones.every((a) => a >= PAGINA_DE_16_KB && a % PAGINA_DE_16_KB === 0) };
}
