'use client';

/**
 * Medios privados en el website (DL-120): revisar una imagen antes de subirla, subirla por el flujo real (la intención
 * y los bytes a la ruta firmada) y mostrar una imagen guardada.
 * - La CSP del website admite imágenes de `self` y `data:` solamente (render.yaml). Por eso una imagen de la API se pide
 *   con su acceso firmado (API-MED-03), se descarga con fetch (CORS) y se muestra como data URL. La ruta firmada vence
 *   y no se guarda en ningún lado: la identidad de la imagen es su `mediaId`.
 * - Los límites son los del dominio, los mismos del servidor, que igual vuelve a validar todo.
 */
import { LIMITES_DE_MEDIO, TipoDeImagenSchema, type FinalidadDeMedio, type Medio, type ProcedenciaDeMedio, type TipoDeImagen } from '@be/domain';
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
  return { ok: true, imagen: { archivo, tipo: tipo.data, vistaPrevia, ...medidas } };
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
  const intencion = await api.crearIntencionDeSubida(
    token,
    { purpose: datos.finalidad, contentType: imagen.tipo, byteSize: imagen.archivo.size, provenance: datos.procedencia, authorship: datos.autoria },
    claveDeIdempotencia,
  );
  if (!intencion.ok) return intencion;
  return api.subirMedio(intencion.datos.data.uploadPath, imagen.archivo, imagen.tipo);
}

export type EstadoDeImagen = { readonly tipo: 'sin-imagen' } | { readonly tipo: 'cargando' } | { readonly tipo: 'lista'; readonly dataUrl: string } | { readonly tipo: 'fallo' };

type Descarga = { readonly acceso: Resultado<unknown>; readonly dataUrl: string | null };

/** El acceso firmado (API-MED-03) y la descarga de un medio, como data URL; `null` si alguno de los dos falla. */
async function descargar(token: string, medioId: string): Promise<Descarga> {
  const acceso = await api.accederAMedio(token, medioId);
  if (!acceso.ok) return { acceso, dataUrl: null };
  const dataUrl = await fetch(api.urlDe(acceso.datos.data.path), { credentials: 'omit', cache: 'no-store' })
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`status ${r.status}`))))
    .then(leerComoDataUrl)
    .catch(() => null);
  return { acceso, dataUrl };
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
function descargaCompartida(clave: string, token: string, medioId: string): Promise<Descarga> {
  const ya = enCurso.get(clave);
  if (ya) return ya;
  const pedido = descargar(token, medioId).finally(() => enCurso.delete(clave));
  enCurso.set(clave, pedido);
  return pedido;
}

/**
 * Una imagen guardada, como data URL: el acceso firmado (API-MED-03) y la descarga, cuando se monta o cambia el medio.
 * Con `recordar`, la de esta pestaña si ya se descargó; `recargar` la vuelve a pedir igual. Si la sesión se perdió, no
 * muestra nada: la página ya redirige. Una falla queda como `fallo`, para que la pantalla muestre su respaldo sin ocultar
 * el resto.
 */
export function useImagenDeMedio(token: string, medioId: string | null, sesionPerdida: (r: Resultado<unknown>) => boolean, opciones: { readonly recordar?: boolean } = {}) {
  const recordarla = opciones.recordar === true;
  const [estado, setEstado] = useState<EstadoDeImagen>(() => {
    if (!medioId) return { tipo: 'sin-imagen' };
    const ya = recordarla ? recordadas.get(`${token}|${medioId}`) : undefined;
    return ya ? { tipo: 'lista', dataUrl: ya } : { tipo: 'cargando' };
  });
  const generacion = useRef(0);
  const cargar = useCallback(
    async (forzar = false) => {
      const esta = ++generacion.current;
      if (!medioId) return setEstado({ tipo: 'sin-imagen' });
      const clave = `${token}|${medioId}`;
      const ya = recordarla && !forzar ? recordadas.get(clave) : undefined;
      if (ya) return setEstado({ tipo: 'lista', dataUrl: ya });
      setEstado({ tipo: 'cargando' });
      const { acceso, dataUrl } = await (recordarla ? descargaCompartida(clave, token, medioId) : descargar(token, medioId));
      if (esta !== generacion.current || sesionPerdida(acceso)) return;
      if (dataUrl && recordarla) recordar(clave, dataUrl);
      setEstado(dataUrl ? { tipo: 'lista', dataUrl } : { tipo: 'fallo' });
    },
    [token, medioId, sesionPerdida, recordarla],
  );
  useEffect(() => {
    void cargar();
  }, [cargar]);
  const recargar = useCallback(() => cargar(true), [cargar]);
  return { estado, recargar };
}
