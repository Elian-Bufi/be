/**
 * WP-06 · las garantías de B-08 también las exige PostgreSQL. Si el servicio se equivocara, la base rechazaría igual.
 * Cada escenario escribe por fuera de la API, con SQL directo, en una transacción que siempre se revierte.
 *
 * Cubre las dos máquinas del 06 —versión de plan (06:5157-5159) y ejecución real (06:5217-5219)—, la unicidad por
 * ocurrencia (REG-06-115) y el Proceso transversal: el agujero que tenía la base de WP-04, donde el Proceso estaba
 * atado a nutrición con un CHECK literal `proceso_operativo_solo_nutricion`.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba } from './soporte-api';
import {
  borradorDeEjecucion,
  circuitoDeEntrenamiento,
  ejecucion,
  hecho,
  PROCEDENCIA_SQL,
  procesoDeEntrenamiento,
  sembrarBorradorDePlan,
  sembrarObjetivo,
  sembrarPlanActivado,
  type CircuitoDeEntrenamiento,
} from './soporte-entrenamiento';

const prisma = new PrismaClient();
let app: INestApplication;
let contador = 0;
/** Un circuito propio por prueba: hay un solo plan por par profesional–asesorado, y la base lo exige. */
const fresco = (): Promise<CircuitoDeEntrenamiento> => circuitoDeEntrenamiento(app, `maquinas-${++contador}`);

beforeAll(async () => {
  app = await appDePrueba();
}, 120_000);
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

// ─── Versión de plan (06:5157-5159) ─────────────────────────────────────────────────────────────

describe('versión de plan de entrenamiento · lista blanca en la base (06:5157-5159)', () => {
  it('una versión nace BORRADOR: no se puede insertar ya ACTIVADA', async () => {
    const c = await fresco();
    const { versionDeObjetivoId } = await sembrarObjetivo(prisma, c);
    const planId = randomUUID();
    const versionId = randomUUID();
    const e = await errorDeLaBase(
      `INSERT INTO "plan_de_entrenamiento" ("id","profesional_id","asesorado_id") VALUES ('${planId}','${c.pro.id}','${c.ase.id}')`,
      `INSERT INTO "version_de_plan_de_entrenamiento" ("id","plan_id","estado","version_de_objetivo_id","contenido","autor_id","procedencia","momento_de_activacion")
       VALUES ('${versionId}','${planId}','ACTIVADA','${versionDeObjetivoId}','{}','${c.pro.id}',${PROCEDENCIA_SQL}, now())`,
    );
    expect(e).toContain('nace BORRADOR');
  });

  it('no existe un estado VALIDADO: la base ni siquiera lo acepta como valor (06:5149-5152)', async () => {
    const c = await fresco();
    const { versionId } = await sembrarBorradorDePlan(prisma, c);
    const e = await errorDeLaBase(`UPDATE "version_de_plan_de_entrenamiento" SET "estado" = 'VALIDADO', "version" = 2 WHERE "id" = '${versionId}'`);
    // Validar es condición de ActivarVersion, no un estado: el enum no lo tiene.
    expect(e).toMatch(/invalid input value for enum|VALIDADO/);
  });

  it('INV-06-109 · una versión ACTIVADA es inmutable: cambiarla exige una sucesora', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const e = await errorDeLaBase(`UPDATE "version_de_plan_de_entrenamiento" SET "contenido" = '{}', "version" = 3 WHERE "id" = '${versionId}'`);
    expect(e).toContain('ACTIVADA es inmutable');
  });

  it('INV-06-109 · tampoco vuelve a BORRADOR', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const e = await errorDeLaBase(
      `UPDATE "version_de_plan_de_entrenamiento" SET "estado" = 'BORRADOR', "version" = 3, "momento_de_activacion" = NULL WHERE "id" = '${versionId}'`,
    );
    expect(e).toContain('ACTIVADA es inmutable');
  });

  it('REG-06-104 · sin instantánea no hay activación («si no puede preservarse la instantánea, el plan no se activa»)', async () => {
    const c = await fresco();
    const { versionId } = await sembrarBorradorDePlan(prisma, c);
    const e = await errorDeLaBase(
      `UPDATE "version_de_plan_de_entrenamiento" SET "estado" = 'ACTIVADA', "version" = 2, "momento_de_activacion" = now() WHERE "id" = '${versionId}'`,
      hecho(c, versionId, 'BORRADOR', 'ACTIVADA', 'VersionDePlanDeEntrenamientoActivada'),
    );
    expect(e).toContain('sin instantánea no hay activación');
  });

  it('09v10:686 · el plan se ata a un objetivo de las mismas partes, no de otro asesorado', async () => {
    const c = await fresco();
    const otro = await circuitoDeEntrenamiento(app, 'maquinas-otro');
    const { versionDeObjetivoId } = await sembrarObjetivo(prisma, otro);
    const planId = randomUUID();
    const e = await errorDeLaBase(
      `INSERT INTO "plan_de_entrenamiento" ("id","profesional_id","asesorado_id") VALUES ('${planId}','${c.pro.id}','${c.ase.id}')`,
      `INSERT INTO "version_de_plan_de_entrenamiento" ("id","plan_id","version_de_objetivo_id","contenido","autor_id","procedencia")
       VALUES ('${randomUUID()}','${planId}','${versionDeObjetivoId}','{}','${c.pro.id}',${PROCEDENCIA_SQL})`,
    );
    expect(e).toContain('objetivo de las mismas partes');
  });
});

