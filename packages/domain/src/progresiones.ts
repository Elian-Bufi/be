/**
 * WP-EDITOR-ENTRENAMIENTO parte B (DEUDA_LEGAJO DL-196; E12, E18 y E19) · las progresiones y las descargas de una fase,
 * sin React, para el editor del website, sus gráficos y sus pruebas (`progresiones.test.ts`).
 *
 * - **Es una regla de la fase, no series nuevas** (EE-D30): la sesión es la misma todas las semanas de su fase; la regla
 *   dice cómo cambia la carga de trabajo semana a semana y se lee encima. Se guarda en la planificación de la versión
 *   (`progressions`), como las semanas de cada fase.
 * - **Cuatro piezas, sin abrumar:** lineal, doble progresión, ondulante (pesada, liviana y media) y la semana de descarga,
 *   que se combina con cualquiera de las tres o va sola.
 * - **Las cargas propuestas se redondean como las aproximaciones** (EE-D03): al paso del implemento, sin decimales raros.
 * - **Todo «%» lleva su base:** «% de la carga de trabajo».
 * - Nada de esto escribe en el plan: el editor guarda la regla con el clic del profesional.
 */
import type { PlanificacionDelPlan, ProgresionDeLaFase } from './contratos-entrenamiento';
import { numero } from './formato-numeros';
import { redondearAlPaso, sumarDias } from './planificacion-del-plan';
import { diasEntreFechas } from './fechas-civiles';

export type ModeloDeProgresion = NonNullable<ProgresionDeLaFase['model']>;

/** Las tres semanas de la ondulante, en el orden en que se repiten. */
export type OlaDeLaSemana = 'PESADA' | 'LIVIANA' | 'MEDIA';
const OLAS: readonly OlaDeLaSemana[] = ['PESADA', 'LIVIANA', 'MEDIA'];

/** Las partes de la carga de trabajo de la ondulante por omisión: pesada 100 %, liviana 80 % y media 90 %. */
export const OLAS_POR_OMISION: readonly [number, number, number] = [100, 80, 90];
/** La descarga por omisión: la carga baja al 60 % de la carga de trabajo de la semana anterior, o dos series menos. */
export const DESCARGA_POR_OMISION = { mode: 'LOAD', workingLoadShare: 60, setsRemoved: 2 } as const;

/** Lo que cada modelo trae de entrada al elegirlo en el asistente. */
export function progresionPorOmision(blockId: string, modelo: ModeloDeProgresion | null, paso: number): ProgresionDeLaFase {
  return {
    blockId,
    model: modelo,
    loadStep: modelo === 'LINEAR' || modelo === 'DOUBLE' ? paso : null,
    repStep: modelo === 'LINEAR' ? 0 : null,
    repRange: modelo === 'DOUBLE' ? { min: 8, max: 12 } : null,
    waves: modelo === 'UNDULATING' ? [...OLAS_POR_OMISION] : null,
    deload: null,
    prescriptionIds: null,
  };
}

/** Lo que la regla necesita de un ejercicio: su carga de trabajo, sus repeticiones, sus series efectivas y su paso. */
export interface BaseDelEjercicio {
  /** La carga de trabajo (la común de las efectivas); `null` si no tiene. */
  readonly carga: number | null;
  readonly unidad: 'kg' | 'lb';
  /** Las repeticiones de las efectivas (la cifra, o el piso de un rango); `null` si no dice. */
  readonly repeticiones: number | null;
  /** Cuántas series efectivas tiene (las aproximaciones no cuentan). */
  readonly series: number;
  /** El paso del redondeo (EE-D03). */
  readonly paso: number;
}

/** Una semana de la fase para un ejercicio, con la regla aplicada. */
export interface SemanaDeLaProgresion {
  /** 1 es la primera semana de la fase. */
  readonly semana: number;
  readonly carga: number | null;
  readonly repeticiones: number | null;
  readonly series: number;
  readonly descarga: boolean;
  readonly ola: OlaDeLaSemana | null;
}

