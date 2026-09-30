import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  CodigoDeError,
  comidasDeLaEstructura,
  CrearPlantillaNutricionalRequestSchema,
  EditarPlantillaRequestSchema,
  nombreNormalizadoDePlantilla,
  normalizarEstructura,
  NuevaVersionDePlantillaNutricionalRequestSchema,
  problemasDeBorrador,
  sinCantidades,
  type EstructuraDePlanEntrada,
  type OrigenDePlantilla,
  type PlantillaNutricional,
  type ResumenDePlantillaNutricional,
  type ValidationIssue,
} from '@be/domain';
import { randomUUID } from 'node:crypto';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { leerConsultaDeLista, paginar } from '../http/paginacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { CatalogoService } from './catalogo.service';
import { EjecutorNutricional } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';

type Tx = Prisma.TransactionClient;
const RECURSO = 'PlantillaDePlanNutricional';
const CASO_DE_USO = 'UC-P10';
const token = (n: number): string => `v${n}`;
const nombreTomado = (): ErrorDeApi => new ErrorDeApi(409, CodigoDeError.TEMPLATE_NAME_TAKEN, 'Ya tenés una plantilla con ese nombre.');
const UUID = /^[0-9a-f-]{36}$/i;

type PlantillaFila = Prisma.PlantillaDePlanNutricionalGetPayload<{ include: { versiones: true } }>;

/**
 * PF-09 · DL-108 — Plantillas de plan de comidas del profesional (API-TPN-01 a 05), el mismo molde que las de
 * entrenamiento: propias (lo ajeno es 404 neutral; un asesorado o un profesional de otra área, 403), estructura con la
 * misma forma que API-NUT-07, validada como un borrador (forma y elementos del catálogo disponibles para este
 * profesional) y guardada tal como entró; las **cantidades** se quitan salvo pedido explícito (D-2 en nutrición: la
 * cantidad es de cada persona); nada del asesorado (D-5). Versiones inmutables; nombre único; `expectedVersion`.
 */
@Injectable()
export class PlantillasNutricionalesService {
  constructor(
    private readonly ejecutor: EjecutorNutricional,
    private readonly catalogo: CatalogoService,
  ) {}

