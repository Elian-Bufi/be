'use client';

/**
 * El autoguardado de un borrador (bloque 3 del encargo de consolidación). Guarda la preparación con la operación de
 * borrador que ya existe y su control de versión (`expectedVersion`): no activa planes, no registra revisiones ni
 * confirma actos profesionales.
 * - Espera una pausa en la edición (`demoraMs`) y solo corre cuando se puede guardar: nada mal escrito, ningún guardado
 *   en curso, ningún conflicto sin resolver ni un diálogo de un acto abierto.
 * - **ED-60:** un rechazo que no se arregla solo (demasiado grande u otro rechazo del contrato) no se reintenta hasta que
 *   cambie lo escrito o el profesional toque «Reintentar»; sin respuesta, los intentos se espacian (8, 16, 32 y 60 s) y
 *   vuelven a 4 s con el evento `online` o con un cambio (`espera-del-autoguardado.ts`).
 * - Si se pierde la conexión, lo escrito sigue en pantalla durante la sesión.
 * - No guarda nada en el navegador: un borrador es información de salud, y lo que nunca llegó al servidor no se promete
 *   recuperar después de cerrar la página.
 *
 * El editor informa el resultado de cada intento (el automático y el del profesional) con `informar`.
 */
import { useEffect, useRef } from 'react';
import { PlanificadorDelAutoguardado, type ResultadoDelIntento } from './espera-del-autoguardado';

export { DEMORA_DEL_AUTOGUARDADO_MS, type ResultadoDelIntento } from './espera-del-autoguardado';

export interface Autoguardado {
  /**
   * El resultado de un intento de guardar, automático o del profesional. `conCambiosDespues`: lo escrito cambió mientras
   * el guardado viajaba (un rechazo de lo anterior no frena lo nuevo).
   */
  informar(r: ResultadoDelIntento, conCambiosDespues?: boolean): void;
}

export function useAutoguardado({ habilitado, cambios, guardar, demoraMs }: { habilitado: boolean; cambios: unknown; guardar: () => void; demoraMs?: number }): Autoguardado {
  const ultimo = useRef(guardar);
  ultimo.current = guardar;
  const planificador = useRef<PlanificadorDelAutoguardado | null>(null);
  const deLaPagina = (): PlanificadorDelAutoguardado => {
    planificador.current ??= new PlanificadorDelAutoguardado(
      () => ultimo.current(),
      { setTimeout: (f, ms) => window.setTimeout(f, ms), clearTimeout: (t) => window.clearTimeout(t as number) },
      demoraMs,
    );
    return planificador.current;
  };

  // Cada cambio reinicia la espera: se guarda en la primera pausa, aunque el intento anterior se haya rechazado.
  useEffect(() => {
    deLaPagina().cambio();
    // `deLaPagina` solo lee refs: no hace falta en las dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cambios]);

  // Mientras no se puede guardar (un guardado en viaje, un cuadro abierto, algo mal escrito), se espera.
  useEffect(() => {
    const p = deLaPagina();
    if (habilitado) p.reanudar();
    else p.pausar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habilitado]);

  // Al volver la conexión, la espera vuelve a 4 s.
  useEffect(() => {
    const alVolver = () => deLaPagina().enLinea();
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al salir del editor, nada queda programado.
  useEffect(() => () => planificador.current?.detener(), []);

  return { informar: (r, conCambiosDespues) => deLaPagina().resultado(r, conCambiosDespues) };
}
