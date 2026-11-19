import { Injectable } from '@nestjs/common';
import {
  CodigoDeError,
  ConsultarAlimentosRequestSchema,
  CorregirAlimentoRequestSchema,
  GRUPO_API,
  RetirarAlimentoRequestSchema,
  type AlimentoConsultado,
  type AlimentoPropio,
  type ElementoDeCatalogo,
  type ListaDeAlimentosPropiosResponse,
  type Procedencia,
} from '@be/domain';
import { Prisma, type TipoDeEventoDeNutricion } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { escribirCursor, leerConsultaDeLista } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esToken } from '../vinculo/lectura';
import { asignarGrupo, CatalogoService, compartir, VERSION_VIGENTE } from './catalogo.service';
import { EjecutorNutricional, esUuid } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';
import { exigirProfesionalDeNutricion } from './profesional-de-nutricion';
import { mismaComposicion, revisionDelAlimento, type FilaDeAlimentoCargado } from './revision-del-alimento';

export { revisionDelAlimento, type FilaDeAlimentoCargado } from './revision-del-alimento';

type Tx = Prisma.TransactionClient;
type Cliente = Tx | PrismaService;
const CASO_DE_USO = 'UC-P10';
export const RECURSO_ALIMENTO = 'ElementoDeCatalogoNutricional';

/**
 * Las filas de los alimentos cargados a mano `e` (procedencia PROFESSIONAL_MANUAL), en su versión vigente `v`, que
 * cumplen `donde`, con el orden y el límite que se pidan. El nombre del equivalente es el de su versión vigente.
 */
export function leerAlimentosCargados(cliente: Cliente, donde: Prisma.Sql, orden: Prisma.Sql, limite: number): Promise<FilaDeAlimentoCargado[]> {
  return cliente.$queryRaw<FilaDeAlimentoCargado[]>`
    SELECT e."id"::text AS "elementoId", v."id"::text AS "versionId", v."nombre", v."composicion",
           (v."disponibilidad" = 'DISPONIBLE') AS "disponible",
           (SELECT count(*) FROM "version_de_elemento_nutricional" x WHERE x."elemento_id" = e."id")::int AS "cantidadDeVersiones",
           gru."grupo"::text AS "grupoDeAlimento",
           EXISTS (SELECT 1 FROM "alimento_compartido" c WHERE c."elemento_id" = e."id") AS "compartido",
           e."momento_de_registro" AS "creado", v."momento_de_registro" AS "actualizado",
           rev."resultado"::text AS "resultado", rev."version_id"::text AS "versionRevisadaId", rev."fuente",
           rev."equivalente_id"::text AS "equivalenteId", rev."momento_de_registro" AS "decidido",
           (SELECT q."nombre" FROM "version_de_elemento_nutricional" q
             WHERE q."elemento_id" = rev."equivalente_id"
               AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = q."id")) AS "equivalenteNombre"
      FROM "version_de_elemento_nutricional" v
      JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
      LEFT JOIN LATERAL (SELECT r."resultado", r."version_id", r."fuente", r."equivalente_id", r."momento_de_registro"
                           FROM "revision_administrativa_de_alimento" r WHERE r."elemento_id" = e."id" ORDER BY r."numero" DESC LIMIT 1) rev ON TRUE
      LEFT JOIN LATERAL (SELECT g."grupo" FROM "grupo_de_alimento" g WHERE g."elemento_id" = e."id" ORDER BY g."numero" DESC LIMIT 1) gru ON TRUE
     WHERE e."procedencia" = 'PROFESSIONAL_MANUAL'
       AND ${VERSION_VIGENTE}
       AND ${donde}
     ORDER BY ${orden}
     LIMIT ${limite}`;
}

function alimentoPropioApi(f: FilaDeAlimentoCargado): AlimentoPropio {
  return {
    catalogItemId: f.elementoId,
    versionId: f.versionId,
    version: `v${f.cantidadDeVersiones}`,
    versionNumber: f.cantidadDeVersiones,
    name: f.nombre,
    composition: f.composicion,
    foodGroup: f.grupoDeAlimento ? GRUPO_API[f.grupoDeAlimento] : null,
    available: f.disponible,
    shared: f.compartido,
    review: revisionDelAlimento(f),
    createdAt: f.creado.toISOString(),
    updatedAt: f.actualizado.toISOString(),
  };
}

