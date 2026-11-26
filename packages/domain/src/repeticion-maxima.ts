/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-01 a ET2-04) · el 1RM de referencia de una persona en un ejercicio, con
 * el que BE calcula las cargas en % RM. Sin React, sin base y sin red: la API lee lo guardado y los registros, y el editor
 * del website muestra lo que sale de acá.
 *
 * - **Tres orígenes, siempre a la vista** (Dirección, 2026-11-25):
 *   - **Calibración** (el día cero): el profesional anota carga, repeticiones y RIR de una serie que vio («30 kg × 8 a RIR
 *     1») y BE calcula con Epley: 30 × (1 + (8 + 1) / 30) = 39 kg, «calculado en la calibración del 25 nov»;
 *   - **Registro:** la última serie de la persona en rango (de 8 a 12 repeticiones, a RIR 0 a 2) en ese ejercicio, en
 *     cualquier ejercicio con carga externa (`BE-E1RM` v2, `EPLEY_V2`: amplía la lista cerrada de seis de la v1). Fuera de
 *     la barra, «orientativo»;
 *   - **Declarado:** el valor escrito a mano.
 * - **BE usa el más reciente** (`vigenteDelUnoRM`). Si un registro nuevo se aleja más del 10 % del valor guardado (la
 *   calibración o lo declarado), BE **avisa y no cambia nada solo**: sigue con lo guardado hasta que el profesional elija
 *   «Usar el registro» (ET2-D03).
 * - **En % RM**, la carga de cada serie sale de ese 1RM, redondeada al paso del implemento, con la base a la vista: «70 %
 *   de 39 kg = 27 kg».
 * - **No es un máximo probado ni una marca** (DL-171, RPE-D06): es la referencia de las cargas. La v1 de «Fuerza estimada»
 *   no cambia (ET2-D01).
 */
import type { EjecucionDeEntrenamiento } from './contratos-entrenamiento';
import { registroVigente } from './copy-entrenamiento';
import { numero } from './formato-numeros';
import { registradasEfectivas } from './tipos-de-serie';
import { diaDeLaEstimacion, epley, valorDeEpleyALaVista, type ProcedenciaDelValor, type UnidadDeLaCarga } from './estimacion-de-fuerza';
import { implementoDelEjercicio, pasoPorOmision, redondearAlPaso, type Implemento } from './planificacion-del-plan';

/** La identidad del método del 1RM de referencia: la v2 de `BE-E1RM` (la v1 sigue siendo la de «Fuerza estimada»). */
export const ESPECIFICACION_DEL_UNO_RM = { especificacion: 'BE-E1RM', version: 2, metodo: 'EPLEY_V2' } as const;

/** ET2-D04: el rango del registro (Dirección, 2026-11-25): de 8 a 12 repeticiones, a RIR 0 a 2. */
export const RANGO_DEL_REGISTRO = { repeticionesMinimas: 8, repeticionesMaximas: 12, rirMaximo: 2 } as const;
/** ET2-D05: la calibración admite de 1 a 12 repeticiones a RIR 0 a 2 (la ventana confiable del método, DL-171 R3). */
export const RANGO_DE_LA_CALIBRACION = { repeticionesMinimas: 1, repeticionesMaximas: 12, rirMaximo: 2 } as const;
/** ET2-D03: desde cuánto se avisa que un registro se aleja de lo guardado (en % del valor guardado). */
export const UMBRAL_DEL_AVISO = 10;
/**
 * Lo que la base acepta como 1RM (`uno_rm_de_referencia_valor`: más de 0 y hasta 1000, en kg o en lb). Una serie cuya
 * cuenta queda afuera (una carga de décimas que redondea a 0, o 900 kg × 12) no calibra ni es el registro: sin esto, la
 * API respondía un 500 por la restricción de la base en lugar del 422 con su motivo.
 */
export const ESCALA_DEL_UNO_RM = { minimoExclusivo: 0, maximo: 1000 } as const;
const enEscala = (valor: number): boolean => Number.isFinite(valor) && valor > ESCALA_DEL_UNO_RM.minimoExclusivo && valor <= ESCALA_DEL_UNO_RM.maximo;

