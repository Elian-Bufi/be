import { Injectable } from '@nestjs/common';
import {
  EFECTO_DE_RESULTADO,
  capacidadEfectiva,
  clasificarActivacion,
  evaluarAdmision,
  evaluarTransicionDeProceso,
  type Alcance,
  type CapacidadEfectiva,
  type Procedencia,
  type ResultadoDeRevision,
} from '@be/domain';
import type { EstadoDeProceso, MotivoDeCierreDeProceso, Prisma, TipoDeAplicacion, TipoDeEventoDeProceso } from '@prisma/client';
import { ErrorDeApi, errores } from '../http/errores';
import { CodigoDeError } from '@be/domain';

type Tx = Prisma.TransactionClient;

export interface ProcesoBloqueado {
  readonly id: string;
  readonly estado: EstadoDeProceso;
  readonly version: number;
  readonly profesionalId: string;
  readonly asesoradoId: string;
  /** De qué dominio es: decide en qué columna se enlaza la revisión que lo continúa o lo cierra. */
  readonly alcance: Alcance;
}

/**
 * REG-06-145: la próxima revisión la fija una versión de plan o una revisión válida. Las de nutrición conservan su
 * forma; las de entrenamiento se nombran distinto para que ningún llamador pueda pasar un id al dominio equivocado.
 */
export type FuenteDeProximaRevisionDeProceso =
  | { versionDePlanId: string }
  | { revisionId: string }
  | { versionDePlanDeEntrenamientoId: string }
  | { revisionDeEntrenamientoId: string };

export interface Apertura {
  readonly procesoId: string;
  /** `true` si la activación abrió un Proceso NUEVO (pasó por capacidad); `false` si fue continuidad. */
  readonly abierto: boolean;
}

/**
 * B-04 (Proceso operativo, 06 §8) y B-05 (capacidad, 06 §9) en la API. Transversal: lo usa la activación de
 * nutrición y, desde WP-06, la de entrenamiento.
 *
 * Orden de bloqueos (prisma/concurrencia.ts): después de lo que bloquea el PDP (identidad → … → A3) vienen, en este
 * orden, el plan, la versión de plan, el cerrojo de capacidad del profesional y el Proceso. La activación y la
 * aplicación de una revisión los toman en ese orden, así no se cruzan.
 */
/**
 * El Proceso es transversal (B-04), pero la versión que lo abre vive en la tabla de su dominio. Antropometría no abre
 * Proceso (06 §8.9): pedirlo es un error de programación, no una situación del producto, y se dice así.
 */
function columnaDeApertura(
  alcance: Alcance,
  versionId: string,
): { versionDeAperturaId: string } | { versionDeAperturaEntrenamientoId: string } {
  if (alcance === 'NUTRICION') return { versionDeAperturaId: versionId };
  if (alcance === 'ENTRENAMIENTO') return { versionDeAperturaEntrenamientoId: versionId };
  throw new Error(`BE: el alcance ${alcance} no abre Proceso operativo (06 §8.9)`);
}

