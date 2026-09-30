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

const DIA = 86_400_000;

/** Desfase (ms) entre la hora civil de la zona y UTC en ese instante; 0 si la zona no se reconoce. */
function desfaseDeZona(instante: number, zonaHoraria: string): number {
  try {
    const partes = new Intl.DateTimeFormat('en-US', { timeZone: zonaHoraria, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(instante));
    const n = (tipo: Intl.DateTimeFormatPartTypes): number => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
    const civil = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour') % 24, n('minute'), n('second'));
    return civil - Math.floor(instante / 1000) * 1000;
  } catch {
    return 0;
  }
}

/**
 * El instante (ms) en que empieza una fecha civil en la zona del período. No usa la zona del navegador: un profesional
 * que mira desde otra zona ve el período recortado igual que la API lo recortó.
 */
export function inicioDelDia(fechaCivilAaaaMmDd: string, zonaHoraria: string): number {
  const [a, m, d] = fechaCivilAaaaMmDd.split('-').map(Number);
  const supuesto = Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1);
  const primero = supuesto - desfaseDeZona(supuesto, zonaHoraria);
  // Si el desfase cambia en ese mismo día (cambio de horario), se corrige una vez más.
  return supuesto - desfaseDeZona(primero, zonaHoraria);
}

/** La fecha civil siguiente (`AAAA-MM-DD`), sin zona: es aritmética de calendario. */
export function diaSiguiente(fechaCivilAaaaMmDd: string): string {
  const [a, m, d] = fechaCivilAaaaMmDd.split('-').map(Number);
  return new Date(Date.UTC(a ?? 1970, (m ?? 1) - 1, d ?? 1) + DIA).toISOString().slice(0, 10);
}

/** Días de calendario entre dos fechas civiles (`b − a`); negativo si `b` es anterior. */
export const diasEntreFechas = (a: string, b: string): number => Math.round((inicioDelDia(b, 'UTC') - inicioDelDia(a, 'UTC')) / DIA);

/**
 * Los límites del eje temporal para el período pedido, en la zona del período: desde el inicio del primer día hasta el
 * inicio del día siguiente al último (exclusivo). Una observación válida para la API cae siempre adentro.
 */
export function limitesDelPeriodo(periodo: { readonly start: string; readonly end: string }, zonaHoraria: string): { readonly desde: number; readonly hasta: number } {
  return { desde: inicioDelDia(periodo.start, zonaHoraria), hasta: inicioDelDia(diaSiguiente(periodo.end), zonaHoraria) };
}

/**
 * Marcas del eje temporal: entre una y siete fechas civiles del período, repartidas en días enteros y ubicadas al
 * mediodía de su día en la zona del período. Ninguna cae después del último día.
 */
export function marcasDelPeriodo(periodo: { readonly start: string; readonly end: string }, zonaHoraria: string): { readonly instante: number; readonly fecha: string }[] {
  const dias = Math.max(1, diasEntreFechas(periodo.start, periodo.end) + 1);
  const paso = Math.max(1, Math.ceil(dias / 6));
  const marcas: { instante: number; fecha: string }[] = [];
  let fecha = periodo.start;
  for (let d = 0; d < dias; d += paso) {
    const inicio = inicioDelDia(fecha, zonaHoraria);
    marcas.push({ instante: inicio + (inicioDelDia(diaSiguiente(fecha), zonaHoraria) - inicio) / 2, fecha });
    for (let i = 0; i < paso; i += 1) fecha = diaSiguiente(fecha);
  }
  return marcas;
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
 * septiembre»). `null` si no comparten grupo, o si son la misma observación: no se comparan medidas con otro protocolo,
 * método o unidad, ni una medida consigo misma. `dias` son días de calendario entre las dos fechas civiles en la zona
 * del período: dos tomas de fechas consecutivas distan 1 día aunque las separen dos horas, y dos del mismo día, 0.
 */
export function diferenciaDescriptiva(a: Observacion, b: Observacion): { readonly delta: number; readonly unidad: string; readonly dias: number } | null {
  if (a.punto.comparabilityGroup !== b.punto.comparabilityGroup || a.punto.sourceId === b.punto.sourceId) return null;
  const [primera, segunda] = a.instante <= b.instante ? [a, b] : [b, a];
  const delta = Number((segunda.punto.value - primera.punto.value).toPrecision(12));
  return { delta, unidad: unidadDelGrupo(segunda.grupo, segunda.punto), dias: diasEntreFechas(primera.fecha, segunda.fecha) };
}

