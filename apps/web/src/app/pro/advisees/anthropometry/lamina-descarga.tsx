/**
 * «Descargar imagen» de la lámina (DL-111): el PNG al doble de su tamaño, 2160 × 3840, como el compositor
 * (html2canvas con `scale: 2`), sin dependencias nuevas.
 *
 * 1. Se copia el SVG de la pantalla y se le pone su tamaño propio (1080 × 1920).
 * 2. Cada imagen (la figura y el isotipo) se trae del mismo origen y se incrusta como data URL: un SVG cargado como
 *    imagen no puede pedir nada afuera.
 * 3. El SVG se carga como imagen desde un data URL —la CSP del website admite `img-src 'self' data:`, no `blob:`—, se
 *    dibuja en un `<canvas>` al doble y se descarga como PNG.
 *
 * La tipografía es la del sistema que use la pantalla (Poppins si está instalada; si no, la del website): una imagen
 * SVG no ve las fuentes web, y el website no incrusta ninguna.
 */
import { LIENZO_DE_LA_LAMINA } from '@be/domain';

const comoDataUrl = new Map<string, Promise<string>>();

/** El archivo de una URL del mismo origen, como data URL (y recordado: la figura no cambia entre descargas). */
function incrustar(url: string): Promise<string> {
  const previo = comoDataUrl.get(url);
  if (previo) return previo;
  const promesa = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`No se pudo leer ${url}: ${r.status}`);
      return r.blob();
    })
    .then(
      (contenido) =>
        new Promise<string>((resolver, rechazar) => {
          const lector = new FileReader();
          lector.onload = () => resolver(String(lector.result));
          lector.onerror = () => rechazar(lector.error ?? new Error('No se pudo leer la imagen'));
          lector.readAsDataURL(contenido);
        }),
    );
  comoDataUrl.set(url, promesa);
  promesa.catch(() => comoDataUrl.delete(url));
  return promesa;
}

function cargarImagen(origen: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => rechazar(new Error('La lámina no se pudo convertir en imagen'));
    imagen.src = origen;
  });
}

/** Rasteriza la lámina y la descarga como PNG con `nombreDelArchivo`. */
export async function descargarLamina(svg: SVGSVGElement, nombreDelArchivo: string): Promise<void> {
  const { ancho, alto, escalaDeExportacion } = LIENZO_DE_LA_LAMINA;
  const copia = svg.cloneNode(true) as SVGSVGElement;
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copia.setAttribute('width', String(ancho));
  copia.setAttribute('height', String(alto));
  for (const atributo of ['class', 'role', 'aria-label']) copia.removeAttribute(atributo);

  await Promise.all(
    Array.from(copia.querySelectorAll('image')).map(async (imagen) => {
      const origen = imagen.getAttribute('href');
      if (origen && !origen.startsWith('data:')) imagen.setAttribute('href', await incrustar(origen));
    }),
  );

  const texto = new XMLSerializer().serializeToString(copia);
  const imagen = await cargarImagen(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(texto)}`);
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho * escalaDeExportacion;
  lienzo.height = alto * escalaDeExportacion;
  const contexto = lienzo.getContext('2d');
  if (!contexto) throw new Error('El navegador no ofrece un lienzo para dibujar la lámina');
  contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

  const png = await new Promise<Blob>((resolver, rechazar) => lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error('No se pudo generar el PNG'))), 'image/png'));
  const url = URL.createObjectURL(png);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreDelArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
