/**
 * La pieza propia de cada tarjeta del Resumen (WP-TABLERO-ALTA-GAMA TB-10; propuesta, R-4, R-5 y R-8), sin React, para
 * probarla sin navegador (`apps/web/test/tarjetas-del-resumen.test.mjs`). Todo sale de lecturas que el Resumen ya hace,
 * salvo los pasos de un área sin plan, que leen sus evaluaciones (una lectura por área sin plan, A15 de la propuesta).
 *
 * - **Nutrición:** de qué están hechos los registros del período, en una barra partida de una sola fuente (la cobertura
 *   de API-PRJ-01) y una sola ventana (el período): con cantidades, sin cantidades y anulados, que no se pisan. Los
 *   rectificados van como cuenta aparte, fuera de la barra, porque ya están dentro de los otros dos.
 * - **Entrenamiento:** en cuántas sesiones del período apareció cada ejercicio, hasta cinco, y después «y N más».
 * - **Un área sin plan:** los tres pasos de «Empezar el plan» (DL-145), con el que toca a la vista.
 *
 * Ubican, no califican: nada se compara con un ideal, ni cambia de color por su valor.
 */
import { COPY_PRIMER_PLAN, numero, type EjercicioDelPeriodo, type ResultadoDeProyeccionNutricional } from '@be/domain';

type Cobertura = ResultadoDeProyeccionNutricional['coverage'];

export type ClaveDelTramo = 'CON_CANTIDADES' | 'SIN_CANTIDADES' | 'ANULADOS';

export interface TramoDeLosRegistros {
  readonly clave: ClaveDelTramo;
  readonly cuenta: number;
  /** La parte del ancho de la barra, de 0 a 1. Los tres suman 1. */
  readonly fraccion: number;
  /** «301 con cantidades»: la cifra y lo que cuenta, con las palabras de la cobertura. */
  readonly cifra: string;
  readonly texto: string;
}

export interface LosRegistrosDelPeriodo {
  /** Solo los tramos con algo: uno vacío no ocupa lugar ni se nombra. */
  readonly tramos: readonly TramoDeLosRegistros[];
  /** Los rectificados, que cuentan una sola vez: ya están en los tramos. */
  readonly rectificados: number;
  /** Las comidas del plan de los días con registros, sin hoy (DL-153): cuántas tienen registro, de cuántas, en cuántos días. */
  readonly comidas: { readonly conRegistro: number; readonly indicadas: number; readonly dias: number } | null;
}

const TEXTO_DEL_TRAMO: Readonly<Record<ClaveDelTramo, readonly [string, string]>> = {
  CON_CANTIDADES: ['con cantidades', 'con cantidades'],
  SIN_CANTIDADES: ['sin cantidades', 'sin cantidades'],
  ANULADOS: ['anulado, fuera de los totales', 'anulados, fuera de los totales'],
};

/** La barra partida de Nutrición. `null` sin ningún registro en el período: lo dice la cobertura, sin una barra vacía. */
export function losRegistrosDelPeriodo(c: Cobertura | null): LosRegistrosDelPeriodo | null {
  if (!c) return null;
  const cuentas: readonly [ClaveDelTramo, number][] = [
    ['CON_CANTIDADES', c.recordsWithQuantities],
    ['SIN_CANTIDADES', c.recordsWithoutQuantities],
    ['ANULADOS', c.annulledExcluded],
  ];
  const total = cuentas.reduce((s, [, n]) => s + n, 0);
  if (total === 0) return null;
  const indicadas = c.planMeals.expected;
  return {
    tramos: cuentas
      .filter(([, n]) => n > 0)
      .map(([clave, n]) => ({ clave, cuenta: n, fraccion: n / total, cifra: numero(n), texto: (TEXTO_DEL_TRAMO[clave] as readonly [string, string])[n === 1 ? 0 : 1] })),
    rectificados: c.rectifiedCountedOnce,
    comidas: indicadas > 0 ? { conRegistro: indicadas - c.planMeals.withoutRecord, indicadas, dias: c.planMeals.daysKnown } : null,
  };
}

/** «Comidas del plan con registro: 312 de 344, en 86 días, sin hoy». */
export const textoDeLasComidas = (c: NonNullable<LosRegistrosDelPeriodo['comidas']>): string =>
  `Comidas del plan con registro: ${numero(c.conRegistro)} de ${numero(c.indicadas)}, en ${c.dias === 1 ? 'un día' : `${numero(c.dias)} días`} con registros, sin hoy`;

