/**
 * DL-196 parte B (WP-EDITOR-ENTRENAMIENTO; E12, E13, E18, E19 y E20) · lo que el editor necesita de las progresiones, la
 * distribución y los favoritos del plan, sin React, para probarlo solo (`apps/web/test/editor-de-entrenamiento-b.test.mjs`).
 * Las cuentas son del dominio (`progresiones.ts`, `distribucion-por-musculo.ts`); acá se arman sus entradas desde la
 * estructura del borrador y se escriben los textos de las celdas.
 */
import {
  esDeCalentamiento,
  implementoDelEjercicio,
  numero,
  pasoPorOmision,
  semanasDelEjercicio,
  seAplicaA,
  seriesEfectivasDe,
  type AgendaDeEntrenamiento,
  type AproximacionesDelEjercicio,
  type BaseDelEjercicio,
  type EstructuraDePlanDeEntrenamientoEntrada,
  type GraficoFavoritoDelPlan,
  type PlanificacionDelPlan,
  type ProgresionDeLaFase,
  type SemanaDeLaProgresion,
  type SesionParaDistribuir,
} from '@be/domain';

type Bloque = EstructuraDePlanDeEntrenamientoEntrada['blocks'][number];
type Sesion = NonNullable<Bloque['sessions']>[number];
type Prescripcion = Sesion['prescriptions'][number];

/** La unidad de las cargas (como `aproximaciones.ts`; acá sin importarla, para que las pruebas lo lean solo). */
const unidadDeLaPrescripcion = (p: Prescripcion): 'kg' | 'lb' => p.suggestedLoad?.unit ?? p.sets.find((x) => x.suggestedLoad)?.suggestedLoad?.unit ?? 'kg';

/** La carga de trabajo: la común de las efectivas; si no hay, la de la primera efectiva que tenga una (EE-D05). */
export function cargaDeTrabajo(p: Prescripcion): number | null {
  const valida = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
  if (valida(p.suggestedLoad?.value)) return p.suggestedLoad!.value;
  const deUna = p.sets.find((s) => !esDeCalentamiento(s) && valida(s.suggestedLoad?.value))?.suggestedLoad?.value;
  return valida(deUna) ? deUna : null;
}

/** Un ejercicio de una fase, con lo que hace falta para la progresión y la distribución. */
export interface EjercicioDeLaFase {
  readonly prescriptionId: string | null;
  readonly nombre: string;
  readonly sesion: string;
  readonly prescripcion: Prescripcion;
}

/** Las sesiones de una fase: las sueltas y las de sus microciclos. */
export const sesionesDeLaFase = (b: Bloque): Sesion[] => [...(b.sessions ?? []), ...(b.microcycles ?? []).flatMap((m) => m.sessions)];

/** Los ejercicios de una fase, en el orden de sus sesiones. */
export function ejerciciosDeLaFase(b: Bloque, nombreDe: (p: Prescripcion) => string, nombreDeLaSesion: (s: Sesion, n: number) => string): EjercicioDeLaFase[] {
  return sesionesDeLaFase(b).flatMap((s, n) => s.prescriptions.map((p) => ({ prescriptionId: p.prescriptionId ?? null, nombre: nombreDe(p), sesion: nombreDeLaSesion(s, n), prescripcion: p })));
}

/** Las repeticiones de las efectivas: la cifra, o el piso de un rango, de la primera que diga. */
export function repeticionesDeTrabajo(p: Prescripcion): number | null {
  const r = p.sets.find((s) => !esDeCalentamiento(s) && s.repetitions)?.repetitions ?? null;
  if (!r) return null;
  return 'value' in r ? r.value : r.min;
}

/** El rango de repeticiones de las efectivas, si lo tienen (para la doble progresión). */
export function rangoDeTrabajo(p: Prescripcion): { readonly min: number; readonly max: number } | null {
  const r = p.sets.find((s) => !esDeCalentamiento(s) && s.repetitions)?.repetitions ?? null;
  return r && 'min' in r && r.max > r.min ? { min: r.min, max: r.max } : null;
}

/** Lo que la regla necesita de un ejercicio. El paso: el de sus aproximaciones si se eligió; si no, el de su implemento. */
export function baseDelEjercicio(p: Prescripcion, nombre: string, aproximaciones: AproximacionesDelEjercicio | null): BaseDelEjercicio {
  const carga = cargaDeTrabajo(p);
  const unidad = unidadDeLaPrescripcion(p);
  return {
    carga,
    unidad,
    repeticiones: repeticionesDeTrabajo(p),
    series: seriesEfectivasDe(p),
    paso: aproximaciones?.step ?? pasoPorOmision(implementoDelEjercicio(nombre, p.loadBasis ?? null), carga, unidad),
  };
}

/** Una fila de la vista previa: un ejercicio y sus semanas. */
export interface FilaDeLaVistaPrevia {
  readonly prescriptionId: string | null;
  readonly nombre: string;
  readonly unidad: 'kg' | 'lb';
  readonly paso: number;
  readonly semanas: readonly SemanaDeLaProgresion[];
}

/** La vista previa de una regla: los ejercicios a los que se aplica, cada uno con sus semanas. */
export function vistaPrevia(
  p: ProgresionDeLaFase,
  ejercicios: readonly EjercicioDeLaFase[],
  semanas: number,
  aproximacionesDe: (id: string | null) => AproximacionesDelEjercicio | null,
): FilaDeLaVistaPrevia[] {
  return ejercicios
    .filter((e) => seAplicaA(p, e.prescriptionId))
    .map((e) => {
      const base = baseDelEjercicio(e.prescripcion, e.nombre, aproximacionesDe(e.prescriptionId));
      return { prescriptionId: e.prescriptionId, nombre: e.nombre, unidad: base.unidad, paso: base.paso, semanas: semanasDelEjercicio(p, base, semanas) };
    });
}

