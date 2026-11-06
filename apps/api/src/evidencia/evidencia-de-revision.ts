import { ReferenciaDeEvidenciaSchema, type CambioPosterior, type EvidenciaResuelta, type InstantaneaDeEntrenamiento } from '@be/domain';
import type { Prisma } from '@prisma/client';
import { versionesActivadas, ZONA } from '../analisis/fuentes';
import { sesionDeOcurrenciaApi } from '../entrenamiento/lectura-entrenamiento';
import { comidaDe, instantaneasDe } from '../nutricion/lectura-registro';
import { fechaLocalEn } from '../nutricion/zona';

type Tx = Prisma.TransactionClient;
type Referencia = EvidenciaResuelta['reference'];

/**
 * DL-154 · la evidencia de una revisión registrada, resuelta (API-NUT-19-EVIDENCIA y API-TRN-23-EVIDENCIA). Quien llama ya
 * decidió con el PDP y comprobó que la revisión es del profesional: acá solo se lee lo que la revisión guardó.
 * - **Lo que se guardó, en su orden.** Nada se reconstruye con el período ni con un filtro.
 * - **Acotado al seguimiento.** Cada referencia se busca en este profesional con esta persona, como al registrar la
 *   revisión (`exigirEvidenciaReconstruible`). Si hoy no se encuentra ahí, es `NOT_FOUND`, sin más detalle.
 * - **Lo que cambió después** de la revisión (estrictamente después de su registro): rectificaciones, correcciones,
 *   anulaciones y versiones sucesoras, con su instante.
 * - **Sin valores de salud:** la comida, la sesión o la versión, y cuándo. Lo demás se ve al abrir el origen.
 */
export interface ContextoDeLaEvidencia {
  readonly profesionalId: string;
  readonly asesoradoId: string;
  /** El instante en que se registró la revisión: lo posterior es un cambio después de revisar. */
  readonly registradaEl: Date;
}

const esUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/**
 * Las referencias que guardó la revisión, en su orden. Se guardaron validadas con el contrato estricto de API-NUT-18 y
 * API-TRN-22 en una tabla de solo agregar: todas cumplen la forma. Si alguna no la cumpliera, no se le inventa un tipo.
 */
export function referenciasGuardadas(evidencias: Prisma.JsonValue): Referencia[] {
  if (!Array.isArray(evidencias)) return [];
  return evidencias.flatMap((e) => {
    const r = ReferenciaDeEvidenciaSchema.safeParse(e);
    return r.success ? [r.data] : [];
  });
}

/** Los cambios posteriores a la revisión, del más viejo al más nuevo. */
function despuesDe(registradaEl: Date, cambios: readonly { kind: CambioPosterior['kind']; at: Date | null | undefined }[]): CambioPosterior[] {
  return cambios
    .filter((c): c is { kind: CambioPosterior['kind']; at: Date } => c.at instanceof Date && c.at.getTime() > registradaEl.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.kind.localeCompare(b.kind))
    .map((c) => ({ kind: c.kind, at: c.at.toISOString() }));
}

const noEncontrada = (reference: Referencia): EvidenciaResuelta => ({ reference, state: 'NOT_FOUND', source: null, occurredDate: null, occurredAt: null, what: null, changesAfterReview: [] });
const fechaDe = (d: Date): string => d.toISOString().slice(0, 10);
const idsDe = (refs: readonly Referencia[], tipo: Referencia['type']) => [...new Set(refs.filter((r) => r.type === tipo && esUuid(r.id)).map((r) => r.id))];

/**
 * Las versiones activadas del plan de este seguimiento, con su número y la activación de su sucesora (para decir que
 * después se activó otra). Es la misma lectura que la línea de tiempo y Analizar (`versionesActivadas`).
 */
interface VersionConSucesora {
  readonly numero: number;
  readonly activadaEl: Date;
  readonly sucesoraEl: Date | null;
}

async function versionesConSucesora(tx: Tx, alcance: 'NUTRICION' | 'ENTRENAMIENTO', c: ContextoDeLaEvidencia): Promise<Map<string, VersionConSucesora>> {
  const versiones = await versionesActivadas(tx, alcance, c.profesionalId, c.asesoradoId);
  return new Map(versiones.map((v) => [v.id, { numero: v.numero, activadaEl: v.activadaEl, sucesoraEl: v.motivoDelCorte === 'SUCCESSOR_ACTIVATED' ? v.corteEl : null }]));
}

// ─── Nutrición ──────────────────────────────────────────────────────────────────────────────────

