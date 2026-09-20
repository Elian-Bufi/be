/**
 * B-10 — Antropometría (06 §13) y el parche §20 (ANT-DRAFT, ANT-VOID). Reglas puras que comparten la API, el
 * website y el APK:
 * - máquina de la Evaluación: `EN_PREPARACION → REGISTRADA`, terminal (REG-06-214);
 * - condición efectiva de la Medición: `VIGENTE → ANULADA`, terminal y sin reversión (REG-06-217/218/219);
 * - medición directa separada del cálculo derivado, como tipo y no como convención (REG-06-152; INV-06-05);
 * - unidad de origen siempre visible y conversión explícita, que nunca la oculta (REG-06-154/155; REG-06-09);
 * - derivado reproducible: método, versión, entradas efectivas, precisión y redondeo (REG-06-156/158);
 * - dependencias explícitas, nunca inferidas por nombre ni por posición (REG-06-159; INV-06-170);
 * - serie longitudinal honesta: `SIN_DATO` no es cero, y no se interpola, imputa ni arrastra (REG-06-165/166/167;
 *   INV-06-176/177);
 * - comparabilidad demostrable: lo no comparable se conserva y se marca, no se fuerza (REG-06-162/163/164).
 *
 * Antropometría no adquiere ciclo de plan ni revisión de especialidad (REG-06-151, 06:6221) y una operación aislada
 * no abre Proceso ni ocupa capacidad (06 §8.9, §9.11.2; WP-05 §0 D-D).
 */
import type { TransicionDeMaquina } from './maquina';
import { transicionDe } from './maquina';

// ─── Evaluación antropométrica · ANT-DRAFT (06 §20.5) ───────────────────────────────────────────

/**
 * REG-06-214, literal: «EN_PREPARACION / REGISTRADA». `EN_PREPARACION` puede conservar contenido parcial y no es una
 * Evaluación registrada; solo `REGISTRADA` participa en historial y evolución.
 */
export const EstadoDeEvaluacionAntropometrica = { EN_PREPARACION: 'EN_PREPARACION', REGISTRADA: 'REGISTRADA' } as const;
export type EstadoDeEvaluacionAntropometrica = (typeof EstadoDeEvaluacionAntropometrica)[keyof typeof EstadoDeEvaluacionAntropometrica];

export const ESTADO_DE_EVALUACION_API: Readonly<Record<EstadoDeEvaluacionAntropometrica, 'IN_PREPARATION' | 'REGISTERED'>> = {
  EN_PREPARACION: 'IN_PREPARATION',
  REGISTRADA: 'REGISTERED',
};

export type TransicionDeEvaluacion = 'CrearBorrador' | 'GuardarBorrador' | 'RegistrarEvaluacion';

/**
 * 06:8596-8610. No existe transición que devuelva una `REGISTRADA` a preparación —«Una Evaluación REGISTRADA no
 * vuelve a EN_PREPARACION; cambios posteriores usan corrección/anulación» (inciso 5)— ni un estado `DESCARTADA`,
 * que el 06 declara no incorporado sin comportamiento aprobado (06:8648-8650). Los nombres de evento son derivados,
 * como en WP-03 (DL-033).
 */
export const TRANSICIONES_DE_EVALUACION: readonly TransicionDeMaquina<EstadoDeEvaluacionAntropometrica, TransicionDeEvaluacion, 'PROFESIONAL'>[] = [
  { transicion: 'CrearBorrador', origen: null, destino: 'EN_PREPARACION', actores: ['PROFESIONAL'], evento: 'BorradorDeEvaluacionCreado' },
  { transicion: 'GuardarBorrador', origen: 'EN_PREPARACION', destino: 'EN_PREPARACION', actores: ['PROFESIONAL'], evento: 'BorradorDeEvaluacionGuardado' },
  { transicion: 'RegistrarEvaluacion', origen: 'EN_PREPARACION', destino: 'REGISTRADA', actores: ['PROFESIONAL'], evento: 'EvaluacionAntropometricaRegistrada' },
];

export interface ContextoDeTransicionDeEvaluacion {
  readonly transicion: TransicionDeEvaluacion;
  /** REG-06-214 inciso 4: registrar exige «acto explícito de registro y validaciones aplicables». */
  readonly contenidoRegistrable?: boolean;
}

