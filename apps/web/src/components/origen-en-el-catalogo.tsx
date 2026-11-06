'use client';

/**
 * DL-141 D-6 · el origen de un ítem del catálogo en la fila del buscador, donde el profesional lo elige («USDA»,
 * «wger · CC BY-SA 4.0», «Demostración», «Cargado por vos»). Encargo de Dirección del 2026-10-19, bloque 4: «origen
 * breve en la fila y detalle accesible, sin saturar la lista».
 * - **Breve, a la vista,** en el tono de la nota de la fila. Una equivalencia aproximada también se ve sin pasar el mouse.
 * - **El detalle va en la pista** (`pista.tsx`): con el mouse, con el teclado (el origen es un enlace, así que se llega
 *   con Tab) y con el lector de pantalla, que lo lee como descripción del enlace.
 * - **El enlace abre «Fuentes del catálogo» en otra pestaña,** en la sección que lo explica: el plan, la receta o el
 *   registro que se está editando quedan como estaban. Es una página pública: no necesita la sesión.
 * - Lo cargado a mano no tiene una fuente que citar: va como texto, sin enlace ni pista.
 * Los textos salen del dominio (`copy-origen-en-el-catalogo.ts`).
 */
import { COPY_ORIGEN_EN_EL_CATALOGO, origenEnElCatalogo, type ItemConOrigen } from '@be/domain';
import Link from 'next/link';
import { dia } from '../lib/formato';
import { Pista } from './pista';

export function OrigenEnElCatalogo({ item }: { item: ItemConOrigen }) {
  const origen = origenEnElCatalogo(item, dia);
  if (origen.seccion === null) return <span className="origen-en-el-catalogo">{origen.breve}</span>;
  return (
    <Pista texto={origen.detalle}>
      <Link
        className="origen-en-el-catalogo origen-en-el-catalogo--enlace"
        href={`/legal/fuentes#${origen.seccion}`}
        target="_blank"
        rel="noopener"
        aria-label={`${origen.breve}. ${COPY_ORIGEN_EN_EL_CATALOGO.enlace}`}
        data-origen={origen.seccion}
      >
        {origen.breve}
      </Link>
    </Pista>
  );
}
