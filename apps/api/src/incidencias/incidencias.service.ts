import { Injectable } from '@nestjs/common';
import {
  CambiarEstadoDeIncidenciaRequestSchema,
  ConsultarIncidenciasRequestSchema,
  decidirCambioDeIncidencia,
  problemasDelReporte,
  ReportarIncidenciaRequestSchema,
  textoDeIncidencia,
  ultimaRespuesta,
  versionDeIncidencia,
  type CategoriaDeIncidencia,
  type DetalleDeIncidenciaResponse,
  type EstadoDeIncidencia,
  type IncidenciaAdministrativa,
  type IncidenciaPropia,
  type IncidenciaPropiaResponse,
  type ListaAdministrativaDeIncidenciasResponse,
  type ListaDeIncidenciasPropiasResponse,
} from '@be/domain';
import type { CategoriaDeIncidencia as CategoriaEnLaBase, EstadoDeIncidencia as EstadoEnLaBase, Prisma } from '@prisma/client';
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

type Tx = Prisma.TransactionClient;
const CASO_DE_USO = 'UC-P28';

const CATEGORIA_EN_LA_BASE: Readonly<Record<CategoriaDeIncidencia, CategoriaEnLaBase>> = {
  ACCESS: 'ACCESO',
  PROFILE: 'PERFIL',
  RELATIONSHIP: 'VINCULO',
  DATA_INTEGRITY: 'INTEGRIDAD_DE_DATOS',
  APP_FUNCTIONING: 'FUNCIONAMIENTO',
};
const CATEGORIA_API: Readonly<Record<CategoriaEnLaBase, CategoriaDeIncidencia>> = {
  ACCESO: 'ACCESS',
  PERFIL: 'PROFILE',
  VINCULO: 'RELATIONSHIP',
  INTEGRIDAD_DE_DATOS: 'DATA_INTEGRITY',
  FUNCIONAMIENTO: 'APP_FUNCTIONING',
};
const ESTADO_EN_LA_BASE: Readonly<Record<EstadoDeIncidencia, EstadoEnLaBase>> = { OPEN: 'ABIERTA', IN_PROGRESS: 'EN_CURSO', RESOLVED: 'RESUELTA' };
const ESTADO_API: Readonly<Record<EstadoEnLaBase, EstadoDeIncidencia>> = { ABIERTA: 'OPEN', EN_CURSO: 'IN_PROGRESS', RESUELTA: 'RESOLVED' };

/** Lo que se lee de una incidencia: lo reportado, el estado y las respuestas de sus cambios (para la última). */
const SELECCION_PROPIA = {
  id: true,
  categoria: true,
  descripcion: true,
  estado: true,
  version: true,
  momentoDeRegistro: true,
  momentoDeActualizacion: true,
  reportanteId: true,
  responsableId: true,
  cambios: { select: { numero: true, respuesta: true } },
} as const satisfies Prisma.IncidenciaSelect;
type FilaPropia = Prisma.IncidenciaGetPayload<{ select: typeof SELECCION_PROPIA }>;

/** Para Administración: además, el correo de acceso de quien la reportó y el nombre administrativo de quien la tiene a cargo. */
const SELECCION_ADMINISTRATIVA = {
  ...SELECCION_PROPIA,
  reportante: { select: { metodosDeAcceso: { select: { tipo: true, referencia: true, correo: true } } } },
  responsable: { select: { rolesAdministrativos: { select: { nombreVisible: true }, orderBy: { momentoDeRegistro: 'desc' }, take: 1 } } },
} as const satisfies Prisma.IncidenciaSelect;
type FilaAdministrativa = Prisma.IncidenciaGetPayload<{ select: typeof SELECCION_ADMINISTRATIVA }>;

function incidenciaPropia(f: FilaPropia): IncidenciaPropia {
  return {
    incidentId: f.id,
    category: CATEGORIA_API[f.categoria],
    description: f.descripcion,
    state: ESTADO_API[f.estado],
    createdAt: f.momentoDeRegistro.toISOString(),
    updatedAt: f.momentoDeActualizacion.toISOString(),
    response: ultimaRespuesta(f.cambios),
  };
}

