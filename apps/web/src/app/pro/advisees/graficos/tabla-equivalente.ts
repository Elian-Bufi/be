/**
 * La tabla equivalente de un gráfico (WP-GRAFICOS fase 2, DL-174): una fila por fecha con alguna observación, una columna
 * por carril, y cada celda con su valor, su unidad y su marca. Las mismas filas alimentan la lectura de la fecha elegida
 * y el resumen en texto: el dibujo, la lectura y la tabla no pueden decir cosas distintas. Los tramos sin registros se
 * dicen como texto («del 3 al 7/11, sin registros»), no como filas vacías.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs`.
 */
import type { MarcaSemantica } from '@be/domain';
import type { Carril, CarrilDePuntos } from './carriles';
import { textoDeLaMarca } from './eje-de-fechas';

export interface CeldaDeLaTabla {
  /** Lo que dice la celda: la lectura del punto («96 kg · 5 rep · RIR 1»), con lo indicado y lo cargado después. */
  readonly texto: string;
  readonly marca: MarcaSemantica | null;
  readonly tarde: boolean;
}

export interface FilaDeLaTabla {
  readonly fecha: string;
  /** Una celda por columna, en el orden de `columnas`; `null` si ese carril no tiene nada esa fecha. */
  readonly celdas: readonly (CeldaDeLaTabla | null)[];
}

export interface FilasDeLaTabla {
  readonly columnas: readonly { readonly id: string; readonly nombre: string; readonly unidad: string }[];
  readonly filas: readonly FilaDeLaTabla[];
  /** «del 3 al 7/11, sin registros», en orden. */
  readonly sinRegistros: readonly string[];
}

export const TEXTO_SIN_DATO = 'sin dato';

function celdaDe(c: CarrilDePuntos, fecha: string): CeldaDeLaTabla | null {
  const registrados = c.puntos.filter((p) => p.fecha === fecha && p.valor !== null);
  const indicados = c.indicado.filter((p) => p.fecha === fecha && (p.valor !== null || p.rango !== null));
  if (registrados.length === 0 && indicados.length === 0) return null;
  const partes = [
    ...registrados.map((p) => (p.tarde ? `${p.lectura} (cargado después)` : p.lectura)),
    ...indicados.map((p) => `indicado: ${p.lectura}`),
  ];
  const primera = registrados[0] ?? indicados[0];
  return { texto: partes.join(' · '), marca: primera.marca, tarde: registrados.some((p) => p.tarde) };
}

/** Los días seguidos sin registros en todos los carriles de puntos, dichos como texto. */
function tramosSinRegistros(carriles: readonly CarrilDePuntos[]): string[] {
  if (carriles.length === 0) return [];
  const estados = new Map<string, boolean>();
  for (const c of carriles) for (const d of c.cobertura) estados.set(d.fecha, (estados.get(d.fecha) ?? true) && d.estado === 'sin');
  const dias = [...estados.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  const textos: string[] = [];
  let inicio: string | null = null;
  let fin: string | null = null;
  const cerrar = () => {
    if (inicio !== null && fin !== null) textos.push(inicio === fin ? `el ${textoDeLaMarca(inicio)}, sin registros` : `del ${textoDeLaMarca(inicio)} al ${textoDeLaMarca(fin)}, sin registros`);
    inicio = null;
    fin = null;
  };
  for (const [fecha, sin] of dias) {
    if (sin) {
      if (inicio === null) inicio = fecha;
      fin = fecha;
    } else cerrar();
  }
  cerrar();
  return textos;
}

/** La tabla de un gráfico. Los carriles de eventos (la cinta) no son columnas: tienen su propia lista. */
export function tablaEquivalente(carriles: readonly Carril[]): FilasDeLaTabla {
  const columnas = carriles.filter((c): c is Exclude<Carril, { tipo: 'EVENTOS' }> => c.tipo !== 'EVENTOS');
  const fechas = new Set<string>();
  for (const c of columnas) {
    if (c.tipo === 'PUNTOS') for (const p of [...c.puntos, ...c.indicado]) if (p.valor !== null || p.rango !== null) fechas.add(p.fecha);
    if (c.tipo === 'BARRAS_SEMANALES') for (const s of c.semanas) if (s.valor !== null) fechas.add(s.lunes);
  }
  const filas = [...fechas].sort().map((fecha) => ({
    fecha,
    celdas: columnas.map((c): CeldaDeLaTabla | null => {
      if (c.tipo === 'PUNTOS') return celdaDe(c, fecha);
      const s = c.semanas.find((x) => x.lunes === fecha && x.valor !== null);
      return s ? { texto: s.lectura, marca: 'LLENA', tarde: false } : null;
    }),
  }));
  return {
    columnas: columnas.map((c) => ({ id: c.id, nombre: c.nombre, unidad: c.unidad })),
    filas,
    sinRegistros: tramosSinRegistros(columnas.filter((c): c is CarrilDePuntos => c.tipo === 'PUNTOS')),
  };
}

/** La lectura de una fecha, carril por carril: «Carga: 80 kg · RIR 1», o «sin dato». La comparten la lectura y la tabla. */
export function lecturaDeLaFecha(tabla: FilasDeLaTabla, fecha: string): readonly { readonly nombre: string; readonly texto: string }[] {
  const fila = tabla.filas.find((f) => f.fecha === fecha);
  return tabla.columnas.map((c, i) => ({ nombre: c.nombre, texto: fila?.celdas[i]?.texto ?? TEXTO_SIN_DATO }));
}