@Injectable()
export class ProcesoService {
  /**
   * REG-06-64, 65, 78 y REG-06-104 paso 3: si hay un Proceso ABIERTO para la terna, la activación es continuidad y no
   * consulta capacidad (REG-06-92). Si no, es NUEVO: se evalúa la admisión de B-05 y se ejecuta AbrirProceso, con su
   * evento, en la misma transacción que la activación. Un rechazo por capacidad no crea nada (REG-06-93).
   */
  async abrirOContinuar(
    tx: Tx,
    p: { profesionalId: string; asesoradoId: string; alcance: Alcance; versionDeAperturaId: string; actorId: string; procedencia: Procedencia; momento: Date },
  ): Promise<Apertura> {
    // Cerrojo de capacidad por profesional: dos aperturas simultáneas no pueden pasar las dos con un solo lugar libre.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`capacidad|${p.profesionalId}`}, 0))`;
    const abierto = await this.procesoAbierto(tx, p.profesionalId, p.asesoradoId, p.alcance);
    const clasificacion = clasificarActivacion(abierto?.id ?? null);
    if (clasificacion.tipo === 'CONTINUIDAD') return { procesoId: clasificacion.procesoId, abierto: false };

    const capacidad = await this.capacidadVigente(tx, p.profesionalId);
    const ocupan = await this.asesoradosQueOcupan(tx, p.profesionalId);
    const admision = evaluarAdmision({ capacidad, asesoradosQueOcupan: ocupan, asesoradoId: p.asesoradoId });
    const evaluacion = evaluarTransicionDeProceso(null, {
      transicion: 'AbrirProceso',
      actor: 'PROFESIONAL',
      activacionConfirmada: true,
      capacidadAdmite: admision.admite,
    });
    if (!evaluacion.permitida) {
      if (evaluacion.motivo === 'CAPACIDAD_NO_ADMITE') {
        throw new ErrorDeApi(422, CodigoDeError.CAPACITY_NOT_AVAILABLE, 'No hay capacidad disponible para iniciar un nuevo seguimiento. Los seguimientos vigentes no se modifican.');
      }
      throw errores.estadoNoPermite();
    }
    const proceso = await tx.procesoOperativo.create({
      data: {
        profesionalId: p.profesionalId,
        asesoradoId: p.asesoradoId,
        alcance: p.alcance,
        // La apertura va a la columna de su dominio: cada una tiene su clave foránea real, y el CHECK
        // `proceso_operativo_apertura_segun_alcance` exige exactamente la que corresponde (migración 20260921110000).
        ...columnaDeApertura(p.alcance, p.versionDeAperturaId),
        procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
        momentoDeOcurrencia: p.momento,
      },
    });
    await this.registrarEvento(tx, {
      tipo: 'ProcesoOperativoAbierto',
      procesoId: proceso.id,
      estadoPrevio: null,
      estadoPosterior: 'ABIERTO',
      datos: { versionDeAperturaId: p.versionDeAperturaId, ocupacionProyectada: admision.admite ? admision.ocupacionProyectada : null },
      actor: { identidadId: p.actorId },
      procedencia: p.procedencia,
      momento: p.momento,
    });
    return { procesoId: proceso.id, abierto: true };
  }

  /** Proceso ABIERTO de la terna, bloqueado para escribir. */
  async procesoAbierto(tx: Tx, profesionalId: string, asesoradoId: string, alcance: Alcance): Promise<ProcesoBloqueado | null> {
    const [fila] = await tx.$queryRaw<ProcesoBloqueado[]>`
      SELECT "id"::text AS "id", "estado", "version", "profesional_id"::text AS "profesionalId", "asesorado_id"::text AS "asesoradoId", "alcance"
        FROM "proceso_operativo"
       WHERE "profesional_id" = ${profesionalId}::uuid AND "asesorado_id" = ${asesoradoId}::uuid AND "alcance" = ${alcance}::"Alcance" AND "estado" = 'ABIERTO'
         FOR NO KEY UPDATE`;
    return fila ?? null;
  }

  /** Un Proceso por id, bloqueado para escribir. */
  async bloquear(tx: Tx, procesoId: string): Promise<ProcesoBloqueado | null> {
    const [fila] = await tx.$queryRaw<ProcesoBloqueado[]>`
      SELECT "id"::text AS "id", "estado", "version", "profesional_id"::text AS "profesionalId", "asesorado_id"::text AS "asesoradoId", "alcance"
        FROM "proceso_operativo" WHERE "id" = ${procesoId}::uuid FOR NO KEY UPDATE`;
    return fila ?? null;
  }

