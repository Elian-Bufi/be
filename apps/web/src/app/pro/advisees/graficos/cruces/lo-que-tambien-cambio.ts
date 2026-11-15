/**
 * Lo que también cambió en la ventana de un cruce o entre dos etapas (WP-GRAFICOS fase 2, DL-174; regla de honestidad
 * 1: coincidir no es causar). Dos listas, siempre a la vista:
 * - **lo que BE sabe que cambió:** las versiones de los planes de las áreas permitidas que se activaron en el tramo y lo
 *   que indicaba el plan de entrenamiento para el ejercicio (el RIR y las repeticiones), versión por versión;
 * - **lo que BE no registra y también pudo cambiar:** el sueño, el aprendizaje técnico, el agua, el ciclo menstrual…
 *   dicho como lista fija de cada cruce, para que la falta de un dato no se lea como «no cambió».
 *
 * Lo indicado de cada versión sale de las prescripciones de las sesiones registradas (API-TRN-21, en tramos de 92 días;
 * GR-T54): el criterio de intensidad RIR y las repeticiones del ejercicio. Nunca de la versión vigente hoy.
 *
 * Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs`.
 */
import { cambioDeLoIndicado, type DominioDeAnalisis, type EjecucionDeEntrenamiento, type EtapaDePlanificacion, type ObjetivoDeLaSerie, type VigenciaDePlan } from '@be/domain';
import { diaYMes } from './ventanas';

const NOMBRE_DEL_DOMINIO: Readonly<Record<DominioDeAnalisis, string>> = { NUTRITION: 'Nutrición', TRAINING: 'Entrenamiento', ANTHROPOMETRY: 'Antropometría' };

/** «v3» → «3». */
export const numeroDeVersion = (label: string): string => label.replace(/^v/, '');

/** Si una fecha cae en la vigencia: desde su primer día y antes del día del corte (ese día ya rige la siguiente). */
export const enLaVigencia = (fecha: string, v: Pick<VigenciaDePlan, 'from' | 'to'>): boolean => fecha >= v.from && (v.to === null || fecha < v.to);

/**
 * Las versiones de los planes que se activaron dentro del tramo (después de su primer día y hasta su último), de las
 * áreas que se leyeron: «Nutrición: se activó la versión 3 el 4/10». Contexto temporal, no causa.
 */
export function versionesQueSeActivaron(vigencias: readonly VigenciaDePlan[], desde: string, hasta: string): string[] {
  return [...vigencias]
    .filter((v) => v.from > desde && v.from <= hasta)
    .sort((a, b) => a.from.localeCompare(b.from))
    .map((v) => `${NOMBRE_DEL_DOMINIO[v.domain]}: se activó la versión ${numeroDeVersion(v.label)} el ${diaYMes(v.from)}`);
}

/**
 * Lo que también cambió entre dos etapas de «Comparar dos etapas» (GR-24 en «Analizar»): las versiones de los planes
 * propios que se activaron después del primer día de A y hasta el último de B, sin contar A ni B. Sale de las etapas del
 * último año de las dos áreas (las que lee «Analizar» para elegir las etapas), no de las versiones del período de la
 * ficha: dos etapas de hace meses quedan fuera de ese período, y lo que se activó entre ellas no se veía. Un área sin
 * acceso no tiene etapas y no aparece.
 */
export function versionesEntreLasEtapas(
  etapas: readonly Pick<EtapaDePlanificacion, 'planVersionId' | 'dominio' | 'etiqueta' | 'desde'>[],
  a: Pick<EtapaDePlanificacion, 'planVersionId' | 'desde'>,
  b: Pick<EtapaDePlanificacion, 'planVersionId'>,
  hasta: string,
): string[] {
  return [...etapas]
    .filter((e) => e.planVersionId !== a.planVersionId && e.planVersionId !== b.planVersionId && e.desde > a.desde && e.desde <= hasta)
    .sort((x, y) => x.desde.localeCompare(y.desde) || x.dominio.localeCompare(y.dominio))
    .map((e) => `${NOMBRE_DEL_DOMINIO[e.dominio]}: se activó la versión ${numeroDeVersion(e.etiqueta)} el ${diaYMes(e.desde)}`);
}

/**
 * Lo que cambió en lo indicado para el ejercicio entre las dos etapas, en una línea de «Lo que también cambió» (la pasada
 * visual, DISENO-VISUAL §2 «D»): «Lo indicado para Sentadilla trasera con barra: de 4 a 3 repeticiones (de la versión 7 a
 * la 8)». Entre dos versiones seguidas no se activó otra, pero el plan sí cambió lo que pedía, y eso mueve lo registrado y
 * la estimación aunque la fuerza no cambie (§5.12): antes la lista decía que no había otro cambio. `cambio` es el corto
 * de `cambioCortoDeLoIndicado` (con lo indicado de las sesiones que ejecutaron cada versión); `null` si no cambió o no se
 * sabe.
 */
