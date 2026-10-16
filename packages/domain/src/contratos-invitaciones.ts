/**
 * WP-INVITACION (DEUDA_LEGAJO DL-136; aprobado por Dirección el 2026-10-16): el profesional invita a una persona con un
 * enlace, un QR (el mismo enlace) o un código corto, en lugar de que la persona copie su identificador BE y se lo pase por
 * fuera de BE (DL-035, opción A provisoria). IDs propios de BE, familia INV (API-INV-01 a 05).
 * - **La invitación no es una solicitud** (06 §7.4; REG-06-46; INV-06-55 e INV-06-56): usarla crea una solicitud de
 *   vínculo PENDIENTE iniciada por el profesional y dirigida a quien la usa, exactamente como REL-01. Aceptar la solicitud
 *   y otorgar B2 siguen siendo actos explícitos y separados.
 * - **Un solo uso, vence a los 7 días, el profesional la puede anular, y no revela datos personales** (08 §24.3 y §24.5).
 * - **El token y el código se muestran una sola vez** (al crearla): BE guarda solo su SHA-256 (08 §24.3: «persistido
 *   solo como hash»). El enlace lleva el token en el fragmento (`#t=`), que el navegador no manda al servidor: no queda en
 *   ningún registro de acceso.
 * Este archivo es neutral respecto de la plataforma (lo usan la API, el website y la APK): genera el código desde bytes
 * que le pasa quien llama, sin `node:crypto`.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { FinalidadSchema, PaginaSchema, ResumenDeAlcanceSchema } from './contratos-vinculo';

// ─── El token y el código ─────────────────────────────────────────────────────────────────────

/** Bytes aleatorios del token del enlace: 256 bits, en base64url sin relleno (43 caracteres). */
export const BYTES_DEL_TOKEN_DE_INVITACION = 32;
/** El token tal como viaja: base64url de 32 bytes, sin relleno. */
export const TokenDeInvitacionSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

/**
 * Alfabeto del código: 32 símbolos sin los que se confunden al leer o al dictar (sin 0, 1, I ni O). 32 = 2^5: cada símbolo
 * son 5 bits exactos, así que el código sale uniforme sin descartar nada.
 */
export const ALFABETO_DEL_CODIGO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
/** 8 símbolos = 40 bits (unas 1,1 × 10^12 combinaciones), con límite de intentos en la API. */
export const LARGO_DEL_CODIGO = 8;
/** Los bytes que consume `codigoDesdeBytes`: 5 bytes = 40 bits = 8 símbolos de 5 bits. */
export const BYTES_DEL_CODIGO = 5;
/** El código como se muestra: `XXXX-XXXX`. */
export const CodigoDeInvitacionSchema = z.string().regex(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);

/** Dirección aprobó 7 días el 2026-10-16. La base no admite una vigencia mayor (CHECK en la migración). */
export const VIGENCIA_DE_LA_INVITACION_DIAS = 7;
export const VIGENCIA_DE_LA_INVITACION_MS = VIGENCIA_DE_LA_INVITACION_DIAS * 24 * 60 * 60 * 1000;

/**
 * Los 8 símbolos del código a partir de los primeros 5 bytes (40 bits, de a 5 bits, del más significativo al menos).
 * 40 bits entran enteros en un número de JavaScript (2^53), sin BigInt.
 */
export function codigoDesdeBytes(bytes: Uint8Array): string {
  if (bytes.length < BYTES_DEL_CODIGO) throw new RangeError(`hacen falta ${BYTES_DEL_CODIGO} bytes`);
  let bits = 0;
  for (let i = 0; i < BYTES_DEL_CODIGO; i++) bits = bits * 256 + (bytes[i] as number);
  let codigo = '';
  for (let i = LARGO_DEL_CODIGO - 1; i >= 0; i--) codigo += ALFABETO_DEL_CODIGO[Math.floor(bits / 2 ** (i * 5)) % 32];
  return codigo;
}

