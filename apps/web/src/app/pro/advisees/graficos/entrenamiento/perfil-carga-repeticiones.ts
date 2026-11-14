/**
 * GR-06 · El perfil carga-repeticiones de la persona en el ejercicio (WP-GRAFICOS fase 2, rama B; DL-174). Lo puro: los
 * puntos (en X, las repeticiones equivalentes; en Y, la carga), qué series entran, las últimas 4 semanas aparte, las
 * curvas de igual 1RM estimado (Epley v1) «de la fórmula» y la geometría del dibujo.
 *
 * - Entran solo las series que escribió la persona (ED-70: la carga, las repeticiones y el RIR con procedencia PERSON;
 *   nada tildado sin escribir) con RIR de 0 a 2 (GR-T37). Lo precargado del plan nunca entra.
 * - Un ejercicio y una unidad por gráfico: kg y lb nunca van juntas.
 * - Las curvas son de la fórmula, no de la persona, y solo para los ejercicios de la lista de la v1 (RM-16; GR-T38): fuera
 *   de la lista, BE no estima. Van hasta 12 repeticiones equivalentes, el tope de la estimación.
 * - No destaca ninguna serie sobre otra ni estima otra cosa que Epley v1.
 *
 * Las series salen del comparador (API-TRN-21 y API-SER-01): todas las series de cada sesión, con su procedencia (GR-T36).
 *
 * Es puro: lo prueba `apps/web/test/graficos-entrenamiento.test.mjs`.
 */
import {
  epley,
  numero,
  RIR_MAXIMO_DE_LA_ESTIMACION,
  TOPE_DE_LA_ESTIMACION,
  type ObservacionDeEvolucion,
  type SerieEjecutadaApi,
} from '@be/domain';
import { extremosDelEje } from '../../seguimiento/geometria';
import { textoDeLaMarca } from '../eje-de-fechas';
import { COPY_PERFIL as C } from './copy';
import { mediana } from './comparador';
import { rangoMinimoDeLaFuerza } from './fuerza-estimada';

/** Las últimas 4 semanas, con hoy: van con otra forma y otro color que las anteriores. */
export const DIAS_RECIENTES = 28;

export interface PuntoDelPerfil {
  readonly clave: string;
  readonly fecha: string;
  readonly carga: number;
  readonly unidad: 'kg' | 'lb';
  readonly repeticiones: number;
  readonly rir: number;
  /** Repeticiones + RIR. */
  readonly equivalentes: number;
  /** De las últimas 4 semanas. */
  readonly reciente: boolean;
  /** «80 kg × 5 · RIR 1 · 6 repeticiones equivalentes · 3/11». */
  readonly lectura: string;
}

const restar = (fecha: string, dias: number): string => new Date(Date.parse(`${fecha}T12:00:00Z`) - dias * 86_400_000).toISOString().slice(0, 10);

/** El primer día de las últimas 4 semanas. */
export const inicioDeLasRecientes = (hoy: string): string => restar(hoy, DIAS_RECIENTES - 1);

/**
 * Si la serie la escribió la persona (ED-70; DJ-2 de DL-171): no se tildó sin escribir, dice de dónde salió cada valor y
 * cada valor escrito es de la persona. Una serie registrada antes de la procedencia no dice quién la escribió: no entra.
 */
export function laEscribioLaPersona(s: Pick<SerieEjecutadaApi, 'recordedAs' | 'fieldOrigins' | 'load' | 'completedRepetitions' | 'rir'>): boolean {
  if (s.recordedAs === 'AS_PLANNED' || !s.fieldOrigins) return false;
  const o = s.fieldOrigins;
  return (s.load === null || o.load === 'PERSON') && (s.completedRepetitions === null || o.completedRepetitions === 'PERSON') && (s.rir === null || o.rir === 'PERSON');
}

