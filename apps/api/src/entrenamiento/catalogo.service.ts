import { Injectable } from '@nestjs/common';
import { CrearEjercicioRequestSchema, type EjercicioDeCatalogo, type ValidationIssue } from '@be/domain';
import type { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { escribirCursor, leerConsultaDeLista } from '../http/paginacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorDeEntrenamiento } from './ejecutor';
import { registrarEventoDeEntrenamiento } from './eventos';
import { ejercicioApi, type FilaDeEjercicio } from './lectura-entrenamiento';

type Cliente = Prisma.TransactionClient | PrismaService;

/** Quién mira el catálogo, y por eso qué ejercicios cargados a mano alcanza a ver. */
export type Ambito = 'PROFESIONAL' | 'ASESORADO';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Catálogo propio de ejercicios (RF-037; API-TRN-13 y API-INT-TRN-01).
 * - Ejercicio con identificador estable y versiones inmutables; la prescripción cita una **versión** (09v10:323,
 *   336), y la instantánea congela su nombre al activar: un cambio de catálogo no la reescribe (REG-06-112).
 * - Ámbitos, como en nutrición (REG-06-135): lo sembrado es global; lo que carga un profesional es suyo.
 * - **El asesorado también lo consulta**, a diferencia del nutricional: para sustituir un ejercicio tiene que poder
 *   buscar el que realmente hizo (B10-06:762-768). Ve lo sembrado y lo que cargaron los profesionales de sus planes.
 * - El catálogo **no calcula**: sin porcentaje de músculo trabajado ni volumen (09v10:854).
 */
@Injectable()
export class CatalogoDeEjerciciosService {
  constructor(private readonly prisma: PrismaService, private readonly ejecutor: EjecutorDeEntrenamiento) {}

  // ─── API-TRN-13 ────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<{ data: EjercicioDeCatalogo[]; page: unknown }> {
    const { q: crudo, ...resto } = query;
    if (crudo !== undefined && typeof crudo !== 'string') throw errores.solicitudInvalida([{ code: 'INVALID_FILTER', path: 'q' }]);
    const consulta = leerConsultaDeLista(resto, {});
    const q = (crudo ?? '').trim().slice(0, 80);
    const creadores = await this.creadoresVisibles(this.prisma, actor.identidadId, 'CUALQUIERA');
    const patron = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const cursor = consulta.cursor;
    const filas = await this.prisma.$queryRaw<FilaDeEjercicio[]>`
      SELECT e."id"::text AS "ejercicioId", v."id"::text AS "versionId", v."nombre", (v."disponibilidad" = 'DISPONIBLE') AS "disponible",
             e."procedencia"::text AS "procedencia", e."creado_por_id"::text AS "creadoPorId", v."momento_de_registro" AS "momentoDeRegistro"
        FROM "version_de_ejercicio" v
        JOIN "ejercicio_de_catalogo" e ON e."id" = v."ejercicio_id"
       WHERE NOT EXISTS (SELECT 1 FROM "version_de_ejercicio" s WHERE s."predecesora_id" = v."id")
         AND v."disponibilidad" = 'DISPONIBLE'
         AND (e."procedencia" = 'BE_SYNTHETIC_SEED' OR e."creado_por_id" = ANY(${creadores}::uuid[]))
         AND v."nombre" ILIKE ${patron}
         AND (${cursor === null} OR (v."momento_de_registro", v."id") < (${cursor?.momento ?? new Date(0)}, ${cursor?.id ?? '00000000-0000-0000-0000-000000000000'}::uuid))
       ORDER BY v."momento_de_registro" DESC, v."id" DESC
       LIMIT ${consulta.limit + 1}`;
    const hayMas = filas.length > consulta.limit;
    const pagina = filas.slice(0, consulta.limit);
    const ultima = pagina[pagina.length - 1];
    return {
      data: pagina.map(ejercicioApi),
      page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeRegistro, ultima.versionId) : null, hasMore: hayMas },
    };
  }

  // ─── API-INT-TRN-01 ────────────────────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-INT-TRN-01',
      casoDeUso: 'UC-P15',
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearEjercicioRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        if (!(await this.esProfesionalDeEntrenamiento(tx, actor.identidadId))) throw errores.accionNoPermitida();
        // Las zonas y el material didáctico llegan en WP-07: hasta entonces el dominio no tiene ninguno, así que
        // cualquier referencia es a algo que no existe. Cero zonas sí es legítimo (REG-06-139).
        const issues: ValidationIssue[] = [
          ...pedido.muscleZones.map((_, i) => ({ code: 'MUSCLE_ZONE_UNKNOWN', path: `muscleZones[${i}].zoneId` })),
          ...pedido.didacticResources.map((_, i) => ({ code: 'DIDACTIC_RESOURCE_UNKNOWN', path: `didacticResources[${i}].resourceVersionId` })),
        ];
        if (issues.length > 0) throw errores.validacionFallida(issues);
        const ejercicio = await tx.ejercicioDeCatalogo.create({ data: { procedencia: 'PROFESSIONAL_MANUAL', creadoPorId: actor.identidadId } });
        const version = await tx.versionDeEjercicio.create({
          data: {
            ejercicioId: ejercicio.id,
            nombre: pedido.name,
            disponibilidad: 'DISPONIBLE',
            procedencia: { ...procedencia, carga: 'MANUAL' } as unknown as Prisma.InputJsonValue,
          },
        });
        await registrarEventoDeEntrenamiento(tx, {
          tipo: 'EjercicioDeCatalogoCreado',
          profesionalId: actor.identidadId,
          asesoradoId: null,
          recurso: { tipo: 'EjercicioDeCatalogo', id: ejercicio.id },
          estadoPrevio: null,
          estadoPosterior: null,
          actorId: actor.identidadId,
          procedencia,
          momento: await momentoDeLaBase(tx),
        });
        const item = ejercicioApi({
          ejercicioId: ejercicio.id,
          versionId: version.id,
          nombre: version.nombre,
          disponible: true,
          procedencia: 'PROFESSIONAL_MANUAL',
          creadoPorId: actor.identidadId,
          momentoDeRegistro: version.momentoDeRegistro,
        });
        return { estadoHttp: 201, cuerpo: { data: item }, sujetoId: null, recurso: { tipo: 'EjercicioDeCatalogo', id: ejercicio.id } };
      },
    });
  }

  /**
   * Las versiones de ejercicio que un actor puede citar, por identificador de versión: para prescribir (el
   * profesional: lo sembrado y lo propio) o para declarar lo que realmente hizo (el asesorado: lo sembrado y lo de
   * sus profesionales). Una versión fuera de su ámbito no existe para él.
   */
  async citables(cliente: Cliente, actorId: string, ambito: Ambito, versionIds: readonly string[]): Promise<Map<string, FilaDeEjercicio>> {
    const validos = [...new Set(versionIds)].filter((id) => UUID.test(id)).map((id) => id.toLowerCase());
    if (validos.length === 0) return new Map();
    const creadores = await this.creadoresVisibles(cliente, actorId, ambito);
    const filas = await cliente.$queryRaw<FilaDeEjercicio[]>`
      SELECT e."id"::text AS "ejercicioId", v."id"::text AS "versionId", v."nombre", (v."disponibilidad" = 'DISPONIBLE') AS "disponible",
             e."procedencia"::text AS "procedencia", e."creado_por_id"::text AS "creadoPorId", v."momento_de_registro" AS "momentoDeRegistro"
        FROM "version_de_ejercicio" v
        JOIN "ejercicio_de_catalogo" e ON e."id" = v."ejercicio_id"
       WHERE v."id" = ANY(${validos}::uuid[])
         AND (e."procedencia" = 'BE_SYNTHETIC_SEED' OR e."creado_por_id" = ANY(${creadores}::uuid[]))`;
    return new Map(filas.map((f) => [f.versionId, f]));
  }

  /** Solo un profesional con Entrenamiento verificado y habilitado carga ejercicios (RF-037). */
  async esProfesionalDeEntrenamiento(cliente: Cliente, identidadId: string): Promise<boolean> {
    const [fila] = await cliente.$queryRaw<{ ok: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM "verificacion_profesional" vp
          JOIN "habilitacion" h ON h."identidad_id" = vp."identidad_id" AND h."alcance" = vp."alcance" AND h."estado" = 'CONCEDIDA'
         WHERE vp."identidad_id" = ${identidadId}::uuid AND vp."alcance" = 'ENTRENAMIENTO' AND vp."estado" = 'VERIFICADO') AS "ok"`;
    return fila?.ok === true;
  }

  /**
   * De quién son los ejercicios cargados a mano que este actor puede ver. Si no es profesional de entrenamiento ni
   * tiene un plan de entrenamiento, el catálogo no es para él: 403 (09v10 §42: «técnico/según lectura»).
   */
  private async creadoresVisibles(cliente: Cliente, actorId: string, ambito: Ambito | 'CUALQUIERA'): Promise<string[]> {
    const creadores = new Set<string>();
    if (ambito !== 'ASESORADO' && (await this.esProfesionalDeEntrenamiento(cliente, actorId))) creadores.add(actorId);
    let esAsesorado = false;
    if (ambito !== 'PROFESIONAL') {
      const planes = await cliente.planDeEntrenamiento.findMany({ where: { asesoradoId: actorId }, select: { profesionalId: true } });
      esAsesorado = planes.length > 0;
      for (const p of planes) creadores.add(p.profesionalId);
    }
    if (!creadores.has(actorId) && !esAsesorado) throw errores.accionNoPermitida();
    return [...creadores];
  }
}
