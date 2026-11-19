import { Injectable } from '@nestjs/common';
import {
  AsociarImagenDeRecetaRequestSchema,
  CalcularRecetaRequestSchema,
  CodigoDeError,
  CrearRecetaRequestSchema,
  CuerpoVacioSchema,
  EditarRecetaRequestSchema,
  METODO_DE_CALCULO_NUTRICIONAL,
  TokenDeVersionSchema,
  type CalculoDeRecetaResponse,
  type DetalleDeRecetaResponse,
  type IngredienteDeReceta,
  type IngredienteDeRecetaEntrada,
  type ListaDeRecetasResponse,
  type Procedencia,
} from '@be/domain';
import type { Prisma, TipoDeEventoDeNutricion } from '@prisma/client';
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
import { calcularReceta, imagenesVigentes, leerReceta, RECURSO_RECETA, recetaApi, versionesVigentes } from './lectura-recetas';
import { exigirProfesionalDeNutricion } from './profesional-de-nutricion';

type Tx = Prisma.TransactionClient;
const CASO_DE_USO = 'UC-P10';

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
        const versiones = await versionesVigentes(tx, pagina.map((r) => r.id));
        const imagenes = await imagenesVigentes(tx, pagina.map((r) => r.id));
        const ultima = pagina[pagina.length - 1];
        return {
          data: pagina.map((r) => recetaApi(r, versiones.get(r.id)!, imagenes.get(r.id) ?? null)),
          page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeActualizacion, ultima.id) : null, hasMore: hayMas },
        };
      },
    });
  }

  // ─── API-REC-03 ────────────────────────────────────────────────────────────────────────────
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
        const r = esUuid(recipeId) ? await tx.receta.findFirst({ where: { id: recipeId, profesionalId: actor.identidadId } }) : null;
        if (!r) throw this.ejecutor.noRevelable({ operacion: 'API-REC-03', actorId: actor.identidadId, recurso }, ctx);
        const versiones = await tx.versionDeReceta.findMany({ where: { recetaId: r.id }, orderBy: { numero: 'asc' } });
        const vigente = versiones[versiones.length - 1]!;
        const receta = recetaApi(r, vigente, (await imagenesVigentes(tx, [r.id])).get(r.id) ?? null);
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

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────

  /**
   * Los ingredientes como se guardan (con el nombre de la versión citada) y el cálculo con la composición de esa versión.
   * Cada referencia inválida se informa con su ruta; ninguna se resuelve por nombre.
   */
  private async ingredientesCalculados(
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

