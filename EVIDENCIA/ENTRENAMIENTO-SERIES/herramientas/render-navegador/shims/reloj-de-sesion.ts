// El reloj de la sesión en el render del navegador: el mismo módulo de la APK (`apps/mobile/src/reloj-de-sesion.ts`), con
// el reloj del proceso detenido en un instante fijo. Así cada captura muestra siempre los mismos tiempos (el temporizador
// y el descanso no avanzan entre una captura y otra), y los eventos sintéticos de `api.ts` llevan el ancla de este
// «proceso»: se calculan como medidos, igual que en la APK cuando nada se cerró.
import { crearReloj } from '@movil-real/reloj-de-sesion';

export * from '@movil-real/reloj-de-sesion';

export const ANCLA_DEL_PROCESO = 'proceso-del-render';
/** El instante del render: martes 6 de octubre de 2026, 16:40 en Buenos Aires. Sintético. */
export const AHORA_CIVIL = Date.parse('2026-10-06T19:40:00.000Z');
/** El monotónico del render: como si la app llevara una hora abierta. */
export const AHORA_MONOTONICO = 3_600_000;

export const relojDelProceso = crearReloj({ ancla: ANCLA_DEL_PROCESO, monotonico: () => AHORA_MONOTONICO, civil: () => AHORA_CIVIL });
