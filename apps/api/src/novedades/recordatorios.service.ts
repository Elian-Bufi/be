import { Injectable } from '@nestjs/common';
import { franjaDeLaHora, type Alcance, type CorridaDeRecordatoriosResponse, type FranjaDeRecordatorio } from '@be/domain';
import { PdpService } from '../autorizacion/pdp.service';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import { fechaLocalEn, ZONA_POR_DEFECTO } from '../nutricion/zona';
import { momentoDeLaBase } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import { DespachadorDeAvisos } from './despachador';
import { PublicadorDeNovedades, type HechoParaNovedad } from './publicador';

interface Candidato {
  readonly asesoradoId: string;
  readonly profesionalId: string;
}

/** La hora civil de un instante en la zona de BE. */
function horaEn(instante: Date, zona: string): number {
  const texto = new Intl.DateTimeFormat('en-GB', { timeZone: zona, hour: '2-digit', hourCycle: 'h23' }).format(instante);
  return Number(texto);
}

/**
 * Los recordatorios diarios de registro (DL-133; pedido de Dirección del 2026-10-16): la corrida que llama la tarea
 * programada de la plataforma, dos veces por día (07 §24: «cron administrado de la plataforma llamando un endpoint
 * interno idempotente»).
 * - **15:00 (tarde):** a quien activó el recordatorio de comidas, tiene un plan nutricional vigente y hoy todavía no
 *   registró ninguna comida (las anuladas no cuentan, DL-121).
 * - **22:00 (noche):** lo mismo, y el de entrenamiento: plan de entrenamiento vigente y ninguna sesión registrada hoy.
 * - **Solo si la persona puede registrar de verdad:** la misma evaluación del PDP que decide el acceso, sin registrarla
 *   (vínculo vigente, consentimiento B2 y A3 del titular). Sin eso, el recordatorio pediría algo imposible.
 * - **Idempotente:** cada recordatorio es una novedad única por persona, tipo, día y franja; repetir la corrida no crea
 *   otra. Las novedades salen primero; los avisos, después, con el despachador.
 * - Un recordatorio no lleva datos de salud: dice que hoy no hay registros, en el centro propio (UC-P30).
 */
@Injectable()
export class RecordatoriosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdp: PdpService,
    private readonly publicador: PublicadorDeNovedades,
    private readonly despachador: DespachadorDeAvisos,
  ) {}

  async correr(franjaPedida: FranjaDeRecordatorio | null, ctx: ContextoDeSolicitud): Promise<CorridaDeRecordatoriosResponse> {
    const ahora = await momentoDeLaBase(this.prisma);
    const zona = ZONA_POR_DEFECTO;
    const fecha = fechaLocalEn(ahora, zona);
    const franja = franjaPedida ?? franjaDeLaHora(horaEn(ahora, zona));
    if (franja === null) {
      throw new ErrorDeApi(409, 'OPERATION_NOT_READY', 'Los recordatorios corren a las 15:00 y a las 22:00.');
    }
    const comidas = await this.candidatosDeComidas(fecha);
    const entrenamientos = franja === 'NIGHT' ? await this.candidatosDeEntrenamiento(fecha) : [];
    const hechos: HechoParaNovedad[] = [
      ...(await this.habilitados(comidas, 'NUTRICION')).map((c) => this.hecho('RECORDATORIO_DE_COMIDAS', c, 'NUTRICION', fecha, franja)),
      ...(await this.habilitados(entrenamientos, 'ENTRENAMIENTO')).map((c) => this.hecho('RECORDATORIO_DE_ENTRENAMIENTO', c, 'ENTRENAMIENTO', fecha, franja)),
    ];
    const procedencia = procedenciaDe(ctx, 'UC-P30', 'TAREA-RECORDATORIOS');
    const creadas = hechos.length === 0 ? 0 : await this.prisma.$transaction((tx) => this.publicador.publicar(tx, hechos, procedencia));
    const pushes = await this.despachador.despachar();
    return { data: { date: fecha, slot: franja, reminders: creadas, pushes } };
  }

  private hecho(
    tipo: 'RECORDATORIO_DE_COMIDAS' | 'RECORDATORIO_DE_ENTRENAMIENTO',
    c: Candidato,
    alcance: Alcance,
    fecha: string,
    franja: FranjaDeRecordatorio,
  ): HechoParaNovedad {
    return { tipo, destinatarioId: c.asesoradoId, alcance, fuenteId: null, referencia: null, fechaLocal: fecha, identidadDelHecho: `${fecha}|${franja}`, momentoDeOcurrencia: null };
  }

  /** Los que el PDP dejaría registrar hoy (sin registrar la evaluación: es diagnóstico, como el modo de acceso). */
  private async habilitados(candidatos: readonly Candidato[], alcance: Alcance): Promise<Candidato[]> {
    const habilitados: Candidato[] = [];
    for (const c of candidatos) {
      const decision = await this.pdp.evaluarSinRegistrar(this.prisma, c.profesionalId, c.asesoradoId, alcance);
      if (decision.permitida) habilitados.push(c);
    }
    return habilitados;
  }

  /** Con el recordatorio de comidas activo, un plan nutricional vigente (Proceso ABIERTO) y ninguna comida hoy. */
  private candidatosDeComidas(fecha: string): Promise<Candidato[]> {
    return this.prisma.$queryRaw<Candidato[]>`
      SELECT p."identidad_id"::text AS "asesoradoId", pl."profesional_id"::text AS "profesionalId"
        FROM "preferencia_de_recordatorio" p
        JOIN "plan_nutricional" pl ON pl."asesorado_id" = p."identidad_id" AND pl."version_efectiva_id" IS NOT NULL
        JOIN "proceso_operativo" pr ON pr."profesional_id" = pl."profesional_id" AND pr."asesorado_id" = pl."asesorado_id"
                                    AND pr."alcance" = 'NUTRICION' AND pr."estado" = 'ABIERTO'
       WHERE p."tipo" = 'COMIDAS' AND p."estado" = 'ACTIVA'
         AND NOT EXISTS (
           SELECT 1 FROM "ingesta_nutricional" i
            WHERE i."asesorado_id" = p."identidad_id" AND i."fecha_local" = ${fecha}::date
              AND NOT EXISTS (SELECT 1 FROM "anulacion_de_ingesta" a WHERE a."ingesta_id" = i."id"))`;
  }

  /** Con el recordatorio de entrenamiento activo, un plan de entrenamiento vigente y ninguna sesión registrada hoy. */
  private candidatosDeEntrenamiento(fecha: string): Promise<Candidato[]> {
    return this.prisma.$queryRaw<Candidato[]>`
      SELECT p."identidad_id"::text AS "asesoradoId", pl."profesional_id"::text AS "profesionalId"
        FROM "preferencia_de_recordatorio" p
        JOIN "plan_de_entrenamiento" pl ON pl."asesorado_id" = p."identidad_id" AND pl."version_efectiva_id" IS NOT NULL
        JOIN "proceso_operativo" pr ON pr."profesional_id" = pl."profesional_id" AND pr."asesorado_id" = pl."asesorado_id"
                                    AND pr."alcance" = 'ENTRENAMIENTO' AND pr."estado" = 'ABIERTO'
       WHERE p."tipo" = 'ENTRENAMIENTO' AND p."estado" = 'ACTIVA'
         AND NOT EXISTS (SELECT 1 FROM "ejecucion_de_entrenamiento" e WHERE e."asesorado_id" = p."identidad_id" AND e."fecha_local" = ${fecha}::date)`;
  }
}
