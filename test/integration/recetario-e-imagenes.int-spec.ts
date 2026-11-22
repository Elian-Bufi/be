/**
 * WP-RECETARIO-E-IMAGENES (DL-191) contra PostgreSQL real · TEST-REC-008 y TEST-REC-010 a 019.
 * - Las imágenes livianas: la imagen de una receta en dos variantes WebP (la grande de 1200 px y la miniatura de 400 px),
 *   pedidas por variante; los medios de antes (JPEG de 1600 px) siguen sirviéndose sin variante, como los pide la APK
 *   publicada, y sus variantes se generan la primera vez; la foto de una comida no cambia.
 * - Una sola copia por huella, sin filtrar entre dueños distintos.
 * - El Recetario de BE: la semilla de las 66 (idempotente), la lista con las rutas ya firmadas y guardables, «Copiar a Mis
 *   recetas» con la misma imagen, proponer con la cesión de la foto, Administración que suma o rechaza, una receta del
 *   recetario como opción del plan y lo que ve la persona.
 * - La autorización: otro profesional recibe el mismo 404 que un recurso inexistente, salvo en el recetario, que es de
 *   lectura para Nutrición.
 * - La base sostiene las reglas aunque el código se equivoque.
 */
import type { INestApplication } from '@nestjs/common';
import { AccesoAMedioResponseSchema, CESION_DE_LA_FOTO, ListaDeRecetasResponseSchema, PropuestaAlRecetarioResponseSchema, RecetaResponseSchema } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { leerSemillaDelRecetario, sembrarRecetario } from '../../apps/api/src/nutricion/semilla-del-recetario';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { adm, administradorListo } from './soporte-administracion';
import { appDePrueba, claveDeIdempotencia, conSesion } from './soporte-api';
import { activar, circuitoListoParaPlanificar, crearBorrador, patchConSesion } from './soporte-nutricion';
import { alimentosUsda, crearReceta, cuerpoDeReceta, estructuraConRecetas, FOTOS, leerContenido, RECETAS, subirBytes, subirImagen } from './soporte-recetas';
import { RAIZ } from './soporte';
import { prepararAsesorado, prepararProfesional, type Parte } from './soporte-vinculo';

let app: INestApplication;
let prisma: PrismaService;
const admin = new PrismaClient();

beforeAll(async () => {
  app = await appDePrueba();
  prisma = app.get(PrismaService);
});
afterAll(async () => {
  await app?.close();
  await admin.$disconnect();
});

const sha256 = (b: Buffer): string => createHash('sha256').update(b).digest('hex');
const sintetica = (ancho: number, alto: number, color: { r: number; g: number; b: number }) => sharp({ create: { width: ancho, height: alto, channels: 3, background: color } }).png().toBuffer();

/** API-MED-03 con o sin variante, y API-MED-04: los bytes, sus cabeceras y sus medidas. */
async function leer(parte: Parte, mediaId: string, variante?: 'thumbnail' | 'large') {
  const acceso = await conSesion(app, parte.token).get(`/api/v1/media/${mediaId}/access${variante ? `?variant=${variante}` : ''}`).expect(200);
  AccesoAMedioResponseSchema.parse(acceso.body);
  const r = await leerContenido(app, acceso.body.data.path as string).expect(200);
  const bytes = r.body as Buffer;
  const m = await sharp(bytes).metadata();
  return { bytes, tipo: r.headers['content-type'] as string, cache: r.headers['cache-control'] as string, formato: m.format, ancho: m.width ?? 0, alto: m.height ?? 0, expiresAt: acceso.body.data.expiresAt as string, path: acceso.body.data.path as string };
}

/** Un medio de antes de DL-191: un JPEG de 1600 px en `contenido_de_medio`, sin variantes (como los que ya hay en test). */
async function medioDeAntes(pro: Parte): Promise<string> {
  const jpeg = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: { r: 180, g: 90, b: 40 } } }).jpeg({ quality: 82 }).toBuffer();
  const medio = await admin.medio.create({
    data: { propietarioId: pro.id, finalidad: 'RECETA_REFERENCIA', procedenciaDeImagen: 'GENERADA_POR_IA', autoria: null, tipoDeclarado: 'image/jpeg', bytesDeclarados: jpeg.length, procedencia: { prueba: 'medio de antes de DL-191' } },
  });
  await admin.contenidoDeMedio.create({ data: { medioId: medio.id, bytes: new Uint8Array(jpeg) } });
  await admin.medio.update({
    where: { id: medio.id },
    data: {
      estado: 'DISPONIBLE',
      tipoOriginal: 'image/jpeg',
      bytesOriginales: jpeg.length,
      anchoOriginal: 1600,
      altoOriginal: 1200,
      sha256Original: sha256(jpeg),
      tipoProcesado: 'image/jpeg',
      bytesProcesados: jpeg.length,
      anchoProcesado: 1600,
      altoProcesado: 1200,
      sha256Procesado: sha256(jpeg),
      momentoDeSubida: new Date(),
    },
  });
  return medio.id;
}

