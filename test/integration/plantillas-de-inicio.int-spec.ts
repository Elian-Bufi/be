/**
 * La semilla de las plantillas de inicio, por la API real y contra PostgreSQL:
 * - DL-164 FI-02 (migración 20261104130000_formularios_de_inicio_plantillas): FRM-NUTRICION-INICIO v1 y FRM-ENTRENAMIENTO
 *   v2, de formato 2;
 * - DL-165 FR-06 (migración 20261105120000_formularios_ronda_2_plantillas): sus sucesoras de formato 3, FRM-NUTRICION-INICIO
 *   v2 y FRM-ENTRENAMIENTO v3, con la parte «Tus hábitos»;
 * - DL-165, ronda 2.1 (migración 20261106120000_formularios_ronda_2_1_plantillas): «Tus hábitos» aparte (FRM-HABITOS v2,
 *   sucesora de la v1 de P0) y las de área sin la parte (FRM-NUTRICION-INICIO v3 y FRM-ENTRENAMIENTO v4), las vigentes.
 * Lo que se prueba:
 * - cada versión sembrada es exactamente la del dominio (`contenidoDePlantillaDeInicio`): la fila de la base y lo que
 *   sirve API-FRI-01, con los metadatos declarados y la cadena de sucesión (v1 → v2 → v3 → v4 en Entrenamiento, v1 → v2 →
 *   v3 en Nutrición, v1 → v2 en Hábitos);
 * - D-10: una de formato 3 solo se le sirve a quien declara `forms-format-3`; para los demás, el 404 de lo inexistente;
 * - FRM-01 lista las dos con su versión de formato 3 como última; FRM-02 no sirve ninguna versión V2 (D-5); la v1 de
 *   Entrenamiento sigue legible, histórica;
 * - FRM-03: las anteriores ya no se piden (422 FORM_TEMPLATE_NOT_SELECTABLE, sin escribir nada); la vigente sí, completa,
 *   como la pide el escritorio desde Entrenamiento (DL-165 D-29: todas sus preguntas menos el embarazo y, requeridas, las
 *   que sugiere la plantilla), y su Solicitud no la ven ni FRM-06 ni FRI-02 sin la capacidad; con la capacidad, FRI-02 la
 *   lista con eso.
 */
