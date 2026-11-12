/**
 * UF-11 de WP-USO-FINAL (DL-169; UF-D12, ratificada por Dirección el 2026-11-11): el segundo factor del profesional.
 * 08 §25 lo hace obligatorio antes de operar con datos reales, y 08 §42 lo pone como condición 6 del gate.
 *
 * Es el de Administración (DL-155): TOTP, diez códigos de recuperación de un solo uso y las mismas piezas de
 * `segundo-factor.ts` en la API. Lo que cambia es dónde se pide:
 * - **Una sesión común** de una identidad con perfil profesional actúa como profesional solo con el segundo factor
 *   verificado en esa sesión. Sin él, la sesión sigue sirviendo para todo lo de la persona (la app de la persona no lo
 *   pide), y nada de lo profesional: ni el PDP ni las áreas ni las listas donde es el profesional. Lo decide el servidor
 *   en cada pedido, con la misma regla para el website y la APK (08 §27.2).
 * - **La primera vez se configura solo,** dentro de los 10 minutos de entrar (la contraseña o Google): un token robado
 *   no alcanza para cargar otro autenticador. Pasado ese plazo, se vuelve a entrar.
 * - **Vale lo que dura la sesión** (12 h como máximo): no vence por inactividad, como el de Administración, que tiene
 *   más privilegios. Cada sesión nueva pide el código otra vez.
 * - **Reemplazar el autenticador o generar códigos nuevos** pide el segundo factor vigente y una entrada reciente (los
 *   mismos 10 minutos): es la re-autenticación de 08 §25, igual para una cuenta con contraseña y para una de Google.
 */
import { z } from 'zod';
import { PLAZO_DEL_SEGUNDO_FACTOR_MS, type MetodoDelSegundoFactor } from './administracion';
import { Instante } from './contratos';
import { CodigosDeRecuperacionSchema } from './contratos-administracion';

export type EstadoDelSegundoFactorDelProfesional =
  /** La identidad no tiene perfil profesional: no hay nada que pedir. */
  | { readonly estado: 'NO_REQUERIDO' }
  | { readonly estado: 'VERIFICADO'; readonly metodo: MetodoDelSegundoFactor }
  /** Tiene un autenticador activo y la sesión todavía no escribió un código. */
  | { readonly estado: 'REQUERIDO' }
  /** No tiene autenticador: lo configura hasta el plazo (10 minutos después de entrar). */
  | { readonly estado: 'CONFIGURACION_REQUERIDA'; readonly plazo: Date }
  /** No tiene autenticador y el plazo pasó: para configurarlo, vuelve a entrar. */
  | { readonly estado: 'INICIO_RECIENTE_REQUERIDO' };

/** El estado del segundo factor de una sesión común, decidido con lo que guarda la base (nunca con el cliente). */
export function estadoDelSegundoFactorDelProfesional(p: {
  readonly esProfesional: boolean;
  readonly inicioDeLaSesion: Date;
  readonly verificadoEn: Date | null;
  readonly metodo: MetodoDelSegundoFactor | null;
  readonly tieneAutenticadorActivo: boolean;
  readonly ahora: Date;
}): EstadoDelSegundoFactorDelProfesional {
  if (!p.esProfesional) return { estado: 'NO_REQUERIDO' };
  if (p.verificadoEn) return { estado: 'VERIFICADO', metodo: p.metodo ?? 'TOTP' };
  if (p.tieneAutenticadorActivo) return { estado: 'REQUERIDO' };
  const plazo = finDelInicioReciente(p.inicioDeLaSesion);
  return p.ahora < plazo ? { estado: 'CONFIGURACION_REQUERIDA', plazo } : { estado: 'INICIO_RECIENTE_REQUERIDO' };
}

/** Hasta cuándo la entrada es reciente: configurar, reemplazar o generar códigos se hace dentro de ese plazo. */
export function finDelInicioReciente(inicioDeLaSesion: Date): Date {
  return new Date(inicioDeLaSesion.getTime() + PLAZO_DEL_SEGUNDO_FACTOR_MS);
}

