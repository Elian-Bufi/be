/**
 * Evolución antropométrica, la lectura de API-ANT-06 preparada para verse (RF-049). Es la única interpretación de la
 * serie que usan el gráfico, el detalle y la tabla del website, así no pueden decir cosas distintas.
 *
 * No calcula nada sobre los datos: no interpola, no imputa, no arrastra, no promedia ni suaviza (REG-06-165/166;
 * INV-06-176/177; `honesty` en el propio contrato). Lo que hace es ordenar, agrupar y nombrar lo que la API ya dice:
 * - cada observación se identifica por `sourceId`: dos observaciones del mismo día son dos observaciones;
 * - los huecos siguen siendo tramos sin observación, y aparecen como tales en la tabla;
 * - un grupo de comparabilidad (mismo protocolo, método y unidad, REG-06-162) tiene su propio eje: nunca se mezclan
 *   unidades ni se comparan valores de grupos distintos;
 * - la diferencia entre dos observaciones es aritmética y descriptiva, solo dentro del mismo grupo: no es progreso ni
 *   resultado clínico (RF-048).
 */
import type { EvolucionResponse, PuntoDeSerieApi, SerieApi } from './contratos-antropometria';
import { COPY_ANTROPOMETRIA, ETIQUETA_DE_CLASE_DE_DATO } from './copy-antropometria';
import { cantidad, numero } from './formato-numeros';

export type MetricaDeEvolucion = EvolucionResponse['data']['metrics'][number];
export type GrupoDeComparabilidad = MetricaDeEvolucion['comparability']['groups'][number];

/** Una observación como la ve la pantalla: el punto de la API con su grupo resuelto y su posición en el día. */
export interface Observacion {
  readonly punto: PuntoDeSerieApi;
  readonly grupo: GrupoDeComparabilidad | null;
  /** Fecha civil de la observación (`AAAA-MM-DD`), la misma que usan los huecos. */
  readonly fecha: string;
  /** Posición entre las observaciones de la misma fecha: «2 de 3». */
  readonly delDia: { readonly orden: number; readonly total: number };
  /** Instante en milisegundos, para el eje temporal. */
  readonly instante: number;
}

export type FilaDeEvolucion = { readonly tipo: 'observacion'; readonly observacion: Observacion } | { readonly tipo: 'hueco'; readonly hueco: MetricaDeEvolucion['gaps'][number] };

export interface SeriePreparada {
  readonly metricCode: string;
  readonly observaciones: readonly Observacion[];
  readonly grupos: readonly GrupoDeComparabilidad[];
  /** Puntos y huecos, ordenados en el tiempo. */
  readonly filas: readonly FilaDeEvolucion[];
  /** Hay observaciones de más de un grupo: no se pueden poner en un solo eje. */
  readonly variosGrupos: boolean;
}

const porMomento = (a: PuntoDeSerieApi, b: PuntoDeSerieApi): number => a.occurredAt.localeCompare(b.occurredAt) || a.recordedAt.localeCompare(b.recordedAt) || a.sourceId.localeCompare(b.sourceId);

/**
 * La fecha civil del momento en la zona del período. `Intl` da la fecha local sin depender de la zona del navegador:
 * es la misma regla con la que la API arma los huecos (por día local del asesorado).
 */
export function fechaCivil(instante: string, zonaHoraria: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instante));
  } catch {
    return instante.slice(0, 10);
  }
}

