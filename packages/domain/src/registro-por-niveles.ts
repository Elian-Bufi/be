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
 * - `nivelDeDetalle`: el nivel de detalle de una ejecución registrada, para el profesional.
 *
 * Nada de esto califica: dice cómo se cargó, no si estuvo bien ni si fue mucho o poco.
 */
import { CAMPOS_CON_ORIGEN, type EjecucionDeEntrenamiento, type EjercicioRegistradoEntrada, type RegistroDeEjecucion, type SerieEjecutadaApi } from './contratos-entrenamiento';
import { ETIQUETA_DE_NIVEL_DE_DETALLE, etiquetaDeCondicionRegistrada, registroVigente } from './copy-entrenamiento';
import { serializacionCanonica } from './versionado';

/** La serie se registró con un toque, con los valores del plan que la persona tenía a la vista. */
export const seCargoComoElPlan = (s: Pick<SerieEjecutadaApi, 'recordedAs'>): boolean => s.recordedAs === 'AS_PLANNED';

/**
 * La serie campo por campo, sin nada que no esté en el contrato. Los dos campos de DL-161 van solo si dicen algo: la
 * marca, si es `AS_PLANNED`; la duración, si es un número. Lo demás se copia tal cual, sin completar ni reinterpretar.
 * La procedencia por campo (ED-70) va con sus claves en el orden del contrato y solo si tiene alguna: un objeto vacío no
 * se guarda, como lo que no existe (DL-161 I-1). Así una serie sin procedencia queda idéntica a las de antes, y la
 * APK 0.24.0-candidata.1, que no la conoce, sigue leyendo lo que ella registra.
 */
export function serieEnSuForma(s: SerieEjecutadaApi): SerieEjecutadaApi {
  const { setIndex, load, completedRepetitions, rir, perceivedExertion } = s;
  const origenes = origenesEnSuForma(s.fieldOrigins);
  return {
    setIndex,
    load,
    completedRepetitions,
    rir,
    perceivedExertion,
    ...(s.recordedAs === 'AS_PLANNED' ? { recordedAs: 'AS_PLANNED' as const } : {}),
    ...(typeof s.durationSeconds === 'number' ? { durationSeconds: s.durationSeconds } : {}),
    ...(origenes ? { fieldOrigins: origenes } : {}),
  };
}

/** La procedencia por campo en el orden del contrato, o `undefined` si no dice nada (ED-70). */
function origenesEnSuForma(o: SerieEjecutadaApi['fieldOrigins']): SerieEjecutadaApi['fieldOrigins'] {
  if (!o) return undefined;
  const conClave = CAMPOS_CON_ORIGEN.filter((c) => o[c] !== undefined);
  return conClave.length === 0 ? undefined : Object.fromEntries(conClave.map((c) => [c, o[c]]));
}

/** Los ejercicios de un registro con cada serie en su forma (`serieEnSuForma`). Un ejercicio resumido queda igual. */
export function ejerciciosEnSuForma(ejercicios: readonly EjercicioRegistradoEntrada[]): EjercicioRegistradoEntrada[] {
  return ejercicios.map((e) => ('sets' in e ? { prescriptionId: e.prescriptionId, performedExerciseVersionId: e.performedExerciseVersionId, sets: e.sets.map(serieEnSuForma) } : e));
}

/**
 * Los ejercicios sin la marca de cómo se cargó cada serie ni la procedencia de sus valores. Corregir es cambiar un dato
 * (B10-06:879-884): una corrección que solo cambia la marca, o solo de dónde salió un valor (ED-70, como DL-161 I-4), no
 * rectifica lo que se hizo, y la serie se ve igual en «Corrección vigente».
 */
