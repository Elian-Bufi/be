/**
 * Una sola media semanal para todo BE (GR-VC13, a ratificar; WP-GRAFICOS §13.4 y §13.5). La media de una semana de
 * Nutrición es **la de GR-12** (`mediasDeLasSemanas`, la media de la semana v1, GR-T42), también en «Comparar dos etapas»
 * (GR-24, por semana) y en la media semanal de SP-02:
 * - entran los días con cantidades en todos sus registros (llenos o con el contorno cortado), si son 4 o más;
 * - un subtotal no entra: es un día a medias, y sumarlo baja la media sin que se vea (un hueco es un hueco, §5.4); queda
 *   afuera y se cuenta, con su motivo (§5.13);
 * - hoy y lo que viene no cuentan;
 * - sin media, la semana no es un cero ni un tramo vacío: si tiene días, va con su contorno cortado y sus días se ven igual.
 *
 * Este archivo no calcula ninguna media: corta el período en las etapas (ninguna semana mezcla A con B) y le pide cada
 * tramo a `mediasDeLasSemanas`, y lo pasa a la forma que dibujan el gráfico chico por semana (`semanas.ts`) y el carril
 * semanal de la base (`carriles.ts`).
 *
 * También «Agrupar por: Semana» de «Analizar» en Nutrición (`serieSemanalDeNutricion`, GR-VD03): antes pedía la semana a
 * API-PRJ-01, que promedia también los subtotales.
 *
 * Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs` (TEST-GRVD-001 y 005).
 */
import { fechasDelRango, type DefinicionDeMetrica, type PuntoAnalitico, type SerieAnalitica } from '@be/domain';
import type { SemanaDelCarril } from '../carriles';
import { saberDelDia, type MetricaDelGrafico } from '../nutricion/dias-de-nutricion';
import { mediasDeLasSemanas, type MediaDeLaSemana } from '../nutricion/por-semana';
import { convienePorSemana, cortesDeLasEtapas, cuandoEsLaSemana, type DiaDeLaSerie, type SemanaDeLaSerie } from '../semanas';

const DIA = 86_400_000;
const elDiaAnterior = (f: string): string => new Date(Date.parse(`${f}T12:00:00Z`) - DIA).toISOString().slice(0, 10);

/** Las métricas de Nutrición que tienen media de la semana: las de GR-12 y GR-13 (no la cantidad de registros ni los g/kg). */
const CON_MEDIA_DE_LA_SEMANA: ReadonlySet<string> = new Set(['ENERGY', 'PROTEIN', 'CARBOHYDRATE', 'FAT', 'FIBER']);

/**
 * La métrica de GR-12 o GR-13 de una definición, o `null` si la serie no va por semana: la cantidad de registros no es un
 * valor que se promedie así, y los g/kg van solo día por día (GR-VC02: una media mezclaría dos pesos sin decirlo).
 */
export function metricaConMediaDeLaSemana(d: Pick<DefinicionDeMetrica, 'area' | 'parametro'>): MetricaDelGrafico | null {
  return d.area === 'NUTRICION' && typeof d.parametro === 'string' && CON_MEDIA_DE_LA_SEMANA.has(d.parametro) ? (d.parametro as MetricaDelGrafico) : null;
}

/** Los tramos del período entre los cortes (el primer día de cada etapa y el siguiente al último): uno por lado. */
export function tramosEntreLosCortes(desde: string, hasta: string, cortes: readonly string[]): { desde: string; hasta: string }[] {
  if (hasta < desde) return [];
  const adentro = [...new Set(cortes)].filter((f) => f > desde && f <= hasta).sort();
  const inicios = [desde, ...adentro];
  return inicios.map((inicio, i) => ({ desde: inicio, hasta: i + 1 < inicios.length ? elDiaAnterior(inicios[i + 1] as string) : hasta }));
}

/** Una media de GR-12 en la forma de un tramo del gráfico chico: la misma media, el mismo texto. */
function tramoDeLaMedia(m: MediaDeLaSemana, hoy: string): SemanaDeLaSerie {
  const dias = fechasDelRango(m.desde, m.hasta).length;
  const conHoy = hoy >= m.desde && hoy <= m.hasta;
  return {
    lunes: m.lunes,
    desde: m.desde,
    hasta: m.hasta,
    valor: m.valor,
    conDato: m.incluidos,
    // Con `texto`, la lectura no arma la suya: lo que quedó afuera y por qué lo dice el texto de GR-12. Los subtotales no
    // entran en esta media, así que no hay ninguno adentro.
    subtotales: 0,
    sinValor: Math.max(0, m.dias - m.incluidos),
    sinRegistros: 0,
    dias,
    conHoy,
    hoyConDato: false,
    cortada: dias < 7,
    completa: m.entera,
    hueca: !m.entera,
    texto: m.texto,
    conDias: m.conDias,
  };
}

/**
 * Las semanas de una serie de Nutrición con la media de GR-12, cortadas en las etapas (`bandas`, las de A y B): ninguna
 * semana mezcla días de A con días de B, y lo de en medio es su propio tramo.
 */
