/**
 * UF-07 de WP-USO-FINAL (DL-169; 08 §19) · Ayuda y contacto: el canal publicado de BE, con una dirección de soporte (la
 * app, la cuenta, entrar como profesional, recuperar el acceso) y una de privacidad (los datos y los derechos de la
 * persona). Las direcciones las define Dirección **por configuración de la API** (`BE_CONTACTO_SOPORTE` y
 * `BE_CONTACTO_PRIVACIDAD`): ninguna queda escrita en el código, y una APK instalada muestra la nueva sin reconstruirse,
 * porque la lee de API-SOP-01 cada vez que se abre la pantalla.
 * Sin configuración, la API responde `null` y las pantallas dicen que el canal todavía no está publicado: no inventan uno.
 */
import { z } from 'zod';

// ─── API-SOP-01 · El canal de ayuda y contacto ──────────────────────────────────────────────────

/** Una dirección de correo como la publica la API (ya validada y en minúsculas al leer la configuración). */
const DireccionPublicada = z.string().min(3).max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

export const CanalDeContactoResponseSchema = z.strictObject({
  data: z.strictObject({
    /** Soporte: la app, la cuenta, recuperar el acceso, entrar como profesional. `null` si todavía no se publicó. */
    supportEmail: DireccionPublicada.nullable(),
    /** Privacidad: los datos de la persona y sus derechos (08 §19). `null` si todavía no se publicó. */
    privacyEmail: DireccionPublicada.nullable(),
  }),
});
export type CanalDeContactoResponse = z.infer<typeof CanalDeContactoResponseSchema>;

/** Cuánto puede guardar un navegador la respuesta (segundos): un cambio de configuración se ve enseguida. */
export const CACHE_DEL_CANAL_DE_CONTACTO_S = 300;

/**
 * Una dirección de contacto de la configuración, normalizada (sin espacios y en minúsculas), o `null` si no es un correo.
 * La API la valida al arrancar; las pantallas no escriben ninguna.
 */
export function direccionDeContacto(texto: string | undefined | null): string | null {
  const limpia = (texto ?? '').trim().toLowerCase();
  return DireccionPublicada.safeParse(limpia).success ? limpia : null;
}

/** El `mailto:` de una dirección publicada, con un asunto opcional. */
export function enlaceDeCorreo(direccion: string, asunto?: string): string {
  return `mailto:${direccion}${asunto ? `?subject=${encodeURIComponent(asunto)}` : ''}`;
}

// ─── Los textos (website y APK) ─────────────────────────────────────────────────────────────────

export const COPY_AYUDA = {
  titulo: 'Ayuda y contacto',
  enlace: 'Ayuda y contacto',
  queEs: 'Escribinos por correo. Si es sobre tu cuenta, escribí desde el correo con que entrás a BE: así podemos verificar que sos vos.',
  cargando: 'Buscando el canal de contacto…',
  sinCanal: 'El canal de contacto todavía no está publicado.',
  sinRespuesta: 'No pudimos traer el canal de contacto. Revisá la conexión y probá de nuevo.',
  reintentar: 'Reintentar',
  soporte: {
    titulo: 'Soporte',
    queEs: 'La app, tu cuenta, recuperar el acceso o entrar como profesional.',
    escribir: 'Escribir a soporte',
    asunto: 'Ayuda con BE',
  },
  privacidad: {
    titulo: 'Privacidad',
    queEs: 'Tus datos y tus derechos: acceso, rectificación y supresión. También podés pedirlos desde «Tus datos».',
    escribir: 'Escribir a privacidad',
    asunto: 'Mis datos en BE',
  },
  /** Los casos más comunes, con lo que conviene escribir. */
  casos: [
    { titulo: 'No puedo entrar', texto: 'Probá primero «¿Olvidaste tu contraseña?». Si no te llega el código, escribí a soporte desde el correo de tu cuenta.' },
    // RF-004 (DL-172): la APK congelada (la 0.24 y, desde el 2026-11-13, la 0.27) no conoce GOOGLE_ACCOUNT_UNLINKED y
    // muestra su aviso general de servicio no disponible al entrar con una cuenta de Google desvinculada. Este caso le dice a la persona qué hacer.
    {
      titulo: 'Desvinculé Google y no puedo entrar',
      texto: 'Entrá con tu correo y tu contraseña de BE. Si al tocar «Continuar con Google» la app te dice que el servicio no está disponible, es porque esa cuenta de Google ya no entra a tu cuenta: no hace falta reintentar. Podés volver a vincularla desde tu cuenta, en «Cómo entrás».',
    },
    // Un profesional no sanitario no tiene matrícula (UF-D8: la API responde LICENSE_NOT_APPLICABLE): se le pide su formación.
    {
      titulo: 'Soy profesional y quiero usar BE',
      texto: 'Creá tu cuenta con tu nombre y escribí a soporte con tu matrícula (número y jurisdicción) si sos profesional de la salud, o tu formación si no, y las áreas en que trabajás.',
    },
    { titulo: 'Quiero mis datos o borrarlos', texto: 'En «Tus datos» podés descargar lo tuyo y pedir el acceso, la rectificación o la supresión. Si preferís, escribí a privacidad.' },
  ],
} as const;
