// El reloj de la sesión en el modo de la API real: el mismo módulo de la APK (`apps/mobile/src/reloj-de-sesion.ts`), con
// sus dos relojes detenidos, que avanzan solo cuando el recorrido los adelanta (`window.__adelantarReloj(ms)`). Es el reloj
// inyectable del encargo (§9): reproduce el guion de tiempos sin esperar. React y la red siguen con el reloj real.
// - Cada carga de la página es un «proceso» nuevo, con otra ancla, como cuando el sistema cierra la APK.
// - El adelanto acumulado se guarda en localStorage: después de recargar, el reloj civil sigue donde estaba (no vuelve
//   atrás), y el monotónico empieza de nuevo con el ancla nueva, como en el teléfono.
import { crearReloj, idAleatorio } from '@movil-real/reloj-de-sesion';

export * from '@movil-real/reloj-de-sesion';

const CLAVE = 'recorrido:adelanto-del-reloj';
const civilAlCargar = Date.now();
let adelanto = Number(localStorage.getItem(CLAVE) ?? '0');
let adelantoDelProceso = 0;
(window as unknown as { __adelantarReloj: (ms: number) => void }).__adelantarReloj = (ms: number) => {
  adelanto += ms;
  adelantoDelProceso += ms;
  localStorage.setItem(CLAVE, String(adelanto));
};

export const ANCLA_DEL_PROCESO = idAleatorio('proceso');
export const relojDelProceso = crearReloj({ ancla: ANCLA_DEL_PROCESO, monotonico: () => 1000 + adelantoDelProceso, civil: () => civilAlCargar + adelanto });
