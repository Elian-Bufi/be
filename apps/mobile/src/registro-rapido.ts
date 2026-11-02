/**
 * El registro rápido de una sesión del plan (PA-03; Dirección, 2026-11-02; DL-160 y DL-161): la persona cuenta lo que
 * hizo sin hacerlo en vivo, desde un toque hasta el detalle que quiera, en un recorrido de dos a cinco pasos cortos.
 *
 * - **Los pasos** (`pasosDelRecorrido`): «¿Cómo fue?», «¿Qué ejercicios hiciste?», las series de los ejercicios con
 *   «Cambié algo», la nota y el horario, y «Listo». Se saltan los que no hacen falta.
 * - **«Hice todo lo planificado» va directo al último cuadro** (Dirección, 2026-11-02): «Listo para registrar», con la
 *   línea planificada de cada ejercicio a la vista («Sentadilla goblet · 3 × 8 · 20 kg») y un «Cambiar» por ejercicio
 *   que abre sus series, para destildar las que no hizo o escribir una distinta, y vuelve al final. Hoy son dos cuadros
 *   y «Listo»; la nota y el horario quedan a un toque. Así el valor se ve antes de confirmar (B10-06 §56).
 * - **Por serie** (`granularity: 'SET'`). Un ejercicio tildado sin cambios manda sus series con los valores del plan y
 *   `recordedAs: 'AS_PLANNED'`: la persona los tuvo a la vista y los confirmó (B10-06 §56). Lo escrito va `TYPED` y, en
 *   lo que quedó vacío, con lo planificado que se veía en gris: la misma regla que la casilla de la sesión
 *   (`serieAlTildar`). Una serie sin tildar no se manda: no la hizo. Un ejercicio sin series en el plan tampoco: no hay
 *   qué registrar por serie, y el último cuadro lo dice.
 * - **Nunca se fabrica una serie** (SET_WITHOUT_DATA): si el plan de una serie no trae ni carga ni un número de
 *   repeticiones (por ejemplo, «10–12 rep.»), tildarla sin escribir no alcanza, y el recorrido pide anotarlo.
 * - **Un ejercicio sin tildar no se manda**: queda como no hecho. Con «Hice algo distinto» y nada tildado, la sesión se
 *   registra resumida (`EXERCISE_OR_SESSION`), con la frase elegida y la nota como resumen: el dominio exige un texto.
 * - **La condición** es «Realizada» solo con «Hice todo lo planificado» y todo tildado; si no, «Realizada con desvío».
 *   Escribir un valor no cambia la condición: un plan en rango obliga a escribir las repeticiones.
 * - **La hora**: hoy es opcional (sin elegirla, la API usa la del registro); otro día es obligatoria (OCCURRED_AT_REQUIRED).
 *   Se elige tocando, en horas en punto, nunca escribiendo. El huso es UTC−3 fijo, como en el resto de la APK.
 *
 * Es lógica pura, sin React: la prueba es `scripts/registro-rapido.test.mjs`.
 */
import {
  COPY_ENTRENAMIENTO_POR_SERIE,
  etiquetaDeCondicionRegistrada,
  nivelDeDetalleDelRegistro,
  numero,
  textoDeCarga,
  textoDelNivelDeDetalle,
  textoDeRir,
  type BorradorDeEjecucion,
  type NivelDeDetalle,
  type EditarBorradorDeEjecucionRequest,
  type Ocurrencia,
  type PrescripcionConObjetivos,
  type SerieConObjetivo,
  type SerieEjecutadaApi,
  type SesionConObjetivos,
} from '@be/domain';
import { fechaCorta } from './formato';
import { FILA_VACIA, serieAlTildar, unidadDelEjercicio, type ErroresDeFila, type FilaEscrita } from './series-de-la-sesion';

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

/** Lo que la persona toca en el primer paso. Es también el resumen de una sesión registrada sin series. */
export type Eleccion = 'todo' | 'parte' | 'distinto';

export const ELECCIONES: readonly { readonly valor: Eleccion; readonly texto: string }[] = [
  { valor: 'todo', texto: 'Hice todo lo planificado' },
  { valor: 'parte', texto: 'Hice una parte' },
  { valor: 'distinto', texto: 'Hice algo distinto' },
];

const fraseDe = (e: Eleccion): string => ELECCIONES.find((x) => x.valor === e)?.texto ?? '';

