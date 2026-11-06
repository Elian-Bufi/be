/**
 * Registro por niveles (DL-161; decisión de Dirección del 2026-11-02): la persona carga desde un toque hasta todo el
 * detalle, y el profesional ve cómo lo cargó.
 *
 * - **Cada serie dice cómo se cargó** (`recordedAs`). `TYPED`: la persona escribió algún valor. `AS_PLANNED`: la tildó
 *   sin escribir, con lo planificado a la vista, y los valores son los del plan que confirmó (B10-06 §56: «repetir
 *   objetivo» como ayuda, con el valor real confirmado y nunca sin visibilidad). Ausente se lee `TYPED`: así quedó todo
 *   lo registrado antes.
 * - **La duración** (`durationSeconds`) la midió el cronómetro o la escribió la persona; nunca se infiere.
 * - **Una serie `AS_PLANNED` trae la carga o las repeticiones:** no existe la serie realizada sin datos, y BE no
 *   sintetiza series (09v10:1099-1101). Lo verifica `problemasDeCoherencia` al guardar.
 *
 * Lo que vive acá:
 * - `serieEnSuForma`: la serie campo por campo, como se guarda y como se devuelve. `TYPED` y una duración `null` no se
 *   guardan, porque dicen lo mismo que la ausencia. Así lo registrado antes queda idéntico, una corrección «sin cambios»
 *   se reconoce, y una ejecución cargada toda a mano y sin duración la sigue leyendo una APK anterior (DL-152).
 * - `nivelDeDetalle`: el nivel de detalle de una ejecución registrada, por la marca de cada serie.
 * - `nivelDeDetalleFrenteAlPlan`: el que lee el escritorio del profesional, que mira también la sesión del plan (I-10).
 *
 * Nada de esto califica: dice cómo se cargó, no si estuvo bien ni si fue mucho o poco.
 */
import type { ComparacionDeEjercicio } from './comparacion-de-entrenamiento';
import type { EjecucionDeEntrenamiento, EjercicioRegistradoEntrada, RegistroDeEjecucion, SerieEjecutadaApi } from './contratos-entrenamiento';
import { ETIQUETA_DE_NIVEL_DE_DETALLE, etiquetaDeCondicionRegistrada, registroVigente } from './copy-entrenamiento';

/** La serie se registró con un toque, con los valores del plan que la persona tenía a la vista. */
export const seCargoComoElPlan = (s: Pick<SerieEjecutadaApi, 'recordedAs'>): boolean => s.recordedAs === 'AS_PLANNED';

/**
 * La serie campo por campo, sin nada que no esté en el contrato. Los dos campos de DL-161 van solo si dicen algo: la
 * marca, si es `AS_PLANNED`; la duración, si es un número. Lo demás se copia tal cual, sin completar ni reinterpretar.
 */
export function serieEnSuForma(s: SerieEjecutadaApi): SerieEjecutadaApi {
  const { setIndex, load, completedRepetitions, rir, perceivedExertion } = s;
  return {
    setIndex,
    load,
    completedRepetitions,
    rir,
    perceivedExertion,
    ...(s.recordedAs === 'AS_PLANNED' ? { recordedAs: 'AS_PLANNED' as const } : {}),
    ...(typeof s.durationSeconds === 'number' ? { durationSeconds: s.durationSeconds } : {}),
  };
}

/** Los ejercicios de un registro con cada serie en su forma (`serieEnSuForma`). Un ejercicio resumido queda igual. */
export function ejerciciosEnSuForma(ejercicios: readonly EjercicioRegistradoEntrada[]): EjercicioRegistradoEntrada[] {
  return ejercicios.map((e) => ('sets' in e ? { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, sets: e.sets.map(serieEnSuForma) } : e));
}

/**
 * Los ejercicios sin la marca de cómo se cargó cada serie. Corregir es cambiar un dato (B10-06:879-884): una corrección
 * que solo cambia la marca no rectifica lo que se hizo, y la serie se ve igual en «Corrección vigente».
 */
export function ejerciciosSinLaMarca(ejercicios: readonly EjercicioRegistradoEntrada[]): EjercicioRegistradoEntrada[] {
  // `TYPED` no se guarda (`serieEnSuForma`): marcar todas así es quitarles la marca.
  return ejerciciosEnSuForma(ejercicios).map((e) => ('sets' in e ? { ...e, sets: e.sets.map((s) => serieEnSuForma({ ...s, recordedAs: 'TYPED' })) } : e));
}

// ─── El nivel de detalle de una ejecución ───────────────────────────────────────────────────────────────────

/**
 * Cómo quedó cargada una sesión registrada (entre comillas, los nombres visibles que eligió Dirección el 2026-11-02):
 * - `CON_DETALLE`: por serie, y la persona escribió cada una («Carga completa»);
 * - `COMO_EL_PLAN`: por serie, y todas se tildaron con lo planificado («Carga rápida»);
 * - `PARTE_COMO_EL_PLAN`: por serie, algunas escritas o cambiadas y otras tildadas con lo planificado («Carga rápida con
 *   cambios»). En el escritorio, también la sesión tildada entera que cambió frente al plan: una serie menos, una de más
 *   u otro ejercicio (`nivelDeDetalleFrenteAlPlan`; DL-161 I-10 e I-11);
 * - `RESUMIDA`: por ejercicio o sesión, sin series;
 * - `NO_REALIZADA`: la persona la registró como no realizada.
 */
export type NivelDeDetalle = 'CON_DETALLE' | 'COMO_EL_PLAN' | 'PARTE_COMO_EL_PLAN' | 'RESUMIDA' | 'NO_REALIZADA';

