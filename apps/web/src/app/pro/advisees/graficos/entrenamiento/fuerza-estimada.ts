/**
 * GR-02 · El 1RM estimado (Epley v1), sesión a sesión, con las versiones del plan de fondo (WP-GRAFICOS fase 2, rama B;
 * DL-174 y DL-171). Lo puro: el carril, la lectura de cada versión (la mediana del RIR registrado, las repeticiones de la
 * serie usada y el ruido propio) y la línea de validez y ruido que va a la vista.
 *
 * - Lleno hasta 10 repeticiones equivalentes, hueco de más de 10 a 12 y rombo para lo observado por el profesional
 *   (`marcaDelPuntoDeFuerza`). La línea no cruza una sesión sin estimación (`tramosDeLaLinea`, ED-74) y lo observado no se
 *   une con lo de la persona: cada observación es su propio tramo.
 * - El eje abarca 10 kg o 22 lb como mínimo (GR-T15), como dice el catálogo: dos o tres kilos no parecen un salto.
 * - Cada punto va a la versión que regía ese día (GR-T16, `lecturaPorVersion`).
 * - El cambio de lo indicado es uno solo para toda la página, el de la pasada visual (`cambiosPorVersion` de la base, en
 *   la línea de cada versión): la primera línea propia de la rama B se fue al traer la pasada visual del 15/11.
 * - Con la pasada visual: un punto por sesión con su tamaño (`porSesion`), lo hueco con su sentido (la leyenda pide
 *   «De más de 10 a 12…» y no «Subtotal») y la tira de abajo con cada sesión: entera con estimación, una raya baja sin.
 * - Nunca el signo más-menos, nunca porcentaje y nunca el primer punto contra el último: el ruido se dice antes que el
 *   cambio.
 *
 * Es puro: lo prueba `apps/web/test/graficos-entrenamiento.test.mjs`.
 */
import { estimacionALaVista, lecturaPorVersion, marcaDelPuntoDeFuerza, numero, serieDisponible, type PuntoDeFuerza, type VigenciaDePlan } from '@be/domain';
import { COPY_DEL_RUIDO, estimacionDelPunto, laSerie, loQueMueveUnRir, tramosDeLaLinea, type SerieQueNoEntro } from '../../fuerza/fuerza';
import type { CarrilDePuntos, PuntoDelCarril } from '../carriles';
import { textoDeLaMarca } from '../eje-de-fechas';
import { COPY_FUERZA_ESTIMADA as C } from './copy';

const porFecha = (a: PuntoDeFuerza, b: PuntoDeFuerza): number => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/** El `exerciseId` del catálogo de una clave `e:<id>`; `null` para una versión sin ejercicio conocido (`v:`). */
export const ejercicioDeLaClave = (exerciseKey: string | null | undefined): string | null => (exerciseKey && exerciseKey.startsWith('e:') ? exerciseKey.slice(2) : null);

/** «≈ 98 kg», al medio kilo o a la libra entera, como la tarjeta (ED-75). */
export const estimacionEnPalabras = (p: PuntoDeFuerza): string => estimacionALaVista(estimacionDelPunto(p, ''));

/**
 * El número de la estimación tal como se escribe (al medio kilo o a la libra entera, como la tarjeta): el del punto en el
 * dibujo y el de su rótulo. Así el rótulo dice «160,5» donde la lectura dice «≈ 160,5 kg», y no «160,4» (la cuenta sin
 * redondear). Se corre menos de un cuarto de kilo: no se ve en el dibujo.
 */
export function valorALaVista(p: PuntoDeFuerza): number {
  const texto = estimacionEnPalabras(p).replace('≈ ', '').replace(` ${p.estimate.load.unit}`, '');
  const valor = Number(texto.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(valor) ? valor : p.estimate.value;
}

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
    const marca = marcaDelPuntoDeFuerza(p);
    return {
      clave: p.pointId,
      fecha: p.date,
      hasta: null,
      en: null,
      valor: valorALaVista(p),
      rango: null,
      tramo: tramoDe.get(p.pointId) ?? `observada:${p.pointId}`,
      marca,
      tarde: origen.type === 'TRAINING_EXECUTION' && tardias.has(origen.id),
      lectura: lecturaDelPuntoDeFuerza(p),
      // Lo hueco del 1RM estimado es lo orientativo, no un subtotal: la leyenda lo dice así (revisión del 15/11).
      ...(marca === 'HUECA' ? { sentido: 'ORIENTATIVA' as const } : {}),
    };
  });
}

