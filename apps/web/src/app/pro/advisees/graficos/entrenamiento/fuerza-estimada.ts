/**
 * GR-02 · El 1RM estimado (Epley v1), sesión a sesión, con las versiones del plan de fondo (WP-GRAFICOS fase 2, rama B;
 * DL-174 y DL-171). Lo puro: el carril, la lectura de cada versión (la mediana del RIR registrado, las repeticiones de la
 * serie usada y el ruido propio), lo que cambió en lo indicado entre versiones (la primera línea) y los extremos.
 *
 * - Lleno hasta 10 repeticiones equivalentes, hueco de más de 10 a 12 y rombo para lo observado por el profesional
 *   (`marcaDelPuntoDeFuerza`). La línea no cruza una sesión sin estimación (`tramosDeLaLinea`, ED-74) y lo observado no se
 *   une con lo de la persona: cada observación es su propio tramo.
 * - El eje abarca 10 kg o 22 lb como mínimo (GR-T15), como dice el catálogo: dos o tres kilos no parecen un salto.
 * - Cada punto va a la versión que regía ese día (GR-T16, `lecturaPorVersion`). Lo indicado de cada versión sale del
 *   comparador (API-TRN-21 y API-SER-01, GR-T14): el RIR y las repeticiones de las series que usó la regla por sesión.
 * - Nunca el signo más-menos, nunca porcentaje y nunca el primer punto contra el último: el ruido se dice antes que el
 *   cambio.
 *
 * Es puro: lo prueba `apps/web/test/graficos-entrenamiento.test.mjs`.
 */
import {
  cambioDeLoIndicado,
  estimacionALaVista,
  lecturaPorVersion,
  marcaDelPuntoDeFuerza,
  numero,
  serieDisponible,
  valorPlanificado,
  type ObjetivoDeLaSerie,
  type ObservacionDeEvolucion,
  type PuntoDeFuerza,
  type VigenciaDePlan,
} from '@be/domain';
import { estimacionDelPunto, laSerie, tramosDeLaLinea, type SerieQueNoEntro } from '../../fuerza/fuerza';
import type { CarrilDePuntos, PuntoDelCarril } from '../carriles';
import { textoDeLaMarca } from '../eje-de-fechas';
import { COPY_FUERZA_ESTIMADA as C } from './copy';

const porFecha = (a: PuntoDeFuerza, b: PuntoDeFuerza): number => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/** El `exerciseId` del catálogo de una clave `e:<id>`; `null` para una versión sin ejercicio conocido (`v:`). */
export const ejercicioDeLaClave = (exerciseKey: string | null | undefined): string | null => (exerciseKey && exerciseKey.startsWith('e:') ? exerciseKey.slice(2) : null);

/** «≈ 98 kg», al medio kilo o a la libra entera, como la tarjeta (ED-75). */
export const estimacionEnPalabras = (p: PuntoDeFuerza): string => estimacionALaVista(estimacionDelPunto(p, ''));

/** Lo que dicen la lectura y la tabla de un punto: «≈ 98 kg · 70 kg × 12 · RIR 0 · orientativa». */
export function lecturaDelPuntoDeFuerza(p: PuntoDeFuerza): string {
  return [
    estimacionEnPalabras(p),
    laSerie(p),
    ...(p.estimate.band === 'ORIENTATIVE' ? [C.lecturaOrientativa] : []),
    ...(p.source === 'OBSERVED' ? [C.lecturaObservada] : []),
  ].join(' · ');
}

/**
 * Los puntos del carril del 1RM estimado: primero los de la persona, del más antiguo al más reciente, y después lo
 * observado por el profesional. Los de la persona se unen solo si entre dos no hubo una sesión del ejercicio sin
 * estimación (también una que solo tuvo orientativas con el interruptor apagado); lo observado va suelto, y como la línea
 * une solo puntos seguidos del mismo tramo, ir al final hace que una observación entre dos sesiones no la corte.
 * `tardias`: las ejecuciones cargadas en un día posterior.
 */