  // ─── API-TPN-01 ──────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TPN-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: CrearPlantillaNutricionalRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await this.catalogo.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const estructura = await this.estructuraVerificada(tx, actor.identidadId, pedido.structure, pedido.copyQuantities === true);
        if (pedido.origin) await this.exigirVersionDePlanPropia(tx, actor.identidadId, pedido.origin.planVersionId);
        await this.exigirNombreLibre(tx, actor.identidadId, pedido.name, null);
        const momento = await momentoDeLaBase(tx);
        const plantilla = await sinDuplicar(
          tx.plantillaDePlanNutricional.create({
            data: { profesionalId: actor.identidadId, nombre: pedido.name, nombreNormalizado: nombreNormalizadoDePlantilla(pedido.name), descripcion: pedido.description ?? null, momentoDeActualizacion: momento },
          }),
          nombreTomado,
        );
        await tx.versionDePlantillaDePlanNutricional.create({
          data: {
            plantillaId: plantilla.id,
            numero: 1,
            estructura: estructura as unknown as Prisma.InputJsonValue,
            cantidades: pedido.copyQuantities === true ? 'COPIADAS' : 'NO_COPIADAS',
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

  // ─── API-TPN-02 ──────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: ResumenDePlantillaNutricional[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, { state: ['ACTIVE', 'ARCHIVED'] });
    return this.ejecutor.leer({
      operacion: 'API-TPN-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await this.catalogo.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const filas = await tx.plantillaDePlanNutricional.findMany({
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

  // ─── API-TPN-03 ──────────────────────────────────────────────────────────
  consultar(actor: ActorAutenticado, templateId: string, ctx: ContextoDeSolicitud): Promise<{ data: PlantillaNutricional }> {
    const recurso = { tipo: RECURSO, id: templateId };
    return this.ejecutor.leer({
      operacion: 'API-TPN-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      lectura: async (tx) => {
        await this.catalogo.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, templateId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPN-03', actorId: actor.identidadId, recurso }, ctx);
        return { data: await this.conElementos(tx, actor.identidadId, fila) };
      },
    });
  }

  // ─── API-TPN-04 ──────────────────────────────────────────────────────────
  nuevaVersion(actor: ActorAutenticado, templateId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: templateId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-TPN-04',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: NuevaVersionDePlantillaNutricionalRequestSchema,
      cuerpo,
      huellaExtra: { templateId },
      efecto: async (tx, pedido, procedencia) => {
        await this.catalogo.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, templateId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPN-04', actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        if (fila.estado === 'ARCHIVADA') throw archivada();
        const estructura = await this.estructuraVerificada(tx, actor.identidadId, pedido.structure, pedido.copyQuantities === true);
        if (pedido.origin) await this.exigirVersionDePlanPropia(tx, actor.identidadId, pedido.origin.planVersionId);
        const momento = await momentoDeLaBase(tx);
        await this.avanzarVersion(tx, fila, { momentoDeActualizacion: momento });
        await sinDuplicar(tx.versionDePlantillaDePlanNutricional.create({
          data: {
            plantillaId: fila.id,
            numero: (fila.versiones[0]?.numero ?? 0) + 1,
            estructura: estructura as unknown as Prisma.InputJsonValue,
            cantidades: pedido.copyQuantities === true ? 'COPIADAS' : 'NO_COPIADAS',
            ...(pedido.origin ? { origen: pedido.origin as unknown as Prisma.InputJsonValue } : {}),
            autorId: actor.identidadId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        }), errores.conflictoDeVersion);
        await this.evento(tx, 'PlantillaDePlanVersionada', actor.identidadId, fila.id, procedencia, momento);
        return { estadoHttp: 201, cuerpo: { data: await this.leer(tx, actor.identidadId, fila.id) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-TPN-05 ──────────────────────────────────────────────────────────
  editar(actor: ActorAutenticado, templateId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: templateId };
    return this.ejecutor.escribir({
      operacion: 'API-TPN-05',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: EditarPlantillaRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        await this.catalogo.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, templateId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-TPN-05', actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        if (pedido.name !== undefined) await this.exigirNombreLibre(tx, actor.identidadId, pedido.name, fila.id);
        const momento = await momentoDeLaBase(tx);
        await this.avanzarVersion(tx, fila, {
          ...(pedido.name !== undefined ? { nombre: pedido.name, nombreNormalizado: nombreNormalizadoDePlantilla(pedido.name) } : {}),
          ...(pedido.description !== undefined ? { descripcion: pedido.description } : {}),
          ...(pedido.state !== undefined ? { estado: pedido.state === 'ACTIVE' ? ('ACTIVA' as const) : ('ARCHIVADA' as const) } : {}),
          momentoDeActualizacion: momento,
        });
        await this.evento(tx, 'PlantillaDePlanEditada', actor.identidadId, fila.id, procedencia, momento);
        return { estadoHttp: 200, cuerpo: { data: await this.leer(tx, actor.identidadId, fila.id) }, sujetoId: null, recurso };
      },
    });
  }

  /** La versión de plantilla que API-NUT-07 aplica con `fromTemplateVersionId`: propia y activa; ajena o inexistente, 404; archivada, 422. */
  async versionParaAplicar(tx: Tx, profesionalId: string, templateVersionId: string): Promise<{ plantillaId: string; versionId: string; estructura: EstructuraDePlanEntrada }> {
    const v = UUID.test(templateVersionId)
      ? await tx.versionDePlantillaDePlanNutricional.findUnique({ where: { id: templateVersionId }, include: { plantilla: { select: { id: true, profesionalId: true, estado: true } } } })
      : null;
    if (!v || v.plantilla.profesionalId !== profesionalId) throw errores.recursoNoEncontrado();
    if (v.plantilla.estado === 'ARCHIVADA') throw archivada();
    return { plantillaId: v.plantilla.id, versionId: v.id, estructura: v.estructura as unknown as EstructuraDePlanEntrada };
  }

  // ─── Apoyo ───────────────────────────────────────────────────────────────

  private propia(tx: Tx, profesionalId: string, templateId: string): Promise<PlantillaFila | null> {
    if (!UUID.test(templateId)) return Promise.resolve(null);
    return tx.plantillaDePlanNutricional.findFirst({ where: { id: templateId, profesionalId }, include: { versiones: { orderBy: { numero: 'desc' }, take: 1 } } });
  }

  private async leer(tx: Tx, profesionalId: string, templateId: string): Promise<PlantillaNutricional> {
    const fila = await this.propia(tx, profesionalId, templateId);
    if (!fila) throw errores.recursoNoEncontrado();
    return this.conElementos(tx, profesionalId, fila);
  }

  /** El detalle con el nombre vigente de cada elemento del catálogo y su disponibilidad para este profesional. */
  private async conElementos(tx: Tx, profesionalId: string, fila: PlantillaFila): Promise<PlantillaNutricional> {
    const base = plantillaApi(fila);
    const contenido = normalizarEstructura(base.structure, randomUUID);
    const ids = [...new Set(idsDeCatalogo(contenido))];
    const disponibles = ids.length > 0 ? await this.catalogo.disponibles(tx, profesionalId, ids) : new Map();
    const items: PlantillaNutricional['items'] = {};
    for (const [id, e] of disponibles) items[id] = { name: e.name, available: true };
    return { ...base, items };
  }

  /** Valida como un borrador (forma y elementos disponibles) y devuelve la estructura que se guarda: sin cantidades salvo pedido. */
  private async estructuraVerificada(tx: Tx, profesionalId: string, entrada: EstructuraDePlanEntrada, conCantidades: boolean): Promise<EstructuraDePlanEntrada> {
    const guardar = conCantidades ? entrada : sinCantidades(entrada);
    const contenido = normalizarEstructura(guardar, randomUUID);
    const disponibles = await this.catalogo.disponibles(tx, profesionalId, idsDeCatalogo(contenido));
    const problemas: ValidationIssue[] = problemasDeBorrador(contenido, new Set(disponibles.keys()));
    if (problemas.length > 0) throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'Hay elementos de la plantilla que no se pueden guardar.', { issues: problemas });
    return guardar;
  }

  private async exigirVersionDePlanPropia(tx: Tx, profesionalId: string, planVersionId: string): Promise<void> {
    const v = UUID.test(planVersionId) ? await tx.versionDePlanNutricional.findUnique({ where: { id: planVersionId }, select: { plan: { select: { profesionalId: true } } } }) : null;
    if (!v || v.plan.profesionalId !== profesionalId) throw errores.validacionFallida([{ code: 'TEMPLATE_ORIGIN_NOT_OWN', path: 'origin.planVersionId' }]);
  }

  private async exigirNombreLibre(tx: Tx, profesionalId: string, nombre: string, salvoId: string | null): Promise<void> {
    const existente = await tx.plantillaDePlanNutricional.findUnique({ where: { profesionalId_nombreNormalizado: { profesionalId, nombreNormalizado: nombreNormalizadoDePlantilla(nombre) } }, select: { id: true } });
    if (existente && existente.id !== salvoId) throw nombreTomado();
  }

  /** Como en entrenamiento: escribe solo si la plantilla sigue en la versión leída (si no, 409), y el nombre lo decide la base. */
  private async avanzarVersion(tx: Tx, fila: PlantillaFila, data: Prisma.PlantillaDePlanNutricionalUpdateManyMutationInput): Promise<void> {
    const r = await sinDuplicar(tx.plantillaDePlanNutricional.updateMany({ where: { id: fila.id, version: fila.version }, data: { ...data, version: { increment: 1 } } }), nombreTomado);
    if (r.count === 0) throw errores.conflictoDeVersion();
  }

  private evento(tx: Tx, tipo: 'PlantillaDePlanCreada' | 'PlantillaDePlanVersionada' | 'PlantillaDePlanEditada', actorId: string, plantillaId: string, procedencia: unknown, momento: Date): Promise<void> {
    return registrarEventoDeNutricion(tx, {
      tipo,
      profesionalId: actorId,
      asesoradoId: null,
      recurso: { tipo: RECURSO, id: plantillaId },
      estadoPrevio: null,
      estadoPosterior: null,
      actorId,
      procedencia: procedencia as Parameters<typeof registrarEventoDeNutricion>[1]['procedencia'],
      momento,
    });
  }
}

const archivada = (): ErrorDeApi => new ErrorDeApi(422, CodigoDeError.TEMPLATE_ARCHIVED, 'Esa plantilla está archivada: reactivala para usarla.');

function resumenApi(p: PlantillaFila): ResumenDePlantillaNutricional {
  const v = p.versiones[0];
  if (!v) throw new Error(`Plantilla ${p.id} sin versiones`);
  const estructura = v.estructura as unknown as EstructuraDePlanEntrada;
  return {
    templateId: p.id,
    versionId: v.id,
    versionNumber: v.numero,
    version: token(p.version),
    name: p.nombre,
    description: p.descripcion,
    state: p.estado === 'ACTIVA' ? 'ACTIVE' : 'ARCHIVED',
    copiedQuantities: v.cantidades === 'COPIADAS',
    origin: (v.origen as OrigenDePlantilla | null) ?? null,
    mealCount: comidasDeLaEstructura(estructura),
    createdAt: p.momentoDeRegistro.toISOString(),
    updatedAt: p.momentoDeActualizacion.toISOString(),
  };
}

function plantillaApi(p: PlantillaFila): PlantillaNutricional {
  const v = p.versiones[0];
  return { ...resumenApi(p), structure: (v?.estructura as unknown as EstructuraDePlanEntrada) ?? { dayTypes: [] }, items: {} };
}

/** Los `catalogItemId` que un contenido normalizado referencia (la misma regla que el servicio de planes). */
const idsDeCatalogo = (c: ReturnType<typeof normalizarEstructura>): string[] => c.dayTypes.flatMap((d) => d.meals.flatMap((m) => m.options.flatMap((o) => o.items.map((i) => i.catalogItemId))));
