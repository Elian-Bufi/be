import { Injectable } from '@nestjs/common';
import {
  actuaComoProfesional,
  decidirRetiro,
  decidirVinculoDeGoogle,
  googleParaVolverAVincular,
  metodosUtilizables,
  VENTANA_DE_STEP_UP_MS,
  VincularMetodoDeAccesoRequestSchema,
  type MetodosDeAccesoResponse,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { bloquearCorreoDeAcceso } from '../identidad/correo-de-acceso';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { CorreoService } from '../plataforma/correo.service';
import { CredencialesService } from '../plataforma/credenciales.service';
import { esUuid } from '../plataforma/ejecutor';
import { LimitadorService } from '../plataforma/limitador.service';
import { conReintento, esViolacionDeUnicidad, momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { avisarCambioDeMetodo, metodosDeLaCuenta, registrarHechoDelCambio, type MetodoLeido } from './metodos-de-la-cuenta';
import { CorreoDeGoogleNoVerificado, GoogleNoDisponible, TokenDeGoogleInvalido, VerificadorDeGoogle, type CuentaDeGoogle } from './verificador-de-google';

type Tx = Prisma.TransactionClient;
const CASO_DE_USO = 'UC-E06';

/** Los métodos como los ve la persona: los que sirven para entrar, la contraseña primero, y si puede vincular Google. */
export function metodosApi(metodos: readonly MetodoLeido[]): MetodosDeAccesoResponse {
  const utilizables = metodosUtilizables(metodos) as MetodoLeido[];
  return {
    data: {
      methods: utilizables.map((m) => ({
        methodId: m.id,
        type: m.tipo === 'LOCAL' ? 'PASSWORD' : 'GOOGLE',
        email: m.correo,
        linkedAt: m.desde.toISOString(),
        removable: decidirRetiro(metodos, m.id) === 'RETIRAR',
      })),
      canLinkGoogle: utilizables.some((m) => m.tipo === 'LOCAL') && !utilizables.some((m) => m.tipo === 'GOOGLE'),
      relinkableGoogleEmail: googleParaVolverAVincular(metodos)?.correo ?? null,
    },
  };
}

/**
 * RF-004 (DL-172; 05 UC-E06; 06 REG-06-21 y 22; 09 v0.12 §12): los métodos de acceso de la cuenta propia, familia MET.
 * - **API-MET-01** dice con qué se entra.
 * - **API-MET-02** vincula una cuenta de Google con sesión: verifica el ID token como API-GOO-01 y la contraseña de BE
 *   como API-GOO-02 (los mismos cupos, con el correo de acceso como identificador). Una cuenta de Google con otro correo
 *   pide una confirmación explícita. La que se había desvinculado se reasocia (una fila nueva, nunca una edición).
 * - **API-MET-03** desvincula Google con una entrada reciente (DL-017), si queda la contraseña. La base repite la regla
 *   (`cambio_de_metodo_de_acceso_guardar`): nunca queda una cuenta sin un método utilizable.
 * - **El segundo factor del profesional** (UF-11): una sesión con perfil profesional cambia sus métodos solo con él
 *   verificado. Una sesión robada sin el código no agrega una puerta de entrada ni saca la del titular.
 * Todo cambio queda auditado, con su rechazo y su motivo real; al cliente le llega solo el error del contrato. Cada
 * vínculo, reasociación o retiro deja su hecho de dominio (REG-06-21) y, confirmado, avisa al correo de acceso (D-11).
 */
@Injectable()
export class MetodosDeAccesoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verificador: VerificadorDeGoogle,
    private readonly credenciales: CredencialesService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
    private readonly correo: CorreoService,
  ) {}

  // ─── API-MET-01 ──────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado): Promise<MetodosDeAccesoResponse> {
    return metodosApi(await metodosDeLaCuenta(this.prisma, actor.identidadId));
  }

  // ─── API-MET-02 ──────────────────────────────────────────────────────────────────────────────
  async vincular(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<{ readonly estadoHttp: 200 | 201; readonly cuerpo: MetodosDeAccesoResponse }> {
    const OPERACION = 'API-MET-02';
    const pedido = validarCuerpo(VincularMetodoDeAccesoRequestSchema, cuerpo);
    await this.exigirSegundoFactor(actor, OPERACION, ctx);
    this.limitador.consumir('loginPorIp', ctx.direccionIp);
    const cuenta = await this.verificar(pedido.idToken, actor, OPERACION, ctx);

    // La re-autenticación: la contraseña de esta cuenta, con los cupos del login y el correo de acceso como identificador.
    const metodos = await metodosDeLaCuenta(this.prisma, actor.identidadId);
    const local = metodos.find((m) => m.tipo === 'LOCAL');
    if (local) {
      this.limitador.consumir('login', ctx.direccionIp, local.referencia);
      this.limitador.consumir('loginPorIdentificador', null, local.referencia);
    }
    const credencial = local ? await this.prisma.credencialLocal.findUnique({ where: { metodoDeAccesoId: local.id }, select: { hash: true } }) : null;
    const coincide = await this.credenciales.verificar(pedido.credential, credencial?.hash ?? null);
    if (local && credencial && !coincide) {
      return this.rechazar(OPERACION, errores.validacionFallida([{ code: 'CREDENTIAL_INCORRECT', path: 'credential' }]), actor, ctx, 'CREDENCIAL_INCORRECTA');
    }

    const procedencia = procedenciaDe(ctx, CASO_DE_USO, OPERACION) as unknown as Prisma.InputJsonValue;
    try {
      const resultado = await conReintento(() =>
        this.prisma.$transaction(async (tx) => {
          await bloquearCorreoDeAcceso(tx, cuenta.correo);
          const actuales = await metodosDeLaCuenta(tx, actor.identidadId);
          const delSub = await tx.metodoDeAcceso.findUnique({ where: { tipo_referencia: { tipo: 'GOOGLE', referencia: cuenta.sub } }, select: { identidadId: true } });
          const decision = decidirVinculoDeGoogle({
            metodos: actuales,
            sub: cuenta.sub,
            correoDeGoogle: cuenta.correo,
            subDeOtraIdentidad: delSub !== null && delSub.identidadId !== actor.identidadId,
            confirmaCorreoDistinto: pedido.confirmDifferentEmail === true,
          });
          switch (decision) {
            case 'YA_ESTA':
              return { estadoHttp: 200 as const, metodos: actuales, avisarA: null };
            case 'DE_OTRA_IDENTIDAD':
              throw new ConMotivo(errores.cuentaDeGoogleDeOtraCuenta(), 'GOOGLE_DE_OTRA_IDENTIDAD');
            case 'YA_TIENE_OTRA':
              throw new ConMotivo(errores.cuentaDeGoogleYaVinculada(), 'YA_TIENE_OTRA_CUENTA_DE_GOOGLE');
            case 'OTRA_ANTERIOR':
              throw new ConMotivo(errores.reemplazoDeGoogleNoDisponible(), 'TUVO_OTRA_CUENTA_DE_GOOGLE');
            case 'CORREO_DISTINTO':
              throw new ConMotivo(errores.correoDeGoogleDistinto(cuenta.correo), 'CORREO_DISTINTO_SIN_CONFIRMAR');
            case 'SIN_CONTRASENA':
              throw new ConMotivo(errores.validacionFallida([{ code: 'PASSWORD_NOT_AVAILABLE', path: 'credential' }]), 'SIN_CONTRASENA');
            case 'ASOCIAR':
              await this.asociar(tx, actor, cuenta, procedencia, ctx);
              break;
            case 'REASOCIAR': {
              const anterior = actuales.find((m) => m.tipo === 'GOOGLE' && m.referencia === cuenta.sub) as MetodoLeido;
              await this.registrarCambio(tx, actor, anterior, 'REASOCIACION', procedencia, ctx, OPERACION);
              break;
            }
          }
          // D-11: el aviso va al correo de acceso (el de la contraseña, que acá siempre está).
          const avisarA = actuales.find((m) => m.tipo === 'LOCAL')?.referencia ?? null;
          return { estadoHttp: 201 as const, metodos: await metodosDeLaCuenta(tx, actor.identidadId), avisarA };
        }),
      );
      if (resultado.avisarA) {
        avisarCambioDeMetodo(this.correo, { para: resultado.avisarA, cambio: 'VINCULADA', correoDeGoogle: cuenta.correo, momento: ctx.momentoDeRecepcion, operacion: OPERACION, requestId: ctx.requestId });
      }
      return { estadoHttp: resultado.estadoHttp, cuerpo: metodosApi(resultado.metodos) };
    } catch (e) {
      if (e instanceof ConMotivo) return this.rechazar(OPERACION, e.error, actor, ctx, e.motivo);
      // El correo de esa cuenta de Google es de otra identidad (el disparador `metodo_de_acceso_sin_identidad_paralela`).
      if (esViolacionDeUnicidad(e)) return this.rechazar(OPERACION, errores.cuentaDeGoogleDeOtraCuenta(), actor, ctx, 'CORREO_DE_OTRA_IDENTIDAD');
      throw e;
    }
  }

  // ─── API-MET-03 ──────────────────────────────────────────────────────────────────────────────
  async desvincular(actor: ActorAutenticado, metodoId: string, ctx: ContextoDeSolicitud): Promise<MetodosDeAccesoResponse> {
    const OPERACION = 'API-MET-03';
    await this.exigirSegundoFactor(actor, OPERACION, ctx);
    // SESSION_STEP_UP (DL-017): una entrada de los últimos 10 minutos, como para cerrar la cuenta.
    if (ctx.momentoDeRecepcion.getTime() - actor.momentoDeAutenticacion.getTime() > VENTANA_DE_STEP_UP_MS) {
      return this.rechazar(OPERACION, errores.stepUpRequerido(), actor, ctx, 'ENTRADA_NO_RECIENTE');
    }
    const id = esUuid(metodoId) ? metodoId.toLowerCase() : null;
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, OPERACION) as unknown as Prisma.InputJsonValue;
    try {
      const { metodos, retirado, avisarA } = await conReintento(() =>
        this.prisma.$transaction(async (tx) => {
          // El método se toma antes de decidir: dos retiros simultáneos se ordenan, y el segundo ya lo ve retirado.
          if (id) await tx.$queryRaw`SELECT 1 FROM "metodo_de_acceso" WHERE "id" = ${id}::uuid AND "identidad_id" = ${actor.identidadId}::uuid FOR UPDATE`;
          const actuales = await metodosDeLaCuenta(tx, actor.identidadId);
          const decision = id ? decidirRetiro(actuales, id) : 'NO_ESTA';
          if (decision === 'NO_ESTA') throw new ConMotivo(new ErrorDeApi(404, 'RESOURCE_NOT_FOUND', 'Recurso no encontrado.'), 'METODO_NO_ENCONTRADO');
          if (decision === 'LA_CONTRASENA_NO_SE_RETIRA') throw new ConMotivo(errores.validacionFallida([{ code: 'METHOD_NOT_REMOVABLE', path: 'methodId' }]), 'LA_CONTRASENA_NO_SE_RETIRA');
          if (decision === 'ULTIMO_METODO') throw new ConMotivo(errores.ultimoMetodoDeAcceso(), 'ULTIMO_METODO');
          const retirado = actuales.find((m) => m.id === id) as MetodoLeido;
          await this.registrarCambio(tx, actor, retirado, 'RETIRO', procedencia, ctx, OPERACION);
          const avisarA = actuales.find((m) => m.tipo === 'LOCAL')?.referencia ?? null;
          return { metodos: await metodosDeLaCuenta(tx, actor.identidadId), retirado, avisarA };
        }),
      );
      if (avisarA && retirado.correo) {
        avisarCambioDeMetodo(this.correo, { para: avisarA, cambio: 'DESVINCULADA', correoDeGoogle: retirado.correo, momento: ctx.momentoDeRecepcion, operacion: OPERACION, requestId: ctx.requestId });
      }
      return metodosApi(metodos);
    } catch (e) {
      if (e instanceof ConMotivo) return this.rechazar(OPERACION, e.error, actor, ctx, e.motivo, id);
      throw e;
    }
  }

  // ─── Piezas comunes ──────────────────────────────────────────────────────────────────────────

  /** UF-11: una sesión con perfil profesional cambia sus métodos solo con el segundo factor verificado en esa sesión. */
  private async exigirSegundoFactor(actor: ActorAutenticado, operacion: string, ctx: ContextoDeSolicitud): Promise<void> {
    if (actuaComoProfesional(actor.segundoFactor)) return;
    await this.rechazar(operacion, errores.segundoFactorRequerido(`SEGUNDO_FACTOR_${actor.segundoFactor.estado}`), actor, ctx, `MFA_REQUERIDO:${actor.segundoFactor.estado}`);
  }

  /** El ID token, como en API-GOO-01: un rechazo (token, correo sin verificar, Google no disponible) queda en la auditoría. */
  private async verificar(idToken: string, actor: ActorAutenticado, operacion: string, ctx: ContextoDeSolicitud): Promise<CuentaDeGoogle> {
    try {
      return await this.verificador.verificar(idToken);
    } catch (e) {
      if (e instanceof GoogleNoDisponible) return this.rechazar(operacion, errores.googleNoDisponible(e.motivo), actor, ctx, e.motivo);
      if (e instanceof TokenDeGoogleInvalido) return this.rechazar(operacion, errores.tokenDeGoogleInvalido(e.motivo), actor, ctx, `TOKEN_${e.motivo}`);
      if (e instanceof CorreoDeGoogleNoVerificado) return this.rechazar(operacion, errores.correoDeGoogleNoVerificado(), actor, ctx, 'CORREO_NO_VERIFICADO');
      throw e;
    }
  }

  /** REG-06-21: el método GOOGLE nuevo, el hecho `MetodoDeAccesoAsociado` y la auditoría (08 §24.6: evento crítico). */
  private async asociar(tx: Tx, actor: ActorAutenticado, cuenta: CuentaDeGoogle, procedencia: Prisma.InputJsonValue, ctx: ContextoDeSolicitud): Promise<void> {
    const metodo = await tx.metodoDeAcceso.create({
      data: { identidadId: actor.identidadId, tipo: 'GOOGLE', referencia: cuenta.sub, correo: cuenta.correo, procedencia, momentoDeOcurrencia: ctx.momentoDeRecepcion },
    });
    await tx.eventoDeDominio.create({
      data: {
        tipo: 'MetodoDeAccesoAsociado',
        identidadId: actor.identidadId,
        actorId: actor.identidadId,
        autoriaId: actor.identidadId,
        procedencia,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
        datos: { metodoDeAccesoId: metodo.id, tipo: 'GOOGLE' },
      },
    });
    await this.auditar(tx, 'API-MET-02', 'EXITO', 'METODO_GOOGLE_ASOCIADO', actor, metodo.id, ctx);
  }

  /**
   * REG-06-22: un retiro o una reasociación es una fila nueva (de solo agregar), con el número que sigue, su hecho de dominio
   * (REG-06-21: `MetodoDeAccesoRetirado`, o `MetodoDeAccesoAsociado` con `reasociacion`) y su auditoría.
   */
  private async registrarCambio(tx: Tx, actor: ActorAutenticado, metodo: MetodoLeido, accion: 'RETIRO' | 'REASOCIACION', procedencia: Prisma.InputJsonValue, ctx: ContextoDeSolicitud, operacion: string): Promise<void> {
    const momento = await momentoDeLaBase(tx);
    await tx.cambioDeMetodoDeAcceso.create({ data: { metodoDeAccesoId: metodo.id, identidadId: actor.identidadId, numero: metodo.cambios + 1, accion, procedencia, momentoDeRegistro: momento } });
    await registrarHechoDelCambio(tx, { identidadId: actor.identidadId, metodoId: metodo.id, accion, procedencia, momento: ctx.momentoDeRecepcion });
    await this.auditar(tx, operacion, 'EXITO', accion === 'RETIRO' ? 'METODO_GOOGLE_RETIRADO' : 'METODO_GOOGLE_REASOCIADO', actor, metodo.id, ctx);
  }

  private async rechazar(operacion: string, error: ErrorDeApi, actor: ActorAutenticado, ctx: ContextoDeSolicitud, motivo: string, recursoId: string | null = null): Promise<never> {
    await this.auditar(this.prisma, operacion, 'RECHAZO', motivo, actor, recursoId, ctx);
    throw error;
  }

  private auditar(cliente: Tx | PrismaService, operacion: string, resultado: 'EXITO' | 'RECHAZO', motivo: string, actor: ActorAutenticado, recursoId: string | null, ctx: ContextoDeSolicitud): Promise<void> {
    return this.auditoria.registrar(
      {
        operacion,
        resultado,
        motivo,
        actorId: actor.identidadId,
        sujetoId: actor.identidadId,
        recursoTipo: 'MetodoDeAcceso',
        recursoId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      cliente as Tx,
    );
  }
}

/** Un rechazo del contrato decidido dentro de la transacción, con su motivo real para la auditoría. */
class ConMotivo extends Error {
  constructor(
    readonly error: ErrorDeApi,
    readonly motivo: string,
  ) {
    super(error.code);
  }
}