/** Los textos del recorrido. Viven acá para que los revise la guardia T13 (`scripts/copy-pantallas.test.cjs`). */
export const TEXTOS_DEL_REGISTRO_RAPIDO = {
  yaLaHice: 'Ya la hice',
  laHiceEseDia: 'La hice ese día',
  como: (etiqueta: string) => `¿Cómo fue ${etiqueta}?`,
  queEjercicios: '¿Qué ejercicios hiciste?',
  ayudaDeEjerciciosTodo: 'Llegan tildados. Destildá lo que no hiciste.',
  ayudaDeEjerciciosParte: 'Tildá los que hiciste.',
  ayudaDeEjerciciosDistinto: 'Tildá los que hiciste, si hiciste alguno. Si no, lo contás en el paso siguiente.',
  cambieAlgo: 'Cambié algo',
  cambieAlgoDetalle: 'lo anotás en el paso siguiente',
  anotarEnElPasoSiguiente: 'El plan no trae un número para cada serie: anotá lo que hiciste en el paso siguiente.',
  queCambio: '¿Qué cambió?',
  ayudaDelDetalle: 'Destildá las series que no hiciste.',
  comoSeRegistra: 'Cómo se registra',
  explicacionDelDetalle:
    'Una serie tildada sin escribir queda con lo planificado. Si escribís algo, se registra lo que escribiste y, en lo que quedó vacío, lo planificado. Una serie sin tildar no se registra.',
  serie: (n: number) => `Serie ${n}`,
  carga: (unidad: string) => `Carga (${unidad})`,
  repeticiones: 'Repeticiones',
  rir: 'RIR',
  algoMas: '¿Algo más?',
  nota: 'Nota para tu profesional (opcional)',
  ayudaDeLaNota: 'Por ejemplo, qué cambiaste o cómo te sentiste.',
  cuando: '¿Cuándo la hiciste?',
  hoy: 'Hoy',
  ayer: 'Ayer',
  aQueHora: '¿A qué hora?',
  aQueHoraOpcional: '¿A qué hora? (opcional)',
  recien: 'Recién',
  sinHoraHoy: 'Si no elegís la hora, queda la de ahora.',
  agregarNota: 'Agregar una nota o el horario',
  seguir: 'Seguir',
  pasoAnterior: 'Volver al paso anterior',
  registrar: 'Registrar sesión',
  registrando: 'Registrando…',
  verElRegistro: 'Ver el registro',
  volver: 'Volver',
  loVeTuProfesional: 'Tu profesional ve qué series tildaste con lo planificado y cuáles escribiste.',
  /** Con el mismo rótulo que lee el profesional (DL-161, `textoDelNivelDeDetalle`). */
  comoLaVeTuProfesional: (nivel: string) => `Tu profesional ve cómo la cargaste: «${nivel}».`,
  // El último cuadro de «Hice todo lo planificado» y el cambio de un ejercicio, desde ahí.
  listoParaRegistrar: 'Listo para registrar',
  ayudaDelFinal: 'Así queda, con lo planificado. Si algo fue distinto, tocá «Cambiar».',
  cambiar: 'Cambiar',
  anotar: 'Anotar',
  cambiarEjercicio: (ejercicio: string) => `Cambiar ${ejercicio}`,
  anotarEjercicio: (ejercicio: string) => `Anotar lo que hiciste en ${ejercicio}`,
  comoElPlan: 'Como el plan',
  sinRegistrar: 'Sin registrar',
  faltaAnotar: 'El plan no trae un número: anotá lo que hiciste.',
  seriesDe: (hechas: number, total: number) => `${hechas} de ${total} series`,
  cambiadas: (n: number) => `${n} ${n === 1 ? 'cambiada' : 'cambiadas'}`,
  queCambioEn: (ejercicio: string) => `¿Qué cambió en ${ejercicio}?`,
  ayudaDelCambio: 'Destildá las series que no hiciste. Si una fue distinta, tocá «Cambiar la serie» y escribí solo lo que cambió: lo que dejes vacío queda con lo planificado, que ves en gris.',
  /** Un ejercicio que el plan trae sin series (el website lo permite): no hay qué registrar por serie. */
  sinSeriesEnElPlan: 'Sin series en el plan',
  contaloEnLaNota: 'Si lo hiciste, contalo en la nota.',
  cambiarLaSerie: (n: number) => `Cambiar la serie ${n}`,
  volverAlFinal: 'Volver al final',
  dejarComoElPlan: 'Dejarlo como el plan',
  notaDelFinal: 'Nota',
  faltaUnaSerie: 'No queda ninguna serie para registrar. Sumá alguna con «Cambiar», o volvé al primer paso y elegí otra respuesta.',
  faltaElegir: 'Elegí cómo fue la sesión.',
  faltaTildar: 'Tildá al menos un ejercicio que hiciste.',
  faltaLaHora: 'Para una sesión de otro día, elegí a qué hora la hiciste.',
  faltaUnDato: (ejercicio: string, n: number) => `${ejercicio}, serie ${n}: anotá la carga o las repeticiones que hiciste.`,
  revisaUnValor: (ejercicio: string, n: number) => `${ejercicio}, serie ${n}: revisá lo que escribiste.`,
  sinPlanDeLaSerie: 'No pudimos leer el plan de cada serie. Sin él no se puede registrar con lo planificado: probá de nuevo.',
  yaEstabaRegistrada: 'Esta sesión ya estaba registrada.',
  conDatosCargados: 'Esa sesión ya tiene series o un resumen cargados. Para no pisarlos, continuala desde Entrenamiento.',
  enCursoEnElTelefono: 'Esa sesión ya se está registrando en este teléfono. Continuala desde Entrenamiento.',
  otroPlanEseDia: 'Ese día regía otra versión de tu plan. Registrala desde «Registrar otro día», en Entrenamiento.',
  sinSesionEseDia: 'Ese día tu plan no tenía esta sesión.',
  revisaLaHora: 'Revisá la hora: tiene que ser de ese día y no posterior a ahora.',
  irAEntrenamiento: 'Ir a Entrenamiento',
} as const;