/** Prepara una métrica: ordena, resuelve el grupo de cada punto y numera las observaciones de un mismo día. */
export function prepararSerie(serie: SerieApi, zonaHoraria: string): SeriePreparada {
  const grupos = serie.comparability.groups;
  const ordenados = [...serie.series].sort(porMomento);
  const porFecha = new Map<string, number>();
  for (const p of ordenados) {
    const f = fechaCivil(p.occurredAt, zonaHoraria);
    porFecha.set(f, (porFecha.get(f) ?? 0) + 1);
  }
  const vistos = new Map<string, number>();
  const observaciones: Observacion[] = ordenados.map((punto) => {
    const fecha = fechaCivil(punto.occurredAt, zonaHoraria);
    const orden = (vistos.get(fecha) ?? 0) + 1;
    vistos.set(fecha, orden);
    return {
      punto,
      grupo: grupos.find((g) => g.comparabilityGroup === punto.comparabilityGroup) ?? null,
      fecha,
      delDia: { orden, total: porFecha.get(fecha) ?? 1 },
      instante: new Date(punto.occurredAt).getTime(),
    };
  });
  const filas: FilaDeEvolucion[] = [
    ...observaciones.map((observacion): FilaDeEvolucion => ({ tipo: 'observacion', observacion })),
    ...serie.gaps.map((hueco): FilaDeEvolucion => ({ tipo: 'hueco', hueco })),
  ].sort((a, b) => claveDeOrden(a).localeCompare(claveDeOrden(b)));
  const gruposUsados = new Set(observaciones.map((o) => o.punto.comparabilityGroup));
  return { metricCode: serie.metricCode, observaciones, grupos, filas, variosGrupos: gruposUsados.size > 1 };
}

/** Un hueco ordena por su primer día, antes que una observación de ese mismo día. */
const claveDeOrden = (f: FilaDeEvolucion): string => (f.tipo === 'hueco' ? `${f.hueco.from}|0` : `${f.observacion.fecha}|1|${f.observacion.punto.occurredAt}`);

/** La observación con este `sourceId`, o `null`: la selección sigue a la identidad, no a la posición. */
export const observacionPorId = (serie: SeriePreparada, sourceId: string | null): Observacion | null => (sourceId ? (serie.observaciones.find((o) => o.punto.sourceId === sourceId) ?? null) : null);

/** Las observaciones de un grupo, para dibujarlas en su propio eje. */
export const observacionesDelGrupo = (serie: SeriePreparada, comparabilityGroup: string): Observacion[] => serie.observaciones.filter((o) => o.punto.comparabilityGroup === comparabilityGroup);

/**
 * El grupo que se muestra al abrir una métrica: el de la observación más reciente. Si el grupo pedido ya no existe en
 * la serie (cambió el período o la métrica), se vuelve a ese; nunca queda un filtro obsoleto.
 */
export function grupoVigente(serie: SeriePreparada, pedido: string | null): string | null {
  if (pedido && serie.observaciones.some((o) => o.punto.comparabilityGroup === pedido)) return pedido;
  const ultima = serie.observaciones[serie.observaciones.length - 1];
  return ultima?.punto.comparabilityGroup ?? null;
}

/** La métrica que sigue elegida al cambiar el período: la pedida si sigue en la respuesta; si no, la primera. */
export function metricaVigente(metricas: readonly SerieApi[], pedida: string | null): string | null {
  if (pedida && metricas.some((m) => m.metricCode === pedida)) return pedida;
  return metricas[0]?.metricCode ?? null;
}

/** Una unidad por grupo: el eje vertical la muestra tal como la publica el contrato, sin convertir. */
export const unidadDelGrupo = (g: GrupoDeComparabilidad | null, punto: PuntoDeSerieApi): string => g?.unit ?? punto.unit;

/**
 * La diferencia entre dos observaciones **del mismo grupo**: aritmética y descriptiva («+1,5 kg entre el 3 y el 20 de
 * septiembre»). `null` si no comparten grupo: no se comparan medidas con otro protocolo, método o unidad.
 */
export function diferenciaDescriptiva(a: Observacion, b: Observacion): { readonly delta: number; readonly unidad: string; readonly dias: number } | null {
  if (a.punto.comparabilityGroup !== b.punto.comparabilityGroup) return null;
  const [primera, segunda] = a.instante <= b.instante ? [a, b] : [b, a];
  const delta = Number((segunda.punto.value - primera.punto.value).toPrecision(12));
  const dias = Math.round((segunda.instante - primera.instante) / 86_400_000);
  return { delta, unidad: unidadDelGrupo(segunda.grupo, segunda.punto), dias };
}

