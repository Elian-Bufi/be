/**
 * Nutrición en «Analizar» (WP-DASHBOARD-PROFESIONAL §6; encargo §11): lo **registrado** por día y por semana, sin
 * confundir cobertura con consumo.
 *
 * - **Fuente:** los registros de comida efectivos del período (DL-121). `consumed` de cada registro lo calculó BE con
 *   `calcularNutrientes` y sus cantidades confirmadas o informadas: acá solo se **suman** esos valores exactos, con la
 *   misma aritmética (`sumaExacta`). No hay otra fórmula, y la pantalla del registro y la del análisis coinciden.
 * - **Lo previsto no es consumido:** los macros de la opción del plan no entran nunca en el número.
 * - **Lo desconocido no es cero:** un registro sin cantidades, una comida diferente con solo texto o foto, o un alimento
 *   sin el dato de un nutriente no aportan número. El día con algo de eso es un **subtotal de lo registrado** y dice qué
 *   falta, por motivo.
 * - **Anulado:** queda en el historial y fuera del número. **Rectificado:** cuenta una sola vez, con su vista efectiva.
 * - **Semana:** la media de los días con valor, con su denominador (días con valor de los días de la semana dentro del
 *   período). Nunca la suma dividida por siete.
 * - No existe un «día completo» en BE: la máxima calidad de un día es «todos sus registros con cantidades», que sigue
 *   sin ser la ingesta total del día.
 * - **Las comidas del plan sin registro** (DL-153; encargo del 2026-10-23): si el plan deja conocer las comidas que
 *   indicaba ese día (el criterio de la pestaña Registros, `construirContraste`), una comida sin ningún registro hace del
 *   día un subtotal y se dice cuál falta. Si no se pueden conocer (sin plan vigente, o varios días tipo y ningún registro
 *   del plan que diga cuál), no se inventan: el día lo dice. El valor del día y la media no cambian: cambian la calidad
 *   del punto y lo que se dice que falta.
 */
import { mediaExacta, sumaExacta, type NutrienteCalculado } from './calculo-nutricional';
import type { CoberturaDelPunto, ComidasDelPlan, MetricaNutricional, PuntoAnalitico, ResultadoDeProyeccionNutricional, SerieAnalitica } from './contratos-analisis';
import type { ContrasteDescriptivo } from './contratos-nutricion';
import type { RegistroDeComida } from './contratos-registro-de-comidas';
import type { DefinicionDeMetrica } from './metricas-del-analisis';
import { construirContraste, type IngestaParaContraste, type VersionEnPeriodo } from './nutricion';
import { numero } from './formato-numeros';
import { fechasDelRango, huecosDelRango, semanasDelPeriodo } from './series-del-analisis';

/**
 * Lo que el análisis lee de un registro (la forma de API-ING-03). El día tipo, la comida y la opción ubican el registro
 * en el plan, para saber qué comidas del plan tienen registro (DL-153).
 */
export type RegistroParaAnalisis = Pick<
  RegistroDeComida,
  'recordId' | 'kind' | 'planId' | 'localDate' | 'occurredAt' | 'consumption' | 'consumed' | 'annulment' | 'dayTypeId' | 'meal' | 'option' | 'description'
>;

export const NUTRIENTE_DE_LA_METRICA: Readonly<Record<Exclude<MetricaNutricional, 'RECORDS'>, NutrienteCalculado>> = {
  ENERGY: 'energyKcal',
  PROTEIN: 'proteinG',
  CARBOHYDRATE: 'carbohydrateG',
  FAT: 'fatG',
  FIBER: 'fiberG',
};

/**
 * Por qué un día no tiene todo lo que su número declara sumar: un registro sin cantidades o sin el dato del nutriente, o
 * (DL-153) una comida del plan sin ningún registro, que no aporta número porque no hay nada registrado.
 */
export type MotivoNutricional = 'SIN_CANTIDADES' | 'COMIDA_DIFERENTE_SIN_CANTIDADES' | 'SIN_DATO_DEL_NUTRIENTE' | 'COMIDA_DEL_PLAN_SIN_REGISTRO';

// ─── Las comidas del plan de cada día (DL-153) ──────────────────────────────────────────────────