/** «4 rectificados, contados una vez»: las palabras de la cobertura del área. */
export const textoDeLosRectificados = (n: number): string => `${numero(n)} ${n === 1 ? 'rectificado, contado una vez' : 'rectificados, contados una vez'}`;

/** Cuántos ejercicios se nombran antes de «y N más» (A9 de la propuesta). */
export const EJERCICIOS_A_LA_VISTA = 5;

export interface SesionesDeUnEjercicio {
  readonly clave: string;
  readonly nombre: string;
  readonly sesiones: number;
  readonly ultima: string | null;
  /** El largo de la barra, de 0 a 1: contra el ejercicio con más sesiones de los que se muestran. */
  readonly fraccion: number;
}

/**
 * Las sesiones por ejercicio del período, de API-PRJ-01 (`exercises[].sessions`), que el Resumen ya lee. Van de más a
 * menos sesiones y, con las mismas, por nombre (TA-18): el orden del plan pide leer el plan. Un ejercicio sin sesiones en
 * el período no se nombra.
 */
export function sesionesPorEjercicio(ejercicios: readonly EjercicioDelPeriodo[] | null, tope = EJERCICIOS_A_LA_VISTA): { readonly filas: readonly SesionesDeUnEjercicio[]; readonly mas: number } | null {
  if (!ejercicios) return null;
  const con = [...ejercicios].filter((e) => e.sessions > 0).sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name, 'es'));
  if (con.length === 0) return null;
  const vistos = con.slice(0, tope);
  const maximo = Math.max(...vistos.map((e) => e.sessions));
  return {
    filas: vistos.map((e) => ({ clave: e.exerciseKey, nombre: e.name, sesiones: e.sessions, ultima: e.lastDate, fraccion: e.sessions / maximo })),
    mas: con.length - vistos.length,
  };
}

export type EstadoDelPaso = 'listo' | 'ahora' | 'despues';

export interface PasoDelPrimerPlan {
  readonly numero: 1 | 2 | 3;
  readonly titulo: string;
  readonly estado: EstadoDelPaso;
  /** Debajo del título: «Registrada el 3 nov», «Ahora», «Después de la evaluación». */
  readonly detalle: string;
}

/**
 * Los tres pasos de «Empezar el plan», en miniatura, con la misma regla que el Plan del área (`primer-plan.tsx`): el plan
 * nace de un objetivo y el objetivo, de una evaluación. `evaluacion`: el día de la última evaluación registrada, `false`
 * si no hay, o `null` mientras se lee (los pasos se dicen sin estado hasta saberlo).
 */
export function pasosDelPrimerPlan(evaluacion: string | false | null, objetivoDesde: string | null): readonly PasoDelPrimerPlan[] {
  const hayEvaluacion = typeof evaluacion === 'string';
  const evaluacionLista = hayEvaluacion || objetivoDesde !== null;
  const objetivo: EstadoDelPaso = objetivoDesde ? 'listo' : hayEvaluacion ? 'ahora' : 'despues';
  return [
    {
      numero: 1,
      titulo: COPY_PRIMER_PLAN.pasoEvaluacion,
      estado: evaluacion === null && !objetivoDesde ? 'despues' : evaluacionLista ? 'listo' : 'ahora',
      detalle: evaluacion === null && !objetivoDesde ? 'Leyendo…' : hayEvaluacion ? COPY_PRIMER_PLAN.evaluacionLista(evaluacion) : evaluacionLista ? COPY_PRIMER_PLAN.pasoListo : 'Ahora',
    },
    {
      numero: 2,
      titulo: COPY_PRIMER_PLAN.pasoObjetivo,
      estado: objetivo,
      detalle: objetivoDesde ? COPY_PRIMER_PLAN.objetivoListo(objetivoDesde) : objetivo === 'ahora' ? 'Ahora' : COPY_PRIMER_PLAN.despuesDeLaEvaluacion,
    },
    { numero: 3, titulo: COPY_PRIMER_PLAN.pasoPlan, estado: objetivoDesde ? 'ahora' : 'despues', detalle: objetivoDesde ? 'Ahora' : COPY_PRIMER_PLAN.despuesDelObjetivo },
  ];
}
