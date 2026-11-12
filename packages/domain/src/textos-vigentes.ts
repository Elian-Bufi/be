/**
 * UF-05 de WP-USO-FINAL (DL-169; UF-D4; 08 §12.2; 09 §31.2.6) · la versión vigente de los términos (A1) y de la
 * información de privacidad (A2) en las cuentas que ya existen. El alta acepta la vigente; cuando se publica una versión
 * nueva, quien aceptó la anterior la tiene que aceptar en «Antes de seguir» para seguir usando BE (puede cerrar sesión o
 * cerrar la cuenta):
 * - **API-ACC-07** suma los pasos `ACCEPT_TERMS` y `ACKNOWLEDGE_PRIVACY`, con el id de la versión vigente en `suggestion`,
 *   solo para un cliente que declara `CAPACIDAD_TEXTOS_VIGENTES` (la APK 0.24 no los conoce: pediría actualizar).
 * - **API-ACC-08** registra el acto con la versión que la pantalla mostró, que tiene que ser la vigente.
 * Los consentimientos (A3 y B2) ya tienen su propio aviso de versión nueva, y la evidencia visual y lo que se comparte
 * entre áreas se aceptan al usarlos: no pasan por acá.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import type { PasoPendiente } from './contratos-perfil-propio';
import { CATALOGO_DE_TEXTOS, VERSION_VIGENTE, type TipoDeTexto, type VersionDeTexto } from './textos';

/** Los textos que una cuenta vuelve a aceptar cuando cambian, como los nombra el contrato. */
export const TEXTOS_A_ACEPTAR = ['TERMS', 'PRIVACY'] as const;
export type TextoAAceptar = (typeof TEXTOS_A_ACEPTAR)[number];

/** El tipo de texto (y de acto) de cada uno, y el paso de «Antes de seguir» que lo pide. */
export const TIPO_DEL_TEXTO_A_ACEPTAR: Readonly<Record<TextoAAceptar, Extract<TipoDeTexto, 'TERMINOS' | 'PRIVACIDAD_INFO'>>> = { TERMS: 'TERMINOS', PRIVACY: 'PRIVACIDAD_INFO' };
export const PASO_DEL_TEXTO_A_ACEPTAR: Readonly<Record<TextoAAceptar, 'ACCEPT_TERMS' | 'ACKNOWLEDGE_PRIVACY'>> = { TERMS: 'ACCEPT_TERMS', PRIVACY: 'ACKNOWLEDGE_PRIVACY' };

/** El texto de un paso de «Antes de seguir», o `null` si el paso no es de textos. */
export const textoDelPaso = (paso: string): TextoAAceptar | null => TEXTOS_A_ACEPTAR.find((t) => PASO_DEL_TEXTO_A_ACEPTAR[t] === paso) ?? null;

/**
 * Los pasos de textos que le faltan a una cuenta: los de los textos cuya última aceptación vigente no es la versión
 * vigente (o que no tiene ninguna), en el orden de `TEXTOS_A_ACEPTAR`, con el id de la vigente en `suggestion`. Una versión
 * nueva no hereda la aceptación de la anterior (09 §31.2.6).
 */
export function pasosDeLosTextos(
  aceptadas: Readonly<Partial<Record<'TERMINOS' | 'PRIVACIDAD_INFO', string | null>>>,
  vigentes: Readonly<Record<TipoDeTexto, Pick<VersionDeTexto, 'id'>>> = VERSION_VIGENTE,
): PasoPendiente[] {
  return TEXTOS_A_ACEPTAR.flatMap((t) => {
    const tipo = TIPO_DEL_TEXTO_A_ACEPTAR[t];
    const vigente = vigentes[tipo].id;
    return aceptadas[tipo] === vigente ? [] : [{ step: PASO_DEL_TEXTO_A_ACEPTAR[t], suggestion: vigente }];
  });
}

/** Una versión publicada por su id, la que el cliente tiene en su catálogo; `null` si no la tiene (hay que actualizar). */
export const versionPublicada = (id: string | null): VersionDeTexto | null => (id === null ? null : (CATALOGO_DE_TEXTOS.find((v) => v.id === id) ?? null));

// ─── API-ACC-08 · Aceptar la versión vigente ─────────────────────────────────────────────────────

export const AceptarVersionVigenteRequestSchema = z.strictObject({
  /** Qué texto: los términos (A1) o la información de privacidad (A2). */
  text: z.enum(TEXTOS_A_ACEPTAR),
  /** La versión que la pantalla mostró (08 §12.2): tiene que ser la vigente. */
  versionId: z.string().min(1).max(200),
});
export type AceptarVersionVigenteRequest = z.infer<typeof AceptarVersionVigenteRequestSchema>;

export const AceptacionDeVersionResponseSchema = z.strictObject({
  data: z.strictObject({
    /** El acto que registra la aceptación (el nuevo, o el que ya estaba con esta versión). */
    actId: IdOpaco,
    text: z.enum(TEXTOS_A_ACEPTAR),
    versionId: z.string(),
    acceptedAt: Instante,
  }),
});
export type AceptacionDeVersionResponse = z.infer<typeof AceptacionDeVersionResponseSchema>;

// ─── Los textos de «Antes de seguir» (website y APK) ─────────────────────────────────────────────

export const COPY_TEXTOS_VIGENTES = {
  titulo: {
    TERMS: 'Los términos de uso cambiaron',
    PRIVACY: 'La información de privacidad cambió',
  } as Readonly<Record<TextoAAceptar, string>>,
  explicacion: 'Para seguir usando BE, leé la versión nueva y aceptala. Si no querés aceptarla, podés cerrar sesión o cerrar tu cuenta.',
  version: (id: string, desde: string): string => `Versión ${id}, vigente desde el ${desde}.`,
  aceptar: {
    TERMS: 'Acepto los términos de uso',
    PRIVACY: 'Leí la información de privacidad',
  } as Readonly<Record<TextoAAceptar, string>>,
  aceptando: 'Guardando…',
  /** La API dice que la versión ya no es la vigente: cambió mientras se leía, o el cliente es anterior. */
  cambioDeVersionWeb: 'Los textos cambiaron mientras leías. Recargá la página para ver la versión vigente.',
  cambioDeVersionApk: 'Los textos cambiaron. Actualizá la app para continuar.',
  cerrarCuenta: '¿No querés aceptarlos? Podés cerrar tu cuenta:',
} as const;
