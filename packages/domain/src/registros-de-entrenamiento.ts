/**
 * Los registros de Entrenamiento de un período, para el profesional (WP-ESCRITORIO-AREAS, parte 2; maqueta 25).
 * - Cada sesión registrada es una fila, de la más nueva a la más vieja (C-68).
 * - El detalle de una sesión es una tabla con cada serie una sola vez: lo indicado, lo registrado y cómo quedó frente a
 *   lo indicado (C-66).
 *
 * Se apoya en la comparación que ya existe (`compararEjecucion`): de ahí salen las series de cada ejercicio, lo que
 * rige (la corrección vigente, si hay una) y si lo registrado es el ejercicio indicado u otro. Este módulo le pone las
 * palabras y las cuentas.
 *
 * Lo que cuida:
 * - **Lo indicado de una serie es el de la versión del plan de ese día,** nunca el de hoy. Si los objetivos de esa
 *   versión no se pudieron leer, la sesión no dice «Dentro de lo indicado»: dice que no se pudo leer lo indicado. Una
 *   falla no es una ausencia de diferencias.
 * - **Una serie «con diferencias»** es una serie registrada cuyas repeticiones o cuyo RIR quedaron por encima o por
 *   debajo de lo indicado. La carga se dice y no cuenta: la sugerida es un complemento, no una obligación. Un dato que no
 *   se registró no es una diferencia: se dice aparte («RIR: sin dato»).
 * - **Una serie sin registrar es un hueco:** no es un cero, no es una diferencia y no quiere decir que no se haya hecho.
 * - **Una sesión registrada como no realizada, o resumida, no se cuenta serie por serie:** no dice «0 de 10».
 * - **Si se hizo otro ejercicio,** sus series cuentan como registradas y no se comparan con lo indicado para el original.
 * Es descriptivo: nada de esto es un puntaje ni dice si la sesión estuvo bien.
 */
import {
  compararEjecucion,
  COPY_COMPARACION,
  esElMismoEjercicio,
  identidadDeVersiones,
  type ComparacionDeEjercicio,
  type FilaDeSerie,
  type FuenteDelRegistro,
  type IdentidadDelRegistro,
  type ObjetivosDeLaVersion,
} from './comparacion-de-entrenamiento';
import type { EjecucionDeEntrenamiento, SerieEjecutadaApi } from './contratos-entrenamiento';
import type { ObjetivoDeSerie } from './contratos-entrenamiento-por-serie';
import { cantidadDeSeries, ETIQUETA_DE_GRANULARIDAD, etiquetaDeCondicionRegistrada, registroVigente } from './copy-entrenamiento';
import { COPY_ENTRENAMIENTO_POR_SERIE, ETIQUETA_DE_RELACION, textoDelPlanDeLaSerie, textoDeRepeticiones } from './copy-entrenamiento-por-serie';
import { cantidad, numero } from './formato-numeros';
import type { NombreDeIcono } from './iconos';
import { relacionDeCarga, relacionDeRepeticiones, relacionDeRir, type RelacionConElObjetivo } from './relacion-con-el-objetivo';

// ─── Una serie ──────────────────────────────────────────────────────────────────────────────────────────────

/** «62,5 kg · 8 rep. · RIR 2», con lo que no se registró dicho como tal. El esfuerzo percibido va si vino. */
export function serieRegistradaEnPalabras(s: SerieEjecutadaApi): string {
  return [
    s.load ? cantidad(s.load.value, s.load.unit) : 'carga no registrada',
    s.completedRepetitions === null ? 'repeticiones no registradas' : `${numero(s.completedRepetitions)} rep.`,
    s.rir === null ? null : `RIR ${numero(s.rir)}`,
    s.perceivedExertion === null ? null : `esfuerzo percibido ${numero(s.perceivedExertion)}`,
  ]
    .filter((p): p is string => p !== null)
    .join(' · ');
}

export interface RelacionDeUnaSerie {
  /** Las repeticiones o el RIR quedaron por encima o por debajo de lo indicado. La carga no cuenta. */
  readonly conDiferencia: boolean;
  /** Había un objetivo de repeticiones o de RIR y ese dato no se registró. */
  readonly conDatoSinRegistrar: boolean;
  /** Ningún dato de la serie tenía un objetivo con qué compararlo. */
  readonly sinObjetivo: boolean;
  /**
   * Cómo quedaron las repeticiones y el RIR: «Dentro de lo indicado», «RIR: por debajo», «Rep.: por encima · RIR: sin
   * dato». Si ninguno de los dos tenía objetivo, lo dice.
   */
  readonly texto: string;
  /** Lo de la carga, aparte: «Carga: por encima de la sugerida». `null` si es la sugerida o si no había una sugerida. */
  readonly carga: string | null;
}