export function ejerciciosSinLaMarca(ejercicios: readonly EjercicioRegistradoEntrada[]): EjercicioRegistradoEntrada[] {
  // `TYPED` y una procedencia vacía no se guardan (`serieEnSuForma`): marcar todas así es quitarles las dos cosas.
  return ejerciciosEnSuForma(ejercicios).map((e) => ('sets' in e ? { ...e, sets: e.sets.map((s) => serieEnSuForma({ ...s, recordedAs: 'TYPED', fieldOrigins: undefined })) } : e));
}

/**
 * ED-70 (TEST-EDP-060): en una corrección del profesional, la procedencia de cada valor se conserva o se saca; nunca se
 * cambia ni se agrega. Compara cada serie con la del registro que hoy rige, por la prescripción y el número de serie:
 * - un valor que no cambió puede llevar la misma clave que tenía en la serie vigente, o ninguna;
 * - un valor que cambió, o el de una serie nueva (no tiene con qué compararse), va sin clave.
 * Así el profesional no le atribuye a la persona lo que vino del plan, de una serie tildada (`AS_PLANNED`) o de una
 * serie de antes de la procedencia (05:9209-9224; RM-23, RM-24, RM-33), y no le agrega el campo a una serie que una APK
 * anterior registró sin él. Los valores se comparan en su forma canónica: la carga vigente sale de una columna JSONB,
 * que guarda sus claves en otro orden que el pedido. Devuelve los lugares, relativos a la corrección. La API no recalcula
 * el plan para verificar `PLAN` (como DL-161 I-3).
 */
export type ProblemaDeProcedencia = {
  readonly code: 'FIELD_ORIGIN_PERSON_ON_CHANGED_VALUE' | 'FIELD_ORIGIN_NOT_PRESERVED';
  readonly path: string;
};

export function origenesQueAtribuyenALaPersona(
  corregidos: readonly EjercicioRegistradoEntrada[],
  vigentes: readonly EjercicioRegistradoEntrada[],
): ProblemaDeProcedencia[] {
  const antes = new Map<string, SerieEjecutadaApi>();
  for (const e of vigentes) if ('sets' in e) for (const s of e.sets) antes.set(`${e.prescriptionId}|${s.setIndex}`, s);
  const problemas: ProblemaDeProcedencia[] = [];
  corregidos.forEach((e, i) => {
    if (!('sets' in e)) return;
    e.sets.forEach((s, j) => {
      const previa = antes.get(`${e.prescriptionId}|${s.setIndex}`);
      for (const c of CAMPOS_CON_ORIGEN) {
        const origen = s.fieldOrigins?.[c];
        if (origen === undefined) continue;
        const path = `exercises[${i}].sets[${j}].fieldOrigins.${c}`;
        const igual = previa !== undefined && mismoValor(previa[c], s[c]);
        if (!igual) problemas.push({ code: origen === 'PERSON' ? 'FIELD_ORIGIN_PERSON_ON_CHANGED_VALUE' : 'FIELD_ORIGIN_NOT_PRESERVED', path });
        else if (previa.fieldOrigins?.[c] !== origen) problemas.push({ code: 'FIELD_ORIGIN_NOT_PRESERVED', path });
      }
    });
  });
  return problemas;
}

/** Dos valores de una serie son el mismo sin importar el orden de las claves (la carga es `{ value, unit }`). */
const mismoValor = (a: unknown, b: unknown): boolean => serializacionCanonica(a ?? null) === serializacionCanonica(b ?? null);

// ─── El nivel de detalle de una ejecución ───────────────────────────────────────────────────────────────────

/**
 * Cómo quedó cargada una sesión registrada (entre comillas, los nombres visibles que eligió Dirección el 2026-11-02):
 * - `CON_DETALLE`: por serie, y la persona escribió cada una («Carga completa»);
 * - `COMO_EL_PLAN`: por serie, y todas se tildaron con lo planificado («Carga rápida»);
 * - `PARTE_COMO_EL_PLAN`: por serie, algunas escritas o cambiadas y otras tildadas con lo planificado («Carga rápida con
 *   cambios»);
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