export type OrigenDelUnoRM = 'CALIBRATION' | 'RECORD' | 'DECLARED';
/** `CORE`: con barra; `ORIENTATIVE`: fuera de la barra (Dirección: «fuera de la barra se marca orientativo»). */
export type BandaDelUnoRM = 'CORE' | 'ORIENTATIVE';

export interface CargaDelUnoRM {
  readonly value: number;
  readonly unit: UnidadDeLaCarga;
}

/** La serie de la que sale una calibración o un registro. */
export interface SerieDelUnoRM {
  readonly carga: CargaDelUnoRM;
  readonly repeticiones: number;
  readonly rir: number;
}

/** Un valor guardado (la calibración o lo declarado, o un registro que el profesional eligió usar). */
export interface UnoRMGuardado {
  readonly entryId: string;
  readonly origen: OrigenDelUnoRM;
  readonly valor: CargaDelUnoRM;
  /** La fecha civil de la calibración, de lo declarado o del registro: AAAA-MM-DD. */
  readonly fecha: string;
  /** El instante de la fila, para desempatar dos del mismo día. */
  readonly registradoEn: string;
  readonly serie: SerieDelUnoRM | null;
  readonly banda: BandaDelUnoRM | null;
}

/** El último registro de la persona en rango, calculado al leer (no se guarda hasta que se elige usarlo). */
export interface UnoRMDelRegistro {
  readonly valor: CargaDelUnoRM;
  readonly fecha: string;
  readonly serie: SerieDelUnoRM;
  readonly banda: BandaDelUnoRM;
  readonly executionId: string;
  readonly prescriptionId: string;
  readonly setIndex: number;
}

/** El 1RM que usa BE: de dónde sale, cuánto es y de qué fecha. */
export interface UnoRMVigente {
  readonly origen: OrigenDelUnoRM;
  readonly valor: CargaDelUnoRM;
  readonly fecha: string;
  readonly banda: BandaDelUnoRM | null;
  readonly serie: SerieDelUnoRM | null;
  /** La fila guardada, o `null` si es un registro calculado al leer. */
  readonly entryId: string | null;
}

/** ET2-D03: un registro más nuevo que lo guardado y que se aleja más del umbral. BE no cambia nada solo. */
export interface AvisoDelUnoRM {
  readonly registro: UnoRMDelRegistro;
  readonly guardado: UnoRMGuardado;
  /** Cuánto se aleja, en % del valor guardado, con su signo (+15: el registro da más). Entero. */
  readonly diferencia: number;
}

// ─── La cuenta ──────────────────────────────────────────────────────────────────────────────

/** Por qué una serie no sirve para calibrar o para el registro. */
export type MotivoFueraDelUnoRM = 'SIN_CARGA' | 'REPETICIONES_FUERA' | 'SIN_RIR' | 'RIR_MAYOR_QUE_2' | 'FUERA_DE_ESCALA';

/** El 1RM de una serie con Epley, redondeado al medio kilo (o a la libra): 30 × (1 + (8 + 1) / 30) = 39. */
export function unoRMDeLaSerie(s: SerieDelUnoRM): number {
  return valorDeEpleyALaVista({ carga: s.carga.value, repeticiones: s.repeticiones, rir: s.rir, unidad: s.carga.unit });
}

const fueraDelRango = (s: SerieDelUnoRM, rango: { readonly repeticionesMinimas: number; readonly repeticionesMaximas: number; readonly rirMaximo: number }): MotivoFueraDelUnoRM | null => {
  if (!(s.carga.value > 0) || !Number.isFinite(s.carga.value)) return 'SIN_CARGA';
  if (!Number.isInteger(s.repeticiones) || s.repeticiones < rango.repeticionesMinimas || s.repeticiones > rango.repeticionesMaximas) return 'REPETICIONES_FUERA';
  if (!Number.isFinite(s.rir) || s.rir < 0) return 'SIN_RIR';
  if (s.rir > rango.rirMaximo) return 'RIR_MAYOR_QUE_2';
  return null;
};

