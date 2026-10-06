/**
 * WP-NUTRICION-RECETAS · medios privados (DL-120; 09v12 §24; 08 §21) contra PostgreSQL real (§10.3).
 * - D2: la foto entra por el flujo real (intención, subida firmada, validación, recodificación y asociación) y se recupera
 *   después de reiniciar la API: los bytes viven en la base (`AlmacenDeMedios` en `postgres`).
 * - Validación en el servidor: tipo declarado y real, 10 MB (422, no 413 ni 400), medidas y decodificación completa.
 * - D8: la foto de una comida se guarda sin EXIF (ni GPS) y se lee con una ruta firmada de 15 minutos como máximo; una
 *   ruta vencida o alterada es 404.
 * - D9: otro profesional no carga una imagen en una receta ajena ni la lee; ni otro profesional ni otro asesorado leen la
 *   foto privada de una comida. La denegación es el mismo 404 que lo inexistente.
 * - La supresión a pedido (08:451) borra los bytes y deja el registro.
 */
import type { INestApplication } from '@nestjs/common';
import { AccesoAMedioResponseSchema, IntencionDeSubidaResponseSchema, MedioResponseSchema } from '@be/domain';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import request from 'supertest';
import { RutasFirmadas } from '../../apps/api/src/medios/rutas-firmadas';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activar, circuitoListoParaPlanificar, crearBorrador, patchConSesion } from './soporte-nutricion';
import {
  alimentosUsda,
  crearReceta,
  cuerpoDeReceta,
  estructuraConRecetas,
  FOTOS,
  leerContenido,
  leerImagen,
  RECETAS,
  subirBytes,
  subirImagen,
} from './soporte-recetas';
import { prepararAsesorado, prepararProfesional, type Parte } from './soporte-vinculo';

const WEBSITE = 'https://website-sintetico.example';
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba({ corsAllowedOrigins: [WEBSITE] });
});
afterAll(async () => {
  await app?.close();
});

const sha256 = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
const sintetica = (ancho: number, alto: number, formato: 'jpeg' | 'png' | 'webp' | 'gif') =>
  sharp({ create: { width: ancho, height: alto, channels: 3, background: { r: 90, g: 160, b: 60 } } })[formato]().toBuffer();

