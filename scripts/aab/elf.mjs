/**
 * Lee la alineación de los segmentos de una biblioteca ELF para la comprobación de páginas de 16 KB de Google Play
 * (https://developer.android.com/guide/practices/page-sizes): en los dispositivos de 64 bits, cada segmento de carga
 * (PT_LOAD) tiene que estar alineado a 16384 bytes, y el final del segmento RELRO (PT_GNU_RELRO: dirección virtual más
 * tamaño en memoria) también tiene que caer en un múltiplo de 16384, si no la app se cae al arrancar. Sin dependencias
 * ni herramientas externas. WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28; con RELRO y validaciones tras la revisión).
 * Lo prueba scripts/aab/verificar-aab.test.cjs con ELF sintéticos.
 */
export const PAGINA_DE_16_KB = 16384;
const PT_LOAD = 1;
const PT_GNU_RELRO = 0x6474e552;
const PN_XNUM = 0xffff;

/** { bits, alineaciones: [p_align de cada PT_LOAD], relro: { vaddr, memsz } | null } o `null` si no es un ELF que se pueda leer. */
export function cargasDeElf(buf) {
  if (buf.length < 64 || buf.readUInt32BE(0) !== 0x7f454c46) return null;
  const clase = buf[4];
  if (buf[5] !== 1 && buf[5] !== 2) return null;
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
  if (phnum === PN_XNUM || phentsize === 0 || phoff + phnum * phentsize > buf.length) return null;
  const alineaciones = [];
  let relro = null;
  for (let i = 0; i < phnum; i++) {
    const o = phoff + i * phentsize;
    const tipo = r32(o);
    if (tipo === PT_LOAD) alineaciones.push(clase === 2 ? r64(o + 48) : r32(o + 28));
    else if (tipo === PT_GNU_RELRO) relro = clase === 2 ? { vaddr: r64(o + 16), memsz: r64(o + 40) } : { vaddr: r32(o + 8), memsz: r32(o + 20) };
  }
  return { bits: clase === 2 ? 64 : 32, alineaciones, relro };
}

/**
 * Si la biblioteca cumple 16 KB: todos los PT_LOAD alineados a un múltiplo de 16384 y, si hay RELRO, su final también.
 * Sin segmentos de carga, o sin poder leer el ELF, no se puede afirmar: `false`.
 */
export function alineadaA16Kb(buf) {
  const elf = cargasDeElf(buf);
  if (!elf || elf.alineaciones.length === 0) return { elf, alineada: false, cargasAlineadas: false, relroAlineado: null };
  const cargasAlineadas = elf.alineaciones.every((a) => a >= PAGINA_DE_16_KB && a % PAGINA_DE_16_KB === 0);
  const relroAlineado = elf.relro ? (elf.relro.vaddr + elf.relro.memsz) % PAGINA_DE_16_KB === 0 : null;
  return { elf, cargasAlineadas, relroAlineado, alineada: cargasAlineadas && relroAlineado !== false };
}
