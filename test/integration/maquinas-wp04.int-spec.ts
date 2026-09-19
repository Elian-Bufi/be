/**
 * WP-04 · TEST-RNF-DAT-001 y la reapertura en la base: la máquina de la Versión de plan (06 §10.7), la del Proceso
 * (06 §8) y las reglas del plan, la ingesta y la revisión también las exige PostgreSQL. Si el código se equivocara, la
 * base rechazaría igual. Cada escenario escribe por fuera de la API, con SQL directo, en una transacción que siempre se
 * revierte.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba } from './soporte-api';
import { circuitoConPlanActivo, crearBorrador, circuitoListoParaPlanificar, registrarComida, registrarLibre } from './soporte-nutricion';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const REVERTIR = new Error('revertir');
async function errorDeLaBase(...sentencias: string[]): Promise<string> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const s of sentencias) await tx.$executeRawUnsafe(s);
      throw REVERTIR;
    });
  } catch (e) {
    if (e === REVERTIR) return 'SIN ERROR';
    return String((e as Error).message);
  }
  return 'SIN ERROR';
}

/** Igual, pero confirmando: los triggers diferidos («con hecho») se evalúan al confirmar. */
async function errorAlConfirmar(...sentencias: string[]): Promise<string> {
  try {
    await prisma.$transaction(async (tx) => {
      for (const s of sentencias) await tx.$executeRawUnsafe(s);
    });
    return 'SIN ERROR';
  } catch (e) {
    return String((e as Error).message);
  }
}

describe('06 §10.7 · Versión de plan: no hay salida desde ACTIVADA (INV-06-109; 06:4307)', () => {
  it('reabrir, editar el contenido, cambiar el objetivo o borrar una versión activada se rechaza en la base', async () => {
    const c = await circuitoConPlanActivo(app, 'db-inmutable');
    const id = c.planId;
    expect(await errorDeLaBase(`UPDATE version_de_plan_nutricional SET estado = 'BORRADOR', version = version + 1, momento_de_activacion = NULL WHERE id = '${id}'`)).toMatch(/ACTIVADA es inmutable/);
    expect(await errorDeLaBase(`UPDATE version_de_plan_nutricional SET contenido = '{"dayTypes":[]}', version = version + 1 WHERE id = '${id}'`)).toMatch(/ACTIVADA es inmutable/);
    expect(await errorDeLaBase(`UPDATE version_de_plan_nutricional SET proxima_revision = '2030-01-01', version = version + 1 WHERE id = '${id}'`)).toMatch(/ACTIVADA es inmutable/);
    expect(await errorDeLaBase(`DELETE FROM version_de_plan_nutricional WHERE id = '${id}'`)).toMatch(/no se elimina/);
    // La instantánea es append-only y no se vuelve a tomar.
    expect(await errorDeLaBase(`UPDATE instantanea_de_plan_nutricional SET contenido = '{}' WHERE version_de_plan_id = '${id}'`)).toMatch(/append-only/);
    expect(await errorDeLaBase(`INSERT INTO instantanea_de_plan_nutricional (id, version_de_plan_id, contenido, huella) VALUES ('${randomUUID()}', '${id}', '{}', '${'a'.repeat(64)}')`)).toMatch(
      /al activar un BORRADOR|duplicate key|unique/i,
    );
  });

  it('una versión nace BORRADOR; activar sin instantánea o cambiando el contenido se rechaza; la versión avanza de a uno', async () => {
    const c = await circuitoListoParaPlanificar(app, 'db-activar');
    const b = await crearBorrador(app, c);
    const plan = await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: b.planId } });
    expect(
      await errorDeLaBase(
        `INSERT INTO version_de_plan_nutricional (id, plan_id, estado, version_de_objetivo_id, contenido, autor_id, procedencia, momento_de_activacion)
         VALUES ('${randomUUID()}', '${plan.planId}', 'ACTIVADA', '${plan.versionDeObjetivoId}', '{"dayTypes":[]}', '${c.pro.id}', '{}', now())`,
      ),
    ).toMatch(/nace BORRADOR/);
    expect(await errorDeLaBase(`UPDATE version_de_plan_nutricional SET estado = 'ACTIVADA', version = version + 1, momento_de_activacion = now() WHERE id = '${b.planId}'`)).toMatch(/sin instantánea no hay activación/);
    expect(
      await errorDeLaBase(
        `INSERT INTO instantanea_de_plan_nutricional (id, version_de_plan_id, contenido, huella) VALUES ('${randomUUID()}', '${b.planId}', '{}', '${'b'.repeat(64)}')`,
        `UPDATE version_de_plan_nutricional SET estado = 'ACTIVADA', contenido = '{"dayTypes":[]}', version = version + 1, momento_de_activacion = now() WHERE id = '${b.planId}'`,
      ),
    ).toMatch(/activar no cambia el contenido/);
    expect(await errorDeLaBase(`UPDATE version_de_plan_nutricional SET contenido = '{"dayTypes":[]}', version = version + 5 WHERE id = '${b.planId}'`)).toMatch(/avanza de a uno/);
    // Guardar el borrador sin registrar su hecho se rechaza al confirmar (08 §17).
    expect(await errorAlConfirmar(`UPDATE version_de_plan_nutricional SET contenido = '{"dayTypes":[]}', version = version + 1 WHERE id = '${b.planId}'`)).toMatch(/no registró su hecho/);
  });

  it('REG-06-12: un solo borrador por plan y una sola sucesora por versión', async () => {
    const c = await circuitoConPlanActivo(app, 'db-sucesion');
    const v = await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: c.planId } });
    const nueva = (predecesora: string | null) =>
      `INSERT INTO version_de_plan_nutricional (id, plan_id, predecesora_id, version_de_objetivo_id, contenido, autor_id, procedencia)
       VALUES ('${randomUUID()}', '${v.planId}', ${predecesora ? `'${predecesora}'` : 'NULL'}, '${v.versionDeObjetivoId}', '{"dayTypes":[]}', '${c.pro.id}', '{}')`;
    expect(await errorDeLaBase(nueva(c.planId), nueva(null))).toMatch(/23505|unique|duplicate|already exists/i);
    expect(await errorDeLaBase(nueva(c.planId), nueva(c.planId))).toMatch(/23505|unique|duplicate|already exists/i);
  });
});

