import { Injectable } from '@nestjs/common';
import {
  ALCANCE_DE_LA_REFERENCIA,
  CrearNotaDeCoordinacionRequestSchema,
  evaluarAutorizacion,
  type Alcance,
  type DestinatariosPosiblesResponse,
  type ListaDeNotasPropiasResponse,
  type NotaDeCoordinacionResponse,
  type ReferenciaDeNotaRequest,
  type ValidationIssue,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { decisionesDe, type SolicitudAutorizada } from '../autorizacion/pdp.guard';
import { PdpService } from '../autorizacion/pdp.service';
import { exigirA3Vigente } from '../consentimiento/a3-del-titular';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { despuesDelCursor, leerConsultaDeLista, ORDEN_DE_LISTA, paginar } from '../http/paginacion';
import { PublicadorDeNovedades } from '../novedades/publicador';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { conReintento } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import { actorDe, type ActorAutenticado } from '../sesion/sesion.guard';
import { resumenDeAlcance } from '../vinculo/lectura';
import { EjecutorDeCoordinacion, esUuid } from './ejecutor';
import { FINALIDAD_EN_LA_BASE, INCLUIR_NOTA, nombresDeProfesionales, notasComoLasLee, REFERENCIA_EN_LA_BASE } from './lectura-notas';

type Tx = Prisma.TransactionClient;

const CASO_DE_USO = 'UC-E07';

/**
 * Los profesionales que tienen o tuvieron un vínculo con la persona, salvo el autor: los candidatos a recibir una nota con
 * «todos» (CRD-D1). Cuáles la reciben lo decide el PDP, alcance por alcance.
 */
async function candidatosDe(tx: Tx, asesoradoId: string, autorId: string): Promise<string[]> {
  const filas = await tx.$queryRaw<{ id: string }[]>`
    SELECT DISTINCT "profesional_id"::text AS "id" FROM "vinculo"
     WHERE "asesorado_id" = ${asesoradoId}::uuid AND "profesional_id" <> ${autorId}::uuid
     ORDER BY 1`;
  return filas.map((f) => f.id);
}

/**
 * Notas de coordinación (WP-NOTAS-DE-COORDINACION; DEUDA_LEGAJO DL-140): RF-057 (P0) · UC-E07 · API-CRD-01 y sus dos
 * variantes. Lo que garantiza este servicio, con la base detrás (migración 20261017000100):
 * - **Dos tiempos de autorización** (UC-E07, pasos 3 y 5): el autor en su área de origen, con `decidirEnTransaccion` (sin
 *   acceso, el mismo 404 que una persona inexistente); después, cada destinatario, con su propia decisión registrada. Solo
 *   la reciben los que ese día tienen un vínculo aceptado y el B2 vigente en algún alcance (CRD-D1), y quedan guardados.
 * - **No toca nada de otra área:** registra la nota, sus destinatarios, sus referencias y las novedades, y nada más. No
 *   cambia un plan, un objetivo, una revisión ni la próxima acción de nadie (UC-E07 §11.8.10).
 * - **Sin texto en la novedad ni en el aviso** (CRD-D6): la novedad dice quién y sobre quién; el texto se lee en la ficha.
 * - **Idempotente:** el reintento con la misma clave vuelve a decidir al autor y responde la misma nota, sin otra.
 */
@Injectable()
export class NotasDeCoordinacionService {
  constructor(
    private readonly ejecutor: EjecutorDeCoordinacion,
    private readonly pdp: PdpService,
    private readonly prisma: PrismaService,
    private readonly novedades: PublicadorDeNovedades,
  ) {}

  // ─── API-CRD-01 ────────────────────────────────────────────────────────────────────────────
  crear(actor: ActorAutenticado, adviseeId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'Asesorado', id: adviseeId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-CRD-01',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CrearNotaDeCoordinacionRequestSchema,
      cuerpo,
      huellaExtra: { adviseeId },
      efecto: async (tx, pedido, procedencia) => {
        const autorId = actor.identidadId;
        const persona = esUuid(adviseeId) ? adviseeId.toLowerCase() : null;
        const elegido = pedido.recipients.mode === 'ONE' ? pedido.recipients.identityId.toLowerCase() : null;
        const candidatos = persona === null ? [] : elegido !== null ? [elegido] : await candidatosDe(tx, persona, autorId);
        // Las identidades primero, todas juntas: después se decide por varios pares sin invertir el orden de bloqueos.
        await this.pdp.bloquearIdentidades(tx, [autorId, ...(persona ? [persona] : []), ...candidatos]);

        // UC-E07, paso 3: el autor, en el área desde la que escribe (CRD-D4).
        const decision = await this.pdp.decidirEnTransaccion(
          tx,
          { operacion: 'API-CRD-01', actorDeLaDecision: autorId, profesionalId: autorId, titularId: adviseeId, alcance: pedido.originScope, recurso },
          ctx,
        );
        const asesoradoId = decision.hechos.titular?.identidadId as string;

        // CRD-D7: corrige una nota anterior suya sobre esta persona.
        const corrigeAId = pedido.correctsNoteId?.toLowerCase() ?? null;
        if (corrigeAId !== null) {
          const anterior = await tx.notaDeCoordinacion.findFirst({ where: { id: corrigeAId, autorId, asesoradoId }, select: { id: true } });
          if (!anterior) throw errores.referenciaDeNotaInvalida([{ code: 'CORRECTED_NOTE_NOT_AVAILABLE', path: 'correctsNoteId' }]);
        }

        // CRD-D5: lo citado es del autor con esta persona, de su área de origen, y está registrado.
        const referencias = pedido.references ?? [];
        const invalidas = await referenciasInvalidas(tx, autorId, asesoradoId, pedido.originScope, referencias);
        if (invalidas.length > 0) throw errores.referenciaDeNotaInvalida(invalidas);

        // UC-E07, paso 5: la visibilidad que resulta. El autor no se escribe a sí mismo.
        if (elegido === autorId) throw errores.destinatarioDeNotaNoDisponible([{ code: 'RECIPIENT_IS_AUTHOR', path: 'recipients.identityId' }]);
        const habilitados = await this.pdp.decidirDestinatariosEnTransaccion(tx, { operacion: 'API-CRD-01', autorId, titularId: asesoradoId, candidatos }, ctx);
        if (habilitados.length === 0) {
          throw errores.destinatarioDeNotaNoDisponible([elegido !== null ? { code: 'RECIPIENT_NOT_AVAILABLE', path: 'recipients.identityId' } : { code: 'NO_RECIPIENTS', path: 'recipients' }]);
        }

        const nota = await tx.notaDeCoordinacion.create({
          data: {
            autorId,
            asesoradoId,
            alcanceDeOrigen: pedido.originScope,
            finalidad: FINALIDAD_EN_LA_BASE[pedido.purpose],
            modoDeDestinatarios: elegido !== null ? 'UNO' : 'TODOS',
            texto: pedido.text,
            corrigeAId,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
          },
        });
        await tx.destinatarioDeNota.createMany({ data: habilitados.map((h) => ({ notaId: nota.id, destinatarioId: h.identidadId })) });
        if (referencias.length > 0) {
          await tx.referenciaDeNota.createMany({
            data: referencias.map((r, i) => ({ notaId: nota.id, orden: i + 1, tipo: REFERENCIA_EN_LA_BASE[r.type], recursoId: r.id.toLowerCase() })),
          });
        }
        // CRD-D6: una novedad para cada destinatario, en la misma transacción: si la nota no se confirma, tampoco ellas.
        await this.novedades.publicar(
          tx,
          habilitados.map((h) => ({
            tipo: 'NOTA_DE_COORDINACION_RECIBIDA' as const,
            destinatarioId: h.identidadId,
            alcance: pedido.originScope,
            fuenteId: autorId,
            referencia: { tipo: 'NotaDeCoordinacion', id: nota.id },
            identidadDelHecho: nota.id,
            momentoDeOcurrencia: ctx.momentoDeRecepcion,
          })),
          procedencia,
        );

        const fila = await tx.notaDeCoordinacion.findUniqueOrThrow({ where: { id: nota.id }, include: INCLUIR_NOTA });
        const [registrada] = await notasComoLasLee(tx, [fila], { tipo: 'PROFESIONAL', id: autorId });
        const respuesta: NotaDeCoordinacionResponse = { data: registrada! };
        return { estadoHttp: 201, cuerpo: respuesta, sujetoId: asesoradoId, recurso: { tipo: 'NotaDeCoordinacion', id: nota.id } };
      },
    });
  }

  // ─── API-CRD-01-LISTA ──────────────────────────────────────────────────────────────────────
  /**
   * A quién se le puede escribir hoy y desde qué área. El PdpGuard ya decidió los alcances del autor (sin ninguno, 404). Los
   * de cada candidato se evalúan con la misma función, sin registrar: es lo que la pantalla muestra para elegir, como el
   * modo de acceso de una lista (RF-023); la escritura vuelve a decidir y registra.
   */
  async destinatarios(req: SolicitudAutorizada): Promise<DestinatariosPosiblesResponse> {
    const decisiones = decisionesDe(req);
    const titularId = decisiones.titularId as string;
    const autorId = actorDe(req).identidadId;
    const origins = decisiones.porAlcance.filter((d) => d.decision.permitida).map((d) => resumenDeAlcance(d.alcance));
    const recipients = await conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const habilitados: { identidadId: string; alcances: Alcance[] }[] = [];
        for (const candidato of await candidatosDe(tx, titularId, autorId)) {
          const alcances = (await this.pdp.leerHechos(tx, candidato, titularId)).filter((h) => evaluarAutorizacion(h).permitida).map((h) => h.operacion.alcance);
          if (alcances.length > 0) habilitados.push({ identidadId: candidato, alcances });
        }
        const nombres = await nombresDeProfesionales(tx, habilitados.map((h) => h.identidadId));
        return habilitados
          .map((h) => ({ identityId: h.identidadId, displayName: nombres.get(h.identidadId) as string, scopes: h.alcances.map(resumenDeAlcance) }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName, 'es') || a.identityId.localeCompare(b.identityId));
      }),
    );
    return { data: { origins, recipients } };
  }

  // ─── API-CRD-01-PROPIA ─────────────────────────────────────────────────────────────────────
  /**
   * CRD-D2: las notas sobre la persona, todas (08 §9.15: sin notas secretas), con el vínculo vigente, en pausa o terminado:
   * es su historia (08 §14.3). Sin el A3 vigente, 403, como «Tu historial» y REV-A (08:406; DL-089, DL-115, DL-134).
   */
  propias(actor: ActorAutenticado, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<ListaDeNotasPropiasResponse> {
    const consulta = leerConsultaDeLista(query, {});
    return this.ejecutor.leer({
      operacion: 'API-CRD-01-PROPIA',
      casoDeUso: CASO_DE_USO,
      actor,
      ctx,
      recursoIntentado: null,
      lectura: async (tx) => {
        await exigirA3Vigente(tx, actor.identidadId);
        const filas = await tx.notaDeCoordinacion.findMany({
          where: { asesoradoId: actor.identidadId, ...despuesDelCursor(consulta.cursor) },
          include: INCLUIR_NOTA,
          orderBy: ORDEN_DE_LISTA,
          take: consulta.limit + 1,
        });
        const { pagina, page } = paginar(filas, consulta.limit);
        return { data: await notasComoLasLee(tx, pagina, { tipo: 'TITULAR' }), page };
      },
    });
  }
}

