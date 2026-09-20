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
        const { observaciones, fichasPorMedicion } = await this.observaciones(tx, titular, desde, hasta);
        const fechas = fechasDelPeriodo(desde, hasta);
        const pedidas = metricas ?? [...new Set(observaciones.map((o) => o.metrica))].sort();

        return {
          data: {
            adviseeId: titular,
            period: { start: desde, end: hasta, timeZone: ZONA_POR_DEFECTO },
            series: pedidas.map((metrica) => {
              const serie = construirSerie(metrica, fechas, observaciones);
              return {
                metric: metrica,
                points: serie.puntos.map((p) =>
                  p.disponibilidad === 'SIN_DATO'
                    ? { date: p.fechaLocal, availability: 'NO_DATA' as const }
                    : {
                        date: p.fechaLocal,
                        availability: 'AVAILABLE' as const,
                        magnitude: { value: p.magnitud.valor, unit: p.magnitud.unidad },
                        dataClass: CLASE_DE_DATO_API[p.clase],
                        sourceId: p.origenId,
                        comparability: fichasPorMedicion.get(p.origenId)!,
                        incomparableWithPrevious: p.incomparableConElAnterior.map((m) => MOTIVO_API[m]),
                      },
                ),
                missingData: serie.puntos.filter((p) => p.disponibilidad === 'SIN_DATO').map((p) => p.fechaLocal),
              };
            }),
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
  private async observaciones(tx: Tx, titular: string, desde: string, hasta: string): Promise<{ observaciones: ObservacionDeSerie[]; fichasPorMedicion: Map<string, ReturnType<typeof fichaDe>> }> {
    const filas = await tx.medicionAntropometrica.findMany({
      where: {
        evaluacion: { asesoradoId: titular, estado: 'REGISTRADA' },
        // La ventana se recorta en la **misma zona** en la que después se ubica cada punto. Mezclar UTC acá y hora
        // local allá deja afuera las mediciones de la tarde del último día, que saldrían como «sin dato» (INV-06-177).
        momentoDeOcurrencia: { gte: inicioDelDiaLocal(desde, ZONA_POR_DEFECTO), lt: finDelDiaLocal(hasta, ZONA_POR_DEFECTO) },
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
    return { observaciones, fichasPorMedicion };
  }

  private leerConsulta(query: Record<string, unknown>): { desde: string; hasta: string; metricas: string[] | null } {
    const permitidos = new Set(['from', 'to', 'metrics']);
    for (const clave of Object.keys(query)) {
      if (!permitidos.has(clave)) throw errores.solicitudInvalida([{ code: 'UNKNOWN_QUERY_PARAM', path: clave }]);
    }
    const hoy = fechaLocalEn(new Date(), ZONA_POR_DEFECTO);
    const fecha = (valor: unknown, porDefecto: string, path: string): string => {
      if (valor === undefined) return porDefecto;
      if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) throw errores.solicitudInvalida([{ code: 'INVALID_DATE', path }]);
      return valor;
    };
    const hasta = fecha(query.to, hoy, 'to');
    const inicioPorDefecto = new Date(`${hasta}T12:00:00Z`);
    inicioPorDefecto.setUTCDate(inicioPorDefecto.getUTCDate() - 89);
    const desde = fecha(query.from, inicioPorDefecto.toISOString().slice(0, 10), 'from');
    if (desde > hasta) throw errores.solicitudInvalida([{ code: 'INVALID_PERIOD', path: 'from' }]);
    const metricas =
      query.metrics === undefined
        ? null
        : String(query.metrics)
            .split(',')
            .map((m) => m.trim())
            .filter(Boolean);
    return { desde, hasta, metricas: metricas && metricas.length > 0 ? metricas : null };
  }
}
