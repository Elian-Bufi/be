'use client';

/**
 * Medios privados en el website (DL-120): revisar una imagen antes de subirla, subirla por el flujo real (la intención
 * y los bytes a la ruta firmada) y mostrar una imagen guardada.
 * - La CSP del website admite imágenes de `self` y `data:` solamente (render.yaml). Por eso una imagen de la API se pide
 *   con su acceso firmado (API-MED-03), se descarga con fetch (CORS) y se muestra como data URL. La ruta firmada vence
 *   y no se guarda en ningún lado: la identidad de la imagen es su `mediaId`.
 * - Los límites son los del dominio, los mismos del servidor, que igual vuelve a validar todo.
 * - DL-191 (REC-03): antes de subir, una imagen de más de 1600 px en el lado mayor se achica en el navegador
 *   (`createImageBitmap` y un canvas) y se codifica en WebP, o en JPEG si el navegador no codifica WebP. Sube menos bytes
 *   y el servidor igual valida y vuelve a codificar. Se achica una sola vez, al elegirla: el reintento sube lo mismo.
 * - DL-191 (REC-02): una imagen se pide por variante (la miniatura en listas y tarjetas, la grande en el detalle); la de
 *   una receta del Recetario de BE viene con su ruta ya firmada y no pide un acceso.
 */
import {
  LIMITES_DE_MEDIO,
  medidasAlAchicar,
  TipoDeImagenSchema,
  type FinalidadDeMedio,
  type Medio,
  type ProcedenciaDeMedio,
  type RutasDeLaImagen,
  type TipoDeImagen,
  type VarianteDeMedio,
} from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Resultado } from './api';

export type ProblemaDeImagen = 'TIPO' | 'TAMANO' | 'DIMENSIONES' | 'ILEGIBLE';

export interface ImagenElegida {
  readonly archivo: File;
  readonly tipo: TipoDeImagen;
  /** La vista previa, leída del archivo local: todavía no está en BE. */
  readonly vistaPrevia: string;
  readonly ancho: number;
  readonly alto: number;
  /** DL-191: lo que se sube, si se achicó en el navegador; si no, el archivo tal cual. */
  readonly paraSubir?: { readonly contenido: Blob; readonly tipo: TipoDeImagen };
}

export function leerComoDataUrl(contenido: Blob): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => (typeof lector.result === 'string' ? resolver(lector.result) : rechazar(new Error('lectura vacía')));
    lector.onerror = () => rechazar(lector.error ?? new Error('lectura fallida'));
    lector.readAsDataURL(contenido);
  });
}

function dimensiones(dataUrl: string): Promise<{ ancho: number; alto: number }> {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver({ ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
    imagen.onerror = () => rechazar(new Error('no se decodifica'));
    imagen.src = dataUrl;
  });
}

/**
 * DL-191 (REC-03) · la imagen achicada a 1600 px en el lado mayor, en WebP (o JPEG), si hace falta achicarla, o
 * recodificada en sus medidas si pesa más de 1,5 MB (un PNG de una cámara). `null` si no hace falta, o si el navegador no
 * puede (sin `createImageBitmap`, sin canvas): entonces se sube el archivo tal cual.
 */
const BYTES_PARA_RECODIFICAR = 1.5 * 1024 * 1024;

export async function achicarAntesDeSubir(archivo: Blob, ancho: number, alto: number): Promise<{ readonly contenido: Blob; readonly tipo: TipoDeImagen } | null> {
  const medidas = medidasAlAchicar(ancho, alto);
  if ((!medidas.achicar && archivo.size <= BYTES_PARA_RECODIFICAR) || typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null;
  try {
    const mapa = await createImageBitmap(archivo, { resizeWidth: medidas.ancho, resizeHeight: medidas.alto, resizeQuality: 'high' });
    const lienzo = document.createElement('canvas');
    lienzo.width = medidas.ancho;
    lienzo.height = medidas.alto;
    const contexto = lienzo.getContext('2d');
    if (!contexto) return null;
    // Sobre blanco, como el servidor: una transparencia no queda negra en el JPEG.
    contexto.fillStyle = 'white';
    contexto.fillRect(0, 0, medidas.ancho, medidas.alto);
    contexto.drawImage(mapa, 0, 0, medidas.ancho, medidas.alto);
    mapa.close();
    const codificar = (tipo: TipoDeImagen) => new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, tipo, LIMITES_DE_MEDIO.calidadAlAchicarEnElCliente));
    // Un navegador que no codifica WebP devuelve un PNG: entonces, JPEG.
    const webp = await codificar('image/webp');
    if (webp && webp.type === 'image/webp' && webp.size > 0) return { contenido: webp, tipo: 'image/webp' };
    const jpeg = await codificar('image/jpeg');
    return jpeg && jpeg.type === 'image/jpeg' && jpeg.size > 0 ? { contenido: jpeg, tipo: 'image/jpeg' } : null;
  } catch {
    return null;
  }
}

