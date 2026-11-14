/**
 * La geometría de «Superpuestas» en SVG propio (GR-26; WP-GRAFICOS fase 2, DL-174), para «Patrones» y el compositor:
 * hasta tres series en el mismo gráfico, sobre el eje de fechas común, con uno o dos ejes verticales (uno a cada lado).
 *
 * - **La escala de cada eje es la de «Alineadas»** (`extremosDelCarril` con la escala del carril): no se elige a mano ni
 *   se estira para que las líneas se crucen. Dos series en el mismo eje comparten familia y unidad (DL-126).
 * - **Cada eje lleva su rótulo:** el nombre corto de sus series y la unidad. El nombre de cada serie va además al final
 *   de su línea, separado de los otros si terminan cerca: el color nunca es lo único.
 * - **Las mismas reglas de los carriles:** la línea une solo puntos del mismo tramo, un hueco la corta y Antropometría
 *   no une nada (`unir: false`). No se sombrea entre líneas ni se marcan cruces.
 *
 * Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs`.
 */
import { AIRE_DEL_CARRIL, extremosDelCarril, lineasDelCarril, type CarrilDePuntos, type MarcaUbicada, type PuntoDelCarril } from '../carriles';
import type { EscalaDeFechas } from '../eje-de-fechas';
import type { Lado } from './compositor';

export interface MarcaDelEje {
  readonly valor: number;
  readonly y: number;
}

export interface EjeSuperpuesto {
  readonly lado: Lado;
  readonly unidad: string;
  /** Los nombres de las series de este eje, en su orden: van en el rótulo con la unidad. */
  readonly nombres: readonly string[];
  /** Los índices de color de esas series (el glifo del rótulo). */
  readonly indices: readonly number[];
  readonly extremos: { readonly abajo: number; readonly arriba: number; readonly decimales: number };
  readonly marcas: readonly MarcaDelEje[];
  /** «Carbohidratos · g»: el rótulo del eje, con el nombre corto de sus series y la unidad. */
  readonly rotulo: string;
}

export interface SerieSuperpuesta {
  readonly id: string;
  readonly indice: number;
  readonly lado: Lado;
  readonly lineas: readonly (readonly { readonly x: number; readonly y: number }[])[];
  readonly marcas: readonly MarcaUbicada[];
  /** El nombre al final de la línea, en el margen derecho; `null` si la serie no tiene ningún punto a la vista. */
  readonly rotulo: { readonly texto: string; readonly x: number; readonly y: number } | null;
  readonly fueraDeLaEscala: number;
}

export interface GeometriaSuperpuesta {
  readonly ejes: readonly EjeSuperpuesto[];
  readonly series: readonly SerieSuperpuesta[];
}

/** La separación mínima entre los nombres del final de las líneas, para que no se pisen (la letra es de 12,5 px). */
export const SEPARACION_DE_LOS_NOMBRES = 16;

const conValor = (p: PuntoDelCarril): p is PuntoDelCarril & { readonly valor: number } => p.valor !== null && Number.isFinite(p.valor);

/**
 * La geometría de las series superpuestas, en una caja de `alto` píxeles. `lados` dice de qué lado va cada carril (en su
 * orden); `nombresCortos`, cómo se llama cada uno en el rótulo de su eje y al final de su línea. `finDeLasLineas` es la x
 * del margen donde empiezan los nombres.
 */