describe('INV-06-110 · la versión efectiva solo avanza a la sucesora activada de la anterior', () => {
  it('apuntar la vigencia a un borrador o a una versión que no sucede a la efectiva se rechaza', async () => {
    const c = await circuitoConPlanActivo(app, 'db-vigencia');
    const efectiva = await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: c.planId } });
    const sucesora = await prisma.versionDePlanNutricional.create({
      data: { planId: efectiva.planId, predecesoraId: efectiva.id, versionDeObjetivoId: efectiva.versionDeObjetivoId, contenido: { dayTypes: [] }, autorId: c.pro.id, procedencia: {} },
    }).catch(() => null);
    // La creación directa sin hecho falla al confirmar: se prueba el apuntador dentro de una transacción revertida.
    expect(sucesora).toBeNull();
    expect(await errorDeLaBase(`UPDATE plan_nutricional SET version_efectiva_id = NULL WHERE id = '${efectiva.planId}'`)).toMatch(/sucesora ACTIVADA/);
    const borradorId = randomUUID();
    expect(
      await errorDeLaBase(
        `INSERT INTO version_de_plan_nutricional (id, plan_id, predecesora_id, version_de_objetivo_id, contenido, autor_id, procedencia)
         VALUES ('${borradorId}', '${efectiva.planId}', '${efectiva.id}', '${efectiva.versionDeObjetivoId}', '{"dayTypes":[]}', '${c.pro.id}', '{}')`,
        `UPDATE plan_nutricional SET version_efectiva_id = '${borradorId}' WHERE id = '${efectiva.planId}'`,
      ),
    ).toMatch(/sucesora ACTIVADA/);
    expect(await errorDeLaBase(`DELETE FROM plan_nutricional WHERE id = '${efectiva.planId}'`)).toMatch(/no se elimina/);
  });
});

