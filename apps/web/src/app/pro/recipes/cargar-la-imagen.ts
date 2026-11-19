/**
 * NUA-06 (WP-NUTRICION-ALIMENTOS) · Cargar la imagen de referencia de una receta, sin React: subir el medio por el flujo
 * real (la intención y los bytes, API-MED-01 y 02) y asociarlo a la receta (API-REC-05) con su `expectedVersion`. Lo usan
 * la receta ya guardada («Cargar imagen») y la receta nueva, que la carga sola al guardarse, con la versión que devolvió
 * la creación (API-REC-01). La pantalla está en `imagen-de-receta.tsx`; acá, lo que se puede probar sin ella.
 * - Cada paso con su clave de intento: el reintento de un resultado incierto reusa la misma, y el servidor responde lo
 *   que ya hizo (no sube dos veces ni asocia dos veces). Otro pedido (otra procedencia, otra autoría) es otro intento.
 * - Si la subida salió y la asociación no, el medio subido se conserva: el reintento solo asocia.
 * - Si la receta se acaba de guardar y la imagen no, la falla lo dice (`trasGuardar`) y lo elegido sigue, como
 *   `ImagenPendiente`, en la receta ya guardada: el reintento carga solo la imagen y la receta no se vuelve a crear.
 */
import { COPY_RECETAS, COPY_VINCULO } from '@be/domain';
import type { ProcedenciaDeMedio, Receta, Resultado } from '@be/domain';
import type { ImagenElegida } from '../../../lib/medios';

/** Por qué no quedó cargada: la imagen no sirve, no se pudo cargar (o no se sabe si se cargó), o la receta cambió. */
export type MotivoDeLaFalla = 'INVALIDA' | 'NO_CARGADA' | 'RECETA_CAMBIO';

/** Lo que la API rechaza de la imagen misma: hace falta otro archivo, no otro intento. */
const IMAGEN_RECHAZADA = new Set(['FILE_TYPE_NOT_ALLOWED', 'FILE_SIZE_NOT_ALLOWED', 'FILE_CONTENT_INVALID']);

/** La clave de un intento lógico, como la da `useClaveDeIntento`. */
export interface ClaveDeUnIntento {
  actual(que?: string | null): string;
  registrar(r: Resultado<unknown>): void;
  descartar(): void;
}

/** Una clave para subir y otra para asociar: son dos escrituras distintas. */
export interface ClavesDeLaImagen {
  readonly subida: ClaveDeUnIntento;
  readonly asociacion: ClaveDeUnIntento;
}

/** Las dos llamadas reales, con lo demás ya puesto (el token, el archivo, la receta). */
export interface PasosDeLaCarga {
  /** API-MED-01 y 02: la intención y los bytes; responde el medio. */
  subir(clave: string): Promise<Resultado<{ data: { mediaId: string } }>>;
  /** API-REC-05: asocia el medio a la receta, si sigue en `expectedVersion`. */
  asociar(medioId: string, expectedVersion: string, clave: string): Promise<Resultado<{ data: Receta }>>;
}

export type ResultadoDeLaCarga =
  | { readonly tipo: 'asociada'; readonly receta: Receta }
  /** La sesión venció: la página ya redirige y no se dice nada más. */
  | { readonly tipo: 'sesion-perdida' }
  /** `subido`: el medio que ya está en BE, si la falla fue al asociarlo. */
  | { readonly tipo: 'fallo'; readonly motivo: MotivoDeLaFalla; readonly subido: string | null };