/** La calibración: el 1RM de la serie, o por qué no se puede calibrar con ella. */
export function calibrar(s: SerieDelUnoRM): { readonly ok: true; readonly valor: CargaDelUnoRM } | { readonly ok: false; readonly motivo: MotivoFueraDelUnoRM } {
  const motivo = fueraDelRango(s, RANGO_DE_LA_CALIBRACION);
  if (motivo) return { ok: false, motivo };
  const valor = unoRMDeLaSerie(s);
  return enEscala(valor) ? { ok: true, valor: { value: valor, unit: s.carga.unit } } : { ok: false, motivo: 'FUERA_DE_ESCALA' };
}

/**
 * La serie de un registro de la persona, como la mira la v2: la escribió ella en la app (cada valor con procedencia
 * `PERSON`, ED-70), no la tildó con lo del plan, es efectiva, del ejercicio prescripto y en rango. Con carga externa: una
 * carga mayor que 0 (el peso corporal sin lastre no tiene).
 */
export interface SerieRegistradaParaElUnoRM {
  readonly load: CargaDelUnoRM | null;
  readonly completedRepetitions: number | null;
  readonly rir: number | null;
  readonly recordedAs?: 'TYPED' | 'AS_PLANNED';
  readonly fieldOrigins?: Readonly<Partial<Record<'load' | 'completedRepetitions' | 'rir', ProcedenciaDelValor>>>;
  readonly sustituido?: boolean;
}

/** Si la serie entra en el registro de la v2. */
export function entraEnElRegistro(s: SerieRegistradaParaElUnoRM): s is SerieRegistradaParaElUnoRM & { load: CargaDelUnoRM; completedRepetitions: number; rir: number } {
  if (s.sustituido || s.recordedAs === 'AS_PLANNED') return false;
  if (!s.load || s.completedRepetitions === null || s.rir === null) return false;
  const o = s.fieldOrigins;
  if (!o || o.load !== 'PERSON' || o.completedRepetitions !== 'PERSON' || o.rir !== 'PERSON') return false;
  const serie = { carga: s.load, repeticiones: s.completedRepetitions, rir: s.rir };
  return fueraDelRango(serie, RANGO_DEL_REGISTRO) === null && enEscala(unoRMDeLaSerie(serie));
}

/** Una sesión registrada de un ejercicio, con sus series en orden. */
export interface SesionParaElUnoRM {
  readonly executionId: string;
  readonly fecha: string;
  readonly prescriptionId: string;
  readonly series: readonly (SerieRegistradaParaElUnoRM & { readonly setIndex: number })[];
}

/**
 * El último registro en rango: la sesión más reciente con alguna serie que entra y, en ella, la de mayor carga (a igual
 * carga, la primera), como la regla por sesión de la v1 (RM-34). Nunca la mayor estimación, que sube sola con más series.
 */
export function ultimoRegistroEnRango(sesiones: readonly SesionParaElUnoRM[], unidad: UnidadDeLaCarga | null, conBarra: boolean): UnoRMDelRegistro | null {
  const ordenadas = [...sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.executionId.localeCompare(a.executionId));
  for (const sesion of ordenadas) {
    let elegida: (SerieRegistradaParaElUnoRM & { setIndex: number; load: CargaDelUnoRM; completedRepetitions: number; rir: number }) | null = null;
    for (const s of sesion.series) {
      if (!entraEnElRegistro(s) || (unidad && s.load.unit !== unidad)) continue;
      if (!elegida || s.load.value > elegida.load.value) elegida = s;
    }
    if (!elegida) continue;
    const serie = { carga: elegida.load, repeticiones: elegida.completedRepetitions, rir: elegida.rir };
    return {
      valor: { value: unoRMDeLaSerie(serie), unit: elegida.load.unit },
      fecha: sesion.fecha,
      serie,
      banda: conBarra ? 'CORE' : 'ORIENTATIVE',
      executionId: sesion.executionId,
      prescriptionId: sesion.prescriptionId,
      setIndex: elegida.setIndex,
    };
  }
  return null;
}