type RegistroParaElNivel = Pick<RegistroDeEjecucion, 'sessionCondition' | 'granularity'> & {
  readonly exercises: readonly { readonly sets: readonly Pick<SerieEjecutadaApi, 'recordedAs'>[] | null }[];
};

/**
 * El nivel de detalle de un registro (el original o una corrección). `null` si no se puede decir: un registro realizado
 * sin forma de registro, o por serie sin ninguna serie. Ninguno de los dos se puede confirmar (`problemasParaConfirmar`);
 * si llegara uno, no se le inventa un nivel.
 */
export function nivelDeDetalleDelRegistro(r: RegistroParaElNivel): NivelDeDetalle | null {
  if (r.sessionCondition === 'NOT_COMPLETED') return 'NO_REALIZADA';
  if (r.granularity === 'EXERCISE_OR_SESSION') return 'RESUMIDA';
  if (r.granularity !== 'SET') return null;
  const series = r.exercises.flatMap((e) => e.sets ?? []);
  if (series.length === 0) return null;
  const comoElPlan = series.filter(seCargoComoElPlan).length;
  return comoElPlan === 0 ? 'CON_DETALLE' : comoElPlan === series.length ? 'COMO_EL_PLAN' : 'PARTE_COMO_EL_PLAN';
}

/**
 * El nivel de detalle de lo que hoy rige de una ejecución: la corrección vigente, o el original. `null` si la cadena de
 * correcciones no se puede resolver: no se sabe qué rige.
 */
export function nivelDeDetalle(x: Pick<EjecucionDeEntrenamiento, 'original' | 'corrections' | 'effectiveView'>): NivelDeDetalle | null {
  if (x.effectiveView.kind === 'NOT_RESOLVABLE') return null;
  return nivelDeDetalleDelRegistro(registroVigente(x));
}

// ─── La carga rápida con cambios (DL-161 I-10 e I-11) ───────────────────────────────────────────────────────

/** Lo que hace falta de la comparación con la sesión del plan (`compararEjecucion`) para saber si cambió. */
type ComparacionParaLosCambios = Pick<ComparacionDeEjercicio, 'realizado' | 'identidad' | 'filas'>;

/**
 * La sesión registrada cambió frente a la sesión del plan que rigió ese día, aunque nada se haya escrito (DL-161 I-11;
 * Dirección, 2026-11-02: «que se diferencien si hay modificación en series o datos»). Es un cambio:
 * - una serie indicada que no se registró: una serie menos, o un ejercicio entero sin registrar;
 * - una serie registrada que no estaba indicada: una de más;
 * - un ejercicio registrado con otra versión del catálogo que la indicada: otro ejercicio en su lugar.
 *
 * Un dato distinto no se busca acá: se reconoce por la marca, porque la serie que la persona cambió llega escrita
 * (`TYPED`). Los valores de una serie tildada no se recalculan contra el plan (I-3: un rango, otra unidad). Alcanza con
 * la sesión que rigió, que trae la ejecución: no hacen falta los objetivos de cada serie.
 */
export function cambiaFrenteAlPlan(comparaciones: readonly ComparacionParaLosCambios[]): boolean {
  return comparaciones.some(
    (c) => (c.realizado !== null && c.identidad !== 'misma-version') || c.filas.some((f) => (f.planificada.tipo === 'planificada') !== (f.registrada.tipo === 'registrada')),
  );
}

/**
 * El nivel de detalle que lee el escritorio del profesional (los Registros y la línea de tiempo): el de la marca de cada
 * serie (`nivelDeDetalleDelRegistro`), salvo que la carga rápida haya cambiado frente al plan. Entonces es «Carga rápida
 * con cambios», aunque nada se haya escrito (DL-161 I-10, con el cambio que ratificó Dirección el 2026-11-06). Los demás
 * niveles no cambian: «Carga completa» lo sigue siendo con una serie menos, porque cada serie registrada se escribió.
 *
 * La APK no lo usa todavía: dice el nivel de la marca hasta su próxima versión.
 */
export function nivelDeDetalleFrenteAlPlan(nivel: NivelDeDetalle | null, comparaciones: readonly ComparacionParaLosCambios[]): NivelDeDetalle | null {
  return nivel === 'COMO_EL_PLAN' && cambiaFrenteAlPlan(comparaciones) ? 'PARTE_COMO_EL_PLAN' : nivel;
}

/** El nivel en palabras: «Carga completa», «Carga rápida»… «No realizada» es la condición que la persona registró. */
export function textoDelNivelDeDetalle(n: NivelDeDetalle): string {
  return n === 'NO_REALIZADA' ? etiquetaDeCondicionRegistrada({ sessionCondition: 'NOT_COMPLETED' }) : ETIQUETA_DE_NIVEL_DE_DETALLE[n];
}

/** Los niveles que se cuentan serie por serie: los que dicen algo que la condición y la forma de registro no dicen. */
export const esNivelPorSerie = (n: NivelDeDetalle | null): n is 'CON_DETALLE' | 'COMO_EL_PLAN' | 'PARTE_COMO_EL_PLAN' =>
  n === 'CON_DETALLE' || n === 'COMO_EL_PLAN' || n === 'PARTE_COMO_EL_PLAN';

/**
 * La sesión se cargó completa: la persona escribió cada serie. Dirección (2026-11-02) pide destacarla en las listas de
 * sesiones y en la línea de tiempo del profesional; las demás dicen su nivel sin destacar.
 */
export const esCargaCompleta = (n: NivelDeDetalle | null): n is 'CON_DETALLE' => n === 'CON_DETALLE';