const T = TEXTOS_DEL_REGISTRO_RAPIDO;

// ─── Lo planificado ─────────────────────────────────────────────────────────────────────────────

/** Una lista de valores por serie, en una palabra: «10» si son todos iguales, «10/8/6» si no; `null` si ninguno. */
function porSerie(valores: readonly (string | null)[]): string | null {
  if (valores.every((v) => v === null)) return null;
  const distintos = new Set(valores);
  return distintos.size === 1 ? valores[0]! : valores.map((v) => v ?? '–').join('/');
}

const repeticionesDe = (s: SerieConObjetivo): string | null => {
  const r = s.target.repetitions;
  if (!r) return null;
  return 'value' in r ? numero(r.value, 0) : `${numero(r.min, 0)}–${numero(r.max, 0)}`;
};

/**
 * Lo planificado de un ejercicio en una línea: «3 × 10 · RIR 2 · 16 kg». La carga va solo si el plan la trae, y con su
 * unidad. Una pirámide no se resume como si fuera pareja: «3 × 10/8/6».
 */
export function lineaDelPlan(p: Pick<PrescripcionConObjetivos, 'sets'>): string {
  const n = p.sets.length;
  if (n === 0) return T.sinSeriesEnElPlan;
  const reps = porSerie(p.sets.map(repeticionesDe));
  const rir = porSerie(p.sets.map((s) => (s.target.rir === null ? null : numero(s.target.rir))));
  const cargas = p.sets.map((s) => s.target.suggestedLoad);
  const unidades = new Set(cargas.flatMap((c) => (c ? [c.unit] : [])));
  let carga: string | null = null;
  if (unidades.size === 1) {
    const valor = porSerie(cargas.map((c) => (c ? numero(c.value) : null)));
    carga = valor === null ? null : `${valor} ${[...unidades][0]}`;
  } else if (unidades.size > 1) carga = porSerie(cargas.map((c) => textoDeCarga(c)));
  const series = reps === null ? `${numero(n, 0)} ${n === 1 ? 'serie' : 'series'}` : `${numero(n, 0)} × ${reps}`;
  return [series, rir === null ? null : `RIR ${rir}`, carga].filter((x): x is string => x !== null).join(' · ');
}

/**
 * La serie que se registra «con lo planificado» (DL-161 `AS_PLANNED`): la carga, las repeticiones y el RIR del objetivo
 * de esa serie, tal como se vieron. Un rango no es un número: con «10–12 rep.» las repeticiones quedan sin informar.
 * `null` si el plan no trae ni carga ni un número de repeticiones: esa serie no se puede tildar sin escribir.
 */
export function serieDelPlan(s: SerieConObjetivo): SerieEjecutadaApi | null {
  const t = s.target;
  const repeticiones = t.repetitions && 'value' in t.repetitions ? t.repetitions.value : null;
  const carga = t.suggestedLoad ? { value: t.suggestedLoad.value, unit: t.suggestedLoad.unit } : null;
  if (repeticiones === null && carga === null) return null;
  const rir = t.rir !== null && t.rir >= 0 && t.rir <= 20 ? t.rir : null;
  return { setIndex: s.setIndex, load: carga, completedRepetitions: repeticiones, rir, perceivedExertion: null, recordedAs: 'AS_PLANNED' };
}

/** Si el ejercicio tiene series y todas se pueden registrar con lo planificado, sin escribir nada. */
export const seRegistraConElPlan = (p: Pick<PrescripcionConObjetivos, 'sets'>): boolean => p.sets.length > 0 && p.sets.every((s) => serieDelPlan(s) !== null);

// ─── Las respuestas ─────────────────────────────────────────────────────────────────────────────

export interface SerieRapida {
  readonly hecha: boolean;
  readonly escrita: FilaEscrita;
}

export interface EjercicioRapido {
  readonly hecho: boolean;
  /** «Cambié algo»: sus series se revisan en el paso siguiente. */
  readonly cambio: boolean;
  readonly series: Readonly<Record<number, SerieRapida>>;
}

export interface Respuestas {
  readonly eleccion: Eleccion | null;
  readonly ejercicios: Readonly<Record<string, EjercicioRapido>>;
  readonly nota: string;
  /** Con «Hice todo lo planificado», la persona pidió el paso de la nota y el horario. */
  readonly pidioNota: boolean;
  /** El día elegido (`AAAA-MM-DD`). */
  readonly dia: string;
  /** La hora en punto elegida, o `null`: hoy, la de ahora; otro día, falta elegirla. */
  readonly hora: number | null;
}

/** Lo que el recorrido sabe de la sesión: el plan de cada serie (API-SER-02), su fecha y el día de la API. */
export interface Contexto {
  readonly sesion: Pick<SesionConObjetivos, 'prescriptions'>;
  /** La fecha de la ocurrencia desde la que se entró. */
  readonly fecha: string;
  /** Hoy, para la API. */
  readonly hoy: string;
}

/** Desde una pendiente o desde «Registrar otro día», el día es el de esa ocurrencia: no se cambia. */
export const diaFijo = (ctx: Pick<Contexto, 'fecha' | 'hoy'>): boolean => ctx.fecha !== ctx.hoy;