// ─── Ejecución (06:5202-5223; REG-06-115) ───────────────────────────────────────────────────────

describe('ejecución real · la vuelta que no existe y la unicidad por ocurrencia (06:5217-5221; REG-06-115)', () => {
  it('INV-06-121 · el borrador de ejecución no cuelga de un plan en borrador: solo de una versión ACTIVADA', async () => {
    const c = await fresco();
    const { versionId } = await sembrarBorradorDePlan(prisma, c);
    const e = await errorDeLaBase(borradorDeEjecucion(c, versionId).sql);
    expect(e).toContain('versión ACTIVADA');
  });

  it('REG-06-115 · una sola ejecución registrada por ocurrencia, aunque lleguen dos confirmaciones', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const b1 = borradorDeEjecucion(c, versionId);
    // La regla está protegida dos veces, y se prueban las dos:
    // 1. una segunda ejecución desde el mismo borrador choca con la unicidad por borrador;
    const desdeElMismo = await errorDeLaBase(b1.sql, ejecucion(c, versionId, b1.id).sql, ejecucion(c, versionId, b1.id).sql);
    expect(desdeElMismo).toMatch(/23505|already exists/);
    // 2. y un segundo borrador para la misma ocurrencia ni siquiera puede existir, así que no hay por dónde llegar a
    //    una segunda confirmación.
    const b2 = borradorDeEjecucion(c, versionId);
    const segundoBorrador = await errorDeLaBase(b1.sql, b2.sql);
    expect(segundoBorrador).toMatch(/23505|already exists/);
  });

  it('REG-06-115 · en otro día es otra ocurrencia, y ahí sí se registra', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const lunes = borradorDeEjecucion(c, versionId, { fecha: '2026-09-21' });
    const martes = borradorDeEjecucion(c, versionId, { fecha: '2026-09-22' });
    const e = await errorDeLaBase(
      lunes.sql,
      ejecucion(c, versionId, lunes.id, { fecha: '2026-09-21' }).sql,
      martes.sql,
      ejecucion(c, versionId, martes.id, { fecha: '2026-09-22' }).sql,
    );
    expect(e).toBe('SIN ERROR');
  });

  it('INV-06-124 · la ejecución registrada original es inmutable', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const b = borradorDeEjecucion(c, versionId);
    const x = ejecucion(c, versionId, b.id);
    const e = await errorDeLaBase(b.sql, x.sql, `UPDATE "ejecucion_de_entrenamiento" SET "condicion" = 'NO_REALIZADA' WHERE "id" = '${x.id}'`);
    expect(e).toMatch(/solo se agrega|historia|no se modifica|append/i);
  });

  it('06:5221 · un borrador confirmado no se edita: no existe la vuelta de REGISTRADA a BORRADOR', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const b = borradorDeEjecucion(c, versionId);
    const e = await errorDeLaBase(
      b.sql,
      ejecucion(c, versionId, b.id).sql,
      `UPDATE "borrador_de_ejecucion_de_entrenamiento" SET "motivo" = 'lo reabro', "version" = 2 WHERE "id" = '${b.id}'`,
    );
    expect(e).toContain('la vuelta de REGISTRADA a BORRADOR no existe');
  });

  it('antes de confirmar, el borrador sí se edita: es justamente para lo que existe', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const b = borradorDeEjecucion(c, versionId, { granularidad: null, condicion: null });
    const e = await errorDeLaBase(
      b.sql,
      `UPDATE "borrador_de_ejecucion_de_entrenamiento" SET "granularidad" = 'SERIE', "condicion" = 'REALIZADA_CON_DESVIO', "version" = 2 WHERE "id" = '${b.id}'`,
    );
    expect(e).toBe('SIN ERROR');
  });

  it('el borrador conserva su ocurrencia: no se muda de sesión ni de día', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const b = borradorDeEjecucion(c, versionId);
    const e = await errorDeLaBase(b.sql, `UPDATE "borrador_de_ejecucion_de_entrenamiento" SET "fecha_local" = '2026-09-25', "version" = 2 WHERE "id" = '${b.id}'`);
    expect(e).toContain('conserva su ocurrencia');
  });

  it('06:5219 · la ejecución nace de su borrador y hereda su ocurrencia exacta', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const b = borradorDeEjecucion(c, versionId, { fecha: '2026-09-21' });
    const e = await errorDeLaBase(b.sql, ejecucion(c, versionId, b.id, { fecha: '2026-09-23' }).sql);
    expect(e).toContain('nace de su borrador');
  });

  it('REG-06-131 · se confirma lo que el borrador declaró: la condición no cambia al confirmar', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const b = borradorDeEjecucion(c, versionId, { condicion: 'REALIZADA' });
    const e = await errorDeLaBase(b.sql, ejecucion(c, versionId, b.id, { condicion: 'NO_REALIZADA' }).sql);
    expect(e).toContain('se confirma lo que el borrador declaró');
  });

  it('REG-06-116 · la cadena de correcciones no se bifurca', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const b = borradorDeEjecucion(c, versionId);
    const x = ejecucion(c, versionId, b.id);
    const correccion = (previa: string | null) =>
      `INSERT INTO "correccion_de_ejecucion_de_entrenamiento" ("id","ejecucion_id","correccion_previa_id","autor_id","motivo","contenido","procedencia")
       VALUES ('${randomUUID()}','${x.id}',${previa ? `'${previa}'` : 'NULL'},'${c.ase.id}','Cargué mal la carga.','{}',${PROCEDENCIA_SQL})`;
    // Dos correcciones raíz de la misma ejecución: la segunda es una rama. La frena el índice parcial `una_raiz`
    // sobre (ejecucion_id) donde no hay corrección previa.
    const e = await errorDeLaBase(b.sql, x.sql, correccion(null), correccion(null));
    expect(e).toMatch(/23505|already exists/);
  });
});

