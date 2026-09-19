import { Injectable } from '@nestjs/common';
import {
  evaluarTransicionDeHabilitacion,
  evaluarTransicionDeVerificacion,
  type Alcance,
  type EstadoDeHabilitacion,
  type EstadoDeVerificacionProfesional,
  type Procedencia,
  type TipoDePerfilProfesional,
  type TransicionDeHabilitacion,
  type TransicionDeVerificacion,
} from '@be/domain';
import type { Prisma, TipoDeEventoDeVerificacion } from '@prisma/client';
import { errores } from '../http/errores';

/** El 06 dice «administrador» (06 §6.8.2); sin caso de uso administrativo, actúa este servicio interno (DL-036). */
export const ACTOR_DE_VERIFICACION = 'SERVICIO_INTERNO_DE_VERIFICACION';

const PROCEDENCIA_INTERNA = (motivo: string): Procedencia => ({
  fuente: 'PROPIA',
  casoDeUso: 'DL-036',
  operacion: motivo,
  superficie: null,
  requestId: null,
});

/**
 * M-02 mínimo (06 §6; DEUDA_LEGAJO DL-036). Servicio interno, sin endpoint: el PDP necesita verificación y habilitación
 * por alcance para tener qué evaluar, pero la resolución administrativa (API-PRO-09 a 13) exige administrador con MFA y
 * queda fuera de WP-03.
 *
 * Mismo patrón que la suspensión de cuenta (DL-020):
 * - `FOR UPDATE`;
 * - la lista blanca del dominio;
 * - el hecho con estado previo y posterior;
 * - la base rechaza cualquier transición no declarada (triggers).
 */
@Injectable()
export class VerificacionService {
  /** Perfil profesional 0..1 (06:2766). Inmutable en WP-03; si existe, no se toca. */
  async asegurarPerfilProfesional(
    tx: Prisma.TransactionClient,
    identidadId: string,
    datos: { tipo: TipoDePerfilProfesional; nombreVisible: string },
    momento: Date,
  ): Promise<void> {
    const existente = await tx.perfilProfesional.findUnique({ where: { identidadId }, select: { id: true } });
    if (existente) return;
    const procedencia = PROCEDENCIA_INTERNA('asegurarPerfilProfesional');
    await tx.perfilProfesional.create({
      data: { identidadId, tipo: datos.tipo, nombreVisible: datos.nombreVisible, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeOcurrencia: momento },
    });
    await this.registrarHecho(tx, 'PerfilProfesionalCreado', identidadId, null, null, null, 'perfil profesional mínimo (DL-036)', procedencia, momento);
  }

  /** Aplica una transición de la verificación por alcance (06 §6.8.2). */
  async transicionarVerificacion(
    tx: Prisma.TransactionClient,
    identidadId: string,
    alcance: Alcance,
    transicion: TransicionDeVerificacion,
    fundamento: string,
    momento: Date,
  ): Promise<EstadoDeVerificacionProfesional> {
    const [fila] = await tx.$queryRaw<{ estado: EstadoDeVerificacionProfesional; version: number }[]>`
      SELECT "estado"::text AS "estado", "version" FROM "verificacion_profesional"
       WHERE "identidad_id" = ${identidadId}::uuid AND "alcance" = ${alcance}::"Alcance" FOR UPDATE`;
    const evaluacion = evaluarTransicionDeVerificacion(fila?.estado ?? null, transicion, fundamento);
    if (!evaluacion.permitida) throw errores.estadoNoPermite();
    const destino = evaluacion.transicion.destino;
    const procedencia = PROCEDENCIA_INTERNA(transicion);
    if (!fila) {
      await tx.verificacionProfesional.create({
        data: { identidadId, alcance, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeOcurrencia: momento },
      });
    } else {
      await tx.verificacionProfesional.update({
        where: { identidadId_alcance: { identidadId, alcance } },
        data: { estado: destino, version: fila.version + 1, momentoDeUltimaTransicion: momento },
      });
    }
    await this.registrarHecho(tx, evaluacion.transicion.evento as TipoDeEventoDeVerificacion, identidadId, alcance, fila?.estado ?? null, destino, fundamento, procedencia, momento);
    return destino;
  }

