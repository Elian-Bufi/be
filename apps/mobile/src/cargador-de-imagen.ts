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
 * - **Imágenes livianas** (DL-191, en la app con DL-194, A32-05): la imagen de una receta se puede pedir en dos medidas
 *   (`?variant=thumbnail`, 400 px en el lado mayor; `large`, 1200 px). Cada marco pide la que le alcanza para verse nítido
 *   (`varianteParaElMarco`): la miniatura en un marco chico, la grande a todo el ancho. La variante va en la clave del
 *   acceso recordado, como `lib/medios.ts` del website. **Tolerante:** si la API no conoce la variante (una API anterior a
 *   DL-191 rechaza el parámetro con un 400), se pide como siempre, sin variante, y la app no la vuelve a pedir en el
 *   proceso. A una foto de una comida o a la imagen de un ejercicio la API le da lo guardado, con variante o sin ella.
 */
import type { AccesoAMedioResponse, Resultado, VarianteDeMedio } from '@be/domain';

/** Un acceso que vence en menos de esto no se usa: se pide otro. */
export const MARGEN_DEL_ACCESO_MS = 60_000;

/** DL-191 · las dos medidas de la imagen de una receta: las del contrato de API-MED-03 (`VarianteDeMedio`). */
export type VarianteDeImagen = VarianteDeMedio;

/** DL-191 · el lado mayor de la miniatura, en píxeles (`LIMITES_DE_MEDIO.ladoDeLaMiniatura` de DL-191). */
export const LADO_DE_LA_MINIATURA = 400;
/** Cuánto se deja agrandar la miniatura en pantalla antes de pedir la grande: un 25 % todavía se ve nítido. */
export const AGRANDAMIENTO_TOLERADO = 1.25;

/**
 * La variante que le alcanza a un marco: la miniatura si el lado mayor del marco, en píxeles del teléfono, no la agranda
 * más que `AGRANDAMIENTO_TOLERADO`; si no, la grande. Un marco de 72 dp (×2,625: 189 px) pide la miniatura; uno a todo el
 * ancho (340 dp: 893 px), la grande.
 */
export function varianteParaElMarco(ladoMayorDp: number, densidad: number): VarianteDeImagen {
  const d = Number.isFinite(densidad) && densidad > 0 ? densidad : 1;
  if (!Number.isFinite(ladoMayorDp) || ladoMayorDp <= 0) return 'large';
  return ladoMayorDp * d <= LADO_DE_LA_MINIATURA * AGRANDAMIENTO_TOLERADO ? 'thumbnail' : 'large';
}

/** Si un rechazo de API-MED-03 dice que la API no conoce el parámetro `variant`: un 400 de la solicitud. */
export const rechazaLaVariante = (r: Resultado<unknown>): boolean => !r.ok && r.tipo === 'API' && r.status === 400;

export type EstadoDeLaImagen =
  | { readonly tipo: 'sin-imagen' }
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'lista'; readonly url: string; readonly renovada: boolean }
  | { readonly tipo: 'fallo' };

export interface AccesoAMedios {
  /**
   * La URL de lectura: la recordada si todavía vale, o una nueva (`renovar` fuerza una nueva). `null` si no se dio. Con
   * `variante`, la de esa medida, si la API la conoce.
   */
  url(token: string, mediaId: string, renovar: boolean, sesionPerdida: (r: Resultado<unknown>) => boolean, variante?: VarianteDeImagen): Promise<string | null>;
}

export function crearAccesoAMedios(o: {
  /** API-MED-03. Con `variante`, `?variant=` (DL-191); un cliente sin DL-191 no la manda, y la API da lo guardado. */
  readonly acceder: (token: string, mediaId: string, variante?: VarianteDeImagen) => Promise<Resultado<AccesoAMedioResponse>>;
  readonly urlDe: (ruta: string) => string;
  /** La hora del servidor, para saber si un acceso todavía vale. */
  readonly ahoraMs: () => number;
}): AccesoAMedios {
  const accesos = new Map<string, { readonly url: string; readonly venceMs: number }>();
  const pedidos = new Map<string, Promise<string | null>>();
  // Si la API rechazó una variante, no la conoce: desde ahí, todo sin variante, en este proceso.
  let sinVariantes = false;
  const pedir = (token: string, mediaId: string, variante: VarianteDeImagen | undefined): Promise<Resultado<AccesoAMedioResponse>> =>
    variante === undefined
      ? o.acceder(token, mediaId)
      : o.acceder(token, mediaId, variante).then((r) => {
          if (!rechazaLaVariante(r)) return r;
          sinVariantes = true;
          return o.acceder(token, mediaId);
        });
  return {
    url(token, mediaId, renovar, sesionPerdida, variantePedida) {
      const variante = sinVariantes ? undefined : variantePedida;
      const clave = `${token}|${mediaId}|${variante ?? ''}`;
      const guardado = accesos.get(clave);
      if (!renovar && guardado && guardado.venceMs - MARGEN_DEL_ACCESO_MS > o.ahoraMs()) return Promise.resolve(guardado.url);
      if (renovar) accesos.delete(clave);
      const enCurso = pedidos.get(clave);
      if (enCurso) return enCurso;
      const pedido = pedir(token, mediaId, variante)
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
  let actual: { token: string; mediaId: string; sesionPerdida: (r: Resultado<unknown>) => boolean; variante: VarianteDeImagen | undefined } | null = null;
  let estado: EstadoDeLaImagen = { tipo: 'sin-imagen' };
  const fijar = (e: EstadoDeLaImagen) => {
    estado = e;
    alCambiar(e);
  };

  return {
    estado: (): EstadoDeLaImagen => estado,
    /** Muestra un medio (o ninguno). Con `cargar` en `false`, reserva el lugar sin pedir el acceso. Con `variante`, esa medida. */
    mostrar(token: string, mediaId: string | null, cargar: boolean, sesionPerdida: (r: Resultado<unknown>) => boolean, variante?: VarianteDeImagen): void {
      const mia = ++vigencia;
      if (!mediaId) {
        actual = null;
        return fijar({ tipo: 'sin-imagen' });
      }
      actual = { token, mediaId, sesionPerdida, variante };
      fijar({ tipo: 'cargando' });
      if (!cargar) return;
      void acceso.url(token, mediaId, false, sesionPerdida, variante).then((url) => {
        if (mia !== vigencia) return;
        fijar(url ? { tipo: 'lista', url, renovada: false } : { tipo: 'fallo' });
      });
    },
    /** La descarga falló: se renueva el acceso una sola vez; si vuelve a fallar, el respaldo. */
    alFallarLaDescarga(): void {
      if (estado.tipo !== 'lista' || !actual) return;
      if (estado.renovada) return fijar({ tipo: 'fallo' });
      const mia = vigencia;
      const { token, mediaId, sesionPerdida, variante } = actual;
      void acceso.url(token, mediaId, true, sesionPerdida, variante).then((url) => {
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
