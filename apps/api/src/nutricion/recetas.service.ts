import { Injectable } from '@nestjs/common';
import {
  AsociarImagenDeRecetaRequestSchema,
  CalcularRecetaRequestSchema,
  CESION_DE_LA_FOTO,
  CodigoDeError,
  CrearRecetaRequestSchema,
  CuerpoVacioSchema,
  EditarRecetaRequestSchema,
  METODO_DE_CALCULO_NUTRICIONAL,
  ProponerAlRecetarioRequestSchema,
  TokenDeVersionSchema,
  type CalculoDeRecetaResponse,
  type DetalleDeRecetaResponse,
  type IngredienteDeReceta,
  type IngredienteDeRecetaEntrada,
  type ListaDeRecetasResponse,
  type Procedencia,
  type PropuestaAlRecetario,
  type ValidationIssue,
} from '@be/domain';
import { Prisma, type TipoDeEventoDeNutricion } from '@prisma/client';
import { createHash } from 'node:crypto';
import { CON_MARCA, SIN_MARCA, sinMarcas } from '../http/busqueda';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { escribirCursor, leerConsultaDeLista } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import { MediosService } from '../medios/medios.service';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esToken } from '../vinculo/lectura';
import { CatalogoService } from './catalogo.service';
import { EjecutorNutricional, esUuid } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';
import { calcularReceta, datosDelRecetario, imagenesVigentes, leerReceta, leerRecetas, RECURSO_RECETA, versionesVigentes } from './lectura-recetas';
import { exigirProfesionalDeNutricion } from './profesional-de-nutricion';

type Tx = Prisma.TransactionClient;
const CASO_DE_USO = 'UC-P10';
/** DL-191: cómo se audita una propuesta al Recetario de BE. */
export const RECURSO_PROPUESTA = 'PropuestaAlRecetario';
/** DL-191 (REC-D08): el SHA-256 del texto de la cesión que se aceptó, para saber después qué texto fue. */
export const HUELLA_DE_LA_CESION = createHash('sha256').update(CESION_DE_LA_FOTO.texto, 'utf8').digest('hex');

/** El cursor del recetario: el lugar en el orden alfabético, en base64url. */
function leerDesde(cursor: unknown): number {
  if (cursor === undefined) return 0;
  const texto = typeof cursor === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(cursor) ? Buffer.from(cursor, 'base64url').toString('utf8') : '';
  const n = /^\d{1,7}$/.test(texto) ? Number(texto) : -1;
  if (!Number.isInteger(n) || n < 0 || n > 1_000_000) throw errores.cursorInvalido();
  return n;
}

/**
 * DL-119 — Recetas del profesional de Nutrición (API-REC-01 a 07): una **preparación propia** con sus recursos visuales en
 * su ámbito (REG-06-135, inciso 2).
 * - Solo un profesional de Nutrición verificado y habilitado (otro actor, 403); lo ajeno es el mismo 404 que lo
 *   inexistente.
 * - Cada ingrediente cita un elemento **y** una versión del catálogo, disponibles para este profesional (globales o
 *   propios); si no, 422 CATALOG_REFERENCE_INVALID con la ruta. No se convierten estados ni unidades (06:4617-4621).
 * - El cálculo lo hace la API (SUM_SOURCE_PER_100G_V1) y se guarda con la versión: el cliente no manda totales.
 * - Editar emite una versión nueva e inmutable; la imagen va en la receta (una fila por cambio), así que reemplazarla o
 *   retirarla no toca versiones, planes ni registros. `expectedVersion` cuida las dos cosas: 409 VERSION_CONFLICT.
 */
@Injectable()
export class RecetasService {
  constructor(
    private readonly ejecutor: EjecutorNutricional,
    private readonly catalogo: CatalogoService,
    private readonly medios: MediosService,
  ) {}

