/**
 * TEST-RNF-DAT-001 — máquina de estado de cuenta (06 §5.7.4), literal: una prueba por transición declarada, más
 * `SUSPENDIDA → CERRADA` y las salidas de CERRADA rechazadas en el servicio Y en la base (trigger `identidad_guardar`).
 */
import type { INestApplication } from '@nestjs/common';
import { TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA, VERSION_VIGENTE, type ContextoDeTransicionDeCuenta } from '@be/domain';
import { PrismaClient } from '@prisma/client';
import { EstadoDeCuentaService } from '../../apps/api/src/identidad/estado-de-cuenta.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { appDePrueba, conSesion, correoSintetico, cuerpoDeCierre, registrarOk, tokenDe, transicionPorServicio } from './soporte-api';

const prisma = new PrismaClient();
let app: INestApplication;

beforeAll(async () => {
  app = await appDePrueba();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

const estadoDe = async (id: string) => (await prisma.identidad.findUniqueOrThrow({ where: { id } })).estadoOperativoDeCuenta;
const eventoDe = (id: string, tipo: 'CuentaSuspendida' | 'CuentaRestablecida' | 'CuentaCerrada') =>
  prisma.eventoDeDominio.findFirst({ where: { identidadId: id, tipo } });

/** UPDATE directo, salteando el servicio: lo que queda es la defensa de la base. */
const updateDirecto = (id: string, estado: string) =>
  prisma.$executeRawUnsafe(`UPDATE identidad SET estado_operativo_de_cuenta = '${estado}' WHERE id = '${id}'::uuid`);

const CIERRE_VALIDO: ContextoDeTransicionDeCuenta = {
  transicion: 'CerrarCuenta',
  actor: 'TITULAR',
  sesionDelTitularValida: true,
  autenticacionReciente: true,
  versionDeConsecuenciasPresentada: VERSION_VIGENTE.CONSECUENCIAS_DE_CIERRE.id,
  confirmacionExplicita: true,
};

async function cerrarPorServicio(id: string) {
  const servicio = app.get(EstadoDeCuentaService);
  const procedencia = { fuente: 'PROPIA' as const, casoDeUso: 'PRUEBA', operacion: 'SERVICIO', superficie: null, requestId: null };
  return app.get(PrismaService).$transaction((tx) => servicio.transicionar(tx, id, CIERRE_VALIDO, { identidadId: id }, procedencia, new Date()));
}

describe('TEST-RNF-DAT-001 — transiciones declaradas', () => {
  it('la lista blanca tiene exactamente las 3 transiciones del 06 §5.7.4', () => {
    expect(TRANSICIONES_DE_ESTADO_OPERATIVO_DE_CUENTA.map((t) => `${t.origen}->${t.destino}`)).toEqual([
      'OPERATIVA->SUSPENDIDA',
      'SUSPENDIDA->OPERATIVA',
      'OPERATIVA->CERRADA',
    ]);
  });

  it('TEST-RNF-DAT-001 SuspenderCuenta: OPERATIVA → SUSPENDIDA con evento CuentaSuspendida (anterior/resultante, actor servicio)', async () => {
    const id = await registrarOk(app, correoSintetico('dat001-suspender'));
    const r = await transicionPorServicio(app, id, 'SuspenderCuenta', 'fundamento sintético');
    expect(r.permitida).toBe(true);
    expect(await estadoDe(id)).toBe('SUSPENDIDA');
    expect(await eventoDe(id, 'CuentaSuspendida')).toMatchObject({
      estadoAnterior: 'OPERATIVA',
      estadoResultante: 'SUSPENDIDA',
      actorId: null,
      actorServicio: 'SERVICIO_INTERNO',
      datos: { fundamento: 'fundamento sintético' },
    });
  });

  it('TEST-RNF-DAT-001 RestablecerCuenta: SUSPENDIDA → OPERATIVA con evento CuentaRestablecida', async () => {
    const id = await registrarOk(app, correoSintetico('dat001-restablecer'));
    await transicionPorServicio(app, id, 'SuspenderCuenta');
    const r = await transicionPorServicio(app, id, 'RestablecerCuenta', 'resolución sintética');
    expect(r.permitida).toBe(true);
    expect(await estadoDe(id)).toBe('OPERATIVA');
    expect(await eventoDe(id, 'CuentaRestablecida')).toMatchObject({ estadoAnterior: 'SUSPENDIDA', estadoResultante: 'OPERATIVA' });
  });

  it('TEST-RNF-DAT-001 CerrarCuenta: OPERATIVA → CERRADA con evento CuentaCerrada (vía ACC-P1-03)', async () => {
    const correo = correoSintetico('dat001-cerrar');
    const id = await registrarOk(app, correo);
    const token = await tokenDe(app, correo);
    await conSesion(app, token).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()).expect(201);
    expect(await estadoDe(id)).toBe('CERRADA');
    expect(await eventoDe(id, 'CuentaCerrada')).toMatchObject({ estadoAnterior: 'OPERATIVA', estadoResultante: 'CERRADA' });
  });

  it('TEST-RNF-DAT-001: guardas explícitas — sin fundamento no se suspende; sin resolución no se restablece', async () => {
    const id = await registrarOk(app, correoSintetico('dat001-guardas'));
    expect(await transicionPorServicio(app, id, 'SuspenderCuenta', '   ')).toEqual({ permitida: false, motivo: 'SIN_FUNDAMENTO' });
    expect(await estadoDe(id)).toBe('OPERATIVA');
    await transicionPorServicio(app, id, 'SuspenderCuenta');
    expect(await transicionPorServicio(app, id, 'RestablecerCuenta', '')).toEqual({ permitida: false, motivo: 'SIN_RESOLUCION' });
    expect(await estadoDe(id)).toBe('SUSPENDIDA');
  });
});

describe('TEST-RNF-DAT-001 — SUSPENDIDA → CERRADA no existe', () => {
  it('TEST-RNF-DAT-001: el servicio rechaza CerrarCuenta sobre una cuenta SUSPENDIDA (TRANSICION_NO_DECLARADA) y no deja efectos', async () => {
    const id = await registrarOk(app, correoSintetico('susp-cerr-servicio'));
    await transicionPorServicio(app, id, 'SuspenderCuenta');
    const r = await cerrarPorServicio(id);
    expect(r).toEqual({ permitida: false, motivo: 'TRANSICION_NO_DECLARADA' });
    expect(await estadoDe(id)).toBe('SUSPENDIDA');
    expect(await eventoDe(id, 'CuentaCerrada')).toBeNull();
    expect(await prisma.registroDeSupresion.count({ where: { sujetoId: id } })).toBe(0);
  });

  it('TEST-RNF-DAT-001: la base rechaza SUSPENDIDA → CERRADA aunque se saltee el servicio', async () => {
    const id = await registrarOk(app, correoSintetico('susp-cerr-base'));
    await transicionPorServicio(app, id, 'SuspenderCuenta');
    await expect(updateDirecto(id, 'CERRADA')).rejects.toThrow(/TRANSICION_NO_DECLARADA SUSPENDIDA -> CERRADA/);
    expect(await estadoDe(id)).toBe('SUSPENDIDA');
  });

  it('TEST-RNF-DAT-001: por ACC-P1-03 tampoco — una cuenta SUSPENDIDA no tiene sesión que la cierre', async () => {
    const correo = correoSintetico('susp-cerr-api');
    const id = await registrarOk(app, correo);
    const token = await tokenDe(app, correo);
    await transicionPorServicio(app, id, 'SuspenderCuenta');
    const res = await conSesion(app, token).post('/api/v1/me/account-closure-requests').send(cuerpoDeCierre()).expect(401);
    expect(res.body.error.code).toBe('SESSION_REVOKED');
    expect(await estadoDe(id)).toBe('SUSPENDIDA');
  });
});

describe('TEST-RNF-DAT-001 — CERRADA es terminal', () => {
  it.each(['OPERATIVA', 'SUSPENDIDA'])('TEST-RNF-DAT-001: la base rechaza CERRADA → %s', async (destino) => {
    const id = await registrarOk(app, correoSintetico(`cerrada-${destino.toLowerCase()}`));
    expect((await cerrarPorServicio(id)).permitida).toBe(true);
    await expect(updateDirecto(id, destino)).rejects.toThrow(new RegExp(`TRANSICION_NO_DECLARADA CERRADA -> ${destino}`));
    expect(await estadoDe(id)).toBe('CERRADA');
  });

  it('TEST-RNF-DAT-001: el servicio rechaza RestablecerCuenta, SuspenderCuenta y CerrarCuenta sobre CERRADA', async () => {
    const id = await registrarOk(app, correoSintetico('cerrada-servicio'));
    await cerrarPorServicio(id);
    expect((await transicionPorServicio(app, id, 'RestablecerCuenta')).permitida).toBe(false);
    expect((await transicionPorServicio(app, id, 'SuspenderCuenta')).permitida).toBe(false);
    expect(await cerrarPorServicio(id)).toEqual({ permitida: false, motivo: 'TRANSICION_NO_DECLARADA' });
    expect(await prisma.eventoDeDominio.count({ where: { identidadId: id, tipo: 'CuentaCerrada' } })).toBe(1);
  });

  it('TEST-RNF-DAT-001: la base rechaza nacer SUSPENDIDA o CERRADA (estado inicial OPERATIVA, 06 §5.7.2)', async () => {
    for (const estado of ['SUSPENDIDA', 'CERRADA']) {
      await expect(
        prisma.$executeRawUnsafe(
          `INSERT INTO identidad (autoria_de_creacion_id, procedencia, estado_operativo_de_cuenta)
           VALUES (gen_random_uuid(), '{}'::jsonb, '${estado}')`,
        ),
      ).rejects.toThrow(/estado inicial debe ser OPERATIVA/);
    }
  });
});