/** «Con barra» para la banda: lo dice la clasificación; sin ella, el nombre (como el paso del redondeo, EE-D03). */
export function esConBarra(equipamiento: readonly string[] | null | undefined, nombre: string): boolean {
  if (equipamiento && equipamiento.length > 0) return equipamiento.includes('BARBELL');
  return implementoDelEjercicio(nombre) === 'BARRA';
}

// ─── El que usa BE ──────────────────────────────────────────────────────────────────────────

const masReciente = (a: UnoRMGuardado, b: UnoRMGuardado): number => b.fecha.localeCompare(a.fecha) || b.registradoEn.localeCompare(a.registradoEn) || b.entryId.localeCompare(a.entryId);

/** Lo guardado, del más reciente al más viejo (por fecha y, el mismo día, por el instante de la fila). */
export const guardadosEnOrden = (g: readonly UnoRMGuardado[]): UnoRMGuardado[] => [...g].sort(masReciente);

const delGuardado = (g: UnoRMGuardado): UnoRMVigente => ({ origen: g.origen, valor: g.valor, fecha: g.fecha, banda: g.banda, serie: g.serie, entryId: g.entryId });
const delRegistro = (r: UnoRMDelRegistro): UnoRMVigente => ({ origen: 'RECORD', valor: r.valor, fecha: r.fecha, banda: r.banda, serie: r.serie, entryId: null });

/**
 * El 1RM que usa BE (ET2-D03): el más reciente entre lo guardado y el último registro en rango. Si el registro es más
 * nuevo y se aleja más del 10 % de lo guardado, BE sigue con lo guardado y avisa: nada cambia solo. A igual fecha, lo
 * guardado (un registro elegido es esa misma serie). Entre kg y lb no se compara ni se convierte.
 */
export function vigenteDelUnoRM(guardados: readonly UnoRMGuardado[], registro: UnoRMDelRegistro | null): { readonly vigente: UnoRMVigente | null; readonly aviso: AvisoDelUnoRM | null } {
  const ultimo = guardadosEnOrden(guardados)[0] ?? null;
  if (!ultimo) return { vigente: registro ? delRegistro(registro) : null, aviso: null };
  if (!registro || registro.fecha <= ultimo.fecha) return { vigente: delGuardado(ultimo), aviso: null };
  if (registro.valor.unit !== ultimo.valor.unit) return { vigente: delGuardado(ultimo), aviso: null };
  // Redondeo simétrico: −10,5 % es «11 % menos», como +10,5 % es «11 % más» (`Math.round` lleva −10,5 a −10).
  const cruda = ((registro.valor.value - ultimo.valor.value) / ultimo.valor.value) * 100;
  const diferencia = Math.sign(cruda) * Math.round(Math.abs(cruda));
  if (Math.abs(registro.valor.value - ultimo.valor.value) * 100 > UMBRAL_DEL_AVISO * ultimo.valor.value) {
    return { vigente: delGuardado(ultimo), aviso: { registro, guardado: ultimo, diferencia } };
  }
  return { vigente: delRegistro(registro), aviso: null };
}

// ─── El % RM ────────────────────────────────────────────────────────────────────────────────

/**
 * La carga de una serie en % RM: el porcentaje del 1RM, redondeada al paso del implemento (EE-D03, ET1-D06). Nunca 0: con
 * una carga muy chica queda en un paso. `paso` ausente: el del implemento para esa carga.
 */
export function cargaDelPorcentaje(porcentaje: number, unoRM: CargaDelUnoRM, implemento: Implemento, paso?: number): CargaDelUnoRM {
  const cruda = (unoRM.value * porcentaje) / 100;
  const p = paso ?? pasoPorOmision(implemento, cruda, unoRM.unit);
  return { value: Math.max(p, redondearAlPaso(cruda, p)), unit: unoRM.unit };
}

