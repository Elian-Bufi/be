// El cliente de la API en el render con la API LOCAL real (modo API_REAL=1 de construir.mjs): la misma definición que
// `apps/mobile/src/api.ts`, con la base en el mismo origen que la página. `servir-arnes.mjs` (en la carpeta del recorrido)
// sirve esta página y reenvía /api/* a la API local. No hay datos sintéticos acá: lo que se ve lo responde la API, con la
// cuenta sintética del asesorado cuya sesión se pasa en ?token= al abrir la página. Nada de eso queda en el repositorio.
// Como la APK, cada escritura olvida las lecturas recordadas, y la hora del servidor sale de cada respuesta.
import { crearClienteBe } from '@be/domain';
import { memoria } from '@movil/lecturas';
import { relojDelServidor } from '@movil/reloj-del-servidor';

const fetchQueOlvidaAlEscribir: typeof fetch = async (entrada, init) => {
  const escribe = (init?.method ?? 'GET').toUpperCase() !== 'GET';
  if (escribe) memoria.olvidarLecturas();
  try {
    const respuesta = await fetch(entrada, init);
    relojDelServidor.registrar(respuesta.headers?.get?.('date'));
    return respuesta;
  } finally {
    if (escribe) memoria.olvidarLecturas();
  }
};

export const api = crearClienteBe({ baseUrl: `${location.origin}/api/v1`, superficie: 'APK', fetch: fetchQueOlvidaAlEscribir });
export const apiConfigurada = true;
export const extra = {};
export const nuevaClaveDeIdempotencia = (): string => `apk-render-real-${crypto.randomUUID()}`;
