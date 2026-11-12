import { Injectable } from '@nestjs/common';
import {
  ConsultarPedidosDeDerechoRequestSchema,
  CrearExportacionRequestSchema,
  CrearPedidoDeDerechoRequestSchema,
  fechaCivil,
  LARGO_MAXIMO_DEL_FUNDAMENTO,
  LARGO_MAXIMO_DE_LA_NOTA_DEL_PEDIDO,
  LARGO_MAXIMO_DE_LA_RESPUESTA_DEL_PEDIDO,
  plazoDelPedido,
  ResolverPedidoDeDerechoRequestSchema,
  VIGENCIA_DE_LA_EXPORTACION_MS,
  type DominioDeLaExportacion,
  type Exportacion,
  type ExportacionResponse,
  type ListaAdministrativaDePedidosDeDerechoResponse,
  type ListaDePedidosDeDerechoResponse,
  type PedidoDeDerecho,
  type PedidoDeDerechoResponse,
  type TipoDePedidoDeDerecho,
  type ValidationIssue,
} from '@be/domain';
import type { EstadoDePedidoDeDerecho, Prisma, TipoDePedidoDeDerecho as TipoEnLaBase } from '@prisma/client';
import type { ActorAdministrativo } from '../administracion/sesion-administrativa.guard';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { despuesDelCursor, escribirCursor, leerConsultaDeLista } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { esUuid } from '../plataforma/ejecutor';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { LimitadorService } from '../plataforma/limitador.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { armarExportacion } from './exportacion';
import { RutaDeExportacion } from './ruta-de-exportacion';

type Tx = Prisma.TransactionClient;
const ZONA = 'America/Argentina/Buenos_Aires';
const CASO_DE_USO = 'UF-06';

const TIPO_EN_LA_BASE: Readonly<Record<TipoDePedidoDeDerecho, TipoEnLaBase>> = { ACCESS: 'ACCESO', RECTIFICATION: 'RECTIFICACION', SUPPRESSION: 'SUPRESION' };
const TIPO_API: Readonly<Record<TipoEnLaBase, TipoDePedidoDeDerecho>> = { ACCESO: 'ACCESS', RECTIFICACION: 'RECTIFICATION', SUPRESION: 'SUPPRESSION' };
const ESTADO_API: Readonly<Record<EstadoDePedidoDeDerecho, PedidoDeDerecho['state']>> = { RECIBIDO: 'RECEIVED', RESUELTO: 'RESOLVED', RECHAZADO: 'REJECTED' };
const ESTADO_EN_LA_BASE: Readonly<Record<PedidoDeDerecho['state'], EstadoDePedidoDeDerecho>> = { RECEIVED: 'RECIBIDO', RESOLVED: 'RESUELTO', REJECTED: 'RECHAZADO' };

/** Un texto, ya sin espacios en los bordes; `null` si quedó vacío. */
const limpio = (t: string | undefined): string | null => {
  const s = (t ?? '').normalize('NFC').trim();
  return s ? s : null;
};

const SELECCION = {
  id: true,
  tipo: true,
  nota: true,
  estado: true,
  plazo: true,
  respuesta: true,
  fundamento: true,
  momentoDeResolucion: true,
  momentoDeRegistro: true,
  titularId: true,
} as const satisfies Prisma.PedidoDeDerechoSelect;
type FilaDePedido = Prisma.PedidoDeDerechoGetPayload<{ select: typeof SELECCION }>;

function pedidoApi(f: FilaDePedido): PedidoDeDerecho {
  return {
    requestId: f.id,
    type: TIPO_API[f.tipo],
    note: f.nota,
    state: ESTADO_API[f.estado],
    createdAt: f.momentoDeRegistro.toISOString(),
    deadline: f.plazo.toISOString().slice(0, 10),
    resolvedAt: f.momentoDeResolucion?.toISOString() ?? null,
    response: f.respuesta,
  };
}

/**
 * UF-06 de WP-USO-FINAL (DL-169; 08 §18 y §19; 09 v0.12 §14 y §15): los derechos de la persona.
 * - **API-RGT-01 a 03:** el pedido de acceso, rectificación o supresión, siempre de la persona autenticada, con su plazo
 *   (Ley 25.326; a confirmar con la asesoría); lo propio se lee, lo ajeno es el mismo 404 que lo inexistente.
 * - **API-EXP-01 y 02:** la exportación pedida queda registrada con su vencimiento; su estado trae una ruta de descarga
 *   firmada nueva, que vence a los 15 minutos. **API-EXP-02-DESCARGA** arma el archivo en ese momento, con lo del titular,
 *   y audita la entrega sin el contenido.
 * - **API-ADM-16 y 17:** Administración ve los pedidos (los pendientes primero, por plazo) y los resuelve una sola vez,
 *   con la respuesta a la persona y su fundamento interno.
 */
