/**
 * WP-NUTRICION-COMPARACION (DL-158): los textos de las tres capas de Nutrición en «Analizar» (el gráfico, la lectura, el
 * origen del dato, la tabla, la exportación y «Cómo se lee»). Un solo lugar, como el resto del copy. Describen: sin
 * porcentajes, sin juicios, sin «cumplimiento» ni «adherencia» (TERMINOS_PROHIBIDOS_DE_NUTRICION, también en negación).
 */
import { DECIMALES_DE_PRESENTACION } from './calculo-nutricional';
import { nutrienteParaMostrar } from './copy-recetas';
import type { EscalonDelObjetivoApi, IndicadoDeLaComidaApi, IndicadoDelDiaApi, MetricaNutricional } from './contratos-analisis';
import { numero } from './formato-numeros';
import type { EscalonDelObjetivo, IndicadoDeLaComida, IndicadoDelDia, MotivoSinIndicadoDelDia } from './indicado-del-plan';
import { NUTRIENTE_DE_LA_METRICA } from './nutricion-del-analisis';

export const CAPAS_DE_LA_COMPARACION = {
  registrado: 'Registrado',
  objetivo: 'Objetivo del profesional',
  indicado: 'Indicado en el plan',
  formaDelRegistrado: 'línea continua con puntos',
  formaDelObjetivo: 'línea discontinua',
  formaDelIndicado: 'rombos huecos, uno por día',
  /** Lo que se dice en la vista por semana, que no dibuja lo indicado (es por día). */
  porSemana: 'Lo indicado en el plan es por día: en la vista por semana no se dibuja.',
  regla: 'Hay indicado del día solo si el plan no deja elegir: una sola opción en cada comida. BE no elige entre alternativas, no las suma ni las promedia.',
  queEs:
    'El objetivo es lo que fijó el profesional para cada día; lo indicado, lo que el plan indicaba ese día con sus porciones; lo registrado, lo que la persona registró. Son tres cosas distintas y ninguna califica a las otras.',
  noEsCausa: 'Que los valores se acerquen o se alejen no indica que una cosa cause la otra.',
  comidaSinIndicado: 'sin indicado',
} as const;

/** La unidad de una métrica de Nutrición, como se escribe al lado del número. */
export const unidadDeLaMetrica = (m: Exclude<MetricaNutricional, 'RECORDS'>): 'kcal' | 'g' => (m === 'ENERGY' ? 'kcal' : 'g');

/**
 * Un valor calculado (lo indicado) con su unidad y el redondeo de la pantalla de registro (`nutrienteParaMostrar`: kcal
 * enteras, gramos con un decimal, HALF_UP sobre el exacto): el mismo que lo registrado, para que se lean lado a lado.
 */
export function valorDeLaMetrica(valor: number, m: Exclude<MetricaNutricional, 'RECORDS'>): string {
  const nutriente = NUTRIENTE_DE_LA_METRICA[m];
  let texto: string | null = null;
  try {
    texto = nutrienteParaMostrar({ value: String(valor) }, nutriente);
  } catch {
    // Un valor que no es un decimal exacto (no debería pasar): con los decimales de la presentación.
  }
  return `${texto ?? numero(valor, DECIMALES_DE_PRESENTACION[nutriente])} ${unidadDeLaMetrica(m)}`;
}

/** Un valor que declaró el profesional (el objetivo), como lo muestra la tira del objetivo: «2.200 kcal», «110 g». */
export const valorDelObjetivo = (valor: number, m: Exclude<MetricaNutricional, 'RECORDS'>): string => `${numero(valor)} ${unidadDeLaMetrica(m)}`;

const MOTIVO_DEL_DIA: Readonly<Record<Exclude<IndicadoDelDiaApi, { state: 'DETERMINED' }>['reason'], string>> = {
  NO_ACTIVE_PLAN: 'no regía ningún plan',
  PLAN_VERSION_CHANGED: 'ese día cambió la versión del plan; cada comida registrada tiene el de su versión',
  DAY_TYPE_UNKNOWN: 'el plan tiene más de un día tipo y ningún registro de ese día dice cuál',
  NO_MEALS: 'el día tipo no tiene comidas',
  SEVERAL_OPTIONS: 'hay comidas con varias opciones',
  EXCHANGE_PORTIONS: 'una comida se indicó por porciones de intercambio, sin cantidades por opción',
  NUTRIENT_DATA_MISSING: 'a un ingrediente indicado le falta el dato de este nutriente',
};

