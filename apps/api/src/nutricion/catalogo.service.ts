import { Injectable } from '@nestjs/common';
import { CrearElementoDeCatalogoRequestSchema, type ElementoDeCatalogo, type ElementoEncontrado, type ElementoResuelto, type FuenteExternaDeAlimento } from '@be/domain';
import { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { buscarEnCatalogo, leerBusqueda, leerCursorDeBusqueda, type ConNombreAlternativo } from '../http/busqueda';
import { leerConsultaDeLista } from '../http/paginacion';
import { ALIMENTO_DE_UN_ITEM_EXTERNO } from '../integraciones/item-externo';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorNutricional } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';
import { exigirProfesionalDeNutricion as exigirNutricion } from './profesional-de-nutricion';

type Cliente = Prisma.TransactionClient | PrismaService;

interface FilaDeCatalogo {
  elementoId: string;
  versionId: string;
  nombre: string;
  composicion: ElementoDeCatalogo['composition'];
  disponible: boolean;
  procedencia: 'BE_SYNTHETIC_SEED' | 'PROFESSIONAL_MANUAL' | 'CONTROLLED_IMPORT';
  momentoDeRegistro: Date;
  /**
   * De dónde vino un alimento importado (WP-08; RF-060) o sembrado de una fuente de referencia (USDA, DL-119). Vive en la
   * procedencia de su versión.
   */
  fuenteExterna: FuenteExternaDeAlimento | null;
}

/**
 * Los alimentos `e` que ve un profesional: lo sembrado por una migración (sin profesional que lo cargue), lo importado de
 * Open Food Facts, que es de todos (DL-141 D-1), y lo propio. La consulta tiene que llamar `e` al elemento.
 */
function alimentoVisible(profesionalId: string): Prisma.Sql {
  return Prisma.sql`(e."creado_por_id" IS NULL OR ${ALIMENTO_DE_UN_ITEM_EXTERNO} OR e."creado_por_id" = ${profesionalId}::uuid)`;
}

/** DL-141 D-2: los nombres alternativos vigentes (sin retiro) del alimento `e`, para el buscador. */
const NOMBRES_ALTERNATIVOS = Prisma.sql`SELECT n."nombre" FROM "nombre_alternativo_de_alimento" n
  WHERE n."elemento_id" = e."id" AND NOT EXISTS (SELECT 1 FROM "retiro_de_nombre_alternativo_de_alimento" r WHERE r."nombre_id" = n."id")`;

/** Las columnas de una fila del catálogo (`FilaDeCatalogo`), con la versión `v` y el elemento `e`. */
const COLUMNAS = Prisma.sql`e."id"::text AS "elementoId", v."id"::text AS "versionId", v."nombre", v."composicion", (v."disponibilidad" = 'DISPONIBLE') AS "disponible",
       e."procedencia"::text AS "procedencia", v."momento_de_registro" AS "momentoDeRegistro",
       v."procedencia" -> 'fuenteExterna' AS "fuenteExterna"`;

/**
 * Catálogo nutricional propio (RF-027; API-NUT-13 y API-INT-NUT-01).
 * - Ítem con identificador estable y versiones inmutables (REG-06-99). La vigente es la terminal de la cadena.
 * - Ámbitos (REG-06-135): lo sembrado por una migración es global (sin profesional que lo cargue: el catálogo sintético de
 *   WP-04 y los alimentos de referencia de USDA, DL-119); lo importado de Open Food Facts es de todos los profesionales,
 *   uno por producto, con su fuente (DL-141 D-1); lo que carga un profesional es de su ámbito.
 * - Un cambio del catálogo no toca planes activados: la instantánea guarda su propia copia (REG-06-101).
 * - No es dato de salud (08:168), pero solo lo usa un profesional con Nutrición verificada y habilitada.
 */
