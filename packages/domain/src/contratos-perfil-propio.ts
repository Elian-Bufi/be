/**
 * El nombre visible del perfil propio: API-ACC-06 («Editar perfil propio», 09v8:509-554) y su lectura,
 * API-ACC-06-PROPIA, una extensión declarada de BE. DEUDA_LEGAJO DL-009 (opción B) y DL-040, decididas por Dirección el
 * 2026-10-15 («pongámosle nombres, ya no id o esa matrícula»), y DL-169 (WP-USO-FINAL, UF-01), decidida el 2026-11-11:
 * «poner el nombre de la persona no puede ser una opción».
 * - **Es de la persona.** Lo declara al crear la cuenta y lo cambia ella, en su perfil; cada cambio es una versión
 *   (REG-06-20). No es un alias que le pone el profesional.
 * - **Es obligatorio desde DL-169** (UF-D1 a UF-D5): un solo campo, «Nombre y apellido», de 1 a 60 caracteres. El alta
 *   con correo (API-ACC-01) y la de Google (API-GOO-03) lo exigen; se cambia pero no se quita (API-ACC-06 rechaza `null`
 *   y el vacío); y una cuenta anterior sin nombre lo completa en «Antes de seguir» (API-ACC-07). Las versiones viejas
 *   guardadas sin nombre quedan en la historia.
 * - **Quién lo ve.** El profesional con un vínculo vigente con la persona (aceptado o en pausa, en algún alcance): es el
 *   «contacto mínimo del vínculo» (08 §11, dato C3). Antes de que acepte, después de que termine, o si la cuenta todavía
 *   no completó su nombre, el profesional ve la referencia neutral («Asesorado · c36743»). El correo, nunca.
 * - **`/me` no lo trae.** Su respuesta es un objeto estricto, y la APK instalada, que la valida así, dejaría de leer el
 *   estado de la cuenta si apareciera un campo nuevo (fichas de Dirección del 2026-10-02, ficha 1). La lectura va aparte.
 * - **`expectedVersion`:** «v0» mientras el perfil no tiene versiones; después, la efectiva («v1», «v2»…). Un cambio
 *   con una versión vieja responde 409 VERSION_CONFLICT: se vuelve a leer antes de reintentar.
 * Objetos estrictos: un campo que no es del perfil → 400 UNKNOWN_FIELD (09v8: «campos server-owned → 400»).
 */
import { z } from 'zod';
import { Instante } from './contratos';

/** El largo máximo del nombre visible, en caracteres. Lo repite la base (`version_de_perfil_propio_nombre_visible_valido`). */
export const LARGO_MAXIMO_DEL_NOMBRE_VISIBLE = 60;

/** El nombre como se guarda: sin espacios en los bordes y con un solo espacio entre palabras. */
export const normalizarNombreVisible = (nombre: string): string => nombre.normalize('NFC').trim().replace(/\s+/g, ' ');

/**
 * El nombre que se puede guardar, ya normalizado: de 1 a 60 caracteres y sin caracteres de control ni invisibles. `null`
 * si no se puede (la API responde 422).
 */
export function nombreVisibleValido(nombre: string): string | null {
  const normalizado = normalizarNombreVisible(nombre);
  const largo = [...normalizado].length;
  if (largo < 1 || largo > LARGO_MAXIMO_DEL_NOMBRE_VISIBLE) return null;
  if (/[\p{Cc}\p{Cf}\p{Co}]/u.test(normalizado)) return null;
  return normalizado;
}

/** Los códigos de `details.issues` de un nombre que falta o que no se puede guardar (DL-169, UF-D1 y UF-D3). */
export const ISSUE_DEL_NOMBRE = {
  /** No vino, vino en `null` o quedó vacío al normalizarlo. */
  REQUERIDO: 'DISPLAY_NAME_REQUIRED',
  /** Vino, pero tiene más de 60 caracteres o caracteres invisibles. */
  INVALIDO: 'INVALID_DISPLAY_NAME',
} as const;

/**
 * Qué le pasa al nombre que llegó: `FALTA` (no vino, `null` o vacío), `INVALIDO` (largo o con caracteres invisibles) o
 * `null` si se puede guardar. La misma regla corre en la API, el website y la APK (09v7 T21).
 */
export function problemaDelNombre(nombre: string | null | undefined): 'FALTA' | 'INVALIDO' | null {
  if (nombre === null || nombre === undefined || normalizarNombreVisible(nombre) === '') return 'FALTA';
  return nombreVisibleValido(nombre) === null ? 'INVALIDO' : null;
}