import type { INestApplication } from '@nestjs/common';
import {
  camposEnOrden,
  CONTEXTO_DE_ENTRENAMIENTO,
  contenidoDePlantillaDeInicio,
  ListaDeSolicitudesPropiasV2ResponseSchema,
  PLANTILLA_ENTRENAMIENTO_V2 as ANTES_DE_ENTRENAR,
  PLANTILLA_ENTRENAMIENTO_V3 as ANTES_DE_ENTRENAR_V3,
  PLANTILLA_ENTRENAMIENTO_V4 as ANTES_DE_ENTRENAR_V4,
  PLANTILLA_HABITOS_V2 as TUS_HABITOS,
  PLANTILLA_NUTRICION_INICIO as COMO_COMES_HOY,
  PLANTILLA_NUTRICION_INICIO_V2 as COMO_COMES_HOY_V2,
  PLANTILLA_NUTRICION_INICIO_V3 as COMO_COMES_HOY_V3,
  VersionDePlantillaV2ResponseSchema,
  type PlantillaDeInicio,
} from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba, conSesion } from './soporte-api';
import { CON_FORMATO_3, fri } from './soporte-formularios-v2';
import {
  catalogoDePlantillas,
  MOMENTO_DE_LA_RONDA_2,
  MOMENTO_DE_LA_RONDA_2_1,
  MOMENTO_DE_LA_SIEMBRA,
  PLANTILLA_ENTRENAMIENTO,
  PLANTILLA_HABITOS,
  PLANTILLA_NUTRICION_INICIO,
  VERSION_ENTRENAMIENTO_V1,
  VERSION_ENTRENAMIENTO_V2,
  VERSION_ENTRENAMIENTO_V3,
  VERSION_ENTRENAMIENTO_V4,
  VERSION_HABITOS_V1,
  VERSION_HABITOS_V2,
  VERSION_NUTRICION_INICIO,
  VERSION_NUTRICION_INICIO_V2,
  VERSION_NUTRICION_INICIO_V3,
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
  /** La que la sucede, si ya no es la vigente. */
  readonly sucesoraId: string | null;
  readonly momento: string;
}
const SEMBRADAS: readonly Sembrada[] = [
  { plantilla: COMO_COMES_HOY, plantillaId: PLANTILLA_NUTRICION_INICIO, versionId: VERSION_NUTRICION_INICIO, predecesoraId: null, sucesoraId: VERSION_NUTRICION_INICIO_V2, momento: MOMENTO_DE_LA_SIEMBRA },
  { plantilla: ANTES_DE_ENTRENAR, plantillaId: PLANTILLA_ENTRENAMIENTO, versionId: VERSION_ENTRENAMIENTO_V2, predecesoraId: VERSION_ENTRENAMIENTO_V1, sucesoraId: VERSION_ENTRENAMIENTO_V3, momento: MOMENTO_DE_LA_SIEMBRA },
  { plantilla: COMO_COMES_HOY_V2, plantillaId: PLANTILLA_NUTRICION_INICIO, versionId: VERSION_NUTRICION_INICIO_V2, predecesoraId: VERSION_NUTRICION_INICIO, sucesoraId: VERSION_NUTRICION_INICIO_V3, momento: MOMENTO_DE_LA_RONDA_2 },
  { plantilla: ANTES_DE_ENTRENAR_V3, plantillaId: PLANTILLA_ENTRENAMIENTO, versionId: VERSION_ENTRENAMIENTO_V3, predecesoraId: VERSION_ENTRENAMIENTO_V2, sucesoraId: VERSION_ENTRENAMIENTO_V4, momento: MOMENTO_DE_LA_RONDA_2 },
  // Ronda 2.1 (D-15 nueva): las vigentes.
  { plantilla: TUS_HABITOS, plantillaId: PLANTILLA_HABITOS, versionId: VERSION_HABITOS_V2, predecesoraId: VERSION_HABITOS_V1, sucesoraId: null, momento: MOMENTO_DE_LA_RONDA_2_1 },
  { plantilla: COMO_COMES_HOY_V3, plantillaId: PLANTILLA_NUTRICION_INICIO, versionId: VERSION_NUTRICION_INICIO_V3, predecesoraId: VERSION_NUTRICION_INICIO_V2, sucesoraId: null, momento: MOMENTO_DE_LA_RONDA_2_1 },
  { plantilla: ANTES_DE_ENTRENAR_V4, plantillaId: PLANTILLA_ENTRENAMIENTO, versionId: VERSION_ENTRENAMIENTO_V4, predecesoraId: VERSION_ENTRENAMIENTO_V3, sucesoraId: null, momento: MOMENTO_DE_LA_RONDA_2_1 },
];
/** Lo que queda en JSONB: el objeto del dominio sin sus propiedades `undefined`. */
const enJson = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;
const cantidadDeCampos = (p: PlantillaDeInicio): number => p.sections.reduce((n, s) => n + s.fields.length, 0);

/** FRM-01 entero, página por página: otras pruebas siembran plantillas y el catálogo puede pasar de una página. */
const catalogo = (token: string, filtro = '') => catalogoDePlantillas(app, token, filtro);

