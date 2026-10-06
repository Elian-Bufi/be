import { Injectable } from '@nestjs/common';
import type { ComidaHabitual as FilaDeComida, Prisma } from '@prisma/client';
import {
  CodigoDeError,
  CodigoDeProblemaDePlan,
  EditarHabitualRequestSchema,
  GuardarComidaHabitualRequestSchema,
  itemsDeLaComida,
  MarcarHabitualRequestSchema,
  nombreNormalizadoDeHabitual,
  normalizarEstructura,
  problemasDeBorrador,
  sinCantidadesDeLaComida,
  sinIdentificadoresDeComida,
  type ComidaEntrada,
  type ComidaHabitual,
  type ElementoDeCatalogo,
  type ElementoResuelto,
  type ValidationIssue,
} from '@be/domain';
import { randomUUID } from 'node:crypto';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { escribirCursor, leerConsultaDeLista } from '../http/paginacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { CatalogoService } from './catalogo.service';
import { EjecutorNutricional } from './ejecutor';
import { registrarEventoDeNutricion } from './eventos';
import { opcionesDeRecetaNoAdmitidas } from './opciones-de-receta';

type Tx = Prisma.TransactionClient;
const RECURSO_COMIDA = 'ComidaHabitual';
const RECURSO_ALIMENTO = 'AlimentoHabitual';
const CASO_DE_USO = 'UC-P10';
const token = (n: number): string => `v${n}`;
const UUID = /^[0-9a-f-]{36}$/i;
/** Tope de alimentos habituales que se devuelven: es una lista «a mano», no un catálogo. */
const TOPE_DE_ALIMENTOS = 200;
/** La comida se valida envuelta en un día tipo; los problemas se devuelven relativos a la comida. */
const PREFIJO_DE_ENVOLTURA = /^dayTypes\[0\]\.meals\[0\]\.?/;

type TipoDeEvento = 'AlimentoHabitualMarcado' | 'AlimentoHabitualQuitado' | 'ComidaHabitualGuardada' | 'ComidaHabitualEditada';

/**
 * PF-09 bis · DL-109 — «Mis habituales» de nutrición (API-HAN-01 a 05): los alimentos que el profesional marca para
 * tenerlos a mano arriba del buscador, y las comidas que guarda con nombre para insertarlas en cualquier borrador.
 * - Solo un profesional de Nutrición verificado y habilitado (un asesorado o un entrenador, 403); lo ajeno es 404
 *   neutral, sin distinguir inexistente de ajeno (DL-108 D-1).
 * - Una comida se valida como un ítem de borrador (forma y elementos del catálogo disponibles para este profesional)
 *   y se guarda **sin identificadores de nodo** (el plan asigna los suyos al insertarla, así se inserta dos veces) y
 *   **sin cantidades** salvo pedido (DL-108 D-2: la cantidad es de cada persona).
 * - Guardar con el nombre de otra comida habitual activa es 409, salvo que `replaces` la señale: entonces se reemplaza
 *   (D-2 de DL-109). Una quitada conserva su nombre: guardar con él la reactiva con el contenido nuevo; renombrar
 *   otra a ese nombre la libera (desaparece).
 * - Las filas son mutables (`version` es el token de concurrencia); la historia queda en los eventos del circuito.
 */
@Injectable()
export class HabitualesNutricionalesService {
  constructor(
    private readonly ejecutor: EjecutorNutricional,
    private readonly catalogo: CatalogoService,
  ) {}