const FUERA: readonly RelacionConElObjetivo[] = ['DEBAJO', 'ENCIMA'];

/**
 * Una serie registrada frente a su objetivo. De las repeticiones y del RIR dice lo que no quedó dentro de lo indicado,
 * dato por dato. Lo de la carga va aparte, y dice contra qué se compara: la sugerida no es una obligación.
 */
export function relacionDeUnaSerie(objetivo: Pick<ObjetivoDeSerie, 'repetitions' | 'rir' | 'suggestedLoad'>, s: SerieEjecutadaApi): RelacionDeUnaSerie {
  const reps = relacionDeRepeticiones(objetivo.repetitions, s.completedRepetitions);
  const rir = relacionDeRir(objetivo.rir, s.rir);
  const carga = relacionDeCarga(objetivo.suggestedLoad, s.load);
  const partes: string[] = [];
  if (reps !== 'SIN_OBJETIVO' && reps !== 'DENTRO') partes.push(`Rep.: ${ETIQUETA_DE_RELACION[reps]}`);
  if (rir !== 'SIN_OBJETIVO' && rir !== 'IGUAL') partes.push(`RIR: ${ETIQUETA_DE_RELACION[rir]}`);
  const sinObjetivo = reps === 'SIN_OBJETIVO' && rir === 'SIN_OBJETIVO' && carga === 'SIN_OBJETIVO';
  const sinObjetivoDeRepsNiDeRir = reps === 'SIN_OBJETIVO' && rir === 'SIN_OBJETIVO';
  return {
    conDiferencia: FUERA.includes(reps) || FUERA.includes(rir),
    conDatoSinRegistrar: reps === 'SIN_DATO' || rir === 'SIN_DATO',
    sinObjetivo,
    texto: sinObjetivo ? 'Sin objetivo: no se compara' : sinObjetivoDeRepsNiDeRir ? 'Sin objetivo de repeticiones ni de RIR' : partes.length === 0 ? 'Dentro de lo indicado' : partes.join(' · '),
    carga:
      carga === 'DEBAJO' || carga === 'ENCIMA'
        ? `Carga: ${ETIQUETA_DE_RELACION[carga]} de la ${COPY_COMPARACION.sugerida}`
        : carga === 'SIN_OBJETIVO' || carga === 'IGUAL'
          ? null
          : `Carga: ${ETIQUETA_DE_RELACION[carga]}`,
  };
}

// ─── El detalle de una sesión ───────────────────────────────────────────────────────────────────────────────

export type EstadoDeSerieDeSesion = 'REGISTRADA' | 'ADICIONAL' | 'SIN_REGISTRAR' | 'RESUMIDA';

export interface SerieDeSesion {
  /** El número real de la serie: no se renumera. */
  readonly numero: number;
  readonly estado: EstadoDeSerieDeSesion;
  readonly indicado: string;
  /** La nota que el profesional le puso a esa serie en el plan, si tiene. */
  readonly nota: string | null;
  readonly registrado: string;
  /** Cómo quedó frente a lo indicado, por las repeticiones y el RIR; o por qué no se compara. */
  readonly frente: string;
  /** Lo de la carga, aparte, si hay algo que decir: «Carga: por encima de la sugerida». */
  readonly frenteDeLaCarga: string | null;
  readonly conDiferencia: boolean;
  readonly conDatoSinRegistrar: boolean;
  /** Se comparó con algún objetivo (de repeticiones, de RIR o de carga). */
  readonly comparada: boolean;
  /** La corrección vigente cambió esta serie respecto del registro original. */
  readonly corregida: boolean;
}

