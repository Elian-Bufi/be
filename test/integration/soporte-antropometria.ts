/**
 * Soporte de integración de WP-05 (antropometría). Las identidades y el vínculo se preparan por la API real, como en
 * WP-03 y WP-04; el contenido antropométrico se siembra con SQL, porque las operaciones ANT todavía no existen
 * cuando se prueban las garantías de la base.
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { prepararAsesorado, prepararProfesional, vinculoCompleto, type Parte } from './soporte-vinculo';

export interface CircuitoAntropometrico {
  readonly pro: Parte;
  readonly ase: Parte;
  readonly vinculoId: string;
  /** Versión vigente del protocolo de laboratorio sintético. */
  readonly protocoloVersionId: string;
  /** Versión vigente del método de cálculo sintético. */
  readonly metodoVersionId: string;
}

/**
 * Catálogo sintético y rotulado, como el de alimentos de WP-04: el legajo prohíbe fijar un catálogo científico desde
 * acá, porque «define la estructura para representarlas y reconstruirlas, no selecciona una como universal»
 * (REG-06-157, 06:6304).
 */
export async function sembrarEspecificaciones(prisma: PrismaClient): Promise<{ protocoloVersionId: string; metodoVersionId: string }> {
  const crear = async (clave: string, tipo: string, nombre: string, contenido: object) => {
    const especificacion =
      (await prisma.especificacionAntropometrica.findUnique({ where: { clave } })) ??
      (await prisma.especificacionAntropometrica.create({ data: { clave, tipo } }));
    const vigente = await prisma.versionDeEspecificacionAntropometrica.findFirst({ where: { especificacionId: especificacion.id, sucesora: null } });
    if (vigente) return vigente.id;
    const version = await prisma.versionDeEspecificacionAntropometrica.create({
      data: {
        especificacionId: especificacion.id,
        version: '1',
        nombre,
        contenido: contenido as never,
        procedencia: { rotulo: 'Valores sintéticos de demostración: no es un catálogo científico (REG-06-157).' } as never,
      },
    });
    return version.id;
  };
  return {
    protocoloVersionId: await crear('PROTO-LAB', 'PROTOCOLO', 'Protocolo de laboratorio (demostración)', {
      metricas: [
        { clave: 'peso', unidades: ['kg'], precision: 1 },
        { clave: 'talla', unidades: ['m', 'cm'], precision: 2 },
      ],
    }),
    metodoVersionId: await crear('MET-DEMO', 'METODO', 'Método de demostración v1', {
      metrica: 'indice-demo',
      entradas: ['peso', 'talla'],
      unidad: 'kg/m2',
      precision: { decimales: 2, modo: 'MEDIO_ARRIBA' },
    }),
  };
}

/** Profesional con capacidad antropométrica habilitada, asesorado con A3, vínculo con B2 y el catálogo sembrado. */
export async function circuitoAntropometrico(app: INestApplication, prisma: PrismaClient, etiqueta: string): Promise<CircuitoAntropometrico> {
  const pro = await prepararProfesional(app, `ant-${etiqueta}`, ['ANTROPOMETRIA']);
  const ase = await prepararAsesorado(app, `ant-${etiqueta}`, { a3: true });
  const { vinculoId } = await vinculoCompleto(app, pro, ase, 'ANTROPOMETRIA');
  const { protocoloVersionId, metodoVersionId } = await sembrarEspecificaciones(prisma);
  return { pro, ase, vinculoId, protocoloVersionId, metodoVersionId };
}

/** Evaluación en preparación, sembrada por SQL: devuelve su identificador. */
export async function borradorSembrado(prisma: PrismaClient, c: CircuitoAntropometrico): Promise<string> {
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "evaluacion_antropometrica" ("id","profesional_id","asesorado_id","procedencia","momento_de_ocurrencia")
     VALUES ('${id}','${c.pro.id}','${c.ase.id}','{"prueba":"wp05"}', now())`,
  );
  return id;
}

/** Medición directa vigente dentro de un borrador. */
export async function medicionSembrada(
  prisma: PrismaClient,
  c: CircuitoAntropometrico,
  evaluacionId: string,
  opciones: { metrica?: string; valor?: number; unidad?: string } = {},
): Promise<string> {
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "medicion_antropometrica"
       ("id","evaluacion_id","metrica","valor","unidad_de_origen","protocolo_version_id","origen","clase","procedencia","momento_de_ocurrencia")
     VALUES ('${id}','${evaluacionId}','${opciones.metrica ?? 'peso'}',${opciones.valor ?? 72.5},'${opciones.unidad ?? 'kg'}',
             '${c.protocoloVersionId}','CAPTURA_DIRECTA','MEDIDO','{"prueba":"wp05"}', now())`,
  );
  return id;
}

/** Registra el borrador, que es lo que lo vuelve historia (REG-06-214 inciso 4). */
export async function registrarBorrador(prisma: PrismaClient, evaluacionId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `UPDATE "evaluacion_antropometrica" SET "estado" = 'REGISTRADA', "momento_de_registro_de_evaluacion" = now() WHERE "id" = '${evaluacionId}'`,
  );
}