export type EvaluacionDeTransicionDeEvaluacion =
  | { readonly permitida: true; readonly transicion: TransicionDeMaquina<EstadoDeEvaluacionAntropometrica, TransicionDeEvaluacion, 'PROFESIONAL'> }
  | { readonly permitida: false; readonly motivo: 'TRANSICION_NO_DECLARADA' | 'CONTENIDO_NO_REGISTRABLE' };

export function evaluarTransicionDeEvaluacion(
  estado: EstadoDeEvaluacionAntropometrica | null,
  c: ContextoDeTransicionDeEvaluacion,
): EvaluacionDeTransicionDeEvaluacion {
  const declarada = transicionDe(TRANSICIONES_DE_EVALUACION, c.transicion, estado);
  if (!declarada) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };
  if (c.transicion === 'RegistrarEvaluacion' && !c.contenidoRegistrable) return { permitida: false, motivo: 'CONTENIDO_NO_REGISTRABLE' };
  return { permitida: true, transicion: declarada };
}

// ─── Medición · ANT-VOID (06 §20.6) ─────────────────────────────────────────────────────────────

/**
 * REG-06-217: condición efectiva **local a M-09**, que no es estado global de Corrección ni redefine B-06. «Una
 * Medición sin evento de anulación está VIGENTE» (06:8670).
 */
export const CondicionDeMedicion = { VIGENTE: 'VIGENTE', ANULADA: 'ANULADA' } as const;
export type CondicionDeMedicion = (typeof CondicionDeMedicion)[keyof typeof CondicionDeMedicion];

export const CONDICION_DE_MEDICION_API: Readonly<Record<CondicionDeMedicion, 'EFFECTIVE' | 'ANNULLED'>> = { VIGENTE: 'EFFECTIVE', ANULADA: 'ANNULLED' };

/**
 * Resultado de pedir la anulación de una medición.
 *
 * `YA_ANULADA` no es un error: DV-05 garantiza que «La segunda no produce un segundo efecto ni un error nuevo»
 * (DV-05:1127) y el 05 que «BE no produce un segundo efecto silencioso» (05:10879-10881). La operación responde con
 * la anulación que ya existe, sin emitir un segundo evento ni recalcular de nuevo (WP-05 §0 D-B, opción A;
 * DEUDA_LEGAJO DL-059).
 *
 * `REG-06-218` hace la anulación **terminal**: no existe `ANULADA → VIGENTE`, y «una nueva toma se modela como
 * nueva Medición, no como reactivación de la anulada» (06:8695-8699).
 */
export type EvaluacionDeAnulacion =
  | { readonly procede: true }
  | { readonly procede: false; readonly motivo: 'YA_ANULADA' }
  | { readonly procede: false; readonly motivo: 'SIN_MOTIVO' };

export function evaluarAnulacion(condicion: CondicionDeMedicion, motivo: string): EvaluacionDeAnulacion {
  if (condicion === 'ANULADA') return { procede: false, motivo: 'YA_ANULADA' };
  if (!motivo.trim()) return { procede: false, motivo: 'SIN_MOTIVO' };
  return { procede: true };
}

/**
 * REG-06-219: corregir y anular no se confunden. «Una Medición ANULADA no admite una nueva Corrección destinada a
 * volverla efectiva. Si existe una nueva observación válida, debe registrarse como nueva Medición» (06:8717-8719).
 */
export function admiteCorreccion(condicion: CondicionDeMedicion): boolean {
  return condicion === 'VIGENTE';
}

// ─── Clase y procedencia del dato (REG-06-152; INV-06-167) ──────────────────────────────────────

/**
 * La frontera que el legajo no deja borrar: lo medido por el profesional, lo que informó la persona y lo que
 * calculó BE son cosas distintas y se muestran distintas (04:1090, regla transversal 5; 10-B10-07 «Medido /
 * Reportado / Calculado»).
 */
export const ClaseDeDato = { MEDIDO: 'MEDIDO', REPORTADO: 'REPORTADO', CALCULADO: 'CALCULADO' } as const;
export type ClaseDeDato = (typeof ClaseDeDato)[keyof typeof ClaseDeDato];

