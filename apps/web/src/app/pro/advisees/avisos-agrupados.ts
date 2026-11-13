/**
 * PG-10 de WP-PULIDO-GRANDES (DL-173): los avisos repetidos, en un solo renglón. Sin React, para las pruebas
 * (TEST-PG-009).
 *
 * En «Antes de activar» y «Queda sin completar» del editor del plan de Entrenamiento, un ejercicio con cuatro series sin
 * repeticiones decía cuatro renglones iguales («Serie 1… Serie 2… sin repeticiones fijadas»). Ahora los avisos con el
 * mismo motivo **y el mismo ejercicio** van en uno solo, con el rango («series 1 a 4» o «series 1, 3 y 4»); el grupo se
 * abre y muestra cada uno, con su «Ir a corregir». Un aviso distinto nunca se esconde en un grupo: otro motivo u otro
 * ejercicio es otro renglón.
 *
 * «Completar las cuatro» fija las repeticiones de todas las series del grupo a la vez, y escribe **solo las vacías**:
 * BE no completa nada solo, y lo que el profesional ya escribió no se pisa. Lo que impide activar no cambia.
 */

/** Lo mínimo de un aviso: su código y la ruta a su lugar en el plan. */
export interface AvisoConRuta {
  readonly code: string;
  readonly path: string;
}

export interface GrupoDeAvisos<T extends AvisoConRuta> {
  readonly code: string;
  /** La ruta del ejercicio (`blocks[0].sessions[1].prescriptions[2]`); `null` si el aviso no es de una serie. */
  readonly ejercicio: string | null;
  /** Las series del grupo, desde 0 y en orden. Vacío si el aviso no es de una serie. */
  readonly series: readonly number[];
  readonly avisos: readonly T[];
}

/** Las rutas llegan con corchetes («blocks[0].sessions[1]») o con puntos y su prefijo («changes.blocks.0.sessions.1»). */
const normalizar = (ruta: string): string => ruta.replace(/^changes\./, '').replace(/\.(\d+)/g, '[$1]');
const DE_UNA_SERIE = /^(.*\.prescriptions\[\d+\])\.sets\[(\d+)\](?:\..*)?$/;

/**
 * Agrupa los avisos de series con el mismo código y el mismo ejercicio, en el orden en que aparece el primero de cada
 * grupo. Lo que no es de una serie (un ejercicio sin series, la agenda, el plan) queda solo, como estaba.
 */
export function agruparAvisos<T extends AvisoConRuta>(avisos: readonly T[]): GrupoDeAvisos<T>[] {
  const grupos: { code: string; ejercicio: string | null; series: number[]; avisos: T[] }[] = [];
  const porClave = new Map<string, (typeof grupos)[number]>();
  for (const a of avisos) {
    const m = DE_UNA_SERIE.exec(normalizar(a.path));
    if (!m) {
      grupos.push({ code: a.code, ejercicio: null, series: [], avisos: [a] });
      continue;
    }
    const clave = `${a.code}|${m[1]}`;
    const serie = Number(m[2]);
    const grupo = porClave.get(clave);
    if (grupo) {
      grupo.avisos.push(a);
      if (!grupo.series.includes(serie)) grupo.series.push(serie);
      continue;
    }
    const nuevo = { code: a.code, ejercicio: m[1]!, series: [serie], avisos: [a] };
    porClave.set(clave, nuevo);
    grupos.push(nuevo);
  }
  return grupos.map((g) => ({ ...g, series: [...g.series].sort((x, y) => x - y) }));
}

/**
 * «serie 2», «series 1 a 4», «series 1, 3 y 4» o «series 1 a 3 y 5»: las series (desde 0) dichas desde 1. Tres o más
 * seguidas van como rango; dos seguidas se nombran, que se leen mejor así.
 */
