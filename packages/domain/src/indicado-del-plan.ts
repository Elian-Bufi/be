/**
 * WP-NUTRICION-COMPARACION (DL-158; propuesta C de AMPLIACIONES_2026-10-19, con C-D1 opción A y C-D2): «Indicado en el
 * plan» y «Objetivo del profesional» al lado de lo registrado, en «Analizar».
 *
 * - **Lo indicado sale de la instantánea** de la versión del plan (REG-06-105): la del día, para el día (la misma que usa
 *   el contraste de API-NUT-17 y Registros); la que cita el registro, para una comida. Si el plan cambia después, lo
 *   indicado de ayer no cambia.
 * - **El día tiene indicado solo si el plan no deja elegir:** rige una sola versión ese día, se sabe el día tipo y cada
 *   comida tiene una sola opción. Es la suma exacta de esas opciones con las composiciones congeladas
 *   (`calcularNutrientes`, la misma cuenta que «Estimación para las porciones del plan» de la APK).
 * - **Sin indicado, se dice por qué.** Las alternativas nunca se suman ni se promedian (NOTA_DE_LO_PREVISTO).
 * - **Por comida:** una opción del plan tiene lo indicado de esa opción; una comida diferente no es una opción del plan.
 * - **El objetivo:** las calorías y los macros en gramos por día; un macro expresado como proporción de las calorías no se
 *   convierte (se dice, no se dibuja).
 * Describe, no califica: sin porcentajes, sin restas como desempeño, sin adherencia (REG-06-125; B05).
 */
import { calcularNutrientes, sumaExacta, type NutrienteCalculado } from './calculo-nutricional';
import type { MetricaNutricional } from './contratos-analisis';
import { construirContraste, type ContenidoDeInstantanea, type VersionEnPeriodo } from './nutricion';
import { ingestaDelContraste, NUTRIENTE_DE_LA_METRICA, type RegistroParaAnalisis } from './nutricion-del-analisis';

type OpcionDeInstantanea = ContenidoDeInstantanea['dayTypes'][number]['meals'][number]['options'][number];

/** Lo indicado de una opción del plan para un nutriente: la suma exacta de sus porciones, o por qué no se puede. */
export function indicadoDeLaOpcion(opcion: OpcionDeInstantanea, nutriente: NutrienteCalculado): { readonly valor: string } | { readonly motivo: 'SIN_DATO_DEL_NUTRIENTE' } {
  const r = calcularNutrientes(opcion.items.map((it) => ({ clave: it.itemId, cantidad: it.quantity, composicion: it.composition })));
  const v = r.nutrientes[nutriente];
  return v.exacto === null ? { motivo: 'SIN_DATO_DEL_NUTRIENTE' } : { valor: v.exacto };
}

// ─── Por día ────────────────────────────────────────────────────────────────────────────────────

/**
 * Por qué un día no tiene indicado:
 * - `SIN_PLAN`: no regía ningún plan;
 * - `CAMBIO_DE_VERSION`: ese día rigieron dos versiones (se activó otra);
 * - `SIN_DIA_TIPO`: el plan tiene varios días tipo y ningún registro del día dice cuál;
 * - `SIN_COMIDAS`: el día tipo no tiene comidas;
 * - `VARIAS_OPCIONES`: alguna comida tiene más de una opción (o ninguna): BE no elige ni suma alternativas;
 * - `PORCIONES_DE_INTERCAMBIO`: alguna comida se indicó por porciones de intercambio, sin opciones con cantidades;
 * - `SIN_DATO_DEL_NUTRIENTE`: a un ingrediente indicado le falta el dato del nutriente.
 */
export type MotivoSinIndicadoDelDia = 'SIN_PLAN' | 'CAMBIO_DE_VERSION' | 'SIN_DIA_TIPO' | 'SIN_COMIDAS' | 'VARIAS_OPCIONES' | 'PORCIONES_DE_INTERCAMBIO' | 'SIN_DATO_DEL_NUTRIENTE';

export type IndicadoDelDia =
  | {
      readonly fecha: string;
      readonly estado: 'DETERMINADO';
      /** Exacto, en decimal con punto, en la unidad de la métrica. */
      readonly valor: string;
      readonly planId: string;
      readonly diaTipoId: string;
      readonly diaTipo: string;
    }
  | {
      readonly fecha: string;
      readonly estado: 'SIN_DETERMINAR';
      readonly motivo: MotivoSinIndicadoDelDia;
      readonly planId: string | null;
      /** Con `VARIAS_OPCIONES`: qué comidas y cuántas opciones tiene cada una. */
      readonly comidasConVariasOpciones: readonly { readonly comida: string; readonly opciones: number }[];
    };