export const CLASE_DE_DATO_API: Readonly<Record<ClaseDeDato, 'MEASURED' | 'REPORTED' | 'DERIVED'>> = {
  MEDIDO: 'MEASURED',
  REPORTADO: 'REPORTED',
  CALCULADO: 'DERIVED',
};

/** REG-06-153: el origen se conserva; la importación controlada no exige formato ni proveedor (INV-06-167). */
export const OrigenDeMedicion = { CAPTURA_DIRECTA: 'CAPTURA_DIRECTA', AUTORREPORTE: 'AUTORREPORTE', IMPORTACION_CONTROLADA: 'IMPORTACION_CONTROLADA' } as const;
export type OrigenDeMedicion = (typeof OrigenDeMedicion)[keyof typeof OrigenDeMedicion];

export const CLASE_POR_ORIGEN: Readonly<Record<OrigenDeMedicion, ClaseDeDato>> = {
  CAPTURA_DIRECTA: 'MEDIDO',
  AUTORREPORTE: 'REPORTADO',
  IMPORTACION_CONTROLADA: 'MEDIDO',
};

// ─── Unidades y conversión (REG-06-154/155; REG-06-09) ──────────────────────────────────────────

export interface Magnitud {
  readonly valor: number;
  readonly unidad: string;
}

/** Una conversión declarada por el catálogo: identificable y versionada (REG-06-155). */
export interface ReglaDeConversion {
  readonly id: string;
  readonly version: string;
  readonly desde: string;
  readonly hacia: string;
  readonly factor: number;
}

/**
 * El resultado de convertir **conserva el origen**: «ninguna normalización puede ocultar la unidad original»
 * (REG-06-09, citado por REG-06-155). Por eso no devuelve un número: devuelve el par, con la regla que lo produjo.
 */
export interface MagnitudConvertida {
  readonly origen: Magnitud;
  readonly convertida: Magnitud;
  readonly regla: { readonly id: string; readonly version: string };
}

export type ResultadoDeConversion = { readonly ok: true; readonly valor: MagnitudConvertida } | { readonly ok: false; readonly motivo: 'SIN_REGLA' };

export function convertir(origen: Magnitud, hacia: string, reglas: readonly ReglaDeConversion[]): ResultadoDeConversion {
  if (origen.unidad === hacia) {
    return { ok: true, valor: { origen, convertida: origen, regla: { id: 'IDENTIDAD', version: '1' } } };
  }
  const regla = reglas.find((r) => r.desde === origen.unidad && r.hacia === hacia);
  if (!regla) return { ok: false, motivo: 'SIN_REGLA' };
  return {
    ok: true,
    valor: { origen, convertida: { valor: origen.valor * regla.factor, unidad: hacia }, regla: { id: regla.id, version: regla.version } },
  };
}

// ─── Cálculo derivado (REG-06-156/158/159) ──────────────────────────────────────────────────────

export const ModoDeRedondeo = { MEDIO_ARRIBA: 'MEDIO_ARRIBA', ABAJO: 'ABAJO', ARRIBA: 'ARRIBA' } as const;
export type ModoDeRedondeo = (typeof ModoDeRedondeo)[keyof typeof ModoDeRedondeo];

/** REG-06-158: precisión y redondeo **declarados**, no implícitos en el lenguaje ni en la base. */
export interface PrecisionDeclarada {
  readonly decimales: number;
  readonly modo: ModoDeRedondeo;
}

export function aplicarPrecision(valor: number, p: PrecisionDeclarada): number {
  const f = 10 ** p.decimales;
  const x = valor * f;
  const r = p.modo === 'ABAJO' ? Math.floor(x) : p.modo === 'ARRIBA' ? Math.ceil(x) : Math.sign(x) * Math.round(Math.abs(x));
  return r / f;
}

/**
 * Una entrada efectiva de un cálculo: qué medición se usó, con qué valor y en qué unidad. REG-06-159 exige que la
 * dependencia sea **explícita**: se guarda el identificador de la medición, nunca se infiere por nombre de campo ni
 * por posición (INV-06-170).
 */