/** El correo de acceso de la cuenta: el de su contraseña o, si entra solo con Google, el de esa cuenta de Google. */
function correoDeAcceso(metodos: readonly { tipo: string; referencia: string; correo: string | null }[]): string | null {
  return metodos.find((m) => m.tipo === 'LOCAL')?.referencia ?? metodos.find((m) => m.correo)?.correo ?? null;
}

const nombreAdministrativo = (roles: readonly { nombreVisible: string }[] | undefined): string => roles?.[0]?.nombreVisible ?? 'Administración';

function incidenciaAdministrativa(f: FilaAdministrativa): IncidenciaAdministrativa {
  return {
    ...incidenciaPropia(f),
    reporter: { identityId: f.reportanteId, email: correoDeAcceso(f.reportante.metodosDeAcceso) },
    version: versionDeIncidencia(f.version),
    assignee: f.responsableId ? { identityId: f.responsableId, name: nombreAdministrativo(f.responsable?.rolesAdministrativos) } : null,
  };
}

/**
 * RF-068 (DL-172; 05 UC-P28; 06 T-06-06; 09 v0.12 §16): las incidencias administrativas mínimas.
 * - **API-INC-01 y 02:** la persona o el profesional avisa un problema y ve lo suyo, con el estado y la última respuesta.
 *   Lo ajeno no se lee por acá (no hay lectura por id para quien la reportó).
 * - **API-INC-03 a 05:** Administración la consulta con filtros, ve el detalle con su historia y le cambia el estado con un
 *   motivo, contra la versión que vio. La historia no se sobrescribe: el cambio se agrega antes de cambiar la incidencia, y
 *   la base no deja cambiarla de otra manera (triggers de la migración 20261113150000).
 * - **La auditoría** registra cada operación sin los textos (la descripción, el motivo y la respuesta pueden traer datos
 *   personales que no van a un registro probatorio).
 */