/** La referencia corta de una identidad: los últimos seis caracteres de su identificador, sin guiones. */
export const referenciaCorta = (identityId: string): string => identityId.replace(/-/g, '').slice(-6);

/** La referencia neutral con que el profesional ve a una persona sin nombre visible para él (DL-040). */
export const referenciaNeutral = (identityId: string): string => `Asesorado · ${referenciaCorta(identityId)}`;

/** Una versión del contrato: «v0», «v1»… */
const VersionDelPerfil = z.string().regex(/^v\d+$/);

export const PerfilPropioSchema = z.strictObject({
  /** El nombre visible, o `null` si la cuenta es anterior a DL-169 y todavía no lo completó (o lo había quitado). */
  displayName: z.string().nullable(),
  /** La versión efectiva, para `expectedVersion`: «v0» sin versiones. */
  version: VersionDelPerfil,
  /** Cuándo se registró la versión efectiva; `null` sin versiones. */
  updatedAt: Instante.nullable(),
});
export type PerfilPropio = z.infer<typeof PerfilPropioSchema>;

export const PerfilPropioResponseSchema = z.strictObject({ data: PerfilPropioSchema });
export type PerfilPropioResponse = z.infer<typeof PerfilPropioResponseSchema>;

/** API-ACC-06. `changes` es la lista blanca del perfil propio: hoy, solo el nombre visible. */
export const EditarPerfilPropioRequestSchema = z.strictObject({
  expectedVersion: VersionDelPerfil,
  changes: z.strictObject({
    /**
     * El nombre nuevo (se normaliza al guardar). Desde DL-169 (UF-D3) se cambia pero no se quita: `null` o un texto vacío
     * responden 422 INVALID_PROFILE_DATA con el issue DISPLAY_NAME_REQUIRED. El schema admite `null` para que ese rechazo
     * sea preciso y no un 400 de forma.
     */
    displayName: z.string().max(400).nullable(),
  }),
});
export type EditarPerfilPropioRequest = z.infer<typeof EditarPerfilPropioRequestSchema>;

// ─── API-ACC-07 · Lo que falta para seguir (DL-169, UF-D4) ──────────────────────────────────────────

/**
 * Los pasos que una cuenta tiene que completar antes de usar BE, en el orden en que se piden: el nombre (UF-01) y, desde
 * UF-05, la versión vigente de los términos (ACCEPT_TERMS) y de la información de privacidad (ACKNOWLEDGE_PRIVACY), que se
 * piden solo a un cliente que declara `CAPACIDAD_TEXTOS_VIGENTES`. UF-13 sumará el correo. El paso viaja como texto (como
 * `kind` de la novedad): un paso nuevo no deja sin leer la respuesta a un cliente que no lo conoce, que pide actualizar.
 */
export const PASOS_PARA_SEGUIR = ['DISPLAY_NAME', 'ACCEPT_TERMS', 'ACKNOWLEDGE_PRIVACY'] as const;
export type PasoParaSeguir = (typeof PASOS_PARA_SEGUIR)[number];

export const PasoPendienteSchema = z.strictObject({
  /** Uno de `PASOS_PARA_SEGUIR`. */
  step: z.string().min(1),
  /**
   * Lo que la pantalla puede proponer, o `null`. En `DISPLAY_NAME`, el nombre profesional de la identidad, si tiene
   * perfil profesional (UF-01, punto 4): la persona lo confirma o lo corrige. En `ACCEPT_TERMS` y `ACKNOWLEDGE_PRIVACY`
   * (UF-05), el id de la versión vigente que hay que aceptar: el cliente muestra ese texto, y si no lo tiene, pide
   * actualizar (la forma del paso no cambia, así la lectura congelada de la 0.24 sigue valiendo).
   */
  suggestion: z.string().nullable(),
});
export type PasoPendiente = z.infer<typeof PasoPendienteSchema>;

export const LoQueFaltaParaSeguirResponseSchema = z.strictObject({
  data: z.strictObject({
    /** Vacío: la cuenta puede seguir. */
    steps: z.array(PasoPendienteSchema),
  }),
});
export type LoQueFaltaParaSeguirResponse = z.infer<typeof LoQueFaltaParaSeguirResponseSchema>;

/** Si el cliente sabe resolver todos los pasos que pide la API. Uno desconocido: «Actualizá la app para continuar». */
export const conocePasos = (pasos: readonly PasoPendiente[]): boolean => pasos.every((p) => (PASOS_PARA_SEGUIR as readonly string[]).includes(p.step));