/** Si una serie entra en el perfil: escrita por la persona, con carga, repeticiones enteras desde 1 y RIR de 0 a 2. */
export function entraEnElPerfil(s: Pick<SerieEjecutadaApi, 'recordedAs' | 'fieldOrigins' | 'load' | 'completedRepetitions' | 'rir'>): boolean {
  const reps = s.completedRepetitions;
  return (
    laEscribioLaPersona(s) &&
    s.load !== null &&
    s.load.value > 0 &&
    reps !== null &&
    Number.isInteger(reps) &&
    reps >= 1 &&
    s.rir !== null &&
    s.rir >= 0 &&
    s.rir <= RIR_MAXIMO_DE_LA_ESTIMACION
  );
}

/**
 * Los puntos del perfil en una unidad: cada serie que la persona registró de este ejercicio (también hecho en lugar de
 * otro), una sola vez. `fuera`: las series de esa unidad que no entran (tildadas sin escribir, con valores del plan, sin
 * procedencia, sin RIR o con RIR mayor que 2), para decirlo.
 */
export function puntosDelPerfil(observaciones: readonly ObservacionDeEvolucion[], unidad: 'kg' | 'lb', hoy: string): { readonly puntos: PuntoDelPerfil[]; readonly fuera: number } {
  const desde = inicioDeLasRecientes(hoy);
  const puntos: PuntoDelPerfil[] = [];
  let fuera = 0;
  for (const o of observaciones) {
    if (o.rol !== 'planificado-y-registrado' && o.rol !== 'por-sustitucion') continue;
    const c = o.comparacion;
    for (const f of c.filas) {
      if (f.registrada.tipo !== 'registrada') continue;
      const s = f.registrada.serie;
      if (!s.load || s.load.unit !== unidad) continue;
      if (!entraEnElPerfil(s)) {
        fuera++;
        continue;
      }
      const repeticiones = s.completedRepetitions as number;
      const rir = s.rir as number;
      const equivalentes = repeticiones + rir;
      const reciente = c.fecha >= desde;
      puntos.push({
        clave: `${c.executionId}|${c.prescriptionId}|${f.numero}`,
        fecha: c.fecha,
        carga: s.load.value,
        unidad,
        repeticiones,
        rir,
        equivalentes,
        reciente,
        lectura: C.lectura(`${numero(s.load.value)} ${unidad}`, repeticiones, numero(rir), numero(equivalentes), `${textoDeLaMarca(c.fecha)} · ${reciente ? C.recientesCorto : C.anterioresCorto}`),
      });
    }
  }
  return { puntos, fuera };
}

/** La unidad de la carga registrada más reciente del ejercicio, o `null` si no registró cargas: la de entrada del perfil. */
export function unidadMasReciente(observaciones: readonly ObservacionDeEvolucion[]): 'kg' | 'lb' | null {
  for (const o of [...observaciones].reverse()) {
    if (o.rol !== 'planificado-y-registrado' && o.rol !== 'por-sustitucion') continue;
    for (const f of o.comparacion.filas) if (f.registrada.tipo === 'registrada' && f.registrada.serie.load) return f.registrada.serie.load.unit;
  }
  return null;
}

/** El orden para recorrer con el teclado y para la tabla: de menos a más repeticiones equivalentes, y por carga. */
export const enOrden = (puntos: readonly PuntoDelPerfil[]): PuntoDelPerfil[] =>
  [...puntos].sort((a, b) => a.equivalentes - b.equivalentes || a.carga - b.carga || (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));

export interface CurvaDeLaFormula {
  /** La estimación que comparten sus puntos, redondeada (5 kg o 10 lb). */
  readonly valor: number;
  readonly rotulo: string;
  readonly puntos: readonly { readonly equivalentes: number; readonly carga: number }[];
}

const PASO_DE_LAS_CURVAS: Readonly<Record<'kg' | 'lb', number>> = { kg: 5, lb: 10 };

/**
 * Hasta tres curvas de igual 1RM estimado (Epley v1), como guía de lectura: la más baja, la del medio y la más alta de las
 * estimaciones de los puntos, redondeadas. Cada una une, de 1 a 12 repeticiones equivalentes, la carga que daría esa
 * estimación con la fórmula (con una, la carga es la estimación). Son de la fórmula, no de la persona.
 */
