import { Injectable } from '@nestjs/common';
import {
  evaluarTransicionDeCuenta,
  type ContextoDeTransicionDeCuenta,
  type EstadoOperativoDeCuenta,
  type EvaluacionDeTransicionDeCuenta,
  type MotivoDeRevocacionDeSesion,
  type Procedencia,
} from '@be/domain';
import type { Prisma, TipoDeEventoDeDominio } from '@prisma/client';
import { errores } from '../http/errores';
import { revocarSesiones } from '../sesion/sesion.service';

export type ActorDeTransicion = { readonly identidadId: string } | { readonly servicio: 'SERVICIO_INTERNO' };

const MOTIVO_DE_REVOCACION: Partial<Record<ContextoDeTransicionDeCuenta['transicion'], MotivoDeRevocacionDeSesion>> = {
  SuspenderCuenta: 'SUSPENSION_DE_CUENTA',
  CerrarCuenta: 'CIERRE_DE_CUENTA',
};

/**
 * T-06-02 — aplica la máquina de estado de cuenta (06 §5.7). Único camino para cambiar el estado:
 * 1. bloquea la fila (FOR UPDATE) y lee el estado actual;
 * 2. `evaluarTransicionDeCuenta` (@be/domain) decide lista blanca + guardas;
 * 3. aplica el destino y los efectos declarados, y emite el evento con estado anterior y resultante (06 §5.7.5).
 * La base rechaza además toda transición no declarada (trigger `identidad_guardar`).
 * Suspender/Restablecer no tienen endpoint: solo servicio interno (DEUDA_LEGAJO DL-020).
 */
@Injectable()
export class EstadoDeCuentaService {
  async transicionar(
    tx: Prisma.TransactionClient,
    identidadId: string,
    contexto: ContextoDeTransicionDeCuenta,
    actor: ActorDeTransicion,
    procedencia: Procedencia,
    momentoDeOcurrencia: Date,
  ): Promise<EvaluacionDeTransicionDeCuenta> {
    const [fila] = await tx.$queryRaw<{ estado: EstadoOperativoDeCuenta }[]>`
      SELECT "estado_operativo_de_cuenta" AS "estado" FROM "identidad" WHERE "id" = ${identidadId}::uuid FOR UPDATE`;
    if (!fila) throw errores.recursoNoEncontrado();

    const evaluacion = evaluarTransicionDeCuenta(fila.estado, contexto);
    if (!evaluacion.permitida) return evaluacion;
    const { transicion, efectos } = evaluacion;

    await tx.identidad.update({ where: { id: identidadId }, data: { estadoOperativoDeCuenta: transicion.destino } });

    const motivo = MOTIVO_DE_REVOCACION[contexto.transicion];
    if (efectos.revocarSesiones && motivo) await revocarSesiones(tx, identidadId, motivo, momentoDeOcurrencia);

    if (efectos.suprimirCredencialLocal) {
      const credenciales = await tx.credencialLocal.findMany({
        where: { metodoDeAcceso: { identidadId } },
        select: { metodoDeAccesoId: true },
      });
      if (credenciales.length > 0) {
        // 08 §18: la supresión se asienta ANTES en el registro de supresiones (el trigger lo exige).
        await tx.registroDeSupresion.create({
          data: {
            categoria: 'CREDENCIAL_LOCAL',
            sujetoId: identidadId,
            fundamento: '08 R-02: supresión del hash de password al cierre',
            ejecutor: transicion.transicion,
            momentoDeOcurrencia,
          },
        });
        await tx.credencialLocal.deleteMany({ where: { metodoDeAccesoId: { in: credenciales.map((c) => c.metodoDeAccesoId) } } });
      }
    }

    const actorDeEvento = 'identidadId' in actor ? { actorId: actor.identidadId, autoriaId: actor.identidadId } : { actorServicio: actor.servicio };
    for (const tipo of efectos.actosARevocar) {
      const vigentes = await tx.actoRegistrable.findMany({ where: { identidadId, tipo, estado: 'VIGENTE' }, select: { id: true } });
      for (const acto of vigentes) {
        await tx.actoRegistrable.update({ where: { id: acto.id }, data: { estado: 'REVOCADO', momentoDeRevocacion: momentoDeOcurrencia } });
        await tx.eventoDeDominio.create({
          data: {
            tipo: 'ActoRevocado',
            identidadId,
            ...actorDeEvento,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia,
            datos: { actoId: acto.id, tipo, fundamento: '08 §12.4: TERMINOS revocable por cierre de cuenta' },
          },
        });
      }
    }

    await tx.eventoDeDominio.create({
      data: {
        tipo: transicion.evento as TipoDeEventoDeDominio,
        identidadId,
        ...actorDeEvento,
        procedencia: procedencia as unknown as Prisma.InputJsonValue,
        estadoAnterior: transicion.origen,
        estadoResultante: transicion.destino,
        momentoDeOcurrencia,
        datos: datosDeTransicion(contexto),
      },
    });
    return evaluacion;
  }
}

function datosDeTransicion(contexto: ContextoDeTransicionDeCuenta): Prisma.InputJsonValue {
  switch (contexto.transicion) {
    case 'SuspenderCuenta':
      return { fundamento: contexto.fundamento };
    case 'RestablecerCuenta':
      return { resolucion: contexto.resolucion };
    case 'CerrarCuenta':
      return { versionDeConsecuencias: contexto.versionDeConsecuenciasPresentada };
  }
}