export interface EjercicioDeSesion {
  readonly prescriptionId: string;
  /** El ejercicio que se registró; si no se registró ninguno, el indicado. */
  readonly nombre: string;
  /** El ejercicio indicado, si se registró otro (o no se puede saber si es el mismo). */
  readonly enLugarDe: string | null;
  readonly identidad: IdentidadDelRegistro;
  /** Lo que hay que saber para leer la tabla cuando se registró otra versión u otro ejercicio. */
  readonly aviso: string | null;
  /** Lo que la persona escribió, si registró el ejercicio con un resumen y no serie por serie. */
  readonly resumen: string | null;
  /** «4 de 4 series registradas», «Registro resumido». */
  readonly cuenta: string;
  /** «sin carga ni RIR indicados»: lo que lo indicado no fija en ninguna serie; `null` si no hay nada que avisar. */
  readonly notaDeLoIndicado: string | null;
  readonly registradas: number;
  readonly planificadas: number;
  readonly series: readonly SerieDeSesion[];
}

const NOTA_DE_IDENTIDAD: Readonly<Partial<Record<IdentidadDelRegistro, string>>> = {
  'mismo-ejercicio': COPY_COMPARACION.otraVersionDelMismo,
  'otro-ejercicio': COPY_COMPARACION.sustitucion,
  desconocida: COPY_COMPARACION.identidadSinResolver,
};

const NO_SE_COMPARA_POR_IDENTIDAD: Readonly<Partial<Record<IdentidadDelRegistro, string>>> = {
  'otro-ejercicio': 'Otro ejercicio: no se compara',
  desconocida: `No se compara: ${COPY_COMPARACION.noSeSabeSiEsElMismo}`,
};

function serieDeSesion(c: ComparacionDeEjercicio, f: FilaDeSerie, seLeyoLoIndicado: boolean): SerieDeSesion {
  const planificada = f.planificada.tipo === 'planificada' ? f.planificada : null;
  const objetivo = planificada?.objetivo ?? null;
  const serie = f.registrada.tipo === 'registrada' ? f.registrada.serie : null;
  const resumida = f.registrada.tipo === 'sin-dato' && f.registrada.motivo === 'registro-resumido';
  const estado: EstadoDeSerieDeSesion = serie ? (planificada ? 'REGISTRADA' : 'ADICIONAL') : resumida ? 'RESUMIDA' : 'SIN_REGISTRAR';
  const base = { numero: f.numero, estado, nota: planificada?.nota ?? null, corregida: f.corregida };

  let indicado: string;
  if (!planificada) indicado = 'Adicional: no estaba indicada';
  else if (seLeyoLoIndicado && objetivo) indicado = textoDelPlanDeLaSerie({ repetitions: planificada.repeticiones, rir: objetivo.rir, suggestedLoad: objetivo.carga, restSeconds: null });
  else if (seLeyoLoIndicado) indicado = textoDeRepeticiones(planificada.repeticiones) ?? COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo;
  else indicado = `${textoDeRepeticiones(planificada.repeticiones) ?? 'Repeticiones sin indicar'} · la carga y el RIR no se pudieron leer`;

  const sinComparar = { frenteDeLaCarga: null, conDiferencia: false, conDatoSinRegistrar: false, comparada: false };
  if (!serie) {
    return { ...base, indicado, registrado: resumida ? 'Registro resumido' : COPY_ENTRENAMIENTO_POR_SERIE.sinRegistrar, frente: resumida ? 'No se compara serie por serie' : 'Sin registro: no se compara', ...sinComparar };
  }
  const registrado = serieRegistradaEnPalabras(serie);
  if (!planificada) return { ...base, indicado, registrado, frente: 'Adicional: no se compara', ...sinComparar };
  if (!esElMismoEjercicio(c.identidad)) return { ...base, indicado, registrado, frente: NO_SE_COMPARA_POR_IDENTIDAD[c.identidad] ?? 'No se compara', ...sinComparar };
  if (!seLeyoLoIndicado) return { ...base, indicado, registrado, frente: 'No se pudo leer lo indicado', ...sinComparar };
  const r = relacionDeUnaSerie({ repetitions: planificada.repeticiones, rir: objetivo?.rir ?? null, suggestedLoad: objetivo?.carga ?? null }, serie);
  return { ...base, indicado, registrado, frente: r.texto, frenteDeLaCarga: r.carga, conDiferencia: r.conDiferencia, conDatoSinRegistrar: r.conDatoSinRegistrar, comparada: !r.sinObjetivo };
}

const seriesRegistradas = (n: number, de: number): string => `${numero(n)} de ${numero(de)} ${de === 1 ? 'serie registrada' : 'series registradas'}`;
const adicionales = (n: number): string => (n === 0 ? '' : ` · ${numero(n)} ${n === 1 ? 'adicional' : 'adicionales'}`);