/**
 * Cómo quedaron las comidas del plan de un día con registros:
 * - `CONOCIDAS`: el plan que regía y su día tipo dicen qué comidas indicaba; cada una con la opción registrada, con una
 *   comida diferente registrada en ella, o sin registro (con su nombre, para decir cuál falta);
 * - `SIN_DETERMINAR`: no había un plan vigente (`SIN_PLAN`), o el plan tiene más de un día tipo y ese día no hay
 *   registros del plan que digan cuál correspondía (`SIN_DIA_TIPO`). No se elige ninguno en silencio (09v9:680).
 */
export type ComidasDelPlanDelDia =
  | { readonly estado: 'CONOCIDAS'; readonly esperadas: number; readonly conOpcion: number; readonly conComidaDiferente: number; readonly sinRegistro: readonly string[] }
  | { readonly estado: 'SIN_DETERMINAR'; readonly motivo: 'SIN_PLAN' | 'SIN_DIA_TIPO' };

/**
 * Un registro efectivo en la forma del contraste de API-NUT-17, con la misma correspondencia que hace ese servicio: una
 * opción del plan ocupa su comida; una comida diferente queda fuera de la prescripción, con la comida en la que se
 * registró como contexto. Las cantidades no hacen falta para contar comidas.
 */
export function ingestaDelContraste(r: RegistroParaAnalisis): IngestaParaContraste {
  const delPlan = r.kind === 'PLAN_OPTION';
  return {
    executionId: r.recordId,
    planId: r.planId,
    localDate: r.localDate,
    origin: delPlan ? 'PRESCRIBED' : 'OUTSIDE_PRESCRIPTION',
    dayTypeId: delPlan ? r.dayTypeId : null,
    mealId: delPlan ? (r.meal?.mealId ?? null) : null,
    optionId: r.option?.optionId ?? null,
    consumedItems: [],
    description: r.description,
    contextMealId: delPlan ? null : (r.meal?.mealId ?? null),
  };
}

/** Un día del contraste, en cuentas: las mismas filas que la pestaña Registros (`componerLosRegistros`). */
export function comidasDelPlanDelDia(d: ContrasteDescriptivo['days'][number]): ComidasDelPlanDelDia {
  if (d.meals.length === 0) return { estado: 'SIN_DETERMINAR', motivo: d.planId ? 'SIN_DIA_TIPO' : 'SIN_PLAN' };
  const sinOpcion = d.meals.filter((m) => m.state !== 'REGISTERED');
  return {
    estado: 'CONOCIDAS',
    esperadas: d.meals.length,
    conOpcion: d.meals.length - sinOpcion.length,
    conComidaDiferente: sinOpcion.filter((m) => m.differentMealExecutionIds.length > 0).length,
    sinRegistro: sinOpcion.filter((m) => m.differentMealExecutionIds.length === 0).map((m) => m.label),
  };
}

/**
 * Las comidas del plan de cada día con registros efectivos: el contraste de API-NUT-17 sobre las mismas versiones, así
 * Analizar, el Resumen y Registros cuentan igual. Cada registro se lee contra la versión que referencia. Un día sin
 * registros no entra: es un hueco, no un día con todas sus comidas sin registro.
 */
export function comidasDelPlanDeLosDias(dias: readonly DiaNutricional[], versiones: readonly VersionEnPeriodo[]): Map<string, ComidasDelPlanDelDia> {
  const conRegistros = dias.filter((d) => d.registros.length > 0);
  const contraste = construirContraste(
    conRegistros.map((d) => d.fecha),
    versiones,
    conRegistros.flatMap((d) => d.registros.map(ingestaDelContraste)),
  );
  return new Map(contraste.days.map((d) => [d.date, comidasDelPlanDelDia(d)]));
}

const MOTIVO_SIN_DETERMINAR: Readonly<Record<'SIN_PLAN' | 'SIN_DIA_TIPO', ComidasDelPlan['daysUndetermined'][number]['reason']>> = { SIN_PLAN: 'NO_ACTIVE_PLAN', SIN_DIA_TIPO: 'DAY_TYPE_NOT_RECORDED' };