export async function evidenciaNutricional(tx: Tx, refs: readonly Referencia[], c: ContextoDeLaEvidencia): Promise<EvidenciaResuelta[]> {
  const ingestas = await tx.ingestaNutricional.findMany({
    where: { id: { in: idsDe(refs, 'EXECUTION') }, asesoradoId: c.asesoradoId, versionDePlan: { plan: { profesionalId: c.profesionalId } } },
    select: {
      id: true,
      origen: true,
      fechaLocal: true,
      momentoDeOcurrencia: true,
      versionDePlanId: true,
      comidaId: true,
      diaTipoId: true,
      comidaDeContextoId: true,
      diaTipoDeContextoId: true,
      anulacion: { select: { momentoDeRegistro: true } },
      rectificaciones: { select: { momentoDeRegistro: true } },
      correcciones: { select: { momentoDeRegistro: true } },
    },
  });
  const instantaneas = await instantaneasDe(tx, ingestas.map((i) => i.versionDePlanId));
  const versiones = idsDe(refs, 'PLAN_VERSION').length > 0 ? await versionesConSucesora(tx, 'NUTRICION', c) : new Map<string, VersionConSucesora>();
  const objetivos = await tx.versionDeObjetivoNutricional.findMany({
    where: { id: { in: idsDe(refs, 'OBJECTIVE_VERSION') }, objetivo: { profesionalId: c.profesionalId, asesoradoId: c.asesoradoId } },
    select: { id: true, vigenteDesde: true, sucesora: { select: { momentoDeRegistro: true } } },
  });
  const evaluaciones = await tx.evaluacionNutricional.findMany({
    where: { id: { in: idsDe(refs, 'EVALUATION') }, profesionalId: c.profesionalId, asesoradoId: c.asesoradoId },
    select: { id: true, momentoDeOcurrencia: true },
  });
  const porIngesta = new Map(ingestas.map((i) => [i.id, i]));
  const porObjetivo = new Map(objetivos.map((o) => [o.id, o]));
  const porEvaluacion = new Map(evaluaciones.map((e) => [e.id, e]));

  return refs.map((reference): EvidenciaResuelta => {
    if (reference.type === 'EXECUTION') {
      const i = porIngesta.get(reference.id);
      if (!i) return noEncontrada(reference);
      const delPlan = i.origen === 'PRESCRIPTA';
      const mealId = delPlan ? i.comidaId : i.comidaDeContextoId;
      const instantanea = instantaneas.get(i.versionDePlanId);
      const comida = instantanea && mealId ? comidaDe(instantanea, mealId, delPlan ? i.diaTipoId : i.diaTipoDeContextoId) : null;
      return {
        reference,
        state: 'AVAILABLE',
        source: { type: 'MEAL_RECORD', id: i.id },
        occurredDate: fechaDe(i.fechaLocal),
        occurredAt: i.momentoDeOcurrencia.toISOString(),
        what: { kind: 'MEAL_RECORD', meal: comida?.label ?? null, recordKind: delPlan ? 'PLAN_OPTION' : 'DIFFERENT' },
        changesAfterReview: despuesDe(c.registradaEl, [
          ...i.rectificaciones.map((r) => ({ kind: 'RECTIFIED' as const, at: r.momentoDeRegistro })),
          ...i.correcciones.map((r) => ({ kind: 'CORRECTED' as const, at: r.momentoDeRegistro })),
          { kind: 'ANNULLED' as const, at: i.anulacion?.momentoDeRegistro },
        ]),
      };
    }
    if (reference.type === 'PLAN_VERSION') {
      const v = versiones.get(reference.id);
      if (!v) return noEncontrada(reference);
      return {
        reference,
        state: 'AVAILABLE',
        source: { type: 'NUTRITION_PLAN_VERSION', id: reference.id },
        occurredDate: fechaLocalEn(v.activadaEl, ZONA),
        occurredAt: v.activadaEl.toISOString(),
        what: { kind: 'PLAN_VERSION', number: v.numero },
        changesAfterReview: despuesDe(c.registradaEl, [{ kind: 'SUCCEEDED', at: v.sucesoraEl }]),
      };
    }
    if (reference.type === 'OBJECTIVE_VERSION') {
      const o = porObjetivo.get(reference.id);
      if (!o) return noEncontrada(reference);
      return {
        reference,
        state: 'AVAILABLE',
        source: { type: 'NUTRITION_OBJECTIVE_VERSION', id: o.id },
        occurredDate: fechaLocalEn(o.vigenteDesde, ZONA),
        occurredAt: o.vigenteDesde.toISOString(),
        what: { kind: 'OBJECTIVE_VERSION' },
        changesAfterReview: despuesDe(c.registradaEl, [{ kind: 'SUCCEEDED', at: o.sucesora?.momentoDeRegistro }]),
      };
    }
    const e = porEvaluacion.get(reference.id);
    if (!e) return noEncontrada(reference);
    return { reference, state: 'AVAILABLE', source: null, occurredDate: fechaLocalEn(e.momentoDeOcurrencia, ZONA), occurredAt: e.momentoDeOcurrencia.toISOString(), what: { kind: 'EVALUATION' }, changesAfterReview: [] };
  });
}