export interface EntradaDeCalculo {
  readonly medicionId: string;
  readonly metrica: string;
  readonly magnitud: Magnitud;
}

export interface EjecucionDeCalculo {
  readonly ejecucionId: string;
  readonly metodoId: string;
  readonly metodoVersion: string;
  readonly entradas: readonly EntradaDeCalculo[];
  readonly precision: PrecisionDeclarada;
  /** La corrida a la que esta reemplaza, si nació de un recálculo (REG-06-161): se relaciona, no se sobrescribe. */
  readonly reemplazaA: string | null;
}

/**
 * REG-06-159 e INV-06-170: qué ejecuciones dependen de estas mediciones. Se resuelve **solo** por el identificador
 * declarado en las entradas.
 */
export function dependientesDe(medicionIds: readonly string[], ejecuciones: readonly EjecucionDeCalculo[]): readonly EjecucionDeCalculo[] {
  const buscadas = new Set(medicionIds);
  return ejecuciones.filter((e) => e.entradas.some((i) => buscadas.has(i.medicionId)));
}

/**
 * REG-06-220, incisos 4 y 5: cuando cambia o se anula una entrada, si quedan entradas válidas suficientes se emite
 * una corrida nueva relacionada con la anterior; **si faltan entradas obligatorias, no se inventa un sucesor** y la
 * ausencia se representa como ausencia, nunca como cero (inciso 6).
 */
export type ConsecuenciaDeRecalculo =
  | { readonly tipo: 'RECALCULAR'; readonly ejecucion: EjecucionDeCalculo; readonly entradasVigentes: readonly EntradaDeCalculo[] }
  | { readonly tipo: 'SIN_SUCESOR'; readonly ejecucion: EjecucionDeCalculo; readonly faltantes: readonly string[] };

export function consecuenciasDeRecalculo(
  ejecuciones: readonly EjecucionDeCalculo[],
  medicionesNoVigentes: readonly string[],
  reemplazos: Readonly<Record<string, EntradaDeCalculo>> = {},
): readonly ConsecuenciaDeRecalculo[] {
  const caidas = new Set(medicionesNoVigentes);
  return dependientesDe(medicionesNoVigentes, ejecuciones).map((ejecucion) => {
    const entradasVigentes: EntradaDeCalculo[] = [];
    const faltantes: string[] = [];
    for (const entrada of ejecucion.entradas) {
      if (!caidas.has(entrada.medicionId)) {
        entradasVigentes.push(entrada);
        continue;
      }
      const reemplazo = reemplazos[entrada.medicionId];
      if (reemplazo) entradasVigentes.push(reemplazo);
      else faltantes.push(entrada.metrica);
    }
    return faltantes.length > 0 ? { tipo: 'SIN_SUCESOR', ejecucion, faltantes } : { tipo: 'RECALCULAR', ejecucion, entradasVigentes };
  });
}

// ─── Comparabilidad (REG-06-162/163/164; INV-06-173/174/175) ────────────────────────────────────

/** Lo que hay que demostrar compatible para comparar dos observaciones (REG-06-162). */
export interface FichaDeComparabilidad {
  readonly protocoloId: string;
  readonly protocoloVersion: string;
  readonly metodoId: string | null;
  readonly metodoVersion: string | null;
  readonly unidad: string;
}

export const MotivoDeIncomparabilidad = { PROTOCOLO: 'PROTOCOLO', METODO: 'METODO', UNIDAD: 'UNIDAD' } as const;
export type MotivoDeIncomparabilidad = (typeof MotivoDeIncomparabilidad)[keyof typeof MotivoDeIncomparabilidad];

/**
 * REG-06-162: solo se compara lo que tiene compatibilidad demostrable. REG-06-163: una diferencia metodológica no se
 * resuelve convirtiendo en silencio. REG-06-164 e INV-06-175: lo no comparable **se conserva** con su limitación, no
 * se elimina ni se fuerza dentro de una serie homogénea.
 */
