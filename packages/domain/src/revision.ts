/**
 * B-09 — Revisión profesional válida y continuidad (06 §12; M-10; 05 UC-I05 y UC-I06). Transversal: nutrición en WP-04
 * y entrenamiento en WP-06.
 *
 * - La revisión es un acto explícito y no tiene máquina de estados (REG-06-141). Abrir, ver, filtrar o anotar no crea
 *   una revisión (06:5881; RF-034).
 * - Si falta cualquier componente, no hay revisión válida (REG-06-143; INV-06-154).
 * - La taxonomía es cerrada: seis resultados y ningún séptimo (REG-06-144). «Progresar» o «nuevo bloque» se expresan
 *   con AJUSTAR o SUSTITUIR.
 * - La consecuencia se aplica aparte, con UC-I06, y recién entonces se emite `ContinuidadOCierreAplicado`
 *   (REG-06-75). Si no puede aplicarse, no hay evento ni éxito (REG-06-77, 149).
 */

/** REG-06-144 (06:5899-5908), tokens del 06. */
export const ResultadoDeRevision = {
  MANTENER: 'MANTENER',
  AJUSTAR: 'AJUSTAR',
  SUSTITUIR: 'SUSTITUIR',
  REPROGRAMAR_REVISION: 'REPROGRAMAR_REVISION',
  CAMBIAR_OBJETIVO: 'CAMBIAR_OBJETIVO',
  FINALIZAR: 'FINALIZAR',
} as const;
export type ResultadoDeRevision = (typeof ResultadoDeRevision)[keyof typeof ResultadoDeRevision];
export const RESULTADOS_DE_REVISION: readonly ResultadoDeRevision[] = ['MANTENER', 'AJUSTAR', 'SUSTITUIR', 'REPROGRAMAR_REVISION', 'CAMBIAR_OBJETIVO', 'FINALIZAR'];

/** Tokens de la API (09v9:866-877). */
export const ResultadoDeRevisionApi = {
  MAINTAIN: 'MAINTAIN',
  ADJUST: 'ADJUST',
  REPLACE: 'REPLACE',
  RESCHEDULE_REVIEW: 'RESCHEDULE_REVIEW',
  CHANGE_OBJECTIVE: 'CHANGE_OBJECTIVE',
  FINALIZE: 'FINALIZE',
} as const;
export type ResultadoDeRevisionApi = (typeof ResultadoDeRevisionApi)[keyof typeof ResultadoDeRevisionApi];

export const RESULTADO_DESDE_API: Readonly<Record<ResultadoDeRevisionApi, ResultadoDeRevision>> = {
  MAINTAIN: 'MANTENER',
  ADJUST: 'AJUSTAR',
  REPLACE: 'SUSTITUIR',
  RESCHEDULE_REVIEW: 'REPROGRAMAR_REVISION',
  CHANGE_OBJECTIVE: 'CAMBIAR_OBJETIVO',
  FINALIZE: 'FINALIZAR',
};
export const RESULTADO_HACIA_API: Readonly<Record<ResultadoDeRevision, ResultadoDeRevisionApi>> = {
  MANTENER: 'MAINTAIN',
  AJUSTAR: 'ADJUST',
  SUSTITUIR: 'REPLACE',
  REPROGRAMAR_REVISION: 'RESCHEDULE_REVIEW',
  CAMBIAR_OBJETIVO: 'CHANGE_OBJECTIVE',
  FINALIZAR: 'FINALIZE',
};

/**
 * Efecto de cada resultado (REG-06-147, 06:5940-5949; REG-06-73, 74). Para AJUSTAR y SUSTITUIR, el efecto vertical es
 * un borrador sucesor de la versión efectiva, y para CAMBIAR_OBJETIVO, una versión nueva de objetivo (DEUDA_LEGAJO
 * DL-052, opción A).
 */
export type EfectoVertical = 'NINGUNO' | 'BORRADOR_SUCESOR' | 'NUEVA_REVISION_PROGRAMADA' | 'NUEVA_VERSION_DE_OBJETIVO' | 'CIERRE';
export interface EfectoDeResultado {
  readonly vertical: EfectoVertical;
  /** Estado del Proceso después de aplicar (INV-06-82, 83). */
  readonly procesoDespues: 'ABIERTO' | 'CERRADO';
  /** Tipo del evento `ContinuidadOCierreAplicado` (REG-06-75). */
  readonly tipoDeEvento: 'CONTINUIDAD' | 'CIERRE_PROCESO';
}
export const EFECTO_DE_RESULTADO: Readonly<Record<ResultadoDeRevision, EfectoDeResultado>> = {
  MANTENER: { vertical: 'NINGUNO', procesoDespues: 'ABIERTO', tipoDeEvento: 'CONTINUIDAD' },
  AJUSTAR: { vertical: 'BORRADOR_SUCESOR', procesoDespues: 'ABIERTO', tipoDeEvento: 'CONTINUIDAD' },
  SUSTITUIR: { vertical: 'BORRADOR_SUCESOR', procesoDespues: 'ABIERTO', tipoDeEvento: 'CONTINUIDAD' },
  REPROGRAMAR_REVISION: { vertical: 'NUEVA_REVISION_PROGRAMADA', procesoDespues: 'ABIERTO', tipoDeEvento: 'CONTINUIDAD' },
  CAMBIAR_OBJETIVO: { vertical: 'NUEVA_VERSION_DE_OBJETIVO', procesoDespues: 'ABIERTO', tipoDeEvento: 'CONTINUIDAD' },
  FINALIZAR: { vertical: 'CIERRE', procesoDespues: 'CERRADO', tipoDeEvento: 'CIERRE_PROCESO' },
};