// ─── El Proceso transversal: el agujero que se cerró ────────────────────────────────────────────

describe('Proceso operativo transversal · el agujero de WP-04 (06:5164; migración 20260921110000)', () => {
  it('06:5164 · un plan de entrenamiento activado abre un Proceso de ENTRENAMIENTO', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const e = await errorDeLaBase(...procesoDeEntrenamiento(c, versionId).sql);
    // Antes de esta migración, el CHECK `proceso_operativo_solo_nutricion` lo rechazaba.
    expect(e).toBe('SIN ERROR');
  });

  it('06 §8.9 · antropometría no abre Proceso: eso no cambió', async () => {
    const c = await fresco();
    const e = await errorDeLaBase(
      `INSERT INTO "proceso_operativo" ("id","profesional_id","asesorado_id","alcance","version_de_apertura_id","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${c.pro.id}','${c.ase.id}','ANTROPOMETRIA','${randomUUID()}',${PROCEDENCIA_SQL}, now())`,
    );
    expect(e).toContain('proceso_operativo_alcance_con_proceso');
  });

  it('la apertura va en la columna de su dominio: un Proceso de entrenamiento no se abre con la columna de nutrición', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const e = await errorDeLaBase(
      `INSERT INTO "proceso_operativo" ("id","profesional_id","asesorado_id","alcance","version_de_apertura_id","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${c.pro.id}','${c.ase.id}','ENTRENAMIENTO','${versionId}',${PROCEDENCIA_SQL}, now())`,
    );
    // Lo frena primero el trigger —corre antes de insertar y, para ENTRENAMIENTO, busca la apertura en la columna de
    // entrenamiento, que está vacía—. Detrás quedan la clave foránea hacia nutrición y el CHECK de coherencia: tres
    // redes, y cualquiera de ellas es la base negándose a mezclar dominios.
    expect(e).toMatch(/se abre con la activación|apertura_segun_alcance|version_de_apertura_id_fkey|Foreign key/i);
  });

  it('el CHECK de coherencia también sostiene: un Proceso de entrenamiento no puede traer además una apertura de nutrición', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    // La columna de entrenamiento es válida, así que el trigger pasa. Lo que se prueba es la red que sigue: con las dos
    // columnas llenas, el CHECK `proceso_operativo_apertura_segun_alcance` rechaza. Sin esta prueba, esa red podría
    // estar rota y nadie se enteraría, porque el trigger la tapa en el caso anterior.
    const e = await errorDeLaBase(
      `INSERT INTO "proceso_operativo" ("id","profesional_id","asesorado_id","alcance","version_de_apertura_id","version_de_apertura_entrenamiento_id","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${c.pro.id}','${c.ase.id}','ENTRENAMIENTO','${randomUUID()}','${versionId}',${PROCEDENCIA_SQL}, now())`,
    );
    expect(e).toContain('proceso_operativo_apertura_segun_alcance');
  });

  it('el Proceso de entrenamiento se abre con una versión ACTIVADA, no con un borrador', async () => {
    const c = await fresco();
    const { versionId } = await sembrarBorradorDePlan(prisma, c);
    const e = await errorDeLaBase(...procesoDeEntrenamiento(c, versionId).sql);
    expect(e).toContain('se abre con la activación de una versión de las mismas partes');
  });

  it('RNF-SEC-006 · una revisión nutricional no se registra sobre un Proceso de entrenamiento', async () => {
    const c = await fresco();
    // Es el cruce que abría levantar el CHECK: el trigger de la revisión nutricional solo pedía «Proceso abierto».
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const p = procesoDeEntrenamiento(c, versionId);
    const e = await errorDeLaBase(
      ...p.sql,
      `INSERT INTO "revision_nutricional" ("id","proceso_id","periodo_inicio","periodo_fin","zona_horaria","evidencias","interpretacion","resultado","fundamento","proxima_accion","autor_id","procedencia")
       VALUES ('${randomUUID()}','${p.id}','2026-09-01','2026-09-21','America/Argentina/Buenos_Aires','[]','Interpretación.','MANTENER','Fundamento.','{}','${c.pro.id}',${PROCEDENCIA_SQL})`,
    );
    expect(e).toContain('Proceso ABIERTO de nutrición');
  });

  it('y una revisión de entrenamiento se registra sobre su Proceso de entrenamiento', async () => {
    const c = await fresco();
    const { versionId } = await sembrarPlanActivado(prisma, c);
    const p = procesoDeEntrenamiento(c, versionId);
    const e = await errorDeLaBase(
      ...p.sql,
      `INSERT INTO "revision_de_entrenamiento" ("id","proceso_id","periodo_inicio","periodo_fin","zona_horaria","evidencias","interpretacion","resultado","fundamento","proxima_accion","autor_id","procedencia")
       VALUES ('${randomUUID()}','${p.id}','2026-09-01','2026-09-21','America/Argentina/Buenos_Aires','[]','Interpretación.','AJUSTAR','Fundamento.','{}','${c.pro.id}',${PROCEDENCIA_SQL})`,
    );
    expect(e).toBe('SIN ERROR');
  });

  it('REG-06-75 · un evento no puede declarar aplicada la revisión de otro Proceso', async () => {
    const c = await fresco();
    const a = await sembrarPlanActivado(prisma, c);
    const otro = await circuitoDeEntrenamiento(app, 'maquinas-evento');
    const b = await sembrarPlanActivado(prisma, otro);
    const pa = procesoDeEntrenamiento(c, a.versionId);
    const pb = procesoDeEntrenamiento(otro, b.versionId);
    const revisionDeB = randomUUID();
    const e = await errorDeLaBase(
      ...pa.sql,
      ...pb.sql,
      `INSERT INTO "revision_de_entrenamiento" ("id","proceso_id","periodo_inicio","periodo_fin","zona_horaria","evidencias","interpretacion","resultado","fundamento","proxima_accion","autor_id","procedencia")
       VALUES ('${revisionDeB}','${pb.id}','2026-09-01','2026-09-21','America/Argentina/Buenos_Aires','[]','Interpretación.','MANTENER','Fundamento.','{}','${otro.pro.id}',${PROCEDENCIA_SQL})`,
      // El evento es del Proceso A, pero enlaza la revisión del Proceso B.
      `INSERT INTO "evento_de_proceso" ("id","tipo","proceso_id","tipo_de_aplicacion","revision_de_entrenamiento_id","estado_previo","estado_posterior","actor_id","procedencia")
       VALUES ('${randomUUID()}','ContinuidadOCierreAplicado','${pa.id}','CONTINUIDAD','${revisionDeB}','ABIERTO','ABIERTO','${c.pro.id}',${PROCEDENCIA_SQL})`,
    );
    expect(e).toContain('revisión de su mismo Proceso');
  });
});
