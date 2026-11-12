/**
 * WP-USO-FINAL · UF-05 (DEUDA_LEGAJO DL-169; UF-D4; 08 §12.2; 09 §31.2.6): los textos de uso real. Oráculo TEST-UF-010
 * (`docs/paquetes/WP-USO-FINAL-ORACULOS.md`).
 * - Con la API: hoy no falta ningún texto (la cuenta aceptó la vigente al darse de alta) y API-ACC-08 acepta solo la vigente.
 * - La publicación se simula en una transacción que se revierte: se insertan los términos y la privacidad nuevos (los de
 *   `textos-sin-publicar.ts`), se piden los pasos y se aceptan con las mismas funciones de la API. Revertida, el catálogo
 *   de la base sigue igual al de @be/domain.
 */
import type { INestApplication } from '@nestjs/common';
import { CAPACIDAD_TEXTOS_VIGENTES, HEADER_DE_CAPACIDADES, VERSION_VIGENTE, type CapacidadDeCliente } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { catalogoPublicando, VERSIONES_SIN_PUBLICAR } from '../../packages/domain/src/textos-sin-publicar';
import type { ContextoDeSolicitud } from '../../apps/api/src/http/contexto';
import { pasosDeTextosPendientes, registrarAceptacionVigente } from '../../apps/api/src/identidad/textos-vigentes';
import { appDePrueba, claveDeIdempotencia, conSesion, correoSintetico, DECLARACION_DE_MAYORIA, registrarOk, tokenDe } from './soporte-api';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const CAPAZ: ReadonlySet<CapacidadDeCliente> = new Set([CAPACIDAD_TEXTOS_VIGENTES]);
const ACEPTAR = '/api/v1/me/legal-acceptances';

