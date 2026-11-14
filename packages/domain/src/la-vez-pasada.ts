/**
 * «La vez pasada» (WP-GRAFICOS GR-01, DL-174; es la misma pieza que PG-11 de WP-PULIDO-GRANDES, DL-173): lo que la persona
 * registró las últimas veces que hizo un ejercicio, serie por serie (carga con su unidad × repeticiones · RIR). Es un solo
 * diseño para las dos superficies, con lo que cada una puede ver:
 * - en el editor del profesional, las últimas tres, en el cuadro lateral del ejercicio, debajo de «Lo que indica el plan»;
 * - en la sesión en curso de la APK, la última, en una línea gris debajo del ejercicio.
 *
 * Las reglas son las de la propuesta de gráficos (`honestidad[]`), y no se negocian:
 * - **Solo lo registrado,** del registro vigente de cada sesión (la corrección que rige o el original): nunca un borrador
 *   ni lo planificado. Lo que indica el plan va aparte, arriba, y nunca se mezcla con esto.
 * - **Lo precargado del plan no se ve igual que lo escrito** (DL-161; ED-70): una serie tildada sin escribir es «carga
 *   rápida» (en la APK, «como el plan»); en una serie escrita, el valor que vino del plan se nombra («con la carga del
 *   plan»). Cada superficie lo marca: hueco o en gris, y con su texto.
 * - **Lo cargado otro día se marca** (`registradoTarde`, el mismo criterio que la línea de tiempo).
 * - **Comparable es el mismo ejercicio** (`esDelMismoEjercicio`): la misma versión u otra del mismo ejercicio del
 *   catálogo, o este ejercicio hecho en lugar de otro del plan. Si la persona hizo otro ejercicio en su lugar, la vez lo
 *   dice («se hizo con Press con mancuernas») y no se toma como el mismo: no se copia ni se une con una línea. Es la
 *   función que reusa «Tu ejercicio en el tiempo» (PG-18). La identidad es la de `comparacion-de-entrenamiento.ts`.
 * - **Lo que no hubo no se inventa:** una sesión registrada como no realizada, o sin este ejercicio, no es una vez; una
 *   registrada resumida no tiene series y lo dice; una serie que falta queda sin dato, nunca en cero.
 * - **Sin flechas ni juicios:** no compara una vez con otra, no sugiere una carga y no califica ninguna.
 *
 * Es lógica pura, sin React: la usan el website y la APK.
 */
import { esElMismoEjercicio, observacionesDelEjercicio, type ObservacionDeEvolucion } from './comparacion-de-entrenamiento';
import { CAMPOS_CON_ORIGEN, type CampoConOrigen, type EjecucionDeEntrenamiento } from './contratos-entrenamiento';
import { cantidad, numero } from './formato-numeros';
import { registradoTarde } from './linea-de-tiempo';

/** Cuántas veces muestra el editor del profesional (GR-01, fase 1). La APK muestra una sola (PG-11). */
export const VECES_EN_EL_EDITOR = 3;

/** Una serie registrada, tal como quedó: sin completar nada. */
export interface SerieDeLaVezPasada {
  /** El número real de la serie (`setIndex`): no se renumera. */
  readonly numero: number;
  readonly carga: { readonly value: number; readonly unit: 'kg' | 'lb' } | null;
  readonly repeticiones: number | null;
  /** `null` es «sin informar»; RIR 0 es una respuesta. */
  readonly rir: number | null;
  /** DL-161: se tildó sin escribir, con los valores del plan a la vista («carga rápida»; en la APK, «como el plan»). */
  readonly cargaRapida: boolean;
  /**
   * ED-70: en una serie escrita, los valores que vinieron del plan al tildarla (por ejemplo, la carga, si la persona
   * escribió solo las repeticiones). Vacío si todo lo escribió ella, o si la serie es de antes de la procedencia.
   */
  readonly delPlan: readonly CampoConOrigen[];
}

