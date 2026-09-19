/**
 * B-05 — Capacidad operativa del profesional (06 §9). Solo se consulta al abrir un Proceso `NUEVO` (REG-06-90;
 * INV-06-75): la continuidad nunca la consulta (REG-06-92; INV-06-104).
 *
 * - Una sola capacidad por identidad profesional, sin bandas por especialidad (REG-06-81).
 * - Modos `LIMITADA` (L asesorados únicos) o `SIN_LIMITE`. Sin versión configurada, el modo efectivo es `SIN_LIMITE`,
 *   y eso no implica Habilitación (REG-06-82; INV-06-90).
 * - Cambiar la capacidad crea una versión nueva y no reescribe admisiones pasadas (REG-06-83).
 * - Sin gracia en WP-04: ausente equivale a sin gracia (06:3769). Quién configura la capacidad: DEUDA_LEGAJO DL-051.
 * - Un rechazo no crea el Proceso ni interrumpe, revoca o borra nada (REG-06-93). Reducir la banda no expulsa a nadie
 *   (REG-06-94).
 */

export type ModoDeCapacidad = 'LIMITADA' | 'SIN_LIMITE';

export type CapacidadEfectiva = { readonly modo: 'SIN_LIMITE' } | { readonly modo: 'LIMITADA'; readonly limite: number };

/** REG-06-82: sin versión configurada → `SIN_LIMITE`. */
export function capacidadEfectiva(configurada: CapacidadEfectiva | null): CapacidadEfectiva {
  return configurada ?? { modo: 'SIN_LIMITE' };
}

export interface HechosDeAdmision {
  readonly capacidad: CapacidadEfectiva;
  /**
   * Asesorados únicos que hoy ocupan capacidad con este profesional (REG-06-84): tienen al menos un Alcance con Proceso
   * `ABIERTO`, Vínculo `ACEPTADO` y Consentimiento `VIGENTE`, y la cuenta no está `CERRADA` (06:3775-3780).
   */
  readonly asesoradosQueOcupan: readonly string[];
  /** Asesorado del Proceso que se quiere abrir. */
  readonly asesoradoId: string;
}

export type ResultadoDeAdmision =
  | { readonly admite: true; readonly ocupacionActual: number; readonly ocupacionProyectada: number }
  | { readonly admite: false; readonly motivo: 'SOBREOCUPADA' | 'EXCEDE_LIMITE'; readonly ocupacionActual: number; readonly limite: number };

/** REG-06-91, literal (06:3883-3895). */
export function evaluarAdmision(h: HechosDeAdmision): ResultadoDeAdmision {
  const ocupan = new Set(h.asesoradosQueOcupan);
  const actual = ocupan.size;
  // «Si el asesorado ya cuenta por otro Proceso con el mismo profesional, no suma y no se rechaza por capacidad.»
  const yaCuenta = ocupan.has(h.asesoradoId);
  const proyectada = yaCuenta ? actual : actual + 1;
  if (h.capacidad.modo === 'SIN_LIMITE' || yaCuenta) return { admite: true, ocupacionActual: actual, ocupacionProyectada: proyectada };
  const limite = h.capacidad.limite;
  if (actual > limite) return { admite: false, motivo: 'SOBREOCUPADA', ocupacionActual: actual, limite };
  if (proyectada > limite) return { admite: false, motivo: 'EXCEDE_LIMITE', ocupacionActual: actual, limite };
  return { admite: true, ocupacionActual: actual, ocupacionProyectada: proyectada };
}
