import { Inject, Injectable } from '@nestjs/common';
import {
  codigoDeRecuperacionEnGrupos,
  CompletarRecuperacionRequestSchema,
  COPY_RECUPERACION,
  EmitirRecuperacionAsistidaRequestSchema,
  identificadorLocalValido,
  INTENTOS_POR_PEDIDO_DE_RECUPERACION,
  ISSUE_DE_RECUPERACION_ASISTIDA,
  LARGO_DEL_CODIGO_DE_RECUPERACION_DE_ACCESO,
  LARGO_MAXIMO_DEL_FUNDAMENTO,
  normalizarCodigoDeRecuperacionDeAcceso,
  normalizarIdentificadorLocal,
  PedirRecuperacionRequestSchema,
  planDelPedidoDeRecuperacion,
  problemaDeCredencialLocal,
  respuestaDelPedidoDeRecuperacion,
  VIGENCIA_DEL_CODIGO_ASISTIDO_MS,
  VIGENCIA_DEL_CODIGO_POR_CORREO_MS,
  type RecuperacionAsistidaResponse,
  type RecuperacionPedidaResponse,
  type ValidationIssue,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { createHmac, hkdfSync, randomUUID } from 'node:crypto';
import type { ActorAdministrativo } from '../administracion/sesion-administrativa.guard';
import { codigoAlAzar } from '../administracion/segundo-factor';
import type { Entorno } from '../config/entorno';
import { ENTORNO } from '../config/tokens';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { CorreoService } from '../plataforma/correo.service';
import { CredencialesService } from '../plataforma/credenciales.service';
import { esUuid } from '../plataforma/ejecutor';
import { LimitadorService } from '../plataforma/limitador.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import { revocarSesiones } from '../sesion/sesion.service';

type Tx = Prisma.TransactionClient;
const CASO_DE_USO = 'UC-E09';

/**
 * La huella de un código de recuperación del acceso: HMAC-SHA-256 con una clave derivada (HKDF) del secreto del servidor,
 * propia de la recuperación (no sirve para firmar sesiones, rutas ni otros códigos). Sin la clave, la base sola no alcanza
 * para probar códigos (08 §31.4: los tokens de un solo uso, solo como hash).
 */
export function huellaDeRecuperacionDeAcceso(secretoDelServidor: string, normalizado: string): string {
  const clave = Buffer.from(hkdfSync('sha256', secretoDelServidor, 'be-recuperacion-de-acceso', 'huellas-de-codigos-de-recuperacion-v1', 32));
  return createHmac('sha256', clave).update(`be/recuperacion-de-acceso/${normalizado}`).digest('hex');
}

/** Lo que pasó al completar, antes de responder: el éxito, o el motivo interno del mismo 422 (nunca se expone). */
type Completado = { readonly ok: true } | { readonly ok: false; readonly motivo: string; readonly sujetoId: string | null };

/**
 * UF-03 de WP-USO-FINAL (DL-169; UF-D9; 04 RF-005, UC-E09 que extiende UC-P26; 08 §24.4 a §24.6, §26.3 y §38; 09 v0.12
 * §10): recuperar el acceso local.
 * - **API-ACC-P1-01** responde siempre lo mismo (`respuestaDelPedidoDeRecuperacion`, que no recibe la cuenta). Hace el
 *   mismo trabajo en todas las ramas (un código al azar y su huella, una lectura y la auditoría); el correo sale después de
 *   confirmar y sin esperarlo, así ni la respuesta ni su tiempo dicen si había a quién escribirle.
 * - **API-ACC-P1-02** acepta cualquier código vigente de la cuenta del pedido (el del correo de cualquiera de sus pedidos o
 *   el de Administración). El hash de la contraseña nueva se calcula antes de mirar el código, en todas las ramas. Toma la
 *   identidad en modo exclusivo y después las filas de la recuperación: el mismo orden que la recuperación asistida y que
 *   el cierre de la cuenta. Cinco códigos que no valen anulan el pedido.
 * - **API-ADM-18** (UF-D9): Administración, con su segundo factor, verifica a la persona fuera de BE y le da un código de
 *   24 h; se anulan los códigos anteriores de la cuenta y se revocan sus sesiones. Sin idempotencia: el código no se guarda.
 */
@Injectable()
export class RecuperacionService {
  constructor(
    @Inject(ENTORNO) private readonly entorno: Entorno,
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
    private readonly credenciales: CredencialesService,
    private readonly correo: CorreoService,
  ) {}

  // ─── API-ACC-P1-01 ───────────────────────────────────────────────────────────────────────────
  async pedir(cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<RecuperacionPedidaResponse> {
    const pedido = validarCuerpo(PedirRecuperacionRequestSchema, cuerpo);
    const correo = normalizarIdentificadorLocal(pedido.identifier);
    if (!identificadorLocalValido(correo)) throw errores.validacionFallida([{ code: 'INVALID_LOCAL_IDENTIFIER', path: 'identifier' }]);
    // Cupos neutrales (DL-015): no dependen de que la cuenta exista. Por correo desde cualquier red (08 §38: 3 por hora) y
    // por red, para que nadie barra correos ajenos.
    this.limitador.consumir('recuperacionPorIp', ctx.direccionIp);
    this.limitador.consumir('recuperacion', null, correo);
    const correoActivo = this.correo.activo;
    // El código y su huella se calculan siempre, haya o no a quién dárselo.
    const codigo = codigoAlAzar(LARGO_DEL_CODIGO_DE_RECUPERACION_DE_ACCESO);
    const huella = huellaDeRecuperacionDeAcceso(this.entorno.jwtSecret, codigo);
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-ACC-P1-01');
    const { plan, recoveryId, momento } = await this.prisma.$transaction(async (tx) => {
      const momento = await momentoDeLaBase(tx);
      // El método del correo: el local (con su credencial, si no se suprimió) o, si no hay, la cuenta de Google con ese correo.
      // Un código va solo al correo con que se entra con contraseña.
      const [cuenta] = await tx.$queryRaw<{ identidadId: string; estado: string; conContrasena: boolean; conGoogle: boolean }[]>`
        SELECT m."identidad_id"::text AS "identidadId", i."estado_operativo_de_cuenta"::text AS "estado",
               (m."tipo" = 'LOCAL' AND c."metodo_de_acceso_id" IS NOT NULL) AS "conContrasena",
               (m."tipo" = 'GOOGLE') AS "conGoogle"
          FROM "metodo_de_acceso" m
          JOIN "identidad" i ON i."id" = m."identidad_id"
          LEFT JOIN "credencial_local" c ON c."metodo_de_acceso_id" = m."id"
         WHERE (m."tipo" = 'LOCAL' AND m."referencia" = ${correo}) OR (m."tipo" = 'GOOGLE' AND m."correo" = ${correo})
         ORDER BY m."tipo" LIMIT 1`;
      const plan = planDelPedidoDeRecuperacion(cuenta ? { operativa: cuenta.estado === 'OPERATIVA', conContrasena: cuenta.conContrasena, conGoogle: cuenta.conGoogle } : null, correoActivo);
      let recoveryId: string = randomUUID();
      if (plan.guardar && cuenta) {
        const fila = await tx.recuperacionDeAcceso.create({
          data: {
            identidadId: cuenta.identidadId,
            origen: 'PEDIDO',
            // Sin proveedor no hay código: el pedido acepta el que dé Administración (UF-D9).
            huella: plan.correo === 'CODIGO' ? huella : null,
            venceEn: new Date(momento.getTime() + VIGENCIA_DEL_CODIGO_POR_CORREO_MS),
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        });
        recoveryId = fila.id;
      }
      await this.auditar(
        tx,
        'API-ACC-P1-01',
        plan.guardar ? 'EXITO' : 'RECHAZO',
        plan.motivo,
        cuenta?.identidadId ?? null,
        cuenta?.identidadId ?? null,
        plan.guardar ? recoveryId : null,
        ctx,
      );
      return { plan, recoveryId, momento };
    });
    // Después de confirmar, sin esperar: el código ya vale cuando llega el correo.
    if (plan.correo === 'CODIGO') {
      this.correo.enviarSinEsperar({ para: correo, asunto: COPY_RECUPERACION.mensaje.asunto, texto: COPY_RECUPERACION.mensaje.texto(codigoDeRecuperacionEnGrupos(codigo)) }, 'API-ACC-P1-01', ctx.requestId);
    } else if (plan.correo === 'ENTRA_CON_GOOGLE') {
      this.correo.enviarSinEsperar({ para: correo, asunto: COPY_RECUPERACION.mensaje.asuntoGoogle, texto: COPY_RECUPERACION.mensaje.textoGoogle }, 'API-ACC-P1-01', ctx.requestId);
    }
    return respuestaDelPedidoDeRecuperacion({ recoveryId, momento, correoActivo });
  }

  // ─── API-ACC-P1-02 ───────────────────────────────────────────────────────────────────────────
  async completar(recoveryId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<void> {
    const pedido = validarCuerpo(CompletarRecuperacionRequestSchema, cuerpo);
    // La contraseña nueva, con la política del alta, antes de gastar un intento.
    const problema = problemaDeCredencialLocal(pedido.newCredential);
    if (problema) throw errores.validacionFallida([{ code: problema, path: 'newCredential' }]);
    this.limitador.consumir('completarRecuperacion', ctx.direccionIp);
    const id = esUuid(recoveryId) ? recoveryId.toLowerCase() : null;
    const codigo = normalizarCodigoDeRecuperacionDeAcceso(pedido.proof);
    const huella = codigo ? huellaDeRecuperacionDeAcceso(this.entorno.jwtSecret, codigo) : null;
    // El hash de la contraseña nueva, siempre: el trabajo caro es el mismo valga o no el código.
    const hash = await this.credenciales.generarHash(pedido.newCredential);
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-ACC-P1-02');
    const resultado = await this.prisma.$transaction(async (tx): Promise<Completado> => {
      const [pedidoGuardado] = id
        ? await tx.$queryRaw<{ identidadId: string }[]>`
            SELECT "identidad_id"::text AS "identidadId" FROM "recuperacion_de_acceso" WHERE "id" = ${id}::uuid AND "origen" = 'PEDIDO'`
        : [];
      if (!pedidoGuardado) return { ok: false, motivo: 'PEDIDO_INEXISTENTE', sujetoId: null };
      const identidadId = pedidoGuardado.identidadId;
      // La identidad en modo exclusivo (como el cierre y la asistida), y después las filas de la recuperación.
      const [cuenta] = await tx.$queryRaw<{ estado: string; metodoId: string | null }[]>`
        SELECT i."estado_operativo_de_cuenta"::text AS "estado",
               (SELECT m."id"::text FROM "metodo_de_acceso" m JOIN "credencial_local" c ON c."metodo_de_acceso_id" = m."id"
                 WHERE m."identidad_id" = i."id" AND m."tipo" = 'LOCAL' LIMIT 1) AS "metodoId"
          FROM "identidad" i WHERE i."id" = ${identidadId}::uuid FOR NO KEY UPDATE`;
      const [fila] = await tx.$queryRaw<{ intentos: number; cerrado: boolean; vencido: boolean }[]>`
        SELECT "intentos_fallidos" AS "intentos", ("momento_de_uso" IS NOT NULL OR "momento_de_anulacion" IS NOT NULL) AS "cerrado",
               ("vence_en" <= clock_timestamp()) AS "vencido"
          FROM "recuperacion_de_acceso" WHERE "id" = ${id}::uuid FOR UPDATE`;
      if (!fila || fila.cerrado) return { ok: false, motivo: 'PEDIDO_CERRADO', sujetoId: identidadId };
      if (fila.vencido) return { ok: false, motivo: 'PEDIDO_VENCIDO', sujetoId: identidadId };
      const ahora = await momentoDeLaBase(tx);
      // Cualquier código vigente de la cuenta: el del correo de alguno de sus pedidos o el de Administración.
      const [valido] = huella
        ? await tx.$queryRaw<{ id: string }[]>`
            SELECT "id"::text AS "id" FROM "recuperacion_de_acceso"
             WHERE "identidad_id" = ${identidadId}::uuid AND "huella" = ${huella}
               AND "momento_de_uso" IS NULL AND "momento_de_anulacion" IS NULL AND "vence_en" > ${ahora}
             FOR UPDATE`
        : [];
      if (!valido) {
        const intentos = fila.intentos + 1;
        const agotado = intentos >= INTENTOS_POR_PEDIDO_DE_RECUPERACION;
        await tx.recuperacionDeAcceso.update({ where: { id: id as string }, data: { intentosFallidos: intentos, ...(agotado ? { momentoDeAnulacion: ahora } : {}) } });
        return { ok: false, motivo: agotado ? 'PEDIDO_ANULADO_POR_INTENTOS' : 'CODIGO_QUE_NO_VALE', sujetoId: identidadId };
      }
      if (!cuenta || cuenta.estado !== 'OPERATIVA' || !cuenta.metodoId) return { ok: false, motivo: 'CUENTA_NO_RECUPERABLE', sujetoId: identidadId };
      // El cambio, en una transacción: el código se usa, los demás se anulan, la credencial cambia con su hecho y las
      // sesiones terminan (08 §26.3).
      await tx.recuperacionDeAcceso.update({ where: { id: valido.id }, data: { momentoDeUso: ahora } });
      await tx.recuperacionDeAcceso.updateMany({ where: { identidadId, momentoDeUso: null, momentoDeAnulacion: null }, data: { momentoDeAnulacion: ahora } });
      await tx.cambioDeCredencial.create({ data: { identidadId, metodoDeAccesoId: cuenta.metodoId, recuperacionId: valido.id, procedencia: procedencia as unknown as Prisma.InputJsonValue } });
      await tx.credencialLocal.update({ where: { metodoDeAccesoId: cuenta.metodoId }, data: { hash, momentoDeRegistro: ahora } });
      const revocadas = await revocarSesiones(tx, identidadId, 'RECUPERACION_DE_ACCESO', ahora);
      await this.auditar(tx, 'API-ACC-P1-02', 'EXITO', `SESIONES_REVOCADAS:${revocadas}`, identidadId, identidadId, valido.id, ctx);
      return { ok: true };
    });
    if (!resultado.ok) {
      await this.auditar(this.prisma, 'API-ACC-P1-02', 'RECHAZO', resultado.motivo, null, resultado.sujetoId, id, ctx);
      throw errores.codigoDeRecuperacionInvalido(resultado.motivo);
    }
  }

  // ─── API-ADM-18 ──────────────────────────────────────────────────────────────────────────────
  async emitirAsistida(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<RecuperacionAsistidaResponse> {
    const pedido = validarCuerpo(EmitirRecuperacionAsistidaRequestSchema, cuerpo);
    const correo = normalizarIdentificadorLocal(pedido.email);
    const fundamento = pedido.rationale.normalize('NFC').trim();
    const issues: ValidationIssue[] = [];
    if (!identificadorLocalValido(correo)) issues.push({ code: ISSUE_DE_RECUPERACION_ASISTIDA.CORREO, path: 'email' });
    if (!fundamento || [...fundamento].length > LARGO_MAXIMO_DEL_FUNDAMENTO) issues.push({ code: ISSUE_DE_RECUPERACION_ASISTIDA.FUNDAMENTO, path: 'rationale' });
    const procedencia = procedenciaDe(ctx, 'UF-D9', 'API-ADM-18');
    let sujetoId: string | null = null;
    try {
      if (issues.length > 0) throw errores.validacionFallida(issues);
      const codigo = codigoAlAzar(LARGO_DEL_CODIGO_DE_RECUPERACION_DE_ACCESO);
      return await this.prisma.$transaction(async (tx) => {
        const [metodo] = await tx.$queryRaw<{ identidadId: string }[]>`
          SELECT "identidad_id"::text AS "identidadId" FROM "metodo_de_acceso"
           WHERE ("tipo" = 'LOCAL' AND "referencia" = ${correo}) OR ("tipo" = 'GOOGLE' AND "correo" = ${correo})
           ORDER BY "tipo" LIMIT 1`;
        if (!metodo) throw new ErrorDeApi(404, 'RESOURCE_NOT_FOUND', 'Recurso no encontrado.', undefined, 'CUENTA_NO_ENCONTRADA');
        const identidadId = metodo.identidadId;
        sujetoId = identidadId;
        // La identidad en modo exclusivo: un cierre, una suspensión o un cambio de contraseña simultáneos van antes o después.
        const [cuenta] = await tx.$queryRaw<{ estado: string; administrativa: boolean; conContrasena: boolean }[]>`
          SELECT i."estado_operativo_de_cuenta"::text AS "estado",
                 EXISTS (SELECT 1 FROM "rol_administrativo" r WHERE r."identidad_id" = i."id" AND r."estado" = 'VIGENTE') AS "administrativa",
                 EXISTS (SELECT 1 FROM "metodo_de_acceso" m JOIN "credencial_local" c ON c."metodo_de_acceso_id" = m."id"
                          WHERE m."identidad_id" = i."id" AND m."tipo" = 'LOCAL' AND m."referencia" = ${correo}) AS "conContrasena"
            FROM "identidad" i WHERE i."id" = ${identidadId}::uuid FOR NO KEY UPDATE`;
        if (!cuenta) throw new ErrorDeApi(404, 'RESOURCE_NOT_FOUND', 'Recurso no encontrado.', undefined, 'CUENTA_NO_ENCONTRADA');
        const problema = cuenta.administrativa
          ? ISSUE_DE_RECUPERACION_ASISTIDA.CUENTA_ADMINISTRATIVA
          : cuenta.estado !== 'OPERATIVA'
            ? ISSUE_DE_RECUPERACION_ASISTIDA.CUENTA_NO_OPERATIVA
            : !cuenta.conContrasena
              ? ISSUE_DE_RECUPERACION_ASISTIDA.SIN_CONTRASENA
              : null;
        if (problema) throw new ErrorDeApi(422, 'VALIDATION_FAILED', 'Esta cuenta no se recupera con un código.', { issues: [{ code: problema, path: 'email' }] }, problema);
        const ahora = await momentoDeLaBase(tx);
        // Los códigos anteriores de la cuenta dejan de valer (también los que llegaron por correo: quizá ya no es suyo). Los
        // pedidos sin código siguen abiertos: aceptan este.
        await tx.recuperacionDeAcceso.updateMany({ where: { identidadId, huella: { not: null }, momentoDeUso: null, momentoDeAnulacion: null }, data: { momentoDeAnulacion: ahora } });
        const venceEn = new Date(ahora.getTime() + VIGENCIA_DEL_CODIGO_ASISTIDO_MS);
        const fila = await tx.recuperacionDeAcceso.create({
          data: {
            identidadId,
            origen: 'ASISTIDA',
            huella: huellaDeRecuperacionDeAcceso(this.entorno.jwtSecret, codigo),
            venceEn,
            administradorId: actor.identidadId,
            fundamento,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        });
        const revocadas = await revocarSesiones(tx, identidadId, 'RECUPERACION_ASISTIDA', ahora);
        await this.auditar(tx, 'API-ADM-18', 'EXITO', `SESIONES_REVOCADAS:${revocadas}`, actor.identidadId, identidadId, fila.id, ctx);
        return { data: { identityId: identidadId, code: codigoDeRecuperacionEnGrupos(codigo), expiresAt: venceEn.toISOString(), sessionsRevoked: revocadas } };
      });
    } catch (e) {
      if (e instanceof ErrorDeApi) await this.auditar(this.prisma, 'API-ADM-18', 'RECHAZO', e.motivoDeAuditoria ?? e.code, actor.identidadId, sujetoId, null, ctx);
      throw e;
    }
  }

  private auditar(
    cliente: Tx | PrismaService,
    operacion: string,
    resultado: 'EXITO' | 'RECHAZO',
    motivo: string | null,
    actorId: string | null,
    sujetoId: string | null,
    recursoId: string | null,
    ctx: ContextoDeSolicitud,
  ): Promise<void> {
    return this.auditoria.registrar(
      { operacion, resultado, motivo, actorId, sujetoId, recursoTipo: 'RecuperacionDeAcceso', recursoId, superficie: ctx.superficie, requestId: ctx.requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion },
      cliente as Tx,
    );
  }
}