@Injectable()
export class DerechosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    private readonly rutas: RutaDeExportacion,
    private readonly limitador: LimitadorService,
  ) {}

  // ─── API-RGT-01 ──────────────────────────────────────────────────────────────────────────────
  async pedir(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(CrearPedidoDeDerechoRequestSchema, cuerpo);
    this.exigirClave(clave);
    const nota = limpio(pedido.scope.note);
    if (nota && [...nota].length > LARGO_MAXIMO_DE_LA_NOTA_DEL_PEDIDO) throw errores.validacionFallida([{ code: 'NOTE_TOO_LONG', path: 'scope.note' }]);
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-RGT-01');
    return this.idempotencia.ejecutar({ operacion: 'API-RGT-01', ambito: actor.identidadId, clave: clave as string, huella: IdempotenciaService.huella(pedido) }, async (tx) => {
      const momento = await momentoDeLaBase(tx);
      const plazo = plazoDelPedido(pedido.type, fechaCivil(momento.toISOString(), ZONA));
      const fila = await tx.pedidoDeDerecho.create({
        data: {
          titularId: actor.identidadId,
          tipo: TIPO_EN_LA_BASE[pedido.type],
          nota,
          plazo: new Date(`${plazo}T00:00:00.000Z`),
          procedencia: procedencia as unknown as Prisma.InputJsonValue,
          momentoDeOcurrencia: momento,
        },
        select: SELECCION,
      });
      await this.auditar(tx, 'API-RGT-01', 'EXITO', pedido.type, actor.identidadId, actor.identidadId, 'PedidoDeDerecho', fila.id, ctx);
      const respuesta: PedidoDeDerechoResponse = { data: pedidoApi(fila) };
      return { estadoHttp: 201, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
    });
  }

  // ─── API-RGT-02 ──────────────────────────────────────────────────────────────────────────────
  async pedidoPropio(actor: ActorAutenticado, pedidoId: string): Promise<PedidoDeDerechoResponse> {
    const fila = esUuid(pedidoId) ? await this.prisma.pedidoDeDerecho.findFirst({ where: { id: pedidoId.toLowerCase(), titularId: actor.identidadId }, select: SELECCION }) : null;
    if (!fila) throw errores.recursoNoEncontrado();
    return { data: pedidoApi(fila) };
  }

  // ─── API-RGT-03 ──────────────────────────────────────────────────────────────────────────────
  async pedidosPropios(actor: ActorAutenticado, query: Record<string, unknown>): Promise<ListaDePedidosDeDerechoResponse> {
    const consulta = leerConsultaDeLista(query, {});
    const filas = await this.prisma.pedidoDeDerecho.findMany({
      where: { titularId: actor.identidadId, ...despuesDelCursor(consulta.cursor) },
      orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
      take: consulta.limit + 1,
      select: SELECCION,
    });
    const hayMas = filas.length > consulta.limit;
    const pagina = filas.slice(0, consulta.limit);
    const ultima = pagina[pagina.length - 1];
    return { data: pagina.map(pedidoApi), page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeRegistro, ultima.id) : null, hasMore: hayMas } };
  }

  // ─── API-EXP-01 ──────────────────────────────────────────────────────────────────────────────
  async exportar(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(CrearExportacionRequestSchema, cuerpo);
    this.exigirClave(clave);
    const issues: ValidationIssue[] = [];
    if (pedido.scope.domains.length === 0) issues.push({ code: 'DOMAINS_REQUIRED', path: 'scope.domains' });
    if (new Set(pedido.scope.domains).size !== pedido.scope.domains.length) issues.push({ code: 'DOMAIN_REPEATED', path: 'scope.domains' });
    if (issues.length > 0) throw errores.validacionFallida(issues);
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-EXP-01');
    return this.idempotencia.ejecutar({ operacion: 'API-EXP-01', ambito: actor.identidadId, clave: clave as string, huella: IdempotenciaService.huella(pedido) }, async (tx) => {
      const momento = await momentoDeLaBase(tx);
      const fila = await tx.exportacionPropia.create({
        data: { titularId: actor.identidadId, dominios: [...pedido.scope.domains], venceEn: new Date(momento.getTime() + VIGENCIA_DE_LA_EXPORTACION_MS), procedencia: procedencia as unknown as Prisma.InputJsonValue },
      });
      await this.auditar(tx, 'API-EXP-01', 'EXITO', fila.dominios.join(','), actor.identidadId, actor.identidadId, 'ExportacionPropia', fila.id, ctx);
      const respuesta: ExportacionResponse = { data: this.exportacionApi(fila, momento, false) };
      return { estadoHttp: 201, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
    });
  }

  // ─── API-EXP-02 ──────────────────────────────────────────────────────────────────────────────
  async exportacionPropia(actor: ActorAutenticado, exportacionId: string): Promise<ExportacionResponse> {
    const fila = esUuid(exportacionId) ? await this.prisma.exportacionPropia.findFirst({ where: { id: exportacionId.toLowerCase(), titularId: actor.identidadId } }) : null;
    if (!fila) throw errores.recursoNoEncontrado();
    return { data: this.exportacionApi(fila, new Date(), true) };
  }

  // ─── API-EXP-02-DESCARGA ─────────────────────────────────────────────────────────────────────
  /**
   * El archivo por su ruta firmada. Una ruta inválida o vencida, o una exportación vencida, es el mismo 404. La ruta no
   * lleva sesión: el cupo es por red (el de las lecturas protegidas), antes de verificarla, porque armar el archivo y
   * auditar cada rechazo cuestan.
   */
  async descargar(token: string, ctx: ContextoDeSolicitud): Promise<{ readonly nombre: string; readonly contenido: string }> {
    this.limitador.consumir('consultaProtegida', ctx.direccionIp, 'API-EXP-02-DESCARGA');
    const ruta = this.rutas.verificar(token);
    const fila = ruta ? await this.prisma.exportacionPropia.findUnique({ where: { id: ruta.exportacionId } }) : null;
    if (!ruta || !fila || fila.venceEn.getTime() <= Date.now()) {
      await this.auditoria.registrar({ operacion: 'API-EXP-02-DESCARGA', resultado: 'RECHAZO', motivo: 'RUTA_NO_VALIDA', superficie: ctx.superficie, requestId: ctx.requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion });
      throw errores.recursoNoEncontrado();
    }
    return this.prisma.$transaction(async (tx) => {
      const ahora = await momentoDeLaBase(tx);
      const archivo = await armarExportacion(tx, fila.titularId, fila.dominios as DominioDeLaExportacion[], ahora);
      await this.auditar(tx, 'API-EXP-02-DESCARGA', 'EXITO', null, null, fila.titularId, 'ExportacionPropia', fila.id, ctx);
      return { nombre: `be-mis-datos-${fechaCivil(ahora.toISOString(), ZONA)}.json`, contenido: `${JSON.stringify(archivo, null, 2)}\n` };
    });
  }

  // ─── API-ADM-16 ──────────────────────────────────────────────────────────────────────────────
  /** Los pendientes primero, por plazo; después los resueltos, del más nuevo al más viejo. */
  async consultarParaAdministracion(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ListaAdministrativaDePedidosDeDerechoResponse> {
    const pedido = validarCuerpo(ConsultarPedidosDeDerechoRequestSchema, cuerpo);
    const limite = pedido.limit ?? 20;
    const desde = pedido.cursor !== undefined ? this.leerCursor(pedido.cursor) : 0;
    const filas = await this.prisma.pedidoDeDerecho.findMany({
      where: pedido.state ? { estado: ESTADO_EN_LA_BASE[pedido.state] } : {},
      orderBy: [{ estado: 'asc' }, { plazo: 'asc' }, { momentoDeRegistro: 'desc' }, { id: 'asc' }],
      skip: desde,
      take: limite + 1,
      select: { ...SELECCION, titular: { select: { metodosDeAcceso: { select: { tipo: true, referencia: true, correo: true } } } } },
    });
    const hayMas = filas.length > limite;
    await this.auditar(this.prisma, 'API-ADM-16', 'EXITO', null, actor.identidadId, null, 'ListaDePedidosDeDerecho', null, ctx);
    return {
      data: filas.slice(0, limite).map((f) => ({
        ...pedidoApi(f),
        subject: { identityId: f.titularId, email: f.titular.metodosDeAcceso.find((m) => m.tipo === 'LOCAL')?.referencia ?? f.titular.metodosDeAcceso.find((m) => m.correo)?.correo ?? null },
        rationale: f.fundamento,
      })),
      page: { limit: limite, nextCursor: hayMas ? Buffer.from(String(desde + limite), 'utf8').toString('base64url') : null, hasMore: hayMas },
    };
  }

  // ─── API-ADM-17 ──────────────────────────────────────────────────────────────────────────────
  async resolver(actor: ActorAdministrativo, pedidoId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(ResolverPedidoDeDerechoRequestSchema, cuerpo);
    this.exigirClave(clave);
    const id = esUuid(pedidoId) ? pedidoId.toLowerCase() : null;
    const respuesta = limpio(pedido.response);
    const fundamento = limpio(pedido.rationale);
    const issues: ValidationIssue[] = [];
    if (!respuesta || [...respuesta].length > LARGO_MAXIMO_DE_LA_RESPUESTA_DEL_PEDIDO) issues.push({ code: 'RESPONSE_REQUIRED', path: 'response' });
    if (!fundamento || [...fundamento].length > LARGO_MAXIMO_DEL_FUNDAMENTO) issues.push({ code: 'RATIONALE_REQUIRED', path: 'rationale' });
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-ADM-17');
    try {
      if (issues.length > 0) throw errores.validacionFallida(issues);
      return await this.idempotencia.ejecutar({ operacion: 'API-ADM-17', ambito: actor.identidadId, clave: clave as string, huella: IdempotenciaService.huella({ id, pedido }) }, async (tx) => {
        const [actual] = id ? await tx.$queryRaw<{ estado: string }[]>`SELECT "estado"::text AS "estado" FROM "pedido_de_derecho" WHERE "id" = ${id}::uuid FOR UPDATE` : [];
        if (!id || !actual) throw new ErrorDeApi(404, 'RESOURCE_NOT_FOUND', 'Recurso no encontrado.', undefined, 'PEDIDO_NO_ENCONTRADO');
        if (actual.estado !== 'RECIBIDO') throw new ErrorDeApi(422, 'INVALID_STATE_TRANSITION', 'Este pedido ya se resolvió.', undefined, 'PEDIDO_YA_RESUELTO');
        const momento = await momentoDeLaBase(tx);
        const fila = await tx.pedidoDeDerecho.update({
          where: { id },
          data: { estado: pedido.outcome === 'RESOLVED' ? 'RESUELTO' : 'RECHAZADO', respuesta, fundamento, administradorId: actor.identidadId, momentoDeResolucion: momento },
          select: { ...SELECCION, titular: { select: { metodosDeAcceso: { select: { tipo: true, referencia: true, correo: true } } } } },
        });
        await this.auditar(tx, 'API-ADM-17', 'EXITO', pedido.outcome, actor.identidadId, fila.titularId, 'PedidoDeDerecho', fila.id, ctx, procedencia.requestId);
        const cuerpoDeRespuesta = {
          data: {
            ...pedidoApi(fila),
            subject: { identityId: fila.titularId, email: fila.titular.metodosDeAcceso.find((m) => m.tipo === 'LOCAL')?.referencia ?? fila.titular.metodosDeAcceso.find((m) => m.correo)?.correo ?? null },
            rationale: fila.fundamento,
          },
        };
        return { estadoHttp: 200, cuerpo: cuerpoDeRespuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      if (e instanceof ErrorDeApi) await this.auditar(this.prisma, 'API-ADM-17', 'RECHAZO', e.motivoDeAuditoria ?? e.code, actor.identidadId, null, 'PedidoDeDerecho', id, ctx);
      throw e;
    }
  }

  // ─── Piezas comunes ──────────────────────────────────────────────────────────────────────────

  private exportacionApi(fila: { id: string; dominios: string[]; venceEn: Date; momentoDeRegistro: Date }, ahora: Date, conDescarga: boolean): Exportacion {
    const vigente = fila.venceEn.getTime() > ahora.getTime();
    const vence = this.rutas.vencimiento();
    return {
      exportId: fila.id,
      state: vigente ? 'READY' : 'EXPIRED',
      domains: fila.dominios as DominioDeLaExportacion[],
      createdAt: fila.momentoDeRegistro.toISOString(),
      expiresAt: fila.venceEn.toISOString(),
      download: vigente && conDescarga ? { path: `/exports/content/${this.rutas.firmar(fila.id, vence)}`, expiresAt: vence.toISOString() } : null,
    };
  }

  private exigirClave(clave: string | undefined): void {
    if (!IdempotenciaService.claveValida(clave)) throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
  }

  private leerCursor(cursor: string): number {
    const texto = /^[A-Za-z0-9_-]{1,40}$/.test(cursor) ? Buffer.from(cursor, 'base64url').toString('utf8') : '';
    const n = /^\d{1,7}$/.test(texto) ? Number(texto) : -1;
    if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw errores.cursorInvalido();
    return n;
  }

  private auditar(
    cliente: Tx | PrismaService,
    operacion: string,
    resultado: 'EXITO' | 'RECHAZO',
    motivo: string | null,
    actorId: string | null,
    sujetoId: string | null,
    recursoTipo: string,
    recursoId: string | null,
    ctx: ContextoDeSolicitud,
    requestId: string | null = ctx.requestId,
  ): Promise<void> {
    return this.auditoria.registrar({ operacion, resultado, motivo, actorId, sujetoId, recursoTipo, recursoId, superficie: ctx.superficie, requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion }, cliente as Tx);
  }
}
