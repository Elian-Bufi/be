import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  ALCANCES,
  FINALIDAD_DE_ALCANCE,
  evaluarAutorizacion,
  type Alcance,
  type DecisionDeAutorizacion,
  type EstadoDeAlcanceDeVinculo,
  type EstadoDeHabilitacion,
  type EstadoDeVerificacionProfesional,
  type EstadoOperativoDeCuenta,
  type Finalidad,
  type HechosDeAutorizacion,
  type SituacionDeConsentimiento,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import { conReintento } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';

type Cliente = Prisma.TransactionClient | PrismaService;

/** Lo que el PDP necesita para decidir de nuevo: la operación, el actor, el par y el recurso. Nada de la respuesta. */
export interface SolicitudDeDecision {
  readonly operacion: string;
  readonly actorDeLaDecision: string;
  readonly profesionalId: string;
  readonly titularId: string | null;
  readonly alcance: Alcance;
  readonly recurso: { readonly tipo: string; readonly id: string } | null;
}

/** Resultado de una evaluación por alcance: la decisión pura más lo que la resolvió. */
export interface DecisionPorAlcance {
  readonly alcance: Alcance;
  readonly finalidad: Finalidad;
  readonly decision: DecisionDeAutorizacion;
  /** Hechos leídos: la respuesta se arma solo con esto (nada se vuelve a leer después de decidir). */
  readonly hechos: HechosDeAutorizacion;
}

export interface DecisionesRegistradas {
  /** Titular que el PDP pudo resolver; `null` si no existe o el identificador no es válido. No se revela. */
  readonly titularId: string | null;
  readonly porAlcance: readonly DecisionPorAlcance[];
  readonly algunaPermitida: boolean;
}

interface FilaDeHechos {
  alcance: Alcance;
  actor_existe: boolean;
  actor_estado: EstadoOperativoDeCuenta | null;
  actor_perfil: boolean;
  titular_id: string | null;
  titular_estado: EstadoOperativoDeCuenta | null;
  a3_vigente: boolean;
  verificacion: EstadoDeVerificacionProfesional | null;
  habilitacion: EstadoDeHabilitacion | null;
  alcance_de_vinculo_id: string | null;
  av_alcance: Alcance | null;
  av_finalidad: Finalidad | null;
  av_estado: EstadoDeAlcanceDeVinculo | null;
  consentimiento_id: string | null;
  c_finalidad: Finalidad | null;
  c_situacion: SituacionDeConsentimiento | null;
  version_vigente_id: string | null;
  /** Cabeza de la cadena, cualquiera sea su situación: enlaza una denegación con la revocación que la causó. */
  version_cabeza_id: string | null;
  /** Hora de la base al leer los hechos (statement_timestamp): el instante de la decisión. */
  momento: Date;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PDP — punto único de decisión de autorización contextual (T-06-19; 04 RF-021; 05 UC-I02; 08 §27).
 *
 * 1. Toma en modo compartido, en el orden único de bloqueos (prisma/concurrencia.ts), las filas cuyo cambio corta el
 *    acceso: las dos cuentas, la verificación y la habilitación del profesional, los componentes y consentimientos del
 *    vínculo y la A3 vigente del titular. Revocar, pausar, finalizar, cerrar o suspender toman esas mismas filas en modo
 *    exclusivo: cada decisión queda antes o después de cada corte, nunca en el medio (T-PDP-4).
 * 2. Lee, en una sola sentencia SQL, todos los hechos de las siete dimensiones para (actor, titular, alcance). Es una
 *    sola lectura consistente (UC-I02 E02) y sin caché (08 §27.3). La hora de la decisión es la de esa sentencia.
 * 3. Decide con `evaluarAutorizacion` de @be/domain, una función pura sin estado.
 * 4. Registra cada decisión (permitida o denegada) en `decision_de_acceso`, en la misma transacción (08 §29; 08:650).
 *    Si el registro falla, no hay acceso (UC-I02 E06). La denegada guarda también el componente, el consentimiento y la
 *    cabeza de su cadena, si existen: la primera denegación después de una revocación apunta a esa revocación.
 *
 * Ningún controlador ni servicio de dominio decide autorización por su cuenta: la invocan el guard `PdpGuard`, para
 * operaciones protegidas, y `evaluarSinRegistrar`, para el modo de acceso que muestran las listas (RF-023).
 */
/**
 * Denegación del PDP dentro de una transacción de escritura (WP-04). Sale como el mismo 404 que un recurso
 * inexistente (09:207, 09:226) y lleva la decisión denegada: la transacción se revierte entera, así que quien la
 * atrapa la registra aparte, con los mismos hechos y la misma hora (`registrarDenegacion`).
 */
export class DenegacionDelPdp extends ErrorDeApi {
  constructor(readonly decision: Prisma.DecisionDeAccesoCreateManyInput) {
    super(404, 'RESOURCE_NOT_FOUND', 'Recurso no encontrado.');
  }
}

const errorInterno = (): Error => new Error('PDP: la lectura de hechos no devolvió filas');

@Injectable()
export class PdpService {
  constructor(private readonly prisma: PrismaService) {}

