import { Injectable } from '@nestjs/common';
import { CLASE_DE_DATO_API, construirSerie, fechasDelPeriodo, type ObservacionDeSerie } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import type { ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { ZONA_POR_DEFECTO, fechaLocalEn, finDelDiaLocal, inicioDelDiaLocal } from '../nutricion/zona';
import { EjecutorAntropometrico } from './ejecutor';
import { fichaDe, INCLUIR_MEDICION, magnitudEfectiva } from './lectura-antropometria';

/** La misma ficha, en los dos vocabularios: el dominio compara; el contrato publica. */
const fichaDeDominio = (f: ReturnType<typeof fichaDe>) => ({ protocoloId: f.protocolVersionId, protocoloVersion: f.protocolVersionId, metodoId: f.methodId, metodoVersion: f.methodVersionId, unidad: f.unit });

type Tx = Prisma.TransactionClient;

const MOTIVO_API = { PROTOCOLO: 'PROTOCOL', METODO: 'METHOD', UNIDAD: 'UNIT' } as const;

/**
 * UC-P20 — evolución antropométrica (API-ANT-06; RF-049). La leen el profesional autorizado **y el asesorado**.
 *
 * Es el adversarial 7 en su variante de mediciones. La serie la arma la función pura del dominio, que por
 * construcción no puede mentir: cada checkpoint pedido devuelve un punto, el que no tiene observación vigente es
 * `SIN_DATO` y no lleva valor, una medición anulada no aporta punto (REG-06-221) y un cero medido sigue siendo un
 * punto disponible (INV-06-176). No hay interpolación, imputación ni arrastre en ninguna parte del camino
 * (REG-06-166; INV-06-177).
 *
 * Solo entran las mediciones de evaluaciones **registradas**: un borrador no es historia (REG-06-215).
 */
@Injectable()
export class EvolucionService {
  constructor(private readonly ejecutor: EjecutorAntropometrico, private readonly pdp: PdpService) {}

  consultar(actor: ActorAutenticado, adviseeId: string, query: Record<string, unknown>, ctx: ContextoDeSolicitud): Promise<unknown> {
    const { desde, hasta, metricas } = this.leerConsulta(query);
    return this.ejecutor.leer({
      operacion: 'API-ANT-06',
      casoDeUso: 'UC-P20',
      actor,
      ctx,
      recursoIntentado: { tipo: 'Asesorado', id: adviseeId },
      lectura: async (tx) => {
        const titular = await this.titularAutorizado(tx, actor, adviseeId, ctx);
        const { observaciones, fichasPorMedicion, porMedicion, partialView } = await this.observaciones(tx, titular, actor.identidadId, desde, hasta);
        const fechas = fechasDelPeriodo(desde, hasta);
        const pedidas = metricas ?? [...new Set(observaciones.map((o) => o.metrica))].sort();

        const gruposPorFicha = new Map<string, { comparabilityGroup: string; protocolVersionId: string; protocolName: string; methodVersionId: string | null; unit: string }>();
        const grupoDe = (f: ReturnType<typeof fichaDe>): string => {
          const clave = `${f.protocolVersionId}|${f.methodVersionId ?? ''}|${f.unit}`;
          if (!gruposPorFicha.has(clave)) {
            gruposPorFicha.set(clave, {
              comparabilityGroup: `cmp-${gruposPorFicha.size + 1}`,
              protocolVersionId: f.protocolVersionId,
              protocolName: f.protocolName,
              methodVersionId: f.methodVersionId,
              unit: f.unit,
            });
          }
          return gruposPorFicha.get(clave)!.comparabilityGroup;
        };

        return {
          data: {
            adviseeId: titular,
            period: { start: desde, end: hasta, timeZone: ZONA_POR_DEFECTO },
            metrics: pedidas.map((metrica) => {
              const serie = construirSerie(metrica, fechas, observaciones);
              const grupos = new Map<string, ReturnType<typeof grupoDe>>();
              const puntos = serie.puntos
                .filter((p) => p.disponibilidad === 'REGISTRADO')
                .map((p) => {
                  const fuente = porMedicion.get(p.origenId)!;
                  const grupo = grupoDe(fichasPorMedicion.get(p.origenId)!);
                  grupos.set(grupo, grupo);
                  return {
                    occurredAt: fuente.momentoDeOcurrencia.toISOString(),
                    recordedAt: fuente.momentoDeRegistro.toISOString(),
                    value: p.magnitud.valor,
                    unit: p.magnitud.unidad,
                    sourceEvaluationId: fuente.evaluacionId,
                    sourceId: p.origenId,
                    dataClass: CLASE_DE_DATO_API[p.clase],
                    comparabilityGroup: grupo,
                    // La vista efectiva viene de la cadena de correcciones o del original (REG-06-16): se dice cuál.
                    correctionState: fuente.correcciones.length > 0 ? ('CORRECTED' as const) : ('EFFECTIVE' as const),
                    incomparableWithPrevious: p.incomparableConElAnterior.map((m) => MOTIVO_API[m]),
                  };
                });
              return {
                metricCode: metrica,
                series: puntos,
                // Los días sin observación vigente, como rangos: un hueco no es una fila con un valor vacío.
                gaps: huecosDe(serie.puntos.filter((p) => p.disponibilidad === 'SIN_DATO').map((p) => p.fechaLocal)),
                comparability: { groups: [...gruposPorFicha.values()].filter((g) => grupos.has(g.comparabilityGroup)) },
              };
            }),
            // 09v11:786-796: la vista es parcial cuando el actor ve solo el subconjunto de fuentes que puede
            // consultar. Acá pasa cuando el asesorado tiene evaluaciones registradas de otro profesional en el
            // período: existen, no se muestran, y la respuesta lo dice en vez de parecer completa.
            partialView,
            // Lo que el legajo prohíbe hacer con esta serie, dicho en la propia respuesta (REG-06-166).
            honesty: { interpolated: false as const, imputed: false as const, carriedForward: false as const },
          },
        };
      },
    });
  }

  /**
   * El titular puede ser el propio asesorado —RF-049 lo nombra como actor— o un profesional con capacidad
   * antropométrica habilitada sobre él (WP-05 §0 D-C). Para el asesorado no hay PDP de vínculo: son sus datos.
   */
  private async titularAutorizado(tx: Tx, actor: ActorAutenticado, adviseeId: string, ctx: ContextoDeSolicitud): Promise<string> {
    if (adviseeId === 'me' || adviseeId === actor.identidadId) return actor.identidadId;
    const d = await this.pdp.decidirEnTransaccion(
      tx,
      {
        operacion: 'API-ANT-06',
        actorDeLaDecision: actor.identidadId,
        profesionalId: actor.identidadId,
        titularId: adviseeId,
        alcance: 'ANTROPOMETRIA',
        recurso: { tipo: 'Asesorado', id: adviseeId },
      },
      ctx,
    );
    return d.hechos.titular?.identidadId as string;
  }

  /** Las mediciones de evaluaciones REGISTRADAS del período, con su condición y su ficha de comparabilidad. */
  private async observaciones(
    tx: Tx,
    titular: string,
    actorId: string,
    desde: string,
    hasta: string,
  ): Promise<{
    observaciones: ObservacionDeSerie[];
    fichasPorMedicion: Map<string, ReturnType<typeof fichaDe>>;
    porMedicion: Map<string, { evaluacionId: string; momentoDeOcurrencia: Date; momentoDeRegistro: Date; correcciones: { id: string }[] }>;
    partialView: boolean;
  }> {
    const ventana = { gte: inicioDelDiaLocal(desde, ZONA_POR_DEFECTO), lt: finDelDiaLocal(hasta, ZONA_POR_DEFECTO) };
    // Lo que el actor **no** puede ver: evaluaciones registradas del mismo asesorado, en el mismo período, de otro
    // profesional. Si las hay, la vista es parcial y la respuesta lo declara (09v11:786-796).
    const ajenas =
      titular === actorId
        ? 0
        : await tx.medicionAntropometrica.count({
            where: { evaluacion: { asesoradoId: titular, estado: 'REGISTRADA', profesionalId: { not: actorId } }, momentoDeOcurrencia: ventana },
          });
    const filas = await tx.medicionAntropometrica.findMany({
      where: {
        evaluacion: { asesoradoId: titular, estado: 'REGISTRADA', ...(titular === actorId ? {} : { profesionalId: actorId }) },
        // La ventana se recorta en la **misma zona** en la que después se ubica cada punto. Mezclar UTC acá y hora
        // local allá deja afuera las mediciones de la tarde del último día, que saldrían como «sin dato» (INV-06-177).
        momentoDeOcurrencia: ventana,
      },
      include: INCLUIR_MEDICION,
      orderBy: { momentoDeOcurrencia: 'asc' },
    });
    const fichasPorMedicion = new Map(filas.map((m) => [m.id, fichaDe(m)]));
    const observaciones = filas.flatMap((m) => {
      // La magnitud efectiva sale de la cadena de correcciones, resuelta por relación (REG-06-16). Si la cadena no
      // se puede resolver —rama o ciclo—, no hay valor vigente: la observación **no aporta punto**, y el día se ve
      // como lo que es, sin dato. Mostrar el original como si fuera el efectivo sería afirmar algo que no se sabe.
      const efectiva = magnitudEfectiva(m);
      if (!efectiva) return [];
      return [
        {
          fechaLocal: fechaLocalEn(m.momentoDeOcurrencia, ZONA_POR_DEFECTO),
          metrica: m.metrica,
          magnitud: { valor: efectiva.value, unidad: efectiva.unit },
          clase: m.clase,
          // 06:8670: sin evento de anulación, vigente. Una anulada no aporta punto (REG-06-221).
          condicion: m.anulacion ? ('ANULADA' as const) : ('VIGENTE' as const),
          ficha: fichaDeDominio(fichaDe(m)),
          origenId: m.id,
        },
      ];
    });
    const porMedicion = new Map(
      filas.map((m) => [m.id, { evaluacionId: m.evaluacionId, momentoDeOcurrencia: m.momentoDeOcurrencia, momentoDeRegistro: m.momentoDeRegistro, correcciones: m.correcciones }]),
    );
    return { observaciones, fichasPorMedicion, porMedicion, partialView: ajenas > 0 };
  }

  private leerConsulta(query: Record<string, unknown>): { desde: string; hasta: string; metricas: string[] | null } {
    const permitidos = new Set(['metric', 'periodStart', 'periodEnd']);
    for (const clave of Object.keys(query)) {
      if (!permitidos.has(clave)) throw errores.solicitudInvalida([{ code: 'UNKNOWN_QUERY_PARAM', path: clave }]);
    }
    const hoy = fechaLocalEn(new Date(), ZONA_POR_DEFECTO);
    const fecha = (valor: unknown, porDefecto: string, path: string): string => {
      if (valor === undefined) return porDefecto;
      if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw errores.solicitudInvalida([{ code: 'INVALID_DATE', path }]);
      return valor;
    };
    const hasta = fecha(query.periodEnd, hoy, 'periodEnd');
    const inicioPorDefecto = new Date(`${hasta}T12:00:00Z`);
    inicioPorDefecto.setUTCDate(inicioPorDefecto.getUTCDate() - 89);
    const desde = fecha(query.periodStart, inicioPorDefecto.toISOString().slice(0, 10), 'periodStart');
    if (desde > hasta) throw errores.solicitudInvalida([{ code: 'INVALID_PERIOD', path: 'periodStart' }]);
    const metricas =
      query.metric === undefined
        ? null
        : String(query.metric)
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean);
    return { desde, hasta, metricas: metricas && metricas.length > 0 ? metricas : null };
  }
}

/** Los días sin dato, agrupados en rangos consecutivos. Se dicen todos; lo que cambia es que se dicen una sola vez. */
function huecosDe(fechas: readonly string[]): { from: string; to: string; state: 'NO_DATA'; days: number }[] {
  const rangos: { from: string; to: string; state: 'NO_DATA'; days: number }[] = [];
  for (const fecha of fechas) {
    const ultimo = rangos[rangos.length - 1];
    const siguiente = ultimo ? new Date(`${ultimo.to}T12:00:00Z`) : null;
    if (siguiente) siguiente.setUTCDate(siguiente.getUTCDate() + 1);
    if (ultimo && siguiente && siguiente.toISOString().slice(0, 10) === fecha) {
      rangos[rangos.length - 1] = { ...ultimo, to: fecha, days: ultimo.days + 1 };
    } else {
      rangos.push({ from: fecha, to: fecha, state: 'NO_DATA', days: 1 });
    }
  }
  return rangos;
}
