/**
 * DL-164 FI-02 · las plantillas del catálogo que nombran las pruebas, y una copia de P0 para ejercitar lo que las APK
 * instaladas siguen leyendo.
 *
 * Desde la migración 20261104130000, FRM-ENTRENAMIENTO tiene una v2 con tipos nuevos («Antes de entrenar», format 2) que
 * es la vigente, y la v1 «Antecedentes para entrenamiento» (DL-100) es histórica: FRM-02 y FRM-05 la siguen leyendo, pero
 * FRM-03 no deja pedirla (422 FORM_TEMPLATE_NOT_SELECTABLE). Y una Solicitud sobre la v2 no existe para FRM-02, 05, 07 y
 * 08 (D-5). Las pruebas de P0 (los límites NUMBER de DL-101, las citas de DL-102, la recuperación, el A3, lo que lee la
 * APK) necesitan una versión de P0 con dominio ENTRENAMIENTO que se pueda pedir por FRM-03 y responder por FRM-07:
 * `sembrarAntecedentesDeP0` copia el contenido de la v1 en una plantilla de prueba, como `sembrarPlantillaV2` hace con
 * una V2. Lo que esas pruebas protegen no cambia: es el mismo contenido, con los mismos límites.
 *
 * DL-165, ronda 2.1 (migración 20261106120000): «Tus hábitos» pasa a ser FRM-HABITOS v2 y las de área salen sin la parte
 * (FRM-NUTRICION-INICIO v3 y FRM-ENTRENAMIENTO v4). Desde ahí FRM-HABITOS v1 (P0) y las de la ronda 2 son históricas: FRM-03
 * ya no deja pedirlas, pero las Solicitudes que se pidieron antes siguen en su versión. `solicitudDeAntes` crea una así,
 * directo en la base, como quedó en `test` una pedida antes de la migración; `sembrarCopiaDeLaVersion` copia una versión en
 * una plantilla de prueba que sí se puede pedir.
 */
import type { INestApplication } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { conSesion } from './soporte-api';

/**
 * FRM-01 entero, página por página (`limit=50` y el cursor): las pruebas siembran decenas de plantillas más nuevas que
 * las del catálogo, y FRM-01 ordena por registro y pagina antes de filtrar por dominio, así que una sola página puede
 * dejar afuera a FRM-ENTRENAMIENTO o FRM-NUTRICION-INICIO según qué archivos corrieron antes. `filtro` empieza con `&`.
 */
