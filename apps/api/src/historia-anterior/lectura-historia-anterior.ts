/**
 * API-HIA-04 · lo que lee el profesional (DL-175): la historia anterior de un área de la persona, por tramos de fechas.
 * Solo se llama con el PDP de esa área permitido y la autorización vigente de la persona (`historia-anterior.service.ts`).
 *
 * Lo que garantiza esta lectura, por cómo consulta (y lo prueba `test/integration/historia-anterior.int-spec.ts`):
 * - **solo otros profesionales y solo esa área:** cada consulta filtra por los profesionales de `ordinalesDeLosAnteriores`
 *   (los que empezaron a acompañarla en esa área antes que quien lee, sin él) y por las tablas de esa área. Nada de otra
 *   área tiene por dónde entrar: Nutrición lee ingestas y revisiones nutricionales; Entrenamiento, ejecuciones y revisiones
 *   de entrenamiento; Antropometría, evaluaciones;
 * - **solo lo anterior:** lo registrado antes del comienzo del acompañamiento de quien lee (HA-T03);
 * - **solo lo que la persona vio o hizo:** versiones ACTIVADAS (la lectura del titular, sin origen de plantilla ni recetas),
 *   evaluaciones REGISTRADAS, ingestas y ejecuciones registradas, y de las revisiones solo resultado, fundamento y próxima
 *   acción. Las notas propias (PG-16), las notas internas de una evaluación, los borradores, las fotos y los autores de las
 *   correcciones no se consultan;
 * - **sin nombrar al otro:** cada cosa lleva `author: { kind: 'OTHER_PROFESSIONAL', ordinal }`.
 */
import {
  LO_QUE_ENTRA,
  RESULTADO_HACIA_API,
  autorDeOtro,
  extensionDe,
  ordinalesDeLosAnteriores,
  registroVigente,
  tocaElTramo,
  tramoDeLaHistoriaAnterior,
  vigenciaHastaElCorte,
  type Alcance,
  type DecisionAnterior,
  type HistoriaAnterior,
  type RegistroAnterior,
  type TomaAnterior,
  type TramoDeFechas,
  type VersionAnteriorDePlan,
} from '@be/domain';
import type { Prisma } from '@prisma/client';
import { versionesActivadas } from '../analisis/fuentes';
import { magnitudEfectiva, ORIGEN_API } from '../antropometria/lectura-antropometria';
import type { EjecucionesDeEntrenamientoService } from '../entrenamiento/ejecuciones.service';
import type { PlanesDeEntrenamientoService } from '../entrenamiento/planes.service';
import { errores } from '../http/errores';
import { INCLUIR_REGISTRO, registrosApi } from '../nutricion/lectura-registro';
import type { PlanesService } from '../nutricion/planes.service';
import { fechaLocalEn, finDelDiaLocal, inicioDelDiaLocal, ZONA_POR_DEFECTO } from '../nutricion/zona';
import { componentesDeLaPersona } from './autorizaciones';

type Tx = Prisma.TransactionClient;

export interface ServiciosDeLaHistoria {
  readonly planesDeNutricion: PlanesService;
  readonly planesDeEntrenamiento: PlanesDeEntrenamientoService;
  readonly ejecuciones: EjecucionesDeEntrenamientoService;
}

const ZONA = ZONA_POR_DEFECTO;
const comoFecha = (f: string): Date => new Date(`${f}T00:00:00.000Z`);
const fechaDeColumna = (d: Date): string => d.toISOString().slice(0, 10);
const antes = (a: Date, b: Date): Date => (a.getTime() < b.getTime() ? a : b);

/** Lo anterior de esa área: quiénes fueron los otros profesionales y desde cuándo, con quien lee afuera. */
async function losAnteriores(tx: Tx, p: { readonly personaId: string; readonly lectorId: string; readonly area: Alcance; readonly corte: Date }): Promise<ReadonlyMap<string, number>> {
  const componentes = (await componentesDeLaPersona(tx, p.personaId)).filter((c) => c.alcance === p.area);
  return ordinalesDeLosAnteriores(
    componentes.map((c) => ({ profesionalId: c.profesionalId, inicio: c.inicio.toISOString() })),
    { lectorId: p.lectorId, corte: p.corte.toISOString() },
  );
}