export const textoDeDiferenciaAntropometrica = (d: { readonly delta: number; readonly unidad: string }): string => `${d.delta < 0 ? '−' : d.delta > 0 ? '+' : ''}${cantidad(Math.abs(d.delta), d.unidad)}`;

/** «el mismo día» / «con 1 día de calendario entre las fechas» / «con 12 días de calendario entre las fechas». */
export const diasEnPalabras = (dias: number): string => (dias === 0 ? 'el mismo día' : `con ${numero(dias)} ${dias === 1 ? 'día' : 'días'} de calendario entre las fechas`);

/** Una referencia legible de un identificador opaco: los primeros 8 caracteres, o entero si es corto. */
const referenciaCorta = (id: string): string => (id.length > 10 ? `${id.slice(0, 8)}…` : id);

/**
 * El nombre de un grupo para elegirlo: protocolo, método si lo hay y unidad. Nunca inventa nombres de método: si dos
 * grupos de la misma serie solo se distinguen por la versión del método o del protocolo, agrega la referencia de esa
 * versión tal como la publica el contrato (recortada si es larga; entera si el recorte no alcanza para distinguirlos).
 */
export function nombreDelGrupo(g: GrupoDeComparabilidad, todos: readonly GrupoDeComparabilidad[] = [g]): string {
  const base = `${g.protocolName}${g.methodVersionId ? ` · ${COPY_ANTROPOMETRIA.calculado.toLowerCase()} con método` : ''} · ${g.unit}`;
  const homonimos = todos.filter((o) => o.comparabilityGroup !== g.comparabilityGroup && nombreBase(o) === base);
  if (homonimos.length === 0) return base;
  const partes: string[] = [];
  if (g.methodVersionId && homonimos.some((o) => o.methodVersionId !== g.methodVersionId)) partes.push(`método ${referencia(g.methodVersionId, homonimos.map((o) => o.methodVersionId ?? ''))}`);
  if (homonimos.some((o) => o.protocolVersionId !== g.protocolVersionId)) partes.push(`versión del protocolo ${referencia(g.protocolVersionId, homonimos.map((o) => o.protocolVersionId))}`);
  return partes.length === 0 ? base : `${base} (${partes.join(', ')})`;
}

const nombreBase = (g: GrupoDeComparabilidad): string => `${g.protocolName}${g.methodVersionId ? ` · ${COPY_ANTROPOMETRIA.calculado.toLowerCase()} con método` : ''} · ${g.unit}`;

/** La referencia corta si no coincide con la de ningún otro; si coincide, el identificador entero. */
function referencia(id: string, otros: readonly string[]): string {
  const corta = referenciaCorta(id);
  return otros.some((o) => o !== id && referenciaCorta(o) === corta) ? id : corta;
}

/** El protocolo de una observación, con la referencia de su versión si la serie tiene otra versión del mismo nombre. */
export function protocoloEnPalabras(g: GrupoDeComparabilidad, todos: readonly GrupoDeComparabilidad[]): string {
  const otraVersion = todos.some((o) => o.protocolName === g.protocolName && o.protocolVersionId !== g.protocolVersionId);
  return otraVersion ? `${g.protocolName} (versión ${referencia(g.protocolVersionId, todos.map((o) => o.protocolVersionId))})` : g.protocolName;
}

/** El método de una observación calculada: la referencia declarada por el contrato, sin inventarle un nombre. */
export const metodoEnPalabras = (methodVersionId: string): string => `${COPY_ANTROPOMETRIA.calculado} con el método declarado en la evaluación (referencia ${methodVersionId})`;

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
  /** Neutral a propósito: no dice si la evaluación existe, fue anulada o no está autorizada (misma regla que el 404). */
  evaluacionNoDisponible: 'La evaluación solicitada no está disponible. La lista de evaluaciones sigue completa.',
  evaluacionNoCargo: 'No pudimos abrir la evaluación solicitada.',
  volverALaLista: 'Volver a la lista de evaluaciones',
  delDia: (orden: number, total: number): string => `${numero(orden)} de ${numero(total)} del día`,
  zona: (zonaHoraria: string): string => `Fechas y horas en la zona del período (${zonaHoraria}).`,
} as const;
