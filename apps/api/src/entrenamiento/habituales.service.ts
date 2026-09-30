import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  CodigoDeError,
  EditarHabitualRequestSchema,
  GuardarSesionHabitualRequestSchema,
  MarcarHabitualRequestSchema,
  nombreNormalizadoDeHabitual,
  normalizarEstructuraDeEntrenamiento,
  problemasDeReferencias,
  referenciasDeEjercicio,
  sinCargasDeLaSesion,
  sinIdentificadoresDeSesion,
  type EjercicioCitable,
  type EjercicioDeCatalogo,
  type EstadoDeMarca,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type SesionEntrada,
  type SesionHabitual,
  type ValidationIssue,
} from '@be/domain';
import { randomUUID } from 'node:crypto';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import { escribirCursor, leerConsultaDeLista } from '../http/paginacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase, sinDuplicar } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { CatalogoDeEjerciciosService } from './catalogo.service';
import { EjecutorDeEntrenamiento, esUuid } from './ejecutor';
import { registrarEventoDeEntrenamiento } from './eventos';
import { ejercicioApi, type FilaDeEjercicio } from './lectura-entrenamiento';

type Tx = Prisma.TransactionClient;
type SesionFila = Prisma.SesionHabitualGetPayload<Record<string, never>>;
type EstadoDeHabitual = SesionFila['estado'];
type TipoDeEvento = 'EjercicioHabitualMarcado' | 'EjercicioHabitualQuitado' | 'SesionHabitualGuardada' | 'SesionHabitualEditada';

const RECURSO_EJERCICIO = 'EjercicioHabitual';
const RECURSO_SESION = 'SesionHabitual';
const CASO_DE_USO = 'UC-P15';
const TOPE_DE_EJERCICIOS = 200;
const token = (n: number): string => `v${n}`;
/** Prefijo con el que la sesión se envuelve para validarla como parte de un plan; se quita de las rutas de los problemas. */
const PREFIJO_DE_ENVOLTURA = /^blocks\[0\]\.sessions\[0\]\.?/;

/**
 * DL-109 — «Mis habituales» de entrenamiento (API-HAB-01 a 05).
 * - **Ejercicios habituales**: una marca por profesional y ejercicio del catálogo (estable, no por versión): la lista
 *   resuelve cada uno a su versión vigente con la misma forma que el buscador (API-TRN-13) y omite los que ya no están
 *   disponibles para este profesional. Marcar y quitar es una sola operación, naturalmente idempotente.
 * - **Sesiones habituales**: una sesión de entrada validada como parte de un plan (forma, criterios de intensidad,
 *   referencias del catálogo), guardada **sin identificadores de nodo** (el borrador asigna los suyos al insertarla,
 *   así puede entrar dos veces) y sin cargas sugeridas salvo pedido (DL-108 D-2). Nombre único por profesional:
 *   guardar con el mismo nombre reemplaza (D-2 de DL-109) cuando el pedido lo señala con `replaces`; sin señalarlo,
 *   409 para que el website avise. Un habitual quitado no se lista y su nombre queda libre: volver a guardarlo lo
 *   reactiva. Filas mutables; la historia está en los eventos.
 * - Solo un profesional de Entrenamiento verificado y habilitado (misma regla que el catálogo propio, RF-037); lo
 *   ajeno responde 404, sin distinguirlo de lo inexistente.
 */
@Injectable()
export class HabitualesDeEntrenamientoService {
  constructor(
    private readonly ejecutor: EjecutorDeEntrenamiento,
    private readonly catalogo: CatalogoDeEjerciciosService,
  ) {}