function ejerciciosIniciales(ctx: Contexto, eleccion: Eleccion | null): Record<string, EjercicioRapido> {
  return Object.fromEntries(
    ctx.sesion.prescriptions.map((p) => [
      p.prescriptionId,
      { hecho: eleccion === 'todo', cambio: false, series: Object.fromEntries(p.sets.map((s) => [s.setIndex, { hecha: true, escrita: FILA_VACIA }])) },
    ]),
  );
}

export function respuestasIniciales(ctx: Contexto): Respuestas {
  return { eleccion: null, ejercicios: ejerciciosIniciales(ctx, null), nota: '', pidioNota: false, dia: ctx.fecha, hora: null };
}

/** Elegir en el primer paso. Cambiar de elección vuelve a armar los ejercicios: con «todo» llegan tildados. */
export function elegir(ctx: Contexto, r: Respuestas, eleccion: Eleccion): Respuestas {
  if (r.eleccion === eleccion) return r;
  return { ...r, eleccion, ejercicios: ejerciciosIniciales(ctx, eleccion), pidioNota: false };
}

function cambiarEjercicio(r: Respuestas, id: string, f: (e: EjercicioRapido) => EjercicioRapido): Respuestas {
  const e = r.ejercicios[id];
  return e ? { ...r, ejercicios: { ...r.ejercicios, [id]: f(e) } } : r;
}

export const marcarEjercicio = (r: Respuestas, id: string, hecho: boolean): Respuestas => cambiarEjercicio(r, id, (e) => ({ ...e, hecho, cambio: hecho && e.cambio }));

/** «Cambié algo» tilda también el ejercicio: si cambió algo, lo hizo. */
export const marcarCambio = (r: Respuestas, id: string, cambio: boolean): Respuestas => cambiarEjercicio(r, id, (e) => ({ ...e, cambio, hecho: e.hecho || cambio }));

/**
 * Tocar una serie es un cambio del ejercicio: con eso se registra serie por serie lo que quedó (`armarRegistro`), y no
 * todo con lo planificado. Por eso marcar o escribir una serie también marca `cambio`.
 */
export function marcarSerie(r: Respuestas, id: string, setIndex: number, hecha: boolean): Respuestas {
  return cambiarEjercicio(r, id, (e) => {
    const s = e.series[setIndex];
    return s ? { ...e, hecho: e.hecho || hecha, cambio: true, series: { ...e.series, [setIndex]: { ...s, hecha } } } : e;
  });
}

export function escribir(r: Respuestas, id: string, setIndex: number, campo: keyof FilaEscrita, texto: string): Respuestas {
  return cambiarEjercicio(r, id, (e) => {
    const s = e.series[setIndex];
    // Escribir en una serie la tilda: si anotó lo que hizo, la hizo.
    return s ? { ...e, cambio: true, series: { ...e.series, [setIndex]: { hecha: true, escrita: { ...s.escrita, [campo]: texto } } } } : e;
  });
}

/** Las series de un ejercicio tal como llegan: todas tildadas y sin nada escrito. */
const seriesComoElPlan = (p: Pick<PrescripcionConObjetivos, 'sets'>): Record<number, SerieRapida> => Object.fromEntries(p.sets.map((s) => [s.setIndex, { hecha: true, escrita: FILA_VACIA }]));

/** «Dejarlo como el plan», en el cambio de un ejercicio: vuelve a tener todas sus series con lo planificado. */
export function dejarComoElPlan(ctx: Contexto, r: Respuestas, id: string): Respuestas {
  const p = ctx.sesion.prescriptions.find((x) => x.prescriptionId === id);
  return p ? cambiarEjercicio(r, id, () => ({ hecho: true, cambio: false, series: seriesComoElPlan(p) })) : r;
}

// ─── El último cuadro de «Hice todo lo planificado» ─────────────────────────────────────────────

/** Cómo queda cada ejercicio en «Listo para registrar». */
export type EstadoEnElFinal = 'como-el-plan' | 'cambiado' | 'sin-registrar' | 'falta-anotar' | 'sin-series';

export const tieneAlgoEscrito = (f: FilaEscrita): boolean => f.carga.trim() !== '' || f.repeticiones.trim() !== '' || f.rir.trim() !== '';

/**
 * Lo que dice la fila de un ejercicio en el último cuadro, debajo de su línea planificada: «Como el plan»; «2 de 3 series
 * · 1 cambiada»; «Sin registrar», si se destildaron todas; o que falta anotar, si el plan de una serie tildada no trae un
 * número y no se escribió nada (nunca se fabrica una serie). Un ejercicio sin series en el plan no se registra por
 * serie: no lleva «Cambiar», y se cuenta en la nota.
 */