  /** Concede o retira la habilitación por alcance (REG-06-79; 06 §8.6.6). */
  async transicionarHabilitacion(
    tx: Prisma.TransactionClient,
    identidadId: string,
    alcance: Alcance,
    transicion: TransicionDeHabilitacion,
    fundamento: string,
    momento: Date,
  ): Promise<EstadoDeHabilitacion> {
    const [fila] = await tx.$queryRaw<{ estado: EstadoDeHabilitacion; version: number }[]>`
      SELECT "estado"::text AS "estado", "version" FROM "habilitacion"
       WHERE "identidad_id" = ${identidadId}::uuid AND "alcance" = ${alcance}::"Alcance" FOR UPDATE`;
    const evaluacion = evaluarTransicionDeHabilitacion(fila?.estado ?? null, transicion, fundamento);
    if (!evaluacion.permitida) throw errores.estadoNoPermite();
    const procedencia = PROCEDENCIA_INTERNA(transicion);
    if (!fila) {
      await tx.habilitacion.create({
        data: { identidadId, alcance, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeOcurrencia: momento },
      });
    } else {
      await tx.habilitacion.update({
        where: { identidadId_alcance: { identidadId, alcance } },
        data: { estado: evaluacion.destino, version: fila.version + 1, momentoDeUltimaTransicion: momento },
      });
    }
    await this.registrarHecho(tx, evaluacion.evento as TipoDeEventoDeVerificacion, identidadId, alcance, fila?.estado ?? null, evaluacion.destino, fundamento, procedencia, momento);
    return evaluacion.destino;
  }

  /**
   * Deja a una identidad lista para operar un alcance: perfil profesional, verificación VERIFICADO y habilitación
   * CONCEDIDA. Idempotente: solo aplica las transiciones que faltan. Lo usan la siembra de demostración y las pruebas.
   */
  async prepararProfesional(
    tx: Prisma.TransactionClient,
    identidadId: string,
    datos: { alcance: Alcance; tipo: TipoDePerfilProfesional; nombreVisible: string },
    momento: Date,
  ): Promise<void> {
    await this.asegurarPerfilProfesional(tx, identidadId, datos, momento);
    const verificacion = await tx.verificacionProfesional.findUnique({ where: { identidadId_alcance: { identidadId, alcance: datos.alcance } } });
    if (!verificacion) {
      await this.transicionarVerificacion(tx, identidadId, datos.alcance, 'PresentarAlcance', 'presentación sintética de demostración', momento);
      await this.transicionarVerificacion(tx, identidadId, datos.alcance, 'VerificarAlcance', 'resolución sintética de demostración (DL-036)', momento);
    } else if (verificacion.estado === 'PENDIENTE') {
      await this.transicionarVerificacion(tx, identidadId, datos.alcance, 'VerificarAlcance', 'resolución sintética de demostración (DL-036)', momento);
    }
    const habilitacion = await tx.habilitacion.findUnique({ where: { identidadId_alcance: { identidadId, alcance: datos.alcance } } });
    if (!habilitacion || habilitacion.estado === 'RETIRADA') {
      await this.transicionarHabilitacion(tx, identidadId, datos.alcance, 'ConcederHabilitacion', 'concesión sintética de demostración (DL-036)', momento);
    }
  }

  private async registrarHecho(
    tx: Prisma.TransactionClient,
    tipo: TipoDeEventoDeVerificacion,
    identidadId: string,
    alcance: Alcance | null,
    estadoPrevio: string | null,
    estadoPosterior: string | null,
    fundamento: string,
    procedencia: Procedencia,
    momento: Date,
  ): Promise<void> {
    await tx.eventoDeVerificacion.create({
      data: {
        tipo,
        identidadId,
        alcance,
        estadoPrevio,
        estadoPosterior,
        fundamento,
        actorServicio: ACTOR_DE_VERIFICACION,
        procedencia: procedencia as unknown as Prisma.InputJsonValue,
        momentoDeOcurrencia: momento,
      },
    });
  }
}
