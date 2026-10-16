import { Injectable } from '@nestjs/common';
import {
  franjaDeLaHora,
  pendientesParaRecordar,
  type Alcance,
  type CorridaDeRecordatoriosResponse,
  type FranjaDeRecordatorio,
  type InstantaneaDeEntrenamiento,
} from '@be/domain';
import type { TipoDeNovedad } from '@prisma/client';
import { PdpService } from '../autorizacion/pdp.service';
import { agendaDeLaVersion } from '../entrenamiento/agenda-del-asesorado';
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

/** Un candidato al recordatorio de entrenamiento, con la versión efectiva de su plan. */
interface CandidatoDeEntrenamiento extends Candidato {
  readonly versionId: string;
}

/** La hora civil de un instante en la zona de BE. */
function horaEn(instante: Date, zona: string): number {
  const texto = new Intl.DateTimeFormat('en-GB', { timeZone: zona, hour: '2-digit', hourCycle: 'h23' }).format(instante);
  return Number(texto);
}

/**
 * Los recordatorios diarios de registro (DL-133 y DL-137; pedidos de Dirección del 2026-10-16): la corrida que llama la
 * tarea programada de la plataforma, tres veces por día (07 §24: «cron administrado de la plataforma llamando un
 * endpoint interno idempotente»).
 * - **10:00 (mañana), solo entrenamiento y solo con agenda:** si hoy toca una sesión que todavía no se hizo, «hoy tenés
 *   una sesión»; y por cada sesión de los dos días anteriores que siguió sin registrar ni saltear, «te quedó pendiente
 *   una sesión del miércoles». Una misma pendiente se recuerda dos mañanas como mucho.
 * - **15:00 (tarde):** a quien activó el recordatorio de comidas, tiene un plan nutricional vigente y hoy todavía no
 *   registró ninguna comida (las anuladas no cuentan, DL-121).
 * - **22:00 (noche):** las comidas, igual; y el entrenamiento solo si hoy tocaba una sesión que sigue sin registrar ni
 *   saltear. Un plan sin agenda no avisa: ya no es «todos los días» (DL-133 D-5 pasó de la opción A a la C).
 * - **Solo si la persona puede registrar de verdad:** la misma evaluación del PDP que decide el acceso, sin registrarla
 *   (vínculo vigente, consentimiento B2 y A3 del titular). Sin eso, el recordatorio pediría algo imposible.
 * - **Idempotente:** cada recordatorio es una novedad única por persona, tipo, día y franja (la pendiente, también por
 *   su fecha y su sesión); repetir la corrida no crea otra. Las novedades salen primero; los avisos, después.
 * - Un recordatorio no lleva datos de salud: dice que hay una sesión o que no hay registros, en el centro propio (UC-P30).
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
      throw new ErrorDeApi(409, 'OPERATION_NOT_READY', 'Los recordatorios corren a las 10:00, a las 15:00 y a las 22:00.');
    }
    const comidas = franja === 'MORNING' ? [] : await this.habilitados(await this.candidatosDeComidas(fecha), 'NUTRICION');
    const entrenamientos = franja === 'AFTERNOON' ? [] : await this.habilitados(await this.candidatosDeEntrenamiento(), 'ENTRENAMIENTO');
    const hechos: HechoParaNovedad[] = [
      ...comidas.map((c) => this.hecho('RECORDATORIO_DE_COMIDAS', c, 'NUTRICION', fecha, `${fecha}|${franja}`)),
      ...(await this.recordatoriosDeEntrenamiento(entrenamientos, fecha, zona, franja)),
    ];
    const procedencia = procedenciaDe(ctx, 'UC-P30', 'TAREA-RECORDATORIOS');
    const creadas = hechos.length === 0 ? 0 : await this.prisma.$transaction((tx) => this.publicador.publicar(tx, hechos, procedencia));
    const pushes = await this.despachador.despachar();
    return { data: { date: fecha, slot: franja, reminders: creadas, pushes } };
  }

  /**
   * DL-137: lo que corresponde a cada uno según la agenda de su plan. A la mañana, la sesión de hoy y las pendientes que
   * todavía se recuerdan; a la noche, la de hoy si sigue sin registrar. Sin agenda, nada.
   */
  private async recordatoriosDeEntrenamiento(
    candidatos: readonly CandidatoDeEntrenamiento[],
    fecha: string,
    zona: string,
    franja: FranjaDeRecordatorio,
  ): Promise<HechoParaNovedad[]> {
    const hechos: HechoParaNovedad[] = [];
    for (const c of candidatos) {
      const v = await this.prisma.versionDePlanDeEntrenamiento.findUnique({
        where: { id: c.versionId },
        select: { momentoDeActivacion: true, instantanea: { select: { contenido: true } } },
      });
      if (!v?.momentoDeActivacion || !v.instantanea) continue;
      const instantanea = v.instantanea.contenido as unknown as InstantaneaDeEntrenamiento;
      const a = await agendaDeLaVersion(this.prisma, c.asesoradoId, { activacion: v.momentoDeActivacion, instantanea }, fecha, zona);
      if (!a) continue;
      const hoySinHacer = a.dia.hoy.some((p) => p.resolvedBy === null);
      if (franja === 'MORNING') {
        if (hoySinHacer) hechos.push(this.hecho('RECORDATORIO_DE_SESION_DEL_DIA', c, 'ENTRENAMIENTO', fecha, `${fecha}|${franja}`));
        for (const p of pendientesParaRecordar(a.dia, fecha)) {
          // La fecha de la novedad es la prevista («del miércoles»); la identidad, esa fecha, la sesión y el día del aviso.
          hechos.push(this.hecho('RECORDATORIO_DE_SESION_PENDIENTE', c, 'ENTRENAMIENTO', p.date, `${p.date}|${p.sessionId}|${fecha}`));
        }
      } else if (franja === 'NIGHT' && hoySinHacer) {
        hechos.push(this.hecho('RECORDATORIO_DE_ENTRENAMIENTO', c, 'ENTRENAMIENTO', fecha, `${fecha}|${franja}`));
      }
    }
    return hechos;
  }

  private hecho(tipo: TipoDeNovedad, c: Candidato, alcance: Alcance, fechaLocal: string, identidadDelHecho: string): HechoParaNovedad {
    return { tipo, destinatarioId: c.asesoradoId, alcance, fuenteId: null, referencia: null, fechaLocal, identidadDelHecho, momentoDeOcurrencia: null };
  }

  /** Los que el PDP dejaría registrar hoy (sin registrar la evaluación: es diagnóstico, como el modo de acceso). */
  private async habilitados<C extends Candidato>(candidatos: readonly C[], alcance: Alcance): Promise<C[]> {
    const habilitados: C[] = [];
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

  /** Con el recordatorio de entrenamiento activo y un plan de entrenamiento vigente (Proceso ABIERTO): la agenda decide. */
  private candidatosDeEntrenamiento(): Promise<CandidatoDeEntrenamiento[]> {
    return this.prisma.$queryRaw<CandidatoDeEntrenamiento[]>`
      SELECT p."identidad_id"::text AS "asesoradoId", pl."profesional_id"::text AS "profesionalId", pl."version_efectiva_id"::text AS "versionId"
        FROM "preferencia_de_recordatorio" p
        JOIN "plan_de_entrenamiento" pl ON pl."asesorado_id" = p."identidad_id" AND pl."version_efectiva_id" IS NOT NULL
        JOIN "proceso_operativo" pr ON pr."profesional_id" = pl."profesional_id" AND pr."asesorado_id" = pl."asesorado_id"
                                    AND pr."alcance" = 'ENTRENAMIENTO' AND pr."estado" = 'ABIERTO'
       WHERE p."tipo" = 'ENTRENAMIENTO' AND p."estado" = 'ACTIVA'`;
  }
}
