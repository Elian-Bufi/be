/**
 * `EVIDENCIA_VISUAL` (08 §12.4 y §21.3; precierre del 2026-10-06, §6; DL-125) contra PostgreSQL real, con cuentas y actos
 * **sintéticos**: correos en `example.invalid`, el texto propuesto del catálogo y ninguna persona real.
 * - **El texto es una propuesta**, y la API lo dice con cada requisito (`textApproval: 'PENDING_APPROVAL'`).
 * - **Sin la exigencia** (el valor por defecto, como en el despliegue), subir y ver fotos queda como en DL-120.
 * - **Con la exigencia:** subir la foto de una comida pide el acto del vínculo de Nutrición del plan vigente (403 con el
 *   vínculo y la versión); el profesional ve una foto solo con el acto vigente; revocar corta las dos cosas en la operación
 *   siguiente, sin borrar fotos ni registros, y el titular sigue viendo las suyas.
 * - **La evidencia del 08 §12.2** queda en el acto: titular, versión y hash, finalidad, alcance de vínculo, superficie,
 *   actor y autoría, con su evento y su auditoría. La base sostiene las reglas aunque el servicio fallara.
 */
import type { INestApplication } from '@nestjs/common';
import {
  ConsentimientoRevocadoResponseSchema,
  ErrorEnvelopeSchema,
  EvidenciaVisualOtorgadaResponseSchema,
  ListaDeEvidenciaVisualResponseSchema,
  RequisitoDeEvidenciaVisualResponseSchema,
  VERSION_VIGENTE,
} from '@be/domain';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import request from 'supertest';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, conSesion } from './soporte-api';
import { circuitoConPlanActivo } from './soporte-nutricion';
import { subirBytes } from './soporte-recetas';
import { prepararAsesorado, prepararProfesional, revocarB2, vinculoCompleto, type Parte } from './soporte-vinculo';

const VERSION = VERSION_VIGENTE.EVIDENCIA_VISUAL;
let exigida: INestApplication;
let sinExigir: INestApplication;

beforeAll(async () => {
  exigida = await appDePrueba({ evidenciaVisualExigida: true });
  sinExigir = await appDePrueba();
});
afterAll(async () => {
  await exigida?.close();
  await sinExigir?.close();
});

const jpeg = () => sharp({ create: { width: 320, height: 240, channels: 3, background: { r: 30, g: 170, b: 80 } } }).jpeg().toBuffer();

/** API-MED-01 de la foto de una comida, sin subir los bytes (la intención declara el tamaño): la respuesta tal cual. */
function intencionDeFoto(app: INestApplication, parte: Parte) {
  return conSesion(app, parte.token).post('/api/v1/me/media/upload-intents').send({ purpose: 'MEAL_EVIDENCE', contentType: 'image/jpeg', byteSize: 20_000, provenance: 'PERSON_PROVIDED', authorship: null });
}

/** Intención y subida de una foto de comida, cuando la API lo permite. */
async function subirFoto(app: INestApplication, parte: Parte): Promise<string> {
  const bytes = await jpeg();
  const intencion = await conSesion(app, parte.token)
    .post('/api/v1/me/media/upload-intents')
    .send({ purpose: 'MEAL_EVIDENCE', contentType: 'image/jpeg', byteSize: bytes.length, provenance: 'PERSON_PROVIDED', authorship: null })
    .expect(201);
  await subirBytes(app, intencion.body.data.uploadPath as string, bytes, 'image/jpeg').expect(200);
  return intencion.body.data.mediaId as string;
}

/** Una comida diferente con esas fotos, en el plan vigente (API-ING-02). */
function comidaConFotos(app: INestApplication, parte: Parte, planVersionId: string, mediaIds: string[]) {
  return conSesion(app, parte.token)
    .post('/api/v1/me/nutrition/meal-records')
    .send({ kind: 'DIFFERENT', activePlanId: planVersionId, dayTypeId: null, mealId: null, occurredAt: new Date().toISOString(), description: 'Comida sintética con foto', approximateQuantity: null, mediaIds });
}