// ─── Entrenamiento ──────────────────────────────────────────────────────────────────────────────

export async function evidenciaDeEntrenamiento(tx: Tx, refs: readonly Referencia[], c: ContextoDeLaEvidencia): Promise<EvidenciaResuelta[]> {
  const ejecuciones = await tx.ejecucionDeEntrenamiento.findMany({
    where: { id: { in: idsDe(refs, 'EXECUTION') }, asesoradoId: c.asesoradoId, versionDePlan: { plan: { profesionalId: c.profesionalId } } },
    select: {
      id: true,
      fechaLocal: true,
      momentoDeOcurrencia: true,
      sesionPlanificadaId: true,
      correcciones: { select: { momentoDeRegistro: true } },
      versionDePlan: { select: { instantanea: { select: { contenido: true } } } },
    },
  });
  const versiones = idsDe(refs, 'PLAN_VERSION').length > 0 ? await versionesConSucesora(tx, 'ENTRENAMIENTO', c) : new Map<string, VersionConSucesora>();
  const objetivos = await tx.versionDeObjetivoDeEntrenamiento.findMany({
    where: { id: { in: idsDe(refs, 'OBJECTIVE_VERSION') }, objetivoDeLaSerie: { profesionalId: c.profesionalId, asesoradoId: c.asesoradoId } },
    select: { id: true, vigenteDesde: true, sucesora: { select: { momentoDeRegistro: true } } },
  });
  const evaluaciones = await tx.evaluacionDeEntrenamiento.findMany({
    where: { id: { in: idsDe(refs, 'EVALUATION') }, profesionalId: c.profesionalId, asesoradoId: c.asesoradoId },
    select: { id: true, momentoDeOcurrencia: true },
  });
  const porEjecucion = new Map(ejecuciones.map((x) => [x.id, x]));
  const porObjetivo = new Map(objetivos.map((o) => [o.id, o]));
  const porEvaluacion = new Map(evaluaciones.map((e) => [e.id, e]));

  return refs.map((reference): EvidenciaResuelta => {
    if (reference.type === 'EXECUTION') {
      const x = porEjecucion.get(reference.id);
      if (!x) return noEncontrada(reference);
      const instantanea = x.versionDePlan.instantanea?.contenido as unknown as InstantaneaDeEntrenamiento | undefined;
      // Una instantánea ilegible deja la sesión sin nombre: se dice que es una sesión, sin inventarle uno.
      let sesion: string | null = null;
      try {
        sesion = instantanea?.contenido ? (sesionDeOcurrenciaApi(instantanea, x.sesionPlanificadaId)?.label ?? null) : null;
      } catch {
        sesion = null;
      }
      return {
        reference,
        state: 'AVAILABLE',
        source: { type: 'TRAINING_EXECUTION', id: x.id },
        occurredDate: fechaDe(x.fechaLocal),
        occurredAt: x.momentoDeOcurrencia.toISOString(),
        what: { kind: 'TRAINING_SESSION', session: sesion },
        changesAfterReview: despuesDe(c.registradaEl, x.correcciones.map((r) => ({ kind: 'CORRECTED' as const, at: r.momentoDeRegistro }))),
      };
    }
    if (reference.type === 'PLAN_VERSION') {
      const v = versiones.get(reference.id);
      if (!v) return noEncontrada(reference);
      return {
        reference,
        state: 'AVAILABLE',
        source: { type: 'TRAINING_PLAN_VERSION', id: reference.id },
        occurredDate: fechaLocalEn(v.activadaEl, ZONA),
        occurredAt: v.activadaEl.toISOString(),
        what: { kind: 'PLAN_VERSION', number: v.numero },
        changesAfterReview: despuesDe(c.registradaEl, [{ kind: 'SUCCEEDED', at: v.sucesoraEl }]),
      };
    }
    if (reference.type === 'OBJECTIVE_VERSION') {
      const o = porObjetivo.get(reference.id);
      if (!o) return noEncontrada(reference);
      return {
        reference,
        state: 'AVAILABLE',
        source: { type: 'TRAINING_OBJECTIVE_VERSION', id: o.id },
        occurredDate: fechaLocalEn(o.vigenteDesde, ZONA),
        occurredAt: o.vigenteDesde.toISOString(),
        what: { kind: 'OBJECTIVE_VERSION' },
        changesAfterReview: despuesDe(c.registradaEl, [{ kind: 'SUCCEEDED', at: o.sucesora?.momentoDeRegistro }]),
      };
    }
    const e = porEvaluacion.get(reference.id);
    if (!e) return noEncontrada(reference);
    return { reference, state: 'AVAILABLE', source: null, occurredDate: fechaLocalEn(e.momentoDeOcurrencia, ZONA), occurredAt: e.momentoDeOcurrencia.toISOString(), what: { kind: 'EVALUATION' }, changesAfterReview: [] };
  });
}
