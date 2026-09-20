/**
 * WP-05 · las garantías de B-10 también las exige PostgreSQL. Si el servicio se equivocara, la base rechazaría
 * igual. Cada escenario escribe por fuera de la API, con SQL directo, en una transacción que siempre se revierte.
 *
 * Cubre las dos máquinas del parche §20 del 06 —ANT-DRAFT (REG-06-214/215) y ANT-VOID (REG-06-217/218/219)— y las
 * reglas de coherencia del dato: unidad de origen presente, clase derivada del origen y dependencias explícitas.
 */
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { appDePrueba } from './soporte-api';
import { borradorSembrado, circuitoAntropometrico, medicionSembrada, registrarBorrador, type CircuitoAntropometrico } from './soporte-antropometria';

const prisma = new PrismaClient();
let app: INestApplication;
let c: CircuitoAntropometrico;

beforeAll(async () => {
  app = await appDePrueba();
  c = await circuitoAntropometrico(app, prisma, 'maquinas');
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

const medicion = (evaluacionId: string, campos: Partial<{ origen: string; clase: string; unidad: string; referencia: string | null }> = {}) =>
  `INSERT INTO "medicion_antropometrica"
     ("id","evaluacion_id","metrica","valor","unidad_de_origen","protocolo_version_id","origen","clase","referencia_de_preparacion","procedencia","momento_de_ocurrencia")
   VALUES ('${randomUUID()}','${evaluacionId}','peso',72.5,'${campos.unidad ?? 'kg'}','${c.protocoloVersionId}',
           '${campos.origen ?? 'CAPTURA_DIRECTA'}','${campos.clase ?? 'MEDIDO'}',
           ${campos.referencia ? `'${campos.referencia}'` : 'NULL'},'{}', now())`;

describe('ANT-DRAFT · la máquina de la evaluación la sostiene la base (REG-06-214)', () => {
  it('una evaluación no puede nacer REGISTRADA', async () => {
    const e = await errorDeLaBase(
      `INSERT INTO "evaluacion_antropometrica" ("id","profesional_id","asesorado_id","estado","procedencia","momento_de_ocurrencia","momento_de_registro_de_evaluacion")
       VALUES ('${randomUUID()}','${c.pro.id}','${c.ase.id}','REGISTRADA','{}', now(), now())`,
    );
    expect(e).toContain('nace EN_PREPARACION');
  });

  it('una evaluación REGISTRADA no vuelve a EN_PREPARACION (inciso 5)', async () => {
    const id = await borradorSembrado(prisma, c);
    await medicionSembrada(prisma, c, id);
    await registrarBorrador(prisma, id);
    const e = await errorDeLaBase(
      `UPDATE "evaluacion_antropometrica" SET "estado" = 'EN_PREPARACION', "momento_de_registro_de_evaluacion" = NULL WHERE "id" = '${id}'`,
    );
    expect(e).toContain('REGISTRADA es inmutable');
  });

  it('no se registra una evaluación sin mediciones: registrar exige contenido registrable (inciso 4)', async () => {
    const id = await borradorSembrado(prisma, c);
    const e = await errorDeLaBase(
      `UPDATE "evaluacion_antropometrica" SET "estado" = 'REGISTRADA', "momento_de_registro_de_evaluacion" = now() WHERE "id" = '${id}'`,
    );
    expect(e).toContain('contenido registrable');
  });

  it('REG-06-215 · una evaluación REGISTRADA no admite contenido nuevo', async () => {
    const id = await borradorSembrado(prisma, c);
    await medicionSembrada(prisma, c, id);
    await registrarBorrador(prisma, id);
    const e = await errorDeLaBase(medicion(id));
    expect(e).toContain('EN_PREPARACION admite contenido nuevo');
  });

  it('REG-06-216 · la versión de trabajo del borrador avanza de a uno', async () => {
    const id = await borradorSembrado(prisma, c);
    const e = await errorDeLaBase(`UPDATE "evaluacion_antropometrica" SET "version" = 7 WHERE "id" = '${id}'`);
    expect(e).toContain('avanza de a uno');
  });

  it('una evaluación no se elimina: la historia es por adición', async () => {
    const id = await borradorSembrado(prisma, c);
    expect(await errorDeLaBase(`DELETE FROM "evaluacion_antropometrica" WHERE "id" = '${id}'`)).toContain('no se elimina');
  });

  it('el momento de registro y el estado no se contradicen', async () => {
    const e = await errorDeLaBase(
      `INSERT INTO "evaluacion_antropometrica" ("id","profesional_id","asesorado_id","procedencia","momento_de_ocurrencia","momento_de_registro_de_evaluacion")
       VALUES ('${randomUUID()}','${c.pro.id}','${c.ase.id}','{}', now(), now())`,
    );
    expect(e).toContain('registro_coherente');
  });
});

describe('ANT-VOID · la anulación es terminal y no se confunde con la corrección (REG-06-217/218/219)', () => {
  it('TEST-ANT-006 · adversarial 6: una segunda anulación no crea una segunda fila', async () => {
    const ev = await borradorSembrado(prisma, c);
    const med = await medicionSembrada(prisma, c, ev);
    await registrarBorrador(prisma, ev);
    const anular = (motivo: string) =>
      `INSERT INTO "anulacion_de_medicion" ("id","medicion_id","autor_id","motivo","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${med}','${c.pro.id}','${motivo}','{}', now())`;
    const e = await errorDeLaBase(anular('Cinta mal calibrada.'), anular('Otro motivo.'));
    expect(e).toMatch(/anulacion_de_medicion_medicion_id_key|23505|already exists/);
  });

  it('TEST-ANT-007 · una medición ANULADA no admite corrección que la vuelva efectiva', async () => {
    const ev = await borradorSembrado(prisma, c);
    const med = await medicionSembrada(prisma, c, ev);
    await registrarBorrador(prisma, ev);
    const e = await errorDeLaBase(
      `INSERT INTO "anulacion_de_medicion" ("id","medicion_id","autor_id","motivo","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${med}','${c.pro.id}','Cinta mal calibrada.','{}', now())`,
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","autor_id","motivo","valor","unidad_de_origen","procedencia")
       VALUES ('${randomUUID()}','${med}','${c.pro.id}','Corregir el valor.',73,'kg','{}')`,
    );
    expect(e).toContain('ANULADA no admite corrección');
  });

  it('anular y corregir exigen motivo', async () => {
    const ev = await borradorSembrado(prisma, c);
    const med = await medicionSembrada(prisma, c, ev);
    await registrarBorrador(prisma, ev);
    const sinMotivoAnulacion = await errorDeLaBase(
      `INSERT INTO "anulacion_de_medicion" ("id","medicion_id","autor_id","motivo","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${med}','${c.pro.id}','   ','{}', now())`,
    );
    expect(sinMotivoAnulacion).toContain('con_motivo');
    const sinMotivoCorreccion = await errorDeLaBase(
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","autor_id","motivo","valor","unidad_de_origen","procedencia")
       VALUES ('${randomUUID()}','${med}','${c.pro.id}','  ',73,'kg','{}')`,
    );
    expect(sinMotivoCorreccion).toContain('con_motivo');
  });

  it('REG-06-16 · la corrección previa tiene que ser de la misma medición, y no hay dos raíces', async () => {
    const ev = await borradorSembrado(prisma, c);
    const a = await medicionSembrada(prisma, c, ev);
    const b = await medicionSembrada(prisma, c, ev, { metrica: 'talla', valor: 1.75, unidad: 'm' });
    await registrarBorrador(prisma, ev);
    const raizDeA = randomUUID();
    const insertar = (id: string, medicionId: string, previa: string | null) =>
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","correccion_previa_id","autor_id","motivo","valor","unidad_de_origen","procedencia")
       VALUES ('${id}','${medicionId}',${previa ? `'${previa}'` : 'NULL'},'${c.pro.id}','Motivo.',73,'kg','{}')`;

    const ajena = await errorDeLaBase(insertar(raizDeA, a, null), insertar(randomUUID(), b, raizDeA));
    expect(ajena).toContain('del mismo objeto');

    const dosRaices = await errorDeLaBase(insertar(raizDeA, a, null), insertar(randomUUID(), a, null));
    expect(dosRaices).toMatch(/una_raiz|23505|already exists/);
  });

  it('una medición y una anulación no se modifican ni se borran', async () => {
    const ev = await borradorSembrado(prisma, c);
    const med = await medicionSembrada(prisma, c, ev);
    await registrarBorrador(prisma, ev);
    expect(await errorDeLaBase(`UPDATE "medicion_antropometrica" SET "valor" = 99 WHERE "id" = '${med}'`)).toContain('append-only');
    expect(await errorDeLaBase(`DELETE FROM "medicion_antropometrica" WHERE "id" = '${med}'`)).toContain('append-only');
    const anulacion = `INSERT INTO "anulacion_de_medicion" ("id","medicion_id","autor_id","motivo","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${med}','${c.pro.id}','Cinta mal calibrada.','{}', now())`;
    expect(await errorDeLaBase(anulacion, `DELETE FROM "anulacion_de_medicion" WHERE "medicion_id" = '${med}'`)).toContain('append-only');
  });
});

describe('Coherencia del dato antropométrico', () => {
  it('INV-06-05 · una medición directa no puede declararse CALCULADO, ni un autorreporte MEDIDO', async () => {
    const ev = await borradorSembrado(prisma, c);
    expect(await errorDeLaBase(medicion(ev, { clase: 'CALCULADO' }))).toContain('clase_coherente');
    expect(await errorDeLaBase(medicion(ev, { origen: 'AUTORREPORTE', clase: 'MEDIDO' }))).toContain('clase_coherente');
    // El par coherente sí entra.
    expect(await errorDeLaBase(medicion(ev, { origen: 'AUTORREPORTE', clase: 'REPORTADO' }))).toBe('SIN ERROR');
  });

  it('REG-06-154 · la unidad de origen no puede ser vacía', async () => {
    const ev = await borradorSembrado(prisma, c);
    expect(await errorDeLaBase(medicion(ev, { unidad: '   ' }))).toContain('unidad_presente');
  });

  it('DL-062 · solo la importación controlada lleva referencia de preparación', async () => {
    const ev = await borradorSembrado(prisma, c);
    expect(await errorDeLaBase(medicion(ev, { referencia: 'prep_1' }))).toContain('origen_coherente');
    expect(await errorDeLaBase(medicion(ev, { origen: 'IMPORTACION_CONTROLADA', referencia: 'prep_1' }))).toBe('SIN ERROR');
  });

  it('REG-06-159 · la entrada de un cálculo pertenece a la misma evaluación que la ejecución', async () => {
    const ev = await borradorSembrado(prisma, c);
    const otra = await borradorSembrado(prisma, c);
    const medDeOtra = await medicionSembrada(prisma, c, otra);
    const ejecucion = randomUUID();
    const e = await errorDeLaBase(
      `INSERT INTO "ejecucion_de_calculo" ("id","evaluacion_id","metodo_version_id","autor_id","metrica","valor","unidad","decimales","modo_de_redondeo","finalidad","regla","procedencia")
       VALUES ('${ejecucion}','${ev}','${c.metodoVersionId}','${c.pro.id}','indice-demo',23.67,'kg/m2',2,'MEDIO_ARRIBA','SOPORTE_ANTROPOMETRICO','demo/peso-sobre-talla-cuadrado@1','{}')`,
      `INSERT INTO "entrada_de_calculo" ("ejecucion_id","medicion_id","metrica","valor","unidad")
       VALUES ('${ejecucion}','${medDeOtra}','peso',72.5,'kg')`,
    );
    expect(e).toContain('misma evaluación');
  });

  it('REG-06-161 · una ejecución no se reemplaza a sí misma', async () => {
    const ev = await borradorSembrado(prisma, c);
    const id = randomUUID();
    const e = await errorDeLaBase(
      `INSERT INTO "ejecucion_de_calculo" ("id","evaluacion_id","metodo_version_id","autor_id","metrica","valor","unidad","decimales","modo_de_redondeo","finalidad","regla","reemplaza_a_id","procedencia")
       VALUES ('${id}','${ev}','${c.metodoVersionId}','${c.pro.id}','indice-demo',23.67,'kg/m2',2,'MEDIO_ARRIBA','SOPORTE_ANTROPOMETRICO','demo/peso-sobre-talla-cuadrado@1','${id}','{}')`,
    );
    expect(e).toContain('no_se_reemplaza_a_si_misma');
  });

  it('REG-06-157 · una especificación no puede tener dos raíces ni mezclar sucesiones', async () => {
    const especificacion = await prisma.especificacionAntropometrica.findFirstOrThrow({ where: { clave: 'PROTO-LAB' } });
    const dosRaices = await errorDeLaBase(
      `INSERT INTO "version_de_especificacion_antropometrica" ("id","especificacion_id","version","nombre","contenido","procedencia")
       VALUES ('${randomUUID()}','${especificacion.id}','1-bis','Segunda raíz','{}','{}')`,
    );
    expect(dosRaices).toMatch(/una_raiz|23505|already exists/);

    const otra = randomUUID();
    const mezcla = await errorDeLaBase(
      `INSERT INTO "especificacion_antropometrica" ("id","clave","tipo") VALUES ('${otra}','MET-OTRO-${otra.slice(0, 8)}','METODO')`,
      `INSERT INTO "version_de_especificacion_antropometrica" ("id","especificacion_id","predecesora_id","version","nombre","contenido","procedencia")
       VALUES ('${randomUUID()}','${otra}','${c.protocoloVersionId}','2','Mezcla inválida','{}','{}')`,
    );
    expect(mezcla).toContain('del mismo objeto');
  });
});

describe('REG-06-215 · el borrador es trabajo en curso; lo registrado es historia', () => {
  it('en preparación el contenido se edita y se reemplaza: no adquiere autoridad histórica por persistirse', async () => {
    const ev = await borradorSembrado(prisma, c);
    const med = await medicionSembrada(prisma, c, ev);
    // Mientras está EN_PREPARACION, la medición se corrige en el lugar y se borra: es contenido de trabajo.
    expect(await errorDeLaBase(`UPDATE "medicion_antropometrica" SET "valor" = 71 WHERE "id" = '${med}'`)).toBe('SIN ERROR');
    expect(await errorDeLaBase(`DELETE FROM "medicion_antropometrica" WHERE "id" = '${med}'`)).toBe('SIN ERROR');
  });

  it('una vez registrada, su contenido es inmutable y los cambios usan corrección o anulación (inciso 5)', async () => {
    const ev = await borradorSembrado(prisma, c);
    const med = await medicionSembrada(prisma, c, ev);
    await registrarBorrador(prisma, ev);
    expect(await errorDeLaBase(`UPDATE "medicion_antropometrica" SET "valor" = 99 WHERE "id" = '${med}'`)).toContain('append-only');
    expect(await errorDeLaBase(`DELETE FROM "medicion_antropometrica" WHERE "id" = '${med}'`)).toContain('append-only');
  });

  it('corregir o anular sobre un borrador se rechaza: ese camino es el de después del registro', async () => {
    const ev = await borradorSembrado(prisma, c);
    const med = await medicionSembrada(prisma, c, ev);
    const anulacion = await errorDeLaBase(
      `INSERT INTO "anulacion_de_medicion" ("id","medicion_id","autor_id","motivo","procedencia","momento_de_ocurrencia")
       VALUES ('${randomUUID()}','${med}','${c.pro.id}','Motivo.','{}', now())`,
    );
    expect(anulacion).toContain('posterior al registro');
    const correccion = await errorDeLaBase(
      `INSERT INTO "correccion_de_medicion" ("id","medicion_id","autor_id","motivo","valor","unidad_de_origen","procedencia")
       VALUES ('${randomUUID()}','${med}','${c.pro.id}','Motivo.',73,'kg','{}')`,
    );
    expect(correccion).toContain('posterior al registro');
  });
});
