import { Inject, Injectable } from '@nestjs/common';
import {
  CANTIDAD_DE_CODIGOS_DE_RECUPERACION,
  ConfirmarConfiguracionRequestSchema,
  IniciarConfiguracionRequestSchema,
  IniciarSesionAdministrativaRequestSchema,
  INTENTOS_DE_SEGUNDO_FACTOR_POR_SESION,
  RegenerarCodigosDeRecuperacionRequestSchema,
  UsarCodigoDeRecuperacionRequestSchema,
  VerificarSegundoFactorRequestSchema,
  VIGENCIA_DE_LA_CONFIGURACION_MS,
  cuentaPermiteOperar,
  estadoDelSegundoFactor,
  normalizarCodigoDeIncorporacion,
  normalizarCodigoDelAutenticador,
  normalizarCodigoDeRecuperacion,
  normalizarIdentificadorLocal,
  type CodigosDeRecuperacionResponse,
  type ConfiguracionConfirmadaResponse,
  type ConfiguracionDelAutenticadorResponse,
  type EstadoDeSesionAdministrativaResponse,
  type EstadoDelSegundoFactor,
  type EstadoDelSegundoFactorApi,
  type EstadoOperativoDeCuenta,
  type SegundoFactorVerificadoResponse,
  type SesionAdministrativaResponse,
} from '@be/domain';
import type { MetodoDeSegundoFactor, Prisma } from '@prisma/client';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { CredencialesService } from '../plataforma/credenciales.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { conReintento } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import { ReanudacionService } from '../sesion/reanudacion.service';
import { SesionService } from '../sesion/sesion.service';
import { extraerBearer, TokensService } from '../sesion/tokens.service';
import { METODO_API, type ActorAdministrativo } from './sesion-administrativa.guard';
import {
  cifrarSecreto,
  codigosDeRecuperacionNuevos,
  derivarClaves,
  descifrarSecreto,
  huellaDeIncorporacion,
  huellaDeRecuperacion,
  totpNuevo,
  validarCodigoTotp,
  EMISOR_TOTP,
  type ClavesDelSegundoFactor,
} from './segundo-factor';

type Tx = Prisma.TransactionClient;
const CASO_DE_USO = 'UC-ADM-02';

/** Lo que pasó con un código: se decide dentro de la transacción y se responde después de confirmarla. */
type Intento =
  | { readonly tipo: 'ok' }
  | { readonly tipo: 'invalido'; readonly restantes: number; readonly incorporacion: boolean }
  | { readonly tipo: 'agotado' }
  | { readonly tipo: 'plazo' }
  | { readonly tipo: 'paso'; readonly motivo: string };

/** El estado del segundo factor en el contrato. */
export function segundoFactorApi(e: EstadoDelSegundoFactor): EstadoDelSegundoFactorApi {
  switch (e.estado) {
    case 'VERIFICADO':
      return { state: 'VERIFIED', method: e.metodo, expiresAfterInactivityAt: e.venceSinActividadEn.toISOString() };
    case 'REQUERIDO':
      return { state: 'REQUIRED', deadline: e.plazo?.toISOString() ?? null };
    case 'CONFIGURACION_REQUERIDA':
      return { state: 'ENROLLMENT_REQUIRED', deadline: e.plazo.toISOString() };
    case 'PLAZO_VENCIDO':
      // No llega acá: una sesión con el plazo vencido no se presenta como vigente (ver `respuesta` y los pasos).
      return { state: 'REQUIRED', deadline: new Date(0).toISOString() };
  }
}

/**
 * UC-ADM-02 y UC-ADM-03 (WP-ADMINISTRACION, DL-155; 08 §25): el acceso a Administración con dos factores.
 * - **Primer factor** (API-ADM-01): la contraseña, con la misma neutralidad y los mismos cupos que el inicio de sesión
 *   común. Abre una sesión ADMINISTRATIVA que, sola, no lee ni decide nada.
 * - **Segundo factor** (API-ADM-05 y 06): un código del autenticador (TOTP) o uno de recuperación, de un solo uso. Cinco
 *   fallidos revocan la sesión; diez por identidad cada 15 minutos dan 429.
 * - **Configurar o reemplazar el autenticador** (API-ADM-07 y 08): la primera vez, con el código de incorporación que emitió
 *   el comando interno; para reemplazarlo, con el segundo factor vigente y la contraseña. Nunca queda la cuenta sin un
 *   autenticador activo: el anterior vale hasta que el nuevo se confirma.
 * - Cada paso se audita en la misma transacción, sin secretos ni códigos. La vigencia la decide el servidor.
 */