export async function catalogoDePlantillas(app: INestApplication, token: string, filtro = ''): Promise<Map<string, Record<string, unknown>>> {
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

/** FRM-ENTRENAMIENTO (migración 20260928000000, DL-100). */
export const PLANTILLA_ENTRENAMIENTO = '67e4d0b3-cf4a-41e7-9d84-6864c5dde951';
/** «Antecedentes para entrenamiento» (P0, seis campos con límites NUMBER): histórica desde FI-02. */
export const VERSION_ENTRENAMIENTO_V1 = '0fba80db-0a80-47a7-b183-130232ab7a9c';
/** «Antes de entrenar» (format 2): sucesora de la v1; desde DL-165 FR-06, histórica (la vigente es la v3). */
export const VERSION_ENTRENAMIENTO_V2 = '0e34057f-8304-46bd-ac80-475c7093671f';
/** «Antes de entrenar» v3 (format 3, migración 20261105120000, DL-165 FR-06): sucesora de la v2; desde la ronda 2.1, histórica. */
export const VERSION_ENTRENAMIENTO_V3 = '3bb9b4c2-efd8-4d80-9c0c-2a4769819478';
/** FRM-NUTRICION-INICIO (migración 20261104130000, DL-164 FI-02). */
export const PLANTILLA_NUTRICION_INICIO = '6da670ad-a767-4177-8c34-cdaab80e0806';
/** «Cómo comés hoy» v1 (format 2); desde DL-165 FR-06, histórica (la vigente es la v2). */
export const VERSION_NUTRICION_INICIO = 'e1ad1e6a-bf90-46b0-923d-f27dafb67041';
/** «Cómo comés hoy» v2 (format 3, migración 20261105120000, DL-165 FR-06): sucesora de la v1; desde la ronda 2.1, histórica. */
export const VERSION_NUTRICION_INICIO_V2 = '98fb045a-af5d-4122-98c4-71240587adc9';
/** El día en que Dirección ratificó el paquete: `momento_de_registro` de las dos versiones sembradas. */
export const MOMENTO_DE_LA_SIEMBRA = '2026-11-04T00:00:00.000Z';
/** El día en que Dirección ratificó la ronda 2: `momento_de_registro` de las dos sucesoras de formato 3. */
export const MOMENTO_DE_LA_RONDA_2 = '2026-11-05T00:00:00.000Z';
/** FRM-HABITOS (P0, migración 20260921220000): sin área propia. */
export const PLANTILLA_HABITOS = 'd5e96564-ee21-4ef2-a58f-4cf0fa4ee8a1';
/** «Hábitos y contexto» v1 (P0, contrato V1: horas de sueño, nivel de actividad y fuma); desde la ronda 2.1, histórica. */
export const VERSION_HABITOS_V1 = '4879e539-235f-4f91-83fc-2e113c404393';
/** «Tus hábitos» v2 (format 3, migración 20261106120000, DL-165 ronda 2.1): la parte común, sola; la vigente. */
export const VERSION_HABITOS_V2 = '413d919a-14ca-4793-8fab-32a6a9b2d6f0';
/** «Cómo comés hoy» v3 (format 3, ronda 2.1): la v2 sin la parte «Tus hábitos»; la vigente. */
export const VERSION_NUTRICION_INICIO_V3 = '292e559f-ff77-413e-83e0-296c8a9fac20';
/** «Antes de entrenar» v4 (format 3, ronda 2.1): la v3 sin la parte «Tus hábitos»; la vigente. */
export const VERSION_ENTRENAMIENTO_V4 = '423d3f49-03aa-4f88-b726-21719ac20a4d';
/** El día de la ronda 2.1 (D-15 nueva de Dirección): `momento_de_registro` de las tres versiones nuevas. */
export const MOMENTO_DE_LA_RONDA_2_1 = '2026-11-06T00:00:00.000Z';

/**
 * Una plantilla de prueba con el contenido exacto de «Antecedentes para entrenamiento» v1 (P0, dominio ENTRENAMIENTO),
 * sembrada directo en la base como lo hace la migración del catálogo. Se puede pedir por FRM-03 y responder por FRM-07.
 */
export async function sembrarAntecedentesDeP0(prisma: PrismaClient, etiqueta: string): Promise<{ plantillaId: string; versionId: string }> {
  const v1 = await prisma.versionDePlantillaDeFormulario.findUniqueOrThrow({ where: { id: VERSION_ENTRENAMIENTO_V1 } });
  const plantillaId = randomUUID();
  const versionId = randomUUID();
  await prisma.plantillaDeFormulario.create({
    data: {
      id: plantillaId,
      clave: `FRM-PRUEBA-P0-${etiqueta}-${randomUUID().slice(0, 8)}`,
      versiones: {
        create: {
          id: versionId,
          version: '1',
          nombre: v1.nombre,
          proposito: v1.proposito,
          dominio: v1.dominio,
          contenido: v1.contenido as Prisma.InputJsonValue,
          procedencia: { rotulo: 'Copia de prueba de «Antecedentes para entrenamiento» v1 (P0, histórica desde DL-164 FI-02): no es un catálogo clínico.' },
        },
      },
    },
  });
  return { plantillaId, versionId };
}

/**
 * Una plantilla de prueba con el contenido exacto de una versión del catálogo (su nombre, su propósito, su área y sus
 * preguntas), sembrada directo en la base. Se puede pedir por FRM-03 aunque la del catálogo ya sea histórica: lo que se
 * prueba es el contenido (FRM-HABITOS v1 en el contrato V1, o una versión con la parte «Tus hábitos»).
 */
export async function sembrarCopiaDeLaVersion(prisma: PrismaClient, versionId: string, etiqueta: string): Promise<{ plantillaId: string; versionId: string }> {
  const original = await prisma.versionDePlantillaDeFormulario.findUniqueOrThrow({ where: { id: versionId } });
  const plantillaId = randomUUID();
  const copiaId = randomUUID();
  await prisma.plantillaDeFormulario.create({
    data: {
      id: plantillaId,
      clave: `FRM-PRUEBA-COPIA-${etiqueta}-${randomUUID().slice(0, 8)}`,
      versiones: {
        create: {
          id: copiaId,
          version: '1',
          nombre: original.nombre,
          proposito: original.proposito,
          dominio: original.dominio,
          contenido: original.contenido as Prisma.InputJsonValue,
          procedencia: { rotulo: `Copia de prueba de la versión ${versionId}: no es un catálogo clínico.` },
        },
      },
    },
  });
  return { plantillaId, versionId: copiaId };
}

/**
 * Una Solicitud pedida **antes** de que su versión pasara a ser histórica, como las que quedaron en `test` de la ronda 2
 * (FRM-NUTRICION-INICIO v2 o FRM-ENTRENAMIENTO v3) o de FRM-HABITOS v1: se inserta directo en la base, con el vínculo del
 * profesional con la persona, porque FRM-03 ya no deja pedirlas (REG-06-209). Lo que se prueba es que siguen andando.
 */
export async function solicitudDeAntes(
  prisma: PrismaClient,
  p: { readonly profesionalId: string; readonly asesoradoId: string; readonly versionId: string; readonly alcance: 'NUTRICION' | 'ENTRENAMIENTO' | 'ANTROPOMETRIA'; readonly pedidos: readonly string[]; readonly requeridos: readonly string[]; readonly proposito?: string },
): Promise<string> {
  const vinculo = await prisma.vinculo.findFirstOrThrow({ where: { profesionalId: p.profesionalId, asesoradoId: p.asesoradoId } });
  const s = await prisma.solicitudDeFormulario.create({
    data: {
      profesionalId: p.profesionalId,
      asesoradoId: p.asesoradoId,
      vinculoId: vinculo.id,
      templateVersionId: p.versionId,
      proposito: p.proposito ?? 'Pedida antes de la ronda 2.1',
      alcance: p.alcance,
      camposSolicitados: [...p.pedidos],
      camposRequeridos: [...p.requeridos],
    },
  });
  return s.id;
}
