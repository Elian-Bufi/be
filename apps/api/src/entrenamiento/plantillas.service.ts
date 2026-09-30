import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  CodigoDeError,
  CrearPlantillaDeEntrenamientoRequestSchema,
  EditarPlantillaRequestSchema,
  normalizarEstructuraDeEntrenamiento,
  nombreNormalizadoDePlantilla,
  NuevaVersionDePlantillaRequestSchema,
  problemasDeReferencias,
  referenciasDeEjercicio,
  sesionesDeLaEstructura,
  sinCargasSugeridas,
  type EjercicioCitable,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type OrigenDePlantilla,
  type PlantillaDeEntrenamiento,
  type ResumenDePlantillaDeEntrenamiento,
} from '@be/domain';
import { randomUUID } from 'node:crypto';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { leerConsultaDeLista, paginar } from '../http/paginacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { EjecutorDeEntrenamiento } from './ejecutor';
import { registrarEventoDeEntrenamiento } from './eventos';

type Tx = Prisma.TransactionClient;
const RECURSO = 'PlantillaDePlanDeEntrenamiento';
const CASO_DE_USO = 'UC-P15';
const token = (n: number): string => `v${n}`;

type PlantillaFila = Prisma.PlantillaDePlanDeEntrenamientoGetPayload<{ include: { versiones: true } }>;

/**
 * PF-09 · DL-108 — Plantillas de plan de entrenamiento del profesional (API-TPL-01 a 05).
 * - Molde propio, sin asesorado: solo un profesional de Entrenamiento verificado y habilitado crea, lee y aplica las
 *   suyas (misma regla que el catálogo propio, RF-037); lo ajeno responde 404, sin distinguirlo de lo inexistente.
 * - La estructura se valida como al crear un plan (normalización y referencias del catálogo), pero se guarda tal como
 *   entró: al aplicarla, el plan la vuelve a normalizar con identificadores nuevos. Las cargas sugeridas se quitan salvo
 *   pedido explícito (D-2); nada del asesorado entra (D-5).
 * - Versiones inmutables (la base lo exige); nombre único por profesional; concurrencia por `expectedVersion`.
 */
