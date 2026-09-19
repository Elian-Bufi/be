'use client';

/**
 * Intentos de escritura (09:253-262; 10-B10:430-438):
 * - una Idempotency-Key por intento lógico; el reintento de un resultado incierto reusa la misma, así el servidor
 *   devuelve el resultado original en vez de ejecutar dos veces;
 * - después de una respuesta definitiva (éxito o error), el próximo intento es otro intento lógico y usa una key nueva.
 */
import { COPY, COPY_VINCULO } from '@be/domain';
import { useMemo, useRef } from 'react';
import { nuevaClaveDeIdempotencia, type Resultado } from './api';

/** Sin respuesta, o una respuesta que la UI no reconoce: no se sabe si la acción ocurrió. */
export function esIncierto(r: Resultado<unknown>): boolean {
  return !r.ok && (r.tipo === 'RED' || r.codigo === 'RESPUESTA_NO_RECONOCIDA');
}

export function useClaveDeIntento() {
  const clave = useRef<string | null>(null);
  return useMemo(
    () => ({
      /** La key del intento en curso; se crea al primer uso. */
      actual(): string {
        clave.current ??= nuevaClaveDeIdempotencia();
        return clave.current;
      },
      /** Después de cada respuesta: solo un resultado incierto conserva la key para el reintento. */
      registrar(r: Resultado<unknown>): void {
        if (!esIncierto(r)) clave.current = null;
      },
      /** El usuario abandona un intento que terminó sin resultado incierto. */
      descartar(): void {
        clave.current = null;
      },
    }),
    [],
  );
}

/**
 * Mensaje para un fallo de escritura, sin códigos (10-B01:1146-1189). `noRevelable` es el texto neutral del 404 de
 * la parte que mira: «No pudimos abrir este contenido.» para el asesorado, el de 10-B10:407 para el profesional.
 */
export function mensajeDeFallo(r: Resultado<unknown>, noRevelable: string = COPY_VINCULO.noPudimosAbrir): string {
  if (r.ok) return '';
  if (esIncierto(r)) return COPY.resultadoIncierto;
  if (r.tipo !== 'API') return COPY.noDisponible;
  switch (r.codigo) {
    case 'VERSION_CONFLICT':
    case 'CONSENT_VERSION_STALE':
    // 409 de conflicto concurrente: otra operación tomó el recurso al mismo tiempo (09 §3).
    case 'RESOURCE_CONFLICT':
      return COPY_VINCULO.contenidoCambio;
    case 'RESOURCE_NOT_FOUND':
      return noRevelable;
    case 'INVALID_STATE_TRANSITION':
    case 'RELATIONSHIP_NOT_READY_FOR_CONSENT':
      // El estado cambió por otra vía (la otra parte, el sistema): se pide actualizar, sin explicar el motor.
      return COPY_VINCULO.contenidoCambio;
    default:
      return COPY.noDisponible;
  }
}