@Injectable()
export class IncidenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    private readonly limitador: LimitadorService,
  ) {}

  // ─── API-INC-01 ──────────────────────────────────────────────────────────────────────────────
  async reportar(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(ReportarIncidenciaRequestSchema, cuerpo);
    this.exigirClave(clave);
    const issues = problemasDelReporte(pedido.description);
    if (issues.length > 0) throw errores.validacionFallida(issues);
    await this.consumirCupo(actor, ctx);
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-INC-01');
    return this.idempotencia.ejecutar({ operacion: 'API-INC-01', ambito: actor.identidadId, clave: clave as string, huella: IdempotenciaService.huella(pedido) }, async (tx) => {
      const momento = await momentoDeLaBase(tx);
      const fila = await tx.incidencia.create({
        data: {
          reportanteId: actor.identidadId,
          categoria: CATEGORIA_EN_LA_BASE[pedido.category],
          descripcion: textoDeIncidencia(pedido.description) as string,
          procedencia: procedencia as unknown as Prisma.InputJsonValue,
          momentoDeRegistro: momento,
          momentoDeActualizacion: momento,
        },
        select: SELECCION_PROPIA,
      });
      await this.auditar(tx, 'API-INC-01', 'EXITO', pedido.category, actor.identidadId, actor.identidadId, fila.id, ctx);
      const respuesta: IncidenciaPropiaResponse = { data: incidenciaPropia(fila) };
      return { estadoHttp: 201, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
    });
  }

  // ─── API-INC-02 ──────────────────────────────────────────────────────────────────────────────
  async propias(actor: ActorAutenticado, query: Record<string, unknown>): Promise<ListaDeIncidenciasPropiasResponse> {
    const consulta = leerConsultaDeLista(query, {});
    const filas = await this.prisma.incidencia.findMany({
      where: { reportanteId: actor.identidadId, ...despuesDelCursor(consulta.cursor) },
      orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
      take: consulta.limit + 1,
      select: SELECCION_PROPIA,
    });
    const hayMas = filas.length > consulta.limit;
    const pagina = filas.slice(0, consulta.limit);
    const ultima = pagina[pagina.length - 1];
    return { data: pagina.map(incidenciaPropia), page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeRegistro, ultima.id) : null, hasMore: hayMas } };
  }

  // ─── API-INC-03 ──────────────────────────────────────────────────────────────────────────────
  /** Las pendientes primero, de la más vieja a la más nueva; las resueltas, de la más nueva a la más vieja. */
  async consultar(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ListaAdministrativaDeIncidenciasResponse> {
    const pedido = validarCuerpo(ConsultarIncidenciasRequestSchema, cuerpo);
    const limite = pedido.limit ?? 20;
    const desde = pedido.cursor !== undefined ? this.leerCursor(pedido.cursor) : 0;
    const estados = pedido.states ? [...new Set(pedido.states)].map((e) => ESTADO_EN_LA_BASE[e]) : null;
    const where: Prisma.IncidenciaWhereInput = {
      ...(estados ? { estado: { in: estados } } : {}),
      ...(pedido.category ? { categoria: CATEGORIA_EN_LA_BASE[pedido.category] } : {}),
    };
    const soloResueltas = estados !== null && estados.every((e) => e === 'RESUELTA');
    const filas = await this.prisma.incidencia.findMany({
      where,
      // Con un filtro de solo resueltas, la más nueva primero; si no, el enum ordena ABIERTA, EN_CURSO y RESUELTA.
      orderBy: soloResueltas ? [{ momentoDeActualizacion: 'desc' }, { id: 'asc' }] : [{ estado: 'asc' }, { momentoDeRegistro: 'asc' }, { id: 'asc' }],
      skip: desde,
      take: limite + 1,
      select: SELECCION_ADMINISTRATIVA,
    });
    const hayMas = filas.length > limite;
    await this.auditar(this.prisma, 'API-INC-03', 'EXITO', null, actor.identidadId, null, null, ctx, 'ListaDeIncidencias');
    return {
      data: filas.slice(0, limite).map(incidenciaAdministrativa),
      page: { limit: limite, nextCursor: hayMas ? Buffer.from(String(desde + limite), 'utf8').toString('base64url') : null, hasMore: hayMas },
    };
  }

  // ─── API-INC-04 ──────────────────────────────────────────────────────────────────────────────
  async detalle(actor: ActorAdministrativo, incidenciaId: string, ctx: ContextoDeSolicitud): Promise<DetalleDeIncidenciaResponse> {
    const id = esUuid(incidenciaId) ? incidenciaId.toLowerCase() : null;
    const respuesta = id ? await this.leerDetalle(this.prisma, id) : null;
    if (!respuesta) {
      await this.auditar(this.prisma, 'API-INC-04', 'RECHAZO', 'INCIDENCIA_NO_ENCONTRADA', actor.identidadId, null, id, ctx);
      throw errores.recursoNoEncontrado();
    }
    await this.auditar(this.prisma, 'API-INC-04', 'EXITO', null, actor.identidadId, respuesta.data.reporter.identityId, respuesta.data.incidentId, ctx);
    return respuesta;
  }

  // ─── API-INC-05 ──────────────────────────────────────────────────────────────────────────────
  async cambiarEstado(actor: ActorAdministrativo, incidenciaId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(CambiarEstadoDeIncidenciaRequestSchema, cuerpo);
    this.exigirClave(clave);
    const id = esUuid(incidenciaId) ? incidenciaId.toLowerCase() : null;
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-INC-05');
    try {
      return await this.idempotencia.ejecutar({ operacion: 'API-INC-05', ambito: actor.identidadId, clave: clave as string, huella: IdempotenciaService.huella({ id, pedido }) }, async (tx) => {
        // La incidencia se toma antes de decidir: dos cambios simultáneos se ordenan y el segundo ve la versión nueva.
        const [actual] = id
          ? await tx.$queryRaw<{ estado: EstadoEnLaBase; version: number; reportanteId: string }[]>`
              SELECT "estado"::text AS "estado", "version", "reportante_id"::text AS "reportanteId" FROM "incidencia" WHERE "id" = ${id}::uuid FOR UPDATE`
          : [];
        if (!id || !actual) throw new ErrorDeApi(404, 'RESOURCE_NOT_FOUND', 'Recurso no encontrado.', undefined, 'INCIDENCIA_NO_ENCONTRADA');
        const decision = decidirCambioDeIncidencia({
          estadoActual: ESTADO_API[actual.estado],
          versionActual: actual.version,
          estadoNuevo: pedido.state,
          versionEsperada: pedido.expectedVersion,
          motivo: pedido.reason,
          respuesta: pedido.response,
        });
        if (decision.tipo === 'INVALIDO') throw errores.validacionFallida([...decision.issues]);
        if (decision.tipo === 'VERSION') throw new ErrorDeApi(409, 'VERSION_CONFLICT', errores.conflictoDeVersion().mensajeSeguro, undefined, 'VERSION_VISTA_NO_VIGENTE');
        if (decision.tipo === 'MISMO_ESTADO') throw new ErrorDeApi(422, 'INVALID_STATE_TRANSITION', 'La incidencia ya está en ese estado.', undefined, 'MISMO_ESTADO');
        const momento = await momentoDeLaBase(tx);
        const numero = actual.version + 1;
        // Primero el cambio (de solo agregar) y después la incidencia: la base exige que el cambio exista.
        await tx.cambioDeIncidencia.create({
          data: {
            incidenciaId: id,
            numero,
            estadoAnterior: actual.estado,
            estadoNuevo: ESTADO_EN_LA_BASE[pedido.state],
            motivo: decision.motivo,
            respuesta: decision.respuesta,
            administradorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeRegistro: momento,
          },
        });
        await tx.incidencia.update({
          where: { id },
          data: { estado: ESTADO_EN_LA_BASE[pedido.state], version: numero, responsableId: actor.identidadId, momentoDeActualizacion: momento },
        });
        await this.auditar(tx, 'API-INC-05', 'EXITO', `${ESTADO_API[actual.estado]}->${pedido.state}`, actor.identidadId, actual.reportanteId, id, ctx);
        const respuesta = (await this.leerDetalle(tx, id)) as DetalleDeIncidenciaResponse;
        return { estadoHttp: 200, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      if (e instanceof ErrorDeApi) await this.auditar(this.prisma, 'API-INC-05', 'RECHAZO', e.motivoDeAuditoria ?? e.code, actor.identidadId, null, id, ctx);
      throw e;
    }
  }

  // ─── Piezas comunes ──────────────────────────────────────────────────────────────────────────

  private async leerDetalle(cliente: Tx | PrismaService, id: string): Promise<DetalleDeIncidenciaResponse | null> {
    const fila = await cliente.incidencia.findUnique({ where: { id }, select: SELECCION_ADMINISTRATIVA });
    if (!fila) return null;
    const cambios = await cliente.cambioDeIncidencia.findMany({
      where: { incidenciaId: id },
      orderBy: { numero: 'asc' },
      select: {
        numero: true,
        estadoAnterior: true,
        estadoNuevo: true,
        motivo: true,
        respuesta: true,
        momentoDeRegistro: true,
        administradorId: true,
        administrador: { select: { rolesAdministrativos: { select: { nombreVisible: true }, orderBy: { momentoDeRegistro: 'desc' }, take: 1 } } },
      },
    });
    return {
      data: {
        ...incidenciaAdministrativa(fila),
        history: cambios.map((c) => ({
          number: c.numero,
          from: ESTADO_API[c.estadoAnterior],
          to: ESTADO_API[c.estadoNuevo],
          reason: c.motivo,
          response: c.respuesta,
          administrator: { identityId: c.administradorId, name: nombreAdministrativo(c.administrador.rolesAdministrativos) },
          at: c.momentoDeRegistro.toISOString(),
        })),
      },
    };
  }

  /** El cupo de API-INC-01: por identidad, desde cualquier red, el mismo límite que los pedidos de derechos. El 429 queda auditado. */
  private async consumirCupo(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<void> {
    try {
      this.limitador.consumir('derechos', null, 'API-INC-01', actor.identidadId);
    } catch (e) {
      await this.auditar(this.prisma, 'API-INC-01', 'RECHAZO', 'CUPO_AGOTADO', actor.identidadId, actor.identidadId, null, ctx);
      throw e;
    }
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
    recursoId: string | null,
    ctx: ContextoDeSolicitud,
    recursoTipo = 'Incidencia',
  ): Promise<void> {
    return this.auditoria.registrar({ operacion, resultado, motivo, actorId, sujetoId, recursoTipo, recursoId, superficie: ctx.superficie, requestId: ctx.requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion }, cliente as Tx);
  }
}
