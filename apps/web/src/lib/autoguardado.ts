'use client';

/**
 * El autoguardado de un borrador (bloque 3 del encargo de consolidación). Guarda la preparación con la operación de
 * borrador que ya existe y su control de versión (`expectedVersion`): no activa planes, no registra revisiones ni
 * confirma actos profesionales.
 * - Espera una pausa en la edición (`demoraMs`) y solo corre cuando se puede guardar: nada mal escrito, ningún guardado
 *   en curso, ningún conflicto sin resolver ni un diálogo de un acto abierto.
 * - Si se pierde la conexión, lo escrito sigue en pantalla durante la sesión, y al volver la conexión se reintenta.
 * - No guarda nada en el navegador: un borrador es información de salud, y lo que nunca llegó al servidor no se promete
 *   recuperar después de cerrar la página.
 */
import { useEffect, useRef } from 'react';

export const DEMORA_DEL_AUTOGUARDADO_MS = 4_000;

export function useAutoguardado({ habilitado, cambios, guardar, demoraMs = DEMORA_DEL_AUTOGUARDADO_MS }: { habilitado: boolean; cambios: unknown; guardar: () => void; demoraMs?: number }): void {
  const ultimo = useRef(guardar);
  ultimo.current = guardar;

  // Cada cambio reinicia la espera: se guarda en la primera pausa.
  useEffect(() => {
    if (!habilitado) return;
    const temporizador = window.setTimeout(() => ultimo.current(), demoraMs);
    return () => window.clearTimeout(temporizador);
  }, [habilitado, cambios, demoraMs]);

  // Al volver la conexión, si hay algo pendiente, se reintenta enseguida.
  useEffect(() => {
    if (!habilitado) return;
    const alVolver = () => ultimo.current();
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  }, [habilitado]);
}
