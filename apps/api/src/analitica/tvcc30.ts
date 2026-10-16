import { createHash } from 'node:crypto';
import {
  calcularTvcc30,
  canonicoTvcc30,
  SPEC_TVCC30_V1,
  ventanaTvcc30,
  type EspecificacionTvcc30,
  type HistoriaDelAlcanceTvcc30,
  type ProcesoTvcc30,
  type ResultadoTvcc30,
  type RevisionTvcc30,
} from '@be/domain';
import type { Prisma } from '@prisma/client';

type Cliente = Prisma.TransactionClient;

/**
 * M-12 Analítica (07 §24; RF-058 · UC-S01; DEUDA_LEGAJO DL-135): la TVCC-30 se calcula a pedido desde los hechos del
 * dominio, no desde la telemetría (07 §42.1), y no se expone por HTTP: el 09 la declara ANA-P1 «internal/reproducible» y
 * deja el HTTP para cuando el 12 cierre la especificación (TRACE-DEBT-12-001). La regla vive en `@be/domain`
 * (`tvcc30.ts`); acá solo se leen los hechos y se conserva el resultado.
 *
 * Se leen solo hechos registrados antes del fin exclusivo de la ventana, así el resultado de un corte no cambia con lo
 * que se registra después (12 §22). Nada de lo que se lee es contenido clínico: estados, fechas, identificadores y el
 * resultado de cada revisión.
 */