/** La revisión del cliente: tipo, bytes, que se decodifique y sus dimensiones. El servidor repite todo. */
export async function revisarImagen(archivo: File): Promise<{ ok: true; imagen: ImagenElegida } | { ok: false; problema: ProblemaDeImagen }> {
  const tipo = TipoDeImagenSchema.safeParse(archivo.type);
  if (!tipo.success) return { ok: false, problema: 'TIPO' };
  if (archivo.size <= 0 || archivo.size > LIMITES_DE_MEDIO.bytesMaximos) return { ok: false, problema: 'TAMANO' };
  const vistaPrevia = await leerComoDataUrl(archivo).catch(() => null);
  const medidas = vistaPrevia ? await dimensiones(vistaPrevia).catch(() => null) : null;
  if (!vistaPrevia || !medidas) return { ok: false, problema: 'ILEGIBLE' };
  const { ladoMinimo, ladoMaximo, pixelesMaximos } = LIMITES_DE_MEDIO;
  const lados = [medidas.ancho, medidas.alto];
  if (lados.some((l) => l < ladoMinimo || l > ladoMaximo) || medidas.ancho * medidas.alto > pixelesMaximos) return { ok: false, problema: 'DIMENSIONES' };
  const achicada = await achicarAntesDeSubir(archivo, medidas.ancho, medidas.alto);
  return { ok: true, imagen: { archivo, tipo: tipo.data, vistaPrevia, ...medidas, ...(achicada ? { paraSubir: achicada } : {}) } };
}

/**
 * Sube por el flujo real: la intención (API-MED-01) con la clave del intento y los bytes a la ruta firmada (API-MED-02).
 * Reintentar con la misma clave repite la misma intención, y la misma subida responde el mismo medio: no duplica.
 */
export async function subirImagen(
  token: string,
  imagen: ImagenElegida,
  datos: { readonly finalidad: FinalidadDeMedio; readonly procedencia: ProcedenciaDeMedio; readonly autoria: string | null },
  claveDeIdempotencia: string,
): Promise<Resultado<{ data: Medio }>> {
  // DL-191: se sube lo achicado, si se achicó; si no, el archivo tal cual.
  const contenido = imagen.paraSubir?.contenido ?? imagen.archivo;
  const tipo = imagen.paraSubir?.tipo ?? imagen.tipo;
  const intencion = await api.crearIntencionDeSubida(
    token,
    { purpose: datos.finalidad, contentType: tipo, byteSize: contenido.size, provenance: datos.procedencia, authorship: datos.autoria },
    claveDeIdempotencia,
  );
  if (!intencion.ok) return intencion;
  return api.subirMedio(intencion.datos.data.uploadPath, contenido, tipo);
}

export type EstadoDeImagen = { readonly tipo: 'sin-imagen' } | { readonly tipo: 'cargando' } | { readonly tipo: 'lista'; readonly dataUrl: string } | { readonly tipo: 'fallo' };

type Descarga = { readonly acceso: Resultado<unknown>; readonly dataUrl: string | null };

/** Los bytes de una ruta firmada, como data URL. El navegador guarda solo lo que la API deja guardar (REC-D10). */
function bajar(ruta: string): Promise<string | null> {
  return fetch(api.urlDe(ruta), { credentials: 'omit', cache: 'default' })
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`status ${r.status}`))))
    .then(leerComoDataUrl)
    .catch(() => null);
}

/** Un acceso que ya está: la ruta firmada vino con la receta (el Recetario de BE). */
const SIN_ACCESO: Resultado<unknown> = { ok: true, datos: null };

/**
 * El acceso firmado (API-MED-03) y la descarga de un medio, como data URL; `null` si alguno de los dos falla. Con `ruta`
 * (la de una imagen del Recetario de BE, ya firmada), no se pide el acceso.
 */
async function descargar(token: string, medioId: string, variante: VarianteDeMedio | null, ruta: string | null): Promise<Descarga> {
  if (ruta) return { acceso: SIN_ACCESO, dataUrl: await bajar(ruta) };
  const acceso = await api.accederAMedio(token, medioId, variante ?? undefined);
  if (!acceso.ok) return { acceso, dataUrl: null };
  return { acceso, dataUrl: await bajar(acceso.datos.data.path) };
}