const MOTIVO_CORTO_DEL_DIA: Readonly<Record<Exclude<IndicadoDelDiaApi, { state: 'DETERMINED' }>['reason'], string>> = {
  NO_ACTIVE_PLAN: 'sin plan vigente',
  PLAN_VERSION_CHANGED: 'cambió la versión del plan',
  DAY_TYPE_UNKNOWN: 'día tipo sin determinar',
  NO_MEALS: 'sin comidas',
  SEVERAL_OPTIONS: 'comidas con varias opciones',
  EXCHANGE_PORTIONS: 'porciones de intercambio',
  NUTRIENT_DATA_MISSING: 'sin dato del nutriente',
};

/** Por qué un día no tiene indicado, en una frase: con varias opciones, cuáles comidas y cuántas. */
export function motivoSinIndicadoDelDia(d: Extract<IndicadoDelDiaApi, { state: 'UNDETERMINED' }>): string {
  if (d.reason === 'SEVERAL_OPTIONS' && d.mealsWithSeveralOptions.length > 0) {
    const comidas = d.mealsWithSeveralOptions.map((c) => (c.options === 0 ? `${c.meal} no tiene opciones` : `${c.meal} tiene ${c.options} opciones`)).join('; ');
    return `Sin indicado del día: ${comidas}. BE no elige entre ellas ni las suma.`;
  }
  return `Sin indicado del día: ${MOTIVO_DEL_DIA[d.reason]}.`;
}

/** Lo mismo, corto, para una celda de la tabla o la exportación: «sin indicado: comidas con varias opciones». */
export const motivoCortoSinIndicadoDelDia = (d: Extract<IndicadoDelDiaApi, { state: 'UNDETERMINED' }>): string => `${CAPAS_DE_LA_COMPARACION.comidaSinIndicado}: ${MOTIVO_CORTO_DEL_DIA[d.reason]}`;

const MOTIVO_DE_LA_COMIDA: Readonly<Record<Extract<IndicadoDeLaComidaApi, { state: 'UNDETERMINED' }>['reason'], string>> = {
  DIFFERENT_MEAL: 'Comida diferente: no es una opción del plan y no tiene indicado.',
  OPTION_NOT_FOUND: 'Sin indicado: la opción no está en la versión del plan que cita el registro.',
  NUTRIENT_DATA_MISSING: 'Sin indicado: a un ingrediente de la opción le falta el dato de este nutriente.',
};

/** Lo indicado de una comida registrada, en palabras: «Indicado en el plan: 450 kcal», o por qué no tiene. */
export function indicadoDeLaComidaEnPalabras(c: IndicadoDeLaComidaApi, m: Exclude<MetricaNutricional, 'RECORDS'>): string {
  return c.state === 'DETERMINED' ? `${CAPAS_DE_LA_COMPARACION.indicado}: ${valorDeLaMetrica(c.value, m)}` : MOTIVO_DE_LA_COMIDA[c.reason];
}

/** El objetivo de un escalón: «2100 kcal por día», o la proporción, que no se convierte. */
export function objetivoEnPalabras(e: EscalonDelObjetivoApi, m: Exclude<MetricaNutricional, 'RECORDS'>): string {
  if (e.amount) return `${valorDelObjetivo(e.amount.value, m)} por día`;
  return `${numero(e.energyShare ?? 0)} de las calorías (proporción): BE no la convierte a gramos ni la dibuja`;
}

const diaAnterior = (fecha: string): string => new Date(Date.parse(`${fecha}T00:00:00.000Z`) - 86_400_000).toISOString().slice(0, 10);

/**
 * Los escalones del objetivo que rigen en un rango, en orden, con el día desde el que rigen adentro del rango. Cada uno
 * rige hasta que empieza el siguiente (ese día ya vale el nuevo); el último, hasta su fin o el final del rango. Es lo
 * que dibuja la línea discontinua: la lectura, la tabla y la exportación dicen lo mismo.
 */
export function escalonesDelRango(escalones: readonly EscalonDelObjetivoApi[], desde: string, hasta: string): { readonly desde: string; readonly escalon: EscalonDelObjetivoApi }[] {
  const ordenados = [...escalones].sort((a, b) => a.from.localeCompare(b.from));
  return ordenados.flatMap((e, i) => {
    const siguiente = ordenados[i + 1];
    const fin = siguiente ? diaAnterior(siguiente.from) : (e.to ?? hasta);
    const inicio = e.from < desde ? desde : e.from;
    return inicio <= hasta && fin >= desde && inicio <= fin ? [{ desde: inicio, escalon: e }] : [];
  });
}

