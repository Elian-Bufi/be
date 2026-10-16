import { Injectable } from '@nestjs/common';
import {
  RegistrarSuscripcionPushRequestSchema,
  ReemplazarPreferenciasDeAvisosRequestSchema,
  textoDeNovedad,
  vistaDeNovedad,
  type ListaDeNovedadesResponse,
  type Novedad,
  type NovedadResponse,
  type PreferenciasDeAvisosResponse,
  type SuscripcionPushResponse,
} from '@be/domain';
import type { Prisma, TipoDeRecordatorio } from '@prisma/client';
import { procedenciaDe, type ContextoDeSolicitud } from '../http/contexto';
import { errores } from '../http/errores';
import { despuesDelCursor, escribirCursor, leerConsultaDeLista } from '../http/paginacion';
import { validarCuerpo } from '../http/validacion';
import { AuditoriaService } from '../plataforma/auditoria.service';
import { esUuid } from '../plataforma/ejecutor';
import { conReintento } from '../prisma/concurrencia';
import { PrismaService } from '../prisma/prisma.service';
import type { ActorAutenticado } from '../sesion/sesion.guard';
import { nombreDeProfesional, nombreDelPar, nombresDeAsesoradosPorPar } from '../vinculo/lectura';
import { TIPO_API } from './tipos';

type Tx = Prisma.TransactionClient;

const CASO_DE_USO_CENTRO = 'UC-P30';
const CASO_DE_USO_PUSH = 'UC-E08';

const SELECCION = {
  id: true,
  tipo: true,
  alcance: true,
  fuenteId: true,
  fechaLocal: true,
  momentoDeOcurrencia: true,
  momentoDeRegistro: true,
  lectura: { select: { momentoDeRegistro: true } },
} as const satisfies Prisma.NovedadSelect;
type FilaDeNovedad = Prisma.NovedadGetPayload<{ select: typeof SELECCION }>;

/**
 * El centro de novedades (RF-061; UC-P30) y lo propio de los avisos (RF-062; UC-E08): API-NOV-01 a 06 (DL-133).
 * - **Solo lo propio.** Cada actor lee sus novedades, sus teléfonos y sus preferencias; no hay titular en la ruta y una
 *   novedad ajena es el mismo 404 que una inexistente. No son datos de salud: no decide el PDP (como el perfil propio).
 * - **El texto se arma al leer** (copy de @be/domain) con el nombre que este actor puede ver de quien la originó: el del
 *   perfil profesional, o el visible del asesorado solo con un vínculo vigente entre los dos (DL-040).
 * - **Abrir registra la primera lectura** (UC-P30, paso 6), una sola vez.
 * - Las escrituras (suscripción y preferencias) quedan en la auditoría de la misma transacción, sin el token.
 */
