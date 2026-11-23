/**
 * RP-24 (RP-D92, WP-RECORRIDO-PLAN-PULIDO; DL-191) · La imagen de la receta en el editor del plan. Dirección preguntó si
 * la imagen de una receta se carga «aquí», en el plan: ahora la opción que es una receta muestra su miniatura en la
 * cabecera y, abierta, deja cargarla o cambiarla con el mismo recuadro de Mis recetas y del cajón.
 *
 * No se pide un acceso por miniatura: el límite es de 120 lecturas por minuto. Se lee la lista propia (API-REC-02), que ya
 * trae las rutas firmadas de cada imagen en lote (`rutasDeLaListaPropia`), una sola vez por pantalla y solo si el plan
 * tiene alguna opción de receta. Una receta que no está en la lista propia (no debería: las del Recetario entran como
 * copia) muestra el plato de respaldo y no ofrece cargar.
 * Sin React lo que se prueba (`recetasDelPlan`, `porReceta`); el gancho, abajo.
 */
import type { Receta } from '@be/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Resultado } from '../../../../lib/api';
import { PAGINAS_DE_RECETAS, RECETAS_POR_PAGINA } from './recetas-para-elegir';

/** Las recetas (por `recipeId`) que citan las opciones del plan, según lo que ya se sabe de cada versión citada. */
export function recetasDelPlan(
  dias: readonly { readonly meals: readonly { readonly options: readonly { readonly recipeVersionId?: string | null | undefined }[] }[] }[],
  citadas: Readonly<Record<string, { readonly recipeId: string }>>,
): string[] {
  const ids = new Set<string>();
  for (const d of dias) for (const m of d.meals) for (const o of m.options) if (o.recipeVersionId && citadas[o.recipeVersionId]) ids.add(citadas[o.recipeVersionId]!.recipeId);
  return [...ids];
}

/** La lista leída, por `recipeId`. Una receta actualizada (su imagen) reemplaza a la leída. */
export function porReceta(recetas: readonly Receta[], actualizadas: ReadonlyMap<string, Receta> = new Map()): Map<string, Receta> {
  const m = new Map(recetas.map((r) => [r.recipeId, r] as const));
  for (const [id, r] of actualizadas) m.set(id, r);
  return m;
}

/**
 * RP-25: lo que muestra la miniatura de la cabecera. Con las rutas firmadas de la lista, esas (ningún pedido). Una imagen
 * recién cargada o cambiada en esta pantalla (en el cuerpo de la opción o al guardar una opción como receta) no trae
 * rutas: API-REC-05 no las firma. Esa sola se pide por su medio (API-MED-03), una vez: es un pedido por cada imagen que se
 * carga, no por miniatura. Sin imagen, o leída sin rutas, el plato de respaldo.
 */
export function imagenDeLaCabecera(
  receta: Pick<Receta, 'image'> | null,
  cambiadaAca: boolean,
): { readonly medioId: string; readonly rutas: NonNullable<Receta['image']>['paths'] | null } | null {
  const imagen = receta?.image;
  if (!imagen) return null;
  if (imagen.paths) return { medioId: imagen.mediaId, rutas: imagen.paths };
  return cambiadaAca ? { medioId: imagen.mediaId, rutas: null } : null;
}

export type ImagenesDeLasRecetas = {
  /** La receta de la lista propia, con su imagen y sus rutas firmadas; `null` si no se leyó o no está. */
  readonly de: (recipeId: string) => Receta | null;
  /** Lo que devolvió el recuadro de la imagen al cargarla, cambiarla o retirarla. */
  readonly actualizar: (r: Receta) => void;
  /** RP-25: si la receta se actualizó en esta pantalla (su imagen se cargó o cambió acá, o se acaba de crear). */
  readonly cambiadaAca: (recipeId: string) => boolean;
};

/**
 * Lee la lista propia una vez, si `hayRecetas`. Las rutas firmadas duran 15 minutos: si la pantalla queda abierta más,
 * la miniatura cae al plato de respaldo (no se vuelve a pedir sola, para no gastar lecturas); se relee al volver a abrir
 * el editor.
 */
export function useImagenesDeLasRecetas(token: string, sesionPerdida: (r: Resultado<unknown>) => boolean, hayRecetas: boolean): ImagenesDeLasRecetas {
  const [leidas, setLeidas] = useState<readonly Receta[]>([]);
  const [actualizadas, setActualizadas] = useState<ReadonlyMap<string, Receta>>(() => new Map());
  const pedida = useRef(false);
  useEffect(() => {
    if (!hayRecetas || pedida.current) return;
    pedida.current = true;
    let vigente = true;
    void (async () => {
      const todas: Receta[] = [];
      let cursor: string | undefined;
      for (let pagina = 0; pagina < PAGINAS_DE_RECETAS; pagina++) {
        const r = await api.listarRecetas(token, { limit: String(RECETAS_POR_PAGINA), ...(cursor ? { cursor } : {}) });
        if (sesionPerdida(r) || !r.ok) break;
        todas.push(...r.datos.data);
        cursor = r.datos.page.hasMore ? (r.datos.page.nextCursor ?? undefined) : undefined;
        if (!cursor) break;
      }
      if (vigente) setLeidas(todas);
    })();
    return () => {
      vigente = false;
      pedida.current = false;
    };
  }, [hayRecetas, token, sesionPerdida]);
  const mapa = porReceta(leidas, actualizadas);
  const de = (recipeId: string) => mapa.get(recipeId) ?? null;
  const actualizar = useCallback((r: Receta) => setActualizadas((m) => new Map(m).set(r.recipeId, r)), []);
  const cambiadaAca = (recipeId: string) => actualizadas.has(recipeId);
  return { de, actualizar, cambiadaAca };
}
