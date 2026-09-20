import { Injectable } from '@nestjs/common';
import {
  AnularMedicionRequestSchema,
  CodigoDeError,
  CorregirMedicionRequestSchema,
  admiteCorreccion,
  consecuenciasDeRecalculo,
  ejecutar,
  evaluarAdmisibilidad,
  evaluarAnulacion,
  evaluarNuevaCorreccion,
  type EjecucionDeCalculo,
  type EntradaDeCalculo,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi, errores } from '../http/errores';
import type { ResultadoIdempotente } from '../plataforma/idempotencia.service';
import { momentoDeLaBase } from '../prisma/concurrencia';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { esToken } from '../vinculo/lectura';
import { EjecutorAntropometrico, esUuid } from './ejecutor';
import { registrarEventoDeAntropometria } from './eventos';
import { INCLUIR_MEDICION, medicionApi, nombreVisibleDe, REDONDEO_DESDE_API } from './lectura-antropometria';
import { leerEspecificacionDeMetodo } from './lectura-calculo';

type Tx = Prisma.TransactionClient;

/**
 * UC-E03 — corregir **o** anular una medición (API-ANT-05 y API-ANT-12; RF-050).
 *
 * REG-06-219 separa los dos actos: la corrección cambia la vista del valor con el patrón de B-06; la anulación
 * cambia la condición de efectividad y es terminal. Las dos preservan el original y su cadena.
 *
 * Al anular, REG-06-220 obliga a reevaluar las dependencias: los derivados históricos se conservan, pero dejan de
 * presentarse como vigentes; si quedan entradas suficientes se emite una corrida nueva relacionada con la anterior,
 * y **si faltan entradas obligatorias no se inventa un sucesor**, porque «la ausencia efectiva resultante se
 * representa como ausencia, nunca como cero» (inciso 6).
 */
@Injectable()
export class MedicionesService {
  constructor(private readonly ejecutor: EjecutorAntropometrico, private readonly pdp: PdpService) {}

