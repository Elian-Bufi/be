import { Inject, Injectable, Logger } from '@nestjs/common';
import { cuentaPermiteOperar, type EstadoOperativoDeCuenta, type IniciarSesionResponse } from '@be/domain';
import type { ClaseDeSesion, Prisma } from '@prisma/client';
import type { Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { PrismaService } from '../prisma/prisma.service';
import { SesionService } from './sesion.service';

/**
 * DL-147 — La sesión del website sobrevive a una recarga (encargo de consolidación de Dirección del 2026-10-19, bloque 3).
 * Es el «refresh rotativo» que el 07 prevé para el website (07:789 y §43-bis: «cookie httpOnly para web»).
 *
 * **Por qué una cookie de la API, y con qué atributos.** El website (be-web-…onrender.com) y la API (be-api-…onrender.com)
 * son sitios distintos: `onrender.com` está en la lista de sufijos públicos. Una cookie de la API es de terceros para el
 * website, así que va `SameSite=None; Secure` y `Partitioned` (CHIPS): el navegador la guarda en la partición del website
 * y la manda solo a pedidos que salen de él, aunque bloquee las cookies de terceros sin partición. Es `HttpOnly`: el
 * JavaScript del website nunca la ve. Su ruta es /api/v1/auth/sessions, así que no viaja con ningún otro pedido.
 *
 * **Qué autoriza.** Solo reanudar: recibir un token nuevo de la MISMA sesión, que vence cuando ella vence. Los datos se
 * siguen pidiendo con el Bearer en memoria, así que ninguna operación de datos se autentica con la cookie y no hay
 * superficie de CSRF en ellas. La reanudación exige la cabecera `X-BE-Surface: WEB` (fuerza la verificación previa de
 * CORS) y, con una lista de orígenes configurada, un `Origin` de esa lista.
 *
 * **Rotación.** Cada reanudación cambia el secreto y agrega una fila que reemplaza a la anterior. Dos pestañas que recargan
 * a la vez presentan el mismo secreto: la segunda llega con uno ya reemplazado y vale dentro del margen de gracia, sin
 * rotar otra vez. Fuera del margen, un secreto reemplazado es una copia: la sesión se revoca (REANUDACION_REUTILIZADA).
 *
 * **El servidor decide.** Una sesión finalizada, revocada, vencida, de otra superficie, con otra versión de control o de
 * una cuenta que ya no opera no se reanuda: restaurar la sesión nunca restaura un permiso que ya no está.
 *
 * **WP-ADMINISTRACION (DL-155): dos perfiles.** La sesión común usa la cookie de siempre; la administrativa, una propia
 * (`__Secure-be-admin-reanudacion`, solo para /api/v1/admin/auth/sessions). Cada cookie reanuda solo una sesión de su
 * clase: la de Administración no da una sesión común ni al revés. Reanudar una sesión administrativa no toca su segundo
 * factor: su vigencia la dice el servidor con lo que guarda (`SegundoFactorDeSesion`).
 */
export const COOKIE_DE_REANUDACION = '__Secure-be-reanudacion';
export const RUTA_DE_LA_COOKIE = '/api/v1/auth/sessions';
/** Dos pestañas que recargan a la vez: la segunda llega con el secreto que la primera acaba de reemplazar. */
export const MARGEN_DE_GRACIA_MS = 2 * 60 * 1000;

/** La cookie, su ruta, la clase de sesión que reanuda y la operación con que se audita. */
export interface PerfilDeReanudacion {
  readonly cookie: string;
  readonly ruta: string;
  readonly clase: ClaseDeSesion;
  readonly operacion: string;
}

export const PERFIL_PERSONAL: PerfilDeReanudacion = { cookie: COOKIE_DE_REANUDACION, ruta: RUTA_DE_LA_COOKIE, clase: 'PERSONAL', operacion: 'API-ACC-02-REANUDACION' };
export const PERFIL_ADMINISTRATIVO: PerfilDeReanudacion = {
  cookie: '__Secure-be-admin-reanudacion',
  ruta: '/api/v1/admin/auth/sessions',
  clase: 'ADMINISTRATIVA',
  operacion: 'API-ADM-02',
};

const SECRETO = /^[A-Za-z0-9_-]{43}$/;
const huellaDe = (secreto: string): string => createHash('sha256').update(secreto).digest('hex');
const secretoNuevo = (): string => randomBytes(32).toString('base64url');

/** El secreto de la cookie de reanudación, si viene y tiene la forma de uno. */
export function secretoDeLaCookie(encabezado: string | undefined, nombre: string = COOKIE_DE_REANUDACION): string | null {
  if (!encabezado) return null;
  for (const parte of encabezado.split(';')) {
    const igual = parte.indexOf('=');
    if (igual < 0 || parte.slice(0, igual).trim() !== nombre) continue;
    const valor = parte.slice(igual + 1).trim();
    return SECRETO.test(valor) ? valor : null;
  }
  return null;
}

const atributos = (perfil: PerfilDeReanudacion) => ({ httpOnly: true, secure: true, sameSite: 'none', partitioned: true, path: perfil.ruta }) as const;

/** La cookie dura lo que le queda a la sesión, nunca más. */
export function ponerCookieDeReanudacion(res: Response, secreto: string, expiraEn: Date, ahora: Date, perfil: PerfilDeReanudacion = PERFIL_PERSONAL): void {
  res.cookie(perfil.cookie, secreto, { ...atributos(perfil), maxAge: Math.max(0, expiraEn.getTime() - ahora.getTime()) });
}

/** Con los mismos atributos: si no, el navegador no la reconoce como la misma (sobre todo `Partitioned` y la ruta). */
export function borrarCookieDeReanudacion(res: Response, perfil: PerfilDeReanudacion = PERFIL_PERSONAL): void {
  res.clearCookie(perfil.cookie, atributos(perfil));
}

type Rechazo = 'SESION_NO_ACTIVA' | 'SESION_VENCIDA' | 'SESION_NO_VIGENTE' | 'REANUDACION_DESCONOCIDA' | 'REANUDACION_REUTILIZADA';
type Resultado =
  | { readonly tipo: 'reanudada'; readonly identidadId: string; readonly sesionId: string; readonly version: number; readonly expiraEn: Date; readonly secreto: string | null }
  | { readonly tipo: 'rechazada'; readonly motivo: Rechazo; readonly identidadId: string | null; readonly sesionId: string | null };

/** Una sesión reanudada: lo que hace falta para firmar el token nuevo. */
export interface SesionReanudada {
  readonly identidadId: string;
  readonly sesionId: string;
  readonly version: number;
  readonly expiraEn: Date;
}

@Injectable()
export class ReanudacionService {
  private readonly registro = new Logger(ReanudacionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sesiones: SesionService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
    @Inject(ENTORNO) private readonly entorno: Entorno,
  ) {}

  /**
   * Al abrir una sesión del website (API-ACC-02 y la familia GOO): el primer secreto, en la cookie. La APK no lo recibe:
   * guarda su token en el almacenamiento seguro del teléfono (DL-012). Si no se pudiera guardar, la sesión sigue igual,
   * sin reanudación: recargar pediría entrar de nuevo, como antes de DL-147.
   */
  async emitir(respuesta: IniciarSesionResponse, ctx: ContextoDeSolicitud, res: Response): Promise<void> {
    await this.emitirCon(PERFIL_PERSONAL, respuesta.data.session.id, new Date(respuesta.data.session.expiresAt), ctx, res);
  }

  /** WP-ADMINISTRACION: el primer secreto de una sesión administrativa del website (API-ADM-01), en su propia cookie. */
  async emitirAdministrativa(sesionId: string, expiraEn: Date, ctx: ContextoDeSolicitud, res: Response): Promise<void> {
    await this.emitirCon(PERFIL_ADMINISTRATIVO, sesionId, expiraEn, ctx, res);
  }

  private async emitirCon(perfil: PerfilDeReanudacion, sesionId: string, expiraEn: Date, ctx: ContextoDeSolicitud, res: Response): Promise<void> {
    if (ctx.superficie !== 'WEB') return;
    const secreto = secretoNuevo();
    try {
      await this.prisma.reanudacionDeSesion.create({ data: { sesionId, huella: huellaDe(secreto), momentoDeRegistro: ctx.momentoDeRecepcion } });
    } catch (e) {
      this.registro.warn(`sin reanudación para la sesión (requestId ${ctx.requestId ?? '-'}): ${e instanceof Error ? e.message.slice(0, 200) : 'error'}`);
      return;
    }
    ponerCookieDeReanudacion(res, secreto, expiraEn, ctx.momentoDeRecepcion, perfil);
  }

  /** API-ACC-02-REANUDACION. Un rechazo es neutral y borra la cookie: no dice si el secreto existió. */
  async reanudar(cookie: string | undefined, origen: string | undefined, ctx: ContextoDeSolicitud, res: Response): Promise<IniciarSesionResponse> {
    const r = await this.reanudarCon(PERFIL_PERSONAL, cookie, origen, ctx, res);
    return this.sesiones.respuesta(r.identidadId, { sesionId: r.sesionId, version: r.version, expiraEn: r.expiraEn });
  }

  /** API-ADM-02 (WP-ADMINISTRACION): lo mismo para la sesión administrativa; la respuesta la arma Administración. */
  reanudarAdministrativa(cookie: string | undefined, origen: string | undefined, ctx: ContextoDeSolicitud, res: Response): Promise<SesionReanudada> {
    return this.reanudarCon(PERFIL_ADMINISTRATIVO, cookie, origen, ctx, res);
  }

  private async reanudarCon(perfil: PerfilDeReanudacion, cookie: string | undefined, origen: string | undefined, ctx: ContextoDeSolicitud, res: Response): Promise<SesionReanudada> {
    this.limitador.consumir('reanudacion', ctx.direccionIp);
    const permitidos = this.entorno.corsAllowedOrigins;
    if (ctx.superficie !== 'WEB' || (permitidos.length > 0 && origen !== undefined && !permitidos.includes(origen))) throw errores.autenticacionRequerida();
    const secreto = secretoDeLaCookie(cookie, perfil.cookie);
    if (!secreto) {
      // Una cookie con otra forma se borra; sin cookie no hay nada que borrar ni que auditar: es la primera visita.
      if (cookie?.includes(perfil.cookie)) borrarCookieDeReanudacion(res, perfil);
      throw errores.autenticacionRequerida();
    }

    const resultado = await this.prisma.$transaction((tx) => this.reanudarEn(tx, perfil, huellaDe(secreto), ctx));
    if (resultado.tipo === 'rechazada') {
      borrarCookieDeReanudacion(res, perfil);
      await this.auditoria.registrar({
        operacion: perfil.operacion,
        resultado: 'RECHAZO',
        motivo: resultado.motivo,
        actorId: resultado.identidadId,
        sujetoId: resultado.identidadId,
        recursoTipo: resultado.sesionId ? 'Sesion' : null,
        recursoId: resultado.sesionId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      });
      // Vencida se dice como tal, para que el website explique qué pasó; lo demás, como sesión no válida.
      throw resultado.motivo === 'SESION_VENCIDA' ? errores.sesionExpirada() : errores.sesionInvalida();
    }
    if (resultado.secreto) ponerCookieDeReanudacion(res, resultado.secreto, resultado.expiraEn, ctx.momentoDeRecepcion, perfil);
    return { identidadId: resultado.identidadId, sesionId: resultado.sesionId, version: resultado.version, expiraEn: resultado.expiraEn };
  }

  /**
   * Dentro de una transacción: la sesión se bloquea (FOR UPDATE) para serializar las reanudaciones de una misma sesión
   * entre sí y con su finalización o revocación. El éxito se audita en la misma transacción; el rechazo, afuera.
   * Una sesión de otra clase que la del perfil (una cookie de Administración presentada para una sesión común, o al revés)
   * es una sesión no activa para ese perfil.
   */
  private async reanudarEn(tx: Prisma.TransactionClient, perfil: PerfilDeReanudacion, huella: string, ctx: ContextoDeSolicitud): Promise<Resultado> {
    const presentada = await tx.reanudacionDeSesion.findUnique({ where: { huella }, select: { id: true, sesionId: true } });
    if (!presentada) return { tipo: 'rechazada', motivo: 'REANUDACION_DESCONOCIDA', identidadId: null, sesionId: null };
    const [sesion] = await tx.$queryRaw<{ identidadId: string; estado: string; superficie: string | null; expiraEn: Date; version: number; clase: string }[]>`
      SELECT "identidad_id" AS "identidadId", "estado"::text AS "estado", "superficie"::text AS "superficie", "expira_en" AS "expiraEn",
             "version_de_control" AS "version", "clase"::text AS "clase"
        FROM "sesion" WHERE "id" = ${presentada.sesionId}::uuid FOR UPDATE`;
    const base = { identidadId: sesion?.identidadId ?? null, sesionId: presentada.sesionId };
    if (!sesion || sesion.estado !== 'ACTIVA' || sesion.superficie !== 'WEB' || sesion.clase !== perfil.clase) return { tipo: 'rechazada', motivo: 'SESION_NO_ACTIVA', ...base };
    if (sesion.expiraEn.getTime() <= ctx.momentoDeRecepcion.getTime()) return { tipo: 'rechazada', motivo: 'SESION_VENCIDA', ...base };
    const control = await tx.controlDeSesion.findUnique({ where: { identidadId: sesion.identidadId }, select: { version: true } });
    const [cuenta] = await tx.$queryRaw<{ estado: EstadoOperativoDeCuenta }[]>`
      SELECT "estado_operativo_de_cuenta" AS "estado" FROM "identidad" WHERE "id" = ${sesion.identidadId}::uuid FOR SHARE`;
    if (!control || control.version !== sesion.version || !cuenta || !cuentaPermiteOperar(cuenta.estado)) return { tipo: 'rechazada', motivo: 'SESION_NO_VIGENTE', ...base };

    const sucesora = await tx.reanudacionDeSesion.findUnique({ where: { predecesoraId: presentada.id }, select: { momentoDeRegistro: true } });
    if (sucesora) {
      // Reemplazada. Dentro del margen, otra pestaña recargó a la vez: vale, sin rotar (la cookie vigente ya la tiene el
      // navegador). Fuera del margen es una copia: se revoca la sesión.
      if (ctx.momentoDeRecepcion.getTime() - sucesora.momentoDeRegistro.getTime() > MARGEN_DE_GRACIA_MS) {
        await tx.$executeRaw`
          UPDATE "sesion" SET "estado" = 'REVOCADA', "motivo_de_revocacion" = 'REANUDACION_REUTILIZADA',
                 "momento_de_finalizacion" = GREATEST(${ctx.momentoDeRecepcion}::timestamptz, "momento_de_ocurrencia")
           WHERE "id" = ${presentada.sesionId}::uuid AND "estado" = 'ACTIVA'`;
        return { tipo: 'rechazada', motivo: 'REANUDACION_REUTILIZADA', ...base };
      }
    }
    // La vigente rota: la nueva reemplaza a la presentada. Una reemplazada dentro del margen no rota de nuevo.
    const secreto = sucesora ? null : secretoNuevo();
    if (secreto) await tx.reanudacionDeSesion.create({ data: { sesionId: presentada.sesionId, predecesoraId: presentada.id, huella: huellaDe(secreto), momentoDeRegistro: ctx.momentoDeRecepcion } });
    await this.auditoria.registrar(
      {
        operacion: perfil.operacion,
        resultado: 'EXITO',
        motivo: secreto ? null : 'DENTRO_DEL_MARGEN',
        actorId: sesion.identidadId,
        sujetoId: sesion.identidadId,
        recursoTipo: 'Sesion',
        recursoId: presentada.sesionId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
    return { tipo: 'reanudada', identidadId: sesion.identidadId, sesionId: presentada.sesionId, version: sesion.version, expiraEn: sesion.expiraEn, secreto };
  }
}
