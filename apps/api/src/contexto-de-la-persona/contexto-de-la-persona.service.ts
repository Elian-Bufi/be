import { Injectable } from '@nestjs/common';
import {
  CLASE_DE_DATO_API,
  CodigoDeError,
  entraEnElCuerpoCompartido,
  evaluarAutorizacion,
  metricasDelCuerpo,
  renglonesVigentes,
  resumenDeValor,
  type Alcance,
  type CuerpoDelContextoResponse,
  type FormularioEnElContexto,
  type RespuestaDeCampoV2,
  type RespuestasDelContextoResponse,
  type TomaEnElContexto,
  type ValorComparable,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { fichaDe, INCLUIR_MEDICION, magnitudEfectiva } from '../antropometria/lectura-antropometria';
import { PdpService } from '../autorizacion/pdp.service';
import { camposV2PorCodigo, definicionV2, respuestaV2Api, type TranscripcionAlmacenada } from '../formularios/lectura-formularios-v2';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import { sinParametrosDeQuery } from '../http/validacion';
import { autorizacionDeResumenesVigente, componentesDeLaPersona, tomarLaAutorizacionDeResumenes } from '../resumenes/resumenes-de-la-persona';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { nombreDeProfesional } from '../vinculo/lectura';
import { EjecutorDelContexto, esUuid } from './ejecutor';

type Tx = Prisma.TransactionClient;

const CASO_DE_USO = 'CTX';
/**
 * El tipo de recurso con que API-CTX-02 registra una lectura del cuerpo **compartido**: la persona la ve en «Quién miró»
 * (API-RES-01, 08 §19.7), como las del plan compartido. La del área propia se registra como cualquier lectura del PDP.
 */
export const RECURSO_DEL_CUERPO_COMPARTIDO = 'ResumenCompartidoDeAntropometria';

const noLoComparte = (motivo: string): ErrorDeApi => new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, motivo);

/** Lo que la lectura de las respuestas necesita de cada Solicitud: su versión, su plantilla y la Respuesta con su cadena. */
const INCLUIR_SOLICITUD = {
  templateVersion: { include: { plantilla: { select: { clave: true } } } },
  respuesta: { include: { rectificaciones: { orderBy: { momentoDeRegistro: 'asc' as const } } } },
} as const;

/** Lo que la lectura del cuerpo necesita de cada toma: sus mediciones y sus corridas vigentes de finalidad antropométrica. */
const INCLUIR_TOMA = {
  mediciones: { include: INCLUIR_MEDICION },
  ejecuciones: {
    where: { finalidad: 'SOPORTE_ANTROPOMETRICO' as const, reemplazadaPor: { is: null } },
    include: { metodoVersion: true, entradas: { include: { medicion: { include: { protocoloVersion: true, anulacion: true } } } } },
  },
} as const;
type FilaDeToma = Prisma.EvaluacionAntropometricaGetPayload<{ include: typeof INCLUIR_TOMA }>;

/**
 * WP-CONTEXTO-DE-LA-PERSONA (DL-179) · las lecturas del panel «Contexto de <nombre>» que BE no tenía.
 *
 * **API-CTX-01 · las respuestas.** Lo que la persona respondió a las Solicitudes **de quien consulta** (la regla de FRM-05 y de
 * la cita, DL-102), de las áreas en que hoy la acompaña con el PDP permitido, en su versión vigente (la vista efectiva de
 * B-06, como API-FRI-03). Una Solicitud de un área que hoy no se permite no sale; sin ninguna, el 404 de lo inexistente. Lo
 * que la persona le contó a otro profesional no sale nunca (CTX-D10).
 *
 * **API-CTX-02 · el cuerpo.** La última toma registrada y la anterior:
 * - quien lleva Antropometría con la persona (el PDP de ANTROPOMETRIA) ve las suyas, enteras: cada medición vigente y cada
 *   resultado vigente de sus métodos, como API-ANT-06 (las de otro profesional no: la vista es de quien midió);
 * - quien recibe el resumen de Antropometría (la autorización de resúmenes vigente lo nombra en esa área, por un componente
 *   permitido) ve lo que promete el texto aceptado: el peso y la composición en kilos, con su método, de las tomas de quien
 *   lleva el área hoy con el PDP permitido. Sin el contexto escrito de la toma. La lectura queda registrada (08 §19.7);
 * - si no, el 404 de lo inexistente.
 * Las tomas en preparación no cuentan (REG-06-215). El cambio va solo entre comparables (REG-06-162; `metricasDelCuerpo`).
 */
