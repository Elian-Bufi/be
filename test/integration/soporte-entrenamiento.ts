/**
 * WP-06 · soporte de las pruebas del circuito de entrenamiento.
 *
 * `circuitoDeEntrenamiento` arma las partes por la API real (profesional con especialidad de Entrenamiento, asesorado
 * con A3, vínculo aceptado y B2 vigente). Las funciones `sembrar…` escriben por SQL directo, como las pruebas de
 * máquinas de WP-04 y WP-05: sirven para probar que **la base** sostiene las garantías aunque el servicio se equivoque.
 */
import type { INestApplication } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from './soporte-vinculo';

export interface CircuitoDeEntrenamiento {
  readonly pro: Parte;
  readonly ase: Parte;
  readonly vinculoId: string;
  readonly consentId: string;
}

export async function circuitoDeEntrenamiento(app: INestApplication, etiqueta: string): Promise<CircuitoDeEntrenamiento> {
  const pro = await prepararProfesional(app, `trn-${etiqueta}`, ['ENTRENAMIENTO']);
  const ase = await prepararAsesorado(app, `trn-${etiqueta}`, { a3: true });
  const v = await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
  return { pro, ase, vinculoId: v.vinculoId, consentId: v.consentId as string };
}

/** Los ejercicios del catálogo sintético, sembrado por la migración con identificadores deterministas. */
export const CATALOGO_DE_EJERCICIOS = {
  sentadilla: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e01',
  pressDeBanca: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e02',
  pressConMancuernas: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e03',
} as const;

const PROCEDENCIA = `'{"fuente":"PROPIA","casoDeUso":"PRUEBA","operacion":"SIEMBRA","superficie":null,"requestId":null}'`;

/** Una estructura mínima válida: un bloque, una sesión, una prescripción. Los identificadores son estables. */
export function contenidoDePlan(sesionId = 'ses-a', prescripcionId = 'rx-1'): string {
  return JSON.stringify({
    blocks: [
      {
        blockId: 'blq-1',
        name: 'Bloque 1',
        purpose: 'Adaptación',
        order: 1,
        microcycles: [],
        sessions: [
          {
            sessionId: sesionId,
            name: 'Sesión A',
            order: 1,
            prescriptions: [
              {
                prescriptionId: prescripcionId,
                exerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca,
                order: 1,
                sets: 3,
                repetitions: 8,
                intensity: { criterion: 'RIR', target: { value: 2 } },
              },
            ],
          },
        ],
      },
    ],
  });
}

async function en(prisma: PrismaClient, sentencias: string[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const s of sentencias) await tx.$executeRawUnsafe(s);
  });
}

/** Evaluación, objetivo y su primera versión: lo mínimo para que exista un plan (09v10:686). */
export async function sembrarObjetivo(prisma: PrismaClient, c: CircuitoDeEntrenamiento): Promise<{ evaluacionId: string; versionDeObjetivoId: string }> {
  const evaluacionId = randomUUID();
  const objetivoId = randomUUID();
  const versionDeObjetivoId = randomUUID();
  await en(prisma, [
    `INSERT INTO "evaluacion_de_entrenamiento" ("id","profesional_id","asesorado_id","valoracion","referencias","procedencia","momento_de_ocurrencia")
     VALUES ('${evaluacionId}','${c.pro.id}','${c.ase.id}','{}','[]',${PROCEDENCIA}, now())`,
    `INSERT INTO "objetivo_de_entrenamiento" ("id","profesional_id","asesorado_id") VALUES ('${objetivoId}','${c.pro.id}','${c.ase.id}')`,
    `INSERT INTO "version_de_objetivo_de_entrenamiento" ("id","objetivo_id","evaluacion_id","vigente_desde","objetivo","fundamento","autor_id","procedencia")
     VALUES ('${versionDeObjetivoId}','${objetivoId}','${evaluacionId}', now(),'{}','Fundamento sintético.','${c.pro.id}',${PROCEDENCIA})`,
  ]);
  return { evaluacionId, versionDeObjetivoId };
}

/** Plan con su primera versión en BORRADOR, con el hecho de la transición en la misma transacción (08 §17). */
export async function sembrarBorradorDePlan(prisma: PrismaClient, c: CircuitoDeEntrenamiento): Promise<{ planId: string; versionId: string }> {
  const { versionDeObjetivoId } = await sembrarObjetivo(prisma, c);
  const planId = randomUUID();
  const versionId = randomUUID();
  await en(prisma, [
    `INSERT INTO "plan_de_entrenamiento" ("id","profesional_id","asesorado_id") VALUES ('${planId}','${c.pro.id}','${c.ase.id}')`,
    `INSERT INTO "version_de_plan_de_entrenamiento" ("id","plan_id","version_de_objetivo_id","contenido","autor_id","procedencia")
     VALUES ('${versionId}','${planId}','${versionDeObjetivoId}','${contenidoDePlan()}','${c.pro.id}',${PROCEDENCIA})`,
    hecho(c, versionId, null, 'BORRADOR', 'BorradorDePlanDeEntrenamientoCreado'),
  ]);
  return { planId, versionId };
}

