import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { textoDelAvisoPush, TITULO_DEL_AVISO_PUSH } from '@be/domain';
import type { TipoDeNovedad } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CanalExpo, type MensajeExpo, type ResultadoDeMensaje } from './canal-expo';
import { TIPO_API } from './tipos';

export interface ResumenDeDespacho {
  readonly sent: number;
  readonly rejected: number;
  readonly unanswered: number;
}

/** Solo se avisa lo reciente: una novedad de hace más de un día ya no es una novedad para un aviso. */
const VENTANA_HORAS = 24;
/** Un aviso sin respuesta se reintenta en las pasadas siguientes, hasta tres veces en total. */
const MAX_INTENTOS = 3;
/** Pares (teléfono, novedad) por pasada. */
const LOTE = 500;
/** Cuándo mira el despachador después de que se publica una novedad: enseguida y, por si la transacción tardó, un rato después. */
const ESPERAS_MS = [2_000, 20_000] as const;

interface Par {
  readonly suscripcionId: string;
  readonly token: string;
  readonly novedadId: string;
  readonly tipo: TipoDeNovedad;
  readonly avisoId: string | null;
}

/**
 * El despachador de los avisos push (RF-062; UC-E08; 06 §5.11.4). Corre **fuera de toda transacción de dominio**
 * (07 §24: «post-commit, best-effort»): mira las novedades de las últimas 24 horas que un teléfono suscripto todavía no
 * recibió y que la persona todavía no abrió, y manda **un aviso por teléfono**, que nombra a la más nueva (las demás
 * quedan AGRUPADA). El texto no dice nada del contenido (REG-06-30).
 * - **Una pasada a la vez.** Si piden otra mientras corre, se encadena al terminar.
 * - **Tomar antes de mandar.** Cada par se toma (EN_CURSO) con un INSERT o un UPDATE condicionado: dos pasadas no mandan
 *   el mismo aviso. Uno que quedó EN_CURSO más de 5 minutos (la API se reinició en el medio) vuelve a intentarse.
 * - **Sin respuesta** (timeout, 5xx, 429): se reintenta en las pasadas siguientes, hasta tres intentos.
 * - **Rechazado** por `DeviceNotRegistered`: ese teléfono ya no sirve, y su suscripción se da de baja (TOKEN_INVALIDO).
 * Con el canal desactivado no hace nada: ni consultas.
 */