/** La carga de una serie en % RM con el nombre del ejercicio (para deducir el implemento) y su base de carga. */
export const cargaDelPorcentajeDe = (porcentaje: number, unoRM: CargaDelUnoRM, nombre: string, baseDeCarga?: string | null, paso?: number): CargaDelUnoRM =>
  cargaDelPorcentaje(porcentaje, unoRM, implementoDelEjercicio(nombre, baseDeCarga), paso);

// ─── En palabras ────────────────────────────────────────────────────────────────────────────

const enKilos = (c: CargaDelUnoRM): string => `${numero(c.value, 2)} ${c.unit}`;

/** «30 × (1 + (8 + 1) / 30) = 39 kg»: la cuenta de Epley con los números de la serie. */
export function cuentaDelUnoRM(s: SerieDelUnoRM): string {
  const n = s.repeticiones + s.rir;
  if (n === 1) return `con una sola repetición, el 1RM es la carga: ${enKilos(s.carga)}`;
  return `${numero(s.carga.value, 2)} × (1 + (${numero(s.repeticiones)} + ${numero(s.rir)}) / 30) = ${enKilos({ value: unoRMDeLaSerie(s), unit: s.carga.unit })}`;
}

/** «70 % de 39 kg = 27 kg»: la base del % RM, siempre a la vista. */
export function baseDelPorcentaje(porcentaje: number, unoRM: CargaDelUnoRM, carga: CargaDelUnoRM): string {
  return `${numero(porcentaje, 1)} % de ${enKilos(unoRM)} = ${enKilos(carga)}`;
}

/** El origen, en una frase corta: «calculado en la calibración del 25 nov», «del registro del 2 dic», «declarado el 25 nov». */
export function origenDelUnoRM(origen: OrigenDelUnoRM, fecha: string, banda: BandaDelUnoRM | null): string {
  const dia = diaDeLaEstimacion(fecha);
  if (origen === 'CALIBRATION') return `calculado en la calibración del ${dia}`;
  if (origen === 'DECLARED') return `declarado el ${dia}`;
  return `calculado con el registro del ${dia}${banda === 'ORIENTATIVE' ? ' · orientativo' : ''}`;
}

/** «1RM 39 kg · calculado en la calibración del 25 nov». */
export const unoRMEnUnRenglon = (v: UnoRMVigente): string => `${COPY_UNO_RM.sigla} ${enKilos(v.valor)} · ${origenDelUnoRM(v.origen, v.fecha, v.banda)}`;

/** El aviso de ET2-D03, en palabras: «El registro del 2 dic da 45 kg, 15 % más que la calibración del 25 nov (39 kg)». */
export function avisoEnPalabras(a: AvisoDelUnoRM): string {
  const cuanto = `${Math.abs(a.diferencia)} % ${a.diferencia >= 0 ? 'más' : 'menos'} que ${a.guardado.origen === 'CALIBRATION' ? 'la calibración' : a.guardado.origen === 'DECLARED' ? 'lo declarado' : 'el registro elegido'} del ${diaDeLaEstimacion(a.guardado.fecha)} (${enKilos(a.guardado.valor)})`;
  return `El registro del ${diaDeLaEstimacion(a.registro.fecha)} da ${enKilos(a.registro.valor)}, ${cuanto}. BE sigue usando el valor guardado hasta que elijas.`;
}