/** De la fecha más vieja a la más nueva de lo que entra de esa área, con agregados (sin traer las filas). */
async function extensionDeLaHistoria(tx: Tx, p: { readonly personaId: string; readonly area: Alcance; readonly otros: readonly string[]; readonly corte: Date }): Promise<TramoDeFechas | null> {
  if (p.otros.length === 0) return null;
  const fechaDelCorte = fechaLocalEn(p.corte, ZONA);
  const fechas: (string | null)[] = [];
  const otros = { in: [...p.otros] };
  if (p.area === 'ANTROPOMETRIA') {
    const tomas = await tx.evaluacionAntropometrica.aggregate({
      where: { asesoradoId: p.personaId, profesionalId: otros, estado: 'REGISTRADA', momentoDeRegistroDeEvaluacion: { lt: p.corte } },
      _min: { momentoDeOcurrencia: true },
      _max: { momentoDeOcurrencia: true },
    });
    for (const m of [tomas._min.momentoDeOcurrencia, tomas._max.momentoDeOcurrencia]) fechas.push(m ? fechaLocalEn(m, ZONA) : null);
    return extensionDe(fechas);
  }
  for (const id of p.otros) {
    for (const v of await versionesActivadas(tx, p.area, id, p.personaId)) {
      if (!(v.activadaEl < p.corte)) continue;
      const vigencia = vigenciaHastaElCorte({ desde: v.desde, hasta: v.hasta, corteEl: v.corteEl?.toISOString() ?? null }, p.corte.toISOString());
      fechas.push(vigencia.desde, vigencia.seguiaVigente ? fechaDelCorte : vigencia.hasta);
    }
  }
  const delPlan = { asesoradoId: p.personaId, versionDePlan: { plan: { asesoradoId: p.personaId, profesionalId: otros } }, momentoDeRegistro: { lt: p.corte } };
  const registros =
    p.area === 'NUTRICION'
      ? await tx.ingestaNutricional.aggregate({ where: delPlan, _min: { fechaLocal: true }, _max: { fechaLocal: true } })
      : await tx.ejecucionDeEntrenamiento.aggregate({ where: delPlan, _min: { fechaLocal: true }, _max: { fechaLocal: true } });
  for (const d of [registros._min.fechaLocal, registros._max.fechaLocal]) fechas.push(d ? fechaDeColumna(d) : null);
  const delProceso = { proceso: { asesoradoId: p.personaId, alcance: p.area, profesionalId: otros }, momentoDeRegistro: { lt: p.corte } };
  const revisiones =
    p.area === 'NUTRICION'
      ? await tx.revisionNutricional.aggregate({ where: delProceso, _min: { momentoDeRegistro: true }, _max: { momentoDeRegistro: true } })
      : await tx.revisionDeEntrenamiento.aggregate({ where: delProceso, _min: { momentoDeRegistro: true }, _max: { momentoDeRegistro: true } });
  for (const m of [revisiones._min.momentoDeRegistro, revisiones._max.momentoDeRegistro]) fechas.push(m ? fechaLocalEn(m, ZONA) : null);
  return extensionDe(fechas);
}

/** Las versiones activadas de los planes de los otros, antes del corte, que tocan el tramo, con su contenido. */
async function versionesDelTramo(tx: Tx, s: ServiciosDeLaHistoria, p: { readonly personaId: string; readonly area: 'NUTRICION' | 'ENTRENAMIENTO'; readonly ordinales: ReadonlyMap<string, number>; readonly corte: Date; readonly tramo: TramoDeFechas }): Promise<VersionAnteriorDePlan[]> {
  const fechaDelCorte = fechaLocalEn(p.corte, ZONA);
  const salida: VersionAnteriorDePlan[] = [];
  for (const [profesionalId, ordinal] of p.ordinales) {
    for (const v of await versionesActivadas(tx, p.area, profesionalId, p.personaId)) {
      if (!(v.activadaEl < p.corte)) continue;
      const vigencia = vigenciaHastaElCorte({ desde: v.desde, hasta: v.hasta, corteEl: v.corteEl?.toISOString() ?? null }, p.corte.toISOString());
      if (!tocaElTramo({ desde: vigencia.desde, hasta: vigencia.seguiaVigente ? fechaDelCorte : vigencia.hasta }, p.tramo)) continue;
      // El plan como lo vio la persona: la lectura del titular de cada circuito (sin el origen de plantilla ni las recetas).
      const content =
        p.area === 'NUTRICION'
          ? { kind: 'NUTRITION' as const, dayTypes: (await s.planesDeNutricion.leerVersion(tx, v.id, profesionalId, false)).dayTypes }
          : { kind: 'TRAINING' as const, blocks: (await s.planesDeEntrenamiento.leerVersion(tx, v.id, false)).blocks };
      salida.push({
        planVersionId: v.id,
        author: autorDeOtro(ordinal),
        number: v.numero,
        activatedAt: v.activadaEl.toISOString(),
        from: vigencia.desde,
        to: vigencia.hasta,
        endReason: vigencia.seguiaVigente ? null : v.motivoDelCorte,
        inEffectAtYourStart: vigencia.seguiaVigente,
        content,
      });
    }
  }
  return salida.sort((a, b) => (a.activatedAt < b.activatedAt ? -1 : a.activatedAt > b.activatedAt ? 1 : 0));
}

