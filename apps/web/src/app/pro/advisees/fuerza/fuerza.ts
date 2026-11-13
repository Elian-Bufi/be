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
  PASOS_DEL_REDONDEO,
  referenciaDeLaEstimacion,
  type SentidoDelRedondeo,
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

/**
 * En la sesión del punto, las series que no entraron y por qué: «Serie 3: el RIR es el del plan» (ED-73). Con otra
 * prescripción del mismo ejercicio en la sesión, el número solo no la ubica: sus series dicen de cuál son («Serie 1, de
 * la otra prescripción del ejercicio»; con más de una, numeradas en el orden en que aparecen). Primero las de la
 * prescripción del punto.
 */
export function loQueNoEntroEnLaSesion(p: PuntoDeFuerza, noEntraron: readonly SerieQueNoEntro[]): string[] {
  if (p.origin.type !== 'TRAINING_EXECUTION') return [];
  const { id, prescriptionId } = p.origin;
  const deLaSesion = noEntraron.filter((s) => s.executionId === id);
  const otras = [...new Set(deLaSesion.map((s) => s.prescriptionId).filter((x) => x !== prescriptionId))];
  const deCual = (s: SerieQueNoEntro): string =>
    s.prescriptionId === prescriptionId ? '' : otras.length === 1 ? ', de la otra prescripción del ejercicio' : `, de otra prescripción del ejercicio (${otras.indexOf(s.prescriptionId) + 1}.ª)`;
  const orden = (s: SerieQueNoEntro): number => (s.prescriptionId === prescriptionId ? 0 : otras.indexOf(s.prescriptionId) + 1);
  return [...deLaSesion]
    .sort((a, b) => orden(a) - orden(b) || a.setIndex - b.setIndex)
    .map((s) => `Serie ${s.setIndex}${deCual(s)}: ${motivoEnPalabras({ entra: false, motivo: s.reason, campos: s.fields })}`);
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

/**
 * El enlace a la evolución en «Analizar», ya filtrada (ED-74 desde ED-75). `orientativas`: con «Incluir las de más de 10
 * a 12» encendido, para que un valor orientativo de la tarjeta esté también en la evolución.
 */
export const PREGUNTA_DE_LA_FUERZA = 'fuerza-estimada';
export function haciaLaEvolucion(asesoradoId: string, exerciseId: string, unidad: 'kg' | 'lb' = 'kg', orientativas = false): string {
  return `/pro/advisees?id=${encodeURIComponent(asesoradoId)}&vista=analizar&pregunta=${PREGUNTA_DE_LA_FUERZA}&ejercicio=${encodeURIComponent(exerciseId)}&unidad=${unidad}${orientativas ? '&orientativas=1' : ''}`;
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

/**
 * Si la API rechazó la observación por la fecha: responde 422 VALIDATION_FAILED y el motivo viaja en `issues[].code`
 * (API-FZA-01), no en el código del error.
 */
export function esLaFechaFutura(r: { readonly ok: boolean; readonly tipo?: string; readonly issues?: readonly { readonly code: string }[] }): boolean {
  return !r.ok && r.tipo === 'API' && (r.issues ?? []).some((i) => i.code === 'OBSERVED_DATE_IN_FUTURE');
}

/** Los RIR que se pueden elegir en el cuadro: de 0 a 2, de a medio (la maqueta 17). */
export const RIR_DEL_CUADRO: readonly number[] = [0, 0.5, 1, 1.5, 2];
/** «Más de 2»: un RIR que se puede elegir para que el cuadro diga que no se estima (ED-72); nunca se guarda. */
export const RIR_MAS_DE_2 = 3;

// ─── ED-72 · corregir o anular una serie observada (API-FZA-03) ──────────────────────────────────────────────────

/** Lo que se escribe en el cuadro de la serie observada, como texto (el mismo formulario que al registrarla). */
export interface FormularioDeLaObservacion {
  readonly fecha: string;
  readonly carga: string;
  readonly unidad: UnidadDeLaCarga;
  readonly repeticiones: string;
  readonly rir: number | null;
  readonly nota: string;
}

/** La observación guardada, con lo que hace falta para sucederla (API-FZA-02). */
export interface ObservacionGuardada {
  readonly observationId: string;
  readonly version: string;
  readonly localDate: string;
  readonly timeZone: string;
  readonly note: string | null;
  readonly estimate: { readonly load: { readonly value: number; readonly unit: UnidadDeLaCarga }; readonly completedRepetitions: number; readonly rir: number };
}

/** El formulario de la corrección arranca con los valores de la observación: se cambia solo lo que estaba mal. */
export function formularioDeLaObservacion(o: ObservacionGuardada): FormularioDeLaObservacion {
  const e = o.estimate;
  return { fecha: o.localDate, carga: numeroCorto(e.load.value), unidad: e.load.unit, repeticiones: String(e.completedRepetitions), rir: e.rir, nota: o.note ?? '' };
}

export type AccionDeLaSucesion = 'corregir' | 'anular';

type CuerpoDeLaSucesion =
  | { action: 'VOID'; expectedVersion: string; reason: string }
  | {
      action: 'CORRECT';
      expectedVersion: string;
      reason: string;
      observation: { localDate: string; timeZone: string; load: { value: number; unit: UnidadDeLaCarga }; completedRepetitions: number; rir: number; note: string | null };
    };

/**
 * El cuerpo de API-FZA-03, o por qué todavía no se puede enviar. Anular pide solo el motivo; corregir, además, una serie
 * que se pueda estimar y que cambie algo (una corrección igual a la anterior sería una versión nueva sin nada nuevo). La
 * versión esperada es la que se leyó: si alguien la sucedió mientras tanto, la API responde 409 y no se pisa nada.
 */
export function cuerpoDeLaSucesion(
  accion: AccionDeLaSucesion,
  motivo: string,
  o: ObservacionGuardada,
  f: FormularioDeLaObservacion,
  enVivo: SerieObservadaEnVivo,
  hoy: string,
): { readonly ok: true; readonly cuerpo: CuerpoDeLaSucesion } | { readonly ok: false; readonly falta: string } {
  const razon = motivo.trim();
  if (!razon) return { ok: false, falta: COPY_SUCESION.faltaElMotivo };
  if (razon.length > 500) return { ok: false, falta: COPY_SUCESION.motivoLargo };
  if (accion === 'anular') return { ok: true, cuerpo: { action: 'VOID', expectedVersion: o.version, reason: razon } };
  if (f.fecha > hoy) return { ok: false, falta: COPY_SUCESION.fechaFutura };
  if (enVivo.tipo !== 'estima') return { ok: false, falta: enVivo.texto };
  const nota = f.nota.trim() ? f.nota.trim() : null;
  const e = o.estimate;
  const igual =
    f.fecha === o.localDate && enVivo.carga === e.load.value && f.unidad === e.load.unit && enVivo.repeticiones === e.completedRepetitions && enVivo.rir === e.rir && nota === (o.note?.trim() || null);
  if (igual) return { ok: false, falta: COPY_SUCESION.sinCambios };
  return {
    ok: true,
    cuerpo: {
      action: 'CORRECT',
      expectedVersion: o.version,
      reason: razon,
      observation: { localDate: f.fecha, timeZone: o.timeZone, load: { value: enVivo.carga, unit: f.unidad }, completedRepetitions: enVivo.repeticiones, rir: enVivo.rir, note: nota },
    },
  };
}

/** Si la API rechazó la sucesión porque otra ya sucedió a esa observación: 409, la versión esperada ya no es la vigente. */
export const laSucedioOtro = (r: { readonly ok: boolean; readonly tipo?: string; readonly status?: number }): boolean => !r.ok && r.tipo === 'API' && r.status === 409;

/** Solo quien la observó puede sucederla (API-FZA-03): a los demás, la API no les revela que existe. */
export const puedeSucederla = (p: PuntoDeFuerza, yo: string | null | undefined): boolean => p.source === 'OBSERVED' && p.origin.type === 'STRENGTH_OBSERVATION' && !!yo && p.writtenBy.identityId === yo;

export const COPY_SUCESION = {
  abrir: 'Corregir o anular esta serie observada',
  titulo: 'Corregir o anular la serie observada',
  queEs: 'La serie observada no se edita: la corrección es una observación nueva que la reemplaza, y la anulación la saca de la estimación. Las dos quedan en la historia, con tu motivo.',
  accion: '¿Qué hacés?',
  corregir: 'Corregirla',
  corregirQueEs: 'Los valores estaban mal: escribís los correctos.',
  anular: 'Anularla',
  anularQueEs: 'No debió registrarse: deja de contar en la estimación.',
  motivo: 'Motivo',
  motivoAyuda: 'Obligatorio. Queda guardado con la fecha y tu nombre.',
  guardarCorreccion: 'Guardar la corrección',
  anularla: 'Anular la serie observada',
  guardando: 'Guardando…',
  faltaElMotivo: 'Escribí el motivo.',
  motivoLargo: 'El motivo tiene hasta 500 caracteres.',
  fechaFutura: 'La fecha no puede ser posterior a hoy.',
  sinCambios: 'La corrección tiene los mismos valores: cambiá lo que estaba mal.',
  corregida: 'Se guardó la corrección de la serie observada.',
  anulada: 'Se anuló la serie observada. Ya no cuenta en la estimación.',
  leyendo: 'Leyendo la serie observada…',
  noEsta: 'Esta serie observada ya no está vigente: alguien la corrigió o la anuló. Volvé atrás para ver la de ahora.',
  laSucedioOtro: 'Mientras tanto, esta serie observada se corrigió o se anuló. No se guardó nada: volvé atrás para ver la de ahora.',
} as const;

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

/**
 * Cómo arranca el cuadro de la carga cada vez que se abre (ED-76; ED-D20): ninguna estimación elegida, el % RM de la
 * prescripción de ese momento (si su criterio es % RM), el paso de entrada de la unidad de ese momento, hacia abajo
 * (ED-D17) y la carga sugerida. Nada de una vez anterior: una elección vieja puede no estar entre las que se ven.
 */
export function entradaDelCuadroDeLaCarga(
  p: PrescripcionParaLaCarga,
  unidad: UnidadDeLaCarga,
): { readonly elegida: null; readonly porcentaje: string; readonly paso: number; readonly sentido: SentidoDelRedondeo; readonly propia: null } {
  const porcentaje = p.intensity?.criterion === 'PERCENT_RM' && Number.isFinite(p.intensity.target.value) ? numeroCorto(p.intensity.target.value) : '';
  return { elegida: null, porcentaje, paso: PASOS_DEL_REDONDEO[unidad][0]!, sentido: 'ABAJO', propia: null };
}

/**
 * Las estimaciones que ofrece el cuadro de la carga (ED-76), con la regla de la tarjeta (ED-75): por sesión, la del
 * interruptor apagado; la orientativa, solo para una sesión (o una observación) que no tiene otra. Así se puede planificar
 * con el valor que muestra la tarjeta (RM-43: con 70 × 12 RIR 0 y 65 × 8 RIR 2, la del 65 × 8, nunca la de 98 kg).
 */
export function estimacionesParaLaCarga(apagado: readonly PuntoDeFuerza[], encendido: readonly PuntoDeFuerza[]): PuntoDeFuerza[] {
  const conNucleo = new Set(apagado.map(origenDe));
  return delMasReciente([...apagado, ...encendido.filter((p) => !conNucleo.has(origenDe(p)))]);
}

/** «Escribir 72,5 kg en Press de banca»: el principal del cuadro, con lo que escribe. */
export const textoDelPrincipalDeLaCarga = (valor: number, unidad: UnidadDeLaCarga, nombre: string): string => `Escribir ${numeroCorto(valor)} ${unidad} en ${nombre}`;

/**
 * «la serie 2», «las series 2 y 3», «las series 1, 2 y 4»: las elegidas en la planilla (desde 0), contadas desde 1 y en
 * orden.
 */
export function lasSeriesEnPalabras(elegidas: Iterable<number>): string {
  const n = [...new Set(elegidas)].sort((a, b) => a - b).map((x) => String(x + 1));
  if (n.length === 0) return 'ninguna serie';
  if (n.length === 1) return `la serie ${n[0]}`;
  return `las series ${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`;
}

/** «Escribir 72,5 kg en las series 2 y 3 de Press de banca»: el principal del cuadro cuando escribe en las elegidas. */
export const textoDelPrincipalEnLasSeries = (valor: number, unidad: UnidadDeLaCarga, elegidas: Iterable<number>, nombre: string): string =>
  `Escribir ${numeroCorto(valor)} ${unidad} en ${lasSeriesEnPalabras(elegidas)} de ${nombre}`;

/**
 * Lo que deja «Escribir 72,5 kg en las series 2 y 3» (ED-76, desde las series elegidas; EDT-56): la carga sugerida propia
 * de cada elegida, en la unidad de la prescripción, y nada más. Las demás series, la fila general, el % RM y su referencia
 * no cambian: el % RM es de toda la prescripción, y escribirlo cambiaría también lo que toman las otras series.
 */
export function loQueSeEscribeEnLasSeries<S extends { readonly suggestedLoad?: { readonly value: number; readonly unit: UnidadDeLaCarga } | null }>(
  sets: readonly S[],
  elegidas: Iterable<number>,
  carga: { readonly value: number; readonly unit: UnidadDeLaCarga },
): { sets: S[] } {
  const cuales = new Set(elegidas);
  return { sets: sets.map((s, n) => (cuales.has(n) ? { ...s, suggestedLoad: { value: carga.value, unit: carga.unit } } : s)) };
}

/**
 * EDT-56, con el criterio % RM: las elegidas toman el % RM y la referencia de toda la prescripción, que no cambian. Para que
 * su carga tenga de dónde salir, la estimación elegida tiene que ser la de esa referencia. `'sin-referencia'`: la
 * prescripción no tiene una; `'otra-referencia'`: la elegida es otra. En los dos casos no se escribe desde las elegidas: se
 * calcula desde la fila general, que escribe el % RM y la referencia. Con otro criterio no hay referencia que cuidar: `null`.
 */
export function procedenciaEnLasSeries(p: PrescripcionParaLaCarga, fechaDeLaElegida: string): 'sin-referencia' | 'otra-referencia' | null {
  if (p.intensity?.criterion !== 'PERCENT_RM') return null;
  const ref = p.intensity.target.reference?.description?.trim();
  if (!ref) return 'sin-referencia';
  return ref === referenciaDeLaEstimacion(fechaDeLaElegida) ? null : 'otra-referencia';
}

/** Las elegidas que todavía existen: si se quitó una serie con el cuadro abierto, no se escribe en una que no está. */
export const lasElegidasQueQuedan = (elegidas: Iterable<number>, cuantas: number): number[] =>
  [...new Set(elegidas)].filter((n) => Number.isInteger(n) && n >= 0 && n < cuantas).sort((a, b) => a - b);

/** «Y 2 más, del 27 y del 23 de noviembre»: lo que no entra en la lista corta del cuadro de la carga. */
export function lasQueQuedan(resto: readonly PuntoDeFuerza[]): string | null {
  if (resto.length === 0) return null;
  return resto.length === 1 ? `Y 1 más, del ${diaDelPunto(resto[0]!)}.` : `Y ${resto.length} más, la más antigua del ${diaDelPunto(resto[resto.length - 1]!)}.`;
}

// ─── ED-74 · la evolución en «Analizar» ──────────────────────────────────────────────────────────────────────────

/**
 * Con el interruptor apagado, las sesiones que solo tienen series de más de 10 a 12: entran, así que no están entre las
 * que no entraron, pero no dan punto. Son sesiones del ejercicio sin estimación (un hueco, ED-74) y tienen su fila. Salen
 * de comparar con la lectura encendida, que ya está leída. Encendido, no hay ninguna.
 */
export function sesionesSoloOrientativas(apagado: readonly PuntoDeFuerza[], encendido: readonly PuntoDeFuerza[]): PuntoDeFuerza[] {
  const conPunto = new Set(apagado.map(origenDe));
  return encendido.filter((p) => p.origin.type === 'TRAINING_EXECUTION' && !conPunto.has(origenDe(p)));
}

/**
 * Los tramos de la línea: dos puntos seguidos se unen solo si entre ellos no hubo una sesión sin estimación («sin línea a
 * través de un hueco», ED-74), también una que solo tuvo orientativas con el interruptor apagado. Devuelve los pares por
 * su posición en `puntos`, que va del más antiguo al más reciente.
 */
export function tramosDeLaLinea(puntos: readonly PuntoDeFuerza[], noEntraron: readonly SerieQueNoEntro[], soloOrientativas: readonly PuntoDeFuerza[] = []): readonly (readonly [number, number])[] {
  const conPunto = new Set(puntos.flatMap((p) => (p.origin.type === 'TRAINING_EXECUTION' ? [p.origin.id] : [])));
  const huecos = [...new Set([...noEntraron.filter((s) => !conPunto.has(s.executionId)).map((s) => s.date), ...soloOrientativas.map((p) => p.date)])];
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

/** El motivo de una sesión que solo tuvo orientativas, con el interruptor apagado. */
export const SOLO_ORIENTATIVAS = 'solo series de más de 10 a 12 repeticiones equivalentes: encendé «Incluir las de más de 10 a 12» para verla';

/**
 * La tabla de origen (ED-74), del más reciente al más antiguo: los puntos y las sesiones que quedaron sin punto, también
 * las que solo tuvieron orientativas con el interruptor apagado (`soloOrientativas`).
 */
export function filasDeLaEvolucion(puntos: readonly PuntoDeFuerza[], noEntraron: readonly SerieQueNoEntro[], soloOrientativas: readonly PuntoDeFuerza[] = []): FilaDeLaEvolucion[] {
  const conPunto = new Set(puntos.flatMap((p) => (p.origin.type === 'TRAINING_EXECUTION' ? [p.origin.id] : [])));
  const sinPunto = new Map<string, { fecha: string; motivo: string }>();
  const porSesion = new Map<string, SerieQueNoEntro[]>();
  for (const s of noEntraron) if (!conPunto.has(s.executionId)) porSesion.set(s.executionId, [...(porSesion.get(s.executionId) ?? []), s]);
  for (const [executionId, series] of porSesion) sinPunto.set(executionId, { fecha: series[0]!.date, motivo: motivoDeLaSesion(series) });
  // Una sesión con orientativas tiene series que entran: su motivo es ese, aunque otras no hayan entrado.
  for (const p of soloOrientativas) sinPunto.set(p.origin.id, { fecha: p.date, motivo: SOLO_ORIENTATIVAS });
  const filas: FilaDeLaEvolucion[] = [
    ...puntos.map((p) => ({ tipo: 'punto' as const, fecha: p.date, punto: p })),
    ...[...sinPunto.entries()].map(([executionId, s]) => ({ tipo: 'sin-estimacion' as const, fecha: s.fecha, executionId, motivo: s.motivo })),
  ];
  return filas.sort((a, b) => (a.fecha === b.fecha ? 0 : a.fecha < b.fecha ? 1 : -1));
}

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** «vie 4 dic»: el día de la semana y la fecha civil, sin pasar por una zona (RM-15). */
export function diaConSemana(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return `${DIAS_CORTOS[new Date(Date.UTC(a!, m! - 1, d!, 12)).getUTCDay()]} ${diaDeLaEstimacion(fecha)}`;
}

/**
 * «Lo que no entra», una línea por sesión y del más reciente al más antiguo (ED-74; maqueta 15): «vie 4 dic: ninguna
 * serie entra: …», «mar 1 dic: la serie 2 no entra: el RIR es mayor que 2». `cuantas` corta la lista; `quedan` dice
 * cuántas sesiones más hay en la tabla.
 */
export function loQueNoEntraPorFecha(
  puntos: readonly PuntoDeFuerza[],
  noEntraron: readonly SerieQueNoEntro[],
  soloOrientativas: readonly PuntoDeFuerza[] = [],
  cuantas = 6,
): { readonly lineas: readonly string[]; readonly quedan: number } {
  const conPunto = new Set(puntos.flatMap((p) => (p.origin.type === 'TRAINING_EXECUTION' ? [p.origin.id] : [])));
  const sesiones = new Map<string, { fecha: string; texto: string }>();
  const porSesion = new Map<string, SerieQueNoEntro[]>();
  for (const s of noEntraron) porSesion.set(s.executionId, [...(porSesion.get(s.executionId) ?? []), s]);
  for (const [id, series] of porSesion) {
    if (!conPunto.has(id)) {
      sesiones.set(id, { fecha: series[0]!.date, texto: motivoDeLaSesion(series) });
      continue;
    }
    const motivos = [...new Set(series.map((s) => COPY_FUERZA.motivo[s.reason]))].join('; ');
    const cuales = series.length === 1 ? `la serie ${series[0]!.setIndex} no entra` : `${series.length} series no entran`;
    sesiones.set(id, { fecha: series[0]!.date, texto: `${cuales}: ${motivos}` });
  }
  for (const p of soloOrientativas) sesiones.set(p.origin.id, { fecha: p.date, texto: SOLO_ORIENTATIVAS });
  const todas = [...sesiones.values()].sort((a, b) => (a.fecha === b.fecha ? 0 : a.fecha < b.fecha ? 1 : -1));
  return { lineas: todas.slice(0, cuantas).map((s) => `${diaConSemana(s.fecha)}: ${s.texto}`), quedan: Math.max(todas.length - cuantas, 0) };
}

/** Una vigencia del plan de entrenamiento, como la trae la clave (`planVersions`). */
export interface VersionDelPlanEnElPeriodo {
  readonly domain: string;
  readonly label: string;
  readonly from: string;
  readonly to: string | null;
}

/** «versión 10»: la versión del plan que regía ese día (el día del corte ya rige la siguiente); `null` si ninguna. */
export function versionDelPlanEn(fecha: string, versiones: readonly VersionDelPlanEnElPeriodo[]): string | null {
  const v = versiones.filter((x) => x.domain === 'TRAINING' && x.from <= fecha && (x.to === null || fecha < x.to)).sort((a, b) => (a.from < b.from ? 1 : -1))[0];
  return v ? v.label.replace(/^v/, 'versión ') : null;
}

/**
 * Las fechas del eje horizontal (ED-74; maqueta 15): de 4 a 6, repartidas en el período, la primera y la última
 * incluidas. Fechas civiles, sin pasar por una zona.
 */
export function fechasDelEje(desde: string, hasta: string, cuantas = 5): string[] {
  const t0 = Date.parse(`${desde}T12:00:00Z`);
  const t1 = Date.parse(`${hasta}T12:00:00Z`);
  const dias = Math.round((t1 - t0) / 86_400_000);
  if (!(dias > 0)) return [desde];
  const n = Math.max(2, Math.min(cuantas, dias + 1));
  const fechas = Array.from({ length: n }, (_, i) => new Date(t0 + Math.round((dias * i) / (n - 1)) * 86_400_000).toISOString().slice(0, 10));
  return [...new Set(fechas)];
}

/** El motivo más frecuente de una sesión sin punto, en palabras: «ninguna serie entra: el RIR es mayor que 2». */
function motivoDeLaSesion(series: readonly SerieQueNoEntro[]): string {
  const cuenta = new Map<MotivoFueraDeLaEstimacion, number>();
  for (const s of series) cuenta.set(s.reason, (cuenta.get(s.reason) ?? 0) + 1);
  const [motivo] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]!;
  return `ninguna serie entra: ${COPY_FUERZA.motivo[motivo]}`;
}