/**
 * Lo indicado de cada día del rango, para una métrica. La versión y el día tipo de cada fecha son los del contraste
 * (`construirContraste`, la misma regla que Registros y las comidas del plan de DL-153): la de los registros del día o,
 * sin registros, la que regía al terminar el día; el día tipo, el de los registros o el único del plan. Un día en el que
 * rigieron dos versiones no tiene un indicado del día: cada comida lo tiene con su propia versión.
 */
export function indicadoDeLosDias(p: {
  readonly fechas: readonly string[];
  readonly versiones: readonly VersionEnPeriodo[];
  /** Los registros efectivos del período (sin los anulados): dicen el día tipo cuando el plan tiene varios. */
  readonly registros: readonly RegistroParaAnalisis[];
  readonly metrica: MetricaNutricional;
}): IndicadoDelDia[] {
  if (p.metrica === 'RECORDS') return [];
  const nutriente = NUTRIENTE_DE_LA_METRICA[p.metrica];
  const contraste = construirContraste(p.fechas, p.versiones, p.registros.map(ingestaDelContraste));
  const sin = (fecha: string, motivo: MotivoSinIndicadoDelDia, planId: string | null, comidas: { comida: string; opciones: number }[] = []): IndicadoDelDia => ({
    fecha,
    estado: 'SIN_DETERMINAR',
    motivo,
    planId,
    comidasConVariasOpciones: comidas,
  });
  return contraste.days.map((d): IndicadoDelDia => {
    const tocan = p.versiones.filter((v) => v.desde <= d.date && (v.hasta === null || v.hasta >= d.date));
    if (tocan.length > 1) return sin(d.date, 'CAMBIO_DE_VERSION', d.planId);
    if (!d.planId) return sin(d.date, 'SIN_PLAN', null);
    if (!d.dayTypeId) return sin(d.date, 'SIN_DIA_TIPO', d.planId);
    const dia = p.versiones.find((v) => v.planId === d.planId)?.instantanea.dayTypes.find((t) => t.dayTypeId === d.dayTypeId);
    if (!dia || dia.meals.length === 0) return sin(d.date, 'SIN_COMIDAS', d.planId);
    if (dia.meals.some((m) => m.prescriptionMode === 'EXCHANGE_PORTIONS')) return sin(d.date, 'PORCIONES_DE_INTERCAMBIO', d.planId);
    const conVarias = dia.meals.filter((m) => m.options.length !== 1);
    if (conVarias.length > 0) return sin(d.date, 'VARIAS_OPCIONES', d.planId, conVarias.map((m) => ({ comida: m.label, opciones: m.options.length })));
    const valores: string[] = [];
    for (const m of dia.meals) {
      const v = indicadoDeLaOpcion(m.options[0]!, nutriente);
      if ('motivo' in v) return sin(d.date, 'SIN_DATO_DEL_NUTRIENTE', d.planId);
      valores.push(v.valor);
    }
    return { fecha: d.date, estado: 'DETERMINADO', valor: sumaExacta(valores), planId: d.planId, diaTipoId: dia.dayTypeId, diaTipo: dia.label };
  });
}

// ─── Por comida registrada ──────────────────────────────────────────────────────────────────────

export type MotivoSinIndicadoDeLaComida = 'COMIDA_DIFERENTE' | 'OPCION_NO_ENCONTRADA' | 'SIN_DATO_DEL_NUTRIENTE';

export type IndicadoDeLaComida =
  | { readonly recordId: string; readonly estado: 'DETERMINADO'; readonly valor: string; readonly planId: string }
  | { readonly recordId: string; readonly estado: 'SIN_DETERMINAR'; readonly motivo: MotivoSinIndicadoDeLaComida; readonly planId: string };

/**
 * Lo indicado de la opción que se registró en cada comida, con la versión que cita el registro. Una comida diferente no es
 * una opción del plan: no tiene indicado (y una opción del plan registrada sin cantidades sí lo tiene, aunque lo
 * registrado no tenga número).
 */
