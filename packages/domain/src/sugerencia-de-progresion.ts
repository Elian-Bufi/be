/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-10 a ET3-12) · **la sugerencia de progresión a partir de lo que hizo la
 * persona** (doble progresión): si en la última vez que hizo el ejercicio completó **todas** las series efectivas con las
 * repeticiones pedidas (el tope, si es un rango) y con el RIR pedido o más (lo mismo en RPE: el pedido o menos), y con la
 * carga planificada, BE sugiere subir la carga un paso la próxima: «+2,5 kg la próxima», con el motivo.
 *
 * - **Nunca cambia nada solo** (ET3-D10): la sugerencia se muestra en el panel del ejercicio; el profesional la aplica
 *   («Aplicar»: `conLaCargaSubida`) o la descarta. Describe; no califica: sin colores de juicio.
 * - **Con una progresión en la fase** (DL-196 parte B), no sugiere: la regla de la fase ya mueve la carga semana a semana
 *   y sumar otro paso sería contarlo dos veces (ET3-D12).
 * - **El paso** (ET3-D11): el de la progresión de la fase si tuviera; si no, el del implemento: barra y lo demás, 2,5 kg;
 *   mancuernas, 2 kg (un par más pesado); máquina de placas, 5 kg; en libras, 5 (máquina, 10).
 * - **Cuenta lo registrado de la última vez** (`VezPasada`, la misma lectura de «La vez pasada», API-TRN-21): serie por
 *   serie y por su número. Una serie tildada «como el plan» cuenta como hecha con lo del plan (la persona dijo que salió
 *   así). Una vez con otro ejercicio, resumida o sin una serie efectiva no sugiere nada.
 *
 * Es puro: lo prueba `editor-de-entrenamiento-tanda-3.test.ts`.
 */
import { diaDeLaEstimacion } from './estimacion-de-fuerza';
import { numero } from './formato-numeros';
import type { VezPasada } from './la-vez-pasada';
import { textoDelEsfuerzo, type NotacionDelEsfuerzo } from './notacion-del-esfuerzo';
import { objetivosEfectivos, type PrescripcionParaResolver } from './objetivos-por-serie';
import { implementoDelEjercicio, redondearAlPaso, type Implemento } from './planificacion-del-plan';

type Carga = { readonly value: number; readonly unit: 'kg' | 'lb' };

/** Lo mínimo de la prescripción del editor: sus series con su tipo, el criterio y la carga común. */
export interface PrescripcionParaLaSugerencia extends PrescripcionParaResolver {
  readonly sets: readonly (PrescripcionParaResolver['sets'][number] & { readonly setKind?: 'WORKING' | 'WARM_UP' | null })[];
  readonly loadBasis?: string | null;
}

export interface SugerenciaDeProgresion {
  /** Cuánto sube y en qué unidad: «+2,5 kg». */
  readonly paso: Carga;
  /** La carga común de ahora y la que quedaría (si el ejercicio no tiene común, la más alta de sus series efectivas). */
  readonly desde: Carga;
  readonly hasta: Carga;
  /** «+2,5 kg la próxima». */
  readonly titulo: string;
  /** «Hizo las 3 series con 10 repeticiones a RIR 2 o más y 60 kg el 24 nov». */
  readonly motivo: string;
  /** La vez de la que sale: la clave con la que se recuerda «Descartar» (`claveDeLaSugerencia`). */
  readonly executionId: string;
  readonly prescriptionId: string;
}

/** EE-D03 y ET3-D11: cuánto se sube por omisión, según con qué se hace el ejercicio. */
export function pasoDeLaProgresion(implemento: Implemento, unidad: 'kg' | 'lb'): number {
  if (unidad === 'lb') return implemento === 'MAQUINA' ? 10 : 5;
  if (implemento === 'MAQUINA') return 5;
  if (implemento === 'MANCUERNA') return 2;
  return 2.5;
}

const topeDe = (r: { readonly value: number } | { readonly min: number; readonly max: number } | null): number | null => (r === null ? null : 'value' in r ? r.value : r.max);
const todasIguales = <T>(xs: readonly T[]): boolean => xs.every((x) => x === xs[0]);
const enCantidad = (c: Carga): string => `${numero(c.value, 2)} ${c.unit}`;

/**
 * La sugerencia, o `null` si no corresponde. `veces` es la lectura de «La vez pasada» (la más reciente primero); se mira
 * solo la primera. `nombre` y la base de la carga deciden el implemento (el paso); `paso` lo pisa (el de la fase).
 */
