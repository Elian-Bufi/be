import { Inject, Injectable } from '@nestjs/common';
import {
  CANTIDAD_DE_CODIGOS_DE_RECUPERACION,
  ConfirmarConfiguracionRequestSchema,
  estadoDelSegundoFactorDelProfesional,
  FALLOS_SEGUIDOS_PARA_BLOQUEAR_EL_AUTENTICADOR,
  finDelInicioReciente,
  INTENTOS_DE_SEGUNDO_FACTOR_POR_SESION,
  normalizarCodigoDelAutenticador,
  normalizarCodigoDeRecuperacion,
  segundoFactorDelProfesionalApi,
  SinCuerpoDelSegundoFactorSchema,
  UsarCodigoDeRecuperacionRequestSchema,
  VerificarSegundoFactorRequestSchema,
  VIGENCIA_DE_LA_CONFIGURACION_MS,
  type CodigosDeRecuperacionResponse,
  type ConfiguracionDelAutenticadorResponse,
  type ConfiguracionDeLaSesionConfirmadaResponse,
  type EstadoDelSegundoFactorDelProfesional,
  type SegundoFactorDeLaSesionResponse,
  type SegundoFactorDeLaSesionVerificadoResponse,
} from '@be/domain';
import type { MetodoDeSegundoFactor, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { METODO_API } from '../administracion/sesion-administrativa.guard';
import {
  cifrarSecreto,
  codigosDeRecuperacionNuevos,
  derivarClaves,
  descifrarSecreto,
  EMISOR_TOTP,
  huellaDeRecuperacion,
  totpNuevo,
  validarCodigoTotp,
  type ClavesDelSegundoFactor,
} from '../administracion/segundo-factor';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { conReintento } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from './sesion.guard';

type Tx = Prisma.TransactionClient;
const CASO_DE_USO = 'UF-11';

/** Lo que pasó con un pedido: se decide dentro de la transacción y se responde después de confirmarla. */
type Intento =
  | { readonly tipo: 'ok' }
  | { readonly tipo: 'invalido'; readonly restantes: number }
  | { readonly tipo: 'agotado' }
  | { readonly tipo: 'bloqueado' }
  | { readonly tipo: 'paso'; readonly motivo: string };

/** La fila del segundo factor de la sesión, tomada, con el estado decidido con lo que hay en la base en este momento. */
interface FilaTomada {
  readonly estado: EstadoDelSegundoFactorDelProfesional;
  readonly inicioDeLaSesion: Date;
}

/**
 * UF-11 de WP-USO-FINAL (DL-169; UF-D12; 08 §25 y §42, condición 6): el segundo factor del profesional, familia MFA
 * (API-MFA-01 a 06), sobre la sesión común. Es el de Administración (DL-155): las mismas piezas de `segundo-factor.ts`
 * (TOTP cifrado con la clave del servidor, códigos de recuperación como HMAC), los mismos cupos y la misma auditoría,
 * sin secretos ni códigos. Lo que cambia:
 * - **La primera vez se configura sin un código de incorporación,** dentro de los 10 minutos de entrar: un token robado
 *   no alcanza para cargar otro autenticador. Pasado ese plazo, el profesional vuelve a entrar.
 * - **Reemplazar el autenticador o generar códigos nuevos** pide el segundo factor vigente y una entrada reciente: la
 *   re-autenticación de 08 §25, la misma con contraseña que con Google. Las otras sesiones de la identidad vuelven a pedir
 *   el código (no se cierran: pueden ser las de la app de la persona).
 * - **Cinco códigos fallidos en la sesión la revocan,** y diez seguidos en cualquier sesión bloquean el autenticador hasta
 *   que entra un código de recuperación. Diez intentos por identidad cada 15 minutos dan 429.
 * - **Sin perfil profesional no hay nada que configurar:** la persona no tiene segundo factor todavía (08 §25: opcional).
 * Que lo profesional lo exija en cada pedido lo deciden `SesionGuard` y `puedeActuarComoProfesional`.
 */
@Injectable()
export class SegundoFactorDeLaSesionService {
  private readonly claves: ClavesDelSegundoFactor | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
    @Inject(ENTORNO) entorno: Entorno,
  ) {
    this.claves = entorno.claveDelSegundoFactor ? derivarClaves(entorno.claveDelSegundoFactor) : null;
  }

  private exigirClaves(): ClavesDelSegundoFactor {
    if (!this.claves) throw errores.segundoFactorNoDisponible();
    return this.claves;
  }

  // ─── API-MFA-01 ──────────────────────────────────────────────────────────────────────────────
  /** El estado que decidió `SesionGuard` en este pedido, con los códigos que quedan y hasta cuándo la entrada es reciente. */
  async estado(actor: ActorAutenticado): Promise<SegundoFactorDeLaSesionResponse> {
    const restantes = actor.segundoFactor.estado === 'VERIFICADO' ? await this.codigosRestantes(this.prisma, actor.identidadId) : null;
    return { data: { secondFactor: segundoFactorDelProfesionalApi(actor.segundoFactor), recoveryCodesRemaining: restantes, recentSignInUntil: this.recienteHasta(actor.momentoDeAutenticacion) } };
  }

  // ─── API-MFA-02 ──────────────────────────────────────────────────────────────────────────────
  async verificar(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<SegundoFactorDeLaSesionVerificadoResponse> {
    const claves = this.exigirClaves();
    const pedido = validarCuerpo(VerificarSegundoFactorRequestSchema, cuerpo);
    await this.consumirIntento(actor, 'API-MFA-02', ctx);
    const intento = await conReintento(() =>
      this.prisma.$transaction(async (tx): Promise<Intento> => {
        const { estado } = await this.tomarLaFila(tx, actor);
        if (estado.estado === 'NO_REQUERIDO') return { tipo: 'paso', motivo: 'SIN_PERFIL_PROFESIONAL' };
        if (estado.estado === 'CONFIGURACION_REQUERIDA' || estado.estado === 'INICIO_RECIENTE_REQUERIDO') return { tipo: 'paso', motivo: 'SIN_AUTENTICADOR_ACTIVO' };
        const [factor] = await tx.$queryRaw<{ id: string; secreto: string; ultimoPaso: bigint | null; fallos: number }[]>`
          SELECT "id"::text AS "id", "secreto_cifrado" AS "secreto", "ultimo_paso" AS "ultimoPaso", "fallos_seguidos" AS "fallos" FROM "factor_totp"
           WHERE "identidad_id" = ${actor.identidadId}::uuid AND "estado" = 'ACTIVO' FOR UPDATE`;
        // Bloqueado por códigos que no valen, seguidos, en cualquier sesión: el código ni se evalúa.
        if (factor && factor.fallos >= FALLOS_SEGUIDOS_PARA_BLOQUEAR_EL_AUTENTICADOR) {
          await this.auditar(tx, 'API-MFA-02', 'RECHAZO', 'AUTENTICADOR_BLOQUEADO', actor, ctx);
          return { tipo: 'bloqueado' };
        }
        const codigo = normalizarCodigoDelAutenticador(pedido.code);
        const secreto = factor ? descifrarSecreto(claves, factor.secreto, actor.identidadId) : null;
        const valido = codigo && secreto && factor ? validarCodigoTotp(secreto, codigo, Date.now(), factor.ultimoPaso) : null;
        if (!factor || !valido) {
          if (factor && codigo) {
            const fallos = factor.fallos + 1;
            await tx.factorTotp.update({ where: { id: factor.id }, data: { fallosSeguidos: fallos } });
            if (fallos === FALLOS_SEGUIDOS_PARA_BLOQUEAR_EL_AUTENTICADOR) await this.auditar(tx, 'API-MFA-02', 'RECHAZO', 'AUTENTICADOR_BLOQUEADO_AHORA', actor, ctx);
          }
          return this.fallido(tx, actor, ctx, 'API-MFA-02', !codigo ? 'FORMA_INVALIDA' : !secreto ? 'SECRETO_ILEGIBLE' : 'CODIGO_INVALIDO_O_USADO');
        }
        await tx.factorTotp.update({ where: { id: factor.id }, data: { ultimoPaso: valido.paso, fallosSeguidos: 0 } });
        await this.marcarVerificada(tx, actor, 'TOTP');
        await this.auditar(tx, 'API-MFA-02', 'EXITO', null, actor, ctx);
        return { tipo: 'ok' };
      }),
    );
    return this.resolver(intento, actor, 'API-MFA-02', ctx);
  }

  // ─── API-MFA-03 ──────────────────────────────────────────────────────────────────────────────
  /** Un código de recuperación: vale una sola vez, desbloquea el autenticador y no lo desactiva. */
  async usarCodigoDeRecuperacion(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<SegundoFactorDeLaSesionVerificadoResponse> {
    const claves = this.exigirClaves();
    const pedido = validarCuerpo(UsarCodigoDeRecuperacionRequestSchema, cuerpo);
    await this.consumirIntento(actor, 'API-MFA-03', ctx);
    const intento = await conReintento(() =>
      this.prisma.$transaction(async (tx): Promise<Intento> => {
        const { estado } = await this.tomarLaFila(tx, actor);
        if (estado.estado === 'NO_REQUERIDO') return { tipo: 'paso', motivo: 'SIN_PERFIL_PROFESIONAL' };
        if (estado.estado === 'CONFIGURACION_REQUERIDA' || estado.estado === 'INICIO_RECIENTE_REQUERIDO') return { tipo: 'paso', motivo: 'SIN_AUTENTICADOR_ACTIVO' };
        const codigo = normalizarCodigoDeRecuperacion(pedido.recoveryCode);
        const usados = codigo
          ? await tx.codigoDeRecuperacion.updateMany({
              where: { identidadId: actor.identidadId, huella: huellaDeRecuperacion(claves, codigo), momentoDeUso: null, momentoDeInvalidacion: null },
              data: { momentoDeUso: new Date(), sesionDeUsoId: actor.sesionId },
            })
          : { count: 0 };
        if (usados.count !== 1) return this.fallido(tx, actor, ctx, 'API-MFA-03', !codigo ? 'FORMA_INVALIDA' : 'CODIGO_INVALIDO_O_USADO');
        const [factor] = await tx.$queryRaw<{ id: string; fallos: number }[]>`
          SELECT "id"::text AS "id", "fallos_seguidos" AS "fallos" FROM "factor_totp"
           WHERE "identidad_id" = ${actor.identidadId}::uuid AND "estado" = 'ACTIVO' FOR UPDATE`;
        if (factor && factor.fallos > 0) await tx.factorTotp.update({ where: { id: factor.id }, data: { fallosSeguidos: 0 } });
        await this.marcarVerificada(tx, actor, 'CODIGO_DE_RECUPERACION');
        const desbloqueo = factor && factor.fallos >= FALLOS_SEGUIDOS_PARA_BLOQUEAR_EL_AUTENTICADOR ? 'AUTENTICADOR_DESBLOQUEADO' : null;
        await this.auditar(tx, 'API-MFA-03', 'EXITO', desbloqueo, actor, ctx);
        return { tipo: 'ok' };
      }),
    );
    return this.resolver(intento, actor, 'API-MFA-03', ctx);
  }

  // ─── API-MFA-04 ──────────────────────────────────────────────────────────────────────────────
  /**
   * Empezar a configurar el autenticador: sin uno activo, dentro de los 10 minutos de entrar; para reemplazarlo, con el
   * segundo factor vigente y una entrada reciente. El secreto nuevo queda PENDIENTE, cifrado y atado a esta sesión, y
   * vence a los 10 minutos; uno pendiente anterior se descarta. La clave y su URI se devuelven una sola vez.
   */
  async iniciarConfiguracion(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ConfiguracionDelAutenticadorResponse> {
    const claves = this.exigirClaves();
    validarCuerpo(SinCuerpoDelSegundoFactorSchema, cuerpo ?? {});
    await this.consumirIntento(actor, 'API-MFA-04', ctx);
    const cuenta = await this.cuentaDelAutenticador(actor.identidadId);
    const nuevo = totpNuevo(cuenta);
    const resultado = await conReintento(() =>
      this.prisma.$transaction(async (tx): Promise<Intento | { tipo: 'configurando'; venceEn: Date }> => {
        // La identidad primero y en modo exclusivo (el orden único de bloqueos): dos configuraciones a la vez quedan una
        // después de la otra, y la segunda descarta el pendiente de la primera.
        await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" = ${actor.identidadId}::uuid FOR NO KEY UPDATE`;
        const { estado, inicioDeLaSesion } = await this.tomarLaFila(tx, actor);
        if (estado.estado === 'NO_REQUERIDO') return { tipo: 'paso', motivo: 'SIN_PERFIL_PROFESIONAL' };
        const ahora = new Date();
        const activo = await tx.factorTotp.findFirst({ where: { identidadId: actor.identidadId, estado: 'ACTIVO' }, select: { id: true } });
        if (!activo) {
          if (estado.estado !== 'CONFIGURACION_REQUERIDA') return { tipo: 'paso', motivo: 'INICIO_RECIENTE_REQUERIDO' };
        } else {
          if (estado.estado !== 'VERIFICADO') return { tipo: 'paso', motivo: 'REEMPLAZO_SIN_SEGUNDO_FACTOR' };
          if (ahora >= finDelInicioReciente(inicioDeLaSesion)) return { tipo: 'paso', motivo: 'INICIO_RECIENTE_REQUERIDO' };
        }
        await tx.factorTotp.updateMany({ where: { identidadId: actor.identidadId, estado: 'PENDIENTE' }, data: { estado: 'DESCARTADO', momentoDeBaja: ahora } });
        const venceEn = new Date(ahora.getTime() + VIGENCIA_DE_LA_CONFIGURACION_MS);
        await tx.factorTotp.create({
          data: {
            identidadId: actor.identidadId,
            secretoCifrado: cifrarSecreto(claves, nuevo.secreto, actor.identidadId),
            sesionDeConfiguracionId: actor.sesionId,
            venceEn,
            procedencia: procedenciaDe(ctx, CASO_DE_USO, 'API-MFA-04') as unknown as Prisma.InputJsonValue,
          },
        });
        await this.auditar(tx, 'API-MFA-04', 'EXITO', activo ? 'REEMPLAZO' : 'CONFIGURACION', actor, ctx);
        return { tipo: 'configurando', venceEn };
      }),
    );
    if (resultado.tipo !== 'configurando') return this.resolver(resultado, actor, 'API-MFA-04', ctx) as never;
    return {
      data: { otpauthUri: nuevo.uri, secret: nuevo.secreto, issuer: EMISOR_TOTP, accountName: cuenta, algorithm: 'SHA1', digits: 6, periodSeconds: 30, expiresAt: resultado.venceEn.toISOString() },
    };
  }

  // ─── API-MFA-05 ──────────────────────────────────────────────────────────────────────────────
  /**
   * Confirmar la configuración con un código del autenticador nuevo. En una transacción: el pendiente pasa a ACTIVO (el
   * anterior, si había, a REEMPLAZADO, y las otras sesiones de la identidad vuelven a pedir el código), los códigos de
   * recuperación anteriores dejan de valer y salen diez nuevos, y esta sesión queda verificada.
   */
  async confirmarConfiguracion(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ConfiguracionDeLaSesionConfirmadaResponse> {
    const claves = this.exigirClaves();
    const pedido = validarCuerpo(ConfirmarConfiguracionRequestSchema, cuerpo);
    await this.consumirIntento(actor, 'API-MFA-05', ctx);
    const nuevos = codigosDeRecuperacionNuevos(CANTIDAD_DE_CODIGOS_DE_RECUPERACION);
    const intento = await conReintento(() =>
      this.prisma.$transaction(async (tx): Promise<Intento> => {
        await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" = ${actor.identidadId}::uuid FOR SHARE`;
        const { estado } = await this.tomarLaFila(tx, actor);
        if (estado.estado === 'NO_REQUERIDO') return { tipo: 'paso', motivo: 'SIN_PERFIL_PROFESIONAL' };
        const [pendiente] = await tx.$queryRaw<{ id: string; secreto: string }[]>`
          SELECT "id"::text AS "id", "secreto_cifrado" AS "secreto" FROM "factor_totp"
           WHERE "identidad_id" = ${actor.identidadId}::uuid AND "estado" = 'PENDIENTE'
             AND "sesion_de_configuracion_id" = ${actor.sesionId}::uuid AND "vence_en" > now() FOR UPDATE`;
        if (!pendiente) return { tipo: 'paso', motivo: 'SIN_CONFIGURACION_PENDIENTE' };
        const activo = await tx.factorTotp.findFirst({ where: { identidadId: actor.identidadId, estado: 'ACTIVO' }, select: { id: true } });
        if (activo && estado.estado !== 'VERIFICADO') return { tipo: 'paso', motivo: 'REEMPLAZO_SIN_SEGUNDO_FACTOR' };
        const codigo = normalizarCodigoDelAutenticador(pedido.code);
        const secreto = descifrarSecreto(claves, pendiente.secreto, actor.identidadId);
        const valido = codigo && secreto ? validarCodigoTotp(secreto, codigo, Date.now(), null) : null;
        if (!valido) return this.fallido(tx, actor, ctx, 'API-MFA-05', !codigo ? 'FORMA_INVALIDA' : 'CODIGO_INVALIDO');
        const ahora = new Date();
        if (activo) {
          await tx.factorTotp.update({ where: { id: activo.id }, data: { estado: 'REEMPLAZADO', momentoDeBaja: ahora } });
          await this.otrasSesionesVuelvenAPedirElCodigo(tx, actor);
        }
        await tx.factorTotp.update({ where: { id: pendiente.id }, data: { estado: 'ACTIVO', momentoDeActivacion: ahora, ultimoPaso: valido.paso } });
        await this.reemplazarCodigos(tx, claves, actor.identidadId, nuevos.map((c) => c.normalizado), ahora);
        await this.marcarVerificada(tx, actor, 'CONFIGURACION');
        await this.auditar(tx, 'API-MFA-05', 'EXITO', activo ? 'AUTENTICADOR_REEMPLAZADO' : 'AUTENTICADOR_CONFIGURADO', actor, ctx);
        return { tipo: 'ok' };
      }),
    );
    if (intento.tipo !== 'ok') return this.resolver(intento, actor, 'API-MFA-05', ctx) as never;
    return { data: { recoveryCodes: nuevos.map((c) => c.visible), secondFactor: segundoFactorDelProfesionalApi(await this.estadoActual(actor)) } };
  }

  // ─── API-MFA-06 ──────────────────────────────────────────────────────────────────────────────
  /** Diez códigos nuevos, con el segundo factor vigente y una entrada reciente. Los anteriores dejan de valer. */
  async regenerarCodigos(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<CodigosDeRecuperacionResponse> {
    const claves = this.exigirClaves();
    validarCuerpo(SinCuerpoDelSegundoFactorSchema, cuerpo ?? {});
    await this.consumirIntento(actor, 'API-MFA-06', ctx);
    const nuevos = codigosDeRecuperacionNuevos(CANTIDAD_DE_CODIGOS_DE_RECUPERACION);
    const intento = await conReintento(() =>
      this.prisma.$transaction(async (tx): Promise<Intento> => {
        await tx.$queryRaw`SELECT 1 FROM "identidad" WHERE "id" = ${actor.identidadId}::uuid FOR NO KEY UPDATE`;
        const { estado, inicioDeLaSesion } = await this.tomarLaFila(tx, actor);
        if (estado.estado !== 'VERIFICADO') return { tipo: 'paso', motivo: `SEGUNDO_FACTOR_${estado.estado}` };
        if (new Date() >= finDelInicioReciente(inicioDeLaSesion)) return { tipo: 'paso', motivo: 'INICIO_RECIENTE_REQUERIDO' };
        await this.reemplazarCodigos(tx, claves, actor.identidadId, nuevos.map((c) => c.normalizado), new Date());
        await this.otrasSesionesVuelvenAPedirElCodigo(tx, actor);
        await this.auditar(tx, 'API-MFA-06', 'EXITO', null, actor, ctx);
        return { tipo: 'ok' };
      }),
    );
    if (intento.tipo !== 'ok') return this.resolver(intento, actor, 'API-MFA-06', ctx) as never;
    return { data: { recoveryCodes: nuevos.map((c) => c.visible) } };
  }

  // ─── Piezas comunes ──────────────────────────────────────────────────────────────────────────

  /**
   * La fila del segundo factor de esta sesión, tomada (FOR UPDATE): dos pedidos de la misma sesión no cuentan intentos en
   * paralelo. Se crea la primera vez, solo para una identidad con perfil profesional (lo exige también la base). Con la
   * fila tomada se vuelve a leer la sesión: una revocada mientras el pedido esperaba no sigue.
   */
  private async tomarLaFila(tx: Tx, actor: ActorAutenticado): Promise<FilaTomada> {
    const [sesion] = await tx.$queryRaw<{ estado: string; inicio: Date }[]>`
      SELECT "estado"::text AS "estado", "momento_de_ocurrencia" AS "inicio" FROM "sesion" WHERE "id" = ${actor.sesionId}::uuid FOR SHARE`;
    if (!sesion || sesion.estado !== 'ACTIVA') throw errores.sesionRevocada();
    const perfil = await tx.perfilProfesional.findUnique({ where: { identidadId: actor.identidadId }, select: { id: true } });
    if (!perfil) return { estado: { estado: 'NO_REQUERIDO' }, inicioDeLaSesion: sesion.inicio };
    await tx.$executeRaw`
      INSERT INTO "segundo_factor_de_sesion" ("sesion_id", "identidad_id") VALUES (${actor.sesionId}::uuid, ${actor.identidadId}::uuid)
      ON CONFLICT ("sesion_id") DO NOTHING`;
    const [fila] = await tx.$queryRaw<{ verificadoEn: Date | null; metodo: MetodoDeSegundoFactor | null; intentosFallidos: number }[]>`
      SELECT "verificado_en" AS "verificadoEn", "metodo"::text AS "metodo", "intentos_fallidos" AS "intentosFallidos"
        FROM "segundo_factor_de_sesion" WHERE "sesion_id" = ${actor.sesionId}::uuid FOR UPDATE`;
    if (!fila || fila.intentosFallidos >= INTENTOS_DE_SEGUNDO_FACTOR_POR_SESION) throw errores.sesionRevocada();
    const activos = await tx.factorTotp.count({ where: { identidadId: actor.identidadId, estado: 'ACTIVO' } });
    const estado = estadoDelSegundoFactorDelProfesional({
      esProfesional: true,
      inicioDeLaSesion: sesion.inicio,
      verificadoEn: fila.verificadoEn,
      metodo: fila.metodo ? METODO_API[fila.metodo] : null,
      tieneAutenticadorActivo: activos > 0,
      ahora: new Date(),
    });
    return { estado, inicioDeLaSesion: sesion.inicio };
  }

  /** El estado después de confirmar la transacción, para la respuesta. */
  private async estadoActual(actor: ActorAutenticado): Promise<EstadoDelSegundoFactorDelProfesional> {
    const fila = await this.prisma.sesion.findUnique({
      where: { id: actor.sesionId },
      select: {
        momentoDeOcurrencia: true,
        segundoFactor: { select: { verificadoEn: true, metodo: true } },
        identidad: { select: { perfilProfesional: { select: { id: true } }, factoresTotp: { where: { estado: 'ACTIVO' }, select: { id: true } } } },
      },
    });
    if (!fila) throw errores.sesionInvalida();
    return estadoDelSegundoFactorDelProfesional({
      esProfesional: fila.identidad.perfilProfesional !== null,
      inicioDeLaSesion: fila.momentoDeOcurrencia,
      verificadoEn: fila.segundoFactor?.verificadoEn ?? null,
      metodo: fila.segundoFactor?.metodo ? METODO_API[fila.segundoFactor.metodo] : null,
      tieneAutenticadorActivo: fila.identidad.factoresTotp.length > 0,
      ahora: new Date(),
    });
  }

  /** Un intento fallido: suma uno a la sesión y, con cinco, la revoca. Se confirma aunque el pedido termine en error. */
  private async fallido(tx: Tx, actor: ActorAutenticado, ctx: ContextoDeSolicitud, operacion: string, motivo: string): Promise<Intento> {
    const fila = await tx.segundoFactorDeSesion.update({ where: { sesionId: actor.sesionId }, data: { intentosFallidos: { increment: 1 } }, select: { intentosFallidos: true } });
    if (fila.intentosFallidos >= INTENTOS_DE_SEGUNDO_FACTOR_POR_SESION) {
      await tx.$executeRaw`
        UPDATE "sesion" SET "estado" = 'REVOCADA', "motivo_de_revocacion" = 'SEGUNDO_FACTOR_FALLIDO',
               "momento_de_finalizacion" = GREATEST(${new Date()}::timestamptz, "momento_de_ocurrencia")
         WHERE "id" = ${actor.sesionId}::uuid AND "estado" = 'ACTIVA'`;
      await this.auditar(tx, operacion, 'RECHAZO', `${motivo}:INTENTOS_AGOTADOS`, actor, ctx);
      return { tipo: 'agotado' };
    }
    await this.auditar(tx, operacion, 'RECHAZO', motivo, actor, ctx);
    return { tipo: 'invalido', restantes: INTENTOS_DE_SEGUNDO_FACTOR_POR_SESION - fila.intentosFallidos };
  }

  /** Después de confirmar la transacción: la respuesta de un intento, o su error. Un paso que no corresponde queda auditado. */
  private async resolver(intento: Intento, actor: ActorAutenticado, operacion: string, ctx: ContextoDeSolicitud): Promise<SegundoFactorDeLaSesionVerificadoResponse> {
    switch (intento.tipo) {
      case 'ok':
        return { data: { secondFactor: segundoFactorDelProfesionalApi(await this.estadoActual(actor)), recoveryCodesRemaining: await this.codigosRestantes(this.prisma, actor.identidadId) } };
      case 'invalido':
        throw errores.codigoDeSegundoFactorInvalido(intento.restantes, 'CODIGO_INVALIDO');
      case 'agotado':
        throw errores.sesionRevocada();
      case 'bloqueado':
        throw errores.autenticadorBloqueado();
      case 'paso':
        await this.auditar(this.prisma, operacion, 'RECHAZO', `PASO_NO_PERMITIDO:${intento.motivo}`, actor, ctx);
        throw errores.pasoDeAccesoNoPermitido(intento.motivo);
    }
  }

  private async marcarVerificada(tx: Tx, actor: ActorAutenticado, metodo: MetodoDeSegundoFactor): Promise<void> {
    const ahora = new Date();
    await tx.segundoFactorDeSesion.update({ where: { sesionId: actor.sesionId }, data: { verificadoEn: ahora, metodo, ultimaActividad: ahora, intentosFallidos: 0 } });
  }

  /**
   * Las otras sesiones de la identidad dejan de tener el segundo factor verificado: al reemplazar el autenticador o al
   * generar códigos nuevos, lo que pudo haberse filtrado deja de abrir lo profesional. No se cierran: pueden ser las de la
   * app de la persona, que siguen sirviendo para lo suyo.
   */
  private otrasSesionesVuelvenAPedirElCodigo(tx: Tx, actor: ActorAutenticado): Promise<number> {
    return tx.$executeRaw`
      UPDATE "segundo_factor_de_sesion" SET "verificado_en" = NULL, "metodo" = NULL
       WHERE "identidad_id" = ${actor.identidadId}::uuid AND "sesion_id" <> ${actor.sesionId}::uuid AND "verificado_en" IS NOT NULL`;
  }

  /** Los códigos sin usar del lote anterior dejan de valer; el lote nuevo los reemplaza. Quien llama tiene tomada la identidad. */
  private async reemplazarCodigos(tx: Tx, claves: ClavesDelSegundoFactor, identidadId: string, codigos: readonly string[], ahora: Date): Promise<void> {
    await tx.codigoDeRecuperacion.updateMany({ where: { identidadId, momentoDeUso: null, momentoDeInvalidacion: null }, data: { momentoDeInvalidacion: ahora } });
    const loteId = randomUUID();
    await tx.codigoDeRecuperacion.createMany({ data: codigos.map((c) => ({ identidadId, loteId, huella: huellaDeRecuperacion(claves, c) })) });
  }

  private codigosRestantes(cliente: Tx | PrismaService, identidadId: string): Promise<number> {
    return cliente.codigoDeRecuperacion.count({ where: { identidadId, momentoDeUso: null, momentoDeInvalidacion: null } });
  }

  /** Hasta cuándo la entrada de esta sesión es reciente; `null` si ya pasó. */
  private recienteHasta(inicioDeLaSesion: Date): string | null {
    const fin = finDelInicioReciente(inicioDeLaSesion);
    return fin > new Date() ? fin.toISOString() : null;
  }

  /** El nombre de la cuenta en la app de códigos: el correo de la cuenta (el local o el que verificó Google). */
  private async cuentaDelAutenticador(identidadId: string): Promise<string> {
    const metodos = await this.prisma.metodoDeAcceso.findMany({ where: { identidadId }, select: { tipo: true, referencia: true, correo: true } });
    const local = metodos.find((m) => m.tipo === 'LOCAL');
    if (local) return local.referencia;
    return metodos.find((m) => m.tipo === 'GOOGLE')?.correo ?? 'BE';
  }

  /** El cupo de intentos por identidad (429). El rechazo también queda en la auditoría, sin el código. */
  private async consumirIntento(actor: ActorAutenticado, operacion: string, ctx: ContextoDeSolicitud): Promise<void> {
    try {
      this.limitador.consumir('segundoFactor', null, actor.identidadId);
    } catch (e) {
      await this.auditar(this.prisma, operacion, 'RECHAZO', 'LIMITE_DE_INTENTOS', actor, ctx);
      throw e;
    }
  }

  private auditar(cliente: Tx | PrismaService, operacion: string, resultado: 'EXITO' | 'RECHAZO', motivo: string | null, actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<void> {
    return this.auditoria.registrar(
      {
        operacion,
        resultado,
        motivo,
        actorId: actor.identidadId,
        sujetoId: actor.identidadId,
        recursoTipo: 'Sesion',
        recursoId: actor.sesionId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      cliente as Tx,
    );
  }
}