/** Cómo quedó registrado el ejercicio esa vez. */
export type ComoSeHizo =
  /** Serie por serie. `enLugarDe`: se hizo este ejercicio en lugar de otro del plan (su nombre). */
  | { readonly tipo: 'series'; readonly series: readonly SerieDeLaVezPasada[]; readonly enLugarDe: string | null }
  /**
   * Estaba en el plan, pero se registró otro ejercicio en su lugar (`otro-ejercicio`), o una versión que no se puede
   * identificar (`desconocida`). Lo registrado no es de este ejercicio.
   */
  | { readonly tipo: 'con-otro'; readonly nombre: string; readonly identidad: 'otro-ejercicio' | 'desconocida' }
  /** Se registró resumido («por ejercicio o sesión»): no tiene series, y no se sintetizan. */
  | { readonly tipo: 'resumida' };

export interface VezPasada {
  readonly executionId: string;
  /** La fecha civil de la sesión. */
  readonly fecha: string;
  /** El nombre de la sesión del plan: «Piernas A». */
  readonly sesion: string;
  /** Se registró en un día posterior al de la sesión (carga tardía). */
  readonly cargadaOtroDia: boolean;
  /** Rige una corrección del registro, no el original. */
  readonly corregida: boolean;
  readonly como: ComoSeHizo;
  /**
   * Lo registrado es de este mismo ejercicio, serie por serie: es lo único que se puede copiar a una fila o unir con una
   * línea. Una vez hecha con otro ejercicio, o resumida, no lo es.
   */
  readonly comparable: boolean;
}

/**
 * Si lo registrado en una observación es de este mismo ejercicio: se prescribió y se registró el mismo (la misma
 * versión u otra del mismo ejercicio del catálogo), o se registró este en lugar de otro. Una sustitución por otro
 * ejercicio, o por una versión que no se puede identificar, no lo es. Es pura: la reusan «La vez pasada» y PG-18.
 */
export function esDelMismoEjercicio(o: Pick<ObservacionDeEvolucion, 'rol' | 'comparacion'>): boolean {
  if (o.rol === 'por-sustitucion') return true;
  return o.rol === 'planificado-y-registrado' && esElMismoEjercicio(o.comparacion.identidad);
}

/** La vez de una observación, o `null` si no es una vez de este ejercicio (no realizada, sin registro o ilegible). */
function vezDe(o: ObservacionDeEvolucion, x: EjecucionDeEntrenamiento | undefined): VezPasada | null {
  const c = o.comparacion;
  // Una sesión registrada como no realizada, o cuyo registro vigente no se puede resolver, no es una vez del ejercicio.
  if (c.condicion === null || c.condicion === 'NOT_COMPLETED') return null;
  // El registro vigente no incluye este ejercicio: esa sesión no lo tiene.
  if (!c.realizado) return null;
  const base = {
    executionId: c.executionId,
    fecha: c.fecha,
    sesion: c.sesion,
    cargadaOtroDia: x ? registradoTarde(x.date, x.recordedAt, x.timeZone) : false,
    corregida: c.fuente.tipo === 'correccion',
  };
  if (o.rol === 'sustituido') return { ...base, como: { tipo: 'con-otro', nombre: c.realizado.nombre, identidad: 'otro-ejercicio' }, comparable: false };
  if (o.rol === 'registrado-sin-identidad') return { ...base, como: { tipo: 'con-otro', nombre: c.realizado.nombre, identidad: 'desconocida' }, comparable: false };
  if (!esDelMismoEjercicio(o)) return null;
  const series = c.filas.flatMap((f): SerieDeLaVezPasada[] => {
    if (f.registrada.tipo !== 'registrada') return [];
    const s = f.registrada.serie;
    const rapida = s.recordedAs === 'AS_PLANNED';
    return [
      {
        numero: f.numero,
        carga: s.load ? { value: s.load.value, unit: s.load.unit } : null,
        repeticiones: s.completedRepetitions,
        rir: s.rir,
        cargaRapida: rapida,
        // En una tildada sin escribir todo es del plan: lo dice `cargaRapida`, no la lista.
        delPlan: rapida ? [] : CAMPOS_CON_ORIGEN.filter((campo) => s.fieldOrigins?.[campo] === 'PLAN' && s[campo] !== null),
      },
    ];
  });
  if (series.length > 0) return { ...base, como: { tipo: 'series', series, enLugarDe: o.rol === 'por-sustitucion' ? c.prescripto.nombre : null }, comparable: true };
  // Sin series: resumida (lo dice), o un registro del ejercicio sin ninguna serie, que no es una vez para mostrar.
  return c.resumen !== null ? { ...base, como: { tipo: 'resumida' }, comparable: false } : null;
}