export function puntosDelCarrilDeFuerza(
  puntos: readonly PuntoDeFuerza[],
  noEntraron: readonly SerieQueNoEntro[],
  soloOrientativas: readonly PuntoDeFuerza[] = [],
  tardias: ReadonlySet<string> = new Set(),
): PuntoDelCarril[] {
  const ordenados = [...puntos].sort(porFecha);
  const deLaPersona = ordenados.filter((p) => p.source === 'PERSON');
  const observadas = ordenados.filter((p) => p.source !== 'PERSON');
  const unidos = new Set(tramosDeLaLinea(deLaPersona, noEntraron, soloOrientativas).map(([a, b]) => `${a}-${b}`));
  const tramoDe = new Map<string, string>();
  let tramo = 0;
  deLaPersona.forEach((p, i) => {
    if (i > 0 && !unidos.has(`${i - 1}-${i}`)) tramo++;
    tramoDe.set(p.pointId, `persona-${tramo}`);
  });
  return [...deLaPersona, ...observadas].map((p) => {
    const origen = p.origin;
    return {
      clave: p.pointId,
      fecha: p.date,
      hasta: null,
      en: null,
      valor: p.estimate.value,
      rango: null,
      tramo: tramoDe.get(p.pointId) ?? `observada:${p.pointId}`,
      marca: marcaDelPuntoDeFuerza(p),
      tarde: origen.type === 'TRAINING_EXECUTION' && tardias.has(origen.id),
      lectura: lecturaDelPuntoDeFuerza(p),
    };
  });
}

/** El rango mínimo del eje del 1RM estimado, del catálogo (GR-T15): 10 kg o 22 lb. */
export function rangoMinimoDeLaFuerza(unidad: 'kg' | 'lb'): number | undefined {
  return serieDisponible('entrenamiento.1rm-estimado')?.rangoMinimoDelEje?.[unidad];
}

/** El carril de GR-02: un punto por sesión (y por observación), con su método y el rango mínimo del catálogo. */
export function carrilDeLaFuerza(puntos: readonly PuntoDelCarril[], fuerza: readonly PuntoDeFuerza[], unidad: 'kg' | 'lb'): CarrilDePuntos {
  const orden = [...fuerza].sort((a, b) => a.estimate.value - b.estimate.value);
  const bajo = orden[0];
  const alto = orden[orden.length - 1];
  const rangoMinimo = rangoMinimoDeLaFuerza(unidad);
  return {
    tipo: 'PUNTOS',
    id: 'entrenamiento.1rm-estimado',
    nombre: C.carril,
    unidad,
    metodo: C.metodo,
    indice: 0,
    puntos,
    indicado: [],
    escalones: [],
    unir: true,
    escala: rangoMinimo === undefined ? { enteros: false } : { rangoMinimo, enteros: false },
    cobertura: [...new Set(puntos.filter((p) => p.valor !== null).map((p) => p.fecha))].sort().map((fecha) => ({ fecha, estado: 'con' as const })),
    descripcion: bajo && alto ? C.descripcion(fuerza.length, estimacionEnPalabras(bajo), estimacionEnPalabras(alto)) : C.sinPuntos,
  };
}

/** «El valor más bajo del período: ≈ 92 kg (3/10); el más alto: ≈ 98 kg (12/11)», o `null` con un solo valor. */
export function extremosDeLaFuerza(puntos: readonly PuntoDeFuerza[]): string | null {
  if (puntos.length < 2) return null;
  const orden = [...puntos].sort((a, b) => a.estimate.value - b.estimate.value);
  const bajo = orden[0]!;
  const alto = orden[orden.length - 1]!;
  if (estimacionEnPalabras(bajo) === estimacionEnPalabras(alto)) return null;
  return C.extremos(estimacionEnPalabras(bajo), textoDeLaMarca(bajo.date), estimacionEnPalabras(alto), textoDeLaMarca(alto.date));
}

/** La lectura de una versión, para la lista de abajo del gráfico: su rótulo y lo que se sabe de sus sesiones. */
export interface LecturaDeLaVersion {
  readonly planVersionId: string;
  /** «Versión 3, desde el 2/9». */
  readonly rotulo: string;
  /** «5 sesiones · mediana del RIR registrado: 1 · de 5 a 6 repeticiones en la serie usada · entre sesiones…». */
  readonly texto: string;
  readonly desde: string;
  readonly hasta: string | null;
}

/**
 * Las lecturas de cada versión con puntos de la persona en el período (GR-02; GR-T16): la mediana del RIR registrado, el
 * rango de repeticiones de la serie usada y, con cuatro sesiones o más del núcleo, la mayor diferencia entre estimaciones
 * seguidas; con menos, que todavía no alcanza. Los puntos son de una sola unidad.
 */
export function lecturasPorVersion(puntos: readonly PuntoDeFuerza[], vigencias: readonly VigenciaDePlan[], unidad: 'kg' | 'lb'): LecturaDeLaVersion[] {
  return lecturaPorVersion(puntos, vigencias).flatMap((l) => {
    const v = vigencias.find((x) => x.planVersionId === l.planVersionId);
    if (!v) return [];
    const partes = [
      C.sesiones(l.sesiones),
      ...(l.medianaDelRir === null ? [] : [C.medianaDelRir(numero(l.medianaDelRir))]),
      ...(l.repeticiones ? [C.repeticiones(numero(l.repeticiones.desde), numero(l.repeticiones.hasta))] : []),
      l.diferenciaEntreSesiones === null ? C.ruidoSinAlcanzar : C.ruido(numero(l.diferenciaEntreSesiones, 1), unidad),
    ];
    return [{ planVersionId: l.planVersionId, rotulo: C.version(v.label, textoDeLaMarca(v.from)), texto: partes.join(' · '), desde: v.from, hasta: v.to }];
  });
}