/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · los alimentos que un profesional de Nutrición cargó a mano (API-ALI-01 a 03) y la
 * consulta por identidad de los que ve (API-ALI-04).
 * - Solo un profesional con Nutrición verificada y habilitada (otro actor, 403). Lo ajeno —de otro profesional, sembrado o
 *   importado— es el mismo 404 que lo inexistente, con la decisión registrada.
 * - **Corregir (NUA-01)** emite una versión nueva e inmutable, sucesora de la vigente. Las instantáneas de los planes
 *   activados, las recetas (que citan su versión) y los registros conservan la que citaban; un borrador usa la vigente.
 * - **Retirar (NUA-02)** emite una versión RETIRADO con el mismo nombre y la misma composición: deja de estar disponible
 *   para lo nuevo, y lo que ya lo cita lo sigue mostrando. No se borra nada.
 * - Corregir y retirar toman el alimento con el mismo bloqueo que una receta (`FOR NO KEY UPDATE`, con el dueño en el
 *   mismo `WHERE`) y van contra la versión que se vio: si cambió, 409 VERSION_CONFLICT. La base además no deja dos
 *   sucesoras de la misma versión (índice único de la cadena).
 */
@Injectable()
export class AlimentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ejecutor: EjecutorNutricional,
    private readonly catalogo: CatalogoService,
  ) {}

  // ─── API-ALI-01 ────────────────────────────────────────────────────────────────────────────
  /** Los propios, el corregido más recientemente primero; también los retirados. */
  async listarPropios(actor: ActorAutenticado, query: Record<string, unknown>): Promise<ListaDeAlimentosPropiosResponse> {
    const consulta = leerConsultaDeLista(query, {});
    await exigirProfesionalDeNutricion(this.prisma, actor.identidadId);
    const c = consulta.cursor;
    const filas = await leerAlimentosCargados(
      this.prisma,
      Prisma.sql`e."creado_por_id" = ${actor.identidadId}::uuid AND ${c ? Prisma.sql`(v."momento_de_registro", e."id") < (${c.momento}, ${c.id}::uuid)` : Prisma.sql`TRUE`}`,
      Prisma.sql`v."momento_de_registro" DESC, e."id" DESC`,
      consulta.limit + 1,
    );
    const hayMas = filas.length > consulta.limit;
    const pagina = filas.slice(0, consulta.limit);
    const ultima = pagina[pagina.length - 1];
    return {
      data: pagina.map(alimentoPropioApi),
      page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.actualizado, ultima.elementoId) : null, hasMore: hayMas },
    };
  }

  // ─── API-ALI-02 ────────────────────────────────────────────────────────────────────────────
  corregir(actor: ActorAutenticado, catalogItemId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_ALIMENTO, id: catalogItemId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ALI-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CorregirAlimentoRequestSchema,
      cuerpo,
      huellaExtra: { catalogItemId },
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const vigente = await this.propioBloqueado(tx, 'API-ALI-02', actor, catalogItemId, ctx);
        if (!esToken(pedido.expectedVersion, vigente.cantidadDeVersiones)) throw errores.conflictoDeVersion();
        if (!vigente.disponible) throw new ErrorDeApi(422, CodigoDeError.INVALID_STATE_TRANSITION, 'Este alimento está retirado: no se corrige.');
        const cambia = pedido.name !== vigente.nombre || !mismaComposicion(pedido.composition, vigente.composicion);
        const momento = await momentoDeLaBase(tx);
        if (cambia) {
          await tx.versionDeElementoNutricional.create({
            data: {
              elementoId: vigente.elementoId,
              predecesoraId: vigente.versionId,
              nombre: pedido.name,
              composicion: pedido.composition as Prisma.InputJsonValue,
              disponibilidad: 'DISPONIBLE',
              procedencia: { ...procedencia, carga: 'MANUAL', correccion: true } as unknown as Prisma.InputJsonValue,
            },
          });
        }
        const otroGrupo = pedido.group ? await asignarGrupo(tx, vigente.elementoId, pedido.group, actor.identidadId, procedencia) : false;
        // NUA-D05 y D13: corregirlo con el aviso a la vista lo comparte, como cargarlo después de DL-180. Solo si de verdad
        // se corrigió algo: guardar sin cambios responde «no cambió», y lo cargado antes de DL-180 sigue siendo solo de su
        // autor, como le dice «Mis alimentos» («Por ahora lo ves solo vos»).
        if (cambia || otroGrupo) await compartir(tx, vigente.elementoId, procedencia);
        if (cambia) await this.evento(tx, 'ElementoDeCatalogoVersionado', actor.identidadId, vigente.elementoId, procedencia, momento);
        return { estadoHttp: 200, cuerpo: { data: await this.leerPropio(tx, actor.identidadId, vigente.elementoId) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-ALI-03 ────────────────────────────────────────────────────────────────────────────
  /** Retirar uno ya retirado no cambia nada: 200 con lo que está, como retirar la imagen de una receta sin imagen. */
  retirar(actor: ActorAutenticado, catalogItemId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_ALIMENTO, id: catalogItemId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ALI-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: RetirarAlimentoRequestSchema,
      cuerpo,
      huellaExtra: { catalogItemId },
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesionalDeNutricion(tx, actor.identidadId);
        const vigente = await this.propioBloqueado(tx, 'API-ALI-03', actor, catalogItemId, ctx);
        if (!esToken(pedido.expectedVersion, vigente.cantidadDeVersiones)) throw errores.conflictoDeVersion();
        if (vigente.disponible) {
          const momento = await momentoDeLaBase(tx);
          await tx.versionDeElementoNutricional.create({
            data: {
              elementoId: vigente.elementoId,
              predecesoraId: vigente.versionId,
              nombre: vigente.nombre,
              composicion: vigente.composicion as Prisma.InputJsonValue,
              disponibilidad: 'RETIRADO',
              procedencia: { ...procedencia, carga: 'MANUAL', retiro: true } as unknown as Prisma.InputJsonValue,
            },
          });
          await this.evento(tx, 'ElementoDeCatalogoRetirado', actor.identidadId, vigente.elementoId, procedencia, momento);
        }
        return { estadoHttp: 200, cuerpo: { data: await this.leerPropio(tx, actor.identidadId, vigente.elementoId) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-ALI-04 ────────────────────────────────────────────────────────────────────────────
  /** Una lectura: no crea ni cambia nada. Lo que no ve el profesional no vuelve. */
  async consultar(actor: ActorAutenticado, cuerpo: unknown): Promise<{ data: AlimentoConsultado[] }> {
    const pedido = validarCuerpo(ConsultarAlimentosRequestSchema, cuerpo);
    await exigirProfesionalDeNutricion(this.prisma, actor.identidadId);
    return { data: await this.catalogo.porIdentidad(this.prisma, actor.identidadId, pedido.catalogItemIds) };
  }

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────

  /**
   * El alimento propio cargado a mano, bloqueado (las correcciones y los retiros se ordenan acá), en su versión vigente.
   * Ajeno, sembrado, importado o inexistente: el mismo 404, con la decisión registrada; el dueño va en el mismo `WHERE`
   * que el bloqueo, así nadie espera por un alimento ajeno.
   */
  private async propioBloqueado(tx: Tx, operacion: string, actor: ActorAutenticado, catalogItemId: string, ctx: ContextoDeSolicitud): Promise<FilaDeAlimentoCargado> {
    const [propio] = esUuid(catalogItemId)
      ? await tx.$queryRaw<{ id: string }[]>`
          SELECT "id"::text AS "id" FROM "elemento_de_catalogo_nutricional"
           WHERE "id" = ${catalogItemId}::uuid AND "creado_por_id" = ${actor.identidadId}::uuid AND "procedencia" = 'PROFESSIONAL_MANUAL'
           FOR NO KEY UPDATE`
      : [];
    const fila = propio ? await this.filaPropia(tx, actor.identidadId, propio.id) : null;
    if (!fila) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso: { tipo: RECURSO_ALIMENTO, id: catalogItemId } }, ctx);
    return fila;
  }

  private async filaPropia(cliente: Cliente, profesionalId: string, elementoId: string): Promise<FilaDeAlimentoCargado | null> {
    const [fila] = await leerAlimentosCargados(cliente, Prisma.sql`e."id" = ${elementoId}::uuid AND e."creado_por_id" = ${profesionalId}::uuid`, Prisma.sql`e."id"`, 1);
    return fila ?? null;
  }

  private async leerPropio(tx: Tx, profesionalId: string, elementoId: string): Promise<AlimentoPropio> {
    const fila = await this.filaPropia(tx, profesionalId, elementoId);
    if (!fila) throw errores.interno();
    return alimentoPropioApi(fila);
  }

  private evento(tx: Tx, tipo: TipoDeEventoDeNutricion, actorId: string, elementoId: string, procedencia: Procedencia, momento: Date): Promise<void> {
    return registrarEventoDeNutricion(tx, {
      tipo,
      profesionalId: actorId,
      asesoradoId: null,
      recurso: { tipo: RECURSO_ALIMENTO, id: elementoId },
      estadoPrevio: null,
      estadoPosterior: tipo === 'ElementoDeCatalogoRetirado' ? 'RETIRADO' : null,
      actorId,
      procedencia,
      momento,
    });
  }
}
