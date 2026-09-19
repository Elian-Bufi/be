import { Injectable } from '@nestjs/common';
import {
  ACTOS_DEL_REGISTRO,
  CodigoDeError,
  RegistrarIdentidadRequestSchema,
  TipoDeTexto,
  VERSION_VIGENTE,
  identificadorLocalValido,
  normalizarIdentificadorLocal,
  problemaDeCredencialLocal,
  type RegistrarIdentidadResponse,
  type ValidationIssue,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { CredencialesService } from '../plataforma/credenciales.service';
import { AMBITO_PUBLICO, IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';

const OPERACION = 'API-ACC-01';

/**
 * UC-P25 — Registrar identidad BE y perfil propio (API-ACC-01, 09v8 §4).
 * En una sola transacción (REQUIRED_SAME_TX): Identidad OPERATIVA + Perfil propio + control de sesión + método LOCAL
 * + credencial + A1 (TERMINOS) + A2 (PRIVACIDAD_INFO) + eventos IdentidadCreada/MetodoDeAccesoAsociado + auditoría.
 * No crea sesión, ni A3, ni rol, especialidad, vínculo o autorización (09v8 §2.2; 06:2013).
 * Unicidad del identificador: la garantiza el índice `metodo_de_acceso_tipo_referencia_key`; la búsqueda previa es
 * solo un atajo — bajo concurrencia decide la base (P2002 → 409 neutral).
 */
@Injectable()
export class RegistroService {
  constructor(
    private readonly idempotencia: IdempotenciaService,
    private readonly credenciales: CredencialesService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
  ) {}

  async registrar(cuerpo: unknown, claveDeIdempotencia: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    if (!IdempotenciaService.claveValida(claveDeIdempotencia)) {
      throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    }
    const solicitud = validarCuerpo(RegistrarIdentidadRequestSchema, cuerpo);
    this.limitador.consumir('registro', ctx.direccionIp);

    const identificador = normalizarIdentificadorLocal(solicitud.identity.localIdentifier);
    const issues: ValidationIssue[] = [];
    if (!identificadorLocalValido(identificador)) issues.push({ code: 'INVALID_LOCAL_IDENTIFIER', path: 'identity.localIdentifier' });
    const problema = problemaDeCredencialLocal(solicitud.identity.localCredential);
    if (problema) issues.push({ code: problema, path: 'identity.localCredential' });
    if (issues.length > 0) throw errores.solicitudInvalida(issues);

    // 08 §12.2 / 09 §31.2.5: la versión mostrada debe ser la vigente.
    const terminos = VERSION_VIGENTE[TipoDeTexto.TERMINOS];
    const privacidad = VERSION_VIGENTE[TipoDeTexto.PRIVACIDAD_INFO];
    if (solicitud.termsAcceptance.versionId !== terminos.id) throw errores.versionDeTerminosNoAceptable();
    if (solicitud.privacyAcknowledgement.versionId !== privacidad.id) throw errores.versionDePrivacidadNoAceptable();

    // Siempre se calcula el hash, exista o no el identificador: trabajo equivalente en ambas ramas (DL-010).
    const hash = await this.credenciales.generarHash(solicitud.identity.localCredential);
    // Huella del request lógico SIN la credencial (DL-026).
    const huella = IdempotenciaService.huella({
      registrationIntent: solicitud.registrationIntent,
      identificador,
      profile: solicitud.profile ?? {},
      terminos: solicitud.termsAcceptance.versionId,
      privacidad: solicitud.privacyAcknowledgement.versionId,
    });

    try {
      return await this.idempotencia.ejecutar(
        { operacion: OPERACION, ambito: AMBITO_PUBLICO, clave: claveDeIdempotencia, huella },
        async (tx) => {
          const existente = await tx.metodoDeAcceso.findUnique({
            where: { tipo_referencia: { tipo: 'LOCAL', referencia: identificador } },
            select: { id: true },
          });
          if (existente) throw errores.registroNoDisponible();
          return this.crear(tx, { identificador, hash, registrationIntent: solicitud.registrationIntent }, ctx);
        },
      );
    } catch (e) {
      const error = esColisionDeIdentificador(e) ? errores.registroNoDisponible() : e;
      if (error instanceof ErrorDeApi && error.code === CodigoDeError.REGISTRATION_NOT_AVAILABLE) {
        await this.auditoria.registrar({
          operacion: OPERACION,
          resultado: 'RECHAZO',
          motivo: 'IDENTIFICADOR_NO_DISPONIBLE',
          superficie: ctx.superficie,
          requestId: ctx.requestId,
          momentoDeOcurrencia: ctx.momentoDeRecepcion,
        });
      }
      throw error;
    }
  }

  private async crear(
    tx: Prisma.TransactionClient,
    datos: { identificador: string; hash: string; registrationIntent: 'ADVISEE' | 'PROFESSIONAL' },
    ctx: ContextoDeSolicitud,
  ): Promise<ResultadoIdempotente> {
    const identidadId = randomUUID();
    const procedencia = procedenciaDe(ctx, 'UC-P25', OPERACION) as unknown as Prisma.InputJsonValue;
    // TEN-39: ocurrencia = cuándo BE recibió la confirmación; registro = cuándo lo persistió (default de la base).
    const ocurrencia = ctx.momentoDeRecepcion;

    const identidad = await tx.identidad.create({
      // 06 §5.4.2 «autoría de creación»: en autorregistro, la propia identidad.
      data: { id: identidadId, autoriaDeCreacionId: identidadId, procedencia, momentoDeOcurrencia: ocurrencia },
    });
    // INV-06-22: exactamente un Perfil propio (la base lo verifica al confirmar). Sin contenido: DL-009.
    await tx.perfilPropio.create({ data: { identidadId, momentoDeOcurrencia: ocurrencia } });
    await tx.controlDeSesion.create({ data: { identidadId } });
    const metodo = await tx.metodoDeAcceso.create({
      data: { identidadId, tipo: 'LOCAL', referencia: datos.identificador, procedencia, momentoDeOcurrencia: ocurrencia },
    });
    await tx.credencialLocal.create({ data: { metodoDeAccesoId: metodo.id, hash: datos.hash } });

    // A1 y A2: dos actos separados con evidencia propia (08 §12.1-12.2). A3 NO (ACTOS_DEL_REGISTRO).
    const versiones = await tx.versionDeTexto.findMany({
      where: { id: { in: [VERSION_VIGENTE.TERMINOS.id, VERSION_VIGENTE.PRIVACIDAD_INFO.id] } },
    });
    for (const tipo of ACTOS_DEL_REGISTRO) {
      const version = versiones.find((v) => v.tipo === tipo);
      if (!version) throw tipo === 'TERMINOS' ? errores.versionDeTerminosNoAceptable() : errores.versionDePrivacidadNoAceptable();
      await tx.actoRegistrable.create({
        data: {
          identidadId,
          tipo,
          versionDeTextoId: version.id,
          hashDelTexto: version.hash,
          finalidad: version.finalidad,
          superficie: ctx.superficie,
          direccionIp: ctx.direccionIp,
          agenteDeUsuario: ctx.agenteDeUsuario,
          actorId: identidadId,
          autoriaId: identidadId,
          procedencia,
          momentoDeOcurrencia: ocurrencia,
        },
      });
    }

    await tx.eventoDeDominio.create({
      data: {
        tipo: 'IdentidadCreada',
        identidadId,
        actorId: identidadId,
        autoriaId: identidadId,
        procedencia,
        estadoResultante: 'OPERATIVA',
        momentoDeOcurrencia: ocurrencia,
        // `registrationIntent` es contractual pero no es rol ni atributo de Identidad (09v8 §3.1; DL-021).
        datos: { registrationIntent: datos.registrationIntent },
      },
    });
    await tx.eventoDeDominio.create({
      data: {
        tipo: 'MetodoDeAccesoAsociado',
        identidadId,
        actorId: identidadId,
        autoriaId: identidadId,
        procedencia,
        momentoDeOcurrencia: ocurrencia,
        datos: { metodoDeAccesoId: metodo.id, tipo: 'LOCAL' },
      },
    });
    await this.auditoria.registrar(
      {
        operacion: OPERACION,
        resultado: 'EXITO',
        actorId: identidadId,
        sujetoId: identidadId,
        recursoTipo: 'Identidad',
        recursoId: identidadId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ocurrencia,
      },
      tx,
    );

    const cuerpo: RegistrarIdentidadResponse = {
      data: {
        identityId: identidadId,
        registrationIntent: datos.registrationIntent,
        accountOperationalState: 'OPERATIVA',
        createdAt: identidad.momentoDeRegistro.toISOString(),
      },
    };
    return { estadoHttp: 201, cuerpo: cuerpo as unknown as Prisma.InputJsonValue };
  }
}

/** P2002 sobre el índice único del método de acceso: otra transacción registró el mismo identificador. */
function esColisionDeIdentificador(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return false;
  const meta = e.meta as { modelName?: string; target?: unknown } | undefined;
  const target = Array.isArray(meta?.target) ? meta.target.join(',') : String(meta?.target ?? '');
  return meta?.modelName === 'MetodoDeAcceso' || target.includes('referencia');
}