/** Si la regla toca ese ejercicio: toda la fase, o los elegidos. */
export const seAplicaA = (p: ProgresionDeLaFase, prescriptionId: string | null | undefined): boolean =>
  p.prescriptionIds === null || (!!prescriptionId && p.prescriptionIds.includes(prescriptionId));

/** La semana de la descarga, si cae dentro de la fase. */
const semanaDeDescarga = (p: ProgresionDeLaFase, semanas: number): number | null => (p.deload && p.deload.week <= semanas ? p.deload.week : null);

/** La semana `indice` (0 es la primera) del modelo, sin la descarga. */
function semanaDelModelo(p: ProgresionDeLaFase, base: BaseDelEjercicio, indice: number): { carga: number | null; repeticiones: number | null; ola: OlaDeLaSemana | null } {
  const carga = base.carga;
  if (p.model === 'LINEAR') {
    return {
      carga: carga === null ? null : carga + indice * (p.loadStep ?? 0),
      repeticiones: base.repeticiones === null ? null : base.repeticiones + indice * (p.repStep ?? 0),
      ola: null,
    };
  }
  if (p.model === 'DOUBLE' && p.repRange) {
    const largo = p.repRange.max - p.repRange.min + 1;
    const vuelta = Math.floor(indice / largo);
    return { carga: carga === null ? null : carga + vuelta * (p.loadStep ?? 0), repeticiones: p.repRange.min + (indice % largo), ola: null };
  }
  if (p.model === 'UNDULATING' && p.waves) {
    const ola = indice % 3;
    return { carga: carga === null ? null : (carga * p.waves[ola]!) / 100, repeticiones: base.repeticiones, ola: OLAS[ola]! };
  }
  return { carga, repeticiones: base.repeticiones, ola: null };
}

/**
 * Las semanas de la fase para un ejercicio, con la regla aplicada y las cargas redondeadas al paso. La semana de descarga
 * no cuenta para el modelo: la que sigue retoma donde quedó la anterior. En la descarga, la carga baja a la parte pedida
 * de la carga de trabajo de la semana anterior (`LOAD`) o se hacen menos series con la misma carga (`SETS`, al menos una).
 */
export function semanasDelEjercicio(p: ProgresionDeLaFase, base: BaseDelEjercicio, semanas: number): SemanaDeLaProgresion[] {
  const descarga = semanaDeDescarga(p, semanas);
  const redondear = (c: number | null): number | null => (c === null ? null : Math.max(0, redondearAlPaso(c, base.paso)));
  const filas: SemanaDeLaProgresion[] = [];
  for (let semana = 1; semana <= semanas; semana += 1) {
    if (semana === descarga && p.deload) {
      const anterior = semana > 1 ? filas[semana - 2]! : { carga: base.carga, repeticiones: base.repeticiones, series: base.series };
      const porCarga = p.deload.mode === 'LOAD';
      filas.push({
        semana,
        carga: porCarga ? redondear(anterior.carga === null ? null : (anterior.carga * p.deload.workingLoadShare) / 100) : anterior.carga,
        repeticiones: anterior.repeticiones,
        series: porCarga ? base.series : Math.max(1, base.series - p.deload.setsRemoved),
        descarga: true,
        ola: null,
      });
      continue;
    }
    const indice = semana - 1 - (descarga !== null && semana > descarga ? 1 : 0);
    const m = semanaDelModelo(p, base, indice);
    filas.push({ semana, carga: redondear(m.carga), repeticiones: m.repeticiones, series: base.series, descarga: false, ola: m.ola });
  }
  return filas;
}

/** La progresión guardada de una fase, si tiene. */
export const progresionDeLaFase = (p: PlanificacionDelPlan | null | undefined, blockId: string | null | undefined): ProgresionDeLaFase | null =>
  (blockId ? p?.progressions?.find((x) => x.blockId === blockId) : undefined) ?? null;