/** Las comidas del plan de varios días (un punto, una semana o el período), sumadas. */
export function comidasDelPlanSumadas(lista: readonly ComidasDelPlanDelDia[]): ComidasDelPlan {
  const conocidas = lista.flatMap((c) => (c.estado === 'CONOCIDAS' ? [c] : []));
  const sin = new Map<ComidasDelPlan['daysUndetermined'][number]['reason'], number>();
  for (const c of lista) if (c.estado === 'SIN_DETERMINAR') sin.set(MOTIVO_SIN_DETERMINAR[c.motivo], (sin.get(MOTIVO_SIN_DETERMINAR[c.motivo]) ?? 0) + 1);
  const suma = (f: (c: (typeof conocidas)[number]) => number) => conocidas.reduce((s, c) => s + f(c), 0);
  return {
    daysKnown: conocidas.length,
    // En el orden del enumerado: el archivo y la pantalla siempre los dicen igual.
    daysUndetermined: (['NO_ACTIVE_PLAN', 'DAY_TYPE_NOT_RECORDED'] as const).flatMap((reason) => (sin.has(reason) ? [{ reason, days: sin.get(reason) as number }] : [])),
    expected: suma((c) => c.esperadas),
    withPlanOption: suma((c) => c.conOpcion),
    withDifferentMeal: suma((c) => c.conComidaDiferente),
    withoutRecord: suma((c) => c.sinRegistro.length),
  };
}

/** Un día con registros que nadie ubicó en el plan (no debería pasar: el contraste arma uno por fecha). No se inventa. */
const SIN_INFORMACION_DEL_PLAN: ComidasDelPlanDelDia = { estado: 'SIN_DETERMINAR', motivo: 'SIN_PLAN' };

const contar = (n: number, uno: string, varios: string): string => `${numero(n)} ${n === 1 ? uno : varios}`;

/**
 * Las comidas del plan en un renglón, con las palabras de la pestaña Registros: «3 de 4 registradas · 1 sin registro»,
 * «2 de 4 registradas · 1 con una comida diferente · 1 sin registro», o por qué no se pueden conocer. En una semana o un
 * período, con sus días.
 */
export function comidasDelPlanEnPalabras(c: ComidasDelPlan): string {
  const sinDeterminar = c.daysUndetermined.reduce((s, d) => s + d.days, 0);
  const motivos = c.daysUndetermined.map((d) => (d.reason === 'NO_ACTIVE_PLAN' ? 'no había un plan vigente' : 'el plan tiene más de un día tipo y no hay registros del plan que digan cuál'));
  if (c.daysKnown === 0) return sinDeterminar === 0 ? 'sin días con registros' : `sin determinar: ${motivos.join(' y ')}`;
  const partes = [
    // Como el renglón del día de Registros: «registrada» va con el total (1 de 1 registrada, 1 de 4 registradas).
    `${numero(c.withPlanOption)} de ${numero(c.expected)} ${c.expected === 1 ? 'registrada' : 'registradas'}`,
    ...(c.withDifferentMeal > 0 ? [contar(c.withDifferentMeal, 'con una comida diferente', 'con una comida diferente')] : []),
    ...(c.withoutRecord > 0 ? [`${numero(c.withoutRecord)} sin registro`] : []),
  ];
  const dias = c.daysKnown + sinDeterminar > 1 ? ` en ${contar(c.daysKnown, 'día', 'días')}` : '';
  const resto = sinDeterminar > 0 ? ` · ${contar(sinDeterminar, 'día', 'días')} sin determinar (${motivos.join(' y ')})` : '';
  return `${partes.join(' · ')}${dias}${resto}`;
}

export interface DiaNutricional {
  readonly fecha: string;
  /** Los registros efectivos del día (sin los anulados). */
  readonly registros: readonly RegistroParaAnalisis[];
  readonly anulados: number;
}

/** Los registros del período agrupados por fecha civil del hecho, con los anulados aparte (siguen en el historial). */
export function diasNutricionales(registros: readonly RegistroParaAnalisis[], desde: string, hasta: string): DiaNutricional[] {
  const porFecha = new Map<string, { registros: RegistroParaAnalisis[]; anulados: number }>();
  for (const r of registros) {
    if (r.localDate < desde || r.localDate > hasta) continue;
    const dia = porFecha.get(r.localDate) ?? { registros: [], anulados: 0 };
    if (r.annulment) dia.anulados++;
    else dia.registros.push(r);
    porFecha.set(r.localDate, dia);
  }
  return [...porFecha]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, d]) => ({ fecha, registros: [...d.registros].sort((x, y) => x.occurredAt.localeCompare(y.occurredAt) || x.recordId.localeCompare(y.recordId)), anulados: d.anulados }));
}

