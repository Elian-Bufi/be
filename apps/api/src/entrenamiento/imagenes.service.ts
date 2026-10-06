import { Injectable } from '@nestjs/common';
import { AsociarImagenDeEjercicioRequestSchema, CodigoDeError, CuerpoVacioSchema, type EjercicioPropio } from '@be/domain';
import type { Prisma } from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import { MediosService } from '../medios/medios.service';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorDeEntrenamiento, esUuid } from './ejecutor';
import { ejercicioPropioApi, imagenesDeEjercicios, REVISION_TECNICA_DESDE_API, type FilaDeEjercicioPropio } from './lectura-por-serie';
import { exigirProfesionalDeEntrenamiento } from './profesional-de-entrenamiento';

type Tx = Prisma.TransactionClient;

const RECURSO = 'EjercicioDeCatalogo';
const CASO_DE_USO = 'UC-P15';
/** La lista no pagina: un profesional no carga cientos de ejercicios a mano, y el tope evita una respuesta desmedida. */
const TOPE_DE_EJERCICIOS_PROPIOS = 500;

/**
 * DL-123 — La imagen de un ejercicio propio (API-EJE-01 a 03): un recurso didáctico versionado, con autoría, licencia
 * obligatoria, procedencia y estado de revisión técnica (REG-06-134).
 * - Solo un profesional de Entrenamiento verificado y habilitado (otro actor, 403), y solo sobre sus ejercicios cargados a
 *   mano: el catálogo sembrado no recibe imágenes de profesionales (REG-06-135). Lo ajeno o inexistente, el mismo 404.
 * - Se asocia por identidad y versión del ejercicio, nunca por coincidencia de nombre, con un medio propio, disponible y
 *   de finalidad EXERCISE_REFERENCE. Cada cambio es una fila nueva de una historia de solo agregar: reemplazar es asociar
 *   de nuevo y retirar es un registro más. El medio nunca se borra, y lo registrado conserva la imagen de entonces.
 * - `imageVersion` (el número del último cambio, 0 si nunca tuvo) es el token de concurrencia: 409 VERSION_CONFLICT.
 *   Las tablas del catálogo son de solo agregar, así que el token no vive en el ejercicio sino en su historia de imagen.
 */
