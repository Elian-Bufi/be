/**
 * Las ventanas de lectura de los cruces (WP-GRAFICOS fase 2, DL-174), **fijadas antes de mirar los datos**: salen de las
 * fechas de las versiones y de las tomas, nunca de los valores. Una sola ventana por cruce: no se busca la que «da».
 *
 * - **SP-01:** dos etapas seguidas del objetivo nutricional, separadas por un cambio de versión, de 3 semanas o más cada
 *   una (la parte que cae en el período). Sin mirar además el efecto del día anterior.
 * - **SP-02:** de una toma de peso a la última, del mismo tramo comparable, con 14 días o más entre las dos (GR-T52).
 *
 * Y lo que entra en cada ventana de Nutrición: solo los días **con cantidades en todos sus registros y ninguna comida del
 * plan sin registro** (lo que BE sabe; nunca «día completo»), y cuántos quedaron afuera y por qué (sin registro o con
 * algún dato faltante). El día de hoy sigue en curso y no entra.
 *
 * Es puro: lo prueba `apps/web/test/graficos-cruces.test.mjs`.
 */
import { diaSiguiente, diasEntreFechas, type EscalonDelObjetivoApi, type PuntoAnalitico, type SerieAnalitica } from '@be/domain';

/** SP-01: cada etapa del objetivo, de 3 semanas como mínimo. */
export const DIAS_MINIMOS_DE_UNA_ETAPA_DEL_OBJETIVO = 21;
/** SP-02: entre las dos tomas, 14 días como mínimo. */
export const DIAS_MINIMOS_ENTRE_TOMAS = 14;

