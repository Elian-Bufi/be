import { Injectable } from '@nestjs/common';
import {
  ALCANCE_DE_LA_EVALUACION,
  AREAS_DE_LA_EVALUACION,
  CodigoDeError,
  CuerpoVacioSchema,
  MAXIMO_DE_FORMULARIOS_VINCULADOS,
  resolverVistaEfectiva,
  VincularFormulariosRequestSchema,
  type Alcance,
  type AreaDeLaEvaluacion,
  type FormularioEnElContexto,
  type FormularioVinculado,
  type FormularioVinculadoConRespuestasResponse,
  type FormulariosVinculadosResponse,
  type RelacionDeCorreccion,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { seccionesEnPalabras } from '../contexto-de-la-persona/contexto-de-la-persona.service';
import { camposV2PorCodigo, definicionV2, respuestaV2Api, type TranscripcionAlmacenada } from '../formularios/lectura-formularios-v2';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { EjecutorDeEvaluacionYFormularios, esUuid } from './ejecutor';

type Tx = Prisma.TransactionClient;

const CASO_DE_USO = 'EVF';
const token = (n: number): string => `v${n}`;

/** El tipo de recurso de la evaluación de cada área, como lo registran API-NUT-03 y API-TRN-03. */
const RECURSO_DE_LA_EVALUACION: Readonly<Record<AreaDeLaEvaluacion, string>> = { nutrition: 'EvaluacionNutricional', training: 'EvaluacionDeEntrenamiento' };
const RECURSO_DEL_VINCULO = 'VinculoDeFormularioEnEvaluacion';
/** El 422 de cada área: el de la evaluación, como la cita (DL-102, DL-179). */
const CODIGO_INVALIDO: Readonly<Record<AreaDeLaEvaluacion, CodigoDeError>> = {
  nutrition: CodigoDeError.NUTRITION_EVALUATION_INVALID,
  training: CodigoDeError.TRAINING_EVALUATION_INVALID,
};

/** Lo que hace falta de una Respuesta para vincularla y para leerla: su Solicitud y su plantilla, y su cadena. */
const INCLUIR_RESPUESTA = {
  solicitud: { include: { templateVersion: { include: { plantilla: { select: { clave: true } } } } } },
  rectificaciones: { orderBy: { momentoDeRegistro: 'asc' as const } },
} as const;
const INCLUIR_VINCULO = { respuesta: { include: INCLUIR_RESPUESTA }, rectificacion: true } as const;

type FilaDeRespuesta = Prisma.RespuestaDeFormularioGetPayload<{ include: typeof INCLUIR_RESPUESTA }>;
type FilaDeVinculo = Prisma.VinculoDeFormularioEnEvaluacionGetPayload<{ include: typeof INCLUIR_VINCULO }>;

/** La evaluación propia, ya autorizada: su área, su Alcance y su titular. */
interface EvaluacionPropia {
  readonly area: AreaDeLaEvaluacion;
  readonly alcance: 'NUTRICION' | 'ENTRENAMIENTO';
  readonly id: string;
  readonly asesoradoId: string;
}

/** Lo vigente de una Respuesta: la original o la última rectificación de su cadena. `null` si no se puede resolver. */
interface Vigente {
  readonly rectificacionId: string | null;
  readonly version: number;
  readonly momento: Date;
}

export function vigenteDe(r: Pick<FilaDeRespuesta, 'id' | 'version' | 'momentoDeRegistro'> & { rectificaciones: readonly { id: string; correccionPreviaId: string | null; version: number; momentoDeRegistro: Date }[] }): Vigente | null {
  const relaciones: RelacionDeCorreccion[] = r.rectificaciones.map((c) => ({ id: c.id, originalId: r.id, correccionPreviaId: c.correccionPreviaId }));
  const vista = resolverVistaEfectiva(r.id, relaciones);
  if (vista.tipo === 'NO_RESOLUBLE') return null;
  if (vista.tipo === 'ORIGINAL') return { rectificacionId: null, version: r.version, momento: r.momentoDeRegistro };
  const c = r.rectificaciones.find((x) => x.id === vista.id);
  return c ? { rectificacionId: c.id, version: c.version, momento: c.momentoDeRegistro } : null;
}

/** Un vínculo, como lo dice el contrato: la versión vinculada, su fecha y, si hay, la más nueva. Nunca las respuestas. */
export function vinculoApi(f: FilaDeVinculo): FormularioVinculado {
  const r = f.respuesta;
  const vinculada = f.rectificacion ?? r;
  const vigente = vigenteDe(r);
  const s = r.solicitud;
  return {
    linkId: f.id,
    formResponseId: r.id,
    formRequestId: s.id,
    scope: s.alcance as Alcance,
    templateKey: s.templateVersion.plantilla.clave,
    templateName: s.templateVersion.nombre,
    templateVersion: s.templateVersion.version,
    purpose: s.proposito,
    linkedVersion: token(vinculada.version),
    answeredAt: vinculada.momentoDeRegistro.toISOString(),
    linkedAt: f.vinculadoEn.toISOString(),
    laterVersion: vigente && vigente.version > vinculada.version ? { version: token(vigente.version), answeredAt: vigente.momento.toISOString() } : null,
  };
}

/**
 * WP-EVALUACION-Y-FORMULARIOS (DL-185) · los formularios que la persona respondió, vinculados enteros a la evaluación
 * inicial de Nutrición o de Entrenamiento (API-EVF-01 a 04).
 *
 * **Quién.** Solo el autor de la evaluación (DL-057), con el PDP del Alcance de la evaluación permitido. Es la misma
 * condición con que lee la evaluación (API-NUT-03 y API-TRN-03), así que el orden de los controles y el 404 son los de
 * siempre: un id que no existe, una evaluación de otro profesional o un PDP denegado (B2 revocado, A3 retirado, vínculo en
 * pausa o terminado) responden lo mismo.
 *
 * **Qué se vincula.** Una Respuesta de la misma persona a una Solicitud **de quien vincula**, del **Alcance de la
 * evaluación**: la regla con que FRM-05 y API-CTX-01 le dejan leerla y con que la evaluación la cita (DL-102). Lo que la
 * persona le contó a otro profesional no se vincula nunca, ni lo de otra área (EVF-D03). Una que no cumple es el mismo 422
 * neutral exista o no, como en la cita: no se revela de quién es un id.
 *
 * **Qué queda.** La Respuesta y la versión vigente **en la lectura de esta transacción** (la original o una rectificación),
 * nunca una copia de las respuestas (EVF-D02). Si la persona corrige después, la evaluación conserva la vinculada y la
 * lectura avisa que hay una más nueva (EVF-D04). Con `expectedVersion` distinta de la vigente: 409, sin escribir nada.
 *
 * **Concurrencia.** Las escrituras toman la fila de la evaluación (`FOR NO KEY UPDATE`): dos pedidos sobre la misma
 * evaluación se ordenan, y el índice parcial de la base (un vínculo vigente por respuesta) nunca salta como error.
 */
@Injectable()
export class EvaluacionYFormulariosService {
  constructor(
    private readonly ejecutor: EjecutorDeEvaluacionYFormularios,
    private readonly pdp: PdpService,
  ) {}

  // ─── API-EVF-01 ────────────────────────────────────────────────────────────────────────────
  listar(actor: ActorAutenticado, area: string, evaluationId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<FormulariosVinculadosResponse> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-EVF-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: this.recursoIntentado(area, evaluationId),
      lectura: async (tx) => {
        const e = await this.evaluacionPropia(tx, 'API-EVF-01', actor, area, evaluationId, ctx);
        return { data: { evaluationId: e.id, links: await this.vigentes(tx, e) } };
      },
    });
  }

  // ─── API-EVF-02 ────────────────────────────────────────────────────────────────────────────
  vincular(actor: ActorAutenticado, area: string, evaluationId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-EVF-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: this.recursoIntentado(area, evaluationId),
      clave,
      esquema: VincularFormulariosRequestSchema,
      cuerpo,
      huellaExtra: { area, evaluationId },
      efecto: async (tx, pedido) => {
        const e = await this.evaluacionPropia(tx, 'API-EVF-02', actor, area, evaluationId, ctx);
        await this.tomarLaEvaluacion(tx, e);
        const actuales = await this.filasVigentes(tx, e);
        const porRespuesta = new Map(actuales.map((f) => [f.respuestaId, f] as const));
        const vistas = new Set<string>();
        const cambios: { respuestaId: string; rectificacionId: string | null; reemplaza: string | null }[] = [];
        for (const [i, v] of pedido.links.entries()) {
          if (!esUuid(v.formResponseId)) throw this.invalido(e.area, i);
          const id = v.formResponseId.toLowerCase();
          const r = await tx.respuestaDeFormulario.findUnique({ where: { id }, include: INCLUIR_RESPUESTA });
          // Lo ajeno, lo de otra área y lo inexistente: el mismo 422 (no se revela de quién es un id).
          if (!r || r.asesoradoId !== e.asesoradoId || r.solicitud.profesionalId !== actor.identidadId || r.solicitud.alcance !== e.alcance) throw this.invalido(e.area, i);
          const vigente = vigenteDe(r);
          if (!vigente) throw this.invalido(e.area, i);
          // El control de versión va después de la pertenencia: sobre lo ajeno nunca sale un 409 que revele que existe.
          if (v.expectedVersion !== token(vigente.version)) throw this.versionCambiada(i);
          if (vistas.has(r.id)) throw this.invalido(e.area, i, 'FORM_RESPONSE_REPEATED');
          vistas.add(r.id);
          const ya = porRespuesta.get(r.id);
          if (ya && ya.rectificacionId === vigente.rectificacionId) continue;
          cambios.push({ respuestaId: r.id, rectificacionId: vigente.rectificacionId, reemplaza: ya?.id ?? null });
        }
        const nuevos = cambios.filter((c) => c.reemplaza === null).length;
        if (actuales.length + nuevos > MAXIMO_DE_FORMULARIOS_VINCULADOS) {
          throw new ErrorDeApi(422, CODIGO_INVALIDO[e.area], `Se pueden vincular hasta ${MAXIMO_DE_FORMULARIOS_VINCULADOS} formularios por evaluación.`, {
            issues: [{ code: 'TOO_MANY_LINKED_FORMS', path: 'links' }],
          });
        }
        if (cambios.length > 0) {
          const momento = await momentoDeLaBase(tx);
          for (const c of cambios) {
            // «Vincular la más nueva»: la anterior se desvincula en el mismo momento; la fila queda.
            if (c.reemplaza) await tx.vinculoDeFormularioEnEvaluacion.update({ where: { id: c.reemplaza }, data: { desvinculadoEn: momento } });
            await tx.vinculoDeFormularioEnEvaluacion.create({
              data: {
                alcance: e.alcance,
                ...(e.area === 'nutrition' ? { evaluacionNutricionalId: e.id } : { evaluacionDeEntrenamientoId: e.id }),
                respuestaId: c.respuestaId,
                rectificacionId: c.rectificacionId,
                vinculadoEn: momento,
              },
            });
          }
        }
        return {
          estadoHttp: cambios.length > 0 ? 201 : 200,
          cuerpo: { data: { evaluationId: e.id, links: await this.vigentes(tx, e) } },
          sujetoId: e.asesoradoId,
          recurso: { tipo: RECURSO_DE_LA_EVALUACION[e.area], id: e.id },
        };
      },
    });
  }

  // ─── API-EVF-03 ────────────────────────────────────────────────────────────────────────────
  desvincular(actor: ActorAutenticado, area: string, evaluationId: string, linkId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-EVF-03',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: RECURSO_DEL_VINCULO, id: linkId },
      clave,
      esquema: CuerpoVacioSchema,
      cuerpo,
      huellaExtra: { area, evaluationId, linkId },
      efecto: async (tx) => {
        const e = await this.evaluacionPropia(tx, 'API-EVF-03', actor, area, evaluationId, ctx);
        await this.tomarLaEvaluacion(tx, e);
        const v = await this.vinculoDe(tx, 'API-EVF-03', actor, e, linkId, ctx);
        // Desvincular uno ya desvinculado no cambia nada (la fila guarda la primera fecha).
        if (v.desvinculadoEn === null) await tx.vinculoDeFormularioEnEvaluacion.update({ where: { id: v.id }, data: { desvinculadoEn: await momentoDeLaBase(tx) } });
        return {
          estadoHttp: 200,
          cuerpo: { data: { evaluationId: e.id, links: await this.vigentes(tx, e) } },
          sujetoId: e.asesoradoId,
          recurso: { tipo: RECURSO_DEL_VINCULO, id: v.id },
        };
      },
    });
  }

  // ─── API-EVF-04 ────────────────────────────────────────────────────────────────────────────
  abrir(actor: ActorAutenticado, area: string, evaluationId: string, linkId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<FormularioVinculadoConRespuestasResponse> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-EVF-04',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: RECURSO_DEL_VINCULO, id: linkId },
      lectura: async (tx) => {
        const e = await this.evaluacionPropia(tx, 'API-EVF-04', actor, area, evaluationId, ctx);
        const v = await this.vinculoDe(tx, 'API-EVF-04', actor, e, linkId, ctx);
        // Uno desvinculado ya no es parte de la evaluación: se lee como lo inexistente.
        if (v.desvinculadoEn !== null) throw this.ejecutor.noRevelable({ operacion: 'API-EVF-04', actorId: actor.identidadId, recurso: { tipo: RECURSO_DEL_VINCULO, id: linkId }, sujetoId: e.asesoradoId, alcance: e.alcance }, ctx);
        return { data: { link: vinculoApi(v), form: formularioEnSuVersion(v) } };
      },
    });
  }

  // ─── Lo común ──────────────────────────────────────────────────────────────────────────────

  private recursoIntentado(area: string, evaluationId: string): { tipo: string; id: string } {
    return { tipo: (AREAS_DE_LA_EVALUACION as readonly string[]).includes(area) ? RECURSO_DE_LA_EVALUACION[area as AreaDeLaEvaluacion] : 'Evaluacion', id: evaluationId };
  }

  /**
   * La evaluación, si es del actor y el PDP de su Alcance lo permite. El orden es el de API-NUT-03: existe, el PDP (que
   * registra la decisión) y la autoría. Cualquier falla, el mismo 404.
   */
  private async evaluacionPropia(tx: Tx, operacion: string, actor: ActorAutenticado, area: string, evaluationId: string, ctx: ContextoDeSolicitud): Promise<EvaluacionPropia> {
    const yo = actor.identidadId;
    if (!(AREAS_DE_LA_EVALUACION as readonly string[]).includes(area)) throw this.ejecutor.noRevelable({ operacion, actorId: yo, recurso: null }, ctx);
    const a = area as AreaDeLaEvaluacion;
    const alcance = ALCANCE_DE_LA_EVALUACION[a];
    const recurso = { tipo: RECURSO_DE_LA_EVALUACION[a], id: evaluationId };
    const id = esUuid(evaluationId) ? evaluationId.toLowerCase() : null;
    const e = id === null ? null : a === 'nutrition' ? await tx.evaluacionNutricional.findUnique({ where: { id }, select: { id: true, profesionalId: true, asesoradoId: true } }) : await tx.evaluacionDeEntrenamiento.findUnique({ where: { id }, select: { id: true, profesionalId: true, asesoradoId: true } });
    if (!e) throw this.ejecutor.noRevelable({ operacion, actorId: yo, recurso, alcance }, ctx);
    await this.pdp.decidirEnTransaccion(tx, { operacion, actorDeLaDecision: yo, profesionalId: yo, titularId: e.asesoradoId, alcance, recurso }, ctx);
    if (e.profesionalId !== yo) throw this.ejecutor.noRevelable({ operacion, actorId: yo, recurso, sujetoId: e.asesoradoId, alcance }, ctx);
    return { area: a, alcance, id: e.id, asesoradoId: e.asesoradoId };
  }

  /** Ordena las escrituras sobre una misma evaluación (la fila de la evaluación no cambia: solo se toma). */
  private async tomarLaEvaluacion(tx: Tx, e: EvaluacionPropia): Promise<void> {
    if (e.area === 'nutrition') await tx.$queryRaw`SELECT 1 FROM "evaluacion_nutricional" WHERE "id" = ${e.id}::uuid FOR NO KEY UPDATE`;
    else await tx.$queryRaw`SELECT 1 FROM "evaluacion_de_entrenamiento" WHERE "id" = ${e.id}::uuid FOR NO KEY UPDATE`;
  }

  /** Un vínculo de esta evaluación (vigente o no). Uno de otra evaluación, ajeno o inexistente: el mismo 404. */
  private async vinculoDe(tx: Tx, operacion: string, actor: ActorAutenticado, e: EvaluacionPropia, linkId: string, ctx: ContextoDeSolicitud): Promise<FilaDeVinculo> {
    const v = esUuid(linkId) ? await tx.vinculoDeFormularioEnEvaluacion.findUnique({ where: { id: linkId.toLowerCase() }, include: INCLUIR_VINCULO }) : null;
    const deEsta = v && (e.area === 'nutrition' ? v.evaluacionNutricionalId === e.id : v.evaluacionDeEntrenamientoId === e.id);
    if (!v || !deEsta) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso: { tipo: RECURSO_DEL_VINCULO, id: linkId }, sujetoId: e.asesoradoId, alcance: e.alcance }, ctx);
    return v;
  }

  private filasVigentes(tx: Tx, e: EvaluacionPropia): Promise<FilaDeVinculo[]> {
    return tx.vinculoDeFormularioEnEvaluacion.findMany({
      where: { ...(e.area === 'nutrition' ? { evaluacionNutricionalId: e.id } : { evaluacionDeEntrenamientoId: e.id }), desvinculadoEn: null },
      include: INCLUIR_VINCULO,
      orderBy: [{ vinculadoEn: 'asc' }, { id: 'asc' }],
    });
  }

  private async vigentes(tx: Tx, e: EvaluacionPropia): Promise<FormularioVinculado[]> {
    return (await this.filasVigentes(tx, e)).map(vinculoApi);
  }

  private invalido(area: AreaDeLaEvaluacion, indice: number, code = 'FORM_RESPONSE_LINK_INVALID'): ErrorDeApi {
    return new ErrorDeApi(422, CODIGO_INVALIDO[area], 'Un formulario elegido no se puede vincular a esta evaluación.', {
      issues: [{ code, path: `links[${indice}].formResponseId` }],
    });
  }

  private versionCambiada(indice: number): ErrorDeApi {
    return new ErrorDeApi(409, CodigoDeError.VERSION_CONFLICT, 'Un formulario cambió desde que lo viste: volvé a leer la lista y elegilo de nuevo.', {
      issues: [{ code: 'FORM_RESPONSE_VERSION_CHANGED', path: `links[${indice}].expectedVersion` }],
    });
  }
}