/**
 * CRD-D5: lo que no se puede citar, con su ruta. Del área de origen y del autor con esta persona: una versión activada de
 * su plan, una revisión suya o una toma registrada. Lo que no existe y lo que es de otro responden igual.
 */
async function referenciasInvalidas(tx: Tx, autorId: string, asesoradoId: string, origen: Alcance, referencias: readonly ReferenciaDeNotaRequest[]): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  for (const [i, r] of referencias.entries()) {
    if (ALCANCE_DE_LA_REFERENCIA[r.type] !== origen) {
      issues.push({ code: 'REFERENCE_OUTSIDE_ORIGIN_SCOPE', path: `references.${i}` });
      continue;
    }
    const id = r.id.toLowerCase();
    const par = { profesionalId: autorId, asesoradoId };
    const existe =
      r.type === 'NUTRITION_PLAN_VERSION'
        ? await tx.versionDePlanNutricional.count({ where: { id, estado: 'ACTIVADA', plan: par } })
        : r.type === 'TRAINING_PLAN_VERSION'
          ? await tx.versionDePlanDeEntrenamiento.count({ where: { id, estado: 'ACTIVADA', plan: par } })
          : r.type === 'NUTRITION_REVIEW'
            ? await tx.revisionNutricional.count({ where: { id, proceso: par } })
            : r.type === 'TRAINING_REVIEW'
              ? await tx.revisionDeEntrenamiento.count({ where: { id, proceso: par } })
              : await tx.evaluacionAntropometrica.count({ where: { id, estado: 'REGISTRADA', ...par } });
    if (existe === 0) issues.push({ code: 'REFERENCE_NOT_AVAILABLE', path: `references.${i}` });
  }
  return issues;
}
