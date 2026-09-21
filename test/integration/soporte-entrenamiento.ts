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
import { claveDeIdempotencia, conSesion } from './soporte-api';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from './soporte-vinculo';

export interface CircuitoDeEntrenamiento {
  readonly pro: Parte;
  readonly ase: Parte;
  readonly vinculoId: string;
  readonly consentId: string;
}

export async function circuitoDeEntrenamiento(app: INestApplication, etiqueta: string, profesional?: Parte): Promise<CircuitoDeEntrenamiento> {
  const pro = profesional ?? (await prepararProfesional(app, `trn-${etiqueta}`, ['ENTRENAMIENTO']));
  const ase = await prepararAsesorado(app, `trn-${etiqueta}`, { a3: true });
  const v = await vinculoCompleto(app, pro, ase, 'ENTRENAMIENTO');
  return { pro, ase, vinculoId: v.vinculoId, consentId: v.consentId as string };
}

/** Los ejercicios del catálogo sintético, sembrado por la migración con identificadores deterministas. */
export const CATALOGO_DE_EJERCICIOS = {
  sentadilla: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e01',
  pressDeBanca: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e02',
  pressConMancuernas: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e03',
  dominadas: '4f1b2c6e-7a01-4c01-9e02-6a6d2b6a0e06',
} as const;

const PROCEDENCIA = `'{"fuente":"PROPIA","casoDeUso":"PRUEBA","operacion":"SIEMBRA","superficie":null,"requestId":null}'`;
const ZONA = 'America/Argentina/Buenos_Aires';

/**
 * Una estructura mínima válida, **en la forma que se guarda** (ContenidoDePlanDeEntrenamiento): un bloque, una sesión,
 * una prescripción. Los identificadores son estables. El orden es el del arreglo.
 */
export function contenidoDePlan(sesionId = 'ses-a', prescripcionId = 'rx-1'): string {
  return JSON.stringify(estructuraGuardada(sesionId, prescripcionId));
}

function estructuraGuardada(sesionId: string, prescripcionId: string) {
  return {
    blocks: [
      {
        blockId: 'blq-1',
        label: 'Bloque 1',
        purpose: 'Adaptación',
        microcycles: [],
        sessions: [
          {
            sessionId: sesionId,
            label: 'Sesión A',
            instructions: null,
            prescriptions: [
              {
                prescriptionId: prescripcionId,
                exerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca,
                sets: [1, 2, 3].map(() => ({ repetitions: { value: 8 }, note: null })),
                intensity: { criterion: 'RIR', target: { value: 2, reference: null } },
                suggestedLoad: null,
                professionalParameters: [],
                note: null,
              },
            ],
          },
        ],
      },
    ],
  };
}