/** La planificación con la progresión de esa fase (una por fase: la nueva reemplaza a la anterior). */
export function conProgresion(p: PlanificacionDelPlan, progresion: ProgresionDeLaFase): PlanificacionDelPlan {
  return { ...p, progressions: [...(p.progressions ?? []).filter((x) => x.blockId !== progresion.blockId), progresion] };
}

/** La planificación sin la progresión de esa fase. */
export function sinProgresion(p: PlanificacionDelPlan, blockId: string): PlanificacionDelPlan {
  const resto = (p.progressions ?? []).filter((x) => x.blockId !== blockId);
  const { progressions: _antes, ...sin } = p;
  return resto.length > 0 ? { ...sin, progressions: resto } : sin;
}

/**
 * La progresión de una fase llevada a otra (la copia, E19): la misma regla, con los ejercicios elegidos traducidos a los
 * de la copia. Si ninguno se pudo traducir, vale para toda la fase.
 */
export function progresionParaOtraFase(p: ProgresionDeLaFase, blockId: string, prescripciones: ReadonlyMap<string, string> = new Map()): ProgresionDeLaFase {
  const elegidos = p.prescriptionIds?.flatMap((id) => (prescripciones.has(id) ? [prescripciones.get(id)!] : [])) ?? null;
  return { ...p, blockId, prescriptionIds: elegidos && elegidos.length > 0 ? elegidos : null };
}

// ─── En palabras ─────────────────────────────────────────────────────────────────────────────

export const COPY_PROGRESIONES = {
  titulo: 'Progresión y descarga',
  abrir: 'Progresión…',
  modelos: {
    LINEAR: 'Lineal',
    DOUBLE: 'Doble progresión',
    UNDULATING: 'Ondulante',
  } as Readonly<Record<ModeloDeProgresion, string>>,
  sinModelo: 'Sin progresión',
  queHace: {
    LINEAR: 'La carga (o las repeticiones) sube lo mismo cada semana.',
    DOUBLE: 'Primero suben las repeticiones dentro de un rango; al llegar arriba, sube la carga y las repeticiones vuelven abajo.',
    UNDULATING: 'Tres semanas que se repiten: pesada, liviana y media.',
  } as Readonly<Record<ModeloDeProgresion, string>>,
  ejemplos: {
    LINEAR: 'Ejemplo: sentadilla 4 × 6 con 80 kg y +2,5 kg por semana → 80, 82,5, 85 y 87,5 kg.',
    DOUBLE: 'Ejemplo: press de banca 3 × 8-12 con 60 kg → semana 1, 8 repeticiones; semana 5, 12; semana 6, 62,5 kg y otra vez 8.',
    UNDULATING: 'Ejemplo: con 100 kg de carga de trabajo y 100, 80 y 90 % de la carga de trabajo → 100, 80 y 90 kg, y vuelve a empezar.',
  } as Readonly<Record<ModeloDeProgresion, string>>,
  descarga: 'Semana de descarga',
  descargaQueHace: 'Una semana más liviana dentro de la fase. La que sigue retoma la progresión donde quedó.',
  descargaEjemplo: 'Ejemplo: semana 4 al 60 % de la carga de trabajo de la semana 3: con 87,5 kg, 52,5 kg. O las mismas cargas con 2 series menos.',
  aToda: 'Toda la fase',
  aLosElegidos: 'Los ejercicios elegidos',
  vistaPrevia: 'Vista previa',
  sinCarga: 'sin carga',
  semana: (n: number) => `Semana ${n}`,
  sem: (n: number) => `S${n}`,
  ola: { PESADA: 'pesada', LIVIANA: 'liviana', MEDIA: 'media' } as Readonly<Record<OlaDeLaSemana, string>>,
  aplicar: 'Aplicar a la fase',
  quitar: 'Quitar la progresión',
  usarLaDe: (fase: string) => `Usar la de «${fase}»`,
  aplicada: (fase: string) => `La progresión quedó en «${fase}».`,
  quitada: (fase: string) => `«${fase}» quedó sin progresión.`,
  comoSeVe: 'Se guarda como regla de la fase: se ve en el editor y en los gráficos. La persona ve, por ahora, la carga de la sesión.',
  redondeo: (paso: string, unidad: string) => `Cargas redondeadas de a ${paso} ${unidad}, como las aproximaciones.`,
  sinSemanas: 'La fase todavía no tiene semanas: decí cuántas para ver la vista previa.',
  fueraDeLaFase: (semana: number, semanas: number) => `La descarga va en la semana ${semana}, y la fase tiene ${semanas}: no se aplica.`,
} as const;