  // ─── API-REC-01 ────────────────────────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-REC-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearRecetaRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const { guardados, calculo } = await this.ingredientesCalculados(tx, actor.identidadId, pedido.servings, pedido.ingredients);
        const momento = await momentoDeLaBase(tx);
        const receta = await tx.receta.create({ data: { profesionalId: actor.identidadId, momentoDeActualizacion: momento } });
        await tx.versionDeReceta.create({
          data: {
            recetaId: receta.id,
            numero: 1,
            nombre: pedido.name,
            descripcion: pedido.description || null,
            porciones: pedido.servings,
            pasos: pedido.steps as unknown as Prisma.InputJsonValue,
            ingredientes: guardados as unknown as Prisma.InputJsonValue,
            metodoDeCalculo: METODO_DE_CALCULO_NUTRICIONAL,
            resultado: calculo as unknown as Prisma.InputJsonValue,
            autorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        await this.evento(tx, 'RecetaCreada', actor.identidadId, receta.id, procedencia, momento);
        return { estadoHttp: 201, cuerpo: { data: await leerReceta(tx, receta.id) }, sujetoId: null, recurso: { tipo: RECURSO_RECETA, id: receta.id } };
      },
    });
  }

  // ─── API-REC-02 ────────────────────────────────────────────────────────────────────────────
  /** Las propias, la editada más recientemente primero; el cursor es la última (momento de actualización, id) servida. */
  listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<ListaDeRecetasResponse> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-REC-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const c = consulta.cursor;
        const filas = await tx.receta.findMany({
          where: {
            profesionalId: actor.identidadId,
            ...(c ? { OR: [{ momentoDeActualizacion: { lt: c.momento } }, { momentoDeActualizacion: c.momento, id: { lt: c.id } }] } : {}),
          },
          orderBy: [{ momentoDeActualizacion: 'desc' }, { id: 'desc' }],
          take: consulta.limit + 1,
        });
        const hayMas = filas.length > consulta.limit;
        const pagina = filas.slice(0, consulta.limit);
        const ultima = pagina[pagina.length - 1];
        return {
          data: await leerRecetas(tx, pagina),
          page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeActualizacion, ultima.id) : null, hasMore: hayMas },
        };
      },
    });
  }

  // ─── API-REC-03 ────────────────────────────────────────────────────────────────────────────
  /** Una propia o, desde DL-191, una del Recetario de BE (de solo lectura), con las rutas de su imagen ya firmadas. */
  consultar(actor: ActorAutenticado, recipeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<DetalleDeRecetaResponse> {
    if (Object.keys(query ?? {}).length > 0) throw errores.solicitudInvalida(Object.keys(query).map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
    const recurso = { tipo: RECURSO_RECETA, id: recipeId };
    return this.ejecutor.leer({
      operacion: 'API-REC-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const r = esUuid(recipeId) ? await tx.receta.findFirst({ where: { id: recipeId, OR: [{ profesionalId: actor.identidadId }, { delRecetario: { isNot: null } }] } }) : null;
        if (!r) throw this.ejecutor.noRevelable({ operacion: 'API-REC-03', actorId: actor.identidadId, recurso }, ctx);
        const versiones = await tx.versionDeReceta.findMany({ where: { recetaId: r.id }, orderBy: { numero: 'asc' } });
        const receta = (await leerRecetas(tx, [r], (medioId) => this.medios.rutasDelRecetario(medioId)))[0]!;
        return {
          data: { ...receta, versions: versiones.map((v) => ({ recipeVersionId: v.id, versionNumber: v.numero, name: v.nombre, recordedAt: v.momentoDeRegistro.toISOString() })) },
        };
      },
    });
  }

  // ─── API-REC-04 ────────────────────────────────────────────────────────────────────────────
  editar(actor: ActorAutenticado, recipeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_RECETA, id: recipeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-REC-04',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: EditarRecetaRequestSchema,
      cuerpo,
      huellaExtra: { recipeId },
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const r = await this.propiaBloqueada(tx, 'API-REC-04', actor, recipeId, ctx);
        if (!esToken(pedido.expectedVersion, r.version)) throw errores.conflictoDeVersion();
        const anterior = (await versionesVigentes(tx, [r.id])).get(r.id);
        if (!anterior) throw errores.interno();
        const { guardados, calculo } = await this.ingredientesCalculados(tx, actor.identidadId, pedido.servings, pedido.ingredients);
        const momento = await momentoDeLaBase(tx);
        await tx.versionDeReceta.create({
          data: {
            recetaId: r.id,
            predecesoraId: anterior.id,
            numero: anterior.numero + 1,
            nombre: pedido.name,
            descripcion: pedido.description || null,
            porciones: pedido.servings,
            pasos: pedido.steps as unknown as Prisma.InputJsonValue,
            ingredientes: guardados as unknown as Prisma.InputJsonValue,
            metodoDeCalculo: METODO_DE_CALCULO_NUTRICIONAL,
            resultado: calculo as unknown as Prisma.InputJsonValue,
            autorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.receta.update({ where: { id: r.id }, data: { version: r.version + 1, momentoDeActualizacion: momento } });
        await this.evento(tx, 'RecetaVersionada', actor.identidadId, r.id, procedencia, momento);
        return { estadoHttp: 200, cuerpo: { data: await leerReceta(tx, r.id) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-REC-05 ────────────────────────────────────────────────────────────────────────────
  asociarImagen(actor: ActorAutenticado, recipeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_RECETA, id: recipeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-REC-05',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: AsociarImagenDeRecetaRequestSchema,
      cuerpo,
      huellaExtra: { recipeId },
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const r = await this.propiaBloqueada(tx, 'API-REC-05', actor, recipeId, ctx);
        if (!esToken(pedido.expectedVersion, r.version)) throw errores.conflictoDeVersion();
        // Un medio propio, disponible y de referencia. La foto de una comida no sirve: es del titular (08 §21).
        const problemas = await this.medios.problemasDeReferencia(tx, actor.identidadId, [pedido.mediaId], 'RECETA_REFERENCIA', () => 'mediaId');
        if (problemas.length > 0) throw errores.referenciaDeMedioInvalida(problemas);
        const momento = await momentoDeLaBase(tx);
        await tx.asociacionDeImagenDeReceta.create({
          data: { recetaId: r.id, numero: await this.siguienteCambioDeImagen(tx, r.id), cambio: 'ASOCIAR', medioId: pedido.mediaId, autorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue },
        });
        await tx.receta.update({ where: { id: r.id }, data: { version: r.version + 1, momentoDeActualizacion: momento } });
        await this.evento(tx, 'ImagenDeRecetaAsociada', actor.identidadId, r.id, procedencia, momento);
        return { estadoHttp: 200, cuerpo: { data: await leerReceta(tx, r.id) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-REC-06 ────────────────────────────────────────────────────────────────────────────
  /** Retirar deja la historia (una fila más) y no borra el medio. Sin imagen vigente, no hay nada que retirar: 200 igual. */
  retirarImagen(actor: ActorAutenticado, recipeId: string, query: Record<string, unknown>, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const { expectedVersion, ...resto } = query ?? {};
    const desconocidos = Object.keys(resto);
    if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
    const version = TokenDeVersionSchema.safeParse(expectedVersion);
    if (!version.success) throw errores.solicitudInvalida([{ code: expectedVersion === undefined ? 'EXPECTED_VERSION_REQUIRED' : 'INVALID_VERSION', path: 'expectedVersion' }]);
    const recurso = { tipo: RECURSO_RECETA, id: recipeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-REC-06',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CuerpoVacioSchema,
      cuerpo,
      huellaExtra: { recipeId, expectedVersion: version.data },
      efecto: async (tx, _pedido, procedencia) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const r = await this.propiaBloqueada(tx, 'API-REC-06', actor, recipeId, ctx);
        if (!esToken(version.data, r.version)) throw errores.conflictoDeVersion();
        const vigente = (await imagenesVigentes(tx, [r.id])).get(r.id) ?? null;
        if (vigente) {
          const momento = await momentoDeLaBase(tx);
          await tx.asociacionDeImagenDeReceta.create({
            data: { recetaId: r.id, numero: await this.siguienteCambioDeImagen(tx, r.id), cambio: 'RETIRAR', medioId: null, autorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue },
          });
          await tx.receta.update({ where: { id: r.id }, data: { version: r.version + 1, momentoDeActualizacion: momento } });
          await this.evento(tx, 'ImagenDeRecetaRetirada', actor.identidadId, r.id, procedencia, momento);
        }
        return { estadoHttp: 200, cuerpo: { data: await leerReceta(tx, r.id) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-REC-07 ────────────────────────────────────────────────────────────────────────────
  /** Calcula sin guardar: lo que se ve mientras se edita. Al guardar, el servidor vuelve a calcular. */
  calcular(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<CalculoDeRecetaResponse> {
    const pedido = validarCuerpo(CalcularRecetaRequestSchema, cuerpo);
    return this.ejecutor.leer({
      operacion: 'API-REC-07',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const { calculo } = await this.ingredientesCalculados(tx, actor.identidadId, pedido.servings, pedido.ingredients);
        return { data: calculo };
      },
    });
  }

  // ─── API-RCT-01 (DL-191) ───────────────────────────────────────────────────────────────────
  /**
   * El Recetario de BE, en orden alfabético por el nombre de la versión vigente, filtrado por `q` (sin tildes ni
   * mayúsculas). La imagen trae sus rutas ya firmadas (REC-D10): la lista no pide un acceso por imagen.
   */
  recetario(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<ListaDeRecetasResponse> {
    const { q, cursor, ...resto } = query ?? {};
    const consulta = leerConsultaDeLista(resto, {});
    const desde = leerDesde(cursor);
    if (q !== undefined && (typeof q !== 'string' || q.length > 80)) throw errores.solicitudInvalida([{ code: 'INVALID_FILTER', path: 'q' }]);
    const texto = typeof q === 'string' ? sinMarcas(q).toLowerCase().replace(/\s+/g, ' ').trim() : '';
    const conTexto = texto ? Prisma.sql`lower(translate(v."nombre", ${CON_MARCA}, ${SIN_MARCA})) LIKE ${`%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`}` : Prisma.sql`TRUE`;
    return this.ejecutor.leer({
      operacion: 'API-RCT-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const orden = await tx.$queryRaw<{ id: string }[]>`
          SELECT r."id"::text AS "id"
            FROM "receta" r
            JOIN "receta_del_recetario" rr ON rr."receta_id" = r."id"
            JOIN "version_de_receta" v ON v."receta_id" = r."id"
           WHERE NOT EXISTS (SELECT 1 FROM "version_de_receta" s WHERE s."predecesora_id" = v."id") AND ${conTexto}
           ORDER BY lower(translate(v."nombre", ${CON_MARCA}, ${SIN_MARCA})), r."id"
           OFFSET ${desde} LIMIT ${consulta.limit + 1}`;
        const hayMas = orden.length > consulta.limit;
        const ids = orden.slice(0, consulta.limit).map((f) => f.id);
        const filas = ids.length ? await tx.receta.findMany({ where: { id: { in: ids } } }) : [];
        const porId = new Map(filas.map((r) => [r.id, r]));
        return {
          data: await leerRecetas(tx, ids.map((id) => porId.get(id)!), (medioId) => this.medios.rutasDelRecetario(medioId)),
          page: { limit: consulta.limit, nextCursor: hayMas ? Buffer.from(String(desde + consulta.limit), 'utf8').toString('base64url') : null, hasMore: hayMas },
        };
      },
    });
  }

  // ─── API-RCT-02 (DL-191) ───────────────────────────────────────────────────────────────────
  /**
   * «Copiar a Mis recetas»: una receta propia (versión 1) con el contenido de la versión vigente de la del recetario,
   * citando los mismos alimentos y recalculada, y con la misma imagen: una asociación al mismo medio, sin duplicar bytes
   * (REC-D06). La copia queda anotada con su origen.
   */
  copiar(actor: ActorAutenticado, recipeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_RECETA, id: recipeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-RCT-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CuerpoVacioSchema,
      cuerpo,
      huellaExtra: { recipeId },
      efecto: async (tx, _pedido, procedencia) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const origen = esUuid(recipeId) ? await tx.receta.findFirst({ where: { id: recipeId, delRecetario: { isNot: null } } }) : null;
        if (!origen) throw this.ejecutor.noRevelable({ operacion: 'API-RCT-02', actorId: actor.identidadId, recurso }, ctx);
        const v = (await versionesVigentes(tx, [origen.id])).get(origen.id);
        if (!v) throw errores.interno();
        const ingredientes = (v.ingredientes as unknown as IngredienteDeReceta[]).map((i) => ({
          catalogItemId: i.catalogItemId,
          catalogItemVersionId: i.catalogItemVersionId,
          quantity: i.quantity,
          preparationState: i.preparationState,
        }));
        const { guardados, calculo } = await this.ingredientesCalculados(tx, actor.identidadId, v.porciones, ingredientes);
        const momento = await momentoDeLaBase(tx);
        const copia = await tx.receta.create({ data: { profesionalId: actor.identidadId, momentoDeActualizacion: momento } });
        await tx.versionDeReceta.create({
          data: {
            recetaId: copia.id,
            numero: 1,
            nombre: v.nombre,
            descripcion: v.descripcion,
            porciones: v.porciones,
            pasos: v.pasos as unknown as Prisma.InputJsonValue,
            ingredientes: guardados as unknown as Prisma.InputJsonValue,
            metodoDeCalculo: METODO_DE_CALCULO_NUTRICIONAL,
            resultado: calculo as unknown as Prisma.InputJsonValue,
            autorId: actor.identidadId,
            procedencia: { ...procedencia, copiaDelRecetario: { recipeId: origen.id, recipeVersionId: v.id } } as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.copiaDeRecetaDelRecetario.create({ data: { recetaId: copia.id, origenId: origen.id, procedencia: procedencia as unknown as Prisma.InputJsonValue, momentoDeRegistro: momento } });
        const imagen = (await imagenesVigentes(tx, [origen.id])).get(origen.id) ?? null;
        if (imagen) {
          await tx.asociacionDeImagenDeReceta.create({
            data: { recetaId: copia.id, numero: 1, cambio: 'ASOCIAR', medioId: imagen.mediaId, autorId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue },
          });
        }
        await this.evento(tx, 'RecetaCreada', actor.identidadId, copia.id, procedencia, momento);
        return { estadoHttp: 201, cuerpo: { data: await leerReceta(tx, copia.id) }, sujetoId: null, recurso: { tipo: RECURSO_RECETA, id: copia.id } };
      },
    });
  }

  // ─── API-RCT-03 (DL-191) ───────────────────────────────────────────────────────────────────
  /**
   * Proponer una receta propia al Recetario de BE, en su versión vigente. Con imagen, la cesión de la foto en la versión
   * vigente del texto, registrada con su SHA-256 y su momento (REC-D08). Un alimento cargado a mano no se propone: lo propio
   * no se comparte (NUA-D14), y una receta del recetario tiene que poder citarla cualquiera (REC-D09).
   */
  proponer(actor: ActorAutenticado, recipeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_RECETA, id: recipeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-RCT-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: ProponerAlRecetarioRequestSchema,
      cuerpo,
      huellaExtra: { recipeId },
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const r = await this.propiaBloqueada(tx, 'API-RCT-03', actor, recipeId, ctx);
        if (!esToken(pedido.expectedVersion, r.version)) throw errores.conflictoDeVersion();
        const v = (await versionesVigentes(tx, [r.id])).get(r.id);
        if (!v) throw errores.interno();
        const ultima = (await datosDelRecetario(tx, [r.id])).get(r.id)?.propuesta ?? null;
        if (ultima?.status === 'PENDING') {
          throw new ErrorDeApi(422, CodigoDeError.INVALID_STATE_TRANSITION, 'Esta receta ya está propuesta: espera la revisión de Administración.', undefined, 'PROPUESTA_PENDIENTE');
        }
        if (ultima?.status === 'ADDED' && ultima.versionNumber === v.numero) {
          throw new ErrorDeApi(422, CodigoDeError.INVALID_STATE_TRANSITION, 'Esta versión ya está en el Recetario de BE.', undefined, 'VERSION_YA_SUMADA');
        }
        const issues: ValidationIssue[] = [];
        const ingredientes = v.ingredientes as unknown as IngredienteDeReceta[];
        const propios = await tx.elementoDeCatalogoNutricional.findMany({ where: { id: { in: ingredientes.map((i) => i.catalogItemId) }, procedencia: 'PROFESSIONAL_MANUAL' }, select: { id: true } });
        const deMano = new Set(propios.map((p) => p.id));
        ingredientes.forEach((i, n) => {
          if (deMano.has(i.catalogItemId)) issues.push({ code: 'OWN_FOOD_NOT_PROPOSABLE', path: `ingredients[${n}].catalogItemId` });
        });
        const imagen = (await imagenesVigentes(tx, [r.id])).get(r.id) ?? null;
        if (imagen && !pedido.photoAssignment) issues.push({ code: 'PHOTO_ASSIGNMENT_REQUIRED', path: 'photoAssignment' });
        if (imagen && pedido.photoAssignment && pedido.photoAssignment.textVersion !== CESION_DE_LA_FOTO.version) issues.push({ code: 'PHOTO_ASSIGNMENT_OUTDATED', path: 'photoAssignment.textVersion' });
        if (!imagen && pedido.photoAssignment) issues.push({ code: 'PHOTO_ASSIGNMENT_NOT_EXPECTED', path: 'photoAssignment' });
        if (issues.length > 0) throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'La receta no se puede proponer así.', { issues });
        const momento = await momentoDeLaBase(tx);
        const propuesta = await tx.propuestaAlRecetario.create({
          data: {
            recetaId: r.id,
            versionDeRecetaId: v.id,
            profesionalId: actor.identidadId,
            medioId: imagen?.mediaId ?? null,
            versionDeLaCesion: imagen ? CESION_DE_LA_FOTO.version : null,
            huellaDeLaCesion: imagen ? HUELLA_DE_LA_CESION : null,
            momentoDeLaCesion: imagen ? momento : null,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeRegistro: momento,
          },
        });
        const data: PropuestaAlRecetario = {
          proposalId: propuesta.id,
          recipeId: r.id,
          recipeVersionId: v.id,
          versionNumber: v.numero,
          name: v.nombre,
          status: 'PENDING',
          photoAssignment: imagen ? { textVersion: CESION_DE_LA_FOTO.version, acceptedAt: momento.toISOString() } : null,
          proposedAt: momento.toISOString(),
          decidedAt: null,
          reason: null,
          recipeBookRecipeId: null,
        };
        return { estadoHttp: 201, cuerpo: { data }, sujetoId: null, recurso: { tipo: RECURSO_PROPUESTA, id: propuesta.id } };
      },
    });
  }

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────

  /**
   * Los ingredientes como se guardan (con el nombre de la versión citada) y el cálculo con la composición de esa versión.
   * Cada referencia inválida se informa con su ruta; ninguna se resuelve por nombre.
   */
  async ingredientesCalculados(
    tx: Tx,
    profesionalId: string,
    porciones: number,
    entrada: readonly IngredienteDeRecetaEntrada[],
  ): Promise<{ guardados: IngredienteDeReceta[]; calculo: ReturnType<typeof calcularReceta> }> {
    const versiones = await this.catalogo.versionesCitables(tx, profesionalId, entrada.map((i) => i.catalogItemVersionId));
    const issues: { code: string; path: string }[] = [];
    entrada.forEach((ing, i) => {
      const v = versiones.get(ing.catalogItemVersionId);
      if (!v) issues.push({ code: 'CATALOG_REFERENCE_INVALID', path: `ingredients[${i}].catalogItemVersionId` });
      else if (v.elementoId !== ing.catalogItemId) issues.push({ code: 'CATALOG_REFERENCE_INVALID', path: `ingredients[${i}].catalogItemId` });
    });
    if (issues.length > 0) throw new ErrorDeApi(422, CodigoDeError.CATALOG_REFERENCE_INVALID, 'Hay ingredientes que no se pueden usar en la receta.', { issues });
    const guardados = entrada.map((ing, i) => ({
      order: i + 1,
      catalogItemId: ing.catalogItemId,
      catalogItemVersionId: ing.catalogItemVersionId,
      name: versiones.get(ing.catalogItemVersionId)!.nombre,
      quantity: ing.quantity,
      preparationState: ing.preparationState,
    }));
    const calculo = calcularReceta(
      porciones,
      entrada.map((ing) => ({ quantity: ing.quantity, composicion: versiones.get(ing.catalogItemVersionId)!.composicion })),
    );
    return { guardados, calculo };
  }

  /**
   * La receta propia, bloqueada (las ediciones y los cambios de imagen se ordenan acá). Ajena o inexistente: el mismo 404,
   * con la decisión registrada; el dueño va en el mismo `WHERE` que el bloqueo, así nadie espera por una receta ajena.
   */
  private async propiaBloqueada(tx: Tx, operacion: string, actor: ActorAutenticado, recipeId: string, ctx: ContextoDeSolicitud): Promise<{ id: string; version: number }> {
    const [r] = esUuid(recipeId)
      ? await tx.$queryRaw<{ id: string; version: number }[]>`
          SELECT "id"::text AS "id", "version" FROM "receta" WHERE "id" = ${recipeId}::uuid AND "profesional_id" = ${actor.identidadId}::uuid FOR NO KEY UPDATE`
      : [];
    if (!r) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso: { tipo: RECURSO_RECETA, id: recipeId } }, ctx);
    return r;
  }

  private async siguienteCambioDeImagen(tx: Tx, recetaId: string): Promise<number> {
    const ultimo = await tx.asociacionDeImagenDeReceta.findFirst({ where: { recetaId }, orderBy: { numero: 'desc' }, select: { numero: true } });
    return (ultimo?.numero ?? 0) + 1;
  }

  private evento(tx: Tx, tipo: TipoDeEventoDeNutricion, actorId: string, recetaId: string, procedencia: Procedencia, momento: Date): Promise<void> {
    return registrarEventoDeNutricion(tx, {
      tipo,
      profesionalId: actorId,
      asesoradoId: null,
      recurso: { tipo: RECURSO_RECETA, id: recetaId },
      estadoPrevio: null,
      estadoPosterior: null,
      actorId,
      procedencia,
      momento,
    });
  }
}