/** El rango mínimo del eje del 1RM estimado, del catálogo (GR-T15): 10 kg o 22 lb. */
export function rangoMinimoDeLaFuerza(unidad: 'kg' | 'lb'): number | undefined {
  return serieDisponible('entrenamiento.1rm-estimado')?.rangoMinimoDelEje?.[unidad];
}

/**
 * El carril de GR-02: un punto por sesión (y por observación), con su método y el rango mínimo del catálogo. La tira de
 * abajo dice cada sesión del ejercicio en el período: entera con estimación y una raya baja sin estimación
 * (`sinEstimacion`: las fechas de las sesiones que no entraron, o que solo tuvieron orientativas con el interruptor
 * apagado). Así un corte de la línea se lee como lo que es: una sesión sin estimación, no un día sin entrenar.
 */
export function carrilDeLaFuerza(puntos: readonly PuntoDelCarril[], fuerza: readonly PuntoDeFuerza[], unidad: 'kg' | 'lb', sinEstimacion: readonly string[] = []): CarrilDePuntos {
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
    cobertura: coberturaDeLaFuerza(puntos, sinEstimacion),
    porSesion: true,
    descripcion: bajo && alto ? C.descripcion(fuerza.length, estimacionEnPalabras(bajo), estimacionEnPalabras(alto)) : C.sinPuntos,
  };
}

/** La tira de GR-02: cada sesión con estimación, entera; cada sesión sin estimación (y sin otra que sí), una raya baja. */
export function coberturaDeLaFuerza(puntos: readonly PuntoDelCarril[], sinEstimacion: readonly string[]): CarrilDePuntos['cobertura'] {
  const con = new Set(puntos.filter((p) => p.valor !== null).map((p) => p.fecha));
  const sin = sinEstimacion.filter((f) => !con.has(f));
  return [...new Set([...con, ...sin])].sort().map((fecha) => ({ fecha, estado: con.has(fecha) ? ('con' as const) : ('sin' as const) }));
}

/**
 * La línea que va a la vista debajo de GR-02, la misma que en «Analizar · Fuerza» (§5.6 y §5.12): el rango de validez y
 * lo que mueve un RIR en las estimaciones del período («Solo series de RIR 0 a 2 y hasta 10 repeticiones equivalentes.
 * Un RIR de diferencia mueve cada estimación ≈ 4,3 a 4,6 kg.»).
 */
export function validezYRuidoDeLaFuerza(puntos: readonly PuntoDeFuerza[], unidad: 'kg' | 'lb', conOrientativas: boolean): string {
  const ruido = loQueMueveUnRir(
    puntos.map((p) => p.estimate.load.value),
    unidad,
  );
  return ruido ? `${COPY_DEL_RUIDO.validez(conOrientativas)} ${COPY_DEL_RUIDO.ruido(ruido)}` : COPY_DEL_RUIDO.validez(conOrientativas);
}

/** La lectura de una versión, para la lista de abajo del gráfico: su rótulo y lo que se sabe de sus sesiones. */
export interface LecturaDeLaVersion {
  readonly planVersionId: string;
  /** «Versión 3, desde el 2/9». */
  readonly rotulo: string;
  /** «5 sesiones · mediana del RIR registrado: 1 · de 5 a 6 repeticiones en la serie usada · entre sesiones…». */
  readonly texto: string;
  /** El ruido propio de la versión, en una frase para la lectura del costado (§5.12): «Entre sesiones de la versión 8…». */
  readonly ruido: string;
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
    const ruido = l.diferenciaEntreSesiones === null ? C.ruidoDeLaVersionSinAlcanzar(C.versionCorta(v.label)) : C.ruidoDeLaVersion(C.versionCorta(v.label), numero(l.diferenciaEntreSesiones, 1), unidad);
    return [{ planVersionId: l.planVersionId, rotulo: C.version(v.label, textoDeLaMarca(v.from)), texto: partes.join(' · '), ruido, desde: v.from, hasta: v.to }];
  });
}

/** La lectura de la versión que regía una fecha (el día del corte ya rige la siguiente), o `null`. */
export function lecturaDeLaVersionEn(fecha: string, lecturas: readonly LecturaDeLaVersion[]): LecturaDeLaVersion | null {
  return lecturas.find((l) => fecha >= l.desde && (l.hasta === null || fecha < l.hasta)) ?? null;
}