/** Una foto sintética con EXIF de cámara y GPS (Buenos Aires): lo que una persona podría subir sin saberlo. */
const conGps = () =>
  sharp({ create: { width: 640, height: 480, channels: 3, background: { r: 200, g: 120, b: 40 } } })
    .jpeg({ quality: 90 })
    .withExif({ IFD0: { Make: 'CamaraSintetica', Model: 'Modelo de prueba' }, IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '34/1 36/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '58/1 22/1 0/1' } })
    .toBuffer();

describe('D2 · la imagen de una receta: intención, subida, recodificación, asociación y lectura', () => {
  it('cada PNG del paquete entra por el flujo real y se lee como un JPEG de hasta 1600 px, sin metadatos', async () => {
    const pro = await prepararProfesional(app, 'medios-png', ['NUTRICION']);
    const prisma = app.get(PrismaService);
    for (const foto of FOTOS) {
      const { mediaId, medio } = await subirImagen(app, pro, foto, { contentType: 'image/png', provenance: 'AI_GENERATED', authorship: 'Generada por IA para la demostración' });
      expect(medio).toMatchObject({ mediaId, purpose: 'RECIPE_REFERENCE', status: 'AVAILABLE', contentType: 'image/jpeg', provenance: 'AI_GENERATED' });
      expect(Math.max(medio.width as number, medio.height as number)).toBeLessThanOrEqual(1600);
      const bytes = await leerImagen(app, pro, mediaId);
      const m = await sharp(bytes).metadata();
      expect(m.format).toBe('jpeg');
      expect(m.exif).toBeUndefined();
      expect(m.icc).toBeUndefined();
      expect(bytes.length).toBe(medio.byteSize);
      // Lo guardado es lo leído: el SHA-256 del contenido coincide con el registrado; el original, con el PNG del paquete.
      const fila = await prisma.medio.findUniqueOrThrow({ where: { id: mediaId } });
      expect(fila.sha256Procesado).toBe(sha256(bytes));
      expect(fila.sha256Original).toBe(sha256(foto));
      expect(fila.tipoOriginal).toBe('image/png');
    }
  });

  it('una imagen se asocia, se reemplaza y se retira sin tocar la receta ni borrar el medio; la historia queda', async () => {
    const pro = await prepararProfesional(app, 'medios-receta', ['NUTRICION']);
    const alimentos = await alimentosUsda(app, pro);
    const receta = (await crearReceta(app, pro, cuerpoDeReceta(RECETAS[0]!, alimentos)).expect(201)).body.data;
    const primera = await subirImagen(app, pro, FOTOS[0]!);
    const segunda = await subirImagen(app, pro, FOTOS[1]!);
    const asociar = (mediaId: string, expectedVersion: string) => conSesion(app, pro.token).put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId, expectedVersion });
    const conImagen = (await asociar(primera.mediaId, receta.version).expect(200)).body.data;
    expect(conImagen.image).toMatchObject({ mediaId: primera.mediaId, provenance: 'AI_GENERATED' });
    expect(conImagen.recipeVersionId).toBe(receta.recipeVersionId); // la imagen no emite una versión de la receta
    expect(conImagen.version).not.toBe(receta.version);
    await asociar(segunda.mediaId, receta.version).expect(409); // la versión vista ya cambió
    const reemplazada = (await asociar(segunda.mediaId, conImagen.version).expect(200)).body.data;
    expect(reemplazada.image.mediaId).toBe(segunda.mediaId);
    const retirada = (
      await conSesion(app, pro.token).delete(`/api/v1/nutrition/recipes/${receta.recipeId}/image?expectedVersion=${reemplazada.version}`).set('Idempotency-Key', claveDeIdempotencia()).expect(200)
    ).body.data;
    expect(retirada.image).toBeNull();
    expect(retirada.ingredients).toEqual(receta.ingredients);
    expect(retirada.calculation).toEqual(receta.calculation);
    // El medio retirado no se borra: su dueño lo sigue leyendo, y la historia tiene las tres filas.
    expect((await leerImagen(app, pro, segunda.mediaId)).length).toBeGreaterThan(0);
    const historia = await app.get(PrismaService).asociacionDeImagenDeReceta.findMany({ where: { recetaId: receta.recipeId }, orderBy: { numero: 'asc' } });
    expect(historia.map((h) => [h.numero, h.cambio, h.medioId])).toEqual([
      [1, 'ASOCIAR', primera.mediaId],
      [2, 'ASOCIAR', segunda.mediaId],
      [3, 'RETIRAR', null],
    ]);
    // Retirar sin imagen vigente no agrega nada; sin expectedVersion, 400.
    await conSesion(app, pro.token).delete(`/api/v1/nutrition/recipes/${receta.recipeId}/image?expectedVersion=${retirada.version}`).set('Idempotency-Key', claveDeIdempotencia()).expect(200);
    await conSesion(app, pro.token).delete(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).set('Idempotency-Key', claveDeIdempotencia()).expect(400);
  });
});

