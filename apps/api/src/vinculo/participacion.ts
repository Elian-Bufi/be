import { puedeActuarComoProfesional } from '../sesion/sesion-de-la-solicitud';

/**
 * UF-11 de WP-USO-FINAL (DL-169; UF-D12): de qué lado de un vínculo participa el actor en este pedido. Como persona,
 * siempre; como profesional, solo si su sesión tiene el segundo factor del profesional verificado. Sin él, lo suyo como
 * profesional no existe para esa sesión: las listas no lo traen, y el detalle o una transición responden el mismo 404 que
 * lo ajeno (09:226). Lo de la persona sigue igual, también para la APK.
 */
export function participaciones(identidadId: string): ({ readonly profesionalId: string } | { readonly asesoradoId: string })[] {
  return puedeActuarComoProfesional(identidadId) ? [{ profesionalId: identidadId }, { asesoradoId: identidadId }] : [{ asesoradoId: identidadId }];
}