/**
 * Las imágenes de referencia ya descargadas en esta pestaña, por sesión y por medio (encargo del 2026-10-19, bloque 4):
 * ir y volver de «Mis recetas» o guardar una receta no las pide de nuevo. Cada pedido es un acceso auditado que consume
 * el cupo de lecturas protegidas, y una lista de recetas con fotos los multiplicaba. Viven en la memoria de la pestaña,
 * como la sesión, y nunca en disco; las más viejas se olvidan. Solo para lo que lo pide (`recordar`): las fotos privadas
 * de un registro de comida no se recuerdan.
 */
const RECORDADAS_COMO_MAXIMO = 40;
const recordadas = new Map<string, string>();
const enCurso = new Map<string, Promise<Descarga>>();

function recordar(clave: string, dataUrl: string) {
  recordadas.delete(clave);
  recordadas.set(clave, dataUrl);
  while (recordadas.size > RECORDADAS_COMO_MAXIMO) {
    const masVieja = recordadas.keys().next().value;
    if (masVieja === undefined) break;
    recordadas.delete(masVieja);
  }
}

/** La descarga compartida: dos tarjetas con la misma imagen que se montan a la vez hacen un solo pedido. */
function descargaCompartida(clave: string, token: string, medioId: string, variante: VarianteDeMedio | null, ruta: string | null): Promise<Descarga> {
  const ya = enCurso.get(clave);
  if (ya) return ya;
  const pedido = descargar(token, medioId, variante, ruta).finally(() => enCurso.delete(clave));
  enCurso.set(clave, pedido);
  return pedido;
}

/** DL-191: la ruta ya firmada de la variante pedida, si la imagen trae sus rutas (el Recetario de BE). */
export function rutaDeLaVariante(rutas: RutasDeLaImagen | null | undefined, variante: VarianteDeMedio | null): string | null {
  if (!rutas) return null;
  // Se usa mientras le quede al menos un minuto: si no, se pide el acceso como siempre.
  if (new Date(rutas.expiresAt).getTime() - Date.now() < 60_000) return null;
  return variante === 'large' ? rutas.large : rutas.thumbnail;
}

/**
 * Una imagen guardada, como data URL: el acceso firmado (API-MED-03) y la descarga, cuando se monta o cambia el medio.
 * Con `recordar`, la de esta pestaña si ya se descargó; `recargar` la vuelve a pedir igual. Si la sesión se perdió, no
 * muestra nada: la página ya redirige. Una falla queda como `fallo`, para que la pantalla muestre su respaldo sin ocultar
 * el resto.
 */
export function useImagenDeMedio(
  token: string,
  medioId: string | null,
  sesionPerdida: (r: Resultado<unknown>) => boolean,
  opciones: { readonly recordar?: boolean; readonly variante?: VarianteDeMedio; readonly rutas?: RutasDeLaImagen | null } = {},
) {
  const recordarla = opciones.recordar === true;
  const variante = opciones.variante ?? null;
  const ruta = rutaDeLaVariante(opciones.rutas, variante);
  // La clave lleva la variante: la miniatura de la lista no reemplaza a la grande del detalle.
  const claveDe = (id: string) => `${token}|${id}|${variante ?? 'guardada'}`;
  const [estado, setEstado] = useState<EstadoDeImagen>(() => {
    if (!medioId) return { tipo: 'sin-imagen' };
    const ya = recordarla ? recordadas.get(claveDe(medioId)) : undefined;
    return ya ? { tipo: 'lista', dataUrl: ya } : { tipo: 'cargando' };
  });
  const generacion = useRef(0);
  const cargar = useCallback(
    async (forzar = false) => {
      const esta = ++generacion.current;
      if (!medioId) return setEstado({ tipo: 'sin-imagen' });
      const clave = `${token}|${medioId}|${variante ?? 'guardada'}`;
      const ya = recordarla && !forzar ? recordadas.get(clave) : undefined;
      if (ya) return setEstado({ tipo: 'lista', dataUrl: ya });
      setEstado({ tipo: 'cargando' });
      // Un reintento a mano pide el acceso de nuevo, aunque la ruta haya venido firmada.
      const firmada = forzar ? null : ruta;
      const { acceso, dataUrl } = await (recordarla ? descargaCompartida(clave, token, medioId, variante, firmada) : descargar(token, medioId, variante, firmada));
      if (esta !== generacion.current || sesionPerdida(acceso)) return;
      if (dataUrl && recordarla) recordar(clave, dataUrl);
      setEstado(dataUrl ? { tipo: 'lista', dataUrl } : { tipo: 'fallo' });
    },
    [token, medioId, sesionPerdida, recordarla, variante, ruta],
  );
  useEffect(() => {
    void cargar();
  }, [cargar]);
  const recargar = useCallback(() => cargar(true), [cargar]);
  return { estado, recargar };
}