function ejercicioDeSesion(c: ComparacionDeEjercicio, seLeyoLoIndicado: boolean): EjercicioDeSesion {
  const series = c.filas.map((f) => serieDeSesion(c, f, seLeyoLoIndicado));
  const planificadas = c.filas.filter((f) => f.planificada.tipo === 'planificada').length;
  const registradas = series.filter((s) => s.estado === 'REGISTRADA').length;
  const deMas = series.filter((s) => s.estado === 'ADICIONAL').length;
  const objetivos = c.filas.flatMap((f) => (f.planificada.tipo === 'planificada' && f.planificada.objetivo ? [f.planificada.objetivo] : []));
  const sinCarga = objetivos.length > 0 && objetivos.every((o) => o.carga === null);
  const sinRir = objetivos.length > 0 && objetivos.every((o) => o.rir === null);
  const otro = c.realizado !== null && !esElMismoEjercicio(c.identidad);
  return {
    prescriptionId: c.prescriptionId,
    nombre: c.realizado?.nombre ?? c.prescripto.nombre,
    enLugarDe: otro ? c.prescripto.nombre : null,
    identidad: c.identidad,
    aviso: NOTA_DE_IDENTIDAD[c.identidad] ?? null,
    resumen: c.resumen,
    cuenta: c.resumen !== null ? 'Registro resumido' : `${seriesRegistradas(registradas, planificadas)}${adicionales(deMas)}`,
    notaDeLoIndicado: !seLeyoLoIndicado ? null : sinCarga && sinRir ? 'sin carga ni RIR indicados' : sinCarga ? 'sin carga indicada' : sinRir ? 'sin RIR indicado' : null,
    registradas,
    planificadas,
    series,
  };
}

// ─── La fila de una sesión ──────────────────────────────────────────────────────────────────────────────────

/** Cómo quedó registrada la sesión. Solo «por serie» se cuenta y se compara serie por serie. */
export type ClaseDeSesion = 'POR_SERIE' | 'RESUMIDA' | 'NO_REALIZADA' | 'SIN_REGISTRO_VIGENTE';

export interface FilaDeSesion {
  readonly id: string;
  readonly fecha: string;
  readonly ocurrio: string;
  readonly registradoEl: string;
  readonly planId: string;
  readonly sesion: string;
  readonly clase: ClaseDeSesion;
  /** «Realizada», «Realizada con desvío»… de lo que rige; `null` si el registro vigente no se puede determinar. */
  readonly condicion: string | null;
  /** La persona la registró como realizada con desvío, o como no realizada. Es lo que declaró: no sale de comparar. */
  readonly conDesvioONoRealizada: boolean;
  /** Lo que la persona escribió como motivo, si escribió algo. */
  readonly motivo: string | null;
  /** «Por serie» o «Resumen»; `null` si no se usó ninguna. */
  readonly comoSeRegistro: string | null;
  /** Lo que la persona escribió de la sesión entera, si la registró con un resumen. */
  readonly resumenDeLaSesion: string | null;
  /** De dónde sale lo que rige: el registro original, una corrección (con quién, cuándo y por qué) o no se puede saber. */
  readonly fuente: FuenteDelRegistro;
  /** Los objetivos de cada serie, en la versión del plan de ese día, se pudieron leer. */
  readonly seLeyoLoIndicado: boolean;
  /** `null` si la sesión no se cuenta serie por serie. */
  readonly registradas: number | null;
  readonly planificadas: number | null;
  readonly sinRegistrar: number;
  /** `null` si no se pudo leer lo indicado: no se sabe. */
  readonly conDiferencias: number | null;
  /** La columna «Series»: «7 de 10 registradas», o por qué no se cuentan. */
  readonly series: string;
  /** La columna «Frente a lo indicado»: «3 series sin registrar · 1 serie con diferencias», «Dentro de lo indicado»… */
  readonly frente: string;
  readonly ejercicios: readonly EjercicioDeSesion[];
}

const mayuscula = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
const todasLasSeries = (ejercicios: readonly EjercicioDeSesion[]): SerieDeSesion[] => ejercicios.flatMap((e) => e.series);

