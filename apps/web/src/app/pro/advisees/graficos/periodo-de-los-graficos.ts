/**
 * El período de los gráficos de la persona, uno solo para todos (WP-GRAFICOS-POR-FASE, GPF-01 a GPF-04; DL-187): el
 * historial del ejercicio, «Patrones» (de la ficha y del plan), «Analizar», «Armá tu gráfico» y los cruces eligen el
 * período con las mismas opciones y las mismas reglas.
 *
 * - **Cuatro duraciones** que terminan hoy: 4 semanas, 12 semanas, 6 meses y un año.
 * - **Desde que la acompañás**: desde el día del vínculo, si fue en el último año; si fue antes (o no se sabe), el último
 *   año, y la pantalla lo dice (`recortado`).
 * - **A medida**: dos fechas, hasta 366 días contando las dos, sin pasar de hoy (GPF-D03).
 * - **Por versión del plan** (GPF-D01): la vigencia exacta de una versión activada del plan de Entrenamiento o de
 *   Nutrición (`etapasDelArea`, la misma etapa de «Comparar etapas»): desde su activación hasta el día anterior al de la
 *   sucesora, u hoy si sigue vigente. Con «La anterior» y «La siguiente» se recorren las del área. Una versión de más de
 *   366 días se ve en sus últimos 366, y se dice.
 *
 * En todos los casos, lo anterior al vínculo no se dibuja (TB-16): el período lleva el día del vínculo y el eje empieza
 * ahí (`inicioDelEje`).
 *
 * Es puro: lo prueba `apps/web/test/graficos-por-fase.test.mjs`.
 */
import type { EtapaDePlanificacion } from '@be/domain';
import type { PeriodoDelGrafico } from './eje-de-fechas';

export type DuracionDelPeriodo = 'CUATRO_SEMANAS' | 'DOCE_SEMANAS' | 'SEIS_MESES' | 'UN_ANIO';
export type DominioDeLaEtapa = 'TRAINING' | 'NUTRITION';

export type EleccionDePeriodo =
  | { readonly tipo: 'DURACION'; readonly duracion: DuracionDelPeriodo }
  | { readonly tipo: 'DESDE_EL_VINCULO' }
  | { readonly tipo: 'A_MEDIDA'; readonly desde: string; readonly hasta: string }
  | { readonly tipo: 'ETAPA'; readonly dominio: DominioDeLaEtapa; readonly planVersionId: string };

/** Las duraciones, en el orden en que se ofrecen, con sus días contando hoy. */
export const DURACIONES: readonly { readonly clave: DuracionDelPeriodo; readonly dias: 28 | 84 | 182 | 365; readonly texto: string; readonly enElPeriodo: string }[] = [
  { clave: 'CUATRO_SEMANAS', dias: 28, texto: '4 semanas', enElPeriodo: 'en las últimas 4 semanas' },
  { clave: 'DOCE_SEMANAS', dias: 84, texto: '12 semanas', enElPeriodo: 'en las últimas 12 semanas' },
  { clave: 'SEIS_MESES', dias: 182, texto: '6 meses', enElPeriodo: 'en los últimos 6 meses' },
  { clave: 'UN_ANIO', dias: 365, texto: '1 año', enElPeriodo: 'en el último año' },
];

/** GPF-D02: donde el gráfico elige su propio período (el historial del ejercicio, «Patrones» del plan), abre en 12 semanas. */
export const ELECCION_POR_DEFECTO: EleccionDePeriodo = { tipo: 'DURACION', duracion: 'DOCE_SEMANAS' };

/** Lo más largo que se lee de una vez (un año con el día de hoy): el tope de API-PRJ-01 y de API-DSH-04. */
export const DIAS_MAXIMOS_DE_LOS_GRAFICOS = 366;

export const COPY_DEL_PERIODO = {
  desdeElVinculo: 'Desde que la acompañás',
  enElPeriodoDesdeElVinculo: 'desde que la acompañás',
  aMedida: 'A medida',
  porVersion: 'Por versión del plan',
  versionDelPlan: 'Versión del plan',
  sinVersiones: 'No hay versiones del plan activadas en el último año.',
  elegirVersion: 'Elegí una versión',
  laAnterior: 'La anterior',
  laSiguiente: 'La siguiente',
  areas: { TRAINING: 'Entrenamiento', NUTRITION: 'Nutrición' } satisfies Record<DominioDeLaEtapa, string>,
  hastaUnAnio: 'Se ve el último año: el acompañamiento empezó antes y cada lectura abarca hasta un año.',
  sinInicio: 'No pudimos leer desde cuándo la acompañás: se ve el último año.',
  versionRecortada: 'La versión rigió más de un año: se ven sus últimos 366 días.',
  versionesNoLeidas: 'No pudimos leer las versiones del plan: elegí el período por fechas.',
} as const;