export function geometriaSuperpuesta(
  carriles: readonly CarrilDePuntos[],
  lados: readonly Lado[],
  nombresCortos: readonly string[],
  escala: EscalaDeFechas,
  alto: number,
  finDeLasLineas: number,
): GeometriaSuperpuesta {
  const util = Math.max(1, alto - 2 * AIRE_DEL_CARRIL);
  const visibles = (ps: readonly PuntoDelCarril[]) => ps.filter((p) => p.fecha >= escala.desde && p.fecha <= escala.hasta);
  const ejes: EjeSuperpuesto[] = [];
  const yDelEje = new Map<Lado, (v: number) => number>();
  for (const lado of ['IZQUIERDA', 'DERECHA'] as const) {
    const delLado = carriles.map((c, i) => ({ c, i })).filter(({ i }) => (lados[i] ?? 'IZQUIERDA') === lado);
    const primero = delLado[0];
    if (!primero) continue;
    const valores = delLado.flatMap(({ c }) => [...visibles(c.puntos).filter(conValor).map((p) => p.valor), ...c.escalones.map((e) => e.valor)]);
    // La escala de «Alineadas»: la del carril (el mismo rango mínimo, los enteros y el cero del RIR).
    const extremos = extremosDelCarril(valores, primero.c.unidad, primero.c.escala);
    const y = (v: number): number => AIRE_DEL_CARRIL + util - ((v - extremos.abajo) / (extremos.arriba - extremos.abajo || 1)) * util;
    yDelEje.set(lado, y);
    const paso = (extremos.arriba - extremos.abajo) / 2;
    const nombres = delLado.map(({ i }) => nombresCortos[i] ?? carriles[i]?.nombre ?? '');
    ejes.push({
      lado,
      unidad: primero.c.unidad,
      nombres,
      indices: delLado.map(({ c }) => c.indice),
      extremos,
      marcas: [extremos.abajo, extremos.abajo + paso, extremos.arriba].map((valor) => ({ valor, y: y(valor) })),
      rotulo: `${nombres.join(' y ')} · ${primero.c.unidad}`,
    });
  }
  const sinSeparar = carriles.map((c, i): SerieSuperpuesta => {
    const lado = lados[i] ?? 'IZQUIERDA';
    const eje = ejes.find((e) => e.lado === lado);
    const y = yDelEje.get(lado) ?? ((v: number) => v);
    const extremos = eje?.extremos ?? { abajo: 0, arriba: 1, decimales: 0 };
    const acotada = (v: number): number => y(Math.min(Math.max(v, extremos.abajo), extremos.arriba));
    const puntos = visibles(c.puntos);
    const marcas = puntos.filter(conValor).map((p): MarcaUbicada => ({ clave: p.clave, x: escala.xDePunto(p), y: acotada(p.valor), marca: p.marca, tarde: p.tarde, yHasta: null }));
    const lineas = c.unir ? lineasDelCarril(puntos).map((l) => l.filter(conValor).map((p) => ({ x: escala.xDePunto(p), y: acotada(p.valor) }))) : [];
    const ultimo = [...marcas].sort((a, b) => a.x - b.x).pop();
    return {
      id: c.id,
      indice: c.indice,
      lado,
      lineas,
      marcas,
      rotulo: ultimo ? { texto: nombresCortos[i] ?? c.nombre, x: finDeLasLineas, y: ultimo.y } : null,
      fueraDeLaEscala: puntos.filter((p) => conValor(p) && (p.valor < extremos.abajo || p.valor > extremos.arriba)).length,
    };
  });
  // Los nombres que caen cerca se separan en vertical, en el orden en que quedan, sin salirse de la caja.
  const conRotulo = sinSeparar.map((s, i) => ({ s, i })).filter(({ s }) => s.rotulo !== null).sort((a, b) => (a.s.rotulo?.y ?? 0) - (b.s.rotulo?.y ?? 0));
  const corridos = new Map<number, number>();
  let anterior = -Infinity;
  for (const { s, i } of conRotulo) {
    const y = Math.min(Math.max(s.rotulo?.y ?? 0, anterior + SEPARACION_DE_LOS_NOMBRES), alto - AIRE_DEL_CARRIL / 2);
    corridos.set(i, y);
    anterior = y;
  }
  const series = sinSeparar.map((s, i) => (s.rotulo ? { ...s, rotulo: { ...s.rotulo, y: corridos.get(i) ?? s.rotulo.y } } : s));
  return { ejes, series };
}
