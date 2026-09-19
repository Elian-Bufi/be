/**
 * T-06-02 — Estado operativo de cuenta.
 * Fuente: BE-LEG-06 v0.1.1 §5.7 (B-01 · M-01), CONV-06-02, CONV-06-03.
 *
 * Dimensión de `Identidad BE`: no existe una entidad paralela «Cuenta» (§5.7.1).
 * Conjunto cerrado (§5.7.2). Toda transición no declarada está prohibida (§5.7.4).
 * `OPERATIVA` no concede facultades de otra dimensión (INV-06-27, REG-06-23).
 */
import { VERSION_VIGENTE, TipoDeTexto } from './textos';

export const EstadoOperativoDeCuenta = {
  OPERATIVA: 'OPERATIVA',
  SUSPENDIDA: 'SUSPENDIDA',
  CERRADA: 'CERRADA',
} as const;

export type EstadoOperativoDeCuenta =
  (typeof EstadoOperativoDeCuenta)[keyof typeof EstadoOperativoDeCuenta];

/** §5.7.2 — estado inicial tras un registro exitoso. */
export const ESTADO_INICIAL_DE_CUENTA: EstadoOperativoDeCuenta = 'OPERATIVA';

/**
 * §5.7.2 — estado terminal bajo el modelo vigente de M-01.
 * La reversibilidad de `CERRADA` no se decide en B-01: no hay transición de salida.
 */
export const ESTADOS_TERMINALES_DE_CUENTA: readonly EstadoOperativoDeCuenta[] = ['CERRADA'];

/** §5.7.3 — `SUSPENDIDA` y `CERRADA` bloquean nuevas sesiones y operaciones (INV-06-28). */
export function cuentaPermiteOperar(estado: EstadoOperativoDeCuenta): boolean {
  return estado === 'OPERATIVA';
}

export interface TransicionDeclarada<E extends string, T extends string = string> {
  /** CONV-06-04: verbo en infinitivo. */
  readonly transicion: T;
  readonly origen: E;
  readonly destino: E;
  /** CONV-06-05: hecho consumado. */
  readonly evento: string;
}

export type TransicionDeCuenta = 'SuspenderCuenta' | 'RestablecerCuenta' | 'CerrarCuenta';

/**
 * §5.7.4 — lista blanca de transiciones.
 * `SUSPENDIDA → CERRADA` no se declara (UC-P27 exige titular con sesión válida).
 */
export const TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA: readonly TransicionDeclarada<
  EstadoOperativoDeCuenta,
  TransicionDeCuenta
>[] = [
  { transicion: 'SuspenderCuenta', origen: 'OPERATIVA', destino: 'SUSPENDIDA', evento: 'CuentaSuspendida' },
  { transicion: 'RestablecerCuenta', origen: 'SUSPENDIDA', destino: 'OPERATIVA', evento: 'CuentaRestablecida' },
  { transicion: 'CerrarCuenta', origen: 'OPERATIVA', destino: 'CERRADA', evento: 'CuentaCerrada' },
];

/** Consulta de la lista blanca: `undefined` significa transición prohibida. */
export function transicionDeclarada(
  origen: EstadoOperativoDeCuenta,
  destino: EstadoOperativoDeCuenta,
): TransicionDeclarada<EstadoOperativoDeCuenta, TransicionDeCuenta> | undefined {
  return TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA.find((t) => t.origen === origen && t.destino === destino);
}

/**
 * Contexto que cada guarda necesita (06 §5.7.4, columna «Condiciones»).
 * El actor habilitante de Suspender/Restablecer es «actor/servicio habilitado por la política de 08»:
 * mientras no exista UC administrativo, solo un servicio interno (DEUDA_LEGAJO DL-020).
 */
export type ContextoDeTransicionDeCuenta =
  | { readonly transicion: 'SuspenderCuenta'; readonly actor: 'SERVICIO_INTERNO'; readonly fundamento: string }
  | { readonly transicion: 'RestablecerCuenta'; readonly actor: 'SERVICIO_INTERNO'; readonly resolucion: string }
  | {
      readonly transicion: 'CerrarCuenta';
      readonly actor: 'TITULAR';
      /** «sesión/autorización aplicables»: sesión activa del propio titular. */
      readonly sesionDelTitularValida: boolean;
      /** SESSION_STEP_UP (09v12 ACC-P1-03): autenticación reciente (DL-017). */
      readonly autenticacionReciente: boolean;
      /** «consecuencias presentadas»: versión del texto de consecuencias que la UI mostró. */
      readonly versionDeConsecuenciasPresentada: string | null;
      /** «confirmación explícita». */
      readonly confirmacionExplicita: boolean;
    };