const DIA = 86_400_000;
const restar = (fecha: string, dias: number): string => new Date(Date.parse(`${fecha}T12:00:00Z`) - dias * DIA).toISOString().slice(0, 10);
/** Los días de un rango, contando los dos extremos. */
export const diasDelRango = (desde: string, hasta: string): number => Math.round((Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / DIA) + 1;

export const duracion = (clave: DuracionDelPeriodo) => DURACIONES.find((d) => d.clave === clave) ?? DURACIONES[1]!;

/** Lo que falta para que un rango a medida se pueda leer; `null` si se puede. */
export function problemaDelRango(desde: string, hasta: string, hoy: string): string | null {
  if (!desde || !hasta) return 'Elegí las dos fechas.';
  if (desde > hasta) return 'La fecha de inicio tiene que ser anterior a la de fin.';
  if (hasta > hoy) return 'El período termina hoy como mucho.';
  if (diasDelRango(desde, hasta) > DIAS_MAXIMOS_DE_LOS_GRAFICOS) return `El período puede tener hasta ${DIAS_MAXIMOS_DE_LOS_GRAFICOS} días.`;
  return null;
}

export interface PeriodoElegido extends PeriodoDelGrafico {
  /** «Desde que la acompañás» con un acompañamiento de más de un año, o una versión de más de 366 días: se dice. */
  readonly recortado: boolean;
  /** La versión elegida, con «Por versión del plan». */
  readonly etapa: EtapaDePlanificacion | null;
}

export interface ContextoDelPeriodo {
  readonly hoy: string;
  /** El primer día del acompañamiento (TB-16), si se sabe. */
  readonly inicioDelVinculo: string | null;
  /** Las versiones activadas de cada área en el último año (`etapasDelArea`). */
  readonly etapas: Readonly<Record<DominioDeLaEtapa, readonly EtapaDePlanificacion[]>>;
}

/**
 * El período de una elección, o `null` si no se puede armar (una versión que ya no está entre las leídas, o un rango a
 * medida que no vale): quien llama vuelve a la elección por defecto.
 */
export function periodoDeLaEleccion(e: EleccionDePeriodo, c: ContextoDelPeriodo): PeriodoElegido | null {
  const base = { hoy: c.hoy, desdeElVinculo: c.inicioDelVinculo, etapa: null };
  switch (e.tipo) {
    case 'DURACION':
      return { ...base, desde: restar(c.hoy, duracion(e.duracion).dias - 1), hasta: c.hoy, recortado: false };
    case 'DESDE_EL_VINCULO': {
      const tope = restar(c.hoy, 365 - 1);
      const dentro = c.inicioDelVinculo !== null && c.inicioDelVinculo >= tope;
      const desde = dentro ? (c.inicioDelVinculo! > c.hoy ? c.hoy : c.inicioDelVinculo!) : tope;
      return { ...base, desde, hasta: c.hoy, recortado: !dentro };
    }
    case 'A_MEDIDA':
      return problemaDelRango(e.desde, e.hasta, c.hoy) === null ? { ...base, desde: e.desde, hasta: e.hasta, recortado: false } : null;
    case 'ETAPA': {
      const etapa = c.etapas[e.dominio].find((x) => x.planVersionId === e.planVersionId) ?? null;
      if (!etapa) return null;
      const hasta = etapa.ultimoDia ?? etapa.desde;
      const largo = diasDelRango(etapa.desde, hasta) > DIAS_MAXIMOS_DE_LOS_GRAFICOS;
      return { ...base, desde: largo ? restar(hasta, DIAS_MAXIMOS_DE_LOS_GRAFICOS - 1) : etapa.desde, hasta, recortado: largo, etapa };
    }
  }
}

/** La versión anterior (`-1`) o la siguiente (`1`) del mismo área, por orden de activación; `null` en los extremos. */
export function etapaVecina(etapas: readonly EtapaDePlanificacion[], planVersionId: string, paso: -1 | 1): EtapaDePlanificacion | null {
  const i = etapas.findIndex((x) => x.planVersionId === planVersionId);
  return i < 0 ? null : (etapas[i + paso] ?? null);
}

const corto = (f: string): string => `${Number(f.slice(8, 10))}/${Number(f.slice(5, 7))}`;

/** «Entrenamiento v3 · del 2/9 al 13/10» o «… · desde el 14/10 (vigente)»: cómo se nombra una versión en el selector. */
export function textoDeLaEtapa(e: EtapaDePlanificacion, conArea = true): string {
  const area = conArea ? `${COPY_DEL_PERIODO.areas[e.dominio]} ` : '';
  const cuando = e.abierta ? `desde el ${corto(e.desde)} (vigente)` : e.ultimoDia ? `del ${corto(e.desde)} al ${corto(e.ultimoDia)}` : `el ${corto(e.desde)}, reemplazada el mismo día`;
  return `${area}${e.etiqueta} · ${cuando}`;
}

/** Las versiones que se pueden elegir: las que tienen al menos un día entero (una reemplazada el mismo día no tiene período). */
export const etapasElegibles = (etapas: readonly EtapaDePlanificacion[]): EtapaDePlanificacion[] => etapas.filter((e) => e.ultimoDia !== null);

/** Cómo se nombra el período en las frases («Sin sesiones … en las últimas 12 semanas»). */
export function enElPeriodo(e: EleccionDePeriodo, p: PeriodoElegido | null): string {
  if (e.tipo === 'DURACION') return duracion(e.duracion).enElPeriodo;
  if (e.tipo === 'DESDE_EL_VINCULO') return COPY_DEL_PERIODO.enElPeriodoDesdeElVinculo;
  if (e.tipo === 'ETAPA' && p?.etapa) return `en la versión ${p.etapa.etiqueta.replace(/^v/, '')} del plan de ${COPY_DEL_PERIODO.areas[p.etapa.dominio]}`;
  return p ? `del ${corto(p.desde)} al ${corto(p.hasta)}` : 'en el período';
}
