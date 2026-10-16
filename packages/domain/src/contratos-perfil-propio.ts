/**
 * El nombre visible del perfil propio: API-ACC-06 («Editar perfil propio», 09v8:509-554) y su lectura,
 * API-ACC-06-PROPIA, una extensión declarada de BE. DEUDA_LEGAJO DL-009 (opción B) y DL-040, decididas por Dirección el
 * 2026-10-15 («pongámosle nombres, ya no id o esa matrícula»).
 * - **Es de la persona.** Lo declara, lo cambia o lo quita ella, en su perfil; cada cambio es una versión (REG-06-20).
 *   No es un alias que le pone el profesional.
 * - **Quién lo ve.** El profesional con un vínculo vigente con la persona (aceptado o en pausa, en algún alcance): es el
 *   «contacto mínimo del vínculo» (08 §11, dato C3). Antes de que acepte, después de que termine, o si no declaró un
 *   nombre, el profesional ve la referencia neutral («Asesorado · c36743»). El correo, nunca.
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
 * si no se puede (la API responde 422 INVALID_PROFILE_DATA). Para quitarlo, el cambio lleva `displayName: null`.
 */
export function nombreVisibleValido(nombre: string): string | null {
  const normalizado = normalizarNombreVisible(nombre);
  const largo = [...normalizado].length;
  if (largo < 1 || largo > LARGO_MAXIMO_DEL_NOMBRE_VISIBLE) return null;
  if (/[\p{Cc}\p{Cf}\p{Co}]/u.test(normalizado)) return null;
  return normalizado;
}

/** La referencia corta de una identidad: los últimos seis caracteres de su identificador, sin guiones. */
export const referenciaCorta = (identityId: string): string => identityId.replace(/-/g, '').slice(-6);

/** La referencia neutral con que el profesional ve a una persona sin nombre visible para él (DL-040). */
export const referenciaNeutral = (identityId: string): string => `Asesorado · ${referenciaCorta(identityId)}`;

/** Una versión del contrato: «v0», «v1»… */
const VersionDelPerfil = z.string().regex(/^v\d+$/);

export const PerfilPropioSchema = z.strictObject({
  /** El nombre visible, o `null` si la persona no declaró ninguno (o lo quitó). */
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
    /** El nombre nuevo (se normaliza al guardar) o `null` para quitarlo. */
    displayName: z.string().max(400).nullable(),
  }),
});
export type EditarPerfilPropioRequest = z.infer<typeof EditarPerfilPropioRequestSchema>;
