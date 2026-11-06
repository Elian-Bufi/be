import { Injectable } from '@nestjs/common';
import {
  DURACION_DE_SESION_ADMINISTRATIVA_MS,
  DURACION_DE_SESION_MS,
  IniciarSesionRequestSchema,
  cuentaPermiteOperar,
  normalizarIdentificadorLocal,
  type EstadoOperativoDeCuenta,
  type IniciarSesionResponse,
  type MotivoDeRevocacionDeSesion,
} from '@be/domain';
import type { ClaseDeSesion, Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { CredencialesService } from '../plataforma/credenciales.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { extraerBearer, TokensService } from './tokens.service';
import type { ActorAutenticado } from './sesion.guard';

/** Una sesión recién abierta: su fila, la versión de control con que se firma el token y su vencimiento. */
export interface SesionAbierta {
  readonly sesionId: string;
  readonly version: number;
  readonly expiraEn: Date;
}

/**
 * UC-P26 — Autenticar y finalizar una sesión local (API-ACC-02/03/04).
 * Sesiones revocables server-side (08 §26), verificadas en cada request por `SesionGuard`.
 */
@Injectable()
export class SesionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly credenciales: CredencialesService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
  ) {}

  /**
   * API-ACC-02. Neutralidad (TEST-AUTH-001; 09v8 «error contract anti-enumeración»): identificador inexistente,
   * credencial incorrecta, credencial suprimida y cuenta no operativa ejecutan el mismo trabajo — una búsqueda,
   * una verificación bcrypt y una escritura de auditoría — y responden el mismo `401 INVALID_CREDENTIALS`.
   * La causa real queda solo en la auditoría interna (09v7 T16). Orden normativo: primero el método, después el
   * estado de la cuenta (05 UC-P26).
   */
  async iniciar(cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<IniciarSesionResponse> {
    const solicitud = validarCuerpo(IniciarSesionRequestSchema, cuerpo);
    const identificador = normalizarIdentificadorLocal(solicitud.identifier);
    // Cupos neutrales (no dependen de que la cuenta exista, DL-015): global por red, por red + identificador, y por
    // identificador desde cualquier red. El último acota el ataque a una cuenta cuando las requests llegan desde un pool
    // de direcciones (por ejemplo, el de un proxy; DL-030). Es defensa en profundidad.
    this.limitador.consumir('loginPorIp', ctx.direccionIp);
    this.limitador.consumir('login', ctx.direccionIp, identificador);
    this.limitador.consumir('loginPorIdentificador', null, identificador);

    const metodo = await this.prisma.metodoDeAcceso.findUnique({
      where: { tipo_referencia: { tipo: 'LOCAL', referencia: identificador } },
      select: {
        identidadId: true,
        credencialLocal: { select: { hash: true } },
        identidad: { select: { estadoOperativoDeCuenta: true } },
      },
    });
    const coincide = await this.credenciales.verificar(solicitud.credential, metodo?.credencialLocal?.hash ?? null);

    let motivo: string | null = null;
    if (!metodo) motivo = 'IDENTIFICADOR_INEXISTENTE';
    else if (!metodo.credencialLocal) motivo = 'CREDENCIAL_SUPRIMIDA';
    else if (!coincide) motivo = 'CREDENCIAL_INCORRECTA';
    else if (!cuentaPermiteOperar(metodo.identidad.estadoOperativoDeCuenta as EstadoOperativoDeCuenta)) {
      motivo = `CUENTA_${metodo.identidad.estadoOperativoDeCuenta}`;
    }
    if (motivo !== null || !metodo) {
      await this.auditoria.registrar({
        operacion: 'API-ACC-02',
        resultado: 'RECHAZO',
        motivo,
        sujetoId: metodo?.identidadId ?? null,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      });
      throw errores.credencialesInvalidas();
    }

    const identidadId = metodo.identidadId;
    const emitida = await this.prisma.$transaction((tx) => this.abrirEn(tx, identidadId, ctx, 'API-ACC-02'));
    if ('estado' in emitida) {
      // El intento fallido también se audita (09v8 ACC-02: «failed attempts: REQUIRED»), igual que la rama principal.
      await this.auditoria.registrar({
        operacion: 'API-ACC-02',
        resultado: 'RECHAZO',
        motivo: `CUENTA_${emitida.estado}`,
        sujetoId: identidadId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      });
      throw errores.credencialesInvalidas();
    }
    return this.respuesta(identidadId, emitida);
  }

  /**
   * Abre la sesión de una identidad ya autenticada, dentro de `tx`, y la audita con `operacion` en la misma transacción.
   * La usan API-ACC-02 y la familia GOO (DL-138): una sesión abierta con Google es exactamente igual a la local.
   * Relee el estado con bloqueo compartido: serializa con CerrarCuenta/SuspenderCuenta (FOR NO KEY UPDATE). Si la cuenta
   * dejó de ser operativa entre la verificación y este punto, no se crea sesión y devuelve el estado encontrado.
   *
   * WP-ADMINISTRACION (DL-155): la clase de la sesión la decide el servidor con el rol, leído después del mismo bloqueo
   * (el comando que incorpora a un administrador toma la identidad en modo exclusivo).
   * - Una sesión PERSONAL (API-ACC-02, la familia GOO) no se abre para una identidad con el rol administrativo vigente:
   *   devuelve `ADMINISTRATIVA` y quien llama responde el 401 neutral. Una identidad administrativa no opera como persona
   *   ni como profesional.
   * - Una sesión ADMINISTRATIVA (API-ADM-01) se abre solo con el rol vigente (si no, `SIN_ROL_ADMINISTRATIVO`), dura 8 h
   *   (08 §26.2) y nace con su segundo factor pendiente, en la misma transacción.
   */
  async abrirEn(
    tx: Prisma.TransactionClient,
    identidadId: string,
    ctx: ContextoDeSolicitud,
    operacion: string,
    clase: ClaseDeSesion = 'PERSONAL',
  ): Promise<SesionAbierta | { readonly estado: EstadoOperativoDeCuenta | 'INEXISTENTE' | 'ADMINISTRATIVA' | 'SIN_ROL_ADMINISTRATIVO' }> {
    const [cuenta] = await tx.$queryRaw<{ estado: EstadoOperativoDeCuenta; administrativa: boolean }[]>`
      SELECT "estado_operativo_de_cuenta" AS "estado",
             EXISTS (SELECT 1 FROM "rol_administrativo" r WHERE r."identidad_id" = i."id" AND r."estado" = 'VIGENTE') AS "administrativa"
        FROM "identidad" i WHERE i."id" = ${identidadId}::uuid FOR SHARE OF i`;
    if (!cuenta || !cuentaPermiteOperar(cuenta.estado)) return { estado: cuenta?.estado ?? 'INEXISTENTE' };
    if (clase === 'PERSONAL' && cuenta.administrativa) return { estado: 'ADMINISTRATIVA' };
    if (clase === 'ADMINISTRATIVA' && !cuenta.administrativa) return { estado: 'SIN_ROL_ADMINISTRATIVO' };
    const duracion = clase === 'ADMINISTRATIVA' ? DURACION_DE_SESION_ADMINISTRATIVA_MS : DURACION_DE_SESION_MS;
    const expiraEn = new Date(ctx.momentoDeRecepcion.getTime() + duracion);
    const control = await tx.controlDeSesion.findUniqueOrThrow({ where: { identidadId } });
    const sesion = await tx.sesion.create({
      data: {
        identidadId,
        superficie: ctx.superficie,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
        expiraEn,
        versionDeControl: control.version,
        clase,
      },
    });
    if (clase === 'ADMINISTRATIVA') await tx.segundoFactorDeSesion.create({ data: { sesionId: sesion.id, identidadId } });
    await this.auditoria.registrar(
      {
        operacion,
        resultado: 'EXITO',
        actorId: identidadId,
        sujetoId: identidadId,
        recursoTipo: 'Sesion',
        recursoId: sesion.id,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
    return { sesionId: sesion.id, version: control.version, expiraEn };
  }

  /** La respuesta de API-ACC-02 para una sesión abierta: el Bearer firmado, de 12 h y sin renovación (DL-012). */
  respuesta(identidadId: string, sesion: SesionAbierta): IniciarSesionResponse {
    return {
      data: {
        session: {
          id: sesion.sesionId,
          expiresAt: sesion.expiraEn.toISOString(),
          renewable: false,
          accessToken: this.tokens.firmar({ sub: identidadId, sid: sesion.sesionId, tv: sesion.version }, sesion.expiraEn),
          tokenType: 'Bearer',
        },
        actor: { identityId: identidadId, accountOperationalState: 'OPERATIVA' },
      },
    };
  }

  /**
   * API-ACC-03 — «sesión actual queda inutilizable»; «repetir después de una pérdida de respuesta es semánticamente
   * idempotente» (09v8): una sesión reconocible pero ya finalizada, revocada o vencida responde igual 204
   * (DEUDA_LEGAJO DL-029). Ese no-op NO se audita como éxito: queda RECHAZO con motivo SESION_YA_NO_ACTIVA.
   */
  async finalizarActual(encabezadoAuthorization: string | undefined, ctx: ContextoDeSolicitud): Promise<void> {
    const token = extraerBearer(encabezadoAuthorization);
    if (!token) throw errores.autenticacionRequerida();
    const reclamos = this.tokens.verificar(token, true);
    await this.prisma.$transaction(async (tx) => {
      const sesion = await tx.sesion.findUnique({ where: { id: reclamos.sid }, select: { identidadId: true, estado: true } });
      if (!sesion || sesion.identidadId !== reclamos.sub) throw errores.sesionInvalida();
      // La finalización nunca queda antes del inicio de la sesión (T-06-24; CHECK sesion_cierre_coherente).
      const finalizadas = await tx.$executeRaw`
        UPDATE "sesion" SET "estado" = 'FINALIZADA',
               "momento_de_finalizacion" = GREATEST(${ctx.momentoDeRecepcion}::timestamptz, "momento_de_ocurrencia")
         WHERE "id" = ${reclamos.sid}::uuid AND "estado" = 'ACTIVA'`;
      await this.auditoria.registrar(
        {
          operacion: 'API-ACC-03',
          resultado: finalizadas > 0 ? 'EXITO' : 'RECHAZO',
          motivo: finalizadas > 0 ? null : 'SESION_YA_NO_ACTIVA',
          actorId: sesion.identidadId,
          sujetoId: sesion.identidadId,
          recursoTipo: 'Sesion',
          recursoId: reclamos.sid,
          superficie: ctx.superficie,
          requestId: ctx.requestId,
          momentoDeOcurrencia: ctx.momentoDeRecepcion,
        },
        tx,
      );
    });
  }

  /** API-ACC-04 — revoca todas las sesiones del titular, incluida la actual. «No cierra la cuenta.» */
  async revocarTodas(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const revocadas = await revocarSesiones(tx, actor.identidadId, 'REVOCACION_POR_TITULAR', ctx.momentoDeRecepcion);
      await this.auditoria.registrar(
        {
          operacion: 'API-ACC-04',
          resultado: 'EXITO',
          motivo: `SESIONES_REVOCADAS:${revocadas}`,
          actorId: actor.identidadId,
          sujetoId: actor.identidadId,
          superficie: ctx.superficie,
          requestId: ctx.requestId,
          momentoDeOcurrencia: ctx.momentoDeRecepcion,
        },
        tx,
      );
    });
  }
}

