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
 */
import { mediaExacta, sumaExacta, type NutrienteCalculado } from './calculo-nutricional';
import type { CoberturaDelPunto, MetricaNutricional, PuntoAnalitico, ResultadoDeProyeccionNutricional, SerieAnalitica } from './contratos-analisis';
import type { RegistroDeComida } from './contratos-registro-de-comidas';
import type { DefinicionDeMetrica } from './metricas-del-analisis';
import { fechasDelRango, huecosDelRango, semanasDelPeriodo } from './series-del-analisis';

/** Lo que el análisis lee de un registro (la forma de API-ING-03). */
export type RegistroParaAnalisis = Pick<RegistroDeComida, 'recordId' | 'kind' | 'localDate' | 'occurredAt' | 'consumption' | 'consumed' | 'annulment'>;

export const NUTRIENTE_DE_LA_METRICA: Readonly<Record<Exclude<MetricaNutricional, 'RECORDS'>, NutrienteCalculado>> = {
  ENERGY: 'energyKcal',
  PROTEIN: 'proteinG',
  CARBOHYDRATE: 'carbohydrateG',
  FAT: 'fatG',
  FIBER: 'fiberG',
};

/** Por qué un registro no aporta número a un nutriente. */
export type MotivoNutricional = 'SIN_CANTIDADES' | 'COMIDA_DIFERENTE_SIN_CANTIDADES' | 'SIN_DATO_DEL_NUTRIENTE';

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
}

function valorDelDia(dia: DiaNutricional, nutriente: NutrienteCalculado): ValorDelDia {
  const conocidos: string[] = [];
  const faltan: Partial<Record<MotivoNutricional, number>> = {};
  for (const r of dia.registros) {
    const a = aporte(r, nutriente);
    if ('valor' in a) conocidos.push(a.valor);
    else faltan[a.motivo] = (faltan[a.motivo] ?? 0) + 1;
  }
  const conCantidades = dia.registros.filter((r) => r.consumed !== null).length;
  return {
    fecha: dia.fecha,
    valor: conocidos.length > 0 ? sumaExacta(conocidos) : null,
    faltan,
    cobertura: { registros: dia.registros.length, conCantidades, sinCantidades: dia.registros.length - conCantidades },
    rectificado: dia.registros.some((r) => r.consumption?.source === 'RECTIFIED'),
    fuentes: dia.registros.map((r) => r.recordId),
  };
}

const MAXIMO_DE_FUENTES = 60;

const faltantesDe = (faltan: Readonly<Partial<Record<MotivoNutricional, number>>>) =>
  (Object.entries(faltan) as [MotivoNutricional, number][]).filter(([, n]) => n > 0).map(([reason, count]) => ({ reason, count }));

const calidadDe = (valor: string | null, faltan: Readonly<Partial<Record<MotivoNutricional, number>>>): PuntoAnalitico['quality'] =>
  valor === null ? 'UNKNOWN' : Object.values(faltan).some((n) => (n ?? 0) > 0) ? 'PARTIAL' : 'COMPLETE';

const detalleDeCobertura = (c: ValorDelDia['cobertura']) => [
  { label: 'Registros', value: String(c.registros) },
  { label: 'Con cantidades', value: String(c.conCantidades) },
  ...(c.sinCantidades > 0 ? [{ label: 'Sin cantidades', value: String(c.sinCantidades) }] : []),
];

export interface OpcionesDeSerieNutricional {
  readonly desde: string;
  readonly hasta: string;
  /** La fecha civil de hoy en la zona del asesorado: el día de hoy es un balde parcial. */
  readonly hoy: string;
}

/**
 * La serie registrada de una métrica en el grano pedido. Un día sin registros no es un punto: es un hueco. Un día con
 * registros pero sin ningún valor conocido es un punto `UNKNOWN` con `value: null` (para que la tabla diga «sin
 * cantidades»), y corta la línea igual que un hueco.
 */
export function serieNutricional(dias: readonly DiaNutricional[], definicion: DefinicionDeMetrica, metrica: MetricaNutricional, grano: 'DAY' | 'WEEK', o: OpcionesDeSerieNutricional): SerieAnalitica {
  const diarios: ValorDelDia[] =
    metrica === 'RECORDS'
      ? dias.map((d) => ({
          fecha: d.fecha,
          valor: d.registros.length > 0 ? String(d.registros.length) : null,
          faltan: {},
          cobertura: { registros: d.registros.length, conCantidades: d.registros.filter((r) => r.consumed !== null).length, sinCantidades: d.registros.filter((r) => r.consumed === null).length },
          rectificado: false,
          fuentes: d.registros.map((r) => r.recordId),
        }))
      : dias.filter((d) => d.registros.length > 0).map((d) => valorDelDia(d, NUTRIENTE_DE_LA_METRICA[metrica]));
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
      const cobertura: CoberturaDelPunto = { records: d.cobertura.registros, recordsWithQuantities: d.cobertura.conCantidades, recordsWithoutQuantities: d.cobertura.sinCantidades, daysWithData: null, daysInBucket: null };
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
        coverage: cobertura,
        missing: faltantesDe(d.faltan),
        detail: detalleDeCobertura(d.cobertura),
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
        coverage: { records: registros, recordsWithQuantities: conCantidades, recordsWithoutQuantities: registros - conCantidades, daysWithData: conValor.length, daysInBucket: s.diasEnElPeriodo },
        missing: faltantesDe(faltan),
        detail: [
          { label: metrica === 'RECORDS' ? 'Días con registros' : 'Días con valor', value: `${conValor.length} de ${s.diasEnElPeriodo}` },
          { label: 'Registros', value: String(registros) },
          { label: 'Con cantidades', value: String(conCantidades) },
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

/** La cobertura del período (para el Resumen y la respuesta de la proyección). Nada se convierte en un porcentaje. */
export function coberturaNutricional(dias: readonly DiaNutricional[], desde: string, hasta: string): ResultadoDeProyeccionNutricional['coverage'] {
  const registros = dias.flatMap((d) => d.registros);
  return {
    daysInPeriod: fechasDelRango(desde, hasta).length,
    daysWithRecords: dias.filter((d) => d.registros.length > 0).length,
    records: registros.length,
    recordsWithQuantities: registros.filter((r) => r.consumed !== null).length,
    recordsWithoutQuantities: registros.filter((r) => r.consumed === null).length,
    differentMealsWithoutQuantities: registros.filter((r) => r.kind === 'DIFFERENT' && r.consumed === null).length,
    annulledExcluded: dias.reduce((s, d) => s + d.anulados, 0),
    rectifiedCountedOnce: registros.filter((r) => r.consumption?.source === 'RECTIFIED').length,
  };
}

export const NOTA_DE_LO_PREVISTO =
  'Lo previsto se muestra por opción en cada comida del plan. No se suma como objetivo del día: el plan ofrece alternativas por comida y BE no tiene una regla para elegir una.';