  /** Las decisiones permitidas durante un efecto idempotente, para poder volver a tomarlas en un reintento. */
  private readonly captura = new AsyncLocalStorage<SolicitudDeDecision[]>();

  /**
   * Ejecuta `fn` y devuelve, además de su resultado, cada decisión que el PDP permitió mientras corría. La usa la
   * idempotencia: el registro guarda qué se decidió para poder decidirlo otra vez en el reintento (08:601).
   */
  async capturarDecisiones<T>(fn: () => Promise<T>): Promise<{ readonly resultado: T; readonly decisiones: readonly SolicitudDeDecision[] }> {
    const decisiones: SolicitudDeDecision[] = [];
    const resultado = await this.captura.run(decisiones, fn);
    return { resultado, decisiones };
  }

  /**
   * Un reintento con la misma Idempotency-Key no devuelve la respuesta guardada sin volver a decidir: si desde el
   * primer pedido se revocó el consentimiento o se finalizó el vínculo, la decisión de ahora deniega y el reintento
   * recibe el mismo 404 que cualquier otro pedido (09 v0.16.1:220-221 pone la idempotencia después de la
   * revelabilidad; 08:601 prohíbe reutilizar una decisión previa que no refleje una revocación reciente). Cada
   * re-decisión queda registrada, con el requestId del reintento.
   */
  async reautorizar(tx: Prisma.TransactionClient, decisiones: readonly SolicitudDeDecision[], ctx: ContextoDeSolicitud): Promise<void> {
    for (const d of decisiones) await this.decidirEnTransaccion(tx, d, ctx);
  }

