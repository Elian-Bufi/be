/**
 * ED-02 y ED-65 · Salir con cambios sin guardar (WP-EDITORES-PROFESIONAL; ED-D10, decidida y reescrita).
 *
 * Antes, recargar o cerrar la pestaña avisaba (`beforeunload`), pero un enlace interno no: si el profesional escribía y en
 * menos de los 4 s de la pausa del autoguardado iba a «Mis recetas», lo escrito se perdía sin aviso. El editor de recetas
 * y las plantillas no tenían ninguna guardia. Ahora, con un enlace interno (la barra, las pestañas de la ficha y del área,
 * «Volver a la ficha»):
 * - **sin cambios,** se sale;
 * - **si todo lo que hay se puede guardar** (un borrador que se guarda solo, sin nada a medio escribir ni un conflicto),
 *   aparece «Guardando antes de salir…» y se sale con la respuesta del servidor;
 * - **si algo no se puede guardar, falla o hay un conflicto,** el cuadro «Tenés cambios sin guardar», con «Seguir
 *   editando» (el principal) y «Salir sin guardar». Una receta nunca se guarda sola: guardarla crea una versión.
 *
 * Nunca se pierde nada en silencio, y nada se guarda en el navegador (DL-148 D-5). «Atrás» del navegador queda como un
 * límite declarado.
 *
 * Sin React ni red: la regla y los textos. El cuadro y la guardia de los enlaces están en `components/salida-segura.tsx`.
 */

/** Lo que tiene sin guardar un editor abierto. */
export interface CambiosParaSalir {
  /** Qué es, para decirlo: «el plan en preparación», «la receta». */
  readonly que: string;
  /** Se puede guardar ya, sin preguntar: un borrador con autoguardado, sin nada a medio escribir ni un conflicto. */
  readonly sePuedeGuardar: boolean;
}

export type QueHacerAlSalir =
  | { readonly tipo: 'SALIR' }
  | { readonly tipo: 'GUARDAR_Y_SALIR' }
  | { readonly tipo: 'PREGUNTAR'; readonly que: readonly string[] };

/** Qué pasa al tocar un enlace interno con estos editores abiertos (solo los que tienen cambios). */
export function queHacerAlSalir(cambios: readonly CambiosParaSalir[]): QueHacerAlSalir {
  if (cambios.length === 0) return { tipo: 'SALIR' };
  if (cambios.every((c) => c.sePuedeGuardar)) return { tipo: 'GUARDAR_Y_SALIR' };
  return { tipo: 'PREGUNTAR', que: [...new Set(cambios.map((c) => c.que))] };
}

const enumerar = (nombres: readonly string[]): string => (nombres.length <= 1 ? (nombres[0] ?? '') : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`);

export const COPY_SALIDA_SEGURA = {
  guardandoAntesDeSalir: 'Guardando antes de salir…',
  titulo: 'Tenés cambios sin guardar',
  queSePierde: (que: readonly string[]): string => `Si salís ahora, se pierde lo que escribiste en ${enumerar(que)} y todavía no se guardó.`,
  noSeGuardo: 'No pudimos guardarlo antes de salir: sigue acá, sin guardar.',
  seguirEditando: 'Seguir editando',
  salirSinGuardar: 'Salir sin guardar',
} as const;

/** Cuánto se espera, como mucho, a que termine un guardado que ya estaba viajando antes de mandar el de la salida. */
export const ESPERA_DE_UN_GUARDADO_EN_VIAJE_MS = 15_000;