  // ─── API-HAB-01 ──────────────────────────────────────────────────────────
  listarEjercicios(actor: ActorAutenticado, ctx: ContextoDeSolicitud): Promise<{ data: EjercicioDeCatalogo[] }> {
    return this.ejecutor.leer({
      operacion: 'API-HAB-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await this.exigirProfesional(tx, actor.identidadId);
        const marcas = await tx.ejercicioHabitual.findMany({
          where: { profesionalId: actor.identidadId, estado: 'ACTIVO' },
          orderBy: [{ momentoDeActualizacion: 'desc' }, { id: 'desc' }],
          take: TOPE_DE_EJERCICIOS,
          select: { ejercicioId: true },
        });
        const vigentes = await this.versionesVigentes(tx, actor.identidadId, marcas.map((m) => m.ejercicioId));
        return {
          data: marcas.flatMap((m) => {
            const fila = vigentes.get(m.ejercicioId);
            return fila && fila.disponible ? [ejercicioApi(fila)] : [];
          }),
        };
      },
    });
  }

  // ─── API-HAB-02 ──────────────────────────────────────────────────────────
  marcarEjercicio(actor: ActorAutenticado, exerciseId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'EjercicioDeCatalogo', id: exerciseId };
    return this.ejecutor.escribir({
      operacion: 'API-HAB-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: MarcarHabitualRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        await this.exigirProfesional(tx, actor.identidadId);
        const existente = esUuid(exerciseId) ? await tx.ejercicioHabitual.findUnique({ where: { profesionalId_ejercicioId: { profesionalId: actor.identidadId, ejercicioId: exerciseId } } }) : null;
        const momento = await momentoDeLaBase(tx);
        if (pedido.state === 'MARKED') {
          // Solo se marca lo que este profesional puede prescribir hoy: lo sembrado y lo propio, disponible.
          const vigente = esUuid(exerciseId) ? (await this.versionesVigentes(tx, actor.identidadId, [exerciseId])).get(exerciseId) : undefined;
          if (!vigente || !vigente.disponible) {
            throw new ErrorDeApi(422, CodigoDeError.EXERCISE_REFERENCE_INVALID, 'Ese ejercicio no está disponible para marcarlo como habitual.', { issues: [{ code: 'EXERCISE_NOT_AVAILABLE', path: 'exerciseId' }] });
          }
          // Marcar es idempotente también a la vez (dos clics, dos pestañas): la inserción ignora el duplicado y cada
          // transición se condiciona al estado, así el evento queda una sola vez y nadie recibe un error.
          if (!existente) {
            const id = randomUUID();
            const creada = await tx.ejercicioHabitual.createMany({ data: [{ id, profesionalId: actor.identidadId, ejercicioId: exerciseId, momentoDeActualizacion: momento }], skipDuplicates: true });
            if (creada.count === 1) await this.evento(tx, 'EjercicioHabitualMarcado', actor.identidadId, { tipo: RECURSO_EJERCICIO, id }, null, 'ACTIVO', procedencia, momento);
          } else if (existente.estado === 'QUITADO') {
            const r = await tx.ejercicioHabitual.updateMany({ where: { id: existente.id, estado: 'QUITADO' }, data: { estado: 'ACTIVO', momentoDeActualizacion: momento } });
            if (r.count === 1) await this.evento(tx, 'EjercicioHabitualMarcado', actor.identidadId, { tipo: RECURSO_EJERCICIO, id: existente.id }, 'QUITADO', 'ACTIVO', procedencia, momento);
          }
        } else if (existente && existente.estado === 'ACTIVO') {
          const r = await tx.ejercicioHabitual.updateMany({ where: { id: existente.id, estado: 'ACTIVO' }, data: { estado: 'QUITADO', momentoDeActualizacion: momento } });
          if (r.count === 1) await this.evento(tx, 'EjercicioHabitualQuitado', actor.identidadId, { tipo: RECURSO_EJERCICIO, id: existente.id }, 'ACTIVO', 'QUITADO', procedencia, momento);
        }
        const data: { exerciseId: string; state: EstadoDeMarca } = { exerciseId, state: pedido.state };
        return { estadoHttp: 200, cuerpo: { data }, sujetoId: null, recurso };
      },
    });
  }

  // ─── API-HAB-03 ──────────────────────────────────────────────────────────
  listarSesiones(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<{ data: SesionHabitual[]; page: unknown }> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-HAB-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await this.exigirProfesional(tx, actor.identidadId);
        // Orden: la última guardada o reemplazada primero (el cursor va sobre la actualización, no sobre el alta).
        const filas = await tx.sesionHabitual.findMany({
          where: {
            profesionalId: actor.identidadId,
            estado: 'ACTIVO',
            ...(consulta.cursor ? { OR: [{ momentoDeActualizacion: { lt: consulta.cursor.momento } }, { momentoDeActualizacion: consulta.cursor.momento, id: { lt: consulta.cursor.id } }] } : {}),
          },
          orderBy: [{ momentoDeActualizacion: 'desc' }, { id: 'desc' }],
          take: consulta.limit + 1,
        });
        const hayMas = filas.length > consulta.limit;
        const pagina = hayMas ? filas.slice(0, consulta.limit) : filas;
        const ultima = pagina[pagina.length - 1];
        return {
          data: await this.conEjercicios(tx, actor.identidadId, pagina),
          page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeActualizacion, ultima.id) : null, hasMore: hayMas },
        };
      },
    });
  }

  // ─── API-HAB-04 ──────────────────────────────────────────────────────────
  guardarSesion(actor: ActorAutenticado, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-HAB-04',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      clave,
      esquema: GuardarSesionHabitualRequestSchema,
      cuerpo,
      huellaExtra: {},
      efecto: async (tx, pedido, procedencia) => {
        await this.exigirProfesional(tx, actor.identidadId);
        const conCargas = pedido.copySuggestedLoads === true;
        const sesion = await this.sesionVerificada(tx, actor.identidadId, pedido.structure, conCargas);
        const nombreNormalizado = nombreNormalizadoDeHabitual(pedido.name);
        // A quién reemplaza: la señalada con `replaces` (propia y activa; si no, 404 neutral) o, sin señalar, una
        // quitada con el mismo nombre (se reactiva). Un nombre en uso por otra activa es 409: el website avisa y
        // vuelve con `replaces`.
        const senalada = pedido.replaces !== undefined ? await this.propia(tx, actor.identidadId, pedido.replaces, false) : null;
        if (pedido.replaces !== undefined && !senalada) throw this.ejecutor.noRevelable({ operacion: 'API-HAB-04', actorId: actor.identidadId, recurso: { tipo: RECURSO_SESION, id: pedido.replaces } }, ctx);
        const homonima = await tx.sesionHabitual.findUnique({ where: { profesionalId_nombreNormalizado: { profesionalId: actor.identidadId, nombreNormalizado } } });
        if (homonima && homonima.estado === 'ACTIVO' && homonima.id !== senalada?.id) throw nombreTomado();
        const destino = senalada ?? (homonima && homonima.estado === 'QUITADO' ? homonima : null);
        if (senalada && homonima && homonima.id !== senalada.id) await this.liberarNombre(tx, homonima);
        const momento = await momentoDeLaBase(tx);
        const datos = {
          nombre: pedido.name,
          nombreNormalizado,
          estructura: sesion as unknown as Prisma.InputJsonValue,
          cargas: conCargas ? ('COPIADAS' as const) : ('NO_COPIADAS' as const),
          procedencia: procedencia as unknown as Prisma.InputJsonValue,
          momentoDeActualizacion: momento,
        };
        let id: string;
        let estadoPrevio: EstadoDeHabitual | null;
        if (destino) {
          await sinDuplicar(tx.sesionHabitual.update({ where: { id: destino.id }, data: { ...datos, estado: 'ACTIVO', version: { increment: 1 } } }), nombreTomado);
          id = destino.id;
          estadoPrevio = destino.estado;
        } else {
          // Dos guardados simultáneos con el mismo nombre nuevo: la base deja pasar uno; el otro recibe el 409 que el
          // website convierte en «Reemplazar».
          id = (await sinDuplicar(tx.sesionHabitual.create({ data: { profesionalId: actor.identidadId, ...datos } }), nombreTomado)).id;
          estadoPrevio = null;
        }
        await this.evento(tx, 'SesionHabitualGuardada', actor.identidadId, { tipo: RECURSO_SESION, id }, estadoPrevio, 'ACTIVO', procedencia, momento);
        return { estadoHttp: 201, cuerpo: { data: await this.leer(tx, actor.identidadId, id) }, sujetoId: null, recurso: { tipo: RECURSO_SESION, id } };
      },
    });
  }

  // ─── API-HAB-05 ──────────────────────────────────────────────────────────
  editarSesion(actor: ActorAutenticado, presetId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO_SESION, id: presetId };
    return this.ejecutor.escribir({
      operacion: 'API-HAB-05',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      esquema: EditarHabitualRequestSchema,
      cuerpo,
      efecto: async (tx, pedido, procedencia) => {
        await this.exigirProfesional(tx, actor.identidadId);
        const fila = await this.propia(tx, actor.identidadId, presetId, false);
        if (!fila) throw this.ejecutor.noRevelable({ operacion: 'API-HAB-05', actorId: actor.identidadId, recurso }, ctx);
        if (pedido.expectedVersion !== token(fila.version)) throw errores.conflictoDeVersion();
        let nombre: { nombre: string; nombreNormalizado: string } | null = null;
        if (pedido.name !== undefined) {
          const nombreNormalizado = nombreNormalizadoDeHabitual(pedido.name);
          const homonima = await tx.sesionHabitual.findUnique({ where: { profesionalId_nombreNormalizado: { profesionalId: actor.identidadId, nombreNormalizado } } });
          if (homonima && homonima.id !== fila.id) {
            if (homonima.estado === 'ACTIVO') throw nombreTomado();
            await this.liberarNombre(tx, homonima);
          }
          nombre = { nombre: pedido.name, nombreNormalizado };
        }
        const momento = await momentoDeLaBase(tx);
        const quitar = pedido.state === 'REMOVED';
        // Condicionado a la versión leída: dos ediciones simultáneas con la misma versión esperada no se pisan (409).
        const r = await sinDuplicar(
          tx.sesionHabitual.updateMany({
            where: { id: fila.id, version: fila.version },
            data: { ...(nombre ?? {}), ...(quitar ? { estado: 'QUITADO' as const } : {}), version: { increment: 1 }, momentoDeActualizacion: momento },
          }),
          nombreTomado,
        );
        if (r.count === 0) throw errores.conflictoDeVersion();
        await this.evento(tx, 'SesionHabitualEditada', actor.identidadId, recurso, fila.estado, quitar ? 'QUITADO' : fila.estado, procedencia, momento);
        return { estadoHttp: 200, cuerpo: { data: await this.leer(tx, actor.identidadId, fila.id) }, sujetoId: null, recurso };
      },
    });
  }

  // ─── Apoyo ───────────────────────────────────────────────────────────────

  /** Solo un profesional de Entrenamiento verificado y habilitado (la misma regla que el catálogo propio, RF-037). */
  private async exigirProfesional(tx: Tx, identidadId: string): Promise<void> {
    if (!(await this.catalogo.esProfesionalDeEntrenamiento(tx, identidadId))) throw errores.accionNoPermitida();
  }

  /**
   * La versión vigente (la terminal de la cadena) de cada ejercicio, entre los que este profesional puede citar: lo
   * sembrado y lo propio (cargado a mano o importado por él). Un ejercicio fuera de su ámbito no figura.
   */
  private async versionesVigentes(tx: Tx, profesionalId: string, ejercicioIds: readonly string[]): Promise<Map<string, FilaDeEjercicio>> {
    const validos = [...new Set(ejercicioIds)].filter(esUuid);
    if (validos.length === 0) return new Map();
    const filas = await tx.$queryRaw<FilaDeEjercicio[]>`
      SELECT e."id"::text AS "ejercicioId", v."id"::text AS "versionId", v."nombre", (v."disponibilidad" = 'DISPONIBLE') AS "disponible",
             e."procedencia"::text AS "procedencia", e."creado_por_id"::text AS "creadoPorId", v."momento_de_registro" AS "momentoDeRegistro",
             v."procedencia" -> 'fuenteExterna' AS "fuenteExterna"
        FROM "version_de_ejercicio" v
        JOIN "ejercicio_de_catalogo" e ON e."id" = v."ejercicio_id"
       WHERE e."id" = ANY(${validos}::uuid[])
         AND NOT EXISTS (SELECT 1 FROM "version_de_ejercicio" s WHERE s."predecesora_id" = v."id")
         AND (e."procedencia" = 'BE_SYNTHETIC_SEED' OR e."creado_por_id" = ${profesionalId}::uuid)`;
    return new Map(filas.map((f) => [f.ejercicioId, f]));
  }

  /** Una sesión habitual propia; por defecto solo activa (una quitada dejó de existir para el profesional). */
  private propia(tx: Tx, profesionalId: string, presetId: string, incluirQuitadas: boolean): Promise<SesionFila | null> {
    if (!esUuid(presetId)) return Promise.resolve(null);
    return tx.sesionHabitual.findFirst({ where: { id: presetId, profesionalId, ...(incluirQuitadas ? {} : { estado: 'ACTIVO' }) } });
  }

  private async leer(tx: Tx, profesionalId: string, presetId: string): Promise<SesionHabitual> {
    const fila = await this.propia(tx, profesionalId, presetId, true);
    if (!fila) throw errores.recursoNoEncontrado();
    const [sesion] = await this.conEjercicios(tx, profesionalId, [fila]);
    if (!sesion) throw errores.recursoNoEncontrado();
    return sesion;
  }

  /** Las filas como API, con el nombre vigente de cada ejercicio citado (una sola consulta al catálogo por página). */
  private async conEjercicios(tx: Tx, profesionalId: string, filas: readonly SesionFila[]): Promise<SesionHabitual[]> {
    const base = filas.map(sesionApi);
    const referencias = [...new Set(base.flatMap((s) => s.structure.prescriptions.map((p) => p.exerciseVersionId)))];
    const citables = referencias.length > 0 ? await this.catalogo.citables(tx, profesionalId, 'PROFESIONAL', referencias) : new Map<string, FilaDeEjercicio>();
    return base.map((s) => {
      const exercises: SesionHabitual['exercises'] = {};
      for (const p of s.structure.prescriptions) {
        const e = citables.get(p.exerciseVersionId);
        if (e) exercises[p.exerciseVersionId] = { exerciseId: e.ejercicioId, exerciseName: e.nombre, available: e.disponible };
      }
      return { ...s, exercises };
    });
  }

  /**
   * Valida la sesión como parte de un plan (forma, criterios de intensidad, referencias del catálogo disponibles para
   * este profesional) y devuelve la que se guarda: sin identificadores de nodo y sin cargas sugeridas salvo pedido.
   */
  private async sesionVerificada(tx: Tx, profesionalId: string, entrada: SesionEntrada, conCargas: boolean): Promise<SesionEntrada> {
    const guardar = sinIdentificadoresDeSesion(conCargas ? entrada : sinCargasDeLaSesion(entrada));
    const envoltura: EstructuraDePlanDeEntrenamientoEntrada = { blocks: [{ label: 'Habitual', sessions: [guardar] }] };
    const r = normalizarEstructuraDeEntrenamiento(envoltura, randomUUID);
    if (!r.ok) {
      const codigo = r.tipo === 'ESTRUCTURA' ? CodigoDeError.TRAINING_PLAN_STRUCTURE_INVALID : CodigoDeError.INTENSITY_CRITERION_INVALID;
      throw new ErrorDeApi(422, codigo, 'Hay elementos de la sesión que no se pueden guardar.', { issues: sinEnvoltura(r.issues) });
    }
    const catalogo = await this.catalogo.citables(tx, profesionalId, 'PROFESIONAL', referenciasDeEjercicio(r.contenido));
    const referencias = problemasDeReferencias(r.contenido, aCitables(catalogo));
    if (referencias.length > 0) throw new ErrorDeApi(422, CodigoDeError.EXERCISE_REFERENCE_INVALID, 'Hay ejercicios que no se pueden usar en la sesión.', { issues: sinEnvoltura(referencias) });
    return guardar;
  }

  /**
   * Una quitada que todavía ocupa el nombre que otra va a tomar: se le corre el nombre normalizado (con un separador
   * que ningún nombre normalizado lleva) para que la unicidad no la cuente. No se lista, así que no se nota.
   */
  private async liberarNombre(tx: Tx, quitada: SesionFila): Promise<void> {
    await tx.sesionHabitual.update({ where: { id: quitada.id }, data: { nombreNormalizado: `${quitada.nombreNormalizado}\u001f${quitada.id}` } });
  }

  private evento(tx: Tx, tipo: TipoDeEvento, actorId: string, recurso: { tipo: string; id: string }, estadoPrevio: EstadoDeHabitual | null, estadoPosterior: EstadoDeHabitual, procedencia: unknown, momento: Date): Promise<void> {
    return registrarEventoDeEntrenamiento(tx, {
      tipo,
      profesionalId: actorId,
      asesoradoId: null,
      recurso,
      estadoPrevio,
      estadoPosterior,
      actorId,
      procedencia: procedencia as Parameters<typeof registrarEventoDeEntrenamiento>[1]['procedencia'],
      momento,
    });
  }
}