/** Componentes que el profesional aporta (REG-06-141, 06:5870-5879). Autoría, tiempos y procedencia los pone BE. */
export interface ComponentesDeRevision {
  readonly periodo: { readonly inicio: string; readonly fin: string } | null;
  readonly evidencias: readonly unknown[];
  readonly interpretacion: string;
  readonly resultado: string;
  readonly fundamento: string;
  /** Próxima acción; para FINALIZAR, la descripción del cierre. */
  readonly proximaAccion: string;
  /** Fecha de la próxima revisión: obligatoria en REPROGRAMAR_REVISION (REG-06-146). */
  readonly proximaRevision: string | null;
}

export type FaltanteDeRevision =
  | 'PERIODO'
  | 'EVIDENCIA'
  | 'INTERPRETACION'
  | 'RESULTADO_FUERA_DE_TAXONOMIA'
  | 'FUNDAMENTO'
  | 'PROXIMA_ACCION_O_CIERRE'
  | 'PROXIMA_REVISION';

export type EvaluacionDeRevision =
  | { readonly valida: true; readonly resultado: ResultadoDeRevision }
  | { readonly valida: false; readonly faltantes: readonly FaltanteDeRevision[] };

const conTexto = (s: string): boolean => s.trim().length > 0;

/**
 * UC-I05: verifica que no falte nada y que el resultado sea de la taxonomía. Devuelve todos los faltantes, para que el
 * profesional los corrija de una vez (ADD:1167-1174). La reconstruibilidad de la evidencia la verifica el servicio,
 * que conoce la base.
 */
export function evaluarRevision(c: ComponentesDeRevision): EvaluacionDeRevision {
  const faltantes: FaltanteDeRevision[] = [];
  if (!c.periodo || !(c.periodo.inicio <= c.periodo.fin)) faltantes.push('PERIODO');
  if (c.evidencias.length === 0) faltantes.push('EVIDENCIA');
  if (!conTexto(c.interpretacion)) faltantes.push('INTERPRETACION');
  const resultado = (RESULTADOS_DE_REVISION as readonly string[]).includes(c.resultado) ? (c.resultado as ResultadoDeRevision) : null;
  if (!resultado) faltantes.push('RESULTADO_FUERA_DE_TAXONOMIA');
  if (!conTexto(c.fundamento)) faltantes.push('FUNDAMENTO');
  if (!conTexto(c.proximaAccion)) faltantes.push('PROXIMA_ACCION_O_CIERRE');
  if (resultado === 'REPROGRAMAR_REVISION' && !c.proximaRevision) faltantes.push('PROXIMA_REVISION');
  if (faltantes.length > 0 || !resultado) return { valida: false, faltantes };
  return { valida: true, resultado };
}

/**
 * REG-06-150: un Proceso figura con revisión pendiente solo si está ABIERTO, hay una expectativa explícita de revisión,
 * su fecha ya llegó (o no tiene fecha futura) y no hay una revisión válida posterior aplicada. Nunca se infiere de
 * puntajes, peso ni adherencia.
 */
export interface HechosDePendiente {
  readonly procesoAbierto: boolean;
  /** Fecha objetivo de la expectativa vigente; `undefined` = no hay expectativa; `null` = sin fecha. */
  readonly expectativa: { readonly fechaObjetivo: string | null; readonly registradaEn: string } | undefined;
  /** Revisión válida con UC-I06 aplicado, registrada después de la expectativa. */
  readonly revisionAplicadaPosterior: boolean;
  readonly ahora: string;
}
export function revisionPendiente(h: HechosDePendiente): { readonly pendiente: false } | { readonly pendiente: true; readonly desde: string } {
  if (!h.procesoAbierto || !h.expectativa || h.revisionAplicadaPosterior) return { pendiente: false };
  const { fechaObjetivo, registradaEn } = h.expectativa;
  if (fechaObjetivo === null) return { pendiente: true, desde: registradaEn };
  return fechaObjetivo <= h.ahora ? { pendiente: true, desde: fechaObjetivo } : { pendiente: false };
}
