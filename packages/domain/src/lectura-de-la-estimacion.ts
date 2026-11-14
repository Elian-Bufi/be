/**
 * El ruido de la estimación de fuerza (DL-174; GR-02, GR-24 y SP-01): cómo leer el 1RM estimado de cada versión del
 * plan sin confundir lo que cambió en lo indicado con un cambio de la fuerza. Nunca «±», nunca porcentaje y nunca la
 * comparación del primer punto con el último.
 *
 * - Cada punto va a la versión que regía ese día (las bandas), porque el punto de fuerza no trae su versión.
 * - `diferenciaEntreSesiones` (GR-T16): la mayor diferencia entre estimaciones seguidas del núcleo dentro de una misma
 *   versión, con cuatro sesiones o más; si no, `null`, y el texto dice que todavía no alcanza.
 */
import type { VigenciaDePlan } from './contratos-analisis';
import type { PuntoDeFuerza } from './contratos-fuerza';

/** Con menos sesiones del núcleo en una versión, la diferencia entre sesiones no se dice. */
export const SESIONES_PARA_LEER_LA_DIFERENCIA = 4;

export interface LecturaDelTramoDeFuerza {
  /** Las sesiones de la persona en la versión (lo observado por el profesional no cuenta). */
  readonly sesiones: number;
  readonly medianaDelRir: number | null;
  readonly repeticiones: { readonly desde: number; readonly hasta: number } | null;
  /** «Entre sesiones de la misma versión aparecen diferencias de hasta X kg», en la unidad de los puntos. */
  readonly diferenciaEntreSesiones: number | null;
}

/** Lo indicado para la serie en una versión: el RIR y las repeticiones, como valor o como rango. */
export interface ObjetivoDeLaSerie {
  readonly rir: { readonly desde: number; readonly hasta: number } | null;
  readonly repeticiones: { readonly desde: number; readonly hasta: number } | null;
}

function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** Si una fecha civil cae en la banda: desde su primer día y antes del día del corte (ese día ya rige la siguiente). */
const enLaBanda = (fecha: string, b: Pick<VigenciaDePlan, 'from' | 'to'>): boolean => fecha >= b.from && (b.to === null || fecha < b.to);

/**
 * La lectura de cada versión del plan de Entrenamiento con puntos en el período, en el orden de las bandas. Los puntos
 * tienen que ser de una sola unidad (kg y lb nunca van juntas); los de otra área o sin banda no cuentan.
 */
export function lecturaPorVersion(puntos: readonly PuntoDeFuerza[], bandas: readonly VigenciaDePlan[]): readonly (LecturaDelTramoDeFuerza & { readonly planVersionId: string })[] {
  const deLaPersona = puntos.filter((p) => p.source === 'PERSON');
  return bandas
    .filter((b) => b.domain === 'TRAINING')
    .flatMap((b) => {
      const propios = deLaPersona.filter((p) => enLaBanda(p.date, b)).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
      if (propios.length === 0) return [];
      const reps = propios.map((p) => p.estimate.completedRepetitions);
      const nucleo = propios.filter((p) => p.estimate.band === 'CORE');
      let diferencia: number | null = null;
      if (nucleo.length >= SESIONES_PARA_LEER_LA_DIFERENCIA) {
        diferencia = 0;
        for (let i = 1; i < nucleo.length; i++) diferencia = Math.max(diferencia, Math.abs(nucleo[i].estimate.value - nucleo[i - 1].estimate.value));
        diferencia = Math.round(diferencia * 10) / 10;
      }
      return [
        {
          planVersionId: b.planVersionId,
          sesiones: propios.length,
          medianaDelRir: mediana(propios.map((p) => p.estimate.rir)),
          repeticiones: { desde: Math.min(...reps), hasta: Math.max(...reps) },
          diferenciaEntreSesiones: diferencia,
        },
      ];
    });
}

const rango = (r: { readonly desde: number; readonly hasta: number } | null): string => (r === null ? 'sin indicar' : r.desde === r.hasta ? String(r.desde) : `entre ${r.desde} y ${r.hasta}`);
const iguales = (a: ObjetivoDeLaSerie['rir'], b: ObjetivoDeLaSerie['rir']): boolean => (a === null || b === null ? a === b : a.desde === b.desde && a.hasta === b.hasta);

/**
 * Lo que cambió en lo indicado entre dos versiones, dicho en la primera línea del gráfico: «el RIR indicado pasó de 2 a
 * 1: la estimación cambia aunque la fuerza no». `null` si no cambió nada que mueva la estimación.
 */
export function cambioDeLoIndicado(a: ObjetivoDeLaSerie | null, b: ObjetivoDeLaSerie | null): string | null {
  if (a === null || b === null) return null;
  const partes: string[] = [];
  if (!iguales(a.rir, b.rir)) partes.push(`el RIR indicado pasó de ${rango(a.rir)} a ${rango(b.rir)}`);
  if (!iguales(a.repeticiones, b.repeticiones)) partes.push(`las repeticiones indicadas pasaron de ${rango(a.repeticiones)} a ${rango(b.repeticiones)}`);
  return partes.length === 0 ? null : `${partes.join('; ')}: la estimación cambia aunque la fuerza no`;
}
