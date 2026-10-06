/**
 * La carga de una imagen privada de BE, sin React (DL-120; precierre del 2026-10-06, §5). `imagen-de-medio.tsx` la
 * dibuja; las pruebas la ejercitan con un acceso inyectado.
 *
 * - **El acceso** (`crearAccesoAMedios`): la identidad del medio no es su URL. Se pide el acceso (API-MED-03) y se recibe
 *   una ruta firmada que vence en 15 minutos como máximo. Se recuerda mientras vale, en el proceso y nunca en disco, y dos
 *   pedidos del mismo medio a la vez comparten el pedido.
 * - **Sin imagen** (`mediaId` nulo) y **descarga fallida** son dos estados distintos: el primero dice «Sin imagen…» y el
 *   segundo «La imagen no se pudo mostrar.». Una imagen nula no prueba que una descarga falle.
 * - **Si la descarga falla**, se pide un acceso nuevo **una sola vez** (la ruta pudo vencer con la pantalla abierta); si
 *   vuelve a fallar, queda el respaldo. Si la API no da acceso, el respaldo directamente. Nada se reintenta en bucle, y
 *   la pantalla de alrededor sigue andando: se puede registrar igual.
 * - **Vigencia** (`crearCargadorDeImagen`): cada pedido lleva la imagen que estaba a la vista cuando salió. Si mientras
 *   tanto cambió el ejercicio, el medio o la cuenta, o la imagen se dejó de mostrar, la respuesta tardía se descarta: un
 *   recurso anterior nunca reaparece. Vale para la carga y para la renovación.
 */
import type { AccesoAMedioResponse, Resultado } from '@be/domain';

/** Un acceso que vence en menos de esto no se usa: se pide otro. */
export const MARGEN_DEL_ACCESO_MS = 60_000;

export type EstadoDeLaImagen =
  | { readonly tipo: 'sin-imagen' }
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'lista'; readonly url: string; readonly renovada: boolean }
  | { readonly tipo: 'fallo' };

export interface AccesoAMedios {
  /** La URL de lectura: la recordada si todavía vale, o una nueva (`renovar` fuerza una nueva). `null` si no se dio. */
  url(token: string, mediaId: string, renovar: boolean, sesionPerdida: (r: Resultado<unknown>) => boolean): Promise<string | null>;
}

export function crearAccesoAMedios(o: {
  readonly acceder: (token: string, mediaId: string) => Promise<Resultado<AccesoAMedioResponse>>;
  readonly urlDe: (ruta: string) => string;
  /** La hora del servidor, para saber si un acceso todavía vale. */
  readonly ahoraMs: () => number;
}): AccesoAMedios {
  const accesos = new Map<string, { readonly url: string; readonly venceMs: number }>();
  const pedidos = new Map<string, Promise<string | null>>();
  return {
    url(token, mediaId, renovar, sesionPerdida) {
      const clave = `${token}|${mediaId}`;
      const guardado = accesos.get(clave);
      if (!renovar && guardado && guardado.venceMs - MARGEN_DEL_ACCESO_MS > o.ahoraMs()) return Promise.resolve(guardado.url);
      if (renovar) accesos.delete(clave);
      const enCurso = pedidos.get(clave);
      if (enCurso) return enCurso;
      const pedido = o
        .acceder(token, mediaId)
        .then((r) => {
          if (sesionPerdida(r) || !r.ok) return null;
          const url = o.urlDe(r.datos.data.path);
          const venceMs = Date.parse(r.datos.data.expiresAt);
          if (Number.isFinite(venceMs)) accesos.set(clave, { url, venceMs });
          return url;
        })
        .catch(() => null)
        .finally(() => pedidos.delete(clave));
      pedidos.set(clave, pedido);
      return pedido;
    },
  };
}

/** Lo que una imagen muestra y cómo reacciona cuando su descarga falla. */
export function crearCargadorDeImagen(acceso: AccesoAMedios, alCambiar: (e: EstadoDeLaImagen) => void) {
  /** La imagen a la vista: cambia con cada `mostrar` y con `soltar`. Una respuesta de otra vigencia se descarta. */
  let vigencia = 0;
  let actual: { token: string; mediaId: string; sesionPerdida: (r: Resultado<unknown>) => boolean } | null = null;
  let estado: EstadoDeLaImagen = { tipo: 'sin-imagen' };
  const fijar = (e: EstadoDeLaImagen) => {
    estado = e;
    alCambiar(e);
  };

  return {
    estado: (): EstadoDeLaImagen => estado,
    /** Muestra un medio (o ninguno). Con `cargar` en `false`, reserva el lugar sin pedir el acceso. */
    mostrar(token: string, mediaId: string | null, cargar: boolean, sesionPerdida: (r: Resultado<unknown>) => boolean): void {
      const mia = ++vigencia;
      if (!mediaId) {
        actual = null;
        return fijar({ tipo: 'sin-imagen' });
      }
      actual = { token, mediaId, sesionPerdida };
      fijar({ tipo: 'cargando' });
      if (!cargar) return;
      void acceso.url(token, mediaId, false, sesionPerdida).then((url) => {
        if (mia !== vigencia) return;
        fijar(url ? { tipo: 'lista', url, renovada: false } : { tipo: 'fallo' });
      });
    },
    /** La descarga falló: se renueva el acceso una sola vez; si vuelve a fallar, el respaldo. */
    alFallarLaDescarga(): void {
      if (estado.tipo !== 'lista' || !actual) return;
      if (estado.renovada) return fijar({ tipo: 'fallo' });
      const mia = vigencia;
      const { token, mediaId, sesionPerdida } = actual;
      void acceso.url(token, mediaId, true, sesionPerdida).then((url) => {
        if (mia !== vigencia) return;
        fijar(url ? { tipo: 'lista', url, renovada: true } : { tipo: 'fallo' });
      });
    },
    /** La imagen se dejó de mostrar: lo que llegue después no se aplica. */
    soltar(): void {
      vigencia++;
      actual = null;
    },
  };
}