/** Lo que respondió la persona en la versión vinculada, por sección y en palabras, con la forma del panel (API-CTX-01). */
export function formularioEnSuVersion(v: FilaDeVinculo): FormularioEnElContexto {
  const r = v.respuesta;
  const s = r.solicitud;
  const definicion = definicionV2(s.templateVersion.contenido);
  const campos = camposV2PorCodigo(definicion.sections);
  const api = respuestaV2Api(r, null, campos);
  const rectificacion = v.rectificacionId ? api.rectifications.find((x) => x.rectificationId === v.rectificacionId) : undefined;
  // La API validó la rectificación al vincular y la base la ata a la respuesta: si falta, la base se alteró por fuera.
  if (v.rectificacionId && !rectificacion) throw new Error(`BE: el vínculo ${v.id} no se puede resolver (DL-185).`);
  const respuestas = rectificacion ? rectificacion.answers : api.original.answers;
  const transcripcion = r.transcripcion ? (r.transcripcion as unknown as TranscripcionAlmacenada) : null;
  return {
    formRequestId: s.id,
    formResponseId: r.id,
    scope: s.alcance as Alcance,
    templateKey: s.templateVersion.plantilla.clave,
    templateName: s.templateVersion.nombre,
    templateVersion: s.templateVersion.version,
    purpose: s.proposito,
    requestedAt: s.momentoDeRegistro.toISOString(),
    answeredAt: rectificacion ? rectificacion.recordedAt : api.submittedAt,
    version: rectificacion ? rectificacion.version : token(r.version),
    rectified: rectificacion !== undefined,
    transcribedConfirmedAt: transcripcion?.confirmedAt ?? null,
    sections: seccionesEnPalabras(definicion.sections, new Map(respuestas.map((a) => [a.fieldCode, a] as const))),
  };
}