async function recetaConImagen(pro: Parte, foto: Buffer, nombre?: string) {
  const alimentos = await alimentosUsda(app, pro);
  const cuerpo = { ...cuerpoDeReceta(RECETAS[0]!, alimentos), ...(nombre ? { name: nombre } : {}) };
  const receta = (await crearReceta(app, pro, cuerpo).expect(201)).body.data;
  const imagen = await subirImagen(app, pro, foto);
  const conImagen = (await conSesion(app, pro.token).put(`/api/v1/nutrition/recipes/${receta.recipeId}/image`).send({ mediaId: imagen.mediaId, expectedVersion: receta.version }).expect(200)).body.data;
  return { receta: conImagen, mediaId: imagen.mediaId };
}

describe('DL-191 · las imágenes livianas', () => {
  it('TEST-REC-010 · la imagen de una receta se guarda en WebP: la grande (lo guardado) y la miniatura, por variante, sin caché', async () => {
    const pro = await prepararProfesional(app, 'rec-variantes', ['NUTRICION']);
    const { mediaId, medio } = await subirImagen(app, pro, FOTOS[0]!, { contentType: 'image/png' });
    expect(medio).toMatchObject({ contentType: 'image/webp', width: 1200, height: 1200 });
    const sin = await leer(pro, mediaId);
    const grande = await leer(pro, mediaId, 'large');
    const miniatura = await leer(pro, mediaId, 'thumbnail');
    expect([sin.tipo, sin.formato, sin.ancho]).toEqual(['image/webp', 'webp', 1200]);
    expect(sha256(grande.bytes)).toBe(sha256(sin.bytes));
    expect([miniatura.tipo, miniatura.formato, miniatura.ancho, miniatura.alto]).toEqual(['image/webp', 'webp', 400, 400]);
    expect(miniatura.bytes.length).toBeLessThan(grande.bytes.length);
    // Los tamaños esperados (REC-D01): una foto de comida de 1254 px queda cerca de 25 kB y 150 kB.
    expect(miniatura.bytes.length).toBeLessThan(60 * 1024);
    expect(grande.bytes.length).toBeLessThan(300 * 1024);
    for (const l of [sin, grande, miniatura]) expect(l.cache).toBe('no-store');
    // La miniatura quedó guardada con la subida; otra variante, o un parámetro desconocido, es 400.
    expect(await prisma.varianteGuardadaDeMedio.count({ where: { medioId: mediaId } })).toBe(1);
    await conSesion(app, pro.token).get(`/api/v1/media/${mediaId}/access?variant=enorme`).expect(400);
    await conSesion(app, pro.token).get(`/api/v1/media/${mediaId}/access?tamano=chico`).expect(400);
    // La variante va firmada en la ruta: pedirla en los bytes, por fuera de la firma, no cambia nada y es 400.
    await leerContenido(app, `${miniatura.path}?variant=large`).expect(400);
  });

  it('TEST-REC-011 · un medio de antes: sin variante, el JPEG de siempre (la APK publicada); con variante, se genera una vez y queda', async () => {
    const pro = await prepararProfesional(app, 'rec-de-antes', ['NUTRICION']);
    const mediaId = await medioDeAntes(pro);
    const comoLaApk = await leer(pro, mediaId);
    expect([comoLaApk.tipo, comoLaApk.formato, comoLaApk.ancho]).toEqual(['image/jpeg', 'jpeg', 1600]);
    expect(await prisma.varianteGuardadaDeMedio.count({ where: { medioId: mediaId } })).toBe(0);
    const miniatura = await leer(pro, mediaId, 'thumbnail');
    expect([miniatura.tipo, miniatura.formato, miniatura.ancho, miniatura.alto]).toEqual(['image/webp', 'webp', 400, 300]);
    expect(await prisma.varianteGuardadaDeMedio.count({ where: { medioId: mediaId } })).toBe(2);
    const grande = await leer(pro, mediaId, 'large');
    expect([grande.tipo, grande.ancho, grande.alto]).toEqual(['image/webp', 1200, 900]);
    // La segunda vez se lee lo guardado: los mismos bytes, sin generar de nuevo.
    expect(sha256((await leer(pro, mediaId, 'thumbnail')).bytes)).toBe(sha256(miniatura.bytes));
    expect(await prisma.varianteGuardadaDeMedio.count({ where: { medioId: mediaId } })).toBe(2);
    // Lo de antes no se reescribió.
    expect(sha256((await leer(pro, mediaId)).bytes)).toBe(sha256(comoLaApk.bytes));
  });

  it('TEST-REC-012 · la foto de una comida no cambia de régimen: JPEG, sin variantes, privada y sin caché', async () => {
    const ase = await prepararAsesorado(app, 'rec-foto-comida', { a3: true });
    const foto = await sharp({ create: { width: 2000, height: 1500, channels: 3, background: { r: 10, g: 200, b: 90 } } }).jpeg().toBuffer();
    const { mediaId, medio } = await subirImagen(app, ase, foto, { contentType: 'image/jpeg', purpose: 'MEAL_EVIDENCE' });
    expect(medio).toMatchObject({ contentType: 'image/jpeg', width: 1600 });
    const conVariante = await leer(ase, mediaId, 'thumbnail');
    expect([conVariante.tipo, conVariante.ancho, conVariante.cache]).toEqual(['image/jpeg', 1600, 'no-store']);
    expect(await prisma.varianteGuardadaDeMedio.count({ where: { medioId: mediaId } })).toBe(0);
    expect(new Date(conVariante.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(15 * 60 * 1000);
  });

  it('TEST-REC-013 · una sola copia por huella del mismo dueño; nunca entre dueños distintos', async () => {
    const uno = await prepararProfesional(app, 'rec-huella-uno', ['NUTRICION']);
    const otro = await prepararProfesional(app, 'rec-huella-otro', ['NUTRICION']);
    const foto = await sintetica(900, 700, { r: 120, g: 30, b: 200 });
    const primera = await subirImagen(app, uno, foto);
    const segunda = await subirImagen(app, uno, foto);
    expect(segunda.mediaId).toBe(primera.mediaId);
    expect(await prisma.medio.count({ where: { propietarioId: uno.id, estado: 'DISPONIBLE' } })).toBe(1);
    // Otra procedencia declarada es otro medio: lo declarado no se pisa.
    const otraProcedencia = await subirImagen(app, uno, foto, { provenance: 'PERSON_PROVIDED' });
    expect(otraProcedencia.mediaId).not.toBe(primera.mediaId);
    // Otro dueño con los mismos bytes recibe su propio medio, y el del primero le sigue siendo ajeno.
    const delOtro = await subirImagen(app, otro, foto);
    expect(delOtro.mediaId).not.toBe(primera.mediaId);
    const inexistente = await conSesion(app, otro.token).get(`/api/v1/media/${randomUUID()}/access`).expect(404);
    expect((await conSesion(app, otro.token).get(`/api/v1/media/${primera.mediaId}/access`).expect(404)).body).toEqual(inexistente.body);
    // Repetir la subida a la misma ruta sigue respondiendo lo mismo.
    const intencion = (await conSesion(app, uno.token).post('/api/v1/me/media/upload-intents').send({ purpose: 'RECIPE_REFERENCE', contentType: 'image/png', byteSize: foto.length, provenance: 'AI_GENERATED', authorship: null }).expect(201)).body.data;
    expect((await subirBytes(app, intencion.uploadPath, foto, 'image/png').expect(200)).body.data.mediaId).toBe(primera.mediaId);
    expect((await subirBytes(app, intencion.uploadPath, foto, 'image/png').expect(200)).body.data.mediaId).toBe(primera.mediaId);
  });

  it('TEST-REC-008 · «Mis recetas» trae las rutas ya firmadas de sus imágenes: privadas, de 15 minutos, sin caché y auditadas', async () => {
    const pro = await prepararProfesional(app, 'rec-lista-firmada', ['NUTRICION']);
    const { receta, mediaId } = await recetaConImagen(pro, await sintetica(800, 600, { r: 30, g: 160, b: 160 }), 'Tarta de la lista firmada');
    const lista = (await conSesion(app, pro.token).get('/api/v1/nutrition/recipes?limit=50').expect(200)).body;
    ListaDeRecetasResponseSchema.parse(lista);
    const enLaLista = lista.data.find((r: { recipeId: string }) => r.recipeId === receta.recipeId) as { image: { mediaId: string; paths: { thumbnail: string; large: string; expiresAt: string } } };
    expect(enLaLista.image).toMatchObject({ mediaId, paths: { thumbnail: expect.stringMatching(/^\/media\/content\//), large: expect.stringMatching(/^\/media\/content\//) } });
    expect(new Date(enLaLista.image.paths.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(15 * 60 * 1000);
    // La miniatura por la ruta de la lista: la misma de API-MED-03, sin caché (es privada).
    const miniatura = await leerContenido(app, enLaLista.image.paths.thumbnail).expect(200);
    expect([miniatura.headers['content-type'], miniatura.headers['cache-control']]).toEqual(['image/webp', 'no-store']);
    expect((await sharp(miniatura.body as Buffer).metadata()).width).toBe(400);
    const grande = await leerContenido(app, enLaLista.image.paths.large).expect(200);
    expect((await sharp(grande.body as Buffer).metadata()).width).toBe(800);
    // Cada ruta firmada en la lista queda como un acceso auditado, sin pedir uno por imagen.
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-MED-03', motivo: 'RUTA_EN_LA_LISTA', actorId: pro.id, recursoId: mediaId } })).toBe(1);
  });
});

describe('DL-191 · el Recetario de BE', () => {
  let a: Parte;
  let b: Parte;
  let persona: Parte;
  beforeAll(async () => {
    a = await prepararProfesional(app, 'rec-autora', ['NUTRICION']);
    b = await prepararProfesional(app, 'rec-otra', ['NUTRICION']);
    persona = await prepararAsesorado(app, 'rec-persona', { a3: true });
  });

  it('TEST-REC-014 · la semilla carga las 66 recetas sin profesional ni foto, y otra corrida no cambia nada', async () => {
    const recetas = leerSemillaDelRecetario(RAIZ);
    const primera = await sembrarRecetario(admin, recetas, { prueba: 'TEST-REC-014' });
    expect(primera.conProblemas).toEqual([]);
    expect(primera.creadas.length + primera.yaEstaban.length).toBe(66);
    const segunda = await sembrarRecetario(admin, recetas, { prueba: 'TEST-REC-014, otra vez' });
    expect(segunda).toEqual({ creadas: [], yaEstaban: recetas.map((r) => r.codigo), conProblemas: [] });
    const semilla = await prisma.recetaDelRecetario.findMany({ where: { claveDeSemilla: { not: null } }, include: { receta: { include: { versiones: true, imagenes: true } } } });
    expect(semilla).toHaveLength(66);
    for (const s of semilla) {
      expect(s.receta.profesionalId).toBeNull();
      expect(s.administradorId).toBeNull();
      expect(s.receta.versiones.map((v) => [v.numero, v.autorId])).toEqual([[1, null]]);
      expect(s.receta.imagenes).toEqual([]);
    }
  });

  it('TEST-REC-015 · el recetario se lee en Nutrición, de solo lectura; la persona y otra área no; se copia a Mis recetas', async () => {
    const lista = (await conSesion(app, b.token).get('/api/v1/nutrition/recipe-book?limit=50').expect(200)).body;
    ListaDeRecetasResponseSchema.parse(lista);
    expect(lista.data.every((r: { origin: string }) => r.origin === 'BE_RECIPE_BOOK')).toBe(true);
    expect(lista.page.hasMore).toBe(true);
    const resto = (await conSesion(app, b.token).get(`/api/v1/nutrition/recipe-book?limit=50&cursor=${lista.page.nextCursor}`).expect(200)).body;
    expect(lista.data.length + resto.data.length).toBeGreaterThanOrEqual(66);
    const avena = (await conSesion(app, b.token).get(`/api/v1/nutrition/recipe-book?q=${encodeURIComponent('AVENA cocida')}`).expect(200)).body.data;
    expect(avena.map((r: { name: string }) => r.name)).toContain('Avena cocida con banana y canela');
    await conSesion(app, persona.token).get('/api/v1/nutrition/recipe-book').expect(403);
    const entrena = await prepararProfesional(app, 'rec-entrena', ['ENTRENAMIENTO']);
    await conSesion(app, entrena.token).get('/api/v1/nutrition/recipe-book').expect(403);
    const delRecetario = avena[0];
    // Se lee con API-REC-03, pero no se edita ni se le cambia la imagen: para quien no es su dueño, el mismo 404.
    await conSesion(app, b.token).get(`/api/v1/nutrition/recipes/${delRecetario.recipeId}`).expect(200);
    const alimentos = await alimentosUsda(app, b);
    await conSesion(app, b.token).patch(`/api/v1/nutrition/recipes/${delRecetario.recipeId}`).set('Idempotency-Key', claveDeIdempotencia()).send({ ...cuerpoDeReceta(RECETAS[0]!, alimentos), expectedVersion: delRecetario.version }).expect(404);
    // Copiar: una receta propia con el mismo contenido, que dice de cuál salió; con la misma clave, la misma copia.
    const clave = claveDeIdempotencia();
    const copia = (await conSesion(app, b.token).post(`/api/v1/nutrition/recipe-book/${delRecetario.recipeId}/copies`, clave).send({}).expect(201)).body;
    RecetaResponseSchema.parse(copia);
    expect(copia.data).toMatchObject({ origin: 'OWN', copiedFrom: { recipeId: delRecetario.recipeId, name: delRecetario.name }, name: delRecetario.name, versionNumber: 1, proposal: null });
    expect(copia.data.calculation).toEqual(delRecetario.calculation);
    expect((await conSesion(app, b.token).post(`/api/v1/nutrition/recipe-book/${delRecetario.recipeId}/copies`, clave).send({}).expect(201)).body.data.recipeId).toBe(copia.data.recipeId);
    // Una receta propia no se copia por acá (no es del recetario): el mismo 404 que una inexistente.
    await conSesion(app, b.token).post(`/api/v1/nutrition/recipe-book/${copia.data.recipeId}/copies`).send({}).expect(404);
    await conSesion(app, b.token).post(`/api/v1/nutrition/recipe-book/${randomUUID()}/copies`).send({}).expect(404);
    await conSesion(app, persona.token).post(`/api/v1/nutrition/recipe-book/${delRecetario.recipeId}/copies`).send({}).expect(403);
  });

  it('TEST-REC-016 · proponer: la cesión de la foto se acepta en su versión y queda registrada; lo propio cargado a mano no se propone', async () => {
    const { receta, mediaId } = await recetaConImagen(a, await sintetica(1000, 800, { r: 250, g: 180, b: 20 }), 'Guiso de lentejas de la autora');
    const proponer = (cuerpo: Record<string, unknown>) => conSesion(app, a.token).post(`/api/v1/nutrition/recipes/${receta.recipeId}/proposals`).send(cuerpo);
    expect((await proponer({ expectedVersion: receta.version, photoAssignment: null }).expect(422)).body.error.details.issues).toEqual([{ code: 'PHOTO_ASSIGNMENT_REQUIRED', path: 'photoAssignment' }]);
    expect((await proponer({ expectedVersion: receta.version, photoAssignment: { textVersion: 'REC-CESION-FOTO-0', accepted: true } }).expect(422)).body.error.details.issues).toEqual([
      { code: 'PHOTO_ASSIGNMENT_OUTDATED', path: 'photoAssignment.textVersion' },
    ]);
    await proponer({ expectedVersion: 'v99', photoAssignment: { textVersion: CESION_DE_LA_FOTO.version, accepted: true } }).expect(409);
    // Otro profesional no propone una receta ajena: el mismo 404.
    await conSesion(app, b.token).post(`/api/v1/nutrition/recipes/${receta.recipeId}/proposals`).send({ expectedVersion: receta.version, photoAssignment: { textVersion: CESION_DE_LA_FOTO.version, accepted: true } }).expect(404);
    const creada = (await proponer({ expectedVersion: receta.version, photoAssignment: { textVersion: CESION_DE_LA_FOTO.version, accepted: true } }).expect(201)).body;
    PropuestaAlRecetarioResponseSchema.parse(creada);
    expect(creada.data).toMatchObject({ status: 'PENDING', photoAssignment: { textVersion: CESION_DE_LA_FOTO.version }, recipeBookRecipeId: null });
    const fila = await prisma.propuestaAlRecetario.findUniqueOrThrow({ where: { id: creada.data.proposalId } });
    expect(fila).toMatchObject({ medioId: mediaId, versionDeLaCesion: CESION_DE_LA_FOTO.version, huellaDeLaCesion: sha256(Buffer.from(CESION_DE_LA_FOTO.texto, 'utf8')), profesionalId: a.id });
    expect(fila.momentoDeLaCesion).not.toBeNull();
    // Una que espera no se propone otra vez; «Mis recetas» la muestra esperando.
    expect((await proponer({ expectedVersion: receta.version, photoAssignment: { textVersion: CESION_DE_LA_FOTO.version, accepted: true } }).expect(422)).body.error.code).toBe('INVALID_STATE_TRANSITION');
    expect((await conSesion(app, a.token).get(`/api/v1/nutrition/recipes/${receta.recipeId}`).expect(200)).body.data.proposal).toMatchObject({ status: 'PENDING', versionNumber: 1 });
    // Mientras espera, la imagen sigue siendo de la autora: otro profesional, el mismo 404.
    await conSesion(app, b.token).get(`/api/v1/media/${mediaId}/access`).expect(404);
    // Un alimento cargado a mano no se propone.
    const propio = (await conSesion(app, a.token).post('/api/v1/nutrition/catalog-items').send({ name: 'Salsa casera de la autora', itemType: 'FOOD', composition: { referenceAmount: '100g', energyKcal: 90, proteinG: 2, carbohydrateG: 10, fatG: 4 } }).expect(201)).body.data;
    const alimentos = await alimentosUsda(app, a);
    const base = cuerpoDeReceta(RECETAS[1]!, alimentos);
    const conPropio = (await crearReceta(app, a, { ...base, name: 'Con salsa propia', ingredients: [...base.ingredients, { catalogItemId: propio.catalogItemId, catalogItemVersionId: propio.versionId, quantity: { value: 30, unit: 'g' }, preparationState: 'AS_PURCHASED' }] }).expect(201)).body.data;
    const r = await conSesion(app, a.token).post(`/api/v1/nutrition/recipes/${conPropio.recipeId}/proposals`).send({ expectedVersion: conPropio.version, photoAssignment: null }).expect(422);
    expect(r.body.error.details.issues).toEqual([{ code: 'OWN_FOOD_NOT_PROPOSABLE', path: `ingredients[${base.ingredients.length}].catalogItemId` }]);
  });

  it('TEST-REC-017 · Administración ve autor y parecidas, rechaza con motivo, y suma: la imagen pasa a leerse en Nutrición, guardable', async () => {
    const administradora = await administradorListo(app, admin, `rec-${randomUUID().slice(0, 6)}`);
    const { receta, mediaId } = await recetaConImagen(a, await sintetica(1200, 900, { r: 60, g: 90, b: 220 }), 'Avena cocida con banana de la autora');
    const proponer = () =>
      conSesion(app, a.token).post(`/api/v1/nutrition/recipes/${receta.recipeId}/proposals`).send({ expectedVersion: receta.version, photoAssignment: { textVersion: CESION_DE_LA_FOTO.version, accepted: true } }).expect(201);
    const primera = (await proponer()).body.data;
    const lista = (await adm(app, administradora.token).post('/admin/recipe-proposals/query').send({ state: 'PENDING' }).expect(200)).body.data as {
      proposalId: string;
      proposedBy: { displayName: string };
      similar: { kind: string; name: string }[];
      recipe: { image: { paths: { thumbnail: string } } | null };
    }[];
    const vista = lista.find((p) => p.proposalId === primera.proposalId)!;
    expect(vista.proposedBy.displayName).toBeTruthy();
    expect(vista.similar).toContainEqual(expect.objectContaining({ kind: 'BE_RECIPE', name: 'Avena cocida con banana y canela' }));
    // Administración ve la imagen con su ruta firmada, sin caché: todavía es de la autora.
    const deLaPropuesta = await leerContenido(app, vista.recipe.image!.paths.thumbnail).expect(200);
    expect([deLaPropuesta.headers['content-type'], deLaPropuesta.headers['cache-control']]).toEqual(['image/webp', 'no-store']);
    // Un profesional no administra.
    await adm(app, a.token).post('/admin/recipe-proposals/query').send({}).expect(403);
    // Rechazar con motivo: la autora lo ve; decidir otra vez es 422.
    const decidir = (id: string, cuerpo: Record<string, unknown>) => adm(app, administradora.token).post(`/admin/recipe-proposals/${id}/decisions`).set('Idempotency-Key', claveDeIdempotencia()).send(cuerpo);
    await decidir(primera.proposalId, { decision: 'ADD', reason: 'No va' }).expect(422);
    expect((await decidir(primera.proposalId, { decision: 'REJECT', reason: 'Ya hay una parecida' }).expect(200)).body.data).toMatchObject({ status: 'REJECTED', reason: 'Ya hay una parecida' });
    expect((await decidir(primera.proposalId, { decision: 'ADD' }).expect(422)).body.error.code).toBe('INVALID_STATE_TRANSITION');
    await decidir(randomUUID(), { decision: 'ADD' }).expect(404);
    expect((await conSesion(app, a.token).get(`/api/v1/nutrition/recipes/${receta.recipeId}`).expect(200)).body.data.proposal).toMatchObject({ status: 'REJECTED', reason: 'Ya hay una parecida' });
    // Se vuelve a proponer y se suma.
    const segunda = (await proponer()).body.data;
    const sumada = (await decidir(segunda.proposalId, { decision: 'ADD' }).expect(200)).body.data;
    expect(sumada).toMatchObject({ status: 'ADDED', recipeBookRecipeId: expect.any(String) });
    const canon = await prisma.recetaDelRecetario.findUniqueOrThrow({ where: { recetaId: sumada.recipeBookRecipeId }, include: { receta: { include: { versiones: true } } } });
    expect(canon).toMatchObject({ propuestaId: segunda.proposalId, administradorId: administradora.id, claveDeSemilla: null });
    expect(canon.receta.profesionalId).toBeNull();
    expect(canon.receta.versiones.map((v) => v.autorId)).toEqual([a.id]);
    // La de la autora sigue siendo suya y dice que está en el recetario.
    expect((await conSesion(app, a.token).get(`/api/v1/nutrition/recipes/${receta.recipeId}`).expect(200)).body.data).toMatchObject({ origin: 'OWN', proposal: { status: 'ADDED' } });
    // Desde ahora la imagen la lee cualquier profesional de Nutrición, con una ruta de 6 a 7 horas que el navegador guarda.
    const deB = await leer(b, mediaId, 'thumbnail');
    expect(deB.cache).toMatch(/^private, max-age=\d+, immutable$/);
    const falta = new Date(deB.expiresAt).getTime() - Date.now();
    expect(falta).toBeGreaterThan(6 * 3600 * 1000 - 60_000);
    expect(falta).toBeLessThanOrEqual(7 * 3600 * 1000);
    // La misma ruta durante la hora: dos accesos seguidos firman lo mismo (el navegador la reusa).
    expect((await leer(b, mediaId, 'thumbnail')).path).toBe(deB.path);
    // La lista del recetario trae sus rutas ya firmadas: no hace falta un acceso por imagen.
    const enLaLista = (await conSesion(app, b.token).get(`/api/v1/nutrition/recipe-book?q=${encodeURIComponent('de la autora')}`).expect(200)).body.data;
    const laSumada = enLaLista.find((r: { recipeId: string }) => r.recipeId === sumada.recipeBookRecipeId);
    expect(laSumada.image).toMatchObject({ mediaId, paths: { thumbnail: expect.stringMatching(/^\/media\/content\//), large: expect.stringMatching(/^\/media\/content\//) } });
    const porLaLista = await leerContenido(app, laSumada.image.paths.thumbnail).expect(200);
    expect([porLaLista.headers['content-type'], porLaLista.headers['cache-control']]).toEqual(['image/webp', expect.stringMatching(/^private, max-age=/)]);
    // La persona y otra área no la leen por ser del recetario.
    await conSesion(app, persona.token).get(`/api/v1/media/${mediaId}/access`).expect(404);
    const deEntrenamiento = await prepararProfesional(app, 'rec-entrena-imagen', ['ENTRENAMIENTO']);
    await conSesion(app, deEntrenamiento.token).get(`/api/v1/media/${mediaId}/access?variant=thumbnail`).expect(404);
    // Copiarla: la copia reusa el mismo medio, sin duplicar bytes.
    const mediosAntes = await prisma.medio.count();
    const copia = (await conSesion(app, b.token).post(`/api/v1/nutrition/recipe-book/${sumada.recipeBookRecipeId}/copies`).send({}).expect(201)).body.data;
    expect(copia.image.mediaId).toBe(mediaId);
    expect(await prisma.medio.count()).toBe(mediosAntes);
    expect(await prisma.medio.count({ where: { propietarioId: b.id } })).toBe(0);
    // En «Mis recetas», la copia trae las rutas del recetario (guardables), sin una fila de auditoría por miniatura.
    const enMisRecetas = (await conSesion(app, b.token).get('/api/v1/nutrition/recipes?limit=50').expect(200)).body.data.find((r: { recipeId: string }) => r.recipeId === copia.recipeId);
    const porMisRecetas = await leerContenido(app, enMisRecetas.image.paths.thumbnail).expect(200);
    expect(porMisRecetas.headers['cache-control']).toMatch(/^private, max-age=\d+, immutable$/);
    expect(await prisma.registroDeAuditoria.count({ where: { motivo: 'RUTA_EN_LA_LISTA', actorId: b.id } })).toBe(0);
  });

  it('TEST-REC-018 · una receta del recetario como opción del plan, tal cual: la persona lee su imagen con el plan activado', async () => {
    const c = await circuitoListoParaPlanificar(app, 'rec-plan', b);
    const conImagen = (await conSesion(app, b.token).get(`/api/v1/nutrition/recipe-book?q=${encodeURIComponent('de la autora')}`).expect(200)).body.data.find(
      (r: { image: unknown }) => r.image !== null,
    ) as { recipeVersionId: string; name: string; image: { mediaId: string } };
    const borrador = await crearBorrador(app, c);
    await conSesion(app, c.ase.token).get(`/api/v1/media/${conImagen.image.mediaId}/access`).expect(404);
    const guardado = await patchConSesion(app, b.token, `/api/v1/nutrition/plans/${borrador.planId}`)
      .send({ expectedVersion: borrador.version, changes: estructuraConRecetas([{ label: conImagen.name, recipeVersionId: conImagen.recipeVersionId }], c.pollo) })
      .expect(200);
    await activar(app, b, borrador.planId, guardado.body.data.version).expect(200);
    const comoLaApk = await conSesion(app, c.ase.token).get(`/api/v1/media/${conImagen.image.mediaId}/access`).expect(200);
    AccesoAMedioResponseSchema.parse(comoLaApk.body);
    expect((await leerContenido(app, comoLaApk.body.data.path as string).expect(200)).headers['content-type']).toBe('image/webp');
  });

  it('TEST-REC-019 · la base sostiene las reglas aunque el código se equivoque', async () => {
    const rechazada = (sql: string, motivo: RegExp) => expect(admin.$executeRawUnsafe(sql)).rejects.toThrow(motivo);
    // Una receta sin profesional que no es del recetario no se confirma.
    await expect(
      admin.$transaction(async (tx) => {
        const r = await tx.receta.create({ data: { profesionalId: null } });
        await tx.versionDeReceta.create({ data: { recetaId: r.id, numero: 1, nombre: 'Suelta', porciones: 1, pasos: [], ingredientes: [{}], metodoDeCalculo: 'SUM_SOURCE_PER_100G_V1', resultado: {}, autorId: null, procedencia: {} } });
      }),
    ).rejects.toThrow(/es del Recetario de BE/);
    // Una versión sin autor en una receta propia, no.
    const propia = (await crearReceta(app, a, cuerpoDeReceta(RECETAS[2]!, await alimentosUsda(app, a))).expect(201)).body.data;
    await rechazada(
      `INSERT INTO version_de_receta (receta_id, predecesora_id, numero, nombre, porciones, pasos, ingredientes, metodo_de_calculo, resultado, autor_id, procedencia)
       VALUES ('${propia.recipeId}', '${propia.recipeVersionId}', 2, 'Sin autor', 1, '[]', '[{}]', 'SUM_SOURCE_PER_100G_V1', '{}', NULL, '{}')`,
      /tiene autor/,
    );
    // Lo que decide Administración lo escribe un administrador con su rol vigente; un profesional no.
    const propuesta = await prisma.propuestaAlRecetario.findFirstOrThrow({ where: { profesionalId: a.id, decision: { is: null } } });
    await rechazada(`INSERT INTO decision_sobre_propuesta_al_recetario (propuesta_id, resultado, administrador_id, procedencia) VALUES ('${propuesta.id}', 'RECHAZADA', '${a.id}', '{}')`, /rol vigente/);
    // La cesión, completa o nada.
    await rechazada(
      `INSERT INTO propuesta_al_recetario (receta_id, version_de_receta_id, profesional_id, medio_id, procedencia) VALUES ('${propuesta.recetaId}', '${propuesta.versionDeRecetaId}', '${a.id}', '${propuesta.medioId}', '{}')`,
      /propuesta_al_recetario_cesion_coherente/,
    );
    // Una variante no se reescribe ni se borra sin suprimir el medio; lo de solo agregar, tampoco.
    const variante = await prisma.varianteGuardadaDeMedio.findFirstOrThrow();
    await rechazada(`UPDATE variante_de_medio SET bytes = bytes WHERE medio_id = '${variante.medioId}' AND variante = '${variante.variante}'`, /no se reescribe/);
    await rechazada(`DELETE FROM variante_de_medio WHERE medio_id = '${variante.medioId}'`, /solo al suprimirlo/);
    await rechazada(`UPDATE propuesta_al_recetario SET medio_id = NULL WHERE id = '${propuesta.id}'`, /append-only/);
  });
});