/** «82,5 kg × 6», «82,5 kg × 6 · 2 series», «× 8» (sin carga), «—». */
export function celdaDeLaSemana(s: SemanaDeLaProgresion, unidad: 'kg' | 'lb', seriesDeBase: number | null = null): string {
  const carga = s.carga === null ? null : `${numero(s.carga, 2)} ${unidad}`;
  const reps = s.repeticiones === null ? null : `× ${s.repeticiones}`;
  const series = seriesDeBase !== null && s.series !== seriesDeBase ? `${s.series} ${s.series === 1 ? 'serie' : 'series'}` : null;
  return [[carga, reps].filter(Boolean).join(' '), series].filter(Boolean).join(' · ') || '—';
}

/** La regla aplicada a las cargas de la copia (E19, «arrancar donde terminó»): cada carga de trabajo sube a la de la última semana. */
export function cargasDeLaUltimaSemana(filas: readonly FilaDeLaVistaPrevia[]): Map<string, number> {
  const r = new Map<string, number>();
  for (const f of filas) {
    // La última semana que no es de descarga: la descarga no es donde termina la fase.
    const ultima = [...f.semanas].reverse().find((s) => !s.descarga && s.carga !== null);
    if (f.prescriptionId && ultima?.carga != null) r.set(f.prescriptionId, ultima.carga);
  }
  return r;
}

/**
 * Lleva la carga de trabajo de una prescripción a `nueva`, corriendo todas sus cargas efectivas lo mismo: una pirámide
 * sigue siendo pirámide. Las aproximaciones no se tocan (se recalculan desde la carga de trabajo, EE-D05).
 */
export function conCargaDeTrabajo(p: Prescripcion, nueva: number): Prescripcion {
  const actual = cargaDeTrabajo(p);
  if (actual === null) return p;
  const delta = nueva - actual;
  const correr = (c: { value: number; unit: 'kg' | 'lb' }) => ({ ...c, value: Math.max(0, Math.round((c.value + delta) * 100) / 100) });
  return {
    ...p,
    ...(p.suggestedLoad ? { suggestedLoad: correr(p.suggestedLoad) } : {}),
    sets: p.sets.map((s) => (!esDeCalentamiento(s) && s.suggestedLoad ? { ...s, suggestedLoad: correr(s.suggestedLoad) } : s)),
  };
}

// ─── La distribución ─────────────────────────────────────────────────────────────────────────

/**
 * Las sesiones de una fase como las mira la distribución: sus días en la agenda y, por ejercicio, sus zonas vigentes (de la
 * ficha visual) y sus series efectivas. Un ejercicio sin el ejercicio del catálogo todavía (sin guardar) va sin zonas.
 */
export function sesionesParaDistribuir(
  b: Bloque,
  agenda: AgendaDeEntrenamiento | null,
  zonasDe: (p: Prescripcion) => readonly { readonly zoneId: string; readonly role: 'PRIMARY' | 'SECONDARY' }[] | null,
): SesionParaDistribuir[] {
  return sesionesDeLaFase(b).map((s) => ({
    dias: s.sessionId ? (agenda?.sessions.find((x) => x.sessionId === s.sessionId)?.weekdays ?? []) : [],
    ejercicios: s.prescriptions.map((p) => ({ zonas: zonasDe(p) ?? [], seriesEfectivas: seriesEfectivasDe(p) })),
  }));
}

// ─── Los favoritos del plan (GR-27) ───────────────────────────────────────────────────────────

export const esFavorito = (p: PlanificacionDelPlan, g: GraficoFavoritoDelPlan): boolean => (p.favoriteCharts ?? []).some((x) => x.kind === g.kind && x.id === g.id);

/** Marca o desmarca un gráfico como favorito de la planificación (hasta 30). */
export function conFavorito(p: PlanificacionDelPlan, g: GraficoFavoritoDelPlan): PlanificacionDelPlan {
  const lista = p.favoriteCharts ?? [];
  const sin = lista.filter((x) => !(x.kind === g.kind && x.id === g.id));
  const nueva = sin.length === lista.length ? [...lista, g].slice(-30) : sin;
  const { favoriteCharts: _antes, ...resto } = p;
  return nueva.length > 0 ? { ...resto, favoriteCharts: nueva } : resto;
}

export const COPY_FAVORITOS = {
  pestana: 'Favoritos',
  titulo: 'Gráficos favoritos del plan',
  marcar: 'Marcar como favorito del plan',
  quitar: 'Quitar de los favoritos del plan',
  vacio: 'Todavía no marcaste ningún gráfico. Con la estrella de un gráfico del panel, queda acá para mirarlo junto a los demás.',
  queEs: 'Los gráficos que marcaste en este plan (la carga por semana de un ejercicio, la progresión o la distribución de una fase) y, debajo, el enfoque de gráficos de la persona elegido para este plan.',
  yaNoEsta: 'Lo que marcaste ya no está en el plan.',
} as const;

/** La unidad de las cargas de una fase, para la regla en palabras: la de sus ejercicios si es una sola; si no, kg. */
export function unidadDeLaFase(ejercicios: readonly EjercicioDeLaFase[]): 'kg' | 'lb' {
  const unidades = new Set(ejercicios.map((e) => unidadDeLaPrescripcion(e.prescripcion)));
  return unidades.size === 1 ? [...unidades][0]! : 'kg';
}
