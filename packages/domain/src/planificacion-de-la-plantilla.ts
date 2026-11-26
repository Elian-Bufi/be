/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2, ET2-10 y ET2-D10) · la planificación que viaja con una plantilla de
 * Entrenamiento: las semanas del plan y de cada fase, las aproximaciones, las progresiones, la intensidad y el esfuerzo de
 * la sesión. Sin React, sin base y sin red.
 *
 * - **Al guardar la plantilla** (desde un plan o desde su editor), sale todo lo de la persona: la fecha de inicio, el
 *   objetivo, las anotaciones privadas y los favoritos (DL-108 D-5).
 * - **Al aplicarla**, la plantilla se normaliza con identificadores nuevos (el plan es de la persona, no del molde): cada
 *   fase y cada ejercicio pasan al suyo **por su lugar** en la estructura (la fase 2, el tercer ejercicio de su segunda
 *   sesión). Lo que no se encuentra se va, como en `planificacionPodada`. La fecha de inicio la pone el profesional.
 */
import type { EstructuraDePlanDeEntrenamientoEntrada, PlanificacionDelPlan } from './contratos-entrenamiento';
import type { PlanificacionDeLaPlantilla } from './contratos-plantillas';
import { planificacionPodada } from './planificacion-del-plan';

/** Lo mínimo de una estructura para ubicar sus fases y sus ejercicios en orden: la de entrada y la guardada lo tienen. */
interface EstructuraParaUbicar {
  readonly blocks: readonly {
    readonly blockId?: string | null;
    readonly sessions?: readonly { readonly prescriptions: readonly { readonly prescriptionId?: string | null }[] }[] | null;
    readonly microcycles?: readonly { readonly sessions: readonly { readonly prescriptions: readonly { readonly prescriptionId?: string | null }[] }[] }[] | null;
  }[];
}

/** Las fases y los ejercicios de una estructura, en orden: microciclos primero y después las sesiones sueltas, como el plan. */
function ubicaciones(e: EstructuraParaUbicar): { readonly fases: (string | null)[]; readonly ejercicios: (string | null)[] } {
  const fases: (string | null)[] = [];
  const ejercicios: (string | null)[] = [];
  for (const b of e.blocks) {
    fases.push(b.blockId ?? null);
    for (const m of b.microcycles ?? []) for (const s of m.sessions) for (const p of s.prescriptions) ejercicios.push(p.prescriptionId ?? null);
    for (const s of b.sessions ?? []) for (const p of s.prescriptions) ejercicios.push(p.prescriptionId ?? null);
  }
  return { fases, ejercicios };
}

/** La planificación de un plan, lista para la plantilla: sin nada de la persona. `null` si no queda nada. */
export function planificacionParaLaPlantilla(p: PlanificacionDelPlan | null | undefined): PlanificacionDeLaPlantilla | null {
  if (!p) return null;
  const r: PlanificacionDeLaPlantilla = {
    weeks: p.weeks,
    phases: p.phases,
    ...(p.warmUps?.length ? { warmUps: p.warmUps } : {}),
    ...(p.progressions?.length ? { progressions: p.progressions } : {}),
    ...(p.intensity && p.intensity !== 'RIR' ? { intensity: p.intensity } : {}),
    ...(p.withoutIntensity?.length ? { withoutIntensity: p.withoutIntensity } : {}),
    ...(p.askSessionEffort ? { askSessionEffort: true as const } : {}),
    // DL-202: la plantilla copia «Pedir el esfuerzo de cada serie» si está escrito; ausente, no lo lleva.
    ...(typeof p.askSetEffort === 'boolean' ? { askSetEffort: p.askSetEffort } : {}),
  };
  const vacia = r.weeks === null && r.phases.every((f) => f.weeks === null) && !r.warmUps && !r.progressions && !r.intensity && !r.withoutIntensity && !r.askSessionEffort && r.askSetEffort === undefined;
  return vacia ? null : r;
}

/** La planificación de una plantilla como la del editor (sin fecha de inicio ni objetivo todavía). */
export const planificacionDeLaPlantillaComoDelPlan = (p: PlanificacionDeLaPlantilla | null | undefined): PlanificacionDelPlan | null => (p ? { startDate: null, goal: null, ...p } : null);

/**
 * La planificación de la plantilla llevada al plan nuevo: cada identificador de la plantilla pasa al de su mismo lugar en
 * el plan. Lo que no tiene lugar se poda. `null` si no queda nada.
 */
export function planificacionDesdeLaPlantilla(
  p: PlanificacionDeLaPlantilla | null | undefined,
  deLaPlantilla: EstructuraParaUbicar | EstructuraDePlanDeEntrenamientoEntrada,
  delPlan: EstructuraParaUbicar,
): PlanificacionDelPlan | null {
  if (!p) return null;
  const antes = ubicaciones(deLaPlantilla);
  const despues = ubicaciones(delPlan);
  const traducir = (de: (string | null)[], a: (string | null)[]) => {
    const m = new Map<string, string>();
    de.forEach((id, n) => {
      const nuevo = a[n];
      if (id && nuevo) m.set(id, nuevo);
    });
    return m;
  };
  const fase = traducir(antes.fases, despues.fases);
  const ejercicio = traducir(antes.ejercicios, despues.ejercicios);
  const f = (id: string): string => fase.get(id) ?? `sin-lugar-${id}`;
  const e = (id: string): string => ejercicio.get(id) ?? `sin-lugar-${id}`;
  const traducida: PlanificacionDelPlan = {
    startDate: null,
    weeks: p.weeks,
    goal: null,
    phases: p.phases.map((x) => ({ ...x, blockId: f(x.blockId) })),
    ...(p.warmUps ? { warmUps: p.warmUps.map((w) => ({ ...w, prescriptionId: e(w.prescriptionId) })) } : {}),
    ...(p.progressions ? { progressions: p.progressions.map((x) => ({ ...x, blockId: f(x.blockId), prescriptionIds: x.prescriptionIds ? x.prescriptionIds.map(e) : null })) } : {}),
    ...(p.intensity ? { intensity: p.intensity } : {}),
    ...(p.withoutIntensity ? { withoutIntensity: p.withoutIntensity.map(e) } : {}),
    ...(p.askSessionEffort ? { askSessionEffort: true as const } : {}),
    ...(typeof p.askSetEffort === 'boolean' ? { askSetEffort: p.askSetEffort } : {}),
  };
  const fasesDelPlan = despues.fases.filter((x): x is string => x !== null);
  const ejerciciosDelPlan = despues.ejercicios.filter((x): x is string => x !== null);
  return planificacionPodada(traducida, fasesDelPlan, ejerciciosDelPlan);
}

/**
 * La planificación de una plantilla podada contra su estructura: sin las fases ni los ejercicios que ya no están (como
 * `planificacionPodada` en un plan). Una estructura sin identificadores no puede nombrar nada: queda sin planificación.
 */
export function planificacionDeLaPlantillaPodada(p: PlanificacionDeLaPlantilla | null | undefined, estructura: EstructuraParaUbicar): PlanificacionDeLaPlantilla | null {
  if (!p) return null;
  const { fases, ejercicios } = ubicaciones(estructura);
  return planificacionParaLaPlantilla(
    planificacionPodada(
      { startDate: null, goal: null, ...p },
      fases.filter((x): x is string => x !== null),
      ejercicios.filter((x): x is string => x !== null),
    ),
  );
}