/** `ABCDEFGH` → `ABCD-EFGH`, para mostrarlo o dictarlo. */
export function formatearCodigo(codigo: string): string {
  return `${codigo.slice(0, 4)}-${codigo.slice(4)}`;
}

/**
 * El código como lo escribió la persona, normalizado antes de calcular su hash: mayúsculas, sin espacios ni guiones (el
 * guion común y los que ponen los teclados del teléfono: ‐ ‑ ‒ – — −). Devuelve `null` si no tiene 8 símbolos del
 * alfabeto: la API responde lo mismo que con un código que no existe (sin enumeración).
 */
export function normalizarCodigo(texto: string): string | null {
  const limpio = texto.toUpperCase().replace(/[\s\-‐‑‒–—−]/g, '');
  if (limpio.length !== LARGO_DEL_CODIGO) return null;
  for (const simbolo of limpio) if (!ALFABETO_DEL_CODIGO.includes(simbolo)) return null;
  return limpio;
}

/** Si el texto tiene la forma de un token de invitación (sin espacios alrededor). */
export function esTokenDeInvitacion(texto: string): boolean {
  return TokenDeInvitacionSchema.safeParse(texto.trim()).success;
}

/**
 * El enlace que comparte el profesional (WhatsApp, QR): el token va en el fragmento, que el navegador no manda al
 * servidor. `origenWeb` es el origen del website, sin ruta (`https://…`).
 */
export function enlaceDeInvitacion(origenWeb: string, token: string): string {
  return `${origenWeb.replace(/\/+$/, '')}/invitacion#t=${token}`;
}

