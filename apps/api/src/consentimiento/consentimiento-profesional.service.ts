import { Injectable } from '@nestjs/common';
import {
  ALCANCES,
  COPY_VINCULO,
  CuerpoVacioSchema,
  DECISION_DE_TRANSICION,
  OtorgarConsentimientoRequestSchema,
  TIPO_DE_TEXTO_DE_B2,
  evaluarTransicionDeConsentimiento,
  modoDeAcceso,
  transicionDeOtorgamiento,
  type Alcance,
  type ConsentimientoOtorgadoResponse,
  type ConsentimientoRevocadoResponse,
  type Finalidad,
  type ListaDeConsentimientosResponse,
  type MotivoDeRechazoDeConsentimiento,
  type RequisitosDeConsentimientoResponse,
  type TransicionDeConsentimiento,
} from '@be/domain';
import type { Prisma, TipoDePerfilProfesional, TipoDeEventoDeVinculo, VersionDeTexto } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { nombreDeProfesional, registrarEventoDeVinculo, resumenDeAlcance, resumenDeCadena } from '../vinculo/lectura';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ComponenteDelTitular {
  readonly id: string;
  readonly estado: 'ACEPTADO' | 'PAUSADO' | 'FINALIZADO';
  readonly alcance: Alcance;
  readonly finalidad: Finalidad;
  readonly profesionalId: string;
  readonly asesoradoId: string;
}

/**
 * Consentimiento profesional B2 (T-06-17, T-06-18; 06 §7.7; UC-P07, UC-P08; API-CON-01 a 04).
 * - Un solo Consentimiento por (alcance de vínculo, finalidad) y cada decisión expresa emite una VersionDeConsentimiento
 *   con su evidencia (REG-06-50; 08 §12.2). La base verifica la cadena al confirmar.
 * - Solo el asesorado titular decide (INV-06-62): el profesional recibe 404 idéntico (09:226).
 * - La versión de texto aplicable es la cabeza de la cadena de su tipo (DL-038), diferenciada por perfil (08 §12.3).
 * - Revocar corta el acceso futuro en la operación siguiente, porque el PDP no cachea. No finaliza el vínculo ni borra
 *   historia (REG-06-51, INV-06-63).
 */