export function seriesEnPalabras(series: readonly number[]): string {
  const n = [...new Set(series)].sort((a, b) => a - b).map((s) => s + 1);
  if (n.length === 0) return '';
  if (n.length === 1) return `serie ${n[0]}`;
  const trozos: string[] = [];
  for (let i = 0; i < n.length; ) {
    let j = i;
    while (j + 1 < n.length && n[j + 1] === n[j]! + 1) j++;
    if (j - i >= 2) trozos.push(`${n[i]} a ${n[j]}`);
    else for (let k = i; k <= j; k++) trozos.push(String(n[k]));
    i = j + 1;
  }
  return `series ${trozos.length === 1 ? trozos[0] : `${trozos.slice(0, -1).join(', ')} y ${trozos[trozos.length - 1]}`}`;
}

const EN_LETRAS = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];

export const COPY_AVISOS_AGRUPADOS = {
  /** «Completar las cuatro»: hasta diez, en letras. */
  completar: (n: number): string => (n === 1 ? 'Completar' : `Completar las ${EN_LETRAS[n] ?? n}`),
  /** La etiqueta del campo que se abre. */
  repeticionesDeLas: (n: number): string => (n === 1 ? 'Repeticiones de la serie' : `Repeticiones de las ${EN_LETRAS[n] ?? n} series`),
  ayuda: 'Un número o un rango, como 8-12. Se escriben solo las series vacías.',
  aplicar: 'Completar',
  cancelar: 'Cancelar',
  noSeEntiende: 'Escribí un número entero o un rango, como 8-12.',
  verCadaUna: (n: number): string => `Ver ${n === 2 ? 'las dos' : `cada una de las ${EN_LETRAS[n] ?? n}`}`,
  ocultar: 'Ocultar',
  /** Lo que dice el aviso de «Deshacer» después de completar. */
  completadas: (series: string, valor: string): string => `${series.charAt(0).toUpperCase()}${series.slice(1)}: ${valor} repeticiones`,
} as const;

/** Las repeticiones de una serie, como las guarda el editor: un número, un rango o nada. */
export type RepeticionesDelGrupo = { readonly value: number } | { readonly min: number; readonly max: number } | null;

/** «10» → `{ value: 10 }`; «8-12» → `{ min: 8, max: 12 }`; otra cosa (o un rango al revés), `null`. */
export function leerLasRepeticiones(texto: string): Exclude<RepeticionesDelGrupo, null> | null {
  const rango = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(texto);
  if (rango) {
    const min = Number(rango[1]);
    const max = Number(rango[2]);
    return min > 0 && min < max ? { min, max } : null;
  }
  const t = texto.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isInteger(n) && n > 0 ? { value: n } : null;
}

/**
 * Escribe las repeticiones en las series del grupo que están vacías, y en ninguna otra. Devuelve las series nuevas y
 * cuáles se escribieron (desde 0). No cambia las que recibe.
 */
export function completarLasVacias<S extends { readonly repetitions?: unknown }>(
  sets: readonly S[],
  series: readonly number[],
  valor: Exclude<RepeticionesDelGrupo, null>,
): { readonly sets: S[]; readonly escritas: number[] } {
  const escritas: number[] = [];
  const nuevas = sets.map((s, n) => {
    if (!series.includes(n) || (s.repetitions !== null && s.repetitions !== undefined)) return s;
    escritas.push(n);
    return { ...s, repetitions: { ...valor } } as S;
  });
  return { sets: nuevas, escritas };
}

/** El lugar de un ejercicio en la estructura, leído de su ruta normalizada. */
export function lugarDelEjercicio(ruta: string): { readonly i: number; readonly j: number | null; readonly k: number; readonly l: number } | null {
  const m = /^blocks\[(\d+)\](?:\.microcycles\[(\d+)\])?\.sessions\[(\d+)\]\.prescriptions\[(\d+)\]$/.exec(normalizar(ruta));
  return m ? { i: Number(m[1]), j: m[2] === undefined ? null : Number(m[2]), k: Number(m[3]), l: Number(m[4]) } : null;
}