export const COPY_UNO_RM = {
  sigla: '1RM',
  titulo: '1RM de referencia',
  sinValor: 'Sin 1RM todavía',
  queEs: 'La carga para una repetición con la que BE calcula las cargas en % RM. No es un máximo probado: sale de una serie.',
  origenes: { CALIBRATION: 'Calibración', RECORD: 'Último registro', DECLARED: 'Declarado' } as Readonly<Record<OrigenDelUnoRM, string>>,
  calibrar: 'Calibrar',
  declarar: 'Escribirlo',
  usarElRegistro: 'Usar el registro',
  seguirConElGuardado: 'Seguir con el guardado',
  guardar: 'Guardar el 1RM',
  ponerLasCargas: 'Poner las cargas desde el 1RM',
  recalcular: 'Recalcular con el 1RM',
  noCoinciden: (unoRM: string) => `Las cargas no coinciden con el 1RM de ${unoRM}.`,
  otraUnidad: 'El 1RM está en otra unidad que el ejercicio: BE no convierte.',
  calibracionExplicada:
    'Anotá una serie que viste: la carga, las repeticiones y el RIR. BE calcula el 1RM con Epley: carga × (1 + (repeticiones + RIR) / 30).',
  calibracionEjemplo: 'Ejemplo: 30 kg × 8 a RIR 1 → 30 × (1 + (8 + 1) / 30) = 39 kg.',
  reglaDeLaCalibracion: 'De 1 a 12 repeticiones, a RIR 0 a 2: más lejos del fallo, el RIR es menos confiable.',
  reglaDelRegistro: 'El registro: la última serie de la persona en este ejercicio de 8 a 12 repeticiones a RIR 0 a 2, escrita por ella en la app.',
  orientativo: 'Fuera de la barra, el valor es orientativo: la técnica y el implemento pesan más en la cuenta.',
  masReciente: 'BE usa el más reciente de los tres. Si un registro nuevo se aleja más del 10 % del valor guardado, avisa y no cambia nada solo.',
  motivo: {
    SIN_CARGA: 'Falta la carga.',
    REPETICIONES_FUERA: 'Van de 1 a 12 repeticiones.',
    SIN_RIR: 'Falta el RIR.',
    RIR_MAYOR_QUE_2: 'Con RIR mayor que 2 no se calibra.',
    FUERA_DE_ESCALA: 'Con esta serie, la cuenta da un 1RM de 0 o de más de 1000: revisá la carga.',
  } as Readonly<Record<MotivoFueraDelUnoRM, string>>,
  historial: 'Valores anteriores',
  ejemploDelPorcentaje: 'Ejemplo: con un 1RM de 39 kg, 70 % RM son 27,3 kg, que se redondean a 27 kg (de a 1 kg).',
} as const;

/** El 1RM de referencia con Epley exacto, sin redondear (para pruebas y para «Cómo se calculó»). */
export const unoRMExacto = (s: SerieDelUnoRM): number => epley(s.carga.value, s.repeticiones + s.rir);

// ─── Desde las sesiones registradas ─────────────────────────────────────────────────────────

/**
 * Las sesiones registradas de cada ejercicio, como las mira el registro de la v2: el registro vigente de cada sesión (la
 * corrección vigente o el original), solo las series efectivas y por series; una sesión no realizada, resumida o que no
 * se resuelve no aporta. Por `exerciseId` (el ejercicio prescripto: una sustitución no cuenta para ninguno).
 */
export function sesionesDeLosRegistros(ejecuciones: readonly EjecucionDeEntrenamiento[]): Map<string, SesionParaElUnoRM[]> {
  const r = new Map<string, SesionParaElUnoRM[]>();
  for (const x of ejecuciones) {
    if (x.effectiveView.kind === 'NOT_RESOLVABLE') continue;
    const vigente = registroVigente(x);
    if (vigente.sessionCondition === 'NOT_COMPLETED' || vigente.granularity !== 'SET') continue;
    for (const e of vigente.exercises) {
      const prescripcion = x.plannedSession.prescriptions.find((p) => p.prescriptionId === e.prescriptionId);
      if (!prescripcion || !e.sets || e.sets.length === 0) continue;
      const series = registradasEfectivas(e.sets, prescripcion.sets).map((s) => ({
        setIndex: s.setIndex,
        load: s.load,
        completedRepetitions: s.completedRepetitions,
        rir: s.rir,
        ...(s.recordedAs ? { recordedAs: s.recordedAs } : {}),
        ...(s.fieldOrigins ? { fieldOrigins: s.fieldOrigins } : {}),
        sustituido: e.substituted,
      }));
      const lista = r.get(prescripcion.exerciseId) ?? [];
      lista.push({ executionId: x.executionId, fecha: x.date, prescriptionId: e.prescriptionId, series });
      r.set(prescripcion.exerciseId, lista);
    }
  }
  return r;
}