@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService, private readonly ejecutor: EjecutorNutricional) {}

  // ─── API-NUT-13 y su búsqueda ──────────────────────────────────────────────────────────────
  /**
   * El buscador tolera tildes, mayúsculas, el orden de las palabras, los plurales y los errores de tipeo
   * (`http/busqueda.ts`; DL-139), y busca también en los nombres alternativos (DL-141). Sin texto, el catálogo entero, lo
   * más nuevo primero.
   */
  async listar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<{ data: ElementoDeCatalogo[]; page: unknown }> {
    const { filas, page } = await this.buscarFilas(actor, query);
    return { data: filas.map(elementoApi), page };
  }

  /** API-NUT-13-BUSQUEDA: las mismas filas, y cada una con el nombre alternativo que coincidió (DL-141 D-2). */
  async buscar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<{ data: ElementoEncontrado[]; page: unknown }> {
    const { filas, page } = await this.buscarFilas(actor, query);
    return { data: filas.map((f) => ({ ...elementoApi(f), matchedAlternativeName: f.nombreAlternativo })), page };
  }

  private async buscarFilas(actor: ActorAutenticado, query: Record<string, unknown>): Promise<{ filas: readonly (FilaDeCatalogo & ConNombreAlternativo)[]; page: unknown }> {
    const q = typeof query.q === 'string' ? query.q.trim().slice(0, 80) : '';
    const { q: _q, cursor: cursorEscrito, ...resto } = query;
    const consulta = leerConsultaDeLista(resto, { type: ['FOOD'] });
    const cursor = leerCursorDeBusqueda(cursorEscrito);
    await this.exigirProfesionalDeNutricion(this.prisma, actor.identidadId);
    return buscarEnCatalogo<FilaDeCatalogo>(
      this.prisma,
      {
        columnas: COLUMNAS,
        tablas: Prisma.sql`"version_de_elemento_nutricional" v JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"`,
        visibles: Prisma.sql`NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")
           AND v."disponibilidad" = 'DISPONIBLE'
           AND ${alimentoVisible(actor.identidadId)}`,
        nombresAlternativos: NOMBRES_ALTERNATIVOS,
      },
      leerBusqueda(q),
      consulta.limit,
      cursor,
    );
  }

  // ─── API-INT-NUT-01 ────────────────────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-INT-NUT-01',
      casoDeUso: 'UC-P10',
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearElementoDeCatalogoRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await this.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const elemento = await tx.elementoDeCatalogoNutricional.create({ data: { procedencia: 'PROFESSIONAL_MANUAL', creadoPorId: actor.identidadId } });
        const version = await tx.versionDeElementoNutricional.create({
          data: {
            elementoId: elemento.id,
            nombre: pedido.name,
            composicion: pedido.composition as Prisma.InputJsonValue,
            disponibilidad: 'DISPONIBLE',
            procedencia: { ...procedencia, carga: 'MANUAL' } as unknown as Prisma.InputJsonValue,
          },
        });
        await registrarEventoDeNutricion(tx, {
          tipo: 'ElementoDeCatalogoCreado',
          profesionalId: actor.identidadId,
          asesoradoId: null,
          recurso: { tipo: 'ElementoDeCatalogoNutricional', id: elemento.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: await momentoDeLaBase(tx),
        });
        const item: ElementoDeCatalogo = {
          catalogItemId: elemento.id,
          versionId: version.id,
          name: version.nombre,
          itemType: 'FOOD',
          composition: pedido.composition,
          provenance: 'PROFESSIONAL_MANUAL',
          externalSource: null,
          available: true,
        };
        return { estadoHttp: 201, cuerpo: { data: item }, sujetoId: null, recurso: { tipo: 'ElementoDeCatalogoNutricional', id: elemento.id } };
      },
    });
  }

  /** Ítems disponibles para el profesional (global, importados y propios), con su versión vigente: validan y arman la instantánea. */
  async disponibles(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<Map<string, ElementoResuelto>> {
    const filas = await this.filasDisponibles(cliente, profesionalId, ids);
    return new Map(filas.map((f) => [f.elementoId, { versionId: f.versionId, name: f.nombre, composition: f.composicion }]));
  }

  /** Los mismos ítems disponibles, con la forma completa del buscador (API-HAN-01: los alimentos habituales). */
  async vigentes(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<Map<string, ElementoDeCatalogo>> {
    const filas = await this.filasDisponibles(cliente, profesionalId, ids);
    return new Map(filas.map((f) => [f.elementoId, elementoApi(f)]));
  }

  private async filasDisponibles(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<FilaDeCatalogo[]> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return [];
    return cliente.$queryRaw<FilaDeCatalogo[]>`
      SELECT ${COLUMNAS}
        FROM "version_de_elemento_nutricional" v
        JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
       WHERE e."id" = ANY(${validos}::uuid[])
         AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")
         AND v."disponibilidad" = 'DISPONIBLE'
         AND ${alimentoVisible(profesionalId)}`;
  }

  /**
   * DL-141 D-1: el alimento de un ítem externo de Open Food Facts, en su versión vigente y tal como lo ve cualquier
   * profesional (es de todos). Lo usa la importación para ofrecer el que ya está y para apuntar la resolución a él.
   */
  async vigenteDelElemento(cliente: Cliente, elementoId: string): Promise<ElementoDeCatalogo | null> {
    const [fila] = await cliente.$queryRaw<FilaDeCatalogo[]>`
      SELECT ${COLUMNAS}
        FROM "version_de_elemento_nutricional" v
        JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
       WHERE e."id" = ${elementoId}::uuid
         AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")`;
    return fila ? elementoApi(fila) : null;
  }

  /** Solo un profesional con Nutrición verificada y habilitada usa el catálogo nutricional (también para importar, WP-08). */
  async exigirProfesionalDeNutricion(cliente: Cliente, identidadId: string): Promise<void> {
    await exigirNutricion(cliente, identidadId);
  }

  /**
   * DL-119 · las versiones que cita una receta, por elemento **y** versión: la versión es de ese elemento, está
   * disponible y el elemento es global, importado (de todos, DL-141) o propio de este profesional. Las que no cumplen no
   * figuran en el mapa (quien llama responde CATALOG_REFERENCE_INVALID con la ruta). No exige que sea la versión vigente:
   * una receta conserva la versión que citó aunque el catálogo emita otra.
   */
  async versionesCitables(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<Map<string, VersionCitable>> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return new Map();
    const filas = await cliente.$queryRaw<VersionCitable[]>`
      SELECT v."id"::text AS "versionId", e."id"::text AS "elementoId", v."nombre", v."composicion"
        FROM "version_de_elemento_nutricional" v
        JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
       WHERE v."id" = ANY(${validos}::uuid[])
         AND v."disponibilidad" = 'DISPONIBLE'
         AND ${alimentoVisible(profesionalId)}`;
    return new Map(filas.map((f) => [f.versionId, f]));
  }

  /** La composición y el nombre de versiones ya citadas (por una receta o una instantánea), sin filtrar por ámbito. */
  async versionesPorId(cliente: Cliente, ids: readonly string[]): Promise<Map<string, VersionCitable>> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return new Map();
    const filas = await cliente.$queryRaw<VersionCitable[]>`
      SELECT v."id"::text AS "versionId", v."elemento_id"::text AS "elementoId", v."nombre", v."composicion"
        FROM "version_de_elemento_nutricional" v
       WHERE v."id" = ANY(${validos}::uuid[])`;
    return new Map(filas.map((f) => [f.versionId, f]));
  }
}

/** Una versión del catálogo citada por su identidad: de qué elemento es, cómo se llama y su composición. */
export interface VersionCitable {
  readonly versionId: string;
  readonly elementoId: string;
  readonly nombre: string;
  readonly composicion: ElementoDeCatalogo['composition'];
}

function elementoApi(f: FilaDeCatalogo): ElementoDeCatalogo {
  return {
    catalogItemId: f.elementoId,
    versionId: f.versionId,
    name: f.nombre,
    itemType: 'FOOD',
    composition: f.composicion,
    provenance: f.procedencia,
    externalSource: f.fuenteExterna ?? null,
    available: f.disponible,
  };
}
