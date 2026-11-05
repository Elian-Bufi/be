/**
 * DL-164 FI-02 · la semilla de las dos plantillas de inicio (migración 20261104130000_formularios_de_inicio_plantillas),
 * por la API real y contra PostgreSQL:
 * - cada versión sembrada es exactamente la del dominio (`contenidoDePlantillaDeInicio`): la fila de la base y lo que
 *   sirve API-FRI-01, con los metadatos declarados;
 * - FRM-01 lista FRM-ENTRENAMIENTO con la v2 como última y seleccionable, y FRM-NUTRICION-INICIO en NUTRICION; la v1 ya
 *   no es la última de nadie;
 * - D-5: FRM-02 sobre una versión sembrada responde el 404 de lo inexistente (son V2); la v1 sigue legible, histórica;
 * - FRM-03: la v1 ya no se pide (422 FORM_TEMPLATE_NOT_SELECTABLE, sin escribir nada); la v2 sí, con los seis códigos que
 *   precarga el escritorio (CONTEXTO_DE_ENTRENAMIENTO), y su Solicitud es V2: FRM-06 no la lista, FRI-02 sí.
 */
import type { INestApplication } from '@nestjs/common';
import {
  CONTEXTO_DE_ENTRENAMIENTO,
  contenidoDePlantillaDeInicio,
  ListaDeSolicitudesPropiasV2ResponseSchema,
  PLANTILLA_ENTRENAMIENTO_V2 as ANTES_DE_ENTRENAR,
  PLANTILLA_NUTRICION_INICIO as COMO_COMES_HOY,
  VersionDePlantillaV2ResponseSchema,
  type PlantillaDeInicio,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { fri } from './soporte-formularios-v2';
import {
  MOMENTO_DE_LA_SIEMBRA,
  PLANTILLA_ENTRENAMIENTO,
  PLANTILLA_NUTRICION_INICIO,
  VERSION_ENTRENAMIENTO_V1,
  VERSION_ENTRENAMIENTO_V2,
  VERSION_NUTRICION_INICIO,
} from './soporte-plantillas-de-inicio';
import { prepararAsesorado, prepararProfesional, vinculoCompleto } from './soporte-vinculo';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

interface Sembrada {
  readonly plantilla: PlantillaDeInicio;
  readonly plantillaId: string;
  readonly versionId: string;
  readonly predecesoraId: string | null;
}
const SEMBRADAS: readonly Sembrada[] = [
  { plantilla: COMO_COMES_HOY, plantillaId: PLANTILLA_NUTRICION_INICIO, versionId: VERSION_NUTRICION_INICIO, predecesoraId: null },
  { plantilla: ANTES_DE_ENTRENAR, plantillaId: PLANTILLA_ENTRENAMIENTO, versionId: VERSION_ENTRENAMIENTO_V2, predecesoraId: VERSION_ENTRENAMIENTO_V1 },
];
/** Lo que queda en JSONB: el objeto del dominio sin sus propiedades `undefined`. */
const enJson = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;
const cantidadDeCampos = (p: PlantillaDeInicio): number => p.sections.reduce((n, s) => n + s.fields.length, 0);

/** FRM-01 entero, página por página: otras pruebas siembran plantillas y el catálogo puede pasar de una página. */
async function catalogo(token: string, filtro = ''): Promise<Map<string, Record<string, unknown>>> {
  const porClave = new Map<string, Record<string, unknown>>();
  let cursor: string | null = null;
  do {
    const r = await conSesion(app, token)
      .get(`/api/v1/form-templates?limit=50${filtro}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`)
      .expect(200);
    for (const p of r.body.data as { key: string }[]) porClave.set(p.key, p);
    cursor = r.body.page.nextCursor as string | null;
  } while (cursor);
  return porClave;
}

describe('DL-164 FI-02 · las dos plantillas de inicio en el catálogo', () => {
  it('cada versión sembrada es la del dominio: la fila de la base y lo que sirve API-FRI-01, con sus metadatos', async () => {
    const persona = await prepararAsesorado(app, 'fi02-def', { a3: true });
    for (const s of SEMBRADAS) {
      const fila = await prisma.versionDePlantillaDeFormulario.findUniqueOrThrow({ where: { id: s.versionId }, include: { plantilla: true, sucesora: { select: { id: true } } } });
      expect(fila).toMatchObject({ plantillaId: s.plantillaId, predecesoraId: s.predecesoraId, version: s.plantilla.version, nombre: s.plantilla.nombre, proposito: s.plantilla.proposito, dominio: s.plantilla.dominio, sucesora: null });
      expect(fila.plantilla.clave).toBe(s.plantilla.clave);
      expect(fila.contenido).toEqual(enJson(contenidoDePlantillaDeInicio(s.plantilla)));
      expect(fila.momentoDeRegistro.toISOString()).toBe(MOMENTO_DE_LA_SIEMBRA);
      expect((fila.procedencia as { rotulo: string }).rotulo).toContain('Catálogo sintético de demostración');

      const r = await fri(app, persona.token).definicion(s.plantillaId, s.versionId).expect(200);
      const definicion = VersionDePlantillaV2ResponseSchema.parse(r.body).data;
      expect(definicion).toMatchObject({
        templateId: s.plantillaId,
        templateVersionId: s.versionId,
        key: s.plantilla.clave,
        name: s.plantilla.nombre,
        purpose: s.plantilla.proposito,
        domain: s.plantilla.dominio,
        version: s.plantilla.version,
        status: 'SELECTABLE',
        format: 2,
        usesNewTypes: true,
        estimatedMinutes: s.plantilla.estimatedMinutes,
        supersededByVersionId: null,
        effectiveSince: MOMENTO_DE_LA_SIEMBRA,
      });
      expect(r.body.data.sections).toEqual(enJson(s.plantilla.sections));
    }
    // La v1 de Entrenamiento quedó como predecesora de la v2: una sola cadena de dos, sin bifurcar.
    const v1 = await prisma.versionDePlantillaDeFormulario.findUniqueOrThrow({ where: { id: VERSION_ENTRENAMIENTO_V1 }, include: { sucesora: { select: { id: true } } } });
    expect(v1.sucesora?.id).toBe(VERSION_ENTRENAMIENTO_V2);
    expect(await prisma.versionDePlantillaDeFormulario.count({ where: { plantillaId: PLANTILLA_ENTRENAMIENTO } })).toBe(2);
  });

  it('FRM-01 lista FRM-ENTRENAMIENTO con la v2 como última y FRM-NUTRICION-INICIO en NUTRICION; FRM-02 no sirve una versión V2 (D-5) y la v1 sigue legible, histórica', async () => {
    const pro = await prepararProfesional(app, 'fi02-cat', ['ENTRENAMIENTO']);
    const s = conSesion(app, pro.token);
    const todas = await catalogo(pro.token);
    expect([...todas.keys()]).toEqual(expect.arrayContaining(['FRM-SALUD', 'FRM-HABITOS', 'FRM-ENTRENAMIENTO', 'FRM-NUTRICION-INICIO']));
    expect([...todas.values()].map((p) => p.latestVersionId)).not.toContain(VERSION_ENTRENAMIENTO_V1);
    expect(todas.get('FRM-ENTRENAMIENTO')).toEqual({
      templateId: PLANTILLA_ENTRENAMIENTO,
      key: 'FRM-ENTRENAMIENTO',
      name: ANTES_DE_ENTRENAR.nombre,
      purpose: ANTES_DE_ENTRENAR.proposito,
      domain: 'ENTRENAMIENTO',
      status: 'SELECTABLE',
      latestVersionId: VERSION_ENTRENAMIENTO_V2,
      fieldCount: cantidadDeCampos(ANTES_DE_ENTRENAR),
      effectiveSince: MOMENTO_DE_LA_SIEMBRA,
    });
    expect(todas.get('FRM-NUTRICION-INICIO')).toEqual({
      templateId: PLANTILLA_NUTRICION_INICIO,
      key: 'FRM-NUTRICION-INICIO',
      name: COMO_COMES_HOY.nombre,
      purpose: COMO_COMES_HOY.proposito,
      domain: 'NUTRICION',
      status: 'SELECTABLE',
      latestVersionId: VERSION_NUTRICION_INICIO,
      fieldCount: cantidadDeCampos(COMO_COMES_HOY),
      effectiveSince: MOMENTO_DE_LA_SIEMBRA,
    });
    // Con el filtro de dominio, cada una en el suyo y no en el otro.
    expect((await catalogo(pro.token, '&domain=ENTRENAMIENTO')).has('FRM-ENTRENAMIENTO')).toBe(true);
    const deNutricion = await catalogo(pro.token, '&domain=NUTRICION');
    expect(deNutricion.has('FRM-NUTRICION-INICIO')).toBe(true);
    expect(deNutricion.has('FRM-ENTRENAMIENTO')).toBe(false);
    // D-5: para FRM-02 una versión V2 no existe (el mismo cuerpo que lo inexistente); la v1 se lee como histórica, en P0.
    const inexistente = await s.get(`/api/v1/form-templates/${PLANTILLA_ENTRENAMIENTO}/versions/${randomUUID()}`).expect(404);
    for (const x of SEMBRADAS) expect((await s.get(`/api/v1/form-templates/${x.plantillaId}/versions/${x.versionId}`).expect(404)).body).toEqual(inexistente.body);
    const v1 = (await s.get(`/api/v1/form-templates/${PLANTILLA_ENTRENAMIENTO}/versions/${VERSION_ENTRENAMIENTO_V1}`).expect(200)).body.data;
    expect(v1).toMatchObject({ version: '1', status: 'HISTORICAL_NOT_SELECTABLE', supersededByVersionId: VERSION_ENTRENAMIENTO_V2 });
    expect((v1.sections as { fields: { fieldCode: string }[] }[]).flatMap((x) => x.fields.map((f) => f.fieldCode))).toEqual([...CONTEXTO_DE_ENTRENAMIENTO.campos]);
  });

  it('FRM-03: la v1 histórica ya no se pide (422 FORM_TEMPLATE_NOT_SELECTABLE, sin escribir nada); la v2 sí, con los seis códigos que precarga el escritorio, y su Solicitud es V2: FRM-06 no la lista, FRI-02 sí', async () => {
    const pro = await prepararProfesional(app, 'fi02-pedir', ['ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, 'fi02-pedir', { a3: true });
    await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    const pedir = (templateVersionId: string) =>
      conSesion(app, pro.token)
        .post(`/api/v1/advisees/${ase.id}/form-requests`)
        .send({ templateVersionId, purpose: 'Planificar tu entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: [...CONTEXTO_DE_ENTRENAMIENTO.campos], requiredFieldCodes: [...CONTEXTO_DE_ENTRENAMIENTO.requeridos] });
    const historica = await pedir(VERSION_ENTRENAMIENTO_V1).expect(422);
    expect(historica.body.error.code).toBe('FORM_TEMPLATE_NOT_SELECTABLE');
    expect(await prisma.solicitudDeFormulario.count({ where: { asesoradoId: ase.id } })).toBe(0);
    const formRequestId = (await pedir(VERSION_ENTRENAMIENTO_V2).expect(201)).body.data.formRequestId as string;
    expect(await prisma.solicitudDeFormulario.count({ where: { asesoradoId: ase.id } })).toBe(1);
    // La Solicitud es V2: la APK instalada (FRM-06) no la ve; la app nueva (FRI-02) la ve con sus minutos.
    const instalada = await conSesion(app, ase.token).get('/api/v1/me/form-requests').expect(200);
    expect((instalada.body.data as { formRequestId: string }[]).map((x) => x.formRequestId)).not.toContain(formRequestId);
    const bandeja = ListaDeSolicitudesPropiasV2ResponseSchema.parse((await fri(app, ase.token).bandeja().expect(200)).body).data;
    expect(bandeja.find((x) => x.formRequestId === formRequestId)).toMatchObject({ usesNewTypes: true, estimatedMinutes: ANTES_DE_ENTRENAR.estimatedMinutes, status: 'PENDING', respondable: true, pendingProposal: null });
  });
});
