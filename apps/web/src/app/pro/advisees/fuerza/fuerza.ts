/**
 * La vertical de fuerza en el website del profesional (WP-EDITORES-PROFESIONAL §5.8; DL-171), sin React: lo que leen la
 * tarjeta (ED-75), «Cómo se calculó» (ED-73), la evolución (ED-74) y el cuadro de la carga (ED-76) a partir de la clave
 * TRAINING_STRENGTH_ESTIMATE_BY_EXERCISE de API-PRJ-01. Las cuentas y los textos son del dominio (`estimacion-de-fuerza`):
 * acá solo se elige qué valor mostrar y se lo pasa a esas funciones.
 *
 * Nada de esto lee la prescripción (TEST-EDP-065): todo sale de lo registrado y de lo observado.
 */
import {
  COPY_FUERZA,
  diaDeLaEstimacion,
  estimarLaSerie,
  leerNumero,
  motivoEnPalabras,
  origenDeLaEstimacion,
  referenciaDeLaEstimacion,
  type EstimacionDeFuerza,
  type MotivoFueraDeLaEstimacion,
  type PuntoDeFuerza,
  type UnidadDeLaCarga,
} from '@be/domain';

/** Las series que no entraron, como las devuelve la clave (el esquema no exporta su tipo). */
export interface SerieQueNoEntro {
  readonly executionId: string;
  readonly date: string;
  /** La prescripción de la serie: con dos del mismo ejercicio en la sesión, el número solo no la ubica. */
  readonly prescriptionId: string;
  readonly setIndex: number;
  readonly reason: MotivoFueraDeLaEstimacion;
  readonly fields: readonly ('load' | 'completedRepetitions' | 'rir')[];
}

/** El punto de la API como valor del dominio, para usar sus cuentas y sus textos. */
export function estimacionDelPunto(p: PuntoDeFuerza, exerciseId: string): EstimacionDeFuerza {
  const e = p.estimate;
  return {
    especificacion: 'BE-E1RM',
    version: 1,
    metodo: 'EPLEY_V1',
    exerciseId,
    fechaCivil: p.date,
    fuente: p.source === 'OBSERVED' ? 'OBSERVADA' : 'PERSONA',
    unidad: e.load.unit,
    carga: e.load.value,
    repeticiones: e.completedRepetitions,
    rir: e.rir,
    repeticionesEquivalentes: e.equivalentRepetitions,
    banda: e.band === 'ORIENTATIVE' ? 'ORIENTATIVA' : 'NUCLEO',
    valor: e.value,
  };
}

/**
 * «la escribió Diego Sosa en la app» o «la observó Martín Acosta» (RM-21). El nombre lo pasa la pantalla, que lo toma
 * de «Ocultar nombres» (`useNombres`, TEST-TAG-004).
 */
export const quienLaEscribio = (p: PuntoDeFuerza, nombre: string): string => origenDeLaEstimacion(p.source === 'OBSERVED' ? 'OBSERVADA' : 'PERSONA', nombre);

/** «70 kg × 12 · RIR 0»: la serie de origen, como se escribió. */
export function laSerie(p: PuntoDeFuerza): string {
  const e = p.estimate;
  return `${numeroCorto(e.load.value)} ${e.load.unit} × ${e.completedRepetitions} · RIR ${numeroCorto(e.rir)}`;
}

const numeroCorto = (n: number): string => String(n).replace('.', ',');

/** El orden de lectura: el más reciente primero; a igual fecha, la observación del profesional después de la sesión. */
const masReciente = (a: PuntoDeFuerza, b: PuntoDeFuerza): number => (a.date === b.date ? (a.source === b.source ? 0 : a.source === 'OBSERVED' ? 1 : -1) : a.date < b.date ? 1 : -1);

/** La clave del registro de origen de un punto: la ejecución o la observación. */
const origenDe = (p: PuntoDeFuerza): string => `${p.origin.type}:${p.origin.id}`;

/**
 * Qué valor muestra la tarjeta (ED-75; recomendación del 11/11, ratificada el 12/11): la regla por sesión con el
 * interruptor apagado, sobre la última sesión con series que entran. Si esa sesión solo tiene series de más de 10 a
 * 12, la de mayor carga de ellas, como «estimación orientativa». Pide las dos lecturas: la de `apagado` y la de
 * `encendido` (con las orientativas). `null`: todavía no hay series que permitan estimar.
 */