@Injectable()
export class ContextoDeLaPersonaService {
  constructor(
    private readonly ejecutor: EjecutorDelContexto,
    private readonly pdp: PdpService,
  ) {}

  // ─── API-CTX-01 ────────────────────────────────────────────────────────────────────────────
  respuestas(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<RespuestasDelContextoResponse> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-CTX-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-CTX-01', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        const yo = actor.identidadId;
        // El PDP de cada área con la persona: vínculo aceptado (ni en pausa ni terminado), B2, cuentas y su A3. Sin ninguna, 404.
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(tx, { operacion: 'API-CTX-01', actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, recurso: { tipo: 'Asesorado', id: personaId } }, ctx);
        const scopes = [...new Set(permitidos.map((p) => p.alcance))];
        const solicitudes = await tx.solicitudDeFormulario.findMany({
          where: { profesionalId: yo, asesoradoId: personaId, alcance: { in: scopes }, respuesta: { isNot: null } },
          include: INCLUIR_SOLICITUD,
          orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
        });
        const forms: FormularioEnElContexto[] = [];
        for (const s of solicitudes) {
          const f = formularioEnElContexto(s);
          if (f) forms.push(f);
        }
        forms.sort((a, b) => b.answeredAt.localeCompare(a.answeredAt) || b.formResponseId.localeCompare(a.formResponseId));
        return { data: { scopes, forms } };
      },
    });
  }

  // ─── API-CTX-02 ────────────────────────────────────────────────────────────────────────────
  cuerpo(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<CuerpoDelContextoResponse> {
    sinParametrosDeQuery(query);
    return this.ejecutor.leer({
      operacion: 'API-CTX-02',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        if (!esUuid(adviseeId)) throw this.ejecutor.noRevelable({ operacion: 'API-CTX-02', actorId: actor.identidadId, recurso: null }, ctx);
        const personaId = adviseeId.toLowerCase();
        const yo = actor.identidadId;
        // ¿Lleva Antropometría con la persona hoy? Se mira sin registrar: la decisión que queda es la del camino que se toma.
        const hechos = await this.pdp.leerHechos(tx, yo, personaId, 'ANTROPOMETRIA');
        if (hechos.some((h) => evaluarAutorizacion(h).permitida)) {
          await this.pdp.decidirEnTransaccion(tx, { operacion: 'API-CTX-02', actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, alcance: 'ANTROPOMETRIA', recurso: { tipo: 'Asesorado', id: personaId } }, ctx);
          const tomas = await ultimasDosTomas(tx, personaId, [yo]);
          return { data: await cuerpoApi(tx, 'OWN_AREA', tomas, () => true, true) };
        }
        // El resumen compartido: el PDP de alguna de sus áreas (si no, 404), con el recurso que la persona ve en «Quién miró».
        const permitidos = await this.pdp.decidirAlgunAlcanceEnTransaccion(
          tx,
          { operacion: 'API-CTX-02', actorDeLaDecision: yo, profesionalId: yo, titularId: personaId, recurso: { tipo: RECURSO_DEL_CUERPO_COMPARTIDO, id: personaId } },
          ctx,
        );
        const { componentes } = await componentesDeLaPersona(tx, personaId);
        // Revisión del PR, como API-RES-06: un área que lleva él mismo (aunque esté en pausa o sin su B2) la ve por su Alcance,
        // nunca por lo compartido. Si no, un B2 revocado en Antropometría se esquivaba con el resumen de otro profesional.
        if (componentes.some((c) => c.profesionalId === yo && c.alcance === 'ANTROPOMETRIA')) throw noLoComparte('LLEVA_EL_AREA');
        // La autorización, con su cerrojo compartido: un retiro que empezó antes ya está confirmado cuando se lee.
        await tomarLaAutorizacionDeResumenes(tx, personaId, 'leer');
        const vigente = await autorizacionDeResumenesVigente(tx, personaId);
        const mios = new Set(permitidos.map((p) => p.alcanceDeVinculoId));
        const delCuerpo = renglonesVigentes(vigente?.renglones ?? null, componentes).filter((r) => r.area === 'ANTROPOMETRIA' && r.profesionalId === yo && mios.has(r.alcanceDeVinculoId));
        if (delCuerpo.length === 0) throw noLoComparte('CUERPO_NO_COMPARTIDO');
        // Las tomas de quien lleva Antropometría hoy, con su PDP permitido: lo que la persona compartió es lo de esa persona.
        const fuentes: string[] = [];
        for (const r of delCuerpo) {
          const c = componentes.find((x) => x.alcanceDeVinculoId === r.origenId);
          if (!c || fuentes.includes(c.profesionalId)) continue;
          const [h] = await this.pdp.leerHechos(tx, c.profesionalId, personaId, 'ANTROPOMETRIA');
          if (h && evaluarAutorizacion(h).permitida) fuentes.push(c.profesionalId);
        }
        const tomas = fuentes.length === 0 ? [] : await ultimasDosTomas(tx, personaId, fuentes);
        return { data: await cuerpoApi(tx, 'SHARED_SUMMARY', tomas, entraEnElCuerpoCompartido, false) };
      },
    });
  }
}