/** Si la sesión puede actuar como profesional: sin perfil profesional no hay nada que pedir; con él, verificado. */
export function actuaComoProfesional(e: EstadoDelSegundoFactorDelProfesional): boolean {
  return e.estado === 'NO_REQUERIDO' || e.estado === 'VERIFICADO';
}

// ─── El contrato (familia MFA, API-MFA-01 a 06) ──────────────────────────────────────────────────

/** Lo que el servidor dice del segundo factor de la sesión. El website muestra lo que falta; no decide nada. */
export const EstadoDelSegundoFactorDelProfesionalSchema = z.discriminatedUnion('state', [
  z.strictObject({ state: z.literal('NOT_REQUIRED') }),
  z.strictObject({ state: z.literal('VERIFIED'), method: z.enum(['TOTP', 'RECOVERY_CODE', 'ENROLLMENT']) }),
  z.strictObject({ state: z.literal('REQUIRED') }),
  z.strictObject({ state: z.literal('ENROLLMENT_REQUIRED'), deadline: Instante }),
  z.strictObject({ state: z.literal('RECENT_SIGN_IN_REQUIRED') }),
]);
export type EstadoDelSegundoFactorDelProfesionalApi = z.infer<typeof EstadoDelSegundoFactorDelProfesionalSchema>;

export function segundoFactorDelProfesionalApi(e: EstadoDelSegundoFactorDelProfesional): EstadoDelSegundoFactorDelProfesionalApi {
  switch (e.estado) {
    case 'NO_REQUERIDO':
      return { state: 'NOT_REQUIRED' };
    case 'VERIFICADO':
      return { state: 'VERIFIED', method: e.metodo };
    case 'REQUERIDO':
      return { state: 'REQUIRED' };
    case 'CONFIGURACION_REQUERIDA':
      return { state: 'ENROLLMENT_REQUIRED', deadline: e.plazo.toISOString() };
    case 'INICIO_RECIENTE_REQUERIDO':
      return { state: 'RECENT_SIGN_IN_REQUIRED' };
  }
}

/** API-MFA-01: el estado, cuántos códigos de recuperación quedan (si está verificado) y hasta cuándo la entrada es reciente. */
export const SegundoFactorDeLaSesionResponseSchema = z.strictObject({
  data: z.strictObject({
    secondFactor: EstadoDelSegundoFactorDelProfesionalSchema,
    recoveryCodesRemaining: z.number().int().nonnegative().nullable(),
    /** Hasta cuándo se puede reemplazar el autenticador o generar códigos sin volver a entrar; `null` si ya pasó. */
    recentSignInUntil: Instante.nullable(),
  }),
});
export type SegundoFactorDeLaSesionResponse = z.infer<typeof SegundoFactorDeLaSesionResponseSchema>;

/** API-MFA-02 y 03: la sesión verificada, con los códigos de recuperación que quedan. */
export const SegundoFactorDeLaSesionVerificadoResponseSchema = z.strictObject({
  data: z.strictObject({ secondFactor: EstadoDelSegundoFactorDelProfesionalSchema, recoveryCodesRemaining: z.number().int().nonnegative() }),
});
export type SegundoFactorDeLaSesionVerificadoResponse = z.infer<typeof SegundoFactorDeLaSesionVerificadoResponseSchema>;

/** API-MFA-04 y 06: sin cuerpo. La re-autenticación es la entrada reciente, igual con contraseña que con Google. */
export const SinCuerpoDelSegundoFactorSchema = z.strictObject({});

/** API-MFA-05: los diez códigos, una sola vez, y la sesión verificada. */
export const ConfiguracionDeLaSesionConfirmadaResponseSchema = z.strictObject({
  data: z.strictObject({ recoveryCodes: CodigosDeRecuperacionSchema, secondFactor: EstadoDelSegundoFactorDelProfesionalSchema }),
});
export type ConfiguracionDeLaSesionConfirmadaResponse = z.infer<typeof ConfiguracionDeLaSesionConfirmadaResponseSchema>;