  /**
   * UC-I06 sobre el Proceso (REG-06-73, 74, 75): FINALIZAR → CerrarPorRevision, cualquier otro resultado →
   * AplicarContinuidad. Emite ContinuidadOCierreAplicado (y ProcesoOperativoCerrado al cerrar). Devuelve el evento, que
   * la aplicación de la revisión enlaza. Se llama DESPUÉS de aplicar el efecto vertical: sin consecuencia aplicada no hay
   * evento (REG-06-77).
   */
  async aplicarResultado(
    tx: Tx,
    p: {
      proceso: ProcesoBloqueado;
      revisionId: string;
      resultado: ResultadoDeRevision;
      datos: Prisma.InputJsonValue;
      actorId: string;
      procedencia: Procedencia;
      momento: Date;
    },
  ): Promise<{ eventoId: string; tipo: TipoDeAplicacion; estadoPosterior: EstadoDeProceso }> {
    const efecto = EFECTO_DE_RESULTADO[p.resultado];
    const transicion = efecto.procesoDespues === 'CERRADO' ? 'CerrarPorRevision' : 'AplicarContinuidad';
    const evaluacion = evaluarTransicionDeProceso(p.proceso.estado, { transicion, actor: 'PROFESIONAL', revisionValida: true });
    if (!evaluacion.permitida) {
      throw new ErrorDeApi(422, CodigoDeError.CONTINUITY_ACTION_NOT_APPLICABLE, 'La continuidad no se puede aplicar en el estado actual del seguimiento.');
    }
    const cierra = efecto.procesoDespues === 'CERRADO';
    await tx.procesoOperativo.update({
      where: { id: p.proceso.id },
      data: {
        estado: efecto.procesoDespues,
        version: p.proceso.version + 1,
        ...(cierra ? { motivoDeCierre: 'REVISION_FINALIZAR' as const, momentoDeCierre: p.momento } : {}),
      },
    });
    const evento = await this.registrarEvento(tx, {
      tipo: 'ContinuidadOCierreAplicado',
      procesoId: p.proceso.id,
      tipoDeAplicacion: efecto.tipoDeEvento,
      // La revisión se enlaza en la columna de su dominio; cada una tiene su clave foránea (REG-06-75).
      ...(p.proceso.alcance === 'ENTRENAMIENTO' ? { revisionDeEntrenamientoId: p.revisionId } : { revisionId: p.revisionId }),
      estadoPrevio: p.proceso.estado,
      estadoPosterior: efecto.procesoDespues,
      datos: p.datos,
      actor: { identidadId: p.actorId },
      procedencia: p.procedencia,
      momento: p.momento,
    });
    if (cierra) {
      await this.registrarEvento(tx, {
        tipo: 'ProcesoOperativoCerrado',
        procesoId: p.proceso.id,
        revisionId: null,
        estadoPrevio: 'ABIERTO',
        estadoPosterior: 'CERRADO',
        datos: { motivo: 'REVISION_FINALIZAR' },
        actor: { identidadId: p.actorId },
        procedencia: p.procedencia,
        momento: p.momento,
      });
    }
    return { eventoId: evento.id, tipo: efecto.tipoDeEvento, estadoPosterior: efecto.procesoDespues };
  }

  /**
   * REG-06-70: cuando el Vínculo por alcance pasa a FINALIZADO, se cierran los Procesos abiertos de la misma terna.
   * REG-06-67: el cierre de cuenta cierra los de la identidad. En la transacción del vínculo o del cierre.
   */
  async cerrarPorFinalizacionDeVinculo(
    tx: Tx,
    p: { profesionalId: string; asesoradoId: string; alcance: Alcance; motivo: 'FINALIZACION_DE_VINCULO' | 'CIERRE_DE_CUENTA'; procedencia: Procedencia; momento: Date },
  ): Promise<number> {
    const abierto = await this.procesoAbierto(tx, p.profesionalId, p.asesoradoId, p.alcance);
    if (!abierto) return 0;
    const transicion = p.motivo === 'CIERRE_DE_CUENTA' ? 'CerrarPorCierreCuenta' : 'CerrarPorFinalizacionVinculo';
    const evaluacion = evaluarTransicionDeProceso(abierto.estado, { transicion, actor: 'SISTEMA' });
    if (!evaluacion.permitida) throw errores.estadoNoPermite();
    const motivo: MotivoDeCierreDeProceso = p.motivo;
    await tx.procesoOperativo.update({
      where: { id: abierto.id },
      data: { estado: 'CERRADO', version: abierto.version + 1, motivoDeCierre: motivo, momentoDeCierre: p.momento },
    });
    await this.registrarEvento(tx, {
      tipo: 'ProcesoOperativoCerrado',
      procesoId: abierto.id,
      revisionId: null,
      estadoPrevio: 'ABIERTO',
      estadoPosterior: 'CERRADO',
      datos: { motivo },
      actor: 'SISTEMA',
      procedencia: p.procedencia,
      momento: p.momento,
    });
    return 1;
  }