export function curvasDeLaFormula(puntos: readonly PuntoDelPerfil[], unidad: 'kg' | 'lb'): CurvaDeLaFormula[] {
  const estimaciones = puntos.filter((p) => p.equivalentes <= TOPE_DE_LA_ESTIMACION).map((p) => epley(p.carga, p.equivalentes));
  if (estimaciones.length === 0) return [];
  const orden = [...estimaciones].sort((a, b) => a - b);
  const paso = PASO_DE_LAS_CURVAS[unidad];
  const redondo = (v: number): number => Math.round(v / paso) * paso;
  const valores = [...new Set([orden[0]!, mediana(orden)!, orden[orden.length - 1]!].map(redondo))].filter((v) => v > 0).sort((a, b) => a - b);
  return valores.map((valor) => ({
    valor,
    rotulo: C.rotuloDeLaCurva(`${numero(valor)} ${unidad}`),
    puntos: Array.from({ length: TOPE_DE_LA_ESTIMACION }, (_, i) => {
      const n = i + 1;
      return { equivalentes: n, carga: n === 1 ? valor : (valor * 30) / (30 + n) };
    }),
  }));
}

export interface CajaDelPerfil {
  readonly izquierda: number;
  readonly derecha: number;
  readonly arriba: number;
  readonly abajo: number;
}

export interface GeometriaDelPerfil {
  readonly x: (equivalentes: number) => number;
  readonly y: (carga: number) => number;
  readonly maximoX: number;
  readonly extremos: { readonly abajo: number; readonly arriba: number; readonly decimales: number };
  readonly marcasX: readonly { readonly valor: number; readonly x: number }[];
  readonly marcasY: readonly { readonly valor: number; readonly y: number }[];
}

/**
 * Las escalas del perfil: en X, de 0 a 12 repeticiones equivalentes (o al máximo, si hay más); en Y, la carga de los
 * puntos con el mismo rango mínimo que el 1RM estimado (10 kg o 22 lb), para que dos kilos no parezcan una pendiente.
 */
export function geometriaDelPerfil(puntos: readonly PuntoDelPerfil[], unidad: 'kg' | 'lb', caja: CajaDelPerfil): GeometriaDelPerfil {
  const maximoX = Math.max(TOPE_DE_LA_ESTIMACION, Math.ceil(Math.max(0, ...puntos.map((p) => p.equivalentes))));
  const cargas = puntos.map((p) => p.carga);
  let minimo = cargas.length > 0 ? Math.min(...cargas) : 0;
  let maximo = cargas.length > 0 ? Math.max(...cargas) : 1;
  const rango = rangoMinimoDeLaFuerza(unidad) ?? 0;
  if (maximo - minimo < rango) {
    const centro = (minimo + maximo) / 2;
    minimo = Math.max(0, centro - rango / 2);
    maximo = minimo + rango;
  }
  const extremos = extremosDelEje(minimo, maximo, 2, false);
  const ancho = Math.max(1, caja.derecha - caja.izquierda);
  const alto = Math.max(1, caja.abajo - caja.arriba);
  const x = (n: number): number => caja.izquierda + (n / maximoX) * ancho;
  const y = (c: number): number => caja.abajo - ((c - extremos.abajo) / (extremos.arriba - extremos.abajo || 1)) * alto;
  const pasoX = maximoX <= 12 ? 2 : 4;
  const marcasX = Array.from({ length: Math.floor(maximoX / pasoX) + 1 }, (_, i) => i * pasoX).map((valor) => ({ valor, x: x(valor) }));
  const medio = (extremos.abajo + extremos.arriba) / 2;
  const medioSeEscribe = Math.abs(Number(medio.toFixed(extremos.decimales)) - medio) < 1e-9;
  const marcasY = [extremos.abajo, ...(medioSeEscribe ? [medio] : []), extremos.arriba].map((valor) => ({ valor, y: y(valor) }));
  return { x, y, maximoX, extremos, marcasX, marcasY };
}