/** El aporte de un registro a un nutriente: su valor exacto, o por qué no tiene. */
function aporte(r: RegistroParaAnalisis, nutriente: NutrienteCalculado): { valor: string } | { motivo: MotivoNutricional } {
  if (!r.consumed) return { motivo: r.kind === 'DIFFERENT' ? 'COMIDA_DIFERENTE_SIN_CANTIDADES' : 'SIN_CANTIDADES' };
  const v = r.consumed[nutriente];
  return v.value === null ? { motivo: 'SIN_DATO_DEL_NUTRIENTE' } : { valor: v.value };
}

interface ValorDelDia {
  readonly fecha: string;
  readonly valor: string | null;
  readonly faltan: Readonly<Partial<Record<MotivoNutricional, number>>>;
  readonly cobertura: { readonly registros: number; readonly conCantidades: number; readonly sinCantidades: number };
  readonly rectificado: boolean;
  readonly fuentes: readonly string[];
  /** Las versiones del plan que ejecutan los registros efectivos del día (su referencia histórica, sin reatribuir). */
  readonly versiones: readonly string[];
  /** Las comidas del plan del día (DL-153). */
  readonly comidas: ComidasDelPlanDelDia;
}

/** Las versiones distintas de un conjunto de registros, ordenadas: la referencia que guardó cada registro. */
const versionesDe = (registros: readonly RegistroParaAnalisis[]): string[] => [...new Set(registros.map((r) => r.planId))].sort();

function valorDelDia(dia: DiaNutricional, nutriente: NutrienteCalculado, comidas: ComidasDelPlanDelDia): ValorDelDia {
  const conocidos: string[] = [];
  const faltan: Partial<Record<MotivoNutricional, number>> = {};
  for (const r of dia.registros) {
    const a = aporte(r, nutriente);
    if ('valor' in a) conocidos.push(a.valor);
    else faltan[a.motivo] = (faltan[a.motivo] ?? 0) + 1;
  }
  // DL-153: una comida del plan sin ningún registro no aporta número, y el número del día deja de ser todo lo que indicaba
  // el plan. Va después de los motivos de los registros: es lo que no se registró.
  if (comidas.estado === 'CONOCIDAS' && comidas.sinRegistro.length > 0) faltan.COMIDA_DEL_PLAN_SIN_REGISTRO = comidas.sinRegistro.length;
  const conCantidades = dia.registros.filter((r) => r.consumed !== null).length;
  return {
    fecha: dia.fecha,
    valor: conocidos.length > 0 ? sumaExacta(conocidos) : null,
    faltan,
    cobertura: { registros: dia.registros.length, conCantidades, sinCantidades: dia.registros.length - conCantidades },
    rectificado: dia.registros.some((r) => r.consumption?.source === 'RECTIFIED'),
    fuentes: dia.registros.map((r) => r.recordId),
    versiones: versionesDe(dia.registros),
    comidas,
  };
}

const MAXIMO_DE_FUENTES = 60;

const faltantesDe = (faltan: Readonly<Partial<Record<MotivoNutricional, number>>>) =>
  (Object.entries(faltan) as [MotivoNutricional, number][]).filter(([, n]) => n > 0).map(([reason, count]) => ({ reason, count }));

const calidadDe = (valor: string | null, faltan: Readonly<Partial<Record<MotivoNutricional, number>>>): PuntoAnalitico['quality'] =>
  valor === null ? 'UNKNOWN' : Object.values(faltan).some((n) => (n ?? 0) > 0) ? 'PARTIAL' : 'COMPLETE';

/** Los rótulos de las comidas del plan en el detalle de un punto: la pantalla y la exportación los leen por nombre. */
export const DETALLE_DE_COMIDAS_DEL_PLAN = { COMIDAS: 'Comidas del plan', SIN_REGISTRO: 'Sin registro' } as const;