@Injectable()
export class ConsentimientoProfesionalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdp: PdpService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ─── API-CON-01 ────────────────────────────────────────────────────────────────────────────
  async requisitos(actor: ActorAutenticado, vinculoId: string): Promise<RequisitosDeConsentimientoResponse> {
    const c = await this.componenteDelTitular(this.prisma as unknown as Prisma.TransactionClient, actor.identidadId, vinculoId, false);
    const perfil = await this.prisma.perfilProfesional.findUnique({ where: { identidadId: c.profesionalId } });
    if (!perfil) throw errores.recursoNoEncontrado();
    const version = await this.versionAplicable(this.prisma as unknown as Prisma.TransactionClient, perfil.tipo);
    return {
      data: {
        relationshipId: c.id,
        professional: { identityId: c.profesionalId, displayName: nombreDeProfesional(perfil) },
        scope: resumenDeAlcance(c.alcance),
        purpose: c.finalidad,
        consentVersion: { id: version.id, text: version.texto, textHash: version.hash, effectiveFrom: version.vigenteDesde.toISOString() },
        // Sin matriz de pertinencia: «ausencia de regla = deny» (09v8:1558; DL-039).
        pertinentCategories: [],
        professionalProfileDisclosure: {
          profileType: perfil.tipo === 'SANITARIO' ? 'HEALTH_PROFESSIONAL' : 'NON_HEALTH_PROFESSIONAL',
          notice: COPY_VINCULO.avisoDePerfil[perfil.tipo],
        },
      },
    };
  }

  // ─── API-CON-02 ────────────────────────────────────────────────────────────────────────────
  async otorgar(actor: ActorAutenticado, vinculoId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const operacion = 'API-CON-02';
    if (!IdempotenciaService.claveValida(clave)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    const pedido = validarCuerpo(OtorgarConsentimientoRequestSchema, cuerpo);
    const huella = IdempotenciaService.huella({ vinculoId, ...pedido });
    const procedencia = procedenciaDe(ctx, 'UC-P07', operacion);
    try {
      return await this.idempotencia.ejecutar({ operacion, ambito: actor.identidadId, clave: clave as string, huella }, async (tx) => {
        // Bloquea el componente: serializa las decisiones sobre el mismo vínculo (09v8:1609-1617, «validaciones atómicas»).
        const c = await this.componenteDelTitular(tx, actor.identidadId, vinculoId, true);
        if (c.estado !== 'ACEPTADO') throw errores.vinculoNoListoParaConsentir();
        const perfil = await tx.perfilProfesional.findUniqueOrThrow({ where: { identidadId: c.profesionalId } });
        const aplicable = await this.versionAplicable(tx, perfil.tipo);
        if (pedido.consentVersionId !== aplicable.id) throw errores.versionDeConsentimientoVieja();

        const existente = await tx.consentimiento.findUnique({
          where: { alcanceDeVinculoId_finalidad: { alcanceDeVinculoId: c.id, finalidad: c.finalidad } },
          include: { versiones: true },
        });
        const cadena = existente ? resumenDeCadena(existente.versiones) : null;
        const vigenteDeTexto = existente?.situacion === 'VIGENTE' ? cadena?.ultimaAceptacion.versionDeTextoId ?? null : null;
        const transicion = transicionDeOtorgamiento(existente?.situacion ?? null, vigenteDeTexto, pedido.consentVersionId);

        if (transicion === 'SIN_CAMBIO' && existente && cadena) {
          // Ya vigente con esta versión: se devuelve el existente (09v8:1621 «200 en replay idempotente»).
          return this.respuestaDeOtorgamiento(200, existente.id, c, pedido.consentVersionId, cadena.ultimaAceptacion.momentoDeOcurrencia);
        }
        const t = transicion as TransicionDeConsentimiento;
        const evaluacion = evaluarTransicionDeConsentimiento(existente?.situacion ?? null, {
          transicion: t,
          actorEsTitular: true,
          decisionExplicita: true,
          versionPresentadaAplicable: true,
          versionPresentadaEsSucesora: vigenteDeTexto !== pedido.consentVersionId,
          alcanceDeVinculoAceptado: true,
        });
        if (!evaluacion.permitida) throw errorDeConsentimiento(evaluacion.motivo);

        let consentimientoId: string;
        if (!existente) {
          const creado = await tx.consentimiento.create({
            data: { alcanceDeVinculoId: c.id, finalidad: c.finalidad, momentoDeOcurrencia: ctx.momentoDeRecepcion },
          });
          consentimientoId = creado.id;
        } else {
          consentimientoId = existente.id;
          await tx.consentimiento.update({ where: { id: existente.id }, data: { situacion: 'VIGENTE', version: existente.version + 1 } });
        }
        const version = await tx.versionDeConsentimiento.create({
          data: {
            consentimientoId,
            predecesoraId: cadena?.cabeza.id ?? null,
            decision: DECISION_DE_TRANSICION[t],
            situacionResultante: 'VIGENTE',
            versionDeTextoId: aplicable.id,
            hashDelTexto: aplicable.hash,
            alcance: c.alcance,
            finalidad: c.finalidad,
            superficie: ctx.superficie,
            direccionIp: ctx.direccionIp,
            agenteDeUsuario: ctx.agenteDeUsuario,
            actorId: actor.identidadId,
            autoriaId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
          },
        });
        await registrarEventoDeVinculo(tx, {
          tipo: evaluacion.transicion.evento as TipoDeEventoDeVinculo,
          profesionalId: c.profesionalId,
          asesoradoId: c.asesoradoId,
          alcanceDeVinculoId: c.id,
          consentimientoId,
          versionDeConsentimientoId: version.id,
          estadoPrevio: existente?.situacion ?? null,
          estadoPosterior: 'VIGENTE',
          actor: { identidadId: actor.identidadId },
          procedencia,
          momento: ctx.momentoDeRecepcion,
        });
        await this.auditar(tx, operacion, actor.identidadId, consentimientoId, ctx);
        return this.respuestaDeOtorgamiento(t === 'OtorgarConsentimiento' ? 201 : 200, consentimientoId, c, aplicable.id, ctx.momentoDeRecepcion);
      });
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx);
      throw e;
    }
  }

  // ─── API-CON-03 ────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<ListaDeConsentimientosResponse> {
    const consulta = leerConsultaDeLista(query, { state: ['ACTIVE', 'REVOKED'], scope: ALCANCES });
    const filas = await this.prisma.consentimiento.findMany({
      where: {
        AND: [
          { alcanceDeVinculo: { vinculo: { asesoradoId: actor.identidadId } } },
          consulta.filtros.state ? { situacion: consulta.filtros.state === 'ACTIVE' ? 'VIGENTE' : 'REVOCADO' } : {},
          consulta.filtros.scope ? { alcanceDeVinculo: { alcance: consulta.filtros.scope as Alcance } } : {},
          despuesDelCursor(consulta.cursor),
        ],
      },
      orderBy: ORDEN_DE_LISTA,
      take: consulta.limit + 1,
      include: {
        versiones: true,
        alcanceDeVinculo: { include: { vinculo: { include: { profesional: { select: { perfilProfesional: { select: { nombreVisible: true } } } } } } } },
      },
    });
    const { pagina, page } = paginar(filas, consulta.limit);
    const data: ListaDeConsentimientosResponse['data'] = [];
    for (const f of pagina) {
      const cadena = resumenDeCadena(f.versiones);
      const av = f.alcanceDeVinculo;
      // El modo de acceso lo calcula el PDP (RF-023). Sin B2 vigente o con el vínculo no aceptado, no hay acceso.
      const acceso =
        f.situacion === 'VIGENTE' && av.estado === 'ACEPTADO'
          ? modoDeAcceso(await this.pdp.evaluarSinRegistrar(this.prisma, av.vinculo.profesionalId, av.vinculo.asesoradoId, av.alcance))
          : 'BLOCKED';
      data.push({
        consentId: f.id,
        professional: { identityId: av.vinculo.profesionalId, displayName: nombreDeProfesional(av.vinculo.profesional.perfilProfesional) },
        scope: resumenDeAlcance(av.alcance),
        purpose: f.finalidad,
        consentVersionId: cadena.ultimaAceptacion.versionDeTextoId as string,
        state: f.situacion === 'VIGENTE' ? 'ACTIVE' : 'REVOKED',
        acceptedAt: cadena.ultimaAceptacion.momentoDeOcurrencia.toISOString(),
        revokedAt: cadena.revocadoEn?.toISOString() ?? null,
        relationshipId: av.id,
        relationshipState: av.estado,
        accessMode: acceso,
      });
    }
    return { data, page };
  }

  // ─── API-CON-04 ────────────────────────────────────────────────────────────────────────────
  /** Idempotente por semántica, sin Idempotency-Key (09v8:1758): revocar dos veces no crea una segunda revocación. */
  async revocar(actor: ActorAutenticado, consentimientoId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ConsentimientoRevocadoResponse> {
    const operacion = 'API-CON-04';
    validarCuerpo(CuerpoVacioSchema, cuerpo);
    const procedencia = procedenciaDe(ctx, 'UC-P08', operacion);
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (!UUID.test(consentimientoId)) throw errores.recursoNoEncontrado();
        const [fila] = await tx.$queryRaw<{ id: string; situacion: 'VIGENTE' | 'REVOCADO'; version: number; alcance_de_vinculo_id: string; profesional_id: string; asesorado_id: string }[]>`
          SELECT c."id"::text, c."situacion"::text AS "situacion", c."version", c."alcance_de_vinculo_id"::text,
                 vi."profesional_id"::text, vi."asesorado_id"::text
            FROM "consentimiento" c
            JOIN "alcance_de_vinculo" av ON av."id" = c."alcance_de_vinculo_id"
            JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
           WHERE c."id" = ${consentimientoId}::uuid AND vi."asesorado_id" = ${actor.identidadId}::uuid
             FOR UPDATE OF c`;
        // Solo el titular (INV-06-62). A cualquier otro, 404 idéntico (09:226).
        if (!fila) throw errores.recursoNoEncontrado();
        const versiones = await tx.versionDeConsentimiento.findMany({ where: { consentimientoId: fila.id } });
        const cadena = resumenDeCadena(versiones);
        if (fila.situacion === 'REVOCADO') {
          // Replay: REVOKED → REVOKED, con la misma fecha (09v8:1713-1727).
          return { data: { consentId: fila.id, state: 'REVOKED', revokedAt: (cadena.revocadoEn ?? cadena.cabeza.momentoDeOcurrencia).toISOString() } };
        }
        const evaluacion = evaluarTransicionDeConsentimiento('VIGENTE', { transicion: 'RevocarConsentimiento', actorEsTitular: true, decisionExplicita: true });
        if (!evaluacion.permitida) throw errores.estadoNoPermite();
        const [av] = await tx.$queryRaw<{ alcance: Alcance; finalidad: Finalidad }[]>`
          SELECT "alcance"::text AS "alcance", "finalidad"::text AS "finalidad" FROM "alcance_de_vinculo" WHERE "id" = ${fila.alcance_de_vinculo_id}::uuid`;
        await tx.consentimiento.update({ where: { id: fila.id }, data: { situacion: 'REVOCADO', version: fila.version + 1 } });
        // «Versión + evento de revocación» (06:3174). Sin texto: revocar no acepta ninguna versión.
        const version = await tx.versionDeConsentimiento.create({
          data: {
            consentimientoId: fila.id,
            predecesoraId: cadena.cabeza.id,
            decision: 'REVOCACION',
            situacionResultante: 'REVOCADO',
            alcance: av.alcance,
            finalidad: av.finalidad,
            superficie: ctx.superficie,
            direccionIp: ctx.direccionIp,
            agenteDeUsuario: ctx.agenteDeUsuario,
            actorId: actor.identidadId,
            autoriaId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
          },
        });
        await registrarEventoDeVinculo(tx, {
          tipo: 'ConsentimientoRevocado',
          profesionalId: fila.profesional_id,
          asesoradoId: fila.asesorado_id,
          alcanceDeVinculoId: fila.alcance_de_vinculo_id,
          consentimientoId: fila.id,
          versionDeConsentimientoId: version.id,
          estadoPrevio: 'VIGENTE',
          estadoPosterior: 'REVOCADO',
          actor: { identidadId: actor.identidadId },
          procedencia,
          momento: ctx.momentoDeRecepcion,
        });
        await this.auditar(tx, operacion, actor.identidadId, fila.id, ctx);
        return { data: { consentId: fila.id, state: 'REVOKED', revokedAt: ctx.momentoDeRecepcion.toISOString() } };
      });
    } catch (e) {
      await this.auditarRechazo(e, operacion, actor.identidadId, ctx);
      throw e;
    }
  }

  /** Versión de texto de B2 aplicable al perfil: la cabeza de la cadena explícita de su tipo (REG-06-12; DL-038). */
  private async versionAplicable(tx: Prisma.TransactionClient, tipo: TipoDePerfilProfesional): Promise<VersionDeTexto> {
    const [v] = await tx.$queryRaw<VersionDeTexto[]>`
      SELECT "id", "tipo", "titulo", "finalidad", "texto", "hash", "vigente_desde" AS "vigenteDesde",
             "momento_de_registro" AS "momentoDeRegistro", "reemplaza_a_id" AS "reemplazaAId"
        FROM "version_de_texto" v
       WHERE v."tipo" = ${TIPO_DE_TEXTO_DE_B2[tipo]}::"TipoDeTexto"
         AND NOT EXISTS (SELECT 1 FROM "version_de_texto" s WHERE s."reemplaza_a_id" = v."id")`;
    if (!v) throw errores.interno();
    return v;
  }

  /** El componente de vínculo, solo si el actor es su asesorado titular; si no, 404 idéntico. */
  private async componenteDelTitular(tx: Prisma.TransactionClient, asesoradoId: string, vinculoId: string, bloquear: boolean): Promise<ComponenteDelTitular> {
    if (!UUID.test(vinculoId)) throw errores.recursoNoEncontrado();
    const filas = bloquear
      ? await tx.$queryRaw<ComponenteDelTitular[]>`
          SELECT av."id"::text AS "id", av."estado"::text AS "estado", av."alcance"::text AS "alcance", av."finalidad"::text AS "finalidad",
                 vi."profesional_id"::text AS "profesionalId", vi."asesorado_id"::text AS "asesoradoId"
            FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
           WHERE av."id" = ${vinculoId}::uuid AND vi."asesorado_id" = ${asesoradoId}::uuid FOR UPDATE OF av`
      : await tx.$queryRaw<ComponenteDelTitular[]>`
          SELECT av."id"::text AS "id", av."estado"::text AS "estado", av."alcance"::text AS "alcance", av."finalidad"::text AS "finalidad",
                 vi."profesional_id"::text AS "profesionalId", vi."asesorado_id"::text AS "asesoradoId"
            FROM "alcance_de_vinculo" av JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
           WHERE av."id" = ${vinculoId}::uuid AND vi."asesorado_id" = ${asesoradoId}::uuid`;
    if (!filas[0]) throw errores.recursoNoEncontrado();
    return filas[0];
  }

  private respuestaDeOtorgamiento(estado: 200 | 201, consentimientoId: string, c: ComponenteDelTitular, versionDeTextoId: string, momento: Date): ResultadoIdempotente {
    const respuesta: ConsentimientoOtorgadoResponse = {
      data: {
        consentId: consentimientoId,
        relationshipId: c.id,
        consentVersionId: versionDeTextoId,
        state: 'ACTIVE',
        acceptedAt: momento.toISOString(),
        scope: resumenDeAlcance(c.alcance),
        purpose: c.finalidad,
        pertinentCategories: [],
      },
    };
    return { estadoHttp: estado, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
  }

  private async auditar(tx: Prisma.TransactionClient, operacion: string, actorId: string, consentimientoId: string, ctx: ContextoDeSolicitud): Promise<void> {
    await this.auditoria.registrar(
      {
        operacion,
        resultado: 'EXITO',
        actorId,
        sujetoId: actorId,
        recursoTipo: 'Consentimiento',
        recursoId: consentimientoId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
  }

  private async auditarRechazo(e: unknown, operacion: string, actorId: string, ctx: ContextoDeSolicitud): Promise<void> {
    if (!(e instanceof ErrorDeApi)) return;
    await this.auditoria.registrar({
      operacion,
      resultado: 'RECHAZO',
      motivo: e.code,
      actorId,
      superficie: ctx.superficie,
      requestId: ctx.requestId,
      momentoDeOcurrencia: ctx.momentoDeRecepcion,
    });
  }
}

function errorDeConsentimiento(motivo: MotivoDeRechazoDeConsentimiento): ErrorDeApi {
  switch (motivo) {
    case 'VINCULO_NO_ACEPTADO':
      return errores.vinculoNoListoParaConsentir();
    case 'VERSION_NO_APLICABLE':
      return errores.versionDeConsentimientoVieja();
    default:
      return errores.estadoNoPermite();
  }
}