export function semanasDeNutricion(
  puntos: readonly PuntoAnalitico[],
  metrica: MetricaDelGrafico,
  desde: string,
  hasta: string,
  hoy: string,
  bandas: readonly { readonly desde: string; readonly hasta: string }[] = [],
): SemanaDeLaSerie[] {
  return tramosEntreLosCortes(desde, hasta, cortesDeLasEtapas(bandas)).flatMap((t) => mediasDeLasSemanas(puntos, metrica, t.desde, t.hasta, hoy).map((m) => tramoDeLaMedia(m, hoy)));
}

/**
 * Si «Comparar dos etapas» arranca por semana (GR-VC12, como GR-12): con más de seis semanas de período y si alguna
 * semana de alguna métrica tiene media. Si ninguna llega, por semana se vería solo «sin media»: de entrada va día por día
 * y «Por semana» sigue a un toque.
 */
export const porSemanaDeEntrada = (desde: string, hasta: string, semanas: readonly (readonly SemanaDeLaSerie[])[]): boolean =>
  convienePorSemana(desde, hasta) && semanas.some((ss) => ss.some((s) => s.valor !== null));

/**
 * Los días de una serie de Nutrición para el gráfico chico por semana: los puntos tenues detrás de las barras y la tira de
 * cada día, con lo que BE sabe de cada uno (como GR-12): la tira va entera solo si el día no tiene nada que falte.
 */
export function diasDeLaSerieDeNutricion(puntos: readonly PuntoAnalitico[]): DiaDeLaSerie[] {
  return puntos.map((p) => ({ fecha: p.date, valor: p.value, parcial: p.value !== null && saberDelDia(p) !== 'CON_TODO', conRegistros: p.value === null, enCurso: p.partialBucket }));
}

/**
 * Las semanas del carril semanal de SP-02, con la misma media de GR-12: la barra va llena solo con los siete días
 * adentro, hueca si no, y una semana con días pero sin media va con su contorno cortado (no es un tramo vacío).
 */
export function semanasDelCarril(puntos: readonly PuntoAnalitico[], metrica: MetricaDelGrafico, desde: string, hasta: string, hoy: string): SemanaDelCarril[] {
  return semanasDeNutricion(puntos, metrica, desde, hasta, hoy).map((s) => ({
    lunes: s.lunes,
    valor: s.valor,
    dias: s.conDato,
    lectura: `${cuandoEsLaSemana(s)}: ${s.texto ?? ''}`,
    entera: s.completa,
    conDias: s.conDias === true,
  }));
}

/** El detalle de un punto semanal: lo que dice la media de GR-12 de esa semana, con sus días. */
export const DETALLE_DE_LA_MEDIA_DE_LA_SEMANA = 'Media de la semana (v1)';

/**
 * La serie semanal de una métrica de Nutrición para «Analizar» («Agrupar por: Semana»; GR-VC13 y GR-VD03): un punto por
 * semana de BE que toca el período, con la media de GR-12 de los días de esa semana dentro del período. Sin media (menos
 * de 4 días con cantidades en todos sus registros), el punto no tiene valor: la línea se corta, no es un cero. El punto
 * va lleno solo con los siete días adentro; si no, hueco, como una semana sin completar. Su detalle dice con cuántos días
 * se hizo la media y por qué quedaron afuera los otros. Los resúmenes y las comparaciones siguen con los días.
 */
export function serieSemanalDeNutricion(dias: SerieAnalitica, metrica: MetricaDelGrafico, desde: string, hasta: string, hoy: string): SerieAnalitica {
  const semanas = semanasDeNutricion(dias.points, metrica, desde, hasta, hoy);
  return {
    ...dias,
    grain: 'WEEK',
    aggregation: 'MEAN_OF_DAYS_WITH_DATA',
    points: semanas.map((s): PuntoAnalitico => {
      const domingo = new Date(Date.parse(`${s.lunes}T12:00:00Z`) + 6 * DIA).toISOString().slice(0, 10);
      const delTramo = dias.points.filter((p) => p.date >= s.desde && p.date <= s.hasta);
      return {
        pointId: `semana-v1:${s.lunes}`,
        date: s.lunes,
        dateEnd: domingo,
        at: null,
        value: s.valor,
        quality: s.valor === null ? 'UNKNOWN' : s.completa ? 'COMPLETE' : 'PARTIAL',
        n: s.conDato,
        segment: 'semana-v1',
        corrected: false,
        partialBucket: s.conHoy || s.cortada,
        dataClass: null,
        method: null,
        planVersionIds: [...new Set(delTramo.flatMap((p) => p.planVersionIds))],
        coverage: null,
        missing: [],
        detail: [{ label: DETALLE_DE_LA_MEDIA_DE_LA_SEMANA, value: s.texto ?? '' }],
        sources: [],
        sourcesTruncated: false,
      };
    }),
    gaps: [],
    segments: [],
  };
}