/**
 * Las últimas veces que la persona hizo un ejercicio del catálogo, de la más reciente a la más vieja, con lo que quedó
 * registrado. `ejecuciones` son las sesiones registradas que se leyeron (API-TRN-21 para el profesional, API-TRN-19-LISTA
 * para la persona); la identidad de cada versión sale de todas ellas.
 * - `cuantas`: cuántas veces, como mucho (por omisión, las del editor).
 * - `hasta`: la última fecha civil que cuenta (la de la sesión que se está registrando): una posterior no es «pasada».
 */
export function vecesPasadas(ejecuciones: readonly EjecucionDeEntrenamiento[], exerciseId: string, o: { readonly cuantas?: number; readonly hasta?: string | null } = {}): VezPasada[] {
  const cuantas = o.cuantas ?? VECES_EN_EL_EDITOR;
  const porId = new Map(ejecuciones.map((x) => [x.executionId, x] as const));
  const observaciones = observacionesDelEjercicio(ejecuciones, `e:${exerciseId.toLowerCase()}`);
  const veces: VezPasada[] = [];
  // Las observaciones vienen en el orden en que ocurrieron: se recorren desde la última.
  for (let i = observaciones.length - 1; i >= 0 && veces.length < cuantas; i -= 1) {
    const obs = observaciones[i]!;
    if (o.hasta && obs.comparacion.fecha > o.hasta) continue;
    const vez = vezDe(obs, porId.get(obs.comparacion.executionId));
    if (vez) veces.push(vez);
  }
  return veces;
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const;
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;
/** Los meses cortos del website («sept»), para que una fecha se lea igual en todas sus pantallas. */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'] as const;
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'] as const;

const partesDeLaFecha = (f: string) => {
  const d = new Date(`${f}T12:00:00Z`);
  return { semana: d.getUTCDay(), dia: d.getUTCDate(), mes: d.getUTCMonth(), anio: d.getUTCFullYear() };
};

/**
 * Una fecha civil en pocas palabras: «hoy», o «jue 6 nov» (con el año si no es el de `hoy`: «jue 6 nov 2025»). Con
 * `paraLeer`, entera, para el lector de pantalla: «jueves 6 de noviembre».
 */
export function fechaEnPocasPalabras(f: string, hoy: string, paraLeer = false): string {
  if (f === hoy) return 'hoy';
  const { semana, dia, mes, anio } = partesDeLaFecha(f);
  const otroAnio = f.slice(0, 4) !== hoy.slice(0, 4);
  if (paraLeer) return `${DIAS_LARGOS[semana]} ${dia} de ${MESES_LARGOS[mes]}${otroAnio ? ` de ${anio}` : ''}`;
  return `${DIAS[semana]} ${dia} ${MESES[mes]}${otroAnio ? ` ${anio}` : ''}`;
}

/** «a», «a y b», «a, b y c». */
function enUnaFrase(partes: readonly string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

const NOMBRE_DEL_VALOR: Readonly<Record<CampoConOrigen, string>> = { load: 'la carga', completedRepetitions: 'las repeticiones', rir: 'el RIR' };

/**
 * La serie como se escribe en GR-01: «20 kg × 8 · RIR 2». Sin carga, «8 rep. · RIR 2»; sin repeticiones, «20 kg». El RIR
 * va solo si se informó. Nada se completa: lo que no se registró no aparece.
 */
export function textoDeLaSerie(s: Pick<SerieDeLaVezPasada, 'carga' | 'repeticiones' | 'rir'>): string {
  const carga = s.carga ? cantidad(s.carga.value, s.carga.unit) : null;
  const repeticiones = s.repeticiones === null ? null : numero(s.repeticiones);
  const base = carga && repeticiones ? `${carga} × ${repeticiones}` : (carga ?? (repeticiones ? `${repeticiones} rep.` : 'sin dato'));
  return s.rir === null ? base : `${base} · RIR ${numero(s.rir)}`;
}

/**
 * Lo que vino del plan en una serie, dicho como lo dice cada superficie: `carga rápida` en el website y `como el plan` en
 * la APK para la tildada sin escribir; «con la carga del plan» si solo algunos valores vinieron del plan. `null`: todo lo
 * escribió la persona (o no se sabe, en una serie de antes de la procedencia).
 */
export function marcaDelPlan(s: Pick<SerieDeLaVezPasada, 'cargaRapida' | 'delPlan'>, tildadaSinEscribir: string): string | null {
  if (s.cargaRapida) return tildadaSinEscribir;
  if (s.delPlan.length === 0) return null;
  return `con ${enUnaFrase(s.delPlan.map((c) => NOMBRE_DEL_VALOR[c]))} del plan`;
}

/** Quién lee: la persona, en la APK («la hiciste»), o el profesional, en el website («se hizo»). */
export type VozDeLaVezPasada = 'persona' | 'profesional';

export const COPY_LA_VEZ_PASADA = {
  titulo: 'La vez pasada',
  /** El encabezado de la línea: «La vez pasada, jue 6 nov». */
  encabezado: (fecha: string) => `La vez pasada, ${fecha}`,
  /** La marca de una serie tildada sin escribir, en el website (DL-161) y en la APK (lo que la persona ya ve en su tabla). */
  cargaRapida: 'carga rápida',
  comoElPlan: 'como el plan',
  conOtro: (voz: VozDeLaVezPasada, nombre: string) => (voz === 'persona' ? `la hiciste con ${nombre}` : `se hizo con ${nombre}`),
  conOtroSinIdentidad: (voz: VozDeLaVezPasada, nombre: string) =>
    voz === 'persona' ? `la registraste con ${nombre}, que no se puede identificar como este ejercicio` : `se registró con ${nombre}, que no se puede identificar como este ejercicio`,
  resumida: (voz: VozDeLaVezPasada) => (voz === 'persona' ? 'la registraste resumida, sin series' : 'se registró resumida, sin series'),
  enLugarDe: (nombre: string) => `en lugar de ${nombre}`,
  cargadaOtroDia: 'cargada otro día',
  corregida: 'corregida',
} as const;

/** La serie con su marca, si vino del plan: «22 kg × 6 · RIR 1 (carga rápida)». */
export const serieConSuMarca = (s: SerieDeLaVezPasada, tildadaSinEscribir: string): string => {
  const marca = marcaDelPlan(s, tildadaSinEscribir);
  return marca ? `${textoDeLaSerie(s)} (${marca})` : textoDeLaSerie(s);
};

/**
 * Lo que se hizo esa vez, en una frase, sin la fecha: «20 kg × 8 · RIR 2, 22 kg × 6 · RIR 1 (carga rápida)», «se hizo
 * con Press con mancuernas» o «se registró resumida, sin series». Las series van en su orden; si falta alguna, cada una
 * lleva su número («serie 1: …, serie 3: …»), para no correr una serie a la posición de otra.
 */
export function loQueSeHizo(v: VezPasada, voz: VozDeLaVezPasada): string {
  const c = COPY_LA_VEZ_PASADA;
  if (v.como.tipo === 'con-otro') return v.como.identidad === 'otro-ejercicio' ? c.conOtro(voz, v.como.nombre) : c.conOtroSinIdentidad(voz, v.como.nombre);
  if (v.como.tipo === 'resumida') return c.resumida(voz);
  const marca = voz === 'persona' ? c.comoElPlan : c.cargaRapida;
  const seguidas = v.como.series.every((s, i) => s.numero === i + 1);
  const series = v.como.series.map((s) => (seguidas ? serieConSuMarca(s, marca) : `serie ${numero(s.numero)}: ${serieConSuMarca(s, marca)}`)).join(', ');
  return v.como.enLugarDe ? `${series} (${c.enLugarDe(v.como.enLugarDe)})` : series;
}

/**
 * La línea de «La vez pasada» (PG-11), la misma en las dos superficies: «La vez pasada, jue 6 nov: 20 kg × 8 · RIR 2,
 * 20 kg × 8 · RIR 2, 22 kg × 6 · RIR 1». Con `paraLeer`, la fecha entera, para el lector de pantalla.
 */
export function lineaDeLaVezPasada(v: VezPasada, hoy: string, voz: VozDeLaVezPasada, paraLeer = false): string {
  return `${COPY_LA_VEZ_PASADA.encabezado(fechaEnPocasPalabras(v.fecha, hoy, paraLeer))}: ${loQueSeHizo(v, voz)}`;
}