/** El token del fragmento de `/invitacion` (`#t=…`), o `null` si no hay uno con forma válida. */
export function tokenDelFragmento(fragmento: string): string | null {
  const valor = new URLSearchParams(fragmento.replace(/^#/, '')).get('t');
  return valor !== null && esTokenDeInvitacion(valor) ? valor.trim() : null;
}

// ─── El estado ────────────────────────────────────────────────────────────────────────────────

/**
 * El estado se deriva: la invitación y su resolución (usada o anulada) solo se agregan, y el vencimiento es una fecha.
 * PENDING: se puede usar · USED: ya la usó alguien · EXPIRED: pasaron los 7 días sin usarla · REVOKED: el profesional la
 * anuló.
 */
export const ESTADOS_DE_INVITACION = ['PENDING', 'USED', 'EXPIRED', 'REVOKED'] as const;
export const EstadoDeInvitacionSchema = z.enum(ESTADOS_DE_INVITACION);
export type EstadoDeInvitacion = z.infer<typeof EstadoDeInvitacionSchema>;

/** La resolución registrada de una invitación, si la tiene. */
export type ResolucionDeInvitacion = 'USADA' | 'REVOCADA';

/** Una resolución manda sobre el vencimiento: una invitación usada sigue «usada» después de su fecha. */
export function estadoDeInvitacion(i: { readonly resolucion: ResolucionDeInvitacion | null; readonly venceEn: Date }, ahora: Date): EstadoDeInvitacion {
  if (i.resolucion === 'USADA') return 'USED';
  if (i.resolucion === 'REVOCADA') return 'REVOKED';
  return i.venceEn.getTime() <= ahora.getTime() ? 'EXPIRED' : 'PENDING';
}

// ─── API-INV-01 — Crear una invitación ────────────────────────────────────────────────────────

/**
 * El alcance y su finalidad, con las mismas reglas que REL-01 (09v8:1108-1192): fuera del catálogo → 422
 * SCOPE_NOT_AVAILABLE; finalidad vacía → 422 PURPOSE_REQUIRED; ajena al alcance → 422 VALIDATION_FAILED (REG-06-61). El
 * profesional confirma la finalidad al invitar (05 UC-P04, paso 7).
 */
export const CrearInvitacionRequestSchema = z.strictObject({
  scope: z.strictObject({ code: z.string() }),
  purpose: z.string(),
});
export type CrearInvitacionRequest = z.infer<typeof CrearInvitacionRequestSchema>;

/** Una invitación vista por su profesional. Nunca trae el token ni el código: esos se muestran solo al crearla. */
export const InvitacionSchema = z.strictObject({
  invitationId: IdOpaco,
  scope: ResumenDeAlcanceSchema,
  purpose: FinalidadSchema,
  state: EstadoDeInvitacionSchema,
  createdAt: Instante,
  expiresAt: Instante,
  /** Cuándo la usaron, si la usaron. */
  usedAt: Instante.nullable(),
  /** Cuándo la anuló el profesional, si la anuló. */
  revokedAt: Instante.nullable(),
  /** La solicitud de vínculo que nació al usarla (la del profesional, visible también en REL-02), si la usaron. */
  relationshipRequestId: IdOpaco.nullable(),
});
export type Invitacion = z.infer<typeof InvitacionSchema>;

/**
 * 201: la invitación con su token y su código, la única vez que se muestran. El website arma el enlace con
 * `enlaceDeInvitacion`; el código se muestra como `XXXX-XXXX`. Un reintento con la misma Idempotency-Key responde lo
 * mismo (BE los vuelve a calcular: no los guarda).
 */
export const InvitacionCreadaResponseSchema = z.strictObject({
  data: InvitacionSchema.extend({ token: TokenDeInvitacionSchema, code: CodigoDeInvitacionSchema }),
});
export type InvitacionCreadaResponse = z.infer<typeof InvitacionCreadaResponseSchema>;

// ─── API-INV-02 y API-INV-03 — Las propias y anular ───────────────────────────────────────────

export const ListaDeInvitacionesResponseSchema = z.strictObject({ data: z.array(InvitacionSchema), page: PaginaSchema });
export type ListaDeInvitacionesResponse = z.infer<typeof ListaDeInvitacionesResponseSchema>;

/** API-INV-03: la invitación anulada. */
export const InvitacionResponseSchema = z.strictObject({ data: InvitacionSchema });
export type InvitacionResponse = z.infer<typeof InvitacionResponseSchema>;

// ─── API-INV-04 y API-INV-05 — Ver y usar ─────────────────────────────────────────────────────

/**
 * El token del enlace o el código, en el cuerpo (nunca en la URL). Uno de los dos. Un token o un código mal formados
 * responden el mismo 404 que uno que no existe: la forma no se valida acá, para no dar una respuesta distinta.
 */
export const SecretoDeInvitacionRequestSchema = z.union([
  z.strictObject({ token: z.string().min(1).max(128) }),
  z.strictObject({ code: z.string().min(1).max(32) }),
]);
export type SecretoDeInvitacionRequest = z.infer<typeof SecretoDeInvitacionRequestSchema>;

/**
 * API-INV-04: lo que la persona ve antes de decidir («<nombre> te invita a acompañarte en <área>. ¿Aceptás?»). Sin
 * identificadores ni datos del profesional fuera de su nombre visible (DL-040), y sin nada de quien la haya usado.
 */
export const VistaPreviaDeInvitacionResponseSchema = z.strictObject({
  data: z.strictObject({
    professional: z.strictObject({ displayName: z.string() }),
    scope: ResumenDeAlcanceSchema,
    purpose: FinalidadSchema,
    expiresAt: Instante,
    state: EstadoDeInvitacionSchema,
  }),
});
export type VistaPreviaDeInvitacionResponse = z.infer<typeof VistaPreviaDeInvitacionResponseSchema>;

// API-INV-05 responde exactamente como REL-01: 201 con la solicitud creada (`CrearSolicitudDeVinculoResponseSchema`) o 200
// con la equivalente pendiente (`SolicitudDeduplicadaResponseSchema`). La aceptación (REL-03) y B2 (CON-01/02) siguen
// siendo los de siempre.
