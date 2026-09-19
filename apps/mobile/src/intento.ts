/**
 * Escrituras del APK (09:253-262; 10-B04 §39; 10-B10:430-438):
 * - una Idempotency-Key por intento lógico; si el resultado es incierto, el reintento reusa la MISMA key y el servidor
 *   devuelve el resultado original en vez de ejecutar dos veces;
 * - después de una respuesta definitiva (éxito o error), el próximo intento es otro intento lógico, con key nueva;
 * - revocar B2 y A3 no lleva key (idempotentes por semántica, 09v8:1758): reintentar repite el POST.
 * Ningún fallo muestra su código: cada uno se traduce a un mensaje neutral (10-B01:1146-1189).
 */
import { COPY, COPY_VINCULO, type Resultado } from '@be/domain';
import { useMemo, useRef } from 'react';
import { nuevaClaveDeIdempotencia } from './api';

/** Sin respuesta, o con una que la UI no reconoce: no se sabe si la acción ocurrió. */
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
      /** Quien usa la pantalla abandona el intento (cambia de decisión o cierra la confirmación). */
      descartar(): void {
        clave.current = null;
      },
    }),
    [],
  );
}

/**
 * Qué hace la UI con un fallo:
 * - `incierto`: se ofrece «Reintentar» con la misma key;
 * - `actualizar`: lo que la pantalla mostró ya no es lo vigente (otra parte, el sistema o una versión nueva lo
 *   cambiaron) y hay que recargar antes de volver a intentar;
 * - `no-revelable`: 404 idéntico para inexistente, ajeno o revocado (10-B04 §40), con «Volver»;
 * - `otro`: el servicio no respondió como se esperaba; se puede probar de nuevo más tarde.
 */
export interface Fallo {
  readonly mensaje: string;
  readonly tipo: 'incierto' | 'actualizar' | 'no-revelable' | 'otro';
}

export function falloDe(r: Resultado<unknown>, propios: Readonly<Record<string, Fallo>> = {}): Fallo {
  if (r.ok) return { mensaje: COPY.noDisponible, tipo: 'otro' };
  if (esIncierto(r) || r.tipo !== 'API') return { mensaje: COPY.resultadoIncierto, tipo: 'incierto' };
  if (Object.hasOwn(propios, r.codigo)) return propios[r.codigo] as Fallo;
  switch (r.codigo) {
    case 'RESOURCE_NOT_FOUND':
      return { mensaje: COPY_VINCULO.noPudimosAbrir, tipo: 'no-revelable' };
    case 'VERSION_CONFLICT':
    case 'CONSENT_VERSION_STALE':
    // 409 de conflicto concurrente: otra operación tomó el recurso al mismo tiempo (09 §3).
    case 'RESOURCE_CONFLICT':
    // 422 de estado: la UI solo ofrece lo que admite el estado que mostró, así que el estado cambió por otra vía.
    case 'INVALID_STATE_TRANSITION':
    case 'RELATIONSHIP_NOT_READY_FOR_CONSENT':
      return { mensaje: COPY_VINCULO.contenidoCambio, tipo: 'actualizar' };
    default:
      return { mensaje: COPY.noDisponible, tipo: 'otro' };
  }
}