@Injectable()
export class DespachadorDeAvisos implements OnModuleDestroy {
  private readonly log = new Logger('Avisos');
  private readonly programadas = new Map<number, NodeJS.Timeout>();
  private enCurso: Promise<ResumenDeDespacho> | null = null;
  private otraVez = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly canal: CanalExpo,
  ) {}

  /** Programa las pasadas de después de publicar. Si ya hay una esperando en cada espera, no agrega otra. */
  programar(): void {
    if (!this.canal.activo) return;
    for (const ms of ESPERAS_MS) {
      if (this.programadas.has(ms)) continue;
      const t = setTimeout(() => {
        this.programadas.delete(ms);
        this.despachar().catch((e: unknown) => this.log.warn(`pasada fallida: ${e instanceof Error ? e.name : 'desconocido'}`));
      }, ms);
      t.unref?.();
      this.programadas.set(ms, t);
    }
  }

  onModuleDestroy(): void {
    for (const t of this.programadas.values()) clearTimeout(t);
    this.programadas.clear();
  }

  async despachar(): Promise<ResumenDeDespacho> {
    if (!this.canal.activo) return { sent: 0, rejected: 0, unanswered: 0 };
    if (this.enCurso) {
      this.otraVez = true;
      return this.enCurso;
    }
    this.enCurso = this.pasada().finally(() => {
      this.enCurso = null;
    });
    const resumen = await this.enCurso;
    if (this.otraVez) {
      this.otraVez = false;
      this.despachar().catch(() => undefined);
    }
    return resumen;
  }

  private async pasada(): Promise<ResumenDeDespacho> {
    const pares = await this.prisma.$queryRaw<Par[]>`
      SELECT s."id"::text AS "suscripcionId", s."token", n."id"::text AS "novedadId", n."tipo" AS "tipo", a."id"::text AS "avisoId"
        FROM "suscripcion_push" s
        JOIN "novedad" n ON n."destinatario_id" = s."identidad_id"
                        AND n."momento_de_registro" >= s."momento_de_alta"
                        AND n."momento_de_registro" >= now() - make_interval(hours => ${VENTANA_HORAS}::int)
        LEFT JOIN "aviso_push" a ON a."novedad_id" = n."id" AND a."suscripcion_id" = s."id"
       WHERE s."momento_de_baja" IS NULL
         AND NOT EXISTS (SELECT 1 FROM "lectura_de_novedad" l WHERE l."novedad_id" = n."id")
         AND (a."id" IS NULL
              OR (a."estado" = 'SIN_RESPUESTA' AND a."intentos" < ${MAX_INTENTOS}::int)
              OR (a."estado" = 'EN_CURSO' AND a."momento_de_intento" < now() - interval '5 minutes' AND a."intentos" < ${MAX_INTENTOS}::int))
       ORDER BY s."id", n."momento_de_registro" DESC, n."id" DESC
       LIMIT ${LOTE}::int`;
    if (pares.length === 0) return { sent: 0, rejected: 0, unanswered: 0 };

    const tomados = await this.tomar(pares);
    if (tomados.length === 0) return { sent: 0, rejected: 0, unanswered: 0 };

    // Un aviso por teléfono: el primero de cada grupo es la novedad más nueva (por el ORDER BY).
    const grupos = new Map<string, Par[]>();
    for (const p of tomados) grupos.set(p.suscripcionId, [...(grupos.get(p.suscripcionId) ?? []), p]);
    const lista = [...grupos.values()];
    const mensajes: MensajeExpo[] = lista.map((g) => ({
      to: g[0]!.token,
      title: TITULO_DEL_AVISO_PUSH,
      body: textoDelAvisoPush(g.map((p) => TIPO_API[p.tipo])),
      data: { type: 'NEW_INTERNAL_UPDATE', referenceId: g[0]!.novedadId },
    }));
    const resultados = await this.canal.enviar(mensajes);

    let sent = 0;
    let rejected = 0;
    let unanswered = 0;
    const estados: { novedadId: string; suscripcionId: string; estado: string; ticket: string | null; detalle: string | null }[] = [];
    const tokensInvalidos: string[] = [];
    lista.forEach((g, i) => {
      const r: ResultadoDeMensaje = resultados[i] ?? { estado: 'SIN_RESPUESTA', detalle: 'sin resultado' };
      if (r.estado === 'ENVIADO') sent += 1;
      else if (r.estado === 'RECHAZADO') rejected += 1;
      else unanswered += 1;
      g.forEach((p, j) => {
        const principal = j === 0;
        if (r.estado === 'ENVIADO') estados.push({ ...p, estado: principal ? 'ENVIADO' : 'AGRUPADO', ticket: principal ? r.ticket : null, detalle: null });
        else estados.push({ ...p, estado: r.estado, ticket: null, detalle: r.detalle });
      });
      if (r.estado === 'RECHAZADO' && r.detalle === 'DeviceNotRegistered') tokensInvalidos.push(g[0]!.suscripcionId);
    });

    await this.prisma.$executeRaw`
      UPDATE "aviso_push" a
         SET "estado" = x."estado"::"EstadoDeAvisoPush", "ticket" = x."ticket", "detalle" = x."detalle"
        FROM unnest(${estados.map((e) => e.novedadId)}::uuid[], ${estados.map((e) => e.suscripcionId)}::uuid[], ${estados.map((e) => e.estado)}::text[],
                    ${estados.map((e) => e.ticket)}::text[], ${estados.map((e) => e.detalle)}::text[]) AS x("novedad", "suscripcion", "estado", "ticket", "detalle")
       WHERE a."novedad_id" = x."novedad" AND a."suscripcion_id" = x."suscripcion" AND a."estado" = 'EN_CURSO'`;
    if (tokensInvalidos.length > 0) {
      await this.prisma.$executeRaw`
        UPDATE "suscripcion_push" SET "momento_de_baja" = now(), "motivo_de_baja" = 'TOKEN_INVALIDO'
         WHERE "id" = ANY(${tokensInvalidos}::uuid[]) AND "momento_de_baja" IS NULL`;
    }
    // Solo cantidades: nunca un token ni una persona (08 §32).
    if (rejected + unanswered > 0) this.log.warn(`avisos: ${sent} enviados, ${rejected} rechazados, ${unanswered} sin respuesta`);
    return { sent, rejected, unanswered };
  }

  /** Toma los pares: los nuevos con un INSERT, los que se reintentan con un UPDATE condicionado. Devuelve los tomados. */
  private async tomar(pares: readonly Par[]): Promise<Par[]> {
    const nuevos = pares.filter((p) => p.avisoId === null);
    const reintentos = pares.filter((p) => p.avisoId !== null);
    const tomados = new Set<string>();
    if (nuevos.length > 0) {
      const filas = await this.prisma.$queryRaw<{ novedad: string; suscripcion: string }[]>`
        INSERT INTO "aviso_push" ("novedad_id", "suscripcion_id", "estado", "momento_de_intento")
        SELECT x."novedad", x."suscripcion", 'EN_CURSO', now()
          FROM unnest(${nuevos.map((p) => p.novedadId)}::uuid[], ${nuevos.map((p) => p.suscripcionId)}::uuid[]) AS x("novedad", "suscripcion")
        ON CONFLICT ("novedad_id", "suscripcion_id") DO NOTHING
        RETURNING "novedad_id"::text AS "novedad", "suscripcion_id"::text AS "suscripcion"`;
      for (const f of filas) tomados.add(`${f.novedad}|${f.suscripcion}`);
    }
    if (reintentos.length > 0) {
      const filas = await this.prisma.$queryRaw<{ novedad: string; suscripcion: string }[]>`
        UPDATE "aviso_push" SET "estado" = 'EN_CURSO', "intentos" = "intentos" + 1, "momento_de_intento" = now()
         WHERE "id" = ANY(${reintentos.map((p) => p.avisoId as string)}::uuid[]) AND "intentos" < ${MAX_INTENTOS}::int
           AND ("estado" = 'SIN_RESPUESTA' OR ("estado" = 'EN_CURSO' AND "momento_de_intento" < now() - interval '5 minutes'))
        RETURNING "novedad_id"::text AS "novedad", "suscripcion_id"::text AS "suscripcion"`;
      for (const f of filas) tomados.add(`${f.novedad}|${f.suscripcion}`);
    }
    return pares.filter((p) => tomados.has(`${p.novedadId}|${p.suscripcionId}`));
  }
}