/** Las cantidades y las proporciones distintas que rigen en un rango, en orden. */
function valoresDelRango(escalones: readonly EscalonDelObjetivoApi[], desde: string, hasta: string): { readonly cantidades: readonly number[]; readonly proporciones: readonly number[] } | null {
  const tramos = escalonesDelRango(escalones, desde, hasta);
  if (tramos.length === 0) return null;
  return {
    cantidades: [...new Set(tramos.flatMap((t) => (t.escalon.amount ? [t.escalon.amount.value] : [])))],
    proporciones: [...new Set(tramos.flatMap((t) => (t.escalon.amount ? [] : [t.escalon.energyShare ?? 0])))],
  };
}

const proporcionEnPalabras = (p: number): string => `${numero(p)} de las calorías (proporción)`;

/**
 * Lo que fija el objetivo en un rango (un día, o una semana), en palabras: «2.200 kcal por día»; si cambió adentro, los
 * dos («2.200 kcal y 1.950 kcal por día»); una proporción, como proporción. `null` si no rige ninguno.
 */
export function objetivoDelRango(escalones: readonly EscalonDelObjetivoApi[], m: Exclude<MetricaNutricional, 'RECORDS'>, desde: string, hasta: string): string | null {
  const v = valoresDelRango(escalones, desde, hasta);
  if (!v) return null;
  return [...(v.cantidades.length > 0 ? [`${v.cantidades.map((c) => valorDelObjetivo(c, m)).join(' y ')} por día`] : []), ...v.proporciones.map(proporcionEnPalabras)].join(' y ');
}

/** Lo mismo, para una celda de la tabla (el «por día» va en el encabezado): «2.200 kcal», «2.200 kcal y 1.950 kcal». */
export function objetivoEnCelda(escalones: readonly EscalonDelObjetivoApi[], m: Exclude<MetricaNutricional, 'RECORDS'>, desde: string, hasta: string): string | null {
  const v = valoresDelRango(escalones, desde, hasta);
  if (!v) return null;
  return [...v.cantidades.map((c) => valorDelObjetivo(c, m)), ...v.proporciones.map(proporcionEnPalabras)].join(' y ');
}

/**
 * Debajo del gráfico, cuando hay días con lo indicado leído y ninguno tiene un valor que dibujar: por qué (el motivo más
 * frecuente) y dónde está lo de cada comida. `null` si hay algo dibujado o no hay días.
 */
export function sinIndicadoParaDibujar(dias: readonly IndicadoDelDiaApi[]): string | null {
  if (dias.length === 0 || dias.some((d) => d.state === 'DETERMINED')) return null;
  const veces = new Map<Extract<IndicadoDelDiaApi, { state: 'UNDETERMINED' }>['reason'], number>();
  for (const d of dias) if (d.state === 'UNDETERMINED') veces.set(d.reason, (veces.get(d.reason) ?? 0) + 1);
  const masFrecuente = [...veces].sort((a, b) => b[1] - a[1])[0]?.[0];
  return `${CAPAS_DE_LA_COMPARACION.indicado}: ningún día de estas fechas tiene un indicado del día${masFrecuente ? ` (${MOTIVO_CORTO_DEL_DIA[masFrecuente]})` : ''}. Lo indicado de cada comida registrada está en «Ver origen».`;
}

/** Lo indicado de un día en una celda de la tabla: el valor, o por qué no hay («sin indicado: comidas con varias opciones»). */
export const indicadoDelDiaEnCelda = (d: IndicadoDelDiaApi, m: Exclude<MetricaNutricional, 'RECORDS'>): string => (d.state === 'DETERMINED' ? valorDeLaMetrica(d.value, m) : motivoCortoSinIndicadoDelDia(d));

/** Lo indicado del día en la lectura: «2.012 kcal · versión 2 del plan · Día habitual», o la frase de por qué no hay. */
export function indicadoDelDiaEnPalabras(d: IndicadoDelDiaApi, m: Exclude<MetricaNutricional, 'RECORDS'>, versionDelPlan: (planVersionId: string) => string | null): string {
  if (d.state === 'UNDETERMINED') return motivoSinIndicadoDelDia(d);
  const version = versionDelPlan(d.planVersionId);
  return [valorDeLaMetrica(d.value, m), version, d.dayType].filter(Boolean).join(' · ');
}

/**
 * Lo indicado del período, en una frase, para quien no ve el gráfico: cuántos días tienen un valor (los rombos) y por qué
 * no los demás. Vacío si no hay días.
 */
