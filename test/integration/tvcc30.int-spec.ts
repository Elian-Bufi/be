/**
 * TVCC-30 (RF-058 · UC-S01 · DEUDA_LEGAJO DL-135) contra PostgreSQL real. Las doce pruebas del 11A §21 contra la regla
 * están en `packages/domain/src/tvcc30.test.ts`; acá se prueba lo que solo la base puede probar:
 * - los ciclos salen de los hechos que dejan los recorridos reales: activar un plan con fecha de revisión, registrar y
 *   aplicar una revisión, pausar el vínculo (TEST-TVCC-002 y 004);
 * - mirar el tablero o la cartera no cambia el resultado (TEST-TVCC-005);
 * - dos corridas con los mismos hechos dan la misma huella, y se conservan las dos, encadenadas; otra especificación
 *   es otro resultado y no toca el anterior (TEST-TVCC-009 y 010);
 * - lo conservado no se modifica ni se borra, y la base rechaza un resultado incoherente (REG-06-194, 198).
 *
 * La base es compartida con las otras pruebas: las aserciones miran los ciclos de los Procesos que arma esta prueba.
 */
import type { INestApplication } from '@nestjs/common';
import { fechaCivil, SPEC_TVCC30_V1, ZONA_TVCC30, type CicloTvcc30, type ResultadoTvcc30 } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { calcularTvcc30EnLaBase, conservarTvcc30, huellaTvcc30 } from '../../apps/api/src/analitica/tvcc30';
import { resumenTvcc30 } from '../../apps/api/src/analitica/calcular-tvcc30';
import { appDePrueba, conSesion } from './soporte-api';
import { activar, circuitoListoParaPlanificar, crearBorrador, cuerpoDeRevision, registrarComida } from './soporte-nutricion';
import { dashboard, pausar, versionDeVinculo } from './soporte-vinculo';