const requisito = (app: INestApplication, parte: Parte, vinculoId: string) => conSesion(app, parte.token).get(`/api/v1/relationships/${vinculoId}/visual-evidence-requirement`);
const otorgar = (app: INestApplication, parte: Parte, vinculoId: string, version: string = VERSION.id, clave?: string) =>
  conSesion(app, parte.token).post(`/api/v1/relationships/${vinculoId}/visual-evidence-consents`, clave).send({ consentVersionId: version });
const listar = (app: INestApplication, parte: Parte) => conSesion(app, parte.token).get('/api/v1/me/visual-evidence-consents');
const revocar = (app: INestApplication, parte: Parte, actoId: string) => conSesion(app, parte.token).post(`/api/v1/me/visual-evidence-consents/${actoId}/revoke`).send({});

describe('DL-125 · sin la exigencia, como en el despliegue: todo queda como en DL-120', () => {
  it('el requisito dice que el texto es una propuesta y que no se exige; la foto se sube y la ve el profesional sin el acto', async () => {
    const c = await circuitoConPlanActivo(sinExigir, 'ev-sin-exigir');
    const r = await requisito(sinExigir, c.ase, c.vinculoId).expect(200);
    RequisitoDeEvidenciaVisualResponseSchema.parse(r.body);
    expect(r.body.data).toMatchObject({
      relationshipId: c.vinculoId,
      professional: { identityId: c.pro.id },
      scope: { code: 'NUTRICION' },
      category: 'MEAL_PHOTOS',
      consentVersion: { id: VERSION.id, title: VERSION.titulo, text: VERSION.texto, textHash: VERSION.hash, effectiveFrom: VERSION.vigenteDesde },
      textApproval: 'PENDING_APPROVAL',
      enforced: false,
      currentConsent: null,
    });
    const foto = await subirFoto(sinExigir, c.ase);
    await comidaConFotos(sinExigir, c.ase, c.planId, [foto]).expect(201);
    await conSesion(sinExigir, c.pro.token).get(`/api/v1/media/${foto}/access`).expect(200);
  });
});