/** Una sesión registrada, con lo que dice su fila y su detalle. `objetivos`: los de su versión del plan, o `null` si no se pudieron leer. */
export function filaDeLaSesion(x: EjecucionDeEntrenamiento, objetivos: ObjetivosDeLaVersion | null, versiones = identidadDeVersiones([x])): FilaDeSesion {
  const comparaciones = compararEjecucion(x, versiones, objetivos ?? undefined);
  const fuente: FuenteDelRegistro = comparaciones[0]?.fuente ?? (x.effectiveView.kind === 'NOT_RESOLVABLE' ? { tipo: 'no-resoluble' } : { tipo: 'original', registradoEl: x.recordedAt });
  const rige = fuente.tipo === 'no-resoluble' ? null : registroVigente(x);
  const clase: ClaseDeSesion = !rige ? 'SIN_REGISTRO_VIGENTE' : rige.sessionCondition === 'NOT_COMPLETED' ? 'NO_REALIZADA' : rige.granularity === 'SET' ? 'POR_SERIE' : 'RESUMIDA';
  const seLeyoLoIndicado = objetivos !== null;
  const base = {
    id: x.executionId,
    fecha: x.date,
    ocurrio: x.occurredAt,
    registradoEl: x.recordedAt,
    planId: x.planId,
    sesion: x.plannedSession.label,
    clase,
    condicion: rige ? etiquetaDeCondicionRegistrada(rige) : null,
    conDesvioONoRealizada: rige !== null && rige.sessionCondition !== 'COMPLETED',
    motivo: rige?.reason ?? null,
    comoSeRegistro: rige?.granularity ? ETIQUETA_DE_GRANULARIDAD[rige.granularity] : null,
    resumenDeLaSesion: rige?.sessionSummary?.description ?? null,
    fuente,
    seLeyoLoIndicado,
  };
  const sinContar = { registradas: null, planificadas: null, sinRegistrar: 0, conDiferencias: seLeyoLoIndicado ? 0 : null };
  if (clase === 'SIN_REGISTRO_VIGENTE') return { ...base, ...sinContar, series: 'El registro vigente no se puede determinar', frente: 'No se compara', ejercicios: [] };
  if (clase === 'NO_REALIZADA') return { ...base, ...sinContar, series: 'Sin series: la sesión se registró así', frente: 'No hay series que comparar', ejercicios: [] };
  const ejercicios = comparaciones.map((c) => ejercicioDeSesion(c, seLeyoLoIndicado));
  if (clase === 'RESUMIDA') return { ...base, ...sinContar, series: 'Registro resumido: sin series', frente: 'No se compara serie por serie', ejercicios };

  const series = todasLasSeries(ejercicios);
  const planificadas = ejercicios.reduce((n, e) => n + e.planificadas, 0);
  const registradas = ejercicios.reduce((n, e) => n + e.registradas, 0);
  const deMas = series.filter((s) => s.estado === 'ADICIONAL').length;
  const sinRegistrar = series.filter((s) => s.estado === 'SIN_REGISTRAR').length;
  const conDiferencias = series.filter((s) => s.conDiferencia).length;
  const conDatoSinRegistrar = series.filter((s) => s.conDatoSinRegistrar).length;
  const sinComparar = ejercicios.filter((e) => e.enLugarDe !== null && e.series.some((s) => s.estado === 'REGISTRADA')).length;
  const partes: string[] = [];
  if (sinRegistrar > 0) partes.push(`${cantidadDeSeries(sinRegistrar)} sin registrar`);
  if (!seLeyoLoIndicado) partes.push('no se pudo leer lo indicado');
  else {
    if (conDiferencias > 0) partes.push(`${cantidadDeSeries(conDiferencias)} con diferencias`);
    if (conDatoSinRegistrar > 0) partes.push(`${cantidadDeSeries(conDatoSinRegistrar)} con un dato sin registrar`);
  }
  if (sinComparar > 0) partes.push(sinComparar === 1 ? 'un ejercicio no se compara' : `${numero(sinComparar)} ejercicios no se comparan`);
  const frente = partes.length > 0 ? mayuscula(partes.join(' · ')) : series.some((s) => s.comparada) ? 'Dentro de lo indicado' : 'Sin objetivos que comparar';
  return {
    ...base,
    registradas,
    planificadas,
    sinRegistrar,
    conDiferencias: seLeyoLoIndicado ? conDiferencias : null,
    series: `${numero(registradas)} de ${numero(planificadas)} ${planificadas === 1 ? 'registrada' : 'registradas'}${adicionales(deMas)}`,
    frente,
    ejercicios,
  };
}

/**
 * Las sesiones registradas del período, de la más nueva a la más vieja. `objetivosPorVersion`: los objetivos por serie
 * de cada versión del plan que aparece en el período; una versión que falta, o con `null`, no se pudo leer.
 */
