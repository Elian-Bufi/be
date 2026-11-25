import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  AbrirPreparacionDePlantillaRequestSchema,
  CodigoDeError,
  CodigoDeProblemaDeLaPlantilla,
  CrearPreparacionDePlantillaRequestSchema,
  ESTRUCTURA_EN_BLANCO,
  GuardarPreparacionDePlantillaRequestSchema,
  VersionDeLaPreparacionRequestSchema,
  nombreNormalizadoDePlantilla,
  normalizarEstructuraDeEntrenamiento,
  paraCompletarAlAdaptar,
  planificacionDeLaPlantillaPodada,
  problemasDeReferencias,
  problemasParaGuardarLaPlantilla,
  referenciasDeEjercicio,
  sesionesDeLaEstructura,
  sinCambiosFrenteALaBase,
  sinCargasSugeridas,
  type ContenidoDePlanDeEntrenamiento,
  type EjercicioCitable,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type PlanificacionDeLaPlantilla,
  type PreparacionDePlantilla,
  type ResumenDePreparacionDePlantilla,
  type RevisionDePreparacion,
  type ValidationIssue,
  type VersionDePlantillaDeEntrenamiento,
} from '@be/domain';
import { randomUUID } from 'node:crypto';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { leerConsultaDeLista, paginar } from '../http/paginacion';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { EjecutorDeEntrenamiento, esUuid } from './ejecutor';
import { imagenesDeEjercicios } from './lectura-por-serie';
import { PlantillasDeEntrenamientoService } from './plantillas.service';

type Tx = Prisma.TransactionClient;
type Estructura = EstructuraDePlanDeEntrenamientoEntrada;
const RECURSO = 'PreparacionDePlantillaDeEntrenamiento';
const RECURSO_DE_LA_PLANTILLA = 'PlantillaDePlanDeEntrenamiento';
const CASO_DE_USO = 'UC-P15';
const token = (n: number): string => `v${n}`;
const MAXIMO_DEL_NOMBRE = 120;

const INCLUIR = { plantilla: { select: { nombre: true, descripcion: true, estado: true } }, versionBase: { select: { numero: true } } } as const;
type PreparacionFila = Prisma.PreparacionDePlantillaDeEntrenamientoGetPayload<{ include: typeof INCLUIR }>;

const archivada = (): ErrorDeApi => new ErrorDeApi(422, CodigoDeError.TEMPLATE_ARCHIVED, 'Esa plantilla está archivada: reactivala para cambiarla.');
const noLista = (issues: ValidationIssue[]) => new ErrorDeApi(422, CodigoDeError.OPERATION_NOT_READY, 'Hay elementos por corregir antes de guardar la plantilla.', { issues });

/**
 * PLT · DL-182 — La preparación de una plantilla de entrenamiento, sin persona (API-TPL-06 a 14).
 *
 * - **Es del profesional y de nadie más**, como la plantilla (DL-108 D-1): la crea, la lee, la cambia y la guarda solo un
 *   profesional de Entrenamiento verificado y habilitado; lo ajeno responde 404, sin distinguirlo de lo inexistente.
 * - **No toca ninguna versión mientras se prepara** (PLT-D02). El autoguardado (API-TPL-10) valida la estructura como el
 *   borrador de un plan (forma, criterios, ejercicios que se pueden citar) y le pone identificadores de nodo; un ejercicio
 *   que dejó de estar disponible se conserva (lo dice la revisión). Guardar (API-TPL-12) crea la plantilla o la versión
 *   siguiente con las escrituras de siempre de `PlantillasDeEntrenamientoService` y borra la preparación.
 * - **Concurrencia como la del plan:** `expectedVersion` y la condición en la base (la fila se escribe solo si sigue en la
 *   versión que se leyó): de dos escrituras con la misma versión, una sola; la otra, 409. Abrir la de una plantilla bloquea
 *   la plantilla: dos «Editar» a la vez dan la misma preparación.
 * - **Nada de una persona:** ni objetivo, ni días, ni próxima revisión. Aplicar una versión sigue siendo API-TRN-07 con
 *   `fromTemplateVersionId`, en el plan de cada persona.
 */