export function estadoEnElFinal(p: PrescripcionConObjetivos, e: EjercicioRapido | undefined): { readonly estado: EstadoEnElFinal; readonly texto: string } {
  if (p.sets.length === 0) return { estado: 'sin-series', texto: T.contaloEnLaNota };
  if (!e?.hecho) return { estado: 'sin-registrar', texto: T.sinRegistrar };
  const series = e.cambio ? e.series : seriesComoElPlan(p);
  const hechas = p.sets.filter((s) => series[s.setIndex]?.hecha);
  if (hechas.length === 0) return { estado: 'sin-registrar', texto: T.sinRegistrar };
  if (hechas.some((s) => !tieneAlgoEscrito(series[s.setIndex]!.escrita) && serieDelPlan(s) === null)) return { estado: 'falta-anotar', texto: T.faltaAnotar };
  const escritas = hechas.filter((s) => tieneAlgoEscrito(series[s.setIndex]!.escrita)).length;
  if (hechas.length === p.sets.length && escritas === 0) return { estado: 'como-el-plan', texto: T.comoElPlan };
  const partes = [hechas.length < p.sets.length ? T.seriesDe(hechas.length, p.sets.length) : seriesEnTexto(p.sets.length), escritas > 0 ? T.cambiadas(escritas) : null];
  return { estado: 'cambiado', texto: partes.filter((x): x is string => x !== null).join(' · ') };
}

// ─── Los pasos ──────────────────────────────────────────────────────────────────────────────────

/** `revisar` es el último cuadro de «Hice todo lo planificado»: lo que se va a registrar, con «Cambiar» por ejercicio. */
export type Paso = 'como' | 'ejercicios' | 'detalle' | 'cuando' | 'revisar' | 'listo';

/** El nombre de cada paso, en la franja «Paso 2 de 4 · Ejercicios». */
export const NOMBRE_DEL_PASO: Readonly<Record<Paso, string>> = { como: 'Cómo fue', ejercicios: 'Ejercicios', detalle: 'Series', cuando: 'Nota y horario', revisar: 'Revisar', listo: 'Listo' };

/**
 * Los ejercicios cuyas series se revisan: los tildados con «Cambié algo», y los que el plan no deja tildar sin escribir.
 * Uno sin series en el plan no tiene qué revisar.
 */
export function ejerciciosConDetalle(ctx: Contexto, r: Respuestas): PrescripcionConObjetivos[] {
  return ctx.sesion.prescriptions.filter((p) => {
    const e = r.ejercicios[p.prescriptionId];
    return p.sets.length > 0 && e?.hecho === true && (e.cambio || !seRegistraConElPlan(p));
  });
}

/**
 * Los pasos de este recorrido, en orden, con «Listo» al final. Antes de elegir se cuenta el camino más corto: la franja
 * crece cuando hace falta un paso más, nunca anuncia uno que después se saltea.
 */
export function pasosDelRecorrido(ctx: Contexto, r: Respuestas): Paso[] {
  // «Hice todo lo planificado»: del primer cuadro al último. Los cambios de un ejercicio se abren desde ahí y vuelven ahí,
  // sin sumar un paso; la nota y el horario, si se piden (u otro día, donde la hora es obligatoria), van antes del final.
  if (r.eleccion === 'todo') return ['como', ...(r.pidioNota || diaFijo(ctx) ? (['cuando'] as const) : []), 'revisar', 'listo'];
  const pasos: Paso[] = ['como', 'ejercicios'];
  if (ejerciciosConDetalle(ctx, r).length > 0) pasos.push('detalle');
  // Con «una parte» o «algo distinto», la nota y el horario son un paso.
  if (r.eleccion !== null || r.pidioNota || diaFijo(ctx)) pasos.push('cuando');
  pasos.push('listo');
  return pasos;
}

/** El paso que sigue a `paso` en este recorrido (o «listo»). */
export function pasoSiguiente(ctx: Contexto, r: Respuestas, paso: Paso): Paso {
  const pasos = pasosDelRecorrido(ctx, r);
  const i = pasos.indexOf(paso);
  return pasos[Math.min(pasos.length - 1, i + 1)] ?? 'listo';
}

/** El paso anterior, o el primero. */
export function pasoAnterior(ctx: Contexto, r: Respuestas, paso: Paso): Paso {
  const pasos = pasosDelRecorrido(ctx, r);
  const i = pasos.indexOf(paso);
  return pasos[Math.max(0, i - 1)] ?? 'como';
}

/** Si este es el último paso antes de «Listo»: ahí va «Registrar sesión» en lugar de «Seguir». */
export const esElUltimoPaso = (ctx: Contexto, r: Respuestas, paso: Paso): boolean => pasoSiguiente(ctx, r, paso) === 'listo';

// ─── El día y la hora ───────────────────────────────────────────────────────────────────────────