/** Plan activado: instantánea primero, después la transición, después la relación efectiva (REG-06-104). */
export async function sembrarPlanActivado(prisma: PrismaClient, c: CircuitoDeEntrenamiento): Promise<{ planId: string; versionId: string }> {
  const { planId, versionId } = await sembrarBorradorDePlan(prisma, c);
  await en(prisma, [
    `INSERT INTO "instantanea_de_plan_de_entrenamiento" ("id","version_de_plan_id","contenido","huella")
     VALUES ('${randomUUID()}','${versionId}','${contenidoDePlan()}','${'a'.repeat(64)}')`,
    `UPDATE "version_de_plan_de_entrenamiento" SET "estado" = 'ACTIVADA', "version" = 2, "momento_de_activacion" = now() WHERE "id" = '${versionId}'`,
    hecho(c, versionId, 'BORRADOR', 'ACTIVADA', 'VersionDePlanDeEntrenamientoActivada'),
    `UPDATE "plan_de_entrenamiento" SET "version_efectiva_id" = '${versionId}' WHERE "id" = '${planId}'`,
  ]);
  return { planId, versionId };
}

export function hecho(c: CircuitoDeEntrenamiento, recursoId: string, previo: string | null, posterior: string, tipo: string): string {
  return `INSERT INTO "evento_de_entrenamiento" ("id","tipo","profesional_id","asesorado_id","recurso_tipo","recurso_id","estado_previo","estado_posterior","actor_id","procedencia")
          VALUES ('${randomUUID()}','${tipo}','${c.pro.id}','${c.ase.id}','VersionDePlanDeEntrenamiento','${recursoId}',
                  ${previo ? `'${previo}'` : 'NULL'},'${posterior}','${c.pro.id}',${PROCEDENCIA})`;
}

/** Un borrador de ejecución para una ocurrencia: (sesión planificada, fecha local). */
export function borradorDeEjecucion(
  c: CircuitoDeEntrenamiento,
  versionId: string,
  campos: Partial<{ id: string; sesion: string; fecha: string; granularidad: string | null; condicion: string | null }> = {},
): { id: string; sql: string } {
  const id = campos.id ?? randomUUID();
  const granularidad = campos.granularidad === undefined ? 'SERIE' : campos.granularidad;
  const condicion = campos.condicion === undefined ? 'REALIZADA' : campos.condicion;
  return {
    id,
    sql: `INSERT INTO "borrador_de_ejecucion_de_entrenamiento" ("id","asesorado_id","version_de_plan_id","sesion_planificada_id","fecha_local","zona_horaria","granularidad","condicion")
          VALUES ('${id}','${c.ase.id}','${versionId}','${campos.sesion ?? 'ses-a'}','${campos.fecha ?? '2026-09-21'}','America/Argentina/Buenos_Aires',
                  ${granularidad ? `'${granularidad}'` : 'NULL'},${condicion ? `'${condicion}'` : 'NULL'})`,
  };
}

/** La ejecución registrada que nace de un borrador, con su misma ocurrencia. */
export function ejecucion(
  c: CircuitoDeEntrenamiento,
  versionId: string,
  borradorId: string,
  campos: Partial<{ id: string; sesion: string; fecha: string; granularidad: string; condicion: string }> = {},
): { id: string; sql: string } {
  const id = campos.id ?? randomUUID();
  return {
    id,
    sql: `INSERT INTO "ejecucion_de_entrenamiento" ("id","asesorado_id","version_de_plan_id","sesion_planificada_id","fecha_local","zona_horaria","borrador_id","granularidad","condicion","contenido","procedencia","momento_de_ocurrencia")
          VALUES ('${id}','${c.ase.id}','${versionId}','${campos.sesion ?? 'ses-a'}','${campos.fecha ?? '2026-09-21'}','America/Argentina/Buenos_Aires','${borradorId}',
                  '${campos.granularidad ?? 'SERIE'}','${campos.condicion ?? 'REALIZADA'}','{}',${PROCEDENCIA}, now())`,
  };
}

/** Un Proceso de entrenamiento abierto con la activación, con su hecho (06:5164; 08 §17). */
export function procesoDeEntrenamiento(c: CircuitoDeEntrenamiento, versionId: string, id = randomUUID()): { id: string; sql: string[] } {
  return {
    id,
    sql: [
      `INSERT INTO "proceso_operativo" ("id","profesional_id","asesorado_id","alcance","version_de_apertura_entrenamiento_id","procedencia","momento_de_ocurrencia")
       VALUES ('${id}','${c.pro.id}','${c.ase.id}','ENTRENAMIENTO','${versionId}',${PROCEDENCIA}, now())`,
      `INSERT INTO "evento_de_proceso" ("id","tipo","proceso_id","estado_posterior","actor_id","procedencia")
       VALUES ('${randomUUID()}','ProcesoOperativoAbierto','${id}','ABIERTO','${c.pro.id}',${PROCEDENCIA})`,
    ],
  };
}

export { PROCEDENCIA as PROCEDENCIA_SQL };