export const textoDeDiferenciaAntropometrica = (d: { readonly delta: number; readonly unidad: string }): string => `${d.delta < 0 ? '−' : d.delta > 0 ? '+' : ''}${cantidad(Math.abs(d.delta), d.unidad)}`;

/** El nombre de un grupo para elegirlo: protocolo, método si lo hay y unidad. Nunca inventa nombres de método. */
export function nombreDelGrupo(g: GrupoDeComparabilidad): string {
  const metodo = g.methodVersionId ? ` · ${COPY_ANTROPOMETRIA.calculado.toLowerCase()} con método` : '';
  return `${g.protocolName}${metodo} · ${g.unit}`;
}

/** Lo que dice la observación en una línea: valor, clase y si viene de una corrección. */
export function resumenDeObservacion(o: Observacion): string {
  const clase = ETIQUETA_DE_CLASE_DE_DATO[o.punto.dataClass];
  const corregida = o.punto.correctionState === 'CORRECTED' ? ` · ${COPY_ANTROPOMETRIA.corregida}` : '';
  return `${cantidad(o.punto.value, unidadDelGrupo(o.grupo, o.punto))} · ${clase}${corregida}`;
}

/** Los motivos de no comparabilidad con el punto anterior, en palabras; vacío si es comparable. */
export const motivosEnPalabras = (o: Observacion): string[] => o.punto.incomparableWithPrevious.map((m) => COPY_ANTROPOMETRIA.motivoNoComparable[m]);

export const COPY_EVOLUCION = {
  metrica: 'Métrica',
  grupo: 'Grupo de comparabilidad',
  observaciones: 'Observaciones',
  elegiUnaMetrica: 'Elegí una métrica para ver sus observaciones en el tiempo.',
  unaSola: 'Hay una sola observación en el período: todavía no hay evolución que mirar. Podés ampliar el período.',
  variosGrupos: 'Las observaciones de esta métrica no son todas comparables entre sí: se muestran por grupo, cada uno en su propio eje. Elegí cuál ver.',
  ejeTemporal: 'Eje horizontal: fecha de la observación, a escala; eje vertical: valor en su unidad. Solo puntos: los días sin observación quedan vacíos, no se unen ni se completan.',
  puntoElegido: 'Observación elegida',
  ninguna: 'Elegí una observación con un clic, un toque o las flechas para ver su valor exacto y su origen.',
  valor: 'Valor',
  momento: 'Tomada el',
  registro: 'Registrada el',
  clase: 'Clase',
  protocolo: 'Protocolo',
  metodo: 'Método',
  unidad: 'Unidad',
  correccion: 'Corrección',
  vieneDeCorreccion: 'El valor vigente viene de una corrección: el original se conserva en la evaluación.',
  sinCorreccion: 'Valor original, sin correcciones.',
  comparabilidad: 'Comparabilidad',
  abrirEvaluacion: 'Abrir la evaluación de origen',
  comparar: 'Comparar con otra observación',
  compararCon: 'Comparar con',
  sinComparar: 'No comparar',
  diferencia: 'Diferencia',
  diferenciaAclaracion: 'Es una resta entre dos valores del mismo grupo. No es una valoración de progreso ni un resultado clínico.',
  noComparables: 'Estas dos observaciones no comparten grupo: no se comparan.',
  tabla: 'Tabla de observaciones',
  tablaAclaracion: 'La tabla tiene las mismas observaciones y los mismos huecos que el gráfico.',
  elegirEnTabla: 'Ver en el gráfico',
  metricaCambio: 'La métrica que estabas viendo no tiene observaciones en este período: se muestra la primera disponible.',
  delDia: (orden: number, total: number): string => `${numero(orden)} de ${numero(total)} del día`,
} as const;
