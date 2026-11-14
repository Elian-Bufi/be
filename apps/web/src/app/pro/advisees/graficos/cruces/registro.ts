/**
 * Los gráficos de los cruces (rama D: GR-24, SP-01 y SP-02), para el registro común (`registros.ts`). Lo edita solo esa
 * rama.
 *
 * - **GR-24** se ofrece con un área con plan propio (las etapas son las versiones de ese plan).
 * - **SP-01 y SP-02** se ofrecen solo en el caso 1 (`caso-de-acceso.ts`): las dos áreas permitidas y con planes o tomas
 *   propios en las dos. SP-01 pide además un ejercicio de la lista de la v1 con sesiones en el período; SP-02, tomas de
 *   peso. Si no, no aparecen: ni en gris ni con candado.
 *
 * Los componentes se cargan a pedido (`React.lazy`, con su propio `Suspense`): así este registro sigue siendo un módulo
 * `.ts`, sin JSX ni `.tsx` importados, que las pruebas cargan sin el empaquetador (GR-T57).
 */
import { entraEnLaEstimacion, graficoSugerido } from '@be/domain';
import React, { type ComponentType } from 'react';
import type { ContextoDelRegistro, GraficoRegistrado, PropsDelGrafico } from '../registro-de-graficos';
import { cruceOfrecido, dosEtapasOfrecida } from './caso-de-acceso';
import { COPY_DE_LOS_CRUCES } from './copy';

/** El alto que guarda un gráfico mientras se carga su código: el de `ALTO_MIENTRAS_CARGA` (`estado-del-grafico.tsx`). */
const ALTO_MIENTRAS_SE_CARGA = 160;

/** Un gráfico que se carga cuando se dibuja por primera vez, con su lugar guardado mientras tanto. */
function aPedido(cargar: () => Promise<{ default: ComponentType<PropsDelGrafico> }>): ComponentType<PropsDelGrafico> {
  const Perezoso = React.lazy(cargar);
  function GraficoAPedido(props: PropsDelGrafico) {
    return React.createElement(
      React.Suspense,
      { fallback: React.createElement('div', { className: 'grafico-base__cargando', style: { minHeight: ALTO_MIENTRAS_SE_CARGA } }) },
      React.createElement(Perezoso, props),
    );
  }
  return GraficoAPedido;
}

/** Si el ejercicio de una clave del período (`e:<id>`) está en la lista de la v1 del 1RM estimado. */
const deLaListaV1 = (exerciseKey: string): boolean => exerciseKey.startsWith('e:') && entraEnLaEstimacion(exerciseKey.slice(2));

const requisitos = (id: string): GraficoRegistrado['requiere'] => graficoSugerido(id)?.requiere ?? { ejercicio: false, listaV1: false, medida: false };

export const GRAFICOS_DE_CRUCES: readonly GraficoRegistrado[] = [
  {
    id: 'cruce.dos-etapas',
    codigo: 'GR-24',
    area: 'CRUCE',
    titulo: COPY_DE_LOS_CRUCES.dosEtapas.titulo,
    ubicacion: 'COMPARACION',
    series: [],
    // Con un ejercicio compara su 1RM estimado o su carga; sin ejercicio, las calorías registradas (GR-T56).
    requiere: { ejercicio: false, listaV1: false, medida: false },
    ofrecido: (c: ContextoDelRegistro) => dosEtapasOfrecida(c.acceso),
    Grafico: aPedido(() => import('./dos-etapas-en-pantalla')),
  },
  {
    id: 'cruce.carbohidratos-y-fuerza',
    codigo: 'SP-01',
    area: 'CRUCE',
    titulo: COPY_DE_LOS_CRUCES.carbohidratosYFuerza.titulo,
    ubicacion: 'RELACION',
    series: ['nutricion.carbohidratos', 'nutricion.energia', 'entrenamiento.1rm-estimado'],
    requiere: requisitos('cruce.carbohidratos-y-fuerza'),
    ofrecido: (c: ContextoDelRegistro) => cruceOfrecido('SP-01', c.acceso) && (c.ejercicios ?? []).some((e) => deLaListaV1(e.exerciseKey)),
    Grafico: aPedido(() => import('./carbohidratos-y-fuerza-en-pantalla')),
  },
  {
    id: 'cruce.energia-y-peso',
    codigo: 'SP-02',
    area: 'CRUCE',
    titulo: COPY_DE_LOS_CRUCES.energiaYPeso.titulo,
    ubicacion: 'RELACION',
    series: ['nutricion.energia', 'antropometria.peso'],
    requiere: requisitos('cruce.energia-y-peso'),
    ofrecido: (c: ContextoDelRegistro) => cruceOfrecido('SP-02', c.acceso) && (c.medidas ?? []).includes('peso'),
    Grafico: aPedido(() => import('./energia-y-peso-en-pantalla')),
  },
];