describe('06 §8 · Proceso: CERRADO es terminal y hay uno solo abierto por terna (INV-06-74, 86)', () => {
  it('reabrir, borrar o duplicar un Proceso abierto se rechaza', async () => {
    const c = await circuitoConPlanActivo(app, 'db-proceso');
    const id = c.activacion.processId as string;
    const cerrar = `UPDATE proceso_operativo SET estado = 'CERRADO', version = version + 1, motivo_de_cierre = 'REVISION_FINALIZAR', momento_de_cierre = now() WHERE id = '${id}'`;
    expect(await errorDeLaBase(cerrar, `UPDATE proceso_operativo SET estado = 'ABIERTO', version = version + 1, motivo_de_cierre = NULL, momento_de_cierre = NULL WHERE id = '${id}'`)).toMatch(
      /TRANSICION_NO_DECLARADA/,
    );
    expect(await errorDeLaBase(`DELETE FROM proceso_operativo WHERE id = '${id}'`)).toMatch(/no se elimina/);
    expect(
      await errorDeLaBase(
        `INSERT INTO proceso_operativo (id, profesional_id, asesorado_id, alcance, version_de_apertura_id, procedencia) VALUES ('${randomUUID()}', '${c.pro.id}', '${c.ase.id}', 'NUTRICION', '${c.planId}', '{}')`,
      ),
    ).toMatch(/23505|unique|duplicate|already exists/i);
    expect(await errorDeLaBase(`UPDATE proceso_operativo SET alcance = 'ENTRENAMIENTO', version = version + 1 WHERE id = '${id}'`)).toMatch(/conserva partes|solo_nutricion/);
    // Cerrar sin su hecho se rechaza al confirmar.
    expect(await errorAlConfirmar(cerrar)).toMatch(/no registró su hecho/);
  });
});

describe('REG-06-105 a 107 · ingesta y corrección', () => {
  it('la ingesta prescripta es única por versión, fecha y comida; la libre no marca comidas; nada se edita', async () => {
    const c = await circuitoConPlanActivo(app, 'db-ingesta');
    const reg = await registrarComida(app, c.ase, c.planId, c.dia).expect(201);
    const id = reg.body.data.executionId as string;
    const fila = await prisma.ingestaNutricional.findUniqueOrThrow({ where: { id } });
    expect(
      await errorDeLaBase(
        `INSERT INTO ingesta_nutricional (id, version_de_plan_id, asesorado_id, origen, modo, fecha_local, zona_horaria, dia_tipo_id, comida_id, opcion_id, procedencia, momento_de_ocurrencia)
         VALUES ('${randomUUID()}', '${c.planId}', '${c.ase.id}', 'PRESCRIPTA', 'OPCIONES_DE_PLATO', '${fila.fechaLocal.toISOString().slice(0, 10)}', 'UTC', '${fila.diaTipoId}', '${fila.comidaId}', '${fila.opcionId}', '{}', now())`,
      ),
    ).toMatch(/23505|unique|duplicate|already exists/i);
    expect(
      await errorDeLaBase(
        `INSERT INTO ingesta_nutricional (id, version_de_plan_id, asesorado_id, origen, modo, fecha_local, zona_horaria, comida_id, descripcion, procedencia, momento_de_ocurrencia)
         VALUES ('${randomUUID()}', '${c.planId}', '${c.ase.id}', 'FUERA_DE_PRESCRIPCION', 'DESCRIPCION_LIBRE', '2026-01-01', 'UTC', 'x', 'texto', '{}', now())`,
      ),
    ).toMatch(/origen_coherente/);
    expect(await errorDeLaBase(`UPDATE ingesta_nutricional SET observacion = 'cambio' WHERE id = '${id}'`)).toMatch(/append-only/);
    // Contra un borrador no se registra.
    const d = await prisma.versionDePlanNutricional.findUniqueOrThrow({ where: { id: c.planId } });
    const borradorId = randomUUID();
    expect(
      await errorDeLaBase(
        `INSERT INTO version_de_plan_nutricional (id, plan_id, predecesora_id, version_de_objetivo_id, contenido, autor_id, procedencia) VALUES ('${borradorId}', '${d.planId}', '${d.id}', '${d.versionDeObjetivoId}', '{"dayTypes":[]}', '${c.pro.id}', '{}')`,
        `INSERT INTO ingesta_nutricional (id, version_de_plan_id, asesorado_id, origen, modo, fecha_local, zona_horaria, descripcion, procedencia, momento_de_ocurrencia)
         VALUES ('${randomUUID()}', '${borradorId}', '${c.ase.id}', 'FUERA_DE_PRESCRIPCION', 'DESCRIPCION_LIBRE', '2026-01-01', 'UTC', 'texto', '{}', now())`,
      ),
    ).toMatch(/versión ACTIVADA/);
  });

  it('REG-06-15: la corrección solo sobre una ingesta libre, en una cadena lineal hacia el mismo original', async () => {
    const c = await circuitoConPlanActivo(app, 'db-correccion');
    const prescripta = (await registrarComida(app, c.ase, c.planId, c.dia).expect(201)).body.data.executionId as string;
    const libre = (await registrarLibre(app, c.ase, c.planId, 'Texto libre sintético.').expect(201)).body.data.executionId as string;
    const otraLibre = (await registrarLibre(app, c.ase, c.planId, 'Otro texto libre.').expect(201)).body.data.executionId as string;
    const insertar = (ingesta: string, previa: string | null, id = randomUUID()) =>
      `INSERT INTO correccion_de_ingesta (id, ingesta_id, correccion_previa_id, estimacion, declaracion, autor_id, procedencia)
       VALUES ('${id}', '${ingesta}', ${previa ? `'${previa}'` : 'NULL'}, '{"items":[]}', 'estimación', '${c.pro.id}', '{}')`;
    expect(await errorDeLaBase(insertar(prescripta, null))).toMatch(/solo se estructura una ingesta libre/);
    const k1 = randomUUID();
    expect(await errorDeLaBase(insertar(libre, null, k1), insertar(libre, null))).toMatch(/23505|unique|duplicate|already exists/i);
    expect(await errorDeLaBase(insertar(libre, null, k1), insertar(otraLibre, k1))).toMatch(/mismo objeto/);
    expect(await errorDeLaBase(insertar(libre, null, k1), insertar(libre, k1), insertar(libre, k1))).toMatch(/23505|unique|duplicate|already exists/i);
  });
});