export function cambioDeLoIndicadoEntreLasEtapas(
  cambio: string | null,
  ejercicio: string,
  a: Pick<EtapaDePlanificacion, 'etiqueta'>,
  b: Pick<EtapaDePlanificacion, 'etiqueta'>,
): string | null {
  return cambio === null ? null : `Lo indicado para ${ejercicio}: ${cambio} (de la versión ${numeroDeVersion(a.etiqueta)} a la ${numeroDeVersion(b.etiqueta)})`;
}

type Rango = { readonly desde: number; readonly hasta: number };
const unir = (a: Rango | null, desde: number, hasta: number): Rango => (a === null ? { desde, hasta } : { desde: Math.min(a.desde, desde), hasta: Math.max(a.hasta, hasta) });

/**
 * Lo indicado para el ejercicio en cada versión del plan de entrenamiento: el RIR del criterio de intensidad y las
 * repeticiones de sus series, como valor o como rango, de las prescripciones de las sesiones registradas en esa versión.
 * Cada sesión va a la versión que ejecutó (su `planId`, la instantánea que la rigió: REG-06-105), aunque se haya
 * registrado después; si esa versión no está entre las bandas leídas, a la que regía su fecha. Una versión sin sesiones
 * del ejercicio no tiene entrada.
 */
export function objetivosPorVersion(ejecuciones: readonly EjecucionDeEntrenamiento[], exerciseId: string, bandas: readonly VigenciaDePlan[]): ReadonlyMap<string, ObjetivoDeLaSerie> {
  const deEntrenamiento = bandas.filter((b) => b.domain === 'TRAINING');
  const acumulado = new Map<string, { rir: Rango | null; repeticiones: Rango | null }>();
  for (const x of ejecuciones) {
    const banda = deEntrenamiento.find((b) => b.planVersionId === x.planId) ?? deEntrenamiento.find((b) => enLaVigencia(x.date, b));
    if (!banda) continue;
    for (const p of x.plannedSession.prescriptions) {
      if (p.exerciseId !== exerciseId) continue;
      const actual = acumulado.get(banda.planVersionId) ?? { rir: null, repeticiones: null };
      let rir = actual.rir;
      let repeticiones = actual.repeticiones;
      if (p.intensity?.criterion === 'RIR') rir = unir(rir, p.intensity.target.value, p.intensity.target.value);
      for (const s of p.sets) {
        if (!s.repetitions) continue;
        repeticiones = 'value' in s.repetitions ? unir(repeticiones, s.repetitions.value, s.repetitions.value) : unir(repeticiones, s.repetitions.min, s.repetitions.max);
      }
      acumulado.set(banda.planVersionId, { rir, repeticiones });
    }
  }
  return acumulado;
}

/**
 * Lo que cambió en lo indicado, versión a versión, dentro del tramo: «Con la versión 4 del plan de entrenamiento (desde
 * el 2/10), el RIR indicado pasó de 2 a 1: la estimación puede cambiar aunque la fuerza no cambie». Va en la primera línea.
 */
export function cambiosDeLoIndicado(objetivos: ReadonlyMap<string, ObjetivoDeLaSerie>, bandas: readonly VigenciaDePlan[], desde: string, hasta: string): string[] {
  const deEntrenamiento = [...bandas].filter((b) => b.domain === 'TRAINING').sort((a, b) => a.from.localeCompare(b.from));
  const cambios: string[] = [];
  for (let i = 1; i < deEntrenamiento.length; i++) {
    const anterior = deEntrenamiento[i - 1] as VigenciaDePlan;
    const esta = deEntrenamiento[i] as VigenciaDePlan;
    if (esta.from <= desde || esta.from > hasta) continue;
    const cambio = cambioDeLoIndicado(objetivos.get(anterior.planVersionId) ?? null, objetivos.get(esta.planVersionId) ?? null);
    if (cambio) cambios.push(`Con la versión ${numeroDeVersion(esta.label)} del plan de entrenamiento (desde el ${diaYMes(esta.from)}), ${cambio}.`);
  }
  return cambios;
}

/** Lo que BE no registra y también pudo cambiar en la ventana, por gráfico (la lista fija de la propuesta). */
export const LO_QUE_BE_NO_REGISTRA = {
  'GR-24': [
    'el aprendizaje técnico del ejercicio',
    'otro cambio en el día a día que el plan no dice',
    'el sueño y el descanso, que BE no registra',
  ],
  'SP-01': [
    'la fase del plan y una descarga, si las hubo: BE no las infiere',
    'el peso, que este cruce no lee',
    'el aprendizaje técnico del ejercicio',
    'el sueño, que BE no registra',
  ],
  'SP-02': [
    'lo que no se registró: lo registrado puede no ser todo lo comido',
    'el agua y el glucógeno, que cambian el peso al cambiar los carbohidratos',
    'el ciclo menstrual',
    'la actividad fuera del gimnasio',
    'la hora y las condiciones de cada toma',
    'el error de medición de quien mide',
  ],
} as const satisfies Readonly<Record<string, readonly string[]>>;