describe('DL-125 · con la exigencia: el acto antes de la primera foto, y el profesional ve las fotos solo con el acto vigente', () => {
  let c: Awaited<ReturnType<typeof circuitoConPlanActivo>>;
  let actoId: string;
  let foto: string;

  beforeAll(async () => {
    c = await circuitoConPlanActivo(exigida, 'ev-exigida');
  });

  it('sin el acto, la intención de una foto es 403 VISUAL_EVIDENCE_ACT_REQUIRED con el vínculo y la versión a mostrar', async () => {
    const r = await intencionDeFoto(exigida, c.ase).expect(403);
    ErrorEnvelopeSchema.parse(r.body);
    expect(r.body.error).toMatchObject({ code: 'VISUAL_EVIDENCE_ACT_REQUIRED', details: { relationshipId: c.vinculoId, consentVersionId: VERSION.id } });
    // La negativa no creó ningún medio.
    expect(await exigida.get(PrismaService).medio.count({ where: { propietarioId: c.ase.id } })).toBe(0);
    const req = await requisito(exigida, c.ase, c.vinculoId).expect(200);
    expect(req.body.data).toMatchObject({ enforced: true, textApproval: 'PENDING_APPROVAL', currentConsent: null });
  });

  it('registrar el acto: sin clave, 400; una versión vieja, 409; la mostrada, 201 con la evidencia del 08 §12.2; repetirlo, el mismo acto', async () => {
    await request(exigida.getHttpServer())
      .post(`/api/v1/relationships/${c.vinculoId}/visual-evidence-consents`)
      .set('Authorization', `Bearer ${c.ase.token}`)
      .send({ consentVersionId: VERSION.id })
      .expect(400);
    const vieja = await otorgar(exigida, c.ase, c.vinculoId, 'acceso-profesional-sanitario-2026-09-demo').expect(409);
    expect(vieja.body.error.code).toBe('CONSENT_VERSION_STALE');
    // El cliente no elige el profesional: un campo de más es 400 UNKNOWN_FIELD.
    await conSesion(exigida, c.ase.token).post(`/api/v1/relationships/${c.vinculoId}/visual-evidence-consents`).send({ consentVersionId: VERSION.id, professionalId: c.pro.id }).expect(400);

    const clave = `prueba-${randomUUID()}`;
    // La superficie declarada queda en la evidencia (08 §12.2, «canal/superficie»), como la manda la APK.
    const r = await otorgar(exigida, c.ase, c.vinculoId, VERSION.id, clave).set('X-BE-Surface', 'APK').expect(201);
    EvidenciaVisualOtorgadaResponseSchema.parse(r.body);
    expect(r.body.data).toMatchObject({
      type: 'VISUAL_EVIDENCE',
      relationshipId: c.vinculoId,
      professional: { identityId: c.pro.id },
      scope: { code: 'NUTRICION' },
      category: 'MEAL_PHOTOS',
      consentVersionId: VERSION.id,
      state: 'ACTIVE',
      revokedAt: null,
    });
    actoId = r.body.data.consentId as string;

    const prisma = exigida.get(PrismaService);
    const acto = await prisma.actoRegistrable.findUniqueOrThrow({ where: { id: actoId } });
    expect(acto).toMatchObject({
      identidadId: c.ase.id,
      tipo: 'EVIDENCIA_VISUAL',
      estado: 'VIGENTE',
      versionDeTextoId: VERSION.id,
      hashDelTexto: VERSION.hash,
      finalidad: 'ACOMPANAMIENTO_NUTRICIONAL',
      alcanceDeVinculoId: c.vinculoId,
      superficie: 'APK',
      actorId: c.ase.id,
      autoriaId: c.ase.id,
    });
    expect(acto.procedencia).toMatchObject({ casoDeUso: 'UC-P07', operacion: 'API-EVI-02' });
    expect(await prisma.eventoDeDominio.count({ where: { tipo: 'ActoOtorgado', identidadId: c.ase.id, datos: { path: ['actoId'], equals: actoId } } })).toBe(1);
    expect(await prisma.registroDeAuditoria.count({ where: { operacion: 'API-EVI-02', resultado: 'EXITO', recursoId: actoId } })).toBe(1);

    // La misma clave responde lo guardado; otra clave, el mismo acto vigente con 200. No hay un segundo acto.
    expect((await otorgar(exigida, c.ase, c.vinculoId, VERSION.id, clave).expect(201)).body.data.consentId).toBe(actoId);
    expect((await otorgar(exigida, c.ase, c.vinculoId).expect(200)).body.data.consentId).toBe(actoId);
    expect(await prisma.actoRegistrable.count({ where: { identidadId: c.ase.id, tipo: 'EVIDENCIA_VISUAL' } })).toBe(1);
  });

  it('con el acto, la foto se sube y se une a la comida; la ven el titular y su profesional', async () => {
    foto = await subirFoto(exigida, c.ase);
    await comidaConFotos(exigida, c.ase, c.planId, [foto]).expect(201);
    await conSesion(exigida, c.ase.token).get(`/api/v1/media/${foto}/access`).expect(200);
    await conSesion(exigida, c.pro.token).get(`/api/v1/media/${foto}/access`).expect(200);
    const req = await requisito(exigida, c.ase, c.vinculoId).expect(200);
    expect(req.body.data.currentConsent).toMatchObject({ consentId: actoId, consentVersionId: VERSION.id });
  });

  it('solo el titular: el profesional y otro asesorado reciben el mismo 404 que lo inexistente', async () => {
    const otro = await prepararAsesorado(exigida, 'ev-otro', { a3: true });
    for (const parte of [c.pro, otro]) {
      await requisito(exigida, parte, c.vinculoId).expect(404);
      await otorgar(exigida, parte, c.vinculoId).expect(404);
      await revocar(exigida, parte, actoId).expect(404);
    }
    await requisito(exigida, c.ase, randomUUID()).expect(404);
    await revocar(exigida, c.ase, randomUUID()).expect(404);
    // Un vínculo propio de otro alcance tampoco tiene este requisito.
    const pt = await prepararProfesional(exigida, 'ev-entrenamiento', ['ENTRENAMIENTO']);
    const entrenamiento = await vinculoCompleto(exigida, pt, c.ase, 'ENTRENAMIENTO');
    await requisito(exigida, c.ase, entrenamiento.vinculoId).expect(404);
    await otorgar(exigida, c.ase, entrenamiento.vinculoId).expect(404);
  });

  it('revocar: el profesional deja de ver la foto (decisión denegada por consentimiento), el titular la sigue viendo y la próxima foto vuelve a pedir el acto', async () => {
    const r = await revocar(exigida, c.ase, actoId).expect(200);
    ConsentimientoRevocadoResponseSchema.parse(r.body);
    expect(r.body.data).toMatchObject({ consentId: actoId, state: 'REVOKED' });
    // Revocar dos veces devuelve la misma revocación.
    expect((await revocar(exigida, c.ase, actoId).expect(200)).body.data.revokedAt).toBe(r.body.data.revokedAt);

    await conSesion(exigida, c.pro.token).get(`/api/v1/media/${foto}/access`).expect(404);
    const prisma = exigida.get(PrismaService);
    const denegada = await prisma.decisionDeAcceso.findFirst({ where: { operacion: 'API-MED-03', actorId: c.pro.id, resultado: 'DENEGADA', recursoId: foto }, orderBy: { momentoDeRegistro: 'desc' } });
    expect(denegada?.dimensionesDesfavorables).toEqual(['CONSENTIMIENTO']);
    expect(denegada?.sujetoId).toBe(c.ase.id);
    await conSesion(exigida, c.ase.token).get(`/api/v1/media/${foto}/access`).expect(200);
    // La foto y el registro no se borraron.
    expect((await prisma.medio.findUniqueOrThrow({ where: { id: foto } })).estado).toBe('DISPONIBLE');
    expect((await intencionDeFoto(exigida, c.ase).expect(403)).body.error.code).toBe('VISUAL_EVIDENCE_ACT_REQUIRED');
    expect(await prisma.eventoDeDominio.count({ where: { tipo: 'ActoRevocado', identidadId: c.ase.id, datos: { path: ['actoId'], equals: actoId } } })).toBe(1);
  });

  it('volver a registrarlo es un acto nuevo; el revocado queda en la lista propia, sin IP ni agente', async () => {
    const nuevo = await otorgar(exigida, c.ase, c.vinculoId).expect(201);
    expect(nuevo.body.data.consentId).not.toBe(actoId);
    await conSesion(exigida, c.pro.token).get(`/api/v1/media/${foto}/access`).expect(200);
    const lista = await listar(exigida, c.ase).expect(200);
    ListaDeEvidenciaVisualResponseSchema.parse(lista.body);
    expect(lista.body.data.map((a: { consentId: string; state: string }) => [a.consentId, a.state])).toEqual([
      [nuevo.body.data.consentId, 'ACTIVE'],
      [actoId, 'REVOKED'],
    ]);
    expect(JSON.stringify(lista.body)).not.toMatch(/direccionIp|agenteDeUsuario|userAgent|ipAddress/);
    // El profesional no tiene actos propios de este tipo.
    expect((await listar(exigida, c.pro).expect(200)).body.data).toEqual([]);
  });

  it('sin B2 vigente no se registra (422); sin plan de Nutrición vigente, la foto no se sube (422 ACTIVE_PLAN_REQUIRED)', async () => {
    const otro = await circuitoConPlanActivo(exigida, 'ev-sin-b2');
    await revocarB2(exigida, otro.ase, otro.consentId).expect(200);
    expect((await otorgar(exigida, otro.ase, otro.vinculoId).expect(422)).body.error.code).toBe('RELATIONSHIP_NOT_READY_FOR_CONSENT');
    const sinPlan = await prepararAsesorado(exigida, 'ev-sin-plan', { a3: true });
    expect((await intencionDeFoto(exigida, sinPlan).expect(422)).body.error.code).toBe('ACTIVE_PLAN_REQUIRED');
  });

  it('la imagen de una receta no depende del acto: la exigencia es solo de la foto de una comida', async () => {
    const bytes = await jpeg();
    await conSesion(exigida, c.pro.token)
      .post('/api/v1/me/media/upload-intents')
      .send({ purpose: 'RECIPE_REFERENCE', contentType: 'image/jpeg', byteSize: bytes.length, provenance: 'AI_GENERATED', authorship: null })
      .expect(201);
  });
});