const diaAnterior = (fecha: string): string => new Date(Date.parse(`${fecha}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
const menor = (a: string, b: string): string => (a < b ? a : b);
const mayor = (a: string, b: string): string => (a > b ? a : b);

/** «3/11», como el resto del espacio profesional. */
export const diaYMes = (fecha: string): string => `${Number(fecha.slice(8, 10))}/${Number(fecha.slice(5, 7))}`;

export function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? (v[m] as number) : ((v[m - 1] as number) + (v[m] as number)) / 2;
}

/** Una etapa del objetivo nutricional dentro del período: un escalón por versión del objetivo. */
export interface EtapaDelObjetivo {
  readonly objectiveVersionId: string;
  /** El primer día que cae en el período. */
  readonly desde: string;
  /** El último día entero que cae en el período (el del corte ya es de la etapa siguiente). */
  readonly hasta: string;
  readonly dias: number;
  /** El período no cubre la etapa entera: se dice. */
  readonly recortada: boolean;
  /** Sigue vigente. */
  readonly abierta: boolean;
  /** El día en que empezó la versión (puede ser anterior al período). */
  readonly inicio: string;
}

/** Las etapas del objetivo en el período, de la más vieja a la más nueva. Una versión repetida cuenta una vez. */
export function etapasDelObjetivo(escalones: readonly EscalonDelObjetivoApi[], periodo: { readonly desde: string; readonly hasta: string }): EtapaDelObjetivo[] {
  const vistos = new Set<string>();
  return [...escalones]
    .sort((a, b) => a.from.localeCompare(b.from))
    .flatMap((e): EtapaDelObjetivo[] => {
      if (vistos.has(e.objectiveVersionId)) return [];
      vistos.add(e.objectiveVersionId);
      const ultimoDeLaVersion = e.to === null ? null : diaAnterior(e.to);
      const desde = mayor(e.from, periodo.desde);
      const hasta = ultimoDeLaVersion === null ? periodo.hasta : menor(ultimoDeLaVersion, periodo.hasta);
      if (desde > hasta) return [];
      return [
        {
          objectiveVersionId: e.objectiveVersionId,
          desde,
          hasta,
          dias: diasEntreFechas(desde, hasta) + 1,
          recortada: e.from < periodo.desde || (ultimoDeLaVersion !== null && ultimoDeLaVersion > periodo.hasta),
          abierta: e.to === null,
          inicio: e.from,
        },
      ];
    });
}

export type VentanaDeDosEtapas = { readonly tipo: 'LISTA'; readonly a: EtapaDelObjetivo; readonly b: EtapaDelObjetivo } | { readonly tipo: 'FALTA'; readonly motivo: 'SIN_CAMBIO_DE_OBJETIVO' | 'ETAPAS_CORTAS' };

/**
 * La ventana de SP-01: las dos últimas etapas seguidas del objetivo con 3 semanas o más cada una. Si el objetivo no
 * cambió en el período, o ninguna pareja seguida llega a 3 semanas por lado, no hay ventana y se dice.
 */
export function ventanaDelObjetivo(etapas: readonly EtapaDelObjetivo[]): VentanaDeDosEtapas {
  if (etapas.length < 2) return { tipo: 'FALTA', motivo: 'SIN_CAMBIO_DE_OBJETIVO' };
  for (let i = etapas.length - 1; i >= 1; i--) {
    const a = etapas[i - 1] as EtapaDelObjetivo;
    const b = etapas[i] as EtapaDelObjetivo;
    if (a.dias >= DIAS_MINIMOS_DE_UNA_ETAPA_DEL_OBJETIVO && b.dias >= DIAS_MINIMOS_DE_UNA_ETAPA_DEL_OBJETIVO) return { tipo: 'LISTA', a, b };
  }
  return { tipo: 'FALTA', motivo: 'ETAPAS_CORTAS' };
}

/** Una toma de peso: su fecha, su valor y su tramo comparable (protocolo, método y unidad). */
export interface TomaDePeso {
  readonly clave: string;
  readonly fecha: string;
  readonly valor: number;
  readonly tramo: string;
}

export const tomasDe = (serie: SerieAnalitica): TomaDePeso[] =>
  serie.points
    .filter((p): p is PuntoAnalitico & { value: number } => p.value !== null)
    .map((p) => ({ clave: p.pointId, fecha: p.date, valor: p.value, tramo: p.segment }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.clave.localeCompare(b.clave));

export interface ParDeTomas {
  readonly a: TomaDePeso;
  readonly b: TomaDePeso;
  readonly dias: number;
}

/**
 * La ventana de SP-02: la última toma (B) y la más reciente del mismo tramo comparable con 14 días o más antes (A). Con
 * tomas semanales, A no es la anterior inmediata: es la primera que deja dos semanas en el medio. Sin una pareja así,
 * no hay ventana.
 */
export function ventanaDeLasTomas(tomas: readonly TomaDePeso[]): ParDeTomas | null {
  const b = tomas[tomas.length - 1];
  if (!b) return null;
  for (let i = tomas.length - 2; i >= 0; i--) {
    const a = tomas[i] as TomaDePeso;
    const dias = diasEntreFechas(a.fecha, b.fecha);
    if (a.tramo === b.tramo && dias >= DIAS_MINIMOS_ENTRE_TOMAS) return { a, b, dias };
  }
  return null;
}

/** Lo que entra de Nutrición en una ventana: los días que BE puede leer enteros, y cuántos quedaron afuera y por qué. */
export interface DiasDeLaVentana {
  readonly desde: string;
  readonly hasta: string;
  readonly dias: number;
  /** Con cantidades en todos sus registros y ninguna comida del plan sin registro. */
  readonly incluidos: readonly PuntoAnalitico[];
  readonly sinRegistro: number;
  readonly conFaltantes: number;
  /** Hoy cae en la ventana y sigue en curso: no entra. */
  readonly enCurso: boolean;
  readonly mediana: number | null;
}

/** Los días de una serie diaria de Nutrición del `desde` al `hasta` (los dos incluidos). */
export function diasDeNutricion(serie: SerieAnalitica, desde: string, hasta: string, hoy: string): DiasDeLaVentana {
  const delRango = serie.points.filter((p) => p.date >= desde && p.date <= hasta);
  const enCurso = (hoy >= desde && hoy <= hasta) || delRango.some((p) => p.partialBucket);
  const terminados = delRango.filter((p) => !p.partialBucket && p.date !== hoy);
  const incluidos = terminados.filter((p) => p.value !== null && p.quality === 'COMPLETE');
  const conPunto = new Set(terminados.map((p) => p.date));
  const fechasIncluidas = new Set(incluidos.map((p) => p.date));
  const dias = desde > hasta ? 0 : diasEntreFechas(desde, hasta) + 1;
  const hoyEnLaVentana = hoy >= desde && hoy <= hasta ? 1 : 0;
  return {
    desde,
    hasta,
    dias,
    incluidos,
    sinRegistro: Math.max(0, dias - conPunto.size - hoyEnLaVentana),
    conFaltantes: [...conPunto].filter((f) => !fechasIncluidas.has(f)).length,
    enCurso,
    mediana: mediana(incluidos.map((p) => p.value as number)),
  };
}

/** El día siguiente, para la ventana de SP-02 que empieza el día después de un cambio. */
export const elDiaSiguiente = diaSiguiente;
export const elDiaAnterior = diaAnterior;