export function indicadoDelPeriodoEnTexto(dias: readonly IndicadoDelDiaApi[]): string {
  if (dias.length === 0) return '';
  const con = dias.filter((d) => d.state === 'DETERMINED').length;
  const motivos = new Map<string, number>();
  for (const d of dias) if (d.state === 'UNDETERMINED') motivos.set(MOTIVO_CORTO_DEL_DIA[d.reason], (motivos.get(MOTIVO_CORTO_DEL_DIA[d.reason]) ?? 0) + 1);
  const dias_ = (n: number) => `${numero(n)} ${n === 1 ? 'día' : 'días'}`;
  const sin = [...motivos].map(([motivo, n]) => `${dias_(n)} sin indicado (${motivo})`);
  return `${CAPAS_DE_LA_COMPARACION.indicado}: ${[`${dias_(con)} con un valor`, ...sin].join('; ')}.`;
}

// ─── En la exportación ──────────────────────────────────────────────────────────────────────────

const numeroDelArchivo = (v: number): string => String(Number(v.toPrecision(15))).replace('.', ',');

/** El objetivo de un rango en una celda del archivo: los números con coma («2200», «2200 y 1950»), la proporción dicha, o «sin objetivo». */
export function objetivoParaExportar(escalones: readonly EscalonDelObjetivoApi[], desde: string, hasta: string): string {
  const tramos = escalonesDelRango(escalones, desde, hasta);
  if (tramos.length === 0) return 'sin objetivo';
  const cantidades = [...new Set(tramos.flatMap((t) => (t.escalon.amount ? [t.escalon.amount.value] : [])))];
  const proporciones = [...new Set(tramos.flatMap((t) => (t.escalon.amount ? [] : [t.escalon.energyShare ?? 0])))];
  return [...(cantidades.length > 0 ? [cantidades.map(numeroDelArchivo).join(' y ')] : []), ...proporciones.map((p) => `proporción de las calorías ${numeroDelArchivo(p)}`)].join(' y ');
}

// ─── Del dominio al contrato ────────────────────────────────────────────────────────────────────

const MOTIVO_API: Readonly<Record<MotivoSinIndicadoDelDia, Extract<IndicadoDelDiaApi, { state: 'UNDETERMINED' }>['reason']>> = {
  SIN_PLAN: 'NO_ACTIVE_PLAN',
  CAMBIO_DE_VERSION: 'PLAN_VERSION_CHANGED',
  SIN_DIA_TIPO: 'DAY_TYPE_UNKNOWN',
  SIN_COMIDAS: 'NO_MEALS',
  VARIAS_OPCIONES: 'SEVERAL_OPTIONS',
  PORCIONES_DE_INTERCAMBIO: 'EXCHANGE_PORTIONS',
  SIN_DATO_DEL_NUTRIENTE: 'NUTRIENT_DATA_MISSING',
};

export function indicadoDelDiaApi(d: IndicadoDelDia): IndicadoDelDiaApi {
  return d.estado === 'DETERMINADO'
    ? { date: d.fecha, state: 'DETERMINED', value: Number(d.valor), planVersionId: d.planId, dayTypeId: d.diaTipoId, dayType: d.diaTipo }
    : { date: d.fecha, state: 'UNDETERMINED', reason: MOTIVO_API[d.motivo], planVersionId: d.planId, mealsWithSeveralOptions: d.comidasConVariasOpciones.map((c) => ({ meal: c.comida, options: c.opciones })) };
}

export function indicadoDeLaComidaApi(c: IndicadoDeLaComida): IndicadoDeLaComidaApi {
  if (c.estado === 'DETERMINADO') return { recordId: c.recordId, state: 'DETERMINED', value: Number(c.valor), planVersionId: c.planId };
  const reason = c.motivo === 'COMIDA_DIFERENTE' ? 'DIFFERENT_MEAL' : c.motivo === 'OPCION_NO_ENCONTRADA' ? 'OPTION_NOT_FOUND' : 'NUTRIENT_DATA_MISSING';
  return { recordId: c.recordId, state: 'UNDETERMINED', reason, planVersionId: c.planId };
}

export function escalonDelObjetivoApi(e: EscalonDelObjetivo): EscalonDelObjetivoApi {
  return {
    objectiveVersionId: e.objetivoId,
    from: e.desde,
    to: e.hasta,
    amount: e.cantidad ? { value: e.cantidad.valor, unit: e.cantidad.unidad } : null,
    energyShare: e.proporcionDeLaEnergia,
  };
}
