import { Injectable } from '@nestjs/common';
import {
  IniciarSesionConGoogleRequestSchema,
  RegistrarConGoogleRequestSchema,
  VincularGoogleRequestSchema,
  cuentaPermiteOperar,
  type EstadoOperativoDeCuenta,
  type IniciarSesionResponse,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { bloquearCorreoDeAcceso, metodosDelCorreo } from '../identidad/correo-de-acceso';
import { esColisionDeIdentificador, RegistroService, validarActosDelAlta } from '../identidad/registro.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { CredencialesService } from '../plataforma/credenciales.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { esViolacionDeUnicidad } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import { SesionService, type SesionAbierta } from '../sesion/sesion.service';
import { CorreoDeGoogleNoVerificado, GoogleNoDisponible, TokenDeGoogleInvalido, VerificadorDeGoogle, type CuentaDeGoogle } from './verificador-de-google';

const OPERACION_SESION = 'API-GOO-01';
const OPERACION_VINCULO = 'API-GOO-02';
const OPERACION_ALTA = 'API-GOO-03';

/** La sesión no se abrió porque la cuenta dejó de ser operativa en el medio: la transacción se revierte entera. */
class CuentaNoOperativa extends Error {
  constructor(readonly estado: EstadoOperativoDeCuenta | 'INEXISTENTE' | 'ADMINISTRATIVA' | 'SIN_ROL_ADMINISTRATIVO') {
    super(`cuenta ${estado}`);
  }
}

/**
 * UC-E05 — Acceder mediante Google (RF-003), familia GOO (DEUDA_LEGAJO DL-138). Google es un método de acceso de la
 * identidad BE, nunca una identidad paralela (06 §5.6; 08 §24.1): las sesiones son las de API-ACC-02 (la misma fila, el
 * mismo token, la misma revocación) y Google no concede roles ni permisos (UC-E05: «Una cuenta federada no concede roles»).
 * - **API-GOO-01** abre la sesión de la identidad que ya tiene esa cuenta de Google. Si no la tiene ninguna, dice si hay
 *   una cuenta con contraseña para ese correo (vincular) o ninguna (crear). Nunca vincula ni crea.
 * - **API-GOO-02** vincula solo después de verificar la contraseña de esa cuenta, con las mismas reglas y los mismos cupos
 *   que el login local (Dirección, 2026-10-16: «solo después de que la persona confirme la contraseña»).
 * - **API-GOO-03** crea la identidad con los mismos actos que el alta local, y la declaración de mayoría de edad.
 * Un correo es de una sola identidad (RF-001; INV-06-21): las tres operaciones que escriben toman el cerrojo del correo.
 */
@Injectable()
export class AccesoGoogleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verificador: VerificadorDeGoogle,
    private readonly sesiones: SesionService,
    private readonly registro: RegistroService,
    private readonly credenciales: CredencialesService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
  ) {}

  /**
   * API-GOO-01. El cupo global por red se consume antes de verificar (acota el trabajo de cada red); después, los del login
   * por cuenta, con la cuenta de Google como identificador: no comparte cupo con la contraseña del correo, porque acá no se
   * prueba ningún secreto de BE.
   */
  async iniciar(cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<IniciarSesionResponse> {
    const solicitud = validarCuerpo(IniciarSesionConGoogleRequestSchema, cuerpo);
    this.limitador.consumir('loginPorIp', ctx.direccionIp);
    const cuenta = await this.verificar(solicitud.idToken, OPERACION_SESION, ctx);
    this.limitador.consumir('login', ctx.direccionIp, `google:${cuenta.sub}`);
    this.limitador.consumir('loginPorIdentificador', null, `google:${cuenta.sub}`);

    const metodo = await this.prisma.metodoDeAcceso.findUnique({
      where: { tipo_referencia: { tipo: 'GOOGLE', referencia: cuenta.sub } },
      select: { identidadId: true },
    });
    if (!metodo) {
      // Ninguna identidad tiene esa cuenta de Google. Con una cuenta local de ese correo, vincular exige su contraseña
      // (UC-E05 E02: «no se vincula ni crea sesión hasta resolver la asociación»); sin ninguna, el cliente ofrece el alta.
      const local = await this.prisma.metodoDeAcceso.findUnique({
        where: { tipo_referencia: { tipo: 'LOCAL', referencia: cuenta.correo } },
        select: { identidadId: true },
      });
      if (local) await this.rechazar(OPERACION_SESION, errores.vinculacionConGoogleRequerida(cuenta.correo), ctx, local.identidadId, 'VINCULACION_REQUERIDA');
      await this.rechazar(OPERACION_SESION, errores.cuentaDeGoogleInexistente(cuenta.correo), ctx, null, 'CUENTA_DE_GOOGLE_INEXISTENTE');
    }
    return this.abrirSesion(metodo!.identidadId, ctx, OPERACION_SESION);
  }

  /**
   * API-GOO-02. La contraseña se prueba exactamente como en API-ACC-02 (08 §24.5): los mismos cupos, con el correo como
   * identificador (vincular no es otra vía para probar contraseñas), el mismo trabajo en todas las ramas (bcrypt contra el
   * señuelo si no hay credencial) y el mismo 401 neutral para correo sin cuenta local, contraseña incorrecta, credencial
   * suprimida o cuenta no operativa.
   */
  async vincular(cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<IniciarSesionResponse> {
    const solicitud = validarCuerpo(VincularGoogleRequestSchema, cuerpo);
    this.limitador.consumir('loginPorIp', ctx.direccionIp);
    const cuenta = await this.verificar(solicitud.idToken, OPERACION_VINCULO, ctx);
    this.limitador.consumir('login', ctx.direccionIp, cuenta.correo);
    this.limitador.consumir('loginPorIdentificador', null, cuenta.correo);

    const local = await this.prisma.metodoDeAcceso.findUnique({
      where: { tipo_referencia: { tipo: 'LOCAL', referencia: cuenta.correo } },
      select: { identidadId: true, credencialLocal: { select: { hash: true } }, identidad: { select: { estadoOperativoDeCuenta: true } } },
    });
    const coincide = await this.credenciales.verificar(solicitud.credential, local?.credencialLocal?.hash ?? null);
    let motivo: string | null = null;
    if (!local) motivo = 'IDENTIFICADOR_INEXISTENTE';
    else if (!local.credencialLocal) motivo = 'CREDENCIAL_SUPRIMIDA';
    else if (!coincide) motivo = 'CREDENCIAL_INCORRECTA';
    else if (!cuentaPermiteOperar(local.identidad.estadoOperativoDeCuenta as EstadoOperativoDeCuenta)) motivo = `CUENTA_${local.identidad.estadoOperativoDeCuenta}`;
    if (motivo !== null || !local) return this.rechazar(OPERACION_VINCULO, errores.credencialesInvalidas(), ctx, local?.identidadId ?? null, motivo ?? 'IDENTIFICADOR_INEXISTENTE');

    const identidadId = local.identidadId;
    const procedencia = procedenciaDe(ctx, 'UC-E05', OPERACION_VINCULO) as unknown as Prisma.InputJsonValue;
    try {
      const sesion = await this.prisma.$transaction(async (tx) => {
        await bloquearCorreoDeAcceso(tx, cuenta.correo);
        const google = await tx.metodoDeAcceso.findMany({
          where: { tipo: 'GOOGLE', OR: [{ referencia: cuenta.sub }, { identidadId }] },
          select: { identidadId: true, referencia: true },
        });
        const yaEsDeEstaCuenta = google.some((m) => m.identidadId === identidadId && m.referencia === cuenta.sub);
        // La cuenta de Google es de otra identidad, o esta identidad ya tiene otra cuenta de Google (una por identidad).
        if (!yaEsDeEstaCuenta && google.length > 0) throw errores.cuentaDeGoogleYaVinculada();
        if (!yaEsDeEstaCuenta) await this.asociar(tx, identidadId, cuenta, procedencia, ctx);
        // Repetirlo con la misma cuenta ya vinculada (un reintento) abre otra sesión sin duplicar nada.
        return this.abrirEn(tx, identidadId, ctx, OPERACION_VINCULO);
      });
      return this.sesiones.respuesta(identidadId, sesion);
    } catch (e) {
      throw await this.comoRechazo(e, OPERACION_VINCULO, ctx, identidadId, () => errores.cuentaDeGoogleYaVinculada());
    }
  }

  /**
   * API-GOO-03. Si esa cuenta de Google ya tiene identidad, abre la sesión (200): un reintento después de perder la
   * respuesta no crea otra, y dos altas simultáneas con la misma cuenta terminan en una sola identidad (el cerrojo del
   * correo las ordena; el índice único del `sub` es la última palabra).
   */
  async registrar(cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<{ readonly estadoHttp: 200 | 201; readonly cuerpo: IniciarSesionResponse }> {
    const solicitud = validarCuerpo(RegistrarConGoogleRequestSchema, cuerpo);
    this.limitador.consumir('registro', ctx.direccionIp);
    validarActosDelAlta(solicitud, 'ESTRICTO');
    const cuenta = await this.verificar(solicitud.idToken, OPERACION_ALTA, ctx);

    const intentar = () =>
      this.prisma.$transaction(async (tx) => {
        await bloquearCorreoDeAcceso(tx, cuenta.correo);
        const existente = await tx.metodoDeAcceso.findUnique({
          where: { tipo_referencia: { tipo: 'GOOGLE', referencia: cuenta.sub } },
          select: { identidadId: true },
        });
        if (existente) return { creada: false, identidadId: existente.identidadId, sesion: await this.abrirEn(tx, existente.identidadId, ctx, OPERACION_ALTA) };
        const delCorreo = await metodosDelCorreo(tx, cuenta.correo);
        // Nunca una identidad paralela: con una cuenta local de ese correo, se vincula con su contraseña (API-GOO-02).
        const local = delCorreo.find((m) => m.tipo === 'LOCAL');
        if (local) throw new ConSujeto(errores.vinculacionConGoogleRequerida(cuenta.correo), local.identidadId, 'VINCULACION_REQUERIDA');
        // El correo es de otra identidad que entra con otra cuenta de Google (un correo que Google reasignó): el 409 neutral.
        if (delCorreo.length > 0) throw new ConSujeto(errores.registroNoDisponible(), null, 'CORREO_DE_OTRA_IDENTIDAD');
        const { identidadId } = await this.registro.crearIdentidad(
          tx,
          { registrationIntent: solicitud.registrationIntent, metodo: { tipo: 'GOOGLE', sub: cuenta.sub, correo: cuenta.correo } },
          ctx,
          OPERACION_ALTA,
        );
        return { creada: true, identidadId, sesion: await this.abrirEn(tx, identidadId, ctx, OPERACION_ALTA) };
      });

    try {
      let resultado;
      try {
        resultado = await intentar();
      } catch (e) {
        // Dos tokens de la misma cuenta con correos distintos (Google cambió el correo entre uno y otro) no comparten el
        // cerrojo: el índice único del `sub` deja pasar uno y el otro, al repetir, encuentra la identidad creada.
        if (!esViolacionDeUnicidad(e)) throw e;
        resultado = await intentar();
      }
      return { estadoHttp: resultado.creada ? 201 : 200, cuerpo: this.sesiones.respuesta(resultado.identidadId, resultado.sesion) };
    } catch (e) {
      throw await this.comoRechazo(e, OPERACION_ALTA, ctx, null, () => errores.registroNoDisponible());
    }
  }

  /** Verifica el ID token; un rechazo (token, correo sin verificar, Google no disponible) queda en la auditoría. */
  private async verificar(idToken: string, operacion: string, ctx: ContextoDeSolicitud): Promise<CuentaDeGoogle> {
    try {
      return await this.verificador.verificar(idToken);
    } catch (e) {
      if (e instanceof GoogleNoDisponible) return this.rechazar(operacion, errores.googleNoDisponible(e.motivo), ctx, null, e.motivo);
      if (e instanceof TokenDeGoogleInvalido) return this.rechazar(operacion, errores.tokenDeGoogleInvalido(e.motivo), ctx, null, `TOKEN_${e.motivo}`);
      if (e instanceof CorreoDeGoogleNoVerificado) return this.rechazar(operacion, errores.correoDeGoogleNoVerificado(), ctx, null, 'CORREO_NO_VERIFICADO');
      throw e;
    }
  }

  /** REG-06-21: el método GOOGLE con el correo verificado, y el hecho `MetodoDeAccesoAsociado` con actor y procedencia. */
  private async asociar(tx: Prisma.TransactionClient, identidadId: string, cuenta: CuentaDeGoogle, procedencia: Prisma.InputJsonValue, ctx: ContextoDeSolicitud): Promise<void> {
    const metodo = await tx.metodoDeAcceso.create({
      data: { identidadId, tipo: 'GOOGLE', referencia: cuenta.sub, correo: cuenta.correo, procedencia, momentoDeOcurrencia: ctx.momentoDeRecepcion },
    });
    await tx.eventoDeDominio.create({
      data: {
        tipo: 'MetodoDeAccesoAsociado',
        identidadId,
        actorId: identidadId,
        autoriaId: identidadId,
        procedencia,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
        datos: { metodoDeAccesoId: metodo.id, tipo: 'GOOGLE' },
      },
    });
    // 08 §24.6: «cambio de método de acceso» es un evento crítico de identidad, auditable.
    await this.auditoria.registrar(
      {
        operacion: OPERACION_VINCULO,
        resultado: 'EXITO',
        motivo: 'METODO_GOOGLE_ASOCIADO',
        actorId: identidadId,
        sujetoId: identidadId,
        recursoTipo: 'MetodoDeAcceso',
        recursoId: metodo.id,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
  }

  /** Abre la sesión como API-ACC-02, o revierte la transacción si la cuenta dejó de ser operativa. */
  private async abrirEn(tx: Prisma.TransactionClient, identidadId: string, ctx: ContextoDeSolicitud, operacion: string): Promise<SesionAbierta> {
    const sesion = await this.sesiones.abrirEn(tx, identidadId, ctx, operacion);
    if ('estado' in sesion) throw new CuentaNoOperativa(sesion.estado);
    return sesion;
  }

  private async abrirSesion(identidadId: string, ctx: ContextoDeSolicitud, operacion: string): Promise<IniciarSesionResponse> {
    try {
      const sesion = await this.prisma.$transaction((tx) => this.abrirEn(tx, identidadId, ctx, operacion));
      return this.sesiones.respuesta(identidadId, sesion);
    } catch (e) {
      // Abrir una sesión no choca con ningún índice único: si pasara, es una falla no clasificada (500), no un 409.
      throw await this.comoRechazo(e, operacion, ctx, identidadId, () => errores.interno());
    }
  }

  /**
   * Traduce lo que cortó una transacción a la respuesta del contrato, y lo audita: la cuenta no operativa es el mismo 401
   * neutral que el login (UC-P26 E02); un rechazo con sujeto lleva el suyo; una colisión de unicidad, el 409 de la
   * operación. Lo demás sale como vino.
   */
  private async comoRechazo(e: unknown, operacion: string, ctx: ContextoDeSolicitud, sujetoId: string | null, colision: () => ErrorDeApi): Promise<unknown> {
    if (e instanceof CuentaNoOperativa) return this.rechazoAuditado(operacion, errores.credencialesInvalidas(), ctx, sujetoId, `CUENTA_${e.estado}`);
    if (e instanceof ConSujeto) return this.rechazoAuditado(operacion, e.error, ctx, e.sujetoId, e.motivo);
    if (esViolacionDeUnicidad(e) || esColisionDeIdentificador(e)) {
      const error = colision();
      return this.rechazoAuditado(operacion, error, ctx, sujetoId, `COLISION_${error.code}`);
    }
    if (e instanceof ErrorDeApi) return this.rechazoAuditado(operacion, e, ctx, sujetoId, e.motivoDeAuditoria ?? e.code);
    return e;
  }

  private async rechazar(operacion: string, error: ErrorDeApi, ctx: ContextoDeSolicitud, sujetoId: string | null, motivo: string): Promise<never> {
    throw await this.rechazoAuditado(operacion, error, ctx, sujetoId, motivo);
  }

  /** El rechazo queda en la auditoría con su motivo real (09v7 T16); al cliente le llega solo el error del contrato. */
  private async rechazoAuditado(operacion: string, error: ErrorDeApi, ctx: ContextoDeSolicitud, sujetoId: string | null, motivo: string): Promise<ErrorDeApi> {
    await this.auditoria.registrar({
      operacion,
      resultado: 'RECHAZO',
      motivo,
      sujetoId,
      superficie: ctx.superficie,
      requestId: ctx.requestId,
      momentoDeOcurrencia: ctx.momentoDeRecepcion,
    });
    return error;
  }
}

/** Un rechazo del contrato que se decidió dentro de una transacción, con el sujeto y el motivo para la auditoría. */
class ConSujeto extends Error {
  constructor(
    readonly error: ErrorDeApi,
    readonly sujetoId: string | null,
    readonly motivo: string,
  ) {
    super(error.code);
  }
}