@Injectable()
export class PreparacionesDePlantillaService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly catalogo: CatalogoDeEjerciciosService,
    private readonly plantillas: PlantillasDeEntrenamientoService,
  ) {}

  // ─── API-TPL-06 ──────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TPL-06',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearPreparacionDePlantillaRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await this.plantillas.exigirProfesional(tx, actor.identidadId);
        let estructura: Estructura = ESTRUCTURA_EN_BLANCO;
        let nombre: string | null = null;
        let descripcion: string | null = null;
        let cargas: 'COPIADAS' | 'NO_COPIADAS' = 'NO_COPIADAS';
        let planificacion: PlanificacionDeLaPlantilla | null = null;
        if (pedido.fromTemplateVersionId) {
          // PLT-D07: «desde una existente» es una copia: otra plantilla, con su propio nombre. Una archivada también se copia.
          const id = pedido.fromTemplateVersionId;
          const v = esUuid(id)
            ? await tx.versionDePlantillaDePlanDeEntrenamiento.findUnique({ where: { id }, include: { plantilla: { select: { profesionalId: true, nombre: true, descripcion: true } } } })
            : null;
          if (!v || v.plantilla.profesionalId !== actor.identidadId) {
            throw this.ejecutor.noRevelable({ operacion: 'API-TPL-06', actorId: actor.identidadId, recurso: { tipo: 'VersionDePlantillaDePlanDeEntrenamiento', id } }, ctx);
          }
          estructura = v.estructura as unknown as Estructura;
          nombre = nombreDeLaCopia(v.plantilla.nombre);
          descripcion = v.plantilla.descripcion;
          cargas = v.cargas;
          // DL-198 (ET2-10): la copia lleva también la planificación.
          planificacion = planificacionDe(v.planificacion);
        }
        const momento = await momentoDeLaBase(tx);
        const fila = await tx.preparacionDePlantillaDeEntrenamiento.create({
          data: {
            profesionalId: actor.identidadId,
            nombre,
            descripcion,
            estructura: conIdentificadores(estructura) as unknown as Prisma.InputJsonValue,
            ...(planificacion ? { planificacion: planificacion as unknown as Prisma.InputJsonValue } : {}),
            cargas,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeActualizacion: momento,
          },
          include: INCLUIR,
        });
        return { estadoHttp: 201, cuerpo: { data: await this.conEjercicios(tx, actor.identidadId, fila) }, sujetoId: null, recurso: { tipo: RECURSO, id: fila.id } };
      },
    });
  }

  // ─── API-TPL-07 ──────────────────────────────────────────────────────────
  abrir(actor: ActorAutenticado, templateId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_DE_LA_PLANTILLA, id: templateId };
    return this.ejecutor.escribir({
      operacion: 'API-TPL-07',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: AbrirPreparacionDePlantillaRequestSchema,
      cuerpo: cuerpo ?? {},
      efecto: async (tx, _pedido, procedencia) => {
        await this.plantillas.exigirProfesional(tx, actor.identidadId);
        const plantilla = await this.plantillas.propia(tx, actor.identidadId, templateId);
        if (!plantilla) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-07', actorId: actor.identidadId, recurso }, ctx);
        // PLT-D04: una por plantilla. La plantilla bloqueada ordena dos «Editar» a la vez: el segundo encuentra la del primero.
        await tx.$queryRaw`SELECT 1 FROM "plantilla_de_plan_de_entrenamiento" WHERE "id" = ${plantilla.id}::uuid FOR NO KEY UPDATE`;
        const existente = await tx.preparacionDePlantillaDeEntrenamiento.findUnique({ where: { plantillaId: plantilla.id }, include: INCLUIR });
        if (existente) return { estadoHttp: 200, cuerpo: { data: await this.conEjercicios(tx, actor.identidadId, existente) }, sujetoId: null, recurso: { tipo: RECURSO, id: existente.id } };
        if (plantilla.estado === 'ARCHIVADA') throw archivada();
        const vigente = plantilla.versiones[0];
        if (!vigente) throw new Error(`Plantilla ${plantilla.id} sin versiones`);
        const momento = await momentoDeLaBase(tx);
        const fila = await tx.preparacionDePlantillaDeEntrenamiento.create({
          data: {
            profesionalId: actor.identidadId,
            plantillaId: plantilla.id,
            versionBaseId: vigente.id,
            estructura: conIdentificadores(vigente.estructura as unknown as Estructura) as unknown as Prisma.InputJsonValue,
            ...(planificacionDe(vigente.planificacion) ? { planificacion: vigente.planificacion as Prisma.InputJsonValue } : {}),
            cargas: vigente.cargas,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeActualizacion: momento,
          },
          include: INCLUIR,
        });
        return { estadoHttp: 201, cuerpo: { data: await this.conEjercicios(tx, actor.identidadId, fila) }, sujetoId: null, recurso: { tipo: RECURSO, id: fila.id } };
      },
    });
  }

  // ─── API-TPL-08 ──────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: ResumenDePreparacionDePlantilla[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-TPL-08',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await this.plantillas.exigirProfesional(tx, actor.identidadId);
        const filas = await tx.preparacionDePlantillaDeEntrenamiento.findMany({
          where: {
            profesionalId: actor.identidadId,
            ...(consulta.cursor ? { OR: [{ momentoDeRegistro: { lt: consulta.cursor.momento } }, { momentoDeRegistro: consulta.cursor.momento, id: { lt: consulta.cursor.id } }] } : {}),
          },
          orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
          take: consulta.limit + 1,
          include: INCLUIR,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        return { data: pagina.map(resumenApi), page };
      },
    });
  }

  // ─── API-TPL-09 ──────────────────────────────────────────────────────────
  consultar(actor: ActorAutenticado, draftId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: PreparacionDePlantilla }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: RECURSO, id: draftId };
    return this.ejecutor.leer({
      operacion: 'API-TPL-09',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        await this.plantillas.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, draftId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-09', actorId: actor.identidadId, recurso }, ctx);
        return { data: await this.conEjercicios(tx, actor.identidadId, fila) };
      },
    });
  }

  // ─── API-TPL-10 ──────────────────────────────────────────────────────────
  guardar(actor: ActorAutenticado, draftId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: draftId };
    return this.ejecutor.escribir({
      operacion: 'API-TPL-10',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: GuardarPreparacionDePlantillaRequestSchema,
      cuerpo,
      efecto: async (tx, pedido) => {
        await this.plantillas.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, draftId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-10', actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        // PLT-D05: el nombre y la descripción de una plantilla existente son de la plantilla (API-TPL-05), no de sus cambios.
        if (fila.plantillaId !== null && (pedido.name !== undefined || pedido.description !== undefined)) {
          throw errores.validacionFallida([{ code: 'TEMPLATE_METADATA_NOT_IN_DRAFT', path: pedido.name !== undefined ? 'name' : 'description' }]);
        }
        const contenido = await this.estructuraParaPreparar(tx, actor.identidadId, pedido.structure);
        const momento = await momentoDeLaBase(tx);
        // La condición en la base: de dos guardados con la misma versión, el segundo espera la fila y ya no la encuentra.
        const r = await tx.preparacionDePlantillaDeEntrenamiento.updateMany({
          where: { id: fila.id, version: fila.version },
          data: {
            estructura: contenido as unknown as Prisma.InputJsonValue,
            // DL-198 (ET2-10): la planificación, podada contra la estructura. Ausente, no cambia; `null`, se quita.
            ...(pedido.planning !== undefined ? { planificacion: aColumna(planificacionDeLaPlantillaPodada(pedido.planning, contenido)) } : {}),
            ...(pedido.name !== undefined ? { nombre: pedido.name === '' ? null : pedido.name } : {}),
            ...(pedido.description !== undefined ? { descripcion: pedido.description === '' ? null : pedido.description } : {}),
            ...(pedido.copySuggestedLoads !== undefined ? { cargas: pedido.copySuggestedLoads ? ('COPIADAS' as const) : ('NO_COPIADAS' as const) } : {}),
            version: { increment: 1 },
            momentoDeActualizacion: momento,
          },
        });
        if (r.count === 0) throw errores.conflictoDeVersion();
        const guardada = await tx.preparacionDePlantillaDeEntrenamiento.findUniqueOrThrow({ where: { id: fila.id }, include: INCLUIR });
        return { estadoHttp: 200, cuerpo: { data: await this.conEjercicios(tx, actor.identidadId, guardada) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-TPL-11 ──────────────────────────────────────────────────────────
  /** Revisar no guarda nada y no es un estado: 200 aunque haya problemas, como API-TRN-11. */
  revisar(actor: ActorAutenticado, draftId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: draftId };
    return this.ejecutor.escribir({
      operacion: 'API-TPL-11',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: VersionDeLaPreparacionRequestSchema,
      cuerpo,
      efecto: async (tx, pedido) => {
        await this.plantillas.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, draftId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-11', actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        const { issues, toComplete } = await this.revision(tx, actor.identidadId, fila);
        const data: RevisionDePreparacion = { valid: issues.length === 0, version: token(fila.version), issues, toComplete };
        return { estadoHttp: 200, cuerpo: { data }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-TPL-12 ──────────────────────────────────────────────────────────
  publicar(actor: ActorAutenticado, draftId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: draftId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TPL-12',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: VersionDeLaPreparacionRequestSchema,
      cuerpo,
      huellaExtra: { draftId },
      efecto: async (tx, pedido, procedencia) => {
        await this.plantillas.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, draftId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-12', actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        // La preparación queda tomada por este pedido: otro guardado o un autoguardado con la misma versión espera y da 409.
        const tomada = await tx.preparacionDePlantillaDeEntrenamiento.updateMany({ where: { id: fila.id, version: fila.version }, data: { version: { increment: 1 } } });
        if (tomada.count === 0) throw errores.conflictoDeVersion();
        // Guardar exige que la plantilla siga en la versión de la que partió esta preparación (otra escritura, API-TPL-04):
        // un conflicto se dice antes que cualquier otra cosa.
        const plantilla = fila.plantillaId === null ? null : await this.plantillas.propia(tx, actor.identidadId, fila.plantillaId);
        if (fila.plantillaId !== null && !plantilla) throw errores.recursoNoEncontrado();
        if (plantilla && plantilla.versiones[0]?.id !== fila.versionBaseId) throw errores.conflictoDeVersion();
        const { issues } = await this.revision(tx, actor.identidadId, fila);
        // El nombre tomado y la plantilla archivada tienen su código propio, como en API-TPL-01 y 04.
        if (issues.some((x) => x.code === CodigoDeProblemaDeLaPlantilla.TEMPLATE_ARCHIVED)) throw archivada();
        const impiden = issues.filter((x) => x.code !== CodigoDeProblemaDeLaPlantilla.TEMPLATE_NAME_TAKEN);
        if (impiden.length > 0) throw noLista(impiden);
        const { estructura, conCargas } = loQueIriaALaVersion(fila);
        const planificacionDeLaVersion = planificacionDeLaPlantillaPodada(planificacionDe(fila.planificacion), estructura);
        let plantillaId: string;
        if (!plantilla) {
          const nombre = (fila.nombre ?? '').trim();
          await this.plantillas.exigirNombreLibre(tx, actor.identidadId, nombre, null);
          plantillaId = await this.plantillas.crearConSuPrimeraVersion(tx, actor.identidadId, { nombre, descripcion: fila.descripcion, estructura, conCargas, origen: null, planificacion: planificacionDeLaVersion }, procedencia);
        } else {
          await this.plantillas.agregarVersion(tx, actor.identidadId, plantilla, { estructura, conCargas, origen: null, planificacion: planificacionDeLaVersion }, procedencia);
          plantillaId = plantilla.id;
        }
        await tx.preparacionDePlantillaDeEntrenamiento.delete({ where: { id: fila.id } });
        return { estadoHttp: 201, cuerpo: { data: await this.plantillas.leer(tx, actor.identidadId, plantillaId) }, sujetoId: null, recurso: { tipo: RECURSO_DE_LA_PLANTILLA, id: plantillaId } };
      },
    });
  }

  // ─── API-TPL-13 ──────────────────────────────────────────────────────────
  descartar(actor: ActorAutenticado, draftId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: draftId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TPL-13',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: VersionDeLaPreparacionRequestSchema,
      cuerpo,
      huellaExtra: { draftId },
      efecto: async (tx, pedido) => {
        await this.plantillas.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, draftId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-13', actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        const r = await tx.preparacionDePlantillaDeEntrenamiento.deleteMany({ where: { id: fila.id, version: fila.version } });
        if (r.count === 0) throw errores.conflictoDeVersion();
        const momento = await momentoDeLaBase(tx);
        return { estadoHttp: 200, cuerpo: { data: { draftId: fila.id, discardedAt: momento.toISOString() } }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-TPL-14 ──────────────────────────────────────────────────────────
  versiones(actor: ActorAutenticado, templateId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: VersionDePlantillaDeEntrenamiento[] }> {
    sinParametrosDeQuery(query);
    const recurso = { tipo: RECURSO_DE_LA_PLANTILLA, id: templateId };
    return this.ejecutor.leer({
      operacion: 'API-TPL-14',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        await this.plantillas.exigirProfesional(tx, actor.identidadId);
        const plantilla = await this.plantillas.propia(tx, actor.identidadId, templateId);
        if (!plantilla) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-14', actorId: actor.identidadId, recurso }, ctx);
        const versiones = await tx.versionDePlantillaDePlanDeEntrenamiento.findMany({ where: { plantillaId: plantilla.id }, orderBy: { numero: 'desc' } });
        // PLT-D11: cuántas versiones de plan de este profesional nacieron de cada versión (no las descartadas). Sin personas.
        const usos = await tx.$queryRaw<{ versionId: string; planes: number }[]>`
          SELECT v."origen_de_plantilla"->>'templateVersionId' AS "versionId", count(*)::int AS "planes"
            FROM "version_de_plan_de_entrenamiento" v
            JOIN "plan_de_entrenamiento" p ON p."id" = v."plan_id"
           WHERE p."profesional_id" = ${actor.identidadId}::uuid
             AND v."estado" <> 'DESCARTADA'
             AND v."origen_de_plantilla"->>'templateId' = ${plantilla.id}
           GROUP BY 1`;
        const porVersion = new Map(usos.map((u) => [u.versionId, u.planes]));
        return {
          data: versiones.map((v) => ({
            versionId: v.id,
            versionNumber: v.numero,
            createdAt: v.momentoDeRegistro.toISOString(),
            sessionCount: sesionesDeLaEstructura(v.estructura as unknown as Estructura),
            copiedLoads: v.cargas === 'COPIADAS',
            plansCreated: porVersion.get(v.id) ?? 0,
          })),
        };
      },
    });
  }

  // ─── Apoyo ───────────────────────────────────────────────────────────────

  private propia(tx: Tx, profesionalId: string, draftId: string): Promise<PreparacionFila | null> {
    if (!esUuid(draftId)) return Promise.resolve(null);
    return tx.preparacionDePlantillaDeEntrenamiento.findFirst({ where: { id: draftId, profesionalId }, include: INCLUIR });
  }

  /**
   * La estructura que se guarda en la preparación: normalizada como la de un borrador de plan, con los identificadores
   * de nodo que le pone el servidor (el editor los conserva entre guardados). Se rechaza lo que no se puede guardar ni en
   * un borrador (422 con su lugar) y un ejercicio que este profesional no puede citar; uno que dejó de estar disponible se
   * conserva: lo dice la revisión y no se guarda como versión hasta cambiarlo (PLT-D06).
   */
  private async estructuraParaPreparar(tx: Tx, profesionalId: string, entrada: Estructura): Promise<ContenidoDePlanDeEntrenamiento> {
    const r = normalizarEstructuraDeEntrenamiento(entrada, randomUUID);
    if (!r.ok) {
      const codigo = r.tipo === 'ESTRUCTURA' ? CodigoDeError.TRAINING_PLAN_STRUCTURE_INVALID : CodigoDeError.INTENSITY_CRITERION_INVALID;
      throw new ErrorDeApi(422, codigo, 'Hay elementos de la plantilla que no se pueden guardar.', { issues: [...r.issues] });
    }
    const catalogo = await this.catalogo.citables(tx, profesionalId, 'PROFESIONAL', referenciasDeEjercicio(r.contenido));
    const ajenos = problemasDeReferencias(r.contenido, aCitables(catalogo)).filter((x) => x.code === CodigoDeError.EXERCISE_REFERENCE_INVALID);
    if (ajenos.length > 0) throw new ErrorDeApi(422, CodigoDeError.EXERCISE_REFERENCE_INVALID, 'Hay ejercicios que no se pueden usar en la plantilla.', { issues: ajenos });
    return { blocks: r.contenido.blocks };
  }

  /**
   * La revisión de una preparación (API-TPL-11, y lo mismo al guardarla en API-TPL-12): lo que impide guardarla y lo que
   * queda para completar al adaptarla. Sin las reglas que dependen de una persona (PLT-D08 y PLT-D09).
   */
  private async revision(tx: Tx, profesionalId: string, fila: PreparacionFila): Promise<{ issues: ValidationIssue[]; toComplete: ValidationIssue[] }> {
    const estructura = estructuraDe(fila);
    const normalizada = normalizarEstructuraDeEntrenamiento(estructura, randomUUID);
    // Lo guardado ya pasó por la misma normalización: si no la pasa, es un dato roto, no un problema del profesional.
    if (!normalizada.ok) throw new Error(`Preparación ${fila.id} con una estructura que no se normaliza`);
    const contenido = normalizada.contenido;
    const catalogo = await this.catalogo.citables(tx, profesionalId, 'PROFESIONAL', referenciasDeEjercicio(contenido));
    const nueva = fila.plantillaId === null;
    const nombre = nueva ? (fila.nombre ?? '') : (fila.plantilla?.nombre ?? '');
    const issues: ValidationIssue[] = [...problemasParaGuardarLaPlantilla({ nueva, nombre, estructura }), ...problemasDeReferencias(contenido, aCitables(catalogo))];
    if (nueva && nombre.trim() !== '') {
      const existente = await tx.plantillaDePlanDeEntrenamiento.findUnique({
        where: { profesionalId_nombreNormalizado: { profesionalId, nombreNormalizado: nombreNormalizadoDePlantilla(nombre) } },
        select: { id: true },
      });
      if (existente) issues.push({ code: CodigoDeProblemaDeLaPlantilla.TEMPLATE_NAME_TAKEN, path: 'name' });
    }
    if (!nueva && fila.versionBaseId) {
      // PLT-D10: no se guarda una versión igual a la de base.
      const base = await tx.versionDePlantillaDePlanDeEntrenamiento.findUnique({ where: { id: fila.versionBaseId }, select: { estructura: true, cargas: true, planificacion: true } });
      const iria = loQueIriaALaVersion(fila);
      if (base && sinCambiosFrenteALaBase({ estructura: base.estructura, conCargas: base.cargas === 'COPIADAS' }, { estructuraQueIria: iria.estructura, conCargas: iria.conCargas }) &&
        // DL-198 (ET2-10): un cambio solo de la planificación también es una versión nueva.
        JSON.stringify(base.planificacion ?? null) === JSON.stringify(planificacionDeLaPlantillaPodada(planificacionDe(fila.planificacion), iria.estructura))
      ) {
        issues.push({ code: CodigoDeProblemaDeLaPlantilla.TEMPLATE_UNCHANGED, path: 'blocks' });
      }
    }
    if (!nueva && fila.plantilla?.estado === 'ARCHIVADA') issues.push({ code: CodigoDeProblemaDeLaPlantilla.TEMPLATE_ARCHIVED, path: 'templateId' });
    return { issues, toComplete: paraCompletarAlAdaptar(contenido) };
  }

  /** La preparación con el nombre vigente, la disponibilidad y la imagen de cada ejercicio que este profesional puede citar. */
  private async conEjercicios(tx: Tx, profesionalId: string, fila: PreparacionFila): Promise<PreparacionDePlantilla> {
    const estructura = estructuraDe(fila);
    const referencias = [...new Set(referenciasDeLaEstructura(estructura))];
    const citables = referencias.length > 0 ? await this.catalogo.citables(tx, profesionalId, 'PROFESIONAL', referencias) : new Map();
    const imagenes = await imagenesDeEjercicios(tx, [...citables.values()].map((e) => e.ejercicioId), null);
    const exercises: PreparacionDePlantilla['exercises'] = {};
    for (const [versionId, e] of citables) {
      exercises[versionId] = { exerciseId: e.ejercicioId, exerciseName: e.nombre, available: e.disponible, image: imagenes.get(e.ejercicioId.toLowerCase())?.imagen ?? null };
    }
    return { ...resumenApi(fila), structure: estructura, planning: planificacionDe(fila.planificacion), exercises };
  }
}

/** El nombre sugerido de una copia: «Fuerza 3 días · copia», sin pasar el tope del contrato. */
function nombreDeLaCopia(nombre: string): string {
  const sufijo = ' · copia';
  return `${nombre.slice(0, MAXIMO_DEL_NOMBRE - sufijo.length).trimEnd()}${sufijo}`;
}

/**
 * La estructura de una versión o en blanco, con los identificadores de nodo que no tenga (una versión guardada con
 * API-TPL-01 puede no traerlos): el editor los necesita estables desde el primer guardado. Una versión ya verificada se
 * normaliza sin problemas.
 */
function conIdentificadores(e: Estructura): Estructura {
  const r = normalizarEstructuraDeEntrenamiento(e, randomUUID);
  if (!r.ok) throw new Error('Una versión de plantilla guardada que no se normaliza');
  return { blocks: r.contenido.blocks } as unknown as Estructura;
}

const estructuraDe = (fila: PreparacionFila): Estructura => fila.estructura as unknown as Estructura;

/** DL-198 (ET2-10): la planificación guardada en una columna JSON, o `null`. */
const planificacionDe = (columna: Prisma.JsonValue | null | undefined): PlanificacionDeLaPlantilla | null => (columna as unknown as PlanificacionDeLaPlantilla | null) ?? null;
/** Lo que se escribe en la columna: el valor, o el NULL de la base. */
const aColumna = (p: PlanificacionDeLaPlantilla | null): Prisma.InputJsonValue | typeof Prisma.DbNull => (p ? (p as unknown as Prisma.InputJsonValue) : Prisma.DbNull);

/** Lo que iría a la versión al guardarla: la estructura, sin cargas si el interruptor está apagado (D-2 de DL-108). */
function loQueIriaALaVersion(fila: PreparacionFila): { readonly estructura: Estructura; readonly conCargas: boolean } {
  const conCargas = fila.cargas === 'COPIADAS';
  const estructura = estructuraDe(fila);
  return { estructura: conCargas ? estructura : sinCargasSugeridas(estructura), conCargas };
}

function resumenApi(fila: PreparacionFila): ResumenDePreparacionDePlantilla {
  const estructura = estructuraDe(fila);
  const nueva = fila.plantillaId === null;
  return {
    draftId: fila.id,
    templateId: fila.plantillaId,
    baseVersionId: fila.versionBaseId,
    baseVersionNumber: fila.versionBase?.numero ?? null,
    version: token(fila.version),
    name: nueva ? (fila.nombre ?? '') : (fila.plantilla?.nombre ?? ''),
    description: nueva ? fila.descripcion : (fila.plantilla?.descripcion ?? null),
    templateState: nueva ? null : fila.plantilla?.estado === 'ARCHIVADA' ? 'ARCHIVED' : 'ACTIVE',
    copySuggestedLoads: fila.cargas === 'COPIADAS',
    sessionCount: sesionesDeLaEstructura(estructura),
    createdAt: fila.momentoDeRegistro.toISOString(),
    updatedAt: fila.momentoDeActualizacion.toISOString(),
  };
}

/** Los `exerciseVersionId` que una estructura de entrada referencia. */
function referenciasDeLaEstructura(e: Estructura): string[] {
  const deSesion = (s: { prescriptions: readonly { exerciseVersionId: string }[] }) => s.prescriptions.map((p) => p.exerciseVersionId);
  return e.blocks.flatMap((b) => [...(b.sessions ?? []).flatMap(deSesion), ...(b.microcycles ?? []).flatMap((m) => m.sessions.flatMap(deSesion))]);
}

/** Las filas del catálogo como citables (la misma conversión que usan los servicios de planes y de plantillas). */
function aCitables(filas: ReadonlyMap<string, { ejercicioId: string; nombre: string; disponible: boolean }>): Map<string, EjercicioCitable> {
  return new Map([...filas].map(([k, f]) => [k, { ejercicioId: f.ejercicioId, nombre: f.nombre, disponible: f.disponible }]));
}