  /**
   * REG-06-145/146: fija una expectativa de revisión. Reprogramar agrega una nueva, sucesora de la vigente; la anterior
   * queda histórica.
   */
  async fijarProximaRevision(
    tx: Tx,
    p: { procesoId: string; fecha: string | null; fuente: FuenteDeProximaRevisionDeProceso; actorId: string; procedencia: Procedencia; momento: Date },
  ): Promise<void> {
    const vigente = await this.proximaRevisionVigente(tx, p.procesoId);
    const f = p.fuente;
    await tx.proximaRevision.create({
      data: {
        procesoId: p.procesoId,
        predecesoraId: vigente?.id ?? null,
        fechaObjetivo: p.fecha ? new Date(`${p.fecha}T00:00:00.000Z`) : null,
        fuente: 'versionDePlanId' in f || 'versionDePlanDeEntrenamientoId' in f ? 'VERSION_DE_PLAN' : 'REVISION',
        // Cada fuente en la columna de su dominio. El CHECK `proxima_revision_fuente_coherente` exige exactamente una.
        versionDePlanId: 'versionDePlanId' in f ? f.versionDePlanId : null,
        versionDePlanDeEntrenamientoId: 'versionDePlanDeEntrenamientoId' in f ? f.versionDePlanDeEntrenamientoId : null,
        revisionId: 'revisionId' in f ? f.revisionId : null,
        revisionDeEntrenamientoId: 'revisionDeEntrenamientoId' in f ? f.revisionDeEntrenamientoId : null,
        actorId: p.actorId,
        procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
        momentoDeOcurrencia: p.momento,
      },
    });
  }

  /** La expectativa vigente: la terminal de la cadena (REG-06-146), no la de fecha mayor. */
  async proximaRevisionVigente(cliente: Tx, procesoId: string): Promise<{ id: string; fechaObjetivo: Date | null; momentoDeRegistro: Date } | null> {
    const [fila] = await cliente.$queryRaw<{ id: string; fechaObjetivo: Date | null; momentoDeRegistro: Date }[]>`
      SELECT pr."id"::text AS "id", pr."fecha_objetivo" AS "fechaObjetivo", pr."momento_de_registro" AS "momentoDeRegistro"
        FROM "proxima_revision" pr
       WHERE pr."proceso_id" = ${procesoId}::uuid
         AND NOT EXISTS (SELECT 1 FROM "proxima_revision" s WHERE s."predecesora_id" = pr."id")`;
    return fila ?? null;
  }

  // ─── Capacidad (B-05) ──────────────────────────────────────────────────────────────────────

  /** Terminal de la cadena de capacidad; sin versión, SIN_LIMITE (REG-06-82). */
  async capacidadVigente(cliente: Tx, profesionalId: string): Promise<CapacidadEfectiva> {
    const [fila] = await cliente.$queryRaw<{ modo: 'LIMITADA' | 'SIN_LIMITE'; limite: number | null }[]>`
      SELECT c."modo"::text AS "modo", c."limite"
        FROM "capacidad_profesional" c
       WHERE c."identidad_id" = ${profesionalId}::uuid
         AND NOT EXISTS (SELECT 1 FROM "capacidad_profesional" s WHERE s."predecesora_id" = c."id")`;
    if (!fila) return capacidadEfectiva(null);
    return fila.modo === 'LIMITADA' ? { modo: 'LIMITADA', limite: fila.limite ?? 0 } : { modo: 'SIN_LIMITE' };
  }