@Injectable()
export class AccesoAdministrativoService {
  private readonly claves: ClavesDelSegundoFactor | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly sesiones: SesionService,
    private readonly credenciales: CredencialesService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
    private readonly reanudaciones: ReanudacionService,
    @Inject(ENTORNO) entorno: Entorno,
  ) {
    this.claves = entorno.claveDelSegundoFactor ? derivarClaves(entorno.claveDelSegundoFactor) : null;
  }

  private exigirClaves(): ClavesDelSegundoFactor {
    if (!this.claves) throw errores.administracionNoDisponible();
    return this.claves;
  }

  // ─── API-ADM-01 ──────────────────────────────────────────────────────────────────────────────
  /**
   * El primer factor. Neutral como API-ACC-02: un correo inexistente, una contraseña incorrecta, una cuenta no operativa y
   * una identidad sin el rol administrativo hacen el mismo trabajo (una búsqueda, una verificación bcrypt, una auditoría) y
   * responden el mismo 401. La causa queda solo en la auditoría.
   */
  async iniciar(cuerpo: unknown, ctx: ContextoDeSolicitud, res: Response): Promise<SesionAdministrativaResponse> {
    this.exigirClaves();
    const pedido = validarCuerpo(IniciarSesionAdministrativaRequestSchema, cuerpo);
    const identificador = normalizarIdentificadorLocal(pedido.identifier);
    this.limitador.consumir('loginPorIp', ctx.direccionIp);
    this.limitador.consumir('loginAdministrativo', ctx.direccionIp, identificador);
    this.limitador.consumir('loginPorIdentificador', null, identificador);

    const metodo = await this.prisma.metodoDeAcceso.findUnique({
      where: { tipo_referencia: { tipo: 'LOCAL', referencia: identificador } },
      select: { identidadId: true, credencialLocal: { select: { hash: true } }, identidad: { select: { estadoOperativoDeCuenta: true } } },
    });
    const coincide = await this.credenciales.verificar(pedido.credential, metodo?.credencialLocal?.hash ?? null);
    let motivo: string | null = null;
    if (!metodo) motivo = 'IDENTIFICADOR_INEXISTENTE';
    else if (!metodo.credencialLocal) motivo = 'CREDENCIAL_SUPRIMIDA';
    else if (!coincide) motivo = 'CREDENCIAL_INCORRECTA';
    else if (!cuentaPermiteOperar(metodo.identidad.estadoOperativoDeCuenta as EstadoOperativoDeCuenta)) motivo = `CUENTA_${metodo.identidad.estadoOperativoDeCuenta}`;
    if (motivo !== null || !metodo) return this.rechazarPrimerFactor(motivo ?? 'IDENTIFICADOR_INEXISTENTE', metodo?.identidadId ?? null, ctx);

    const emitida = await this.prisma.$transaction((tx) => this.sesiones.abrirEn(tx, metodo.identidadId, ctx, 'API-ADM-01', 'ADMINISTRATIVA'));
    if ('estado' in emitida) return this.rechazarPrimerFactor(`CUENTA_${emitida.estado}`, metodo.identidadId, ctx);
    await this.reanudaciones.emitirAdministrativa(emitida.sesionId, emitida.expiraEn, ctx, res);
    return this.respuesta(metodo.identidadId, emitida.sesionId, emitida.version, emitida.expiraEn);
  }

  private async rechazarPrimerFactor(motivo: string, sujetoId: string | null, ctx: ContextoDeSolicitud): Promise<never> {
    await this.auditoria.registrar({
      operacion: 'API-ADM-01',
      resultado: 'RECHAZO',
      motivo,
      sujetoId,
      superficie: ctx.superficie,
      requestId: ctx.requestId,
      momentoDeOcurrencia: ctx.momentoDeRecepcion,
    });
    throw errores.credencialesInvalidas();
  }

  // ─── API-ADM-02 ──────────────────────────────────────────────────────────────────────────────
  /** Reanudar después de recargar: un token nuevo de la misma sesión y lo que el servidor dice de su segundo factor. */
  async reanudar(cookie: string | undefined, origen: string | undefined, ctx: ContextoDeSolicitud, res: Response): Promise<SesionAdministrativaResponse> {
    this.exigirClaves();
    const r = await this.reanudaciones.reanudarAdministrativa(cookie, origen, ctx, res);
    return this.respuesta(r.identidadId, r.sesionId, r.version, r.expiraEn);
  }

  /**
   * La respuesta de una sesión abierta o reanudada: el token firmado, el administrador y el estado de su segundo factor,
   * leídos ahora de la base. Una sesión cuyo plazo para el segundo factor venció, o sin el rol vigente, ya no sirve.
   */
  private async respuesta(identidadId: string, sesionId: string, version: number, expiraEn: Date): Promise<SesionAdministrativaResponse> {
    const fila = await this.prisma.sesion.findUnique({
      where: { id: sesionId },
      select: {
        momentoDeOcurrencia: true,
        segundoFactor: { select: { verificadoEn: true, metodo: true, ultimaActividad: true } },
        identidad: { select: { rolesAdministrativos: { where: { estado: 'VIGENTE' }, select: { nombreVisible: true } }, factoresTotp: { where: { estado: 'ACTIVO' }, select: { id: true } } } },
      },
    });
    const rol = fila?.identidad.rolesAdministrativos[0];
    if (!fila || !rol) throw errores.sesionInvalida();
    const estado = this.estadoDe(fila.momentoDeOcurrencia, fila.segundoFactor, fila.identidad.factoresTotp.length > 0);
    if (estado.estado === 'PLAZO_VENCIDO') throw errores.sesionExpirada();
    return {
      data: {
        session: { id: sesionId, expiresAt: expiraEn.toISOString(), accessToken: this.tokens.firmar({ sub: identidadId, sid: sesionId, tv: version }, expiraEn), tokenType: 'Bearer' },
        administrator: { identityId: identidadId, displayName: rol.nombreVisible },
        secondFactor: segundoFactorApi(estado),
      },
    };
  }

  private estadoDe(
    inicio: Date,
    factor: { verificadoEn: Date | null; metodo: MetodoDeSegundoFactor | null; ultimaActividad: Date | null } | null,
    tieneAutenticadorActivo: boolean,
  ): EstadoDelSegundoFactor {
    return estadoDelSegundoFactor({
      inicioDeLaSesion: inicio,
      verificadoEn: factor?.verificadoEn ?? null,
      metodo: factor?.metodo ? METODO_API[factor.metodo] : null,
      ultimaActividad: factor?.ultimaActividad ?? null,
      tieneAutenticadorActivo,
      ahora: new Date(),
    });
  }

  // ─── API-ADM-03 ──────────────────────────────────────────────────────────────────────────────
  /** Cerrar la sesión administrativa: idempotente (una ya cerrada responde igual), sin tocar otras sesiones. */
  async cerrar(encabezado: string | undefined, ctx: ContextoDeSolicitud): Promise<void> {
    const token = extraerBearer(encabezado);
    if (!token) throw errores.autenticacionRequerida();
    const reclamos = this.tokens.verificar(token, true);
    await this.prisma.$transaction(async (tx) => {
      const sesion = await tx.sesion.findUnique({ where: { id: reclamos.sid }, select: { identidadId: true, clase: true } });
      if (!sesion || sesion.identidadId !== reclamos.sub || sesion.clase !== 'ADMINISTRATIVA') throw errores.sesionInvalida();
      const finalizadas = await tx.$executeRaw`
        UPDATE "sesion" SET "estado" = 'FINALIZADA',
               "momento_de_finalizacion" = GREATEST(${ctx.momentoDeRecepcion}::timestamptz, "momento_de_ocurrencia")
         WHERE "id" = ${reclamos.sid}::uuid AND "estado" = 'ACTIVA'`;
      await this.auditar(tx, 'API-ADM-03', finalizadas > 0 ? 'EXITO' : 'RECHAZO', finalizadas > 0 ? null : 'SESION_YA_NO_ACTIVA', sesion.identidadId, reclamos.sid, ctx);
    });
  }

  // ─── API-ADM-04 ──────────────────────────────────────────────────────────────────────────────
  async estado(actor: ActorAdministrativo): Promise<EstadoDeSesionAdministrativaResponse> {
    if (actor.segundoFactor.estado === 'PLAZO_VENCIDO') throw errores.sesionExpirada();
    const restantes = actor.segundoFactor.estado === 'VERIFICADO' ? await this.codigosRestantes(this.prisma, actor.identidadId) : null;
    return {
      data: {
        session: { id: actor.sesionId, expiresAt: actor.expiraEn.toISOString() },
        administrator: { identityId: actor.identidadId, displayName: actor.nombreVisible },
        secondFactor: segundoFactorApi(actor.segundoFactor),
        recoveryCodesRemaining: restantes,
      },
    };
  }

  // ─── API-ADM-05 ──────────────────────────────────────────────────────────────────────────────
  async verificarCodigo(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<SegundoFactorVerificadoResponse> {
    const claves = this.exigirClaves();
    const pedido = validarCuerpo(VerificarSegundoFactorRequestSchema, cuerpo);
    this.limitador.consumir('segundoFactor', null, actor.identidadId);
    const intento = await conReintento(() =>
      this.prisma.$transaction(async (tx): Promise<Intento> => {
        const estado = await this.estadoBloqueado(tx, actor);
        if (estado.estado === 'PLAZO_VENCIDO') return { tipo: 'plazo' };
        if (estado.estado === 'CONFIGURACION_REQUERIDA') return { tipo: 'paso', motivo: 'SIN_AUTENTICADOR_ACTIVO' };
        const [factor] = await tx.$queryRaw<{ id: string; secreto: string; ultimoPaso: bigint | null }[]>`
          SELECT "id"::text AS "id", "secreto_cifrado" AS "secreto", "ultimo_paso" AS "ultimoPaso" FROM "factor_totp"
           WHERE "identidad_id" = ${actor.identidadId}::uuid AND "estado" = 'ACTIVO' FOR UPDATE`;
        const codigo = normalizarCodigoDelAutenticador(pedido.code);
        const secreto = factor ? descifrarSecreto(claves, factor.secreto, actor.identidadId) : null;
        const valido = codigo && secreto ? validarCodigoTotp(secreto, codigo, Date.now(), factor!.ultimoPaso) : null;
        if (!factor || !valido) return this.fallido(tx, actor, ctx, 'API-ADM-05', !codigo ? 'FORMA_INVALIDA' : !secreto ? 'SECRETO_ILEGIBLE' : 'CODIGO_INVALIDO_O_USADO');
        await tx.factorTotp.update({ where: { id: factor.id }, data: { ultimoPaso: valido.paso } });
        await this.marcarVerificado(tx, actor, 'TOTP');
        await this.auditar(tx, 'API-ADM-05', 'EXITO', null, actor.identidadId, actor.sesionId, ctx);
        return { tipo: 'ok' };
      }),
    );
    return this.resolverIntento(intento, actor);
  }

  // ─── API-ADM-06 ──────────────────────────────────────────────────────────────────────────────
  /** Un código de recuperación: vale una sola vez (lo marca usado en la misma transacción) y no desactiva el autenticador. */
  async usarCodigoDeRecuperacion(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<SegundoFactorVerificadoResponse> {
    const claves = this.exigirClaves();
    const pedido = validarCuerpo(UsarCodigoDeRecuperacionRequestSchema, cuerpo);
    this.limitador.consumir('segundoFactor', null, actor.identidadId);
    const intento = await conReintento(() =>
      this.prisma.$transaction(async (tx): Promise<Intento> => {
        const estado = await this.estadoBloqueado(tx, actor);
        if (estado.estado === 'PLAZO_VENCIDO') return { tipo: 'plazo' };
        if (estado.estado === 'CONFIGURACION_REQUERIDA') return { tipo: 'paso', motivo: 'SIN_AUTENTICADOR_ACTIVO' };
        const codigo = normalizarCodigoDeRecuperacion(pedido.recoveryCode);
        const usados = codigo
          ? await tx.codigoDeRecuperacion.updateMany({
              where: { identidadId: actor.identidadId, huella: huellaDeRecuperacion(claves, codigo), momentoDeUso: null, momentoDeInvalidacion: null },
              data: { momentoDeUso: new Date(), sesionDeUsoId: actor.sesionId },
            })
          : { count: 0 };
        if (usados.count !== 1) return this.fallido(tx, actor, ctx, 'API-ADM-06', !codigo ? 'FORMA_INVALIDA' : 'CODIGO_INVALIDO_O_USADO');
        await this.marcarVerificado(tx, actor, 'CODIGO_DE_RECUPERACION');
        await this.auditar(tx, 'API-ADM-06', 'EXITO', null, actor.identidadId, actor.sesionId, ctx);
        return { tipo: 'ok' };
      }),
    );
    return this.resolverIntento(intento, actor);
  }

  // ─── API-ADM-07 ──────────────────────────────────────────────────────────────────────────────
  /**
   * Empezar la configuración del autenticador.
   * - Sin uno activo: con el código de incorporación vigente (incorrecto, vencido, usado o anulado cuenta como intento
   *   fallido). Solo dentro de los 10 minutos de la contraseña.
   * - Con uno activo (reemplazarlo): con el segundo factor vigente y la contraseña otra vez (08 §25).
   * El secreto nuevo queda PENDIENTE, cifrado, atado a esta sesión, y vence a los 10 minutos; uno pendiente anterior se
   * descarta. Devuelve la clave y su URI una sola vez.
   */
  async iniciarConfiguracion(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ConfiguracionDelAutenticadorResponse> {
    const claves = this.exigirClaves();
    const pedido = validarCuerpo(IniciarConfiguracionRequestSchema, cuerpo);
    this.limitador.consumir('segundoFactor', null, actor.identidadId);
    const correo = await this.correoDe(actor.identidadId);
    const credencialCorrecta = pedido.credential !== undefined ? await this.contrasenaCorrecta(actor.identidadId, pedido.credential) : false;
    const nuevo = totpNuevo(correo);
    const resultado = await conReintento(() =>
      this.prisma.$transaction(async (tx): Promise<Intento | { tipo: 'configurando'; venceEn: Date }> => {
        const estado = await this.estadoBloqueado(tx, actor);
        if (estado.estado === 'PLAZO_VENCIDO') return { tipo: 'plazo' };
        const activo = await tx.factorTotp.findFirst({ where: { identidadId: actor.identidadId, estado: 'ACTIVO' }, select: { id: true } });
        if (!activo) {
          if (estado.estado !== 'CONFIGURACION_REQUERIDA') return { tipo: 'paso', motivo: 'ESTADO_DEL_SEGUNDO_FACTOR' };
          const codigo = pedido.incorporationCode !== undefined ? normalizarCodigoDeIncorporacion(pedido.incorporationCode) : null;
          const vigente = codigo
            ? await tx.codigoDeIncorporacion.findFirst({
                where: { identidadId: actor.identidadId, huella: huellaDeIncorporacion(codigo), momentoDeUso: null, momentoDeAnulacion: null, venceEn: { gt: new Date() } },
                select: { id: true },
              })
            : null;
          if (!vigente) return this.fallido(tx, actor, ctx, 'API-ADM-07', 'CODIGO_DE_INCORPORACION_INVALIDO', 'incorporacion');
        } else {
          if (estado.estado !== 'VERIFICADO') return { tipo: 'paso', motivo: 'REEMPLAZO_SIN_SEGUNDO_FACTOR' };
          if (!credencialCorrecta) return { tipo: 'paso', motivo: 'REEMPLAZO_CON_CONTRASENA_INCORRECTA' };
        }
        const ahora = new Date();
        await tx.factorTotp.updateMany({ where: { identidadId: actor.identidadId, estado: 'PENDIENTE' }, data: { estado: 'DESCARTADO', momentoDeBaja: ahora } });
        const venceEn = new Date(ahora.getTime() + VIGENCIA_DE_LA_CONFIGURACION_MS);
        await tx.factorTotp.create({
          data: {
            identidadId: actor.identidadId,
            secretoCifrado: cifrarSecreto(claves, nuevo.secreto, actor.identidadId),
            sesionDeConfiguracionId: actor.sesionId,
            venceEn,
            procedencia: procedenciaDe(ctx, CASO_DE_USO, 'API-ADM-07') as unknown as Prisma.InputJsonValue,
          },
        });
        await this.auditar(tx, 'API-ADM-07', 'EXITO', activo ? 'REEMPLAZO' : 'INCORPORACION', actor.identidadId, actor.sesionId, ctx);
        return { tipo: 'configurando', venceEn };
      }),
    );
    if (resultado.tipo === 'configurando') {
      return {
        data: { otpauthUri: nuevo.uri, secret: nuevo.secreto, issuer: EMISOR_TOTP, accountName: correo, algorithm: 'SHA1', digits: 6, periodSeconds: 30, expiresAt: resultado.venceEn.toISOString() },
      };
    }
    if (resultado.tipo === 'paso' && resultado.motivo === 'REEMPLAZO_CON_CONTRASENA_INCORRECTA') {
      await this.auditar(this.prisma, 'API-ADM-07', 'RECHAZO', resultado.motivo, actor.identidadId, actor.sesionId, ctx);
      throw errores.credencialesInvalidas();
    }
    return this.resolverIntento(resultado, actor) as never;
  }

  // ─── API-ADM-08 ──────────────────────────────────────────────────────────────────────────────
  /**
   * Confirmar la configuración con un código del autenticador nuevo. En una transacción: el pendiente pasa a ACTIVO (el
   * anterior, si había, a REEMPLAZADO), se consume el código de incorporación, los códigos de recuperación anteriores dejan
   * de valer y salen diez nuevos, y la sesión queda con el segundo factor vigente.
   */
  async confirmarConfiguracion(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ConfiguracionConfirmadaResponse> {
    const claves = this.exigirClaves();
    const pedido = validarCuerpo(ConfirmarConfiguracionRequestSchema, cuerpo);
    this.limitador.consumir('segundoFactor', null, actor.identidadId);
    const nuevos = codigosDeRecuperacionNuevos(CANTIDAD_DE_CODIGOS_DE_RECUPERACION);
    const resultado = await conReintento(() =>
      this.prisma.$transaction(async (tx): Promise<Intento> => {
        const estado = await this.estadoBloqueado(tx, actor);
        if (estado.estado === 'PLAZO_VENCIDO') return { tipo: 'plazo' };
        const [pendiente] = await tx.$queryRaw<{ id: string; secreto: string }[]>`
          SELECT "id"::text AS "id", "secreto_cifrado" AS "secreto" FROM "factor_totp"
           WHERE "identidad_id" = ${actor.identidadId}::uuid AND "estado" = 'PENDIENTE'
             AND "sesion_de_configuracion_id" = ${actor.sesionId}::uuid AND "vence_en" > now() FOR UPDATE`;
        if (!pendiente) return { tipo: 'paso', motivo: 'SIN_CONFIGURACION_PENDIENTE' };
        const activo = await tx.factorTotp.findFirst({ where: { identidadId: actor.identidadId, estado: 'ACTIVO' }, select: { id: true } });
        // Un reemplazo se confirma con el segundo factor todavía vigente: si venció mientras tanto, primero el código.
        if (activo && estado.estado !== 'VERIFICADO') return { tipo: 'paso', motivo: 'REEMPLAZO_SIN_SEGUNDO_FACTOR' };
        const codigo = normalizarCodigoDelAutenticador(pedido.code);
        const secreto = descifrarSecreto(claves, pendiente.secreto, actor.identidadId);
        const valido = codigo && secreto ? validarCodigoTotp(secreto, codigo, Date.now(), null) : null;
        if (!valido) return this.fallido(tx, actor, ctx, 'API-ADM-08', !codigo ? 'FORMA_INVALIDA' : 'CODIGO_INVALIDO');
        const ahora = new Date();
        if (activo) await tx.factorTotp.update({ where: { id: activo.id }, data: { estado: 'REEMPLAZADO', momentoDeBaja: ahora } });
        else {
          // La incorporación termina acá: el código vigente de la identidad queda usado.
          await tx.codigoDeIncorporacion.updateMany({ where: { identidadId: actor.identidadId, momentoDeUso: null, momentoDeAnulacion: null }, data: { momentoDeUso: ahora } });
        }
        await tx.factorTotp.update({ where: { id: pendiente.id }, data: { estado: 'ACTIVO', momentoDeActivacion: ahora, ultimoPaso: valido.paso } });
        await this.reemplazarCodigosDeRecuperacion(tx, claves, actor.identidadId, nuevos.map((c) => c.normalizado), ahora);
        await this.marcarVerificado(tx, actor, 'CONFIGURACION');
        await this.auditar(tx, 'API-ADM-08', 'EXITO', activo ? 'AUTENTICADOR_REEMPLAZADO' : 'AUTENTICADOR_CONFIGURADO', actor.identidadId, actor.sesionId, ctx);
        return { tipo: 'ok' };
      }),
    );
    if (resultado.tipo !== 'ok') return this.resolverIntento(resultado, actor) as never;
    const estado = await this.estadoActual(actor);
    return { data: { recoveryCodes: nuevos.map((c) => c.visible), secondFactor: segundoFactorApi(estado) } };
  }

  // ─── API-ADM-09 ──────────────────────────────────────────────────────────────────────────────
  /** Códigos de recuperación nuevos, con el segundo factor vigente (lo exige el guard) y la contraseña otra vez. */
  async regenerarCodigos(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<CodigosDeRecuperacionResponse> {
    const claves = this.exigirClaves();
    const pedido = validarCuerpo(RegenerarCodigosDeRecuperacionRequestSchema, cuerpo);
    this.limitador.consumir('segundoFactor', null, actor.identidadId);
    if (!(await this.contrasenaCorrecta(actor.identidadId, pedido.credential))) {
      await this.auditar(this.prisma, 'API-ADM-09', 'RECHAZO', 'CONTRASENA_INCORRECTA', actor.identidadId, actor.sesionId, ctx);
      throw errores.credencialesInvalidas();
    }
    const nuevos = codigosDeRecuperacionNuevos(CANTIDAD_DE_CODIGOS_DE_RECUPERACION);
    await conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        await this.reemplazarCodigosDeRecuperacion(tx, claves, actor.identidadId, nuevos.map((c) => c.normalizado), new Date());
        await this.auditar(tx, 'API-ADM-09', 'EXITO', null, actor.identidadId, actor.sesionId, ctx);
      }),
    );
    return { data: { recoveryCodes: nuevos.map((c) => c.visible) } };
  }

  // ─── Piezas comunes ──────────────────────────────────────────────────────────────────────────

  /** El estado del segundo factor con su fila tomada: dos pedidos de la misma sesión no cuentan intentos en paralelo. */
  private async estadoBloqueado(tx: Tx, actor: ActorAdministrativo): Promise<EstadoDelSegundoFactor> {
    const [fila] = await tx.$queryRaw<{ verificadoEn: Date | null; metodo: MetodoDeSegundoFactor | null; ultimaActividad: Date | null }[]>`
      SELECT "verificado_en" AS "verificadoEn", "metodo"::text AS "metodo", "ultima_actividad" AS "ultimaActividad"
        FROM "segundo_factor_de_sesion" WHERE "sesion_id" = ${actor.sesionId}::uuid FOR UPDATE`;
    if (!fila) throw errores.sesionInvalida();
    const activo = await tx.factorTotp.count({ where: { identidadId: actor.identidadId, estado: 'ACTIVO' } });
    return this.estadoDe(actor.inicioDeLaSesion, fila, activo > 0);
  }

  private async estadoActual(actor: ActorAdministrativo): Promise<EstadoDelSegundoFactor> {
    return this.prisma.$transaction((tx) => this.estadoBloqueado(tx, actor));
  }

  /** Un intento fallido: suma uno a la sesión y, con cinco, la revoca. Se confirma aunque el pedido termine en error. */
  private async fallido(tx: Tx, actor: ActorAdministrativo, ctx: ContextoDeSolicitud, operacion: string, motivo: string, clase?: 'incorporacion'): Promise<Intento> {
    const fila = await tx.segundoFactorDeSesion.update({ where: { sesionId: actor.sesionId }, data: { intentosFallidos: { increment: 1 } }, select: { intentosFallidos: true } });
    if (fila.intentosFallidos >= INTENTOS_DE_SEGUNDO_FACTOR_POR_SESION) {
      await tx.$executeRaw`
        UPDATE "sesion" SET "estado" = 'REVOCADA', "motivo_de_revocacion" = 'SEGUNDO_FACTOR_FALLIDO',
               "momento_de_finalizacion" = GREATEST(${new Date()}::timestamptz, "momento_de_ocurrencia")
         WHERE "id" = ${actor.sesionId}::uuid AND "estado" = 'ACTIVA'`;
      await this.auditar(tx, operacion, 'RECHAZO', `${motivo}:INTENTOS_AGOTADOS`, actor.identidadId, actor.sesionId, ctx);
      return { tipo: 'agotado' };
    }
    await this.auditar(tx, operacion, 'RECHAZO', motivo, actor.identidadId, actor.sesionId, ctx);
    return { tipo: 'invalido', restantes: INTENTOS_DE_SEGUNDO_FACTOR_POR_SESION - fila.intentosFallidos, incorporacion: clase === 'incorporacion' };
  }

  /** Después de confirmar la transacción: la respuesta de un intento, o su error. */
  private async resolverIntento(intento: Intento, actor: ActorAdministrativo): Promise<SegundoFactorVerificadoResponse> {
    switch (intento.tipo) {
      case 'ok': {
        const estado = await this.estadoActual(actor);
        return { data: { secondFactor: segundoFactorApi(estado), recoveryCodesRemaining: await this.codigosRestantes(this.prisma, actor.identidadId) } };
      }
      case 'invalido':
        throw intento.incorporacion ? errores.codigoDeIncorporacionInvalido(intento.restantes, 'CODIGO_DE_INCORPORACION_INVALIDO') : errores.codigoDeSegundoFactorInvalido(intento.restantes, 'CODIGO_INVALIDO');
      case 'agotado':
        throw errores.sesionRevocada();
      case 'plazo':
        throw errores.sesionExpirada();
      case 'paso':
        throw errores.pasoDeAccesoNoPermitido(intento.motivo);
    }
  }

  private async marcarVerificado(tx: Tx, actor: ActorAdministrativo, metodo: MetodoDeSegundoFactor): Promise<void> {
    const ahora = new Date();
    await tx.segundoFactorDeSesion.update({ where: { sesionId: actor.sesionId }, data: { verificadoEn: ahora, metodo, ultimaActividad: ahora, intentosFallidos: 0 } });
  }

  /** Los códigos sin usar del lote anterior dejan de valer; el lote nuevo los reemplaza. */
  private async reemplazarCodigosDeRecuperacion(tx: Tx, claves: ClavesDelSegundoFactor, identidadId: string, codigos: readonly string[], ahora: Date): Promise<void> {
    await tx.codigoDeRecuperacion.updateMany({ where: { identidadId, momentoDeUso: null, momentoDeInvalidacion: null }, data: { momentoDeInvalidacion: ahora } });
    const loteId = randomUUID();
    await tx.codigoDeRecuperacion.createMany({ data: codigos.map((c) => ({ identidadId, loteId, huella: huellaDeRecuperacion(claves, c) })) });
  }

  private codigosRestantes(cliente: Tx | PrismaService, identidadId: string): Promise<number> {
    return cliente.codigoDeRecuperacion.count({ where: { identidadId, momentoDeUso: null, momentoDeInvalidacion: null } });
  }

  private async correoDe(identidadId: string): Promise<string> {
    const metodo = await this.prisma.metodoDeAcceso.findFirst({ where: { identidadId, tipo: 'LOCAL' }, select: { referencia: true } });
    if (!metodo) throw errores.sesionInvalida();
    return metodo.referencia;
  }

  /** La contraseña otra vez, para reemplazar el autenticador o regenerar los códigos (08 §25: re-autenticación). */
  private async contrasenaCorrecta(identidadId: string, credencial: string): Promise<boolean> {
    const metodo = await this.prisma.metodoDeAcceso.findFirst({ where: { identidadId, tipo: 'LOCAL' }, select: { credencialLocal: { select: { hash: true } } } });
    return this.credenciales.verificar(credencial, metodo?.credencialLocal?.hash ?? null);
  }

  private auditar(cliente: Tx | PrismaService, operacion: string, resultado: 'EXITO' | 'RECHAZO', motivo: string | null, identidadId: string, sesionId: string, ctx: ContextoDeSolicitud): Promise<void> {
    return this.auditoria.registrar(
      {
        operacion,
        resultado,
        motivo,
        actorId: identidadId,
        sujetoId: identidadId,
        recursoTipo: 'Sesion',
        recursoId: sesionId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      cliente as Tx,
    );
  }
}

/** Para las pruebas: un error de la API es un rechazo de contrato, no una falla. */
export const esErrorDeContrato = (e: unknown): e is ErrorDeApi => e instanceof ErrorDeApi;