const detalleDeCobertura = (c: ValorDelDia['cobertura'], comidas: ComidasDelPlanDelDia) => [
  { label: 'Registros', value: String(c.registros) },
  { label: 'Con cantidades', value: String(c.conCantidades) },
  ...(c.sinCantidades > 0 ? [{ label: 'Sin cantidades', value: String(c.sinCantidades) }] : []),
  // DL-153: cuántas comidas del plan tienen registro y cuáles no, o por qué no se puede saber.
  { label: DETALLE_DE_COMIDAS_DEL_PLAN.COMIDAS, value: comidasDelPlanEnPalabras(comidasDelPlanSumadas([comidas])) },
  ...(comidas.estado === 'CONOCIDAS' && comidas.sinRegistro.length > 0 ? [{ label: DETALLE_DE_COMIDAS_DEL_PLAN.SIN_REGISTRO, value: comidas.sinRegistro.join(', ') }] : []),
];

export interface OpcionesDeSerieNutricional {
  readonly desde: string;
  readonly hasta: string;
  /** La fecha civil de hoy en la zona del asesorado: el día de hoy es un balde parcial. */
  readonly hoy: string;
  /**
   * Las comidas del plan de cada día con registros (`comidasDelPlanDeLosDias`, DL-153). Sin el plan, cada día lo dice como
   * sin determinar: nunca se completa con comidas supuestas.
   */
  readonly comidasDelPlan: ReadonlyMap<string, ComidasDelPlanDelDia>;
}

/**
 * La serie registrada de una métrica en el grano pedido. Un día sin registros no es un punto: es un hueco. Un día con
 * registros pero sin ningún valor conocido es un punto `UNKNOWN` con `value: null` (para que la tabla diga «sin
 * cantidades»), y corta la línea igual que un hueco.
 */
