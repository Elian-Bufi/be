// El reloj de la sesión en el modo de la API real: el mismo módulo de la APK (`apps/mobile/src/reloj-de-sesion.ts`), con
// sus relojes detenidos, que avanzan solo cuando el recorrido los adelanta (`window.__adelantarReloj(ms)`). Es el reloj
// inyectable del encargo (§9): reproduce el guion de tiempos sin esperar. React y la red siguen con el reloj real.
// - Cada carga de la página es un «proceso» nuevo, como cuando el sistema cierra la APK.
// - El adelanto acumulado se guarda en localStorage: después de recargar, el reloj civil sigue donde estaba (no vuelve
//   atrás) y suma el tiempo real que pasó entre las dos cargas.
// - **Dos bases** (precierre del 2026-10-06, §3), según `?reloj=` en la dirección de la página:
//   - `proceso` (por omisión, como el navegador o Expo Go): el monotónico del proceso, que empieza de nuevo en cada carga,
//     con otra ancla;
//   - `arranque` (como la APK con el módulo nativo): el tiempo desde un «arranque» simulado, que sigue contando entre
//     cargas, con la misma ancla. Es el civil menos el instante del arranque, guardado al primer uso.
// - El instante civil de cada carga queda en `window.__civilAlCargar`: el recorrido lo compara con sus propias anclas.
import { crearReloj, idAleatorio, type RelojDeSesion } from '@movil-real/reloj-de-sesion';

export * from '@movil-real/reloj-de-sesion';

const CLAVE = 'recorrido:adelanto-del-reloj';
const CLAVE_DEL_ARRANQUE = 'recorrido:arranque-simulado';
const civilAlCargar = Date.now();
let adelanto = Number(localStorage.getItem(CLAVE) ?? '0');
let adelantoDelProceso = 0;
const ventana = window as unknown as { __adelantarReloj: (ms: number) => void; __civilAlCargar: number; __baseDelReloj: string };
ventana.__civilAlCargar = civilAlCargar;
ventana.__adelantarReloj = (ms: number) => {
  adelanto += ms;
  adelantoDelProceso += ms;
  localStorage.setItem(CLAVE, String(adelanto));
};
const civil = () => civilAlCargar + adelanto;

export const ANCLA_DEL_PROCESO = idAleatorio('proceso');
export const relojDelProceso = crearReloj({ base: 'PROCESS_MONOTONIC', ancla: ANCLA_DEL_PROCESO, monotonico: () => 1000 + adelantoDelProceso, civil });

function relojDelArranque(): RelojDeSesion {
  let arranque = JSON.parse(localStorage.getItem(CLAVE_DEL_ARRANQUE) ?? 'null') as { civil: number; ancla: string } | null;
  if (!arranque) {
    arranque = { civil: civil() - 3_600_000, ancla: idAleatorio('arranque') };
    localStorage.setItem(CLAVE_DEL_ARRANQUE, JSON.stringify(arranque));
  }
  const { civil: civilDelArranque, ancla } = arranque;
  return crearReloj({ base: 'ELAPSED_SINCE_BOOT', ancla, monotonico: () => civil() - civilDelArranque, civil, listo: async () => undefined });
}

const base = new URLSearchParams(location.search).get('reloj') === 'arranque' ? 'arranque' : 'proceso';
ventana.__baseDelReloj = base;
/** El reloj con el que la APK marca los eventos (`reloj-del-telefono.ts`): el del arranque o el del proceso. */
export const relojDeLaSesion: RelojDeSesion = base === 'arranque' ? relojDelArranque() : relojDelProceso;