/** «+2,5 kg por semana · descarga en la semana 4 (60 % de la carga de trabajo)». */
export function progresionEnPalabras(p: ProgresionDeLaFase, unidad: 'kg' | 'lb'): string {
  const partes: string[] = [];
  if (p.model === 'LINEAR') {
    const carga = p.loadStep ? `+${numero(p.loadStep, 2)} ${unidad}` : null;
    const reps = p.repStep ? `+${p.repStep} ${p.repStep === 1 ? 'repetición' : 'repeticiones'}` : null;
    partes.push(`${COPY_PROGRESIONES.modelos.LINEAR}: ${[carga, reps].filter(Boolean).join(' y ') || 'sin cambios'} por semana`);
  } else if (p.model === 'DOUBLE' && p.repRange) {
    partes.push(`${COPY_PROGRESIONES.modelos.DOUBLE}: de ${p.repRange.min} a ${p.repRange.max} repeticiones, después +${numero(p.loadStep ?? 0, 2)} ${unidad}`);
  } else if (p.model === 'UNDULATING' && p.waves) {
    partes.push(`${COPY_PROGRESIONES.modelos.UNDULATING}: ${p.waves.join(', ')} % de la carga de trabajo`);
  }
  if (p.deload) {
    partes.push(
      p.deload.mode === 'LOAD'
        ? `descarga en la semana ${p.deload.week} (${p.deload.workingLoadShare} % de la carga de trabajo)`
        : `descarga en la semana ${p.deload.week} (${p.deload.setsRemoved} ${p.deload.setsRemoved === 1 ? 'serie' : 'series'} menos)`,
    );
  }
  return partes.join(' · ') || COPY_PROGRESIONES.sinModelo;
}

// ─── Las semanas en el calendario ─────────────────────────────────────────────────────────────

/** La semana de la fase (1 es la primera) en que cae una fecha, o `null` si cae fuera. */
export function semanaDeLaFecha(fase: { readonly desde: string; readonly hasta: string }, fecha: string): number | null {
  if (fecha < fase.desde || fecha > fase.hasta) return null;
  return Math.floor(diasEntreFechas(fase.desde, fecha) / 7) + 1;
}

/** El lunes (o el día que sea) en que empieza la semana `n` de la fase. */
export const inicioDeLaSemana = (fase: { readonly desde: string }, n: number): string => sumarDias(fase.desde, (n - 1) * 7);

/** Lo más alto de cada semana de la fase, de una lista de puntos con fecha. Las semanas sin puntos quedan en `null`. */
export function maximoPorSemana(fase: { readonly desde: string; readonly hasta: string; readonly semanas: number }, puntos: readonly { readonly fecha: string; readonly valor: number }[]): (number | null)[] {
  const r: (number | null)[] = Array.from({ length: fase.semanas }, () => null);
  for (const p of puntos) {
    const s = semanaDeLaFecha(fase, p.fecha);
    if (s === null || s > fase.semanas) continue;
    r[s - 1] = Math.max(r[s - 1] ?? Number.NEGATIVE_INFINITY, p.valor);
  }
  return r;
}
