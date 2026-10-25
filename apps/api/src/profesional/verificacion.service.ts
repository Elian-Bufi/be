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
 * Quién hace un hecho de M-02 (WP-ADMINISTRACION, DL-155): el servicio interno de DL-036 o un administrador humano, con el
 * texto que se le comunica al profesional y la procedencia de su pedido. La base exige la coherencia (CHECK) y, para un
 * administrador, su rol vigente (trigger).
 */
export type ActorDeHecho =
  | { readonly tipo: 'SERVICIO_INTERNO' }
  | { readonly tipo: 'ADMINISTRADOR'; readonly administradorId: string; readonly mensaje: string | null; readonly procedencia: Procedencia };

const SERVICIO: ActorDeHecho = { tipo: 'SERVICIO_INTERNO' };

/** Lo que deja una transición: el estado de destino, el hecho que la registró y la versión que se revisó. */
export interface TransicionAplicada<E> {
  readonly destino: E;
  readonly eventoId: string;
  readonly versionPrevia: number | null;
}

/**
 * M-02 mínimo (06 §6; DEUDA_LEGAJO DL-036). Las transiciones de la verificación y de la habilitación por alcance, para el
 * servicio interno (la siembra y las pruebas) y, desde WP-ADMINISTRACION, para Administración (API-ADM-13).
 *
 * Mismo patrón que la suspensión de cuenta (DL-020):
 * - `FOR NO KEY UPDATE` (orden único de bloqueos: prisma/concurrencia.ts);
 * - la lista blanca del dominio;
 * - el hecho con estado previo y posterior, y su actor explícito;
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
    await this.registrarHecho(tx, 'PerfilProfesionalCreado', identidadId, null, null, null, 'perfil profesional mínimo (DL-036)', procedencia, momento, SERVICIO, null);
  }

  /** Aplica una transición de la verificación por alcance (06 §6.8.2). */
  async transicionarVerificacion(
    tx: Prisma.TransactionClient,
    identidadId: string,
    alcance: Alcance,
    transicion: TransicionDeVerificacion,
    fundamento: string,
    momento: Date,
    actor: ActorDeHecho = SERVICIO,
  ): Promise<TransicionAplicada<EstadoDeVerificacionProfesional>> {
    const [fila] = await tx.$queryRaw<{ estado: EstadoDeVerificacionProfesional; version: number }[]>`
      SELECT "estado"::text AS "estado", "version" FROM "verificacion_profesional"
       WHERE "identidad_id" = ${identidadId}::uuid AND "alcance" = ${alcance}::"Alcance" FOR NO KEY UPDATE`;
    const evaluacion = evaluarTransicionDeVerificacion(fila?.estado ?? null, transicion, fundamento);
    if (!evaluacion.permitida) throw errores.estadoNoPermite();
    const destino = evaluacion.transicion.destino;
    const procedencia = actor.tipo === 'ADMINISTRADOR' ? actor.procedencia : PROCEDENCIA_INTERNA(transicion);
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
    const eventoId = await this.registrarHecho(tx, evaluacion.transicion.evento as TipoDeEventoDeVerificacion, identidadId, alcance, fila?.estado ?? null, destino, fundamento, procedencia, momento, actor, fila?.version ?? null);
    return { destino, eventoId, versionPrevia: fila?.version ?? null };
  }

  /** Concede o retira la habilitación por alcance (REG-06-79; 06 §8.6.6). */
  async transicionarHabilitacion(
    tx: Prisma.TransactionClient,
    identidadId: string,
    alcance: Alcance,
    transicion: TransicionDeHabilitacion,
    fundamento: string,
    momento: Date,
    actor: ActorDeHecho = SERVICIO,
  ): Promise<TransicionAplicada<EstadoDeHabilitacion>> {
    const [fila] = await tx.$queryRaw<{ estado: EstadoDeHabilitacion; version: number }[]>`
      SELECT "estado"::text AS "estado", "version" FROM "habilitacion"
       WHERE "identidad_id" = ${identidadId}::uuid AND "alcance" = ${alcance}::"Alcance" FOR NO KEY UPDATE`;
    const evaluacion = evaluarTransicionDeHabilitacion(fila?.estado ?? null, transicion, fundamento);
    if (!evaluacion.permitida) throw errores.estadoNoPermite();
    const procedencia = actor.tipo === 'ADMINISTRADOR' ? actor.procedencia : PROCEDENCIA_INTERNA(transicion);
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
    const eventoId = await this.registrarHecho(tx, evaluacion.evento as TipoDeEventoDeVerificacion, identidadId, alcance, fila?.estado ?? null, evaluacion.destino, fundamento, procedencia, momento, actor, fila?.version ?? null);
    return { destino: evaluacion.destino, eventoId, versionPrevia: fila?.version ?? null };
  }

  /**
   * Deja a una identidad lista para operar un alcance: perfil profesional, verificación VERIFICADO y habilitación
   * CONCEDIDA; con `estadoInicial: 'PENDIENTE'`, la presenta y la deja pendiente de revisión. Idempotente: solo aplica las
   * transiciones que faltan. Lo usan la siembra de demostración y las pruebas.
   *
   * WP-ADMINISTRACION (D-7): **nunca pisa una decisión humana.**
   * - Si el área tiene un hecho de un administrador, no se toca nada de esa área: ni la verificación (no verifica un
   *   pendiente observado) ni la habilitación (no vuelve a conceder una retirada). No alcanza con proteger SUSPENDIDO.
   * - Las filas del área se bloquean primero (verificación y habilitación, en el orden único): una decisión simultánea
   *   queda antes o después de esta preparación, nunca en el medio.
   * - Una identidad con el rol administrativo vigente nunca se prepara como profesional (identidad separada).
   * Devuelve qué hizo, para que la siembra lo cuente sin nombrar a nadie.
   */
  async prepararProfesional(
    tx: Prisma.TransactionClient,
    identidadId: string,
    datos: { alcance: Alcance; tipo: TipoDePerfilProfesional; nombreVisible: string; estadoInicial?: 'VERIFICADO' | 'PENDIENTE' },
    momento: Date,
  ): Promise<'PREPARADA' | 'CON_DECISION_ADMINISTRATIVA' | 'IDENTIDAD_ADMINISTRATIVA'> {
    const [rol] = await tx.$queryRaw<{ administrativa: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM "rol_administrativo" WHERE "identidad_id" = ${identidadId}::uuid AND "estado" = 'VIGENTE') AS "administrativa"`;
    if (rol?.administrativa) return 'IDENTIDAD_ADMINISTRATIVA';
    await tx.$queryRaw`SELECT 1 FROM "verificacion_profesional" WHERE "identidad_id" = ${identidadId}::uuid AND "alcance" = ${datos.alcance}::"Alcance" FOR NO KEY UPDATE`;
    await tx.$queryRaw`SELECT 1 FROM "habilitacion" WHERE "identidad_id" = ${identidadId}::uuid AND "alcance" = ${datos.alcance}::"Alcance" FOR NO KEY UPDATE`;
    const humana = await tx.eventoDeVerificacion.findFirst({ where: { identidadId, alcance: datos.alcance, tipoDeActor: 'ADMINISTRADOR' }, select: { id: true } });
    if (humana) return 'CON_DECISION_ADMINISTRATIVA';

    await this.asegurarPerfilProfesional(tx, identidadId, datos, momento);
    const pendiente = datos.estadoInicial === 'PENDIENTE';
    const verificacion = await tx.verificacionProfesional.findUnique({ where: { identidadId_alcance: { identidadId, alcance: datos.alcance } } });
    if (!verificacion) {
      await this.transicionarVerificacion(tx, identidadId, datos.alcance, 'PresentarAlcance', 'presentación sintética de demostración', momento);
      if (!pendiente) await this.transicionarVerificacion(tx, identidadId, datos.alcance, 'VerificarAlcance', 'resolución sintética de demostración (DL-036)', momento);
    } else if (verificacion.estado === 'PENDIENTE' && !pendiente) {
      await this.transicionarVerificacion(tx, identidadId, datos.alcance, 'VerificarAlcance', 'resolución sintética de demostración (DL-036)', momento);
    }
    // Un área pendiente de revisión no recibe la habilitación por la siembra: la decide Administración.
    if (pendiente) return 'PREPARADA';
    const habilitacion = await tx.habilitacion.findUnique({ where: { identidadId_alcance: { identidadId, alcance: datos.alcance } } });
    if (!habilitacion || habilitacion.estado === 'RETIRADA') {
      await this.transicionarHabilitacion(tx, identidadId, datos.alcance, 'ConcederHabilitacion', 'concesión sintética de demostración (DL-036)', momento);
    }
    return 'PREPARADA';
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
    actor: ActorDeHecho,
    versionPrevia: number | null,
  ): Promise<string> {
    const deActor =
      actor.tipo === 'ADMINISTRADOR'
        ? { tipoDeActor: 'ADMINISTRADOR' as const, administradorId: actor.administradorId, actorServicio: null, mensajeAlProfesional: actor.mensaje }
        : { tipoDeActor: 'SERVICIO_INTERNO' as const, actorServicio: ACTOR_DE_VERIFICACION };
    const hecho = await tx.eventoDeVerificacion.create({
      data: {
        tipo,
        identidadId,
        alcance,
        estadoPrevio,
        estadoPosterior,
        fundamento,
        ...deActor,
        versionPrevia,
        procedencia: procedencia as unknown as Prisma.InputJsonValue,
        momentoDeOcurrencia: momento,
      },
      select: { id: true },
    });
    return hecho.id;
  }
}