  /**
   * REG-06-84 (06:3775-3780): asesorados únicos con al menos un Proceso ABIERTO con este profesional, Vínculo ACEPTADO
   * y Consentimiento VIGENTE en ese alcance, y cuenta no CERRADA. Cuentan una sola vez.
   */
  async asesoradosQueOcupan(cliente: Tx, profesionalId: string): Promise<string[]> {
    const filas = await cliente.$queryRaw<{ asesoradoId: string }[]>`
      SELECT DISTINCT p."asesorado_id"::text AS "asesoradoId"
        FROM "proceso_operativo" p
        JOIN "identidad" a ON a."id" = p."asesorado_id" AND a."estado_operativo_de_cuenta" <> 'CERRADA'
        JOIN "vinculo" vi ON vi."profesional_id" = p."profesional_id" AND vi."asesorado_id" = p."asesorado_id"
        JOIN "alcance_de_vinculo" av ON av."vinculo_id" = vi."id" AND av."alcance" = p."alcance" AND av."estado" = 'ACEPTADO'
        JOIN "consentimiento" c ON c."alcance_de_vinculo_id" = av."id" AND c."situacion" = 'VIGENTE'
       WHERE p."profesional_id" = ${profesionalId}::uuid AND p."estado" = 'ABIERTO'`;
    return filas.map((f) => f.asesoradoId);
  }

  /**
   * Configura la capacidad por servicio interno (DL-051): agrega una versión sucesora de la vigente. No reescribe
   * admisiones pasadas ni expulsa a nadie (REG-06-83, 94).
   */
  async configurarCapacidad(tx: Tx, p: { profesionalId: string; capacidad: CapacidadEfectiva; actorServicio: string; procedencia: Procedencia }): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`capacidad|${p.profesionalId}`}, 0))`;
    const [vigente] = await tx.$queryRaw<{ id: string; modo: string; limite: number | null }[]>`
      SELECT c."id"::text AS "id", c."modo"::text AS "modo", c."limite"
        FROM "capacidad_profesional" c
       WHERE c."identidad_id" = ${p.profesionalId}::uuid
         AND NOT EXISTS (SELECT 1 FROM "capacidad_profesional" s WHERE s."predecesora_id" = c."id")`;
    const limite = p.capacidad.modo === 'LIMITADA' ? p.capacidad.limite : null;
    if (vigente && vigente.modo === p.capacidad.modo && vigente.limite === limite) return;
    await tx.capacidadProfesional.create({
      data: {
        identidadId: p.profesionalId,
        predecesoraId: vigente?.id ?? null,
        modo: p.capacidad.modo,
        limite,
        actorServicio: p.actorServicio,
        procedencia: p.procedencia as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async registrarEvento(
    tx: Tx,
    e: {
      tipo: TipoDeEventoDeProceso;
      procesoId: string;
      tipoDeAplicacion?: TipoDeAplicacion;
      revisionId?: string | null;
      revisionDeEntrenamientoId?: string | null;
      estadoPrevio: EstadoDeProceso | null;
      estadoPosterior: EstadoDeProceso;
      datos: Prisma.InputJsonValue;
      actor: { identidadId: string } | 'SISTEMA';
      procedencia: Procedencia;
      momento: Date;
    },
  ): Promise<{ id: string }> {
    return tx.eventoDeProceso.create({
      data: {
        tipo: e.tipo,
        procesoId: e.procesoId,
        tipoDeAplicacion: e.tipoDeAplicacion ?? null,
        revisionId: e.revisionId ?? null,
        revisionDeEntrenamientoId: e.revisionDeEntrenamientoId ?? null,
        estadoPrevio: e.estadoPrevio,
        estadoPosterior: e.estadoPosterior,
        datos: e.datos,
        actorId: e.actor === 'SISTEMA' ? null : e.actor.identidadId,
        actorServicio: e.actor === 'SISTEMA' ? 'SISTEMA' : null,
        procedencia: e.procedencia as unknown as Prisma.InputJsonValue,
        momentoDeOcurrencia: e.momento,
      },
      select: { id: true },
    });
  }
}