const nombreTomado = (): ErrorDeApi => new ErrorDeApi(409, CodigoDeError.PRESET_NAME_TAKEN, 'Ya tenés una sesión habitual con ese nombre.');

/** Las rutas de los problemas, relativas a la sesión (sin el bloque de envoltura). */
const sinEnvoltura = (issues: readonly ValidationIssue[]): ValidationIssue[] => issues.map((i) => ({ ...i, path: i.path.replace(PREFIJO_DE_ENVOLTURA, '') }));

function sesionApi(f: SesionFila): SesionHabitual {
  const estructura = f.estructura as unknown as SesionEntrada;
  return {
    presetId: f.id,
    version: token(f.version),
    name: f.nombre,
    copiedLoads: f.cargas === 'COPIADAS',
    prescriptionCount: estructura.prescriptions.length,
    structure: estructura,
    exercises: {},
    createdAt: f.momentoDeRegistro.toISOString(),
    updatedAt: f.momentoDeActualizacion.toISOString(),
  };
}

/** Las filas del catálogo como citables (la misma conversión que usa el servicio de planes). */
function aCitables(filas: ReadonlyMap<string, { ejercicioId: string; nombre: string; disponible: boolean }>): Map<string, EjercicioCitable> {
  return new Map([...filas].map(([k, f]) => [k, { ejercicioId: f.ejercicioId, nombre: f.nombre, disponible: f.disponible }]));
}