export function serieNutricional(dias: readonly DiaNutricional[], definicion: DefinicionDeMetrica, metrica: MetricaNutricional, grano: 'DAY' | 'WEEK', o: OpcionesDeSerieNutricional): SerieAnalitica {
  const comidasDe = (fecha: string): ComidasDelPlanDelDia => o.comidasDelPlan.get(fecha) ?? SIN_INFORMACION_DEL_PLAN;
  const diarios: ValorDelDia[] =
    metrica === 'RECORDS'
      ? // El conteo de registros es exacto: una comida del plan sin registro no lo vuelve un subtotal, pero se dice al lado.
        dias.map((d) => ({
          fecha: d.fecha,
          valor: d.registros.length > 0 ? String(d.registros.length) : null,
          faltan: {},
          cobertura: { registros: d.registros.length, conCantidades: d.registros.filter((r) => r.consumed !== null).length, sinCantidades: d.registros.filter((r) => r.consumed === null).length },
          rectificado: false,
          fuentes: d.registros.map((r) => r.recordId),
          versiones: versionesDe(d.registros),
          comidas: comidasDe(d.fecha),
        }))
      : dias.filter((d) => d.registros.length > 0).map((d) => valorDelDia(d, NUTRIENTE_DE_LA_METRICA[metrica], comidasDe(d.fecha)));
  const conRegistros = diarios.filter((d) => d.cobertura.registros > 0);
  const fechasConValor = new Set(conRegistros.filter((d) => d.valor !== null).map((d) => d.fecha));

  let puntos: PuntoAnalitico[];
  let tramos: SerieAnalitica['segments'];
  if (grano === 'DAY') {
    let tramo = 0;
    let anterior: string | null = null;
    puntos = conRegistros.map((d) => {
      // Dos días con valor seguidos comparten tramo; un día sin valor o un hueco corta la línea.
      const continua = d.valor !== null && anterior !== null && fechasDelRango(anterior, d.fecha).length === 2;
      if (!continua) tramo++;
      anterior = d.valor !== null ? d.fecha : null;
      const cobertura: CoberturaDelPunto = {
        records: d.cobertura.registros,
        recordsWithQuantities: d.cobertura.conCantidades,
        recordsWithoutQuantities: d.cobertura.sinCantidades,
        daysWithData: null,
        daysInBucket: null,
        planMeals: comidasDelPlanSumadas([d.comidas]),
      };
      return {
        pointId: `d:${d.fecha}`,
        date: d.fecha,
        dateEnd: null,
        at: null,
        value: d.valor === null ? null : Number(d.valor),
        quality: metrica === 'RECORDS' ? 'COMPLETE' : calidadDe(d.valor, d.faltan),
        n: d.cobertura.registros,
        segment: `t${tramo}`,
        corrected: d.rectificado,
        partialBucket: d.fecha === o.hoy,
        dataClass: null,
        method: null,
        planVersionIds: [...d.versiones],
        coverage: cobertura,
        missing: faltantesDe(d.faltan),
        detail: detalleDeCobertura(d.cobertura, d.comidas),
        sources: d.fuentes.slice(0, MAXIMO_DE_FUENTES).map((id) => ({ type: 'MEAL_RECORD' as const, id })),
        sourcesTruncated: d.fuentes.length > MAXIMO_DE_FUENTES,
      };
    });
    tramos = [...new Set(puntos.map((p) => p.segment))].map((segment, i) => ({ segment, label: 'Días con registros', breakReason: i === 0 ? null : 'Un día sin registros, o sin valor conocido, corta la línea.' }));
  } else {
    puntos = [];
    for (const s of semanasDelPeriodo(o.desde, o.hasta)) {
      const delaSemana = conRegistros.filter((d) => d.fecha >= s.lunes && d.fecha <= s.domingo);
      if (delaSemana.length === 0) continue;
      const conValor = delaSemana.filter((d) => d.valor !== null);
      const valor = conValor.length === 0 ? null : metrica === 'RECORDS' ? sumaExacta(conValor.map((d) => d.valor as string)) : mediaExacta(conValor.map((d) => d.valor as string));
      const faltan: Partial<Record<MotivoNutricional, number>> = {};
      for (const d of delaSemana) for (const [m, n] of Object.entries(d.faltan) as [MotivoNutricional, number][]) faltan[m] = (faltan[m] ?? 0) + n;
      const registros = delaSemana.reduce((s2, d) => s2 + d.cobertura.registros, 0);
      const conCantidades = delaSemana.reduce((s2, d) => s2 + d.cobertura.conCantidades, 0);
      const fuentes = delaSemana.flatMap((d) => d.fuentes);
      const parcialDeHoy = o.hoy >= s.lunes && o.hoy <= s.domingo;
      const comidasDeLaSemana = comidasDelPlanSumadas(delaSemana.map((d) => d.comidas));
      puntos.push({
        pointId: `w:${s.lunes}`,
        date: s.lunes,
        dateEnd: s.domingo,
        at: null,
        value: valor === null ? null : Number(valor),
        quality: metrica === 'RECORDS' ? 'COMPLETE' : calidadDe(valor, faltan),
        n: metrica === 'RECORDS' ? registros : conValor.length,
        segment: 'semanas',
        corrected: delaSemana.some((d) => d.rectificado),
        partialBucket: s.parcial || parcialDeHoy,
        dataClass: null,
        method: null,
        planVersionIds: [...new Set(delaSemana.flatMap((d) => d.versiones))].sort(),
        coverage: {
          records: registros,
          recordsWithQuantities: conCantidades,
          recordsWithoutQuantities: registros - conCantidades,
          daysWithData: conValor.length,
          daysInBucket: s.diasEnElPeriodo,
          planMeals: comidasDeLaSemana,
        },
        missing: faltantesDe(faltan),
        detail: [
          { label: metrica === 'RECORDS' ? 'Días con registros' : 'Días con valor', value: `${conValor.length} de ${s.diasEnElPeriodo}` },
          { label: 'Registros', value: String(registros) },
          { label: 'Con cantidades', value: String(conCantidades) },
          { label: DETALLE_DE_COMIDAS_DEL_PLAN.COMIDAS, value: comidasDelPlanEnPalabras(comidasDeLaSemana) },
        ],
        sources: fuentes.slice(0, MAXIMO_DE_FUENTES).map((id) => ({ type: 'MEAL_RECORD' as const, id })),
        sourcesTruncated: fuentes.length > MAXIMO_DE_FUENTES,
      });
    }
    // Las semanas se unen entre sí solo si son consecutivas y tienen valor: una semana sin valor corta la línea.
    let tramo = 0;
    let anterior: PuntoAnalitico | null = null;
    puntos = puntos.map((p) => {
      const continua = p.value !== null && anterior !== null && anterior.value !== null && anterior.dateEnd !== null && fechasDelRango(anterior.dateEnd, p.date).length === 2;
      if (!continua) tramo++;
      anterior = p;
      return { ...p, segment: `t${tramo}` };
    });
    tramos = [...new Set(puntos.map((p) => p.segment))].map((segment, i) => ({ segment, label: 'Semanas con registros', breakReason: i === 0 ? null : 'Una semana sin valor corta la línea.' }));
  }

  return {
    metricId: definicion.id,
    label: definicion.nombre,
    unit: definicion.unidad,
    scale: definicion.escala,
    grain: grano,
    aggregation: definicion.granos.find((g) => g.grano === grano)?.agregacion ?? 'NONE',
    points: puntos,
    gaps: grano === 'DAY' ? huecosDelRango(o.desde, o.hasta, new Set(conRegistros.map((d) => d.fecha))) : [],
    segments: tramos,
    notes: [
      ...definicion.limites,
      ...(grano === 'WEEK' && metrica !== 'RECORDS' ? ['La semana es la media de los días con valor: el detalle dice cuántos de cuántos.'] : []),
      ...(fechasConValor.size === 0 && conRegistros.length > 0 ? ['Hay registros, pero ninguno con cantidades para esta métrica.'] : []),
    ],
  };
}