export function evaluarComparabilidad(a: FichaDeComparabilidad, b: FichaDeComparabilidad): readonly MotivoDeIncomparabilidad[] {
  const motivos: MotivoDeIncomparabilidad[] = [];
  if (a.protocoloId !== b.protocoloId || a.protocoloVersion !== b.protocoloVersion) motivos.push('PROTOCOLO');
  if (a.metodoId !== b.metodoId || a.metodoVersion !== b.metodoVersion) motivos.push('METODO');
  if (a.unidad !== b.unidad) motivos.push('UNIDAD');
  return motivos;
}

// ─── Serie longitudinal (REG-06-165/166/167; INV-06-176/177/178) ────────────────────────────────

/**
 * INV-06-176, literal: «`SIN_DATO` y `REGISTRADO(0)` son estados distintos», y su violación es «se usa cero como
 * sentinel o se pierde un cero real». Por eso la disponibilidad es un estado y no la ausencia de un número.
 *
 * No confundir con `EstadoDeEvaluacionAntropometrica.REGISTRADA`, que es el estado de la Evaluación: son niveles
 * distintos y por eso son tipos sin parentesco (WP-05 §9.4; DEUDA_LEGAJO DL-058 y siguientes).
 */
export const DisponibilidadDeMetrica = { REGISTRADO: 'REGISTRADO', SIN_DATO: 'SIN_DATO' } as const;
export type DisponibilidadDeMetrica = (typeof DisponibilidadDeMetrica)[keyof typeof DisponibilidadDeMetrica];

export interface ObservacionDeSerie {
  readonly fechaLocal: string;
  readonly metrica: string;
  readonly magnitud: Magnitud;
  readonly clase: ClaseDeDato;
  readonly condicion: CondicionDeMedicion;
  readonly ficha: FichaDeComparabilidad;
  readonly origenId: string;
}

export type PuntoDeSerie =
  | {
      readonly fechaLocal: string;
      readonly disponibilidad: 'REGISTRADO';
      readonly magnitud: Magnitud;
      readonly clase: ClaseDeDato;
      readonly ficha: FichaDeComparabilidad;
      readonly origenId: string;
      /** Vacío cuando es comparable con el punto REGISTRADO anterior; si no, por qué no lo es (REG-06-164). */
      readonly incomparableConElAnterior: readonly MotivoDeIncomparabilidad[];
    }
  | { readonly fechaLocal: string; readonly disponibilidad: 'SIN_DATO' };

export interface SerieLongitudinal {
  readonly metrica: string;
  readonly puntos: readonly PuntoDeSerie[];
}

/**
 * REG-06-165/166/167 e INV-06-177: por cada checkpoint pedido hay un punto, y el que no tiene observación **vigente**
 * es `SIN_DATO`. No se interpola, no se imputa, no se arrastra el último valor y no se inventa un punto sintético.
 * Una medición anulada no aporta un punto registrado (REG-06-221), aunque el hecho siga siendo consultable.
 *
 * Un cero medido es un punto `REGISTRADO` con valor 0: eso es exactamente lo que INV-06-176 protege.
 */
export function construirSerie(metrica: string, fechas: readonly string[], observaciones: readonly ObservacionDeSerie[]): SerieLongitudinal {
  const vigentes = observaciones.filter((o) => o.metrica === metrica && o.condicion === 'VIGENTE');
  let anterior: FichaDeComparabilidad | null = null;
  const puntos = fechas.map((fechaLocal): PuntoDeSerie => {
    const o = vigentes.find((x) => x.fechaLocal === fechaLocal);
    if (!o) return { fechaLocal, disponibilidad: 'SIN_DATO' };
    const incomparableConElAnterior = anterior ? evaluarComparabilidad(anterior, o.ficha) : [];
    anterior = o.ficha;
    return {
      fechaLocal,
      disponibilidad: 'REGISTRADO',
      magnitud: o.magnitud,
      clase: o.clase,
      ficha: o.ficha,
      origenId: o.origenId,
      incomparableConElAnterior,
    };
  });
  return { metrica, puntos };
}

/** Los checkpoints sin dato, para que la superficie los nombre como tales (REG-06-165). */
export function checkpointsSinDato(serie: SerieLongitudinal): readonly string[] {
  return serie.puntos.filter((p) => p.disponibilidad === 'SIN_DATO').map((p) => p.fechaLocal);
}
