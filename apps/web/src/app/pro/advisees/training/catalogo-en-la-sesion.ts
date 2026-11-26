/**
 * DL-199 (WP-EDITOR-ENTRENAMIENTO-TANDA-3, ET3-24 y ET3-25; BAJA de la tanda 1) · el catálogo entero de ejercicios,
 * **leído una vez por sesión** y no cada vez que se abre «Agregar ejercicios» o el «Catálogo de BE». Sin React ni la API
 * (la página se lee con la función que se pasa), para probarlo solo (`editor-de-entrenamiento-tanda-3-a.test.mjs`).
 * - Vive en la memoria de la pestaña, por sesión (la clave es el token, que no se guarda en ningún lado) y por
 *   `VIGENCIA_MS`: lo que cargó otro profesional o una curaduría nueva llega a los diez minutos, o al recargar (ET3-D24).
 * - Dos lecturas al mismo tiempo (el cuadro abierto mientras se mira el catálogo) comparten el mismo pedido.
 * - Crear o importar un propio lo **invalida**: la próxima vez se vuelve a leer, con el nuevo.
 * - Si la lectura **corta a mitad** (una página que falla o el tope de páginas), se devuelve lo leído con `completo:
 *   false`, para decirlo con «Reintentar», y no se guarda: la próxima vez se vuelve a pedir entero (ET3-D25).
 */

export const VIGENCIA_MS = 10 * 60 * 1000;
export const TOPE_DE_PAGINAS = 40;

export type PaginaLeida<E> = { readonly ok: true; readonly data: readonly E[]; readonly hasMore: boolean; readonly nextCursor: string | null } | { readonly ok: false; readonly motivo: string; readonly sesionPerdida?: boolean };

export type CatalogoLeido<E> =
  | { readonly tipo: 'lista'; readonly ejercicios: readonly E[]; readonly completo: boolean; readonly motivo: string | null }
  | { readonly tipo: 'falla'; readonly motivo: string }
  | { readonly tipo: 'sesion-perdida' };

interface Guardado<E> {
  readonly momento: number;
  readonly lectura: Promise<CatalogoLeido<E>>;
}

const guardados = new Map<string, Guardado<unknown>>();

/** Lee el catálogo entero de esta sesión: el guardado si está vigente, o página por página. */
export function catalogoDeLaSesion<E>(clave: string, leerPagina: (cursor: string | null) => Promise<PaginaLeida<E>>, ordenar: (e: readonly E[]) => readonly E[], ahora: number = Date.now()): Promise<CatalogoLeido<E>> {
  const previo = guardados.get(clave) as Guardado<E> | undefined;
  if (previo && ahora - previo.momento < VIGENCIA_MS) return previo.lectura;
  const lectura = leerEntero(leerPagina, ordenar).then((r) => {
    // Lo que no está entero no se guarda: la próxima vez se pide otra vez.
    if (r.tipo !== 'lista' || !r.completo) {
      if (guardados.get(clave)?.lectura === lectura) guardados.delete(clave);
    }
    return r;
  });
  guardados.set(clave, { momento: ahora, lectura });
  return lectura;
}

async function leerEntero<E>(leerPagina: (cursor: string | null) => Promise<PaginaLeida<E>>, ordenar: (e: readonly E[]) => readonly E[]): Promise<CatalogoLeido<E>> {
  const leidos: E[] = [];
  let cursor: string | null = null;
  for (let vuelta = 0; vuelta < TOPE_DE_PAGINAS; vuelta += 1) {
    const r: PaginaLeida<E> = await leerPagina(cursor);
    if (!r.ok) {
      if (r.sesionPerdida) return { tipo: 'sesion-perdida' };
      return leidos.length === 0 ? { tipo: 'falla', motivo: r.motivo } : { tipo: 'lista', ejercicios: ordenar(leidos), completo: false, motivo: r.motivo };
    }
    leidos.push(...r.data);
    if (!r.hasMore || !r.nextCursor) return { tipo: 'lista', ejercicios: ordenar(leidos), completo: true, motivo: null };
    cursor = r.nextCursor;
  }
  return { tipo: 'lista', ejercicios: ordenar(leidos), completo: false, motivo: null };
}

/** Después de crear o importar un ejercicio propio: la próxima lectura va a la API. Sin clave, todas. */
export function invalidarElCatalogo(clave?: string): void {
  if (clave === undefined) guardados.clear();
  else guardados.delete(clave);
}

export const COPY_CATALOGO_EN_LA_SESION = {
  incompleto: (n: number) => `Se cargaron ${n} ejercicios; faltan otros.`,
  reintentar: 'Reintentar',
} as const;
