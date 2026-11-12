/**
 * ED-41 (WP-EDITORES-PROFESIONAL) · Invitar y pedir el vínculo, sin ambigüedad, sin React: las dos entradas con su
 * subtítulo, los estados en palabras y el vencimiento con fecha y hora.
 *
 * - **Dos caminos distintos, dichos en el botón:** invitar a alguien que todavía no usa BE (enlace, QR o código) o pedir
 *   el vínculo a quien ya lo usa (con su identificador).
 * - **Ningún estado pendiente se dice como un acceso** (TEST-EDP-035): una invitación creada no es un vínculo, y una
 *   solicitud pendiente no deja ver nada. Aceptar el vínculo tampoco abre los datos: el acceso lo decide la persona.
 * - Los textos de siempre del dominio (`COPY_INVITACION`, `COPY_VINCULO`) no cambian: lo leen la APK y la API.
 */

export const ENTRADAS_DEL_VINCULO = {
  invitar: { titulo: 'Invitar a alguien nuevo', subtitulo: 'enlace, QR o código' },
  pedir: { titulo: 'Pedir el vínculo a quien ya usa BE', subtitulo: 'con su identificador' },
} as const;

export type EstadoDeInvitacion = 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED';
export type EstadoDeSolicitudDeVinculo = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CADUCADA' | 'INVALIDADA';

/** El estado de una invitación, en palabras. */
export const ESTADO_DE_LA_INVITACION: Readonly<Record<EstadoDeInvitacion, string>> = {
  PENDING: 'Invitación creada · todavía no la usó',
  USED: 'Usada · el vínculo empezó; el acceso a sus datos lo decide la persona',
  EXPIRED: 'Vencida · no se usó a tiempo',
  REVOKED: 'Anulada · el enlace y el código ya no sirven',
};

/** El estado de una solicitud de vínculo enviada, con el nombre de la persona cuando espera su respuesta. */
export function estadoDeLaSolicitud(estado: EstadoDeSolicitudDeVinculo, persona: string | null): string {
  switch (estado) {
    case 'PENDIENTE':
      return persona ? `Pendiente de respuesta de ${persona}` : 'Pendiente de respuesta';
    case 'ACEPTADA':
      return 'Aceptada · el acceso a sus datos lo decide la persona';
    case 'RECHAZADA':
      return 'Rechazada';
    case 'CADUCADA':
      return 'Caducada · no respondió a tiempo';
    case 'INVALIDADA':
      return 'Sin efecto';
  }
}

/** «Vence el 19 de noviembre a las 14:30», en la hora de Buenos Aires. */
export function venceElDiaYHora(iso: string): string {
  const d = new Date(iso);
  const zona = 'America/Argentina/Buenos_Aires';
  const dia = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', timeZone: zona }).format(d);
  const hora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: zona }).format(d);
  return `Vence el ${dia} a las ${hora}.`;
}