export type MotivoDeRechazoDeTransicion =
  | 'TRANSICION_NO_DECLARADA'
  | 'SIN_FUNDAMENTO'
  | 'SIN_RESOLUCION'
  | 'SESION_NO_VALIDA'
  | 'STEP_UP_REQUERIDO'
  | 'CONSECUENCIAS_NO_PRESENTADAS'
  | 'SIN_CONFIRMACION_EXPLICITA';

/** Efectos declarados por transición (06 §5.7.4 columna «Efectos», §5.8; 08 R-02 y §12.4). */
export interface EfectosDeTransicionDeCuenta {
  /** 08 §26.3: suspensión y cierre revocan sesiones; el cierre, de inmediato. */
  readonly revocarSesiones: boolean;
  /** 08 R-02: «hash de password al cierre» (DEUDA_LEGAJO DL-019). */
  readonly suprimirCredencialLocal: boolean;
  /** 08 §12.4: `TERMINOS` es «Revocable: Cierre de cuenta» (DEUDA_LEGAJO DL-021). */
  readonly actosARevocar: readonly ('TERMINOS')[];
}

const EFECTOS: Record<TransicionDeCuenta, EfectosDeTransicionDeCuenta> = {
  SuspenderCuenta: { revocarSesiones: true, suprimirCredencialLocal: false, actosARevocar: [] },
  RestablecerCuenta: { revocarSesiones: false, suprimirCredencialLocal: false, actosARevocar: [] },
  CerrarCuenta: { revocarSesiones: true, suprimirCredencialLocal: true, actosARevocar: ['TERMINOS'] },
};

export type EvaluacionDeTransicionDeCuenta =
  | {
      readonly permitida: true;
      readonly transicion: TransicionDeclarada<EstadoOperativoDeCuenta, TransicionDeCuenta>;
      readonly efectos: EfectosDeTransicionDeCuenta;
    }
  | { readonly permitida: false; readonly motivo: MotivoDeRechazoDeTransicion };

/**
 * Evalúa lista blanca + guardas. Único punto de decisión de transiciones de cuenta:
 * el servicio lo invoca antes de escribir y la base lo refuerza con un trigger.
 */
export function evaluarTransicionDeCuenta(
  estadoActual: EstadoOperativoDeCuenta,
  contexto: ContextoDeTransicionDeCuenta,
): EvaluacionDeTransicionDeCuenta {
  const declarada = TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA.find(
    (t) => t.transicion === contexto.transicion && t.origen === estadoActual,
  );
  if (!declarada) return { permitida: false, motivo: 'TRANSICION_NO_DECLARADA' };

  switch (contexto.transicion) {
    case 'SuspenderCuenta':
      // [existe fundamento válido según política posterior]
      if (contexto.fundamento.trim().length === 0) return { permitida: false, motivo: 'SIN_FUNDAMENTO' };
      break;
    case 'RestablecerCuenta':
      // [cesó o fue resuelta la condición de suspensión]
      if (contexto.resolucion.trim().length === 0) return { permitida: false, motivo: 'SIN_RESOLUCION' };
      break;
    case 'CerrarCuenta':
      // [sesión/autorización aplicables, consecuencias presentadas y confirmación explícita]
      if (!contexto.sesionDelTitularValida) return { permitida: false, motivo: 'SESION_NO_VALIDA' };
      if (!contexto.autenticacionReciente) return { permitida: false, motivo: 'STEP_UP_REQUERIDO' };
      if (contexto.versionDeConsecuenciasPresentada !== VERSION_VIGENTE[TipoDeTexto.CONSECUENCIAS_DE_CIERRE].id) {
        return { permitida: false, motivo: 'CONSECUENCIAS_NO_PRESENTADAS' };
      }
      if (!contexto.confirmacionExplicita) return { permitida: false, motivo: 'SIN_CONFIRMACION_EXPLICITA' };
      break;
  }
  return { permitida: true, transicion: declarada, efectos: EFECTOS[contexto.transicion] };
}