/** El día civil `n` días antes. */
export function diaAnterior(fecha: string, n: number): string {
  return new Date(Date.parse(`${fecha}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
}

/** Cuántos días atrás se ofrecen para tocar desde una sesión de hoy. Más atrás queda «Registrar otro día». */
export const DIAS_PARA_ELEGIR = 7;

/** Los días que se tocan: «Hoy», «Ayer» y los cinco anteriores («29 oct»). Vacío si el día es fijo. */
export function diasParaElegir(ctx: Pick<Contexto, 'fecha' | 'hoy'>): { readonly valor: string; readonly texto: string }[] {
  if (diaFijo(ctx)) return [];
  return Array.from({ length: DIAS_PARA_ELEGIR }, (_, n) => {
    const valor = diaAnterior(ctx.hoy, n);
    return { valor, texto: n === 0 ? T.hoy : n === 1 ? T.ayer : fechaCorta(valor) };
  });
}

export type Franja = 'manana' | 'tarde' | 'noche';

/** Las horas en punto, en tres franjas para no mostrar diecinueve botones juntos. */
export const FRANJAS: readonly { readonly valor: Franja; readonly texto: string; readonly horas: readonly number[] }[] = [
  { valor: 'manana', texto: 'Mañana', horas: [5, 6, 7, 8, 9, 10, 11] },
  { valor: 'tarde', texto: 'Tarde', horas: [12, 13, 14, 15, 16, 17, 18] },
  { valor: 'noche', texto: 'Noche', horas: [19, 20, 21, 22, 23] },
];

/** El huso de la API: Argentina no tiene horario de verano desde 2009 (como `finalizar` de la sesión enfocada). */
const DESPLAZAMIENTO = '-03:00';
const MS_DEL_DESPLAZAMIENTO = 3 * 3_600_000;

/** El día y la hora civiles de un instante, en UTC−3. */
function civilDe(ahora: Date): { readonly dia: string; readonly hora: number } {
  const local = new Date(ahora.getTime() - MS_DEL_DESPLAZAMIENTO);
  return { dia: local.toISOString().slice(0, 10), hora: local.getUTCHours() };
}

/** Las horas que se pueden elegir ese día: hoy, ninguna posterior a ahora (la API no acepta una hora futura). */
export function horasDisponibles(franja: Franja, dia: string, ahora: Date): number[] {
  const horas = FRANJAS.find((f) => f.valor === franja)?.horas ?? [];
  const actual = civilDe(ahora);
  if (dia > actual.dia) return [];
  return dia === actual.dia ? horas.filter((h) => h <= actual.hora) : [...horas];
}

/** Las franjas con alguna hora para elegir. */
export const franjasDisponibles = (dia: string, ahora: Date) => FRANJAS.filter((f) => horasDisponibles(f.valor, dia, ahora).length > 0);

/** La franja de una hora, para mostrarla elegida al volver al paso. */
export const franjaDe = (hora: number | null): Franja | null => (hora === null ? null : (FRANJAS.find((f) => f.horas.includes(hora))?.valor ?? null));

/** La hora elegida, si sigue valiendo para otro día; si no, `null`. Hoy, una hora que todavía no llegó se suelta. */
export function horaQueSigue(hora: number | null, dia: string, ahora: Date): number | null {
  const f = franjaDe(hora);
  return f !== null && hora !== null && horasDisponibles(f, dia, ahora).includes(hora) ? hora : null;
}

export const textoDeHora = (h: number): string => `${String(h).padStart(2, '0')}:00`;

/** El instante de un día y una hora en punto, en UTC−3. */
export const instanteDe = (dia: string, hora: number): string => new Date(`${dia}T${textoDeHora(hora)}:00${DESPLAZAMIENTO}`).toISOString();

// ─── Lo que se registra ─────────────────────────────────────────────────────────────────────────

type Cambios = EditarBorradorDeEjecucionRequest['changes'];

export interface ResumenDelRegistroRapido {
  readonly forma: 'series' | 'resumen';
  readonly ejercicios: number;
  readonly deEjercicios: number;
  readonly series: number;
  readonly condicion: 'COMPLETED' | 'COMPLETED_WITH_DEVIATION';
  /** El nivel de detalle con el que la ve el profesional (DL-161): «Carga rápida», «Carga rápida con cambios»… */
  readonly nivel: NivelDeDetalle | null;
}

export type RegistroArmado =
  | { readonly ok: true; readonly changes: Cambios; readonly resumen: ResumenDelRegistroRapido }
  | {
      readonly ok: false;
      readonly paso: Paso;
      readonly motivo: string;
      readonly errores?: Readonly<Record<string, ErroresDeFila>>;
      /** Con «Hice todo lo planificado», el ejercicio cuyo cambio hay que abrir para resolverlo. */
      readonly ejercicio?: string;
    };

/** La clave de una serie en los errores del detalle. */
export const claveDeSerie = (prescriptionId: string, setIndex: number): string => `${prescriptionId}:${setIndex}`;

/**
 * Las series de un ejercicio revisado en el detalle o en «Cambiar la serie N»: lo tildado sin escribir, con el plan
 * (`AS_PLANNED`); lo escrito, `TYPED`, con lo planificado en lo que quedó vacío (`serieAlTildar`). Lo que se ve es lo
 * que viaja: escribir solo las repeticiones no borra la carga ni el RIR que se veían en gris.
 */
function seriesDelDetalle(p: PrescripcionConObjetivos, e: EjercicioRapido, errores: Record<string, ErroresDeFila>, primerProblema: { motivo: string | null; ejercicio: string | null }): SerieEjecutadaApi[] {
  const unidad = unidadDelEjercicio(p);
  const series: SerieEjecutadaApi[] = [];
  for (const s of p.sets) {
    const r = e.series[s.setIndex];
    if (!r?.hecha) continue;
    const escrita = r.escrita;
    const algoEscrito = escrita.carga.trim() !== '' || escrita.repeticiones.trim() !== '' || escrita.rir.trim() !== '';
    if (!algoEscrito) {
      const delPlan = serieDelPlan(s);
      if (delPlan) series.push(delPlan);
      else {
        errores[claveDeSerie(p.prescriptionId, s.setIndex)] = { fila: COPY_ENTRENAMIENTO_POR_SERIE.faltaUnDato };
        primerProblema.motivo ??= T.faltaUnDato(p.exerciseName, s.setIndex);
        primerProblema.ejercicio ??= p.prescriptionId;
      }
      continue;
    }
    // Lo escrito y, en lo que quedó vacío, lo planificado que se veía en gris: la regla de la casilla de la sesión.
    const leida = serieAlTildar(escrita, s.target, s.setIndex, unidad);
    if (!leida.ok) {
      errores[claveDeSerie(p.prescriptionId, s.setIndex)] = leida.errores;
      primerProblema.motivo ??= leida.errores.fila ? T.faltaUnDato(p.exerciseName, s.setIndex) : T.revisaUnValor(p.exerciseName, s.setIndex);
      primerProblema.ejercicio ??= p.prescriptionId;
      continue;
    }
    series.push(leida.serie);
  }
  return series;
}

/**
 * Lo que se manda a API-TRN-17 con las respuestas de los pasos, o el paso al que hay que volver y por qué. `exercises`,
 * `sessionSummary`, `reason` y `occurredAt` van siempre: el PATCH reemplaza cada campo presente, y así un reintento con
 * otras respuestas no deja nada del intento anterior.
 */
export function armarRegistro(ctx: Contexto, r: Respuestas, ahora: Date): RegistroArmado {
  if (r.eleccion === null) return { ok: false, paso: 'como', motivo: T.faltaElegir };
  const prescripciones = ctx.sesion.prescriptions;
  const errores: Record<string, ErroresDeFila> = {};
  const primerProblema: { motivo: string | null; ejercicio: string | null } = { motivo: null, ejercicio: null };
  // Con «todo» no hay cuadro de ejercicios ni de series: lo que falta se resuelve desde el final, en el cambio del ejercicio.
  const todo = r.eleccion === 'todo';
  const exercises: { prescriptionId: string; performedExerciseVersionId: string; sets: SerieEjecutadaApi[] }[] = [];
  let todoCompleto = true;
  for (const p of prescripciones) {
    // Un ejercicio sin series en el plan (el website lo permite) no tiene qué registrar por serie: no se manda, porque
    // sin series la confirmación lo rechaza (SET_REQUIRED), y no cambia la condición.
    if (p.sets.length === 0) continue;
    const e = r.ejercicios[p.prescriptionId];
    if (!e?.hecho) {
      todoCompleto = false;
      continue;
    }
    if (!e.cambio && seRegistraConElPlan(p)) {
      exercises.push({ prescriptionId: p.prescriptionId, performedExerciseVersionId: p.exerciseVersionId, sets: p.sets.flatMap((s) => serieDelPlan(s) ?? []) });
      continue;
    }
    const hechas = p.sets.filter((s) => e.series[s.setIndex]?.hecha).length;
    if (hechas < p.sets.length) todoCompleto = false;
    // Con todas sus series destildadas, el ejercicio no se hizo: no se manda (SET_REQUIRED).
    if (hechas === 0) continue;
    const sets = seriesDelDetalle(p, e, errores, primerProblema);
    if (sets.length > 0) exercises.push({ prescriptionId: p.prescriptionId, performedExerciseVersionId: p.exerciseVersionId, sets });
  }
  if (primerProblema.motivo) return { ok: false, paso: todo ? 'revisar' : 'detalle', motivo: primerProblema.motivo, errores, ...(todo && primerProblema.ejercicio ? { ejercicio: primerProblema.ejercicio } : {}) };

  const nota = r.nota.trim();
  let occurredAt: string | null = null;
  if (r.dia !== ctx.hoy || r.hora !== null) {
    if (r.hora === null) return { ok: false, paso: 'cuando', motivo: T.faltaLaHora };
    occurredAt = instanteDe(r.dia, r.hora);
    if (Date.parse(occurredAt) > ahora.getTime()) return { ok: false, paso: 'cuando', motivo: T.revisaLaHora };
  }

  if (exercises.length === 0) {
    // Solo «Hice algo distinto» se registra sin series: con «todo» o «una parte», algo de lo planificado se hizo.
    if (todo) return { ok: false, paso: 'revisar', motivo: T.faltaUnaSerie };
    if (r.eleccion !== 'distinto') return { ok: false, paso: 'ejercicios', motivo: T.faltaTildar };
    const description = nota ? `${fraseDe(r.eleccion)}: ${nota}` : `${fraseDe(r.eleccion)}.`;
    return {
      ok: true,
      changes: { granularity: 'EXERCISE_OR_SESSION', sessionCondition: 'COMPLETED_WITH_DEVIATION', exercises: [], sessionSummary: { description }, reason: null, occurredAt },
      resumen: { forma: 'resumen', ejercicios: 0, deEjercicios: prescripciones.length, series: 0, condicion: 'COMPLETED_WITH_DEVIATION', nivel: 'RESUMIDA' },
    };
  }
  const condicion = r.eleccion === 'todo' && todoCompleto ? 'COMPLETED' : 'COMPLETED_WITH_DEVIATION';
  return {
    ok: true,
    changes: { granularity: 'SET', sessionCondition: condicion, exercises, sessionSummary: null, reason: nota || null, occurredAt },
    resumen: {
      forma: 'series',
      ejercicios: exercises.length,
      deEjercicios: prescripciones.length,
      series: exercises.reduce((n, x) => n + x.sets.length, 0),
      condicion,
      nivel: nivelDeDetalleDelRegistro({ sessionCondition: condicion, granularity: 'SET', exercises }),
    },
  };
}

const seriesEnTexto = (n: number): string => `${numero(n, 0)} ${n === 1 ? 'serie' : 'series'}`;

/** «4 de 5 ejercicios · 11 series», o «Sin series: un resumen». */
function loRegistrado(r: ResumenDelRegistroRapido): string {
  if (r.forma === 'resumen') return 'la sesión resumida, sin series';
  return `${numero(r.ejercicios, 0)} de ${numero(r.deEjercicios, 0)} ${r.deEjercicios === 1 ? 'ejercicio' : 'ejercicios'} · ${seriesEnTexto(r.series)}`;
}

/** Antes de registrar: «Vas a registrar 4 de 5 ejercicios · 11 series. Queda como «Realizada con desvío».» */
export const textoAntesDeRegistrar = (r: ResumenDelRegistroRapido): string =>
  `Vas a registrar ${loRegistrado(r)}. Queda como «${etiquetaDeCondicionRegistrada({ sessionCondition: r.condicion })}».`;

/** En «Listo»: «Registraste 4 de 5 ejercicios · 11 series.» */
export const textoDelResumen = (r: ResumenDelRegistroRapido): string => `Registraste ${loRegistrado(r)}.`;

/** Lo que dice «Listo» sobre lo que ve el profesional: el mismo rótulo de nivel que lee en el website. */
export const loQueVeTuProfesional = (r: Pick<ResumenDelRegistroRapido, 'nivel'>): string => (r.nivel ? T.comoLaVeTuProfesional(textoDelNivelDeDetalle(r.nivel)) : T.loVeTuProfesional);

/** Lo planificado de una serie, en el mismo orden que la línea del ejercicio: «10 rep. · RIR 2 · 16 kg». */
export function lineaDeLaSerie(s: SerieConObjetivo): string {
  const t = s.target;
  const reps = repeticionesDe(s);
  const partes = [reps === null ? null : `${reps} rep.`, textoDeRir(t.rir), textoDeCarga(t.suggestedLoad)].filter((x): x is string => x !== null);
  return partes.length > 0 ? partes.join(' · ') : 'Sin objetivo';
}

// ─── Cuándo se ofrece, y qué no se pisa ─────────────────────────────────────────────────────────

/**
 * «Ya la hice» se ofrece en una sesión sin borrador (NOT_STARTED), que no está en curso ni en este teléfono: con un
 * borrador abierto queda «Continuar entrenamiento», que conserva lo cargado. Sin ejercicios no hay qué tildar.
 */
export function sePuedeOfrecer(o: Pick<Ocurrencia, 'occurrenceId' | 'execution' | 'plannedSession'>, enCurso: boolean, sesionesDelTelefono: readonly { readonly occurrenceId: string }[]): boolean {
  return o.execution.state === 'NOT_STARTED' && !enCurso && o.plannedSession.prescriptions.length > 0 && !sesionesDelTelefono.some((s) => s.occurrenceId === o.occurrenceId);
}

/** Lo último que este recorrido dejó en un borrador: su versión y lo mandado. */
export interface LoQueMandamos {
  readonly draftId: string;
  readonly version: string;
  readonly cuerpo: string;
}

/**
 * Si el borrador ya tiene series o un resumen que no puso este recorrido. Esos datos no se pisan en silencio: el PATCH
 * reemplaza `exercises` entero. Una granularidad o una condición elegidas sin nada cargado no son datos.
 */
export function borradorConDatos(b: Pick<BorradorDeEjecucion, 'draftId' | 'version' | 'exercises' | 'sessionSummary'>, nuestro: LoQueMandamos | null): boolean {
  if (nuestro && nuestro.draftId === b.draftId && nuestro.version === b.version) return false;
  return b.exercises.length > 0 || b.sessionSummary !== null;
}

/** La ocurrencia de la misma sesión en otro día, si es de la misma versión del plan; si no, por qué no se registra ahí. */
export function ocurrenciaDelDia(
  ocurrencias: readonly Pick<Ocurrencia, 'occurrenceId' | 'planId' | 'plannedSession' | 'execution'>[],
  sessionId: string,
  planId: string,
): { readonly ok: true; readonly occurrenceId: string; readonly executionId: string | null } | { readonly ok: false; readonly motivo: string } {
  const o = ocurrencias.find((x) => x.plannedSession.sessionId === sessionId);
  if (!o) return { ok: false, motivo: T.sinSesionEseDia };
  if (o.planId !== planId) return { ok: false, motivo: T.otroPlanEseDia };
  return { ok: true, occurrenceId: o.occurrenceId, executionId: o.execution.state === 'REGISTERED' ? o.execution.executionId : null };
}
