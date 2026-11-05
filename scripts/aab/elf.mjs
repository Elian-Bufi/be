/**
 * Lee los segmentos de una biblioteca ELF para la comprobación de páginas de 16 KB de Google Play
 * (https://developer.android.com/guide/practices/page-sizes). Sin dependencias ni herramientas externas.
 * WP-GOOGLE-PLAY-PRUEBAS-INTERNAS (2026-10-28; corregido el 2026-10-29 con el primer AAB real).
 *
 * Qué tiene que cumplir cada biblioteca de 64 bits para cargarse en un dispositivo con páginas de 16 KB:
 * 1. Cada segmento de carga (PT_LOAD) alineado a 16384 o a un múltiplo, con la dirección virtual y el desplazamiento
 *    en el archivo iguales módulo 16384 (si no, no se puede mapear). Es lo que mide la comprobación oficial de Google.
 * 2. Ningún par de segmentos comparte una página de 16 KB: cada uno se mapea con sus propios permisos.
 * 3. RELRO (PT_GNU_RELRO): después de las relocaciones, Android vuelve de solo lectura TODAS las páginas que el RELRO
 *    toca, redondeando hacia afuera. En esas páginas no puede haber código ni datos escribibles que no sean del RELRO.
 *
 * La corrección del 29/10: hasta entonces el punto 3 exigía que el FINAL del RELRO cayera en un múltiplo de 16384.
 * Con el primer AAB real dio «MAL» en todas las bibliotecas de 64 bits (también las del NDK y las de React Native,
 * que se publican compatibles), y `llvm-readelf` mostró por qué: lld termina el RELRO a 4 KB y pone el segmento
 * siguiente en otra página de 16 KB, así que el redondeo de Android no alcanza ningún dato ajeno. Esa regla era más
 * estricta que Android; la de ahora es la condición que de verdad importa. Lo prueba scripts/aab/verificar-aab.test.cjs.
 */
export const PAGINA_DE_16_KB = 16384;
const PT_LOAD = 1;
const PT_GNU_RELRO = 0x6474e552;
const PN_XNUM = 0xffff;
const PF_X = 0x1;
const PF_W = 0x2;

/**
 * { bits, alineaciones: [p_align de cada PT_LOAD], cargas: [{ flags, offset, vaddr, memsz, align }], relro: { vaddr,
 * memsz } | null } o `null` si no es un ELF que se pueda leer.
 */
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
  const cargas = [];
  let relro = null;
  for (let i = 0; i < phnum; i++) {
    const o = phoff + i * phentsize;
    const tipo = r32(o);
    if (tipo === PT_LOAD) {
      cargas.push(
        clase === 2
          ? { flags: r32(o + 4), offset: r64(o + 8), vaddr: r64(o + 16), memsz: r64(o + 40), align: r64(o + 48) }
          : { flags: r32(o + 24), offset: r32(o + 4), vaddr: r32(o + 8), memsz: r32(o + 20), align: r32(o + 28) },
      );
    } else if (tipo === PT_GNU_RELRO) relro = clase === 2 ? { vaddr: r64(o + 16), memsz: r64(o + 40) } : { vaddr: r32(o + 8), memsz: r32(o + 20) };
  }
  return { bits: clase === 2 ? 64 : 32, alineaciones: cargas.map((c) => c.align), cargas, relro };
}

/**
 * Si la biblioteca cumple 16 KB (los tres puntos de arriba). Sin segmentos de carga, o sin poder leer el ELF, no se
 * puede afirmar: `false`. `relroSeguro` es `null` si no hay RELRO.
 */
export function alineadaA16Kb(buf) {
  const elf = cargasDeElf(buf);
  if (!elf || elf.cargas.length === 0) return { elf, alineada: false, cargasAlineadas: false, paginasPropias: false, relroSeguro: null };
  const P = PAGINA_DE_16_KB;
  const abajo = (x) => Math.floor(x / P) * P;
  const arriba = (x) => Math.ceil(x / P) * P;
  // 1. Alineación y congruencia de cada PT_LOAD.
  const cargasAlineadas = elf.cargas.every((c) => c.align >= P && c.align % P === 0 && c.vaddr % P === c.offset % P);
  // 2. Cada segmento en sus propias páginas de 16 KB.
  const ordenadas = elf.cargas.filter((c) => c.memsz > 0).sort((a, b) => a.vaddr - b.vaddr);
  const paginasPropias = ordenadas.every((c, i) => i === 0 || arriba(ordenadas[i - 1].vaddr + ordenadas[i - 1].memsz) <= abajo(c.vaddr));
  // 3. En las páginas que toca el RELRO, nada de código ni de datos escribibles fuera del RELRO.
  let relroSeguro = null;
  if (elf.relro) {
    const inicio = elf.relro.vaddr;
    const fin = elf.relro.vaddr + elf.relro.memsz;
    const desde = abajo(inicio);
    const hasta = arriba(fin);
    relroSeguro = elf.cargas
      .filter((c) => c.flags & (PF_W | PF_X))
      .every((c) =>
        [
          [c.vaddr, Math.min(c.vaddr + c.memsz, inicio)],
          [Math.max(c.vaddr, fin), c.vaddr + c.memsz],
        ]
          .filter(([a, b]) => b > a)
          .every(([a, b]) => b <= desde || a >= hasta),
      );
  }
  return { elf, cargasAlineadas, paginasPropias, relroSeguro, alineada: cargasAlineadas && paginasPropias && relroSeguro !== false };
}