@Injectable()
export class NovedadesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ─── API-NOV-01 ──────────────────────────────────────────────────────────────────────────────
  async listar(actor: ActorAutenticado, query: Record<string, unknown>): Promise<ListaDeNovedadesResponse> {
    const consulta = leerConsultaDeLista(query, {});
    return conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const filas = await tx.novedad.findMany({
          where: { destinatarioId: actor.identidadId, ...despuesDelCursor(consulta.cursor) },
          orderBy: [{ momentoDeRegistro: 'desc' }, { id: 'desc' }],
          take: consulta.limit + 1,
          select: SELECCION,
        });
        const hayMas = filas.length > consulta.limit;
        const pagina = filas.slice(0, consulta.limit);
        const ultima = pagina[pagina.length - 1];
        const sinLeer = await tx.novedad.count({ where: { destinatarioId: actor.identidadId, lectura: { is: null } } });
        return {
          data: await componer(tx, actor.identidadId, pagina),
          page: { limit: consulta.limit, nextCursor: hayMas && ultima ? escribirCursor(ultima.momentoDeRegistro, ultima.id) : null, hasMore: hayMas },
          unreadCount: sinLeer,
        };
      }),
    );
  }

  // ─── API-NOV-02 ──────────────────────────────────────────────────────────────────────────────
  async abrir(actor: ActorAutenticado, newsId: string, ctx: ContextoDeSolicitud): Promise<NovedadResponse> {
    if (!esUuid(newsId)) throw errores.recursoNoEncontrado();
    return conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const fila = await tx.novedad.findFirst({ where: { id: newsId.toLowerCase(), destinatarioId: actor.identidadId }, select: SELECCION });
        if (!fila) throw errores.recursoNoEncontrado();
        if (!fila.lectura) {
          // La primera lectura; dos aperturas simultáneas dejan una sola (la clave es la novedad).
          await tx.lecturaDeNovedad.createMany({
            data: [{ novedadId: fila.id, procedencia: procedenciaDe(ctx, CASO_DE_USO_CENTRO, 'API-NOV-02') as unknown as Prisma.InputJsonValue }],
            skipDuplicates: true,
          });
        }
        const leida = await tx.novedad.findUniqueOrThrow({ where: { id: fila.id }, select: SELECCION });
        const [item] = await componer(tx, actor.identidadId, [leida]);
        return { data: item! };
      }),
    );
  }

  // ─── API-NOV-03 ──────────────────────────────────────────────────────────────────────────────
  async registrarSuscripcion(actor: ActorAutenticado, deviceId: string, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<SuscripcionPushResponse> {
    if (!esUuid(deviceId)) throw errores.solicitudInvalida([{ code: 'INVALID_DEVICE_ID', path: 'deviceId' }]);
    const pedido = validarCuerpo(RegistrarSuscripcionPushRequestSchema, cuerpo);
    const dispositivoId = deviceId.toLowerCase();
    const procedencia = procedenciaDe(ctx, CASO_DE_USO_PUSH, 'API-NOV-03') as unknown as Prisma.InputJsonValue;
    return conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        // El teléfono, bloqueado: dos registros simultáneos del mismo teléfono se ordenan acá (y el índice parcial lo sostiene).
        const [vigente] = await tx.$queryRaw<{ id: string; identidadId: string; token: string; momentoDeAlta: Date }[]>`
          SELECT "id"::text AS "id", "identidad_id"::text AS "identidadId", "token", "momento_de_alta" AS "momentoDeAlta"
            FROM "suscripcion_push" WHERE "dispositivo_id" = ${dispositivoId}::uuid AND "momento_de_baja" IS NULL FOR UPDATE`;
        if (vigente && vigente.identidadId === actor.identidadId && vigente.token === pedido.expoPushToken) {
          return { data: { deviceId: dispositivoId, platform: 'ANDROID' as const, registeredAt: vigente.momentoDeAlta.toISOString() } };
        }
        if (vigente) {
          const motivo = vigente.identidadId === actor.identidadId ? 'REEMPLAZADA' : 'OTRA_CUENTA';
          await tx.suscripcionPush.update({ where: { id: vigente.id }, data: { momentoDeBaja: new Date(), motivoDeBaja: motivo } });
        }
        // El mismo token vigente en otro registro (la app se reinstaló con otro identificador): ese queda reemplazado,
        // así un teléfono no recibe dos veces el mismo aviso ni los de una cuenta que ya no usa.
        await tx.suscripcionPush.updateMany({
          where: { token: pedido.expoPushToken, momentoDeBaja: null },
          data: { momentoDeBaja: new Date(), motivoDeBaja: 'REEMPLAZADA' },
        });
        const nueva = await tx.suscripcionPush.create({
          data: { identidadId: actor.identidadId, dispositivoId, token: pedido.expoPushToken, plataforma: 'ANDROID', procedencia },
        });
        await this.auditar(tx, 'API-NOV-03', actor, ctx, 'SuscripcionPush', nueva.id);
        return { data: { deviceId: dispositivoId, platform: 'ANDROID' as const, registeredAt: nueva.momentoDeAlta.toISOString() } };
      }),
    );
  }

  // ─── API-NOV-04 ──────────────────────────────────────────────────────────────────────────────
  async retirarSuscripcion(actor: ActorAutenticado, deviceId: string, ctx: ContextoDeSolicitud): Promise<void> {
    if (!esUuid(deviceId)) throw errores.solicitudInvalida([{ code: 'INVALID_DEVICE_ID', path: 'deviceId' }]);
    await conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const vigentes = await tx.suscripcionPush.findMany({
          where: { dispositivoId: deviceId.toLowerCase(), identidadId: actor.identidadId, momentoDeBaja: null },
          select: { id: true },
        });
        // Idempotente por semántica: sin una vigente de esta cuenta en ese teléfono, no hay nada que retirar.
        for (const s of vigentes) {
          await tx.suscripcionPush.update({ where: { id: s.id }, data: { momentoDeBaja: new Date(), motivoDeBaja: 'RETIRADA' } });
          await this.auditar(tx, 'API-NOV-04', actor, ctx, 'SuscripcionPush', s.id);
        }
      }),
    );
  }

  // ─── API-NOV-05 ──────────────────────────────────────────────────────────────────────────────
  async preferencias(actor: ActorAutenticado): Promise<PreferenciasDeAvisosResponse> {
    return this.leerPreferencias(this.prisma, actor.identidadId);
  }

  // ─── API-NOV-06 ──────────────────────────────────────────────────────────────────────────────
  async reemplazarPreferencias(actor: ActorAutenticado, cuerpo: unknown, ctx: ContextoDeSolicitud): Promise<PreferenciasDeAvisosResponse> {
    const pedido = validarCuerpo(ReemplazarPreferenciasDeAvisosRequestSchema, cuerpo);
    const procedencia = procedenciaDe(ctx, CASO_DE_USO_PUSH, 'API-NOV-06') as unknown as Prisma.InputJsonValue;
    return conReintento(() =>
      this.prisma.$transaction(async (tx) => {
        const deseadas: [TipoDeRecordatorio, boolean][] = [
          ['COMIDAS', pedido.mealLogReminder],
          ['ENTRENAMIENTO', pedido.trainingLogReminder],
        ];
        let cambio = false;
        for (const [tipo, activa] of deseadas) {
          const estado = activa ? 'ACTIVA' : 'INACTIVA';
          const actual = await tx.preferenciaDeRecordatorio.findUnique({ where: { identidadId_tipo: { identidadId: actor.identidadId, tipo } } });
          // Sin fila es «apagado»: apagar algo que nunca se prendió no escribe nada.
          if ((actual?.estado ?? 'INACTIVA') === estado) continue;
          await tx.preferenciaDeRecordatorio.upsert({
            where: { identidadId_tipo: { identidadId: actor.identidadId, tipo } },
            create: { identidadId: actor.identidadId, tipo, estado, procedencia },
            update: { estado, procedencia, momentoDeActualizacion: new Date() },
          });
          cambio = true;
        }
        if (cambio) await this.auditar(tx, 'API-NOV-06', actor, ctx, 'PreferenciaDeRecordatorio', actor.identidadId);
        return this.leerPreferencias(tx, actor.identidadId);
      }),
    );
  }

  private async leerPreferencias(cliente: Tx | PrismaService, identidadId: string): Promise<PreferenciasDeAvisosResponse> {
    const filas = await cliente.preferenciaDeRecordatorio.findMany({ where: { identidadId } });
    const activa = (tipo: TipoDeRecordatorio) => filas.some((f) => f.tipo === tipo && f.estado === 'ACTIVA');
    const ultima = filas.reduce<Date | null>((m, f) => (m === null || f.momentoDeActualizacion > m ? f.momentoDeActualizacion : m), null);
    return { data: { mealLogReminder: activa('COMIDAS'), trainingLogReminder: activa('ENTRENAMIENTO'), updatedAt: ultima?.toISOString() ?? null } };
  }

  private auditar(tx: Tx, operacion: string, actor: ActorAutenticado, ctx: ContextoDeSolicitud, recursoTipo: string, recursoId: string): Promise<void> {
    return this.auditoria.registrar(
      {
        operacion,
        resultado: 'EXITO',
        actorId: actor.identidadId,
        sujetoId: actor.identidadId,
        recursoTipo,
        recursoId,
        superficie: ctx.superficie,
        requestId: ctx.requestId,
        momentoDeOcurrencia: ctx.momentoDeRecepcion,
      },
      tx,
    );
  }
}

