import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  ConsultarPropuestasAlRecetarioRequestSchema,
  DecidirPropuestaRequestSchema,
  METODO_DE_CALCULO_NUTRICIONAL,
  recetasParecidas,
  type CalculoDeReceta,
  type EstadoDePropuesta,
  type IngredienteDeReceta,
  type ListaDePropuestasParaRevisarResponse,
  type Parecida,
  type PropuestaParaRevisar,
  type PropuestaParaRevisarResponse,
  type ValidationIssue,
} from '@be/domain';
import { Prisma } from '@prisma/client';
import type { ActorAdministrativo } from '../administracion/sesion-administrativa.guard';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { validarCuerpo } from '../http/validacion';
import { MediosService, PROCEDENCIA_HACIA_API } from '../medios/medios.service';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { esUuid } from '../plataforma/ejecutor';
import { IdempotenciaService, type ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import { nombreVisibleDe } from './lectura-nutricion';
import { RecetasService, RECURSO_PROPUESTA } from './recetas.service';

type Tx = Prisma.TransactionClient;
type Cliente = Tx | PrismaService;
const CASO_DE_USO = 'UC-P10';

const ESTADO_EN_LA_BASE: Readonly<Record<EstadoDePropuesta, Prisma.Sql>> = {
  PENDING: Prisma.sql`d."propuesta_id" IS NULL`,
  ADDED: Prisma.sql`d."resultado" = 'SUMADA'`,
  REJECTED: Prisma.sql`d."resultado" = 'RECHAZADA'`,
};

function leerDesde(cursor: string | undefined): number {
  if (cursor === undefined) return 0;
  const texto = /^[A-Za-z0-9_-]{1,40}$/.test(cursor) ? Buffer.from(cursor, 'base64url').toString('utf8') : '';
  const n = /^\d{1,7}$/.test(texto) ? Number(texto) : -1;
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw errores.cursorInvalido();
  return n;
}

/**
 * WP-RECETARIO-E-IMAGENES (DL-191, REC-08) · Administración revisa las propuestas al Recetario de BE (API-RCT-04) y las
 * suma o no (API-RCT-05), con la autorización de WP-ADMINISTRACION: la sesión administrativa con el segundo factor la exige
 * el controlador; acá no se decide nada de autorización con lo que manda el cliente. Sigue el patrón del canon de alimentos
 * (DL-180, `revision-de-alimentos.service.ts`):
 * - **Lo que ve:** la receta propuesta (su versión, entera), quién la propuso por su nombre de profesional (nunca a quién
 *   se la indicó ni sus planes), la cesión de la foto registrada y las parecidas (`recetasParecidas`) del recetario y de
 *   las otras propuestas que esperan. La imagen, con sus rutas firmadas de 15 minutos y sin caché: mientras no se suma, es
 *   de quien la propuso.
 * - **Sumarla:** una receta del recetario nueva (sin profesional, de todos), con el contenido de la versión propuesta,
 *   recalculado, y su imagen: el mismo medio, que desde ahí lee cualquier profesional de Nutrición por la cesión. La receta
 *   del profesional sigue siendo suya. Un alimento retirado desde que se propuso: 422 CATALOG_REFERENCE_INVALID.
 * - **No sumarla:** con un motivo opcional, que ve quien la propuso.
 * - Una sola decisión por propuesta (la clave de la tabla): decidir otra vez es 422 INVALID_STATE_TRANSITION.
 * - La auditoría registra cada operación sin los textos.
 */
@Injectable()
export class PropuestasAlRecetarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencia: IdempotenciaService,
    private readonly auditoria: AuditoriaService,
    private readonly medios: MediosService,
    private readonly recetas: RecetasService,
  ) {}

  // ─── API-RCT-04 ──────────────────────────────────────────────────────────────────────────────
  async consultar(actor: ActorAdministrativo, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ListaDePropuestasParaRevisarResponse> {
    const pedido = validarCuerpo(ConsultarPropuestasAlRecetarioRequestSchema, cuerpo);
    const limite = pedido.limit ?? 20;
    const desde = leerDesde(pedido.cursor);
    const filas = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT p."id"::text AS "id"
        FROM "propuesta_al_recetario" p
        LEFT JOIN "decision_sobre_propuesta_al_recetario" d ON d."propuesta_id" = p."id"
       WHERE ${pedido.state ? ESTADO_EN_LA_BASE[pedido.state] : Prisma.sql`TRUE`}
       ORDER BY (d."propuesta_id" IS NULL) DESC, p."momento_de_registro" DESC, p."id" DESC
       OFFSET ${desde} LIMIT ${limite + 1}`;
    const hayMas = filas.length > limite;
    const data = await this.leerPropuestas(this.prisma, filas.slice(0, limite).map((f) => f.id));
    await this.auditar(this.prisma, 'API-RCT-04', 'EXITO', null, actor.identidadId, null, ctx);
    return { data, page: { limit: limite, nextCursor: hayMas ? Buffer.from(String(desde + limite), 'utf8').toString('base64url') : null, hasMore: hayMas } };
  }

  // ─── API-RCT-05 ──────────────────────────────────────────────────────────────────────────────
  async decidir(actor: ActorAdministrativo, propuestaId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const pedido = validarCuerpo(DecidirPropuestaRequestSchema, cuerpo);
    if (!IdempotenciaService.claveValida(clave)) throw errores.solicitudInvalida([{ code: 'IDEMPOTENCY_KEY_REQUIRED', path: 'Idempotency-Key' }], { header: 'Idempotency-Key' });
    const id = esUuid(propuestaId) ? propuestaId.toLowerCase() : null;
    const motivo = pedido.reason?.trim() || null;
    if (pedido.decision === 'ADD' && motivo) {
      await this.auditar(this.prisma, 'API-RCT-05', 'RECHAZO', 'VALIDATION_FAILED', actor.identidadId, id, ctx);
      throw errores.validacionFallida([{ code: 'REASON_NOT_EXPECTED', path: 'reason' }]);
    }
    const procedencia = procedenciaDe(ctx, CASO_DE_USO, 'API-RCT-05');
    try {
      return await this.idempotencia.ejecutar({ operacion: 'API-RCT-05', ambito: actor.identidadId, clave: clave as string, huella: IdempotenciaService.huella({ id, pedido }) }, async (tx) => {
        // La propuesta se toma antes de decidir: dos decisiones simultáneas se ordenan, y la segunda ve la primera.
        const [tomada] = id ? await tx.$queryRaw<{ id: string }[]>`SELECT "id"::text AS "id" FROM "propuesta_al_recetario" WHERE "id" = ${id}::uuid FOR NO KEY UPDATE` : [];
        if (!tomada) throw new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, 'PROPUESTA_NO_ENCONTRADA');
        const p = await tx.propuestaAlRecetario.findUniqueOrThrow({ where: { id: tomada.id }, include: { versionDeReceta: true, decision: true } });
        if (p.decision) throw new ErrorDeApi(422, CodigoDeError.INVALID_STATE_TRANSITION, 'Esta propuesta ya se decidió.', undefined, 'PROPUESTA_DECIDIDA');
        const momento = await momentoDeLaBase(tx);
        if (pedido.decision === 'ADD') {
          const v = p.versionDeReceta;
          const ingredientes = v.ingredientes as unknown as IngredienteDeReceta[];
          // Lo cargado a mano no entra al recetario (REC-D09): la propuesta ya lo impidió, y acá se vuelve a mirar.
          const propios = await tx.elementoDeCatalogoNutricional.findMany({ where: { id: { in: ingredientes.map((i) => i.catalogItemId) }, procedencia: 'PROFESSIONAL_MANUAL' }, select: { id: true } });
          const deMano = new Set(propios.map((x) => x.id));
          const issues: ValidationIssue[] = [];
          ingredientes.forEach((i, n) => {
            if (deMano.has(i.catalogItemId)) issues.push({ code: 'OWN_FOOD_NOT_PROPOSABLE', path: `ingredients[${n}].catalogItemId` });
          });
          if (issues.length > 0) throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'La receta tiene alimentos cargados a mano.', { issues });
          const { guardados, calculo } = await this.recetas.ingredientesCalculados(
            tx,
            p.profesionalId,
            v.porciones,
            ingredientes.map((i) => ({ catalogItemId: i.catalogItemId, catalogItemVersionId: i.catalogItemVersionId, quantity: i.quantity, preparationState: i.preparationState })),
          );
          const delRecetario = { ...procedencia, recetario: { propuestaId: p.id, recetaPropuestaId: p.recetaId, versionPropuestaId: v.id } };
          const canon = await tx.receta.create({ data: { profesionalId: null, momentoDeActualizacion: momento } });
          await tx.versionDeReceta.create({
            data: {
              recetaId: canon.id,
              numero: 1,
              nombre: v.nombre,
              descripcion: v.descripcion,
              porciones: v.porciones,
              pasos: v.pasos as unknown as Prisma.InputJsonValue,
              ingredientes: guardados as unknown as Prisma.InputJsonValue,
              metodoDeCalculo: METODO_DE_CALCULO_NUTRICIONAL,
              resultado: calculo as unknown as Prisma.InputJsonValue,
              // La versión la escribió quien la propuso; la sumó el administrador (va en la procedencia y en la fila del recetario).
              autorId: p.profesionalId,
              procedencia: delRecetario as unknown as Prisma.InputJsonValue,
            },
          });
          await tx.recetaDelRecetario.create({
            data: { recetaId: canon.id, propuestaId: p.id, administradorId: actor.identidadId, claveDeSemilla: null, procedencia: delRecetario as unknown as Prisma.InputJsonValue, momentoDeRegistro: momento },
          });
          if (p.medioId) {
            const medio = await tx.medio.findUnique({ where: { id: p.medioId }, select: { estado: true } });
            if (medio?.estado === 'DISPONIBLE') {
              await tx.asociacionDeImagenDeReceta.create({
                data: { recetaId: canon.id, numero: 1, cambio: 'ASOCIAR', medioId: p.medioId, autorId: actor.identidadId, procedencia: delRecetario as unknown as Prisma.InputJsonValue },
              });
            }
          }
          await tx.decisionSobrePropuestaAlRecetario.create({
            data: { propuestaId: p.id, resultado: 'SUMADA', motivo: null, administradorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeRegistro: momento },
          });
          await this.auditar(tx, 'API-RCT-05', 'EXITO', 'SUMADA', actor.identidadId, p.id, ctx);
        } else {
          await tx.decisionSobrePropuestaAlRecetario.create({
            data: { propuestaId: p.id, resultado: 'RECHAZADA', motivo, administradorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeRegistro: momento },
          });
          await this.auditar(tx, 'API-RCT-05', 'EXITO', 'RECHAZADA', actor.identidadId, p.id, ctx);
        }
        const [leida] = await this.leerPropuestas(tx, [p.id]);
        const respuesta: PropuestaParaRevisarResponse = { data: leida! };
        return { estadoHttp: 200, cuerpo: respuesta as unknown as Prisma.InputJsonValue };
      });
    } catch (e) {
      if (e instanceof ErrorDeApi) await this.auditar(this.prisma, 'API-RCT-05', 'RECHAZO', e.motivoDeAuditoria ?? e.code, actor.identidadId, id, ctx);
      throw e;
    }
  }

  // ─── Piezas comunes ──────────────────────────────────────────────────────────────────────────

  /** Las propuestas, en el orden de `ids`, en la forma de lo que ve Administración. */
  private async leerPropuestas(cliente: Cliente, ids: readonly string[]): Promise<PropuestaParaRevisar[]> {
    if (ids.length === 0) return [];
    const c = cliente as Tx;
    const propuestas = await c.propuestaAlRecetario.findMany({
      where: { id: { in: [...ids] } },
      include: { versionDeReceta: true, decision: true, recetaDelRecetario: { select: { recetaId: true } }, medio: true },
    });
    const porId = new Map(propuestas.map((p) => [p.id, p]));
    const nombres = new Map<string, string>();
    for (const profesionalId of new Set(propuestas.map((p) => p.profesionalId))) nombres.set(profesionalId, await nombreVisibleDe(c, profesionalId));
    // Las candidatas a parecidas: el recetario vigente y las propuestas que esperan.
    const delRecetario = await c.$queryRaw<{ recetaId: string; nombre: string; propuestaId: string | null }[]>`
      SELECT r."id"::text AS "recetaId", v."nombre", rr."propuesta_id"::text AS "propuestaId"
        FROM "receta" r JOIN "receta_del_recetario" rr ON rr."receta_id" = r."id"
        JOIN "version_de_receta" v ON v."receta_id" = r."id"
       WHERE NOT EXISTS (SELECT 1 FROM "version_de_receta" s WHERE s."predecesora_id" = v."id")`;
    const pendientes = await c.$queryRaw<{ propuestaId: string; recetaId: string; nombre: string }[]>`
      SELECT p."id"::text AS "propuestaId", p."receta_id"::text AS "recetaId", v."nombre"
        FROM "propuesta_al_recetario" p JOIN "version_de_receta" v ON v."id" = p."version_de_receta_id"
       WHERE NOT EXISTS (SELECT 1 FROM "decision_sobre_propuesta_al_recetario" d WHERE d."propuesta_id" = p."id")`;
    return ids.flatMap((id) => {
      const p = porId.get(id);
      if (!p) return [];
      const v = p.versionDeReceta;
      const candidatas: Parecida[] = [
        ...delRecetario.filter((r) => r.propuestaId !== p.id).map((r) => ({ kind: 'BE_RECIPE' as const, recipeId: r.recetaId, proposalId: null, name: r.nombre })),
        ...pendientes.filter((x) => x.propuestaId !== p.id).map((x) => ({ kind: 'PROPOSAL' as const, recipeId: x.recetaId, proposalId: x.propuestaId, name: x.nombre })),
      ];
      const estado: EstadoDePropuesta = !p.decision ? 'PENDING' : p.decision.resultado === 'SUMADA' ? 'ADDED' : 'REJECTED';
      const m = p.medio;
      const imagen =
        m && m.estado === 'DISPONIBLE' && m.anchoProcesado && m.altoProcesado
          ? {
              mediaId: m.id,
              provenance: PROCEDENCIA_HACIA_API[m.procedenciaDeImagen],
              authorship: m.autoria,
              width: m.anchoProcesado,
              height: m.altoProcesado,
              attachedAt: p.momentoDeRegistro.toISOString(),
              paths: this.medios.rutasParaRevisar(m.id),
            }
          : null;
      const propuesta: PropuestaParaRevisar = {
        proposalId: p.id,
        recipeId: p.recetaId,
        recipeVersionId: v.id,
        versionNumber: v.numero,
        name: v.nombre,
        status: estado,
        photoAssignment: p.versionDeLaCesion && p.momentoDeLaCesion ? { textVersion: p.versionDeLaCesion, acceptedAt: p.momentoDeLaCesion.toISOString() } : null,
        proposedAt: p.momentoDeRegistro.toISOString(),
        decidedAt: p.decision?.momentoDeRegistro.toISOString() ?? null,
        reason: p.decision?.motivo ?? null,
        recipeBookRecipeId: p.recetaDelRecetario?.recetaId ?? null,
        proposedBy: { displayName: nombres.get(p.profesionalId) ?? 'Profesional' },
        recipe: {
          name: v.nombre,
          description: v.descripcion,
          servings: v.porciones,
          ingredients: v.ingredientes as unknown as IngredienteDeReceta[],
          steps: v.pasos as unknown as string[],
          calculation: v.resultado as unknown as CalculoDeReceta,
          image: imagen,
        },
        similar: recetasParecidas(v.nombre, candidatas),
      };
      return [propuesta];
    });
  }

  private auditar(cliente: Cliente, operacion: string, resultado: 'EXITO' | 'RECHAZO', motivo: string | null, actorId: string, recursoId: string | null, ctx: ContextoDeSolicitud): Promise<void> {
    return this.auditoria.registrar(
      { operacion, resultado, motivo, actorId, sujetoId: null, recursoTipo: RECURSO_PROPUESTA, recursoId, superficie: ctx.superficie, requestId: ctx.requestId, momentoDeOcurrencia: ctx.momentoDeRecepcion },
      cliente as Tx,
    );
  }
}