/** Sube la imagen (si todavía no se subió) y la asocia a la receta en `version`. */
export async function cargarLaImagen(
  pasos: PasosDeLaCarga,
  datos: {
    /** La versión de la receta para `expectedVersion`: si se acaba de crear, la que devolvió la creación. */
    readonly version: string;
    readonly subido: string | null;
    readonly claves: ClavesDeLaImagen;
    /** Lo que se declara al subir (el archivo, la procedencia, la autoría): otro pedido es otro intento (ED-62). */
    readonly queSeSube: string;
    readonly sesionPerdida: (r: Resultado<unknown>) => boolean;
  },
): Promise<ResultadoDeLaCarga> {
  let medioId = datos.subido;
  if (!medioId) {
    const subida = await pasos.subir(datos.claves.subida.actual(datos.queSeSube));
    datos.claves.subida.registrar(subida);
    if (datos.sesionPerdida(subida)) return { tipo: 'sesion-perdida' };
    if (!subida.ok) return { tipo: 'fallo', motivo: subida.tipo === 'API' && IMAGEN_RECHAZADA.has(subida.codigo) ? 'INVALIDA' : 'NO_CARGADA', subido: null };
    medioId = subida.datos.data.mediaId;
  }
  const asociada = await pasos.asociar(medioId, datos.version, datos.claves.asociacion.actual(`${medioId}|${datos.version}`));
  datos.claves.asociacion.registrar(asociada);
  if (datos.sesionPerdida(asociada)) return { tipo: 'sesion-perdida' };
  if (!asociada.ok) return { tipo: 'fallo', motivo: asociada.tipo === 'API' && asociada.codigo === 'VERSION_CONFLICT' ? 'RECETA_CAMBIO' : 'NO_CARGADA', subido: medioId };
  return { tipo: 'asociada', receta: asociada.datos.data };
}

/**
 * Lo que se dice cuando la imagen no quedó. Con la receta ya guardada de antes, lo de siempre («La receta no cambió»);
 * recién creada (`trasGuardar`), primero que la receta quedó guardada, y que el reintento no la vuelve a crear.
 */
export function textoDeLaFalla(motivo: MotivoDeLaFalla, trasGuardar: boolean): string {
  if (motivo === 'NO_CARGADA') return trasGuardar ? COPY_RECETAS.imagenNoCargadaTrasGuardar : COPY_RECETAS.imagenNoCargada;
  // El 409 de la versión dice lo mismo que `mensajeDeFallo` en el resto del website.
  const por = motivo === 'INVALIDA' ? COPY_RECETAS.imagenInvalida : COPY_VINCULO.contenidoCambio;
  return trasGuardar ? `${COPY_RECETAS.guardadaSinLaImagen} ${por}` : por;
}

/**
 * La imagen que se eligió al crear una receta y no se pudo cargar: pasa, con su falla, a la receta ya guardada (el
 * editor de «Mis recetas» o el paso de la foto del plan), que la muestra con «Reintentar la imagen».
 */
export interface ImagenPendiente {
  /** La receta ya guardada a la que va. */
  readonly recetaId: string;
  readonly elegida: ImagenElegida;
  readonly procedencia: ProcedenciaDeMedio;
  readonly autoria: string;
  /** El medio ya subido, si la falla fue al asociarlo: el reintento solo asocia. */
  readonly subido: string | null;
  readonly motivo: MotivoDeLaFalla;
  /** Las claves siguen con la imagen: si el intento quedó incierto, el reintento reusa la suya. */
  readonly claves: ClavesDeLaImagen;
}

/** Lo que pasó con la imagen al crear la receta: no se eligió, quedó cargada, o quedó pendiente. */
export type ImagenAlCrear = { readonly tipo: 'sin-imagen' } | { readonly tipo: 'cargada' } | { readonly tipo: 'pendiente'; readonly pendiente: ImagenPendiente };

export const SIN_IMAGEN: ImagenAlCrear = { tipo: 'sin-imagen' };

/**
 * ED-32 y NUA-06 · Qué hace el cuadro de «Receta nueva» del plan después de guardar, según la imagen elegida al crearla:
 * - `cerrar`: quedó cargada. No hay nada más que pedir: el cuadro se cierra y el plan dice lo hecho, con la imagen. Un
 *   paso que solo confirma sería un clic más en medio de la planificación.
 * - `reintentar`: se eligió y no se pudo cargar. El paso de la foto la muestra con su falla y «Reintentar la imagen».
 * - `ofrecer`: no se eligió. El paso de la foto la ofrece, opcional, como antes.
 */
export function pasoDeLaFotoTrasCrear(imagen: ImagenAlCrear): 'cerrar' | 'reintentar' | 'ofrecer' {
  if (imagen.tipo === 'cargada') return 'cerrar';
  return imagen.tipo === 'pendiente' ? 'reintentar' : 'ofrecer';
}