/**
 * Las novedades como las ve su destinatario. Quién originó cada una se nombra según la relación entre los dos: si el
 * lector tiene (o tuvo) a esa persona como asesorada, por la regla de DL-040; si no, esa persona es su profesional, y
 * va el nombre de su perfil profesional.
 */
async function componer(tx: Tx, lectorId: string, filas: readonly FilaDeNovedad[]): Promise<Novedad[]> {
  const fuentes = [...new Set(filas.map((f) => f.fuenteId).filter((x): x is string => x !== null))];
  const asesoradosDelLector = new Set<string>();
  const nombresDeProfesionales = new Map<string, string>();
  let nombresDeAsesorados = new Map<string, string>();
  if (fuentes.length > 0) {
    const propios = await tx.$queryRaw<{ id: string }[]>`
      SELECT f."id"::text AS "id" FROM unnest(${fuentes}::uuid[]) AS f("id")
       WHERE EXISTS (SELECT 1 FROM "vinculo" v WHERE v."profesional_id" = ${lectorId}::uuid AND v."asesorado_id" = f."id")
          OR EXISTS (SELECT 1 FROM "solicitud_de_vinculo" s WHERE s."profesional_id" = ${lectorId}::uuid AND s."asesorado_id" = f."id")`;
    for (const p of propios) asesoradosDelLector.add(p.id);
    const profesionales = fuentes.filter((f) => !asesoradosDelLector.has(f));
    if (profesionales.length > 0) {
      const perfiles = await tx.perfilProfesional.findMany({ where: { identidadId: { in: profesionales } }, select: { identidadId: true, nombreVisible: true } });
      for (const p of perfiles) nombresDeProfesionales.set(p.identidadId, nombreDeProfesional(p));
    }
    nombresDeAsesorados = await nombresDeAsesoradosPorPar(tx, [...asesoradosDelLector].map((a) => ({ profesionalId: lectorId, asesoradoId: a })));
  }
  return filas.map((f) => {
    const tipo = TIPO_API[f.tipo];
    const lectorEsProfesional = f.fuenteId !== null && asesoradosDelLector.has(f.fuenteId);
    const fuente =
      f.fuenteId === null
        ? null
        : lectorEsProfesional
          ? nombreDelPar(nombresDeAsesorados, { profesionalId: lectorId, asesoradoId: f.fuenteId })
          : (nombresDeProfesionales.get(f.fuenteId) ?? nombreDeProfesional(null));
    const texto = textoDeNovedad(tipo, { alcance: f.alcance, fuente });
    const vista = vistaDeNovedad(tipo, f.alcance, lectorEsProfesional);
    return {
      newsId: f.id,
      kind: tipo,
      scope: f.alcance,
      source: f.fuenteId === null ? null : { identityId: f.fuenteId, displayName: fuente as string },
      title: texto.title,
      body: texto.body,
      date: f.fechaLocal ? f.fechaLocal.toISOString().slice(0, 10) : null,
      occurredAt: f.momentoDeOcurrencia?.toISOString() ?? null,
      recordedAt: f.momentoDeRegistro.toISOString(),
      readAt: f.lectura?.momentoDeRegistro.toISOString() ?? null,
      open: { view: vista, referenceId: vista === 'ADVISEE' ? f.fuenteId : null },
    };
  });
}