/** La instantánea de esa estructura: la misma, más el ejercicio congelado con su nombre (REG-06-112). */
export function instantaneaDePlan(sesionId = 'ses-a', prescripcionId = 'rx-1'): string {
  return JSON.stringify({
    contenido: estructuraGuardada(sesionId, prescripcionId),
    ejercicios: { [CATALOGO_DE_EJERCICIOS.pressDeBanca]: { exerciseId: '4f1b2c6e-7a01-4c01-9e01-6a6d2b6a0e02', exerciseName: 'Press de banca' } },
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
     VALUES ('${randomUUID()}','${versionId}','${instantaneaDePlan()}','${'a'.repeat(64)}')`,
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

/**
 * La ejecución registrada que nace de un borrador, con su misma ocurrencia. El instante por defecto es el mediodía
 * local de la fecha de la ocurrencia: la base exige que caiga en esa fecha, y `now()` no serviría en la CI.
 */
export function ejecucion(
  c: CircuitoDeEntrenamiento,
  versionId: string,
  borradorId: string,
  campos: Partial<{ id: string; sesion: string; fecha: string; granularidad: string | null; condicion: string; momento: string }> = {},
): { id: string; sql: string } {
  const id = campos.id ?? randomUUID();
  const fecha = campos.fecha ?? '2026-09-21';
  const granularidad = campos.granularidad === undefined ? 'SERIE' : campos.granularidad;
  const momento = campos.momento ?? `('${fecha} 12:00'::timestamp AT TIME ZONE '${ZONA}')`;
  return {
    id,
    sql: `INSERT INTO "ejecucion_de_entrenamiento" ("id","asesorado_id","version_de_plan_id","sesion_planificada_id","fecha_local","zona_horaria","borrador_id","granularidad","condicion","contenido","procedencia","momento_de_ocurrencia")
          VALUES ('${id}','${c.ase.id}','${versionId}','${campos.sesion ?? 'ses-a'}','${fecha}','${ZONA}','${borradorId}',
                  ${granularidad ? `'${granularidad}'` : 'NULL'},'${campos.condicion ?? 'REALIZADA'}','{}',${PROCEDENCIA}, ${momento})`,
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

// ─── Cuerpos de request por la API (WP-06, tramo de evaluación y catálogo) ─────────────────────

/** Una evaluación de entrenamiento: cada dato con su fuente, como en nutrición (DL-048; B10-06:132). */
export function cuerpoDeEvaluacionDeEntrenamiento(): Record<string, unknown> {
  return {
    occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    assessment: {
      entries: [
        { concept: 'Experiencia en entrenamiento de fuerza', value: 'Dos años, con interrupciones', source: 'REPORTED' },
        { concept: 'Dolor o limitación de hombro', value: 'Molestia leve al elevar el brazo', source: 'REPORTED' },
        { concept: 'Sentadilla sin carga observada', value: 'Técnica estable', source: 'OBSERVED' },
      ],
    },
    evidenceReferences: [],
    professionalNotes: 'Notas sintéticas del profesional.',
  };
}

export function cuerpoDeObjetivoDeEntrenamiento(evaluationId: string, enunciado = 'Mejorar la fuerza en los básicos con técnica estable.'): Record<string, unknown> {
  return {
    evaluationId,
    effectiveFrom: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    effectiveUntil: null,
    objective: { statement: enunciado },
    rationale: 'Fundamento sintético: la evaluación muestra base técnica y margen de progresión.',
  };
}

// ─── Plan por la API (tramo 2) ────────────────────────────────────────────────────────────────

export interface CircuitoParaPlanificar extends CircuitoDeEntrenamiento {
  readonly evaluationId: string;
  readonly objectiveVersionId: string;
}

/** Circuito con evaluación y objetivo cargados por la API: lo mínimo para crear un plan (09v10:686). */
export async function circuitoListoParaPlanificarEntrenamiento(app: INestApplication, etiqueta: string, pro?: Parte): Promise<CircuitoParaPlanificar> {
  const c = await circuitoDeEntrenamiento(app, etiqueta, pro);
  const ev = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/training/evaluations`).send(cuerpoDeEvaluacionDeEntrenamiento()).expect(201);
  const ob = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/training/objectives`)
    .send(cuerpoDeObjetivoDeEntrenamiento(ev.body.data.evaluationId))
    .expect(201);
  return { ...c, evaluationId: ev.body.data.evaluationId as string, objectiveVersionId: ob.body.data.versionId as string };
}

/**
 * Estructura de request: un bloque sin microciclos con dos sesiones (A y B). La A tiene press de banca con RIR y
 * sentadilla con %RM; la B, dominadas sin criterio de intensidad —legítimo: REG-06-128 es condicional—.
 */
export function estructuraDeEntrenamiento(): Record<string, unknown> {
  return {
    blocks: [
      {
        label: 'Bloque 1',
        purpose: 'Adaptación',
        sessions: [
          {
            sessionId: 'ses-a',
            label: 'Sesión A',
            instructions: 'Entrada en calor de diez minutos.',
            prescriptions: [
              {
                prescriptionId: 'rx-banca',
                exerciseVersionId: CATALOGO_DE_EJERCICIOS.pressDeBanca,
                sets: [{ repetitions: { value: 8 } }, { repetitions: { value: 8 } }, { repetitions: { value: 8 } }],
                intensity: { criterion: 'RIR', target: { value: 2 } },
                suggestedLoad: { value: 60, unit: 'kg' },
                professionalParameters: [{ label: 'Descanso', value: 90, unit: 's' }],
              },
              {
                prescriptionId: 'rx-sentadilla',
                exerciseVersionId: CATALOGO_DE_EJERCICIOS.sentadilla,
                sets: [{ repetitions: { min: 6, max: 8 } }, { repetitions: { min: 6, max: 8 } }],
                intensity: { criterion: 'PERCENT_RM', target: { value: 75, reference: { description: '1RM estimado por el profesional' } } },
              },
            ],
          },
          {
            sessionId: 'ses-b',
            label: 'Sesión B',
            prescriptions: [{ prescriptionId: 'rx-dominadas', exerciseVersionId: CATALOGO_DE_EJERCICIOS.dominadas, sets: [{ repetitions: null }], intensity: null }],
          },
        ],
      },
    ],
  };
}

export async function crearBorradorDeEntrenamiento(
  app: INestApplication,
  c: CircuitoParaPlanificar,
  extra: Record<string, unknown> = {},
): Promise<{ planId: string; version: string; body: Record<string, unknown> }> {
  const r = await conSesion(app, c.pro.token)
    .post(`/api/v1/advisees/${c.ase.id}/training/plans`)
    .send({ objectiveVersionId: c.objectiveVersionId, initialStructure: estructuraDeEntrenamiento(), ...extra })
    .expect(201);
  return { planId: r.body.data.planId as string, version: r.body.data.version as string, body: r.body.data };
}

export function activarPlanDeEntrenamiento(app: INestApplication, pro: Parte, planId: string, version: string, clave = claveDeIdempotencia()) {
  return conSesion(app, pro.token).post(`/api/v1/training/plans/${planId}/activate`, clave).send({ expectedVersion: version });
}

/** Circuito con un plan de entrenamiento activado por la API. */
export async function circuitoConPlanDeEntrenamientoActivo(app: INestApplication, etiqueta: string, pro?: Parte) {
  const c = await circuitoListoParaPlanificarEntrenamiento(app, etiqueta, pro);
  const b = await crearBorradorDeEntrenamiento(app, c);
  const act = await activarPlanDeEntrenamiento(app, c.pro, b.planId, b.version).expect(200);
  return { ...c, planId: b.planId, trainingPlanId: act.body.data.trainingPlanId as string, activacion: act.body.data };
}
