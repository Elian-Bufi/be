/**
 * WP-03 · TEST-RNF-DAT-001 en la base: las listas blancas del 06 §6.8.2, §7.3.2, §7.5.2 y §7.7.5 también las exige
 * PostgreSQL (triggers). Si el código se equivoca, la base rechaza. Cada escenario escribe por fuera de la API, con SQL
 * directo, dentro de una transacción que siempre se revierte.
 */
import type { INestApplication } from '@nestjs/common';
import { CATALOGO_DE_TEXTOS } from '@be/domain';
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
    ).toMatch(/conserva quién pausó/);
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
         VALUES ('${consentId}', '${cabeza.id}', 'REOTORGAMIENTO', 'VIGENTE', 'acceso-profesional-sanitario-2026-09-demo', '${cabeza.hashDelTexto}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '${a01.id}', '${a01.id}', '{}', now())`,
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

describe('Revisión adversarial — garantías que la base exige al confirmar', () => {
  const texto = (id: string) => {
    const v = CATALOGO_DE_TEXTOS.find((t) => t.id === id);
    if (!v) throw new Error(`sin texto ${id}`);
    return v;
  };
  const SANITARIO = 'acceso-profesional-sanitario-2026-09-demo';
  const NO_SANITARIO = 'acceso-profesional-no-sanitario-2026-09-demo';

  it('REG-06-50: una versión agregada sin cambiar el consentimiento no confirma; insertar y revocar en una sola transacción sí, si el final es coherente', async () => {
    const pn = await prepararProfesional(app, 'rev-cadena', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'rev-cadena', { a3: true });
    const { consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const cabeza = await prisma.versionDeConsentimiento.findFirstOrThrow({ where: { consentimientoId: consentId as string } });
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO version_de_consentimiento (consentimiento_id, predecesora_id, decision, situacion_resultante, alcance, finalidad, actor_id, autoria_id, procedencia, momento_de_ocurrencia)
         VALUES ('${consentId}', '${cabeza.id}', 'REVOCACION', 'REVOCADO', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '${a01.id}', '${a01.id}', '{}', now())`,
      ),
    ).rejects.toThrow(/no coincide con su cadena de versiones/);

    // Insertar y actualizar el mismo consentimiento en una transacción: vale el estado final (la fila se relee).
    const a02 = await prepararAsesorado(app, 'rev-cadena-2', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pn, a02, 'NUTRICION', { b2: false });
    const hash = texto(SANITARIO).hash;
    const nuevo = await prisma.$transaction(async (tx) => {
      const [c] = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO consentimiento (alcance_de_vinculo_id, finalidad) VALUES ('${vinculoId}', 'ACOMPANAMIENTO_NUTRICIONAL') RETURNING id::text`,
      );
      const [v1] = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO version_de_consentimiento (consentimiento_id, decision, situacion_resultante, version_de_texto_id, hash_del_texto, alcance, finalidad, actor_id, autoria_id, procedencia, momento_de_ocurrencia)
         VALUES ('${c.id}', 'OTORGAMIENTO', 'VIGENTE', '${SANITARIO}', '${hash}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '${a02.id}', '${a02.id}', '{}', now()) RETURNING id::text`,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO evento_de_vinculo (tipo, profesional_id, asesorado_id, alcance_de_vinculo_id, consentimiento_id, version_de_consentimiento_id, estado_posterior, actor_id, procedencia)
         VALUES ('ConsentimientoOtorgado', '${pn.id}', '${a02.id}', '${vinculoId}', '${c.id}', '${v1.id}', 'VIGENTE', '${a02.id}', '{}')`,
      );
      await tx.$executeRawUnsafe(`UPDATE consentimiento SET situacion = 'REVOCADO', version = 2 WHERE id = '${c.id}'`);
      const [v2] = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO version_de_consentimiento (consentimiento_id, predecesora_id, decision, situacion_resultante, alcance, finalidad, actor_id, autoria_id, procedencia, momento_de_ocurrencia)
         VALUES ('${c.id}', '${v1.id}', 'REVOCACION', 'REVOCADO', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '${a02.id}', '${a02.id}', '{}', now()) RETURNING id::text`,
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO evento_de_vinculo (tipo, profesional_id, asesorado_id, alcance_de_vinculo_id, consentimiento_id, version_de_consentimiento_id, estado_previo, estado_posterior, actor_id, procedencia)
         VALUES ('ConsentimientoRevocado', '${pn.id}', '${a02.id}', '${vinculoId}', '${c.id}', '${v2.id}', 'VIGENTE', 'REVOCADO', '${a02.id}', '{}')`,
      );
      return c.id;
    });
    const final = await prisma.consentimiento.findUniqueOrThrow({ where: { id: nuevo }, include: { versiones: true } });
    expect(final.situacion).toBe('REVOCADO');
    expect(final.versiones).toHaveLength(2);
  });

  it('08 §17: una transición sin su hecho no confirma; con el hecho en la misma transacción, sí', async () => {
    const pn = await prepararProfesional(app, 'con-hecho', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'con-hecho', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    const pausa = `UPDATE alcance_de_vinculo SET estado = 'PAUSADO', pausado_por = 'ASESORADO', motivo_de_ultima_transicion = 'OTRO', version = 2 WHERE id = '${vinculoId}'`;
    await expect(prisma.$executeRawUnsafe(pausa)).rejects.toThrow(/no registró su hecho/);
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(pausa);
      await tx.$executeRawUnsafe(
        `INSERT INTO evento_de_vinculo (tipo, profesional_id, asesorado_id, alcance_de_vinculo_id, estado_previo, estado_posterior, motivo, actor_id, procedencia)
         VALUES ('AlcanceDeVinculoPausado', '${pn.id}', '${a01.id}', '${vinculoId}', 'ACEPTADO', 'PAUSADO', 'OTRO', '${a01.id}', '{}')`,
      );
    });
    expect((await prisma.alcanceDeVinculo.findUniqueOrThrow({ where: { id: vinculoId } })).estado).toBe('PAUSADO');

    const a02 = await prepararAsesorado(app, 'con-hecho-2');
    const solicitudId = (await solicitar(app, pn, a02.id, 'NUTRICION').expect(201)).body.data.relationshipRequestId as string;
    await expect(
      prisma.$executeRawUnsafe(`UPDATE solicitud_de_vinculo SET estado = 'RECHAZADA', version = 2, momento_de_resolucion = now() WHERE id = '${solicitudId}'`),
    ).rejects.toThrow(/no registró su hecho/);
    await expect(prisma.$executeRawUnsafe(`UPDATE verificacion_profesional SET estado = 'SUSPENDIDO', version = version + 1 WHERE identidad_id = '${pn.id}'`)).rejects.toThrow(
      /no registró su hecho/,
    );
  });

  it('A3: como máximo uno vigente por titular; A1 y A2 no chocan con una versión nueva', async () => {
    const a01 = await prepararAsesorado(app, 'actos', { a3: true });
    const copiar = (tipo: string) =>
      `INSERT INTO acto_registrable (identidad_id, tipo, estado, version_de_texto_id, hash_del_texto, finalidad, actor_id, autoria_id, procedencia, momento_de_ocurrencia)
       SELECT identidad_id, tipo, estado, version_de_texto_id, hash_del_texto, finalidad, actor_id, autoria_id, procedencia, now()
         FROM acto_registrable WHERE identidad_id = '${a01.id}' AND tipo = '${tipo}' AND estado = 'VIGENTE'`;
    expect(await errorDeLaBase(copiar('PRIVACIDAD_INFO'))).toBe('SIN ERROR');
    expect(await errorDeLaBase(copiar('DATOS_SALUD_BE'))).toMatch(/23505|acto_registrable_un_a3_vigente/);
  });

  it('08 §12.3 y 06 §7.7.5: el texto del otro perfil, y una «versión nueva» que no sucede a la vigente, se rechazan', async () => {
    const pn = await prepararProfesional(app, 'texto-perfil', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'texto-perfil', { a3: true });
    const { consentId } = await vinculoCompleto(app, pn, a01, 'NUTRICION');
    const cabeza = await prisma.versionDeConsentimiento.findFirstOrThrow({ where: { consentimientoId: consentId as string } });
    const version = (id: string) =>
      `INSERT INTO version_de_consentimiento (consentimiento_id, predecesora_id, decision, situacion_resultante, version_de_texto_id, hash_del_texto, alcance, finalidad, actor_id, autoria_id, procedencia, momento_de_ocurrencia)
       VALUES ('${consentId}', '${cabeza.id}', 'NUEVA_VERSION', 'VIGENTE', '${id}', '${texto(id).hash}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', '${a01.id}', '${a01.id}', '{}', now())`;
    const subir = `UPDATE consentimiento SET version = 2 WHERE id = '${consentId}'`;
    expect(await errorDeLaBase(subir, version(NO_SANITARIO))).toMatch(/perfil del profesional/);
    expect(await errorDeLaBase(subir, version(SANITARIO))).toMatch(/texto sucesor/);
  });

  it('finalizar desde ACEPTADO no inventa quién pausó; una denegación con una dimensión NULL no se registra', async () => {
    const pn = await prepararProfesional(app, 'fin-y-null', ['NUTRICION']);
    const a01 = await prepararAsesorado(app, 'fin-y-null', { a3: true });
    const { vinculoId } = await vinculoCompleto(app, pn, a01, 'NUTRICION', { b2: false });
    expect(
      await errorDeLaBase(`UPDATE alcance_de_vinculo SET estado = 'FINALIZADO', pausado_por = 'PROFESIONAL', motivo_de_ultima_transicion = 'OTRO', version = 2 WHERE id = '${vinculoId}'`),
    ).toMatch(/conserva quién pausó/);
    expect(
      await errorDeLaBase(
        `INSERT INTO decision_de_acceso (operacion, resultado, actor_id, alcance, finalidad, dimensiones_desfavorables, momento_de_ocurrencia)
         VALUES ('API-DSH-03', 'DENEGADA', '${pn.id}', 'NUTRICION', 'ACOMPANAMIENTO_NUTRICIONAL', ARRAY[NULL]::"DimensionDeAutorizacion"[], now())`,
      ),
    ).toMatch(/decision_de_acceso_coherente/);
  });
});