export async function leerHechosTvcc30(cliente: Cliente, fin: Date): Promise<{ procesos: ProcesoTvcc30[]; vinculos: HistoriaDelAlcanceTvcc30[] }> {
  const procesos = await cliente.$queryRaw<{ id: string; alcance: string; profesionalId: string; asesoradoId: string }[]>`
    SELECT p."id"::text AS "id", p."alcance"::text AS "alcance", p."profesional_id"::text AS "profesionalId", p."asesorado_id"::text AS "asesoradoId"
      FROM "proceso_operativo" p
     WHERE p."momento_de_registro" < ${fin}`;
  // REG-06-145/146: la cadena de expectativas. La fuente dice si la fijó una revisión o una versión de plan.
  const expectativas = await cliente.$queryRaw<
    { id: string; procesoId: string; predecesoraId: string | null; fechaObjetivo: Date | null; registradaEn: Date; revisionId: string | null; versionDePlanId: string | null }[]
  >`
    SELECT pr."id"::text AS "id", pr."proceso_id"::text AS "procesoId", pr."predecesora_id"::text AS "predecesoraId",
           pr."fecha_objetivo" AS "fechaObjetivo", pr."momento_de_registro" AS "registradaEn",
           COALESCE(pr."revision_id", pr."revision_de_entrenamiento_id")::text AS "revisionId",
           COALESCE(pr."version_de_plan_id", pr."version_de_plan_de_entrenamiento_id")::text AS "versionDePlanId"
      FROM "proxima_revision" pr
     WHERE pr."momento_de_registro" < ${fin}`;
  // UC-I05 y UC-I06: cada revisión y, si se aplicó, el evento ContinuidadOCierreAplicado que la aplicación enlaza.
  const revisiones = await cliente.$queryRaw<
    { id: string; procesoId: string; resultado: string; registradaEn: Date; eventoId: string | null; tipo: string | null; aplicadaEn: Date | null; versionDePlanCreadaId: string | null }[]
  >`
    SELECT r."id"::text AS "id", r."proceso_id"::text AS "procesoId", r."resultado"::text AS "resultado", r."momento_de_registro" AS "registradaEn",
           e."id"::text AS "eventoId", a."tipo"::text AS "tipo", e."momento_de_registro" AS "aplicadaEn", a."version_de_plan_creada_id"::text AS "versionDePlanCreadaId"
      FROM "revision_nutricional" r
      LEFT JOIN "aplicacion_de_revision" a ON a."revision_id" = r."id"
      LEFT JOIN "evento_de_proceso" e ON e."id" = a."evento_id" AND e."tipo" = 'ContinuidadOCierreAplicado'
     WHERE r."momento_de_registro" < ${fin}
    UNION ALL
    SELECT r."id"::text, r."proceso_id"::text, r."resultado"::text, r."momento_de_registro",
           e."id"::text, a."tipo"::text, e."momento_de_registro", a."version_de_plan_creada_id"::text
      FROM "revision_de_entrenamiento" r
      LEFT JOIN "aplicacion_de_revision_de_entrenamiento" a ON a."revision_id" = r."id"
      LEFT JOIN "evento_de_proceso" e ON e."id" = a."evento_id" AND e."tipo" = 'ContinuidadOCierreAplicado'
     WHERE r."momento_de_registro" < ${fin}`;
  // REG-06-67 y 70: el cierre que no vino de una revisión (el vínculo finalizado o el cierre de la cuenta).
  const cierres = await cliente.$queryRaw<{ procesoId: string; motivo: string | null; registradoEn: Date }[]>`
    SELECT e."proceso_id"::text AS "procesoId", e."datos"->>'motivo' AS "motivo", e."momento_de_registro" AS "registradoEn"
      FROM "evento_de_proceso" e
     WHERE e."tipo" = 'ProcesoOperativoCerrado' AND COALESCE(e."datos"->>'motivo', '') <> 'REVISION_FINALIZAR'
       AND e."momento_de_registro" < ${fin}`;
  // La historia del Vínculo por Alcance: nace ACEPTADO, y cada pausa, reanudación o finalización es un hecho de M-03.
  const alcances = await cliente.$queryRaw<{ alcanceId: string; profesionalId: string; asesoradoId: string; alcance: string; desde: Date }[]>`
    SELECT av."id"::text AS "alcanceId", vi."profesional_id"::text AS "profesionalId", vi."asesorado_id"::text AS "asesoradoId",
           av."alcance"::text AS "alcance", av."momento_de_registro" AS "desde"
      FROM "alcance_de_vinculo" av
      JOIN "vinculo" vi ON vi."id" = av."vinculo_id"
     WHERE av."momento_de_registro" < ${fin}`;
  const transiciones = await cliente.$queryRaw<{ alcanceId: string; tipo: string; desde: Date }[]>`
    SELECT ev."alcance_de_vinculo_id"::text AS "alcanceId", ev."tipo"::text AS "tipo", ev."momento_de_registro" AS "desde"
      FROM "evento_de_vinculo" ev
     WHERE ev."tipo" IN ('AlcanceDeVinculoPausado', 'AlcanceDeVinculoReanudado', 'AlcanceDeVinculoFinalizado')
       AND ev."alcance_de_vinculo_id" IS NOT NULL AND ev."momento_de_registro" < ${fin}
     ORDER BY ev."secuencia"`;
  const consentimientos = await cliente.$queryRaw<{ alcanceId: string; situacion: 'VIGENTE' | 'REVOCADO'; desde: Date }[]>`
    SELECT c."alcance_de_vinculo_id"::text AS "alcanceId", vc."situacion_resultante"::text AS "situacion", vc."momento_de_registro" AS "desde"
      FROM "version_de_consentimiento" vc
      JOIN "consentimiento" c ON c."id" = vc."consentimiento_id"
     WHERE vc."momento_de_registro" < ${fin}`;

  const porProceso = <T extends { procesoId: string }>(filas: readonly T[]): Map<string, T[]> => {
    const m = new Map<string, T[]>();
    for (const f of filas) m.set(f.procesoId, [...(m.get(f.procesoId) ?? []), f]);
    return m;
  };
  const expectativasDe = porProceso(expectativas);
  const revisionesDe = porProceso(revisiones);
  const cierreDe = new Map(cierres.map((c) => [c.procesoId, c]));
  const resultado: ProcesoTvcc30[] = procesos.map((p) => ({
    procesoId: p.id,
    alcance: p.alcance,
    profesionalId: p.profesionalId,
    asesoradoId: p.asesoradoId,
    expectativas: (expectativasDe.get(p.id) ?? []).map((e) => ({
      id: e.id,
      predecesoraId: e.predecesoraId,
      // `fecha_objetivo` es DATE: llega como la medianoche UTC de esa fecha civil.
      fechaObjetivo: e.fechaObjetivo ? e.fechaObjetivo.toISOString().slice(0, 10) : null,
      registradaEn: e.registradaEn.toISOString(),
      revisionId: e.revisionId,
      versionDePlanId: e.versionDePlanId,
    })),
    revisiones: (revisionesDe.get(p.id) ?? []).map(
      (r): RevisionTvcc30 => ({
        id: r.id,
        resultado: r.resultado,
        registradaEn: r.registradaEn.toISOString(),
        aplicacion:
          r.eventoId && r.aplicadaEn && (r.tipo === 'CONTINUIDAD' || r.tipo === 'CIERRE_PROCESO')
            ? { eventoId: r.eventoId, tipo: r.tipo, registradaEn: r.aplicadaEn.toISOString(), versionDePlanCreadaId: r.versionDePlanCreadaId }
            : null,
      }),
    ),
    cierreSinRevision: cierreDe.has(p.id) ? { motivo: cierreDe.get(p.id)!.motivo ?? 'SIN_MOTIVO', registradoEn: cierreDe.get(p.id)!.registradoEn.toISOString() } : null,
  }));

  const ESTADO_DE_TRANSICION: Record<string, 'ACEPTADO' | 'PAUSADO' | 'FINALIZADO'> = {
    AlcanceDeVinculoPausado: 'PAUSADO',
    AlcanceDeVinculoReanudado: 'ACEPTADO',
    AlcanceDeVinculoFinalizado: 'FINALIZADO',
  };
  const terna = (a: { profesionalId: string; asesoradoId: string; alcance: string }): string => `${a.profesionalId}|${a.asesoradoId}|${a.alcance}`;
  const alcancePorId = new Map(alcances.map((a) => [a.alcanceId, a]));
  const historias = new Map<string, { profesionalId: string; asesoradoId: string; alcance: string; estados: HistoriaDelAlcanceTvcc30['estados'][number][]; consentimiento: HistoriaDelAlcanceTvcc30['consentimiento'][number][] }>();
  const historiaDe = (a: { profesionalId: string; asesoradoId: string; alcance: string }) => {
    const k = terna(a);
    if (!historias.has(k)) historias.set(k, { profesionalId: a.profesionalId, asesoradoId: a.asesoradoId, alcance: a.alcance, estados: [], consentimiento: [] });
    return historias.get(k)!;
  };
  // Si la persona vuelve a vincularse después de una finalización, la terna tiene más de un alcance: sus tramos se suman.
  for (const a of alcances) historiaDe(a).estados.push({ desde: a.desde.toISOString(), estado: 'ACEPTADO' });
  for (const t of transiciones) {
    const a = alcancePorId.get(t.alcanceId);
    const estado = ESTADO_DE_TRANSICION[t.tipo];
    if (a && estado) historiaDe(a).estados.push({ desde: t.desde.toISOString(), estado });
  }
  for (const c of consentimientos) {
    const a = alcancePorId.get(c.alcanceId);
    if (a) historiaDe(a).consentimiento.push({ desde: c.desde.toISOString(), situacion: c.situacion });
  }
  return { procesos: resultado, vinculos: [...historias.values()] };
}

