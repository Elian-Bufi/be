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

/** El código de cada cosa sin completar: no es un problema de la API, y no impide guardar ni activar. */
export const INCOMPLETO = {
  sinCantidad: 'INCOMPLETO_SIN_CANTIDAD',
  sinRepeticiones: 'INCOMPLETO_SIN_REPETICIONES',
  sinSeries: 'INCOMPLETO_SIN_SERIES',
} as const;

/** Lo que dice cada una en la lista, después de su lugar: qué falta y, si cambia algo para la persona, qué ve. */
export const TEXTO_DE_LO_INCOMPLETO: Readonly<Record<string, string>> = {
  [INCOMPLETO.sinCantidad]: 'sin cantidad: en la app dice «Sin dato»',
  [INCOMPLETO.sinRepeticiones]: 'sin repeticiones fijadas',
  [INCOMPLETO.sinSeries]: 'sin series',
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

type SesionDeLaRevision = { readonly prescriptions: readonly { readonly sets: readonly { readonly repetitions: unknown }[] }[] };
type BloqueDeLaRevision = { readonly sessions?: readonly SesionDeLaRevision[]; readonly microcycles?: readonly { readonly sessions: readonly SesionDeLaRevision[] }[] };

/** Entrenamiento: cada ejercicio sin series y cada serie sin repeticiones fijadas, en el orden de la estructura. */
export function loQueQuedaSinCompletarEnEntrenamiento(bloques: readonly BloqueDeLaRevision[]): Lugar[] {
  const r: Lugar[] = [];
  const sesion = (s: SesionDeLaRevision, ruta: string) =>
    s.prescriptions.forEach((p, l) => {
      const rp = `${ruta}.prescriptions[${l}]`;
      if (p.sets.length === 0) return void r.push({ code: INCOMPLETO.sinSeries, path: rp });
      p.sets.forEach((x, n) => {
        if (x.repetitions === null || x.repetitions === undefined) r.push({ code: INCOMPLETO.sinRepeticiones, path: `${rp}.sets[${n}].repetitions` });
      });
    });
  bloques.forEach((b, i) => {
    (b.sessions ?? []).forEach((s, k) => sesion(s, `blocks[${i}].sessions[${k}]`));
    (b.microcycles ?? []).forEach((m, j) => m.sessions.forEach((s, k) => sesion(s, `blocks[${i}].microcycles[${j}].sessions[${k}]`)));
  });
  return r;
}