/**
 * La cobertura del período (para el Resumen y la respuesta de la proyección). Nada se convierte en un porcentaje. Las
 * comidas del plan son las de los días con registros, sin el de hoy: sigue en curso y todavía se puede registrar.
 */
export function coberturaNutricional(
  dias: readonly DiaNutricional[],
  desde: string,
  hasta: string,
  comidas: { readonly comidasDelPlan: ReadonlyMap<string, ComidasDelPlanDelDia>; readonly hoy: string },
): ResultadoDeProyeccionNutricional['coverage'] {
  const registros = dias.flatMap((d) => d.registros);
  const terminados = dias.filter((d) => d.registros.length > 0 && d.fecha !== comidas.hoy);
  return {
    daysInPeriod: fechasDelRango(desde, hasta).length,
    daysWithRecords: dias.filter((d) => d.registros.length > 0).length,
    records: registros.length,
    recordsWithQuantities: registros.filter((r) => r.consumed !== null).length,
    recordsWithoutQuantities: registros.filter((r) => r.consumed === null).length,
    differentMealsWithoutQuantities: registros.filter((r) => r.kind === 'DIFFERENT' && r.consumed === null).length,
    annulledExcluded: dias.reduce((s, d) => s + d.anulados, 0),
    rectifiedCountedOnce: registros.filter((r) => r.consumption?.source === 'RECTIFIED').length,
    planMeals: comidasDelPlanSumadas(terminados.map((d) => comidas.comidasDelPlan.get(d.fecha) ?? SIN_INFORMACION_DEL_PLAN)),
  };
}

/**
 * La calidad de un punto en palabras, la misma en la tabla, la lectura, el origen del dato y la exportación (DL-153).
 * - En nutrición, «completo» nunca se dice «sin faltantes»: es lo registrado con sus cantidades y, si el plan deja
 *   saberlo, con cada comida del plan registrada. Sigue sin probar que sea todo lo que comió ni en esas cantidades.
 * - Un conteo de registros (`esConteo`) es exacto aunque falte registrar una comida: lo dice el detalle, no la calidad.
 * - En entrenamiento y antropometría cada punto es una observación con su valor: no hay nada que falte adentro.
 */
export function calidadEnPalabras(p: Pick<PuntoAnalitico, 'quality' | 'coverage'>, esConteo = false): string {
  if (p.quality === 'UNKNOWN') return 'sin valor conocido';
  if (p.quality === 'PARTIAL') return 'subtotal de lo registrado';
  if (p.coverage === null) return 'sin faltantes';
  if (esConteo) return 'cuenta de los registros';
  const c = p.coverage.planMeals;
  const sinDeterminar = c.daysUndetermined.reduce((s, d) => s + d.days, 0);
  if (c.daysKnown > 0 && sinDeterminar === 0) return c.daysKnown === 1 ? 'cada comida del plan registrada, con cantidades' : 'cada comida del plan registrada, con cantidades, en sus días';
  return c.daysKnown === 0 ? 'registros con cantidades, sin saber qué comidas indicaba el plan' : 'registros con cantidades, sin saber en algún día qué comidas indicaba el plan';
}

export const NOTA_DE_LO_PREVISTO =
  'Lo previsto se muestra por opción en cada comida del plan. No se suma como objetivo del día: el plan ofrece alternativas por comida y BE no tiene una regla para elegir una.';