export function sugerenciaDeProgresion(o: {
  readonly prescripcion: PrescripcionParaLaSugerencia;
  readonly veces: readonly VezPasada[];
  readonly nombre: string;
  readonly notacion?: NotacionDelEsfuerzo;
  /** La fase tiene una regla de progresión que alcanza a este ejercicio: no se sugiere (ET3-D12). */
  readonly conProgresionDeLaFase?: boolean;
  readonly paso?: number | null;
}): SugerenciaDeProgresion | null {
  if (o.conProgresionDeLaFase) return null;
  const vez = o.veces[0];
  if (!vez || !vez.comparable || vez.como.tipo !== 'series') return null;
  const objetivos = objetivosEfectivos(o.prescripcion);
  const efectivas = objetivos.filter((_, i) => o.prescripcion.sets[i]?.setKind !== 'WARM_UP');
  if (efectivas.length === 0) return null;
  const registradas = vez.como.series;
  const topes: number[] = [];
  const rires: (number | null)[] = [];
  const cargas: Carga[] = [];
  for (const objetivo of efectivas) {
    const tope = topeDe(objetivo.repetitions);
    // Sin repeticiones pedidas no hay con qué comparar: no se sugiere.
    if (tope === null) return null;
    const hecha = registradas.find((s) => s.numero === objetivo.setIndex);
    if (!hecha || hecha.repeticiones === null || hecha.repeticiones < tope) return null;
    if (objetivo.rir !== null && (hecha.rir === null || hecha.rir < objetivo.rir)) return null;
    // La carga: la registrada, en la misma unidad, y por lo menos la planificada.
    if (!hecha.carga) return null;
    if (objetivo.suggestedLoad) {
      if (objetivo.suggestedLoad.unit !== hecha.carga.unit || hecha.carga.value < objetivo.suggestedLoad.value) return null;
    }
    topes.push(tope);
    rires.push(objetivo.rir);
    cargas.push(objetivo.suggestedLoad ?? hecha.carga);
  }
  const unidad = cargas[0]!.unit;
  if (!cargas.every((c) => c.unit === unidad)) return null;
  const implemento = implementoDelEjercicio(o.nombre, o.prescripcion.loadBasis ?? null);
  const paso = o.paso && o.paso > 0 ? o.paso : pasoDeLaProgresion(implemento, unidad);
  const comun = o.prescripcion.suggestedLoad && o.prescripcion.suggestedLoad.unit === unidad ? o.prescripcion.suggestedLoad : null;
  const desde: Carga = comun ?? { value: Math.max(...cargas.map((c) => c.value)), unit: unidad };
  const hasta: Carga = { value: redondearAlPaso(desde.value + paso, 0.25), unit: unidad };
  const n = efectivas.length;
  const notacion = o.notacion ?? 'RIR';
  const repeticiones = todasIguales(topes) ? `con ${numero(topes[0]!, 0)} repeticiones` : 'con las repeticiones pedidas';
  const conRir = rires.every((r) => r !== null);
  const esfuerzo = conRir && todasIguales(rires) ? ` a ${textoDelEsfuerzo(rires[0]!, notacion)} ${notacion === 'RPE' ? 'o menos' : 'o más'}` : conRir ? ' con el esfuerzo pedido' : '';
  const carga = todasIguales(cargas.map((c) => c.value)) ? ` y ${enCantidad(cargas[0]!)}` : ' y las cargas planificadas';
  const series = n === 1 ? 'la serie' : `las ${numero(n, 0)} series`;
  return {
    paso: { value: paso, unit: unidad },
    desde,
    hasta,
    titulo: `+${numero(paso, 2)} ${unidad} la próxima`,
    motivo: `Hizo ${series} ${repeticiones}${esfuerzo}${carga} el ${diaDeLaEstimacion(vez.fecha)}.`,
    executionId: vez.executionId,
    prescriptionId: vez.prescriptionId,
  };
}

/** La clave con la que el editor recuerda que se descartó: el ejercicio y la vez de la que salió. */
export const claveDeLaSugerencia = (exerciseId: string, s: Pick<SugerenciaDeProgresion, 'executionId' | 'prescriptionId'>): string => `${exerciseId}|${s.executionId}|${s.prescriptionId}`;

/**
 * La prescripción con la sugerencia aplicada (ET3-D10): la carga común sube el paso y, en las series efectivas que tienen
 * carga propia, también la suya (una pirámide sigue siendo pirámide). Sin carga común ni propias, queda la nueva como común.
 * Las aproximaciones no se tocan (las «Por porcentaje» se recalculan desde la de trabajo).
 */
export function conLaCargaSubida<P extends PrescripcionParaLaSugerencia>(p: P, s: Pick<SugerenciaDeProgresion, 'paso' | 'hasta'>): P {
  const sube = (c: Carga | null | undefined): Carga | null | undefined => (c && c.unit === s.paso.unit ? { value: redondearAlPaso(c.value + s.paso.value, 0.25), unit: c.unit } : c);
  const algunaPropia = p.sets.some((x) => x.setKind !== 'WARM_UP' && x.suggestedLoad);
  const sets = p.sets.map((x) => (x.setKind !== 'WARM_UP' && x.suggestedLoad ? { ...x, suggestedLoad: sube(x.suggestedLoad) } : x));
  const suggestedLoad = p.suggestedLoad ? sube(p.suggestedLoad) : algunaPropia ? (p.suggestedLoad ?? null) : s.hasta;
  return { ...p, sets, suggestedLoad };
}

/** Los textos de la sugerencia en el panel. Describen; no califican. */
export const COPY_SUGERENCIA_DE_PROGRESION = {
  titulo: 'Sugerencia de BE',
  aplicar: 'Aplicar',
  descartar: 'Descartar',
  aplicada: (hasta: string) => `La carga común quedó en ${hasta}.`,
  descartada: 'Descartaste la sugerencia: no vuelve a aparecer por esta vez registrada.',
  queEs: 'Doble progresión: cuando la persona hace todas las series con las repeticiones pedidas (el tope del rango) y el esfuerzo pedido, la próxima vez sube la carga un paso.',
  ejemplo: 'Ejemplo: pediste 3 × 8–10 a RIR 2 con 60 kg; la última vez hizo 10, 10 y 10 a RIR 2 o más con 60 kg. BE sugiere 62,5 kg. Si alguna serie quedó en 9, no sugiere nada.',
  nuncaSolo: 'BE no cambia nada solo: la aplicás o la descartás.',
} as const;