/** La lectura de la versión que regía una fecha (el día del corte ya rige la siguiente), o `null`. */
export function lecturaDeLaVersionEn(fecha: string, lecturas: readonly LecturaDeLaVersion[]): LecturaDeLaVersion | null {
  return lecturas.find((l) => fecha >= l.desde && (l.hasta === null || fecha < l.hasta)) ?? null;
}

const enLaVigencia = (fecha: string, v: Pick<VigenciaDePlan, 'from' | 'to'>): boolean => fecha >= v.from && (v.to === null || fecha < v.to);

const rangoDe = (valores: readonly number[]): { readonly desde: number; readonly hasta: number } | null =>
  valores.length === 0 ? null : { desde: Math.min(...valores), hasta: Math.max(...valores) };

/**
 * Lo indicado para las series que usó la regla en cada versión (la versión que regía el día de cada punto): el RIR y las
 * repeticiones que indicaba esa versión para esas series, de las observaciones del comparador. Si la regla usó series con
 * objetivos distintos, el rango los abarca. Una versión sin nada indicado para esas series no está.
 */
export function objetivosDeLasVersiones(puntos: readonly PuntoDeFuerza[], observaciones: readonly ObservacionDeEvolucion[], vigencias: readonly VigenciaDePlan[]): ReadonlyMap<string, ObjetivoDeLaSerie> {
  const porClave = new Map(observaciones.map((o) => [`${o.comparacion.executionId}|${o.comparacion.prescriptionId}`, o] as const));
  const objetivos = new Map<string, ObjetivoDeLaSerie>();
  for (const v of vigencias) {
    if (v.domain !== 'TRAINING') continue;
    const rir: number[] = [];
    const repeticiones: number[] = [];
    for (const p of puntos) {
      const origen = p.origin;
      if (p.source !== 'PERSON' || origen.type !== 'TRAINING_EXECUTION' || !enLaVigencia(p.date, v)) continue;
      const o = porClave.get(`${origen.id}|${origen.prescriptionId}`);
      const fila = o?.comparacion.filas.find((f) => f.numero === origen.setIndex);
      if (!o || !fila || o.rol !== 'planificado-y-registrado') continue;
      const r = valorPlanificado(o.comparacion, fila, { variable: 'rir' });
      if (r.tipo === 'valor') rir.push(r.valor);
      const n = valorPlanificado(o.comparacion, fila, { variable: 'repeticiones' });
      if (n.tipo === 'valor') repeticiones.push(n.valor);
      if (n.tipo === 'rango') repeticiones.push(n.min, n.max);
    }
    if (rir.length === 0 && repeticiones.length === 0) continue;
    objetivos.set(v.planVersionId, { rir: rangoDe(rir), repeticiones: rangoDe(repeticiones) });
  }
  return objetivos;
}

/**
 * La primera línea de GR-02: lo que cambió en lo indicado entre dos versiones seguidas con estimaciones, que mueve la
 * estimación aunque la fuerza no («De la versión 2 a la versión 3, el RIR indicado pasó de 2 a 1: la estimación cambia
 * aunque la fuerza no.»). Vacía si nada cambió.
 */
export function cambiosDeLoIndicado(vigencias: readonly VigenciaDePlan[], objetivos: ReadonlyMap<string, ObjetivoDeLaSerie>): string[] {
  const conObjetivo = vigencias.filter((v) => v.domain === 'TRAINING' && objetivos.has(v.planVersionId)).sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
  const lineas: string[] = [];
  for (let i = 1; i < conObjetivo.length; i++) {
    const a = conObjetivo[i - 1]!;
    const b = conObjetivo[i]!;
    const texto = cambioDeLoIndicado(objetivos.get(a.planVersionId) ?? null, objetivos.get(b.planVersionId) ?? null);
    if (texto) lineas.push(C.cambio(C.versionCorta(a.label), C.versionCorta(b.label), texto));
  }
  return lineas;
}

/** «Con Epley, un RIR de diferencia mueve la estimación en la carga sobre 30: con 80 kg, unos 2,7 kg.» */
export function cuantoMueveUnRir(p: PuntoDeFuerza | null): string | null {
  if (!p) return null;
  const { value, unit } = p.estimate.load;
  return C.unRirMueve(numero(value), unit, numero(value / 30, 1));
}
