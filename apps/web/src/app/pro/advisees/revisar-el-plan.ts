/**
 * «Revisar el plan» (WP-TABLERO-ALTA-GAMA TB-48; propuesta §23.6.8). Antes se llamaba «Validar plan» y decía solo lo que
 * impide activar, y «válido» no quería decir completo: un ítem sin cantidad pasaba, y la persona lo ve «Sin dato» en la
 * app. Ahora, además de lo que impide activar (lo que responde la API), lista lo que queda sin completar, cada cosa con
 * su lugar, **sin bloquear**: puede ser a propósito (un ítem a gusto, una serie sin repeticiones fijadas).
 * - **Sale solo de lo que escribió el profesional:** BE no completa nada, no sugiere un valor y no lo cuenta como un
 *   error (§27 de la propuesta). No se pinta: se dice en palabras, con un botón que lleva a su lugar.
 * - **Las rutas son las de los problemas de «Revisar»:** `lugarDelProblema` y su par de Entrenamiento las ubican y las
 *   dicen sin rutas técnicas, y el editor lleva al campo.
 * Vive en el website hasta TB-20 (§8.2 del paquete), como `topes-del-plan.ts`. Sin React, para las pruebas.
 */
import { seriesQueNoSonLasVueltas, type BloqueParaLeer } from '@be/domain';

/** El código de cada cosa sin completar: no es un problema de la API, y no impide guardar ni activar. */
export const INCOMPLETO = {
  sinCantidad: 'INCOMPLETO_SIN_CANTIDAD',
  sinRepeticiones: 'INCOMPLETO_SIN_REPETICIONES',
  sinSeries: 'INCOMPLETO_SIN_SERIES',
  /** DL-181 (ENP-D05): en un bloque «En vueltas», un ejercicio con más o menos series efectivas que vueltas. */
  seriesYVueltas: 'INCOMPLETO_SERIES_Y_VUELTAS',
  /**
   * DL-197 (revisión adversaria): un ejercicio que hereda la intensidad del plan y todavía no tiene objetivo. Se guarda sin
   * criterio (ET1-D11: no traba el guardado), y así lo lee la persona.
   */
  sinIntensidad: 'INCOMPLETO_SIN_OBJETIVO_DE_INTENSIDAD',
} as const;

/** Lo que dice cada una en la lista, después de su lugar: qué falta y, si cambia algo para la persona, qué ve. */
export const TEXTO_DE_LO_INCOMPLETO: Readonly<Record<string, string>> = {
  [INCOMPLETO.sinCantidad]: 'sin cantidad: en la app dice «Sin dato»',
  [INCOMPLETO.sinRepeticiones]: 'sin repeticiones fijadas',
  [INCOMPLETO.sinSeries]: 'sin series',
  [INCOMPLETO.seriesYVueltas]: 'sus series efectivas no son tantas como las vueltas de su bloque',
  [INCOMPLETO.sinIntensidad]: 'el objetivo de la intensidad del plan, sin indicar: en la app se lee «sin criterio de intensidad»',
};

/** Los textos de «Revisar el plan» que viven en el website. El nombre del botón está en el dominio (`validarPlan`). */
export const COPY_REVISAR_EL_PLAN = {
  /** Lo que se dice antes de la lista: no es un error, y se puede activar igual. */
  sinCompletar: 'Queda sin completar. No impide activar: si es a propósito, podés activarlo así.',
} as const;

interface Lugar {
  readonly code: string;
  readonly path: string;
}

type ItemDeLaRevision = { readonly quantity: unknown };
type DiaDeLaRevision = { readonly meals: readonly { readonly options: readonly { readonly recipeVersionId?: string | null; readonly items: readonly ItemDeLaRevision[] }[] }[] };

/**
 * Nutrición: cada ítem sin cantidad, en el orden de la estructura. Las opciones de receta no cuentan: sus ítems son los
 * de una porción de la receta, que arma la API.
 */
export function loQueQuedaSinCompletarEnNutricion(dias: readonly DiaDeLaRevision[]): Lugar[] {
  const r: Lugar[] = [];
  dias.forEach((d, i) =>
    d.meals.forEach((m, j) =>
      m.options.forEach((o, k) => {
        if (o.recipeVersionId) return;
        o.items.forEach((it, l) => {
          if (it.quantity === null || it.quantity === undefined) r.push({ code: INCOMPLETO.sinCantidad, path: `dayTypes[${i}].meals[${j}].options[${k}].items[${l}].quantity` });
        });
      }),
    ),
  );
  return r;
}

type SesionDeLaRevision = {
  readonly prescriptions: readonly {
    readonly sets: readonly { readonly repetitions: unknown; readonly setKind?: 'WORKING' | 'WARM_UP' | null }[];
    readonly exerciseGroupId?: string | null;
    readonly prescriptionId?: string | null;
    readonly intensity?: unknown;
  }[];
  readonly exerciseGroups?: readonly BloqueParaLeer[] | null;
};
type BloqueDeLaRevision = { readonly sessions?: readonly SesionDeLaRevision[]; readonly microcycles?: readonly { readonly sessions: readonly SesionDeLaRevision[] }[] };

/**
 * DL-197 (ET1-D10, ET1-D11): la intensidad del plan que heredan los ejercicios sin criterio propio (`null`, ninguna) y los
 * que no la llevan por excepción («Sin criterio de intensidad», en `planning.withoutIntensity`).
 */
export interface HerenciaDeLaIntensidad {
  readonly criterio: 'RIR' | 'PERCENT_RM' | null;
  readonly sinIntensidad: readonly string[];
}

/**
 * Entrenamiento: cada ejercicio sin series y cada serie sin repeticiones fijadas, en el orden de la estructura. Con la
 * intensidad del plan (DL-197), también cada ejercicio que la hereda sin objetivo todavía.
 */
export function loQueQuedaSinCompletarEnEntrenamiento(bloques: readonly BloqueDeLaRevision[], herencia: HerenciaDeLaIntensidad | null = null): Lugar[] {
  const sinIntensidad = new Set(herencia?.sinIntensidad ?? []);
  const r: Lugar[] = [];
  const sesion = (s: SesionDeLaRevision, ruta: string) => {
    const vueltas = new Set(seriesQueNoSonLasVueltas(s).map((x) => x.posicion));
    s.prescriptions.forEach((p, l) => {
      const rp = `${ruta}.prescriptions[${l}]`;
      if (p.sets.length === 0) return void r.push({ code: INCOMPLETO.sinSeries, path: rp });
      p.sets.forEach((x, n) => {
        if (x.repetitions === null || x.repetitions === undefined) r.push({ code: INCOMPLETO.sinRepeticiones, path: `${rp}.sets[${n}].repetitions` });
      });
      if (vueltas.has(l)) r.push({ code: INCOMPLETO.seriesYVueltas, path: rp });
      if (herencia?.criterio && (p.intensity ?? null) === null && !(p.prescriptionId && sinIntensidad.has(p.prescriptionId))) r.push({ code: INCOMPLETO.sinIntensidad, path: rp });
    });
  };
  bloques.forEach((b, i) => {
    (b.sessions ?? []).forEach((s, k) => sesion(s, `blocks[${i}].sessions[${k}]`));
    (b.microcycles ?? []).forEach((m, j) => m.sessions.forEach((s, k) => sesion(s, `blocks[${i}].microcycles[${j}].sessions[${k}]`)));
  });
  return r;
}