describe('TEST-UF-010 · la versión vigente de los textos, con la API', () => {
  it('una cuenta nueva no tiene textos pendientes, con la capacidad o sin ella', async () => {
    const token = await tokenDe(app, (await registrarCon('uf05-nueva')).correo, 'WEB');
    for (const capacidades of [CAPACIDAD_TEXTOS_VIGENTES, '']) {
      const r = await conSesion(app, token).get('/api/v1/me/pending-steps').set(HEADER_DE_CAPACIDADES, capacidades).expect(200);
      expect(r.body).toEqual({ data: { steps: [] } });
    }
  });

  it('API-ACC-08 acepta solo la vigente: la ya aceptada responde 200 sin otro acto; otra versión, el 422 de su texto', async () => {
    const { id, correo } = await registrarCon('uf05-acc08');
    const yo = conSesion(app, await tokenDe(app, correo, 'WEB'));
    const actos = () => prisma.actoRegistrable.count({ where: { identidadId: id } });
    const antes = await actos();
    const aceptada = await yo.post(ACEPTAR).send({ text: 'TERMS', versionId: VERSION_VIGENTE.TERMINOS.id }).expect(200);
    expect(aceptada.body.data).toMatchObject({ text: 'TERMS', versionId: VERSION_VIGENTE.TERMINOS.id });
    expect(await actos()).toBe(antes);
    const sinPublicar = VERSIONES_SIN_PUBLICAR.find((v) => v.tipo === 'TERMINOS')!.id;
    expect((await yo.post(ACEPTAR).send({ text: 'TERMS', versionId: sinPublicar }).expect(422)).body.error.code).toBe('TERMS_VERSION_NOT_ACCEPTABLE');
    expect((await yo.post(ACEPTAR).send({ text: 'PRIVACY', versionId: VERSION_VIGENTE.TERMINOS.id }).expect(422)).body.error.code).toBe('PRIVACY_VERSION_NOT_ACCEPTABLE');
    await yo.post(ACEPTAR).send({ text: 'TERMS', versionId: VERSION_VIGENTE.TERMINOS.id, extra: 1 }).expect(400);
    await request(app.getHttpServer()).post(ACEPTAR).send({ text: 'TERMS', versionId: VERSION_VIGENTE.TERMINOS.id }).expect(401);
    expect(await actos()).toBe(antes);
  });

  it('API-ACC-09 da el texto de una versión publicada, sin sesión; una sin publicar o inventada, 404 (UF-T57)', async () => {
    // Revisión adversarial de la etapa 2: la APK del 25/11 no trae las versiones que se publiquen después; las lee acá.
    const vigente = VERSION_VIGENTE.PRIVACIDAD_INFO;
    const r = await request(app.getHttpServer()).get(`/api/v1/legal-texts/${vigente.id}`).expect(200);
    expect(r.headers['cache-control']).toMatch(/^public, max-age=\d+$/);
    expect(r.body).toEqual({
      data: { versionId: vigente.id, type: 'PRIVACIDAD_INFO', title: vigente.titulo, purpose: vigente.finalidad, effectiveFrom: vigente.vigenteDesde, text: vigente.texto, sha256: vigente.hash, replaces: vigente.reemplazaA },
    });
    // El mismo texto y el mismo hash que la base sembró.
    expect(await prisma.versionDeTexto.findUniqueOrThrow({ where: { id: vigente.id } })).toMatchObject({ hash: vigente.hash });
    const sinPublicar = VERSIONES_SIN_PUBLICAR.find((v) => v.tipo === 'PRIVACIDAD_INFO')!.id;
    for (const id of [sinPublicar, 'privacidad-2099-01']) expect((await request(app.getHttpServer()).get(`/api/v1/legal-texts/${id}`).expect(404)).body.error.code).toBe('RESOURCE_NOT_FOUND');
    await request(app.getHttpServer()).get(`/api/v1/legal-texts/${vigente.id}?x=1`).expect(400);
  });

  it('el alta con la versión vigente sigue igual con la capacidad o sin ella; una inventada, el 422 de siempre (UF-T57)', async () => {
    for (const capacidades of [CAPACIDAD_TEXTOS_VIGENTES, '']) {
      const correo = correoSintetico(`uf05-alta-${capacidades ? 'capaz' : 'sin'}`);
      const cuerpo = (terminos: string) => ({
        registrationIntent: 'ADVISEE',
        identity: { localIdentifier: correo, localCredential: 'clave-sintetica-uf05-alta' },
        profile: { displayName: 'Persona Sintética' },
        termsAcceptance: { versionId: terminos },
        privacyAcknowledgement: { versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id },
        adultDeclaration: DECLARACION_DE_MAYORIA,
      });
      const alta = (terminos: string) =>
        request(app.getHttpServer()).post('/api/v1/registrations').set('Idempotency-Key', claveDeIdempotencia()).set(HEADER_DE_CAPACIDADES, capacidades).send(cuerpo(terminos));
      expect((await alta('terminos-1999-01').expect(422)).body.error.code).toBe('TERMS_VERSION_NOT_ACCEPTABLE');
      const creada = await alta(VERSION_VIGENTE.TERMINOS.id).expect(201);
      const actos = await prisma.actoRegistrable.findMany({ where: { identidadId: creada.body.data.identityId, tipo: { in: ['TERMINOS', 'PRIVACIDAD_INFO'] } } });
      expect(actos.map((a) => a.versionDeTextoId).sort()).toEqual([VERSION_VIGENTE.PRIVACIDAD_INFO.id, VERSION_VIGENTE.TERMINOS.id].sort());
    }
  });
});

