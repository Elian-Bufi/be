/**
 * Avisos de llegada y retorno seguro: propios de la navegación del website. El copy compartido vive en @be/domain.
 */
export { COPY } from '@be/domain';

/** Avisos que la pantalla de login o de inicio puede mostrar al llegar (solo claves conocidas: nada del query se refleja). */
export const AVISOS = {
  'sesion-cerrada': 'Cerraste la sesión.',
  'sesiones-cerradas': 'Cerraste todas tus sesiones.',
  'sesion-no-valida': 'La sesión ya no es válida. Iniciá sesión para continuar.',
  reautenticar: 'Por seguridad, volvé a iniciar sesión para confirmar esta acción.',
  'cierre-registrado': 'Solicitud de cierre registrada.',
} as const;

export type ClaveDeAviso = keyof typeof AVISOS;

export function avisoDe(valor: string | null): string | null {
  return valor && Object.hasOwn(AVISOS, valor) ? AVISOS[valor as ClaveDeAviso] : null;
}

/** Retorno seguro después del login (10-B01:1146-1189): solo rutas propias conocidas. */
export function destinoSeguro(valor: string | null): '/account' {
  return valor === '/account' ? '/account' : '/account';
}
