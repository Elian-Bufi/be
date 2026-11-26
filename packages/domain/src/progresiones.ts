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
  // Con cargas chicas (una mancuerna de 1 kg al 40 %), el redondeo al paso daría 0: queda en un paso, sin pasar la carga
  // de trabajo. Una carga propuesta nunca es 0 ni negativa si la de trabajo no lo es.
  const redondear = (c: number | null): number | null => {
    if (c === null) return null;
    const r = Math.max(0, redondearAlPaso(c, base.paso));
    return r > 0 || c <= 0 || base.carga === null || base.carga <= 0 ? r : Math.min(base.paso, base.carga);
  };
  const filas: SemanaDeLaProgresion[] = [];
  for (let semana = 1; semana <= semanas; semana += 1) {
    if (semana === descarga && p.deload) {
      const anterior = semana > 1 ? filas[semana - 2]! : { carga: base.carga, repeticiones: base.repeticiones, series: base.series };
      const porCarga = p.deload.mode === 'LOAD';
      filas.push({
        semana,
        carga: porCarga ? redondear(anterior.carga === null ? null : (anterior.carga * p.deload.workingLoadShare) / 100) : anterior.carga,
        repeticiones: anterior.repeticiones,
        // Nunca menos de una serie, salvo que no tenga efectivas: la descarga no inventa una.
        series: porCarga || base.series === 0 ? base.series : Math.max(1, base.series - p.deload.setsRemoved),
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

/**
 * La regla de la fase (la general, que hereda cada ejercicio), si tiene. DL-201: las reglas propias de los ejercicios no
 * cuentan acá (`reglasPropias`, `progresionDelEjercicio`).
 */
export const progresionDeLaFase = (p: PlanificacionDelPlan | null | undefined, blockId: string | null | undefined): ProgresionDeLaFase | null =>
  (blockId ? p?.progressions?.find((x) => x.blockId === blockId && x.prescriptionIds === null) : undefined) ?? null;

/** DL-201: las reglas propias de los ejercicios de una fase (las que pisan la de la fase). */
export const reglasPropias = (p: PlanificacionDelPlan | null | undefined, blockId: string | null | undefined): ProgresionDeLaFase[] =>
  blockId ? (p?.progressions ?? []).filter((x) => x.blockId === blockId && x.prescriptionIds !== null) : [];

/** DL-201: la regla propia de un ejercicio, si tiene (como mucho una: `ProgresionesDelPlanSchema`). */
export const reglaPropiaDe = (p: PlanificacionDelPlan | null | undefined, blockId: string | null | undefined, prescriptionId: string | null | undefined): ProgresionDeLaFase | null =>
  (prescriptionId ? reglasPropias(p, blockId).find((x) => x.prescriptionIds!.includes(prescriptionId)) : undefined) ?? null;

/** De dónde sale la progresión de un ejercicio: la suya, la de su fase o ninguna. */
export type OrigenDeLaProgresion = 'PROPIA' | 'FASE' | 'NINGUNA';

/**
 * DL-201 (PE-D03) · la progresión que rige para un ejercicio: la propia; si no, la de la fase; si no, ninguna. Una propia
 * «Sin progresión» (sin modelo ni descarga) rige igual: deja al ejercicio quieto aunque la fase tenga una.
 */
export function progresionDelEjercicio(
  p: PlanificacionDelPlan | null | undefined,
  blockId: string | null | undefined,
  prescriptionId: string | null | undefined,
): { readonly regla: ProgresionDeLaFase | null; readonly origen: OrigenDeLaProgresion } {
  const propia = reglaPropiaDe(p, blockId, prescriptionId);
  if (propia) return { regla: propia, origen: 'PROPIA' };
  const deLaFase = progresionDeLaFase(p, blockId);
  return deLaFase ? { regla: deLaFase, origen: 'FASE' } : { regla: null, origen: 'NINGUNA' };
}

/** Si la regla cambia algo: un modelo, o al menos la descarga. «Sin progresión» no cambia nada. */
export const cambiaAlgo = (p: ProgresionDeLaFase | null | undefined): p is ProgresionDeLaFase => !!p && (p.model !== null || p.deload !== null);

const mismosEjercicios = (a: readonly string[] | null, b: readonly string[] | null): boolean =>
  a === null || b === null ? a === b : a.length === b.length && a.every((x) => b.includes(x));

/** Saca una regla del arreglo: la de la fase, o la propia de esos mismos ejercicios. */
const sinLaRegla = (lista: readonly ProgresionDeLaFase[], r: ProgresionDeLaFase): ProgresionDeLaFase[] =>
  lista.filter((x) => !(x.blockId === r.blockId && mismosEjercicios(x.prescriptionIds, r.prescriptionIds)));

/** Las propias sin esos ejercicios; la que queda vacía se va. La de la fase queda. */
const sinEsosEjercicios = (lista: readonly ProgresionDeLaFase[], ids: readonly string[]): ProgresionDeLaFase[] => {
  const fuera = new Set(ids);
  return lista.flatMap((x) => {
    if (x.prescriptionIds === null) return [x];
    const quedan = x.prescriptionIds.filter((id) => !fuera.has(id));
    return quedan.length === x.prescriptionIds.length ? [x] : quedan.length > 0 ? [{ ...x, prescriptionIds: quedan }] : [];
  });
};

const conLista = (p: PlanificacionDelPlan, lista: readonly ProgresionDeLaFase[]): PlanificacionDelPlan => {
  const { progressions: _antes, ...sin } = p;
  return lista.length > 0 ? { ...sin, progressions: [...lista] } : sin;
};

/**
 * La planificación con una regla. La de la fase reemplaza a la de la fase; una propia saca a sus ejercicios de cualquier
 * otra propia (DL-201: un ejercicio lleva una sola) y, si una queda vacía, se va. `reemplaza`: la regla que se estaba
 * editando (la propia de otros ejercicios, si cambió la elección), que se saca primero.
 */
export function conProgresion(p: PlanificacionDelPlan, progresion: ProgresionDeLaFase, reemplaza: ProgresionDeLaFase | null = null): PlanificacionDelPlan {
  let lista = p.progressions ?? [];
  if (reemplaza) lista = sinLaRegla(lista, reemplaza);
  lista =
    progresion.prescriptionIds === null
      ? lista.filter((x) => !(x.blockId === progresion.blockId && x.prescriptionIds === null))
      : sinEsosEjercicios(lista, progresion.prescriptionIds);
  return conLista(p, [...lista, progresion]);
}

/** La planificación sin ninguna progresión de esa fase (ni la de la fase ni las propias). */
export function sinProgresion(p: PlanificacionDelPlan, blockId: string): PlanificacionDelPlan {
  return conLista(p, (p.progressions ?? []).filter((x) => x.blockId !== blockId));
}

/** DL-201: la planificación sin esa regla (la de la fase, o la propia de esos ejercicios); lo demás queda. */
export const sinLaProgresion = (p: PlanificacionDelPlan, regla: ProgresionDeLaFase): PlanificacionDelPlan => conLista(p, sinLaRegla(p.progressions ?? [], regla));

/**
 * DL-201 · los ejercicios vuelven a heredar la regla de su fase: salen de su regla propia (y la propia que queda vacía se
 * va). Es «Usar la de la fase».
 */
export const sinReglaPropia = (p: PlanificacionDelPlan, prescriptionIds: readonly string[]): PlanificacionDelPlan => conLista(p, sinEsosEjercicios(p.progressions ?? [], prescriptionIds));

/**
 * La progresión de una fase llevada a otra (la copia, E19): la misma regla, con los ejercicios elegidos traducidos a los
 * de la copia. Si ninguno se pudo traducir, vale para toda la fase.
 */
export function progresionParaOtraFase(p: ProgresionDeLaFase, blockId: string, prescripciones: ReadonlyMap<string, string> = new Map()): ProgresionDeLaFase {
  const elegidos = p.prescriptionIds?.flatMap((id) => (prescripciones.has(id) ? [prescripciones.get(id)!] : [])) ?? null;
  return { ...p, blockId, prescriptionIds: elegidos && elegidos.length > 0 ? elegidos : null };
}

/**
 * DL-201 (PE-D08) · las reglas propias de una fase, llevadas a su copia («Duplicar la fase»): cada una con los ejercicios
 * de la copia. La que no tiene ninguno traducido no se copia (no pasa a valer para toda la fase). La regla de la fase no
 * va acá: la copia la elige en el cuadro que se abre al copiar (E19).
 */
export function reglasPropiasParaLaCopia(p: PlanificacionDelPlan | null | undefined, original: string, copia: string, prescripciones: ReadonlyMap<string, string>): ProgresionDeLaFase[] {
  return reglasPropias(p, original).flatMap((r) => {
    const ids = r.prescriptionIds!.flatMap((id) => (prescripciones.has(id) ? [prescripciones.get(id)!] : []));
    return ids.length > 0 ? [{ ...r, blockId: copia, prescriptionIds: ids }] : [];
  });
}

// ─── En palabras ─────────────────────────────────────────────────────────────────────────────

export const COPY_PROGRESIONES = {
  titulo: 'Progresión y descarga',
  tituloCorto: 'Progresión',
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
  aLosElegidos: 'Ejercicios elegidos',
  seAplicaA: 'Se aplica a',
  propia: 'Regla propia',
  conPropias: (n: number) => (n === 1 ? '1 ejercicio con progresión propia' : `${n} ejercicios con progresión propia`),
  aplicarA: (n: number) => (n === 1 ? 'Aplicar a 1 ejercicio' : `Aplicar a ${n} ejercicios`),
  usarLaDeLaFase: 'Usar la de la fase',
  volvieronALaFase: (n: number) => (n === 1 ? 'El ejercicio vuelve a seguir la regla de la fase.' : `Los ${n} ejercicios vuelven a seguir la regla de la fase.`),
  aplicadaA: (n: number) => (n === 1 ? 'La progresión quedó en 1 ejercicio.' : `La progresión quedó en ${n} ejercicios.`),
  ejemploDeMuestra: 'Ejercicio de muestra',
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
  comoSeVe: 'Se guarda como regla: la persona ve la carga de cada semana.',
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

/**
 * DL-201 · la regla en pocas palabras, para el ejercicio plegado: «↑ +2,5 kg/sem», «↑ 8-12 reps, +2,5 kg», «↑ Ondulante»,
 * «Descarga S4», «Sin progresión».
 */
export function progresionCorta(p: ProgresionDeLaFase, unidad: 'kg' | 'lb'): string {
  const partes: string[] = [];
  if (p.model === 'LINEAR') {
    const pasos = [p.loadStep ? `+${numero(p.loadStep, 2)} ${unidad}` : null, p.repStep ? `+${p.repStep} rep` : null].filter(Boolean);
    partes.push(pasos.length > 0 ? `↑ ${pasos.join(' y ')}/sem` : `↑ ${COPY_PROGRESIONES.modelos.LINEAR}`);
  } else if (p.model === 'DOUBLE' && p.repRange) {
    partes.push(`↑ ${p.repRange.min}-${p.repRange.max} reps, +${numero(p.loadStep ?? 0, 2)} ${unidad}`);
  } else if (p.model === 'UNDULATING') {
    partes.push(`↑ ${COPY_PROGRESIONES.modelos.UNDULATING}`);
  }
  if (p.deload) partes.push(partes.length > 0 ? `descarga S${p.deload.week}` : `Descarga S${p.deload.week}`);
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