  // ─── API-HAN-01 ──────────────────────────────────────────────────────────
  listarAlimentos(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<{ data: ElementoDeCatalogo[] }> {
    return this.ejecutor.leer({
      operacion: 'API-HAN-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await this.catalogo.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const marcas = await tx.alimentoHabitual.findMany({
          where: { profesionalId: actor.identidadId, estado: 'ACTIVO' },
          orderBy: [{ momentoDeActualizacion: 'desc' }, { id: 'desc' }],
          take: TOPE_DE_ALIMENTOS,
          select: { elementoId: true },
        });
        const vigentes = await this.catalogo.vigentes(tx, actor.identidadId, marcas.map((m) => m.elementoId));
        // Un elemento que dejó de estar disponible no figura; la marca queda, por si vuelve a estarlo.
        return {
          data: marcas.flatMap((m) => {
            const e = vigentes.get(m.elementoId);
            return e ? [e] : [];
          }),
        };
      },
    });
  }

  // ─── API-HAN-02 ──────────────────────────────────────────────────────────
  marcarAlimento(actor: ActorAutenticado, catalogItemId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'ElementoDeCatalogoNutricional', id: catalogItemId };
    return this.ejecutor.escribir({
      operacion: 'API-HAN-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: MarcarHabitualRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        const profesionalId = actor.identidadId;
        await this.catalogo.exigirProfesionalDeNutricion(tx, profesionalId);
        const marca = UUID.test(catalogItemId) ? await tx.alimentoHabitual.findUnique({ where: { profesionalId_elementoId: { profesionalId, elementoId: catalogItemId } } }) : null;
        const momento = await momentoDeLaBase(tx);
        if (pedido.state === 'MARKED') {
          // Solo se marca lo que este profesional puede prescribir hoy: la misma regla que un ítem del borrador.
          const disponibles = await this.catalogo.disponibles(tx, profesionalId, [catalogItemId]);
          if (!disponibles.has(catalogItemId)) throw new ErrorDeApi(422, CodigoDeError.CATALOG_REFERENCE_INVALID, 'Ese elemento del catálogo no está disponible para prescribir.', { issues: [{ code: CodigoDeProblemaDePlan.CATALOG_REFERENCE_INVALID, path: 'catalogItemId' }] });
          // Idempotente también a la vez: la inserción ignora el duplicado y cada transición se condiciona al estado.
          if (!marca) {
            const id = randomUUID();
            const creada = await tx.alimentoHabitual.createMany({ data: [{ id, profesionalId, elementoId: catalogItemId, momentoDeActualizacion: momento }], skipDuplicates: true });
            if (creada.count === 1) await this.evento(tx, 'AlimentoHabitualMarcado', profesionalId, { tipo: RECURSO_ALIMENTO, id }, null, 'ACTIVO', procedencia, momento);
          } else if (marca.estado !== 'ACTIVO') {
            const r = await tx.alimentoHabitual.updateMany({ where: { id: marca.id, estado: 'QUITADO' }, data: { estado: 'ACTIVO', momentoDeActualizacion: momento } });
            if (r.count === 1) await this.evento(tx, 'AlimentoHabitualMarcado', profesionalId, { tipo: RECURSO_ALIMENTO, id: marca.id }, 'QUITADO', 'ACTIVO', procedencia, momento);
          }
        } else if (marca && marca.estado === 'ACTIVO') {
          const r = await tx.alimentoHabitual.updateMany({ where: { id: marca.id, estado: 'ACTIVO' }, data: { estado: 'QUITADO', momentoDeActualizacion: momento } });
          if (r.count === 1) await this.evento(tx, 'AlimentoHabitualQuitado', profesionalId, { tipo: RECURSO_ALIMENTO, id: marca.id }, 'ACTIVO', 'QUITADO', procedencia, momento);
        }
        // Marcar lo ya marcado o quitar lo que nunca se marcó no cambia nada: la respuesta es la misma (idempotente).
        return { estadoHttp: 200, cuerpo: { data: { catalogItemId, state: pedido.state } }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-HAN-03 ──────────────────────────────────────────────────────────
  listarComidas(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: ComidaHabitual[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-HAN-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await this.catalogo.exigirProfesionalDeNutricion(tx, actor.identidadId);
        const cursor = consulta.cursor;
        // La que se guardó o reemplazó más recientemente, primero (keyset por momento de actualización e id).
        const filas = await tx.comidaHabitual.findMany({
          where: {
            profesionalId: actor.identidadId,
            estado: 'ACTIVO',
            ...(cursor ? { OR: [{ momentoDeActualizacion: { lt: cursor.momento } }, { momentoDeActualizacion: cursor.momento, id: { lt: cursor.id } }] } : {}),
          },
          orderBy: [{ momentoDeActualizacion: 'desc' }, { id: 'desc' }],
          take: consulta.limit + 1,
        });
        const hayMas = filas.length > consulta.limit;
        const pagina = hayMas ? filas.slice(0, consulta.limit) : filas;
        const ultima = pagina[pagina.length - 1];
        return {
          data: await this.conElementos(tx, actor.identidadId, pagina),
          page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeActualizacion, ultima.id) : null, hasMore: hayMas },
        };
      },
    });
  }

  // ─── API-HAN-04 ──────────────────────────────────────────────────────────
  guardarComida(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-HAN-04',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: GuardarComidaHabitualRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        const profesionalId = actor.identidadId;
        await this.catalogo.exigirProfesionalDeNutricion(tx, profesionalId);
        const reemplazada = pedido.replaces !== undefined ? await this.propia(tx, profesionalId, pedido.replaces) : null;
        if (pedido.replaces !== undefined && !reemplazada) {
          throw this.ejecutor.noRevelable({ operacion: 'API-HAN-04', actorId: profesionalId, recurso: { tipo: RECURSO_COMIDA, id: pedido.replaces } }, ctx);
        }
        const estructura = await this.comidaVerificada(tx, profesionalId, pedido.structure, pedido.copyQuantities === true);
        const nombreNormalizado = nombreNormalizadoDeHabitual(pedido.name);
        const quitadaConElNombre = await this.nombreLibre(tx, profesionalId, nombreNormalizado, reemplazada?.id ?? null);
        const momento = await momentoDeLaBase(tx);
        const datos: Prisma.ComidaHabitualUncheckedCreateInput = {
          profesionalId,
          nombre: pedido.name,
          nombreNormalizado,
          estructura: estructura as unknown as Prisma.InputJsonValue,
          cantidades: pedido.copyQuantities === true ? 'COPIADAS' : 'NO_COPIADAS',
          procedencia: procedencia as unknown as Prisma.InputJsonValue,
          momentoDeActualizacion: momento,
        };
        let fila: FilaDeComida;
        if (reemplazada) {
          // D-2 de DL-109: el profesional pidió reemplazar esa comida; una quitada que tuviera el nombre nuevo lo libera.
          if (quitadaConElNombre) await this.liberarNombre(tx, quitadaConElNombre);
          fila = await sinDuplicar(tx.comidaHabitual.update({ where: { id: reemplazada.id }, data: { ...datos, estado: 'ACTIVO', version: { increment: 1 } } }), nombreTomado);
          await this.evento(tx, 'ComidaHabitualGuardada', profesionalId, { tipo: RECURSO_COMIDA, id: fila.id }, 'ACTIVO', 'ACTIVO', procedencia, momento);
        } else if (quitadaConElNombre) {
          // El nombre era de una comida quitada: vuelve, con el contenido nuevo.
          fila = await sinDuplicar(tx.comidaHabitual.update({ where: { id: quitadaConElNombre.id }, data: { ...datos, estado: 'ACTIVO', version: { increment: 1 } } }), nombreTomado);
          await this.evento(tx, 'ComidaHabitualGuardada', profesionalId, { tipo: RECURSO_COMIDA, id: fila.id }, 'QUITADO', 'ACTIVO', procedencia, momento);
        } else {
          // Dos guardados simultáneos con el mismo nombre nuevo: la base deja pasar uno; el otro recibe el 409 que el
          // website convierte en «Reemplazar».
          fila = await sinDuplicar(tx.comidaHabitual.create({ data: datos }), nombreTomado);
          await this.evento(tx, 'ComidaHabitualGuardada', profesionalId, { tipo: RECURSO_COMIDA, id: fila.id }, null, 'ACTIVO', procedencia, momento);
        }
        return { estadoHttp: 201, cuerpo: { data: await this.leer(tx, profesionalId, fila.id) }, sujetoId: null, recurso: { tipo: RECURSO_COMIDA, id: fila.id } };
      },
    });
  }

  // ─── API-HAN-05 ──────────────────────────────────────────────────────────
  editarComida(actor: ActorAutenticado, presetId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_COMIDA, id: presetId };
    return this.ejecutor.escribir({
      operacion: 'API-HAN-05',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: EditarHabitualRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        const profesionalId = actor.identidadId;
        await this.catalogo.exigirProfesionalDeNutricion(tx, profesionalId);
        const fila = await this.propia(tx, profesionalId, presetId);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-HAN-05', actorId: profesionalId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        let nombre: Partial<{ nombre: string; nombreNormalizado: string }> = {};
        if (pedido.name !== undefined) {
          const nombreNormalizado = nombreNormalizadoDeHabitual(pedido.name);
          const quitadaConElNombre = await this.nombreLibre(tx, profesionalId, nombreNormalizado, fila.id);
          if (quitadaConElNombre) await this.liberarNombre(tx, quitadaConElNombre);
          nombre = { nombre: pedido.name, nombreNormalizado };
        }
        const momento = await momentoDeLaBase(tx);
        const estado = pedido.state === 'REMOVED' ? 'QUITADO' : fila.estado;
        // Condicionado a la versión leída: dos ediciones simultáneas con la misma versión esperada no se pisan (409).
        const r = await sinDuplicar(tx.comidaHabitual.updateMany({ where: { id: fila.id, version: fila.version }, data: { ...nombre, estado, version: { increment: 1 }, momentoDeActualizacion: momento } }), nombreTomado);
        if (r.count === 0) throw errores.conflictoDeVersion();
        await this.evento(tx, 'ComidaHabitualEditada', profesionalId, recurso, fila.estado, estado, procedencia, momento);
        return { estadoHttp: 200, cuerpo: { data: await this.leer(tx, profesionalId, fila.id) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── Apoyo ───────────────────────────────────────────────────────────────

  /** Una comida habitual propia y activa; una quitada, ajena o inexistente es `null` (404 neutral). */
  private propia(tx: Tx, profesionalId: string, presetId: string): Promise<FilaDeComida | null> {
    if (!UUID.test(presetId)) return Promise.resolve(null);
    return tx.comidaHabitual.findFirst({ where: { id: presetId, profesionalId, estado: 'ACTIVO' } });
  }

  /** La lectura que devuelve toda escritura, también de la recién quitada. */
  private async leer(tx: Tx, profesionalId: string, presetId: string): Promise<ComidaHabitual> {
    const fila = await tx.comidaHabitual.findFirst({ where: { id: presetId, profesionalId } });
    if (!fila) throw errores.recursoNoEncontrado();
    const [comida] = await this.conElementos(tx, profesionalId, [fila]);
    if (!comida) throw errores.recursoNoEncontrado();
    return comida;
  }

  /** Cada comida con el nombre vigente de sus elementos del catálogo y su disponibilidad para este profesional. */
  private async conElementos(tx: Tx, profesionalId: string, filas: readonly FilaDeComida[]): Promise<ComidaHabitual[]> {
    const ids = [...new Set(filas.flatMap((f) => idsDeLaComida(estructuraDe(f))))];
    const disponibles = ids.length > 0 ? await this.catalogo.disponibles(tx, profesionalId, ids) : new Map<string, ElementoResuelto>();
    return filas.map((f) => comidaApi(f, disponibles));
  }

  /**
   * Valida como un ítem de borrador (forma, modalidad y elementos disponibles para este profesional) y devuelve la
   * comida que se guarda: sin identificadores de nodo, y sin cantidades salvo pedido.
   */
  private async comidaVerificada(tx: Tx, profesionalId: string, entrada: ComidaEntrada, conCantidades: boolean): Promise<ComidaEntrada> {
    // DL-119: una comida habitual no lleva opciones de receta (la porción se arma en el plan): se rechaza, no se descarta.
    const conReceta = opcionesDeRecetaNoAdmitidas([{ options: entrada.options, ruta: 'structure' }]);
    if (conReceta.length > 0) throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'Una comida habitual no lleva opciones de receta: agregá la receta en el plan.', { issues: conReceta });
    const base = sinIdentificadoresDeComida(entrada);
    const guardar = conCantidades ? base : sinCantidadesDeLaComida(base);
    const contenido = normalizarEstructura({ dayTypes: [{ label: 'Habitual', meals: [guardar] }] }, randomUUID);
    const disponibles = await this.catalogo.disponibles(tx, profesionalId, idsDeLaComida(guardar));
    const problemas: ValidationIssue[] = problemasDeBorrador(contenido, new Set(disponibles.keys())).map((p) => ({ ...p, path: (p.path ?? '').replace(PREFIJO_DE_ENVOLTURA, '') || 'structure' }));
    if (problemas.length > 0) {
      // El mismo código principal que un borrador (API-NUT-07/10): modalidad, referencia del catálogo o forma.
      const codigo = problemas.some((p) => p.code === 'EXCHANGE_MODE_NOT_AVAILABLE')
        ? CodigoDeError.EXCHANGE_MODE_NOT_AVAILABLE
        : problemas.some((p) => p.code === 'CATALOG_REFERENCE_INVALID')
          ? CodigoDeError.CATALOG_REFERENCE_INVALID
          : CodigoDeError.NUTRITION_PLAN_STRUCTURE_INVALID;
      throw new ErrorDeApi(422, codigo, 'Hay elementos de la comida que no se pueden guardar.', { issues: problemas });
    }
    return guardar;
  }

  /**
   * 409 si otra comida habitual **activa** de este profesional tiene ese nombre (salvo la que se está editando o
   * reemplazando). Devuelve la **quitada** que lo tenga, si hay una: quien llama decide si vuelve o si la libera.
   */
  /** Una comida QUITADA cede su nombre sin borrarse (DL-109: la historia queda): el nombre normalizado se corre con su id. */
  private async liberarNombre(tx: Tx, quitada: FilaDeComida): Promise<void> {
    await tx.comidaHabitual.update({ where: { id: quitada.id }, data: { nombreNormalizado: `${quitada.nombreNormalizado}\u001f${quitada.id}` } });
  }

  private async nombreLibre(tx: Tx, profesionalId: string, nombreNormalizado: string, salvoId: string | null): Promise<FilaDeComida | null> {
    const existente = await tx.comidaHabitual.findUnique({ where: { profesionalId_nombreNormalizado: { profesionalId, nombreNormalizado } } });
    if (!existente || existente.id === salvoId) return null;
    if (existente.estado === 'ACTIVO') throw nombreTomado();
    return existente;
  }

  private evento(tx: Tx, tipo: TipoDeEvento, actorId: string, recurso: { tipo: string; id: string }, estadoPrevio: string | null, estadoPosterior: string | null, procedencia: unknown, momento: Date): Promise<void> {
    return registrarEventoDeNutricion(tx, {
      tipo,
      profesionalId: actorId,
      asesoradoId: null,
      recurso,
      estadoPrevio,
      estadoPosterior,
      actorId,
      procedencia: procedencia as Parameters<typeof registrarEventoDeNutricion>[1]['procedencia'],
      momento,
    });
  }
}

const estructuraDe = (f: FilaDeComida): ComidaEntrada => f.estructura as unknown as ComidaEntrada;
/** Los `catalogItemId` que una comida referencia (la misma regla que el servicio de planes, para una sola comida). */
const idsDeLaComida = (m: ComidaEntrada): string[] => m.options.flatMap((o) => o.items.map((i) => i.catalogItemId));

function comidaApi(f: FilaDeComida, disponibles: ReadonlyMap<string, ElementoResuelto>): ComidaHabitual {
  const estructura = estructuraDe(f);
  const items: ComidaHabitual['items'] = {};
  for (const id of new Set(idsDeLaComida(estructura))) {
    const e = disponibles.get(id);
    if (e) items[id] = { name: e.name, available: true };
  }
  return {
    presetId: f.id,
    version: token(f.version),
    name: f.nombre,
    copiedQuantities: f.cantidades === 'COPIADAS',
    itemCount: itemsDeLaComida(estructura),
    structure: estructura,
    items,
    createdAt: f.momentoDeRegistro.toISOString(),
    updatedAt: f.momentoDeActualizacion.toISOString(),
  };
}

const nombreTomado = (): ErrorDeApi => new ErrorDeApi(409, CodigoDeError.PRESET_NAME_TAKEN, 'Ya tenés una comida habitual con ese nombre.');