@Injectable()
export class PlantillasDeEntrenamientoService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly catalogo: CatalogoDeEjerciciosService,
  ) {}

  // ─── API-TPL-01 ──────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TPL-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearPlantillaDeEntrenamientoRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await this.exigirProfesional(tx, actor.identidadId);
        const estructura = await this.estructuraVerificada(tx, actor.identidadId, pedido.structure, pedido.copySuggestedLoads === true);
        if (pedido.origin) await this.exigirVersionDePlanPropia(tx, actor.identidadId, pedido.origin.planVersionId);
        await this.exigirNombreLibre(tx, actor.identidadId, pedido.name, null);
        const momento = await momentoDeLaBase(tx);
        const plantilla = await tx.plantillaDePlanDeEntrenamiento.create({
          data: { profesionalId: actor.identidadId, nombre: pedido.name, nombreNormalizado: nombreNormalizadoDePlantilla(pedido.name), descripcion: pedido.description ?? null, momentoDeActualizacion: momento },
        });
        await tx.versionDePlantillaDePlanDeEntrenamiento.create({
          data: {
            plantillaId: plantilla.id,
            numero: 1,
            estructura: estructura as unknown as Prisma.InputJsonValue,
            cargasCopiadas: pedido.copySuggestedLoads === true,
            ...(pedido.origin ? { origen: pedido.origin as unknown as Prisma.InputJsonValue } : {}),
            autorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        await this.evento(tx, 'PlantillaDePlanCreada', actor.identidadId, plantilla.id, procedencia, momento);
        return { estadoHttp: 201, cuerpo: { data: await this.leer(tx, actor.identidadId, plantilla.id) }, sujetoId: null, recurso: { tipo: RECURSO, id: plantilla.id } };
      },
    });
  }

  // ─── API-TPL-02 ──────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: ResumenDePlantillaDeEntrenamiento[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, { state: ['ACTIVE', 'ARCHIVED'] });
    return this.ejecutor.leer({
      operacion: 'API-TPL-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await this.exigirProfesional(tx, actor.identidadId);
        const filas = await tx.plantillaDePlanDeEntrenamiento.findMany({
          where: {
            profesionalId: actor.identidadId,
            ...(consulta.filtros.state ? { estado: consulta.filtros.state === 'ACTIVE' ? 'ACTIVA' : 'ARCHIVADA' } : {}),
            ...(consulta.cursor ? { OR: [{ momentoDeRegistro: { lt: consulta.cursor.momento } }, { momentoDeRegistro: consulta.cursor.momento, id: { lt: consulta.cursor.id } }] } : {}),
          },
          orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
          take: consulta.limit + 1,
          include: { versiones: { orderBy: { numero: 'desc' }, take: 1 } },
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        return { data: pagina.map((p) => resumenApi(p)), page };
      },
    });
  }

  // ─── API-TPL-03 ──────────────────────────────────────────────────────────
  consultar(actor: ActorAutenticado, templateId: string, ctx: ContextoDeSolicitud): Promise<{ data: PlantillaDeEntrenamiento }> {
    const recurso = { tipo: RECURSO, id: templateId };
    return this.ejecutor.leer({
      operacion: 'API-TPL-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        await this.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, templateId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-03', actorId: actor.identidadId, recurso }, ctx);
        return { data: plantillaApi(fila) };
      },
    });
  }

  // ─── API-TPL-04 ──────────────────────────────────────────────────────────
  nuevaVersion(actor: ActorAutenticado, templateId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: templateId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TPL-04',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: NuevaVersionDePlantillaRequestSchema,
      cuerpo,
      huellaExtra: { templateId },
      efecto: async (tx, pedido, procedencia) => {
        await this.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, templateId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-04', actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        if (fila.estado === 'ARCHIVADA') throw archivada();
        const estructura = await this.estructuraVerificada(tx, actor.identidadId, pedido.structure, pedido.copySuggestedLoads === true);
        if (pedido.origin) await this.exigirVersionDePlanPropia(tx, actor.identidadId, pedido.origin.planVersionId);
        const momento = await momentoDeLaBase(tx);
        const ultima = fila.versiones[0];
        await tx.versionDePlantillaDePlanDeEntrenamiento.create({
          data: {
            plantillaId: fila.id,
            numero: (ultima?.numero ?? 0) + 1,
            estructura: estructura as unknown as Prisma.InputJsonValue,
            cargasCopiadas: pedido.copySuggestedLoads === true,
            ...(pedido.origin ? { origen: pedido.origin as unknown as Prisma.InputJsonValue } : {}),
            autorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        await tx.plantillaDePlanDeEntrenamiento.update({ where: { id: fila.id }, data: { version: { increment: 1 }, momentoDeActualizacion: momento } });
        await this.evento(tx, 'PlantillaDePlanVersionada', actor.identidadId, fila.id, procedencia, momento);
        return { estadoHttp: 201, cuerpo: { data: await this.leer(tx, actor.identidadId, fila.id) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-TPL-05 ──────────────────────────────────────────────────────────
  editar(actor: ActorAutenticado, templateId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: templateId };
    return this.ejecutor.escribir({
      operacion: 'API-TPL-05',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: EditarPlantillaRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        await this.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, templateId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPL-05', actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        if (pedido.name !== undefined) await this.exigirNombreLibre(tx, actor.identidadId, pedido.name, fila.id);
        const momento = await momentoDeLaBase(tx);
        await tx.plantillaDePlanDeEntrenamiento.update({
          where: { id: fila.id },
          data: {
            ...(pedido.name !== undefined ? { nombre: pedido.name, nombreNormalizado: nombreNormalizadoDePlantilla(pedido.name) } : {}),
            ...(pedido.description !== undefined ? { descripcion: pedido.description } : {}),
            ...(pedido.state !== undefined ? { estado: pedido.state === 'ACTIVE' ? 'ACTIVA' : 'ARCHIVADA' } : {}),
            version: { increment: 1 },
            momentoDeActualizacion: momento,
          },
        });
        await this.evento(tx, 'PlantillaDePlanEditada', actor.identidadId, fila.id, procedencia, momento);
        return { estadoHttp: 200, cuerpo: { data: await this.leer(tx, actor.identidadId, fila.id) }, sujetoId: null, recurso };
      },
    });
  }

  /**
   * La versión de plantilla que API-TRN-07 aplica con `fromTemplateVersionId`: propia y de una plantilla activa. Lo
   * ajeno o inexistente es 404 neutral; una archivada, 422.
   */
  async versionParaAplicar(tx: Tx, profesionalId: string, templateVersionId: string): Promise<{ plantillaId: string; versionId: string; estructura: EstructuraDePlanDeEntrenamientoEntrada }> {
    const v = /^[0-9a-f-]{36}$/i.test(templateVersionId)
      ? await tx.versionDePlantillaDePlanDeEntrenamiento.findUnique({ where: { id: templateVersionId }, include: { plantilla: { select: { id: true, profesionalId: true, estado: true } } } })
      : null;
    if (!v || v.plantilla.profesionalId !== profesionalId) throw errores.recursoNoEncontrado();
    if (v.plantilla.estado === 'ARCHIVADA') throw archivada();
    return { plantillaId: v.plantilla.id, versionId: v.id, estructura: v.estructura as unknown as EstructuraDePlanDeEntrenamientoEntrada };
  }

  // ─── Apoyo ───────────────────────────────────────────────────────────────

  /** Solo un profesional de Entrenamiento verificado y habilitado (la misma regla que el catálogo propio, RF-037). */
  private async exigirProfesional(tx: Tx, identidadId: string): Promise<void> {
    if (!(await this.catalogo.esProfesionalDeEntrenamiento(tx, identidadId))) throw errores.accionNoPermitida();
  }

  private propia(tx: Tx, profesionalId: string, templateId: string): Promise<PlantillaFila | null> {
    if (!/^[0-9a-f-]{36}$/i.test(templateId)) return Promise.resolve(null);
    return tx.plantillaDePlanDeEntrenamiento.findFirst({ where: { id: templateId, profesionalId }, include: { versiones: { orderBy: { numero: 'desc' }, take: 1 } } });
  }

  private async leer(tx: Tx, profesionalId: string, templateId: string): Promise<PlantillaDeEntrenamiento> {
    const fila = await this.propia(tx, profesionalId, templateId);
    if (!fila) throw errores.recursoNoEncontrado();
    return plantillaApi(fila);
  }

  /**
   * Valida la estructura como al crear un plan (forma, criterios de intensidad, referencias del catálogo disponibles
   * para este profesional) y devuelve la que se guarda: la de entrada, sin cargas sugeridas salvo pedido explícito.
   */
  private async estructuraVerificada(tx: Tx, profesionalId: string, entrada: EstructuraDePlanDeEntrenamientoEntrada, conCargas: boolean): Promise<EstructuraDePlanDeEntrenamientoEntrada> {
    const guardar = conCargas ? entrada : sinCargasSugeridas(entrada);
    const r = normalizarEstructuraDeEntrenamiento(guardar, randomUUID);
    if (!r.ok) {
      const codigo = r.tipo === 'ESTRUCTURA' ? CodigoDeError.TRAINING_PLAN_STRUCTURE_INVALID : CodigoDeError.INTENSITY_CRITERION_INVALID;
      throw new ErrorDeApi(422, codigo, 'Hay elementos de la plantilla que no se pueden guardar.', { issues: [...r.issues] });
    }
    const catalogo = await this.catalogo.citables(tx, profesionalId, 'PROFESIONAL', referenciasDeEjercicio(r.contenido));
    const referencias = problemasDeReferencias(r.contenido, aCitables(catalogo));
    if (referencias.length > 0) throw new ErrorDeApi(422, CodigoDeError.EXERCISE_REFERENCE_INVALID, 'Hay ejercicios que no se pueden usar en la plantilla.', { issues: referencias });
    return guardar;
  }

  /** El origen declarado tiene que ser una versión de plan del propio profesional; si no, 422 (no se revela nada del plan). */
  private async exigirVersionDePlanPropia(tx: Tx, profesionalId: string, planVersionId: string): Promise<void> {
    const v = /^[0-9a-f-]{36}$/i.test(planVersionId) ? await tx.versionDePlanDeEntrenamiento.findUnique({ where: { id: planVersionId }, select: { plan: { select: { profesionalId: true } } } }) : null;
    if (!v || v.plan.profesionalId !== profesionalId) throw errores.validacionFallida([{ code: 'TEMPLATE_ORIGIN_NOT_OWN', path: 'origin.planVersionId' }]);
  }

  private async exigirNombreLibre(tx: Tx, profesionalId: string, nombre: string, salvoId: string | null): Promise<void> {
    const existente = await tx.plantillaDePlanDeEntrenamiento.findUnique({ where: { profesionalId_nombreNormalizado: { profesionalId, nombreNormalizado: nombreNormalizadoDePlantilla(nombre) } }, select: { id: true } });
    if (existente && existente.id !== salvoId) throw new ErrorDeApi(409, CodigoDeError.TEMPLATE_NAME_TAKEN, 'Ya tenés una plantilla con ese nombre.');
  }

  private evento(tx: Tx, tipo: 'PlantillaDePlanCreada' | 'PlantillaDePlanVersionada' | 'PlantillaDePlanEditada', actorId: string, plantillaId: string, procedencia: unknown, momento: Date): Promise<void> {
    return registrarEventoDeEntrenamiento(tx, {
      tipo,
      profesionalId: actorId,
      asesoradoId: null,
      recurso: { tipo: RECURSO, id: plantillaId },
      estadoPrevio: null,
      estadoPosterior: null,
      actorId,
      procedencia: procedencia as Parameters<typeof registrarEventoDeEntrenamiento>[1]['procedencia'],
      momento,
    });
  }
}

const archivada = (): ErrorDeApi => new ErrorDeApi(422, CodigoDeError.TEMPLATE_ARCHIVED, 'Esa plantilla está archivada: reactivala para usarla.');

function resumenApi(p: PlantillaFila): ResumenDePlantillaDeEntrenamiento {
  const v = p.versiones[0];
  if (!v) throw new Error(`Plantilla ${p.id} sin versiones`);
  const estructura = v.estructura as unknown as EstructuraDePlanDeEntrenamientoEntrada;
  return {
    templateId: p.id,
    versionId: v.id,
    versionNumber: v.numero,
    version: token(p.version),
    name: p.nombre,
    description: p.descripcion,
    state: p.estado === 'ACTIVA' ? 'ACTIVE' : 'ARCHIVED',
    copiedLoads: v.cargasCopiadas,
    origin: (v.origen as OrigenDePlantilla | null) ?? null,
    sessionCount: sesionesDeLaEstructura(estructura),
    createdAt: p.momentoDeRegistro.toISOString(),
    updatedAt: p.momentoDeActualizacion.toISOString(),
  };
}

function plantillaApi(p: PlantillaFila): PlantillaDeEntrenamiento {
  const v = p.versiones[0];
  return { ...resumenApi(p), structure: (v?.estructura as unknown as EstructuraDePlanDeEntrenamientoEntrada) ?? { blocks: [] } };
}

/** Las filas del catálogo como citables (la misma conversión que usa el servicio de planes). */
function aCitables(filas: ReadonlyMap<string, { ejercicioId: string; nombre: string; disponible: boolean }>): Map<string, EjercicioCitable> {
  return new Map([...filas].map(([k, f]) => [k, { ejercicioId: f.ejercicioId, nombre: f.nombre, disponible: f.disponible }]));
}
