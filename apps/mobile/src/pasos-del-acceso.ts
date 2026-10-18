/**
 * Lo que le falta a cada vínculo aceptado para que el acceso sea efectivo, de lo que la persona puede ocuparse (pedido
 * de Dirección del 2026-10-17): su autorización al profesional, o el tratamiento de datos de salud (A3). Si el acceso no
 * es efectivo por otra razón (una que la persona no puede resolver), no se le pide nada.
 */
import type { Vinculo } from '@be/domain';

export interface PasoQueFalta {
  readonly vinculo: Vinculo;
  readonly que: 'autorizar' | 'tratamiento';
}

export function pasosQueFaltan(vinculos: readonly Vinculo[], a3Vigente: boolean): PasoQueFalta[] {
  const faltan: PasoQueFalta[] = [];
  for (const v of vinculos) {
    if (v.relationshipState !== 'ACEPTADO') continue;
    if (v.consentState === 'REQUIRED') faltan.push({ vinculo: v, que: 'autorizar' });
    else if (v.consentState === 'ACTIVE' && v.accessMode !== 'CONTEXTUAL' && !a3Vigente) faltan.push({ vinculo: v, que: 'tratamiento' });
  }
  return faltan;
}