export function valorDeLaTarjeta(apagado: readonly PuntoDeFuerza[], encendido: readonly PuntoDeFuerza[]): PuntoDeFuerza | null {
  const ultimo = [...encendido].sort(masReciente)[0];
  if (!ultimo) return [...apagado].sort(masReciente)[0] ?? null;
  // Del mismo registro, el que eligió la regla con el interruptor apagado, si hubo uno.
  return apagado.find((p) => origenDe(p) === origenDe(ultimo)) ?? ultimo;
}

/** Los puntos de una línea, del más reciente al más antiguo (la tabla de origen y la lista del cuadro de la carga). */
export const delMasReciente = (puntos: readonly PuntoDeFuerza[]): PuntoDeFuerza[] => [...puntos].sort(masReciente);

/** «de hace 4 días», «de hace 1 semana», «de hace 7 semanas» (ED-76): la antigüedad, sin pasar por UTC. */
export function antiguedad(fecha: string, hoy: string): string {
  const dias = Math.round((Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${fecha}T12:00:00Z`)) / 86_400_000);
  if (dias <= 0) return 'de hoy';
  if (dias === 1) return 'de ayer';
  if (dias < 7) return `de hace ${dias} días`;
  const semanas = Math.floor(dias / 7);
  return semanas === 1 ? 'de hace 1 semana' : `de hace ${semanas} semanas`;
}

/** En la sesión del punto, las series que no entraron y por qué: «Serie 3: el RIR es el del plan» (ED-73). */
export function loQueNoEntroEnLaSesion(p: PuntoDeFuerza, noEntraron: readonly SerieQueNoEntro[]): string[] {
  if (p.origin.type !== 'TRAINING_EXECUTION') return [];
  const id = p.origin.id;
  return noEntraron
    .filter((s) => s.executionId === id)
    .sort((a, b) => a.setIndex - b.setIndex)
    .map((s) => `Serie ${s.setIndex}: ${motivoEnPalabras({ entra: false, motivo: s.reason, campos: s.fields })}`);
}

/**
 * Lo que hace falta para estimar, en palabras (ED-75, el estado vacío). Si hay series registradas que no entraron, la
 * regla del RIR va siempre, con el texto de ED-72; los motivos más frecuentes, en una línea.
 */
export function loQueHaceFalta(noEntraron: readonly SerieQueNoEntro[]): { readonly motivos: string | null; readonly regla: string } {
  const cuenta = new Map<MotivoFueraDeLaEstimacion, number>();
  for (const s of noEntraron) cuenta.set(s.reason, (cuenta.get(s.reason) ?? 0) + 1);
  const motivos = [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => COPY_FUERZA.motivo[m]);
  return {
    motivos: motivos.length === 0 ? null : `Las series registradas no entran: ${motivos.join('; ')}.`,
    regla: COPY_FUERZA.reglaDelRir,
  };
}

/** «18 dic» para la tarjeta; la fecha civil tal como vino (RM-15). */
export const diaDelPunto = (p: PuntoDeFuerza): string => diaDeLaEstimacion(p.date);

/** El enlace a la evolución en «Analizar», ya filtrada (ED-74 desde ED-75). */
export const PREGUNTA_DE_LA_FUERZA = 'fuerza-estimada';
export function haciaLaEvolucion(asesoradoId: string, exerciseId: string, unidad: 'kg' | 'lb' = 'kg'): string {
  return `/pro/advisees?id=${encodeURIComponent(asesoradoId)}&vista=analizar&pregunta=${PREGUNTA_DE_LA_FUERZA}&ejercicio=${encodeURIComponent(exerciseId)}&unidad=${unidad}`;
}

/** La sesión de origen en Registros, abierta (ED-73, «Ver la sesión»); `null` para una observación, que no tiene sesión. */
export function haciaLaSesion(asesoradoId: string, p: PuntoDeFuerza): string | null {
  if (p.origin.type !== 'TRAINING_EXECUTION') return null;
  return `/pro/advisees/training?id=${encodeURIComponent(asesoradoId)}&vista=ejecuciones&desde=${p.date}&hasta=${p.date}&sesion=${encodeURIComponent(p.origin.id)}`;
}

// ─── ED-72 · la serie observada, mientras se escribe ─────────────────────────────────────────────────────────────

/** Lo escrito en el cuadro, como texto: la cuenta se hace con lo que se entiende. */
export interface SerieObservadaEscrita {
  readonly exerciseId: string;
  readonly fecha: string;
  readonly carga: string;
  readonly unidad: UnidadDeLaCarga;
  readonly repeticiones: string;
  /** `null`: todavía no se eligió un RIR. */
  readonly rir: number | null;
}

/**
 * Lo que el cuadro dice en vivo y si se puede guardar (ED-D19: una observación que no se puede estimar no se guarda).
 * `incompleta`: falta escribir algo, y el cuadro dice qué; `no-se-estima`: está escrita y Epley no estima, con el motivo
 * en palabras; `estima`: la estimación, para mostrarla y guardarla.
 */
export type SerieObservadaEnVivo =
  | { readonly tipo: 'incompleta'; readonly texto: string }
  | { readonly tipo: 'no-se-estima'; readonly texto: string }
  | { readonly tipo: 'estima'; readonly estimacion: EstimacionDeFuerza; readonly carga: number; readonly repeticiones: number; readonly rir: number };

const QUE_FALTA = { carga: 'Falta la carga: un número mayor que 0.', repeticiones: 'Faltan las repeticiones: un número entero, desde 1.' } as const;

export function serieObservadaEnVivo(s: SerieObservadaEscrita): SerieObservadaEnVivo {
  const carga = leerNumero(s.carga);
  const repeticiones = leerNumero(s.repeticiones);
  if (carga === null || !(carga > 0)) return { tipo: 'incompleta', texto: QUE_FALTA.carga };
  if (repeticiones === null || !Number.isInteger(repeticiones) || repeticiones < 1) return { tipo: 'incompleta', texto: QUE_FALTA.repeticiones };
  const r = estimarLaSerie({ exerciseId: s.exerciseId, fuente: 'OBSERVADA', load: { value: carga, unit: s.unidad }, completedRepetitions: repeticiones, rir: s.rir, fechaCivil: s.fecha });
  if (r.entra) return { tipo: 'estima', estimacion: r.estimacion, carga, repeticiones, rir: r.estimacion.rir };
  if (r.motivo === 'SIN_RIR') return { tipo: 'no-se-estima', texto: COPY_FUERZA.sinRir };
  if (r.motivo === 'RIR_MAYOR_QUE_2') return { tipo: 'no-se-estima', texto: COPY_FUERZA.rirMayorQue2 };
  if (r.motivo === 'MAS_DE_12') return { tipo: 'no-se-estima', texto: COPY_FUERZA.masDe12 };
  return { tipo: 'no-se-estima', texto: `No se estima: ${motivoEnPalabras(r)}.` };
}

/** Los RIR que se pueden elegir en el cuadro: de 0 a 2, de a medio (la maqueta 17). */
export const RIR_DEL_CUADRO: readonly number[] = [0, 0.5, 1, 1.5, 2];
/** «Más de 2»: un RIR que se puede elegir para que el cuadro diga que no se estima (ED-72); nunca se guarda. */
export const RIR_MAS_DE_2 = 3;

// ─── ED-76 · lo que se escribe en el borrador ────────────────────────────────────────────────────────────────────

/** Lo mínimo de una prescripción que toca el cálculo de la carga: el criterio y la carga general. */
export interface PrescripcionParaLaCarga {
  readonly intensity?: { readonly criterion: string; readonly target: { readonly value: number; readonly reference?: { readonly description: string } | null } } | null;
  readonly suggestedLoad?: { readonly value: number; readonly unit: UnidadDeLaCarga } | null;
}

/**
 * Lo que «Escribir 72,5 kg en Press de banca» deja en la fila general, solo al confirmar (ED-76): la carga sugerida y,
 * si el criterio es % RM, el valor del % RM y la referencia con el método y la fecha, nunca el valor (RM-40). Con el criterio RIR, o
 * sin criterio, solo la carga: BE no convierte entre criterios (06:5431).
 */
export function loQueSeEscribeEnLaFilaGeneral(
  p: PrescripcionParaLaCarga,
  carga: { readonly value: number; readonly unit: UnidadDeLaCarga },
  porcentaje: number,
  fechaDeLaEstimacion: string,
): Pick<PrescripcionParaLaCarga, 'suggestedLoad'> & Partial<Pick<PrescripcionParaLaCarga, 'intensity'>> {
  const suggestedLoad = { value: carga.value, unit: carga.unit };
  if (p.intensity?.criterion !== 'PERCENT_RM') return { suggestedLoad };
  return { suggestedLoad, intensity: { criterion: 'PERCENT_RM', target: { value: porcentaje, reference: { description: referenciaDeLaEstimacion(fechaDeLaEstimacion) } } } };
}

/** «Escribir 72,5 kg en Press de banca»: el principal del cuadro, con lo que escribe. */
export const textoDelPrincipalDeLaCarga = (valor: number, unidad: UnidadDeLaCarga, nombre: string): string => `Escribir ${numeroCorto(valor)} ${unidad} en ${nombre}`;

/** «Y 2 más, del 27 y del 23 de noviembre»: lo que no entra en la lista corta del cuadro de la carga. */
export function lasQueQuedan(resto: readonly PuntoDeFuerza[]): string | null {
  if (resto.length === 0) return null;
  return resto.length === 1 ? `Y 1 más, del ${diaDelPunto(resto[0]!)}.` : `Y ${resto.length} más, la más antigua del ${diaDelPunto(resto[resto.length - 1]!)}.`;
}

// ─── ED-74 · la evolución en «Analizar» ──────────────────────────────────────────────────────────────────────────

/**
 * Los tramos de la línea: dos puntos seguidos se unen solo si entre ellos no hubo una sesión sin estimación («sin línea a
 * través de un hueco», ED-74). Devuelve los pares por su posición en `puntos`, que va del más antiguo al más reciente.
 */
export function tramosDeLaLinea(puntos: readonly PuntoDeFuerza[], noEntraron: readonly SerieQueNoEntro[]): readonly (readonly [number, number])[] {
  const conPunto = new Set(puntos.flatMap((p) => (p.origin.type === 'TRAINING_EXECUTION' ? [p.origin.id] : [])));
  const huecos = [...new Set(noEntraron.filter((s) => !conPunto.has(s.executionId)).map((s) => s.date))];
  const tramos: [number, number][] = [];
  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1]!.date;
    const b = puntos[i]!.date;
    if (!huecos.some((h) => h > a && h < b)) tramos.push([i - 1, i]);
  }
  return tramos;
}

/** Una fila de la tabla de origen: un punto, o una sesión del ejercicio sin estimación, con lo que no entró. */
export type FilaDeLaEvolucion = { readonly tipo: 'punto'; readonly fecha: string; readonly punto: PuntoDeFuerza } | { readonly tipo: 'sin-estimacion'; readonly fecha: string; readonly executionId: string; readonly motivo: string };

/** La tabla de origen (ED-74), del más reciente al más antiguo: los puntos y las sesiones que quedaron sin punto. */
export function filasDeLaEvolucion(puntos: readonly PuntoDeFuerza[], noEntraron: readonly SerieQueNoEntro[]): FilaDeLaEvolucion[] {
  const conPunto = new Set(puntos.flatMap((p) => (p.origin.type === 'TRAINING_EXECUTION' ? [p.origin.id] : [])));
  const sinPunto = new Map<string, SerieQueNoEntro[]>();
  for (const s of noEntraron) if (!conPunto.has(s.executionId)) sinPunto.set(s.executionId, [...(sinPunto.get(s.executionId) ?? []), s]);
  const filas: FilaDeLaEvolucion[] = [
    ...puntos.map((p) => ({ tipo: 'punto' as const, fecha: p.date, punto: p })),
    ...[...sinPunto.entries()].map(([executionId, series]) => ({ tipo: 'sin-estimacion' as const, fecha: series[0]!.date, executionId, motivo: motivoDeLaSesion(series) })),
  ];
  return filas.sort((a, b) => (a.fecha === b.fecha ? 0 : a.fecha < b.fecha ? 1 : -1));
}

/** El motivo más frecuente de una sesión sin punto, en palabras: «ninguna serie entra: el RIR es mayor que 2». */
function motivoDeLaSesion(series: readonly SerieQueNoEntro[]): string {
  const cuenta = new Map<MotivoFueraDeLaEstimacion, number>();
  for (const s of series) cuenta.set(s.reason, (cuenta.get(s.reason) ?? 0) + 1);
  const [motivo] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]!;
  return `ninguna serie entra: ${COPY_FUERZA.motivo[motivo]}`;
}