// ─── Las respuestas ─────────────────────────────────────────────────────────────────────────────

type FilaDeSolicitud = Prisma.SolicitudDeFormularioGetPayload<{ include: typeof INCLUIR_SOLICITUD }>;

/** Una Solicitud respondida, en su versión vigente y por sección; `null` si su cadena no se puede resolver (NOT_RESOLVABLE). */
function formularioEnElContexto(s: FilaDeSolicitud): FormularioEnElContexto | null {
  const r = s.respuesta;
  if (!r) return null;
  const definicion = definicionV2(s.templateVersion.contenido);
  const campos = camposV2PorCodigo(definicion.sections);
  const api = respuestaV2Api(r, null, campos);
  if (api.effectiveView.kind === 'NOT_RESOLVABLE') return null;
  const vista = api.effectiveView;
  const rectificacion = vista.kind === 'RECTIFIED' ? api.rectifications.find((x) => x.rectificationId === vista.rectificationId) : undefined;
  const vigentes: RespuestaDeCampoV2[] = rectificacion ? rectificacion.answers : api.original.answers;
  const porCodigo = new Map(vigentes.map((a) => [a.fieldCode, a] as const));
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
    version: api.version,
    rectified: rectificacion !== undefined,
    transcribedConfirmedAt: transcripcion?.confirmedAt ?? null,
    // En el orden de la plantilla; una pregunta sin responder no aparece (un opcional omitido no es un «no», 09:1586).
    sections: definicion.sections.map((sec) => ({
      sectionCode: sec.sectionCode,
      title: sec.title,
      answers: sec.fields.flatMap((campo) => {
        const a = porCodigo.get(campo.fieldCode);
        if (!a) return [];
        return [{ fieldCode: campo.fieldCode, label: campo.label, category: campo.category, dataType: campo.dataType, answer: a.answer, text: resumenDeValor(campo, a.answer) }];
      }),
    })),
  };
}

// ─── El cuerpo ──────────────────────────────────────────────────────────────────────────────────

