import { Injectable } from '@nestjs/common';
import { CrearElementoDeCatalogoRequestSchema, type ElementoDeCatalogo, type ElementoResuelto, type FuenteExterna } from '@be/domain';
import type { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { escribirCursor, leerConsultaDeLista } from '../http/paginacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorNutricional } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';

type Cliente = Prisma.TransactionClient | PrismaService;

interface FilaDeCatalogo {
  elementoId: string;
  versionId: string;
  nombre: string;
  composicion: ElementoDeCatalogo['composition'];
  disponible: boolean;
  procedencia: 'BE_SYNTHETIC_SEED' | 'PROFESSIONAL_MANUAL' | 'CONTROLLED_IMPORT';
  momentoDeRegistro: Date;
  /** De dónde vino un alimento importado de Open Food Facts (WP-08; RF-060). Vive en la procedencia de su versión. */
  fuenteExterna: FuenteExterna | null;
}

/**
 * Catálogo nutricional propio (RF-027; API-NUT-13 y API-INT-NUT-01).
 * - Ítem con identificador estable y versiones inmutables (REG-06-99). La vigente es la terminal de la cadena.
 * - Ámbitos (REG-06-135): el catálogo sembrado es global; lo que carga un profesional es de su ámbito.
 * - Un cambio del catálogo no toca planes activados: la instantánea guarda su propia copia (REG-06-101).
 * - No es dato de salud (08:168), pero solo lo usa un profesional con Nutrición verificada y habilitada.
 */
@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService, private readonly ejecutor: EjecutorNutricional) {}

  // ─── API-NUT-13 ────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<{ data: ElementoDeCatalogo[]; page: unknown }> {
    const q = typeof query.q === 'string' ? query.q.trim().slice(0, 80) : '';
    const { q: _q, ...resto } = query;
    const consulta = leerConsultaDeLista(resto, { type: ['FOOD'] });
    await this.exigirProfesionalDeNutricion(this.prisma, actor.identidadId);
    const patron = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const cursor = consulta.cursor;
    const filas = await this.prisma.$queryRaw<FilaDeCatalogo[]>`
      SELECT e."id"::text AS "elementoId", v."id"::text AS "versionId", v."nombre", v."composicion", (v."disponibilidad" = 'DISPONIBLE') AS "disponible",
             e."procedencia"::text AS "procedencia", v."momento_de_registro" AS "momentoDeRegistro",
             v."procedencia" -> 'fuenteExterna' AS "fuenteExterna"
        FROM "version_de_elemento_nutricional" v
        JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
       WHERE NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")
         AND v."disponibilidad" = 'DISPONIBLE'
         AND (e."procedencia" = 'BE_SYNTHETIC_SEED' OR e."creado_por_id" = ${actor.identidadId}::uuid)
         AND v."nombre" ILIKE ${patron}
         AND (${cursor === null} OR (v."momento_de_registro", v."id") < (${cursor?.momento ?? new Date(0)}, ${cursor?.id ?? '00000000-0000-0000-0000-000000000000'}::uuid))
       ORDER BY v."momento_de_registro" DESC, v."id" DESC
       LIMIT ${consulta.limit + 1}`;
    const hayMas = filas.length > consulta.limit;
    const pagina = filas.slice(0, consulta.limit);
    const ultima = pagina[pagina.length - 1];
    return {
      data: pagina.map(elementoApi),
      page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeRegistro, ultima.versionId) : null, hasMore: hayMas },
    };
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

  /** Ítems disponibles para el profesional (global + propios), con su versión vigente: validan y arman la instantánea. */
  async disponibles(cliente: Cliente, profesionalId: string, ids: readonly string[]): Promise<Map<string, ElementoResuelto>> {
    const validos = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validos.length === 0) return new Map();
    const filas = await cliente.$queryRaw<FilaDeCatalogo[]>`
      SELECT e."id"::text AS "elementoId", v."id"::text AS "versionId", v."nombre", v."composicion", (v."disponibilidad" = 'DISPONIBLE') AS "disponible",
             e."procedencia"::text AS "procedencia", v."momento_de_registro" AS "momentoDeRegistro",
             v."procedencia" -> 'fuenteExterna' AS "fuenteExterna"
        FROM "version_de_elemento_nutricional" v
        JOIN "elemento_de_catalogo_nutricional" e ON e."id" = v."elemento_id"
       WHERE e."id" = ANY(${validos}::uuid[])
         AND NOT EXISTS (SELECT 1 FROM "version_de_elemento_nutricional" s WHERE s."predecesora_id" = v."id")
         AND v."disponibilidad" = 'DISPONIBLE'
         AND (e."procedencia" = 'BE_SYNTHETIC_SEED' OR e."creado_por_id" = ${profesionalId}::uuid)`;
    return new Map(filas.map((f) => [f.elementoId, { versionId: f.versionId, name: f.nombre, composition: f.composicion }]));
  }

  /** Solo un profesional con Nutrición verificada y habilitada usa el catálogo nutricional (también para importar, WP-08). */
  async exigirProfesionalDeNutricion(cliente: Cliente, identidadId: string): Promise<void> {
    const [fila] = await cliente.$queryRaw<{ ok: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM "verificacion_profesional" vp
          JOIN "habilitacion" h ON h."identidad_id" = vp."identidad_id" AND h."alcance" = vp."alcance" AND h."estado" = 'CONCEDIDA'
         WHERE vp."identidad_id" = ${identidadId}::uuid AND vp."alcance" = 'NUTRICION' AND vp."estado" = 'VERIFICADO') AS "ok"`;
    if (!fila?.ok) throw errores.accionNoPermitida();
  }
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