  /**
   * Decide para cada alcance del catálogo y registra las decisiones. Las usa API-DSH-03, que muestra por alcance lo que
   * el profesional puede ver. La finalidad de la operación es la del alcance (DL-039).
   */
  async decidirPorAlcance(operacion: string, actorId: string, titularCrudo: string, ctx: ContextoDeSolicitud): Promise<DecisionesRegistradas> {
    const titularId = UUID.test(titularCrudo) ? titularCrudo.toLowerCase() : null;
    return conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        if (titularId) await this.bloquearLoQueCorta(tx, actorId, titularId);
        const filas = await this.leerFilas(tx, actorId, titularId);
        const porAlcance = filas.map((f) => {
          const hechos = aHechos(actorId, f);
          return { alcance: hechos.operacion.alcance, finalidad: hechos.operacion.finalidad, decision: evaluarAutorizacion(hechos), hechos, fila: f };
        });
        // «sujeto intentado» (08 §29): solo si existe; un identificador ajeno inventado no deja huella de existencia.
        const sujetoId = porAlcance[0]?.hechos.titular?.identidadId ?? null;
        await tx.decisionDeAcceso.createMany({
          data: porAlcance.map(({ alcance, finalidad, decision, hechos, fila }) => ({
            operacion,
            resultado: decision.permitida ? 'PERMITIDA' : 'DENEGADA',
            actorId,
            sujetoId,
            alcance,
            finalidad,
            dimensionesDesfavorables: [...decision.dimensionesDesfavorables],
            alcanceDeVinculoId: decision.permitida ? decision.alcanceDeVinculoId : (hechos.alcanceDeVinculo?.id ?? null),
            consentimientoId: decision.permitida ? decision.consentimientoId : (hechos.consentimiento?.id ?? null),
            versionDeConsentimientoId: decision.permitida ? decision.versionDeConsentimientoId : fila.version_cabeza_id,
            // 08:307: la decisión registra la versión de la matriz de pertinencia. Sin matriz todavía (DL-039).
            versionDeMatriz: null,
            superficie: ctx.superficie,
            requestId: ctx.requestId,
            momentoDeOcurrencia: fila.momento,
          })),
        });
        return {
          titularId: sujetoId,
          porAlcance: porAlcance.map(({ alcance, finalidad, decision, hechos }) => ({ alcance, finalidad, decision, hechos })),
          algunaPermitida: porAlcance.some((d) => d.decision.permitida),
        };
      }),
    );
  }

  /**
   * WP-04 — Decide UN alcance dentro de una transacción ajena: la de la escritura o lectura de datos de salud. Así la
   * decisión y el efecto quedan del mismo lado de cualquier corte. Los bloqueos compartidos se mantienen hasta el
   * commit, así que ningún corte (revocar, pausar, finalizar, cerrar) puede quedar entre la decisión y la escritura.
   *
   * - `actorDeLaDecision` es quien opera: el profesional en sus operaciones, o el asesorado titular en las propias.
   * - Los hechos son siempre los del par (profesional, titular). Para el titular, eso responde si su Proceso con ese
   *   profesional sigue vigente (REG-06-66) con su A3 vigente (08:406); UC-P12 E06: revocado el consentimiento,
   *   «UC-I02 deniega la operación futura».
   * - Permitida: registra la decisión en la misma transacción y la devuelve.
   * - Denegada: lanza `DenegacionDelPdp` (404). La transacción se revierte, y quien la atrapa registra la decisión.
   */
  async decidirEnTransaccion(
    tx: Prisma.TransactionClient,
    p: {
      readonly operacion: string;
      readonly actorDeLaDecision: string;
      readonly profesionalId: string;
      readonly titularId: string | null;
      readonly alcance: Alcance;
      /** Recurso concreto al que se accede (08:634). */
      readonly recurso: { readonly tipo: string; readonly id: string } | null;
    },
    ctx: ContextoDeSolicitud,
  ): Promise<DecisionPorAlcance & { readonly decision: Extract<DecisionDeAutorizacion, { permitida: true }> }> {
    const titularId = p.titularId && UUID.test(p.titularId) ? p.titularId.toLowerCase() : null;
    if (titularId) await this.bloquearLoQueCorta(tx, p.profesionalId, titularId);
    const [fila] = await this.leerFilas(tx, p.profesionalId, titularId, p.alcance);
    if (!fila) throw errorInterno();
    const hechos = aHechos(p.profesionalId, fila);
    const decision = evaluarAutorizacion(hechos);
    const registro: Prisma.DecisionDeAccesoCreateManyInput = {
      operacion: p.operacion,
      resultado: decision.permitida ? 'PERMITIDA' : 'DENEGADA',
      actorId: p.actorDeLaDecision,
      sujetoId: hechos.titular?.identidadId ?? null,
      alcance: p.alcance,
      finalidad: hechos.operacion.finalidad,
      dimensionesDesfavorables: [...decision.dimensionesDesfavorables],
      alcanceDeVinculoId: decision.permitida ? decision.alcanceDeVinculoId : (hechos.alcanceDeVinculo?.id ?? null),
      consentimientoId: decision.permitida ? decision.consentimientoId : (hechos.consentimiento?.id ?? null),
      versionDeConsentimientoId: decision.permitida ? decision.versionDeConsentimientoId : fila.version_cabeza_id,
      // 08:307: sin matriz de pertinencia (DL-039, simplificación declarada).
      versionDeMatriz: null,
      recursoTipo: p.recurso?.tipo ?? null,
      recursoId: p.recurso?.id ?? null,
      superficie: ctx.superficie,
      requestId: ctx.requestId,
      momentoDeOcurrencia: fila.momento,
    };
    if (!decision.permitida) throw new DenegacionDelPdp(registro);
    await tx.decisionDeAcceso.create({ data: registro });
    this.captura.getStore()?.push({ operacion: p.operacion, actorDeLaDecision: p.actorDeLaDecision, profesionalId: p.profesionalId, titularId: p.titularId, alcance: p.alcance, recurso: p.recurso });
    return { alcance: p.alcance, finalidad: hechos.operacion.finalidad, decision, hechos };
  }

  /**
   * Registra una decisión denegada fuera de la transacción revertida (ver `DenegacionDelPdp`). Si el registro falla, la
   * respuesta sigue siendo el 404: denegar no depende de poder auditar (UC-I02 E06 exige lo inverso).
   */
  async registrarDenegacion(e: DenegacionDelPdp): Promise<void> {
    try {
      await this.prisma.decisionDeAcceso.create({ data: e.decision });
    } catch {
      // El 404 se responde igual.
    }
  }

  /**
   * Registra la denegación de una operación sobre un recurso que no existe o no es de este actor. Queda como una
   * decisión DENEGADA con el titular nulo, igual que un identificador inventado en API-DSH-03: no deja huella de
   * existencia (08 §29).
   */
  async registrarRecursoNoRevelable(
    p: { readonly operacion: string; readonly actorId: string; readonly alcance: Alcance; readonly recurso: { readonly tipo: string; readonly id: string } | null },
    ctx: ContextoDeSolicitud,
  ): Promise<void> {
    await this.registrarDenegacion(
      new DenegacionDelPdp({
        operacion: p.operacion,
        resultado: 'DENEGADA',
        actorId: p.actorId,
        sujetoId: null,
        alcance: p.alcance,
        finalidad: FINALIDAD_DE_ALCANCE[p.alcance],
        dimensionesDesfavorables: ['ROL'],
        recursoTipo: p.recurso?.tipo ?? null,
        recursoId: p.recurso?.id ?? null,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: new Date(),
      }),
    );
  }

  /**
   * Bloqueo compartido de lo que puede cortar el acceso, en el orden único (prisma/concurrencia.ts). Varias lecturas no
   * se esperan entre sí; un corte en curso hace esperar a la decisión hasta que confirma, y una decisión en curso hace
   * esperar al corte. Las filas que todavía no existen (un otorgamiento nuevo) no cortan nada.
   */
  private async bloquearLoQueCorta(tx: Prisma.TransactionClient, actorId: string, titularId: string): Promise<void> {
    await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" IN (${actorId}::uuid, ${titularId}::uuid) ORDER BY "id" FOR SHARE`;
    await tx.$queryRaw`SELECT 1 FROM "verificacion_profesional" WHERE "identidad_id" = ${actorId}::uuid ORDER BY "id" FOR SHARE`;
    await tx.$queryRaw`SELECT 1 FROM "habilitacion" WHERE "identidad_id" = ${actorId}::uuid ORDER BY "id" FOR SHARE`;
    await tx.$queryRaw`
      SELECT 1 FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
       WHERE vi."profesional_id" = ${actorId}::uuid AND vi."asesorado_id" = ${titularId}::uuid AND av."estado" <> 'FINALIZADO'
       ORDER BY av."id" FOR SHARE OF av`;
    await tx.$queryRaw`
      SELECT 1 FROM "consentimiento" c
        JOIN "alcance_de_vinculo" av ON av."id" = c."alcance_de_vinculo_id"
        JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
       WHERE vi."profesional_id" = ${actorId}::uuid AND vi."asesorado_id" = ${titularId}::uuid AND av."estado" <> 'FINALIZADO'
       ORDER BY c."id" FOR SHARE OF c`;
    await tx.$queryRaw`
      SELECT 1 FROM "acto_registrable"
       WHERE "identidad_id" = ${titularId}::uuid AND "tipo" = 'DATOS_SALUD_BE' AND "estado" = 'VIGENTE' FOR SHARE`;
  }

  /**
   * Misma evaluación, sin registrar: el modo de acceso que ven el asesorado y el profesional en sus listas (09v8:1351-1369).
   * Es diagnóstico y no concede nada; que use la misma función garantiza que lo mostrado coincida con la autorización
   * efectiva (RF-023).
   */
  async evaluarSinRegistrar(cliente: Cliente, profesionalId: string, asesoradoId: string, alcance: Alcance): Promise<DecisionDeAutorizacion> {
    const hechos = await this.leerHechos(cliente, profesionalId, asesoradoId, alcance);
    return evaluarAutorizacion(hechos[0]);
  }

  /**
   * Una sola sentencia para los tres alcances (o uno): los hechos de las siete dimensiones más el A3 del titular.
   * Si el titular no existe, sus columnas vienen nulas y la evaluación deniega igual (UC-I02 E05).
   */
  async leerHechos(cliente: Cliente, actorId: string, titularId: string | null, soloAlcance?: Alcance): Promise<HechosDeAutorizacion[]> {
    return (await this.leerFilas(cliente, actorId, titularId, soloAlcance)).map((f) => aHechos(actorId, f));
  }

  private async leerFilas(cliente: Cliente, actorId: string, titularId: string | null, soloAlcance?: Alcance): Promise<FilaDeHechos[]> {
    const alcances = soloAlcance ? [soloAlcance] : [...ALCANCES];
    return cliente.$queryRaw<FilaDeHechos[]>`
      SELECT al.alcance::text AS "alcance",
             (a."id" IS NOT NULL) AS "actor_existe",
             a."estado_operativo_de_cuenta"::text AS "actor_estado",
             EXISTS (SELECT 1 FROM "perfil_profesional" pp WHERE pp."identidad_id" = a."id") AS "actor_perfil",
             t."id"::text AS "titular_id",
             t."estado_operativo_de_cuenta"::text AS "titular_estado",
             EXISTS (SELECT 1 FROM "acto_registrable" ar
                      WHERE ar."identidad_id" = t."id" AND ar."tipo" = 'DATOS_SALUD_BE' AND ar."estado" = 'VIGENTE') AS "a3_vigente",
             vp."estado"::text AS "verificacion",
             h."estado"::text AS "habilitacion",
             av."id"::text AS "alcance_de_vinculo_id",
             av."alcance"::text AS "av_alcance",
             av."finalidad"::text AS "av_finalidad",
             av."estado"::text AS "av_estado",
             c."id"::text AS "consentimiento_id",
             c."finalidad"::text AS "c_finalidad",
             c."situacion"::text AS "c_situacion",
             (SELECT v."id"::text FROM "version_de_consentimiento" v
               WHERE v."consentimiento_id" = c."id" AND v."situacion_resultante" = 'VIGENTE'
                 AND NOT EXISTS (SELECT 1 FROM "version_de_consentimiento" s WHERE s."predecesora_id" = v."id")) AS "version_vigente_id",
             (SELECT v."id"::text FROM "version_de_consentimiento" v
               WHERE v."consentimiento_id" = c."id"
                 AND NOT EXISTS (SELECT 1 FROM "version_de_consentimiento" s WHERE s."predecesora_id" = v."id")) AS "version_cabeza_id",
             statement_timestamp() AS "momento"
        FROM unnest(${alcances}::"Alcance"[]) AS al(alcance)
        LEFT JOIN "identidad" a ON a."id" = ${actorId}::uuid
        LEFT JOIN "identidad" t ON t."id" = ${titularId}::uuid
        LEFT JOIN "verificacion_profesional" vp ON vp."identidad_id" = a."id" AND vp."alcance" = al.alcance
        LEFT JOIN "habilitacion" h ON h."identidad_id" = a."id" AND h."alcance" = al.alcance
        LEFT JOIN "vinculo" vi ON vi."profesional_id" = a."id" AND vi."asesorado_id" = t."id"
        LEFT JOIN "alcance_de_vinculo" av ON av."vinculo_id" = vi."id" AND av."alcance" = al.alcance AND av."estado" <> 'FINALIZADO'
        LEFT JOIN "consentimiento" c ON c."alcance_de_vinculo_id" = av."id" AND c."finalidad" = av."finalidad"
       ORDER BY array_position(${alcances}::"Alcance"[], al.alcance)`;
  }
}

