import { Injectable } from '@nestjs/common';
import {
  AgregarNotaPropiaRequestSchema,
  claveDeLaComida,
  CodigoDeError,
  CuerpoVacioSchema,
  evaluarAutorizacion,
  TOPE_DE_NOTAS_PROPIAS,
  type Alcance,
  type AnclaDeNotaPropia,
  type ListaDeNotasPropiasDelProfesionalResponse,
  type NotaPropia,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { CatalogoDeEjerciciosService } from '../entrenamiento/catalogo.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorDeNotasPropias, esUuid } from './ejecutor';

type Tx = Prisma.TransactionClient;

const CASO_DE_USO = 'PG-16';
const RECURSO = 'NotaPropia';
/** Una nota sin ancla no es de un área: se decide con la primera que el PDP permita, en este orden (PG-T71). */
const AREAS: readonly Alcance[] = ['ENTRENAMIENTO', 'NUTRICION', 'ANTROPOMETRIA'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lo que se lee de una nota: su archivo, si lo tiene. */
const INCLUIR = { archivo: { select: { momentoDeRegistro: true } } } as const satisfies Prisma.NotaPropiaInclude;
type FilaDeNota = Prisma.NotaPropiaGetPayload<{ include: typeof INCLUIR }>;

/**
 * PG-T68: lo que hay hoy en la última versión de cada plan del autor con esa persona (la que prepara o, si no hay, la
 * vigente; nunca una descartada): los ejercicios del catálogo de su plan de Entrenamiento y los nombres de las comidas del
 * de Nutrición. `null`: el autor no tiene un plan de esa área con ella.
 */
interface LoQueHayEnLosPlanes {
  readonly ejercicios: ReadonlySet<string> | null;
  readonly comidas: ReadonlySet<string> | null;
}

/** Los valores de una clave en cualquier nivel de un JSON: las versiones de ejercicio que cita un plan de Entrenamiento. */
function valoresDe(json: unknown, clave: string, salida: string[] = []): string[] {
  if (Array.isArray(json)) {
    for (const x of json) valoresDe(x, clave, salida);
  } else if (json !== null && typeof json === 'object') {
    for (const [k, v] of Object.entries(json as Record<string, unknown>)) {
      if (k === clave && typeof v === 'string') salida.push(v);
      else valoresDe(v, clave, salida);
    }
  }
  return salida;
}

/** Los nombres de las comidas de un plan de Nutrición (`ContenidoDePlan`: sus días tipo y las comidas de cada uno). */
function nombresDeComidas(contenido: unknown): string[] {
  const dias = (contenido as { dayTypes?: unknown } | null)?.dayTypes;
  if (!Array.isArray(dias)) return [];
  return dias.flatMap((d) => {
    const comidas = (d as { meals?: unknown } | null)?.meals;
    if (!Array.isArray(comidas)) return [];
    return comidas.flatMap((m) => {
      const nombre = (m as { label?: unknown } | null)?.label;
      return typeof nombre === 'string' ? [nombre] : [];
    });
  });
}

async function loQueHayEnLosPlanes(tx: Tx, profesionalId: string, asesoradoId: string): Promise<LoQueHayEnLosPlanes> {
  const deEntrenamiento = await tx.versionDePlanDeEntrenamiento.findFirst({
    where: { plan: { profesionalId, asesoradoId }, estado: { not: 'DESCARTADA' } },
    orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
    select: { contenido: true },
  });
  let ejercicios: Set<string> | null = null;
  if (deEntrenamiento) {
    const versiones = [...new Set(valoresDe(deEntrenamiento.contenido, 'exerciseVersionId'))].filter((id) => UUID.test(id));
    const filas = versiones.length === 0 ? [] : await tx.versionDeEjercicio.findMany({ where: { id: { in: versiones } }, select: { ejercicioId: true } });
    ejercicios = new Set(filas.map((f) => f.ejercicioId));
  }
  const deNutricion = await tx.versionDePlanNutricional.findFirst({
    where: { plan: { profesionalId, asesoradoId }, estado: { not: 'DESCARTADA' } },
    orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
    select: { contenido: true },
  });
  const comidas = deNutricion ? new Set(nombresDeComidas(deNutricion.contenido).map(claveDeLaComida)) : null;
  return { ejercicios, comidas };
}

/** El nombre de hoy de cada ejercicio del catálogo: el de su versión vigente (la que no tiene sucesora). */
async function nombresDeLosEjercicios(tx: Tx, ids: readonly string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return new Map();
  const filas = await tx.$queryRaw<{ id: string; nombre: string }[]>`
    SELECT v."ejercicio_id"::text AS "id", v."nombre" FROM "version_de_ejercicio" v
     WHERE v."ejercicio_id" = ANY(${unicos}::uuid[])
       AND NOT EXISTS (SELECT 1 FROM "version_de_ejercicio" s WHERE s."predecesora_id" = v."id")`;
  return new Map(filas.map((f) => [f.id, f.nombre]));
}

function anclaApi(n: FilaDeNota, nombres: ReadonlyMap<string, string>, planes: LoQueHayEnLosPlanes): AnclaDeNotaPropia | null {
  if (n.ancla === 'EJERCICIO' && n.ejercicioId) {
    return { type: 'EXERCISE', exerciseId: n.ejercicioId, exerciseName: nombres.get(n.ejercicioId) ?? 'Ejercicio', inPlan: planes.ejercicios === null ? null : planes.ejercicios.has(n.ejercicioId) };
  }
  if (n.ancla === 'COMIDA' && n.comida) {
    return { type: 'MEAL', mealLabel: n.comida, inPlan: planes.comidas === null ? null : planes.comidas.has(claveDeLaComida(n.comida)) };
  }
  return null;
}

/** Las notas como las lee su autor, con los nombres de los ejercicios y lo que hay hoy en sus planes. */
async function notasApi(tx: Tx, filas: readonly FilaDeNota[], profesionalId: string, asesoradoId: string): Promise<NotaPropia[]> {
  const nombres = await nombresDeLosEjercicios(tx, filas.flatMap((n) => (n.ejercicioId ? [n.ejercicioId] : [])));
  const planes: LoQueHayEnLosPlanes = filas.some((n) => n.ancla !== null) ? await loQueHayEnLosPlanes(tx, profesionalId, asesoradoId) : { ejercicios: null, comidas: null };
  return filas.map((n) => ({
    noteId: n.id,
    adviseeId: n.asesoradoId,
    text: n.texto,
    anchor: anclaApi(n, nombres, planes),
    recordedAt: n.momentoDeRegistro.toISOString(),
    archivedAt: n.archivo?.momentoDeRegistro.toISOString() ?? null,
  }));
}

/**
 * WP-PULIDO-GRANDES PG-16 (DL-173; PG-D11, aprobada por Dirección el 2026-11-14) · Las notas propias del profesional sobre
 * una persona: API-NPP-01 a 03, familia propia de BE. Lo que garantiza este servicio, con la base detrás (migración
 * 20261114120000):
 * - **Solo su autor las lee y las archiva.** Cada lectura filtra por quien consulta; una nota de otro profesional, aunque
 *   sea del mismo equipo o área, es el 404 de lo inexistente.
 * - **Con la persona acompañada hoy:** el PDP de alguna área (vínculo aceptado, ni en pausa ni terminado, B2 y A3), o la del
 *   ancla (Entrenamiento para un ejercicio, Nutrición para una comida). Sin acceso, no se agrega ni se lee; lo escrito
 *   queda guardado, y entra en la exportación de la persona.
 * - **Solo se agrega:** la nota no se edita ni se borra; archivarla es una fila aparte, una sola vez, y archivar una
 *   archivada responde lo mismo (PG-T70).
 * - **No se manda a nadie** ni dispara avisos, y BE no la resume ni la analiza.
 */
@Injectable()
export class NotasPropiasService {
  constructor(
    private readonly ejecutor: EjecutorDeNotasPropias,
    private readonly pdp: PdpService,
    private readonly catalogo: CatalogoDeEjerciciosService,
  ) {}

  // ─── API-NPP-01 ────────────────────────────────────────────────────────────────────────────
  agregar(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NPP-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      clave,
      esquema: AgregarNotaPropiaRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const ancla = pedido.anchor ?? null;
        const area: Alcance | null = ancla === null ? null : ancla.type === 'EXERCISE' ? 'ENTRENAMIENTO' : 'NUTRICION';
        const asesoradoId = await this.decidir(tx, 'API-NPP-01', actor, adviseeId, area, ctx);
        let ejercicioId: string | null = null;
        if (ancla?.type === 'EXERCISE') {
          ejercicioId = await this.catalogo.ejercicioCitable(tx, actor.identidadId, ancla.exerciseId);
          if (ejercicioId === null) {
            throw new ErrorDeApi(422, CodigoDeError.VALIDATION_FAILED, 'Ese ejercicio no está en el catálogo que podés usar.', { issues: [{ code: 'ANCHOR_NOT_AVAILABLE', path: 'anchor.exerciseId' }] });
          }
        }
        const fila = await tx.notaPropia.create({
          data: {
            profesionalId: actor.identidadId,
            asesoradoId,
            texto: pedido.text,
            ancla: ancla === null ? null : ancla.type === 'EXERCISE' ? 'EJERCICIO' : 'COMIDA',
            ejercicioId,
            comida: ancla?.type === 'MEAL' ? ancla.mealLabel : null,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
          include: INCLUIR,
        });
        const [nota] = await notasApi(tx, [fila], actor.identidadId, asesoradoId);
        return { estadoHttp: 201, cuerpo: { data: nota }, sujetoId: asesoradoId, recurso: { tipo: RECURSO, id: fila.id } };
      },
    });
  }

  // ─── API-NPP-02 ────────────────────────────────────────────────────────────────────────────
  /** Las de quien consulta, activas y archivadas, de la más nueva a la más vieja, hasta `TOPE_DE_NOTAS_PROPIAS`. */
  listar(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<ListaDeNotasPropiasDelProfesionalResponse> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-NPP-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        // Una lectura que no es de un área: alguna permitida alcanza; sin ninguna, el 404 de lo inexistente.
        await this.pdp.decidirAlgunAlcanceEnTransaccion(tx, { operacion: 'API-NPP-02', actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, recurso: null }, ctx);
        const asesoradoId = adviseeId.toLowerCase();
        // Solo las de quien consulta: las de otro profesional no salen nunca (PG-D11).
        const filas = await tx.notaPropia.findMany({
          where: { profesionalId: actor.identidadId, asesoradoId },
          include: INCLUIR,
          orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
          take: TOPE_DE_NOTAS_PROPIAS + 1,
        });
        const pagina = filas.slice(0, TOPE_DE_NOTAS_PROPIAS);
        return {
          data: await notasApi(tx, pagina, actor.identidadId, asesoradoId),
          page: { limit: TOPE_DE_NOTAS_PROPIAS, nextCursor: null, hasMore: filas.length > TOPE_DE_NOTAS_PROPIAS },
        };
      },
    });
  }

  // ─── API-NPP-03 ────────────────────────────────────────────────────────────────────────────
  archivar(actor: ActorAutenticado, noteId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: RECURSO, id: noteId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-NPP-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CuerpoVacioSchema,
      cuerpo,
      huellaExtra: { noteId },
      efecto: async (tx, _pedido, procedencia) => {
        const n = esUuid(noteId) ? await tx.notaPropia.findUnique({ where: { id: noteId.toLowerCase() }, select: { id: true, profesionalId: true, asesoradoId: true } }) : null;
        // De otro profesional o inexistente: el mismo 404. Que exista no se revela (PG-D11).
        if (!n || n.profesionalId !== actor.identidadId) throw this.ejecutor.noRevelable({ operacion: 'API-NPP-03', actorId: actor.identidadId, recurso, sujetoId: n?.asesoradoId ?? null }, ctx);
        await this.decidir(tx, 'API-NPP-03', actor, n.asesoradoId, null, ctx);
        // Una sola vez: con la nota tomada (sin modificarla), el archivo se mira de nuevo. Archivada, responde lo mismo.
        await tx.$queryRaw`SELECT 1 FROM "nota_propia" WHERE "id" = ${n.id}::uuid FOR NO KEY UPDATE`;
        const ya = await tx.archivoDeNotaPropia.findUnique({ where: { notaId: n.id }, select: { notaId: true } });
        if (!ya) await tx.archivoDeNotaPropia.create({ data: { notaId: n.id, profesionalId: actor.identidadId, procedencia: procedencia as unknown as Prisma.InputJsonValue } });
        const fila = await tx.notaPropia.findUniqueOrThrow({ where: { id: n.id }, include: INCLUIR });
        const [nota] = await notasApi(tx, [fila], actor.identidadId, n.asesoradoId);
        return { estadoHttp: 200, cuerpo: { data: nota }, sujetoId: n.asesoradoId, recurso: { tipo: RECURSO, id: n.id } };
      },
    });
  }

  // ─── Apoyo ─────────────────────────────────────────────────────────────────────────────────

  /**
   * El PDP de la escritura, dentro de su transacción y registrado: el del área del ancla o, sin ancla, el de la primera
   * área que hoy se permite con esa persona. Se decide con `decidirEnTransaccion`, que el reintento con la misma clave
   * vuelve a tomar (08:601). Sin ningún área permitida, las tres decisiones quedan registradas y responde el 404.
   */
  private async decidir(tx: Tx, operacion: string, actor: ActorAutenticado, adviseeId: string, area: Alcance | null, ctx: ContextoDeSolicitud): Promise<string> {
    const recurso = { tipo: 'Asesorado', id: adviseeId };
    let alcance = area;
    if (alcance === null && UUID.test(adviseeId)) {
      const hechos = await this.pdp.leerHechos(tx, actor.identidadId, adviseeId.toLowerCase());
      const permitidos = new Set(hechos.filter((h) => evaluarAutorizacion(h).permitida).map((h) => h.operacion.alcance));
      alcance = AREAS.find((a) => permitidos.has(a)) ?? null;
    }
    if (alcance === null) {
      // Lanza el 404 con la decisión que apunta a la causa. Si entre las dos lecturas se habilitó un área, sigue con esa.
      const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, recurso }, ctx);
      alcance = permitidos[0]!.alcance;
    }
    const d = await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: actor.identidadId, profesionalId: actor.identidadId, titularId: adviseeId, alcance, recurso }, ctx);
    return d.hechos.titular?.identidadId as string;
  }
}
