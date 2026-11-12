/**
 * UF-05 de WP-USO-FINAL (DL-169; UF-D4; 08 §12.2; 09 §31.2.6) · la versión vigente de los términos (A1) y de la
 * información de privacidad (A2) en las cuentas que ya existen. El alta acepta la vigente; cuando se publica una versión
 * nueva, quien aceptó la anterior la tiene que aceptar en «Antes de seguir» para seguir usando BE (puede cerrar sesión o
 * cerrar la cuenta):
 * - **API-ACC-07** suma los pasos `ACCEPT_TERMS` y `ACKNOWLEDGE_PRIVACY`, con el id de la versión vigente en `suggestion`,
 *   solo para un cliente que declara `CAPACIDAD_TEXTOS_VIGENTES` (la APK 0.24 no los conoce: pediría actualizar).
 * - **API-ACC-08** registra el acto con la versión que la pantalla mostró, que tiene que ser la vigente.
 * - **API-ACC-09** (UF-T57, revisión adversarial de la etapa 2) da el texto de una versión publicada por su id, sin sesión:
 *   una APK construida antes de publicar una versión no la tiene en su catálogo, y la pide ahí en vez de pedir actualizar.
 * - **El alta, en la transición** (UF-T57): un cliente con la capacidad puede presentar la versión que la vigente
 *   reemplaza (la que trae su catálogo); el acto queda con esa versión, y «Antes de seguir» le pide enseguida la vigente.
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

/**
 * Una versión publicada por su id, la que el cliente tiene en su catálogo; `null` si no la tiene: desde UF-T57, el cliente
 * la pide a API-ACC-09 (la APK construida antes de la publicación no la trae).
 */
export const versionPublicada = (id: string | null): VersionDeTexto | null => (id === null ? null : (CATALOGO_DE_TEXTOS.find((v) => v.id === id) ?? null));

/**
 * UF-T57 · la versión de un texto que acepta el alta (API-ACC-01 y API-GOO-03): la vigente o, solo para un cliente que
 * declara `CAPACIDAD_TEXTOS_VIGENTES`, la que la vigente reemplaza. Sin esto, el día que se publica una versión nueva
 * ninguna APK instalada podía crear una cuenta (presenta la de su catálogo, que pasó a ser la anterior). Ese cliente
 * acepta lo que mostró y, al entrar, «Antes de seguir» le pide la vigente. `null`: no es aceptable.
 */
export function versionAceptableEnElAlta(
  tipo: Extract<TipoDeTexto, 'TERMINOS' | 'PRIVACIDAD_INFO'>,
  versionId: string,
  conCapacidad: boolean,
  vigentes: Readonly<Record<TipoDeTexto, Pick<VersionDeTexto, 'id' | 'reemplazaA'>>> = VERSION_VIGENTE,
): string | null {
  const vigente = vigentes[tipo];
  if (versionId === vigente.id) return vigente.id;
  return conCapacidad && vigente.reemplazaA !== null && versionId === vigente.reemplazaA ? versionId : null;
}

// ─── API-ACC-09 · El texto de una versión publicada ──────────────────────────────────────────────

export const TextoPublicadoResponseSchema = z.strictObject({
  data: z.strictObject({
    versionId: z.string().min(1),
    /** El tipo de texto, como lo nombra el catálogo (TERMINOS, PRIVACIDAD_INFO…). */
    type: z.string().min(1),
    title: z.string(),
    purpose: z.string(),
    /** La fecha civil desde la que rige. */
    effectiveFrom: z.string(),
    text: z.string(),
    /** SHA-256 del texto (UTF-8), en hexadecimal: el mismo que guarda el acto. */
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    replaces: z.string().nullable(),
  }),
});
export type TextoPublicadoResponse = z.infer<typeof TextoPublicadoResponseSchema>;

export const textoPublicadoApi = (v: VersionDeTexto): TextoPublicadoResponse => ({
  data: { versionId: v.id, type: v.tipo, title: v.titulo, purpose: v.finalidad, effectiveFrom: v.vigenteDesde, text: v.texto, sha256: v.hash, replaces: v.reemplazaA },
});

/**
 * La versión que devolvió API-ACC-09, como la del catálogo, si es la que se pidió y del tipo del paso; `null` si no (el
 * cliente no la muestra: pide actualizar).
 */
export function versionDeLaApi(r: TextoPublicadoResponse, versionId: string, texto: TextoAAceptar): VersionDeTexto | null {
  const d = r.data;
  if (d.versionId !== versionId || d.type !== TIPO_DEL_TEXTO_A_ACEPTAR[texto]) return null;
  return { id: d.versionId, tipo: d.type as TipoDeTexto, titulo: d.title, finalidad: d.purpose, vigenteDesde: d.effectiveFrom, texto: d.text, hash: d.sha256, reemplazaA: d.replaces };
}

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
  /** Los dos juntos, en una sola oración (revisión adversarial de la etapa 2: «… de uso y Leí …» se leía mal). */
  aceptarLosDos: 'Acepto los términos de uso y leí la información de privacidad',
  /** Mientras se trae de la API el texto de una versión que este cliente no tiene (API-ACC-09). */
  trayendo: 'Trayendo el texto nuevo…',
  sinTexto: 'No pudimos traer el texto nuevo. Revisá la conexión y probá de nuevo.',
  aceptando: 'Guardando…',
  /** La API dice que la versión ya no es la vigente: cambió mientras se leía, o el cliente es anterior. */
  cambioDeVersionWeb: 'Los textos cambiaron mientras leías. Recargá la página para ver la versión vigente.',
  cambioDeVersionApk: 'Los textos cambiaron. Actualizá la app para continuar.',
  cerrarCuenta: '¿No querés aceptarlos? Podés cerrar tu cuenta:',
} as const;

/** El texto del botón que acepta los pendientes: uno, o los dos en una sola oración. */
export const botonDeAceptar = (textos: readonly TextoAAceptar[]): string =>
  textos.length === 1 ? COPY_TEXTOS_VIGENTES.aceptar[textos[0]!] : COPY_TEXTOS_VIGENTES.aceptarLosDos;