export function indicadoDeLasComidas(p: {
  readonly registros: readonly RegistroParaAnalisis[];
  readonly instantaneas: ReadonlyMap<string, ContenidoDeInstantanea>;
  readonly metrica: MetricaNutricional;
}): IndicadoDeLaComida[] {
  if (p.metrica === 'RECORDS') return [];
  const nutriente = NUTRIENTE_DE_LA_METRICA[p.metrica];
  return p.registros.map((r): IndicadoDeLaComida => {
    if (r.kind === 'DIFFERENT') return { recordId: r.recordId, estado: 'SIN_DETERMINAR', motivo: 'COMIDA_DIFERENTE', planId: r.planId };
    const opcion = (p.instantaneas.get(r.planId)?.dayTypes ?? []).flatMap((t) => t.meals.flatMap((m) => m.options)).find((o) => o.optionId === r.option?.optionId);
    if (!opcion) return { recordId: r.recordId, estado: 'SIN_DETERMINAR', motivo: 'OPCION_NO_ENCONTRADA', planId: r.planId };
    const v = indicadoDeLaOpcion(opcion, nutriente);
    return 'motivo' in v ? { recordId: r.recordId, estado: 'SIN_DETERMINAR', motivo: v.motivo, planId: r.planId } : { recordId: r.recordId, estado: 'DETERMINADO', valor: v.valor, planId: r.planId };
  });
}

// ─── El objetivo del profesional ────────────────────────────────────────────────────────────────

/** Una versión del objetivo nutricional, con lo que hace falta para dibujarla. */
export interface ObjetivoParaComparar {
  readonly id: string;
  /** Fecha local desde la que rige y en la que dejó de regir (la sucesora o su fin), o `null`. */
  readonly desde: string;
  readonly hasta: string | null;
  readonly requerimientoKcal: number | null;
  readonly macros: {
    readonly protein: { readonly value: number; readonly unit: 'g/day' | 'energy_share' };
    readonly carbohydrate: { readonly value: number; readonly unit: 'g/day' | 'energy_share' };
    readonly fat: { readonly value: number; readonly unit: 'g/day' | 'energy_share' };
  } | null;
}

export interface EscalonDelObjetivo {
  readonly objetivoId: string;
  readonly desde: string;
  readonly hasta: string | null;
  /** La cantidad por día que se dibuja, o `null` si el objetivo de esta métrica es una proporción de las calorías. */
  readonly cantidad: { readonly valor: number; readonly unidad: 'kcal/day' | 'g/day' } | null;
  /** La proporción de las calorías, tal como la escribió el profesional: no se convierte ni se dibuja. */
  readonly proporcionDeLaEnergia: number | null;
}

const MACRO_DE_LA_METRICA: Readonly<Partial<Record<MetricaNutricional, 'protein' | 'carbohydrate' | 'fat'>>> = { PROTEIN: 'protein', CARBOHYDRATE: 'carbohydrate', FAT: 'fat' };

/** Los escalones del objetivo de una métrica que tocan el rango, en orden. La fibra y la cuenta de registros no tienen. */
export function escalonesDelObjetivo(objetivos: readonly ObjetivoParaComparar[], metrica: MetricaNutricional, desde: string, hasta: string): EscalonDelObjetivo[] {
  const enElRango = objetivos.filter((o) => o.desde <= hasta && (o.hasta === null || o.hasta >= desde)).sort((a, b) => a.desde.localeCompare(b.desde));
  if (metrica === 'ENERGY') {
    return enElRango.flatMap((o) => (o.requerimientoKcal !== null ? [{ objetivoId: o.id, desde: o.desde, hasta: o.hasta, cantidad: { valor: o.requerimientoKcal, unidad: 'kcal/day' as const }, proporcionDeLaEnergia: null }] : []));
  }
  const macro = MACRO_DE_LA_METRICA[metrica];
  if (!macro) return [];
  return enElRango.flatMap((o) => {
    const m = o.macros?.[macro];
    if (!m) return [];
    return [m.unit === 'g/day' ? { objetivoId: o.id, desde: o.desde, hasta: o.hasta, cantidad: { valor: m.value, unidad: 'g/day' as const }, proporcionDeLaEnergia: null } : { objetivoId: o.id, desde: o.desde, hasta: o.hasta, cantidad: null, proporcionDeLaEnergia: m.value }];
  });
}