/** Las dos últimas tomas registradas de esos profesionales con la persona, de la más nueva a la más vieja. */
function ultimasDosTomas(tx: Tx, personaId: string, profesionales: readonly string[]): Promise<FilaDeToma[]> {
  return tx.evaluacionAntropometrica.findMany({
    where: { asesoradoId: personaId, profesionalId: { in: [...profesionales] }, estado: 'REGISTRADA' },
    include: INCLUIR_TOMA,
    orderBy: [{ momentoDeOcurrencia: 'desc' }, { id: 'desc' }],
    take: 2,
  });
}

/** Los valores vigentes de una toma, por métrica: las mediciones no anuladas con su vista efectiva y los resultados vigentes. */
function valoresDeLaToma(t: FilaDeToma, entra: (metrica: string, unidad: string) => boolean): Map<string, ValorComparable> {
  const valores = new Map<string, ValorComparable>();
  for (const m of t.mediciones) {
    const efectiva = magnitudEfectiva(m);
    if (m.anulacion || !efectiva || !entra(m.metrica, efectiva.unit)) continue;
    const ficha = fichaDe(m);
    valores.set(m.metrica, { value: efectiva.value, unit: efectiva.unit, dataClass: CLASE_DE_DATO_API[m.clase], methodName: null, protocolName: ficha.protocolName, protocolVersionId: ficha.protocolVersionId, methodVersionId: null });
  }
  for (const c of t.ejecuciones) {
    // Una corrida que usó una medición anulada no aporta valor (REG-06-221), como en API-ANT-06.
    if (c.entradas.length === 0 || c.entradas.some((e) => e.medicion.anulacion) || !entra(c.metrica, c.unidad)) continue;
    const base = c.entradas[0]!.medicion;
    valores.set(c.metrica, {
      value: Number(c.valor.toString()),
      unit: c.unidad,
      dataClass: 'DERIVED',
      methodName: c.metodoVersion.nombre,
      protocolName: base.protocoloVersion.nombre,
      protocolVersionId: base.protocoloVersionId,
      methodVersionId: c.metodoVersionId,
    });
  }
  return valores;
}

async function tomaApi(tx: Tx, t: FilaDeToma, conContexto: boolean): Promise<TomaEnElContexto> {
  const perfil = await tx.perfilProfesional.findUnique({ where: { identidadId: t.profesionalId }, select: { nombreVisible: true } });
  return {
    evaluationId: t.id,
    occurredAt: t.momentoDeOcurrencia.toISOString(),
    registeredAt: (t.momentoDeRegistroDeEvaluacion ?? t.momentoDeRegistro).toISOString(),
    author: { identityId: t.profesionalId, displayName: nombreDeProfesional(perfil) },
    protocols: [...new Set(t.mediciones.map((m) => m.protocoloVersion.nombre))],
    origins: [...new Set(t.mediciones.map((m) => m.origen))].map((o) => ORIGEN_API[o]),
    context: conContexto ? t.contexto : null,
  };
}

const ORIGEN_API = { CAPTURA_DIRECTA: 'DIRECT_CAPTURE', AUTORREPORTE: 'SELF_REPORTED', IMPORTACION_CONTROLADA: 'CONTROLLED_IMPORT' } as const;

async function cuerpoApi(tx: Tx, access: 'OWN_AREA' | 'SHARED_SUMMARY', tomas: readonly FilaDeToma[], entra: (metrica: string, unidad: string) => boolean, conContexto: boolean): Promise<CuerpoDelContextoResponse['data']> {
  const [ultima, anterior] = tomas;
  return {
    access,
    latest: ultima ? await tomaApi(tx, ultima, conContexto) : null,
    previous: anterior ? await tomaApi(tx, anterior, conContexto) : null,
    metrics: ultima ? metricasDelCuerpo(valoresDeLaToma(ultima, entra), anterior ? valoresDeLaToma(anterior, entra) : new Map()) : [],
  };
}
