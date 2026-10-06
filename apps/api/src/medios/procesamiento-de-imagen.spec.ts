import sharp from 'sharp';
import { ErrorDeApi } from '../http/errores';
import { procesarImagen, tipoAdmitido } from './procesamiento-de-imagen';

/** Una imagen sintética de color liso, generada en la prueba (ninguna foto real). */
const imagen = (ancho: number, alto: number, formato: 'jpeg' | 'png' | 'webp' | 'gif', alfa = false) =>
  sharp({ create: { width: ancho, height: alto, channels: alfa ? 4 : 3, background: alfa ? { r: 30, g: 120, b: 200, alpha: 0.5 } : { r: 30, g: 120, b: 200 } } })
    [formato]()
    .toBuffer();

const codigo = async (p: Promise<unknown>): Promise<string> => {
  try {
    await p;
    return 'SIN ERROR';
  } catch (e) {
    return e instanceof ErrorDeApi ? e.code : String(e);
  }
};

describe('DL-120 · validación y recodificación de una imagen', () => {
  it('admite JPEG, PNG y WebP por su Content-Type, sin parámetros ni mayúsculas', () => {
    expect(tipoAdmitido('image/png')).toBe('image/png');
    expect(tipoAdmitido('IMAGE/JPEG; charset=binary')).toBe('image/jpeg');
    expect(tipoAdmitido('image/webp')).toBe('image/webp');
    expect(tipoAdmitido('image/gif')).toBeNull();
    expect(tipoAdmitido(undefined)).toBeNull();
  });

  it('guarda un JPEG de calidad 82, con 1600 px como máximo en el lado mayor y sin agrandar', async () => {
    const grande = await procesarImagen(await imagen(3000, 2000, 'webp'), 'image/webp');
    expect(grande.procesada).toMatchObject({ tipo: 'image/jpeg', ancho: 1600, alto: 1067 });
    expect(grande.original).toMatchObject({ tipo: 'image/webp', ancho: 3000, alto: 2000 });
    const chica = await procesarImagen(await imagen(200, 120, 'png'), 'image/png');
    expect(chica.procesada).toMatchObject({ ancho: 200, alto: 120 });
    expect((await sharp(chica.procesada.contenido).metadata()).format).toBe('jpeg');
    expect(chica.original.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('aplana la transparencia sobre blanco', async () => {
    const r = await procesarImagen(await imagen(100, 80, 'png', true), 'image/png');
    const m = await sharp(r.procesada.contenido).metadata();
    expect(m.hasAlpha).toBe(false);
  });

  it('quita EXIF (con GPS) e ICC: lo guardado no lleva metadatos', async () => {
    const conMetadatos = await sharp({ create: { width: 200, height: 120, channels: 3, background: { r: 200, g: 100, b: 50 } } })
      .jpeg()
      .withExif({ IFD0: { Make: 'CamaraSintetica' }, IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '34/1 36/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '58/1 22/1 0/1' } })
      .withIccProfile('p3')
      .toBuffer();
    const entrada = await sharp(conMetadatos).metadata();
    expect(entrada.exif?.includes(Buffer.from([0x25, 0x88]))).toBe(true); // la etiqueta del GPS (0x8825)
    expect(entrada.icc).toBeDefined();
    const r = await procesarImagen(conMetadatos, 'image/jpeg');
    const salida = await sharp(r.procesada.contenido).metadata();
    expect(salida.exif).toBeUndefined();
    expect(salida.icc).toBeUndefined();
    expect(salida.xmp).toBeUndefined();
    expect(r.procesada.contenido.includes(Buffer.from('CamaraSintetica'))).toBe(false);
  });

  it('rechaza otro formato (FILE_TYPE_NOT_ALLOWED), otro tipo que el declarado o bytes que no son imagen (FILE_CONTENT_INVALID)', async () => {
    expect(await codigo(procesarImagen(await imagen(100, 100, 'gif'), 'image/png'))).toBe('FILE_TYPE_NOT_ALLOWED');
    expect(await codigo(procesarImagen(await imagen(100, 100, 'jpeg'), 'image/png'))).toBe('FILE_CONTENT_INVALID');
    expect(await codigo(procesarImagen(Buffer.from('esto no es una imagen'), 'image/png'))).toBe('FILE_CONTENT_INVALID');
    const jpeg = await imagen(300, 300, 'jpeg');
    expect(await codigo(procesarImagen(jpeg.subarray(0, jpeg.length - 300), 'image/jpeg'))).toBe('FILE_CONTENT_INVALID');
  });

  it('rechaza medidas fuera de 64 a 8000 px por lado (FILE_CONTENT_INVALID)', async () => {
    expect(await codigo(procesarImagen(await imagen(63, 200, 'png'), 'image/png'))).toBe('FILE_CONTENT_INVALID');
    expect(await codigo(procesarImagen(await imagen(8001, 64, 'png'), 'image/png'))).toBe('FILE_CONTENT_INVALID');
    expect(await codigo(procesarImagen(await imagen(64, 64, 'png'), 'image/png'))).toBe('SIN ERROR');
  });
});