describe('TEST-UF-010 · publicada la versión nueva, «Antes de seguir» la pide y API-ACC-08 la registra (en una transacción que se revierte)', () => {
  it('pide los dos textos a quien aceptó los anteriores, solo al cliente capaz; aceptarlos deja la lista vacía; nada queda en la base', async () => {
    const { id } = await registrarCon('uf05-publicada');
    const nuevas = VERSIONES_SIN_PUBLICAR.filter((v) => v.tipo === 'TERMINOS' || v.tipo === 'PRIVACIDAD_INFO');
    const desde = new Date();
    const { vigentes } = catalogoPublicando(nuevas, desde.toISOString());
    const ctx: ContextoDeSolicitud = { requestId: null, momentoDeRecepcion: desde, superficie: 'WEB', direccionIp: null, agenteDeUsuario: null, capacidades: CAPAZ };
    const procedencia = { fuente: 'PROPIA', casoDeUso: 'UC-P25', operacion: 'API-ACC-08', superficie: 'WEB', requestId: null } as const;
    class Revertir extends Error {}

    await expect(
      prisma.$transaction(
        async (tx) => {
          for (const v of nuevas) {
            await tx.versionDeTexto.create({ data: { id: v.id, tipo: v.tipo, titulo: v.titulo, finalidad: v.finalidad, texto: v.texto, hash: v.hash, vigenteDesde: desde, reemplazaAId: v.reemplazaA } });
          }
          const terminos = nuevas.find((v) => v.tipo === 'TERMINOS')!;
          const privacidad = nuevas.find((v) => v.tipo === 'PRIVACIDAD_INFO')!;
          expect(await pasosDeTextosPendientes(tx, id, CAPAZ, vigentes)).toEqual([
            { step: 'ACCEPT_TERMS', suggestion: terminos.id },
            { step: 'ACKNOWLEDGE_PRIVACY', suggestion: privacidad.id },
          ]);
          // La APK 0.24 no declara la capacidad: nunca recibe un paso de textos.
          expect(await pasosDeTextosPendientes(tx, id, new Set(), vigentes)).toEqual([]);

          const momento = new Date();
          const a1 = await registrarAceptacionVigente(tx, { identidadId: id, texto: 'TERMS', versionId: terminos.id, ctx, procedencia, momento }, vigentes);
          expect(a1.creado).toBe(true);
          expect(await tx.actoRegistrable.findUniqueOrThrow({ where: { id: a1.respuesta.data.actId } })).toMatchObject({ tipo: 'TERMINOS', versionDeTextoId: terminos.id, hashDelTexto: terminos.hash, superficie: 'WEB', actorId: id, autoriaId: id });
          expect(await pasosDeTextosPendientes(tx, id, CAPAZ, vigentes)).toEqual([{ step: 'ACKNOWLEDGE_PRIVACY', suggestion: privacidad.id }]);
          // La versión anterior ya no se acepta.
          await expect(registrarAceptacionVigente(tx, { identidadId: id, texto: 'PRIVACY', versionId: VERSION_VIGENTE.PRIVACIDAD_INFO.id, ctx, procedencia, momento }, vigentes)).rejects.toMatchObject({
            code: 'PRIVACY_VERSION_NOT_ACCEPTABLE',
          });
          const a2 = await registrarAceptacionVigente(tx, { identidadId: id, texto: 'PRIVACY', versionId: privacidad.id, ctx, procedencia, momento }, vigentes);
          expect(a2.creado).toBe(true);
          expect(await pasosDeTextosPendientes(tx, id, CAPAZ, vigentes)).toEqual([]);
          // Aceptar otra vez no duplica.
          const otraVez = await registrarAceptacionVigente(tx, { identidadId: id, texto: 'TERMS', versionId: terminos.id, ctx, procedencia, momento }, vigentes);
          expect(otraVez).toMatchObject({ creado: false, respuesta: { data: { actId: a1.respuesta.data.actId } } });
          throw new Revertir();
        },
        { timeout: 60_000 },
      ),
    ).rejects.toBeInstanceOf(Revertir);

    for (const v of nuevas) expect(await prisma.versionDeTexto.findUnique({ where: { id: v.id } })).toBeNull();
    expect(await prisma.actoRegistrable.count({ where: { identidadId: id, versionDeTextoId: { in: nuevas.map((v) => v.id) } } })).toBe(0);
  });
});

async function registrarCon(etiqueta: string): Promise<{ id: string; correo: string }> {
  const correo = correoSintetico(etiqueta);
  return { id: await registrarOk(app, correo, 'WEB'), correo };
}