/** Lo registrado bajo los planes de los otros en el tramo, antes del corte: comidas (sin fotos) o sesiones. */
async function registrosDelTramo(tx: Tx, s: ServiciosDeLaHistoria, p: { readonly personaId: string; readonly area: 'NUTRICION' | 'ENTRENAMIENTO'; readonly ordinales: ReadonlyMap<string, number>; readonly corte: Date; readonly tramo: TramoDeFechas }): Promise<RegistroAnterior[]> {
  const donde = {
    asesoradoId: p.personaId,
    versionDePlan: { plan: { asesoradoId: p.personaId, profesionalId: { in: [...p.ordinales.keys()] } } },
    fechaLocal: { gte: comoFecha(p.tramo.desde), lte: comoFecha(p.tramo.hasta) },
    momentoDeRegistro: { lt: p.corte },
  };
  const orden = [{ fechaLocal: 'asc' as const }, { momentoDeOcurrencia: 'asc' as const }, { id: 'asc' as const }];
  if (p.area === 'NUTRICION') {
    const filas = await tx.ingestaNutricional.findMany({ where: donde, include: { ...INCLUIR_REGISTRO, versionDePlan: { select: { plan: { select: { profesionalId: true } } } } }, orderBy: orden });
    const deQuien = new Map(filas.map((f) => [f.id, f.versionDePlan.plan.profesionalId] as const));
    return (await registrosApi(tx, filas)).map((r) => ({
      kind: 'MEAL' as const,
      recordId: r.recordId,
      author: autorDeOtro(p.ordinales.get(deQuien.get(r.recordId) as string) as number),
      planVersionId: r.planId,
      date: r.localDate,
      type: r.kind,
      meal: r.meal?.label ?? null,
      option: r.option?.label ?? null,
      description: r.description,
      annulled: r.annulment !== null,
    }));
  }
  const filas = await tx.ejecucionDeEntrenamiento.findMany({ where: donde, select: { id: true, versionDePlan: { select: { plan: { select: { profesionalId: true } } } } }, orderBy: orden });
  const deQuien = new Map(filas.map((f) => [f.id, f.versionDePlan.plan.profesionalId] as const));
  return (await s.ejecuciones.ejecucionesApi(tx, filas.map((f) => f.id))).map((x) => {
    const vigente = registroVigente(x);
    return {
      kind: 'SESSION' as const,
      recordId: x.executionId,
      author: autorDeOtro(p.ordinales.get(deQuien.get(x.executionId) as string) as number),
      planVersionId: x.planId,
      date: x.date,
      session: x.plannedSession.label,
      condition: vigente.sessionCondition,
      corrected: x.effectiveView.kind === 'CORRECTED',
      exercises: vigente.exercises.length,
    };
  });
}

/** Las tomas registradas de los otros en el tramo, antes del corte: lo medido vigente y lo calculado vigente. */
async function tomasDelTramo(tx: Tx, p: { readonly personaId: string; readonly ordinales: ReadonlyMap<string, number>; readonly corte: Date; readonly tramo: TramoDeFechas }): Promise<TomaAnterior[]> {
  const filas = await tx.evaluacionAntropometrica.findMany({
    where: {
      asesoradoId: p.personaId,
      profesionalId: { in: [...p.ordinales.keys()] },
      estado: 'REGISTRADA',
      momentoDeRegistroDeEvaluacion: { lt: p.corte },
      momentoDeOcurrencia: { gte: inicioDelDiaLocal(p.tramo.desde, ZONA), lt: finDelDiaLocal(p.tramo.hasta, ZONA) },
    },
    include: {
      mediciones: { include: { protocoloVersion: true, correcciones: { orderBy: { momentoDeRegistro: 'asc' } }, anulacion: true }, orderBy: { momentoDeRegistro: 'asc' } },
      ejecuciones: { include: { metodoVersion: true }, orderBy: { momentoDeRegistro: 'asc' } },
    },
    orderBy: [{ momentoDeOcurrencia: 'asc' }, { id: 'asc' }],
  });
  return filas.map((e) => {
    // Un recálculo reemplaza al anterior y no lo sobrescribe (REG-06-161): se muestra solo el último de cada cadena.
    const reemplazados = new Set(e.ejecuciones.flatMap((x) => (x.reemplazaAId ? [x.reemplazaAId] : [])));
    return {
      evaluationId: e.id,
      author: autorDeOtro(p.ordinales.get(e.profesionalId) as number),
      takenAt: e.momentoDeOcurrencia.toISOString(),
      date: fechaLocalEn(e.momentoDeOcurrencia, ZONA),
      measurements: e.mediciones
        .filter((m) => m.anulacion === null)
        .map((m) => ({ metric: m.metrica, magnitude: magnitudEfectiva(m), protocolName: m.protocoloVersion.nombre, origin: ORIGEN_API[m.origen], corrected: m.correcciones.length > 0 })),
      derivedResults: e.ejecuciones.filter((x) => !reemplazados.has(x.id)).map((x) => ({ metric: x.metrica, magnitude: { value: Number(x.valor), unit: x.unidad }, methodName: x.metodoVersion.nombre })),
    };
  });
}

