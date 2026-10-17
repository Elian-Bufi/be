/**
 * WP-ACCESO-GOOGLE (DEUDA_LEGAJO DL-138; aprobado por Dirección el 2026-10-16): entrar a BE con Google, verificado por
 * la API de BE. RF-003 (P1), 05 UC-E05, 06 B-01 §5.6 («Método de acceso»: local o federado, nunca una identidad
 * paralela), 08 §24.1 y 09 §12 («Google federated authorize/complete — P1», solo bosquejado). IDs propios de BE, familia
 * GOO (API-GOO-01 a 03).
 * - **El cliente consigue un ID token de Google** (Google Identity Services en el website, Google Sign-In en la APK)
 *   y lo manda en el cuerpo, nunca en la URL. La API lo verifica contra las claves públicas de Google: firma RS256,
 *   emisor, audiencia (los client IDs de BE), vencimiento y correo verificado. No hay secreto de cliente en los
 *   dispositivos ni Firebase Authentication.
 * - **BE sigue siendo la fuente de identidad** (08 §24.1): Google es un método de acceso de la identidad BE, con sus
 *   sesiones, su revocación y sus permisos de siempre. Una sesión abierta con Google es igual a la de API-ACC-02.
 * - **Nunca se vincula sola** (UC-E05 E02; 06 REG-06-21): si ya hay una cuenta BE con contraseña y ese correo, Google se
 *   le agrega solo después de que la persona confirma esa contraseña (API-GOO-02).
 * - **El alta con Google** (API-GOO-03) registra los mismos actos que el alta local: A1, A2 y la declaración de mayoría
 *   de edad (08 §24.7 a).
 */
import { z } from 'zod';
import { DeclaracionDeMayoriaDeEdadSchema, IdOpaco, IniciarSesionResponseSchema, RegistrationIntentSchema } from './contratos';

/**
 * El ID token de Google tal como lo entrega Google: un JWT firmado con RS256 (un poco más de mil caracteres). El tope
 * deja margen y corta antes de decodificar algo desmedido. Viaja solo en el cuerpo: nunca en la URL ni en un registro.
 */
export const LARGO_MAXIMO_DEL_ID_TOKEN = 4096;
export const IdTokenDeGoogleSchema = z.string().min(1).max(LARGO_MAXIMO_DEL_ID_TOKEN);

// ─── API-GOO-01 — Iniciar sesión con Google ───────────────────────────────────────────────────
export const IniciarSesionConGoogleRequestSchema = z.strictObject({ idToken: IdTokenDeGoogleSchema });
export type IniciarSesionConGoogleRequest = z.infer<typeof IniciarSesionConGoogleRequestSchema>;

// ─── API-GOO-02 — Vincular Google a la cuenta con contraseña ──────────────────────────────────
/** `credential` es la contraseña de la cuenta BE, como en API-ACC-02: se verifica con las mismas reglas y límites. */
export const VincularGoogleRequestSchema = z.strictObject({ idToken: IdTokenDeGoogleSchema, credential: z.string() });
export type VincularGoogleRequest = z.infer<typeof VincularGoogleRequestSchema>;

// ─── API-GOO-03 — Crear la cuenta con Google ──────────────────────────────────────────────────
/** Los mismos actos que API-ACC-01, con la versión que la pantalla mostró. Sin contraseña: la cuenta entra con Google. */
export const RegistrarConGoogleRequestSchema = z.strictObject({
  idToken: IdTokenDeGoogleSchema,
  registrationIntent: RegistrationIntentSchema,
  termsAcceptance: z.strictObject({ versionId: IdOpaco }),
  privacyAcknowledgement: z.strictObject({ versionId: IdOpaco }),
  /** Obligatoria (08 §24.7 a); optativa en el schema para que falte con un 422 preciso, como en API-ACC-01. */
  adultDeclaration: DeclaracionDeMayoriaDeEdadSchema.optional(),
});
export type RegistrarConGoogleRequest = z.infer<typeof RegistrarConGoogleRequestSchema>;

/** Las tres responden la sesión exactamente como API-ACC-02: el cliente la guarda y la usa igual. */
export const SesionConGoogleResponseSchema = IniciarSesionResponseSchema;

/**
 * `error.details` de GOOGLE_LINK_REQUIRED y GOOGLE_ACCOUNT_NOT_FOUND: el correo verificado de la cuenta de Google, para
 * que la pantalla diga con qué correo sigue sin decodificar el token. Quien lo recibe es quien mandó el token.
 */
export const DetalleDeCuentaDeGoogleSchema = z.strictObject({ email: z.string().min(1) });
export type DetalleDeCuentaDeGoogle = z.infer<typeof DetalleDeCuentaDeGoogleSchema>;

/** Las rutas de la familia GOO, bajo el prefijo que bosqueja el 09 v0.12 §11 («/auth/federated/google/…»). */
export const RUTAS_DE_ACCESO_GOOGLE = {
  sesiones: '/auth/federated/google/sessions',
  vinculos: '/auth/federated/google/links',
  registros: '/auth/federated/google/registrations',
} as const;
