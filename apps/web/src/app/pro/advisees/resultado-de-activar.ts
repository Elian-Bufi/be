/**
 * ED-62 · Activar después de un 409 o un 422 (WP-EDITORES-PROFESIONAL; V3 V-02: «si una activación se procesó pero se
 * perdió la respuesta, se debe consultar el estado antes de repetir»).
 *
 * Antes, un 409 o un 422 al activar decía «No pudimos activar el plan. Probá de nuevo.», y reintentar daba lo mismo; sin
 * respuesta, «Volver» tiraba la clave del intento. Ahora:
 * - con un 409, un 422 sin problemas con lugar, o sin respuesta, el cuadro **relee la versión** antes de decir nada;
 * - si quedó activada: «Ya quedó activa»; si ya no está (se descartó en otra pestaña): se dice; si cambió en otra pestaña:
 *   el conflicto; con un 422 de la validación: lo que impide activar, con su lugar;
 * - cada código tiene su texto, sin códigos a la vista y sin un «Probá de nuevo» genérico;
 * - con el resultado incierto, la clave se conserva y el intento siguiente (el mismo pedido) la reusa.
 *
 * Sin React ni red.
 */
import type { Resultado, ValidationIssue } from '@be/domain';

/** Lo que se sabe de la versión al releerla: su estado y su token, o que ya no está (el 404 de lo inexistente). */
export type VersionReleida = { readonly estado: 'DRAFT' | 'ACTIVATED'; readonly version: string } | { readonly estado: 'NO_ESTA' };

export type LoQuePasoAlActivar =
  | { readonly tipo: 'ACTIVADA' }
  | { readonly tipo: 'YA_QUEDO_ACTIVA' }
  | { readonly tipo: 'YA_NO_ESTA' }
  | { readonly tipo: 'IMPIDE'; readonly problemas: readonly ValidationIssue[] }
  | { readonly tipo: 'CAMBIO_EN_OTRA_PESTANA' }
  | { readonly tipo: 'OTRO_PLAN_VIGENTE' }
  | { readonly tipo: 'SIN_CAPACIDAD' }
  | { readonly tipo: 'SU_APP' }
  | { readonly tipo: 'INCIERTO' }
  | { readonly tipo: 'OTRO' };

const sinRespuesta = (r: Resultado<unknown>): boolean => !r.ok && (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA');

/** Si hace falta releer la versión antes de decir qué pasó: un 409, un 422 sin problemas con lugar, o sin respuesta. */
export function hayQueReleer(r: Resultado<unknown>): boolean {
  if (r.ok) return false;
  if (sinRespuesta(r)) return true;
  return r.tipo === 'API' && (r.status === 409 || (r.status === 422 && r.issues.length === 0));
}

/**
 * Lo que pasó al activar. La versión releída manda: si quedó activada, ya está, aunque la respuesta se haya perdido o
 * haya sido un rechazo (el pedido anterior ya la había activado).
 */
export function loQuePasoAlActivar(r: Resultado<unknown>, releida: VersionReleida | null, versionQueSeMando: string): LoQuePasoAlActivar {
  if (r.ok) return { tipo: 'ACTIVADA' };
  if (releida?.estado === 'ACTIVATED') return { tipo: 'YA_QUEDO_ACTIVA' };
  if (releida?.estado === 'NO_ESTA') return { tipo: 'YA_NO_ESTA' };
  // Sin respuesta: si el borrador ya no es el que se mandó, cambió en otra pestaña; si es el mismo, no se sabe todavía
  // (el intento siguiente, con el mismo pedido, reusa la clave).
  if (sinRespuesta(r)) return releida?.estado === 'DRAFT' && releida.version !== versionQueSeMando ? { tipo: 'CAMBIO_EN_OTRA_PESTANA' } : { tipo: 'INCIERTO' };
  if (r.tipo !== 'API') return { tipo: 'OTRO' };
  if (r.issues.length > 0) return { tipo: 'IMPIDE', problemas: r.issues };
  switch (r.codigo) {
    case 'ACTIVE_PLAN_CONFLICT':
      return { tipo: 'OTRO_PLAN_VIGENTE' };
    case 'CAPACITY_NOT_AVAILABLE':
      return { tipo: 'SIN_CAPACIDAD' };
    case 'CLIENT_CAPABILITY_REQUIRED':
      return { tipo: 'SU_APP' };
    case 'VERSION_CONFLICT':
    case 'RESOURCE_CONFLICT':
    case 'INVALID_STATE_TRANSITION':
    case 'PLAN_NOT_EDITABLE':
      // No quedó activada ni se descartó (lo dijo la relectura): el borrador cambió en otra pestaña.
      return { tipo: 'CAMBIO_EN_OTRA_PESTANA' };
    default:
      return { tipo: 'OTRO' };
  }
}

/** Los textos de cada resultado: en palabras, sin códigos. */
export const COPY_RESULTADO_DE_ACTIVAR = {
  yaQuedoActiva: (numero: number): string => `Ya quedó activa. La versión ${numero} es la vigente, y la persona ya la ve.`,
  yaNoEsta: 'Esta versión ya no está: se descartó en otra pestaña. No se activó nada.',
  impide: 'Hay cosas por corregir antes de activar: están arriba, cada una con su lugar.',
  cambioEnOtraPestana: 'Este borrador cambió en otra pestaña o en otro equipo, así que no se activó. Volvé al plan y cargá la versión guardada.',
  otroPlanVigente: (area: string): string => `La persona ya tiene un plan de ${area} vigente con otro profesional. No se activó nada.`,
  sinCapacidad: 'No hay capacidad disponible para iniciar un nuevo seguimiento. Los seguimientos vigentes no se modifican.',
  incierto: 'No hubo respuesta y no pudimos comprobar si se activó. Volvé a intentarlo: se manda el mismo pedido, así no se activa dos veces.',
  otro: 'No pudimos activar la versión: el servicio no respondió como esperábamos. Volvé a intentarlo en un momento.',
} as const;