  // ─── API-ANT-05 · corregir ─────────────────────────────────────────────────────────────────
  corregir(actor: ActorAutenticado, evaluationId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'EvaluacionAntropometrica', id: evaluationId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ANT-05',
      casoDeUso: 'UC-E03',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: CorregirMedicionRequestSchema,
      cuerpo,
      huellaExtra: { evaluationId },
      efecto: async (tx, pedido, procedencia) => {
        const m = await this.propiaBloqueada(tx, 'API-ANT-05', actor, pedido.targetId, ctx);
        // El target pertenece a la evaluación de la ruta: si no, no es revelable por acá (09v11 §9).
        if (m.evaluacionId !== evaluationId) {
          throw this.ejecutor.noRevelable({ operacion: 'API-ANT-05', actorId: actor.identidadId, recurso }, ctx);
        }

        // REG-06-219: una medición anulada no admite una corrección destinada a volverla efectiva.
        if (!admiteCorreccion(m.anulacion ? 'ANULADA' : 'VIGENTE')) {
          throw new ErrorDeApi(422, CodigoDeError.CORRECTION_NOT_ALLOWED, 'Esta medición está anulada. Si hay una observación nueva, registrala como una medición nueva.');
        }

        // REG-06-154/155: la unidad viaja con el valor y no se normaliza en silencio. Una corrección que cambia de
        // unidad sería una conversión encubierta, y la conversión es un acto explícito y reproducible: se rechaza.
        // Sin esto, la ficha de comparabilidad y la magnitud efectiva de la serie hablarían de unidades distintas.
        if (pedido.magnitude.unit !== m.unidadDeOrigen) {
          throw new ErrorDeApi(
            422,
            CodigoDeError.UNIT_NOT_COMPATIBLE,
            `Esta medición está en ${m.unidadDeOrigen}. Una corrección conserva la unidad: si hay que cambiarla, registrá una medición nueva.`,
            { issues: [{ code: 'UNIT_MUST_MATCH_MEASUREMENT', path: 'magnitude.unit' }] },
          );
        }

        // REG-06-15/16 con el patrón de B-06: la nueva corrección parte de la terminal de la cadena.
        const previas = m.correcciones.map((c) => ({ id: c.id, originalId: m.id, correccionPreviaId: c.correccionPreviaId }));
        const terminal = previas.length === 0 ? null : (previas.find((p) => !previas.some((q) => q.correccionPreviaId === p.id))?.id ?? null);
        const evaluacion = evaluarNuevaCorreccion(m.id, previas, { originalId: m.id, correccionPreviaId: terminal });
        if (!evaluacion.valida) {
          throw new ErrorDeApi(409, CodigoDeError.RESOURCE_CONFLICT, 'La cadena de correcciones cambió. Volvé a leer la medición antes de corregirla.');
        }

        const correccion = await tx.correccionDeMedicion.create({
          data: {
            medicionId: m.id,
            correccionPreviaId: terminal,
            autorId: actor.identidadId,
            motivo: pedido.reason,
            valor: pedido.magnitude.value,
            unidadDeOrigen: pedido.magnitude.unit,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });

        const momento = await momentoDeLaBase(tx);
        // REG-06-161: los derivados que dependían de esta medición se reemiten, sin sobrescribir el histórico.
        const impacto = await this.reevaluarDependencias(tx, m.evaluacionId, [m.id], actor.identidadId, procedencia, {
          [m.id]: { medicionId: m.id, metrica: m.metrica, magnitud: { valor: pedido.magnitude.value, unidad: pedido.magnitude.unit } },
        });
        await registrarEventoDeAntropometria(tx, { tipo: 'MedicionCorregida', evaluacionId: m.evaluacionId, medicionId: m.id, actorId: actor.identidadId, procedencia, momento });

        const completa = await this.leerMedicion(tx, m.id);
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        return {
          estadoHttp: 201,
          // El 09 devuelve el par correctionId + evaluationId (09v11:637-640): la corrección es de la evaluación.
          cuerpo: { data: { ...medicionApi(completa, () => nombre), correctionId: correccion.id, evaluationId: completa.evaluacionId, dependencyImpact: impacto } },
          sujetoId: completa.evaluacion.asesoradoId,
          recurso,
        };
      },
    });
  }

  // ─── API-ANT-12 · anular ───────────────────────────────────────────────────────────────────
  /**
   * Adversarial 6. La segunda anulación **no produce un segundo efecto ni un error nuevo** (DV-05:1127): responde
   * `200` con la anulación que ya existe y `alreadyAnnulled: true`, sin emitir otro evento ni recalcular de nuevo
   * (WP-05 §0 D-B; DL-059). Con la misma `Idempotency-Key`, además, se replica la respuesta original.
   */
  anular(actor: ActorAutenticado, measurementId: string, cuerpo: unknown, clave: string | undefined, ctx: ContextoDeSolicitud): Promise<ResultadoIdempotente> {
    const recurso = { tipo: 'MedicionAntropometrica', id: measurementId };
    return this.ejecutor.escribirIdempotente({
      operacion: 'API-ANT-12',
      casoDeUso: 'UC-E03',
      actor,
      ctx,
      recursoIntentado: recurso,
      clave,
      esquema: AnularMedicionRequestSchema,
      cuerpo,
      huellaExtra: { measurementId },
      efecto: async (tx, pedido, procedencia) => {
        const m = await this.propiaBloqueada(tx, 'API-ANT-12', actor, measurementId, ctx);
        // 09v16 §24.1, paso 2: anular sobre una foto vieja de la evaluación es 409, no un pisotón. El token es
        // opcional porque el legajo no lo exige para la conducta idempotente del adversarial 6.
        if (pedido.expectedVersion !== undefined && !esToken(pedido.expectedVersion, m.evaluacion.version)) throw errores.conflictoDeVersion();
        const nombre = await nombreVisibleDe(tx, actor.identidadId);
        const anulacionApi = (a: { id: string; motivo: string; autorId: string; momentoDeOcurrencia: Date; momentoDeRegistro: Date }) => ({
          annulmentId: a.id,
          reason: a.motivo,
          author: { identityId: a.autorId, displayName: nombre },
          occurredAt: a.momentoDeOcurrencia.toISOString(),
          recordedAt: a.momentoDeRegistro.toISOString(),
        });

        const decision = evaluarAnulacion(m.anulacion ? 'ANULADA' : 'VIGENTE', pedido.reason);
        if (!decision.procede && decision.motivo === 'YA_ANULADA') {
          return {
            estadoHttp: 200,
            cuerpo: {
              data: {
                measurementId: m.id,
                condition: 'ANNULLED' as const,
                annulment: anulacionApi(m.anulacion!),
                alreadyAnnulled: true,
                dependencyImpact: { recalculated: [], withoutSuccessor: [] },
              },
            },
            sujetoId: m.evaluacion.asesoradoId,
            recurso,
          };
        }
        if (!decision.procede) {
          throw new ErrorDeApi(422, CodigoDeError.ANTHROPOMETRY_ANNULMENT_NOT_ALLOWED, 'Anular una medición exige un motivo.');
        }

        const momento = await momentoDeLaBase(tx);
        const anulacion = await tx.anulacionDeMedicion.create({
          data: {
            medicionId: m.id,
            autorId: actor.identidadId,
            motivo: pedido.reason,
            momentoDeOcurrencia: pedido.occurredAt ? new Date(pedido.occurredAt) : momento,
            procedencia: procedencia as unknown as Prisma.InputJsonValue,
          },
        });
        // REG-06-220: la anulación obliga a reevaluar dependencias. Sin reemplazo, no hay sucesor y no hay cero.
        const dependencyImpact = await this.reevaluarDependencias(tx, m.evaluacionId, [m.id], actor.identidadId, procedencia, {});
        await registrarEventoDeAntropometria(tx, { tipo: 'MedicionAnulada', evaluacionId: m.evaluacionId, medicionId: m.id, actorId: actor.identidadId, procedencia, momento });

        return {
          estadoHttp: 201,
          cuerpo: {
            data: { measurementId: m.id, condition: 'ANNULLED' as const, annulment: anulacionApi(anulacion), alreadyAnnulled: false, dependencyImpact },
          },
          sujetoId: m.evaluacion.asesoradoId,
          recurso,
        };
      },
    });
  }

  // ─── Interno ───────────────────────────────────────────────────────────────────────────────

  /**
   * REG-06-159/161/220 con la función pura del dominio: se identifican las corridas dependientes por el grafo
   * explícito, y para cada una se decide si se reemite o si queda sin sucesor. Nunca se reescribe una histórica.
   */
  private async reevaluarDependencias(
    tx: Tx,
    evaluacionId: string,
    medicionesCaidas: readonly string[],
    autorId: string,
    procedencia: unknown,
    reemplazos: Record<string, EntradaDeCalculo>,
  ): Promise<{ recalculated: { runId: string; supersedesRunId: string; metric: string; magnitude: { value: number; unit: string } }[]; withoutSuccessor: { runId: string; metric: string; missingInputs: string[] }[] }> {
    const filas = await tx.ejecucionDeCalculo.findMany({
      where: { evaluacionId, reemplazadaPor: null },
      include: { entradas: { include: { medicion: { include: { anulacion: { select: { id: true } } } } } }, metodoVersion: true },
    });
    const medicionesPorId = new Map(filas.flatMap((f) => f.entradas.map((i) => [i.medicionId, i.medicion])));
    const ejecuciones: EjecucionDeCalculo[] = filas.map((f) => ({
      ejecucionId: f.id,
      metodoId: f.metodoVersionId,
      metodoVersion: f.metodoVersion.version,
      entradas: f.entradas.map((i) => ({ medicionId: i.medicionId, metrica: i.metrica, magnitud: { valor: Number(i.valor), unidad: i.unidad } })),
      precision: { decimales: f.decimales, modo: f.modoDeRedondeo },
      reemplazaA: f.reemplazaAId,
    }));

    const recalculated: { runId: string; supersedesRunId: string; metric: string; magnitude: { value: number; unit: string } }[] = [];
    const withoutSuccessor: { runId: string; metric: string; missingInputs: string[] }[] = [];

    for (const consecuencia of consecuenciasDeRecalculo(ejecuciones, medicionesCaidas, reemplazos)) {
      const original = filas.find((f) => f.id === consecuencia.ejecucion.ejecucionId);
      if (!original) continue;
      if (consecuencia.tipo === 'SIN_SUCESOR') {
        withoutSuccessor.push({ runId: original.id, metric: original.metrica, missingInputs: [...consecuencia.faltantes] });
        continue;
      }
      // REG-06-161: se recalcula con la versión de método **registrada en la corrida**, nunca con una más nueva.
      const metodo = leerEspecificacionDeMetodo(original.metodoVersion.contenido);
      // REG-06-204 otra vez: el recálculo no puede saltearse la admisibilidad. Si la entrada nueva ya no la cumple
      // —otra procedencia, otra unidad—, no hay corrida sucesora; hay una ausencia, y se dice.
      const admisibles =
        metodo &&
        evaluarAdmisibilidad(
          metodo,
          consecuencia.entradasVigentes.map((e) => {
            const m = medicionesPorId.get(e.medicionId);
            return {
              codigo: metodo.entradas.find((x) => x.metrica === e.metrica)?.codigo ?? e.metrica,
              medicionId: e.medicionId,
              metrica: e.metrica,
              magnitud: e.magnitud,
              origen: m?.origen ?? 'CAPTURA_DIRECTA',
              vigente: !m?.anulacion,
            };
          }),
        );
      const resultado = metodo && admisibles?.admisible ? ejecutar(metodo, admisibles.entradas) : null;
      if (!resultado?.ok) {
        // Sin resultado reproducible no se inventa un sucesor: la ausencia se representa como ausencia (REG-06-220
        // inciso 6), igual que cuando falta una entrada obligatoria.
        withoutSuccessor.push({
          runId: original.id,
          metric: original.metrica,
          missingInputs: admisibles && !admisibles.admisible ? admisibles.problemas.map((x) => x.codigo) : [],
        });
        continue;
      }
      const nueva = await tx.ejecucionDeCalculo.create({
        data: {
          evaluacionId,
          metodoVersionId: original.metodoVersionId,
          autorId,
          metrica: original.metrica,
          valor: resultado.magnitud.valor,
          unidad: original.unidad,
          decimales: original.decimales,
          modoDeRedondeo: original.modoDeRedondeo,
          finalidad: original.finalidad,
          regla: original.regla,
          reemplazaAId: original.id,
          procedencia: procedencia as Prisma.InputJsonValue,
          entradas: {
            create: consecuencia.entradasVigentes.map((e) => ({ medicionId: e.medicionId, metrica: e.metrica, valor: e.magnitud.valor, unidad: e.magnitud.unidad })),
          },
        },
      });
      recalculated.push({ runId: nueva.id, supersedesRunId: original.id, metric: original.metrica, magnitude: { value: Number(nueva.valor), unit: nueva.unidad } });
    }
    return { recalculated, withoutSuccessor };
  }


  private async leerMedicion(tx: Tx, id: string) {
    return tx.medicionAntropometrica.findUniqueOrThrow({ where: { id }, include: { ...INCLUIR_MEDICION, evaluacion: true } });
  }

  /** La medición de una evaluación propia, bloqueada. Ajena o inexistente: el mismo 404 (DL-057). */
  private async propiaBloqueada(tx: Tx, operacion: string, actor: ActorAutenticado, measurementId: string, ctx: ContextoDeSolicitud) {
    const recurso = { tipo: 'MedicionAntropometrica', id: measurementId };
    const m = esUuid(measurementId) ? await this.leerMedicion(tx, measurementId).catch(() => null) : null;
    if (!m) throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso }, ctx);
    await this.pdp.decidirEnTransaccion(
      tx,
      {
        operacion,
        actorDeLaDecision: actor.identidadId,
        profesionalId: actor.identidadId,
        titularId: m.evaluacion.asesoradoId,
        alcance: 'ANTROPOMETRIA',
        recurso,
      },
      ctx,
    );
    if (m.evaluacion.profesionalId !== actor.identidadId) {
      throw this.ejecutor.noRevelable({ operacion, actorId: actor.identidadId, recurso, sujetoId: m.evaluacion.asesoradoId }, ctx);
    }
    await tx.$queryRaw`SELECT 1 FROM "medicion_antropometrica" WHERE "id" = ${m.id}::uuid FOR NO KEY UPDATE`;
    return m;
  }
}