let app: INestApplication;
const prisma = new PrismaClient();

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const hoy = fechaCivil(new Date().toISOString(), ZONA_TVCC30);
const dia = (n: number): string => new Date(Date.parse(`${hoy}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/** El corte es mañana: así entra un ciclo que vence mañana, con el vínculo ya pausado hoy. */
const CORTE = dia(1);
const PROCEDENCIA = { fuente: 'PROPIA', casoDeUso: 'UC-S01', operacion: 'PRUEBA-TVCC30', superficie: null, requestId: null };

/** Un seguimiento de Nutrición con el plan activado y la revisión prevista para `fecha`. */
async function seguimiento(etiqueta: string, fecha: string) {
  const c = await circuitoListoParaPlanificar(app, etiqueta);
  const borrador = await crearBorrador(app, c, { nextReviewAt: fecha });
  await activar(app, c.pro, borrador.planId, borrador.version).expect(200);
  const proceso = await prisma.procesoOperativo.findFirstOrThrow({ where: { asesoradoId: c.ase.id }, select: { id: true } });
  return { ...c, planId: borrador.planId, procesoId: proceso.id };
}

/** Registra una revisión con la evidencia de una comida; la aplica si se pide. */
async function revisar(c: Awaited<ReturnType<typeof seguimiento>>, aplicar: boolean): Promise<string> {
  const hoyDelPlan = await conSesion(app, c.ase.token).get('/api/v1/me/nutrition/today').expect(200);
  const comida = await registrarComida(app, c.ase, c.planId, hoyDelPlan.body.data.activePlan.dayTypes[0]).expect(201);
  const evidencia = [{ type: 'EXECUTION', id: comida.body.data.executionId as string }];
  const r = await conSesion(app, c.pro.token).post(`/api/v1/advisees/${c.ase.id}/nutrition/reviews`).send(cuerpoDeRevision(evidencia, 'MAINTAIN', { nextReviewAt: dia(40) })).expect(201);
  const id = r.body.data.reviewId as string;
  if (aplicar) await conSesion(app, c.pro.token).post(`/api/v1/nutrition/reviews/${id}/apply`).send({ expectedVersion: 'v1' }).expect(200);
  return id;
}

const cicloDe = (r: ResultadoTvcc30, procesoId: string): CicloTvcc30[] => r.universo.filter((c) => c.procesoId === procesoId);

describe('TEST-RF-058 · UC-S01 · la TVCC-30 con los hechos de la base', () => {
  it('arma los ciclos de los recorridos reales, los clasifica, y mirar no cambia nada; lo conservado es historia', async () => {
    // A: venció hace tres días y se revisó con la continuidad aplicada. Su ciclo siguiente vence en 40 días: fuera.
    const a = await seguimiento('tvcc-a', dia(-3));
    const revisionA = await revisar(a, true);
    // B: venció hace dos días; la revisión está registrada pero sin aplicar (REG-06-149).
    const b = await seguimiento('tvcc-b', dia(-2));
    const revisionB = await revisar(b, false);
    // C: vence mañana, y la persona pausó el vínculo hoy.
    const c = await seguimiento('tvcc-c', dia(1));
    await pausar(app, c.ase.token, c.vinculoId, await versionDeVinculo(app, c.ase.token, c.vinculoId)).expect(200);

    const r1 = await calcularTvcc30EnLaBase(prisma, { corte: CORTE });
    expect(r1.ventana).toMatchObject({ corte: CORTE, hasta: CORTE, desde: dia(-28), fechas: 30, zona: 'America/Argentina/Buenos_Aires' });

    const [cicloA, ...otrosA] = cicloDe(r1, a.procesoId);
    expect(otrosA).toEqual([]);
    expect(cicloA).toMatchObject({
      cicloId: `${a.procesoId}#1`,
      dominio: 'NUTRICION',
      ancla: dia(-3),
      origenDelAncla: 'VENCIO',
      clasificacion: 'ELEGIBLE',
      numerador: 'INCLUIDO',
      cierre: { revisionId: revisionA, resultado: 'MANTENER', tipo: 'CONTINUIDAD' },
    });
    expect(cicloDe(r1, b.procesoId)).toEqual([
      expect.objectContaining({ ancla: dia(-2), clasificacion: 'ELEGIBLE', numerador: 'NO_INCLUIDO', cierre: null, revisionesSinAplicar: [revisionB] }),
    ]);
    expect(cicloDe(r1, c.procesoId)).toEqual([
      expect.objectContaining({ ancla: dia(1), clasificacion: 'EXCLUIDO', motivo: 'VINCULO_PAUSADO_EN_EL_ANCLA', numerador: 'NO_INCLUIDO' }),
    ]);
    // N ⊆ D en todo el universo, también con los ciclos de las otras pruebas.
    expect(r1.universo.filter((x) => x.numerador === 'INCLUIDO').every((x) => x.clasificacion === 'ELEGIBLE')).toBe(true);

    // La cuenta declarada demo queda afuera con su motivo.
    const conDemo = await calcularTvcc30EnLaBase(prisma, { corte: CORTE, cuentasDemo: [b.ase.id] });
    expect(cicloDe(conDemo, b.procesoId)[0]).toMatchObject({ clasificacion: 'EXCLUIDO', motivo: 'CUENTA_DEMO' });
    expect(conDemo.cuentasDemoDeclaradas).toBe(1);

    // TEST-TVCC-005: el profesional mira el tablero y la cartera; nada de eso es un hecho que el cálculo lea.
    await dashboard(app, a.pro, a.ase.id).expect(200);
    await dashboard(app, b.pro, b.ase.id).expect(200);
    await conSesion(app, a.pro.token).get('/api/v1/me/portfolio').expect(200);
    const r2 = await calcularTvcc30EnLaBase(prisma, { corte: CORTE });
    expect(huellaTvcc30(r2)).toBe(huellaTvcc30(r1));

    // TEST-TVCC-009 y 010: se conservan las dos corridas, encadenadas y con la misma huella; otra especificación es
    // otro resultado, sucesor, con otra huella, y el primero queda como estaba.
    const primero = await conservarTvcc30(prisma, r1, { ejecutor: 'prueba de integración', ambiente: 'test', procedencia: PROCEDENCIA });
    const segundo = await conservarTvcc30(prisma, r2, { ejecutor: 'prueba de integración', ambiente: 'test', procedencia: PROCEDENCIA });
    expect(segundo.predecesorId).toBe(primero.id);
    expect(segundo.huella).toBe(primero.huella);
    const v2 = await calcularTvcc30EnLaBase(prisma, { corte: CORTE, especificacion: { ...SPEC_TVCC30_V1, id: 'SPEC-TVCC30-v2-PRUEBA', mapeo: 'BE-TVCC30-MAPEO-2 · prueba' } });
    const tercero = await conservarTvcc30(prisma, v2, { ejecutor: 'prueba de integración', ambiente: 'test', procedencia: PROCEDENCIA });
    expect(tercero.predecesorId).toBe(segundo.id);
    expect(tercero.huella).not.toBe(primero.huella);
    const fila = await prisma.resultadoTvcc30.findUniqueOrThrow({ where: { id: primero.id } });
    expect(fila).toMatchObject({ especificacion: 'SPEC-TVCC30-v1', huella: primero.huella, ejecutor: 'prueba de integración', universo: r1.conteos.universo });
    expect(fila.resultado).toEqual(JSON.parse(JSON.stringify(r1)));

    // REG-06-198: no se modifica ni se borra.
    await expect(prisma.$executeRawUnsafe(`UPDATE resultado_tvcc30 SET ejecutor = 'otro' WHERE id = '${primero.id}'`)).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM resultado_tvcc30 WHERE id = '${primero.id}'`)).rejects.toThrow(/append-only/);

    // El resumen que imprime el comando no lleva identificadores de personas.
    const resumen = resumenTvcc30(r1).join('\n');
    expect(resumen).toContain(`Corte ${CORTE}`);
    for (const id of [a.ase.id, b.ase.id, c.ase.id, a.pro.id]) expect(resumen).not.toContain(id);
  });

  it('la base rechaza un resultado incoherente: N sin D, N mayor que D o una tasa sin denominador (REG-06-194)', async () => {
    const insertar = (estado: string, motivo: string | null, n: number | null, d: number | null, noResolubles = 0) =>
      prisma.$executeRawUnsafe(
        `INSERT INTO resultado_tvcc30 (especificacion, mapeo, corte, zona, ventana_inicio, ventana_fin, estado, motivo_sin_valor, numerador, denominador, universo, excluidos, no_resolubles, resultado, huella, ejecutor, ambiente, procedencia)
         VALUES ('SPEC-TVCC30-v1', 'prueba', '2026-10-16', 'America/Argentina/Buenos_Aires', '2026-09-17T03:00:00Z', '2026-10-17T03:00:00Z', '${estado}', ${motivo ? `'${motivo}'` : 'NULL'},
                 ${n ?? 'NULL'}, ${d ?? 'NULL'}, 5, 0, ${noResolubles}, '{}'::jsonb, '${'a'.repeat(64)}', 'prueba', 'test', '{}'::jsonb)`,
      );
    await expect(insertar('CALCULADO', null, 3, null)).rejects.toThrow(/resultado_tvcc30_par/);
    await expect(insertar('CALCULADO', null, 4, 3)).rejects.toThrow(/resultado_tvcc30_n_en_d/);
    await expect(insertar('CALCULADO', null, 0, 0)).rejects.toThrow(/resultado_tvcc30_valor/);
    await expect(insertar('SIN_VALOR', 'DENOMINADOR_CERO', 0, 0, 1)).rejects.toThrow(/resultado_tvcc30_valor/);
    await expect(insertar('SIN_VALOR', 'CANDIDATOS_NO_RESOLUBLES', null, null, 0)).rejects.toThrow(/resultado_tvcc30_valor/);
  });
});
