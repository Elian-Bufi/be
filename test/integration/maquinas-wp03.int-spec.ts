/**
 * WP-03 · TEST-RNF-DAT-001 en la base: las listas blancas del 06 §6.8.2, §7.3.2, §7.5.2 y §7.7.5 también las exige
 * PostgreSQL (triggers). Si el código se equivoca, la base rechaza. Cada escenario escribe por fuera de la API, con SQL
 * directo, dentro de una transacción que siempre se revierte.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba } from './soporte-api';
import { finalizar, pausar, prepararAsesorado, prepararProfesional, revocarB2, solicitar, versionDeVinculo, vinculoCompleto } from './soporte-vinculo';

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
/** Ejecuta SQL directo en una transacción que siempre se revierte y devuelve el error de la base, si lo hubo. */
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

describe('06 §7.3.2 — Solicitud: toda transición no declarada se rechaza en la base', () => {
  it.each([
    ['ACEPTADA', 'PENDIENTE'],
    ['ACEPTADA', 'RECHAZADA'],
    ['RECHAZADA', 'ACEPTADA'],
    ['CADUCADA', 'PENDIENTE'],
    ['INVALIDADA', 'ACEPTADA'],
  ])('%s → %s es TRANSICION_NO_DECLARADA', async (desde, hacia) => {
    const pn = await prepararProfesional(app, `sol-${desde}-${hacia}`, ['NUTRICION']);
    const a01 = await prepararAsesorado(app, `sol-${desde}-${hacia}`);
    const id = (await solicitar(app, pn, a01.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string;
    const llevar = `UPDATE solicitud_de_vinculo SET estado = '${desde}', version = 2, momento_de_resolucion = now() WHERE id = '${id}'`;
    const probar = `UPDATE solicitud_de_vinculo SET estado = '${hacia}', version = 3, momento_de_resolucion = ${hacia === 'PENDIENTE' ? 'NULL' : 'now()'} WHERE id = '${id}'`;
    expect(await errorDeLaBase(llevar, probar)).toMatch(/TRANSICION_NO_DECLARADA/);
  });

  it('una solicitud no nace ACEPTADA, su contenido es inmutable, no se borra y la versión avanza de a uno', async () => {
    const pn = await prepararProfesional(app, 'sol-reglas', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'sol-reglas');
    const id = (await solicitar(app, pn, a01.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string;
    expect(
      await errorDeLaBase(
        `INSERT INTO solicitud_de_vinculo (profesional_id, asesorado_id, alcance, finalidad, iniciador, estado, procedencia, vence_en, momento_de_resolucion)
         VALUES ('${pn.id}', '${a01.id}', 'ENTRENAMIENTO', 'PLANIFICACION_DEL_ENTRENAMIENTO', 'PROFESIONAL', 'ACEPTADA', '{}', now(), now())`,
      ),
    ).toMatch(/nace PENDIENTE/);
    expect(await errorDeLaBase(`UPDATE solicitud_de_vinculo SET alcance = 'ENTRENAMIENTO', finalidad = 'PLANIFICACION_DEL_ENTRENAMIENTO' WHERE id = '${id}'`)).toMatch(/inmutable/);
    expect(await errorDeLaBase(`DELETE FROM solicitud_de_vinculo WHERE id = '${id}'`)).toMatch(/no se elimina/);
    expect(await errorDeLaBase(`UPDATE solicitud_de_vinculo SET estado = 'RECHAZADA', version = 5, momento_de_resolucion = now() WHERE id = '${id}'`)).toMatch(/avanza de a uno/);
    // La finalidad es la del alcance (REG-06-61; DL-039).
    expect(
      await errorDeLaBase(
        `INSERT INTO solicitud_de_vinculo (profesional_id, asesorado_id, alcance, finalidad, iniciador, procedencia, vence_en)
         VALUES ('${pn.id}', '${a01.id}', 'ENTRENAMIENTO', 'ACOMPANAMIENTO_NUTRICIONAL', 'PROFESIONAL', '{}', now())`,
      ),
    ).toMatch(/finalidad_del_alcance/);
    // Solo quien tiene perfil profesional puede ser el profesional de una solicitud.
    expect(
      await errorDeLaBase(
        `INSERT INTO solicitud_de_vinculo (profesional_id, asesorado_id, alcance, finalidad, iniciador, procedencia, vence_en)
         VALUES ('${a01.id}', '${pn.id}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', 'ASESORADO', '{}', now())`,
      ),
    ).toMatch(/perfil profesional/);
  });
});

describe('06 §7.5.2 — Vínculo por Alcance: FINALIZADO es terminal y la pausa exige motivo', () => {
  it('FINALIZADO → ACEPTADO y FINALIZADO → PAUSADO se rechazan (INV-06-58); ACEPTADO → PAUSADO sin motivo, también', async () => {
    const pn = await prepararProfesional(app, 'alc', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'alc');
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    expect(await errorDeLaBase(`UPDATE alcance_de_vinculo SET estado = 'PAUSADO', pausado_por = 'ASESORADO', version = 2 WHERE id = '${vinculoId}'`)).toMatch(/motivo de pausa/);
    await finalizar(app, a01.token, vinculoId, await versionDeVinculo(app, a01.token, vinculoId)).expect(200);
    expect(await errorDeLaBase(`UPDATE alcance_de_vinculo SET estado = 'ACEPTADO', version = 3 WHERE id = '${vinculoId}'`)).toMatch(/TRANSICION_NO_DECLARADA/);
    expect(
      await errorDeLaBase(`UPDATE alcance_de_vinculo SET estado = 'PAUSADO', pausado_por = 'ASESORADO', motivo_de_ultima_transicion = 'OTRO', version = 3 WHERE id = '${vinculoId}'`),
    ).toMatch(/TRANSICION_NO_DECLARADA/);
    expect(await errorDeLaBase(`DELETE FROM alcance_de_vinculo WHERE id = '${vinculoId}'`)).toMatch(/no se elimina/);
  });

  it('un segundo componente no finalizado para el mismo vínculo y alcance viola el índice parcial; y no nace sin solicitud ACEPTADA', async () => {
    const pn = await prepararProfesional(app, 'alc-indice', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'alc-indice');
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    const { vinculoId: agregador } = await prisma.alcanceDeVinculo.findUniqueOrThrow({ where: { id: vinculoId }, select: { vinculoId: true } });
    const pendiente = (await solicitar(app, pn, a01.id, 'NUTRICION').expect(409)).body.error.code;
    expect(pendiente).toBe('RESOURCE_CONFLICT');
    // Una segunda solicitud ACEPTADA para el mismo par y alcance (en SQL directo) no puede originar otro componente
    // mientras el primero no esté FINALIZADO: lo impide el índice parcial alcance_de_vinculo_no_finalizado (23505).
    const otraId = randomUUID();
    expect(
      await errorDeLaBase(
        `INSERT INTO solicitud_de_vinculo (id, profesional_id, asesorado_id, alcance, finalidad, iniciador, procedencia, vence_en)
         VALUES ('${otraId}', '${pn.id}', '${a01.id}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', 'PROFESIONAL', '{}', now() + interval '1 day')`,
        `UPDATE solicitud_de_vinculo SET estado = 'ACEPTADA', version = 2, momento_de_resolucion = now() WHERE id = '${otraId}'`,
        `INSERT INTO alcance_de_vinculo (vinculo_id, alcance, finalidad, solicitud_de_origen_id, procedencia) VALUES ('${agregador}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '${otraId}', '{}')`,
      ),
    ).toMatch(/23505/);
    const otra = (await solicitar(app, await prepararProfesional(app, 'alc-otra', ['NUTRICION']), a01.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string;
    expect(
      await errorDeLaBase(
        `INSERT INTO alcance_de_vinculo (vinculo_id, alcance, finalidad, solicitud_de_origen_id, procedencia) VALUES ('${agregador}', 'ENTRENAMIENTO', 'PLANIFICACION_DEL_ENTRENAMIENTO', '${otra}', '{}')`,
      ),
    ).toMatch(/Solicitud ACEPTADA/);
  });

  it('finalizar desde PAUSADO conserva quién pausó («preserva pausa previa»)', async () => {
    const pn = await prepararProfesional(app, 'alc-pausa', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'alc-pausa');
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    await pausar(app, pn.token, vinculoId, await versionDeVinculo(app, pn.token, vinculoId), 'OTRO').expect(200);
    expect(
      await errorDeLaBase(`UPDATE alcance_de_vinculo SET estado = 'FINALIZADO', pausado_por = 'ASESORADO', motivo_de_ultima_transicion = 'OTRO', version = 3 WHERE id = '${vinculoId}'`),
    ).toMatch(/preserva la pausa previa/);
  });
});

describe('06 §7.7.5 — Consentimiento: lista blanca, cadena de versiones y solo el titular', () => {
  it('REVOCADO → REVOCADO sin decisión, un consentimiento que nace REVOCADO y borrar se rechazan', async () => {
    const pn = await prepararProfesional(app, 'con', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'con', { a3: true });
    const { consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await revocarB2(app, a01, consentId as string).expect(200);
    expect(await errorDeLaBase(`UPDATE consentimiento SET situacion = 'REVOCADO', version = 3 WHERE id = '${consentId}'`)).toMatch(/TRANSICION_NO_DECLARADA|cadena de versiones/);
    expect(await errorDeLaBase(`DELETE FROM consentimiento WHERE id = '${consentId}'`)).toMatch(/no se elimina/);
    expect(await errorDeLaBase(`DELETE FROM version_de_consentimiento WHERE consentimiento_id = '${consentId}'`)).toMatch(/append-only/);
  });

  it('cambiar la situación sin emitir su versión no confirma (REG-06-50: una versión por decisión, verificado al commit)', async () => {
    const pn = await prepararProfesional(app, 'con-cadena', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'con-cadena', { a3: true });
    const { consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    await expect(prisma.$executeRawUnsafe(`UPDATE consentimiento SET situacion = 'REVOCADO', version = 2 WHERE id = '${consentId}'`)).rejects.toThrow(
      /no coincide con su cadena de versiones/,
    );
    expect((await prisma.consentimiento.findUniqueOrThrow({ where: { id: consentId as string } })).situacion).toBe('VIGENTE');
  });

  it('INV-06-62: una versión decidida por el profesional se rechaza; y una revocación sin predecesora vigente también', async () => {
    const pn = await prepararProfesional(app, 'con-actor', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'con-actor', { a3: true });
    const { consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const [cabeza] = await prisma.versionDeConsentimiento.findMany({ where: { consentimientoId: consentId as string } });
    expect(
      await errorDeLaBase(
        `INSERT INTO version_de_consentimiento (consentimiento_id, predecesora_id, decision, situacion_resultante, alcance, finalidad, actor_id, autoria_id, procedencia, momento_de_ocurrencia)
         VALUES ('${consentId}', '${cabeza.id}', 'REVOCACION', 'REVOCADO', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '${pn.id}', '${pn.id}', '{}', now())`,
      ),
    ).toMatch(/INV-06-62/);
    expect(
      await errorDeLaBase(
        `INSERT INTO version_de_consentimiento (consentimiento_id, predecesora_id, decision, situacion_resultante, version_de_texto_id, hash_del_texto, alcance, finalidad, actor_id, autoria_id, procedencia, momento_de_ocurrencia)
         VALUES ('${consentId}', '${cabeza.id}', 'REOTORGAMIENTO', 'VIGENTE', 'b2-sanitario-2026-09-demo', '${cabeza.hashDelTexto}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '${a01.id}', '${a01.id}', '{}', now())`,
      ),
    ).toMatch(/TRANSICION_NO_DECLARADA/);
  });
});

describe('Verificación y habilitación (06 §6.8.2; DL-036)', () => {
  it.each([
    ['VERIFICADO', 'PENDIENTE'],
    ['RECHAZADO', 'VERIFICADO'],
    ['SUSPENDIDO', 'RECHAZADO'],
  ])('verificación %s → %s se rechaza en la base', async (desde, hacia) => {
    const pn = await prepararProfesional(app, `ver-${desde}-${hacia}`, ['NUTRICION']);
    const pasos: string[] = [];
    if (desde === 'RECHAZADO') {
      // Otra trayectoria: se crea PENDIENTE y se rechaza en SQL directo (lo que sí está declarado).
      pasos.push(
        `INSERT INTO verificacion_profesional (identidad_id, alcance, procedencia) VALUES ('${pn.id}', 'ENTRENAMIENTO', '{}')`,
        `UPDATE verificacion_profesional SET estado = 'RECHAZADO', version = 2 WHERE identidad_id = '${pn.id}' AND alcance = 'ENTRENAMIENTO'`,
        `UPDATE verificacion_profesional SET estado = '${hacia}', version = 3 WHERE identidad_id = '${pn.id}' AND alcance = 'ENTRENAMIENTO'`,
      );
    } else {
      const antes = await prisma.verificacionProfesional.findUniqueOrThrow({ where: { identidadId_alcance: { identidadId: pn.id, alcance: 'NUTRICION' } } });
      if (desde === 'SUSPENDIDO') pasos.push(`UPDATE verificacion_profesional SET estado = 'SUSPENDIDO', version = ${antes.version + 1} WHERE id = '${antes.id}'`);
      pasos.push(`UPDATE verificacion_profesional SET estado = '${hacia}', version = ${antes.version + (desde === 'SUSPENDIDO' ? 2 : 1)} WHERE id = '${antes.id}'`);
    }
    expect(await errorDeLaBase(...pasos)).toMatch(/TRANSICION_NO_DECLARADA/);
  });

  it('una verificación no nace VERIFICADO ni la habilitación RETIRADA (REG-06-79: concesión explícita)', async () => {
    const a01 = await prepararAsesorado(app, 'ver-nace');
    expect(await errorDeLaBase(`INSERT INTO verificacion_profesional (identidad_id, alcance, estado, procedencia) VALUES ('${a01.id}', 'NUTRICION', 'VERIFICADO', '{}')`)).toMatch(/nace PENDIENTE/);
    expect(await errorDeLaBase(`INSERT INTO habilitacion (identidad_id, alcance, estado, procedencia) VALUES ('${a01.id}', 'NUTRICION', 'RETIRADA', '{}')`)).toMatch(/concesión explícita/);
  });
});

describe('Historia por adición (08 §29): hechos y decisiones son append-only', () => {
  it.each(['evento_de_vinculo', 'evento_de_verificacion', 'decision_de_acceso', 'version_de_consentimiento', 'vinculo', 'perfil_profesional'])(
    '%s: UPDATE y DELETE se rechazan',
    async (tabla) => {
      expect(await errorDeLaBase(`UPDATE ${tabla} SET id = id`)).toMatch(/append-only|SIN ERROR/);
      expect(await errorDeLaBase(`DELETE FROM ${tabla}`)).toMatch(/append-only|SIN ERROR/);
      // Con al menos una fila en cada tabla (las pruebas anteriores las crearon), el rechazo es seguro.
      const [{ n }] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM ${tabla}`);
      if (Number(n) > 0) {
        expect(await errorDeLaBase(`UPDATE ${tabla} SET id = id`)).toMatch(/append-only/);
        expect(await errorDeLaBase(`DELETE FROM ${tabla}`)).toMatch(/append-only/);
      }
    },
  );

  it('una decisión PERMITIDA sin versión de consentimiento, o DENEGADA sin dimensión, viola decision_de_acceso_coherente', async () => {
    const pn = await prepararProfesional(app, 'decision', ['NUTRICION']);
    expect(
      await errorDeLaBase(
        `INSERT INTO decision_de_acceso (operacion, resultado, actor_id, alcance, finalidad, dimensiones_desfavorables, momento_de_ocurrencia)
         VALUES ('API-DSH-03', 'PERMITIDA', '${pn.id}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '{}', now())`,
      ),
    ).toMatch(/decision_de_acceso_coherente/);
    expect(
      await errorDeLaBase(
        `INSERT INTO decision_de_acceso (operacion, resultado, actor_id, alcance, finalidad, dimensiones_desfavorables, momento_de_ocurrencia)
         VALUES ('API-DSH-03', 'DENEGADA', '${pn.id}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '{}', now())`,
      ),
    ).toMatch(/decision_de_acceso_coherente/);
  });
});
