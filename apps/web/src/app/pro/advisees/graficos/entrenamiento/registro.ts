/**
 * Los gráficos de Entrenamiento (rama B: GR-02, GR-03, GR-05 y GR-06), para el registro común (`registros.ts`). Lo edita solo esa rama.
 *
 * - Se ofrecen con el alcance de Entrenamiento y sesiones registradas del período (caso 1: las lecturas ya traen solo lo
 *   de los planes de quien mira). GR-02, además, solo si hay un ejercicio de la lista de la v1 (RM-16). Un área sin
 *   acceso no los ofrece: no aparecen, ni en gris ni con candado.
 * - Cada gráfico se carga recién cuando se dibuja (`lazy`, con su espera): quien solo pregunta qué se ofrece no carga los
 *   gráficos. Por eso este archivo no tiene JSX: lo importan las pruebas (`graficos-*.test.mjs`) sin compilar nada.
 */
import { entraEnLaEstimacion, graficoSugerido, type IdDeGrafico } from '@be/domain';
import { createElement, lazy, Suspense, type ComponentType } from 'react';
import { COPY_DE_LOS_GRAFICOS } from '../copy';
import type { ContextoDelRegistro, GraficoRegistrado, PropsDelGrafico } from '../registro-de-graficos';
import { PREGUNTAS_DE_ENTRENAMIENTO as P } from './copy';
import { ejercicioDeLaClave } from './fuerza-estimada';

/** Un gráfico que se carga al dibujarse, con «Cargando el gráfico…» mientras tanto. */
function diferido(cargar: () => Promise<ComponentType<PropsDelGrafico>>): ComponentType<PropsDelGrafico> {
  const Diferido = lazy(async () => ({ default: await cargar() }));
  function GraficoDiferido(props: PropsDelGrafico) {
    return createElement(Suspense, { fallback: createElement('p', { className: 'cargando', role: 'status' }, COPY_DE_LOS_GRAFICOS.cargando) }, createElement(Diferido, props));
  }
  return GraficoDiferido;
}

/** Con el alcance de Entrenamiento y algún ejercicio con sesiones registradas en el período. */
export const conEntrenamiento = (c: ContextoDelRegistro): boolean => c.acceso.alcances.includes('ENTRENAMIENTO') && (c.ejercicios ?? []).some((e) => e.sessions > 0);

/** Lo anterior y, además, algún ejercicio de la lista de la v1 con sesiones: el 1RM estimado solo existe para ellos. */
export const conUnoDeLaLista = (c: ContextoDelRegistro): boolean =>
  conEntrenamiento(c) &&
  (c.ejercicios ?? []).some((e) => {
    const id = ejercicioDeLaClave(e.exerciseKey);
    return e.sessions > 0 && id !== null && entraEnLaEstimacion(id);
  });

function registrado(id: IdDeGrafico, titulo: string, ofrecido: (c: ContextoDelRegistro) => boolean, Grafico: ComponentType<PropsDelGrafico>): GraficoRegistrado {
  const s = graficoSugerido(id);
  if (!s) throw new Error(`El gráfico ${id} no está entre los sugeridos (graficos-sugeridos.ts)`);
  return { id, codigo: s.codigo, area: s.area, titulo, ubicacion: s.ubicacion, series: s.series, requiere: s.requiere, ofrecido, Grafico };
}

export const GRAFICOS_DE_ENTRENAMIENTO: readonly GraficoRegistrado[] = [
  registrado(
    'entrenamiento.fuerza-estimada',
    P.fuerzaEstimada,
    conUnoDeLaLista,
    diferido(() => import('./fuerza-estimada-en-pantalla').then((m) => m.FuerzaEstimada)),
  ),
  registrado(
    'entrenamiento.carga-repeticiones-y-rir',
    P.cargaRepeticionesYRir,
    conEntrenamiento,
    diferido(() => import('./carga-repeticiones-y-rir-en-pantalla').then((m) => m.CargaRepeticionesYRir)),
  ),
  registrado(
    'entrenamiento.rir-indicado-y-registrado',
    P.rirIndicadoYRegistrado,
    conEntrenamiento,
    diferido(() => import('./rir-indicado-y-registrado-en-pantalla').then((m) => m.RirIndicadoYRegistrado)),
  ),
  registrado(
    'entrenamiento.perfil-carga-repeticiones',
    P.perfilCargaRepeticiones,
    conEntrenamiento,
    diferido(() => import('./perfil-carga-repeticiones-en-pantalla').then((m) => m.PerfilCargaRepeticiones)),
  ),
];