describe('DL-164 FI-02, DL-165 FR-06 y la ronda 2.1 (FR-12) · las plantillas de inicio en el catálogo', () => {
  it('cada versión sembrada es la del dominio: la fila de la base y lo que sirve API-FRI-01, con sus metadatos y su cadena; la de formato 3, solo con la capacidad', async () => {
    const persona = await prepararAsesorado(app, 'fi02-def', { a3: true });
    const inexistente = await fri(app, persona.token).definicion(PLANTILLA_ENTRENAMIENTO, randomUUID()).expect(404);
    for (const s of SEMBRADAS) {
      const fila = await prisma.versionDePlantillaDeFormulario.findUniqueOrThrow({ where: { id: s.versionId }, include: { plantilla: true, sucesora: { select: { id: true } } } });
      expect(fila).toMatchObject({ plantillaId: s.plantillaId, predecesoraId: s.predecesoraId, version: s.plantilla.version, nombre: s.plantilla.nombre, proposito: s.plantilla.proposito, dominio: s.plantilla.dominio });
      expect(fila.sucesora?.id ?? null).toBe(s.sucesoraId);
      expect(fila.plantilla.clave).toBe(s.plantilla.clave);
      expect(fila.contenido).toEqual(enJson(contenidoDePlantillaDeInicio(s.plantilla)));
      expect(fila.momentoDeRegistro.toISOString()).toBe(s.momento);
      expect((fila.procedencia as { rotulo: string }).rotulo).toContain('Catálogo sintético de demostración');

      // El website y la APK nueva declaran `forms-format-3`: leen todas.
      const r = await fri(app, persona.token, CON_FORMATO_3).definicion(s.plantillaId, s.versionId).expect(200);
      const definicion = VersionDePlantillaV2ResponseSchema.parse(r.body).data;
      expect(definicion).toMatchObject({
        templateId: s.plantillaId,
        templateVersionId: s.versionId,
        key: s.plantilla.clave,
        name: s.plantilla.nombre,
        purpose: s.plantilla.proposito,
        domain: s.plantilla.dominio,
        version: s.plantilla.version,
        status: s.sucesoraId ? 'HISTORICAL_NOT_SELECTABLE' : 'SELECTABLE',
        format: s.plantilla.formato,
        usesNewTypes: true,
        estimatedMinutes: s.plantilla.estimatedMinutes,
        supersededByVersionId: s.sucesoraId,
        effectiveSince: s.momento,
      });
      expect(r.body.data.sections).toEqual(enJson(s.plantilla.sections));
      // Sin la capacidad (la APK 0.20), las de formato 2 se leen igual y las de formato 3 son el 404 de lo inexistente.
      const sinCapacidad = await fri(app, persona.token).definicion(s.plantillaId, s.versionId);
      if (s.plantilla.formato === 2) expect(sinCapacidad.status).toBe(200);
      else expect([sinCapacidad.status, sinCapacidad.body]).toEqual([404, inexistente.body]);
    }
    // Una sola cadena por plantilla, sin bifurcar: v1 → v2 → v3 → v4 en Entrenamiento, v1 → v2 → v3 en Nutrición y v1 → v2
    // en Hábitos (la v1 es la de P0).
    const v1 = await prisma.versionDePlantillaDeFormulario.findUniqueOrThrow({ where: { id: VERSION_ENTRENAMIENTO_V1 }, include: { sucesora: { select: { id: true } } } });
    expect(v1.sucesora?.id).toBe(VERSION_ENTRENAMIENTO_V2);
    const habitosV1 = await prisma.versionDePlantillaDeFormulario.findUniqueOrThrow({ where: { id: VERSION_HABITOS_V1 }, include: { sucesora: { select: { id: true } } } });
    expect([habitosV1.predecesoraId, habitosV1.sucesora?.id]).toEqual([null, VERSION_HABITOS_V2]);
    expect(await prisma.versionDePlantillaDeFormulario.count({ where: { plantillaId: PLANTILLA_ENTRENAMIENTO } })).toBe(4);
    expect(await prisma.versionDePlantillaDeFormulario.count({ where: { plantillaId: PLANTILLA_NUTRICION_INICIO } })).toBe(3);
    expect(await prisma.versionDePlantillaDeFormulario.count({ where: { plantillaId: PLANTILLA_HABITOS } })).toBe(2);
  });

  it('FRM-01 lista las tres con su versión de la ronda 2.1 como última; FRM-02 no sirve ninguna versión V2 (D-5) y las v1 de P0 siguen legibles, históricas', async () => {
    const pro = await prepararProfesional(app, 'fi02-cat', ['ENTRENAMIENTO']);
    const s = conSesion(app, pro.token);
    const todas = await catalogo(pro.token);
    expect([...todas.keys()]).toEqual(expect.arrayContaining(['FRM-SALUD', 'FRM-HABITOS', 'FRM-ENTRENAMIENTO', 'FRM-NUTRICION-INICIO']));
    const ultimas = [...todas.values()].map((p) => p.latestVersionId);
    for (const vieja of [VERSION_ENTRENAMIENTO_V1, VERSION_ENTRENAMIENTO_V2, VERSION_ENTRENAMIENTO_V3, VERSION_NUTRICION_INICIO, VERSION_NUTRICION_INICIO_V2, VERSION_HABITOS_V1]) expect(ultimas).not.toContain(vieja);
    expect(todas.get('FRM-ENTRENAMIENTO')).toEqual({
      templateId: PLANTILLA_ENTRENAMIENTO,
      key: 'FRM-ENTRENAMIENTO',
      name: ANTES_DE_ENTRENAR_V4.nombre,
      purpose: ANTES_DE_ENTRENAR_V4.proposito,
      domain: 'ENTRENAMIENTO',
      status: 'SELECTABLE',
      latestVersionId: VERSION_ENTRENAMIENTO_V4,
      fieldCount: cantidadDeCampos(ANTES_DE_ENTRENAR_V4),
      effectiveSince: MOMENTO_DE_LA_RONDA_2_1,
    });
    expect(todas.get('FRM-NUTRICION-INICIO')).toEqual({
      templateId: PLANTILLA_NUTRICION_INICIO,
      key: 'FRM-NUTRICION-INICIO',
      name: COMO_COMES_HOY_V3.nombre,
      purpose: COMO_COMES_HOY_V3.proposito,
      domain: 'NUTRICION',
      status: 'SELECTABLE',
      latestVersionId: VERSION_NUTRICION_INICIO_V3,
      fieldCount: cantidadDeCampos(COMO_COMES_HOY_V3),
      effectiveSince: MOMENTO_DE_LA_RONDA_2_1,
    });
    // «Tus hábitos», sin área propia: se lista sin filtro y con cualquiera de los tres no (el filtro es por el área propia).
    expect(todas.get('FRM-HABITOS')).toEqual({
      templateId: PLANTILLA_HABITOS,
      key: 'FRM-HABITOS',
      name: 'Tus hábitos',
      purpose: TUS_HABITOS.proposito,
      domain: null,
      status: 'SELECTABLE',
      latestVersionId: VERSION_HABITOS_V2,
      fieldCount: cantidadDeCampos(TUS_HABITOS),
      effectiveSince: MOMENTO_DE_LA_RONDA_2_1,
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

  it('FRM-03: las anteriores ya no se piden (422, sin escribir nada); la v4 sí, completa, como la pide el escritorio desde Entrenamiento (DL-165 D-29), y su Solicitud la ve solo la app que lee el formato 3', async () => {
    const pro = await prepararProfesional(app, 'fi02-pedir', ['ENTRENAMIENTO']);
    const ase = await prepararAsesorado(app, 'fi02-pedir', { a3: true });
    await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
    // D-29: lo que marca el cajón al llegar desde Entrenamiento, igual que desde «Más»: las preguntas que la plantilla trae
    // pedidas (todas menos el embarazo, D-4), con la tabla de los días, y requeridas las que sugiere.
    const enteras = camposEnOrden(ANTES_DE_ENTRENAR_V4.sections).filter((c) => c.requestedByDefault !== false);
    const pedidas = enteras.map((c) => c.fieldCode);
    const requeridas = enteras.filter((c) => c.requiredByDefault).map((c) => c.fieldCode);
    expect(pedidas).toEqual(expect.arrayContaining([...CONTEXTO_DE_ENTRENAMIENTO.campos, 'trn_dias_y_horario']));
    expect(requeridas).toEqual(expect.arrayContaining(['trn_dias_y_horario', 'trn_dias_por_semana']));
    const pedir = (templateVersionId: string) =>
      conSesion(app, pro.token)
        .post(`/api/v1/advisees/${ase.id}/form-requests`)
        .send({ templateVersionId, purpose: 'Planificar tu entrenamiento', scope: 'ENTRENAMIENTO', requestedFieldCodes: pedidas, requiredFieldCodes: requeridas });
    for (const historica of [VERSION_ENTRENAMIENTO_V1, VERSION_ENTRENAMIENTO_V2, VERSION_ENTRENAMIENTO_V3]) {
      const r = await pedir(historica).expect(422);
      expect(r.body.error.code).toBe('FORM_TEMPLATE_NOT_SELECTABLE');
    }
    expect(await prisma.solicitudDeFormulario.count({ where: { asesoradoId: ase.id } })).toBe(0);
    const formRequestId = (await pedir(VERSION_ENTRENAMIENTO_V4).expect(201)).body.data.formRequestId as string;
    expect(await prisma.solicitudDeFormulario.count({ where: { asesoradoId: ase.id } })).toBe(1);
    // Las APK hasta la 0.18 (FRM-06) y la 0.20 (FRI-02 sin la capacidad) no la ven; la app nueva, sí, sin minutos.
    const instalada = await conSesion(app, ase.token).get('/api/v1/me/form-requests').expect(200);
    expect((instalada.body.data as { formRequestId: string }[]).map((x) => x.formRequestId)).not.toContain(formRequestId);
    const deLa020 = ListaDeSolicitudesPropiasV2ResponseSchema.parse((await fri(app, ase.token).bandeja().expect(200)).body).data;
    expect(deLa020.map((x) => x.formRequestId)).not.toContain(formRequestId);
    const bandeja = ListaDeSolicitudesPropiasV2ResponseSchema.parse((await fri(app, ase.token, CON_FORMATO_3).bandeja().expect(200)).body).data;
    expect(bandeja.find((x) => x.formRequestId === formRequestId)).toMatchObject({ usesNewTypes: true, estimatedMinutes: null, status: 'PENDING', respondable: true, pendingProposal: null, requestedFieldCodes: pedidas, requiredFieldCodes: requeridas });
  });
});