/**
 * Revocación server-side (08 §26.3): todas las sesiones ACTIVAS pasan a REVOCADA y el tokenVersion avanza, así
 * ningún token emitido antes vuelve a autenticar aunque no haya expirado (07 §43-bis A+B). Devuelve cuántas revocó.
 * La finalización es el mayor entre el momento de la revocación y el inicio de cada sesión: una sesión emitida mientras
 * la revocación esperaba el bloqueo no queda «finalizada antes de empezar» (T-06-24). Con las sesiones, se retiran los
 * teléfonos que reciben los avisos de la cuenta (DL-133).
 */
export async function revocarSesiones(
  tx: Prisma.TransactionClient,
  identidadId: string,
  motivo: MotivoDeRevocacionDeSesion,
  momento: Date,
): Promise<number> {
  const revocadas = await tx.$executeRaw`
    UPDATE "sesion" SET "estado" = 'REVOCADA',
           "motivo_de_revocacion" = ${motivo}::"MotivoDeRevocacionDeSesion",
           "momento_de_finalizacion" = GREATEST(${momento}::timestamptz, "momento_de_ocurrencia")
     WHERE "identidad_id" = ${identidadId}::uuid AND "estado" = 'ACTIVA'`;
  await tx.controlDeSesion.update({ where: { identidadId }, data: { version: { increment: 1 } } });
  // DL-133: sin sesiones, ningún teléfono sigue recibiendo los avisos de la cuenta (cerrar todas las sesiones, suspender o
  // cerrar la cuenta). La APK que los tenía activos los vuelve a registrar cuando la persona entra de nuevo.
  await tx.$executeRaw`
    UPDATE "suscripcion_push" SET "momento_de_baja" = GREATEST(${momento}::timestamptz, "momento_de_alta"), "motivo_de_baja" = 'RETIRADA'
     WHERE "identidad_id" = ${identidadId}::uuid AND "momento_de_baja" IS NULL`;
  return revocadas;
}