describe('DL-125 · la base sostiene las reglas del acto, aunque el servicio fallara', () => {
  it('alcance de Nutrición del titular, uno vigente por alcance, versión de su tipo, evidencia inmutable y solo VIGENTE → REVOCADO', async () => {
    const c = await circuitoConPlanActivo(exigida, 'ev-base');
    const prisma = exigida.get(PrismaService);
    const insertar = (identidad: string, alcance: string | null, version = VERSION.id) =>
      prisma.$executeRawUnsafe(
        `INSERT INTO acto_registrable (identidad_id, tipo, version_de_texto_id, hash_del_texto, finalidad, actor_id, autoria_id, procedencia, momento_de_ocurrencia, alcance_de_vinculo_id)
         VALUES ($1::uuid, 'EVIDENCIA_VISUAL', $2, 'h', 'ACOMPANAMIENTO_NUTRICIONAL', $1::uuid, $1::uuid, '{}'::jsonb, now(), $3::uuid)`,
        identidad,
        version,
        alcance,
      );
    // Sin alcance, de otro titular, o con una versión de otro tipo: no entra.
    // Sin alcance lo rechaza primero el disparador (corre antes que el CHECK); el CHECK es la red para cualquier otro tipo.
    await expect(insertar(c.ase.id, null)).rejects.toThrow(/alcance de Nutrición del titular|acto_registrable_alcance_solo_de_evidencia_visual/);
    const otro = await prepararAsesorado(exigida, 'ev-base-otro', { a3: true });
    await expect(insertar(otro.id, c.vinculoId)).rejects.toThrow(/alcance de Nutrición del titular/);
    await expect(insertar(c.ase.id, c.vinculoId, VERSION_VIGENTE.DATOS_SALUD_BE.id)).rejects.toThrow(/versión de su tipo/);
    // Otro tipo de acto no lleva alcance.
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO acto_registrable (identidad_id, tipo, version_de_texto_id, hash_del_texto, finalidad, actor_id, autoria_id, procedencia, momento_de_ocurrencia, alcance_de_vinculo_id)
         VALUES ($1::uuid, 'DATOS_SALUD_BE', $2, 'h', 'x', $1::uuid, $1::uuid, '{}'::jsonb, now(), $3::uuid)`,
        c.ase.id,
        VERSION_VIGENTE.DATOS_SALUD_BE.id,
        c.vinculoId,
      ),
    ).rejects.toThrow(/acto_registrable_alcance_solo_de_evidencia_visual/);
    // Uno vigente por alcance: el índice parcial `acto_registrable_una_evidencia_visual_vigente` (23505).
    await insertar(c.ase.id, c.vinculoId);
    await expect(insertar(c.ase.id, c.vinculoId)).rejects.toThrow(/23505[\s\S]*\(alcance_de_vinculo_id\)/);
    const [acto] = await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT id::text FROM acto_registrable WHERE alcance_de_vinculo_id = $1::uuid`, c.vinculoId);
    // La evidencia, incluido el alcance, es inmutable; revocar es la única transición, y no vuelve atrás.
    const otroAlcance = (await circuitoConPlanActivo(exigida, 'ev-base-2')).vinculoId;
    await expect(prisma.$executeRawUnsafe(`UPDATE acto_registrable SET alcance_de_vinculo_id = $2::uuid WHERE id = $1::uuid`, acto!.id, otroAlcance)).rejects.toThrow(/inmutable/);
    await prisma.$executeRawUnsafe(`UPDATE acto_registrable SET estado = 'REVOCADO', momento_de_revocacion = now() WHERE id = $1::uuid`, acto!.id);
    await expect(prisma.$executeRawUnsafe(`UPDATE acto_registrable SET estado = 'VIGENTE', momento_de_revocacion = NULL WHERE id = $1::uuid`, acto!.id)).rejects.toThrow(/TRANSICION_NO_DECLARADA/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM acto_registrable WHERE id = $1::uuid`, acto!.id)).rejects.toThrow(/no se elimina/);
  });
});