/** UC-S01: calcula la TVCC-30 de un corte con los hechos de la base. No guarda nada. */
export async function calcularTvcc30EnLaBase(
  cliente: Cliente,
  p: { corte: string; cuentasDemo?: readonly string[]; especificacion?: EspecificacionTvcc30 },
): Promise<ResultadoTvcc30> {
  const especificacion = p.especificacion ?? SPEC_TVCC30_V1;
  const ventana = ventanaTvcc30(p.corte, especificacion);
  const hechos = await leerHechosTvcc30(cliente, new Date(ventana.finExclusivo));
  return calcularTvcc30({ corte: p.corte, especificacion, procesos: hechos.procesos, vinculos: hechos.vinculos, cuentasDemo: p.cuentasDemo ?? [] });
}

/** La huella del resultado: SHA-256 de su forma canónica. Mismas fuentes, misma especificación y mismo corte, misma huella. */
export function huellaTvcc30(resultado: ResultadoTvcc30): string {
  return createHash('sha256').update(canonicoTvcc30(resultado)).digest('hex');
}

/**
 * Conserva el resultado (12 §22; REG-06-196), sucesor del último del mismo corte y zona (REG-06-198). Dentro de una
 * transacción con un cerrojo por corte, para que dos corridas simultáneas no bifurquen la cadena.
 */
export async function conservarTvcc30(
  prisma: { $transaction<T>(fn: (tx: Cliente) => Promise<T>): Promise<T> },
  resultado: ResultadoTvcc30,
  p: { ejecutor: string; ambiente: string; procedencia: Prisma.InputJsonValue },
): Promise<{ id: string; huella: string; predecesorId: string | null }> {
  const huella = huellaTvcc30(resultado);
  const v = resultado.valor;
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`tvcc30|${resultado.ventana.corte}|${resultado.ventana.zona}`}, 0))`;
    const [ultimo] = await tx.$queryRaw<{ id: string }[]>`
      SELECT r."id"::text AS "id" FROM "resultado_tvcc30" r
       WHERE r."corte" = ${resultado.ventana.corte}::date AND r."zona" = ${resultado.ventana.zona}
         AND NOT EXISTS (SELECT 1 FROM "resultado_tvcc30" s WHERE s."predecesor_id" = r."id")`;
    const fila = await tx.resultadoTvcc30.create({
      data: {
        especificacion: resultado.especificacion.id,
        mapeo: resultado.especificacion.mapeo,
        corte: new Date(`${resultado.ventana.corte}T00:00:00.000Z`),
        zona: resultado.ventana.zona,
        ventanaInicio: new Date(resultado.ventana.inicio),
        ventanaFin: new Date(resultado.ventana.finExclusivo),
        estado: v.estado,
        motivoSinValor: v.estado === 'SIN_VALOR' ? v.motivo : null,
        numerador: v.n,
        denominador: v.d,
        universo: resultado.conteos.universo,
        excluidos: resultado.conteos.excluidos,
        noResolubles: resultado.conteos.noResolubles,
        resultado: JSON.parse(canonicoTvcc30(resultado)) as Prisma.InputJsonValue,
        huella,
        predecesorId: ultimo?.id ?? null,
        ejecutor: p.ejecutor,
        ambiente: p.ambiente,
        procedencia: p.procedencia,
      },
      select: { id: true },
    });
    return { id: fila.id, huella, predecesorId: ultimo?.id ?? null };
  });
}