@Injectable()
export class ImagenesDeEjercicioService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly medios: MediosService,
  ) {}

  // ─── API-EJE-01 ────────────────────────────────────────────────────────────────────────────
  /** Los ejercicios propios, del más nuevo al más viejo, con su imagen vigente. */
  listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: EjercicioPropio[] }> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-EJE-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirProfesionalDeEntrenamiento(tx, actor.identidadId);
        const filas = await this.propios(tx, actor.identidadId, null);
        const imagenes = await imagenesDeEjercicios(tx, filas.map((f) => f.ejercicioId), null);
        return { data: filas.map((f) => ejercicioPropioApi(f, imagenes.get(f.ejercicioId))) };
      },
    });
  }

  // ─── API-EJE-02 ────────────────────────────────────────────────────────────────────────────
  /** Asociar o reemplazar la imagen. `expectedImageVersion` es la que se vio: 0 si el ejercicio no tenía ninguna. */
  asociar(actor: ActorAutenticado, exerciseId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: exerciseId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-EJE-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: AsociarImagenDeEjercicioRequestSchema,
      cuerpo,
      huellaExtra: { exerciseId },
      efecto: async (tx, pedido, procedencia) => {
        await exigirProfesionalDeEntrenamiento(tx, actor.identidadId);
        const ejercicioId = await this.propioBloqueado(tx, 'API-EJE-02', actor, exerciseId, ctx);
        const ultima = await this.ultimoCambio(tx, ejercicioId);
        if (pedido.expectedImageVersion !== (ultima?.numero ?? 0)) throw errores.conflictoDeVersion();
        // La versión, por identidad: tiene que ser de este ejercicio.
        const version = esUuid(pedido.exerciseVersionId)
          ? await tx.versionDeEjercicio.findFirst({ where: { id: pedido.exerciseVersionId, ejercicioId }, select: { id: true } })
          : null;
        if (!version) {
          throw new ErrorDeApi(422, CodigoDeError.EXERCISE_REFERENCE_INVALID, 'Esa versión no es de este ejercicio.', { issues: [{ code: 'EXERCISE_REFERENCE_INVALID', path: 'exerciseVersionId' }] });
        }
        // Un medio propio, disponible y de imagen de ejercicio. Ni la imagen de una receta ni la foto de una comida sirven.
        const problemas = await this.medios.problemasDeReferencia(tx, actor.identidadId, [pedido.mediaId], 'REFERENCIA_DE_EJERCICIO', () => 'mediaId');
        if (problemas.length > 0) throw errores.referenciaDeMedioInvalida(problemas);
        await sinDuplicar(
          tx.asociacionDeImagenDeEjercicio.create({
            data: {
              ejercicioId,
              versionDeEjercicioId: version.id,
              numero: (ultima?.numero ?? 0) + 1,
              cambio: 'ASOCIAR',
              medioId: pedido.mediaId,
              textoAlternativo: pedido.altText,
              licencia: pedido.license as unknown as Prisma.InputJsonValue,
              revisionTecnica: REVISION_TECNICA_DESDE_API[pedido.technicalReview],
              autorId: actor.identidadId,
              procedencia: procedencia as unknown as Prisma.InputJsonValue,
            },
          }),
          errores.conflictoDeVersion,
        );
        return { estadoHttp: 200, cuerpo: { data: await this.leer(tx, actor.identidadId, ejercicioId) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-EJE-03 ────────────────────────────────────────────────────────────────────────────
  /**
   * Retirar deja la historia (una fila más) y no borra el medio. Sin imagen vigente no hay nada que retirar: 200 igual,
   * como en la receta. `expectedImageVersion` va por query y es obligatorio.
   */
  retirar(actor: ActorAutenticado, exerciseId: string, query: Record<string, unknown>, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const { expectedImageVersion, ...resto } = query ?? {};
    const desconocidos = Object.keys(resto);
    if (desconocidos.length > 0) throw errores.solicitudInvalida(desconocidos.map((c) => ({ code: 'UNKNOWN_QUERY_PARAMETER', path: c })));
    if (typeof expectedImageVersion !== 'string' || !/^[1-9]\d{0,8}$/.test(expectedImageVersion)) {
      throw errores.solicitudInvalida([{ code: expectedImageVersion === undefined ? 'EXPECTED_IMAGE_VERSION_REQUIRED' : 'INVALID_VERSION', path: 'expectedImageVersion' }]);
    }
    const esperada = Number(expectedImageVersion);
    const recurso = { tipo: RECURSO, id: exerciseId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-EJE-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CuerpoVacioSchema,
      cuerpo,
      huellaExtra: { exerciseId, expectedImageVersion: esperada },
      efecto: async (tx, _pedido, procedencia) => {
        await exigirProfesionalDeEntrenamiento(tx, actor.identidadId);
        const ejercicioId = await this.propioBloqueado(tx, 'API-EJE-03', actor, exerciseId, ctx);
        const ultima = await this.ultimoCambio(tx, ejercicioId);
        if (esperada !== (ultima?.numero ?? 0)) throw errores.conflictoDeVersion();
        if (ultima?.cambio === 'ASOCIAR') {
          // El retiro queda en la versión del ejercicio a la que se aplicaba la imagen retirada.
          await sinDuplicar(
            tx.asociacionDeImagenDeEjercicio.create({
              data: {
                ejercicioId,
                versionDeEjercicioId: ultima.versionDeEjercicioId,
                numero: ultima.numero + 1,
                cambio: 'RETIRAR',
                autorId: actor.identidadId,
                procedencia: procedencia as unknown as Prisma.InputJsonValue,
              },
            }),
            errores.conflictoDeVersion,
          );
        }
        return { estadoHttp: 200, cuerpo: { data: await this.leer(tx, actor.identidadId, ejercicioId) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────

  /**
   * El ejercicio propio, cargado a mano, bloqueado: los cambios de imagen del mismo ejercicio se ordenan acá, y el dueño va
   * en el mismo `WHERE` que el bloqueo, así nadie espera por uno ajeno. Ajeno, sembrado, importado o inexistente: el mismo
   * 404, con la decisión registrada. Bloquear la fila no la modifica: el catálogo sigue siendo de solo agregar.
   */
  private async propioBloqueado(tx: Tx, operacion: string, actor: ActorAutenticado, exerciseId: string, ctx: ContextoDeSolicitud): Promise<string> {
    const [e] = esUuid(exerciseId)
      ? await tx.$queryRaw<{ id: string }[]>`
          SELECT "id"::text AS "id" FROM "ejercicio_de_catalogo"
           WHERE "id" = ${exerciseId}::uuid AND "procedencia" = 'PROFESSIONAL_MANUAL' AND "creado_por_id" = ${actor.identidadId}::uuid
           FOR NO KEY UPDATE`
      : [];
    if (!e) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso: { tipo: RECURSO, id: exerciseId } }, ctx);
    return e.id;
  }

  /** El último cambio de la imagen del ejercicio, si tuvo alguno. */
  private ultimoCambio(tx: Tx, ejercicioId: string) {
    return tx.asociacionDeImagenDeEjercicio.findFirst({ where: { ejercicioId }, orderBy: { numero: 'desc' }, select: { numero: true, cambio: true, versionDeEjercicioId: true } });
  }

  /** Los ejercicios cargados a mano por el profesional, con su versión vigente (la terminal de la cadena). */
  private propios(tx: Tx, profesionalId: string, ejercicioId: string | null): Promise<FilaDeEjercicioPropio[]> {
    return tx.$queryRaw<FilaDeEjercicioPropio[]>`
      SELECT e."id"::text AS "ejercicioId", v."id"::text AS "versionId", v."nombre", (v."disponibilidad" = 'DISPONIBLE') AS "disponible",
             e."momento_de_registro" AS "momentoDeRegistro"
        FROM "ejercicio_de_catalogo" e
        JOIN "version_de_ejercicio" v ON v."ejercicio_id" = e."id"
       WHERE e."procedencia" = 'PROFESSIONAL_MANUAL' AND e."creado_por_id" = ${profesionalId}::uuid
         AND (${ejercicioId}::uuid IS NULL OR e."id" = ${ejercicioId}::uuid)
         AND NOT EXISTS (SELECT 1 FROM "version_de_ejercicio" s WHERE s."predecesora_id" = v."id")
       ORDER BY e."momento_de_registro" DESC, e."id" DESC
       LIMIT ${TOPE_DE_EJERCICIOS_PROPIOS}`;
  }

  private async leer(tx: Tx, profesionalId: string, ejercicioId: string): Promise<EjercicioPropio> {
    const [fila] = await this.propios(tx, profesionalId, ejercicioId);
    if (!fila) throw errores.recursoNoEncontrado();
    return ejercicioPropioApi(fila, (await imagenesDeEjercicios(tx, [ejercicioId], null)).get(ejercicioId));
  }
}