/** Las decisiones de las revisiones de los otros, registradas en el tramo y antes del corte. Ni la interpretación ni las evidencias. */
async function decisionesDelTramo(tx: Tx, p: { readonly personaId: string; readonly area: 'NUTRICION' | 'ENTRENAMIENTO'; readonly ordinales: ReadonlyMap<string, number>; readonly corte: Date; readonly tramo: TramoDeFechas }): Promise<DecisionAnterior[]> {
  const donde = {
    proceso: { asesoradoId: p.personaId, alcance: p.area, profesionalId: { in: [...p.ordinales.keys()] } },
    momentoDeRegistro: { gte: inicioDelDiaLocal(p.tramo.desde, ZONA), lt: antes(finDelDiaLocal(p.tramo.hasta, ZONA), p.corte) },
  };
  const seleccion = { id: true, periodoInicio: true, periodoFin: true, resultado: true, fundamento: true, proximaAccion: true, momentoDeRegistro: true, proceso: { select: { profesionalId: true } } } as const;
  const orden = [{ momentoDeRegistro: 'asc' as const }, { id: 'asc' as const }];
  const filas = p.area === 'NUTRICION' ? await tx.revisionNutricional.findMany({ where: donde, select: seleccion, orderBy: orden }) : await tx.revisionDeEntrenamiento.findMany({ where: donde, select: seleccion, orderBy: orden });
  return filas.map((r) => {
    const accion = (r.proximaAccion ?? {}) as { description?: unknown; nextReviewAt?: unknown };
    return {
      reviewId: r.id,
      author: autorDeOtro(p.ordinales.get(r.proceso.profesionalId) as number),
      recordedAt: r.momentoDeRegistro.toISOString(),
      date: fechaLocalEn(r.momentoDeRegistro, ZONA),
      reviewedPeriod: { from: fechaDeColumna(r.periodoInicio), to: fechaDeColumna(r.periodoFin) },
      result: RESULTADO_HACIA_API[r.resultado],
      rationale: r.fundamento,
      nextAction: { description: typeof accion.description === 'string' ? accion.description : '', nextReviewAt: typeof accion.nextReviewAt === 'string' ? accion.nextReviewAt : null },
    };
  });
}

/**
 * La historia anterior de un área, en el tramo pedido (o el de los últimos 90 días de esa historia). `corte` es el comienzo
 * del acompañamiento de quien lee en esa área. Un tramo inválido es un 400 (el pedido ya se validó antes del PDP; acá no
 * debería pasar).
 */
export async function leerHistoriaAnterior(
  tx: Tx,
  s: ServiciosDeLaHistoria,
  p: { readonly personaId: string; readonly lectorId: string; readonly area: Alcance; readonly corte: Date; readonly pedido: { readonly inicio: unknown; readonly fin: unknown } },
): Promise<HistoriaAnterior> {
  const ordinales = await losAnteriores(tx, p);
  const extension = await extensionDeLaHistoria(tx, { personaId: p.personaId, area: p.area, otros: [...ordinales.keys()], corte: p.corte });
  const pedido = tramoDeLaHistoriaAnterior(p.pedido, { extension, fechaDelCorte: fechaLocalEn(p.corte, ZONA) });
  if (!pedido.ok) throw errores.solicitudInvalida([...pedido.issues]);
  const tramo = pedido.tramo;
  const base = { personaId: p.personaId, ordinales, corte: p.corte, tramo };
  const conPlanes = p.area === 'NUTRICION' || p.area === 'ENTRENAMIENTO' ? p.area : null;
  const hay = ordinales.size > 0;
  return {
    area: p.area,
    beforeYourStart: fechaLocalEn(p.corte, ZONA),
    period: { from: tramo.desde, to: tramo.hasta },
    extent: extension ? { from: extension.desde, to: extension.hasta } : null,
    otherProfessionals: ordinales.size,
    includes: [...LO_QUE_ENTRA[p.area]],
    planVersions: hay && conPlanes ? await versionesDelTramo(tx, s, { ...base, area: conPlanes }) : [],
    records: hay && conPlanes ? await registrosDelTramo(tx, s, { ...base, area: conPlanes }) : [],
    measurements: hay && p.area === 'ANTROPOMETRIA' ? await tomasDelTramo(tx, base) : [],
    decisions: hay && conPlanes ? await decisionesDelTramo(tx, { ...base, area: conPlanes }) : [],
  };
}