describe('Validación en el servidor (DL-120; 09v8 API-PRO-04)', () => {
  let pro: Parte;
  beforeAll(async () => {
    pro = await prepararProfesional(app, 'medios-validacion', ['NUTRICION']);
  });
  const intencion = (cuerpo: Record<string, unknown>) =>
    conSesion(app, pro.token).post('/api/v1/me/media/upload-intents').send({ purpose: 'RECIPE_REFERENCE', contentType: 'image/png', byteSize: 1000, provenance: 'AI_GENERATED', authorship: null, ...cuerpo });

  it('la intención: un tipo que no es JPEG, PNG ni WebP, o más de 10 MB, es 422 con el código del 09', async () => {
    expect((await intencion({ contentType: 'image/gif' }).expect(422)).body.error.code).toBe('FILE_TYPE_NOT_ALLOWED');
    expect((await intencion({ byteSize: 10 * 1024 * 1024 + 1 }).expect(422)).body.error.code).toBe('FILE_SIZE_NOT_ALLOWED');
    await intencion({ extra: 1 }).expect(400);
    const creada = await intencion({}).expect(201);
    IntencionDeSubidaResponseSchema.parse(creada.body);
    const r = creada.body.data;
    expect(r.uploadPath).toMatch(/^\/media\/uploads\/[A-Za-z0-9._-]+$/);
    expect(r).toMatchObject({ method: 'PUT', contentType: 'image/png', maxBytes: 10 * 1024 * 1024 });
    expect(new Date(r.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(10 * 60 * 1000);
  });

  it('la subida: tipo real, tipo distinto del declarado, bytes que no son imagen, medidas, y más de 10 MB es 422 (no 413 ni 400)', async () => {
    const subidaDe = async (bytes: Buffer, tipoDeclarado: string, tipoEnviado = tipoDeclarado) => {
      const r = (await intencion({ contentType: tipoDeclarado, byteSize: Math.min(bytes.length, 10 * 1024 * 1024) }).expect(201)).body.data;
      return subirBytes(app, r.uploadPath, bytes, tipoEnviado);
    };
    const codigo = async (p: Promise<request.Response>) => {
      const r = await p;
      return `${r.status} ${r.body?.error?.code ?? ''}`;
    };
    expect(await codigo(subidaDe(await sintetica(100, 100, 'gif'), 'image/png'))).toBe('422 FILE_TYPE_NOT_ALLOWED');
    expect(await codigo(subidaDe(await sintetica(100, 100, 'png'), 'image/png', 'image/gif'))).toBe('422 FILE_TYPE_NOT_ALLOWED');
    expect(await codigo(subidaDe(await sintetica(100, 100, 'png'), 'image/png', 'image/webp'))).toBe('422 FILE_TYPE_NOT_ALLOWED');
    expect(await codigo(subidaDe(await sintetica(100, 100, 'jpeg'), 'image/png'))).toBe('422 FILE_CONTENT_INVALID');
    expect(await codigo(subidaDe(Buffer.from('esto no es una imagen'), 'image/png'))).toBe('422 FILE_CONTENT_INVALID');
    const jpeg = await sintetica(400, 400, 'jpeg');
    expect(await codigo(subidaDe(jpeg.subarray(0, jpeg.length - 200), 'image/jpeg'))).toBe('422 FILE_CONTENT_INVALID');
    expect(await codigo(subidaDe(await sintetica(63, 300, 'png'), 'image/png'))).toBe('422 FILE_CONTENT_INVALID');
    expect(await codigo(subidaDe(await sintetica(8001, 64, 'png'), 'image/png'))).toBe('422 FILE_CONTENT_INVALID');
    expect(await codigo(subidaDe(Buffer.alloc(10 * 1024 * 1024 + 1, 7), 'image/png'))).toBe('422 FILE_SIZE_NOT_ALLOWED');
  });

  it('repetir la misma subida responde el mismo medio; otros bytes son 409 INVALID_STATE_TRANSITION; otra ruta, 404', async () => {
    const r = (await intencion({ byteSize: FOTOS[2]!.length }).expect(201)).body.data;
    const primera = await subirBytes(app, r.uploadPath, FOTOS[2]!, 'image/png').expect(200);
    MedioResponseSchema.parse(primera.body);
    const repetida = await subirBytes(app, r.uploadPath, FOTOS[2]!, 'image/png').expect(200);
    expect(repetida.body).toEqual(primera.body);
    expect((await subirBytes(app, r.uploadPath, FOTOS[0]!, 'image/png').expect(409)).body.error.code).toBe('INVALID_STATE_TRANSITION');
    await subirBytes(app, '/media/uploads/no.es-una-ruta', FOTOS[0]!, 'image/png').expect(404);
  });
});

describe('D8 · la foto de una comida: sin EXIF ni GPS, privada, con rutas que vencen', () => {
  it('el EXIF con GPS no llega a lo guardado; lo leído no tiene metadatos', async () => {
    const ase = await prepararAsesorado(app, 'medios-gps', { a3: true });
    const original = await conGps();
    const antes = await sharp(original).metadata();
    expect(antes.exif?.includes(Buffer.from([0x25, 0x88]))).toBe(true); // la etiqueta del GPS (0x8825), en el EXIF de entrada
    const { mediaId, medio } = await subirImagen(app, ase, original, { contentType: 'image/jpeg', purpose: 'MEAL_EVIDENCE' });
    expect(medio).toMatchObject({ purpose: 'MEAL_EVIDENCE', provenance: 'PERSON_PROVIDED' });
    const leida = await leerImagen(app, ase, mediaId);
    const despues = await sharp(leida).metadata();
    expect(despues.exif).toBeUndefined();
    expect(despues.xmp).toBeUndefined();
    expect(despues.icc).toBeUndefined();
    expect(leida.includes(Buffer.from('CamaraSintetica'))).toBe(false);
    expect(leida.includes(Buffer.from('Exif'))).toBe(false);
  });

  it('una foto de una comida exige A3 y siempre es aportada por la persona', async () => {
    const sinA3 = await prepararAsesorado(app, 'medios-sin-a3');
    const cuerpo = { purpose: 'MEAL_EVIDENCE', contentType: 'image/jpeg', byteSize: 1000, provenance: 'PERSON_PROVIDED', authorship: null };
    expect((await conSesion(app, sinA3.token).post('/api/v1/me/media/upload-intents').send(cuerpo).expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
    const conA3 = await prepararAsesorado(app, 'medios-ia', { a3: true });
    expect((await conSesion(app, conA3.token).post('/api/v1/me/media/upload-intents').send({ ...cuerpo, provenance: 'AI_GENERATED' }).expect(422)).body.error.code).toBe('VALIDATION_FAILED');
    // Un asesorado no sube imágenes de receta.
    expect((await conSesion(app, conA3.token).post('/api/v1/me/media/upload-intents').send({ ...cuerpo, purpose: 'RECIPE_REFERENCE' }).expect(403)).body.error.code).toBe('ACTION_FORBIDDEN');
  });

  it('una ruta de lectura vencida o alterada es 404; vence en 15 minutos como máximo; sin caché y legible desde el website', async () => {
    const pro = await prepararProfesional(app, 'medios-ruta', ['NUTRICION']);
    const { mediaId } = await subirImagen(app, pro, FOTOS[0]!);
    const leido = await conSesion(app, pro.token).get(`/api/v1/media/${mediaId}/access`).expect(200);
    AccesoAMedioResponseSchema.parse(leido.body);
    const acceso = leido.body.data;
    expect(acceso.path).toMatch(/^\/media\/content\/[A-Za-z0-9._-]+$/);
    expect(new Date(acceso.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(15 * 60 * 1000);
    const ok = await leerContenido(app, acceso.path).set('Origin', WEBSITE).expect(200);
    expect(ok.headers['content-type']).toBe('image/jpeg');
    expect(ok.headers['cache-control']).toBe('no-store');
    expect(ok.headers['access-control-allow-origin']).toBe(WEBSITE);
    expect(ok.headers['cross-origin-resource-policy']).toBe('cross-origin');
    // Alterada: un carácter de la firma o de la carga.
    const [carga, firma] = (acceso.path as string).replace('/media/content/', '').split('.') as [string, string];
    const otro = (s: string) => `${s.slice(0, -1)}${s.endsWith('A') ? 'B' : 'A'}`;
    expect((await leerContenido(app, `/media/content/${carga}.${otro(firma)}`).expect(404)).body).toBeDefined();
    await leerContenido(app, `/media/content/${otro(carga)}.${firma}`).expect(404);
    // Vencida: el reloj de las rutas pasa los 15 minutos.
    const rutas = app.get(RutasFirmadas);
    rutas.ahora = () => Date.now() + 15 * 60 * 1000 + 1000;
    try {
      await leerContenido(app, acceso.path).expect(404);
    } finally {
      rutas.ahora = Date.now;
    }
    await leerContenido(app, acceso.path).expect(200);
    // Una ruta de subida vencida tampoco sirve.
    const intencion = (await conSesion(app, pro.token).post('/api/v1/me/media/upload-intents').send({ purpose: 'RECIPE_REFERENCE', contentType: 'image/png', byteSize: FOTOS[1]!.length, provenance: 'AI_GENERATED', authorship: null }).expect(201)).body.data;
    rutas.ahora = () => Date.now() + 10 * 60 * 1000 + 1000;
    try {
      await subirBytes(app, intencion.uploadPath, FOTOS[1]!, 'image/png').expect(404);
    } finally {
      rutas.ahora = Date.now;
    }
  });
});

describe('D9 · permisos con cuentas distintas: la denegación es el mismo 404 que lo inexistente', () => {
  it('imagen de receta: otro profesional no la carga en una receta ajena, no usa un medio ajeno ni la lee; el asesorado la lee si su plan la ofrece', async () => {
    const c = await circuitoListoParaPlanificar(app, 'medios-permisos');
    const alimentos = await alimentosUsda(app, c.pro);
    const receta = (await crearReceta(app, c.pro, cuerpoDeReceta(RECETAS[0]!, alimentos)).expect(201)).body.data;
    const imagen = await subirImagen(app, c.pro, FOTOS[0]!);
    const conImagen = (await conSesion(app, c.pro.token).put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: imagen.mediaId, expectedVersion: receta.version }).expect(200)).body.data;

    const otro = await prepararProfesional(app, 'medios-otro', ['NUTRICION']);
    const suya = await subirImagen(app, otro, FOTOS[1]!);
    // En la receta ajena: 404, aunque el medio sea propio.
    await conSesion(app, otro.token).put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: suya.mediaId, expectedVersion: conImagen.version }).expect(404);
    // Un medio ajeno en una receta propia: 422 MEDIA_REFERENCE_INVALID, sin decir si existe.
    const propia = (await crearReceta(app, otro, cuerpoDeReceta(RECETAS[1]!, await alimentosUsda(app, otro))).expect(201)).body.data;
    for (const mediaId of [imagen.mediaId, randomUUID()]) {
      const r = await conSesion(app, otro.token).put(`/api/v1/nutrition/recipes/${propia.recipeId}/image`).send({ mediaId, expectedVersion: propia.version }).expect(422);
      expect(r.body.error).toMatchObject({ code: 'MEDIA_REFERENCE_INVALID', details: { issues: [{ code: 'MEDIA_REFERENCE_INVALID', path: 'mediaId' }] } });
    }
    // Leerla: el otro profesional y un asesorado sin plan, el mismo 404 que un medio inexistente.
    const inexistente = await conSesion(app, otro.token).get(`/api/v1/media/${randomUUID()}/access`).expect(404);
    expect((await conSesion(app, otro.token).get(`/api/v1/media/${imagen.mediaId}/access`).expect(404)).body).toEqual(inexistente.body);
    await conSesion(app, c.ase.token).get(`/api/v1/media/${imagen.mediaId}/access`).expect(404);
    // Con un plan activado que ofrece la receta, el asesorado la lee.
    const borrador = await crearBorrador(app, c);
    const guardado = await patchConSesion(app, c.pro.token, `/api/v1/nutrition/plans/${borrador.planId}`)
      .send({ expectedVersion: borrador.version, changes: estructuraConRecetas([{ label: receta.name, recipeVersionId: receta.recipeVersionId }], c.pollo) })
      .expect(200);
    await activar(app, c.pro, borrador.planId, guardado.body.data.version).expect(200);
    expect((await leerImagen(app, c.ase, imagen.mediaId)).length).toBeGreaterThan(0);
    // Una foto de comida no sirve como imagen de receta (la finalidad lo impide).
    const ase = await prepararAsesorado(app, 'medios-foto-como-receta', { a3: true });
    const foto = await subirImagen(app, ase, await conGps(), { contentType: 'image/jpeg', purpose: 'MEAL_EVIDENCE' });
    expect((await conSesion(app, c.pro.token).put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: foto.mediaId, expectedVersion: conImagen.version }).expect(422)).body.error.code).toBe('MEDIA_REFERENCE_INVALID');
  });

  it('una foto sin asociar: solo quien la subió; otro asesorado y cualquier profesional, 404', async () => {
    const ase = await prepararAsesorado(app, 'medios-privada', { a3: true });
    const otroAse = await prepararAsesorado(app, 'medios-privada-otro', { a3: true });
    const pro = await prepararProfesional(app, 'medios-privada-pro', ['NUTRICION']);
    const { mediaId } = await subirImagen(app, ase, await conGps(), { contentType: 'image/jpeg', purpose: 'MEAL_EVIDENCE' });
    await conSesion(app, ase.token).get(`/api/v1/media/${mediaId}/access`).expect(200);
    await conSesion(app, otroAse.token).get(`/api/v1/media/${mediaId}/access`).expect(404);
    await conSesion(app, pro.token).get(`/api/v1/media/${mediaId}/access`).expect(404);
    await request(app.getHttpServer()).get(`/api/v1/media/${mediaId}/access`).expect(401);
  });
});