/** Fila de hechos → hechos del dominio (la evaluación es la de @be/domain, sin nada que dependa de la base). */
function aHechos(actorId: string, f: FilaDeHechos): HechosDeAutorizacion {
  return {
    operacion: { alcance: f.alcance, finalidad: FINALIDAD_DE_ALCANCE[f.alcance] },
    actor: {
      identidadId: actorId,
      cuentaOperativa: f.actor_existe && f.actor_estado === 'OPERATIVA',
      tienePerfilProfesional: f.actor_perfil,
    },
    titular: f.titular_id
      ? { identidadId: f.titular_id, cuentaOperativa: f.titular_estado === 'OPERATIVA', a3Vigente: f.a3_vigente }
      : null,
    verificacion: f.verificacion,
    habilitacion: f.habilitacion,
    alcanceDeVinculo:
      f.alcance_de_vinculo_id && f.av_alcance && f.av_finalidad && f.av_estado
        ? { id: f.alcance_de_vinculo_id, alcance: f.av_alcance, finalidad: f.av_finalidad, estado: f.av_estado }
        : null,
    consentimiento:
      f.consentimiento_id && f.c_finalidad && f.c_situacion
        ? { id: f.consentimiento_id, finalidad: f.c_finalidad, situacion: f.c_situacion, versionVigenteId: f.version_vigente_id }
        : null,
  };
}