export function componerLasSesiones(ejecuciones: readonly EjecucionDeEntrenamiento[], objetivosPorVersion: ReadonlyMap<string, ObjetivosDeLaVersion | null>): FilaDeSesion[] {
  const versiones = identidadDeVersiones(ejecuciones);
  return ejecuciones
    .map((x) => filaDeLaSesion(x, objetivosPorVersion.get(x.planId) ?? null, versiones))
    .sort((a, b) => b.ocurrio.localeCompare(a.ocurrio) || b.registradoEl.localeCompare(a.registradoEl) || b.id.localeCompare(a.id));
}

// ─── Las vistas con nombre ──────────────────────────────────────────────────────────────────────────────────

export type ClaveDeVistaDeSesiones = 'TODAS' | 'CON_DIFERENCIAS' | 'CON_DESVIO_O_NO_REALIZADA' | 'SIN_REGISTRAR';

export interface VistaDeSesiones {
  readonly clave: ClaveDeVistaDeSesiones;
  readonly nombre: string;
  readonly icono: NombreDeIcono | null;
  /** Qué sesiones trae, para la ayuda de la vista. */
  readonly queTrae: string;
  /** Depende de los objetivos de cada serie: si alguna versión del plan no se pudo leer, no se puede contar. */
  readonly deLoIndicado: boolean;
}

export const VISTAS_DE_SESIONES: readonly VistaDeSesiones[] = [
  { clave: 'TODAS', nombre: 'Todas las sesiones', icono: null, queTrae: 'Cada sesión registrada del período, de la más nueva a la más vieja.', deLoIndicado: false },
  {
    clave: 'CON_DIFERENCIAS',
    nombre: 'Con diferencias',
    icono: 'distinto',
    queTrae:
      'Las sesiones con alguna serie registrada cuyas repeticiones o cuyo RIR quedaron por encima o por debajo de lo indicado. La carga no cuenta: la sugerida es un complemento, no una obligación. Un dato sin registrar tampoco: se dice aparte.',
    deLoIndicado: true,
  },
  {
    clave: 'CON_DESVIO_O_NO_REALIZADA',
    // Las palabras de la condición son las del dominio: «Realizada con desvío» y «No realizada».
    nombre: `Con desvío o ${etiquetaDeCondicionRegistrada({ sessionCondition: 'NOT_COMPLETED' }).toLowerCase()}`,
    icono: 'desvio',
    queTrae: 'Las sesiones que la persona registró como realizadas con desvío o como no realizadas. Es lo que declaró: no sale de comparar las series.',
    deLoIndicado: false,
  },
  {
    clave: 'SIN_REGISTRAR',
    nombre: 'Con series sin registrar',
    icono: null,
    queTrae: 'Las sesiones registradas serie por serie en las que alguna serie indicada quedó sin registrar. Sin registrar no quiere decir que no se haya hecho: no hay dato.',
    deLoIndicado: false,
  },
];

/** Si una sesión entra en una vista. Una sesión puede estar en más de una. */
export function sesionEnLaVista(f: FilaDeSesion, vista: ClaveDeVistaDeSesiones): boolean {
  switch (vista) {
    case 'TODAS':
      return true;
    case 'CON_DIFERENCIAS':
      return (f.conDiferencias ?? 0) > 0;
    case 'CON_DESVIO_O_NO_REALIZADA':
      return f.conDesvioONoRealizada;
    case 'SIN_REGISTRAR':
      return f.sinRegistrar > 0;
  }
}

/**
 * Cuántas sesiones trae cada vista. «Con diferencias» no tiene número (`null`) si a alguna sesión registrada serie por
 * serie no se le pudo leer lo indicado: un número sería decir que las demás no tienen diferencias.
 */
export function contarLasVistasDeSesiones(filas: readonly FilaDeSesion[]): Readonly<Record<ClaveDeVistaDeSesiones, number | null>> {
  const sinLeer = filas.some((f) => f.clase === 'POR_SERIE' && !f.seLeyoLoIndicado);
  const cuenta = (v: VistaDeSesiones): number | null => (v.deLoIndicado && sinLeer ? null : filas.filter((f) => sesionEnLaVista(f, v.clave)).length);
  return Object.fromEntries(VISTAS_DE_SESIONES.map((v) => [v.clave, cuenta(v)])) as Record<ClaveDeVistaDeSesiones, number | null>;
}