describe('MED-05 · supresión a pedido (08:451): se borran los bytes y queda el registro', () => {
  it('el titular suprime su foto; nadie más puede; después no se lee por ninguna ruta', async () => {
    const ase = await prepararAsesorado(app, 'medios-supresion', { a3: true });
    const otro = await prepararAsesorado(app, 'medios-supresion-otro', { a3: true });
    const { mediaId } = await subirImagen(app, ase, await conGps(), { contentType: 'image/jpeg', purpose: 'MEAL_EVIDENCE' });
    const ruta = (await conSesion(app, ase.token).get(`/api/v1/media/${mediaId}/access`).expect(200)).body.data.path as string;
    await conSesion(app, otro.token).delete(`/api/v1/me/media/${mediaId}`).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
    const clave = claveDeIdempotencia();
    const suprimido = await conSesion(app, ase.token).delete(`/api/v1/me/media/${mediaId}`).set('Idempotency-Key', clave).expect(200);
    MedioResponseSchema.parse(suprimido.body);
    expect(suprimido.body.data).toMatchObject({ mediaId, status: 'DELETED', contentType: null, byteSize: null, width: null, height: null });
    await conSesion(app, ase.token).delete(`/api/v1/me/media/${mediaId}`).set('Idempotency-Key', clave).expect(200); // reintento
    await conSesion(app, ase.token).delete(`/api/v1/me/media/${mediaId}`).set('Idempotency-Key', claveDeIdempotencia()).expect(200); // ya suprimido
    await leerContenido(app, ruta).expect(404);
    await conSesion(app, ase.token).get(`/api/v1/media/${mediaId}/access`).expect(404);
    const prisma = app.get(PrismaService);
    expect(await prisma.contenidoDeMedio.findUnique({ where: { medioId: mediaId } })).toBeNull();
    expect(await prisma.medio.findUniqueOrThrow({ where: { id: mediaId } })).toMatchObject({ estado: 'SUPRIMIDO', motivoDeSupresion: 'PEDIDO_DEL_TITULAR' });
    expect(await prisma.registroDeSupresion.count({ where: { sujetoId: ase.id, categoria: 'EVIDENCIA_VISUAL' } })).toBe(1);
    // Una imagen de receta no se suprime por esta ruta.
    const pro = await prepararProfesional(app, 'medios-supresion-pro', ['NUTRICION']);
    const imagen = await subirImagen(app, pro, FOTOS[0]!);
    await conSesion(app, pro.token).delete(`/api/v1/me/media/${imagen.mediaId}`).set('Idempotency-Key', claveDeIdempotencia()).expect(404);
  });

  it('la base sostiene las reglas: los bytes no se reescriben ni se borran sin suprimir, y un medio no se borra', async () => {
    const pro = await prepararProfesional(app, 'medios-base', ['NUTRICION']);
    const { mediaId } = await subirImagen(app, pro, FOTOS[0]!);
    const prisma = app.get(PrismaService);
    await expect(prisma.$executeRawUnsafe(`UPDATE contenido_de_medio SET bytes = '\\x00' WHERE medio_id = '${mediaId}'`)).rejects.toThrow(/no se reescriben/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM contenido_de_medio WHERE medio_id = '${mediaId}'`)).rejects.toThrow(/solo al suprimirlo/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM medio WHERE id = '${mediaId}'`)).rejects.toThrow(/no se elimina/);
    await expect(prisma.$executeRawUnsafe(`UPDATE medio SET propietario_id = gen_random_uuid() WHERE id = '${mediaId}'`)).rejects.toThrow(/conserva su propietario/);
  });
});

describe('D2 · persistencia: los bytes viven en la base, no en el proceso', () => {
  it('después de cerrar la API y levantar otra contra la misma base, se lee el mismo contenido, con el mismo SHA-256', async () => {
    const pro = await prepararProfesional(app, 'medios-reinicio', ['NUTRICION']);
    const { mediaId } = await subirImagen(app, pro, FOTOS[1]!);
    const antes = await leerImagen(app, pro, mediaId);
    await app.close();
    app = await appDePrueba({ corsAllowedOrigins: [WEBSITE] });
    const despues = await leerImagen(app, pro, mediaId);
    expect(sha256(despues)).toBe(sha256(antes));
    expect((await app.get(PrismaService).medio.findUniqueOrThrow({ where: { id: mediaId } })).sha256Procesado).toBe(sha256(despues));
  });
});
