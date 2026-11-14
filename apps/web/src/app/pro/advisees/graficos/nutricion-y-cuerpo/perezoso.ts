/**
 * Un gráfico del registro que se carga cuando se dibuja (WP-GRAFICOS fase 2, rama C; DL-174; GR-T49). El registro se lee
 * en las pruebas y en «Agregar un gráfico» sin cargar ninguna pantalla: cada gráfico trae su código recién al dibujarse,
 * como «Analizar» con la biblioteca de gráficos. Mientras llega, guarda el alto de «cargando» para no mover la página.
 *
 * Sin JSX a propósito: este archivo lo importan los registros, que las pruebas cargan con Node.
 */
import { createElement, lazy, Suspense, type ComponentType, type FunctionComponent } from 'react';
import type { PropsDelGrafico } from '../registro-de-graficos';

/** El mismo alto que guarda un gráfico mientras carga (`ALTO_MIENTRAS_CARGA` de `estado-del-grafico.tsx`). */
const ALTO_MIENTRAS_LLEGA = 160;

export function graficoPerezoso(cargar: () => Promise<FunctionComponent<PropsDelGrafico>>): ComponentType<PropsDelGrafico> {
  const Perezoso = lazy(async () => ({ default: await cargar() }));
  function GraficoQueSeCargaAlDibujarse(props: PropsDelGrafico) {
    return createElement(Suspense, { fallback: createElement('div', { className: 'grafico-base__cargando', style: { minHeight: ALTO_MIENTRAS_LLEGA }, 'aria-busy': true }) }, createElement(Perezoso, props));
  }
  return GraficoQueSeCargaAlDibujarse;
}