describe('REG-06-75 · la aplicación de una revisión enlaza su evento y solo FINALIZAR cierra', () => {
  it('una aplicación con tipo que no corresponde al resultado, o sin su evento, se rechaza', async () => {
    const c = await circuitoConPlanActivo(app, 'db-aplicacion');
    const revisionId = randomUUID();
    const crearRevision = `INSERT INTO revision_nutricional (id, proceso_id, periodo_inicio, periodo_fin, zona_horaria, evidencias, interpretacion, resultado, fundamento, proxima_accion, autor_id, procedencia)
      VALUES ('${revisionId}', '${c.activacion.processId}', '2026-09-01', '2026-09-07', 'UTC', '[]', 'interpretación', 'MANTENER', 'fundamento', '{}', '${c.pro.id}', '{}')`;
    const eventoId = randomUUID();
    const evento = (tipo: string) =>
      `INSERT INTO evento_de_proceso (id, tipo, proceso_id, tipo_de_aplicacion, revision_id, estado_previo, estado_posterior, actor_id, procedencia)
       VALUES ('${eventoId}', 'ContinuidadOCierreAplicado', '${c.activacion.processId}', '${tipo}', '${revisionId}', 'ABIERTO', '${tipo === 'CIERRE_PROCESO' ? 'CERRADO' : 'ABIERTO'}', '${c.pro.id}', '{}')`;
    const aplicacion = (tipo: string, estado: string, evento = eventoId) =>
      `INSERT INTO aplicacion_de_revision (id, revision_id, evento_id, tipo, estado_de_proceso_posterior) VALUES ('${randomUUID()}', '${revisionId}', '${evento}', '${tipo}', '${estado}')`;
    expect(await errorDeLaBase(crearRevision, evento('CIERRE_PROCESO'), aplicacion('CIERRE_PROCESO', 'CERRADO'))).toMatch(/solo FINALIZAR cierra/);
    expect(await errorDeLaBase(crearRevision, evento('CONTINUIDAD'), aplicacion('CONTINUIDAD', 'ABIERTO', randomUUID()))).toMatch(/foreign key|enlaza/i);
    expect(await errorDeLaBase(crearRevision, `UPDATE revision_nutricional SET resultado = 'FINALIZAR' WHERE id = '${revisionId}'`)).toMatch(/append-only/);
    // Un evento de aplicación sin revisión viola el CHECK de coherencia.
    expect(
      await errorDeLaBase(
        `INSERT INTO evento_de_proceso (id, tipo, proceso_id, estado_previo, estado_posterior, actor_id, procedencia) VALUES ('${randomUUID()}', 'ContinuidadOCierreAplicado', '${c.activacion.processId}', 'ABIERTO', 'ABIERTO', '${c.pro.id}', '{}')`,
      ),
    ).toMatch(/aplicacion_coherente/);
  });
});
